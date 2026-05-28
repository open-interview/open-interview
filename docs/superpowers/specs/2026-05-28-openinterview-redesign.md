# OpenInterview — Complete UI/UX Redesign

**Date:** 2026-05-28
**Status:** Design Approved, Pending Implementation

## Overview

Complete reimagining of the OpenInterview app's look and feel, architecture, and component design. Transforms from a Twitter/X-clone aesthetic (dark-first, 3-column, ikon nav, `#2f3336` borders) to a warm minimal editorial experience (light-first, 2-column, content-centered, paper-like surfaces).

## Current State vs Target State

| Dimension | Current | Target |
|-----------|---------|--------|
| Theme | Dark-first, light toggle | Light-first, dark toggle |
| Layout | 3-column (nav 68 + content 800 + sidebar 350) | 2-column (content max-680 centered + sidebar 280 at xl+) |
| Navigation | Left icon nav + top bar + bottom nav | Top header (logo + actions) + mobile bottom nav |
| Background | `#03050b` (near black) | `#F7F6F3` (warm paper) |
| Accent | Violet/Cyan gradient (#7c3aed → #06b6d4) | Deep burgundy (#C73E3A) |
| Typography | Inter + JetBrains Mono | DM Sans (headings) + Inter (body) + JetBrains Mono (code) |
| Animations | Decorative + functional | Functional only, purposeful |
| Accessibility | 3/10 (components exist but disconnected) | 9/10 (all gaps closed) |
| CSS files | 5 overlapping (2063+ lines) | 1 primary + 1 dark overrides |
| Page count | 3 | 3 (perfected) |
| Brand identity | Twitter/X clone | Distinctive editorial identity |

## Architecture

### Layout
- **Header** (all breakpoints): Slim `h-12` top bar — Logo left, search/theme/profile right. Glass border-b.
- **Main area**: Single centered column `max-w-[680px]` on md+, full width on mobile
- **Sidebar** (xl+ only): Fixed `w-[280px]` right column. Contains streak widget, stats mini-card, topic quick-nav
- **Mobile** (<md): Full-width content, bottom tab bar (`h-14`), no sidebar
- **Max page width**: `1280px` centered

### Routes (unchanged, 3 pages)
- `/`, `/feed`, `/feed/:filter` → KnowledgeFeed
- `/study`, `/study/:filter` → SwipeStudy
- `/profile` → MinimalProfile

## Design Tokens

### Colors

```css
/* Light mode (default) */
--bg: #F7F6F3;
--surface: #FFFFFF;
--surface-elevated: #F0EFEA;
--fg: #1A1A18;
--fg-secondary: #5C5A55;
--fg-muted: #787774;
--border: #E8E7E2;
--border-light: #F0EFEA;
--accent: #C73E3A;
--accent-subtle: #F5E6E4;
--accent-fg: #FFFFFF;
--success: #2B7A4B;
--success-subtle: #E6F2EB;
--warning: #B05A1A;
--warning-subtle: #F5EEE4;
--error: #C73E3A;
--error-subtle: #F5E6E4;

/* Dark mode */
[data-theme="dark"] {
  --bg: #161512;
  --surface: #1E1D1A;
  --surface-elevated: #2A2924;
  --fg: #F0EFEA;
  --fg-secondary: #A09E98;
  --fg-muted: #787470;
  --border: #2E2D28;
  --border-light: #3A3934;
  --accent: #E85D5A;
  --accent-subtle: #3D201E;
  --accent-fg: #1A1A18;
  --success: #4CAF78;
  --success-subtle: #1E3D2E;
  --warning: #E08C3A;
  --warning-subtle: #3D2E1E;
  --error: #E85D5A;
  --error-subtle: #3D201E;
}
```

### Typography

```css
--font-heading: 'DM Sans', system-ui, sans-serif;
--font-body: 'Inter', system-ui, -apple-system, sans-serif;
--font-mono: 'JetBrains Mono', 'SF Mono', 'Fira Code', monospace;

/* Scale */
--text-xs: 0.6875rem;   /* 11px */
--text-sm: 0.8125rem;    /* 13px */
--text-base: 0.9375rem;  /* 15px */
--text-lg: 1.0625rem;    /* 17px */
--text-xl: 1.25rem;      /* 20px */
--text-2xl: 1.5rem;      /* 24px */
--text-3xl: 1.75rem;     /* 28px */
```

### Spacing
- Base unit: 4px
- Card padding: 16px (--space-4)
- Section gaps: 32-48px (--space-8 to --space-12)
- Content max-width: 680px (optimized 65-75 chars/line)

### Radii
- Card: 12px
- Button/Input: 8px
- Tag/Chip: 6px
- Pill: 999px

## Component Design

### Feed Card
```
Container: white surface, 12px radius, 1px border(--border)
Padding: 20px
Internal gap: 12px

Layout:
  Top row:   Tag label (uppercase 11px) · Time · Bookmark icon
  Question:  DM Sans 500 20px/1.3 leading
  Preview:   Inter 400 14px/1.5, 3-line clamp
  Chips:     Difficulty tags (colored)
  Actions:   Primary button · Secondary button · Icon button
```

### Button System
- Height: 36px (standard), 44px (touch), 28px (compact)
- Radius: 8px, flat (no shadow)
- Primary: accent bg, white text
- Secondary: border only, no bg
- Ghost: no border, hover bg
- Link: accent text, underline on hover
- Transition: 150ms ease, scale 0.98 on press

### Navigation
- **Header**: Inter 500 13px, uppercase for nav labels. Sticky with glass border-b.
- **Bottom Nav (mobile)**: 3 tabs (Feed, Study, Profile), accent dot indicator, safe-area aware
- **Active state**: accent color, inactive: muted fg

## Interactions & Animation

### Principles
1. Every animation has purpose — reveals, transitions, feedback
2. No decorative-only animation
3. Respect `prefers-reduced-motion` at both CSS and JS level
4. Duration: 150-250ms micro, 300ms transitions, 400ms max

### Specifics
- Card reveal: content fade-in + slide-up 4px (250ms ease-out)
- Button press: scale 0.98 (150ms spring)
- Link hover: underline slide-in (200ms ease)
- Page transition: crossfade 250ms (RouteTransition connected)
- Answer reveal: fade-in (250ms)
- Accordion/collapse: height transition (200ms ease)

## Accessibility (Closing All Gaps)

| Component | Current Issue | Fix |
|-----------|--------------|-----|
| SkipToContent | Component exists, never rendered | Import in Layout, make first tabbable |
| Virtual list | Keyboard invisible | `tabindex="0"` + `role="listitem"` + arrow key handlers |
| Focus ring | Present | Keep as 2px accent-colored outline |
| Page title | Static | Dynamic `<title>` per route |
| Feed cards | No semantics | `role="article"` + `aria-label` |
| Toast | No role | `role="status"` `aria-live="polite"` |
| Omnibar | No focus trap | Apply existing `useFocusTrap` hook |
| Contrast | Gray-on-gray risk | `#787774` on `#F7F6F3` = 5.8:1 (AA+) |
| Reduced motion | CSS-only | Add framer-motion `useReducedMotion` |
| Touch targets | Inconsistent | All interactive ≥44px, `hitSlop` for icons |

## CSS Consolidation

### Current (5 files, ~2063+ lines)
1. `index.css` (353 lines) — entry + utilities
2. `facelift.css` (1348 lines) — primary design tokens
3. `design-system.css` (715 lines) — legacy/overlapping
4. `mobile-first.css` (384 lines)
5. `blog-layout.css` + `blog-typography.css`

### Target (2 files)
1. **`tokens.css`** — All design tokens (colors, typography, spacing, radii, animations), light + dark modes, Tailwind v4 `@theme inline` bridge
2. **`utilities.css`** — Utility classes (glass, gradients, effects, editorials), reduced motion, safe areas, scrollbar, keyframes

Total: ~800-1000 lines (50% reduction). The `design-system.css` file is fully removed.

## Implementation Order

1. **CSS consolidation** — Create `tokens.css`, remove `facelift.css`/`design-system.css`, wire up new color/typography tokens
2. **Layout restructure** — Header refactor, remove left nav, center content, conditional sidebar
3. **Typography swap** — DM Sans + Inter + JetBrains Mono, update all font tokens
4. **Component restyling** — Card, Button, Tag, Navigation components to match new design
5. **Accessibility pass** — Connect SkipToContent, fix virtual list keyboard, add aria attributes, dynamic titles
6. **Interaction polish** — RouteTransition connection, micro-animation tuning, reduced-motion check
7. **Dark mode flip** — Change default from dark to light, ensure dark mode works as toggle
8. **Verification** — Responsive testing, WCAG contrast audit, keyboard nav audit, reduced-motion test

## Verification Criteria

- [ ] Typecheck passes (`pnpm check`)
- [ ] No runtime errors in light or dark mode
- [ ] All 3 pages render correctly at 375px, 768px, 1280px
- [ ] Keyboard navigation works for all interactive elements
- [ ] SkipToContent is first tabbable element
- [ ] Virtual list items keyboard-accessible
- [ ] Dynamic page titles update on route change
- [ ] Color contrast ≥4.5:1 for all text
- [ ] `prefers-reduced-motion` disables all animations
- [ ] Dark mode toggle works and persists
- [ ] All touch targets ≥44px
