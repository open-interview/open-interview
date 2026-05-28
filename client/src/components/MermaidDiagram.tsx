import { useEffect, useRef, useState, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize2, Minimize2 } from 'lucide-react';

interface MermaidDiagramProps {
  chart: string;
  className?: string;
}

let mermaidInitialized = false;

async function renderMermaid(id: string, chart: string): Promise<string> {
  const mod = await import('mermaid');
  const mermaid = mod.default || (mod as any);

  if (!mermaidInitialized) {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      maxTextSize: 100000,
      securityLevel: 'loose',
    });
    mermaidInitialized = true;
  }

  // Create an off-screen container as mermaid v9 needs a real DOM element
  const container = document.createElement('div');
  container.id = `mermaid-container-${id}`;
  container.style.cssText = 'position:fixed;top:-9999px;left:-9999px;visibility:hidden;width:800px;';
  document.body.appendChild(container);

  try {
    let svgResult: string;

    // renderAsync exists in v9.4+ and v10; v10 returns { svg }, v9 returns string
    if (typeof mermaid.renderAsync === 'function') {
      const result = await mermaid.renderAsync(id, chart, undefined, container);
      svgResult = typeof result === 'string' ? result : (result as any)?.svg ?? '';
    } else {
      // Fallback to callback-based render
      svgResult = await new Promise<string>((resolve, reject) => {
        try {
          mermaid.render(id, chart, (svg: string) => resolve(svg), container);
        } catch (e) {
          reject(e);
        }
      });
    }

    return svgResult;
  } finally {
    try { document.body.removeChild(container); } catch {}
  }
}

export function MermaidDiagram({ chart, className }: MermaidDiagramProps) {
  const ref = useRef<HTMLDivElement>(null);
  const uid = useId().replace(/:/g, '');
  const [expanded, setExpanded] = useState(false);
  const [expandedSvg, setExpandedSvg] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!ref.current || !chart) return;
    const el = ref.current;
    let cancelled = false;
    setError(false);

    const id = `mmd-${uid}-${Math.random().toString(36).slice(2, 6)}`;

    renderMermaid(id, chart)
      .then((svg) => {
        if (cancelled || !el) return;
        el.innerHTML = svg;
        const svgEl = el.querySelector('svg');
        if (svgEl) {
          svgEl.setAttribute('width', '100%');
          svgEl.style.maxWidth = '100%';
          svgEl.removeAttribute('height');
        }
      })
      .catch(() => {
        if (!cancelled && el) setError(true);
      });

    return () => { cancelled = true; };
  }, [chart, uid]);

  const handleExpand = () => {
    setExpandedSvg(ref.current?.innerHTML || '');
    setExpanded(true);
  };

  if (error) {
    return (
      <pre className={`text-xs text-[#9ca3af] font-mono overflow-x-auto p-3 bg-[#1e1e1e] rounded-xl ${className ?? ''}`}>
        {chart}
      </pre>
    );
  }

  return (
    <>
      <div className={`relative group ${className ?? ''}`}>
        <div ref={ref} className="w-full overflow-x-auto min-h-[80px]" />
        <button
          onClick={handleExpand}
          className="absolute top-2 right-2 p-1.5 rounded-lg bg-[#1e1e1e]/80 backdrop-blur-sm border border-white/10 text-[#71767b] hover:text-[#e7e9ea] opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Expand diagram"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setExpanded(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-4xl max-h-[85vh] overflow-auto rounded-2xl bg-[#1e1e1e] border border-white/10 p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setExpanded(false)}
                className="absolute top-3 right-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#71767b] hover:text-[#e7e9ea] transition-all z-10"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
              <div
                className="w-full overflow-x-auto"
                dangerouslySetInnerHTML={{ __html: expandedSvg }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default MermaidDiagram;
