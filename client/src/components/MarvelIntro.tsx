import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import quotesData from '../lib/quotes/daily-quotes.json';

const INTRO_SEEN_KEY = 'marvel-intro-seen';

interface MarvelIntroProps {
  onComplete: () => void;
}

// Netflix-style "N" logo animation
function NetflixLogo() {
  return (
    <motion.div className="relative w-24 h-32 sm:w-32 sm:h-44">
      {/* Left bar */}
      <motion.div
        className="absolute left-0 top-0 w-6 sm:w-8 h-full bg-[#E50914] rounded-sm"
        initial={{ scaleY: 0, originY: 1 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />
      {/* Diagonal */}
      <motion.div
        className="absolute left-0 top-0 w-6 sm:w-8 h-full bg-gradient-to-b from-[#E50914] to-[#B20710] rounded-sm origin-top-left"
        style={{ transform: 'skewX(-20deg) translateX(60%)' }}
        initial={{ scaleY: 0, originY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' }}
      />
      {/* Right bar */}
      <motion.div
        className="absolute right-0 top-0 w-6 sm:w-8 h-full bg-[#E50914] rounded-sm"
        initial={{ scaleY: 0, originY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.5, delay: 0.5, ease: 'easeOut' }}
      />
      {/* Glow effect */}
      <motion.div
        className="absolute inset-0 blur-2xl bg-[#E50914]/40"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.8, 0.4] }}
        transition={{ duration: 1.5, delay: 0.8 }}
      />
    </motion.div>
  );
}

export function MarvelIntro({ onComplete }: MarvelIntroProps) {
  const [phase, setPhase] = useState<'logo' | 'title' | 'quote' | 'done'>('logo');
  const [skipEnabled, setSkipEnabled] = useState(false);

  // Get today's quote based on date
  const getTodayQuote = () => {
    const today = new Date();
    const dayOfYear = Math.floor(
      (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
    );
    const index = dayOfYear % quotesData.quotes.length;
    return quotesData.quotes[index];
  };

  const quote = getTodayQuote();

  useEffect(() => {
    // Enable skip after 1 second
    const skipTimer = setTimeout(() => setSkipEnabled(true), 1000);

    // Phase transitions - Netflix style timing
    const titleTimer = setTimeout(() => setPhase('title'), 2000);
    const quoteTimer = setTimeout(() => setPhase('quote'), 4500);
    const doneTimer = setTimeout(() => setPhase('done'), 8500);
    const completeTimer = setTimeout(() => {
      localStorage.setItem(INTRO_SEEN_KEY, 'true');
      onComplete();
    }, 9500);

    return () => {
      clearTimeout(skipTimer);
      clearTimeout(titleTimer);
      clearTimeout(quoteTimer);
      clearTimeout(doneTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  const handleSkip = () => {
    localStorage.setItem(INTRO_SEEN_KEY, 'true');
    onComplete();
  };

  return (
    <motion.div
      className="fixed inset-0 z-[9999] bg-black flex items-center justify-center overflow-hidden"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      {/* Netflix-style vignette overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_70%,rgba(0,0,0,0.8)_100%)]" />
      
      {/* Animated scan lines for cinematic effect */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,255,255,0.1)_2px,rgba(255,255,255,0.1)_4px)]" />
      </div>

      {/* Floating particles - Netflix red theme */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-[#E50914]/40 rounded-full"
            initial={{
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
              y: (typeof window !== 'undefined' ? window.innerHeight : 800) + 50,
              scale: Math.random() * 0.5 + 0.5,
            }}
            animate={{
              y: -100,
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 4 + 3,
              repeat: Infinity,
              delay: Math.random() * 3,
              ease: 'linear',
            }}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Phase 1: Netflix-style Logo */}
        {phase === 'logo' && (
          <motion.div
            key="logo"
            className="relative z-10 flex flex-col items-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.5, filter: 'blur(20px)' }}
            transition={{ duration: 0.6 }}
          >
            <NetflixLogo />
            
            {/* Netflix "tudum" sound visual representation */}
            <motion.div
              className="absolute inset-0 border-4 border-[#E50914] rounded-lg"
              initial={{ scale: 1, opacity: 0.8 }}
              animate={{ scale: 2, opacity: 0 }}
              transition={{ duration: 1, delay: 1 }}
            />
          </motion.div>
        )}

        {/* Phase 2: Title Reveal - Netflix Original style */}
        {phase === 'title' && (
          <motion.div
            key="title"
            className="relative z-10 flex flex-col items-center text-center px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -100, filter: 'blur(10px)' }}
            transition={{ duration: 0.5 }}
          >
            {/* "A CODE REELS ORIGINAL" text */}
            <motion.p
              className="text-[#E50914] text-xs sm:text-sm tracking-[0.4em] uppercase mb-4 font-medium"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              A Code Reels Original
            </motion.p>

            {/* Main title with Netflix-style reveal */}
            <div className="relative overflow-hidden">
              <motion.h1
                className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tight"
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <span className="text-white">CODE</span>
                <span className="text-[#E50914]">_</span>
                <span className="text-[#E50914]">REELS</span>
              </motion.h1>
            </div>

            {/* Tagline */}
            <motion.p
              className="mt-6 text-white/70 text-base sm:text-lg tracking-wide"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              Master Your Technical Interview
            </motion.p>

            {/* Netflix-style red line */}
            <motion.div
              className="mt-6 h-1 bg-[#E50914] rounded-full"
              initial={{ width: 0 }}
              animate={{ width: 120 }}
              transition={{ delay: 1, duration: 0.5 }}
            />
          </motion.div>
        )}

        {/* Phase 3: Quote - Netflix description style */}
        {phase === 'quote' && (
          <motion.div
            key="quote"
            className="relative z-10 max-w-3xl mx-auto px-8 text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Quote container with Netflix card style */}
            <div className="relative">
              {/* Red accent line */}
              <motion.div
                className="absolute -left-4 top-0 bottom-0 w-1 bg-[#E50914] rounded-full"
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              />

              {/* Quote text */}
              <motion.blockquote
                className="text-xl sm:text-3xl md:text-4xl font-light text-white leading-relaxed pl-6"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
              >
                "{quote.text}"
              </motion.blockquote>

              {/* Author with Netflix metadata style */}
              <motion.div
                className="mt-6 pl-6 flex items-center gap-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
              >
                <span className="text-[#E50914] font-semibold">—</span>
                <span className="text-white/80 text-lg">{quote.author}</span>
                <span className="px-2 py-0.5 bg-white/10 rounded text-xs text-white/60 uppercase tracking-wider">
                  {quote.category}
                </span>
              </motion.div>
            </div>

            {/* "Today's Motivation" badge */}
            <motion.div
              className="mt-10 inline-flex items-center gap-2 px-4 py-2 bg-[#E50914]/20 border border-[#E50914]/30 rounded-full"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.5 }}
            >
              <span className="w-2 h-2 bg-[#E50914] rounded-full animate-pulse" />
              <span className="text-xs text-white/70 uppercase tracking-widest">Today's Motivation</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Skip button - Netflix style */}
      <AnimatePresence>
        {skipEnabled && phase !== 'done' && (
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            onClick={handleSkip}
            className="absolute bottom-8 right-8 flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded text-sm text-white/80 hover:text-white transition-all group"
          >
            Skip Intro
            <svg 
              className="w-4 h-4 group-hover:translate-x-1 transition-transform" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Progress bar - Netflix red */}
      <motion.div
        className="absolute bottom-0 left-0 h-1 bg-[#E50914]"
        initial={{ width: '0%' }}
        animate={{ width: '100%' }}
        transition={{ duration: 9.5, ease: 'linear' }}
      />

      {/* Netflix-style corner branding */}
      <motion.div
        className="absolute top-6 left-6 text-white/30 text-xs tracking-widest uppercase"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        Code Reels
      </motion.div>
    </motion.div>
  );
}

// Hook to check if intro should be shown
export function useMarvelIntro() {
  const [showIntro, setShowIntro] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Skip intro on mobile devices for better UX
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      setShowIntro(false);
      setIsChecking(false);
      return;
    }
    
    const seen = localStorage.getItem(INTRO_SEEN_KEY);
    setShowIntro(!seen);
    setIsChecking(false);
  }, []);

  const completeIntro = () => {
    setShowIntro(false);
  };

  const resetIntro = () => {
    localStorage.removeItem(INTRO_SEEN_KEY);
    // Only show intro on non-mobile
    const isMobile = window.innerWidth < 768;
    setShowIntro(!isMobile);
  };

  return { showIntro, isChecking, completeIntro, resetIntro };
}
