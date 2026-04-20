/**
 * Unit tests for MetricsCollector
 * 
 * Tests metrics calculation, persistence, and dashboard functionality
 * for the Answer Formatting Standards system.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  MetricsCollector, 
  ValidationEvent, 
  AutoFixEvent, 
  PatternDetectionEvent 
} from './metrics-collector';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('MetricsCollector', () => {
  let metricsCollector: MetricsCollector;

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    
    // Create fresh instance
    metricsCollector = MetricsCollector.getInstance();
    metricsCollector.clearMetrics();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = MetricsCollector.getInstance();
      const instance2 = MetricsCollector.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Validation Event Recording', () => {
    it('should record validation events correctly', () => {
      const event: ValidationEvent = {
        questionId: 'q1',
        timestamp: '2024-01-01T10:00:00Z',
        pattern: 'comparison-table',
        score: 85,
        passed: true,
        violationCount: 1,
        autoFixable: true,
        channel: 'system-design'
      };

      metricsCollector.recordValidation(event);
      const metrics = metricsCollector.getMetrics();

      expect(metrics.totalQuestions).toBe(1);
      expect(metrics.totalValidations).toBe(1);
      expect(metrics.complianceRate).toBe(100);
      expect(metrics.averageScore).toBe(85);
    });

    it('should calculate compliance rate correctly', () => {
      const events: ValidationEvent[] = [
        {
          questionId: 'q1',
          timestamp: '2024-01-01T10:00:00Z',
          pattern: 'comparison-table',
          score: 85,
          passed: true,
          violationCount: 1,
          autoFixable: true
        },
        {
          questionId: 'q2',
          timestamp: '2024-01-01T11:00:00Z',
          pattern: 'definition',
          score: 60,
          passed: false,
          violationCount: 3,
          autoFixable: true
        },
        {
          questionId: 'q3',
          timestamp: '2024-01-01T12:00:00Z',
          pattern: 'list',
          score: 90,
          passed: true,
          violationCount: 0,
          autoFixable: false
        }
      ];

      events.forEach(event => metricsCollector.recordValidation(event));
      const metrics = metricsCollector.getMetrics();

      expect(metrics.totalQuestions).toBe(3);
      expect(metrics.complianceRate).toBeCloseTo(66.7, 1); // 2 out of 3 passed
      expect(metrics.averageScore).toBeCloseTo(78.3, 1); // (85 + 60 + 90) / 3
      expect(metrics.averageViolationsPerQuestion).toBeCloseTo(1.3, 1); // (1 + 3 + 0) / 3
    });

    it('should calculate validation pass rate correctly', () => {
      // First attempt fails, second attempt passes for same question
      const events: ValidationEvent[] = [
        {
          questionId: 'q1',
          timestamp: '2024-01-01T10:00:00Z',
          pattern: 'comparison-table',
          score: 60,
          passed: false,
          violationCount: 2,
          autoFixable: true
        },
        {
          questionId: 'q1',
          timestamp: '2024-01-01T10:05:00Z',
          pattern: 'comparison-table',
          score: 85,
          passed: true,
          violationCount: 0,
          autoFixable: false
        },
        {
          questionId: 'q2',
          timestamp: '2024-01-01T11:00:00Z',
          pattern: 'definition',
          score: 90,
          passed: true,
          violationCount: 0,
          autoFixable: false
        }
      ];

      events.forEach(event => metricsCollector.recordValidation(event));
      const metrics = metricsCollector.getMetrics();

      expect(metrics.validationPassRate).toBe(50); // 1 out of 2 questions passed on first attempt
    });
  });

  describe('Auto-Fix Event Recording', () => {
    it('should record auto-fix events correctly', () => {
      const event: AutoFixEvent = {
        questionId: 'q1',
        timestamp: '2024-01-01T10:00:00Z',
        violationType: 'missing-table-headers',
        success: true,
        beforeScore: 60,
        afterScore: 85
      };

      metricsCollector.recordAutoFix(event);
      const metrics = metricsCollector.getMetrics();

      expect(metrics.autoFixAttempts).toBe(1);
      expect(metrics.autoFixSuccesses).toBe(1);
      expect(metrics.autoFixSuccessRate).toBe(100);
    });

    it('should calculate auto-fix success rate correctly', () => {
      const events: AutoFixEvent[] = [
        {
          questionId: 'q1',
          timestamp: '2024-01-01T10:00:00Z',
          violationType: 'missing-table-headers',
          success: true,
          beforeScore: 60,
          afterScore: 85
        },
        {
          questionId: 'q2',
          timestamp: '2024-01-01T11:00:00Z',
          violationType: 'invalid-list-format',
          success: false,
          beforeScore: 70,
          afterScore: 70
        },
        {
          questionId: 'q3',
          timestamp: '2024-01-01T12:00:00Z',
          violationType: 'missing-code-fence',
          success: true,
          beforeScore: 50,
          afterScore: 80
        }
      ];

      events.forEach(event => metricsCollector.recordAutoFix(event));
      const metrics = metricsCollector.getMetrics();

      expect(metrics.autoFixAttempts).toBe(3);
      expect(metrics.autoFixSuccesses).toBe(2);
      expect(metrics.autoFixSuccessRate).toBeCloseTo(66.7, 1); // 2 out of 3 successful
    });
  });

  describe('Pattern Detection Event Recording', () => {
    it('should record pattern detection events correctly', () => {
      const event: PatternDetectionEvent = {
        questionId: 'q1',
        timestamp: '2024-01-01T10:00:00Z',
        detectedPattern: 'comparison-table',
        confidence: 0.85,
        appliedPattern: 'comparison-table'
      };

      metricsCollector.recordPatternDetection(event);
      const metrics = metricsCollector.getMetrics();

      expect(metrics.patternUsage['comparison-table']).toBeDefined();
      expect(metrics.patternUsage['comparison-table'].detectionCount).toBe(1);
      expect(metrics.patternUsage['comparison-table'].applicationCount).toBe(1);
    });

    it('should calculate pattern usage statistics correctly', () => {
      const events: PatternDetectionEvent[] = [
        {
          questionId: 'q1',
          timestamp: '2024-01-01T10:00:00Z',
          detectedPattern: 'comparison-table',
          confidence: 0.85,
          appliedPattern: 'comparison-table'
        },
        {
          questionId: 'q2',
          timestamp: '2024-01-01T11:00:00Z',
          detectedPattern: 'comparison-table',
          confidence: 0.75,
          // No applied pattern (user rejected suggestion)
        },
        {
          questionId: 'q3',
          timestamp: '2024-01-01T12:00:00Z',
          detectedPattern: 'definition',
          confidence: 0.90,
          appliedPattern: 'definition'
        }
      ];

      events.forEach(event => metricsCollector.recordPatternDetection(event));
      
      // Add corresponding validation events to calculate success rates
      const validationEvents: ValidationEvent[] = [
        {
          questionId: 'q1',
          timestamp: '2024-01-01T10:01:00Z',
          pattern: 'comparison-table',
          score: 85,
          passed: true,
          violationCount: 0,
          autoFixable: false
        },
        {
          questionId: 'q3',
          timestamp: '2024-01-01T12:01:00Z',
          pattern: 'definition',
          score: 90,
          passed: true,
          violationCount: 0,
          autoFixable: false
        }
      ];

      validationEvents.forEach(event => metricsCollector.recordValidation(event));
      const metrics = metricsCollector.getMetrics();

      expect(metrics.patternUsage['comparison-table'].detectionCount).toBe(2);
      expect(metrics.patternUsage['comparison-table'].applicationCount).toBe(1);
      expect(metrics.patternUsage['comparison-table'].averageScore).toBe(85);
      expect(metrics.patternUsage['comparison-table'].successRate).toBe(100);

      expect(metrics.patternUsage['definition'].detectionCount).toBe(1);
      expect(metrics.patternUsage['definition'].applicationCount).toBe(1);
      expect(metrics.patternUsage['definition'].averageScore).toBe(90);
      expect(metrics.patternUsage['definition'].successRate).toBe(100);
    });
  });

  describe('Channel Breakdown', () => {
    it('should calculate channel metrics correctly', () => {
      const events: ValidationEvent[] = [
        {
          questionId: 'q1',
          timestamp: '2024-01-01T10:00:00Z',
          pattern: 'comparison-table',
          score: 85,
          passed: true,
          violationCount: 0,
          autoFixable: false,
          channel: 'system-design'
        },
        {
          questionId: 'q2',
          timestamp: '2024-01-01T11:00:00Z',
          pattern: 'definition',
          score: 60,
          passed: false,
          violationCount: 2,
          autoFixable: true,
          channel: 'system-design'
        },
        {
          questionId: 'q3',
          timestamp: '2024-01-01T12:00:00Z',
          pattern: 'code-example',
          score: 90,
          passed: true,
          violationCount: 0,
          autoFixable: false,
          channel: 'algorithms'
        }
      ];

      events.forEach(event => metricsCollector.recordValidation(event));
      const metrics = metricsCollector.getMetrics();

      expect(metrics.channelBreakdown).toHaveLength(2);
      
      const systemDesignChannel = metrics.channelBreakdown.find(c => c.channel === 'system-design');
      expect(systemDesignChannel).toBeDefined();
      expect(systemDesignChannel!.totalQuestions).toBe(2);
      expect(systemDesignChannel!.complianceRate).toBe(50); // 1 out of 2 passed
      expect(systemDesignChannel!.averageScore).toBe(72.5); // (85 + 60) / 2

      const algorithmsChannel = metrics.channelBreakdown.find(c => c.channel === 'algorithms');
      expect(algorithmsChannel).toBeDefined();
      expect(algorithmsChannel!.totalQuestions).toBe(1);
      expect(algorithmsChannel!.complianceRate).toBe(100);
      expect(algorithmsChannel!.averageScore).toBe(90);
    });
  });

  describe('Trends Calculation', () => {
    it('should calculate daily trends correctly', () => {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const events: ValidationEvent[] = [
        {
          questionId: 'q1',
          timestamp: `${today}T10:00:00Z`,
          pattern: 'comparison-table',
          score: 85,
          passed: true,
          violationCount: 0,
          autoFixable: false
        },
        {
          questionId: 'q2',
          timestamp: `${yesterday}T11:00:00Z`,
          pattern: 'definition',
          score: 60,
          passed: false,
          violationCount: 2,
          autoFixable: true
        }
      ];

      events.forEach(event => metricsCollector.recordValidation(event));
      const metrics = metricsCollector.getMetrics();

      expect(metrics.trends).toHaveLength(30); // Last 30 days
      
      const todayTrend = metrics.trends.find(t => t.date === today);
      expect(todayTrend).toBeDefined();
      expect(todayTrend!.complianceRate).toBe(100);
      expect(todayTrend!.totalQuestions).toBe(1);

      const yesterdayTrend = metrics.trends.find(t => t.date === yesterday);
      expect(yesterdayTrend).toBeDefined();
      expect(yesterdayTrend!.complianceRate).toBe(0);
      expect(yesterdayTrend!.totalQuestions).toBe(1);
    });
  });

  describe('Data Persistence', () => {
    it('should persist metrics to localStorage', () => {
      const event: ValidationEvent = {
        questionId: 'q1',
        timestamp: '2024-01-01T10:00:00Z',
        pattern: 'comparison-table',
        score: 85,
        passed: true,
        violationCount: 0,
        autoFixable: false
      };

      metricsCollector.recordValidation(event);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'answer-formatting:metrics',
        expect.any(String)
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'answer-formatting:metrics:validation-events',
        expect.any(String)
      );
    });

    it('should load metrics from localStorage', () => {
      const mockMetrics = {
        totalQuestions: 5,
        totalValidations: 10,
        complianceRate: 80,
        averageScore: 85
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockMetrics));
      
      // Test that loading doesn't throw errors and returns valid metrics
      expect(() => {
        const metrics = metricsCollector.getMetrics();
        expect(metrics).toBeDefined();
        expect(typeof metrics.totalQuestions).toBe('number');
        expect(typeof metrics.complianceRate).toBe('number');
      }).not.toThrow();
    });

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      // Should not throw error
      expect(() => {
        const newCollector = MetricsCollector.getInstance();
      }).not.toThrow();
    });
  });

  describe('Utility Methods', () => {
    it('should clear all metrics', () => {
      // Add some data first
      const event: ValidationEvent = {
        questionId: 'q1',
        timestamp: '2024-01-01T10:00:00Z',
        pattern: 'comparison-table',
        score: 85,
        passed: true,
        violationCount: 0,
        autoFixable: false
      };

      metricsCollector.recordValidation(event);
      expect(metricsCollector.getMetrics().totalQuestions).toBe(1);

      // Clear metrics
      metricsCollector.clearMetrics();
      expect(metricsCollector.getMetrics().totalQuestions).toBe(0);
    });

    it('should export data correctly', () => {
      const validationEvent: ValidationEvent = {
        questionId: 'q1',
        timestamp: '2024-01-01T10:00:00Z',
        pattern: 'comparison-table',
        score: 85,
        passed: true,
        violationCount: 0,
        autoFixable: false
      };

      const autoFixEvent: AutoFixEvent = {
        questionId: 'q1',
        timestamp: '2024-01-01T10:01:00Z',
        violationType: 'missing-headers',
        success: true,
        beforeScore: 60,
        afterScore: 85
      };

      metricsCollector.recordValidation(validationEvent);
      metricsCollector.recordAutoFix(autoFixEvent);

      const exportedData = metricsCollector.exportData();

      expect(exportedData.metrics).toBeDefined();
      expect(exportedData.validationEvents).toHaveLength(1);
      expect(exportedData.autoFixEvents).toHaveLength(1);
      expect(exportedData.patternDetectionEvents).toHaveLength(0);
    });

    it('should get metrics for date range', () => {
      const events: ValidationEvent[] = [
        {
          questionId: 'q1',
          timestamp: '2024-01-01T10:00:00Z',
          pattern: 'comparison-table',
          score: 85,
          passed: true,
          violationCount: 0,
          autoFixable: false
        },
        {
          questionId: 'q2',
          timestamp: '2024-01-02T11:00:00Z',
          pattern: 'definition',
          score: 60,
          passed: false,
          violationCount: 2,
          autoFixable: true
        },
        {
          questionId: 'q3',
          timestamp: '2024-01-03T12:00:00Z',
          pattern: 'list',
          score: 90,
          passed: true,
          violationCount: 0,
          autoFixable: false
        }
      ];

      events.forEach(event => metricsCollector.recordValidation(event));

      // Get metrics for Jan 1-2 only
      const filteredMetrics = metricsCollector.getMetricsForDateRange(
        '2024-01-01T00:00:00Z',
        '2024-01-02T23:59:59Z'
      );

      expect(filteredMetrics.totalQuestions).toBe(2);
      expect(filteredMetrics.complianceRate).toBe(50); // 1 out of 2 passed
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty metrics correctly', () => {
      const metrics = metricsCollector.getMetrics();

      expect(metrics.totalQuestions).toBe(0);
      expect(metrics.complianceRate).toBe(0);
      expect(metrics.averageScore).toBe(0);
      expect(metrics.validationPassRate).toBe(0);
      expect(metrics.autoFixSuccessRate).toBe(0);
      expect(metrics.patternUsage).toEqual({});
      expect(metrics.channelBreakdown).toEqual([]);
    });

    it('should handle single event correctly', () => {
      const event: ValidationEvent = {
        questionId: 'q1',
        timestamp: '2024-01-01T10:00:00Z',
        pattern: 'comparison-table',
        score: 85,
        passed: true,
        violationCount: 1,
        autoFixable: false
      };

      metricsCollector.recordValidation(event);
      const metrics = metricsCollector.getMetrics();

      expect(metrics.totalQuestions).toBe(1);
      expect(metrics.complianceRate).toBe(100);
      expect(metrics.averageScore).toBe(85);
      expect(metrics.validationPassRate).toBe(100);
      expect(metrics.averageViolationsPerQuestion).toBe(1);
    });
  });
});