import { SearchModal } from './SearchModal';
import { PagefindSearch } from './PagefindSearch';
import { useSearchProvider } from '@/hooks/use-search-provider';

interface UnifiedSearchProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

/**
 * Unified search component that switches between fuzzy search and Pagefind
 * based on user preference and availability.
 */
export function UnifiedSearch({ isOpen, onClose, initialQuery }: UnifiedSearchProps) {
  const { provider } = useSearchProvider();

  if (provider === 'pagefind') {
    return <PagefindSearch isOpen={isOpen} onClose={onClose} />;
  }

  return <SearchModal isOpen={isOpen} onClose={onClose} initialQuery={initialQuery} />;
}
