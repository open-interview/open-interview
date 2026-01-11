/**
 * Migration: Add is_new column to questions table
 * 
 * This column tracks whether a question is "new" (less than 7 days old)
 * New questions get a special badge in the UI
 */

import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config();

const dbClient = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function migrate() {
  console.log('🔄 Adding is_new column to questions table...\n');

  try {
    // Check if column already exists
    const tableInfo = await dbClient.execute('PRAGMA table_info(questions)');
    const hasColumn = tableInfo.rows.some(row => row.name === 'is_new');

    if (hasColumn) {
      console.log('✅ Column is_new already exists, skipping creation');
    } else {
      // Add the column
      await dbClient.execute(`
        ALTER TABLE questions ADD COLUMN is_new INTEGER DEFAULT 1
      `);
      console.log('✅ Added is_new column');
    }

    // Set is_new = 1 for questions created in the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const cutoffDate = sevenDaysAgo.toISOString();

    const updateResult = await dbClient.execute({
      sql: `
        UPDATE questions 
        SET is_new = CASE 
          WHEN created_at >= ? THEN 1 
          ELSE 0 
        END
      `,
      args: [cutoffDate]
    });

    console.log(`✅ Updated ${updateResult.rowsAffected} questions based on creation date`);

    // Count new questions
    const newCount = await dbClient.execute(`
      SELECT COUNT(*) as count FROM questions WHERE is_new = 1
    `);
    console.log(`\n📊 Questions marked as NEW: ${newCount.rows[0].count}`);

    console.log('\n✅ Migration complete!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
