/**
 * GenZ Timer - Countdown timer with neon glow
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';

interface GenZTimerProps {
  duration: number; // in seconds
  onComplete?: () => void;
  showProgress?: boolean;
}

export function Timer({ duration, onComplete, showProgress = true }: GenZTimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isRunning, setIsRunning] = useState(true);

  useEffect(() => {
    if (!isRunning || timeLeft <= 0) {
      if (timeLeft <= 0 && onComplete) {
        onComplete();
      }
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, onComplete]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const percentage = (timeLeft / duration) * 100;

  const isLowTime = timeLeft < 60;
  const isCritical = timeLeft < 30;

  return (
    <div className="flex items-center gap-4">
      <motion.div
        animate={{
          scale: isCritical ? [1, 1.1, 1] : 1,
        }}
        transition={{
          duration: 1,
          repeat: isCritical ? Infinity : 0,
        }}
        className={`flex items-center gap-2 px-4 py-2 rounded-[12px] border ${
          isCritical
            ? 'bg-red-500/20 border-red-500/50'
            : isLowTime
            ? 'bg-orange-500/20 border-orange-500/50'
            : 'bg-muted/50 border-border'
        }`}
      >
        <Clock className={`w-5 h-5 ${isCritical ? 'text-red-500' : isLowTime ? 'text-orange-500' : 'text-primary'}`} />
        <span className={`font-mono text-xl font-bold ${isCritical ? 'text-red-500' : isLowTime ? 'text-orange-500' : 'text-foreground'}`}>
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </span>
      </motion.div>

      {showProgress && (
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            animate={{ width: `${percentage}%` }}
            className={`h-full ${
              isCritical
                ? 'bg-gradient-to-r from-red-500 to-pink-500'
                : isLowTime
                ? 'bg-gradient-to-r from-orange-500 to-yellow-500'
                : 'bg-gradient-to-r from-primary to-cyan-500'
            }`}
          />
        </div>
      )}
    </div>
  );
}
