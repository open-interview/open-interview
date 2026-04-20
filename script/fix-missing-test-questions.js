#!/usr/bin/env node

/**
 * Fix Missing Test Questions
 * 
 * For test questions where the original question is not found,
 * set default channel/subChannel based on the test's channel
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../client/public/data');
const TESTS_FILE = path.join(DATA_DIR, 'tests.json');

console.log('🔧 Fixing missing test questions...\n');

// Load tests
const tests = JSON.parse(fs.readFileSync(TESTS_FILE, 'utf-8'));

let totalFixed = 0;

tests.forEach(test => {
  console.log(`🔍 Processing test: ${test.title} (${test.channelId})`);
  
  test.questions.forEach(tq => {
    // If channel is missing, use the test's channel
    if (!tq.channel) {
      tq.channel = test.channelId;
      totalFixed++;
      console.log(`   ✓ Fixed ${tq.id}: set channel to ${test.channelId}`);
    }
    
    // If subChannel is missing, set a default based on the channel
    if (!tq.subChannel) {
      // Use a generic subchannel name
      tq.subChannel = 'general';
      totalFixed++;
      console.log(`   ✓ Fixed ${tq.id}: set subChannel to general`);
    }
  });
});

// Save fixed tests
console.log('\n💾 Saving fixed tests...');
fs.writeFileSync(TESTS_FILE, JSON.stringify(tests, null, 2));
console.log(`   ✓ Saved to ${TESTS_FILE}\n`);

console.log('✅ Done!');
console.log(`   Fixed: ${totalFixed} fields`);
