#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DIST = path.resolve(ROOT, 'dist', 'public');
const QUESTIONS_DIR = path.resolve(ROOT, 'data', 'questions');

const indexHtmlPath = path.resolve(DIST, 'index.html');
if (!fs.existsSync(indexHtmlPath)) {
  console.error('dist/public/index.html not found — skipping route shell generation');
  process.exit(0);
}

const indexContent = fs.readFileSync(indexHtmlPath, 'utf-8');

let channelIds = [];
if (fs.existsSync(QUESTIONS_DIR)) {
  channelIds = fs.readdirSync(QUESTIONS_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => f.replace(/\.json$/, ''))
    .sort();
}

console.log(`Generating static route shells for ${channelIds.length} channels...`);

let created = 0;

function createRouteShell(routePath) {
  const dir = path.resolve(DIST, ...routePath.split('/'));
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, 'index.html');
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, indexContent);
    created++;
  }
}

const staticRoutes = [
  'about', 'badges', 'bookmarks', 'channels', 'coding',
  'notifications', 'profile', 'review', 'stats',
  'flashcards', 'tests', 'history',
  'voice-interview', 'whats-new', 'certifications',
  'manage-subscriptions',
];

for (const route of staticRoutes) {
  createRouteShell(route);
}

for (const id of channelIds) {
  createRouteShell(`channel/${id}`);
  createRouteShell(`test/${id}`);
}

console.log(`Created ${created} static route shells`);

const certRouteDirs = fs.readdirSync(DIST).filter(f => f.startsWith('certification/'));
console.log(`Static shells ready — total route directories: ${staticRoutes.length + channelIds.length * 2 + certRouteDirs.length}`);
