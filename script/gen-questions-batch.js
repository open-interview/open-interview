#!/usr/bin/env node
/**
 * Lean batch question generator — uses opencode HTTP provider directly.
 *
 * Bypasses the heavy LangGraph / RAG / quality-gate pipeline for speed.
 * Generates N questions per channel and saves them to data/questions/{channel}.json.
 *
 * Usage:
 *   node script/gen-questions-batch.js [channels] [--per-channel=N] [--concurrency=C]
 *
 * Env vars:
 *   CHANNELS        comma-separated channels (default: all 8 base channels)
 *   PER_CHANNEL     questions per channel (default: 5)
 *   CONCURRENCY     parallel channels (default: 3)
 *   OPENCODE_MODEL  AI model override
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const QUESTIONS_DIR = path.join(ROOT, 'data', 'questions');

// ── imports ───────────────────────────────────────────────────────────────────
import { call, parseResponse } from './ai/providers/opencode.js';
import { channelConfigs } from './ai/prompts/templates/generate.js';

// ── helpers ───────────────────────────────────────────────────────────────────

function readChannel(ch) {
  const fp = path.join(QUESTIONS_DIR, `${ch}.json`);
  try { return JSON.parse(fs.readFileSync(fp, 'utf8')); } catch { return []; }
}

function writeChannel(ch, data) {
  fs.mkdirSync(QUESTIONS_DIR, { recursive: true });
  fs.writeFileSync(path.join(QUESTIONS_DIR, `${ch}.json`), JSON.stringify(data, null, 2));
}

function makeId(ch, n) {
  return `${ch}-${Date.now()}-${n}`;
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── prompt builder ────────────────────────────────────────────────────────────

function buildPrompt(channel, subChannel, difficulty, companies) {
  return `You are an expert technical interview coach. Generate 1 unique interview question for the topic "${channel} / ${subChannel}" at ${difficulty} level.

Return ONLY a single valid JSON object with exactly these fields (no markdown, no extra text):
{
  "question": "A specific, practical interview question ending with ?",
  "answer": "Comprehensive answer (200-400 words). Plain text only, no markdown.",
  "explanation": "Deeper explanation covering why this matters, edge cases, and real-world usage (150-300 words). Plain text only.",
  "diagram": "flowchart TD\\n  A[Start] --> B[Step]\\n  B --> C[End]",
  "companies": ${JSON.stringify(companies)},
  "tags": ["${subChannel}", "${channel}"]
}

Requirements:
- The question must be something actually asked in real technical interviews at ${companies.join(', ')}
- Answer should demonstrate deep expertise and include specific details
- Diagram must be a valid Mermaid flowchart with at least 4 nodes
- Do not include "candidate", "interviewer", or meta-commentary`;
}

// ── validation ────────────────────────────────────────────────────────────────

function validateQuestion(q) {
  if (!q || typeof q !== 'object') return false;
  if (!q.question || !q.question.endsWith('?') || q.question.length < 20) return false;
  if (!q.answer || q.answer.length < 100) return false;
  if (!q.explanation || q.explanation.length < 50) return false;
  return true;
}

// ── per-question generation ───────────────────────────────────────────────────

async function generateOne(channel, existingQuestions, n) {
  const subs = channelConfigs[channel] || [{ subChannel: 'general', tags: [] }];
  const sub = pickRandom(subs);
  const difficulties = ['beginner', 'intermediate', 'advanced'];
  const difficulty = pickRandom(difficulties);
  const companies = pickRandom([
    ['Google', 'Meta', 'Amazon'],
    ['Microsoft', 'Apple', 'Netflix'],
    ['Stripe', 'Uber', 'Airbnb'],
    ['Cloudflare', 'Databricks', 'Snowflake'],
  ]);

  const prompt = buildPrompt(channel, sub.subChannel, difficulty, companies);

  let raw, parsed;
  let lastErr = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      raw = await call(prompt);
      parsed = parseResponse(raw);
      if (validateQuestion(parsed)) break;
      lastErr = `Invalid structure (attempt ${attempt})`;
      parsed = null;
    } catch (e) {
      lastErr = e.message;
      parsed = null;
      if (attempt < 3) await new Promise(r => setTimeout(r, 3000));
    }
  }

  if (!parsed) throw new Error(lastErr || 'Generation failed after 3 attempts');

  // Simple duplicate check by question text similarity
  const questionLower = parsed.question.toLowerCase();
  const isDuplicate = existingQuestions.some(q => {
    const existing = (q.question || '').toLowerCase();
    const words = questionLower.split(/\s+/);
    const matchCount = words.filter(w => w.length > 4 && existing.includes(w)).length;
    return matchCount / words.length > 0.7;
  });
  if (isDuplicate) throw new Error('Duplicate question detected');

  const id = makeId(channel, n);
  return {
    id,
    channel,
    subChannel: sub.subChannel,
    question: parsed.question,
    answer: parsed.answer,
    explanation: parsed.explanation,
    diagram: parsed.diagram || '',
    companies: parsed.companies || companies,
    tags: parsed.tags || sub.tags,
    difficulty,
    status: 'active',
    sourceUrl: null,
    videos: { shortVideo: null, longVideo: null },
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
  };
}

// ── channel batch ─────────────────────────────────────────────────────────────

async function generateForChannel(channel, perChannel) {
  const existing = readChannel(channel);
  const startCount = existing.length;
  const results = [...existing];
  let added = 0;
  let failed = 0;

  console.log(`\n📋 [${channel}] Starting — ${startCount} existing, targeting +${perChannel}`);

  for (let n = 0; n < perChannel; n++) {
    try {
      const q = await generateOne(channel, results, startCount + n + 1);
      results.push(q);
      added++;
      writeChannel(channel, results);
      console.log(`  ✅ [${channel}] ${added}/${perChannel}: ${q.question.slice(0, 60)}...`);
    } catch (e) {
      failed++;
      console.log(`  ❌ [${channel}] attempt ${n + 1} failed: ${e.message}`);
    }
  }

  console.log(`  📊 [${channel}] Done: +${added} added, ${failed} failed`);
  return { channel, added, failed };
}

// ── main ──────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const perChannelArg = args.find(a => a.startsWith('--per-channel='));
  const concurrencyArg = args.find(a => a.startsWith('--concurrency='));
  const noRebuild = args.includes('--no-rebuild') || process.env.NO_REBUILD === 'true';

  const perChannel = parseInt(
    perChannelArg?.split('=')[1] || process.env.PER_CHANNEL || '5',
    10,
  );
  const concurrency = parseInt(
    concurrencyArg?.split('=')[1] || process.env.CONCURRENCY || '3',
    10,
  );

  const channelsEnv = process.env.CHANNELS;
  const positionalChannels = args.filter(a => !a.startsWith('--'));
  const allBase = Object.keys(channelConfigs); // 8 base channels

  let channels;
  if (channelsEnv) {
    channels = channelsEnv.split(',').map(c => c.trim()).filter(Boolean);
  } else if (positionalChannels.length > 0) {
    channels = positionalChannels;
  } else {
    channels = allBase;
  }

  // Validate channels
  const allKnown = [...allBase];
  const invalid = channels.filter(c => !allKnown.includes(c) && !fs.existsSync(path.join(QUESTIONS_DIR, `${c}.json`)));
  if (invalid.length > 0) {
    console.warn(`⚠️  Unknown channels (will still try): ${invalid.join(', ')}`);
  }

  console.log('═══════════════════════════════════════════════════════');
  console.log('🚀 Lean Batch Question Generator');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`Channels:     ${channels.join(', ')}`);
  console.log(`Per channel:  ${perChannel}`);
  console.log(`Concurrency:  ${concurrency}`);
  console.log(`Total target: ${channels.length * perChannel} questions`);
  console.log('═══════════════════════════════════════════════════════');

  const summary = [];

  // Process in batches of `concurrency`
  for (let i = 0; i < channels.length; i += concurrency) {
    const batch = channels.slice(i, i + concurrency);
    console.log(`\n🔄 Batch ${Math.floor(i / concurrency) + 1}/${Math.ceil(channels.length / concurrency)}: ${batch.join(', ')}`);

    const batchResults = await Promise.all(
      batch.map(ch => generateForChannel(ch, perChannel).catch(e => ({
        channel: ch,
        added: 0,
        failed: perChannel,
        error: e.message,
      }))),
    );
    summary.push(...batchResults);
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('📊 FINAL SUMMARY');
  console.log('═══════════════════════════════════════════════════════');
  let totalAdded = 0;
  let totalFailed = 0;
  for (const r of summary) {
    const status = r.added > 0 ? '✅' : '❌';
    console.log(`  ${status} ${r.channel}: +${r.added} added, ${r.failed} failed`);
    totalAdded += r.added;
    totalFailed += r.failed;
  }
  console.log(`\nTotal added:  ${totalAdded}`);
  console.log(`Total failed: ${totalFailed}`);
  console.log('═══════════════════════════════════════════════════════');

  // Rebuild static files
  if (totalAdded > 0 && !noRebuild) {
    console.log('\n🔄 Rebuilding static data files...');
    try {
      const { execFileSync } = await import('child_process');
      execFileSync('node', ['script/fetch-questions-for-build.js'], {
        cwd: ROOT,
        stdio: 'inherit',
        timeout: 60000,
      });
      console.log('✅ Static data rebuilt');
    } catch (e) {
      console.warn('⚠️  Static rebuild failed (non-fatal):', e.message);
    }
  } else if (noRebuild) {
    console.log('\n⏭️  Skipping static rebuild (--no-rebuild)');
  }
}

main().catch(e => {
  console.error('Fatal:', e);
  process.exit(1);
});
