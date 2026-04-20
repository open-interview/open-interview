#!/usr/bin/env node
/**
 * 20-Agent Parallel Blog Generator with Tracking
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { getPool, closePool } from './db/pg-client.js';

const OUTPUT_DIR = 'content/posts';
const LOG_FILE = 'logs/blog-20-agents.jsonl';
const BATCH_SIZE = parseInt(process.argv[2]) || 20;
const AGENTS = 20;
const MODEL = 'opencode/big-pickle';
const TIMEOUT = 300000; // 5 min per blog

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
if (!fs.existsSync('logs')) fs.mkdirSync('logs', { recursive: true });

const stats = {
  total: 0,
  success: 0,
  failed: 0,
  inProgress: 0,
  startTime: Date.now(),
  agents: Array(AGENTS).fill(null).map((_, i) => ({
    id: i + 1,
    status: 'idle',
    current: null,
    completed: 0,
    failed: 0
  }))
};

function log(entry) {
  fs.appendFileSync(LOG_FILE, JSON.stringify({ ...entry, timestamp: new Date().toISOString() }) + '\n');
}

function displayProgress() {
  const elapsed = ((Date.now() - stats.startTime) / 1000).toFixed(0);
  const rate = stats.success > 0 ? (stats.success / (elapsed / 60)).toFixed(1) : '0';
  
  console.clear();
  console.log('🚀 20-Agent Parallel Blog Generator\n');
  console.log(`📊 Progress: ${stats.success}/${stats.total} completed (${stats.failed} failed)`);
  console.log(`⏱️  Time: ${elapsed}s | Rate: ${rate} blogs/min | In Progress: ${stats.inProgress}\n`);
  
  console.log('👥 Agent Status:');
  const rows = Math.ceil(AGENTS / 4);
  for (let row = 0; row < rows; row++) {
    const agents = stats.agents.slice(row * 4, (row + 1) * 4);
    const line = agents.map(a => {
      const status = a.status === 'working' ? '🔄' : a.status === 'idle' ? '💤' : '✅';
      return `${status} A${a.id}:${a.completed}/${a.failed}`;
    }).join('  ');
    console.log(`  ${line}`);
  }
  
  console.log('\n📝 Recent Activity:');
  const recent = stats.agents
    .filter(a => a.current)
    .slice(0, 5)
    .map(a => `  Agent ${a.id}: ${a.current.substring(0, 50)}...`);
  recent.forEach(r => console.log(r));
}

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
      else reject(new Error(`Failed: ${code}`));
    });
  });
}

async function generateBlog(question) {
  const prompt = `Write a professional technical blog post in MDX format.

TOPIC: ${question.question}
CONTEXT: ${question.answer}
CHANNEL: ${question.channel}
DIFFICULTY: ${question.difficulty}

Create complete MDX with:
1. YAML frontmatter (id: ${question.id}, title, slug, channel, difficulty, tags, createdAt, readingTime, excerpt)
2. Compelling blockquote hook
3. 5-7 technical sections
4. Code examples
5. Real-world examples
6. Actionable conclusion
7. 1000-1500 words

Generate complete MDX:`;

  return await callOpenCode(prompt);
}

async function processQuestion(question, agentId) {
  const agent = stats.agents[agentId - 1];
  agent.status = 'working';
  agent.current = question.question;
  stats.inProgress++;
  
  const startTime = Date.now();
  
  try {
    const content = await generateBlog(question);
    
    const slugMatch = content.match(/slug:\s*(.+)/);
    const slug = slugMatch 
      ? slugMatch[1].trim() 
      : question.question.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 60);
    
    const filepath = path.join(OUTPUT_DIR, `${slug}.mdx`);
    fs.writeFileSync(filepath, content, 'utf-8');
    
    const wordCount = content.split(/\s+/).length;
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    agent.completed++;
    stats.success++;
    stats.inProgress--;
    agent.status = 'idle';
    agent.current = null;
    
    log({
      type: 'success',
      agentId,
      questionId: question.id,
      slug,
      wordCount,
      duration: parseFloat(duration)
    });
    
    return { success: true, slug, wordCount, duration };
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    agent.failed++;
    stats.failed++;
    stats.inProgress--;
    agent.status = 'idle';
    agent.current = null;
    
    log({
      type: 'error',
      agentId,
      questionId: question.id,
      error: error.message,
      duration: parseFloat(duration)
    });
    
    return { success: false, error: error.message, duration };
  }
}

async function workerPool(questions) {
  const queue = [...questions];
  stats.total = questions.length;
  
  const progressInterval = setInterval(displayProgress, 1000);
  
  async function worker(agentId) {
    while (queue.length > 0) {
      const question = queue.shift();
      if (!question) break;
      await processQuestion(question, agentId);
    }
  }
  
  const workers = Array(AGENTS).fill(null).map((_, i) => worker(i + 1));
  await Promise.all(workers);
  
  clearInterval(progressInterval);
  displayProgress();
}

async function main() {
  console.log('🚀 Starting 20-Agent Parallel Blog Generator...\n');
  
  const questions = await getQuestions(BATCH_SIZE);
  
  if (questions.length === 0) {
    console.log('✅ No questions to process!');
    return;
  }
  
  await workerPool(questions);
  
  const duration = ((Date.now() - stats.startTime) / 1000).toFixed(1);
  const avgTime = stats.success > 0 ? (duration / stats.success).toFixed(1) : '0';
  const avgWords = stats.agents.reduce((sum, a) => sum + a.completed, 0);
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 Final Summary');
  console.log('='.repeat(60));
  console.log(`✅ Successful: ${stats.success}`);
  console.log(`❌ Failed: ${stats.failed}`);
  console.log(`⏱️  Total time: ${duration}s`);
  console.log(`⚡ Avg time: ${avgTime}s per blog`);
  console.log(`📝 Rate: ${(stats.success / (duration / 60)).toFixed(1)} blogs/min`);
  console.log(`📁 Output: ${OUTPUT_DIR}/`);
  console.log(`📋 Log: ${LOG_FILE}`);
  console.log('='.repeat(60) + '\n');
  
  console.log('👥 Agent Performance:');
  stats.agents.forEach(a => {
    console.log(`  Agent ${a.id}: ${a.completed} completed, ${a.failed} failed`);
  });
  
  await closePool();
}

main().catch(console.error);
