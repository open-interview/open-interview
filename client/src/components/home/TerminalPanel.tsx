import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Terminal, CheckCircle2, AlertCircle, Info } from "lucide-react";

interface TerminalOutput {
  text: string;
  type?: 'command' | 'output' | 'error' | 'success' | 'info' | 'typing';
  delay?: number;
}

interface TerminalPanelProps {
  lines?: TerminalOutput[];
  title?: string;
  prompt?: string;
  typingSpeed?: number;
  className?: string;
  autoPlay?: boolean;
  showCursor?: boolean;
}

const defaultLines: TerminalOutput[] = [
  { text: "open-interview@system:~$ python3 interview.py", type: 'command', delay: 0 },
  { text: "▶ Initializing System Design Practice...", type: 'info', delay: 400 },
  { text: "  ✓ Loading question bank (30,533 questions)", type: 'success', delay: 1000 },
  { text: "  ✓ Calibrating difficulty to Senior Level", type: 'success', delay: 1500 },
  { text: "  ✓ Loading AI Interviewer (GPT-4)", type: 'success', delay: 2000 },
  { text: "", type: 'output', delay: 2400 },
  { text: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", type: 'output', delay: 2500 },
  { text: "  Prompt: Design a URL shortener service  ", type: 'command', delay: 2800 },
  { text: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", type: 'output', delay: 2900 },
  { text: "", type: 'output', delay: 3000 },
  { text: "► Analyzing requirements...", type: 'typing', delay: 3200 },
  { text: "  • Traffic: 100M URLs/month", type: 'output', delay: 4000 },
  { text: "  • Latency: P99 < 50ms", type: 'output', delay: 4200 },
  { text: "  • Availability: 99.99%", type: 'output', delay: 4400 },
  { text: "", type: 'output', delay: 4700 },
  { text: "► Generating solution architecture...", type: 'typing', delay: 4900 },
  { text: "  ✓ Solution ready — Score: 92/100", type: 'success', delay: 5600 },
  { text: "", type: 'output', delay: 5800 },
  { text: "open-interview@system:~$ ▊", type: 'command', delay: 6000 },
];

const LINE_ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
} as const;

const LINE_STYLES: Record<string, string> = {
  command: "text-[#a9b1d6]",
  output: "text-[#a9b1d6]",
  error: "text-[#f7768e]",
  success: "text-[#9ece6a]",
  info: "text-[#7dcfff]",
  typing: "text-[#e0af68]",
};

export function TerminalPanel({
  lines = defaultLines,
  title = "Terminal",
  prompt = "$",
  typingSpeed = 20,
  className,
  autoPlay = true,
  showCursor = true,
}: TerminalPanelProps) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [typingTexts, setTypingTexts] = useState<Record<number, string>>({});
  const [hasAnimated, setHasAnimated] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const totalLines = lines.length;

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!autoPlay || !isVisible || hasAnimated) return;

    setHasAnimated(true);

    lines.forEach((line, index) => {
      const delay = line.delay ?? 0;
      const timer = setTimeout(() => {
        setVisibleCount((prev) => Math.max(prev, index + 1));

        if (line.type === 'typing' && line.text) {
          let charIndex = 0;
          const charTimer = setInterval(() => {
            charIndex++;
            setTypingTexts((prev) => ({
              ...prev,
              [index]: line.text.slice(0, charIndex),
            }));
            if (charIndex >= line.text.length) {
              clearInterval(charTimer);
            }
          }, typingSpeed);
          timersRef.current.push(charTimer as unknown as ReturnType<typeof setTimeout>);
        }
      }, delay);
      timersRef.current.push(timer);
    });

    return clearTimers;
  }, [lines, autoPlay, isVisible, hasAnimated, typingSpeed, clearTimers]);

  useEffect(() => {
    return clearTimers;
  }, [clearTimers]);

  const reset = useCallback(() => {
    clearTimers();
    setVisibleCount(0);
    setTypingTexts({});
    setHasAnimated(false);
  }, [clearTimers]);

  const showFinalCursor = showCursor && visibleCount >= totalLines;

  const visibleLines = useMemo(
    () => lines.slice(0, visibleCount),
    [lines, visibleCount]
  );

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={cn(
        "group relative rounded-xl overflow-hidden border border-[#1a1b26]/60 hover:border-[#565f89]/40 transition-colors duration-300",
        className
      )}
    >
      <div className="absolute inset-0 pointer-events-none z-10 bg-[length:100% 4px] opacity-[0.04]"
        style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,0,0.08) 2px, rgba(0,255,0,0.08) 4px)" }}
      />

      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-6 blur-xl bg-[#9ece6a]/5 pointer-events-none" />

      <div className="bg-[#1a1b26] px-4 py-2.5 flex items-center justify-between select-none border-b border-[#0f1117]/60">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#f7768e] opacity-80" />
            <div className="w-3 h-3 rounded-full bg-[#e0af68] opacity-80" />
            <div className="w-3 h-3 rounded-full bg-[#9ece6a] opacity-80" />
          </div>
          <div className="flex items-center gap-1.5 ml-3">
            <Terminal className="w-3.5 h-3.5 text-[#565f89]" />
            <span className="text-xs text-[#565f89] font-medium">{title}</span>
          </div>
        </div>
      </div>

      <div className="bg-[#0f1117] p-4 pt-3 font-mono text-sm leading-relaxed min-h-[180px] relative">
        <AnimatePresence mode="popLayout">
          {visibleLines.map((line, index) => {
            const lineType = line.type || 'output';
            const Icon = LINE_ICONS[lineType as keyof typeof LINE_ICONS];

            if (line.text === '') {
              return (
                <motion.div
                  key={`line-${index}`}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: '1.5em' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                />
              );
            }

            const displayText =
              lineType === 'typing'
                ? typingTexts[index] !== undefined
                  ? typingTexts[index]
                  : ''
                : line.text;

            if (lineType === 'typing' && typingTexts[index] === undefined) {
              return null;
            }

            return (
              <motion.div
                key={`line-${index}`}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className={cn(
                  "flex items-start gap-2 py-[1px]",
                  LINE_STYLES[lineType] || LINE_STYLES.output
                )}
              >
                {lineType === 'command' && (
                  <span className="text-[#565f89] shrink-0 select-none">{prompt}</span>
                )}
                {lineType === 'success' && Icon && (
                  <Icon className="w-4 h-4 mt-[3px] shrink-0 text-[#9ece6a]" />
                )}
                {lineType === 'error' && Icon && (
                  <Icon className="w-4 h-4 mt-[3px] shrink-0 text-[#f7768e]" />
                )}
                {lineType === 'info' && Icon && (
                  <Icon className="w-4 h-4 mt-[3px] shrink-0 text-[#7dcfff]" />
                )}
                {lineType !== 'command' && lineType !== 'success' && lineType !== 'error' && lineType !== 'info' && (
                  <span className="w-0 shrink-0" />
                )}
                <span className="whitespace-pre-wrap break-all">
                  {displayText}
                  {lineType === 'typing' && typingTexts[index] !== undefined && typingTexts[index].length < line.text.length && (
                    <span className="inline-block w-[6px] h-[14px] bg-[#e0af68] ml-[1px] animate-pulse" />
                  )}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {showFinalCursor && visibleCount > 0 && (
          <motion.span
            initial={{ opacity: 1 }}
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="inline-block w-[8px] h-[18px] bg-[#a9b1d6] ml-1 align-middle"
          />
        )}

        {visibleCount === 0 && (
          <div className="flex items-center gap-2 text-[#565f89]">
            <span className="inline-block w-[8px] h-[18px] bg-[#565f89] animate-pulse" />
            <span className="text-xs">waiting for input...</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
