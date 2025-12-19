/**
 * Compact Badge Widget for Home Page (Desktop)
 * Shows recent badges and next badge progress in a minimal format
 */

import { useMemo } from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { Trophy, ChevronRight } from 'lucide-react';
import { BadgeRing } from './BadgeDisplay';
import { calculateBadgeProgress, getTierColor } from '../lib/badges';
import { channels, getQuestions, getAllQuestions, getQuestionDifficulty } from '../lib/data';
import { useGlobalStats } from '../hooks/use-progress';

export function BadgeWidget() {
  const [_, setLocation] = useLocation();
  const { stats } = useGlobalStats();

  const badgeProgress = useMemo(() => {
    const allQuestions = getAllQuestions();
    const allCompletedIds = new Set<string>();
    const channelsWithProgress: string[] = [];
    const channelCompletionPcts: number[] = [];
    const difficultyStats = { beginner: 0, intermediate: 0, advanced: 0 };

    channels.forEach(ch => {
      const questions = getQuestions(ch.id);
      const stored = localStorage.getItem(`progress-${ch.id}`);
      const completedIds = stored ? new Set(JSON.parse(stored)) : new Set<string>();
      
      Array.from(completedIds).forEach((id) => allCompletedIds.add(id as string));
      
      if (completedIds.size > 0) {
        channelsWithProgress.push(ch.id);
      }
      
      if (questions.length > 0) {
        // Cap at 100% to handle recategorized questions
        channelCompletionPcts.push(Math.min(100, Math.round((completedIds.size / questions.length) * 100)));
      }
      
      questions.forEach(q => {
        if (completedIds.has(q.id)) {
          const d = getQuestionDifficulty(q);
          difficultyStats[d]++;
        }
      });
    });

    // Calculate streak
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      if (stats.find(x => x.date === d.toISOString().split('T')[0])) {
        streak++;
      } else {
        break;
      }
    }

    return calculateBadgeProgress(
      allCompletedIds.size,
      streak,
      channelsWithProgress,
      difficultyStats,
      channelCompletionPcts,
      channels.length
    );
  }, [stats]);

  const unlockedBadges = badgeProgress.filter(b => b.isUnlocked);
  const recentBadges = unlockedBadges
    .sort((a, b) => (b.unlockedAt || '').localeCompare(a.unlockedAt || ''))
    .slice(0, 4);

  const nextBadge = badgeProgress
    .filter(b => !b.isUnlocked && b.progress > 0)
    .sort((a, b) => b.progress - a.progress)[0];

  // Don't show if no badges unlocked and no progress
  if (unlockedBadges.length === 0 && !nextBadge) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="hidden lg:block fixed bottom-4 right-4 w-72 border border-border bg-card/95 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden z-40"
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-3 border-b border-border cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setLocation('/badges')}
      >
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold uppercase tracking-widest">Badges</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <span>{unlockedBadges.length} unlocked</span>
          <ChevronRight className="w-3 h-3" />
        </div>
      </div>

      {/* Recent Badges */}
      {recentBadges.length > 0 && (
        <div className="p-3 border-b border-border/50">
          <div className="text-[9px] text-muted-foreground uppercase mb-2">Recent</div>
          <div className="flex gap-2 justify-center">
            {recentBadges.map((bp) => (
              <BadgeRing key={bp.badge.id} progress={bp} size="sm" showProgress={false} />
            ))}
          </div>
        </div>
      )}

      {/* Next Badge Progress */}
      {nextBadge && (
        <div className="p-3">
          <div className="text-[9px] text-muted-foreground uppercase mb-2">Next Up</div>
          <div className="flex items-center gap-2">
            <BadgeRing progress={nextBadge} size="sm" showProgress={false} />
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-bold truncate">{nextBadge.badge.name}</div>
              <div className="h-1 bg-muted/30 rounded-full overflow-hidden mt-1">
                <div
                  className="h-full rounded-full"
                  style={{ 
                    width: `${nextBadge.progress}%`,
                    backgroundColor: getTierColor(nextBadge.badge.tier)
                  }}
                />
              </div>
              <div className="text-[9px] text-muted-foreground mt-0.5">
                {nextBadge.current}/{nextBadge.badge.requirement} {nextBadge.badge.unit}
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
