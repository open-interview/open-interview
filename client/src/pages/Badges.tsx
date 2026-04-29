/**
 * Badges Page — Google Material Design 3
 */

import { useState, useEffect, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppLayout } from '../components/layout/AppLayout';
import { SEOHead } from '../components/SEOHead';
import { useAchievements } from '../hooks/use-achievements';
import { AchievementProgress } from '../lib/achievements/types';
import { Lock, Sparkles, Share2, X, Star, Check } from 'lucide-react';
import { PageHeader, FilterPills, PageLoader } from '@/components/ui/page';

/* ─── SVG Badge Icon Components ─────────────────────────────────── */

function BadgeIconBronze({ size = 56 }: { size?: number }) {
  const uid = useId();
  const gradId = `bronze-grad-${uid}`;
  const patId = `bronze-pat-${uid}`;
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none">
      <defs>
        <linearGradient id={gradId} x1="8" y1="8" x2="48" y2="48">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="50%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#92400e" />
        </linearGradient>
        <pattern id={patId} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" stroke="#92400e" strokeWidth="0.5" opacity="0.25" />
        </pattern>
      </defs>
      <circle cx="28" cy="28" r="24" fill={`url(#${gradId})`} stroke="#92400e" strokeWidth="2" />
      <circle cx="28" cy="28" r="24" fill={`url(#${patId})`} />
      <path d="M28 14l4.5 9.1L43 24.5l-7.3 7.1 1.7 10.1L28 37.3l-9.4 4.4 1.7-10.1L13 24.5l10.5-1.4z" fill="#92400e" opacity="0.8" />
      <path d="M28 18l3.2 6.5L38 23.5l-5.2 5 1.2 7.2L28 33.5l-6 4.2 1.2-7.2-5.2-5 6.8-1L28 18z" fill="#fef3c7" />
    </svg>
  );
}

function BadgeIconSilver({ size = 56 }: { size?: number }) {
  const uid = useId();
  const gradId = `silver-grad-${uid}`;
  const shineId = `silver-shine-${uid}`;
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none">
      <defs>
        <linearGradient id={gradId} x1="8" y1="8" x2="48" y2="48">
          <stop offset="0%" stopColor="#f1f5f9" />
          <stop offset="40%" stopColor="#cbd5e1" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>
        <linearGradient id={shineId} x1="14" y1="14" x2="28" y2="28">
          <stop offset="0%" stopColor="white" stopOpacity="0.6" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
      </defs>
      <circle cx="28" cy="28" r="24" fill={`url(#${gradId})`} stroke="#475569" strokeWidth="2" />
      <circle cx="28" cy="28" r="22" fill={`url(#${shineId})`} />
      <path d="M28 14l4.5 9.1L43 24.5l-7.3 7.1 1.7 10.1L28 37.3l-9.4 4.4 1.7-10.1L13 24.5l10.5-1.4z" fill="#475569" opacity="0.6" />
      <path d="M28 18l3.2 6.5L38 23.5l-5.2 5 1.2 7.2L28 33.5l-6 4.2 1.2-7.2-5.2-5 6.8-1L28 18z" fill="#f8fafc" />
    </svg>
  );
}

function BadgeIconGold({ size = 56 }: { size?: number }) {
  const uid = useId();
  const gradId = `gold-grad-${uid}`;
  const glowId = `gold-glow-${uid}`;
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none">
      <defs>
        <linearGradient id={gradId} x1="8" y1="8" x2="48" y2="48">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="40%" stopColor="#FBBC05" />
          <stop offset="100%" stopColor="#a16207" />
        </linearGradient>
        <radialGradient id={glowId} cx="28" cy="28" r="26">
          <stop offset="80%" stopColor="transparent" />
          <stop offset="100%" stopColor="#FBBC05" stopOpacity="0.3" />
        </radialGradient>
      </defs>
      <circle cx="28" cy="28" r="26" fill={`url(#${glowId})`} />
      <circle cx="28" cy="28" r="24" fill={`url(#${gradId})`} stroke="#a16207" strokeWidth="2" />
      <path d="M28 12l5 10.1L44 23.5l-8 7.8 1.9 11L28 35.8l-9.9 5.7 1.9-11-8-7.8 11-1.4z" fill="#a16207" opacity="0.7" />
      <path d="M28 16l3.5 7.1L39 21.5l-5.6 5.4 1.3 7.7L28 32.5l-6.7 4.1 1.3-7.7-5.6-5.4 7.5-1L28 16z" fill="#fef9c3" />
    </svg>
  );
}

function BadgeIconPlatinum({ size = 56 }: { size?: number }) {
  const uid = useId();
  const gradId = `plat-grad-${uid}`;
  const glowId = `plat-glow-${uid}`;
  const blurId = `plat-blur-${uid}`;
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none">
      <defs>
        <linearGradient id={gradId} x1="8" y1="8" x2="48" y2="48">
          <stop offset="0%" stopColor="#e0e7ff" />
          <stop offset="50%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#6d28d9" />
        </linearGradient>
        <radialGradient id={glowId} cx="28" cy="28" r="28">
          <stop offset="70%" stopColor="transparent" />
          <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.35" />
        </radialGradient>
        <filter id={blurId}>
          <feGaussianBlur stdDeviation="2" />
        </filter>
      </defs>
      <circle cx="28" cy="28" r="28" fill={`url(#${glowId})`} filter={`url(#${blurId})`} />
      <circle cx="28" cy="28" r="24" fill={`url(#${gradId})`} stroke="#5b21b6" strokeWidth="2" />
      <path d="M28 14l4.5 9.1L43 24.5l-7.3 7.1 1.7 10.1L28 37.3l-9.4 4.4 1.7-10.1L13 24.5l10.5-1.4z" fill="#5b21b6" opacity="0.6" />
      <path d="M28 18l3.2 6.5L38 23.5l-5.2 5 1.2 7.2L28 33.5l-6 4.2 1.2-7.2-5.2-5 6.8-1L28 18z" fill="#ede9fe" />
    </svg>
  );
}

function BadgeIconDiamond({ size = 56 }: { size?: number }) {
  const uid = useId();
  const gradId = `diamond-grad-${uid}`;
  const shimmerId = `diamond-shimmer-${uid}`;
  const glowId = `diamond-glow-${uid}`;
  const blurId = `diamond-blur-${uid}`;
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none">
      <defs>
        <linearGradient id={gradId} x1="8" y1="8" x2="48" y2="48">
          <stop offset="0%" stopColor="#67e8f9" />
          <stop offset="25%" stopColor="#22d3ee" />
          <stop offset="50%" stopColor="#06b6d4" />
          <stop offset="75%" stopColor="#0e7490" />
          <stop offset="100%" stopColor="#155e75" />
        </linearGradient>
        <linearGradient id={shimmerId} x1="0" y1="0" x2="56" y2="56">
          <stop offset="0%" stopColor="white" stopOpacity="0" />
          <stop offset="40%" stopColor="white" stopOpacity="0.5" />
          <stop offset="60%" stopColor="white" stopOpacity="0.5" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={glowId} cx="28" cy="28" r="28">
          <stop offset="60%" stopColor="transparent" />
          <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.3" />
        </radialGradient>
        <filter id={blurId}>
          <feGaussianBlur stdDeviation="1.5" />
        </filter>
      </defs>
      <circle cx="28" cy="28" r="28" fill={`url(#${glowId})`} filter={`url(#${blurId})`} />
      <circle cx="28" cy="28" r="24" fill={`url(#${gradId})`} stroke="#0e7490" strokeWidth="2" />
      <circle cx="28" cy="28" r="24" fill={`url(#${shimmerId})`} />
      <path d="M28 14l5 10.1L44 23.5l-8 7.8 1.9 11L28 35.8l-9.9 5.7 1.9-11-8-7.8 11-1.4z" fill="#0e7490" opacity="0.6" />
      <path d="M28 16l3.5 7.1L39 21.5l-5.6 5.4 1.3 7.7L28 32.5l-6.7 4.1 1.3-7.7-5.6-5.4 7.5-1L28 16z" fill="#cffafe" />
    </svg>
  );
}

function BadgeIcon({ tier, size = 56 }: { tier: string; size?: number }) {
  switch (tier) {
    case 'diamond':  return <BadgeIconDiamond size={size} />;
    case 'platinum': return <BadgeIconPlatinum size={size} />;
    case 'gold':     return <BadgeIconGold size={size} />;
    case 'silver':   return <BadgeIconSilver size={size} />;
    case 'bronze':
    default:         return <BadgeIconBronze size={size} />;
  }
}

/* ─── Locked Overlay SVG ────────────────────────────────────────── */

function LockedOverlay({ size = 56 }: { size?: number }) {
  const uid = useId();
  const bgId = `locked-bg-${uid}`;
  const filterId = `lock-shadow-${uid}`;
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none" className="absolute inset-0">
      <defs>
        <linearGradient id={bgId} x1="0" y1="0" x2="56" y2="56">
          <stop offset="0%" stopColor="#e2e8f0" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>
        <filter id={filterId}>
          <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#475569" floodOpacity="0.2" />
        </filter>
      </defs>
      <circle cx="28" cy="28" r="24" fill={`url(#${bgId})`} stroke="#94a3b8" strokeWidth="2" />
      <g filter={`url(#${filterId})`}>
        <rect x="20" y="26" width="16" height="12" rx="2" fill="#94a3b8" />
        <path d="M23 26V20a5 5 0 0 1 10 0v6" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="28" cy="32" r="2" fill="#cbd5e1" />
      </g>
    </svg>
  );
}

/* ─── Sparkle / Star Particles ──────────────────────────────────── */

function SparkleParticles({ count = 6, color = '#FBBC05' }: { count?: number; color?: string }) {
  return (
    <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%" viewBox="0 0 56 56">
      {[...Array(count)].map((_, i) => {
        const angle = (360 / count) * i;
        const r = 26;
        const x = 28 + r * Math.cos((angle * Math.PI) / 180);
        const y = 28 + r * Math.sin((angle * Math.PI) / 180);
        const size = 1.5 + Math.random() * 2;
        return (
          <motion.circle
            key={i}
            cx={x}
            cy={y}
            r={size}
            fill={color}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 0], scale: [0, 1.2, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.25, ease: 'easeInOut' }}
          />
        );
      })}
    </svg>
  );
}

/* ─── Ribbon Decoration SVG ─────────────────────────────────────── */

function RibbonDecoration({ tier, className = '' }: { tier: string; className?: string }) {
  const colors: Record<string, string> = {
    bronze: '#d97706', silver: '#64748b', gold: '#FBBC05', platinum: '#4285F4', diamond: '#06b6d4',
  };
  const color = colors[tier] ?? '#d97706';
  return (
    <svg className={`absolute -top-1 -right-1 w-8 h-8 ${className}`} viewBox="0 0 32 32" fill="none">
      <path d="M32 0L24 8V32L32 24V0Z" fill={color} opacity="0.9" />
      <path d="M24 8L32 0V24L24 32V8Z" fill={color} opacity="0.6" />
      <circle cx="28" cy="8" r="2" fill="white" opacity="0.8" />
    </svg>
  );
}

/* ─── Confetti Burst SVG ────────────────────────────────────────── */

function ConfettiBurst({ tier }: { tier: string }) {
  const palette: Record<string, string[]> = {
    bronze:   ['#fbbf24', '#d97706', '#f59e0b', '#fcd34d'],
    silver:   ['#e2e8f0', '#cbd5e1', '#94a3b8', '#f8fafc'],
    gold:     ['#fef08a', '#FBBC05', '#f59e0b', '#fde047'],
    platinum: ['#8ab4f8', '#1a73e8', '#4285F4', '#aecbfa'],
    diamond:  ['#67e8f9', '#22d3ee', '#06b6d4', '#a5f3fc'],
  };
  const colors = palette[tier] ?? palette.bronze;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible">
      {[...Array(16)].map((_, i) => {
        const angle = (360 / 16) * i + (i % 2) * 10;
        const dist = 30 + Math.random() * 50;
        const xEnd = Math.cos((angle * Math.PI) / 180) * dist;
        const yEnd = Math.sin((angle * Math.PI) / 180) * dist;
        const w = 3 + Math.random() * 5;
        const h = 6 + Math.random() * 8;
        const rot = Math.random() * 360;
        return (
          <motion.div
            key={i}
            className="absolute top-1/2 left-1/2 rounded-sm"
            style={{
              width: w,
              height: h,
              backgroundColor: colors[i % colors.length],
              rotate: `${rot}deg`,
              x: '-50%',
              y: '-50%',
            }}
            initial={{ x: '-50%', y: '-50%', opacity: 1, scale: 1 }}
            animate={{ x: `calc(-50% + ${xEnd}px)`, y: `calc(-50% + ${yEnd}px)`, opacity: 0, scale: 0.3 }}
            transition={{ duration: 1.2 + Math.random() * 0.5, ease: 'easeOut', delay: i * 0.04 }}
          />
        );
      })}
      {/* glow ring */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ width: 60, height: 60, border: `2px solid ${colors[0]}`, opacity: 1 }}
        initial={{ scale: 0.3, opacity: 0.8 }}
        animate={{ scale: 2.5, opacity: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
    </div>
  );
}

/* ─── Glow Effect SVG ──────────────────────────────────────────── */

function GlowEffect({ tier, size = 80 }: { tier: string; size?: number }) {
  const uid = useId();
  const colors: Record<string, string> = {
    bronze: '#d97706', silver: '#94a3b8', gold: '#FBBC05', platinum: '#a78bfa', diamond: '#22d3ee',
  };
  const color = colors[tier] ?? '#d97706';
  const glowId = `glow-${uid}`;
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" className="absolute inset-0 pointer-events-none">
      <defs>
        <radialGradient id={glowId} cx="40" cy="40" r="40">
          <stop offset="60%" stopColor="transparent" />
          <stop offset="100%" stopColor={color} stopOpacity="0.25" />
        </radialGradient>
      </defs>
      <circle cx="40" cy="40" r="40" fill={`url(#${glowId})`} />
    </svg>
  );
}

const TIER_COLORS: Record<string, { bg: string; fill: string; border: string; glow: string }> = {
  bronze:   { bg: 'bg-amber-50',   fill: 'fill-amber-700',   border: 'border-l-amber-500',   glow: 'shadow-amber-500/30' },
  silver:   { bg: 'bg-slate-50',   fill: 'fill-slate-600',   border: 'border-l-slate-400',   glow: 'shadow-slate-400/30' },
  gold:     { bg: 'bg-yellow-50', fill: 'fill-yellow-700', border: 'border-l-yellow-500',   glow: 'shadow-yellow-500/40' },
  platinum: { bg: 'bg-purple-50', fill: 'fill-purple-700', border: 'border-l-purple-400',   glow: 'shadow-purple-400/30' },
  diamond:  { bg: 'bg-cyan-50',  fill: 'fill-cyan-700',   border: 'border-l-cyan-500',    glow: 'shadow-cyan-500/40' },
};

const TIER_HEX: Record<string, string> = {
  bronze: '#d97706', silver: '#64748b', gold: '#FBBC05', platinum: '#4285F4', diamond: '#06b6d4',
};

const TIER_XP: Record<string, number> = {
  bronze: 50, silver: 100, gold: 200, platinum: 500, diamond: 1000,
};

const CATEGORY_TABS = ['all', 'unlocked', 'locked', 'streak', 'completion', 'mastery', 'explorer', 'special'] as const;
type CategoryTab = typeof CATEGORY_TABS[number];

function Ripple({ delay }: { delay: number }) {
  return (
    <motion.div
      className="absolute inset-0 rounded-inherit pointer-events-none"
      initial={{ scale: 0, opacity: 0 }}
      whileTap={{ scale: 2, opacity: 0.12 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      style={{ backgroundColor: 'currentColor' }}
    />
  );
}

function CircularProgress({ progress, tier, size = 48 }: { progress: number; tier: string; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const hex = TIER_HEX[tier] ?? '#d97706';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-surface-3)"
          strokeWidth="3"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={hex}
          strokeWidth="3"
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - progress) }}
          transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
          style={{ strokeDasharray: circumference }}
        />
      </svg>
    </div>
  );
}

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
  const colors = TIER_COLORS[tier] ?? TIER_COLORS.bronze;
  const progress = bp.target > 0 ? bp.current / bp.target : 0;

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(bp)}
       className={`relative group bg-white border-l-4 text-left w-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer overflow-hidden rounded-xl ${
        isUnlocked
          ? `border-l-4 ${colors.border} shadow-lg ${colors.glow}`
          : 'border-l-4 border-l-slate-300 bg-slate-50'
      }`}
      style={{ borderRadius: 24 }}
    >
      {/* Sparkle particles on hover for unlocked badges */}
      {isUnlocked && (
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <SparkleParticles count={6} color={TIER_HEX[tier] ?? '#d97706'} />
        </div>
      )}

      <div className={`p-5 ${isUnlocked ? colors.bg : 'bg-slate-50'} rounded-xl`}>
        <div className="flex items-start gap-4">
          <div className="relative">
            <div
               className={`w-14 h-14 rounded-xl flex items-center justify-center transition-transform duration-200 relative ${
                isUnlocked ? `bg-gradient-to-br from-white to-slate-100 shadow-md` : 'bg-slate-200'
              }`}
            >
              {isUnlocked ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 15, delay: index * 0.03 + 0.2 }}
                >
                  <BadgeIcon tier={tier} size={40} />
                  <RibbonDecoration tier={tier} />
                </motion.div>
              ) : (
                <>
                  <BadgeIcon tier={tier} size={40} />
                  <LockedOverlay size={40} />
                </>
              )}
            </div>
            {!isUnlocked && progress > 0 && (
              <div className="absolute -bottom-2 -right-2">
                <CircularProgress progress={progress} tier={tier} size={28} />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-semibold text-sm text-slate-900 truncate">{badge.name}</p>
              {isUnlocked && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.03 + 0.3, type: 'spring', stiffness: 400 }}
                >
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                </motion.div>
              )}
            </div>
            <p className="text-xs text-foreground/70 line-clamp-2 leading-relaxed">{badge.description}</p>
          </div>
        </div>

        {isUnlocked ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 + 0.4 }}
            className="mt-3 flex items-center justify-between"
          >
            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${colors.bg} ${colors.fill}`}>
              {badge.tier}
            </span>
            <span className="text-xs font-medium text-slate-600">+{TIER_XP[tier] ?? 50} XP</span>
          </motion.div>
        ) : progress > 0 ? (
          <div className="mt-3 space-y-1.5">
            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress * 100}%` }}
                transition={{ duration: 0.6, delay: index * 0.03 + 0.2, ease: 'easeOut' }}
              />
            </div>
            <p className="text-xs text-foreground/70">{bp.current} / {bp.target}</p>
          </div>
        ) : (
          <div className="mt-3">
            <span className="text-xs text-slate-400">Complete to unlock</span>
          </div>
        )}
      </div>
    </motion.button>
  );
}

function BadgeModal({
  bp,
  onClose,
}: {
  bp: AchievementProgress | null;
  onClose: () => void;
}) {
  const [showConfetti, setShowConfetti] = useState(false);
  const tier = bp?.achievement.tier as string;
  const colors = TIER_COLORS[tier] ?? TIER_COLORS.bronze;

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
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed left-4 right-4 top-1/2 -translate-y-1/2 md:left-1/2 md:right-auto md:w-[400px] md:-translate-x-1/2 z-50 bg-white rounded-xl shadow-sm overflow-hidden"
            initial={{ opacity: 0, scale: 0.9, y: '-45%' }}
            animate={{ opacity: 1, scale: 1, y: '-50%' }}
            exit={{ opacity: 0, scale: 0.9, y: '-45%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {showConfetti && bp.isUnlocked && (
              <ConfettiBurst tier={tier} />
            )}

            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>

            <div className={`p-6 ${bp.isUnlocked ? colors.bg : 'bg-slate-100'} relative overflow-visible`}>
              {/* Glow effect behind badge */}
              {bp.isUnlocked && (
                <div className="absolute top-8 left-1/2 -translate-x-1/2 -translate-y-4 pointer-events-none">
                  <GlowEffect tier={tier} size={120} />
                </div>
              )}

              <div className="flex flex-col items-center text-center">
                <motion.div
                  className={`w-28 h-28 rounded-xl flex items-center justify-center mb-6 relative ${
                    bp.isUnlocked
                      ? `bg-gradient-to-br from-white to-slate-100 shadow-xl ${colors.glow}`
                      : 'bg-slate-200'
                  }`}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  {bp.isUnlocked ? (
                    <BadgeIcon tier={tier} size={80} />
                  ) : (
                    <LockedOverlay size={80} />
                  )}
                </motion.div>

                <motion.h2
                  className="text-2xl font-semibold text-slate-900 mb-2"
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.15 }}
                >
                  {bp.achievement.name}
                </motion.h2>

                <motion.p
                  className="text-sm text-slate-600 mb-4"
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {bp.achievement.description}
                </motion.p>

                <motion.div
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 mb-6"
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.25 }}
                >
                  <Star className="w-4 h-4 text-yellow-500" fill="currentColor" />
                  <span className="text-sm font-medium text-slate-700">+{TIER_XP[tier] ?? 50} XP</span>
                  <span className="text-xs text-foreground/70 capitalize">· {bp.achievement.tier}</span>
                </motion.div>

                {bp.isUnlocked && bp.unlockedAt ? (
                  <motion.div
                    className="flex items-center gap-2 text-green-700 bg-green-50 px-4 py-2 rounded-full"
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Check className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      Earned {new Date(bp.unlockedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                    </span>
                  </motion.div>
                ) : (
                  <motion.div
                     className="w-full p-4 rounded-xl bg-white text-left"
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <p className="text-xs font-medium text-foreground/70 uppercase tracking-wide mb-2">Progress</p>
                    {bp.current > 0 && bp.target > 0 ? (
                      <>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
                          <motion.div
                            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${(bp.current / bp.target) * 100}%` }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                          />
                        </div>
                        <p className="text-sm text-slate-600">{bp.current} / {bp.target} completed</p>
                      </>
                    ) : (
                      <p className="text-sm text-slate-600">Not started yet</p>
                    )}
                  </motion.div>
                )}

                {bp.isUnlocked && (
                  <motion.button
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.35 }}
                    onClick={() => {
                      const text = `I just earned the "${bp.achievement.name}" badge! 🏆`;
                      if (navigator.share) {
                        navigator.share({ text, url: 'https://open-interview.github.io/' });
                      } else {
                        navigator.clipboard.writeText(text);
                      }
                    }}
                    className="mt-6 flex items-center gap-2 px-6 py-4 rounded-full bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                    Share Badge
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

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
        <div className="min-h-screen bg-slate-50 text-slate-900 overflow-x-hidden pb-24 lg:pb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
            <PageHeader title="Badges" />
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-xl bg-slate-100 flex items-center justify-center">
                  <BadgeIconBronze size={40} />
                </div>
                <h2 className="text-2xl font-semibold mb-2">No badges yet</h2>
                <p className="text-foreground/70">Start completing challenges to earn badges!</p>
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
        <div className="min-h-screen bg-slate-50 text-slate-900 w-full overflow-x-hidden pb-24 lg:pb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
            <PageHeader title="Badges" subtitle="Your achievements" />

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-3 gap-4"
            >
               <div className="bg-white rounded-xl p-5 shadow-sm">
                <p className="text-3xl font-semibold text-slate-900">
                  {stats.unlocked}
                  <span className="text-lg text-slate-400 font-normal">/{stats.total}</span>
                </p>
                <p className="text-sm text-foreground/70 mt-1">Badges Earned</p>
              </div>

               <div className="bg-white rounded-xl p-5 shadow-sm">
                <p className="text-3xl font-semibold text-blue-600">+{xpFromBadges.toLocaleString()}</p>
                <p className="text-sm text-foreground/70 mt-1">XP from Badges</p>
              </div>

               <div className="bg-white rounded-xl p-5 shadow-sm">
                {rarestBadge ? (
                  <>
                    <p className={`text-lg font-semibold capitalize ${TIER_COLORS[rarestBadge.achievement.tier]?.fill ?? 'text-slate-900'}`}>
                      {rarestBadge.achievement.tier}
                    </p>
                    <p className="text-xs text-foreground/70 truncate mt-1">{rarestBadge.achievement.name}</p>
                  </>
                ) : (
                  <p className="text-sm text-foreground/70">No badges yet</p>
                )}
                <p className="text-sm text-foreground/70">Rarest Earned</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="bg-white rounded-2xl p-1 shadow-sm border border-slate-100"
            >
              <div className="flex justify-between text-sm text-foreground/70 mb-2 px-3 pt-3">
                <span>{stats.percentage}% complete</span>
                <span>{stats.locked} remaining</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden mx-3 mb-3">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.percentage}%` }}
                  transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 rounded-full"
                />
              </div>
            </motion.div>

            <FilterPills
              options={CATEGORY_TABS.map(t => ({ id: t, label: t.charAt(0).toUpperCase() + t.slice(1) }))}
              active={activeTab}
              onChange={id => setActiveTab(id as CategoryTab)}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredBadges.map((bp, i) => (
                <BadgeCard key={bp.achievement.id} bp={bp} index={i} onClick={setSelectedBadge} />
              ))}
            </div>

            {nextUp.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-100"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-slate-900">Almost There!</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {nextUp.slice(0, 4).map(bp => (
                    <button
                      key={bp.achievement.id}
                      onClick={() => setSelectedBadge(bp)}
                      className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 text-left"
                    >
                      <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center relative">
                        <BadgeIcon tier={bp.achievement.tier} size={40} />
                        {!bp.isUnlocked && <LockedOverlay size={40} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{bp.achievement.name}</p>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                            style={{ width: `${Math.min((bp.current / bp.target) * 100, 100)}%` }}
                          />
                        </div>
                        <p className="text-xs text-foreground/70 mt-1">{bp.current}/{bp.target}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </AppLayout>

      <BadgeModal bp={selectedBadge} onClose={() => setSelectedBadge(null)} />
    </>
  );
}