/**
 * Demonstration of Enhanced Validation Feedback Generation
 * 
 * This file demonstrates the enhanced validation feedback system
 * that provides specific error messages, line numbers, and actionable fixes.
 */

import { FormatValidator } from './format-validator';
import { PatternLibrary } from './pattern-library';
import patternsData from './patterns.json';
import type { FormatPattern } from './types';

// Initialize the system
const validator = new FormatValidator();
const patternLibrary = new PatternLibrary();
patternLibrary.initializePatterns(patternsData.patterns as FormatPattern[]);

// Get patterns for demonstration
const comparisonPattern = patternLibrary.getPattern('comparison-table')!;
const processPattern = patternLibrary.getPattern('process')!;
const codePattern = patternLibrary.getPattern('code-example')!;

/**
 * Demonstrates enhanced validation feedback for different types of violations
 */
export function demonstrateEnhancedFeedback() {
  console.log('=== Enhanced Validation Feedback Demonstration ===\n');

  // Example 1: Table validation with enhanced feedback
  console.log('1. Table Validation with Enhanced Feedback:');
  const tableAnswer = 'This is a comparison question but has no table.';
  const tableResult = validator.validate(tableAnswer, comparisonPattern);
  
  if (tableResult.violations.length > 0) {
    const violation = tableResult.violations[0];
    console.log(`   Message: ${violation.message}`);
    console.log(`   Severity: ${violation.severity}`);
    console.log(`   Fix: ${violation.fix?.substring(0, 100)}...`);
    console.log(`   Location: ${violation.location ? `Line ${violation.location.line}, Column ${violation.location.column}` : 'Not specified'}`);
  }
  console.log('');

  // Example 2: Process validation with enhanced feedback
  console.log('2. Process Validation with Enhanced Feedback:');
  const processAnswer = `
1. The system should be configured properly
2. You need to run the application
3. Check if everything works
  `.trim();
  
  const processResult = validator.validate(processAnswer, processPattern);
  
  if (processResult.violations.length > 0) {
    const violation = processResult.violations[0];
    console.log(`   Message: ${violation.message}`);
    console.log(`   Severity: ${violation.severity}`);
    console.log(`   Fix: ${violation.fix?.substring(0, 100)}...`);
    console.log(`   Location: ${violation.location ? `Line ${violation.location.line}, Column ${violation.location.column}` : 'Not specified'}`);
  }
  console.log('');

  // Example 3: Code validation with enhanced feedback
  console.log('3. Code Validation with Enhanced Feedback:');
  const codeAnswer = `
Here is some code:

\`\`\`
const example = "no language specified";
console.log(example);
\`\`\`
  `.trim();
  
  const codeResult = validator.validate(codeAnswer, codePattern);
  
  if (codeResult.violations.length > 0) {
    const violation = codeResult.violations[0];
    console.log(`   Message: ${violation.message}`);
    console.log(`   Severity: ${violation.severity}`);
    console.log(`   Fix: ${violation.fix?.substring(0, 100)}...`);
    console.log(`   Location: ${violation.location ? `Line ${violation.location.line}, Column ${violation.location.column}` : 'Not specified'}`);
  }
  console.log('');

  // Example 4: Multiple violations with different severities
  console.log('4. Multiple Violations with Different Severities:');
  const complexAnswer = `
This is a comparison question.

\`\`\`unknownlang
const code = "example";
\`\`\`

Some more text here.
  `.trim();
  
  const complexResult = validator.validate(complexAnswer, comparisonPattern);
  
  console.log(`   Total violations: ${complexResult.violations.length}`);
  console.log(`   Validation score: ${complexResult.score}/100`);
  
  complexResult.violations.forEach((violation, index) => {
    console.log(`   
   Violation ${index + 1}:
     Message: ${violation.message}
     Severity: ${violation.severity}
     Rule: ${violation.rule}
     Location: ${violation.location ? `Line ${violation.location.line}, Column ${violation.location.column}` : 'Not specified'}
     Fix: ${violation.fix?.substring(0, 80)}...
    `);
  });

  console.log('\n=== Key Features Demonstrated ===');
  console.log('✅ Specific error messages with severity indicators (❌, ⚠️, ℹ️)');
  console.log('✅ Line and column location information');
  console.log('✅ Actionable fix suggestions with examples');
  console.log('✅ Priority indicators based on severity (🔴, 🟡, 🔵)');
  console.log('✅ Context-aware feedback for different rule types');
  console.log('✅ Comprehensive validation scoring');
}

// Export for use in other modules
export { validator, patternLibrary };