#!/usr/bin/env node
/**
 * Mark Blog Post as Shared on LinkedIn
 * Updates the database to track which posts have been shared
 */

import 'dotenv/config';
import { dbClient as client } from './db/pg-client.js';
const postId = process.env.POST_ID;
const linkedInId = process.env.POST_LINKEDIN_ID;

if (!postId) {
  console.error('❌ Missing POST_ID environment variable');
  process.exit(1);
}

async function markAsShared() {
  console.log(`📝 Marking post ${postId} as shared on LinkedIn...`);

  // Schema managed by Drizzle ORM migrations (drizzle-kit generate)
  // Run: pnpm db:push to apply schema changes

  const now = new Date().toISOString();
  const MAX_RETRIES = 3;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await client.execute({
        sql: `UPDATE blog_posts SET linkedin_shared_at = ?, linkedin_post_id = COALESCE(?, linkedin_post_id) WHERE question_id = ? AND linkedin_shared_at IS NULL`,
        args: [now, linkedInId || null, postId]
      });
      console.log('✅ Post marked as shared');
      break;
    } catch (e) {
      if (attempt === MAX_RETRIES) throw e;
      console.log(`⚠️  Attempt ${attempt} failed, retrying...`);
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt - 1)));
    }
  }
}

markAsShared().catch(console.error);
