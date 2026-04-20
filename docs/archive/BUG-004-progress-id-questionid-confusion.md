# Bug Report: DatabaseUtils.updateQuestionProgress Creates Progress with Wrong ID

**File**: `src/db/utils.ts`  
**Lines**: 70-103  
**Severity**: HIGH  
**Type**: Data Integrity

## Description

In `updateQuestionProgress`, when creating a new progress entry, the method uses the `questionId` as the progress record ID instead of generating a unique ID. This is inconsistent with the database schema where `id` should be a unique identifier for the progress record.

## Expected Behavior

Each progress record should have a unique UUID as its ID, with `questionId` stored separately.

## Actual Behavior

```javascript
progress = await progressDAO.create({
  id: questionId, // Wrong: should be crypto.randomUUID()
  userId,
  // ...
});
```

## Suggested Fix

Either:

1. Change the schema so Progress.id is a generated UUID and add a questionId field:

```javascript
progress = await progressDAO.create({
  id: crypto.randomUUID(),
  userId,
  questionId, // Add this field to Progress interface
  // ...
});
```

2. Or update getById to lookup by both userId and questionId composite key.

## Impact

- Cannot track progress for the same question across different users
- Data corruption in multi-user scenarios
- Violates database normalization principles

## Reproduction

1. User A answers Question 1
2. Progress record created with id = "question-1"
3. User B answers Question 1
4. Attempts to create progress record with same id = "question-1"
5. Database collision or overwrite

---
