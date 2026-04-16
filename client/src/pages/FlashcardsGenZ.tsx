import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence, type PanInfo } from 'framer-motion';
import { AppLayout } from '../components/layout/AppLayout';
import { SEOHead } from '../components/SEOHead';
import { loadChannelQuestions, getAvailableChannelIds } from '../lib/questions-loader';
import { ChevronLeft, RotateCcw, Check, X } from 'lucide-react';
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
      setChannels(Array.from(new Set(cards.map(c => c.channel))).sort());
      setLoading(false);
    }
    load();
  }, []);

  const filtered = allCards.filter(c => {
    if (activeChannel !== 'all' && c.channel !== activeChannel) return false;
    return !progress.known.includes(c.id) && !progress.skipped.includes(c.id);
  });

  const current = filtered[index] ?? null;
  const totalSeen = progress.known.length + progress.skipped.length;
  const total = filtered.length + totalSeen;

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
    setIndex(i => Math.max(0, Math.min(i, filtered.length - 2)));
  }, [current, progress, filtered.length]);

  const markSkip = useCallback(() => {
    if (!current) return;
    triggerFlash('skip');
    const next = { ...progress, skipped: [...progress.skipped, current.id] };
    setProgress(next);
    saveProgress(next);
    setFlipped(false);
    setIndex(i => Math.max(0, Math.min(i, filtered.length - 2)));
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

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x > 80) markKnown();
    else if (info.offset.x < -80) markSkip();
  };

  if (loading) {
    return (
      <AppLayout hideNav>
        <div className="h-screen h-dvh bg-[#050810] flex items-center justify-center">
          <div className="text-[#00ff88] text-xl font-bold animate-pulse">Loading flashcards…</div>
        </div>
      </AppLayout>
    );
  }

  if (!current && totalSeen > 0) {
    return (
      <AppLayout hideNav>
        <div className="h-screen h-dvh bg-[#050810] text-white flex flex-col items-center justify-center gap-6 px-6">
          <div className="text-7xl">🎉</div>
          <h2 className="text-3xl font-black text-center">All done!</h2>
          <span className="text-gray-400 text-center">
            <span className="text-[#00ff88] font-bold">{progress.known.length}</span> known ·{' '}
            <span className="text-red-400 font-bold">{progress.skipped.length}</span> skipped
          </span>
          <button
            onClick={resetProgress}
            className="flex items-center gap-2 px-8 py-4 bg-[#00ff88] text-black font-black rounded-2xl text-lg"
          >
            <RotateCcw className="w-5 h-5" /> Start Over
          </button>
          <button onClick={() => setLocation('/')} className="text-gray-500 hover:text-white transition-colors">
            Back to Home
          </button>
        </div>
      </AppLayout>
    );
  }

  return (
    <>
      <SEOHead
        title="Flashcards 🃏"
        description="Swipe-based flashcard practice"
        canonical="https://open-interview.github.io/flashcards"
      />
      {/* Full-screen layout: fixed viewport height, no scroll, one card at a time */}
      <AppLayout hideNav>
        <div
          className="h-screen h-dvh flex flex-col overflow-hidden text-white"
          style={{
            background: flash === 'known'
              ? 'rgba(0,255,136,0.08)'
              : flash === 'skip'
              ? 'rgba(255,50,50,0.08)'
              : '#050810',
            transition: 'background 0.2s',
          }}
        >
          {/* Header row */}
          <div className="flex items-center justify-between px-4 pt-4 pb-2 flex-shrink-0">
            <button
              onClick={() => setLocation('/')}
              className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm">Back</span>
            </button>
            <span className="text-sm font-bold text-gray-400">{totalSeen}/{total} done</span>
            <button onClick={resetProgress} className="text-gray-600 hover:text-gray-400 transition-colors">
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="h-1 bg-white/5 mx-4 rounded-full overflow-hidden flex-shrink-0">
            <motion.div
              className="h-full bg-[#00ff88] rounded-full"
              animate={{ width: total > 0 ? `${(totalSeen / total) * 100}%` : '0%' }}
              transition={{ duration: 0.4 }}
            />
          </div>

          {/* Channel filter pills */}
          <div className="flex gap-2 overflow-x-auto px-4 py-2 flex-shrink-0" style={{ scrollbarWidth: 'none' }}>
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

          {/* Card area — takes remaining space */}
          <div className="flex-1 flex flex-col items-center justify-center px-4 min-h-0" style={{ perspective: '1200px' }}>
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
                  className="w-full max-w-2xl cursor-grab active:cursor-grabbing"
                  style={{ touchAction: 'pan-y' }}
                >
                  {/* 3D flip container — explicit height so absolute children are visible */}
                  <div
                    className="relative w-full"
                    style={{
                      transformStyle: 'preserve-3d',
                      transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                      transition: 'transform 0.5s cubic-bezier(0.4,0,0.2,1)',
                      height: 'clamp(280px, 45vh, 420px)',
                    }}
                    onClick={flip}
                  >
                    {/* Front */}
                    <div
                      className="absolute inset-0 rounded-3xl p-6 flex flex-col justify-between"
                      style={{
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        background: 'rgba(255,255,255,0.04)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255,255,255,0.1)',
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold uppercase" style={{ background: 'rgba(0,255,136,0.15)', color: '#00ff88' }}>
                          {current.channel}
                        </span>
                        <span className="text-xs text-gray-600">tap to flip</span>
                      </div>
                      <p className="text-lg md:text-xl font-bold leading-snug text-center text-white overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 6, WebkitBoxOrient: 'vertical' }}>
                        {current.front}
                      </p>
                      <div className="text-center text-gray-700 text-xs">← skip · know it →</div>
                    </div>

                    {/* Back */}
                    <div
                      className="absolute inset-0 rounded-3xl p-6 flex flex-col gap-3"
                      style={{
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                        background: 'rgba(0,255,136,0.06)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(0,255,136,0.2)',
                      }}
                    >
                      <span className="self-start px-2 py-0.5 rounded-full text-xs font-bold uppercase" style={{ background: 'rgba(0,255,136,0.15)', color: '#00ff88' }}>
                        Answer
                      </span>
                      <p className="text-sm md:text-base leading-relaxed text-gray-100 flex-1 overflow-y-auto">
                        {current.back}
                      </p>
                      {current.hint && (
                        <div className="rounded-xl px-3 py-2 text-xs text-gray-300 flex-shrink-0" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
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
          <div className="flex items-center gap-3 px-4 pb-6 pt-3 flex-shrink-0">
            <motion.button whileTap={{ scale: 0.93 }} onClick={markSkip} disabled={!current}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm disabled:opacity-30"
              style={{ background: 'rgba(255,50,50,0.15)', color: '#ff4444', border: '1px solid rgba(255,50,50,0.3)' }}>
              <X className="w-4 h-4" /> Skip
            </motion.button>
            <motion.button whileTap={{ scale: 0.93 }} onClick={flip} disabled={!current}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm disabled:opacity-30"
              style={{ background: 'rgba(255,255,255,0.06)', color: '#aaa', border: '1px solid rgba(255,255,255,0.1)' }}>
              ↕ Flip
            </motion.button>
            <motion.button whileTap={{ scale: 0.93 }} onClick={markKnown} disabled={!current}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm disabled:opacity-30"
              style={{ background: 'rgba(0,255,136,0.15)', color: '#00ff88', border: '1px solid rgba(0,255,136,0.3)' }}>
              <Check className="w-4 h-4" /> Know it
            </motion.button>
          </div>
        </div>
      </AppLayout>
    </>
  );
}
