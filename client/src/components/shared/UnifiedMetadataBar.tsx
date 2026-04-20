/**
 * Unified Metadata Bar
 * Top bar showing question progress and difficulty
 * iPhone 13 optimized with safe area support
 */

import { motion } from 'framer-motion';
import { Target, Zap, Brain, Award } from 'lucide-react';
import { cn } from '../../lib/utils';

interface UnifiedMetadataBarProps {
  questionNumber: number;
  totalQuestions: number;
  difficulty: string;
  channel: string;
  mode: 'browse' | 'test' | 'interview' | 'certification' | 'review';
}

const difficultyIcons = {
  beginner: Target,
  intermediate: Zap,
  advanced: Brain
};

const difficultyColors = {
  beginner: 'text-green-400',
  intermediate: 'text-amber-400',
  advanced: 'text-red-400'
};

export function UnifiedMetadataBar({
  questionNumber,
  totalQuestions,
  difficulty,
  channel,
  mode
}: UnifiedMetadataBarProps) {
  const DiffIcon = difficultyIcons[difficulty as keyof typeof difficultyIcons] || Zap;
  const diffColor = difficultyColors[difficulty as keyof typeof difficultyColors] || 'text-amber-400';

  return (
    <div className="bg-card/60 backdrop-blur-xl border-b border-border/30">
      <div className="px-3 sm:px-4 py-2.5 sm:py-3">
        <div className="flex items-center justify-between gap-3">
          {/* Left: Question counter */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
              <span className="text-sm font-bold text-primary">{questionNumber}</span>
              <span className="text-xs text-muted-foreground">/</span>
              <span className="text-sm text-muted-foreground">{totalQuestions}</span>
            </div>

            {/* Difficulty indicator - hidden on very small screens */}
            <div className={cn(
              'hidden xs:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-secondary/50'
            )}>
              <DiffIcon className={cn('w-4 h-4', diffColor)} />
              <span className={cn('text-xs font-medium capitalize', diffColor)}>
                {difficulty}
              </span>
            </div>
          </div>

          {/* Right: Mode indicator */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg bg-secondary/50">
              <Award className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium text-muted-foreground capitalize hidden sm:inline">
                {mode}
              </span>
            </div>
          </div>
        </div>

        {/* Mobile difficulty (shown below on very small screens) */}
        <div className="flex xs:hidden mt-2">
          <div className={cn(
            'flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-secondary/50'
          )}>
            <DiffIcon className={cn('w-3.5 h-3.5', diffColor)} />
            <span className={cn('text-xs font-medium capitalize', diffColor)}>
              {difficulty}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
