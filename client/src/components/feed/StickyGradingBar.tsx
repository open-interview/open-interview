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
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="bg-[#1d1f23]/95 backdrop-blur-md border border-[var(--tw-border)] rounded-2xl px-4 py-3 shadow-2xl">
            <p className="text-[13px] text-[#71767b] text-center mb-2">How well did you know this?</p>
            <div className="flex items-center justify-center gap-2">
              {ratings.map((r, i) => (
                <motion.button
                  key={r}
                  whileTap={{ scale: 0.92 }}
                  whileHover={{ scale: 1.03 }}
                  onClick={() => onRate(r)}
                  className="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full text-[14px] font-semibold text-[#e7e9ea] hover:bg-[#2f3336] border border-[var(--tw-border)] hover:border-[#71767b] transition-all min-h-[44px]"
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
