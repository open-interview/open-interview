/**
 * Flashcard Generation Graph
 * LangGraph-style pipeline using OpenCode, bulk WorkerPool concurrency=10
 */

import { WorkerPool } from './parallel-bot-executor.js';
import ai from '../index.js';
import os from 'os';
import { getDb } from '../../bots/shared/db.js';
import { safeConcurrency } from '../providers/opencode.js';

const db = getDb();

export async function ensureTable() {
  await db.execute(`CREATE TABLE IF NOT EXISTS flashcards (
    id TEXT PRIMARY KEY, question_id TEXT, channel TEXT, difficulty TEXT,
    tags TEXT, front TEXT NOT NULL, back TEXT NOT NULL,
    hint TEXT, mnemonic TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT
  )`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_fc_channel ON flashcards(channel)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_fc_qid ON flashcards(question_id)`);
}

/**
 * Generate and persist a single flashcard via OpenCode
 */
export async function generateFlashcard(input) {
  const { id: questionId, question, answer, channel, difficulty, tags } = input;

  const card = await ai.run('flashcard', { question, answer });

  const flashcardId = crypto.randomUUID();
  await db.execute({
    sql: `INSERT OR IGNORE INTO flashcards
          (id, question_id, channel, difficulty, tags, front, back, hint, mnemonic, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      flashcardId, questionId, channel ?? null, difficulty ?? null,
      tags ?? null,
      (card.front ?? '').substring(0, 100),
      (card.back  ?? '').substring(0, 300),
      card.hint     ?? null,
      card.mnemonic ?? null,
      new Date().toISOString(),
      new Date().toISOString(),
    ],
  });

  return { success: true, flashcardId, card };
}

/**
 * Bulk-generate flashcards using WorkerPool (concurrency=10, batchSize=10)
 */
export async function generateFlashcardsParallel(questions, options = {}) {
  await ensureTable();

  const concurrency = safeConcurrency(options.concurrency ?? 10);
  console.log(`🧠 Memory-safe concurrency: ${concurrency} (${Math.floor(os.freemem()/1024/1024)} MB free)`);

  const pool = new WorkerPool({
    maxConcurrency: concurrency,
    batchSize:      options.batchSize  ?? 10,
    taskTimeout:    options.timeout    ?? 120_000,
    retryAttempts:  2,
    rateLimitDelay: 300,
  });

  const tasks = questions.map(q => ({
    id:   `fc-${q.id}`,
    fn:   generateFlashcard,
    args: [q],
  }));

  pool.addTasks(tasks);
  return pool.execute();
}

export default { generateFlashcard, generateFlashcardsParallel };
