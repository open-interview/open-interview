#!/usr/bin/env node
/**
 * Migration: Add learning_paths table (PostgreSQL)
 */

import 'dotenv/config';
import { getPool } from '../db/pg-client.js';

async function migrate() {
  const pool = getPool();
  console.log('🔄 Running migration: Add learning_paths table...\n');

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS learning_paths (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        path_type TEXT NOT NULL,
        target_company TEXT,
        target_job_title TEXT,
        difficulty TEXT NOT NULL,
        estimated_hours INTEGER DEFAULT 40,
        question_ids TEXT NOT NULL,
        channels TEXT NOT NULL,
        tags TEXT,
        prerequisites TEXT,
        learning_objectives TEXT,
        milestones TEXT,
        popularity INTEGER DEFAULT 0,
        completion_rate INTEGER DEFAULT 0,
        average_rating INTEGER DEFAULT 0,
        metadata TEXT,
        status TEXT DEFAULT 'active',
        created_at TEXT NOT NULL,
        last_updated TEXT,
        last_generated TEXT
      )
    `);
    console.log('✅ Created learning_paths table');

    await pool.query(`CREATE INDEX IF NOT EXISTS idx_learning_paths_type ON learning_paths(path_type)`);
    console.log('✅ Created index on path_type');

    await pool.query(`CREATE INDEX IF NOT EXISTS idx_learning_paths_difficulty ON learning_paths(difficulty)`);
    console.log('✅ Created index on difficulty');

    await pool.query(`CREATE INDEX IF NOT EXISTS idx_learning_paths_company ON learning_paths(target_company)`);
    console.log('✅ Created index on target_company');

    await pool.query(`CREATE INDEX IF NOT EXISTS idx_learning_paths_job_title ON learning_paths(target_job_title)`);
    console.log('✅ Created index on target_job_title');

    await pool.query(`CREATE INDEX IF NOT EXISTS idx_learning_paths_status ON learning_paths(status)`);
    console.log('✅ Created index on status');

    await pool.query(`CREATE INDEX IF NOT EXISTS idx_learning_paths_popularity ON learning_paths(popularity DESC)`);
    console.log('✅ Created index on popularity');

    console.log('\n🎉 Migration completed successfully!');
    await pool.end();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate().catch(err => { console.error(err); process.exit(1); });
