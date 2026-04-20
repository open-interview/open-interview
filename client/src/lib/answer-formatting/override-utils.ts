/**
 * Utility functions for managing Answer Formatting Standards overrides
 * 
 * This module provides helper functions for working with overrides,
 * including validation, metrics tracking, and integration utilities.
 */

import { configurationManager, OverrideRecord } from './configuration-manager';
import { Question, FormatPattern } from './types';

/**
 * Override validation result
 */
export interface OverrideValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Override usage statistics
 */
export interface OverrideStats {
  totalOverrides: number;
  overridesByPattern: Record<string, number>;
  overridesByUser: Record<string, number>;
  averageJustificationLength: number;
  mostCommonReasons: string[];
  overrideRate: number; // percentage of questions with overrides
}

/**
 * Validate override data before creation
 */
export const validateOverride = (
  questionId: string,
  justification: string,
  overridePattern?: string
): OverrideValidation => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required field validation
  if (!questionId || questionId.trim().length === 0) {
    errors.push('Question ID is required');
  }

  if (!justification || justification.trim().length === 0) {
    errors.push('Justification is required');
  } else if (justification.trim().length < 10) {
    errors.push('Justification must be at least 10 characters long');
  } else if (justification.trim().length < 20) {
    warnings.push('Consider providing a more detailed justification');
  }

  // Check for existing override
  if (configurationManager.hasOverride(questionId)) {
    errors.push('Override already exists for this question');
  }

  // Pattern validation
  if (overridePattern) {
    // In a real implementation, you'd validate against available patterns
    if (overridePattern.trim().length === 0) {
      warnings.push('Override pattern is empty');
    }
  }

  // Content quality checks
  const commonWords = ['bad', 'wrong', 'broken', 'fix', 'error'];
  const justificationLower = justification.toLowerCase();
  const hasCommonWords = commonWords.some(word => justificationLower.includes(word));
  
  if (hasCommonWords && justification.length < 50) {
    warnings.push('Consider providing more specific details about why the override is needed');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Get override statistics
 */
export const getOverrideStats = (): OverrideStats => {
  const overrides = configurationManager.getOverrides();
  const totalOverrides = overrides.length;

  if (totalOverrides === 0) {
    return {
      totalOverrides: 0,
      overridesByPattern: {},
      overridesByUser: {},
      averageJustificationLength: 0,
      mostCommonReasons: [],
      overrideRate: 0,
    };
  }

  // Count by pattern
  const overridesByPattern: Record<string, number> = {};
  overrides.forEach(override => {
    const pattern = override.overridePattern || 'no-pattern';
    overridesByPattern[pattern] = (overridesByPattern[pattern] || 0) + 1;
  });

  // Count by user
  const overridesByUser: Record<string, number> = {};
  overrides.forEach(override => {
    const user = override.userId || 'unknown';
    overridesByUser[user] = (overridesByUser[user] || 0) + 1;
  });

  // Calculate average justification length
  const totalJustificationLength = overrides.reduce(
    (sum, override) => sum + override.justification.length,
    0
  );
  const averageJustificationLength = totalJustificationLength / totalOverrides;

  // Extract common reasons (simplified keyword extraction)
  const reasonKeywords: Record<string, number> = {};
  overrides.forEach(override => {
    const words = override.justification
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3)
      .slice(0, 5); // Take first 5 words as keywords
    
    words.forEach(word => {
      reasonKeywords[word] = (reasonKeywords[word] || 0) + 1;
    });
  });

  const mostCommonReasons = Object.entries(reasonKeywords)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([word]) => word);

  // Calculate override rate (would need total questions count in real implementation)
  const overrideRate = 0; // Placeholder - would calculate based on total questions

  return {
    totalOverrides,
    overridesByPattern,
    overridesByUser,
    averageJustificationLength,
    mostCommonReasons,
    overrideRate,
  };
};

/**
 * Check if a question should bypass formatting due to override
 */
export const shouldBypassFormatting = (questionId: string): boolean => {
  return configurationManager.hasOverride(questionId);
};

/**
 * Get effective pattern for a question (considering overrides)
 */
export const getEffectivePattern = (
  questionId: string,
  detectedPattern?: string
): string | null => {
  const override = configurationManager.getOverrideForQuestion(questionId);
  
  if (override) {
    // If override exists, use override pattern or null (no formatting)
    return override.overridePattern || null;
  }
  
  // Otherwise use detected pattern
  return detectedPattern || null;
};

/**
 * Enrich question object with override information
 */
export const enrichQuestionWithOverride = (question: Question): Question => {
  const override = configurationManager.getOverrideForQuestion(question.id);
  
  if (override) {
    return {
      ...question,
      hasOverride: true,
      overrideJustification: override.justification,
      overridePattern: override.overridePattern,
      overrideTimestamp: override.timestamp,
    };
  }
  
  return {
    ...question,
    hasOverride: false,
  };
};

/**
 * Generate override report for a question
 */
export const generateOverrideReport = (questionId: string): string | null => {
  const override = configurationManager.getOverrideForQuestion(questionId);
  
  if (!override) {
    return null;
  }
  
  const lines = [
    `Override Report for Question: ${questionId}`,
    `Created: ${new Date(override.timestamp).toLocaleString()}`,
    `User: ${override.userId || 'Unknown'}`,
    '',
    'Justification:',
    override.justification,
  ];
  
  if (override.originalPattern) {
    lines.push('', `Original Pattern: ${override.originalPattern}`);
  }
  
  if (override.overridePattern) {
    lines.push(`Override Pattern: ${override.overridePattern}`);
  } else {
    lines.push('Override Pattern: None (formatting disabled)');
  }
  
  return lines.join('\n');
};

/**
 * Check if override is recent (within last 30 days)
 */
export const isRecentOverride = (override: OverrideRecord): boolean => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const overrideDate = new Date(override.timestamp);
  return overrideDate > thirtyDaysAgo;
};

/**
 * Get override age in days
 */
export const getOverrideAge = (override: OverrideRecord): number => {
  const now = new Date();
  const overrideDate = new Date(override.timestamp);
  const diffTime = Math.abs(now.getTime() - overrideDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Suggest override cleanup (old or unnecessary overrides)
 */
export const suggestOverrideCleanup = (): OverrideRecord[] => {
  const overrides = configurationManager.getOverrides();
  const oldOverrides = overrides.filter(override => {
    const age = getOverrideAge(override);
    return age > 90; // Suggest cleanup for overrides older than 90 days
  });
  
  return oldOverrides;
};

/**
 * Export override data for analysis
 */
export const exportOverrideData = (): string => {
  const overrides = configurationManager.getOverrides();
  const stats = getOverrideStats();
  
  const exportData = {
    exportDate: new Date().toISOString(),
    totalOverrides: overrides.length,
    statistics: stats,
    overrides: overrides.map(override => ({
      ...override,
      age: getOverrideAge(override),
      isRecent: isRecentOverride(override),
    })),
  };
  
  return JSON.stringify(exportData, null, 2);
};

/**
 * Validate override justification quality
 */
export const validateJustificationQuality = (justification: string): {
  score: number; // 0-100
  feedback: string[];
} => {
  const feedback: string[] = [];
  let score = 100;
  
  // Length check
  if (justification.length < 20) {
    score -= 30;
    feedback.push('Justification is too short. Provide more detail.');
  } else if (justification.length < 50) {
    score -= 15;
    feedback.push('Consider providing more detailed explanation.');
  }
  
  // Specificity check
  const vague = ['bad', 'wrong', 'broken', 'doesn\'t work', 'not good'];
  const hasVagueTerms = vague.some(term => justification.toLowerCase().includes(term));
  if (hasVagueTerms) {
    score -= 20;
    feedback.push('Avoid vague terms. Be specific about the issue.');
  }
  
  // Structure check
  const sentences = justification.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length < 2) {
    score -= 10;
    feedback.push('Consider using multiple sentences for clarity.');
  }
  
  // Positive feedback
  if (score >= 80) {
    feedback.push('Good justification quality.');
  }
  
  return { score: Math.max(0, score), feedback };
};