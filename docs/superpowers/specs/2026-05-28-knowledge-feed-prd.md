# Code Reels — The Knowledge Feed (PRD)

## Overview

The app pivoted from a Material Design 3 / MD3 swipe-based study app ("SwipeStudy / StudyCard / CardFan") to an X/Twitter-style infinite editorial feed. The metaphor shifted from "flashcard swiping" to "interactive technical journal" — a scrollable feed of editorial question cards optimized for reading, engagement, and spaced repetition.

### What Changed

| Before (MD3 Swipe) | After (Knowledge Feed) |
|---|---|
| SwipeStudy as default page | KnowledgeFeed as default page |
| StudyCard with drag-to-reveal | FeedCard with tap-to-reveal |
| CardFan (overlapping deck) | Infinite virtual scroll |
| Sidebar nav (w-72) + Top bar | Three-pane: left rail + 800px center + right rail |
| FilterStrip (horizontal pills) | URL-driven channel filter (/feed/:channel) |
| SessionSummary after deck | No session — continuous scroll |
| Glassmorphism / gradient effects | Borderless Twitter/X dark theme |
| facelift.css token system | --tw-border: #2f3336, pure black bg |
| Per-channel API requests | Single all-questions.json fetch |
| Swipe gestures (drag) | Tap / click interactions |
| SRS via swipe direction | StickyGradingBar (Again/Hard/Good/Easy) |
| 53 empty channels, no questions | 99 questions in all-questions.json |

## Architecture

### Zero-Backend Static SPA
- **Build:** `pnpm build:static` → Vite builds client/ to dist/public/ → route shells → Pagefind index
- **Data:** `data/questions/*.json` read at build time → single `all-questions.json` (30KB, 1 HTTP request)
- **Runtime:** No server. No database. No API calls. Everything is client-side.
- **State:** localStorage for SRS (spaced repetition), likes, bookmarks with Export/Import
- **Deploy:** GitHub Pages, static hosting

### Three-Pane Layout

```
┌──────┬──────────────────────────────────┬────────────────┐
│ Left │  Center Column                   │ Right Rail     │
│ Rail │  max-w 800px, mx-auto            │ w-[350px]      │
│ 68px │  @container feed-card            │ hidden < xl    │
│      │                                  │ (1280px)       │
│ Logo │  ┌────────────────────────┐      │                │
│ Feed │  │ FeedCard               │      │ Trending       │
│      │  │  diagram ▭ text        │      │ Topics         │
│ Srch │  │  pullquote "..."       │      │                │
│      │  │  [Tap to reveal]       │      │ StreakWidget   │
│ Prof │  │  EngagementBar         │      │ (7-day graph)  │
│      │  │  StickyGradingBar      │      │                │
│      │  └────────────────────────┘      │ DataHub        │
│      │  ┌────────────────────────┐      │ Export/Import  │
│      │  │ SkeletonCard           │      │ GitHub sync    │
│      │  └────────────────────────┘      │                │
│      │  ┌────────────────────────┐      │                │
│      │  │ DiscoveryCard (every 5)│      │                │
│      │  └────────────────────────┘      │                │
└──────┴──────────────────────────────────┴────────────────┘
```

### Provider Hierarchy
```
ErrorBoundary
  └── ThemeProvider
       └── UserPreferencesProvider
            └── QueryClientProvider
                 └── TooltipProvider
                      └── RewardProvider
                           └── BadgeProvider
                                └── AppContent
                                     └── Layout (three-pane)
                                          └── Router (wouter Switch)
                                               ├── /feed → KnowledgeFeed
                                               ├── /feed/:channel → KnowledgeFeed
                                               ├── /search → SearchPage
                                               ├── /profile → ProfilePage
                                               └── catch-all → Redirect /feed
```

## Component Inventory

### Layout (`client/src/ui/Layout.tsx`)
- CSS grid: three named areas (leftRail, center, rightRail)
- Left rail: 68px fixed width, sticky, gradient Code2 logo + 3 nav icons (Feed, Search, Profile) with Tooltips
- Center: `max-w-[800px]` on desktop, scrollable feed container, `@container feed-card`
- Right rail: 350px, hidden until xl (1280px), contains Trending Topics, StreakWidget, DataHub
- Mobile: bottom nav (Feed/Search/Profile), right rail hidden, center full-width, diagram/text stack linearly
- Dead code removed: NavRail.tsx (replaced by inline icon nav)

### FeedCard (`client/src/components/feed/FeedCard.tsx`)
- Borderless editorial card, no outline/shadow
- Typography: 24-28px `font-serif font-bold` headline (#e7e9ea), 16px body (#9ca3af, leading-relaxed 1.65), 13px meta (#71767b)
- Diagram anchor: float-right with `shape-outside: polygon(...)`, width 45%, mobile stacks full-width via `@container feed-card`
- Progressive disclosure: "Tap to reveal answer" with Framer Motion spring animation (stiffness: 300, damping: 25)
- `LayoutGroup` + `<motion.div layout>` for physical diagram shift on reveal
- `React.memo` wrapped, memo'd handlers
- Accepts `style` prop from `@tanstack/react-virtual`

### StickyGradingBar (`client/src/components/feed/StickyGradingBar.tsx`)
- Fixed `bottom-4` viewport, centered
- Spring slide-up animation on card reveal
- Four buttons: Again (red), Hard (orange), Good (blue), Easy (green)
- Haptic feedback via `use-haptic.ts`
- Replaces old inline grading buttons and FloatingGradingPill.tsx (deleted)

### PullQuote (`client/src/components/feed/PullQuote.tsx`)
- Extracts first 100 chars of answer
- Rendered with CSS shape (`shape-outside: inset()`)
- Italic style, subtle left border accent

### EngagementBar (`client/src/components/feed/EngagementBar.tsx`)
- 48x48px hitboxes for touch targets
- Like: 300ms spring keyframe animation [1, 0.75, 1.15, 1]
- Bookmark: toggle icon state
- Run Code: placeholder button (v2: WebAssembly WASM runner)
- Discuss: opens GitHub discussion link

### SkeletonCard (`client/src/components/feed/SkeletonCard.tsx`)
- Shimmer animation placeholder
- Matches FeedCard dimensions to prevent Cumulative Layout Shift
- Contains: headline bar (60% width), body bars (2 lines), diagram placeholder square

### DiscoveryCard (`client/src/components/feed/DiscoveryCard.tsx`)
- Injected every 5 FeedCards
- Text: "You're mastering {tag}. Show more?"
- `topLikedTag` computed from localStorage liked questions
- Click adds tag to filter or navigates to `/feed/{tag}`

### CodeExpandModal (`client/src/components/feed/CodeExpandModal.tsx`)
- Full-screen diagram lightbox
- z-9999 overlay
- Mermaid diagram auto-scales
- Keyboard dismiss with Escape
- Focus trap via `use-focus-trap.ts`

## Feature Inventory

### KnowledgeFeed (`client/src/pages/KnowledgeFeed.tsx`)
- `@tanstack/react-virtual` v3 for DOM virtualization (3-5 cards in DOM)
- `useCallback` stabilized `getScrollElement` / `estimateSize`
- Card types interleaved: FeedCard, DiscoveryCard (every 5th), SkeletonCard (loading)
- Channel filter: `/feed/:channel` via wouter params
- `topLikedTag` computed from localStorage

### DOM Virtualization
- `@tanstack/react-virtual` v3
- Vertical list virtualizer
- estimateSize: ~400px per card (varies by content)
- Only visible + overscan cards rendered (3-5)

### Spring Physics (Framer Motion)
| Element | Configuration |
|---------|--------------|
| Card reveal | spring, stiffness: 300, damping: 25 |
| Diagram shift | `<motion.div layout>` physical animation |
| Like bounce | 300ms keyframe [1, 0.75, 1.15, 1] |
| Grading bar | Spring slide-up from bottom |
| Text cascade | staggerChildren: 0.03 |
| Hover/press | whileTap, whileHover spring transitions |

### Container Queries
- Center column: `container-type: inline-size; container-name: feed-card`
- `@container feed-card (max-width: 640px)` stacks diagram below text
- Above 640px: diagram floats right 45% with shape-outside

### Haptics (`client/src/hooks/use-haptic.ts`)
- `navigator.vibrate()` wrapper
- Patterns: light (10ms), medium (20ms), heavy (40ms), selection (15ms)
- Used in: StickyGradingBar (on grade), EngagementBar (on like)

### Focus Trap (`client/src/hooks/use-focus-trap.ts`)
- Keyboard focus trapping for CodeExpandModal
- Tab/Shift+Tab cycle through modal elements
- Escape to close

### Keyboard Shortcut (`client/src/hooks/use-keyboard-sortcut.ts`)
- generic handler: register key combos with callback
- Used: Escape → close CodeExpandModal

### PWA
- `manifest.json`: standalone, maskable icons, `theme_color: #000000`
- `sw.js`: cache-first strategy, install/activate/fetch handlers, skipWaiting
- Registered in `main.tsx`

## Implementation Status

### Done (v1)
- [x] Three-pane layout (left rail + 800px center + right rail)
- [x] FeedCard with editorial typography (serif headline, shape-outside diagram, progressive disclosure)
- [x] StickyGradingBar with spring animation + haptics
- [x] PullQuote component (first 100 chars, CSS shape)
- [x] EngagementBar (48x48 hitboxes, spring like, bookmark, run code, discuss)
- [x] KnowledgeFeed with @tanstack/react-virtual v3
- [x] SkeletonCard shimmer loading
- [x] DiscoveryCard (topLikedTag, every 5th card)
- [x] CodeExpandModal (full-screen lightbox, focus trap, keyboard dismiss)
- [x] Framer Motion spring physics on all interactive elements
- [x] Container queries (@container feed-card) for responsive layout
- [x] Haptic feedback via use-haptic.ts
- [x] Focus trap + keyboard shortcut hooks
- [x] PWA (manifest.json + sw.js)
- [x] Channel filter via URL (/feed/:channel)
- [x] Single all-questions.json fetch (30KB, 1 HTTP request)

### Remaining / v2 Roadmap
- [ ] State consolidation — 5 overlapping reward/notification systems
- [ ] Unit tests for virtualizer, feed hooks, FeedCard
- [ ] Fix getActiveSection() bug in mobile bottom nav
- [ ] Fix /review infinite spinner (error boundary)
- [ ] Split VoiceInterview.tsx (1457 lines) and Documentation.tsx (1453 lines)
- [ ] Run Code → WebAssembly WASM runner (placeholder currently)
- [ ] SearchPage (currently stubbed)
- [ ] DataHub GitHub sync (placeholder currently)
- [ ] Right rail Trending Topics dynamic (static currently)

## File Manifest

### Core Components
| File | Purpose |
|------|---------|
| `client/src/ui/Layout.tsx` | Three-pane layout shell |
| `client/src/pages/KnowledgeFeed.tsx` | Infinite scroll feed with virtualization |
| `client/src/components/feed/FeedCard.tsx` | Editorial question card |
| `client/src/components/feed/StickyGradingBar.tsx` | Fixed bottom SRS grading |
| `client/src/components/feed/PullQuote.tsx` | Key takeaway extraction |
| `client/src/components/feed/EngagementBar.tsx` | Social actions (like, bookmark, etc.) |
| `client/src/components/feed/SkeletonCard.tsx` | Shimmer loading placeholder |
| `client/src/components/feed/DiscoveryCard.tsx` | Local discovery suggestion |
| `client/src/components/feed/CodeExpandModal.tsx` | Diagram lightbox |

### Hooks & Utilities
| File | Purpose |
|------|---------|
| `client/src/hooks/use-haptic.ts` | navigator.vibrate() wrapper |
| `client/src/hooks/use-focus-trap.ts` | Keyboard focus trapping |
| `client/src/hooks/use-keyboard-sortcut.ts` | Keyboard shortcut handler |

### Data
| File | Purpose |
|------|---------|
| `data/questions/*.json` | Source question files (62 channels) |
| `scripts/build-static.mjs` | Build orchestrator |
| `client/public/data/all-questions.json` | Generated single fetch (gitignored) |

### PWA
| File | Purpose |
|------|---------|
| `client/public/manifest.json` | Web app manifest |
| `client/public/sw.js` | Service worker (cache-first) |
| `client/src/main.tsx` | SW registration |

## Dead Code Removed

| File | Lines | Reason |
|------|-------|--------|
| `client/src/ui/NavRail.tsx` | ~100 | Replaced by inline left rail in Layout |
| `client/src/components/swipe/FloatingGradingPill.tsx` | ~60 | Replaced by StickyGradingBar |
| Old inline grading buttons in FeedCard | — | Removed during editorial card rewrite |

## Known Issues

1. Five notification/reward systems coexist (CreditsContext, AchievementContext, BadgeContext, rewardStorage, NotificationsContext) — need consolidation into single RewardContext
2. Routes like `/review` have known loading failures (infinite spinner) — need error boundary
3. VoiceInterview.tsx (1457 lines) and Documentation.tsx (1453 lines) exceed 800-line threshold
4. Mobile bottom nav (`UnifiedNav.tsx`) has `getActiveSection()` bug — no tab id matches `'progress'`
5. No unit tests for virtualizer, feed hooks, or FeedCard
6. Right rail Trending Topics is static (not computed from data)
7. SearchPage is stubbed (no implementation)
8. Run Code button is a placeholder (v2: WebAssembly)
