import { motion } from 'framer-motion';
import { Target } from 'lucide-react';
import { getSRSStats } from '@/lib/spaced-repetition';

interface EmptyStateProps {
  nextReviewIn?: string;
  streak: number;
  onBrowse: () => void;
  onStudyMore?: () => void;
}

function computeNextReviewDisplay(): string {
  const stats = getSRSStats();

  if (stats.totalCards === 0) {
    return 'Start learning to build your review queue';
  }

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
  const nextReviewDisplay = computeNextReviewDisplay();

  return (
    <div className="flex items-center justify-center h-full min-h-[400px] bg-background">
      <motion.div
        className="flex flex-col items-center text-center px-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="mb-6"
        >
          <div className="w-20 h-20 rounded-full bg-purple-600/20 flex items-center justify-center">
            <Target className="w-10 h-10 text-purple-400" />
          </div>
        </motion.div>

        <h2 className="text-2xl font-bold text-white mb-2">All caught up!</h2>
        <p className="text-muted-foreground mb-8">{nextReviewDisplay}</p>

        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <button
            onClick={onBrowse}
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-6 py-3 font-semibold transition-colors"
          >
            Browse more topics
          </button>
          {onStudyMore && (
            <button
              onClick={onStudyMore}
              className="border border-purple-600/50 hover:border-purple-600 text-purple-400 hover:text-purple-300 rounded-xl px-6 py-3 font-semibold transition-colors"
            >
              Study more
            </button>
          )}
        </div>

        <p className="text-sm text-muted-foreground">
          Your streak: {streak} days <span className="ml-1">🔥</span>
        </p>
      </motion.div>
    </div>
  );
}
