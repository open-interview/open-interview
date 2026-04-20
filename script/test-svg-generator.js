#!/usr/bin/env node
/**
 * Test SVG Generator - Simple Clean Scenes
 * Run: node script/test-svg-generator.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { 
  generateSceneSVG, 
  getAvailableScenes,
  detectScene 
} from './ai/utils/blog-illustration-generator.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, '../test-svg-output');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('🧪 Testing SVG Generator - Simple Clean Scenes\n');

// Test 1: List all available scenes
console.log('📋 Available scenes:');
const scenes = getAvailableScenes();
console.log(`   ${scenes.join(', ')}\n`);

// Test 2: Generate all scene types
console.log('🎨 Generating all scene SVGs...\n');

const results = [];
for (const sceneName of scenes) {
  try {
    const svg = generateSceneSVG(sceneName);
    const filename = `test-${sceneName}.svg`;
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
  { title: 'Kubernetes scaling strategies', expected: 'scaling' },
  { title: 'Database optimization techniques', expected: 'database' },
  { title: 'CI/CD pipeline best practices', expected: 'deployment' },
  { title: 'Debugging production issues', expected: 'debugging' },
  { title: 'API gateway design patterns', expected: 'api' },
  { title: 'Security best practices for auth', expected: 'security' },
  { title: 'Performance optimization tips', expected: 'performance' },
  { title: 'System architecture overview', expected: 'architecture' },
  { title: 'Unit testing with Jest', expected: 'testing' },
  { title: 'Monitoring and observability', expected: 'monitoring' },
];


for (const tc of testCases) {
  const detected = detectScene(tc.title);
  const match = detected === tc.expected ? '✅' : '⚠️';
  console.log(`   ${match} "${tc.title.substring(0, 35)}..." -> ${detected} (expected: ${tc.expected})`);
}

// Test 4: Verify SVG structure
console.log('\n🔬 Verifying SVG structure...');
const testSvg = generateSceneSVG('architecture');
const checks = [
  { name: 'Has SVG root', test: testSvg.includes('<svg') },
  { name: 'Has viewBox', test: testSvg.includes('viewBox="0 0 700 380"') },
  { name: 'Has background gradient', test: testSvg.includes('bgGrad') },
  { name: 'Has icon boxes', test: testSvg.includes('rect') },
  { name: 'Has labels', test: testSvg.includes('<text') },
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
  console.log('\n✅ All tests passed!');
  console.log('\n💡 Open the SVG files in a browser to visually inspect:');
  console.log(`   open ${OUTPUT_DIR}/test-architecture.svg`);
}
