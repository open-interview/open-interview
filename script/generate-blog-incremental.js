#!/usr/bin/env node
/**
 * Incremental Blog Generator with 5-Agent Pipeline
 * 
 * Features:
 * - Tracks processed questions in database
 * - Generates 1 blog post per run
 * - Full instrumentation and logging
 * - Quality validation at each stage
 * - Automatic retry on failure
 * - Progress tracking
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { executePipeline } from './ai/blog-pipeline-executor.js';
import { getPool, closePool } from './db/pg-client.js';

const OUTPUT_DIR = 'content/posts';
const LOG_DIR = 'logs/blog-generation';
const BATCH_SIZE = 1; // Generate 1 post per run

// Ensure directories exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

/**
 * Initialize blog_posts tracking table
 */
async function initializeDatabase() {
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
      retry_count INTEGER DEFAULT 0,
      metadata JSONB
    );
    
    CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
    CREATE INDEX IF NOT EXISTS idx_blog_posts_channel ON blog_posts(channel);
  `);
}

/**
 * Get next question to process
 */
async function getNextQuestion() {
  const pool = getPool();
  // Get a question that hasn't been processed yet
  const result = await pool.query(`
    SELECT q.id, q.question, q.answer, q.channel, q.difficulty, q.tags
    FROM questions q
    LEFT JOIN blog_posts bp ON q.id = bp.question_id
    WHERE bp.id IS NULL
      AND q.channel IN ('system-design', 'backend', 'frontend', 'devops', 'database')
      AND q.difficulty IN ('intermediate', 'advanced', 'expert')
      AND LENGTH(q.answer) > 200
    ORDER BY RANDOM()
    LIMIT 1
  `);
  
  return result.rows[0] || null;
}

/**
 * Save blog post to file
 */
function saveBlogPost(content, slug) {
  const filename = `${slug}.mdx`;
  const filepath = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(filepath, content, 'utf-8');
  return filepath;
}

/**
 * Log generation details
 */
function logGeneration(question, result, duration, error = null) {
  const timestamp = new Date().toISOString();
  const logFile = path.join(LOG_DIR, `${timestamp.split('T')[0]}.jsonl`);
  
  const logEntry = {
    timestamp,
    questionId: question.id,
    channel: question.channel,
    difficulty: question.difficulty,
    duration,
    success: !error,
    error: error?.message,
    wordCount: result?.wordCount,
    sourceCount: result?.sourceCount,
    slug: result?.slug
  };
  
  fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
}

/**
 * Update database with generation result
 */
async function updateDatabase(question, result, error = null) {
  const pool = getPool();
  if (error) {
    await pool.query(`
      INSERT INTO blog_posts (question_id, slug, title, channel, difficulty, status, error_message, retry_count)
      VALUES ($1, $2, $3, $4, $5, 'failed', $6, 1)
      ON CONFLICT (question_id) 
      DO UPDATE SET 
        retry_count = blog_posts.retry_count + 1,
        error_message = $6
    `, [
      question.id,
      `failed-${question.id}`,
      question.question.substring(0, 100),
      question.channel,
      question.difficulty,
      error.message
    ]);
  } else {
    await pool.query(`
      INSERT INTO blog_posts (
        question_id, slug, title, channel, difficulty, status,
        word_count, source_count, metadata
      )
      VALUES ($1, $2, $3, $4, $5, 'published', $6, $7, $8)
    `, [
      question.id,
      result.slug,
      result.title,
      question.channel,
      question.difficulty,
      result.wordCount,
      result.sourceCount,
      JSON.stringify(result.metadata)
    ]);
  }
}

/**
 * Extract metadata from generated content
 */
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

/**
 * Generate progress report
 */
async function generateProgressReport() {
  const pool = getPool();
  const stats = await pool.query(`
    SELECT 
      status,
      COUNT(*) as count,
      AVG(word_count) as avg_words,
      AVG(source_count) as avg_sources
    FROM blog_posts
    GROUP BY status
  `);
  
  const channelStats = await pool.query(`
    SELECT 
      channel,
      COUNT(*) as count
    FROM blog_posts
    WHERE status = 'published'
    GROUP BY channel
    ORDER BY count DESC
  `);
  
  console.log('\n📊 Generation Progress Report\n');
  console.log('Status Breakdown:');
  stats.rows.forEach(row => {
    console.log(`  ${row.status}: ${row.count} posts (avg ${Math.round(row.avg_words)} words, ${Math.round(row.avg_sources)} sources)`);
  });
  
  console.log('\nChannel Breakdown:');
  channelStats.rows.forEach(row => {
    console.log(`  ${row.channel}: ${row.count} posts`);
  });
  
  const total = await pool.query(`SELECT COUNT(*) FROM questions WHERE channel IN ('system-design', 'backend', 'frontend', 'devops', 'database')`);
  const processed = await pool.query(`SELECT COUNT(*) FROM blog_posts`);
  
  console.log(`\nTotal Progress: ${processed.rows[0].count}/${total.rows[0].count} questions processed\n`);
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Incremental Blog Generator with 5-Agent Pipeline\n');
  
  try {
    // Initialize
    await initializeDatabase();
    
    // Get next question
    console.log('🔍 Finding next question to process...');
    const question = await getNextQuestion();
    
    if (!question) {
      console.log('✅ No more questions to process!');
      await generateProgressReport();
      return;
    }
    
    console.log(`\n📝 Processing: ${question.question.substring(0, 80)}...`);
    console.log(`   Channel: ${question.channel}`);
    console.log(`   Difficulty: ${question.difficulty}\n`);
    
    // Execute pipeline
    const startTime = Date.now();
    const result = await executePipeline(question);
    const duration = Date.now() - startTime;
    
    // Extract metadata
    const metadata = extractMetadata(result.content);
    const fullResult = { ...metadata, metadata: result.metadata };
    
    // Save to file
    const filepath = saveBlogPost(result.content, metadata.slug);
    console.log(`\n💾 Saved to: ${filepath}`);
    
    // Update database
    await updateDatabase(question, fullResult);
    
    // Log generation
    logGeneration(question, fullResult, duration);
    
    console.log(`\n✅ Successfully generated blog post in ${(duration / 1000).toFixed(1)}s`);
    console.log(`   Title: ${metadata.title}`);
    console.log(`   Words: ${metadata.wordCount}`);
    console.log(`   Sources: ${metadata.sourceCount}`);
    
    // Show progress
    await generateProgressReport();
    
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    
    if (question) {
      await updateDatabase(question, null, error);
      logGeneration(question, null, 0, error);
    }
    
    process.exit(1);
  } finally {
    await closePool();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main };
