# OpenInterview UI/UX Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the OpenInterview app from a dark Twitter/X-clone aesthetic to a warm minimal editorial experience with light-first design, consolidated CSS, and full accessibility.

**Architecture:** 28 tasks across 6 groups: CSS consolidation → Layout restructure → Component restyling → Interactions → Accessibility → Dark mode flip. Each group produces independently testable changes. Design tokens centralized in `tokens.css`; `facelift.css` and `design-system.css` removed/replaced.

**Tech Stack:** React 19, Vite 7, Tailwind CSS v4, shadcn/ui (new-york style), framer-motion, lucide-react, Inter + DM Sans + JetBrains Mono

---

## File Structure

### Files to Create
- `client/src/styles/tokens.css` — Consolidated design tokens (colors, typography, spacing, radii, animations). Light + dark mode. Tailwind v4 `@theme inline` bridge. Replaces facelift.css and design-system.css.

### Files to Modify
- `client/src/index.css` — Update imports: remove facelift.css, add tokens.css
- `client/src/styles/facelift.css` — Delete (migrate remaining utility classes to tokens.css or remove)
- `client/src/styles/design-system.css` — Delete (fully legacy, overlapping)
- `client/src/ui/Layout.tsx` — Remove left icon nav, restructure to top-header layout, connect SkipToContent
- `client/src/components/navigation/TopBar.tsx` — Refactor to slim header (logo + actions)
- `client/src/components/navigation/MobileBottomNav.tsx` — Fix dead-code issue, wire into Layout
- `client/src/components/navigation/RouteTransition.tsx` — Connect for page transitions
- `client/src/components/navigation/SkipToContent.tsx` — Already exists, just needs rendering
- `client/src/App.tsx` — Add dynamic `<title>` updates per route
- `client/src/components/ui/button.tsx` — Update color tokens, remove glow variant, add editorial styling
- `client/src/components/ui/card.tsx` — Update radius and border tokens
- `client/src/components/feed/FeedCard.tsx` — Restyle for editorial look
- `client/src/components/swipe/StudyCard.tsx` — Restyle
- `client/src/components/swipe/CardFan.tsx` — Restyle container
- `client/src/pages/KnowledgeFeed.tsx` — Minor layout adjustments for new header
- `client/src/pages/SwipeStudy.tsx` — Minor layout adjustments
- `client/src/pages/MinimalProfile.tsx` — Minor styling updates
- `client/src/components/ui/sonner.tsx` — Fix theme reactivity (reads localStorage at module level)
- `client/src/types/index.ts` — Update ThemeConfig if needed

### Files to Verify (already exist, should work as-is)
- `client/src/hooks/use-focus-trap.ts` — Needs to be connected to Omnibar
- `client/src/hooks/use-announcer.ts` — Needs to be connected for dynamic content
- `client/src/context/ThemeContext.tsx` — Needs default theme flip from dark to light

---

### Task 1: Create consolidated design tokens CSS

**Files:**
- Create: `client/src/styles/tokens.css`
- Modify: `client/src/index.css` (update imports, remove facelift/design-system)

- [ ] **Step 1: Create tokens.css with all design tokens**

```css
/* =============================================
   Layer 1: Primitive Tokens (immutable values)
   ============================================= */
:root {
  --black: #1A1A18;
  --white: #FFFFFF;
  --warm-paper: #F7F6F3;
  --warm-white: #FFFFFF;
  --dark-bg: #161512;
  --dark-surface: #1E1D1A;
  --dark-elevated: #2A2924;

  --burgundy-600: #C73E3A;
  --burgundy-500: #D9504C;
  --burgundy-400: #E85D5A;
  --burgundy-100: #F5E6E4;

  --emerald-700: #2B7A4B;
  --emerald-500: #4CAF78;
  --emerald-100: #E6F2EB;

  --amber-700: #B05A1A;
  --amber-500: #E08C3A;
  --amber-100: #F5EEE4;

  --gray-900: #1A1A18;
  --gray-700: #5C5A55;
  --gray-500: #787774;
  --gray-300: #A09E98;
  --gray-200: #D0CFC8;
  --gray-100: #E8E7E2;
  --gray-50: #F0EFEA;

  --font-heading: 'DM Sans', system-ui, sans-serif;
  --font-body: 'Inter', system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', 'SF Mono', 'Fira Code', monospace;

  --text-xs: 0.6875rem;
  --text-sm: 0.8125rem;
  --text-base: 0.9375rem;
  --text-lg: 1.0625rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 1.75rem;

  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-12: 3rem;

  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-pill: 9999px;
}

/* =============================================
   Layer 2: Semantic Tokens (theme-aware)
   ============================================= */
:root {
  --bg: var(--warm-paper);
  --surface: var(--warm-white);
  --surface-elevated: var(--gray-50);
  --fg: var(--gray-900);
  --fg-secondary: var(--gray-700);
  --fg-muted: var(--gray-500);
  --border: var(--gray-100);
  --border-light: var(--gray-50);
  --accent: var(--burgundy-600);
  --accent-subtle: var(--burgundy-100);
  --accent-fg: var(--white);
  --success: var(--emerald-700);
  --success-subtle: var(--emerald-100);
  --warning: var(--amber-700);
  --warning-subtle: var(--amber-100);
  --error: var(--burgundy-600);
  --error-subtle: var(--burgundy-100);
}

[data-theme='dark'] {
  --bg: var(--dark-bg);
  --surface: var(--dark-surface);
  --surface-elevated: var(--dark-elevated);
  --fg: #F0EFEA;
  --fg-secondary: #A09E98;
  --fg-muted: #787470;
  --border: #2E2D28;
  --border-light: #3A3934;
  --accent: var(--burgundy-400);
  --accent-subtle: #3D201E;
  --accent-fg: #1A1A18;
  --success: var(--emerald-500);
  --success-subtle: #1E3D2E;
  --warning: var(--amber-500);
  --warning-subtle: #3D2E1E;
  --error: var(--burgundy-400);
  --error-subtle: #3D201E;
}

/* =============================================
   Layer 3: Shadcn Bridge (mapped via @theme inline in index.css)
   ============================================= */
:root {
  --background: var(--bg);
  --foreground: var(--fg);
  --card: var(--surface);
  --card-foreground: var(--fg);
  --popover: var(--surface);
  --popover-foreground: var(--fg);
  --primary: var(--accent);
  --primary-foreground: var(--accent-fg);
  --secondary: var(--surface-elevated);
  --secondary-foreground: var(--fg-secondary);
  --muted: var(--surface-elevated);
  --muted-foreground: var(--fg-muted);
  --accent: var(--accent-subtle);
  --accent-foreground: var(--accent);
  --destructive: var(--error);
  --destructive-foreground: var(--white);
  --border: var(--border);
  --input: var(--border);
  --ring: var(--accent);
  --radius: var(--radius-md);
}

/* =============================================
   Base Styles
   ============================================= */
body {
  background-color: var(--bg);
  color: var(--fg);
  font-family: var(--font-body);
  font-size: var(--text-base);
  line-height: 1.65;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* =============================================
   Typography Utilities
   ============================================= */
.font-heading { font-family: var(--font-heading); }
.font-body { font-family: var(--font-body); }
.font-mono { font-family: var(--font-mono); }

/* =============================================
   Animation Keyframes
   ============================================= */
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes slide-up-blur {
  from { opacity: 0; transform: translateY(8px); filter: blur(4px); }
  to { opacity: 1; transform: translateY(0); filter: blur(0); }
}

/* =============================================
   Reduced Motion
   ============================================= */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

- [ ] **Step 2: Update index.css**

Read `client/src/index.css` then replace with:

```css
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
@import "tailwindcss";
@import "./styles/tokens.css";

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --radius: var(--radius);
  --font-sans: var(--font-body);
  --font-heading: var(--font-heading);
  --font-mono: var(--font-mono);
}
```

Keep the remaining utility classes (scrollbar, safe-area, skeleton-shimmer, etc.) from the old index.css that aren't in tokens.css.

- [ ] **Step 3: Delete design-system.css**

Run: `rm client/src/styles/design-system.css`

- [ ] **Step 4: Strip facelift.css to only essential utilities**

Read `client/src/styles/facelift.css`, then replace its contents with only the editorial utility classes needed (glass, gradient-text, etc.) that aren't in tokens.css. Target ~200 lines max. Remove all token declarations (now in tokens.css).

---

### Task 2: Add DM Sans font and update typography tokens

**Files:**
- Modify: `client/src/styles/tokens.css` (fonts already included above)
- Modify: `client/src/index.css` (font import already in Task 1)
- Modify: `client/src/components/ui/button.tsx`

- [ ] **Step 1: Verify font loading**

Ensure Google Fonts URL includes DM Sans + Inter + JetBrains Mono (already done in Task 1).

- [ ] **Step 2: Update tailwind font-family config**

In `client/src/index.css` `@theme inline` block, already set `--font-sans` and `--font-heading`. Verify `font-heading` and `font-mono` token mappings.

- [ ] **Step 3: Apply heading font to key elements**

In `client/src/ui/Layout.tsx`, find the logo/brand element and add `font-heading` class.

---

### Task 3: Restructure Layout.tsx — remove left nav, slim top header

**Files:**
- Modify: `client/src/ui/Layout.tsx`
- Delete: (no left nav files to delete, just code)

- [ ] **Step 1: Read current Layout.tsx**

Read the full file to understand current structure.

- [ ] **Step 2: Remove left icon nav**

Delete the `w-[68px]` left sidebar with icon buttons. Move any essential actions (theme toggle, profile) into the top header.

- [ ] **Step 3: Replace with slim top header**

Add a slim `h-12` header bar:
- Left: Logo text "openinterview" in DM Sans 600
- Center: Empty (content area breathes)
- Right: Search icon · Theme toggle (sun/moon) · Avatar/Profile

Make it sticky with `bg-[var(--surface)]/80 backdrop-blur-xl border-b border-[var(--border)]`.

- [ ] **Step 4: Center the content column**

Change the content area from `max-w-[800px]` to `max-w-[680px] mx-auto`. Remove the `border-x border-[#2f3336]` (Twitter clone border).

- [ ] **Step 5: Make sidebar xl-only**

Change the right sidebar wrapper from hidden `md:flex`/`xl:flex` to only show at `xl:` breakpoint.

- [ ] **Step 6: Wire the correct MobileBottomNav**

Import `MobileBottomNav` from `@/components/navigation/MobileBottomNav` and render it at the bottom. Remove the inline 3-tab nav that's currently in Layout.tsx.

---

### Task 4: Refactor TopBar.tsx for slim header

**Files:**
- Modify: `client/src/components/navigation/TopBar.tsx`

- [ ] **Step 1: Read current TopBar.tsx**

- [ ] **Step 2: Simplify to match new header design**

Remove: Credits display (Zap icon + number), back button
Keep: Title (optional), dark/light toggle
Make height: `h-12` (48px), match new header style

---

### Task 5: Connect MobileBottomNav (fix dead code)

**Files:**
- Modify: `client/src/components/navigation/MobileBottomNav.tsx`

- [ ] **Step 1: Read current MobileBottomNav.tsx**

Currently has 2 tabs (Study, Profile). Needs 3 tabs (Feed, Study, Profile).

- [ ] **Step 2: Update to 3 tabs**

```tsx
const tabs = [
  { id: 'feed', label: 'Feed', icon: House }
  { id: 'study', label: 'Study', icon: Target }
  { id: 'profile', label: 'You', icon: User }
]
```

- [ ] **Step 3: Add accent dot indicator**

Replace current active highlight with a small 2px dot above the active icon. Use `--accent` color.

- [ ] **Step 4: Update styling**

Replace `gradient-text`/`glow-violet` with clean accent color. Match `--surface` bg, `--border` top border.

---

### Task 6: Restyle Button component

**Files:**
- Modify: `client/src/components/ui/button.tsx`

- [ ] **Step 1: Read current button.tsx**

- [ ] **Step 2: Update color tokens**

Replace violet/indigo tokens with new burgundy accent tokens:
- `default` variant: `bg-[var(--accent)] text-[var(--accent-fg)] hover:opacity-90`
- `destructive`: `bg-[var(--error)] text-white hover:opacity-90`
- `outline`: `border-[var(--border)] bg-transparent hover:bg-[var(--surface-elevated)]`
- `secondary`: `bg-[var(--surface-elevated)] text-[var(--fg)] hover:opacity-80`
- `ghost`: `hover:bg-[var(--surface-elevated)] text-[var(--fg)]`
- Remove `glow` variant entirely

- [ ] **Step 3: Update interaction styles**

Replace `hover:scale-[1.02]` with `active:scale-[0.98]` for press feedback. Keep `transition-colors` for hover.

- [ ] **Step 4: Update sizing**

Height: default `h-9` (36px), sm `h-7` (28px), lg `h-11` (44px). Radius: `rounded-[8px]`.

---

### Task 7: Restyle Card component

**Files:**
- Modify: `client/src/components/ui/card.tsx`

- [ ] **Step 1: Read current card.tsx**

- [ ] **Step 2: Update styling**

```tsx
<div className={cn(
  'rounded-[12px] border border-[var(--border)] bg-[var(--surface)]',
  className
)} {...props} />
```

Remove `shadow-sm` in light mode (editorial flat look). In dark mode, add `shadow` for depth.

---

### Task 8: Restyle FeedCard

**Files:**
- Modify: `client/src/components/feed/FeedCard.tsx`

- [ ] **Step 1: Read current FeedCard.tsx**

- [ ] **Step 2: Update question title to heading font**

Change the question text to use `font-[var(--font-heading)]` with weight 500 and size equivalent to `text-xl`.

- [ ] **Step 3: Update tag styling**

Tags: `rounded-[6px] px-[10px] py-[4px] text-[11px] font-medium uppercase tracking-wider font-[var(--font-body)]`

Difficulty tags: emerald (easy), amber (medium), rose (hard) — accessible hues.

- [ ] **Step 4: Update action buttons**

Replace any `glow` or gradient buttons with new flat editorial button style.

- [ ] **Step 5: Update colors**

Replace any hardcoded `#e7e9ea` or `#71767b` with `var(--fg-secondary)` and `var(--fg-muted)`.

---

### Task 9: Restyle Study components

**Files:**
- Modify: `client/src/components/swipe/StudyCard.tsx`
- Modify: `client/src/components/swipe/CardFan.tsx`

- [ ] **Step 1: Read current StudyCard.tsx and CardFan.tsx**

- [ ] **Step 2: Update card background and borders**

Match card styling to new design (white surface, 12px radius, accent border).

- [ ] **Step 3: Update typography**

Question title: `font-[var(--font-heading)]`. Body/answer: `font-[var(--font-body)]`.

---

### Task 10: Connect RouteTransition for page crossfades

**Files:**
- Modify: `client/src/components/navigation/RouteTransition.tsx`
- Modify: `client/src/ui/Layout.tsx` or `client/src/App.tsx`

- [ ] **Step 1: Read current RouteTransition.tsx and App.tsx**

- [ ] **Step 2: Wrap route content with RouteTransition in App.tsx**

```tsx
<RouteTransition>
  <Suspense fallback={<LoadingScreen />}>
    <Switch>...</Switch>
  </Suspense>
</RouteTransition>
```

Crossfade: opacity 0→1, 250ms, no slide.

---

### Task 11: Connect SkipToContent

**Files:**
- Modify: `client/src/ui/Layout.tsx`

- [ ] **Step 1: Import and render SkipToContent**

```tsx
import { SkipToContent } from '@/components/navigation/SkipToContent'

// In Layout render, as first child:
<>
  <SkipToContent />
  {/* rest of layout */}
</>
```

- [ ] **Step 2: Add `id="main-content"` to main element**

Find the `<main>` element and ensure it has `id="main-content"` so the skip link targets it.

---

### Task 12: Fix virtual list keyboard accessibility

**Files:**
- Modify: `client/src/pages/KnowledgeFeed.tsx`

- [ ] **Step 1: Find the virtual list in KnowledgeFeed**

Look for `@tanstack/react-virtual` usage.

- [ ] **Step 2: Add keyboard accessibility**

```tsx
<div
  role="list"
  aria-label="Question feed"
>
  {virtualItems.map(item => (
    <div
      key={item.key}
      ref={virtualizer.measureElement}
      data-index={item.index}
      role="listitem"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleCardClick(item.index)
        }
      }}
    >
      {/* card content */}
    </div>
  ))}
</div>
```

---

### Task 13: Add dynamic page titles

**Files:**
- Modify: `client/src/App.tsx`

- [ ] **Step 1: Add useLocation listener for title updates**

```tsx
import { useLocation } from 'wouter'

function usePageTitle() {
  const [location] = useLocation()

  useEffect(() => {
    const titles: Record<string, string> = {
      '/': 'Feed — OpenInterview',
      '/feed': 'Feed — OpenInterview',
      '/study': 'Study — OpenInterview',
      '/profile': 'Profile — OpenInterview',
    }
    const base = Object.entries(titles).find(([path]) =>
      location.startsWith(path)
    )?.[1] || 'OpenInterview'
    document.title = base
  }, [location])
}
```

Call `usePageTitle()` inside `AppContent`.

---

### Task 14: Add aria attributes to feed cards

**Files:**
- Modify: `client/src/components/feed/FeedCard.tsx`

- [ ] **Step 1: Add `role="article"` and `aria-label`**

```tsx
<article
  className="..."
  role="article"
  aria-label={`Question: ${question.question}`}
>
```

- [ ] **Step 2: Add aria-live region for answer reveal**

```tsx
<div aria-live="polite" aria-atomic="true">
  {showAnswer && <p>{question.answer}</p>}
</div>
```

---

### Task 15: Fix Toast accessibility and Sonner theme reactivity

**Files:**
- Modify: `client/src/components/ui/sonner.tsx`
- Modify: `client/src/components/ToastQueue.tsx`

- [ ] **Step 1: Fix Sonner toaster theme (module-level localStorage bug)**

In `sonner.tsx`, the theme is read at module level via `localStorage.getItem('theme')`. Change it to read from the ThemeContext or use a reactive approach:

```tsx
import { useTheme } from 'next-themes' // or equivalent context

// Inside component:
const { theme } = useTheme()
const resolvedTheme = theme === 'dark' ? 'dark' : 'light'

<Toaster theme={resolvedTheme} ... />
```

- [ ] **Step 2: Add `role="status"` to toasts**

If using sonner, set `toastOptions`:

```tsx
<Toaster
  toastOptions={{
    role: 'status',
    'aria-live': 'polite',
  }}
/>
```

---

### Task 16: Connect useFocusTrap to Omnibar

**Files:**
- Modify: `client/src/components/Omnibar.tsx` or `client/src/components/Omnibar.tsx`

- [ ] **Step 1: Find Omnibar component**

- [ ] **Step 2: Apply focus trap when open**

```tsx
import { useFocusTrap } from '@/hooks/use-focus-trap'

function Omnibar({ open, onClose }) {
  const focusTrapRef = useFocusTrap(open)
  // ...
  return open ? (
    <div ref={focusTrapRef}>
      {/* command palette content */}
    </div>
  ) : null
}
```

---

### Task 17: Flip default theme from dark to light

**Files:**
- Modify: `client/src/context/ThemeContext.tsx`

- [ ] **Step 1: Change default theme**

Find where the initial theme is determined:

```tsx
// Before:
const stored = localStorage.getItem('theme')
const initial = stored === 'light' || stored === 'dark' ? stored : 'dark'

// After:
const stored = localStorage.getItem('theme')
const initial = stored === 'light' || stored === 'dark' ? stored : 'light'
```

- [ ] **Step 2: Update meta theme-color**

When theme changes, update `<meta name="theme-color">` to match `var(--bg)`.

---

### Task 18: Run typecheck and verify

**Files:**
- N/A (verification step)

- [ ] **Step 1: Run TypeScript check**

Run: `pnpm check`
Expected: No type errors.

- [ ] **Step 2: Search for broken imports**

Run: `rg "from ['\"]@/styles/(facelift|design-system)"`
Expected: No results (both files deleted).

- [ ] **Step 3: Verify build**

Run: `pnpm build:static` (or `pnpm vite build` for just the frontend)
Expected: Build succeeds.

---

### Self-Review Checklist

- [ ] **Spec coverage:** Every requirement from the design spec has a corresponding task:
  - CSS tokens (Task 1) ✓
  - Layout restructure (Task 3) ✓
  - TopBar (Task 4) ✓
  - MobileBottomNav (Task 5) ✓
  - Buttons (Task 6) ✓
  - Cards (Task 7, 8, 9) ✓
  - RouteTransition (Task 10) ✓
  - SkipToContent (Task 11) ✓
  - Virtual list a11y (Task 12) ✓
  - Dynamic titles (Task 13) ✓
  - ARIA attributes (Task 14) ✓
  - Toast a11y (Task 15) ✓
  - Focus trap (Task 16) ✓
  - Dark mode flip (Task 17) ✓
  - Typecheck (Task 18) ✓

- [ ] **No placeholders** — every step has actual code

- [ ] **Type consistency** — all token names, CSS variables, and React props consistent across tasks
