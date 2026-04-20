#!/usr/bin/env node
/**
 * Get Latest Blog Post for LinkedIn Sharing
 * Fetches the most recent unshared blog post from the database
 */

import 'dotenv/config';
import fs from 'fs';
import { dbClient as client } from './db/pg-client.js';

const BLOG_BASE_URL = 'https://openstackdaily.github.io';

const specificUrl = process.env.SPECIFIC_URL;

async function ensureLinkedInColumn() {
  try {
    // Ensure blog_posts table exists (created by generate-blog.js, but handle missing gracefully)
    await client.execute(`
      CREATE TABLE IF NOT EXISTS blog_posts (
        id SERIAL PRIMARY KEY,
        question_id TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        slug TEXT NOT NULL,
        introduction TEXT,
        sections TEXT,
        conclusion TEXT,
        meta_description TEXT,
        channel TEXT,
        difficulty TEXT,
        tags TEXT,
        diagram TEXT,
        created_at TEXT,
        published_at TEXT,
        linkedin_shared_at TEXT,
        quick_reference TEXT,
        glossary TEXT,
        real_world_example TEXT,
        fun_fact TEXT,
        sources TEXT,
        social_snippet TEXT,
        diagram_type TEXT,
        diagram_label TEXT,
        images TEXT,
        svg_content TEXT
      )
    `);
  } catch (e) {
    // Table creation failed, ignore
  }
  try {
    await client.execute(`ALTER TABLE blog_posts ADD COLUMN linkedin_shared_at TEXT`);
    console.log('Added linkedin_shared_at column');
  } catch (e) {
    // Column already exists
  }
}

async function isUrlLive(postUrl, timeout = 8000) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    const response = await fetch(postUrl, { method: 'HEAD', signal: controller.signal });
    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
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

  // Fetch a batch of candidates and return the first one whose URL is live.
  // This skips posts that exist in the DB but were never deployed to GitHub Pages.
  const result = await client.execute(`
    SELECT * FROM blog_posts
    WHERE linkedin_shared_at IS NULL
    ORDER BY created_at DESC
    LIMIT 20
  `);

  for (const post of result.rows) {
    const postUrl = `${BLOG_BASE_URL}/posts/${post.question_id}/${post.slug}/`;
    const live = await isUrlLive(postUrl);
    if (live) {
      return post;
    }
    console.log(`   ⚠️  Skipping ${post.question_id} — URL not live: ${postUrl}`);
  }

  return null;
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

function formatTags(tags, channel, title = '', excerpt = '') {
  const tagList = tags ? JSON.parse(tags) : [];
  
  // Channel-specific hashtags for better reach
  const channelHashtags = {
    'aws': ['AWS', 'Cloud', 'CloudComputing'],
    'kubernetes': ['Kubernetes', 'K8s', 'CloudNative', 'DevOps'],
    'system-design': ['SystemDesign', 'Architecture', 'SoftwareEngineering'],
    'frontend': ['Frontend', 'WebDev', 'JavaScript', 'React'],
    'backend': ['Backend', 'API', 'Microservices'],
    'database': ['Database', 'SQL', 'DataEngineering'],
    'devops': ['DevOps', 'CI', 'CD', 'Automation'],
    'security': ['CyberSecurity', 'InfoSec', 'Security'],
    'machine-learning': ['MachineLearning', 'AI', 'DataScience'],
    'terraform': ['Terraform', 'IaC', 'InfrastructureAsCode'],
    'docker': ['Docker', 'Containers', 'CloudNative'],
    'networking': ['Networking', 'CloudNetworking', 'VPC'],
    'sre': ['SRE', 'Reliability', 'Observability'],
    'testing': ['Testing', 'QA', 'TestAutomation']
  };
  
  // Extract keywords from title (simple approach)
  const titleKeywords = title
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 4 && !['about', 'using', 'guide', 'learn'].includes(word))
    .slice(0, 3);
  
  // Combine all sources
  const allTags = [
    channel,
    ...tagList,
    ...(channelHashtags[channel] || []),
    ...titleKeywords
  ].filter(Boolean);
  
  // Deduplicate (case-insensitive)
  const seen = new Set();
  const uniqueTags = allTags.filter(tag => {
    const lower = tag.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (seen.has(lower)) return false;
    seen.add(lower);
    return true;
  });
  
  // Convert to hashtags (limit to 10 for optimal LinkedIn performance)
  return uniqueTags
    .slice(0, 10)
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
  const tags = formatTags(post.tags, post.channel, post.title, excerpt);
  
  console.log(`📝 Found post: ${post.title}`);
  console.log(`   URL: ${postUrl}`);
  console.log(`   Channel: ${post.channel}`);
  console.log(`   Tags: ${tags}`);
  
  // Parse rich context fields
  let quickReference = '';
  try {
    const qr = JSON.parse(post.quick_reference || '[]');
    quickReference = Array.isArray(qr) ? qr.join(' | ') : '';
  } catch {}

  let socialHook = '';
  let socialBody = '';
  try {
    const ss = JSON.parse(post.social_snippet || '{}');
    socialHook = ss.hook || '';
    socialBody = Array.isArray(ss.body) ? ss.body.join('\n') : (ss.body || '');
  } catch {}

  let realWorldExample = '';
  try {
    const rwe = JSON.parse(post.real_world_example || '{}');
    if (rwe?.company && rwe?.scenario) {
      const sourceNote = rwe.sourceUrl ? ` (source: ${rwe.sourceUrl})` : '';
      realWorldExample = `${rwe.company}: ${rwe.scenario}${sourceNote}`;
    }
  } catch {}

  // Set GitHub Actions outputs — use heredoc for values that may contain newlines
  const outputFile = process.env.GITHUB_OUTPUT;
  if (outputFile) {
    const writeOutput = (key, value) => {
      const str = String(value ?? '');
      if (str.includes('\n') || str.includes('\r')) {
        fs.appendFileSync(outputFile, `${key}<<__EOF__\n${str}\n__EOF__\n`);
      } else {
        fs.appendFileSync(outputFile, `${key}=${str}\n`);
      }
    };
    writeOutput('has_post', 'true');
    writeOutput('post_id', post.question_id);
    writeOutput('title', post.title);
    writeOutput('url', postUrl);
    writeOutput('excerpt', excerpt);
    writeOutput('tags', tags);
    writeOutput('channel', post.channel);
    if (quickReference)   writeOutput('quick_reference', quickReference);
    if (socialHook)       writeOutput('social_hook', socialHook);
    if (socialBody)       writeOutput('social_body', socialBody);
    if (realWorldExample) writeOutput('real_world_example', realWorldExample);
  }
}

main().catch(console.error);
