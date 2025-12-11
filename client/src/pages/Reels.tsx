import { useState, useEffect, useRef } from 'react';
import { useLocation, useRoute } from 'wouter';
import { channels, getQuestions, getChannel } from '../lib/data';
import { motion, AnimatePresence } from 'framer-motion';
import { Mermaid } from '../components/Mermaid';
import { ArrowLeft, ArrowRight, Share2, Terminal, Home, ChevronRight, Hash, ChevronDown, Check, Settings, Timer, Clock } from 'lucide-react';
import { useProgress } from '../hooks/use-progress';
import { useToast } from '@/hooks/use-toast';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Popover from '@radix-ui/react-popover';
import * as Switch from '@radix-ui/react-switch';
import * as Slider from '@radix-ui/react-slider';

export default function Reels() {
  const [location, setLocation] = useLocation();
  const [match, params] = useRoute('/channel/:id/:index?');
  const channelId = params?.id;
  const paramIndex = params?.index ? parseInt(params.index) : 0;
  
  const channel = getChannel(channelId || '');
  
  const [selectedSubChannel, setSelectedSubChannel] = useState('all');
  const channelQuestions = getQuestions(channelId || '', selectedSubChannel);
  
  const { completed, markCompleted, lastVisitedIndex, saveLastVisitedIndex } = useProgress(channelId || '');
  const { toast } = useToast();

  const [currentIndex, setCurrentIndex] = useState(paramIndex);
  const [showAnswer, setShowAnswer] = useState(false);
  const [timerEnabled, setTimerEnabled] = useState(true);
  const [timerDuration, setTimerDuration] = useState(60);
  const [timeLeft, setTimeLeft] = useState(timerDuration);
  const [isActive, setIsActive] = useState(true);

  // Load timer settings
  useEffect(() => {
    const savedTimerEnabled = localStorage.getItem('timer-enabled');
    const savedTimerDuration = localStorage.getItem('timer-duration');
    if (savedTimerEnabled !== null) setTimerEnabled(savedTimerEnabled === 'true');
    if (savedTimerDuration !== null) setTimerDuration(parseInt(savedTimerDuration));
  }, []);

  // Save timer settings
  const handleTimerEnabledChange = (enabled: boolean) => {
    setTimerEnabled(enabled);
    localStorage.setItem('timer-enabled', String(enabled));
  };

  const handleTimerDurationChange = (value: number[]) => {
    const duration = value[0];
    setTimerDuration(duration);
    setTimeLeft(duration);
    localStorage.setItem('timer-duration', String(duration));
  };

  // Sync state with URL params
  useEffect(() => {
    // If index is out of bounds for current filter, reset to 0
    if (paramIndex >= channelQuestions.length && channelQuestions.length > 0) {
       setCurrentIndex(0);
    } else if (!isNaN(paramIndex) && paramIndex >= 0) {
      setCurrentIndex(paramIndex);
    } else if (lastVisitedIndex > 0 && lastVisitedIndex < channelQuestions.length) {
       // Restore last visited index if no param provided (or invalid)
       setCurrentIndex(lastVisitedIndex);
       // Update URL to match
       setLocation(`/channel/${channelId}/${lastVisitedIndex}`, { replace: true });
    }
  }, [paramIndex, channelQuestions.length, lastVisitedIndex]);

  // Update URL when index changes
  useEffect(() => {
    if (channelId && currentIndex !== paramIndex) {
      setLocation(`/channel/${channelId}/${currentIndex}`, { replace: true });
      saveLastVisitedIndex(currentIndex);
    }
  }, [currentIndex, channelId, setLocation, paramIndex]);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && timeLeft > 0 && !showAnswer && timerEnabled) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && timerEnabled) {
      setShowAnswer(true);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, showAnswer, timerEnabled]);

  // Reset state when index changes
  useEffect(() => {
    // If timer is disabled, show answer directly
    setShowAnswer(!timerEnabled);
    setTimeLeft(timerDuration);
    setIsActive(true);
  }, [currentIndex, timerDuration, timerEnabled]);

  // When timer is toggled off, show answer immediately
  useEffect(() => {
    if (!timerEnabled) {
      setShowAnswer(true);
    }
  }, [timerEnabled]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        nextQuestion();
      } else if (e.key === 'ArrowUp') {
        prevQuestion();
      } else if (e.key === 'ArrowRight') {
        if (!showAnswer) {
          setShowAnswer(true);
          markCompleted(channelQuestions[currentIndex].id);
        }
      } else if (e.key === 'ArrowLeft') {
        setLocation('/');
      } else if (e.key === 'Escape') {
        setLocation('/');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, showAnswer, channelQuestions.length]);

  const nextQuestion = () => {
    if (currentIndex < channelQuestions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const prevQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "LINK_COPIED",
      description: "URL saved to clipboard.",
    });
  };

  if (!channel) return (
    <div className="h-screen flex items-center justify-center font-mono text-white">
      ERR: MODULE_NOT_FOUND
    </div>
  );

  const currentQuestion = channelQuestions[currentIndex];
  // Handle case where filter returns no questions
  if (!currentQuestion) {
     return (
        <div className="h-screen w-full bg-black text-white flex flex-col font-mono">
            <div className="p-4 border-b border-white/10 flex justify-between items-center">
                 <button onClick={() => setLocation('/')} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest hover:text-primary">
                    <span className="border border-white/20 p-1 px-2">ESC</span> Home
                 </button>
                 {channel.subChannels && (
                    <DropdownMenu.Root>
                        <DropdownMenu.Trigger className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest hover:text-primary outline-none">
                            Topic: {channel.subChannels.find(s => s.id === selectedSubChannel)?.name} <ChevronDown className="w-3 h-3" />
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Content className="bg-black border border-white/20 p-1 z-50 min-w-[200px]" align="end">
                            {channel.subChannels.map(sub => (
                                <DropdownMenu.Item 
                                    key={sub.id} 
                                    className="text-xs text-white p-2 hover:bg-white/10 cursor-pointer flex justify-between outline-none"
                                    onSelect={() => {
                                        setSelectedSubChannel(sub.id);
                                        setCurrentIndex(0);
                                    }}
                                >
                                    {sub.name}
                                    {selectedSubChannel === sub.id && <Check className="w-3 h-3" />}
                                </DropdownMenu.Item>
                            ))}
                        </DropdownMenu.Content>
                    </DropdownMenu.Root>
                 )}
            </div>
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-white/50">
                    <div className="text-xl mb-2">NO_DATA_FOUND</div>
                    <div className="text-xs">Try selecting a different topic</div>
                </div>
            </div>
        </div>
     )
  }

  const isCompleted = completed.includes(currentQuestion.id);

  // Helper to detect code blocks in explanation
  const renderExplanation = (text: string) => {
    // Simple split by code blocks ```code```
    const parts = text.split(/(```[\s\S]*?```)/g);
    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const content = part.slice(3, -3).replace(/^[a-z]+\n/, ''); // remove language hint if any for now
        // Try to extract language
        const match = part.match(/^```([a-z]+)\n/);
        const lang = match ? match[1] : 'text';
        
        return (
          <div key={index} className="my-4 rounded overflow-hidden border border-white/10 text-xs">
            <SyntaxHighlighter language={lang} style={vscDarkPlus} customStyle={{ margin: 0, padding: '1rem', background: '#0a0a0a' }}>
              {content}
            </SyntaxHighlighter>
          </div>
        );
      }
      // Render standard text with newlines
      return <div key={index} className="whitespace-pre-wrap mb-4">{part}</div>;
    });
  };

  return (
    <div className="h-screen w-full bg-black text-white overflow-hidden flex font-mono">
      {/* Top Navigation Bar */}
      <div className="absolute top-0 left-0 w-full h-12 sm:h-14 px-2 sm:px-4 z-50 flex justify-between items-center border-b border-white/10 bg-black/80 backdrop-blur-md">
        <div className="flex items-center gap-2 sm:gap-6 min-w-0 flex-1">
          <button 
            onClick={() => setLocation('/')}
            className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest hover:text-primary transition-colors group shrink-0"
          >
            <span className="border border-white/20 px-1.5 sm:px-2 py-0.5 sm:py-1 group-hover:border-primary transition-colors">ESC</span> 
            <span className="hidden sm:inline">Home</span>
          </button>
          
          <div className="h-4 w-px bg-white/20 hidden sm:block shrink-0" />
          
          <div className="flex items-center gap-1 sm:gap-2 min-w-0 overflow-hidden">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-primary truncate">{channel.name}</span>
              
              {channel.subChannels && (
                <>
                    <ChevronRight className="w-3 h-3 text-white/30 shrink-0 hidden sm:block" />
                    <DropdownMenu.Root>
                        <DropdownMenu.Trigger className="flex items-center gap-1 text-[10px] sm:text-xs font-bold uppercase tracking-widest hover:text-white text-white/70 outline-none min-w-0">
                            <span className="truncate max-w-[60px] sm:max-w-none">{channel.subChannels.find(s => s.id === selectedSubChannel)?.name}</span>
                            <ChevronDown className="w-3 h-3 opacity-50 shrink-0" />
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Content className="bg-black border border-white/20 p-1 z-50 min-w-[180px] sm:min-w-[200px] shadow-xl animate-in fade-in zoom-in-95 duration-100" align="start">
                            {channel.subChannels.map(sub => (
                                <DropdownMenu.Item 
                                    key={sub.id} 
                                    className="text-[11px] sm:text-xs text-white p-2 hover:bg-white/10 cursor-pointer flex justify-between outline-none data-[highlighted]:bg-white/10"
                                    onSelect={() => {
                                        setSelectedSubChannel(sub.id);
                                        setCurrentIndex(0);
                                    }}
                                >
                                    {sub.name}
                                    {selectedSubChannel === sub.id && <Check className="w-3 h-3 text-primary" />}
                                </DropdownMenu.Item>
                            ))}
                        </DropdownMenu.Content>
                    </DropdownMenu.Root>
                </>
              )}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <div className="flex gap-1 sm:gap-2 mr-1 sm:mr-4">
            <button 
                onClick={prevQuestion}
                disabled={currentIndex === 0}
                className="p-1 sm:p-1.5 hover:bg-white/10 border border-white/10 rounded disabled:opacity-30 transition-colors"
                title="Previous Question"
            >
                <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
            <button 
                onClick={nextQuestion}
                disabled={currentIndex === channelQuestions.length - 1}
                className="p-1 sm:p-1.5 hover:bg-white/10 border border-white/10 rounded disabled:opacity-30 transition-colors"
                title="Next Question"
            >
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          </div>

          <span className="text-[10px] sm:text-xs font-mono text-white/50">
            {String(currentIndex + 1).padStart(2, '0')} / {String(channelQuestions.length).padStart(2, '0')}
          </span>

          {/* Timer Toggle in Top Bar - Hidden on mobile */}
          <div className="hidden sm:flex items-center gap-2 border-l border-white/10 pl-4">
            <Timer className={`w-4 h-4 ${timerEnabled ? 'text-primary' : 'text-white/30'}`} />
            <Switch.Root 
              checked={timerEnabled}
              onCheckedChange={handleTimerEnabledChange}
              className="w-[36px] h-[20px] bg-white/10 rounded-full relative data-[state=checked]:bg-primary outline-none cursor-pointer"
              title={timerEnabled ? "Disable Timer" : "Enable Timer"}
            >
              <Switch.Thumb className="block w-[16px] h-[16px] bg-white rounded-full transition-transform duration-100 translate-x-0.5 will-change-transform data-[state=checked]:translate-x-[17px]" />
            </Switch.Root>
          </div>

          {/* Timer Settings Popover */}
          <Popover.Root>
            <Popover.Trigger asChild>
              <button 
                className="hover:text-primary transition-colors flex items-center gap-1 sm:gap-2"
                title="Timer Settings"
              >
                {timerEnabled ? (
                   <span className="font-mono text-[10px] sm:text-xs text-primary">{String(timeLeft).padStart(2, '0')}s</span>
                ) : (
                   <span className="text-[10px] sm:text-xs text-white/30">OFF</span>
                )}
              </button>
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content className="bg-black border border-white/20 p-3 sm:p-4 w-64 sm:w-72 z-50 shadow-xl animate-in fade-in zoom-in-95 duration-100" sideOffset={5}>
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-white/70" htmlFor="timer-toggle">
                      Enable Timer
                    </label>
                    <Switch.Root 
                      id="timer-toggle"
                      checked={timerEnabled}
                      onCheckedChange={handleTimerEnabledChange}
                      className="w-[36px] sm:w-[42px] h-[20px] sm:h-[25px] bg-white/10 rounded-full relative data-[state=checked]:bg-primary outline-none cursor-default"
                    >
                      <Switch.Thumb className="block w-[16px] sm:w-[21px] h-[16px] sm:h-[21px] bg-white rounded-full transition-transform duration-100 translate-x-0.5 will-change-transform data-[state=checked]:translate-x-[17px] sm:data-[state=checked]:translate-x-[19px]" />
                    </Switch.Root>
                  </div>

                  <div className={`space-y-2 sm:space-y-3 ${!timerEnabled ? 'opacity-30 pointer-events-none' : ''}`}>
                    <div className="flex justify-between">
                      <label className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-white/70">
                        Duration
                      </label>
                      <span className="text-[10px] sm:text-xs font-mono text-primary">{timerDuration}s</span>
                    </div>
                    <Slider.Root 
                      className="relative flex items-center select-none touch-none w-full h-5"
                      defaultValue={[timerDuration]}
                      max={300}
                      min={10}
                      step={10}
                      onValueChange={handleTimerDurationChange}
                      disabled={!timerEnabled}
                    >
                      <Slider.Track className="bg-white/10 relative grow rounded-full h-[3px]">
                        <Slider.Range className="absolute bg-primary rounded-full h-full" />
                      </Slider.Track>
                      <Slider.Thumb className="block w-4 h-4 bg-white rounded-full hover:bg-primary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors" />
                    </Slider.Root>
                    <div className="flex justify-between text-[9px] sm:text-[10px] text-white/30">
                      <span>10s</span>
                      <span>300s</span>
                    </div>
                  </div>
                </div>
                <Popover.Arrow className="fill-white/20" />
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>

          <button 
            onClick={handleShare}
            className="hover:text-primary transition-colors"
          >
            <Share2 className="w-3 h-3 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Area - Split View */}
      <div className="flex-1 w-full flex flex-col md:flex-row pt-14 pb-10 overflow-hidden">
        <AnimatePresence mode="wait" custom={currentIndex}>
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full flex flex-col md:flex-row overflow-hidden"
          >
            {/* Left Panel: Question */}
            <div className="w-full md:w-[30%] min-h-[30vh] md:min-h-0 md:h-full p-4 sm:p-6 md:p-8 flex flex-col justify-center border-b md:border-b-0 md:border-r border-white/10 relative shrink-0">
               <div className="absolute top-4 left-4 sm:top-6 sm:left-6 md:top-8 md:left-8 flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-widest opacity-70">
                 <Hash className="w-3 h-3" />
                 ID: {currentQuestion.id}
               </div>

               <div className="flex-1 flex flex-col justify-center space-y-4 sm:space-y-6 max-w-2xl mx-auto w-full pt-8 md:pt-0">
                  <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold leading-tight tracking-tight">
                    {currentQuestion.question}
                  </h1>

                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {currentQuestion.tags.map(tag => (
                      <span key={tag} className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-white/5 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest border border-white/10 text-white/60">
                        #{tag}
                      </span>
                    ))}
                  </div>

                  {/* Timer Display (Large) */}
                  {!showAnswer && timerEnabled && (
                    <div className="border-l-2 border-primary pl-3 sm:pl-4 py-2 opacity-80">
                       <div className="text-[9px] sm:text-[10px] text-white/50 mb-1 tracking-widest uppercase">Time Remaining</div>
                       <div className="text-lg sm:text-xl font-mono">{String(timeLeft).padStart(2, '0')}s</div>
                    </div>
                  )}
               </div>
            </div>

            {/* Right Panel: Answer */}
            <div className="w-full md:w-[70%] flex-1 md:h-full bg-white/5 relative flex flex-col overflow-hidden">
               {!showAnswer ? (
                  <button 
                    onClick={() => {
                      setShowAnswer(true);
                      markCompleted(currentQuestion.id);
                    }}
                    className="w-full h-full min-h-[200px] flex flex-col items-center justify-center group hover:bg-white/10 transition-all cursor-pointer"
                  >
                    <Terminal className="w-8 h-8 sm:w-12 sm:h-12 mb-4 sm:mb-6 text-white/20 group-hover:text-primary transition-colors duration-300" />
                    <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">
                      Tap to Reveal Answer
                    </span>
                    <span className="mt-2 text-[9px] sm:text-[10px] text-white/20 font-mono hidden sm:block">[OR PRESS ARROW RIGHT]</span>
                  </button>
               ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full h-full overflow-y-auto p-4 sm:p-6 md:p-12 custom-scrollbar"
                  >
                    <div className="max-w-2xl mx-auto space-y-6 sm:space-y-8 pb-20">
                      {currentQuestion.diagram && (
                        <div>
                          <div className="text-[9px] sm:text-[10px] font-bold text-primary uppercase tracking-widest mb-2 sm:mb-3 border-b border-primary/20 pb-1 w-fit">Visualization</div>
                          <div className="bg-black/40 border border-white/10 p-3 sm:p-4 md:p-6 rounded-lg overflow-x-auto">
                            <Mermaid chart={currentQuestion.diagram} />
                          </div>
                        </div>
                      )}

                      <div>
                        <div className="text-[9px] sm:text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2 sm:mb-3 border-b border-white/10 pb-1 w-fit">Explanation</div>
                        <div className="text-xs sm:text-sm md:text-base text-white/80 leading-6 sm:leading-7 font-light">
                          {renderExplanation(currentQuestion.explanation)}
                        </div>
                      </div>
                      
                      {isCompleted && (
                         <div className="flex items-center gap-2 text-green-500 text-[10px] sm:text-xs font-bold uppercase tracking-widest mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-white/10">
                            <Check className="w-3 h-3 sm:w-4 sm:h-4" /> Completed
                         </div>
                      )}
                    </div>
                  </motion.div>
               )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer Navigation */}
      <div className="absolute bottom-0 w-full h-8 sm:h-10 px-2 sm:px-4 border-t border-white/10 flex justify-between items-center text-[8px] sm:text-[10px] font-bold uppercase tracking-widest text-white/30 bg-black z-50">
         <div className="flex gap-3 sm:gap-6">
            <span className="hidden sm:flex items-center gap-1"><span className="text-primary">↑</span> PREV</span>
            <span className="hidden sm:flex items-center gap-1"><span className="text-primary">↓</span> NEXT</span>
            <span className="hidden sm:flex items-center gap-1"><span className="text-primary">→</span> REVEAL</span>
            <span className="sm:hidden">SWIPE TO NAVIGATE</span>
         </div>
         <div>
            v2.2
         </div>
      </div>
    </div>
  );
}