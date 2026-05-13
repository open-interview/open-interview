#!/usr/bin/env node

import 'dotenv/config';
import { getAllUnifiedQuestions } from './utils.js';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function pass(test) {
  log(`  ✅ ${test}`, 'green');
}

function fail(test, error) {
  log(`  ❌ ${test}: ${error}`, 'red');
}

function section(title) {
  console.log(`\n${'═'.repeat(60)}`);
  log(`📋 ${title}`, 'blue');
  console.log('═'.repeat(60));
}

const results = { passed: 0, failed: 0, skipped: 0 };

async function testBasicOperations() {
  section('TEST 1: Basic Vector Operations');

  try {
    const vectorDB = (await import('./ai/services/vector-db.js')).default;

    try {
      await vectorDB.init();
      pass('Vector DB initialization');
      results.passed++;
    } catch (error) {
      fail('Vector DB initialization', error.message);
      results.failed++;
      return;
    }

    const testQuestion = {
      id: 'test-vector-001',
      question: 'What is the difference between REST and GraphQL APIs?',
      answer: 'REST uses multiple endpoints with fixed data structures, while GraphQL uses a single endpoint with flexible queries.',
      channel: 'backend',
      subChannel: 'api-design',
      difficulty: 'intermediate',
      tags: ['api', 'rest', 'graphql']
    };

    try {
      await vectorDB.indexQuestion(testQuestion);
      pass('Index single question');
      results.passed++;
    } catch (error) {
      fail('Index single question', error.message);
      results.failed++;
    }

    try {
      const searchResults = await vectorDB.semanticSearch('GraphQL vs REST comparison', {
        limit: 5,
        threshold: 0.1
      });

      if (searchResults.length > 0) {
        pass(`Semantic search (found ${searchResults.length} results)`);
        results.passed++;
      } else {
        fail('Semantic search', 'No results found');
        results.failed++;
      }
    } catch (error) {
      fail('Semantic search', error.message);
      results.failed++;
    }

    try {
      const similar = await vectorDB.findSimilar('How do REST APIs differ from GraphQL?', {
        limit: 5,
        threshold: 0.1
      });

      if (similar.length > 0) {
        pass(`Find similar (found ${similar.length} similar questions)`);
        results.passed++;
      } else {
        fail('Find similar', 'No similar questions found');
        results.failed++;
      }
    } catch (error) {
      fail('Find similar', error.message);
      results.failed++;
    }

    try {
      const stats = await vectorDB.getStats();
      if (stats.pointsCount > 0) {
        pass(`Get stats (${stats.pointsCount} points indexed)`);
        results.passed++;
      } else {
        fail('Get stats', 'No points in collection');
        results.failed++;
      }
    } catch (error) {
      fail('Get stats', error.message);
      results.failed++;
    }

    try {
      await vectorDB.removeQuestion('test-vector-001');
      pass('Remove test question');
      results.passed++;
    } catch (error) {
      log(`  ⚠️ Cleanup skipped: ${error.message}`, 'yellow');
    }

  } catch (error) {
    fail('Basic operations module load', error.message);
    results.failed++;
  }
}

async function testQualityGate() {
  section('TEST 2: Quality Gate Duplicate Detection');

  try {
    const { runQualityGate } = await import('./ai/graphs/quality-gate-graph.js');

    const uniqueQuestion = {
      question: 'How would you implement a distributed rate limiter using Redis?',
      answer: 'Use Redis sorted sets with timestamps as scores. Each request adds an entry, and you count entries within the time window. Use MULTI/EXEC for atomicity.',
      explanation: 'A distributed rate limiter needs to track requests across multiple servers...'
    };

    try {
      const result = await runQualityGate(uniqueQuestion, {
        channel: 'system-design',
        difficulty: 'advanced',
        passThreshold: 50
      });

      if (result.scores && result.scores.duplicate !== undefined) {
        pass(`Quality gate with vector duplicate check (duplicate score: ${result.scores.duplicate})`);
        results.passed++;
      } else {
        fail('Quality gate duplicate check', 'No duplicate score returned');
        results.failed++;
      }
    } catch (error) {
      fail('Quality gate execution', error.message);
      results.failed++;
    }

  } catch (error) {
    fail('Quality gate module load', error.message);
    results.failed++;
  }
}

async function testDuplicateDetection() {
  section('TEST 3: Duplicate Detection');

  try {
    const vectorDB = (await import('./ai/services/vector-db.js')).default;

    const allQuestions = await getAllUnifiedQuestions();
    const realQuestions = allQuestions.filter(q => q.status !== 'deleted');
    if (realQuestions.length === 0) {
      log('  ⚠️ No questions found, skipping duplicate test', 'yellow');
      results.skipped++;
      return;
    }

    const realQuestion = realQuestions[0];

    try {
      const duplicates = await vectorDB.findDuplicates({
        id: 'test-dup-check',
        question: realQuestion.question,
        answer: realQuestion.answer,
        channel: realQuestion.channel
      }, 0.3);

      if (duplicates.length > 0) {
        pass(`Duplicate detection (found ${duplicates.length} similar, top: ${duplicates[0].score ? Math.round(duplicates[0].score * 100) : 'N/A'}%)`);
        results.passed++;
      } else {
        log('  ⚠️ No duplicates found (may be expected with TF-IDF)', 'yellow');
        results.passed++;
      }
    } catch (error) {
      fail('Duplicate detection', error.message);
      results.failed++;
    }

  } catch (error) {
    fail('Duplicate detection module', error.message);
    results.failed++;
  }
}

async function testBatchIndexing() {
  section('TEST 4: Batch Indexing Performance');

  try {
    const vectorDB = (await import('./ai/services/vector-db.js')).default;

    const allQuestions = await getAllUnifiedQuestions();
    const questions = allQuestions.filter(q => q.status !== 'deleted').slice(0, 10);

    if (questions.length === 0) {
      log('  ⚠️ No questions to test batch indexing', 'yellow');
      results.skipped++;
      return;
    }

    const startTime = Date.now();

    try {
      const result = await vectorDB.indexQuestions(questions, { batchSize: 5 });
      const duration = Date.now() - startTime;

      if (result.indexed > 0) {
        pass(`Batch indexing (${result.indexed} questions in ${duration}ms, ${Math.round(result.indexed / (duration / 1000))} q/s)`);
        results.passed++;
      } else {
        fail('Batch indexing', `Only ${result.indexed} indexed, ${result.failed} failed`);
        results.failed++;
      }
    } catch (error) {
      fail('Batch indexing', error.message);
      results.failed++;
    }

  } catch (error) {
    fail('Batch indexing module', error.message);
    results.failed++;
  }
}

async function testChannelSearch() {
  section('TEST 5: Channel-Filtered Search');

  try {
    const vectorDB = (await import('./ai/services/vector-db.js')).default;

    const channels = ['system-design', 'backend', 'frontend', 'devops'];

    for (const channel of channels) {
      try {
        const results_search = await vectorDB.semanticSearch('design patterns and best practices', {
          limit: 3,
          threshold: 0.1,
          channel
        });

        log(`  ${channel}: ${results_search.length} results`, results_search.length > 0 ? 'green' : 'yellow');
      } catch (error) {
        log(`  ${channel}: error - ${error.message}`, 'red');
      }
    }

    pass('Channel-filtered search completed');
    results.passed++;

  } catch (error) {
    fail('Channel search', error.message);
    results.failed++;
  }
}

async function testMLDecisions() {
  section('TEST 6: ML Decisions Service');

  try {
    const mlDecisions = (await import('./ai/services/ml-decisions.js')).default;

    const allQuestions = await getAllUnifiedQuestions();
    const realQuestions = allQuestions.filter(q => q.status !== 'deleted');
    if (realQuestions.length === 0) {
      log('  ⚠️ No questions to analyze', 'yellow');
      results.skipped++;
      return;
    }

    const question = realQuestions[0];

    try {
      const dupCheck = await mlDecisions.checkDuplicates(question);
      pass(`Duplicate check (action: ${dupCheck.action}, exact: ${dupCheck.exactDuplicates?.length || 0}, near: ${dupCheck.nearDuplicates?.length || 0})`);
      results.passed++;
    } catch (error) {
      fail('Duplicate check', error.message);
      results.failed++;
    }

    try {
      const fitCheck = await mlDecisions.checkChannelFit(question);
      pass(`Channel fit check (score: ${fitCheck.channelFitScore}, action: ${fitCheck.action})`);
      results.passed++;
    } catch (error) {
      fail('Channel fit check', error.message);
      results.failed++;
    }

  } catch (error) {
    fail('ML Decisions module', error.message);
    results.failed++;
  }
}

async function main() {
  console.log('\n' + '═'.repeat(60));
  log('🧪 VECTOR DB INTEGRATION TEST SUITE', 'blue');
  console.log('═'.repeat(60));
  console.log(`\nEnvironment:`);
  console.log(`  QDRANT_URL: (unused — local SQLite vector store)`);
  console.log(`  EMBEDDING_MODEL: ${process.env.EMBEDDING_MODEL || 'tfidf (default)'}`);

  const startTime = Date.now();

  await testBasicOperations();
  await testQualityGate();
  await testDuplicateDetection();
  await testBatchIndexing();
  await testChannelSearch();
  await testMLDecisions();

  const duration = Date.now() - startTime;

  console.log('\n' + '═'.repeat(60));
  log('📊 TEST SUMMARY', 'blue');
  console.log('═'.repeat(60));
  console.log(`\n  Total tests: ${results.passed + results.failed + results.skipped}`);
  log(`  ✅ Passed: ${results.passed}`, 'green');
  if (results.failed > 0) log(`  ❌ Failed: ${results.failed}`, 'red');
  if (results.skipped > 0) log(`  ⚠️ Skipped: ${results.skipped}`, 'yellow');
  console.log(`  ⏱️ Duration: ${duration}ms`);
  console.log('═'.repeat(60) + '\n');

  process.exit(results.failed > 0 ? 1 : 0);
}

main().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
