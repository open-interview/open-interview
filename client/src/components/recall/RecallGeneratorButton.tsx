/**
 * Active Recall Generator Button
 * Button to trigger parallel agent card generation for a channel
 */

import { useState } from 'react';
import { useLocation } from 'wouter';
import { useActiveRecall } from '../../hooks/use-active-recall';
import type { Question } from '../../types';
import { Sparkles, Brain, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface RecallGeneratorButtonProps {
  channelId: string;
  channelName: string;
  questions: Question[];
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function RecallGeneratorButton({
  channelId,
  channelName,
  questions,
  variant = 'primary',
  size = 'md',
  className = '',
}: RecallGeneratorButtonProps) {
  const [, setLocation] = useLocation();
  const { generateCardsForChannel, getDueCards, isGenerating, generationProgress, error } = useActiveRecall();
  const [showSuccess, setShowSuccess] = useState(false);
  const [cardsGenerated, setCardsGenerated] = useState(0);

  const dueCards = getDueCards(channelId);

  const handleGenerate = async () => {
    if (questions.length === 0) return;

    const cards = await generateCardsForChannel(channelId, channelName, questions, (_progress: number) => {
      // Progress callback
    });

    if (cards.length > 0) {
      setCardsGenerated(cards.length);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    }
  };

  const handleStartSession = () => {
    setLocation(`/recall/${channelId}`);
  };

  const variantClasses = {
    primary: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90',
    secondary: 'bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:bg-purple-500/30',
    ghost: 'text-purple-400 hover:bg-purple-500/10',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2.5',
  };

  const isDisabled = isGenerating || questions.length === 0;

  return (
    <div className={`relative ${className}`}>
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute -top-12 left-0 right-0 text-center"
          >
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-bold">
              +{cardsGenerated} cards generated!
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-2">
        <button
          onClick={handleGenerate}
          disabled={isDisabled}
          className={`
            flex items-center gap-2 rounded-xl font-bold transition-all
            ${variantClasses[variant]}
            ${sizeClasses[size]}
            ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span>{Math.round(generationProgress)}%</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Generate Recall Cards</span>
            </>
          )}
        </button>

        {dueCards.length > 0 && (
          <button
            onClick={handleStartSession}
            className={`
              flex items-center gap-2 rounded-xl font-bold transition-all
              bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30
              ${sizeClasses[size]}
            `}
          >
            <Brain className="w-4 h-4" />
            <span>Practice ({dueCards.length})</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {error && (
        <p className="mt-2 text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}

interface RecallStatsBadgeProps {
  channelId: string;
  className?: string;
}

export function RecallStatsBadge({ channelId, className = '' }: RecallStatsBadgeProps) {
  const { getStats } = useActiveRecall();
  const stats = getStats(channelId);

  if (stats.totalCards === 0) return null;

  return (
    <div className={`flex items-center gap-3 text-xs ${className}`}>
      <div className="flex items-center gap-1 text-purple-400">
        <Brain className="w-3 h-3" />
        <span>{stats.totalCards} cards</span>
      </div>
      {stats.dueToday > 0 && (
        <div className="flex items-center gap-1 text-amber-400">
          <span>•</span>
          <span>{stats.dueToday} due</span>
        </div>
      )}
      {stats.masteredCards > 0 && (
        <div className="flex items-center gap-1 text-emerald-400">
          <span>•</span>
          <span>{stats.masteredCards} mastered</span>
        </div>
      )}
    </div>
  );
}

export default RecallGeneratorButton;