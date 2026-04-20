# Recording Issue Fix - Infinite Loop

## Problem
After adding `recording` to the useEffect dependency array, it created an infinite loop because the `recording` object is recreated on every render, causing the effect to run continuously.

## Root Cause
The `useVoiceRecording` hook returns a new object on every render. When this object is added to a useEffect dependency array, it triggers the effect on every render, which in turn causes a re-render, creating an infinite loop.

## Fix Applied

### 1. Use Question ID Instead of Question Object

**File**: `client/src/pages/TrainingMode.tsx`

Changed from using the entire `currentQuestion` object to just its `id`:

```typescript
// Before (causes unnecessary re-renders)
useEffect(() => {
  // ...
}, [currentQuestion, recording]); // ❌ recording causes infinite loop

// After (only triggers when question ID changes)
useEffect(() => {
  // ...
}, [currentQuestion?.id]); // ✅ Only re-runs when question changes
```

### 2. Use Ref to Store resetRecording Function

To avoid stale closures while preventing infinite loops, we store the `resetRecording` function in a ref:

```typescript
// Add ref
const resetRecordingRef = useRef<(() => void) | null>(null);

// Update ref when recording changes
useEffect(() => {
  if (recording) {
    resetRecordingRef.current = recording.resetRecording;
  }
}, [recording]);

// Use ref in the question change effect
useEffect(() => {
  if (!currentQuestion?.answer) return;
  if (resetRecordingRef.current) {
    resetRecordingRef.current(); // ✅ Uses latest function without dependency
  }
  setShowFeedback(false);
  setCurrentFeedback(null);
  setShowAnswer(false);
}, [currentQuestion?.id]); // ✅ No infinite loop
```

### 2. Added Safety Check

Added conditional rendering to ensure RecordingPanel only renders when `recording` exists:

```typescript
{recording && (
  <RecordingPanel
    recording={recording}
    targetWords={totalWords}
    showTranscript={true}
    showWordCount={true}
    showTimer={true}
    tip={isInterviewMode 
      ? "Answer the question in your own words..."
      : "Read the full answer naturally..."
    }
    className=""
  />
)}
```

### 3. Added Debug Logging

Added console logs to help diagnose issues:

```typescript
const recording = useVoiceRecording({
  onRecordingStart: () => {
    console.log('TrainingMode: Recording started');
    // ...
  },
  onRecordingComplete: (_audioBlob, transcript) => {
    console.log('TrainingMode: Recording completed', { transcript });
    // ...
  }
});

console.log('TrainingMode: Recording object', { 
  recording: !!recording, 
  state: recording?.state,
  isInterviewMode 
});
```

## Testing

### Manual Test Steps

1. **Clear Browser Cache**:
   ```
   - Chrome: Ctrl+Shift+Delete → Clear cache
   - Or hard refresh: Ctrl+Shift+R
   ```

2. **Test Training Mode**:
   ```
   1. Navigate to /training
   2. Open DevTools Console (F12)
   3. Look for "TrainingMode: Recording object" log
   4. Verify recording panel appears
   5. Click "Start Recording"
   6. Speak and verify transcript appears
   7. Click "Stop Recording"
   8. Verify feedback appears
   ```

3. **Test Interview Mode**:
   ```
   1. Navigate to /voice-interview
   2. Open DevTools Console (F12)
   3. Look for "TrainingMode: Recording object" log
   4. Verify recording panel appears
   5. Verify answer is hidden
   6. Click "Start Recording"
   7. Speak and verify transcript appears
   8. Click "Stop Recording"
   9. Verify answer is revealed
   10. Verify feedback appears
   ```

### Expected Console Output

```
TrainingMode: Recording object {
  recording: true,
  state: {
    isRecording: false,
    isPaused: false,
    duration: 0,
    wordCount: 0,
    audioBlob: null,
    transcript: '',
    finalTranscript: ''
  },
  isInterviewMode: false
}
```

When you click "Start Recording":
```
TrainingMode: Recording started
```

When you click "Stop Recording":
```
TrainingMode: Recording completed { transcript: "your spoken words..." }
TrainingMode: Final transcript { finalTranscript: "your spoken words..." }
```

In interview mode, after recording:
```
TrainingMode: Revealing answer in interview mode
```

## Troubleshooting

### Issue: Recording panel still not showing

**Solutions**:
1. Hard refresh browser (Ctrl+Shift+R)
2. Clear browser cache completely
3. Restart dev server
4. Check console for errors
5. Verify `useVoiceRecording` hook is imported correctly

### Issue: Transcript not appearing

**Solutions**:
1. Grant microphone permission
2. Check browser compatibility (Chrome/Edge/Safari only)
3. Check console for speech recognition errors
4. Verify `showTranscript={true}` prop is set

### Issue: Answer not revealing in interview mode

**Solutions**:
1. Check console for "Revealing answer" log
2. Verify `isInterviewMode` is true
3. Check `showAnswer` state in React DevTools
4. Ensure recording completes successfully

## Files Modified

1. ✅ `client/src/pages/TrainingMode.tsx`
   - Added `recording` to useEffect dependency array
   - Added safety check for RecordingPanel rendering
   - Added debug console logs

## Verification Checklist

- [ ] Code compiles without errors
- [ ] No TypeScript diagnostics
- [ ] Recording panel visible in training mode
- [ ] Recording panel visible in interview mode
- [ ] Transcript appears when speaking
- [ ] Answer hidden in interview mode
- [ ] Answer revealed after recording in interview mode
- [ ] Feedback shows after recording
- [ ] Console logs appear as expected
- [ ] No errors in browser console

## Next Steps

1. Test manually in browser
2. If still not working, check debug guide: `TRAINING_MODE_DEBUG.md`
3. Verify all dependencies are installed
4. Check if dev server needs restart
5. Try in different browser

## Related Files

- `client/src/pages/TrainingMode.tsx` - Main component
- `client/src/hooks/use-voice-recording.ts` - Recording hook
- `client/src/components/unified/RecordingPanel.tsx` - Panel component
- `TRAINING_MODE_DEBUG.md` - Debug guide

---

**Status**: ✅ Fix applied, awaiting testing
**Priority**: High (critical functionality)
**Impact**: Both training and interview modes
