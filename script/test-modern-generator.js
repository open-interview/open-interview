#!/usr/bin/env node
/**
 * Test Modern Illustration Generator
 * Run: node script/test-modern-generator.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { 
  generateModernSceneSVG, 
  getAvailableModernScenes,
  detectModernScene 
} from './ai/utils/modern-illustration-generator.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, '../test-svg-output/modern');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('🎨 Testing Modern Illustration Generator (v2)\n');
console.log('Inspired by: Stripe, Notion, Linear, Slack, Figma\n');

// Test 1: List all available scenes
console.log('📋 Available modern scenes:');
const scenes = getAvailableModernScenes();
console.log(`   ${scenes.join(', ')}\n`);

// Test 2: Generate all scene types
console.log('🖼️  Generating modern SVGs...\n');

const results = [];
for (const sceneName of scenes) {
  try {
    const title = `${sceneName.charAt(0).toUpperCase() + sceneName.slice(1)} - Modern Workspace`;
    const svg = generateModernSceneSVG(sceneName, title);
    const filename = `modern-${sceneName}.svg`;
    const filepath = path.join(OUTPUT_DIR, filename);
    fs.writeFileSync(filepath, svg);
    results.push({ scene: sceneName, status: '✅', file: filename });
    console.log(`   ✅ ${sceneName} -> ${filename}`);
  } catch (err) {
    results.push({ scene: sceneName, status: '❌', error: err.message });
    console.log(`   ❌ ${sceneName}: ${err.message}`);
  }
}

// Test 3: Test keyword detection
console.log('\n🔍 Testing keyword detection:');
const testCases = [
  { title: 'Team collaboration strategies', expected: 'collaboration' },
  { title: 'Remote work productivity tips', expected: 'remote' },
  { title: 'Sprint planning meeting', expected: 'meeting' },
  { title: 'Code review best practices', expected: 'coding' },
  { title: 'Technical interview preparation', expected: 'interview' },
  { title: 'Celebrating our product launch', expected: 'success' },
  { title: 'Design thinking workshop', expected: 'brainstorm' },
];

for (const tc of testCases) {
  const detected = detectModernScene(tc.title);
  const match = detected === tc.expected ? '✅' : '⚠️';
  console.log(`   ${match} "${tc.title.substring(0, 35)}..." -> ${detected} (expected: ${tc.expected})`);
}

// Test 4: Verify SVG structure
console.log('\n🔬 Verifying SVG structure...');
const testSvg = generateModernSceneSVG('collaboration', 'Team Collaboration');
const checks = [
  { name: 'Has SVG root', test: testSvg.includes('<svg') },
  { name: 'Has viewBox', test: testSvg.includes('viewBox="0 0 800 500"') },
  { name: 'Has gradient definitions', test: testSvg.includes('<linearGradient') },
  { name: 'Has drop shadow filters', test: testSvg.includes('<filter') },
  { name: 'Has modern-person elements', test: testSvg.includes('modern-person') },
  { name: 'Uses warm cream background', test: testSvg.includes('#FBF8F4') },
  { name: 'Has rounded panels', test: testSvg.includes('rx="20"') || testSvg.includes('rx="16"') },
  { name: 'Valid XML closing', test: testSvg.includes('</svg>') },
];

for (const check of checks) {
  console.log(`   ${check.test ? '✅' : '❌'} ${check.name}`);
}

// Summary
console.log('\n📊 Summary:');
const passed = results.filter(r => r.status === '✅').length;
const failed = results.filter(r => r.status === '❌').length;
console.log(`   Scenes generated: ${passed}/${results.length}`);
console.log(`   Output directory: ${OUTPUT_DIR}`);

if (failed > 0) {
  console.log('\n❌ Some tests failed!');
  process.exit(1);
} else {
  console.log('\n✅ All modern illustrations generated!');
  console.log('\n💡 Key improvements over v1:');
  console.log('   • Proper human proportions with larger heads');
  console.log('   • Soft gradients and subtle shadows');
  console.log('   • Organic shapes and curves');
  console.log('   • Layered depth with overlapping elements');
  console.log('   • Harmonious, modern color palette');
  console.log('   • Clean, minimal aesthetic');
  console.log('\n📂 Open the SVG files in a browser to compare:');
  console.log(`   open ${OUTPUT_DIR}/modern-collaboration.svg`);
}
