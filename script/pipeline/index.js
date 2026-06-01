#!/usr/bin/env node

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { getAllChannelsFromDb } from '../utils.js';
import { detectOptimalWorkers } from './workers.js';
import { registerStage, runStages, listStages } from './orchestrator.js';

// ── Register all available stages ────────────────────────────────────────────

import rewriteStage from './stages/rewrite.js';
import generateStage from './stages/generate.js';
import certifyStage from './stages/certify.js';
import blogStage from './stages/blog.js';
import similarStage from './stages/similar.js';
import voiceStage from './stages/voice.js';
import embedStage from './stages/embed.js';

registerStage('rewrite', rewriteStage);
registerStage('generate', generateStage);
registerStage('certify', certifyStage);
registerStage('blog', blogStage);
registerStage('similar', similarStage);
registerStage('voice', voiceStage);
registerStage('embed', embedStage);

// ── CLI argument parsing ─────────────────────────────────────────────────────

process.env.EMBEDDING_MODEL = 'tfidf';
const args = process.argv.slice(2);
const getArg = name => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : null; };
const hasFlag = name => args.includes(`--${name}`);

const STAGE_ARG      = getArg('stage') || 'rewrite';
const CHANNEL_ARG    = getArg('channel');
const ALL_CHANNELS   = hasFlag('all');
const LIMIT          = parseInt(getArg('limit') || getArg('max') || '50', 10);
const WORKERS        = hasFlag('workers') ? parseInt(getArg('workers'), 10) : null;
const DRY_RUN        = hasFlag('dry-run');
const FIELD_FILTER   = getArg('field');
const MIN_SCORE      = parseInt(getArg('min-score') || '70', 10);
const FORCE          = hasFlag('force');
const LIST           = hasFlag('list');

if (LIST) {
  console.log('\nAvailable pipeline stages:\n');
  for (const s of listStages()) {
    console.log(`  ${s.name.padEnd(20)} ${s.description}`);
  }
  console.log();
  process.exit(0);
}

if (!CHANNEL_ARG && !ALL_CHANNELS) {
  console.error('Usage: node script/pipeline/index.js --stage rewrite,blog --all [--limit 200]');
  console.error('       node script/pipeline/index.js --stage generate --channel algorithms [--limit 5]');
  console.error('       node script/pipeline/index.js --list');
  console.error('\nStages: rewrite, generate, certify, blog, similar, voice, embed');
  process.exit(1);
}

// ── Resolve channels ─────────────────────────────────────────────────────────

async function resolveChannels() {
  if (CHANNEL_ARG) return CHANNEL_ARG.split(',').map(c => c.trim()).filter(Boolean);

  const ids = await getAllChannelsFromDb();
  const skipFiles = new Set([
    'all-questions', 'channels', 'certifications', 'flashcards', 'blog-posts',
    'posts', 'events', 'stats', 'github-analytics', 'bot-activity', 'bot-monitor',
    'changelog', 'voice-sessions', 'coding-challenges', 'learning-paths',
    'similar-questions', 'tests', 'interviewercomments', 'history',
  ]);

  const dataDir = join(process.cwd(), 'client', 'public', 'data');
  if (existsSync(dataDir)) {
    const { readdirSync } = await import('fs');
    return readdirSync(dataDir)
      .filter(f => f.endsWith('.json') && !f.startsWith('_'))
      .map(f => f.replace('.json', ''))
      .filter(id => !skipFiles.has(id));
  }

  return ids;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const stages = STAGE_ARG.split(',').map(s => s.trim()).filter(Boolean);
  const channelIds = await resolveChannels();

  if (channelIds.length === 0) {
    console.error('❌ No channels found');
    process.exit(1);
  }

  const options = {
    limit: LIMIT,
    dryRun: DRY_RUN,
    minScore: MIN_SCORE,
    force: FORCE,
    fields: FIELD_FILTER ? FIELD_FILTER.split(',').map(f => f.trim()) : null,
    workers: WORKERS || detectOptimalWorkers(),
    dataDir: 'client/public/data',
  };

  const results = await runStages({
    stages,
    channelIds,
    options,
    title: `🧠  CONTENT PIPELINE — ${stages.join(', ')}`,
  });

  console.log('\n✨ Pipeline complete\n');
}

main().catch(err => {
  console.error('❌ Fatal:', err);
  process.exit(1);
});
