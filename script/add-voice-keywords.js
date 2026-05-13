#!/usr/bin/env node

import 'dotenv/config';
import { getAllUnifiedQuestions, saveQuestion } from './utils.js';
import opencode from './ai/providers/opencode.js';

const VOICE_CHANNELS = [
  'behavioral', 'system-design', 'sre', 'devops',
  'engineering-management', 'aws', 'kubernetes',
  'database', 'frontend', 'backend', 'security'
];

const args = process.argv.slice(2);
const limit = parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1] || '50');
const channelFilter = args.find(a => a.startsWith('--channel='))?.split('=')[1];

async function main() {
  console.log('🎤 Voice Keywords Generator\n');

  const allQuestions = await getAllUnifiedQuestions();
  let questions = allQuestions.filter(q =>
    q.status === 'active' &&
    (!q.voiceKeywords || q.voiceKeywords === '[]' || q.voiceKeywords === '' || q.voiceKeywords === null) &&
    VOICE_CHANNELS.includes(q.channel)
  );

  if (channelFilter) {
    questions = questions.filter(q => q.channel === channelFilter);
  }

  questions = questions.slice(0, limit);

  console.log(`Found ${questions.length} questions to process\n`);

  if (questions.length === 0) {
    console.log('✅ All questions already have voice keywords!');
    return;
  }

  let processed = 0;
  let updated = 0;
  let errors = 0;

  for (const row of questions) {
    processed++;
    console.log(`[${processed}/${questions.length}] Processing ${row.id}...`);

    try {
      const keywords = await generateVoiceKeywords({
        question: row.question,
        answer: row.answer,
        explanation: row.explanation,
        channel: row.channel
      });

      if (keywords && keywords.suitable && keywords.keywords.length > 0) {
        row.voiceKeywords = keywords.keywords;
        row.voiceSuitable = true;
        row.lastUpdated = new Date().toISOString();
        await saveQuestion(row);

        console.log(`   ✓ Added ${keywords.keywords.length} keywords: ${keywords.keywords.slice(0, 5).join(', ')}...`);
        updated++;
      } else if (keywords && !keywords.suitable) {
        row.voiceSuitable = false;
        row.lastUpdated = new Date().toISOString();
        await saveQuestion(row);
        console.log(`   ✗ Not suitable for voice interview`);
      } else {
        console.log(`   ⚠ Could not generate keywords`);
        errors++;
      }

      await sleep(1000);

    } catch (err) {
      console.error(`   ✗ Error: ${err.message}`);
      errors++;
    }
  }

  console.log('\n📊 Summary:');
  console.log(`   Processed: ${processed}`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Errors: ${errors}`);
}

async function generateVoiceKeywords(content) {
  const prompt = `Analyze this interview question for voice interview practice.

Question: "${content.question}"
Channel: ${content.channel || 'general'}
Answer/Explanation: "${(content.explanation || content.answer || '').substring(0, 1500)}"

Your task:
1. Determine if this question is suitable for VOICE interview practice (can be answered verbally without writing code)
2. If suitable, extract 8-15 MANDATORY keywords/concepts that a good answer MUST include

Guidelines for keywords:
- Include specific technical terms (e.g., "load balancer", "idempotency", "eventual consistency")
- Include related concepts and synonyms (e.g., both "kubernetes" and "k8s")
- Include action words for behavioral questions (e.g., "communicated", "prioritized", "resolved")
- Include metrics/outcomes if relevant (e.g., "latency", "availability", "99.9%")
- Be comprehensive - a candidate mentioning these keywords demonstrates understanding

Return ONLY valid JSON (no markdown, no explanation):
{"suitable": true, "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5", "keyword6", "keyword7", "keyword8"]}`;

  try {
    const raw = await opencode.call(prompt);
    return opencode.parseResponse(raw);
  } catch (err) {
    console.error('OpenCode error:', err.message);
    return null;
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

main().catch(console.error);
