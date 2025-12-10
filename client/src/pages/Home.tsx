import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { channels, getQuestions } from '../lib/data';
import { motion } from 'framer-motion';
import { Terminal, Cpu, Database, Layout, ChevronRight, CheckSquare, BarChart2, Palette } from 'lucide-react';
import { useProgress } from '../hooks/use-progress';
import { useTheme } from '../context/ThemeContext';

export default function Home() {
  const [_, setLocation] = useLocation();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { theme, cycleTheme } = useTheme();

  // Keyboard navigation for channels
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        setSelectedIndex((prev) => (prev + 1) % channels.length);
      } else if (e.key === 'ArrowLeft') {
        setSelectedIndex((prev) => (prev - 1 + channels.length) % channels.length);
      } else if (e.key === 'Enter') {
        setLocation(`/channel/${channels[selectedIndex].id}`);
      } else if (e.key.toLowerCase() === 't') {
        cycleTheme();
      } else if (e.key.toLowerCase() === 's') {
        setLocation('/stats');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, setLocation, cycleTheme]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col p-4 md:p-12 font-mono transition-colors duration-300">
      <header className="mb-12 border-b border-border pb-6 flex justify-between items-end">
        <div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tighter uppercase mb-2">
            <span className="text-primary mr-2">&gt;</span>Learn_Reels
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            // SYSTEM.READY<br/>
            // SELECT_MODULE_TO_BEGIN
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-4">
             <button 
               onClick={() => setLocation('/stats')}
               className="text-xs uppercase tracking-widest hover:text-primary flex items-center gap-2 transition-colors"
               title="View Stats [S]"
             >
                <BarChart2 className="w-4 h-4" /> Stats
             </button>
             <button 
               onClick={cycleTheme}
               className="text-xs uppercase tracking-widest hover:text-primary flex items-center gap-2 transition-colors"
               title="Switch Theme [T]"
             >
                <Palette className="w-4 h-4" /> Theme: {theme}
             </button>
          </div>
          <div className="hidden md:block text-right text-xs text-muted-foreground">
            STATUS: ONLINE<br/>
            VERSION: 2.1.0
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full flex-grow">
        {channels.map((channel, index) => {
          const isSelected = index === selectedIndex;
          const { completed } = useProgress(channel.id);
          const channelQuestions = getQuestions(channel.id);
          const progress = Math.round((completed.length / channelQuestions.length) * 100) || 0;

          return (
            <motion.div
              key={channel.id}
              onClick={() => setLocation(`/channel/${channel.id}`)}
              className={`
                relative cursor-pointer border border-border p-6 flex flex-col justify-between
                transition-all duration-200 group bg-card hover:border-primary
                ${isSelected ? 'border-primary ring-1 ring-primary' : ''}
              `}
            >
              <div className="absolute top-2 right-2 text-xs font-bold opacity-30 group-hover:opacity-100">
                [{String(index + 1).padStart(2, '0')}]
              </div>

              <div className="space-y-4">
                <div className={`
                  w-12 h-12 border border-border flex items-center justify-center transition-colors
                  ${isSelected ? 'bg-primary text-primary-foreground border-primary' : 'text-foreground'}
                `}>
                  {channel.id === 'system-design' && <Cpu className="w-6 h-6" />}
                  {channel.id === 'algorithms' && <Terminal className="w-6 h-6" />}
                  {channel.id === 'frontend' && <Layout className="w-6 h-6" />}
                  {channel.id === 'database' && <Database className="w-6 h-6" />}
                </div>
                
                <div>
                  <h2 className="text-2xl font-bold uppercase tracking-tight mb-1">{channel.name}</h2>
                  <p className="text-xs text-muted-foreground font-light">{channel.description}</p>
                </div>
              </div>

              <div className="mt-8 space-y-3">
                <div className="flex justify-between items-center text-xs uppercase tracking-widest">
                  <div className="flex gap-2">
                    <span>Progress</span>
                    <span className="text-muted-foreground">[{completed.length}/{channelQuestions.length}]</span>
                  </div>
                  <span>{progress}%</span>
                </div>
                <div className="w-full h-2 bg-muted relative overflow-hidden">
                  <div 
                    className="absolute top-0 left-0 h-full bg-primary transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                
                <div className={`
                  flex items-center text-primary text-xs font-bold uppercase tracking-widest
                  opacity-0 transition-all duration-200
                  ${isSelected ? 'opacity-100' : 'group-hover:opacity-100'}
                `}>
                  <span className="mr-2">&gt;</span> Execute_Module
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <footer className="mt-12 text-center text-muted-foreground text-xs uppercase tracking-widest">
        Use Arrow Keys to Navigate // 'T' for Theme // 'S' for Stats
      </footer>
    </div>
  );
}
