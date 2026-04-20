/**
 * Question Editor Component - Integrated with Answer Formatting Standards
 * 
 * This component provides a comprehensive question editing interface with:
 * - Real-time validation feedback
 * - Pattern suggestions based on question text
 * - Format preview and auto-formatting
 * - Integration with the Answer Formatting Standards system
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Save, Eye, Wand2, AlertCircle, CheckCircle, 
  Lightbulb, FileText, Settings, X, Plus
} from 'lucide-react';

// Import our answer formatting components and utilities
import { ValidationFeedback, PatternSuggestions, FormatPreview } from './answer-formatting';
import { patternDetector } from '@/lib/answer-formatting/pattern-detector';
import { formatValidator } from '@/lib/answer-formatting/format-validator';
import { autoFormatter } from '@/lib/answer-formatting/auto-formatter';
import type { 
  Question, 
  ValidationResult, 
  FormatPattern, 
  FormatSuggestion 
} from '@/lib/answer-formatting/types';

interface QuestionEditorProps {
  question?: Partial<Question>;
  onSave?: (question: Question) => void;
  onCancel?: () => void;
  className?: string;
}

type EditorTab = 'edit' | 'preview' | 'validation';

export const QuestionEditor: React.FC<QuestionEditorProps> = ({
  question: initialQuestion,
  onSave,
  onCancel,
  className = ''
}) => {
  // Form state
  const [formData, setFormData] = useState<Partial<Question>>({
    id: '',
    question: '',
    answer: '',
    explanation: '',
    channel: 'general',
    difficulty: 'intermediate',
    tags: [],
    companies: [],
    subChannel: '',
    ...initialQuestion
  });

  // Editor state
  const [activeTab, setActiveTab] = useState<EditorTab>('edit');
  const [isValidating, setIsValidating] = useState(false);
  const [showPatternSuggestions, setShowPatternSuggestions] = useState(false);
  const [showFormatPreview, setShowFormatPreview] = useState(false);

  // Answer formatting state
  const [detectedPattern, setDetectedPattern] = useState<FormatPattern | null>(null);
  const [suggestedPatterns, setSuggestedPatterns] = useState<FormatPattern[]>([]);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [formatSuggestions, setFormatSuggestions] = useState<FormatSuggestion[]>([]);
  const [formattedAnswer, setFormattedAnswer] = useState<string>('');

  // Debounced validation
  const [validationTimeout, setValidationTimeout] = useState<NodeJS.Timeout | null>(null);

  // Pattern detection based on question text
  const detectPatterns = useCallback(async (questionText: string) => {
    if (!questionText.trim()) {
      setDetectedPattern(null);
      setSuggestedPatterns([]);
      return;
    }

    try {
      const detected = patternDetector.detectPattern(questionText);
      const suggestions = patternDetector.getSuggestedPatterns(questionText);
      
      setDetectedPattern(detected);
      setSuggestedPatterns(suggestions);
      
      // Auto-show pattern suggestions if we have good matches
      if (suggestions.length > 0 && patternDetector.getConfidence() > 0.7) {
        setShowPatternSuggestions(true);
      }
    } catch (error) {
      console.error('Pattern detection failed:', error);
    }
  }, []);

  // Answer validation
  const validateAnswer = useCallback(async (answerText: string, pattern?: FormatPattern) => {
    if (!answerText.trim()) {
      setValidationResult(null);
      setFormatSuggestions([]);
      return;
    }

    setIsValidating(true);
    
    try {
      const targetPattern = pattern || detectedPattern;
      if (!targetPattern) {
        setValidationResult({
          isValid: true,
          score: 100,
          violations: [],
          suggestions: ['No specific pattern detected - answer can use any format']
        });
        setFormatSuggestions([]);
        return;
      }

      const result = formatValidator.validate(answerText, targetPattern);
      const suggestions = autoFormatter.suggestFixes(result);
      
      setValidationResult(result);
      setFormatSuggestions(suggestions);
      
      // Generate formatted version for preview
      const formatted = autoFormatter.format(answerText, targetPattern);
      setFormattedAnswer(formatted);
      
    } catch (error) {
      console.error('Answer validation failed:', error);
      setValidationResult({
        isValid: false,
        score: 0,
        violations: [{
          rule: 'validation-error',
          severity: 'error',
          message: 'Validation failed due to an error'
        }],
        suggestions: []
      });
    } finally {
      setIsValidating(false);
    }
  }, [detectedPattern]);

  // Debounced validation effect
  useEffect(() => {
    if (validationTimeout) {
      clearTimeout(validationTimeout);
    }

    const timeout = setTimeout(() => {
      validateAnswer(formData.answer || '');
    }, 500);

    setValidationTimeout(timeout);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [formData.answer, validateAnswer]);

  // Pattern detection effect
  useEffect(() => {
    detectPatterns(formData.question || '');
  }, [formData.question, detectPatterns]);

  // Form handlers
  const handleInputChange = (field: keyof Question, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTagAdd = (tag: string) => {
    if (tag.trim() && !formData.tags?.includes(tag.trim())) {
      handleInputChange('tags', [...(formData.tags || []), tag.trim()]);
    }
  };

  const handleTagRemove = (tagToRemove: string) => {
    handleInputChange('tags', formData.tags?.filter(tag => tag !== tagToRemove) || []);
  };

  const handleCompanyAdd = (company: string) => {
    if (company.trim() && !formData.companies?.includes(company.trim())) {
      handleInputChange('companies', [...(formData.companies || []), company.trim()]);
    }
  };

  const handleCompanyRemove = (companyToRemove: string) => {
    handleInputChange('companies', formData.companies?.filter(company => company !== companyToRemove) || []);
  };

  // Pattern suggestion handlers
  const handleApplyPattern = (pattern: FormatPattern) => {
    setDetectedPattern(pattern);
    setShowPatternSuggestions(false);
    
    // If answer is empty, provide template
    if (!formData.answer?.trim()) {
      const template = pattern.structure.template;
      handleInputChange('answer', template);
    } else {
      // Format existing answer
      const formatted = autoFormatter.format(formData.answer, pattern);
      setFormattedAnswer(formatted);
      setShowFormatPreview(true);
    }
  };

  const handlePreviewPattern = (pattern: FormatPattern) => {
    const formatted = autoFormatter.format(formData.answer || pattern.structure.template, pattern);
    setFormattedAnswer(formatted);
    setShowFormatPreview(true);
  };

  // Format preview handlers
  const handleAcceptFormat = (formatted: string) => {
    handleInputChange('answer', formatted);
    setShowFormatPreview(false);
  };

  const handleRejectFormat = () => {
    setShowFormatPreview(false);
  };

  // Fix application handlers
  const handleApplyFix = (suggestion: FormatSuggestion, fixIndex: number) => {
    const fix = suggestion.fixes[fixIndex];
    if (!fix || !formData.answer) return;

    try {
      const updatedAnswer = autoFormatter.applyFix(formData.answer, fix);
      handleInputChange('answer', updatedAnswer);
    } catch (error) {
      console.error('Failed to apply fix:', error);
    }
  };

  const handleApplySuggestion = (suggestion: FormatSuggestion, fixIndex: number) => {
    handleApplyFix(suggestion, fixIndex);
  };

  // Save handler
  const handleSave = () => {
    if (!formData.question?.trim() || !formData.answer?.trim()) {
      return;
    }

    const questionToSave: Question = {
      id: formData.id || `q-${Date.now()}`,
      question: formData.question.trim(),
      answer: formData.answer.trim(),
      explanation: formData.explanation?.trim() || '',
      channel: formData.channel || 'general',
      difficulty: formData.difficulty || 'intermediate',
      tags: formData.tags || [],
      companies: formData.companies || [],
      subChannel: formData.subChannel || '',
      // Add formatting metadata
      detectedPattern: detectedPattern?.id,
      appliedPattern: detectedPattern?.id,
      validationScore: validationResult?.score,
      lastValidated: new Date().toISOString(),
      formatVersion: '1.0'
    };

    onSave?.(questionToSave);
  };

  // Validation status
  const validationStatus = useMemo(() => {
    if (isValidating) return { type: 'loading', message: 'Validating...' };
    if (!validationResult) return { type: 'none', message: 'No validation' };
    if (validationResult.isValid) return { type: 'success', message: `Perfect! Score: ${validationResult.score}/100` };
    if (validationResult.score >= 70) return { type: 'warning', message: `Good! Score: ${validationResult.score}/100` };
    return { type: 'error', message: `Needs work! Score: ${validationResult.score}/100` };
  }, [isValidating, validationResult]);

  return (
    <div className={`question-editor bg-background border border-border rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="editor-header p-4 border-b border-border bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">
              {initialQuestion?.id ? 'Edit Question' : 'Create Question'}
            </h2>
            
            {/* Validation Status */}
            <div className="flex items-center gap-2">
              {validationStatus.type === 'loading' && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm">{validationStatus.message}</span>
                </div>
              )}
              {validationStatus.type === 'success' && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">{validationStatus.message}</span>
                </div>
              )}
              {validationStatus.type === 'warning' && (
                <div className="flex items-center gap-2 text-yellow-600">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{validationStatus.message}</span>
                </div>
              )}
              {validationStatus.type === 'error' && (
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{validationStatus.message}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Pattern Suggestions Toggle */}
            {suggestedPatterns.length > 0 && (
              <button
                onClick={() => setShowPatternSuggestions(!showPatternSuggestions)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  showPatternSuggestions
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                }`}
              >
                <Lightbulb className="w-4 h-4 mr-1.5" />
                Patterns ({suggestedPatterns.length})
              </button>
            )}

            {/* Auto-format Button */}
            {detectedPattern && formData.answer && (
              <button
                onClick={() => {
                  const formatted = autoFormatter.format(formData.answer!, detectedPattern);
                  setFormattedAnswer(formatted);
                  setShowFormatPreview(true);
                }}
                className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
              >
                <Wand2 className="w-4 h-4 mr-1.5" />
                Auto-format
              </button>
            )}

            {onCancel && (
              <button
                onClick={onCancel}
                className="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 text-muted-foreground rounded-md transition-colors"
              >
                Cancel
              </button>
            )}

            <button
              onClick={handleSave}
              disabled={!formData.question?.trim() || !formData.answer?.trim()}
              className="px-4 py-1.5 text-sm bg-primary hover:bg-primary/90 text-primary-foreground rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4 mr-1.5" />
              Save
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 mt-4">
          <button
            onClick={() => setActiveTab('edit')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'edit'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Edit
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'preview'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Eye className="w-4 h-4 mr-1.5" />
            Preview
          </button>
          <button
            onClick={() => setActiveTab('validation')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'validation'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Settings className="w-4 h-4 mr-1.5" />
            Validation
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="editor-content flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'edit' && (
            <EditTab
              formData={formData}
              onInputChange={handleInputChange}
              onTagAdd={handleTagAdd}
              onTagRemove={handleTagRemove}
              onCompanyAdd={handleCompanyAdd}
              onCompanyRemove={handleCompanyRemove}
              detectedPattern={detectedPattern}
            />
          )}

          {activeTab === 'preview' && (
            <PreviewTab
              formData={formData}
              detectedPattern={detectedPattern}
              validationResult={validationResult}
            />
          )}

          {activeTab === 'validation' && (
            <ValidationTab
              validationResult={validationResult}
              formatSuggestions={formatSuggestions}
              onApplyFix={handleApplyFix}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Pattern Suggestions Modal */}
      <AnimatePresence>
        {showPatternSuggestions && (
          <PatternSuggestionsModal
            question={formData.question || ''}
            suggestedPatterns={suggestedPatterns}
            onApplyPattern={handleApplyPattern}
            onPreviewPattern={handlePreviewPattern}
            onClose={() => setShowPatternSuggestions(false)}
          />
        )}
      </AnimatePresence>

      {/* Format Preview Modal */}
      <AnimatePresence>
        {showFormatPreview && detectedPattern && (
          <FormatPreviewModal
            originalAnswer={formData.answer || ''}
            formattedAnswer={formattedAnswer}
            pattern={detectedPattern}
            suggestions={formatSuggestions}
            onAccept={handleAcceptFormat}
            onReject={handleRejectFormat}
            onApplySuggestion={handleApplySuggestion}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Edit Tab Component
interface EditTabProps {
  formData: Partial<Question>;
  onInputChange: (field: keyof Question, value: any) => void;
  onTagAdd: (tag: string) => void;
  onTagRemove: (tag: string) => void;
  onCompanyAdd: (company: string) => void;
  onCompanyRemove: (company: string) => void;
  detectedPattern: FormatPattern | null;
}

const EditTab: React.FC<EditTabProps> = ({
  formData,
  onInputChange,
  onTagAdd,
  onTagRemove,
  onCompanyAdd,
  onCompanyRemove,
  detectedPattern
}) => {
  const [newTag, setNewTag] = useState('');
  const [newCompany, setNewCompany] = useState('');

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="p-6 space-y-6 max-h-[600px] overflow-y-auto"
    >
      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Channel</label>
          <select
            value={formData.channel || ''}
            onChange={(e) => onInputChange('channel', e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-md bg-background"
          >
            <option value="general">General</option>
            <option value="system-design">System Design</option>
            <option value="algorithms">Algorithms</option>
            <option value="frontend">Frontend</option>
            <option value="backend">Backend</option>
            <option value="devops">DevOps</option>
            <option value="database">Database</option>
            <option value="security">Security</option>
            <option value="ml-ai">ML/AI</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Difficulty</label>
          <select
            value={formData.difficulty || ''}
            onChange={(e) => onInputChange('difficulty', e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-md bg-background"
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
      </div>

      {/* Question */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Question
          {detectedPattern && (
            <span className="ml-2 px-2 py-0.5 text-xs bg-primary/10 text-primary rounded">
              Pattern: {detectedPattern.name}
            </span>
          )}
        </label>
        <textarea
          value={formData.question || ''}
          onChange={(e) => onInputChange('question', e.target.value)}
          placeholder="Enter your interview question..."
          className="w-full px-3 py-2 border border-border rounded-md bg-background min-h-[100px] resize-y"
        />
      </div>

      {/* Answer */}
      <div>
        <label className="block text-sm font-medium mb-2">Answer</label>
        <textarea
          value={formData.answer || ''}
          onChange={(e) => onInputChange('answer', e.target.value)}
          placeholder="Enter the answer (supports Markdown)..."
          className="w-full px-3 py-2 border border-border rounded-md bg-background min-h-[200px] resize-y font-mono text-sm"
        />
      </div>

      {/* Explanation */}
      <div>
        <label className="block text-sm font-medium mb-2">Detailed Explanation (Optional)</label>
        <textarea
          value={formData.explanation || ''}
          onChange={(e) => onInputChange('explanation', e.target.value)}
          placeholder="Enter detailed explanation (supports Markdown)..."
          className="w-full px-3 py-2 border border-border rounded-md bg-background min-h-[150px] resize-y font-mono text-sm"
        />
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium mb-2">Tags</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {formData.tags?.map(tag => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-1 bg-muted text-sm rounded-md"
            >
              {tag}
              <button
                onClick={() => onTagRemove(tag)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onTagAdd(newTag);
                setNewTag('');
              }
            }}
            placeholder="Add tag..."
            className="flex-1 px-3 py-2 border border-border rounded-md bg-background text-sm"
          />
          <button
            onClick={() => {
              onTagAdd(newTag);
              setNewTag('');
            }}
            className="px-3 py-2 bg-muted hover:bg-muted/80 rounded-md transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Companies */}
      <div>
        <label className="block text-sm font-medium mb-2">Companies</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {formData.companies?.map(company => (
            <span
              key={company}
              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/10 text-blue-600 text-sm rounded-md"
            >
              {company}
              <button
                onClick={() => onCompanyRemove(company)}
                className="text-blue-400 hover:text-blue-600"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newCompany}
            onChange={(e) => setNewCompany(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onCompanyAdd(newCompany);
                setNewCompany('');
              }
            }}
            placeholder="Add company..."
            className="flex-1 px-3 py-2 border border-border rounded-md bg-background text-sm"
          />
          <button
            onClick={() => {
              onCompanyAdd(newCompany);
              setNewCompany('');
            }}
            className="px-3 py-2 bg-muted hover:bg-muted/80 rounded-md transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// Preview Tab Component
interface PreviewTabProps {
  formData: Partial<Question>;
  detectedPattern: FormatPattern | null;
  validationResult: ValidationResult | null;
}

const PreviewTab: React.FC<PreviewTabProps> = ({
  formData,
  detectedPattern,
  validationResult
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="p-6 max-h-[600px] overflow-y-auto"
    >
      <div className="space-y-6">
        {/* Question Preview */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="font-semibold mb-2">Question</h3>
          <p className="text-foreground/90">{formData.question || 'No question entered'}</p>
          
          <div className="flex items-center gap-2 mt-3">
            <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">
              {formData.channel}
            </span>
            <span className="px-2 py-1 bg-muted text-xs rounded">
              {formData.difficulty}
            </span>
            {detectedPattern && (
              <span className="px-2 py-1 bg-green-500/10 text-green-600 text-xs rounded">
                Pattern: {detectedPattern.name}
              </span>
            )}
          </div>
        </div>

        {/* Answer Preview */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="font-semibold mb-2">Answer</h3>
          <div className="prose prose-sm max-w-none">
            <pre className="whitespace-pre-wrap text-sm text-foreground/90 font-sans">
              {formData.answer || 'No answer entered'}
            </pre>
          </div>
        </div>

        {/* Validation Summary */}
        {validationResult && (
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Validation Summary</h3>
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-1 text-xs rounded ${
                validationResult.isValid 
                  ? 'bg-green-500/10 text-green-600' 
                  : 'bg-red-500/10 text-red-600'
              }`}>
                Score: {validationResult.score}/100
              </span>
              <span className="text-sm text-muted-foreground">
                {validationResult.violations.length} issues found
              </span>
            </div>
            {validationResult.violations.length > 0 && (
              <ul className="text-sm text-muted-foreground space-y-1">
                {validationResult.violations.slice(0, 3).map((violation, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-red-500">•</span>
                    {violation.message}
                  </li>
                ))}
                {validationResult.violations.length > 3 && (
                  <li className="text-xs text-muted-foreground">
                    +{validationResult.violations.length - 3} more issues
                  </li>
                )}
              </ul>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Validation Tab Component
interface ValidationTabProps {
  validationResult: ValidationResult | null;
  formatSuggestions: FormatSuggestion[];
  onApplyFix: (suggestion: FormatSuggestion, fixIndex: number) => void;
}

const ValidationTab: React.FC<ValidationTabProps> = ({
  validationResult,
  formatSuggestions,
  onApplyFix
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="p-6 max-h-[600px] overflow-y-auto"
    >
      {validationResult ? (
        <ValidationFeedback
          validationResult={validationResult}
          suggestions={formatSuggestions}
          onApplyFix={onApplyFix}
        />
      ) : (
        <div className="text-center text-muted-foreground py-8">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Enter an answer to see validation results</p>
        </div>
      )}
    </motion.div>
  );
};

// Pattern Suggestions Modal
interface PatternSuggestionsModalProps {
  question: string;
  suggestedPatterns: FormatPattern[];
  onApplyPattern: (pattern: FormatPattern) => void;
  onPreviewPattern: (pattern: FormatPattern) => void;
  onClose: () => void;
}

const PatternSuggestionsModal: React.FC<PatternSuggestionsModalProps> = ({
  question,
  suggestedPatterns,
  onApplyPattern,
  onPreviewPattern,
  onClose
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-background border border-border rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="text-lg font-semibold">Suggested Format Patterns</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          <PatternSuggestions
            question={question}
            suggestedPatterns={suggestedPatterns}
            onApplyPattern={onApplyPattern}
            onPreviewPattern={onPreviewPattern}
          />
        </div>
      </motion.div>
    </motion.div>
  );
};

// Format Preview Modal
interface FormatPreviewModalProps {
  originalAnswer: string;
  formattedAnswer: string;
  pattern: FormatPattern;
  suggestions: FormatSuggestion[];
  onAccept: (formatted: string) => void;
  onReject: () => void;
  onApplySuggestion: (suggestion: FormatSuggestion, fixIndex: number) => void;
}

const FormatPreviewModal: React.FC<FormatPreviewModalProps> = ({
  originalAnswer,
  formattedAnswer,
  pattern,
  suggestions,
  onAccept,
  onReject,
  onApplySuggestion
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onReject}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-background border border-border rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="text-lg font-semibold">Format Preview</h3>
          <button
            onClick={onReject}
            className="p-1 hover:bg-muted rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 max-h-[70vh] overflow-y-auto">
          <FormatPreview
            originalAnswer={originalAnswer}
            formattedAnswer={formattedAnswer}
            pattern={pattern}
            suggestions={suggestions}
            onAccept={onAccept}
            onReject={onReject}
            onApplySuggestion={onApplySuggestion}
          />
        </div>
      </motion.div>
    </motion.div>
  );
};

export default QuestionEditor;