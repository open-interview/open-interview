#!/usr/bin/env node
/**
 * Real Blog Generator - Uses OpenCode models to generate actual content
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { getPool, closePool } from './db/pg-client.js';

const OUTPUT_DIR = 'content/posts';
const BATCH_SIZE = parseInt(process.argv[2]) || 5;
const MODEL = 'opencode/big-pickle';
const TIMEOUT = 180000; // 3 minutes per blog

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

async function getQuestions(limit) {
  const pool = getPool();
  const result = await pool.query(`
    SELECT q.id, q.question, q.answer, q.channel, q.difficulty
    FROM questions q
    WHERE q.channel IN ('system-design', 'backend', 'frontend', 'devops', 'database')
      AND q.difficulty IN ('intermediate', 'advanced', 'expert')
      AND LENGTH(q.answer) > 300
    ORDER BY RANDOM()
    LIMIT $1
  `, [limit]);
  return result.rows;
}

function callOpenCode(prompt) {
  return new Promise((resolve, reject) => {
    let output = '';
    const proc = spawn('opencode', ['run', '--model', MODEL, prompt], {
      timeout: TIMEOUT,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
    const timeout = setTimeout(() => {
      proc.kill('SIGTERM');
      reject(new Error('Timeout'));
    }, TIMEOUT);
    
    proc.stdout.on('data', (data) => { output += data.toString(); });
    proc.stderr.on('data', (data) => { output += data.toString(); });
    
    proc.on('close', (code) => {
      clearTimeout(timeout);
      if (code === 0) resolve(output.trim());
      else reject(new Error(`Failed with code ${code}`));
    });
  });
}

async function generateBlog(question) {
  const prompt = `Write a professional technical blog post in MDX format about:

TOPIC: ${question.question}

CONTEXT: ${question.answer}

REQUIREMENTS:
1. Start with YAML frontmatter (id, title, slug, channel, difficulty, tags, createdAt, readingTime, excerpt)
2. Use compelling hook with blockquote
3. Include 4-6 sections with technical depth
4. Add code examples where relevant
5. Include real-world examples
6. End with actionable conclusion
7. 800-1500 words
8. Professional but engaging tone

Generate complete MDX file:`;

  return await callOpenCode(prompt);
}

async function processQuestion(question, index, total) {
  const startTime = Date.now();
  console.log(`\n[${index + 1}/${total}] 📝 ${question.question.substring(0, 60)}...`);
  
  try {
    const content = await generateBlog(question);
    
    // Extract slug from frontmatter or generate
    const slugMatch = content.match(/slug:\s*(.+)/);
    const slug = slugMatch 
      ? slugMatch[1].trim() 
      : question.question.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 60);
    
    const filepath = path.join(OUTPUT_DIR, `${slug}.mdx`);
    fs.writeFileSync(filepath, content, 'utf-8');
    
    const wordCount = content.split(/\s+/).length;
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log(`✅ [${index + 1}/${total}] ${slug}.mdx (${wordCount} words, ${duration}s)`);
    
    return { success: true, slug, wordCount, duration };
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.error(`❌ [${index + 1}/${total}] ${error.message} (${duration}s)`);
    return { success: false, error: error.message, duration };
  }
}

async function main() {
  console.log(`🚀 Real Blog Generator with OpenCode`);
  console.log(`   Model: ${MODEL}`);
  console.log(`   Batch: ${BATCH_SIZE} posts`);
  console.log(`   Parallel: Yes\n`);
  
  const startTime = Date.now();
  
  const questions = await getQuestions(BATCH_SIZE);
  
  if (questions.length === 0) {
    console.log('✅ No questions to process!');
    return;
  }
  
  console.log(`📋 Processing ${questions.length} questions in parallel...\n`);
  
  // Process all in parallel
  const results = await Promise.all(
    questions.map((q, i) => processQuestion(q, i, questions.length))
  );
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const avgWords = successful > 0 
    ? Math.round(results.filter(r => r.success).reduce((sum, r) => sum + r.wordCount, 0) / successful)
    : 0;
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 Summary`);
  console.log(`${'='.repeat(60)}`);
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏱️  Total time: ${duration}s`);
  console.log(`📝 Avg words: ${avgWords}`);
  console.log(`📁 Output: ${OUTPUT_DIR}/`);
  console.log(`${'='.repeat(60)}\n`);
  
  if (successful > 0) {
    console.log('📄 Generated files:');
    results.filter(r => r.success).forEach((r, i) => {
      console.log(`   ${i + 1}. ${r.slug}.mdx (${r.wordCount} words, ${r.duration}s)`);
    });
  }
  
  await closePool();
}

main().catch(console.error);
