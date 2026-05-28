export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-[var(--accent)] focus:text-[var(--accent-fg)] focus:rounded-[8px] focus:text-sm focus:font-medium"
    >
      Skip to content
    </a>
  );
}
