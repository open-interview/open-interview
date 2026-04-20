#!/usr/bin/env node

/**
 * Fix Test Questions Data
 * 
 * Problem: Test questions are missing channel and subChannel fields
 * Solution: Enrich test questions with data from original questions
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../client/public/data');
const TESTS_FILE = path.join(DATA_DIR, 'tests.json');
const ALL_QUESTIONS_FILE = path.join(DATA_DIR, 'all-questions.json');

console.log('🔧 Fixing test questions data...\n');

// Load all questions
console.log('📥 Loading all questions...');
const allQuestions = JSON.parse(fs.readFileSync(ALL_QUESTIONS_FILE, 'utf-8'));
const questionMap = new Map(allQuestions.map(q => [q.id, q]));
console.log(`   ✓ Loaded ${allQuestions.length} questions\n`);

// Load tests
console.log('📥 Loading tests...');
const tests = JSON.parse(fs.readFileSync(TESTS_FILE, 'utf-8'));
console.log(`   ✓ Loaded ${tests.length} tests\n`);

// Fix each test
let totalFixed = 0;
let totalMissing = 0;

tests.forEach(test => {
  console.log(`🔍 Processing test: ${test.title}`);
  
  test.questions.forEach(tq => {
    const originalQuestion = questionMap.get(tq.questionId);
    
    if (originalQuestion) {
      // Add missing fields from original question
      if (!tq.channel) {
        tq.channel = originalQuestion.channel;
        totalFixed++;
      }
      if (!tq.subChannel) {
        tq.subChannel = originalQuestion.subChannel;
        totalFixed++;
      }
    } else {
      console.log(`   ⚠️  Original question not found: ${tq.questionId}`);
      totalMissing++;
    }
  });
  
  console.log(`   ✓ Fixed ${test.questions.length} questions\n`);
});

// Save fixed tests
console.log('💾 Saving fixed tests...');
fs.writeFileSync(TESTS_FILE, JSON.stringify(tests, null, 2));
console.log(`   ✓ Saved to ${TESTS_FILE}\n`);

console.log('✅ Done!');
console.log(`   Fixed: ${totalFixed} fields`);
console.log(`   Missing: ${totalMissing} original questions`);
