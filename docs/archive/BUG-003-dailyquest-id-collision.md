# Bug Report: DailyQuestDAO ID Generation Not Unique Per User

**File**: `src/db/dao.ts`  
**Lines**: 773-779  
**Severity**: HIGH  
**Type**: Data Integrity

## Description

The DailyQuestDAO generates quest IDs using only the date and quest type, without including the userId. This causes quest ID collisions when multiple users exist in the system.

## Expected Behavior

Each user should have their own independent set of daily quests.

## Actual Behavior

```javascript
const id = `${quest.date.toISOString().split("T")[0]}-${quest.questType}`;
```

Two different users trying to create a "daily-easy" quest on the same date would get the same ID.

## Suggested Fix

```javascript
const id = `${quest.userId}-${quest.date.toISOString().split("T")[0]}-${quest.questType}`;
```

## Impact

- Quest data corruption for multi-user scenarios
- Users see each other's quest progress
- Complete data integrity failure

## Reproduction

1. Create User A
2. Create a daily quest for User A on 2024-01-01
3. Create User B
4. Create a daily quest for User B on 2024-01-01
5. The second creation may fail or overwrite User A's quest

---
