/**
 * Database utilities for bots
 * Shared database connection and helpers
 */

import { createClient } from '@libsql/client';

let dbClient = null;

export function getDb() {
  if (!dbClient) {
    dbClient = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  return dbClient;
}

// Initialize all bot tables (creates if not exists, preserves data)
export async function initBotTables() {
  const db = getDb();
  
  // Work queue table - CREATE IF NOT EXISTS (preserves existing data)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS work_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_type TEXT NOT NULL,
      item_id TEXT NOT NULL,
      action TEXT NOT NULL,
      priority INTEGER DEFAULT 5,
      status TEXT DEFAULT 'pending',
      reason TEXT,
      created_by TEXT,
      assigned_to TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      processed_at TEXT,
      result TEXT
    )
  `);
  
  // Bot ledger table - CREATE IF NOT EXISTS (preserves existing data)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS bot_ledger (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bot_name TEXT NOT NULL,
      action TEXT NOT NULL,
      item_type TEXT NOT NULL,
      item_id TEXT NOT NULL,
      before_state TEXT,
      after_state TEXT,
      reason TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Bot runs table - CREATE IF NOT EXISTS (preserves existing data)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS bot_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
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
  
  // Question relationships table for voice session grouping
  await db.execute(`
    CREATE TABLE IF NOT EXISTS question_relationships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_question_id TEXT NOT NULL,
      target_question_id TEXT NOT NULL,
      relationship_type TEXT NOT NULL,
      strength INTEGER DEFAULT 50,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (source_question_id) REFERENCES questions(id),
      FOREIGN KEY (target_question_id) REFERENCES questions(id)
    )
  `);
  
  // Voice sessions table - pre-built sessions of related questions
  await db.execute(`
    CREATE TABLE IF NOT EXISTS voice_sessions (
      id TEXT PRIMARY KEY,
      topic TEXT NOT NULL,
      description TEXT,
      channel TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      question_ids TEXT NOT NULL,
      total_questions INTEGER NOT NULL,
      estimated_minutes INTEGER DEFAULT 5,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      last_updated TEXT
    )
  `);
  
  // Add status column to questions if not exists
  try {
    await db.execute(`ALTER TABLE questions ADD COLUMN status TEXT DEFAULT 'active'`);
  } catch (e) {
    // Column already exists
  }
  
  // Create indexes for faster lookups
  try {
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_relationships_source ON question_relationships(source_question_id)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_relationships_target ON question_relationships(target_question_id)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_voice_sessions_channel ON voice_sessions(channel)`);
  } catch (e) {
    // Indexes might already exist
  }
  
  console.log('✓ Bot tables initialized');
}

// Reset bot tables (use only when schema changes are needed)
export async function resetBotTables() {
  const db = getDb();
  
  console.log('⚠️ Resetting bot tables (all data will be lost)...');
  
  await db.execute(`DROP TABLE IF EXISTS work_queue`);
  await db.execute(`DROP TABLE IF EXISTS bot_ledger`);
  await db.execute(`DROP TABLE IF EXISTS bot_runs`);
  
  await initBotTables();
  
  console.log('✓ Bot tables reset complete');
}

export default { getDb, initBotTables, resetBotTables };
