#!/usr/bin/env node
/**
 * Voice Keywords Bot
 * Extracts mandatory keywords from question answers using OpenCode CLI
 * Also identifies questions suitable for voice interview practice
 * 
 * Can be called standalone or imported by other bots
 */

import 'dotenv/config';
import { createClient } from '@libsql/client';
import { runWithRetries, parseJson } from './utils.js';

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '5');
const MAX_QUESTIONS = parseInt(process.env.MAX_QUESTIONS || '50');
const CHANNEL_FILTER = process.env.CHANNEL_ID || null;
const FORCE_REPROCESS = process.env.FORCE_REPROCESS === 'true';

// Initialize voice columns if not exists
async function initColumns() {
  try {
    await db.execute(`ALTER TABLE questions ADD COLUMN voice_keywords TEXT`);
    console.log('✓ Added voice_keywords column');
  } catch (e) {
    // Column already exists
  }
  
  try {
    await db.execute(`ALTER TABLE questions ADD COLUMN voice_suitable INTEGER`);
    console.log('✓ Added voice_suitable column');
  } catch (e) {
    // Column already exists
  }
}

// Get questions without voice keywords
async function getQuestionsWithoutKeywords(limit) {
  let sql = `
    SELECT id, question, answer, channel, difficulty
    FROM questions 
    WHERE (voice_keywords IS NULL OR voice_suitable IS NULL)
  `;
  
  if (!FORCE_REPROCESS) {
    sql += ` AND voice_keywords IS NULL`;
  }
  
  if (CHANNEL_FILTER) {
    sql += ` AND channel = '${CHANNEL_FILTER}'`;
  }
  
  sql += ` ORDER BY RANDOM() LIMIT ?`;
  
  const result = await db.execute({
    sql,
    args: [limit]
  });
  return result.rows;
}

// Build prompt for keyword extraction and suitability assessment
function buildPrompt(questions) {
  const questionsJson = questions.map((q, i) => ({
    idx: i,
    question: q.question.substring(0, 400),
    answer: q.answer.substring(0, 2000),
    channel: q.channel
  }));

  return `You are an expert technical interviewer. Analyze each question for voice interview suitability and extract mandatory keywords.

For each question, determine:
1. Is it SUITABLE for voice interview? A question is suitable if:
   - It requires explaining concepts, processes, or architectures
   - It can be answered verbally with technical terms
   - It tests understanding, not just recall of specific numbers/syntax
   
   NOT suitable if:
   - It requires writing code or specific syntax
   - It asks for exact numbers, formulas, or calculations
   - It's about specific implementation details that need visual aids
   - It references specific scenarios or case studies
   - It's a trivia question with one-word answers

2. If suitable, extract 5-8 MANDATORY keywords that a candidate MUST mention:
   - Technical terms specific to the topic (e.g., "load balancer", "circuit breaker")
   - Key concepts showing understanding (e.g., "horizontal scaling", "eventual consistency")
   - Important tools/technologies (e.g., "prometheus", "terraform", "kafka")
   - Critical patterns or processes (e.g., "blue-green deployment", "STAR method")

Return ONLY a JSON array:
[
  {
    "idx": 0,
    "suitable": true,
    "reason": "Brief reason why suitable/not suitable",
    "keywords": ["keyword1", "keyword2", "keyword3"]
  }
]

If NOT suitable, keywords should be empty array [].

Questions to analyze:
${JSON.stringify(questionsJson, null, 2)}

Return ONLY the JSON array, no explanation.`;
}

// Extract keywords using OpenCode
async function extractKeywords(questions) {
  const prompt = buildPrompt(questions);
  
  console.log(`  🤖 Calling OpenCode for ${questions.length} questions...`);
  const response = await runWithRetries(prompt);
  
  if (!response) {
    console.log('  ⚠️ No response from OpenCode');
    return [];
  }
  
  const parsed = parseJson(response);
  if (!parsed || !Array.isArray(parsed)) {
    console.log('  ⚠️ Invalid JSON response');
    return [];
  }
  
  return parsed;
}

// Save keywords and suitability to database
async function saveVoiceData(questionId, keywords, suitable) {
  await db.execute({
    sql: `UPDATE questions SET voice_keywords = ?, voice_suitable = ?, last_updated = ? WHERE id = ?`,
    args: [
      keywords && keywords.length > 0 ? JSON.stringify(keywords) : null,
      suitable ? 1 : 0,
      new Date().toISOString(),
      questionId
    ]
  });
}

// Process a single question (for use by other bots)
export async function processQuestionForVoice(questionId, question, answer, channel) {
  const questions = [{ id: questionId, question, answer, channel }];
  const results = await extractKeywords(questions);
  
  if (results.length > 0) {
    const result = results[0];
    const suitable = result.suitable === true;
    const keywords = suitable && Array.isArray(result.keywords) 
      ? result.keywords.map(k => String(k).toLowerCase().trim()).filter(k => k.length > 2)
      : [];
    
    await saveVoiceData(questionId, keywords, suitable);
    return { suitable, keywords };
  }
  
  return null;
}

// Process multiple questions (for batch processing)
export async function processQuestionsForVoice(questions) {
  const results = await extractKeywords(questions);
  const processed = [];
  
  for (const result of results) {
    const question = questions[result.idx];
    if (!question) continue;
    
    const suitable = result.suitable === true;
    const keywords = suitable && Array.isArray(result.keywords)
      ? result.keywords.map(k => String(k).toLowerCase().trim()).filter(k => k.length > 2 && k.length < 50).slice(0, 10)
      : [];
    
    await saveVoiceData(question.id, keywords, suitable);
    processed.push({ id: question.id, suitable, keywordCount: keywords.length });
  }
  
  return processed;
}

// Main processing loop
async function main() {
  console.log('=== 🎤 Voice Keywords Bot ===\n');
  
  await initColumns();
  
  const questions = await getQuestionsWithoutKeywords(MAX_QUESTIONS);
  console.log(`Found ${questions.length} questions to process\n`);
  
  if (questions.length === 0) {
    console.log('✓ All questions have been processed!');
    return;
  }
  
  let processed = 0;
  let suitable = 0;
  let notSuitable = 0;
  let failed = 0;
  
  // Process in batches
  for (let i = 0; i < questions.length; i += BATCH_SIZE) {
    const batch = questions.slice(i, i + BATCH_SIZE);
    console.log(`\nBatch ${Math.floor(i / BATCH_SIZE) + 1}: Processing ${batch.length} questions...`);
    
    const results = await extractKeywords(batch);
    
    for (const result of results) {
      const question = batch[result.idx];
      if (!question) continue;
      
      const isSuitable = result.suitable === true;
      
      if (isSuitable) {
        const keywords = Array.isArray(result.keywords)
          ? result.keywords.map(k => String(k).toLowerCase().trim()).filter(k => k.length > 2 && k.length < 50).slice(0, 10)
          : [];
        
        if (keywords.length >= 3) {
          await saveVoiceData(question.id, keywords, true);
          console.log(`  ✓ ${question.id}: SUITABLE - ${keywords.length} keywords`);
          suitable++;
          processed++;
        } else {
          await saveVoiceData(question.id, [], false);
          console.log(`  ⚠️ ${question.id}: NOT SUITABLE - too few keywords`);
          notSuitable++;
          processed++;
        }
      } else {
        await saveVoiceData(question.id, [], false);
        console.log(`  ✗ ${question.id}: NOT SUITABLE - ${result.reason || 'no reason'}`);
        notSuitable++;
        processed++;
      }
    }
    
    // Handle questions not in results
    for (let j = 0; j < batch.length; j++) {
      if (!results.find(r => r.idx === j)) {
        console.log(`  ⚠️ ${batch[j].id}: No result returned`);
        failed++;
      }
    }
    
    // Rate limiting
    if (i + BATCH_SIZE < questions.length) {
      console.log('  ⏳ Waiting 2s before next batch...');
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  
  console.log(`\n=== Summary ===`);
  console.log(`✓ Processed: ${processed}`);
  console.log(`  - Suitable for voice: ${suitable}`);
  console.log(`  - Not suitable: ${notSuitable}`);
  console.log(`⚠️ Failed: ${failed}`);
}

// Run if called directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  main().catch(console.error);
}

export default { processQuestionForVoice, processQuestionsForVoice };
