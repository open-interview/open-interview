import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { BookOpen, Award, Brain, FileEdit, Flame } from 'lucide-react';

interface StatRowProps {
  totalReviewed: number;
  mastered: number;
  feynmanAttempts: number;
  customCards: number;
  longestStreak: number;
}

const STAT_ICONS = [BookOpen, Award, Brain, FileEdit, Flame];
const STAT_COLORS = ['text-violet-400', 'text-emerald-400', 'text-cyan-400', 'text-amber-400', 'text-rose-400'];

export const StatRow = React.memo(function StatRow({ totalReviewed, mastered, feynmanAttempts, customCards, longestStreak }: StatRowProps) {
  const isMobile = useIsMobile();

  const stats = [
    { label: 'Total reviewed', value: totalReviewed },
    { label: 'Mastered', value: mastered },
    { label: 'Feynman attempts', value: feynmanAttempts },
    { label: 'Custom cards', value: customCards },
    { label: 'Longest streak', value: `${longestStreak}d` },
  ];

  return (
    <div className={`grid gap-3 ${isMobile ? 'grid-cols-3' : 'grid-cols-5'}`}>
      {stats.map((stat, i) => {
        const Icon = STAT_ICONS[i];
        const color = STAT_COLORS[i];
        return (
          <div key={stat.label} className="glass-card p-4 text-center rounded-xl border border-border/30 hover:border-border/50 transition-all duration-200">
            <Icon className={`w-5 h-5 mx-auto mb-2 ${color}`} aria-hidden={true} />
            <p className="text-xl font-bold text-white">{stat.value}</p>
            <p className="text-[11px] text-muted-foreground mt-1 font-medium">{stat.label}</p>
          </div>
        );
      })}
    </div>
  );
});
