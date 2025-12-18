/**
 * Apple Watch-style Badge Display Component
 * Shows badges with circular progress rings and animations
 */

import { motion } from 'framer-motion';
import { 
  Flame, CheckCircle, Award, Trophy, BookOpen, TrendingUp, Zap, Star,
  Compass, Globe, Medal, Sunrise, Moon, Calendar, Rocket, Crown, Lock
} from 'lucide-react';
import { Badge, BadgeProgress, getTierColor } from '../lib/badges';

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'flame': Flame,
  'check-circle': CheckCircle,
  'award': Award,
  'trophy': Trophy,
  'book-open': BookOpen,
  'trending-up': TrendingUp,
  'zap': Zap,
  'star': Star,
  'compass': Compass,
  'globe': Globe,
  'medal': Medal,
  'sunrise': Sunrise,
  'moon': Moon,
  'calendar': Calendar,
  'rocket': Rocket,
  'crown': Crown,
};

interface BadgeRingProps {
  progress: BadgeProgress;
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
  onClick?: () => void;
}

export function BadgeRing({ progress, size = 'md', showProgress = true, onClick }: BadgeRingProps) {
  const { badge, current, isUnlocked, progress: pct } = progress;
  
  const sizes = {
    sm: { ring: 48, stroke: 3, icon: 16, font: '8px' },
    md: { ring: 72, stroke: 4, icon: 24, font: '10px' },
    lg: { ring: 96, stroke: 5, icon: 32, font: '12px' },
  };
  
  const s = sizes[size];
  const radius = (s.ring - s.stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (pct / 100) * circumference;
  
  const Icon = iconMap[badge.icon] || Star;
  const tierColor = getTierColor(badge.tier);
  
  return (
    <motion.div
      className={`relative flex flex-col items-center cursor-pointer group ${onClick ? 'hover:scale-105' : ''}`}
      onClick={onClick}
      whileHover={onClick ? { scale: 1.05 } : undefined}
      whileTap={onClick ? { scale: 0.95 } : undefined}
    >
      {/* Ring container */}
      <div 
        className="relative flex items-center justify-center"
        style={{ width: s.ring, height: s.ring }}
      >
        {/* Background ring */}
        <svg width={s.ring} height={s.ring} className="absolute transform -rotate-90">
          <circle
            cx={s.ring / 2}
            cy={s.ring / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={s.stroke}
            className="text-muted/20"
          />
          {/* Progress ring */}
          <motion.circle
            cx={s.ring / 2}
            cy={s.ring / 2}
            r={radius}
            fill="none"
            stroke={isUnlocked ? tierColor : 'hsl(var(--muted-foreground))'}
            strokeWidth={s.stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
            style={{ opacity: isUnlocked ? 1 : 0.4 }}
          />
        </svg>
        
        {/* Inner circle with icon */}
        <div
          className={`
            absolute rounded-full flex items-center justify-center transition-all
            ${isUnlocked 
              ? `bg-gradient-to-br ${badge.gradient} shadow-lg` 
              : 'bg-muted/30'
            }
          `}
          style={{ 
            width: s.ring - s.stroke * 4, 
            height: s.ring - s.stroke * 4,
          }}
        >
          {isUnlocked ? (
            <Icon className={`text-white drop-shadow-sm w-[${s.icon}px] h-[${s.icon}px]`} />
          ) : (
            <Lock className={`text-muted-foreground/50 w-[${Math.round(s.icon * 0.7)}px] h-[${Math.round(s.icon * 0.7)}px]`} />
          )}
        </div>
        
        {/* Shine effect for unlocked badges */}
        {isUnlocked && (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: `linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.3) 50%, transparent 60%)`,
            }}
            animate={{
              backgroundPosition: ['200% 200%', '-200% -200%'],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              repeatDelay: 2,
            }}
          />
        )}
      </div>
      
      {/* Badge name */}
      <span 
        className={`mt-1.5 text-center font-medium truncate max-w-[80px] ${isUnlocked ? 'text-foreground' : 'text-muted-foreground'}`}
        style={{ fontSize: s.font }}
      >
        {badge.name}
      </span>
      
      {/* Progress text */}
      {showProgress && !isUnlocked && (
        <span className="text-muted-foreground" style={{ fontSize: `calc(${s.font} - 1px)` }}>
          {current}/{badge.requirement}
        </span>
      )}
    </motion.div>
  );
}

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
        <motion.div
          key={bp.badge.id}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.05 }}
        >
          <BadgeRing
            progress={bp}
            size={size}
            onClick={onBadgeClick ? () => onBadgeClick(bp.badge) : undefined}
          />
        </motion.div>
      ))}
    </div>
  );
}

interface BadgeShowcaseProps {
  badges: BadgeProgress[];
  title?: string;
}

export function BadgeShowcase({ badges, title = 'Recent Badges' }: BadgeShowcaseProps) {
  const unlockedBadges = badges.filter(b => b.isUnlocked);
  const recentBadges = unlockedBadges
    .sort((a, b) => (b.unlockedAt || '').localeCompare(a.unlockedAt || ''))
    .slice(0, 5);
  
  if (recentBadges.length === 0) {
    return null;
  }
  
  return (
    <div className="border border-border p-3 bg-card rounded-lg">
      <div className="flex items-center gap-1.5 mb-3">
        <Trophy className="w-3.5 h-3.5 text-primary" />
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
          {title}
        </span>
        <span className="text-[10px] text-muted-foreground ml-auto">
          {unlockedBadges.length} unlocked
        </span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {recentBadges.map((bp) => (
          <BadgeRing key={bp.badge.id} progress={bp} size="sm" showProgress={false} />
        ))}
      </div>
    </div>
  );
}

interface NextBadgeProps {
  badges: BadgeProgress[];
}

export function NextBadgeProgress({ badges }: NextBadgeProps) {
  // Find the closest badge to unlock
  const inProgress = badges
    .filter(b => !b.isUnlocked && b.progress > 0)
    .sort((a, b) => b.progress - a.progress);
  
  const nextBadge = inProgress[0];
  
  if (!nextBadge) {
    return null;
  }
  
  const Icon = iconMap[nextBadge.badge.icon] || Star;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-border p-3 bg-card rounded-lg"
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <BadgeRing progress={nextBadge} size="sm" showProgress={false} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold truncate">{nextBadge.badge.name}</div>
          <div className="text-[10px] text-muted-foreground">{nextBadge.badge.description}</div>
          <div className="mt-1.5 h-1.5 bg-muted/30 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: getTierColor(nextBadge.badge.tier) }}
              initial={{ width: 0 }}
              animate={{ width: `${nextBadge.progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <div className="text-[9px] text-muted-foreground mt-0.5">
            {nextBadge.current} / {nextBadge.badge.requirement} {nextBadge.badge.unit}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
