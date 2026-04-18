#!/usr/bin/env node
/**
 * Content Quality Gate
 * Runs all questions through validateQuestionFormat and reports counts.
 * Exits with code 1 if more than 1% of questions are invalid.
 * 
 * Usage: node script/test-content-quality.js
 * Env: SQLITE_URL (Turso URL) or uses local.db
 */

import 'dotenv/config';
import { createClient } from '@libsql/client';

const SQLITE_URL = process.env.SQLITE_URL || 'file:local.db';
const SQLITE_AUTH_TOKEN = process.env.SQLITE_AUTH_TOKEN;

const client = createClient({
  url: SQLITE_URL,
  ...(SQLITE_AUTH_TOKEN ? { authToken: SQLITE_AUTH_TOKEN } : {}),
});

function validateQuestionFormat(question) {
  const issues = [];

  if (question.answer && question.answer.startsWith('[{')) {
    issues.push('json-in-answer');
  }

  if (!question.question || question.question.length < 10) {
    issues.push('question-too-short');
  }

  if (!question.answer || question.answer.length < 10) {
    issues.push('answer-too-short');
  }

  const placeholders = ['TODO', 'FIXME', 'TBD', 'placeholder', 'lorem ipsum'];
  const content = `${question.question || ''} ${question.answer || ''}`.toLowerCase();
  if (placeholders.some(p => content.includes(p.toLowerCase()))) {
    issues.push('placeholder-content');
  }

  if (!question.channel) {
    issues.push('missing-channel');
  }

  if (!question.difficulty) {
    issues.push('missing-difficulty');
  }

  return { isValid: issues.length === 0, issues };
}

async function main() {
  console.log('=== 🔒 Content Quality Gate ===\n');

  const result = await client.execute('SELECT id, question, answer, channel, difficulty FROM questions WHERE status != \'deleted\'');
  const questions = result.rows;
  console.log(`Checking ${questions.length} questions...\n`);

  const counts = {
    valid: 0,
    'json-in-answer': 0,
    'question-too-short': 0,
    'answer-too-short': 0,
    'placeholder-content': 0,
    'missing-channel': 0,
    'missing-difficulty': 0,
    other: 0,
  };

  const invalidIds = [];

  for (const q of questions) {
    const { isValid, issues } = validateQuestionFormat(q);
    if (isValid) {
      counts.valid++;
    } else {
      invalidIds.push({ id: q.id, issues });
      for (const issue of issues) {
        if (issue in counts) counts[issue]++;
        else counts.other++;
      }
    }
  }

  const total = questions.length;
  const invalid = total - counts.valid;
  const invalidPct = total > 0 ? (invalid / total) * 100 : 0;

  console.log('Results:');
  console.log(`  ✅ Valid:              ${counts.valid} (${(100 - invalidPct).toFixed(1)}%)`);
  console.log(`  ❌ Invalid:            ${invalid} (${invalidPct.toFixed(1)}%)`);
  console.log('');
  console.log('Issue breakdown:');
  console.log(`  json-in-answer:       ${counts['json-in-answer']}`);
  console.log(`  question-too-short:   ${counts['question-too-short']}`);
  console.log(`  answer-too-short:     ${counts['answer-too-short']}`);
  console.log(`  placeholder-content:  ${counts['placeholder-content']}`);
  console.log(`  missing-channel:      ${counts['missing-channel']}`);
  console.log(`  missing-difficulty:   ${counts['missing-difficulty']}`);
  console.log(`  other:                ${counts.other}`);

  if (invalidIds.length > 0) {
    console.log('\nFirst 10 invalid questions:');
    invalidIds.slice(0, 10).forEach(({ id, issues }) => {
      console.log(`  ${id}: ${issues.join(', ')}`);
    });
  }

  if (invalidPct > 1) {
    console.error(`\n❌ QUALITY GATE FAILED: ${invalidPct.toFixed(1)}% invalid (threshold: 1%)`);
    process.exit(1);
  } else {
    console.log(`\n✅ Quality gate passed (${invalidPct.toFixed(1)}% invalid, threshold: 1%)`);
  }
}

main().catch(e => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
