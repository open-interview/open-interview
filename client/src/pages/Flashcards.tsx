import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { AppLayout } from '../components/layout/AppLayout';
import { SEOHead } from '../components/SEOHead';
import { loadChannelQuestions, getAvailableChannelIds } from '../lib/questions-loader';
import { ChevronLeft, RotateCcw, Check, X, CheckCircle, Lightbulb } from 'lucide-react';
import type { Question } from '../types';

interface Flashcard {
  id: string;
  channel: string;
  front: string;
  back: string;
  hint: string;
}

interface Progress {
  known: string[];
  skipped: string[];
}

const STORAGE_KEY = 'flashcard_progress';

function makeFlashcard(q: Question): Flashcard {
  const front = q.question.length > 120 ? q.question.slice(0, 117) + '…' : q.question;

  const backParagraph = q.answer.split(/\n\n+/)[0].trim();
  const back = backParagraph.length > 300 ? backParagraph.slice(0, 297) + '…' : backParagraph;

  const bulletMatch = (q.explanation || '').match(/[-•*]\s+(.+)/);
  const hint = bulletMatch ? bulletMatch[1].trim() : '';

  return { id: q.id, channel: q.channel, front, back, hint };
}

function loadProgress(): Progress {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{"known":[],"skipped":[]}');
  } catch {
    return { known: [], skipped: [] };
  }
}

function saveProgress(p: Progress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

export default function FlashcardsGenZ() {
  const [, setLocation] = useLocation();
  const [allCards, setAllCards] = useState<Flashcard[]>([]);
  const [channels, setChannels] = useState<string[]>([]);
  const [activeChannel, setActiveChannel] = useState<string>('all');
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [flash, setFlash] = useState<'known' | 'skip' | null>(null);
  const [progress, setProgress] = useState<Progress>(loadProgress);
  const [loading, setLoading] = useState(true);
  const dragX = useRef(0);

  useEffect(() => {
    async function load() {
      const ids = getAvailableChannelIds();
      const channelIds = ids.length > 0 ? ids : ['system-design', 'algorithms', 'frontend', 'backend'];
      const results = await Promise.all(channelIds.map(id => loadChannelQuestions(id)));
      const cards: Flashcard[] = [];
      const seen = new Set<string>();
      results.forEach(qs => {
        qs.forEach(q => {
          if (!seen.has(q.id)) {
            seen.add(q.id);
            cards.push(makeFlashcard(q));
          }
        });
      });
      setAllCards(cards);
      const uniqueChannels = Array.from(new Set(cards.map(c => c.channel))).sort();
      setChannels(uniqueChannels);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = allCards.filter(c => {
    if (activeChannel !== 'all' && c.channel !== activeChannel) return false;
    return !progress.known.includes(c.id) && !progress.skipped.includes(c.id);
  });

  const current = filtered[index] ?? null;
  const total = filtered.length + progress.known.length + progress.skipped.length;
  const done = progress.known.length + progress.skipped.length;

  const triggerFlash = (type: 'known' | 'skip') => {
    setFlash(type);
    setTimeout(() => setFlash(null), 400);
  };

  const markKnown = useCallback(() => {
    if (!current) return;
    triggerFlash('known');
    const next = { ...progress, known: [...progress.known, current.id] };
    setProgress(next);
    saveProgress(next);
    setFlipped(false);
    setIndex(i => Math.min(i, filtered.length - 2));
  }, [current, progress, filtered.length]);

  const markSkip = useCallback(() => {
    if (!current) return;
    triggerFlash('skip');
    const next = { ...progress, skipped: [...progress.skipped, current.id] };
    setProgress(next);
    saveProgress(next);
    setFlipped(false);
    setIndex(i => Math.min(i, filtered.length - 2));
  }, [current, progress, filtered.length]);

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
      else if (e.key === 'ArrowUp') markKnown();
      else if (e.key === 'ArrowDown') markSkip();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [flip, goNext, goPrev, markKnown, markSkip]);

  const resetProgress = () => {
    const empty = { known: [], skipped: [] };
    setProgress(empty);
    saveProgress(empty);
    setIndex(0);
    setFlipped(false);
  };

  const handleDragEnd = (_: unknown, info: { offset: { x: number } }) => {
    if (info.offset.x > 80) markKnown();
    else if (info.offset.x < -80) markSkip();
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-primary text-xl font-bold animate-pulse">Loading flashcards…</div>
        </div>
      </AppLayout>
    );
  }

  if (!current && filtered.length === 0 && (progress.known.length + progress.skipped.length) > 0) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center gap-6 px-6">
          <CheckCircle className="w-20 h-20 text-primary" />
          <h2 className="text-3xl font-black text-center">All done!</h2>
          <p className="text-muted-foreground text-center">
            <span className="text-primary font-bold">{progress.known.length}</span> known ·{' '}
            <span className="text-red-400 font-bold">{progress.skipped.length}</span> skipped
          </p>
          <button
            onClick={resetProgress}
            className="flex items-center gap-2 px-8 py-4 bg-primary text-black font-black rounded-2xl text-lg"
          >
            <RotateCcw className="w-5 h-5" /> Start Over
          </button>
          <button onClick={() => setLocation('/')} className="text-muted-foreground hover:text-foreground transition-colors">
            Back to Home
          </button>
        </div>
      </AppLayout>
    );
  }

  return (
    <>
      <SEOHead
        title="Flashcards"
        description="Swipe-based flashcard practice"
        canonical="https://open-interview.github.io/flashcards"
      />
      <AppLayout>
        <div
          className="min-h-screen bg-background text-foreground flex flex-col pb-24 lg:pb-0"
          style={{
            background: flash === 'known'
              ? 'color-mix(in srgb, var(--color-primary) 8%, var(--background))'
              : flash === 'skip'
              ? 'rgba(255,50,50,0.08)'
              : undefined,
            transition: 'background 0.2s',
          }}
        >
          <div className="max-w-2xl mx-auto w-full px-4 py-6 flex flex-col gap-4 flex-1">
            {/* Header */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setLocation('/')}
                className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                <span className="text-sm">Back</span>
              </button>
              <span className="text-sm font-bold text-muted-foreground">
                {done}/{total} done
              </span>
              <button onClick={resetProgress} className="text-muted-foreground/50 hover:text-muted-foreground transition-colors">
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 bg-gray-900 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-[#00ff88] rounded-full"
                animate={{ width: total > 0 ? `${(done / total) * 100}%` : '0%' }}
                transition={{ duration: 0.4 }}
              />
            </div>

            {/* Channel filter pills */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {['all', ...channels].map(ch => (
                <button
                  key={ch}
                  onClick={() => { setActiveChannel(ch); setIndex(0); setFlipped(false); }}
                  className="shrink-0 px-3 py-1 rounded-full text-xs font-bold uppercase transition-all"
                  style={{
                    background: activeChannel === ch ? '#00ff88' : 'rgba(255,255,255,0.06)',
                    color: activeChannel === ch ? 'black' : '#888',
                    border: activeChannel === ch ? 'none' : '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  {ch}
                </button>
              ))}
            </div>

            {/* Card area */}
            <div className="flex-1 flex flex-col items-center justify-center" style={{ perspective: '1200px' }}>
              <AnimatePresence mode="wait">
                {current ? (
                  <motion.div
                    key={current.id}
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.92 }}
                    transition={{ duration: 0.25 }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.3}
                    onDragEnd={handleDragEnd}
                    className="w-full cursor-grab active:cursor-grabbing"
                    style={{ touchAction: 'pan-y' }}
                  >
                    {/* 3D flip container */}
                    <div
                      className="relative w-full"
                      style={{
                        transformStyle: 'preserve-3d',
                        transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                        transition: 'transform 0.6s cubic-bezier(0.4,0,0.2,1)',
                        minHeight: '340px',
                      }}
                      onClick={flip}
                    >
                      {/* Front */}
                      <div
                        className="absolute inset-0 rounded-3xl p-8 flex flex-col justify-between"
                        style={{
                          backfaceVisibility: 'hidden',
                          WebkitBackfaceVisibility: 'hidden',
                          background: 'rgba(255,255,255,0.04)',
                          backdropFilter: 'blur(20px)',
                          border: '1px solid rgba(255,255,255,0.1)',
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className="px-2 py-0.5 rounded-full text-xs font-bold uppercase"
                            style={{ background: 'rgba(0,255,136,0.15)', color: '#00ff88' }}
                          >
                            {current.channel}
                          </span>
                          <span className="text-xs text-gray-600">tap to flip</span>
                        </div>
                        <p className="text-xl font-bold leading-snug text-center text-white">
                          {current.front}
                        </p>
                        <div className="text-center text-gray-700 text-xs">← skip · know it →</div>
                      </div>

                      {/* Back */}
                      <div
                        className="absolute inset-0 rounded-3xl p-8 flex flex-col justify-between"
                        style={{
                          backfaceVisibility: 'hidden',
                          WebkitBackfaceVisibility: 'hidden',
                          transform: 'rotateY(180deg)',
                          background: 'rgba(0,255,136,0.06)',
                          backdropFilter: 'blur(20px)',
                          border: '1px solid rgba(0,255,136,0.2)',
                        }}
                      >
                        <span
                          className="self-start px-2 py-0.5 rounded-full text-xs font-bold uppercase"
                          style={{ background: 'rgba(0,255,136,0.15)', color: '#00ff88' }}
                        >
                          Answer
                        </span>
                        <p className="text-base leading-relaxed text-gray-100">{current.back}</p>
                        {current.hint && (
                          <div
                            className="rounded-xl px-4 py-3 text-sm text-gray-300"
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                          >
                            <span className="text-[#00ff88] font-bold mr-1">💡</span>
                            {current.hint}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="text-gray-600 text-center">No cards in this channel</div>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom buttons */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <motion.button
                whileTap={{ scale: 0.93 }}
                onClick={markSkip}
                disabled={!current}
                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm disabled:opacity-30"
                style={{ background: 'rgba(255,50,50,0.15)', color: '#ff4444', border: '1px solid rgba(255,50,50,0.3)' }}
              >
                <X className="w-5 h-5" /> Skip
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.93 }}
                onClick={flip}
                disabled={!current}
                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm disabled:opacity-30"
                style={{ background: 'rgba(255,255,255,0.06)', color: '#aaa', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                ↕ Flip
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.93 }}
                onClick={markKnown}
                disabled={!current}
                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm disabled:opacity-30"
                style={{ background: 'rgba(0,255,136,0.15)', color: '#00ff88', border: '1px solid rgba(0,255,136,0.3)' }}
              >
                <Check className="w-5 h-5" /> Know it
              </motion.button>
            </div>
          </div>
        </div>
      </AppLayout>
    </>
  );
}
