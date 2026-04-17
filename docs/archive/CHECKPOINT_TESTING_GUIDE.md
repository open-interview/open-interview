# Checkpoint Testing Guide

## Issue Fixed
The checkpoint logic has been corrected to properly trigger every 5 questions.

## Changes Made

### 1. Fixed Checkpoint Trigger Logic
**Before:**
```typescript
// Was checking reviewedCount + 1, but reviewedCount wasn't updated yet
const newCount = reviewedCount + 1;
if (newCount % 5 === 0 && newCount < dueCards.length) {
  setSessionState('checkpoint');
}
```

**After:**
```typescript
// Now properly updates reviewedCount first, then checks
const newCount = reviewedCount + 1;
setReviewedCount(newCount);

// Move to next card index
const nextIndex = currentIndex + 1;

// Check for checkpoint AFTER updating count
if (newCount % 5 === 0 && nextIndex < dueCards.length) {
  console.log(`[Checkpoint] Triggering checkpoint at question ${newCount}`);
  setCurrentIndex(nextIndex);
  setSessionState('checkpoint');
  return;
}
```

### 2. Fixed Checkpoint Resume Logic
**Before:**
```typescript
// Was trying to increment currentIndex again
const nextIndex = currentIndex + 1;
if (nextIndex < dueCards.length) {
  setCurrentIndex(nextIndex);
  loadQuestion(dueCards[nextIndex]);
}
```

**After:**
```typescript
// currentIndex was already set in handleRate, just load that question
if (currentIndex < dueCards.length) {
  loadQuestion(dueCards[currentIndex]);
}
```

### 3. Added Debug Logging
```typescript
console.log(`[Checkpoint Debug] Reviewed: ${newCount}, Next Index: ${currentIndex + 1}, Total: ${dueCards.length}`);
console.log(`[Checkpoint] Triggering checkpoint at question ${newCount}`);
```

## How to Test

### Step 1: Navigate to Review Session
1. Open the app in your browser
2. Navigate to `/review` route
3. Open browser console (F12 or Cmd+Option+I)

### Step 2: Review Questions
1. Click "Reveal" to show the answer
2. Rate the question (Again/Hard/Good/Easy)
3. Repeat for 5 questions

### Step 3: Verify Checkpoint
After rating the 5th question, you should see:

**In Console:**
```
[Checkpoint Debug] Reviewed: 5, Next Index: 5, Total: 20
[Checkpoint] Triggering checkpoint at question 5
```

**On Screen:**
- Checkpoint screen appears with target icon
- Shows "Checkpoint!" heading
- Shows "You've reviewed 5 questions. Let's check your progress!"
- Loading spinner appears
- After 1.5 seconds, shows score (3-5 out of 5)
- "Continue Reviewing" button appears

### Step 4: Continue and Test Again
1. Click "Continue Reviewing"
2. Review 5 more questions (questions 6-10)
3. Checkpoint should appear again after question 10

### Step 5: Verify Multiple Checkpoints
Checkpoints should appear at:
- Question 5
- Question 10
- Question 15
- Question 20
- etc.

## Expected Behavior

### Checkpoint Trigger Points
```
Question 1  → Review
Question 2  → Review
Question 3  → Review
Question 4  → Review
Question 5  → Review → CHECKPOINT
Question 6  → Review
Question 7  → Review
Question 8  → Review
Question 9  → Review
Question 10 → Review → CHECKPOINT
...and so on
```

### Checkpoint Screen Elements
1. **Target Icon** - Animated with spring physics
2. **Heading** - "Checkpoint!"
3. **Message** - "You've reviewed X questions. Let's check your progress!"
4. **Loading State** - Spinner for 1.5 seconds
5. **Score Display** - "X/5" with encouraging message
6. **Continue Button** - "Continue Reviewing"

### Checkpoint Scoring
Currently simulated with random score (3-5 out of 5):
```typescript
const randomScore = Math.floor(Math.random() * 3) + 3; // 3-5
```

Messages based on score:
- **5/5 or 4/5**: "Excellent retention!"
- **3/5**: "Good progress!"
- **< 3**: "Keep practicing!"

## Troubleshooting

### Checkpoint Not Appearing?

**Check Console Logs:**
```javascript
// Should see this after every question
[Checkpoint Debug] Reviewed: X, Next Index: Y, Total: Z

// Should see this at questions 5, 10, 15, etc.
[Checkpoint] Triggering checkpoint at question X
```

**Verify Conditions:**
1. `newCount % 5 === 0` - Is the count divisible by 5?
2. `nextIndex < dueCards.length` - Are there more cards to review?

**Common Issues:**
- **Not enough cards**: Need at least 6 cards to see first checkpoint
- **Last batch**: Checkpoint won't show if it's the last 5 cards (goes straight to completion)
- **State not updating**: Check if `reviewedCount` is incrementing

### Checkpoint Appears Too Early/Late?

Check the console logs to see the actual count:
```
[Checkpoint Debug] Reviewed: 5, Next Index: 5, Total: 20
```

If the count is wrong, there might be an issue with state updates.

### Checkpoint Doesn't Resume?

After clicking "Continue Reviewing", check:
1. `currentIndex` should be set to the next question
2. `loadQuestion(dueCards[currentIndex])` should be called
3. `sessionState` should change from 'checkpoint' to 'reviewing'

## Testing with Different Card Counts

### Test Case 1: Exactly 5 Cards
- Review all 5 cards
- Should go straight to completion (no checkpoint)
- Expected: No checkpoint appears

### Test Case 2: 6-9 Cards
- Review 5 cards → Checkpoint appears
- Continue → Review remaining cards
- Expected: 1 checkpoint at question 5

### Test Case 3: 10-14 Cards
- Review 5 cards → Checkpoint appears
- Continue → Review 5 more cards → Checkpoint appears
- Continue → Review remaining cards
- Expected: 2 checkpoints at questions 5 and 10

### Test Case 4: 15+ Cards
- Checkpoints at questions 5, 10, 15, etc.
- Expected: Multiple checkpoints

## Debug Mode

To enable more detailed logging, add this to the component:

```typescript
// Add after handleRate function
useEffect(() => {
  console.log('[State]', {
    sessionState,
    reviewedCount,
    currentIndex,
    totalCards: dueCards.length,
    showAnswer
  });
}, [sessionState, reviewedCount, currentIndex, dueCards.length, showAnswer]);
```

## Build Verification

✅ Build successful: `ReviewSessionOptimized-BqU3BeiK.js` (32.79 kB, 8.54 kB gzipped)
✅ No TypeScript errors
✅ No diagnostics

## Next Steps

1. Test the checkpoint functionality with the steps above
2. Verify console logs show correct counts
3. Verify checkpoint appears at questions 5, 10, 15, etc.
4. Verify "Continue Reviewing" button works
5. Report any issues found

## Future Enhancements

Once basic checkpoint is working:
1. Replace simulated score with actual checkpoint questions
2. Add checkpoint question pool
3. Track checkpoint performance
4. Adjust difficulty based on checkpoint results
5. Add checkpoint history
6. Add checkpoint skip option
