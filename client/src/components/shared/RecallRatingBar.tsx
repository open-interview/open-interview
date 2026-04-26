import { useState } from 'react';
import type { ConfidenceRating } from '../../lib/spaced-repetition';

interface RecallRatingBarProps {
  onRate: (rating: ConfidenceRating) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

const ratingConfig: Record<ConfidenceRating, { label: string; description: string; bg: string; color: string; border: string }> = {
  again: {
    label: 'Again',
    description: "Didn't recall",
    bg: 'color-mix(in srgb, #f43f5e 15%, transparent)',
    color: '#f43f5e',
    border: 'color-mix(in srgb, #f43f5e 30%, transparent)',
  },
  hard: {
    label: 'Hard',
    description: 'With effort',
    bg: 'color-mix(in srgb, #f97316 15%, transparent)',
    color: '#f97316',
    border: 'color-mix(in srgb, #f97316 30%, transparent)',
  },
  good: {
    label: 'Good',
    description: 'Recalled well',
    bg: 'color-mix(in srgb, #10b981 15%, transparent)',
    color: '#10b981',
    border: 'color-mix(in srgb, #10b981 30%, transparent)',
  },
  easy: {
    label: 'Easy',
    description: 'Instant recall',
    bg: 'color-mix(in srgb, #3b82f6 15%, transparent)',
    color: '#3b82f6',
    border: 'color-mix(in srgb, #3b82f6 30%, transparent)',
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
        {(Object.entries(ratingConfig) as [ConfidenceRating, typeof ratingConfig[ConfidenceRating]][]).map(([key, cfg]) => (
          <button
            key={key}
            disabled={disabled || !!selected}
            onClick={() => handleSelect(key)}
            className={`
              flex flex-col items-center justify-center rounded-xl border px-2 transition-all font-semibold
              ${size === 'sm' ? 'py-1.5 text-[11px]' : 'py-2 text-xs'}
              ${selected === key ? 'ring-2 ring-offset-1 scale-105' : ''}
              ${selected && selected !== key ? 'opacity-30' : ''}
              disabled:cursor-not-allowed
            `}
            style={{
              background: cfg.bg,
              color: cfg.color,
              border: selected === key ? `2px solid ${cfg.color}` : `1px solid ${cfg.border}`,
            }}
          >
            <span className="font-bold">{cfg.label}</span>
            <span className={`font-normal leading-tight mt-0.5 ${size === 'sm' ? 'text-[10px]' : 'text-[11px]'}`} style={{ opacity: 0.75 }}>
              {cfg.description}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
