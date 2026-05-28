import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Brain } from 'lucide-react';
import type { FeynmanAttempt } from '@/types/swipe';

interface FeynmanJournalProps {
  attempts: FeynmanAttempt[];
  onClear: () => void;
}

const ratingConfig = {
  again: { className: 'bg-rose-500/15 text-rose-300 border border-rose-500/20', label: 'Again' },
  hard: { className: 'bg-amber-500/15 text-amber-300 border border-amber-500/20', label: 'Hard' },
  easy: { className: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20', label: 'Easy' },
} as const;

export function FeynmanJournal({ attempts, onClear }: FeynmanJournalProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const recent = [...attempts].reverse().slice(0, 10);

  if (recent.length === 0) {
    return (
      <div className="rounded-xl border border-border/20 p-6 text-center bg-gradient-to-br from-[var(--surface-raised)] to-[var(--surface-elevated)]">
        <Brain className="w-8 h-8 text-muted-foreground mx-auto mb-3" aria-hidden={true} />
        <p className="text-sm text-muted-foreground">No Feynman attempts yet.</p>
        <p className="text-xs text-muted-foreground/60 mt-1">Swipe up on a card to explain it in your own words.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {recent.map((attempt) => {
        const key = attempt.cardId + attempt.timestamp;
        const isOpen = expandedIds.has(key);
        const badge = ratingConfig[attempt.rating];

        return (
          <div key={key} className="rounded-xl border border-border/20 overflow-hidden bg-gradient-to-br from-[var(--surface-raised)] to-[var(--surface-elevated)]">
            <button onClick={() => toggle(key)} className="flex items-center justify-between w-full text-left px-4 py-3 hover:bg-accent/30 transition-colors">
              <span className="text-sm text-foreground font-medium truncate mr-2 flex-1">
                {attempt.channel && (
                  <span className="text-muted-foreground font-normal text-xs mr-2">{attempt.channel}</span>
                )}
                <span className="text-muted-foreground font-normal text-xs">
                  {new Date(attempt.timestamp).toLocaleDateString()}
                </span>
              </span>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badge.className}`}>
                  {badge.label}
                </span>
                {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" aria-hidden={true} /> : <ChevronDown className="w-4 h-4 text-muted-foreground" aria-hidden={true} />}
              </div>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div key="body" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2, ease: 'easeInOut' }} className="overflow-hidden">
                  <div className="px-4 pb-4 pt-2 border-t border-border/20">
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{attempt.attempt}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
      <div className="text-center pt-2">
        <button onClick={onClear} className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors font-medium">
          Clear journal
        </button>
      </div>
    </div>
  );
}
