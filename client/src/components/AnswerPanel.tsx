import { motion } from 'framer-motion';
import { EnhancedMermaid } from './EnhancedMermaid';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ReactMarkdown from 'react-markdown';
import { Check, BookOpen, Code2, Lightbulb } from 'lucide-react';
import type { Question } from '../lib/data';

interface AnswerPanelProps {
  question: Question;
  isCompleted: boolean;
}

export function AnswerPanel({ question, isCompleted }: AnswerPanelProps) {
  const renderMarkdown = (text: string) => {
    return (
      <ReactMarkdown
        components={{
          code({ node, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            const codeContent = String(children).replace(/\n$/, '');
            const isInline = !match && !String(children).includes('\n');
            
            if (isInline) {
              return (
                <code className="px-1.5 py-0.5 bg-primary/10 text-primary rounded text-[0.9em] font-mono border border-primary/20" {...props}>
                  {children}
                </code>
              );
            }
            
            if (language === 'mermaid') {
              return (
                <div className="my-6">
                  <EnhancedMermaid chart={codeContent} />
                </div>
              );
            }
            
            return (
              <div className="my-6 rounded-lg overflow-hidden border border-white/10 shadow-lg">
                <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <Code2 className="w-3.5 h-3.5 text-primary" />
                    <span className="text-[10px] uppercase tracking-widest text-white/50">{language || 'code'}</span>
                  </div>
                </div>
                <SyntaxHighlighter
                  language={language || 'text'}
                  style={vscDarkPlus}
                  customStyle={{ 
                    margin: 0, 
                    padding: '1.25rem', 
                    background: '#0a0a0a',
                    fontSize: '0.875rem',
                    lineHeight: '1.6'
                  }}
                  showLineNumbers={codeContent.split('\n').length > 5}
                >
                  {codeContent}
                </SyntaxHighlighter>
              </div>
            );
          },
          p({ children }) {
            return <p className="mb-4 leading-relaxed text-white/85">{children}</p>;
          },
          h1({ children }) {
            return <h1 className="text-2xl font-bold mb-4 mt-8 text-white border-b border-white/10 pb-2">{children}</h1>;
          },
          h2({ children }) {
            return <h2 className="text-xl font-bold mb-3 mt-6 text-white">{children}</h2>;
          },
          h3({ children }) {
            return <h3 className="text-lg font-bold mb-2 mt-4 text-white/90">{children}</h3>;
          },
          strong({ children }) {
            return <strong className="font-bold text-white">{children}</strong>;
          },
          em({ children }) {
            return <em className="italic text-primary/90">{children}</em>;
          },
          ul({ children }) {
            return <ul className="list-none space-y-2 mb-4 ml-4">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="list-none space-y-2 mb-4 ml-4 counter-reset-list">{children}</ol>;
          },
          li({ children, node }) {
            const isOrdered = node?.tagName === 'ol';
            return (
              <li className="flex gap-3 text-white/80">
                <span className="text-primary shrink-0 mt-0.5">
                  {isOrdered ? '→' : '•'}
                </span>
                <span className="flex-1">{children}</span>
              </li>
            );
          },
          a({ href, children }) {
            return (
              <a 
                href={href} 
                className="text-primary hover:text-primary/80 underline decoration-primary/30 hover:decoration-primary/60 transition-colors" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                {children}
              </a>
            );
          },
          blockquote({ children }) {
            return (
              <blockquote className="border-l-4 border-primary/50 pl-4 py-2 my-4 bg-primary/5 text-white/70 italic">
                {children}
              </blockquote>
            );
          },
          hr() {
            return <hr className="my-8 border-white/10" />;
          },
        }}
      >
        {text}
      </ReactMarkdown>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full h-full overflow-y-auto custom-scrollbar"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8 md:py-12">
        {/* Diagram Section - Full width, prominent */}
        {question.diagram && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-5 bg-primary" />
              <h2 className="text-sm font-bold uppercase tracking-widest text-white/70">Visual Diagram</h2>
            </div>
            <EnhancedMermaid chart={question.diagram} />
          </div>
        )}

        {/* Quick Answer Section */}
        {question.answer && question.answer !== question.explanation && (
          <div className="mb-8 p-4 sm:p-6 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold uppercase tracking-widest text-primary">Quick Answer</h2>
            </div>
            <p className="text-sm sm:text-base text-white/90 leading-relaxed">
              {question.answer}
            </p>
          </div>
        )}

        {/* Detailed Explanation */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-4 h-4 text-white/70" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-white/70">Detailed Explanation</h2>
          </div>
          <div className="prose prose-invert max-w-none text-sm sm:text-base">
            {renderMarkdown(question.explanation)}
          </div>
        </div>

        {/* Completion Badge */}
        {isCompleted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-lg"
          >
            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
              <Check className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <div className="text-sm font-bold text-green-400 uppercase tracking-wide">Completed</div>
              <div className="text-xs text-green-400/70">You've reviewed this question</div>
            </div>
          </motion.div>
        )}

        {/* Tags */}
        {question.tags && question.tags.length > 0 && (
          <div className="mt-8 pt-6 border-t border-white/10">
            <div className="flex flex-wrap gap-2">
              {question.tags.map(tag => (
                <span 
                  key={tag} 
                  className="px-3 py-1 bg-white/5 hover:bg-white/10 text-xs font-mono text-white/60 border border-white/10 rounded-full transition-colors"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
