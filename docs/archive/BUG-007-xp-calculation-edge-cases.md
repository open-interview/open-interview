# Bug Report: DatabaseUtils.calculateXP Boundary Logic

**File**: `src/db/utils.ts`  
**Lines**: 136-153  
**Severity**: LOW  
**Type**: Logic Error

## Description

The calculateXP and calculateCredits methods use strict boundaries that might miss edge cases. For example, a score of exactly 90 gets 50 XP (correct), but what about scores between 89 and 90?

## Current Implementation

```javascript
static calculateXP(score: number): number {
  if (score >= 90) return 50;
  if (score >= 80) return 30;
  if (score >= 70) return 20;
  if (score >= 60) return 10;
  return 5;
}
```

## Expected Behavior

All scores from 0-100 should be handled correctly. Consider:

- What happens with negative scores?
- What happens with scores > 100?
- Should there be validation?

## Suggested Fix

```javascript
static calculateXP(score: number): number {
  // Validate input
  const validatedScore = Math.max(0, Math.min(100, score));

  if (validatedScore >= 90) return 50;
  if (validatedScore >= 80) return 30;
  if (validatedScore >= 70) return 20;
  if (validatedScore >= 60) return 10;
  return 5;
}
```

## Impact

- Potential incorrect XP calculation for edge cases
- Users might exploit negative or high scores

---
