import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
  fontFamily: 'JetBrains Mono',
});

interface MermaidProps {
  chart: string;
}

export function Mermaid({ chart }: MermaidProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ref.current) {
      const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
      
      // Clear previous content
      ref.current.innerHTML = '';
      
      try {
        mermaid.render(id, chart).then(({ svg }) => {
          if (ref.current) {
            ref.current.innerHTML = svg;
            setError(null);
          }
        }).catch((err) => {
          console.error("Mermaid render error:", err);
          setError("Failed to render diagram");
        });
      } catch (e) {
        console.error("Mermaid sync error:", e);
        setError("Invalid diagram syntax");
      }
    }
  }, [chart]);

  if (error) {
    return (
      <div className="w-full p-4 border border-red-500/50 bg-red-500/10 rounded text-red-400 text-xs font-mono">
        {error}
        <pre className="mt-2 text-[10px] opacity-50 overflow-x-auto">{chart}</pre>
      </div>
    );
  }

  return <div ref={ref} className="w-full flex justify-center my-4 overflow-x-auto mermaid-container" />;
}
