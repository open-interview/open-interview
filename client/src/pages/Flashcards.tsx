import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence, type PanInfo } from 'framer-motion';
import { AppLayout } from '../components/layout/AppLayout';
import { SEOHead } from '../components/SEOHead';
import { useUserPreferences } from '../context/UserPreferencesContext';
import { getRoleDefaultChannels } from '../lib/personalization';
import { ChevronLeft, Layers } from 'lucide-react';
import { ProgressBar } from '../components/unified/ProgressBar';
import { EmptyState } from '../components/unified/EmptyState';
import { FlashcardService, type DbFlashcard } from '../services/api.service';
import {
  getFcCard, recordFcReview, getDueFcCards,
  getMasteryLabel, getMasteryColor,
  type ReviewCard, type ConfidenceRating,
} from '../lib/spaced-repetition';

type Mode = 'all' | 'due';

const SRS_BUTTONS = [
  { r: 'again' as ConfidenceRating, label: 'Again', key: '1', color: '#f43f5e' },
  { r: 'hard'  as ConfidenceRating, label: 'Hard',  key: '2', color: '#f97316' },
  { r: 'good'  as ConfidenceRating, label: 'Good',  key: '3', color: '#10b981' },
  { r: 'easy'  as ConfidenceRating, label: 'Easy',  key: '4', color: '#3b82f6' },
];

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
  const [hintDismissed, setHintDismissed] = useState(() => sessionStorage.getItem('fc_hint_dismissed') === 'true');

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const subscribedIds = getSubscribedChannels().map(c => c.id);
        const channelIds = subscribedIds.length > 0
          ? subscribedIds
          : getRoleDefaultChannels(preferences.role ?? '');

        const all = await FlashcardService.getAll(2000);
        const filtered = channelIds.length > 0
          ? all.filter(c => channelIds.includes(c.channel ?? ''))
          : all;
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

  useEffect(() => {
    if (!current) { setSrsCard(null); return; }
    setSrsCard(getFcCard(current.id, current.channel ?? '', current.difficulty ?? 'intermediate'));
    setFlipped(false);
  }, [current?.id]);

  const triggerFlash = (r: ConfidenceRating) => {
    setFlash(r);
    setTimeout(() => setFlash(null), 350);
  };

  const rate = useCallback((rating: ConfidenceRating) => {
    if (!current || !flipped) return;
    triggerFlash(rating);
    recordFcReview(current.id, current.channel ?? '', current.difficulty ?? 'intermediate', rating);
    setSrsCard(getFcCard(current.id, current.channel ?? '', current.difficulty ?? 'intermediate'));
    setFlipped(false);
    setIndex(i => Math.max(0, Math.min(i, filtered.length - 2)));
  }, [current, filtered.length, flipped]);

  const flip = useCallback(() => {
    setFlipped(f => !f);
    if (!hintDismissed) {
      setHintDismissed(true);
      sessionStorage.setItem('fc_hint_dismissed', 'true');
    }
  }, [hintDismissed]);

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
      <AppLayout fullWidth>
        <div className="h-screen h-dvh bg-background flex items-center justify-center">
          <div className="flex flex-col gap-4 w-full max-w-sm px-6">
            <div className="h-1 bg-muted rounded-full animate-pulse" />
            <div className="h-48 bg-muted rounded-2xl animate-pulse" />
            <div className="flex gap-2">
              {[1,2,3,4].map(i => <div key={i} className="flex-1 h-11 bg-muted rounded-xl animate-pulse" />)}
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (cards.length === 0) {
    return (
      <AppLayout fullWidth>
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center space-y-4">
            <Layers className="w-10 h-10 text-muted-foreground/40 mx-auto" />
            <h2 className="text-xl font-bold">No flashcards yet</h2>
            <p className="text-sm text-muted-foreground max-w-xs">Flashcards are generated from your subscribed channels. Check back soon!</p>
            <button onClick={() => setLocation('/')} className="min-h-[44px] px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold cursor-pointer hover:opacity-90 active:scale-95 transition-all">Back to Home</button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <>
      <SEOHead title="Flashcards" description="SRS-powered flashcard practice" canonical="https://open-interview.github.io/flashcards" />
      <AppLayout fullWidth>
        <div className="h-screen h-dvh flex flex-col overflow-hidden text-foreground"
          style={{ background: flashBg, transition: 'background 0.2s' }}>

          {/* ── Chrome: Back + progress + counter + mode toggle ── */}
          <div className="flex items-center gap-2 px-3 pt-2 pb-1 flex-shrink-0" style={{ height: 'var(--chrome-height, 56px)' }}>
            <button onClick={() => setLocation('/')} className="flex items-center gap-1 px-1 text-muted-foreground hover:text-foreground transition-colors shrink-0 cursor-pointer">
              <ChevronLeft className="w-4 h-4" /><span className="text-xs">Back</span>
            </button>
            <div className="flex-1 min-w-0">
              <ProgressBar current={index + 1} max={filtered.length} size="sm" variant="success" />
            </div>
            <span className="text-xs font-bold text-muted-foreground tabular-nums shrink-0">{index + 1}/{filtered.length}</span>
            <button onClick={() => { setMode(m => m === 'all' ? 'due' : 'all'); setIndex(0); setFlipped(false); }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-all shrink-0 cursor-pointer ${mode === 'due' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>
              {mode === 'due' ? `Due (${dueCount})` : 'All'}
            </button>
          </div>

          {/* ── Channel filter pills ── */}
          <div className="flex gap-1.5 overflow-x-auto px-3 py-1 flex-shrink-0 scrollbar-hide">
            <button onClick={() => { setSelectedChannels(new Set()); setIndex(0); setFlipped(false); }}
              className="shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase transition-all cursor-pointer"
              style={selectedChannels.size === 0
                ? { background: 'var(--gradient-primary, linear-gradient(135deg,#7c3aed,#06b6d4))', color: '#fff' }
                : { background: 'var(--surface-3)', color: 'var(--text-tertiary)', border: '1px solid var(--color-border-subtle)' }}>
              All
            </button>
            {channels.map(ch => {
              const active = selectedChannels.has(ch);
              return (
                <button key={ch}
                  onClick={() => { setSelectedChannels(prev => { const n = new Set(prev); n.has(ch) ? n.delete(ch) : n.add(ch); return n; }); setIndex(0); setFlipped(false); }}
                  className="shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase transition-all cursor-pointer"
                  style={active
                    ? { background: 'var(--gradient-primary)', color: '#fff' }
                    : { background: 'var(--surface-3)', color: 'var(--text-tertiary)', border: '1px solid var(--color-border-subtle)' }}>
                  {ch}
                </button>
              );
            })}
          </div>

          {/* ── Card area ── */}
          <div className="relative flex-1 flex flex-col items-center justify-center px-4 min-h-0" style={{ perspective: '1400px' }}>
            <div className="w-full max-w-lg">
            <AnimatePresence mode="wait">
              {current ? (
                <motion.div key={current.id}
                  initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }}
                  transition={{ duration: 0.2 }}
                  drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.3}
                  onDragEnd={handleDragEnd}
                  className="w-full max-w-2xl cursor-grab active:cursor-grabbing"
                  style={{ touchAction: 'pan-y' }}>
                  {/* 3D flip container — pure CSS, GPU-composited */}
                  <div className="relative w-full"
                    style={{
                      transformStyle: 'preserve-3d',
                      transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                      transition: 'transform 0.45s cubic-bezier(0.4,0,0.2,1)',
                      height: 'clamp(220px, 38vh, 360px)',
                    }}
                    onClick={flip}>
                    {/* Front */}
                    <div className="absolute inset-0 rounded-[28px] p-6 flex flex-col"
                      style={{
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        background: 'linear-gradient(145deg, var(--color-surface-2, #1e293b), color-mix(in srgb, var(--color-surface-2, #1e293b) 80%, var(--color-surface-3, #334155)))',
                        border: '1px solid var(--color-border-subtle, rgba(148,163,184,0.15))',
                        boxShadow: '12px 12px 32px rgba(0,0,0,0.35), -6px -6px 24px rgba(255,255,255,0.03), inset 0 1px 0 rgba(255,255,255,0.06)'
                      }}>
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-green-500/20 text-green-400">{current.channel}</span>
                        {srsCard && srsCard.totalReviews > 0 && (
                          <span className={`text-[10px] font-semibold ${getMasteryColor(srsCard.masteryLevel)}`}>
                            {getMasteryLabel(srsCard.masteryLevel)}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 flex items-center justify-center">
                        <p className="text-lg md:text-xl font-bold leading-snug text-center text-foreground line-clamp-6">
                          {current.front}
                        </p>
                      </div>
                      {!flipped && !hintDismissed && (
                        <div className="text-center text-muted-foreground/40 mt-2 animate-pulse">
                          <span className="text-[10px]">Tap to reveal</span>
                        </div>
                      )}
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
                      <span className="self-start px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-green-500/20 text-green-400">Answer</span>
                      <p className="text-sm md:text-base leading-relaxed text-foreground overflow-y-auto flex-1 min-h-0">{current.back}</p>
                      {current.hint && (
                        <div className="rounded-xl px-3 py-2 text-xs text-muted-foreground flex-shrink-0"
                          style={{ background: 'var(--surface-3)', border: '1px solid var(--color-border-subtle)' }}>
                          <span className="text-green-500 font-bold mr-1">&#x1f4a1;</span>{current.hint}
                        </div>
                      )}
                      {current.mnemonic && (
                        <div className="rounded-xl px-3 py-2 text-xs text-muted-foreground flex-shrink-0"
                          style={{ background: 'var(--surface-3)', border: '1px solid var(--color-border-subtle)' }}>
                          <span className="text-purple-400 font-bold mr-1">&#x1f9e0;</span>{current.mnemonic}
                        </div>
                      )}
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
          </div>

          {/* ── Rating bar — always visible ── */}
          <div className="px-3 pb-safe pb-20 pt-1.5 flex-shrink-0">
            <div className="flex items-center gap-1.5">
              {SRS_BUTTONS.map(({ r, label, key, color }) => (
                <motion.button key={r} whileTap={{ scale: 0.92 }} onClick={() => rate(r)} disabled={!current || !flipped}
                  className="flex-1 flex flex-col items-center justify-center py-2.5 rounded-[12px] font-semibold text-[11px] disabled:opacity-20 disabled:cursor-not-allowed transition-all cursor-pointer"
                  style={{
                    background: flash === r
                      ? `linear-gradient(135deg, ${color}, color-mix(in srgb, ${color} 60%, #000))`
                      : `color-mix(in srgb, ${color} 12%, transparent)`,
                    color: flash === r ? '#fff' : color,
                    border: `1px solid ${flash === r ? 'transparent' : `color-mix(in srgb, ${color} 30%, transparent)`}`,
                    boxShadow: flash === r ? `0 0 20px color-mix(in srgb, ${color} 50%, transparent)` : 'none'
                  }}>
                  <span className="font-bold leading-tight">{label}</span>
                  <span className="opacity-40 text-[9px] leading-tight">{key}</span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* ── Keyboard hint bar ── */}
          <div className="flex-shrink-0 px-3 py-1 text-center text-[10px] text-muted-foreground/50">
            Space to flip &middot; 1 Again &middot; 2 Hard &middot; 3 Good &middot; 4 Easy &middot; &larr; &rarr; Navigate
          </div>
        </div>
      </AppLayout>
    </>
  );
}
