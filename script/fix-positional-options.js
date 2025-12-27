#!/usr/bin/env node
/**
 * Fix Positional Options in Tests
 * 
 * Removes MCQs that have options like "Both A and B" or "All of the above"
 * which become invalid when options are shuffled.
 * 
 * Usage:
 *   DRY_RUN=true node script/fix-positional-options.js  # Preview only
 *   node script/fix-positional-options.js               # Actually fix
 */

import 'dotenv/config';
import { createClient } from '@libsql/client';

const DRY_RUN = process.env.DRY_RUN !== 'false';

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Patterns that reference specific option positions
const POSITIONAL_PATTERNS = [
  /both a and b/i,
  /both b and c/i,
  /both a and c/i,
  /both c and d/i,
  /all of the above/i,
  /none of the above/i,
  /options a and b/i,
  /options b and c/i,
  /a and b only/i,
  /b and c only/i,
  /a, b, and c/i,
  /b, c, and d/i,
];

function hasPositionalOption(question) {
  for (const opt of question.options) {
    for (const pattern of POSITIONAL_PATTERNS) {
      if (pattern.test(opt.text)) {
        return { option: opt.text, pattern: pattern.toString() };
      }
    }
  }
  return null;
}

async function main() {
  console.log('🔧 Fix Positional Options in Tests\n');
  console.log(`Mode: ${DRY_RUN ? '🔍 DRY RUN (preview only)' : '⚠️  LIVE (will update)'}\n`);

  const tests = await db.execute('SELECT id, channel_id, questions FROM tests');
  
  let totalRemoved = 0;
  
  for (const test of tests.rows) {
    const questions = JSON.parse(test.questions);
    const originalCount = questions.length;
    
    // Find and filter out problematic MCQs
    const problematic = [];
    const filtered = questions.filter(q => {
      const match = hasPositionalOption(q);
      if (match) {
        problematic.push({ question: q, match });
        return false;
      }
      return true;
    });
    
    if (problematic.length > 0) {
      console.log(`\n📋 [${test.channel_id}] Found ${problematic.length} problematic MCQs:`);
      for (const { question, match } of problematic) {
        console.log(`   ❌ Q: ${question.question.substring(0, 50)}...`);
        console.log(`      Option: "${match.option}"`);
      }
      
      totalRemoved += problematic.length;
      
      if (!DRY_RUN) {
        await db.execute({
          sql: 'UPDATE tests SET questions = ?, last_updated = ? WHERE id = ?',
          args: [JSON.stringify(filtered), new Date().toISOString(), test.id]
        });
        console.log(`   ✓ Updated: ${originalCount} → ${filtered.length} MCQs`);
      }
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`📊 Summary: ${totalRemoved} MCQs with positional options to remove`);
  console.log('='.repeat(60));
  
  if (DRY_RUN && totalRemoved > 0) {
    console.log('\n🔍 DRY RUN - No changes made');
    console.log('   Run with DRY_RUN=false to actually update tests');
  } else if (totalRemoved > 0) {
    console.log(`\n✅ Removed ${totalRemoved} MCQs with positional options`);
  } else {
    console.log('\n✅ No problematic MCQs found!');
  }
}

main().catch(e => {
  console.error('Fatal:', e);
  process.exit(1);
});
