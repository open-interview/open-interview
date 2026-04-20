/**
 * FormatPreview Component - Shows before/after comparison for format changes
 * 
 * This component displays a before/after comparison of answer formatting,
 * allows format acceptance/rejection, and provides preview of applied changes.
 */

import React, { useState, useMemo } from 'react';
import type { FormatPattern, FormatSuggestion } from '@/lib/answer-formatting/types';

interface FormatPreviewProps {
  originalAnswer: string;
  formattedAnswer: string;
  pattern: FormatPattern;
  suggestions?: FormatSuggestion[];
  onAccept?: (formattedAnswer: string) => void;
  onReject?: () => void;
  onApplySuggestion?: (suggestion: FormatSuggestion, fixIndex: number) => void;
  className?: string;
}

export const FormatPreview: React.FC<FormatPreviewProps> = ({
  originalAnswer,
  formattedAnswer,
  pattern,
  suggestions = [],
  onAccept,
  onReject,
  onApplySuggestion,
  className = ''
}) => {
  const [viewMode, setViewMode] = useState<'side-by-side' | 'unified'>('side-by-side');
  const [showDiff, setShowDiff] = useState(true);

  const changes = useMemo(() => {
    return calculateChanges(originalAnswer, formattedAnswer);
  }, [originalAnswer, formattedAnswer]);

  const hasChanges = originalAnswer.trim() !== formattedAnswer.trim();

  if (!hasChanges) {
    return (
      <div className={`format-preview format-preview-no-changes ${className}`}>
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-green-800">
            <span>✅</span>
            <span className="font-medium">Perfect! Your answer already follows the {pattern.name} format.</span>
          </div>
          <div className="text-sm text-green-700 mt-1">
            No formatting changes needed.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`format-preview ${className}`}>
      {/* Header */}
      <div className="preview-header mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-800">
            Format Preview: {pattern.name}
          </h3>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode(viewMode === 'side-by-side' ? 'unified' : 'side-by-side')}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
            >
              {viewMode === 'side-by-side' ? 'Unified View' : 'Side by Side'}
            </button>
            
            <button
              onClick={() => setShowDiff(!showDiff)}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                showDiff
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {showDiff ? 'Hide Changes' : 'Show Changes'}
            </button>
          </div>
        </div>

        <div className="text-sm text-gray-600">
          {changes.additions} additions, {changes.deletions} deletions, {changes.modifications} modifications
        </div>
      </div>

      {/* Preview Content */}
      <div className="preview-content">
        {viewMode === 'side-by-side' ? (
          <SideBySideView
            originalAnswer={originalAnswer}
            formattedAnswer={formattedAnswer}
            showDiff={showDiff}
          />
        ) : (
          <UnifiedView
            originalAnswer={originalAnswer}
            formattedAnswer={formattedAnswer}
            showDiff={showDiff}
          />
        )}
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="suggestions-section mt-6">
          <h4 className="text-md font-medium text-gray-800 mb-3">
            Additional Improvements ({suggestions.length})
          </h4>
          
          <div className="space-y-3">
            {suggestions
              .sort((a, b) => b.priority - a.priority)
              .map((suggestion, index) => (
                <SuggestionPreview
                  key={`suggestion-${index}`}
                  suggestion={suggestion}
                  onApply={onApplySuggestion}
                  suggestionIndex={index}
                />
              ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="preview-actions mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Review the changes and choose an action:
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={onReject}
              className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded font-medium transition-colors"
            >
              Keep Original
            </button>
            
            <button
              onClick={() => onAccept?.(formattedAnswer)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
            >
              Apply Format
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface SideBySideViewProps {
  originalAnswer: string;
  formattedAnswer: string;
  showDiff: boolean;
}

const SideBySideView: React.FC<SideBySideViewProps> = ({
  originalAnswer,
  formattedAnswer,
  showDiff
}) => {
  return (
    <div className="side-by-side-view grid grid-cols-2 gap-4">
      {/* Original */}
      <div className="original-panel">
        <div className="panel-header mb-2">
          <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <span className="w-3 h-3 bg-red-200 rounded-full"></span>
            Original Answer
          </h4>
        </div>
        
        <div className="panel-content">
          <div className="text-sm bg-white border border-gray-200 rounded p-3 min-h-[200px] overflow-auto">
            {showDiff ? (
              <DiffText text={originalAnswer} type="original" />
            ) : (
              <pre className="whitespace-pre-wrap font-mono">{originalAnswer}</pre>
            )}
          </div>
        </div>
      </div>

      {/* Formatted */}
      <div className="formatted-panel">
        <div className="panel-header mb-2">
          <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <span className="w-3 h-3 bg-green-200 rounded-full"></span>
            Formatted Answer
          </h4>
        </div>
        
        <div className="panel-content">
          <div className="text-sm bg-white border border-gray-200 rounded p-3 min-h-[200px] overflow-auto">
            {showDiff ? (
              <DiffText text={formattedAnswer} type="formatted" />
            ) : (
              <pre className="whitespace-pre-wrap font-mono">{formattedAnswer}</pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface UnifiedViewProps {
  originalAnswer: string;
  formattedAnswer: string;
  showDiff: boolean;
}

const UnifiedView: React.FC<UnifiedViewProps> = ({
  originalAnswer,
  formattedAnswer,
  showDiff
}) => {
  return (
    <div className="unified-view">
      <div className="text-sm bg-white border border-gray-200 rounded p-3 min-h-[200px] overflow-auto">
        {showDiff ? (
          <UnifiedDiff original={originalAnswer} formatted={formattedAnswer} />
        ) : (
          <pre className="whitespace-pre-wrap font-mono">{formattedAnswer}</pre>
        )}
      </div>
    </div>
  );
};

interface DiffTextProps {
  text: string;
  type: 'original' | 'formatted';
}

const DiffText: React.FC<DiffTextProps> = ({ text, type }) => {
  // Simple diff highlighting - in a real implementation, you'd use a proper diff library
  const lines = text.split('\n');
  
  return (
    <div className="diff-text">
      {lines.map((line, index) => (
        <div key={index} className="diff-line">
          <span className="line-number text-gray-400 text-xs mr-2 select-none">
            {index + 1}
          </span>
          <span className="line-content font-mono">
            {line || '\u00A0'} {/* Non-breaking space for empty lines */}
          </span>
        </div>
      ))}
    </div>
  );
};

interface UnifiedDiffProps {
  original: string;
  formatted: string;
}

const UnifiedDiff: React.FC<UnifiedDiffProps> = ({ original, formatted }) => {
  const originalLines = original.split('\n');
  const formattedLines = formatted.split('\n');
  
  // Simple unified diff view - in a real implementation, you'd use a proper diff algorithm
  const maxLines = Math.max(originalLines.length, formattedLines.length);
  
  return (
    <div className="unified-diff">
      {Array.from({ length: maxLines }, (_, index) => {
        const originalLine = originalLines[index] || '';
        const formattedLine = formattedLines[index] || '';
        
        if (originalLine === formattedLine) {
          return (
            <div key={index} className="diff-line unchanged">
              <span className="line-number text-gray-400 text-xs mr-2 select-none">
                {index + 1}
              </span>
              <span className="line-content font-mono">
                {originalLine || '\u00A0'}
              </span>
            </div>
          );
        }
        
        return (
          <div key={index} className="diff-line-group">
            {originalLine && (
              <div className="diff-line removed bg-red-50 border-l-2 border-red-300">
                <span className="line-number text-gray-400 text-xs mr-2 select-none">
                  -{index + 1}
                </span>
                <span className="line-content font-mono text-red-800">
                  {originalLine}
                </span>
              </div>
            )}
            {formattedLine && (
              <div className="diff-line added bg-green-50 border-l-2 border-green-300">
                <span className="line-number text-gray-400 text-xs mr-2 select-none">
                  +{index + 1}
                </span>
                <span className="line-content font-mono text-green-800">
                  {formattedLine}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

interface SuggestionPreviewProps {
  suggestion: FormatSuggestion;
  onApply?: (suggestion: FormatSuggestion, fixIndex: number) => void;
  suggestionIndex: number;
}

const SuggestionPreview: React.FC<SuggestionPreviewProps> = ({
  suggestion,
  onApply,
  suggestionIndex
}) => {
  const priorityConfig = getPriorityConfig(suggestion.priority);

  return (
    <div className={`suggestion-preview p-3 border rounded-lg ${priorityConfig.bgColor} ${priorityConfig.borderColor}`}>
      <div className="flex items-start gap-3">
        <div className={`text-lg ${priorityConfig.iconColor}`}>
          {priorityConfig.icon}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-medium px-2 py-1 rounded ${priorityConfig.badgeColor}`}>
              Priority: {suggestion.priority}
            </span>
          </div>
          
          <div className="text-sm text-gray-800 mb-2">
            {suggestion.description}
          </div>
          
          <div className="space-y-2">
            {suggestion.fixes.map((fix, fixIndex) => (
              <div key={fix.id} className="flex items-center justify-between p-2 bg-white rounded border">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-800">
                    {fix.description}
                  </div>
                  <div className="text-xs text-gray-500">
                    {fix.type} • {fix.target}
                  </div>
                </div>
                
                <button
                  onClick={() => onApply?.(suggestion, fixIndex)}
                  className="ml-3 px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-800 rounded transition-colors"
                >
                  Apply
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
function calculateChanges(original: string, formatted: string) {
  const originalLines = original.split('\n');
  const formattedLines = formatted.split('\n');
  
  let additions = 0;
  let deletions = 0;
  let modifications = 0;
  
  const maxLines = Math.max(originalLines.length, formattedLines.length);
  
  for (let i = 0; i < maxLines; i++) {
    const originalLine = originalLines[i] || '';
    const formattedLine = formattedLines[i] || '';
    
    if (originalLine === formattedLine) {
      continue;
    } else if (!originalLine) {
      additions++;
    } else if (!formattedLine) {
      deletions++;
    } else {
      modifications++;
    }
  }
  
  return { additions, deletions, modifications };
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

export default FormatPreview;