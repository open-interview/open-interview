#!/usr/bin/env node
/**
 * Add Voice Keywords to Existing Questions
 * 
 * This script processes questions that are suitable for voice interviews
 * but don't have voiceKeywords populated yet.
 * 
 * Usage: node script/add-voice-keywords.js [--limit=100] [--channel=system-design]
 */

import 'dotenv/config';
import { dbClient as db } from './db/pg-client.js';
// Channels suitable for voice interviews
const VOICE_CHANNELS = [
  'behavioral', 'system-design', 'sre', 'devops', 
  'engineering-management', 'aws', 'kubernetes',
  'database', 'frontend', 'backend', 'security'
];

// Parse command line args
const args = process.argv.slice(2);
const limit = parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1] || '50');
const channelFilter = args.find(a => a.startsWith('--channel='))?.split('=')[1];

async function main() {
  console.log('🎤 Voice Keywords Generator\n');
  
  // Find questions without voice keywords
  let sql = `
    SELECT id, question, answer, explanation, channel, sub_channel, difficulty
    FROM questions 
    WHERE status = 'active'
    AND (voice_keywords IS NULL OR voice_keywords = '[]' OR voice_keywords = '')
    AND channel IN (${VOICE_CHANNELS.map(() => '?').join(',')})
  `;
  
  const sqlArgs = [...VOICE_CHANNELS];
  
  if (channelFilter) {
    sql += ' AND channel = ?';
    sqlArgs.push(channelFilter);
  }
  
  sql += ` ORDER BY RANDOM() LIMIT ?`;
  sqlArgs.push(limit);
  
  const result = await db.execute({ sql, args: sqlArgs });
  
  console.log(`Found ${result.rows.length} questions to process\n`);
  
  if (result.rows.length === 0) {
    console.log('✅ All questions already have voice keywords!');
    return;
  }

  let processed = 0;
  let updated = 0;
  let errors = 0;
  
  for (const row of result.rows) {
    processed++;
    console.log(`[${processed}/${result.rows.length}] Processing ${row.id}...`);
    
    try {
      const keywords = await generateVoiceKeywords({
        question: row.question,
        answer: row.answer,
        explanation: row.explanation,
        channel: row.channel
      });
      
      if (keywords && keywords.suitable && keywords.keywords.length > 0) {
        await db.execute({
          sql: `UPDATE questions 
                SET voice_keywords = ?, voice_suitable = 1, last_updated = ?
                WHERE id = ?`,
          args: [
            JSON.stringify(keywords.keywords),
            new Date().toISOString(),
            row.id
          ]
        });
        
        console.log(`   ✓ Added ${keywords.keywords.length} keywords: ${keywords.keywords.slice(0, 5).join(', ')}...`);
        updated++;
      } else if (keywords && !keywords.suitable) {
        await db.execute({
          sql: `UPDATE questions 
                SET voice_suitable = 0, last_updated = ?
                WHERE id = ?`,
          args: [new Date().toISOString(), row.id]
        });
        console.log(`   ✗ Not suitable for voice interview`);
      } else {
        console.log(`   ⚠ Could not generate keywords`);
        errors++;
      }
      
      // Rate limiting
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
  // Use OpenAI or Anthropic API
  const apiKey = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    console.error('No API key found. Set OPENAI_API_KEY or ANTHROPIC_API_KEY');
    return null;
  }
  
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
{
  "suitable": true,
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5", "keyword6", "keyword7", "keyword8"]
}`;

  try {
    let response;
    
    if (process.env.OPENAI_API_KEY) {
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          max_tokens: 500
        })
      });
      
      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || '';
      return parseJson(text);
      
    } else if (process.env.ANTHROPIC_API_KEY) {
      response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 500,
          messages: [{ role: 'user', content: prompt }]
        })
      });
      
      const data = await response.json();
      const text = data.content?.[0]?.text || '';
      return parseJson(text);
    }
    
  } catch (err) {
    console.error('API error:', err.message);
    return null;
  }
  
  return null;
}

function parseJson(text) {
  try {
    // Try to extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    // Ignore parse errors
  }
  return null;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

main().catch(console.error);
