#!/usr/bin/env node
/**
 * Test LinkedIn Poll Setup
 * Validates that everything is configured correctly
 */

import 'dotenv/config';
import { getAllUnifiedQuestions, getQuestionsForChannel } from './utils.js';

console.log('═'.repeat(60));
console.log('🧪 LinkedIn Poll Setup Test');
console.log('═'.repeat(60));

let hasErrors = false;

// Test 1: Check environment variables
console.log('\n1️⃣ Checking environment variables...');
const accessToken = process.env.LINKEDIN_ACCESS_TOKEN?.trim();
const personUrn = process.env.LINKEDIN_PERSON_URN?.trim();

if (!accessToken) {
  console.log('   ❌ LINKEDIN_ACCESS_TOKEN not set');
  hasErrors = true;
} else if (accessToken.length < 20) {
  console.log('   ⚠️  LINKEDIN_ACCESS_TOKEN seems too short');
  hasErrors = true;
} else {
  console.log('   ✅ LINKEDIN_ACCESS_TOKEN is set');
}

if (!personUrn) {
  console.log('   ❌ LINKEDIN_PERSON_URN not set');
  hasErrors = true;
} else if (!personUrn.startsWith('urn:li:person:')) {
  console.log('   ❌ LINKEDIN_PERSON_URN has invalid format');
  console.log('      Expected: urn:li:person:XXXXXXXX');
  console.log(`      Got: ${personUrn}`);
  hasErrors = true;
} else {
  console.log('   ✅ LINKEDIN_PERSON_URN is set');
}

// Test 2: Check database connection
console.log('\n2️⃣ Checking database connection...');
try {
  const allQuestions = await getAllUnifiedQuestions();
  const count = allQuestions.length;
  console.log(`   ✅ Database connected (${count} questions)`);
  
  if (count === 0) {
    console.log('   ⚠️  No questions in database');
    hasErrors = true;
  }
} catch (error) {
  console.log('   ❌ Database connection failed:', error.message);
  hasErrors = true;
}

// Test 3: Check for questions with multiple choice format
console.log('\n3️⃣ Checking for poll-suitable questions...');
try {
  const allQuestions = await getAllUnifiedQuestions();
  const matching = allQuestions.filter(q => {
    const a = q.answer || '';
    return a.includes('A)') || a.includes('B)') || a.includes('1.') || a.includes('2.');
  }).slice(0, 5);
  
  if (matching.length === 0) {
    console.log('   ⚠️  No questions with multiple choice format found');
    console.log('      Questions need format like:');
    console.log('      A) Option 1');
    console.log('      B) Option 2');
    console.log('      C) Option 3');
    hasErrors = true;
  } else {
    console.log(`   ✅ Found ${matching.length} poll-suitable questions`);
    console.log('\n   Sample questions:');
    matching.forEach((row, i) => {
      console.log(`   ${i + 1}. ${row.id} - ${row.channel} (${row.difficulty})`);
      console.log(`      ${row.question.substring(0, 60)}...`);
    });
  }
} catch (error) {
  console.log('   ❌ Failed to query questions:', error.message);
  hasErrors = true;
}

// Test 4: Check script exists
console.log('\n4️⃣ Checking script files...');
try {
  const fs = await import('fs');
  if (fs.existsSync('script/post-linkedin-poll.js')) {
    console.log('   ✅ script/post-linkedin-poll.js exists');
  } else {
    console.log('   ❌ script/post-linkedin-poll.js not found');
    hasErrors = true;
  }
  
  if (fs.existsSync('.github/workflows/linkedin-poll.yml')) {
    console.log('   ✅ .github/workflows/linkedin-poll.yml exists');
  } else {
    console.log('   ❌ .github/workflows/linkedin-poll.yml not found');
    hasErrors = true;
  }
} catch (error) {
  console.log('   ❌ Failed to check files:', error.message);
  hasErrors = true;
}

// Test 5: Test LinkedIn API (if credentials provided)
if (accessToken && personUrn && !hasErrors) {
  console.log('\n5️⃣ Testing LinkedIn API connection...');
  try {
    const response = await fetch('https://api.linkedin.com/v2/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ LinkedIn API connection successful');
      console.log(`   Profile: ${data.localizedFirstName} ${data.localizedLastName}`);
    } else {
      console.log(`   ⚠️  LinkedIn API error: ${response.status}`);
      if (response.status === 401) {
        console.log('      Token may be expired or invalid');
      } else if (response.status === 403) {
        console.log('      Token lacks required permissions (w_member_social)');
        console.log('      OR app not approved for "Share on LinkedIn" product');
        console.log('      You can still use dry run mode: npm run linkedin:poll:dry');
      }
      // Don't mark as error - user can still use dry run
      console.log('   ℹ️  Tip: Use dry run mode to test without LinkedIn API');
    }
  } catch (error) {
    console.log('   ⚠️  Failed to connect to LinkedIn API:', error.message);
    console.log('   ℹ️  You can still use dry run mode: npm run linkedin:poll:dry');
  }
}

// Summary
console.log('\n' + '═'.repeat(60));
if (hasErrors) {
  console.log('❌ Setup has issues - please fix the errors above');
  console.log('\n📚 Documentation:');
  console.log('   - Setup Guide: docs/LINKEDIN_POLL_SETUP.md');
  console.log('   - Quick Reference: docs/LINKEDIN_POLL_QUICK_REFERENCE.md');
  console.log('   - Examples: docs/LINKEDIN_POLL_EXAMPLE.md');
  process.exit(1);
} else {
  console.log('✅ All checks passed! You\'re ready to post LinkedIn polls');
  console.log('\n🚀 Next steps:');
  console.log('   1. Test with dry run: npm run linkedin:poll:dry');
  console.log('   2. Post a poll: npm run linkedin:poll');
  console.log('   3. Or use GitHub Actions workflow');
  console.log('\n📚 Documentation:');
  console.log('   - Quick Reference: docs/LINKEDIN_POLL_QUICK_REFERENCE.md');
  console.log('   - Full Guide: docs/LINKEDIN_POLL_WORKFLOW.md');
}
console.log('═'.repeat(60));
