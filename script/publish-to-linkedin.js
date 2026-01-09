#!/usr/bin/env node
/**
 * Publish to LinkedIn
 * Generates engaging story-style posts using LangGraph pipeline
 * Publishes with custom generated images
 * 
 * Required secrets:
 * - LINKEDIN_ACCESS_TOKEN: OAuth 2.0 access token with w_member_social scope
 * - LINKEDIN_PERSON_URN: Your LinkedIn person URN (urn:li:person:XXXXXXXX)
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { generateLinkedInPost } from './ai/graphs/linkedin-graph.js';

const LINKEDIN_API_URL = 'https://api.linkedin.com/v2/ugcPosts';
const LINKEDIN_UPLOAD_URL = 'https://api.linkedin.com/v2/assets?action=registerUpload';

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

/**
 * Register an image upload with LinkedIn
 * Returns the upload URL and asset URN
 */
async function registerImageUpload() {
  console.log('📝 Registering image upload with LinkedIn...');
  
  const payload = {
    registerUploadRequest: {
      recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
      owner: personUrn,
      serviceRelationships: [
        {
          relationshipType: 'OWNER',
          identifier: 'urn:li:userGeneratedContent'
        }
      ]
    }
  };
  
  const response = await fetch(LINKEDIN_UPLOAD_URL, {
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
    throw new Error(`Failed to register upload: ${response.status} - ${errorText}`);
  }
  
  const data = await response.json();
  const uploadUrl = data.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;
  const asset = data.value.asset;
  
  console.log(`   ✅ Got upload URL and asset: ${asset}`);
  return { uploadUrl, asset };
}

/**
 * Upload image binary to LinkedIn
 */
async function uploadImage(uploadUrl, imagePath) {
  console.log(`📤 Uploading image: ${imagePath}`);
  
  const imageBuffer = fs.readFileSync(imagePath);
  const contentType = imagePath.endsWith('.png') ? 'image/png' : 'image/jpeg';
  
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': contentType
    },
    body: imageBuffer
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to upload image: ${response.status} - ${errorText}`);
  }
  
  console.log('   ✅ Image uploaded successfully');
  return true;
}

/**
 * Publish content to LinkedIn with image
 */
async function publishToLinkedInWithImage(content, imageAsset) {
  console.log('\n📤 Publishing to LinkedIn with image...');
  
  const payload = {
    author: personUrn,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: {
          text: content
        },
        shareMediaCategory: 'IMAGE',
        media: [
          {
            status: 'READY',
            media: imageAsset,
            title: {
              text: postTitle
            },
            description: {
              text: postExcerpt?.substring(0, 200) || 'Technical interview preparation'
            }
          }
        ]
      }
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
    }
  };
  
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
  
  return await response.json();
}

/**
 * Publish content to LinkedIn without image (fallback)
 */
async function publishToLinkedInArticle(content) {
  console.log('\n📤 Publishing to LinkedIn as article link...');
  
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
              text: postExcerpt?.substring(0, 200) || 'Technical interview preparation'
            }
          }
        ]
      }
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
    }
  };
  
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
  
  return await response.json();
}

async function main() {
  console.log('📢 Publishing to LinkedIn with LangGraph Pipeline...\n');
  
  // Run LangGraph pipeline to generate content and image
  const result = await generateLinkedInPost({
    title: postTitle,
    url: postUrl,
    excerpt: postExcerpt,
    channel: postChannel,
    tags: postTags
  });
  
  if (!result.success) {
    console.error('❌ Failed to generate LinkedIn post:', result.error);
    process.exit(1);
  }
  
  const content = result.content;
  const imagePath = result.image?.path;
  const imageValid = result.image?.valid;
  
  console.log('\nFinal post content:');
  console.log('─'.repeat(50));
  console.log(content);
  console.log('─'.repeat(50));
  console.log(`Character count: ${content.length}/3000`);
  
  if (imagePath) {
    console.log(`Image: ${imagePath} (valid: ${imageValid})`);
  }
  console.log('');
  
  let linkedInResult;
  
  // Try to publish with image if available
  if (imagePath && imageValid && fs.existsSync(imagePath)) {
    try {
      // Step 1: Register upload
      const { uploadUrl, asset } = await registerImageUpload();
      
      // Step 2: Upload image
      await uploadImage(uploadUrl, imagePath);
      
      // Step 3: Publish with image
      linkedInResult = await publishToLinkedInWithImage(content, asset);
      console.log('✅ Successfully published to LinkedIn with image!');
    } catch (imageError) {
      console.error('⚠️ Image upload failed:', imageError.message);
      console.log('   Falling back to article link...');
      linkedInResult = await publishToLinkedInArticle(content);
      console.log('✅ Successfully published to LinkedIn (without image)');
    }
  } else {
    // Fallback to article link
    console.log('ℹ️ No valid image available, publishing as article link');
    linkedInResult = await publishToLinkedInArticle(content);
    console.log('✅ Successfully published to LinkedIn!');
  }
  
  console.log(`   Post ID: ${linkedInResult.id}`);
  
  // Output for GitHub Actions
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `posted=true\n`);
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `linkedin_post_id=${linkedInResult.id}\n`);
  }
}

main().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
