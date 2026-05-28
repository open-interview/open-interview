import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, ArrowUp, ArrowDown } from 'lucide-react';

export interface StudyTipsProps {
  onDismiss: () => void;
}

const tips = [
  {
    icon: <ArrowRight className="w-5 h-5" aria-hidden={true} />,
    text: 'Swipe right (→) when you know the answer well',
    color: 'text-green-400',
  },
  {
    icon: <ArrowLeft className="w-5 h-5" aria-hidden={true} />,
    text: 'Swipe left (←) to review again later',
    color: 'text-red-400',
  },
  {
    icon: <ArrowUp className="w-5 h-5" aria-hidden={true} />,
    text: 'Swipe up (↑) to use the Feynman technique',
    color: 'text-amber-400',
  },
  {
    icon: <ArrowDown className="w-5 h-5" aria-hidden={true} />,
    text: 'Swipe down (↓) to skip a card',
    color: 'text-gray-400',
  },
];

export default function StudyTips({ onDismiss }: StudyTipsProps) {
  const handleDismiss = () => {
    localStorage.setItem('oi-study-tips-seen', 'true');
    onDismiss();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      data-pagefind-ignore
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="flex flex-col items-center gap-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-6 max-w-sm mx-4"
      >
        <h2 className="text-lg font-bold text-[var(--fg)]">Study Tips</h2>
        <div className="flex flex-col gap-3 w-full">
          {tips.map((tip) => (
            <div
              key={tip.text}
              className="flex items-center gap-3 rounded-xl bg-[var(--surface-elevated)] px-4 py-3"
            >
              <span className={tip.color}>{tip.icon}</span>
              <span className="text-sm text-[var(--fg-secondary)]">{tip.text}</span>
            </div>
          ))}
        </div>
        <button
          onClick={handleDismiss}
          className="w-full rounded-xl bg-purple-600 hover:bg-purple-700 text-white py-3 font-semibold transition-colors"
        >
          Got it!
        </button>
      </motion.div>
    </motion.div>
  );
}
