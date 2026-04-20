import { useEffect, useRef, useState } from "react";

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  contentRef: React.RefObject<HTMLElement>;
}

export function TableOfContents({ contentRef }: TableOfContentsProps) {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const observerRef = useRef<IntersectionObserver | undefined>(undefined);

  useEffect(() => {
    if (!contentRef.current) return;
    const els = Array.from(contentRef.current.querySelectorAll("h2, h3")) as HTMLHeadingElement[];
    const parsed: Heading[] = els.map((el) => ({
      id: el.id || el.textContent?.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "",
      text: el.textContent || "",
      level: parseInt(el.tagName[1]),
    }));
    // Ensure IDs are set on elements
    els.forEach((el, i) => {
      if (!el.id) el.id = parsed[i].id;
    });
    setHeadings(parsed);
  }, [contentRef]);

  useEffect(() => {
    if (headings.length === 0) return;
    observerRef.current?.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-80px 0px -60% 0px" }
    );
    headings.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observerRef.current?.observe(el);
    });
    return () => observerRef.current?.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav aria-label="Table of contents">
      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-muted)] mb-3">
        On this page
      </p>
      <ul className="space-y-1.5">
        {headings.map(({ id, text, level }) => (
          <li key={id} style={{ paddingLeft: level === 3 ? "0.75rem" : "0" }}>
            <a
              href={`#${id}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
              }}
              className={`block text-sm transition-colors hover:text-[var(--color-accent)] ${
                activeId === id
                  ? "text-[var(--color-accent)] font-medium"
                  : "text-[var(--color-ink-muted)]"
              }`}
            >
              {text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
