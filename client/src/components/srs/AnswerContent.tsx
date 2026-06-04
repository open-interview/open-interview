import { motion, AnimatePresence } from "framer-motion";
import { Eye, Sparkles, Brain, Zap, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { EnhancedMermaid } from "@/components/EnhancedMermaid";
import { ListenButton } from "@/components/ListenButton";
import { useState } from "react";

function preprocessMarkdown(text: string): string {
  if (!text) return "";
  let processed = text;
  processed = processed.replace(/([^\n])(```)/g, "$1\n$2");
  processed = processed.replace(/(```\w*)\s*\n?\s*([^\n`])/g, "$1\n$2");
  processed = processed.replace(/^\*\*\s*$/gm, "");
  processed = processed.replace(/\*\*\s*\n\s*([^*]+)\*\*/g, "**$1**");
  processed = processed.replace(/^[•·]\s*/gm, "- ");
  processed = processed.replace(/\n{3,}/g, "\n\n");
  return processed.trim();
}

function MarkdownRender({ content }: { content: string }) {
  return (
    <div className="prose prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children }) {
            const match = /language-(\w+)/.exec(className || "");
            const isInline = !match && !String(children).includes("\n");
            const lang = match ? match[1] : null;

            if (lang === "mermaid") {
              return (
                <div className="my-4">
                  <EnhancedMermaid chart={String(children).replace(/\n$/, "")} />
                </div>
              );
            }

            if (isInline) {
              return (
                <code className="px-2 py-1 bg-cyan-500/20 text-cyan-300 rounded text-sm font-mono">
                  {children}
                </code>
              );
            }

            return (
              <div className="my-4 rounded-xl overflow-hidden">
                <SyntaxHighlighter
                  language={match ? match[1] : "text"}
                  style={vscDarkPlus}
                  customStyle={{
                    margin: 0,
                    padding: "1.5rem",
                    background: "var(--surface-code, #0a0a0a)",
                    fontSize: "0.9rem",
                  }}
                >
                  {String(children).replace(/\n$/, "")}
                </SyntaxHighlighter>
              </div>
            );
          },
          p({ children }) {
            return <p className="mb-3 text-[#e0e0e0] leading-relaxed">{children}</p>;
          },
          h1({ children }) {
            return <h1 className="text-xl font-bold mb-3 mt-4 text-foreground">{children}</h1>;
          },
          h2({ children }) {
            return <h2 className="text-lg font-bold mb-2 mt-4 text-foreground">{children}</h2>;
          },
          strong({ children }) {
            return <strong className="font-bold text-foreground">{children}</strong>;
          },
          ul({ children }) {
            return <ul className="space-y-2 mb-3">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="space-y-2 mb-3 list-decimal list-inside">{children}</ol>;
          },
          li({ children }) {
            return (
              <li className="flex gap-2 text-[#e0e0e0]">
                <span className="text-primary mt-1">•</span>
                <span className="flex-1">{children}</span>
              </li>
            );
          },
        }}
      >
        {preprocessMarkdown(content)}
      </ReactMarkdown>
    </div>
  );
}

interface AnswerContentProps {
  showAnswer: boolean;
  tldr?: string | null;
  answer?: string | null;
  codeInterpretation?: string | null;
  diagram?: string | null;
  explanation?: string | null;
}

function DiagramSection({ diagram }: { diagram: string }) {
  const [renderSuccess, setRenderSuccess] = useState<boolean | null>(null);
  if (renderSuccess === false) return null;
  return (
    <div className="p-6 bg-muted/50 backdrop-blur-xl rounded-xl border border-border">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-purple-500/20 rounded-lg">
          <Eye className="w-5 h-5 text-purple-400" />
        </div>
        <span className="text-sm font-bold text-purple-400 uppercase tracking-wider">Diagram</span>
      </div>
      <div className="bg-background/30 rounded-xl p-4 overflow-x-auto">
        <EnhancedMermaid chart={diagram} onRenderResult={(success) => setRenderSuccess(success)} />
      </div>
    </div>
  );
}

export function AnswerContent({
  showAnswer,
  tldr,
  answer,
  codeInterpretation,
  diagram,
  explanation,
}: AnswerContentProps) {
  return (
    <AnimatePresence>
      {showAnswer && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-6 space-y-4 overflow-y-auto"
          style={{ maxHeight: "calc(100vh - 260px)" }}
        >
          {tldr && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-4 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-[20px] backdrop-blur-sm"
            >
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-cyan-400 uppercase">TL;DR</span>
              </div>
              <p className="text-sm text-foreground">{tldr}</p>
            </motion.div>
          )}

          {answer && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="p-6 bg-muted/50 backdrop-blur-xl rounded-xl border border-border"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <span className="font-bold text-primary">Answer</span>
                </div>
                <ListenButton
                  text={`${answer}${explanation ? ". " + explanation : ""}`}
                  label="Listen"
                  size="sm"
                />
              </div>
              <p className="text-lg text-foreground leading-relaxed">{answer}</p>
            </motion.div>
          )}

          {codeInterpretation && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
              className="p-6 bg-gradient-to-br from-pink-500/10 to-purple-500/10 border border-pink-500/30 rounded-xl backdrop-blur-sm"
            >
              <div className="flex items-center gap-2 mb-4">
                <Check className="w-5 h-5 text-pink-400" />
                <span className="font-bold text-pink-400 uppercase text-sm">Code Interpretation</span>
              </div>
              <MarkdownRender content={codeInterpretation} />
            </motion.div>
          )}

          {diagram && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <DiagramSection diagram={diagram} />
            </motion.div>
          )}

          {explanation && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="p-6 bg-muted/50 backdrop-blur-xl rounded-xl border border-border"
            >
              <div className="flex items-center gap-2 mb-4">
                <Brain className="w-5 h-5 text-orange-400" />
                <span className="font-bold text-orange-400 uppercase text-sm">Explanation</span>
              </div>
              <MarkdownRender content={explanation} />
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
