# Open Interview — Comprehensive Fix Plan

> Based on full codebase analysis: architecture, routing, user journeys, voice path, IA, component structure, and MD3 compliance.

---

## 1. Executive Summary of Problems

| Area | Severity | Problem |
|---|---|---|
| Onboarding | 🔴 P0 | Disabled — new users land with zero guidance |
| Voice path | 🔴 P0 | 3 pages, 2 design languages, no connected flow |
| Zombie pages | 🔴 P0 | ~10 unrouted pages bloating the codebase |
| Duplicate routes | 🟠 P1 | `/code`+`/coding`, `/training`+`/voice-interview`, `/my-path`+`/learning-paths` |
| IA fragmentation | 🟠 P1 | Progress split across 4 pages, Practice has no hub |
| Provider pyramid | 🟠 P1 | 7 nested context providers in App.tsx |
| Font conflict | 🟡 P2 | `--font-sans` maps to two different fonts |
| Glass vs MD3 | 🟡 P2 | Glassmorphism utilities conflict with MD3 tonal elevation |
| Neon tokens | 🟡 P2 | Legacy neon CSS vars pollute the MD3 palette |
| Page file sizes | 🟡 P2 | Several pages >40KB — logic/layout/data not separated |

---

## 2. Phase 1 — Critical Fixes (P0) · ~1 week

### 2.1 Re-enable Onboarding

**Problem:** `ProgressiveOnboarding` is commented out in `App.tsx`. Three other onboarding components exist but none are active.

**Files involved:**
- `client/src/App.tsx` (line ~195 — commented out block)
- `client/src/components/ProgressiveOnboarding.tsx`
- `client/src/components/OnboardingFlow.tsx`
- `client/src/components/Onboarding.tsx`
- `client/src/components/google/Onboarding.tsx` ← **use this one** (MD3-aligned)

**Action:**
1. Delete `Onboarding.tsx`, `OnboardingFlow.tsx`, `ProgressiveOnboarding.tsx` — consolidate into `components/google/Onboarding.tsx`
2. In `App.tsx`, replace the commented block with:
   ```tsx
   {needsOnboarding && <Onboarding onComplete={() => setNeedsOnboarding(false)} />}
   ```
3. Onboarding must collect: **role** (frontend/backend/devops/ml/manager), **goal** (cert prep/interview/general), **level** (junior/mid/senior)
4. Store in `UserPreferencesContext` — already has the shape for this

---

### 2.2 Fix the Voice Path

**Problem:** Three pages (`VoicePractice`, `VoiceSession`, `VoiceInterview`), two design languages (MD3 vs neon/glassmorphism), no connected flow, duplicate routes.

**Current state:**
```
/voice-interview  ──→  VoicePractice.tsx   (MD3, active)
/training         ──→  VoicePractice.tsx   (same page, duplicate route)
/voice-session    ──→  VoiceSession.tsx    (neon/glass, active, disconnected)
(no route)        ──→  VoiceInterview.tsx  (dead)
(no route)        ──→  TrainingMode.tsx    (dead)
```

**Target state:**
```
/practice/voice
  ├── Step 1: Mode select  (Training / Mock Interview)
  ├── Step 2: Question + Record  (unified, MD3)
  └── Step 3: Results + next action
```

**Actions:**
1. **Delete** `VoiceInterview.tsx` and `TrainingMode.tsx` — they are unrouted and use incompatible design systems
2. **Merge** `VoiceSession.tsx` session management logic (`voice-interview-session.ts`) into `VoicePractice.tsx` as the "interview mode" step — `VoicePractice` already has a `PracticeMode` toggle
3. **Delete** `VoiceSession.tsx` after merge
4. **Remove** `/training` route alias from `App.tsx` — keep only `/voice-interview`
5. **Update** `UnifiedNav.tsx` — the "Practice" bottom nav item correctly points to `/voice-interview`, no change needed
6. **Update** `Sidebar.tsx` — "Voice Interview" item already correct
7. **Update** `MobileHomeFocused.tsx` — remove the separate "Training Mode" card, keep only "Voice Interview"
8. **Update** `HomePage.tsx` — remove `/training` link, keep `/voice-interview`

**Resulting flow:**
```
Nav "Practice" → /voice-interview (VoicePractice)
  ├── [Training mode]   → read Q, record, word-count feedback, next Q
  └── [Interview mode]  → structured session (from voice-interview-session.ts)
                              → results screen (inline, not separate page)
                              → /stats (voice sessions count already tracked)
```

---

### 2.3 Delete Zombie Pages

**Problem:** ~10 page files exist but are not wired to any route. They still get compiled as lazy chunks and confuse contributors.

**Delete these files:**

| File | Reason |
|---|---|
| `pages/VoiceInterview.tsx` | Superseded by VoicePractice, unrouted |
| `pages/TrainingMode.tsx` | Superseded by VoicePractice, unrouted |
| `pages/HomeRedesigned.tsx` | Superseded by HomeGoogle, unrouted |
| `pages/StatsRedesigned.tsx` | Superseded by GoogleStats, unrouted |
| `pages/AllChannelsRedesigned.tsx` | Superseded by AllChannels, unrouted |
| `pages/AllChannelsMD3.tsx` | Superseded by AllChannels, unrouted |
| `pages/LearningPathsGoogle.tsx` | Superseded by UnifiedLearningPaths, unrouted |
| `pages/QuestionEditorDemo.tsx` | Dev demo, unrouted |
| `pages/ExtremeQuestionViewer.tsx` | Check if `/extreme/channel/:id` route is intentional — if not, delete |
| `pages/BotActivity.tsx` | Internal tool, consider moving to `/admin` |

**Also delete:**
- `pages/ReviewSessionOptimized.tsx` — `App.tsx` already falls back to it silently (`ReviewSession.catch(() => import ReviewSessionOptimized)`). Either make it the primary or delete it.

---

## 3. Phase 2 — IA & Navigation Fixes (P1) · ~1 week

### 3.1 Consolidate Duplicate Routes

**Problem:** Multiple routes point to the same page, creating confusion in analytics, nav state, and user mental model.

**Changes to `App.tsx`:**

| Remove | Keep | Action |
|---|---|---|
| `/code` | `/coding` | 301 redirect `/code` → `/coding` |
| `/training` | `/voice-interview` | Delete route |
| `/my-path` | `/learning-paths` | Delete route (both use `UnifiedLearningPaths`) |
| `/code/challenges` | `/coding` | Already does `window.location.replace` — keep |

---

### 3.2 Create a Practice Hub Page

**Problem:** Practice has 5 entry points (voice, tests, coding, review, flashcards) with no overview page. The "Practice" nav item goes directly to `/voice-interview`, skipping all other modes.

**Action:** Create `pages/Practice.tsx` — a hub page at `/practice`

```
/practice
  ├── Voice Interview card  → /voice-interview
  ├── Quick Tests card      → /tests
  ├── Code Challenges card  → /coding
  ├── SRS Review card       → /review
  └── Flashcards card       → /flashcards
```

Each card shows: mode name, description, estimated time, XP reward, last session date.

**Update `UnifiedNav.tsx`:** Change "Practice" bottom nav item from `/voice-interview` to `/practice`.

**Update `Sidebar.tsx`:** The Practice section already lists all 5 items — no change needed there.

---

### 3.3 Consolidate Progress Pages

**Problem:** Progress data is split across `/stats`, `/badges`, `/history`, `/profile` — four separate pages with no cross-linking.

**Action:** Create `pages/Progress.tsx` at `/progress` with MD3 tabs:

```
/progress
  ├── Tab: Overview  (content from GoogleStats)
  ├── Tab: Badges    (content from Badges)
  ├── Tab: History   (content from AnswerHistory)
  └── Tab: Profile   (content from Profile — settings/preferences only)
```

Keep `/stats`, `/badges`, `/history` as redirects to `/progress?tab=overview` etc. for backward compat.

Update sidebar "Progress" section to point to `/progress` as primary destination.

---

### 3.4 Flatten the Provider Pyramid

**Problem:** `App.tsx` has 7 nested context providers making it hard to read and test.

**Action:** Create `client/src/context/AppProviders.tsx`:

```tsx
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <UserPreferencesProvider>
        <SidebarProvider>
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              <BadgeProvider>
                <CreditsProvider>
                  <AchievementProvider>
                    <UnifiedNotificationProvider>
                      {children}
                    </UnifiedNotificationProvider>
                  </AchievementProvider>
                </CreditsProvider>
              </BadgeProvider>
            </TooltipProvider>
          </QueryClientProvider>
        </SidebarProvider>
      </UserPreferencesProvider>
    </ThemeProvider>
  );
}
```

`App.tsx` becomes:
```tsx
function App() {
  return (
    <ErrorBoundary>
      <AppProviders>
        <StagingBanner />
        <AppContent />
      </AppProviders>
    </ErrorBoundary>
  );
}
```

---

## 4. Phase 3 — Design System Cleanup (P2) · ~3 days

### 4.1 Fix Font Conflict

**Problem:** `--font-sans` is defined twice with different values:
- `m3-tokens.css`: `'Roboto Flex', 'Roboto', system-ui`
- `index.css` `@theme inline`: `'Plus Jakarta Sans', 'Inter', sans-serif`

Tailwind utility classes (`font-sans`) use the `@theme inline` value, so they render the wrong font.

**Fix in `client/src/index.css`** — change the `@theme inline` block:
```css
/* Before */
--font-sans: 'Plus Jakarta Sans', 'Inter', sans-serif;

/* After */
--font-sans: 'Roboto Flex', 'Roboto', system-ui, sans-serif;
```

Remove `Plus Jakarta Sans` and `Inter` from the Google Fonts import if they're only used here.

---

### 4.2 Remove Neon Tokens

**Problem:** Legacy neon CSS variables (`--neon-green`, `--neon-cyan`, `--neon-pink`, `--neon-gold`) exist alongside the MD3 palette and are used in some components.

**Action:**
1. `grep -r "neon-" client/src` to find all usages
2. Replace each usage with the nearest MD3 equivalent:
   - `--neon-green` → `--md-sys-color-tertiary` or `--md-ref-palette-tertiary-40`
   - `--neon-cyan` → `--md-sys-color-secondary`
   - `--neon-pink` → `--md-sys-color-error-container`
   - `--neon-gold` → `--md-ref-palette-tertiary-80`
3. Delete the neon variable declarations from `design-system.css`

---

### 4.3 Replace Glassmorphism with MD3 Tonal Elevation

**Problem:** `.glass`, `.glass-card`, `.glass-morphism`, `.shadow-clay-*`, `.clay-press` utilities use `backdrop-filter: blur()` which conflicts with MD3's tonal surface elevation model.

**MD3 elevation uses surface tint color, not blur.** The correct pattern:
```css
/* Instead of glass */
background: var(--md-sys-color-surface-container-high);
/* Instead of glass-card */
background: var(--md-sys-color-surface-container);
```

**Action:**
1. Audit all usages of `.glass*` and `.clay*` classes across components
2. Replace with appropriate `--md-sys-color-surface-container-*` level (low/default/high/highest)
3. Keep the CSS class definitions but make them use tonal colors instead of blur — this avoids a large find-replace across JSX

---

### 4.4 MD3 State Layers

**Problem:** Interactive components use `.hover-lift` (transform: translateY) and `.press-effect` (scale) instead of MD3 state layer opacities.

**MD3 state layers:**
- Hover: primary color at 8% opacity overlay
- Focus: primary color at 12% opacity overlay  
- Pressed: primary color at 12% opacity overlay
- Dragged: primary color at 16% opacity overlay

**Action:** Update `design-system.css` state layer utilities:
```css
.state-layer {
  position: relative;
  overflow: hidden;
}
.state-layer::after {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--md-sys-color-primary);
  opacity: 0;
  transition: opacity 200ms;
  pointer-events: none;
}
.state-layer:hover::after  { opacity: 0.08; }
.state-layer:focus::after  { opacity: 0.12; }
.state-layer:active::after { opacity: 0.12; }
```

Apply `.state-layer` to `GoogleButton.tsx`, `unified/Button.tsx`, `unified/Card.tsx`.

---

## 5. Phase 4 — Page Size Refactoring (P2) · ~1 week

Several pages are monolithic files that mix layout, data fetching, and business logic. This makes them slow to load and hard to maintain.

| File | Size | Action |
|---|---|---|
| `AICompanion.tsx` | 89KB | Split into `AICompanionUI.tsx` + `useAICompanion.ts` hook |
| `VoiceInterview.tsx` | 74KB | **Delete** (zombie) |
| `Documentation.tsx` | 63KB | Split into sections with lazy-loaded tabs |
| `UnifiedLearningPaths.tsx` | 53KB | Extract `LearningPathCard`, `PathProgress` as separate components |
| `CertificationPractice.tsx` | 46KB | Extract question rendering into `CertQuestionView.tsx` |
| `CertificationExam.tsx` | 41KB | Extract exam timer + scoring into `useExamSession.ts` hook |
| `VoicePractice.tsx` | 39KB | After voice merge, extract `RecordingView`, `FeedbackView` |
| `QuestionViewer.tsx` | 38KB | Extract `QuestionNav`, `AnswerReveal` as separate components |

**Rule of thumb:** Pages should be <20KB. Data fetching goes in hooks. Rendering goes in components.

---

## 6. Phase 5 — Quick Wins (1–2 days)

These are low-effort, high-impact changes that can be done in parallel with any phase.

| # | Change | File | Effort |
|---|---|---|---|
| 1 | Add `<meta name="description">` to all pages | Each page's `<SEOHead>` | 2h |
| 2 | Add `loading="lazy"` to all non-hero `<img>` tags | Global grep + fix | 1h |
| 3 | Fix `ReviewSession` fallback — pick one, delete the other | `App.tsx` + one page file | 30m |
| 4 | Update README — clarify Vite + Express, not Next.js | `README.md` | 15m |
| 5 | Add breadcrumb to `QuestionViewer` (channel → question) | `QuestionViewer.tsx` | 1h |
| 6 | Add "you are here" active state to sidebar for deep routes | `Sidebar.tsx` | 1h |
| 7 | Remove `StatsRedirect.tsx` — it's a 3-line file that just redirects | `App.tsx` + delete file | 15m |

---

## 7. Prioritised Backlog

```
P0 (this sprint)
├── Re-enable onboarding (google/Onboarding.tsx)
├── Fix voice path (merge VoiceSession into VoicePractice, delete dead files)
└── Delete zombie pages (10 files)

P1 (next sprint)
├── Remove duplicate routes
├── Create /practice hub page
├── Create /progress consolidated page
└── Flatten AppProviders

P2 (following sprint)
├── Fix --font-sans conflict
├── Remove neon tokens
├── Replace glassmorphism with MD3 tonal elevation
├── Implement MD3 state layers
└── Refactor large page files

P3 (backlog)
├── Design token documentation (Storybook)
├── Lazy-load Monaco + Mermaid (fix 1800MB build heap)
└── Light mode audit
```

---

## 8. File Change Summary

### Delete
```
client/src/pages/VoiceInterview.tsx
client/src/pages/TrainingMode.tsx
client/src/pages/HomeRedesigned.tsx
client/src/pages/StatsRedesigned.tsx
client/src/pages/AllChannelsRedesigned.tsx
client/src/pages/AllChannelsMD3.tsx
client/src/pages/LearningPathsGoogle.tsx
client/src/pages/QuestionEditorDemo.tsx
client/src/pages/ReviewSessionOptimized.tsx
client/src/pages/StatsRedirect.tsx
client/src/components/Onboarding.tsx
client/src/components/OnboardingFlow.tsx
client/src/components/ProgressiveOnboarding.tsx
```

### Create
```
client/src/context/AppProviders.tsx
client/src/pages/Practice.tsx
client/src/pages/Progress.tsx
```

### Modify
```
client/src/App.tsx                          (providers, routes, onboarding)
client/src/pages/VoicePractice.tsx          (merge VoiceSession logic)
client/src/components/layout/UnifiedNav.tsx (Practice → /practice)
client/src/components/home/HomePage.tsx     (remove /training link)
client/src/components/mobile/MobileHomeFocused.tsx (remove Training card)
client/src/index.css                        (fix --font-sans)
client/src/styles/design-system.css         (remove neon tokens, fix state layers)
```

---

*Generated: 2026-04-29 | Based on full codebase analysis*
