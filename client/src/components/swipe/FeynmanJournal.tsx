import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { FeynmanAttempt } from '@/types/swipe';

interface FeynmanJournalProps {
  attempts: FeynmanAttempt[];
  onClear: () => void;
}

const ratingConfig = {
  again: { className: 'bg-red-500/20 text-red-400', label: 'Again' },
  hard: { className: 'bg-amber-500/20 text-amber-400', label: 'Hard' },
  easy: { className: 'bg-green-500/20 text-green-400', label: 'Easy' },
} as const;

export function FeynmanJournal({ attempts, onClear }: FeynmanJournalProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const recent = [...attempts].reverse().slice(0, 10);

  if (recent.length === 0) {
    return (
      <div className="bg-[#141414] border border-[#2a2a2a] rounded-lg p-4">
        <p className="text-sm text-gray-400 text-center">
          No Feynman attempts yet. Swipe up on a card to explain it in your own words.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-xs tracking-widest text-gray-500 mb-3 font-mono">
        ── My Feynman Journal ────────
      </h3>

      <div className="space-y-2">
        {recent.map((attempt) => {
          const isOpen = expandedIds.has(attempt.cardId + attempt.timestamp);
          const badge = ratingConfig[attempt.rating];

          return (
            <div
              key={attempt.cardId + attempt.timestamp}
              className="bg-[#141414] border border-[#2a2a2a] rounded-lg p-3"
            >
              <button
                onClick={() => toggle(attempt.cardId + attempt.timestamp)}
                className="flex items-center justify-between w-full text-left"
              >
                <span className="text-sm text-gray-300 font-medium truncate mr-2">
                  {attempt.cardId}
                  {attempt.channel && (
                    <span className="text-gray-500 font-normal ml-2">
                      {attempt.channel}
                    </span>
                  )}
                  <span className="text-gray-500 font-normal ml-2">
                    {new Date(attempt.timestamp).toLocaleDateString()}
                  </span>
                </span>
                {isOpen ? (
                  <ChevronUp className="w-4 h-4 text-gray-500 shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />
                )}
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    key="body"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="pt-3 border-t border-[#2a2a2a] mt-3">
                      <p className="text-sm text-gray-400 leading-relaxed whitespace-pre-wrap">
                        {attempt.attempt}
                      </p>
                      <span
                        className={`inline-block mt-2 text-xs font-medium px-2 py-0.5 rounded ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      <div className="mt-4 text-center">
        <button
          onClick={onClear}
          className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
        >
          Clear journal
        </button>
      </div>
    </div>
  );
}
