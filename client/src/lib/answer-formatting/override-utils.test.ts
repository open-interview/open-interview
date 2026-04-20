/**
 * Unit tests for Override Utilities
 * 
 * Tests override validation, statistics, utility functions,
 * and integration with configuration manager.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  validateOverride,
  getOverrideStats,
  shouldBypassFormatting,
  getEffectivePattern,
  enrichQuestionWithOverride,
  generateOverrideReport,
  isRecentOverride,
  getOverrideAge,
  suggestOverrideCleanup,
  validateJustificationQuality,
} from './override-utils';
import { configurationManager, OverrideRecord } from './configuration-manager';
import { Question } from './types';

// Mock configuration manager
vi.mock('./configuration-manager', () => ({
  configurationManager: {
    hasOverride: vi.fn(),
    getOverrideForQuestion: vi.fn(),
    getOverrides: vi.fn(),
    addOverride: vi.fn(),
    removeOverride: vi.fn(),
  },
}));

const mockConfigManager = configurationManager as any;

describe('Override Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConfigManager.getOverrides.mockReturnValue([]);
    mockConfigManager.hasOverride.mockReturnValue(false);
    mockConfigManager.getOverrideForQuestion.mockReturnValue(null);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('validateOverride', () => {
    it('should validate valid override data', () => {
      const result = validateOverride(
        'question-1',
        'This question requires special formatting because it contains unique code examples that don\'t fit standard patterns',
        'custom-pattern'
      );

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty question ID', () => {
      const result = validateOverride('', 'Valid justification here', 'pattern');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Question ID is required');
    });

    it('should reject empty justification', () => {
      const result = validateOverride('question-1', '', 'pattern');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Justification is required');
    });

    it('should reject short justification', () => {
      const result = validateOverride('question-1', 'Too short', 'pattern');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Justification must be at least 10 characters long');
    });

    it('should warn about brief justification', () => {
      const result = validateOverride('question-1', 'Brief but valid', 'pattern');

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Consider providing a more detailed justification');
    });

    it('should reject existing override', () => {
      mockConfigManager.hasOverride.mockReturnValue(true);

      const result = validateOverride('question-1', 'Valid justification', 'pattern');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Override already exists for this question');
    });

    it('should warn about vague justification', () => {
      const result = validateOverride(
        'question-1',
        'This is bad and wrong',
        'pattern'
      );

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain(
        'Consider providing more specific details about why the override is needed'
      );
    });
  });

  describe('getOverrideStats', () => {
    it('should return empty stats when no overrides exist', () => {
      mockConfigManager.getOverrides.mockReturnValue([]);

      const stats = getOverrideStats();

      expect(stats.totalOverrides).toBe(0);
      expect(stats.overridesByPattern).toEqual({});
      expect(stats.overridesByUser).toEqual({});
      expect(stats.averageJustificationLength).toBe(0);
      expect(stats.mostCommonReasons).toEqual([]);
    });

    it('should calculate stats correctly with overrides', () => {
      const mockOverrides: OverrideRecord[] = [
        {
          questionId: 'q1',
          timestamp: '2024-01-01T00:00:00Z',
          justification: 'This question needs special formatting because it has unique requirements',
          overridePattern: 'custom',
          userId: 'user1',
        },
        {
          questionId: 'q2',
          timestamp: '2024-01-02T00:00:00Z',
          justification: 'Special case for this question due to complex structure',
          overridePattern: 'custom',
          userId: 'user2',
        },
        {
          questionId: 'q3',
          timestamp: '2024-01-03T00:00:00Z',
          justification: 'Different pattern needed here',
          overridePattern: 'different',
          userId: 'user1',
        },
      ];

      mockConfigManager.getOverrides.mockReturnValue(mockOverrides);

      const stats = getOverrideStats();

      expect(stats.totalOverrides).toBe(3);
      expect(stats.overridesByPattern).toEqual({
        custom: 2,
        different: 1,
      });
      expect(stats.overridesByUser).toEqual({
        user1: 2,
        user2: 1,
      });
      expect(stats.averageJustificationLength).toBeGreaterThan(0);
      expect(stats.mostCommonReasons).toBeInstanceOf(Array);
    });

    it('should handle overrides without patterns', () => {
      const mockOverrides: OverrideRecord[] = [
        {
          questionId: 'q1',
          timestamp: '2024-01-01T00:00:00Z',
          justification: 'No pattern needed',
          userId: 'user1',
        },
      ];

      mockConfigManager.getOverrides.mockReturnValue(mockOverrides);

      const stats = getOverrideStats();

      expect(stats.overridesByPattern['no-pattern']).toBe(1);
    });
  });

  describe('shouldBypassFormatting', () => {
    it('should return true when override exists', () => {
      mockConfigManager.hasOverride.mockReturnValue(true);

      const result = shouldBypassFormatting('question-1');

      expect(result).toBe(true);
      expect(mockConfigManager.hasOverride).toHaveBeenCalledWith('question-1');
    });

    it('should return false when no override exists', () => {
      mockConfigManager.hasOverride.mockReturnValue(false);

      const result = shouldBypassFormatting('question-1');

      expect(result).toBe(false);
    });
  });

  describe('getEffectivePattern', () => {
    it('should return override pattern when override exists', () => {
      const mockOverride: OverrideRecord = {
        questionId: 'q1',
        timestamp: '2024-01-01T00:00:00Z',
        justification: 'Override needed',
        overridePattern: 'custom-pattern',
      };

      mockConfigManager.getOverrideForQuestion.mockReturnValue(mockOverride);

      const result = getEffectivePattern('q1', 'detected-pattern');

      expect(result).toBe('custom-pattern');
    });

    it('should return null when override exists but has no pattern', () => {
      const mockOverride: OverrideRecord = {
        questionId: 'q1',
        timestamp: '2024-01-01T00:00:00Z',
        justification: 'Disable formatting',
      };

      mockConfigManager.getOverrideForQuestion.mockReturnValue(mockOverride);

      const result = getEffectivePattern('q1', 'detected-pattern');

      expect(result).toBeNull();
    });

    it('should return detected pattern when no override exists', () => {
      mockConfigManager.getOverrideForQuestion.mockReturnValue(null);

      const result = getEffectivePattern('q1', 'detected-pattern');

      expect(result).toBe('detected-pattern');
    });

    it('should return null when no override and no detected pattern', () => {
      mockConfigManager.getOverrideForQuestion.mockReturnValue(null);

      const result = getEffectivePattern('q1');

      expect(result).toBeNull();
    });
  });

  describe('enrichQuestionWithOverride', () => {
    const baseQuestion: Question = {
      id: 'q1',
      question: 'Test question?',
      answer: 'Test answer',
      channel: 'test',
      difficulty: 'beginner',
    };

    it('should enrich question with override data', () => {
      const mockOverride: OverrideRecord = {
        questionId: 'q1',
        timestamp: '2024-01-01T00:00:00Z',
        justification: 'Special formatting needed',
        overridePattern: 'custom',
      };

      mockConfigManager.getOverrideForQuestion.mockReturnValue(mockOverride);

      const enriched = enrichQuestionWithOverride(baseQuestion);

      expect(enriched.hasOverride).toBe(true);
      expect(enriched.overrideJustification).toBe('Special formatting needed');
      expect(enriched.overridePattern).toBe('custom');
      expect(enriched.overrideTimestamp).toBe('2024-01-01T00:00:00Z');
    });

    it('should enrich question without override', () => {
      mockConfigManager.getOverrideForQuestion.mockReturnValue(null);

      const enriched = enrichQuestionWithOverride(baseQuestion);

      expect(enriched.hasOverride).toBe(false);
      expect(enriched.overrideJustification).toBeUndefined();
      expect(enriched.overridePattern).toBeUndefined();
      expect(enriched.overrideTimestamp).toBeUndefined();
    });
  });

  describe('generateOverrideReport', () => {
    it('should generate report for existing override', () => {
      const mockOverride: OverrideRecord = {
        questionId: 'q1',
        timestamp: '2024-01-01T12:00:00Z',
        justification: 'Special formatting required',
        originalPattern: 'comparison-table',
        overridePattern: 'custom',
        userId: 'user1',
      };

      mockConfigManager.getOverrideForQuestion.mockReturnValue(mockOverride);

      const report = generateOverrideReport('q1');

      expect(report).toContain('Override Report for Question: q1');
      expect(report).toContain('Special formatting required');
      expect(report).toContain('Original Pattern: comparison-table');
      expect(report).toContain('Override Pattern: custom');
      expect(report).toContain('User: user1');
    });

    it('should return null for non-existent override', () => {
      mockConfigManager.getOverrideForQuestion.mockReturnValue(null);

      const report = generateOverrideReport('q1');

      expect(report).toBeNull();
    });

    it('should handle override without pattern', () => {
      const mockOverride: OverrideRecord = {
        questionId: 'q1',
        timestamp: '2024-01-01T12:00:00Z',
        justification: 'Disable formatting',
      };

      mockConfigManager.getOverrideForQuestion.mockReturnValue(mockOverride);

      const report = generateOverrideReport('q1');

      expect(report).toContain('Override Pattern: None (formatting disabled)');
    });
  });

  describe('isRecentOverride', () => {
    it('should return true for recent override', () => {
      const recentOverride: OverrideRecord = {
        questionId: 'q1',
        timestamp: new Date().toISOString(),
        justification: 'Recent override',
      };

      const result = isRecentOverride(recentOverride);

      expect(result).toBe(true);
    });

    it('should return false for old override', () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 60); // 60 days ago

      const oldOverride: OverrideRecord = {
        questionId: 'q1',
        timestamp: oldDate.toISOString(),
        justification: 'Old override',
      };

      const result = isRecentOverride(oldOverride);

      expect(result).toBe(false);
    });
  });

  describe('getOverrideAge', () => {
    it('should calculate age correctly', () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      const override: OverrideRecord = {
        questionId: 'q1',
        timestamp: threeDaysAgo.toISOString(),
        justification: 'Test override',
      };

      const age = getOverrideAge(override);

      expect(age).toBe(3);
    });
  });

  describe('suggestOverrideCleanup', () => {
    it('should suggest old overrides for cleanup', () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 100); // 100 days ago

      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 10); // 10 days ago

      const mockOverrides: OverrideRecord[] = [
        {
          questionId: 'old-q1',
          timestamp: oldDate.toISOString(),
          justification: 'Old override 1',
        },
        {
          questionId: 'recent-q1',
          timestamp: recentDate.toISOString(),
          justification: 'Recent override',
        },
        {
          questionId: 'old-q2',
          timestamp: oldDate.toISOString(),
          justification: 'Old override 2',
        },
      ];

      mockConfigManager.getOverrides.mockReturnValue(mockOverrides);

      const suggestions = suggestOverrideCleanup();

      expect(suggestions).toHaveLength(2);
      expect(suggestions.map(s => s.questionId)).toContain('old-q1');
      expect(suggestions.map(s => s.questionId)).toContain('old-q2');
      expect(suggestions.map(s => s.questionId)).not.toContain('recent-q1');
    });
  });

  describe('validateJustificationQuality', () => {
    it('should give high score for good justification', () => {
      const justification = 'This question requires a custom format because it presents a unique comparison between multiple architectural patterns that doesn\'t fit the standard table format. The content includes nested diagrams and code examples that need special handling.';

      const result = validateJustificationQuality(justification);

      expect(result.score).toBeGreaterThan(80);
      expect(result.feedback).toContain('Good justification quality.');
    });

    it('should penalize short justification', () => {
      const justification = 'Too short';

      const result = validateJustificationQuality(justification);

      expect(result.score).toBeLessThan(70);
      expect(result.feedback).toContain('Justification is too short. Provide more detail.');
    });

    it('should penalize vague terms', () => {
      const justification = 'This is bad and doesn\'t work properly so it\'s broken';

      const result = validateJustificationQuality(justification);

      expect(result.score).toBeLessThan(80);
      expect(result.feedback).toContain('Avoid vague terms. Be specific about the issue.');
    });

    it('should suggest multiple sentences', () => {
      const justification = 'This question needs special formatting because of unique requirements';

      const result = validateJustificationQuality(justification);

      expect(result.feedback).toContain('Consider using multiple sentences for clarity.');
    });

    it('should handle edge cases', () => {
      const emptyJustification = '';
      const result = validateJustificationQuality(emptyJustification);

      expect(result.score).toBeLessThan(70); // Empty string gets penalized but not zero
      expect(result.feedback.length).toBeGreaterThan(0);
    });
  });
});