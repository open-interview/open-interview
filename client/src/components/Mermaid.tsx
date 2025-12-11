import { useEffect, useRef, useState, useCallback } from 'react';

interface MermaidProps {
  chart: string;
}

// Lazy load mermaid to avoid SSR issues
let mermaidPromise: Promise<typeof import('mermaid')> | null = null;
const getMermaid = () => {
  if (!mermaidPromise) {
    mermaidPromise = import('mermaid').then((m) => {
      m.default.initialize({
        startOnLoad: false,
        theme: 'dark',
        securityLevel: 'loose',
        fontFamily: 'monospace',
        flowchart: {
          useMaxWidth: true,
          htmlLabels: true,
          curve: 'basis',
        },
        themeVariables: {
          primaryColor: '#22c55e',
          primaryTextColor: '#fff',
          primaryBorderColor: '#22c55e',
          lineColor: '#666',
          secondaryColor: '#1a1a1a',
          tertiaryColor: '#333',
          background: '#0a0a0a',
          mainBkg: '#1a1a1a',
          nodeBorder: '#22c55e',
          clusterBkg: '#1a1a1a',
          clusterBorder: '#333',
          titleColor: '#fff',
          edgeLabelBackground: '#1a1a1a',
        },
      });
      return m;
    });
  }
  return mermaidPromise;
};

export function Mermaid({ chart }: MermaidProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const renderIdRef = useRef(0);

  const renderDiagram = useCallback(async () => {
    if (!ref.current || !chart) return;
    
    const currentRenderId = ++renderIdRef.current;
    setIsLoading(true);
    setError(null);
    
    try {
      const mermaidModule = await getMermaid();
      const mermaid = mermaidModule.default;
      
      // Check if this render is still current
      if (currentRenderId !== renderIdRef.current) return;
      
      const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Clean the chart string
      const cleanChart = chart.trim();
      
      const { svg } = await mermaid.render(id, cleanChart);
      
      // Check again if this render is still current
      if (currentRenderId !== renderIdRef.current) return;
      
      if (ref.current) {
        ref.current.innerHTML = svg;
        
        // Make SVG responsive
        const svgElement = ref.current.querySelector('svg');
        if (svgElement) {
          svgElement.style.maxWidth = '100%';
          svgElement.style.height = 'auto';
          svgElement.style.minHeight = '100px';
        }
        
        setError(null);
      }
    } catch (err) {
      console.error("Mermaid render error:", err);
      if (currentRenderId === renderIdRef.current) {
        setError("Failed to render diagram");
      }
    } finally {
      if (currentRenderId === renderIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [chart]);

  useEffect(() => {
    renderDiagram();
  }, [renderDiagram]);

  if (error) {
    return (
      <div className="w-full p-3 sm:p-4 border border-red-500/50 bg-red-500/10 rounded text-red-400 text-xs font-mono">
        {error}
        <pre className="mt-2 text-[9px] sm:text-[10px] opacity-50 overflow-x-auto whitespace-pre-wrap break-all">{chart}</pre>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full flex justify-center items-center py-8">
        <div className="text-xs text-white/30 animate-pulse">Loading diagram...</div>
      </div>
    );
  }

  return (
    <div 
      ref={ref} 
      className="w-full flex justify-center my-2 sm:my-4 overflow-x-auto mermaid-container"
      style={{ minHeight: '100px' }}
    />
  );
}
