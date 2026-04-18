import { useRef } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Loader2, Volume2, Copy, Check, Mic } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface AICompanionMessagesProps {
  messages: Message[];
  isGenerating: boolean;
  copied: string | null;
  onNavigate?: (path: string) => void;
  availableActions: string[];
  agentMode: boolean;
  recognitionAvailable: boolean;
  onSpeak: (content: string) => void;
  onCopy: (content: string, id: string) => void;
  onQuickAction: (prompt: string) => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

const quickActions = [
  { label: 'Explain this', prompt: 'Can you explain this topic in simple terms?' },
  { label: 'Give example', prompt: 'Can you give me a practical example?' },
  { label: 'What next?', prompt: 'What should I learn next? Guide me!' },
  { label: 'Quiz me', prompt: 'Can you quiz me on this topic?' },
];

export function AICompanionMessages({
  messages,
  isGenerating,
  copied,
  onNavigate,
  availableActions,
  agentMode,
  recognitionAvailable,
  onSpeak,
  onCopy,
  onQuickAction,
  messagesEndRef,
}: AICompanionMessagesProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.length === 0 ? (
        <div className="text-center py-8">
          <Sparkles className="w-12 h-12 mx-auto mb-3 text-purple-500" />
          <h3 className="font-bold mb-2">Hi! I'm your AI companion</h3>
          <p className="text-sm text-muted-foreground mb-4">
            I can explain, debate, and chat about anything on this page!
          </p>
          {recognitionAvailable && (
            <div className="mb-4 p-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Mic className="w-4 h-4 text-purple-500" />
                <p className="text-sm font-semibold">Push-to-Talk Voice Mode Available!</p>
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                Click the microphone icon in the header for voice conversation
              </p>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>🎙️ Hold SPACEBAR to speak</p>
                <p>🚀 Release to send automatically</p>
                <p>🔊 AI responds with voice</p>
                <p>⚡ Simple and reliable!</p>
              </div>
            </div>
          )}
          {agentMode && (onNavigate || availableActions.length > 0) && (
            <div className="mb-4 p-3 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-blue-500" />
                <p className="text-sm font-semibold">Intelligent Agent Mode Active!</p>
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                I can navigate, suggest next steps, and interact with the page
              </p>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>🧭 Navigate to different pages</p>
                <p>💡 Suggest what to learn next</p>
                <p>🎯 Guide your learning journey</p>
                <p>✨ Click buttons and trigger actions</p>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={() => onQuickAction(action.prompt)}
                className="px-3 py-2 bg-muted hover:bg-muted/80 rounded-lg text-xs font-medium transition-colors"
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                    : 'bg-muted'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                {message.role === 'assistant' && (
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => onSpeak(message.content)}
                      className="p-1 hover:bg-background/50 rounded transition-colors"
                      title="Speak"
                    >
                      <Volume2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => onCopy(message.content, message.id)}
                      className="p-1 hover:bg-background/50 rounded transition-colors"
                      title="Copy"
                    >
                      {copied === message.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isGenerating && (
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              </div>
              <div className="bg-muted rounded-2xl px-4 py-2">
                <p className="text-sm text-muted-foreground">Thinking...</p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </>
      )}
    </div>
  );
}
