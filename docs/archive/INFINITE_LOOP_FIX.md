# Infinite Loop Fix - Training Mode

## Problem
Recording never starts because there's an infinite loop. The component keeps re-rendering continuously.

## Root Cause
Adding `recording` object to useEffect dependency array caused infinite loop:
1. `recording` object is created by `useVoiceRecording` hook
2. Hook returns new object on every render
3. useEffect sees "new" recording object
4. useEffect runs and triggers re-render
5. New recording object created
6. Loop continues infinitely

## Solution

### Use Refs to Break the Loop

Instead of depending on the `recording` object directly, we:
1. Store the `resetRecording` function in a ref
2. Update the ref when recording changes
3. Use the ref in the effect (refs don't trigger re-renders)
4. Only depend on `currentQuestion?.id` (primitive value)

### Code Changes

```typescript
// 1. Add ref for resetRecording function
const resetRecordingRef = useRef<(() => void) | null>(null);

// 2. Update ref when recording changes (separate effect)
useEffect(() => {
  if (recording) {
    resetRecordingRef.current = recording.resetRecording;
  }
}, [recording]); // This is OK - only updates ref, doesn't cause re-render

// 3. Use ref in question change effect
useEffect(() => {
  if (!currentQuestion?.answer) return;
  if (resetRecordingRef.current) {
    resetRecordingRef.current(); // Call via ref
  }
  setShowFeedback(false);
  setCurrentFeedback(null);
  setShowAnswer(false);
}, [currentQuestion?.id]); // Only depends on question ID (primitive)
```

## Why This Works

### Refs Don't Trigger Re-renders
- Updating a ref doesn't cause component to re-render
- Reading from a ref always gets latest value
- Perfect for storing functions that change on every render

### Primitive Dependencies
- `currentQuestion?.id` is a string/number
- Primitives are compared by value, not reference
- Only changes when question actually changes
- No infinite loop

## Testing

### Verify Fix Works

1. **Open browser DevTools Console**
2. **Navigate to `/training` or `/voice-interview`**
3. **Check console logs**:
   - Should see "TrainingMode: Recording object" ONCE per question
   - Should NOT see continuous logging
   - Should NOT see browser freezing

4. **Click "Start Recording"**:
   - Should see "TrainingMode: Recording started"
   - Recording should actually start
   - Transcript should appear as you speak

5. **Navigate to next question**:
   - Should see recording reset
   - Should see "TrainingMode: Recording object" ONCE
   - No infinite loop

### Signs of Infinite Loop (Before Fix)

- ❌ Console logs repeating rapidly
- ❌ Browser tab freezing/unresponsive
- ❌ CPU usage spiking
- ❌ Recording never starts
- ❌ Can't click buttons

### Signs Fix is Working (After Fix)

- ✅ Console logs appear once per action
- ✅ Browser responsive
- ✅ Normal CPU usage
- ✅ Recording starts when clicked
- ✅ Buttons work normally

## Alternative Solutions Considered

### Option 1: useMemo (Not Used)
```typescript
const recording = useMemo(() => useVoiceRecording({...}), []);
```
**Problem**: Can't use hooks inside useMemo

### Option 2: useCallback (Not Used)
```typescript
const resetRecording = useCallback(() => {
  recording.resetRecording();
}, [recording]);
```
**Problem**: Still depends on recording object

### Option 3: Remove Dependency (Not Used)
```typescript
useEffect(() => {
  recording.resetRecording();
}, [currentQuestion?.id]); // eslint-disable-line
```
**Problem**: Stale closure - might call old function

### Option 4: Refs (USED) ✅
```typescript
const resetRecordingRef = useRef<(() => void) | null>(null);
useEffect(() => {
  resetRecordingRef.current = recording.resetRecording;
}, [recording]);
```
**Advantage**: No infinite loop, no stale closures

## Files Modified

1. ✅ `client/src/pages/TrainingMode.tsx`
   - Added `resetRecordingRef`
   - Added effect to update ref
   - Changed question change effect to use ref
   - Changed dependency from `currentQuestion` to `currentQuestion?.id`

## Verification Checklist

- [ ] No infinite loop (check console)
- [ ] Recording starts when clicked
- [ ] Transcript appears when speaking
- [ ] Can navigate between questions
- [ ] Browser remains responsive
- [ ] No excessive re-renders
- [ ] Works in training mode
- [ ] Works in interview mode

## Related Issues

- React Hook Dependencies: https://react.dev/reference/react/useEffect#dependencies
- Refs and Effects: https://react.dev/learn/referencing-values-with-refs
- Avoiding Infinite Loops: https://react.dev/learn/you-might-not-need-an-effect

---

**Status**: ✅ Fixed
**Priority**: Critical (blocking feature)
**Impact**: Both training and interview modes
**Testing**: Manual testing required
