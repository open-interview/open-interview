import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SwipeCard } from '@/types/swipe';
import { StudyCard } from './StudyCard';
import { useIsMobile } from '@/hooks/use-mobile';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

interface CardFanProps {
  cards: SwipeCard[];
  currentIndex: number;
  onSwipe: (direction: 'left' | 'right' | 'up' | 'down') => void;
  onRate: (rating: 'again' | 'hard' | 'good' | 'easy') => void;
  onIndexChange: (index: number) => void;
  isFlipped: boolean;
  setIsFlipped: (v: boolean) => void;
}

function generateStackPositions(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    y: i * -16,
    scale: Math.max(0.75, 1 - i * 0.05),
    opacity: Math.max(0.25, 1 - i * 0.3),
    surfaceTone: i === 0 ? 'var(--surface-elevated)' : i === 1 ? 'var(--surface-raised)' : 'var(--surface-base)',
  }));
}

function useStackCardCount() {
  const [count, setCount] = useState(3);

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      if (w >= 1280) setCount(4);
      else if (w >= 1024) setCount(3);
      else setCount(1);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return count;
}

export const CardFan = React.memo(function CardFan({
  cards,
  currentIndex,
  onSwipe,
  onRate,
  onIndexChange,
  isFlipped,
  setIsFlipped,
}: CardFanProps) {
  const isMobile = useIsMobile();
  const prefersReducedMotion = useReducedMotion();
  const stackCardCount = useStackCardCount();
  const containerRef = useRef<HTMLDivElement>(null);
  const lastScrollTime = useRef(0);

  const useStackLayout = !isMobile && stackCardCount > 1;

  const visibleCards: { card: SwipeCard; cardIndex: number; positionIndex: number; isActive: boolean }[] = [];

  if (useStackLayout) {
    for (let i = 0; i < stackCardCount; i++) {
      const idx = currentIndex + i;
      if (idx >= 0 && idx < cards.length) {
        visibleCards.push({
          card: cards[idx],
          cardIndex: idx,
          positionIndex: i,
          isActive: i === 0,
        });
      }
    }
  }

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      const now = Date.now();
      if (now - lastScrollTime.current < 150) return;
      lastScrollTime.current = now;
      if (e.deltaY > 0 && currentIndex < cards.length - 1) {
        onIndexChange(currentIndex + 1);
      } else if (e.deltaY < 0 && currentIndex > 0) {
        onIndexChange(currentIndex - 1);
      }
    },
    [currentIndex, cards.length, onIndexChange],
  );

  if (!useStackLayout) {
    const card = cards[currentIndex];
    if (!card) return null;

    return (
      <div className="flex items-center justify-center w-full px-4">
        <div className="w-full max-w-lg mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={card.id}
              initial={prefersReducedMotion ? {} : { opacity: 0, x: 100 }}
              animate={prefersReducedMotion ? {} : { opacity: 1, x: 0 }}
              exit={prefersReducedMotion ? {} : { opacity: 0, x: -100 }}
              transition={prefersReducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 350, damping: 28 }}
            >
              <StudyCard
                card={card}
                onSwipe={onSwipe}
                onRate={onRate}
                isFlipped={isFlipped}
                setIsFlipped={setIsFlipped}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    );
  }

  const positions = generateStackPositions(stackCardCount);

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      className="flex items-center justify-center w-full h-full select-none"
      style={{ perspective: '1200px' }}
    >
      <div className="relative" style={{ width: 520, height: 440 }}>
        <div className="absolute inset-0 bg-gradient-to-b from-violet-500/3 via-transparent to-transparent rounded-3xl pointer-events-none" />
        <AnimatePresence mode="popLayout">
          {visibleCards.map(({ card, cardIndex, positionIndex, isActive }) => {
            const pos = positions[positionIndex];
            if (!pos) return null;

            return (
              <motion.div
                key={card.id}
                className="absolute inset-0 cursor-pointer rounded-2xl"
                style={{
                  zIndex: isActive ? 50 : cardIndex,
                  backgroundColor: pos.surfaceTone,
                  willChange: 'transform, opacity',
                }}
                initial={prefersReducedMotion ? {} : { opacity: 0, scale: 0.8, y: -30 }}
                animate={{
                  y: pos.y,
                  scale: pos.scale,
                  opacity: pos.opacity,
                }}
                exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.8, x: -100, transition: { duration: 0.2 } }}
                transition={prefersReducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 350, damping: 28, mass: 0.8 }}
                {...(prefersReducedMotion ? {} : { layout: true })}
                onClick={() => {
                  if (!isActive) {
                    onIndexChange(cardIndex);
                  }
                }}
              >
                <StudyCard
                  card={card}
                  onSwipe={isActive ? onSwipe : () => {}}
                  onRate={isActive ? onRate : () => {}}
                  isFlipped={isActive ? isFlipped : false}
                  setIsFlipped={isActive ? setIsFlipped : () => {}}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
});
