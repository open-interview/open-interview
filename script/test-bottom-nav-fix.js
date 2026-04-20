#!/usr/bin/env node

/**
 * Bottom Navigation Icon Fix - Automated Testing & Fix Script
 * 
 * This script:
 * 1. Runs visual regression tests
 * 2. Analyzes screenshots
 * 3. Applies fixes iteratively
 * 4. Verifies the fix
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const MAX_ITERATIONS = 5;
const NAV_FILE = 'client/src/components/layout/UnifiedNav.tsx';
const TEST_FILE = 'e2e/visual/bottom-nav-icon-fix.spec.ts';
const RESULTS_DIR = 'test-results';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function header(message) {
  console.log('');
  log('━'.repeat(60), 'blue');
  log(`  ${message}`, 'blue');
  log('━'.repeat(60), 'blue');
  console.log('');
}

function runTest() {
  log('📸 Running visual regression test...', 'cyan');
  
  try {
    execSync(`pnpm exec playwright test ${TEST_FILE} --reporter=list`, {
      stdio: 'inherit',
    });
    log('✅ Test passed!', 'green');
    return true;
  } catch (error) {
    log('❌ Test failed', 'red');
    return false;
  }
}

function analyzeResults(iteration) {
  log('🔍 Analyzing test results...', 'cyan');
  
  // Create iteration directory
  const iterationDir = path.join(RESULTS_DIR, 'iterations', `iteration-${iteration}`);
  if (!fs.existsSync(iterationDir)) {
    fs.mkdirSync(iterationDir, { recursive: true });
  }
  
  // Copy screenshots
  if (fs.existsSync(RESULTS_DIR)) {
    const files = fs.readdirSync(RESULTS_DIR);
    const screenshots = files.filter(f => f.endsWith('.png'));
    
    log(`  Found ${screenshots.length} screenshots`, 'cyan');
    
    screenshots.forEach(file => {
      const src = path.join(RESULTS_DIR, file);
      const dest = path.join(iterationDir, file);
      fs.copyFileSync(src, dest);
    });
    
    return screenshots.length > 0;
  }
  
  return false;
}

function backupFile(filePath) {
  const backupPath = `${filePath}.backup`;
  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(filePath, backupPath);
    log(`  Created backup: ${backupPath}`, 'yellow');
  }
}

function applyFix(iteration) {
  log(`🔨 Applying fix (Iteration ${iteration})...`, 'yellow');
  
  if (!fs.existsSync(NAV_FILE)) {
    log(`Error: ${NAV_FILE} not found`, 'red');
    return false;
  }
  
  // Backup original file
  backupFile(NAV_FILE);
  
  let content = fs.readFileSync(NAV_FILE, 'utf8');
  let modified = false;
  
  switch (iteration) {
    case 1:
      log('  Fix 1: Ensuring overflow-visible and proper sizing', 'yellow');
      // Already applied in main fix
      break;
      
    case 2:
      log('  Fix 2: Reducing stroke width for cleaner rendering', 'yellow');
      if (content.includes('strokeWidth={1.5}')) {
        content = content.replace(/strokeWidth=\{1\.5\}/g, 'strokeWidth={1.25}');
        modified = true;
      }
      break;
      
    case 3:
      log('  Fix 3: Increasing container size for more breathing room', 'yellow');
      if (content.includes('w-14 h-14')) {
        content = content.replace(/w-14 h-14/g, 'w-16 h-16');
        modified = true;
      }
      break;
      
    case 4:
      log('  Fix 4: Adjusting icon size to fit better', 'yellow');
      // Find the Practice button icon size
      const practiceIconRegex = /(item\.highlight.*?<Icon className="w-7 h-7")/s;
      if (practiceIconRegex.test(content)) {
        content = content.replace(/(<Icon className="w-7 h-7")/g, '<Icon className="w-6 h-6"');
        modified = true;
      }
      break;
      
    case 5:
      log('  Fix 5: Adding explicit padding for centering', 'yellow');
      const containerRegex = /(w-\d+ h-\d+ rounded-2xl flex items-center justify-center)/;
      if (containerRegex.test(content)) {
        content = content.replace(
          /(w-\d+ h-\d+ rounded-2xl flex items-center justify-center)/,
          '$1 p-2'
        );
        modified = true;
      }
      break;
  }
  
  if (modified) {
    fs.writeFileSync(NAV_FILE, content, 'utf8');
    log('  ✓ Fix applied successfully', 'green');
    return true;
  } else {
    log('  ⚠ No changes needed for this iteration', 'yellow');
    return false;
  }
}

function restoreBackup() {
  const backupPath = `${NAV_FILE}.backup`;
  if (fs.existsSync(backupPath)) {
    log('Restoring original file from backup...', 'yellow');
    fs.copyFileSync(backupPath, NAV_FILE);
    fs.unlinkSync(backupPath);
  }
}

function generateReport(iterations, success) {
  const reportPath = path.join(RESULTS_DIR, 'fix-report.md');
  
  let report = `# Bottom Navigation Icon Fix Report\n\n`;
  report += `**Date:** ${new Date().toISOString()}\n`;
  report += `**Status:** ${success ? '✅ SUCCESS' : '❌ FAILED'}\n`;
  report += `**Iterations:** ${iterations}\n\n`;
  
  report += `## Test Results\n\n`;
  
  for (let i = 1; i <= iterations; i++) {
    report += `### Iteration ${i}\n\n`;
    
    const iterationDir = path.join(RESULTS_DIR, 'iterations', `iteration-${i}`);
    if (fs.existsSync(iterationDir)) {
      const screenshots = fs.readdirSync(iterationDir).filter(f => f.endsWith('.png'));
      
      report += `Screenshots:\n`;
      screenshots.forEach(screenshot => {
        report += `- ![${screenshot}](iterations/iteration-${i}/${screenshot})\n`;
      });
      report += `\n`;
    }
  }
  
  report += `## Recommendations\n\n`;
  if (success) {
    report += `- ✅ Visual regression tests passed\n`;
    report += `- ✅ Icon is properly sized and not clipped\n`;
    report += `- ✅ Ready to commit changes\n`;
  } else {
    report += `- ⚠️ Manual intervention may be required\n`;
    report += `- 🔍 Review screenshots in test-results/iterations/\n`;
    report += `- 🔧 Consider adjusting icon size or container dimensions\n`;
  }
  
  fs.writeFileSync(reportPath, report, 'utf8');
  log(`\n📄 Report generated: ${reportPath}`, 'cyan');
}

async function main() {
  header('Bottom Navigation Icon Fix - Automated Testing');
  
  log('Configuration:', 'cyan');
  log(`  Max iterations: ${MAX_ITERATIONS}`, 'cyan');
  log(`  Test file: ${TEST_FILE}`, 'cyan');
  log(`  Component file: ${NAV_FILE}`, 'cyan');
  console.log('');
  
  let currentIteration = 0;
  let testPassed = false;
  
  // Ensure results directory exists
  if (!fs.existsSync(RESULTS_DIR)) {
    fs.mkdirSync(RESULTS_DIR, { recursive: true });
  }
  
  while (currentIteration < MAX_ITERATIONS && !testPassed) {
    currentIteration++;
    
    header(`ITERATION ${currentIteration} of ${MAX_ITERATIONS}`);
    
    // Run test
    testPassed = runTest();
    
    // Analyze results
    const hasScreenshots = analyzeResults(currentIteration);
    
    if (testPassed) {
      log('\n🎉 Test passed!', 'green');
      break;
    }
    
    // Apply fix if not last iteration
    if (currentIteration < MAX_ITERATIONS) {
      console.log('');
      applyFix(currentIteration);
      
      log('\n⏳ Waiting 2 seconds before next iteration...', 'yellow');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // Generate report
  generateReport(currentIteration, testPassed);
  
  // Final summary
  header('SUMMARY');
  
  if (testPassed) {
    log(`✅ SUCCESS! Test passed after ${currentIteration} iteration(s)`, 'green');
    log('\nNext steps:', 'cyan');
    log('  1. Review screenshots in test-results/iterations/', 'cyan');
    log('  2. Verify the fix visually in the browser', 'cyan');
    log('  3. Commit the changes if satisfied', 'cyan');
    process.exit(0);
  } else {
    log(`❌ FAILED: Test did not pass after ${MAX_ITERATIONS} iterations`, 'red');
    log('\nPlease review:', 'yellow');
    log('  1. Test results in test-results/', 'yellow');
    log('  2. Generated report: test-results/fix-report.md', 'yellow');
    log('  3. Consider manual intervention', 'yellow');
    
    // Ask if user wants to restore backup
    log('\n⚠️  Original file backup available at: ' + NAV_FILE + '.backup', 'yellow');
    
    process.exit(1);
  }
}

// Run the script
main().catch(error => {
  log(`\n❌ Error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
