#!/usr/bin/env node
/**
 * Test LinkedIn Image Generator
 * Run: node script/test-linkedin-image-generator.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  generateLinkedInImage,
  generateLinkedInImagesBatch,
  generateSVGForPost,
  validateLinkedInImage,
  detectGeneratorType,
  scaleSVGForLinkedIn,
  LINKEDIN_SPECS,
  GENERATOR_TYPES
} from './ai/utils/linkedin-image-generator.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, '../test-svg-output/linkedin');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('🔗 LinkedIn Image Generator Test\n');
console.log('LinkedIn Specs:');
console.log(`   Recommended: ${LINKEDIN_SPECS.linkPreview.width}x${LINKEDIN_SPECS.linkPreview.height}`);
console.log(`   Max file size: ${LINKEDIN_SPECS.maxFileSize / 1024 / 1024}MB`);
console.log(`   Supported formats: ${LINKEDIN_SPECS.supportedFormats.join(', ')}\n`);

// Test 1: Generator type detection
console.log('📋 Test 1: Generator Type Detection');
const detectionTests = [
  { title: 'Microservices Architecture Patterns', expected: GENERATOR_TYPES.TECH },
  { title: 'Kubernetes Auto-Scaling Deep Dive', expected: GENERATOR_TYPES.TECH },
  { title: 'Team Collaboration Best Practices', expected: GENERATOR_TYPES.MODERN },
  { title: 'Remote Work Productivity Tips', expected: GENERATOR_TYPES.MODERN },
  { title: 'Technical Interview Preparation', expected: GENERATOR_TYPES.MODERN },
  { title: 'Database Replication Strategies', expected: GENERATOR_TYPES.TECH },
  { title: 'CI/CD Pipeline Optimization', expected: GENERATOR_TYPES.TECH },
  { title: 'Engineering Team Leadership', expected: GENERATOR_TYPES.MODERN },
];

for (const test of detectionTests) {
  const detected = detectGeneratorType(test.title);
  const match = detected === test.expected ? '✅' : '⚠️';
  console.log(`   ${match} "${test.title.substring(0, 35)}..." → ${detected} (expected: ${test.expected})`);
}

// Test 2: SVG Generation
console.log('\n📋 Test 2: SVG Generation');
const svgTests = [
  { title: 'System Architecture Overview', type: GENERATOR_TYPES.TECH },
  { title: 'Team Collaboration Meeting', type: GENERATOR_TYPES.MODERN },
  { title: 'API Gateway Design', type: GENERATOR_TYPES.TECH },
];

for (const test of svgTests) {
  try {
    const result = generateSVGForPost(test.title, '', { generatorType: test.type });
    const hasValidSVG = result.svg && result.svg.includes('<svg') && result.svg.includes('</svg>');
    console.log(`   ${hasValidSVG ? '✅' : '❌'} ${test.type}: "${test.title}" → scene: ${result.scene}`);
    
    // Save SVG for inspection
    const filename = `test-${test.type}-${test.title.toLowerCase().replace(/\s+/g, '-').substring(0, 30)}.svg`;
    fs.writeFileSync(path.join(OUTPUT_DIR, filename), result.svg);
  } catch (err) {
    console.log(`   ❌ ${test.type}: "${test.title}" → Error: ${err.message}`);
  }
}

// Test 3: SVG Scaling for LinkedIn
console.log('\n📋 Test 3: SVG Scaling for LinkedIn Dimensions');
try {
  const { svg } = generateSVGForPost('Test Architecture', '', { generatorType: GENERATOR_TYPES.TECH });
  const scaled = scaleSVGForLinkedIn(svg, 1200, 627);
  
  const hasCorrectDimensions = scaled.includes('width="1200"') && scaled.includes('height="627"');
  const hasBackground = scaled.includes('linkedinBg');
  const hasTransform = scaled.includes('transform="translate');
  
  console.log(`   ${hasCorrectDimensions ? '✅' : '❌'} Correct dimensions (1200x627)`);
  console.log(`   ${hasBackground ? '✅' : '❌'} Has LinkedIn background`);
  console.log(`   ${hasTransform ? '✅' : '❌'} Content is centered with transform`);
  
  fs.writeFileSync(path.join(OUTPUT_DIR, 'test-scaled-linkedin.svg'), scaled);
  console.log(`   📁 Saved: test-scaled-linkedin.svg`);
} catch (err) {
  console.log(`   ❌ Scaling failed: ${err.message}`);
}

// Test 4: Full Image Generation
console.log('\n📋 Test 4: Full LinkedIn Image Generation');
const imageTests = [
  { title: 'Kubernetes Pod Scheduling Explained', content: 'Deep dive into K8s scheduling' },
  { title: 'Building Resilient Microservices', content: 'Architecture patterns for reliability' },
  { title: 'Remote Engineering Team Success', content: 'Tips for distributed teams' },
];

async function runImageTests() {
  for (const test of imageTests) {
    try {
      const result = await generateLinkedInImage(test.title, test.content, OUTPUT_DIR);
      
      if (result.success) {
        console.log(`   ✅ "${test.title.substring(0, 35)}..."`);
        console.log(`      Path: ${result.path}`);
        console.log(`      Format: ${result.format}, Method: ${result.method}`);
        console.log(`      Scene: ${result.scene}, Generator: ${result.generatorType}`);
      } else {
        console.log(`   ❌ "${test.title}": ${result.issues?.join(', ')}`);
      }
    } catch (err) {
      console.log(`   ❌ "${test.title}": ${err.message}`);
    }
  }
}

// Test 5: Batch Generation
async function runBatchTest() {
  console.log('\n📋 Test 5: Batch Image Generation');
  
  const posts = [
    { id: 'post-1', title: 'Database Sharding Strategies' },
    { id: 'post-2', title: 'API Rate Limiting Best Practices' },
    { id: 'post-3', title: 'Team Standup Meeting Tips' },
  ];
  
  const results = await generateLinkedInImagesBatch(posts, OUTPUT_DIR);
  
  const successful = results.filter(r => r.success).length;
  console.log(`   Generated: ${successful}/${posts.length} images`);
}

// Test 6: Validation
console.log('\n📋 Test 6: Image Validation');
const validationTests = [
  { path: path.join(OUTPUT_DIR, 'test-scaled-linkedin.svg'), expected: true },
];

for (const test of validationTests) {
  if (fs.existsSync(test.path)) {
    const result = validateLinkedInImage(test.path);
    console.log(`   ${result.valid ? '✅' : '❌'} ${path.basename(test.path)}`);
    if (result.issues.length > 0) {
      console.log(`      Issues: ${result.issues.join(', ')}`);
    }
    if (result.warnings.length > 0) {
      console.log(`      Warnings: ${result.warnings.join(', ')}`);
    }
    console.log(`      Size: ${(result.fileSize / 1024).toFixed(1)}KB, Format: ${result.format}`);
  } else {
    console.log(`   ⏭️  Skipped: ${path.basename(test.path)} (not found)`);
  }
}

// Run async tests
async function main() {
  await runImageTests();
  await runBatchTest();
  
  console.log('\n' + '═'.repeat(60));
  console.log('📁 Output directory:', OUTPUT_DIR);
  console.log('═'.repeat(60));
  
  // List generated files
  const files = fs.readdirSync(OUTPUT_DIR);
  console.log(`\nGenerated ${files.length} files:`);
  files.forEach(f => console.log(`   - ${f}`));
  
  console.log('\n💡 To view SVG files:');
  console.log(`   open ${OUTPUT_DIR}/test-scaled-linkedin.svg`);
  
  console.log('\n✅ LinkedIn image generation complete!');
  console.log('   PNG conversion: sharp (installed)');
}

main().catch(console.error);
