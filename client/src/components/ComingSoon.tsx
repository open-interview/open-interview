/**
 * Coming Soon Component
 * Shows a friendly message with fun illustrations when content is not yet available
 * Uses inline SVGs for static site compatibility
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { Home, ArrowLeft, Coffee, Sparkles } from 'lucide-react';

// Fun developer-themed SVG illustrations
const illustrations = {
  // Robot working on code
  robot: (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <defs>
        <linearGradient id="robotGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.8" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.4" />
        </linearGradient>
      </defs>
      {/* Robot body */}
      <rect x="60" y="80" width="80" height="70" rx="10" fill="url(#robotGrad)" />
      {/* Robot head */}
      <rect x="70" y="40" width="60" height="45" rx="8" fill="url(#robotGrad)" />
      {/* Eyes */}
      <circle cx="85" cy="58" r="8" fill="white" />
      <circle cx="115" cy="58" r="8" fill="white" />
      <circle cx="85" cy="58" r="4" fill="hsl(var(--foreground))">
        <animate attributeName="cx" values="83;87;83" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx="115" cy="58" r="4" fill="hsl(var(--foreground))">
        <animate attributeName="cx" values="113;117;113" dur="2s" repeatCount="indefinite" />
      </circle>
      {/* Antenna */}
      <line x1="100" y1="40" x2="100" y2="25" stroke="hsl(var(--primary))" strokeWidth="3" />
      <circle cx="100" cy="20" r="6" fill="hsl(var(--primary))">
        <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" />
      </circle>
      {/* Arms */}
      <rect x="35" y="90" width="25" height="12" rx="6" fill="url(#robotGrad)">
        <animateTransform attributeName="transform" type="rotate" values="0 60 96;-10 60 96;0 60 96" dur="1.5s" repeatCount="indefinite" />
      </rect>
      <rect x="140" y="90" width="25" height="12" rx="6" fill="url(#robotGrad)">
        <animateTransform attributeName="transform" type="rotate" values="0 140 96;10 140 96;0 140 96" dur="1.5s" repeatCount="indefinite" />
      </rect>
      {/* Legs */}
      <rect x="75" y="150" width="15" height="30" rx="5" fill="url(#robotGrad)" />
      <rect x="110" y="150" width="15" height="30" rx="5" fill="url(#robotGrad)" />
      {/* Screen on chest */}
      <rect x="80" y="95" width="40" height="25" rx="3" fill="hsl(var(--background))" />
      <text x="100" y="112" textAnchor="middle" fontSize="10" fill="hsl(var(--primary))" fontFamily="monospace">
        <tspan>{'</>'}
          <animate attributeName="opacity" values="1;0;1" dur="0.8s" repeatCount="indefinite" />
        </tspan>
      </text>
    </svg>
  ),

  // Coffee brewing (content is brewing)
  coffee: (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <defs>
        <linearGradient id="coffeeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#8B4513" />
          <stop offset="100%" stopColor="#5D3A1A" />
        </linearGradient>
      </defs>
      {/* Cup */}
      <path d="M50 80 L60 160 L140 160 L150 80 Z" fill="white" stroke="hsl(var(--border))" strokeWidth="2" />
      {/* Coffee */}
      <path d="M55 90 L62 155 L138 155 L145 90 Z" fill="url(#coffeeGrad)">
        <animate attributeName="d" 
          values="M55 120 L62 155 L138 155 L145 120 Z;M55 90 L62 155 L138 155 L145 90 Z;M55 120 L62 155 L138 155 L145 120 Z" 
          dur="3s" repeatCount="indefinite" />
      </path>
      {/* Handle */}
      <path d="M150 95 Q175 95 175 120 Q175 145 150 145" fill="none" stroke="white" strokeWidth="8" />
      <path d="M150 100 Q170 100 170 120 Q170 140 150 140" fill="none" stroke="hsl(var(--border))" strokeWidth="2" />
      {/* Steam */}
      <path d="M75 75 Q80 60 75 45" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="2" strokeLinecap="round" opacity="0.6">
        <animate attributeName="d" values="M75 75 Q80 60 75 45;M75 75 Q70 60 75 45;M75 75 Q80 60 75 45" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.6;0.2;0.6" dur="2s" repeatCount="indefinite" />
      </path>
      <path d="M100 70 Q105 50 100 35" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="2" strokeLinecap="round" opacity="0.6">
        <animate attributeName="d" values="M100 70 Q105 50 100 35;M100 70 Q95 50 100 35;M100 70 Q105 50 100 35" dur="2.5s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.6;0.2;0.6" dur="2.5s" repeatCount="indefinite" />
      </path>
      <path d="M125 75 Q130 55 125 40" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="2" strokeLinecap="round" opacity="0.6">
        <animate attributeName="d" values="M125 75 Q130 55 125 40;M125 75 Q120 55 125 40;M125 75 Q130 55 125 40" dur="1.8s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.6;0.2;0.6" dur="1.8s" repeatCount="indefinite" />
      </path>
      {/* Saucer */}
      <ellipse cx="100" cy="165" rx="60" ry="10" fill="hsl(var(--muted))" />
    </svg>
  ),

  // Construction/building
  construction: (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <defs>
        <linearGradient id="brickGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.9" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.6" />
        </linearGradient>
      </defs>
      {/* Ground */}
      <rect x="20" y="160" width="160" height="20" fill="hsl(var(--muted))" rx="2" />
      {/* Bricks stacked */}
      <g>
        <rect x="40" y="140" width="40" height="20" fill="url(#brickGrad)" rx="2" />
        <rect x="85" y="140" width="40" height="20" fill="url(#brickGrad)" rx="2" />
        <rect x="130" y="140" width="40" height="20" fill="url(#brickGrad)" rx="2" />
        <rect x="60" y="120" width="40" height="20" fill="url(#brickGrad)" rx="2" />
        <rect x="105" y="120" width="40" height="20" fill="url(#brickGrad)" rx="2" />
        <rect x="80" y="100" width="40" height="20" fill="url(#brickGrad)" rx="2" />
      </g>
      {/* Crane */}
      <rect x="155" y="60" width="8" height="100" fill="hsl(var(--muted-foreground))" />
      <rect x="100" y="55" width="70" height="8" fill="hsl(var(--muted-foreground))" />
      {/* Crane hook with brick */}
      <line x1="120" y1="63" x2="120" y2="85" stroke="hsl(var(--muted-foreground))" strokeWidth="2" />
      <rect x="105" y="85" width="30" height="15" fill="url(#brickGrad)" rx="2">
        <animateTransform attributeName="transform" type="translate" values="0 0;0 -20;0 0" dur="2s" repeatCount="indefinite" />
      </rect>
      {/* Hard hat */}
      <ellipse cx="50" cy="75" rx="20" ry="8" fill="#FFD700" />
      <path d="M30 75 Q30 60 50 55 Q70 60 70 75" fill="#FFD700" />
      {/* Worker face */}
      <circle cx="50" cy="90" r="12" fill="#FFDAB9" />
      <circle cx="46" cy="88" r="2" fill="hsl(var(--foreground))" />
      <circle cx="54" cy="88" r="2" fill="hsl(var(--foreground))" />
      <path d="M46 95 Q50 98 54 95" fill="none" stroke="hsl(var(--foreground))" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),

  // Rocket launching (coming soon)
  rocket: (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <defs>
        <linearGradient id="rocketGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="hsl(var(--primary))" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.7" />
        </linearGradient>
        <linearGradient id="flameGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FF6B35" />
          <stop offset="50%" stopColor="#F7C331" />
          <stop offset="100%" stopColor="#FF6B35" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Rocket body */}
      <g>
        <animateTransform attributeName="transform" type="translate" values="0 5;0 -5;0 5" dur="1s" repeatCount="indefinite" />
        {/* Main body */}
        <path d="M100 30 Q85 50 85 100 L115 100 Q115 50 100 30" fill="url(#rocketGrad)" />
        {/* Window */}
        <circle cx="100" cy="65" r="12" fill="hsl(var(--background))" stroke="hsl(var(--border))" strokeWidth="2" />
        <circle cx="100" cy="65" r="8" fill="#87CEEB" />
        {/* Fins */}
        <path d="M85 85 L65 110 L85 100 Z" fill="url(#rocketGrad)" />
        <path d="M115 85 L135 110 L115 100 Z" fill="url(#rocketGrad)" />
        {/* Bottom */}
        <rect x="85" y="100" width="30" height="15" fill="hsl(var(--muted-foreground))" />
        {/* Flame */}
        <path d="M90 115 Q100 150 110 115 Q105 140 100 160 Q95 140 90 115" fill="url(#flameGrad)">
          <animate attributeName="d" 
            values="M90 115 Q100 150 110 115 Q105 140 100 160 Q95 140 90 115;M90 115 Q100 145 110 115 Q105 135 100 155 Q95 135 90 115;M90 115 Q100 150 110 115 Q105 140 100 160 Q95 140 90 115" 
            dur="0.3s" repeatCount="indefinite" />
        </path>
      </g>
      {/* Stars */}
      <circle cx="40" cy="50" r="2" fill="hsl(var(--muted-foreground))">
        <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite" />
      </circle>
      <circle cx="160" cy="70" r="2" fill="hsl(var(--muted-foreground))">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="1.2s" repeatCount="indefinite" />
      </circle>
      <circle cx="150" cy="40" r="1.5" fill="hsl(var(--muted-foreground))">
        <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx="50" cy="90" r="1.5" fill="hsl(var(--muted-foreground))">
        <animate attributeName="opacity" values="0.5;1;0.5" dur="1.8s" repeatCount="indefinite" />
      </circle>
    </svg>
  ),
};


// Fun messages for developers
const funnyMessages = [
  { title: "Our AI hamsters are working overtime! 🐹", subtitle: "They're typing as fast as their tiny paws can go." },
  { title: "Content is brewing... ☕", subtitle: "Good things come to those who wait (and drink coffee)." },
  { title: "Deploying awesomeness... 🚀", subtitle: "Our code monkeys are on it!" },
  { title: "Building something cool! 🔨", subtitle: "Rome wasn't built in a day, but our content will be here soon." },
  { title: "Loading... please hold 📞", subtitle: "Your call is important to us. Just kidding, we're coding!" },
  { title: "Compiling greatness... ⚡", subtitle: "No errors so far... *fingers crossed*" },
  { title: "git commit -m 'adding content' 💻", subtitle: "Push is in progress..." },
  { title: "sudo make content 🛠️", subtitle: "Permission granted. Building..." },
];

interface ComingSoonProps {
  title?: string;
  description?: string;
  type?: 'channel' | 'certification' | 'generic';
  name?: string;
  redirectTo?: string;
  redirectDelay?: number;
  showBackButton?: boolean;
}

export function ComingSoon({ 
  title,
  description,
  type = 'generic',
  name,
  redirectTo = '/',
  redirectDelay = 5000,
  showBackButton = true,
}: ComingSoonProps) {
  const [, setLocation] = useLocation();
  const [countdown, setCountdown] = useState(Math.ceil(redirectDelay / 1000));
  const [messageIndex] = useState(() => Math.floor(Math.random() * funnyMessages.length));
  const [illustrationKey] = useState<keyof typeof illustrations>(() => {
    const keys = Object.keys(illustrations) as (keyof typeof illustrations)[];
    return keys[Math.floor(Math.random() * keys.length)];
  });

  const message = funnyMessages[messageIndex];
  const illustration = illustrations[illustrationKey];

  // Countdown and redirect
  useEffect(() => {
    if (redirectDelay <= 0) return;
    
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setLocation(redirectTo);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [redirectDelay, redirectTo, setLocation]);

  const defaultTitle = type === 'channel' 
    ? `${name || 'This channel'} is coming soon!`
    : type === 'certification'
    ? `${name || 'This certification'} is being prepared!`
    : title || message.title;

  const defaultDescription = description || message.subtitle;

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center"
      >
        {/* Illustration */}
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", bounce: 0.4 }}
          className="w-48 h-48 mx-auto mb-6"
        >
          {illustration}
        </motion.div>

        {/* Title */}
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-bold mb-2"
        >
          {defaultTitle}
        </motion.h2>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-muted-foreground mb-6"
        >
          {defaultDescription}
        </motion.p>

        {/* Progress message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-6"
        >
          <Sparkles className="w-4 h-4 text-primary animate-pulse" />
          <span>Our team is working hard to bring you amazing content!</span>
        </motion.div>

        {/* Countdown */}
        {redirectDelay > 0 && countdown > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-xs text-muted-foreground mb-4"
          >
            Redirecting in {countdown}s...
          </motion.div>
        )}

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex items-center justify-center gap-3"
        >
          {showBackButton && (
            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg text-sm font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </button>
          )}
          <button
            onClick={() => setLocation(redirectTo)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg text-sm font-medium transition-colors"
          >
            <Home className="w-4 h-4" />
            {redirectTo === '/' ? 'Go Home' : 'Browse More'}
          </button>
        </motion.div>

        {/* Fun fact */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 p-4 bg-muted/30 rounded-xl border border-border"
        >
          <div className="flex items-center gap-2 text-sm">
            <Coffee className="w-4 h-4 text-amber-500" />
            <span className="text-muted-foreground">
              <span className="font-medium text-foreground">Fun fact:</span> While you wait, our AI generates 10+ new questions daily!
            </span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default ComingSoon;
