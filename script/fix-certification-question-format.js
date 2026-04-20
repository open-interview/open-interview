#!/usr/bin/env node

/**
 * Fix Certification Question Format
 * 
 * Problem: Some certification questions have multiple-choice answers stored as JSON strings
 * Solution: Convert them to proper text format or move them to tests
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../client/public/data');

console.log('🔧 Fixing certification question formats...\n');

const certFiles = ['cka.json', 'ckad.json', 'cks.json'];
let totalFixed = 0;
let totalRemoved = 0;

certFiles.forEach(filename => {
  const filepath = path.join(DATA_DIR, filename);
  console.log(`📥 Processing ${filename}...`);
  
  const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
  const originalCount = data.questions.length;
  
  // Filter out questions with multiple-choice format (these should be test questions)
  const validQuestions = data.questions.filter(q => {
    if (q.answer && q.answer.startsWith('[{')) {
      console.log(`   ❌ Removing ${q.id}: Multiple-choice format (should be test question)`);
      totalRemoved++;
      return false;
    }
    return true;
  });
  
  data.questions = validQuestions;
  
  // Update stats
  if (data.stats) {
    data.stats.total = validQuestions.length;
    // Recalculate difficulty counts
    data.stats.beginner = validQuestions.filter(q => q.difficulty === 'beginner').length;
    data.stats.intermediate = validQuestions.filter(q => q.difficulty === 'intermediate').length;
    data.stats.advanced = validQuestions.filter(q => q.difficulty === 'advanced').length;
  }
  
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
  console.log(`   ✓ Removed ${originalCount - validQuestions.length} questions`);
  console.log(`   ✓ Remaining: ${validQuestions.length} questions\n`);
});

// Also update all-questions.json
console.log('📥 Processing all-questions.json...');
const allQuestionsPath = path.join(DATA_DIR, 'all-questions.json');
const allQuestions = JSON.parse(fs.readFileSync(allQuestionsPath, 'utf-8'));
const originalAllCount = allQuestions.length;

const validAllQuestions = allQuestions.filter(q => {
  if (q.answer && q.answer.startsWith('[{')) {
    console.log(`   ❌ Removing ${q.id} from all-questions.json`);
    return false;
  }
  return true;
});

fs.writeFileSync(allQuestionsPath, JSON.stringify(validAllQuestions, null, 2));
console.log(`   ✓ Removed ${originalAllCount - validAllQuestions.length} questions`);
console.log(`   ✓ Remaining: ${validAllQuestions.length} questions\n`);

console.log('✅ Done!');
console.log(`   Total questions removed: ${totalRemoved + (originalAllCount - validAllQuestions.length)}`);
console.log('\n⚠️  Note: These questions should be converted to proper test questions');
console.log('   and added to tests.json with the correct structure.');
