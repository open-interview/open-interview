/**
 * LinkedIn Image Generator
 * 
 * Generates LinkedIn-compatible images from technical SVGs.
 * Supports SVG to PNG conversion with proper dimensions and validation.
 * 
 * LinkedIn Image Requirements:
 * - Recommended: 1200 x 627 pixels (1.91:1 aspect ratio)
 * - Minimum: 200 x 200 pixels
 * - Maximum file size: 5MB
 * - Supported formats: PNG, JPG, GIF
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Import SVG generators
import { generateSVG } from '../../../packages/tech-svg-generator/dist/index.js';
import { generateModernSceneSVG, detectModernScene } from './modern-illustration-generator.js';
import { generateSceneSVG as generateBlogSVG, detectScene as detectBlogScene } from './blog-illustration-generator.js';

// LinkedIn image specifications
const LINKEDIN_SPECS = {
  // Recommended dimensions for link previews
  linkPreview: { width: 1200, height: 627 },
  // Square format for posts
  square: { width: 1080, height: 1080 },
  // Portrait format
  portrait: { width: 1080, height: 1350 },
  // Minimum dimensions
  minimum: { width: 200, height: 200 },
  // Maximum file size in bytes (5MB)
  maxFileSize: 5 * 1024 * 1024,
  // Supported formats
  supportedFormats: ['png', 'jpg', 'jpeg', 'gif']
};

// Generator types
const GENERATOR_TYPES = {
  TECH: 'tech',      // Technical diagrams (architecture, scaling, etc.)
  MODERN: 'modern',  // Modern illustrations (people, office scenes)
  BLOG: 'blog'       // Blog-style illustrations
};

/**
 * Detect the best generator type based on content
 */
export function detectGeneratorType(title, content = '') {
  const text = `${title} ${content}`.toLowerCase();
  
  // Technical keywords favor tech generator
  const techKeywords = [
    'architecture', 'microservice', 'kubernetes', 'docker', 'database',
    'api', 'rest', 'graphql', 'deployment', 'ci/cd', 'pipeline',
    'security', 'authentication', 'monitoring', 'performance', 'scaling',
    'debugging', 'testing', 'infrastructure', 'cloud', 'aws', 'gcp', 'azure'
  ];
  
  // People/collaboration keywords favor modern generator
  const modernKeywords = [
    'team', 'collaboration', 'remote', 'meeting', 'interview', 'hiring',
    'onboarding', 'culture', 'leadership', 'management', 'career',
    'success', 'celebration', 'launch', 'milestone'
  ];
  
  const techScore = techKeywords.filter(kw => text.includes(kw)).length;
  const modernScore = modernKeywords.filter(kw => text.includes(kw)).length;
  
  if (techScore > modernScore + 1) {
    return GENERATOR_TYPES.TECH;
  } else if (modernScore > techScore) {
    return GENERATOR_TYPES.MODERN;
  }
  
  // Default to tech for technical content
  return GENERATOR_TYPES.TECH;
}

/**
 * Generate SVG based on title and content
 */
export function generateSVGForPost(title, content = '', options = {}) {
  const {
    generatorType = detectGeneratorType(title, content),
    theme = 'github-dark',
    width = LINKEDIN_SPECS.linkPreview.width,
    height = LINKEDIN_SPECS.linkPreview.height
  } = options;
  
  let svg, scene;
  
  switch (generatorType) {
    case GENERATOR_TYPES.TECH:
      const techResult = generateSVG(title, content, { 
        theme, 
        width: Math.min(width, 700),  // Tech generator has max 700 width
        height: Math.min(height, 420)
      });
      svg = techResult.svg;
      scene = techResult.scene;
      break;
      
    case GENERATOR_TYPES.MODERN:
      scene = detectModernScene(title);
      svg = generateModernSceneSVG(scene, title);
      break;
      
    case GENERATOR_TYPES.BLOG:
    default:
      scene = detectBlogScene(title);
      svg = generateBlogSVG(scene, title);
      break;
  }
  
  return {
    svg,
    scene,
    generatorType,
    dimensions: { width, height }
  };
}

/**
 * Scale SVG to LinkedIn dimensions
 */
export function scaleSVGForLinkedIn(svg, targetWidth = 1200, targetHeight = 627) {
  // Extract current viewBox
  const viewBoxMatch = svg.match(/viewBox="([^"]+)"/);
  const widthMatch = svg.match(/width="(\d+)"/);
  const heightMatch = svg.match(/height="(\d+)"/);
  
  let currentWidth = widthMatch ? parseInt(widthMatch[1]) : 800;
  let currentHeight = heightMatch ? parseInt(heightMatch[1]) : 500;
  
  if (viewBoxMatch) {
    const [, , , vbWidth, vbHeight] = viewBoxMatch[1].split(' ').map(Number);
    if (vbWidth && vbHeight) {
      currentWidth = vbWidth;
      currentHeight = vbHeight;
    }
  }
  
  // Calculate scale to fit within target while maintaining aspect ratio
  const scaleX = targetWidth / currentWidth;
  const scaleY = targetHeight / currentHeight;
  const scale = Math.min(scaleX, scaleY);
  
  const scaledWidth = Math.round(currentWidth * scale);
  const scaledHeight = Math.round(currentHeight * scale);
  
  // Calculate offset to center the content
  const offsetX = Math.round((targetWidth - scaledWidth) / 2);
  const offsetY = Math.round((targetHeight - scaledHeight) / 2);
  
  // Create wrapper SVG with LinkedIn dimensions
  const wrappedSVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${targetWidth} ${targetHeight}" width="${targetWidth}" height="${targetHeight}">
  <defs>
    <linearGradient id="linkedinBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0d1117"/>
      <stop offset="100%" stop-color="#161b22"/>
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="${targetWidth}" height="${targetHeight}" fill="url(#linkedinBg)"/>
  
  <!-- Centered content -->
  <g transform="translate(${offsetX}, ${offsetY}) scale(${scale})">
    ${extractSVGContent(svg)}
  </g>
</svg>`;
  
  return wrappedSVG;
}

/**
 * Extract inner content from SVG (remove outer svg tags)
 */
function extractSVGContent(svg) {
  // Remove XML declaration
  let content = svg.replace(/<\?xml[^?]*\?>\s*/g, '');
  
  // Extract content between svg tags
  const match = content.match(/<svg[^>]*>([\s\S]*)<\/svg>/i);
  if (match) {
    return match[1];
  }
  
  return content;
}

/**
 * Convert SVG to PNG using sharp (if available) or canvas
 * Falls back to saving SVG if conversion tools not available
 */
export async function convertSVGtoPNG(svg, outputPath, options = {}) {
  const {
    width = LINKEDIN_SPECS.linkPreview.width,
    height = LINKEDIN_SPECS.linkPreview.height,
    quality = 90
  } = options;
  
  // Scale SVG to target dimensions
  const scaledSVG = scaleSVGForLinkedIn(svg, width, height);
  
  try {
    // Try using sharp (best quality)
    const sharp = await import('sharp').catch(() => null);
    
    if (sharp) {
      const buffer = Buffer.from(scaledSVG);
      await sharp.default(buffer)
        .resize(width, height, { fit: 'contain', background: { r: 13, g: 17, b: 23, alpha: 1 } })
        .png({ quality })
        .toFile(outputPath);
      
      return { success: true, format: 'png', path: outputPath, method: 'sharp' };
    }
  } catch (err) {
    console.warn('Sharp conversion failed:', err.message);
  }
  
  try {
    // Try using @resvg/resvg-js (Rust-based, high quality)
    const { Resvg } = await import('@resvg/resvg-js').catch(() => ({ Resvg: null }));
    
    if (Resvg) {
      const resvg = new Resvg(scaledSVG, {
        fitTo: { mode: 'width', value: width }
      });
      const pngData = resvg.render();
      const pngBuffer = pngData.asPng();
      fs.writeFileSync(outputPath, pngBuffer);
      
      return { success: true, format: 'png', path: outputPath, method: 'resvg' };
    }
  } catch (err) {
    console.warn('Resvg conversion failed:', err.message);
  }
  
  // Fallback: Save as SVG (can still be used, just not optimal for LinkedIn)
  const svgPath = outputPath.replace(/\.png$/, '.svg');
  fs.writeFileSync(svgPath, scaledSVG);
  
  return { 
    success: true, 
    format: 'svg', 
    path: svgPath, 
    method: 'fallback',
    warning: 'PNG conversion not available. Install sharp or @resvg/resvg-js for PNG output.'
  };
}

/**
 * Validate image meets LinkedIn requirements
 */
export function validateLinkedInImage(imagePath) {
  const issues = [];
  const warnings = [];
  
  if (!fs.existsSync(imagePath)) {
    return { valid: false, issues: ['Image file not found'], warnings: [] };
  }
  
  const stats = fs.statSync(imagePath);
  const ext = path.extname(imagePath).toLowerCase().slice(1);
  
  // Check file size
  if (stats.size > LINKEDIN_SPECS.maxFileSize) {
    issues.push(`File size (${(stats.size / 1024 / 1024).toFixed(2)}MB) exceeds LinkedIn limit (5MB)`);
  }
  
  // Check format
  if (!LINKEDIN_SPECS.supportedFormats.includes(ext)) {
    if (ext === 'svg') {
      warnings.push('SVG format may not display optimally on LinkedIn. Consider converting to PNG.');
    } else {
      issues.push(`Unsupported format: ${ext}. Use PNG, JPG, or GIF.`);
    }
  }
  
  // For PNG/JPG, try to read dimensions
  if (['png', 'jpg', 'jpeg'].includes(ext)) {
    try {
      const buffer = fs.readFileSync(imagePath);
      const dimensions = getImageDimensions(buffer, ext);
      
      if (dimensions) {
        if (dimensions.width < LINKEDIN_SPECS.minimum.width || 
            dimensions.height < LINKEDIN_SPECS.minimum.height) {
          issues.push(`Image too small (${dimensions.width}x${dimensions.height}). Minimum: 200x200`);
        }
        
        // Check aspect ratio for link preview
        const aspectRatio = dimensions.width / dimensions.height;
        if (aspectRatio < 1.5 || aspectRatio > 2.5) {
          warnings.push(`Aspect ratio (${aspectRatio.toFixed(2)}) may not display optimally. Recommended: 1.91:1`);
        }
      }
    } catch (err) {
      warnings.push('Could not verify image dimensions');
    }
  }
  
  return {
    valid: issues.length === 0,
    issues,
    warnings,
    fileSize: stats.size,
    format: ext
  };
}

/**
 * Get image dimensions from buffer (basic implementation)
 */
function getImageDimensions(buffer, format) {
  try {
    if (format === 'png') {
      // PNG: width at bytes 16-19, height at bytes 20-23
      if (buffer.length >= 24 && buffer.toString('hex', 0, 8) === '89504e470d0a1a0a') {
        return {
          width: buffer.readUInt32BE(16),
          height: buffer.readUInt32BE(20)
        };
      }
    } else if (format === 'jpg' || format === 'jpeg') {
      // JPEG: More complex, look for SOF0 marker
      let offset = 2;
      while (offset < buffer.length) {
        if (buffer[offset] !== 0xFF) break;
        const marker = buffer[offset + 1];
        if (marker === 0xC0 || marker === 0xC2) {
          return {
            height: buffer.readUInt16BE(offset + 5),
            width: buffer.readUInt16BE(offset + 7)
          };
        }
        offset += 2 + buffer.readUInt16BE(offset + 2);
      }
    }
  } catch (err) {
    // Ignore parsing errors
  }
  return null;
}

/**
 * Generate a unique filename for the image
 */
export function generateImageFilename(title, format = 'png') {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
  
  const hash = crypto.createHash('md5').update(title).digest('hex').substring(0, 8);
  
  return `linkedin-${slug}-${hash}.${format}`;
}

/**
 * Main function: Generate LinkedIn-ready image for a post
 */
export async function generateLinkedInImage(title, content = '', outputDir = 'blog-output/images') {
  console.log(`\n🖼️  Generating LinkedIn image for: "${title.substring(0, 50)}..."`);
  
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Generate SVG
  const { svg, scene, generatorType } = generateSVGForPost(title, content);
  console.log(`   Generator: ${generatorType}, Scene: ${scene}`);
  
  // Generate filename
  const filename = generateImageFilename(title, 'png');
  const outputPath = path.join(outputDir, filename);
  
  // Convert to PNG
  const conversionResult = await convertSVGtoPNG(svg, outputPath);
  
  if (conversionResult.warning) {
    console.log(`   ⚠️  ${conversionResult.warning}`);
  }
  
  // Validate the result
  const validation = validateLinkedInImage(conversionResult.path);
  
  if (!validation.valid) {
    console.log(`   ❌ Validation failed: ${validation.issues.join(', ')}`);
    return {
      success: false,
      issues: validation.issues,
      path: conversionResult.path
    };
  }
  
  if (validation.warnings.length > 0) {
    console.log(`   ⚠️  Warnings: ${validation.warnings.join(', ')}`);
  }
  
  console.log(`   ✅ Image generated: ${conversionResult.path}`);
  console.log(`   Format: ${conversionResult.format}, Size: ${(validation.fileSize / 1024).toFixed(1)}KB`);
  
  return {
    success: true,
    path: conversionResult.path,
    format: conversionResult.format,
    method: conversionResult.method,
    scene,
    generatorType,
    validation
  };
}

/**
 * Batch generate images for multiple posts
 */
export async function generateLinkedInImagesBatch(posts, outputDir = 'blog-output/images') {
  console.log(`\n📦 Batch generating ${posts.length} LinkedIn images...`);
  
  const results = [];
  
  for (const post of posts) {
    try {
      const result = await generateLinkedInImage(
        post.title,
        post.content || post.excerpt || '',
        outputDir
      );
      results.push({ ...result, postId: post.id || post.postId });
    } catch (err) {
      console.error(`   ❌ Failed for "${post.title}": ${err.message}`);
      results.push({ 
        success: false, 
        error: err.message, 
        postId: post.id || post.postId 
      });
    }
  }
  
  const successful = results.filter(r => r.success).length;
  console.log(`\n✅ Generated ${successful}/${posts.length} images successfully`);
  
  return results;
}

// Export constants
export { LINKEDIN_SPECS, GENERATOR_TYPES };

export default {
  generateLinkedInImage,
  generateLinkedInImagesBatch,
  generateSVGForPost,
  convertSVGtoPNG,
  validateLinkedInImage,
  detectGeneratorType,
  scaleSVGForLinkedIn,
  LINKEDIN_SPECS,
  GENERATOR_TYPES
};
