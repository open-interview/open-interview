import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface Toast {
  id: string;
  message: string;
  action?: { label: string; onClick: () => void };
  duration?: number;
}

type ToastListener = (toast: Toast | null) => void;

let toastQueue: Toast[] = [];
let toastListener: ToastListener | null = null;

function flushQueue() {
  if (toastQueue.length > 0 && toastListener) {
    const next = toastQueue.shift()!;
    toastListener(next);
  }
}

export function addToast(toast: Omit<Toast, 'id'>) {
  const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  toastQueue.push({ ...toast, id });
  if (!toastListener) return id;
  if (toastQueue.length === 1) flushQueue();
  return id;
}

export function ToastQueue() {
  const [current, setCurrent] = useState<Toast | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    toastListener = (toast: Toast | null) => {
      setCurrent(toast);
    };
    return () => { toastListener = null; };
  }, []);

  // When current becomes null, flush next
  useEffect(() => {
    if (!current && toastQueue.length > 0) {
      const next = toastQueue.shift()!;
      const nextTimer = setTimeout(() => {
        setCurrent(null);
      }, next.duration || 4000);
      timerRef.current = nextTimer;
      setCurrent(next);
    }
    return () => clearTimeout(timerRef.current);
  }, [current]);

  const handleDismiss = useCallback(() => {
    clearTimeout(timerRef.current);
    setCurrent(null);
  }, []);

  const handleAction = useCallback((toast: Toast) => {
    toast.action?.onClick();
    handleDismiss();
  }, [handleDismiss]);

  return (
    <div className="fixed bottom-[76px] md:bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none">
      <AnimatePresence mode="wait">
        {current && (
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="pointer-events-auto flex items-center gap-3 px-4 py-2.5 rounded-full bg-[var(--surface-elevated)]/95 backdrop-blur-xl border border-border/20 shadow-xl"
          >
            <span className="text-sm text-foreground">{current.message}</span>
            {current.action && (
              <button
                onClick={() => handleAction(current)}
                className="text-sm font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-wider"
              >
                {current.action.label}
              </button>
            )}
            <button onClick={handleDismiss} className="p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function useBackupReminder() {
  useEffect(() => {
    const lastBackup = localStorage.getItem('oi-last-backup-reminder');
    const now = Date.now();
    if (!lastBackup || now - Number(lastBackup) > 7 * 24 * 60 * 60 * 1000) {
      addToast({
        message: 'Your progress is stored locally. Don\'t forget to backup!',
        action: {
          label: 'Backup Now',
          onClick: () => {
            try {
              const data = {
                version: 2,
                exportedAt: new Date().toISOString(),
                cards: JSON.parse(localStorage.getItem('code-reels-srs') || '{}'),
                fcCards: JSON.parse(localStorage.getItem('code-reels-fc-srs') || '{}'),
                stats: JSON.parse(localStorage.getItem('code-reels-srs-stats') || '{}'),
                liked: JSON.parse(localStorage.getItem('oi-liked-questions') || '[]'),
                bookmarked: JSON.parse(localStorage.getItem('oi-bookmarked-questions') || '[]'),
                settings: JSON.parse(localStorage.getItem('oi-profile-settings') || '{}'),
              };
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
              const a = document.createElement('a');
              a.href = URL.createObjectURL(blob);
              a.download = `code-reels-backup-${new Date().toISOString().split('T')[0]}.json`;
              a.click();
              URL.revokeObjectURL(a.href);
              localStorage.setItem('oi-last-backup-reminder', String(now));
              addToast({ message: 'Backup downloaded!', duration: 2000 });
            } catch {}
          },
        },
        duration: 8000,
      });
      localStorage.setItem('oi-last-backup-reminder', String(now));
    }
  }, []);
}
