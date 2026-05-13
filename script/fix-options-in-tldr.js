#!/usr/bin/env node

import 'dotenv/config';
import { getAllUnifiedQuestions, saveQuestion, findQuestionById } from './utils.js';

const DRY_RUN = !process.argv.includes('--fix');

const MCQ_PATTERN = /\[\s*\{\s*"id"\s*:\s*"[a-z]"\s*,\s*"text"\s*:/i;

function containsMCQOptions(text) {
  if (!text) return false;
  return MCQ_PATTERN.test(text);
}

function removeMCQOptions(text) {
  if (!text) return text;

  let cleaned = text.replace(/\[\s*\{[^}]*"id"\s*:\s*"[a-z]"[^}]*\}[^\]]*\]/gi, '');

  cleaned = cleaned.replace(/Option [A-D]:/gi, '');
  cleaned = cleaned.replace(/\([A-D]\)/g, '');

  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
}

async function main() {
  console.log('=== 🔍 Checking Questions for MCQ Options in TLDR ===\n');
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (report only)' : 'FIX MODE (will update database)'}\n`);

  try {
    const questions = await getAllUnifiedQuestions();

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

          question.tldr = cleanedTLDR || null;
          question.lastUpdated = new Date().toISOString();
          await saveQuestion(question);

          issuesFixed++;
          console.log(`   TLDR (after): ${cleanedTLDR?.substring(0, 150) || '(removed)'}...`);
          console.log(`   ✅ Fixed`);
        }
      }
    }

    console.log('\n\n=== Summary ===');
    console.log(`Total questions checked: ${questions.length}`);
    console.log(`Issues found: ${issuesFound}`);

    if (DRY_RUN) {
      console.log('\n⚠️  DRY RUN MODE - No changes made');
      console.log('Run with --fix flag to apply fixes');

      if (issuesFound > 0) {
        console.log('\n📋 Problematic Questions:');
        problematicQuestions.forEach(q => {
          console.log(`   - ${q.id} (${q.channel}/${q.difficulty})`);
        });
      }
    } else {
      console.log(`Issues fixed: ${issuesFixed}`);
      console.log('\n✅ Questions updated successfully');
    }

    if (DRY_RUN && issuesFound > 0) {
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
