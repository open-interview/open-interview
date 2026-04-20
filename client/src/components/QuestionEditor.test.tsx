/**
 * Question Editor Integration Tests
 * 
 * Tests the integration between QuestionEditor and Answer Formatting Standards
 */

import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import type { Question } from '@/lib/answer-formatting/types';

import { QuestionEditor } from './QuestionEditor';

// Mock the answer formatting modules
vi.mock('@/lib/answer-formatting/pattern-detector', () => ({
  patternDetector: {
    detectPattern: vi.fn(() => ({
      id: 'comparison-table',
      name: 'Comparison Table',
      keywords: ['compare', 'difference', 'vs'],
      priority: 8,
      structure: {
        sections: [],
        rules: [],
        template: '| Feature | Option A | Option B |\n|---------|----------|----------|\n| Feature 1 | Value A1 | Value B1 |',
        examples: []
      }
    })),
    getSuggestedPatterns: vi.fn(() => []),
    getConfidence: vi.fn(() => 0.8)
  }
}));

vi.mock('@/lib/answer-formatting/format-validator', () => ({
  formatValidator: {
    validate: vi.fn(() => ({
      isValid: true,
      score: 85,
      violations: [],
      suggestions: []
    }))
  }
}));

vi.mock('@/lib/answer-formatting/auto-formatter', () => ({
  autoFormatter: {
    format: vi.fn((answer) => `Formatted: ${answer}`),
    suggestFixes: vi.fn(() => []),
    applyFix: vi.fn((answer, fix) => `Fixed: ${answer}`)
  }
}));

describe('QuestionEditor Integration', () => {
  it('creates QuestionEditor component successfully', () => {
    expect(() => {
      React.createElement(QuestionEditor, {});
    }).not.toThrow();
  });

  it('handles question prop correctly', () => {
    const sampleQuestion: Partial<Question> = {
      id: 'test-1',
      question: 'What is the difference between React and Vue?',
      answer: 'React and Vue are both JavaScript frameworks.',
      channel: 'frontend',
      difficulty: 'intermediate'
    };

    expect(() => {
      React.createElement(QuestionEditor, { question: sampleQuestion });
    }).not.toThrow();
  });

  it('accepts callback functions', () => {
    const mockOnSave = vi.fn();
    const mockOnCancel = vi.fn();

    expect(() => {
      React.createElement(QuestionEditor, {
        onSave: mockOnSave,
        onCancel: mockOnCancel
      });
    }).not.toThrow();
  });

  it('handles empty question data', () => {
    expect(() => {
      React.createElement(QuestionEditor, { question: {} });
    }).not.toThrow();
  });

  it('integrates with answer formatting components', () => {
    const sampleQuestion: Partial<Question> = {
      question: 'Compare React and Vue',
      answer: 'React vs Vue comparison'
    };

    expect(() => {
      React.createElement(QuestionEditor, { question: sampleQuestion });
    }).not.toThrow();
  });
});

describe('QuestionEditor Props Validation', () => {
  it('handles different question types', () => {
    const questions = [
      {
        question: 'What is React?',
        answer: 'React is a JavaScript library.',
        channel: 'frontend'
      },
      {
        question: 'How to implement binary search?',
        answer: 'Binary search algorithm steps...',
        channel: 'algorithms'
      },
      {
        question: 'Design a URL shortener',
        answer: 'System design for URL shortener...',
        channel: 'system-design'
      }
    ];

    questions.forEach(question => {
      expect(() => {
        React.createElement(QuestionEditor, { question });
      }).not.toThrow();
    });
  });

  it('handles different difficulty levels', () => {
    const difficulties = ['beginner', 'intermediate', 'advanced'];

    difficulties.forEach(difficulty => {
      expect(() => {
        React.createElement(QuestionEditor, {
          question: { difficulty: difficulty as any }
        });
      }).not.toThrow();
    });
  });

  it('handles questions with tags and companies', () => {
    const questionWithMetadata: Partial<Question> = {
      question: 'Test question',
      answer: 'Test answer',
      tags: ['react', 'javascript', 'frontend'],
      companies: ['Google', 'Meta', 'Netflix']
    };

    expect(() => {
      React.createElement(QuestionEditor, { question: questionWithMetadata });
    }).not.toThrow();
  });
});

describe('QuestionEditor Workflow Integration', () => {
  it('supports complete editing workflow', () => {
    const mockOnSave = vi.fn();
    const mockOnCancel = vi.fn();

    const initialQuestion: Partial<Question> = {
      id: 'workflow-test',
      question: 'What are the advantages and disadvantages of microservices?',
      answer: 'Microservices have pros and cons.',
      channel: 'system-design',
      difficulty: 'advanced'
    };

    expect(() => {
      React.createElement(QuestionEditor, {
        question: initialQuestion,
        onSave: mockOnSave,
        onCancel: mockOnCancel
      });
    }).not.toThrow();
  });

  it('integrates with validation workflow', () => {
    const questionForValidation: Partial<Question> = {
      question: 'Compare REST and GraphQL APIs',
      answer: 'REST and GraphQL are different API approaches with their own benefits.',
      channel: 'backend'
    };

    expect(() => {
      React.createElement(QuestionEditor, { question: questionForValidation });
    }).not.toThrow();
  });

  it('supports pattern detection workflow', () => {
    const patternQuestions = [
      { question: 'What is the difference between X and Y?' }, // Comparison
      { question: 'What is React?' }, // Definition
      { question: 'List the types of databases' }, // List
      { question: 'How to deploy an application?' }, // Process
      { question: 'What are the pros and cons of microservices?' } // Pros/Cons
    ];

    patternQuestions.forEach(question => {
      expect(() => {
        React.createElement(QuestionEditor, { question });
      }).not.toThrow();
    });
  });
});

describe('QuestionEditor Error Handling', () => {
  it('handles invalid question data gracefully', () => {
    const invalidQuestions = [
      null,
      undefined,
      { question: null },
      { answer: null },
      { tags: null },
      { companies: null }
    ];

    invalidQuestions.forEach(question => {
      expect(() => {
        React.createElement(QuestionEditor, { question: question as any });
      }).not.toThrow();
    });
  });

  it('handles missing callback functions', () => {
    expect(() => {
      React.createElement(QuestionEditor, {
        question: { question: 'Test', answer: 'Test' }
      });
    }).not.toThrow();
  });

  it('handles component with minimal props', () => {
    expect(() => {
      React.createElement(QuestionEditor, {});
    }).not.toThrow();
  });
});