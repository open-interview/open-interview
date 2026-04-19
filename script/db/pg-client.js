/**
 * Shared PostgreSQL client for scripts
 * Provides a @libsql/client-compatible API so all 40+ scripts work unchanged.
 *
 * Key behaviours:
 *  - Converts `?` positional placeholders → PostgreSQL `$1, $2, ...`
 *  - Silently ignores SQLite PRAGMA statements
 *  - Appends `RETURNING id` to bare INSERT statements so lastInsertRowid works
 *  - Reads DATABASE_URL or individual PG* env vars (compatible with both
 *    Replit dev and GitHub Actions postgres service containers)
 */

import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

let _pool = null;

export function getPool() {
  if (!_pool) {
    _pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      host: process.env.PGHOST,
      port: parseInt(process.env.PGPORT || '5432'),
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    _pool.on('error', (err) => {
      console.error('[pg-client] Pool error:', err.message);
    });
  }
  return _pool;
}

function convertPlaceholders(sql) {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

function isPragma(sql) {
  return sql.trim().toUpperCase().startsWith('PRAGMA');
}

async function execute(sqlOrObj) {
  const { sql, args } = typeof sqlOrObj === 'string'
    ? { sql: sqlOrObj, args: [] }
    : { sql: sqlOrObj.sql ?? sqlOrObj, args: sqlOrObj.args ?? [] };

  if (isPragma(sql)) {
    return { rows: [], lastInsertRowid: null };
  }

  let pgSql = convertPlaceholders(sql);

  const normalised = pgSql.trim().toUpperCase();
  const isInsert = normalised.startsWith('INSERT');
  const hasReturning = normalised.includes('RETURNING');
  if (isInsert && !hasReturning) {
    pgSql = pgSql.replace(/;\s*$/, '') + ' RETURNING id';
  }

  const pool = getPool();
  const result = await pool.query(pgSql, args);
  return {
    rows: result.rows,
    lastInsertRowid: result.rows[0]?.id ?? null,
  };
}

async function batch(stmts) {
  const results = [];
  for (const stmt of stmts) {
    results.push(await execute(stmt));
  }
  return results;
}

export const dbClient = { execute, batch };

export function getDb() {
  return { execute, batch };
}

export default { execute, batch, getDb, dbClient, getPool };
