/**
 * Unified Progress Bar
 * Visual progress indicator with smooth animations
 */

import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface UnifiedProgressBarProps {
  current: number;
  total: number;
  mode: 'browse' | 'test' | 'interview' | 'certification' | 'review';
  className?: string;
}

const modeColors = {
  browse: 'from-primary to-cyan-400',
  test: 'from-amber-400 to-orange-400',
  interview: 'from-purple-400 to-pink-400',
  certification: 'from-blue-400 to-indigo-400',
  review: 'from-green-400 to-emerald-400'
};

export function UnifiedProgressBar({ 
  current, 
  total, 
  mode,
  className 
}: UnifiedProgressBarProps) {
  const progress = (current / total) * 100;
  const gradientClass = modeColors[mode];

  return (
    <div className={cn('w-full py-2', className)}>
      <div className="relative h-1.5 bg-secondary/30 rounded-full overflow-hidden">
        {/* Background glow */}
        <motion.div
          className={cn(
            'absolute inset-0 bg-gradient-to-r opacity-20 blur-sm',
            gradientClass
          )}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
        
        {/* Progress bar */}
        <motion.div
          className={cn(
            'absolute inset-y-0 left-0 bg-gradient-to-r rounded-full',
            gradientClass
          )}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        </motion.div>

        {/* Milestone markers */}
        {Array.from({ length: total }).map((_, idx) => {
          const markerPosition = ((idx + 1) / total) * 100;
          const isPassed = idx < current;
          
          return (
            <div
              key={idx}
              className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full transition-all"
              style={{ left: `${markerPosition}%` }}
            >
              <div className={cn(
                'w-full h-full rounded-full transition-all',
                isPassed 
                  ? 'bg-white shadow-lg scale-100' 
                  : 'bg-secondary/50 scale-75'
              )} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
