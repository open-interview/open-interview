import { useState } from "react";
import { Check, Copy } from "lucide-react";

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
    <div className="relative group my-6 rounded-lg overflow-hidden border border-[var(--color-border)] bg-[#0f172a]">
      {language && (
        <div className="absolute top-2 left-3 text-xs text-slate-400 font-mono select-none">
          {language}
        </div>
      )}
      <button
        onClick={copy}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity rounded p-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300"
        aria-label="Copy code"
      >
        {copied ? <Check size={14} strokeWidth={1.5} /> : <Copy size={14} strokeWidth={1.5} />}
      </button>
      <pre className={`overflow-x-auto p-4 text-sm text-slate-200 font-mono leading-relaxed ${language ? "pt-8" : ""}`}>
        <code>{code}</code>
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
      elements.push(<h2 key={i} id={id} className="text-2xl font-bold text-[var(--color-ink)] mt-10 mb-4" style={{ fontFamily: "var(--font-blog-heading)" }}>{renderInline(text)}</h2>);
      i++; continue;
    }
    if (line.startsWith("# ")) {
      const text = line.slice(2);
      elements.push(<h1 key={i} className="text-3xl font-bold text-[var(--color-ink)] mt-8 mb-4" style={{ fontFamily: "var(--font-blog-heading)" }}>{renderInline(text)}</h1>);
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
