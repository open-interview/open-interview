import { motion, AnimatePresence } from 'framer-motion';

interface StickyGradingBarProps {
  questionId: string;
  show: boolean;
  onRate: (rating: 'again' | 'hard' | 'good' | 'easy') => void;
}

const ratings = ['again', 'hard', 'good', 'easy'] as const;
const labels = ['Again', 'Hard', 'Good', 'Easy'];
const colors = ['text-rose-400', 'text-amber-400', 'text-emerald-400', 'text-cyan-400'];

export function StickyGradingBar({ show, onRate }: StickyGradingBarProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="mt-4 mb-2"
        >
          <div className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-2xl px-4 py-3">
            <p className="text-[13px] text-[var(--fg-secondary)] text-center mb-2">How well did you know this?</p>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {ratings.map((r, i) => (
                <motion.button
                  key={r}
                  whileTap={{ scale: 0.92 }}
                  whileHover={{ scale: 1.03 }}
                  onClick={() => onRate(r)}
                  className="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full text-[14px] font-semibold text-[var(--fg)] hover:bg-[var(--border)] border border-[var(--border)] hover:border-[var(--fg-muted)] transition-all min-h-[44px]"
                >
                  <span className={colors[i]}>{labels[i]}</span>
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
