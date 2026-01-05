#!/usr/bin/env node
/**
 * Get Latest Blog Post for LinkedIn Sharing
 * Fetches the most recent unshared blog post from the database
 */

import 'dotenv/config';
import { createClient } from '@libsql/client';
import fs from 'fs';

const BLOG_BASE_URL = 'https://openstackdaily.github.io';

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
const specificUrl = process.env.SPECIFIC_URL;

if (!url) {
  console.error('❌ Missing TURSO_DATABASE_URL');
  process.exit(1);
}

const client = createClient({ url, authToken });

async function ensureLinkedInColumn() {
  try {
    await client.execute(`ALTER TABLE blog_posts ADD COLUMN linkedin_shared_at TEXT`);
    console.log('Added linkedin_shared_at column');
  } catch (e) {
    // Column already exists
  }
}

async function getLatestUnsharedPost() {
  // If specific URL provided, extract question_id and find that post
  if (specificUrl) {
    // URL format: /posts/{question_id}/{slug}/
    const match = specificUrl.match(/\/posts\/([^\/]+)\/([^\/]+)/);
    if (match) {
      const questionId = match[1];
      const result = await client.execute({
        sql: `SELECT * FROM blog_posts WHERE question_id = ? LIMIT 1`,
        args: [questionId]
      });
      if (result.rows.length > 0) {
        return result.rows[0];
      }
    }
  }
  
  // Get latest unshared post
  const result = await client.execute(`
    SELECT * FROM blog_posts 
    WHERE linkedin_shared_at IS NULL 
    ORDER BY created_at DESC 
    LIMIT 1
  `);
  
  return result.rows[0] || null;
}

function generateExcerpt(intro, maxLength = 200) {
  if (!intro) return '';
  
  // Clean up the intro
  let excerpt = intro
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/`/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/\n+/g, ' ')
    .trim();
  
  if (excerpt.length > maxLength) {
    excerpt = excerpt.substring(0, maxLength - 3) + '...';
  }
  
  return excerpt;
}

function formatTags(tags, channel) {
  const tagList = tags ? JSON.parse(tags) : [];
  const allTags = [channel, ...tagList].filter(Boolean);
  
  // Convert to hashtags
  return allTags
    .slice(0, 5)
    .map(tag => '#' + tag.replace(/[^a-zA-Z0-9]/g, ''))
    .join(' ');
}

async function main() {
  console.log('🔍 Getting latest blog post for LinkedIn...\n');
  
  await ensureLinkedInColumn();
  
  const post = await getLatestUnsharedPost();
  
  if (!post) {
    console.log('No unshared posts found');
    
    // Set GitHub Actions output
    const outputFile = process.env.GITHUB_OUTPUT;
    if (outputFile) {
      fs.appendFileSync(outputFile, `has_post=false\n`);
    }
    return;
  }
  
  // URL structure: /posts/{question_id}/{slug}/
  const postUrl = `${BLOG_BASE_URL}/posts/${post.question_id}/${post.slug}/`;
  const excerpt = generateExcerpt(post.introduction);
  const tags = formatTags(post.tags, post.channel);
  
  console.log(`📝 Found post: ${post.title}`);
  console.log(`   URL: ${postUrl}`);
  console.log(`   Channel: ${post.channel}`);
  console.log(`   Tags: ${tags}`);
  
  // Set GitHub Actions outputs
  const outputFile = process.env.GITHUB_OUTPUT;
  if (outputFile) {
    fs.appendFileSync(outputFile, `has_post=true\n`);
    fs.appendFileSync(outputFile, `post_id=${post.question_id}\n`);
    fs.appendFileSync(outputFile, `title=${post.title}\n`);
    fs.appendFileSync(outputFile, `url=${postUrl}\n`);
    fs.appendFileSync(outputFile, `excerpt=${excerpt}\n`);
    fs.appendFileSync(outputFile, `tags=${tags}\n`);
    fs.appendFileSync(outputFile, `channel=${post.channel}\n`);
  }
}

main().catch(console.error);
