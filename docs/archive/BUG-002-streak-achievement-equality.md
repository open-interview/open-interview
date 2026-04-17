# Bug Report: AchievementDAO Check Streak Uses Exact Equality

**File**: `src/db/utils.ts`  
**Lines**: 192-207  
**Severity**: HIGH  
**Type**: Logic Error

## Description

The `checkStreakAchievement` method checks for exact equality (`streak === milestone`) instead of greater than or equal (`streak >= milestone`). This means:

- A user with a 10-day streak won't get the 7-day achievement if they missed it
- Users can miss achievements if they skip checking at exact milestone values

## Expected Behavior

Users should receive all achievements for streaks they've maintained (e.g., streak of 10 should award both 7-day and 3-day achievements).

## Actual Behavior

```javascript
for (const milestone of streakMilestones) {
  if (streak === milestone) {  // Wrong: should be >=
    await this.unlockAchievement(...)
  }
}
```

## Suggested Fix

```javascript
for (const milestone of streakMilestones) {
  if (streak >= milestone) {
    const achievementId = `streak-${milestone}`;
    const existing = await achievementDAO.getByAchievementId(userId, achievementId);
    if (!existing || !existing.unlocked) {
      await this.unlockAchievement(...);
    }
  }
}
```

## Impact

- Users miss streak achievements
- Gamification system fails to properly reward progress
- User engagement may decrease due to missing rewards

## Reproduction

1. Create user
2. Simulate activity for 3 days (streak = 3)
3. Check achievements - 3-day streak achievement unlocked
4. Simulate activity for 7 days (streak = 7)
5. 7-day achievement unlocked
6. Skip checking achievements at day 3
7. Continue to day 10
8. 3-day and 7-day achievements are never unlocked

---
