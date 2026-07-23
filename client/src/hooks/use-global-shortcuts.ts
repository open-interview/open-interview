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
 * True when the keystroke originated from a place where the user is entering
 * text and bare-letter navigation shortcuts must not fire. Checks the event
 * target (not just document.activeElement) so it also catches editors like
 * Monaco/CodeMirror, which host a textarea and/or set role="textbox".
 */
function isTypingContext(event: KeyboardEvent): boolean {
  const target = event.target as HTMLElement | null;
  if (!target) return false;

  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (target.isContentEditable) return true;
  if (target.getAttribute?.('role') === 'textbox') return true;

  // Monaco/CodeMirror mount their editing surface inside a container element
  // even when focus lands on a child that isn't itself a textarea.
  if (target.closest?.('.monaco-editor, .cm-editor, [data-testid="monaco-editor"]')) {
    return true;
  }

  return false;
}

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
      shouldTrigger: (event) => !isTypingContext(event),
      handler: () => {
        setLocation(s.path);
      },
      description: s.description,
    }))
  );
}
