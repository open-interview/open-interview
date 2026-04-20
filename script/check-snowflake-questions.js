#!/usr/bin/env node

import 'dotenv/config';
import { dbClient } from './utils.js';

const db = dbClient;

async function checkSnowflakeQuestions() {
  console.log('🔍 Checking Snowflake SnowPro Core questions...\n');
  
  // Count questions in snowflake-core channel
  const countResult = await db.execute({
    sql: 'SELECT COUNT(*) as count FROM questions WHERE channel = ? AND status = ?',
    args: ['snowflake-core', 'active']
  });
  
  const actualCount = countResult.rows[0]?.count || 0;
  console.log(`📊 Actual questions in snowflake-core channel: ${actualCount}`);
  
  // Get the path data
  const pathResult = await db.execute({
    sql: 'SELECT question_ids FROM learning_paths WHERE id = ?',
    args: ['certification-snowflake-core']
  });
  
  if (pathResult.rows.length > 0) {
    const questionIds = JSON.parse(pathResult.rows[0].question_ids);
    console.log(`📋 Questions in path's questionIds array: ${questionIds.length}`);
    console.log(`\n⚠️  Mismatch: Path has ${questionIds.length} question IDs but channel only has ${actualCount} questions!`);
    
    // Check if those question IDs actually exist
    if (questionIds.length > 0) {
      const sampleIds = questionIds.slice(0, 5);
      console.log(`\n🔍 Checking if first 5 question IDs exist:`);
      
      for (const qId of sampleIds) {
        const qResult = await db.execute({
          sql: 'SELECT id, channel FROM questions WHERE id = ?',
          args: [qId]
        });
        
        if (qResult.rows.length > 0) {
          const q = qResult.rows[0];
          console.log(`  ✓ ${qId} exists in channel: ${q.channel}`);
        } else {
          console.log(`  ✗ ${qId} does NOT exist`);
        }
      }
    }
  }
}

checkSnowflakeQuestions().catch(console.error);
