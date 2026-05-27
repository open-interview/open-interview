import { useEffect, useRef } from 'react';

interface MermaidDiagramProps {
  chart: string;
  className?: string;
}

export function MermaidDiagram({ chart, className }: MermaidDiagramProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || !chart) return;
    const el = ref.current;
    import('mermaid').then(({ default: mermaid }) => {
      mermaid.initialize({ startOnLoad: false, theme: 'dark' });
      const id = `mermaid-${Math.random().toString(36).slice(2)}`;
      try {
        mermaid.render(id, chart, (svg: string) => { el.innerHTML = svg; });
      } catch {
        el.textContent = chart;
      }
    });
  }, [chart]);

  return <div ref={ref} className={className} />;
}

export default MermaidDiagram;
