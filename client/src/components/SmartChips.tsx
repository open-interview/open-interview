import { Sparkles, Flame, TrendingUp, Lightbulb } from 'lucide-react';
import { motion } from 'framer-motion';

interface SmartChipDef {
  id: string;
  icon: React.ElementType;
  label: string;
  accent: string;
  onClick?: () => void;
}

interface SmartChipsProps {
  streak?: number;
  dueToday?: number;
  onStartStudy?: () => void;
}

export function SmartChips({ streak = 0, dueToday = 0, onStartStudy }: SmartChipsProps) {
  const chips: SmartChipDef[] = [];

  if (streak > 0) {
    chips.push({
      id: 'streak',
      icon: Flame,
      label: `${streak}-day streak`,
      accent: 'text-amber-400',
    });
  }

  if (dueToday > 0) {
    chips.push({
      id: 'due',
      icon: TrendingUp,
      label: `${dueToday} card${dueToday !== 1 ? 's' : ''} due`,
      accent: 'text-emerald-400',
      onClick: onStartStudy,
    });
  } else {
    chips.push({
      id: 'ready',
      icon: Sparkles,
      label: 'All caught up!',
      accent: 'text-violet-400',
    });
  }

  chips.push({
    id: 'tip',
    icon: Lightbulb,
    label: 'AI suggests: Review Caching',
    accent: 'text-cyan-400',
  });

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {chips.map((chip, i) => {
        const Icon = chip.icon;
        return (
          <motion.button
            key={chip.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 + i * 0.05, type: 'spring', stiffness: 400, damping: 25 }}
            onClick={chip.onClick}
            disabled={!chip.onClick}
            className="md3-ripple inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-accent/30 hover:bg-accent/50 border border-border/20 transition-all cursor-pointer disabled:cursor-default"
          >
            <Icon className={`w-3.5 h-3.5 ${chip.accent}`} />
            <span className="text-foreground">{chip.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
