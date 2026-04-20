/**
 * Unit tests for Configuration Manager
 * 
 * Tests configuration persistence, settings management, validation rules,
 * override functionality, and metrics tracking.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ConfigurationManager, ConfigurationSettings, OverrideRecord } from './configuration-manager';
import { ValidationRule } from './types';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('ConfigurationManager', () => {
  let configManager: ConfigurationManager;

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    
    // Reset singleton instance
    (ConfigurationManager as any).instance = null;
    configManager = ConfigurationManager.getInstance();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = ConfigurationManager.getInstance();
      const instance2 = ConfigurationManager.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Configuration Management', () => {
    it('should initialize with default configuration', () => {
      const config = configManager.getConfiguration();
      expect(config).toBeDefined();
      expect(config?.version).toBe('1.0.0');
      expect(config?.autoFormatEnabled).toBe(true);
      expect(config?.strictMode).toBe(false);
      expect(config?.patterns).toBeDefined();
      expect(config?.validationRules).toBeDefined();
    });

    it('should update configuration', () => {
      const updates = {
        autoFormatEnabled: false,
        strictMode: true,
      };
      
      configManager.updateConfiguration(updates);
      const config = configManager.getConfiguration();
      
      expect(config?.autoFormatEnabled).toBe(false);
      expect(config?.strictMode).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should reset configuration to defaults', () => {
      // First modify configuration
      configManager.updateConfiguration({ autoFormatEnabled: false });
      
      // Then reset
      configManager.resetConfiguration();
      const config = configManager.getConfiguration();
      
      expect(config?.autoFormatEnabled).toBe(true);
      expect(config?.strictMode).toBe(false);
    });

    it('should export configuration as JSON', () => {
      const exported = configManager.exportConfiguration();
      const parsed = JSON.parse(exported);
      
      expect(parsed).toHaveProperty('config');
      expect(parsed).toHaveProperty('settings');
      expect(parsed).toHaveProperty('overrides');
      expect(parsed).toHaveProperty('metrics');
    });

    it('should import configuration from JSON', () => {
      const importData = {
        config: {
          version: '2.0.0',
          autoFormatEnabled: false,
          strictMode: true,
          patterns: [],
          validationRules: [],
        },
        settings: {
          autoFormatEnabled: false,
          strictMode: true,
          validationEnabled: false,
          showSuggestions: false,
          autoApplyFixes: true,
          maxValidationScore: 90,
        },
      };
      
      configManager.importConfiguration(JSON.stringify(importData));
      const config = configManager.getConfiguration();
      const settings = configManager.getSettings();
      
      expect(config?.version).toBe('2.0.0');
      expect(config?.autoFormatEnabled).toBe(false);
      expect(settings.maxValidationScore).toBe(90);
    });

    it('should handle invalid import data', () => {
      expect(() => {
        configManager.importConfiguration('invalid json');
      }).toThrow('Invalid configuration data');
    });
  });

  describe('Settings Management', () => {
    it('should get default settings', () => {
      const settings = configManager.getSettings();
      expect(settings.autoFormatEnabled).toBe(true);
      expect(settings.strictMode).toBe(false);
      expect(settings.validationEnabled).toBe(true);
      expect(settings.showSuggestions).toBe(true);
      expect(settings.autoApplyFixes).toBe(false);
      expect(settings.maxValidationScore).toBe(80);
    });

    it('should update settings', () => {
      const updates: Partial<ConfigurationSettings> = {
        autoFormatEnabled: false,
        maxValidationScore: 90,
      };
      
      configManager.updateSettings(updates);
      const settings = configManager.getSettings();
      
      expect(settings.autoFormatEnabled).toBe(false);
      expect(settings.maxValidationScore).toBe(90);
      expect(settings.strictMode).toBe(false); // Should remain unchanged
    });

    it('should get specific setting value', () => {
      const autoFormat = configManager.getSetting('autoFormatEnabled');
      const maxScore = configManager.getSetting('maxValidationScore');
      
      expect(autoFormat).toBe(true);
      expect(maxScore).toBe(80);
    });

    it('should set specific setting value', () => {
      configManager.setSetting('strictMode', true);
      configManager.setSetting('maxValidationScore', 95);
      
      expect(configManager.getSetting('strictMode')).toBe(true);
      expect(configManager.getSetting('maxValidationScore')).toBe(95);
    });
  });

  describe('Validation Rules Management', () => {
    it('should get validation rules', () => {
      const rules = configManager.getValidationRules();
      expect(Array.isArray(rules)).toBe(true);
      expect(rules.length).toBeGreaterThan(0);
      
      // Check default rules exist
      const tableRule = rules.find(rule => rule.id === 'table-structure');
      expect(tableRule).toBeDefined();
      expect(tableRule?.enabled).toBe(true);
    });

    it('should update validation rule', () => {
      configManager.updateValidationRule('table-structure', {
        enabled: false,
        severity: 'warning',
      });
      
      const rules = configManager.getValidationRules();
      const tableRule = rules.find(rule => rule.id === 'table-structure');
      
      expect(tableRule?.enabled).toBe(false);
      expect(tableRule?.severity).toBe('warning');
    });

    it('should toggle validation rule', () => {
      // Initially enabled
      expect(configManager.getValidationRules().find(r => r.id === 'table-structure')?.enabled).toBe(true);
      
      // Toggle off
      configManager.toggleValidationRule('table-structure', false);
      expect(configManager.getValidationRules().find(r => r.id === 'table-structure')?.enabled).toBe(false);
      
      // Toggle on
      configManager.toggleValidationRule('table-structure', true);
      expect(configManager.getValidationRules().find(r => r.id === 'table-structure')?.enabled).toBe(true);
    });

    it('should get enabled rules for pattern', () => {
      const comparisonRules = configManager.getEnabledRulesForPattern('comparison-table');
      expect(Array.isArray(comparisonRules)).toBe(true);
      
      // All returned rules should be enabled and for the correct pattern
      comparisonRules.forEach(rule => {
        expect(rule.enabled).toBe(true);
        expect(rule.pattern).toBe('comparison-table');
      });
    });
  });

  describe('Override Management', () => {
    const sampleOverride: Omit<OverrideRecord, 'timestamp'> = {
      questionId: 'test-question-1',
      justification: 'This question requires special formatting due to unique content structure',
      originalPattern: 'comparison-table',
      overridePattern: 'definition',
      userId: 'test-user',
    };

    it('should add override', () => {
      configManager.addOverride(sampleOverride);
      
      const overrides = configManager.getOverrides();
      expect(overrides).toHaveLength(1);
      expect(overrides[0].questionId).toBe(sampleOverride.questionId);
      expect(overrides[0].justification).toBe(sampleOverride.justification);
      expect(overrides[0].timestamp).toBeDefined();
    });

    it('should get override for question', () => {
      configManager.addOverride(sampleOverride);
      
      const override = configManager.getOverrideForQuestion('test-question-1');
      expect(override).toBeDefined();
      expect(override?.questionId).toBe('test-question-1');
      
      const nonExistent = configManager.getOverrideForQuestion('non-existent');
      expect(nonExistent).toBeNull();
    });

    it('should check if question has override', () => {
      expect(configManager.hasOverride('test-question-1')).toBe(false);
      
      configManager.addOverride(sampleOverride);
      expect(configManager.hasOverride('test-question-1')).toBe(true);
      expect(configManager.hasOverride('other-question')).toBe(false);
    });

    it('should remove override', () => {
      configManager.addOverride(sampleOverride);
      expect(configManager.hasOverride('test-question-1')).toBe(true);
      
      configManager.removeOverride('test-question-1');
      expect(configManager.hasOverride('test-question-1')).toBe(false);
      expect(configManager.getOverrides()).toHaveLength(0);
    });

    it('should get all overrides', () => {
      const override1 = { ...sampleOverride, questionId: 'question-1' };
      const override2 = { ...sampleOverride, questionId: 'question-2' };
      
      configManager.addOverride(override1);
      configManager.addOverride(override2);
      
      const overrides = configManager.getOverrides();
      expect(overrides).toHaveLength(2);
      expect(overrides.map(o => o.questionId)).toContain('question-1');
      expect(overrides.map(o => o.questionId)).toContain('question-2');
    });
  });

  describe('Metrics Management', () => {
    it('should get default metrics', () => {
      const metrics = configManager.getMetrics();
      expect(metrics.totalValidations).toBe(0);
      expect(metrics.autoFormatsApplied).toBe(0);
      expect(metrics.manualOverrides).toBe(0);
      expect(metrics.averageValidationScore).toBe(0);
      expect(metrics.lastUpdated).toBeDefined();
    });

    it('should update metrics', () => {
      const updates = {
        totalValidations: 100,
        autoFormatsApplied: 50,
        averageValidationScore: 85.5,
      };
      
      configManager.updateMetrics(updates);
      const metrics = configManager.getMetrics();
      
      expect(metrics.totalValidations).toBe(100);
      expect(metrics.autoFormatsApplied).toBe(50);
      expect(metrics.averageValidationScore).toBe(85.5);
    });

    it('should increment validation count', () => {
      const initialMetrics = configManager.getMetrics();
      
      configManager.incrementValidationCount();
      const updatedMetrics = configManager.getMetrics();
      
      expect(updatedMetrics.totalValidations).toBe(initialMetrics.totalValidations + 1);
    });

    it('should increment auto-format count', () => {
      const initialMetrics = configManager.getMetrics();
      
      configManager.incrementAutoFormatCount();
      const updatedMetrics = configManager.getMetrics();
      
      expect(updatedMetrics.autoFormatsApplied).toBe(initialMetrics.autoFormatsApplied + 1);
    });

    it('should update average validation score', () => {
      // Start with some existing data
      configManager.updateMetrics({ totalValidations: 2, averageValidationScore: 80 });
      
      // Add a new score
      configManager.updateAverageValidationScore(90);
      
      const metrics = configManager.getMetrics();
      // (80 * 2 + 90) / 3 = 83.33...
      expect(metrics.averageValidationScore).toBeCloseTo(83.33, 2);
    });

    it('should reset metrics', () => {
      // Set some metrics
      configManager.updateMetrics({
        totalValidations: 100,
        autoFormatsApplied: 50,
        manualOverrides: 10,
        averageValidationScore: 85,
      });
      
      // Reset
      configManager.resetMetrics();
      const metrics = configManager.getMetrics();
      
      expect(metrics.totalValidations).toBe(0);
      expect(metrics.autoFormatsApplied).toBe(0);
      expect(metrics.manualOverrides).toBe(0);
      expect(metrics.averageValidationScore).toBe(0);
    });

    it('should track override metrics when adding overrides', () => {
      const initialMetrics = configManager.getMetrics();
      
      configManager.addOverride({
        questionId: 'test-question',
        justification: 'Test justification',
      });
      
      const updatedMetrics = configManager.getMetrics();
      expect(updatedMetrics.manualOverrides).toBe(initialMetrics.manualOverrides + 1);
    });
  });

  describe('Data Persistence', () => {
    it('should save configuration to localStorage', () => {
      configManager.updateSettings({ autoFormatEnabled: false });
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'answer-formatting:config',
        expect.any(String)
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'answer-formatting:config:settings',
        expect.any(String)
      );
    });

    it('should load configuration from localStorage', () => {
      const mockConfig = {
        version: '1.0.0',
        patterns: [],
        validationRules: [],
        autoFormatEnabled: false,
        strictMode: true,
      };
      
      const mockSettings = {
        autoFormatEnabled: false,
        strictMode: true,
        validationEnabled: true,
        showSuggestions: false,
        autoApplyFixes: true,
        maxValidationScore: 95,
      };
      
      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === 'answer-formatting:config') {
          return JSON.stringify(mockConfig);
        }
        if (key === 'answer-formatting:config:settings') {
          return JSON.stringify(mockSettings);
        }
        return null;
      });
      
      // Create new instance to trigger loading
      (ConfigurationManager as any).instance = null;
      const newManager = ConfigurationManager.getInstance();
      
      const config = newManager.getConfiguration();
      const settings = newManager.getSettings();
      
      expect(config?.autoFormatEnabled).toBe(false);
      expect(config?.strictMode).toBe(true);
      expect(settings.maxValidationScore).toBe(95);
    });

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });
      
      // Should not throw, should initialize with defaults
      (ConfigurationManager as any).instance = null;
      const newManager = ConfigurationManager.getInstance();
      
      const config = newManager.getConfiguration();
      expect(config).toBeDefined();
      expect(config?.version).toBe('1.0.0');
    });

    it('should clear all configuration data', () => {
      configManager.clearConfiguration();
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('answer-formatting:config');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('answer-formatting:config:settings');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('answer-formatting:config:overrides');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('answer-formatting:metrics');
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON in localStorage', () => {
      localStorageMock.getItem.mockReturnValue('invalid json');
      
      // Should not throw, should initialize with defaults
      (ConfigurationManager as any).instance = null;
      const newManager = ConfigurationManager.getInstance();
      
      const config = newManager.getConfiguration();
      expect(config).toBeDefined();
    });

    it('should handle localStorage save errors', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });
      
      // Should not throw
      expect(() => {
        configManager.updateSettings({ autoFormatEnabled: false });
      }).not.toThrow();
    });
  });
});