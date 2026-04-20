/**
 * Service Worker Registration
 * Registers the service worker for offline support
 */

const SW_URL = import.meta.env.BASE_URL + 'sw.js';

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  // Don't register in development
  if (import.meta.env.DEV) {
    console.log('[SW] Skipping service worker registration in development');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register(SW_URL, {
      scope: import.meta.env.BASE_URL,
    });

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New version available
          console.log('[SW] New version available');
          
          // Optionally notify user about update
          if (window.confirm('A new version is available. Reload to update?')) {
            newWorker.postMessage('skipWaiting');
            window.location.reload();
          }
        }
      });
    });

    console.log('[SW] Service worker registered successfully');
    return registration;
  } catch (error) {
    console.error('[SW] Service worker registration failed:', error);
    return null;
  }
}

/**
 * Prefetch URLs via service worker
 */
export function prefetchViaServiceWorker(urls: string[]): void {
  if (!navigator.serviceWorker?.controller) return;
  
  navigator.serviceWorker.controller.postMessage({
    type: 'prefetch',
    urls,
  });
}

/**
 * Check if app is running offline
 */
export function isOffline(): boolean {
  return typeof navigator !== 'undefined' && !navigator.onLine;
}

/**
 * Listen for online/offline status changes
 */
export function onOnlineStatusChange(callback: (online: boolean) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);
  
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}
