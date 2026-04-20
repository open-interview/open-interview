/**
 * Unified Progress Bar Component
 * 
 * Consistent progress visualization across the entire application
 * Replaces 30+ duplicate implementations
 * 
 * Used in: VoiceSession, CertificationExam, Badges, TestSession, 
 * AllChannels, VoiceInterview, TrainingMode, StatsRedesigned, 
 * ReviewSession, MobileHomeFocused, and more
 */

import { motion } from 'framer-motion';

export type ProgressBarSize = 'xs' | 'sm' | 'md' | 'lg';
export type ProgressBarVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

interface ProgressBarProps {
  current: number;
  max: number;
  size?: ProgressBarSize;
  variant?: ProgressBarVariant;
  showPercentage?: boolean;
  animated?: boolean;
  className?: string;
  label?: string;
  rounded?: boolean;
}

const sizeClasses: Record<ProgressBarSize, string> = {
  xs: 'h-1',
  sm: 'h-1.5',
  md: 'h-2',
  lg: 'h-2.5'
};

const variantClasses: Record<ProgressBarVariant, string> = {
  default: 'bg-primary',
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
  danger: 'bg-red-500',
  info: 'bg-blue-500'
};

export function ProgressBar({
  current,
  max,
  size = 'md',
  variant = 'default',
  showPercentage = false,
  animated = true,
  className = '',
  label,
  rounded = true
}: ProgressBarProps) {
  const percentage = max > 0 ? Math.min((current / max) * 100, 100) : 0;
  const heightClass = sizeClasses[size];
  const colorClass = variantClasses[variant];
  const roundedClass = rounded ? 'rounded-full' : '';

  return (
    <div className={className}>
      {/* Label and percentage */}
      {(label || showPercentage) && (
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
          {label && <span>{label}</span>}
          {showPercentage && <span>{Math.round(percentage)}%</span>}
        </div>
      )}

      {/* Progress bar */}
      <div className={`bg-muted ${roundedClass} overflow-hidden ${heightClass}`}>
        {animated ? (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={`h-full ${colorClass} ${roundedClass}`}
          />
        ) : (
          <div
            className={`h-full ${colorClass} ${roundedClass} transition-all duration-300`}
            style={{ width: `${percentage}%` }}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Segmented Progress Bar - for multi-step processes
 */
interface SegmentedProgressBarProps {
  segments: number;
  currentSegment: number;
  size?: ProgressBarSize;
  variant?: ProgressBarVariant;
  className?: string;
}

export function SegmentedProgressBar({
  segments,
  currentSegment,
  size = 'md',
  variant = 'default',
  className = ''
}: SegmentedProgressBarProps) {
  const heightClass = sizeClasses[size];
  const colorClass = variantClasses[variant];

  return (
    <div className={`flex gap-1 ${className}`}>
      {Array.from({ length: segments }).map((_, index) => (
        <div
          key={index}
          className={`flex-1 ${heightClass} rounded-full overflow-hidden bg-muted`}
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: index < currentSegment ? '100%' : '0%' }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className={`h-full ${colorClass} rounded-full`}
          />
        </div>
      ))}
    </div>
  );
}
