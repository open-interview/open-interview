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
import { runWithConcurrency, createProgressReporter } from './run-with-concurrency.js';

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
  "question": "A short, direct interview question ending with ? (max 120 chars)",
  "answer": "Concise answer (max 150 characters). One sentence. No markdown.",
  "explanation": "Brief explanation (max 250 characters, 2-3 sentences). Direct and concise.",
  "diagram": "flowchart TD\\n  A[Start] --> B[Step]\\n  B --> C[End]",
  "companies": ${JSON.stringify(companies)},
  "tags": ["${subChannel}", "${channel}"]
}

Requirements:
- Question must be max 120 characters
- Answer must be max 150 characters (one sentence)
- Keep everything SHORT and direct
- The question must be something actually asked in real technical interviews at ${companies.join(', ')}
- Answer should be concise and factual
- Diagram must be a valid Mermaid flowchart with at least 4 nodes
- Do not include "candidate", "interviewer", or meta-commentary`;
}

// ── validation ────────────────────────────────────────────────────────────────

function validateQuestion(q) {
  if (!q || typeof q !== 'object') return false;
  if (!q.question || !q.question.endsWith('?') || q.question.length < 20) return false;
  if (!q.answer || q.answer.length < 10) return false;
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

// ── single question generation (for parallel queue) ──────────────────────────

async function generateOneForChannel(channel, questionIndex, existingQuestions) {
  try {
    const q = await generateOne(channel, existingQuestions, questionIndex);
    return { success: true, channel, question: q };
  } catch (e) {
    return { success: false, channel, error: e.message };
  }
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
    concurrencyArg?.split('=')[1] || process.env.CONCURRENCY || '20',
    10,
  );

  const channelsEnv = process.env.CHANNELS;
  const positionalChannels = args.filter(a => !a.startsWith('--'));
  const allBase = Object.keys(channelConfigs);

  let channels;
  if (channelsEnv) {
    channels = channelsEnv.split(',').map(c => c.trim()).filter(Boolean);
  } else if (positionalChannels.length > 0) {
    channels = positionalChannels;
  } else {
    channels = allBase;
  }

  const allKnown = [...allBase];
  const invalid = channels.filter(c => !allKnown.includes(c) && !fs.existsSync(path.join(QUESTIONS_DIR, `${c}.json`)));
  if (invalid.length > 0) {
    console.warn(`⚠️  Unknown channels (will still try): ${invalid.join(', ')}`);
  }

  const totalTasks = channels.length * perChannel;

  console.log('═══════════════════════════════════════════════════════');
  console.log('🚀 Lean Batch Question Generator');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`Channels:     ${channels.join(', ')}`);
  console.log(`Per channel:  ${perChannel}`);
  console.log(`Concurrency:  ${concurrency} (parallel consumer queue)`);
  console.log(`Total target: ${totalTasks} questions`);
  console.log('═══════════════════════════════════════════════════════');

  // ── Build task queue ───────────────────────────────────────────
  // Each task = one question to generate for one channel
  const tasks = [];
  const channelExistingQuestions = {};

  for (const ch of channels) {
    const existing = readChannel(ch);
    channelExistingQuestions[ch] = existing;
    for (let n = 0; n < perChannel; n++) {
      tasks.push({ channel: ch, questionIndex: existing.length + n + 1, existingQuestions: existing });
    }
  }

  // ── Shared state for incremental save ──────────────────────────
  const byChannel = {};
  const pendingByChannel = {};
  for (const ch of channels) {
    byChannel[ch] = { added: 0, failed: 0 };
    pendingByChannel[ch] = [];
  }

  let completedCount = 0;
  let lastSavePct = 0;
  const SAVE_INTERVAL = 0.1; // save every 10% completion

  async function flushPending() {
    for (const [ch, pending] of Object.entries(pendingByChannel)) {
      if (pending.length === 0) continue;
      const existing = readChannel(ch);
      existing.push(...pending);
      writeChannel(ch, existing);
      pending.length = 0;
    }
  }

  const reporter = createProgressReporter('Questions');

  // ── Run with parallel consumer queue ───────────────────────────
  const results = await runWithConcurrency(tasks, concurrency, async (task) => {
    const result = await generateOneForChannel(task.channel, task.questionIndex, task.existingQuestions);
    if (result.success) {
      byChannel[result.channel].added++;
      pendingByChannel[result.channel].push(result.question);
    } else {
      byChannel[result.channel].failed++;
    }
    completedCount++;
    const pct = completedCount / totalTasks;
    // Incremental save every 10% to prevent data loss on interruption
    if (pct - lastSavePct >= SAVE_INTERVAL) {
      await flushPending();
      lastSavePct = pct;
    }
    return result;
  }, reporter);

  // Final save of any remaining
  await flushPending();

  // ── Final summary ──────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('📊 FINAL SUMMARY');
  console.log('═══════════════════════════════════════════════════════');
  let totalAdded = 0;
  let totalFailed = 0;
  for (const ch of channels) {
    const s = byChannel[ch];
    const status = s.added > 0 ? '✅' : '❌';
    console.log(`  ${status} ${ch}: +${s.added} added, ${s.failed} failed`);
    totalAdded += s.added;
    totalFailed += s.failed;
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
