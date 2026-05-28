export function PullQuote({ text }: { text: string }) {
  return (
    <aside
      className="float-left mr-4 mb-2 w-1/3 max-w-[220px] border-l-2 border-[var(--fg-muted)] pl-4 italic text-[var(--fg)] text-[18px] leading-snug pullquote-float"
      style={{ shapeOutside: 'polygon(0 0, 100% 0, 90% 100%, 0 100%)', shapeMargin: '0.75rem' }}
    >
      &ldquo;{text}&rdquo;
    </aside>
  );
}
