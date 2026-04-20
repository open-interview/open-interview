/**
 * Unified Transcript Display Component
 * 
 * Displays live or recorded transcripts with optional word highlighting
 * Used across: TrainingMode, VoiceSession, VoiceInterview
 */

import { Volume2 } from 'lucide-react';

interface TranscriptDisplayProps {
  transcript: string;
  interimTranscript?: string;
  isRecording?: boolean;
  isPlaying?: boolean;
  playbackWords?: string[];
  currentWordIndex?: number;
  title?: string;
  placeholder?: string;
  className?: string;
  maxHeight?: string;
}

export function TranscriptDisplay({
  transcript,
  interimTranscript = '',
  isRecording = false,
  isPlaying = false,
  playbackWords = [],
  currentWordIndex = -1,
  title,
  placeholder = 'Start speaking...',
  className = '',
  maxHeight = 'max-h-96'
}: TranscriptDisplayProps) {
  const hasContent = transcript || interimTranscript;

  return (
    <div className={`p-4 bg-muted/30 rounded-lg border border-border ${className}`}>
      {/* Header */}
      {title && (
        <div className="flex items-center gap-2 mb-2">
          <Volume2 className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">{title}</span>
          {isRecording && (
            <span className="flex items-center gap-1 text-xs text-red-500">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              Recording...
            </span>
          )}
        </div>
      )}

      {/* Transcript Content */}
      <div className={`text-sm leading-relaxed break-words overflow-auto whitespace-pre-wrap ${maxHeight}`}>
        {isPlaying && playbackWords.length > 0 ? (
          // Word-by-word highlighting during playback
          <div className="flex flex-wrap gap-1">
            {playbackWords.map((word, index) => (
              <span
                key={index}
                className={`transition-all duration-200 ${
                  index === currentWordIndex
                    ? 'bg-primary text-primary-foreground px-1 rounded font-semibold scale-110'
                    : index < currentWordIndex
                    ? 'text-muted-foreground'
                    : 'text-foreground'
                }`}
              >
                {word}
              </span>
            ))}
          </div>
        ) : hasContent ? (
          // Live or final transcript
          <p className="text-foreground">
            {transcript}
            {interimTranscript && (
              <span className="text-muted-foreground">{interimTranscript}</span>
            )}
            {isRecording && <span className="animate-pulse">|</span>}
          </p>
        ) : (
          // Placeholder
          <p className="text-muted-foreground">{placeholder}</p>
        )}
      </div>
    </div>
  );
}
