/**
 * Pattern Library Module
 * 
 * Manages storage and retrieval of format patterns using localStorage.
 * Provides methods to query, add, and update format patterns.
 */

import type { FormatPattern, PatternLibrary as IPatternLibrary } from './types';
import { STORAGE_KEYS } from './types';

const PATTERNS_STORAGE_KEY = 'answer-formatting:patterns';

/**
 * PatternLibrary class implementation
 * 
 * Handles pattern storage, retrieval, and search functionality.
 * Uses localStorage for persistence in the static GitHub Pages deployment.
 */
export class PatternLibrary implements IPatternLibrary {
  private patterns: Map<string, FormatPattern>;
  private initialized: boolean = false;

  constructor() {
    this.patterns = new Map();
    this.loadPatterns();
  }

  /**
   * Load patterns from localStorage
   * If no patterns exist, initialize with default patterns
   */
  private loadPatterns(): void {
    try {
      const stored = localStorage.getItem(PATTERNS_STORAGE_KEY);
      if (stored) {
        const patternsArray: FormatPattern[] = JSON.parse(stored);
        patternsArray.forEach(pattern => {
          this.patterns.set(pattern.id, pattern);
        });
      }
      this.initialized = true;
    } catch (error) {
      console.error('Failed to load patterns from localStorage:', error);
      this.initialized = true;
    }
  }

  /**
   * Save patterns to localStorage
   */
  private savePatterns(): void {
    try {
      const patternsArray = Array.from(this.patterns.values());
      localStorage.setItem(PATTERNS_STORAGE_KEY, JSON.stringify(patternsArray));
    } catch (error) {
      console.error('Failed to save patterns to localStorage:', error);
    }
  }

  /**
   * Get a specific pattern by ID
   * @param id - The pattern identifier
   * @returns The pattern if found, null otherwise
   */
  getPattern(id: string): FormatPattern | null {
    return this.patterns.get(id) || null;
  }

  /**
   * Get all patterns
   * @returns Array of all format patterns
   */
  getAllPatterns(): FormatPattern[] {
    return Array.from(this.patterns.values());
  }

  /**
   * Search patterns by keywords
   * Returns patterns that match any of the provided keywords
   * @param keywords - Array of keywords to search for
   * @returns Array of matching patterns, sorted by priority (descending)
   */
  searchPatterns(keywords: string[]): FormatPattern[] {
    if (!keywords || keywords.length === 0) {
      return [];
    }

    const normalizedKeywords = keywords.map(k => k.toLowerCase().trim());
    const matchingPatterns: Array<{ pattern: FormatPattern; matchCount: number }> = [];

    this.patterns.forEach(pattern => {
      let matchCount = 0;
      
      // Check if any pattern keyword matches any search keyword
      pattern.keywords.forEach(patternKeyword => {
        const normalizedPatternKeyword = patternKeyword.toLowerCase();
        normalizedKeywords.forEach(searchKeyword => {
          if (normalizedPatternKeyword.includes(searchKeyword) || 
              searchKeyword.includes(normalizedPatternKeyword)) {
            matchCount++;
          }
        });
      });

      if (matchCount > 0) {
        matchingPatterns.push({ pattern, matchCount });
      }
    });

    // Sort by match count (descending), then by priority (descending)
    return matchingPatterns
      .sort((a, b) => {
        if (a.matchCount !== b.matchCount) {
          return b.matchCount - a.matchCount;
        }
        return b.pattern.priority - a.pattern.priority;
      })
      .map(item => item.pattern);
  }

  /**
   * Add a new pattern to the library
   * @param pattern - The pattern to add
   */
  addPattern(pattern: FormatPattern): void {
    this.patterns.set(pattern.id, pattern);
    this.savePatterns();
  }

  /**
   * Update an existing pattern
   * @param id - The pattern ID to update
   * @param pattern - The updated pattern data
   */
  updatePattern(id: string, pattern: FormatPattern): void {
    if (this.patterns.has(id)) {
      this.patterns.set(id, pattern);
      this.savePatterns();
    } else {
      console.warn(`Pattern with id "${id}" not found. Use addPattern() to create new patterns.`);
    }
  }

  /**
   * Initialize the library with default patterns
   * This is typically called once to populate the library
   * @param patterns - Array of patterns to initialize with
   */
  initializePatterns(patterns: FormatPattern[]): void {
    patterns.forEach(pattern => {
      this.patterns.set(pattern.id, pattern);
    });
    this.savePatterns();
  }

  /**
   * Clear all patterns (useful for testing)
   */
  clearPatterns(): void {
    this.patterns.clear();
    this.savePatterns();
  }

  /**
   * Check if the library has been initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get the number of patterns in the library
   */
  getPatternCount(): number {
    return this.patterns.size;
  }
}

// Export a singleton instance
export const patternLibrary = new PatternLibrary();
