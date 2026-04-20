/**
 * Services Index
 * Central export point for all application services
 */

// API Service
export { 
  api,
  ChannelService,
  QuestionService,
  StatsService,
  CodingService,
  CacheUtils,
} from './api.service';

// Storage Service
export {
  storage,
  PreferencesStorage,
  ThemeStorage,
  NotificationsStorage,
  ProgressStorage,
  TimerStorage,
  ActivityStorage,
  OnboardingStorage,
} from './storage.service';

// Recommendation Service
export {
  RecommendationService,
  type ChannelEngagement,
  type NewQuestionAlert,
  type Recommendation,
  type UserEngagementData,
} from './recommendation.service';
