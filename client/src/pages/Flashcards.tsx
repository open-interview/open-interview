import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence, type PanInfo } from 'framer-motion';
import { AppLayout } from '../components/layout/AppLayout';
import { SEOHead } from '../components/SEOHead';
import { useUserPreferences } from '../context/UserPreferencesContext';
import { getRoleDefaultChannels } from '../lib/personalization';
import { ChevronLeft, ChevronRight, RotateCcw, Brain, Layers } from 'lucide-react';
import { FlashcardService, type DbFlashcard } from '../services/api.service';
import {
  getFcCard, recordFcReview, getDueFcCards,
  getMasteryLabel, getMasteryColor,
  type ReviewCard, type ConfidenceRating,
} from '../lib/spaced-repetition';

const FlipHintIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-pulse">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M12 4v16" />
  </svg>
);

const AgainIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--color-error, #EA4335)" stroke="var(--color-error, #EA4335)" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
  </svg>
);

const HardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--color-warning, #FBBC05)" stroke="var(--color-warning, #FBBC05)" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
  </svg>
);

const GoodIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--color-success, #34A853)" stroke="var(--color-success, #34A853)" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
  </svg>
);

const EasyIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--color-primary, #3b82f6)" stroke="var(--color-primary, #3b82f6)" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
  </svg>
);

const ShuffleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 3h5v5" />
    <path d="M4 20L21 3" />
    <path d="M21 16v5h-5" />
    <path d="M15 15l6 6" />
    <path d="M4 4l5 5" />
  </svg>
);

const ChannelIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
    <circle cx="7" cy="7" r="1" fill="currentColor" />
  </svg>
);

const CornerDecoration = () => (
  <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor" className="text-foreground/20">
    <circle cx="4" cy="4" r="2" />
  </svg>
);

type Mode = 'all' | 'due';

export default function Flashcards() {
  const [, setLocation] = useLocation();
  const { getSubscribedChannels, preferences } = useUserPreferences();

  const [cards, setCards] = useState<DbFlashcard[]>([]);
  const [channels, setChannels] = useState<string[]>([]);
  const [selectedChannels, setSelectedChannels] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<Mode>('all');
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [flash, setFlash] = useState<ConfidenceRating | null>(null);
  const [srsCard, setSrsCard] = useState<ReviewCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [recallAttempt, setRecallAttempt] = useState('');
  const [sessionStats, setSessionStats] = useState<Record<ConfidenceRating, number>>({ again: 0, hard: 0, good: 0, easy: 0 });
  const [sessionRatings, setSessionRatings] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [shuffled, setShuffled] = useState(false);
  const [shuffleOrder, setShuffleOrder] = useState<number[] | null>(null);

  // Load DB flashcards for subscribed channels
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const subscribedIds = getSubscribedChannels().map(c => c.id);
        const channelIds = subscribedIds.length > 0
          ? subscribedIds
          : getRoleDefaultChannels(preferences.role ?? '');

        // Load all flashcards once, then filter client-side
        const all = await FlashcardService.getAll(2000);
        const filtered = channelIds.length > 0
          ? all.filter(c => channelIds.includes(c.channel ?? ''))
          : all;
        // Deduplicate by id
        const seen = new Set<string>();
        const deduped = filtered.filter(c => { if (seen.has(c.id)) return false; seen.add(c.id); return true; });
        setCards(deduped);
        setChannels(Array.from(new Set(deduped.map(c => c.channel ?? '').filter(Boolean))).sort());
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Derive visible deck
  const deck = useCallback((): DbFlashcard[] => {
    const dueIds = mode === 'due' ? new Set(getDueFcCards().map(c => c.questionId)) : null;
    const result = cards.filter(c => {
      if (selectedChannels.size > 0 && !selectedChannels.has(c.channel ?? '')) return false;
      if (dueIds && !dueIds.has(c.id)) return false;
      return true;
    });
    if (shuffleOrder && shuffleOrder.length === result.length) {
      return shuffleOrder.map(i => result[i]).filter(Boolean);
    }
    return result;
  }, [cards, selectedChannels, mode, shuffleOrder]);

  const filtered = deck();
  const current = filtered[index] ?? null;
  const dueCount = getDueFcCards().length;

  // Sync SRS card when current changes
  useEffect(() => {
    if (!current) { setSrsCard(null); return; }
    setSrsCard(getFcCard(current.id, current.channel ?? '', current.difficulty ?? 'intermediate'));
    setFlipped(false);
    setRecallAttempt('');
  }, [current?.id]);

  const triggerFlash = (r: ConfidenceRating) => {
    setFlash(r);
    setTimeout(() => setFlash(null), 350);
  };

  const rate = useCallback((rating: ConfidenceRating) => {
    if (!current || !flipped) return;
    triggerFlash(rating);
    const updated = recordFcReview(current.id, current.channel ?? '', current.difficulty ?? 'intermediate', rating);
    setSrsCard(updated);
    setFlipped(false);
    setRecallAttempt('');
    setSessionStats(prev => ({ ...prev, [rating]: prev[rating] + 1 }));
    setSessionRatings(prev => prev + 1);
    setIndex(i => Math.max(0, Math.min(i, filtered.length - 2)));
  }, [current, filtered.length, flipped]);

  const flip = useCallback(() => setFlipped(f => !f), []);

  const goNext = useCallback(() => {
    if (index < filtered.length - 1) { setIndex(i => i + 1); setFlipped(false); }
  }, [index, filtered.length]);

  const goPrev = useCallback(() => {
    if (index > 0) { setIndex(i => i - 1); setFlipped(false); }
  }, [index]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === ' ') { e.preventDefault(); flip(); }
      else if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === '1') rate('again');
      else if (e.key === '2') rate('hard');
      else if (e.key === '3') rate('good');
      else if (e.key === '4') rate('easy');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [flip, goNext, goPrev, rate]);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!flipped) return;
    if (info.offset.x > 80) rate('good');
    else if (info.offset.x < -80) rate('again');
  };

  const flashBg = flash === 'easy' || flash === 'good'
    ? 'color-mix(in srgb, var(--color-success, #10b981) 8%, var(--background))'
    : flash === 'again' || flash === 'hard'
    ? 'color-mix(in srgb, var(--color-error, #f43f5e) 8%, var(--background))'
    : undefined;

  if (loading) {
    return (
      <AppLayout hideNav fullWidth>
        <div className="h-screen h-dvh bg-background flex items-center justify-center">
          <div className="flex flex-col gap-4 w-full max-w-sm px-6">
            <div className="h-1.5 bg-muted rounded-full animate-pulse" />
            <div className="h-48 bg-muted rounded-2xl animate-pulse" />
            <div className="flex gap-3">
              {[1,2,3,4].map(i => <div key={i} className="flex-1 h-12 bg-muted rounded-xl animate-pulse" />)}
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <>
      <SEOHead title="Flashcards" description="SRS-powered flashcard practice" canonical="https://open-interview.github.io/flashcards" />
      <AppLayout fullWidth>
        <div className="min-h-screen h-dvh flex flex-col bg-background text-foreground overflow-hidden"
          style={{ background: flashBg, transition: 'background 0.2s' }}>

          {/* Header */}
          <header className="flex items-center justify-between px-4 py-2 flex-shrink-0" style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}>
            <button onClick={() => setLocation('/')} className="cursor-pointer flex items-center gap-1 min-h-[44px] px-2 -ml-2 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none">
              <ChevronLeft className="w-5 h-5" /><span>Back</span>
            </button>
            <h1 className="text-lg font-semibold">Flashcards</h1>
             <div className="flex items-center gap-2">
                <button onClick={() => { setMode(m => m === 'all' ? 'due' : 'all'); setIndex(0); setFlipped(false); }}
                   className={`cursor-pointer flex items-center gap-1.5 px-3 min-h-[36px] rounded-full text-sm font-semibold transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none ${mode === 'due' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground/70 hover:text-foreground border border-outline'}`}>
                 <Brain className="w-3.5 h-3.5" />
                 {mode === 'due' ? dueCount : 'All'}
               </button>
               <button
                 onClick={() => {
                   if (filtered.length === 0) return;
                   const order = Array.from({ length: filtered.length }, (_, i) => i);
                   for (let i = order.length - 1; i > 0; i--) {
                     const j = Math.floor(Math.random() * (i + 1));
                     [order[i], order[j]] = [order[j], order[i]];
                   }
                   setShuffleOrder(order);
                   setIndex(0);
                   setFlipped(false);
                   setShuffled(true);
                   setTimeout(() => setShuffled(false), 500);
                 }}
                  className={`cursor-pointer p-2 min-h-[36px] min-w-[36px] rounded-full transition-all duration-200 flex items-center justify-center focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none ${shuffled ? 'bg-primary text-primary-foreground rotate-180' : 'bg-muted text-foreground/70 hover:text-foreground border border-outline'}`}
                  style={{ transition: 'transform 0.3s ease' }}
               >
                 <ShuffleIcon />
               </button>
             </div>
          </header>

          {/* Channel filter */}
          <div className="flex gap-2 overflow-x-auto px-4 py-2 flex-shrink-0" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
             <button
               onClick={() => { setSelectedChannels(new Set()); setIndex(0); setFlipped(false); }}
               className={`cursor-pointer shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-150 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none ${selectedChannels.size === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground/70 hover:text-foreground border border-outline'}`}>
               All
             </button>
              {channels.map(ch => (
                <button key={ch}
                  onClick={() => {
                    setSelectedChannels(prev => {
                      const next = new Set(prev);
                      next.has(ch) ? next.delete(ch) : next.add(ch);
                      return next;
                    });
                    setIndex(0);
                    setFlipped(false);
                  }}
                  className={`cursor-pointer shrink-0 pl-2.5 pr-3 py-1.5 rounded-full text-sm font-medium transition-all duration-150 flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none ${selectedChannels.has(ch) ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground/70 hover:text-foreground border border-outline'}`}>
                  <ChannelIcon /> {ch}
                </button>
              ))}
          </div>

           {/* Progress indicator */}
            <div className="px-4 flex-shrink-0">
              <div className="flex items-center justify-between text-sm text-foreground/70 mb-1">
                <span>Progress</span>
                <span className="font-medium tabular-nums">{index + 1} / {filtered.length}</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <svg width="100%" height="8" viewBox="0 0 100 8" preserveAspectRatio="none" className="block">
                  <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="var(--color-primary)" />
                      <stop offset="100%" stopColor="var(--color-secondary, #4285F4)" />
                    </linearGradient>
                  </defs>
                  <motion.rect
                    x="0" y="0" height="8" rx="4"
                    fill="url(#progressGradient)"
                    initial={{ width: 0 }}
                    animate={{ width: filtered.length > 0 ? ((index + 1) / filtered.length) * 100 : 0 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                  />
                </svg>
              </div>
            </div>

          {/* Card area */}
          <div className="relative flex-1 flex flex-col items-center justify-center px-4 py-4 min-h-0" style={{ perspective: '1200px' }}>
             <button onClick={goPrev} disabled={index === 0}
                className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full items-center justify-center bg-muted hover:bg-muted/80 text-foreground/70 hover:text-foreground disabled:opacity-20 disabled:cursor-not-allowed transition-all cursor-pointer border border-outline focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none">
               <ChevronLeft className="w-5 h-5" />
             </button>
             <button onClick={goNext} disabled={index >= filtered.length - 1}
                className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full items-center justify-center bg-muted hover:bg-muted/80 text-foreground/70 hover:text-foreground disabled:opacity-20 disabled:cursor-not-allowed transition-all cursor-pointer border border-outline focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none">
               <ChevronRight className="w-5 h-5" />
             </button>
            <AnimatePresence mode="wait">
              {current ? (
                <motion.div key={current.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.2}
                  onDragEnd={handleDragEnd}
                  className="w-full max-w-lg cursor-grab active:cursor-grabbing touch-none"
                  style={{ touchAction: 'none' }}>
                   <div className="relative w-full"
                     style={{
                       transformStyle: 'preserve-3d',
                       transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                       transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                       minHeight: '280px',
                     }}
                     onClick={flip}>
                      {/* Front */}
                       <div                        className="absolute inset-0 rounded-xl p-6 flex flex-col justify-between shadow-sm"
                        style={{
                          backfaceVisibility: 'hidden',
                          WebkitBackfaceVisibility: 'hidden',
                          background: 'var(--color-surface-1)',
                          border: '1px solid var(--color-outline)',
                        }}>
                        <div className="absolute top-2 left-2"><CornerDecoration /></div>
                        <div className="absolute top-2 right-2"><CornerDecoration /></div>
                        <div className="flex items-center justify-between">
                         <span className="px-3 py-1.5 rounded-full text-sm font-medium" style={{ background: 'var(--color-primary-container)', color: 'var(--color-on-primary-container)' }}>{current.channel}</span>
                         <div className="flex items-center gap-2">
                           {srsCard && srsCard.totalReviews > 0 && (
                             <span className={`text-sm font-medium ${getMasteryColor(srsCard.masteryLevel)}`}>
                               {getMasteryLabel(srsCard.masteryLevel)}
                             </span>
                           )}
                            <span className="text-sm text-foreground/70 flex items-center gap-1"><FlipHintIcon /> Tap to flip</span>
                         </div>
                       </div>
                       <p className="text-lg md:text-xl font-medium leading-snug text-center text-foreground overflow-hidden"
                         style={{ display: '-webkit-box', WebkitLineClamp: 6, WebkitBoxOrient: 'vertical' }}>
                         {current.front}
                       </p>
                       <div className="text-center text-foreground/70 text-sm">
                         Recall the answer, then tap to reveal
                       </div>
                     </div>
                      {/* Back */}
                       <div                        className="absolute inset-0 rounded-xl p-5 flex flex-col gap-3 shadow-sm">
                        style={{
                          backfaceVisibility: 'hidden',
                          WebkitBackfaceVisibility: 'hidden',
                          transform: 'rotateY(180deg)',
                          background: 'var(--color-surface-1)',
                          border: '1px solid var(--color-primary)',
                        }}>
                        <div className="absolute top-2 left-2"><CornerDecoration /></div>
                        <div className="absolute top-2 right-2"><CornerDecoration /></div>
                        <span className="self-start px-3 py-1.5 rounded-full text-sm font-medium" style={{ background: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}>Answer</span>
                       <p className="text-base leading-relaxed text-foreground overflow-y-auto" style={{ flex: '1 1 0', minHeight: 0 }}>{current.back}</p>
                       {current.hint && (
                         <div className="rounded-xl px-3 py-2 text-sm flex-shrink-0"
                           style={{ background: 'var(--color-muted)', border: '1px solid var(--color-outline)' }}>
                           <span className="font-medium mr-1">💡</span>{current.hint}
                         </div>
                       )}
                       {current.mnemonic && (
                         <div className="rounded-xl px-3 py-2 text-sm flex-shrink-0"
                           style={{ background: 'var(--color-muted)', border: '1px solid var(--color-outline)' }}>
                           <span className="font-medium mr-1">🧠</span>{current.mnemonic}
                         </div>
                       )}
                     </div>
                   </div>
                </motion.div>
               ) : (
                 <div className="flex flex-col items-center justify-center py-12 text-center">
                   <Layers className="w-12 h-12 text-foreground/30 mb-4" />
                   <h2 className="text-lg font-medium text-foreground mb-2">{mode === 'due' ? 'All caught up!' : 'No cards found'}</h2>
                   <p className="text-base text-foreground/70">
                     {mode === 'due' ? 'Switch to All mode to keep practicing' : 'Try selecting different channels'}
                   </p>
                 </div>
               )}
            </AnimatePresence>
          </div>

          {/* Navigation controls */}
           <div className="flex items-center justify-center gap-3 px-4 pb-4 flex-shrink-0" style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
             {!current && cards.length > 0 ? (
               <button onClick={() => { setSelectedChannels(new Set()); setMode('all'); setIndex(0); setFlipped(false); }}
                  className="cursor-pointer px-4 py-2 h-10 rounded-full bg-muted hover:bg-muted/80 text-sm font-medium transition-all border border-outline focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
                  Show all cards
               </button>
             ) : !flipped ? (
               <button onClick={flip} disabled={!current}
                   className="cursor-pointer w-full max-w-xs py-4 rounded-full text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-primary text-primary-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none">
                 Show Answer
               </button>
              ) : (
                <div className="flex gap-2 w-full max-w-md">
                  {[
                    { r: 'again' as ConfidenceRating, label: 'Again', key: '1', colorVar: 'var(--color-error, #EA4335)', Icon: AgainIcon },
                    { r: 'hard' as ConfidenceRating, label: 'Hard', key: '2', colorVar: 'var(--color-warning, #FBBC05)', Icon: HardIcon },
                    { r: 'good' as ConfidenceRating, label: 'Good', key: '3', colorVar: 'var(--color-success, #34A853)', Icon: GoodIcon },
                    { r: 'easy' as ConfidenceRating, label: 'Easy', key: '4', colorVar: 'var(--color-primary, #3b82f6)', Icon: EasyIcon },
                  ].map(({ r, label, key, colorVar, Icon }) => (
                    <motion.button key={r} whileTap={{ scale: 0.92 }} onClick={() => rate(r)}
                       className="cursor-pointer flex-1 flex flex-col items-center justify-center py-2 h-10 rounded-lg text-sm font-medium transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none shadow-none"
                      style={{
                        background: flash === r ? colorVar : 'var(--color-muted)',
                        color: flash === r ? '#fff' : colorVar,
                        border: `1px solid ${flash === r ? 'transparent' : 'var(--color-outline)'}`,
                        boxShadow: flash === r ? `0 0 20px ${colorVar}66` : 'none',
                      }}>
                      <Icon />
                      <span className="font-semibold">{label}</span>
                      <span className="text-xs opacity-50">{key}</span>
                    </motion.button>
                  ))}
                </div>
              )}
           </div>
        </div>
      </AppLayout>
    </>
  );
}
