/**
 * Unified Achievement Card
 * Displays achievement with progress ring (replaces BadgeRing)
 * Part of the unified design system
 */

import { motion } from 'framer-motion';
import { Lock, Check } from 'lucide-react';
import { AchievementProgress, AchievementCategory } from '../../lib/achievements';
import { getTierColor } from '../../lib/badges';
import * as Icons from 'lucide-react';

// Category labels
const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  streak: 'Consistency',
  completion: 'Progress',
  mastery: 'Difficulty',
  explorer: 'Explorer',
  special: 'Special',
  daily: 'Daily',
  weekly: 'Weekly',
  social: 'Social',
};

function getCategoryLabel(category: AchievementCategory): string {
  return CATEGORY_LABELS[category] || category;
}

interface AchievementCardProps {
  progress: AchievementProgress;
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
  showDetails?: boolean;
  onClick?: () => void;
}

export function AchievementCard({ 
  progress, 
  size = 'md', 
  showProgress = true,
  showDetails = false,
  onClick 
}: AchievementCardProps) {
  const { achievement, current, target, isUnlocked, progress: pct } = progress;
  
  // Sizes
  const sizes = {
    sm: { ring: 48, stroke: 3, icon: 18, font: '10px', inner: 34 },
    md: { ring: 64, stroke: 4, icon: 24, font: '11px', inner: 46 },
    lg: { ring: 96, stroke: 5, icon: 36, font: '13px', inner: 70 },
  };
  
  const s = sizes[size];
  const radius = (s.ring - s.stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (pct / 100) * circumference;
  
  // Get icon component
  const IconComponent = (Icons as any)[achievement.icon.split('-').map((w: string) => 
    w.charAt(0).toUpperCase() + w.slice(1)
  ).join('')] || Icons.Star;
  
  const tierColor = getTierColor(achievement.tier);
  
  return (
    <div
      className={`flex flex-col items-center ${onClick ? 'cursor-pointer active:scale-95 transition-transform' : ''}`}
      onClick={onClick}
      style={{ width: s.ring + (showDetails ? 32 : 0) }}
    >
      {/* Ring container */}
      <div 
        className="relative"
        style={{ width: s.ring, height: s.ring }}
      >
        {/* SVG Ring */}
        <svg 
          width={s.ring} 
          height={s.ring} 
          className="transform -rotate-90"
          style={{ position: 'absolute', top: 0, left: 0 }}
        >
          {/* Background ring */}
          <circle
            cx={s.ring / 2}
            cy={s.ring / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={s.stroke}
            className="text-muted/30"
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
            absolute rounded-full flex items-center justify-center
            ${isUnlocked 
              ? `bg-gradient-to-br ${achievement.gradient} shadow-md` 
              : 'bg-muted/40'
            }
          `}
          style={{ 
            width: s.inner, 
            height: s.inner,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          {isUnlocked ? (
            <IconComponent 
              className="text-white" 
              style={{ width: s.icon, height: s.icon }}
            />
          ) : (
            <Lock 
              className="text-muted-foreground/60" 
              style={{ width: s.icon, height: s.icon }}
            />
          )}
        </div>
        
        {/* Unlocked checkmark */}
        {isUnlocked && size !== 'sm' && (
          <div 
            className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center shadow-md"
          >
            <Check className="w-3 h-3 text-white" />
          </div>
        )}
      </div>
      
      {/* Achievement name */}
      {size !== 'sm' && (
        <span 
          className={`mt-2 text-center font-medium leading-tight line-clamp-2 ${isUnlocked ? 'text-foreground' : 'text-muted-foreground'}`}
          style={{ fontSize: s.font, width: s.ring + 16, maxWidth: s.ring + 16 }}
        >
          {achievement.name}
        </span>
      )}
      
      {/* Progress text */}
      {showProgress && !isUnlocked && size !== 'sm' && (
        <span className="text-muted-foreground mt-1" style={{ fontSize: '9px' }}>
          {current}/{target}
        </span>
      )}
      
      {/* Details */}
      {showDetails && size === 'lg' && (
        <div className="mt-3 text-center w-full">
          <p className="text-xs text-muted-foreground mb-2">
            {achievement.description}
          </p>
          <div className="flex items-center justify-center gap-2">
            <span
              className="px-2 py-0.5 rounded-full text-[9px] uppercase font-bold"
              style={{ 
                backgroundColor: `${tierColor}15`,
                color: tierColor,
                border: `1px solid ${tierColor}30`
              }}
            >
              {achievement.tier}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[9px] uppercase font-medium bg-muted/50 text-muted-foreground">
              {getCategoryLabel(achievement.category)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// Grid of achievement cards
interface AchievementGridProps {
  achievements: AchievementProgress[];
  size?: 'sm' | 'md' | 'lg';
  onAchievementClick?: (achievement: AchievementProgress) => void;
  maxDisplay?: number;
}

export function AchievementGrid({ 
  achievements, 
  size = 'md', 
  onAchievementClick,
  maxDisplay 
}: AchievementGridProps) {
  const displayAchievements = maxDisplay ? achievements.slice(0, maxDisplay) : achievements;
  
  return (
    <div className="grid grid-cols-4 gap-3 sm:gap-4">
      {displayAchievements.map((ap, i) => (
        <motion.div
          key={ap.achievement.id}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.03 }}
          className="flex justify-center"
        >
          <AchievementCard
            progress={ap}
            size={size}
            onClick={onAchievementClick ? () => onAchievementClick(ap) : undefined}
          />
        </motion.div>
      ))}
    </div>
  );
}
