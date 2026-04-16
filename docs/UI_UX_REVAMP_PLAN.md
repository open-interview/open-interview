# 🎬 Code Reels — UI/UX Pro Max Revamp Plan
> 10 Specialized Agents | Full-Stack Design Overhaul | April 2026

---

## 🎯 Vision

Transform Code Reels from a functional app into a **world-class, addictive learning experience** that rivals Linear, Vercel, and Raycast in polish — while feeling as native as a top-tier mobile app. Every pixel intentional. Every interaction delightful.

**Design Philosophy:** Dark-first, neon-accented, glassmorphic surfaces, fluid motion, zero cognitive load.

---

## 📐 Current State Audit

### Stack
- React 19 + TypeScript + Tailwind 4 + Framer Motion
- Radix UI primitives + shadcn/ui
- Wouter routing
- CSS custom properties design system (`design-system.css`)

### Current Design System
- Primary: violet/indigo (`#7c3aed`, `#6366f1`) + cyan (`#06b6d4`)
- Background: near-black (`#0a0e1a`)
- Already has: glow effects, gradients, shadows, spacing tokens

### Key Pages (20+)
| Page | File | Priority |
|------|------|----------|
| Home | `components/home/HomePage.tsx` | 🔴 Critical |
| Question Viewer | `pages/QuestionViewer.tsx` | 🔴 Critical |
| Voice Interview | `pages/VoiceInterview.tsx` | 🔴 Critical |
| Learning Paths | `pages/UnifiedLearningPaths.tsx` | 🟠 High |
| Tests | `pages/Tests.tsx` + `TestSession.tsx` | 🟠 High |
| Certifications | `pages/Certifications.tsx` | 🟠 High |
| Stats/Profile | `pages/Stats.tsx` + `Profile.tsx` | 🟡 Medium |
| Badges | `pages/Badges.tsx` | 🟡 Medium |
| Channels | `pages/AllChannels.tsx` | 🟡 Medium |
| Review Session | `pages/ReviewSession.tsx` | 🟡 Medium |

### Navigation
- `components/layout/UnifiedNav.tsx` — desktop sidebar + mobile bottom nav
- `components/layout/AppLayout.tsx` — shell wrapper
- `components/layout/MobileHeader.tsx` — mobile top bar

### Pain Points Identified
1. **Inconsistent spacing** — multiple competing spacing systems
2. **Typography hierarchy** — no clear type scale, mixed font sizes
3. **Card designs** — 4+ different card styles across pages
4. **Color usage** — accent colors used inconsistently
5. **Mobile nav** — bottom nav labels sometimes visible, sometimes not
6. **Loading states** — skeleton loaders inconsistent
7. **Empty states** — generic, not branded
8. **Animations** — some pages have rich motion, others are static
9. **Home page** — too much content, unclear primary CTA
10. **Voice UI** — recording state not visually prominent enough

---

## 🏗️ Agent Team Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                    AGENT TEAM OVERVIEW                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Agent 1: Design System Architect                               │
│    └─► Tokens, typography, palette, spacing → design-system.css │
│                                                                 │
│  Agent 2: Layout & Navigation Specialist                        │
│    └─► Sidebar, bottom nav, header, routing shell               │
│                                                                 │
│  Agent 3: Home Page Engineer                                    │
│    └─► Hero, stats, quick-actions, daily challenge              │
│                                                                 │
│  Agent 4: Question Viewer Specialist                            │
│    └─► Swipe cards, answer panel, progress                      │
│                                                                 │
│  Agent 5: Voice Interview UX Engineer                           │
│    └─► Recording UI, waveform, transcript, feedback             │
│                                                                 │
│  Agent 6: Learning Paths & Channels UX                          │
│    └─► Path cards, channel grid, progress rings                 │
│                                                                 │
│  Agent 7: Gamification & Rewards UX                             │
│    └─► Badges, XP bar, streaks, achievement toasts              │
│                                                                 │
│  Agent 8: Tests & Certifications UX                             │
│    └─► Quiz flow, timer, results, cert cards                    │
│                                                                 │
│  Agent 9: Profile & Stats UX                                    │
│    └─► Charts, heatmap, profile card, bookmarks                 │
│                                                                 │
│  Agent 10: Polish & Micro-interactions                          │
│    └─► Animations, transitions, loading, empty states           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎨 Agent 1 — Design System Architect

**Files:** `client/src/styles/design-system.css`, `client/src/index.css`

### Deliverables

#### Color Palette Upgrade
```css
/* NEW: Richer, more intentional palette */
--color-brand-primary:   #7c3aed;   /* violet — main brand */
--color-brand-secondary: #06b6d4;   /* cyan — secondary accent */
--color-brand-tertiary:  #f59e0b;   /* amber — XP/rewards */
--color-brand-success:   #10b981;   /* emerald — correct/pass */
--color-brand-danger:    #f43f5e;   /* rose — error/fail */

/* Surface hierarchy (5 levels) */
--surface-0: #050810;   /* page background */
--surface-1: #0a0e1a;   /* card background */
--surface-2: #0f1629;   /* elevated card */
--surface-3: #141d35;   /* modal/overlay */
--surface-4: #1a2540;   /* hover state */

/* Text hierarchy */
--text-primary:   rgba(255,255,255,0.95);
--text-secondary: rgba(255,255,255,0.65);
--text-tertiary:  rgba(255,255,255,0.40);
--text-disabled:  rgba(255,255,255,0.25);
```

#### Typography Scale
```css
/* NEW: Fluid type scale */
--font-display: 'Inter', system-ui;
--font-mono:    'JetBrains Mono', monospace;

--text-xs:   0.75rem;   /* 12px — labels, captions */
--text-sm:   0.875rem;  /* 14px — body small */
--text-base: 1rem;      /* 16px — body */
--text-lg:   1.125rem;  /* 18px — body large */
--text-xl:   1.25rem;   /* 20px — heading small */
--text-2xl:  1.5rem;    /* 24px — heading */
--text-3xl:  1.875rem;  /* 30px — heading large */
--text-4xl:  2.25rem;   /* 36px — display */
--text-5xl:  3rem;      /* 48px — hero */

/* Line heights */
--leading-tight:  1.25;
--leading-snug:   1.375;
--leading-normal: 1.5;
--leading-relaxed: 1.625;
```

#### Spacing Scale
```css
/* 4px base grid */
--space-1:  0.25rem;   /* 4px */
--space-2:  0.5rem;    /* 8px */
--space-3:  0.75rem;   /* 12px */
--space-4:  1rem;      /* 16px */
--space-5:  1.25rem;   /* 20px */
--space-6:  1.5rem;    /* 24px */
--space-8:  2rem;      /* 32px */
--space-10: 2.5rem;    /* 40px */
--space-12: 3rem;      /* 48px */
--space-16: 4rem;      /* 64px */
--space-20: 5rem;      /* 80px */
--space-24: 6rem;      /* 96px */
```

#### Border Radius
```css
--radius-sm:   4px;
--radius-md:   8px;
--radius-lg:   12px;
--radius-xl:   16px;
--radius-2xl:  20px;
--radius-3xl:  24px;
--radius-full: 9999px;
```

#### Animation Tokens
```css
--duration-instant: 50ms;
--duration-fast:    150ms;
--duration-normal:  250ms;
--duration-slow:    400ms;
--duration-slower:  600ms;

--ease-spring:  cubic-bezier(0.34, 1.56, 0.64, 1);
--ease-smooth:  cubic-bezier(0.4, 0, 0.2, 1);
--ease-in:      cubic-bezier(0.4, 0, 1, 1);
--ease-out:     cubic-bezier(0, 0, 0.2, 1);
```

---

## 🧭 Agent 2 — Layout & Navigation Specialist

**Files:** `components/layout/UnifiedNav.tsx`, `AppLayout.tsx`, `MobileHeader.tsx`, `Sidebar.tsx`

### Deliverables

#### Desktop Sidebar (280px → 72px collapsed)
- Logo + wordmark at top
- Icon-only collapsed state with tooltips
- Active state: violet left border + subtle bg glow
- Section groupings with dividers
- Credits display at bottom
- Smooth collapse/expand animation (spring)

#### Mobile Bottom Nav (5 tabs)
```
[Home] [Paths] [Practice★] [Learn] [Progress]
```
- 56px height + safe area inset
- Active tab: filled icon + violet indicator dot
- Practice tab: slightly elevated with glow (primary CTA)
- Haptic feedback on tap
- Label always visible (no toggle)

#### Mobile Header
- App name left, search + theme toggle right
- Transparent → frosted glass on scroll
- Back button for nested routes
- Breadcrumb for deep navigation

#### AppLayout Shell
- Proper safe area handling (iOS notch, Android nav bar)
- Content area with correct padding for nav
- Scroll restoration between routes
- Page transition wrapper

---

## 🏠 Agent 3 — Home Page Engineer

**Files:** `components/home/HomePage.tsx`

### Deliverables

#### Hero Section
```
┌─────────────────────────────────────┐
│  Good morning, Dev! 👋              │
│  Ready to crush your interview?     │
│                                     │
│  [🔥 7 day streak]  [⚡ 1,240 XP]  │
│                                     │
│  ████████████░░░░  Level 12 → 13   │
└─────────────────────────────────────┘
```

#### Quick Action Cards (2×2 grid)
```
┌──────────┐  ┌──────────┐
│ 🎴 Swipe │  │ 🎤 Voice │
│  Learn   │  │ Interview│
└──────────┘  └──────────┘
┌──────────┐  ┌──────────┐
│ 📝 Daily │  │ 🏆 My    │
│  Test    │  │  Path    │
└──────────┘  └──────────┘
```

#### Stats Dashboard (horizontal scroll)
- Questions answered today
- Current streak
- Topics mastered
- Certifications earned

#### Daily Challenge Card
- Featured question of the day
- Difficulty badge
- Topic tag
- "Start Challenge" CTA

#### Continue Learning Section
- Last visited channel
- Progress ring
- Resume button

#### Recent Activity Feed
- Last 3 actions with timestamps

---

## 🃏 Agent 4 — Question Viewer Specialist

**Files:** `pages/QuestionViewer.tsx`, `components/question/AnswerPanel.tsx`, `components/question/ExtremeQuestionViewer.tsx`

### Deliverables

#### Question Card
```
┌─────────────────────────────────────┐
│  [System Design]  [Advanced]  [↑↓]  │
│                                     │
│  What is the CAP theorem and how    │
│  does it apply to distributed       │
│  systems?                           │
│                                     │
│  ─────────────────────────────────  │
│  [👁 Reveal Answer]                 │
└─────────────────────────────────────┘
```

#### Answer Panel (slide-up)
- Smooth spring animation from bottom
- Markdown rendered with syntax highlighting
- Section headers with visual hierarchy
- Code blocks with copy button
- "Mark as Known" / "Review Later" buttons
- SRS rating buttons (Again / Hard / Good / Easy)

#### Progress Indicators
- Question counter: `12 / 47`
- Topic progress ring
- Swipe hint animation (first visit)

#### Navigation Controls
- Swipe left/right (mobile)
- Arrow keys (desktop)
- Previous/Next buttons

---

## 🎤 Agent 5 — Voice Interview UX Engineer

**Files:** `pages/VoiceInterview.tsx`, `pages/VoiceSession.tsx`, `pages/VoicePractice.tsx`

### Deliverables

#### Recording State UI
```
┌─────────────────────────────────────┐
│  Question 3 of 10                   │
│                                     │
│  "Explain microservices vs          │
│   monolithic architecture"          │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  ▓▓▓░░▓▓▓▓░░░▓▓░░░▓▓▓▓░░  │    │
│  │         WAVEFORM            │    │
│  └─────────────────────────────┘    │
│                                     │
│  🔴 Recording... 0:42               │
│                                     │
│  [⏹ Stop]  [⏭ Skip]               │
└─────────────────────────────────────┘
```

#### Waveform Visualizer
- Real-time audio amplitude bars
- Animated when recording
- Flat/idle when not recording
- Color: violet → cyan gradient

#### Transcript Display
- Live word-by-word appearance
- Keyword highlighting (matched key points)
- Scroll to latest
- Word count progress

#### Feedback Screen
- Score breakdown (0-100)
- Key points covered (✅/❌)
- Missed concepts
- "Try Again" / "Next Question" CTAs

#### Interview Flow
- Question card with AI avatar
- Timer (optional)
- Progress bar across questions
- Session summary at end

---

## 🛤️ Agent 6 — Learning Paths & Channels UX

**Files:** `pages/UnifiedLearningPaths.tsx`, `pages/LearningPaths.tsx`, `pages/AllChannels.tsx`

### Deliverables

#### Learning Path Cards
```
┌─────────────────────────────────────┐
│  🚀 Full Stack Developer            │
│  ████████████░░░░  68% complete     │
│                                     │
│  Frontend → Backend → Database      │
│  → DevOps → System Design           │
│                                     │
│  [Continue]  [View Details]         │
└─────────────────────────────────────┘
```

#### Channel Grid (masonry/grid)
- Topic icon + name
- Question count badge
- Progress ring overlay
- Difficulty color coding
- "New" badge for recently added

#### Path Detail Modal
- Full path overview
- Chapter list with completion status
- Estimated time
- Start/Resume CTA

#### My Path Section
- Active paths (up to 3)
- Daily goal progress
- Recommended next step

---

## 🏆 Agent 7 — Gamification & Rewards UX

**Files:** `pages/Badges.tsx`, `components/BadgeDisplay.tsx`, `components/RewardNotification.tsx`

### Deliverables

#### XP Bar (persistent in header/home)
```
⚡ 1,240 XP  ████████████░░░░  Level 12
```

#### Streak Display
```
🔥 7 day streak
Mon ✅ Tue ✅ Wed ✅ Thu ✅ Fri ✅ Sat ✅ Sun 🎯
```

#### Badge Grid
- 3-column grid
- Locked badges: grayscale + lock icon
- Unlocked: full color + glow
- Hover: tooltip with description
- Unlock animation: burst + confetti

#### Achievement Toast
```
┌─────────────────────────────────────┐
│  🏆 Achievement Unlocked!           │
│  "First Blood" — Answered 1st Q     │
│  +50 XP                             │
└─────────────────────────────────────┘
```

#### Level Up Screen
- Full-screen celebration
- New level number
- Unlocked perks
- Share button

---

## 📝 Agent 8 — Tests & Certifications UX

**Files:** `pages/Tests.tsx`, `pages/TestSession.tsx`, `pages/Certifications.tsx`, `pages/CertificationPractice.tsx`

### Deliverables

#### Test Selection Screen
- Channel cards with pass/fail status
- Question count
- Last attempt date
- Difficulty indicator

#### Quiz Flow
```
┌─────────────────────────────────────┐
│  Question 7/20  ⏱ 4:32             │
│  ████████████░░░░░░░░               │
│                                     │
│  What does ACID stand for in        │
│  database transactions?             │
│                                     │
│  ○ A) Atomicity, Consistency...     │
│  ○ B) Async, Concurrent...          │
│  ○ C) Atomic, Cached...             │
│  ○ D) Advanced, Consistent...       │
│                                     │
│  [Submit Answer]                    │
└─────────────────────────────────────┘
```

#### Timer Component
- Circular countdown
- Color: green → yellow → red
- Pulse animation when < 30s

#### Results Screen
- Score: large number + ring
- Pass/Fail badge
- Question breakdown
- Share badge CTA
- Retry / Next Test

#### Certification Cards
- Provider logo
- Cert name + code
- Progress bar
- "Start Practice" CTA
- Earned badge display

---

## 📊 Agent 9 — Profile & Stats UX

**Files:** `pages/Stats.tsx`, `pages/Profile.tsx`, `pages/Bookmarks.tsx`

### Deliverables

#### Profile Card
```
┌─────────────────────────────────────┐
│  👤  Dev User                       │
│      Full Stack Developer           │
│      Member since Jan 2026          │
│                                     │
│  ⚡ 1,240 XP  🔥 7 streak  🏆 12   │
└─────────────────────────────────────┘
```

#### Stats Dashboard
- Questions answered (total + today)
- Topics mastered count
- Certifications earned
- Voice sessions completed
- Streak calendar heatmap

#### Activity Heatmap
- GitHub-style contribution grid
- 52 weeks × 7 days
- Color intensity = activity level
- Hover tooltip with date + count

#### Charts
- Weekly activity bar chart
- Topic distribution pie/donut
- Progress over time line chart
- All using Recharts with custom theme

#### Bookmarks Page
- Saved questions list
- Filter by topic/difficulty
- Quick review button
- Remove bookmark

---

## ✨ Agent 10 — Polish & Micro-interactions

**Files:** Global CSS, Framer Motion configs, loading components

### Deliverables

#### Page Transitions
```typescript
// Slide + fade between routes
const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -8 }
};
```

#### Loading States
- Skeleton loaders matching content shape
- Shimmer animation (left → right)
- Staggered skeleton for lists

#### Empty States
- Branded illustrations (SVG)
- Contextual messaging
- Primary CTA to fill the empty state

#### Hover Effects
- Cards: subtle lift + border glow
- Buttons: scale 0.98 on press
- Icons: rotate/bounce on hover

#### Scroll Animations
- Fade-in-up on scroll (intersection observer)
- Stagger children with 50ms delay
- Respect `prefers-reduced-motion`

#### Toast Notifications
- Sonner with custom theme
- Success: green glow
- Error: red glow
- Achievement: violet glow + confetti

#### Focus States
- Visible focus rings (accessibility)
- Keyboard navigation indicators
- Skip-to-content link

---

## 📋 Execution Order

```
Phase 1 (Foundation):
  Agent 1 → design-system.css
  Agent 2 → layout + navigation

Phase 2 (Core Pages):
  Agent 3 → home page
  Agent 4 → question viewer
  Agent 5 → voice interview

Phase 3 (Feature Pages):
  Agent 6 → learning paths + channels
  Agent 7 → gamification + rewards
  Agent 8 → tests + certifications

Phase 4 (Supporting Pages):
  Agent 9 → profile + stats

Phase 5 (Polish):
  Agent 10 → animations + micro-interactions
```

---

## 🔧 Technical Constraints

- **No new dependencies** — use existing Framer Motion, Radix, shadcn
- **Tailwind 4** — use CSS variables + utility classes
- **Mobile-first** — all designs start at 375px, scale up
- **Dark mode only** — no light mode toggle needed for revamp
- **Performance** — no layout shifts, lazy load heavy components
- **Accessibility** — WCAG AA minimum, keyboard navigable

---

## 📏 Design Principles

1. **Hierarchy first** — every screen has one clear primary action
2. **Breathing room** — generous whitespace, never cramped
3. **Consistent motion** — same easing curves everywhere
4. **Purposeful color** — accent colors mean something (violet=primary, cyan=info, amber=XP, green=success)
5. **Progressive disclosure** — show less, reveal more on demand
6. **Delight in details** — micro-animations, satisfying feedback
7. **Speed perception** — optimistic UI, instant feedback

---

## 🎯 Success Metrics

- [ ] All pages use design system tokens (no hardcoded colors)
- [ ] Consistent 8px grid spacing throughout
- [ ] Mobile bottom nav works perfectly on iOS/Android
- [ ] Page transitions feel smooth (60fps)
- [ ] Loading states for all async content
- [ ] Empty states for all empty lists
- [ ] Achievement toasts fire correctly
- [ ] Voice recording UI clearly shows state
- [ ] Question cards swipe smoothly
- [ ] Stats page shows meaningful data visualizations
