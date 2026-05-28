import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw } from 'lucide-react';

interface UndoToastProps {
  show: boolean;
  onUndo: () => void;
  onTimeout: () => void;
  duration?: number;
}

export function UndoToast({ show, onUndo, onTimeout, duration = 4000 }: UndoToastProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [animateKey, setAnimateKey] = useState(0);

  useEffect(() => {
    if (show) {
      setAnimateKey(k => k + 1);
      timerRef.current = setTimeout(onTimeout, duration);
    }
    return () => { if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; } };
  }, [show, duration, onTimeout]);

  const handleUndo = () => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    onUndo();
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 80, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 80, opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          className="fixed bottom-24 lg:bottom-8 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="bg-[var(--surface-elevated)]/95 backdrop-blur-xl border border-border/30 rounded-full px-5 py-3 shadow-2xl flex items-center gap-4 relative overflow-hidden">
            <RotateCcw className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-sm text-foreground font-medium">Card swiped</span>
            <button
              onClick={handleUndo}
              className="text-sm font-bold text-indigo-400 hover:text-indigo-300 transition-colors shrink-0 uppercase tracking-wider"
            >
              Undo
            </button>
            <kbd className="hidden sm:inline-flex px-1.5 py-0.5 rounded text-[10px] font-mono bg-accent/50 text-muted-foreground border border-border/20">
              {navigator.platform?.includes('Mac') ? '\u2318Z' : 'Ctrl+Z'}
            </kbd>
            <motion.div
              key={animateKey}
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: duration / 1000, ease: 'linear' }}
              style={{ transformOrigin: 'left' }}
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
