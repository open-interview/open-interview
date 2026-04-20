#!/usr/bin/env node

/**
 * Verify Search Boxes Script
 * Checks if search boxes are present in the HTML files
 */

import fs from 'fs';
import path from 'path';

console.log('🔍 Verifying search box implementation...\n');

const checks = [
  {
    file: 'client/src/pages/LearningPaths.tsx',
    searchFor: 'Search learning paths',
    description: 'Learning Paths search box'
  },
  {
    file: 'client/src/pages/AllChannelsRedesigned.tsx',
    searchFor: 'Search channels',
    description: 'Channels search box'
  },
  {
    file: 'client/src/components/mobile/MobileChannels.tsx',
    searchFor: 'Search channels',
    description: 'Mobile channels search box'
  }
];

let allPassed = true;

for (const check of checks) {
  const filePath = path.join(process.cwd(), check.file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ ${check.description}: File not found`);
    allPassed = false;
    continue;
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  
  if (content.includes(check.searchFor)) {
    console.log(`✅ ${check.description}: Found`);
    
    // Check if it's in an input element
    const hasInput = content.includes(`placeholder="${check.searchFor}`) || 
                     content.includes(`placeholder={"${check.searchFor}`) ||
                     content.includes(`placeholder*="${check.searchFor}`);
    
    if (hasInput) {
      console.log(`   ✓ Properly implemented as input field`);
    } else {
      console.log(`   ⚠️  Found but may not be in input field`);
    }
    
    // Check for Search icon
    if (content.includes('<Search ') || content.includes('Search className')) {
      console.log(`   ✓ Search icon present`);
    }
    
  } else {
    console.log(`❌ ${check.description}: Not found`);
    allPassed = false;
  }
  
  console.log('');
}

// Check for proper positioning (below title)
console.log('📍 Checking positioning...\n');

const learningPathsContent = fs.readFileSync('client/src/pages/LearningPaths.tsx', 'utf-8');
const channelsContent = fs.readFileSync('client/src/pages/AllChannelsRedesigned.tsx', 'utf-8');

// Check Learning Paths
const lpTitleIndex = learningPathsContent.indexOf('Learning Paths</h1>');
const lpSearchIndex = learningPathsContent.indexOf('Search learning paths');

if (lpTitleIndex > 0 && lpSearchIndex > lpTitleIndex) {
  console.log('✅ Learning Paths: Search box appears after title in code');
} else {
  console.log('❌ Learning Paths: Search box positioning issue');
  allPassed = false;
}

// Check Channels
const chTitleIndex = channelsContent.indexOf('Browse Channels</h1>');
const chSearchIndex = channelsContent.indexOf('Search channels');

if (chTitleIndex > 0 && chSearchIndex > chTitleIndex) {
  console.log('✅ Channels: Search box appears after title in code');
} else {
  console.log('❌ Channels: Search box positioning issue');
  allPassed = false;
}

console.log('\n' + '='.repeat(50));

if (allPassed) {
  console.log('✅ All checks passed!');
  console.log('\n💡 If you still don\'t see the search boxes:');
  console.log('   1. Clear browser cache (Ctrl+Shift+Delete)');
  console.log('   2. Hard refresh (Ctrl+Shift+R)');
  console.log('   3. Restart dev server');
  console.log('   4. Try incognito mode');
  process.exit(0);
} else {
  console.log('❌ Some checks failed');
  process.exit(1);
}
