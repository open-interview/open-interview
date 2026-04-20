import { useState, useEffect } from 'react';

export type SearchProvider = 'fuzzy' | 'pagefind';

const STORAGE_KEY = 'search-provider';

export function useSearchProvider() {
  const [provider, setProvider] = useState<SearchProvider>(() => {
    if (typeof window === 'undefined') return 'fuzzy';
    return (localStorage.getItem(STORAGE_KEY) as SearchProvider) || 'fuzzy';
  });

  const [pagefindAvailable, setPagefindAvailable] = useState(false);

  // Check if Pagefind is available
  useEffect(() => {
    async function checkPagefind() {
      try {
        const response = await fetch('/pagefind/pagefind.js', { method: 'HEAD' });
        setPagefindAvailable(response.ok);
      } catch {
        // Silently fail - Pagefind not available in dev mode
        setPagefindAvailable(false);
      }
    }
    // Only check in production or if not already checked
    if (import.meta.env.PROD) {
      checkPagefind();
    } else {
      // In dev mode, default to fuzzy search
      setPagefindAvailable(false);
    }
  }, []);

  const setSearchProvider = (newProvider: SearchProvider) => {
    setProvider(newProvider);
    localStorage.setItem(STORAGE_KEY, newProvider);
  };

  // Fall back to fuzzy if Pagefind is selected but not available
  const effectiveProvider = provider === 'pagefind' && !pagefindAvailable ? 'fuzzy' : provider;

  return {
    provider: effectiveProvider,
    setProvider: setSearchProvider,
    pagefindAvailable,
  };
}
