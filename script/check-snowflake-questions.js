#!/usr/bin/env node

import 'dotenv/config';
import { getQuestionsForChannel } from './utils.js';
import fs from 'fs';
import path from 'path';

async function checkSnowflakeQuestions() {
  console.log('🔍 Checking Snowflake SnowPro Core questions...\n');

  const questions = await getQuestionsForChannel('snowflake-core');
  const actualCount = questions.filter(q => q.status !== 'deleted').length;
  console.log(`📊 Actual questions in snowflake-core channel: ${actualCount}`);

  // Learning paths stored in data/learning-paths.json (if it exists)
  const learningPathsPath = path.join(process.cwd(), 'data', 'learning-paths.json');
  if (fs.existsSync(learningPathsPath)) {
    try {
      const paths = JSON.parse(fs.readFileSync(learningPathsPath, 'utf8'));
      const pathData = paths.find(p => p.id === 'certification-snowflake-core');
      if (pathData) {
        const questionIds = JSON.parse(pathData.question_ids || '[]');
        console.log(`📋 Questions in path's questionIds array: ${questionIds.length}`);
        if (questionIds.length > 0) {
          console.log(`\n⚠️  Mismatch: Path has ${questionIds.length} question IDs but channel only has ${actualCount} questions!`);

          const sampleIds = questionIds.slice(0, 5);
          console.log(`\n🔍 Checking if first 5 question IDs exist:`);
          for (const qId of sampleIds) {
            const q = questions.find(item => item.id === qId);
            if (q) {
              console.log(`  ✓ ${qId} exists in channel: ${q.channel}`);
            } else {
              console.log(`  ✗ ${qId} does NOT exist`);
            }
          }
        }
      } else {
        console.log(`ℹ️  No learning path found for certification-snowflake-core`);
      }
    } catch (e) {
      console.log(`⚠️  Could not parse learning-paths.json: ${e.message}`);
    }
  } else {
    console.log(`ℹ️  No learning-paths.json file found`);
  }
}

checkSnowflakeQuestions().catch(console.error);
