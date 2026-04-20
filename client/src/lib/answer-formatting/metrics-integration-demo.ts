/**
 * Metrics Integration Demo
 * 
 * This demo shows how to integrate the metrics collection system
 * with the existing answer formatting components.
 */

import { metricsCollector } from './metrics-collector';
import { patternDetector } from './pattern-detector';
import { FormatValidator } from './format-validator';

// Demo: How to integrate metrics collection with validation workflow
export function demoMetricsIntegration() {
  console.log('=== Answer Formatting Metrics Integration Demo ===\n');

  // Example question and answer
  const question = "What's the difference between REST and GraphQL?";
  const answer = `REST and GraphQL are both API technologies but work differently.

REST uses multiple endpoints while GraphQL uses a single endpoint.
REST can lead to over-fetching while GraphQL eliminates this.
REST uses HTTP methods while GraphQL uses queries and mutations.`;

  console.log('1. Pattern Detection with Metrics');
  console.log('Question:', question);
  
  // Detect pattern and record metrics
  const detectedPattern = patternDetector.detectPattern(question);
  if (detectedPattern) {
    metricsCollector.recordPatternDetection({
      questionId: 'demo-q1',
      timestamp: new Date().toISOString(),
      detectedPattern: detectedPattern.id,
      confidence: patternDetector.getConfidence(),
      appliedPattern: detectedPattern.id // User accepted suggestion
    });
    
    console.log('Detected Pattern:', detectedPattern.name);
    console.log('Confidence:', patternDetector.getConfidence());
  }

  console.log('\n2. Validation with Metrics');
  console.log('Answer:', answer);
  
  // Validate answer and record metrics
  if (detectedPattern) {
    const validator = new FormatValidator();
    const validationResult = validator.validate(answer, detectedPattern);
    
    metricsCollector.recordValidation({
      questionId: 'demo-q1',
      timestamp: new Date().toISOString(),
      pattern: detectedPattern.id,
      score: validationResult.score,
      passed: validationResult.isValid,
      violationCount: validationResult.violations.length,
      autoFixable: validationResult.violations.some(v => v.fix),
      channel: 'demo'
    });
    
    console.log('Validation Score:', validationResult.score);
    console.log('Passed:', validationResult.isValid);
    console.log('Violations:', validationResult.violations.length);
    
    // Simulate auto-fix attempt
    if (validationResult.violations.length > 0) {
      const fixableViolations = validationResult.violations.filter(v => v.fix);
      
      if (fixableViolations.length > 0) {
        // Simulate successful auto-fix
        metricsCollector.recordAutoFix({
          questionId: 'demo-q1',
          timestamp: new Date().toISOString(),
          violationType: fixableViolations[0].rule,
          success: true,
          beforeScore: validationResult.score,
          afterScore: Math.min(100, validationResult.score + 20)
        });
        
        console.log('Auto-fix applied successfully');
      }
    }
  }

  console.log('\n3. Current Metrics Summary');
  const metrics = metricsCollector.getMetrics();
  
  console.log('Total Questions:', metrics.totalQuestions);
  console.log('Compliance Rate:', metrics.complianceRate.toFixed(1) + '%');
  console.log('Average Score:', metrics.averageScore.toFixed(1));
  console.log('Auto-fix Success Rate:', metrics.autoFixSuccessRate.toFixed(1) + '%');
  
  console.log('\nPattern Usage:');
  Object.entries(metrics.patternUsage).forEach(([patternId, stats]) => {
    console.log(`- ${stats.name}: ${stats.detectionCount} detections, ${stats.successRate.toFixed(1)}% success rate`);
  });

  console.log('\n4. Export Data for Analysis');
  const exportedData = metricsCollector.exportData();
  console.log('Exported Events:');
  console.log('- Validation Events:', exportedData.validationEvents.length);
  console.log('- Auto-fix Events:', exportedData.autoFixEvents.length);
  console.log('- Pattern Detection Events:', exportedData.patternDetectionEvents.length);

  console.log('\n=== Demo Complete ===');
  console.log('Metrics are automatically collected and can be viewed in the FormatMetrics dashboard component.');
  
  return {
    metrics,
    exportedData
  };
}

// Demo: How to use metrics for quality monitoring
export function demoQualityMonitoring() {
  console.log('=== Quality Monitoring Demo ===\n');
  
  const metrics = metricsCollector.getMetrics();
  
  // Quality thresholds
  const COMPLIANCE_THRESHOLD = 80; // 80% compliance rate
  const SCORE_THRESHOLD = 75; // Average score of 75
  const AUTOFIX_THRESHOLD = 85; // 85% auto-fix success rate
  
  console.log('Quality Thresholds:');
  console.log('- Compliance Rate:', COMPLIANCE_THRESHOLD + '%');
  console.log('- Average Score:', SCORE_THRESHOLD);
  console.log('- Auto-fix Success:', AUTOFIX_THRESHOLD + '%');
  
  console.log('\nCurrent Performance:');
  console.log('- Compliance Rate:', metrics.complianceRate.toFixed(1) + '%', 
    metrics.complianceRate >= COMPLIANCE_THRESHOLD ? '✅' : '❌');
  console.log('- Average Score:', metrics.averageScore.toFixed(1), 
    metrics.averageScore >= SCORE_THRESHOLD ? '✅' : '❌');
  console.log('- Auto-fix Success:', metrics.autoFixSuccessRate.toFixed(1) + '%', 
    metrics.autoFixSuccessRate >= AUTOFIX_THRESHOLD ? '✅' : '❌');
  
  // Channel performance analysis
  console.log('\nChannel Performance:');
  metrics.channelBreakdown.forEach(channel => {
    const status = channel.complianceRate >= COMPLIANCE_THRESHOLD ? '✅' : '❌';
    console.log(`- ${channel.channel}: ${channel.complianceRate.toFixed(1)}% compliance ${status}`);
  });
  
  // Pattern effectiveness analysis
  console.log('\nPattern Effectiveness:');
  Object.entries(metrics.patternUsage).forEach(([patternId, stats]) => {
    const effectiveness = stats.successRate >= COMPLIANCE_THRESHOLD ? '✅' : '❌';
    console.log(`- ${stats.name}: ${stats.successRate.toFixed(1)}% success rate ${effectiveness}`);
  });
  
  console.log('\n=== Quality Monitoring Complete ===');
}

// Demo: How to analyze trends
export function demoTrendAnalysis() {
  console.log('=== Trend Analysis Demo ===\n');
  
  const metrics = metricsCollector.getMetrics();
  
  if (metrics.trends.length === 0) {
    console.log('No trend data available yet. Add more validation events to see trends.');
    return;
  }
  
  // Analyze last 7 days
  const recentTrends = metrics.trends.slice(-7);
  
  console.log('Last 7 Days Trend Analysis:');
  
  // Calculate trend direction
  const firstDay = recentTrends[0];
  const lastDay = recentTrends[recentTrends.length - 1];
  
  const complianceTrend = lastDay.complianceRate - firstDay.complianceRate;
  const validationTrend = lastDay.validationPassRate - firstDay.validationPassRate;
  const autoFixTrend = lastDay.autoFixSuccessRate - firstDay.autoFixSuccessRate;
  
  console.log('Compliance Rate Trend:', 
    complianceTrend > 0 ? `+${complianceTrend.toFixed(1)}% ↗️` : 
    complianceTrend < 0 ? `${complianceTrend.toFixed(1)}% ↘️` : 'No change →');
    
  console.log('Validation Pass Rate Trend:', 
    validationTrend > 0 ? `+${validationTrend.toFixed(1)}% ↗️` : 
    validationTrend < 0 ? `${validationTrend.toFixed(1)}% ↘️` : 'No change →');
    
  console.log('Auto-fix Success Rate Trend:', 
    autoFixTrend > 0 ? `+${autoFixTrend.toFixed(1)}% ↗️` : 
    autoFixTrend < 0 ? `${autoFixTrend.toFixed(1)}% ↘️` : 'No change →');
  
  // Daily breakdown
  console.log('\nDaily Breakdown:');
  recentTrends.forEach(day => {
    console.log(`${day.date}: ${day.totalQuestions} questions, ${day.complianceRate.toFixed(1)}% compliance`);
  });
  
  console.log('\n=== Trend Analysis Complete ===');
}

// Export all demos
export const MetricsDemo = {
  integration: demoMetricsIntegration,
  qualityMonitoring: demoQualityMonitoring,
  trendAnalysis: demoTrendAnalysis
};