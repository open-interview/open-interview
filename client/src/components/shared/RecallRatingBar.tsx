import { useState } from 'react';
import { motion } from 'framer-motion';
import type { ConfidenceRating } from '../../lib/spaced-repetition';

interface RecallRatingBarProps {
  onRate: (rating: ConfidenceRating) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

const ratingConfig: Record<ConfidenceRating, { label: string; description: string; bg: string; color: string; border: string; glow: string; gradient: string }> = {
  again: {
    label: 'Again',
    description: "Didn't recall",
    bg: 'linear-gradient(145deg, #fee2e2, #fecaca)',
    color: '#dc2626',
    border: 'rgba(239,68,68,0.4)',
    glow: '0 4px 16px rgba(239,68,68,0.25)',
    gradient: 'linear-gradient(145deg, #fee2e2, #fecaca)',
  },
  hard: {
    label: 'Hard',
    description: 'With effort',
    bg: 'linear-gradient(145deg, #fef3c7, #fde68a)',
    color: '#d97706',
    border: 'rgba(245,158,11,0.4)',
    glow: '0 4px 16px rgba(245,158,11,0.25)',
    gradient: 'linear-gradient(145deg, #fef3c7, #fde68a)',
  },
  good: {
    label: 'Good',
    description: 'Recalled well',
    bg: 'linear-gradient(145deg, #d1fae5, #a7f3d0)',
    color: '#059669',
    border: 'rgba(16,185,129,0.4)',
    glow: '0 4px 16px rgba(16,185,129,0.25)',
    gradient: 'linear-gradient(145deg, #d1fae5, #a7f3d0)',
  },
  easy: {
    label: 'Easy',
    description: 'Instant recall',
    bg: 'linear-gradient(145deg, #dbeafe, #bfdbfe)',
    color: '#2563eb',
    border: 'rgba(59,130,246,0.4)',
    glow: '0 4px 16px rgba(59,130,246,0.25)',
    gradient: 'linear-gradient(145deg, #dbeafe, #bfdbfe)',
  },
};

export function RecallRatingBar({ onRate, disabled = false, size = 'md' }: RecallRatingBarProps) {
  const [selected, setSelected] = useState<ConfidenceRating | null>(null);

  const handleSelect = (rating: ConfidenceRating) => {
    if (disabled || selected) return;
    setSelected(rating);
    onRate(rating);
  };

  return (
    <div>
      <p className={`text-muted-foreground mb-2 ${size === 'sm' ? 'text-[11px]' : 'text-xs'}`}>
        How well did you recall this?
      </p>
      <div className="grid grid-cols-4 gap-1.5">
        {(Object.entries(ratingConfig) as [ConfidenceRating, typeof ratingConfig[ConfidenceRating]][]).map(([key, cfg]) => {
          const isSelected = selected === key;
          return (
            <motion.button
              key={key}
              disabled={disabled || !!selected}
              onClick={() => handleSelect(key)}
              initial={false}
              animate={isSelected ? { scale: 1.05, y: -2 } : { scale: 1, y: 0 }}
              whileTap={!disabled && !selected ? { scale: 0.95 } : {}}
              className={`
                flex flex-col items-center justify-center rounded-xl border px-2 transition-all font-semibold
                ${size === 'sm' ? 'py-1.5 text-[11px]' : 'py-2 text-xs'}
                disabled:cursor-not-allowed
              `}
              style={{
                background: isSelected ? cfg.gradient : cfg.bg,
                color: cfg.color,
                border: isSelected ? `2px solid ${cfg.color}` : `1px solid ${cfg.border}`,
                boxShadow: isSelected ? cfg.glow : 'none',
              }}
            >
              <span className="font-bold">{cfg.label}</span>
              <span className={`font-normal leading-tight mt-0.5 ${size === 'sm' ? 'text-[10px]' : 'text-[11px]'}`} style={{ opacity: 0.75 }}>
                {cfg.description}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
