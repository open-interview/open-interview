/**
 * Badges Page — spectacular gamification UI
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppLayout } from '../components/layout/AppLayout';
import { SEOHead } from '../components/SEOHead';
import { useAchievements } from '../hooks/use-achievements';
import { AchievementProgress } from '../lib/achievements/types';
import { Trophy, Lock, Sparkles, Share2, X, Star } from 'lucide-react';
import { PageHeader, FilterPills, PageLoader } from '@/components/ui/page';

// ── Tier config ──────────────────────────────────────────────
const TIER_GRADIENT: Record<string, string> = {
  bronze:   'from-[#cd7f32] to-[#8b4513]',
  silver:   'from-[#c0c0c0] to-[#808080]',
  gold:     'from-[#ffd700] to-[#ff8c00]',
  platinum: 'from-[#e5e4e2] to-[#b0b0b0]',
  diamond:  'from-[#b9f2ff] to-cyan-500',
};

const TIER_GLOW: Record<string, string> = {
  bronze:   '0 0 20px rgba(205,127,50,0.5)',
  silver:   '0 0 20px rgba(192,192,192,0.5)',
  gold:     '0 0 24px rgba(255,215,0,0.6)',
  platinum: '0 0 24px rgba(229,228,226,0.5)',
  diamond:  '0 0 28px rgba(185,242,255,0.7)',
};

const TIER_XP: Record<string, number> = {
  bronze: 50, silver: 100, gold: 200, platinum: 500, diamond: 1000,
};

const CATEGORY_TABS = ['all', 'unlocked', 'locked', 'streak', 'completion', 'mastery', 'explorer', 'special'] as const;
type CategoryTab = typeof CATEGORY_TABS[number];

// ── Confetti burst (CSS-only, no extra dep) ──────────────────
function ConfettiBurst({ active }: { active: boolean }) {
  if (!active) return null;
  const pieces = Array.from({ length: 18 }, (_, i) => i);
  const colors = ['#ffd700', '#ff8c00', '#7c3aed', '#06b6d4', '#10b981', '#f43f5e'];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl">
      {pieces.map(i => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-sm"
          style={{
            background: colors[i % colors.length],
            left: `${10 + (i * 5) % 80}%`,
            top: '40%',
          }}
          initial={{ y: 0, opacity: 1, scale: 1, rotate: 0 }}
          animate={{
            y: [-10, -60 - Math.random() * 40],
            x: [(i % 2 === 0 ? 1 : -1) * (10 + (i * 7) % 30)],
            opacity: [1, 0],
            scale: [1, 0.5],
            rotate: [0, 360],
          }}
          transition={{ duration: 0.8 + Math.random() * 0.4, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}

// ── Badge Card ───────────────────────────────────────────────
function BadgeCard({
  bp,
  index,
  onClick,
}: {
  bp: AchievementProgress;
  index: number;
  onClick: (bp: AchievementProgress) => void;
}) {
  const { achievement: badge, isUnlocked } = bp;
  const tier = badge.tier as string;
  const [hovered, setHovered] = useState(false);

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: Math.min(index * 0.04, 0.4), type: 'spring', stiffness: 200, damping: 20 }}
      whileHover={isUnlocked ? { scale: 1.05 } : { scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => onClick(bp)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      className={`relative flex flex-col items-center p-4 rounded-xl border text-left w-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-violet)] cursor-pointer min-h-[44px] ${
        isUnlocked
          ? 'bg-[var(--surface-2)] border-[var(--color-border)]'
          : 'bg-[var(--surface-1)] border-[var(--color-border-subtle)] opacity-60'
      }`}
      style={isUnlocked ? { boxShadow: TIER_GLOW[tier] } : undefined}
    >
      {/* Hover tooltip */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none w-48"
            style={{ background: 'var(--surface-3)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '8px 10px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}
          >
            <p className="text-xs font-bold text-[var(--text-primary)] mb-0.5">{badge.name}</p>
            <p className="text-[11px] text-[var(--text-secondary)] leading-snug">{badge.description}</p>
            {!isUnlocked && bp.current > 0 && bp.target > 0 && (
              <p className="text-[10px] text-[var(--color-accent-violet-light)] mt-1">{bp.current}/{bp.target} progress</p>
            )}
            {isUnlocked && (
              <p className="text-[10px] text-[var(--color-success)] mt-1">✓ Unlocked · +{TIER_XP[tier] ?? 50} XP</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Icon circle */}
      <div
        className={`w-14 h-14 mb-3 rounded-full flex items-center justify-center flex-shrink-0 relative ${
          isUnlocked
            ? `bg-gradient-to-br ${TIER_GRADIENT[tier] ?? TIER_GRADIENT.bronze}`
            : 'bg-[var(--surface-3)]'
        }`}
      >
        {isUnlocked ? (
          <Trophy className="w-7 h-7 text-white" strokeWidth={2.5} />
        ) : (
          <>
            <Trophy className="w-7 h-7 text-[var(--text-disabled)]" strokeWidth={2} />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[var(--surface-3)] border border-[var(--color-border)] flex items-center justify-center">
              <Lock className="w-2.5 h-2.5 text-[var(--text-tertiary)]" />
            </div>
          </>
        )}
      </div>

      {/* Info */}
      <div className="text-center space-y-1 w-full">
        <p className="font-bold text-xs leading-tight line-clamp-1">{badge.name}</p>
        <p className="text-[11px] text-[var(--text-tertiary)] line-clamp-2 leading-snug">{badge.description}</p>

        {/* Progress bar (locked) */}
        {!isUnlocked && bp.current > 0 && bp.target > 0 && (
          <div className="pt-1 space-y-0.5">
            <div className="h-1 bg-[var(--surface-3)] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[var(--color-accent-violet)] to-[var(--color-accent-cyan)]"
                style={{ width: `${Math.min((bp.current / bp.target) * 100, 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-[var(--text-tertiary)]">{bp.current}/{bp.target}</p>
          </div>
        )}

        {/* Tier pill */}
        <div
          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold capitalize mt-1 ${
            isUnlocked
              ? `bg-gradient-to-r ${TIER_GRADIENT[tier] ?? TIER_GRADIENT.bronze} text-white`
              : 'bg-[var(--surface-3)] text-[var(--text-tertiary)]'
          }`}
        >
          {badge.tier} · +{TIER_XP[tier] ?? 50} XP
        </div>
      </div>
    </motion.button>
  );
}

// ── Badge Detail Modal ───────────────────────────────────────
function BadgeModal({
  bp,
  onClose,
}: {
  bp: AchievementProgress | null;
  onClose: () => void;
}) {
  const [confetti, setConfetti] = useState(false);

  useEffect(() => {
    if (bp?.isUnlocked) {
      setConfetti(true);
      const t = setTimeout(() => setConfetti(false), 1000);
      return () => clearTimeout(t);
    }
  }, [bp]);

  return (
    <AnimatePresence>
      {bp && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[var(--z-modal)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            className="fixed inset-x-4 bottom-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-96 z-[var(--z-modal)] bg-[var(--surface-2)] border border-[var(--color-border)] rounded-t-2xl md:rounded-2xl p-6 shadow-2xl"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <ConfettiBurst active={confetti} />

            {/* Close — 44px touch target */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-11 h-11 rounded-full bg-[var(--surface-3)] flex items-center justify-center hover:bg-[var(--surface-4)] transition-colors duration-150 cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Icon */}
            <div className="flex flex-col items-center text-center space-y-4">
              <div
                className={`w-24 h-24 rounded-full flex items-center justify-center ${
                  bp.isUnlocked
                    ? `bg-gradient-to-br ${TIER_GRADIENT[bp.achievement.tier] ?? TIER_GRADIENT.bronze}`
                    : 'bg-[var(--surface-3)]'
                }`}
                style={bp.isUnlocked ? { boxShadow: TIER_GLOW[bp.achievement.tier] } : undefined}
              >
                {bp.isUnlocked ? (
                  <Trophy className="w-12 h-12 text-white" strokeWidth={2} />
                ) : (
                  <Lock className="w-12 h-12 text-[var(--text-disabled)]" />
                )}
              </div>

              <div>
                <h2 className="text-xl font-black">{bp.achievement.name}</h2>
                <p className="text-sm text-[var(--text-secondary)] mt-1">{bp.achievement.description}</p>
              </div>

              {/* XP reward */}
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--surface-3)] border border-[var(--color-border)]">
                <Star className="w-4 h-4 text-[var(--color-xp)]" />
                <span className="text-sm font-bold text-[var(--color-xp)]">+{TIER_XP[bp.achievement.tier] ?? 50} XP</span>
                <span className="text-xs text-[var(--text-tertiary)] capitalize">· {bp.achievement.tier}</span>
              </div>

              {/* Earned date or how to earn */}
              {bp.isUnlocked && bp.unlockedAt ? (
                <p className="text-sm text-[var(--color-success)]">
                  ✓ Earned {new Date(bp.unlockedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              ) : (
                <div className="w-full p-3 rounded-xl bg-[var(--surface-3)] border border-[var(--color-border-subtle)] text-left space-y-2">
                  <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wide">How to earn</p>
                  <p className="text-sm text-[var(--text-secondary)]">{bp.achievement.description}</p>
                  {bp.current > 0 && bp.target > 0 && (
                    <div className="space-y-1">
                      <div className="h-1.5 bg-[var(--surface-4)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[var(--color-accent-violet)] to-[var(--color-accent-cyan)]"
                          style={{ width: `${Math.min((bp.current / bp.target) * 100, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-[var(--text-tertiary)]">{bp.current} / {bp.target}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Share */}
              {bp.isUnlocked && (
                <button
                  onClick={() => {
                    const text = `I just earned the "${bp.achievement.name}" badge on Code Reels! 🏆`;
                    if (navigator.share) {
                      navigator.share({ text, url: 'https://open-interview.github.io/' });
                    } else {
                      navigator.clipboard.writeText(text);
                    }
                  }}
                  className="flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-[var(--color-accent-violet)] to-[var(--color-accent-indigo)] text-white text-sm font-semibold hover:opacity-90 transition-opacity duration-150 cursor-pointer min-h-[44px]"
                >
                  <Share2 className="w-4 h-4" />
                  Share Badge
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Main Page ────────────────────────────────────────────────
export default function BadgesPage() {
  const { progress: allBadges, unlocked: unlockedBadges, stats, nextUp, isLoading } = useAchievements();
  const [activeTab, setActiveTab] = useState<CategoryTab>('all');
  const [selectedBadge, setSelectedBadge] = useState<AchievementProgress | null>(null);

  const filteredBadges = activeTab === 'all'
    ? allBadges
    : activeTab === 'unlocked'
    ? allBadges.filter(b => b.isUnlocked)
    : activeTab === 'locked'
    ? allBadges.filter(b => !b.isUnlocked)
    : allBadges.filter(b => b.achievement.category === activeTab);

  const xpFromBadges = unlockedBadges.reduce((sum, b) => sum + (TIER_XP[b.achievement.tier] ?? 50), 0);

  const rarestBadge = unlockedBadges.length > 0
    ? unlockedBadges.reduce((rarest, b) => {
        const tierOrder = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
        return tierOrder.indexOf(b.achievement.tier) > tierOrder.indexOf(rarest.achievement.tier) ? b : rarest;
      })
    : null;

  if (isLoading) {
    return (
      <AppLayout title="Badges" fullWidth>
        <PageLoader message="Loading achievements..." />
      </AppLayout>
    );
  }

  if (!allBadges || allBadges.length === 0) {
    return (
      <AppLayout title="Badges" fullWidth>
        <div className="min-h-screen bg-background text-foreground overflow-x-hidden pb-24 lg:pb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
            <PageHeader title="Badges" />
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h2 className="text-2xl font-bold mb-2">No badges yet</h2>
                <p className="text-muted-foreground mb-6">Start completing challenges to earn badges!</p>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <>
      <SEOHead
        title="Achievements — Your Badges"
        description="View your earned badges and achievements"
        canonical="https://open-interview.github.io/badges"
      />

      <AppLayout title="Badges" fullWidth>
        <div className="min-h-screen bg-background text-foreground w-full overflow-x-hidden pb-24 lg:pb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">

            {/* ── Header ── */}
            <PageHeader title="Badges" subtitle="Your achievements" />

            {/* ── Stats Header ── */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-3 gap-3"
            >
              <div className="glass-card rounded-xl p-4 text-center space-y-1">
                <p className="text-2xl font-black text-[var(--color-xp)]">
                  {stats.unlocked}<span className="text-[var(--text-tertiary)] font-normal text-base">/{stats.total}</span>
                </p>
                <p className="text-xs text-[var(--text-tertiary)]">Badges Earned</p>
              </div>

              <div className="glass-card rounded-xl p-4 text-center space-y-1">
                <p className="text-2xl font-black text-[var(--color-accent-violet-light)]">+{xpFromBadges.toLocaleString()}</p>
                <p className="text-xs text-[var(--text-tertiary)]">XP from Badges</p>
              </div>

              <div className="glass-card rounded-xl p-4 text-center space-y-1">
                {rarestBadge ? (
                  <>
                    <p className={`text-sm font-black capitalize bg-gradient-to-r ${TIER_GRADIENT[rarestBadge.achievement.tier]} bg-clip-text text-transparent`}>
                      {rarestBadge.achievement.tier}
                    </p>
                    <p className="text-[10px] text-[var(--text-tertiary)] line-clamp-1">{rarestBadge.achievement.name}</p>
                  </>
                ) : (
                  <p className="text-xs text-[var(--text-tertiary)]">No badges yet</p>
                )}
                <p className="text-xs text-[var(--text-tertiary)]">Rarest Badge</p>
              </div>
            </motion.div>

            {/* ── Overall progress bar ── */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="space-y-1.5"
            >
              <div className="flex justify-between text-xs text-[var(--text-tertiary)]">
                <span>{stats.percentage}% complete</span>
                <span>{stats.locked} remaining</span>
              </div>
              <div className="h-2 bg-[var(--surface-3)] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.percentage}%` }}
                  transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full bg-gradient-to-r from-[#ffd700] to-[#ff8c00] rounded-full"
                  style={{ boxShadow: '0 0 8px rgba(255,215,0,0.5)' }}
                />
              </div>
            </motion.div>

            {/* ── Category Tabs ── */}
            <FilterPills
              options={CATEGORY_TABS.map(t => ({ id: t, label: t.charAt(0).toUpperCase() + t.slice(1) }))}
              active={activeTab}
              onChange={id => setActiveTab(id as CategoryTab)}
            />

            {/* ── Badge Grid — 2 cols on mobile, 3 on sm, 4 on lg ── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {filteredBadges.map((bp, i) => (
                <BadgeCard key={bp.achievement.id} bp={bp} index={i} onClick={setSelectedBadge} />
              ))}
            </div>

            {/* ── Next Up ── */}
            {nextUp.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="p-6 bg-gradient-to-br from-[var(--color-accent-violet)]/10 to-[var(--color-accent-cyan)]/10 rounded-xl border border-[var(--color-accent-violet)]/20"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-[var(--color-accent-violet-light)]" />
                  <h2 className="text-lg font-bold">Almost There!</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {nextUp.slice(0, 4).map(bp => (
                    <button
                      key={bp.achievement.id}
                      onClick={() => setSelectedBadge(bp)}
                      className="flex items-center gap-3 p-3 bg-[var(--surface-2)] rounded-xl border border-[var(--color-border)] hover:border-[var(--color-border-strong)] transition-all duration-200 text-left cursor-pointer min-h-[44px]"
                    >
                      <div className="w-11 h-11 bg-[var(--surface-3)] rounded-full flex items-center justify-center flex-shrink-0">
                        <Trophy className="w-5 h-5 text-[var(--color-accent-violet-light)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{bp.achievement.name}</p>
                        <div className="h-1 bg-[var(--surface-3)] rounded-full overflow-hidden mt-1.5">
                          <div
                            className="h-full bg-gradient-to-r from-[var(--color-accent-violet)] to-[var(--color-accent-cyan)]"
                            style={{ width: `${Math.min((bp.current / bp.target) * 100, 100)}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">{bp.current}/{bp.target}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </AppLayout>

      {/* ── Badge Detail Modal ── */}
      <BadgeModal bp={selectedBadge} onClose={() => setSelectedBadge(null)} />
    </>
  );
}
