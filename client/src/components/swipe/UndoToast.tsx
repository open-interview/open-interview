import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface UndoToastProps {
  show: boolean;
  onUndo: () => void;
  onTimeout: () => void;
  duration?: number;
}

export function UndoToast({
  show,
  onUndo,
  onTimeout,
  duration = 4000,
}: UndoToastProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRef = useRef(false);
  const [animateKey, setAnimateKey] = useState(0);

  useEffect(() => {
    if (show && !activeRef.current) {
      activeRef.current = true;
      setAnimateKey(k => k + 1);
      timerRef.current = setTimeout(onTimeout, duration);
    }
    if (!show) {
      activeRef.current = false;
    }
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [show, duration, onTimeout]);

  const handleUndo = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    activeRef.current = false;
    onUndo();
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="bg-[#141414]/90 backdrop-blur-md border border-[#2a2a2a] rounded-xl px-4 py-3 shadow-lg flex items-center gap-4 min-w-[200px] relative overflow-hidden">
            <span className="text-sm text-white flex-1">Card swiped</span>
            <button
              onClick={handleUndo}
              className="text-sm font-semibold text-purple-400 hover:text-purple-300 transition-colors"
            >
              Undo
            </button>
            <motion.div
              key={animateKey}
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: duration / 1000, ease: 'linear' }}
              style={{ transformOrigin: 'left' }}
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500/70 rounded-full"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
