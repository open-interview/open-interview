/**
 * Pattern Loader Module
 * 
 * Loads default patterns from patterns.json and initializes the pattern library.
 */

import type { FormatPattern } from './types';
import patternsData from './patterns.json';

/**
 * Get default patterns from the JSON file
 * @returns Array of default format patterns
 */
export function getDefaultPatterns(): FormatPattern[] {
  // The rules property needs to be converted from JSON to actual functions
  // For now, we'll return patterns without validator functions
  // Validators will be added by the FormatValidator module
  return patternsData.patterns.map(pattern => ({
    ...pattern,
    structure: {
      ...pattern.structure,
      rules: [] // Rules with validator functions will be added later
    }
  })) as FormatPattern[];
}

/**
 * Initialize the pattern library with default patterns
 * This should be called once when the application starts
 * @param library - The PatternLibrary instance to initialize
 */
export function initializeDefaultPatterns(library: { initializePatterns: (patterns: FormatPattern[]) => void }): void {
  const patterns = getDefaultPatterns();
  library.initializePatterns(patterns);
}
