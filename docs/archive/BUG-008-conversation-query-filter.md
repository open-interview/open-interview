# Bug Report: ConversationDAO.getByQuestionId Missing User Filter

**File**: `src/db/dao.ts`  
**Lines**: 122-131  
**Severity**: MEDIUM  
**Type**: Security/Privacy

## Description

The `getByQuestionId` method accepts a userId parameter but the Dexie query doesn't properly filter by both userId AND questionId. The current implementation uses `.and()` which can be inefficient and may have unexpected behavior.

## Current Implementation

```javascript
async getByQuestionId(
  userId: string,
  questionId: string,
): Promise<Conversation[]> {
  return await db.conversations
    .where("userId")
    .equals(userId)
    .and((conv) => conv.questionId === questionId)
    .toArray();
}
```

## Issues

1. The method signature suggests it filters by user, but the query structure might return conversations from other users if there are indexing issues
2. No compound index on [userId, questionId]
3. Performance issues with large datasets

## Suggested Fix

Add a compound index in schema.ts:

```javascript
conversations: "id, userId, questionId, [userId+questionId], timestamp, sessionId",
```

Update the query:

```javascript
async getByQuestionId(
  userId: string,
  questionId: string,
): Promise<Conversation[]> {
  return await db.conversations
    .where({ userId, questionId })
    .toArray();
}
```

## Impact

- Potential privacy leak if conversations from other users are returned
- Performance degradation with large datasets

---
