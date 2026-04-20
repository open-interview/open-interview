/**
 * Daily Review Card Component
 * Shows SRS review queue status and quick access to reviews
 * Compact version for sidebar layout
 */

import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { 
  Brain, Flame, ChevronRight, 
  Trophy, Zap, Coins
} from 'lucide-react';
import { 
  getSRSStats, getDueCards, getMasteryColor, getMasteryEmoji, getUserXP,
  type SRSStats, type ReviewCard 
} from '../lib/spaced-repetition';
import { ProgressRing } from './ProgressRing';

// Event emitter for SRS updates
const srsUpdateListeners = new Set<() => void>();

export function notifySRSUpdate() {
  srsUpdateListeners.forEach(listener => listener());
}

export function DailyReviewCard() {
  const [, setLocation] = useLocation();
  const [stats, setStats] = useState<SRSStats | null>(null);
  const [dueCards, setDueCards] = useState<ReviewCard[]>([]);
  const [userXP, setUserXP] = useState({ totalXP: 0, level: 1, xpToNext: 100, progress: 0 });

  const loadData = () => {
    setStats(getSRSStats());
    setDueCards(getDueCards());
    setUserXP(getUserXP());
  };

  useEffect(() => {
    loadData();
    
    // Subscribe to SRS updates
    srsUpdateListeners.add(loadData);
    return () => {
      srsUpdateListeners.delete(loadData);
    };
  }, []);

  if (!stats || stats.totalCards === 0) {
    return null;
  }

  const hasDueCards = stats.dueToday > 0;
  const dailyGoal = 10;
  const todayProgress = Math.min(100, ((stats.newToday + (dailyGoal - stats.dueToday)) / dailyGoal) * 100);

  return (
    <section className="mb-3">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-xl border overflow-hidden ${
          hasDueCards 
            ? 'bg-gradient-to-br from-purple-500/10 via-blue-500/5 to-cyan-500/10 border-purple-500/20' 
            : 'bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-green-500/20'
        }`}
      >
        {/* Header with Level & Streak - Compact */}
        <div className="px-3 py-2 flex items-center justify-between border-b border-border/30">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-purple-500/20 rounded-full">
              <Zap className="w-2.5 h-2.5 text-purple-400" />
              <span className="text-[10px] font-bold text-purple-400">Lv.{userXP.level}</span>
            </div>
            <span className="text-[10px] text-muted-foreground">{userXP.totalXP} XP</span>
          </div>
          {stats.reviewStreak > 0 && (
            <motion.div 
              className="flex items-center gap-1 text-orange-500"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
            >
              <Flame className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold">{stats.reviewStreak}🔥</span>
            </motion.div>
          )}
        </div>

        {/* Main Content - Compact */}
        <button
          onClick={() => setLocation('/review')}
          className="w-full p-3 text-left hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            {/* Progress Ring - Smaller */}
            <ProgressRing 
              progress={hasDueCards ? todayProgress : 100} 
              size={56}
              strokeWidth={5}
              color={hasDueCards ? '#a855f7' : '#22c55e'}
              bgColor={hasDueCards ? 'rgba(168, 85, 247, 0.15)' : 'rgba(34, 197, 94, 0.15)'}
            >
              {hasDueCards ? (
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-500">{stats.dueToday}</div>
                  <div className="text-[8px] text-muted-foreground">due</div>
                </div>
              ) : (
                <Trophy className="w-5 h-5 text-green-500" />
              )}
            </ProgressRing>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Brain className={`w-3.5 h-3.5 ${hasDueCards ? 'text-purple-500' : 'text-green-500'}`} />
                <span className={`text-xs font-semibold ${hasDueCards ? 'text-purple-500' : 'text-green-500'}`}>
                  {hasDueCards ? 'Ready to Review' : 'All Caught Up!'}
                </span>
              </div>
              
              {hasDueCards ? (
                <div className="flex flex-wrap gap-1">
                  {dueCards.slice(0, 3).map((card) => (
                    <span
                      key={card.questionId}
                      className={`inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-medium ${getMasteryColor(card.masteryLevel)} bg-muted/50`}
                    >
                      <span>{getMasteryEmoji(card.masteryLevel)}</span>
                      {card.channel.slice(0, 6)}
                    </span>
                  ))}
                  {dueCards.length > 3 && (
                    <span className="px-1 py-0.5 text-[9px] text-muted-foreground">
                      +{dueCards.length - 3}
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-[10px] text-muted-foreground">
                  {stats.dueTomorrow > 0 
                    ? `${stats.dueTomorrow} due tomorrow`
                    : 'Keep the streak going!'}
                </p>
              )}
            </div>

            <ChevronRight className={`w-4 h-4 ${hasDueCards ? 'text-purple-500' : 'text-green-500'}`} />
          </div>
        </button>

        {/* Stats Footer - Compact 2x2 grid */}
        <div className="px-3 py-2 border-t border-border/30 grid grid-cols-4 gap-1 text-center">
          <div>
            <div className="text-xs font-bold">{stats.totalCards}</div>
            <div className="text-[8px] text-muted-foreground">Cards</div>
          </div>
          <div>
            <div className="text-xs font-bold text-yellow-500">👑{stats.mastered}</div>
            <div className="text-[8px] text-muted-foreground">Master</div>
          </div>
          <div>
            <div className="text-xs font-bold text-blue-500">📚{stats.learning}</div>
            <div className="text-[8px] text-muted-foreground">Learn</div>
          </div>
          <div>
            <div className="text-xs font-bold text-green-500">{stats.dueThisWeek}</div>
            <div className="text-[8px] text-muted-foreground">Week</div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

export default DailyReviewCard;
