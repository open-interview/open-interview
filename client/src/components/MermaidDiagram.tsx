import { useEffect, useRef, useState, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize2, Minimize2 } from 'lucide-react';

interface MermaidDiagramProps {
  chart: string;
  className?: string;
}

async function renderMermaid(id: string, chart: string): Promise<string> {
  const mod = await import('mermaid');
  const mermaid = mod.default || (mod as any);

  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  mermaid.initialize({
    startOnLoad: false,
    theme: isDark ? 'dark' : 'base',
    maxTextSize: 100000,
    securityLevel: 'loose',
    themeVariables: isDark ? {
      primaryTextColor: '#e7e9ea',
      primaryColor: '#1e1e1e',
      primaryBorderColor: '#2f3336',
      lineColor: '#6b7280',
      secondaryColor: '#2d2d2d',
      secondaryTextColor: '#c9d1d9',
      tertiaryColor: '#16181c',
      clusterBkg: '#16181c',
      clusterBorder: '#2f3336',
      clusterTitleTextColor: '#e7e9ea',
      nodeTextColor: '#e7e9ea',
      edgeLabelBackground: '#1e1e1e',
      labelBoxBkgColor: '#2d2d2d',
      labelBoxBorderColor: '#2f3336',
      noteBkgColor: '#2d2d2d',
      noteTextColor: '#c9d1d9',
      noteBorderColor: '#2f3336',
    } : {
      primaryTextColor: '#1A1A18',
      primaryBorderColor: '#E8E7E2',
      lineColor: '#D0CFC8',
      tertiaryColor: '#F7F6F3',
      clusterBkg: '#F0EFEA',
      clusterBorder: '#E8E7E2',
      clusterTitleTextColor: '#1A1A18',
      nodeTextColor: '#1A1A18',
      labelBoxBorderColor: '#D0CFC8',
      noteBorderColor: '#D0CFC8',
    },
  });

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
          svgEl.removeAttribute('width');
          svgEl.removeAttribute('height');
          svgEl.style.maxWidth = '100%';
          svgEl.style.maxHeight = '280px';
          svgEl.style.width = 'auto';
          svgEl.style.height = 'auto';
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
      <pre className={`text-xs text-[var(--fg-muted)] font-mono overflow-x-auto p-3 bg-[var(--surface-elevated)] rounded-xl ${className ?? ''}`}>
        {chart}
      </pre>
    );
  }

  return (
    <>
      <div className={`relative group ${className ?? ''}`}>
        <div ref={ref} className="mermaid-container w-full min-h-[80px]" />
        <button
          onClick={handleExpand}
          className="absolute top-2 right-2 p-1.5 rounded-lg bg-[var(--surface-elevated)]/80 backdrop-blur-sm border border-[var(--border)] text-[var(--fg-muted)] hover:text-[var(--fg)] opacity-30 group-hover:opacity-100 transition-opacity"
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
              className="relative w-full max-w-4xl max-h-[85vh] overflow-auto rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)] p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setExpanded(false)}
                className="absolute top-3 right-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[var(--fg-muted)] hover:text-[var(--fg)] transition-all z-10"
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
