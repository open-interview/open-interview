#!/usr/bin/env node
/**
 * Post Question as LinkedIn Poll
 * Fetches a random question from the database and posts it as a LinkedIn poll
 * 
 * Required secrets:
 * - LINKEDIN_ACCESS_TOKEN: OAuth 2.0 access token with w_member_social scope
 * - LINKEDIN_PERSON_URN: Your LinkedIn person URN (urn:li:person:XXXXXXXX)
 * 
 * Environment variables:
 * - QUESTION_ID: Specific question ID to post (optional, random if not provided)
 * - CHANNEL: Filter by channel (optional)
 * - DIFFICULTY: Filter by difficulty (optional)
 * - DRY_RUN: Set to 'true' to generate content without publishing
 * - POLL_DURATION: Poll duration in hours (default: 24, max: 168)
 */

import 'dotenv/config';
import fs from 'node:fs';
import { dbClient } from './utils.js';
import ai from './ai/index.js';
import { generateBlogPost } from './ai/graphs/blog-graph.js';

function writeGitHubOutput(key, value) {
  if (process.env.GITHUB_OUTPUT) {
    try { fs.appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`); } catch {}
  }
}

// Constants
const LINKEDIN_API_URL = 'https://api.linkedin.com/rest/posts';
const API_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds
const MAX_POLL_QUESTION_LENGTH = 140;
const MAX_POLL_OPTIONS = 4;
const MIN_POLL_DURATION_HOURS = 1;
const MAX_POLL_DURATION_HOURS = 336; // 14 days (LinkedIn max)

// Default channels to rotate through (absolute basics for core topics)
const DEFAULT_CHANNELS = [
  'sre',
  'devops',
  'aws',
  'aws-saa',
  'aws-devops-pro',
  'aws-sysops',
  'terraform',
  'terraform-associate',
  'kubernetes',
  'docker-dca',
  'linux',
  'gcp-devops-engineer',
  'llm-ops',
  'generative-ai',
  'aws-ml-specialty',
  'aws-ai-practitioner',
  'networking',
  'security',
  'system-design',
];

// Default difficulty when none specified
const DEFAULT_DIFFICULTIES = ['beginner', 'intermediate'];

// Environment variables
const accessToken = process.env.LINKEDIN_ACCESS_TOKEN?.trim();
const personUrn = process.env.LINKEDIN_PERSON_URN?.trim();
const questionId = process.env.QUESTION_ID?.trim();
const channel = process.env.CHANNEL?.trim();
const difficulty = process.env.DIFFICULTY?.trim();
const dryRun = process.env.DRY_RUN === 'true';
const pollDuration = Math.min(Math.max(parseInt(process.env.POLL_DURATION || '360'), MIN_POLL_DURATION_HOURS), MAX_POLL_DURATION_HOURS);

/**
 * Validate required environment variables
 */
function validateEnvironment() {
  const errors = [];
  
  if (!accessToken) {
    errors.push('LINKEDIN_ACCESS_TOKEN is required');
  } else if (accessToken.length < 20) {
    errors.push('LINKEDIN_ACCESS_TOKEN appears invalid (too short)');
  }
  
  if (!personUrn) {
    errors.push('LINKEDIN_PERSON_URN is required');
  } else if (!personUrn.startsWith('urn:li:person:')) {
    errors.push('LINKEDIN_PERSON_URN must start with "urn:li:person:"');
  }
  
  if (errors.length > 0) {
    console.error('❌ Environment validation failed:');
    errors.forEach(e => console.error(`   - ${e}`));
    process.exit(1);
  }
  
  console.log('✅ Environment validation passed');
}

/**
 * Parse question row from database
 */
function parseQuestionRow(row) {
  return {
    id: row.id,
    question: row.question,
    answer: row.answer,
    explanation: row.explanation,
    difficulty: row.difficulty,
    tags: row.tags ? JSON.parse(row.tags) : [],
    channel: row.channel,
    subChannel: row.sub_channel,
  };
}

/**
 * Fetch a question from the database
 */
async function fetchQuestion() {
  console.log('🔍 Fetching question from database...');

  let sql = 'SELECT * FROM questions WHERE status = "active"';
  const args = [];

  if (questionId) {
    sql += ' AND id = ?';
    args.push(questionId);
  }

  if (channel) {
    // Explicit channel override
    sql += ' AND channel = ?';
    args.push(channel);
  } else {
    // Default: rotate across core topic channels
    const placeholders = DEFAULT_CHANNELS.map(() => '?').join(', ');
    sql += ` AND channel IN (${placeholders})`;
    args.push(...DEFAULT_CHANNELS);
  }

  if (difficulty) {
    // Explicit difficulty override
    sql += ' AND difficulty = ?';
    args.push(difficulty);
  } else {
    // Default: beginner or intermediate only
    const dPlaceholders = DEFAULT_DIFFICULTIES.map(() => '?').join(', ');
    sql += ` AND difficulty IN (${dPlaceholders})`;
    args.push(...DEFAULT_DIFFICULTIES);
  }
  
  // Get random question
  sql += ' ORDER BY RANDOM() LIMIT 1';
  
  const result = await dbClient.execute({ sql, args });
  
  if (result.rows.length === 0) {
    throw new Error('No questions found matching criteria');
  }
  
  const question = parseQuestionRow(result.rows[0]);
  console.log(`   ✅ Found question: ${question.id}`);
  console.log(`   Channel: ${question.channel}`);
  console.log(`   Difficulty: ${question.difficulty}`);
  console.log(`   Question: ${question.question.substring(0, 100)}...`);

  return question;
}

function generateSlug(title) {
  return title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').substring(0, 80);
}

/**
 * Look up a blog post for this question, generating one if missing
 */
async function fetchBlogPostUrl(question) {
  const qId = question.id;

  // Check if blog post already exists
  try {
    const result = await dbClient.execute({
      sql: 'SELECT slug FROM blog_posts WHERE question_id = ? LIMIT 1',
      args: [qId]
    });
    if (result.rows.length > 0 && result.rows[0].slug) {
      console.log(`   ✅ Blog post found: ${qId}`);
      return { url: `https://openstackdaily.github.io/posts/${qId}/${result.rows[0].slug}/`, isNew: false };
    }
  } catch {
    // blog_posts table query failed — continue to generate
  }

  // No blog post — generate one now
  console.log('   📝 No blog post found — generating one...');
  try {
    const blogResult = await generateBlogPost(question);

    if (!blogResult.success || !blogResult.blogContent) {
      console.log('   ⚠️ Blog generation skipped or failed:', blogResult.skipReason || blogResult.error);
      return { url: null, isNew: false };
    }

    const { blogContent } = blogResult;
    const slug = generateSlug(blogContent.title);
    const now = new Date().toISOString();

    await dbClient.execute({
      sql: `INSERT OR IGNORE INTO blog_posts
            (question_id, title, slug, introduction, sections, conclusion,
             meta_description, channel, difficulty, tags, diagram, quick_reference,
             glossary, real_world_example, fun_fact, sources, social_snippet,
             diagram_type, diagram_label, images, svg_content, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        qId,
        blogContent.title,
        slug,
        blogContent.introduction,
        JSON.stringify(blogContent.sections || []),
        blogContent.conclusion,
        blogContent.metaDescription || null,
        question.channel,
        question.difficulty,
        JSON.stringify(question.tags || []),
        question.diagram || null,
        JSON.stringify(blogContent.quickReference || []),
        JSON.stringify(blogContent.glossary || []),
        JSON.stringify(blogContent.realWorldExample || null),
        blogContent.funFact || null,
        JSON.stringify(blogContent.sources || []),
        JSON.stringify(blogContent.socialSnippet || null),
        blogContent.diagramType || null,
        blogContent.diagramLabel || null,
        JSON.stringify(blogContent.images || []),
        JSON.stringify({}),
        now
      ]
    });

    console.log(`   ✅ Blog post saved: "${blogContent.title}"`);
    const url = `https://openstackdaily.github.io/posts/${qId}/${slug}/`;
    return { url, isNew: true };
  } catch (err) {
    console.warn('   ⚠️ Blog generation error:', err.message);
    return { url: null, isNew: false };
  }
}

/**
 * Use AI to generate MCQ poll content from any question
 */
async function generatePollContent(question) {
  console.log('🤖 Generating MCQ options with AI...');

  const result = await ai.run('linkedinPollMcq', {
    question: question.question,
    answer: question.answer,
    explanation: question.explanation,
    tags: question.tags,
    channel: question.channel,
  });

  if (!result || !result.pollQuestion || !Array.isArray(result.options) || result.options.length < 4) {
    throw new Error('AI returned invalid MCQ structure');
  }

  // Enforce length limits
  const pollQuestion = result.pollQuestion.substring(0, MAX_POLL_QUESTION_LENGTH);
  const options = result.options.slice(0, MAX_POLL_OPTIONS).map(o => String(o).substring(0, 30));

  console.log(`   Poll question: ${pollQuestion}`);
  options.forEach((o, i) => console.log(`   ${i + 1}. ${o}${i === result.correctIndex ? ' (correct)' : ''}`));

  return {
    text: result.introText || `🎯 Quick Tech Quiz!\n\n${pollQuestion}\n\n#TechInterview #CodingInterview`,
    question: pollQuestion,
    options,
  };
}

/**
 * Fetch with timeout and retry
 */
async function fetchWithRetry(url, options, retries = MAX_RETRIES) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      
      const isLastAttempt = attempt === retries;
      const isRetryable = error.name === 'AbortError' || 
                          error.code === 'ECONNRESET' || 
                          error.code === 'ETIMEDOUT';
      
      if (isLastAttempt || !isRetryable) {
        throw error;
      }
      
      console.log(`   ⚠️ Attempt ${attempt} failed, retrying in ${RETRY_DELAY}ms...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    }
  }
}

/**
 * Parse LinkedIn API error response
 */
async function parseLinkedInError(response) {
  try {
    const text = await response.text();
    try {
      const json = JSON.parse(text);
      return json.message || json.error || text;
    } catch {
      return text;
    }
  } catch {
    return `HTTP ${response.status}`;
  }
}

/**
 * Publish poll to LinkedIn
 */
/**
 * Map poll duration hours to LinkedIn Posts API duration enum
 */
function pollDurationEnum(hours) {
  if (hours <= 24) return 'ONE_DAY';
  if (hours <= 72) return 'THREE_DAYS';
  if (hours <= 168) return 'ONE_WEEK';
  return 'TWO_WEEKS'; // 336h / 14 days — LinkedIn maximum
}

async function publishPollToLinkedIn(content) {
  console.log('\n📤 Publishing poll to LinkedIn...');

  // LinkedIn Posts API (/rest/posts) supports POLL; UGC API does not
  const payload = {
    author: personUrn,
    commentary: content.text,
    visibility: 'PUBLIC',
    distribution: {
      feedDistribution: 'MAIN_FEED',
      targetEntities: [],
      thirdPartyDistributionChannels: []
    },
    content: {
      poll: {
        question: content.question,
        options: content.options.map(option => ({ text: option })),
        settings: {
          duration: pollDurationEnum(pollDuration)
        }
      }
    },
    lifecycleState: 'PUBLISHED',
    isReshareDisabledByAuthor: false
  };

  console.log('📋 Poll payload:');
  console.log(JSON.stringify(payload, null, 2));

  const response = await fetchWithRetry(LINKEDIN_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'LinkedIn-Version': '202506',
      'X-Restli-Protocol-Version': '2.0.0'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorMsg = await parseLinkedInError(response);
    throw new Error(`LinkedIn API error (${response.status}): ${errorMsg}`);
  }

  // Posts API returns 201 with the post URN in the Location header (no body)
  const postUrn = response.headers.get('x-restli-id') || response.headers.get('location') || 'unknown';
  console.log(`   Post URN: ${postUrn}`);
  return { id: postUrn };
}

/**
 * Mark question as shared
 */
async function markQuestionShared(questionId, postId) {
  // You could add a 'shared_on_linkedin' column to track this
  console.log(`   📝 Question ${questionId} shared as poll ${postId}`);
}

async function main() {
  console.log('═'.repeat(60));
  console.log('📊 LinkedIn Poll Publisher');
  console.log('═'.repeat(60));
  console.log(`Question ID: ${questionId || 'Random'}`);
  const channelLabel = channel || 'Default (' + DEFAULT_CHANNELS.length + ' core channels)';
  const difficultyLabel = difficulty || 'Default (' + DEFAULT_DIFFICULTIES.join('/') + ')';
  console.log(`Channel: ${channelLabel}`);
  console.log(`Difficulty: ${difficultyLabel}`);
  console.log(`Poll Duration: ${pollDuration} hours`);
  console.log(`Dry Run: ${dryRun}`);
  console.log('─'.repeat(60));
  
  // Validate environment
  validateEnvironment();
  
  // Fetch question
  const question = await fetchQuestion();

  // Look up or generate blog post for this question
  const { url: blogUrl, isNew: blogIsNew } = await fetchBlogPostUrl(question);
  if (blogUrl) {
    console.log(`   Blog post${blogIsNew ? ' (newly generated)' : ''}: ${blogUrl}`);
  }

  // Generate MCQ poll content via AI
  let pollContent;
  try {
    pollContent = await generatePollContent(question);
  } catch (error) {
    console.error('❌ Failed to generate poll content:', error.message);
    process.exit(1);
  }

  // Append links to commentary
  const PRACTICE_URL = 'https://open-interview.github.io/';
  let links = '\n\n🎯 Practice more: ' + PRACTICE_URL;
  if (blogUrl) {
    links += '\n📖 Deep dive: ' + blogUrl;
  }
  pollContent.text = pollContent.text + links;

  console.log('\n📋 Poll content:');
  console.log('─'.repeat(50));
  console.log(pollContent.text);
  console.log('─'.repeat(50));
  console.log(`Question: ${pollContent.question}`);
  console.log('Options:');
  pollContent.options.forEach((opt, i) => console.log(`  ${i + 1}. ${opt}`));
  console.log('─'.repeat(50));
  
  // Dry run - don't actually publish
  if (dryRun) {
    console.log('\n🏃 DRY RUN - Skipping actual publish');
    console.log('\n✅ Dry run complete');
    return;
  }
  
  // Publish to LinkedIn
  let linkedInResult;
  try {
    linkedInResult = await publishPollToLinkedIn(pollContent);
    console.log('\n✅ Successfully published poll to LinkedIn!');
    console.log(`   Post ID: ${linkedInResult.id}`);
    
    // Mark question as shared
    await markQuestionShared(question.id, linkedInResult.id);

    writeGitHubOutput('posted', 'true');
    writeGitHubOutput('linkedin_post_id', linkedInResult.id);
    writeGitHubOutput('blog_generated', String(blogIsNew));
  } catch (error) {
    console.error('❌ Publish failed:', error.message);
    writeGitHubOutput('posted', 'false');
    process.exit(1);
  }

  console.log('\n' + '═'.repeat(60));
  console.log('🎉 Done!');
  console.log('═'.repeat(60));
}

main().catch(error => {
  console.error('\n❌ Unexpected error:', error.message);
  if (error.stack) {
    console.error(error.stack);
  }
  process.exit(1);
});
