/**
 * Pattern Detector Module
 * 
 * Analyzes questions to determine the appropriate format pattern.
 * Uses keyword matching and confidence scoring to suggest patterns.
 */

import type { FormatPattern, PatternDetector as IPatternDetector } from './types';
import { patternLibrary } from './pattern-library';

/**
 * PatternDetector class implementation
 * 
 * Detects appropriate format patterns for questions based on keyword analysis.
 */
export class PatternDetector implements IPatternDetector {
  private lastConfidence: number = 0;
  private lastQuestion: string = '';

  /**
   * Detect the most appropriate pattern for a question
   * @param question - The question text to analyze
   * @returns The best matching pattern, or null if no match found
   */
  detectPattern(question: string): FormatPattern | null {
    const normalizedQuestion = question.toLowerCase().trim();
    this.lastQuestion = normalizedQuestion;
    const suggestions = this.getSuggestedPatterns(question);
    
    if (suggestions.length === 0) {
      this.lastConfidence = 0;
      return null;
    }

    // Return the highest confidence pattern
    this.lastConfidence = this.calculateConfidence(normalizedQuestion, suggestions[0]);
    return suggestions[0];
  }

  /**
   * Get the confidence score of the last detection
   * @returns Confidence score between 0 and 1
   */
  getConfidence(): number {
    return this.lastConfidence;
  }

  /**
   * Get all suggested patterns for a question, sorted by relevance
   * @param question - The question text to analyze
   * @returns Array of matching patterns, sorted by confidence (descending)
   */
  getSuggestedPatterns(question: string): FormatPattern[] {
    const normalizedQuestion = question.toLowerCase().trim();
    
    // Extract keywords from the question
    const questionKeywords = this.extractKeywords(normalizedQuestion);
    
    if (questionKeywords.length === 0) {
      return [];
    }

    // Search for patterns using the pattern library
    const matchingPatterns = patternLibrary.searchPatterns(questionKeywords);
    
    // Calculate confidence scores for each pattern
    const patternsWithScores = matchingPatterns.map(pattern => ({
      pattern,
      confidence: this.calculateConfidence(normalizedQuestion, pattern)
    }));

    // Special case: if question contains "difference", "compare", or "vs",
    // boost comparison pattern confidence
    const hasComparisonKeyword = /\b(difference|differ|compare|comparison|vs|versus)\b/i.test(normalizedQuestion);
    if (hasComparisonKeyword) {
      patternsWithScores.forEach(item => {
        if (item.pattern.id === 'comparison-table') {
          item.confidence = Math.min(1.0, item.confidence + 0.3); // Significant boost
        }
      });
    }

    // Special case: if question contains "how to" and "debug/troubleshoot/error/fix",
    // boost troubleshooting pattern over process pattern
    const hasHowTo = /\bhow\s+to\b/i.test(normalizedQuestion);
    const hasTroubleshootingKeyword = /\b(debug|troubleshoot|error|fix|problem)\b/i.test(normalizedQuestion);
    if (hasHowTo && hasTroubleshootingKeyword) {
      patternsWithScores.forEach(item => {
        if (item.pattern.id === 'troubleshooting') {
          item.confidence = Math.min(1.0, item.confidence + 0.2);
        }
      });
    }

    // Sort by confidence (descending)
    patternsWithScores.sort((a, b) => b.confidence - a.confidence);

    return patternsWithScores.map(item => item.pattern);
  }

  /**
   * Extract potential keywords from a question
   * @param question - The normalized question text
   * @returns Array of extracted keywords
   */
  private extractKeywords(question: string): string[] {
    const keywords: string[] = [];

    // Common question patterns and their keywords
    const patterns = [
      // Comparison patterns - check these first with word boundaries
      { regex: /\b(difference|differ|vs|versus|compare|comparison|distinguish)\b/gi, keyword: 'compare' },
      { regex: /\bcompare\s+(\w+)\s+(and|with|to)\s+(\w+)\b/gi, keyword: 'compare' },
      
      // Definition patterns - use word boundaries to avoid matching "difference"
      { regex: /\bwhat\s+is\b/gi, keyword: 'what is' },
      { regex: /\bdefine\b/gi, keyword: 'define' },
      { regex: /\bexplain\s+what\b/gi, keyword: 'explain what' },
      { regex: /\bdefinition\s+of\b/gi, keyword: 'definition' },
      
      // List patterns
      { regex: /\btypes\s+of\b/gi, keyword: 'types' },
      { regex: /\bcategories\s+of\b/gi, keyword: 'categories' },
      { regex: /\blist\b/gi, keyword: 'list' },
      { regex: /\bexamples\s+of\b/gi, keyword: 'examples' },
      { regex: /\bkinds\s+of\b/gi, keyword: 'types' },
      
      // Process patterns
      { regex: /\bhow\s+to\b/gi, keyword: 'how to' },
      { regex: /\bsteps\b/gi, keyword: 'steps' },
      { regex: /\bprocess\b/gi, keyword: 'process' },
      { regex: /\bworkflow\b/gi, keyword: 'workflow' },
      { regex: /\bprocedure\b/gi, keyword: 'procedure' },
      
      // Code patterns
      { regex: /\bimplement\b/gi, keyword: 'implement' },
      { regex: /\bcode\b/gi, keyword: 'code' },
      { regex: /\bwrite\b/gi, keyword: 'write' },
      { regex: /\bsyntax\b/gi, keyword: 'syntax' },
      { regex: /\bprogramming\b/gi, keyword: 'programming' },
      
      // Pros/Cons patterns
      { regex: /\bpros\b/gi, keyword: 'pros' },
      { regex: /\bcons\b/gi, keyword: 'cons' },
      { regex: /\badvantages\b/gi, keyword: 'advantages' },
      { regex: /\bdisadvantages\b/gi, keyword: 'disadvantages' },
      { regex: /\bbenefits\b/gi, keyword: 'benefits' },
      { regex: /\bdrawbacks\b/gi, keyword: 'drawbacks' },
      
      // Architecture patterns
      { regex: /\barchitecture\b/gi, keyword: 'architecture' },
      { regex: /\bdesign\b/gi, keyword: 'design' },
      { regex: /\bsystem\b/gi, keyword: 'system' },
      { regex: /\bdiagram\b/gi, keyword: 'diagram' },
      { regex: /\bstructure\b/gi, keyword: 'structure' },
      { regex: /\bflow\b/gi, keyword: 'flow' },
      
      // Troubleshooting patterns
      { regex: /\bdebug\b/gi, keyword: 'debug' },
      { regex: /\btroubleshoot\b/gi, keyword: 'troubleshoot' },
      { regex: /\berror\b/gi, keyword: 'error' },
      { regex: /\bfix\b/gi, keyword: 'fix' },
      { regex: /\bproblem\b/gi, keyword: 'problem' },
      { regex: /\bissue\b/gi, keyword: 'issue' },
      
      // Best practices patterns
      { regex: /\bbest\s+practices\b/gi, keyword: 'best practices' },
      { regex: /\bguidelines\b/gi, keyword: 'guidelines' },
      { regex: /\brecommendations\b/gi, keyword: 'recommendations' },
      { regex: /\btips\b/gi, keyword: 'tips' },
    ];

    // Extract keywords using patterns
    for (const { regex, keyword } of patterns) {
      if (regex.test(question)) {
        keywords.push(keyword);
      }
    }

    // Remove duplicates
    return Array.from(new Set(keywords));
  }

  /**
   * Calculate confidence score for a pattern match
   * @param question - The normalized question text
   * @param pattern - The pattern to score
   * @returns Confidence score between 0 and 1
   */
  private calculateConfidence(question: string, pattern: FormatPattern): number {
    let score = 0;
    let maxScore = 0;

    // Check each pattern keyword
    for (const keyword of pattern.keywords) {
      maxScore += 1;
      const normalizedKeyword = keyword.toLowerCase();

      // Exact match (highest score)
      if (question.includes(normalizedKeyword)) {
        score += 1.0;
      }
      // Partial match (lower score)
      else if (this.hasPartialMatch(question, normalizedKeyword)) {
        score += 0.5;
      }
    }

    // Normalize score to 0-1 range
    const normalizedScore = maxScore > 0 ? score / maxScore : 0;

    // Apply priority boost (higher priority patterns get a boost)
    // Priority ranges from 1-10, so we normalize and apply up to 20% boost
    const priorityBoost = (pattern.priority / 10) * 0.2;
    
    return Math.min(1.0, normalizedScore + priorityBoost);
  }

  /**
   * Check if there's a partial match between question and keyword
   * @param question - The question text
   * @param keyword - The keyword to match
   * @returns True if partial match found
   */
  private hasPartialMatch(question: string, keyword: string): boolean {
    // Split keyword into words
    const words = keyword.split(/\s+/);
    
    // Check if any word from the keyword appears in the question as a complete word
    return words.some(word => {
      if (word.length < 4) return false; // Skip short words to avoid false matches
      // Use word boundaries to ensure we match complete words only
      const wordRegex = new RegExp(`\\b${word}\\b`, 'i');
      return wordRegex.test(question);
    });
  }

  /**
   * Get the last analyzed question
   * @returns The last question text
   */
  getLastQuestion(): string {
    return this.lastQuestion;
  }

  /**
   * Reset the detector state
   */
  reset(): void {
    this.lastConfidence = 0;
    this.lastQuestion = '';
  }
}

// Export a singleton instance
export const patternDetector = new PatternDetector();
