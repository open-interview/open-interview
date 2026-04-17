#!/usr/bin/env node
/**
 * Mark Blog Post as Shared on LinkedIn
 * Updates the database to track which posts have been shared
 */

import 'dotenv/config';
import { createClient } from '@libsql/client';

const url = process.env.SQLITE_URL || 'file:local.db';
const postId = process.env.POST_ID;

if (!postId) {
  console.error('❌ Missing POST_ID environment variable');
  process.exit(1);
}

const client = createClient({ url });

async function markAsShared() {
  console.log(`📝 Marking post ${postId} as shared on LinkedIn...`);
  
  const now = new Date().toISOString();
  
  await client.execute({
    sql: `UPDATE blog_posts SET linkedin_shared_at = ? WHERE question_id = ?`,
    args: [now, postId]
  });
  
  console.log('✅ Post marked as shared');
}

markAsShared().catch(console.error);
