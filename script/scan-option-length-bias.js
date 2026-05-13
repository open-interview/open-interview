#!/usr/bin/env node

import 'dotenv/config';
import { addWorkItem, initWorkQueue, getAllUnifiedQuestions } from './utils.js';

const CONFIG = {
  lengthBiasThreshold: 1.4,
  minCharDifference: 20,
  testBiasThreshold: 0.6
};

function analyzeQuestionBias(question) {
  const options = question.options;
  if (!options || options.length < 2) return null;

  const correctOptions = options.filter(o => o.isCorrect);
  const incorrectOptions = options.filter(o => !o.isCorrect);

  if (correctOptions.length === 0 || incorrectOptions.length === 0) return null;

  const correctLength = correctOptions.reduce((sum, o) => sum + (o.text?.length || 0), 0) / correctOptions.length;
  const incorrectAvgLength = incorrectOptions.reduce((sum, o) => sum + (o.text?.length || 0), 0) / incorrectOptions.length;

  const longestOption = options.reduce((longest, o) =>
    (o.text?.length || 0) > (longest.text?.length || 0) ? o : longest
  );

  const correctIsLongest = correctOptions.some(o => o.id === longestOption.id);

  const biasRatio = incorrectAvgLength > 0 ? correctLength / incorrectAvgLength : 1;
  const charDifference = correctLength - incorrectAvgLength;

  const isBiased = correctIsLongest &&
    biasRatio >= CONFIG.lengthBiasThreshold &&
    charDifference >= CONFIG.minCharDifference;

  return {
    questionId: question.id,
    question: question.question?.substring(0, 80),
    correctLength: Math.round(correctLength),
    incorrectAvgLength: Math.round(incorrectAvgLength),
    biasRatio: biasRatio.toFixed(2),
    charDifference: Math.round(charDifference),
    correctIsLongest,
    isBiased,
    options: options.map(o => ({
      id: o.id,
      length: o.text?.length || 0,
      isCorrect: o.isCorrect
    }))
  };
}

function analyzeTestBias(test) {
  const questions = test.questions || [];
  if (questions.length === 0) return null;

  const analyses = questions.map(q => analyzeQuestionBias(q)).filter(Boolean);
  const biasedQuestions = analyses.filter(a => a.isBiased);
  const correctIsLongestCount = analyses.filter(a => a.correctIsLongest).length;

  const biasRate = analyses.length > 0 ? correctIsLongestCount / analyses.length : 0;
  const isTestBiased = biasRate >= CONFIG.testBiasThreshold;

  return {
    testId: test.id,
    channelId: test.channel,
    channelName: test.channel,
    totalQuestions: questions.length,
    analyzedQuestions: analyses.length,
    biasedQuestions: biasedQuestions.length,
    correctIsLongestCount,
    biasRate: (biasRate * 100).toFixed(1) + '%',
    isTestBiased,
    questionAnalyses: analyses
  };
}

async function scanForOptionLengthBias(options = {}) {
  const { fix = false, channel = null, verbose = false } = options;

  console.log('=== 🔍 Option Length Bias Scanner ===\n');
  console.log(`Configuration:`);
  console.log(`  Length bias threshold: ${CONFIG.lengthBiasThreshold}x (${(CONFIG.lengthBiasThreshold - 1) * 100}% longer)`);
  console.log(`  Min char difference: ${CONFIG.minCharDifference}`);
  console.log(`  Test bias threshold: ${CONFIG.testBiasThreshold * 100}%`);
  console.log(`  Fix mode: ${fix ? 'ENABLED' : 'disabled'}`);
  if (channel) console.log(`  Channel filter: ${channel}`);
  console.log('');

  const allQuestions = await getAllUnifiedQuestions();
  let tests = allQuestions.filter(q => (q.type === 'test' || q.options) && q.status !== 'deleted');

  if (channel) {
    tests = tests.filter(q => q.channel === channel);
  }

  if (tests.length === 0) {
    console.log('No tests found.');
    return { scanned: 0, biased: 0, enqueued: 0 };
  }

  console.log(`Found ${tests.length} tests to analyze.\n`);

  const stats = {
    testsScanned: 0,
    testsWithBias: 0,
    questionsScanned: 0,
    questionsWithBias: 0,
    questionsEnqueued: 0
  };

  const biasedTests = [];

  for (const row of tests) {
    const test = {
      id: row.id,
      channel: row.channel,
      questions: row.options ? [row] : []
    };

    const analysis = analyzeTestBias(test);
    if (!analysis) continue;

    stats.testsScanned++;
    stats.questionsScanned += analysis.analyzedQuestions;
    stats.questionsWithBias += analysis.biasedQuestions;

    if (analysis.isTestBiased || analysis.biasedQuestions > 0) {
      stats.testsWithBias++;
      biasedTests.push(analysis);

      console.log(`⚠️  ${analysis.channelName} (${analysis.testId})`);
      console.log(`   Questions: ${analysis.totalQuestions} | Biased: ${analysis.biasedQuestions} | Correct=Longest: ${analysis.biasRate}`);

      if (verbose) {
        for (const qa of analysis.questionAnalyses.filter(a => a.isBiased)) {
          console.log(`   └─ ${qa.question}...`);
          console.log(`      Correct: ${qa.correctLength} chars | Incorrect avg: ${qa.incorrectAvgLength} chars | Ratio: ${qa.biasRatio}x`);
        }
      }

      if (fix && analysis.biasedQuestions > 0) {
        await initWorkQueue();

        for (const qa of analysis.questionAnalyses.filter(a => a.isBiased)) {
          try {
            await addWorkItem(
              qa.questionId,
              'processor',
              `Issues: option_length_bias | AI: Correct answer is ${qa.biasRatio}x longer than incorrect options (${qa.charDifference} chars difference). Rebalance option lengths. | Fix: Make incorrect options more detailed; or shorten correct option | Score: 60/100`,
              'option-bias-scanner',
              3
            );
            stats.questionsEnqueued++;
            console.log(`   📋 Enqueued: ${qa.questionId}`);
          } catch (e) {
            if (!e.message?.includes('duplicate')) {
              console.error(`   ❌ Failed to enqueue ${qa.questionId}: ${e.message}`);
            }
          }
        }
      }

      console.log('');
    }
  }

  console.log('='.repeat(50));
  console.log('📊 SCAN SUMMARY');
  console.log('='.repeat(50));
  console.log(`Tests scanned: ${stats.testsScanned}`);
  console.log(`Tests with bias: ${stats.testsWithBias} (${(stats.testsWithBias / stats.testsScanned * 100).toFixed(1)}%)`);
  console.log(`Questions scanned: ${stats.questionsScanned}`);
  console.log(`Questions with bias: ${stats.questionsWithBias} (${(stats.questionsWithBias / stats.questionsScanned * 100).toFixed(1)}%)`);
  if (fix) {
    console.log(`Questions enqueued for fix: ${stats.questionsEnqueued}`);
  }

  return stats;
}

const args = process.argv.slice(2);
const fix = args.includes('--fix');
const verbose = args.includes('--verbose') || args.includes('-v');
const channelArg = args.find(a => a.startsWith('--channel='));
const channel = channelArg ? channelArg.split('=')[1] : null;

scanForOptionLengthBias({ fix, channel, verbose })
  .then(() => process.exit(0))
  .catch(e => {
    console.error('Error:', e);
    process.exit(1);
  });
