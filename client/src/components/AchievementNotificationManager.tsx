/**
 * Achievement & Badge Notification Manager
 * Bridge between AchievementContext/BadgeContext and UnifiedNotificationManager
 * Feeds achievements and badges into the unified queue system
 */

import { useEffect } from 'react';
import { useAchievementContext } from '../context/AchievementContext';
import { useBadgeContext } from '../context/BadgeContext';
import { useUnifiedNotifications } from './UnifiedNotificationManager';

export function AchievementNotificationManager() {
  const { pendingAchievements, consumePendingAchievement } = useAchievementContext();
  const { pendingBadges, consumePendingBadge } = useBadgeContext();
  const { showAchievement, showBadge } = useUnifiedNotifications();

  // Feed pending achievements into unified notification system
  useEffect(() => {
    if (pendingAchievements.length > 0) {
      const achievement = consumePendingAchievement();
      if (achievement) {
        showAchievement(achievement, achievement.rewards);
      }
    }
  }, [pendingAchievements, consumePendingAchievement, showAchievement]);

  // Feed pending badges into unified notification system
  useEffect(() => {
    if (pendingBadges.length > 0) {
      const badge = consumePendingBadge();
      if (badge) {
        showBadge(badge);
      }
    }
  }, [pendingBadges, consumePendingBadge, showBadge]);

  // No longer renders anything - unified system handles display
  return null;
}
