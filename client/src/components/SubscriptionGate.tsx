/**
 * SubscriptionGate — shows OnboardingFlow if user has no subscriptions yet.
 * Wraps AppContent in App.tsx.
 */
import { useState } from 'react';
import { useUserPreferences } from '../context/UserPreferencesContext';
import { OnboardingFlow } from './OnboardingFlow';

interface Props {
  children: React.ReactNode;
}

export function SubscriptionGate({ children }: Props) {
  const { needsOnboarding } = useUserPreferences();
  const [dismissed, setDismissed] = useState(false);

  if (needsOnboarding && !dismissed) {
    return <OnboardingFlow onComplete={() => setDismissed(true)} />;
  }

  return <>{children}</>;
}
