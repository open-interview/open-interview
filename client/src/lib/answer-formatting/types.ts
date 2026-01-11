/**
 * Core type definitions for the Answer Formatting Standards system
 * 
 * This module defines all TypeScript interfaces and types used throughout
 * the answer formatting system for Code Reels.
 */

// ============================================================================
// Pattern Types
// ============================================================================

export interface FormatPattern {
  id: string;
  name: string;
  keywords: string[];
  priority: number;
  structure: PatternStructure;
}

export interface PatternStructure {
  sections: Section[];
  rules: Rule[];
  template: string;
  examples: string[];
}

export interface Section {
  name: string;
  required: boolean;
  format: 'text' | 'list' | 'table' | 'code' | 'diagram' | 'process' | 'pros-cons' | 'troubleshooting';
  constraints?: Constraint[];
}

export interface Constraint {
  type: string;
  value: number | boolean | string;
}

export interface Rule {
  id: string;
  description: string;
  validator: (content: string) => boolean;
  errorMessage: string;
}

// ============================================================================
// Validation Types
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  score: number; // 0-100
  violations: ValidationViolation[];
  suggestions: string[];
}

export interface ValidationViolation {
  rule: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  location?: { line: number; column: number };
  fix?: string;
}

export interface ValidationReport {
  questionId: string;
  timestamp: string;
  pattern: string;
  score: number;
  violations: ValidationViolation[];
  suggestions: string[];
  autoFixable: boolean;
}

// ============================================================================
// Formatting Types
// ============================================================================

export interface Fix {
  type: 'insert' | 'replace' | 'delete' | 'reformat';
  location: { start: number; end: number };
  content: string;
  description: string;
}

export interface FormatFix {
  id: string;
  type: 'insert' | 'replace' | 'remove' | 'reformat';
  description: string;
  target: string;
  replacement?: string;
}

export interface FormatSuggestion {
  violation: ValidationViolation;
  fixes: FormatFix[];
  priority: number;
  description: string;
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface PatternConfig {
  version: string;
  patterns: FormatPattern[];
  validationRules: ValidationRule[];
  autoFormatEnabled: boolean;
  strictMode: boolean;
}

export interface ValidationRule {
  id: string;
  pattern: string;
  severity: 'error' | 'warning' | 'info';
  enabled: boolean;
  autoFix?: boolean;
}

// ============================================================================
// Question Model
// ============================================================================

export interface Question {
  id: string;
  question: string;
  answer: string;
  channel: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  
  // Additional fields from main Question type
  explanation?: string;
  tags?: string[];
  companies?: string[];
  subChannel?: string;
  
  // Format metadata
  detectedPattern?: string;
  appliedPattern?: string;
  validationScore?: number;
  lastValidated?: string;
  formatVersion?: string;
  
  // Override metadata
  hasOverride?: boolean;
  overrideJustification?: string;
  overridePattern?: string;
  overrideTimestamp?: string;
}

// ============================================================================
// Component Interfaces
// ============================================================================

export interface PatternDetector {
  detectPattern(question: string): FormatPattern | null;
  getConfidence(): number;
  getSuggestedPatterns(question: string): FormatPattern[];
}

export interface FormatValidator {
  validate(answer: string, pattern: FormatPattern): ValidationResult;
  getViolations(): ValidationViolation[];
  getSuggestions(): string[];
}

export interface PatternLibrary {
  getPattern(id: string): FormatPattern | null;
  getAllPatterns(): FormatPattern[];
  searchPatterns(keywords: string[]): FormatPattern[];
  addPattern(pattern: FormatPattern): void;
  updatePattern(id: string, pattern: FormatPattern): void;
}

export interface AutoFormatter {
  format(answer: string, pattern: FormatPattern): string;
  suggestFixes(validationResult: ValidationResult): FormatSuggestion[];
  applyFix(answer: string, fix: FormatFix): string;
}

export interface LanguageConsistencyChecker {
  checkConsistency(answer: string): ConsistencyResult;
}

export interface ConsistencyResult {
  isConsistent: boolean;
  score: number; // 0-100
  violations: string[];
  suggestions: string[];
  languages: string[];
  comparisons: LanguageComparison[];
}

export interface CodeExample {
  language: string;
  code: string;
  startIndex: number;
  endIndex: number;
  variables: string[];
  functions: string[];
  structure: {
    hasClasses: boolean;
    hasFunctions: boolean;
    hasVariables: boolean;
    hasLoops: boolean;
    hasConditionals: boolean;
    lineCount: number;
  };
}

export interface LanguageComparison {
  language1: string;
  language2: string;
  isConsistent: boolean;
  differences: string[];
  similarity: number; // 0-1
}

export interface EditorIntegration {
  onQuestionChange(question: string): void;
  onAnswerChange(answer: string): void;
  showValidation(result: ValidationResult): void;
  showSuggestions(patterns: FormatPattern[]): void;
  applyFormat(pattern: FormatPattern): void;
}

// ============================================================================
// Pattern Type Identifiers
// ============================================================================

export type PatternType =
  | 'comparison-table'
  | 'definition'
  | 'list'
  | 'process'
  | 'code-example'
  | 'pros-cons'
  | 'architecture'
  | 'troubleshooting'
  | 'best-practices';

// ============================================================================
// Storage Keys
// ============================================================================

export const STORAGE_KEYS = {
  PATTERN_CONFIG: 'answer-formatting:config',
  VALIDATION_REPORTS: 'answer-formatting:reports',
  METRICS: 'answer-formatting:metrics',
} as const;
