#!/usr/bin/env node

import 'dotenv/config';
import { getAllUnifiedQuestions } from './utils.js';

async function main() {
  console.log('=== 🔍 Finding JSON in Question Fields ===\n');

  const questions = await getAllUnifiedQuestions();
  const sample = questions.filter(q => q.status !== 'deleted').slice(0, 10);

  console.log(`Checking ${sample.length} questions...\n`);

  const jsonPattern = /[\[{].*["']id["'].*["']text["']/;

  for (const q of sample) {
    console.log(`\n${q.id} (${q.channel}):`);
    console.log(`Question: ${q.question?.substring(0, 80)}...`);
    console.log(`Answer: ${q.answer?.substring(0, 150)}...`);
    console.log(`TLDR: ${q.tldr || '(none)'}`);

    if (jsonPattern.test(q.answer)) {
      console.log('⚠️  JSON found in answer!');
    }
    if (jsonPattern.test(q.tldr)) {
      console.log('⚠️  JSON found in TLDR!');
    }
  }
}

main();
