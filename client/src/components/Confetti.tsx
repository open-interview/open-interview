/**
 * Confetti Animation Component
 * Celebratory particle effect for achievements
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Particle {
  id: number;
  x: number;
  color: string;
  delay: number;
  rotation: number;
  scale: number;
}

const COLORS = [
  '#a855f7', // purple
  '#3b82f6', // blue
  '#22c55e', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#ec4899', // pink
  '#06b6d4', // cyan
];

const SHAPES = ['●', '■', '▲', '★', '♦'];

export function Confetti({ 
  isActive, 
  duration = 3000,
  particleCount = 50 
}: { 
  isActive: boolean;
  duration?: number;
  particleCount?: number;
}) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (isActive) {
      const newParticles: Particle[] = Array.from({ length: particleCount }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        delay: Math.random() * 0.5,
        rotation: Math.random() * 360,
        scale: 0.5 + Math.random() * 0.5,
      }));
      setParticles(newParticles);

      const timer = setTimeout(() => setParticles([]), duration);
      return () => clearTimeout(timer);
    }
  }, [isActive, duration, particleCount]);

  return (
    <AnimatePresence>
      {particles.length > 0 && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              initial={{ 
                y: -20, 
                x: `${particle.x}vw`,
                opacity: 1,
                rotate: 0,
                scale: particle.scale
              }}
              animate={{ 
                y: '110vh',
                rotate: particle.rotation + 720,
                opacity: [1, 1, 0]
              }}
              exit={{ opacity: 0 }}
              transition={{ 
                duration: 2.5 + Math.random(),
                delay: particle.delay,
                ease: [0.25, 0.46, 0.45, 0.94]
              }}
              style={{ color: particle.color }}
              className="absolute text-2xl"
            >
              {SHAPES[particle.id % SHAPES.length]}
            </motion.div>
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}

export default Confetti;
