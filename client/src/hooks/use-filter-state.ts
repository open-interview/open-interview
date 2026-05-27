import { useEffect, useState } from 'react';
import type { FilterState } from '@/types/swipe';
import { getEnrolledChannels, getEnrolledCerts } from '@/lib/enrollment-service';

const STORAGE_KEY = 'oi-filter-state';

const DEFAULT_FILTER: FilterState = {
  scope: 'all',
  mode: 'due',
  cardType: 'all',
};

interface UseFilterStateReturn {
  filter: FilterState;
  setFilter: (f: Partial<FilterState>) => void;
  resetFilter: () => void;
  activeChannel: string | null;
}

function loadFilter(): FilterState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as FilterState;
    }
  } catch {
    /* ignore */
  }
  const enrolled = getEnrolledChannels();
  if (enrolled.length > 0) {
    return { ...DEFAULT_FILTER };
  }
  return { ...DEFAULT_FILTER, pendingEnrollment: true };
}

export function isChannelInScope(channelId: string, filter: FilterState): boolean {
  if (filter.scope !== 'all') return true;
  const enrolled = getEnrolledChannels();
  if (enrolled.length === 0) return true;
  return enrolled.includes(channelId);
}

export function useFilterState(): UseFilterStateReturn {
  const [filter, setFilterState] = useState<FilterState>(loadFilter);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filter));
  }, [filter]);

  const setFilter = (f: Partial<FilterState>) => {
    setFilterState((prev) => ({ ...prev, ...f }));
  };

  const resetFilter = () => {
    const enrolled = getEnrolledChannels();
    if (enrolled.length > 0) {
      setFilterState({ ...DEFAULT_FILTER });
    } else {
      setFilterState({ ...DEFAULT_FILTER, pendingEnrollment: true });
    }
  };

  const activeChannel =
    filter.scope === 'topic' || filter.scope === 'cert'
      ? filter.channelId ?? null
      : null;

  return { filter, setFilter, resetFilter, activeChannel };
}
