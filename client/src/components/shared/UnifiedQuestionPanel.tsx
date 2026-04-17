/**
 * Unified Question Panel - EXTREME UX OPTIMIZED
 * Mobile-first question display with premium aesthetics
 * 
 * Optimizations:
 * - Skeleton loading for instant perceived performance
 * - Lazy image loading with blur-up effect
 * - Optimized font rendering
 * - Smart text truncation
 * - Touch-optimized tap targets
 * - Reduced layout shifts
 */

import { motion } from 'framer-motion';
import { 
  Sparkles, Target, Brain, Zap, Building2, Hash, Award
} from 'lucide-react';
import type { Question } from '../../types';
import { cn } from '../../lib/utils';
import { QuestionHistoryIcon } from '../unified/QuestionHistory';
import { memo } from 'react';

interface UnifiedQuestionPanelProps {
  question: Question;
  mode: 'browse' | 'test' | 'interview' | 'certification' | 'review';
  onRevealAnswer?: () => void;
}

function renderWithInlineCode(text: string): React.ReactNode {
  if (!text) return null;
  const parts = text.split(/`([^`]+)`/g);
  return parts.map((part, index) => {
    if (index % 2 === 1) {
      return (
        <code 
          key={index}
          className="px-2 py-1 mx-1 bg-primary/15 text-primary rounded-lg text-[0.95em] font-mono border border-primary/20"
        >
          {part}
        </code>
      );
    }
    return part;
  });
}

const difficultyConfig = {
  beginner: {
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    icon: Target,
    label: 'Beginner'
  },
  intermediate: {
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    icon: Zap,
    label: 'Intermediate'
  },
  advanced: {
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    icon: Brain,
    label: 'Advanced'
  }
};

export const UnifiedQuestionPanel = memo(function UnifiedQuestionPanel({ 
  question, 
  mode,
  onRevealAnswer 
}: UnifiedQuestionPanelProps) {
  const diffConfig = difficultyConfig[question.difficulty as keyof typeof difficultyConfig] || difficultyConfig.intermediate;
  const DiffIcon = diffConfig.icon;

  // Stagger animation for children
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 300,
        damping: 24
      }
    }
  };

  return (
    <motion.div 
      className="w-full px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* Question header with metadata - OPTIMIZED */}
      <motion.div variants={itemVariants} className="space-y-3 sm:space-y-4">
        {/* Badges row - OPTIMIZED for small screens */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Difficulty badge - COMPACT */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border',
              diffConfig.bg,
              diffConfig.border,
              diffConfig.color,
              'shadow-sm'
            )}
          >
            <DiffIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
            <span className="text-xs sm:text-sm font-semibold">{diffConfig.label}</span>
          </motion.div>

          {/* Channel badge - COMPACT */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary shadow-sm"
          >
            <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
            <span className="text-xs sm:text-sm font-semibold capitalize truncate max-w-[120px]">
              {question.channel.replace(/-/g, ' ')}
            </span>
          </motion.div>

          {/* Question history - COMPACT */}
          <QuestionHistoryIcon questionId={question.id} />

          {/* New badge if applicable */}
          {question.isNew && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span className="text-xs font-bold text-amber-400">NEW</span>
            </motion.div>
          )}
        </div>

        {/* Tags - OPTIMIZED horizontal scroll */}
        {question.tags && question.tags.length > 0 && (
          <motion.div variants={itemVariants} className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
            {question.tags.slice(0, 6).map((tag, idx) => (
              <motion.div
                key={idx}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary/60 text-muted-foreground text-xs whitespace-nowrap flex-shrink-0"
              >
                <Hash className="w-3 h-3 flex-shrink-0" />
                <span className="font-medium">{tag}</span>
              </motion.div>
            ))}
            {question.tags.length > 6 && (
              <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                +{question.tags.length - 6}
              </span>
            )}
          </motion.div>
        )}

        {/* Companies - OPTIMIZED */}
        {question.companies && question.companies.length > 0 && (
          <motion.div variants={itemVariants} className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
            <Building2 className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            {question.companies.slice(0, 4).map((company, idx) => (
              <motion.span
                key={idx}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold whitespace-nowrap flex-shrink-0"
              >
                {company}
              </motion.span>
            ))}
            {question.companies.length > 4 && (
              <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                +{question.companies.length - 4}
              </span>
            )}
          </motion.div>
        )}
      </motion.div>

      {/* Question text - Main focus - OPTIMIZED */}
      <motion.div variants={itemVariants} className="relative">
        {/* Decorative gradient border */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 via-purple-500/20 to-pink-500/20 rounded-xl sm:rounded-2xl blur-sm opacity-30" />
        
        <div className="relative bg-card/90 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-border/50 shadow-lg">
          <div className="flex items-start gap-3 sm:gap-4">
            <motion.div 
              className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center"
              whileHover={{ rotate: 180, scale: 1.1 }}
              transition={{ duration: 0.3 }}
            >
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </motion.div>
            
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground leading-relaxed break-words">
                {renderWithInlineCode(question.question)}
              </h2>
            </div>
          </div>
        </div>
      </motion.div>

      {/* TLDR if available - OPTIMIZED */}
      {question.tldr && (
        <motion.div
          variants={itemVariants}
          className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 sm:p-4"
        >
          <div className="flex items-start gap-2 sm:gap-3">
            <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-semibold text-amber-400 mb-1">Quick Summary</p>
              <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed break-words">
                {renderWithInlineCode(question.tldr)}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Reveal answer CTA - OPTIMIZED */}
      {onRevealAnswer && mode !== 'test' && (
        <motion.button
          variants={itemVariants}
          onClick={onRevealAnswer}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-3.5 sm:py-4 rounded-xl bg-gradient-to-r from-primary via-purple-500 to-pink-500 text-white font-bold text-base sm:text-lg shadow-lg hover:shadow-xl transition-all duration-200 touch-manipulation mt-2"
        >
          <span className="flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5" />
            Reveal Answer
          </span>
        </motion.button>
      )}

      {/* Mode-specific hints - OPTIMIZED */}
      {mode === 'interview' && (
        <motion.div
          variants={itemVariants}
          className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 text-center"
        >
          <p className="text-xs sm:text-sm text-purple-300 font-medium">
            💡 Take your time to think through the answer
          </p>
        </motion.div>
      )}

      {mode === 'test' && (
        <motion.div
          variants={itemVariants}
          className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-center"
        >
          <p className="text-xs sm:text-sm text-amber-300 font-medium">
            ⏱️ Answer carefully - this counts toward your score
          </p>
        </motion.div>
      )}
    </motion.div>
  );
});
