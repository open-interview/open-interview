import { useEffect, useState, useRef } from "react";

export function ReadingProgressBar() {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const rafRef = useRef<number>();

  useEffect(() => {
    const article = document.querySelector("article");
    if (!article) return;

    const update = () => {
      const rect = article.getBoundingClientRect();
      const articleHeight = article.offsetHeight;
      const windowHeight = window.innerHeight;
      
      if (rect.top > windowHeight) {
        setProgress(0);
        setVisible(false);
        return;
      }

      setVisible(true);
      const scrolled = windowHeight - rect.top;
      const scrollable = articleHeight - windowHeight + 200;
      const pct = Math.min(100, Math.max(0, (scrolled / scrollable) * 100));
      setProgress(pct);
    };

    const onScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  if (!visible && progress === 0) return null;

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Reading progress"
      className="fixed top-0 left-0 right-0 z-[100] h-1 bg-transparent"
    >
      <div 
        className="h-full bg-gradient-to-r from-[var(--color-accent)] to-[#34A853] shadow-[0_0_10px_var(--color-accent)] transition-all duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
