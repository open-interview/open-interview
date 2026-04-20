#!/usr/bin/env node
/**
 * Test Cartoon Illustration Generator
 * Run: node script/test-cartoon-generator.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { 
  generateCartoonSceneSVG, 
  getAvailableCartoonScenes,
  detectCartoonScene 
} from './ai/utils/cartoon-illustration-generator.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, '../test-svg-output/cartoon');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('🎨 Testing Cartoon Illustration Generator\n');

// Test 1: List all available scenes
console.log('📋 Available cartoon scenes:');
const scenes = getAvailableCartoonScenes();
console.log(`   ${scenes.join(', ')}\n`);

// Test 2: Generate all scene types
console.log('🖼️  Generating cartoon SVGs...\n');

const results = [];
for (const sceneName of scenes) {
  try {
    const svg = generateCartoonSceneSVG(sceneName, `${sceneName.charAt(0).toUpperCase() + sceneName.slice(1)} - Team Workflow`);
    const filename = `cartoon-${sceneName}.svg`;
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
  { title: 'Daily standup meeting best practices', expected: 'meeting' },
  { title: 'Remote work productivity tips', expected: 'remote' },
  { title: 'Team collaboration strategies', expected: 'collaboration' },
  { title: 'Product demo presentation', expected: 'presentation' },
  { title: 'Code review best practices', expected: 'coding' },
  { title: 'Technical interview preparation', expected: 'interview' },
  { title: 'Celebrating our product launch', expected: 'success' },
  { title: 'Building microservices architecture', expected: 'coding' },
];

for (const tc of testCases) {
  const detected = detectCartoonScene(tc.title);
  const match = detected === tc.expected ? '✅' : '⚠️';
  console.log(`   ${match} "${tc.title.substring(0, 35)}..." -> ${detected} (expected: ${tc.expected})`);
}

// Test 4: Verify SVG structure
console.log('\n🔬 Verifying SVG structure...');
const testSvg = generateCartoonSceneSVG('collaboration', 'Team Collaboration');
const checks = [
  { name: 'Has SVG root', test: testSvg.includes('<svg') },
  { name: 'Has viewBox', test: testSvg.includes('viewBox="0 0 800 500"') },
  { name: 'Has background gradient', test: testSvg.includes('bgGrad') },
  { name: 'Has scene panels', test: testSvg.includes('scene-panel') },
  { name: 'Has person elements', test: testSvg.includes('class="person"') },
  { name: 'Uses warm colors', test: testSvg.includes('#FAF5F0') || testSvg.includes('#E86A33') },
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
  console.log('\n✅ All cartoon illustrations generated!');
  console.log('\n💡 Open the SVG files in a browser to visually inspect:');
  console.log(`   open ${OUTPUT_DIR}/cartoon-collaboration.svg`);
}
