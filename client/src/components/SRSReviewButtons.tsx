/**
 * SRS Review Buttons Component
 * Shows confidence rating buttons after revealing an answer
 */

import { motion } from 'framer-motion';
import { RotateCcw, Brain, Check, Zap } from 'lucide-react';
import type { ReviewCard, ConfidenceRating } from '../lib/spaced-repetition';
import { getNextReviewPreview, getMasteryLabel, getMasteryColor } from '../lib/spaced-repetition';

interface SRSReviewButtonsProps {
  card: ReviewCard;
  onRate: (rating: ConfidenceRating) => void;
  compact?: boolean;
}

export function SRSReviewButtons({ card, onRate, compact = false }: SRSReviewButtonsProps) {
  const previews = getNextReviewPreview(card);
  
  const buttons: { rating: ConfidenceRating; label: string; preview: string; icon: React.ReactNode; color: string; bg: string }[] = [
    { 
      rating: 'again', 
      label: 'Again', 
      preview: previews.again,
      icon: <RotateCcw className="w-4 h-4" />,
      color: 'text-red-500',
      bg: 'bg-red-500/10 hover:bg-red-500/20 border-red-500/30'
    },
    { 
      rating: 'hard', 
      label: 'Hard', 
      preview: previews.hard,
      icon: <Brain className="w-4 h-4" />,
      color: 'text-orange-500',
      bg: 'bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/30'
    },
    { 
      rating: 'good', 
      label: 'Good', 
      preview: previews.good,
      icon: <Check className="w-4 h-4" />,
      color: 'text-green-500',
      bg: 'bg-green-500/10 hover:bg-green-500/20 border-green-500/30'
    },
    { 
      rating: 'easy', 
      label: 'Easy', 
      preview: previews.easy,
      icon: <Zap className="w-4 h-4" />,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30'
    }
  ];

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground mr-1">Rate:</span>
        {buttons.map((btn) => (
          <button
            key={btn.rating}
            onClick={() => onRate(btn.rating)}
            className={`px-2 py-1 rounded text-xs font-medium border transition-colors ${btn.bg} ${btn.color}`}
            title={`${btn.label} - Next review in ${btn.preview}`}
          >
            {btn.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      {/* Mastery indicator */}
      <div className="flex items-center justify-center gap-2 text-sm">
        <span className="text-muted-foreground">Mastery:</span>
        <span className={`font-medium ${getMasteryColor(card.masteryLevel)}`}>
          {getMasteryLabel(card.masteryLevel)}
        </span>
        {card.totalReviews > 0 && (
          <span className="text-xs text-muted-foreground">
            ({card.totalReviews} reviews)
          </span>
        )}
      </div>

      {/* Rating buttons */}
      <div className="flex items-center justify-center gap-2 sm:gap-3">
        {buttons.map((btn, idx) => (
          <motion.button
            key={btn.rating}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            onClick={() => onRate(btn.rating)}
            className={`flex flex-col items-center gap-1 px-3 sm:px-4 py-2 sm:py-3 rounded-xl border transition-all ${btn.bg}`}
          >
            <div className={`${btn.color}`}>{btn.icon}</div>
            <span className={`text-xs sm:text-sm font-medium ${btn.color}`}>{btn.label}</span>
            <span className="text-[10px] sm:text-xs text-muted-foreground">{btn.preview}</span>
          </motion.button>
        ))}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Rate your confidence to schedule the next review
      </p>
    </motion.div>
  );
}

export default SRSReviewButtons;
