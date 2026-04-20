/**
 * Pattern Detector - ES Module version for Node.js compatibility
 * 
 * Detects format patterns based on question text analysis
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PatternDetector {
  constructor() {
    this.patterns = [];
    this.confidence = 0;
    this.loadPatterns();
  }

  loadPatterns() {
    try {
      const patternsPath = path.join(__dirname, 'patterns.json');
      const patternsData = fs.readFileSync(patternsPath, 'utf8');
      const parsedData = JSON.parse(patternsData);
      this.patterns = parsedData.patterns || parsedData; // Handle both nested and flat structures
      console.log(`Loaded ${this.patterns.length} patterns from patterns.json`);
    } catch (error) {
      console.warn('Failed to load patterns.json, using default patterns:', error.message);
      this.patterns = this.getDefaultPatterns();
      console.log(`Using ${this.patterns.length} default patterns`);
    }
  }

  getDefaultPatterns() {
    return [
      {
        id: 'comparison',
        name: 'Comparison Table',
        keywords: ['compare', 'difference', 'vs', 'versus', 'better', 'advantages', 'disadvantages'],
        priority: 90
      },
      {
        id: 'definition',
        name: 'Definition',
        keywords: ['what is', 'define', 'definition', 'explain', 'meaning'],
        priority: 80
      },
      {
        id: 'list',
        name: 'List Format',
        keywords: ['list', 'types', 'kinds', 'examples', 'benefits', 'features'],
        priority: 70
      },
      {
        id: 'process',
        name: 'Process Steps',
        keywords: ['how to', 'steps', 'process', 'procedure', 'workflow', 'implement'],
        priority: 85
      },
      {
        id: 'code',
        name: 'Code Example',
        keywords: ['code', 'example', 'implementation', 'syntax', 'function', 'method'],
        priority: 75
      },
      {
        id: 'pros-cons',
        name: 'Pros and Cons',
        keywords: ['pros and cons', 'advantages and disadvantages', 'benefits and drawbacks'],
        priority: 88
      },
      {
        id: 'architecture',
        name: 'Architecture Diagram',
        keywords: ['architecture', 'design', 'system', 'structure', 'components', 'diagram'],
        priority: 82
      },
      {
        id: 'troubleshooting',
        name: 'Troubleshooting Guide',
        keywords: ['troubleshoot', 'debug', 'fix', 'solve', 'problem', 'issue', 'error'],
        priority: 78
      },
      {
        id: 'best-practices',
        name: 'Best Practices',
        keywords: ['best practices', 'guidelines', 'recommendations', 'tips', 'advice'],
        priority: 72
      }
    ];
  }

  detectPattern(question) {
    if (!question || typeof question !== 'string') {
      this.confidence = 0;
      return null;
    }

    const questionLower = question.toLowerCase();
    const matches = [];

    for (const pattern of this.patterns) {
      let score = 0;
      let keywordMatches = 0;

      for (const keyword of pattern.keywords) {
        if (questionLower.includes(keyword.toLowerCase())) {
          keywordMatches++;
          score += pattern.priority;
        }
      }

      if (keywordMatches > 0) {
        matches.push({
          pattern,
          score: score * (keywordMatches / pattern.keywords.length),
          keywordMatches
        });
      }
    }

    if (matches.length === 0) {
      this.confidence = 0;
      return null;
    }

    // Sort by score and return the best match
    matches.sort((a, b) => b.score - a.score);
    const bestMatch = matches[0];
    
    // Calculate confidence based on score and keyword coverage
    this.confidence = Math.min(1, bestMatch.score / 100);
    
    return bestMatch.pattern;
  }

  getConfidence() {
    return this.confidence;
  }

  getSuggestedPatterns(question) {
    if (!question || typeof question !== 'string') {
      return [];
    }

    const questionLower = question.toLowerCase();
    const matches = [];

    for (const pattern of this.patterns) {
      let score = 0;
      let keywordMatches = 0;

      for (const keyword of pattern.keywords) {
        if (questionLower.includes(keyword.toLowerCase())) {
          keywordMatches++;
          score += pattern.priority;
        }
      }

      if (keywordMatches > 0) {
        matches.push({
          ...pattern,
          score: score * (keywordMatches / pattern.keywords.length),
          keywordMatches
        });
      }
    }

    // Sort by score and return top 3
    return matches
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }
}

// Create singleton instance
const patternDetector = new PatternDetector();

export { patternDetector, PatternDetector };
export default patternDetector;