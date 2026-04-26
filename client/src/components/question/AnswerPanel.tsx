import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
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
  const starts = ['graph','flowchart','sequencediagram','classdiagram','statediagram','erdiagram','journey','gantt','pie','gitgraph','mindmap','timeline'];
  return starts.some(s => first.startsWith(s));
}

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div className="rounded-xl overflow-hidden border border-border my-4">
      <div className="flex items-center justify-between px-4 py-2 bg-muted border-b border-border">
        <span className="text-xs font-mono text-muted-foreground uppercase">{language || 'code'}</span>
        <button onClick={copy} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          {copied ? <><Check className="w-3.5 h-3.5 text-emerald-500" /><span className="text-emerald-500">Copied</span></> : <><Copy className="w-3.5 h-3.5" />Copy</>}
        </button>
      </div>
      <SyntaxHighlighter language={language || 'text'} style={vscDarkPlus}
        customStyle={{ margin: 0, padding: '1rem 1.25rem', background: 'transparent', fontSize: '0.8125rem', lineHeight: '1.6' }}
        wrapLines wrapLongLines>
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

export function AnswerPanel({ question, isCompleted }: {
  question: Question;
  isCompleted: boolean;
}) {
  const [blogPost, setBlogPost] = useState<{ title: string; slug: string; url: string } | null>(null);
  const [diagramOk, setDiagramOk] = useState<boolean | null>(null);
  const [selfRating, setSelfRating] = useState<ConfidenceRating | null>(null);

  useEffect(() => { BlogService.getByQuestionId(question.id).then(setBlogPost); }, [question.id]);
  useEffect(() => { setSelfRating(null); }, [question.id]);

  const handleSelfRate = (rating: ConfidenceRating) => {
    setSelfRating(rating);
    recordReview(question.id, question.channel, question.difficulty, rating);
  };

  const hasTldr = !!question.answer;
  const hasDiagram = isValidMermaid(question.diagram) && diagramOk !== false;
  const hasEli5 = !!question.eli5;
  const hasVideo = !!(question.videos?.shortVideo || question.videos?.longVideo);

  const renderMd = useCallback((text: string) => (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
      code({ className, children }) {
        const match = /language-(\w+)/.exec(className || '');
        const lang = match?.[1] ?? '';
        const src = String(children).replace(/\n$/, '');
        if (!match && !src.includes('\n')) return <code className="px-1.5 py-0.5 bg-muted text-foreground rounded text-[0.85em] font-mono border border-border">{children}</code>;
        if (lang === 'mermaid') return isValidMermaid(src) ? <div className="my-4"><EnhancedMermaid chart={src} /></div> : null;
        return <CodeBlock code={src} language={lang} />;
      },
      p: ({ children }) => <p className="mb-4 leading-relaxed text-foreground/90 text-sm sm:text-base">{children}</p>,
      h1: ({ children }) => <h2 className="text-lg font-bold mt-8 mb-3 text-foreground border-b border-border pb-2">{children}</h2>,
      h2: ({ children }) => <h3 className="text-base font-bold mt-6 mb-2 text-foreground">{children}</h3>,
      h3: ({ children }) => <h4 className="text-sm font-semibold mt-4 mb-1.5 text-foreground/90">{children}</h4>,
      strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
      ul: ({ children }) => <ul className="mb-4 space-y-1.5 ml-4">{children}</ul>,
      ol: ({ children }) => <ol className="mb-4 space-y-1.5 ml-4 list-decimal">{children}</ol>,
      li: ({ children }) => <li className="text-sm sm:text-base text-foreground/90 leading-relaxed pl-1">{children}</li>,
      a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 hover:text-primary/80">{children}</a>,
      blockquote: ({ children }) => <blockquote className="border-l-2 border-primary/40 pl-4 my-3 text-muted-foreground italic text-sm">{children}</blockquote>,
      table: ({ children }) => <div className="my-4 overflow-x-auto"><table className="w-full border-collapse text-sm">{children}</table></div>,
      th: ({ children }) => <th className="px-3 py-2 text-left font-semibold bg-muted border border-border text-xs">{children}</th>,
      td: ({ children }) => <td className="px-3 py-2 border border-border text-xs text-foreground/90">{children}</td>,
    }}>
      {preprocessMarkdown(text)}
    </ReactMarkdown>
  ), []);

  return (
    <div className="space-y-8">
      {/* Self-assessment recall banner */}
      {!selfRating ? (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <p className="text-xs font-semibold text-foreground mb-3">Before reading — how well did you recall this?</p>
          <RecallRatingBar onRate={handleSelfRate} size="md" />
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Check className="w-3.5 h-3.5 text-emerald-500" />
          <span>Self-assessment recorded — keep reading.</span>
        </div>
      )}

      {/* Quick answer / TL;DR */}
      {hasTldr && (
        <div className="flex gap-3">
          <Lightbulb className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
          <p className="text-base text-foreground leading-relaxed">{question.answer}</p>
        </div>
      )}

      {/* Diagram */}
      {question.diagram && (
        <div className={hasDiagram ? '' : 'hidden'}>
          <div className="flex items-center gap-2 mb-3">
            <GitBranch className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Diagram</span>
          </div>
          <EnhancedMermaid chart={question.diagram} onRenderResult={ok => setDiagramOk(ok)} />
        </div>
      )}

      {/* ELI5 */}
      {hasEli5 && (
        <div className="bg-muted/40 rounded-xl p-4 flex gap-3">
          <Baby className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Simple explanation</p>
            <p className="text-sm text-foreground/90 leading-relaxed">{question.eli5}</p>
          </div>
        </div>
      )}

      {/* Video */}
      {hasVideo && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Play className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Video</span>
          </div>
          <YouTubePlayer shortVideo={question.videos?.shortVideo} longVideo={question.videos?.longVideo} />
        </div>
      )}

      {/* Full explanation */}
      {question.explanation && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">Explanation</p>
          <div className="prose-sm max-w-none">{renderMd(question.explanation)}</div>
        </div>
      )}

      {/* Tags */}
      {question.tags && question.tags.length > 0 && (
        <div className="flex items-start gap-2 pt-2">
          <Tag className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div className="flex flex-wrap gap-1.5">
            {question.tags.map(tag => (
              <span key={tag} className="text-xs font-mono text-muted-foreground/70 hover:text-muted-foreground transition-colors cursor-default">
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
            <a href={question.sourceUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-1.5 transition-colors">
              <ExternalLink className="w-3.5 h-3.5" /> Source
            </a>
          )}
          {blogPost && (
            <a href={`https://openstackdaily.github.io${blogPost.url}`} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary border border-primary/30 rounded-lg px-3 py-1.5 hover:bg-primary/5 transition-colors">
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
