/**
 * Gen Z Sidebar - Pure Black, Neon Accents
 * Minimal, modern, addictive
 */

import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { useCredits } from '../../context/CreditsContext';
import {
  Home, BookOpen, Award, Mic, Code, Target, Zap,
  BarChart2, Trophy, Bookmark, Flame, Sparkles, Brain, Coins
} from 'lucide-react';

const navItems = [
  { icon: Home, label: 'Home', path: '/', section: 'main' },
  { icon: BookOpen, label: 'Channels', path: '/channels', section: 'learn' },
  { icon: Award, label: 'Certifications', path: '/certifications', section: 'learn' },
  { icon: Brain, label: 'My Path', path: '/my-path', section: 'learn', badge: 'NEW' },
  { icon: Mic, label: 'Voice', path: '/voice-interview', section: 'practice', credits: '+10' },
  { icon: Code, label: 'Coding', path: '/coding', section: 'practice' },
  { icon: Target, label: 'Tests', path: '/tests', section: 'practice' },
  { icon: Flame, label: 'Review', path: '/review', section: 'practice' },
  { icon: BarChart2, label: 'Stats', path: '/stats', section: 'progress' },
  { icon: Trophy, label: 'Badges', path: '/badges', section: 'progress' },
  { icon: Bookmark, label: 'Saved', path: '/bookmarks', section: 'progress' },
];

export function GenZSidebar() {
  const [location, setLocation] = useLocation();
  const { balance, formatCredits } = useCredits();

  const level = Math.floor(balance / 100);

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-black border-r border-white/10 flex flex-col z-50 hidden lg:flex">
      {/* Logo - Clickable to go home */}
      <button 
        onClick={() => setLocation('/')}
        className="p-6 border-b border-white/10 hover:bg-white/5 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#00ff88] to-[#00d4ff] rounded-[12px] flex items-center justify-center">
            <Brain className="w-6 h-6 text-black" strokeWidth={2.5} />
          </div>
          <div>
            <div className="font-black text-lg">CodeReels</div>
            <div className="text-xs text-[#666]">Interview Prep</div>
          </div>
        </div>
      </button>

      {/* Stats Bar */}
      <div className="p-4 border-b border-white/10 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="text-[#a0a0a0]">Streak</span>
          </div>
          <span className="font-bold">0</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#00ff88]" />
            <span className="text-[#a0a0a0]">XP</span>
          </div>
          <span className="font-bold">{balance}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-purple-400" />
            <span className="text-[#a0a0a0]">Level</span>
          </div>
          <span className="font-bold">{level}</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Home - Special */}
        {navItems.filter(item => item.section === 'main').map((item) => {
          const isActive = location === item.path;
          const Icon = item.icon;
          
          return (
            <motion.button
              key={item.path}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setLocation(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[12px] transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-[#00ff88]/20 to-[#00d4ff]/20 border border-[#00ff88]/30 text-white'
                  : 'hover:bg-white/5 text-[#a0a0a0] hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={2} />
              <span className="font-semibold">{item.label}</span>
            </motion.button>
          );
        })}

        {/* Learn Section */}
        <div>
          <div className="text-xs font-bold text-[#666] uppercase mb-2 px-2">Learn</div>
          <div className="space-y-1">
            {navItems.filter(item => item.section === 'learn').map((item) => {
              const isActive = location === item.path;
              const Icon = item.icon;
              
              return (
                <motion.button
                  key={item.path}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setLocation(item.path)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[12px] transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-[#00ff88]/20 to-[#00d4ff]/20 border border-[#00ff88]/30 text-white'
                      : 'hover:bg-white/5 text-[#a0a0a0] hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" strokeWidth={2} />
                  <span className="font-semibold">{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto px-2 py-0.5 bg-[#00ff88] text-black text-xs font-bold rounded-full">
                      {item.badge}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Practice Section */}
        <div>
          <div className="text-xs font-bold text-[#666] uppercase mb-2 px-2">Practice</div>
          <div className="space-y-1">
            {navItems.filter(item => item.section === 'practice').map((item) => {
              const isActive = location === item.path;
              const Icon = item.icon;
              
              return (
                <motion.button
                  key={item.path}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setLocation(item.path)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[12px] transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-[#00ff88]/20 to-[#00d4ff]/20 border border-[#00ff88]/30 text-white'
                      : 'hover:bg-white/5 text-[#a0a0a0] hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" strokeWidth={2} />
                  <span className="font-semibold">{item.label}</span>
                  {item.credits && (
                    <span className="ml-auto px-2 py-0.5 bg-amber-500/20 text-amber-500 text-xs font-bold rounded-full">
                      {item.credits}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Progress Section */}
        <div>
          <div className="text-xs font-bold text-[#666] uppercase mb-2 px-2">Progress</div>
          <div className="space-y-1">
            {navItems.filter(item => item.section === 'progress').map((item) => {
              const isActive = location === item.path;
              const Icon = item.icon;
              
              return (
                <motion.button
                  key={item.path}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setLocation(item.path)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[12px] transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-[#00ff88]/20 to-[#00d4ff]/20 border border-[#00ff88]/30 text-white'
                      : 'hover:bg-white/5 text-[#a0a0a0] hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" strokeWidth={2} />
                  <span className="font-semibold">{item.label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Credits Footer */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setLocation('/profile')}
        className="m-4 p-4 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30 rounded-[16px] flex items-center gap-3"
      >
        <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-full flex items-center justify-center">
          <Coins className="w-5 h-5 text-black" strokeWidth={2.5} />
        </div>
        <div className="flex-1 text-left">
          <div className="text-xs text-[#a0a0a0]">Credits</div>
          <div className="font-bold">{formatCredits(balance)}</div>
        </div>
      </motion.button>
    </aside>
  );
}
