#!/usr/bin/env node
/**
 * Migration: Add question_history table
 * 
 * This table tracks all changes and events for questions, test questions, and coding challenges.
 * It provides a complete audit trail accessible via a small icon on each question.
 */

import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:questions.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function migrate() {
  console.log('🔄 Running migration: add-question-history');
  
  try {
    // Create question_history table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS question_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
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
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);
    console.log('✅ Created question_history table');

    // Create indexes for efficient querying
    await client.execute(`
      CREATE INDEX IF NOT EXISTS idx_question_history_question_id 
      ON question_history(question_id)
    `);
    console.log('✅ Created index on question_id');

    await client.execute(`
      CREATE INDEX IF NOT EXISTS idx_question_history_type 
      ON question_history(question_type)
    `);
    console.log('✅ Created index on question_type');

    await client.execute(`
      CREATE INDEX IF NOT EXISTS idx_question_history_event_type 
      ON question_history(event_type)
    `);
    console.log('✅ Created index on event_type');

    await client.execute(`
      CREATE INDEX IF NOT EXISTS idx_question_history_created_at 
      ON question_history(created_at DESC)
    `);
    console.log('✅ Created index on created_at');

    // Seed initial history from existing questions (mark them as 'created')
    console.log('\n📝 Seeding initial history from existing questions...');
    
    // Get count of existing questions
    const questionsCount = await client.execute(
      'SELECT COUNT(*) as count FROM questions'
    );
    const qCount = Number(questionsCount.rows[0].count);
    
    if (qCount > 0) {
      // Insert creation records for existing questions
      await client.execute(`
        INSERT INTO question_history (question_id, question_type, event_type, event_source, source_name, changes_summary, created_at)
        SELECT 
          id,
          'question',
          'created',
          'import',
          'initial-seed',
          'Question imported from initial dataset',
          COALESCE(created_at, datetime('now'))
        FROM questions
        WHERE id NOT IN (SELECT DISTINCT question_id FROM question_history WHERE question_type = 'question')
      `);
      console.log(`✅ Added creation history for ${qCount} questions`);
    }

    // Check for coding_challenges table and seed history
    try {
      const challengesCount = await client.execute(
        'SELECT COUNT(*) as count FROM coding_challenges'
      );
      const cCount = Number(challengesCount.rows[0].count);
      
      if (cCount > 0) {
        await client.execute(`
          INSERT INTO question_history (question_id, question_type, event_type, event_source, source_name, changes_summary, created_at)
          SELECT 
            id,
            'coding',
            'created',
            'import',
            'initial-seed',
            'Coding challenge imported from initial dataset',
            COALESCE(created_at, datetime('now'))
          FROM coding_challenges
          WHERE id NOT IN (SELECT DISTINCT question_id FROM question_history WHERE question_type = 'coding')
        `);
        console.log(`✅ Added creation history for ${cCount} coding challenges`);
      }
    } catch (e) {
      console.log('ℹ️  No coding_challenges table found, skipping');
    }

    console.log('\n✅ Migration completed successfully!');
    
    // Show summary
    const historyCount = await client.execute(
      'SELECT COUNT(*) as count FROM question_history'
    );
    console.log(`📊 Total history records: ${historyCount.rows[0].count}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
