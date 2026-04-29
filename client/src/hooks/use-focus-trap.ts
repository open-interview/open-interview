import { useEffect, useRef, useCallback, RefObject } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

interface FocusTrapOptions {
  enabled?: boolean;
  initialFocus?: RefObject<HTMLElement> | null;
  returnFocus?: boolean;
}

/**
 * Focus trap hook - keeps keyboard focus within a container
 * Supports both simple usage (single boolean) and advanced options
 */
export function useFocusTrap(
  containerRef: RefObject<HTMLElement> | boolean,
  options?: FocusTrapOptions
): RefObject<HTMLElement> {
  const internalRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Handle both usage patterns
  const isActive = typeof containerRef === 'boolean'
    ? containerRef
    : options?.enabled ?? true;

  const ref = typeof containerRef === 'boolean'
    ? internalRef
    : containerRef;

  const { initialFocus, returnFocus = true } = options || {};

  const getFocusableElements = useCallback((container: HTMLElement): HTMLElement[] => {
    return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
      .filter(el => el.offsetParent !== null && !el.hasAttribute('disabled'));
  }, []);

  useEffect(() => {
    if (!isActive || !ref.current) return;

    const container = ref.current;
    previousFocusRef.current = document.activeElement as HTMLElement | null;

    // Focus initial element or first focusable element
    if (initialFocus?.current) {
      initialFocus.current.focus();
    } else {
      const focusable = getFocusableElements(container);
      if (focusable.length > 0) {
        focusable[0].focus();
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusable = getFocusableElements(container);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      if (returnFocus && previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [isActive, ref, initialFocus, returnFocus, getFocusableElements]);

  return ref;
}
