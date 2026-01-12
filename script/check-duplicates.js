#!/usr/bin/env node
/**
 * Duplicate Detection CLI
 * 
 * Command-line tool to check for duplicates across all content types
 * 
 * Usage:
 *   node script/check-duplicates.js                           # Check all questions
 *   node script/check-duplicates.js --type=challenge          # Check coding challenges
 *   node script/check-duplicates.js --channel=aws             # Check specific channel
 *   node script/check-duplicates.js --fix                     # Auto-fix duplicates
 *   node script/check-duplicates.js --report                  # Generate detailed report
 */

import 'dotenv/config';
import { findExistingDuplicates } from './ai/services/duplicate-prevention.js';
import { getDb } from './bots/shared/db.js';

const db = getDb();

// Parse command line arguments
const args = process.argv.slice(2);
const getArg = (name) => {
  const arg = args.find(a => a.startsWith(`--${name}=`));
  return arg ? arg.split('=')[1] : null;
};
const hasFlag = (name) => args.includes(`--${name}`);

const contentType = getArg('type') || 'question';
const channel = getArg('channel');
const limit = parseInt(getArg('limit') || '500');
const fix = hasFlag('fix');
const report = hasFlag('report');

async function main() {
  console.log('═'.repeat(60));
  console.log('🔍 DUPLICATE DETECTION TOOL');
  console.log('═'.repeat(60));
  console.log(`Content Type: ${contentType}`);
  if (channel) console.log(`Channel: ${channel}`);
  console.log(`Limit: ${limit}`);
  console.log(`Mode: ${fix ? 'FIX' : 'SCAN'}`);
  console.log('');
  
  // Find duplicates
  const result = await findExistingDuplicates(contentType, { channel, limit });
  
  // Display results
  console.log('\n' + '═'.repeat(60));
  console.log('📊 RESULTS');
  console.log('═'.repeat(60));
  console.log(`Total Scanned: ${result.totalScanned}`);
  console.log(`Duplicate Pairs Found: ${result.duplicateCount}`);
  
  if (result.duplicatePairs.length > 0) {
    console.log('\n🚨 DUPLICATES DETECTED:\n');
    
    for (const pair of result.duplicatePairs) {
      console.log(`   ${pair.original}:`);
      for (const dup of pair.duplicates) {
        console.log(`      → ${dup.id} (${dup.similarity}% similar)`);
      }
    }
    
    // Generate detailed report if requested
    if (report) {
      await generateDetailedReport(result);
    }
    
    // Auto-fix if requested
    if (fix) {
      await autoFixDuplicates(result);
    } else {
      console.log('\n💡 TIP: Run with --fix to automatically mark duplicates for deletion');
      console.log('💡 TIP: Run with --report to generate a detailed report');
    }
  } else {
    console.log('\n✅ No duplicates found!');
  }
  
  console.log('\n' + '═'.repeat(60));
}

async function generateDetailedReport(result) {
  console.log('\n📄 Generating detailed report...');
  
  const report = {
    timestamp: new Date().toISOString(),
    contentType,
    channel,
    totalScanned: result.totalScanned,
    duplicateCount: result.duplicateCount,
    duplicatePairs: result.duplicatePairs
  };
  
  // Save to file
  const fs = await import('fs/promises');
  const filename = `duplicate-report-${contentType}-${Date.now()}.json`;
  await fs.writeFile(filename, JSON.stringify(report, null, 2));
  
  console.log(`   Report saved to: ${filename}`);
}

async function autoFixDuplicates(result) {
  console.log('\n🔧 Auto-fixing duplicates...');
  
  let fixed = 0;
  
  for (const pair of result.duplicatePairs) {
    // Keep the original, mark duplicates for deletion
    for (const dup of pair.duplicates) {
      try {
        await db.execute({
          sql: 'UPDATE questions SET status = ? WHERE id = ?',
          args: ['flagged', dup.id]
        });
        
        console.log(`   ✓ Flagged ${dup.id} for deletion`);
        fixed++;
      } catch (error) {
        console.error(`   ✗ Failed to flag ${dup.id}: ${error.message}`);
      }
    }
  }
  
  console.log(`\n   Fixed ${fixed} duplicates`);
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
