#!/usr/bin/env node

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateLinkedInPost } from './ai/graphs/linkedin-graph.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const LINKEDIN_API_VERSION = process.env.LINKEDIN_API_VERSION || '202506';
const LINKEDIN_API_URL = 'https://api.linkedin.com/rest/posts';
const LINKEDIN_UPLOAD_URL = 'https://api.linkedin.com/rest/images?action=initializeUpload';
const MAX_CONTENT_LENGTH = 3000;
const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 256;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = ['.png', '.jpg', '.jpeg', '.gif'];
const API_TIMEOUT = 30000;
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

const accessToken = process.env.LINKEDIN_ACCESS_TOKEN?.trim();
const personUrn = process.env.LINKEDIN_PERSON_URN?.trim();
const postId = process.env.POST_ID?.trim();
const postTitle = process.env.POST_TITLE?.trim();
const postUrl = process.env.POST_URL?.trim();
const postExcerpt = process.env.POST_EXCERPT?.trim();
const postTags = process.env.POST_TAGS?.trim();
const postChannel = process.env.POST_CHANNEL?.trim();
const postQuickReference = process.env.POST_QUICK_REFERENCE?.trim();
const postSocialHook = process.env.POST_SOCIAL_HOOK?.trim();
const postSocialBody = process.env.POST_SOCIAL_BODY?.trim();
const postRealWorldExample = process.env.POST_REAL_WORLD_EXAMPLE?.trim();
const skipImage = process.env.SKIP_IMAGE === 'true';
const dryRun = process.env.DRY_RUN === 'true';

const PUBLISH_LOG_FILE = path.join(process.cwd(), 'data', 'linkedin-publish-log.json');

function logToPublishLog(postId, linkedInResult, publishedWithImage, error) {
  try {
    const now = new Date().toISOString();
    const dir = path.dirname(PUBLISH_LOG_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const logs = fs.existsSync(PUBLISH_LOG_FILE) ? JSON.parse(fs.readFileSync(PUBLISH_LOG_FILE, 'utf8')) : [];
    logs.push({
      blogPostId: postId,
      linkedinPostId: linkedInResult?.id || null,
      publishedAt: now,
      withImage: publishedWithImage,
      postType: 'article',
      error: error?.message || null,
      createdAt: now
    });
    fs.writeFileSync(PUBLISH_LOG_FILE, JSON.stringify(logs, null, 2));
  } catch (logErr) {
    console.warn(`   ⚠️ Failed to log to publish log: ${logErr.message}`);
  }
}

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

async function validateToken() {
  console.log('🔑 Validating LinkedIn access token...');

  const response = await fetch('https://api.linkedin.com/v2/userinfo', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'LinkedIn-Version': LINKEDIN_API_VERSION
    }
  });

  if (response.status === 401) {
    console.error('❌ LinkedIn token expired. Generate a new token at: https://www.linkedin.com/developers/apps');
    writeGitHubOutput('posted', 'false');
    writeGitHubOutput('error', 'LinkedIn token expired');
    process.exit(2);
  }

  if (!response.ok) {
    console.error(`⚠️ Token validation returned ${response.status}`);
    return false;
  }

  const data = await response.json();
  console.log(`   ✅ Token valid for: ${data.name || 'user'}`);

  if (process.env.LINKEDIN_TOKEN_EXPIRY) {
    const expiryDate = new Date(process.env.LINKEDIN_TOKEN_EXPIRY);
    const daysLeft = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 7) {
      console.log(`   ⚠️ Token expires in ${daysLeft} days!`);
    }
  }

  return true;
}

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

  const hasUrl = trimmed.includes('http://') || trimmed.includes('https://');
  if (!hasUrl) {
    return { valid: false, reason: 'Content must include at least one URL' };
  }

  return { valid: true, length: trimmed.length };
}

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

async function registerImageUpload() {
  console.log('📝 Registering image upload with LinkedIn...');

  const payload = {
    initializeUploadRequest: {
      owner: personUrn
    }
  };

  const response = await fetchWithRetry(LINKEDIN_UPLOAD_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'LinkedIn-Version': LINKEDIN_API_VERSION
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorMsg = await parseLinkedInError(response);
    throw new Error(`Failed to register upload (${response.status}): ${errorMsg}`);
  }

  const data = await response.json();

  const uploadUrl = data?.value?.uploadUrl;
  if (!uploadUrl) {
    throw new Error('Invalid response: missing uploadUrl');
  }

  const asset = data?.value?.image;
  if (!asset) {
    throw new Error('Invalid response: missing asset URN');
  }

  console.log(`   ✅ Got upload URL and asset: ${asset}`);
  return { uploadUrl, asset };
}

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

  if (!response.ok && response.status !== 201) {
    const errorMsg = await parseLinkedInError(response);
    throw new Error(`Failed to upload image (${response.status}): ${errorMsg}`);
  }

  console.log('   ✅ Image uploaded successfully');
  return true;
}

async function publishToLinkedInWithImage(content, imageAsset) {
  console.log('\n📤 Publishing to LinkedIn with image...');

  const payload = {
    author: personUrn,
    commentary: content.substring(0, MAX_CONTENT_LENGTH),
    visibility: 'PUBLIC',
    distribution: { feedDistribution: 'MAIN_FEED', targetEntities: [], thirdPartyDistributionChannels: [] },
    content: { media: { id: imageAsset } },
    lifecycleState: 'PUBLISHED',
    isReshareDisabledByAuthor: false
  };

  const response = await fetchWithRetry(LINKEDIN_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'LinkedIn-Version': LINKEDIN_API_VERSION
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorMsg = await parseLinkedInError(response);
    throw new Error(`LinkedIn API error (${response.status}): ${errorMsg}`);
  }

  const id = response.headers.get('x-restli-id') || response.headers.get('x-linkedin-id');
  if (id) return { id };

  try {
    const body = await response.json();
    const bodyId = body?.id || body?.postId || body?.urn;
    if (bodyId) return { id: bodyId };
  } catch {}

  if (response.status === 201) return { id: `posted-${Date.now()}` };

  throw new Error('Invalid response: missing post ID');
}

async function publishToLinkedInArticle(content) {
  console.log('\n📤 Publishing to LinkedIn as article link...');

  const payload = {
    author: personUrn,
    commentary: content.substring(0, MAX_CONTENT_LENGTH),
    visibility: 'PUBLIC',
    distribution: { feedDistribution: 'MAIN_FEED', targetEntities: [], thirdPartyDistributionChannels: [] },
    content: { article: { source: postUrl, title: postTitle.substring(0, MAX_TITLE_LENGTH), description: (postExcerpt || 'Technical interview preparation').substring(0, MAX_DESCRIPTION_LENGTH) } },
    lifecycleState: 'PUBLISHED',
    isReshareDisabledByAuthor: false
  };

  const response = await fetchWithRetry(LINKEDIN_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'LinkedIn-Version': LINKEDIN_API_VERSION
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorMsg = await parseLinkedInError(response);
    throw new Error(`LinkedIn API error (${response.status}): ${errorMsg}`);
  }

  const id = response.headers.get('x-restli-id') || response.headers.get('x-linkedin-id');
  if (id) return { id };

  try {
    const body = await response.json();
    const bodyId = body?.id || body?.postId || body?.urn;
    if (bodyId) return { id: bodyId };
  } catch {}

  if (response.status === 201) return { id: `posted-${Date.now()}` };

  throw new Error('Invalid response: missing post ID');
}

function writeGitHubOutput(key, value) {
  if (process.env.GITHUB_OUTPUT) {
    try {
      const str = String(value ?? '');
      if (str.includes('\n') || str.includes('\r')) {
        fs.appendFileSync(process.env.GITHUB_OUTPUT, `${key}<<__EOF__\n${str}\n__EOF__\n`);
      } else {
        fs.appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${str}\n`);
      }
    } catch (err) {
      console.warn(`   ⚠️ Failed to write GitHub output: ${err.message}`);
    }
  }
}

async function main() {
  console.log('═'.repeat(60));
  console.log('📢 LinkedIn Post Publisher');
  console.log('═'.repeat(60));
  console.log(`LinkedIn API Version: ${LINKEDIN_API_VERSION}`);
  console.log(`Title: ${postTitle?.substring(0, 50)}...`);
  console.log(`URL: ${postUrl}`);
  console.log(`Channel: ${postChannel || 'N/A'}`);
  console.log(`Dry Run: ${dryRun}`);
  console.log(`Skip Image: ${skipImage}`);
  console.log('─'.repeat(60));

  validateEnvironment();

  console.log('🤖 AI Provider: OpenCode (no API key required)');

  await validateToken();

  console.log('\n🔄 Generating LinkedIn post content...');

  let result;
  try {
    result = await generateLinkedInPost({
      title: postTitle,
      url: postUrl,
      excerpt: postExcerpt,
      channel: postChannel,
      tags: postTags,
      quickReference: postQuickReference,
      socialHook: postSocialHook,
      socialBody: postSocialBody,
      realWorldExample: postRealWorldExample
    });
  } catch (genError) {
    console.error('❌ Content generation failed:', genError.message);
    writeGitHubOutput('posted', 'false');
    writeGitHubOutput('error', genError.message);
    logToPublishLog(postUrl, null, false, genError);
    process.exit(1);
  }

  if (!result.success) {
    console.error('❌ Failed to generate LinkedIn post:', result.error);
    writeGitHubOutput('posted', 'false');
    writeGitHubOutput('error', result.error);
    logToPublishLog(postUrl, null, false, new Error(result.error));
    process.exit(1);
  }

  const content = result.content;
  const imagePath = skipImage ? null : result.image?.path;

  const contentValidation = validateContent(content);
  if (!contentValidation.valid) {
    console.error('❌ Content validation failed:', contentValidation.reason);
    writeGitHubOutput('posted', 'false');
    writeGitHubOutput('error', contentValidation.reason);
    logToPublishLog(postUrl, null, false, new Error(contentValidation.reason));
    process.exit(1);
  }

  console.log('\n📋 Final post content:');
  console.log('─'.repeat(50));
  console.log(content);
  console.log('─'.repeat(50));
  console.log(`✅ Content valid: ${contentValidation.length}/${MAX_CONTENT_LENGTH} chars`);

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

  if (dryRun) {
    console.log('\n🏃 DRY RUN - Skipping actual publish');
    writeGitHubOutput('posted', 'false');
    writeGitHubOutput('dry_run', 'true');
    logToPublishLog(postUrl, null, false, null);
    console.log('\n✅ Dry run complete');
    return;
  }

  let linkedInResult;
  let publishedWithImage = false;

  if (imageValidation.valid) {
    try {
      const { uploadUrl, asset } = await registerImageUpload();

      await uploadImage(uploadUrl, imagePath, imageValidation.type);

      linkedInResult = await publishToLinkedInWithImage(content, asset);
      publishedWithImage = true;
      console.log('\n✅ Successfully published to LinkedIn with image!');
      console.log('   📊 with_image=true recorded in publish output');
    } catch (imageError) {
      console.error('\n⚠️ Image upload failed:', imageError.message);

      try {
        linkedInResult = await publishToLinkedInArticle(content);
        console.log('\n✅ Successfully published to LinkedIn (without image)');
      } catch (fallbackError) {
        console.error('❌ Fallback publish also failed:', fallbackError.message);
        writeGitHubOutput('posted', 'false');
        writeGitHubOutput('error', fallbackError.message);
        logToPublishLog(postUrl, null, false, fallbackError);
        process.exit(1);
      }
    }
  } else {
    try {
      linkedInResult = await publishToLinkedInArticle(content);
      console.log('\n✅ Successfully published to LinkedIn!');
    } catch (publishError) {
      console.error('❌ Publish failed:', publishError.message);
      writeGitHubOutput('posted', 'false');
      writeGitHubOutput('error', publishError.message);
      logToPublishLog(postUrl, null, false, publishError);
      process.exit(1);
    }
  }

  console.log(`   Post ID: ${linkedInResult.id}`);
  console.log(`   With Image: ${publishedWithImage}`);

  logToPublishLog(postUrl, linkedInResult, publishedWithImage, null);

  writeGitHubOutput('posted', 'true');
  writeGitHubOutput('linkedin_post_id', linkedInResult.id);
  writeGitHubOutput('with_image', String(publishedWithImage));

  console.log('\n' + '═'.repeat(60));
  console.log('🎉 Done!');
  console.log('═'.repeat(60));
}

main().catch(async error => {
  console.error('\n❌ Unexpected error:', error.message);
  if (error.stack) {
    console.error(error.stack);
  }
  writeGitHubOutput('posted', 'false');
  writeGitHubOutput('error', error.message);
  logToPublishLog(postUrl, null, false, error);
  process.exit(1);
});
