# Resume Feature Documentation

## Overview

The Resume feature allows users to continue their learning activities from where they left off. It displays in-progress sessions on the home page, making it easy to jump back into tests, voice interviews, certification exams, or channel practice.

## Features

- **Automatic Session Tracking**: Sessions are automatically saved to localStorage as users progress
- **Visual Progress Indicators**: Each resume tile shows progress percentage and completion status
- **Last Accessed Timestamps**: Shows when the user last worked on each session
- **Quick Resume**: One-click resume functionality to continue from the exact question
- **Abandon Sessions**: Users can remove sessions they no longer want to continue
- **Multi-Activity Support**: Tracks tests, voice interviews, certifications, and channel practice

## Architecture

### Client-Side Components

#### 1. Resume Service (`client/src/lib/resume-service.ts`)
- Aggregates in-progress sessions from localStorage
- Provides utilities for formatting and managing session data
- Scans for session keys: `test-session-*`, `voice-session-state`, `certification-session-*`

#### 2. Resume Section (`client/src/components/home/ResumeSection.tsx`)
- Main container component displayed on the home page
- Loads and displays all in-progress sessions
- Handles resume and abandon actions
- Shows "New" badge to highlight the feature

#### 3. Resume Tile (`client/src/components/home/ResumeTile.tsx`)
- Individual session card component
- Displays session info, progress bar, and action buttons
- Animated with Framer Motion for smooth UX
- Color-coded by activity type

#### 4. Session Tracker (`client/src/lib/session-tracker.ts`)
- Utilities for updating session timestamps
- Helper functions for saving/updating sessions
- Ensures `lastAccessedAt` is always current

### Server-Side Components

#### 1. Database Schema (`shared/schema.ts`)
- `userSessions` table for persistent session storage
- Tracks session type, progress, timestamps, and metadata
- Supports future user authentication

#### 2. API Endpoints (`server/routes.ts`)
- `GET /api/user/sessions` - Get all active sessions
- `GET /api/user/sessions/:sessionId` - Get specific session
- `POST /api/user/sessions` - Create or update session
- `PUT /api/user/sessions/:sessionId` - Update session progress
- `DELETE /api/user/sessions/:sessionId` - Abandon session
- `POST /api/user/sessions/:sessionId/complete` - Mark session complete

## Session Types

### 1. Test Sessions
- **Key Pattern**: `test-session-{channelId}`
- **Data Stored**: Channel info, questions, current index, answers
- **Resume Action**: Navigate to `/test/{channelId}`

### 2. Voice Interview Sessions
- **Key Pattern**: `voice-session-state`
- **Data Stored**: Session topic, questions, current index, answers
- **Resume Action**: Navigate to `/voice-interview`

### 3. Certification Exam Sessions
- **Key Pattern**: `certification-session-{certificationId}`
- **Data Stored**: Certification info, questions, current index, answers
- **Resume Action**: Navigate to `/certification/{certificationId}/exam`

## Usage

### For Users

1. **Start an Activity**: Begin a test, voice interview, or certification exam
2. **Progress Tracking**: Your progress is automatically saved as you answer questions
3. **Leave and Return**: Close the browser or navigate away - your progress is saved
4. **Resume from Home**: Return to the home page to see your in-progress sessions
5. **One-Click Resume**: Click "Resume" to continue from where you left off
6. **Abandon Sessions**: Click the X button to remove sessions you don't want to continue

### For Developers

#### Adding Session Tracking to a New Activity

1. **Save Session State**:
```typescript
import { saveTestSession } from '../lib/session-tracker';

// When starting a session
saveTestSession(
  channelId,
  channelName,
  questions,
  currentQuestionIndex,
  answers
);
```

2. **Update Session Progress**:
```typescript
import { updateTestSession } from '../lib/session-tracker';

// When user answers a question
updateTestSession(
  channelId,
  currentQuestionIndex,
  answers
);
```

3. **Clear Session on Completion**:
```typescript
import { clearSession } from '../lib/session-tracker';

// When session is completed
clearSession(`test-session-${channelId}`);
```

#### Customizing Resume Tiles

Edit `client/src/lib/resume-service.ts` to customize:
- Session detection logic
- Progress calculation
- Color themes
- Icon mapping

## Data Flow

```
User starts activity
    ↓
Session state saved to localStorage
    ↓
User progresses through questions
    ↓
Session state updated with lastAccessedAt
    ↓
User leaves activity
    ↓
User returns to home page
    ↓
ResumeSection loads sessions from localStorage
    ↓
Resume tiles displayed with progress
    ↓
User clicks "Resume"
    ↓
Navigate to activity page
    ↓
Activity loads session state from localStorage
    ↓
User continues from last question
```

## Future Enhancements

### Phase 1 (Current)
- ✅ Client-side session tracking
- ✅ Resume tiles on home page
- ✅ Basic session management

### Phase 2 (Planned)
- [ ] Server-side session persistence
- [ ] Cross-device session sync
- [ ] Session expiration (auto-delete after 30 days)
- [ ] Session analytics and insights

### Phase 3 (Future)
- [ ] Session recommendations based on activity
- [ ] Smart session prioritization
- [ ] Session sharing and collaboration
- [ ] Session templates and presets

## Testing

### Manual Testing Checklist

- [ ] Start a test session and verify it appears on home page
- [ ] Start a voice interview and verify it appears on home page
- [ ] Start a certification exam and verify it appears on home page
- [ ] Resume a session and verify it continues from the correct question
- [ ] Abandon a session and verify it's removed from the list
- [ ] Complete a session and verify it's removed from the list
- [ ] Verify progress bars show correct percentages
- [ ] Verify last accessed timestamps are accurate
- [ ] Verify sessions are sorted by most recent first
- [ ] Test with multiple concurrent sessions

### Automated Testing

Add E2E tests in `e2e/resume-feature.spec.ts`:
```typescript
test('should display in-progress test session on home page', async ({ page }) => {
  // Start a test
  await page.goto('/test/aws');
  await page.click('[data-testid="start-test"]');
  
  // Answer first question
  await page.click('[data-testid="option-0"]');
  
  // Go to home page
  await page.goto('/');
  
  // Verify resume tile appears
  await expect(page.locator('[data-testid="resume-tile"]')).toBeVisible();
  await expect(page.locator('text=AWS Test')).toBeVisible();
});
```

## Troubleshooting

### Sessions Not Appearing

1. Check browser localStorage:
   - Open DevTools → Application → Local Storage
   - Look for keys: `test-session-*`, `voice-session-state`, `certification-session-*`

2. Verify session data structure:
   - Sessions must have `currentQuestionIndex` and `questions` array
   - `currentQuestionIndex` must be less than `questions.length`

3. Check console for errors:
   - Look for "Error parsing test session" or similar messages

### Resume Not Working

1. Verify navigation paths in `ResumeSection.tsx`
2. Check that session state is properly loaded in activity pages
3. Ensure `lastAccessedAt` is being updated

### Performance Issues

1. Limit number of sessions displayed (currently unlimited)
2. Add pagination for users with many sessions
3. Consider moving to server-side storage for better performance

## API Reference

### `getInProgressSessions(): ResumeSession[]`
Returns all in-progress sessions from localStorage, sorted by most recent.

### `abandonSession(sessionId: string): void`
Removes a session from localStorage.

### `formatRelativeTime(isoString: string): string`
Formats an ISO timestamp as relative time (e.g., "2 hours ago").

### `updateSessionTimestamp(sessionKey: string, additionalData?: Record<string, any>): void`
Updates the `lastAccessedAt` timestamp for a session.

## Contributing

When adding new activity types:

1. Add session tracking in the activity component
2. Update `resume-service.ts` to detect the new session type
3. Add navigation logic in `ResumeSection.tsx`
4. Update this documentation
5. Add E2E tests

## License

Same as the main project.
