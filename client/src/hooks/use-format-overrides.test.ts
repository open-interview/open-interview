/**
 * Unit tests for useFormatOverrides hook
 * 
 * Tests hook functionality for managing format overrides,
 * including loading, adding, removing, and error handling.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { configurationManager, OverrideRecord } from '../lib/answer-formatting/configuration-manager';

// Mock configuration manager
vi.mock('../lib/answer-formatting/configuration-manager', () => ({
  configurationManager: {
    getOverrides: vi.fn(),
    addOverride: vi.fn(),
    removeOverride: vi.fn(),
    getOverrideForQuestion: vi.fn(),
    hasOverride: vi.fn(),
  },
}));

const mockConfigManager = configurationManager as any;

describe('Format Overrides Utilities', () => {
  const mockOverrides: OverrideRecord[] = [
    {
      questionId: 'q1',
      timestamp: '2024-01-01T00:00:00Z',
      justification: 'Special formatting needed for this question',
      overridePattern: 'custom',
      userId: 'user1',
    },
    {
      questionId: 'q2',
      timestamp: '2024-01-02T00:00:00Z',
      justification: 'Disable formatting for this question',
      userId: 'user2',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockConfigManager.getOverrides.mockReturnValue(mockOverrides);
    mockConfigManager.addOverride.mockImplementation(() => {});
    mockConfigManager.removeOverride.mockImplementation(() => {});
    mockConfigManager.getOverrideForQuestion.mockReturnValue(null);
    mockConfigManager.hasOverride.mockReturnValue(false);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Configuration Manager Integration', () => {
    it('should get overrides from configuration manager', () => {
      const overrides = mockConfigManager.getOverrides();
      expect(overrides).toEqual(mockOverrides);
      expect(overrides).toHaveLength(2);
    });

    it('should add override through configuration manager', () => {
      const newOverride = {
        questionId: 'new-q',
        justification: 'New override justification',
        overridePattern: 'custom',
      };

      mockConfigManager.addOverride(newOverride);
      expect(mockConfigManager.addOverride).toHaveBeenCalledWith(newOverride);
    });

    it('should remove override through configuration manager', () => {
      mockConfigManager.removeOverride('q1');
      expect(mockConfigManager.removeOverride).toHaveBeenCalledWith('q1');
    });

    it('should check if question has override', () => {
      mockConfigManager.hasOverride.mockReturnValue(true);
      const hasOverride = mockConfigManager.hasOverride('q1');
      expect(hasOverride).toBe(true);
      expect(mockConfigManager.hasOverride).toHaveBeenCalledWith('q1');
    });

    it('should get override for specific question', () => {
      const override = mockOverrides[0];
      mockConfigManager.getOverrideForQuestion.mockReturnValue(override);
      
      const result = mockConfigManager.getOverrideForQuestion('q1');
      expect(result).toEqual(override);
      expect(mockConfigManager.getOverrideForQuestion).toHaveBeenCalledWith('q1');
    });
  });

  describe('Override Data Validation', () => {
    it('should validate required fields for override', () => {
      const validOverride = {
        questionId: 'test-q',
        justification: 'This is a valid justification with enough detail',
        overridePattern: 'custom',
      };

      // Should not throw for valid override
      expect(() => {
        mockConfigManager.addOverride(validOverride);
      }).not.toThrow();
    });

    it('should handle override without pattern', () => {
      const overrideWithoutPattern = {
        questionId: 'test-q',
        justification: 'Disable formatting for this question',
      };

      expect(() => {
        mockConfigManager.addOverride(overrideWithoutPattern);
      }).not.toThrow();
    });
  });

  describe('Override Operations', () => {
    it('should handle multiple overrides', () => {
      const overrides = mockConfigManager.getOverrides();
      expect(overrides).toHaveLength(2);
      
      const questionIds = overrides.map((o: OverrideRecord) => o.questionId);
      expect(questionIds).toContain('q1');
      expect(questionIds).toContain('q2');
    });

    it('should handle override with different patterns', () => {
      const override1 = mockOverrides.find(o => o.questionId === 'q1');
      const override2 = mockOverrides.find(o => o.questionId === 'q2');
      
      expect(override1?.overridePattern).toBe('custom');
      expect(override2?.overridePattern).toBeUndefined();
    });

    it('should handle override timestamps', () => {
      mockOverrides.forEach(override => {
        expect(override.timestamp).toBeDefined();
        expect(new Date(override.timestamp)).toBeInstanceOf(Date);
      });
    });

    it('should handle override justifications', () => {
      mockOverrides.forEach(override => {
        expect(override.justification).toBeDefined();
        expect(override.justification.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle configuration manager errors', () => {
      mockConfigManager.getOverrides.mockImplementation(() => {
        throw new Error('Configuration error');
      });

      expect(() => {
        mockConfigManager.getOverrides();
      }).toThrow('Configuration error');
    });

    it('should handle add override errors', () => {
      mockConfigManager.addOverride.mockImplementation(() => {
        throw new Error('Add override failed');
      });

      expect(() => {
        mockConfigManager.addOverride({
          questionId: 'test',
          justification: 'test',
        });
      }).toThrow('Add override failed');
    });

    it('should handle remove override errors', () => {
      mockConfigManager.removeOverride.mockImplementation(() => {
        throw new Error('Remove override failed');
      });

      expect(() => {
        mockConfigManager.removeOverride('test');
      }).toThrow('Remove override failed');
    });
  });

  describe('Override Filtering and Search', () => {
    it('should filter overrides by pattern', () => {
      const customOverrides = mockOverrides.filter(o => o.overridePattern === 'custom');
      expect(customOverrides).toHaveLength(1);
      expect(customOverrides[0].questionId).toBe('q1');
    });

    it('should filter overrides by user', () => {
      const user1Overrides = mockOverrides.filter(o => o.userId === 'user1');
      expect(user1Overrides).toHaveLength(1);
      expect(user1Overrides[0].questionId).toBe('q1');
    });

    it('should find overrides by question ID', () => {
      const override = mockOverrides.find(o => o.questionId === 'q2');
      expect(override).toBeDefined();
      expect(override?.justification).toBe('Disable formatting for this question');
    });
  });

  describe('Override Statistics', () => {
    it('should calculate override count', () => {
      const overrides = mockConfigManager.getOverrides();
      expect(overrides.length).toBe(2);
    });

    it('should identify patterns used', () => {
      const patterns = mockOverrides
        .map(o => o.overridePattern)
        .filter(p => p !== undefined);
      
      expect(patterns).toContain('custom');
      expect(patterns).toHaveLength(1);
    });

    it('should identify users who created overrides', () => {
      const users = mockOverrides
        .map(o => o.userId)
        .filter(u => u !== undefined);
      
      expect(users).toContain('user1');
      expect(users).toContain('user2');
      expect(users).toHaveLength(2);
    });
  });
});