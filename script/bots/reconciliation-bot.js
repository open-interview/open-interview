#!/usr/bin/env node
/**
 * Reconciliation Bot - Detects and reconciles duplicate questions
 *
 * Usage:
 *   node script/bots/reconciliation-bot.js --threshold=0.75
 */

import 'dotenv/config';
import { findExistingDuplicates } from '../ai/services/duplicate-prevention.js';
import { getDb } from './shared/db.js';

const db = getDb();

const args = process.argv.slice(2);
const getArg = (name, def) => {
  const arg = args.find(a => a.startsWith(`--${name}=`));
  return arg ? arg.split('=')[1] : def;
};

const threshold = parseFloat(getArg('threshold', '0.75'));
const dryRun = !args.includes('--fix');

async function main() {
  console.log('🤖 RECONCILIATION BOT');
  console.log(`   Threshold: ${threshold}`);
  console.log(`   Mode: ${dryRun ? 'DRY RUN (use --fix to apply)' : 'FIX'}\n`);

  const result = await findExistingDuplicates('question', { limit: 500 });

  // Filter pairs by threshold
  const pairs = result.duplicatePairs.filter(pair =>
    pair.duplicates.some(d => d.similarity / 100 >= threshold)
  );

  console.log(`Scanned: ${result.totalScanned} | Pairs above threshold: ${pairs.length}`);

  if (pairs.length === 0) {
    console.log('✅ Nothing to reconcile.');
    process.exit(0);
  }

  let reconciled = 0;
  for (const pair of pairs) {
    const toFlag = pair.duplicates.filter(d => d.similarity / 100 >= threshold);
    console.log(`\n  Original: ${pair.original}`);
    for (const dup of toFlag) {
      console.log(`    → ${dup.id} (${dup.similarity}% similar)`);
      if (!dryRun) {
        await db.execute({ sql: 'UPDATE questions SET status = ? WHERE id = ?', args: ['flagged', dup.id] });
        console.log(`      ✓ Flagged`);
        reconciled++;
      }
    }
  }

  if (dryRun) {
    console.log(`\n💡 Would reconcile ${pairs.flatMap(p => p.duplicates).filter(d => d.similarity / 100 >= threshold).length} duplicates. Run with --fix to apply.`);
  } else {
    console.log(`\n✅ Reconciled ${reconciled} duplicates.`);
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
