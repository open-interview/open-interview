/**
 * Answer Formatting Standards Library
 * 
 * This module provides a comprehensive system for standardizing answer formatting
 * across Code Reels. It includes pattern detection, validation, and auto-formatting
 * capabilities to ensure consistent, high-quality content.
 * 
 * @module answer-formatting
 */

// Export all types
export * from './types';

// Export utilities
export { PatternLibrary, patternLibrary } from './pattern-library';
export * from './patterns-loader';
export { PatternDetector, patternDetector } from './pattern-detector';
export { FormatValidator } from './format-validator';
export { ConfigurationManager, configurationManager } from './configuration-manager';
export * from './override-utils';
export { MetricsCollector, metricsCollector } from './metrics-collector';
// export * from './auto-formatter';
// export * from './utils';
