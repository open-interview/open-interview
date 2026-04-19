#!/usr/bin/env node
/**
 * Migration: Add flashcards table (PostgreSQL)
 */

import 'dotenv/config';
import { getPool } from '../db/pg-client.js';

async function migrate() {
  const pool = getPool();
  console.log('🔄 Running migration: Add flashcards table...\n');

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS flashcards (
        id TEXT PRIMARY KEY,
        question_id TEXT REFERENCES questions(id),
        front TEXT,
        back TEXT,
        hint TEXT,
        mnemonic TEXT,
        channel TEXT,
        difficulty TEXT,
        tags TEXT,
        created_at TEXT,
        updated_at TEXT
      )
    `);
    console.log('✅ Created flashcards table');

    await pool.query(`CREATE INDEX IF NOT EXISTS idx_flashcards_channel ON flashcards(channel)`);
    console.log('✅ Created index on channel');

    await pool.query(`CREATE INDEX IF NOT EXISTS idx_flashcards_question_id ON flashcards(question_id)`);
    console.log('✅ Created index on question_id');

    console.log('\n🎉 Migration completed successfully!');
    await pool.end();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate().catch(err => { console.error(err); process.exit(1); });
