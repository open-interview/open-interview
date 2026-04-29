import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EnhancedMermaid } from '../EnhancedMermaid';
import { YouTubePlayer } from '../YouTubePlayer';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check, ExternalLink, FileText, Tag, Play, GitBranch, Baby, Lightbulb } from 'lucide-react';
import type { Question } from '../../lib/data';
import { GiscusComments } from '../GiscusComments';
import { SimilarQuestions } from '../SimilarQuestions';
import { formatTag } from '../../lib/utils';
import { BlogService } from '../../services/api.service';
import { RecallRatingBar } from '../shared/RecallRatingBar';
import { recordReview } from '../../lib/spaced-repetition';
import type { ConfidenceRating } from '../../lib/spaced-repetition';

// ─── helpers ────────────────────────────────────────────────────────────────

function preprocessMarkdown(text: string): string {
  if (!text) return '';
  const codeBlocks: string[] = [];
  let out = text.replace(/```[\s\S]*?```/g, m => { codeBlocks.push(m); return `__CB_${codeBlocks.length - 1}__`; });
  out = out.replace(/([OΘΩ])\(([^)]+)\)/g, '`$1($2)`');
  out = out.replace(/^[•·]\s*/gm, '- ');
  out = out.replace(/\n{3,}/g, '\n\n').replace(/^\n+/, '');
  codeBlocks.forEach((b, i) => { out = out.replace(`__CB_${i}__`, b); });
  return out;
}

function isValidMermaid(d: string | undefined | null): boolean {
  if (!d || d.trim().length < 10) return false;
  const first = d.trim().split('\n')[0].toLowerCase();
  return ['graph','flowchart','sequencediagram','classdiagram','statediagram','erdiagram','journey','gantt','pie','gitgraph','mindmap','timeline'].some(s => first.startsWith(s));
}

// ─── M3 Code Block ──────────────────────────────────────────────────────────

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    // M3: surface-variant background, 12dp radius (medium shape)
    <div
      className="my-4 rounded-xl overflow-hidden"
      style={{
        background: 'var(--md-sys-color-surface-variant, #1e1e2e)',
        border: '1px solid var(--md-sys-color-outline-variant, rgba(255,255,255,0.08))',
      }}
    >
      {/* header bar */}
      <div
        className="flex items-center justify-between px-4 py-2"
        style={{
          background: 'rgba(0,0,0,0.25)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <span className="text-xs font-mono font-medium uppercase tracking-wider" style={{ color: 'var(--md-sys-color-primary, #8ab4f8)' }}>
          {language || 'code'}
        </span>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 text-xs transition-colors duration-150 rounded px-2 py-1 hover:bg-white/10"
          style={{ color: copied ? '#34a853' : 'var(--md-sys-color-on-surface-variant, #9aa0a6)' }}
          aria-label="Copy code"
        >
          {copied
            ? <><Check className="w-3.5 h-3.5" /><span>Copied</span></>
            : <><Copy className="w-3.5 h-3.5" /><span>Copy</span></>}
        </button>
      </div>
      {/* syntax-highlighted body */}
      <SyntaxHighlighter
        language={language || 'text'}
        style={vscDarkPlus}
        customStyle={{ margin: 0, padding: '1rem 1.25rem', background: 'transparent', fontSize: '0.8125rem', lineHeight: '1.6' }}
        wrapLines
        wrapLongLines
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export function AnswerPanel({ question, isCompleted }: { question: Question; isCompleted: boolean }) {
  const [blogPost, setBlogPost] = useState<{ title: string; slug: string; url: string } | null>(null);
  const [diagramOk, setDiagramOk] = useState<boolean | null>(null);
  const [selfRating, setSelfRating] = useState<ConfidenceRating | null>(null);

  useEffect(() => { BlogService.getByQuestionId(question.id).then(setBlogPost); }, [question.id]);
  useEffect(() => { setSelfRating(null); }, [question.id]);

  const handleSelfRate = (rating: ConfidenceRating) => {
    setSelfRating(rating);
    recordReview(question.id, question.channel, question.difficulty, rating);
  };

  const hasDiagram = isValidMermaid(question.diagram) && diagramOk !== false;

  // M3 markdown renderer — code blocks use surface-variant, inline code uses surface-container
  const renderMd = useCallback((text: string) => (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ className, children }) {
          const match = /language-(\w+)/.exec(className || '');
          const lang = match?.[1] ?? '';
          const src = String(children).replace(/\n$/, '');
          if (!match && !src.includes('\n')) {
            return (
              <code
                className="px-1.5 py-0.5 rounded text-[0.85em] font-mono"
                style={{
                  background: 'var(--md-sys-color-surface-variant, rgba(255,255,255,0.08))',
                  color: 'var(--md-sys-color-on-surface-variant, #e8eaed)',
                  border: '1px solid var(--md-sys-color-outline-variant, rgba(255,255,255,0.12))',
                }}
              >
                {children}
              </code>
            );
          }
          if (lang === 'mermaid') return isValidMermaid(src) ? <div className="my-4"><EnhancedMermaid chart={src} /></div> : null;
          return <CodeBlock code={src} language={lang} />;
        },
        p: ({ children }) => <p className="mb-4 leading-relaxed text-sm sm:text-base" style={{ color: 'var(--md-sys-color-on-surface, #e8eaed)', opacity: 0.9 }}>{children}</p>,
        h1: ({ children }) => <h2 className="text-lg font-semibold mt-8 mb-3 pb-2" style={{ color: 'var(--md-sys-color-on-surface, #e8eaed)', borderBottom: '1px solid var(--md-sys-color-outline-variant, rgba(255,255,255,0.08))' }}>{children}</h2>,
        h2: ({ children }) => <h3 className="text-base font-semibold mt-6 mb-2" style={{ color: 'var(--md-sys-color-on-surface, #e8eaed)' }}>{children}</h3>,
        h3: ({ children }) => <h4 className="text-sm font-medium mt-4 mb-1.5" style={{ color: 'var(--md-sys-color-on-surface-variant, #9aa0a6)' }}>{children}</h4>,
        strong: ({ children }) => <strong className="font-semibold" style={{ color: 'var(--md-sys-color-on-surface, #e8eaed)' }}>{children}</strong>,
        ul: ({ children }) => <ul className="mb-4 space-y-1.5 ml-4 list-disc">{children}</ul>,
        ol: ({ children }) => <ol className="mb-4 space-y-1.5 ml-4 list-decimal">{children}</ol>,
        li: ({ children }) => <li className="text-sm sm:text-base leading-relaxed pl-1" style={{ color: 'var(--md-sys-color-on-surface, #e8eaed)', opacity: 0.9 }}>{children}</li>,
        a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:opacity-80 transition-opacity" style={{ color: 'var(--md-sys-color-primary, #8ab4f8)' }}>{children}</a>,
        blockquote: ({ children }) => (
          <blockquote className="pl-4 my-3 italic text-sm" style={{ borderLeft: '2px solid var(--md-sys-color-primary, #8ab4f8)', color: 'var(--md-sys-color-on-surface-variant, #9aa0a6)' }}>
            {children}
          </blockquote>
        ),
        table: ({ children }) => <div className="my-4 overflow-x-auto"><table className="w-full border-collapse text-sm">{children}</table></div>,
        th: ({ children }) => <th className="px-3 py-2 text-left text-xs font-semibold" style={{ background: 'var(--md-sys-color-surface-variant, rgba(255,255,255,0.06))', border: '1px solid var(--md-sys-color-outline-variant, rgba(255,255,255,0.08))' }}>{children}</th>,
        td: ({ children }) => <td className="px-3 py-2 text-xs" style={{ border: '1px solid var(--md-sys-color-outline-variant, rgba(255,255,255,0.08))', color: 'var(--md-sys-color-on-surface, #e8eaed)', opacity: 0.9 }}>{children}</td>,
      }}
    >
      {preprocessMarkdown(text)}
    </ReactMarkdown>
  ), []);

  return (
    <div className="space-y-8">
      {/* Self-assessment recall banner */}
      {!selfRating ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl p-4"
          style={{
            background: 'linear-gradient(145deg, rgba(139,92,246,0.08), rgba(60,64,67,0.12))',
            border: '1px solid rgba(139,92,246,0.2)',
          }}
        >
          <p className="text-xs font-semibold mb-3" style={{ color: 'var(--md-sys-color-on-surface, #e8eaed)' }}>
            Before reading — how well did you recall this?
          </p>
          <RecallRatingBar onRate={handleSelfRate} size="md" />
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="flex items-center gap-2 text-xs"
          style={{ color: 'var(--md-sys-color-on-surface-variant, #9aa0a6)' }}
        >
          <Check className="w-3.5 h-3.5" style={{ color: '#34a853' }} />
          <span>Self-assessment recorded — keep reading.</span>
        </motion.div>
      )}

      {/* TL;DR / quick answer */}
      {question.answer && (
        <div className="flex gap-3">
          <Lightbulb className="w-4 h-4 mt-1 flex-shrink-0" style={{ color: 'var(--md-sys-color-primary, #8ab4f8)' }} />
          <p className="text-base leading-relaxed" style={{ color: 'var(--md-sys-color-on-surface, #e8eaed)' }}>
            {question.answer}
          </p>
        </div>
      )}

      {/* Diagram */}
      {question.diagram && (
        <div className={hasDiagram ? '' : 'hidden'}>
          <div className="flex items-center gap-2 mb-3">
            <GitBranch className="w-3.5 h-3.5" style={{ color: 'var(--md-sys-color-on-surface-variant, #9aa0a6)' }} />
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--md-sys-color-on-surface-variant, #9aa0a6)' }}>Diagram</span>
          </div>
          <EnhancedMermaid chart={question.diagram} onRenderResult={ok => setDiagramOk(ok)} />
        </div>
      )}

      {/* ELI5 */}
      {question.eli5 && (
        <div
          className="rounded-xl p-4 flex gap-3"
          style={{ background: 'var(--md-sys-color-surface-variant, rgba(255,255,255,0.05))' }}
        >
          <Baby className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--md-sys-color-on-surface-variant, #9aa0a6)' }} />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--md-sys-color-on-surface-variant, #9aa0a6)' }}>
              Simple explanation
            </p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--md-sys-color-on-surface, #e8eaed)', opacity: 0.9 }}>
              {question.eli5}
            </p>
          </div>
        </div>
      )}

      {/* Video */}
      {(question.videos?.shortVideo || question.videos?.longVideo) && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Play className="w-3.5 h-3.5" style={{ color: 'var(--md-sys-color-on-surface-variant, #9aa0a6)' }} />
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--md-sys-color-on-surface-variant, #9aa0a6)' }}>Video</span>
          </div>
          <YouTubePlayer shortVideo={question.videos?.shortVideo} longVideo={question.videos?.longVideo} />
        </div>
      )}

      {/* Full explanation */}
      {question.explanation && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: 'var(--md-sys-color-on-surface-variant, #9aa0a6)' }}>
            Explanation
          </p>
          <div className="prose-sm max-w-none">{renderMd(question.explanation)}</div>
        </div>
      )}

      {/* Tags */}
      {question.tags && question.tags.length > 0 && (
        <div className="flex items-start gap-2 pt-2">
          <Tag className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: 'var(--md-sys-color-on-surface-variant, #9aa0a6)' }} />
          <div className="flex flex-wrap gap-1.5">
            {question.tags.map(tag => (
              <span
                key={tag}
                className="text-xs font-mono transition-colors cursor-default"
                style={{ color: 'var(--md-sys-color-on-surface-variant, #9aa0a6)', opacity: 0.7 }}
              >
                {formatTag(tag)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Links */}
      {(question.sourceUrl || blogPost) && (
        <div className="flex flex-wrap gap-2 pt-1">
          {question.sourceUrl && (
            <a
              href={question.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium rounded-lg px-3 py-1.5 transition-colors"
              style={{
                color: 'var(--md-sys-color-on-surface-variant, #9aa0a6)',
                border: '1px solid var(--md-sys-color-outline-variant, rgba(255,255,255,0.12))',
              }}
            >
              <ExternalLink className="w-3.5 h-3.5" /> Source
            </a>
          )}
          {blogPost && (
            <a
              href={`https://openstackdaily.github.io${blogPost.url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium rounded-lg px-3 py-1.5 transition-colors hover:opacity-80"
              style={{
                color: 'var(--md-sys-color-primary, #8ab4f8)',
                border: '1px solid var(--md-sys-color-primary, rgba(138,180,248,0.3))',
              }}
            >
              <FileText className="w-3.5 h-3.5" /> Read Blog
            </a>
          )}
        </div>
      )}

      <SimilarQuestions questionId={question.id} currentChannel={question.channel} />
      <GiscusComments questionId={question.id} />
    </div>
  );
}
