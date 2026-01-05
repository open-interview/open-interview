#!/usr/bin/env node
/**
 * Publish Scheduled LinkedIn Posts
 * Checks for posts scheduled to be published and posts them to LinkedIn
 * Run this on a cron schedule (e.g., every hour)
 * 
 * Required secrets:
 * - LINKEDIN_ACCESS_TOKEN: OAuth 2.0 access token with w_member_social scope
 * - LINKEDIN_PERSON_URN: Your LinkedIn person URN (urn:li:person:XXXXXXXX)
 * - TURSO_DATABASE_URL: Database for scheduled posts
 * - TURSO_AUTH_TOKEN: Database auth token
 */

import 'dotenv/config';
import { createClient } from '@libsql/client';

const LINKEDIN_API_URL = 'https://api.linkedin.com/v2/ugcPosts';

const accessToken = process.env.LINKEDIN_ACCESS_TOKEN;
const personUrn = process.env.LINKEDIN_PERSON_URN;

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});

if (!accessToken || !personUrn) {
  console.error('❌ Missing LinkedIn credentials');
  process.exit(1);
}

/**
 * Get posts that are due to be published
 */
async function getDuePosts() {
  const now = new Date().toISOString();
  
  const result = await db.execute({
    sql: `SELECT * FROM scheduled_linkedin_posts 
          WHERE status = 'pending' 
          AND scheduled_at <= ?
          ORDER BY scheduled_at ASC
          LIMIT 5`,
    args: [now]
  });
  
  return result.rows;
}

/**
 * Publish a post to LinkedIn
 */
async function publishToLinkedIn(post) {
  console.log(`\n📢 Publishing: ${post.title}`);
  
  const payload = {
    author: personUrn,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: {
          text: post.content
        },
        shareMediaCategory: 'ARTICLE',
        media: [
          {
            status: 'READY',
            originalUrl: post.url,
            title: {
              text: post.title
            }
          }
        ]
      }
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
    }
  };
  
  try {
    const response = await fetch(LINKEDIN_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`LinkedIn API error: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log(`   ✅ Published! Post ID: ${result.id}`);
    
    return { success: true, linkedinId: result.id };
  } catch (error) {
    console.error(`   ❌ Failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Update post status in database
 */
async function updatePostStatus(id, status, linkedinId = null) {
  await db.execute({
    sql: `UPDATE scheduled_linkedin_posts 
          SET status = ?, 
              published_at = CASE WHEN ? = 'published' THEN CURRENT_TIMESTAMP ELSE published_at END
          WHERE id = ?`,
    args: [status, status, id]
  });
}

async function main() {
  console.log('🔍 Checking for scheduled LinkedIn posts...\n');
  
  const duePosts = await getDuePosts();
  
  if (duePosts.length === 0) {
    console.log('📭 No posts due for publishing');
    return;
  }
  
  console.log(`📬 Found ${duePosts.length} post(s) to publish`);
  
  let published = 0;
  let failed = 0;
  
  for (const post of duePosts) {
    const result = await publishToLinkedIn(post);
    
    if (result.success) {
      await updatePostStatus(post.id, 'published', result.linkedinId);
      published++;
    } else {
      // Mark as failed but don't retry immediately
      await updatePostStatus(post.id, 'failed');
      failed++;
    }
    
    // Small delay between posts
    await new Promise(r => setTimeout(r, 2000));
  }
  
  console.log(`\n📊 Summary: ${published} published, ${failed} failed`);
  
  // Output for GitHub Actions
  if (process.env.GITHUB_OUTPUT) {
    const fs = await import('fs');
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `published_count=${published}\n`);
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `failed_count=${failed}\n`);
  }
}

main().catch(console.error);
