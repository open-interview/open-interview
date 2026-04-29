import { useState, useEffect, useRef } from 'react';

/**
 * Google UX Pattern 4.6: Never show spinner for <300ms actions.
 * Returns true only after minimum delay (300ms) and when actually loading.
 * Prevents flash of loading state for fast operations.
 */
export function useMinDelay(isLoading: boolean, minDelay = 300): boolean {
  const [showLoading, setShowLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const startRef = useRef<number>(0);

  useEffect(() => {
    if (isLoading) {
      startRef.current = Date.now();
      setShowLoading(false);
      timerRef.current = setTimeout(() => {
        setShowLoading(true);
      }, minDelay);
    } else {
      const elapsed = Date.now() - startRef.current;
      if (elapsed < minDelay && startRef.current > 0) {
        // Still within the delay window, wait out the remaining time
        const remaining = minDelay - elapsed;
        timerRef.current = setTimeout(() => {
          setShowLoading(false);
        }, remaining);
      } else {
        setShowLoading(false);
      }
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isLoading, minDelay]);

  return showLoading;
}
