#!/usr/bin/env node
/**
 * Batch Validation Utility
 * 
 * Validates all existing questions against Answer Formatting Standards
 * and generates comprehensive validation reports.
 * 
 * Usage:
 *   node script/batch-validation-utility.js
 *   node script/batch-validation-utility.js --channel=system-design
 *   node script/batch-validation-utility.js --limit=100
 *   node script/batch-validation-utility.js --report-only
 */

import 'dotenv/config';
import { getDb } from './bots/shared/db.js';
import fs from 'fs';
import path from 'path';

const db = getDb();

// ============================================
// ANSWER FORMATTING STANDARDS INTEGRATION
// ============================================

/**
 * Validates a single question using Answer Formatting Standards
 */
async function validateQuestion(question) {
  try {
    // Import Answer Formatting Standards modules
    const { patternDetector } = await import('../client/src/lib/answer-formatting/pattern-detector.js');
    const { formatValidator } = await import('../client/src/lib/answer-formatting/format-validator.js');
    const { autoFormatter } = await import('../client/src/lib/answer-formatting/auto-formatter.js');
    
    const questionText = question.question || '';
    const answer = question.explanation || question.answer || '';
    
    if (!answer.trim()) {
      return {
        questionId: question.id,
        detectedPattern: null,
        validationScore: 100,
        violations: [],
        needsFormatting: false,
        hasContent: false
      };
    }
    
    // Detect pattern
    const detectedPattern = patternDetector.detectPattern(questionText);
    const confidence = patternDetector.getConfidence();
    
    let validationResult = null;
    let needsFormatting = false;
    
    if (detectedPattern) {
      // Validate answer against detected pattern
      validationResult = formatValidator.validate(answer, detectedPattern);
      needsFormatting = validationResult.score < 80;
    }
    
    return {
      questionId: question.id,
      channel: question.channel,
      difficulty: question.difficulty,
      detectedPattern: detectedPattern?.id || null,
      patternName: detectedPattern?.name || null,
      confidence: Math.round(confidence * 100),
      validationScore: validationResult?.score || 100,
      violations: validationResult?.violations || [],
      needsFormatting,
      hasContent: true,
      answerLength: answer.length
    };
    
  } catch (error) {
    console.error(`Error validating question ${question.id}:`, error.message);
    return {
      questionId: question.id,
      detectedPattern: null,
      validationScore: 0,
      violations: [{ severity: 'error', message: `Validation failed: ${error.message}` }],
      needsFormatting: false,
      hasContent: false,
      error: error.message
    };
  }
}

/**
 * Gets all questions from the database
 */
async function getAllQuestions(options = {}) {
  const { channel, limit, offset = 0 } = options;
  
  let query = `
    SELECT id, question, answer, explanation, channel, difficulty, 
           tags, companies, status
    FROM questions 
    WHERE status = 'active'
  `;
  
  const params = [];
  
  if (channel) {
    query += ' AND channel = ?';
    params.push(channel);
  }
  
  query += ' ORDER BY id DESC';
  
  if (limit) {
    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);
  }
  
  const result = await db.execute({ sql: query, args: params });
  return result.rows;
}

/**
 * Gets question count for progress tracking
 */
async function getQuestionCount(options = {}) {
  const { channel } = options;
  
  let query = 'SELECT COUNT(*) as count FROM questions WHERE status = "active"';
  const params = [];
  
  if (channel) {
    query += ' AND channel = ?';
    params.push(channel);
  }
  
  const result = await db.execute({ sql: query, args: params });
  return result.rows[0].count;
}

/**
 * Saves validation results to database
 */
async function saveValidationResults(results) {
  // Create batch validation reports table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS batch_validation_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question_id TEXT NOT NULL,
      channel TEXT,
      difficulty TEXT,
      detected_pattern TEXT,
      pattern_name TEXT,
      confidence INTEGER,
      validation_score INTEGER NOT NULL,
      violations_count INTEGER NOT NULL,
      violations TEXT,
      needs_formatting BOOLEAN DEFAULT FALSE,
      has_content BOOLEAN DEFAULT TRUE,
      answer_length INTEGER,
      error_message TEXT,
      validated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      batch_id TEXT NOT NULL
    )
  `);
  
  const batchId = `batch-${Date.now()}`;
  
  // Insert results one by one
  for (const result of results) {
    await db.execute({
      sql: `
        INSERT INTO batch_validation_reports 
        (question_id, channel, difficulty, detected_pattern, pattern_name, confidence,
         validation_score, violations_count, violations, needs_formatting, has_content,
         answer_length, error_message, batch_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        result.questionId,
        result.channel,
        result.difficulty,
        result.detectedPattern,
        result.patternName,
        result.confidence,
        result.validationScore,
        result.violations.length,
        JSON.stringify(result.violations),
        result.needsFormatting ? 1 : 0,
        result.hasContent ? 1 : 0,
        result.answerLength,
        result.error || null,
        batchId
      ]
    });
  }
  
  return batchId;
}

/**
 * Generates validation report
 */
function generateValidationReport(results, options = {}) {
  const { channel, limit } = options;
  
  // Calculate statistics
  const totalQuestions = results.length;
  const questionsWithContent = results.filter(r => r.hasContent).length;
  const questionsWithPatterns = results.filter(r => r.detectedPattern).length;
  const questionsNeedingFormatting = results.filter(r => r.needsFormatting).length;
  const averageScore = Math.round(
    results.reduce((sum, r) => sum + r.validationScore, 0) / totalQuestions
  );
  
  // Group by pattern
  const patternStats = {};
  results.forEach(result => {
    const pattern = result.detectedPattern || 'no-pattern';
    if (!patternStats[pattern]) {
      patternStats[pattern] = {
        count: 0,
        averageScore: 0,
        needsFormatting: 0,
        totalScore: 0
      };
    }
    patternStats[pattern].count++;
    patternStats[pattern].totalScore += result.validationScore;
    if (result.needsFormatting) patternStats[pattern].needsFormatting++;
  });
  
  // Calculate averages
  Object.keys(patternStats).forEach(pattern => {
    patternStats[pattern].averageScore = Math.round(
      patternStats[pattern].totalScore / patternStats[pattern].count
    );
  });
  
  // Group by channel
  const channelStats = {};
  results.forEach(result => {
    const ch = result.channel || 'unknown';
    if (!channelStats[ch]) {
      channelStats[ch] = {
        count: 0,
        averageScore: 0,
        needsFormatting: 0,
        totalScore: 0
      };
    }
    channelStats[ch].count++;
    channelStats[ch].totalScore += result.validationScore;
    if (result.needsFormatting) channelStats[ch].needsFormatting++;
  });
  
  Object.keys(channelStats).forEach(ch => {
    channelStats[ch].averageScore = Math.round(
      channelStats[ch].totalScore / channelStats[ch].count
    );
  });
  
  // Generate report
  const report = {
    metadata: {
      generatedAt: new Date().toISOString(),
      totalQuestions,
      questionsWithContent,
      questionsWithPatterns,
      questionsNeedingFormatting,
      averageScore,
      filters: { channel, limit }
    },
    summary: {
      contentCoverage: Math.round((questionsWithContent / totalQuestions) * 100),
      patternDetectionRate: Math.round((questionsWithPatterns / totalQuestions) * 100),
      formattingNeededRate: Math.round((questionsNeedingFormatting / totalQuestions) * 100),
      overallQuality: averageScore >= 80 ? 'Good' : averageScore >= 60 ? 'Fair' : 'Poor'
    },
    patternBreakdown: patternStats,
    channelBreakdown: channelStats,
    topIssues: getTopIssues(results),
    questionsNeedingAttention: results
      .filter(r => r.validationScore < 60 || r.violations.length > 2)
      .sort((a, b) => a.validationScore - b.validationScore)
      .slice(0, 20)
      .map(r => ({
        id: r.questionId,
        channel: r.channel,
        score: r.validationScore,
        violations: r.violations.length,
        pattern: r.patternName || 'No pattern detected'
      }))
  };
  
  return report;
}

/**
 * Extracts top validation issues
 */
function getTopIssues(results) {
  const issueCount = {};
  
  results.forEach(result => {
    result.violations.forEach(violation => {
      const key = violation.rule || violation.message;
      issueCount[key] = (issueCount[key] || 0) + 1;
    });
  });
  
  return Object.entries(issueCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([issue, count]) => ({ issue, count }));
}

/**
 * Saves report to file
 */
function saveReportToFile(report, filename) {
  const reportsDir = 'reports';
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  
  const filepath = path.join(reportsDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
  return filepath;
}

/**
 * Prints report summary to console
 */
function printReportSummary(report) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 BATCH VALIDATION REPORT SUMMARY');
  console.log('='.repeat(60));
  
  const { metadata, summary, patternBreakdown, channelBreakdown, topIssues } = report;
  
  console.log(`\n📈 Overall Statistics:`);
  console.log(`   Total Questions: ${metadata.totalQuestions}`);
  console.log(`   Questions with Content: ${metadata.questionsWithContent} (${summary.contentCoverage}%)`);
  console.log(`   Pattern Detection Rate: ${summary.patternDetectionRate}%`);
  console.log(`   Questions Needing Formatting: ${metadata.questionsNeedingFormatting} (${summary.formattingNeededRate}%)`);
  console.log(`   Average Validation Score: ${metadata.averageScore}/100`);
  console.log(`   Overall Quality: ${summary.overallQuality}`);
  
  console.log(`\n🎯 Pattern Breakdown:`);
  Object.entries(patternBreakdown)
    .sort(([,a], [,b]) => b.count - a.count)
    .slice(0, 5)
    .forEach(([pattern, stats]) => {
      const patternName = pattern === 'no-pattern' ? 'No Pattern Detected' : pattern;
      console.log(`   ${patternName}: ${stats.count} questions (avg score: ${stats.averageScore})`);
    });
  
  console.log(`\n📚 Channel Breakdown:`);
  Object.entries(channelBreakdown)
    .sort(([,a], [,b]) => b.count - a.count)
    .slice(0, 5)
    .forEach(([channel, stats]) => {
      console.log(`   ${channel}: ${stats.count} questions (avg score: ${stats.averageScore})`);
    });
  
  if (topIssues.length > 0) {
    console.log(`\n⚠️  Top Issues:`);
    topIssues.slice(0, 5).forEach((issue, i) => {
      console.log(`   ${i + 1}. ${issue.issue} (${issue.count} occurrences)`);
    });
  }
  
  if (report.questionsNeedingAttention.length > 0) {
    console.log(`\n🔍 Questions Needing Attention (lowest scores):`);
    report.questionsNeedingAttention.slice(0, 5).forEach(q => {
      console.log(`   ${q.id} [${q.channel}] - Score: ${q.score}/100 (${q.violations} issues)`);
    });
  }
}

/**
 * Main batch validation function
 */
async function runBatchValidation(options = {}) {
  const { channel, limit, reportOnly = false, batchSize = 50 } = options;
  
  console.log('=== 📋 Batch Validation Utility ===\n');
  
  if (reportOnly) {
    console.log('📊 Report-only mode: Generating report from existing validation data...\n');
    // TODO: Implement report generation from existing data
    console.log('❌ Report-only mode not yet implemented');
    return;
  }
  
  // Get total count for progress tracking
  const totalCount = await getQuestionCount({ channel });
  console.log(`📊 Found ${totalCount} questions to validate`);
  
  if (channel) console.log(`🎯 Filtering by channel: ${channel}`);
  if (limit) console.log(`📏 Limiting to: ${limit} questions`);
  
  const actualLimit = limit ? Math.min(limit, totalCount) : totalCount;
  console.log(`🔄 Processing ${actualLimit} questions in batches of ${batchSize}...\n`);
  
  const allResults = [];
  let processed = 0;
  
  // Process in batches to avoid memory issues
  for (let offset = 0; offset < actualLimit; offset += batchSize) {
    const currentBatchSize = Math.min(batchSize, actualLimit - offset);
    console.log(`📦 Processing batch ${Math.floor(offset / batchSize) + 1}/${Math.ceil(actualLimit / batchSize)} (${currentBatchSize} questions)...`);
    
    const questions = await getAllQuestions({ 
      channel, 
      limit: currentBatchSize, 
      offset 
    });
    
    const batchResults = [];
    for (const question of questions) {
      const result = await validateQuestion(question);
      batchResults.push(result);
      processed++;
      
      // Progress indicator
      if (processed % 10 === 0) {
        const progress = Math.round((processed / actualLimit) * 100);
        process.stdout.write(`\r   Progress: ${processed}/${actualLimit} (${progress}%)`);
      }
    }
    
    allResults.push(...batchResults);
    
    // Small delay between batches
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`\n\n✅ Validation complete! Processed ${processed} questions.`);
  
  // Save results to database
  console.log('💾 Saving validation results to database...');
  const batchId = await saveValidationResults(allResults);
  console.log(`✅ Results saved with batch ID: ${batchId}`);
  
  // Generate report
  console.log('📊 Generating validation report...');
  const report = generateValidationReport(allResults, options);
  
  // Save report to file
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `validation-report-${timestamp}.json`;
  const filepath = saveReportToFile(report, filename);
  console.log(`📄 Report saved to: ${filepath}`);
  
  // Print summary
  printReportSummary(report);
  
  return {
    batchId,
    reportPath: filepath,
    results: allResults,
    report
  };
}

/**
 * Main function
 */
async function main() {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    const getArg = (name) => {
      const arg = args.find(a => a.startsWith(`--${name}=`));
      return arg ? arg.split('=')[1] : null;
    };
    const hasFlag = (name) => args.includes(`--${name}`);
    
    const options = {
      channel: getArg('channel'),
      limit: getArg('limit') ? parseInt(getArg('limit')) : null,
      reportOnly: hasFlag('report-only'),
      batchSize: getArg('batch-size') ? parseInt(getArg('batch-size')) : 50
    };
    
    await runBatchValidation(options);
    
  } catch (error) {
    console.error('\n❌ Batch validation failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if called directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  main().catch(console.error);
}

export { runBatchValidation, validateQuestion, generateValidationReport };
export default { runBatchValidation, validateQuestion, generateValidationReport };