#!/usr/bin/env node
/**
 * Schedule LinkedIn Post
 * Generates engaging story-style posts using LangGraph pipeline
 * Schedules posts for random times instead of immediate publishing
 * 
 * Required secrets:
 * - LINKEDIN_ACCESS_TOKEN: OAuth 2.0 access token with w_member_social scope
 * - LINKEDIN_PERSON_URN: Your LinkedIn person URN (urn:li:person:XXXXXXXX)
 * - TURSO_DATABASE_URL: Database for storing scheduled posts
 * - TURSO_AUTH_TOKEN: Database auth token
 */

import 'dotenv/config';
import { createClient } from '@libsql/client';
import { generateLinkedInPost } from './ai/graphs/linkedin-graph.js';

const accessToken = process.env.LINKEDIN_ACCESS_TOKEN;
const personUrn = process.env.LINKEDIN_PERSON_URN;
const postTitle = process.env.POST_TITLE;
const postUrl = process.env.POST_URL;
const postExcerpt = process.env.POST_EXCERPT;
const postTags = process.env.POST_TAGS;
const postChannel = process.env.POST_CHANNEL;
const postId = process.env.POST_ID;

// Database client
const db = process.env.TURSO_DATABASE_URL ? createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
}) : null;

if (!accessToken || !personUrn) {
  console.error('❌ Missing LinkedIn credentials');
  console.error('   Set LINKEDIN_ACCESS_TOKEN and LINKEDIN_PERSON_URN secrets');
  process.exit(1);
}

if (!postTitle || !postUrl) {
  console.error('❌ Missing post details');
  process.exit(1);
}

/**
 * Generate random scheduled time (between 8 AM and 8 PM UTC, random day within next 3 days)
 */
function generateRandomScheduleTime() {
  const now = new Date();
  
  // Random day: 0-2 days from now
  const daysOffset = Math.floor(Math.random() * 3);
  
  // Random hour: 8 AM to 8 PM UTC (peak LinkedIn hours)
  const hour = 8 + Math.floor(Math.random() * 12);
  
  // Random minute
  const minute = Math.floor(Math.random() * 60);
  
  const scheduled = new Date(now);
  scheduled.setDate(scheduled.getDate() + daysOffset);
  scheduled.setUTCHours(hour, minute, 0, 0);
  
  // If scheduled time is in the past, push to tomorrow
  if (scheduled <= now) {
    scheduled.setDate(scheduled.getDate() + 1);
  }
  
  return scheduled;
}

/**
 * Save scheduled post to database
 */
async function saveScheduledPost(content, scheduledTime) {
  if (!db) {
    console.log('⚠️ Database not configured, cannot schedule post');
    return null;
  }
  
  // Ensure table exists
  await db.execute(`
    CREATE TABLE IF NOT EXISTS scheduled_linkedin_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id TEXT,
      title TEXT,
      url TEXT,
      content TEXT,
      scheduled_at TEXT,
      published_at TEXT,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  const result = await db.execute({
    sql: `INSERT INTO scheduled_linkedin_posts (post_id, title, url, content, scheduled_at, status)
          VALUES (?, ?, ?, ?, ?, 'pending')`,
    args: [postId || null, postTitle, postUrl, content, scheduledTime.toISOString()]
  });
  
  return result.lastInsertRowid;
}

async function main() {
  console.log('📢 Preparing LinkedIn Post with LangGraph Pipeline...\n');
  
  // Run LangGraph pipeline to generate content
  const result = await generateLinkedInPost({
    postId,
    title: postTitle,
    url: postUrl,
    excerpt: postExcerpt,
    channel: postChannel,
    tags: postTags
  });
  
  if (!result.success) {
    console.error('❌ Failed to generate LinkedIn post:', result.error);
    process.exit(1);
  }
  
  const content = result.content;
  const scheduledTime = generateRandomScheduleTime();
  
  console.log('\nFinal post content:');
  console.log('─'.repeat(50));
  console.log(content);
  console.log('─'.repeat(50));
  console.log(`\nCharacter count: ${content.length}/3000`);
  console.log(`\n📅 Scheduled for: ${scheduledTime.toISOString()}`);
  console.log(`   (${scheduledTime.toLocaleString('en-US', { timeZone: 'UTC' })} UTC)`);
  
  // Save to database for later publishing
  const scheduleId = await saveScheduledPost(content, scheduledTime);
  
  if (scheduleId) {
    console.log(`\n✅ Post scheduled successfully (ID: ${scheduleId})`);
    console.log('   Will be published by the scheduled job');
  } else {
    console.log('\n⚠️ Could not save to database');
    console.log('   Post content generated but not scheduled');
  }
  
  // Output for GitHub Actions
  if (process.env.GITHUB_OUTPUT) {
    const fs = await import('fs');
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `scheduled=true\n`);
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `scheduled_time=${scheduledTime.toISOString()}\n`);
    if (scheduleId) {
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `schedule_id=${scheduleId}\n`);
    }
  }
}

main().catch(console.error);
