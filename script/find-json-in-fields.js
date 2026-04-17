#!/usr/bin/env node
/**
 * Find JSON patterns in question fields
 * Checks answer, tldr, and explanation fields for JSON arrays/objects
 */

import 'dotenv/config';
import { createClient } from '@libsql/client';

const db = createClient({
  url: process.env.SQLITE_URL || 'file:local.db',
});

async function main() {
  console.log('=== 🔍 Finding JSON in Question Fields ===\n');
  
  const result = await db.execute(`
    SELECT id, question, answer, tldr, explanation, channel
    FROM questions
    WHERE status != 'deleted'
    LIMIT 10
  `);
  
  console.log(`Checking ${result.rows.length} questions...\n`);
  
  for (const q of result.rows) {
    console.log(`\n${q.id} (${q.channel}):`);
    console.log(`Question: ${q.question?.substring(0, 80)}...`);
    console.log(`Answer: ${q.answer?.substring(0, 150)}...`);
    console.log(`TLDR: ${q.tldr || '(none)'}`);
    
    // Check for JSON patterns
    const jsonPattern = /[\[{].*["']id["'].*["']text["']/;
    if (jsonPattern.test(q.answer)) {
      console.log('⚠️  JSON found in answer!');
    }
    if (jsonPattern.test(q.tldr)) {
      console.log('⚠️  JSON found in TLDR!');
    }
  }
}

main();
