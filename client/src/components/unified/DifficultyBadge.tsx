/**
 * Unified Difficulty Badge Component
 * 
 * Consistent difficulty level display across the entire application
 * Replaces 15+ duplicate implementations
 * 
 * Used in: TestSession, CertificationExam, VoiceInterview, ReviewSession,
 * CertificationPractice, VoiceSession, TrainingMode, QuestionPanel, and more
 */

import { Zap, Target, Flame } from 'lucide-react';

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';
export type DifficultyBadgeSize = 'xs' | 'sm' | 'md' | 'lg';
export type DifficultyBadgeVariant = 'solid' | 'soft' | 'outline' | 'minimal';

interface DifficultyBadgeProps {
  level: DifficultyLevel;
  size?: DifficultyBadgeSize;
  variant?: DifficultyBadgeVariant;
  showIcon?: boolean;
  showLabel?: boolean;
  uppercase?: boolean;
  className?: string;
}

const levelConfig = {
  beginner: {
    label: 'Beginner',
    icon: Zap,
    colors: {
      solid: 'bg-green-500 text-white',
      soft: 'bg-green-500/10 text-green-600 dark:text-green-400',
      outline: 'border-green-500/30 text-green-600 dark:text-green-400',
      minimal: 'text-green-600 dark:text-green-400'
    }
  },
  intermediate: {
    label: 'Intermediate',
    icon: Target,
    colors: {
      solid: 'bg-yellow-500 text-white',
      soft: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
      outline: 'border-yellow-500/30 text-yellow-600 dark:text-yellow-400',
      minimal: 'text-yellow-600 dark:text-yellow-400'
    }
  },
  advanced: {
    label: 'Advanced',
    icon: Flame,
    colors: {
      solid: 'bg-red-500 text-white',
      soft: 'bg-red-500/10 text-red-600 dark:text-red-400',
      outline: 'border-red-500/30 text-red-600 dark:text-red-400',
      minimal: 'text-red-600 dark:text-red-400'
    }
  }
};

const sizeClasses = {
  xs: {
    text: 'text-[9px]',
    padding: 'px-1.5 py-0.5',
    icon: 'w-2.5 h-2.5'
  },
  sm: {
    text: 'text-[10px]',
    padding: 'px-2 py-0.5',
    icon: 'w-3 h-3'
  },
  md: {
    text: 'text-xs',
    padding: 'px-2 py-1',
    icon: 'w-3.5 h-3.5'
  },
  lg: {
    text: 'text-sm',
    padding: 'px-3 py-1.5',
    icon: 'w-4 h-4'
  }
};

export function DifficultyBadge({
  level,
  size = 'md',
  variant = 'soft',
  showIcon = false,
  showLabel = true,
  uppercase = false,
  className = ''
}: DifficultyBadgeProps) {
  const config = levelConfig[level];
  const sizeConfig = sizeClasses[size];
  const Icon = config.icon;
  
  const colorClass = config.colors[variant];
  const borderClass = variant === 'outline' ? 'border' : '';
  const label = uppercase ? config.label.toUpperCase() : config.label;

  return (
    <span
      className={`
        inline-flex items-center gap-1 rounded font-medium
        ${sizeConfig.text} ${sizeConfig.padding}
        ${colorClass} ${borderClass}
        ${className}
      `}
    >
      {showIcon && <Icon className={sizeConfig.icon} />}
      {showLabel && label}
    </span>
  );
}

/**
 * Difficulty Indicator - Minimal dot indicator
 */
interface DifficultyIndicatorProps {
  level: DifficultyLevel;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function DifficultyIndicator({
  level,
  size = 'md',
  className = ''
}: DifficultyIndicatorProps) {
  const dotSizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5'
  };

  const colors = {
    beginner: 'bg-green-500',
    intermediate: 'bg-yellow-500',
    advanced: 'bg-red-500'
  };

  const label = levelConfig[level].label;

  return (
    <span className={`inline-flex items-center gap-1 ${className}`} aria-label={label}>
      <span
        className={`inline-block rounded-full ${dotSizes[size]} ${colors[level]}`}
        title={label}
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}

/**
 * Difficulty Progress - Shows difficulty distribution
 */
interface DifficultyProgressProps {
  stats: {
    beginner: number;
    intermediate: number;
    advanced: number;
  };
  total: number;
  size?: 'sm' | 'md';
  showLabels?: boolean;
  className?: string;
}

export function DifficultyProgress({
  stats,
  total,
  size = 'md',
  showLabels = true,
  className = ''
}: DifficultyProgressProps) {
  const beginnerPct = total > 0 ? (stats.beginner / total) * 100 : 0;
  const intermediatePct = total > 0 ? (stats.intermediate / total) * 100 : 0;
  const advancedPct = total > 0 ? (stats.advanced / total) * 100 : 0;

  const heightClass = size === 'sm' ? 'h-1.5' : 'h-2';

  return (
    <div className={className}>
      {showLabels && (
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span>Difficulty Distribution</span>
          <span>{total} total</span>
        </div>
      )}
      
      <div className={`flex ${heightClass} rounded-full overflow-hidden bg-muted`}>
        {beginnerPct > 0 && (
          <div
            className="bg-green-500"
            style={{ width: `${beginnerPct}%` }}
            title={`${stats.beginner} Beginner (${Math.round(beginnerPct)}%)`}
          />
        )}
        {intermediatePct > 0 && (
          <div
            className="bg-yellow-500"
            style={{ width: `${intermediatePct}%` }}
            title={`${stats.intermediate} Intermediate (${Math.round(intermediatePct)}%)`}
          />
        )}
        {advancedPct > 0 && (
          <div
            className="bg-red-500"
            style={{ width: `${advancedPct}%` }}
            title={`${stats.advanced} Advanced (${Math.round(advancedPct)}%)`}
          />
        )}
      </div>

      {showLabels && (
        <div className="flex items-center gap-3 mt-2 text-xs">
          <div className="flex items-center gap-1">
            <DifficultyIndicator level="beginner" size="sm" />
            <span className="text-muted-foreground">{stats.beginner}</span>
          </div>
          <div className="flex items-center gap-1">
            <DifficultyIndicator level="intermediate" size="sm" />
            <span className="text-muted-foreground">{stats.intermediate}</span>
          </div>
          <div className="flex items-center gap-1">
            <DifficultyIndicator level="advanced" size="sm" />
            <span className="text-muted-foreground">{stats.advanced}</span>
          </div>
        </div>
      )}
    </div>
  );
}
