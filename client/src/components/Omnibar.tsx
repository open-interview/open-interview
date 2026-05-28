import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import { Search, BookOpen, User, Hash, ArrowRight, Github } from 'lucide-react';
import Fuse from 'fuse.js';
import type { Question } from '@/types';
import { getAllQuestions } from '@/lib/questions-loader';
import { channels } from '@/lib/data';
import type { Channel } from '@/lib/data';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { id: 'feed', label: 'Knowledge Feed', icon: BookOpen, path: '/feed' },
  { id: 'profile', label: 'Profile', icon: User, path: '/profile' },
];

interface PaletteItem {
  id: string;
  label: string;
  type: 'channel' | 'action' | 'question';
  path: string;
  icon: React.ElementType;
  sub?: string;
}

let fuseInstance: Fuse<Question> | null = null;

function getFuse(): Fuse<Question> {
  if (!fuseInstance) {
    const questions = getAllQuestions();
    fuseInstance = new Fuse(questions, {
      keys: [
        { name: 'question', weight: 0.5 },
        { name: 'answer', weight: 0.3 },
        { name: 'tags', weight: 0.2 },
      ],
      threshold: 0.4,
      includeScore: true,
      minMatchCharLength: 2,
    });
  }
  return fuseInstance;
}

export function Omnibar() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const [, setLocation] = useLocation();
  const lastScrollY = useRef(0);

  // Auto-hide on scroll
  useEffect(() => {
    const handler = () => {
      const currentY = window.scrollY;
      if (currentY > lastScrollY.current && currentY > 80) {
        setVisible(false);
      } else {
        setVisible(true);
      }
      lastScrollY.current = currentY;
    };
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Keyboard: / and Cmd+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((p) => !p);
      }
      if (e.key === '/' && !open) {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && target.tagName !== 'CODE') {
          e.preventDefault();
          setOpen(true);
        }
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

  const searchResults = useMemo(() => {
    if (!query || query.length < 2) return [];
    try {
      const fuse = getFuse();
      const results = fuse.search(query);
      return results.slice(0, 6).map(r => ({
        id: r.item.id,
        label: r.item.question,
        type: 'question' as const,
        path: `/feed/${r.item.channel}`,
        icon: Search,
        sub: r.item.channel,
        score: r.score,
      }));
    } catch {
      return [];
    }
  }, [query]);

  // Always show channels/actions (filtered) + search results
  const items: PaletteItem[] = useMemo(() => {
    const base: PaletteItem[] = [
      ...QUICK_ACTIONS.map((a) => ({ ...a, type: 'action' as const })),
      ...channels.map((ch: Channel) => ({
        id: ch.id,
        label: ch.name,
        type: 'channel' as const,
        path: `/feed/${ch.id}`,
        icon: Hash,
        sub: ch.description,
      })),
    ];

    if (!query) return base;

    const ql = query.toLowerCase();
    const filtered = base.filter((i) => i.label.toLowerCase().includes(ql) || i.sub?.toLowerCase().includes(ql));

    // Interleave search results
    if (searchResults.length > 0) {
      return [...searchResults as PaletteItem[], ...filtered];
    }

    return filtered;
  }, [query, searchResults]);

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
          setSelectedIndex((p) => Math.min(p + 1, items.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((p) => Math.max(p - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (items[selectedIndex]) navigate(items[selectedIndex]);
          break;
      }
    },
    [items, selectedIndex, navigate],
  );

  return (
    <>
      {/* Floating pill — auto-hides on scroll down */}
      <motion.button
        animate={{ y: visible ? 0 : -100, opacity: visible ? 1 : 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        onClick={() => setOpen(true)}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-5 py-2.5 rounded-full bg-[var(--surface-elevated)]/85 backdrop-blur-xl border border-border/20 shadow-lg hover:shadow-xl hover:bg-[var(--surface-elevated)] transition-all cursor-pointer"
        style={{ width: 'min(480px, calc(100vw - 32px))' }}
      >
        <Search className="w-4 h-4 text-muted-foreground shrink-0" />
        <span className="text-sm text-muted-foreground/70 flex-1 text-left">Search questions, channels...</span>
        <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono bg-accent/50 text-muted-foreground border border-border/20">
          <span>⌘</span>K
        </kbd>
      </motion.button>

      {/* Modal search overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -20 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="w-full max-w-xl bg-[var(--surface-raised)] border border-border/30 rounded-3xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 px-5 py-4 border-b border-border/20">
                <Search className="w-5 h-5 text-muted-foreground shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
                  onKeyDown={handleKey}
                  placeholder="Search questions, channels, concepts..."
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 outline-none border-none"
                />
                <kbd className="hidden sm:inline-flex px-1.5 py-0.5 rounded text-[10px] font-mono bg-accent/50 text-muted-foreground border border-border/20">
                  ESC
                </kbd>
              </div>

              <div className="max-h-[380px] overflow-y-auto p-2 space-y-0.5">
                {items.length === 0 && (
                  <div className="flex flex-col items-center py-10 px-4">
                    <div className="w-12 h-12 rounded-2xl bg-accent/30 flex items-center justify-center mb-3">
                      <Search className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">No results for &ldquo;{query}&rdquo;</p>
                    <a
                      href={`https://github.com/open-interview/open-interview/issues/new?title=Suggest: ${encodeURIComponent(query)}&labels=suggestion`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors mt-2"
                    >
                      <Github className="w-3.5 h-3.5" />
                      Suggest this topic on GitHub
                    </a>
                  </div>
                )}
                {items.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={`${item.type}-${item.id}`}
                      onClick={() => navigate(item)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm transition-all duration-150 ${
                        i === selectedIndex
                          ? 'bg-primary/10 text-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent/30'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.type === 'question' && item.sub && (
                        <span className="text-[10px] font-mono text-primary/50 truncate max-w-[100px]">{item.sub}</span>
                      )}
                      {item.type === 'channel' && (
                        <span className="text-[10px] uppercase tracking-wider text-primary/50 font-medium">Channel</span>
                      )}
                      {i === selectedIndex && <ArrowRight className="w-3.5 h-3.5 text-primary shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
