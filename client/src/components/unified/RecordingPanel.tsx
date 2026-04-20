/**
 * Unified Recording Panel Component
 * 
 * Provides consistent recording UI across all voice features
 * - Training Mode
 * - Voice Interview
 * - Voice Session
 * 
 * Uses composable sub-components for flexibility
 */

import { Mic } from 'lucide-react';
import { VoiceRecordingControls } from '../../hooks/use-voice-recording';
import { TranscriptDisplay } from './TranscriptDisplay';
import { RecordingControls } from './RecordingControls';
import { WordCountProgress } from './WordCountProgress';
import { RecordingTimer } from './RecordingTimer';

interface RecordingPanelProps {
  recording: VoiceRecordingControls;
  targetWords?: number;
  showTranscript?: boolean;
  showWordCount?: boolean;
  showTimer?: boolean;
  tip?: string;
  className?: string;
}

export function RecordingPanel({
  recording,
  targetWords,
  showTranscript = true,
  showWordCount = true,
  showTimer = true,
  tip,
  className = ''
}: RecordingPanelProps) {
  const { state, startRecording, stopRecording, resetRecording, playRecording, stopPlayback, isPlaying, currentWordIndex, playbackWords } = recording;

  // Determine control state
  const controlState = isPlaying 
    ? 'playing' 
    : state.audioBlob 
    ? 'recorded' 
    : state.isRecording 
    ? 'recording' 
    : 'idle';

  return (
    <div className={`bg-card rounded-xl border border-border p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Mic className="w-5 h-5 text-primary" />
          Record Your Answer
        </h3>
        {showTimer && state.duration > 0 && (
          <RecordingTimer 
            seconds={state.duration} 
            isRecording={state.isRecording}
          />
        )}
      </div>

      {/* Live Transcription Display */}
      {showTranscript && (state.isRecording || state.transcript) && (
        <TranscriptDisplay
          transcript={state.transcript}
          isRecording={state.isRecording}
          isPlaying={isPlaying}
          playbackWords={playbackWords}
          currentWordIndex={currentWordIndex}
          title={state.isRecording ? 'Live Transcription' : 'Your Recording'}
          className="mb-4"
        />
      )}

      {/* Word Count Progress */}
      {showWordCount && (
        <WordCountProgress
          currentWords={state.wordCount}
          targetWords={targetWords}
          className="mb-4"
        />
      )}

      {/* Recording Controls */}
      <RecordingControls
        state={controlState}
        onStart={startRecording}
        onStop={stopRecording}
        onReset={resetRecording}
        onPlay={playRecording}
        onStopPlayback={stopPlayback}
      />

      {/* Tips */}
      {tip && (
        <div className="mt-4 p-3 bg-blue-500/10 rounded-lg">
          <p className="text-xs text-blue-600 dark:text-blue-400">
            💡 {tip}
          </p>
        </div>
      )}
    </div>
  );
}
