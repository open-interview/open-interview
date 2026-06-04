import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface CodeWindowProps {
  code?: string;
  language?: string;
  title?: string;
  typingSpeed?: number;
  className?: string;
  autoPlay?: boolean;
}

const DEFAULT_CODE = `class URLShortener:
    def __init__(self):
        self.counter = 1000000
        self.base62 = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

    def shorten_url(self, long_url: str) -> str:
        """Generate short URL using base62 encoding"""
        short = []
        num = self.counter
        while num > 0:
            short.append(self.base62[num % 62])
            num //= 62
        self.counter += 1
        return f"https://short.url/{''.join(reversed(short))}"

    def get_stats(self, short_code: str) -> dict:
        """Track click analytics per short URL"""
        return {
            "clicks": analytics.get(short_code, 0),
            "top_referrers": ["twitter.com", "linkedin.com"],
            "geo_distribution": {"US": "45%", "EU": "30%", "APAC": "25%"}
        }`;

const KEYWORDS = new Set([
  "def", "class", "return", "if", "else", "elif", "for", "while",
  "import", "from", "as", "pass", "break", "continue", "in", "not",
  "and", "or", "is", "None", "True", "False", "self", "try",
  "except", "finally", "with", "yield", "raise", "global", "nonlocal",
  "assert", "del", "print", "range", "lambda",
]);

const BUILTINS = new Set([
  "dict", "str", "int", "list", "tuple", "set", "bool", "float",
  "len", "type", "super", "object", "property", "staticmethod",
  "classmethod", "enumerate", "zip", "map", "filter", "sorted",
  "reversed", "any", "all", "isinstance", "hasattr", "getattr",
  "setattr", "open", "ValueError", "TypeError", "KeyError",
  "IndexError", "Exception",
]);

type TokenType =
  | "keyword" | "function" | "string" | "comment"
  | "number" | "decorator" | "operator" | "builtin"
  | "punctuation" | "normal";

const tokenStyles: Record<TokenType, string> = {
  keyword: "text-[#c792ea]",
  function: "text-[#82aaff]",
  string: "text-[#c3e88d]",
  comment: "text-[#546e7a] italic",
  number: "text-[#f78c6c]",
  decorator: "text-[#f78c6c]",
  operator: "text-[#89ddff]",
  builtin: "text-[#ffcb6b]",
  punctuation: "text-[#89ddff]",
  normal: "text-[#abb2bf]",
};

interface CharInfo {
  char: string;
  className: string;
  lineIdx: number;
}

function tokenizeLine(line: string): { text: string; type: TokenType }[] {
  const tokens: { text: string; type: TokenType }[] = [];
  let i = 0;

  while (i < line.length) {
    if (line[i] === "#") {
      tokens.push({ text: line.slice(i), type: "comment" });
      break;
    }

    if (line[i] === '"' || line[i] === "'") {
      const quote = line[i];
      let j = i + 1;
      let escaped = false;
      while (j < line.length) {
        if (escaped) {
          escaped = false;
        } else if (line[j] === "\\") {
          escaped = true;
        } else if (line[j] === quote) {
          j++;
          break;
        }
        j++;
      }
      tokens.push({ text: line.slice(i, j), type: "string" });
      i = j;
      continue;
    }

    if (line[i] === "@" && (i === 0 || /\s/.test(line[i - 1]))) {
      let j = i + 1;
      while (j < line.length && /[\w.]/.test(line[j])) j++;
      tokens.push({ text: line.slice(i, j), type: "decorator" });
      i = j;
      continue;
    }

    if (/\d/.test(line[i]) && (i === 0 || !/\w/.test(line[i - 1]))) {
      let j = i;
      while (j < line.length && /[\d.]/.test(line[j])) j++;
      tokens.push({ text: line.slice(i, j), type: "number" });
      i = j;
      continue;
    }

    if (/\w/.test(line[i]) || line[i] === "_") {
      let j = i;
      while (j < line.length && /\w/.test(line[j])) j++;
      const word = line.slice(i, j);

      if (KEYWORDS.has(word)) {
        tokens.push({ text: word, type: "keyword" });
      } else if (BUILTINS.has(word)) {
        tokens.push({ text: word, type: "builtin" });
      } else if (j < line.length && line[j] === "(") {
        tokens.push({ text: word, type: "function" });
      } else {
        tokens.push({ text: word, type: "normal" });
      }
      i = j;
      continue;
    }

    if (/[=+\-*\/%&|^~<>!]/.test(line[i])) {
      let j = i + 1;
      if (j < line.length && /[=+\-*\/%&|^<>!]/.test(line[j])) j++;
      tokens.push({ text: line.slice(i, j), type: "operator" });
      i = j;
      continue;
    }

    if (/[(){}\[\].,:;]/.test(line[i])) {
      tokens.push({ text: line[i], type: "punctuation" });
      i++;
      continue;
    }

    tokens.push({ text: line[i], type: "normal" });
    i++;
  }

  return tokens;
}

function CodeWindow({
  code,
  language = "python",
  title = "url_shortener.py",
  typingSpeed = 30,
  className,
  autoPlay = true,
}: CodeWindowProps) {
  const sourceCode = (code ?? DEFAULT_CODE).replace(/\|/g, "");
  const [revealedCount, setRevealedCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(autoPlay);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRevealedCount(0);
    setHasStarted(autoPlay);
  }, [autoPlay, sourceCode]);

  useEffect(() => {
    if (!hasStarted) return;
    setRevealedCount(0);

    const totalChars = sourceCode.length;
    if (totalChars === 0) return;

    const interval = setInterval(() => {
      setRevealedCount((prev) => {
        const next = prev + 1;
        if (next >= totalChars) {
          clearInterval(interval);
          return totalChars;
        }
        return next;
      });
    }, typingSpeed);

    return () => clearInterval(interval);
  }, [hasStarted, sourceCode, typingSpeed]);

  const lines = sourceCode.split("\n");

  const tokenizedLines = lines.map((line) => tokenizeLine(line));

  const chars: CharInfo[] = [];
  const lineToGlobalStart: number[] = [];

  tokenizedLines.forEach((tokens, lineIdx) => {
    lineToGlobalStart[lineIdx] = chars.length;
    tokens.forEach((token) => {
      for (const ch of token.text) {
        chars.push({ char: ch, className: tokenStyles[token.type], lineIdx });
      }
    });
    if (lineIdx < lines.length - 1) {
      chars.push({ char: "\n", className: "", lineIdx });
    }
  });

  const cursorPos = Math.min(revealedCount, chars.length);
  const isAtEnd = revealedCount >= chars.length;

  const gutterWidth = Math.max(String(lines.length).length * 10 + 28, 52);

  const renderLine = (lineIdx: number) => {
    const start = lineToGlobalStart[lineIdx];
    const lineChars: CharInfo[] = [];
    let idx = start;
    while (idx < chars.length && chars[idx].lineIdx === lineIdx) {
      lineChars.push(chars[idx]);
      idx++;
    }

    const hasAnyRevealed = revealedCount > start;

    if (!hasAnyRevealed) {
      return <div key={lineIdx} className="h-[22px]" />;
    }

    const children: React.ReactNode[] = [];
    let cursorInserted = false;

    lineChars.forEach((ch, ci) => {
      const globalIdx = start + ci;
      const isRevealed = globalIdx < revealedCount;

      if (isRevealed) {
        if (ch.char === " ") {
          children.push(
            <span key={ci} className={ch.className}>&nbsp;</span>
          );
        } else {
          children.push(
            <span key={ci} className={ch.className}>{ch.char}</span>
          );
        }
      }

      if (globalIdx === cursorPos && !cursorInserted) {
        cursorInserted = true;
        if (isRevealed) {
          children.push(
            <span key={`cursor-${ci}`} className="relative">
              <span className="absolute -left-[1px] top-0 inline-block w-[8px] h-[18px] bg-[#528bff] animate-blink" />
            </span>
          );
        } else {
          children.push(
            <span key={`cursor-before`} className="inline-block w-[8px] h-[18px] bg-[#528bff] animate-blink align-middle" />
          );
        }
      }
    });

    if (!cursorInserted && cursorPos >= start + lineChars.length) {
      children.push(
        <span key="cursor-after" className="inline-block w-[8px] h-[18px] bg-[#528bff] animate-blink align-middle" />
      );
    }

    if (lineChars.length === 0 && cursorPos === start) {
      children.push(
        <span key="cursor-empty" className="inline-block w-[8px] h-[18px] bg-[#528bff] animate-blink align-middle" />
      );
    }

    return <div key={lineIdx} className="h-[22px] whitespace-pre">{children}</div>;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className={cn("relative group", className)}
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-xl border border-white/[0.06]",
          "bg-[#0d1117]",
          "transition-shadow duration-500",
        )}
        style={{
          boxShadow:
            "0 24px 48px rgba(0,0,0,0.45), 0 12px 24px rgba(0,0,0,0.35), 0 0 60px rgba(124,58,237,0.06), 0 0 120px rgba(6,182,212,0.04)",
        }}
      >
        <div
          className="absolute -inset-[1px] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
          style={{
            background: "conic-gradient(from 0deg, #8b5cf6, #06b6d4, #6366f1, #a78bfa, #22d3ee, #8b5cf6)",
            mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            maskComposite: "exclude",
            WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            padding: "1px",
            animation: "border-spin 4s linear infinite",
          }}
        />

        <div className="absolute inset-0 pointer-events-none z-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
              opacity: 0.5,
            }}
          />
        </div>

        <div className="absolute bottom-0 right-0 w-64 h-64 pointer-events-none z-0">
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: "radial-gradient(circle at 100% 100%, rgba(124,58,237,0.15), rgba(6,182,212,0.08), transparent 70%)",
              filter: "blur(40px)",
            }}
          />
        </div>

        <div className="absolute top-0 left-0 w-48 h-48 pointer-events-none z-0">
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: "radial-gradient(circle at 0% 0%, rgba(99,102,241,0.10), transparent 70%)",
              filter: "blur(40px)",
            }}
          />
        </div>

        <div className="relative z-1">
          {/* Title Bar */}
          <div className="flex items-center h-11 px-4 bg-[#161b22] border-b border-white/[0.06] select-none">
            <div className="flex items-center gap-2">
              <motion.div
                className="w-3 h-3 rounded-full bg-[#ff5f57]"
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0 }}
              />
              <motion.div
                className="w-3 h-3 rounded-full bg-[#febc2e]"
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.15 }}
              />
              <motion.div
                className="w-3 h-3 rounded-full bg-[#28c840]"
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
              />
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-white/[0.04]">
                <div className="w-3.5 h-3.5 rounded-sm bg-gradient-to-br from-[#8b5cf6] to-[#06b6d4] flex items-center justify-center">
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="16 18 22 12 16 6" />
                    <polyline points="8 6 2 12 8 18" />
                  </svg>
                </div>
                <span className="text-xs text-white/60 font-mono">{title}</span>
              </div>
            </div>

            <button
              type="button"
              className="p-1.5 rounded-md hover:bg-white/[0.06] transition-colors text-white/30 hover:text-white/60"
              aria-label="More options"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>

          {/* Code Area */}
          <div className="flex" ref={containerRef}>
            {/* Line Numbers */}
            <div
              className="flex-shrink-0 py-4 text-right select-none border-r border-white/[0.04]"
              style={{ width: gutterWidth }}
            >
              {lines.map((_, idx) => {
                const start = lineToGlobalStart[idx];
                const isActive = revealedCount > start;
                const lineNum = idx + 1;
                return (
                  <div
                    key={idx}
                    className="h-[22px] flex items-center justify-end pr-4 text-xs font-mono leading-[22px] transition-all duration-200"
                    style={{
                      color: isActive
                        ? `rgba(255,255,255,${Math.min(0.35, 0.1 + (revealedCount - start) * 0.02)})`
                        : "rgba(255,255,255,0.1)",
                    }}
                  >
                    {lineNum}
                  </div>
                );
              })}
            </div>

            {/* Code Content */}
            <div className="flex-1 py-4 pl-5 pr-4 overflow-x-auto">
              <pre className="font-mono text-sm leading-[22px] text-[#abb2bf]">
                {lines.map((_, idx) => renderLine(idx))}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export { CodeWindow };
export type { CodeWindowProps };
