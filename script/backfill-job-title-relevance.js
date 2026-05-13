/**
 * Backfill Job Title Relevance
 * Adds job title relevance scores to existing questions
 */

import fs from 'fs';
import path from 'path';
import jobTitleService from './ai/services/job-title-relevance.js';
import { saveQuestion } from './utils.js';

const QUESTIONS_DIR = path.join(process.cwd(), 'data', 'questions');

function readAllQuestions() {
  if (!fs.existsSync(QUESTIONS_DIR)) return [];
  return fs.readdirSync(QUESTIONS_DIR)
    .filter(f => f.endsWith('.json'))
    .flatMap(f => JSON.parse(fs.readFileSync(path.join(QUESTIONS_DIR, f), 'utf8')) || []);
}

async function backfillJobTitleRelevance() {
  console.log('🔄 Backfilling job title relevance for existing questions...\n');
  
  try {
    // Get all questions
    const allQuestions = readAllQuestions();
    console.log(`Found ${allQuestions.length} questions to process\n`);
    
    let updated = 0;
    let skipped = 0;
    
    for (const question of allQuestions) {
      // Skip if already has job title relevance
      if (question.jobTitleRelevance) {
        skipped++;
        continue;
      }
      
      // Calculate job title relevance
      const enriched = jobTitleService.enrichQuestionWithJobTitleData(question);
      
      // Update question
      await saveQuestion(enriched);
      
      updated++;
      
      if (updated % 50 === 0) {
        console.log(`✓ Processed ${updated} questions...`);
      }
    }
    
    console.log(`\n✅ Backfill complete!`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Total: ${allQuestions.length}`);
    
  } catch (error) {
    console.error('❌ Error during backfill:', error);
    process.exit(1);
  }
}

backfillJobTitleRelevance();
