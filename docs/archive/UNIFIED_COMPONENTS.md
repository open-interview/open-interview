# Unified Components Library

## Overview
This document describes the unified, composable components created for consistent UI/UX across the application.

## Philosophy
Instead of monolithic components, we've created small, composable building blocks that can be combined in different ways to suit different use cases.

## Components

### 1. TranscriptDisplay
**Location**: `client/src/components/unified/TranscriptDisplay.tsx`

Displays live or recorded transcripts with optional word-by-word highlighting during playback.

**Props**:
- `transcript`: Main transcript text
- `interimTranscript`: Live interim results (optional)
- `isRecording`: Show recording indicator
- `isPlaying`: Enable playback mode
- `playbackWords`: Array of words for highlighting
- `currentWordIndex`: Current word being played
- `title`: Header title
- `placeholder`: Text when empty
- `maxHeight`: CSS max-height class

**Usage**:
```typescript
<TranscriptDisplay
  transcript={state.transcript}
  isRecording={state.isRecording}
  title="Live Transcription"
  placeholder="Start speaking..."
/>
```

### 2. RecordingControls
**Location**: `client/src/components/unified/RecordingControls.tsx`

Provides consistent recording control buttons that adapt to current state.

**Props**:
- `state`: 'idle' | 'recording' | 'recorded' | 'playing'
- `onStart`: Start recording callback
- `onStop`: Stop recording callback
- `onReset`: Reset/re-record callback (optional)
- `onSubmit`: Submit answer callback (optional)
- `onPlay`: Play recording callback (optional)
- `onStopPlayback`: Stop playback callback (optional)
- `disabled`: Disable controls
- `submitLabel`: Custom submit button text

**Usage**:
```typescript
<RecordingControls
  state={controlState}
  onStart={startRecording}
  onStop={stopRecording}
  onReset={resetRecording}
  onPlay={playRecording}
  onStopPlayback={stopPlayback}
/>
```

### 3. WordCountProgress
**Location**: `client/src/components/unified/WordCountProgress.tsx`

Displays word count with visual progress bar.

**Props**:
- `currentWords`: Current word count
- `targetWords`: Target word count (optional)
- `label`: Label text
- `showTarget`: Show target in display
- `className`: Additional CSS classes

**Usage**:
```typescript
<WordCountProgress
  currentWords={state.wordCount}
  targetWords={100}
  label="Words spoken"
/>
```

### 4. RecordingTimer
**Location**: `client/src/components/unified/RecordingTimer.tsx`

Displays recording duration in MM:SS format with optional recording indicator.

**Props**:
- `seconds`: Duration in seconds
- `isRecording`: Show recording pulse indicator
- `className`: Additional CSS classes

**Usage**:
```typescript
<RecordingTimer 
  seconds={state.duration} 
  isRecording={state.isRecording}
/>
```

### 5. RecordingPanel (Composite)
**Location**: `client/src/components/unified/RecordingPanel.tsx`

High-level component that combines all the above components for a complete recording interface. Uses the `useVoiceRecording` hook.

**Props**:
- `recording`: VoiceRecordingControls from hook
- `targetWords`: Target word count (optional)
- `showTranscript`: Show transcript display
- `showWordCount`: Show word count progress
- `showTimer`: Show recording timer
- `tip`: Tip text to display
- `className`: Additional CSS classes

**Usage**:
```typescript
const recording = useVoiceRecording({
  onRecordingComplete: (audioBlob, transcript) => {
    // Handle completion
  }
});

<RecordingPanel
  recording={recording}
  targetWords={100}
  showTranscript={true}
  showWordCount={true}
  showTimer={true}
  tip="Speak clearly and naturally."
/>
```

## Composition Patterns

### Pattern 1: Full Recording Interface (TrainingMode)
Uses the complete `RecordingPanel` with all features enabled.

```typescript
<RecordingPanel
  recording={recording}
  targetWords={totalWords}
  showTranscript={true}
  showWordCount={true}
  showTimer={true}
  tip="Read the full answer naturally."
/>
```

### Pattern 2: Custom Layout (VoiceSession, VoiceInterview)
Compose individual components for custom layouts:

```typescript
<div className="recording-interface">
  <RecordingTimer seconds={duration} isRecording={isRecording} />
  
  <TranscriptDisplay
    transcript={transcript}
    interimTranscript={interimTranscript}
    isRecording={isRecording}
  />
  
  <WordCountProgress
    currentWords={wordCount}
    targetWords={50}
  />
  
  <RecordingControls
    state={controlState}
    onStart={startRecording}
    onStop={stopRecording}
    onSubmit={submitAnswer}
  />
</div>
```

### Pattern 3: Minimal Recording (Quick Practice)
Use only essential components:

```typescript
<div>
  <TranscriptDisplay transcript={transcript} isRecording={isRecording} />
  <RecordingControls state={state} onStart={start} onStop={stop} />
</div>
```

## Benefits

### Flexibility
- Mix and match components as needed
- Easy to create custom layouts
- Adapt to different use cases

### Consistency
- Same UI/UX across features
- Consistent styling and behavior
- Unified user experience

### Maintainability
- Fix bugs in one place
- Easy to update styling
- Clear component boundaries

### Reusability
- Use in any voice feature
- Combine in different ways
- Extend with new features

## Migration Strategy

### For Simple Features (like TrainingMode)
1. Use `useVoiceRecording` hook
2. Use complete `RecordingPanel` component
3. Minimal code changes required

### For Complex Features (like VoiceSession, VoiceInterview)
1. Keep existing state management
2. Replace UI sections with unified components
3. Gradual migration of individual pieces
4. Maintain existing functionality

## Future Enhancements

### Planned Components
- `QuestionCard`: Unified question display
- `ProgressBar`: Unified progress visualization
- `ActionCard`: Unified CTA cards
- `FeedbackPanel`: Unified feedback display

### Planned Hooks
- `useVoiceRecognition`: Speech recognition only (no audio)
- `useRecordingTimer`: Timer logic
- `useQuestionNavigation`: Question browsing

## Testing

All components are:
- ✅ TypeScript type-safe
- ✅ Build-tested
- ✅ Used in production (TrainingMode)
- 📋 Ready for Storybook stories
- 📋 Ready for unit tests

## Examples in Production

### TrainingMode
Uses complete `RecordingPanel` with all features:
- Live transcription
- Word-by-word playback highlighting
- Word count progress
- Recording timer
- Full recording controls

See: `client/src/pages/TrainingMode.tsx`

## Contributing

When creating new voice features:
1. Start with existing unified components
2. Compose them to fit your needs
3. Only create new components if truly needed
4. Follow the same patterns and conventions
5. Update this documentation

## Summary

The unified components library provides flexible, composable building blocks for voice features. Use the complete `RecordingPanel` for simple cases, or compose individual components for complex layouts. All components follow consistent patterns and provide a unified user experience.
