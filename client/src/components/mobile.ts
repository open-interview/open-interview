/**
 * Mobile-First Components Export
 * Central export point for all mobile-first UI components
 */

// Layout Components
export {
  MobileFirstLayout,
  MobileFirstHeader,
  MobileFirstBottomNav,
  type MobileFirstLayoutProps
} from './layout/MobileFirstLayout';

// Page Templates
export {
  PageTemplate,
  HomeTemplate,
  ListTemplate,
  DetailTemplate,
  SettingsTemplate,
  PracticeTemplate,
  CardGrid,
  Section,
  EmptyState,
  LoadingState,
  ErrorState
} from './layout/MobilePageTemplates';

// UI Components
export {
  MobileCard,
  MobileListItem,
  MobileExpandableCard,
  MobileStatsCard,
  MobileActionButton,
  MobileToggleGroup,
  MobileAlert,
  MobileSearchBar,
  MobileFilterChip,
  MobileFAB
} from './ui/MobileComponents';
// Note: MobileComponents path verified - exports mobile-specific UI components

// Interactive Components
export { PullToRefresh } from './mobile/PullToRefresh';
export { SwipeableCard } from './mobile/SwipeableCard';
export {
  SkeletonList,
  SkeletonCard,
  SkeletonGrid,
  SkeletonText,
  SkeletonAvatar
} from './mobile/SkeletonList';

// Legacy Mobile Components
export { FloatingButton } from './mobile/FloatingButton';
