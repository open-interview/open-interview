# Achievement System - Developer Guide

## Quick Start

The achievement system is now fully integrated and ready to use. This guide shows you how to track user events and trigger achievements.

## Basic Usage

### 1. Import the Hook

```typescript
import { useAchievementContext } from '../context/AchievementContext';
```

### 2. Get the trackEvent Function

```typescript
function MyComponent() {
  const { trackEvent } = useAchievementContext();
  
  // Your component code
}
```

### 3. Track Events

```typescript
// When user completes an action
trackEvent({
  type: 'question_completed',
  questionId: 'q-123',
  difficulty: 'hard',
  channel: 'algorithms',
  timestamp: new Date().toISOString(),
});
```

## Event Types

### Question Completed
```typescript
trackEvent({
  type: 'question_completed',
  questionId: string,
  difficulty: 'easy' | 'medium' | 'hard',
  channel: string,
  timestamp: string, // ISO format
});
```

### Quiz Answer
```typescript
trackEvent({
  type: 'quiz_answer',
  isCorrect: boolean,
  difficulty: 'easy' | 'medium' | 'hard',
  timestamp: string,
});
```

### Voice Interview
```typescript
trackEvent({
  type: 'voice_interview_completed',
  timestamp: string,
});
```

### SRS Review
```typescript
trackEvent({
  type: 'srs_review',
  rating: 'again' | 'hard' | 'good' | 'easy',
  timestamp: string,
});
```

### Daily Login
```typescript
trackEvent({
  type: 'daily_login',
  timestamp: string,
});
```

### Session Start/End
```typescript
trackEvent({
  type: 'session_start',
  timestamp: string,
});

trackEvent({
  type: 'session_end',
  timestamp: string,
});
```

## Display Components

### Level Display

Shows user's current level, XP, and streak.

```typescript
import { LevelDisplay } from '../components/unified/LevelDisplay';

// Compact variant (for headers)
<LevelDisplay variant="compact" />

// Card variant (for profile)
<LevelDisplay variant="card" />

// Full variant (for stats page)
<LevelDisplay variant="full" />
```

### Achievement Card

Shows individual achievement with progress.

```typescript
import { AchievementCard } from '../components/unified/AchievementCard';

<AchievementCard
  achievement={achievement}
  progress={progress}
  size="md" // 'sm' | 'md' | 'lg'
/>
```

### Achievement Grid

Shows all achievements in a grid layout.

```typescript
import { useAchievements } from '../hooks/use-achievements';

function MyComponent() {
  const { achievements, progress } = useAchievements();
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {achievements.map(achievement => {
        const achievementProgress = progress.find(p => p.achievementId === achievement.id);
        return (
          <AchievementCard
            key={achievement.id}
            achievement={achievement}
            progress={achievementProgress}
            size="md"
          />
        );
      })}
    </div>
  );
}
```

## Hooks

### useAchievementContext

Main hook for tracking events and managing achievements.

```typescript
const {
  progress,        // All achievement progress
  metrics,         // User metrics (total questions, streak, etc.)
  newlyUnlocked,   // Recently unlocked achievements
  trackEvent,      // Track user events
  refreshProgress, // Manually refresh progress
  dismissNotification, // Dismiss achievement notification
} = useAchievementContext();
```

### useAchievements

Get achievements filtered by category or status.

```typescript
const {
  achievements,     // All achievements
  progress,         // Progress for all achievements
  unlocked,         // Unlocked achievements
  locked,           // Locked achievements
  inProgress,       // Achievements in progress
  byCategory,       // Achievements grouped by category
} = useAchievements();
```

### useLevel

Get level and XP information.

```typescript
const {
  level,           // Current level object
  currentXP,       // Current XP amount
  nextLevel,       // Next level object
  xpToNextLevel,   // XP needed for next level
  progressPercent, // Progress to next level (0-100)
  streak,          // Current streak
  streakMultiplier,// Streak XP multiplier
} = useLevel();
```

### useAchievement

Get specific achievement by ID.

```typescript
const {
  achievement,     // Achievement object
  progress,        // Progress for this achievement
  isUnlocked,      // Whether unlocked
  progressPercent, // Progress percentage
} = useAchievement('first-question');
```

## Examples

### Example 1: Track Quiz Completion

```typescript
function QuizComponent() {
  const { trackEvent } = useAchievementContext();
  
  const handleQuizAnswer = (isCorrect: boolean, difficulty: string) => {
    // Track for achievements
    trackEvent({
      type: 'quiz_answer',
      isCorrect,
      difficulty,
      timestamp: new Date().toISOString(),
    });
    
    // Your existing quiz logic
  };
  
  return (
    // Your quiz UI
  );
}
```

### Example 2: Display User Level in Header

```typescript
function Header() {
  return (
    <header className="flex items-center justify-between p-4">
      <Logo />
      <LevelDisplay variant="compact" />
    </header>
  );
}
```

### Example 3: Show Achievement Progress

```typescript
function ProfilePage() {
  const { achievements, progress } = useAchievements();
  const { level, currentXP, nextLevel } = useLevel();
  
  return (
    <div>
      <LevelDisplay variant="card" />
      
      <h2>Achievements</h2>
      <div className="grid grid-cols-3 gap-4">
        {achievements.map(achievement => {
          const achievementProgress = progress.find(
            p => p.achievementId === achievement.id
          );
          return (
            <AchievementCard
              key={achievement.id}
              achievement={achievement}
              progress={achievementProgress}
              size="md"
            />
          );
        })}
      </div>
    </div>
  );
}
```

### Example 4: Track Voice Interview

```typescript
function VoiceInterviewPage() {
  const { trackEvent } = useAchievementContext();
  
  const handleInterviewComplete = () => {
    // Track for achievements
    trackEvent({
      type: 'voice_interview_completed',
      timestamp: new Date().toISOString(),
    });
    
    // Your existing completion logic
  };
  
  return (
    // Your voice interview UI
  );
}
```

## Achievement Categories

- **streak**: Daily/weekly streak achievements
- **completion**: Question completion milestones
- **mastery**: Difficulty-based achievements
- **explorer**: Channel exploration achievements
- **special**: Time-based and special achievements
- **daily**: Daily challenge achievements
- **weekly**: Weekly challenge achievements

## Tips

1. **Always use ISO timestamps**: `new Date().toISOString()`
2. **Track events immediately**: Don't wait for async operations
3. **Include all required fields**: Check the event type definition
4. **Test notifications**: Achievements show notifications automatically
5. **Check localStorage**: All progress is saved to localStorage

## Debugging

### Check Achievement Progress

```typescript
const { progress } = useAchievementContext();
console.log('Achievement Progress:', progress);
```

### Check User Metrics

```typescript
const { metrics } = useAchievementContext();
console.log('User Metrics:', metrics);
```

### Check Unlocked Achievements

```typescript
const { unlocked } = useAchievements();
console.log('Unlocked:', unlocked);
```

### Clear Achievement Data (for testing)

```typescript
localStorage.removeItem('achievements');
localStorage.removeItem('user-metrics');
window.location.reload();
```

## Common Issues

### Notifications Not Showing
- Check that `AchievementNotificationManager` is in App.tsx
- Check that `AchievementProvider` wraps your app
- Check browser console for errors

### Progress Not Saving
- Check localStorage is enabled
- Check for localStorage quota errors
- Check that events have correct format

### Credits Not Awarded
- Check that achievement has credit rewards
- Check that `earnCredits` is imported correctly
- Check browser console for errors

## Next Steps

- Add more event tracking to your components
- Customize achievement definitions in `lib/achievements/definitions.ts`
- Add new achievement categories
- Create achievement detail modals
- Add achievement sharing features
