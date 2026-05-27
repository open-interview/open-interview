import { useLocation } from "wouter";

const pageTransitionStyle = {
  animation: "fade-in-up 0.2s ease-out",
};

export function usePageTransition() {
  const [location] = useLocation();

  return { style: pageTransitionStyle, key: location };
}
