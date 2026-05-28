import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import { Search, BookOpen, User, Hash, ArrowRight } from 'lucide-react';
import type { Channel } from '@/lib/data';
import { channels } from '@/lib/data';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { id: 'study', label: 'Study', icon: BookOpen, path: '/study' },
  { id: 'profile', label: 'Profile', icon: User, path: '/profile' },
];

interface PaletteItem {
  id: string;
  label: string;
  type: 'channel' | 'action';
  path: string;
  icon: React.ElementType;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((p) => !p);
      }
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const items: PaletteItem[] = [
    ...QUICK_ACTIONS.map((a) => ({ ...a, type: 'action' as const })),
    ...channels.map((ch: Channel) => ({
      id: ch.id,
      label: ch.name,
      type: 'channel' as const,
      path: `/study/${ch.id}`,
      icon: Hash,
    })),
  ];

  const filtered = query
    ? items.filter((i) => i.label.toLowerCase().includes(query.toLowerCase()))
    : items;

  const navigate = useCallback(
    (item: PaletteItem) => {
      setOpen(false);
      setLocation(item.path);
    },
    [setLocation],
  );

  const handleKey = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((p) => Math.min(p + 1, filtered.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((p) => Math.max(p - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (filtered[selectedIndex]) navigate(filtered[selectedIndex]);
          break;
      }
    },
    [filtered, selectedIndex, navigate],
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] bg-black/70 backdrop-blur-md"
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="w-full max-w-lg bg-[var(--surface-raised)] border border-border/30 rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border/20">
              <Search className="w-5 h-5 text-muted-foreground shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
                onKeyDown={handleKey}
                placeholder="Search channels or navigate..."
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 outline-none border-none"
              />
              <kbd className="hidden sm:inline-flex px-1.5 py-0.5 rounded text-[10px] font-mono bg-accent/50 text-muted-foreground border border-border/20">
                ESC
              </kbd>
            </div>

            <div className="max-h-[300px] overflow-y-auto p-2 space-y-0.5">
              {filtered.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">No results for "{query}"</p>
              )}
              {filtered.map((item, i) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => navigate(item)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm transition-all duration-150 ${
                      i === selectedIndex
                        ? 'bg-violet-500/15 text-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/30'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.type === 'channel' && (
                      <span className="text-[10px] uppercase tracking-wider text-violet-400/60 font-medium">Channel</span>
                    )}
                    {i === selectedIndex && <ArrowRight className="w-3.5 h-3.5 text-violet-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
