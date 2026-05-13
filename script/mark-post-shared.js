#!/usr/bin/env node

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const postId = process.env.POST_ID;
const linkedInId = process.env.POST_LINKEDIN_ID;
const SHARED_POSTS_FILE = path.join(__dirname, '..', 'data', 'shared-posts.json');

if (!postId) {
  console.error('❌ Missing POST_ID environment variable');
  process.exit(1);
}

function readSharedPosts() {
  if (!fs.existsSync(SHARED_POSTS_FILE)) return {};
  try { return JSON.parse(fs.readFileSync(SHARED_POSTS_FILE, 'utf8')); } catch { return {}; }
}

function writeSharedPosts(data) {
  const dir = path.dirname(SHARED_POSTS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(SHARED_POSTS_FILE, JSON.stringify(data, null, 2));
}

async function markAsShared() {
  console.log(`📝 Marking post ${postId} as shared on LinkedIn...`);

  const now = new Date().toISOString();
  const sharedPosts = readSharedPosts();

  if (!sharedPosts[postId]) {
    sharedPosts[postId] = {};
  }
  sharedPosts[postId].linkedinSharedAt = now;
  if (linkedInId) {
    sharedPosts[postId].linkedinPostId = linkedInId;
  }

  writeSharedPosts(sharedPosts);
  console.log('✅ Post marked as shared');
}

markAsShared().catch(console.error);
