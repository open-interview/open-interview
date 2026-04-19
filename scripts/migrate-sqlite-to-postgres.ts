import "dotenv/config";
import Database from "better-sqlite3";
import pg from "pg";
import path from "path";

const SQLITE_PATH = path.resolve(process.cwd(), "local.db");
const BATCH_SIZE = 1000;

// Migration order respects FK dependencies:
// questions must come before channelMappings, questionRelationships, blogPosts, flashcards
// everything else is independent
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

async function migrateTable(
  sqlite: Database.Database,
  pgClient: pg.PoolClient,
  table: string
): Promise<void> {
  const rows = sqlite.prepare(`SELECT * FROM "${table}"`).all() as Record<string, unknown>[];
  if (rows.length === 0) {
    console.log(`  ${table}: 0 rows (skipped)`);
    return;
  }

  const columns = Object.keys(rows[0]);
  const placeholders = columns.map((_, i) => `$${i + 1}`).join(", ");
  const colList = columns.map((c) => `"${c}"`).join(", ");
  const sql = `INSERT INTO "${table}" (${colList}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;

  let inserted = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    for (const row of batch) {
      const values = columns.map((col) => {
        const val = row[col];
        // SQLite stores booleans as 0/1 integers; keep as-is since PG columns are integer/text
        return val === undefined ? null : val;
      });
      await pgClient.query(sql, values);
      inserted++;
    }
    console.log(`  ${table}: ${Math.min(i + BATCH_SIZE, rows.length)}/${rows.length}`);
  }
  console.log(`  ${table}: done (${inserted} rows)`);
}

async function main() {
  if (!process.env.DATABASE_URL && !process.env.PGHOST) {
    throw new Error("DATABASE_URL or PG* env vars required");
  }

  console.log(`Opening SQLite: ${SQLITE_PATH}`);
  const sqlite = new Database(SQLITE_PATH, { readonly: true });

  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    host: process.env.PGHOST,
    port: process.env.PGPORT ? parseInt(process.env.PGPORT) : undefined,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
  });

  const pgClient = await pool.connect();
  console.log("Connected to PostgreSQL\n");

  // Get tables that actually exist in SQLite
  const existingTables = new Set(
    (sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[])
      .map((r) => r.name)
  );

  try {
    await pgClient.query("BEGIN");

    // Disable FK checks during migration
    await pgClient.query("SET session_replication_role = replica");

    for (const table of TABLE_ORDER) {
      if (!existingTables.has(table)) {
        console.log(`  ${table}: not in SQLite (skipped)`);
        continue;
      }
      process.stdout.write(`Migrating ${table}...\n`);
      await migrateTable(sqlite, pgClient, table);
    }

    await pgClient.query("SET session_replication_role = DEFAULT");
    await pgClient.query("COMMIT");
    console.log("\nMigration complete.");
  } catch (err) {
    await pgClient.query("ROLLBACK");
    console.error("\nMigration failed, rolled back:", err);
    process.exit(1);
  } finally {
    pgClient.release();
    await pool.end();
    sqlite.close();
  }
}

main();
