# State-of-the-Art Redesign — Open Interview

## Goal
Transform from a bare-bones 2-page app into a state-of-the-art responsive interview prep platform with proper architecture, premium UI, and real data.

## Architecture

### Provider Hierarchy (rendered in App.tsx)
```
ErrorBoundary
  └── ThemeProvider                    // ThemeContext at root for theme-wide access
       └── UserPreferencesProvider     // Existing — role, channels, onboarding
            └── QueryClientProvider    // Existing — TanStack React Query
                 └── TooltipProvider   // Existing — shadcn/ui
                      └── RewardProvider  // Existing — unified rewards, notifications
                           └── BadgeProvider  // Moved here from deeper nesting
                                └── AppContent
                                     └── Layout (always renders — contains nav + content slot)
                                          └── Router (wouter Switch)
                                               ├── /study → SwipeStudy
                                               ├── /study/:filter → SwipeStudy
                                               ├── /profile → MinimalProfile
                                               ├── /questions → Redirect /study
                                               └── catch-all → Redirect /study
```

### Key Architecture Changes
1. Mount `ThemeProvider` at root — theme available everywhere
2. Keep `RewardProvider` as single truth for rewards/notifications
3. Mount `BadgeProvider` at app level inside RewardProvider
4. Wrap Router inside persistent `<Layout>` — consistent nav on every page
5. All pages receive layout from parent, remove own headers

## Layout & Navigation

### Desktop (≥1024px) — Sidebar + Top Bar + Content
```
┌──────────────┬──────────────────────────────────────────┐
│  Sidebar     │  Top Bar (sticky)                        │
│  (w-72,      │  [breadcrumb]          [Credits] [User]  │
│   fixed)     ├──────────────────────────────────────────┤
│              │                                           │
│  [Logo]      │  Page Content (flex-1, overflow-y-auto)  │
│  ──────      │                                           │
│  📚 Study    │  ┌─────────────────────────────────┐    │
│  👤 Profile  │  │   Active page renders here      │    │
│  ──────      │  │                                  │    │
│  [Credits]   │  └─────────────────────────────────┘    │
│  [User card] │                                           │
└──────────────┴──────────────────────────────────────────┘
```

### Mobile (<1024px) — Top Bar + Content + Bottom Nav
```
┌──────────────────────────────────────┐
│  Top Bar (sticky, glass-nav)         │
│  [←back]  Page Title    [credits] ☰  │
├──────────────────────────────────────┤
│  Content (flex-1, overflow-y-auto)   │
│                                      │
│  ┌──────────────────────────────┐   │
│  │  Active page renders here    │   │
│  └──────────────────────────────┘   │
│                                      │
├──────────────────────────────────────┤
│  Bottom Nav (fixed, glass-nav)       │
│  [🏠 Study]  [👤 Profile]            │
└──────────────────────────────────────┘
```

### Implementation
- Rewrite `Layout.tsx` using existing shadcn `sidebar.tsx` component (727 lines, supports offcanvas/icon/none modes)
- Mobile: vaul Drawer for hamburger menu, fixed `h-14` bottom nav with glass effect
- Sidebar nav items: Study, Profile (expand as data becomes available)
- SwipeStudy removes its own header, uses Layout's top bar
- MinimalProfile removes own header/nav, uses Layout's top bar

## Visual Design System

### Activate facelift.css as single source of truth
- Import `facelift.css` in `index.css` to make all 1348 lines of tokens available
- Remove unused: `design-system-unified.css`, `genz-design-system.css`

### Consistent color tokens (replace all inline colors)
| Token | Value | Usage |
|-------|-------|-------|
| `--surface-0` | #050810 | Page background |
| `--surface-1` | #0a0e1a | Default background |
| `--surface-2` | #0f1629 | Cards, panels |
| `--surface-3` | #141d35 | Elevated cards, modals |
| `--surface-4` | #1a2540 | Highest surface (dropdowns, tooltips) |
| `--text-primary` | rgba(255,255,255,0.95) | Headings, body |
| `--text-secondary` | rgba(255,255,255,0.75) | Subheadings |
| `--text-tertiary` | rgba(255,255,255,0.50) | Captions, metadata |
| `--color-accent-violet` | #7c3aed | Primary accent |
| `--color-accent-cyan` | #06b6d4 | Secondary accent |
| `--border-subtle` | rgba(255,255,255,0.06) | Default borders |
| `--swipe-bg-app` | var(--surface-0) | Study page bg (fix current #0a0a0a mismatch) |

### Premium Effects Usage
| Effect | Where |
|--------|-------|
| `.glass-nav` | Top bar, bottom nav, sidebar |
| `.glass-card` | Stat cards, metric displays |
| `.gradient-text` | Page titles |
| `.glow-violet` | Active nav items, hover states |
| `.shimmer` | Skeleton loaders |
| `.animate-float` | Empty state icons |
| `.card-premium` | Feature/promo cards |

## Component States (Unified)

| State | Component | Behavior |
|-------|-----------|----------|
| Loading | `QuestionCardSkeleton` from skeleton-loaders.tsx | Shimmer animation, card-shaped placeholder |
| Error | New `ErrorCard` | Gradient border card + AlertCircle icon + description + Retry button + "Report" link |
| Empty (no channels) | ChannelPicker inline + "Pick your first topic" hero | Role-based suggestions with one-click subscribe |
| Empty (caught up) | Enhanced EmptyState | Animated target icon + streak + next review + Study More CTA |
| Offline | New `OfflineBanner` (fixed bottom) | "You're offline — showing cached content" with dismiss |
| First visit | OnboardingFlow (already exists) | Welcome + role picker + recommended topics |

## Data Pipeline

### Fix question generation
- Debug `scripts/build-static.mjs` Step 1 to actually fetch/populate questions for all 95 channels
- Generate minimum 10 questions per channel
- Include `tldr` field in every question (currently missing — card-adapters depends on it)

### Fix test generation
- Debug `script/generate-tests-from-channels.js` — currently produces empty output
- Generate 3-5 tests per channel with 10 questions each

### Content generation for empty channels
- 53 empty question files need content
- Generate via AI: 10-15 questions per channel with `id`, `channel`, `subChannel`, `question`, `answer`, `explanation`, `tldr`, `difficulty`, `tags`, `companies`, `status: "active"`, `createdAt`
- Create `script/generate-questions-ai.mjs` that populates empty question files

### Validation
- Fix `validate-questions.js` to check actual file paths
- Add `tldr` to required fields
- Remove `"expert"` difficulty from certification data (not in 3-tier enum)
- Add validation to CI

## Implementation Order (9 Waves, 36 Subagents)

| Wave | Package | Subagents | Dependencies |
|------|---------|-----------|-------------|
| 1 | Architecture | 4 | None — foundational |
| 2 | Layout Shell | 5 | Wave 1 |
| 3 | CSS Integration | 3 | Wave 1 |
| 4 | State Components | 4 | Wave 2, 3 |
| 5 | Page Integration | 4 | Wave 2, 3, 4 |
| 6 | Data Pipeline | 5 | None (parallel with UI work) |
| 7 | Content Generation | 5 | Wave 6 |
| 8 | Validation | 3 | Wave 6, 7 |
| 9 | Polish | 3 | All previous |

Total: 36 subagents

## Verification
- `pnpm check` (tsc) must pass
- `pnpm vitest run` client tests must pass
- `pnpm build:static` must succeed with populated data
- All states (loading, empty, error, offline) render correctly
- Responsive layout works at 375px, 768px, 1024px, 1440px
