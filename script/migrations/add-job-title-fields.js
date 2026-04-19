/**
 * Migration: Add Job Title Fields to Questions Table (PostgreSQL)
 * Adds job_title_relevance and experience_level_tags columns.
 */

import 'dotenv/config';
import { getPool } from '../db/pg-client.js';

async function addJobTitleFields() {
  const pool = getPool();
  console.log('🔄 Adding job title fields to questions table...\n');

  try {
    const { rows } = await pool.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'questions'
        AND column_name IN ('job_title_relevance', 'experience_level_tags')
    `);
    const existing = rows.map(r => r.column_name);

    if (existing.includes('job_title_relevance') && existing.includes('experience_level_tags')) {
      console.log('✅ Columns already exist. No migration needed.');
      await pool.end();
      return;
    }

    if (!existing.includes('job_title_relevance')) {
      console.log('Adding job_title_relevance column...');
      await pool.query(`ALTER TABLE questions ADD COLUMN job_title_relevance TEXT`);
      console.log('✅ Added job_title_relevance column');
    }

    if (!existing.includes('experience_level_tags')) {
      console.log('Adding experience_level_tags column...');
      await pool.query(`ALTER TABLE questions ADD COLUMN experience_level_tags TEXT`);
      console.log('✅ Added experience_level_tags column');
    }

    console.log('\n✅ Migration complete!');
    console.log('\nNext steps:');
    console.log('1. Run: npm run backfill:job-titles');
    console.log('2. This will populate the new fields for all existing questions');

    await pool.end();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

addJobTitleFields();
