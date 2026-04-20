#!/usr/bin/env node
/**
 * Find Truncated Answers Script
 * 
 * Identifies questions with answers that appear to be cut off mid-sentence
 * and enqueues them for improvement processing.
 * 
 * Detection criteria:
 * - Answer ends without proper punctuation (., !, ?)
 * - Answer is suspiciously short (< 200 chars)
 * - Answer ends with common incomplete patterns ("If it's", "When the", etc.)
 * 
 * Usage:
 *   node script/find-truncated-answers.js
 *   node script/find-truncated-answers.js --dry-run
 *   node script/find-truncated-answers.js --channel=system-design
 *   node script/find-truncated-answers.js --limit=50
 */

import 'dotenv/config';
import { getDb, initBotTables } from './bots/shared/db.js';

// Database connection
const db = getDb();

// Patterns that indicate truncated answers
const TRUNCATION_PATTERNS = [
  /If it'?s?$/i,
  /When the$/i,
  /For the$/i,
  /In the$/i,
  /With the$/i,
  /To the$/i,
  /And the$/i,
  /Or the$/i,
  /But the$/i,
  /This is$/i,
  /That is$/i,
  /Which is$/i,
  /You can$/i,
  /They are$/i,
  /It can$/i,
  /We use$/i,
  /You should$/i,
  /Always$/i,
  /Never$/i,
  /Consider$/i,
  /Remember$/i,
  /Note that$/i,
  /Keep in$/i,
  /Make sure$/i,
  /Be sure$/i,
  /Don't forget$/i,
  /It's important$/i,
  /Key points$/i,
  /Main$/i,
  /Common$/i,
  /Typical$/i,
  /Best$/i,
  /Most$/i,
  /Some$/i,
  /Many$/i,
  /Several$/i,
  /Multiple$/i,
  /Various$/i,
  /Different$/i,
  /Other$/i,
  /Additional$/i,
  /Also$/i,
  /Furthermore$/i,
  /Moreover$/i,
  /However$/i,
  /Therefore$/i,
  /Thus$/i,
  /Hence$/i,
  /Consequently$/i,
  /As a result$/i,
  /For example$/i,
  /For instance$/i,
  /Such as$/i,
  /Including$/i,
  /Like$/i,
  /Similar to$/i,
  /Compared to$/i,
  /Unlike$/i,
  /Instead of$/i,
  /Rather than$/i,
  /More than$/i,
  /Less than$/i,
  /Better than$/i,
  /Worse than$/i,
];

// Words that commonly appear at the end of incomplete sentences
const INCOMPLETE_ENDINGS = [
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should',
  'could', 'may', 'might', 'must', 'can', 'to', 'for', 'of', 'in', 'on',
  'at', 'by', 'with', 'from', 'as', 'if', 'when', 'where', 'why', 'how',
  'and', 'or', 'but', 'so', 'yet', 'nor', 'for', 'because', 'since',
  'although', 'though', 'unless', 'until', 'while', 'whereas'
];

/**
 * Check if an answer appears to be truncated
 */
function isTruncated(answer) {
  if (!answer || typeof answer !== 'string') return false;
  
  const trimmed = answer.trim();
  const length = trimmed.length;
  
  // Check 1: Very short answers (likely incomplete)
  if (length < 150) return true;
  
  // Check 2: Doesn't end with proper punctuation
  const lastChar = trimmed[length - 1];
  if (!['.', '!', '?', '"', "'", ')', ']'].includes(lastChar)) {
    return true;
  }
  
  // Check 3: Ends with common truncation patterns
  for (const pattern of TRUNCATION_PATTERNS) {
    if (pattern.test(trimmed)) {
      return true;
    }
  }
  
  // Check 4: Last word is a common incomplete ending
  const words = trimmed.split(/\s+/);
  const lastWord = words[words.length - 1].toLowerCase().replace(/[.,!?;:'"]/g, '');
  if (INCOMPLETE_ENDINGS.includes(lastWord)) {
    return true;
  }
  
  // Check 5: Ends with a comma or semicolon (incomplete sentence)
  if ([',', ';', ':'].includes(lastChar)) {
    return true;
  }
  
  return false;
}

/**
 * Get severity level for truncation
 */
function getTruncationSeverity(answer) {
  if (!answer) return 'critical';
  
  const length = answer.trim().length;
  
  if (length < 100) return 'critical';
  if (length < 150) return 'high';
  if (length < 200) return 'medium';
  return 'low';
}

/**
 * Add question to work queue for improvement
 */
async function enqueueForImprovement(questionId, reason, priority = 5, dryRun = false) {
  if (dryRun) {
    console.log(`[DRY RUN] Would enqueue ${questionId} with priority ${priority}: ${reason}`);
    return;
  }
  
  await db.execute({
    sql: `
      INSERT INTO work_queue (item_type, item_id, action, priority, reason, created_by, assigned_to, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    args: [
      'question',
      questionId,
      'improve',
      priority,
      reason,
      'truncation-detector',
      'processor',
      'pending'
    ]
  });
}

/**
 * Main function
 */
async function main() {
  console.log('=== 🔍 Truncated Answer Detector ===\n');
  
  // Initialize bot tables
  await initBotTables();
  
  // Parse arguments
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const channelArg = args.find(a => a.startsWith('--channel='));
  const limitArg = args.find(a => a.startsWith('--limit='));
  
  const channel = channelArg ? channelArg.split('=')[1] : null;
  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : null;
  
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
  if (channel) console.log(`Channel filter: ${channel}`);
  if (limit) console.log(`Limit: ${limit} questions`);
  console.log();
  
  // Build query
  let query = `
    SELECT id, question, answer, channel, difficulty, last_updated
    FROM questions
    WHERE status = 'active'
  `;
  
  const args_db = [];
  if (channel) {
    query += ` AND channel = ?`;
    args_db.push(channel);
  }
  
  query += ` ORDER BY created_at DESC`;
  
  if (limit) {
    query += ` LIMIT ?`;
    args_db.push(limit);
  }
  
  const result = await db.execute({ sql: query, args: args_db });
  const questions = result.rows;
  
  console.log(`📊 Analyzing ${questions.length} questions...\n`);
  
  const results = {
    total: questions.length,
    truncated: 0,
    bySeverity: {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    },
    byChannel: {},
    enqueued: 0
  };
  
  const truncatedQuestions = [];
  
  for (const q of questions) {
    if (isTruncated(q.answer)) {
      results.truncated++;
      
      const severity = getTruncationSeverity(q.answer);
      results.bySeverity[severity]++;
      
      if (!results.byChannel[q.channel]) {
        results.byChannel[q.channel] = 0;
      }
      results.byChannel[q.channel]++;
      
      truncatedQuestions.push({
        id: q.id,
        question: q.question.substring(0, 80) + '...',
        answer: q.answer,
        answerLength: q.answer.length,
        channel: q.channel,
        difficulty: q.difficulty,
        severity,
        lastUpdated: q.last_updated
      });
      
      // Determine priority based on severity
      const priority = {
        critical: 1,
        high: 2,
        medium: 3,
        low: 4
      }[severity];
      
      const reason = `Truncated answer detected (${severity} severity, ${q.answer.length} chars)`;
      
      try {
        await enqueueForImprovement(q.id, reason, priority, dryRun);
        results.enqueued++;
      } catch (error) {
        console.error(`❌ Failed to enqueue ${q.id}: ${error.message}`);
      }
    }
  }
  
  // Display results
  console.log('=== 📈 Results ===\n');
  console.log(`Total questions analyzed: ${results.total}`);
  console.log(`Truncated answers found: ${results.truncated} (${((results.truncated / results.total) * 100).toFixed(1)}%)`);
  console.log();
  
  console.log('By Severity:');
  console.log(`  🔴 Critical: ${results.bySeverity.critical}`);
  console.log(`  🟠 High: ${results.bySeverity.high}`);
  console.log(`  🟡 Medium: ${results.bySeverity.medium}`);
  console.log(`  🟢 Low: ${results.bySeverity.low}`);
  console.log();
  
  if (Object.keys(results.byChannel).length > 0) {
    console.log('By Channel:');
    for (const [ch, count] of Object.entries(results.byChannel).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${ch}: ${count}`);
    }
    console.log();
  }
  
  console.log(`${dryRun ? 'Would enqueue' : 'Enqueued'}: ${results.enqueued} questions`);
  console.log();
  
  // Show sample truncated questions
  if (truncatedQuestions.length > 0) {
    console.log('=== 📋 Sample Truncated Questions ===\n');
    
    const samples = truncatedQuestions
      .sort((a, b) => {
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      })
      .slice(0, 10);
    
    for (const q of samples) {
      const severityIcon = {
        critical: '🔴',
        high: '🟠',
        medium: '🟡',
        low: '🟢'
      }[q.severity];
      
      console.log(`${severityIcon} [${q.severity.toUpperCase()}] ${q.id}`);
      console.log(`   Channel: ${q.channel} | Difficulty: ${q.difficulty}`);
      console.log(`   Question: ${q.question}`);
      console.log(`   Answer (${q.answerLength} chars): ${q.answer.substring(0, 150)}...`);
      console.log();
    }
  }
  
  if (dryRun) {
    console.log('💡 Run without --dry-run to actually enqueue these questions for improvement');
  } else {
    console.log('✅ Questions have been enqueued for improvement processing');
    console.log('💡 Run the processor bot to improve these questions:');
    console.log('   node script/bots/processor-bot.js');
  }
}

// Run
main().catch(console.error);
