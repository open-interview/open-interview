#!/usr/bin/env node
/**
 * Sync Vector Database
 * 
 * Synchronizes all questions from the database to Qdrant vector DB.
 * Run this after bulk imports or to rebuild the vector index.
 * 
 * Usage:
 *   node script/sync-vector-db.js           # Full sync
 *   node script/sync-vector-db.js --force   # Delete and recreate collection
 *   node script/sync-vector-db.js --channel system-design  # Sync specific channel
 */

import 'dotenv/config';
import { createClient } from '@libsql/client';

const dbClient = createClient({
  url: process.env.SQLITE_URL || 'file:local.db',
  authToken: process.env.SQLITE_AUTH_TOKEN,
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err.message);
  process.exitCode = 1;
});

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const dryRun = args.includes('--dry-run');
  const channelIdx = args.indexOf('--channel');
  const channel = channelIdx !== -1 ? args[channelIdx + 1] : null;
  const limitArg = args.find(a => a.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : null;
  
  console.log('═'.repeat(60));
  console.log('🔄 VECTOR DATABASE SYNC');
  console.log('═'.repeat(60));
  console.log(`Mode: ${force ? 'Force rebuild' : 'Incremental sync'}${dryRun ? ' [dry-run]' : ''}`);
  if (channel) console.log(`Channel: ${channel}`);
  if (limit) console.log(`Limit: ${limit}`);
  console.log('');
  
  // Import vector DB
  const vectorDB = (await import('./ai/services/vector-db.js')).default;
  
  // Force rebuild if requested
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
  
  // Initialize
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
  
  // Get questions from database
  console.log('\n📥 Fetching questions from database...');
  let sql = 'SELECT * FROM questions WHERE status = ?';
  const args_sql = ['active'];
  
  if (channel) {
    sql += ' AND channel = ?';
    args_sql.push(channel);
  }
  if (limit) {
    sql += ` LIMIT ${limit}`;
  }
  
  let questions;
  try {
    const result = await dbClient.execute({ sql, args: args_sql });
    questions = result.rows.map(row => ({
      id: row.id,
      question: row.question,
      answer: row.answer,
      explanation: row.explanation,
      channel: row.channel,
      subChannel: row.sub_channel,
      difficulty: row.difficulty,
      tags: row.tags ? JSON.parse(row.tags) : [],
      tldr: row.tldr,
      relevanceScore: row.relevance_score,
      status: row.status,
      createdAt: row.created_at
    }));
  } catch (error) {
    if (error.code === 'SQLITE_BUSY') {
      console.warn('⚠️  DB locked (SQLITE_BUSY) — skipping sync');
      return;
    }
    throw error;
  }
  
  console.log(`   Found ${questions.length} questions`);

  if (dryRun) {
    console.log(`\n[dry-run] Would index ${questions.length} questions — skipping`);
    return;
  }
  
  // Index questions
  console.log('\n📊 Indexing questions...');
  const startTime = Date.now();
  
  const indexResult = await vectorDB.indexQuestions(questions, { batchSize: 20 });
  
  const duration = Date.now() - startTime;
  const rate = Math.round(indexResult.indexed / (duration / 1000));
  
  // Get final stats
  const stats = await vectorDB.getStats();
  
  // Summary
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
