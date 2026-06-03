import { useState } from 'react';
import type { ReactNode } from 'react';
import { OnboardingFlow } from './OnboardingFlow';
import { useUserPreferences } from '../context/UserPreferencesContext';

interface Props {
  children: ReactNode;
}

export function SubscriptionGate({ children }: Props) {
  const { needsOnboarding } = useUserPreferences();
  const [onboardingDone, setOnboardingDone] = useState(false);

  if (needsOnboarding && !onboardingDone) {
    return <OnboardingFlow onComplete={() => setOnboardingDone(true)} />;
  }

  return <>{children}</>;
}
