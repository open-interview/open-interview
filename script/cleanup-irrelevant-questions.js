#!/usr/bin/env node
/**
 * Cleanup Irrelevant Questions
 * 
 * Removes questions that reference specific scenarios/case studies
 * and don't make sense as general interview questions.
 * 
 * Usage:
 *   DRY_RUN=true node script/cleanup-irrelevant-questions.js  # Preview only
 *   node script/cleanup-irrelevant-questions.js               # Actually delete
 */

import 'dotenv/config';
import { createClient } from '@libsql/client';

const DRY_RUN = process.env.DRY_RUN !== 'false';

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Patterns that indicate irrelevant questions
const IRRELEVANT_PATTERNS = [
  // Questions referencing specific scenarios/candidates - these are case-study style, not general interview questions
  { sql: "question LIKE '%percentage%did the candidate%'", desc: 'percentage + candidate' },
  { sql: "question LIKE '%the candidate%when%'", desc: 'the candidate when' },
  { sql: "question LIKE '%how many%did the candidate%'", desc: 'how many + candidate' },
  { sql: "question LIKE '%what number%did the candidate%'", desc: 'what number + candidate' },
  { sql: "question LIKE '%How did the candidate%'", desc: 'How did the candidate' },
  { sql: "question LIKE '%What did the candidate%'", desc: 'What did the candidate' },
  { sql: "question LIKE '%did the candidate%'", desc: 'did the candidate (any)' },
  { sql: "question LIKE '%the team%when they%'", desc: 'the team when they' },
  { sql: "question LIKE '%in the scenario%'", desc: 'in the scenario' },
  { sql: "question LIKE '%in this case%'", desc: 'in this case' },
  { sql: "question LIKE '%in this scenario%'", desc: 'in this scenario' },
  { sql: "question LIKE '%monitoring data%decision%'", desc: 'monitoring data + decision' },
  { sql: "question LIKE '%critical database migration%'", desc: 'critical database migration' },
  // Behavioral questions that reference specific situations/stories
  { sql: "question LIKE '%handle conflict with%'", desc: 'handle conflict with' },
  { sql: "question LIKE '%According to the%'", desc: 'According to the' },
  { sql: "question LIKE '%Based on the%'", desc: 'Based on the' },
  { sql: "question LIKE '%From the story%'", desc: 'From the story' },
  { sql: "question LIKE '%In the story%'", desc: 'In the story' },
  // Questions that are too short to be meaningful
  { sql: "LENGTH(question) < 30", desc: 'too short (<30 chars)' },
  // Questions that don't end with ?
  { sql: "question NOT LIKE '%?'", desc: 'no question mark' },
];

async function main() {
  console.log('🧹 Cleanup Irrelevant Questions\n');
  console.log(`Mode: ${DRY_RUN ? '🔍 DRY RUN (preview only)' : '⚠️  LIVE (will delete)'}\n`);

  let totalFound = 0;
  const questionsToDelete = new Set();

  // Check each pattern
  for (const pattern of IRRELEVANT_PATTERNS) {
    const result = await db.execute({
      sql: `SELECT id, question, channel FROM questions WHERE ${pattern.sql}`,
      args: []
    });

    if (result.rows.length > 0) {
      console.log(`\n📋 Pattern: ${pattern.desc} (${result.rows.length} matches)`);
      for (const row of result.rows) {
        questionsToDelete.add(row.id);
        console.log(`   [${row.channel}] ${row.id}: ${row.question.substring(0, 60)}...`);
      }
      totalFound += result.rows.length;
    }
  }

  // Deduplicate (some questions may match multiple patterns)
  const uniqueIds = Array.from(questionsToDelete);
  
  console.log('\n' + '='.repeat(60));
  console.log(`📊 Summary: ${uniqueIds.length} unique questions to remove`);
  console.log('='.repeat(60));

  if (uniqueIds.length === 0) {
    console.log('\n✅ No irrelevant questions found!');
    return;
  }

  if (DRY_RUN) {
    console.log('\n🔍 DRY RUN - No changes made');
    console.log('   Run with DRY_RUN=false to actually delete these questions');
    return;
  }

  // Delete questions
  console.log('\n🗑️  Deleting questions...');
  
  for (const id of uniqueIds) {
    // First remove from test_question_map if exists
    await db.execute({
      sql: 'DELETE FROM test_question_map WHERE question_id = ?',
      args: [id]
    });
    
    // Remove from channel_mappings if exists
    await db.execute({
      sql: 'DELETE FROM channel_mappings WHERE question_id = ?',
      args: [id]
    });
    
    // Remove from work_queue if exists
    await db.execute({
      sql: 'DELETE FROM work_queue WHERE question_id = ?',
      args: [id]
    });
    
    // Then delete the question
    await db.execute({
      sql: 'DELETE FROM questions WHERE id = ?',
      args: [id]
    });
    
    console.log(`   ✓ Deleted ${id}`);
  }

  console.log(`\n✅ Deleted ${uniqueIds.length} irrelevant questions`);
}

main().catch(e => {
  console.error('Fatal:', e);
  process.exit(1);
});
