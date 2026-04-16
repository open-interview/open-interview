#!/usr/bin/env node
/**
 * Flashcard Bot
 * Generates flashcards (front, back, hint, mnemonic) for existing questions.
 */

import 'dotenv/config';
import { getDb, initBotTables } from './shared/db.js';
import { startRun, completeRun, failRun, updateRunStats } from './shared/runs.js';
import ai from '../ai/index.js';

const BOT_NAME = 'flashcard';
const BATCH_SIZE = 20;
const db = getDb();

async function ensureTable() {
  await db.execute(`CREATE TABLE IF NOT EXISTS flashcards (
    id TEXT PRIMARY KEY, question_id TEXT, front TEXT, back TEXT,
    hint TEXT, mnemonic TEXT, channel TEXT, difficulty TEXT,
    tags TEXT, created_at TEXT, updated_at TEXT
  )`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_fc_channel ON flashcards(channel)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_fc_qid ON flashcards(question_id)`);
}

async function fetchQuestions({ channel, limit }) {
  await ensureTable();
  // Get question IDs that already have flashcards
  const existing = await db.execute('SELECT question_id FROM flashcards');
  const existingIds = new Set(existing.rows.map(r => r.question_id));

  let sql = `SELECT id, question, answer FROM questions WHERE status = 'active'`;
  const args = [];

  if (channel) {
    sql += ' AND channel = ?';
    args.push(channel);
  }

  if (limit) {
    sql += ' LIMIT ?';
    args.push(limit);
  }

  const result = await db.execute({ sql, args });
  return result.rows.filter(r => !existingIds.has(r.id));
}

async function saveFlashcard(questionId, channel, card) {
  await db.execute({
    sql: `INSERT INTO flashcards (id, question_id, channel, front, back, hint, mnemonic, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      crypto.randomUUID(),
      questionId,
      channel || null,
      card.front.substring(0, 100),
      card.back.substring(0, 300),
      card.hint,
      card.mnemonic,
      new Date().toISOString(),
      new Date().toISOString()
    ]
  });
}

async function processBatch(questions) {
  const stats = { created: 0, failed: 0 };

  for (const q of questions) {
    try {
      const card = await ai.run('flashcard', { question: q.question, answer: q.answer });
      await saveFlashcard(q.id, q.channel, card);
      console.log(`  ✅ ${q.id}`);
      stats.created++;
    } catch (e) {
      console.error(`  ❌ ${q.id}: ${e.message}`);
      stats.failed++;
    }
  }

  return stats;
}

async function main() {
  console.log('=== 🃏 Flashcard Bot ===\n');

  await initBotTables();

  const args = process.argv.slice(2);
  const channel = args.find((_, i) => args[i - 1] === '--channel') || null;
  const limitArg = args.find((_, i) => args[i - 1] === '--limit');
  const limit = limitArg ? parseInt(limitArg) : null;

  const run = await startRun(BOT_NAME);
  const stats = { processed: 0, created: 0, updated: 0, deleted: 0 };

  try {
    const questions = await fetchQuestions({ channel, limit });
    console.log(`Found ${questions.length} questions without flashcards\n`);

    for (let i = 0; i < questions.length; i += BATCH_SIZE) {
      const batch = questions.slice(i, i + BATCH_SIZE);
      console.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} questions`);

      const result = await processBatch(batch);
      stats.processed += batch.length;
      stats.created += result.created;

      await updateRunStats(run.id, stats);
    }

    await completeRun(run.id, stats, { message: 'Flashcard Bot completed' });

    console.log(`\nDone. Created: ${stats.created} / Processed: ${stats.processed}`);
  } catch (error) {
    console.error('Fatal error:', error);
    await failRun(run.id, error);
    process.exit(1);
  }
}

const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  main().catch(console.error);
}

export default { main };
