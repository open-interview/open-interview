import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

export function SubscriptionGate({ children }: Props) {
  return <>{children}</>;
}
