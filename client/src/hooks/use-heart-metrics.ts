import { useEffect, useRef, useState } from 'react';
import {
  trackEvent,
  trackUserEngagement,
  trackHEARTNPS,
  trackHEARTCSAT,
  trackHEARTFeatureUsage,
  trackHEARTSessionsPerDay,
  trackHEARTNewUserActivation,
  trackHEARTFeatureAdoption,
  trackHEARTRetention,
  trackHEARTChurnRisk,
  trackHEARTTaskSuccess,
  trackHEARTChallengeCompletion,
  trackHEARTBookmarkRate,
  trackHEARTShareRate,
  trackHEARTError,
} from '../lib/analytics';

// ============================================
// HEART Framework Metrics Tracking
// Happiness, Engagement, Adoption, Retention, Task Success
// ============================================

interface HEARTMetrics {
  // Happiness
  npsScore?: number;
  csatRating?: number;
  // Engagement
  sessionsPerDay?: number;
  featuresUsed?: string[];
  timeOnTask?: number;
  // Adoption
  isNewUser?: boolean;
  featureAdoptionRate?: Record<string, boolean>;
  // Retention
  d1Retention?: boolean;
  d7Retention?: boolean;
  d30Retention?: boolean;
  // Task Success
  completionRate?: number;
  errorRate?: number;
}

// Session storage keys
const SESSION_KEY = 'heart_metrics_session';
const USER_KEY = 'heart_metrics_user';

interface SessionData {
  sessionCount: number;
  lastSessionDate: string;
  featuresUsed: string[];
  challengesCompleted: number;
  challengesStarted: number;
  errorsEncountered: number;
  totalTimeOnTasks: number;
  taskCount: number;
}

interface UserData {
  firstSeen: string;
  userId: string;
  npsSubmitted: boolean;
  npsScore?: number;
  csatRatings: Array<{ rating: number; timestamp: string }>;
}

function getSessionData(): SessionData {
  try {
    const data = sessionStorage.getItem(SESSION_KEY);
    return data ? JSON.parse(data) : {
      sessionCount: 0,
      lastSessionDate: '',
      featuresUsed: [],
      challengesCompleted: 0,
      challengesStarted: 0,
      errorsEncountered: 0,
      totalTimeOnTasks: 0,
      taskCount: 0,
    };
  } catch {
    return {
      sessionCount: 0,
      lastSessionDate: '',
      featuresUsed: [],
      challengesCompleted: 0,
      challengesStarted: 0,
      errorsEncountered: 0,
      totalTimeOnTasks: 0,
      taskCount: 0,
    };
  }
}

function saveSessionData(data: SessionData) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
}

function getUserData(): UserData {
  try {
    const data = localStorage.getItem(USER_KEY);
    return data ? JSON.parse(data) : {
      firstSeen: new Date().toISOString(),
      userId: generateUserId(),
      npsSubmitted: false,
      csatRatings: [],
    };
  } catch {
    return {
      firstSeen: new Date().toISOString(),
      userId: generateUserId(),
      npsSubmitted: false,
      csatRatings: [],
    };
  }
}

function saveUserData(data: UserData) {
  localStorage.setItem(USER_KEY, JSON.stringify(data));
}

function generateUserId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================
// Hook: Main HEART Metrics Tracker
// ============================================
export function useHEARTMetrics() {
  const sessionDataRef = useRef<SessionData>(getSessionData());
  const userDataRef = useRef<UserData>(getUserData());
  const sessionStartRef = useRef<number>(Date.now());
  const taskStartRef = useRef<number | null>(null);

  // Initialize session
  useEffect(() => {
    const sessionData = sessionDataRef.current;
    sessionData.sessionCount += 1;
    sessionData.lastSessionDate = new Date().toISOString();
    saveSessionData(sessionData);

    // Track session start
    trackEvent('heart_session_start', {
      'session_count': sessionData.sessionCount,
      'is_new_user': !localStorage.getItem(USER_KEY),
    });

    // Check retention
    checkRetention();

    return () => {
      // Track session end
      const duration = Math.floor((Date.now() - sessionStartRef.current) / 1000);
      trackEvent('heart_session_end', {
        'session_duration_seconds': duration,
        'session_count': sessionData.sessionCount,
      });
    };
  }, []);

  // Check retention based on first seen date
  function checkRetention() {
    const userData = userDataRef.current;
    const firstSeen = new Date(userData.firstSeen);
    const now = new Date();
    const daysSinceFirstSeen = Math.floor((now.getTime() - firstSeen.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceFirstSeen === 1) {
      trackEvent('heart_retention', { 'retention_type': 'D1', 'retained': true });
    } else if (daysSinceFirstSeen === 7) {
      trackEvent('heart_retention', { 'retention_type': 'D7', 'retained': true });
    } else if (daysSinceFirstSeen === 30) {
      trackEvent('heart_retention', { 'retention_type': 'D30', 'retained': true });
    }
  }

  // ============================================
  // Happiness Tracking
  // ============================================
  function trackNPS(score: number, feedback?: string) {
    const userData = userDataRef.current;
    userData.npsSubmitted = true;
    userData.npsScore = score;
    saveUserData(userData);

    trackEvent('heart_nps', {
      'nps_score': score,
      'nps_category': score >= 9 ? 'promoter' : score >= 7 ? 'passive' : 'detractor',
      'feedback': feedback || '',
      'session_count': sessionDataRef.current.sessionCount,
    });
  }

  function trackCSAT(rating: number, context?: string) {
    const userData = userDataRef.current;
    userData.csatRatings.push({ rating, timestamp: new Date().toISOString() });
    saveUserData(userData);

    trackEvent('heart_csat', {
      'csat_rating': rating,
      'csat_context': context || 'general',
      'session_count': sessionDataRef.current.sessionCount,
    });
  }

  // ============================================
  // Engagement Tracking
  // ============================================
  function trackFeatureUsed(featureName: string) {
    const sessionData = sessionDataRef.current;
    if (!sessionData.featuresUsed.includes(featureName)) {
      sessionData.featuresUsed.push(featureName);
      saveSessionData(sessionData);
    }

    trackEvent('heart_feature_used', {
      'feature_name': featureName,
      'session_count': sessionData.sessionCount,
    });
  }

  function trackSessionsPerDay() {
    const userData = userDataRef.current;
    const firstSeen = new Date(userData.firstSeen);
    const now = new Date();
    const daysSinceFirstSeen = Math.max(1, Math.floor((now.getTime() - firstSeen.getTime()) / (1000 * 60 * 60 * 24)));
    const sessionsPerDay = sessionDataRef.current.sessionCount / daysSinceFirstSeen;

    trackEvent('heart_engagement', {
      'engagement_type': 'sessions_per_day',
      'sessions_per_day': sessionsPerDay,
      'total_sessions': sessionDataRef.current.sessionCount,
      'days_since_first_seen': daysSinceFirstSeen,
    });
  }

  // ============================================
  // Adoption Tracking
  // ============================================
  function trackNewUserActivation(completedOnboarding: boolean) {
    const userData = userDataRef.current;
    const isNewUser = !localStorage.getItem(`${USER_KEY}_activated`);

    trackEvent('heart_adoption', {
      'adoption_type': 'new_user_activation',
      'is_new_user': isNewUser,
      'completed_onboarding': completedOnboarding,
      'days_since_signup': Math.floor((Date.now() - new Date(userData.firstSeen).getTime()) / (1000 * 60 * 60 * 24)),
    });

    if (completedOnboarding) {
      localStorage.setItem(`${USER_KEY}_activated`, 'true');
    }
  }

  function trackFeatureAdoption(featureName: string, adopted: boolean) {
    trackEvent('heart_adoption', {
      'adoption_type': 'feature_adoption',
      'feature_name': featureName,
      'adopted': adopted,
      'session_count': sessionDataRef.current.sessionCount,
    });
  }

  // ============================================
  // Retention Tracking
  // ============================================
  function trackChurnRisk(reason?: string) {
    trackEvent('heart_churn_risk', {
      'churn_reason': reason || 'unknown',
      'session_count': sessionDataRef.current.sessionCount,
      'days_since_first_seen': Math.floor((Date.now() - new Date(userDataRef.current.firstSeen).getTime()) / (1000 * 60 * 60 * 24)),
    });
  }

  // ============================================
  // Task Success Tracking
  // ============================================
  function startTask(taskName: string) {
    taskStartRef.current = Date.now();
    trackEvent('heart_task_start', {
      'task_name': taskName,
    });
  }

  function completeTask(taskName: string, success: boolean, metadata?: Record<string, any>) {
    const sessionData = sessionDataRef.current;
    sessionData.challengesStarted += 1;
    if (success) {
      sessionData.challengesCompleted += 1;
    }
    saveSessionData(sessionData);

    const timeOnTask = taskStartRef.current ? Math.floor((Date.now() - taskStartRef.current) / 1000) : 0;
    sessionData.totalTimeOnTasks += timeOnTask;
    sessionData.taskCount += 1;
    saveSessionData(sessionData);

    trackEvent('heart_task_success', {
      'task_name': taskName,
      'success': success,
      'time_on_task_seconds': timeOnTask,
      'completion_rate': sessionData.challengesCompleted / Math.max(1, sessionData.challengesStarted),
    });

    taskStartRef.current = null;
  }

  function trackError(errorType: string, errorMessage: string, context?: string) {
    const sessionData = sessionDataRef.current;
    sessionData.errorsEncountered += 1;
    saveSessionData(sessionData);

    trackEvent('heart_error', {
      'error_type': errorType,
      'error_message': errorMessage,
      'error_context': context || '',
      'session_count': sessionData.sessionCount,
    });
  }

  function getCompletionRate(): number {
    const sessionData = sessionDataRef.current;
    return sessionData.challengesCompleted / Math.max(1, sessionData.challengesStarted);
  }

  function getErrorRate(): number {
    const sessionData = sessionDataRef.current;
    return sessionData.errorsEncountered / Math.max(1, sessionData.taskCount);
  }

  function getAverageTimeOnTask(): number {
    const sessionData = sessionDataRef.current;
    return sessionData.totalTimeOnTasks / Math.max(1, sessionData.taskCount);
  }

  // ============================================
  // Key User Journey Tracking
  // ============================================
  function trackChallengeCompletion(challengeId: string, channel: string, timeSpent: number, difficulty: string) {
    completeTask('challenge_completion', true, {
      'challenge_id': challengeId,
      'channel': channel,
      'difficulty': difficulty,
      'time_spent_seconds': timeSpent,
    });
  }

  function trackBookmarkRate(itemId: string, itemType: string, bookmarked: boolean) {
    trackEvent('heart_bookmark', {
      'item_id': itemId,
      'item_type': itemType,
      'bookmarked': bookmarked,
      'session_count': sessionDataRef.current.sessionCount,
    });
  }

  function trackShareRate(itemId: string, itemType: string, platform: string) {
    trackEvent('heart_share', {
      'item_id': itemId,
      'item_type': itemType,
      'platform': platform,
      'session_count': sessionDataRef.current.sessionCount,
    });
  }

  return {
    // Happiness
    trackNPS,
    trackCSAT,
    // Engagement
    trackFeatureUsed,
    trackSessionsPerDay,
    // Adoption
    trackNewUserActivation,
    trackFeatureAdoption,
    // Retention
    trackChurnRisk,
    // Task Success
    startTask,
    completeTask,
    trackError,
    getCompletionRate,
    getErrorRate,
    getAverageTimeOnTask,
    // Key Journeys
    trackChallengeCompletion,
    trackBookmarkRate,
    trackShareRate,
    // Utilities
    getSessionCount: () => sessionDataRef.current.sessionCount,
    getFeaturesUsed: () => sessionDataRef.current.featuresUsed,
    isNewUser: () => !localStorage.getItem(`${USER_KEY}_activated`),
  };
}

// ============================================
// Hook: NPS Survey Display
// ============================================
export function useNPSSurvey() {
  const [showNPS, setShowNPS] = useState(false);
  const { trackNPS } = useHEARTMetrics();

  useEffect(() => {
    const userData = getUserData();
    const sessionData = getSessionData();

    // Show NPS after 5 sessions and not submitted before
    if (sessionData.sessionCount >= 5 && !userData.npsSubmitted) {
      // Delay showing by 30 seconds to not interrupt user
      const timer = setTimeout(() => {
        setShowNPS(true);
      }, 30000);

      return () => clearTimeout(timer);
    }
  }, []);

  function submitNPS(score: number, feedback?: string) {
    trackNPS(score, feedback);
    setShowNPS(false);
  }

  function dismissNPS() {
    // Mark as dismissed to not show again this session
    const userData = getUserData();
    userData.npsSubmitted = true;
    saveUserData(userData);
    setShowNPS(false);
  }

  return {
    showNPS,
    submitNPS,
    dismissNPS,
  };
}

// ============================================
// Hook: Session Tracking for HEART
// ============================================
export function useHEARTSessionTracking() {
  const { trackFeatureUsed, trackSessionsPerDay } = useHEARTMetrics();

  useEffect(() => {
    // Track page views as feature usage
    const handleRouteChange = () => {
      trackFeatureUsed('page_view');
    };

    // Track initial page load
    handleRouteChange();

    // Track sessions per day periodically
    const interval = setInterval(() => {
      trackSessionsPerDay();
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }, []);
}
