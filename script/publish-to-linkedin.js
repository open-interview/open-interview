#!/usr/bin/env node
/**
 * Publish to LinkedIn
 * Posts blog article to LinkedIn using the LinkedIn API
 * 
 * Required secrets:
 * - LINKEDIN_ACCESS_TOKEN: OAuth 2.0 access token with w_member_social scope
 * - LINKEDIN_PERSON_URN: Your LinkedIn person URN (urn:li:person:XXXXXXXX)
 */

import 'dotenv/config';

const LINKEDIN_API_URL = 'https://api.linkedin.com/v2/ugcPosts';

const accessToken = process.env.LINKEDIN_ACCESS_TOKEN;
const personUrn = process.env.LINKEDIN_PERSON_URN;
const postTitle = process.env.POST_TITLE;
const postUrl = process.env.POST_URL;
const postExcerpt = process.env.POST_EXCERPT;
const postTags = process.env.POST_TAGS;
const postChannel = process.env.POST_CHANNEL;

if (!accessToken || !personUrn) {
  console.error('❌ Missing LinkedIn credentials');
  console.error('   Set LINKEDIN_ACCESS_TOKEN and LINKEDIN_PERSON_URN secrets');
  process.exit(1);
}

if (!postTitle || !postUrl) {
  console.error('❌ Missing post details');
  process.exit(1);
}

function buildPostContent() {
  const channelEmoji = getChannelEmoji(postChannel);
  
  // Build engaging LinkedIn post
  const lines = [
    `${channelEmoji} ${postTitle}`,
    '',
    postExcerpt || 'Check out this in-depth technical article!',
    '',
    '🔗 Read the full article:',
    postUrl,
    '',
    '🎯 Practice more interview questions:',
    'https://open-interview.github.io/',
    '',
    postTags || '#tech #engineering #interview'
  ];
  
  return lines.join('\n');
}

function getChannelEmoji(channel) {
  const emojiMap = {
    'system-design': '🏗️',
    'devops': '⚙️',
    'frontend': '🎨',
    'backend': '🔧',
    'database': '🗄️',
    'security': '🔐',
    'ml-ai': '🤖',
    'generative-ai': '🤖',
    'algorithms': '📊',
    'testing': '🧪',
    'sre': '📈',
    'kubernetes': '☸️',
    'aws': '☁️',
    'terraform': '🏗️',
    'behavioral': '💬',
    'data-engineering': '📊'
  };
  
  return emojiMap[channel] || '📝';
}

async function publishToLinkedIn() {
  console.log('📢 Publishing to LinkedIn...\n');
  
  const content = buildPostContent();
  console.log('Post content:');
  console.log('─'.repeat(50));
  console.log(content);
  console.log('─'.repeat(50));
  console.log('');
  
  const payload = {
    author: personUrn,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: {
          text: content
        },
        shareMediaCategory: 'ARTICLE',
        media: [
          {
            status: 'READY',
            originalUrl: postUrl,
            title: {
              text: postTitle
            },
            description: {
              text: postExcerpt || 'Technical interview preparation article'
            }
          }
        ]
      }
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
    }
  };
  
  try {
    const response = await fetch(LINKEDIN_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`LinkedIn API error: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log('✅ Successfully published to LinkedIn!');
    console.log(`   Post ID: ${result.id}`);
    
    return result;
  } catch (error) {
    console.error('❌ Failed to publish to LinkedIn:', error.message);
    
    // Don't fail the workflow, just log the error
    // This allows the workflow to continue and mark the post
    console.log('⚠️ Continuing despite error...');
  }
}

publishToLinkedIn().catch(console.error);
