/**
 * Configuration Manager for Answer Formatting Standards
 * 
 * This module handles configuration storage, retrieval, and management
 * for the answer formatting system. It provides localStorage persistence
 * and settings management for auto-format, strict mode, and validation rules.
 */

import { PatternConfig, ValidationRule, STORAGE_KEYS } from './types';
import { patternLibrary } from './pattern-library';

export interface ConfigurationSettings {
  autoFormatEnabled: boolean;
  strictMode: boolean;
  validationEnabled: boolean;
  showSuggestions: boolean;
  autoApplyFixes: boolean;
  maxValidationScore: number; // Minimum score to pass validation (0-100)
}

export interface OverrideRecord {
  questionId: string;
  timestamp: string;
  justification: string;
  originalPattern?: string;
  overridePattern?: string;
  userId?: string;
}

export interface ConfigurationMetrics {
  totalValidations: number;
  autoFormatsApplied: number;
  manualOverrides: number;
  averageValidationScore: number;
  lastUpdated: string;
}

/**
 * Default configuration settings
 */
const DEFAULT_SETTINGS: ConfigurationSettings = {
  autoFormatEnabled: true,
  strictMode: false,
  validationEnabled: true,
  showSuggestions: true,
  autoApplyFixes: false,
  maxValidationScore: 80,
};

const DEFAULT_VALIDATION_RULES: ValidationRule[] = [
  {
    id: 'table-structure',
    pattern: 'comparison-table',
    severity: 'error',
    enabled: true,
    autoFix: true,
  },
  {
    id: 'definition-format',
    pattern: 'definition',
    severity: 'warning',
    enabled: true,
    autoFix: true,
  },
  {
    id: 'list-conciseness',
    pattern: 'list',
    severity: 'info',
    enabled: true,
    autoFix: false,
  },
  {
    id: 'code-blocks',
    pattern: 'code-example',
    severity: 'error',
    enabled: true,
    autoFix: true,
  },
  {
    id: 'pros-cons-balance',
    pattern: 'pros-cons',
    severity: 'warning',
    enabled: true,
    autoFix: true,
  },
];

/**
 * Configuration Manager class for handling all configuration-related operations
 */
export class ConfigurationManager {
  private static instance: ConfigurationManager;
  private config: PatternConfig | null = null;
  private settings: ConfigurationSettings;
  private overrides: OverrideRecord[] = [];
  private metrics: ConfigurationMetrics;

  private constructor() {
    this.settings = { ...DEFAULT_SETTINGS };
    this.metrics = {
      totalValidations: 0,
      autoFormatsApplied: 0,
      manualOverrides: 0,
      averageValidationScore: 0,
      lastUpdated: new Date().toISOString(),
    };
    this.loadConfiguration();
  }

  /**
   * Get singleton instance of ConfigurationManager
   */
  public static getInstance(): ConfigurationManager {
    if (!ConfigurationManager.instance) {
      ConfigurationManager.instance = new ConfigurationManager();
    }
    return ConfigurationManager.instance;
  }

  /**
   * Load configuration from localStorage
   */
  private loadConfiguration(): void {
    try {
      // Load main configuration
      const configData = localStorage.getItem(STORAGE_KEYS.PATTERN_CONFIG);
      if (configData) {
        this.config = JSON.parse(configData);
      } else {
        this.initializeDefaultConfig();
      }

      // Load settings
      const settingsData = localStorage.getItem(`${STORAGE_KEYS.PATTERN_CONFIG}:settings`);
      if (settingsData) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(settingsData) };
      }

      // Load overrides
      const overridesData = localStorage.getItem(`${STORAGE_KEYS.PATTERN_CONFIG}:overrides`);
      if (overridesData) {
        this.overrides = JSON.parse(overridesData);
      }

      // Load metrics
      const metricsData = localStorage.getItem(STORAGE_KEYS.METRICS);
      if (metricsData) {
        this.metrics = { ...this.metrics, ...JSON.parse(metricsData) };
      }
    } catch (error) {
      console.error('Failed to load configuration:', error);
      this.initializeDefaultConfig();
    }
  }

  /**
   * Initialize default configuration
   */
  private initializeDefaultConfig(): void {
    this.config = {
      version: '1.0.0',
      patterns: patternLibrary.getAllPatterns(),
      validationRules: [...DEFAULT_VALIDATION_RULES],
      autoFormatEnabled: true,
      strictMode: false,
    };
    this.saveConfiguration();
  }

  /**
   * Save configuration to localStorage
   */
  private saveConfiguration(): void {
    try {
      if (this.config) {
        localStorage.setItem(STORAGE_KEYS.PATTERN_CONFIG, JSON.stringify(this.config));
      }
      localStorage.setItem(`${STORAGE_KEYS.PATTERN_CONFIG}:settings`, JSON.stringify(this.settings));
      localStorage.setItem(`${STORAGE_KEYS.PATTERN_CONFIG}:overrides`, JSON.stringify(this.overrides));
      localStorage.setItem(STORAGE_KEYS.METRICS, JSON.stringify(this.metrics));
    } catch (error) {
      console.error('Failed to save configuration:', error);
    }
  }

  // ============================================================================
  // Configuration Methods
  // ============================================================================

  /**
   * Get current configuration
   */
  public getConfiguration(): PatternConfig | null {
    return this.config;
  }

  /**
   * Update configuration
   */
  public updateConfiguration(config: Partial<PatternConfig>): void {
    if (this.config) {
      this.config = { ...this.config, ...config };
      this.saveConfiguration();
    }
  }

  /**
   * Reset configuration to defaults
   */
  public resetConfiguration(): void {
    this.initializeDefaultConfig();
  }

  // ============================================================================
  // Settings Methods
  // ============================================================================

  /**
   * Get current settings
   */
  public getSettings(): ConfigurationSettings {
    return { ...this.settings };
  }

  /**
   * Update settings
   */
  public updateSettings(settings: Partial<ConfigurationSettings>): void {
    this.settings = { ...this.settings, ...settings };
    this.saveConfiguration();
  }

  /**
   * Get specific setting value
   */
  public getSetting<K extends keyof ConfigurationSettings>(key: K): ConfigurationSettings[K] {
    return this.settings[key];
  }

  /**
   * Set specific setting value
   */
  public setSetting<K extends keyof ConfigurationSettings>(
    key: K,
    value: ConfigurationSettings[K]
  ): void {
    this.settings[key] = value;
    this.saveConfiguration();
  }

  // ============================================================================
  // Validation Rules Methods
  // ============================================================================

  /**
   * Get validation rules
   */
  public getValidationRules(): ValidationRule[] {
    return this.config?.validationRules || [];
  }

  /**
   * Update validation rule
   */
  public updateValidationRule(ruleId: string, updates: Partial<ValidationRule>): void {
    if (this.config) {
      const ruleIndex = this.config.validationRules.findIndex(rule => rule.id === ruleId);
      if (ruleIndex !== -1) {
        this.config.validationRules[ruleIndex] = {
          ...this.config.validationRules[ruleIndex],
          ...updates,
        };
        this.saveConfiguration();
      }
    }
  }

  /**
   * Enable/disable validation rule
   */
  public toggleValidationRule(ruleId: string, enabled: boolean): void {
    this.updateValidationRule(ruleId, { enabled });
  }

  /**
   * Get enabled validation rules for a pattern
   */
  public getEnabledRulesForPattern(patternId: string): ValidationRule[] {
    return this.getValidationRules().filter(
      rule => rule.enabled && rule.pattern === patternId
    );
  }

  // ============================================================================
  // Override Methods
  // ============================================================================

  /**
   * Add manual override record
   */
  public addOverride(override: Omit<OverrideRecord, 'timestamp'>): void {
    const record: OverrideRecord = {
      ...override,
      timestamp: new Date().toISOString(),
    };
    this.overrides.push(record);
    this.metrics.manualOverrides++;
    this.metrics.lastUpdated = new Date().toISOString();
    this.saveConfiguration();
  }

  /**
   * Get override records
   */
  public getOverrides(): OverrideRecord[] {
    return [...this.overrides];
  }

  /**
   * Get override for specific question
   */
  public getOverrideForQuestion(questionId: string): OverrideRecord | null {
    return this.overrides.find(override => override.questionId === questionId) || null;
  }

  /**
   * Remove override record
   */
  public removeOverride(questionId: string): void {
    this.overrides = this.overrides.filter(override => override.questionId !== questionId);
    this.saveConfiguration();
  }

  /**
   * Check if question has override
   */
  public hasOverride(questionId: string): boolean {
    return this.overrides.some(override => override.questionId === questionId);
  }

  // ============================================================================
  // Metrics Methods
  // ============================================================================

  /**
   * Get configuration metrics
   */
  public getMetrics(): ConfigurationMetrics {
    return { ...this.metrics };
  }

  /**
   * Update metrics
   */
  public updateMetrics(updates: Partial<ConfigurationMetrics>): void {
    this.metrics = { ...this.metrics, ...updates, lastUpdated: new Date().toISOString() };
    this.saveConfiguration();
  }

  /**
   * Increment validation count
   */
  public incrementValidationCount(): void {
    this.metrics.totalValidations++;
    this.metrics.lastUpdated = new Date().toISOString();
    this.saveConfiguration();
  }

  /**
   * Increment auto-format count
   */
  public incrementAutoFormatCount(): void {
    this.metrics.autoFormatsApplied++;
    this.metrics.lastUpdated = new Date().toISOString();
    this.saveConfiguration();
  }

  /**
   * Update average validation score
   */
  public updateAverageValidationScore(newScore: number): void {
    const totalScores = this.metrics.averageValidationScore * this.metrics.totalValidations;
    this.metrics.averageValidationScore = (totalScores + newScore) / (this.metrics.totalValidations + 1);
    this.saveConfiguration();
  }

  /**
   * Reset metrics
   */
  public resetMetrics(): void {
    this.metrics = {
      totalValidations: 0,
      autoFormatsApplied: 0,
      manualOverrides: 0,
      averageValidationScore: 0,
      lastUpdated: new Date().toISOString(),
    };
    this.saveConfiguration();
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Export configuration as JSON
   */
  public exportConfiguration(): string {
    return JSON.stringify({
      config: this.config,
      settings: this.settings,
      overrides: this.overrides,
      metrics: this.metrics,
    }, null, 2);
  }

  /**
   * Import configuration from JSON
   */
  public importConfiguration(jsonData: string): void {
    try {
      const data = JSON.parse(jsonData);
      if (data.config) this.config = data.config;
      if (data.settings) this.settings = { ...DEFAULT_SETTINGS, ...data.settings };
      if (data.overrides) this.overrides = data.overrides;
      if (data.metrics) this.metrics = { ...this.metrics, ...data.metrics };
      this.saveConfiguration();
    } catch (error) {
      throw new Error('Invalid configuration data');
    }
  }

  /**
   * Clear all configuration data
   */
  public clearConfiguration(): void {
    localStorage.removeItem(STORAGE_KEYS.PATTERN_CONFIG);
    localStorage.removeItem(`${STORAGE_KEYS.PATTERN_CONFIG}:settings`);
    localStorage.removeItem(`${STORAGE_KEYS.PATTERN_CONFIG}:overrides`);
    localStorage.removeItem(STORAGE_KEYS.METRICS);
    this.initializeDefaultConfig();
  }
}

// Export singleton instance
export const configurationManager = ConfigurationManager.getInstance();