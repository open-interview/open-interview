# Complete UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete ground-up visual redesign of Open Interview — a premium, dark-mode, developer-focused interview prep SPA (React 19 + Vite + wouter + Tailwind CSS + shadcn/ui).

**Architecture:** Relayer the design system on top of the existing `facelift.css` token layer. Rewrite the visual layer of all pages (Layout, SwipeStudy, MinimalProfile, StudyCard, FilterStrip, SessionSummary, EmptyState) while preserving all business logic, state management, data fetching, and routing. Each component gets a premium facelift using the existing gradient/glass/animation utilities from facelift.css.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS v4, shadcn/ui, framer-motion, wouter, lucide-react

**Design Tokens Used:**
- Colors: Dark navy (#0a0e1a) + violet/indigo (#6366f1, #7c3aed) + cyan (#06b6d4)
- Typography: Inter (body), JetBrains Mono (code)
- Effects: glassmorphism, gradient borders, aurora backgrounds, spring animations
- Spacing: 4/8dp system from facelift.css

---

### Task 1: Design Token System & Index CSS

**Files:**
- Modify: `client/src/index.css` (complete rewrite)
- Modify: `client/src/styles/facelift.css` (minor fixes, ensure tokens map correctly)
- Test: `pnpm check` (typecheck)

- [ ] **Step 1: Write updated index.css**

Write `client/src/index.css` with:
- Import Inter + JetBrains Mono fonts
- Import Tailwind CSS + tw-animate-css + facelift.css
- Backward compat aliases (`--surface-1`, `--color-accent-violet`, etc.)
- Base body typography with facelift.css tokens
- Focus styles (2px violet outline)
- Reduced motion support
- Global scrollbar styling
- Utility classes that reference facelift.css tokens (`.glass`, `.glow-violet`, `.gradient-text`, etc.)
- Tailwind theme mapping (`@theme inline`) to shadcn variables
- Dark theme (default) with deep navy + violet/indigo
- Light theme override
- Swipe card CSS variables (`--swipe-bg-card`, `--swipe-border`, `--swipe-chip-bg`, `--swipe-chip-text`)
- Mermaid diagram fluid sizing
- Accessibility overrides for low-contrast text

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=JetBrains+Mono:wght@400;500;700&display=swap');
@import "tailwindcss";
@import "tw-animate-css";
@import "./styles/facelift.css";

:root { /* backward compat aliases */ }
body { /* base styles */ }
/* ... full file as shown in the codebase */
```

- [ ] **Step 2: Run typecheck**

Run: `pnpm check`
Expected: No type errors (CSS changes only, no TS impact)

---

### Task 2: App Entry Point Enhancement

**Files:**
- Modify: `client/src/App.tsx`

- [ ] **Step 1: Write improved App.tsx with premium loading screen**

```tsx
// Premium loading screen using facelift.css tokens
// Animated pulse-ring, gradient brand icon, bouncing dots
// Move OfflineDetector inside the provider tree
// Keep all providers, routing, and SPA redirect logic intact
```

- [ ] **Step 2: Run typecheck**

Run: `pnpm check`
Expected: No type errors

---

### Task 3: Layout Redesign (Sidebar + Top Bar + Mobile Nav)

**Files:**
- Modify: `client/src/ui/Layout.tsx`

- [ ] **Step 1: Rewrite Layout.tsx with premium design**

Key changes:
- **PremiumLogo** component: gradient brand icon + subtitle "Technical Interview Prep"
- **Sidebar**: gradient background, active item with left bar + gradient bg, pro tip card with sparkles icon, profile footer with credits
- **Top bar**: backdrop-blur-xl, thinner (h-14), cleaner spacing, gradient credits badge
- **Mobile drawer**: gradient header with brand icon, active items with gradient bg
- **Mobile bottom nav**: thicker (h-16), active tab indicator bar, better spacing

```tsx
import React, { useState, useCallback } from 'react';
import { useLocation } from 'wouter';
import { BookOpen, User, ArrowLeft, Menu, Zap, Code2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCredits } from '@/context/RewardContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarHeader, SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider } from '@/components/ui/sidebar';
import { Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';

// PremiumLogo: gradient icon, brand name, subtitle
// Layout: sidebar with active indicators, pro tip card, profile footer
// Top bar: backdrop-blur, gradient credits badge
// Mobile nav: active indicator bar, thicker hit area
```

- [ ] **Step 2: Run typecheck**

Run: `pnpm check`
Expected: No type errors

---

### Task 4: StudyCard Redesign (Core Interaction)

**Files:**
- Modify: `client/src/components/swipe/StudyCard.tsx`

- [ ] **Step 1: Rewrite StudyCard.tsx with premium visuals**

Key changes:
- **Gradient border** using `gradient-border-subtle` from facelift.css
- **Swipe indicators**: overlay labels "Know it" (emerald) / "Review" (rose) that fade in as user drags
- **Front**: better typography hierarchy, gradient chip for mode, difficulty dot with shadow, expanded/read-more with better styling, "Tap to reveal answer" footer
- **Back**: gradient answer container, explanation with gradient border, diagram with cyan gradient header
- **Swipe glow**: gradient overlay (emerald/rose) instead of flat colors
- **Smoother animations**: spring physics (stiffness: 350, damping: 28), 0.45s card flip with custom easing

```tsx
// Full rewrite of the visual layer while keeping all props, handlers, and state logic
// Use gradient-border-subtle for card border
// Add swipe direction labels (Know it / Review) that use useTransform opacity
// Restructure front/back with better typography and gradient containers
// Keep all existing functionality: drag, tap-to-flip, recall rating bar, mermaid, hint, etc.
```

- [ ] **Step 2: Run typecheck**

Run: `pnpm check`
Expected: No type errors

---

### Task 5: CardFan Redesign

**Files:**
- Modify: `client/src/components/swipe/CardFan.tsx`

- [ ] **Step 1: Improve CardFan visual presentation**

Key changes:
- Better fan positions with tighter spread
- Premium blur/filter transitions
- Smoother spring animations matching StudyCard
- Responsive fan count (1 mobile, 3 tablet, 5 desktop)

```tsx
// Refine generateFanPositions for better visual spread
// Keep all existing logic but improve animation parameters
// Use same spring config as StudyCard (stiffness: 350, damping: 28)
// Animate blur + scale for inactive cards
```

- [ ] **Step 2: Run typecheck**

Run: `pnpm check`
Expected: No type errors

---

### Task 6: FilterStrip Redesign

**Files:**
- Modify: `client/src/components/swipe/FilterStrip.tsx`

- [ ] **Step 1: Rewrite FilterStrip with premium styling**

Key changes:
- Pill-style chips with gradient active state
- Mode buttons with pill design
- Better use of `cn()` for consistent styling
- Refined drawer for mobile overflow
- Transition effects on active state change

```tsx
// Use pill-shaped chips with gradient backgrounds for active
// Consistent h-8 rounded-full chip sizing
// Refined "More" drawer with better topic/cert grouping
// Keep all existing filter logic and callbacks intact
```

- [ ] **Step 2: Run typecheck**

Run: `pnpm check`
Expected: No type errors

---

### Task 7: SessionSummary Redesign

**Files:**
- Modify: `client/src/components/swipe/SessionSummary.tsx`

- [ ] **Step 1: Rewrite SessionSummary with premium dashboard feel**

Key changes:
- Gradient trophy icon with glow
- Bento-grid style stat cards with glass effect
- Better XP progress visualization with gradient progress bar
- Premium button styling with gradient borders
- Staggered entrance animations

```tsx
// Trophy icon with gradient + glow shadow
// Stat cards in 2-column grid with glass-card class
// Premium gradient progress bar for XP
// Gradient-border buttons for Study More / Go Home
// Staggered framer-motion entrance animations
// Keep all props and business logic
```

- [ ] **Step 2: Run typecheck**

Run: `pnpm check`
Expected: No type errors

---

### Task 8: EmptyState Redesign

**Files:**
- Modify: `client/src/components/swipe/EmptyState.tsx`

- [ ] **Step 1: Rewrite EmptyState with premium empty state design**

Key changes:
- Gradient target icon with float animation
- Better typography hierarchy
- Premium gradient buttons
- Floating animation on icon
- Cleaner spacing

```tsx
// Target icon with gradient + glow + float animation
// Gradient text for heading
// Premium gradient buttons for Browse / Study More
// Clean message layout with proper spacing
// Keep all existing props and logic
```

- [ ] **Step 2: Run typecheck**

Run: `pnpm check`
Expected: No type errors

---

### Task 9: SwipeStudy Page Redesign

**Files:**
- Modify: `client/src/pages/SwipeStudy.tsx`

- [ ] **Step 1: Rewrite SwipeStudy page layer**

Key changes:
- Apply `dot-grid` or subtle pattern background to page
- Better section spacing using facelift.css spacing tokens
- Premium filter strip integration
- Better empty/error state presentation
- Cleaner card area with proper padding

```tsx
// Wrap content in dot-grid pattern for subtle texture
// Apply --section-* spacing tokens
// Integrate with redesigned FilterStrip, CardFan, etc.
// Keep all business logic, hooks, state, and data loading intact
```

- [ ] **Step 2: Run typecheck**

Run: `pnpm check`
Expected: No type errors

---

### Task 10: MinimalProfile Redesign

**Files:**
- Modify: `client/src/pages/MinimalProfile.tsx`

- [ ] **Step 1: Rewrite profile page with dashboard-style layout**

Key changes:
- Section headers with gradient accent line
- Bento-grid layout for stats
- Premium stat cards with icons
- Better topic management display
- Gradient borders on interactive areas
- Feynman journal with better card presentation
- Custom card list with cleaner design

```tsx
// Section headers: "Progress" with gradient underline bar
// StreakRing in gradient-bordered card
// MasteryGrid with premium styling
// StatRow with icon + value + label in glass cards
// Topics section with enrollment counts
// FeynmanJournal with better card design
// CustomCardList with grid layout
// Keep all existing business logic, localStorage operations
```

- [ ] **Step 2: Run typecheck**

Run: `pnpm check`
Expected: No type errors

---

### Task 11: Supporting Components Redesign

**Files:**
- Modify: `client/src/components/swipe/StreakRing.tsx`
- Modify: `client/src/components/swipe/MasteryGrid.tsx`
- Modify: `client/src/components/swipe/StatRow.tsx`
- Modify: `client/src/components/swipe/FeynmanJournal.tsx`
- Modify: `client/src/components/swipe/CustomCardList.tsx`
- Modify: `client/src/components/swipe/SwipeHints.tsx`
- Modify: `client/src/components/swipe/UndoToast.tsx`

- [ ] **Step 1: Audit and update each component's visual layer**

Key changes:
- Replace raw hex colors with CSS variable references
- Use facelift.css utility classes (glass, card-premium, badge, etc.)
- Consistent use of border-border, text-muted-foreground, bg-card, etc.
- Add subtle hover transitions and press states
- Use consistent border radius (rounded-xl, rounded-2xl)

- [ ] **Step 2: Run typecheck**

Run: `pnpm check`
Expected: No type errors

---

### Task 12: Final Polish & Verification

**Files:**
- All modified files above

- [ ] **Step 1: Run full typecheck**

Run: `pnpm check`
Expected: Zero type errors

- [ ] **Step 2: Verify build**

Run: `pnpm build:static`
Expected: Build succeeds

- [ ] **Step 3: Check for emoji usage as icons**

Run: `grep -rn 'emoji\|🔥\|🎯\|✅\|⭐' client/src/ --include="*.tsx" --include="*.ts" | grep -v node_modules`
Expected: No emoji used as UI icons (only in decorative/empty states is acceptable)

- [ ] **Step 4: Verify Token Consistency**

Grep for raw hex colors in components (not in CSS files):
Run: `rg '#[0-9a-fA-F]{6}' client/src/ --include="*.tsx" --include="*.ts" | grep -v '.css' | grep -v 'node_modules'`
Expected: Minimal or no raw hex colors in component files (colors should come from CSS variables)
