# UI/UX Deep Scan — Fix Plan

> Full audit covering every major page and component. No code changes made yet.

---

## Progress Tracker

| Metric | Count |
|--------|-------|
| **Total Issues** | 50 |
| ✅ Done | 0 |
| 🔄 In Progress | 0 |
| ⏸️ Blocked | 0 |
| ⏳ Remaining | 50 |

### By Severity
| Severity | Done | Remaining |
|----------|------|-----------|
| Critical (5) | 0 | 5 |
| High (2) | 0 | 2 |
| Major (7) | 0 | 7 |
| Moderate (17) | 0 | 17 |
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
