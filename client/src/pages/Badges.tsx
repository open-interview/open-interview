/**
 * Badges Page — M3 redesign
 * Filled tonal cards, locked at 38% opacity, M3 dialog with confetti
 */
import { useState, useEffect, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppLayout } from '../components/layout/AppLayout';
import { ProgressTabBar } from '../components/ProgressTabBar';
import { SEOHead } from '../components/SEOHead';
import { useAchievements } from '../hooks/use-achievements';
import { AchievementProgress } from '../lib/achievements/types';
import { Share2, X, Star, Check, Sparkles } from 'lucide-react';
import { PageHeader, FilterPills, PageLoader } from '@/components/ui/page';

// ── M3 color tokens ───────────────────────────────────────────────────────────
const C = {
  primary:        'var(--color-primary,#6750a4)',
  primaryCont:    'var(--color-primary-container,#eaddff)',
  onPrimaryCont:  'var(--color-on-primary-container,#21005d)',
  secondaryCont:  'var(--color-secondary-container,#e8def8)',
  onSecondaryCont:'var(--color-on-secondary-container,#1d192b)',
  tertiaryCont:   'var(--color-tertiary-container,#ffd8e4)',
  onTertiaryCont: 'var(--color-on-tertiary-container,#31111d)',
  errorCont:      'var(--color-error-container,#f9dedc)',
  onErrorCont:    'var(--color-on-error-container,#410e0b)',
  surfaceVar:     'var(--color-surface-variant,#e7e0ec)',
  onSurface:      'var(--color-on-surface,#1c1b1f)',
  onSurfaceVar:   'var(--color-on-surface-variant,#49454f)',
  surface:        'var(--color-background,#fffbfe)',
  outline:        'var(--color-outline,#79747e)',
};

// Tier → M3 container mapping
const TIER_STYLE: Record<string, { bg: string; fg: string; accent: string }> = {
  bronze:   { bg: '#fef3c7', fg: '#92400e', accent: '#d97706' },
  silver:   { bg: C.surfaceVar, fg: '#374151', accent: '#6b7280' },
  gold:     { bg: '#fef9c3', fg: '#713f12', accent: '#ca8a04' },
  platinum: { bg: C.primaryCont, fg: C.onPrimaryCont, accent: C.primary },
  diamond:  { bg: '#cffafe', fg: '#164e63', accent: '#0891b2' },
};
const TIER_XP: Record<string, number> = {
  bronze: 50, silver: 100, gold: 200, platinum: 500, diamond: 1000,
};

// ── SVG Badge Icons ───────────────────────────────────────────────────────────
function BadgeIconBronze({ size = 48 }: { size?: number }) {
  const id = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id={`bg-${id}`} x1="6" y1="6" x2="42" y2="42">
          <stop offset="0%" stopColor="#fbbf24" /><stop offset="100%" stopColor="#92400e" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="20" fill={`url(#bg-${id})`} stroke="#92400e" strokeWidth="1.5" />
      <path d="M24 12l3.5 7.1L35 20.5l-5.5 5.4 1.3 7.7L24 30.5l-6.8 3.1 1.3-7.7L13 20.5l7.5-1.4z" fill="#fef3c7" />
    </svg>
  );
}
function BadgeIconSilver({ size = 48 }: { size?: number }) {
  const id = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id={`bg-${id}`} x1="6" y1="6" x2="42" y2="42">
          <stop offset="0%" stopColor="#f1f5f9" /><stop offset="100%" stopColor="#64748b" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="20" fill={`url(#bg-${id})`} stroke="#475569" strokeWidth="1.5" />
      <path d="M24 12l3.5 7.1L35 20.5l-5.5 5.4 1.3 7.7L24 30.5l-6.8 3.1 1.3-7.7L13 20.5l7.5-1.4z" fill="#f8fafc" />
    </svg>
  );
}
function BadgeIconGold({ size = 48 }: { size?: number }) {
  const id = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id={`bg-${id}`} x1="6" y1="6" x2="42" y2="42">
          <stop offset="0%" stopColor="#fef08a" /><stop offset="100%" stopColor="#a16207" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="20" fill={`url(#bg-${id})`} stroke="#a16207" strokeWidth="1.5" />
      <path d="M24 11l4 8.1L37 20.5l-6.5 6.3 1.5 9.2L24 32l-8 3.5 1.5-9.2L11 20.5l9-1.4z" fill="#fef9c3" />
    </svg>
  );
}
function BadgeIconPlatinum({ size = 48 }: { size?: number }) {
  const id = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id={`bg-${id}`} x1="6" y1="6" x2="42" y2="42">
          <stop offset="0%" stopColor="#e0e7ff" /><stop offset="100%" stopColor="#6d28d9" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="20" fill={`url(#bg-${id})`} stroke="#5b21b6" strokeWidth="1.5" />
      <path d="M24 12l3.5 7.1L35 20.5l-5.5 5.4 1.3 7.7L24 30.5l-6.8 3.1 1.3-7.7L13 20.5l7.5-1.4z" fill="#ede9fe" />
    </svg>
  );
}
function BadgeIconDiamond({ size = 48 }: { size?: number }) {
  const id = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id={`bg-${id}`} x1="6" y1="6" x2="42" y2="42">
          <stop offset="0%" stopColor="#67e8f9" /><stop offset="100%" stopColor="#0e7490" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="20" fill={`url(#bg-${id})`} stroke="#0e7490" strokeWidth="1.5" />
      <path d="M24 11l4 8.1L37 20.5l-6.5 6.3 1.5 9.2L24 32l-8 3.5 1.5-9.2L11 20.5l9-1.4z" fill="#cffafe" />
    </svg>
  );
}
function BadgeIcon({ tier, size = 48 }: { tier: string; size?: number }) {
  switch (tier) {
    case 'diamond':  return <BadgeIconDiamond size={size} />;
    case 'platinum': return <BadgeIconPlatinum size={size} />;
    case 'gold':     return <BadgeIconGold size={size} />;
    case 'silver':   return <BadgeIconSilver size={size} />;
    default:         return <BadgeIconBronze size={size} />;
  }
}

// ── Confetti burst ────────────────────────────────────────────────────────────
function ConfettiBurst({ tier }: { tier: string }) {
  const palettes: Record<string, string[]> = {
    bronze:   ['#fbbf24','#d97706','#fcd34d'],
    silver:   ['#e2e8f0','#94a3b8','#f8fafc'],
    gold:     ['#fef08a','#ca8a04','#fde047'],
    platinum: ['#a78bfa','#6750a4','#c4b5fd'],
    diamond:  ['#67e8f9','#0891b2','#a5f3fc'],
  };
  const colors = palettes[tier] ?? palettes.bronze;
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: 18 }, (_, i) => {
        const angle = (360 / 18) * i;
        const dist = 40 + Math.random() * 60;
        const xEnd = Math.cos((angle * Math.PI) / 180) * dist;
        const yEnd = Math.sin((angle * Math.PI) / 180) * dist;
        return (
          <motion.div key={i}
            className="absolute top-1/2 left-1/2 rounded-sm"
            style={{ width: 4 + Math.random() * 4, height: 7 + Math.random() * 7,
              backgroundColor: colors[i % colors.length], rotate: `${Math.random() * 360}deg` }}
            initial={{ x: '-50%', y: '-50%', opacity: 1 }}
            animate={{ x: `calc(-50% + ${xEnd}px)`, y: `calc(-50% + ${yEnd}px)`, opacity: 0, scale: 0.3 }}
            transition={{ duration: 1.2 + Math.random() * 0.4, ease: 'easeOut', delay: i * 0.04 }} />
        );
      })}
      <motion.div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ width: 56, height: 56, border: `2px solid ${colors[0]}` }}
        initial={{ scale: 0.3, opacity: 0.8 }} animate={{ scale: 3, opacity: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }} />
    </div>
  );
}

// ── M3 Badge Card ─────────────────────────────────────────────────────────────
function BadgeCard({ bp, index, onClick }: {
  bp: AchievementProgress; index: number; onClick: (bp: AchievementProgress) => void;
}) {
  const { achievement, isUnlocked } = bp;
  const tier = achievement.tier as string;
  const style = TIER_STYLE[tier] ?? TIER_STYLE.bronze;
  const progress = bp.target > 0 ? bp.current / bp.target : 0;

  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -3, transition: { duration: 0.15 } }}
      onClick={() => onClick(bp)}
      className="w-full text-left rounded-3xl p-4 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
      style={{
        background: style.bg,
        opacity: isUnlocked ? 1 : 0.38,
      }}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <BadgeIcon tier={tier} size={44} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-sm font-medium truncate" style={{ color: style.fg }}>{achievement.name}</span>
            {isUnlocked && <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: style.accent }} />}
          </div>
          <p className="text-xs leading-relaxed line-clamp-2" style={{ color: style.fg, opacity: 0.7 }}>
            {achievement.description}
          </p>
          {isUnlocked ? (
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{ background: `${style.accent}20`, color: style.accent }}>
                {tier}
              </span>
              <span className="text-xs font-medium" style={{ color: style.fg, opacity: 0.6 }}>
                +{TIER_XP[tier] ?? 50} XP
              </span>
            </div>
          ) : progress > 0 ? (
            <div className="mt-2">
              <div className="h-1 rounded-full overflow-hidden" style={{ background: `${style.fg}20` }}>
                <motion.div className="h-full rounded-full" style={{ background: style.accent }}
                  initial={{ width: 0 }} animate={{ width: `${progress * 100}%` }}
                  transition={{ duration: 0.6, delay: index * 0.03 + 0.2 }} />
              </div>
              <span className="text-xs mt-0.5 block" style={{ color: style.fg, opacity: 0.6 }}>
                {bp.current}/{bp.target}
              </span>
            </div>
          ) : (
            <span className="text-xs mt-2 block" style={{ color: style.fg, opacity: 0.5 }}>Complete to unlock</span>
          )}
        </div>
      </div>
    </motion.button>
  );
}

// ── M3 Badge Dialog ───────────────────────────────────────────────────────────
function BadgeDialog({ bp, onClose }: { bp: AchievementProgress | null; onClose: () => void }) {
  const [showConfetti, setShowConfetti] = useState(false);
  const tier = bp?.achievement.tier as string;
  const style = TIER_STYLE[tier] ?? TIER_STYLE.bronze;

  useEffect(() => {
    if (bp?.isUnlocked) {
      setShowConfetti(true);
      const t = setTimeout(() => setShowConfetti(false), 2000);
      return () => clearTimeout(t);
    }
  }, [bp]);

  return (
    <AnimatePresence>
      {bp && (
        <>
          {/* Scrim */}
          <motion.div className="fixed inset-0 z-50" style={{ background: 'rgba(0,0,0,0.5)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} />

          {/* M3 Dialog */}
          <motion.div
            className="fixed left-4 right-4 top-1/2 md:left-1/2 md:right-auto md:w-[400px] md:-translate-x-1/2 z-50 rounded-3xl overflow-hidden shadow-2xl"
            style={{ background: C.surface }}
            initial={{ opacity: 0, scale: 0.9, y: '-45%' }}
            animate={{ opacity: 1, scale: 1, y: '-50%' }}
            exit={{ opacity: 0, scale: 0.9, y: '-45%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}>

            {showConfetti && bp.isUnlocked && <ConfettiBurst tier={tier} />}

            {/* Close button */}
            <button onClick={onClose}
              className="absolute top-4 right-4 z-10 min-w-[48px] w-10 min-h-[48px] h-10 rounded-full flex items-center justify-center transition-colors hover:bg-black/10"
              style={{ color: C.onSurfaceVar }} aria-label="Close">
              <X className="w-5 h-5" />
            </button>

            {/* Header area */}
            <div className="p-6 pb-4 flex flex-col items-center text-center"
              style={{ background: style.bg }}>
              <motion.div className="w-24 h-24 rounded-3xl flex items-center justify-center mb-4 shadow-lg"
                style={{ background: bp.isUnlocked ? style.bg : C.surfaceVar }}
                initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}>
                <BadgeIcon tier={tier} size={72} />
              </motion.div>

              {/* Title Large */}
              <motion.h2 className="text-xl font-medium mb-1"
                style={{ color: style.fg }}
                initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}>
                {bp.achievement.name}
              </motion.h2>

              <motion.p className="text-sm" style={{ color: style.fg, opacity: 0.7 }}
                initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
                {bp.achievement.description}
              </motion.p>

              <motion.div className="flex items-center gap-2 mt-3 px-4 py-2 rounded-full"
                style={{ background: `${style.accent}20` }}
                initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.25 }}>
                <Star className="w-4 h-4" style={{ color: style.accent }} fill="currentColor" />
                <span className="text-sm font-medium" style={{ color: style.fg }}>
                  +{TIER_XP[tier] ?? 50} XP · {tier}
                </span>
              </motion.div>
            </div>

            {/* Body */}
            <div className="p-6 pt-4">
              {bp.isUnlocked && bp.unlockedAt ? (
                <motion.div className="flex items-center gap-2 justify-center px-4 py-2 rounded-full"
                  style={{ background: '#dcfce7', color: '#166534' }}
                  initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
                  <Check className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    Earned {new Date(bp.unlockedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                  </span>
                </motion.div>
              ) : (
                <motion.div initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
                  <p className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: C.onSurfaceVar }}>Progress</p>
                  {bp.current > 0 && bp.target > 0 ? (
                    <>
                      <div className="h-2 rounded-full overflow-hidden mb-1" style={{ background: C.surfaceVar }}>
                        <motion.div className="h-full rounded-full" style={{ background: C.primary }}
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min((bp.current / bp.target) * 100, 100)}%` }}
                          transition={{ duration: 0.6, ease: 'easeOut' }} />
                      </div>
                      <p className="text-sm" style={{ color: C.onSurfaceVar }}>{bp.current} / {bp.target} completed</p>
                    </>
                  ) : (
                    <p className="text-sm" style={{ color: C.onSurfaceVar }}>Not started yet</p>
                  )}
                </motion.div>
              )}

              {bp.isUnlocked && (
                <motion.button
                  initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.35 }}
                  onClick={() => {
                    const text = `I just earned the "${bp.achievement.name}" badge on Open Interview! 🏆`;
                    if (navigator.share) navigator.share({ text, url: 'https://open-interview.github.io/' });
                    else navigator.clipboard.writeText(text);
                  }}
                  className="mt-4 w-full flex items-center justify-center gap-2 px-6 py-3 rounded-full font-medium transition-colors hover:opacity-90"
                  style={{ background: C.primary, color: '#fff' }}>
                  <Share2 className="w-4 h-4" />
                  Share Badge
                </motion.button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Category tabs ─────────────────────────────────────────────────────────────
const CATEGORY_TABS = ['all', 'unlocked', 'locked', 'streak', 'completion', 'mastery', 'explorer', 'special'] as const;
type CategoryTab = typeof CATEGORY_TABS[number];

// ── Main export ───────────────────────────────────────────────────────────────
export default function BadgesPage() {
  const { progress: allBadges, unlocked: unlockedBadges, stats, nextUp, isLoading } = useAchievements();
  const [activeTab, setActiveTab] = useState<CategoryTab>('all');
  const [selectedBadge, setSelectedBadge] = useState<AchievementProgress | null>(null);

  const filteredBadges = activeTab === 'all' ? allBadges
    : activeTab === 'unlocked' ? allBadges.filter(b => b.isUnlocked)
    : activeTab === 'locked'   ? allBadges.filter(b => !b.isUnlocked)
    : allBadges.filter(b => b.achievement.category === activeTab);

  const xpFromBadges = unlockedBadges.reduce((sum, b) => sum + (TIER_XP[b.achievement.tier] ?? 50), 0);
  const rarestBadge = unlockedBadges.length > 0
    ? unlockedBadges.reduce((r, b) => {
        const order = ['bronze','silver','gold','platinum','diamond'];
        return order.indexOf(b.achievement.tier) > order.indexOf(r.achievement.tier) ? b : r;
      })
    : null;

  if (isLoading) {
    return <AppLayout title="Badges" fullWidth><PageLoader message="Loading achievements..." /></AppLayout>;
  }

  return (
    <>
      <SEOHead title="Achievements — Your Badges" description="View your earned badges and achievements"
        canonical="https://open-interview.github.io/badges" />
      <AppLayout title="Badges" fullWidth>
        <div className="min-h-screen pb-24" style={{ background: C.surface }}>
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
            <ProgressTabBar activeTab="badges" />
            <PageHeader title="Badges" subtitle="Your achievements" />

            {/* Summary — 3 metric cards */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className="grid grid-cols-3 gap-3">
              <div className="rounded-3xl p-4" style={{ background: C.secondaryCont }}>
                <p className="text-3xl font-normal" style={{ color: C.onSecondaryCont }}>
                  {stats.unlocked}<span className="text-base opacity-[0.38]">/{stats.total}</span>
                </p>
                <p className="text-xs mt-1 font-medium uppercase tracking-wide" style={{ color: C.onSecondaryCont, opacity: 0.7 }}>Earned</p>
              </div>
              <div className="rounded-3xl p-4" style={{ background: C.primaryCont }}>
                <p className="text-3xl font-normal" style={{ color: C.onPrimaryCont }}>+{xpFromBadges.toLocaleString()}</p>
                <p className="text-xs mt-1 font-medium uppercase tracking-wide" style={{ color: C.onPrimaryCont, opacity: 0.7 }}>XP Earned</p>
              </div>
              <div className="rounded-3xl p-4" style={{ background: C.tertiaryCont }}>
                {rarestBadge ? (
                  <>
                    <p className="text-base font-medium capitalize" style={{ color: C.onTertiaryCont }}>
                      {rarestBadge.achievement.tier}
                    </p>
                    <p className="text-xs truncate mt-0.5" style={{ color: C.onTertiaryCont, opacity: 0.7 }}>
                      {rarestBadge.achievement.name}
                    </p>
                  </>
                ) : <p className="text-sm" style={{ color: C.onTertiaryCont, opacity: 0.7 }}>No badges yet</p>}
                <p className="text-xs mt-1 font-medium uppercase tracking-wide" style={{ color: C.onTertiaryCont, opacity: 0.7 }}>Rarest</p>
              </div>
            </motion.div>

            {/* Overall progress bar */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
              className="rounded-3xl p-4" style={{ background: C.surfaceVar }}>
              <div className="flex justify-between text-xs mb-2" style={{ color: C.onSurfaceVar }}>
                <span>{stats.percentage}% complete</span>
                <span>{stats.locked} remaining</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: `${C.outline}30` }}>
                <motion.div className="h-full rounded-full" style={{ background: C.primary }}
                  initial={{ width: 0 }} animate={{ width: `${stats.percentage}%` }}
                  transition={{ duration: 1, delay: 0.15, ease: [0.16, 1, 0.3, 1] }} />
              </div>
            </motion.div>

            {/* Filter pills */}
            <FilterPills
              options={CATEGORY_TABS.map(t => ({ id: t, label: t.charAt(0).toUpperCase() + t.slice(1) }))}
              active={activeTab}
              onChange={id => setActiveTab(id as CategoryTab)} />

            {/* Badge grid — M3 filled tonal cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredBadges.map((bp, i) => (
                <BadgeCard key={bp.achievement.id} bp={bp} index={i} onClick={setSelectedBadge} />
              ))}
            </div>

            {/* "Almost There" section */}
            {nextUp.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                className="rounded-3xl p-5" style={{ background: C.primaryCont }}>
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5" style={{ color: C.primary }} />
                  <h2 className="text-base font-medium" style={{ color: C.onPrimaryCont }}>Almost There!</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {nextUp.slice(0, 4).map(bp => {
                    const pct = bp.target > 0 ? Math.min((bp.current / bp.target) * 100, 100) : 0;
                    return (
                      <button key={bp.achievement.id} onClick={() => setSelectedBadge(bp)}
                        className="flex items-center gap-3 p-3 rounded-2xl text-left transition-colors hover:bg-black/10"
                        style={{ background: C.surface }}>
                        <div className="min-w-[48px] w-10 min-h-[48px] h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: C.primaryCont, opacity: 0.38 }}>
                          <BadgeIcon tier={bp.achievement.tier} size={32} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate" style={{ color: C.onSurface }}>{bp.achievement.name}</p>
                          <div className="h-1 rounded-full overflow-hidden mt-1.5" style={{ background: C.surfaceVar }}>
                            <div className="h-full rounded-full" style={{ background: C.primary, width: `${pct}%` }} />
                          </div>
                          <p className="text-xs mt-0.5" style={{ color: C.onSurfaceVar }}>{bp.current}/{bp.target}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </AppLayout>

      <BadgeDialog bp={selectedBadge} onClose={() => setSelectedBadge(null)} />
    </>
  );
}
