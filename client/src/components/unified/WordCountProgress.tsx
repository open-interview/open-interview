/**
 * Unified Word Count Progress Component
 * 
 * Displays word count with progress bar
 * Used across: TrainingMode, VoiceSession, VoiceInterview
 */

interface WordCountProgressProps {
  currentWords: number;
  targetWords?: number;
  label?: string;
  showTarget?: boolean;
  className?: string;
}

export function WordCountProgress({
  currentWords,
  targetWords,
  label = 'Words spoken',
  showTarget = true,
  className = ''
}: WordCountProgressProps) {
  const percentage = targetWords 
    ? Math.min((currentWords / targetWords) * 100, 100)
    : Math.min(currentWords * 2, 100);

  return (
    <div className={className}>
      <div className="flex items-center justify-between text-sm mb-2">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold">
          {currentWords} {targetWords && showTarget && `/ ${targetWords}`} words
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {targetWords && showTarget && (
        <p className="text-xs text-muted-foreground mt-1">
          Target: ~{targetWords} words
        </p>
      )}
    </div>
  );
}
