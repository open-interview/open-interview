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
import { startRun, completeRun, failRun } from './shared/runs.js';

const db = getDb();

const args = process.argv.slice(2);
const getArg = (name, def) => {
  const arg = args.find(a => a.startsWith(`--${name}=`));
  return arg ? arg.split('=')[1] : def;
};

const threshold = parseFloat(getArg('threshold', '0.75'));
const limitArg = parseInt(getArg('limit', '0'), 10);
const dryRun = !args.includes('--fix');

const BOT_NAME = 'reconciliation';

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err.message);
  process.exitCode = 1;
});

async function main() {
  console.log('🤖 RECONCILIATION BOT');
  console.log(`   Threshold: ${threshold}`);
  if (limitArg > 0) console.log(`   Limit: ${limitArg}`);
  console.log(`   Mode: ${dryRun ? 'DRY RUN (use --fix to apply)' : 'FIX'}\n`);

  const run = await startRun(BOT_NAME);
  const runId = run.id;

  try {
    const scanOpts = { limit: limitArg > 0 ? limitArg : 500 };
    const result = await findExistingDuplicates('question', scanOpts);

    // Filter pairs by threshold
    const pairs = result.duplicatePairs.filter(pair =>
      pair.duplicates.some(d => d.similarity / 100 >= threshold)
    );

    console.log(`Scanned: ${result.totalScanned} | Pairs above threshold: ${pairs.length}`);

    if (pairs.length === 0) {
      console.log('✅ Nothing to reconcile.');
      await completeRun(runId, { processed: result.totalScanned, created: 0, updated: 0, deleted: 0 }, { pairs: 0 });
      return;
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

    const wouldReconcile = pairs.flatMap(p => p.duplicates).filter(d => d.similarity / 100 >= threshold).length;
    if (dryRun) {
      console.log(`\n💡 Would reconcile ${wouldReconcile} duplicates. Run with --fix to apply.`);
    } else {
      console.log(`\n✅ Reconciled ${reconciled} duplicates.`);
    }

    await completeRun(runId,
      { processed: result.totalScanned, created: 0, updated: reconciled, deleted: 0 },
      { pairs: pairs.length, reconciled, dryRun }
    );
  } catch (err) {
    await failRun(runId, err.message);
    console.error('Error:', err.message);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
