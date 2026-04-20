/**
 * Unified Components Library
 * 
 * Export all unified components for easy importing
 */

// Voice Recording Components
export { RecordingPanel } from './RecordingPanel';
export { TranscriptDisplay } from './TranscriptDisplay';
export { RecordingControls } from './RecordingControls';
export { WordCountProgress } from './WordCountProgress';
export { RecordingTimer } from './RecordingTimer';

// Core UI Components
export { 
  Card, 
  CardHeader, 
  CardFooter, 
  CardSection,
  InteractiveCard,
  StatCard,
  EmptyCard,
  type CardVariant,
  type CardSize,
  type CardRounded
} from './Card';

export { 
  ProgressBar, 
  SegmentedProgressBar,
  type ProgressBarSize,
  type ProgressBarVariant
} from './ProgressBar';

export { 
  DifficultyBadge, 
  DifficultyIndicator,
  DifficultyProgress,
  type DifficultyLevel,
  type DifficultyBadgeSize,
  type DifficultyBadgeVariant
} from './DifficultyBadge';

export {
  Button,
  MotionButton,
  IconButton,
  ButtonGroup,
  type ButtonVariant,
  type ButtonSize,
  type ButtonRounded
} from './Button';

export {
  QuestionCard,
  CompactQuestionCard,
  MinimalQuestionCard,
  type QuestionCardVariant,
  type QuestionCardSize
} from './QuestionCard';

export {
  QuestionHistoryIcon,
  type QuestionType,
  type EventType,
  type EventSource,
  type HistoryRecord,
  type HistorySummary
} from './QuestionHistory';

export {
  MetricCard,
  CompactMetricCard,
  MetricGrid,
  type MetricCardVariant,
  type MetricCardSize
} from './MetricCard';

export {
  EmptyState,
  CompactEmptyState,
  EmptyStateCard,
  type EmptyStateVariant,
  type EmptyStateSize
} from './EmptyState';

// Achievement System Components
export {
  AchievementCard,
  AchievementGrid
} from './AchievementCard';

export {
  LevelDisplay,
  LevelBadge
} from './LevelDisplay';
