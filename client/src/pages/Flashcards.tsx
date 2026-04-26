import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence, type PanInfo } from 'framer-motion';
import { AppLayout } from '../components/layout/AppLayout';
import { SEOHead } from '../components/SEOHead';
import { useUserPreferences } from '../context/UserPreferencesContext';
import { getRoleDefaultChannels } from '../lib/personalization';
import { ChevronLeft, ChevronRight, RotateCcw, Brain, Layers } from 'lucide-react';
import { ProgressBar } from '../components/unified/ProgressBar';
import { EmptyState } from '../components/unified/EmptyState';
import { FlashcardService, type DbFlashcard } from '../services/api.service';
import {
  getFcCard, recordFcReview, getDueFcCards,
  getMasteryLabel, getMasteryColor,
  type ReviewCard, type ConfidenceRating,
} from '../lib/spaced-repetition';

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
    return cards.filter(c => {
      if (selectedChannels.size > 0 && !selectedChannels.has(c.channel ?? '')) return false;
      if (dueIds && !dueIds.has(c.id)) return false;
      return true;
    });
  }, [cards, selectedChannels, mode]);

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

  if (cards.length === 0) {
    return (
      <AppLayout fullWidth>
        <div className="min-h-screen bg-background text-foreground">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
            <div className="text-center mb-10">
              <h1 className="text-5xl md:text-6xl font-black mb-3">
                <span className="bg-gradient-to-r from-primary to-cyan-500 bg-clip-text text-transparent">Flashcards</span>
              </h1>
            </div>
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <Layers className="w-10 h-10 text-muted-foreground/40" />
              <h2 className="text-xl font-bold">No flashcards yet</h2>
              <p className="text-sm text-muted-foreground max-w-xs">Flashcards are generated from your subscribed channels. Check back soon!</p>
              <button onClick={() => setLocation('/')} className="cursor-pointer min-h-[44px] px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 active:scale-95 transition-all">Back to Home</button>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <>
      <SEOHead title="Flashcards 🃏" description="SRS-powered flashcard practice" canonical="https://open-interview.github.io/flashcards" />
      <AppLayout fullWidth>
        <div className="h-screen h-dvh flex flex-col overflow-hidden text-foreground"
          style={{ background: flashBg, transition: 'background 0.2s' }}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-4 pb-2 flex-shrink-0">
            <button onClick={() => setLocation('/')} className="cursor-pointer flex items-center gap-1 min-h-[44px] px-2 text-muted-foreground hover:text-foreground transition-colors duration-150">
              <ChevronLeft className="w-5 h-5" /><span className="text-sm">Back</span>
            </button>
            <div className="flex items-center gap-2">
              {/* Mode toggle */}
              <button onClick={() => { setMode(m => m === 'all' ? 'due' : 'all'); setIndex(0); setFlipped(false); }}
                className={`cursor-pointer flex items-center gap-1.5 px-3 min-h-[44px] rounded-full text-xs font-bold transition-all duration-150 ${mode === 'due' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>
                <Brain className="w-3.5 h-3.5" />
                {mode === 'due' ? `Due (${dueCount})` : 'All'}
              </button>
            </div>
            <span className="text-sm font-bold text-muted-foreground tabular-nums">{index + 1}/{filtered.length}</span>
          </div>

          {/* Progress */}
          <div className="px-4 flex-shrink-0">
            <ProgressBar current={index + 1} max={filtered.length} size="sm" variant="success" />
          </div>

          {/* Channel filter — multi-select toggles */}
          <div className="flex gap-2 overflow-x-auto px-4 py-2 flex-shrink-0" style={{ scrollbarWidth: 'none' }}>
            {/* "All" clears selection */}
            <button
              onClick={() => { setSelectedChannels(new Set()); setIndex(0); setFlipped(false); }}
              className="cursor-pointer shrink-0 px-3 min-h-[44px] rounded-full text-xs font-bold uppercase transition-all duration-150"
              style={selectedChannels.size === 0
                ? { background: 'var(--gradient-primary, linear-gradient(135deg,#7c3aed,#06b6d4))', color: '#fff' }
                : { background: 'var(--surface-3)', color: 'var(--text-tertiary)', border: '1px solid var(--color-border-subtle)' }}>
              All
            </button>
            {channels.map(ch => {
              const active = selectedChannels.has(ch);
              return (
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
                  className="cursor-pointer shrink-0 px-3 min-h-[44px] rounded-full text-xs font-bold uppercase transition-all duration-150"
                  style={active
                    ? { background: 'var(--gradient-primary, linear-gradient(135deg,#7c3aed,#06b6d4))', color: '#fff' }
                    : { background: 'var(--surface-3)', color: 'var(--text-tertiary)', border: '1px solid var(--color-border-subtle)' }}>
                  {ch}
                </button>
              );
            })}
          </div>

          {/* Card area */}
          <div className="relative flex-1 flex flex-col items-center justify-center px-4 min-h-0" style={{ perspective: '1400px' }}>
            <button onClick={goPrev} disabled={index === 0}
              className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full items-center justify-center bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-20 transition-all cursor-pointer">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button onClick={goNext} disabled={index >= filtered.length - 1}
              className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full items-center justify-center bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-20 transition-all cursor-pointer">
              <ChevronRight className="w-6 h-6" />
            </button>
            <AnimatePresence mode="wait">
              {current ? (
                <motion.div key={current.id}
                  initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }}
                  transition={{ duration: 0.2 }}
                  drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.3}
                  onDragEnd={handleDragEnd}
                  className="w-full max-w-2xl cursor-grab active:cursor-grabbing"
                  style={{ touchAction: 'pan-y' }}>
                  <div className="relative w-full"
                    style={{
                      transformStyle: 'preserve-3d',
                      transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                      transition: 'transform 0.45s cubic-bezier(0.4,0,0.2,1)',
                      height: 'clamp(260px, 42vh, 400px)',
                    }}
                    onClick={flip}>
                    {/* Front */}
                    <div className="absolute inset-0 rounded-[28px] p-6 flex flex-col justify-between"
                      style={{
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        background: 'linear-gradient(145deg, var(--color-surface-2, #1e293b), color-mix(in srgb, var(--color-surface-2, #1e293b) 80%, var(--color-surface-3, #334155)))',
                        border: '1px solid var(--color-border-subtle, rgba(148,163,184,0.15))',
                        boxShadow: '12px 12px 32px rgba(0,0,0,0.35), -6px -6px 24px rgba(255,255,255,0.03), inset 0 1px 0 rgba(255,255,255,0.06)'
                      }}>
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold uppercase badge-success">{current.channel}</span>
                        <div className="flex items-center gap-2">
                          {srsCard && srsCard.totalReviews > 0 && (
                            <span className={`text-xs font-semibold ${getMasteryColor(srsCard.masteryLevel)}`}>
                              {getMasteryLabel(srsCard.masteryLevel)}
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">tap to flip</span>
                        </div>
                      </div>
                      <p className="text-lg md:text-xl font-bold leading-snug text-center text-foreground overflow-hidden"
                        style={{ display: '-webkit-box', WebkitLineClamp: 5, WebkitBoxOrient: 'vertical' }}>
                        {current.front}
                      </p>
                      <div className="text-center text-muted-foreground text-xs italic">
                        Recall the answer mentally, then tap to reveal
                      </div>
                    </div>
                    {/* Back */}
                    <div className="absolute inset-0 rounded-[28px] p-5 flex flex-col gap-2"
                      style={{
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                        background: 'linear-gradient(145deg, color-mix(in srgb, var(--color-success, #10b981) 12%, var(--color-surface-2)), color-mix(in srgb, var(--color-surface-2) 85%, var(--color-surface-3)))',
                        border: '1px solid color-mix(in srgb, var(--color-success, #10b981) 30%, transparent)',
                        boxShadow: '12px 12px 32px rgba(0,0,0,0.35), -6px -6px 24px rgba(255,255,255,0.03), inset 0 1px 0 rgba(255,255,255,0.06)'
                      }}>
                      <span className="self-start px-2 py-0.5 rounded-full text-xs font-bold uppercase badge-success">Answer</span>
                      <p className="text-sm md:text-base leading-relaxed text-foreground overflow-y-auto" style={{ flex: '1 1 0', minHeight: 0 }}>{current.back}</p>
                      {current.hint && (
                        <div className="rounded-xl px-3 py-2 text-xs text-muted-foreground flex-shrink-0"
                          style={{ background: 'var(--surface-3)', border: '1px solid var(--color-border-subtle)' }}>
                          <span className="text-green-500 font-bold mr-1">💡</span>{current.hint}
                        </div>
                      )}
                      {current.mnemonic && (
                        <div className="rounded-xl px-3 py-2 text-xs text-muted-foreground flex-shrink-0"
                          style={{ background: 'var(--surface-3)', border: '1px solid var(--color-border-subtle)' }}>
                          <span className="text-purple-400 font-bold mr-1">🧠</span>{current.mnemonic}
                        </div>
                      )}
                      <div className="flex-shrink-0" onClick={e => e.stopPropagation()}>
                        <textarea
                          rows={2}
                          value={recallAttempt}
                          onChange={e => setRecallAttempt(e.target.value)}
                          placeholder="What did you actually recall? (reflection only)"
                          className="w-full rounded-xl border border-border bg-background/80 text-xs p-2 resize-none focus:outline-none placeholder:text-muted-foreground/50 text-foreground"
                          style={{ fontSize: '11px' }}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <EmptyState icon={<Layers className="w-6 h-6" />} title={mode === 'due' ? 'No cards due!' : 'No cards in selection'}
                  description={mode === 'due' ? 'All caught up. Switch to All mode to keep practicing.' : 'Try toggling different channels.'}
                  variant="default" size="sm" />
              )}
            </AnimatePresence>
          </div>

          {/* SRS rating buttons — only active after flip */}
          <div className="px-4 pb-safe pb-24 pt-2 flex-shrink-0">
            {!flipped && current && (
              <p className="text-center text-xs text-muted-foreground mb-2 italic">Flip the card first, then rate your recall</p>
            )}
            <div className="flex items-center gap-2">
              {([
                { r: 'again' as ConfidenceRating, label: 'Again', key: '1', bg: 'color-mix(in srgb, var(--color-error, #f43f5e) 15%, transparent)', color: 'var(--color-error, #f43f5e)', border: 'color-mix(in srgb, var(--color-error, #f43f5e) 30%, transparent)' },
                { r: 'hard'  as ConfidenceRating, label: 'Hard',  key: '2', bg: 'color-mix(in srgb, #f97316 15%, transparent)', color: '#f97316', border: 'color-mix(in srgb, #f97316 30%, transparent)' },
                { r: 'good'  as ConfidenceRating, label: 'Good',  key: '3', bg: 'color-mix(in srgb, var(--color-success, #10b981) 15%, transparent)', color: 'var(--color-success, #10b981)', border: 'color-mix(in srgb, var(--color-success, #10b981) 30%, transparent)' },
                { r: 'easy'  as ConfidenceRating, label: 'Easy',  key: '4', bg: 'color-mix(in srgb, #3b82f6 15%, transparent)', color: '#3b82f6', border: 'color-mix(in srgb, #3b82f6 30%, transparent)' },
              ]).map(({ r, label, key, bg, color, border }) => (
                <motion.button key={r} whileTap={{ scale: 0.92 }} onClick={() => rate(r)} disabled={!current || !flipped}
                  className="cursor-pointer flex-1 flex flex-col items-center justify-center min-h-[52px] py-3 rounded-[16px] font-semibold text-xs disabled:opacity-25 disabled:cursor-not-allowed transition-all duration-150"
                  style={{
                    background: flash === r
                      ? r === 'again' ? 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)'
                      : r === 'hard' ? 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)'
                      : r === 'good' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                      : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                      : bg,
                    color: flash === r ? '#fff' : color,
                    border: `1px solid ${flash === r ? 'transparent' : border}`,
                    boxShadow: flash === r
                      ? `0 0 24px ${r === 'again' ? 'rgba(244,63,94,0.5)' : r === 'hard' ? 'rgba(249,115,22,0.5)' : r === 'good' ? 'rgba(16,185,129,0.5)' : 'rgba(59,130,246,0.5)'}`
                      : 'none'
                  }}>
                  <span className="font-bold">{label}</span>
                  <span className="opacity-50 text-[10px]">{key}</span>
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </AppLayout>
    </>
  );
}
