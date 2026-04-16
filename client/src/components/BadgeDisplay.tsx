/**
 * Badge Display Components
 * Apple Watch-style rings + compact profile widget
 */

import { motion } from 'framer-motion';
import { Link } from 'wouter';
import {
  Flame, CheckCircle, Award, Trophy, BookOpen, TrendingUp, Zap, Star,
  Compass, Globe, Medal, Sunrise, Moon, Calendar, Rocket, Crown, Lock
} from 'lucide-react';
import { Badge, BadgeProgress, getTierColor } from '../lib/badges';
import type { LucideIcon } from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  'flame': Flame, 'check-circle': CheckCircle, 'award': Award, 'trophy': Trophy,
  'book-open': BookOpen, 'trending-up': TrendingUp, 'zap': Zap, 'star': Star,
  'compass': Compass, 'globe': Globe, 'medal': Medal, 'sunrise': Sunrise,
  'moon': Moon, 'calendar': Calendar, 'rocket': Rocket, 'crown': Crown,
};

// ── BadgeRing ────────────────────────────────────────────────

interface BadgeRingProps {
  progress: BadgeProgress;
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
  onClick?: () => void;
}

export function BadgeRing({ progress, size = 'md', showProgress = true, onClick }: BadgeRingProps) {
  const { badge, current, isUnlocked, progress: pct } = progress;

  const sizes = {
    sm: { ring: 44, stroke: 3, icon: 16, font: '9px', inner: 30 },
    md: { ring: 56, stroke: 3, icon: 20, font: '10px', inner: 38 },
    lg: { ring: 80, stroke: 4, icon: 32, font: '12px', inner: 56 },
  };

  const s = sizes[size];
  const radius = (s.ring - s.stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (pct / 100) * circumference;

  const Icon = iconMap[badge.icon] || Star;
  const tierColor = getTierColor(badge.tier);

  return (
    <div
      className={`flex flex-col items-center ${onClick ? 'cursor-pointer active:scale-95 transition-transform' : ''}`}
      onClick={onClick}
      style={{ width: s.ring }}
    >
      <div className="relative" style={{ width: s.ring, height: s.ring }}>
        <svg width={s.ring} height={s.ring} className="transform -rotate-90" style={{ position: 'absolute', top: 0, left: 0 }}>
          <circle cx={s.ring / 2} cy={s.ring / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={s.stroke} className="text-muted/30" />
          <motion.circle
            cx={s.ring / 2} cy={s.ring / 2} r={radius} fill="none"
            stroke={isUnlocked ? tierColor : 'hsl(var(--muted-foreground))'}
            strokeWidth={s.stroke} strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
            style={{ opacity: isUnlocked ? 1 : 0.4 }}
          />
        </svg>
        <div
          className={`absolute rounded-full flex items-center justify-center ${
            isUnlocked ? `bg-gradient-to-br ${badge.gradient} shadow-md` : 'bg-muted/40'
          }`}
          style={{ width: s.inner, height: s.inner, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
        >
          {isUnlocked
            ? <Icon className="text-white" style={{ width: s.icon, height: s.icon }} />
            : <Lock className="text-muted-foreground/60" style={{ width: s.icon, height: s.icon }} />
          }
        </div>
      </div>
      {size !== 'sm' && (
        <span
          className={`mt-1.5 text-center font-medium leading-tight line-clamp-2 ${isUnlocked ? 'text-foreground' : 'text-muted-foreground'}`}
          style={{ fontSize: s.font, width: s.ring + 16, maxWidth: s.ring + 16 }}
        >
          {badge.name}
        </span>
      )}
      {showProgress && !isUnlocked && size !== 'sm' && (
        <span className="text-muted-foreground mt-0.5" style={{ fontSize: '9px' }}>
          {current}/{badge.requirement}
        </span>
      )}
    </div>
  );
}

// ── BadgeGrid ────────────────────────────────────────────────

interface BadgeGridProps {
  badges: BadgeProgress[];
  size?: 'sm' | 'md' | 'lg';
  onBadgeClick?: (badge: Badge) => void;
  maxDisplay?: number;
}

export function BadgeGrid({ badges, size = 'md', onBadgeClick, maxDisplay }: BadgeGridProps) {
  const displayBadges = maxDisplay ? badges.slice(0, maxDisplay) : badges;
  return (
    <div className="flex flex-wrap gap-3 justify-center">
      {displayBadges.map((bp, i) => (
        <motion.div key={bp.badge.id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}>
          <BadgeRing progress={bp} size={size} onClick={onBadgeClick ? () => onBadgeClick(bp.badge) : undefined} />
        </motion.div>
      ))}
    </div>
  );
}

// ── BadgeShowcase ────────────────────────────────────────────

interface BadgeShowcaseProps {
  badges: BadgeProgress[];
  title?: string;
}

export function BadgeShowcase({ badges, title = 'Your Badges' }: BadgeShowcaseProps) {
  const unlockedCount = badges.filter(b => b.isUnlocked).length;
  const sortedBadges = [...badges].sort((a, b) => {
    if (a.isUnlocked && !b.isUnlocked) return -1;
    if (!a.isUnlocked && b.isUnlocked) return 1;
    return b.progress - a.progress;
  });

  return (
    <div className="border border-border p-4 bg-card rounded-xl">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-4 h-4 text-primary" />
        <span className="text-xs uppercase tracking-widest text-muted-foreground font-bold">{title}</span>
        <span className="text-xs text-muted-foreground ml-auto">{unlockedCount} unlocked</span>
      </div>
      <div className="flex gap-5 overflow-x-auto pb-2 no-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
        {sortedBadges.map(bp => (
          <div key={bp.badge.id} className="flex-shrink-0">
            <BadgeRing progress={bp} size="sm" showProgress={false} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── NextBadgeProgress ────────────────────────────────────────

interface NextBadgeProps { badges: BadgeProgress[]; }

export function NextBadgeProgress({ badges }: NextBadgeProps) {
  const nextBadge = badges
    .filter(b => !b.isUnlocked && b.progress > 0)
    .sort((a, b) => b.progress - a.progress)[0];

  if (!nextBadge) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="border border-border p-4 bg-card rounded-xl">
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0">
          <BadgeRing progress={nextBadge} size="sm" showProgress={false} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold truncate">{nextBadge.badge.name}</div>
          <div className="text-xs text-muted-foreground">{nextBadge.badge.description}</div>
          <div className="mt-2 h-1.5 bg-muted/30 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: getTierColor(nextBadge.badge.tier) }}
              initial={{ width: 0 }}
              animate={{ width: `${nextBadge.progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">
            {nextBadge.current} / {nextBadge.badge.requirement} {nextBadge.badge.unit}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── BadgeDisplay (compact widget) ───────────────────────────

interface BadgeDisplayProps {
  badges: BadgeProgress[];
  /** Route to the full badges page */
  viewAllHref?: string;
}

export function BadgeDisplay({ badges, viewAllHref = '/badges' }: BadgeDisplayProps) {
  const unlocked = badges.filter(b => b.isUnlocked);
  // Top 5: highest tier first
  const tierOrder = ['diamond', 'platinum', 'gold', 'silver', 'bronze'];
  const top5 = [...unlocked]
    .sort((a, b) => tierOrder.indexOf(a.badge.tier) - tierOrder.indexOf(b.badge.tier))
    .slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 22 }}
      className="border border-border bg-card rounded-xl p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Badges</span>
        </div>
        <Link
          to={viewAllHref}
          className="text-xs text-primary hover:underline font-semibold"
        >
          View All →
        </Link>
      </div>

      {top5.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-2">No badges yet — start learning!</p>
      ) : (
        <div className="flex gap-3 justify-center flex-wrap">
          {top5.map((bp, i) => (
            <motion.div
              key={bp.badge.id}
              initial={{ opacity: 0, scale: 0.7, rotate: -10 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ delay: i * 0.08, type: 'spring', stiffness: 260, damping: 20 }}
              whileHover={{ scale: 1.15, rotate: 5 }}
            >
              <BadgeRing progress={bp} size="md" showProgress={false} />
            </motion.div>
          ))}
        </div>
      )}

      <div className="mt-3 text-center text-xs text-muted-foreground">
        {unlocked.length} / {badges.length} unlocked
      </div>
    </motion.div>
  );
}
