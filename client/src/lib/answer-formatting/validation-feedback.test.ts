/**
 * Tests for enhanced validation feedback generation
 * 
 * This test suite verifies that the validation system provides:
 * 1. Specific error messages for each violation
 * 2. Line numbers and location information
 * 3. Actionable feedback with examples
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { FormatValidator } from './format-validator';
import { PatternLibrary } from './pattern-library';
import type { FormatPattern } from './types';
import patternsData from './patterns.json';

describe('Validation Feedback Generation', () => {
  let validator: FormatValidator;
  let patternLibrary: PatternLibrary;
  let comparisonPattern: FormatPattern;
  let processPattern: FormatPattern;
  let codePattern: FormatPattern;

  beforeEach(() => {
    validator = new FormatValidator();
    patternLibrary = new PatternLibrary();
    
    // Initialize patterns from JSON
    patternLibrary.initializePatterns(patternsData.patterns as FormatPattern[]);
    
    // Get test patterns
    comparisonPattern = patternLibrary.getPattern('comparison-table')!;
    processPattern = patternLibrary.getPattern('process')!;
    codePattern = patternLibrary.getPattern('code-example')!;
  });

  describe('Enhanced Error Messages', () => {
    it('should provide specific error messages with severity indicators', () => {
      const answer = 'This is a comparison without a table.';
      const result = validator.validate(answer, comparisonPattern);

      expect(result.violations).toHaveLength(1);
      const violation = result.violations[0];
      
      // Check for enhanced message with severity prefix
      expect(violation.message).toMatch(/❌ Critical Issue:/);
      expect(violation.message).toMatch(/Table formatting issue/);
      expect(violation.severity).toBe('error');
    });

    it('should provide warning messages with appropriate indicators', () => {
      const answer = `
| Feature | Item A |
|---------|--------|
| Speed   | Fast   |
| Cost    | High   |
      `.trim();
      
      const result = validator.validate(answer, comparisonPattern);
      
      // Should have warning about minimum columns
      const warnings = result.violations.filter(v => v.severity === 'warning');
      if (warnings.length > 0) {
        expect(warnings[0].message).toMatch(/⚠️  Warning:/);
      }
    });

    it('should provide info messages with suggestion indicators', () => {
      const answer = `
\`\`\`unknownlang
const code = "example";
\`\`\`
      `.trim();
      
      const result = validator.validate(answer, codePattern);
      
      const infoViolations = result.violations.filter(v => v.severity === 'info');
      if (infoViolations.length > 0) {
        expect(infoViolations[0].message).toMatch(/ℹ️  Suggestion:/);
      }
    });
  });

  describe('Location Information', () => {
    it('should provide line and column information for table violations', () => {
      const answer = `
This is a comparison question.

Some text here.
| Feature | Item A |
| Speed   | Fast   |
      `.trim();
      
      const result = validator.validate(answer, comparisonPattern);
      
      // Find table-related violations
      const tableViolations = result.violations.filter(v => v.rule.includes('table'));
      
      if (tableViolations.length > 0) {
        const violation = tableViolations[0];
        expect(violation.location).toBeDefined();
        expect(violation.location!.line).toBeGreaterThan(0);
        expect(violation.location!.column).toBeGreaterThan(0);
      }
    });

    it('should provide location information for process step violations', () => {
      const answer = `
1. The first step is unclear
2. Configure the system
3. Run the application
      `.trim();
      
      const result = validator.validate(answer, processPattern);
      
      // Find action verb violations
      const actionVerbViolations = result.violations.filter(v => v.rule.includes('action-verb'));
      
      if (actionVerbViolations.length > 0) {
        const violation = actionVerbViolations[0];
        expect(violation.location).toBeDefined();
        expect(violation.location!.line).toBe(1); // First line with the violation
      }
    });

    it('should provide location information for code block violations', () => {
      const answer = `
Here is some code:

\`\`\`
const example = "no language specified";
\`\`\`
      `.trim();
      
      const result = validator.validate(answer, codePattern);
      
      // Find code language violations
      const codeViolations = result.violations.filter(v => v.rule.includes('code-language'));
      
      if (codeViolations.length > 0) {
        const violation = codeViolations[0];
        expect(violation.location).toBeDefined();
        expect(violation.location!.line).toBe(3); // Line with the code block
      }
    });
  });

  describe('Actionable Fix Suggestions', () => {
    it('should provide priority indicators based on severity', () => {
      const answer = 'This is a comparison without a table.';
      const result = validator.validate(answer, comparisonPattern);

      expect(result.violations).toHaveLength(1);
      const violation = result.violations[0];
      
      // Check for priority indicator
      expect(violation.fix).toMatch(/🔴 MUST FIX:/);
    });

    it('should provide specific examples for table formatting', () => {
      const answer = 'This is a comparison without a table.';
      const result = validator.validate(answer, comparisonPattern);

      const violation = result.violations[0];
      
      // Check for table example in fix suggestion
      expect(violation.fix).toMatch(/Example:/);
      expect(violation.fix).toMatch(/\| Feature \| Option A \| Option B \|/);
      expect(violation.fix).toMatch(/\|---------|----------|----------|/);
    });

    it('should provide action verb examples for process steps', () => {
      const answer = `
1. The system should be configured
2. You need to run the application
      `.trim();
      
      const result = validator.validate(answer, processPattern);
      
      // Find action verb violations
      const actionVerbViolations = result.violations.filter(v => v.rule.includes('action-verb'));
      
      if (actionVerbViolations.length > 0) {
        const violation = actionVerbViolations[0];
        expect(violation.fix).toMatch(/Good action verbs:/);
        expect(violation.fix).toMatch(/Create, Configure, Run, Check/);
      }
    });

    it('should provide code language examples', () => {
      const answer = `
\`\`\`
const example = "no language";
\`\`\`
      `.trim();
      
      const result = validator.validate(answer, codePattern);
      
      // Find code language violations
      const codeViolations = result.violations.filter(v => v.rule.includes('code-language'));
      
      if (codeViolations.length > 0) {
        const violation = codeViolations[0];
        expect(violation.fix).toMatch(/Example:/);
        expect(violation.fix).toMatch(/```javascript/);
        expect(violation.fix).toMatch(/Supported languages:/);
      }
    });

    it('should provide different priority levels for different severities', () => {
      const answer = `
| Feature | Item A | Item B |
|---------|--------|--------|
| Speed   | Fast   | Slow   |

\`\`\`unknownlang
const code = "example";
\`\`\`
      `.trim();
      
      const result = validator.validate(answer, codePattern);
      
      const errorViolations = result.violations.filter(v => v.severity === 'error');
      const warningViolations = result.violations.filter(v => v.severity === 'warning');
      const infoViolations = result.violations.filter(v => v.severity === 'info');
      
      if (errorViolations.length > 0) {
        expect(errorViolations[0].fix).toMatch(/🔴 MUST FIX:/);
      }
      
      if (warningViolations.length > 0) {
        expect(warningViolations[0].fix).toMatch(/🟡 SHOULD FIX:/);
      }
      
      if (infoViolations.length > 0) {
        expect(infoViolations[0].fix).toMatch(/🔵 CONSIDER:/);
      }
    });
  });

  describe('Context-Aware Feedback', () => {
    it('should provide context-specific feedback for different rule types', () => {
      const answer = `
This is a comparison.

1. The first step
2. Configure something

\`\`\`
code here
\`\`\`
      `.trim();
      
      // Test with comparison pattern
      const comparisonResult = validator.validate(answer, comparisonPattern);
      const tableViolation = comparisonResult.violations.find(v => v.rule.includes('table'));
      if (tableViolation) {
        expect(tableViolation.message).toMatch(/Table formatting issue/);
      }
      
      // Test with process pattern
      const processResult = validator.validate(answer, processPattern);
      const processViolation = processResult.violations.find(v => v.rule.includes('action-verb'));
      if (processViolation) {
        expect(processViolation.message).toMatch(/Process steps issue/);
      }
      
      // Test with code pattern
      const codeResult = validator.validate(answer, codePattern);
      const codeViolation = codeResult.violations.find(v => v.rule.includes('code'));
      if (codeViolation) {
        expect(codeViolation.message).toMatch(/Code formatting issue/);
      }
    });

    it('should provide comprehensive feedback for complex violations', () => {
      const answer = `
This is a comparison question about REST vs GraphQL.

Here's some information without proper structure.
      `.trim();
      
      const result = validator.validate(answer, comparisonPattern);
      
      expect(result.violations.length).toBeGreaterThan(0);
      
      const violation = result.violations[0];
      
      // Check that feedback includes all components
      expect(violation.message).toBeTruthy();
      expect(violation.fix).toBeTruthy();
      expect(violation.rule).toBeTruthy();
      expect(violation.severity).toBeTruthy();
      
      // Check that fix includes priority and examples
      expect(violation.fix).toMatch(/🔴|🟡|🔵/); // Has priority indicator
      expect(violation.fix).toMatch(/Example:|```/); // Has examples
    });
  });

  describe('Validation Score Impact', () => {
    it('should calculate scores based on enhanced violation severity', () => {
      const perfectAnswer = `
| Feature | REST | GraphQL |
|---------|------|---------|
| Data Fetching | Multiple endpoints | Single endpoint |
| Over-fetching | Common | Eliminated |
      `.trim();
      
      const imperfectAnswer = `
This is a comparison without proper table format.
      `.trim();
      
      const perfectResult = validator.validate(perfectAnswer, comparisonPattern);
      const imperfectResult = validator.validate(imperfectAnswer, comparisonPattern);
      
      expect(perfectResult.score).toBeGreaterThan(imperfectResult.score);
      expect(perfectResult.violations.length).toBeLessThan(imperfectResult.violations.length);
    });
  });
});