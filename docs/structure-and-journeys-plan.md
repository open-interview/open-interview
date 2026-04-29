# Structure & User Journeys — Fix Plan

> Focused on: information architecture, routing, navigation, and the 6 core user journeys.
> Design system and code quality issues are out of scope here.

---

## Current State Problems

### Navigation has an identity crisis

The bottom nav has 4 items: **Home, Learn, Practice, Profile**.  
"Practice" points directly to `/voice-interview` — skipping all other practice modes (tests, coding, review, flashcards).  
"Learn" points to `/channels` — but certifications and learning paths are also "Learn" and live elsewhere.  
"Profile" is a nav tab but also a sidebar item — it appears twice.

### Routes are duplicated and inconsistent

```
/coding        ──┐
/code          ──┴──→  CodeChallengesIndex   (same page)

/voice-interview  ──┐
/training         ──┴──→  VoicePractice      (same page)

/learning-paths  ──┐
/my-path         ──┴──→  UnifiedLearningPaths (same page)
```

### Progress is scattered across 4 disconnected pages

`/stats` → `/badges` → `/history` → `/profile` — no cross-linking, no unified view.

### 10+ zombie pages exist in the codebase

Unrouted files that still get compiled and confuse contributors.

---

## Target Information Architecture

```
/                    Home
├── /channels        Browse topics (Learn)
│   └── /channel/:id/:index   Question viewer
├── /certifications  Cert prep (Learn)
│   └── /certification/:id    Practice
│       └── /certification/:id/exam   Exam
├── /learning-paths  Structured paths (Learn)
│   └── /learning-paths/:pathId
├── /practice        Practice hub  ← NEW
│   ├── /voice-interview   Voice practice
│   │   └── /voice-session   Full mock interview
│   ├── /tests             Quick tests
│   │   └── /test/:channelId
│   ├── /coding            Code challenges
│   │   └── /coding/:id
│   ├── /review            SRS review
│   └── /flashcards        Flashcards
├── /progress        Unified progress  ← NEW (replaces /stats, /badges, /history)
│   └── tabs: Overview · Badges · History
├── /profile         Settings & account
├── /blog            Blog
└── /about           About
```

---

## Navigation Changes

### Bottom Nav (mobile, <600px)

| Current | Target |
|---|---|
| Home → `/` | Home → `/` ✓ |
| Learn → `/channels` | Learn → `/channels` ✓ |
| Practice → `/voice-interview` | Practice → `/practice` ← fix |
| Profile → `/profile` | Profile → `/profile` ✓ |

### Sidebar sections (desktop)

| Current | Target |
|---|---|
| Learn: Channels, Certifications, My Path | Learn: Channels, Certifications, Learning Paths |
| Practice: Voice, Tests, Coding, Review, Flashcards | Practice: **Practice Hub**, then Voice/Tests/Coding/Review/Flashcards |
| Progress: Badges, Bookmarks, Profile, Subscriptions, About | Progress: **Progress** (unified), Bookmarks, Subscriptions |
| (no section) | Profile: Profile, About |

### Active state fix

Currently `/channel/aws/q-123` does not highlight any nav item.  
`getActiveSection()` in `UnifiedNav.tsx` needs to match `/channel/*` → `learn` section.

```ts
// UnifiedNav.tsx — getActiveSection additions
if (location.startsWith('/channel/'))        return 'learn';
if (location.startsWith('/certification/'))  return 'learn';
if (location.startsWith('/learning-paths/')) return 'learn';
if (location.startsWith('/test/'))           return 'practice';
if (location.startsWith('/coding/'))         return 'practice';
if (location.startsWith('/challenge/'))      return 'practice';
if (location.startsWith('/voice-session'))   return 'practice';
```

---

## Route Changes

### Remove duplicate routes (App.tsx)

```tsx
// DELETE these — they're aliases that create confusion
<Route path="/code" .../>                    // keep /coding
<Route path="/training" .../>                // keep /voice-interview  
<Route path="/my-path" .../>                 // keep /learning-paths
<Route path="/extreme/channel/:id" .../>     // assess if used; likely delete
```

### Add new routes

```tsx
<Route path="/practice" component={PracticeHub} />
<Route path="/progress" component={Progress} />
// /progress replaces /stats, /badges, /history (keep as redirects)
```

### Redirects to preserve deep links

```tsx
<Route path="/stats">{() => { setLocation('/progress'); return null; }}</Route>
<Route path="/badges">{() => { setLocation('/progress?tab=badges'); return null; }}</Route>
<Route path="/history">{() => { setLocation('/progress?tab=history'); return null; }}</Route>
<Route path="/code">{() => { setLocation('/coding'); return null; }}</Route>
<Route path="/training">{() => { setLocation('/voice-interview'); return null; }}</Route>
```

---

## New Pages to Build

### `/practice` — Practice Hub

Single entry point for all practice modes. The "Practice" nav tab lands here.

**Layout:** Page header + 5 mode cards in a 2-col grid (mobile: 1-col).

Each card shows:
- Mode name + icon
- One-line description
- Estimated session time
- XP reward
- Last session date (from localStorage)
- CTA button

```
┌─────────────────────────────────────────┐
│  Practice                               │
│  Choose how you want to practice today  │
├──────────────────┬──────────────────────┤
│ 🎤 Voice         │ ✅ Quick Tests        │
│ Mock interview   │ Timed topic tests    │
│ ~20 min · +50XP  │ ~10 min · +20XP     │
│ Last: yesterday  │ Last: 3 days ago    │
├──────────────────┼──────────────────────┤
│ 💻 Code          │ 🔁 SRS Review        │
│ Coding challenges│ Spaced repetition   │
│ ~30 min · +40XP  │ ~15 min · +30XP     │
│ Last: never      │ 12 cards due        │
├──────────────────┴──────────────────────┤
│ 🃏 Flashcards                           │
│ Quick-fire Q&A · ~5 min · +10XP        │
└─────────────────────────────────────────┘
```

**File:** `client/src/pages/Practice.tsx`

---

### `/progress` — Unified Progress

Replaces `/stats`, `/badges`, `/history` as three tabs in one page.

**Layout:** Page header + MD3 tab bar + tab content.

Tab 1 — **Overview** (current `GoogleStats` content):
- XP bar, level, streak
- Questions answered, sessions completed, voice sessions
- Weekly activity chart
- Top topics

Tab 2 — **Badges** (current `Badges` content):
- Earned badges grid
- Locked badges (greyed out with unlock condition)

Tab 3 — **History** (current `AnswerHistory` content):
- Chronological list of answered questions
- Filter by topic/date

**File:** `client/src/pages/Progress.tsx`

**Delete after migration:** `pages/GoogleStats.tsx`, `pages/Badges.tsx`, `pages/AnswerHistory.tsx`, `pages/StatsRedirect.tsx`  
*(or keep as redirect stubs if external links exist)*

---

## The 6 Core User Journeys

### Journey 1: New User — First Visit

**Current:** Lands on `/` with no guidance. Onboarding is disabled.

**Target flow:**
```
/ → Onboarding modal (google/Onboarding.tsx)
  → Step 1: What's your role? (Frontend / Backend / DevOps / ML / Manager)
  → Step 2: What's your goal? (Cert prep / Job interview / General learning)
  → Step 3: Pick 3 topics to start
  → Dismiss → / (home now shows personalised content)
```

**Changes:**
- Uncomment `{needsOnboarding && <Onboarding />}` in `App.tsx`
- Delete the 3 duplicate onboarding components, keep only `components/google/Onboarding.tsx`
- After onboarding, home page `FeatureCard` grid should reflect chosen role (already wired via `UserPreferencesContext` + `personalization.ts`)

---

### Journey 2: Browse & Study a Topic

**Current:** `/channels` → pick topic → `/channel/:id` → read Q&A → next question  
Works but has no "you are here" feedback and no way back to channels from the question viewer.

**Target flow:**
```
/channels
  → filter by category / search
  → click topic card
  → /channel/:id  (QuestionViewer)
      ← breadcrumb: Channels > AWS Solutions Architect
      → read question
      → reveal answer
      → SRS rating (Again / Hard / Good / Easy)
      → next question  OR  bookmark  OR  voice practice this Q
```

**Changes:**
- Add breadcrumb to `QuestionViewer.tsx`: `Channels > {channelName}`
- Ensure `getActiveSection('/channel/...')` returns `'learn'` so nav highlights correctly
- The SRS rating buttons (`SRSReviewButtons.tsx`) are already built — verify they're wired in `QuestionViewer`

---

### Journey 3: Certification Prep

**Current:** `/certifications` → `/certification/:id` → `/certification/:id/exam`  
This is the most complete journey. Minor gaps only.

**Target flow:**
```
/certifications
  → filter by provider / difficulty
  → click cert card
  → /certification/:id  (CertificationPractice)
      → study questions one by one
      → progress bar shows X/total
      → "Take Exam" CTA when ready
  → /certification/:id/exam  (CertificationExam)
      → timed exam, MCQ format
      → submit → score + pass/fail
      → "Review wrong answers" → back to practice
      → "Share result" → social share
```

**Changes:**
- Add "Review wrong answers" post-exam CTA that filters `CertificationPractice` to only show failed questions
- Ensure breadcrumb: `Certifications > AWS SAA > Exam`
- Ensure `getActiveSection('/certification/...')` returns `'learn'`

---

### Journey 4: Practice (Voice)

**Current:** Broken — 3 pages, 2 design languages, no connected flow.

**Target flow:**
```
/practice → Voice Interview card → /voice-interview (VoicePractice)
  ├── [Training mode]
  │     → question shown with answer visible
  │     → record answer
  │     → word-count + keyword feedback
  │     → next question
  │     → session complete → /progress (voice sessions count updated)
  │
  └── [Mock Interview mode]
        → question shown, answer hidden
        → record answer
        → AI scoring (from voice-interview-session.ts)
        → per-question feedback
        → session complete → results screen (inline)
        → /progress
```

**Changes:**
- Merge `VoiceSession.tsx` session management into `VoicePractice.tsx` as the "interview mode" step
- Delete `VoiceSession.tsx`, `VoiceInterview.tsx`, `TrainingMode.tsx`
- Remove `/training` and `/voice-session` routes (or redirect to `/voice-interview`)
- Results screen stays inline in `VoicePractice` — no separate page needed
- After session complete, show "View Progress" CTA → `/progress`

---

### Journey 5: Daily Return User

**Current:** Home page has `DailyReviewCard` → `/review`. This works.  
But the home page also shows 4 feature cards (Voice, Tests, Coding, Certifications) with no personalisation based on what the user actually uses.

**Target flow:**
```
/ (returning user)
  → streak display (already exists via StreakDisplay component)
  → "Continue where you left off" card (last visited channel/cert)
  → DailyReviewCard (SRS cards due today)
  → Suggested next action based on role preference
```

**Changes:**
- Add "Continue where you left off" card to `HomePage.tsx` — read `lastVisitedChannel` from localStorage (already tracked in `session-tracker.ts`)
- Personalise the 4 feature cards order based on `UserPreferencesContext.role`
- The streak and XP bar are already built — ensure they're visible above the fold on mobile

---

### Journey 6: Track Progress

**Current:** Progress split across `/stats`, `/badges`, `/history`, `/profile` — no cross-linking.

**Target flow:**
```
/progress  (new unified page)
  ├── Tab: Overview
  │     → XP + level + streak
  │     → weekly activity heatmap
  │     → top topics by questions answered
  │     → "Keep going" nudge if streak at risk
  │
  ├── Tab: Badges
  │     → earned badges (with date earned)
  │     → next badge to unlock (progress toward it)
  │
  └── Tab: History
        → chronological Q&A history
        → filter by topic / date range
        → click any entry → /channel/:id/:index
```

**Changes:**
- Build `pages/Progress.tsx` with MD3 tab bar
- Move content from `GoogleStats`, `Badges`, `AnswerHistory` into the three tabs
- Add "next badge" progress indicator to Badges tab
- Add click-through from History entries back to the question
- Redirect `/stats`, `/badges`, `/history` to `/progress?tab=...`

---

## Files to Delete

These are unrouted zombie pages. Deleting them reduces bundle size and contributor confusion.

```
pages/VoiceInterview.tsx          — dead, superseded by VoicePractice
pages/TrainingMode.tsx            — dead, superseded by VoicePractice
pages/HomeRedesigned.tsx          — dead, superseded by HomeGoogle
pages/StatsRedesigned.tsx         — dead, superseded by GoogleStats
pages/AllChannelsRedesigned.tsx   — dead, superseded by AllChannels
pages/AllChannelsMD3.tsx          — dead, superseded by AllChannels
pages/LearningPathsGoogle.tsx     — dead, superseded by UnifiedLearningPaths
pages/QuestionEditorDemo.tsx      — dev demo, not user-facing
pages/ReviewSessionOptimized.tsx  — silent fallback in App.tsx, pick one and delete the other
pages/StatsRedirect.tsx           — 3-line redirect file, inline it in App.tsx
components/Onboarding.tsx         — superseded by components/google/Onboarding.tsx
components/OnboardingFlow.tsx     — superseded by components/google/Onboarding.tsx
components/ProgressiveOnboarding.tsx — superseded by components/google/Onboarding.tsx
```

---

## Files to Create

```
pages/Practice.tsx        — Practice hub (/practice)
pages/Progress.tsx        — Unified progress (/progress)
```

---

## Files to Modify

```
App.tsx
  - Remove duplicate routes (/code, /training, /my-path)
  - Add /practice and /progress routes
  - Add redirects for /stats, /badges, /history
  - Re-enable onboarding

components/layout/UnifiedNav.tsx
  - Change Practice nav item: /voice-interview → /practice
  - Expand getActiveSection() to cover /channel/*, /certification/*, /test/*, /coding/*, /challenge/*

components/layout/Sidebar.tsx
  - Add Practice Hub as first item in Practice section
  - Move Profile/About out of Progress section into their own section

pages/VoicePractice.tsx
  - Absorb VoiceSession session management logic
  - Add results screen (inline)
  - Add "View Progress" CTA after session

pages/QuestionViewer.tsx
  - Add breadcrumb (Channels > channel name)

pages/HomeGoogle.tsx
  - Add "Continue where you left off" card
  - Personalise feature card order by role
```

---

## Implementation Order

```
Week 1
  Day 1-2:  Delete zombie pages + remove duplicate routes (zero risk, immediate cleanup)
  Day 3:    Fix getActiveSection() in UnifiedNav (nav highlights correctly everywhere)
  Day 4-5:  Build /practice hub page + update nav to point there

Week 2
  Day 1-2:  Fix voice path (merge VoiceSession into VoicePractice)
  Day 3-4:  Build /progress unified page
  Day 5:    Re-enable onboarding

Week 3
  Day 1-2:  Add breadcrumbs to QuestionViewer + CertificationPractice
  Day 3:    "Continue where you left off" on home page
  Day 4-5:  Post-exam "review wrong answers" flow for certifications
```

---

*Saved: docs/structure-and-journeys-plan.md*
