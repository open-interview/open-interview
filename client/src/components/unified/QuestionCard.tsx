/**
 * Unified QuestionCard Component
 * 
 * Consistent question display across the entire application
 * Replaces 10+ duplicate implementations
 * 
 * Used in: QuestionViewer, TestSession, CertificationPractice, CertificationExam,
 * ReviewSession, TrainingMode, VoiceSession, VoiceInterview, Bookmarks, and more
 */

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { 
  Bookmark, Building2, Hash, Clock, Check, Sparkles
} from 'lucide-react';
import type { Question } from '../../lib/data';
import { formatTag } from '../../lib/utils';
import { DifficultyBadge } from './DifficultyBadge';
import { QuestionHistoryIcon, QuestionType } from './QuestionHistory';

export type QuestionCardVariant = 'default' | 'compact' | 'detailed' | 'minimal';
export type QuestionCardSize = 'sm' | 'md' | 'lg';

interface QuestionCardProps {
  question: Question;
  variant?: QuestionCardVariant;
  size?: QuestionCardSize;
  
  // Display options
  showDifficulty?: boolean;
  showCompanies?: boolean;
  showSubChannel?: boolean;
  showTags?: boolean;
  showQuestionId?: boolean;
  showProgress?: boolean;
  showTimer?: boolean;
  showBookmark?: boolean;
  showCompleted?: boolean;
  showHistory?: boolean;
  
  // Question type for history tracking
  questionType?: QuestionType;
  
  // State
  isMarked?: boolean;
  isCompleted?: boolean;
  questionNumber?: number;
  totalQuestions?: number;
  timerEnabled?: boolean;
  timeLeft?: number;
  
  // Actions
  onToggleMark?: () => void;
  onTapQuestion?: () => void;
  
  // Custom content
  footer?: ReactNode;
  badge?: ReactNode;
  
  // Styling
  className?: string;
  animated?: boolean;
}

const sizeClasses: Record<QuestionCardSize, { padding: string; title: string; meta: string }> = {
  sm: {
    padding: 'px-3 py-2',
    title: 'text-sm sm:text-base',
    meta: 'text-[9px] sm:text-[10px]'
  },
  md: {
    padding: 'px-3 sm:px-4 lg:px-6 py-3 sm:py-4',
    title: 'text-base sm:text-lg lg:text-xl',
    meta: 'text-[10px] sm:text-xs'
  },
  lg: {
    padding: 'px-4 sm:px-6 lg:px-8 py-4 sm:py-6',
    title: 'text-lg sm:text-xl lg:text-2xl',
    meta: 'text-xs sm:text-sm'
  }
};

/**
 * Renders text with inline code (backticks) as styled code elements
 */
function renderWithInlineCode(text: string): React.ReactNode {
  if (!text) return null;
  
  const parts = text.split(/`([^`]+)`/g);
  
  return parts.map((part, index) => {
    if (index % 2 === 1) {
      return (
        <code 
          key={index}
          className="px-1.5 py-0.5 mx-0.5 bg-primary/15 text-primary rounded text-[0.9em] font-mono"
        >
          {part}
        </code>
      );
    }
    return part;
  });
}

/**
 * Background mascot SVGs based on difficulty
 */
function BackgroundMascot({ difficulty }: { difficulty: string }) {
  const baseClasses = "hidden sm:block absolute bottom-8 right-8 w-32 h-32 lg:w-40 lg:h-40 opacity-[0.06] pointer-events-none select-none z-0";
  
  if (difficulty === 'beginner') {
    return (
      <svg className={baseClasses} viewBox="0 0 100 100" fill="currentColor" aria-hidden="true">
        <circle cx="50" cy="45" r="28" strokeWidth="3" stroke="currentColor" fill="none" />
        <rect x="42" y="73" width="16" height="12" rx="2" />
        <rect x="38" y="85" width="24" height="6" rx="2" />
        <circle cx="40" cy="42" r="5" />
        <circle cx="60" cy="42" r="5" />
        <path d="M38 52 Q50 62 62 52" strokeWidth="3" stroke="currentColor" fill="none" />
        <line x1="50" y1="17" x2="50" y2="8" strokeWidth="2" stroke="currentColor" />
        <circle cx="50" cy="5" r="4" />
        <rect x="18" y="38" width="6" height="14" rx="2" />
        <rect x="76" y="38" width="6" height="14" rx="2" />
      </svg>
    );
  }
  
  if (difficulty === 'intermediate') {
    return (
      <svg className={baseClasses} viewBox="0 0 100 100" fill="currentColor" aria-hidden="true">
        <circle cx="50" cy="45" r="28" strokeWidth="3" stroke="currentColor" fill="none" />
        <rect x="42" y="73" width="16" height="12" rx="2" />
        <rect x="38" y="85" width="24" height="6" rx="2" />
        <rect x="35" y="40" width="10" height="6" rx="1" />
        <rect x="55" y="40" width="10" height="6" rx="1" />
        <line x1="40" y1="55" x2="60" y2="55" strokeWidth="3" stroke="currentColor" />
        <line x1="50" y1="17" x2="50" y2="8" strokeWidth="2" stroke="currentColor" />
        <polygon points="50,2 46,8 54,8" />
        <circle cx="82" cy="50" r="8" strokeWidth="2" stroke="currentColor" fill="none" />
        <circle cx="82" cy="50" r="3" />
      </svg>
    );
  }
  
  return (
    <svg className={baseClasses} viewBox="0 0 100 100" fill="currentColor" aria-hidden="true">
      <circle cx="50" cy="45" r="28" strokeWidth="3" stroke="currentColor" fill="none" />
      <rect x="42" y="73" width="16" height="12" rx="2" />
      <rect x="38" y="85" width="24" height="6" rx="2" />
      <ellipse cx="40" cy="42" rx="6" ry="7" />
      <ellipse cx="60" cy="42" rx="6" ry="7" />
      <circle cx="42" cy="41" r="2" fill="white" />
      <circle cx="62" cy="41" r="2" fill="white" />
      <path d="M38 56 Q50 52 62 56" strokeWidth="3" stroke="currentColor" fill="none" />
      <ellipse cx="78" cy="35" rx="3" ry="5" />
      <ellipse cx="82" cy="45" rx="2" ry="4" />
      <line x1="50" y1="17" x2="50" y2="5" strokeWidth="2" stroke="currentColor" />
      <circle cx="50" cy="3" r="3" />
      <polygon points="85,20 80,30 84,30 79,42 88,28 84,28" />
    </svg>
  );
}

export function QuestionCard({
  question,
  variant = 'default',
  size = 'md',
  showDifficulty = true,
  showCompanies = true,
  showSubChannel = true,
  showTags = true,
  showQuestionId = false,
  showProgress = false,
  showTimer = false,
  showBookmark = false,
  showCompleted = false,
  showHistory = true,
  questionType = 'question',
  isMarked = false,
  isCompleted = false,
  questionNumber,
  totalQuestions,
  timerEnabled = false,
  timeLeft = 0,
  onToggleMark,
  onTapQuestion,
  footer,
  badge,
  className = '',
  animated = true
}: QuestionCardProps) {
  const sizeConfig = sizeClasses[size];
  
  // Determine title size based on question length
  const getTitleSize = () => {
    const length = question.question.length;
    if (variant === 'compact' || variant === 'minimal') return 'text-sm';
    if (length > 200) return 'text-sm sm:text-base lg:text-lg';
    if (length > 100) return 'text-base sm:text-lg lg:text-xl';
    return sizeConfig.title;
  };

  const content = (
    <div 
      className={`
        w-full h-full flex flex-col ${sizeConfig.padding} overflow-y-auto relative
        ${onTapQuestion ? 'cursor-pointer lg:cursor-default' : ''}
        ${className}
      `}
      onClick={onTapQuestion}
      data-testid="question-card"
    >
      {/* Background mascot - only for detailed variant */}
      {variant === 'detailed' && <BackgroundMascot difficulty={question.difficulty} />}
      
      {/* Top bar */}
      {(showProgress || showDifficulty || showCompleted || showBookmark || showQuestionId || showHistory || badge) && (
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {/* Question ID - Desktop only */}
            {showQuestionId && (
              <div className="hidden lg:flex items-center gap-1 px-2 py-1 bg-muted/50 border border-border rounded-md">
                <Hash className="w-3 h-3 text-primary" />
                <span className={`font-mono text-muted-foreground ${sizeConfig.meta}`}>{question.id}</span>
              </div>
            )}

            {/* Progress pill */}
            {showProgress && questionNumber && totalQuestions && (
              <div className="flex items-center gap-1 px-2 py-1 bg-muted rounded-md">
                <span className={`font-medium text-muted-foreground ${sizeConfig.meta}`}>
                  {questionNumber}<span className="text-muted-foreground/50">/</span>{totalQuestions}
                </span>
              </div>
            )}
            
            {/* Difficulty badge */}
            {showDifficulty && (
              <DifficultyBadge 
                level={question.difficulty as 'beginner' | 'intermediate' | 'advanced'} 
                size={size === 'sm' ? 'xs' : size === 'md' ? 'sm' : 'md'}
                showIcon={variant !== 'minimal'}
              />
            )}

            {/* Completed indicator */}
            {showCompleted && isCompleted && (
              <div className="flex items-center gap-1 px-2 py-1 bg-green-500/10 border border-green-500/20 rounded-md">
                <Check className="w-3 h-3 text-green-500" />
                <span className={`font-medium text-green-500 ${sizeConfig.meta}`}>Done</span>
              </div>
            )}

            {/* NEW badge - show for new questions */}
            {question.isNew && (
              <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-md">
                <Sparkles className="w-3 h-3 text-purple-500" />
                <span className={`font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent ${sizeConfig.meta}`}>NEW</span>
              </div>
            )}

            {/* Custom badge */}
            {badge}
          </div>

          <div className="flex items-center gap-1.5">
            {/* History icon */}
            {showHistory && question.id && (
              <QuestionHistoryIcon 
                questionId={question.id} 
                questionType={questionType}
                size={size === 'lg' ? 'md' : 'sm'}
              />
            )}

            {/* Bookmark button */}
            {showBookmark && onToggleMark && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleMark();
                }}
                className={`p-1.5 rounded-md transition-colors ${
                  isMarked
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'bg-muted text-muted-foreground hover:text-primary'
                }`}
              >
                <Bookmark className={`w-4 h-4 ${isMarked ? 'fill-current' : ''}`} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main content area - Question */}
      <div className={`flex-1 flex flex-col ${variant === 'compact' ? 'justify-start' : 'justify-center'} max-w-2xl w-full`}>
        
        {/* Companies */}
        {showCompanies && question.companies && question.companies.length > 0 && (
          <div className="flex items-center gap-1.5 mb-2 flex-wrap">
            <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
            {question.companies.map((company, idx) => (
              <span key={idx} className={`px-2 py-0.5 bg-blue-500/10 text-blue-500 font-medium rounded-full ${sizeConfig.meta}`}>
                {company}
              </span>
            ))}
          </div>
        )}

        {/* Question text */}
        <h1
          className={`font-bold text-foreground leading-tight ${getTitleSize()}`}
        >
          {renderWithInlineCode(question.question)}
        </h1>

        {/* Sub-channel */}
        {showSubChannel && question.subChannel && (
          <div className="mt-2">
            <span className={`text-muted-foreground uppercase tracking-wider font-medium ${sizeConfig.meta}`}>
              {question.subChannel}
            </span>
          </div>
        )}

        {/* Tags - Compact */}
        {showTags && question.tags && question.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {question.tags.slice(0, 5).map(tag => (
              <span key={tag} className={`px-1.5 py-0.5 bg-muted font-mono text-muted-foreground rounded border border-border ${sizeConfig.meta}`}>
                {formatTag(tag)}
              </span>
            ))}
            {question.tags.length > 5 && (
              <span className={`text-muted-foreground py-0.5 ${sizeConfig.meta}`}>+{question.tags.length - 5}</span>
            )}
          </div>
        )}

        {/* Timer */}
        {showTimer && timerEnabled && timeLeft > 0 && (
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded-lg self-start">
            <Clock className="w-4 h-4 text-primary" />
            <div className="text-lg font-mono font-bold text-primary tabular-nums">
              {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(timeLeft % 60).padStart(2, '0')}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      {footer && (
        <div className="mt-auto pt-3">
          {footer}
        </div>
      )}
    </div>
  );

  if (animated) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full h-full"
      >
        {content}
      </motion.div>
    );
  }

  return content;
}

/**
 * Compact Question Card - For lists and grids
 */
interface CompactQuestionCardProps {
  question: Question;
  onClick?: () => void;
  isMarked?: boolean;
  isCompleted?: boolean;
  onToggleMark?: () => void;
  showHistory?: boolean;
  questionType?: QuestionType;
  className?: string;
}

export function CompactQuestionCard({
  question,
  onClick,
  isMarked = false,
  isCompleted = false,
  onToggleMark,
  showHistory = true,
  questionType = 'question',
  className = ''
}: CompactQuestionCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        p-4 bg-card border border-border rounded-xl cursor-pointer
        hover:border-primary/30 hover:shadow-lg transition-all
        ${className}
      `}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <DifficultyBadge 
              level={question.difficulty as 'beginner' | 'intermediate' | 'advanced'} 
              size="xs"
            />
            {isCompleted && (
              <Check className="w-3.5 h-3.5 text-green-500" />
            )}
          </div>
          <h3 className="font-semibold text-sm line-clamp-2 mb-1">
            {question.question}
          </h3>
          <p className="text-xs text-muted-foreground">
            {question.subChannel}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {showHistory && question.id && (
            <QuestionHistoryIcon 
              questionId={question.id} 
              questionType={questionType}
              size="sm"
            />
          )}
          {onToggleMark && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleMark();
              }}
              className={`p-1 rounded ${isMarked ? 'text-primary' : 'text-muted-foreground'}`}
            >
              <Bookmark className={`w-4 h-4 ${isMarked ? 'fill-current' : ''}`} />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Minimal Question Card - For inline display
 */
interface MinimalQuestionCardProps {
  question: Question;
  onClick?: () => void;
  className?: string;
}

export function MinimalQuestionCard({
  question,
  onClick,
  className = ''
}: MinimalQuestionCardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        flex items-center gap-3 p-2 rounded-lg
        ${onClick ? 'cursor-pointer hover:bg-muted/50' : ''}
        ${className}
      `}
    >
      <DifficultyBadge 
        level={question.difficulty as 'beginner' | 'intermediate' | 'advanced'} 
        size="xs"
        variant="minimal"
      />
      <span className="text-sm flex-1 truncate">{question.question}</span>
    </div>
  );
}
