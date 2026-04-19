#!/usr/bin/env node

/**
 * Daily Job: Generate Learning Paths
 * 
 * Scans RAG database and questions to create personalized learning paths:
 * - Company-specific paths (based on company tags in questions)
 * - Job title-specific paths (using job title relevance scores)
 * - Skill-based paths (using RAG clustering)
 * 
 * Run daily via GitHub Actions or cron
 */

import { dbClient as client } from './utils.js';
import ragService from './ai/services/rag-enhanced-generation.js';
import jobTitleService from './ai/services/job-title-relevance.js';
import vectorDB from './ai/services/vector-db.js';

// Top companies to generate paths for
const TARGET_COMPANIES = [
  'Google', 'Amazon', 'Meta', 'Microsoft', 'Apple',
  'Netflix', 'Uber', 'Airbnb', 'Stripe', 'Shopify',
  'Twitter', 'LinkedIn', 'Salesforce', 'Adobe', 'Oracle'
];

// Job titles from job-title-relevance service
const JOB_TITLES = Object.keys(jobTitleService.JOB_TITLE_CONFIGS);

// ============================================
// MAIN GENERATION FLOW
// ============================================

async function generateAllLearningPaths() {
  console.log('🚀 Starting learning path generation...\n');
  
  await vectorDB.init();
  
  // Verify DB connectivity before proceeding
  try {
    await client.execute({ sql: 'SELECT 1', args: [] });
  } catch (err) {
    console.warn(`⚠️  Could not connect to database: ${err.message}`);
    console.warn('   Skipping learning path generation');
    return;
  }
  
  const stats = {
    companyPaths: 0,
    jobTitlePaths: 0,
    skillPaths: 0,
    total: 0
  };
  
  // 1. Generate company-specific paths
  console.log('📊 Generating company-specific paths...');
  for (const company of TARGET_COMPANIES) {
    const paths = await generateCompanyPaths(company);
    stats.companyPaths += paths.length;
    stats.total += paths.length;
  }
  
  // 2. Generate job title-specific paths
  console.log('\n💼 Generating job title-specific paths...');
  for (const jobTitle of JOB_TITLES) {
    const paths = await generateJobTitlePaths(jobTitle);
    stats.jobTitlePaths += paths.length;
    stats.total += paths.length;
  }
  
  // 3. Generate skill-based paths using RAG clustering
  console.log('\n🎯 Generating skill-based paths...');
  const skillPaths = await generateSkillBasedPaths();
  stats.skillPaths = skillPaths.length;
  stats.total += skillPaths.length;
  
  console.log('\n✅ Learning path generation complete!');
  console.log(`   Company paths: ${stats.companyPaths}`);
  console.log(`   Job title paths: ${stats.jobTitlePaths}`);
  console.log(`   Skill paths: ${stats.skillPaths}`);
  console.log(`   Total: ${stats.total}`);
}

// ============================================
// COMPANY-SPECIFIC PATHS
// ============================================

async function generateCompanyPaths(company) {
  console.log(`  Analyzing ${company}...`);
  
  // Get all questions tagged with this company
  const result = await client.execute({
    sql: `SELECT * FROM questions 
          WHERE companies LIKE ? AND status = 'active'
          ORDER BY relevance_score DESC`,
    args: [`%"${company}"%`]
  });
  
  if (result.rows.length < 10) {
    console.log(`    ⚠️  Insufficient data (${result.rows.length} questions)`);
    return [];
  }
  
  console.log(`    Found ${result.rows.length} questions`);
  
  // Group by difficulty
  const byDifficulty = {
    beginner: [],
    intermediate: [],
    advanced: []
  };
  
  for (const row of result.rows) {
    const diff = row.difficulty || 'intermediate';
    if (byDifficulty[diff]) {
      byDifficulty[diff].push(row);
    }
  }
  
  const paths = [];
  
  // Create a path for each difficulty level (if enough questions)
  for (const [difficulty, questions] of Object.entries(byDifficulty)) {
    if (questions.length < 5) continue;
    
    // Use RAG to order questions intelligently
    const orderedQuestions = await orderQuestionsWithRAG(questions);
    
    // Extract channels and tags
    const channels = [...new Set(questions.map(q => q.channel))];
    const allTags = questions.flatMap(q => 
      q.tags ? JSON.parse(q.tags) : []
    );
    const topTags = getTopTags(allTags, 10);
    
    // Create learning objectives
    const objectives = generateLearningObjectives(company, difficulty, channels);
    
    // Create milestones (every 25% of questions)
    const milestones = createMilestones(orderedQuestions.length);
    
    const pathId = `company-${company.toLowerCase()}-${difficulty}`;
    const path = {
      id: pathId,
      title: `${company} Interview Prep - ${capitalize(difficulty)}`,
      description: `Master ${company} interview questions at ${difficulty} level. Covers ${channels.join(', ')} with real questions asked at ${company}.`,
      pathType: 'company',
      targetCompany: company,
      targetJobTitle: null,
      difficulty,
      estimatedHours: Math.ceil(orderedQuestions.length * 0.5), // 30 min per question
      questionIds: JSON.stringify(orderedQuestions.map(q => q.id)),
      channels: JSON.stringify(channels),
      tags: JSON.stringify(topTags),
      prerequisites: JSON.stringify([]),
      learningObjectives: JSON.stringify(objectives),
      milestones: JSON.stringify(milestones),
      popularity: 0,
      completionRate: 0,
      averageRating: 0,
      metadata: JSON.stringify({
        totalQuestions: orderedQuestions.length,
        generatedFrom: 'company-tags',
        company
      }),
      status: 'active',
      lastGenerated: new Date().toISOString()
    };
    
    await upsertLearningPath(path);
    paths.push(path);
    console.log(`    ✓ Created ${difficulty} path (${orderedQuestions.length} questions)`);
  }
  
  return paths;
}

// ============================================
// JOB TITLE-SPECIFIC PATHS
// ============================================

async function generateJobTitlePaths(jobTitle) {
  console.log(`  Analyzing ${jobTitle}...`);
  
  const config = jobTitleService.JOB_TITLE_CONFIGS[jobTitle];
  if (!config) return [];
  
  // Get questions relevant to this job title
  const result = await client.execute({
    sql: `SELECT * FROM questions 
          WHERE job_title_relevance IS NOT NULL 
          AND status = 'active'
          ORDER BY relevance_score DESC
          LIMIT 500`
  });
  
  // Filter by relevance score
  const relevantQuestions = result.rows.filter(row => {
    if (!row.job_title_relevance) return false;
    const relevance = JSON.parse(row.job_title_relevance);
    return relevance[jobTitle] && relevance[jobTitle] >= 40; // Threshold
  });
  
  if (relevantQuestions.length < 10) {
    console.log(`    ⚠️  Insufficient data (${relevantQuestions.length} questions)`);
    return [];
  }
  
  console.log(`    Found ${relevantQuestions.length} relevant questions`);
  
  // Sort by relevance score
  relevantQuestions.sort((a, b) => {
    const aScore = JSON.parse(a.job_title_relevance)[jobTitle] || 0;
    const bScore = JSON.parse(b.job_title_relevance)[jobTitle] || 0;
    return bScore - aScore;
  });
  
  // Group by difficulty
  const byDifficulty = {
    beginner: [],
    intermediate: [],
    advanced: []
  };
  
  for (const q of relevantQuestions) {
    const diff = q.difficulty || 'intermediate';
    if (byDifficulty[diff]) {
      byDifficulty[diff].push(q);
    }
  }
  
  const paths = [];
  
  // Create comprehensive path for each difficulty
  for (const [difficulty, questions] of Object.entries(byDifficulty)) {
    if (questions.length < 5) continue;
    
    // Take top questions by relevance
    const topQuestions = questions.slice(0, Math.min(50, questions.length));
    
    // Order with RAG
    const orderedQuestions = await orderQuestionsWithRAG(topQuestions);
    
    const channels = [...new Set(questions.map(q => q.channel))];
    const allTags = questions.flatMap(q => q.tags ? JSON.parse(q.tags) : []);
    const topTags = getTopTags(allTags, 10);
    
    const objectives = generateJobTitleObjectives(jobTitle, difficulty, channels);
    const milestones = createMilestones(orderedQuestions.length);
    
    const pathId = `job-title-${jobTitle}-${difficulty}`;
    const path = {
      id: pathId,
      title: `${formatJobTitle(jobTitle)} Path - ${capitalize(difficulty)}`,
      description: `Comprehensive ${difficulty} level path for ${formatJobTitle(jobTitle)} roles. Master ${channels.slice(0, 3).join(', ')} and more.`,
      pathType: 'job-title',
      targetCompany: null,
      targetJobTitle: jobTitle,
      difficulty,
      estimatedHours: Math.ceil(orderedQuestions.length * 0.5),
      questionIds: JSON.stringify(orderedQuestions.map(q => q.id)),
      channels: JSON.stringify(channels),
      tags: JSON.stringify(topTags),
      prerequisites: JSON.stringify(difficulty === 'advanced' ? [`job-title-${jobTitle}-intermediate`] : []),
      learningObjectives: JSON.stringify(objectives),
      milestones: JSON.stringify(milestones),
      popularity: 0,
      completionRate: 0,
      averageRating: 0,
      metadata: JSON.stringify({
        totalQuestions: orderedQuestions.length,
        generatedFrom: 'job-title-relevance',
        jobTitle,
        primaryChannels: config.primaryChannels
      }),
      status: 'active',
      lastGenerated: new Date().toISOString()
    };
    
    await upsertLearningPath(path);
    paths.push(path);
    console.log(`    ✓ Created ${difficulty} path (${orderedQuestions.length} questions)`);
  }
  
  return paths;
}

// ============================================
// SKILL-BASED PATHS (RAG CLUSTERING)
// ============================================

async function generateSkillBasedPaths() {
  console.log('  Using RAG to identify skill clusters...');
  
  // Get all channels
  const channelsResult = await client.execute(
    "SELECT DISTINCT channel FROM questions WHERE status = 'active'"
  );
  
  const paths = [];
  
  for (const row of channelsResult.rows) {
    const channel = row.channel;
    
    // Find coverage gaps using RAG
    const gaps = await ragService.findCoverageGaps(channel, { minQuestions: 5 });
    
    if (gaps.gaps.length === 0) continue;
    
    // For each high-priority gap, create a focused learning path
    const highPriorityGaps = gaps.gaps.filter(g => g.priority === 'high').slice(0, 3);
    
    for (const gap of highPriorityGaps) {
      const concept = gap.concept;
      
      // Get questions for this concept using RAG
      const context = await ragService.getGenerationContext(concept, {
        channel,
        limit: 30
      });
      
      if (!context.hasContext || context.related.length < 5) continue;
      
      const questions = context.related;
      const orderedQuestions = await orderQuestionsWithRAG(questions);
      
      const pathId = `skill-${channel}-${concept.replace(/\s+/g, '-')}`;
      const path = {
        id: pathId,
        title: `Master ${capitalize(concept)} in ${capitalize(channel)}`,
        description: `Deep dive into ${concept} with curated questions and explanations. Fill knowledge gaps in ${channel}.`,
        pathType: 'skill',
        targetCompany: null,
        targetJobTitle: null,
        difficulty: 'intermediate',
        estimatedHours: Math.ceil(orderedQuestions.length * 0.5),
        questionIds: JSON.stringify(orderedQuestions.map(q => q.id)),
        channels: JSON.stringify([channel]),
        tags: JSON.stringify([concept, ...context.concepts.slice(0, 5)]),
        prerequisites: JSON.stringify([]),
        learningObjectives: JSON.stringify([
          `Understand core concepts of ${concept}`,
          `Apply ${concept} in real-world scenarios`,
          `Master common interview questions about ${concept}`
        ]),
        milestones: JSON.stringify(createMilestones(orderedQuestions.length)),
        popularity: 0,
        completionRate: 0,
        averageRating: 0,
        metadata: JSON.stringify({
          totalQuestions: orderedQuestions.length,
          generatedFrom: 'rag-gap-analysis',
          channel,
          concept,
          gapPriority: gap.priority
        }),
        status: 'active',
        lastGenerated: new Date().toISOString()
      };
      
      await upsertLearningPath(path);
      paths.push(path);
      console.log(`    ✓ Created skill path: ${concept} (${orderedQuestions.length} questions)`);
    }
  }
  
  return paths;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

async function orderQuestionsWithRAG(questions) {
  // Use RAG to order questions from foundational to advanced
  // For now, simple ordering by difficulty and relevance
  const ordered = [...questions].sort((a, b) => {
    const diffOrder = { beginner: 1, intermediate: 2, advanced: 3 };
    const aDiff = diffOrder[a.difficulty] || 2;
    const bDiff = diffOrder[b.difficulty] || 2;
    
    if (aDiff !== bDiff) return aDiff - bDiff;
    
    const aScore = a.relevance_score || 50;
    const bScore = b.relevance_score || 50;
    return bScore - aScore;
  });
  
  return ordered;
}

function getTopTags(tags, limit = 10) {
  const counts = {};
  tags.forEach(tag => {
    counts[tag] = (counts[tag] || 0) + 1;
  });
  
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag]) => tag);
}

function generateLearningObjectives(company, difficulty, channels) {
  return [
    `Master ${company} interview questions at ${difficulty} level`,
    `Understand ${company}'s technical expectations`,
    `Practice questions across ${channels.join(', ')}`,
    `Build confidence for ${company} interviews`
  ];
}

function generateJobTitleObjectives(jobTitle, difficulty, channels) {
  const formatted = formatJobTitle(jobTitle);
  return [
    `Master core skills for ${formatted} roles`,
    `Practice ${difficulty} level questions`,
    `Cover essential topics: ${channels.slice(0, 3).join(', ')}`,
    `Prepare for real-world ${formatted} interviews`
  ];
}

function createMilestones(totalQuestions) {
  const milestones = [];
  const checkpoints = [0.25, 0.5, 0.75, 1.0];
  
  for (const checkpoint of checkpoints) {
    const questionIndex = Math.floor(totalQuestions * checkpoint);
    milestones.push({
      percentage: checkpoint * 100,
      questionIndex,
      title: checkpoint === 1.0 ? 'Path Complete!' : `${checkpoint * 100}% Complete`,
      description: checkpoint === 1.0 
        ? 'Congratulations! You\'ve completed this learning path.'
        : `Keep going! You're ${checkpoint * 100}% through the path.`
    });
  }
  
  return milestones;
}

async function upsertLearningPath(path) {
  // Check if exists
  const existing = await client.execute({
    sql: 'SELECT id FROM learning_paths WHERE id = ?',
    args: [path.id]
  });
  
  if (existing.rows.length > 0) {
    // Update
    await client.execute({
      sql: `UPDATE learning_paths SET 
            title = ?, description = ?, difficulty = ?, estimated_hours = ?,
            question_ids = ?, channels = ?, tags = ?, prerequisites = ?,
            learning_objectives = ?, milestones = ?, metadata = ?,
            last_updated = ?, last_generated = ?
            WHERE id = ?`,
      args: [
        path.title, path.description, path.difficulty, path.estimatedHours,
        path.questionIds, path.channels, path.tags, path.prerequisites,
        path.learningObjectives, path.milestones, path.metadata,
        new Date().toISOString(), path.lastGenerated, path.id
      ]
    });
  } else {
    // Insert
    await client.execute({
      sql: `INSERT INTO learning_paths (
        id, title, description, path_type, target_company, target_job_title,
        difficulty, estimated_hours, question_ids, channels, tags, prerequisites,
        learning_objectives, milestones, popularity, completion_rate, average_rating,
        metadata, status, created_at, last_updated, last_generated
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        path.id, path.title, path.description, path.pathType, path.targetCompany,
        path.targetJobTitle, path.difficulty, path.estimatedHours, path.questionIds,
        path.channels, path.tags, path.prerequisites, path.learningObjectives,
        path.milestones, path.popularity, path.completionRate, path.averageRating,
        path.metadata, path.status, new Date().toISOString(), new Date().toISOString(),
        path.lastGenerated
      ]
    });
  }
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatJobTitle(jobTitle) {
  return jobTitle.split('-').map(capitalize).join(' ');
}

// ============================================
// RUN
// ============================================

generateAllLearningPaths()
  .then(() => {
    console.log('\n🎉 All done!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
