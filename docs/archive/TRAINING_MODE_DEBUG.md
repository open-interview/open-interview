# Training Mode Debug Guide

## Issue
Recording panel and transcript not showing in both training mode and interview mode.

## Debugging Steps

### 1. Check Console Logs

Open browser DevTools (F12) and look for these logs:

```
TrainingMode: Recording object { recording: true, state: {...}, isInterviewMode: false }
```

If you see `recording: false` or `recording: undefined`, the hook isn't initializing properly.

### 2. Check Component Rendering

In React DevTools:
1. Find the `TrainingMode` component
2. Check props:
   - `recording` should be an object with `state`, `startRecording`, etc.
   - `isInterviewMode` should be true/false

### 3. Check RecordingPanel

In React DevTools:
1. Find the `RecordingPanel` component
2. If it's not there, the conditional `{recording && (` is failing
3. Check if `recording` prop is passed correctly

### 4. Check useVoiceRecording Hook

The hook should return:
```typescript
{
  state: {
    isRecording: false,
    isPaused: false,
    duration: 0,
    wordCount: 0,
    audioBlob: null,
    transcript: '',
    finalTranscript: ''
  },
  startRecording: [Function],
  stopRecording: [Function],
  // ... other methods
}
```

## Common Issues

### Issue 1: Hook Not Initializing

**Symptom**: `recording` is undefined
**Cause**: Hook import or initialization failed
**Fix**: Check import statement and hook call

### Issue 2: RecordingPanel Not Rendering

**Symptom**: Panel doesn't appear
**Cause**: Conditional rendering failing
**Fix**: Check if `recording` is truthy

### Issue 3: Transcript Not Showing

**Symptom**: Panel shows but no transcript
**Cause**: Speech recognition not starting
**Fix**: Check browser permissions and console errors

## Quick Test

Add this temporarily to TrainingMode.tsx after the `recording` hook:

```typescript
// Debug: Force render recording panel
useEffect(() => {
  console.log('=== RECORDING DEBUG ===');
  console.log('recording exists:', !!recording);
  console.log('recording.state:', recording?.state);
  console.log('recording.startRecording:', typeof recording?.startRecording);
  console.log('isInterviewMode:', isInterviewMode);
  console.log('currentQuestion:', !!currentQuestion);
  console.log('======================');
}, [recording, isInterviewMode, currentQuestion]);
```

## Manual Test

1. Navigate to `/training`
2. Open DevTools Console
3. Look for "RECORDING DEBUG" logs
4. Check if all values are correct
5. Try clicking "Start Recording" button
6. Check for errors in console

## Expected Behavior

### Training Mode
1. Navigate to `/training`
2. See question and answer
3. See "Record Your Answer" panel
4. Click "Start Recording"
5. Speak and see transcript appear
6. Click "Stop Recording"
7. See feedback

### Interview Mode
1. Navigate to `/voice-interview`
2. See question (answer hidden)
3. See "Record Your Answer" panel
4. Click "Start Recording"
5. Speak and see transcript appear
6. Click "Stop Recording"
7. See answer revealed + feedback

## If Still Not Working

Check these files for issues:
1. `client/src/hooks/use-voice-recording.ts` - Hook implementation
2. `client/src/components/unified/RecordingPanel.tsx` - Panel component
3. `client/src/pages/TrainingMode.tsx` - Page component

Look for:
- Import errors
- TypeScript errors
- Missing dependencies
- Conditional rendering issues
