/**
 * SubscriptionGate — shows OnboardingFlow if user has no subscriptions yet.
 * Wraps AppContent in App.tsx.
 *
 * The gate is skipped for the landing page (/) and all blog routes so new
 * visitors always see the real page rather than the onboarding flow.
 */
import { useState } from 'react';
import { useLocation } from 'wouter';
import { useUserPreferences } from '../context/UserPreferencesContext';
import { OnboardingFlow } from './OnboardingFlow';

interface Props {
  children: React.ReactNode;
}

const UNBLOCKED_PREFIXES = ['/', '/blog', '/learning-paths'];

function isUnblocked(path: string): boolean {
  if (path === '/') return true;
  return UNBLOCKED_PREFIXES.some(prefix => prefix !== '/' && path.startsWith(prefix));
}

export function SubscriptionGate({ children }: Props) {
  const { needsOnboarding } = useUserPreferences();
  const [dismissed, setDismissed] = useState(false);
  const [location] = useLocation();

  if (needsOnboarding && !dismissed && !isUnblocked(location)) {
    return <OnboardingFlow onComplete={() => setDismissed(true)} />;
  }

  return <>{children}</>;
}
