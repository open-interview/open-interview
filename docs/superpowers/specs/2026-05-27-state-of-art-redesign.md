# Knowledge Feed — The Interactive Technical Journal

## Goal
Transform from a bare-bones 2-page app into a state-of-the-art X/Twitter-style infinite editorial feed for technical interview prep (React 19 + Vite + wouter + Tailwind CSS v4 + shadcn/ui + framer-motion). Static SPA deployed to GitHub Pages via `pnpm build:static`.

## Architecture

### Data Pipeline (Zero Backend)
- Single `all-questions.json` fetch (30KB, 1 HTTP request) — all 99 questions loaded in one go
- No per-channel requests, no API server, no database
- Local-first: localStorage for SRS (spaced repetition), likes, bookmarks with Export/Import
- Data source: `data/questions/*.json` (62 channel files, 8 populated with questions)
- Build step: `scripts/build-static.mjs` orchestrates question reading → test/path generation → Vite build → route shells → Pagefind index

### Provider Hierarchy (rendered in App.tsx)
```
ErrorBoundary
  └── ThemeProvider
       └── UserPreferencesProvider
            └── QueryClientProvider
                 └── TooltipProvider
                      └── RewardProvider
                           └── BadgeProvider
                                └── AppContent
                                     └── Layout (three-pane — left rail + center + right rail)
                                          └── Router (wouter Switch)
                                               ├── /feed → KnowledgeFeed (default)
                                               ├── /feed/:channel → KnowledgeFeed (filtered)
                                               ├── /search → SearchPage
                                               ├── /profile → ProfilePage
                                               └── catch-all → Redirect /feed
```

### Key Architecture Changes
1. Zero backend — static SPA, single JSON fetch, no server dependencies
2. Three-pane layout replaces sidebar + top bar
3. KnowledgeFeed replaces SwipeStudy as the default route
4. FeedCard replaces StudyCard (editorial card, no swipe)
5. Local-first with localStorage export/import
6. PWA with service worker for offline support

## Layout — Three Pane

### Desktop (≥1280px) — Full Three Pane
```
┌──────┬──────────────────────────────────┬──────────────┐
│ Left │  Center Column                   │ Right Rail    │
│ Rail │  (max-w 800px, mx-auto)          │ (w-350,       │
│ 68px │                                   │  hidden < xl)│
│      │  ┌────────────────────────┐      │              │
│ [🏴] │  │ FeedCard (editorial)   │      │ Trending     │
│      │  │  diagram ▭ text        │      │ Topics       │
│ Feed │  │  pullquote ██          │      │              │
│      │  │  [Tap to reveal]       │      │ StreakWidget │
│ Srch │  │  Engagement Bar        │      │ (7-day graph)│
│      │  │  StickyGradingBar      │      │              │
│ Prof │  └────────────────────────┘      │ DataHub      │
│      │  ┌────────────────────────┐      │ (Export/     │
│      │  │ SkeletonCard (loading) │      │  Import/     │
│      │  └────────────────────────┘      │  GitHub sync)│
│      │  ┌────────────────────────┐      │              │
│      │  │ DiscoveryCard (every 5)│      │              │
│      │  └────────────────────────┘      │              │
└──────┴──────────────────────────────────┴──────────────┘
```

### Mobile (<1024px)
```
┌──────────────────────────────┐
│  Center Column (full width)  │
│                              │
│  ┌──────────────────────┐   │
│  │ FeedCard             │   │
│  │  text then diagram   │   │
│  │  (stacked linearly)  │   │
│  └──────────────────────┘   │
│  ┌──────────────────────┐   │
│  │ FeedCard             │   │
│  └──────────────────────┘   │
│                              │
├──────────────────────────────┤
│  Bottom Nav (fixed, h-14)    │
│  [Feed] [Search] [Profile]   │
└──────────────────────────────┘
```

### Implementation
- `Layout.tsx`: CSS grid with three named areas, left rail fixed 68px, right rail 350px (hidden < xl)
- Left rail: 68px sticky, icon nav + gradient Code2 logo + Tooltips
- Center: `max-w-[800px]` on desktop, `@container feed-card` for container queries
- Right rail: Trending Topics + StreakWidget + DataHub, hidden until xl breakpoint
- Mobile: bottom nav replaces left rail, right rail hidden, center column full-width
- `NavRail.tsx` — deleted (replaced by inline icon nav in Layout)

## Visual Design System

### Twitter/X Inspired Dark Theme
| Token | Value | Usage |
|-------|-------|-------|
| `--tw-border` | #2f3336 | Subtle borders between elements |
| `--bg-primary` | #000000 | Page background |
| `--bg-secondary` | #0a0a0a | Card areas |
| `--text-headline` | #e7e9ea | 24-28px serif bold headlines |
| `--text-body` | #9ca3af | 16px body text |
| `--text-meta` | #71767b | 13px metadata, timestamps |
| `--color-accent` | #3b82f6 | Blue accent (like button, links) |
| `--color-retweet` | #00ba7c | Green (used sparingly) |
| `--color-like` | #f91880 | Pink (like animation) |

### No Glassmorphism, No Gradients (Except the Logo)
- Cards are borderless — rely on spacing and typography for hierarchy
- No `.glass-nav`, `.glass-card`, `.glow-violet` effects
- Logo only: gradient `Code2` icon in left rail
- Focus: clean editorial reading experience, not "premium effects"

## FeedCard (Borderless Editorial Card)

### Typography
- Headline: 24-28px `font-serif font-bold`, color `#e7e9ea`
- Body: 16px, color `#9ca3af`, `leading-relaxed` (1.65)
- Meta: 13px, color `#71767b` (channel, difficulty, timestamp)
- Text balancing with `react-wrap-balancer`

### Layout (Desktop)
```
┌──────────────────────────────────────┐
│ Meta: channel · difficulty · 2m ago  │
│                                      │
│  ┌──────────────┐   ┌──────────┐    │
│  │ 24px Headline│   │ Diagram  │    │
│  │ (serif bold) │   │ (45%     │    │
│  │              │   │  width,  │    │
│  │ 16px body    │   │  float   │    │
│  │ #9ca3af      │   │  right)  │    │
│  │ leading 1.65 │   │          │    │
│  └──────────────┘   └──────────┘    │
│                                      │
│ ┌────────────────────────────────┐   │
│ │ PullQuote:                    │   │
│ │ "First 100 chars of answer"   │   │
│ │ shape-outside: aside          │   │
│ └────────────────────────────────┘   │
│                                      │
│ ┌─ Tap to reveal answer ──────────┐ │
│ │ (Framer Motion spring animation)│ │
│ │ Answer text + expanded diagram  │ │
│ └───────────────────────────────────┘ │
│                                      │
│ ┌─ Engagement Bar ────────────────┐ │
│ │ ♥ 24    🔖 34    ▶ Run    💬   │ │
│ │ 48x48 hitboxes, spring physics  │ │
│ └───────────────────────────────────┘ │
└──────────────────────────────────────┘
```

### Progressive Disclosure
- Initially shows question + diagram + pullquote
- "Tap to reveal answer" with Framer Motion `spring` animation
- Answer expands with `LayoutGroup` + `<motion.div layout>` for physical shift
- Diagram anchors to right (float-right, `shape-outside: polygon(...)`, 45% width)
- On mobile: stacks linearly (diagram below text, full-width) via `@container feed-card`

### Props Interface
```
FeedCardProps {
  question: Question
  isRevealed: boolean
  onReveal: () => void
  onGrade: (grade: SRSGrade) => void
  onLike: () => void
  onBookmark: () => void
  liked: boolean
  bookmarked: boolean
  grade?: SRSGrade
  style?: React.CSSProperties  // for react-virtual
}
```

### StickyGradingBar
- Fixed `bottom-4` viewport, centered
- Spring slide-up animation when card revealed
- Four buttons: Again (red), Hard (orange), Good (blue), Easy (green)
- Each with haptic feedback via `use-haptic.ts`

### EngagementBar
- 48x48px hitboxes for touch targets
- Like: spring animation (300ms keyframe [1, 0.75, 1.15, 1])
- Bookmark: toggle state
- Run Code: placeholder button (v2: WebAssembly WASM runner)
- Discuss: opens GitHub discussion link

### PullQuote Component
- Extracts first 100 chars of answer as a key technical takeaway
- Rendered with `shape-outside: inset()` CSS shape
- Italic style, subtle left border accent

### CodeExpandModal
- Full-screen diagram lightbox
- z-9999 overlay
- Mermaid diagram auto-scales to fill viewport
- Keyboard dismiss with Escape

### Virtualization Integration
- `React.memo` wrapped
- Memo'd event handlers via `useCallback`
- Accepts `style` prop from `@tanstack/react-virtual` for positioning
- Only 3-5 FeedCards in DOM at any time

## KnowledgeFeed (Infinite Scroll)

### Core Behavior
- `@tanstack/react-virtual` v3 for DOM virtualization
- `useCallback` stabilized `getScrollElement` and `estimateSize`
- Virtualizer configured for vertical list, scroll container is the center column
- Questions loaded from single `all-questions.json` (available via `useQuestionData`)

### Card Types Interleaved
| Position | Card | Purpose |
|----------|------|---------|
| Every N | FeedCard | Question card (editorial) |
| Every 5th | DiscoveryCard | "You're mastering {tag}. Show more?" |
| While loading | SkeletonCard | Shimmer placeholder |

### Channel Filter
- URL-driven: `/feed/:channel` selects channel
- Channel filter extracted from URL params via wouter
- `topLikedTag` computed from localStorage liked questions for DiscoveryCard suggestions

### DiscoveryCard
- Text: "You're mastering {tag}. Show more?"
- Click adds tag to filter or navigates to `/feed/{tag}`
- Tag derived from `topLikedTag` — the most-liked tag across user's history

### SkeletonCard
- Shimmer animation placeholder
- Matches FeedCard dimensions to prevent layout shift
- Contains: headline bar (60% width), body bars (2 lines), diagram placeholder square

## Component Inventory

| Component | File | Lines | Status |
|-----------|------|-------|--------|
| Layout | `client/src/ui/Layout.tsx` | ~200 | Done |
| FeedCard | `client/src/components/feed/FeedCard.tsx` | ~200 | Done |
| StickyGradingBar | `client/src/components/feed/StickyGradingBar.tsx` | ~80 | Done |
| PullQuote | `client/src/components/feed/PullQuote.tsx` | ~30 | Done |
| EngagementBar | `client/src/components/feed/EngagementBar.tsx` | ~60 | Done |
| SkeletonCard | `client/src/components/feed/SkeletonCard.tsx` | ~50 | Done |
| DiscoveryCard | `client/src/components/feed/DiscoveryCard.tsx` | ~40 | Done |
| CodeExpandModal | `client/src/components/feed/CodeExpandModal.tsx` | ~50 | Done |
| KnowledgeFeed | `client/src/pages/KnowledgeFeed.tsx` | ~150 | Done |

## Animations & Interactions

### Spring Physics (Framer Motion)
| Element | Config | Effect |
|---------|--------|--------|
| Card reveal | stiffness: 300, damping: 25 | Spring expand |
| Diagram shift | `<motion.div layout>` | Physical reposition |
| Like button | 300ms [1, 0.75, 1.15, 1] | Bounce scale |
| Grading bar | spring slide-up (bottom-4) | Sticky entrance |
| Text cascade | staggerChildren: 0.03 | Typography reveal |
| Hover/Press | whileTap, whileHover | Micro-interactions |

### LayoutGroup
- Wraps FeedCard content for coordinated layout animations
- Diagram shifts physically when answer is revealed
- Text reflows with spring physics

## Container Queries

### `@container feed-card`
- Defined on center column wrapper
- FeedCard children query `feed-card` container for responsive layout
- Below 640px: diagram stacks below text (full-width, no float)
- Above 640px: diagram floats right (45% width, shape-outside)

### Usage
```css
.card-container {
  container-type: inline-size;
  container-name: feed-card;
}

@container feed-card (max-width: 640px) {
  .diagram-anchor {
    float: none;
    width: 100%;
  }
}
```

## Hooks & Utilities

| Hook | File | Purpose |
|------|------|---------|
| `use-haptic.ts` | `client/src/hooks/use-haptic.ts` | `navigator.vibrate()` wrapper (light/medium/heavy/selection) |
| `use-focus-trap.ts` | `client/src/hooks/use-focus-trap.ts` | Keyboard focus trapping for CodeExpandModal |
| `use-keyboard-sortcut.ts` | `client/src/hooks/use-keyboard-sortcut.ts` | Keyboard shortcut handler (Escape to close modal) |

## PWA

### manifest.json
- `display: "standalone"`
- `theme_color: "#000000"`
- Maskable icons at multiple sizes
- Short_name: "Code Reels"

### sw.js
- Cache-first strategy for static assets
- `install` → precache shell
- `activate` → `skipWaiting()`, `clients.claim()`
- `fetch` → cache-first, network fallback
- Registered in `main.tsx`

## Dead Code Removed

| File | Lines | Reason |
|------|-------|--------|
| `client/src/ui/NavRail.tsx` | ~100 | Replaced by inline left rail in Layout |
| `client/src/components/swipe/FloatingGradingPill.tsx` | ~60 | Replaced by StickyGradingBar |
| Old inline grading buttons in FeedCard | — | Removed during editorial card rewrite |

## Known Issues

1. Five notification/reward systems coexist (CreditsContext, AchievementContext, BadgeContext, rewardStorage, NotificationsContext) — need consolidation
2. Routes like `/review` have known loading failures — need error boundaries
3. Multiple pages exceed 800 lines (VoiceInterview.tsx: 1457, Documentation.tsx: 1453)
4. Mobile bottom nav (`UnifiedNav.tsx`) has `getActiveSection()` bug — no tab id matches `'progress'`
5. No unit tests for virtualizer, feed hooks, or FeedCard components

## Verification
- `pnpm check` (tsc) must pass
- `pnpm vitest run` unit tests must pass
- `pnpm build:static` must succeed with populated all-questions.json
- Feed renders at 375px, 768px, 1280px, 1440px
- Infinite scroll loads more cards on scroll
- Virtualizer keeps DOM nodes at 3-5
- PWA installs and works offline
