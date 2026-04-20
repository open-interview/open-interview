/**
 * InteractiveDiagram — replaces Mermaid.tsx, MermaidDiagram.tsx, EnhancedMermaid.tsx
 *
 * Converts mermaid syntax → SVG via mermaid.render(), then attaches svg-pan-zoom
 * for fluid pan / zoom / drag interactivity directly on the SVG element.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, Maximize2, RotateCcw, Palette } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

// ─── Mermaid theme configs ────────────────────────────────────────────────────

type MermaidTheme = 'default' | 'neutral' | 'dark' | 'forest' | 'base';

const mermaidThemeConfigs: Record<MermaidTheme, object> = {
  default: {
    theme: 'default',
    themeVariables: {
      primaryColor: '#326ce5', primaryTextColor: '#fff',
      primaryBorderColor: '#326ce5', lineColor: '#666',
      secondaryColor: '#f4f4f4', tertiaryColor: '#fff',
      background: '#fff', mainBkg: '#ECECFF',
      nodeBorder: '#9370DB', clusterBkg: '#ffffde',
      clusterBorder: '#aaaa33', titleColor: '#333',
      edgeLabelBackground: '#e8e8e8',
    },
  },
  neutral: {
    theme: 'neutral',
    themeVariables: {
      primaryColor: '#f4f4f4', primaryTextColor: '#333',
      primaryBorderColor: '#999', lineColor: '#666',
      secondaryColor: '#f4f4f4', tertiaryColor: '#fff',
      background: '#fff', mainBkg: '#f4f4f4',
      nodeBorder: '#999', clusterBkg: '#f4f4f4',
      clusterBorder: '#999', titleColor: '#333',
      edgeLabelBackground: '#e8e8e8',
    },
  },
  dark: {
    theme: 'dark',
    themeVariables: {
      primaryColor: '#1f2937', primaryTextColor: '#fff',
      primaryBorderColor: '#22c55e', lineColor: '#666',
      secondaryColor: '#1a1a1a', tertiaryColor: '#333',
      background: '#0a0a0a', mainBkg: '#1f2937',
      nodeBorder: '#22c55e', clusterBkg: '#1a1a1a',
      clusterBorder: '#333', titleColor: '#fff',
      edgeLabelBackground: '#1a1a1a',
    },
  },
  forest: {
    theme: 'forest',
    themeVariables: {
      primaryColor: '#cde498', primaryTextColor: '#13540c',
      primaryBorderColor: '#13540c', lineColor: '#6eaa49',
      secondaryColor: '#cdffb2', tertiaryColor: '#f4f4f4',
      background: '#fff', mainBkg: '#cde498',
      nodeBorder: '#13540c', clusterBkg: '#cdffb2',
      clusterBorder: '#6eaa49', titleColor: '#13540c',
      edgeLabelBackground: '#e8e8e8',
    },
  },
  base: {
    theme: 'base',
    themeVariables: {
      primaryColor: '#fff4dd', primaryTextColor: '#333',
      primaryBorderColor: '#f9a825', lineColor: '#666',
      secondaryColor: '#fff4dd', tertiaryColor: '#fff',
      background: '#fff', mainBkg: '#fff4dd',
      nodeBorder: '#f9a825', clusterBkg: '#fff4dd',
      clusterBorder: '#f9a825', titleColor: '#333',
      edgeLabelBackground: '#fff4dd',
    },
  },
};

const appThemeToMermaid: Record<string, MermaidTheme> = {
  'premium-dark': 'dark',
};

// ─── Lazy mermaid loader ──────────────────────────────────────────────────────

let mermaidInstance: any = null;
let mermaidLoadPromise: Promise<any> | null = null;
let currentMermaidTheme: MermaidTheme | null = null;

async function loadMermaid(): Promise<any> {
  if (mermaidInstance) return mermaidInstance;
  if (!mermaidLoadPromise) {
    // @ts-ignore
    mermaidLoadPromise = import('mermaid/dist/mermaid.esm.mjs').then((m) => {
      mermaidInstance = m.default;
      return mermaidInstance;
    });
  }
  return mermaidLoadPromise;
}

async function initMermaid(theme: MermaidTheme, force = false) {
  if (currentMermaidTheme === theme && !force) return;
  const mermaid = await loadMermaid();
  const isMobile = window.innerWidth < 640;
  try {
    mermaid.initialize({
      startOnLoad: false,
      ...mermaidThemeConfigs[theme],
      securityLevel: 'loose',
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
      fontSize: isMobile ? 13 : 14,
      flowchart: {
        useMaxWidth: true, htmlLabels: true, curve: 'basis',
        nodeSpacing: isMobile ? 30 : 50,
        rankSpacing: isMobile ? 30 : 50,
        padding: isMobile ? 8 : 15,
      },
      sequence: {
        diagramMarginX: isMobile ? 20 : 50,
        diagramMarginY: isMobile ? 10 : 20,
        boxMargin: isMobile ? 5 : 10,
        noteMargin: isMobile ? 5 : 10,
        messageMargin: isMobile ? 25 : 35,
        mirrorActors: false,
        useMaxWidth: true,
      },
    });
    currentMermaidTheme = theme;
  } catch (e) {
    console.error('Mermaid init error:', e);
  }
}

// ─── Lazy svg-pan-zoom loader ─────────────────────────────────────────────────

let spzLib: any = null;
let spzPromise: Promise<any> | null = null;

async function loadSvgPanZoom(): Promise<any> {
  if (spzLib) return spzLib;
  if (!spzPromise) {
    spzPromise = import('svg-pan-zoom').then((m) => {
      spzLib = m.default ?? m;
      return spzLib;
    });
  }
  return spzPromise;
}

// ─── Component ────────────────────────────────────────────────────────────────

export interface InteractiveDiagramProps {
  /** Raw mermaid syntax or markdown fenced block */
  chart: string;
  themeOverride?: MermaidTheme;
  className?: string;
  /** Called after render attempt — true = success, false = error */
  onRenderResult?: (success: boolean) => void;
}

export function InteractiveDiagram({ chart, themeOverride, className = '', onRenderResult }: InteractiveDiagramProps) {
  const { theme: appTheme } = useTheme();

  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<MermaidTheme | null>(() => {
    if (typeof window === 'undefined') return null;
    const saved = localStorage.getItem('mermaid-theme');
    return saved ? (saved as MermaidTheme) : null;
  });
  const [showThemePicker, setShowThemePicker] = useState(false);

  const renderIdRef = useRef(0);
  const inlineSvgRef = useRef<HTMLDivElement>(null);
  const expandedSvgRef = useRef<HTMLDivElement>(null);
  const panZoomInlineRef = useRef<any>(null);
  const panZoomExpandedRef = useRef<any>(null);

  const effectiveTheme: MermaidTheme =
    themeOverride ?? selectedTheme ?? appThemeToMermaid[appTheme] ?? 'forest';

  const handleThemeChange = (t: MermaidTheme | null) => {
    setSelectedTheme(t);
    if (t) localStorage.setItem('mermaid-theme', t);
    else localStorage.removeItem('mermaid-theme');
  };

  const extractCode = (raw: string): string => {
    const fenced = raw.match(/```mermaid\s*\n([\s\S]*?)```/);
    if (fenced) return fenced[1].trim();
    const generic = raw.match(/```\s*\n([\s\S]*?)```/);
    if (generic) return generic[1].trim();
    return raw.trim();
  };

  // Render mermaid → SVG
  useEffect(() => {
    if (!chart) { setError('Empty diagram'); setIsLoading(false); return; }

    const id = ++renderIdRef.current;
    setError(null); setSvgContent(null); setIsLoading(true);

    let cancelled = false;
    const renderId = `mermaid-${id}-${Math.random().toString(36).slice(2, 9)}`;
    const code = extractCode(chart);

    if (!code) { setError('Empty diagram'); setIsLoading(false); return; }

    (async () => {
      try {
        await initMermaid(effectiveTheme, true);
        const mermaid = await loadMermaid();
        await new Promise((r) => setTimeout(r, 50));
        if (cancelled) return;

        const origError = console.error;
        console.error = () => {};
        let svg: string;
        try {
          ({ svg } = await mermaid.render(renderId, code));
        } finally {
          console.error = origError;
        }
        document.getElementById(`d${renderId}`)?.remove();
        document.getElementById(renderId)?.remove();

        if (!cancelled && id === renderIdRef.current) {
          setSvgContent(svg);
          onRenderResult?.(true);
        }
      } catch (err: any) {
        document.getElementById(`d${renderId}`)?.remove();
        document.getElementById(renderId)?.remove();
        if (!cancelled && id === renderIdRef.current) {
          setError(err?.message ?? 'Render failed');
          onRenderResult?.(false);
        }
      } finally {
        if (!cancelled && id === renderIdRef.current) setIsLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [chart, effectiveTheme]);

  // Attach svg-pan-zoom to inline view
  useEffect(() => {
    if (!svgContent || !inlineSvgRef.current) return;
    try { panZoomInlineRef.current?.destroy(); } catch (_) {}
    panZoomInlineRef.current = null;

    const svgEl = inlineSvgRef.current.querySelector('svg');
    if (!svgEl) return;

    svgEl.setAttribute('width', '100%');
    svgEl.removeAttribute('height');
    svgEl.style.maxWidth = '100%';

    let destroyed = false;
    loadSvgPanZoom().then((spz) => {
      if (destroyed || !inlineSvgRef.current) return;
      try {
        panZoomInlineRef.current = spz(svgEl, {
          zoomEnabled: true, panEnabled: true,
          controlIconsEnabled: false,
          fit: true, center: true,
          minZoom: 0.3, maxZoom: 10,
          zoomScaleSensitivity: 0.3,
          dblClickZoomEnabled: true,
          mouseWheelZoomEnabled: true,
          preventMouseEventsDefault: true,
        });
      } catch (e) { console.warn('svg-pan-zoom inline init failed:', e); }
    });

    return () => {
      destroyed = true;
      try { panZoomInlineRef.current?.destroy(); } catch (_) {}
      panZoomInlineRef.current = null;
    };
  }, [svgContent]);

  // Attach svg-pan-zoom to expanded view
  useEffect(() => {
    if (!isExpanded || !svgContent || !expandedSvgRef.current) return;
    try { panZoomExpandedRef.current?.destroy(); } catch (_) {}
    panZoomExpandedRef.current = null;

    const timer = setTimeout(async () => {
      const svgEl = expandedSvgRef.current?.querySelector('svg');
      if (!svgEl) return;
      svgEl.setAttribute('width', '100%');
      svgEl.setAttribute('height', '100%');
      svgEl.removeAttribute('style');

      const spz = await loadSvgPanZoom();
      try {
        panZoomExpandedRef.current = spz(svgEl, {
          zoomEnabled: true, panEnabled: true,
          controlIconsEnabled: false,
          fit: true, center: true,
          minZoom: 0.1, maxZoom: 20,
          zoomScaleSensitivity: 0.3,
          dblClickZoomEnabled: true,
          mouseWheelZoomEnabled: true,
          preventMouseEventsDefault: true,
        });
      } catch (e) { console.warn('svg-pan-zoom expanded init failed:', e); }
    }, 80);

    return () => {
      clearTimeout(timer);
      try { panZoomExpandedRef.current?.destroy(); } catch (_) {}
      panZoomExpandedRef.current = null;
    };
  }, [isExpanded, svgContent]);

  // ESC to close expanded
  useEffect(() => {
    if (!isExpanded) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); e.preventDefault(); setIsExpanded(false); }
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [isExpanded]);

  const zoomIn = useCallback(() => panZoomExpandedRef.current?.zoomIn(), []);
  const zoomOut = useCallback(() => panZoomExpandedRef.current?.zoomOut(), []);
  const resetView = useCallback(() => {
    panZoomExpandedRef.current?.resetZoom();
    panZoomExpandedRef.current?.center();
  }, []);

  const themes: { id: MermaidTheme; name: string; color: string }[] = [
    { id: 'default', name: 'Default', color: '#326ce5' },
    { id: 'neutral', name: 'Neutral', color: '#999' },
    { id: 'dark',    name: 'Dark',    color: '#22c55e' },
    { id: 'forest',  name: 'Forest',  color: '#6eaa49' },
    { id: 'base',    name: 'Base',    color: '#f9a825' },
  ];

  if (error) return null;

  if (isLoading) {
    return (
      <div className={`w-full flex justify-center items-center py-4 ${className}`}>
        <div className="text-xs text-white/30 animate-pulse">Loading diagram…</div>
      </div>
    );
  }

  if (!svgContent) return null;

  // Expanded fullscreen overlay
  if (isExpanded) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col">
        <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 bg-black shrink-0">
          <span className="text-[10px] text-white/50 uppercase tracking-widest font-bold flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-primary inline-block" />
            Diagram — drag to pan · scroll to zoom
          </span>
          <div className="flex items-center gap-1">
            <div className="relative">
              <button
                onClick={() => setShowThemePicker((v) => !v)}
                className="p-1.5 hover:bg-white/10 rounded transition-colors flex items-center gap-1"
                title="Change theme"
              >
                <Palette className="w-3.5 h-3.5 text-white/70" />
                <span className="text-[9px] text-white/50 hidden sm:inline">{effectiveTheme}</span>
              </button>
              {showThemePicker && (
                <div className="absolute top-full right-0 mt-1 bg-black border border-white/20 rounded shadow-lg z-10 min-w-[120px]">
                  {themes.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => { handleThemeChange(t.id); setShowThemePicker(false); }}
                      className={`w-full px-3 py-1.5 text-left text-[10px] hover:bg-white/10 flex items-center gap-2 ${
                        effectiveTheme === t.id ? 'text-primary' : 'text-white/70'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />
                      {t.name}
                    </button>
                  ))}
                  <div className="border-t border-white/10 mt-1 pt-1">
                    <button
                      onClick={() => { handleThemeChange(null); setShowThemePicker(false); }}
                      className="w-full px-3 py-1.5 text-left text-[10px] text-white/50 hover:bg-white/10"
                    >
                      Auto (match app)
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="w-px h-4 bg-white/20 mx-1" />
            <button onClick={zoomOut} className="p-1.5 hover:bg-white/10 rounded transition-colors" title="Zoom out">
              <ZoomOut className="w-3.5 h-3.5 text-white/70" />
            </button>
            <button onClick={zoomIn} className="p-1.5 hover:bg-white/10 rounded transition-colors" title="Zoom in">
              <ZoomIn className="w-3.5 h-3.5 text-white/70" />
            </button>
            <button
              onClick={resetView}
              className="px-2 py-1 text-[9px] text-white/50 hover:text-white hover:bg-white/10 rounded transition-colors uppercase tracking-wider flex items-center gap-1"
              title="Reset view"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
            <div className="w-px h-4 bg-white/20 mx-1" />
            <button
              onClick={() => setIsExpanded(false)}
              className="p-1.5 hover:bg-white/10 rounded transition-colors"
              title="Close (Esc)"
            >
              <X className="w-3.5 h-3.5 text-white/70" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden" onClick={() => setShowThemePicker(false)}>
          <div
            ref={expandedSvgRef}
            className="w-full h-full"
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        </div>
      </div>
    );
  }

  // Inline view
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

  return (
    <div className={`relative group ${className}`}>
      <div
        ref={inlineSvgRef}
        className="w-full my-1 mermaid-container"
        style={{ minHeight: 120, cursor: 'grab' }}
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />
      {!isMobile && (
        <button
          onClick={() => setIsExpanded(true)}
          className="absolute top-1 right-1 p-1.5 bg-black/70 hover:bg-primary rounded opacity-0 group-hover:opacity-100 transition-all border border-white/20"
          title="Expand diagram"
        >
          <Maximize2 className="w-3 h-3 text-white" />
        </button>
      )}
    </div>
  );
}

// Backward-compat re-exports so existing imports keep working
export const Mermaid = InteractiveDiagram;

export function MermaidDiagram({ content, className }: { content: string; className?: string }) {
  return <InteractiveDiagram chart={content} className={className} />;
}

export type { MermaidTheme };
export { mermaidThemeConfigs };
export default InteractiveDiagram;
