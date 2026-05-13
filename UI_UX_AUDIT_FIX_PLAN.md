# UI/UX Audit & Fix Plan — Open Interview

> Audited: May 2026 | Stack: React + TypeScript + Tailwind CSS + Framer Motion

---

## Executive Summary

Three systemic problems dominate the UI: (1) **cards are full-width or near-full-width** in focused single-item contexts like Flashcards and SRS Review, where they should be narrow and centred; (2) **page headers, section titles, and footers consume 20–40% of viewport height** with oversized fonts, excessive padding, and decorative chrome that pushes content below the fold; (3) **font choices are inconsistent** — `Baloo 2` (a rounded display font) is set as `--font-heading` and bleeds into body copy, while `Plus Jakarta Sans` and `Inter` are both loaded but compete. The result is a UI that feels bloated, hard to scan, and visually noisy.

---

## Priority 1 — Critical (breaks usability)

### 1.1 Flashcards — card too wide, header wastes space
**File:** `client/src/pages/Flashcards.tsx`

| Issue | Current | Fix |
|-------|---------|-----|
| Card container has no max-width | `<div className="h-screen h-dvh flex flex-col ...">` — card fills full width | Wrap card in `max-w-lg mx-auto w-full` |
| Header row (`px-4 pt-4 pb-2`) is fine but the title "Flashcards" in empty state is `text-5xl md:text-6xl font-black` — enormous | `text-5xl md:text-6xl font-black mb-3` | Change to `text-2xl font-bold mb-2` |
| Empty state `py-20` wastes half the screen | `py-20` | Change to `py-10` |
| Channel filter pills row has `py-2` top+bottom — fine, but combined with header and progress bar the chrome is ~120px before the card | — | Reduce header `pt-4 pb-2` → `pt-2 pb-1`, progress bar `px-4` → `px-4 py-1` |

**Specific fix — card max-width:**
```tsx
// In the main return, wrap the card area:
<div className="flex-1 flex flex-col items-center justify-center px-4 overflow-hidden">
  <div className="w-full max-w-lg"> {/* ADD THIS WRAPPER */}
    {/* existing card motion.div */}
  </div>
</div>
```

---

### 1.2 SRS Review — card fills entire width
**File:** `client/src/pages/ReviewSession.tsx`

The review card renders inside `AppLayout` with `fullWidth` but no inner max-width constraint. On wide screens the question card stretches to 1200px+, making it unreadable.

**Fix:**
```tsx
// Wrap the card content area:
<div className="max-w-2xl mx-auto w-full px-4">
  {/* question card */}
</div>
```

Also: `PageHeader` from `@/components/ui/page` adds `py-8` padding by default — reduce to `py-4` for session pages.

---

### 1.3 AppLayout — desktop content area has no readable max-width for session pages
**File:** `client/src/components/layout/AppLayout.tsx` (line ~120)

```tsx
// Current — non-fullWidth pages:
className={fullWidth ? 'w-full overflow-x-hidden' : 'max-w-7xl mx-auto px-6 py-6 w-full overflow-x-hidden'}
```

`max-w-7xl` = 1280px. For reading/practice content this is too wide. Pages like QuestionViewer, TestSession, ReviewSession should use `max-w-3xl` or `max-w-4xl`.

**Fix — add a `contentWidth` prop:**
```tsx
interface AppLayoutProps {
  contentWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full'; // NEW
  // ...existing props
}

const widthClass = {
  sm:   'max-w-2xl',
  md:   'max-w-3xl',
  lg:   'max-w-4xl',
  xl:   'max-w-6xl',
  full: 'w-full',
}[contentWidth ?? 'xl'];
```

Then update callers:
- `TestSession.tsx` → `contentWidth="md"`
- `ReviewSession.tsx` → `contentWidth="md"`
- `CertificationExam.tsx` → `contentWidth="md"`
- `QuestionViewer.tsx` → `contentWidth="lg"`

---

## Priority 2 — High (major aesthetics/readability)

### 2.1 Font system — Baloo 2 is wrong for headings
**File:** `client/src/styles/design-system.css` (line ~115)

```css
/* Current */
--font-heading: 'Baloo 2', cursive;
```

`Baloo 2` is a rounded, playful display font. It looks out of place in a professional dev-tools app. It's also a heavy Google Fonts load.

**Fix:**
```css
--font-heading: 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif;
```

Remove `Baloo 2` from the Google Fonts import in `index.css`:
```css
/* Remove Baloo 2 from the @import url(...) */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&family=Plus+Jakarta+Sans:ital,wght@0,300..800;1,300..800&display=swap');
```
This also removes `Playfair+Display` which is unused in the app. Saves ~80KB of font loading.

---

### 2.2 Home page hero — massive wasted vertical space
**File:** `client/src/pages/home-facelift.tsx`

The hero section has floating orbs, aurora background, animated counters, and a grid pattern — all decorative. The actual CTA is pushed far below the fold.

Issues:
- `FloatingOrb` components with `size={500}` and `blur(250px)` — heavy GPU cost, no UX value
- Hero section likely has `py-24` or `py-32` padding
- Animated number counters add ~200ms delay before content is readable

**Fixes:**
- Reduce hero vertical padding: `py-24` → `py-12`, `py-32` → `py-16`
- Remove or reduce `FloatingOrb` sizes: `size={500}` → `size={300}`, reduce blur
- Make animated counters start from actual value (skip animation on first render) or remove entirely

---

### 2.3 AllChannels — channel cards use `rounded-3xl` and `p-5` — too much padding
**File:** `client/src/pages/AllChannels.tsx` (line ~105)

```tsx
className="group relative p-5 bg-card border border-border rounded-3xl cursor-pointer ..."
```

- `p-5` (20px all sides) is generous for a grid card. Reduce to `p-4` (16px).
- `rounded-3xl` (24px radius) is very large for a content card. Reduce to `rounded-2xl` (16px).
- The card grid should be `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4` not `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` — more cards visible without scrolling.

---

### 2.4 Facelift Navbar — dual navigation chrome
**File:** `client/src/components/layout/AppLayout.tsx` + `client/src/components/facelift-navbar.tsx`

The app renders **both** a top navbar (64px) AND a desktop sidebar (280px). On desktop this means ~344px of navigation chrome. The navbar is redundant on desktop since the sidebar already has all nav items.

**Fix:** Hide the facelift navbar on desktop (`lg:hidden`) and only show it on mobile:
```tsx
// In facelift-navbar.tsx, wrap the entire nav:
<nav className="lg:hidden fixed top-0 ...">
```
Or in AppLayout, only render FaceliftNavbar on mobile:
```tsx
{useFacelift && <div className="lg:hidden"><FaceliftNavbar ... /></div>}
```
This reclaims 64px of vertical space on desktop.

---

### 2.5 Facelift Footer — enormous link dump
**File:** `client/src/components/facelift-footer.tsx`

The footer has 4 category columns × 4 links + 6 practice links + 8 quick links = ~30 links. This is a marketing site footer pattern, not appropriate for an app. It adds ~300px of dead space at the bottom of every page.

**Fix:** Replace with a minimal 1-row footer:
```tsx
<footer className="border-t border-border/30 py-4 px-6 flex items-center justify-between text-xs text-muted-foreground">
  <span>© 2026 Open Interview</span>
  <div className="flex gap-4">
    <Link href="/about">About</Link>
    <Link href="/docs">Docs</Link>
    <a href="https://github.com/open-interview/open-interview" target="_blank">GitHub</a>
  </div>
</footer>
```

---

### 2.6 PageHeader component — excessive padding
**File:** `client/src/components/ui/page.tsx`

`PageHeader` is used across Profile, Badges, Bookmarks, AllChannels, etc. It likely has `py-8` or `mb-8` that adds 64px+ of space before content.

**Fix:** Audit `page.tsx` and reduce:
- `py-8` → `py-4`
- `mb-8` → `mb-4`
- Title font size: if using `text-3xl` or larger → `text-2xl`
- Subtitle: if `text-lg` → `text-sm text-muted-foreground`

---

### 2.7 QuestionCard — `lg` size padding is excessive
**File:** `client/src/components/unified/QuestionCard.tsx` (line ~55)

```tsx
lg: {
  padding: 'px-4 sm:px-6 lg:px-8 py-4 sm:py-6',
  title: 'text-lg sm:text-xl lg:text-2xl',
  meta: 'text-xs sm:text-sm'
}
```

`lg:px-8 py-6` = 32px horizontal, 24px vertical padding. For a question card this is too much — it reduces the visible question text area.

**Fix:**
```tsx
lg: {
  padding: 'px-4 sm:px-5 lg:px-6 py-3 sm:py-4',
  title: 'text-base sm:text-lg lg:text-xl',
  meta: 'text-[10px] sm:text-xs'
}
```

---

## Priority 3 — Polish

### 3.1 Sidebar — too many sections, "Tools" section with single item
**File:** `client/src/components/layout/Sidebar.tsx`

The sidebar has 4 sections: Learn, Practice, Progress, Tools. "Tools" has only 1 item (Art Studio). Merge it into Progress or remove the section label.

Also: `badge: 'NEW'` on multiple items creates visual noise. Limit to 1–2 NEW badges max.

---

### 3.2 Badges page — `PageHeader` + `FilterPills` + section title = triple header
**File:** `client/src/pages/Badges.tsx`

The page stacks: PageHeader → FilterPills → section heading. That's 3 layers of chrome before any badge is visible. Merge PageHeader and FilterPills into one row.

---

### 3.3 Profile page — charts section has no max-width
**File:** `client/src/pages/Profile.tsx`

Recharts `ResponsiveContainer` stretches to full width. On wide screens bar charts become unreadably wide. Wrap chart sections in `max-w-2xl`.

---

### 3.4 TestSession — results screen has `py-20` padding
**File:** `client/src/pages/TestSession.tsx`

The results/review screen likely has large vertical padding. Reduce to `py-8`.

---

### 3.5 Reduce motion/animation overhead
Multiple pages use `framer-motion` `AnimatePresence` + `stagger` + `useInView` for every card. On low-end devices this causes jank.

**Fix:** Wrap heavy animations in `useReducedMotion` check (hook already exists at `client/src/hooks/use-reduced-motion.ts`):
```tsx
const prefersReduced = useReducedMotion();
// Skip stagger animations if prefersReduced
```

---

## Global CSS Fixes

### index.css

```css
/* Current — loads 4 font families */
@import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&family=Plus+Jakarta+Sans:ital,wght@0,300..800;1,300..800&family=Playfair+Display:wght@700&display=swap');

/* Fix — remove Baloo 2 and Playfair Display */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
```

Also add `font-display: swap` to avoid FOIT.

---

### design-system.css

```css
/* Fix font heading */
--font-heading: 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif;

/* Fix body line-height — 1.5 is tight for reading */
--leading-normal: 1.6;
--leading-body:   1.8;
```

---

### facelift.css

The file is ~50KB of CSS variables and token definitions. Key issues:

1. **Duplicate token definitions** — `--color-success`, `--color-warning`, `--color-error` are defined in both `facelift.css` and `design-system.css` with slightly different values. Consolidate to one source.

2. **Legacy aliases** — 15+ `@deprecated` aliases still in use. These add confusion. Schedule removal.

3. **No max-width token for content** — add:
```css
--content-width-sm:  640px;
--content-width-md:  768px;
--content-width-lg:  1024px;
--content-width-xl:  1280px;
--content-width-card: 512px; /* for SRS/flashcard single-card views */
```

---

## Component-by-Component Fixes

### `Flashcards.tsx`
- [ ] Add `max-w-lg mx-auto` wrapper around the card
- [ ] Reduce empty-state title from `text-5xl md:text-6xl` → `text-2xl`
- [ ] Reduce empty-state `py-20` → `py-10`
- [ ] Reduce header `pt-4 pb-2` → `pt-2 pb-1`

### `ReviewSession.tsx` (SRS)
- [ ] Add `max-w-2xl mx-auto` wrapper around question/answer card
- [ ] Reduce `PageHeader` padding

### `AppLayout.tsx`
- [ ] Add `contentWidth` prop with sensible defaults per page type
- [ ] Hide `FaceliftNavbar` on `lg:` breakpoint (sidebar already handles nav)
- [ ] Reduce desktop `py-6` content padding → `py-4`

### `facelift-navbar.tsx`
- [ ] Add `lg:hidden` to hide on desktop (sidebar replaces it)
- [ ] Shrink mobile height: `HEADER_HEIGHT_EXPANDED = 64` → `56`

### `facelift-footer.tsx`
- [ ] Replace 4-column link dump with single-row minimal footer
- [ ] Remove `categoryLinks`, `practiceLinks` arrays — these duplicate sidebar nav

### `AllChannels.tsx`
- [ ] Channel card: `p-5` → `p-4`, `rounded-3xl` → `rounded-2xl`
- [ ] Grid: add `xl:grid-cols-4` for wider screens

### `QuestionCard.tsx`
- [ ] `lg` size: reduce padding and font sizes (see Priority 2.7)
- [ ] `md` size: `px-3 sm:px-4 lg:px-6 py-3 sm:py-4` → `px-3 sm:px-4 py-3`

### `Sidebar.tsx`
- [ ] Merge "Tools" section into "Progress"
- [ ] Limit `badge: 'NEW'` to max 2 items

### `Badges.tsx`
- [ ] Merge PageHeader + FilterPills into single row
- [ ] Reduce section title padding

### `Profile.tsx`
- [ ] Wrap chart sections in `max-w-2xl`
- [ ] Reduce `PageHeader` padding

### `home-facelift.tsx`
- [ ] Reduce hero `py-24/py-32` → `py-12/py-16`
- [ ] Reduce `FloatingOrb` sizes by 40%
- [ ] Make stat counters non-animated (or instant) on first load

---

## Quick Wins (< 30 min each)

1. **Remove Baloo 2 font** — saves 80KB, fixes heading aesthetics immediately
2. **Add `max-w-lg mx-auto` to Flashcards card** — fixes the #1 user complaint
3. **Add `max-w-2xl mx-auto` to ReviewSession card** — fixes SRS card width
4. **Hide FaceliftNavbar on desktop** — reclaims 64px vertical space
5. **Replace footer with minimal 1-row version** — removes ~300px dead space
6. **Reduce `PageHeader` padding globally** — `py-8` → `py-4` in `page.tsx`
