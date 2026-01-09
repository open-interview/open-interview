#!/usr/bin/env node
/**
 * Publish to LinkedIn
 * Generates engaging story-style posts using LangGraph pipeline
 * Publishes with custom generated images
 * 
 * Required secrets:
 * - LINKEDIN_ACCESS_TOKEN: OAuth 2.0 access token with w_member_social scope
 * - LINKEDIN_PERSON_URN: Your LinkedIn person URN (urn:li:person:XXXXXXXX)
 * 
 * Environment variables:
 * - POST_TITLE: Title of the blog post (required)
 * - POST_URL: URL of the blog post (required)
 * - POST_EXCERPT: Short excerpt/description (optional)
 * - POST_TAGS: Hashtags for the post (optional)
 * - POST_CHANNEL: Content channel/category (optional)
 * - SKIP_IMAGE: Set to 'true' to skip image generation
 * - DRY_RUN: Set to 'true' to generate content without publishing
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { generateLinkedInPost } from './ai/graphs/linkedin-graph.js';

// Constants
const LINKEDIN_API_URL = 'https://api.linkedin.com/v2/ugcPosts';
const LINKEDIN_UPLOAD_URL = 'https://api.linkedin.com/v2/assets?action=registerUpload';
const MAX_CONTENT_LENGTH = 3000;
const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 256;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const SUPPORTED_IMAGE_TYPES = ['.png', '.jpg', '.jpeg', '.gif'];
const API_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

// Environment variables
const accessToken = process.env.LINKEDIN_ACCESS_TOKEN?.trim();
const personUrn = process.env.LINKEDIN_PERSON_URN?.trim();
const postTitle = process.env.POST_TITLE?.trim();
const postUrl = process.env.POST_URL?.trim();
const postExcerpt = process.env.POST_EXCERPT?.trim();
const postTags = process.env.POST_TAGS?.trim();
const postChannel = process.env.POST_CHANNEL?.trim();
const skipImage = process.env.SKIP_IMAGE === 'true';
const dryRun = process.env.DRY_RUN === 'true';

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
  
  if (!postTitle) {
    errors.push('POST_TITLE is required');
  } else if (postTitle.length > MAX_TITLE_LENGTH) {
    errors.push(`POST_TITLE exceeds ${MAX_TITLE_LENGTH} characters`);
  }
  
  if (!postUrl) {
    errors.push('POST_URL is required');
  } else {
    try {
      new URL(postUrl);
    } catch {
      errors.push('POST_URL is not a valid URL');
    }
  }
  
  if (errors.length > 0) {
    console.error('❌ Environment validation failed:');
    errors.forEach(e => console.error(`   - ${e}`));
    process.exit(1);
  }
  
  console.log('✅ Environment validation passed');
}

/**
 * Validate image file
 */
function validateImage(imagePath) {
  if (!imagePath) {
    return { valid: false, reason: 'No image path provided' };
  }
  
  if (!fs.existsSync(imagePath)) {
    return { valid: false, reason: `Image file not found: ${imagePath}` };
  }
  
  const ext = path.extname(imagePath).toLowerCase();
  if (!SUPPORTED_IMAGE_TYPES.includes(ext)) {
    return { valid: false, reason: `Unsupported image type: ${ext}. Supported: ${SUPPORTED_IMAGE_TYPES.join(', ')}` };
  }
  
  const stats = fs.statSync(imagePath);
  if (stats.size === 0) {
    return { valid: false, reason: 'Image file is empty' };
  }
  
  if (stats.size > MAX_IMAGE_SIZE) {
    return { valid: false, reason: `Image too large: ${(stats.size / 1024 / 1024).toFixed(2)}MB (max: 5MB)` };
  }
  
  // Basic file header validation
  const buffer = Buffer.alloc(8);
  const fd = fs.openSync(imagePath, 'r');
  fs.readSync(fd, buffer, 0, 8, 0);
  fs.closeSync(fd);
  
  const isPNG = buffer.toString('hex', 0, 8) === '89504e470d0a1a0a';
  const isJPEG = buffer.toString('hex', 0, 2) === 'ffd8';
  const isGIF = buffer.toString('ascii', 0, 3) === 'GIF';
  
  if (!isPNG && !isJPEG && !isGIF) {
    return { valid: false, reason: 'File does not appear to be a valid image (invalid header)' };
  }
  
  return { 
    valid: true, 
    size: stats.size,
    type: isPNG ? 'image/png' : isJPEG ? 'image/jpeg' : 'image/gif'
  };
}

/**
 * Validate post content
 */
function validateContent(content) {
  if (!content || typeof content !== 'string') {
    return { valid: false, reason: 'Content is empty or invalid' };
  }
  
  const trimmed = content.trim();
  
  if (trimmed.length === 0) {
    return { valid: false, reason: 'Content is empty after trimming' };
  }
  
  if (trimmed.length > MAX_CONTENT_LENGTH) {
    return { valid: false, reason: `Content exceeds ${MAX_CONTENT_LENGTH} characters (${trimmed.length})` };
  }
  
  if (trimmed.length < 50) {
    return { valid: false, reason: 'Content too short (minimum 50 characters)' };
  }
  
  // Check for required elements
  const hasUrl = trimmed.includes('http://') || trimmed.includes('https://');
  if (!hasUrl) {
    return { valid: false, reason: 'Content must include at least one URL' };
  }
  
  return { valid: true, length: trimmed.length };
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
 * Register an image upload with LinkedIn
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
  
  const response = await fetchWithRetry(LINKEDIN_UPLOAD_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0'
    },
    body: JSON.stringify(payload)
  });
  
  if (!response.ok) {
    const errorMsg = await parseLinkedInError(response);
    throw new Error(`Failed to register upload (${response.status}): ${errorMsg}`);
  }
  
  const data = await response.json();
  
  // Validate response structure
  const uploadMechanism = data?.value?.uploadMechanism?.['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'];
  if (!uploadMechanism?.uploadUrl) {
    throw new Error('Invalid response: missing uploadUrl');
  }
  
  const asset = data?.value?.asset;
  if (!asset) {
    throw new Error('Invalid response: missing asset URN');
  }
  
  console.log(`   ✅ Got upload URL and asset: ${asset}`);
  return { uploadUrl: uploadMechanism.uploadUrl, asset };
}

/**
 * Upload image binary to LinkedIn
 */
async function uploadImage(uploadUrl, imagePath, contentType) {
  console.log(`📤 Uploading image: ${path.basename(imagePath)}`);
  
  const imageBuffer = fs.readFileSync(imagePath);
  console.log(`   Size: ${(imageBuffer.length / 1024).toFixed(1)}KB, Type: ${contentType}`);
  
  const response = await fetchWithRetry(uploadUrl, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': contentType
    },
    body: imageBuffer
  });
  
  // LinkedIn returns 201 Created on success
  if (!response.ok && response.status !== 201) {
    const errorMsg = await parseLinkedInError(response);
    throw new Error(`Failed to upload image (${response.status}): ${errorMsg}`);
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
          text: content.substring(0, MAX_CONTENT_LENGTH)
        },
        shareMediaCategory: 'IMAGE',
        media: [
          {
            status: 'READY',
            media: imageAsset,
            title: {
              text: postTitle.substring(0, MAX_TITLE_LENGTH)
            },
            description: {
              text: (postExcerpt || 'Technical interview preparation').substring(0, MAX_DESCRIPTION_LENGTH)
            }
          }
        ]
      }
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
    }
  };
  
  const response = await fetchWithRetry(LINKEDIN_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0'
    },
    body: JSON.stringify(payload)
  });
  
  if (!response.ok) {
    const errorMsg = await parseLinkedInError(response);
    throw new Error(`LinkedIn API error (${response.status}): ${errorMsg}`);
  }
  
  const result = await response.json();
  
  if (!result.id) {
    throw new Error('Invalid response: missing post ID');
  }
  
  return result;
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
          text: content.substring(0, MAX_CONTENT_LENGTH)
        },
        shareMediaCategory: 'ARTICLE',
        media: [
          {
            status: 'READY',
            originalUrl: postUrl,
            title: {
              text: postTitle.substring(0, MAX_TITLE_LENGTH)
            },
            description: {
              text: (postExcerpt || 'Technical interview preparation').substring(0, MAX_DESCRIPTION_LENGTH)
            }
          }
        ]
      }
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
    }
  };
  
  const response = await fetchWithRetry(LINKEDIN_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0'
    },
    body: JSON.stringify(payload)
  });
  
  if (!response.ok) {
    const errorMsg = await parseLinkedInError(response);
    throw new Error(`LinkedIn API error (${response.status}): ${errorMsg}`);
  }
  
  const result = await response.json();
  
  if (!result.id) {
    throw new Error('Invalid response: missing post ID');
  }
  
  return result;
}

/**
 * Write GitHub Actions output
 */
function writeGitHubOutput(key, value) {
  if (process.env.GITHUB_OUTPUT) {
    try {
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`);
    } catch (err) {
      console.warn(`   ⚠️ Failed to write GitHub output: ${err.message}`);
    }
  }
}

async function main() {
  console.log('═'.repeat(60));
  console.log('📢 LinkedIn Post Publisher');
  console.log('═'.repeat(60));
  console.log(`Title: ${postTitle?.substring(0, 50)}...`);
  console.log(`URL: ${postUrl}`);
  console.log(`Channel: ${postChannel || 'N/A'}`);
  console.log(`Dry Run: ${dryRun}`);
  console.log(`Skip Image: ${skipImage}`);
  console.log('─'.repeat(60));
  
  // Validate environment
  validateEnvironment();
  
  // Generate content using LangGraph pipeline
  console.log('\n🔄 Generating LinkedIn post content...');
  
  let result;
  try {
    result = await generateLinkedInPost({
      title: postTitle,
      url: postUrl,
      excerpt: postExcerpt,
      channel: postChannel,
      tags: postTags
    });
  } catch (genError) {
    console.error('❌ Content generation failed:', genError.message);
    writeGitHubOutput('posted', 'false');
    writeGitHubOutput('error', genError.message);
    process.exit(1);
  }
  
  if (!result.success) {
    console.error('❌ Failed to generate LinkedIn post:', result.error);
    writeGitHubOutput('posted', 'false');
    writeGitHubOutput('error', result.error);
    process.exit(1);
  }
  
  const content = result.content;
  const imagePath = skipImage ? null : result.image?.path;
  
  // Validate content
  const contentValidation = validateContent(content);
  if (!contentValidation.valid) {
    console.error('❌ Content validation failed:', contentValidation.reason);
    writeGitHubOutput('posted', 'false');
    writeGitHubOutput('error', contentValidation.reason);
    process.exit(1);
  }
  
  console.log('\n📋 Final post content:');
  console.log('─'.repeat(50));
  console.log(content);
  console.log('─'.repeat(50));
  console.log(`✅ Content valid: ${contentValidation.length}/${MAX_CONTENT_LENGTH} chars`);
  
  // Validate image if available
  let imageValidation = { valid: false };
  if (imagePath) {
    imageValidation = validateImage(imagePath);
    if (imageValidation.valid) {
      console.log(`✅ Image valid: ${path.basename(imagePath)} (${(imageValidation.size / 1024).toFixed(1)}KB)`);
    } else {
      console.log(`⚠️ Image invalid: ${imageValidation.reason}`);
    }
  } else {
    console.log('ℹ️ No image to upload');
  }
  
  // Dry run - don't actually publish
  if (dryRun) {
    console.log('\n🏃 DRY RUN - Skipping actual publish');
    writeGitHubOutput('posted', 'false');
    writeGitHubOutput('dry_run', 'true');
    console.log('\n✅ Dry run complete');
    return;
  }
  
  // Publish to LinkedIn
  let linkedInResult;
  let publishedWithImage = false;
  
  if (imageValidation.valid) {
    try {
      // Step 1: Register upload
      const { uploadUrl, asset } = await registerImageUpload();
      
      // Step 2: Upload image
      await uploadImage(uploadUrl, imagePath, imageValidation.type);
      
      // Step 3: Publish with image
      linkedInResult = await publishToLinkedInWithImage(content, asset);
      publishedWithImage = true;
      console.log('\n✅ Successfully published to LinkedIn with image!');
    } catch (imageError) {
      console.error('\n⚠️ Image upload failed:', imageError.message);
      console.log('   Falling back to article link...');
      
      try {
        linkedInResult = await publishToLinkedInArticle(content);
        console.log('\n✅ Successfully published to LinkedIn (without image)');
      } catch (fallbackError) {
        console.error('❌ Fallback publish also failed:', fallbackError.message);
        writeGitHubOutput('posted', 'false');
        writeGitHubOutput('error', fallbackError.message);
        process.exit(1);
      }
    }
  } else {
    // No valid image, publish as article
    try {
      linkedInResult = await publishToLinkedInArticle(content);
      console.log('\n✅ Successfully published to LinkedIn!');
    } catch (publishError) {
      console.error('❌ Publish failed:', publishError.message);
      writeGitHubOutput('posted', 'false');
      writeGitHubOutput('error', publishError.message);
      process.exit(1);
    }
  }
  
  // Success output
  console.log(`   Post ID: ${linkedInResult.id}`);
  console.log(`   With Image: ${publishedWithImage}`);
  
  writeGitHubOutput('posted', 'true');
  writeGitHubOutput('linkedin_post_id', linkedInResult.id);
  writeGitHubOutput('with_image', String(publishedWithImage));
  
  console.log('\n' + '═'.repeat(60));
  console.log('🎉 Done!');
  console.log('═'.repeat(60));
}

main().catch(error => {
  console.error('\n❌ Unexpected error:', error.message);
  if (error.stack) {
    console.error(error.stack);
  }
  writeGitHubOutput('posted', 'false');
  writeGitHubOutput('error', error.message);
  process.exit(1);
});
