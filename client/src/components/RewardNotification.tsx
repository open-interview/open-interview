/**
 * RewardNotification — stacked toast notifications with confetti
 */

import { useState, useEffect, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Coins, TrendingUp, Award, Flame, Crown, X } from 'lucide-react';
import { RewardResult, UnlockedAchievement } from '../lib/rewards/types';

// ── Confetti burst ───────────────────────────────────────────
function ConfettiBurst() {
  const colors = ['#ffd700', '#ff8c00', '#7c3aed', '#06b6d4', '#10b981', '#f43f5e', '#a78bfa'];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl">
      {Array.from({ length: 20 }, (_, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-sm"
          style={{ background: colors[i % colors.length], left: `${5 + (i * 4.5) % 90}%`, top: '50%' }}
          initial={{ y: 0, opacity: 1, scale: 1, rotate: 0 }}
          animate={{
            y: [-5, -50 - (i % 4) * 20],
            x: [(i % 2 === 0 ? 1 : -1) * (8 + (i * 6) % 25)],
            opacity: [1, 0],
            scale: [1, 0.4],
            rotate: [0, (i % 2 === 0 ? 1 : -1) * 360],
          }}
          transition={{ duration: 0.7 + (i % 3) * 0.15, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}

// ── Single toast ─────────────────────────────────────────────
interface ToastItem {
  id: string;
  result: RewardResult;
}

function RewardToast({ item, onDismiss }: { item: ToastItem; onDismiss: (id: string) => void }) {
  const { result } = item;
  const hasBadge = result.achievementsUnlocked.length > 0;
  const headerText = hasBadge ? '🏆 Achievement Unlocked!' : '⚡ Rewards Earned!';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 60, scale: 0.92 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 280, damping: 26 }}
      className="relative w-80 rounded-xl overflow-hidden shadow-2xl border border-[var(--color-border)]"
      style={{ background: 'var(--surface-2)' }}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {hasBadge && <ConfettiBurst />}

      {/* Header */}
      <div className="px-4 py-2.5 flex items-center gap-2 border-b border-[var(--color-border-subtle)]"
        style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(124,58,237,0.10))' }}
      >
        <span className="text-sm font-bold flex-1">{headerText}</span>
        <button
          onClick={() => onDismiss(item.id)}
          className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-[var(--surface-3)] transition-colors"
          aria-label="Dismiss notification"
        >
          <X className="w-3 h-3 text-[var(--text-tertiary)]" />
        </button>
      </div>

      {/* Body */}
      <div className="p-3 space-y-2">
        {result.xpEarned > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-purple-500/15 flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <span className="text-sm text-[var(--text-secondary)]">XP Earned</span>
            </div>
            <span className="text-sm font-bold text-purple-400">+{result.xpEarned}</span>
          </div>
        )}

        {result.streakBonus > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-orange-500/15 flex items-center justify-center">
                <Flame className="w-3.5 h-3.5 text-orange-400" />
              </div>
              <span className="text-sm text-[var(--text-secondary)]">Streak Bonus</span>
            </div>
            <span className="text-sm font-bold text-orange-400">+{result.streakBonus}%</span>
          </div>
        )}

        {result.creditsEarned > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-amber-500/15 flex items-center justify-center">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <span className="text-sm text-[var(--text-secondary)]">Credits</span>
            </div>
            <span className="text-sm font-bold text-amber-400">+{result.creditsEarned}</span>
          </div>
        )}

        {result.leveledUp && (
          <motion.div
            initial={{ scale: 0.85 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-3 p-2.5 rounded-lg border border-yellow-500/30"
            style={{ background: 'linear-gradient(135deg, rgba(234,179,8,0.12), rgba(245,158,11,0.08))' }}
          >
            <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <Crown className="w-4 h-4 text-yellow-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-yellow-400">Level Up!</p>
              <p className="text-xs text-[var(--text-tertiary)]">Level {result.oldLevel} → {result.newLevel}</p>
            </div>
          </motion.div>
        )}

        {result.achievementsUnlocked.map(a => (
          <AchievementRow key={a.id} achievement={a} />
        ))}
      </div>

      {/* Footer */}
      {result.currentStreak > 0 && (
        <div className="px-4 py-2 border-t border-[var(--color-border-subtle)]">
          <span className="text-xs text-[var(--text-tertiary)]">🔥 {result.currentStreak} day streak</span>
        </div>
      )}

      {/* Auto-dismiss progress bar */}
      <motion.div
        className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-[var(--color-accent-violet)] to-[var(--color-accent-cyan)]"
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: 4, ease: 'linear' }}
      />
    </motion.div>
  );
}

const TIER_GRADIENT: Record<string, string> = {
  bronze: 'from-amber-600 to-amber-800',
  silver: 'from-slate-300 to-slate-500',
  gold: 'from-yellow-400 to-amber-600',
  platinum: 'from-slate-200 to-slate-400',
  diamond: 'from-cyan-300 to-blue-500',
};

function AchievementRow({ achievement }: { achievement: UnlockedAchievement }) {
  return (
    <motion.div
      initial={{ x: 16, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className={`flex items-center gap-3 p-2.5 rounded-lg bg-gradient-to-r ${TIER_GRADIENT[achievement.tier] ?? TIER_GRADIENT.bronze}`}
    >
      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
        <Award className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-white truncate">{achievement.name}</p>
        <p className="text-xs text-white/75 truncate">{achievement.description}</p>
      </div>
      {achievement.rewards.xp > 0 && (
        <span className="text-xs font-bold text-white/90 flex-shrink-0">+{achievement.rewards.xp} XP</span>
      )}
    </motion.div>
  );
}

// ── RewardNotification (single, backward-compat) ─────────────

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
  autoHideDelay = 4000,
}: RewardNotificationProps) {
  const id = useId();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (result?.summary.hasRewards) {
      setVisible(true);
      if (autoHide) {
        const t = setTimeout(() => { setVisible(false); onDismiss?.(); }, autoHideDelay);
        return () => clearTimeout(t);
      }
    }
  }, [result, autoHide, autoHideDelay, onDismiss]);

  if (!result?.summary.hasRewards) return null;

  return (
    <div className="fixed top-4 right-4 z-[var(--z-toast)]">
      <AnimatePresence>
        {visible && (
          <RewardToast
            item={{ id, result }}
            onDismiss={() => { setVisible(false); onDismiss?.(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── RewardStack (multiple notifications) ─────────────────────

interface RewardStackProps {
  notifications: Array<{ id: string; result: RewardResult }>;
  onDismiss: (id: string) => void;
  autoHideDelay?: number;
}

export function RewardStack({ notifications, onDismiss, autoHideDelay = 4000 }: RewardStackProps) {
  useEffect(() => {
    if (notifications.length === 0) return;
    const timers = notifications.map(n => setTimeout(() => onDismiss(n.id), autoHideDelay));
    return () => timers.forEach(clearTimeout);
  }, [notifications, onDismiss, autoHideDelay]);

  return (
    <div className="fixed top-4 right-4 z-[var(--z-toast)] flex flex-col gap-2 items-end">
      <AnimatePresence mode="popLayout">
        {notifications.map(n => (
          <RewardToast key={n.id} item={n} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
}

// ── RewardInline (compact) ───────────────────────────────────

export function RewardInline({ result }: { result: RewardResult | null }) {
  if (!result?.summary.hasRewards) return null;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="inline-flex items-center gap-2 px-3 py-1.5 bg-[var(--surface-2)] rounded-full text-sm border border-[var(--color-border)]"
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
