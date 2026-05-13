import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHED_PATHS_FILE = path.join(__dirname, '..', 'data', 'learning-paths.json');

async function testCuratedPaths() {
  console.log('🔍 Testing Curated Paths System...\n');

  console.log('📊 Test 1: Checking cached paths file...');
  try {
    if (!fs.existsSync(CACHED_PATHS_FILE)) {
      console.log('   ❌ No learning-paths.json found');
      console.log('   💡 Run: node script/generate-curated-paths.js');
      return false;
    }
    const data = JSON.parse(fs.readFileSync(CACHED_PATHS_FILE, 'utf8'));
    const paths = Array.isArray(data) ? data : data.paths || [];
    console.log(`   ✅ Found ${paths.length} paths in data/learning-paths.json`);

    if (paths.length === 0) {
      console.log('   ❌ ERROR: No paths found!');
      console.log('   💡 Run: node script/generate-curated-paths.js');
      return false;
    }
  } catch (error) {
    console.log(`   ❌ File read error: ${error.message}`);
    return false;
  }

  console.log('\n📋 Test 2: Checking sample paths...');
  try {
    const data = JSON.parse(fs.readFileSync(CACHED_PATHS_FILE, 'utf8'));
    const paths = Array.isArray(data) ? data : data.paths || [];
    console.log(`   Found ${paths.length} sample paths:`);
    paths.slice(0, 5).forEach(row => {
      console.log(`   - ${row.title} (${row.pathType || row.path_type}) [${row.id}]`);
    });
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

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

  console.log('\n🎨 Test 4: Checking UI data structure...');
  try {
    const data = JSON.parse(fs.readFileSync(CACHED_PATHS_FILE, 'utf8'));
    const paths = Array.isArray(data) ? data : data.paths || [];

    if (paths.length > 0) {
      const pathEntry = paths[0];
      console.log('   Sample path structure:');
      console.log(`   - ID: ${pathEntry.id}`);
      console.log(`   - Title: ${pathEntry.title}`);
      console.log(`   - Type: ${pathEntry.pathType || pathEntry.path_type}`);
      console.log(`   - Channels: ${pathEntry.channels}`);
      console.log(`   - Questions: ${pathEntry.questionIds || pathEntry.question_ids}`);
      console.log(`   - Hours: ${pathEntry.estimatedHours || pathEntry.estimated_hours}`);
      console.log(`   - Difficulty: ${pathEntry.difficulty}`);
      console.log(`   - Description: ${(pathEntry.description || '').substring(0, 50)}...`);

      try {
        JSON.parse(pathEntry.channels || '[]');
        console.log('   ✅ Channels JSON is valid');
      } catch {
        console.log('   ❌ Channels JSON is invalid!');
      }

      try {
        JSON.parse(pathEntry.questionIds || pathEntry.question_ids || '[]');
        console.log('   ✅ QuestionIds JSON is valid');
      } catch {
        console.log('   ❌ QuestionIds JSON is invalid!');
      }
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  console.log('\n📊 Test 5: Checking path types distribution...');
  try {
    const data = JSON.parse(fs.readFileSync(CACHED_PATHS_FILE, 'utf8'));
    const paths = Array.isArray(data) ? data : data.paths || [];

    const byType = {};
    for (const p of paths) {
      const type = p.pathType || p.path_type || 'unknown';
      byType[type] = (byType[type] || 0) + 1;
    }

    console.log('   Path types:');
    for (const [type, count] of Object.entries(byType)) {
      console.log(`   - ${type}: ${count} paths`);
    }
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

testCuratedPaths()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
