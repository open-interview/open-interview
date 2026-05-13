#!/usr/bin/env node
/**
 * Flashcard Bot — bulk generation via OpenCode, WorkerPool concurrency=10
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { getDb, initBotTables } from './shared/db.js';
import { startRun, completeRun, failRun, updateRunStats } from './shared/runs.js';
import { generateFlashcardsParallel, ensureTable } from '../ai/graphs/flashcard-graph.js';

const BOT_NAME   = 'flashcard';
const CONCURRENCY = 10;
const BATCH_SIZE  = 10;

const QUESTIONS_DIR = path.join(process.cwd(), 'data', 'questions');

function readQuestions(ch) {
  try {
    return JSON.parse(fs.readFileSync(path.join(QUESTIONS_DIR, `${ch}.json`), 'utf8'));
  } catch { return []; }
}

function readAllQuestions() {
  let files = [];
  try { files = fs.readdirSync(QUESTIONS_DIR); } catch { return []; }
  const all = [];
  for (const f of files) {
    if (!f.endsWith('.json')) continue;
    try { all.push(...JSON.parse(fs.readFileSync(path.join(QUESTIONS_DIR, f), 'utf8'))); } catch {}
  }
  return all;
}

async function fetchPendingQuestions({ channel, limit }) {
  const db = getDb();
  const allQuestions = readAllQuestions().filter(q => q.status === 'active');
  const flashcards = db.readArray('flashcards.json');
  const flashcardQuestionIds = new Set(flashcards.map(f => f.question_id));
  let pending = allQuestions.filter(q => !flashcardQuestionIds.has(q.id));

  if (channel) {
    pending = pending.filter(q => q.channel === channel);
  }

  // Count flashcards per channel for ordering
  const flashcardCounts = {};
  for (const f of flashcards) {
    flashcardCounts[f.channel] = (flashcardCounts[f.channel] || 0) + 1;
  }
  pending.sort((a, b) => (flashcardCounts[a.channel] || 0) - (flashcardCounts[b.channel] || 0));

  if (limit) {
    pending = pending.slice(0, limit);
  }

  return pending.map(q => ({
    id: q.id,
    question: q.question,
    answer: q.answer,
    channel: q.channel,
    difficulty: q.difficulty,
    tags: q.tags || []
  }));
}

async function main() {
  console.log('=== 🃏 Flashcard Bot (concurrency=' + CONCURRENCY + ') ===\n');

  await initBotTables();
  await ensureTable();

  const argv    = process.argv.slice(2);
  const get     = name => {
    const eq = argv.find(a => a.startsWith(`--${name}=`));
    if (eq) return eq.split('=')[1];
    const i = argv.indexOf(`--${name}`);
    return i !== -1 ? argv[i + 1] : null;
  };
  const channel = get('channel');
  const limit   = get('limit') ? parseInt(get('limit')) : null;
  const dryRun  = argv.includes('--dry-run');

  const questions = await fetchPendingQuestions({ channel, limit });
  console.log(`Found ${questions.length} questions without flashcards`);
  if (questions.length > 0) {
    const topChannels = [...new Set(questions.slice(0, 10).map(q => q.channel))];
    console.log(`Prioritized channels (least flashcards first): ${topChannels.join(', ')}`);
  }

  if (dryRun) {
    console.log('--dry-run: exiting without generating.');
    process.exit(0);
  }

  if (questions.length === 0) {
    console.log('Nothing to do.');
    process.exit(0);
  }

  const run = await startRun(BOT_NAME);

  try {
    const results = await generateFlashcardsParallel(questions, {
      concurrency: CONCURRENCY,
      batchSize:   BATCH_SIZE,
    });

    const stats = {
      processed: results.stats.total,
      created:   results.stats.completed,
      updated:   0,
      deleted:   0,
    };

    await updateRunStats(run.id, stats);
    await completeRun(run.id, stats, { failed: results.stats.failed });

    console.log(`\nDone. Created: ${stats.created} / Failed: ${results.stats.failed}`);
  } catch (err) {
    console.error('Fatal:', err);
    await failRun(run.id, err);
    process.exit(1);
  }
}

const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) main().catch(console.error);

export default { main };
