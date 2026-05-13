# UI/UX Deep Scan — Fix Plan

> Full audit covering every major page and component. No code changes made yet.

---

## Progress Tracker

| Metric | Count |
|--------|-------|
| **Total Issues** | 102 |
| ✅ Done | 0 |
| 🔄 In Progress | 0 |
| ⏸️ Blocked | 0 |
| ⏳ Remaining | 102 |

### By Severity
| Severity | Done | Remaining |
|----------|------|-----------|
| Critical (22) | 0 | 22 |
| High (22) | 0 | 22 |
| Medium (39) | 0 | 39 |
| Minor (19) | 0 | 19 |

---

## Critical Issues (Break the Experience)

### C1 — Duplicate Onboarding Flow

**What's happening:** There are two completely separate onboarding systems running simultaneously.

1. `SubscriptionGate` renders `OnboardingFlow` — a full-screen 3-step blocking modal (Role → Topics → Certs) that covers the entire home page on first visit.
2. `ProgressiveOnboarding` is mounted unconditionally in `AppContent` and fires independently after 15 seconds or 200px of scroll — asking the same Role + Topics questions.

A brand-new user sees the full blocking modal first. If they dismiss it without finishing, the progressive widget then pops up mid-browsing and asks the exact same questions again. Even if they do finish the first flow, the progressive widget can still fire because it checks `preferences.role === null` which may not be synced immediately.

**Files:** `App.tsx` (line 226), `components/SubscriptionGate.tsx`, `components/ProgressiveOnboarding.tsx`, `components/OnboardingFlow.tsx`

**Fix:** Pick one system. The `OnboardingFlow` (blocking modal) is the better experience since it's deliberate and polished. Delete `ProgressiveOnboarding` entirely and remove it from `App.tsx`. If a lighter nudge is desired for users who Skip, use a single dismissible banner — not a second full onboarding widget.

---

### C2 — `/review` Page is Completely Broken (Infinite Spinner)

**What's happening:** Navigating to `/review` shows a loading spinner that never resolves. The page is stuck in a loading state permanently.

**Files:** `pages/ReviewSession.tsx` (or `pages/ReviewSessionOptimized.tsx`) — the route uses `.catch()` fallback suggesting the primary import already fails.

```ts
const ReviewSession = React.lazy(() =>
  import("@/pages/ReviewSession").catch(() => import("@/pages/ReviewSessionOptimized"))
);
```

**Fix:** Debug why the primary `ReviewSession` import fails. The catch fallback should also display an error state, not silently hang. SRS Review is a core feature — it must not be silently broken.

---

### C3 — Nested `<a>` Inside `<a>` React Error in Documentation

**What's happening:** The Documentation page produces a React hydration error: `<a> cannot be a descendant of <a>`. The culprit is using `<Link href="/"><a className="...">` — Wouter's `Link` already renders an `<a>` tag, wrapping another `<a>` inside it creates invalid HTML and triggers a console error on every page visit to `/docs`.

**File:** `pages/Documentation.tsx` lines 52-53 and 77-78

**Fix:** Remove the inner `<a>` element. Wouter's `<Link>` should be used without a child `<a>`. Apply the className directly to `<Link>`.

---

### C4 — `/questions` Route Does Not Exist (404)

**What's happening:** Visiting `/questions` (a natural URL any user might try) shows the 404 page. There is no `/questions` route registered in the router. Questions are only accessible via `/channel/:id` which is not obvious.

**Fix:** Add a redirect from `/questions` to `/channels`, or register `/questions` as an alias for the channels listing page.

---

## Major Issues (Hurt Usability Significantly)

### M1 — "Documentation" Page Is Internal Developer Content Shown to Users

**What's happening:** The `/docs` page contains deeply technical developer documentation:
- Architecture Overview with system diagrams
- AI Pipeline (LangGraph, bot pipeline details)
- Database & Storage schema internals
- Frontend Patterns (component architecture)
- Illustration System
- API Reference (raw endpoints)
- Deployment guides

This is content for the project's contributors, not for people preparing for job interviews. Exposing it to users creates confusion, erodes trust (users wonder why they're seeing backend architecture diagrams), and clutters the sidebar.

Additionally, the docs page header says **"Reel-LearnHub"** — an old internal project name that has nothing to do with "Open Interview".

**Fix:** Either (a) move `/docs` behind an admin-only route (`/admin/docs`) and remove it from the sidebar entirely, or (b) replace the documentation page with genuine user-facing help content (how to use channels, how SRS works, how certifications work, keyboard shortcuts, etc.).

---

### M2 — "Bot Activity" and "Events Log" Are Admin Tools in the Main Sidebar

**What's happening:** Both `Bot Activity` (`/bot-activity`) and `Events Log` (`/events`) are visible in the sidebar to all users. Bot Activity shows internal bot pipeline metrics ("Creator Bot", "Verifier Bot", "Processor Bot", "3-Bot Pipeline", work queues, audit ledgers). Events Dashboard shows "automated jobs, deploy, LinkedIn posts".

These are maintenance/operations dashboards for the developer — they have no value to a user prepping for a job interview.

**Files:** Sidebar component (whichever file renders the "Bot Activity" and "Events Log" nav items)

**Fix:** Move both to an `/admin/*` section that is either completely hidden from the sidebar or only shown when a developer flag is set (e.g., `?admin=true` in localStorage or a specific env var). Do not remove the pages — just hide them from regular navigation.

---

### M3 — Brand Identity Crisis on the About Page

**What's happening:** The `/about` page (`About.tsx`) renders a full-screen hero with `> Code_Reels` in large terminal-style text and a scrolling matrix/code-rain background. "Code Reels" is the old internal name for this project. The entire rest of the app calls itself **"Open Interview"**. The About page's hero section, document title, and copy still use the old name.

Additional issues on this page:
- Stats show "0 Questions" — the animated counter appears to fail to load question data.
- "Open Terminal" button — presents a terminal emulation which is a novelty feature that adds complexity and confusion to a straightforward About page.
- The page is 825 lines long with extremely heavy animation (matrix animation, multiple framer-motion sequences) making it slow to render.

**Fix:** Update all "Code Reels" / "Code_Reels" references to "Open Interview". Fix the Questions stat to load correctly. Consider simplifying the About page significantly — a clean, informative About page outperforms a flashy one.

---

### M4 — Duplicate Routes for the Same Feature

**What's happening:** Several routes point to the exact same component with no differentiation:

| Route A | Route B | Same Component |
|---------|---------|---------------|
| `/my-path` | `/learning-paths` | `UnifiedLearningPaths` |
| `/voice-interview` | `/training` | `VoicePractice` |
| `/coding` | `/code` | Different components but same concept (two coding challenge systems) |

Having `/my-path` and `/learning-paths` be identical pages means users who bookmark one URL and share the other get inconsistent experiences. The `/training` alias for voice interview is also confusing — "Training" sounds like it could mean anything.

**Fix:**
- Pick one canonical URL for each feature and redirect the other.
- Decide between `/code` (ChallengeHome) and `/coding` (CodingChallenge) — they appear to be two different implementations of the same feature. Consolidate to one.
- Remove `/training` alias; keep only `/voice-interview`.

---

### M5 — Voice Interview Empty State Is Unhelpful

**What's happening:** Visiting `/voice-interview` when no channels are subscribed shows:

> "No Questions Available — Subscribe to channels to access voice practice questions"

But the concept of "subscribing to channels" is jargon that the user may not understand yet, especially if they just arrived. The empty state gives three bullet points that reference "channels" without a clear path. The "Browse Channels" CTA button sends them away from Voice Interview entirely with no way to return.

**Fix:** Rewrite the empty state to be more actionable: "Pick a topic to practice" → link directly to the channels relevant to voice practice (AWS, System Design, Behavioral) with one-click subscribe-and-start. Keep the user in context.

---

### M6 — Blog Is a Completely Different App With No Visual Continuity

**What's happening:** The `/blog` route opens a standalone blog that was designed entirely independently:
- Different navigation (top bar only, no sidebar)
- Different color palette and typography
- Light/dark mode toggle that is independent from the app's theme
- Shows "9 Published Articles" in stats but the `blog-data.json` has 121+ posts

Going from any page in the app to `/blog` feels like leaving the product entirely. There is no "Back to App" button that's prominent, and the blog header has its own logo treatment distinct from the main app.

**Fix:** Either (a) visually align the blog with the main app (use the same sidebar layout, same header), or (b) acknowledge it's a separate site and make the transition deliberate with a proper external link treatment. Fix the article count stat — it's showing 9 when 121+ are loaded.

---

## Moderate Issues (Friction and Polish)

### P1 — "Home" Sidebar Item Is Always Highlighted

**What's happening:** The "Home" nav item in the sidebar appears active/highlighted on every page, not just on `/`. This is because the `Home` route marker is not being checked against `useLocation()` correctly — or the home item has special treatment that always shows it as selected.

**Fix:** Ensure the sidebar active state correctly reflects the current route. Home should only be highlighted when `location === "/"`.

---

### P2 — Stale "NEW" Badges on Sidebar Items

**What's happening:** "My Path", "Code Challenges", and "Flashcards" all have hardcoded `NEW` badges in the sidebar. These badges were presumably added when these features launched, but they are hardcoded and will show forever. A feature that has existed for months is not "new".

**Fix:** Either remove the NEW badges entirely, or drive them from a config with a `newUntil` date so they expire automatically (e.g., `newUntil: '2025-09-01'`).

---

### P3 — Level/Credits Widget Clutters the Bottom of Sidebar

**What's happening:** The bottom of the sidebar has two stacked widgets — a "Level 2 / 700 XP" progress bar, and a "Credits 700" orange widget. Both appear as large solid blocks that visually compete with the navigation items above them. They take up roughly 20% of the sidebar height and push "Bot Activity" and "Settings" below the fold.

**Fix:** Collapse these into a single compact row or relocate them to a user profile dropdown/avatar at the top of the sidebar. They should be secondary information, not competing visual blocks.

---

### P4 — Settings Link Leads Nowhere

**What's happening:** The sidebar has a "Settings" nav item but there is no `/settings` route registered in `App.tsx`. Clicking it likely goes to the 404 page.

**Fix:** Either register a Settings page (even a simple one with theme toggle, data export, reset progress), or remove the Settings link from the sidebar until the page exists.

---

### P5 — Channels Page Skeleton Loading Is Too Long

**What's happening:** The Channels page (`/channels`) shows skeleton card loaders for several seconds even on repeat visits. The channel data is static (sourced from a config file, not a slow API). There's no reason for skeleton loaders — the data is synchronous.

**Fix:** Render channels immediately without skeleton loaders since the data is imported from `channels-config.ts` synchronously. Remove the artificial loading delay.

---

### P6 — Inconsistent Page Headers Across the App

**What's happening:** Every page uses a completely different header/hero pattern:

- **Channels, Certifications, Badges, Tests:** Large centered gradient title with subtitle
- **Code Challenges:** Large centered title + subtitle + 2-column promo cards
- **Voice Practice:** Large centered title + subtitle but then jumps straight to empty state
- **Documentation:** Completely separate fixed top header with logo, search bar, keyboard shortcut, and "Back to App" button — feels like a different product
- **Blog:** Its own standalone top navigation bar
- **About:** Full-screen matrix animation hero
- **Flashcards:** No header at all — immediately shows card navigation

There is no visual consistency to how pages are introduced.

**Fix:** Create and adopt a unified `<PageHeader>` pattern: icon + title + subtitle + optional action button. Apply it consistently to all feature pages. Special cases (Blog, About) can have custom heroes but should still feel part of the same design system.

---

### P7 — The Home Landing Page Has a Second Navbar

**What's happening:** When users land on `/` for the first time (after dismissing/completing onboarding), they see `home-facelift.tsx` which renders its own top navigation bar (`LandingNavbar`) with "Features", "Topics", "Articles", "Community", "Blog", and "Get Started" links. This navbar is completely separate from the sidebar that all other pages use.

A user who clicks "Get Started" → goes to `/channels` → sees the sidebar. Then if they go back to `/` they're back to the marketing landing page with a different nav. The experience is inconsistent — home is a public marketing page, but everything else is an app.

**Fix:** Decide on an architecture: either (a) the home page is a marketing landing page (then it should not share the app sidebar) or (b) the home page is a dashboard (then it should use the same layout as all other pages). Currently it's trying to be both and succeeding at neither.

---

### P8 — "Code. Learn. Level Up." / "Ace Your Next Tech Interview" Messaging Conflict

**What's happening:** The product has at least three different taglines appearing in different places:
- OnboardingFlow: "Ace your next tech interview."
- home-facelift.tsx: "Master engineering interviews with AI"
- About page: "Level up" + `> Code_Reels`
- Code Challenges page: "Code. Learn. Level Up."

No single clear value proposition is consistently communicated.

**Fix:** Define one primary tagline and one secondary tagline. Apply them consistently: use the primary in the hero/onboarding, secondary in section headers. Remove or align all other variants.

---

### P9 — Bot Activity Page Has No Access Control Warning

**What's happening:** `/bot-activity` is a sensitive operations page showing bot pipeline internals. It's publicly accessible to any visitor with the URL — there is no authentication or admin check.

**Fix:** Add a simple check: if not in an admin context (environment variable, localStorage flag, or URL parameter), redirect to home with a toast message. This doesn't need full auth, just a basic guard.

---

## Minor Issues (Polish and Details)

### D1 — 404 Console Error on Every Page

Every page load shows a 404 error in the browser console for an unresolved resource. This is likely a missing favicon, manifest file, or service worker asset. While it doesn't break functionality, it generates noise in the console and can concern developers.

**Fix:** Identify the 404'd resource (likely `/favicon.ico` or a missing public asset) and either add the file or remove the reference.

---

### D2 — "Voice Interview +10" Badge Logic

The "+10" badge next to "Voice Interview" in the sidebar presumably means 10 new questions are available. But it appears on fresh installs where no channels are subscribed, making the count meaningless. The empty state on the page itself says "No Questions Available".

**Fix:** Only show the badge count if the user has subscribed channels with voice-ready questions. Hide the badge entirely if the count is irrelevant.

---

### D3 — My Path / Learning Paths Default Tab Is "My Custom" (Always Empty)

When navigating to `/my-path`, the default active tab is "My Custom" which immediately shows an empty state ("No custom paths yet"). The useful content (107 Curated paths) is on the "Curated" tab.

**Fix:** Default the active tab to "All Paths" or "Curated" so the user lands on content rather than an empty state.

---

### D4 — Documentation Search Bar Does Nothing

The Documentation page header has a `<input>` search bar with a `⌘K` keyboard shortcut indicator, but typing in it only updates local `searchQuery` state — there is no filtering logic connected to it. The search is a visual affordance with no functionality.

**Fix:** Either wire up the search to filter documentation sections/content, or remove the search input until it's functional. A non-functional UI element is worse than no element.

---

### D5 — "Reel-LearnHub" Branding in Documentation Header

The documentation page subtitle reads "Reel-LearnHub" — this is yet another old internal name for the project. This should be updated to "Open Interview" for brand consistency.

**File:** `pages/Documentation.tsx` line 59

---

### D6 — Channels Page Filter Pills Have Duplicate Category

The Channels page filter pills include both a "Certifications" pill (among the topic categories) and certification channels mixed into the regular channel grid. The Certifications section already has its own dedicated page (`/certifications`) which does a much better job of grouping cert tracks by provider. Having certifications in both places creates redundancy.

**Fix:** Remove the "Certifications" filter pill from the Channels page and add a prominent "Browse Certification Tracks →" card that links to `/certifications`.

---

### D7 — "Events Log" Sidebar Label Is Ambiguous

The sidebar item "Events Log" is vague — users may think it refers to calendar events, notification history, or something else. It actually shows GitHub Actions runs and automated bot deployments.

**Fix:** Rename to "Bot Monitor" or move to admin section (see M2). If kept visible, at minimum rename to something like "Activity Log" and add a description.

---

### D8 — Onboarding Step 1 Has Redundant Left Panel on Mobile

The `OnboardingFlow` left panel (logo, features list, testimonial carousel) is hidden on mobile (`hidden lg:flex`). On desktop it looks great. But the right panel content (step form) repeats the brand logo at the top on mobile, creating a slightly off-center first impression. The transition between the left panel appearing/disappearing at the lg breakpoint is abrupt.

**Fix:** On mobile, show a compact brand header (logo + app name, no feature list) above the step form rather than jumping straight into "What's your role?".

---

## Summary Table

| ID | Issue | Severity | State | Files Affected |
|----|-------|----------|-------|----------------|
| C1 | Duplicate onboarding (SubscriptionGate + ProgressiveOnboarding) | Critical | ⏳ Pending | `App.tsx`, `SubscriptionGate.tsx`, `ProgressiveOnboarding.tsx` |
| C2 | `/review` page stuck in infinite loading spinner | Critical | ⏳ Pending | `pages/ReviewSession.tsx` |
| C3 | Nested `<a>` inside `<a>` React error in Documentation | Critical | ⏳ Pending | `pages/Documentation.tsx` |
| C4 | `/questions` route returns 404 | Critical | ⏳ Pending | `App.tsx` |
| M1 | Documentation page shows internal developer content to users | Major | ⏳ Pending | `pages/Documentation.tsx`, Sidebar |
| M2 | Bot Activity + Events Log are admin tools in main sidebar | Major | ⏳ Pending | Sidebar component |
| M3 | About page shows "Code_Reels" old brand name | Major | ⏳ Pending | `pages/About.tsx` |
| M4 | Duplicate routes for same features | Major | ⏳ Pending | `App.tsx` |
| M5 | Voice Interview empty state is unhelpful | Major | ⏳ Pending | `pages/VoicePractice.tsx` |
| M6 | Blog has no visual continuity with the main app | Major | ⏳ Pending | `pages/blog/BlogHomePage.tsx` |
| P1 | Home sidebar item always highlighted | Moderate | ⏳ Pending | Sidebar component |
| P2 | Stale hardcoded "NEW" badges | Moderate | ⏳ Pending | Sidebar component |
| P3 | Level/Credits widgets clutter sidebar bottom | Moderate | ⏳ Pending | Sidebar component |
| P4 | Settings link leads to 404 | Moderate | ⏳ Pending | Sidebar component, `App.tsx` |
| P5 | Channels page shows skeleton loaders for synchronous data | Moderate | ⏳ Pending | `pages/AllChannels.tsx` |
| P6 | Inconsistent page header patterns across all pages | Moderate | ⏳ Pending | Multiple page files |
| P7 | Home page has its own separate navbar (layout inconsistency) | Moderate | ⏳ Pending | `pages/home-facelift.tsx` |
| P8 | Multiple conflicting taglines / value propositions | Moderate | ⏳ Pending | Multiple files |
| P9 | Bot Activity has no access control | Moderate | ⏳ Pending | `pages/BotActivity.tsx` |
| D1 | 404 console error on every page load | Minor | ⏳ Pending | Public assets / `index.html` |
| D2 | Voice Interview "+10" badge shows when no channels subscribed | Minor | ⏳ Pending | Sidebar component |
| D3 | My Path defaults to empty "My Custom" tab | Minor | ⏳ Pending | `pages/UnifiedLearningPaths.tsx` |
| D4 | Documentation search bar has no functionality | Minor | ⏳ Pending | `pages/Documentation.tsx` |
| D5 | "Reel-LearnHub" old brand name in Docs header | Minor | ⏳ Pending | `pages/Documentation.tsx` |
| D6 | Certifications duplicated in Channels page filter pills | Minor | ⏳ Pending | `pages/AllChannels.tsx` |
| D7 | "Events Log" sidebar label is ambiguous | Minor | ⏳ Pending | Sidebar component |
| D8 | Onboarding mobile layout has no brand header | Minor | ⏳ Pending | `components/OnboardingFlow.tsx` |
| R1 | `/coding` vs `/code` point to different components | Moderate | ⏳ Pending | `App.tsx` |
| R2 | Full page reload on `/code/challenges` redirect | Minor | ⏳ Pending | `App.tsx` |
| R3 | ExtremeQuestionViewer references non-existent routes | Minor | ⏳ Pending | `components/ExtremeQuestionViewer.tsx` |
| R4 | Unnecessary 1.5s delay on `/stats` redirect | Minor | ⏳ Pending | `App.tsx` |
| S1 | Multiple contexts with overlapping reward state | Major | ⏳ Pending | `context/CreditsContext.tsx`, `context/AchievementContext.tsx` |
| S2 | Silent error swallowing in AllChannels | Moderate | ⏳ Pending | `pages/AllChannels.tsx` |
| S3 | Race condition in useQuestions session seed | Moderate | ⏳ Pending | `hooks/useQuestions.ts` |
| S4 | No loading state for Blog fetches | Minor | ⏳ Pending | `pages/blog/BlogHomePage.tsx` |
| S5 | Duplicate credits state in CreditsContext | Minor | ⏳ Pending | `context/CreditsContext.tsx` |
| S6 | Silent fallback for ReviewSession lazy load | Moderate | ⏳ Pending | `App.tsx` |
| A1 | Input fields without visible labels | High | ⏳ Pending | `pages/MyPath.tsx`, `ManageSubscriptions.tsx`, `Documentation.tsx`, `About.tsx` |
| A2 | Icon-only buttons missing aria-label | High | ⏳ Pending | `pages/Profile.tsx`, `MyPath.tsx`, `Certifications.tsx`, `AllChannels.tsx` |
| A3 | Low-contrast gray text classes | Medium | ⏳ Pending | Throughout codebase |
| A4 | Missing focus-visible styles | Medium | ⏳ Pending | Multiple components |
| A5 | Form validation accessibility gaps | Medium | ⏳ Pending | `components/blog/NewsletterForm.tsx`, `components/ui/form.tsx` |
| A6 | Missing aria-hidden on decorative icons | Low | ⏳ Pending | Multiple components |
| PF1 | No list virtualization on large lists | Moderate | ⏳ Pending | `pages/EventsDashboard.tsx`, `AllChannels.tsx`, `BlogListPage.tsx` |
| PF2 | Heavy framer-motion animations causing lag | Moderate | ⏳ Pending | `pages/About.tsx` (118 files total) |
| PF3 | Missing React.memo on reusable components | Moderate | ⏳ Pending | `Sidebar.tsx`, `QuestionCard.tsx`, channel cards |
| PF4 | Inline arrow functions in JSX props | Minor | ⏳ Pending | `Sidebar.tsx`, `UnifiedNav.tsx`, `MobileHeader.tsx` |
| PF5 | use-level hook runs every second (CRITICAL) | Critical | ⏳ Pending | `hooks/use-level.ts` |
| PF6 | Large monolithic page files | Minor | ⏳ Pending | `VoiceInterview.tsx`, `Documentation.tsx`, `CertificationExam.tsx` |
| PF7 | Missing useMemo for expensive derived data | Minor | ⏳ Pending | Various components |
| PF8 | Missing image optimization | Minor | ⏳ Pending | Blog, article components |

### State Legend

| Symbol | Meaning |
|--------|---------|
| ⏳ Pending | Not yet started |
| 🔄 In Progress | Currently being worked on |
| ✅ Done | Completed and verified |
| ⏸️ Blocked | Waiting on another issue or dependency |
| ⚠️ Partial | Partially complete (document details) |

---

## Recommended Fix Order

**Phase 1 — Fix breakages (1–2 hours)**
- C1: Remove ProgressiveOnboarding, keep OnboardingFlow only
- C2: Fix or replace the broken ReviewSession page
- C3: Fix nested `<a>` in Documentation
- C4: Add `/questions` redirect to `/channels`

**Phase 2 — Remove clutter (1 hour)**
- M1: Move Documentation to admin-only or replace with user help content
- M2: Hide Bot Activity + Events Log from sidebar (move to admin)
- M4: Remove duplicate routes, pick canonical URLs
- P4: Remove or create the Settings page

**Phase 3 — Brand & consistency (2 hours)**
- M3: Replace all "Code_Reels" / "Reel-LearnHub" with "Open Interview"
- P8: Settle on one tagline, apply consistently
- P6: Create unified PageHeader component, apply to all pages

**Phase 4 — Polish (2–3 hours)**
- M5: Rewrite Voice Interview empty state
- P1: Fix sidebar active state
- P2: Remove stale NEW badges
- P3: Compact the Level/Credits sidebar widgets
- P5: Remove skeleton loaders from Channels page (sync data)
- D3: Fix My Path default tab to Curated
- D4: Remove non-functional search bar from Docs
- D7: Rename/hide Events Log
- D1: Fix 404 console error on asset load

**Phase 5 — Swarm-Found Issues (3–4 hours)**
- PF5: Fix use-level hook polling interval (CRITICAL — causes constant re-renders)
- S1: Consolidate reward state across contexts
- A1: Add visible labels to all input fields
- A2: Add aria-label to all icon-only buttons
- R1: Consolidate /coding vs /code routes
- R3: Either implement /extreme/* routes or remove ExtremeQuestionViewer
- PF1: Add list virtualization to large list components
- PF2: Add useReducedMotion() to respect user preferences
- S6: Add error boundary for ReviewSession lazy load failures

---

## Additional Issues Found by Swarm Analysis

> Issues discovered by running parallel agent analysis across routing, state management, accessibility, and performance areas.

---

### Routing & Navigation (4 issues)

#### R1 — `/coding` vs `/code` Point to Completely Different Components

**What's happening:** Two routes with similar names route to completely different components:
- `/coding` → `CodingChallenge` (coding challenge interface)
- `/code` → `ChallengeHome` (different coding platform)

Users bookmarking or sharing either URL will get completely different experiences with no way to understand why the URLs are different.

**File:** `App.tsx` lines 144, 146

**Fix:** Pick one canonical route (`/code` or `/coding`), redirect the other, and consolidate to a single coding feature.

---

#### R2 — Full Page Reload on `/code/challenges` Redirect

**What's happening:** The redirect from `/code/challenges` to `/code` uses `window.location.replace()` which causes a full page reload, while all other routing in the app uses Wouter's SPA navigation.

**File:** `App.tsx` line 147

**Fix:** Use Wouter's `setLocation('/code')` instead of `window.location.replace`.

---

#### R3 — ExtremeQuestionViewer References Non-Existent Routes

**What's happening:** The `ExtremeQuestionViewer` component internally navigates to `/extreme/channel/...` paths, but no `/extreme/*` routes are registered in `App.tsx`. This component appears to be dead code — it's not imported anywhere.

**Files:** `components/ExtremeQuestionViewer.tsx`, `App.tsx`

**Fix:** Either implement the `/extreme/*` routes or remove the component entirely if unused.

---

#### R4 — Unnecessary Delay on `/stats` Redirect

**What's happening:** The `/stats` route renders a temporary page that shows a toast and waits 1.5 seconds before redirecting to `/profile`. This delay is unnecessary.

**File:** `App.tsx` (stats route handler)

**Fix:** Redirect immediately to `/profile` or remove the `/stats` route entirely.

---

### State Management (6 issues)

#### S1 — Multiple Contexts with Overlapping Reward State

**What's happening:** Three separate contexts maintain overlapping reward/credit state that can become desynchronized:
- `CreditsContext`: maintains `balance`, `state.balance`
- `AchievementContext`: also maintains `level`, `totalXP`, `credits`, `streak`
- `rewardState` from some external store

When these get out of sync, users may see inconsistent XP, credits, or level displays.

**Files:** `context/CreditsContext.tsx`, `context/AchievementContext.tsx`

**Fix:** Consolidate to a single source of truth. Have one context own the reward state and others derive from it.

---

#### S2 — Silent Error Swallowing in AllChannels

**What's happening:** The fetch operation in AllChannels silently catches errors with an empty catch block — users get no feedback if channel data fails to load.

**File:** `pages/AllChannels.tsx` lines 402-409

```tsx
fetch('/data/channels.json')
  .then(r => r.json())
  .then(...)
  .catch(() => {});  // Silent failure
```

**Fix:** Show a user-friendly error message or retry option when the fetch fails.

---

#### S3 — Race Condition in useQuestions Session Seed

**What's happening:** The `sessionSeed` in `useQuestions` depends on `channelId`. Rapid channel switching could cause inconsistent behavior since the seed changes but data may not be ready.

**File:** `hooks/useQuestions.ts` line 65

**Fix:** Add proper cleanup and debounce the seed calculation, or ensure data is ready before applying the seed.

---

#### S4 — No Loading State for Blog Fetches

**What's happening:** Multiple fetches in `BlogHomePage` lack explicit loading states to display to users while data loads.

**File:** `pages/blog/BlogHomePage.tsx` line 77

**Fix:** Add loading skeletons or spinners during blog data fetches.

---

#### S5 — Duplicate Credits State in CreditsContext

**What's happening:** The context maintains THREE values for the same data:
- `balance` (useState)
- `state.balance` (CreditsState object)
- Synced with `rewardState`

This creates multiple sources of truth for the same information, making debugging difficult.

**File:** `context/CreditsContext.tsx` lines 60-117

**Fix:** Use a single source of truth. Remove redundant state variables.

---

#### S6 — Silent Fallback for ReviewSession Lazy Load

**What's happening:** The ReviewSession lazy load fallback catches errors silently — if both primary and fallback imports fail, users see an infinite spinner with no error message.

**File:** `App.tsx` line 28

```tsx
const ReviewSession = React.lazy(() => 
  import("@/pages/ReviewSession").catch(() => import("@/pages/ReviewSessionOptimized"))
);
```

**Fix:** Add an error boundary that shows a helpful error message when both imports fail.

---

### Accessibility (6 issues)

#### A1 — Input Fields Without Visible Labels

**What's happening:** Multiple input fields rely only on `placeholder` text without visible `<label>` elements, violating WCAG 2.1 SC 1.3.1. Placeholders disappear on focus and are not reliable for accessibility.

**Files & Locations:**
| File | Line | Field |
|------|------|-------|
| `pages/MyPath.tsx` | 334 | Path name input |
| `pages/MyPath.tsx` | 348 | Search input |
| `pages/ManageSubscriptions.tsx` | 77 | Search input |
| `pages/Documentation.tsx` | 68 | Search input |
| `pages/About.tsx` | 427 | Terminal command input |

**Fix:** Add visible `<label>` elements for each input field.

---

#### A2 — Icon-Only Buttons Missing `aria-label`

**What's happening:** Many buttons contain only icons with no accessible name. Screen readers cannot announce what these buttons do.

**Files & Locations:**
| File | Lines | Buttons |
|------|-------|---------|
| `pages/Profile.tsx` | 187, 188 | Check/X icons |
| `pages/MyPath.tsx` | 560, 563 | Edit/Delete path (uses `title` only — not reliable) |
| `pages/Certifications.tsx` | 118 | Modal close |
| `pages/AllChannels.tsx` | 246, 310 | Expand/close |
| `components/SearchModal.tsx` | 340, 455 | Clear search |
| `components/OnboardingFlow.tsx` | 258, 448 | Back/Skip |

**Fix:** Add `aria-label` to all icon-only buttons.

---

#### A3 — Low-Contrast Gray Text Classes

**What's happening:** The codebase uses `text-gray-400`, `text-gray-500`, and `text-muted-foreground` extensively, which may fail WCAG AA contrast requirements (4.5:1 for normal text).

**Files:** Appears 1075+ times throughout the codebase with `text-muted-foreground`

**Fix:** Test both dark and light themes with a contrast checker. Upgrade to higher-contrast color classes where needed.

---

#### A4 — Missing `focus-visible` Styles

**What's happening:** Some interactive elements rely on default browser focus or use `focus:outline-none` without providing alternative visible focus indicators.

**Files:** Search bar inputs, modal close buttons, About page terminal

**Fix:** Add `focus-visible` styles with visible outline or ring.

---

#### A5 — Form Validation Accessibility Gaps

**What's happening:** Form error messages may not be connected to inputs via `aria-describedby`. Some inputs lack `aria-invalid` states when validation fails. Error messages should use `role="alert"` or `aria-live` for screen reader announcements.

**Files:** `components/blog/NewsletterForm.tsx`, `components/ui/form.tsx`

**Fix:** Connect error messages to inputs with proper ARIA attributes.

---

#### A6 — Missing `aria-hidden` on Decorative Icons

**What's happening:** Some decorative icons within interactive components should be marked `aria-hidden="true"` to reduce screen reader noise.

**Fix:** Add `aria-hidden={true}` to decorative icons that are not meaningful on their own.

---

### Performance (8 issues)

#### P1 — No List Virtualization (Large Lists Without Optimization)

**What's happening:** Multiple pages render large arrays without virtualization, causing performance issues when displaying many items.

- **EventsDashboard** (line 604): manually slices to 25 items but loads all data into memory
- **AllChannels**: renders all channels without windowing
- **BlogListPage**: renders potentially 100+ articles without virtualization
- **UnifiedLearningPaths**: path list can grow large

**Fix:** Install and use `@tanstack/react-virtual` or `react-window` to virtualize long lists.

---

#### P2 — Heavy Framer-Motion Animations Causing Lag

**What's happening:** 118 files use framer-motion. The About page (824 lines) has especially heavy animations:
- Matrix/code-rain animation running on continuous `setInterval` (lines 130, 185)
- Multiple `motion.div` elements with complex variants
- Animated counter using `useMotionValue` and `useTransform` (lines 20-32)
- Terminal typing effect with nested intervals (lines 35-66)
- Floating icons with staggered animations

**Fix:**
1. Add device capability detection and reduce animations on low-end devices
2. Use `useReducedMotion()` hook to respect user preferences
3. Consider simplifying About page animations

---

#### P3 — Missing React.memo on Reusable Components

**What's happening:** No components use `React.memo` to prevent unnecessary re-renders. This is especially impactful for:
- **Sidebar NavItemEl** — re-renders on every location change
- **QuestionCard** — re-renders when parent state changes even if props unchanged
- **Channel cards** — re-render on any parent state change
- **List items** in EventsDashboard, BlogList, LearningPaths

**Fix:** Wrap frequently re-rendered components with `React.memo()`:
```tsx
const NavItemEl = React.memo(function NavItemEl({ item }) { ... });
```

---

#### P4 — Inline Arrow Functions in JSX Props

**What's happening:** Multiple components pass inline arrow functions as onClick handlers, creating new function references on every render:

- **Sidebar.tsx** (lines 106, 188, 255, 277, 286, 306, 313)
- **UnifiedNav.tsx** (lines 118, 143, 160, 212)
- **MobileHeader.tsx** (lines 89, 97, 120)

**Fix:** Wrap handlers in `useCallback` and pass stable references.

---

#### P5 — use-level Hook Runs Every Second (CRITICAL)

**What's happening:** `use-level.ts` (lines 24-40) sets up a `setInterval` that runs every 1000ms to check for level ups:

```tsx
const interval = setInterval(() => {
  const newMetrics = getMetrics();
  setMetrics(newMetrics);
}, 1000);
```

This causes the entire app to re-render every second when the Sidebar (which uses `useCredits` context) is mounted. This is the most impactful performance issue.

**File:** `hooks/use-level.ts` lines 24-40

**Fix:**
1. Increase interval to 5-10 seconds minimum
2. Only poll when there's active XP gain
3. Use event-driven updates instead of polling

---

#### P6 — Large Monolithic Page Files

**What's happening:** Several page files exceed 800 lines without code splitting into smaller components:

| File | Lines |
|------|-------|
| VoiceInterview.tsx | 1457 |
| Documentation.tsx | 1453 |
| CertificationExam.tsx | 1025 |
| ArtStudio.tsx | 924 |
| UnifiedLearningPaths.tsx | 923 |
| About.tsx | 824 |

**Fix:** Split into feature-based subcomponents with their own files.

---

#### P7 — Missing useMemo for Expensive Derived Data

**What's happening:** Some components compute expensive derived data inside render without memoization:
- Multiple `.filter().map()` chains in render
- Date formatting on every render
- Complex object creation in render

**Fix:** Wrap expensive computations in `useMemo` with proper dependencies.

---

#### P8 — Missing Image Optimization

**What's happening:** Blog posts and articles load images without proper optimization:
- No responsive images (`srcset`)
- No lazy loading except via `loading="lazy"` attribute
- No image format optimization (WebP, AVIF)

**Fix:**
1. Add `srcset` for responsive images
2. Consider using `vite-plugin-image-optimizer`
3. Add blur-up placeholder pattern

---

---

# Swarm Analysis — Complete Findings

> Issues discovered by running 6 parallel agent analyses across routing, state management, accessibility, performance, content/data, and brand consistency. Each agent performed deep code reads of critical files.

---

## Swarm Summary

| Analysis Area | Agents Used | Files Read | Critical Issues Found | Total Issues Found |
|--------------|-------------|-----------|---------------------|-------------------|
| Routing & Navigation | 1 | 25+ (App.tsx, Sidebar.tsx, UnifiedNav.tsx, all pages) | 3 | 14 |
| State Management | 1 | 14 (all contexts + critical hooks) | 2 | 14 |
| Accessibility | 1 | 40+ (pages, components, hooks) | 4 | 22 |
| Performance | 1 | 30+ (hooks, components, pages) | 5 | 20 |
| UI/UX & Brand | 1 | 20+ (pages, sidebar, blog) | 3 | 15 |
| Content & Data | 1 | 15+ (data dirs, scripts, configs) | 0 | 8 |
| **Total** | **6 agents** | **144+ files** | **17** | **93** |

---

## SWARM-1: Routing & Navigation (14 issues)

### CRITICAL

#### SR1 — No Authentication on Admin Pages (Security Issue)

**What's happening:** Four "admin" labeled routes are completely unprotected — no authentication, no role check, no guard of any kind:
- `/bot-activity` → Shows bot monitoring dashboard with real-time status, work queue, audit ledger
- `/events` → Shows full activity event feed with GitHub Actions runs and bot deployments
- `/admin/docs` → Internal developer documentation
- `/admin/blog` → Full blog CRUD interface with LinkedIn sharing controls

Any user who knows or guesses the URL can access sensitive operations data.

**Files:** `client/src/pages/BotActivity.tsx`, `client/src/pages/EventsDashboard.tsx`, `client/src/pages/Documentation.tsx`, `client/src/pages/admin/AdminBlogPage.tsx`

**Fix:** Add a lightweight admin guard — check `localStorage.getItem('admin_mode')` or an env flag. Redirect non-admin users to home with a toast. The sidebar should only show admin items when the flag is set.

---

#### SR2 — Mobile Bottom Nav Profile Tab Never Shows as Active

**What's happening:** `getActiveSection()` in `UnifiedNav.tsx` returns `'progress'` when on `/profile`, `/badges`, `/bookmarks`, or `/about`, but the bottom nav tabs are `home`, `learn`, `practice`, `profile` — there is NO tab with `id: 'progress'`. Result: **no bottom nav tab is highlighted when viewing the Profile page**. Badges, Bookmarks, and About have no mobile bottom nav access at all since no tab triggers the progress submenu.

**File:** `client/src/components/mobile/UnifiedNav.tsx` (getActiveSection function, mainNavItems)

**Fix:** Either rename the return value to match the `profile` tab id, or add a `progress` tab to the bottom nav. Consolidate the active section logic with the tab ids.

---

#### SR3 — Duplicate Route Mapping (`/my-path` and `/learning-paths`)

**What's happening:** Both route variables load the exact same file (`UnifiedLearningPaths.tsx`):
```tsx
const LearningPaths = React.lazy(() => import("@/pages/UnifiedLearningPaths"));
const MyPath = React.lazy(() => import("@/pages/UnifiedLearningPaths"));
```
However, `/learning-paths` redirects to `/my-path`, so the `LearningPaths` lazy import is dead code — it's imported but never used as a route component.

**File:** `client/src/App.tsx` lines 36-37

**Fix:** Remove the `LearningPaths` lazy import entirely. Keep only the redirect from `/learning-paths` to `/my-path`.

---

### HIGH

#### SR4 — VoiceInterview.tsx Is Completely Orphaned (1457 Lines of Dead Code)

**What's happening:** There is a **1457-line** `VoiceInterview.tsx` page file that is never imported by any route. The actual `/voice-interview` route uses `VoicePractice.tsx`. This is either dead code or a migration artifact.

**File:** `client/src/pages/VoiceInterview.tsx` (1457 lines, unused)

**Fix:** Delete the file after confirming the functionality is fully covered by `VoicePractice.tsx`, or rename `VoicePractice.tsx` → `VoiceInterview.tsx` to resolve the confusing duality.

---

#### SR5 — `getActiveSection` in UnifiedNav Checks Non-Existent Routes

**What's happening:** The mobile bottom nav's `getActiveSection()` function checks for:
- `/training` (line 64) — but `/training` redirects to `/voice-interview` (legacy URL)
- `/learning-path/` prefix (line 63) — **no such route exists** in App.tsx
- Does NOT check for `/code` (even though sidebar links to `/code`) — only checks for `/coding`

**File:** `client/src/components/mobile/UnifiedNav.tsx`

**Fix:** Update the path checks to match the actual registered routes. Remove `/training` and `/learning-path/` checks. Add `/code` check.

---

#### SR6 — Inline Render-Props for Blog Routes Break Lazy-Loading Suspense

**What's happening:** Three blog routes use inline render-prop functions instead of the `component` prop:
```tsx
<Route path="/blog/category/:slug">{(params) => <BlogListPage categorySlug={params.slug} />}</Route>
```
This creates new component instances on every render, breaking the parent `<Suspense>` boundary — the lazy-loading fallback will never trigger for these routes.

**File:** `client/src/App.tsx` (blog route definitions)

**Fix:** Use React.lazy with route-specific components or extract the render-props to named component functions.

---

#### SR7 — FaceliftNavbar Brand Mismatch ("DevInsights" vs "Open Interview")

**What's happening:** The landing page navbar (`facelift-navbar.tsx`) displays "DevInsights" branding in its logo/nav header, while the app sidebar displays "Open Interview" and the mobile header shows "Open Interview". This creates brand inconsistency between the landing page and the app.

**File:** `client/src/components/facelift-navbar.tsx` (brand text), `client/src/pages/home-facelift.tsx`

**Fix:** Replace "DevInsights" with "Open Interview" in the landing navbar to match the rest of the app.

---

### MEDIUM

#### SR8 — 6 Orphaned Page Files in `client/src/pages/`

| File | Lines | Status |
|------|-------|--------|
| `VoiceInterview.tsx` | 1,457 | Not imported in App.tsx (replaced by VoicePractice.tsx) |
| `TrainingMode.tsx` | 751 | Not a route; only referenced in `setLocation('/training')` which redirects |
| `CodeChallengesIndex.tsx` | 2 | Just a re-export file, never imported |
| `ChallengeList.tsx` | N/A | Never imported in App.tsx (ChallengeHome has its own listing) |
| `LearningPaths.tsx` | N/A | Different component from UnifiedLearningPaths.tsx — unused |
| `QuestionEditorDemo.tsx` | N/A | Developer demo page, never registered |

**Fix:** Audit each file. Delete dead code or consolidate duplicates. Keep `VoiceInterview.tsx` only if it has unique functionality not in `VoicePractice.tsx`.

---

#### SR9 — `SubscriptionGate.tsx` is a No-Op Pass-Through

**What's happening:** The SubscriptionGate component simply renders `{children}` with zero logic. It appears to be a placeholder for a future subscription/paywall system that was never implemented.

**File:** `client/src/components/SubscriptionGate.tsx`

**Fix:** Either implement the subscription logic or remove the component entirely and unwrap it from `App.tsx` to reduce provider nesting.

---

#### SR10 — Blog Routes Have Redundant Inline Render-Props Instead of Route Component Pattern

**What's happening:** The /blog/category/:slug and /blog/tag/:tag routes use the exact same inner component `BlogListPage` with different props. These should use named route components or URL-parameter-based filtering inside a single route.

**File:** `client/src/App.tsx` blog route section

**Fix:** Merge into a single `<Route path="/blog/:filter/:value">` pattern with client-side dispatch.

---

## SWARM-2: State Management (14 issues)

### CRITICAL

#### SS1 — Triple Source of Truth for Level/XP/Credits/Streak

**What's happening:** Three separate sources maintain overlapping reward state with the same data:

| Data | CreditsContext | AchievementContext | rewardStorage (lib) |
|------|---------------|-------------------|-------------------|
| level | yes (from rewardState) | yes (from rewardState) | yes (source) |
| totalXP | yes | yes | yes (source) |
| credits/balance | yes | yes (as `credits`) | yes (source) |
| streak | yes | yes | yes (source) |

All three read from `rewardStorage.getProgress()` but each maintains independent React state that must update separately. When one updates, the others may show stale data until their own listeners fire.

**Files:** `client/src/context/CreditsContext.tsx`, `client/src/context/AchievementContext.tsx`, `client/src/lib/rewards/storage.ts`

**Fix:** Consolidate to a single source of truth. RewardContext.tsx was written as the unified replacement but is **never mounted** (dead provider). Mount RewardProvider and migrate consumers.

---

#### SS2 — Four Competing Notification Systems

**What's happening:** The app has five notification delivery mechanisms for what could be one:

| Notification Channel | Location | Mechanism |
|---|---|---|
| `NotificationsContext` | `context/NotificationsContext.tsx` | Generic app notifications, localStorage |
| `newlyUnlocked` (legacy) | `AchievementContext` | 5-second auto-dismiss, React state only |
| `pendingAchievements` / `pendingBadges` | `AchievementContext` + `BadgeContext` | Queue consumed by bridge component |
| `rewardStorage` notifications | `lib/rewards/storage.ts` | Notification objects in storage |
| `addBadgeNotification` | `BadgeContext` | Direct localStorage write + CustomEvent |

**Files:** Multiple context and component files

**Fix:** Consolidate to one notification system. `UnifiedNotificationManager` is the designated UI queue. Remove the legacy `newlyUnlocked` auto-dismiss and `addBadgeNotification` localStorage writes. Either merge `NotificationsContext` into the unified system or clearly delineate roles.

---

### HIGH

#### SS3 — Dual Subscription to rewardEngine

**What's happening:** Both `CreditsContext` and `AchievementContext` independently subscribe to `rewardEngine.addListener()`. When any event fires, both re-render, even though the data they store is the same. This doubles the re-render cost for every user action.

**Fix:** Merge into a single context that wraps `rewardEngine` and exposes the data to all consumers.

---

#### SS4 — Dual Event Processing (Legacy + rewardEngine)

**What's happening:** Every user action goes through TWO processing pipelines:
- `AchievementContext.trackEvent()` → processes through legacy `processUserEvent()` AND calls `rewardEngine.processActivity()`
- Credits from achievements are awarded via BOTH `earnCreditsLib()` AND `rewardStorage.addCredits()` (dual write)

When one succeeds and the other fails, the two systems become inconsistent.

**Fix:** Route all events through rewardEngine only. Remove legacy processing paths.

---

#### SS5 — `useLevel` Hook Polls Every 1 Second (Causes Global Re-renders)

**What's happening:** `use-level.ts` sets up a `setInterval` that reads `getMetrics()` and calls `setMetrics()` every 1000ms. This forces a re-render of every component using `useLevel` or depending on its consumers 60 times per minute, for the entire session.

```tsx
const interval = setInterval(() => {
  const newMetrics = getMetrics();
  setMetrics(newMetrics);  // triggers re-render every 1s
}, 1000);
```

**File:** `client/src/hooks/use-level.ts` lines 25-40

**Fix:** Increase interval to 30 seconds minimum, or replace with event-driven approach using `rewardEngine.addListener()`.

---

#### SS6 — Internal State Duplication in CreditsContext

**What's happening:** CreditsContext maintains TWO React state variables for the same data:
- `const [balance, setBalance] = useState(0)` at line 60
- `const [state, setState] = useState<CreditsState>(...)` where `state.balance === balance`

Every update calls both `setBalance(newState.balance)` AND `setState(newState)` — dual state updates that must stay in sync.

**File:** `client/src/context/CreditsContext.tsx` lines 60-67, 99-100, 111-113

**Fix:** Remove `balance` state variable. Use `state.balance` as the single source of truth.

---

#### SS7 — RewardContext (Designated Unified Provider) Is Never Mounted

**What's happening:** `RewardContext.tsx` was written as the unified replacement for CreditsContext + AchievementContext, complete with backward compatibility hooks. However, `RewardProvider` is **never mounted** in `App.tsx`. The backward compatibility hooks `useAchievementContextCompat()` and `useCreditsContextCompat()` at lines 291-401 can never be reached.

**File:** `client/src/context/RewardContext.tsx`

**Fix:** Mount `RewardProvider` in `App.tsx` and begin migrating consumers from legacy contexts to the unified provider.

---

### MEDIUM

#### SS8 — BadgeContext Independently Scans All localStorage on Every Calculation

**What's happening:** BadgeContext iterates `Object.keys(localStorage)` and parses every key starting with `progress-` on every stats change. This is synchronous, blocking, and duplicates progress calculation logic that exists in other contexts.

**File:** `client/src/context/BadgeContext.tsx` lines 118-131

**Fix:** Consume progress data from the reward system instead of independently scanning localStorage.

---

#### SS9 — Silent JSON.parse Failures Across All Contexts

**What's happening:** Every context uses the same pattern for localStorage reads:
```tsx
try { stored ? JSON.parse(stored) : []; } catch { return []; }
```
Corrupted data fails silently — user sees zero progress with no recovery path. No logging, no user feedback.

**Files:** All 8 context files, most hooks with localStorage access

**Fix:** Create a `StorageService` wrapper that logs warnings on corruption. Consider IndexedDB fallback for large state.

---

#### SS10 — Provider Cascade Re-renders (9 Nested Providers)

**What's happening:** App.tsx wraps the app in 9 providers in a specific nesting order. Any state change in an outer provider (e.g., CreditsContext) triggers re-render of all children, including AchievementProvider, UnifiedNotificationProvider, and all page components.

**File:** `client/src/App.tsx` lines 252-271

**Fix:** Reduce to 6 providers by merging Credits, Achievement, and Badge into RewardProvider. Use context splitting to isolate frequently-changing state.

---

#### SS11 — No localStorage Quota Error Handling

**What's happening:** All localStorage writes use silent try/catch:
```tsx
try { localStorage.setItem(key, value); } catch {}
```
When the 5MB quota is exceeded (possible with 30K+ questions of progress data), writes fail silently and all progress is lost without warning.

**Files:** All context files, BadgeContext, use-progress.tsx

**Fix:** Detect `QuotaExceededError`, surface a warning to the user, and provide a data export/clear option.

---

#### SS12 — 1-Second Artificial Delay in BadgeContext Before Calculation

**What's happening:** BadgeContext has a `setTimeout(..., 1000)` before badge calculation:
```tsx
setTimeout(() => { checkUnlocks(); }, 1000);
```
This is a fragile timing assumption that may cause race conditions if other state hasn't settled.

**File:** `client/src/context/BadgeContext.tsx` lines 92-94

**Fix:** Remove the artificial delay. Trigger calculation from an explicit event rather than a timer.

---

## SWARM-3: Accessibility (22 issues)

### CRITICAL

#### SA1 — Input Fields Without Visible Labels (15+ Locations)

**What's happening:** Multiple input fields rely only on `placeholder` text without visible `<label>` elements, violating WCAG 2.1 SC 1.3.1. Placeholders disappear on focus and are not reliable for accessibility.

| File | Line | Input Type |
|------|------|-----------|
| `pages/MyPath.tsx` | 334-338 | Path name modal input |
| `pages/MyPath.tsx` | 348-353 | Search input |
| `pages/ManageSubscriptions.tsx` | 77-83 | Search input |
| `pages/About.tsx` | 427-435 | Terminal command input |
| `pages/AllChannels.tsx` | 651-657 | Progress filter `<select>` |
| `pages/AllChannels.tsx` | 658-663 | Sort filter `<select>` |
| `pages/UnifiedLearningPaths.tsx` | 718-719 | Difficulty filter `<select>` |
| `pages/UnifiedLearningPaths.tsx` | 726-727 | Role filter `<select>` |
| `pages/PersonalizedPath.tsx` | 94-97 | Role selector |
| `pages/PersonalizedPath.tsx` | 137-140 | Company input |
| `pages/QuestionViewer.tsx` | 523-524 | Channel dropdown |
| `pages/AnswerHistory.tsx` | 254-258 | Channel filter |
| `pages/AnswerHistory.tsx` | 269-273 | Sort by |
| `components/ui/page.tsx` | 59-65 | SearchBar (shared component) |
| `components/mobile/MobileChannels.tsx` | 83-87 | Search input |

**Fix:** Add visible `<label>` elements or `aria-label` to all these inputs. Shared `SearchBar` component should accept an `aria-label` prop.

---

#### SA2 — Icon-Only Buttons Missing `aria-label` (17+ Locations)

**What's happening:** Many buttons contain only Lucide icons with no accessible name. Screen readers cannot announce what these buttons do.

| File | Line(s) | Icons | Has Label? |
|------|---------|-------|-----------|
| `MyPath.tsx` | 325-329 | Close modal `<X>` | NO |
| `MyPath.tsx` | 560-563 | Edit `<Edit>`, Delete `<Trash2>` | Only `title` (unreliable) |
| `Certifications.tsx` | 118-120 | Close modal `<X>` | NO |
| `AllChannels.tsx` | 310-312 | Close detail `<X>` | NO |
| `Profile.tsx` | 188-189 | Confirm `<Check>`, Cancel `<X>` | NO |
| `Profile.tsx` | 194-196 | Edit name `<Edit2>` | NO |
| `About.tsx` | 83-86 | Copy code `<Copy>` | NO |
| `SearchModal.tsx` | 314-318 | Close `<X>` | NO |
| `SearchModal.tsx` | 339-342, 455-457 | Clear search `<X>` | NO |
| `ui/page.tsx` | 67-73 | Clear search `<X>` | NO |
| `home-facelift.tsx` | 864-869 | GitHub icon `<Github>` | NO |
| `Documentation.tsx` | 59-64 | Mobile menu `<Menu>` | NO |

**Fix:** Add `aria-label` to all icon-only buttons. Replace `title` attribute usage with proper `aria-label`.

---

#### SA3 — Low-Contrast Text on home-facelift.tsx Fails WCAG AA

**What's happening:** The landing page uses white text with reduced opacity:
- `text-white/30` → ~2.5:1 ratio (FAILS AA)
- `text-white/40` → ~3.5:1 ratio (FAILS AA)
- `text-white/20` → ~2:1 ratio (FAILS AA)
- `text-white/50` → ~4.5:1 ratio (borderline)

**File:** `client/src/pages/home-facelift.tsx` (footer, subtitle, copyright sections)

**Fix:** Increase opacity values: `/40` → `/70`, `/30` → `/60`, `/20` → `/50`. Use proper theme-aware text colors.

---

#### SA4 — No Skip-to-Content Link

**What's happening:** The main app layout (`AppLayout`) has no skip-to-content link. Keyboard users must tab through the entire sidebar (20+ items) and top navigation before reaching the main content. Only the blog layout has a skip link.

**Files:** `client/src/components/layout/AppLayout.tsx`, all main app pages

**Fix:** Add `<a href="#main-content" className="skip-link">` as the first focusable element in AppLayout, and add `id="main-content"` to the main content wrapper.

---

### HIGH

#### SA5 — Missing `focus-visible` Styles on 10+ Elements

**What's happening:** Many custom page-level inputs use `focus:outline-none` without providing `focus-visible:outline-none focus-visible:ring-2` as a replacement. Keyboard users lose all visual focus indication.

| File | Element | Current Focus Style |
|------|---------|-------------------|
| `AllChannels.tsx` | `<select>` filters (x2) | `focus:outline-none` **only** |
| `UnifiedLearningPaths.tsx` | `<select>` (x2), `<input>` (x2) | `focus:outline-none` **only** |
| `About.tsx` | `<input>` terminal | `outline-none` **only** |
| `Flashcards.tsx` | `<textarea>` | `focus:outline-none` **only** |
| `AICompanion.tsx` | `<input>` (x4) | `focus:outline-none focus:border-primary` only |

**Fix:** Replace all `focus:outline-none` patterns with `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary`. The shadcn/ui components already do this correctly — use them as reference.

---

#### SA6 — No `aria-current="page"` on Navigation Items

**What's happening:** Sidebar navigation items, mobile bottom nav items, and Documentation sidebar items do not use `aria-current="page"` to indicate the current page to screen readers.

**Files:** `Sidebar.tsx`, `UnifiedNav.tsx`, `Documentation.tsx`

**Fix:** Add `aria-current={isActive ? 'page' : undefined}` to navigation links.

---

#### SA7 — Collapsible Sections Missing ARIA Attributes

**What's happening:** Collapsible panels (channel filter sections, sidebar submenus, accordions) lack `aria-expanded`, `aria-controls`, and `role="region"` attributes. Screen reader users cannot identify toggleable sections.

**Files:** `AllChannels.tsx` (section headers), `OnboardingFlow.tsx` (step transitions), sidebar submenu items

**Fix:** Add `aria-expanded` to toggle buttons, `aria-controls` pointing to the panel id, and `role="region"` on the panel content.

---

### MEDIUM

#### SA8 — `role="list"` Used with `<button>` Children (Invalid HTML Structure)

**What's happening:** SearchModal.tsx uses `<div role="list">` with `<button>` children instead of `<li>` elements. This creates an invalid ARIA structure.

**File:** `client/src/components/SearchModal.tsx`

**Fix:** Use proper `<ul>`/`<li>` structure, or remove `role="list"` from the container.

---

#### SA9 — Decorative SVG Icons Missing `aria-hidden="true"`

**What's happening:** Many decorative SVG icons (Lucide icons, brand logos, illustration SVGs) are not marked as `aria-hidden="true"`. Screen readers will attempt to describe these visual-only elements.

**Files:** Throughout the codebase

**Fix:** Add `aria-hidden={true}` to all decorative icons. Only meaningful icons within buttons/links need accessible labels.

---

#### SA10 — `useAnnouncer` Hook Exists But Is Not Used for Form Validation

**What's happening:** The excellent `useAnnouncer` hook (creates `role="status"` live region) exists but is not used for form validation error announcements. Most form validation uses `alert()` or nothing.

**File:** `hooks/use-announcer.ts` (exists), but not used in forms

**Fix:** Wire `useAnnouncer` into form validation error handling. Replace `alert()` calls with live region announcements.

---

#### SA11 — SearchBar Shared Component Has No `aria-label` Prop

**What's happening:** The shared SearchBar component (`components/ui/page.tsx`) renders an `<input>` with no `aria-label` and no way to pass one from consumers. All 5+ usages inherit this gap.

**File:** `client/src/components/ui/page.tsx` (SearchBar at lines 59-65)

**Fix:** Add an optional `ariaLabel` prop to the SearchBar component and pass it through to the `<input>`.

---

## SWARM-4: Performance (20 issues)

### CRITICAL

#### SPF1 — `React.memo` is NEVER Used Anywhere (0 Occurrences)

**What's happening:** Despite using `useMemo` 120 times and `useCallback` 289 times, **no component in the app uses `React.memo`**. Every parent re-render cascades through the entire subtree. Key victims:
- `ChannelCard` in AllChannels.tsx — 50+ cards re-render on every filter/sort change
- `NavItemEl` in Sidebar.tsx (defined inside parent, so recreated every render)
- `EventRow` in EventsDashboard.tsx
- `MobileBottomNav` in UnifiedNav.tsx

**Files:** Every component file

**Fix:** Add `React.memo` to frequently-rendered components:
1. Extract `NavItemEl` from `Sidebar.tsx` to top-level and wrap with `React.memo` (high impact)
2. Wrap `ChannelCard` with `React.memo` comparing on `channel.id` and `questionCount` (high impact)
3. Wrap `EventRow`, `StatCard`, `LinkChips` in EventsDashboard.tsx (medium impact)

---

#### SPF2 — `<img>` Tags Missing `loading="lazy"` in ArtStudio

**What's happening:** The ArtStudio page renders AI-generated images without lazy loading, blocking initial paint:
```tsx
<img src={current.url} alt={current.prompt} />  // Line 843 — eager load
<img src={img.url} alt={img.prompt} />           // Line 884 — eager load in history
```

**File:** `client/src/pages/ArtStudio.tsx` lines 843-850, 884

**Fix:** Add `loading="lazy"` to both `<img>` tags.

---

#### SPF3 — No List Virtualization Anywhere in the App

**What's happening:** The app has zero list virtualization. AllChannels.tsx renders 50+ channel cards simultaneously (each with motion.div wrappers and AnimatePresence). EventsDashboard.tsx renders all event rows. On low-end mobile, this causes significant jank.

**Files:** `AllChannels.tsx`, `EventsDashboard.tsx`, `AnswerHistory.tsx`, `BlogListPage.tsx`, `UnifiedLearningPaths.tsx`

**Fix:** Install `@tanstack/react-virtual` and virtualize the AllChannels channel grid when more than 20 items are visible. Add CSS `content-visibility: auto` as a lightweight alternative.

---

#### SPF4 — 172 Timer Instances (setTimeout/setInterval) Across the App

**What's happening:** The app has 172 total `setTimeout`/`setInterval` calls. Key hotspots:
- `About.tsx`: 7+ timer instances (cursor blink at 530ms, canvas loop at 50ms)
- `VoiceInterview.tsx`: 5+ timer instances (unused orphan page)
- `use-performance.ts`: Self-monitoring adds its own timers (FPS at 5s, memory at 5s)
- `useLevel.ts`: 1s poll (the most impactful single timer)

**Fix:** Consolidate timer management. Replace JS-interval cursor blink with CSS animation. Replace canvas loop with `requestAnimationFrame`. Disable performance monitoring in production.

---

#### SPF5 — 118 Framer-Motion Files Without `useReducedMotion` Checks

**What's happening:** 118 files import framer-motion. Only `ReviewSessionOptimized.tsx` checks `useReducedMotion()`. All other animation-heavy components (Sidebar, AllChannels, About, home-facelift) animate unconditionally, causing unnecessary GPU work for motion-sensitive users.

**Fix:** Create a wrapper hook that checks `prefers-reduced-motion` and reduces animation complexity globally. Add `useReducedMotion` to the most impactful components first (AllChannels card animations, sidebar hover effects).

---

### HIGH

#### SPF6 — Inline Arrow Functions in Critical Navigation Components

**What's happening:** Frequent inline handlers create new function references on every render:
- **Sidebar.tsx**: 7 inline `onClick={() => setLocation(...)}` handlers (lines 106, 188, 255, 277, 286, 306, 313)
- **facelift-navbar.tsx**: 11 inline handlers (lines 147, 177, 286, 329, 416)
- **MobileHeader.tsx**: 3 inline handlers (lines 89, 97, 120)

Most follow the pattern `onClick={() => setLocation('/path')}` and can be trivially extracted.

**Fix:** Wrap handlers in `useCallback`. For static path navigation, create a reusable `NavLink` component that accepts a path prop.

---

#### SPF7 — Monolithic Page Files (14 Pages Over 500 Lines)

| File | Lines | Severity |
|------|-------|----------|
| `VoiceInterview.tsx` | 1,457 | Dead code (orphaned) |
| `Documentation.tsx` | 1,435 | Hard to maintain |
| `ArtStudio.tsx` | 1,226 | Hard to maintain |
| `CertificationExam.tsx` | 1,025 | Hard to maintain |
| `UnifiedLearningPaths.tsx` | 923 | Hard to maintain |
| `ReviewSession.tsx` | 919 | + ReviewSessionOptimized at 859 lines |
| `home-facelift.tsx` | 905 | Hard to maintain |
| `EventsDashboard.tsx` | 896 | Hard to maintain |
| `VoiceSession.tsx` | 890 | Hard to maintain |
| `Components`: AICompanion at 2,018 lines, ExtremeQuestionViewer at 1,284 lines | | |

**Fix:** Split into feature-based subcomponents. Prioritize Documentation.tsx (needs content split anyway) and CertificationExam.tsx (complex exam logic).

---

#### SPF8 — `useGlobalStats` Scans All localStorage on Every Refresh

**What's happening:** The `useGlobalStats` hook iterates `Object.keys(localStorage).filter(k => k.startsWith('history-'))` and parses ALL matching values on every stats refresh. For users with 50+ channels of history, this is synchronous JSON parsing that blocks the main thread.

**File:** `client/src/hooks/use-progress.tsx` lines 126-135

**Fix:** Cache the computed stats and only re-scan when a specific event (e.g., `progress-updated`) fires. Use a single aggregated stats key instead of per-channel keys.

---

#### SPF9 — `addEventListener` Cleanup Gaps

**What's happening:** High-frequency event listeners without debouncing:
- `facelift/magnetic-button.tsx:17` — `mousemove` listener fires on every pixel move
- `facelift/animations.tsx:38` — Same pattern
- `PagefindSearch.tsx:89` — `resize` listener without debounce

**Fix:** Add debounce to resize/mousemove listeners (100ms threshold). Use passive listeners where possible.

---

### MEDIUM

#### SPF10 — CSS `height: auto` Transitions via Framer-Motion

**What's happening:** AllChannels uses framer-motion to animate `height: 0` → `height: 'auto'`. This is a known performance anti-pattern because the browser cannot GPU-accelerate height transitions (requires layout recalculation on each frame).

**File:** `client/src/pages/AllChannels.tsx` lines 262-267

**Fix:** Use CSS `grid-template-rows: 0fr / 1fr` transition, or a `max-height` animation instead of the `height: auto` pattern.

---

#### SPF11 — Undefined Variable in Facelift Components

**What's happening:** `facelift-navbar.tsx` references a brand context/import for "DevInsights" that doesn't resolve to an actual value in the app. This causes runtime warnings and inconsistent branding.

**Fix:** Remove the brand context reference. Hardcode "Open Interview" consistently.

---

## SWARM-5: UI/UX & Brand Consistency (15 issues)

### CRITICAL

#### SU1 — Home Page Is a Separate Application (No AppLayout)

**What's happening:** The landing page (`home-facelift.tsx`) is a completely standalone page:
- Background: `bg-[#0a0e1a]` (very dark navy) — different from app's `bg-background`
- Its own `LandingNavbar` (fixed, transparent → blurred on scroll)
- Aurora gradient floating orbs background
- Does NOT use `AppLayout` — no sidebar, no mobile bottom nav
- Its own footer (`LandingFooter`)

When users click "Get Started" → `/channels`, they're transported to a completely different visual world with a sidebar, different background, and different navigation.

**File:** `client/src/pages/home-facelift.tsx`

**Fix:** Decide on architecture: either (a) make home a dashboard page that uses AppLayout with sidebar, or (b) explicitly acknowledge it's a landing page with a deliberate visual transition. Option (b) means keeping it standalone but adding a visual bridge (shared colors, shared logo) so the transition feels intentional.

---

#### SU2 — Blog Is a Separate Website with Its Own Theme System

**What's happening:** The blog operates as a completely separate visual system:
- **Separate layout:** `BlogLayout` vs `AppLayout` — no sidebar, no top AppLayout navbar
- **Separate header:** `BlogHeader` with its own navigation links, search, and theme toggle
- **Separate theme:** Uses `BlogThemeProvider` with its own CSS variables (`--color-ink`, `--color-surface`, `--color-accent`) — completely different from the main app's Tailwind-based theme
- **Separate dark/light toggle:** Toggle is independent from the main app's theme
- **No back-link to app:** Once in blog, there's no way back to the main app except browser back button
- **Leftover git conflict markers** in `BlogListPage.tsx` (lines 126-132): `<<<<<<< Updated upstream`, `=======`, `>>>>>>> Stashed changes`

**Files:** `client/src/pages/blog/BlogLayout.tsx`, `client/src/pages/blog/BlogHomePage.tsx`, `client/src/pages/blog/BlogListPage.tsx`

**Fix:** 
1. Clean up git conflict markers in BlogListPage.tsx
2. Either (a) visually align blog with main app (share sidebar, same theme) or (b) make the transition deliberate with a prominent "Back to App" button
3. Unify the theme system — blog should respect the main app's theme preference
4. Add navigation back to main app from blog pages

---

#### SU3 — 6 Competing Taglines / Value Propositions

**What's happening:** The app uses at least 6 distinct taglines:

| Location | Tagline |
|----------|---------|
| Home page hero | "Ace your next tech interview." |
| OnboardingFlow | "Ace your next tech interview." |
| About page | "Ace your next tech interview." |
| ChallengeHome | "Ace your next tech interview." |
| Onboarding.tsx | "Land your dream role." |
| Blog home | "Land Your Dream Role with Expert Interview Prep" |
| SEO title | "Master Engineering Interviews with AI" |
| AllChannels SEO | "Level Up Your Skills" |
| Certifications SEO | "Get Certified, Get Hired" |
| Blog SEO | "Engineering Insights & Interview Prep" |

Users see a different promise depending on which page they land on.

**Fix:** Define **one** primary tagline ("Ace your next tech interview" is the most used) and **one** secondary tagline for section headers. Apply them consistently. Remove or align all other variants.

---

### HIGH

#### SU4 — 4 Different Header Systems Across Pages

**What's happening:** Pages use inconsistent header styles:
- **Most app pages** (Channels, Certs, Profile): Large centered gradient text via `PageHeader`
- **Blog pages**: Plain text, left-aligned, different sizing
- **About page**: Terminal-style `>` prefix with matrix animation
- **Documentation page**: GitHub-style fixed header, no gradient, left-aligned
- **Events Dashboard**: Plain "Events Dashboard" at `2xl`

**Fix:** Create and adopt a unified `<PageHeader>` pattern with consistent styling. Special pages can have custom heroes but should share design tokens.

---

#### SU5 — Sidebar Admin Section Visible to All Users

**What's happening:** The sidebar has a "Tools" and "Admin" section visible to every user:
- Tools: "Art Studio" (the illustration generator)
- Admin: "Bot Activity", "Activity Log", "Settings" (404), "Docs"

These should either be hidden from regular users or require an admin flag to display.

**File:** `client/src/components/layout/Sidebar.tsx`

**Fix:** Wrap Admin section items in a conditional check: `{isAdmin && (...)}`. Add an `admin_mode` localStorage flag check to the sidebar.

---

#### SU6 — "DevInsights" Brand Text in FaceliftNavbar

**What's happening:** The landing page navbar displays "DevInsights" as its brand/logo text, while the entire app uses "Open Interview". This is confusing for users who navigate between the landing page and the app.

**File:** `client/src/components/facelift-navbar.tsx`

**Fix:** Replace "DevInsights" with "Open Interview".

---

#### SU7 — BlogListPage.tsx Has Leftover Git Conflict Markers

**What's happening:** The file contains unresolved git merge conflict markers:
```
<<<<<<< Updated upstream
=======
>>>>>>> Stashed changes
```
This will cause build failures or runtime errors.

**File:** `client/src/pages/blog/BlogListPage.tsx` lines 126-132

**Fix:** Resolve the conflict by keeping the correct version of the code.

---

### MEDIUM

#### SU8 — Settings Link in Sidebar Leads to Nowhere (404)

**What's happening:** The sidebar has a "Settings" nav item pointing to `/settings`, but there is no `/settings` route registered in App.tsx. Clicking it goes to the 404 page.

**Fix:** Either create a Settings page (even a simple one with theme toggle, data export, reset progress) or remove the link from the sidebar.

---

#### SU9 — Bot Activity Page Uses "Interview Prep" Instead of "Open Interview" in Title

**File:** `client/src/pages/BotActivity.tsx` line 290

**Fix:** Update title to use "Open Interview" branding.

---

#### SU10 — EventsDashboard.tsx Contains GitHub URL with Old Repo Name

**File:** `client/src/pages/EventsDashboard.tsx` line 123: `https://github.com/satishkumar-dhule/code-reels/actions/runs/...`

**Fix:** Update URL to match the new repo name or use a config variable.

---

#### SU11 — Profile.tsx Download Uses Old Brand Name for Filename

**File:** `client/src/pages/Profile.tsx` line 148: `a.download = 'code-reels-data.json'`

**Fix:** Change to `'open-interview-data.json'`.

---

## SWARM-6: Content & Data (8 issues)

### MEDIUM

#### SD1 — E2E Tests Will Fail Due to Branding Text Change

**What's happening:** E2E tests reference old brand names that have been removed from the UI:
- `e2e/about.spec.ts:16` — expects `Code_Reels` text
- `e2e/documentation.spec.ts:18` — expects `Reel-LearnHub` text

These tests will fail when run against the current codebase.

**Fix:** Update test assertions to match current branding text ("Open Interview").

---

#### SD2 — SubscriptionGate.tsx Is a No-Op (Unused Architecture)

**File:** `client/src/components/SubscriptionGate.tsx` — renders `{children}` with zero logic. Originally intended for subscription/paywall.

**Fix:** Remove the wrapper from App.tsx or implement the intended logic.

---

#### SD3 — Archives Contain Old Brand Names (Non-Critical)

**Files:** `docs/archive/` (10+ files), `script/generate-sitemap.js:150`, `script/generate-rss.js:48,57` contain "Code Reels" branding.

**Fix:** Low priority. Update as part of a general cleanup pass.

---

#### SD4 — Blog Data Shows Wrong Stats (9 vs 121+ Articles)

**What's happening:** Blog home page shows "9 Published Articles" in stats, but `blog-data.json` has 121+ posts.

**Fix:** Fix the stat to read from the actual data source rather than a hardcoded value.

---

## Consolidated Execution Plan

The combined analysis found **93 issues total** (17 critical, 26 high, 31 moderate, 19 minor) across routing, state management, accessibility, performance, brand consistency, and content/data. Below is the recommended execution order integrating both the existing phase plan and the new swarm findings.

---

### Phase 0 — Emergency Fixes (30 min)
*Fix things that are broken now*

- [x] **C2**: Fix `/review` page infinite loading spinner
- [x] **C3**: Fix nested `<a>` in Documentation
- [x] **PF5/SS5**: Fix `useLevel` 1-second polling (change to 30s or event-driven)
- [x] **SU7**: Fix git conflict markers in BlogListPage.tsx
- [x] **SPF2**: Add `loading="lazy"` to ArtStudio images
- [x] **SR1**: Add basic admin guard to `/bot-activity`, `/events`, `/admin/docs`, `/admin/blog`

---

### Phase 1 — Routing Fixes (1–2 hours)
- [x] **C1**: Remove ProgressiveOnboarding, keep OnboardingFlow only
- [x] **C4**: Add `/questions` redirect to `/channels`
- [x] **SR2**: Fix mobile bottom nav Profile tab active state
- [x] **SR3**: Remove dead `LearningPaths` lazy import
- [x] **SR4**: Audit/delete orphaned VoiceInterview.tsx
- [x] **SR5**: Fix `getActiveSection` checks in UnifiedNav
- [x] **SR6**: Fix blog route render-props to support Suspense
- [x] **SR8**: Delete or consolidate 6 orphaned page files
- [x] **M4/R1**: Consolidate duplicate routes (`/coding` vs `/code`, `/my-path` vs `/learning-paths`)

---

### Phase 2 — State Management Consolidation (2–3 hours)
- [ ] **SS1/SS3/SS4**: Mount RewardProvider (currently dead code), consolidate CreditsContext + AchievementContext into it
- [x] **SS6**: Remove internal `balance` vs `state.balance` duplication in CreditsContext
- [ ] **SS2**: Consolidate 5 notification systems → UnifiedNotificationManager
- [ ] **SS8**: Remove independent localStorage scanning from BadgeContext
- [ ] **SS9/SS11**: Create StorageService wrapper with error handling and quota detection
- [ ] **SS10**: Reduce provider nesting from 9 to 6
- [x] **SS12**: Remove artificial 1s delay in BadgeContext

---

### Phase 3 — Accessibility (2–3 hours)
- [ ] **SA1**: Add visible labels to 15+ input fields and selects
- [x] **SA2**: Add `aria-label` to 17+ icon-only buttons
- [ ] **SA3**: Fix low-contrast text on home-facelift.tsx (`text-white/20/30/40`)
- [x] **SA4**: Add skip-to-content link to AppLayout
- [ ] **SA5**: Fix `focus-visible` styles on 10+ elements
- [x] **SA6**: Add `aria-current="page"` to navigation items
- [x] **SA7**: Add `aria-expanded`/`aria-controls` to collapsible sections
- [ ] **A1/A2/A3/A4**: Complete existing accessibility checklist items
- [ ] **SA10**: Wire `useAnnouncer` into form validation

---

### Phase 4 — Performance (2–3 hours)
- [x] **SPF1**: Add `React.memo` to ChannelCard, NavItemEl, EventRow, MobileBottomNav
- [ ] **SPF3**: Add list virtualization to AllChannels channel grid
- [ ] **SPF4**: Consolidate timer management — replace JS timers with CSS/RAF
- [x] **SPF5**: Add `useReducedMotion` wrapper to framer-motion components
- [ ] **SPF6**: Extract inline arrow functions in Sidebar, facelift-navbar, MobileHeader
- [ ] **SPF7**: Begin splitting largest page files (Documentation, CertificationExam)
- [x] **SPF8**: Cache `useGlobalStats` to avoid full localStorage scan on every refresh
- [x] **SPF9**: Debounce high-frequency event listeners
- [ ] **PF1/PF2/PF3**: Complete existing performance checklist

---

### Phase 5 — Brand & Visual Consistency (1–2 hours)
- [x] **SU3**: Define primary tagline ("Ace your next tech interview"), remove all variants
- [x] **SU6/SR7**: Replace "DevInsights" with "Open Interview" in facelift-navbar
- [ ] **SU4/P6**: Create unified PageHeader component, apply to all pages
- [x] **M3/M1**: Replace all old brand names ("Code_Reels", "Reel-LearnHub") with "Open Interview"
- [x] **SU5/M2**: Hide admin sidebar items behind admin flag
- [x] **SU8/P4**: Create or remove the Settings link
- [x] **SU10/SU11**: Fix GitHub URL and download filename with old repo name
- [ ] **P1/P2/P3/P8**: Complete existing UI consistency items

---

### Phase 6 — Blog Integration & Polish (1–2 hours)
- [ ] **SU2/M6**: Visually align blog with main app or add clear navigation bridge
- [x] **SD4**: Fix blog article count stat (showing 9 instead of 121+)
- [ ] **SD1**: Fix E2E tests that reference old branding
- [x] **P5**: Remove skeleton loaders from Channels (sync data)
- [x] **M5**: Rewrite Voice Interview empty state
- [ ] **D1-D8**: Complete all minor polish items

---

### Phase 7 — Content & Code Quality (ongoing)
- [ ] **SD3**: Clean up old brand names in archives and scripts
- [ ] **SPF7 continued**: Split remaining monolithic page files
- [ ] **Technical debt**: Remove dead code, consolidate utilities, enable strict TypeScript
- [ ] **Test coverage**: Add component and unit tests for core hooks
- [ ] **Content quality**: Run content validation across all question data

---

## Total Issue Inventory

| Category | Critical | High | Medium | Minor | Total |
|----------|----------|------|--------|-------|-------|
| **Original (pre-swarm)** | 5 | 2 | 17 | 19 | 43 |
| **Routing & Navigation** | 3 | 4 | 3 | 0 | 10 |
| **State Management** | 2 | 5 | 5 | 0 | 12 |
| **Accessibility** | 4 | 3 | 4 | 0 | 11 |
| **Performance** | 5 | 4 | 2 | 0 | 11 |
| **UI/UX & Brand** | 3 | 4 | 4 | 0 | 11 |
| **Content & Data** | 0 | 0 | 4 | 0 | 4 |
| **Total** | **22** | **22** | **39** | **19** | **102** |

---

# Single-Page Content Rule

> **Scope:** Applies to questions, answers, flashcards, voice sessions, and certification questions. Does NOT apply to blog posts.

## Principle

Every piece of content shown to a user in a question viewer, flashcard, or voice session must be fully readable on a single screen without any vertical scrolling. The goal is zero cognitive overhead from layout — the user's full attention stays on understanding, not navigating.

"One screen" is defined as the visible content area on a standard laptop (1280×800) with the sidebar open, which gives approximately **600px of usable vertical height**. At a comfortable reading size (16px, 1.6 line height), that is roughly **120–150 words of prose** before scrolling begins.

---

## Content Audit Findings

This is based on a full statistical scan of all content data files.

### Questions — `explanation` field

| File | Total | Avg words | Max words | Over 150 words | Over 300 words |
|------|-------|-----------|-----------|----------------|----------------|
| `algorithms.json` | 329 | 173 | 435 | 183 (56%) | 28 (9%) |
| `aws.json` | sampled | ~130 | 500+ | ~40% | ~15% |
| `system-design.json` | sampled | ~200 | 600+ | ~65% | ~25% |
| All other channel files | est. ~3,000+ | ~150–200 | 600+ | est. 50%+ | est. 15%+ |

**Verdict: FAIL.** The `explanation` field is the primary offender. It is multi-paragraph prose, often with `##` markdown section headers, numbered implementation steps, and occasionally full code blocks (Lua, Python, etc.) embedded inline. These render to 3–5 scrollable screens on a laptop.

### Questions — `answer` field (the TL;DR)

| Metric | Value |
|--------|-------|
| Average words | 25–50 |
| Maximum words (algorithms sample) | ~100 |
| Items over 100 words | 34 of 329 (10%) |

**Verdict: MOSTLY PASS.** The `answer` field is the short TL;DR sentence (1–3 sentences). Most answers are concise. The ~10% that exceed 100 words need trimming.

### Flashcards — `back` field

| Metric | Value |
|--------|-------|
| Total cards | 323 |
| Average words | 40 |
| Maximum words | 63 |
| Cards over 80 words | 0 |

**Verdict: PASS.** Flashcard backs are already within the 1-page limit. The longest cards (57–63 words) are edge cases with complex algorithm descriptions that may feel dense but technically fit.

### Voice Sessions

Voice practice questions pull from the same channel question files (filtered by `voiceSuitable: 1`). The voice UI shows `voiceKeywords` as chips and the `question` text — not the `explanation`. The keyword chips are already compact.

**Verdict: PASS on the current voice UI.** If the voice session ever shows a full answer/explanation, the same limits as questions apply.

### Certifications

`data/certifications.json` contains only certification metadata (exam name, provider, domains, passing score). Actual certification practice questions are served from the channel-specific files (e.g., `aws-saa.json`, `azure-administrator.json`). These are regular `Question` objects and follow the same `answer` + `explanation` structure.

**Verdict: Subject to same rules as Questions above.**

### Coding Challenges — `description` field

| Metric | Value |
|--------|-------|
| Average words | 40–60 |
| Sample max | ~60 |

**Verdict: PASS.** Challenge descriptions are already brief problem statements.

---

## Rewrite Plan

### SP1 — Define Official Word Limits Per Content Type

**What:** Establish and document the exact word-count target for each content field so writers and scripts have a clear, enforceable standard.

| Content field | Current avg | Target max | Notes |
|--------------|-------------|-----------|-------|
| `explanation` | 150–200 words | **120 words** | Must drop all `##` section headers and inline code blocks; diagrams go in the `diagram` field |
| `answer` (TL;DR) | 30–50 words | **50 words** | One to two sentences maximum |
| Flashcard `back` | 40 words | **60 words** | Already passing; ceiling to prevent regressions |
| Voice `voiceKeywords` | N/A (chips) | **15 keywords max** | Already fine |
| Cert question `explanation` | same as question | **120 words** | Same rule |
| Coding challenge `description` | 40–60 words | **80 words** | Already passing |

**Skill to use:** `think` — use this skill to pressure-test the word limits above against real examples, reason through edge cases (e.g., is 120 words always enough for a distributed systems answer?), and produce a final, justified limits document before any rewriting begins.

---

### SP2 — Audit Script: Identify Every Over-Limit Item

**What:** Write a Node.js script (`scripts/audit-content-length.mjs`) that reads every question JSON file in `data/questions/`, every flashcard in `data/flashcards/`, and produces a report:
- Total items per file
- Count and percentage over the word limit
- Top 20 longest items (id, channel, word count, first 100 chars of explanation)
- A machine-readable output (`audit-content-length-report.json`) for the rewrite script to consume

This gives an exact list of every item that needs rewriting, channel by channel.

**Skill to use:** No special skill — pure Node.js scripting with `fs` and JSON. Run with `node scripts/audit-content-length.mjs` and commit the report.

---

### SP3 — Rewrite Question `explanation` Fields (Primary Task)

**What:** Every question `explanation` that exceeds 120 words must be rewritten to fit within the limit. The rewrite must:
- Preserve the technical accuracy of the original
- Keep the most important concept or mechanism from the original
- Remove `##` sub-section headers — explanations must be flowing prose, not mini-articles
- Move any diagrams described in prose to the `diagram` field (Mermaid syntax)
- Move code examples to the `diagram` field or cut entirely if not essential to the core answer
- End with one concrete, practical takeaway

**Scale:** Estimated 1,500–2,500 questions across all channel files need rewriting (based on ~50% failure rate across ~3,000+ questions).

**Approach:** Batch rewriting via LLM. Write a script (`scripts/rewrite-explanations.mjs`) that:
1. Reads the audit report from SP2 to get the list of over-limit items
2. For each item, sends the original `explanation` to an LLM with a strict prompt: "Rewrite this technical explanation in 120 words or fewer. Keep it accurate. No section headers. No code blocks. One clear takeaway."
3. Writes the rewritten `explanation` back to the source JSON file in-place
4. Logs every rewrite to `scripts/rewrite-log.json` with original word count, new word count, and a diff preview

**Skill to use:** `agent-tools` — use the inference.sh CLI to call a capable LLM (Claude Sonnet or GPT-4o) for each rewrite. The `agent-tools` skill documents the exact CLI syntax for piping prompts and getting text back. Process in batches of 20 with a delay to avoid rate limits. Estimate: ~2 hours of automated runtime.

---

### SP4 — Rewrite Question `answer` Fields That Exceed 50 Words

**What:** The ~10% of `answer` (TL;DR) fields that exceed 50 words need trimming. The TL;DR must be exactly that — one or two sentences that a user can read in under 5 seconds.

**Scale:** Estimated 300–400 items across all files.

**Approach:** Same batch-rewrite script as SP3, or a second pass in the same script targeting the `answer` field. Prompt: "Rewrite this answer as a single sentence of 50 words or fewer that captures the core idea."

**Skill to use:** `copywriting` — use this skill to craft the rewrite prompt. The copywriting skill specializes in concise, high-impact writing. Apply its principles (active voice, no filler words, single strong claim per sentence) to the LLM prompt template used in the rewrite script.

---

### SP5 — Review and Quality-Check Rewritten Content

**What:** After the automated rewrites, a human review pass is needed to catch cases where the LLM oversimplified a nuanced answer or introduced an inaccuracy. Focus the review on:
- Questions tagged `difficulty: "advanced"` (most likely to be oversimplified)
- Questions with `voiceSuitable: 1` (these are read aloud — flow and naturalness matter)
- Any rewrite where the word count dropped by more than 60% (aggressive cuts may lose key facts)

The review can be done in the UI itself — navigate to each question, read the explanation, and manually edit if needed.

**Skill to use:** `doc-coauthoring` — use this skill's structured review workflow to systematically co-author improved versions of any flagged explanations. It provides a workflow for iteratively refining content with clear accept/reject cycles.

---

### SP6 — Validate All Content Meets Limits After Rewrite

**What:** Register a validation command that re-runs the audit script after rewrites are complete and asserts zero items over the limit. This becomes a repeatable check to run any time new content is added.

The validation command:
```bash
node scripts/audit-content-length.mjs --assert
```

With `--assert` flag, the script exits with code 1 if any field exceeds its limit, and prints a table of violations. Exit code 0 means full compliance.

**Skill to use:** `validation` — use this skill to register the audit script as a named validation step ("Content Length Compliance"). The skill documents how to register shell commands as CI-style checks that can be re-triggered at any time.

---

### SP7 — Prevent Future Regressions: Content Authoring Guide

**What:** Write a short content authoring guide (`docs/content-standards.md`) that any contributor (human or bot script) must follow when adding new questions, flashcards, or voice sessions. It must include:
- The word limits table from SP1
- Bad/good examples for each content type
- The rule that diagrams and code go in dedicated fields, not inline in `explanation`
- A note that blogs are explicitly exempt from these limits

**Skill to use:** `content-strategy` — use this skill to structure the guide. It covers how to define content rules, what topics to cover, and how to write guidelines that are actually followed rather than ignored.

---

## Single-Page Content Rule — Summary Table

| ID | Task | Scope | Skill |
|----|------|-------|-------|
| SP1 | Define official word limits per content type | Planning | `think` |
| SP2 | Audit script to identify every over-limit item | Scripts | Node.js only |
| SP3 | Rewrite `explanation` fields > 120 words (~1,500–2,500 items) | Content data | `agent-tools` |
| SP4 | Rewrite `answer` TL;DR fields > 50 words (~300–400 items) | Content data | `copywriting` |
| SP5 | Human review pass on advanced/voice questions | Content QA | `doc-coauthoring` |
| SP6 | Register validation command for ongoing compliance | CI/tooling | `validation` |
| SP7 | Write content authoring guide to prevent regressions | Documentation | `content-strategy` |

---

## Recommended Execution Order for Single-Page Rule

1. **SP1** first — lock the limits before any rewriting starts
2. **SP2** — run the audit to get exact numbers and the item list
3. **SP3 + SP4** in parallel — both use the same script, can run simultaneously across different channel files
4. **SP5** — manual review of flagged items after automated rewrites
5. **SP6** — register validation and run it to confirm zero violations
6. **SP7** — write the guide so the work doesn't have to be repeated

---

---

# True Card Layout System

> **Scope:** Flashcard viewer, Question viewer (QuestionCard), Voice session cards, Certification practice cards — any surface where a single piece of content is displayed in a "card" context.

## The Problem

Every card in the app is currently a wide rectangle that fills whatever container it sits in. The flashcard uses `max-w-2xl` (672px) with a landscape `clamp(260px, 42vh, 400px)` height. The QuestionCard is `w-full h-full` with no fixed ratio. On a 1440px wide desktop with the sidebar open, a flashcard stretches to roughly 600px × 340px — the proportions of a banner advertisement, not a card.

Real cards — playing cards, index cards, flash cards — are portrait-oriented objects. They have fixed proportions. You can hold a deck of them. They feel tactile. The current layout has none of this. On wide screens only one card is shown at a time, wasting the horizontal space that could show the user where they are in the deck.

---

## The Vision: What "Actual Cards" Means

### Card Proportions

| Card type | Real-world ratio | Use case |
|-----------|-----------------|----------|
| Playing card | 5:7 (portrait) | Flashcards |
| Index card (3×5") | 3:4 (portrait) | Question cards |
| Credit card | 8:5 (landscape) | Certification MCQ cards |

Flashcards should use a **portrait 5:7 ratio** — like holding a real flash card. On mobile a card is ~300px × 420px. On desktop the card is a fixed comfortable size (~280px × 392px) and does not grow wider than that regardless of screen width.

Question viewer cards should use a **portrait 3:4 ratio** — like an index card. The question has room to breathe without sprawling edge to edge.

### Multi-Card Layout on Wide Screens

On screens wider than 1024px, there is enough horizontal space to show multiple cards simultaneously. Instead of centering one stretched card with floating arrows, the layout reveals adjacent cards in a **deck spread** — the current card is front and center at full size, and the previous/next cards peek in from the sides at reduced scale with a slight rotation.

```
Mobile (< 640px)
┌─────────────────────┐
│     [  CARD  ]      │  1 card, portrait, full usable width
└─────────────────────┘

Tablet (640–1023px)
┌──────────────────────────────┐
│  [▸]   [  CARD  ]   [◂]     │  Current card + ghost edges of neighbors
└──────────────────────────────┘

Desktop (1024–1439px)
┌───────────────────────────────────────┐
│  [prev]  [  CARD  ]  [next]           │  3 cards — prev/next at 85% + ±6° tilt
└───────────────────────────────────────┘

Wide (≥ 1440px)
┌──────────────────────────────────────────────┐
│  [p2][p1]  [  CURRENT  ]  [n1][n2]  ░ deck  │  5 cards + stacked deck visual
└──────────────────────────────────────────────┘
```

---

## Plan Items

### CC1 — Design the Card Proportions and Responsive Breakpoints

**What:** Before touching any code, define the exact pixel dimensions, aspect ratios, and responsive behaviour for each card surface. This is a design decision that cascades across the flashcard viewer, question viewer, voice session, and certification practice.

Decisions to lock in this step:
- Exact card size at each breakpoint (fixed size, not fluid — the card should not resize as the browser window changes)
- Aspect ratio per card type: flashcard = portrait 5:7, question card = portrait 3:4
- How many cards are visible at each breakpoint: 1 → peek → 3 full → 5 full
- Scale factor for non-focused adjacent cards (suggested: 0.85× for neighbors, 0.72× for secondary neighbors)
- Rotation angle for adjacent cards (suggested: ±5° to ±8° — enough to read as a fan without looking sloppy)
- How the layout gracefully handles the sidebar: sidebar is 240px wide, available card area = viewport width − 240px; the breakpoints above are for the card area, not the full viewport

**Skill to use:** `think` — use this skill to reason through the dimension decisions before committing. Run through the exact numbers at each breakpoint: sidebar (240px) + gutter + card area → how many cards fit at what size without overlapping. The wrong proportions will look worse than the current layout.

---

### CC2 — Design the Physical Card Aesthetic

**What:** Real cards have visual properties that make them feel like objects, not UI panels. Define and design each of these:

**Card face:**
- Tighter rounded corners than the current `border-radius: 28px` — playing cards use ~3–4mm radius; at ~280px wide that is closer to `border-radius: 10–12px`
- A subtle paper/linen texture as the background (CSS `background-image` with a noise SVG data URI — no external image files)
- A thin border in a slightly lighter shade than the card face, giving the impression of card edge/thickness

**Card back (shown during flip):**
- The back of the card should have a distinct repeating geometric pattern or the app logo watermarked, not just the inverse gradient of the front
- This makes the flip animation feel like physically turning a card over, not toggling between two UI states

**Card depth / deck indicator:**
- Behind the current card, render 2–3 card-shaped layers offset by ~4px down and ~2px right each, progressively smaller and darker, like a real physical deck sitting on a surface
- The bottom layer shows a small "×38 remaining" label
- As the user progresses, the deck visually shrinks (fewer layers) until the last card stands alone

**Drag elevation:**
- When dragging, the card's shadow grows and scale slightly increases (1.03×) — the card "lifts" off the surface
- On release past the swipe threshold, the card arcs off-screen with its drag velocity plus a slight rotation — like throwing a card — not a fade

**Skill to use:** `frontend-design` — use this skill to design the specific visual values (shadow layers, noise texture pattern, corner radius, tilt angles) before implementing them. The aesthetic details are subjective and need visual iteration, not calculation.

---

### CC3 — Implement Multi-Card Layout for the Flashcard Viewer

**What:** Apply the card system from CC1/CC2 to `Flashcards.tsx` — the flagship card surface.

Current state:
- Container: `w-full max-w-lg` wrapping `w-full max-w-2xl` — wide landscape card
- Height: `clamp(260px, 42vh, 400px)` — scales with viewport
- Navigation: floating `<button>` arrows `absolute left-2 / right-2`
- One card at all times regardless of screen width

Target state:
- Card has a **fixed portrait size** at each breakpoint — does not scale with viewport width
- Mobile: 1 card, full-width portrait, swipe to navigate
- Tablet: current card centered with ~25% of adjacent cards visible at edges
- Desktop: 3 cards rendered — prev (85% scale, +6° tilt), current (100%), next (85% scale, −6° tilt)
- Wide: 5 cards rendered with the deck stack graphic behind the rightmost card
- Navigation: tapping/clicking an adjacent card navigates to it (no floating arrow buttons needed on desktop)
- The channel filter pills, progress bar, and rating buttons remain at the top/bottom, unchanged in layout

**Files affected:** `client/src/pages/Flashcards.tsx`

**Skill to use:** `frontend-design` — for the implementation of the multi-card container layout, scaling transforms, and tilt rotations.

---

### CC4 — Physical Swipe-Throw Animation

**What:** Upgrade the drag-and-release interaction on flashcards from a mechanical slide to a physical card throw.

Current: `framer-motion` `drag="x"` with flat `opacity`/`scale` exit animation.

Target behaviour:
1. **During drag:** card rotates proportionally to horizontal drag offset — up to ±15° at the swipe threshold distance. Shadow simultaneously grows and scale increases to 1.04× (the card lifts)
2. **On release past threshold:** card exits with its current velocity plus a slight upward arc (y offset) and continued rotation — it doesn't stop at the screen edge, it flies through
3. **Next card entrance:** the card that was behind it "rises" from the deck with a quick spring scale animation (0.85 → 1.0) and the deck stack loses one layer
4. **On release before threshold:** card snaps back to center with a spring bounce, returning to 0° rotation and 1.0 scale

This is the interaction signature of every premium card-based learning app (Anki, Duolingo stories, Tinder). It is what makes swiping through a deck feel rewarding rather than functional.

**Files affected:** `client/src/pages/Flashcards.tsx` (the `motion.div` drag handler, `onDragEnd`, and `AnimatePresence` exit/enter variants)

**Skill to use:** `frontend-design` — the specific Framer Motion spring stiffness, damping, and exit velocity values need to be tuned by feel, not calculated. The design skill is the right one for iterating on these until they feel right.

---

### CC5 — Deck Stack Visual (Cards Remaining)

**What:** Replace the plain `index + 1 / total` counter in the flashcard header with a spatial deck indicator.

Behind the active card, render 2–3 card-shaped `<div>` layers:
- Layer 1 (directly behind): offset +3px down, +2px right, 97% width, slightly darker background
- Layer 2: offset +6px down, +4px right, 94% width, darker still
- Layer 3 (optional for decks > 20 cards): offset +9px down, +6px right, 91% width, darkest
- The bottom layer shows a small `×38` label in the bottom-right corner

As the user works through the deck:
- At > 15 cards remaining: show all 3 layers
- At 6–15 cards: show 2 layers
- At 2–5 cards: show 1 layer
- At 1 card: no stack layers, card stands alone — gives a satisfying "final card" moment

The numeric counter in the header can remain as a secondary data point (e.g., small `38 left` text), but the stack is the primary progress signal.

**Files affected:** `client/src/pages/Flashcards.tsx`

**Skill to use:** `frontend-design` — the offset values, color steps, and size tapers for the stack layers are visual parameters that need to be tuned aesthetically.

---

### CC6 — Question Viewer Card: Fixed Width and Portrait Ratio

**What:** The `QuestionCard` component (`QuestionCard.tsx`) is currently `w-full h-full` — fully fluid. In the QuestionViewer, this means the question card stretches to 800–900px on a desktop, which is far too wide.

Target:
- Maximum card width: **480px**
- Aspect ratio: **3:4** portrait (480 × 640px on desktop)
- Question text vertically centered within the card face
- Card is centered horizontally in the content area
- The remaining horizontal space on desktop shows the prev/next question cards at 75% scale with ±5° tilt — same multi-card system as CC3
- On mobile, card is full-width maintaining the 3:4 ratio

The answer panel (AnswerPanel / UnifiedAnswerPanel) sits below the question card as a separate surface — it does not need to match the card proportions, but it should be constrained to the same maximum width as the question card so the two stack neatly.

**Files affected:** `client/src/components/unified/QuestionCard.tsx` and the container in `QuestionViewer.tsx` (or wherever the card is placed in the question browsing flow)

**Skill to use:** `frontend-design` — for the proportion constraints and the multi-card layout adaptation for the question context.

---

### CC7 — Voice Session and Certification Practice Cards

**What:** Both the voice interview session and the certification exam practice show question cards one at a time using `QuestionCard`. Once CC6 establishes the fixed-width portrait system for `QuestionCard`, these surfaces get the new proportions for free — but they need to be checked explicitly to confirm nothing breaks:

- Voice session: question card + keyword chips + recording controls → confirm the card proportions work with the recording UI below
- Certification practice: MCQ question card + 4 answer option buttons → confirm the card proportions work with the answer options layout. The answer options should appear below the card (not inside it), constrained to the same max-width

**Files affected:** `VoicePractice.tsx`, certification practice component

**Skill to use:** `frontend-design` — visual QA and any adjustments needed for these specific surfaces.

---

## True Card Layout — Summary Table

| ID | Task | Surfaces Affected | Skill |
|----|------|------------------|-------|
| CC1 | Design card proportions and responsive breakpoints | All card surfaces | `think` |
| CC2 | Design physical card aesthetic (texture, back, depth, throw) | All card surfaces | `frontend-design` |
| CC3 | Multi-card fan layout in Flashcard viewer | `Flashcards.tsx` | `frontend-design` |
| CC4 | Physical swipe-throw animation (rotate + arc exit + spring entrance) | `Flashcards.tsx` | `frontend-design` |
| CC5 | Deck stack visual: stacked card layers showing cards remaining | `Flashcards.tsx` | `frontend-design` |
| CC6 | Fixed-width portrait card in Question viewer | `QuestionCard.tsx` + viewer | `frontend-design` |
| CC7 | Voice session and certification practice visual QA | `VoicePractice.tsx`, cert component | `frontend-design` |

## Recommended Execution Order for Card Layout

1. **CC1** — lock dimensions and breakpoints (design decision, no code)
2. **CC2** — design the card aesthetic in isolation (CSS values, textures, shadows)
3. **CC3** — implement the multi-card layout in the flashcard viewer (flagship surface)
4. **CC4** — add the throw animation while the flashcard component is being worked on
5. **CC5** — add the deck stack while still in the flashcard component
6. **CC6** — apply the fixed-width portrait system to the question viewer card
7. **CC7** — propagate to voice and certification surfaces and do visual QA
---

# Todo (Concise)

## Critical Bugs (P0)

- [x] **Onboarding modal blocks deep links** — Moved check from `SubscriptionGate` (which wrapped Router) into Home page only. Deep links bypass onboarding entirely
- [x] **`/events` page crashes browser renderer** — Fixed: replaced `<>...</>` fragments in `.map()` with `<React.Fragment key={...}>` to fix React reconciliation crash. Also stabilized recharts `ResponsiveContainer` width
- [x] **`/channels` page load timeout** — Fixed: `StatsService.getAll()` changed from sequential `for...of` (80+ sequential HTTP requests) to parallel `Promise.all`
- [x] **`/whats-new` route returns 404** — Fixed: created missing `client/src/lib/changelog.ts` module with types and default data
- [x] **404 page renders empty** — Fixed: wrapped `NotFound` in `<AppLayout>` so users get sidebar/bottom nav navigation chrome
- [x] **Profile page renders blank** — Fixed: wrapped render tree in `<ErrorBoundary>` with "Reset & Reload" fallback. Added try/catch on all `localStorage` reads
- [x] **Mobile bottom nav hidden at 375px** — Fixed: increased bottom nav z-index to `z-[70]` (above FaceliftNavbar). Increased bottom padding to 80px

## High Priority (P1)

- [x] **`use-level` hook runs every second** — `setInterval(1000)` causes constant re-renders across the entire component tree. Replace with event-driven updates or reduce polling interval
- [ ] **10 orphaned page files consuming bundle** — Files exist in `client/src/pages/` but are not imported in `App.tsx` router. Delete or re-register them
- [ ] **Dual onboarding systems conflict** — Both `SubscriptionGate` and `ProgressiveOnboarding` handle first-user experience. Consolidate into one system
- [ ] **`/stats` silently redirects** — No toast, no feedback, no explanation. User is confused why navigation happened
- [ ] **Blog pages use separate CSS variable system** — Blog uses its own CSS variables (e.g. `--blog-bg`, `--blog-text`), breaking visual continuity with main app theme
- [ ] **AllChannels page uses skeleton loaders for synchronous data** — Skeleton loaders shown for data loaded synchronously from JSON; flashes loading state unnecessarily
- [ ] **Profile + Bookmarks lack localStorage error handling** — No try/catch around localStorage reads; corrupted storage crashes the page
- [ ] **CertificationPractice navigates to wrong channel** — Routing logic maps certifications to incorrect channel IDs
- [ ] **`/questions` route returns 404** — Route not registered or broken import
- [ ] **Documentation page shows internal developer content** — User-facing docs page leaks internal dev instructions

## Medium Priority (P2)

- [ ] **Mobile bottom nav overlaps last content row** — On scroll, bottom nav covers the last row of interactive content
- [ ] **Several low-contrast text instances** — Gray-on-gray text fails WCAG AA contrast minimums (`#6b7280` on `#f9fafb` and similar)
- [ ] **Blog has no visual continuity with main app** — Separate header, separate styling, no shared navigation
- [ ] **Fresh user sees "Voice Interview +10" badge before subscribing to channels** — Badge shown with no way to earn it; misleading gamification
- [ ] **Stale brand names scattered across pages** — "Code Reels" and "Reel-LearnHub" still appear in UI text and metadata

## Performance

- [ ] **No list virtualization on large pages** — Channels list, Questions list, Blog list all render every item; use `react-window` or `@tanstack/virtual`
- [ ] **Heavy framer-motion animations on 118 files** — Every component has entrance animations; causes jank on mid-range devices. Reduce to meaningful moments only
- [ ] **No `React.memo` on reusable components** — `QuestionCard`, `ChannelCard`, `Badge` and other frequently-rendered components lack memoization
- [ ] **`ChallengeHome.tsx` hardcodes 20+ Tailwind gray classes** — No design token usage; breaks theme switching
- [ ] **Large JSON files loaded synchronously on page load** — Some data files (~MB) block rendering; lazy-load or split further
- [ ] **Pagefind search index rebuild on every build** — Can be optimized to rebuild only when content changes

## Accessibility

- [ ] **Input fields without visible labels** — 5+ locations use placeholder-only inputs with no `<label>` element
- [ ] **Icon-only buttons missing `aria-label`** — 8+ buttons with SVG icons have no accessible name
- [ ] **Low-contrast gray text** — Widespread use of `text-gray-400/500` on light gray backgrounds fails WCAG AA
- [ ] **Missing `focus-visible` styles** — Keyboard navigation invisible on interactive elements
- [ ] **37/42 pages have zero `data-testid` attributes** — Makes E2E testing fragile; relies on visual text selectors
- [ ] **VoicePractice has no error state when microphone is denied** — User sees spinner forever when mic permission blocked
- [ ] **No skip-to-content link** — Keyboard users must tab through entire nav to reach main content

## Testing

- [ ] **Fix 14 failing E2E tests** — Current run: 129 passed, 14 failed, 5 skipped. Main failures:
  - [ ] 5 onboarding tests — modal not mounting, skip button missing
  - [ ] 3 navigation tests — `/events` crash, `/whats-new` timeout, empty 404
  - [ ] 2 channels tests — page timeout, cards not visible
  - [ ] 1 profile test — blank profile page
  - [ ] 1 accessibility test — wrong assertion logic
  - [ ] 2 mobile tests — bottom nav not visible at 375px
- [ ] **Add unit tests for core hooks** — `useAuth`, `useProgress`, `useLevel` have no tests
- [ ] **Add component tests with React Testing Library** — Zero component-level tests currently
- [ ] **Add `data-testid` attributes to remaining 37 pages** — Target most-broken pages first
- [ ] **Set up API integration tests for server endpoints**
- [ ] **Add accessibility assertion tests** — Use `@axe-core/playwright` for automated a11y checks

## DevOps / CI-CD

- [ ] **Fix GitHub Analytics bot PostgreSQL dependency** — `github-analytics-bot.js` still expects a DB. Rewrite to file-based storage or remove
- [ ] **Re-enable and fix `deploy-blog.yml`** — Currently disabled; was the legacy blog deployment
- [ ] **Remove disabled workflows or document reason** — `deploy-astro-blog.yml` is dead code
- [ ] **Consolidate Playwright config** — Tests exist in both `e2e/` and `tests/e2e/`; confusion about which is canonical. Move all to `e2e/`
- [ ] **Reduce CI runtime** — E2E tests take ~15min; target <10min by splitting into shards

## Content Pipeline

- [ ] **Validate all 93 per-channel question files** — After splitting monolithic `tests.json`, ensure no questions were lost or malformed
- [ ] **Verify blog post quality** — AI-generated 147+ posts; run content quality validation on all
- [ ] **Add flashcard content** — Only 323 cards exists; expand coverage to match question bank
- [ ] **Fix SVG generator output** — Some generated SVGs have rendering artifacts or broken references
- [ ] **Add content freshness dates** — Questions have no "last updated" metadata; users can't tell if content is stale

## Technical Debt

- [ ] **Remove dead code** — Search for unused exports, commented-out blocks, and dead imports
- [ ] **Consolidate `lib/` utilities** — 42 files with overlapping responsibilities (formatting, validation, helpers)
- [ ] **Standardize error handling** — Mix of try/catch, `.catch()`, and unhandled promise rejections
- [ ] **Type strictness** — Many `any` types; enable `strict: true` in tsconfig and fix violations
- [ ] **Remove Drizzle ORM remnants** — `shared/schema.ts` still has Drizzle imports; clean up
- [ ] **Fix ESLint/TS errors** — Run full lint pass and address warnings
- [ ] **Remove stale bot scripts** — Several scripts in `script/` directory are unused; audit and delete
- [ ] **Update README** — Outdated setup instructions, missing feature docs, stale screenshots

## Future / Nice-to-Have

- [ ] **Dark mode** — No theme toggle; users want light/dark switching
- [ ] **User accounts** — Currently localStorage-only; no cross-device progress sync
- [ ] **Offline support** — Service worker + cache for offline question browsing
- [ ] **PWA support** — Add manifest, install prompt, push notifications
- [ ] **API rate limiting** — Add to Express server
- [ ] **i18n** — Multi-language support for international users
- [ ] **CI/CD dashboard** — Visual dashboard showing pipeline health and deploy status
- [ ] **Automated dependency updates** — Use Dependabot or Renovate
- [ ] **Load testing** — Use k6 or Artillery to benchmark static site performance
- [ ] **Mobile app** — React Native or PWA wrapper for app store distribution

---

**Legend**: `[ ]` = not started, `[~]` = in progress, `[x]` = done

---

---

# Content Quality & Structure Gate — Master Plan

> **Scope**: Every content type (blog posts, questions, flashcards, Q&A answers) × every rendering
> surface (React SPA, Astro static blog) × every pipeline stage (generation → validation → storage → render).
> **Rule**: No code is written here. This is a pure planning and specification document.
> **Total action items**: 152 discrete tasks across 7 sections.

---

## CQ0 — Foundational Inventory

Before any gate can be defined, every field in every schema must be audited against every renderer to produce
a complete truth table of "field exists → is rendered → how → what breaks if absent".

### CQ0.1 — Build a master field × renderer truth table
- [ ] List every field in `data/questions/<channel>.json` across all 93 channels and confirm all channels have identical field shape (no channel-specific extras)
- [ ] List every field in `data/flashcards/all.json` and confirm no undocumented fields exist beyond the known schema
- [ ] List every field produced by `scripts/generate-blog-static.mjs` into `client/public/blog-data.json`
- [ ] List every frontmatter field consumed by `blog-astro/src/content/config.ts` Zod schema
- [ ] List every field consumed by `MarkdownRenderer.tsx` (React SPA custom blog renderer)
- [ ] List every field consumed by `PostDetailPage.tsx`
- [ ] List every field consumed by `AnswerPanel.tsx`
- [ ] List every field consumed by `QuestionViewer.tsx`
- [ ] List every field consumed by `Flashcards.tsx`
- [ ] List every field consumed by `BlogKnowledgeCheck.tsx`
- [ ] List every frontmatter field used in `blog-astro/src/layouts/BlogPost.astro`
- [ ] List every frontmatter field used in `blog-astro/src/layouts/BaseLayout.astro` (SEO)
- [ ] Cross-join all tables: flag fields that are **generated but never rendered**, **rendered but sometimes absent**, **present in schema but missing from TypeScript type definitions**
- [ ] Document which fields are **required**, **optional-with-fallback**, and **optional-silently-dropped** for each content type and surface

### CQ0.2 — Audit actual data quality in the corpus
- [ ] Run frequency analysis on all 93 `data/questions/` files: report percentage of entries with non-null `diagram`, `eli5`, `companies`, `voiceKeywords`, `videos`, `sourceUrl`
- [ ] Run frequency analysis on `data/flashcards/all.json`: percentage with non-null `hint`, `mnemonic`; average `front` length; average `back` length; count of entries where `hint === null` or `mnemonic === null`
- [ ] Run frequency analysis on `client/public/blog-data.json`: percentage with non-null `coverImage`; posts with mermaid block in content; posts with `## Key Takeaways`; posts with `## Wrapping Up` or `## Conclusion`
- [ ] Identify questions with `diagram` field that fails Mermaid syntax (does not start with `flowchart`, `graph`, `sequenceDiagram`, `classDiagram`, `stateDiagram`, `erDiagram`, `gantt`, `pie`, `gitGraph`)
- [ ] Identify flashcards where `front` exceeds 100 chars (violates content-standards.js rule)
- [ ] Identify flashcards where `back` exceeds 300 chars (violates content-standards.js rule)
- [ ] Identify questions where `answer` field contains markdown (bold `**`, code fences ` ``` `, headings `#`) — violates answer-standard.js plain-text rule
- [ ] Identify questions where `explanation` has fewer than 2 `## ` section headers
- [ ] Identify questions where `answer` is under 150 chars or over 500 chars (outside defined bounds)
- [ ] Identify blog posts where `content` still contains citation clusters (` 1 , 2 .` patterns) after preprocessing
- [ ] Identify blog posts where `content` still contains "Share This" or "Did you know?" noise after preprocessing
- [ ] Identify blog posts where mermaid fences are malformed (single-line or missing language tag)
- [ ] Identify blog posts where `readingTimeMinutes` deviates by more than 2 minutes from actual word-count-computed value (words ÷ 200 wpm)
- [ ] Identify all entries in `client/src/data/blog-quizzes.ts` where `postId` does not match any `id` in `blog-data.json` (dangling quiz references)
- [ ] Count how many of the 121 blog posts have no entry in `blog-quizzes.ts` (missing quiz coverage)

---

## CQ1 — Content Schema Standards (Ground Truth Definitions)

These are the written contracts that gate validators and AI prompts must enforce. Nothing passes without meeting these.

### CQ1.1 — Question Schema Standard
- [ ] Define `question` field contract: 20–500 chars; must end with `?`; no markdown; no preamble filler ("Please explain in detail", "Could you describe"); must be one interrogative sentence
- [ ] Define `answer` field contract: 150–500 chars; plain text only (no `**`, no ` ``` `, no `#`); no filler openers ("Basically", "So", "Well", "In short"); no trailing ellipsis; must not start with a first-person phrase ("I think", "I believe")
- [ ] Define `explanation` field contract: ≥ 300 chars total; ≥ 2 `## ` section headers; every fenced code block must have a language identifier (` ```python `, ` ```go `, etc.); must not repeat the `answer` field verbatim as its first sentence
- [ ] Define `diagram` field contract: if non-null, must begin with a valid Mermaid diagram type keyword; must have ≥ 4 nodes or edges; must include at least one `style` or `classDef` line for visual quality; diagram must be topically relevant to the question
- [ ] Define `eli5` field contract: 50–500 chars; must include at least one analogy signal word ("like", "imagine", "think of", "similar to", "just as"); must not use technical jargon without a plain-language explanation
- [ ] Define `tags` field contract: array of 2–8 items; each tag is lowercase, hyphenated, no spaces, no uppercase; tags must be semantically related to the `channel` and `subChannel`
- [ ] Define `companies` field contract: array (may be empty `[]`, never null); each entry must be a real company name; define an allow-list of ~200 top tech companies for validation
- [ ] Define `voiceKeywords` field contract: if non-null, comma-separated string of 3–10 terms; no markdown; terms must be extractable keywords from the `answer` or `explanation`
- [ ] Define `difficulty` enum: exactly `["beginner", "intermediate", "advanced"]`; no other values permitted
- [ ] Define `channel` / `subChannel` contract: `channel` must match the filename of the channel JSON it lives in (e.g., question in `algorithms.json` must have `"channel": "algorithms"`); `subChannel` must be a valid sub-topic of that channel (define per-channel subChannel lists)
- [ ] Define `videos` field contract: if non-null, object must have `shortVideo` (valid YouTube URL) and `longVideo` (valid YouTube URL); both must match `https://www.youtube.com/watch?v=` or `https://youtu.be/` pattern
- [ ] Define `sourceUrl` field contract: if non-null, must be a valid HTTPS URL; domain must not be a generic search engine (google.com, bing.com, etc.); must return 200 status when fetched (add to slow validation queue, not blocking gate)

### CQ1.2 — Flashcard Schema Standard
- [ ] Define `front` field contract: 10–100 chars; phrased as a prompt or question; no markdown bold/headers; must end with `?` or be a completion-style prompt ending with `___`; must not be identical to `back`
- [ ] Define `back` field contract: 30–300 chars; plain prose or a short bullet list; no `##`/`###` headers; must directly and completely answer what `front` asks
- [ ] Define `hint` field contract: **required, not optional**; 15–150 chars; must give a partial clue without revealing the complete `back` answer; must differ from `front` and `back` by more than 80% character similarity
- [ ] Define `mnemonic` field contract: **required, not optional**; 10–200 chars; must function as a memory device (acronym expansion, rhyme, visual metaphor, narrative, or first-letter pattern); must not simply restate `back`
- [ ] Define `tags` field contract: array of 1–6 lowercase hyphenated strings; at least one tag must overlap with the parent question's tags (when `questionId` is set)
- [ ] Define `questionId` field contract: if non-null, must reference an `id` that exists in the corresponding channel's questions JSON; must not be a dangling reference
- [ ] Define `difficulty` enum: exactly `["beginner", "intermediate", "advanced"]`; must match the difficulty of the source question when `questionId` is set
- [ ] Define `channel` contract: must exactly match one of the 93 known channel filenames

### CQ1.3 — Blog Post Schema Standard (React SPA — blog-data.json)
- [ ] Define `title` contract: 30–80 chars; title case; must not end with a period; no clickbait patterns (no "You Won't Believe", "SHOCKING", "BEST EVER", numbers-only hooks like "7 Things")
- [ ] Define `excerpt` contract: 80–200 chars; plain text (no markdown); must be a complete sentence; must not repeat the `title` verbatim; must convey what the reader will learn
- [ ] Define `content` contract (assembled markdown string) — all of these must be true:
  - Hook paragraph ≥ 80 chars must appear before the first `## ` header
  - ≥ 3 `## ` section headers present
  - Exactly one `## Key Takeaways` section with ≥ 4 bullet points
  - `## Wrapping Up` or `## Conclusion` must be the last `## ` section
  - If source `diagram` was non-null, content must contain exactly one ` ```mermaid ` block
  - Zero citation clusters (regex: `\s\d+\s,\s\d+\s` patterns)
  - Zero noise strings: "Share This", "Did you know?", "References" as `## ` heading
  - Zero first-person language in prose ("I ", " we ", " our ", "I've")
  - Zero placeholder strings ("[PLACEHOLDER]", "TODO:", "INSERT HERE", "LOREM IPSUM")
  - No single prose line exceeds 400 chars (long lines indicate unbroken AI run-on paragraphs)
- [ ] Define `coverImage` contract: if non-null, must be a valid HTTPS image URL ending in `.jpg`, `.png`, or `.webp`; aspect ratio target 16:9 or 3:2
- [ ] Define `readingTimeMinutes` contract: integer between 3 and 25; must be within ±2 minutes of computed value (word count ÷ 200 wpm)
- [ ] Define `category` contract: must match one of the 93 known channel names
- [ ] Define `tags` contract: array of 2–8 lowercase hyphenated strings
- [ ] Define `difficulty` enum: exactly `["beginner", "intermediate", "advanced", "expert"]`
- [ ] Define `author` contract: non-empty string; must not be the raw string "AI" alone; must be a full persona name (e.g., "TechExpert AI" is acceptable; "AI" is not)
- [ ] Define `publishedAt` contract: valid ISO 8601 date string; must not be a future date relative to generation time

### CQ1.4 — Blog Post Frontmatter Standard (Astro static site)
- [ ] Define required frontmatter fields in `blog-astro/src/content/config.ts` Zod schema: `title`, `slug`, `publishedAt`, `excerpt` are **required with validation messages**; all others optional
- [ ] Define `sources` array contract: if present, each entry must have `title` (non-empty string), `url` (valid HTTPS URL), `type` (one of: `"article"`, `"docs"`, `"paper"`, `"video"`, `"book"`, `"github"`)
- [ ] Define `featured` contract: boolean; at most 10% of the full post corpus should have `featured: true`; flag if more than 15 posts are featured (dilutes meaning)
- [ ] Define `readingTimeMinutes` contract: same as React SPA (3–25 range, word-count consistent)
- [ ] Define that `channel` is always derivable from `category` via Zod `.transform()`; confirm the 5 legacy posts that use non-standard categories are all handled by the transform

### CQ1.5 — Blog Quiz Schema Standard
- [ ] Define `BlogQuizQuestion` interface contract: must have `id` (unique string), `prompt` (20–200 chars, ends with `?`), `hint` (15–100 chars), **and `answer`** (20–300 chars plain text — this field is currently missing from the interface and must be added)
- [ ] Define minimum quiz size: ≥ 3 questions per quiz, ≤ 8 questions
- [ ] Define `postId` integrity rule: every quiz entry's `postId` must match an `id` that exists in `blog-data.json`; any orphaned quiz entry is invalid
- [ ] Define quiz coverage expansion priority order: first expand to posts with `readingTimeMinutes ≥ 8` and `difficulty: "advanced"` or `"expert"`, then descending by estimated page importance

---

## CQ2 — Quality Gate Architecture

Gates must exist at every pipeline stage — not just at AI generation time.

### CQ2.1 — Upgrade existing Question Quality Gate (`quality-gate-graph.js`)
- [ ] Add a synchronous **Structure Pre-Check** that runs before any AI scoring call and immediately rejects on failure:
  - `question` present, string, 20–500 chars, ends with `?`
  - `answer` present, string, 150–500 chars, zero markdown
  - `explanation` present, string, ≥ 300 chars
  - `difficulty` is exactly one of the 3 valid enum values
  - `channel` non-empty and matches a known channel name
  - `tags` is a non-empty array
- [ ] Upgrade **Content Score** dimension (currently 30%) to check:
  - `explanation` has ≥ 2 `## ` headers
  - All fenced code blocks in `explanation` have language identifiers
  - `answer` contains zero markdown formatting
  - Zero first-person phrases in any field
  - Zero placeholder text
  - No trailing ellipsis on `answer`
- [ ] Upgrade **Media Score** dimension (currently 10%) to check:
  - If `diagram` non-null: starts with valid Mermaid keyword, has ≥ 4 edges/nodes
  - If `videos` non-null: both `shortVideo` and `longVideo` are valid YouTube URL formats
  - If `eli5` non-null: contains ≥ 1 analogy signal word
- [ ] Add new **Field Completeness Score** dimension (15% weight, new):
  - +3 pts: `eli5` present and non-empty
  - +3 pts: `diagram` present, non-null, and syntactically valid
  - +3 pts: `companies` is a non-empty array
  - +3 pts: `sourceUrl` present and is a valid HTTPS URL
  - +3 pts: `voiceKeywords` present and non-empty
- [ ] Re-balance dimension weights to sum exactly to 100%: Duplicate (20%), Content (25%), Difficulty (15%), Relevance (20%), Media (10%), Completeness (10%)
- [ ] Raise the **Pass** threshold from 70 → 75; raise **Needs Review** floor from 55 → 60; keep **Rejected** at < 60
- [ ] Add a **post-save re-validation** step: after the question is written to disk, re-read the JSON and re-run the structural pre-check; abort and delete the file if it fails
- [ ] Log every gate decision to `data/quality-gate-rejections.json` with: timestamp, content type, question ID, all dimension scores, failure reasons in plain English

### CQ2.2 — Create Flashcard Quality Gate (does not exist yet)
- [ ] Define new `FlashcardQualityGate` at `script/ai/graphs/flashcard-quality-gate.js`
- [ ] **Structure Pre-Check** (synchronous, blocks disk write):
  - `front` present, 10–100 chars, no markdown bold/headers
  - `back` present, 30–300 chars
  - `hint` present and non-null (must enforce as required — currently the field is optional in practice)
  - `mnemonic` present and non-null (must enforce as required)
  - `channel` matches one of the 93 known channel names
  - `difficulty` is one of the 3 valid enum values
  - `tags` is an array with ≥ 1 item
  - `front` and `back` are not identical strings
- [ ] **Quality Scoring** (AI-assisted, 5 dimensions scored 1–10 each):
  - Atomicity: does `front` test exactly one concept?
  - Clarity: is `back` comprehensible without additional context?
  - Hint quality: does `hint` give a partial clue without revealing the full answer?
  - Mnemonic quality: is `mnemonic` a genuinely useful memory device?
  - Front-back consistency: does `back` directly answer what `front` asks?
- [ ] Define thresholds: average ≥ 7.0 → approved; 5.0–6.9 → needs-review; < 5.0 → rejected
- [ ] Define **Critical Auto-Rejections** regardless of score: `front` === `back` verbatim; `hint` contains the complete `back` text; `mnemonic` is empty, "N/A", or "none"; `front` exceeds 100 chars

### CQ2.3 — Create Blog Post Quality Gate (does not exist yet)
- [ ] Define new `BlogQualityGate` at `script/ai/graphs/blog-quality-gate.js`
- [ ] **Structure Pre-Check** (synchronous, runs on the assembled `content` string):
  - Hook paragraph ≥ 80 chars present before first `## ` header
  - Count of `## ` headers ≥ 3
  - `## Key Takeaways` section present with ≥ 4 bullet items
  - Closing `## Wrapping Up` or `## Conclusion` is the last `## ` header
  - Zero citation cluster patterns (`\s\d+\s,\s\d+\s`)
  - Zero noise strings (regex-scanned)
  - Zero first-person pronouns in prose
  - Zero placeholder text strings
  - Mermaid fence count matches source `diagram` presence (0 or exactly 1)
  - `readingTimeMinutes` within ±2 of word-count-derived estimate
- [ ] **Quality Scoring** (AI-assisted, max 100 pts):
  - Hook quality: does the opener reference a real-world incident or compelling concrete scenario? (0–20)
  - Technical depth: is the content substantive beyond surface-level definitions? (0–20)
  - Structural variety: does the post mix prose, bullet lists, and code examples? (0–15)
  - Key Takeaways quality: are the bullets concrete and actionable (not restatements of section titles)? (0–15)
  - Mermaid diagram relevance: does the diagram accurately illustrate the post's core concept? (0–15; scored 0 if no diagram)
  - Source quality: are ≥ 4 external sources referenced with real HTTPS URLs? (0–15)
- [ ] Thresholds: ≥ 75 → published; 55–74 → draft (needs human review); < 55 → rejected
- [ ] Critical auto-rejections: word count < 400, no `## ` headers at all, `title` is character-for-character identical to the source question text

### CQ2.4 — Create unified validation CLI runner
- [ ] Define `script/validate-all.mjs` accepting `--type <questions|flashcards|blog|all>` and `--channel <name>` flags
- [ ] Output must include: JSON report AND human-readable summary with counts (total, passed, needs-review, failed) broken down by severity (critical / high / medium / low)
- [ ] Integrate into relevant GitHub Actions workflows: add a validation step that runs `node script/validate-all.mjs --type all` and marks the build as failed if any **critical** severity findings exist
- [ ] Implement `--fix` flag mode that auto-corrects low-risk structural issues without AI calls: trim trailing whitespace, normalise enum casing to lowercase, strip citation cluster patterns, normalise tag format (lowercase, hyphenated)
- [ ] Implement `--report` flag mode that writes the full JSON report to `data/quality-metrics.json` for dashboard consumption

---

## CQ3 — Rendering Gap Remediation Plan

These are the concrete rendering gaps identified by cross-referencing every schema field against every renderer.
Each task specifies the exact component, the exact missing capability, and the exact data field it should consume.

### CQ3.1 — `MarkdownRenderer.tsx` (React SPA blog renderer)
- [ ] **Add H1 support**: the parser loop has no `line.startsWith("# ")` branch — add it; render with appropriate heading style (posts should rarely use H1 since the page title is already H1, but the parser must not silently drop it)
- [ ] **Add Markdown image support**: add parser branch for `![alt text](url)` syntax → render as `<img>` with `loading="lazy"`, `alt` attribute, responsive CSS max-width, and a fallback skeleton on load error
- [ ] **Add table support**: add a multi-line parser for GFM `| col | col |` tables → render as a styled `<table>` with `<thead>`, `<tbody>`, striped rows, and horizontal scroll wrapper for mobile
- [ ] **Add blockquote support**: add parser branch for lines starting with `> ` → render as `<blockquote>` with left accent border; the existing special `> **Case Study —` teal callout must continue to work and not conflict with this base blockquote support
- [ ] **Add task list support**: add parser branch for `- [ ]` and `- [x]` patterns → render as styled read-only checkboxes (not interactive `<input type="checkbox">`)
- [ ] **Fix nested inline formatting**: the `renderInline` function currently uses sequential regex passes which breaks bold-inside-links, italic-inside-code, etc.; replace with a recursive descent inline parser that handles arbitrarily nested inline formatting
- [ ] **Fix citation stripping false positives**: the `removeCitations` regex must add a negative lookahead to protect version strings — patterns like `Node 18`, `v1.2`, `Python 3`, `ES2015` must not be stripped; only standalone superscript-style number clusters are targets
- [ ] **Fix aggressive Conclusion deduplication**: the preprocessor that strips "duplicate" Conclusion sections must only remove the section if the `## Conclusion` or `## Wrapping Up` heading appears more than once — never strip the first (and only valid) occurrence
- [ ] **Enforce mermaid block limit**: after preprocessing, assert that the assembled content has ≤ 3 ` ```mermaid ` blocks; if more are detected, log a console warning and render only the first 3 with a "diagram limit reached" notice after the third

### CQ3.2 — `PostDetailPage.tsx` (React SPA blog page)
- [ ] **Render `excerpt` field in the UI**: `excerpt` is currently used only for SEO metadata (`<meta>` tags) and never displayed visually; add it as a styled lead paragraph (larger font, lighter weight) between the post title/metadata row and the article body
- [ ] **Render `updatedAt` field**: if a post has an `updatedAt` date that differs from `publishedAt`, show "Updated [relative date]" beneath the publish date line
- [ ] **Render `sourceUrl` as a source chip**: if the post's source question had a `sourceUrl`, surface it as a "Primary Source →" chip link at the bottom of the article body (below the conclusion, above the knowledge check)

### CQ3.3 — `AnswerPanel.tsx` (Question Q&A renderer)
- [ ] **Render `companies` field**: the `Question` type has a `companies` array that is never displayed; add a "Frequently asked at:" row with company chips (pill badges) positioned after the difficulty/channel metadata row, above the Recall Rating bar
- [ ] **Unify `tldr` vs `answer` field**: the type has both `tldr` and `answer` but the component only reads `question.answer`; establish `answer` as canonical, add `tldr ?? answer` fallback, and document the canonical choice in a code comment so future maintainers don't re-introduce the split
- [ ] **Render `lastUpdated` field**: add "Last updated: [relative time]" in small text in the metadata row beside publishedAt
- [ ] **Render `sourceUrl` field**: if `question.sourceUrl` is non-null, render a "Primary Source" external link below the explanation section
- [ ] **Surface `voiceKeywords` in context**: when `question.voiceSuitable === 1`, add a collapsible "Voice Practice Keywords" section below the explanation showing the `voiceKeywords` string parsed as comma-separated chips — these keywords are currently only used inside `VoiceInterview.tsx` but providing them inline gives immediate value
- [ ] **Sanitise images in explanation markdown**: `react-markdown` renders `<img>` tags from markdown but the current config has no URL allowlist; add a `rehype` plugin or custom component override that validates image URLs against an allowlist or blocks `data:` and `javascript:` URLs

### CQ3.4 — `QuestionViewer.tsx` (Question browsing container)
- [ ] **Render `companies` chips in the question header**: company chips should be visible before the user reveals the answer (they provide context, not spoilers) — show them in the header metadata row beside the difficulty badge
- [ ] **Render `isNew` badge**: if `question.isNew === 1`, show a styled "New" badge next to the difficulty chip in the header
- [ ] **Add keyboard shortcut for ELI5 toggle**: `eli5` content is buried in the answer panel but has no dedicated keyboard shortcut; add `E` key to expand/collapse the ELI5 section; document it in the existing keyboard shortcut overlay

### CQ3.5 — `Flashcards.tsx` (Flashcard review surface)
- [ ] **Render `hint` field on card back**: `hint` exists in schema and data but is never rendered; add it as a collapsible "Hint" disclosure below the `back` text on the card's back face — collapsed by default on first flip, user must tap to expand (prevents automatic hint-reliance)
- [ ] **Render `mnemonic` field on card back**: add a "Memory Aid" section below the hint area, visually distinct (italic text, different left-border color, small brain icon); always visible once the card is flipped — it aids recall formation
- [ ] **Render `questionId` as a navigation link**: if `questionId` is non-null, add a "View full question →" text link at the bottom of the card back that routes to the corresponding question in QuestionViewer
- [ ] **Consistently display mastery level badge on card front**: the SRS library computes a mastery level 0–5 and labels exist ("New", "Learning", "Familiar", "Proficient", "Advanced", "Mastered") but the badge is not reliably shown on every card front; make it always visible in the top-right corner of the card front with a color scale (grey → blue → teal → green → orange → gold)
- [ ] **Enforce hint reveal delay**: `hint` section must only become interactable (expandable) after the user has spent ≥ 2 seconds on the card back — not immediately on flip — prevents reflexive hint-checking; use a `setTimeout` gate on the disclosure component

### CQ3.6 — `BlogKnowledgeCheck.tsx` (Post-article quiz)
- [ ] **Add `answer` field to `BlogQuizQuestion` interface**: currently the interface has `id`, `prompt`, and `hint` but no `answer`; add `answer: string` as a required field
- [ ] **Add `answer` values to all existing quiz entries in `blog-quizzes.ts`**: every one of the existing quiz question objects must have an `answer` string added (this is a data authoring task, not just a type change)
- [ ] **Implement reveal-answer UX**: after the user submits their self-assessment or clicks "Skip", reveal the `answer` field in a styled "Correct Answer" card using the same visual pattern as `RecallGate`'s reveal
- [ ] **Add post-quiz summary card**: after all questions in a quiz are answered, display a summary panel: questions attempted, self-assessed correct count, time elapsed, and a "Back to article" / "Next post" action
- [ ] **Gate rendering on quiz completeness**: add a runtime check that skips rendering `BlogKnowledgeCheck` entirely for any quiz where any question has no `answer` field — prevents users seeing unanswerable quiz prompts

### CQ3.7 — Astro Static Blog rendering verification
- [ ] **Audit `sources` array rendering in `BlogPost.astro`**: confirm the `sources` frontmatter array is rendered as a numbered reference list at the article bottom; flag posts where `sources` is empty but the prose contains reference-style links
- [ ] **Audit Mermaid client-side initialisation**: confirm that `mermaid.initialize()` is called after DOM load in `BaseLayout.astro` and that there are no race conditions when multiple diagrams exist on a page or on slow connections; confirm that failed diagrams show a styled error card, not blank space
- [ ] **Audit TOC heading scope**: confirm that `BlogPost.astro`'s TOC only includes `h2` and `h3` elements (not `h1`, not `h4`); confirm that anchor ID generation is slugified consistently between the Astro build and the React SPA `MarkdownRenderer.tsx` heading ID generation so shared content produces matching anchor links
- [ ] **Audit syntax highlighting parity**: Shiki (`github-dark`) is used in Astro; React SPA uses a custom regex highlighter in `MarkdownRenderer.tsx`; identify every language where the two renderers produce visually different output and document them; flag which gaps are worth closing vs acceptable
- [ ] **Audit RSS feed completeness** (`rss.xml.ts`): confirm `title`, `description` (from `excerpt`), `pubDate`, `link`, and `content:encoded` are populated for every item; flag any items with empty `description`
- [ ] **Audit sitemap completeness** (`sitemap.xml.ts`): confirm all 121 posts are in the sitemap; confirm `<lastmod>` is populated from `publishedAt` or `updatedAt` for every entry; confirm post URL structure in sitemap matches actual built URL structure

---

## CQ4 — Cross-Surface Consistency

Issues that span multiple content types or rendering surfaces and require coordinated fixes.

### CQ4.1 — Slug / ID integrity
- [ ] Confirm that `id` values in `blog-data.json` match the `postId` keys used in `blog-quizzes.ts` — write a cross-reference check script
- [ ] Confirm that `slug` values in `blog-data.json` match the slugs used in Astro's `blog-astro/src/pages/blog/[slug].astro` route generation
- [ ] Confirm that `questionId` in every flashcard entry resolves to a real question `id` in the corresponding questions channel file — write a referential integrity check
- [ ] Confirm that `AnswerPanel.tsx`'s call to `BlogService.getByQuestionId(question.id)` returns the correct related blog post — verify the linking logic is consistent between how blog posts store their source question ID and how questions store their IDs

### CQ4.2 — Difficulty consistency across derived content
- [ ] Confirm that a question's `difficulty` matches the `difficulty` of its derived flashcard(s) when `questionId` is set
- [ ] Confirm that a question's `difficulty` is consistent with the blog post derived from it (may legitimately differ — if so, document the rule: e.g., a blog post about an advanced topic may be rated `intermediate` if the treatment is introductory)
- [ ] Define and document a canonical tie-breaker rule for difficulty mismatches between source questions and derived content

### CQ4.3 — Tag taxonomy and normalisation
- [ ] Build a master tag taxonomy: a canonical list of all allowed tag values across all three content types (questions, flashcards, blog posts) with defined groupings
- [ ] Flag any tag that appears in questions but not flashcards (or vice versa) for the same topic — these are taxonomy gaps that create filter inconsistencies
- [ ] Define tag normalisation rules: lowercase, hyphenated, singular preferred over plural (e.g., "algorithm" not "algorithms"); no duplicate concepts under different names
- [ ] Document the normalisation rules and apply them atomically to all three data stores

### CQ4.4 — Channel naming consistency
- [ ] Confirm that the 93 channel names in `data/questions/` exactly match channel values used in `data/flashcards/all.json`, `client/public/blog-data.json`, and `blog-astro` frontmatter
- [ ] Confirm that the React SPA's channel filter UI (blog listing, flashcard filter, channels page) all use the same canonical channel name list — no aliases, no typos
- [ ] Identify any channel name variants (e.g., "system-design" vs "system_design") across the codebase and define the canonical spelling; update all usages

### CQ4.5 — Reading time consistency
- [ ] Define a single utility function for computing `readingTimeMinutes`: `Math.max(1, Math.min(60, Math.round(wordCount / 200)))` — document it as the canonical formula
- [ ] Confirm `scripts/generate-blog-static.mjs` uses this exact formula
- [ ] Confirm the Astro blog's reading time display uses the same formula
- [ ] Flag any posts where the stored `readingTimeMinutes` deviates by more than 2 minutes from the re-computed value and queue them for correction

---

## CQ5 — Pipeline Integration

Quality gates are only useful if they are enforced at every write point in the pipeline.

### CQ5.1 — Generation-time gate enforcement
- [ ] Integrate upgraded Question Quality Gate (CQ2.1) into `generate-question.js` and `question-graph.js` — block the disk write and log to rejections file if the gate returns `rejected`
- [ ] Integrate new Flashcard Quality Gate (CQ2.2) into `flashcard-bot.js` and `flashcard-graph.js` — block disk write on rejection
- [ ] Integrate new Blog Quality Gate (CQ2.3) into `generate-blog.js` and `blog-graph.js` — block disk write on rejection; gate must run after content assembly, not before
- [ ] All three gates must write rejection details to `data/quality-gate-rejections.json` with: timestamp, content type, content ID/title, all dimension scores, failure reasons as plain-English strings
- [ ] All three gates must emit a single structured log line to stdout: `[GATE] <type> <id> → APPROVED (82/100)` or `[GATE] <type> <id> → REJECTED (41/100): answer too short, no diagram`

### CQ5.2 — CI / pre-commit gates
- [ ] Add lint step to CI that runs `node script/validate-all.mjs --type all` — fail the build on any **critical** severity finding
- [ ] Add structural integrity check step: cross-reference every flashcard `questionId` against question files — fail build if dangling references exist
- [ ] Add blog quiz integrity check: confirm all `postId` values in `blog-quizzes.ts` exist in `blog-data.json` — fail build if any are orphaned
- [ ] Add Mermaid syntax check step: use `mmdc --input <file> --output /dev/null` (or a Node-based Mermaid parser) on all question `diagram` fields and blog mermaid blocks — fail build on parse error
- [ ] Integrate quality-metrics report generation: after the validation step, run `node script/validate-all.mjs --report` and commit the updated `data/quality-metrics.json` with `[skip ci]`

### CQ5.3 — Runtime serve-time safety gates (non-blocking)
- [ ] Add `contentSanityCheck(content: string): string[]` function in `MarkdownRenderer.tsx` that returns a list of detected structural issues (unclosed code fences, malformed mermaid, orphaned HTML tags) and logs them as `console.warn` with the post ID — never throws, never breaks rendering
- [ ] Add `validateQuestionShape(question: Question): void` function in `AnswerPanel.tsx` that logs `console.warn` for missing required fields (`answer`, `explanation`) with the question `id` for traceability — runs once on mount
- [ ] Add runtime checks in `Flashcards.tsx` for cards where `front === back` or `hint === null` — render a styled "incomplete card" placeholder card instead of the broken content; include the card ID in the placeholder for debugging
- [ ] Add gate in `BlogKnowledgeCheck.tsx` that checks every question object for the presence of an `answer` field before rendering — if any question lacks `answer`, skip rendering the entire `BlogKnowledgeCheck` for that post and log a warning with the post ID and missing question IDs

---

## CQ6 — Rendering Quality Standards (Visual / UX Spec)

These are the visual and interaction standards every rendering surface must meet. These are design specifications, not code tasks.

### CQ6.1 — Blog post rendering quality spec
- [ ] **Code blocks**: background must be dark (`#1e1e1e` or design-system equivalent); font must be monospace; language label must appear in the top-right corner of the block; line numbers optional
- [ ] **Mermaid diagrams**: must be interactive (pan + zoom); must have an "expand to fullscreen" button; must render a styled error card (not blank space) if Mermaid parsing fails; error card must show the first line of the diagram source for debugging
- [ ] **`## Key Takeaways` section**: must render with the accent color heading and decorative dividers (currently implemented in `MarkdownRenderer.tsx` — verify this renders correctly for all 121 posts, not just some)
- [ ] **Blockquote / Case Study callouts** (`> **Case Study —`): must use the teal card callout style with a distinct left header and body layout (currently implemented — verify it activates for every occurrence, not just the first)
- [ ] **Reading progress bar**: must activate only when the article body is taller than the viewport; must reset to 0% immediately on route change; must not flicker on initial load
- [ ] **Table of Contents**: must highlight the active section using IntersectionObserver; must not show sections outside the initial viewport on load; must collapse to a disclosure on mobile; must update active state smoothly without layout shift
- [ ] **`coverImage` fallback**: if `coverImage` is null or the image URL fails to load, render a styled gradient placeholder incorporating the post `category` name and `difficulty` chip — never show a broken image icon

### CQ6.2 — Question rendering quality spec
- [ ] **`diagram` section container**: must always appear in a visually distinct container with a contextual title derived from the diagram type ("Flow Diagram" for flowchart, "Sequence Diagram" for sequenceDiagram, etc.) — never render diagram inline with prose
- [ ] **`eli5` section**: must always use a visually distinct style (speech bubble, warm background, "Simple Explanation" label) that unambiguously signals it is a simplification — not a plain prose paragraph
- [ ] **`companies` chips**: must use pill badge styling; use recognisable styling (not arbitrary brand colors unless those are provided); never render as raw comma-separated text inline
- [ ] **Recall rating bar** (Again / Hard / Good / Easy): must always be the first interactive element presented after the answer is revealed, positioned above the `answer` text; must not be skippable visually
- [ ] **YouTube embeds**: must use lazy loading — not fetched or rendered until the user scrolls to the embed; must display a thumbnail-with-play-button overlay before interaction; must never auto-play

### CQ6.3 — Flashcard rendering quality spec
- [ ] **Flip animation**: must complete in ≤ 300ms total; if Framer Motion is slow or unavailable, fall back to a CSS-only `perspective` + `rotateY` transition
- [ ] **Mastery level badge color scale**: New → grey; Learning → blue; Familiar → teal; Proficient → green; Advanced → orange; Mastered → gold — this scale must be applied consistently on every card front, no exceptions
- [ ] **Hint disclosure timing**: the `hint` section must only become expandable after the user has been on the card back for ≥ 2 seconds — implement with a `setTimeout` that enables the disclosure trigger; the 2-second delay must be clearly communicated with a visual cue (e.g., dimmed hint button that becomes active)
- [ ] **Mnemonic visual treatment**: `mnemonic` text must always be visually distinct from `back` answer text: italic, different left border color, small memory-aid icon — must not be confused with the answer
- [ ] **Swipe gesture thresholds**: drag distance ≥ 80px must commit the rating; < 80px must snap back to center with a spring animation; the 80px threshold must be consistent across pointer and touch events; document the pixel value in a named constant, not a magic number

---

## CQ7 — Monitoring & Ongoing Quality

Quality is not a one-time gate — it must be continuously measured.

### CQ7.1 — Quality metrics dashboard
- [ ] Define `data/quality-metrics.json` schema: written by `validate-all.mjs --report`; must contain: `generatedAt` (ISO timestamp), `overallPassRate` (%), per-type pass rates, top 10 failure reasons by count, trend delta vs previous run
- [ ] Add a "Data Quality" card to `EventsDashboard.tsx` that reads `quality-metrics.json` and displays pass rates with colour-coded indicators (≥ 90% green, 75–89% yellow, < 75% red)
- [ ] Define a weekly scheduled GitHub Actions job that runs `node script/validate-all.mjs --type all --report` on the full corpus and commits the updated `data/quality-metrics.json` with `[skip ci]`

### CQ7.2 — Regression prevention rules
- [ ] Document in `CONTRIBUTING.md`: every new question generator script must import and call the question quality gate before writing to disk
- [ ] Document in `CONTRIBUTING.md`: every new flashcard batch import must run the flashcard quality gate
- [ ] Document in `CONTRIBUTING.md`: the blog static generation script must run the blog quality gate as the final step before writing to `blog-data.json`
- [ ] Define a "golden fixture set": 10 hand-curated questions (2 per difficulty level × 2 representative channels) that must always pass the quality gate at 100%; any gate threshold change must be validated against the golden set before merging

### CQ7.3 — Content freshness queue
- [ ] Define staleness threshold: questions with `lastUpdated` > 12 months old are flagged as "stale" and added to a human review queue in `data/stale-content-queue.json`
- [ ] Define completeness improvement bot queue: flashcards missing `hint` or `mnemonic` are added to the bot work queue with `priority: "medium"` for regeneration
- [ ] Define diagram gap queue: questions with `diagram: null` in the top-20-most-viewed channels are added to a bot work queue for diagram generation with `priority: "low"`
- [ ] Define quiz coverage expansion queue: blog posts with no entry in `blog-quizzes.ts` are ordered by `readingTimeMinutes` descending and added to a quiz authoring queue — longer posts benefit most from comprehension checks

---

## CQ — Execution Order

| Priority | Task Group | Rationale |
|----------|-----------|-----------|
| **P0 — Must do first** | CQ0.1, CQ0.2 | Cannot define gates without knowing actual data shape and quality |
| **P0 — Must do first** | CQ1.1, CQ1.2, CQ1.3 | Schema standards are the source of truth for all gate validators |
| **P1 — High** | CQ2.1, CQ2.2, CQ2.3, CQ2.4 | Gates are the core deliverable; build after standards are written |
| **P1 — High** | CQ3.1, CQ3.2, CQ3.3, CQ3.4, CQ3.5 | Rendering gaps mean valid data is silently dropped — direct user impact |
| **P2 — Medium** | CQ1.4, CQ1.5 | Astro and quiz schema standards — public site impact |
| **P2 — Medium** | CQ3.6, CQ3.7 | Quiz and Astro rendering gaps — public site quality |
| **P2 — Medium** | CQ4.1, CQ4.2, CQ4.3, CQ4.4, CQ4.5 | Cross-surface consistency — prevents subtle accumulating bugs |
| **P3 — Standard** | CQ5.1, CQ5.2, CQ5.3 | Pipeline integration makes gates permanent rather than one-off checks |
| **P3 — Standard** | CQ6.1, CQ6.2, CQ6.3 | Visual quality specs — defined here, implemented as a second pass |
| **P4 — Ongoing** | CQ7.1, CQ7.2, CQ7.3 | Monitoring and regression prevention — long-term corpus health |
