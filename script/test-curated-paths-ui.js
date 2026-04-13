/**
 * Test script to verify curated paths are loading correctly
 * Tests both database and API endpoints
 */

import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config();

const db = createClient({
  url: process.env.SQLITE_URL ?? process.env.TURSO_DATABASE_URL ?? 'file:local.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function testCuratedPaths() {
  console.log('🔍 Testing Curated Paths System...\n');

  // Test 1: Check database
  console.log('📊 Test 1: Checking database...');
  try {
    const result = await db.execute('SELECT COUNT(*) as count FROM learning_paths WHERE status = ?', ['active']);
    const count = result.rows[0].count;
    console.log(`   ✅ Found ${count} active paths in database`);
    
    if (count === 0) {
      console.log('   ❌ ERROR: No paths in database!');
      console.log('   💡 Run: node script/generate-curated-paths.js');
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Database error: ${error.message}`);
    return false;
  }

  // Test 2: Check sample paths
  console.log('\n📋 Test 2: Checking sample paths...');
  try {
    const result = await db.execute('SELECT id, title, path_type, status FROM learning_paths WHERE status = ? LIMIT 5', ['active']);
    console.log(`   Found ${result.rows.length} sample paths:`);
    result.rows.forEach(row => {
      console.log(`   - ${row.title} (${row.path_type}) [${row.id}]`);
    });
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  // Test 3: Check API endpoint (if server is running)
  console.log('\n🌐 Test 3: Checking API endpoint...');
  try {
    const response = await fetch('http://localhost:5001/api/learning-paths');
    
    if (!response.ok) {
      console.log(`   ❌ API returned status: ${response.status}`);
      console.log('   💡 Make sure server is running: pnpm run dev');
      return false;
    }
    
    const data = await response.json();
    console.log(`   ✅ API returned ${data.length} paths`);
    
    if (data.length === 0) {
      console.log('   ❌ ERROR: API returned empty array!');
      console.log('   💡 Check server/routes.ts - /api/learning-paths endpoint');
      return false;
    }
    
    // Show sample paths from API
    console.log('\n   Sample paths from API:');
    data.slice(0, 3).forEach(path => {
      console.log(`   - ${path.title} (${path.pathType})`);
      console.log(`     Channels: ${path.channels}`);
      console.log(`     Questions: ${path.questionIds ? JSON.parse(path.questionIds).length : 0}`);
    });
    
  } catch (error) {
    console.log(`   ⚠️  Could not test API: ${error.message}`);
    console.log('   💡 Start server with: pnpm run dev');
  }

  // Test 4: Check UI data structure
  console.log('\n🎨 Test 4: Checking UI data structure...');
  try {
    const result = await db.execute(`
      SELECT id, title, path_type, channels, question_ids, estimated_hours, difficulty, description
      FROM learning_paths 
      WHERE status = ? 
      LIMIT 1
    `, ['active']);
    
    if (result.rows.length > 0) {
      const path = result.rows[0];
      console.log('   Sample path structure:');
      console.log(`   - ID: ${path.id}`);
      console.log(`   - Title: ${path.title}`);
      console.log(`   - Type: ${path.path_type}`);
      console.log(`   - Channels: ${path.channels}`);
      console.log(`   - Questions: ${path.question_ids}`);
      console.log(`   - Hours: ${path.estimated_hours}`);
      console.log(`   - Difficulty: ${path.difficulty}`);
      console.log(`   - Description: ${path.description?.substring(0, 50)}...`);
      
      // Validate JSON fields
      try {
        JSON.parse(path.channels || '[]');
        console.log('   ✅ Channels JSON is valid');
      } catch {
        console.log('   ❌ Channels JSON is invalid!');
      }
      
      try {
        JSON.parse(path.question_ids || '[]');
        console.log('   ✅ QuestionIds JSON is valid');
      } catch {
        console.log('   ❌ QuestionIds JSON is invalid!');
      }
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  // Test 5: Check path types distribution
  console.log('\n📊 Test 5: Checking path types distribution...');
  try {
    const result = await db.execute(`
      SELECT path_type, COUNT(*) as count 
      FROM learning_paths 
      WHERE status = ? 
      GROUP BY path_type
    `, ['active']);
    
    console.log('   Path types:');
    result.rows.forEach(row => {
      console.log(`   - ${row.path_type}: ${row.count} paths`);
    });
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  console.log('\n✅ All tests completed!');
  console.log('\n💡 Next steps:');
  console.log('   1. Make sure server is running: pnpm run dev');
  console.log('   2. Visit: http://localhost:5001/my-path');
  console.log('   3. Check browser console for errors');
  console.log('   4. Check Network tab for /api/learning-paths response');
  
  return true;
}

// Run tests
testCuratedPaths()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
