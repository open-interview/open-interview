import { motion } from 'framer-motion';
import { Target } from 'lucide-react';
import { getSRSStats } from '@/lib/spaced-repetition';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

interface EmptyStateProps {
  nextReviewIn?: string;
  streak: number;
  onBrowse: () => void;
  onStudyMore?: () => void;
}

function computeNextReviewDisplay(): string {
  const stats = getSRSStats();
  if (stats.totalCards === 0) return 'Start learning to build your review queue';
  if (stats.dueToday > 0 || stats.dueTomorrow > 0) {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const msUntilMidnight = midnight.getTime() - now.getTime();
    const totalMinutes = Math.round(msUntilMidnight / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `Next review in ${hours}h ${minutes}m`;
  }
  return 'Next review tomorrow';
}

export function EmptyState({ streak, onBrowse, onStudyMore }: EmptyStateProps) {
  const prefersReducedMotion = useReducedMotion();
  const nextReviewDisplay = computeNextReviewDisplay();

  return (
    <div className="flex items-center justify-center h-full min-h-[400px]">
      <motion.div
        className="flex flex-col items-center text-center px-6"
        initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.5, ease: 'easeOut' }}
      >
        <motion.div
          animate={prefersReducedMotion ? {} : { y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="mb-6 relative"
        >
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center shadow-lg shadow-violet-500/10">
            <Target className="w-10 h-10 text-violet-400" aria-hidden={true} />
          </div>
        </motion.div>

        <h2 className="text-2xl font-bold gradient-text mb-2">All caught up!</h2>
        <p className="text-sm text-muted-foreground mb-8 max-w-xs">{nextReviewDisplay}</p>

        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <button
            onClick={onBrowse}
            className="bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white rounded-xl px-6 py-3 font-semibold transition-all duration-200 shadow-lg shadow-violet-500/20"
          >
            Browse more topics
          </button>
          {onStudyMore && (
            <button
              onClick={onStudyMore}
              className="rounded-xl px-6 py-3 font-semibold transition-all duration-200 border border-violet-500/30 text-violet-300 hover:bg-violet-500/10"
            >
              Study more
            </button>
          )}
        </div>

        <p className="text-sm text-muted-foreground">
          Streak: <span className="font-bold text-amber-400">{streak} days</span>
          {streak > 0 && <span className="ml-1">🔥</span>}
        </p>
      </motion.div>
    </div>
  );
}
