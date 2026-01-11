# Unified Reward System

A centralized system for XP, Credits, Badges, and Achievements that tracks all user activities.

## Architecture

```
client/src/lib/rewards/
├── types.ts      # Type definitions for activities, rewards, progress
├── config.ts     # XP/Credit values, multipliers, activity configs
├── storage.ts    # LocalStorage persistence with migration support
├── engine.ts     # Central processing engine for all activities
└── index.ts      # Public API and helper functions

client/src/context/
├── RewardContext.tsx      # New unified context provider
├── AchievementContext.tsx # Updated to integrate with unified system
└── CreditsContext.tsx     # Updated to integrate with unified system

client/src/hooks/
└── use-rewards.ts         # Hook for accessing reward system

client/src/components/
└── RewardNotification.tsx # UI component for reward notifications
```

## Activity Types

All trackable user activities:

| Activity | XP | Credits | Notes |
|----------|-----|---------|-------|
| question_completed | 10-30 | 0 | Based on difficulty |
| quiz_answered | 5 | ±1 | Correct/wrong |
| voice_interview_completed | 50-150 | 10-35 | Based on verdict |
| srs_card_rated | 0-15 | -2 to +3 | Based on rating |
| daily_login | 10 | 0 | Once per day |
| certification_passed | 500 | 200 | Per certification |
| coding_challenge_passed | 200 | 100 | Per challenge |
| training_session_completed | 75 | 25 | Per session |

## Streak Multipliers

| Days | Multiplier |
|------|------------|
| 3 | 1.05x |
| 7 | 1.1x |
| 14 | 1.2x |
| 30 | 1.5x |
| 60 | 1.75x |
| 100 | 2.0x |
| 365 | 3.0x |

## Usage

### Using the Hook

```tsx
import { useRewards } from '../hooks/use-rewards';

function MyComponent() {
  const { 
    level, totalXP, credits, streak,
    trackQuestion, trackQuiz, trackVoice,
    lastReward 
  } = useRewards();
  
  const handleQuestionComplete = () => {
    const result = trackQuestion('intermediate', 'javascript');
    // result contains xpEarned, creditsEarned, achievementsUnlocked, etc.
  };
}
```

### Using the Context

```tsx
import { useRewardContext } from '../context/RewardContext';

function MyComponent() {
  const { 
    onQuestionCompleted,
    onQuizAnswered,
    onVoiceInterview,
    level, credits, streak
  } = useRewardContext();
}
```

### Quick Helpers

```tsx
import { 
  trackQuestionCompleted,
  trackQuizAnswer,
  trackVoiceInterview,
  trackSRSReview,
  getUserRewardState
} from '../lib/rewards';

// Track activities directly
trackQuestionCompleted('advanced', 'react');
trackQuizAnswer(true);
trackVoiceInterview('hire', 85);
trackSRSReview('good');

// Get current state
const state = getUserRewardState();
```

## Achievement Categories

- **Streak**: 3, 7, 14, 30, 100 day streaks
- **Completion**: 10, 50, 100, 250, 500, 1000 questions
- **Mastery**: Difficulty-based (beginner, intermediate, advanced)
- **Explorer**: Channel exploration (3, 5, 10 channels)
- **Voice**: Interview milestones (1, 5, 10 interviews, successes)
- **Certification**: Certification completions
- **Coding**: Coding challenge completions
- **Training**: Training session completions
- **SRS**: Review milestones
- **Daily/Weekly**: Repeatable challenges

## Backward Compatibility

The existing `useAchievementContext` and `useCredits` hooks continue to work and now also trigger the unified system. Both systems stay in sync.

## Data Migration

The system automatically migrates data from:
- Old achievement-metrics localStorage
- Old user-credits localStorage
- Old badge-stats localStorage
