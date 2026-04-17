#!/usr/bin/env node

/**
 * Migration: Add flashcards table
 */

import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config();

const dbClient = createClient({
  url: process.env.SQLITE_URL ?? 'file:local.db',
});

async function migrate() {
  console.log('🔄 Running migration: Add flashcards table...\n');

  try {
    await dbClient.execute(`
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

    await dbClient.execute(`
      CREATE INDEX IF NOT EXISTS idx_flashcards_channel ON flashcards(channel)
    `);
    console.log('✅ Created index on channel');

    await dbClient.execute(`
      CREATE INDEX IF NOT EXISTS idx_flashcards_question_id ON flashcards(question_id)
    `);
    console.log('✅ Created index on question_id');

    console.log('\n🎉 Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
