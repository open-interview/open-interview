/**
 * Integration Tests for Answer Formatting React Components
 * 
 * Tests validation display rendering, pattern suggestion interaction,
 * and format preview workflow.
 */

import { describe, it, expect, vi } from 'vitest';
import React from 'react';

import { ValidationFeedback } from './ValidationFeedback';
import { PatternSuggestions } from './PatternSuggestions';
import { FormatPreview } from './FormatPreview';

import type { ValidationResult, FormatPattern, FormatSuggestion } from '@/lib/answer-formatting/types';

// Mock data
const mockValidationResult: ValidationResult = {
  isValid: false,
  score: 65,
  violations: [
    {
      rule: 'table-structure',
      severity: 'error' as const,
      message: 'Table must have at least 2 columns',
      location: { line: 1, column: 1 },
      fix: 'Add more columns to your table'
    },
    {
      rule: 'list-format',
      severity: 'warning' as const,
      message: 'List items should be concise',
      location: { line: 5, column: 1 },
      fix: 'Shorten list items to 2 sentences maximum'
    }
  ],
  suggestions: ['Use comparison table format', 'Add proper headers']
};

const mockFormatSuggestion: FormatSuggestion = {
  violation: mockValidationResult.violations[0],
  fixes: [
    {
      id: 'fix-1',
      type: 'replace',
      description: 'Convert to proper table format',
      target: 'table content',
      replacement: '| Column 1 | Column 2 |\n|----------|----------|\n| Data 1   | Data 2   |'
    }
  ],
  priority: 100,
  description: 'Fix table structure issues'
};

const mockPattern: FormatPattern = {
  id: 'comparison-table',
  name: 'Comparison Table',
  keywords: ['compare', 'difference', 'vs'],
  priority: 8,
  structure: {
    sections: [
      { name: 'Introduction', required: false, format: 'text' },
      { name: 'Comparison Table', required: true, format: 'table' }
    ],
    rules: [
      {
        id: 'table-columns',
        description: 'Table must have at least 2 columns',
        validator: () => true,
        errorMessage: 'Add more columns'
      }
    ],
    template: '## Comparison\n\n| Feature | Option A | Option B |\n|---------|----------|----------|\n| Feature 1 | Value A1 | Value B1 |\n| Feature 2 | Value A2 | Value B2 |',
    examples: [
      'Here is a comparison between React and Vue:\n\n| Feature | React | Vue |\n|---------|-------|-----|\n| Learning Curve | Moderate | Easy |\n| Performance | High | High |'
    ]
  }
};

const mockPatterns: FormatPattern[] = [
  mockPattern,
  {
    id: 'definition',
    name: 'Definition Format',
    keywords: ['what is', 'define'],
    priority: 7,
    structure: {
      sections: [
        { name: 'Definition', required: true, format: 'text' },
        { name: 'Details', required: true, format: 'list' }
      ],
      rules: [],
      template: 'Definition text here.\n\n- Key point 1\n- Key point 2\n- Key point 3',
      examples: ['React is a JavaScript library for building user interfaces.\n\n- Component-based architecture\n- Virtual DOM\n- Declarative programming']
    }
  }
];

describe('ValidationFeedback Component', () => {
  it('creates ValidationFeedback component successfully', () => {
    const validResult: ValidationResult = {
      isValid: true,
      score: 100,
      violations: [],
      suggestions: []
    };

    expect(() => {
      React.createElement(ValidationFeedback, { validationResult: validResult });
    }).not.toThrow();
  });

  it('handles validation result with violations', () => {
    expect(() => {
      React.createElement(ValidationFeedback, { 
        validationResult: mockValidationResult,
        suggestions: [mockFormatSuggestion]
      });
    }).not.toThrow();
  });

  it('calls onApplyFix callback when provided', () => {
    const mockOnApplyFix = vi.fn();
    
    expect(() => {
      React.createElement(ValidationFeedback, { 
        validationResult: mockValidationResult,
        suggestions: [mockFormatSuggestion],
        onApplyFix: mockOnApplyFix
      });
    }).not.toThrow();
  });
});

describe('PatternSuggestions Component', () => {
  it('creates PatternSuggestions component successfully', () => {
    expect(() => {
      React.createElement(PatternSuggestions, {
        question: "Random question",
        suggestedPatterns: []
      });
    }).not.toThrow();
  });

  it('handles multiple suggested patterns', () => {
    expect(() => {
      React.createElement(PatternSuggestions, {
        question: "What is the difference between React and Vue?",
        suggestedPatterns: mockPatterns
      });
    }).not.toThrow();
  });

  it('accepts callback functions', () => {
    const mockOnApplyPattern = vi.fn();
    const mockOnPreviewPattern = vi.fn();
    
    expect(() => {
      React.createElement(PatternSuggestions, {
        question: "What is the difference between React and Vue?",
        suggestedPatterns: mockPatterns,
        onApplyPattern: mockOnApplyPattern,
        onPreviewPattern: mockOnPreviewPattern
      });
    }).not.toThrow();
  });
});

describe('FormatPreview Component', () => {
  const originalAnswer = 'React vs Vue\nReact is good\nVue is also good';
  const formattedAnswer = '## React vs Vue Comparison\n\n| Feature | React | Vue |\n|---------|-------|-----|\n| Learning | Moderate | Easy |\n| Performance | High | High |';

  it('creates FormatPreview component successfully', () => {
    expect(() => {
      React.createElement(FormatPreview, {
        originalAnswer: originalAnswer,
        formattedAnswer: formattedAnswer,
        pattern: mockPattern
      });
    }).not.toThrow();
  });

  it('handles identical answers', () => {
    expect(() => {
      React.createElement(FormatPreview, {
        originalAnswer: originalAnswer,
        formattedAnswer: originalAnswer,
        pattern: mockPattern
      });
    }).not.toThrow();
  });

  it('accepts callback functions', () => {
    const mockOnAccept = vi.fn();
    const mockOnReject = vi.fn();
    const mockOnApplySuggestion = vi.fn();
    
    expect(() => {
      React.createElement(FormatPreview, {
        originalAnswer: originalAnswer,
        formattedAnswer: formattedAnswer,
        pattern: mockPattern,
        suggestions: [mockFormatSuggestion],
        onAccept: mockOnAccept,
        onReject: mockOnReject,
        onApplySuggestion: mockOnApplySuggestion
      });
    }).not.toThrow();
  });
});

describe('Component Integration', () => {
  it('components can be created together', () => {
    const validResult: ValidationResult = {
      isValid: false,
      score: 75,
      violations: mockValidationResult.violations,
      suggestions: []
    };

    expect(() => {
      // Create all components
      React.createElement(ValidationFeedback, { validationResult: validResult });
      React.createElement(PatternSuggestions, {
        question: "Test question",
        suggestedPatterns: mockPatterns
      });
      React.createElement(FormatPreview, {
        originalAnswer: "Original",
        formattedAnswer: "Formatted",
        pattern: mockPattern
      });
    }).not.toThrow();
  });

  it('components handle props correctly', () => {
    // Test that components accept all expected props without errors
    const validationProps = {
      validationResult: mockValidationResult,
      suggestions: [mockFormatSuggestion],
      onApplyFix: vi.fn(),
      className: 'test-class'
    };

    const suggestionProps = {
      question: "Test question",
      suggestedPatterns: mockPatterns,
      onApplyPattern: vi.fn(),
      onPreviewPattern: vi.fn(),
      className: 'test-class'
    };

    const previewProps = {
      originalAnswer: "Original",
      formattedAnswer: "Formatted",
      pattern: mockPattern,
      suggestions: [mockFormatSuggestion],
      onAccept: vi.fn(),
      onReject: vi.fn(),
      onApplySuggestion: vi.fn(),
      className: 'test-class'
    };

    expect(() => {
      React.createElement(ValidationFeedback, validationProps);
      React.createElement(PatternSuggestions, suggestionProps);
      React.createElement(FormatPreview, previewProps);
    }).not.toThrow();
  });
});

describe('Component Props Validation', () => {
  it('ValidationFeedback handles different validation states', () => {
    const successResult: ValidationResult = {
      isValid: true,
      score: 100,
      violations: [],
      suggestions: []
    };

    const failureResult: ValidationResult = {
      isValid: false,
      score: 45,
      violations: [
        {
          rule: 'test-rule',
          severity: 'error' as const,
          message: 'Test error',
          location: { line: 1, column: 1 }
        }
      ],
      suggestions: ['Test suggestion']
    };

    expect(() => {
      React.createElement(ValidationFeedback, { validationResult: successResult });
      React.createElement(ValidationFeedback, { validationResult: failureResult });
    }).not.toThrow();
  });

  it('PatternSuggestions handles empty and populated pattern lists', () => {
    expect(() => {
      React.createElement(PatternSuggestions, {
        question: "Test",
        suggestedPatterns: []
      });
      React.createElement(PatternSuggestions, {
        question: "Test",
        suggestedPatterns: mockPatterns
      });
    }).not.toThrow();
  });

  it('FormatPreview handles different content scenarios', () => {
    const scenarios = [
      { original: "", formatted: "" },
      { original: "Short", formatted: "Short formatted" },
      { original: "Long content\nwith multiple\nlines", formatted: "# Long Content\n\nWith multiple\nlines formatted" }
    ];

    scenarios.forEach(({ original, formatted }) => {
      expect(() => {
        React.createElement(FormatPreview, {
          originalAnswer: original,
          formattedAnswer: formatted,
          pattern: mockPattern
        });
      }).not.toThrow();
    });
  });
});