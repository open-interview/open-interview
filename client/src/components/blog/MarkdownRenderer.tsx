import { useState } from "react";
import { Check, Copy } from "lucide-react";

// Minimal token-based syntax highlighting
function highlight(code: string, lang: string): React.ReactNode[] {
  if (!lang || lang === "text" || lang === "plaintext") return [code];

  // Token patterns ordered by priority
  const patterns: { re: RegExp; cls: string }[] = [
    { re: /(\/\/[^\n]*|\/\*[\s\S]*?\*\/|#[^\n]*)/g, cls: "text-slate-500 italic" },           // comments
    { re: /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g, cls: "text-emerald-400" }, // strings
    { re: /\b(true|false|null|undefined|nil|None|True|False)\b/g, cls: "text-orange-400" },    // literals
    { re: /\b(\d+\.?\d*)\b/g, cls: "text-amber-400" },                                         // numbers
    { re: /\b(const|let|var|function|class|return|if|else|for|while|import|export|from|default|async|await|new|typeof|instanceof|extends|implements|interface|type|enum|public|private|protected|static|void|def|lambda|yield|pass|break|continue|try|catch|finally|throw|in|of|do|switch|case|with|as|is|not|and|or|package|struct|func|go|chan|select|defer|map|range|make|append|len|cap|delete|copy|close|panic|recover|print|println)\b/g, cls: "text-violet-400 font-medium" }, // keywords
    { re: /\b([A-Z][a-zA-Z0-9_]*)\b/g, cls: "text-sky-300" },                                  // types/classes
    { re: /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*(?=\()/g, cls: "text-blue-300" },                     // function calls
  ];

  // Split code into tokens
  type Token = { text: string; cls?: string };
  const tokens: Token[] = [{ text: code }];

  for (const { re, cls } of patterns) {
    const next: Token[] = [];
    for (const tok of tokens) {
      if (tok.cls) { next.push(tok); continue; }
      let last = 0;
      let m: RegExpExecArray | null;
      re.lastIndex = 0;
      while ((m = re.exec(tok.text)) !== null) {
        if (m.index > last) next.push({ text: tok.text.slice(last, m.index) });
        next.push({ text: m[0], cls });
        last = m.index + m[0].length;
      }
      if (last < tok.text.length) next.push({ text: tok.text.slice(last) });
    }
    tokens.splice(0, tokens.length, ...next);
  }

  return tokens.map((t, i) =>
    t.cls ? <span key={i} className={t.cls}>{t.text}</span> : t.text
  );
}

interface CodeBlockProps {
  code: string;
  language?: string;
}

function CodeBlock({ code, language }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-6 rounded-lg overflow-hidden border border-slate-700/60 bg-[#0d1117]">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-slate-700/60">
        <span className="text-xs text-slate-400 font-mono select-none">
          {language || "code"}
        </span>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors rounded px-2 py-1 hover:bg-slate-700/50"
          aria-label="Copy code"
        >
          {copied
            ? <><Check size={12} strokeWidth={1.5} className="text-green-400" /><span className="text-green-400">Copied!</span></>
            : <><Copy size={12} strokeWidth={1.5} /> Copy</>}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-sm font-mono leading-relaxed">
        <code>{language ? highlight(code, language) : code}</code>
      </pre>
    </div>
  );
}

/**
 * Renders markdown content as React elements.
 * Handles: headings, bold, italic, code blocks, inline code, lists, links, blockquotes, images.
 */
export function MarkdownRenderer({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code block
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(<CodeBlock key={i} code={codeLines.join("\n")} language={lang || undefined} />);
      i++;
      continue;
    }

    // Headings
    if (line.startsWith("### ")) {
      const text = line.slice(4);
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      elements.push(<h3 key={i} id={id} className="text-xl font-semibold text-[var(--color-ink)] mt-8 mb-3">{renderInline(text)}</h3>);
      i++; continue;
    }
    if (line.startsWith("## ")) {
      const text = line.slice(3);
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      elements.push(<h2 key={i} id={id} className="text-2xl font-bold text-[var(--color-ink)] mt-10 mb-4 font-blog-heading">{renderInline(text)}</h2>);
      i++; continue;
    }
    if (line.startsWith("# ")) {
      const text = line.slice(2);
      elements.push(<h1 key={i} className="text-3xl font-bold text-[var(--color-ink)] mt-8 mb-4 font-blog-heading">{renderInline(text)}</h1>);
      i++; continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      elements.push(
        <blockquote key={i} className="border-l-4 border-[var(--color-accent)] pl-4 my-4 text-[var(--color-ink-muted)] italic">
          {renderInline(line.slice(2))}
        </blockquote>
      );
      i++; continue;
    }

    // Unordered list
    if (line.startsWith("- ") || line.startsWith("* ")) {
      const items: string[] = [];
      while (i < lines.length && (lines[i].startsWith("- ") || lines[i].startsWith("* "))) {
        items.push(lines[i].slice(2));
        i++;
      }
      elements.push(
        <ul key={i} className="my-4 space-y-1.5 list-disc list-inside text-[var(--color-ink)]">
          {items.map((item, j) => <li key={j}>{renderInline(item)}</li>)}
        </ul>
      );
      continue;
    }

    // Ordered list
    if (/^\d+\. /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\. /, ""));
        i++;
      }
      elements.push(
        <ol key={i} className="my-4 space-y-1.5 list-decimal list-inside text-[var(--color-ink)]">
          {items.map((item, j) => <li key={j}>{renderInline(item)}</li>)}
        </ol>
      );
      continue;
    }

    // Horizontal rule
    if (line === "---" || line === "***") {
      elements.push(<hr key={i} className="my-8 border-[var(--color-border)]" />);
      i++; continue;
    }

    // Empty line
    if (line.trim() === "") {
      i++; continue;
    }

    // Paragraph
    elements.push(
      <p key={i} className="my-4 text-[var(--color-ink)] leading-[1.75]">
        {renderInline(line)}
      </p>
    );
    i++;
  }

  return <div className="blog-content">{elements}</div>;
}

function renderInline(text: string): React.ReactNode {
  // Split on inline patterns: **bold**, *italic*, `code`, [link](url)
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Bold
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    // Italic
    const italicMatch = remaining.match(/\*(.+?)\*/);
    // Inline code
    const codeMatch = remaining.match(/`([^`]+)`/);
    // Link
    const linkMatch = remaining.match(/\[(.+?)\]\((.+?)\)/);

    const matches = [
      boldMatch && { match: boldMatch, type: "bold" },
      italicMatch && { match: italicMatch, type: "italic" },
      codeMatch && { match: codeMatch, type: "code" },
      linkMatch && { match: linkMatch, type: "link" },
    ].filter(Boolean) as { match: RegExpMatchArray; type: string }[];

    if (matches.length === 0) {
      parts.push(remaining);
      break;
    }

    // Find earliest match
    const earliest = matches.reduce((a, b) =>
      (a.match.index ?? Infinity) < (b.match.index ?? Infinity) ? a : b
    );

    const { match, type } = earliest;
    const idx = match.index!;

    if (idx > 0) parts.push(remaining.slice(0, idx));

    if (type === "bold") {
      parts.push(<strong key={key++} className="font-semibold text-[var(--color-ink)]">{match[1]}</strong>);
    } else if (type === "italic") {
      parts.push(<em key={key++}>{match[1]}</em>);
    } else if (type === "code") {
      parts.push(<code key={key++} className="rounded bg-[var(--color-surface-raised)] border border-[var(--color-border)] px-1.5 py-0.5 text-sm font-mono text-[var(--color-ink)]">{match[1]}</code>);
    } else if (type === "link") {
      parts.push(<a key={key++} href={match[2]} className="text-[var(--color-accent)] hover:underline" target={match[2].startsWith("http") ? "_blank" : undefined} rel={match[2].startsWith("http") ? "noopener noreferrer" : undefined}>{match[1]}</a>);
    }

    remaining = remaining.slice(idx + match[0].length);
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>;
}
