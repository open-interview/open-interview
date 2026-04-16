import { useEffect, useRef, useState } from "react";

interface ScrollAnimationOptions {
  threshold?: number;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
}

export function useScrollAnimation<T extends Element = HTMLDivElement>(
  options: ScrollAnimationOptions = {}
) {
  const { threshold = 0.1, delay = 0, direction = "up" } = options;
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  const prefersReduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (prefersReduced) {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (delay) {
            setTimeout(() => setInView(true), delay);
          } else {
            setInView(true);
          }
          observer.disconnect();
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, delay, prefersReduced]);

  const translate = {
    up: "translateY(16px)",
    down: "translateY(-16px)",
    left: "translateX(16px)",
    right: "translateX(-16px)",
    none: "none",
  }[direction];

  const style: React.CSSProperties = prefersReduced
    ? {}
    : {
        opacity: inView ? 1 : 0,
        transform: inView ? "none" : translate,
        transition: `opacity 0.4s ease, transform 0.4s ease`,
        transitionDelay: delay ? `${delay}ms` : undefined,
      };

  return { ref, inView, style };
}
