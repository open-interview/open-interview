#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DIST = path.resolve(ROOT, 'dist', 'public');
const QUESTIONS_DIR = path.resolve(ROOT, 'data', 'questions');
const PUBLIC_DATA_DIR = path.resolve(ROOT, 'client', 'public', 'data');

const indexHtmlPath = path.resolve(DIST, 'index.html');
if (!fs.existsSync(indexHtmlPath)) {
  console.error('dist/public/index.html not found — skipping route shell generation');
  process.exit(0);
}

const indexContent = fs.readFileSync(indexHtmlPath, 'utf-8');

function readChannelIds(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.json'))
    .map(f => f.replace(/\.json$/, ''));
}

const primaryIds = new Set(readChannelIds(QUESTIONS_DIR));
const fallbackIds = new Set(readChannelIds(PUBLIC_DATA_DIR));
const channelIds = [...new Set([...primaryIds, ...fallbackIds])].sort();

console.log(`Channel IDs: ${primaryIds.size} from data/questions/, ${fallbackIds.size} from client/public/data/ → ${channelIds.length} unique`);
console.log(`Generating static route shells for ${channelIds.length} channels...`);

let created = 0;

function createRouteShell(routePath) {
  const dir = path.resolve(DIST, ...routePath.split('/'));
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, 'index.html');
  const existed = fs.existsSync(filePath);
  fs.writeFileSync(filePath, indexContent);
  if (!existed) created++;
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

console.log(`Created/updated ${created} new static route shells`);

const routeDirs = fs.readdirSync(DIST, { withFileTypes: true }).filter(d => d.isDirectory()).length;
console.log(`Static shells ready — total route directories in dist: ${routeDirs}`);
