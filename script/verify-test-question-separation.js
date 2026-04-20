#!/usr/bin/env node

/**
 * Verify Test Question Separation
 * 
 * Ensures test questions (tq-*) are not mixed with regular questions
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../client/public/data');

console.log('🔍 Verifying test question separation...\n');

// Check all-questions.json
console.log('📥 Checking all-questions.json...');
const allQuestions = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'all-questions.json'), 'utf-8'));
const testQuestionsInAll = allQuestions.filter(q => q.id.startsWith('tq-'));
console.log(`   Found ${testQuestionsInAll.length} test questions (should be 0)`);
if (testQuestionsInAll.length > 0) {
  console.log('   ❌ ERROR: Test questions found in all-questions.json!');
  testQuestionsInAll.slice(0, 5).forEach(q => {
    console.log(`      - ${q.id}: ${q.question.substring(0, 60)}...`);
  });
} else {
  console.log('   ✅ No test questions in all-questions.json');
}

// Check individual channel files
console.log('\n📥 Checking individual channel files...');
const channelFiles = fs.readdirSync(DATA_DIR).filter(f => 
  f.endsWith('.json') && 
  f !== 'all-questions.json' && 
  f !== 'tests.json' &&
  f !== 'coding-challenges.json' &&
  !f.startsWith('history')
);

let totalTestQuestionsInChannels = 0;
channelFiles.forEach(file => {
  const data = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf-8'));
  if (data.questions) {
    const testQuestions = data.questions.filter(q => q.id.startsWith('tq-'));
    if (testQuestions.length > 0) {
      console.log(`   ❌ ${file}: Found ${testQuestions.length} test questions`);
      testQuestions.slice(0, 3).forEach(q => {
        console.log(`      - ${q.id}: ${q.question.substring(0, 60)}...`);
      });
      totalTestQuestionsInChannels += testQuestions.length;
    }
  }
});

if (totalTestQuestionsInChannels === 0) {
  console.log('   ✅ No test questions in channel files');
} else {
  console.log(`\n   ❌ Total test questions in channel files: ${totalTestQuestionsInChannels}`);
}

// Check tests.json
console.log('\n📥 Checking tests.json...');
const tests = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'tests.json'), 'utf-8'));
let totalTestQuestions = 0;
let questionsWithoutChannel = 0;
let questionsWithoutSubChannel = 0;

tests.forEach(test => {
  totalTestQuestions += test.questions.length;
  test.questions.forEach(q => {
    if (!q.channel) questionsWithoutChannel++;
    if (!q.subChannel) questionsWithoutSubChannel++;
  });
});

console.log(`   Total test questions: ${totalTestQuestions}`);
console.log(`   Questions without channel: ${questionsWithoutChannel}`);
console.log(`   Questions without subChannel: ${questionsWithoutSubChannel}`);

if (questionsWithoutChannel === 0 && questionsWithoutSubChannel === 0) {
  console.log('   ✅ All test questions have channel and subChannel');
} else {
  console.log('   ❌ Some test questions missing channel/subChannel');
}

console.log('\n✅ Verification complete!');
