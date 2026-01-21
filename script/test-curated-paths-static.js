#!/usr/bin/env node

/**
 * Test Curated Paths Static JSON Loading
 * Verifies that the static JSON file is correctly generated and accessible
 */

import fs from 'fs';
import path from 'path';

const JSON_PATH = 'client/public/data/learning-paths.json';

console.log('🧪 Testing Curated Paths Static JSON\n');

// Check if file exists
if (!fs.existsSync(JSON_PATH)) {
  console.error(`❌ File not found: ${JSON_PATH}`);
  console.log('\n💡 Run: pnpm run generate:paths');
  process.exit(1);
}

// Read and parse JSON
const data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));

console.log(`✅ File exists: ${JSON_PATH}`);
console.log(`📊 Total paths: ${data.length}`);

// Group by type
const byType = data.reduce((acc, path) => {
  acc[path.pathType] = (acc[path.pathType] || 0) + 1;
  return acc;
}, {});

console.log('\n📈 Paths by type:');
Object.entries(byType).forEach(([type, count]) => {
  console.log(`   - ${type}: ${count}`);
});

// Sample paths
console.log('\n🎯 Sample paths:');
const samples = [
  data.find(p => p.pathType === 'job-title'),
  data.find(p => p.pathType === 'company'),
  data.find(p => p.pathType === 'certification')
].filter(Boolean);

samples.forEach(path => {
  const questionIds = typeof path.questionIds === 'string' 
    ? JSON.parse(path.questionIds) 
    : path.questionIds;
  
  console.log(`\n   ${path.title}`);
  console.log(`   - Type: ${path.pathType}`);
  console.log(`   - Difficulty: ${path.difficulty}`);
  console.log(`   - Questions: ${questionIds?.length || 0}`);
  console.log(`   - Hours: ${path.estimatedHours}h`);
});

// Validate structure
console.log('\n🔍 Validating structure...');
const requiredFields = ['id', 'title', 'description', 'pathType', 'difficulty', 'estimatedHours', 'questionIds', 'channels'];
const issues = [];

data.forEach((path, index) => {
  requiredFields.forEach(field => {
    if (!path[field]) {
      issues.push(`Path ${index} (${path.id || 'unknown'}) missing field: ${field}`);
    }
  });
  
  // Check if JSON strings are valid
  ['questionIds', 'channels', 'tags', 'learningObjectives', 'milestones'].forEach(field => {
    if (path[field] && typeof path[field] === 'string') {
      try {
        JSON.parse(path[field]);
      } catch (e) {
        issues.push(`Path ${path.id} has invalid JSON in ${field}`);
      }
    }
  });
});

if (issues.length > 0) {
  console.log(`\n❌ Found ${issues.length} issues:`);
  issues.slice(0, 10).forEach(issue => console.log(`   - ${issue}`));
  if (issues.length > 10) {
    console.log(`   ... and ${issues.length - 10} more`);
  }
} else {
  console.log('   ✅ All paths have valid structure');
}

console.log('\n✅ Static JSON test complete!');
console.log('\n💡 Next steps:');
console.log('   1. Open http://localhost:5001/my-path in browser');
console.log('   2. Check browser console for errors');
console.log('   3. Verify curated paths are displayed');
