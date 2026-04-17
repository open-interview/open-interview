# Design System & Pattern Framework

## Overview
This document defines the unified patterns, components, and hooks used throughout the application to ensure a consistent user experience.

## Core Patterns Identified

### 1. Voice Recording Pattern
**Used in**: TrainingMode, VoiceSession, VoiceInterview

**Common Elements**:
- MediaRecorder for audio capture
- Speech Recognition for transcription
- Timer for duration tracking
- Word count tracking
- Start/Stop/Reset controls
- Live transcription display
- Playback with word highlighting

### 2. Question Display Pattern
**Used in**: QuestionViewer, TrainingMode, CertificationPractice, TestSession

**Common Elements**:
- Question card with difficulty badge
- Channel/topic indicator
- Progress tracking
- Navigation (prev/next)
- Answer reveal/hide toggle

### 3. Progress Tracking Pattern
**Used in**: All learning interfaces

**Common Elements**:
- Progress bar visualization
- Percentage completion
- Question count (X/Y format)
- Streak tracking
- Stats display

### 4. Card/Panel Pattern
**Used in**: Home, Channels, Certifications

**Common Elements**:
- Gradient backgrounds
- Icon + Title + Description
- Action buttons
- Badge indicators (NEW, EARN, etc.)
- Hover effects

## Unified Components Created

### Voice Recording Components
1. **TranscriptDisplay** - Displays transcripts with word highlighting
2. **RecordingControls** - State-aware recording buttons
3. **WordCountProgress** - Word count with progress bar
4. **RecordingTimer** - Duration display with recording indicator
5. **RecordingPanel** - Complete recording interface (composite)

### Core UI Components (Phase 1 ✅)
6. **Card** - Unified card/panel with variants (replaces 50+ instances)
7. **ProgressBar** - Consistent progress visualization (replaces 30+ instances)
8. **DifficultyBadge** - Difficulty level display (replaces 15+ instances)

### Unified Hooks
1. **useVoiceRecording** - Complete voice recording with audio + transcription

See `docs/UNIFIED_COMPONENTS.md` and `docs/PHASE1_QUICK_WINS.md` for detailed documentation.

## Implementation Status

### ✅ Phase 1 Complete - Quick Wins
- [x] Created `useVoiceRecording` hook
- [x] Created 5 voice recording components
- [x] Created 3 core UI components:
  - [x] **Card** - Unified card/panel (replaces 50+ instances)
  - [x] **ProgressBar** - Progress visualization (replaces 30+ instances)
  - [x] **DifficultyBadge** - Difficulty display (replaces 15+ instances)
- [x] Migrated TrainingMode to unified patterns
- [x] Documented all components
- [x] Created migration examples

**Impact**: 8 components created, ~950 lines of duplicate code identified, 40+ files ready for migration

### 🔄 Phase 2 In Progress - File Migrations
- [ ] Migrate CertificationPractice.tsx
- [ ] Migrate VoiceInterview.tsx
- [ ] Migrate Profile.tsx
- [ ] Migrate MobileHomeFocused.tsx
- [ ] Create Storybook stories
- [ ] Add unit tests

### 📋 Phase 3 Planned - Additional Components
- [ ] QuestionCard component
- [ ] Button component
- [ ] MetricCard component
- [ ] EmptyState component
- [ ] Complete file migrations

## Benefits

- **Consistency**: Same UX across all features
- **Maintainability**: Fix once, apply everywhere
- **Efficiency**: Faster development
- **Quality**: Tested, reusable code
- **Accessibility**: Centralized a11y improvements


## Usage Examples

### TrainingMode (Migrated ✅)

```typescript
import { useVoiceRecording } from '../hooks/use-voice-recording';
import { RecordingPanel } from '../components/unified/RecordingPanel';

export default function TrainingMode() {
  // Use unified voice recording hook
  const recording = useVoiceRecording({
    onRecordingComplete: (audioBlob, transcript) => {
      // Handle completion
      console.log('Recording complete:', transcript);
    }
  });

  return (
    <RecordingPanel
      recording={recording}
      targetWords={totalWords}
      showTranscript={true}
      showWordCount={true}
      showTimer={true}
      tip="Read the full answer naturally."
    />
  );
}
```

## Benefits Achieved

- **Consistency**: Same recording UI across all features
- **Maintainability**: Recording logic centralized in one hook
- **Code Reduction**: TrainingMode reduced from ~500 lines to ~200 lines
- **Features**: Word-by-word playback highlighting, live transcription, word count tracking
- **Accessibility**: Centralized improvements benefit all features
- **Developer Experience**: Faster development with reusable components
