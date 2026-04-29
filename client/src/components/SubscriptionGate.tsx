/**
 * SubscriptionGate — passthrough wrapper.
 * Onboarding is handled in AppContent via google/Onboarding.tsx.
 */
interface Props {
  children: React.ReactNode;
}

export function SubscriptionGate({ children }: Props) {
  return <>{children}</>;
}
