#!/usr/bin/env node
/**
 * LinkedIn Poll with Real-World Use Case
 * Uses Poll Generator Agent for high-quality poll generation
 * 
 * Better flow:
 * 1. Select topic, subtopic, concept
 * 2. Agent decomposes and searches for real-world use case
 * 3. Agent generates opinion-based poll with story hook
 * 4. Post to LinkedIn (or dry run)
 * 
 * Usage:
 *   DRY_RUN=true node script/post-linkedin-poll-usecase.js --topic sre --subtopic "on-call" --concept "incident response"
 *   node script/post-linkedin-poll-usecase.js --topic kubernetes --subtopic "networking" --concept "pod communication"
 */

import 'dotenv/config';
import fs from 'node:fs';
import { generatePollAgent } from './agents/poll-generator-agent.js';

const args = process.argv.slice(2).reduce((acc, arg, i, arr) => {
  if (arg.startsWith('--')) {
    const key = arg.slice(2);
    acc[key] = arr[i + 1]?.startsWith('--') ? true : arr[i + 1];
  }
  return acc;
}, {});

const TOPIC = args.topic || process.env.TOPIC || 'devops';
const SUBTOPIC = args.subtopic || process.env.SUBTOPIC || 'deployment';
const CONCEPT = args.concept || process.env.CONCEPT || 'canary deployments';
const CHANNEL = args.channel || process.env.CHANNEL || TOPIC;
const DRY_RUN = process.env.DRY_RUN === 'true' || args.dry === true;

function writeGitHubOutput(key, value) {
  if (process.env.GITHUB_OUTPUT) {
    try { fs.appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`); } catch {}
  }
}

/**
 * Fetch with timeout and retry
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
async function postToLinkedIn(pollContent, durationEnum = 'TWO_WEEKS') {
  const accessToken = process.env.LINKEDIN_ACCESS_TOKEN?.trim();
  const personUrn = process.env.LINKEDIN_PERSON_URN?.trim();

  if (!accessToken || !personUrn) {
    throw new Error('Missing LINKEDIN_ACCESS_TOKEN or LINKEDIN_PERSON_URN');
  }

  const API_URL = 'https://api.linkedin.com/rest/posts';

  const payload = {
    author: personUrn,
    commentary: pollContent.text,
    visibility: 'PUBLIC',
    distribution: {
      feedDistribution: 'MAIN_FEED',
      targetEntities: [],
      thirdPartyDistributionChannels: []
    },
    content: {
      poll: {
        question: pollContent.question,
        options: pollContent.options.map(text => ({ text })),
        settings: {
          duration: durationEnum
        }
      }
    },
    lifecycleState: 'PUBLISHED',
    isReshareDisabledByAuthor: false
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
  console.log('📊 LinkedIn Poll Generator (Agent-Based)');
  console.log('═'.repeat(60));
  console.log(`Topic: ${TOPIC}`);
  console.log(`Subtopic: ${SUBTOPIC}`);
  console.log(`Concept: ${CONCEPT}`);
  console.log(`Channel: ${CHANNEL}`);
  console.log(`Dry Run: ${DRY_RUN}`);
  console.log('─'.repeat(60));

  try {
    // Invoke the specialized poll generator agent
    const result = await generatePollAgent({
      topic: TOPIC,
      subtopic: SUBTOPIC,
      concept: CONCEPT,
      channel: CHANNEL,
      verbose: true
    });

    if (!result.success) {
      throw new Error(result.error || 'Agent failed');
    }

    const poll = result.poll;

    // Display final poll
    console.log('\n📋 GENERATED POLL:');
    console.log('─'.repeat(60));
    console.log(poll.text);
    console.log('─'.repeat(60));
    console.log(`Question: ${poll.question}`);
    console.log(`Options:`);
    poll.options.forEach((o, i) => console.log(`  ${i + 1}. ${o}`));
    console.log('─'.repeat(60));
    console.log(`Metadata:`);
    console.log(`  Real-World Case: ${poll.metadata.hasRealWorldCase ? 'Yes' : 'No'}`);
    if (poll.metadata.useCase) {
      console.log(`  Company: ${poll.metadata.useCase.company}`);
    }
    console.log(`  Template: ${poll.metadata.templateUsed}`);
    console.log(`  Estimated Engagement: ${poll.metadata.estimatedEngagement}`);
    console.log('─'.repeat(60));

    if (DRY_RUN) {
      console.log('\n🧪 DRY RUN - Would post above poll');
      writeGitHubOutput('dry_run', 'true');
      writeGitHubOutput('poll_question', poll.question);
      writeGitHubOutput('has_use_case', poll.metadata.hasRealWorldCase ? 'true' : 'false');
      return;
    }

    // Post to LinkedIn
    const linkedinResult = await postToLinkedIn({
      text: poll.text,
      question: poll.question,
      options: poll.options
    }, 'TWO_WEEKS');

    writeGitHubOutput('linkedin_post_id', linkedinResult.id);
    writeGitHubOutput('poll_question', poll.question);
    writeGitHubOutput('has_use_case', poll.metadata.hasRealWorldCase ? 'true' : 'false');
    if (poll.metadata.useCase) {
      writeGitHubOutput('use_case_company', poll.metadata.useCase.company);
    }

    console.log('\n✅ Done!');
    console.log('═'.repeat(60));

  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    writeGitHubOutput('error', error.message);
    process.exit(1);
  }
}

main();
