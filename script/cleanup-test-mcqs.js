#!/usr/bin/env node
/**
 * Cleanup Test MCQs
 * 
 * Removes irrelevant MCQs from tests that reference specific scenarios/candidates.
 * 
 * Usage:
 *   DRY_RUN=true node script/cleanup-test-mcqs.js  # Preview only
 *   node script/cleanup-test-mcqs.js               # Actually clean
 */

import 'dotenv/config';
import { createClient } from '@libsql/client';

const DRY_RUN = process.env.DRY_RUN !== 'false';

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Patterns that indicate irrelevant MCQs
const IRRELEVANT_PATTERNS = [
  /candidate/i,
  /in the scenario/i,
  /in this case/i,
  /in this scenario/i,
  /according to the/i,
  /based on the/i,
  /from the story/i,
  /in the story/i,
  /handle conflict with/i,
  /the team when they/i,
];

async function main() {
  console.log('🧹 Cleanup Test MCQs\n');
  console.log(`Mode: ${DRY_RUN ? '🔍 DRY RUN (preview only)' : '⚠️  LIVE (will update)'}\n`);

  // Get all tests
  const tests = await db.execute('SELECT id, channel_id, questions FROM tests');
  
  let totalRemoved = 0;
  
  for (const test of tests.rows) {
    const questions = JSON.parse(test.questions);
    const originalCount = questions.length;
    
    // Filter out irrelevant MCQs
    const filtered = questions.filter(q => {
      const text = q.question || '';
      const isIrrelevant = IRRELEVANT_PATTERNS.some(pattern => pattern.test(text));
      if (isIrrelevant) {
        console.log(`   ❌ [${test.channel_id}] ${text.substring(0, 60)}...`);
      }
      return !isIrrelevant;
    });
    
    const removed = originalCount - filtered.length;
    if (removed > 0) {
      console.log(`\n📋 [${test.channel_id}] Removing ${removed} irrelevant MCQs (${originalCount} → ${filtered.length})`);
      totalRemoved += removed;
      
      if (!DRY_RUN) {
        // Update the test
        await db.execute({
          sql: 'UPDATE tests SET questions = ?, last_updated = ? WHERE id = ?',
          args: [JSON.stringify(filtered), new Date().toISOString(), test.id]
        });
        console.log(`   ✓ Updated test`);
      }
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`📊 Summary: ${totalRemoved} MCQs to remove from tests`);
  console.log('='.repeat(60));
  
  if (DRY_RUN && totalRemoved > 0) {
    console.log('\n🔍 DRY RUN - No changes made');
    console.log('   Run with DRY_RUN=false to actually update tests');
  } else if (totalRemoved > 0) {
    console.log(`\n✅ Removed ${totalRemoved} irrelevant MCQs from tests`);
  } else {
    console.log('\n✅ No irrelevant MCQs found in tests!');
  }
}

main().catch(e => {
  console.error('Fatal:', e);
  process.exit(1);
});
