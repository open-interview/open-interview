#!/usr/bin/env node

/**
 * Fix Certification Questions Using Bot System
 * 
 * Identifies wrongly formatted certification questions and uses the bot
 * system to properly fix them through the quality gate.
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDb, initBotTables } from './bots/shared/db.js';
import { addToQueue } from './bots/shared/queue.js';
import { logAction } from './bots/shared/ledger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../client/public/data');
const BOT_NAME = 'cert-fixer';

console.log('🔧 Fixing certification questions using bot system...\n');

// Initialize database
await initBotTables();
const db = getDb();

// Find all questions with wrong format (multiple-choice in answer field)
const certFiles = ['cka.json', 'ckad.json', 'cks.json'];
const problematicQuestions = [];

for (const filename of certFiles) {
  const filepath = path.join(DATA_DIR, filename);
  const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
  
  console.log(`📥 Scanning ${filename}...`);
  
  for (const question of data.questions) {
    if (question.answer && question.answer.startsWith('[{')) {
      problematicQuestions.push({
        id: question.id,
        channel: question.channel,
        file: filename,
        question: question
      });
      console.log(`   ❌ Found: ${question.id}`);
    }
  }
}

console.log(`\n📊 Found ${problematicQuestions.length} questions with wrong format\n`);

if (problematicQuestions.length === 0) {
  console.log('✅ No problematic questions found!');
  process.exit(0);
}

// Add each question to the work queue
console.log('📝 Adding questions to work queue...\n');

for (const item of problematicQuestions) {
  const reason = `Issues: wrong_answer_format, multiple_choice_in_text_field | ` +
    `AI: This question has multiple-choice options stored as JSON in the answer field. ` +
    `It should either be converted to a proper test question format or have a text-based answer. | ` +
    `Fix: Convert to proper format; Remove JSON structure; Add proper text answer`;
  
  // Add to work queue for processor bot
  const result = await addToQueue({
    itemType: 'question',
    itemId: item.id,
    action: 'fix_format',
    priority: 1, // High priority
    reason: reason,
    createdBy: BOT_NAME,
    assignedTo: 'processor'
  });
  
  if (result.isNew) {
    console.log(`   ✓ Added ${item.id} to work queue (ID: ${result.id})`);
    
    // Log the action
    await logAction({
      botName: BOT_NAME,
      action: 'flag',
      itemType: 'question',
      itemId: item.id,
      beforeState: JSON.stringify({ 
        answer: item.question.answer.substring(0, 100) + '...',
        format: 'wrong'
      }),
      reason: 'Multiple-choice format in text answer field'
    });
  } else {
    console.log(`   ⚠️  ${item.id} already in queue`);
  }
}

console.log('\n✅ All problematic questions added to work queue!');
console.log('\n📋 Next steps:');
console.log('   1. Run verifier bot: node script/bots/verifier-bot.js');
console.log('   2. Run processor bot: node script/bots/processor-bot.js');
console.log('   3. Or let the automated workflow handle it');
console.log('\n💡 The processor bot will:');
console.log('   - Analyze each question');
console.log('   - Convert to proper format');
console.log('   - Either create test questions or fix text answers');
console.log('   - Update the database with corrected versions');
