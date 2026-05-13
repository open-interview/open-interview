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
import path from 'node:path';
import { getAllUnifiedQuestions, getQuestionsForChannel } from './utils.js';
import ai from './ai/index.js';

function writeGitHubOutput(key, value) {
  if (process.env.GITHUB_OUTPUT) {
    try {
      const str = String(value ?? '');
      if (str.includes('\n') || str.includes('\r')) {
        fs.appendFileSync(process.env.GITHUB_OUTPUT, `${key}<<__EOF__\n${str}\n__EOF__\n`);
      } else {
        fs.appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${str}\n`);
      }
    } catch {}
  }
}

// Constants
const LINKEDIN_API_VERSION = process.env.LINKEDIN_API_VERSION || '202506';
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
    // In dry-run mode without credentials, exit 0 (local testing)
    process.exit(dryRun ? 0 : 1);
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
    tags: Array.isArray(row.tags) ? row.tags : (row.tags ? JSON.parse(row.tags) : []),
    channel: row.channel,
    subChannel: row.subChannel || row.sub_channel,
  };
}

/**
 * Fetch a question from the database
 */
async function fetchQuestion() {
  console.log('🔍 Fetching question from database...');

  let questions = await getAllUnifiedQuestions();

  questions = questions.filter(q => (q.status === 'active' || !q.status) && !q.linkedin_poll_at);

  if (questionId) {
    questions = questions.filter(q => q.id === questionId);
  }

  if (channel) {
    questions = questions.filter(q => q.channel === channel);
  } else {
    questions = questions.filter(q => DEFAULT_CHANNELS.includes(q.channel));
  }

  if (difficulty) {
    questions = questions.filter(q => q.difficulty === difficulty);
  } else {
    questions = questions.filter(q => DEFAULT_DIFFICULTIES.includes(q.difficulty));
  }

  // Fallback: if no unposted questions, try those posted > 90 days ago
  if (questions.length === 0) {
    console.log('⚠️ No unposted questions found, falling back to questions posted > 90 days ago...');
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

    questions = await getAllUnifiedQuestions();
    questions = questions.filter(q => (q.status === 'active' || !q.status) && q.linkedin_poll_at && q.linkedin_poll_at < ninetyDaysAgo);

    if (questionId) {
      questions = questions.filter(q => q.id === questionId);
    }
    if (channel) {
      questions = questions.filter(q => q.channel === channel);
    } else {
      questions = questions.filter(q => DEFAULT_CHANNELS.includes(q.channel));
    }
    if (difficulty) {
      questions = questions.filter(q => q.difficulty === difficulty);
    } else {
      questions = questions.filter(q => DEFAULT_DIFFICULTIES.includes(q.difficulty));
    }
  }

  if (questions.length === 0) {
    throw new Error('No questions found matching criteria');
  }

  const randomIndex = Math.floor(Math.random() * questions.length);
  const question = parseQuestionRow(questions[randomIndex]);
  console.log(`   ✅ Found question: ${question.id}`);
  console.log(`   Channel: ${question.channel}`);
  console.log(`   Difficulty: ${question.difficulty}`);
  console.log(`   Question: ${question.question.substring(0, 100)}...`);

  return question;
}

async function fetchBlogPostUrl(question) {
  return { url: null, isNew: false };
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
  const rawOptions = result.options.slice(0, MAX_POLL_OPTIONS);
  const options = [];
  let truncated = 0;

  for (const opt of rawOptions) {
    const text = String(opt);
    if (text.length > 30) {
      options.push(text.substring(0, 27) + '...');
      truncated++;
    } else {
      options.push(text);
    }
  }

  if (truncated > 0) {
    console.log(`   ⚠️ Truncated ${truncated} option(s) to fit 30-char limit`);
  }

  // Validation before API call
  const invalidOptions = options.filter(o => o.length > 30);
  if (invalidOptions.length > 0) {
    throw new Error(`Poll options exceed 30 chars: ${invalidOptions.map(o => `"${o}" (${o.length} chars)`).join(', ')}`);
  }

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
 * LinkedIn supports: ONE_DAY (24h), THREE_DAYS (72h), SEVEN_DAYS (168h), FOURTEEN_DAYS (336h)
 */
const POLL_DURATION_MAP = {
  ONE_DAY: 24,
  THREE_DAYS: 72,
  SEVEN_DAYS: 168,
  FOURTEEN_DAYS: 336,
};

const VALID_DURATIONS = Object.keys(POLL_DURATION_MAP);

function pollDurationEnum(hours) {
  if (hours <= 24) return 'ONE_DAY';
  if (hours <= 72) return 'THREE_DAYS';
  if (hours <= 168) return 'SEVEN_DAYS';
  return 'FOURTEEN_DAYS';
}

function validatePollDurationEnum(durationEnum) {
  if (!VALID_DURATIONS.includes(durationEnum)) {
    console.warn(`   ⚠️ Invalid poll duration: ${durationEnum}, defaulting to ONE_WEEK`);
    return 'SEVEN_DAYS';
  }
  return durationEnum;
}

async function publishPollToLinkedIn(content) {
  console.log('\n📤 Publishing poll to LinkedIn...');

  // Validate all option lengths before API call
  const invalidOptions = content.options.filter(o => o.length > 30);
  if (invalidOptions.length > 0) {
    throw new Error(`Poll options exceed LinkedIn 30-char limit: ${invalidOptions.map(o => `"${o}" (${o.length} chars)`).join(', ')}`);
  }

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
          duration: validatePollDurationEnum(pollDurationEnum(pollDuration))
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
      'LinkedIn-Version': LINKEDIN_API_VERSION,
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

async function main() {
  console.log('═'.repeat(60));
  console.log('📊 LinkedIn Poll Publisher');
  console.log('═'.repeat(60));
  console.log(`LinkedIn API Version: ${LINKEDIN_API_VERSION}`);
  console.log(`Question ID: ${questionId || 'Random'}`);
  const channelLabel = channel || 'Default (' + DEFAULT_CHANNELS.length + ' core channels)';
  const difficultyLabel = difficulty || 'Default (' + DEFAULT_DIFFICULTIES.join('/') + ')';
  console.log(`Channel: ${channelLabel}`);
  console.log(`Difficulty: ${difficultyLabel}`);
  console.log(`Poll Duration: ${pollDuration}h -> ${pollDurationEnum(pollDuration)} (${validatePollDurationEnum(pollDurationEnum(pollDuration))})`);
  console.log(`Dry Run: ${dryRun}`);
  console.log('─'.repeat(60));
  
  // Validate environment
  validateEnvironment();
  
  console.log('🤖 AI Provider: OpenCode (no API key required)');
  
  // Fetch question
  const question = await fetchQuestion();

  // Look up blog post for this question
  const { url: blogUrl, isNew: blogIsNew } = await fetchBlogPostUrl(question);
  if (blogUrl) {
    console.log(`   Blog post: ${blogUrl}`);
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
  const deepDiveUrl = blogUrl || `https://open-interview.github.io/channels/${question.channel}/`;
  let links = '\n\n🎯 Practice more: ' + PRACTICE_URL;
  links += '\n📖 Deep dive: ' + deepDiveUrl;
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
    
    // Mark question as posted on LinkedIn
    const channelQuestions = await getQuestionsForChannel(question.channel);
    const qIdx = channelQuestions.findIndex(q => q.id === question.id);
    if (qIdx >= 0) {
      channelQuestions[qIdx].linkedin_poll_at = new Date().toISOString();
      fs.writeFileSync(
        path.join(process.cwd(), 'data', 'questions', `${question.channel}.json`),
        JSON.stringify(channelQuestions, null, 2)
      );
    }

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
