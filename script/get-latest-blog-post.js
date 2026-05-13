#!/usr/bin/env node

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const BLOG_BASE_URL = process.env.BLOG_BASE_URL || 'https://open-interview.github.io';
const specificUrl = process.env.SPECIFIC_URL;
const SHARED_POSTS_FILE = path.join(__dirname, '..', 'data', 'shared-posts.json');

const BLOG_POSTS_DIR = path.join(__dirname, '..', 'data', 'blog-posts');

function readBlogPosts() {
  if (!fs.existsSync(BLOG_POSTS_DIR)) return [];
  const files = fs.readdirSync(BLOG_POSTS_DIR).filter(f => f.endsWith('.json'));
  const posts = [];
  for (const file of files) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(BLOG_POSTS_DIR, file), 'utf8'));
      posts.push(...(Array.isArray(data) ? data : [data]));
    } catch {}
  }
  return posts;
}

function readSharedPosts() {
  if (!fs.existsSync(SHARED_POSTS_FILE)) return {};
  try { return JSON.parse(fs.readFileSync(SHARED_POSTS_FILE, 'utf8')); } catch { return {}; }
}

async function isUrlLive(postUrl, timeout = 8000) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    const response = await fetch(postUrl, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}

async function getLatestUnsharedPost() {
  if (specificUrl) {
    const match = specificUrl.match(/\/posts\/([^\/]+)\/([^\/]+)/);
    if (match) {
      const postId = match[1];
      const posts = readBlogPosts();
      const post = posts.find(p => p.id === postId);
      if (post) return post;
    }
  }

  const sharedPosts = readSharedPosts();
  const allPosts = readBlogPosts();

  const unshared = allPosts
    .filter(post => !sharedPosts[post.id]?.linkedinSharedAt)
    .sort((a, b) => (b.createdAt || b.created_at || '').localeCompare(a.createdAt || a.created_at || ''))
    .slice(0, 20);

  for (const post of unshared) {
    const postUrl = `${BLOG_BASE_URL}/posts/${post.id}/${post.slug}/`;
    const live = await isUrlLive(postUrl);
    if (live) {
      return post;
    }
    console.log(`   ⚠️  Skipping ${post.id} — URL not live: ${postUrl}`);
  }

  return null;
}

function generateExcerpt(intro, maxLength = 200) {
  if (!intro) return '';

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
  let tagList = [];
  try { tagList = tags ? JSON.parse(tags) : []; } catch { tagList = []; }

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

  const titleKeywords = title
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 4 && !['about', 'using', 'guide', 'learn'].includes(word))
    .slice(0, 3);

  const allTags = [
    channel,
    ...tagList,
    ...(channelHashtags[channel] || []),
    ...titleKeywords
  ].filter(Boolean);

  const seen = new Set();
  const uniqueTags = allTags.filter(tag => {
    const lower = tag.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (seen.has(lower)) return false;
    seen.add(lower);
    return true;
  });

  return uniqueTags
    .slice(0, 10)
    .map(tag => '#' + tag.replace(/[^a-zA-Z0-9]/g, ''))
    .join(' ');
}

async function main() {
  console.log('🔍 Getting latest blog post for LinkedIn...\n');
  console.log(`📡 Blog Base URL: ${BLOG_BASE_URL}`);

  const post = await getLatestUnsharedPost();

  if (!post) {
    console.log('No unshared posts found');

    const outputFile = process.env.GITHUB_OUTPUT;
    if (outputFile) {
      fs.appendFileSync(outputFile, `has_post=false\n`);
    }
    return;
  }

  const postUrl = `${BLOG_BASE_URL}/posts/${post.id}/${post.slug}/`;
  const excerpt = generateExcerpt(post.introduction);
  const tags = formatTags(post.tags, post.channel, post.title, excerpt);

  console.log(`📝 Found post: ${post.title}`);
  console.log(`   URL: ${postUrl}`);
  console.log(`   Channel: ${post.channel}`);
  console.log(`   Tags: ${tags}`);

  let quickReference = '';
  try {
    const qr = JSON.parse(post.quick_reference || post.quickReference || '[]');
    quickReference = Array.isArray(qr) ? qr.join(' | ') : '';
  } catch (e) {
    console.warn(`   ⚠️ Failed to parse quick_reference for post ${post.id}: ${e.message}`);
    quickReference = '';
  }

  let socialHook = '';
  let socialBody = '';
  try {
    const ss = JSON.parse(post.social_snippet || post.socialSnippet || '{}');
    socialHook = ss.hook || '';
    socialBody = Array.isArray(ss.body) ? ss.body.join('\n') : (ss.body || '');
  } catch (e) {
    console.warn(`   ⚠️ Failed to parse social_snippet for post ${post.id}: ${e.message}`);
  }

  let realWorldExample = '';
  try {
    const rwe = JSON.parse(post.real_world_example || post.realWorldExample || '{}');
    if (rwe?.company && rwe?.scenario) {
      const sourceNote = rwe.sourceUrl ? ` (source: ${rwe.sourceUrl})` : '';
      realWorldExample = `${rwe.company}: ${rwe.scenario}${sourceNote}`;
    }
  } catch (e) {
    console.warn(`   ⚠️ Failed to parse real_world_example for post ${post.id}: ${e.message}`);
  }

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
    writeOutput('post_id', post.id);
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
