/**
 * Gen Z Answer Panel - Immersive Learning Experience
 * Based on ExtremeAnswerPanel with Gen Z aesthetic upgrades
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EnhancedMermaid } from '../EnhancedMermaid';
import { YouTubePlayer } from '../YouTubePlayer';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  BookOpen, Code2, Lightbulb, ExternalLink, ChevronDown, Baby, Copy, Check, Tag,
  GitBranch, Play, FileText, Sparkles, Zap, Eye, Brain, Layers, RotateCcw
} from 'lucide-react';
import type { Question } from '../../lib/data';
import { GiscusComments } from '../GiscusComments';
import { SimilarQuestions } from '../SimilarQuestions';
import { formatTag } from '../../lib/utils';
import { BlogService } from '../../services/api.service';
import type { ReviewCard, ConfidenceRating } from '../../lib/spaced-repetition';

type MediaTab = 'tldr' | 'diagram' | 'eli5' | 'video';

function preprocessMarkdown(text: string): string {
  if (!text) return '';
  let processed = text;
  
  // Protect code blocks from processing by temporarily replacing them
  const codeBlocks: string[] = [];
  processed = processed.replace(/```[\s\S]*?```/g, (match) => {
    codeBlocks.push(match);
    return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
  });
  
  // Fix Big-O notation
  processed = processed.replace(/([OΘΩ])\(([^)]+)\)/g, '`$1($2)`');
  
  // Convert bullet characters to markdown bullets FIRST
  processed = processed.replace(/^[•·]\s*/gm, '- ');
  
  // Handle nested lists: detect sub-bullets after a parent bullet or heading with colon
  const lines = processed.split('\n');
  const fixedLines: string[] = [];
  let inNestedList = false;
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    const trimmedLine = line.trim();
    
    // Check if this is a parent list item (bullet with bold text ending with colon)
    // OR a bold heading ending with colon (like **Key Use Cases:**)
    const isParentItem = /^-\s+\*\*[^*]+:\*\*\s*$/.test(trimmedLine) || /^\*\*[^*]+:\*\*\s*$/.test(trimmedLine);
    
    if (isParentItem) {
      inNestedList = true;
      fixedLines.push(line);
      continue;
    }
    
    // Check if this is a sub-bullet (should be indented)
    if (inNestedList && /^-\s+/.test(trimmedLine)) {
      // Indent sub-bullets with 2 spaces
      fixedLines.push('  ' + trimmedLine);
      continue;
    }
    
    // Exit nested list mode on empty line or non-bullet line
    if (inNestedList && (!trimmedLine || !/^-\s+/.test(trimmedLine))) {
      inNestedList = false;
    }
    
    // Fix orphaned bold markers
    const boldMarkers = (line.match(/\*\*/g) || []).length;
    if (boldMarkers % 2 === 1) {
      if (trimmedLine.startsWith('**') && boldMarkers === 1) {
        line = line.replace(/^\s*\*\*\s*/, '');
      } else if (trimmedLine.endsWith('**') && boldMarkers === 1) {
        line = line.replace(/\s*\*\*\s*$/, '');
      }
    }
    
    fixedLines.push(line);
  }
  processed = fixedLines.join('\n');
  
  // Clean up multiple newlines
  processed = processed.replace(/\n{3,}/g, '\n\n');
  processed = processed.replace(/^\n+/, '');
  
  // Restore code blocks
  codeBlocks.forEach((block, index) => {
    processed = processed.replace(`__CODE_BLOCK_${index}__`, block);
  });
  
  return processed;
}

function isValidMermaidDiagram(diagram: string | undefined | null): boolean {
  if (!diagram || typeof diagram !== 'string') return false;
  const trimmed = diagram.trim();
  if (!trimmed || trimmed.length < 10) return false;
  const validStarts = ['graph', 'flowchart', 'sequenceDiagram', 'classDiagram', 'stateDiagram', 'erDiagram', 'journey', 'gantt', 'pie', 'gitGraph', 'mindmap', 'timeline', 'quadrantChart', 'sankey', 'xychart', 'block'];
  const firstLine = trimmed.split('\n')[0].toLowerCase().trim();
  const hasValidStart = validStarts.some(start => firstLine.startsWith(start.toLowerCase()));
  if (!hasValidStart) return false;
  const lines = trimmed.split('\n').filter(line => {
    const l = line.trim().toLowerCase();
    return l && !l.startsWith('%%') && !validStarts.some(s => l.startsWith(s.toLowerCase()));
  });
  if (lines.length < 3) return false;
  const lowerContent = trimmed.toLowerCase();
  if (
    (lowerContent.includes('start') && lowerContent.includes('end') && lines.length <= 3) ||
    (lowerContent.match(/\bstart\b/g)?.length === 1 && lowerContent.match(/\bend\b/g)?.length === 1 && lines.length <= 2)
  ) {
    return false;
  }
  return true;
}

function renderWithInlineCode(text: string): React.ReactNode {
  if (!text) return null;
  const parts = text.split(/`([^`]+)`/g);
  return parts.map((part, index) => {
    if (index % 2 === 1) {
      return (
        <code 
          key={index}
          className="px-2 py-1 mx-1 bg-primary/20 text-primary rounded-lg text-[0.9em] font-mono border border-primary/30"
        >
          {part}
        </code>
      );
    }
    return part;
  });
}

interface ExtremeAnswerPanelProps {
  question: Question;
  isCompleted: boolean;
}

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden border border-border bg-muted/50 shadow-xl"
    >
      <div className="flex items-center justify-between px-5 py-3 bg-muted border-b border-border">
        <div className="flex items-center gap-3">
          <Code2 className="w-5 h-5 text-primary" />
          <span className="text-sm uppercase tracking-wider text-primary font-bold">
            {language || 'code'}
          </span>
        </div>
        <motion.button
          onClick={handleCopy}
          className="flex items-center gap-2 px-4 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-all"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-green-500" />
              <span className="text-green-500 font-medium">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Copy</span>
            </>
          )}
        </motion.button>
      </div>
      <SyntaxHighlighter
        language={language || 'text'}
        style={vscDarkPlus}
        customStyle={{ 
          margin: 0, 
          padding: '1.5rem', 
          background: 'transparent',
          fontSize: '0.875rem',
          lineHeight: '1.6',
        }}
        wrapLines={true}
        wrapLongLines={true}
      >
        {code}
      </SyntaxHighlighter>
    </motion.div>
  );
}

function TabbedMediaPanel({ 
  question,
  hasTldr,
  hasDiagram,
  hasEli5,
  hasVideo
}: { 
  question: Question;
  hasTldr: boolean;
  hasDiagram: boolean;
  hasEli5: boolean;
  hasVideo: boolean;
}) {
  const [diagramRenderSuccess, setDiagramRenderSuccess] = useState<boolean | null>(null);
  const showDiagramTab = hasDiagram && diagramRenderSuccess !== false;
  
  const availableTabs: MediaTab[] = [];
  if (hasTldr) availableTabs.push('tldr');
  if (showDiagramTab) availableTabs.push('diagram');
  if (hasEli5) availableTabs.push('eli5');
  if (hasVideo) availableTabs.push('video');
  
  const [activeTab, setActiveTab] = useState<MediaTab>(() => {
    if (hasTldr) return 'tldr';
    if (hasEli5) return 'eli5';
    if (hasVideo) return 'video';
    return 'diagram';
  });
  
  useEffect(() => {
    if (diagramRenderSuccess === false && activeTab === 'diagram') {
      if (hasTldr) setActiveTab('tldr');
      else if (hasEli5) setActiveTab('eli5');
      else if (hasVideo) setActiveTab('video');
    }
  }, [diagramRenderSuccess, activeTab, hasTldr, hasEli5, hasVideo]);
  
  const handleDiagramRenderResult = useCallback((success: boolean) => {
    setDiagramRenderSuccess(success);
  }, []);
  
  if (availableTabs.length === 0 && diagramRenderSuccess === false) return null;
  if (availableTabs.length === 0 && !hasTldr && !hasEli5 && !hasVideo && diagramRenderSuccess === null) {
    return (
      <div className="rounded-2xl border border-border bg-muted/50 p-6 text-center text-muted-foreground text-sm backdrop-blur-xl">
        Loading media...
      </div>
    );
  }
  if (availableTabs.length === 0) return null;

  const tabConfig = {
    tldr: { label: 'Quick Answer', icon: <Lightbulb className="w-4 h-4" /> },
    diagram: { label: 'Visual', icon: <GitBranch className="w-4 h-4" /> },
    eli5: { label: 'Simple', icon: <Baby className="w-4 h-4" /> },
    video: { label: 'Video', icon: <Play className="w-4 h-4" /> },
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card backdrop-blur-xl overflow-hidden shadow-xl"
    >
      {/* Tab Headers - Premium Styling */}
      <div className="flex border-b border-border p-1 bg-muted/40 gap-1">
        {availableTabs.map((tab) => (
          <motion.button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold transition-all rounded-xl ${
              activeTab === tab 
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 rounded-xl' 
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-xl'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {tabConfig[tab].icon}
            <span className="hidden sm:inline">{tabConfig[tab].label}</span>
          </motion.button>
        ))}
      </div>
      
      {/* Tab Content */}
      <div className="p-4 sm:p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'tldr' && hasTldr && (
            <motion.div
              key="tldr"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="flex items-start gap-4"
            >
              <Lightbulb className="w-6 h-6 text-primary shrink-0 mt-1" />
              <p className="text-sm sm:text-base text-foreground leading-relaxed">{renderWithInlineCode(question.answer)}</p>
            </motion.div>
          )}
          
          {activeTab === 'diagram' && hasDiagram && (
            <motion.div
              key="diagram"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <EnhancedMermaid 
                chart={question.diagram!} 
                onRenderResult={handleDiagramRenderResult}
              />
            </motion.div>
          )}
          
          {activeTab === 'eli5' && hasEli5 && (
            <motion.div
              key="eli5"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="flex items-start gap-4"
            >
              <span className="text-2xl flex-shrink-0">🧒</span>
              <p className="text-sm sm:text-base text-foreground leading-relaxed">{renderWithInlineCode(question.eli5 || '')}</p>
            </motion.div>
          )}
          
          {activeTab === 'video' && hasVideo && (
            <motion.div
              key="video"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <YouTubePlayer 
                shortVideo={question.videos?.shortVideo} 
                longVideo={question.videos?.longVideo} 
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function ExpandableCard({ 
  title, 
  icon, 
  children, 
  defaultExpanded = true,
  variant = 'default',
  badge
}: { 
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  variant?: 'default' | 'highlight' | 'success' | 'purple';
  badge?: string;
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const variantStyles = {
    default: 'bg-card border-border',
    highlight: 'bg-primary/10 border-primary/30',
    success: 'bg-green-500/10 border-green-500/30',
    purple: 'bg-purple-500/10 border-purple-500/30',
  };

  const iconStyles = {
    default: 'text-muted-foreground',
    highlight: 'text-primary',
    success: 'text-green-500',
    purple: 'text-purple-500',
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border overflow-hidden backdrop-blur-xl ${variantStyles[variant]}`}
    >
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors"
        whileHover={{ backgroundColor: 'hsl(var(--muted) / 0.3)' }}
      >
        <div className="flex items-center gap-3">
          <span className={iconStyles[variant]}>{icon}</span>
          <span className="font-bold text-base text-foreground">{title}</span>
          {badge && (
            <span className="px-2 py-1 bg-primary/20 text-primary text-xs font-bold rounded-full border border-primary/30">
              {badge}
            </span>
          )}
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 0 : -90 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        </motion.div>
      </motion.button>
      
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function AnswerPanel({ question, isCompleted, srsCard, showRatingButtons, hasRated, onAddToSRS, onSRSRating }: { 
  question: Question; 
  isCompleted: boolean;
  srsCard?: ReviewCard | null;
  showRatingButtons?: boolean;
  hasRated?: boolean;
  onAddToSRS?: () => void;
  onSRSRating?: (rating: ConfidenceRating) => void;
}) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isMobileView = typeof window !== 'undefined' && window.innerWidth < 640;
  const [blogPost, setBlogPost] = useState<{ title: string; slug: string; url: string } | null>(null);

  useEffect(() => {
    BlogService.getByQuestionId(question.id).then(setBlogPost);
  }, [question.id]);

  const hasTldr = !!question.answer;
  const hasDiagram = !isMobileView && isValidMermaidDiagram(question.diagram);
  const hasEli5 = !!question.eli5;
  const hasVideo = !!(question.videos?.shortVideo || question.videos?.longVideo);
  const hasMediaContent = hasTldr || hasDiagram || hasEli5 || hasVideo;

  const renderMarkdown = useCallback((text: string) => {
    const processedText = preprocessMarkdown(text);
    
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children }) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            const codeContent = String(children).replace(/\n$/, '');
            const isInline = !match && !String(children).includes('\n');
            
            if (isInline) {
              return (
                <code className="px-2 py-1 bg-primary/20 text-primary rounded-lg text-[0.9em] font-mono border border-primary/30">
                  {children}
                </code>
              );
            }
            
            if (language === 'mermaid') {
              if (!isValidMermaidDiagram(codeContent)) return null;
              return (
                <div className="my-4">
                  <EnhancedMermaid chart={codeContent} />
                </div>
              );
            }
            
            return (
              <div className="my-4">
                <CodeBlock code={codeContent} language={language} />
              </div>
            );
          },
          p({ children }) {
            return <p className="mb-3 leading-relaxed text-foreground text-sm sm:text-base">{children}</p>;
          },
          h1({ children }) {
            return (
              <h1 className="text-lg sm:text-xl font-bold mb-3 mt-6 text-foreground border-b border-border pb-2 flex items-center gap-2">
                <span className="w-1 h-5 rounded-full bg-gradient-to-b from-primary to-cyan-500 flex-shrink-0" />
                {children}
              </h1>
            );
          },
          h2({ children }) {
            return (
              <h2 className="text-base sm:text-lg font-bold mb-3 mt-5 text-foreground flex items-center gap-2">
                <span className="w-1 h-4 rounded-full bg-primary/60 flex-shrink-0" />
                {children}
              </h2>
            );
          },
          h3({ children }) {
            return <h3 className="text-sm sm:text-base font-semibold mb-2 mt-4 text-foreground/90">{children}</h3>;
          },
          strong({ children }) {
            return <strong className="font-bold text-foreground">{children}</strong>;
          },
          ul({ children, node }) {
            const parent = (node as any)?.parent;
            const isNested = parent?.tagName === 'li';
            return (
              <ul className={`space-y-2 mb-3 ${isNested ? 'ml-6 mt-2' : 'ml-2'}`}>
                {children}
              </ul>
            );
          },
          ol({ children, node }) {
            const parent = (node as any)?.parent;
            const isNested = parent?.tagName === 'li';
            return (
              <ol className={`space-y-2 mb-3 [counter-reset:list-counter] ${isNested ? 'ml-6 mt-2' : 'ml-2'}`}>
                {children}
              </ol>
            );
          },
          li({ children, node }) {
            const parent = (node as any)?.parent;
            const isOrdered = parent?.tagName === 'ol';
            const hasNestedList = Array.isArray(children) && children.some((child: any) => 
              child?.type?.name === 'ul' || child?.type?.name === 'ol'
            );
            return (
              <li className={`flex gap-3 text-foreground text-sm sm:text-base [counter-increment:list-counter] ${hasNestedList ? 'flex-col' : ''}`}>
                <span className="shrink-0 text-primary mt-1 font-bold">
                  {isOrdered ? <span className="text-sm before:content-[counter(list-counter)'.']" /> : '•'}
                </span>
                <span className={hasNestedList ? 'flex-1 -mt-7 ml-6' : 'flex-1'}>{children}</span>
              </li>
            );
          },
          a({ href, children }) {
            return (
              <a href={href} className="text-primary hover:text-primary/80 underline" target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            );
          },
          blockquote({ children }) {
            return (
              <blockquote className="border-l-4 border-primary/50 pl-4 py-2 my-3 bg-primary/5 text-muted-foreground italic text-sm sm:text-base">
                {children}
              </blockquote>
            );
          },
          table({ children }) {
            return (
              <div className="my-4 overflow-x-auto">
                <table className="w-full border-collapse text-xs sm:text-sm">{children}</table>
              </div>
            );
          },
          th({ children }) {
            return <th className="px-3 py-2 text-left font-bold bg-muted border border-border text-xs sm:text-sm text-foreground">{children}</th>;
          },
          td({ children }) {
            return <td className="px-3 py-2 border border-border text-xs sm:text-sm text-foreground">{children}</td>;
          },
        }}
      >
        {processedText}
      </ReactMarkdown>
    );
  }, []);

  return (
    <motion.div
      ref={scrollContainerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="w-full h-full overflow-y-auto overflow-x-hidden"
    >
      {/* Premium top gradient accent */}
      <div className="h-0.5 bg-gradient-to-r from-primary via-cyan-500 to-purple-500" />
      {/* Difficulty accent line */}
      <div className={`h-1 w-full flex-shrink-0 ${
        question.difficulty === 'advanced'
          ? 'bg-gradient-to-r from-red-500 to-orange-500'
          : question.difficulty === 'intermediate'
          ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
          : 'bg-gradient-to-r from-emerald-500 to-teal-400'
      }`} />
      <div className="w-full px-4 sm:px-6 py-4 sm:py-6 pb-8 space-y-5">

        {/* Tabbed Media Panel */}
        {hasMediaContent && (
          <TabbedMediaPanel
            question={question}
            hasTldr={hasTldr}
            hasDiagram={hasDiagram}
            hasEli5={hasEli5}
            hasVideo={hasVideo}
          />
        )}

        {/* Full Explanation */}
        <ExpandableCard
          title="Deep Dive"
          icon={<BookOpen className="w-5 h-5" />}
          defaultExpanded={true}
          badge={question.explanation ? `${Math.ceil(question.explanation.split(' ').length / 200)} min read` : undefined}
        >
          <div className="prose prose-lg max-w-none leading-relaxed text-base prose-headings:font-bold prose-headings:text-foreground prose-p:text-foreground/90 prose-strong:text-foreground prose-code:text-primary prose-code:bg-primary/10 prose-code:rounded prose-code:px-1">
            {renderMarkdown(question.explanation)}
          </div>
        </ExpandableCard>

        {/* Tags */}
        {question.tags && question.tags.length > 0 && (
          <div className="flex items-start gap-3 pt-1">
            <Tag className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
            <div className="flex flex-wrap gap-2">
              {question.tags.map(tag => (
                <motion.span
                  key={tag}
                  className="px-3 py-1 bg-muted text-muted-foreground text-xs font-mono rounded-lg border border-border"
                  whileHover={{ scale: 1.05, borderColor: 'hsl(var(--primary))', backgroundColor: 'hsl(var(--primary) / 0.1)' }}
                >
                  {formatTag(tag)}
                </motion.span>
              ))}
            </div>
          </div>
        )}

        {/* References */}
        {(question.sourceUrl || blogPost) && (
          <div className="flex flex-wrap items-center gap-3">
            {question.sourceUrl && (
              <motion.a
                href={question.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 border border-border rounded-xl text-sm transition-colors"
                whileHover={{ scale: 1.05 }}
              >
                <ExternalLink className="w-4 h-4 text-primary" />
                <span className="text-foreground font-medium">Source</span>
              </motion.a>
            )}
            {blogPost && (
              <motion.a
                href={`https://openstackdaily.github.io${blogPost.url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-xl text-sm transition-colors"
                whileHover={{ scale: 1.05 }}
              >
                <FileText className="w-4 h-4 text-primary" />
                <span className="text-primary font-medium">Read Blog</span>
              </motion.a>
            )}
          </div>
        )}

        {/* Similar Questions */}
        <SimilarQuestions questionId={question.id} currentChannel={question.channel} />

        {/* Discussion */}
        <GiscusComments questionId={question.id} />

        {/* SRS Rating — pinned at bottom of content */}
        {(onAddToSRS || onSRSRating) && (
          <div className="sticky bottom-0 -mx-4 sm:-mx-6 px-4 sm:px-6 py-4 mt-4 border-t border-border bg-background/90 backdrop-blur-[16px]"
          >
            {hasRated ? (
              <div className="flex items-center justify-center gap-2 text-emerald-400 text-sm font-semibold">
                <Check className="w-4 h-4" />
                Review recorded
              </div>
            ) : showRatingButtons && srsCard ? (
              <div className="space-y-2">
                <p className="text-xs text-center text-muted-foreground font-medium">How well did you know this?</p>
                <div className="grid grid-cols-4 gap-2 p-4">
                  {([
                    { rating: 'again' as ConfidenceRating, label: 'Again', cls: 'bg-red-500/20 border-red-500/40 text-red-400 hover:bg-red-500/30', icon: <RotateCcw className="w-4 h-4" /> },
                    { rating: 'hard'  as ConfidenceRating, label: 'Hard',  cls: 'bg-orange-500/20 border-orange-500/40 text-orange-400 hover:bg-orange-500/30', icon: <Brain className="w-4 h-4" /> },
                    { rating: 'good'  as ConfidenceRating, label: 'Good',  cls: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/30', icon: <Check className="w-4 h-4" /> },
                    { rating: 'easy'  as ConfidenceRating, label: 'Easy',  cls: 'bg-blue-500/20 border-blue-500/40 text-blue-400 hover:bg-blue-500/30', icon: <Zap className="w-4 h-4" /> },
                  ]).map(({ rating, label, cls, icon }) => (
                    <motion.button
                      key={rating}
                      onClick={() => onSRSRating?.(rating)}
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      className={`flex flex-col items-center gap-1.5 py-3 border rounded-2xl font-bold text-sm transition-all ${cls}`}
                    >
                      {icon}
                      {label}
                    </motion.button>
                  ))}
                </div>
              </div>
            ) : onAddToSRS ? (
              <motion.button
                onClick={onAddToSRS}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center gap-2 py-3 bg-purple-500/20 border border-purple-500/30 rounded-xl text-sm font-bold text-purple-400 hover:bg-purple-500/30 transition-all"
              >
                <Brain className="w-4 h-4" />
                Add to SRS Review
              </motion.button>
            ) : null}
          </div>
        )}
      </div>
    </motion.div>
  );
}
