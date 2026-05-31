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
const DATA_DIR = join(ROOT, 'client', 'public', 'data');

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
// Question files live at client/public/data/{channel}.json
// Structure: { questions: [...], subChannels: [...], ... }

function readChannelFile(channel) {
  const p = join(DATA_DIR, `${channel}.json`);
  if (!existsSync(p)) return [];
  try {
    const raw = JSON.parse(readFileSync(p, 'utf8'));
    return Array.isArray(raw) ? raw : (raw.questions || []);
  } catch { return []; }
}

function writeChannelFile(channel, questions) {
  const p = join(DATA_DIR, `${channel}.json`);
  let existing = {};
  try { existing = JSON.parse(readFileSync(p, 'utf8')); } catch {}
  if (Array.isArray(existing)) {
    writeFileSync(p, JSON.stringify(questions, null, 2));
  } else {
    writeFileSync(p, JSON.stringify({ ...existing, questions }, null, 2));
  }
}

function getChannelIds() {
  if (!existsSync(DATA_DIR)) {
    console.error(`Data directory not found: ${DATA_DIR}`);
    process.exit(1);
  }
  const channelsFile = join(DATA_DIR, 'channels.json');
  if (existsSync(channelsFile)) {
    try {
      const ch = JSON.parse(readFileSync(channelsFile, 'utf8'));
      return (Array.isArray(ch) ? ch : []).map(c => c.id).filter(Boolean);
    } catch {}
  }
  const skipFiles = new Set([
    'all-questions', 'channels', 'certifications', 'flashcards', 'blog-posts',
    'posts', 'events', 'stats', 'github-analytics', 'bot-activity', 'bot-monitor',
    'changelog', 'voice-sessions', 'coding-challenges', 'learning-paths',
    'similar-questions', 'tests', 'interviewercomments', 'history',
  ]);
  return readdirSync(DATA_DIR)
    .filter(f => f.endsWith('.json') && !f.startsWith('_'))
    .map(f => f.replace('.json', ''))
    .filter(id => !skipFiles.has(id));
}

// ── Stats helpers ──────────────────────────────────────────────────────────────

function pct(n, total) {
  if (!total) return '0.0%';
  return `${(n / total * 100).toFixed(1)}%`;
}

function percentile(sorted, pctile) {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil(pctile / 100 * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(idx, sorted.length - 1))];
}

function formatMs(ms) {
  if (ms >= 60000) return `${(ms / 60000).toFixed(1)}m`;
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.round(ms)}ms`;
}

function bar(value, max, width = 20) {
  if (!max) return '░'.repeat(width);
  const filled = Math.round((value / max) * width);
  return '█'.repeat(filled) + '░'.repeat(Math.max(0, width - filled));
}

// ── Stats collector ───────────────────────────────────────────────────────────

function createStatsCollector() {
  return {
    perChannel: {},
    global: {
      attempts: [],
      fieldCounts: { question: 0, answer: 0, eli5: 0, tldr: 0 },
      totalCandidates: 0,
      totalSkipped: 0,
      totalErrors: 0,
    },

    startChannel(channelId) {
      this.perChannel[channelId] = {
        attempts: [],
        fieldCounts: { question: 0, answer: 0, eli5: 0, tldr: 0 },
        startMs: Date.now(),
        doneMs: 0,
        candidates: 0,
        skipped: 0,
        errors: 0,
      };
    },

    endChannel(channelId) {
      this.perChannel[channelId].doneMs = Date.now();
    },

    recordAttempt(channelId, { ok, error, fields, durationMs }) {
      const ch = this.perChannel[channelId];
      if (!ch) return;
      ch.attempts.push({ ok, error, fields, durationMs });
      this.global.attempts.push({ channel: channelId, ok, error, fields, durationMs });
      if (error) {
        ch.errors++;
        this.global.totalErrors++;
      }
      if (ok && fields) {
        for (const f of Object.keys(fields)) {
          if (f in ch.fieldCounts) {
            ch.fieldCounts[f]++;
            this.global.fieldCounts[f]++;
          }
        }
      }
    },

    channelStats(channelId) {
      const ch = this.perChannel[channelId];
      if (!ch) return null;
      const total = ch.attempts.length;
      const success = ch.attempts.filter(a => a.ok).length;
      const durationMs = ch.doneMs - ch.startMs;
      const latencies = ch.attempts.map(a => a.durationMs).filter(Boolean).sort((a, b) => a - b);
      const avgLat = latencies.length ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0;
      return {
        ...ch,
        total,
        success,
        successRate: pct(success, total),
        durationMs,
        duration: formatMs(durationMs),
        avgLatencyMs: Math.round(avgLat),
        avgLatency: formatMs(avgLat),
        p50Ms: percentile(latencies, 50),
        p95Ms: percentile(latencies, 95),
        throughput: durationMs > 0 ? (success / (durationMs / 1000)).toFixed(2) : '0',
      };
    },

    globalStats(durationMs) {
      const g = this.global;
      const total = g.attempts.length;
      const success = g.attempts.filter(a => a.ok).length;
      const latencies = g.attempts.map(a => a.durationMs).filter(Boolean).sort((a, b) => a - b);
      const avgLat = latencies.length ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0;
      const maxLat = latencies.length ? latencies[latencies.length - 1] : 0;
      return {
        totalAttempts: total,
        totalSuccess: success,
        totalErrors: g.totalErrors,
        successRate: pct(success, total),
        avgLatencyMs: Math.round(avgLat),
        avgLatency: formatMs(avgLat),
        minLatencyMs: latencies.length ? latencies[0] : 0,
        maxLatencyMs: maxLat,
        p50Ms: percentile(latencies, 50),
        p95Ms: percentile(latencies, 95),
        totalDurationMs: durationMs,
        totalDuration: formatMs(durationMs),
        throughput: durationMs > 0 ? (success / (durationMs / 1000)).toFixed(2) : '0',
        fieldCounts: { ...g.fieldCounts },
      };
    },
  };
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
  const activeFields = fields.filter(f => Boolean(q[f]));
  if (activeFields.length === 0) return null;

  // Validator schema: only require question + answer.
  // eli5/tldr are best-effort — we ask for them but don't fail if missing.
  const rewriteSchema = ai.getTemplate('rewrite').schema;
  const expectedSchema = {};
  for (const f of ['question', 'answer']) {
    if (rewriteSchema[f]) expectedSchema[f] = rewriteSchema[f];
  }

  const result = await ai.run('rewrite', {
    question:   q.question,
    answer:     q.answer,
    eli5:       q.eli5,
    tldr:       q.tldr,
    channel:    q.channel,
    difficulty: q.difficulty,
    fields:     activeFields,
  }, { cache: false, schema: expectedSchema });

  const out = {};
  for (const f of activeFields) {
    if (result[f]) out[f] = result[f];
  }
  return Object.keys(out).length > 0 ? out : null;
}

// ── Per-channel processor ─────────────────────────────────────────────────────

async function processChannel(channelId, fields, dryRun, stats) {
  stats.startChannel(channelId);

  const questions = readChannelFile(channelId);
  if (questions.length === 0) {
    stats.endChannel(channelId);
    console.log(`  ⚠️  ${channelId}: no questions found`);
    return { processed: 0, skipped: 0, errors: 0 };
  }

  const candidates = questions
    .filter(q => {
      if (!q.question || !q.answer) return false;
      if (q.relevanceScore != null && q.relevanceScore >= MIN_SCORE) return false;
      return true;
    })
    .slice(0, LIMIT);

  if (candidates.length === 0) {
    stats.endChannel(channelId);
    console.log(`  ✓  ${channelId}: all ${questions.length} questions at score ≥${MIN_SCORE} — skipping`);
    return { processed: 0, skipped: questions.length, errors: 0 };
  }

  stats.perChannel[channelId].candidates = candidates.length;
  stats.perChannel[channelId].skipped = questions.length - candidates.length;
  stats.global.totalCandidates += candidates.length;
  stats.global.totalSkipped += questions.length - candidates.length;

  process.stdout.write(`  📝 ${channelId}: ${candidates.length}/${questions.length} candidates`);

  const results = await runWorkerPool(candidates, async (q, i) => {
    const t0 = Date.now();

    if (!dryRun) {
      process.stdout.write('\r' + ' '.repeat(60) + '\r');
    }

    const rewritten = await rewriteQuestion(q, fields);

    if (!dryRun) {
      const progress = `  [${i + 1}/${candidates.length}] ${channelId}`;
      process.stdout.write(`\r${progress.padEnd(50)}`);
    }
    const durationMs = Date.now() - t0;

    if (!rewritten) {
      stats.recordAttempt(channelId, { ok: false, error: 'no content', durationMs });
      return { skipped: true };
    }

    if (dryRun) {
      process.stdout.write('\n');
      console.log(`  [DRY RUN] #${i + 1} ${q.id}`);
      for (const [k, v] of Object.entries(rewritten)) {
        const before = String(q[k] || '').substring(0, 70);
        const after  = String(v).substring(0, 70);
        console.log(`    ${k}:`);
        console.log(`      BEFORE: ${before}...`);
        console.log(`      AFTER:  ${after}...`);
      }
    }

    stats.recordAttempt(channelId, { ok: true, fields: rewritten, durationMs });
    return { ok: true, id: q.id, rewritten };
  }, WORKERS);

  process.stdout.write('\r' + ' '.repeat(60) + '\r');

  let processed = 0, errors = 0;

  if (!dryRun) {
    const rewrittenMap = new Map();
    for (const r of results) {
      if (r?.ok && r.id)  rewrittenMap.set(r.id, r.rewritten);
      else if (r?.error) { errors++; }
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
  } else {
    processed = results.filter(r => r?.ok).length;
    errors    = results.filter(r => r?.error).length;
  }

  stats.endChannel(channelId);
  const ch = stats.channelStats(channelId);

  console.log(`  ┌─ ${channelId}`);
  console.log(`  │ ${bar(ch.success, ch.total)}  ${ch.success}/${ch.total} rewrites  (${ch.successRate})`);
  console.log(`  │ Latency : ${ch.avgLatency} avg  │  p50: ${formatMs(ch.p50Ms)}  │  p95: ${formatMs(ch.p95Ms)}`);
  console.log(`  │ Throughput: ${ch.throughput}/s  │  Duration: ${ch.duration}  │  Errors: ${ch.errors}`);
  if (ch.total > 0) {
    const fieldsLine = Object.entries(ch.fieldCounts)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => `${k}: ${v} (${pct(v, ch.total)})`)
      .join('  │  ');
    console.log(`  │ Fields:  ${fieldsLine}`);
  }
  console.log(`  └${'─'.repeat(50)}`);

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

  const stats = createStatsCollector();

  console.log('╔' + '═'.repeat(58) + '╗');
  console.log('║  🧠  CONTENT REWRITE AGENT — Cognitive Load Reduction          ║');
  console.log('╠' + '═'.repeat(58) + '╣');
  console.log(`║  Channels : ${(ALL_CHANNELS ? `ALL (${allIds.length})` : channelIds.join(', ')).padEnd(41)}║`);
  console.log(`║  Limit    : ${String(LIMIT).padEnd(10)} questions per channel${' '.repeat(22)}║`);
  console.log(`║  Workers  : ${String(WORKERS).padEnd(10)} parallel${' '.repeat(28)}║`);
  console.log(`║  Score    : rewrite if score < ${String(MIN_SCORE).padEnd(10)}${' '.repeat(18)}║`);
  console.log(`║  Fields   : ${fields.join(', ').padEnd(41)}║`);
  console.log(`║  Dry Run  : ${String(DRY_RUN).padEnd(41)}║`);
  console.log(`║  Provider : opencode${' '.repeat(33)}║`);
  console.log('╚' + '═'.repeat(58) + '╝\n');

  const t0 = Date.now();

  for (const id of channelIds) {
    await processChannel(id, fields, DRY_RUN, stats);
    console.log();
  }

  const elapsedMs = Date.now() - t0;
  const global = stats.globalStats(elapsedMs);

  // ── Global summary ────────────────────────────────────────────────────────

  const totalAttempts = global.totalAttempts;

  console.log('┌' + '─'.repeat(58) + '┐');
  console.log('│  📋  GLOBAL SUMMARY' + ' '.repeat(40) + '│');
  console.log('├' + '─'.repeat(58) + '┤');

  if (totalAttempts > 0) {
    const rateBar = bar(global.totalSuccess, totalAttempts);
    console.log(`│  ${rateBar}  ${global.totalSuccess}/${totalAttempts} rewrites  (${global.successRate})${' '.repeat(5)}│`);
  }

  console.log(`│  Total Errors : ${String(global.totalErrors).padEnd(42)}│`);

  if (global.avgLatencyMs > 0) {
    console.log(`│  Latency      : ${global.avgLatency.padEnd(8)} avg  │  p50: ${formatMs(global.p50Ms).padEnd(8)}  │  p95: ${formatMs(global.p95Ms).padEnd(8)}  │`);
    console.log(`│  Min: ${formatMs(global.minLatencyMs).padEnd(8)}  │  Max: ${formatMs(global.maxLatencyMs).padEnd(8)}${' '.repeat(26)}│`);
  }

  console.log(`│  Throughput   : ${String(global.throughput).padEnd(8)}/s  │  Wall Time: ${global.totalDuration.padEnd(8)}${' '.repeat(21)}│`);

  const fieldsWithData = Object.entries(global.fieldCounts).filter(([, v]) => v > 0);
  if (fieldsWithData.length > 0) {
    console.log(`├${'─'.repeat(58)}┤`);
    console.log(`│  Per-field rewrite counts:${' '.repeat(34)}│`);
    for (const [f, count] of fieldsWithData) {
      const pctStr = pct(count, totalAttempts);
      const fbar = bar(count, totalAttempts);
      console.log(`│    ${f.padEnd(12)} ${fbar}  ${String(count).padStart(5)} (${pctStr})${' '.repeat(11)}│`);
    }
  }

  console.log(`├${'─'.repeat(58)}┤`);
  console.log(`│  Channels processed: ${String(channelIds.length).padEnd(37)}│`);

  const sortedChannels = Object.entries(stats.perChannel)
    .filter(([id]) => channelIds.includes(id))
    .sort(([, a], [, b]) => (b.attempts?.length || 0) - (a.attempts?.length || 0));

  console.log(`│  ${'Channel'.padEnd(20)} ${'Rewritten'.padEnd(10)} ${'Rate'.padEnd(8)} ${'Avg'.padEnd(8)} ${'Errors'.padEnd(8)}│`);
  console.log(`│  ${'─'.repeat(20)} ${'─'.repeat(10)} ${'─'.repeat(8)} ${'─'.repeat(8)} ${'─'.repeat(8)}│`);
  for (const [id, ch] of sortedChannels) {
    const s = stats.channelStats(id);
    if (!s || s.total === 0) continue;
    console.log(`│  ${id.padEnd(20)} ${String(s.success).padStart(5)}/${String(s.total).padStart(4)} ${s.successRate.padStart(7)} ${s.avgLatency.padStart(7)} ${String(s.errors).padStart(7)}│`);
  }

  console.log('└' + '─'.repeat(58) + '┘');
  if (DRY_RUN) console.log('\n  ⚠️  DRY RUN — no changes saved. Remove --dry-run to apply.');
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
