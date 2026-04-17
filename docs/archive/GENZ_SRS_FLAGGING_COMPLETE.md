# Gen Z Question Viewer - SRS and Flagging Features Added

## Summary

Added missing SRS (Spaced Repetition System) and question flagging features to the Gen Z Question Viewer to match the functionality in ExtremeQuestionPanel.

## Features Added

### 1. SRS (Spaced Repetition System)

**Functionality:**
- **Add to SRS Button**: Allows users to add questions to their spaced repetition review queue
- **SRS Status Badge**: Shows current mastery level for questions already in SRS
- **Confidence Rating Buttons**: After viewing answer, users can rate their confidence (Again, Hard, Good, Easy)
- **Review Tracking**: Records reviews and updates next review date based on confidence rating
- **Achievement Integration**: Tracks SRS reviews for achievement system

**UI Components:**
- Purple gradient "Add to SRS" button with brain icon
- Color-coded rating buttons:
  - **Again** (Red): Didn't remember, review soon
  - **Hard** (Orange): Struggled to remember
  - **Good** (Green): Remembered correctly
  - **Easy** (Blue): Remembered easily
- Mastery level badge showing current progress
- Success confirmation after rating

### 2. Question Flagging

**Functionality:**
- **Flag Button**: Allows users to report issues with questions
- **Feedback Options**:
  - **Improve**: Suggest improvements to the question
  - **Rewrite**: Request complete rewrite
  - **Remove**: Flag for removal
- **GitHub Integration**: Creates GitHub issues automatically with pre-filled templates
- **Local Storage**: Tracks flagged questions to show status indicator
- **Status Badge**: Shows when a question has been flagged

**UI Components:**
- Flag icon button in Gen Z theme colors
- Dropdown menu with feedback options
- Small status badge after flagging
- Opens GitHub issue in new tab

## Code Changes

### File: `client/src/pages/QuestionViewerGenZ.tsx`

#### 1. Added Imports
```typescript
import { QuestionFeedback } from '../components/QuestionFeedback';
import {
  getCard, recordReview, addToSRS,
  getMasteryLabel, getMasteryColor,
  type ReviewCard, type ConfidenceRating
} from '../lib/spaced-repetition';
import { Brain, RotateCcw, Check, Zap } from 'lucide-react';
```

#### 2. Added State Management
```typescript
const [srsCard, setSrsCard] = useState<ReviewCard | null>(null);
const [showRatingButtons, setShowRatingButtons] = useState(false);
const [hasRated, setHasRated] = useState(false);
```

#### 3. Added SRS Card Check Effect
```typescript
useEffect(() => {
  if (!currentQuestion) return;
  const card = getCard(currentQuestion.id, currentQuestion.channel, currentQuestion.difficulty);
  setSrsCard(card);
  setShowRatingButtons(false);
  setHasRated(false);
}, [currentQuestion]);
```

#### 4. Added SRS Handlers
```typescript
const handleAddToSRS = () => {
  if (!currentQuestion) return;
  const card = addToSRS(currentQuestion.id, currentQuestion.channel, currentQuestion.difficulty);
  setSrsCard(card);
  setShowRatingButtons(true);
  toast({ title: "Added to SRS", description: "Question added to spaced repetition system" });
};

const handleSRSRating = (rating: ConfidenceRating) => {
  if (!srsCard || !currentQuestion) return;
  const updatedCard = recordReview(currentQuestion.id, currentQuestion.channel, currentQuestion.difficulty, rating);
  setSrsCard(updatedCard);
  setHasRated(true);
  setShowRatingButtons(false);
  trackEvent({ type: 'srs_review', timestamp: new Date().toISOString(), data: { rating } });
  toast({ title: "Review recorded", description: `Mastery: ${getMasteryLabel(updatedCard.masteryLevel)}` });
};
```

#### 5. Updated QuestionContent Component

**Added Props:**
- `srsCard`: Current SRS card data
- `showRatingButtons`: Whether to show rating buttons
- `hasRated`: Whether user has rated this session
- `onAddToSRS`: Handler to add question to SRS
- `onSRSRating`: Handler for confidence rating

**Added UI Elements:**
- SRS status badge in meta section
- Add to SRS button or rating buttons section
- QuestionFeedback component for flagging

## User Experience

### SRS Workflow
1. User views a question
2. If not in SRS: Shows "Add to SRS" button
3. User clicks "Add to SRS"
4. After viewing answer, rating buttons appear
5. User rates confidence (Again/Hard/Good/Easy)
6. System records review and schedules next review
7. Shows success message with mastery level

### Flagging Workflow
1. User finds an issue with a question
2. Clicks flag icon button
3. Selects feedback type (Improve/Rewrite/Remove)
4. GitHub issue opens in new tab with pre-filled template
5. Status badge shows question has been flagged
6. Can click badge to clear flag status

## Visual Design

### Gen Z Theme Integration
- **SRS Buttons**: Purple/blue gradients with neon accents
- **Rating Buttons**: Color-coded (red, orange, green, blue) with transparency
- **Badges**: Glassmorphism with border glow effects
- **Icons**: Lucide icons matching Gen Z aesthetic
- **Animations**: Framer Motion hover and tap effects
- **Typography**: Bold, modern font weights

### Responsive Design
- Works on both desktop split view and mobile single-panel view
- Touch-friendly button sizes
- Proper spacing and wrapping on small screens

## Integration Points

### Achievement System
- Tracks `srs_review` events
- Contributes to user achievements and gamification

### Credit System
- SRS reviews can award credits (configured in CreditsContext)
- Integrated with unified reward engine

### Storage
- SRS cards stored in localStorage
- Flagged questions tracked locally
- Syncs with GitHub for issue tracking

## Testing

### Test Scenarios
1. **Add to SRS**: Click "Add to SRS" button → Should show rating buttons
2. **Rate Confidence**: Click any rating button → Should show success message
3. **Mastery Badge**: View question already in SRS → Should show mastery level
4. **Flag Question**: Click flag icon → Should show feedback options
5. **GitHub Issue**: Select feedback type → Should open GitHub in new tab
6. **Navigation**: Navigate between questions → SRS state should reset properly

### Test URL
Visit: `http://localhost:5002/channel/devops/gh-18`

Expected behavior:
- "Add to SRS" button visible below question
- Flag icon button visible
- After adding to SRS, rating buttons appear
- After rating, success message shows
- Navigating to next question resets state

## Files Modified

1. **client/src/pages/QuestionViewerGenZ.tsx**
   - Added SRS state management
   - Added SRS handlers
   - Updated QuestionContent component
   - Integrated QuestionFeedback component

## Dependencies

### Existing Components Used
- `QuestionFeedback` - Flagging UI component
- `spaced-repetition` library - SRS logic
- `useAchievementContext` - Achievement tracking
- `useUnifiedToast` - Toast notifications

### No New Dependencies
All features use existing infrastructure and components.

## Status

✅ **COMPLETE** - Both SRS and flagging features are now fully integrated into the Gen Z Question Viewer, matching the functionality of ExtremeQuestionPanel.

## Next Steps

Optional enhancements:
1. Add keyboard shortcuts for SRS ratings (1-4 keys)
2. Show SRS statistics in user profile
3. Add bulk SRS operations
4. Implement SRS review reminders
5. Add SRS progress visualization
