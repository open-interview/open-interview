import { useState, lazy, Suspense } from "react";
import { Check, Copy } from "lucide-react";

// ─── Mermaid / Diagram Block ──────────────────────────────────────────────────

const InteractiveDiagram = lazy(() =>
  import("@/components/InteractiveDiagram").then((m) => ({ default: m.InteractiveDiagram }))
);

function MermaidBlock({ code }: { code: string }) {
  return (
    <div className="my-8 not-prose">
      <Suspense
        fallback={
          <div className="flex items-center justify-center rounded-xl border border-slate-700/60 bg-[#0d1117] p-10 text-slate-400 text-sm">
            Loading diagram…
          </div>
        }
      >
        <InteractiveDiagram chart={code} />
      </Suspense>
    </div>
  );
}

// ─── Syntax Highlighting ─────────────────────────────────────────────────────

function highlight(code: string, lang: string): React.ReactNode[] {
  if (!lang || lang === "text" || lang === "plaintext") return [code];

  const patterns: { re: RegExp; cls: string }[] = [
    { re: /(\/\/[^\n]*|\/\*[\s\S]*?\*\/|#[^\n]*)/g,                                          cls: "text-slate-400 italic" },
    { re: /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g,                        cls: "text-emerald-400" },
    { re: /\b(true|false|null|undefined|nil|None|True|False)\b/g,                             cls: "text-orange-400" },
    { re: /\b(\d+\.?\d*)\b/g,                                                                 cls: "text-amber-400" },
    { re: /\b(const|let|var|function|class|return|if|else|for|while|import|export|from|default|async|await|new|typeof|instanceof|extends|implements|interface|type|enum|public|private|protected|static|void|def|lambda|yield|pass|break|continue|try|catch|finally|throw|in|of|do|switch|case|with|as|is|not|and|or|package|struct|func|go|chan|select|defer|map|range|make|append|len|cap|delete|copy|close|panic|recover|print|println)\b/g, cls: "text-violet-400 font-medium" },
    { re: /\b([A-Z][a-zA-Z0-9_]*)\b/g,                                                       cls: "text-sky-300" },
    { re: /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*(?=\()/g,                                            cls: "text-blue-300" },
  ];

  type Token = { text: string; cls?: string };
  const tokens: Token[] = [{ text: code }];

  for (const { re, cls } of patterns) {
    const next: Token[] = [];
    for (const tok of tokens) {
      if (tok.cls) { next.push(tok); continue; }
      let last = 0; let m: RegExpExecArray | null; re.lastIndex = 0;
      while ((m = re.exec(tok.text)) !== null) {
        if (m.index > last) next.push({ text: tok.text.slice(last, m.index) });
        next.push({ text: m[0], cls });
        last = m.index + m[0].length;
      }
      if (last < tok.text.length) next.push({ text: tok.text.slice(last) });
    }
    tokens.splice(0, tokens.length, ...next);
  }

  return tokens.map((t, i) => t.cls ? <span key={i} className={t.cls}>{t.text}</span> : t.text);
}

// ─── Code Block Component ─────────────────────────────────────────────────────

function CodeBlock({ code, language }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative group my-6 rounded-xl overflow-hidden border border-slate-700/60 bg-[#0d1117] shadow-lg">
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#161b22] border-b border-slate-700/60">
        <span className="text-xs text-slate-400 font-mono select-none tracking-wide">{language || "code"}</span>
        <button type="button" onClick={copy}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors rounded px-2 py-1 hover:bg-slate-700/50"
          aria-label="Copy code">
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

// ─── Content Preprocessor ─────────────────────────────────────────────────────

function decodeEntities(s: string): string {
  return s
    .replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ').replace(/&#x27;/g, "'").replace(/&#x2F;/g, '/');
}

function detectLang(code: string): string {
  const t = code.trim();
  if (/\b(GET|POST|PUT|DELETE|PATCH)\s+\//.test(t)) return 'http';
  if (/^(apiVersion:|kind:\s+[A-Z]|spec:\s|metadata:\s)/.test(t)) return 'yaml';
  if (/\b(kubectl|helm)\b|\bdocker\s+(build|run|push|pull|exec)\b/.test(t)) return 'bash';
  if (/^\s*\$\s/.test(t) || /\bnpm\s+|\bpnpm\s+|\byarn\s+/.test(t)) return 'bash';
  if (/\b(func\s+\w|package\s+\w|:=\s|goroutine\b)/.test(t)) return 'go';
  if (/\b(def\s+\w|from\s+\w+\s+import|if\s+__name__)\b/.test(t) && !/{/.test(t)) return 'python';
  if (/\b(interface\s+\w|type\s+\w+\s*=|:\s*string\b|:\s*number\b)/.test(t)) return 'typescript';
  if (/\b(const|let|var|function\s+\w|require\s*\(|module\.exports|=>\s*\{)\b/.test(t)) return 'javascript';
  if (/class\s+\w|\bdef\s+\w/.test(t)) return 'javascript';
  return 'plaintext';
}

/**
 * Removes citation superscripts like " 1 .", " 3 " or clusters " 1 2 3 4 " between sentences.
 */
function removeCitations(text: string): string {
  // Comma-separated clusters "word 1 , 2 , 6 ." → "word."
  text = text.replace(/(\w|\))(\s+\d{1,2}\s*,?\s*)+\./g, '$1.');
  // Clusters before capital word "word 1 , 2 , 3 NextWord" → "word NextWord"
  text = text.replace(/(\w|\))(\s+\d{1,2}\s*,?\s*)+(?=\s+[A-Z])/g, '$1');
  // Orphaned "2 ,." → "."
  text = text.replace(/\s+\d{1,2}\s*,\./g, '.');
  // Remove citation between word boundaries
  text = text.replace(/([a-z,;])\s+\d{1,2}\s+([A-Z])/g, '$1 $2');
  // Remove trailing citations: " 6 , 2 ," at end of line
  text = text.replace(/(\s+\d{1,2}\s*,?\s*)+$/gm, '');
  // "[N]" style
  text = text.replace(/\s*\[\d+\]/g, '');
  return text;
}

/**
 * Reformats an inline (single-line, space-separated) mermaid diagram string
 * by inserting proper newlines so mermaid can parse it correctly.
 */
function reformatInlineMermaid(raw: string): string {
  let t = raw.trim().replace(/  +/g, ' ');
  // After the diagram header, put first node on new line
  t = t.replace(/^((?:graph|flowchart)\s+\w+)\s+([A-Z(])/m, '$1\n  $2');
  t = t.replace(/^(sequenceDiagram|classDiagram|stateDiagram(?:-v2)?|gitGraph|erDiagram|gantt)\s+/m, '$1\n  ');
  // After ] when followed by a node ID starting a new statement
  t = t.replace(/\]\s+([A-Z][a-zA-Z0-9_]*\s*\[)/g, ']\n  $1');
  // After ] when followed by plain node + arrow
  t = t.replace(/\]\s+([A-Z][a-zA-Z0-9_]*)\s+(-->|->|--)/g, ']\n  $1 $2');
  // Plain node followed by new statement (e.g. "D --> E E --> F")
  t = t.replace(/\b([A-Z][a-zA-Z0-9_]*)\s+([A-Z][a-zA-Z0-9_]*\s+-->)/g, '$1\n  $2');
  // subgraph and end on their own lines
  t = t.replace(/\s+subgraph\s+/g, '\n  subgraph ');
  t = t.replace(/\s+end\b/g, '\n  end');
  return t;
}

/**
 * Document-level preprocessor — strips auto-generated content noise that
 * affects all 121 blog posts before the markdown parser sees the content.
 *
 * Handles:
 *  1. Removes duplicate "## Conclusion" (always mirrors "## Wrapping Up")
 *  2. Strips inline "Share This [emoji] ... #hashtags" social blobs
 *  3. Strips "Real-World Case Study ... Key Takeaway: ..." inline blobs
 *  4. Strips inline "References N title type..." lists
 *  5. Strips "Did you know?" blurbs
 *  6. Wraps raw single-line mermaid diagrams in proper ```mermaid code fences
 *  7. Converts "Key Takeaways Item1 Item2" run-on text to bullet lists
 */
function preprocessDocument(raw: string): string {
  let text = raw;

  // ── 1. Wrap raw single-line mermaid diagrams in code fences FIRST ───────
  // Must happen before any noise-stripping so regexes can't eat diagram content.
  const MERMAID_START = /^(graph\s+(?:TD|LR|RL|BT|TB)|flowchart(?:\s+(?:TD|LR|RL|BT|TB))?|sequenceDiagram|classDiagram|stateDiagram(?:-v2)?|gitGraph|erDiagram|gantt|pie\s+title|mindmap)/;
  {
    const lines = text.split('\n');
    const output: string[] = [];
    let inFence = false;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith('```')) {
        inFence = !inFence;
        output.push(line);
        continue;
      }
      if (!inFence && MERMAID_START.test(line.trim())) {
        // Trim trailing noise (these markers appear on the same raw line)
        const noiseIdx = line.search(/\b(Did you know|Key Takeaways|References\s+\d|Share This)\b/);
        const mermaidRaw = noiseIdx > 0 ? line.substring(0, noiseIdx).trim() : line.trim();
        const reformatted = reformatInlineMermaid(mermaidRaw);
        output.push('```mermaid');
        output.push(reformatted);
        output.push('```');
      } else {
        output.push(line);
      }
    }
    text = output.join('\n');
  }

  // ── 2. Remove duplicate "## Conclusion" section ────────────────────────────
  if (text.includes('## Wrapping Up') && text.includes('## Conclusion')) {
    text = text.replace(/\n## Conclusion\n[\s\S]*?(?=\n## |$)/, '');
  }

  // ── 3. Strip noise patterns — line-scoped only (never cross ``` fences) ───
  // "Share This …" — always ends on the same line
  text = text.replace(/Share This[^\n]*/g, '');
  // "Real-World Case Study … Key Takeaway: …" — inline on one line
  text = text.replace(/Real-World Case Study[^\n]*Key Takeaway:[^\n]*/g, '');
  // "References 1 title …" — rest of the line
  text = text.replace(/\bReferences\s+\d[^\n]*/g, '');
  // "Did you know? …" — to end of sentence on same line
  text = text.replace(/Did you know\?[^\n]*/g, '');

  // ── 4. Convert "Key Takeaways Item1 Item2 …" run-on text to bullets ───────
  text = text.replace(/\bKey Takeaways\b([^\n]+)/g, (_match, items: string) => {
    const parts = items.trim()
      .split(/(?<=[a-z])\s+(?=[A-Z])/)
      .map((s: string) => s.trim())
      .filter(Boolean);
    if (parts.length === 0) return '';
    return '\n**Key Takeaways:**\n' + parts.map((s: string) => `- ${s}`).join('\n');
  });

  return text;
}

/**
 * Converts "Term : Description" inline lists to markdown bullet lists.
 * Uses a separator-based approach: finds all "TitleCase : " occurrences,
 * then slices the text between consecutive separators to form pairs.
 * Only converts pairs with short descriptions (≤ 150 chars) so we don't
 * accidentally consume prose or code that follows the last list item.
 */
function convertTermLists(text: string): string {
  const SEP_RE = /(?:^|(?<=\s))([A-Z][a-zA-Z\/\-]+(?:\s+[A-Za-z][a-zA-Z\/\-]*){0,3})\s+:\s+/g;
  const seps: Array<{ start: number; term: string; descStart: number }> = [];

  let m: RegExpExecArray | null;
  while ((m = SEP_RE.exec(text)) !== null) {
    seps.push({ start: m.index, term: m[1].trim(), descStart: m.index + m[0].length });
  }

  if (seps.length < 2) return text;

  // Build pairs: description for item i = text from descStart[i] to start[i+1]
  // For the last item, cap the description at 150 chars or the first sentence end
  const pairs: Array<{ term: string; desc: string }> = [];
  let listEnd = text.length;

  for (let i = 0; i < seps.length; i++) {
    let descEnd: number;
    if (i + 1 < seps.length) {
      descEnd = seps[i + 1].start;
    } else {
      // Last item: find natural end of description within 150 chars
      const raw = text.slice(seps[i].descStart);
      // End at a sentence-starter or after 150 chars
      const SENTENCE_BREAK = /(?<=\w)\s+(?=(?:Here'?s|This|The|That|It|These|Those|Note|However|Additionally|Furthermore|Now|In|For|By|To|Consider|Remember|While|Although|When|As|Since|Because|Beyond|Unlike|Instead|Both|Each|All|One|Two|Three)[^a-z])/;
      const brk = SENTENCE_BREAK.exec(raw);
      if (brk && brk.index < 200) {
        descEnd = seps[i].descStart + brk.index;
        listEnd = descEnd;
      } else {
        // Fall back to 150 char limit
        descEnd = seps[i].descStart + Math.min(raw.length, 150);
        // Round to last word boundary
        const cutText = text.slice(seps[i].descStart, descEnd);
        const lastSpace = cutText.lastIndexOf(' ');
        if (lastSpace > 50) descEnd = seps[i].descStart + lastSpace;
        listEnd = descEnd;
      }
    }

    const descLen = descEnd - seps[i].descStart;
    if (descLen > 160) {
      // Description too long — stop list here
      if (pairs.length < 2) return text;
      listEnd = seps[i].start;
      break;
    }

    const desc = text.slice(seps[i].descStart, descEnd).trim();
    if (desc.length >= 4) pairs.push({ term: seps[i].term, desc });
  }

  if (pairs.length < 2) return text;

  const listStart = seps[0].start;
  const listMd = pairs.map(p => `- **${p.term}**: ${p.desc}`).join('\n');
  return text.slice(0, listStart) + '\n\n' + listMd + '\n\n' + text.slice(listEnd).trimStart();
}

/**
 * Detects whether the full content is primarily code (not prose).
 * Returns the language string if so, or null if it's prose.
 */
function detectEntirelyCode(text: string): string | null {
  const t = text.trim();
  if (!t) return null;
  const CODE_START = /^(\/\/\s|\/\*|#\s+[A-Z]|\$\s|apiVersion:|kind:\s+[A-Z]|metadata:\s|spec:\s|(?:GET|POST|PUT|DELETE|PATCH)\s+\/|(?:const|let|var|function|class)\s+\w|def\s+\w|import\s+\w+\s+from\b)/;
  if (CODE_START.test(t)) return detectLang(t);

  // High token density
  const codeTokens = (t.match(/\b(const|let|var|function|class|return|if|else|for|while|import|export|apiVersion|kubectl|docker|def|this\.|\.map|\.filter|\.reduce)\b/g) || []).length;
  if (codeTokens >= 3 && t.split(/\s+/).length <= 80) return detectLang(t);

  return null;
}

/**
 * Extracts inline code blocks that are mixed into prose text.
 * Looks for code-start markers preceded by a sentence boundary,
 * and ends the code block at the next natural prose sentence.
 *
 * Only applies when the code block makes up the majority of the content.
 */
function extractInlineCode(text: string): string {
  // Markers that signal start of embedded code (must follow ". " or ": ")
  const CODE_MARKER = /(?:(?:\.\s+)|(?::\s+))((?:\/\/\s+\S|apiVersion:|(?:GET|POST|PUT|DELETE|PATCH)\s+\/|kubectl\s+\w|# (?:Deploy|Create|Configure|Example|Run|Install|Build|Here|The|Setup|Node|Get|Set|Add|Start|Stop)))/g;

  // Prose-resume pattern: capital word followed by 2+ lowercase words (sentence pattern)
  const PROSE_RESUME = /\s+([A-Z][a-z]{2,}(?:\s+[a-z][a-z']{1,}){2,})/;

  const segments: Array<{ text: string; isCode: boolean; lang?: string }> = [];
  let lastEnd = 0;

  let cm: RegExpExecArray | null;
  while ((cm = CODE_MARKER.exec(text)) !== null) {
    // The code actually starts at the marker (not at the ". " before it)
    const boundary = cm.index + cm[0].indexOf(cm[1]);
    if (boundary <= lastEnd) continue;

    // Add prose before this code block
    const prose = text.slice(lastEnd, boundary).trimEnd();
    if (prose) segments.push({ text: prose, isCode: false });

    const remaining = text.slice(boundary);
    const proseMatch = PROSE_RESUME.exec(remaining);

    let codeEnd: number;
    if (proseMatch && proseMatch.index > 30) {
      codeEnd = boundary + proseMatch.index;
    } else {
      codeEnd = text.length;
    }

    const codeText = text.slice(boundary, codeEnd).trim();
    if (codeText.length > 20) {
      segments.push({ text: codeText, isCode: true, lang: detectLang(codeText) });
    }
    lastEnd = codeEnd;
    CODE_MARKER.lastIndex = codeEnd;
  }

  // If no segments extracted, return original
  if (segments.length === 0) return text;

  // If the first segment is code (covers > 60% of text), the extraction is too aggressive — skip
  if (segments[0]?.isCode && segments[0].text.length > text.length * 0.6) return text;

  if (lastEnd < text.length) segments.push({ text: text.slice(lastEnd), isCode: false });

  return segments.map(seg => {
    if (!seg.isCode) return seg.text;
    return '\n\n```' + (seg.lang || 'plaintext') + '\n' + seg.text + '\n```\n\n';
  }).join('');
}

/**
 * Splits a long flat prose string into readable paragraphs.
 */
function addParagraphBreaks(text: string): string {
  if (text.includes('\n')) return text;
  return text.replace(
    /([.!?])\s+((?:The|This|It|These|Those|However|Additionally|Furthermore|Moreover|In\s+(?:addition|contrast|summary|conclusion|practice)|Note\s+that|Consider|Remember|When\s+(?:you|we)|While\s+(?:this|it)|Although|By\s+(?:using|default|contrast)|To\s+(?:understand|implement|use|avoid|ensure)|One\s+(?:key|important|major)|Another\s+(?:key|important)|Unlike|Similar|Despite|Instead|Beyond|Since|Because|Although|Even\s+though)\s)/g,
    '$1\n\n$2'
  );
}

/**
 * Master preprocessor: converts raw flat blog content to clean markdown.
 */
export function preprocessBlogContent(raw: string): string {
  // 0. Document-level cleanup: strip noise, wrap raw mermaid, remove duplicates
  let text = preprocessDocument(raw);

  // 1. Decode HTML entities (most impactful — fixes &quot;, &lt;, &gt;, etc.)
  text = decodeEntities(text);

  // 2. Remove citation superscripts like " 1 ." between sentences
  text = removeCitations(text);

  // 3. If the entire section content is code, wrap the whole thing
  const codeLang = detectEntirelyCode(text.trim());
  if (codeLang) {
    return '```' + codeLang + '\n' + text.trim() + '\n```';
  }

  // 4. Convert "Term : Description" inline lists to bullet points
  text = convertTermLists(text);

  // 5. Try to extract inline code blocks embedded in prose
  text = extractInlineCode(text);

  // 6. Add paragraph breaks to long prose passages
  text = addParagraphBreaks(text);

  return text;
}

// ─── Inline Renderer ─────────────────────────────────────────────────────────

function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    const boldMatch   = remaining.match(/\*\*(.+?)\*\*/);
    const italicMatch = remaining.match(/(?<!\*)\*([^*\n]+?)\*(?!\*)/);
    const codeMatch   = remaining.match(/`([^`\n]+)`/);
    const linkMatch   = remaining.match(/\[(.+?)\]\(([^)]+)\)/);
    const strikeMatch = remaining.match(/~~(.+?)~~/);

    const matches = [
      boldMatch   && { match: boldMatch,   type: "bold"   },
      italicMatch && { match: italicMatch, type: "italic" },
      codeMatch   && { match: codeMatch,   type: "code"   },
      linkMatch   && { match: linkMatch,   type: "link"   },
      strikeMatch && { match: strikeMatch, type: "strike" },
    ].filter(Boolean) as { match: RegExpMatchArray; type: string }[];

    if (matches.length === 0) { parts.push(remaining); break; }

    const earliest = matches.reduce((a, b) =>
      (a.match.index ?? Infinity) < (b.match.index ?? Infinity) ? a : b
    );
    const { match, type } = earliest;
    const idx = match.index!;
    if (idx > 0) parts.push(remaining.slice(0, idx));

    switch (type) {
      case "bold":
        parts.push(<strong key={key++} className="font-semibold text-[var(--color-ink)]">{match[1]}</strong>);
        break;
      case "italic":
        parts.push(<em key={key++} className="italic">{match[1]}</em>);
        break;
      case "code":
        parts.push(
          <code key={key++} className="rounded-md bg-[var(--color-surface-raised)] border border-[var(--color-border)] px-1.5 py-0.5 text-[0.85em] font-mono text-[var(--color-ink)]">
            {match[1]}
          </code>
        );
        break;
      case "link":
        parts.push(
          <a key={key++} href={match[2]}
            className="text-[var(--color-accent)] underline underline-offset-2 hover:opacity-80 transition-opacity"
            target={match[2].startsWith("http") ? "_blank" : undefined}
            rel={match[2].startsWith("http") ? "noopener noreferrer" : undefined}>
            {match[1]}
          </a>
        );
        break;
      case "strike":
        parts.push(<del key={key++} className="line-through opacity-60">{match[1]}</del>);
        break;
    }
    remaining = remaining.slice(idx + match[0].length);
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>;
}

// ─── Markdown Parser ──────────────────────────────────────────────────────────

export function MarkdownRenderer({ content }: { content: string }) {
  const processed = preprocessBlogContent(content);
  const lines = processed.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;
  let keyCounter = 0;
  const k = () => keyCounter++;

  while (i < lines.length) {
    const line = lines[i];

    // ── Fenced code block ─────────────────────────────────────────────────────
    if (line.trimStart().startsWith("```")) {
      const lang = line.trimStart().slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trimStart().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      const codeContent = codeLines.join("\n");
      if (lang === "mermaid") {
        elements.push(<MermaidBlock key={k()} code={codeContent} />);
      } else {
        elements.push(<CodeBlock key={k()} code={codeContent} language={lang || undefined} />);
      }
      i++; continue;
    }

    // ── Headings ──────────────────────────────────────────────────────────────
    if (line.startsWith("#### ")) {
      elements.push(<h4 key={k()} className="text-lg font-semibold text-[var(--color-ink)] mt-6 mb-2">{renderInline(line.slice(5))}</h4>);
      i++; continue;
    }
    if (line.startsWith("### ")) {
      const text = line.slice(4);
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      elements.push(<h3 key={k()} id={id} className="text-xl font-semibold text-[var(--color-ink)] mt-8 mb-3 tracking-tight">{renderInline(text)}</h3>);
      i++; continue;
    }
    if (line.startsWith("## ")) {
      const text = line.slice(3);
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const isKeyTakeaways = text.trim() === "Key Takeaways";
      if (isKeyTakeaways) {
        elements.push(
          <div key={k()} className="flex items-center gap-3 mt-10 mb-4">
            <div className="h-px flex-1 bg-[var(--color-accent)]/20" />
            <h2 id={id} className="text-xl font-bold text-[var(--color-accent)] font-blog-heading tracking-tight shrink-0">
              ✦ Key Takeaways
            </h2>
            <div className="h-px flex-1 bg-[var(--color-accent)]/20" />
          </div>
        );
      } else {
        elements.push(<h2 key={k()} id={id} className="text-2xl font-bold text-[var(--color-ink)] mt-10 mb-4 font-blog-heading tracking-tight">{renderInline(text)}</h2>);
      }
      i++; continue;
    }
    if (line.startsWith("# ")) {
      elements.push(<h1 key={k()} className="text-3xl font-bold text-[var(--color-ink)] mt-8 mb-4 font-blog-heading">{renderInline(line.slice(2))}</h1>);
      i++; continue;
    }

    // ── Blockquote ────────────────────────────────────────────────────────────
    if (line.startsWith("> ") || line === ">") {
      const quoteLines: string[] = [];
      while (i < lines.length && (lines[i].startsWith("> ") || lines[i] === ">")) {
        quoteLines.push(lines[i].startsWith("> ") ? lines[i].slice(2) : "");
        i++;
      }
      // Detect Case Study callout: "> **Case Study — Company**"
      const isCaseStudy = quoteLines[0]?.startsWith("**Case Study");
      if (isCaseStudy) {
        const header = quoteLines[0];
        const bodyLines = quoteLines.slice(1).filter(l => l.trim());
        elements.push(
          <div key={k()} className="my-6 rounded-xl border border-[var(--color-accent)]/25 bg-[var(--color-accent)]/5 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-[var(--color-accent)]/20 flex items-center gap-2">
              <span className="text-[var(--color-accent)] text-xs font-semibold uppercase tracking-widest">Case Study</span>
            </div>
            <div className="px-4 py-3 space-y-1.5">
              <div className="font-semibold text-[var(--color-ink)] text-sm">{renderInline(header.replace(/\*\*Case Study[—–-]+\s*/, '').replace(/\*\*$/, '').trim())}</div>
              {bodyLines.map((bl, j) => (
                <p key={j} className="text-sm text-[var(--color-ink-muted)] leading-relaxed">{renderInline(bl)}</p>
              ))}
            </div>
          </div>
        );
      } else {
        elements.push(
          <blockquote key={k()} className="border-l-4 border-[var(--color-accent)]/60 pl-5 my-5 py-2 text-[var(--color-ink-muted)] italic bg-[var(--color-surface-raised)]/40 rounded-r-lg">
            {quoteLines.map((ql, j) => <p key={j} className="my-0.5">{renderInline(ql)}</p>)}
          </blockquote>
        );
      }
      continue;
    }

    // ── Unordered list ────────────────────────────────────────────────────────
    if (/^(\s*)([-*+])\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^(\s*)([-*+])\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*+]\s/, ''));
        i++;
      }
      elements.push(
        <ul key={k()} className="my-4 space-y-1.5 pl-6 list-disc text-[var(--color-ink)] marker:text-[var(--color-accent)]/70">
          {items.map((item, j) => (
            <li key={j} className="leading-[1.75] pl-1">{renderInline(item)}</li>
          ))}
        </ul>
      );
      continue;
    }

    // ── Ordered list ──────────────────────────────────────────────────────────
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ''));
        i++;
      }
      elements.push(
        <ol key={k()} className="my-4 space-y-1.5 pl-6 list-decimal text-[var(--color-ink)]">
          {items.map((item, j) => (
            <li key={j} className="leading-[1.75] pl-1">{renderInline(item)}</li>
          ))}
        </ol>
      );
      continue;
    }

    // ── Table ─────────────────────────────────────────────────────────────────
    if (line.includes("|") && lines[i + 1]?.match(/^\|?[-| :]+\|?$/)) {
      const tableRows: string[][] = [];
      while (i < lines.length && lines[i].includes("|")) {
        if (!lines[i].match(/^\|?[-| :]+\|?$/)) {
          const cells = lines[i].split("|").map(c => c.trim());
          tableRows.push(cells.length > 2 ? cells.slice(1, -1) : cells);
        }
        i++;
      }
      if (tableRows.length > 0) {
        const [header, ...body] = tableRows;
        elements.push(
          <div key={k()} className="my-6 overflow-x-auto rounded-lg border border-[var(--color-border)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--color-surface-raised)] border-b border-[var(--color-border)]">
                  {header?.map((cell, j) => (
                    <th key={j} className="px-4 py-3 text-left font-semibold text-[var(--color-ink)] whitespace-nowrap">{renderInline(cell)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {body.map((row, ri) => (
                  <tr key={ri} className={ri % 2 === 1 ? "bg-[var(--color-surface-raised)]/40" : ""}>
                    {row.map((cell, ci) => (
                      <td key={ci} className="px-4 py-2.5 text-[var(--color-ink)] border-t border-[var(--color-border)]/50">{renderInline(cell)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      continue;
    }

    // ── Horizontal rule ───────────────────────────────────────────────────────
    if (/^(---+|\*\*\*+|___+)$/.test(line.trim())) {
      elements.push(<hr key={k()} className="my-8 border-[var(--color-border)]" />);
      i++; continue;
    }

    // ── Image ─────────────────────────────────────────────────────────────────
    const imgMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imgMatch) {
      elements.push(
        <figure key={k()} className="my-6">
          <img src={imgMatch[2]} alt={imgMatch[1]} className="rounded-lg w-full object-cover shadow-sm" loading="lazy" />
          {imgMatch[1] && (
            <figcaption className="mt-2 text-center text-xs text-[var(--color-ink-muted)] italic">{imgMatch[1]}</figcaption>
          )}
        </figure>
      );
      i++; continue;
    }

    // ── Empty line ────────────────────────────────────────────────────────────
    if (line.trim() === "") { i++; continue; }

    // ── Paragraph (collect consecutive non-block lines) ───────────────────────
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].startsWith("```") &&
      !lines[i].startsWith("#") &&
      !lines[i].startsWith(">") &&
      !/^\s*[-*+]\s/.test(lines[i]) &&
      !/^\d+\.\s/.test(lines[i]) &&
      !(lines[i].includes("|") && lines[i + 1]?.match(/^\|?[-| :]+\|?$/)) &&
      !/^(---+|\*\*\*+|___+)$/.test(lines[i].trim()) &&
      !lines[i].match(/^!\[/)
    ) {
      paraLines.push(lines[i]);
      i++;
    }

    if (paraLines.length > 0) {
      elements.push(
        <p key={k()} className="my-4 text-[var(--color-ink)] leading-[1.8] text-base">
          {renderInline(paraLines.join(" "))}
        </p>
      );
    }
  }

  return <div className="blog-content prose-blog max-w-none">{elements}</div>;
}
