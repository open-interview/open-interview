import { useEffect, useRef, useCallback } from 'react';

/**
 * Focus management hook for:
 * - Announcing route changes to screen readers
 * - Trapping focus in modals/dialogs
 * - Moving focus to first error in forms
 */
export function useFocusManagement() {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  /**
   * Announce route/page changes to screen readers
   */
  const announceRouteChange = useCallback((location: string) => {
    const announcer = document.getElementById('route-announcer');
    if (announcer) {
      // Clear and set new message for screen readers
      announcer.textContent = '';
      requestAnimationFrame(() => {
        const pageName = getPageName(location);
        announcer.textContent = `Navigated to ${pageName}`;
      });
    }
  }, []);

  /**
   * Trap focus within a container element
   */
  const trapFocus = useCallback((container: HTMLElement) => {
    const FOCUSABLE = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',');

    const focusableElements = Array.from(
      container.querySelectorAll<HTMLElement>(FOCUSABLE)
    ).filter(el => el.offsetParent !== null);

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    firstElement.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  /**
   * Focus the first error field in a form
   */
  const focusFirstError = useCallback((form: HTMLFormElement) => {
    const errorFields = form.querySelectorAll<HTMLElement>(
      '[aria-invalid="true"], .error, [data-invalid="true"]'
    );

    if (errorFields.length > 0) {
      errorFields[0].focus();
      errorFields[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
      return true;
    }

    // Also check for fields with validation errors
    const invalidFields = form.querySelectorAll<HTMLElement>(':invalid');
    if (invalidFields.length > 0) {
      (invalidFields[0] as HTMLElement).focus();
      invalidFields[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
      return true;
    }

    return false;
  }, []);

  /**
   * Store and restore focus for modal operations
   */
  const saveFocus = useCallback(() => {
    previousFocusRef.current = document.activeElement as HTMLElement | null;
  }, []);

  const restoreFocus = useCallback(() => {
    if (previousFocusRef.current && 'focus' in previousFocusRef.current) {
      previousFocusRef.current.focus();
    }
  }, []);

  return {
    announceRouteChange,
    trapFocus,
    focusFirstError,
    saveFocus,
    restoreFocus,
  };
}

/**
 * Get human-readable page name from path
 */
function getPageName(path: string): string {
  const pathMap: Record<string, string> = {
    '/': 'Home',
    '/channels': 'Channels',
    '/voice-interview': 'Voice Interview',
    '/profile': 'Profile',
    '/bookmarks': 'Bookmarks',
    '/review': 'SRS Review',
    '/flashcards': 'Flashcards',
    '/tests': 'Quick Tests',
    '/code': 'Code Challenges',
    '/certifications': 'Certifications',
    '/badges': 'Badges',
    '/about': 'About',
    '/blog': 'Blog',
  };

  // Check for dynamic routes
  if (path.startsWith('/channel/')) return 'Channel';
  if (path.startsWith('/coding/')) return 'Coding Challenge';
  if (path.startsWith('/blog/')) return 'Blog Post';

  return pathMap[path] || 'Page';
}

/**
 * Add a live region announcer to the DOM for screen reader announcements
 * Call this once in your app root
 */
export function useSetupAnnouncer() {
  useEffect(() => {
    const existingAnnouncer = document.getElementById('route-announcer');
    if (existingAnnouncer) return;

    const announcer = document.createElement('div');
    announcer.id = 'route-announcer';
    announcer.setAttribute('role', 'status');
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    document.body.appendChild(announcer);

    return () => {
      announcer.remove();
    };
  }, []);
}
