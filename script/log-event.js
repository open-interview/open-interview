#!/usr/bin/env node
/**
 * log-event.js — Append a structured event to client/public/data/events.json
 * 
 * Called from GitHub Actions after each significant job step.
 * 
 * Usage:
 *   node script/log-event.js \
 *     --type=deploy \
 *     --title="Site deployed to GitHub Pages" \
 *     --status=success \
 *     --workflow="ci-cd.yml" \
 *     --trigger="push" \
 *     --description="Built and deployed in 3m 12s" \
 *     --meta='{"sha":"abc1234","branch":"main"}'
 *
 * Event types:
 *   deploy          — site build & deploy
 *   bot_run         — automated bot execution (creator/verifier/processor)
 *   question_added  — new question(s) added to the database/data files
 *   blog_published  — blog post generated and published
 *   linkedin_post   — article or content posted to LinkedIn
 *   linkedin_poll   — poll posted to LinkedIn
 *   maintenance     — maintenance job (dedup, readme, sitemap, etc.)
 *   analytics       — analytics/metrics collected
 *   community       — community issue processed or label setup
 *   quality         — E2E or Lighthouse quality check
 *   learning_path   — learning path generated
 *   certification   — certification content generated
 *   voice_session   — voice sessions generated
 *   flashcard       — flashcards generated
 *   challenge       — coding challenges generated
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EVENTS_FILE = path.resolve(__dirname, '../client/public/data/events.json');
const MAX_EVENTS = 500;

// Parse CLI args  --key=value  or  --key value
function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const eqIdx = arg.indexOf('=');
      if (eqIdx !== -1) {
        const key = arg.slice(2, eqIdx);
        args[key] = arg.slice(eqIdx + 1);
      } else {
        const key = arg.slice(2);
        if (argv[i + 1] && !argv[i + 1].startsWith('--')) {
          args[key] = argv[++i];
        } else {
          args[key] = 'true';
        }
      }
    }
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));

const {
  type = 'info',
  title = 'Event',
  description = '',
  status = 'success',
  workflow = '',
  trigger = process.env.GITHUB_EVENT_NAME || '',
  actor = process.env.GITHUB_ACTOR || 'github-actions',
  sha = (process.env.GITHUB_SHA || '').slice(0, 7),
  branch = process.env.GITHUB_REF_NAME || 'main',
  run_id = process.env.GITHUB_RUN_ID || '',
  run_number = process.env.GITHUB_RUN_NUMBER || '',
  meta = '{}',
} = args;

let metadata = {};
try {
  metadata = JSON.parse(meta);
} catch {
  metadata = {};
}

// Add GitHub context to metadata
if (sha) metadata.sha = sha;
if (branch) metadata.branch = branch;
if (run_id) metadata.runId = run_id;
if (run_number) metadata.runNumber = run_number;

const event = {
  id: randomUUID(),
  timestamp: new Date().toISOString(),
  type,
  title,
  description,
  status,
  workflow,
  trigger,
  actor,
  metadata,
};

// Read existing file
let data = { version: '1.0', lastUpdated: '', events: [] };
if (fs.existsSync(EVENTS_FILE)) {
  try {
    data = JSON.parse(fs.readFileSync(EVENTS_FILE, 'utf8'));
    if (!Array.isArray(data.events)) data.events = [];
  } catch {
    data = { version: '1.0', lastUpdated: '', events: [] };
  }
}

// Prepend new event (newest first), trim to MAX_EVENTS
data.events = [event, ...data.events].slice(0, MAX_EVENTS);
data.lastUpdated = new Date().toISOString();

// Write back
fs.mkdirSync(path.dirname(EVENTS_FILE), { recursive: true });
fs.writeFileSync(EVENTS_FILE, JSON.stringify(data, null, 2));

console.log(`✅ Event logged: [${status}] ${type} — ${title}`);
console.log(`   ID: ${event.id}`);
console.log(`   File: ${EVENTS_FILE}`);
