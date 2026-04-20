#!/usr/bin/env node
/**
 * Fix Questions with MCQ Options in TLDR/Quick Answer
 * 
 * Detects and removes MCQ option patterns from tldr field
 * Pattern: [{"id":"a","text":"...","isCorrect":true}...]
 * 
 * Usage:
 *   node script/fix-options-in-tldr.js           # Dry run (report only)
 *   node script/fix-options-in-tldr.js --fix     # Fix issues in database
 */

import 'dotenv/config';
import { dbClient as db } from './db/pg-client.js';
const DRY_RUN = !process.argv.includes('--fix');

// Pattern to detect MCQ options in JSON format
const MCQ_PATTERN = /\[\s*\{\s*"id"\s*:\s*"[a-z]"\s*,\s*"text"\s*:/i;

/**
 * Check if text contains MCQ options
 */
function containsMCQOptions(text) {
  if (!text) return false;
  return MCQ_PATTERN.test(text);
}

/**
 * Remove MCQ options from text
 */
function removeMCQOptions(text) {
  if (!text) return text;
  
  // Remove JSON array of options
  let cleaned = text.replace(/\[\s*\{[^}]*"id"\s*:\s*"[a-z]"[^}]*\}[^\]]*\]/gi, '');
  
  // Remove any remaining option-like patterns
  cleaned = cleaned.replace(/Option [A-D]:/gi, '');
  cleaned = cleaned.replace(/\([A-D]\)/g, '');
  
  // Clean up extra whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  return cleaned;
}

/**
 * Main execution
 */
async function main() {
  console.log('=== 🔍 Checking Questions for MCQ Options in TLDR ===\n');
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (report only)' : 'FIX MODE (will update database)'}\n`);
  
  try {
    // Get all questions
    const result = await db.execute(`
      SELECT id, question, tldr, channel, difficulty, status
      FROM questions
      WHERE status != 'deleted'
      ORDER BY id
    `);
    
    const questions = result.rows;
    console.log(`Found ${questions.length} questions to check\n`);
    
    let issuesFound = 0;
    let issuesFixed = 0;
    const problematicQuestions = [];
    
    for (const question of questions) {
      const hasMCQInTLDR = containsMCQOptions(question.tldr);
      
      if (hasMCQInTLDR) {
        issuesFound++;
        
        console.log(`\n❌ Issue found in ${question.id}`);
        console.log(`   Channel: ${question.channel}`);
        console.log(`   Difficulty: ${question.difficulty}`);
        console.log(`   Question: ${question.question?.substring(0, 80)}...`);
        console.log(`   TLDR (before): ${question.tldr?.substring(0, 150)}...`);
        
        problematicQuestions.push({
          id: question.id,
          channel: question.channel,
          difficulty: question.difficulty,
          tldrBefore: question.tldr
        });
        
        if (!DRY_RUN) {
          const cleanedTLDR = removeMCQOptions(question.tldr);
          
          await db.execute({
            sql: `UPDATE questions 
                  SET tldr = ?, 
                      last_updated = ?
                  WHERE id = ?`,
            args: [
              cleanedTLDR || null,
              new Date().toISOString(),
              question.id
            ]
          });
          
          issuesFixed++;
          console.log(`   TLDR (after): ${cleanedTLDR?.substring(0, 150) || '(removed)'}...`);
          console.log(`   ✅ Fixed`);
        }
      }
    }
    
    // Summary
    console.log('\n\n=== Summary ===');
    console.log(`Total questions checked: ${questions.length}`);
    console.log(`Issues found: ${issuesFound}`);
    
    if (DRY_RUN) {
      console.log('\n⚠️  DRY RUN MODE - No changes made to database');
      console.log('Run with --fix flag to apply fixes');
      
      if (issuesFound > 0) {
        console.log('\n📋 Problematic Questions:');
        problematicQuestions.forEach(q => {
          console.log(`   - ${q.id} (${q.channel}/${q.difficulty})`);
        });
      }
    } else {
      console.log(`Issues fixed: ${issuesFixed}`);
      console.log('\n✅ Database updated successfully');
    }
    
    // Exit with error code if issues found in dry run
    if (DRY_RUN && issuesFound > 0) {
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
