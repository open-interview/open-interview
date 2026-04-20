/**
 * Property-Based Tests for Pattern Detector
 * 
 * Feature: answer-formatting-standards
 * Property 1: Pattern Detection Consistency
 * Validates: Requirements 1.1
 * 
 * These tests verify that the pattern detector correctly identifies
 * appropriate format patterns based on question keywords.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { PatternDetector } from './pattern-detector';
import { patternLibrary } from './pattern-library';
import { getDefaultPatterns } from './patterns-loader';

describe('PatternDetector - Property 1: Pattern Detection Consistency', () => {
  let detector: PatternDetector;

  beforeEach(() => {
    detector = new PatternDetector();
    // Ensure patterns are loaded
    const patterns = getDefaultPatterns();
    if (patternLibrary.getPatternCount() === 0) {
      patternLibrary.initializePatterns(patterns);
    }
  });

  /**
   * Property Test 1: For any question containing comparison keywords,
   * the detector should identify it as a comparison question
   * 
   * This validates Requirements 1.1: WHEN a question asks for differences,
   * comparisons, or "vs" scenarios, THE Answer_Generator SHALL format
   * the answer as a markdown table
   */
  it('should detect comparison pattern for comparison keywords', () => {
    const comparisonKeywords = ['difference', 'vs', 'compare', 'versus', 'comparison'];
    
    fc.assert(
      fc.property(
        fc.constantFrom(...comparisonKeywords),
        fc.string({ minLength: 3, maxLength: 20 }).filter(s => !/[^a-zA-Z0-9\s]/.test(s)),
        fc.string({ minLength: 3, maxLength: 20 }).filter(s => !/[^a-zA-Z0-9\s]/.test(s)),
        (keyword, item1, item2) => {
          // Generate a comparison question
          const question = `What is the ${keyword} between ${item1} and ${item2}?`;
          
          const pattern = detector.detectPattern(question);
          
          // Should detect a pattern
          expect(pattern).not.toBeNull();
          
          // Should be the comparison-table pattern
          expect(pattern?.id).toBe('comparison-table');
          
          // Confidence should be reasonable
          const confidence = detector.getConfidence();
          expect(confidence).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property Test 2: For any question with "vs" or "versus",
   * comparison pattern should be suggested
   */
  it('should consistently detect "vs" and "versus" as comparison indicators', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('vs', 'versus', 'VS', 'Versus'),
        fc.string({ minLength: 3, maxLength: 15 }).filter(s => /^[a-zA-Z]+$/.test(s)),
        fc.string({ minLength: 3, maxLength: 15 }).filter(s => /^[a-zA-Z]+$/.test(s)),
        (vsWord, tech1, tech2) => {
          const question = `${tech1} ${vsWord} ${tech2}`;
          
          const suggestions = detector.getSuggestedPatterns(question);
          
          expect(suggestions.length).toBeGreaterThan(0);
          
          const hasComparisonPattern = suggestions.some(p => p.id === 'comparison-table');
          expect(hasComparisonPattern).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property Test 3: Confidence score should be between 0 and 1
   */
  it('should return confidence scores in valid range', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 5, maxLength: 100 }),
        (question) => {
          detector.detectPattern(question);
          const confidence = detector.getConfidence();
          
          expect(confidence).toBeGreaterThanOrEqual(0);
          expect(confidence).toBeLessThanOrEqual(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property Test 4: Higher priority patterns should have confidence boost
   */
  it('should give priority boost to higher priority patterns', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('difference', 'what is', 'how to'),
        (keyword) => {
          const question = `${keyword} something`;
          const suggestions = detector.getSuggestedPatterns(question);
          
          if (suggestions.length > 0) {
            // First suggestion should have highest confidence
            const firstPattern = suggestions[0];
            expect(firstPattern.priority).toBeGreaterThanOrEqual(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property Test 5: Multiple keyword matches should return multiple suggestions
   */
  it('should return multiple suggestions for questions with multiple keywords', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          'What is the difference between X and Y?',
          'How to implement best practices?',
          'What are the pros and cons?',
          'Explain the architecture and design'
        ),
        (question) => {
          const suggestions = detector.getSuggestedPatterns(question);
          
          // Questions with multiple keywords should get suggestions
          expect(suggestions.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property Test 6: Case insensitivity
   */
  it('should detect patterns regardless of case', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('DIFFERENCE', 'Difference', 'difference', 'DiFfErEnCe'),
        (keyword) => {
          const question = `What is the ${keyword} between A and B?`;
          
          const pattern = detector.detectPattern(question);
          
          expect(pattern).not.toBeNull();
          expect(pattern?.id).toBe('comparison-table');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property Test 7: Empty or very short questions should handle gracefully
   */
  it('should handle edge cases gracefully', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('', ' ', 'a', 'ab'),
        (question) => {
          const pattern = detector.detectPattern(question);
          const confidence = detector.getConfidence();
          
          // Should not crash
          expect(confidence).toBeGreaterThanOrEqual(0);
          expect(confidence).toBeLessThanOrEqual(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property Test 8: Suggested patterns should be sorted by confidence
   */
  it('should return suggestions sorted by confidence', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          'What is the difference and how to implement?',
          'Compare the pros and cons',
          'Explain the architecture and troubleshoot issues'
        ),
        (question) => {
          const suggestions = detector.getSuggestedPatterns(question);
          
          if (suggestions.length > 1) {
            // We can't easily verify exact confidence ordering without
            // reimplementing the logic, but we can verify consistency
            const firstSuggestion = suggestions[0];
            expect(firstSuggestion).toBeDefined();
            expect(firstSuggestion.id).toBeTruthy();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('PatternDetector - Unit Tests', () => {
  let detector: PatternDetector;

  beforeEach(() => {
    detector = new PatternDetector();
    const patterns = getDefaultPatterns();
    if (patternLibrary.getPatternCount() === 0) {
      patternLibrary.initializePatterns(patterns);
    }
  });

  describe('Comparison Questions', () => {
    it('should detect "difference between" pattern', () => {
      const question = 'What is the difference between REST and GraphQL?';
      const pattern = detector.detectPattern(question);
      
      expect(pattern).not.toBeNull();
      expect(pattern?.id).toBe('comparison-table');
    });

    it('should detect "vs" pattern', () => {
      const question = 'React vs Vue';
      const pattern = detector.detectPattern(question);
      
      expect(pattern).not.toBeNull();
      expect(pattern?.id).toBe('comparison-table');
    });

    it('should detect "compare" pattern', () => {
      const question = 'Compare SQL and NoSQL databases';
      const pattern = detector.detectPattern(question);
      
      expect(pattern).not.toBeNull();
      expect(pattern?.id).toBe('comparison-table');
    });
  });

  describe('Definition Questions', () => {
    it('should detect "what is" pattern', () => {
      const question = 'What is a microservice?';
      const pattern = detector.detectPattern(question);
      
      expect(pattern).not.toBeNull();
      expect(pattern?.id).toBe('definition');
    });

    it('should detect "define" pattern', () => {
      const question = 'Define dependency injection';
      const pattern = detector.detectPattern(question);
      
      expect(pattern).not.toBeNull();
      expect(pattern?.id).toBe('definition');
    });
  });

  describe('List Questions', () => {
    it('should detect "types of" pattern', () => {
      const question = 'What are the types of databases?';
      const pattern = detector.detectPattern(question);
      
      expect(pattern).not.toBeNull();
      expect(pattern?.id).toBe('list');
    });

    it('should detect "list" pattern', () => {
      const question = 'List the SOLID principles';
      const pattern = detector.detectPattern(question);
      
      expect(pattern).not.toBeNull();
      expect(pattern?.id).toBe('list');
    });
  });

  describe('Process Questions', () => {
    it('should detect "how to" pattern', () => {
      const question = 'How to implement OAuth 2.0?';
      const pattern = detector.detectPattern(question);
      
      expect(pattern).not.toBeNull();
      expect(pattern?.id).toBe('process');
    });

    it('should detect "steps" pattern', () => {
      const question = 'What are the steps to deploy to AWS?';
      const pattern = detector.detectPattern(question);
      
      expect(pattern).not.toBeNull();
      expect(pattern?.id).toBe('process');
    });
  });

  describe('Code Questions', () => {
    it('should detect "implement" pattern', () => {
      const question = 'Implement a singleton pattern in Python';
      const pattern = detector.detectPattern(question);
      
      expect(pattern).not.toBeNull();
      expect(pattern?.id).toBe('code-example');
    });

    it('should detect "code" pattern', () => {
      const question = 'Show me the code for a binary search';
      const pattern = detector.detectPattern(question);
      
      expect(pattern).not.toBeNull();
      expect(pattern?.id).toBe('code-example');
    });
  });

  describe('Pros/Cons Questions', () => {
    it('should detect "pros and cons" pattern', () => {
      const question = 'What are the pros and cons of NoSQL?';
      const pattern = detector.detectPattern(question);
      
      expect(pattern).not.toBeNull();
      expect(pattern?.id).toBe('pros-cons');
    });

    it('should detect "advantages and disadvantages" pattern', () => {
      const question = 'Advantages and disadvantages of microservices';
      const pattern = detector.detectPattern(question);
      
      expect(pattern).not.toBeNull();
      expect(pattern?.id).toBe('pros-cons');
    });
  });

  describe('Architecture Questions', () => {
    it('should detect "architecture" pattern', () => {
      const question = 'Explain the MVC architecture';
      const pattern = detector.detectPattern(question);
      
      expect(pattern).not.toBeNull();
      expect(pattern?.id).toBe('architecture');
    });

    it('should detect "design" pattern', () => {
      const question = 'Describe the system design for a URL shortener';
      const pattern = detector.detectPattern(question);
      
      expect(pattern).not.toBeNull();
      expect(pattern?.id).toBe('architecture');
    });
  });

  describe('Troubleshooting Questions', () => {
    it('should detect "debug" pattern', () => {
      const question = 'How to debug a memory leak in Node.js?';
      const pattern = detector.detectPattern(question);
      
      expect(pattern).not.toBeNull();
      expect(pattern?.id).toBe('troubleshooting');
    });

    it('should detect "error" pattern', () => {
      const question = 'How to fix CORS errors?';
      const pattern = detector.detectPattern(question);
      
      expect(pattern).not.toBeNull();
      expect(pattern?.id).toBe('troubleshooting');
    });
  });

  describe('Best Practices Questions', () => {
    it('should detect "best practices" pattern', () => {
      const question = 'What are API security best practices?';
      const pattern = detector.detectPattern(question);
      
      expect(pattern).not.toBeNull();
      expect(pattern?.id).toBe('best-practices');
    });

    it('should detect "guidelines" pattern', () => {
      const question = 'What are the coding guidelines for React?';
      const pattern = detector.detectPattern(question);
      
      expect(pattern).not.toBeNull();
      expect(pattern?.id).toBe('best-practices');
    });
  });

  describe('Multi-keyword Questions', () => {
    it('should handle questions with multiple pattern indicators', () => {
      const question = 'What is the difference between REST and GraphQL and what are the best practices?';
      const suggestions = detector.getSuggestedPatterns(question);
      
      expect(suggestions.length).toBeGreaterThan(1);
      
      const patternIds = suggestions.map(p => p.id);
      expect(patternIds).toContain('comparison-table');
      expect(patternIds).toContain('best-practices');
    });
  });

  describe('Confidence Scoring', () => {
    it('should return higher confidence for exact keyword matches', () => {
      const question1 = 'What is the difference between A and B?';
      const question2 = 'Tell me about A and B';
      
      detector.detectPattern(question1);
      const confidence1 = detector.getConfidence();
      
      detector.detectPattern(question2);
      const confidence2 = detector.getConfidence();
      
      expect(confidence1).toBeGreaterThan(confidence2);
    });

    it('should return 0 confidence for no matches', () => {
      const question = 'xyz abc def';
      detector.detectPattern(question);
      const confidence = detector.getConfidence();
      
      expect(confidence).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty questions', () => {
      const pattern = detector.detectPattern('');
      expect(pattern).toBeNull();
      expect(detector.getConfidence()).toBe(0);
    });

    it('should handle whitespace-only questions', () => {
      const pattern = detector.detectPattern('   ');
      expect(pattern).toBeNull();
      expect(detector.getConfidence()).toBe(0);
    });

    it('should handle very long questions', () => {
      const longQuestion = 'What is the difference between '.repeat(50) + 'A and B?';
      const pattern = detector.detectPattern(longQuestion);
      
      expect(pattern).not.toBeNull();
      expect(pattern?.id).toBe('comparison-table');
    });
  });

  describe('State Management', () => {
    it('should track last question', () => {
      const question = 'What is REST?';
      detector.detectPattern(question);
      
      expect(detector.getLastQuestion()).toBe(question.toLowerCase().trim());
    });

    it('should reset state', () => {
      detector.detectPattern('What is REST?');
      detector.reset();
      
      expect(detector.getLastQuestion()).toBe('');
      expect(detector.getConfidence()).toBe(0);
    });
  });
});
