import { useEffect, useRef, useState } from "react";

type ScrollDirection = "up" | "down" | null;

interface UseScrollDirectionOptions {
  threshold?: number;
}

interface UseScrollDirectionReturn {
  scrollY: number;
  direction: ScrollDirection;
  isScrolled: boolean;
}

export function useScrollDirection(
  options: UseScrollDirectionOptions = {}
): UseScrollDirectionReturn {
  const { threshold = 0 } = options;
  const [scrollY, setScrollY] = useState(0);
  const [direction, setDirection] = useState<ScrollDirection>(null);
  const lastY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      setScrollY(y);
      setDirection(y > lastY.current ? "down" : y < lastY.current ? "up" : null);
      lastY.current = y;
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return { scrollY, direction, isScrolled: scrollY > threshold };
}
