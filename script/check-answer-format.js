#!/usr/bin/env node
/**
 * Check Answer Format Issues
 * 
 * Detects questions where the answer field contains MCQ options JSON
 * instead of a proper text answer
 * 
 * Usage:
 *   node script/check-answer-format.js           # Report issues
 *   node script/check-answer-format.js --fix     # Fix by regenerating answers
 */

import 'dotenv/config';
import { createClient } from '@libsql/client';

const db = createClient({
  url: process.env.SQLITE_URL ?? 'file:local.db',
});

const DRY_RUN = !process.argv.includes('--fix');

// Pattern to detect MCQ options in answer field
const MCQ_JSON_PATTERN = /\[\s*\{\s*"id"\s*:\s*"[a-z]"\s*,\s*"text"\s*:/i;
const OPTION_PATTERN = /Option [A-D]:/i;

/**
 * Check if answer contains MCQ options instead of explanation
 */
function hasOptionsInAnswer(answer) {
  if (!answer) return false;
  return MCQ_JSON_PATTERN.test(answer) || 
         (OPTION_PATTERN.test(answer) && answer.includes('isCorrect'));
}

/**
 * Extract correct option text from options JSON
 */
function extractCorrectAnswer(answer) {
  try {
    // Try to parse as JSON array
    const match = answer.match(/\[.*\]/s);
    if (match) {
      const options = JSON.parse(match[0]);
      const correct = options.find(opt => opt.isCorrect);
      if (correct) {
        return correct.text;
      }
    }
  } catch (e) {
    // Not valid JSON, try other patterns
  }
  
  // Try to extract from "Option X: text" format
  const optionMatch = answer.match(/Option [A-D]:\s*([^,\n]+)/i);
  if (optionMatch) {
    return optionMatch[1].trim();
  }
  
  return null;
}

/**
 * Main execution
 */
async function main() {
  console.log('=== 🔍 Checking Answer Format Issues ===\n');
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (report only)' : 'FIX MODE (will update database)'}\n`);
  
  try {
    // Get all questions
    const result = await db.execute(`
      SELECT id, question, answer, explanation, tldr, channel, difficulty, status
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
      const hasIssue = hasOptionsInAnswer(question.answer);
      
      if (hasIssue) {
        issuesFound++;
        
        console.log(`\n❌ Issue found in ${question.id}`);
        console.log(`   Channel: ${question.channel}`);
        console.log(`   Difficulty: ${question.difficulty}`);
        console.log(`   Question: ${question.question?.substring(0, 80)}...`);
        console.log(`   Answer (problematic): ${question.answer?.substring(0, 200)}...`);
        
        problematicQuestions.push({
          id: question.id,
          channel: question.channel,
          difficulty: question.difficulty,
          question: question.question,
          answerBefore: question.answer
        });
        
        if (!DRY_RUN) {
          // Try to extract correct answer
          const correctAnswer = extractCorrectAnswer(question.answer);
          
          if (correctAnswer) {
            await db.execute({
              sql: `UPDATE questions 
                    SET answer = ?, 
                        last_updated = ?
                    WHERE id = ?`,
              args: [
                correctAnswer,
                new Date().toISOString(),
                question.id
              ]
            });
            
            issuesFixed++;
            console.log(`   Answer (fixed): ${correctAnswer}`);
            console.log(`   ✅ Fixed`);
          } else {
            console.log(`   ⚠️  Could not extract correct answer - manual review needed`);
          }
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
        
        // Save report
        const fs = await import('fs');
        fs.writeFileSync(
          'answer-format-issues.json',
          JSON.stringify(problematicQuestions, null, 2)
        );
        console.log('\n📄 Detailed report saved to: answer-format-issues.json');
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
    console.error(error.stack);
    process.exit(1);
  }
}

main();
