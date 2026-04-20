/**
 * Credits Display Component
 * Shows current credit balance in header/nav
 */

import { Coins } from 'lucide-react';
import { useCredits } from '../context/CreditsContext';
import { motion, AnimatePresence } from 'framer-motion';

interface CreditsDisplayProps {
  compact?: boolean;
  onClick?: () => void;
}

export function CreditsDisplay({ compact = false, onClick }: CreditsDisplayProps) {
  const { balance, formatCredits } = useCredits();

  if (compact) {
    return (
      <button
        onClick={onClick}
        className="flex items-center gap-1 px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full hover:bg-amber-500/20 transition-colors"
      >
        <Coins className="w-3.5 h-3.5 text-amber-500" />
        <span className="text-xs font-bold text-amber-500">{formatCredits(balance)}</span>
      </button>
    );
  }

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/20 rounded-lg hover:from-amber-500/20 hover:to-yellow-500/20 transition-colors"
    >
      <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center">
        <Coins className="w-3.5 h-3.5 text-amber-500" />
      </div>
      <div className="text-left">
        <div className="text-xs text-muted-foreground">Credits</div>
        <div className="text-sm font-bold text-amber-500">{formatCredits(balance)}</div>
      </div>
    </motion.button>
  );
}

// Animated credit change splash/bubble
export function CreditSplash({ amount, show, onComplete }: { amount: number; show: boolean; onComplete?: () => void }) {
  const isPositive = amount > 0;

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, x: 20 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.8, x: 20 }}
          transition={{ 
            type: "spring", 
            stiffness: 400, 
            damping: 15
          }}
          className="fixed bottom-24 right-4 z-[100] pointer-events-none"
        >
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
            }}
            transition={{ duration: 0.3, times: [0, 0.5, 1] }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl shadow-lg ${
              isPositive 
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' 
                : 'bg-gradient-to-r from-red-500 to-rose-500 text-white'
            }`}
          >
            <Coins className="w-5 h-5" />
            <span className="text-lg font-bold">
              {isPositive ? '+' : ''}{amount}
            </span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
