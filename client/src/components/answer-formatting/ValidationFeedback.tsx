/**
 * ValidationFeedback Component - Displays validation results and fix suggestions
 * 
 * This component shows validation violations with severity indicators,
 * displays error messages, and provides fix suggestions with apply buttons.
 */

import React from 'react';
import type { ValidationResult, ValidationViolation, FormatSuggestion } from '@/lib/answer-formatting/types';

interface ValidationFeedbackProps {
  validationResult: ValidationResult;
  suggestions?: FormatSuggestion[];
  onApplyFix?: (suggestion: FormatSuggestion, fixIndex: number) => void;
  className?: string;
}

export const ValidationFeedback: React.FC<ValidationFeedbackProps> = ({
  validationResult,
  suggestions = [],
  onApplyFix,
  className = ''
}) => {
  const { isValid, score, violations } = validationResult;

  if (isValid && violations.length === 0) {
    return (
      <div className={`validation-feedback validation-success ${className}`}>
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="text-green-600">✅</div>
          <div className="text-green-800 font-medium">
            Perfect! Your answer follows all formatting standards.
          </div>
          <div className="ml-auto text-green-600 font-semibold">
            Score: {score}/100
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`validation-feedback ${className}`}>
      {/* Score Display */}
      <div className="score-display mb-4">
        <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="text-gray-700 font-medium">
            Formatting Score
          </div>
          <div className={`font-bold text-lg ${getScoreColor(score)}`}>
            {score}/100
          </div>
        </div>
      </div>

      {/* Violations List */}
      {violations.length > 0 && (
        <div className="violations-list space-y-3">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            Issues Found ({violations.length})
          </h3>
          
          {violations.map((violation, index) => (
            <ViolationItem
              key={`${violation.rule}-${index}`}
              violation={violation}
              suggestion={suggestions.find(s => s.violation.rule === violation.rule)}
              onApplyFix={onApplyFix}
            />
          ))}
        </div>
      )}

      {/* Fix Suggestions */}
      {suggestions.length > 0 && (
        <div className="suggestions-section mt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            Suggested Fixes ({suggestions.length})
          </h3>
          
          <div className="space-y-3">
            {suggestions
              .sort((a, b) => b.priority - a.priority)
              .map((suggestion, index) => (
                <SuggestionItem
                  key={`suggestion-${index}`}
                  suggestion={suggestion}
                  onApplyFix={onApplyFix}
                />
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface ViolationItemProps {
  violation: ValidationViolation;
  suggestion?: FormatSuggestion;
  onApplyFix?: (suggestion: FormatSuggestion, fixIndex: number) => void;
}

const ViolationItem: React.FC<ViolationItemProps> = ({
  violation,
  suggestion,
  onApplyFix
}) => {
  const severityConfig = getSeverityConfig(violation.severity);

  return (
    <div className={`violation-item p-4 border rounded-lg ${severityConfig.bgColor} ${severityConfig.borderColor}`}>
      <div className="flex items-start gap-3">
        <div className={`text-lg ${severityConfig.iconColor}`}>
          {severityConfig.icon}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-sm font-medium px-2 py-1 rounded ${severityConfig.badgeColor}`}>
              {violation.severity.toUpperCase()}
            </span>
            {violation.location && (
              <span className="text-xs text-gray-500">
                Line {violation.location.line}, Column {violation.location.column}
              </span>
            )}
          </div>
          
          <div className={`font-medium mb-1 ${severityConfig.textColor}`}>
            {violation.message}
          </div>
          
          {violation.fix && (
            <div className="text-sm text-gray-600 mb-2">
              <strong>Fix:</strong> {violation.fix}
            </div>
          )}
          
          {suggestion && suggestion.fixes.length > 0 && (
            <div className="mt-3">
              <div className="text-sm font-medium text-gray-700 mb-2">
                Available fixes:
              </div>
              <div className="space-y-2">
                {suggestion.fixes.map((fix, fixIndex) => (
                  <button
                    key={fix.id}
                    onClick={() => onApplyFix?.(suggestion, fixIndex)}
                    className="inline-flex items-center gap-2 px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-800 rounded border border-blue-300 transition-colors"
                  >
                    <span>🔧</span>
                    {fix.description}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface SuggestionItemProps {
  suggestion: FormatSuggestion;
  onApplyFix?: (suggestion: FormatSuggestion, fixIndex: number) => void;
}

const SuggestionItem: React.FC<SuggestionItemProps> = ({
  suggestion,
  onApplyFix
}) => {
  const priorityConfig = getPriorityConfig(suggestion.priority);

  return (
    <div className={`suggestion-item p-4 border rounded-lg ${priorityConfig.bgColor} ${priorityConfig.borderColor}`}>
      <div className="flex items-start gap-3">
        <div className={`text-lg ${priorityConfig.iconColor}`}>
          {priorityConfig.icon}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-xs font-medium px-2 py-1 rounded ${priorityConfig.badgeColor}`}>
              Priority: {suggestion.priority}
            </span>
          </div>
          
          <div className="text-gray-800 mb-2">
            {suggestion.description}
          </div>
          
          <div className="space-y-2">
            {suggestion.fixes.map((fix, fixIndex) => (
              <div key={fix.id} className="flex items-center justify-between p-2 bg-white rounded border">
                <div className="flex-1">
                  <div className="font-medium text-sm text-gray-800">
                    {fix.description}
                  </div>
                  <div className="text-xs text-gray-500">
                    Type: {fix.type}
                  </div>
                </div>
                
                <button
                  onClick={() => onApplyFix?.(suggestion, fixIndex)}
                  className="ml-3 px-3 py-1 text-sm bg-green-100 hover:bg-green-200 text-green-800 rounded border border-green-300 transition-colors"
                >
                  Apply Fix
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper functions
function getScoreColor(score: number): string {
  if (score >= 90) return 'text-green-600';
  if (score >= 70) return 'text-yellow-600';
  if (score >= 50) return 'text-orange-600';
  return 'text-red-600';
}

function getSeverityConfig(severity: 'error' | 'warning' | 'info') {
  switch (severity) {
    case 'error':
      return {
        icon: '❌',
        iconColor: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-800',
        badgeColor: 'bg-red-100 text-red-800'
      };
    case 'warning':
      return {
        icon: '⚠️',
        iconColor: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        textColor: 'text-yellow-800',
        badgeColor: 'bg-yellow-100 text-yellow-800'
      };
    case 'info':
      return {
        icon: 'ℹ️',
        iconColor: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        textColor: 'text-blue-800',
        badgeColor: 'bg-blue-100 text-blue-800'
      };
  }
}

function getPriorityConfig(priority: number) {
  if (priority >= 100) {
    return {
      icon: '🔴',
      iconColor: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      badgeColor: 'bg-red-100 text-red-800'
    };
  } else if (priority >= 50) {
    return {
      icon: '🟡',
      iconColor: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      badgeColor: 'bg-yellow-100 text-yellow-800'
    };
  } else {
    return {
      icon: '🔵',
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      badgeColor: 'bg-blue-100 text-blue-800'
    };
  }
}

export default ValidationFeedback;