import { useState, useEffect } from 'react';
import type { Transition } from 'framer-motion';

export const springTransition = {
  type: 'spring',
  stiffness: 300,
  damping: 25,
  mass: 1,
} as const;

export const springTransitionBounce = {
  type: 'spring',
  stiffness: 400,
  damping: 15,
  mass: 1,
} as const;

export const staggerConfig = {
  staggerChildren: 0.08,
  delayChildren: 0,
} as const;

export const getSpringTransition = (reduced: boolean): Transition => {
  if (reduced) {
    return { duration: 0.01 };
  }
  return springTransition;
};

export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  
  useEffect(() => {
    // Create media query for prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    // Set initial value
    setPrefersReducedMotion(mediaQuery.matches);
    
    // Handle changes to the media query
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };
    
    // Add event listener for changes
    mediaQuery.addEventListener('change', handleChange);
    
    // Cleanup: remove event listener on unmount
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);
  
  return prefersReducedMotion;
}
