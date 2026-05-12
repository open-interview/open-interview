/**
 * Active Recall Session - Gen Z Style
 * Parallel agent-generated recall cards with swipe interaction
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { AppLayout } from '../components/layout/AppLayout';
import { SEOHead } from '../components/SEOHead';
import { useCredits } from '../context/CreditsContext';
import { activeRecall, getDueRecallCards, recordRecallReview, getChannelRecallStats } from '../lib/active-recall';
import type { RecallCard, RecallType, ChannelRecallStats } from '../types/active-recall';
import { ProgressBar } from '../components/unified/ProgressBar';
import { EmptyState } from '../components/unified/EmptyState';
import {
  Brain, ChevronLeft, RotateCcw, Check, X, LightbulbIcon, Zap, TrendingUp, Award, SkipForward, Eye, Sparkles, Timer
} from 'lucide-react';

const RECALL_TYPE_LABELS: Record<RecallType, { label: string; color: string }> = {
  definition: { label: 'Definition', color: 'text-blue-400' },
  comparison: { label: 'Compare', color: 'text-purple-400' },
  process: { label: 'Process', color: 'text-green-400' },
  code: { label: 'Code', color: 'text-yellow-400' },
  concept: { label: 'Concept', color: 'text-amber-400' },
  troubleshooting: { label: 'Troubleshoot', color: 'text-red-400' },
  'best-practice': { label: 'Best Practice', color: 'text-cyan-400' },
  formula: { label: 'Formula', color: 'text-pink-400' },
};

const confidenceLevels = [
  { id: 'forgot', label: 'Forgot', cls: 'bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30', icon: <X className="w-4 h-4" /> },
  { id: 'hard', label: 'Hard', cls: 'bg-orange-500/20 border-orange-500/30 text-orange-400 hover:bg-orange-500/30', icon: <Brain className="w-4 h-4" /> },
  { id: 'remembered', label: 'Got it', cls: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30', icon: <Check className="w-4 h-4" /> },
  { id: 'easy', label: 'Easy', cls: 'bg-blue-500/20 border-blue-500/30 text-blue-400 hover:bg-blue-500/30', icon: <Zap className="w-4 h-4" /> },
];

function getDifficultyColor(difficulty: string): string {
  switch (difficulty) {
    case 'beginner': return 'text-green-400';
    case 'intermediate': return 'text-yellow-400';
    case 'advanced': return 'text-red-400';
    default: return 'text-muted-foreground';
  }
}

function preprocessMarkdown(text: string): string {
  if (!text) return '';
  return text
    .replace(/```(\w*)\n([\s\S]*?)```/g, '```$1\n$2```')
    .replace(/`([^`]+)`/g, '`$1`')
    .replace(/\*\*([^*]+)\*\*/g, '**$1**');
}

interface ActiveRecallProps {
  params?: { channelId?: string };
  initialCardCount?: number;
}

export default function ActiveRecall({ params, initialCardCount = 15 }: ActiveRecallProps) {
  const channelId = params?.channelId;
  const [, setLocation] = useLocation();
  const { onSRSReview } = useCredits();

  const [cards, setCards] = useState<RecallCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showHint, setShowHint] = useState(false);
  const startTimeRef = useRef(Date.now());
  const [cardTime, setCardTime] = useState(Date.now());
  const [stats, setStats] = useState<ChannelRecallStats | null>(null);

  useEffect(() => {
    loadCards();
  }, [channelId]);

  const loadCards = async () => {
    setLoading(true);
    try {
      let dueCards = channelId ? getDueRecallCards(channelId) : getDueRecallCards();

      if (dueCards.length === 0) {
        dueCards = activeRecall.getAllRecallCards().slice(0, initialCardCount);
      }

      if (dueCards.length > 0) {
        const shuffled = [...dueCards].sort(() => Math.random() - 0.5);
        setCards(shuffled.slice(0, initialCardCount));
      }

      if (channelId) {
        setStats(getChannelRecallStats(channelId));
      }
    } catch (error) {
      console.error('Failed to load recall cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfidence = (level: string) => {
    const currentCard = cards[currentIndex];
    if (!currentCard) return;

    const timeSpent = Date.now() - cardTime;
    const isCorrect = level === 'remembered' || level === 'easy';

    recordRecallReview(currentCard.id, isCorrect, timeSpent);

    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
      setStreak(prev => prev + 1);
    } else {
      setStreak(0);
    }

    onSRSReview(level as 'again' | 'hard' | 'good' | 'easy');
    setReviewedCount(prev => prev + 1);
    setShowAnswer(false);
    setShowHint(false);

    if (currentIndex < cards.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setCardTime(Date.now());
    } else {
      setLocation('/stats');
    }
  };

  const handleReveal = () => {
    setShowAnswer(true);
    setShowHint(false);
  };

  const handleHint = () => {
    setShowHint(!showHint);
  };

  const handleSkip = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setShowAnswer(false);
      setShowHint(false);
      setCardTime(Date.now());
    }
  };

  const currentCard = cards[currentIndex];
  const progress = cards.length > 0 ? ((currentIndex + 1) / cards.length) * 100 : 0;
  const accuracy = reviewedCount > 0 ? (correctCount / reviewedCount) * 100 : 0;

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-muted-foreground animate-pulse">Loading recall cards...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (cards.length === 0) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-background">
          <EmptyState
            icon={<Brain className="w-16 h-16 text-muted-foreground/30" />}
            title="No recall cards available"
            description="Start a review session from a channel to generate active recall cards."
            action={
              <button
                onClick={() => setLocation('/channels')}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm"
              >
                Browse Channels
              </button>
            }
          />
        </div>
      </AppLayout>
    );
  }

  return (
    <>
      <SEOHead
        title="Active Recall - Active Learning"
        description="Practice active recall with AI-generated cards"
      />

      <AppLayout>
        <div className="min-h-screen bg-background text-foreground">
          <div className="max-w-2xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setLocation(channelId ? `/channel/${channelId}` : '/')}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                <span>Back</span>
              </button>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span className="font-mono font-bold">{streak} streak</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Timer className="w-4 h-4 text-cyan-400" />
                  <span className="font-mono">{Math.floor((Date.now() - startTimeRef.current) / 1000)}s</span>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>{currentIndex + 1} / {cards.length}</span>
                <span className="text-emerald-400">{accuracy.toFixed(0)}% accuracy</span>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {currentCard && (
                <motion.div
                  key={currentCard.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="bg-card rounded-2xl border border-border p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${RECALL_TYPE_LABELS[currentCard.type]?.color} bg-current/10`}>
                          {RECALL_TYPE_LABELS[currentCard.type]?.label}
                        </span>
                        <span className={`text-xs font-mono ${getDifficultyColor(currentCard.difficulty)}`}>
                          {currentCard.difficulty}
                        </span>
                      </div>
                      {currentCard.relatedConcept && (
                        <span className="text-xs text-muted-foreground">
                          {currentCard.relatedConcept}
                        </span>
                      )}
                    </div>

                    <h2 className="text-xl font-bold mb-6 leading-relaxed">
                      {currentCard.question}
                    </h2>

                    {showHint && currentCard.hint && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mb-4 p-4 bg-amber-500/10 rounded-xl border border-amber-500/20"
                      >
                        <div className="flex items-center gap-2 text-amber-400 text-sm">
                          <LightbulbIcon className="w-4 h-4" />
                          <span className="font-bold">Hint</span>
                        </div>
                        <p className="text-amber-300/80 mt-1">{currentCard.hint}</p>
                      </motion.div>
                    )}

                    <div className="flex gap-3">
                      {!showAnswer && !showHint && (
                        <button
                          onClick={handleHint}
                          className="flex-1 py-3 bg-amber-500/10 text-amber-400 rounded-xl font-bold text-sm hover:bg-amber-500/20 transition-colors flex items-center justify-center gap-2"
                        >
                          <LightbulbIcon className="w-4 h-4" />
                          Show Hint
                        </button>
                      )}
                      {!showAnswer && (
                        <button
                          onClick={handleReveal}
                          className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          Reveal Answer
                        </button>
                      )}
                    </div>

                    <AnimatePresence>
                      {showAnswer && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-6 space-y-4"
                        >
                          <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                            <p className="text-emerald-300 leading-relaxed whitespace-pre-wrap">
                              {currentCard.answer}
                            </p>
                          </div>

                          {currentCard.codeExample && (
                            <div className="p-4 bg-muted rounded-xl overflow-x-auto">
                              <pre className="text-sm font-mono text-foreground">
                                <code>{currentCard.codeExample}</code>
                              </pre>
                            </div>
                          )}

                          {currentCard.explanation && (
                            <div className="p-4 bg-muted/50 rounded-xl">
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                {currentCard.explanation}
                              </p>
                            </div>
                          )}

                          <div className="flex gap-3 pt-4">
                            {confidenceLevels.map((level) => (
                              <button
                                key={level.id}
                                onClick={() => handleConfidence(level.id)}
                                className={`flex-1 py-4 rounded-xl font-bold text-sm border transition-all hover:scale-105 ${level.cls}`}
                              >
                                <div className="flex flex-col items-center gap-1">
                                  {level.icon}
                                  <span>{level.label}</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="flex justify-center gap-4">
                    <button
                      onClick={handleSkip}
                      className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm transition-colors"
                    >
                      <SkipForward className="w-4 h-4" />
                      Skip
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-8 flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>{reviewedCount} reviewed</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-purple-400" />
                <span>{correctCount} correct</span>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    </>
  );
}

export { ActiveRecall };