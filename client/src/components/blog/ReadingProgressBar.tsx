import { useEffect, useRef, useState } from "react";

export function ReadingProgressBar() {
  const [progress, setProgress] = useState(0);
  const rafId = useRef<number>(0);

  useEffect(() => {
    const article = document.querySelector("article");
    if (!article) return;

    let articleHeight = article.offsetHeight;

    const update = () => {
      const rect = article.getBoundingClientRect();
      const scrolled = -rect.top;
      const pct = Math.min(100, Math.max(0, (scrolled / (articleHeight - window.innerHeight)) * 100));
      setProgress(pct);
    };

    const handleScroll = () => {
      cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(update);
    };

    const ro = new ResizeObserver(() => {
      articleHeight = article.offsetHeight;
    });
    ro.observe(article);

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(rafId.current);
      ro.disconnect();
    };
  }, []);

  if (progress === 0) return null;

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Reading progress"
      className="fixed top-0 left-0 z-[100] h-0.5 bg-[var(--color-accent)] transition-[width] duration-100"
      style={{ width: `${progress}%` }}
    />
  );
}
