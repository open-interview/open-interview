import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Undo2 } from 'lucide-react';

interface SnackbarProps {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss: () => void;
  duration?: number;
}

export function Snackbar({ message, actionLabel, onAction, onDismiss, duration = 4000 }: SnackbarProps) {
  useEffect(() => {
    if (!onAction) {
      const timer = setTimeout(onDismiss, duration);
      return () => clearTimeout(timer);
    }
  }, [onAction, duration, onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 100 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg"
      style={{ background: 'var(--surface-3)', border: '1px solid var(--color-border)', minWidth: '300px', maxWidth: '500px' }}
    >
      <span className="flex-1 text-sm" style={{ color: 'var(--text-primary)' }}>{message}</span>
      {actionLabel && onAction && (
        <button
          onClick={() => { onAction(); onDismiss(); }}
          className="px-3 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer"
          style={{ background: 'var(--color-accent-violet)', color: 'var(--btn-primary-text)' }}
        >
          {actionLabel}
        </button>
      )}
      <button onClick={onDismiss} className="p-1 rounded-md hover:bg-white/10 transition-colors cursor-pointer">
        <X className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
      </button>
    </motion.div>
  );
}
