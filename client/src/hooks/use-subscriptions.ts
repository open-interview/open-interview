/**
 * useSubscriptions — thin wrapper over useUserPreferences
 * Single source of truth for subscribed topics + certs.
 */
import { useUserPreferences } from '../context/UserPreferencesContext';
import { allChannelsConfig, getRecommendedChannels } from '../lib/channels-config';

export function useSubscriptions() {
  const {
    preferences,
    setRole,
    toggleSubscription,
    skipOnboarding,
    needsOnboarding,
    isSubscribed,
    isCertificationSubscribed,
    toggleCertificationSubscription,
  } = useUserPreferences();

  const subscribedChannelIds = preferences.subscribedChannels;
  const subscribedCertificationIds = preferences.subscribedCertifications ?? [];

  const subscribedChannels = allChannelsConfig.filter(
    c => !c.isCertification && subscribedChannelIds.includes(c.id)
  );

  const subscribedCertChannels = allChannelsConfig.filter(
    c => c.isCertification && subscribedChannelIds.includes(c.id)
  );

  const isChannelSubscribed = (id: string) => subscribedChannelIds.includes(id);

  /** True when user has at least one topic subscription */
  const hasSubscriptions = subscribedChannelIds.length > 0;

  /** True when user has at least one cert subscription */
  const hasCertSubscriptions = subscribedCertificationIds.length > 0;

  const getRecommendedForRole = (roleId: string) =>
    getRecommendedChannels(roleId).filter(c => !c.isCertification);

  return {
    subscribedChannelIds,
    subscribedCertificationIds,
    subscribedChannels,
    subscribedCertChannels,
    isChannelSubscribed,
    isSubscribed,
    isCertificationSubscribed,
    toggleSubscription,
    toggleCertificationSubscription,
    setRole,
    skipOnboarding,
    needsOnboarding,
    hasSubscriptions,
    hasCertSubscriptions,
    role: preferences.role,
    onboardingComplete: preferences.onboardingComplete,
    getRecommendedForRole,
  };
}
