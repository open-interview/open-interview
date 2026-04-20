#!/usr/bin/env tsx
/**
 * Import exported NDJSON chunks back into a local PostgreSQL database.
 *
 * Usage:
 *   DATABASE_URL=... tsx scripts/import-files-to-db.ts [--input-dir ./data/export]
 *
 * Features:
 *   - Reads manifest.json to discover chunks in FK-safe order
 *   - Skips tables/chunks already imported (resumable via progress file)
 *   - Disables FK checks during import, re-enables after
 *   - Batch upserts with ON CONFLICT DO NOTHING
 */

import "dotenv/config";
import pg from "pg";
import fs from "fs";
import path from "path";
import zlib from "zlib";
import readline from "readline";

// ── Config ────────────────────────────────────────────────────────────────────

const INPUT_DIR = process.argv.includes("--input-dir")
  ? process.argv[process.argv.indexOf("--input-dir") + 1]
  : path.resolve(process.cwd(), "data/export");

const BATCH_SIZE = 500; // rows per INSERT batch

// ── Helpers ───────────────────────────────────────────────────────────────────

function log(msg: string) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

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

interface Progress {
  completedChunks: string[]; // "<table>/<file>"
}

function loadProgress(progressPath: string): Progress {
  if (fs.existsSync(progressPath)) {
    try {
      return JSON.parse(fs.readFileSync(progressPath, "utf8")) as Progress;
    } catch {
      /* ignore */
    }
  }
  return { completedChunks: [] };
}

function saveProgress(progressPath: string, progress: Progress) {
  fs.writeFileSync(progressPath, JSON.stringify(progress, null, 2));
}

async function readNdjsonGz(filePath: string): Promise<Record<string, unknown>[]> {
  const rows: Record<string, unknown>[] = [];
  const fileStream = fs.createReadStream(filePath);
  const gunzip = zlib.createGunzip();
  const rl = readline.createInterface({ input: fileStream.pipe(gunzip), crlfDelay: Infinity });

  for await (const line of rl) {
    if (line.trim()) rows.push(JSON.parse(line));
  }
  return rows;
}

async function insertBatch(
  client: pg.PoolClient,
  table: string,
  rows: Record<string, unknown>[]
): Promise<void> {
  if (rows.length === 0) return;

  const columns = Object.keys(rows[0]);
  const colList = columns.map((c) => `"${c}"`).join(", ");

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const values: unknown[] = [];
    const rowPlaceholders = batch.map((row, ri) => {
      const placeholders = columns.map((col, ci) => {
        values.push(row[col] ?? null);
        return `$${ri * columns.length + ci + 1}`;
      });
      return `(${placeholders.join(", ")})`;
    });

    const sql = `INSERT INTO "${table}" (${colList}) VALUES ${rowPlaceholders.join(", ")} ON CONFLICT DO NOTHING`;
    await client.query(sql, values);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const manifestPath = path.join(INPUT_DIR, "manifest.json");
  if (!fs.existsSync(manifestPath)) {
    console.error(`ERROR: manifest.json not found in ${INPUT_DIR}`);
    process.exit(1);
  }

  if (!process.env.DATABASE_URL && !process.env.PGHOST) {
    console.error("ERROR: DATABASE_URL or PG* env vars required");
    process.exit(1);
  }

  const manifest: Manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const progressPath = path.join(INPUT_DIR, ".import-progress.json");
  const progress = loadProgress(progressPath);
  const doneSet = new Set(progress.completedChunks);

  log(`Manifest: ${manifest.tables.length} tables, exported at ${manifest.exportedAt}`);
  if (doneSet.size > 0) {
    log(`Resuming: ${doneSet.size} chunks already imported`);
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
  log("Connected to PostgreSQL");

  try {
    // Disable FK checks for bulk import
    await client.query("SET session_replication_role = replica");

    for (const tableMeta of manifest.tables) {
      const { table, totalRows, chunks } = tableMeta;

      if (totalRows === 0) {
        log(`${table}: 0 rows, skipping`);
        continue;
      }

      log(`${table}: importing ${totalRows} rows across ${chunks.length} chunk(s)`);
      let tableRows = 0;

      for (const chunk of chunks) {
        const chunkKey = `${table}/${chunk.file}`;
        if (doneSet.has(chunkKey)) {
          log(`  ${chunk.file}: already imported, skipping`);
          continue;
        }

        const filePath = path.join(INPUT_DIR, chunk.file);
        if (!fs.existsSync(filePath)) {
          console.error(`  ERROR: ${filePath} not found`);
          process.exit(1);
        }

        const rows = await readNdjsonGz(filePath);
        await insertBatch(client, table, rows);

        tableRows += rows.length;
        doneSet.add(chunkKey);
        progress.completedChunks = Array.from(doneSet);
        saveProgress(progressPath, progress);

        log(`  ${chunk.file}: imported ${rows.length} rows`);
      }

      log(`${table}: done (${tableRows} rows imported)`);
    }

    await client.query("SET session_replication_role = DEFAULT");
    log("\nImport complete.");

    // Clean up progress file on success
    if (fs.existsSync(progressPath)) fs.unlinkSync(progressPath);
  } catch (err) {
    console.error("Import failed:", err);
    log("Progress saved — re-run to resume from last completed chunk");
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
