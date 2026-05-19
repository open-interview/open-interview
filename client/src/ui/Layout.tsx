import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Compass, Brain, Bookmark, User, ArrowLeft, Menu, X, Code2, Zap, Settings } from 'lucide-react';
import { cn } from '../lib/utils';
import { useCredits } from '../context/CreditsContext';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  showBack?: boolean;
  hideNav?: boolean;
  footer?: React.ReactNode;
}

export function Layout({ children, title, showBack, hideNav, footer }: LayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="min-h-screen bg-background text-foreground">
      {!hideNav && <Sidebar />}
      {!showBack && <Header onMenuClick={() => setMenuOpen(true)} />}
      {showBack && (
        <header className="fixed top-0 left-0 right-0 z-40 lg:hidden bg-background/95 border-b border-border/50 safe-top">
          <div className="flex items-center h-14 px-4 gap-3">
            <button aria-label="Go back" onClick={() => window.history.back()} className="w-11 h-11 -ml-2 rounded-xl hover:bg-accent flex items-center justify-center">
              <ArrowLeft className="w-5 h-5" aria-hidden="true" />
            </button>
            {title && <h1 className="text-base font-semibold">{title}</h1>}
          </div>
        </header>
      )}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-lg"
      >
        Skip to main content
      </a>
      <main id="main-content" className={cn('pb-20 lg:pb-0 lg:pl-72 px-4 lg:px-8', !showBack && 'pt-14 lg:pt-0')}>{children}</main>
      {!hideNav && <BottomNav />}
      <MenuDrawer isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      {footer && (
        <div className="fixed bottom-20 left-0 right-0 z-40 lg:static lg:mt-6 bg-background/95 border-t border-border/50 px-4 py-3">
          {footer}
        </div>
      )}
    </div>
  );
}

function BottomNav() {
  const [location, setLocation] = useLocation();
  const items = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Compass, label: 'Explore', path: '/channels' },
    { icon: Brain, label: 'Practice', path: '/practice' },
    { icon: Bookmark, label: 'Saved', path: '/saved' },
    { icon: User, label: 'Me', path: '/profile' },
  ];
  return (
    <nav aria-label="Mobile navigation" className="fixed bottom-0 left-0 right-0 z-50 lg:hidden safe-bottom">
      <div className="bg-background/95 backdrop-blur border-t border-border/50 px-2 pt-2 pb-[max(8px,env(safe-area-inset-bottom))]">
        <div className="flex justify-around max-w-lg mx-auto">
          {items.map(({ icon: Icon, label, path }) => {
            const active = location === path;
            return (
              <button
                key={path}
                aria-current={active ? 'page' : undefined}
                onClick={() => setLocation(path)}
                className={cn('flex flex-col items-center py-2 px-4 min-w-[80px] min-h-[44px] rounded-xl transition-all', active ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:bg-accent')}
              >
                <Icon className={cn('w-6 h-6', active && 'scale-110')} aria-hidden="true" />
                <span className="text-[11px] mt-1 font-medium">{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

function Sidebar() {
  const [location, setLocation] = useLocation();
  const { balance, formatCredits } = useCredits();
  const items = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Compass, label: 'Explore', path: '/channels' },
    { icon: Brain, label: 'Practice', path: '/practice' },
    { icon: Bookmark, label: 'Saved', path: '/saved' },
  ];
  return (
    <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-72 bg-background border-r border-border/50 z-40">
      <div className="flex flex-col w-full h-full p-6">
        <button onClick={() => setLocation('/')} className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Code2 className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="font-bold text-xl">App</span>
        </button>
        <nav aria-label="Main navigation" className="flex-1 space-y-1">
          {items.map(({ icon: Icon, label, path }) => (
            <button
              key={path}
              aria-current={location === path ? 'page' : undefined}
              onClick={() => setLocation(path)}
              className={cn('w-full flex items-center gap-3 px-4 py-3 rounded-xl', location === path ? 'bg-primary text-primary-foreground font-medium' : 'hover:bg-accent text-muted-foreground')}
            >
              <Icon className="w-5 h-5" aria-hidden="true" />
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <button aria-label="View profile" onClick={() => setLocation('/profile')} className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent border-t border-border/50 mt-4">
          <div className="w-10 h-10 rounded-full bg-primary/50 flex items-center justify-center">
            <User className="w-5 h-5 text-primary-foreground" aria-hidden="true" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-medium text-sm">Profile</p>
            <p className="text-xs text-amber-500 flex items-center gap-1"><Zap className="w-3 h-3" aria-hidden="true" />{formatCredits(balance)}</p>
          </div>
          <Settings className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
}

function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const [location, setLocation] = useLocation();
  const { balance, formatCredits } = useCredits();
  return (
    <header className="fixed top-0 left-0 right-0 z-40 lg:hidden bg-background/95 backdrop-blur border-b border-border/50 safe-top">
      <div className="flex items-center h-14 px-4 gap-3">
        <button onClick={() => setLocation('/')} className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center"><Code2 className="w-5 h-5 text-primary-foreground" aria-hidden="true" /></div>
          <span className="font-bold text-lg">App</span>
        </button>
        <div className="flex-1" />
        <button onClick={() => setLocation('/profile')} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" aria-hidden="true" />
          <span className="text-xs font-bold text-amber-500">{formatCredits(balance)}</span>
        </button>
        <button aria-label="Open menu" onClick={onMenuClick} className="w-11 h-11 rounded-xl hover:bg-accent flex items-center justify-center"><Menu className="w-5 h-5" aria-hidden="true" /></button>
      </div>
    </header>
  );
}

function MenuDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [location, setLocation] = useLocation();
  const items = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Compass, label: 'Explore', path: '/channels' },
    { icon: Brain, label: 'Practice', path: '/practice' },
    { icon: Bookmark, label: 'Saved', path: '/saved' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-50 bg-black/60 lg:hidden" />
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring' as const, damping: 25, stiffness: 200 }} className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-sm bg-background border-l border-border/50 lg:hidden">
            <div className="flex items-center justify-between p-4 border-b border-border/50 safe-top">
              <h2 className="text-lg font-semibold">Menu</h2>
              <button aria-label="Close menu" onClick={onClose} className="w-11 h-11 rounded-xl hover:bg-accent flex items-center justify-center"><X className="w-5 h-5" aria-hidden="true" /></button>
            </div>
            <div className="p-2">
              {items.map(({ icon: Icon, label, path }) => (
                <button
                  key={path}
                  aria-current={location === path ? 'page' : undefined}
                  onClick={() => { setLocation(path); onClose(); }}
                  className={cn('w-full flex items-center gap-3 px-3 py-3 min-h-[44px] rounded-xl', location === path ? 'bg-primary/10 text-primary' : 'hover:bg-accent')}
                >
                  <Icon className="w-5 h-5" aria-hidden="true" />
                  <span className="font-medium">{label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
