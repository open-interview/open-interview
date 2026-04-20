#!/usr/bin/env node
/**
 * Worker Pool Blog Generator
 * Generates multiple blogs in parallel using worker pool
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { executePipeline } from './ai/blog-pipeline-executor.js';
import { getPool, closePool } from './db/pg-client.js';

const OUTPUT_DIR = 'content/posts';
const BATCH_SIZE = parseInt(process.argv[2]) || 50;
const CONCURRENCY = Math.min(parseInt(process.argv[3]) || os.cpus().length, 10);

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

async function initDB() {
  const pool = getPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS blog_posts (
      id SERIAL PRIMARY KEY,
      question_id TEXT UNIQUE NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      channel TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      word_count INTEGER,
      source_count INTEGER,
      generated_at TIMESTAMP DEFAULT NOW(),
      error_message TEXT,
      metadata JSONB
    );
  `);
  
  // Create indexes separately to avoid conflicts
  try {
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status)`);
  } catch (e) {
    // Index might already exist
  }
}

async function getQuestions(limit) {
  const pool = getPool();
  const result = await pool.query(`
    SELECT q.id, q.question, q.answer, q.channel, q.difficulty
    FROM questions q
    LEFT JOIN blog_posts bp ON q.id = bp.question_id
    WHERE bp.id IS NULL
      AND q.channel IN ('system-design', 'backend', 'frontend', 'devops', 'database')
      AND q.difficulty IN ('intermediate', 'advanced', 'expert')
      AND LENGTH(q.answer) > 200
    ORDER BY RANDOM()
    LIMIT $1
  `, [limit]);
  return result.rows;
}

async function savePost(content, slug) {
  const filepath = path.join(OUTPUT_DIR, `${slug}.mdx`);
  fs.writeFileSync(filepath, content, 'utf-8');
  return filepath;
}

async function updateDB(question, result, error = null) {
  const pool = getPool();
  if (error) {
    await pool.query(`
      INSERT INTO blog_posts (question_id, slug, title, channel, difficulty, status, error_message)
      VALUES ($1, $2, $3, $4, $5, 'failed', $6)
      ON CONFLICT (question_id) DO UPDATE SET error_message = $6
    `, [question.id, `failed-${question.id}`, question.question.substring(0, 100), question.channel, question.difficulty, error.message]);
  } else {
    await pool.query(`
      INSERT INTO blog_posts (question_id, slug, title, channel, difficulty, status, word_count, source_count, metadata)
      VALUES ($1, $2, $3, $4, $5, 'published', $6, $7, $8)
    `, [question.id, result.slug, result.title, question.channel, question.difficulty, result.wordCount, result.sourceCount, JSON.stringify(result.metadata)]);
  }
}

function extractMetadata(content) {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) return null;
  
  const frontmatter = frontmatterMatch[1];
  const titleMatch = frontmatter.match(/title:\s*(.+)/);
  const slugMatch = frontmatter.match(/slug:\s*(.+)/);
  
  const wordCount = content.split(/\s+/).length;
  const sourceMatches = content.match(/sources:/g);
  const sourceCount = sourceMatches ? sourceMatches.length : 0;
  
  return {
    title: titleMatch ? titleMatch[1].trim() : 'Untitled',
    slug: slugMatch ? slugMatch[1].trim() : 'untitled',
    wordCount,
    sourceCount
  };
}

async function processQuestion(question, index, total) {
  const startTime = Date.now();
  console.log(`\n[${index + 1}/${total}] 📝 ${question.question.substring(0, 60)}...`);
  
  try {
    const result = await executePipeline(question);
    const metadata = extractMetadata(result.content);
    const fullResult = { ...metadata, metadata: result.metadata };
    
    const filepath = await savePost(result.content, metadata.slug);
    await updateDB(question, fullResult);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ [${index + 1}/${total}] ${metadata.title} (${duration}s, ${metadata.wordCount} words)`);
    
    return { success: true, question, result: fullResult, duration };
  } catch (error) {
    await updateDB(question, null, error);
    console.error(`❌ [${index + 1}/${total}] ${error.message}`);
    return { success: false, question, error, duration: (Date.now() - startTime) / 1000 };
  }
}

async function workerPool(questions) {
  const results = [];
  const queue = [...questions];
  let completed = 0;
  
  async function worker() {
    while (queue.length > 0) {
      const question = queue.shift();
      if (!question) break;
      
      const result = await processQuestion(question, completed, questions.length);
      results.push(result);
      completed++;
    }
  }
  
  const workers = Array(CONCURRENCY).fill(null).map(() => worker());
  await Promise.all(workers);
  
  return results;
}

async function main() {
  console.log(`🚀 Worker Pool Blog Generator`);
  console.log(`   Batch: ${BATCH_SIZE} posts`);
  console.log(`   Concurrency: ${CONCURRENCY} workers\n`);
  
  const startTime = Date.now();
  
  await initDB();
  const questions = await getQuestions(BATCH_SIZE);
  
  if (questions.length === 0) {
    console.log('✅ No questions to process!');
    return;
  }
  
  console.log(`📋 Processing ${questions.length} questions...\n`);
  
  const results = await workerPool(questions);
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 Summary`);
  console.log(`${'='.repeat(60)}`);
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏱️  Total time: ${duration}s`);
  console.log(`⚡ Avg time: ${(duration / questions.length).toFixed(1)}s per post`);
  console.log(`📁 Output: ${OUTPUT_DIR}/`);
  console.log(`${'='.repeat(60)}\n`);
  
  // Show sample files
  console.log('📄 Generated files (first 10):');
  const successfulResults = results.filter(r => r.success).slice(0, 10);
  successfulResults.forEach((r, i) => {
    console.log(`   ${i + 1}. ${r.result.slug}.mdx (${r.result.wordCount} words)`);
  });
  
  await closePool();
}

main().catch(console.error);
