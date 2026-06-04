import { useLocation } from 'wouter';
import { useKeyboardNavigation } from './use-keyboard-navigation';

interface NavShortcut {
  key: string;
  path: string;
  description: string;
}

const NAV_SHORTCUTS: NavShortcut[] = [
  { key: 'h', path: '/', description: 'Go to Home' },
  { key: 'c', path: '/channels', description: 'Go to Channels' },
  { key: 'e', path: '/certifications', description: 'Go to Certifications' },
  { key: 'v', path: '/voice-interview', description: 'Go to Voice Interview' },
  { key: 't', path: '/tests', description: 'Go to Quick Tests' },
  { key: 'x', path: '/code', description: 'Go to Code Challenges' },
  { key: 'r', path: '/review', description: 'Go to SRS Review' },
];

/**
 * Registers global single-key navigation shortcuts.
 * Activated only when no input/textarea is focused to avoid conflicts.
 */
export function useGlobalShortcuts() {
  const [, setLocation] = useLocation();

  useKeyboardNavigation(
    NAV_SHORTCUTS.map((s) => ({
      key: s.key,
      ctrlKey: false,
      metaKey: false,
      altKey: false,
      handler: () => {
        if (
          document.activeElement?.tagName === 'INPUT' ||
          document.activeElement?.tagName === 'TEXTAREA' ||
          (document.activeElement as HTMLElement)?.isContentEditable
        ) {
          return;
        }
        setLocation(s.path);
      },
      description: s.description,
    }))
  );
}
