/**
 * useSubscriptions — thin wrapper over useUserPreferences
 * Single source of truth for subscribed topics + certs.
 */
import { useUserPreferences } from '../context/UserPreferencesContext';
import { allChannelsConfig, getRecommendedChannels } from '../lib/channels-config';

const CERT_STORAGE_KEY = 'subscribedCertifications';

function loadSubscribedCerts(): Set<string> {
  try {
    const raw = localStorage.getItem(CERT_STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}

function saveSubscribedCerts(ids: Set<string>) {
  try { localStorage.setItem(CERT_STORAGE_KEY, JSON.stringify(Array.from(ids))); } catch {}
}

export function useSubscriptions() {
  const {
    preferences,
    setRole,
    toggleSubscription,
    skipOnboarding,
    needsOnboarding,
  } = useUserPreferences();

  const subscribedChannelIds = preferences.subscribedChannels;

  const subscribedChannels = allChannelsConfig.filter(
    c => !c.isCertification && subscribedChannelIds.includes(c.id)
  );

  const subscribedCertChannels = allChannelsConfig.filter(
    c => c.isCertification && subscribedChannelIds.includes(c.id)
  );

  const isChannelSubscribed = (id: string) => subscribedChannelIds.includes(id);

  const getRecommendedForRole = (roleId: string) =>
    getRecommendedChannels(roleId).filter(c => !c.isCertification);

  return {
    subscribedChannelIds,
    subscribedChannels,
    subscribedCertChannels,
    isChannelSubscribed,
    toggleSubscription,
    setRole,
    skipOnboarding,
    needsOnboarding,
    role: preferences.role,
    onboardingComplete: preferences.onboardingComplete,
    getRecommendedForRole,
  };
}
