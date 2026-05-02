import { useState, useEffect, useCallback } from 'react';

const RECENT_SEARCHES_KEY = 'devinsights-recent-searches';
const MAX_RECENT = 10;

export interface SearchHistoryItem {
  query: string;
  timestamp: number;
  resultCount?: number;
}

export function useSearchHistory() {
  const [recentSearches, setRecentSearches] = useState<SearchHistoryItem[]>([]);
  const [trendingSearches, setTrendingSearches] = useState<string[]>([
    'react hooks', 'system design', 'sql queries', 'kubernetes', 
    'typescript generics', 'docker compose', 'api design', 'git workflows'
  ]);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as SearchHistoryItem[];
        setRecentSearches(parsed.slice(0, MAX_RECENT));
      }
    } catch {
      // Silently fail
    }
  }, []);

  // Save a search to history
  const addToHistory = useCallback((query: string, resultCount?: number) => {
    if (!query.trim() || query.length < 2) return;
    
    setRecentSearches(prev => {
      const filtered = prev.filter(item => item.query !== query);
      const newItem: SearchHistoryItem = {
        query,
        timestamp: Date.now(),
        resultCount
      };
      const updated = [newItem, ...filtered].slice(0, MAX_RECENT);
      
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch {
        // Silently fail
      }
      
      return updated;
    });
  }, []);

  // Remove a specific search from history
  const removeFromHistory = useCallback((query: string) => {
    setRecentSearches(prev => {
      const updated = prev.filter(item => item.query !== query);
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch {
        // Silently fail
      }
      return updated;
    });
  }, []);

  // Clear all recent searches
  const clearHistory = useCallback(() => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {
      // Silently fail
    }
  }, []);

  return {
    recentSearches,
    trendingSearches,
    addToHistory,
    removeFromHistory,
    clearHistory
  };
}
