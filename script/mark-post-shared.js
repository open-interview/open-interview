#!/usr/bin/env node
/**
 * Mark Blog Post as Shared on LinkedIn
 * Updates the database to track which posts have been shared
 */

import 'dotenv/config';
import { dbClient as client } from './db/pg-client.js';
const postId = process.env.POST_ID;

if (!postId) {
  console.error('❌ Missing POST_ID environment variable');
  process.exit(1);
}

async function markAsShared() {
  console.log(`📝 Marking post ${postId} as shared on LinkedIn...`);

  // Ensure table exists (may not if running standalone against a fresh DB)
  await client.execute(`
    CREATE TABLE IF NOT EXISTS blog_posts (
      id SERIAL PRIMARY KEY,
      question_id TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      slug TEXT NOT NULL,
      linkedin_shared_at TEXT
    )
  `);
  try {
    await client.execute(`ALTER TABLE blog_posts ADD COLUMN linkedin_shared_at TEXT`);
  } catch {
    // Column already exists
  }

  const now = new Date().toISOString();
  
  await client.execute({
    sql: `UPDATE blog_posts SET linkedin_shared_at = ? WHERE question_id = ?`,
    args: [now, postId]
  });
  
  console.log('✅ Post marked as shared');
}

markAsShared().catch(console.error);
