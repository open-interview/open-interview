import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SwipeCard } from '@/types/swipe';
import { StudyCard } from './StudyCard';
import { useIsMobile } from '@/hooks/use-mobile';

interface CardFanProps {
  cards: SwipeCard[];
  currentIndex: number;
  onSwipe: (direction: 'left' | 'right' | 'up' | 'down') => void;
  onRate: (rating: 'again' | 'hard' | 'good' | 'easy') => void;
  onIndexChange: (index: number) => void;
  isFlipped: boolean;
  setIsFlipped: (v: boolean) => void;
}

function generateFanPositions(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    x: i * 100,
    y: i * 10,
    rotate: i * 8,
    scale: Math.max(0.75, 1 - i * 0.07),
    opacity: Math.max(0.4, 1 - i * 0.25),
  }));
}

function useFanCardCount() {
  const [count, setCount] = useState(3);

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      if (w >= 1536) setCount(5);
      else if (w >= 1280) setCount(4);
      else if (w >= 1024) setCount(3);
      else setCount(1);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return count;
}

export function CardFan({
  cards,
  currentIndex,
  onSwipe,
  onRate,
  onIndexChange,
  isFlipped,
  setIsFlipped,
}: CardFanProps) {
  const isMobile = useIsMobile();
  const fanCardCount = useFanCardCount();
  const containerRef = useRef<HTMLDivElement>(null);
  const lastScrollTime = useRef(0);

  const useFanLayout = !isMobile && fanCardCount > 1;

  const visibleCards: { card: SwipeCard; cardIndex: number; positionIndex: number; isActive: boolean }[] = [];

  if (useFanLayout) {
    for (let i = 0; i < fanCardCount; i++) {
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

  if (!useFanLayout) {
    const card = cards[currentIndex];
    if (!card) return null;

    return (
      <div className="flex items-center justify-center w-full px-4">
        <div className="w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={card.id}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
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

  const visiblePositions = generateFanPositions(fanCardCount);

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      className="flex items-center justify-center w-full h-full select-none"
      style={{ perspective: '1000px' }}
    >
      <div className="relative" style={{ width: 500, height: 420 }}>
        <AnimatePresence mode="popLayout">
          {visibleCards.map(({ card, cardIndex, positionIndex, isActive }) => {
            const pos = visiblePositions[positionIndex];
            if (!pos) return null;

            return (
              <motion.div
                key={card.id}
                className="absolute inset-0 cursor-pointer"
                style={{
                  zIndex: isActive ? 50 : cardIndex,
                }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  x: pos.x,
                  y: pos.y,
                  rotate: pos.rotate,
                  scale: pos.scale,
                  opacity: pos.opacity,
                  filter: isActive ? 'none' : 'blur(1.5px)',
                }}
                exit={{ opacity: 0, scale: 0.8, x: -100, transition: { duration: 0.2 } }}
                transition={{ type: 'spring', stiffness: 300, damping: 30, mass: 0.8 }}
                layout
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
}
