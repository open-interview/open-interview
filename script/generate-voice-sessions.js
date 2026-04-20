#!/usr/bin/env node
/**
 * Generate Voice Sessions from Postgres
 *
 * Reads voice-suitable questions from Postgres (not static files),
 * generates micro-question sessions, and saves back to Postgres.
 * Uses WorkerPool parallel pattern (same as flashcard-bot.js).
 *
 * Usage:
 *   node script/generate-voice-sessions.js
 *   node script/generate-voice-sessions.js --channel=system-design --limit=20
 *   node script/generate-voice-sessions.js --dry-run
 */

import 'dotenv/config';
import { getDb, initBotTables } from './bots/shared/db.js';
import { startRun, completeRun, failRun, updateRunStats } from './bots/shared/runs.js';
import { WorkerPool } from './ai/graphs/parallel-bot-executor.js';

const BOT_NAME = 'voice-sessions';
const CONCURRENCY = 6;
const BATCH_SIZE = 10;

// Parse CLI args
const args = process.argv.slice(2);
const getArg = (name) => { const a = args.find(a => a.startsWith(`--${name}=`)); return a ? a.split('=')[1] : null; };
const options = {
  channel: getArg('channel'),
  limit: getArg('limit') ? parseInt(getArg('limit')) : 50,
  dryRun: args.includes('--dry-run'),
};

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err.message);
  process.exitCode = 1;
});

const db = getDb();

// ── Templates ────────────────────────────────────────────────────────────────

const TEMPLATES = {
  'system-design': [
    "What is the purpose of {kw} in system design?",
    "How does {kw} help with scalability?",
    "When would you use {kw}?",
    "What are the trade-offs of {kw}?",
    "How do {kw} work together?",
    "What problems does {kw} solve?"
  ],
  'behavioral': [
    "Describe a situation involving {kw}.",
    "How did you handle {kw}?",
    "What was the outcome of {kw}?",
    "What did you learn about {kw}?",
    "How would you approach {kw} differently?",
    "Give an example of {kw}."
  ],
  'devops': [
    "What is {kw} used for?",
    "How do you implement {kw}?",
    "What are the benefits of {kw}?",
    "How does {kw} improve reliability?",
    "When should you use {kw}?",
    "What tools support {kw}?"
  ],
  'sre': [
    "How does {kw} affect reliability?",
    "What metrics relate to {kw}?",
    "How do you monitor {kw}?",
    "What's the impact of {kw} on SLOs?",
    "How do you troubleshoot {kw}?",
    "What's the relationship between {kw}?"
  ],
  default: [
    "What is {kw}?",
    "How does {kw} work?",
    "Why is {kw} important?",
    "When would you use {kw}?",
    "What are the benefits of {kw}?",
    "Explain {kw} briefly."
  ]
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function extractTopic(question) {
  return question
    .replace(/^(what|how|why|when|explain|describe|tell me about)\s+/i, '')
    .replace(/\?$/, '')
    .trim()
    .substring(0, 50);
}

function extractAnswer(keywords, answer, explanation) {
  const text = `${answer} ${explanation}`.toLowerCase();
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const relevant = sentences.filter(s => keywords.some(k => s.includes(k.toLowerCase())));
  return (relevant.length > 0 ? relevant.slice(0, 2).join('. ') : answer.split(/[.!?]/)[0]).trim() + '.';
}

// ── Core session generator (runs in WorkerPool) ───────────────────────────────

async function generateSession(question) {
  const keywords = question.voice_keywords ? JSON.parse(question.voice_keywords) : [];
  if (keywords.length < 4) return null;

  const templates = TEMPLATES[question.channel] || TEMPLATES.default;
  const groups = chunk(keywords, 2);

  const microQuestions = groups.slice(0, 6).map((group, i) => ({
    id: `${question.id}-micro-${i + 1}`,
    question: templates[i % templates.length].replace('{kw}', group.join(' and ')),
    expectedAnswer: extractAnswer(group, question.answer || '', question.explanation || ''),
    keywords: group,
    difficulty: i < 2 ? 'easy' : i < 4 ? 'medium' : 'hard',
    order: i + 1
  }));

  if (microQuestions.length < 3) return null;

  const sessionId = `vs-${question.channel}-${question.id}`;

  if (!options.dryRun) {
    await db.execute({
      sql: `INSERT INTO voice_sessions
              (id, topic, description, channel, difficulty, question_ids, total_questions, estimated_minutes, last_updated)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT (id) DO UPDATE SET
              topic = EXCLUDED.topic,
              question_ids = EXCLUDED.question_ids,
              total_questions = EXCLUDED.total_questions,
              last_updated = EXCLUDED.last_updated`,
      args: [
        sessionId,
        extractTopic(question.question),
        `Voice session for ${question.channel}: ${extractTopic(question.question)}`,
        question.channel,
        question.difficulty,
        JSON.stringify([question.id]),
        microQuestions.length,
        microQuestions.length * 2,
        new Date().toISOString()
      ]
    });
  }

  return { sessionId, microQuestions: microQuestions.length };
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== 🎙️ Voice Session Generator (Postgres + WorkerPool) ===\n');
  console.log('Options:', options);
  if (options.dryRun) console.log('🔍 DRY RUN — no DB writes\n');

  await initBotTables();

  // Load voice-suitable questions from Postgres
  let sql = `SELECT id, question, answer, explanation, channel, difficulty, voice_keywords
             FROM questions
             WHERE voice_suitable = 1
               AND status = 'active'
               AND voice_keywords IS NOT NULL`;
  const sqlArgs = [];
  if (options.channel) { sql += ' AND channel = ?'; sqlArgs.push(options.channel); }
  sql += ' ORDER BY channel';
  if (options.limit) { sql += ' LIMIT ?'; sqlArgs.push(options.limit); }

  const result = await db.execute({ sql, args: sqlArgs });
  const questions = result.rows;

  console.log(`Found ${questions.length} voice-suitable questions in Postgres\n`);

  if (questions.length === 0) {
    console.log('Nothing to do.');
    process.exit(0);
  }

  const run = await startRun(BOT_NAME);

  try {
    const pool = new WorkerPool({
      maxConcurrency: CONCURRENCY,
      batchSize: BATCH_SIZE,
      taskTimeout: 30_000,
      retryAttempts: 2,
      rateLimitDelay: 100,
    });

    pool.addTasks(questions.map(q => ({
      id: `vs-${q.id}`,
      fn: generateSession,
      args: [q],
    })));

    const results = await pool.execute();

    const stats = {
      processed: results.stats.total,
      created: results.stats.completed,
      updated: 0,
      deleted: 0,
    };

    await updateRunStats(run.id, stats);
    await completeRun(run.id, stats, { failed: results.stats.failed });

    console.log(`\nDone. Created/updated: ${stats.created} / Failed: ${results.stats.failed}`);
  } catch (err) {
    console.error('Fatal:', err);
    await failRun(run.id, err);
    process.exit(1);
  }
}

const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) main().catch(console.error);

export default { main };
