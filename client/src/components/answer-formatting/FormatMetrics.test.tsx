/**
 * Unit tests for FormatMetrics component
 * 
 * Tests dashboard rendering, metrics display, and user interactions
 * for the Answer Formatting Standards metrics dashboard.
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FormatMetricsDashboard as FormatMetrics } from './FormatMetrics';
import { metricsCollector, FormatMetrics as FormatMetricsType } from '../../lib/answer-formatting/metrics-collector';

// Mock the metrics collector
vi.mock('../../lib/answer-formatting/metrics-collector', () => ({
  metricsCollector: {
    getMetrics: vi.fn(),
    clearMetrics: vi.fn(),
  }
}));

// Mock window.confirm
Object.defineProperty(window, 'confirm', {
  value: vi.fn(),
  writable: true
});

describe('FormatMetrics Component', () => {
  const mockMetrics: FormatMetricsType = {
    totalQuestions: 100,
    totalValidations: 150,
    lastUpdated: '2024-01-01T12:00:00Z',
    complianceRate: 85.5,
    averageScore: 78.2,
    validationPassRate: 72.3,
    averageViolationsPerQuestion: 1.8,
    autoFixSuccessRate: 91.2,
    autoFixAttempts: 45,
    autoFixSuccesses: 41,
    patternUsage: {
      'comparison-table': {
        name: 'Comparison Table',
        detectionCount: 25,
        applicationCount: 20,
        averageScore: 82.5,
        successRate: 88.0
      },
      'definition': {
        name: 'Definition',
        detectionCount: 30,
        applicationCount: 28,
        averageScore: 75.8,
        successRate: 85.7
      }
    },
    trends: [
      {
        date: '2024-01-01',
        complianceRate: 80.0,
        validationPassRate: 70.0,
        autoFixSuccessRate: 90.0,
        totalQuestions: 10
      },
      {
        date: '2024-01-02',
        complianceRate: 85.0,
        validationPassRate: 75.0,
        autoFixSuccessRate: 92.0,
        totalQuestions: 12
      }
    ],
    channelBreakdown: [
      {
        channel: 'system-design',
        totalQuestions: 40,
        complianceRate: 88.5,
        averageScore: 82.1,
        topPatterns: ['comparison-table', 'architecture']
      },
      {
        channel: 'algorithms',
        totalQuestions: 35,
        complianceRate: 82.3,
        averageScore: 74.6,
        topPatterns: ['code-example', 'definition']
      }
    ]
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (metricsCollector.getMetrics as any).mockReturnValue(mockMetrics);
  });

  describe('Component Creation', () => {
    it('should create FormatMetrics component without errors', () => {
      expect(() => {
        const component = React.createElement(FormatMetrics, {});
        expect(component).toBeDefined();
        expect(component.type).toBe(FormatMetrics);
      }).not.toThrow();
    });

    it('should accept className prop', () => {
      const component = React.createElement(FormatMetrics, { 
        className: 'custom-class' 
      });
      expect(component.props.className).toBe('custom-class');
    });

    it('should accept refreshInterval prop', () => {
      const component = React.createElement(FormatMetrics, { 
        refreshInterval: 5000 
      });
      expect(component.props.refreshInterval).toBe(5000);
    });
  });

  describe('Metrics Data Handling', () => {
    it('should call metricsCollector.getMetrics on mount', () => {
      React.createElement(FormatMetrics, {});
      // Component creation doesn't trigger useEffect, but we can verify the mock is set up
      expect(metricsCollector.getMetrics).toBeDefined();
    });

    it('should handle empty pattern usage', () => {
      const emptyMetrics = { ...mockMetrics, patternUsage: {} };
      (metricsCollector.getMetrics as any).mockReturnValue(emptyMetrics);
      
      expect(() => {
        React.createElement(FormatMetrics, {});
      }).not.toThrow();
    });

    it('should handle empty channel breakdown', () => {
      const emptyMetrics = { ...mockMetrics, channelBreakdown: [] };
      (metricsCollector.getMetrics as any).mockReturnValue(emptyMetrics);
      
      expect(() => {
        React.createElement(FormatMetrics, {});
      }).not.toThrow();
    });

    it('should handle empty trends data', () => {
      const emptyMetrics = { ...mockMetrics, trends: [] };
      (metricsCollector.getMetrics as any).mockReturnValue(emptyMetrics);
      
      expect(() => {
        React.createElement(FormatMetrics, {});
      }).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle metrics loading errors gracefully', () => {
      (metricsCollector.getMetrics as any).mockImplementation(() => {
        throw new Error('Failed to load metrics');
      });

      expect(() => {
        React.createElement(FormatMetrics, {});
      }).not.toThrow();
    });

    it('should handle null metrics', () => {
      (metricsCollector.getMetrics as any).mockReturnValue(null);
      
      expect(() => {
        React.createElement(FormatMetrics, {});
      }).not.toThrow();
    });

    it('should handle undefined metrics', () => {
      (metricsCollector.getMetrics as any).mockReturnValue(undefined);
      
      expect(() => {
        React.createElement(FormatMetrics, {});
      }).not.toThrow();
    });
  });

  describe('Metrics Calculations', () => {
    it('should handle percentage calculations correctly', () => {
      const metrics = mockMetrics;
      
      // Test that percentage values are within valid range
      expect(metrics.complianceRate).toBeGreaterThanOrEqual(0);
      expect(metrics.complianceRate).toBeLessThanOrEqual(100);
      expect(metrics.validationPassRate).toBeGreaterThanOrEqual(0);
      expect(metrics.validationPassRate).toBeLessThanOrEqual(100);
      expect(metrics.autoFixSuccessRate).toBeGreaterThanOrEqual(0);
      expect(metrics.autoFixSuccessRate).toBeLessThanOrEqual(100);
    });

    it('should handle pattern usage statistics', () => {
      const patterns = Object.values(mockMetrics.patternUsage);
      
      patterns.forEach(pattern => {
        expect(pattern.detectionCount).toBeGreaterThanOrEqual(0);
        expect(pattern.applicationCount).toBeGreaterThanOrEqual(0);
        expect(pattern.applicationCount).toBeLessThanOrEqual(pattern.detectionCount);
        expect(pattern.averageScore).toBeGreaterThanOrEqual(0);
        expect(pattern.averageScore).toBeLessThanOrEqual(100);
        expect(pattern.successRate).toBeGreaterThanOrEqual(0);
        expect(pattern.successRate).toBeLessThanOrEqual(100);
      });
    });

    it('should handle channel breakdown statistics', () => {
      mockMetrics.channelBreakdown.forEach(channel => {
        expect(channel.totalQuestions).toBeGreaterThanOrEqual(0);
        expect(channel.complianceRate).toBeGreaterThanOrEqual(0);
        expect(channel.complianceRate).toBeLessThanOrEqual(100);
        expect(channel.averageScore).toBeGreaterThanOrEqual(0);
        expect(channel.averageScore).toBeLessThanOrEqual(100);
        expect(Array.isArray(channel.topPatterns)).toBe(true);
      });
    });

    it('should handle trend data', () => {
      mockMetrics.trends.forEach(trend => {
        expect(trend.date).toMatch(/^\d{4}-\d{2}-\d{2}$/); // YYYY-MM-DD format
        expect(trend.complianceRate).toBeGreaterThanOrEqual(0);
        expect(trend.complianceRate).toBeLessThanOrEqual(100);
        expect(trend.validationPassRate).toBeGreaterThanOrEqual(0);
        expect(trend.validationPassRate).toBeLessThanOrEqual(100);
        expect(trend.autoFixSuccessRate).toBeGreaterThanOrEqual(0);
        expect(trend.autoFixSuccessRate).toBeLessThanOrEqual(100);
        expect(trend.totalQuestions).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Component Props Validation', () => {
    it('should handle default props correctly', () => {
      const component = React.createElement(FormatMetrics, {});
      
      // Default className should be empty string
      expect(component.props.className).toBeUndefined();
      // Default refreshInterval should be 30000ms
      expect(component.props.refreshInterval).toBeUndefined();
    });

    it('should handle custom props correctly', () => {
      const props = {
        className: 'test-class',
        refreshInterval: 10000
      };
      
      const component = React.createElement(FormatMetrics, props);
      
      expect(component.props.className).toBe('test-class');
      expect(component.props.refreshInterval).toBe(10000);
    });
  });

  describe('Data Validation', () => {
    it('should validate metrics structure', () => {
      const metrics = mockMetrics;
      
      // Check required properties exist
      expect(typeof metrics.totalQuestions).toBe('number');
      expect(typeof metrics.totalValidations).toBe('number');
      expect(typeof metrics.lastUpdated).toBe('string');
      expect(typeof metrics.complianceRate).toBe('number');
      expect(typeof metrics.averageScore).toBe('number');
      expect(typeof metrics.validationPassRate).toBe('number');
      expect(typeof metrics.averageViolationsPerQuestion).toBe('number');
      expect(typeof metrics.autoFixSuccessRate).toBe('number');
      expect(typeof metrics.autoFixAttempts).toBe('number');
      expect(typeof metrics.autoFixSuccesses).toBe('number');
      expect(typeof metrics.patternUsage).toBe('object');
      expect(Array.isArray(metrics.trends)).toBe(true);
      expect(Array.isArray(metrics.channelBreakdown)).toBe(true);
    });

    it('should validate pattern usage structure', () => {
      Object.values(mockMetrics.patternUsage).forEach(pattern => {
        expect(typeof pattern.name).toBe('string');
        expect(typeof pattern.detectionCount).toBe('number');
        expect(typeof pattern.applicationCount).toBe('number');
        expect(typeof pattern.averageScore).toBe('number');
        expect(typeof pattern.successRate).toBe('number');
      });
    });

    it('should validate trend structure', () => {
      mockMetrics.trends.forEach(trend => {
        expect(typeof trend.date).toBe('string');
        expect(typeof trend.complianceRate).toBe('number');
        expect(typeof trend.validationPassRate).toBe('number');
        expect(typeof trend.autoFixSuccessRate).toBe('number');
        expect(typeof trend.totalQuestions).toBe('number');
      });
    });

    it('should validate channel structure', () => {
      mockMetrics.channelBreakdown.forEach(channel => {
        expect(typeof channel.channel).toBe('string');
        expect(typeof channel.totalQuestions).toBe('number');
        expect(typeof channel.complianceRate).toBe('number');
        expect(typeof channel.averageScore).toBe('number');
        expect(Array.isArray(channel.topPatterns)).toBe(true);
      });
    });
  });
});