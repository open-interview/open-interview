/**
 * Unified Recording Timer Component
 * 
 * Displays recording duration in MM:SS format
 * Used across: TrainingMode, VoiceSession, VoiceInterview
 */

import { Clock } from 'lucide-react';

interface RecordingTimerProps {
  seconds: number;
  isRecording?: boolean;
  className?: string;
}

export function RecordingTimer({
  seconds,
  isRecording = false,
  className = ''
}: RecordingTimerProps) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const formattedTime = `${minutes}:${secs.toString().padStart(2, '0')}`;

  return (
    <div className={`flex items-center gap-2 text-sm ${className}`}>
      {isRecording && (
        <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
      )}
      <Clock className="w-4 h-4 text-muted-foreground" />
      <span className="font-mono">{formattedTime}</span>
    </div>
  );
}
