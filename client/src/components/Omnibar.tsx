import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import { Search, BookOpen, Layers, User, Hash, ArrowRight, Github } from 'lucide-react';
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
  { id: 'feed',    label: 'Knowledge Feed', icon: BookOpen, path: '/feed' },
  { id: 'study',   label: 'Study Cards',    icon: Layers,   path: '/study' },
  { id: 'profile', label: 'Profile',        icon: User,     path: '/profile' },
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
let fuseQuestionCount = 0;

function getFuse(): Fuse<Question> {
  const questions = getAllQuestions();
  if (!fuseInstance || questions.length !== fuseQuestionCount) {
    fuseQuestionCount = questions.length;
    fuseInstance = new Fuse(questions, {
      keys: [
        { name: 'question', weight: 0.6 },
        { name: 'tags',     weight: 0.3 },
        { name: 'answer',   weight: 0.1 },
      ],
      threshold: 0.35,
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
  const inputRef = useRef<HTMLInputElement>(null);
  const [, setLocation] = useLocation();

  // Keyboard: Cmd+K and /
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((p) => !p);
      }
      if (e.key === '/' && !open) {
        const tag = (e.target as HTMLElement).tagName;
        if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
          e.preventDefault();
          setOpen(true);
        }
      }
      if (e.key === 'Escape' && open) setOpen(false);
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

  const searchResults = useMemo((): PaletteItem[] => {
    if (!query || query.length < 2) return [];
    try {
      const fuse = getFuse();
      return fuse.search(query).slice(0, 5).map(r => ({
        id: r.item.id,
        label: r.item.question,
        type: 'question' as const,
        path: `/feed/${r.item.channel}`,
        icon: Search,
        sub: r.item.channel.replace(/-/g, ' '),
      }));
    } catch {
      return [];
    }
  }, [query]);

  const channelItems = useMemo((): PaletteItem[] =>
    channels.map((ch: Channel) => ({
      id: ch.id,
      label: ch.name,
      type: 'channel' as const,
      path: `/feed/${ch.id}`,
      icon: Hash,
      sub: ch.description,
    })), []);

  const items: PaletteItem[] = useMemo(() => {
    const actionItems = QUICK_ACTIONS.map((a) => ({ ...a, type: 'action' as const }));
    if (!query) return [...actionItems, ...channelItems];

    const ql = query.toLowerCase();
    const filteredActions   = actionItems.filter(i => i.label.toLowerCase().includes(ql));
    const filteredChannels  = channelItems.filter(i =>
      i.label.toLowerCase().includes(ql) || i.sub?.toLowerCase().includes(ql)
    );

    if (searchResults.length > 0) return [...searchResults, ...filteredChannels, ...filteredActions];
    return [...filteredChannels, ...filteredActions];
  }, [query, searchResults, channelItems]);

  const navigate = useCallback((item: PaletteItem) => {
    setOpen(false);
    setLocation(item.path);
  }, [setLocation]);

  const handleKey = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); setSelectedIndex(p => Math.min(p + 1, items.length - 1)); break;
      case 'ArrowUp':   e.preventDefault(); setSelectedIndex(p => Math.max(p - 1, 0)); break;
      case 'Enter':     e.preventDefault(); if (items[selectedIndex]) navigate(items[selectedIndex]); break;
    }
  }, [items, selectedIndex, navigate]);

  return (
    <>
      {/* Inline trigger — lives inside the Layout's sticky header */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-3 w-full max-w-[480px] mx-auto px-4 py-2 rounded-full bg-[#1d1f23] border border-[var(--tw-border)] text-[14px] text-[#71767b] hover:bg-[#2f3336] hover:border-[#71767b] transition-all cursor-pointer"
      >
        <Search className="w-4 h-4 shrink-0" />
        <span className="flex-1 text-left">Search questions, channels...</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#2f3336] border border-[var(--tw-border)]">
          ⌘K
        </kbd>
      </button>

      {/* Modal search overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="fixed inset-0 z-[200] flex items-start justify-center pt-[10vh] bg-black/70 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -12 }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              className="w-full max-w-xl bg-[#16181c] border border-[var(--tw-border)] rounded-2xl shadow-2xl overflow-hidden mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Input */}
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--tw-border)]">
                <Search className="w-5 h-5 text-[#71767b] shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
                  onKeyDown={handleKey}
                  placeholder="Search questions, channels, topics..."
                  className="flex-1 bg-transparent text-[15px] text-[#e7e9ea] placeholder:text-[#71767b] outline-none"
                />
                {query && (
                  <button onClick={() => { setQuery(''); setSelectedIndex(0); }} className="text-[11px] text-[#71767b] hover:text-[#e7e9ea] px-2 py-0.5 rounded border border-[var(--tw-border)] transition-colors">
                    Clear
                  </button>
                )}
                <kbd className="hidden sm:inline-flex px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#2f3336] text-[#71767b] border border-[var(--tw-border)]">ESC</kbd>
              </div>

              {/* Section label */}
              {items.length > 0 && (
                <div className="px-4 pt-2 pb-0.5">
                  <span className="text-[10px] uppercase tracking-widest text-[#71767b] font-semibold">
                    {query ? (searchResults.length > 0 ? 'Questions & Channels' : 'Channels') : 'Quick Navigation'}
                  </span>
                </div>
              )}

              {/* Results list */}
              <div className="max-h-[400px] overflow-y-auto p-2">
                {items.length === 0 ? (
                  <div className="flex flex-col items-center py-10 px-4">
                    <Search className="w-8 h-8 text-[#71767b] mb-3" />
                    <p className="text-[14px] text-[#71767b]">No results for &ldquo;{query}&rdquo;</p>
                    <a
                      href={`https://github.com/open-interview/open-interview/issues/new?title=Suggest: ${encodeURIComponent(query)}&labels=suggestion`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-[#71767b] hover:text-[#e7e9ea] mt-3 transition-colors"
                    >
                      <Github className="w-3.5 h-3.5" />
                      Suggest on GitHub
                    </a>
                  </div>
                ) : items.map((item, i) => {
                  const Icon = item.icon;
                  const sel = i === selectedIndex;
                  return (
                    <button
                      key={`${item.type}-${item.id}`}
                      onClick={() => navigate(item)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                        sel ? 'bg-[#1d1f23] text-[#e7e9ea]' : 'text-[#71767b] hover:text-[#e7e9ea] hover:bg-[#1d1f23]'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        item.type === 'question' ? 'bg-indigo-500/15' : 'bg-[#2f3336]'
                      }`}>
                        <Icon className={`w-3.5 h-3.5 ${item.type === 'question' ? 'text-indigo-400' : 'text-[#71767b]'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-[14px] leading-tight">{item.label}</p>
                        {item.sub && <p className="text-[12px] text-[#71767b] truncate capitalize">{item.sub}</p>}
                      </div>
                      {item.type === 'channel'  && <span className="text-[10px] uppercase tracking-wider text-[#71767b] shrink-0">Channel</span>}
                      {item.type === 'question' && <span className="text-[10px] uppercase tracking-wider text-indigo-400/70 shrink-0">Q&A</span>}
                      {sel && <ArrowRight className="w-3.5 h-3.5 text-[#71767b] shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Footer hints */}
              <div className="px-4 py-2 border-t border-[var(--tw-border)] flex items-center gap-4 text-[11px] text-[#71767b]">
                <span><kbd className="bg-[#2f3336] border border-[var(--tw-border)] rounded px-1 mr-1">↑↓</kbd>navigate</span>
                <span><kbd className="bg-[#2f3336] border border-[var(--tw-border)] rounded px-1 mr-1">↵</kbd>open</span>
                <span><kbd className="bg-[#2f3336] border border-[var(--tw-border)] rounded px-1 mr-1">esc</kbd>close</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
