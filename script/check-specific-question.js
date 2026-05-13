#!/usr/bin/env node
/**
 * Check a specific question by ID
 */

import 'dotenv/config';
import { getQuestionsForChannel } from './utils.js';
import fs from 'fs';
import path from 'path';

const questionId = process.argv[2] || 'services-1768286130309-0';

console.log(`Checking question: ${questionId}\n`);

try {
  const QUESTIONS_DIR = path.join(process.cwd(), 'data', 'questions');
  let q = null;
  if (fs.existsSync(QUESTIONS_DIR)) {
    const files = fs.readdirSync(QUESTIONS_DIR).filter(f => f.endsWith('.json'));
    for (const f of files) {
      try {
        const questions = JSON.parse(fs.readFileSync(path.join(QUESTIONS_DIR, f), 'utf8'));
        q = questions.find(item => item.id === questionId);
        if (q) break;
      } catch {}
    }
  }
  
  if (!q) {
    console.log('❌ Question not found');
    process.exit(1);
  }
  
  console.log('Question Details:');
  console.log('================');
  console.log(`ID: ${q.id}`);
  console.log(`Channel: ${q.channel}`);
  console.log(`SubChannel: ${q.sub_channel}`);
  console.log(`Question: ${q.question}`);
  console.log(`\nAnswer (first 200 chars):`);
  console.log(q.answer?.substring(0, 200));
  console.log(`\nAnswer starts with JSON: ${q.answer?.trim().startsWith('[{') ? 'YES ❌' : 'NO ✅'}`);
  console.log(`\nExplanation (first 200 chars):`);
  console.log(q.explanation?.substring(0, 200));
  
} catch (e) {
  console.error('Error:', e.message);
  process.exit(1);
}
