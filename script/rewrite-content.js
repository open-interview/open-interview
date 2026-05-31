#!/usr/bin/env node
/**
 * Content Rewrite Agent — Cognitive Load Reduction
 *
 * Rewrites question, answer, eli5, and tldr fields using the existing opencode
 * AI provider to reduce cognitive load without losing technical accuracy.
 *
 * Usage:
 *   node script/rewrite-content.js --channel algorithms
 *   node script/rewrite-content.js --channel algorithms,react --limit 50
 *   node script/rewrite-content.js --all --limit 200
 *   node script/rewrite-content.js --dry-run --channel react --limit 5
 *   node script/rewrite-content.js --channel system-design --field answer
 *
 * Options:
 *   --channel <id>    Channel(s) to rewrite, comma-separated
 *   --all             Process all channels
 *   --limit <n>       Max questions per channel (default: 50)
 *   --workers <n>     Parallel workers (default: 3)
 *   --dry-run         Preview without saving
 *   --field <name>    Only rewrite one field: question | answer | eli5 | tldr
 *   --min-score <n>   Skip questions with relevance score >= N (default: 70)
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import ai from './ai/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const QUESTIONS_DIR = join(ROOT, 'client', 'public', 'data', 'questions');

// ── Argument parsing ──────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const getArg  = name => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : null; };
const hasFlag = name => args.includes(`--${name}`);

const CHANNEL_ARG  = getArg('channel');
const ALL_CHANNELS = hasFlag('all');
const LIMIT        = parseInt(getArg('limit')     || '50', 10);
const WORKERS      = parseInt(getArg('workers')   || '3',  10);
const DRY_RUN      = hasFlag('dry-run');
const FIELD_FILTER = getArg('field');
const MIN_SCORE    = parseInt(getArg('min-score') || '70', 10);

if (!CHANNEL_ARG && !ALL_CHANNELS) {
  console.error('Usage: node script/rewrite-content.js --channel <id> [--limit 50] [--dry-run]');
  console.error('       node script/rewrite-content.js --all [--limit 200]');
  process.exit(1);
}

// ── File helpers ──────────────────────────────────────────────────────────────

function readChannelFile(channel) {
  const p = join(QUESTIONS_DIR, `${channel}.json`);
  if (!existsSync(p)) return [];
  try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return []; }
}

function writeChannelFile(channel, questions) {
  const p = join(QUESTIONS_DIR, `${channel}.json`);
  writeFileSync(p, JSON.stringify(questions, null, 2));
}

function getChannelIds() {
  if (!existsSync(QUESTIONS_DIR)) {
    console.error(`Questions directory not found: ${QUESTIONS_DIR}`);
    process.exit(1);
  }
  return readdirSync(QUESTIONS_DIR)
    .filter(f => f.endsWith('.json') && !f.startsWith('_'))
    .map(f => f.replace('.json', ''));
}

// ── Worker pool ───────────────────────────────────────────────────────────────

async function runWorkerPool(tasks, workerFn, concurrency) {
  const results = new Array(tasks.length);
  let idx = 0;
  async function worker() {
    while (idx < tasks.length) {
      const i = idx++;
      try { results[i] = await workerFn(tasks[i], i); }
      catch (err) { results[i] = { error: err.message }; }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  return results;
}

// ── Per-question rewriter ─────────────────────────────────────────────────────

async function rewriteQuestion(q, fields) {
  // Only pass fields that actually have content on this question
  const activeFields = fields.filter(f => Boolean(q[f]));
  if (activeFields.length === 0) return null;

  const result = await ai.run('rewrite', {
    question:   q.question,
    answer:     q.answer,
    eli5:       q.eli5,
    tldr:       q.tldr,
    channel:    q.channel,
    difficulty: q.difficulty,
    fields:     activeFields,
  }, { cache: false });

  // Keep only the requested fields from the response
  const out = {};
  for (const f of activeFields) {
    if (result[f]) out[f] = result[f];
  }
  return Object.keys(out).length > 0 ? out : null;
}

// ── Per-channel processor ─────────────────────────────────────────────────────

async function processChannel(channelId, fields, dryRun) {
  const questions = readChannelFile(channelId);
  if (questions.length === 0) {
    console.log(`  ⚠️  ${channelId}: no questions found`);
    return { processed: 0, skipped: 0, errors: 0 };
  }

  // Candidate selection: skip questions with a high relevance score
  const candidates = questions
    .filter(q => {
      if (!q.question || !q.answer) return false;
      if (q.relevanceScore != null && q.relevanceScore >= MIN_SCORE) return false;
      return true;
    })
    .slice(0, LIMIT);

  if (candidates.length === 0) {
    console.log(`  ✓  ${channelId}: all ${questions.length} questions at score ≥${MIN_SCORE} — skipping`);
    return { processed: 0, skipped: questions.length, errors: 0 };
  }

  console.log(`  📝 ${channelId}: ${candidates.length}/${questions.length} candidates (score < ${MIN_SCORE})`);

  const results = await runWorkerPool(candidates, async (q, i) => {
    const rewritten = await rewriteQuestion(q, fields);
    if (!rewritten) return { skipped: true };

    if (dryRun) {
      console.log(`\n  [DRY RUN] #${i + 1} ${q.id}`);
      for (const [k, v] of Object.entries(rewritten)) {
        const before = String(q[k] || '').substring(0, 70);
        const after  = String(v).substring(0, 70);
        console.log(`    ${k}:`);
        console.log(`      BEFORE: ${before}...`);
        console.log(`      AFTER:  ${after}...`);
      }
      return { ok: true, dryRun: true };
    }

    return { ok: true, id: q.id, rewritten };
  }, WORKERS);

  let processed = 0, errors = 0;

  if (!dryRun) {
    const rewrittenMap = new Map();
    for (const r of results) {
      if (r?.ok && r.id)  rewrittenMap.set(r.id, r.rewritten);
      else if (r?.error) { console.error(`  ❌ ${r.error}`); errors++; }
    }

    const updated = questions.map(q => {
      const rw = rewrittenMap.get(q.id);
      if (!rw) return q;
      processed++;
      return {
        ...q,
        ...rw,
        lastRewritten: new Date().toISOString(),
        rewriteVersion: (q.rewriteVersion || 0) + 1,
      };
    });

    writeChannelFile(channelId, updated);
    console.log(`  ✅ ${channelId}: saved ${processed} rewrites, ${errors} errors`);
  } else {
    processed = results.filter(r => r?.ok).length;
    errors    = results.filter(r => r?.error).length;
    console.log(`\n  [DRY RUN] ${channelId}: would rewrite ${processed} questions\n`);
  }

  return { processed, skipped: questions.length - candidates.length, errors };
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const allIds = getChannelIds();

  let channelIds;
  if (ALL_CHANNELS) {
    channelIds = allIds;
  } else {
    channelIds = CHANNEL_ARG.split(',').map(s => s.trim());
    const invalid = channelIds.filter(id => !allIds.includes(id));
    if (invalid.length) {
      console.error(`Unknown channel(s): ${invalid.join(', ')}`);
      console.error(`Available (sample): ${allIds.slice(0, 12).join(', ')}`);
      process.exit(1);
    }
  }

  const fields = FIELD_FILTER
    ? [FIELD_FILTER]
    : ['question', 'answer', 'eli5', 'tldr'];

  console.log('═'.repeat(60));
  console.log('🧠 CONTENT REWRITE AGENT — Cognitive Load Reduction');
  console.log('═'.repeat(60));
  console.log(`Channels : ${ALL_CHANNELS ? `ALL (${allIds.length})` : channelIds.join(', ')}`);
  console.log(`Limit    : ${LIMIT} questions per channel`);
  console.log(`Workers  : ${WORKERS} parallel`);
  console.log(`Min Score: rewrite if score < ${MIN_SCORE}`);
  console.log(`Fields   : ${fields.join(', ')}`);
  console.log(`Dry Run  : ${DRY_RUN}`);
  console.log(`Provider : opencode`);
  console.log('═'.repeat(60) + '\n');

  let totalProcessed = 0, totalSkipped = 0, totalErrors = 0;
  const t0 = Date.now();

  for (const id of channelIds) {
    const { processed, skipped, errors } = await processChannel(id, fields, DRY_RUN);
    totalProcessed += processed;
    totalSkipped   += skipped;
    totalErrors    += errors;
  }

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

  console.log('\n' + '═'.repeat(60));
  console.log('📋 SUMMARY');
  console.log('═'.repeat(60));
  console.log(`Rewritten : ${totalProcessed}`);
  console.log(`Skipped   : ${totalSkipped}`);
  console.log(`Errors    : ${totalErrors}`);
  console.log(`Time      : ${elapsed}s`);
  if (DRY_RUN) console.log('\n⚠️  DRY RUN — no changes saved. Remove --dry-run to apply.');
  console.log('═'.repeat(60));
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
