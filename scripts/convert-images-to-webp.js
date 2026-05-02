/**
 * WebP Image Conversion Script
 * 
 * Converts PNG, JPG, and JPEG images in the blog output directory to WebP format.
 * Generates both WebP (primary) and keeps original as fallback.
 * 
 * Usage:
 *   node scripts/convert-images-to-webp.js              # Convert all images
 *   node scripts/convert-images-to-webp.js --dry-run    # Preview without converting
 *   node scripts/convert-images-to-webp.js --quality 80 # Set WebP quality (default: 85)
 * 
 * Output:
 *   - Creates .webp files alongside originals
 *   - Outputs to blog-output/images/ directory
 *   - Generates a manifest file (blog-output/images/webp-manifest.json)
 * 
 * Requirements:
 *   - sharp library (already in package.json)
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

// Configuration
const CONFIG = {
  sourceDir: path.join(process.cwd(), 'blog-output'),
  outputDir: path.join(process.cwd(), 'blog-output', 'images'),
  supportedFormats: ['.png', '.jpg', '.jpeg'],
  defaultQuality: 85,
  maxWidth: 1920, // Max width for resized images
  maxHeight: 1080, // Max height for resized images
};

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  return {
    dryRun: args.includes('--dry-run'),
    quality: parseInt(args.find(a => a.startsWith('--quality='))?.split('=')[1] || CONFIG.defaultQuality, 10),
    verbose: args.includes('--verbose') || args.includes('-v'),
  };
}

/**
 * Recursively find all images in the source directory
 */
function findImages(dir, extensions) {
  const results = [];
  
  if (!fs.existsSync(dir)) {
    console.log(`⚠️  Directory not found: ${dir}`);
    return results;
  }
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      // Skip node_modules and .git
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      results.push(...findImages(fullPath, extensions));
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (extensions.includes(ext)) {
        results.push(fullPath);
      }
    }
  }
  
  return results;
}

/**
 * Generate optimized WebP from image
 */
async function convertToWebP(inputPath, outputPath, quality, options = {}) {
  const { dryRun = false, verbose = false } = options;
  
  const metadata = await sharp(inputPath).metadata();
  const originalSize = fs.statSync(inputPath).size;
  
  if (dryRun) {
    return {
      input: inputPath,
      output: outputPath,
      originalSize,
      originalFormat: metadata.format,
      originalWidth: metadata.width,
      originalHeight: metadata.height,
      skipped: true,
    };
  }
  
  let pipeline = sharp(inputPath);
  
  // Resize if image exceeds max dimensions
  if (metadata.width > CONFIG.maxWidth || metadata.height > CONFIG.maxHeight) {
    pipeline = pipeline.resize(CONFIG.maxWidth, CONFIG.maxHeight, {
      fit: 'inside',
      withoutEnlargement: true,
    });
  }
  
  // Convert to WebP
  const webpBuffer = await pipeline
    .webp({
      quality,
      effort: 6, // Higher effort = better compression (0-6)
    })
    .toBuffer();
  
  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Write WebP file
  fs.writeFileSync(outputPath, webpBuffer);
  
  const webpSize = fs.statSync(outputPath).size;
  const savings = ((1 - webpSize / originalSize) * 100).toFixed(1);
  
  if (verbose) {
    console.log(`  ✅ ${path.basename(inputPath)} → ${path.basename(outputPath)} (${originalSize} → ${webpSize} bytes, ${savings}% smaller)`);
  }
  
  return {
    input: inputPath,
    output: outputPath,
    originalSize,
    webpSize,
    originalFormat: metadata.format,
    originalWidth: metadata.width,
    originalHeight: metadata.height,
    savings: parseFloat(savings),
    skipped: false,
  };
}

/**
 * Generate <picture> element HTML for using WebP with fallback
 */
function generatePictureElement(originalPath, webpPath, alt = '', className = '') {
  const relOriginal = path.relative(CONFIG.outputDir, originalPath);
  const relWebp = path.relative(CONFIG.outputDir, webpPath);
  
  return `<picture>
  <source srcset="/images/${relWebp}" type="image/webp">
  <img src="/images/${relOriginal}" alt="${alt}" class="${className}" loading="lazy" decoding="async">
</picture>`;
}

/**
 * Main conversion function
 */
async function main() {
  const { dryRun, quality, verbose } = parseArgs();
  
  console.log('🖼️  WebP Image Conversion Script');
  console.log('================================');
  console.log(`📁 Source: ${CONFIG.sourceDir}`);
  console.log(`📁 Output: ${CONFIG.outputDir}`);
  console.log(`🎯 Quality: ${quality}`);
  console.log(`🔍 Dry run: ${dryRun ? 'Yes (no files will be modified)' : 'No'}`);
  console.log('');
  
  // Find all images
  const images = findImages(CONFIG.sourceDir, CONFIG.supportedFormats);
  
  if (images.length === 0) {
    console.log('ℹ️  No PNG/JPG/JPEG images found to convert.');
    console.log('');
    console.log('💡 Place images in blog-output/ or subdirectories and re-run.');
    return;
  }
  
  console.log(`📊 Found ${images.length} image(s) to convert\n`);
  
  const results = [];
  let totalOriginalSize = 0;
  let totalWebpSize = 0;
  let converted = 0;
  let errors = 0;
  
  for (const imagePath of images) {
    try {
      // Generate output path (same name, .webp extension)
      const baseName = path.basename(imagePath, path.extname(imagePath));
      const webpName = `${baseName}.webp`;
      const outputPath = path.join(CONFIG.outputDir, webpName);
      
      const result = await convertToWebP(imagePath, outputPath, quality, { dryRun, verbose });
      results.push(result);
      
      if (!result.skipped) {
        totalOriginalSize += result.originalSize;
        totalWebpSize += result.webpSize;
        converted++;
      }
    } catch (error) {
      console.error(`  ❌ Failed to convert ${path.basename(imagePath)}: ${error.message}`);
      errors++;
      results.push({
        input: imagePath,
        error: error.message,
        skipped: true,
      });
    }
  }
  
  // Summary
  console.log('');
  console.log('📋 Conversion Summary');
  console.log('=====================');
  console.log(`✅ Converted: ${converted}`);
  console.log(`❌ Errors: ${errors}`);
  console.log(`📦 Total original size: ${(totalOriginalSize / 1024).toFixed(1)} KB`);
  console.log(`📦 Total WebP size: ${(totalWebpSize / 1024).toFixed(1)} KB`);
  
  if (totalOriginalSize > 0) {
    const totalSavings = ((1 - totalWebpSize / totalOriginalSize) * 100).toFixed(1);
    console.log(`💾 Total savings: ${totalSavings}%`);
  }
  
  // Generate manifest
  if (!dryRun && results.length > 0) {
    const manifest = {
      generatedAt: new Date().toISOString(),
      quality,
      images: results.filter(r => !r.skipped && !r.error).map(r => ({
        original: path.relative(CONFIG.sourceDir, r.input),
        webp: path.relative(CONFIG.outputDir, r.output),
        originalSize: r.originalSize,
        webpSize: r.webpSize,
        savings: r.savings,
        width: r.originalWidth,
        height: r.originalHeight,
      })),
    };
    
    const manifestPath = path.join(CONFIG.outputDir, 'webp-manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log(`\n📄 Manifest written to: ${manifestPath}`);
    
    // Generate usage examples
    const examplesPath = path.join(CONFIG.outputDir, 'webp-usage-examples.html');
    const examples = results
      .filter(r => !r.skipped && !r.error)
      .slice(0, 10)
      .map(r => generatePictureElement(r.input, r.output, 'Blog image'))
      .join('\n\n');
    
    const examplesHtml = `<!-- WebP Image Usage Examples -->
<!-- Generated by convert-images-to-webp.js -->
<!-- Use these <picture> elements for responsive WebP with fallback -->

${examples}

<!-- 
  Usage in your HTML:
  - The <picture> element automatically serves WebP to supporting browsers
  - Falls back to original format for older browsers
  - Add fetchpriority="high" to hero images for better LCP
  - Always include loading="lazy" for below-fold images
-->`;
    
    fs.writeFileSync(examplesPath, examplesHtml);
    console.log(`📄 Usage examples written to: ${examplesPath}`);
  }
  
  console.log('');
  console.log('✨ Done!');
}

// Run
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
