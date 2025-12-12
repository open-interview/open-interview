// Google Analytics Integration for Code Reels
// This module handles all analytics tracking

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

// Initialize Google Analytics
export function initializeAnalytics(measurementId: string) {
  if (!measurementId) {
    console.warn('Google Analytics Measurement ID not provided');
    return;
  }

  // Create script element
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  // Initialize dataLayer
  window.dataLayer = window.dataLayer || [];
  
  // Define gtag function
  function gtag(...args: any[]) {
    window.dataLayer.push(arguments);
  }
  
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', measurementId, {
    'anonymize_ip': true,
    'allow_google_signals': false,
    'allow_ad_personalization_signals': false,
  });
}

// Track page views
export function trackPageView(path: string, title: string) {
  if (!window.gtag) return;
  
  window.gtag('event', 'page_view', {
    'page_path': path,
    'page_title': title,
  });
}

// Track custom events
export function trackEvent(eventName: string, eventData?: Record<string, any>) {
  if (!window.gtag) return;
  
  window.gtag('event', eventName, eventData || {});
}

// Track channel selection
export function trackChannelSelect(channelId: string, channelName: string) {
  trackEvent('channel_select', {
    'channel_id': channelId,
    'channel_name': channelName,
  });
}

// Track question viewed
export function trackQuestionView(questionId: string, channel: string, difficulty: string) {
  trackEvent('question_view', {
    'question_id': questionId,
    'channel': channel,
    'difficulty': difficulty,
  });
}

// Track question completed
export function trackQuestionCompleted(questionId: string, channel: string, timeSpent: number) {
  trackEvent('question_completed', {
    'question_id': questionId,
    'channel': channel,
    'time_spent_seconds': timeSpent,
  });
}

// Track answer revealed
export function trackAnswerRevealed(questionId: string, timeToReveal: number) {
  trackEvent('answer_revealed', {
    'question_id': questionId,
    'time_to_reveal_seconds': timeToReveal,
  });
}

// Track LinkedIn post shared
export function trackLinkedInShare(questionId: string, channel: string) {
  trackEvent('linkedin_share', {
    'question_id': questionId,
    'channel': channel,
  });
}

// Track LinkedIn post downloaded
export function trackLinkedInDownload(questionId: string, format: string) {
  trackEvent('linkedin_download', {
    'question_id': questionId,
    'format': format, // 'image' or 'text'
  });
}

// Track stats page view
export function trackStatsView() {
  trackEvent('stats_view', {
    'timestamp': new Date().toISOString(),
  });
}

// Track about page view
export function trackAboutView() {
  trackEvent('about_view', {
    'timestamp': new Date().toISOString(),
  });
}

// Track easter egg unlocked
export function trackEasterEggUnlocked(eggName: string) {
  trackEvent('easter_egg_unlocked', {
    'egg_name': eggName,
  });
}

// Track GitHub link clicked
export function trackGitHubClick(linkType: string) {
  trackEvent('github_click', {
    'link_type': linkType, // 'star', 'issue', 'repo', 'discussions'
  });
}

// Track timer usage
export function trackTimerUsage(enabled: boolean, duration: number) {
  trackEvent('timer_usage', {
    'timer_enabled': enabled,
    'timer_duration_seconds': duration,
  });
}

// Track theme change
export function trackThemeChange(theme: string) {
  trackEvent('theme_change', {
    'theme': theme,
  });
}

// Track session duration
export function trackSessionDuration(durationSeconds: number) {
  trackEvent('session_duration', {
    'duration_seconds': durationSeconds,
  });
}

// Track user engagement
export function trackUserEngagement(engagementType: string, metadata?: Record<string, any>) {
  trackEvent('user_engagement', {
    'engagement_type': engagementType,
    ...metadata,
  });
}

// Track error
export function trackError(errorMessage: string, errorContext?: string) {
  trackEvent('error', {
    'error_message': errorMessage,
    'error_context': errorContext,
  });
}

// Set user properties
export function setUserProperties(userId?: string, userProperties?: Record<string, any>) {
  if (!window.gtag) return;
  
  const properties: Record<string, any> = {
    'anonymize_ip': true,
  };
  
  if (userId) {
    properties['user_id'] = userId;
  }
  
  if (userProperties) {
    Object.assign(properties, userProperties);
  }
  
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-47MSM57H95';
  window.gtag('config', measurementId, properties);
}

// Track conversion
export function trackConversion(conversionName: string, value?: number) {
  trackEvent('conversion', {
    'conversion_name': conversionName,
    'value': value,
  });
}
