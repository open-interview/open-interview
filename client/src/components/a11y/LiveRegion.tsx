import { useState, useEffect, useCallback } from 'react';

interface LiveRegionProps {
  message: string;
  assertive?: boolean;
}

export function LiveRegion({ message, assertive = false }: LiveRegionProps) {
  const [current, setCurrent] = useState(message);

  useEffect(() => {
    if (!message) return;
    setCurrent(message);
    const t = setTimeout(() => setCurrent(''), 5000);
    return () => clearTimeout(t);
  }, [message]);

  return (
    <div
      role="status"
      aria-live={assertive ? 'assertive' : 'polite'}
      aria-atomic="true"
      className="sr-only"
    >
      {current}
    </div>
  );
}

export function useLiveRegion() {
  const [message, setMessage] = useState('');
  const [assertive, setAssertive] = useState(false);

  const announce = useCallback((text: string, isError = false) => {
    setAssertive(isError);
    setMessage('');
    // Reset then set to re-trigger effect even for duplicate messages
    requestAnimationFrame(() => setMessage(text));
  }, []);

  return { message, assertive, announce };
}
