/**
 * Metrics Collection System for Answer Formatting Standards
 * 
 * This module provides comprehensive metrics collection and analysis
 * for the answer formatting system, tracking compliance rates,
 * validation performance, and auto-fix success rates.
 */

import { STORAGE_KEYS } from './types';

// ============================================================================
// Metrics Types
// ============================================================================

export interface FormatMetrics {
  // Overall metrics
  totalQuestions: number;
  totalValidations: number;
  lastUpdated: string;
  
  // Compliance metrics
  complianceRate: number; // % of questions that pass validation
  averageScore: number; // Average validation score (0-100)
  
  // Validation metrics
  validationPassRate: number; // % of validations that pass on first attempt
  averageViolationsPerQuestion: number;
  
  // Auto-fix metrics
  autoFixSuccessRate: number; // % of violations successfully auto-fixed
  autoFixAttempts: number;
  autoFixSuccesses: number;
  
  // Pattern usage statistics
  patternUsage: PatternUsageStats;
  
  // Trend data (last 30 days)
  trends: MetricsTrend[];
  
  // Channel breakdown
  channelBreakdown: ChannelMetrics[];
}

export interface PatternUsageStats {
  [patternId: string]: {
    name: string;
    detectionCount: number;
    applicationCount: number;
    averageScore: number;
    successRate: number;
  };
}

export interface MetricsTrend {
  date: string; // YYYY-MM-DD
  complianceRate: number;
  validationPassRate: number;
  autoFixSuccessRate: number;
  totalQuestions: number;
}

export interface ChannelMetrics {
  channel: string;
  totalQuestions: number;
  complianceRate: number;
  averageScore: number;
  topPatterns: string[];
}

export interface ValidationEvent {
  questionId: string;
  timestamp: string;
  pattern: string;
  score: number;
  passed: boolean;
  violationCount: number;
  autoFixable: boolean;
  channel?: string;
}

export interface AutoFixEvent {
  questionId: string;
  timestamp: string;
  violationType: string;
  success: boolean;
  beforeScore: number;
  afterScore: number;
}

export interface PatternDetectionEvent {
  questionId: string;
  timestamp: string;
  detectedPattern: string;
  confidence: number;
  appliedPattern?: string;
}

// ============================================================================
// Metrics Collector Class
// ============================================================================

export class MetricsCollector {
  private static instance: MetricsCollector;
  private metrics: FormatMetrics;
  private validationEvents: ValidationEvent[] = [];
  private autoFixEvents: AutoFixEvent[] = [];
  private patternDetectionEvents: PatternDetectionEvent[] = [];

  private constructor() {
    this.metrics = this.loadMetrics();
    this.loadEvents();
  }

  public static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector();
    }
    return MetricsCollector.instance;
  }

  // ============================================================================
  // Event Recording Methods
  // ============================================================================

  /**
   * Record a validation event
   */
  public recordValidation(event: ValidationEvent): void {
    this.validationEvents.push(event);
    this.updateMetrics();
    this.persistData();
  }

  /**
   * Record an auto-fix event
   */
  public recordAutoFix(event: AutoFixEvent): void {
    this.autoFixEvents.push(event);
    this.updateMetrics();
    this.persistData();
  }

  /**
   * Record a pattern detection event
   */
  public recordPatternDetection(event: PatternDetectionEvent): void {
    this.patternDetectionEvents.push(event);
    this.updateMetrics();
    this.persistData();
  }

  // ============================================================================
  // Metrics Calculation Methods
  // ============================================================================

  /**
   * Get current metrics
   */
  public getMetrics(): FormatMetrics {
    return { ...this.metrics };
  }

  /**
   * Calculate compliance rate (% of questions that pass validation)
   */
  private calculateComplianceRate(): number {
    if (this.validationEvents.length === 0) return 0;
    
    const passedValidations = this.validationEvents.filter(event => event.passed).length;
    return (passedValidations / this.validationEvents.length) * 100;
  }

  /**
   * Calculate average validation score
   */
  private calculateAverageScore(): number {
    if (this.validationEvents.length === 0) return 0;
    
    const totalScore = this.validationEvents.reduce((sum, event) => sum + event.score, 0);
    return totalScore / this.validationEvents.length;
  }

  /**
   * Calculate validation pass rate (first attempt success)
   */
  private calculateValidationPassRate(): number {
    if (this.validationEvents.length === 0) return 0;
    
    // Group by questionId and check if first validation passed
    const questionValidations = new Map<string, ValidationEvent[]>();
    
    this.validationEvents.forEach(event => {
      if (!questionValidations.has(event.questionId)) {
        questionValidations.set(event.questionId, []);
      }
      questionValidations.get(event.questionId)!.push(event);
    });

    let firstAttemptPasses = 0;
    questionValidations.forEach(events => {
      // Sort by timestamp and check first event
      events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      if (events[0].passed) {
        firstAttemptPasses++;
      }
    });

    return (firstAttemptPasses / questionValidations.size) * 100;
  }

  /**
   * Calculate auto-fix success rate
   */
  private calculateAutoFixSuccessRate(): number {
    if (this.autoFixEvents.length === 0) return 0;
    
    const successfulFixes = this.autoFixEvents.filter(event => event.success).length;
    return (successfulFixes / this.autoFixEvents.length) * 100;
  }

  /**
   * Calculate average violations per question
   */
  private calculateAverageViolations(): number {
    if (this.validationEvents.length === 0) return 0;
    
    const totalViolations = this.validationEvents.reduce((sum, event) => sum + event.violationCount, 0);
    return totalViolations / this.validationEvents.length;
  }

  /**
   * Calculate pattern usage statistics
   */
  private calculatePatternUsage(): PatternUsageStats {
    const patternStats: PatternUsageStats = {};

    // Count pattern detections
    this.patternDetectionEvents.forEach(event => {
      if (!patternStats[event.detectedPattern]) {
        patternStats[event.detectedPattern] = {
          name: event.detectedPattern,
          detectionCount: 0,
          applicationCount: 0,
          averageScore: 0,
          successRate: 0
        };
      }
      patternStats[event.detectedPattern].detectionCount++;
      
      if (event.appliedPattern) {
        patternStats[event.detectedPattern].applicationCount++;
      }
    });

    // Calculate average scores and success rates for each pattern
    Object.keys(patternStats).forEach(patternId => {
      const patternValidations = this.validationEvents.filter(event => event.pattern === patternId);
      
      if (patternValidations.length > 0) {
        const totalScore = patternValidations.reduce((sum, event) => sum + event.score, 0);
        patternStats[patternId].averageScore = totalScore / patternValidations.length;
        
        const passedValidations = patternValidations.filter(event => event.passed).length;
        patternStats[patternId].successRate = (passedValidations / patternValidations.length) * 100;
      }
    });

    return patternStats;
  }

  /**
   * Calculate trend data for the last 30 days
   */
  private calculateTrends(): MetricsTrend[] {
    const trends: MetricsTrend[] = [];
    const now = new Date();
    
    // Generate data for last 30 days
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Filter events for this day
      const dayValidations = this.validationEvents.filter(event => 
        event.timestamp.startsWith(dateStr)
      );
      const dayAutoFixes = this.autoFixEvents.filter(event => 
        event.timestamp.startsWith(dateStr)
      );
      
      const complianceRate = dayValidations.length > 0 
        ? (dayValidations.filter(e => e.passed).length / dayValidations.length) * 100 
        : 0;
      
      const validationPassRate = this.calculateDayValidationPassRate(dayValidations);
      
      const autoFixSuccessRate = dayAutoFixes.length > 0 
        ? (dayAutoFixes.filter(e => e.success).length / dayAutoFixes.length) * 100 
        : 0;

      trends.push({
        date: dateStr,
        complianceRate,
        validationPassRate,
        autoFixSuccessRate,
        totalQuestions: dayValidations.length
      });
    }

    return trends;
  }

  /**
   * Calculate validation pass rate for a specific day
   */
  private calculateDayValidationPassRate(dayValidations: ValidationEvent[]): number {
    if (dayValidations.length === 0) return 0;
    
    const questionValidations = new Map<string, ValidationEvent[]>();
    
    dayValidations.forEach(event => {
      if (!questionValidations.has(event.questionId)) {
        questionValidations.set(event.questionId, []);
      }
      questionValidations.get(event.questionId)!.push(event);
    });

    let firstAttemptPasses = 0;
    questionValidations.forEach(events => {
      events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      if (events[0].passed) {
        firstAttemptPasses++;
      }
    });

    return questionValidations.size > 0 ? (firstAttemptPasses / questionValidations.size) * 100 : 0;
  }

  /**
   * Calculate channel breakdown metrics
   */
  private calculateChannelBreakdown(): ChannelMetrics[] {
    const channelStats = new Map<string, {
      validations: ValidationEvent[];
      patterns: Map<string, number>;
    }>();

    // Group validations by channel
    this.validationEvents.forEach(event => {
      if (!event.channel) return;
      
      if (!channelStats.has(event.channel)) {
        channelStats.set(event.channel, {
          validations: [],
          patterns: new Map()
        });
      }
      
      const stats = channelStats.get(event.channel)!;
      stats.validations.push(event);
      
      // Count pattern usage
      const currentCount = stats.patterns.get(event.pattern) || 0;
      stats.patterns.set(event.pattern, currentCount + 1);
    });

    // Convert to ChannelMetrics array
    const channelMetrics: ChannelMetrics[] = [];
    
    channelStats.forEach((stats, channel) => {
      const totalQuestions = stats.validations.length;
      const passedValidations = stats.validations.filter(v => v.passed).length;
      const complianceRate = totalQuestions > 0 ? (passedValidations / totalQuestions) * 100 : 0;
      
      const totalScore = stats.validations.reduce((sum, v) => sum + v.score, 0);
      const averageScore = totalQuestions > 0 ? totalScore / totalQuestions : 0;
      
      // Get top 3 patterns for this channel
      const sortedPatterns = Array.from(stats.patterns.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([pattern]) => pattern);

      channelMetrics.push({
        channel,
        totalQuestions,
        complianceRate,
        averageScore,
        topPatterns: sortedPatterns
      });
    });

    return channelMetrics.sort((a, b) => b.totalQuestions - a.totalQuestions);
  }

  // ============================================================================
  // Update and Persistence Methods
  // ============================================================================

  /**
   * Update all metrics based on current events
   */
  private updateMetrics(): void {
    const uniqueQuestions = new Set(this.validationEvents.map(e => e.questionId)).size;
    
    this.metrics = {
      totalQuestions: uniqueQuestions,
      totalValidations: this.validationEvents.length,
      lastUpdated: new Date().toISOString(),
      
      complianceRate: this.calculateComplianceRate(),
      averageScore: this.calculateAverageScore(),
      
      validationPassRate: this.calculateValidationPassRate(),
      averageViolationsPerQuestion: this.calculateAverageViolations(),
      
      autoFixSuccessRate: this.calculateAutoFixSuccessRate(),
      autoFixAttempts: this.autoFixEvents.length,
      autoFixSuccesses: this.autoFixEvents.filter(e => e.success).length,
      
      patternUsage: this.calculatePatternUsage(),
      trends: this.calculateTrends(),
      channelBreakdown: this.calculateChannelBreakdown()
    };
  }

  /**
   * Load metrics from localStorage
   */
  private loadMetrics(): FormatMetrics {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.METRICS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load metrics from localStorage:', error);
    }

    // Return default metrics
    return {
      totalQuestions: 0,
      totalValidations: 0,
      lastUpdated: new Date().toISOString(),
      complianceRate: 0,
      averageScore: 0,
      validationPassRate: 0,
      averageViolationsPerQuestion: 0,
      autoFixSuccessRate: 0,
      autoFixAttempts: 0,
      autoFixSuccesses: 0,
      patternUsage: {},
      trends: [],
      channelBreakdown: []
    };
  }

  /**
   * Load events from localStorage
   */
  private loadEvents(): void {
    try {
      const validationEvents = localStorage.getItem(`${STORAGE_KEYS.METRICS}:validation-events`);
      if (validationEvents) {
        this.validationEvents = JSON.parse(validationEvents);
      }

      const autoFixEvents = localStorage.getItem(`${STORAGE_KEYS.METRICS}:autofix-events`);
      if (autoFixEvents) {
        this.autoFixEvents = JSON.parse(autoFixEvents);
      }

      const patternEvents = localStorage.getItem(`${STORAGE_KEYS.METRICS}:pattern-events`);
      if (patternEvents) {
        this.patternDetectionEvents = JSON.parse(patternEvents);
      }
    } catch (error) {
      console.warn('Failed to load events from localStorage:', error);
    }
  }

  /**
   * Persist metrics and events to localStorage
   */
  private persistData(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.METRICS, JSON.stringify(this.metrics));
      localStorage.setItem(`${STORAGE_KEYS.METRICS}:validation-events`, JSON.stringify(this.validationEvents));
      localStorage.setItem(`${STORAGE_KEYS.METRICS}:autofix-events`, JSON.stringify(this.autoFixEvents));
      localStorage.setItem(`${STORAGE_KEYS.METRICS}:pattern-events`, JSON.stringify(this.patternDetectionEvents));
    } catch (error) {
      console.error('Failed to persist metrics to localStorage:', error);
    }
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Clear all metrics and events (for testing/reset)
   */
  public clearMetrics(): void {
    this.validationEvents = [];
    this.autoFixEvents = [];
    this.patternDetectionEvents = [];
    this.updateMetrics();
    this.persistData();
  }

  /**
   * Export metrics data for analysis
   */
  public exportData(): {
    metrics: FormatMetrics;
    validationEvents: ValidationEvent[];
    autoFixEvents: AutoFixEvent[];
    patternDetectionEvents: PatternDetectionEvent[];
  } {
    return {
      metrics: this.getMetrics(),
      validationEvents: [...this.validationEvents],
      autoFixEvents: [...this.autoFixEvents],
      patternDetectionEvents: [...this.patternDetectionEvents]
    };
  }

  /**
   * Get metrics for a specific time range
   */
  public getMetricsForDateRange(startDate: string, endDate: string): FormatMetrics {
    const filteredValidationEvents = this.validationEvents.filter(event => 
      event.timestamp >= startDate && event.timestamp <= endDate
    );
    const filteredAutoFixEvents = this.autoFixEvents.filter(event => 
      event.timestamp >= startDate && event.timestamp <= endDate
    );
    const filteredPatternEvents = this.patternDetectionEvents.filter(event => 
      event.timestamp >= startDate && event.timestamp <= endDate
    );

    // Temporarily replace events to calculate filtered metrics
    const originalValidationEvents = this.validationEvents;
    const originalAutoFixEvents = this.autoFixEvents;
    const originalPatternEvents = this.patternDetectionEvents;

    this.validationEvents = filteredValidationEvents;
    this.autoFixEvents = filteredAutoFixEvents;
    this.patternDetectionEvents = filteredPatternEvents;

    this.updateMetrics();
    const filteredMetrics = { ...this.metrics };

    // Restore original events
    this.validationEvents = originalValidationEvents;
    this.autoFixEvents = originalAutoFixEvents;
    this.patternDetectionEvents = originalPatternEvents;
    this.updateMetrics();

    return filteredMetrics;
  }
}

// ============================================================================
// Singleton Instance Export
// ============================================================================

export const metricsCollector = MetricsCollector.getInstance();