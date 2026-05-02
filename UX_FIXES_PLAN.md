# Open Interview — UX Audit & Fixes Plan

> **Status**: Audit complete. Fixes not yet applied.
> **Audited**: May 2026 — via code review + screenshot analysis across all 40+ routes
> **Test suite**: `tests/e2e/` — Playwright specs covering every issue below

---

## Summary

| Priority | Count | Issues |
|----------|-------|--------|
| P0 — Critical | 3 | Onboarding gate, broken anchor links, anchor-to-new-tab |
| P1 — High | 7 | Silent redirect, hardcoded slugs, design token mismatch, missing skeletons, missing error states |
| P2 — Medium | 6 | Flashcards layout break, mobile overlap, tiny fonts, low contrast, missing sidebar routes, dead code |
| P3 — Low | 4 | Missing test IDs, missing ARIA, mic permission UX, breadcrumb links |
| **Total** | **20** | |

---

## P0 — Critical (Fix First)

---

### P0-01 — Onboarding modal blocks all direct URL navigation

**File**: `client/src/components/SubscriptionGate.tsx`, `client/src/components/OnboardingFlow.tsx`

**Symptom**: Every fresh browser session triggers the 3-step onboarding flow ("What's your role?") on top of ALL routes. Navigating to `/channels`, `/flashcards`, `/voice-interview`, `/events`, or any other route lands on the onboarding overlay, not the intended page. The user has no visual indication that they are on the right page underneath.

**Root cause**: `SubscriptionGate` wraps all of `App.tsx`. It reads `needsOnboarding` from `UserPreferencesContext`. If the user has no preferences in `localStorage`, `needsOnboarding` is `true` and the full-screen `OnboardingFlow` replaces all content.

**Fix plan**:
1. Read `UserPreferencesContext` to check how `needsOnboarding` is derived.
2. Change `SubscriptionGate` so it renders children on all routes except `/` (homepage). Direct deep-links should always land on the correct page, then show a dismissible banner or side-drawer inviting onboarding.
3. OR: Store the target URL before the onboarding overlay and redirect to it after completion.
4. The "Skip" button label should be changed to "Skip for now" and made more prominent (move from top-right corner to a centered, clearly labelled button).
5. Add `localStorage` check — if user has already skipped or completed once, never block again.

**Test**: `tests/e2e/01-onboarding.spec.ts`

---

### P0-02 — Home page footer nav anchor links open in new tab

**File**: `client/src/pages/home-facelift.tsx` line ~848–881

**Symptom**: The footer navigation column has links `{ label: "Features", href: "#features" }` and `{ label: "Community", href: "#community" }`. The click handler at line ~880 calls `window.open(link.href, "_blank")` for any link that is not recognised as an internal app route. Since `#features` and `#community` don't start with `/`, they are treated as external links and opened in a **new tab** — which shows a blank page.

**Root cause**: The footer nav handler uses `window.open(..., "_blank")` as the external fallback. Anchor hash links should instead use `document.querySelector('#features')?.scrollIntoView()` or a `<a href="#features">` tag directly.

**Fix plan**:
1. In the link-click handler in `home-facelift.tsx`, add a branch: if `href.startsWith('#')`, call `document.getElementById(href.slice(1))?.scrollIntoView({ behavior: 'smooth' })` instead of `window.open`.
2. Replace the `<a href="#features">` links in the top hero nav (lines 220–229) with proper scroll-to handlers or keep as `<a>` tags (they already work correctly since they're standard `<a>` elements on the homepage).

**Test**: `tests/e2e/02-navigation.spec.ts`

---

### P0-03 — Anchor nav links break when navigating from non-home pages

**File**: `client/src/pages/home-facelift.tsx` lines 220–229

**Symptom**: The sticky hero nav bar on the homepage has `<a href="#features">`, `<a href="#topics">` etc. These work only when the user is already on `/`. If a user is on `/channels` and somehow sees these links (e.g., from a shared component), clicking them navigates to `/#features` as a full page load losing SPA state.

**Root cause**: Hash links in a SPA using wouter need to either be restricted to the homepage component or use programmatic scrolling instead.

**Fix plan**:
1. These nav items are inside the homepage component only — verify they don't appear in any shared nav component.
2. Add `onClick` handler that calls `window.location.hash = 'features'` with smooth scroll if already on `/`, otherwise navigate to `/#features`.
3. Verify all four section IDs exist: `id="features"` ✅ (line 602), `id="topics"` ✅ (line 505), `id="articles"` ✅ (line 411), `id="community"` ✅ (line 669).

**Test**: `tests/e2e/02-navigation.spec.ts`

---

## P1 — High

---

### P1-01 — `/stats` silently redirects to `/profile` with no feedback

**File**: `client/src/pages/StatsRedirect.tsx`

**Symptom**: The page at `/stats` immediately redirects to `/profile` with no visible content, loading state, or toast. Any user who bookmarked `/stats` or follows an old link gets silently teleported with no explanation.

**Fix plan**:
1. Show a brief toast or inline banner: "Stats have moved to your Profile page."
2. OR: Restore a standalone Stats page at `/stats` with a proper stats dashboard (there is `StatsRedesigned.tsx` already — wire it up).
3. At minimum, add a 300ms delay with a redirect notice before navigating.

**Test**: `tests/e2e/02-navigation.spec.ts`

---

### P1-02 — Home page hardcodes three specific blog article slugs

**File**: `client/src/pages/home-facelift.tsx` lines 381–403

**Symptom**: Three featured article cards link to `/blog/system-design-url-shortener`, `/blog/react-reconciliation`, `/blog/cap-theorem-explained`. These slugs are hardcoded. If any of these posts don't exist in the static data (e.g., after content changes), clicking a card navigates to a 404/not-found page.

**Fix plan**:
1. Replace hardcoded article data with a dynamic fetch from `/data/blog-posts.json` (or equivalent static file).
2. Show a loading skeleton while the fetch is pending.
3. Filter out articles that fail to resolve before rendering.
4. Add a fallback "View all articles" CTA if no articles are available.

**Test**: `tests/e2e/07-blog.spec.ts`

---

### P1-03 — ChallengeHome uses hardcoded Tailwind gray palette instead of CSS variables

**File**: `client/src/pages/ChallengeHome.tsx`

**Symptom**: The entire Challenges page (`/code`) uses raw Tailwind color classes: `bg-gray-900`, `bg-gray-800`, `text-gray-400`, `text-gray-500`, `border-gray-700`. These are hardcoded dark colors that work in the current dark theme but will be visually broken if a light mode is ever introduced, and they don't match the rest of the app's design tokens.

**Count**: 20+ instances of hardcoded gray classes across the file.

**Fix plan**:
1. Replace all `bg-gray-900` → `bg-card` or `bg-background`.
2. Replace `bg-gray-800` → `bg-muted`.
3. Replace `text-gray-400` → `text-muted-foreground`.
4. Replace `text-gray-500` → `text-muted-foreground/70`.
5. Replace `border-gray-700` → `border-border`.
6. Replace `text-white` → `text-foreground`.
7. Verify the page still looks correct after the swap.

**Test**: `tests/e2e/02-navigation.spec.ts` (smoke), visual regression

---

### P1-04 — Blog pages use a separate CSS variable system

**Files**: `client/src/pages/blog/PostDetailPage.tsx`, `client/src/pages/blog/post-facelift.tsx`, `client/src/pages/blog/AboutBlogPage.tsx`, `client/src/pages/blog/BlogSearchPage.tsx`

**Symptom**: Blog pages use CSS variables `--color-ink-muted`, `--color-surface-raised`, `--color-accent`, `--color-border` which are a separate naming convention from the main app's `--foreground`, `--muted-foreground`, `--border`. If either system is changed, blog pages are silently unaffected.

**Fix plan**:
1. Audit `index.css` to confirm whether `--color-ink-muted` etc. are defined. If they are (in a separate `:root` block), verify they map correctly to the main palette.
2. If they are NOT defined, the blog text will fall back to inherited color (likely causing invisible text).
3. Create a mapping comment in `index.css` documenting which variables correspond.
4. Long-term: migrate blog pages to use the shared CSS variables.

**Test**: `tests/e2e/07-blog.spec.ts`

---

### P1-05 — AllChannels page has no loading skeleton

**File**: `client/src/pages/AllChannels.tsx`

**Symptom**: The audit found `loading:false` for this page. While channels data loads from a static JSON file or context, there is no skeleton or spinner shown. On slow connections or first paint, the page renders empty with no visual feedback that content is loading.

**Fix plan**:
1. Add `isLoading` state from the data source (context or query).
2. Render a 6–9 card skeleton grid while loading (matching the `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` layout).
3. Each skeleton card should match the approximate height of a real channel card.

**Test**: `tests/e2e/03-channels.spec.ts`

---

### P1-06 — Bookmarks and Profile have no error state or server fallback

**Files**: `client/src/pages/Bookmarks.tsx`, `client/src/pages/Profile.tsx`

**Symptom**: Both pages read entirely from `localStorage`. If `localStorage` is unavailable (private browsing in certain browsers, storage quota exceeded, or corrupted data), both pages silently render empty or throw a parse error with no user-facing message.

**Fix plan**:
1. Wrap all `localStorage.getItem` / `JSON.parse` calls in try-catch.
2. Show a user-friendly empty state with a "Start practicing to see your data here" message when data is absent.
3. Add a localStorage read helper that safely returns a default value on parse failure.
4. For Profile: show a brief skeleton on initial mount while reading from storage.

**Test**: `tests/e2e/08-profile-bookmarks.spec.ts`

---

### P1-07 — CertificationPractice navigates to wrong channel

**File**: `client/src/pages/CertificationPractice.tsx` line ~479, ~496

**Symptom**: Two navigation calls use `navigate('/channel/${selectedCert.id}')`. Certification IDs (e.g., `aws-solutions-architect`) may not match the corresponding channel IDs (e.g., `system-design`, `cloud-computing`). This navigates the user to a non-existent channel URL showing a 404 or empty state.

**Fix plan**:
1. Add a `channelId` field to the certification data model linking each certification to its source channel(s).
2. Use `navigate('/channel/${selectedCert.channelId}')` instead.
3. If no mapping exists, navigate to `/channels` as a safe fallback.

**Test**: `tests/e2e/06-certifications.spec.ts`

---

## P2 — Medium

---

### P2-01 — Flashcards page bypasses AppLayout sidebar (inconsistent navigation)

**File**: `client/src/pages/Flashcards.tsx` line 144

**Symptom**: Flashcards uses `<AppLayout hideNav fullWidth>` which hides the sidebar and mobile bottom navigation bar. The user has no way to navigate to other sections of the app while reviewing flashcards, except for a back-to-home button. This is inconsistent with every other page.

**Fix plan**:
1. Remove `hideNav` from `AppLayout` in `Flashcards.tsx`.
2. Keep `fullWidth` if needed for the card display area.
3. Add an `X` close button within the flashcard view itself (not as the only navigation option) that returns to the channels page or previous page using `history.back()`.
4. Ensure the flashcard full-screen mode (while a card is active) doesn't obscure the sidebar on desktop.

**Test**: `tests/e2e/04-flashcards.spec.ts`

---

### P2-02 — Mobile bottom nav overlaps page content

**Files**: `client/src/components/layout/UnifiedNav.tsx`, `client/src/components/layout/AppLayout.tsx`

**Symptom**: The mobile bottom navigation bar is `fixed bottom-0 z-50`. `AppLayout` adds `pb-[calc(56px+env(safe-area-inset-bottom,0px))]` to offset content. However, several pages render their own full-height containers (`h-screen h-dvh`, `min-h-screen`) without inheriting this padding, causing the last card/button of the page to be hidden behind the nav bar.

**Affected pages**: Certifications (last certification card row), Channels (last row of channel cards), CodingChallenge, ChallengeHome.

**Fix plan**:
1. Audit all pages that use `h-screen`, `min-h-screen`, or `overflow-hidden` as their root container — they likely need explicit `pb-16` or `pb-[calc(56px+env(safe-area-inset-bottom,0px))]` on mobile.
2. Add a CSS utility class `.safe-bottom` that applies this padding and use it consistently.
3. Test on a 375px viewport.

**Test**: `tests/e2e/10-mobile.spec.ts`

---

### P2-03 — `text-[10px]` is unreadably small for statistics labels

**Files**: `client/src/pages/AllChannels.tsx` line 175, `client/src/pages/Certifications.tsx` lines 254–256

**Symptom**: Channel cards show stats (question count, progress %) in `text-[10px]` — 10px is below the WCAG minimum recommended body text size of 14px for paragraph text. These numbers are critical for user decision-making (e.g., "how many questions does this channel have?").

**Fix plan**:
1. Increase all `text-[10px]` instances in card components to at least `text-xs` (12px).
2. If space is a constraint, reduce the number of stats shown rather than the font size.
3. Certification cards: `text-[10px] text-muted-foreground` at lines 254–256 → `text-xs`.

**Test**: `tests/e2e/09-accessibility.spec.ts`

---

### P2-04 — 181+ low-contrast text instances across the app

**Files**: Throughout `client/src/pages/` — see detail below

**Symptom**:
- `text-gray-400` (#9ca3af on #0a0e1a) — contrast ratio ≈ 5.2:1 (borderline AA)
- `text-gray-500` (#6b7280 on #0a0e1a) — contrast ratio ≈ 3.1:1 (**FAILS** AA for normal text)
- `text-muted-foreground` at `hsl(220 15% 55%)` on `#0a0e1a` — contrast ratio ≈ 4.2:1 (borderline AA, fails for small text < 14px)
- `text-white/40`, `text-white/50` — rgba(255,255,255,0.4) on dark bg — contrast ratio ≈ 2.3:1 (**FAILS**)

**Most affected files**: `ChallengeHome.tsx` (20+ instances), `home-facelift.tsx` (10+ instances of `text-white/60`), all pages using `text-muted-foreground` on small text.

**Fix plan**:
1. Update `--muted-foreground` in `index.css` from `hsl(220 15% 55%)` to `hsl(220 15% 65%)` (lighter, passes AA for normal text).
2. Replace `text-gray-500` → `text-muted-foreground` everywhere.
3. Replace `text-white/40` and `text-white/50` → `text-white/70` minimum.
4. Audit all `text-[10px]` and `text-xs` + `text-muted-foreground` combinations — these compound the problem.

**Test**: `tests/e2e/09-accessibility.spec.ts`

---

### P2-05 — Valid pages missing from sidebar navigation

**File**: `client/src/components/layout/Sidebar.tsx`

**Symptom**: The following app routes exist and are functional but have no sidebar entry, making them undiscoverable except via direct URL:
- `/whats-new` — Changelog page
- `/notifications` — Notifications page
- `/docs` — Documentation page
- `/bot-activity` — Bot Activity page
- `/blog` — Blog (linked from home but not sidebar)

**Fix plan**:
1. Add "What's New" (with a `Sparkles` icon and a "NEW" badge when there are new items) to the sidebar under Progress.
2. Add "Notifications" with a bell icon and unread count badge.
3. Add "Blog" link to the sidebar under the Resources/Community section.
4. `/docs` and `/bot-activity` are lower traffic — consider adding them to an "More / Settings" section or the footer of the sidebar.

**Test**: `tests/e2e/02-navigation.spec.ts`

---

### P2-06 — Dead/orphaned page files consuming bundle size

**Files**:
- `client/src/pages/AllChannelsRedesigned.tsx` — not routed, superseded by `AllChannels.tsx`
- `client/src/pages/VoiceInterview.tsx` — not routed, superseded by `VoicePractice.tsx`
- `client/src/pages/TrainingMode.tsx` — not routed
- `client/src/pages/ChallengeList.tsx` — not routed
- `client/src/pages/CodeChallengesIndex.tsx` — not routed
- `client/src/pages/HomeRedesigned.tsx` — not routed, superseded by `home-facelift.tsx`
- `client/src/pages/StatsRedesigned.tsx` — not routed, superseded by `StatsRedirect.tsx`
- `client/src/pages/LearningPaths.tsx` — not routed, superseded by `UnifiedLearningPaths.tsx`
- `client/src/pages/MyPath.tsx` — not routed (duplicate of `UnifiedLearningPaths.tsx`)
- `client/src/pages/QuestionEditorDemo.tsx` — demo page, not routed

**Fix plan**:
1. Confirm none of these files are imported anywhere else.
2. Delete them from the codebase (or move to `_archive/` if historical reference is needed).
3. Verify the build still passes after deletion.

**Test**: N/A (build verification only)

---

## P3 — Low

---

### P3-01 — 37 of 42 pages have zero `data-testid` attributes

**Symptom**: Only 5 pages have `data-testid` attributes: `About.tsx`, `AnswerHistory.tsx`, `EventsDashboard.tsx`, `QuestionViewer.tsx`, `TestSession.tsx`. The remaining 37 pages cannot be reliably targeted by automated tests or monitoring tools.

**Fix plan**:
Add `data-testid` to the following minimum set of elements on each page:
- Page root container: `data-testid="page-{pagename}"`
- Primary CTA button: `data-testid="btn-{action}"`
- Loading skeleton root: `data-testid="skeleton-{pagename}"`
- Empty state: `data-testid="empty-{pagename}"`
- Error state: `data-testid="error-{pagename}"`
- Any filter/sort control: `data-testid="filter-{name}"`
- Any list/grid of items: `data-testid="list-{pagename}"`
- Individual list items: `data-testid="{item-type}-{id}"`

Priority order: Channels, Flashcards, Voice, Certifications, Tests, Blog, Profile, Bookmarks, ChallengeHome.

**Test**: Drives all test specs in `tests/e2e/`

---

### P3-02 — Missing ARIA labels on custom interactive elements

**Symptom**: Multiple pages use `<div onClick>`, `<button>` without descriptive text, and animated cards without `role` or `aria-label`. Key examples:
- Channel card "Start" and "Subscribe" buttons have no aria-label when icon-only
- Flashcard flip button has no aria-label
- Voice session "Record" button only shows a microphone icon on mobile
- Sidebar collapse toggle has no aria-label

**Fix plan**:
1. Add `aria-label="Subscribe to {channel name}"` on subscribe buttons.
2. Add `aria-label="Flip flashcard"` on the flashcard container click target.
3. Add `aria-label="Start recording"` / `aria-label="Stop recording"` on the voice mic button (toggle based on state).
4. Add `aria-label="Collapse sidebar"` / `aria-label="Expand sidebar"` on the sidebar toggle.
5. Add `role="main"` to the main content area in `AppLayout`.

**Test**: `tests/e2e/09-accessibility.spec.ts`

---

### P3-03 — VoicePractice shows no error when microphone is denied

**File**: `client/src/pages/VoicePractice.tsx`

**Symptom**: When the user denies microphone permission, the voice interview flow shows nothing (the button state doesn't update). There is no `catch` block on the `getUserMedia` call with a user-facing error message.

**Fix plan**:
1. Add a `catch` handler on the `getUserMedia` / `getUserMedia`-equivalent call.
2. Display a prominent error state: "Microphone access denied. Please allow microphone access in your browser settings to use voice interviews."
3. Link to browser-specific instructions for enabling mic permissions.

**Test**: `tests/e2e/05-voice.spec.ts`

---

### P3-04 — CertificationPractice breadcrumb uses `<a href>` instead of `<Link>`

**File**: `client/src/pages/CertificationPractice.tsx` lines 730–734

**Symptom**: The breadcrumb at the top of the certification practice page uses `<BreadcrumbLink href="/">`, `<BreadcrumbLink href="/certifications">` — these are raw HTML anchor elements that cause a full page reload instead of a SPA client-side navigation.

**Fix plan**:
1. Import `Link` from `wouter`.
2. Replace `<BreadcrumbLink href="/">` with `<BreadcrumbLink asChild><Link href="/">Home</Link></BreadcrumbLink>`.
3. Apply the same fix to all three breadcrumb items.

**Test**: `tests/e2e/06-certifications.spec.ts`

---

## Test Suite Index

See `tests/e2e/` for all Playwright tests corresponding to these fixes.

| Spec File | Covers |
|-----------|--------|
| `01-onboarding.spec.ts` | P0-01: Onboarding gate behavior, skip flow, deep-link preservation |
| `02-navigation.spec.ts` | P0-02, P0-03, P1-01, P1-03, P2-05: All routing/link issues |
| `03-channels.spec.ts` | P1-05, P3-01: Channels loading state, card layout, subscribe flow |
| `04-flashcards.spec.ts` | P2-01, P3-01: Flashcard layout, sidebar visibility, navigation |
| `05-voice.spec.ts` | P3-03, P3-01: Voice permission handling, UI states |
| `06-certifications.spec.ts` | P1-07, P3-04, P3-01: Cert navigation, breadcrumbs, card layout |
| `07-blog.spec.ts` | P1-02, P1-04, P3-01: Blog post links, CSS variable rendering |
| `08-profile-bookmarks.spec.ts` | P1-06, P3-01: localStorage safety, empty states |
| `09-accessibility.spec.ts` | P2-03, P2-04, P3-02: Font sizes, contrast, ARIA labels |
| `10-mobile.spec.ts` | P2-02, P3-01: Mobile layout, nav overlap, responsive breakpoints |

---

## Fix Execution Order (Recommended)

```
Week 1 — P0 (blocks everything)
  [ ] P0-01: Fix SubscriptionGate to not block deep links
  [ ] P0-02: Fix footer anchor links opening in new tab
  [ ] P0-03: Verify anchor section IDs exist and work

Week 2 — P1 (visible regressions)
  [ ] P1-03: ChallengeHome CSS variable migration
  [ ] P1-05: AllChannels loading skeleton
  [ ] P1-06: Bookmarks/Profile localStorage safety
  [ ] P1-01: Stats redirect user feedback
  [ ] P1-02: Home page dynamic article fetch
  [ ] P1-04: Blog CSS variable audit
  [ ] P1-07: CertificationPractice channel navigation

Week 3 — P2 (UX quality)
  [ ] P2-04: Increase muted-foreground contrast globally (index.css 1-liner)
  [ ] P2-03: Increase text-[10px] → text-xs in card stats
  [ ] P2-02: Mobile bottom nav overlap audit and pb fix
  [ ] P2-01: Flashcards sidebar consistency
  [ ] P2-05: Add missing sidebar routes
  [ ] P2-06: Delete orphaned page files

Week 4 — P3 (polish + test coverage)
  [ ] P3-01: Add data-testid to 9 priority pages
  [ ] P3-04: Fix CertificationPractice breadcrumb links
  [ ] P3-03: VoicePractice microphone denied error state
  [ ] P3-02: ARIA labels pass
```

---

## Files to Modify (Execution Reference)

| File | Issues |
|------|--------|
| `client/src/components/SubscriptionGate.tsx` | P0-01 |
| `client/src/components/OnboardingFlow.tsx` | P0-01 |
| `client/src/pages/home-facelift.tsx` | P0-02, P0-03, P1-02 |
| `client/src/pages/StatsRedirect.tsx` | P1-01 |
| `client/src/pages/ChallengeHome.tsx` | P1-03, P2-04 |
| `client/src/pages/blog/*.tsx` | P1-04 |
| `client/src/pages/AllChannels.tsx` | P1-05, P2-03, P3-01 |
| `client/src/pages/Bookmarks.tsx` | P1-06, P3-01 |
| `client/src/pages/Profile.tsx` | P1-06, P3-01 |
| `client/src/pages/CertificationPractice.tsx` | P1-07, P3-04, P3-01 |
| `client/src/pages/Flashcards.tsx` | P2-01, P3-01 |
| `client/src/pages/Certifications.tsx` | P2-02, P2-03, P3-01 |
| `client/src/pages/VoicePractice.tsx` | P2-02, P3-03, P3-01 |
| `client/src/index.css` | P2-04 |
| `client/src/components/layout/Sidebar.tsx` | P2-05, P3-02 |
| `client/src/components/layout/AppLayout.tsx` | P2-02 |

---

*Last updated: May 2026 | Tracking: `UX_FIXES_PLAN.md`*
