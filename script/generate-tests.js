#!/usr/bin/env node
/**
 * Generate MCQ tests per channel from existing questions.
 * Populates the `tests` table used by the Quick Test feature.
 *
 * Usage:
 *   node script/generate-tests.js                  # all channels
 *   node script/generate-tests.js --channel=aws    # single channel
 *   node script/generate-tests.js --limit=5        # max channels
 *   node script/generate-tests.js --dry-run        # no DB writes
 */

import 'dotenv/config';
import { getDb, initBotTables } from './bots/shared/db.js';
import { runWithRetries, parseJson } from './utils.js';

const BOT_NAME = 'test-generator';
const QUESTIONS_PER_TEST = 30; // questions to sample per channel
const MCQ_PER_TEST = 20;       // MCQ questions to generate per test

const argv = process.argv.slice(2);
const getArg = name => { const a = argv.find(x => x.startsWith(`--${name}=`)); return a ? a.split('=')[1] : null; };
const targetChannel = getArg('channel');
const limitChannels = getArg('limit') ? parseInt(getArg('limit')) : null;
const dryRun = argv.includes('--dry-run');

const db = getDb();

async function getChannels() {
  const result = await db.execute(
    `SELECT channel, COUNT(*) as cnt FROM questions WHERE status='active' GROUP BY channel HAVING cnt >= 10 ORDER BY cnt DESC`
  );
  return result.rows.map(r => ({ id: r.channel, count: r.cnt }));
}

async function getQuestionsForChannel(channelId, limit) {
  const result = await db.execute({
    sql: `SELECT id, question, answer FROM questions WHERE channel=? AND status='active' ORDER BY RANDOM() LIMIT ?`,
    args: [channelId, limit]
  });
  return result.rows;
}

async function generateMCQs(questions, channelId) {
  const summaries = questions.map((q, i) =>
    `${i + 1}. Q: ${q.question.substring(0, 120)} A: ${q.answer.substring(0, 200)}`
  ).join('\n');

  const prompt = `You are a JSON generator. Output ONLY valid JSON, no explanations, no markdown.

Create ${questions.length} multiple choice questions from these Q&As for a ${channelId} knowledge test:

${summaries}

Return a JSON array:
[
  {
    "questionId": "original question id from list (use the number, e.g. 1)",
    "question": "rephrase the question slightly",
    "type": "single",
    "options": [
      {"id": "a", "text": "option text", "isCorrect": false},
      {"id": "b", "text": "option text", "isCorrect": true},
      {"id": "c", "text": "option text", "isCorrect": false},
      {"id": "d", "text": "option text", "isCorrect": false}
    ],
    "explanation": "brief explanation of correct answer",
    "difficulty": "beginner|intermediate|advanced"
  }
]

Rules:
- Exactly 4 options per question, exactly 1 correct answer
- Make wrong options realistic and plausible, similar length to correct answer
- NEVER use "All of the above", "None of the above", "Both A and B"
- Keep explanations under 100 words`;

  const response = await runWithRetries(prompt);
  const result = parseJson(response);
  if (!Array.isArray(result)) return null;

  return result
    .filter(q => q.question && Array.isArray(q.options) && q.options.length === 4)
    .map((q, i) => ({
      id: `mcq-${channelId}-${Date.now()}-${i}`,
      questionId: questions[parseInt(q.questionId) - 1]?.id || questions[i]?.id || `q-${i}`,
      question: q.question,
      type: q.type || 'single',
      options: q.options,
      explanation: q.explanation || '',
      difficulty: q.difficulty || 'intermediate'
    }));
}

async function saveTest(channelId, mcqs) {
  const id = `test-${channelId}`;
  const now = new Date().toISOString();

  // Check if test already exists
  const existing = await db.execute({ sql: `SELECT id, version FROM tests WHERE id=?`, args: [id] });
  const version = existing.rows.length > 0 ? (existing.rows[0].version || 1) + 1 : 1;

  const questionsJson = JSON.stringify(mcqs);

  if (existing.rows.length > 0) {
    await db.execute({
      sql: `UPDATE tests SET questions=?, version=?, last_updated=? WHERE id=?`,
      args: [questionsJson, version, now, id]
    });
    console.log(`   ↻ Updated test-${channelId} (v${version}, ${mcqs.length} questions)`);
  } else {
    await db.execute({
      sql: `INSERT INTO tests (id, channel_id, channel_name, title, description, questions, passing_score, version, created_at, last_updated) VALUES (?,?,?,?,?,?,?,?,?,?)`,
      args: [
        id, channelId, channelId,
        `${channelId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} Test`,
        `Test your ${channelId} knowledge with ${mcqs.length} questions`,
        questionsJson, 70, version, now, now
      ]
    });
    console.log(`   ✓ Created test-${channelId} (v${version}, ${mcqs.length} questions)`);
  }
}

async function main() {
  console.log(`=== 🧪 Test Generator${dryRun ? ' (DRY RUN)' : ''} ===\n`);
  await initBotTables();

  let channels = await getChannels();
  if (targetChannel) channels = channels.filter(c => c.id === targetChannel);
  if (limitChannels) channels = channels.slice(0, limitChannels);

  console.log(`Generating tests for ${channels.length} channels...\n`);

  let created = 0, failed = 0;

  for (const { id: channelId, count } of channels) {
    console.log(`📝 ${channelId} (${count} questions)`);
    try {
      const questions = await getQuestionsForChannel(channelId, QUESTIONS_PER_TEST);
      const mcqs = await generateMCQs(questions, channelId);

      if (!mcqs || mcqs.length === 0) {
        console.log(`   ⚠️ No MCQs generated, skipping`);
        failed++;
        continue;
      }

      const finalMcqs = mcqs.slice(0, MCQ_PER_TEST);

      if (dryRun) {
        console.log(`   💡 Would save ${finalMcqs.length} MCQs (dry-run)`);
      } else {
        await saveTest(channelId, finalMcqs);
      }
      created++;
    } catch (e) {
      console.log(`   ❌ Failed: ${e.message}`);
      failed++;
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Created/updated: ${created}`);
  console.log(`Failed: ${failed}`);
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
