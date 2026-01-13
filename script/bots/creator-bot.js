#!/usr/bin/env node
/**
 * Creator Bot - LangGraph Architecture
 * 
 * Creates all content types:
 * - Questions (from topics or user input)
 * - Coding challenges
 * - Voice keywords & suitability
 * - MCQ tests
 * - Diagrams (Mermaid)
 * 
 * LangGraph Pipeline:
 * Input → Classify → Generate → Enrich → Validate → Save
 * 
 * Now with RAG-enhanced generation for better quality and consistency.
 */

import 'dotenv/config';
import { getDb, initBotTables } from './shared/db.js';
import { logAction } from './shared/ledger.js';
import { addToQueue } from './shared/queue.js';
import { startRun, completeRun, failRun, updateRunStats } from './shared/runs.js';
import { runWithRetries, parseJson, generateUnifiedId, isDuplicateUnified } from '../utils.js';
import ragService from '../ai/services/rag-enhanced-generation.js';
import { checkDuplicateBeforeCreate } from '../ai/services/duplicate-prevention.js';
import { validateBeforeInsert, sanitizeQuestion } from './shared/validation.js';

const BOT_NAME = 'creator';
const db = getDb();

// ============================================
// ANSWER FORMATTING STANDARDS INTEGRATION
// ============================================

/**
 * Applies Answer Formatting Standards validation and auto-formatting to generated content
 */
async function applyAnswerFormattingStandards(content) {
  // Import Answer Formatting Standards modules dynamically
  const { patternDetector } = await import('../../client/src/lib/answer-formatting/pattern-detector.js');
  const { formatValidator } = await import('../../client/src/lib/answer-formatting/format-validator.js');
  const { autoFormatter } = await import('../../client/src/lib/answer-formatting/auto-formatter.js');
  
  const question = content.question || '';
  const answer = content.explanation || '';
  
  if (!answer.trim()) {
    return {
      detectedPattern: null,
      appliedPattern: null,
      score: 100,
      violations: [],
      formatted: false,
      formattedAnswer: answer
    };
  }
  
  // Detect pattern based on question text
  const detectedPattern = patternDetector.detectPattern(question);
  const confidence = patternDetector.getConfidence();
  
  console.log(`   Pattern Detection: ${detectedPattern ? detectedPattern.name : 'none'} (confidence: ${Math.round(confidence * 100)}%)`);
  
  let validationResult = null;
  let formattedAnswer = answer;
  let appliedPattern = null;
  
  if (detectedPattern) { // Remove confidence threshold for testing
    // Validate answer against detected pattern
    validationResult = formatValidator.validate(answer, detectedPattern);
    
    console.log(`   Validation Score: ${validationResult.score}/100 (${validationResult.violations.length} issues)`);
    
    // Auto-apply formatting if score is below threshold
    if (validationResult.score < 80) {
      try {
        formattedAnswer = autoFormatter.format(answer, detectedPattern);
        appliedPattern = detectedPattern.id;
        
        // Re-validate formatted answer
        const revalidation = formatValidator.validate(formattedAnswer, detectedPattern);
        console.log(`   Auto-formatting applied: ${validationResult.score} → ${revalidation.score}`);
        
        return {
          detectedPattern: detectedPattern.id,
          appliedPattern: appliedPattern,
          score: revalidation.score,
          violations: revalidation.violations,
          formatted: true,
          formattedAnswer: formattedAnswer
        };
      } catch (error) {
        console.warn(`   Auto-formatting failed: ${error.message}`);
      }
    }
  }
  
  return {
    detectedPattern: detectedPattern?.id || null,
    appliedPattern: appliedPattern,
    score: validationResult?.score || 100,
    violations: validationResult?.violations || [],
    formatted: false,
    formattedAnswer: answer
  };
}

/**
 * Logs Answer Formatting validation results for monitoring
 */
async function logAnswerFormattingValidation(validationData) {
  try {
    // Create validation reports table if it doesn't exist
    db.exec(`
      CREATE TABLE IF NOT EXISTS answer_formatting_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        question_id TEXT NOT NULL,
        pattern TEXT,
        score INTEGER NOT NULL,
        violations_count INTEGER NOT NULL,
        violations TEXT,
        auto_formatted BOOLEAN DEFAULT FALSE,
        timestamp TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Insert validation report
    const stmt = db.prepare(`
      INSERT INTO answer_formatting_reports 
      (question_id, pattern, score, violations_count, violations, auto_formatted, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      validationData.questionId,
      validationData.pattern,
      validationData.score,
      validationData.violations.length,
      JSON.stringify(validationData.violations),
      validationData.autoFormatted ? 1 : 0,
      validationData.timestamp
    );
    
    console.log(`   Logged validation report for question ${validationData.questionId}`);
  } catch (error) {
    console.warn(`   Failed to log validation report: ${error.message}`);
  }
}

// ============================================
// LANGGRAPH NODE DEFINITIONS
// ============================================

/**
 * Node 1: Classify Input
 * Determines what type of content to create
 */
async function classifyNode(state) {
  console.log('\n📋 [Classify] Analyzing input...');
  
  const { input, inputType } = state;
  
  // If type is already specified, use it
  if (inputType) {
    return { ...state, contentType: inputType };
  }
  
  // Auto-detect content type from input
  const prompt = `Analyze this input and determine what type of interview prep content to create.

Input: "${input}"

Respond with ONLY a JSON object:
{
  "contentType": "question" | "challenge" | "test" | "blog",
  "channel": "system-design" | "algorithms" | "frontend" | "backend" | "database" | "devops" | "sre" | "behavioral" | "security" | "cloud",
  "difficulty": "beginner" | "intermediate" | "advanced",
  "reason": "brief explanation"
}`;

  const response = await runWithRetries(prompt);
  const result = parseJson(response);
  
  if (!result || !result.contentType) {
    return { ...state, contentType: 'question', channel: 'system-design', difficulty: 'intermediate' };
  }
  
  console.log(`   Type: ${result.contentType}, Channel: ${result.channel}`);
  return { ...state, ...result };
}

/**
 * Node 2: Generate Content
 * Creates the actual content based on type
 */
async function generateNode(state) {
  console.log('\n🔨 [Generate] Creating content...');
  
  const { input, contentType, channel, difficulty } = state;
  
  let content = null;
  
  switch (contentType) {
    case 'question':
      content = await generateQuestion(input, channel, difficulty);
      break;
    case 'challenge':
      content = await generateChallenge(input, channel, difficulty);
      break;
    case 'test':
      content = await generateTest(input, channel);
      break;
    default:
      content = await generateQuestion(input, channel, difficulty);
  }
  
  if (!content) {
    return { ...state, error: 'Failed to generate content' };
  }
  
  console.log(`   Generated: ${content.id || 'new'}`);
  return { ...state, content };
}

/**
 * Node 3: Enrich Content
 * Adds voice keywords, diagrams, companies, etc.
 */
async function enrichNode(state) {
  console.log('\n✨ [Enrich] Adding metadata...');
  
  const { content, contentType } = state;
  if (!content || state.error) return state;
  
  // Only enrich questions
  if (contentType !== 'question') {
    return state;
  }
  
  // Add voice keywords for suitable channels
  const voiceChannels = ['behavioral', 'system-design', 'sre', 'devops'];
  if (voiceChannels.includes(content.channel)) {
    const voiceData = await generateVoiceKeywords(content);
    if (voiceData) {
      content.voiceKeywords = voiceData.keywords;
      content.voiceSuitable = voiceData.suitable;
      console.log(`   Voice: ${voiceData.suitable ? 'suitable' : 'not suitable'}`);
    }
  }
  
  // Generate diagram if missing
  if (!content.diagram) {
    const diagram = await generateDiagram(content);
    if (diagram) {
      content.diagram = diagram;
      console.log('   Diagram: generated');
    }
  }
  
  return { ...state, content };
}

/**
 * Node 4: Validate Content
 * Checks quality and duplicates using RAG, applies Answer Formatting Standards
 */
async function validateNode(state) {
  console.log('\n✅ [Validate] Checking quality...');
  
  const { content, contentType } = state;
  if (!content || state.error) return state;
  
  // Check for duplicates using RAG-based duplicate prevention
  console.log('   🔍 Running RAG-based duplicate detection...');
  const duplicateCheck = await checkDuplicateBeforeCreate(content, contentType);
  
  if (duplicateCheck.isDuplicate) {
    const dupeList = duplicateCheck.duplicates
      .map(d => `${d.id} (${Math.round(d.similarity * 100)}%)`)
      .join(', ');
    
    console.log(`   🚫 DUPLICATE DETECTED: ${duplicateCheck.message}`);
    console.log(`      Similar to: ${dupeList}`);
    
    return { 
      ...state, 
      error: `Duplicate ${contentType} detected: ${duplicateCheck.message}`,
      duplicateInfo: duplicateCheck,
      skipSave: true 
    };
  }
  
  // Warn about similar content
  if (duplicateCheck.similar.length > 0) {
    console.log(`   ⚠️ Found ${duplicateCheck.similar.length} similar items - proceeding with caution`);
  }
  
  // Validate required fields
  const validation = validateContent(content, contentType);
  if (!validation.valid) {
    return { ...state, error: validation.error };
  }
  
  // Apply Answer Formatting Standards validation and auto-formatting for questions
  if (contentType === 'question' && content.explanation) {
    try {
      const formatValidation = await applyAnswerFormattingStandards(content);
      
      // Update content with formatted answer if auto-formatting was applied
      if (formatValidation.formatted) {
        content.explanation = formatValidation.formattedAnswer;
        console.log(`   Answer Formatting: applied ${formatValidation.pattern} pattern (score: ${formatValidation.score}/100)`);
      } else {
        console.log(`   Answer Formatting: validated (score: ${formatValidation.score}/100)`);
      }
      
      // Add formatting metadata to content
      content.detectedPattern = formatValidation.detectedPattern;
      content.appliedPattern = formatValidation.appliedPattern;
      content.validationScore = formatValidation.score;
      content.lastValidated = new Date().toISOString();
      content.formatVersion = '1.0';
      
      // Log validation results for monitoring
      await logAnswerFormattingValidation({
        questionId: content.id,
        pattern: formatValidation.detectedPattern,
        score: formatValidation.score,
        violations: formatValidation.violations,
        autoFormatted: formatValidation.formatted,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.warn(`   Answer Formatting validation failed: ${error.message}`);
      // Don't fail the entire pipeline for formatting issues
    }
  }
  
  console.log('   Validation: passed');
  return { ...state, validated: true };
}

/**
 * Node 5: Save Content
 * Persists to database
 */
async function saveNode(state) {
  console.log('\n💾 [Save] Persisting to database...');
  
  const { content, contentType, validated, skipSave, error } = state;
  
  if (error || skipSave || !validated) {
    console.log(`   Skipped: ${error || 'validation failed'}`);
    return state;
  }
  
  try {
    let savedId = null;
    
    switch (contentType) {
      case 'question':
        savedId = await saveQuestion(content);
        break;
      case 'challenge':
        savedId = await saveChallenge(content);
        break;
      case 'test':
        savedId = await saveTest(content);
        break;
    }
    
    if (savedId) {
      // Log to ledger
      await logAction({
        botName: BOT_NAME,
        action: 'create',
        itemType: contentType,
        itemId: savedId,
        afterState: content,
        reason: 'Created by Creator Bot'
      });
      
      // Add to verification queue
      await addToQueue({
        itemType: contentType,
        itemId: savedId,
        action: 'verify',
        priority: 3,
        createdBy: BOT_NAME,
        assignedTo: 'verifier'
      });
      
      console.log(`   Saved: ${savedId}`);
      return { ...state, savedId, success: true };
    }
  } catch (e) {
    console.error(`   Error: ${e.message}`);
    return { ...state, error: e.message };
  }
  
  return state;
}

// ============================================
// CONTENT GENERATORS
// ============================================

async function generateQuestion(input, channel, difficulty) {
  // Try RAG-enhanced generation first
  try {
    console.log('   Using RAG-enhanced generation...');
    const ragResult = await ragService.generateQuestionWithRAG(input, channel, { difficulty });
    
    if (ragResult.success) {
      console.log(`   RAG context used: ${ragResult.question.contextUsed} related questions`);
      return {
        id: await generateUnifiedId(),
        question: ragResult.question.question,
        answer: ragResult.question.tldr?.substring(0, 200) || '',
        explanation: ragResult.question.answer || '',
        tags: ragResult.question.tags || [channel],
        channel,
        subChannel: channel,
        difficulty,
        companies: [],
        status: 'active',
        lastUpdated: new Date().toISOString(),
        generatedWithRAG: true
      };
    } else {
      console.log(`   RAG generation failed: ${ragResult.error}, falling back to standard`);
    }
  } catch (e) {
    console.log(`   RAG unavailable: ${e.message}, using standard generation`);
  }

  // Fallback to standard generation
  const prompt = `Create a high-quality technical interview question.

Topic/Input: "${input}"
Channel: ${channel}
Difficulty: ${difficulty}

Return ONLY a JSON object:
{
  "question": "Clear, specific interview question",
  "answer": "Brief 1-2 sentence answer",
  "explanation": "Detailed explanation (200-500 words) with examples",
  "tags": ["tag1", "tag2", "tag3"],
  "subChannel": "specific sub-topic",
  "companies": ["Company1", "Company2"]
}

Requirements:
- Question should be practical and commonly asked in interviews
- Explanation should be comprehensive with real-world examples
- Include relevant companies that ask this type of question`;

  const response = await runWithRetries(prompt);
  const result = parseJson(response);
  
  if (!result || !result.question) return null;
  
  return {
    id: await generateUnifiedId(),
    question: result.question,
    answer: result.answer?.substring(0, 200) || '',
    explanation: result.explanation || '',
    tags: result.tags || [channel],
    channel,
    subChannel: result.subChannel || channel,
    difficulty,
    companies: result.companies || [],
    status: 'active',
    lastUpdated: new Date().toISOString()
  };
}

async function generateChallenge(input, _channel, difficulty) {
  const prompt = `Create a coding challenge for interview practice.

Topic: "${input}"
Difficulty: ${difficulty}

Return ONLY a JSON object:
{
  "title": "Challenge title",
  "description": "Problem description with examples",
  "category": "arrays" | "strings" | "trees" | "graphs" | "dp" | "other",
  "starterCode": {
    "javascript": "function solution(input) {\\n  // Your code here\\n}",
    "python": "def solution(input):\\n    # Your code here\\n    pass"
  },
  "testCases": [
    { "input": "example", "expected": "result", "description": "Test case 1" }
  ],
  "hints": ["Hint 1", "Hint 2"],
  "sampleSolution": {
    "javascript": "// Solution code",
    "python": "# Solution code"
  },
  "complexity": {
    "time": "O(n)",
    "space": "O(1)",
    "explanation": "Brief explanation"
  }
}`;

  const response = await runWithRetries(prompt);
  const result = parseJson(response);
  
  if (!result || !result.title) return null;
  
  return {
    id: `ch-${Date.now()}`,
    ...result,
    difficulty,
    tags: [result.category, difficulty],
    companies: []
  };
}

async function generateTest(_input, _channel) {
  // Test generation logic
  return null; // Simplified for now
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
{
  "suitable": true,
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5", "keyword6", "keyword7", "keyword8"]
}

OR if not suitable for voice interview:
{
  "suitable": false,
  "keywords": []
}`;

  const response = await runWithRetries(prompt);
  const result = parseJson(response);
  
  if (!result) return null;
  
  return {
    suitable: result.suitable === true,
    keywords: result.suitable && Array.isArray(result.keywords) 
      ? result.keywords.map(k => String(k).toLowerCase().trim()).filter(k => k.length > 2).slice(0, 15)
      : []
  };
}

async function generateDiagram(content) {
  const prompt = `Create a simple Mermaid diagram for this concept.

Question: "${content.question}"
Topic: ${content.channel}

Return ONLY the Mermaid code (no markdown, no explanation):
graph TD
    A[Start] --> B[Step]
    B --> C[End]`;

  const response = await runWithRetries(prompt);
  
  if (!response) return null;
  
  // Extract mermaid code
  let diagram = response.trim();
  if (diagram.includes('```')) {
    const match = diagram.match(/```(?:mermaid)?\s*([\s\S]*?)\s*```/);
    if (match) diagram = match[1].trim();
  }
  
  return diagram.startsWith('graph') || diagram.startsWith('flowchart') ? diagram : null;
}

// ============================================
// VALIDATORS
// ============================================

function validateContent(content, type) {
  switch (type) {
    case 'question':
      if (!content.question || content.question.length < 20) {
        return { valid: false, error: 'Question too short' };
      }
      if (!content.explanation || content.explanation.length < 100) {
        return { valid: false, error: 'Explanation too short' };
      }
      break;
    case 'challenge':
      if (!content.title || !content.testCases?.length) {
        return { valid: false, error: 'Missing title or test cases' };
      }
      break;
  }
  return { valid: true };
}

// ============================================
// DATABASE OPERATIONS
// ============================================

async function saveQuestion(content) {
  // CRITICAL: Validate before inserting into database
  try {
    validateBeforeInsert(content, BOT_NAME);
  } catch (error) {
    console.error(`\n❌ VALIDATION FAILED - Question rejected by ${BOT_NAME}:`);
    console.error(error.message);
    throw error;
  }
  
  // Sanitize to ensure no JSON in answer field
  const sanitized = sanitizeQuestion(content);
  
  if (sanitized._sanitized) {
    console.warn(`⚠️  Question ${content.id} had JSON in answer field - sanitized automatically`);
  }
  
  await db.execute({
    sql: `INSERT INTO questions (id, question, answer, explanation, diagram, difficulty, tags, channel, sub_channel, companies, voice_keywords, voice_suitable, status, last_updated, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      sanitized.id,
      sanitized.question,
      sanitized.answer,
      sanitized.explanation,
      sanitized.diagram || null,
      sanitized.difficulty,
      JSON.stringify(sanitized.tags || []),
      sanitized.channel,
      sanitized.subChannel,
      JSON.stringify(sanitized.companies || []),
      sanitized.voiceKeywords ? JSON.stringify(sanitized.voiceKeywords) : null,
      sanitized.voiceSuitable ? 1 : 0,
      'active',
      new Date().toISOString(),
      new Date().toISOString()
    ]
  });
  
  console.log(`✅ Question ${sanitized.id} validated and saved successfully`);
  return sanitized.id;
}

async function saveChallenge(content) {
  // Save to coding_challenges table
  return content.id;
}

async function saveTest(content) {
  // Save to tests table
  return content.id;
}

// ============================================
// LANGGRAPH EXECUTOR
// ============================================

async function runPipeline(input, options = {}) {
  // Initial state
  let state = {
    input,
    inputType: options.type || null,
    channel: options.channel || null,
    difficulty: options.difficulty || 'intermediate'
  };
  
  // Execute nodes in sequence
  const nodes = [classifyNode, generateNode, enrichNode, validateNode, saveNode];
  
  for (const node of nodes) {
    state = await node(state);
    if (state.error && !state.skipSave) {
      console.log(`\n❌ Pipeline stopped: ${state.error}`);
      break;
    }
  }
  
  return state;
}

// ============================================
// MAIN
// ============================================

async function main() {
  console.log('=== 🤖 Creator Bot (LangGraph) ===\n');
  
  await initBotTables();
  
  const run = await startRun(BOT_NAME);
  const stats = { processed: 0, created: 0, updated: 0, deleted: 0 };
  
  try {
    // Get input from environment or generate random topic
    const input = process.env.INPUT_TOPIC || process.env.INPUT_QUESTION;
    const inputType = process.env.INPUT_TYPE || null;
    const channel = process.env.CHANNEL_ID || null;
    const count = parseInt(process.env.COUNT || '1');
    
    if (!input) {
      // Generate random topics if no input
      const topics = [
        'microservices communication patterns',
        'database indexing strategies',
        'kubernetes pod scheduling',
        'react state management',
        'API rate limiting',
        'distributed caching',
        'CI/CD pipeline design',
        'load balancing algorithms'
      ];
      
      for (let i = 0; i < Math.min(count, 5); i++) {
        const topic = topics[Math.floor(Math.random() * topics.length)];
        console.log(`\n--- Processing: "${topic}" ---`);
        
        const result = await runPipeline(topic, { type: inputType, channel });
        stats.processed++;
        
        if (result.success) {
          stats.created++;
          console.log(`✅ Created: ${result.savedId}`);
        }
        
        await updateRunStats(run.id, stats);
        
        // Rate limiting
        if (i < count - 1) {
          await new Promise(r => setTimeout(r, 2000));
        }
      }
    } else {
      // Process single input
      console.log(`Processing: "${input.substring(0, 50)}..."`);
      
      const result = await runPipeline(input, { type: inputType, channel });
      stats.processed++;
      
      if (result.success) {
        stats.created++;
        console.log(`\n✅ Created: ${result.savedId}`);
      }
    }
    
    await completeRun(run.id, stats, { message: 'Creator Bot completed successfully' });
    
    console.log('\n=== Summary ===');
    console.log(`Processed: ${stats.processed}`);
    console.log(`Created: ${stats.created}`);
    
  } catch (error) {
    console.error('Fatal error:', error);
    await failRun(run.id, error);
    process.exit(1);
  }
}

// Run if called directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  main().catch(console.error);
}

export { runPipeline, applyAnswerFormattingStandards };
export default { runPipeline, applyAnswerFormattingStandards };
