# Reward & Badge System - Massive Upgrade & Unification Plan

## Current State Analysis

### Existing Systems
1. **Badge System** (`client/src/lib/badges.ts`)
   - 24 badges across 5 categories (streak, completion, mastery, explorer, special)
   - 5 tiers (bronze, silver, gold, platinum, diamond)
   - Apple Watch-style circular progress rings
   - LocalStorage-based tracking
   - Manual progress calculation

2. **Credits System** (`client/src/lib/credits.ts`)
   - 500 starting credits
   - Earn: Voice interviews (+10, +25 bonus), Quiz (+1/-1), SRS (+2/+3, -2)
   - Spend: Question views (-2)
   - Coupon codes
   - Transaction history

3. **Display Components**
   - `BadgeDisplay.tsx` - Rings, grids, showcases
   - `BadgeWidget.tsx` - Home page widget
   - `Badges.tsx` - Full page with 3D tilt cards
   - Profile/Stats pages show metrics

### Problems Identified

1. **Fragmentation**
   - Badges and credits are completely separate systems
   - No unified "rewards" concept
   - Different storage keys and tracking methods
   - Inconsistent UI patterns

2. **Limited Gamification**
   - Only 24 badges (many users will complete quickly)
   - No levels/ranks/tiers for overall progress
   - No daily/weekly challenges
   - No leaderboards or social features
   - No milestone celebrations

3. **Poor Integration**
   - Badges don't affect credits or vice versa
   - No reward for unlocking badges
   - Stats page shows badges but no unified progress
   - Profile shows credits separately from achievements

4. **Weak Motivation**
   - No clear progression path
   - No "next goal" visibility
   - Limited feedback on achievements
   - No notifications for unlocks

5. **Technical Debt**
   - LocalStorage only (no sync, no backup)
   - Manual calculations everywhere
   - Duplicate logic across components
   - No centralized reward engine

---

## Unified Reward System Architecture

### Core Concept: **Achievement Engine**

Create a single, unified system that tracks ALL user accomplishments and rewards them consistently.

```typescript
// Unified reward types
type RewardType = 
  | 'badge'           // Achievement badges
  | 'credits'         // Currency
  | 'xp'              // Experience points
  | 'title'           // Profile titles
  | 'streak-bonus'    // Streak multipliers
  | 'unlock'          // Feature unlocks

// Unified achievement
interface Achievement {
  id: string;
  type: 'badge' | 'milestone' | 'challenge' | 'special';
  name: string;
  description: string;
  category: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  
  // Requirements
  requirements: Requirement[];
  
  // Rewards
  rewards: Reward[];
  
  // Display
  icon: string;
  color: string;
  gradient: string;
  
  // Metadata
  isHidden?: boolean;  // Secret achievements
  isRepeatable?: boolean;
  cooldown?: number;   // For repeatable achievements
}

interface Requirement {
  type: 'count' | 'streak' | 'percentage' | 'time' | 'combo';
  metric: string;  // 'questions_completed', 'streak_days', etc.
  target: number;
  current?: number;
}

interface Reward {
  type: RewardType;
  amount: number;
  item?: string;  // For unlocks/titles
}
```

---

## Phase 1: Unified Achievement System (Core)

### 1.1 Create Achievement Engine

**File**: `client/src/lib/achievements/engine.ts`

```typescript
/**
 * Unified Achievement Engine
 * Tracks all user progress and awards achievements automatically
 */

class AchievementEngine {
  // Track user metrics
  private metrics: Map<string, number>;
  
  // Check all achievements
  checkAchievements(event: UserEvent): Achievement[] {
    // Automatically check all achievements
    // Return newly unlocked ones
  }
  
  // Award rewards
  awardRewards(achievement: Achievement): void {
    // Credits, XP, titles, etc.
  }
  
  // Get progress for all achievements
  getProgress(): AchievementProgress[] {
    // Calculate current progress
  }
}
```

### 1.2 Expand Achievement Types

**Current**: 24 badges
**Target**: 100+ achievements

#### New Categories:

1. **Daily Challenges** (Repeatable)
   - "Daily Dozen" - Complete 12 questions today (+50 credits)
   - "Morning Grind" - Study before 9 AM (+25 credits)
   - "Night Shift" - Study after 10 PM (+25 credits)
   - "Speed Run" - Complete 5 questions in 10 minutes (+30 credits)

2. **Weekly Challenges**
   - "Week Warrior" - 50 questions this week (+200 credits)
   - "Diverse Learner" - 5 different channels this week (+150 credits)
   - "Voice Master" - 3 voice interviews this week (+300 credits)

3. **Milestones** (One-time, big rewards)
   - "First Blood" - Complete first question (+10 credits, "Beginner" title)
   - "Century" - 100 questions (+500 credits, "Dedicated" title)
   - "Half-K" - 500 questions (+2000 credits, "Expert" title)
   - "The Thousand" - 1000 questions (+5000 credits, "Master" title)

4. **Mastery Badges** (Per channel)
   - "System Design Novice" - 10 system design questions
   - "System Design Adept" - 25 system design questions
   - "System Design Expert" - 50 system design questions
   - "System Design Master" - 100% system design channel

5. **Special Achievements** (Hidden/Secret)
   - "Night Owl" - Study at 3 AM
   - "Weekend Warrior" - Study every weekend for a month
   - "Perfectionist" - Get 10 quiz questions correct in a row
   - "Comeback Kid" - Return after 30 days away

6. **Social Achievements** (Future)
   - "Helpful" - Share 10 questions
   - "Influencer" - 5 people use your referral code
   - "Mentor" - Help 10 people in community

---

## Phase 2: Unified UI Components

### 2.1 Create Unified Reward Components

**File**: `client/src/components/unified/RewardCard.tsx`

```typescript
/**
 * Unified Reward Card
 * Shows any type of reward (badge, credits, XP, title)
 */
export function RewardCard({ reward, size, variant }: RewardCardProps) {
  // Unified display for all reward types
  // Consistent animations and styling
}
```

**File**: `client/src/components/unified/AchievementCard.tsx`

```typescript
/**
 * Unified Achievement Card
 * Replaces BadgeRing with more flexible component
 */
export function AchievementCard({ achievement, progress, size }: Props) {
  // Shows achievement with progress
  // Works for badges, challenges, milestones
  // Consistent with unified design system
}
```

**File**: `client/src/components/unified/ProgressTracker.tsx`

```typescript
/**
 * Unified Progress Tracker
 * Shows overall user level and progress
 */
export function ProgressTracker({ level, xp, nextLevel }: Props) {
  // Level badge
  // XP progress bar
  // Next level preview
}
```

### 2.2 Create Reward Notification System

**File**: `client/src/components/RewardNotification.tsx`

```typescript
/**
 * Animated reward notification
 * Pops up when user earns something
 */
export function RewardNotification({ reward, onClose }: Props) {
  // Celebration animation
  // Shows what was earned
  // Auto-dismisses after 3s
}
```

---

## Phase 3: User Progression System

### 3.1 Add User Levels

```typescript
interface UserLevel {
  level: number;
  title: string;
  xpRequired: number;
  rewards: Reward[];
  perks: Perk[];
}

const LEVELS: UserLevel[] = [
  { level: 1, title: "Novice", xpRequired: 0, rewards: [], perks: [] },
  { level: 2, title: "Learner", xpRequired: 100, rewards: [{ type: 'credits', amount: 50 }], perks: [] },
  { level: 3, title: "Student", xpRequired: 250, rewards: [{ type: 'credits', amount: 100 }], perks: ['unlock_bookmarks'] },
  { level: 5, title: "Practitioner", xpRequired: 500, rewards: [{ type: 'credits', amount: 200 }], perks: ['unlock_voice'] },
  { level: 10, title: "Expert", xpRequired: 2000, rewards: [{ type: 'credits', amount: 500 }], perks: ['unlock_tests'] },
  { level: 20, title: "Master", xpRequired: 5000, rewards: [{ type: 'credits', amount: 1000 }], perks: ['unlock_coding'] },
  { level: 50, title: "Legend", xpRequired: 20000, rewards: [{ type: 'credits', amount: 5000 }], perks: ['all_features'] },
];
```

### 3.2 XP System

**Earn XP from**:
- Complete question: +10 XP
- Complete beginner: +10 XP
- Complete intermediate: +20 XP
- Complete advanced: +30 XP
- Voice interview: +50 XP
- Voice interview success: +100 XP bonus
- Quiz correct: +5 XP
- SRS review (good/easy): +10 XP
- Unlock badge: +50 XP
- Daily streak: +20 XP per day
- Complete challenge: +100 XP

### 3.3 Profile Titles

Unlockable titles that show on profile:
- "Novice" (Level 1)
- "Learner" (Level 2)
- "Student" (Level 3)
- "Practitioner" (Level 5)
- "Expert" (Level 10)
- "Master" (Level 20)
- "Legend" (Level 50)
- "Night Owl" (Study at 3 AM)
- "Early Bird" (Study before 7 AM)
- "Perfectionist" (10 correct in a row)
- "Comeback Kid" (Return after 30 days)

---

## Phase 4: Enhanced Rewards

### 4.1 Streak Multipliers

```typescript
// Streak bonuses
const STREAK_MULTIPLIERS = {
  7: 1.1,   // 10% bonus after 7 days
  14: 1.2,  // 20% bonus after 14 days
  30: 1.5,  // 50% bonus after 30 days
  100: 2.0, // 2x bonus after 100 days
};
```

### 4.2 Credit Rebalancing

**Current issues**:
- Question views cost credits (discourages learning)
- Limited ways to earn credits

**New system**:
- **Remove**: Question view costs (free learning)
- **Increase**: Voice interview rewards (+25 base, +50 bonus)
- **Add**: Daily login bonus (+10 credits)
- **Add**: Challenge completion bonuses (+50-200 credits)
- **Add**: Level up bonuses (+50-1000 credits)
- **Add**: Streak bonuses (multiplier on all earnings)

### 4.3 Feature Unlocks

Progressive feature unlocking based on level:
- Level 1: Basic questions, Quick Quiz
- Level 3: Bookmarks, SRS Review
- Level 5: Voice Interview
- Level 7: Mock Tests
- Level 10: Coding Challenges
- Level 15: Certifications
- Level 20: All features

---

## Phase 5: Social & Competitive Features

### 5.1 Leaderboards

```typescript
interface Leaderboard {
  type: 'weekly' | 'monthly' | 'all-time';
  metric: 'xp' | 'questions' | 'streak';
  entries: LeaderboardEntry[];
}

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatar: string;
  score: number;
  level: number;
  title: string;
}
```

### 5.2 Challenges

```typescript
interface Challenge {
  id: string;
  name: string;
  description: string;
  type: 'daily' | 'weekly' | 'special';
  requirements: Requirement[];
  rewards: Reward[];
  startDate: string;
  endDate: string;
  participants: number;
}
```

---

## Phase 6: Data Persistence (LocalStorage Only)

### 6.1 Enhanced LocalStorage

**Note**: This is a static GitHub Pages site - all data is client-side only

```typescript
// LocalStorage-based storage with export/import
class RewardStorage {
  // Local cache
  private cache: Map<string, any>;
  
  // Save to LocalStorage
  save(): void {
    // Save to LocalStorage with versioning
  }
  
  // Load from LocalStorage
  load(): void {
    // Load from LocalStorage with migration
  }
  
  // Export data (for backup)
  export(): string {
    // Return JSON string for user to save
  }
  
  // Import data (from backup)
  import(data: string): void {
    // Restore from JSON string
  }
}
```

### 6.2 Achievement History

Track all achievement unlocks with timestamps:
```typescript
interface AchievementHistory {
  achievementId: string;
  unlockedAt: string;
  rewardsEarned: Reward[];
  context?: any;  // What triggered it
}
```

---

## Implementation Plan

### Week 1: Core Engine
- [ ] Create `AchievementEngine` class
- [ ] Define all achievement types
- [ ] Implement progress tracking
- [ ] Add reward distribution

### Week 2: UI Components
- [ ] Create `RewardCard` component
- [ ] Create `AchievementCard` component
- [ ] Create `ProgressTracker` component
- [ ] Create `RewardNotification` component
- [ ] Migrate existing badge displays

### Week 3: User Progression
- [ ] Implement XP system
- [ ] Add user levels
- [ ] Create profile titles
- [ ] Add level-up animations

### Week 4: Enhanced Rewards
- [ ] Implement streak multipliers
- [ ] Rebalance credit economy
- [ ] Add daily/weekly challenges
- [ ] Create challenge UI

### Week 5: Integration
- [ ] Integrate with existing pages
- [ ] Update Profile page
- [ ] Update Stats page
- [ ] Update Home page widgets
- [ ] Add notifications

### Week 6: Polish & Testing
- [ ] Add animations
- [ ] Test all achievement triggers
- [ ] Balance rewards
- [ ] Fix bugs
- [ ] Write documentation

---

## Success Metrics

### Engagement
- [ ] 50% increase in daily active users
- [ ] 30% increase in session length
- [ ] 40% increase in questions completed

### Retention
- [ ] 25% increase in 7-day retention
- [ ] 35% increase in 30-day retention
- [ ] 20% decrease in churn rate

### Monetization (Future)
- [ ] Premium achievements
- [ ] Credit packs
- [ ] Exclusive titles

---

## Migration Strategy

### Backward Compatibility
1. Keep existing badge system working
2. Gradually migrate to new system
3. Import old progress to new system
4. Deprecate old system after 2 weeks

### Data Migration
```typescript
function migrateOldBadges(): void {
  const oldBadges = getUnlockedBadges();  // Old system
  const oldStats = getBadgeStats();
  
  // Convert to new achievement format
  Object.entries(oldBadges).forEach(([badgeId, unlockedAt]) => {
    achievementEngine.unlock(badgeId, unlockedAt);
  });
  
  // Migrate stats
  achievementEngine.setMetrics({
    totalCompleted: oldStats.totalCompleted,
    streak: oldStats.streak,
    // ... etc
  });
}
```

---

## Files to Create

### Core
- `client/src/lib/achievements/engine.ts` - Achievement engine
- `client/src/lib/achievements/definitions.ts` - All achievements
- `client/src/lib/achievements/levels.ts` - Level system
- `client/src/lib/achievements/storage.ts` - Data persistence
- `client/src/lib/achievements/types.ts` - TypeScript types

### Components
- `client/src/components/unified/RewardCard.tsx`
- `client/src/components/unified/AchievementCard.tsx`
- `client/src/components/unified/ProgressTracker.tsx`
- `client/src/components/unified/ChallengeCard.tsx`
- `client/src/components/RewardNotification.tsx`
- `client/src/components/AchievementModal.tsx`
- `client/src/components/LevelUpModal.tsx`

### Pages
- `client/src/pages/Achievements.tsx` - Unified achievements page
- `client/src/pages/Challenges.tsx` - Daily/weekly challenges
- `client/src/pages/Leaderboard.tsx` - Competitive rankings

### Hooks
- `client/src/hooks/use-achievements.ts`
- `client/src/hooks/use-rewards.ts`
- `client/src/hooks/use-level.ts`
- `client/src/hooks/use-challenges.ts`

---

## Files to Update

### Existing Components
- `client/src/components/BadgeWidget.tsx` - Use new system
- `client/src/components/BadgeDisplay.tsx` - Deprecate or adapt
- `client/src/pages/Badges.tsx` - Migrate to Achievements.tsx
- `client/src/pages/Profile.tsx` - Add level/XP display
- `client/src/pages/StatsRedesigned.tsx` - Show unified progress
- `client/src/pages/HomeRedesigned.tsx` - Add challenge widget

### Libraries
- `client/src/lib/badges.ts` - Deprecate gradually
- `client/src/lib/credits.ts` - Integrate with reward engine

---

## Visual Design Updates

### Color Palette
- Bronze: `#cd7f32` → Keep
- Silver: `#c0c0c0` → Keep
- Gold: `#ffd700` → Keep
- Platinum: `#e5e4e2` → Keep
- Diamond: `#b9f2ff` → Keep
- XP: `#8b5cf6` (Purple)
- Level: `#3b82f6` (Blue)

### Animations
- Achievement unlock: Confetti + scale bounce
- Level up: Radial burst + glow
- Reward earned: Slide in from top
- Progress update: Smooth fill animation

### Icons
- Use Lucide icons consistently
- Add custom SVG for special achievements
- Animated icons for rare achievements

---

## Next Steps

1. **Review & Approve** this plan
2. **Start with Phase 1** - Core engine
3. **Iterate quickly** - Ship weekly updates
4. **Gather feedback** - From users
5. **Refine & expand** - Based on data

This unified system will transform the reward experience from fragmented and basic to cohesive, engaging, and motivating! 🚀
