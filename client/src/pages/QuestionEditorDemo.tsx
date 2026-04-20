/**
 * Question Editor Demo Page
 * 
 * Demonstrates the integrated Question Editor with Answer Formatting Standards
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Edit3, FileText } from 'lucide-react';
import { useLocation } from 'wouter';

import { QuestionEditor } from '../components/QuestionEditor';
import type { Question } from '@/lib/answer-formatting/types';

// Sample questions for demo
const sampleQuestions: Partial<Question>[] = [
  {
    id: 'demo-1',
    question: 'What is the difference between React and Vue.js?',
    answer: 'React and Vue.js are both popular JavaScript frameworks but they have different approaches.',
    channel: 'frontend',
    difficulty: 'intermediate',
    tags: ['react', 'vue', 'javascript', 'frameworks'],
    companies: ['Google', 'Meta', 'Netflix']
  },
  {
    id: 'demo-2',
    question: 'How do you implement a binary search algorithm?',
    answer: 'Binary search is an efficient algorithm for finding an item from a sorted list.',
    channel: 'algorithms',
    difficulty: 'intermediate',
    tags: ['binary-search', 'algorithms', 'sorting'],
    companies: ['Amazon', 'Microsoft', 'Apple']
  },
  {
    id: 'demo-3',
    question: 'What are the advantages and disadvantages of microservices architecture?',
    answer: 'Microservices architecture has both benefits and drawbacks that should be considered.',
    channel: 'system-design',
    difficulty: 'advanced',
    tags: ['microservices', 'architecture', 'system-design'],
    companies: ['Netflix', 'Uber', 'Airbnb']
  }
];

export default function QuestionEditorDemo() {
  const [, setLocation] = useLocation();
  const [currentQuestion, setCurrentQuestion] = useState<Partial<Question> | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [savedQuestions, setSavedQuestions] = useState<Question[]>([]);

  const handleCreateNew = () => {
    setCurrentQuestion({});
    setIsEditing(true);
  };

  const handleEditQuestion = (question: Partial<Question>) => {
    setCurrentQuestion(question);
    setIsEditing(true);
  };

  const handleSaveQuestion = (question: Question) => {
    setSavedQuestions(prev => {
      const existing = prev.find(q => q.id === question.id);
      if (existing) {
        return prev.map(q => q.id === question.id ? question : q);
      } else {
        return [...prev, question];
      }
    });
    setIsEditing(false);
    setCurrentQuestion(null);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setCurrentQuestion(null);
  };

  if (isEditing) {
    return (
      <div className="min-h-screen bg-background">
        <QuestionEditor
          question={currentQuestion || undefined}
          onSave={handleSaveQuestion}
          onCancel={handleCancelEdit}
          className="h-screen"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setLocation('/')}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold">Question Editor Demo</h1>
                <p className="text-muted-foreground">
                  Integrated with Answer Formatting Standards
                </p>
              </div>
            </div>

            <button
              onClick={handleCreateNew}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Question
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Sample Questions */}
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Sample Questions
            </h2>
            <p className="text-muted-foreground mb-6">
              Try editing these sample questions to see the Answer Formatting Standards in action.
            </p>

            <div className="space-y-4">
              {sampleQuestions.map((question, index) => (
                <motion.div
                  key={question.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-medium mb-2 line-clamp-2">
                        {question.question}
                      </h3>
                      
                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                          {question.channel}
                        </span>
                        <span className="px-2 py-1 bg-muted text-xs rounded">
                          {question.difficulty}
                        </span>
                      </div>

                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {question.answer}
                      </p>

                      {question.tags && question.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {question.tags.slice(0, 3).map(tag => (
                            <span
                              key={tag}
                              className="px-1.5 py-0.5 bg-muted text-xs rounded"
                            >
                              {tag}
                            </span>
                          ))}
                          {question.tags.length > 3 && (
                            <span className="text-xs text-muted-foreground">
                              +{question.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleEditQuestion(question)}
                      className="p-2 hover:bg-muted rounded-lg transition-colors shrink-0"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Saved Questions */}
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-green-600" />
              Saved Questions ({savedQuestions.length})
            </h2>
            <p className="text-muted-foreground mb-6">
              Questions you've created or edited will appear here.
            </p>

            {savedQuestions.length === 0 ? (
              <div className="bg-card border border-dashed border-border rounded-lg p-8 text-center">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground mb-4">
                  No saved questions yet
                </p>
                <button
                  onClick={handleCreateNew}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Create Your First Question
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {savedQuestions.map((question, index) => (
                  <motion.div
                    key={question.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-card border border-border rounded-lg p-4 hover:border-green-500/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-medium mb-2 line-clamp-2">
                          {question.question}
                        </h3>
                        
                        <div className="flex items-center gap-2 mb-3">
                          <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                            {question.channel}
                          </span>
                          <span className="px-2 py-1 bg-muted text-xs rounded">
                            {question.difficulty}
                          </span>
                          {question.validationScore && (
                            <span className={`px-2 py-1 text-xs rounded ${
                              question.validationScore >= 90
                                ? 'bg-green-500/10 text-green-600'
                                : question.validationScore >= 70
                                ? 'bg-yellow-500/10 text-yellow-600'
                                : 'bg-red-500/10 text-red-600'
                            }`}>
                              Score: {question.validationScore}/100
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {question.answer}
                        </p>

                        {question.detectedPattern && (
                          <div className="mt-2">
                            <span className="px-2 py-1 bg-purple-500/10 text-purple-600 text-xs rounded">
                              Pattern: {question.detectedPattern}
                            </span>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => handleEditQuestion(question)}
                        className="p-2 hover:bg-muted rounded-lg transition-colors shrink-0"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-12 bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Answer Formatting Standards Features</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h3 className="font-medium text-primary">🎯 Pattern Detection</h3>
              <p className="text-sm text-muted-foreground">
                Automatically detects the best format pattern based on your question text
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium text-primary">✅ Real-time Validation</h3>
              <p className="text-sm text-muted-foreground">
                Validates your answer against formatting standards as you type
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium text-primary">🔧 Auto-formatting</h3>
              <p className="text-sm text-muted-foreground">
                Automatically formats your answer to match the detected pattern
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium text-primary">💡 Smart Suggestions</h3>
              <p className="text-sm text-muted-foreground">
                Provides actionable suggestions to improve your answer format
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium text-primary">👀 Format Preview</h3>
              <p className="text-sm text-muted-foreground">
                Shows before/after comparison when applying formatting changes
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium text-primary">📊 Quality Scoring</h3>
              <p className="text-sm text-muted-foreground">
                Scores your answer quality from 0-100 based on formatting standards
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}