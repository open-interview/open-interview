import { useLocation } from "wouter";
import type { ReactNode } from "react";

const pageTransitionStyle = {
  animation: "fade-in-up 0.2s ease-out",
};

export function usePageTransition() {
  const [location] = useLocation();

  return { style: pageTransitionStyle, key: location };
}

export function RouteTransition({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return (
    <div key={location} style={pageTransitionStyle}>
      {children}
    </div>
  );
}
