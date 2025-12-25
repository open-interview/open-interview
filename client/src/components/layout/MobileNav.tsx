/**
 * Mobile Bottom Navigation
 * Modern glass-morphism floating design
 */

import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { Compass, Trophy, User, Home, Bookmark } from 'lucide-react';

export function MobileNav() {
  const [location, setLocation] = useLocation();

  const navItems = [
    { id: 'home', icon: Home, label: 'Home', path: '/' },
    { id: 'explore', icon: Compass, label: 'Explore', path: '/channels' },
    { id: 'bookmarks', icon: Bookmark, label: 'Saved', path: '/bookmarks' },
    { id: 'achievements', icon: Trophy, label: 'Progress', path: '/stats' },
    { id: 'profile', icon: User, label: 'Me', path: '/profile' },
  ];

  const isActive = (path?: string) => {
    if (!path) return false;
    if (path === '/') return location === '/';
    return location.startsWith(path);
  };

  return (
    <nav className="fixed bottom-4 left-4 right-4 z-50 lg:hidden pointer-events-none">
      {/* Floating glass pill */}
      <div 
        className="pointer-events-auto mx-auto max-w-md bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/30"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 0px)' }}
      >
        <div className="flex items-stretch justify-around py-2 px-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <button
                key={item.id}
                onClick={() => item.path ? setLocation(item.path) : undefined}
                className={`flex flex-col items-center justify-center py-2 px-3 min-w-[56px] rounded-xl transition-all active:scale-95 ${
                  active ? 'bg-white/10' : 'hover:bg-white/5'
                }`}
              >
                <Icon 
                  className={`w-5 h-5 transition-colors ${
                    active ? 'text-primary' : 'text-white/60'
                  }`}
                  strokeWidth={active ? 2.5 : 1.5}
                />
                <span 
                  className={`text-[10px] mt-1 transition-colors ${
                    active ? 'text-white font-semibold' : 'text-white/50 font-medium'
                  }`}
                >
                  {item.label}
                </span>
                {active && (
                  <motion.div
                    layoutId="mobile-nav-dot"
                    className="w-1 h-1 bg-primary rounded-full mt-1"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
