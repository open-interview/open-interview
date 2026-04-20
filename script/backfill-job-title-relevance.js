/**
 * Backfill Job Title Relevance
 * Adds job title relevance scores to existing questions
 */

import { db } from '../server/db.js';
import { questions } from '../shared/schema.js';
import jobTitleService from './ai/services/job-title-relevance.js';
import { eq } from 'drizzle-orm';

async function backfillJobTitleRelevance() {
  console.log('🔄 Backfilling job title relevance for existing questions...\n');
  
  try {
    // Get all questions
    const allQuestions = await db.select().from(questions);
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
      await db.update(questions)
        .set({
          jobTitleRelevance: enriched.jobTitleRelevance,
          experienceLevelTags: enriched.experienceLevelTags
        })
        .where(eq(questions.id, question.id));
      
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
