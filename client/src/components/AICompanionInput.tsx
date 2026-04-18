import { Mic, Loader2, Send, Trash2 } from 'lucide-react';

interface AICompanionInputProps {
  inputMessage: string;
  isGenerating: boolean;
  voiceMode: boolean;
  isPushingToTalk: boolean;
  isSpeaking: boolean;
  hasMessages: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onChange: (value: string) => void;
  onSend: () => void;
  onClear: () => void;
}

export function AICompanionInput({
  inputMessage,
  isGenerating,
  voiceMode,
  isPushingToTalk,
  isSpeaking,
  hasMessages,
  inputRef,
  onChange,
  onSend,
  onClear,
}: AICompanionInputProps) {
  return (
    <div className="p-4 border-t border-border">
      {voiceMode && (
        <div className={`mb-2 p-2 border rounded-lg flex items-center justify-center gap-2 ${
          isPushingToTalk
            ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/30'
            : (isGenerating || isSpeaking)
            ? 'bg-gradient-to-r from-orange-500/20 to-red-500/20 border-orange-500/30'
            : 'bg-muted/30 border-border'
        }`}>
          <Mic className={`w-4 h-4 ${
            isPushingToTalk
              ? 'text-purple-500 animate-pulse'
              : (isGenerating || isSpeaking)
              ? 'text-orange-500'
              : 'text-muted-foreground'
          }`} />
          <span className={`text-sm font-medium ${
            isPushingToTalk
              ? 'text-purple-500'
              : (isGenerating || isSpeaking)
              ? 'text-orange-500'
              : 'text-muted-foreground'
          }`}>
            {isPushingToTalk
              ? 'Listening... (Release SPACEBAR to send)'
              : (isGenerating || isSpeaking)
              ? 'AI speaking... (Press SPACEBAR to interrupt)'
              : 'Hold SPACEBAR to speak'}
          </span>
        </div>
      )}
      {hasMessages && (
        <button
          onClick={onClear}
          className="w-full mb-2 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-2"
        >
          <Trash2 className="w-3 h-3" />
          Clear conversation
        </button>
      )}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={inputMessage}
          onChange={(e) => !voiceMode && onChange(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && !voiceMode && onSend()}
          placeholder={voiceMode ? 'Hold SPACEBAR to speak...' : 'Ask me anything...'}
          disabled={isGenerating || voiceMode}
          className="flex-1 px-4 py-2 bg-background border border-border rounded-full text-sm focus:outline-none focus:border-primary disabled:opacity-50"
        />
        {!voiceMode && (
          <button
            onClick={onSend}
            disabled={!inputMessage.trim() || isGenerating}
            className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        )}
        {voiceMode && (
          <div className={`p-2 rounded-full ${
            isPushingToTalk
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
              : 'bg-muted text-muted-foreground'
          }`}>
            {isGenerating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isPushingToTalk ? (
              <Mic className="w-5 h-5 animate-pulse" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </div>
        )}
      </div>
      {voiceMode && (
        <div className="text-xs text-center mt-2 p-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg">
          <p className="font-semibold text-purple-500 mb-1">🎙️ Push-to-Talk Mode</p>
          <p className="text-muted-foreground">
            Hold SPACEBAR to speak, release to send. Press SPACEBAR anytime to interrupt AI!
          </p>
        </div>
      )}
    </div>
  );
}
