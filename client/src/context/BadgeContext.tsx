/**
 * Badge Context
 * Manages badge progress and unlock notifications globally
 * Now uses unified notification system for display
 */

import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { 
  Badge, BadgeProgress, calculateBadgeProgress
} from '../lib/badges';
import { getAllQuestions, getQuestionById } from '../lib/questions-loader';
import { useGlobalStats } from '../hooks/use-progress';
import { rewardStorage } from '../lib/rewards';

// Storage keys
const SHOWN_BADGES_KEY = 'shown-badge-unlocks';

function getShownBadges(): string[] {
  try {
    const stored = localStorage.getItem(SHOWN_BADGES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function markBadgeAsShown(badgeId: string): void {
  const shown = getShownBadges();
  if (!shown.includes(badgeId)) {
    shown.push(badgeId);
    localStorage.setItem(SHOWN_BADGES_KEY, JSON.stringify(shown));
  }
}

interface BadgeContextType {
  badgeProgress: BadgeProgress[];
  checkForNewUnlocks: () => void;
  totalUnlocked: number;
  resetShownBadges: () => void; // For testing
  pendingBadges: Badge[];
  consumePendingBadge: () => Badge | undefined;
}

const BadgeContext = createContext<BadgeContextType | null>(null);

export function BadgeProvider({ children }: { children: ReactNode }) {
  const { stats } = useGlobalStats();
  const [badgeProgress, setBadgeProgress] = useState<BadgeProgress[]>([]);
  const [pendingBadges, setPendingBadges] = useState<Badge[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  // Listen for question completion events to trigger badge recalculation
  useEffect(() => {
    const handleQuestionCompleted = () => {
      setRefreshKey(k => k + 1);
    };
    
    window.addEventListener('question-completed', handleQuestionCompleted);
    return () => window.removeEventListener('question-completed', handleQuestionCompleted);
  }, []);

  // Calculate user stats from unified reward storage
  const userStats = useMemo(() => {
    const progress = rewardStorage.getProgress();
    const allQuestions = getAllQuestions();

    // Calculate channel completion percentages
    const channelQuestionCounts: Record<string, number> = {};
    allQuestions.forEach(q => {
      channelQuestionCounts[q.channel] = (channelQuestionCounts[q.channel] || 0) + 1;
    });

    const channelCompletionPcts: number[] = [];
    Object.entries(progress.channelProgress).forEach(([channelId, completed]) => {
      const total = channelQuestionCounts[channelId] || 0;
      if (total > 0) {
        channelCompletionPcts.push(Math.round((completed / total) * 100));
      }
    });

    return {
      totalCompleted: progress.questionsCompleted,
      streak: progress.currentStreak,
      channelsExplored: progress.channelsExplored,
      difficultyStats: {
        beginner: progress.beginnerCompleted,
        intermediate: progress.intermediateCompleted,
        advanced: progress.advancedCompleted,
      },
      channelCompletionPcts,
      totalChannels: Object.keys(channelQuestionCounts).length
    };
  }, [stats, refreshKey]);

  // Calculate badge progress
  useEffect(() => {
    const progress = calculateBadgeProgress(
      userStats.totalCompleted,
      userStats.streak,
      userStats.channelsExplored,
      userStats.difficultyStats,
      userStats.channelCompletionPcts,
      userStats.totalChannels
    );
    setBadgeProgress(progress);
  }, [userStats]);

  // Check for new unlocks
  const checkForNewUnlocks = useCallback(() => {
    const shownBadges = getShownBadges();
    
    const newUnlocks = badgeProgress
      .filter(bp => bp.isUnlocked && !shownBadges.includes(bp.badge.id))
      .map(bp => bp.badge);

    if (newUnlocks.length > 0) {
      setPendingBadges(prev => {
        // Avoid duplicates
        const existingIds = prev.map(b => b.id);
        const uniqueNew = newUnlocks.filter(b => !existingIds.includes(b.id));
        return [...prev, ...uniqueNew];
      });
    }
  }, [badgeProgress]);

  // Auto-check for new unlocks when badge progress changes
  useEffect(() => {
    checkForNewUnlocks();
  }, [badgeProgress, checkForNewUnlocks]);

  // Show next pending badge - route through unified reward notification system
  useEffect(() => {
    if (pendingBadges.length > 0) {
      const [next] = pendingBadges;
      markBadgeAsShown(next.id);
      rewardStorage.addNotification({
        type: 'achievement',
        title: `Badge Unlocked: ${next.name}`,
        message: next.description,
        icon: '🏆',
        color: '#8b5cf6',
      });
    }
  }, [pendingBadges]);

  // Consume pending badge for unified notification system
  const consumePendingBadge = useCallback(() => {
    if (pendingBadges.length === 0) return undefined;
    const [first, ...rest] = pendingBadges;
    setPendingBadges(rest);
    return first;
  }, [pendingBadges]);

  // Reset shown badges (for testing)
  const resetShownBadges = useCallback(() => {
    localStorage.removeItem(SHOWN_BADGES_KEY);
    setRefreshKey(k => k + 1);
  }, []);

  const totalUnlocked = useMemo(() => 
    badgeProgress.filter(bp => bp.isUnlocked).length,
    [badgeProgress]
  );

  return (
    <BadgeContext.Provider value={{ 
      badgeProgress, 
      checkForNewUnlocks, 
      totalUnlocked, 
      resetShownBadges,
      pendingBadges,
      consumePendingBadge,
    }}>
      {children}
    </BadgeContext.Provider>
  );
}

export function useBadgeContext() {
  const context = useContext(BadgeContext);
  if (!context) {
    throw new Error('useBadgeContext must be used within a BadgeProvider');
  }
  return context;
}
