#!/usr/bin/env node
/**
 * Migration: Add question_history table (PostgreSQL)
 *
 * Tracks all changes and events for questions, test questions, and coding challenges.
 */

import 'dotenv/config';
import { getPool } from '../db/pg-client.js';

async function migrate() {
  const pool = getPool();
  console.log('🔄 Running migration: add-question-history');

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS question_history (
        id SERIAL PRIMARY KEY,
        question_id TEXT NOT NULL,
        question_type TEXT NOT NULL DEFAULT 'question',
        event_type TEXT NOT NULL,
        event_source TEXT NOT NULL,
        source_name TEXT,
        changes_summary TEXT,
        changed_fields TEXT,
        before_snapshot TEXT,
        after_snapshot TEXT,
        reason TEXT,
        metadata TEXT,
        created_at TEXT DEFAULT TO_CHAR(NOW(), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
      )
    `);
    console.log('✅ Created question_history table');

    await pool.query(`CREATE INDEX IF NOT EXISTS idx_question_history_question_id ON question_history(question_id)`);
    console.log('✅ Created index on question_id');

    await pool.query(`CREATE INDEX IF NOT EXISTS idx_question_history_type ON question_history(question_type)`);
    console.log('✅ Created index on question_type');

    await pool.query(`CREATE INDEX IF NOT EXISTS idx_question_history_event_type ON question_history(event_type)`);
    console.log('✅ Created index on event_type');

    await pool.query(`CREATE INDEX IF NOT EXISTS idx_question_history_created_at ON question_history(created_at DESC)`);
    console.log('✅ Created index on created_at');

    console.log('\n📝 Seeding initial history from existing questions...');

    const { rows: countRows } = await pool.query(`SELECT COUNT(*) as count FROM questions`);
    const qCount = parseInt(countRows[0].count, 10);

    if (qCount > 0) {
      await pool.query(`
        INSERT INTO question_history (question_id, question_type, event_type, event_source, source_name, changes_summary, created_at)
        SELECT
          id,
          'question',
          'created',
          'import',
          'initial-seed',
          'Question imported from initial dataset',
          COALESCE(created_at, TO_CHAR(NOW(), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))
        FROM questions
        WHERE id NOT IN (SELECT DISTINCT question_id FROM question_history WHERE question_type = 'question')
      `);
      console.log(`✅ Added creation history for ${qCount} questions`);
    }

    try {
      const { rows: ccRows } = await pool.query(`SELECT COUNT(*) as count FROM coding_challenges`);
      const cCount = parseInt(ccRows[0].count, 10);
      if (cCount > 0) {
        await pool.query(`
          INSERT INTO question_history (question_id, question_type, event_type, event_source, source_name, changes_summary, created_at)
          SELECT
            id,
            'coding',
            'created',
            'import',
            'initial-seed',
            'Coding challenge imported from initial dataset',
            COALESCE(created_at, TO_CHAR(NOW(), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))
          FROM coding_challenges
          WHERE id NOT IN (SELECT DISTINCT question_id FROM question_history WHERE question_type = 'coding')
        `);
        console.log(`✅ Added creation history for ${cCount} coding challenges`);
      }
    } catch (e) {
      console.log('ℹ️  No coding_challenges table found, skipping');
    }

    console.log('\n✅ Migration completed successfully!');

    const { rows: histRows } = await pool.query(`SELECT COUNT(*) as count FROM question_history`);
    console.log(`📊 Total history records: ${histRows[0].count}`);

    await pool.end();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
