import { useEffect, useState } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(QUERY).matches
  );

  useEffect(() => {
    const mql = window.matchMedia(QUERY);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return reduced;
}

// Spring transition presets for framer-motion
export const springTransition = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 30,
};

export const springTransitionBounce = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 20,
};

export function getSpringTransition(reduced: boolean) {
  return reduced
    ? { duration: 0.01 }
    : springTransition;
}
