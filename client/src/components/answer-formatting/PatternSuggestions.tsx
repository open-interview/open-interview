/**
 * PatternSuggestions Component - Displays suggested patterns based on question
 * 
 * This component shows suggested patterns based on the question text,
 * allows one-click pattern application, and shows pattern templates and examples.
 */

import React, { useState } from 'react';
import type { FormatPattern } from '@/lib/answer-formatting/types';

interface PatternSuggestionsProps {
  question: string;
  suggestedPatterns: FormatPattern[];
  onApplyPattern?: (pattern: FormatPattern) => void;
  onPreviewPattern?: (pattern: FormatPattern) => void;
  className?: string;
}

export const PatternSuggestions: React.FC<PatternSuggestionsProps> = ({
  question,
  suggestedPatterns,
  onApplyPattern,
  onPreviewPattern,
  className = ''
}) => {
  const [expandedPattern, setExpandedPattern] = useState<string | null>(null);

  if (suggestedPatterns.length === 0) {
    return (
      <div className={`pattern-suggestions pattern-suggestions-empty ${className}`}>
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-2 text-gray-600">
            <span>💡</span>
            <span>No specific pattern detected. You can write your answer in any format.</span>
          </div>
        </div>
      </div>
    );
  }

  const topPattern = suggestedPatterns[0];
  const otherPatterns = suggestedPatterns.slice(1);

  return (
    <div className={`pattern-suggestions ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Suggested Format Patterns
        </h3>
        <p className="text-sm text-gray-600">
          Based on your question, these formats would work well for your answer:
        </p>
      </div>

      {/* Top Recommendation */}
      <div className="top-recommendation mb-4">
        <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-blue-600 font-semibold text-sm px-2 py-1 bg-blue-100 rounded">
              RECOMMENDED
            </span>
            <span className="text-lg font-semibold text-blue-800">
              {topPattern.name}
            </span>
          </div>
          
          <div className="text-sm text-gray-700 mb-3">
            This pattern matches your question keywords: {topPattern.keywords.slice(0, 3).join(', ')}
            {topPattern.keywords.length > 3 && ` +${topPattern.keywords.length - 3} more`}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => onApplyPattern?.(topPattern)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
            >
              Use This Format
            </button>
            <button
              onClick={() => onPreviewPattern?.(topPattern)}
              className="px-4 py-2 bg-white hover:bg-gray-50 text-blue-600 border border-blue-300 rounded font-medium transition-colors"
            >
              Preview Template
            </button>
            <button
              onClick={() => setExpandedPattern(
                expandedPattern === topPattern.id ? null : topPattern.id
              )}
              className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-600 border border-gray-300 rounded font-medium transition-colors"
            >
              {expandedPattern === topPattern.id ? 'Hide Details' : 'Show Details'}
            </button>
          </div>

          {expandedPattern === topPattern.id && (
            <PatternDetails pattern={topPattern} />
          )}
        </div>
      </div>

      {/* Other Suggestions */}
      {otherPatterns.length > 0 && (
        <div className="other-suggestions">
          <h4 className="text-md font-medium text-gray-700 mb-3">
            Other Options ({otherPatterns.length})
          </h4>
          
          <div className="space-y-3">
            {otherPatterns.map((pattern) => (
              <PatternSuggestionItem
                key={pattern.id}
                pattern={pattern}
                onApplyPattern={onApplyPattern}
                onPreviewPattern={onPreviewPattern}
                isExpanded={expandedPattern === pattern.id}
                onToggleExpanded={() => setExpandedPattern(
                  expandedPattern === pattern.id ? null : pattern.id
                )}
              />
            ))}
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="mt-6 p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="text-sm text-gray-600">
          <strong>Tip:</strong> Choose the format that best matches what you want to explain. 
          You can always switch formats or customize the template after applying it.
        </div>
      </div>
    </div>
  );
};

interface PatternSuggestionItemProps {
  pattern: FormatPattern;
  onApplyPattern?: (pattern: FormatPattern) => void;
  onPreviewPattern?: (pattern: FormatPattern) => void;
  isExpanded: boolean;
  onToggleExpanded: () => void;
}

const PatternSuggestionItem: React.FC<PatternSuggestionItemProps> = ({
  pattern,
  onApplyPattern,
  onPreviewPattern,
  isExpanded,
  onToggleExpanded
}) => {
  return (
    <div className="pattern-suggestion-item p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-800">{pattern.name}</span>
          <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded">
            Priority: {pattern.priority}
          </span>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => onApplyPattern?.(pattern)}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
          >
            Apply
          </button>
          <button
            onClick={() => onPreviewPattern?.(pattern)}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
          >
            Preview
          </button>
          <button
            onClick={onToggleExpanded}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
          >
            {isExpanded ? '▲' : '▼'}
          </button>
        </div>
      </div>

      <div className="text-sm text-gray-600 mb-2">
        Keywords: {pattern.keywords.slice(0, 4).join(', ')}
        {pattern.keywords.length > 4 && ` +${pattern.keywords.length - 4} more`}
      </div>

      {isExpanded && <PatternDetails pattern={pattern} />}
    </div>
  );
};

interface PatternDetailsProps {
  pattern: FormatPattern;
}

const PatternDetails: React.FC<PatternDetailsProps> = ({ pattern }) => {
  const [activeTab, setActiveTab] = useState<'template' | 'examples' | 'rules'>('template');

  return (
    <div className="pattern-details mt-4 p-4 bg-white border border-gray-200 rounded-lg">
      {/* Tab Navigation */}
      <div className="flex gap-1 mb-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('template')}
          className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'template'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-800'
          }`}
        >
          Template
        </button>
        <button
          onClick={() => setActiveTab('examples')}
          className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'examples'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-800'
          }`}
        >
          Examples ({pattern.structure.examples.length})
        </button>
        <button
          onClick={() => setActiveTab('rules')}
          className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'rules'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-800'
          }`}
        >
          Rules ({pattern.structure.rules.length})
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'template' && (
          <div className="template-tab">
            <h5 className="font-medium text-gray-800 mb-2">Template Structure</h5>
            <pre className="text-sm bg-gray-50 p-3 rounded border overflow-x-auto whitespace-pre-wrap">
              {pattern.structure.template}
            </pre>
          </div>
        )}

        {activeTab === 'examples' && (
          <div className="examples-tab">
            <h5 className="font-medium text-gray-800 mb-2">Example Answers</h5>
            <div className="space-y-3">
              {pattern.structure.examples.map((example, index) => (
                <div key={index} className="example-item">
                  <div className="text-xs text-gray-500 mb-1">Example {index + 1}:</div>
                  <div className="text-sm bg-gray-50 p-3 rounded border">
                    {example.length > 200 ? (
                      <>
                        {example.substring(0, 200)}...
                        <button className="text-blue-600 hover:text-blue-800 ml-2">
                          Show more
                        </button>
                      </>
                    ) : (
                      example
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'rules' && (
          <div className="rules-tab">
            <h5 className="font-medium text-gray-800 mb-2">Format Rules</h5>
            <div className="space-y-2">
              {pattern.structure.rules.map((rule, index) => (
                <div key={rule.id} className="rule-item p-2 bg-gray-50 rounded">
                  <div className="text-sm font-medium text-gray-800">
                    {index + 1}. {rule.description}
                  </div>
                  {rule.errorMessage && (
                    <div className="text-xs text-gray-600 mt-1">
                      Error: {rule.errorMessage}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Pattern Sections */}
      <div className="sections-info mt-4">
        <h5 className="font-medium text-gray-800 mb-2">Required Sections</h5>
        <div className="flex flex-wrap gap-2">
          {pattern.structure.sections.map((section) => (
            <span
              key={section.name}
              className={`text-xs px-2 py-1 rounded ${
                section.required
                  ? 'bg-red-100 text-red-800 border border-red-200'
                  : 'bg-gray-100 text-gray-700 border border-gray-200'
              }`}
            >
              {section.name} {section.required ? '(required)' : '(optional)'}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PatternSuggestions;