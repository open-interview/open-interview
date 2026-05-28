import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize2, Minimize2, Sparkles } from 'lucide-react';

interface MermaidDiagramProps {
  chart: string;
  className?: string;
}

export function MermaidDiagram({ chart, className }: MermaidDiagramProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [showAi, setShowAi] = useState(false);

  useEffect(() => {
    if (!ref.current || !chart) return;
    const el = ref.current;
    let cancelled = false;

    import('mermaid')
      .then((mod) => {
        if (cancelled) return;
        const mermaid = mod.default || mod;
        mermaid.initialize({ startOnLoad: false, theme: 'dark', maxTextSize: 100000 });
        const id = `mermaid-${Math.random().toString(36).slice(2, 10)}`;

        mermaid
          .renderAsync(id, chart)
          .then((svg: string) => {
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
            if (!cancelled) {
              el.textContent = chart;
            }
          });
      })
      .catch(() => {
        if (!cancelled) {
          el.textContent = chart;
        }
      });

    return () => {
      cancelled = true;
    };
  }, [chart]);

  return (
    <>
      <div className={`relative group ${className ?? ''}`}>
        <div ref={ref} className="w-full overflow-x-auto min-h-[200px]" />
        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setShowAi(!showAi)}
            className="p-1.5 rounded-lg bg-[var(--surface-elevated)]/80 backdrop-blur-sm border border-border/20 text-muted-foreground hover:text-cyan-400 hover:border-cyan-500/30 transition-all"
            aria-label="Explain with AI"
          >
            <Sparkles className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setExpanded(true)}
            className="p-1.5 rounded-lg bg-[var(--surface-elevated)]/80 backdrop-blur-sm border border-border/20 text-muted-foreground hover:text-foreground transition-all"
            aria-label="Expand diagram"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {showAi && (
        <div className="mt-2 p-3 rounded-xl ai-shimmer border border-cyan-500/10">
          <p className="text-xs text-cyan-300/80 leading-relaxed">
            This diagram shows the flow from client request through load balancing to response.
            Each node represents a system component in the architecture.
          </p>
        </div>
      )}

      {/* Fullscreen modal */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setExpanded(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-4xl max-h-[85vh] overflow-auto rounded-2xl bg-[var(--surface-raised)] border border-border/20 p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setExpanded(false)}
                className="absolute top-3 right-3 p-2 rounded-lg bg-accent/50 hover:bg-accent/80 text-muted-foreground hover:text-foreground transition-all z-10"
                aria-label="Close expanded view"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
              <div
                ref={(el) => {
                  if (!el) return;
                  const inner = el.querySelector('.mermaid-expand-content');
                  if (!inner) return;
                  const mermaidEl = inner.querySelector('svg');
                  if (mermaidEl) {
                    mermaidEl.style.maxWidth = '100%';
                    mermaidEl.style.width = '100%';
                    mermaidEl.style.height = 'auto';
                  }
                }}
              >
                <div
                  className="mermaid-expand-content"
                  dangerouslySetInnerHTML={{ __html: ref.current?.innerHTML || '' }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default MermaidDiagram;
