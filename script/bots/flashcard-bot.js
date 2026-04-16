#!/usr/bin/env node
/**
 * Flashcard Bot — bulk generation via OpenCode, WorkerPool concurrency=10
 */

import 'dotenv/config';
import { getDb, initBotTables } from './shared/db.js';
import { startRun, completeRun, failRun, updateRunStats } from './shared/runs.js';
import { generateFlashcardsParallel, ensureTable } from '../ai/graphs/flashcard-graph.js';

const BOT_NAME   = 'flashcard';
const CONCURRENCY = 10;
const BATCH_SIZE  = 10;

async function fetchPendingQuestions({ channel, limit }) {
  const db = getDb();

  const existing = await db.execute('SELECT question_id FROM flashcards');
  const done = new Set(existing.rows.map(r => r.question_id));

  let sql  = `SELECT id, question, answer, channel, difficulty, tags FROM questions WHERE status = 'active'`;
  const args = [];
  if (channel) { sql += ' AND channel = ?'; args.push(channel); }
  if (limit)   { sql += ' LIMIT ?';         args.push(limit);   }

  const result = await db.execute({ sql, args });
  return result.rows.filter(r => !done.has(r.id));
}

async function main() {
  console.log('=== 🃏 Flashcard Bot (concurrency=' + CONCURRENCY + ') ===\n');

  await initBotTables();
  await ensureTable();

  const argv    = process.argv.slice(2);
  const get     = name => { const a = argv.find((_, i) => argv[i-1] === `--${name}`); return a ?? null; };
  const channel = get('channel');
  const limit   = get('limit') ? parseInt(get('limit')) : null;
  const dryRun  = argv.includes('--dry-run');

  const questions = await fetchPendingQuestions({ channel, limit });
  console.log(`Found ${questions.length} questions without flashcards`);

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
