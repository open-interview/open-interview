/**
 * Image Downloader Utility
 * Downloads images from URLs and stores them locally in the blog-output folder
 * Uses OpenCode to generate better, more relevant images
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const IMAGES_DIR = 'blog-output/images';

/**
 * Ensure images directory exists
 */
function ensureImagesDir() {
  if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
  }
}

/**
 * Generate a unique filename for an image
 */
function generateImageFilename(url, postId) {
  const ext = getImageExtension(url);
  const hash = crypto.createHash('md5').update(url).digest('hex').substring(0, 8);
  return `${postId}-${hash}${ext}`;
}

/**
 * Get image extension from URL
 */
function getImageExtension(url) {
  const urlPath = new URL(url).pathname;
  const ext = path.extname(urlPath).toLowerCase();
  if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext)) {
    return ext;
  }
  return '.jpg'; // Default to jpg
}

/**
 * Download an image from URL and save locally
 * @param {string} url - Image URL to download
 * @param {string} postId - Post ID for naming
 * @returns {string|null} - Local path or null if failed
 */
export async function downloadImage(url, postId) {
  if (!url) return null;
  
  ensureImagesDir();
  
  try {
    const filename = generateImageFilename(url, postId);
    const localPath = path.join(IMAGES_DIR, filename);
    
    // Check if already downloaded
    if (fs.existsSync(localPath)) {
      console.log(`   ✅ Image already exists: ${filename}`);
      return `/images/${filename}`;
    }
    
    console.log(`   📥 Downloading: ${url.substring(0, 60)}...`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BlogBot/1.0)',
        'Accept': 'image/*'
      },
      timeout: 30000
    });
    
    if (!response.ok) {
      console.log(`   ❌ Failed to download (${response.status})`);
      return null;
    }
    
    const buffer = await response.arrayBuffer();
    fs.writeFileSync(localPath, Buffer.from(buffer));
    
    console.log(`   ✅ Saved: ${filename} (${Math.round(buffer.byteLength / 1024)}KB)`);
    return `/images/${filename}`;
    
  } catch (error) {
    console.log(`   ❌ Download error: ${error.message}`);
    return null;
  }
}

/**
 * Download all images for a blog post and update URLs to local paths
 * @param {Array} images - Array of image objects with url property
 * @param {string} postId - Post ID for naming
 * @returns {Array} - Updated images array with local URLs
 */
export async function downloadBlogImages(images, postId) {
  if (!images || !Array.isArray(images) || images.length === 0) {
    return [];
  }
  
  console.log(`\n🖼️ Downloading ${images.length} images for post ${postId}...`);
  
  const updatedImages = [];
  
  for (const img of images) {
    if (!img || !img.url) continue;
    
    const localUrl = await downloadImage(img.url, postId);
    
    if (localUrl) {
      updatedImages.push({
        ...img,
        originalUrl: img.url,
        url: localUrl
      });
    }
  }
  
  console.log(`   📊 Downloaded ${updatedImages.length}/${images.length} images`);
  return updatedImages;
}

/**
 * Illustrated character images from free illustration libraries
 * These are colorful, friendly illustrations similar to LinkedIn/Notion style
 */
export const TECH_IMAGES = {
  'system-design': [
    'https://illustrations.popsy.co/amber/engineer.svg',
    'https://illustrations.popsy.co/amber/remote-work.svg',
    'https://illustrations.popsy.co/amber/product-launch.svg',
  ],
  'devops': [
    'https://illustrations.popsy.co/amber/engineer.svg',
    'https://illustrations.popsy.co/amber/home-office.svg',
    'https://illustrations.popsy.co/amber/success.svg',
  ],
  'frontend': [
    'https://illustrations.popsy.co/amber/designer.svg',
    'https://illustrations.popsy.co/amber/creative-work.svg',
    'https://illustrations.popsy.co/amber/app-launch.svg',
  ],
  'backend': [
    'https://illustrations.popsy.co/amber/engineer.svg',
    'https://illustrations.popsy.co/amber/remote-work.svg',
    'https://illustrations.popsy.co/amber/working.svg',
  ],
  'database': [
    'https://illustrations.popsy.co/amber/data-analysis.svg',
    'https://illustrations.popsy.co/amber/engineer.svg',
    'https://illustrations.popsy.co/amber/success.svg',
  ],
  'security': [
    'https://illustrations.popsy.co/amber/security.svg',
    'https://illustrations.popsy.co/amber/engineer.svg',
    'https://illustrations.popsy.co/amber/success.svg',
  ],
  'ai-ml': [
    'https://illustrations.popsy.co/amber/artificial-intelligence.svg',
    'https://illustrations.popsy.co/amber/engineer.svg',
    'https://illustrations.popsy.co/amber/success.svg',
  ],
  'testing': [
    'https://illustrations.popsy.co/amber/qa-engineers.svg',
    'https://illustrations.popsy.co/amber/engineer.svg',
    'https://illustrations.popsy.co/amber/success.svg',
  ],
  'teamwork': [
    'https://illustrations.popsy.co/amber/team-work.svg',
    'https://illustrations.popsy.co/amber/collaboration.svg',
    'https://illustrations.popsy.co/amber/success.svg',
  ],
  'default': [
    'https://illustrations.popsy.co/amber/engineer.svg',
    'https://illustrations.popsy.co/amber/remote-work.svg',
    'https://illustrations.popsy.co/amber/success.svg',
  ]
};

/**
 * Get recommended images for a channel
 */
export function getRecommendedImages(channel) {
  const channelKey = Object.keys(TECH_IMAGES).find(key => 
    channel?.toLowerCase().includes(key) || key.includes(channel?.toLowerCase())
  );
  return TECH_IMAGES[channelKey] || TECH_IMAGES.default;
}

export default { 
  downloadImage, 
  downloadBlogImages, 
  getRecommendedImages,
  TECH_IMAGES 
};
