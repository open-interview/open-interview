#!/usr/bin/env node

/**
 * Fix Malformed Questions in Database
 * 
 * Identifies and removes questions with wrong format directly from the database:
 * - Multiple-choice options stored as JSON in answer field
 * - Placeholder content
 * - Missing required fields
 */

import 'dotenv/config';
import { createClient } from '@libsql/client';

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error('❌ Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN');
  process.exit(1);
}

const client = createClient({ url, authToken });

console.log('🔧 Fixing malformed questions in database...\n');

/**
 * Validate question format
 */
function validateQuestion(question) {
  const issues = [];
  
  // Check for multiple-choice format in answer field (wrong format)
  if (question.answer && question.answer.startsWith('[{')) {
    issues.push('multiple_choice_in_answer');
  }
  
  // Check for missing required fields
  if (!question.question || question.question.length < 10) {
    issues.push('question_too_short');
  }
  
  if (!question.answer || question.answer.length < 10) {
    issues.push('answer_too_short');
  }
  
  // Check for placeholder content
  const placeholders = ['TODO', 'FIXME', 'TBD', 'placeholder', 'lorem ipsum'];
  const content = `${question.question} ${question.answer}`.toLowerCase();
  if (placeholders.some(p => content.includes(p.toLowerCase()))) {
    issues.push('placeholder_content');
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
}

async function main() {
  // Fetch all questions
  console.log('📥 Fetching all questions from database...');
  const result = await client.execute('SELECT * FROM questions ORDER BY channel, id');
  console.log(`   Found ${result.rows.length} questions\n`);
  
  // Validate each question
  console.log('🔍 Validating questions...');
  const malformed = [];
  
  for (const row of result.rows) {
    const question = {
      id: row.id,
      question: row.question,
      answer: row.answer,
      channel: row.channel,
      subChannel: row.sub_channel
    };
    
    const validation = validateQuestion(question);
    if (!validation.isValid) {
      malformed.push({
        ...question,
        issues: validation.issues
      });
    }
  }
  
  console.log(`   ✓ Valid: ${result.rows.length - malformed.length} questions`);
  console.log(`   ✗ Malformed: ${malformed.length} questions\n`);
  
  if (malformed.length === 0) {
    console.log('✅ No malformed questions found!');
    return;
  }
  
  // Group by channel
  const byChannel = {};
  for (const q of malformed) {
    if (!byChannel[q.channel]) {
      byChannel[q.channel] = [];
    }
    byChannel[q.channel].push(q);
  }
  
  // Display malformed questions
  console.log('📋 Malformed questions by channel:\n');
  for (const [channel, questions] of Object.entries(byChannel)) {
    console.log(`   ${channel}: ${questions.length} questions`);
    questions.forEach(q => {
      console.log(`      ❌ ${q.id}: ${q.issues.join(', ')}`);
      console.log(`         Question: ${q.question.substring(0, 60)}...`);
    });
    console.log('');
  }
  
  // Ask for confirmation
  console.log('⚠️  WARNING: This will DELETE these questions from the database!');
  console.log('   Make sure you have a backup before proceeding.\n');
  
  // Auto-proceed if --yes flag is provided
  const autoYes = process.argv.includes('--yes') || process.argv.includes('-y');
  
  if (!autoYes) {
    console.log('   Run with --yes flag to proceed: node script/fix-db-malformed-questions.js --yes');
    return;
  }
  
  // Delete malformed questions
  console.log('🗑️  Deleting malformed questions...\n');
  let deleted = 0;
  
  for (const q of malformed) {
    try {
      await client.execute({
        sql: 'DELETE FROM questions WHERE id = ?',
        args: [q.id]
      });
      console.log(`   ✓ Deleted ${q.id}`);
      deleted++;
    } catch (error) {
      console.log(`   ✗ Failed to delete ${q.id}: ${error.message}`);
    }
  }
  
  console.log(`\n✅ Deleted ${deleted} malformed questions`);
  console.log('\n📋 Next steps:');
  console.log('   1. Rebuild static data: node script/fetch-questions-for-build.js');
  console.log('   2. Verify channels are working correctly');
  console.log('   3. Consider creating proper test questions for the deleted content');
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
