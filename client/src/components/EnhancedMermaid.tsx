import { useEffect, useRef, useState, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, Maximize2, Move } from 'lucide-react';
// @ts-ignore
import mermaid from 'mermaid/dist/mermaid.esm.mjs';

let initialized = false;

function initMermaid() {
  if (initialized) return;
  const isMobile = window.innerWidth < 640;
  try {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      securityLevel: 'loose',
      fontFamily: 'monospace, sans-serif',
      fontSize: isMobile ? 14 : 12,
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis',
        nodeSpacing: isMobile ? 30 : 50,
        rankSpacing: isMobile ? 30 : 50,
        padding: isMobile ? 8 : 15,
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
        fontSize: isMobile ? '14px' : '12px',
      },
    });
    initialized = true;
  } catch (e) {
    console.error('Mermaid init error:', e);
  }
}

interface EnhancedMermaidProps {
  chart: string;
  compact?: boolean;
}

export function EnhancedMermaid({ chart, compact = false }: EnhancedMermaidProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const renderIdRef = useRef(0);

  // Reset view
  const resetView = useCallback(() => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  // Fit to screen - simplified approach
  const fitToScreen = useCallback(() => {
    // Just reset to 1x zoom and center
    // Users can zoom in/out manually if needed
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  // Zoom controls
  const handleZoomIn = () => setZoom(z => Math.min(z + 0.25, 4));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.25, 0.25));

  // Pan controls
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isExpanded) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Touch support
  const touchStartRef = useRef({ x: 0, y: 0, dist: 0 });
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isExpanded) return;
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX - position.x, y: e.touches[0].clientY - position.y });
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartRef.current = { x: position.x, y: position.y, dist };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isExpanded) return;
    if (e.touches.length === 1 && isDragging) {
      setPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y,
      });
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const scale = dist / touchStartRef.current.dist;
      setZoom(z => Math.max(0.25, Math.min(z * scale, 4)));
      touchStartRef.current.dist = dist;
    }
  };

  const handleTouchEnd = () => setIsDragging(false);

  // Debug effect - MUST be before any conditional returns
  useEffect(() => {
    if (isExpanded) {
      console.log('=== FULLSCREEN DEBUG ===');
      console.log('SVG Content exists:', !!svgContent);
      console.log('SVG Content length:', svgContent?.length);
      console.log('Zoom:', zoom);
      console.log('Position:', position);
      console.log('Container ref:', !!svgContainerRef.current);
      
      if (svgContainerRef.current) {
        const svg = svgContainerRef.current.querySelector('svg');
        console.log('SVG element found:', !!svg);
        if (svg) {
          const rect = svg.getBoundingClientRect();
          console.log('SVG dimensions:', rect.width, 'x', rect.height);
          console.log('SVG position:', rect.x, rect.y);
          console.log('SVG computed style:', window.getComputedStyle(svg).display);
        }
      }
      console.log('======================');
    }
  }, [isExpanded, svgContent, zoom, position]);

  // Reset zoom when entering fullscreen - simple approach
  useEffect(() => {
    if (isExpanded) {
      // Start at 1x zoom, centered
      setZoom(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [isExpanded]);

  // ESC to close
  useEffect(() => {
    if (!isExpanded) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        e.preventDefault();
        setIsExpanded(false);
        resetView();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isExpanded, resetView]);

  // Render mermaid
  useEffect(() => {
    if (!chart) {
      setError('Empty diagram');
      setIsLoading(false);
      return;
    }

    const currentRenderId = ++renderIdRef.current;
    setError(null);
    setSvgContent(null);
    setIsLoading(true);
    initMermaid();

    const id = `mermaid-${currentRenderId}-${Math.random().toString(36).slice(2, 11)}`;
    const cleanChart = chart.trim().replace(/\r\n/g, '\n').replace(/^\n+/, '').replace(/\n+$/, '');
    
    if (!cleanChart) {
      setError('Empty diagram');
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    const renderChart = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 50));
        if (cancelled) return;
        const { svg } = await mermaid.render(id, cleanChart);
        if (!cancelled && currentRenderId === renderIdRef.current) {
          setSvgContent(svg);
          setError(null);
        }
      } catch (err: any) {
        console.error('Mermaid render error:', err);
        if (!cancelled && currentRenderId === renderIdRef.current) {
          const errorMsg = err?.message || err?.str || 'Failed to render diagram';
          setError(typeof errorMsg === 'string' ? errorMsg : 'Render failed');
        }
      } finally {
        if (!cancelled && currentRenderId === renderIdRef.current) {
          setIsLoading(false);
        }
      }
    };

    renderChart();
    return () => { cancelled = true; };
  }, [chart]);

  if (error) {
    return (
      <div className="w-full p-3 sm:p-4 border border-red-500/30 bg-red-500/5 rounded text-red-400 text-xs">
        <div className="mb-2 font-bold">Diagram Error</div>
        <pre className="text-[10px] opacity-50 overflow-x-auto whitespace-pre-wrap max-h-32 overflow-y-auto">
          {chart}
        </pre>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full flex justify-center items-center py-12">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <div className="text-xs text-white/30">Rendering diagram...</div>
        </div>
      </div>
    );
  }

  if (!svgContent) return null;

  // Expanded fullscreen view
  if (isExpanded) {
    return (
      <div className="fixed inset-0 z-[100] bg-red-900/20 flex flex-col">
        {/* Debug Panel */}
        <div className="absolute top-16 left-4 bg-black/90 border-2 border-yellow-500 p-4 text-white text-xs font-mono z-50 max-w-md">
          <div className="font-bold text-yellow-500 mb-2">🔍 DEBUG INFO</div>
          <div>SVG Content: {svgContent ? `${svgContent.length} chars` : 'MISSING'}</div>
          <div>Zoom: {zoom}x ({Math.round(zoom * 100)}%)</div>
          <div>Position: x={position.x}, y={position.y}</div>
          <div>Container: {svgContainerRef.current ? 'EXISTS' : 'MISSING'}</div>
          <div>Dragging: {isDragging ? 'YES' : 'NO'}</div>
          <div className="mt-2 text-yellow-500">
            {svgContainerRef.current?.querySelector('svg') ? '✅ SVG in DOM' : '❌ NO SVG'}
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 bg-black/90 shrink-0">
          <div className="flex items-center gap-2 text-[10px] text-white/50 uppercase tracking-widest">
            <Move className="w-3.5 h-3.5" />
            <span>Zoom: {Math.round(zoom * 100)}%</span>
          </div>
          
          <div className="flex items-center gap-1">
            <button onClick={handleZoomOut} className="p-2 hover:bg-white/10 rounded transition-colors border border-white/20" title="Zoom out">
              <ZoomOut className="w-4 h-4 text-white" />
            </button>
            <button onClick={handleZoomIn} className="p-2 hover:bg-white/10 rounded transition-colors border border-white/20" title="Zoom in">
              <ZoomIn className="w-4 h-4 text-white" />
            </button>
            <button onClick={fitToScreen} className="px-3 py-2 text-[10px] text-white bg-primary hover:bg-primary/80 rounded font-bold border border-primary" title="Reset">
              RESET
            </button>
            <button onClick={() => { setIsExpanded(false); resetView(); }} className="p-2 hover:bg-white/10 rounded transition-colors border border-white/20" title="Close">
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Diagram area with visible border */}
        <div 
          ref={svgContainerRef}
          className="flex-1 overflow-auto flex items-center justify-center p-8 border-4 border-green-500"
          style={{ 
            cursor: isDragging ? 'grabbing' : 'grab',
            userSelect: 'none',
            backgroundColor: '#1a1a1a',
            minHeight: '400px'
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Actual diagram - using same class as inline view */}
          <div 
            style={{ 
              transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.2s ease-out'
            }}
          >
            <div 
              className="mermaid-container"
              dangerouslySetInnerHTML={{ __html: svgContent }}
            />
          </div>
        </div>

        {/* Help text */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/90 border border-white/20 rounded text-[10px] text-white uppercase tracking-widest">
          Press ESC to close • Check console for debug info
        </div>
      </div>
    );
  }

  // Compact inline view
  return (
    <div ref={containerRef} className="relative group">
      <div 
        className={`w-full flex justify-center overflow-hidden rounded-lg border border-white/10 bg-black/20 ${compact ? 'p-2' : 'p-4'} ${!compact ? 'cursor-pointer hover:border-primary/50 transition-colors' : ''}`}
        onClick={() => !compact && setIsExpanded(true)}
      >
        <div 
          className="mermaid-container"
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
      </div>
      
      {!compact && (
        <button
          onClick={(e) => { e.stopPropagation(); setIsExpanded(true); }}
          className="absolute top-2 right-2 p-2 bg-black/80 hover:bg-primary/90 rounded border border-white/20 opacity-0 group-hover:opacity-100 transition-all"
          title="Expand diagram (click anywhere)"
        >
          <Maximize2 className="w-3.5 h-3.5 text-white" />
        </button>
      )}
    </div>
  );
}
