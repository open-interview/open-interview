#!/usr/bin/env node

import 'dotenv/config';
import { getAllUnifiedQuestions } from './utils.js';

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err.message);
  process.exitCode = 1;
});

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const dryRun = args.includes('--dry-run');
  const modeArg = args.find(a => a.startsWith('--mode='));
  const mode = modeArg ? modeArg.split('=')[1] : 'full';
  const incremental = mode === 'incremental';
  const channelIdx = args.indexOf('--channel');
  const channel = channelIdx !== -1 ? args[channelIdx + 1] : null;
  const limitArg = args.find(a => a.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : null;

  console.log('═'.repeat(60));
  console.log('🔄 VECTOR DATABASE SYNC');
  console.log('═'.repeat(60));
  console.log(`Mode: ${force ? 'Force rebuild' : incremental ? 'Incremental (last 2h)' : 'Full sync'}${dryRun ? ' [dry-run]' : ''}`);
  if (channel) console.log(`Channel: ${channel}`);
  if (limit) console.log(`Limit: ${limit}`);
  console.log('');

  const vectorDB = (await import('./ai/services/vector-db.js')).default;

  if (force && !dryRun) {
    console.log('🗑️ Deleting existing collection...');
    try {
      const qdrant = (await import('./ai/providers/qdrant.js')).default;
      await qdrant.deleteByFilter('questions', {});
      console.log('   Deleted');
    } catch (error) {
      console.log('   Collection did not exist');
    }
  }

  console.log('\n📦 Initializing vector DB...');
  try {
    await vectorDB.init();
  } catch (error) {
    if (error.code === 'SQLITE_BUSY') {
      console.warn('⚠️  Vector DB locked (SQLITE_BUSY) — skipping sync');
      return;
    }
    throw error;
  }

  console.log('\n📥 Fetching questions from files...');
  let allQuestions = await getAllUnifiedQuestions();

  let questions = allQuestions.filter(q => q.status !== 'deleted');

  if (incremental) {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    questions = questions.filter(q => (q.lastUpdated || '') >= twoHoursAgo);
  }

  if (channel) {
    questions = questions.filter(q => q.channel === channel);
  }
  if (limit) {
    questions = questions.slice(0, limit);
  }

  console.log(`   Found ${questions.length} questions`);

  if (dryRun) {
    console.log(`\n[dry-run] Would index ${questions.length} questions — skipping`);
    return;
  }

  console.log('\n📊 Indexing questions...');
  const startTime = Date.now();

  const indexResult = await vectorDB.indexQuestions(questions, { batchSize: 20 });

  const duration = Date.now() - startTime;
  const rate = Math.round(indexResult.indexed / (duration / 1000));

  const stats = await vectorDB.getStats();

  console.log('\n' + '═'.repeat(60));
  console.log('📋 SYNC SUMMARY');
  console.log('═'.repeat(60));
  console.log(`   Questions processed: ${questions.length}`);
  console.log(`   Successfully indexed: ${indexResult.indexed}`);
  console.log(`   Failed: ${indexResult.failed}`);
  console.log(`   Duration: ${duration}ms (${rate} q/s)`);
  console.log(`   Total vectors in DB: ${stats.pointsCount}`);
  console.log('═'.repeat(60) + '\n');

  if (indexResult.errors.length > 0) {
    console.log('⚠️ Errors:');
    indexResult.errors.slice(0, 5).forEach(e => {
      console.log(`   Batch ${e.batch}: ${e.error}`);
    });
  }
}

main().catch(error => {
  console.error('Sync failed:', error);
  process.exit(1);
});
