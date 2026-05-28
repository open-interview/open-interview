import { useEffect } from 'react';

type KeyMap = Record<string, () => void>;

export function useKeyboardShortcut(keys: KeyMap) {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const key = [e.ctrlKey || e.metaKey ? 'meta' : '', e.shiftKey ? 'shift' : '', e.key].filter(Boolean).join('+');
      const simple = e.key;
      keys[key]?.();
      keys[simple]?.();
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [keys]);
}
