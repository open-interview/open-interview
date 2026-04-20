#!/usr/bin/env tsx
/**
 * Export PostgreSQL tables to compressed NDJSON files.
 * Large tables (>50MB estimated) are split into chunks.
 *
 * Usage:
 *   DATABASE_URL=... tsx scripts/export-db-to-files.ts [--output-dir ./data/export]
 *
 * Output structure:
 *   <output-dir>/
 *     manifest.json          - chunk index + metadata
 *     questions.part0.ndjson.gz
 *     questions.part1.ndjson.gz
 *     ...
 *     work_queue.ndjson.gz
 *     ...
 */

import "dotenv/config";
import pg from "pg";
import fs from "fs";
import path from "path";
import zlib from "zlib";
import { pipeline } from "stream/promises";
import { Readable } from "stream";

// ── Config ────────────────────────────────────────────────────────────────────

const OUTPUT_DIR = process.argv.includes("--output-dir")
  ? process.argv[process.argv.indexOf("--output-dir") + 1]
  : path.resolve(process.cwd(), "data/export");

const CHUNK_ROWS = 50_000; // rows per chunk for large tables

// Tables in FK-safe insertion order (same as migrate script)
const TABLE_ORDER = [
  "users",
  "questions",
  "certifications",
  "voice_sessions",
  "work_queue",
  "bot_ledger",
  "bot_runs",
  "question_history",
  "user_sessions",
  "learning_paths",
  "coding_challenges",
  "blog_posts",
  "flashcards",
  "tests",
  "channel_mappings",
  "question_relationships",
  "blog_authors",
  "blog_categories",
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function log(msg: string) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

async function countRows(client: pg.PoolClient, table: string): Promise<number> {
  const res = await client.query(`SELECT COUNT(*) FROM "${table}"`);
  return parseInt(res.rows[0].count, 10);
}

async function tableExists(client: pg.PoolClient, table: string): Promise<boolean> {
  const res = await client.query(
    `SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=$1`,
    [table]
  );
  return res.rowCount! > 0;
}

async function writeChunk(
  rows: Record<string, unknown>[],
  filePath: string
): Promise<void> {
  const ndjson = rows.map((r) => JSON.stringify(r)).join("\n") + "\n";
  const readable = Readable.from([ndjson]);
  const gzip = zlib.createGzip({ level: 6 });
  const out = fs.createWriteStream(filePath);
  await pipeline(readable, gzip, out);
}

// ── Main ──────────────────────────────────────────────────────────────────────

interface ChunkMeta {
  file: string;
  rows: number;
  offset: number;
}

interface TableMeta {
  table: string;
  totalRows: number;
  chunks: ChunkMeta[];
  exportedAt: string;
}

interface Manifest {
  exportedAt: string;
  outputDir: string;
  tables: TableMeta[];
}

// Load existing manifest for resumability
function loadManifest(manifestPath: string): Manifest | null {
  if (fs.existsSync(manifestPath)) {
    try {
      return JSON.parse(fs.readFileSync(manifestPath, "utf8")) as Manifest;
    } catch {
      return null;
    }
  }
  return null;
}

async function exportTable(
  client: pg.PoolClient,
  table: string,
  totalRows: number,
  existingMeta: TableMeta | undefined
): Promise<TableMeta> {
  const meta: TableMeta = {
    table,
    totalRows,
    chunks: [],
    exportedAt: new Date().toISOString(),
  };

  // Find already-exported chunks to resume
  const doneOffsets = new Set(existingMeta?.chunks.map((c) => c.offset) ?? []);

  let offset = 0;
  let chunkIndex = 0;

  while (offset < totalRows) {
    const fileName = totalRows <= CHUNK_ROWS
      ? `${table}.ndjson.gz`
      : `${table}.part${chunkIndex}.ndjson.gz`;
    const filePath = path.join(OUTPUT_DIR, fileName);

    if (doneOffsets.has(offset) && fs.existsSync(filePath)) {
      // Resume: skip already-written chunk
      const existing = existingMeta!.chunks.find((c) => c.offset === offset)!;
      meta.chunks.push(existing);
      log(`  ${table}: chunk ${chunkIndex} already done (${existing.rows} rows), skipping`);
      offset += existing.rows;
      chunkIndex++;
      continue;
    }

    const res = await client.query(
      `SELECT * FROM "${table}" ORDER BY 1 LIMIT $1 OFFSET $2`,
      [CHUNK_ROWS, offset]
    );
    const rows = res.rows;
    if (rows.length === 0) break;

    await writeChunk(rows, filePath);

    meta.chunks.push({ file: fileName, rows: rows.length, offset });
    log(`  ${table}: wrote ${fileName} (${rows.length} rows, offset ${offset})`);

    offset += rows.length;
    chunkIndex++;
  }

  return meta;
}

async function main() {
  if (!process.env.DATABASE_URL && !process.env.PGHOST) {
    console.error("ERROR: DATABASE_URL or PG* env vars required");
    process.exit(1);
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const manifestPath = path.join(OUTPUT_DIR, "manifest.json");
  const existing = loadManifest(manifestPath);

  if (existing) {
    log(`Resuming export from existing manifest (${existing.tables.length} tables previously started)`);
  }

  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    host: process.env.PGHOST,
    port: process.env.PGPORT ? parseInt(process.env.PGPORT) : undefined,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
  });

  const client = await pool.connect();
  log(`Connected to PostgreSQL. Output: ${OUTPUT_DIR}`);

  const manifest: Manifest = {
    exportedAt: new Date().toISOString(),
    outputDir: OUTPUT_DIR,
    tables: [],
  };

  try {
    for (const table of TABLE_ORDER) {
      if (!(await tableExists(client, table))) {
        log(`${table}: not found in DB, skipping`);
        continue;
      }

      const totalRows = await countRows(client, table);
      log(`${table}: ${totalRows} rows`);

      if (totalRows === 0) {
        manifest.tables.push({ table, totalRows: 0, chunks: [], exportedAt: new Date().toISOString() });
        continue;
      }

      const existingMeta = existing?.tables.find((t) => t.table === table);
      const tableMeta = await exportTable(client, table, totalRows, existingMeta);
      manifest.tables.push(tableMeta);

      // Save manifest after each table for resumability
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    }

    log(`\nExport complete. Manifest: ${manifestPath}`);
    log(`Tables: ${manifest.tables.length}, Total chunks: ${manifest.tables.reduce((s, t) => s + t.chunks.length, 0)}`);
  } catch (err) {
    console.error("Export failed:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
