import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { SwipeCard, FeynmanAttempt, FeynmanRating } from '@/types/swipe';

export interface FeynmanModeProps {
  card: SwipeCard;
  onComplete: (rating: FeynmanRating, text: string) => void;
  onCancel: () => void;
}

const STORAGE_KEY = 'oi-feynman-attempts';
const MAX_ATTEMPTS = 100;

function saveAttempt(attempt: FeynmanAttempt) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const attempts: FeynmanAttempt[] = raw ? JSON.parse(raw) : [];
    attempts.push(attempt);
    if (attempts.length > MAX_ATTEMPTS) {
      attempts.splice(0, attempts.length - MAX_ATTEMPTS);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(attempts));
  } catch {
    // localStorage unavailable or full
  }
}

export function FeynmanMode({ card, onComplete, onCancel }: FeynmanModeProps) {
  const [step, setStep] = useState<'explain' | 'reveal'>('explain');
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const canReveal = text.trim().length >= 10;

  useEffect(() => {
    if (step === 'explain' && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [step]);

  const handleReveal = () => {
    if (!canReveal) return;
    setStep('reveal');
  };

  const handleRate = (rating: FeynmanRating) => {
    saveAttempt({
      cardId: card.id,
      attempt: text.trim(),
      timestamp: new Date().toISOString(),
      rating,
      sourceQuestionId: card.sourceQuestionId,
      channel: card.channel,
      subChannel: card.subChannel,
    });
    onComplete(rating, text.trim());
  };

  return (
    <motion.div
      data-pagefind-body="false"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div
        className="relative w-full max-w-2xl bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: '90vh' }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a2a]">
          <h2 className="text-sm font-semibold text-[#a0a0a0] uppercase tracking-wider">
            Feynman Technique
          </h2>
          <button
            onClick={onCancel}
            className="text-[#666] hover:text-white transition-colors text-lg leading-none"
            aria-label="Cancel"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          <div className="px-6 py-5">
            <div className="mb-6 bg-[#141414] border border-[#2a2a2a] rounded-xl p-5 min-h-[100px]">
              <p className="text-xs text-[#666] mb-2 uppercase tracking-wider font-medium">
                Question
              </p>
              <p className="text-white text-base leading-relaxed whitespace-pre-wrap">
                {card.front}
              </p>
            </div>

            <AnimatePresence mode="wait">
              {step === 'explain' && (
                <motion.div
                  key="explain"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.2 }}
                >
                  <label className="block text-sm text-[#a0a0a0] mb-3">
                    Explain this in your own words
                  </label>
                  <textarea
                    ref={textareaRef}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Type your explanation..."
                    className="w-full h-48 bg-[#141414] border border-[#2a2a2a] rounded-xl p-4 text-white font-mono text-sm resize-none focus:outline-none focus:border-[#4a4a4a] transition-colors"
                  />
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-xs text-[#555]">
                      {text.trim().length} characters
                    </span>
                    <motion.button
                      onClick={handleReveal}
                      disabled={!canReveal}
                      className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                        canReveal
                          ? 'bg-[#4f46e5] text-white hover:bg-[#6366f1] shadow-lg shadow-indigo-500/20'
                          : 'bg-[#2a2a2a] text-[#555] cursor-not-allowed'
                      }`}
                      whileTap={canReveal ? { scale: 0.97 } : undefined}
                    >
                      Reveal Answer
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {step === 'reveal' && (
                <motion.div
                  key="reveal"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="mb-5 bg-[#141414] border border-[#2a2a2a] rounded-xl p-5">
                    <p className="text-xs text-[#666] mb-2 uppercase tracking-wider font-medium">
                      Your Explanation
                    </p>
                    <p className="text-white text-sm leading-relaxed whitespace-pre-wrap font-mono">
                      {text.trim()}
                    </p>
                  </div>

                  <div className="mb-6 bg-[#141414] border border-[#2a2a2a] rounded-xl p-5">
                    <p className="text-xs text-[#666] mb-2 uppercase tracking-wider font-medium">
                      Answer
                    </p>
                    <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">
                      {card.back}
                    </p>
                  </div>

                  <p className="text-sm text-[#a0a0a0] mb-3 text-center">
                    How close was your explanation?
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleRate('again')}
                      className="flex-1 py-3 rounded-xl bg-[#2a2a2a] hover:bg-[#dc2626]/20 border border-[#3a3a3a] hover:border-[#dc2626]/40 text-sm text-[#ccc] hover:text-red-400 font-medium transition-all"
                    >
                      Way off
                    </button>
                    <button
                      onClick={() => handleRate('hard')}
                      className="flex-1 py-3 rounded-xl bg-[#2a2a2a] hover:bg-[#f59e0b]/20 border border-[#3a3a3a] hover:border-[#f59e0b]/40 text-sm text-[#ccc] hover:text-amber-400 font-medium transition-all"
                    >
                      Partially
                    </button>
                    <button
                      onClick={() => handleRate('easy')}
                      className="flex-1 py-3 rounded-xl bg-[#2a2a2a] hover:bg-[#22c55e]/20 border border-[#3a3a3a] hover:border-[#22c55e]/40 text-sm text-[#ccc] hover:text-green-400 font-medium transition-all"
                    >
                      Nailed it
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
