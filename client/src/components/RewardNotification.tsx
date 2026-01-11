/**
 * Reward Notification Component
 * Displays XP, credits, level ups, and achievement notifications
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, Star, Zap, Coins, TrendingUp, Award, 
  Flame, Target, CheckCircle, Crown
} from 'lucide-react';
import { RewardResult, UnlockedAchievement } from '../lib/rewards';

interface RewardNotificationProps {
  result: RewardResult | null;
  onDismiss?: () => void;
  autoHide?: boolean;
  autoHideDelay?: number;
}

export function RewardNotification({ 
  result, 
  onDismiss, 
  autoHide = true, 
  autoHideDelay = 4000 
}: RewardNotificationProps) {
  const [visible, setVisible] = useState(false);
  
  useEffect(() => {
    if (result && result.summary.hasRewards) {
      setVisible(true);
      
      if (autoHide) {
        const timer = setTimeout(() => {
          setVisible(false);
          onDismiss?.();
        }, autoHideDelay);
        
        return () => clearTimeout(timer);
      }
    }
  }, [result, autoHide, autoHideDelay, onDismiss]);
  
  if (!result || !result.summary.hasRewards) return null;
  
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="fixed top-4 right-4 z-50 max-w-sm"
        >
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl shadow-2xl border border-slate-700 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <span className="font-semibold text-white">Rewards Earned!</span>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-4 space-y-3">
              {/* XP Earned */}
              {result.xpEarned > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-purple-400" />
                    </div>
                    <span className="text-slate-300">XP Earned</span>
                  </div>
                  <span className="font-bold text-purple-400">+{result.xpEarned}</span>
                </div>
              )}
              
              {/* Streak Bonus */}
              {result.streakBonus > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
                      <Flame className="w-4 h-4 text-orange-400" />
                    </div>
                    <span className="text-slate-300">Streak Bonus</span>
                  </div>
                  <span className="font-bold text-orange-400">+{result.streakBonus}%</span>
                </div>
              )}
              
              {/* Credits Earned */}
              {result.creditsEarned > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                      <Coins className="w-4 h-4 text-amber-400" />
                    </div>
                    <span className="text-slate-300">Credits</span>
                  </div>
                  <span className="font-bold text-amber-400">+{result.creditsEarned}</span>
                </div>
              )}
              
              {/* Level Up */}
              {result.leveledUp && (
                <motion.div 
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 rounded-lg p-3 border border-yellow-500/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-yellow-500/30 flex items-center justify-center">
                      <Crown className="w-5 h-5 text-yellow-400" />
                    </div>
                    <div>
                      <div className="font-bold text-yellow-400">Level Up!</div>
                      <div className="text-sm text-slate-400">
                        Level {result.oldLevel} → Level {result.newLevel}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              
              {/* Achievements */}
              {result.achievementsUnlocked.length > 0 && (
                <div className="space-y-2">
                  {result.achievementsUnlocked.map((achievement) => (
                    <AchievementBadge key={achievement.id} achievement={achievement} />
                  ))}
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="px-4 py-2 bg-slate-800/50 border-t border-slate-700">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">
                  {result.currentStreak > 0 && `🔥 ${result.currentStreak} day streak`}
                </span>
                <button 
                  onClick={() => {
                    setVisible(false);
                    onDismiss?.();
                  }}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function AchievementBadge({ achievement }: { achievement: UnlockedAchievement }) {
  const tierColors: Record<string, string> = {
    bronze: 'from-amber-600 to-amber-800',
    silver: 'from-slate-300 to-slate-500',
    gold: 'from-yellow-400 to-amber-600',
    platinum: 'from-slate-200 to-slate-400',
    diamond: 'from-cyan-300 to-blue-500',
  };
  
  return (
    <motion.div
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className={`bg-gradient-to-r ${tierColors[achievement.tier] || tierColors.bronze} rounded-lg p-3`}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
          <Award className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <div className="font-bold text-white">{achievement.name}</div>
          <div className="text-sm text-white/80">{achievement.description}</div>
        </div>
      </div>
      {(achievement.rewards.xp > 0 || achievement.rewards.credits > 0) && (
        <div className="mt-2 flex gap-3 text-sm text-white/90">
          {achievement.rewards.xp > 0 && (
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3" /> +{achievement.rewards.xp} XP
            </span>
          )}
          {achievement.rewards.credits > 0 && (
            <span className="flex items-center gap-1">
              <Coins className="w-3 h-3" /> +{achievement.rewards.credits}
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
}

// Compact inline notification for smaller displays
export function RewardInline({ result }: { result: RewardResult | null }) {
  if (!result || !result.summary.hasRewards) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-full text-sm"
    >
      {result.xpEarned > 0 && (
        <span className="flex items-center gap-1 text-purple-400">
          <Zap className="w-3 h-3" /> +{result.xpEarned}
        </span>
      )}
      {result.creditsEarned > 0 && (
        <span className="flex items-center gap-1 text-amber-400">
          <Coins className="w-3 h-3" /> +{result.creditsEarned}
        </span>
      )}
      {result.leveledUp && (
        <span className="flex items-center gap-1 text-yellow-400">
          <TrendingUp className="w-3 h-3" /> Level {result.newLevel}!
        </span>
      )}
    </motion.div>
  );
}

export default RewardNotification;
