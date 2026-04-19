/**
 * Migration: Add is_new column to questions table (PostgreSQL)
 *
 * This column tracks whether a question is "new" (less than 7 days old).
 * New questions get a special badge in the UI.
 */

import 'dotenv/config';
import { getPool } from '../db/pg-client.js';

async function migrate() {
  const pool = getPool();
  console.log('🔄 Adding is_new column to questions table...\n');

  try {
    // Check if column already exists via information_schema
    const { rows } = await pool.query(`
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'questions' AND column_name = 'is_new'
    `);

    if (rows.length > 0) {
      console.log('✅ Column is_new already exists, skipping creation');
    } else {
      await pool.query(`ALTER TABLE questions ADD COLUMN is_new INTEGER DEFAULT 1`);
      console.log('✅ Added is_new column');
    }

    // Set is_new based on created_at date
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const cutoffDate = sevenDaysAgo.toISOString();

    const result = await pool.query(
      `UPDATE questions SET is_new = CASE WHEN created_at >= $1 THEN 1 ELSE 0 END`,
      [cutoffDate]
    );
    console.log(`✅ Updated ${result.rowCount} questions based on creation date`);

    const countResult = await pool.query(`SELECT COUNT(*) as count FROM questions WHERE is_new = 1`);
    console.log(`\n📊 Questions marked as NEW: ${countResult.rows[0].count}`);
    console.log('\n✅ Migration complete!');

    await pool.end();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
