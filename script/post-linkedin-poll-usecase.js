#!/usr/bin/env node
/**
 * LinkedIn Poll with Real-World Use Case
 * 
 * Better flow:
 * 1. Select topic, subtopic, concept
 * 2. Search for real-world use case
 * 3. Generate poll with use case as the hook
 * 
 * Usage:
 *   node script/post-linkedin-poll-usecase.js --topic sre --subtopic "on-call" --concept "incident response" --channel sre
 *   node script/post-linkedin-poll-usecase.js --topic kubernetes --subtopic "networking" --concept "cgroups" --channel kubernetes
 */

import 'dotenv/config';
import fs from 'node:fs';
import ai from './ai/index.js';
import { webSearch } from './ai/utils/web-search.js';

const args = process.argv.slice(2).reduce((acc, arg, i, arr) => {
  if (arg.startsWith('--')) {
    const key = arg.slice(2);
    acc[key] = arr[i + 1]?.startsWith('--') ? true : arr[i + 1];
  }
  return acc;
}, {});

const TOPIC = args.topic || 'sre';
const SUBTOPIC = args.subtopic || 'on-call';
const CONCEPT = args.concept || 'incident response';
const CHANNEL = args.channel || 'sre';
const DRY_RUN = process.env.DRY_RUN === 'true' || args.dry;

function writeGitHubOutput(key, value) {
  if (process.env.GITHUB_OUTPUT) {
    try { fs.appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`); } catch {}
  }
}

const MAX_POLL_QUESTION_LENGTH = 140;
const MAX_POLL_OPTIONS = 4;

/**
 * Search for real-world use cases
 */
async function searchUseCase(topic, subtopic, concept) {
  console.log(`\n🔍 Searching for real-world use cases...`);
  console.log(`   Topic: ${topic}`);
  console.log(`   Subtopic: ${subtopic}`);
  console.log(`   Concept: ${concept}`);

  const queries = [
    `${concept} ${topic} production incident case study`,
    `${concept} ${subtopic} ${topic} outage story`,
    `${concept} DevOps SRE real world example`,
    `Netflix Uber Airbnb ${concept} ${topic}`
  ];

  for (const query of queries) {
    try {
      console.log(`\n   Query: "${query}"`);
      const results = await webSearch(query, { numResults: 5 });
      
      if (results && results.length > 0) {
        const result = results[0];
        console.log(`   ✅ Found: ${result.title}`);
        console.log(`   URL: ${result.url}`);
        
        return {
          company: extractCompany(result.title) || guessCompany(result.url),
          situation: result.snippet || `A ${concept} challenge in ${topic}`,
          challenge: `How to handle ${concept} in ${subtopic} scenario`,
          solution: `Applied ${concept} best practices`,
          outcome: result.snippet || 'Improved reliability',
          lesson: `Key insight about ${concept}`,
          sourceUrl: result.url,
          sourceTitle: result.title
        };
      }
    } catch (err) {
      console.log(`   ⚠️ Search failed: ${err.message}`);
    }
  }

  console.log(`   ⚠️ No use case found via search`);
  return null;
}

/**
 * Extract company name from title
 */
function extractCompany(title) {
  const companies = ['Netflix', 'Uber', 'Airbnb', 'Stripe', 'Amazon', 'Google', 'Meta', 'Apple', 'Microsoft', 'Spotify', 'Twitter', 'LinkedIn', 'Slack', 'Discord', 'Cloudflare', 'Datadog', 'PagerDuty', 'GitHub'];
  for (const company of companies) {
    if (title.toLowerCase().includes(company.toLowerCase())) {
      return company;
    }
  }
  return null;
}

/**
 * Guess company from URL
 */
function guessCompany(url) {
  const host = new URL(url).hostname;
  if (host.includes('netflix')) return 'Netflix';
  if (host.includes('uber')) return 'Uber';
  if (host.includes('airbnb')) return 'Airbnb';
  if (host.includes('stripe')) return 'Stripe';
  if (host.includes('aws') || host.includes('amazon')) return 'Amazon';
  if (host.includes('google')) return 'Google';
  return 'A tech company';
}

/**
 * Generate poll content with use case
 */
async function generatePollWithUseCase(topic, subtopic, concept, useCase, channel) {
  console.log(`\n🤖 Generating poll with use case...`);

  const result = await ai.run('linkedinPollUsecase', {
    topic,
    subtopic,
    concept,
    useCase,
    channel
  });

  if (!result || !result.pollQuestion) {
    throw new Error('AI returned invalid poll structure');
  }

  const pollQuestion = result.pollQuestion.substring(0, MAX_POLL_QUESTION_LENGTH);
  const options = result.options.slice(0, MAX_POLL_OPTIONS).map(o => String(o).substring(0, 30));

  console.log(`   Poll question: ${pollQuestion}`);
  options.forEach((o, i) => console.log(`   ${i + 1}. ${o}${i === result.correctIndex ? ' (correct)' : ''}`));

  return {
    text: result.introText,
    question: pollQuestion,
    options,
    correctIndex: result.correctIndex,
    useCase
  };
}

/**
 * Fetch with timeout
 */
async function fetchWithRetry(url, options, retries = 3, delay = 2000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (attempt === retries) throw error;
      await new Promise(r => setTimeout(r, delay * attempt));
    }
  }
}

/**
 * Post poll to LinkedIn
 */
async function postToLinkedIn(pollContent, durationHours = 48) {
  const accessToken = process.env.LINKEDIN_ACCESS_TOKEN?.trim();
  const personUrn = process.env.LINKEDIN_PERSON_URN?.trim();

  if (!accessToken || !personUrn) {
    throw new Error('Missing LINKEDIN_ACCESS_TOKEN or LINKEDIN_PERSON_URN');
  }

  const API_URL = 'https://api.linkedin.com/rest/posts';

  const payload = {
    author: personUrn,
    lifecycleState: 'PUBLISHED',
    visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
    content: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: { text: pollContent.text },
        shareMediaCategory: 'NONE'
      }
    },
    poll: {
      question: pollContent.question,
      options: pollContent.options,
      pollDuration: durationHours * 60 * 60 * 1000 // Convert to milliseconds
    }
  };

  console.log(`\n📤 Posting to LinkedIn...`);

  const response = await fetchWithRetry(API_URL, {
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
    const error = await response.text();
    throw new Error(`LinkedIn API error (${response.status}): ${error}`);
  }

  const postId = response.headers.get('x-restli-id') || 'unknown';
  console.log(`   ✅ Posted successfully!`);
  console.log(`   Post ID: ${postId}`);
  
  return { id: postId };
}

async function main() {
  console.log('═'.repeat(60));
  console.log('📊 LinkedIn Poll with Real-World Use Case');
  console.log('═'.repeat(60));
  console.log(`Topic: ${TOPIC}`);
  console.log(`Subtopic: ${SUBTOPIC}`);
  console.log(`Concept: ${CONCEPT}`);
  console.log(`Channel: ${CHANNEL}`);
  console.log(`Dry Run: ${DRY_RUN}`);
  console.log('─'.repeat(60));

  try {
    // Step 1: Search for real-world use case
    const useCase = await searchUseCase(TOPIC, SUBTOPIC, CONCEPT);

    // Step 2: Generate poll with use case
    const pollContent = await generatePollWithUseCase(TOPIC, SUBTOPIC, CONCEPT, useCase, CHANNEL);

    if (DRY_RUN) {
      console.log('\n🧪 DRY RUN - Would post:');
      console.log('─'.repeat(40));
      console.log(pollContent.text);
      console.log('─'.repeat(40));
      console.log(`Question: ${pollContent.question}`);
      pollContent.options.forEach((o, i) => console.log(`  ${i + 1}. ${o}`));
      writeGitHubOutput('dry_run', 'true');
      writeGitHubOutput('poll_question', pollContent.question);
      return;
    }

    // Step 3: Post to LinkedIn
    const result = await postToLinkedIn(pollContent);
    
    writeGitHubOutput('linkedin_post_id', result.id);
    writeGitHubOutput('use_case_company', useCase?.company || 'N/A');
    writeGitHubOutput('poll_question', pollContent.question);

    console.log('\n✅ Done!');
    console.log('═'.repeat(60));

  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    writeGitHubOutput('error', error.message);
    process.exit(1);
  }
}

main();
