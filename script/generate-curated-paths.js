#!/usr/bin/env node

/**
 * Generate Curated Learning Paths
 * 
 * Analyzes existing questions and creates realistic learning paths based on:
 * - Available content in each channel
 * - Question difficulty distribution
 * - Company interview patterns
 * - Job title requirements
 * - Certification mappings
 */

import 'dotenv/config';
import { dbClient } from './utils.js';
import fs from 'fs';
import path from 'path';

const db = dbClient;
const OUTPUT_DIR = 'client/public/data';

// Get all questions with their metadata
async function getAllQuestions() {
  const result = await db.execute(`
    SELECT id, question, channel, sub_channel, difficulty, tags, companies
    FROM questions
    WHERE status = 'active'
  `);
  return result.rows;
}

// Get question count by channel
async function getChannelStats() {
  const result = await db.execute(`
    SELECT 
      channel,
      COUNT(*) as total,
      SUM(CASE WHEN difficulty = 'beginner' THEN 1 ELSE 0 END) as beginner,
      SUM(CASE WHEN difficulty = 'intermediate' THEN 1 ELSE 0 END) as intermediate,
      SUM(CASE WHEN difficulty = 'advanced' THEN 1 ELSE 0 END) as advanced
    FROM questions
    WHERE status = 'active'
    GROUP BY channel
  `);
  return result.rows;
}

// Get questions by company
async function getQuestionsByCompany(company) {
  const result = await db.execute({
    sql: `
      SELECT id, channel, difficulty
      FROM questions
      WHERE status = 'active' 
      AND companies LIKE ?
    `,
    args: [`%"${company}"%`]
  });
  return result.rows;
}

// Parse JSON fields safely
function parseJSON(field) {
  if (!field) return [];
  try {
    return JSON.parse(field);
  } catch {
    return [];
  }
}

// Generate path ID
function generatePathId(type, name) {
  return `${type}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
}

// Create a balanced question selection
function selectQuestions(questions, targetCount, difficultyMix) {
  const selected = [];
  const byDifficulty = {
    beginner: questions.filter(q => q.difficulty === 'beginner'),
    intermediate: questions.filter(q => q.difficulty === 'intermediate'),
    advanced: questions.filter(q => q.difficulty === 'advanced'),
  };

  // Select based on difficulty mix
  for (const [difficulty, percentage] of Object.entries(difficultyMix)) {
    const count = Math.floor(targetCount * percentage);
    const available = byDifficulty[difficulty] || [];
    const shuffled = available.sort(() => Math.random() - 0.5);
    selected.push(...shuffled.slice(0, count).map(q => q.id));
  }

  return selected;
}

// Generate career-focused paths based on actual content
async function generateCareerPaths(questions, channelStats) {
  const paths = [];

  // Frontend Developer Path
  const frontendQuestions = questions.filter(q => 
    ['frontend', 'react-native', 'javascript', 'css', 'html'].includes(q.channel)
  );
  if (frontendQuestions.length >= 50) {
    paths.push({
      id: generatePathId('career', 'frontend-developer'),
      title: 'Frontend Developer',
      description: 'Master React, JavaScript, and modern web development',
      pathType: 'job-title',
      targetJobTitle: 'frontend-engineer',
      difficulty: 'beginner',
      estimatedHours: Math.ceil(frontendQuestions.length * 0.15),
      questionIds: JSON.stringify(selectQuestions(frontendQuestions, 100, {
        beginner: 0.4,
        intermediate: 0.4,
        advanced: 0.2
      })),
      channels: JSON.stringify(['frontend', 'react-native', 'javascript']),
      tags: JSON.stringify(['react', 'javascript', 'css', 'html', 'typescript']),
      learningObjectives: JSON.stringify([
        'Build responsive web applications',
        'Master React hooks and state management',
        'Understand modern JavaScript (ES6+)',
        'Implement component-based architecture'
      ]),
      milestones: JSON.stringify([
        { title: 'JavaScript Fundamentals', questionCount: 25 },
        { title: 'React Basics', questionCount: 25 },
        { title: 'Advanced React Patterns', questionCount: 25 },
        { title: 'Performance & Optimization', questionCount: 25 }
      ]),
      status: 'active',
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      lastGenerated: new Date().toISOString()
    });
  }

  // Backend Engineer Path
  const backendQuestions = questions.filter(q => 
    ['backend', 'database', 'api', 'microservices', 'nodejs'].includes(q.channel)
  );
  if (backendQuestions.length >= 50) {
    paths.push({
      id: generatePathId('career', 'backend-engineer'),
      title: 'Backend Engineer',
      description: 'Build scalable APIs and microservices',
      pathType: 'job-title',
      targetJobTitle: 'backend-engineer',
      difficulty: 'intermediate',
      estimatedHours: Math.ceil(backendQuestions.length * 0.15),
      questionIds: JSON.stringify(selectQuestions(backendQuestions, 120, {
        beginner: 0.3,
        intermediate: 0.5,
        advanced: 0.2
      })),
      channels: JSON.stringify(['backend', 'database', 'api']),
      tags: JSON.stringify(['nodejs', 'python', 'sql', 'rest-api', 'microservices']),
      learningObjectives: JSON.stringify([
        'Design RESTful APIs',
        'Implement database schemas',
        'Build microservices architecture',
        'Handle authentication and authorization'
      ]),
      milestones: JSON.stringify([
        { title: 'API Design', questionCount: 30 },
        { title: 'Database Management', questionCount: 30 },
        { title: 'Microservices', questionCount: 30 },
        { title: 'Security & Scaling', questionCount: 30 }
      ]),
      status: 'active',
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      lastGenerated: new Date().toISOString()
    });
  }

  // Full Stack Developer Path
  const fullStackQuestions = questions.filter(q => 
    ['frontend', 'backend', 'database', 'devops', 'system-design'].includes(q.channel)
  );
  if (fullStackQuestions.length >= 100) {
    paths.push({
      id: generatePathId('career', 'fullstack-developer'),
      title: 'Full Stack Developer',
      description: 'End-to-end application development',
      pathType: 'job-title',
      targetJobTitle: 'fullstack-engineer',
      difficulty: 'advanced',
      estimatedHours: Math.ceil(fullStackQuestions.length * 0.12),
      questionIds: JSON.stringify(selectQuestions(fullStackQuestions, 150, {
        beginner: 0.25,
        intermediate: 0.5,
        advanced: 0.25
      })),
      channels: JSON.stringify(['frontend', 'backend', 'database', 'devops']),
      tags: JSON.stringify(['react', 'nodejs', 'sql', 'aws', 'system-design']),
      learningObjectives: JSON.stringify([
        'Build complete web applications',
        'Implement both frontend and backend',
        'Deploy and maintain applications',
        'Design scalable architectures'
      ]),
      milestones: JSON.stringify([
        { title: 'Frontend Mastery', questionCount: 40 },
        { title: 'Backend Development', questionCount: 40 },
        { title: 'Database & APIs', questionCount: 35 },
        { title: 'DevOps & Deployment', questionCount: 35 }
      ]),
      status: 'active',
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      lastGenerated: new Date().toISOString()
    });
  }

  // DevOps Engineer Path
  const devopsQuestions = questions.filter(q => 
    ['devops', 'kubernetes', 'aws', 'terraform', 'docker', 'ci-cd'].includes(q.channel)
  );
  if (devopsQuestions.length >= 40) {
    paths.push({
      id: generatePathId('career', 'devops-engineer'),
      title: 'DevOps Engineer',
      description: 'Infrastructure, CI/CD, and cloud platforms',
      pathType: 'job-title',
      targetJobTitle: 'devops-engineer',
      difficulty: 'advanced',
      estimatedHours: Math.ceil(devopsQuestions.length * 0.18),
      questionIds: JSON.stringify(selectQuestions(devopsQuestions, 100, {
        beginner: 0.2,
        intermediate: 0.5,
        advanced: 0.3
      })),
      channels: JSON.stringify(['devops', 'kubernetes', 'aws', 'terraform']),
      tags: JSON.stringify(['kubernetes', 'docker', 'aws', 'terraform', 'ci-cd']),
      learningObjectives: JSON.stringify([
        'Manage cloud infrastructure',
        'Implement CI/CD pipelines',
        'Orchestrate containers with Kubernetes',
        'Automate infrastructure with IaC'
      ]),
      milestones: JSON.stringify([
        { title: 'Cloud Fundamentals', questionCount: 25 },
        { title: 'Container Orchestration', questionCount: 25 },
        { title: 'CI/CD Pipelines', questionCount: 25 },
        { title: 'Infrastructure as Code', questionCount: 25 }
      ]),
      status: 'active',
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      lastGenerated: new Date().toISOString()
    });
  }

  // Data Engineer Path
  const dataQuestions = questions.filter(q => 
    ['data-engineering', 'database', 'python', 'sql', 'etl'].includes(q.channel)
  );
  if (dataQuestions.length >= 40) {
    paths.push({
      id: generatePathId('career', 'data-engineer'),
      title: 'Data Engineer',
      description: 'Data pipelines, warehousing, and analytics',
      pathType: 'job-title',
      targetJobTitle: 'data-engineer',
      difficulty: 'advanced',
      estimatedHours: Math.ceil(dataQuestions.length * 0.18),
      questionIds: JSON.stringify(selectQuestions(dataQuestions, 100, {
        beginner: 0.2,
        intermediate: 0.5,
        advanced: 0.3
      })),
      channels: JSON.stringify(['data-engineering', 'database', 'python']),
      tags: JSON.stringify(['python', 'sql', 'spark', 'airflow', 'data-modeling']),
      learningObjectives: JSON.stringify([
        'Design data pipelines',
        'Build data warehouses',
        'Implement ETL processes',
        'Optimize query performance'
      ]),
      milestones: JSON.stringify([
        { title: 'SQL Mastery', questionCount: 25 },
        { title: 'Data Pipeline Design', questionCount: 25 },
        { title: 'Big Data Processing', questionCount: 25 },
        { title: 'Data Warehousing', questionCount: 25 }
      ]),
      status: 'active',
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      lastGenerated: new Date().toISOString()
    });
  }

  // System Design Path
  const systemDesignQuestions = questions.filter(q => 
    q.channel === 'system-design' || parseJSON(q.tags).includes('system-design')
  );
  if (systemDesignQuestions.length >= 30) {
    paths.push({
      id: generatePathId('skill', 'system-design'),
      title: 'System Design Mastery',
      description: 'Design scalable distributed systems',
      pathType: 'skill',
      difficulty: 'advanced',
      estimatedHours: Math.ceil(systemDesignQuestions.length * 0.25),
      questionIds: JSON.stringify(selectQuestions(systemDesignQuestions, 80, {
        beginner: 0.2,
        intermediate: 0.4,
        advanced: 0.4
      })),
      channels: JSON.stringify(['system-design']),
      tags: JSON.stringify(['scalability', 'distributed-systems', 'architecture', 'design-patterns']),
      learningObjectives: JSON.stringify([
        'Design scalable architectures',
        'Understand distributed systems',
        'Apply design patterns',
        'Handle system trade-offs'
      ]),
      milestones: JSON.stringify([
        { title: 'Fundamentals', questionCount: 20 },
        { title: 'Scalability Patterns', questionCount: 20 },
        { title: 'Distributed Systems', questionCount: 20 },
        { title: 'Real-world Systems', questionCount: 20 }
      ]),
      status: 'active',
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      lastGenerated: new Date().toISOString()
    });
  }

  return paths;
}

// Generate company-specific paths
async function generateCompanyPaths(questions) {
  const paths = [];
  const topCompanies = ['Google', 'Amazon', 'Meta', 'Microsoft', 'Apple'];

  for (const company of topCompanies) {
    const companyQuestions = await getQuestionsByCompany(company);
    
    if (companyQuestions.length >= 30) {
      paths.push({
        id: generatePathId('company', company),
        title: `${company} Interview Prep`,
        description: `Prepare for ${company} technical interviews with real questions`,
        pathType: 'company',
        targetCompany: company,
        difficulty: 'intermediate',
        estimatedHours: Math.ceil(companyQuestions.length * 0.2),
        questionIds: JSON.stringify(companyQuestions.slice(0, 80).map(q => q.id)),
        channels: JSON.stringify([...new Set(companyQuestions.map(q => q.channel))]),
        tags: JSON.stringify([company.toLowerCase(), 'interview-prep', 'faang']),
        learningObjectives: JSON.stringify([
          `Understand ${company}'s interview process`,
          'Practice company-specific questions',
          'Learn common patterns and approaches',
          'Build confidence for the interview'
        ]),
        milestones: JSON.stringify([
          { title: 'Easy Questions', questionCount: Math.ceil(companyQuestions.length * 0.3) },
          { title: 'Medium Questions', questionCount: Math.ceil(companyQuestions.length * 0.4) },
          { title: 'Hard Questions', questionCount: Math.ceil(companyQuestions.length * 0.3) }
        ]),
        status: 'active',
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        lastGenerated: new Date().toISOString()
      });
    }
  }

  return paths;
}

// Get all active certifications
async function getAllCertifications() {
  const result = await db.execute(`
    SELECT id, name, provider, difficulty, category, channel_mappings, estimated_hours
    FROM certifications
    WHERE status = 'active'
  `);
  return result.rows;
}

// Get questions for a certification based on channel mappings
async function getQuestionsForCertification(cert, allQuestions) {
  // First try channel mappings if they exist
  const channelMappings = parseJSON(cert.channel_mappings);
  if (channelMappings && channelMappings.length > 0) {
    const certQuestions = allQuestions.filter(q => {
      return channelMappings.some(mapping => {
        if (mapping.channel === q.channel) {
          // If subChannel is specified, match it too
          if (mapping.subChannel) {
            return mapping.subChannel === q.sub_channel;
          }
          return true;
        }
        return false;
      });
    });
    return certQuestions;
  }

  // Fallback: Use certification ID as channel name
  // Many certifications have questions in channels named after the cert ID
  const certQuestions = allQuestions.filter(q => q.channel === cert.id);
  return certQuestions;
}

// Generate certification-based paths
async function generateCertificationPaths(questions) {
  const paths = [];
  const certifications = await getAllCertifications();

  console.log(`📜 Found ${certifications.length} active certifications\n`);

  for (const cert of certifications) {
    const certQuestions = await getQuestionsForCertification(cert, questions);
    
    // Only create path if we have enough questions (at least 20)
    if (certQuestions.length >= 20) {
      // Determine difficulty mix based on cert difficulty
      let difficultyMix;
      if (cert.difficulty === 'beginner') {
        difficultyMix = { beginner: 0.6, intermediate: 0.3, advanced: 0.1 };
      } else if (cert.difficulty === 'intermediate') {
        difficultyMix = { beginner: 0.3, intermediate: 0.5, advanced: 0.2 };
      } else if (cert.difficulty === 'advanced' || cert.difficulty === 'expert') {
        difficultyMix = { beginner: 0.1, intermediate: 0.4, advanced: 0.5 };
      } else {
        difficultyMix = { beginner: 0.3, intermediate: 0.4, advanced: 0.3 };
      }

      // Select questions based on difficulty mix
      const targetCount = Math.min(certQuestions.length, 100);
      const selectedQuestions = selectQuestions(certQuestions, targetCount, difficultyMix);

      // Get unique channels covered
      const channels = [...new Set(certQuestions.map(q => q.channel))];

      paths.push({
        id: generatePathId('certification', cert.id),
        title: `${cert.name} Prep`,
        description: `Prepare for ${cert.name} certification exam with targeted practice questions`,
        pathType: 'certification',
        targetCompany: null,
        targetJobTitle: null,
        difficulty: cert.difficulty === 'expert' ? 'advanced' : cert.difficulty,
        estimatedHours: cert.estimated_hours || Math.ceil(selectedQuestions.length * 0.15),
        questionIds: JSON.stringify(selectedQuestions),
        channels: JSON.stringify(channels),
        tags: JSON.stringify([cert.provider.toLowerCase().replace(/\s+/g, '-'), cert.category, 'certification', 'exam-prep']),
        learningObjectives: JSON.stringify([
          `Master ${cert.name} exam topics`,
          'Practice with real-world scenarios',
          'Understand key concepts and services',
          'Build confidence for certification exam'
        ]),
        milestones: JSON.stringify([
          { title: 'Foundation', questionCount: Math.ceil(selectedQuestions.length * 0.25) },
          { title: 'Core Concepts', questionCount: Math.ceil(selectedQuestions.length * 0.35) },
          { title: 'Advanced Topics', questionCount: Math.ceil(selectedQuestions.length * 0.25) },
          { title: 'Exam Readiness', questionCount: Math.ceil(selectedQuestions.length * 0.15) }
        ]),
        status: 'active',
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        lastGenerated: new Date().toISOString()
      });
    }
  }

  return paths;
}

// Main function
async function main() {
  console.log('🚀 Generating curated learning paths...\n');

  const questions = await getAllQuestions();
  const channelStats = await getChannelStats();

  console.log(`📊 Found ${questions.length} active questions across ${channelStats.length} channels\n`);

  // Generate paths
  const careerPaths = await generateCareerPaths(questions, channelStats);
  const companyPaths = await generateCompanyPaths(questions);
  const certificationPaths = await generateCertificationPaths(questions);
  const allPaths = [...careerPaths, ...companyPaths, ...certificationPaths];

  console.log(`✨ Generated ${allPaths.length} curated paths:`);
  console.log(`   - ${careerPaths.length} career paths`);
  console.log(`   - ${companyPaths.length} company paths`);
  console.log(`   - ${certificationPaths.length} certification paths\n`);

  // Get existing paths from database
  const existingResult = await db.execute('SELECT id, last_generated FROM learning_paths');
  const existingPaths = new Map(existingResult.rows.map(row => [row.id, row]));

  let created = 0;
  let updated = 0;
  let unchanged = 0;

  // Insert or update paths incrementally
  for (const path of allPaths) {
    const existing = existingPaths.get(path.id);
    
    if (!existing) {
      // New path - insert
      await db.execute({
        sql: `
          INSERT INTO learning_paths (
            id, title, description, path_type, target_company, target_job_title,
            difficulty, estimated_hours, question_ids, channels, tags,
            learning_objectives, milestones, status, created_at, last_updated, last_generated
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        args: [
          path.id, 
          path.title, 
          path.description, 
          path.pathType, 
          path.targetCompany || null, 
          path.targetJobTitle || null,
          path.difficulty, 
          path.estimatedHours, 
          path.questionIds, 
          path.channels, 
          path.tags || '[]',
          path.learningObjectives || '[]', 
          path.milestones || '[]', 
          path.status, 
          path.createdAt, 
          path.lastUpdated || null, 
          path.lastGenerated || null
        ]
      });
      const questionCount = JSON.parse(path.questionIds).length;
      console.log(`  ✨ NEW: ${path.title} (${questionCount} questions, ${path.estimatedHours}h)`);
      created++;
    } else {
      // Existing path - update with fresh questions
      await db.execute({
        sql: `
          UPDATE learning_paths 
          SET 
            title = ?,
            description = ?,
            difficulty = ?,
            estimated_hours = ?,
            question_ids = ?,
            channels = ?,
            tags = ?,
            learning_objectives = ?,
            milestones = ?,
            last_updated = ?,
            last_generated = ?
          WHERE id = ?
        `,
        args: [
          path.title,
          path.description,
          path.difficulty,
          path.estimatedHours,
          path.questionIds,
          path.channels,
          path.tags || '[]',
          path.learningObjectives || '[]',
          path.milestones || '[]',
          new Date().toISOString(),
          new Date().toISOString(),
          path.id
        ]
      });
      const questionCount = JSON.parse(path.questionIds).length;
      console.log(`  🔄 UPDATED: ${path.title} (${questionCount} questions, ${path.estimatedHours}h)`);
      updated++;
    }
  }

  // Check for paths that no longer have enough questions (mark as archived, don't delete)
  const generatedIds = new Set(allPaths.map(p => p.id));
  for (const [existingId, existingPath] of existingPaths) {
    if (!generatedIds.has(existingId)) {
      // Path no longer meets criteria - archive it instead of deleting
      await db.execute({
        sql: `UPDATE learning_paths SET status = 'archived', last_updated = ? WHERE id = ?`,
        args: [new Date().toISOString(), existingId]
      });
      console.log(`  📦 ARCHIVED: ${existingId} (insufficient questions)`);
    } else {
      unchanged++;
    }
  }

  console.log(`\n✅ Pipeline complete!`);
  console.log(`   📊 Summary: ${created} created, ${updated} updated, ${unchanged - updated} unchanged`);
  console.log(`\n💡 Paths are stored in database and will be enhanced on next run.`);
  console.log(`   Run this script daily to keep paths fresh with latest content.`);

  // Export to JSON for static site
  console.log(`\n📦 Exporting to static JSON file...`);
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  
  // Fetch all active paths from database
  const exportResult = await db.execute({
    sql: 'SELECT * FROM learning_paths WHERE status = ? ORDER BY popularity DESC, created_at DESC',
    args: ['active']
  });
  
  // Map to frontend format
  const exportPaths = exportResult.rows.map(row => ({
    id: row.id,
    title: row.title,
    description: row.description,
    pathType: row.path_type,
    targetCompany: row.target_company,
    targetJobTitle: row.target_job_title,
    difficulty: row.difficulty,
    estimatedHours: row.estimated_hours,
    questionIds: row.question_ids,
    channels: row.channels,
    tags: row.tags,
    prerequisites: row.prerequisites,
    learningObjectives: row.learning_objectives,
    milestones: row.milestones,
    popularity: row.popularity || 0,
    completionRate: row.completion_rate || 0,
    averageRating: row.average_rating || 0,
    metadata: row.metadata,
    status: row.status,
    createdAt: row.created_at,
    lastUpdated: row.last_updated,
    lastGenerated: row.last_generated
  }));
  
  const outputPath = path.join(OUTPUT_DIR, 'learning-paths.json');
  fs.writeFileSync(outputPath, JSON.stringify(exportPaths, null, 2));
  console.log(`   ✅ Exported ${exportPaths.length} paths to ${outputPath}`);
}

main().catch(console.error);
