#!/usr/bin/env node

import { writeFileSync, mkdirSync, existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import 'dotenv/config';

const OUTPUT_DIR = 'client/public/data/history';
const QUESTIONS_DIR = 'data/questions';

async function fetchQuestionHistory() {
  console.log('📜 Fetching question history from files...\n');

  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`✅ Created directory: ${OUTPUT_DIR}`);
  }

  const historyByQuestion = new Map();
  const summaryByQuestion = new Map();

  try {
    console.log('📊 Reading all questions...');
    if (!existsSync(QUESTIONS_DIR)) {
      console.log('   No questions directory found');
      return;
    }

    const files = readdirSync(QUESTIONS_DIR).filter(f => f.endsWith('.json'));
    let questionCount = 0;

    for (const file of files) {
      const channel = file.replace(/\.json$/, '');
      const questions = JSON.parse(readFileSync(join(QUESTIONS_DIR, file), 'utf8'));

      for (const row of questions) {
        questionCount++;
        const questionId = row.id;
        const createdAt = row.createdAt || row.created_at || row.lastUpdated || new Date().toISOString();

        historyByQuestion.set(questionId, [{
          eventType: 'created',
          eventSource: 'system',
          sourceName: 'content-pipeline',
          changesSummary: `Question added to ${channel} channel`,
          changedFields: null,
          reason: null,
          metadata: null,
          createdAt,
        }]);

        summaryByQuestion.set(questionId, {
          questionType: 'question',
          totalEvents: 1,
          latestEvent: { eventType: 'created', createdAt },
          eventTypes: { created: 1 }
        });
      }
    }

    console.log(`   Found ${questionCount} questions`);

    let filesWritten = 0;
    for (const [questionId, records] of historyByQuestion) {
      const filePath = join(OUTPUT_DIR, `${questionId}.json`);
      writeFileSync(filePath, JSON.stringify({
        questionId,
        ...summaryByQuestion.get(questionId),
        history: records
      }, null, 2));
      filesWritten++;
    }

    console.log(`\n✅ Written ${filesWritten} individual history files`);

    const index = {
      questions: Object.fromEntries(
        Array.from(summaryByQuestion.entries()).map(([id, summary]) => [id, summary])
      ),
      totalEvents: Array.from(summaryByQuestion.values()).reduce((sum, s) => sum + s.totalEvents, 0),
      totalQuestions: historyByQuestion.size,
      generatedAt: new Date().toISOString()
    };

    writeFileSync(join(OUTPUT_DIR, 'index.json'), JSON.stringify(index, null, 2));
    console.log(`✅ Written index.json with ${historyByQuestion.size} question summaries`);
    console.log(`📁 Output directory: ${OUTPUT_DIR}`);

  } catch (error) {
    console.error('❌ Error fetching history:', error);
    writeFileSync(
      join(OUTPUT_DIR, 'index.json'),
      JSON.stringify({ questions: {}, totalEvents: 0, generatedAt: new Date().toISOString() }, null, 2)
    );
  }
}

fetchQuestionHistory();
