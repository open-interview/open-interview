/**
 * Database utilities for bots — PostgreSQL edition
 * Provides the same API as the old @libsql/client version.
 */

import { dbClient, getPool } from '../../db/pg-client.js';

export function getDb() {
  return dbClient;
}

// Initialize all bot tables (idempotent — CREATE IF NOT EXISTS)
export async function initBotTables() {
  const pool = getPool();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS work_queue (
      id SERIAL PRIMARY KEY,
      item_type TEXT NOT NULL,
      item_id TEXT NOT NULL,
      action TEXT NOT NULL,
      priority INTEGER DEFAULT 5,
      status TEXT DEFAULT 'pending',
      reason TEXT,
      created_by TEXT,
      assigned_to TEXT,
      created_at TEXT DEFAULT TO_CHAR(NOW(), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
      processed_at TEXT,
      result TEXT
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS bot_ledger (
      id SERIAL PRIMARY KEY,
      bot_name TEXT NOT NULL,
      action TEXT NOT NULL,
      item_type TEXT NOT NULL,
      item_id TEXT NOT NULL,
      before_state TEXT,
      after_state TEXT,
      reason TEXT,
      created_at TEXT DEFAULT TO_CHAR(NOW(), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS bot_runs (
      id SERIAL PRIMARY KEY,
      bot_name TEXT NOT NULL,
      started_at TEXT NOT NULL,
      completed_at TEXT,
      status TEXT DEFAULT 'running',
      items_processed INTEGER DEFAULT 0,
      items_created INTEGER DEFAULT 0,
      items_updated INTEGER DEFAULT 0,
      items_deleted INTEGER DEFAULT 0,
      summary TEXT
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS question_relationships (
      id SERIAL PRIMARY KEY,
      source_question_id TEXT NOT NULL,
      target_question_id TEXT NOT NULL,
      relationship_type TEXT NOT NULL,
      strength INTEGER DEFAULT 50,
      created_at TEXT DEFAULT TO_CHAR(NOW(), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
      FOREIGN KEY (source_question_id) REFERENCES questions(id),
      FOREIGN KEY (target_question_id) REFERENCES questions(id)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS voice_sessions (
      id TEXT PRIMARY KEY,
      topic TEXT NOT NULL,
      description TEXT,
      channel TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      question_ids TEXT NOT NULL,
      total_questions INTEGER NOT NULL,
      estimated_minutes INTEGER DEFAULT 5,
      created_at TEXT DEFAULT TO_CHAR(NOW(), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
      last_updated TEXT
    )
  `);

  // Add status column to questions if it doesn't exist
  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='questions' AND column_name='status'
      ) THEN
        ALTER TABLE questions ADD COLUMN status TEXT DEFAULT 'active';
      END IF;
    END$$;
  `);

  // Indexes
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_relationships_source ON question_relationships(source_question_id)
  `).catch(() => {});
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_relationships_target ON question_relationships(target_question_id)
  `).catch(() => {});
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_voice_sessions_channel ON voice_sessions(channel)
  `).catch(() => {});

  console.log('✓ Bot tables initialized (PostgreSQL)');
}

export async function resetBotTables() {
  const pool = getPool();
  console.log('⚠️ Resetting bot tables (all data will be lost)...');
  await pool.query('DROP TABLE IF EXISTS work_queue CASCADE');
  await pool.query('DROP TABLE IF EXISTS bot_ledger CASCADE');
  await pool.query('DROP TABLE IF EXISTS bot_runs CASCADE');
  await initBotTables();
  console.log('✓ Bot tables reset complete');
}

export default { getDb, initBotTables, resetBotTables };
