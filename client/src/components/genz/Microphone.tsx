/**
 * GenZ Microphone Button - Recording button with animations
 */

import { motion } from 'framer-motion';
import { Mic, Square } from 'lucide-react';

interface GenZMicrophoneProps {
  isRecording: boolean;
  onStart: () => void;
  onStop: () => void;
  disabled?: boolean;
}

export function Microphone({
  isRecording,
  onStart,
  onStop,
  disabled = false,
}: GenZMicrophoneProps) {
  return (
    <div className="relative flex items-center justify-center">
      {/* Pulse rings when recording */}
      {isRecording && (
        <>
          <motion.div
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute w-32 h-32 rounded-full bg-gradient-to-r from-red-500 to-pink-500"
          />
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.7, 0, 0.7],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.5,
            }}
            className="absolute w-28 h-28 rounded-full bg-gradient-to-r from-red-500 to-pink-500"
          />
        </>
      )}

      {/* Main button */}
      <motion.button
        onClick={isRecording ? onStop : onStart}
        disabled={disabled}
        whileHover={{ scale: disabled ? 1 : 1.1 }}
        whileTap={{ scale: disabled ? 1 : 0.9 }}
        animate={{
          scale: isRecording ? [1, 1.05, 1] : 1,
        }}
        transition={{
          duration: 1,
          repeat: isRecording ? Infinity : 0,
        }}
        className={`
          relative z-10 w-24 h-24 rounded-full flex items-center justify-center
          transition-all shadow-2xl
          ${
            isRecording
              ? 'bg-gradient-to-r from-red-500 to-pink-500'
              : 'bg-gradient-to-r from-primary to-cyan-500'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-[0_0_30px_var(--shadow-glow)]'}
        `}
      >
        {isRecording ? (
          <Square className="w-12 h-12 text-white" strokeWidth={3} />
        ) : (
          <Mic className="w-12 h-12 text-primary-foreground" strokeWidth={2.5} />
        )}
      </motion.button>

      {/* Recording indicator */}
      {isRecording && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -bottom-8 text-sm font-semibold text-red-500 flex items-center gap-2"
        >
          <motion.div
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-2 h-2 bg-red-500 rounded-full"
          />
          Recording...
        </motion.div>
      )}
    </div>
  );
}
