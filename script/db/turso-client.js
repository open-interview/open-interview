/**
 * Turso/LibSQL client with the same API as pg-client.js
 * Used when TURSO_DATABASE_URL is set (production DB).
 */

import 'dotenv/config';
import { createClient } from '@libsql/client';

let _client = null;

function getClient() {
  if (!_client) {
    _client = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  return _client;
}

async function execute(sqlOrObj) {
  const { sql, args } = typeof sqlOrObj === 'string'
    ? { sql: sqlOrObj, args: [] }
    : { sql: sqlOrObj.sql ?? sqlOrObj, args: sqlOrObj.args ?? [] };

  if (sql.trim().toUpperCase().startsWith('PRAGMA')) {
    return { rows: [], lastInsertRowid: null };
  }

  const result = await getClient().execute({ sql, args: args ?? [] });
  return {
    rows: result.rows,
    lastInsertRowid: result.lastInsertRowid ?? null,
  };
}

async function batch(stmts) {
  const results = [];
  for (const stmt of stmts) results.push(await execute(stmt));
  return results;
}

export const dbClient = { execute, batch };
export default { execute, batch, dbClient };
