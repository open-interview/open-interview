# Bug Report: ProgressDAO.getStats Division by Zero Risk

**File**: `src/db/dao.ts`  
**Line**: 368  
**Severity**: MEDIUM  
**Type**: Logic Error

## Description

The `getStats` method in ProgressDAO calculates the mastery rate by dividing mastered questions by total questions without checking if the total is zero. This will result in NaN when the user has no progress records.

## Expected Behavior

When a user has no progress records, the method should return 0 for masteryRate to avoid NaN.

## Actual Behavior

```javascript
masteryRate: (mastered / total) * 100,
```

When `total` is 0, this evaluates to `NaN`.

## Suggested Fix

```javascript
masteryRate: total > 0 ? (mastered / total) * 100 : 0,
```

## Impact

- Dashboard displays NaN instead of 0 for new users
- Analytics calculations may fail
- UI rendering issues

## Reproduction

1. Create a new user with no progress records
2. Call `progressDAO.getStats(userId)`
3. Observe that masteryRate is NaN

---
