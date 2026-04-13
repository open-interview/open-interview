#!/usr/bin/env node
// Migrates all data from Turso cloud DB to local SQLite file
// Handles column mismatches by using only local columns
// Disables foreign key checks during import

import { createClient } from "@libsql/client";

const TURSO_URL = process.env.TURSO_DATABASE_URL_RO;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN_RO;
const LOCAL_URL = process.env.SQLITE_URL ?? "file:local.db";

if (!TURSO_URL || !TURSO_TOKEN) {
  console.error("TURSO_DATABASE_URL_RO and TURSO_AUTH_TOKEN_RO are required");
  process.exit(1);
}

const remote = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });
const local = createClient({ url: LOCAL_URL });

const TABLES = [
  "users",
  "questions",
  "channel_mappings",
  "work_queue",
  "bot_ledger",
  "bot_runs",
  "question_relationships",
  "voice_sessions",
  "certifications",
  "question_history",
  "user_sessions",
  "learning_paths",
];

const BATCH_SIZE = 500;

async function getColumns(client, table) {
  const r = await client.execute(`PRAGMA table_info(${table})`);
  return r.rows.map((row) => String(row.name));
}

async function getTableCount(client, table) {
  try {
    const result = await client.execute(`SELECT COUNT(*) as count FROM ${table}`);
    return Number(result.rows[0].count);
  } catch {
    return 0;
  }
}

async function tableExists(client, table) {
  const r = await client.execute(
    `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
    [table]
  );
  return r.rows.length > 0;
}

async function migrateTable(table) {
  console.log(`\n── ${table}`);

  const remoteExists = await tableExists(remote, table);
  if (!remoteExists) {
    console.log(`   ⚠  Table not found in remote, skipping`);
    return;
  }

  const totalRemote = await getTableCount(remote, table);
  if (totalRemote === 0) {
    console.log(`   ⚠  No rows in remote, skipping`);
    return;
  }
  console.log(`   Remote rows: ${totalRemote}`);

  // Get columns from both sides and intersect
  const remoteColumns = await getColumns(remote, table);
  const localColumns = await getColumns(local, table);
  const commonColumns = localColumns.filter((c) => remoteColumns.includes(c));

  if (commonColumns.length === 0) {
    console.log(`   ✗  No common columns found, skipping`);
    return;
  }

  const skippedRemote = remoteColumns.filter((c) => !localColumns.includes(c));
  const skippedLocal = localColumns.filter((c) => !remoteColumns.includes(c));
  if (skippedRemote.length)
    console.log(`   ℹ  Skipping remote-only columns: ${skippedRemote.join(", ")}`);
  if (skippedLocal.length)
    console.log(`   ℹ  Local-only columns (will be NULL): ${skippedLocal.join(", ")}`);

  const colList = commonColumns.join(", ");
  const placeholders = commonColumns.map(() => "?").join(", ");
  const insertSql = `INSERT OR REPLACE INTO ${table} (${colList}) VALUES (${placeholders})`;

  // Disable foreign keys for this session to avoid constraint failures during bulk insert
  await local.execute("PRAGMA foreign_keys=OFF");

  let offset = 0;
  let inserted = 0;

  while (offset < totalRemote) {
    const rows = await remote.execute(
      `SELECT ${colList} FROM ${table} LIMIT ${BATCH_SIZE} OFFSET ${offset}`
    );

    if (rows.rows.length === 0) break;

    const stmts = rows.rows.map((row) => ({
      sql: insertSql,
      args: commonColumns.map((col) => {
        const val = row[col];
        return val === undefined || val === null ? null : val;
      }),
    }));

    await local.batch(stmts, "write");

    inserted += rows.rows.length;
    offset += BATCH_SIZE;
    process.stdout.write(`\r   Migrated ${inserted}/${totalRemote}...`);
  }

  const localCount = await getTableCount(local, table);
  console.log(`\r   ✓  ${localCount} rows in local.db`);
}

async function main() {
  console.log(`Migrating from ${TURSO_URL}`);
  console.log(`Writing to   ${LOCAL_URL}\n`);

  // Clear existing data first (in reverse dependency order)
  console.log("Clearing existing local data...");
  await local.execute("PRAGMA foreign_keys=OFF");
  for (const table of [...TABLES].reverse()) {
    try {
      await local.execute(`DELETE FROM ${table}`);
    } catch {}
  }

  for (const table of TABLES) {
    try {
      await migrateTable(table);
    } catch (err) {
      console.error(`\n   ✗  Failed: ${err.message}`);
    }
  }

  await local.execute("PRAGMA foreign_keys=ON");

  console.log("\n✅ Migration complete!");

  // Summary
  console.log("\nFinal row counts:");
  for (const table of TABLES) {
    const count = await getTableCount(local, table);
    if (count > 0) console.log(`  ${table}: ${count.toLocaleString()}`);
  }

  remote.close();
  local.close();
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
