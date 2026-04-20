/**
 * Auto-Formatter Tests
 * 
 * Tests for the auto-formatting functionality that applies format patterns
 * to answers and generates fix suggestions.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AutoFormatter } from './auto-formatter';
import type { FormatPattern, ValidationResult, ValidationViolation } from './types';

describe('AutoFormatter', () => {
  let formatter: AutoFormatter;
  let comparisonPattern: FormatPattern;
  let definitionPattern: FormatPattern;
  let listPattern: FormatPattern;
  let processPattern: FormatPattern;
  let codePattern: FormatPattern;
  let prosConsPattern: FormatPattern;

  beforeEach(() => {
    formatter = new AutoFormatter();

    comparisonPattern = {
      id: 'comparison',
      name: 'Comparison Table',
      keywords: ['vs', 'versus', 'compare', 'difference'],
      priority: 90,
      structure: {
        sections: [{
          name: 'Comparison Table',
          required: true,
          format: 'table',
          constraints: [
            { type: 'min-columns', value: 2 },
            { type: 'has-headers', value: true }
          ]
        }],
        rules: [],
        template: '| Feature | Option A | Option B |\n|---------|----------|----------|\n| Item 1  | Value A  | Value B  |',
        examples: []
      }
    };

    definitionPattern = {
      id: 'definition',
      name: 'Definition',
      keywords: ['what is', 'define', 'definition'],
      priority: 85,
      structure: {
        sections: [{
          name: 'Definition',
          required: true,
          format: 'text',
          constraints: [
            { type: 'single-sentence', value: true },
            { type: 'blank-line-after', value: true },
            { type: 'bulleted-list-required', value: true }
          ]
        }],
        rules: [],
        template: 'A [term] is [definition].\n\n- Key characteristic 1\n- Key characteristic 2\n- Key characteristic 3',
        examples: []
      }
    };

    listPattern = {
      id: 'list',
      name: 'List',
      keywords: ['list', 'items', 'points'],
      priority: 70,
      structure: {
        sections: [{
          name: 'List Items',
          required: true,
          format: 'list',
          constraints: [
            { type: 'max-sentences', value: 2 },
            { type: 'proper-bullet-syntax', value: true }
          ]
        }],
        rules: [],
        template: '- First item\n- Second item\n- Third item',
        examples: []
      }
    };

    processPattern = {
      id: 'process',
      name: 'Process Steps',
      keywords: ['how to', 'steps', 'process'],
      priority: 80,
      structure: {
        sections: [{
          name: 'Process Steps',
          required: true,
          format: 'process',
          constraints: [
            { type: 'action-verbs', value: true },
            { type: 'proper-sequence', value: true }
          ]
        }],
        rules: [],
        template: '1. First step\n2. Second step\n3. Third step',
        examples: []
      }
    };

    codePattern = {
      id: 'code',
      name: 'Code Example',
      keywords: ['code', 'example', 'implementation'],
      priority: 75,
      structure: {
        sections: [{
          name: 'Code Example',
          required: true,
          format: 'code',
          constraints: [
            { type: 'requires-language', value: true },
            { type: 'complete-blocks', value: true }
          ]
        }],
        rules: [],
        template: '```javascript\nconst example = "code";\n```',
        examples: []
      }
    };

    prosConsPattern = {
      id: 'pros-cons',
      name: 'Pros and Cons',
      keywords: ['pros', 'cons', 'advantages', 'disadvantages'],
      priority: 85,
      structure: {
        sections: [{
          name: 'Pros and Cons',
          required: true,
          format: 'pros-cons',
          constraints: [
            { type: 'required-sections', value: true },
            { type: 'bulleted-lists', value: true }
          ]
        }],
        rules: [],
        template: '## Advantages\n\n- Pro 1\n- Pro 2\n\n## Disadvantages\n\n- Con 1\n- Con 2',
        examples: []
      }
    };
  });

  describe('format', () => {
    it('should format comparison answers', () => {
      const answer = 'React is fast and flexible. Vue is simple and lightweight.';
      const result = formatter.format(answer, comparisonPattern);
      
      // Should attempt to format as comparison (basic implementation)
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should format definition answers', () => {
      const answer = 'A microservice is a small, independent service. It has loose coupling. It focuses on single responsibility. It can be deployed independently.';
      const result = formatter.format(answer, definitionPattern);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should format list answers', () => {
      const answer = 'First point about the topic. Second important consideration. Third key aspect to remember.';
      const result = formatter.format(answer, listPattern);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should format process answers', () => {
      const answer = 'Install the dependencies. Configure the settings. Run the application.';
      const result = formatter.format(answer, processPattern);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should format code answers', () => {
      const answer = 'Here is an example: ```\nconst x = 1;\n```';
      const result = formatter.format(answer, codePattern);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      // Should add language identifier
      expect(result).toContain('```javascript');
    });

    it('should format pros/cons answers', () => {
      const answer = 'Good things: fast, reliable. Bad things: complex, expensive.';
      const result = formatter.format(answer, prosConsPattern);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should return original answer for unknown patterns', () => {
      const unknownPattern = { ...comparisonPattern, id: 'unknown' };
      const answer = 'Some content';
      const result = formatter.format(answer, unknownPattern);
      
      expect(result).toBe(answer);
    });
  });

  describe('suggestFixes', () => {
    it('should generate fix suggestions for validation violations', () => {
      const validationResult: ValidationResult = {
        isValid: false,
        score: 60,
        violations: [
          {
            rule: 'comparison-table-required',
            severity: 'error',
            message: 'Comparison section requires a markdown table',
            fix: 'Add a markdown table with proper headers and data rows'
          },
          {
            rule: 'comparison-table-headers',
            severity: 'error',
            message: 'Table is missing header separator row',
            fix: 'Add a header separator row like |---|---|---|'
          }
        ],
        suggestions: []
      };

      const suggestions = formatter.suggestFixes(validationResult);
      
      expect(suggestions).toBeDefined();
      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);
      
      // Check suggestion structure
      const firstSuggestion = suggestions[0];
      expect(firstSuggestion).toHaveProperty('violation');
      expect(firstSuggestion).toHaveProperty('fixes');
      expect(firstSuggestion).toHaveProperty('priority');
      expect(firstSuggestion).toHaveProperty('description');
      
      // Error violations should have higher priority
      expect(firstSuggestion.priority).toBe(100);
    });

    it('should prioritize error fixes over warning fixes', () => {
      const validationResult: ValidationResult = {
        isValid: false,
        score: 70,
        violations: [
          {
            rule: 'some-warning',
            severity: 'warning',
            message: 'Warning message',
            fix: 'Fix warning'
          },
          {
            rule: 'some-error',
            severity: 'error',
            message: 'Error message',
            fix: 'Fix error'
          },
          {
            rule: 'some-info',
            severity: 'info',
            message: 'Info message',
            fix: 'Fix info'
          }
        ],
        suggestions: []
      };

      const suggestions = formatter.suggestFixes(validationResult);
      
      expect(suggestions.length).toBe(3);
      expect(suggestions[0].priority).toBe(100); // Error
      expect(suggestions[1].priority).toBe(50);  // Warning
      expect(suggestions[2].priority).toBe(25);  // Info
    });

    it('should return empty array for valid results', () => {
      const validationResult: ValidationResult = {
        isValid: true,
        score: 100,
        violations: [],
        suggestions: []
      };

      const suggestions = formatter.suggestFixes(validationResult);
      
      expect(suggestions).toEqual([]);
    });
  });

  describe('applyFix', () => {
    it('should apply replace-type fixes', () => {
      const answer = 'Here is code: ```\nconst x = 1;\n```';
      const fix = {
        id: 'fix-code-language',
        type: 'replace' as const,
        description: 'Add language identifier',
        target: '```',
        replacement: '```javascript'
      };

      const result = formatter.applyFix(answer, fix);
      
      expect(result).toContain('```javascript');
    });

    it('should apply insert-type fixes at end', () => {
      const answer = 'Some content';
      const fix = {
        id: 'fix-add-diagram',
        type: 'insert' as const,
        description: 'Add diagram',
        target: 'end',
        replacement: '```mermaid\ngraph TD\n    A --> B\n```'
      };

      const result = formatter.applyFix(answer, fix);
      
      expect(result).toContain('Some content');
      expect(result).toContain('```mermaid');
    });

    it('should apply insert-type fixes after first line', () => {
      const answer = 'First line\nSecond line';
      const fix = {
        id: 'fix-blank-line',
        type: 'insert' as const,
        description: 'Add blank line',
        target: 'after-first-line',
        replacement: ''
      };

      const result = formatter.applyFix(answer, fix);
      
      const lines = result.split('\n');
      expect(lines.length).toBe(3);
      expect(lines[0]).toBe('First line');
      expect(lines[1]).toBe('');
      expect(lines[2]).toBe('Second line');
    });

    it('should apply insert-type fixes after first table row', () => {
      const answer = '| Col1 | Col2 |\n| Data | Data |';
      const fix = {
        id: 'fix-table-header',
        type: 'insert' as const,
        description: 'Add header separator',
        target: 'after-first-table-row',
        replacement: '|------|------|'
      };

      const result = formatter.applyFix(answer, fix);
      
      expect(result).toContain('| Col1 | Col2 |');
      expect(result).toContain('|------|------|');
      expect(result).toContain('| Data | Data |');
    });

    it('should apply remove-type fixes', () => {
      const answer = 'Keep this. Remove this part. Keep this too.';
      const fix = {
        id: 'fix-remove',
        type: 'remove' as const,
        description: 'Remove unwanted text',
        target: 'Remove this part\\. '
      };

      const result = formatter.applyFix(answer, fix);
      
      expect(result).toBe('Keep this. Keep this too.');
    });

    it('should apply reformat-type fixes', () => {
      const answer = 'Original content';
      const fix = {
        id: 'fix-reformat',
        type: 'reformat' as const,
        description: 'Reformat content',
        target: 'content',
        replacement: 'Reformatted content'
      };

      const result = formatter.applyFix(answer, fix);
      
      expect(result).toBe('Reformatted content');
    });

    it('should return original answer for unknown fix types', () => {
      const answer = 'Original content';
      const fix = {
        id: 'fix-unknown',
        type: 'unknown' as any,
        description: 'Unknown fix',
        target: 'something'
      };

      const result = formatter.applyFix(answer, fix);
      
      expect(result).toBe(answer);
    });
  });

  describe('helper methods', () => {
    it('should fix bullet syntax', () => {
      const answer = '• First point\n· Second point\n‣ Third point';
      const result = formatter.format(answer, listPattern);
      
      // The fixBulletSyntax method should be called internally
      expect(result).toBeDefined();
    });

    it('should fix numbering syntax', () => {
      const answer = '1. First step\n3. Second step\n5. Third step';
      const result = formatter.format(answer, processPattern);
      
      // The fixNumberingSyntax method should be called internally
      expect(result).toBeDefined();
    });

    it('should add language identifiers to code blocks', () => {
      const answer = 'Example:\n```\nconst x = 1;\n```';
      const result = formatter.format(answer, codePattern);
      
      expect(result).toContain('```javascript');
    });
  });

  describe('template generation', () => {
    it('should generate table template', () => {
      const validationResult: ValidationResult = {
        isValid: false,
        score: 50,
        violations: [{
          rule: 'comparison-table-required',
          severity: 'error',
          message: 'Table required',
          fix: 'Add table'
        }],
        suggestions: []
      };

      const suggestions = formatter.suggestFixes(validationResult);
      const tableFix = suggestions.find(s => s.fixes.some(f => f.type === 'reformat'));
      
      expect(tableFix).toBeDefined();
      if (tableFix) {
        const reformatFix = tableFix.fixes.find(f => f.type === 'reformat');
        expect(reformatFix?.replacement).toContain('|');
        expect(reformatFix?.replacement).toContain('Feature');
      }
    });

    it('should generate list template', () => {
      const validationResult: ValidationResult = {
        isValid: false,
        score: 50,
        violations: [{
          rule: 'list-required',
          severity: 'error',
          message: 'List required',
          fix: 'Add list'
        }],
        suggestions: []
      };

      const suggestions = formatter.suggestFixes(validationResult);
      const listFix = suggestions.find(s => s.fixes.some(f => f.type === 'reformat'));
      
      expect(listFix).toBeDefined();
      if (listFix) {
        const reformatFix = listFix.fixes.find(f => f.type === 'reformat');
        expect(reformatFix?.replacement).toContain('- ');
      }
    });

    it('should generate pros/cons template', () => {
      const validationResult: ValidationResult = {
        isValid: false,
        score: 50,
        violations: [{
          rule: 'pros-cons-required',
          severity: 'error',
          message: 'Pros/cons required',
          fix: 'Add pros/cons'
        }],
        suggestions: []
      };

      const suggestions = formatter.suggestFixes(validationResult);
      const prosConsFix = suggestions.find(s => s.fixes.some(f => f.type === 'reformat'));
      
      expect(prosConsFix).toBeDefined();
      if (prosConsFix) {
        const reformatFix = prosConsFix.fixes.find(f => f.type === 'reformat');
        expect(reformatFix?.replacement).toContain('## Advantages');
        expect(reformatFix?.replacement).toContain('## Disadvantages');
      }
    });

    it('should generate diagram template', () => {
      const validationResult: ValidationResult = {
        isValid: false,
        score: 50,
        violations: [{
          rule: 'diagram-required',
          severity: 'error',
          message: 'Diagram required',
          fix: 'Add diagram'
        }],
        suggestions: []
      };

      const suggestions = formatter.suggestFixes(validationResult);
      const diagramFix = suggestions.find(s => s.fixes.some(f => f.type === 'insert'));
      
      expect(diagramFix).toBeDefined();
      if (diagramFix) {
        const insertFix = diagramFix.fixes.find(f => f.type === 'insert');
        expect(insertFix?.replacement).toContain('```mermaid');
        expect(insertFix?.replacement).toContain('graph TD');
      }
    });

    it('should generate troubleshooting template', () => {
      const validationResult: ValidationResult = {
        isValid: false,
        score: 50,
        violations: [{
          rule: 'troubleshooting-required',
          severity: 'error',
          message: 'Troubleshooting structure required',
          fix: 'Add troubleshooting sections'
        }],
        suggestions: []
      };

      const suggestions = formatter.suggestFixes(validationResult);
      const troubleshootingFix = suggestions.find(s => s.fixes.some(f => f.type === 'reformat'));
      
      expect(troubleshootingFix).toBeDefined();
      if (troubleshootingFix) {
        const reformatFix = troubleshootingFix.fixes.find(f => f.type === 'reformat');
        expect(reformatFix?.replacement).toContain('## Problem');
        expect(reformatFix?.replacement).toContain('## Causes');
        expect(reformatFix?.replacement).toContain('## Solutions');
      }
    });
  });
});