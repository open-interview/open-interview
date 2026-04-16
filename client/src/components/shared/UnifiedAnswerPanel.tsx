/**
 * Unified Answer Panel
 * Mobile-first answer display with rich content support
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, Lightbulb, Baby, Code2, Play, FileText, 
  ExternalLink, Copy, Check, ChevronDown, ChevronUp
} from 'lucide-react';
import type { Question } from '../../types';
import { cn } from '../../lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { EnhancedMermaid } from '../EnhancedMermaid';
import { YouTubePlayer } from '../YouTubePlayer';

interface UnifiedAnswerPanelProps {
  question: Question;
  mode: 'browse' | 'test' | 'interview' | 'certification' | 'review';
  onHideAnswer?: () => void;
}

type ContentTab = 'answer' | 'diagram' | 'eli5' | 'video';

function preprocessMarkdown(text: string): string {
  if (!text) return '';
  let processed = text;
  
  // Fix code fences
  processed = processed.replace(/([^\n])(```)/g, '$1\n$2');
  processed = processed.replace(/(```\w*)\s*\n?\s*([^\n`])/g, '$1\n$2');
  
  // Fix bold markers
  processed = processed.replace(/^\*\*\s*$/gm, '');
  processed = processed.replace(/\*\*\s*\n\s*([^*]+)\*\*/g, '**$1**');
  
  // Fix bullet points
  processed = processed.replace(/^[•·]\s*/gm, '- ');
  
  return processed;
}

export function UnifiedAnswerPanel({ 
  question, 
  mode,
  onHideAnswer 
}: UnifiedAnswerPanelProps) {
  const [activeTab, setActiveTab] = useState<ContentTab>('answer');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['main']));

  const hasDiagram = !!question.diagram;
  const hasEli5 = !!question.eli5;
  const hasVideo = !!(question.videos?.shortVideo || question.videos?.longVideo);

  const tabs: { id: ContentTab; label: string; icon: React.ElementType; available: boolean }[] = [
    { id: 'answer', label: 'Answer', icon: BookOpen, available: true },
    { id: 'diagram', label: 'Diagram', icon: Code2, available: hasDiagram },
    { id: 'eli5', label: 'ELI5', icon: Baby, available: hasEli5 },
    { id: 'video', label: 'Video', icon: Play, available: hasVideo },
  ];

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  return (
    <div className="w-full px-4 py-6 space-y-6">
      {/* Tab navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar"
      >
        {tabs.filter(tab => tab.available).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all flex-shrink-0',
                isActive
                  ? 'bg-gradient-to-r from-primary to-purple-500 text-white shadow-lg'
                  : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </motion.div>

      {/* Content area */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-4"
      >
        {/* Main Answer */}
        {activeTab === 'answer' && (
          <div className="space-y-4">
            {/* Answer section */}
            <div className="bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 overflow-hidden">
              <button
                onClick={() => toggleSection('main')}
                className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-green-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Answer</h3>
                </div>
                {expandedSections.has('main') ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                )}
              </button>

              {expandedSections.has('main') && (
                <div className="px-4 pb-4">
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({ node, inline, className, children, ...props }) {
                          const match = /language-(\w+)/.exec(className || '');
                          const codeString = String(children).replace(/\n$/, '');
                          const codeId = `code-${Math.random().toString(36).substr(2, 9)}`;

                          if (!inline && match) {
                            return (
                              <div className="relative group my-4">
                                <button
                                  onClick={() => handleCopyCode(codeString, codeId)}
                                  className="absolute top-2 right-2 p-2 rounded-lg bg-secondary/80 hover:bg-secondary transition-all opacity-0 group-hover:opacity-100 z-10"
                                >
                                  {copiedCode === codeId ? (
                                    <Check className="w-4 h-4 text-green-400" />
                                  ) : (
                                    <Copy className="w-4 h-4" />
                                  )}
                                </button>
                                <SyntaxHighlighter
                                  style={vscDarkPlus}
                                  language={match[1]}
                                  PreTag="div"
                                  className="rounded-xl !bg-[var(--surface-0)] !my-0"
                                  {...props}
                                >
                                  {codeString}
                                </SyntaxHighlighter>
                              </div>
                            );
                          }

                          return (
                            <code className="px-1.5 py-0.5 rounded bg-primary/15 text-primary text-sm font-mono" {...props}>
                              {children}
                            </code>
                          );
                        },
                      }}
                    >
                      {preprocessMarkdown(question.answer)}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </div>

            {/* Explanation section */}
            {question.explanation && (
              <div className="bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 overflow-hidden">
                <button
                  onClick={() => toggleSection('explanation')}
                  className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                      <Lightbulb className="w-5 h-5 text-blue-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">Explanation</h3>
                  </div>
                  {expandedSections.has('explanation') ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>

                {expandedSections.has('explanation') && (
                  <div className="px-4 pb-4">
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {preprocessMarkdown(question.explanation)}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Diagram tab */}
        {activeTab === 'diagram' && question.diagram && (
          <div className="bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 p-4">
            <EnhancedMermaid chart={question.diagram} />
          </div>
        )}

        {/* ELI5 tab */}
        {activeTab === 'eli5' && question.eli5 && (
          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center flex-shrink-0">
                <Baby className="w-6 h-6 text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-purple-300 mb-3">Explain Like I'm 5</h3>
                <p className="text-foreground/90 leading-relaxed">{question.eli5}</p>
              </div>
            </div>
          </div>
        )}

        {/* Video tab */}
        {activeTab === 'video' && hasVideo && (
          <div className="space-y-4">
            {question.videos?.shortVideo && (
              <div className="bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 overflow-hidden">
                <div className="p-4 border-b border-border/50">
                  <h3 className="text-lg font-semibold text-foreground">Short Explanation</h3>
                </div>
                <YouTubePlayer url={question.videos.shortVideo} />
              </div>
            )}
            {question.videos?.longVideo && (
              <div className="bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 overflow-hidden">
                <div className="p-4 border-b border-border/50">
                  <h3 className="text-lg font-semibold text-foreground">Detailed Explanation</h3>
                </div>
                <YouTubePlayer url={question.videos.longVideo} />
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Source link */}
      {question.sourceUrl && (
        <motion.a
          href={question.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground transition-all"
        >
          <ExternalLink className="w-4 h-4" />
          <span className="text-sm">View Original Source</span>
        </motion.a>
      )}
    </div>
  );
}
