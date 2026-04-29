# Google UI/UX Design Patterns & User Journey — Gold Standard Reference

> A comprehensive reference for designers and engineers building products at Google quality.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Core Design Philosophy](#2-core-design-philosophy)
3. [Material Design System (Material You / M3)](#3-material-design-system)
4. [User Journey Patterns](#4-user-journey-patterns)
5. [Navigation Architecture](#5-navigation-architecture)
6. [Component Decision Trees](#6-component-decision-trees)
7. [Motion & Animation](#7-motion--animation)
8. [Color, Typography & Spacing](#8-color-typography--spacing)
9. [AI-Native UX Patterns](#9-ai-native-ux-patterns)
10. [Accessibility & Inclusivity](#10-accessibility--inclusivity)
11. [Performance as UX](#11-performance-as-ux)
12. [Cross-Platform Consistency](#12-cross-platform-consistency)
13. [Data-Informed Design Culture](#13-data-informed-design-culture)
14. [Anti-Patterns](#14-anti-patterns)
15. [Implementation Checklist](#15-implementation-checklist)
16. [SVG Graphics & Illustration System](#16-svg-graphics--illustration-system)
17. [Readability & Typography Rendering](#17-readability--typography-rendering)
18. [Icon System & Material Symbols](#18-icon-system--material-symbols)
19. [Data Visualization & Charts](#19-data-visualization--charts)
20. [Dark Mode Design System](#20-dark-mode-design-system)
21. [Forms & Input Patterns](#21-forms--input-patterns)
22. [Gestures, Touch & Haptics](#22-gestures-touch--haptics)
23. [Notifications & Communication Patterns](#23-notifications--communication-patterns)
24. [Onboarding & Feature Discovery (Deep Dive)](#24-onboarding--feature-discovery-deep-dive)
25. [Brand Expression & Visual Identity](#25-brand-expression--visual-identity)

---

## 1. Executive Summary

Google designs for **billions of people across every device, language, and ability level**. What makes Google's design distinctive is not any single visual choice — it is a system of interlocking principles that produce consistent, fast, accessible, and delightful experiences at scale.

### What Sets Google Apart

| Dimension | Google's Approach | Why It Matters |
|---|---|---|
| **Speed as a feature** | Every 100ms of latency costs conversions; perceived performance is engineered, not hoped for | Users abandon slow products |
| **System-level thinking** | Components, tokens, and patterns are shared across 50+ products | Reduces cognitive load across the ecosystem |
| **Personalization at scale** | Material You adapts UI to the user's wallpaper/preferences | Feels personal without being creepy |
| **Accessibility-first** | WCAG AA minimum, AAA where possible, built into the design system | Reaches the widest possible audience |
| **Data-informed, not data-driven** | Quantitative signals guide, qualitative research decides | Avoids optimizing for the wrong metric |
| **Progressive disclosure** | Show only what's needed now; reveal complexity on demand | Reduces overwhelm without hiding power |

### Flagship Product Benchmarks

| Product | Key UX Achievement |
|---|---|
| **Google Search** | Results in <200ms; zero-friction entry; universal entry point |
| **Google Maps** | Contextual awareness (time of day, location, history) drives the entire UI |
| **Gmail** | Smart Compose, Priority Inbox — AI that assists without interrupting |
| **YouTube** | Autoplay, chapters, ambient mode — engagement without dark patterns |
| **Android** | Predictive back, gesture nav, adaptive layouts across 24,000+ device shapes |
| **Gemini** | AI-native UX: streaming responses, citations, graceful uncertainty |

---

## 2. Core Design Philosophy

### 2.1 Google's Ten Things — Applied to Design

Google's foundational "10 things we know to be true" directly maps to design decisions:

| Principle | Design Implication | Product Example |
|---|---|---|
| **Focus on the user** | Every feature must pass: "Does this help the user, or does it help us?" | Search removed ads from the top when they hurt result quality |
| **Fast is better than slow** | Performance budgets are design constraints, not engineering afterthoughts | AMP, Instant Pages, prefetching |
| **Simple is better than complex** | Default to the simplest UI that solves the job | Google.com homepage — one input, one button |
| **Democracy of the web** | Design for low-bandwidth, low-end devices first | Lite mode, offline-first in Maps/Drive |
| **You can be serious without a suit** | Warmth and playfulness are allowed; Doodles, Easter eggs | Google Doodles, Assistant personality |
| **Great just isn't good enough** | Ship, measure, iterate — never declare done | Search has had 1000s of incremental improvements since 1998 |

### 2.2 Jobs-to-be-Done Framework

Google designs around the **job the user is hiring the product to do**, not around features.

```
Job Statement Formula:
When [situation], I want to [motivation], so I can [outcome].
```

| Product | Core Job | Secondary Jobs |
|---|---|---|
| **Search** | "Find a definitive answer fast" | Explore a topic, compare options, navigate to a site |
| **Maps** | "Get from A to B without stress" | Discover nearby places, check hours, share location |
| **Gmail** | "Process my inbox to zero" | Find old emails, collaborate, schedule |
| **Drive** | "Access my files from anywhere" | Collaborate in real-time, organize, share |
| **YouTube** | "Watch something worth my time" | Learn a skill, be entertained, follow creators |

**Design implication:** Every screen, every component, every interaction should serve the primary job. Features that serve secondary jobs must not interfere with the primary job.

### 2.3 User-First, Not Feature-First

The test Google applies before shipping any UI change:

```
1. Does this reduce the steps to complete the primary job?
2. Does this reduce cognitive load?
3. Does this work for a first-time user AND a power user?
4. Does this work on a 5-year-old low-end Android on 2G?
5. Is it accessible to someone using a screen reader?

If any answer is "no" → redesign or cut the feature.
```

### 2.4 Progressive Disclosure Levels

Google never front-loads complexity. Information and options are revealed in layers:

| Level | What's Shown | Example |
|---|---|---|
| **Level 0 — Glance** | The single most important thing | Search: just the query box |
| **Level 1 — Engage** | Core actions for the primary job | Search results: title, snippet, URL |
| **Level 2 — Explore** | Secondary actions, filters, details | Search: Tools bar, related searches |
| **Level 3 — Expert** | Advanced settings, power features | Search: verbatim mode, date range, site: operator |

**Rule:** Level 3 features must never pollute Level 0 or Level 1 views.

### 2.5 The Simplicity Paradox

Google products appear simple but are extraordinarily powerful. This is achieved by:

- **Smart defaults** — the default behavior is correct for 80% of users
- **Contextual surfacing** — advanced options appear only when context suggests the user needs them
- **Graceful complexity** — power users can always go deeper, but never have to
- **Hiding, not removing** — features are tucked away, not deleted

---

## 3. Material Design System

### 3.1 The Three Core Principles

**1. Material is the metaphor**
The design system is inspired by the physical world — paper, ink, light, and shadow — but is not constrained by physical rules. Surfaces can transform, overlap, and respond to touch in ways paper cannot.

**2. Bold, graphic, intentional**
Typography, grids, space, scale, color, and imagery guide the eye and create hierarchy. Deliberate white space is not emptiness — it is structure.

**3. Motion provides meaning**
Animation is not decoration. Every transition communicates something: where an element came from, where it went, what its relationship is to other elements.

### 3.2 The Token System (Three Tiers)

Material Design uses a three-tier token architecture:

```
Reference Tokens (raw values)
    └── System Tokens (semantic roles)
            └── Component Tokens (component-specific)
```

| Tier | Example | Purpose |
|---|---|---|
| **Reference** | `md.ref.palette.primary40 = #6750A4` | Raw color value |
| **System** | `md.sys.color.primary = md.ref.palette.primary40` | Semantic role |
| **Component** | `md.comp.filled-button.container.color = md.sys.color.primary` | Component usage |

This means: change one reference token → entire system updates consistently.

### 3.3 Material You (M3) — Dynamic Personalization

Material You (M3, launched 2021) introduced **dynamic color**: the UI adapts its color palette to the user's wallpaper.

**How it works:**

```
User's wallpaper
    → Quantize algorithm extracts dominant colors
    → HCT color space (Hue, Chroma, Tone) generates tonal palettes
    → 5 key palettes: Primary, Secondary, Tertiary, Neutral, Neutral Variant
    → Each palette has 13 tones (0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 99, 100)
    → Color roles assigned from tones
    → Light and dark scheme generated automatically
```

**Why HCT over HSL/RGB?**
HCT is perceptually uniform — equal numeric steps produce equal perceived color differences. This ensures contrast ratios are predictable and accessibility is maintained even with dynamic colors.

### 3.4 Elevation Model

Elevation communicates hierarchy and focus. M3 uses **tonal color overlays** (not just shadows) to express elevation:

| Level | dp | Tonal Overlay | Usage |
|---|---|---|---|
| **Level 0** | 0dp | 0% | Background, surfaces at rest |
| **Level 1** | 1dp | 5% | Cards, search bars |
| **Level 2** | 3dp | 8% | FAB resting, menus |
| **Level 3** | 6dp | 11% | FAB pressed, dialogs |
| **Level 4** | 8dp | 12% | Navigation bar |
| **Level 5** | 12dp | 14% | Bottom sheets |

**Key insight:** In dark mode, shadows become invisible. Tonal overlays (lighter surface = higher elevation) replace shadows as the primary elevation signal.

### 3.5 Shape System

Shapes communicate personality and state:

| Token | Corner Radius | Usage |
|---|---|---|
| `extraSmall` | 4dp | Text fields, small chips |
| `small` | 8dp | Buttons, small cards |
| `medium` | 12dp | Cards, dialogs |
| `large` | 16dp | Bottom sheets, large cards |
| `extraLarge` | 28dp | FAB, large components |
| `full` | 50% (pill) | Chips, search bars, badges |

**Shape expressiveness:** Rounder shapes feel friendlier and more approachable. More angular shapes feel more serious and structured. Google uses rounder shapes for consumer products (YouTube, Photos) and slightly more angular for productivity tools (Docs, Sheets).
## 4. User Journey Patterns

### 4.1 Zero Moment of Truth (ZMOT)

Google coined ZMOT: the moment a user reaches for their device to research, decide, or act. Design for this moment:

- **Instant availability** — the product must be reachable in 1–2 taps from any context
- **Context awareness** — know what the user likely needs based on time, location, history
- **No friction at entry** — never require login to see value; defer account creation

**ZMOT Design Checklist:**
- [ ] Can a new user accomplish the primary job without signing in?
- [ ] Does the app launch to the most likely needed state (not always home)?
- [ ] Is the entry point reachable from the lock screen or widget?
- [ ] Does the app restore state if interrupted mid-task?

### 4.2 First Time User Experience (FTUE)

Google's FTUE philosophy: **earn trust before asking for anything**.

**The 3-30-300 Rule:**
| Timeframe | Goal | What to Show |
|---|---|---|
| **3 seconds** | Communicate core value | One clear headline, one action |
| **30 seconds** | Demonstrate value | First meaningful interaction, first "aha" moment |
| **300 seconds** | Build habit | Personalization, first success, reason to return |

**Google Maps FTUE Example:**
1. Launch → map of current location (immediate value, no login required)
2. First search → results appear instantly (demonstrates speed)
3. First navigation → turn-by-turn works without account (earns trust)
4. After 3 uses → "Sign in to save your places" (ask after value delivered)

**FTUE Anti-patterns Google avoids:**
- Asking for permissions before demonstrating why they're needed
- Multi-step onboarding carousels (users skip them)
- Requiring account creation before showing any value
- Asking for notification permission on first launch

### 4.3 Progressive Onboarding

Instead of upfront tutorials, Google embeds onboarding into the first real use:

| Pattern | Implementation | Example |
|---|---|---|
| **Contextual tooltips** | Appear on first encounter with a feature | Gmail: "Tip: Swipe to archive" on first email |
| **Empty state education** | Use empty states to teach, not just inform | Drive empty state shows how to upload |
| **Inline hints** | Placeholder text and helper text guide input | Search: "Search or type URL" |
| **Feature discovery** | Subtle animation draws attention to new features | Pulse animation on new nav items |
| **Undo as safety net** | Make actions reversible so users explore freely | Gmail: "Message sent. Undo" |

### 4.4 Empty States

Empty states are **teaching moments**, not failures. Google's formula:

```
Empty State = Illustration + Headline + Body + Primary Action
```

| Component | Rule | Bad Example | Good Example |
|---|---|---|---|
| **Illustration** | Friendly, contextual, not generic | Sad face icon | Illustration of the feature in use |
| **Headline** | Describe the opportunity, not the absence | "No items" | "Your saved places will appear here" |
| **Body** | Explain how to get started | (none) | "Tap the bookmark icon on any place to save it" |
| **Action** | One clear CTA | (none) | "Explore nearby places" |

**Types of empty states:**
- **First use** — user has never used this feature
- **User-cleared** — user deleted everything (celebrate, don't mourn)
- **No results** — search/filter returned nothing (suggest alternatives)
- **Error** — something went wrong (explain and offer recovery)

### 4.5 Error States

Google's error design principle: **errors are the product's fault, not the user's**.

| Error Type | Tone | Recovery Path | Example |
|---|---|---|---|
| **Network error** | Empathetic, not technical | Retry button + offline mode | "You're offline. Some features may be unavailable." |
| **No results** | Helpful | Suggest alternatives | "No results for 'cofee'. Did you mean 'coffee'?" |
| **Permission denied** | Explanatory | Deep link to settings | "Maps needs location access. Open Settings" |
| **Server error** | Honest, light | Retry + status page link | "Something went wrong on our end. Try again." |
| **Validation error** | Specific | Inline, field-level | "Enter a valid email address" (not "Invalid input") |
| **Destructive action** | Confirmatory | Undo, not confirm dialog | "Contact deleted. Undo" |

**Error message formula:**
```
What happened (plain language) + Why it happened (if helpful) + What to do next (specific action)
```

### 4.6 Loading States — The Hierarchy

Google uses a hierarchy of loading patterns based on context:

| Pattern | When to Use | Duration | Example |
|---|---|---|---|
| **Optimistic UI** | High-confidence actions | Instant | Gmail: email appears sent immediately |
| **Skeleton screen** | Content-heavy pages | <3s | YouTube: gray placeholder cards |
| **Shimmer animation** | Lists and feeds | <3s | Google News: shimmer on article cards |
| **Progress indicator (linear)** | Determinate progress | Any | Drive: file upload progress bar |
| **Progress indicator (circular)** | Indeterminate, short | <4s | Search: spinner on voice search |
| **Full-page loading** | App launch only | <2s | Maps: brief splash then immediate map |

**Rules:**
- Never show a spinner for actions that complete in <300ms
- Always show a skeleton screen instead of a blank page
- Optimistic UI requires a reliable undo/rollback mechanism
- If loading takes >10s, show progress and explain why

### 4.7 Success States

Success feedback must be **proportional to the significance of the action**:

| Action Significance | Feedback Type | Duration | Example |
|---|---|---|---|
| **Minor** (like, save) | Icon state change | Instant | Heart fills on YouTube like |
| **Moderate** (send, submit) | Snackbar | 4s | "Message sent. Undo" |
| **Major** (purchase, account creation) | Full confirmation screen | Persistent | Order confirmation page |
| **Milestone** (first use, streak) | Celebration animation | 2–3s | Google Fit: goal reached animation |

---

## 5. Navigation Architecture

### 5.1 Navigation Pattern Decision Table

Choosing the right navigation pattern is one of the most consequential UX decisions:

| Pattern | Screen Width | Destinations | Use Case | Example |
|---|---|---|---|---|
| **Bottom Navigation Bar** | Compact (<600dp) | 3–5 | Primary app sections, mobile | YouTube, Gmail mobile |
| **Navigation Rail** | Medium (600–840dp) | 3–7 | Tablet, foldable inner screen | Gmail tablet |
| **Navigation Drawer** | Expanded (>840dp) | 5+ | Desktop, complex apps | Gmail web, Drive web |
| **Tabs** | Any | 2–5 | Peer-level content within a section | Chrome tabs, Search result types |
| **Bottom Sheet Nav** | Compact | 5+ | Secondary navigation, overflow | Maps "Explore" sheet |

**Decision Flowchart:**
```
How many top-level destinations?
├── 1–2 → Use tabs or no navigation
├── 3–5 → 
│   ├── Mobile? → Bottom Navigation Bar
│   ├── Tablet? → Navigation Rail
│   └── Desktop? → Navigation Rail or Drawer
└── 6+ →
    ├── Mobile? → Bottom Nav (5 max) + overflow drawer
    ├── Tablet? → Navigation Rail + drawer
    └── Desktop? → Navigation Drawer (always visible)
```

### 5.2 Bottom Navigation Bar Rules

| Rule | Specification |
|---|---|
| **Destination count** | 3–5 (never fewer, never more) |
| **Height** | 80dp |
| **Icon size** | 24dp |
| **Label** | Always visible (never icon-only on mobile) |
| **Active indicator** | Pill shape behind active icon |
| **Badge** | Numeric (count) or dot (unread indicator) |
| **Scroll behavior** | Hide on scroll down, show on scroll up (optional) |
| **What goes here** | Top-level, peer destinations only |
| **What doesn't go here** | Actions (use FAB), settings (use overflow) |

### 5.3 Navigation Rail Specs (Tablet/Foldable)

| Property | Value |
|---|---|
| **Width** | 80dp (collapsed) / 360dp (expanded with labels) |
| **Icon size** | 24dp |
| **Active indicator** | Pill, 56dp wide |
| **FAB position** | Top of rail, above destinations |
| **Label behavior** | Always visible or on hover |

### 5.4 Floating Action Button (FAB) Rules

The FAB is the **single most important action** on the screen:

| FAB Type | Size | When to Use |
|---|---|---|
| **Small FAB** | 40dp | Secondary action, when space is constrained |
| **FAB** | 56dp | Primary action on a screen |
| **Large FAB** | 96dp | Hero action, prominent placement |
| **Extended FAB** | 56dp tall, variable width | When label adds critical context |

**FAB Placement Rules:**
- Bottom-right corner (LTR layouts)
- 16dp from screen edge
- Above bottom navigation bar (not overlapping)
- Disappears when keyboard is open
- One FAB per screen maximum
- FAB action must be the most frequent action on that screen

**When NOT to use a FAB:**
- When the action is destructive
- When there are multiple equally important actions
- On screens where the primary action is already in the app bar
- On detail/read-only screens

### 5.5 Search-First Navigation

Google products increasingly use **search as the primary navigation mechanism**:

| Pattern | Implementation | Example |
|---|---|---|
| **Persistent search bar** | Always visible at top | Google app, Chrome |
| **Collapsing search** | Expands on tap, collapses on scroll | Maps, Play Store |
| **Search in app bar** | Search icon in top app bar | Gmail, Drive |
| **Contextual search** | Search scoped to current section | YouTube channel search |

**Search bar anatomy:**
```
[Leading icon] [Query/Placeholder] [Voice] [Camera/Lens] [Avatar]
```

**Search interaction states:**
1. **Resting** — shows placeholder, avatar
2. **Focused** — keyboard opens, suggestions appear
3. **Typing** — real-time suggestions, query chips
4. **Results** — full results page, filter chips
5. **No results** — suggestions, spelling correction

### 5.6 Back Stack Management

Google's back navigation rules:

| Scenario | Expected Behavior |
|---|---|
| **Back from any screen** | Return to previous screen in the task |
| **Back from root screen** | Exit app (or go to home if launched from notification) |
| **Back from dialog** | Dismiss dialog, stay on screen |
| **Back from bottom sheet** | Dismiss sheet, stay on screen |
| **Back from search results** | Return to search input (not previous screen) |
| **Deep link entry** | Back goes to app home, not the referring app |
| **Notification deep link** | Back stack synthesized: Home → Section → Detail |

**Predictive Back (Android 13+):**
- Shows preview of destination behind current screen
- Swipe from edge to peek, release to confirm
- Design implication: back destinations must be visually meaningful

### 5.7 Deep Linking Patterns

| Type | Format | Use Case |
|---|---|---|
| **Web URL** | `https://maps.google.com/place/...` | Share, SEO, cross-platform |
| **App link** | `https://` handled by app | Seamless web-to-app |
| **Custom scheme** | `googlemaps://` | App-to-app |
| **Shortcut** | Home screen shortcut | Frequent destinations |

**Deep link UX rules:**
- Always synthesize a back stack (user should be able to navigate up)
- Handle expired/invalid links gracefully (don't show error, redirect to relevant section)
- Preserve deep link destination after sign-in flow
## 6. Component Decision Trees

### 6.1 Feedback & Overlay Components

**Decision Tree: Which feedback component to use?**

```
Does the user need to take action before continuing?
├── YES → Is it a critical/destructive action?
│   ├── YES → Dialog (blocking)
│   └── NO → Bottom Sheet (non-blocking, dismissible)
└── NO → Is it a confirmation of something that just happened?
    ├── YES → Does it need an action (e.g., Undo)?
    │   ├── YES → Snackbar with action
    │   └── NO → Snackbar (no action, 4s auto-dismiss)
    └── NO → Is it a persistent warning/status?
        ├── YES → Banner (inline, dismissible)
        └── NO → Toast (brief, no action, rare on Android)
```

**Comparison Table:**

| Component | Blocks UI | Has Action | Auto-dismiss | Swipe to dismiss | Use Case |
|---|---|---|---|---|---|
| **Dialog** | Yes | Yes/No | No | No | Confirm delete, sign out |
| **Bottom Sheet (modal)** | Yes | Yes | No | Yes (swipe down) | Share sheet, options menu |
| **Bottom Sheet (standard)** | No | Yes | No | Yes | Maps info panel |
| **Snackbar** | No | Optional (1 action) | Yes (4s) | Yes | "Saved", "Sent. Undo" |
| **Banner** | No | Up to 2 | No | No | Offline warning, update available |
| **Tooltip** | No | No | Yes (on blur) | No | Icon label on hover/long-press |

**Dialog rules:**
- Use for irreversible destructive actions only
- Maximum 2 buttons (Cancel + Confirm)
- Confirm button uses filled style; Cancel uses text style
- Never use a dialog when a snackbar + undo would work
- Title is optional; if used, max 1 line

### 6.2 Button Hierarchy

Every screen has a clear action hierarchy. Buttons communicate that hierarchy:

| Button Type | Emphasis | Container | Use Case | Max per Screen |
|---|---|---|---|---|
| **Filled** | Highest | Colored fill | Primary action | 1 |
| **Filled Tonal** | High | Tonal fill | Secondary primary action | 1–2 |
| **Outlined** | Medium | Border only | Secondary action | 2–3 |
| **Text** | Low | None | Tertiary, inline actions | Unlimited |
| **Elevated** | Medium | White + shadow | When surface contrast needed | 1–2 |
| **Icon Button** | Varies | Optional | Toolbar actions, toggles | Unlimited |
| **FAB** | Highest | Colored fill | Screen's primary action | 1 |
| **Extended FAB** | Highest | Colored fill + label | When label adds context | 1 |

**Button rules:**
- Never use two filled buttons side by side
- Destructive actions use the error color role, not primary
- Disabled buttons: 38% opacity, no interaction
- Minimum touch target: 48×48dp regardless of visual size
- Loading state: replace label with circular progress indicator

### 6.3 Card Variants

| Variant | Elevation | Border | Use Case |
|---|---|---|---|
| **Elevated** | Level 1 (1dp) | None | Default cards, content feeds |
| **Filled** | Level 0 | None | Subtle grouping, same-surface cards |
| **Outlined** | Level 0 | 1dp border | When elevation would cause visual noise |

**Card content rules:**
- Cards are containers, not components — they hold other components
- One primary action per card (the whole card is tappable, or one clear CTA)
- Card media: 16:9 ratio for landscape, 1:1 for square, 3:4 for portrait
- Never nest cards inside cards

### 6.4 Chip Types

Chips are compact, interactive elements for filtering, input, and suggestions:

| Chip Type | Dismissible | Icon | Use Case | Example |
|---|---|---|---|---|
| **Filter chip** | No (toggle) | Optional | Filter a list/feed | Search: "Past week", "Images" |
| **Input chip** | Yes (×) | Optional | Represent user input | Gmail: recipient tags |
| **Suggestion chip** | No | Optional | Offer quick actions | Assistant: suggested replies |
| **Assist chip** | No | Required | Contextual smart actions | Calendar: "Add to calendar" |

### 6.5 List vs Grid Decision

| Dimension | Use List | Use Grid |
|---|---|---|
| **Content type** | Text-heavy, varied length | Visual, uniform items |
| **Primary info** | Title + metadata | Image/thumbnail |
| **Scanning pattern** | Top-to-bottom (F-pattern) | Left-to-right, Z-pattern |
| **Item count** | Any | Best with 6+ items |
| **Examples** | Gmail inbox, Settings | Google Photos, Play Store apps |

**List item anatomy:**
```
[Leading (icon/avatar/checkbox)] [Headline] [Supporting text] [Trailing (icon/meta/switch)]
```

**Grid column rules:**
- Compact (mobile): 2 columns
- Medium (tablet): 3–4 columns
- Expanded (desktop): 4–6 columns
- Always use consistent aspect ratios within a grid

### 6.6 Text Field Patterns

| Variant | Use Case | When to Avoid |
|---|---|---|
| **Filled** | Forms, standalone inputs | Dense layouts |
| **Outlined** | When surface contrast is low | Most mobile forms |

**Text field states:**
```
Enabled → Hovered → Focused → Populated → Disabled → Error → Read-only
```

**Validation rules:**
- Validate on blur (not on every keystroke, not only on submit)
- Error message replaces helper text (same space, no layout shift)
- Character counter appears when limit is within 20% of max
- Never clear a field on error — preserve the user's input

---

## 7. Motion & Animation

### 7.1 The Four Motion Principles

**1. Informative**
Motion communicates spatial relationships and hierarchy. When a card expands into a detail view, the animation shows where the detail came from and how to get back.

**2. Focused**
Motion guides attention to what matters. Entrance animations draw the eye to new content. Exit animations confirm removal without distraction.

**3. Expressive**
Motion adds personality and delight at key moments — but only at key moments. Overuse destroys expressiveness.

**4. Responsive**
Motion provides immediate feedback. A button responds to touch within 100ms. Lag between input and response breaks the illusion of direct manipulation.

### 7.2 Easing Curves

Google uses four primary easing curves:

| Curve | CSS Equivalent | Use Case |
|---|---|---|
| **Standard** | `cubic-bezier(0.2, 0, 0, 1)` | Elements moving within the screen |
| **Decelerate (Enter)** | `cubic-bezier(0, 0, 0, 1)` | Elements entering the screen |
| **Accelerate (Exit)** | `cubic-bezier(0.3, 0, 1, 1)` | Elements leaving the screen |
| **Emphasized** | Custom spring | Hero transitions, expressive moments |

**Rule:** Entering elements decelerate (they arrive and settle). Exiting elements accelerate (they leave quickly, not lingering). Elements moving within the screen use standard easing.

### 7.3 Duration Tokens

Material Design defines duration tokens to ensure consistent timing:

| Token | Duration | Use Case |
|---|---|---|
| `short1` | 50ms | Micro-interactions (ripple start) |
| `short2` | 100ms | Small component state changes |
| `short3` | 150ms | Icon transitions, FAB state |
| `short4` | 200ms | Small enter/exit (tooltip, chip) |
| `medium1` | 250ms | Standard component transitions |
| `medium2` | 300ms | Cards, dialogs entering |
| `medium3` | 350ms | Bottom sheet entering |
| `medium4` | 400ms | Large component transitions |
| `long1` | 450ms | Complex layout changes |
| `long2` | 500ms | Page-level transitions |
| `long3` | 550ms | Shared element transitions |
| `long4` | 600ms | Hero transitions |
| `extraLong1` | 700ms | Full-screen transitions |
| `extraLong4` | 1000ms | Maximum (rare, expressive only) |

**Rule:** When in doubt, use `medium2` (300ms). Faster feels snappy; slower feels sluggish. Never exceed 400ms for functional transitions.

### 7.4 Transition Patterns

**Container Transform**
Used when an element expands into a larger view. The container morphs — it doesn't fade or slide.
- Example: Gmail list item → email detail
- Example: Google Photos thumbnail → full-screen photo
- The container's shape, size, and position all animate simultaneously

**Shared Axis**
Used for navigating between peer-level content with a spatial relationship.
- X-axis: horizontal navigation (tabs, carousels)
- Y-axis: vertical navigation (drill-down, scroll-linked)
- Z-axis: hierarchical navigation (push/pop)
- Example: Swiping between days in Google Calendar

**Fade Through**
Used when there's no spatial relationship between origin and destination.
- Outgoing element fades out and scales down slightly
- Incoming element fades in and scales up slightly
- Brief moment where both are invisible (the "through")
- Example: Switching between bottom nav tabs

**Forward and Backward**
- Forward: new screen slides in from right, current slides out to left
- Backward: current screen slides out to right, previous slides in from left
- Depth: new screen scales up from center (modal/overlay)

### 7.5 Micro-interactions

| Interaction | Animation | Duration |
|---|---|---|
| **Button press** | Ripple from touch point | 300ms |
| **Toggle/Switch** | Thumb slides, track color changes | 200ms |
| **Checkbox** | Checkmark draws in | 150ms |
| **Like/Favorite** | Icon fills with spring bounce | 300ms |
| **Pull to refresh** | Circular progress, then content drops in | Variable |
| **Swipe to dismiss** | Item slides out, list collapses | 200ms |
| **FAB → Extended FAB** | Width expands, label fades in | 200ms |
| **Search expand** | Bar expands to full width | 300ms |

### 7.6 Reduced Motion

Always respect `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  /* Replace motion with instant state changes or opacity-only transitions */
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

On Android: respect "Remove animations" in Developer Options and "Transition animation scale" in Accessibility settings.

**Rule:** Animations must never be the only way to convey information. State changes must be perceivable without motion.
## 8. Color, Typography & Spacing

### 8.1 The Color Role System

Material You defines color roles — semantic names that map to tonal palette values:

| Role | Light Mode Tone | Dark Mode Tone | Usage |
|---|---|---|---|
| `primary` | 40 | 80 | Key components, active states |
| `on-primary` | 100 | 20 | Text/icons on primary |
| `primary-container` | 90 | 30 | Less prominent primary surfaces |
| `on-primary-container` | 10 | 90 | Text/icons on primary-container |
| `secondary` | 40 | 80 | Supporting components |
| `tertiary` | 40 | 80 | Contrasting accent |
| `surface` | 98 | 6 | Default background |
| `surface-variant` | 90 | 30 | Alternative surface |
| `on-surface` | 10 | 90 | Primary text |
| `on-surface-variant` | 30 | 80 | Secondary text, icons |
| `outline` | 50 | 60 | Borders, dividers |
| `error` | 40 | 80 | Error states |

**Key insight:** Never hardcode hex values. Always reference color roles. This is what makes dynamic color (Material You) work — the roles stay the same, the values change.

### 8.2 Tonal Palette Generation

```
Seed Color (e.g., user's wallpaper dominant color)
    ↓
Convert to HCT color space
    ↓
Generate 5 palettes (Primary, Secondary, Tertiary, Neutral, Neutral Variant)
    ↓
Each palette: 13 tones (0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 99, 100)
    ↓
Assign tones to color roles (see table above)
    ↓
Light scheme + Dark scheme generated automatically
```

**Tone meanings:**
- Tone 0 = Black
- Tone 100 = White
- Tone 40 = Typical primary color (light mode)
- Tone 80 = Typical primary color (dark mode)

### 8.3 Typography Scale

Material Design's type scale has 15 styles across 5 categories:

| Category | Style | Size | Weight | Line Height | Usage |
|---|---|---|---|---|---|
| **Display** | Display Large | 57sp | Regular (400) | 64sp | Hero text, marketing |
| | Display Medium | 45sp | Regular (400) | 52sp | Large headlines |
| | Display Small | 36sp | Regular (400) | 44sp | Section headers |
| **Headline** | Headline Large | 32sp | Regular (400) | 40sp | Page titles |
| | Headline Medium | 28sp | Regular (400) | 36sp | Card titles |
| | Headline Small | 24sp | Regular (400) | 32sp | Dialog titles |
| **Title** | Title Large | 22sp | Regular (400) | 28sp | App bar title |
| | Title Medium | 16sp | Medium (500) | 24sp | List item primary |
| | Title Small | 14sp | Medium (500) | 20sp | Chip labels |
| **Body** | Body Large | 16sp | Regular (400) | 24sp | Primary body text |
| | Body Medium | 14sp | Regular (400) | 20sp | Secondary body text |
| | Body Small | 12sp | Regular (400) | 16sp | Captions, helper text |
| **Label** | Label Large | 14sp | Medium (500) | 20sp | Button labels |
| | Label Medium | 12sp | Medium (500) | 16sp | Tab labels, badges |
| | Label Small | 11sp | Medium (500) | 16sp | Overlines, annotations |

**Typography rules:**
- Use `sp` (scale-independent pixels) on Android, `rem` on web — both respect user font size preferences
- Never go below 12sp/0.75rem for any readable text
- Line length: 40–60 characters for body text (optimal readability)
- Never use more than 3 type styles on a single screen

### 8.4 Spacing System

Material Design uses an **8dp base grid**:

| Token | Value | Usage |
|---|---|---|
| `spacing-1` | 4dp | Tight internal padding (icon to label) |
| `spacing-2` | 8dp | Component internal padding |
| `spacing-3` | 12dp | Small gaps between related elements |
| `spacing-4` | 16dp | Standard padding, list item padding |
| `spacing-5` | 24dp | Section spacing, card padding |
| `spacing-6` | 32dp | Large section gaps |
| `spacing-7` | 48dp | Screen-level padding (desktop) |
| `spacing-8` | 64dp | Hero spacing |

**Layout margins by breakpoint:**
| Breakpoint | Width | Margin | Columns | Gutter |
|---|---|---|---|---|
| Compact | 0–599dp | 16dp | 4 | 16dp |
| Medium | 600–839dp | 24dp | 8 | 24dp |
| Expanded | 840dp+ | 24dp | 12 | 24dp |

---

## 9. AI-Native UX Patterns

### 9.1 The AI UX Principles

Google's approach to AI in products follows these principles:

| Principle | Description | Example |
|---|---|---|
| **Assistive, not intrusive** | AI helps when asked or when clearly useful; never interrupts | Smart Compose appears inline, doesn't pop up |
| **Transparent** | Users know when AI is involved | "Suggested by AI", Gemini branding |
| **Graceful uncertainty** | AI acknowledges what it doesn't know | "I'm not sure, but..." |
| **User in control** | AI suggestions are always optional | Smart Compose: Tab to accept, ignore to dismiss |
| **Contextually aware** | AI uses context to be relevant | Gmail Smart Reply uses email content |
| **Privacy-respecting** | On-device AI where possible | Pixel: on-device speech recognition |

### 9.2 Streaming Response Pattern (Gemini)

When AI generates long-form content, stream it:

```
User submits prompt
    ↓
Immediately show "thinking" indicator (animated dots or shimmer)
    ↓
Begin streaming text as tokens are generated
    ↓
Show cursor at end of streamed text
    ↓
On completion: show action buttons (Copy, Share, Thumbs up/down)
    ↓
If error: show specific error + retry option
```

**Streaming UX rules:**
- Never show a blank screen while waiting — show the thinking state immediately
- Stream at a readable pace — don't dump all text at once even if available
- Allow user to stop generation mid-stream
- Preserve streamed content if user navigates away and returns

### 9.3 Smart Suggestions — Non-Intrusive Patterns

| Pattern | Trigger | Dismissal | Example |
|---|---|---|---|
| **Inline completion** | User pauses typing | Continue typing | Gmail Smart Compose |
| **Suggested replies** | Message received | Tap or ignore | Gmail Smart Reply |
| **Contextual chips** | Content detected | Tap or ignore | Calendar event detected in email |
| **Predictive search** | User starts typing | Continue typing | Google Search autocomplete |
| **Proactive card** | Context matches | Dismiss (×) | Google Now/Assistant cards |

**Rules for smart suggestions:**
- Suggestions must be immediately dismissible
- Never block the user's primary task
- Suggestions that are wrong erode trust — only show high-confidence suggestions
- Provide a way to turn off suggestions globally

### 9.4 AI Disclosure Standards

When to tell users AI is involved:

| Situation | Disclosure Required | Format |
|---|---|---|
| AI-generated content | Yes | "Generated by AI" label |
| AI-assisted editing | Yes (subtle) | "AI-assisted" in metadata |
| AI-powered search ranking | No | Implicit, well-known |
| AI-powered spam filtering | No | Implicit, beneficial |
| AI-generated images | Yes | Watermark + metadata |
| AI voice/avatar | Yes | Clear disclosure before interaction |

### 9.5 Graceful AI Degradation

AI features must degrade gracefully:

```
AI available + high confidence → Show AI feature prominently
AI available + low confidence → Show with uncertainty indicator
AI unavailable (offline) → Fall back to non-AI version silently
AI error → Show error, offer non-AI alternative
AI disabled by user → Remove AI UI entirely, no empty spaces
```

---

## 10. Accessibility & Inclusivity

### 10.1 Touch Target Requirements

| Element | Minimum Touch Target | Visual Size | Notes |
|---|---|---|---|
| All interactive elements | 48×48dp | Any | Invisible padding if needed |
| Navigation items | 48×48dp | 24dp icon | Padding fills the gap |
| Checkboxes/Radio | 48×48dp | 20dp visual | |
| Sliders | 48dp tall | 4dp track | Thumb is 20dp visual |
| Text links | 48dp tall | Text height | Increase line height |

### 10.2 Color Contrast Requirements

| Text Type | Minimum Ratio | Enhanced Ratio | Notes |
|---|---|---|---|
| Normal text (<18sp) | 4.5:1 | 7:1 | WCAG AA / AAA |
| Large text (≥18sp or ≥14sp bold) | 3:1 | 4.5:1 | |
| UI components & graphics | 3:1 | — | Borders, icons, charts |
| Decorative elements | None | — | Pure decoration |
| Disabled elements | None | — | Intentionally low contrast |

**Material You guarantee:** The HCT color system ensures that dynamically generated color roles always meet 4.5:1 contrast between `primary` and `on-primary`, `surface` and `on-surface`, etc.

### 10.3 Screen Reader Patterns

| Pattern | Implementation |
|---|---|
| **Content descriptions** | Every image, icon, and non-text element has a meaningful description |
| **Heading hierarchy** | H1 → H2 → H3, never skip levels |
| **Focus order** | Logical reading order (top-left to bottom-right in LTR) |
| **Live regions** | Dynamic content changes announced (snackbars, loading states) |
| **Custom actions** | Swipeable items expose "Delete", "Archive" as accessibility actions |
| **State announcements** | "Checkbox, checked", "Button, disabled" |
| **Group labels** | Related form fields grouped with a single label |

### 10.4 One-Handed Use

Google designs for one-handed use on mobile:

| Pattern | Implementation | Example |
|---|---|---|
| **Bottom-heavy layout** | Primary actions in bottom 40% of screen | Bottom nav, FAB, bottom app bar |
| **Reachability** | Critical actions within thumb zone | Gmail: Compose FAB bottom-right |
| **Swipe gestures** | Horizontal swipes for common actions | Gmail: swipe to archive/delete |
| **Large touch targets** | 48dp minimum, 56dp+ for primary actions | FAB is 56dp |

**Thumb zone map (right-handed):**
```
┌─────────────────┐
│  ✗ Hard reach   │  ← Avoid critical actions
│  ✗ Hard reach   │
│  ~ Stretch      │  ← Secondary actions OK
│  ✓ Natural      │  ← Primary actions here
│  ✓ Natural      │
│  ✓ Easy reach   │  ← Navigation, FAB
└─────────────────┘
```

### 10.5 Cognitive Accessibility

| Principle | Implementation |
|---|---|
| **Reduce cognitive load** | One primary action per screen |
| **Consistent patterns** | Same gesture always does the same thing |
| **Plain language** | 8th grade reading level for UI text |
| **Avoid time pressure** | Never auto-dismiss critical information |
| **Undo over confirm** | Prefer undo to confirmation dialogs |
| **Progress indicators** | Always show where user is in multi-step flows |
| **Error prevention** | Validate inline, disable submit until valid |

### 10.6 Inclusive Design Checklist

- [ ] Works with TalkBack (Android) / VoiceOver (iOS) / NVDA (Web)
- [ ] Works with keyboard-only navigation
- [ ] Works with switch access
- [ ] Works with display size set to largest
- [ ] Works with font size set to largest
- [ ] Works in high contrast mode
- [ ] Works with color blindness (no color-only information)
- [ ] Works in landscape and portrait
- [ ] Works with one hand
- [ ] Works offline or on slow connections
## 11. Performance as UX

### 11.1 Google's Performance Philosophy

> "Fast is not a feature. Fast is the product."

Google's research: **53% of mobile users abandon a site that takes longer than 3 seconds to load**. Every 100ms of latency reduces conversions by 1%. Performance is a design constraint, not an engineering afterthought.

### 11.2 Core Web Vitals Targets

| Metric | Good | Needs Improvement | Poor | What It Measures |
|---|---|---|---|---|
| **LCP** (Largest Contentful Paint) | ≤2.5s | 2.5–4s | >4s | Loading performance |
| **FID** (First Input Delay) | ≤100ms | 100–300ms | >300ms | Interactivity |
| **CLS** (Cumulative Layout Shift) | ≤0.1 | 0.1–0.25 | >0.25 | Visual stability |
| **INP** (Interaction to Next Paint) | ≤200ms | 200–500ms | >500ms | Responsiveness |
| **TTFB** (Time to First Byte) | ≤800ms | 800ms–1.8s | >1.8s | Server response |

### 11.3 Perceived Performance Techniques

The goal is not just to be fast — it is to **feel fast**:

| Technique | How It Works | Example |
|---|---|---|
| **Optimistic UI** | Show success state immediately, roll back on failure | Gmail: email appears sent before server confirms |
| **Skeleton screens** | Show layout structure before content | YouTube: gray card placeholders |
| **Progressive loading** | Load above-the-fold first, defer the rest | Google Images: low-res → high-res |
| **Prefetching** | Load likely next page before user navigates | Google Search: prefetch top result |
| **Instant tap feedback** | Ripple on touch within 16ms | All Material buttons |
| **Speculative execution** | Start processing before user confirms | Search: results update as you type |
| **Cached content** | Show stale content immediately, update in background | Maps: cached map tiles |
| **Offline-first** | App works without network, syncs when available | Drive, Docs offline mode |

### 11.4 Animation Performance Rules

- All animations must run at **60fps** (16ms per frame budget)
- Only animate `transform` and `opacity` — these are GPU-accelerated
- Never animate `width`, `height`, `top`, `left`, `margin` — these trigger layout
- Use `will-change: transform` sparingly and only when needed
- On Android: use hardware-accelerated layers for complex animations

```css
/* ✓ GPU-accelerated — smooth */
.card { transform: translateY(0); transition: transform 300ms; }
.card:hover { transform: translateY(-4px); }

/* ✗ Triggers layout — janky */
.card { top: 0; transition: top 300ms; }
.card:hover { top: -4px; }
```

### 11.5 Image Optimization

| Format | Use Case | Savings vs JPEG |
|---|---|---|
| **WebP** | Photos, complex images | 25–35% |
| **AVIF** | Photos where supported | 50%+ |
| **SVG** | Icons, illustrations, logos | Vector (infinite scale) |
| **PNG** | Transparency required | — |

**Rules:**
- Always specify `width` and `height` on images to prevent CLS
- Use `loading="lazy"` for below-the-fold images
- Serve responsive images with `srcset`
- Use CDN with edge caching for all static assets

---

## 12. Cross-Platform Consistency

### 12.1 What Stays Consistent vs What Adapts

| Dimension | Consistent Across Platforms | Adapts Per Platform |
|---|---|---|
| **Brand** | Colors, logo, voice, tone | — |
| **Content** | Same data, same features | — |
| **Mental model** | Same conceptual structure | — |
| **Navigation** | Same top-level destinations | Bottom nav (mobile) vs sidebar (desktop) |
| **Gestures** | — | Platform-native gestures |
| **Typography** | Same type scale | Platform font (Roboto/San Francisco/Segoe) |
| **Components** | Same component names/behavior | Platform-native rendering |
| **Density** | — | Compact (mobile) vs comfortable (desktop) |

### 12.2 Responsive Layout Patterns

**Canonical layouts for each breakpoint:**

| Breakpoint | Width | Layout Pattern | Example |
|---|---|---|---|
| **Compact** | <600dp | Single column, bottom nav | Gmail mobile |
| **Medium** | 600–839dp | Two-pane (list + detail) | Gmail tablet |
| **Expanded** | 840dp+ | Three-pane or fixed sidebar | Gmail web |

**Adaptive layout patterns:**

| Pattern | Compact | Medium | Expanded |
|---|---|---|---|
| **List-Detail** | List only (tap → detail screen) | Side-by-side | Side-by-side + detail panel |
| **Feed** | 1 column | 2 columns | 3–4 columns |
| **Form** | Full width | Centered, max 600dp | Two-column |
| **Navigation** | Bottom bar | Rail | Drawer (persistent) |

### 12.3 Android-Specific Patterns

| Pattern | Description |
|---|---|
| **Edge-to-edge** | Content draws behind system bars; use `WindowInsets` |
| **Predictive back** | Swipe from edge shows destination preview |
| **Gesture navigation** | No back button; swipe from edges |
| **Dynamic color** | Wallpaper-based color extraction |
| **Widgets** | Glanceable info on home screen |
| **Quick Settings tiles** | One-tap access to app features |
| **Notification actions** | Actionable notifications (Reply, Archive) |

### 12.4 Web-Specific Patterns

| Pattern | Description |
|---|---|
| **Progressive Web App** | Installable, offline-capable, push notifications |
| **Keyboard navigation** | Full keyboard accessibility, visible focus indicators |
| **URL as state** | Every view has a shareable, bookmarkable URL |
| **Browser back button** | Must work correctly with history API |
| **Print styles** | Clean print layout for content pages |
| **SEO** | Server-side rendering or pre-rendering for indexability |

---

## 13. Data-Informed Design Culture

### 13.1 The HEART Framework

Google's framework for measuring UX quality:

| Dimension | Definition | Example Metrics |
|---|---|---|
| **H**appiness | User satisfaction and sentiment | NPS, CSAT, app store rating |
| **E**ngagement | Depth of interaction | Sessions/day, features used, time on task |
| **A**doption | New users or features | % users using new feature, activation rate |
| **R**etention | Users returning over time | D1/D7/D30 retention, churn rate |
| **T**ask Success | Completion of key tasks | Completion rate, error rate, time on task |

### 13.2 Goals-Signals-Metrics (GSM)

For each HEART dimension, define:

```
Goal: What are you trying to achieve?
Signal: What user behavior indicates success or failure?
Metric: How do you measure that signal?
```

**Example — Gmail Smart Compose:**
```
Goal: Help users write emails faster
Signal: Users accept Smart Compose suggestions
Metric: Suggestion acceptance rate, time-to-send reduction
```

### 13.3 A/B Testing Culture

Google runs **thousands of A/B tests simultaneously**. Design implications:

| Principle | Implementation |
|---|---|
| **Ship to learn** | Launch to 1% of users, measure, then ramp |
| **One variable at a time** | Never test multiple changes in one experiment |
| **Statistical significance** | Minimum 95% confidence before declaring winner |
| **Guardrail metrics** | Define metrics that must not regress (e.g., accessibility score) |
| **Long-term holdbacks** | Keep a % of users on old version for months to detect long-term effects |

### 13.4 Design Sprints

Google's 5-day design sprint process:

| Day | Activity | Output |
|---|---|---|
| **Monday** | Map the problem, pick a target | Problem statement, sprint question |
| **Tuesday** | Sketch competing solutions | Solution sketches |
| **Wednesday** | Decide on one solution | Storyboard |
| **Thursday** | Build a realistic prototype | Clickable prototype |
| **Friday** | Test with 5 users | Validated insights |

**Key insight:** 5 users reveal 85% of usability problems. More users add diminishing returns.

### 13.5 Dogfooding

Google requires employees to use products before launch:

- Internal launches ("dogfood") precede external launches by weeks
- Employees file bugs and feedback through internal tools
- Design issues caught by real daily use, not just usability tests
- Creates empathy — designers experience their own decisions

---

## 14. Anti-Patterns

### 14.1 Dark Patterns Google Explicitly Avoids

| Anti-Pattern | Description | Google's Alternative |
|---|---|---|
| **Confirmshaming** | "No thanks, I don't want to save money" | Neutral dismiss: "Not now" |
| **Roach motel** | Easy to sign up, hard to cancel | Cancel is as easy as sign up |
| **Hidden costs** | Reveal fees at checkout | Show total cost upfront |
| **Misdirection** | Visual tricks to make users click wrong thing | Clear visual hierarchy |
| **Forced continuity** | Auto-renew without clear notice | Explicit renewal reminders |
| **Privacy zuckering** | Confusing privacy settings | Clear, simple privacy controls |

### 14.2 UX Anti-Patterns

| Anti-Pattern | Why It's Bad | Correct Pattern |
|---|---|---|
| **Confirmation dialogs for reversible actions** | Interrupts flow, trains users to click OK without reading | Snackbar + Undo |
| **Modal overuse** | Blocks context, breaks flow | Inline editing, bottom sheets |
| **Feature dumping** | Overwhelms users, buries primary action | Progressive disclosure |
| **Inconsistent iconography** | Increases cognitive load | Use Material Symbols consistently |
| **Ignoring empty states** | Feels broken, misses teaching opportunity | Design every empty state |
| **Pagination over infinite scroll** | Breaks flow for content feeds | Infinite scroll (with position restoration) |
| **Infinite scroll for task lists** | Loses user's place | Pagination for tasks/search results |
| **Auto-playing video with sound** | Intrusive, violates user trust | Muted autoplay, user controls sound |
| **Splash screens >2s** | Wastes user time | Optimize launch, use launch screen only |
| **Requiring login to browse** | Blocks value, reduces conversion | Show value first, defer login |
| **Generic error messages** | Unhelpful, frustrating | Specific error + recovery action |
| **Disabling the back button** | Violates platform conventions | Always support back navigation |
| **Horizontal scrolling (unexpected)** | Disorienting on mobile | Vertical scroll primary; horizontal only for carousels |
| **Tiny touch targets** | Frustrating, inaccessible | 48×48dp minimum |
| **Color as only differentiator** | Fails for color-blind users | Color + shape/icon/label |

### 14.3 Performance Anti-Patterns

| Anti-Pattern | Impact | Fix |
|---|---|---|
| **Blocking render with JS** | High LCP, poor FCP | Defer non-critical JS |
| **Unoptimized images** | High LCP, data waste | WebP/AVIF, responsive images |
| **Layout shift on load** | High CLS, disorienting | Reserve space for dynamic content |
| **Synchronous API calls on render** | Blocks UI thread | Async, show skeleton while loading |
| **Animating layout properties** | Janky animations | Only animate transform/opacity |

---

## 15. Implementation Checklist

### 15.1 Design Phase

**Foundation**
- [ ] Using Material Design 3 (M3) component library
- [ ] Color system uses roles, not hardcoded values
- [ ] Dynamic color tested with multiple seed colors
- [ ] Both light and dark mode designed
- [ ] Typography uses the M3 type scale
- [ ] Spacing uses 8dp grid

**User Journey**
- [ ] Primary job defined for each screen
- [ ] FTUE designed (first 3s, 30s, 300s)
- [ ] Every empty state designed
- [ ] Every error state designed with recovery path
- [ ] Loading states designed (skeleton screens)
- [ ] Success states designed and proportional

**Navigation**
- [ ] Navigation pattern chosen based on destination count and screen size
- [ ] Back navigation works correctly from every screen
- [ ] Deep links synthesize correct back stack
- [ ] FAB used for single primary action only

**Components**
- [ ] Button hierarchy clear (one filled button per screen)
- [ ] Feedback components chosen correctly (snackbar vs dialog vs sheet)
- [ ] Touch targets ≥48×48dp for all interactive elements

### 15.2 Motion & Animation

- [ ] Transitions use correct easing curves (enter=decelerate, exit=accelerate)
- [ ] Duration tokens used (not arbitrary values)
- [ ] Container transform used for expand/collapse
- [ ] `prefers-reduced-motion` respected
- [ ] No animation exceeds 400ms for functional transitions

### 15.3 Accessibility

- [ ] Color contrast ≥4.5:1 for normal text, ≥3:1 for large text
- [ ] All images have meaningful alt text
- [ ] Focus order is logical
- [ ] Works with TalkBack/VoiceOver
- [ ] Works with keyboard-only navigation
- [ ] No color-only information
- [ ] Works at 200% font size without horizontal scroll

### 15.4 Performance

- [ ] LCP ≤2.5s on 4G mobile
- [ ] CLS ≤0.1
- [ ] INP ≤200ms
- [ ] Images in WebP/AVIF format
- [ ] Skeleton screens for all content loads
- [ ] Optimistic UI for high-confidence actions
- [ ] Offline state handled gracefully

### 15.5 Cross-Platform

- [ ] Responsive layout tested at compact/medium/expanded breakpoints
- [ ] Platform-native navigation patterns used
- [ ] Edge-to-edge layout on Android
- [ ] Keyboard navigation on web
- [ ] URL reflects app state on web

### 15.6 AI Features (if applicable)

- [ ] AI involvement disclosed to users
- [ ] Streaming responses implemented for long-form AI output
- [ ] Graceful degradation when AI is unavailable
- [ ] AI suggestions are dismissible
- [ ] Uncertainty communicated honestly


---

## 16. SVG Graphics & Illustration System

> SVGs are the primary format for all icons, illustrations, and decorative graphics across Google products. This section defines the rules for authoring, optimizing, and deploying SVGs at Google quality.

---

### 16.1 SVG Optimization Rules

Every SVG shipped in a Google product must pass through an optimization pipeline. Unoptimized SVGs from design tools (Figma, Illustrator) contain redundant metadata, excessive decimal precision, and inefficient path data that bloat file size and slow rendering.

#### viewBox Rules

| Rule | Correct | Incorrect |
|---|---|---|
| Always declare `viewBox` | `viewBox="0 0 24 24"` | No `viewBox` attribute |
| Never use `width`/`height` as sole sizing | Use CSS for sizing | `width="24" height="24"` only |
| Origin always at `0 0` | `viewBox="0 0 24 24"` | `viewBox="-2 -2 28 28"` (unless optical padding needed) |
| Integer dimensions for icon grids | `viewBox="0 0 24 24"` | `viewBox="0 0 24.5 24.5"` |
| Illustration viewBox matches artboard | `viewBox="0 0 400 300"` | Arbitrary cropped values |

#### Coordinate Precision

Excess decimal places are the single largest source of SVG bloat from design tool exports:

| Data Type | Max Decimal Places | Example |
|---|---|---|
| Path coordinates | 2 | `M12.5 4.25` |
| Transform values | 2 | `translate(8.50 12.00)` |
| Opacity / fill-opacity | 2 | `opacity="0.38"` |
| Stroke-width | 1 | `stroke-width="1.5"` |
| Border radius (rx/ry) | 1 | `rx="4.0"` |

**Rule:** Coordinates beyond 2 decimal places are sub-pixel and invisible to the human eye at any screen density. Strip them.

#### Path Simplification

```
Before (Figma export):
<path d="M 12.000000 4.000000 C 12.000000 4.000000 8.500000 7.250000 
         8.500000 12.000000 C 8.500000 16.750000 12.000000 20.000000 
         12.000000 20.000000"/>

After (optimized):
<path d="M12 4C12 4 8.5 7.25 8.5 12s3.5 8 3.5 8"/>
```

Simplification steps (in order):
1. Convert absolute commands to relative where shorter (`L` → `l`, `C` → `c`)
2. Collapse redundant `M` → `L` sequences
3. Remove collinear points (3 points on a straight line → 2 points)
4. Merge overlapping subpaths
5. Convert curves to arcs where the path is a true arc

#### SVGO Configuration

Use SVGO 3.x with this configuration for production icons:

```json
{
  "plugins": [
    "removeDoctype",
    "removeXMLProcInst",
    "removeComments",
    "removeMetadata",
    "removeEditorsNSData",
    "cleanupAttrs",
    "mergeStyles",
    "inlineStyles",
    "minifyStyles",
    "cleanupIds",
    "removeUselessDefs",
    "cleanupNumericValues",
    { "name": "convertPathData", "params": { "floatPrecision": 2 } },
    "convertTransform",
    "removeUnknownsAndDefaults",
    "removeNonInheritableGroupAttrs",
    "removeUselessStrokeAndFill",
    "removeViewBox",
    "cleanupEnableBackground",
    "removeHiddenElems",
    "removeEmptyText",
    "convertShapeToPath",
    "moveElemsAttrsToGroup",
    "moveGroupAttrsToElems",
    "collapseGroups",
    "convertEllipseToCircle",
    { "name": "mergePaths", "params": { "force": false } },
    "sortDefsChildren",
    "removeDimensions"
  ]
}
```

**Do NOT enable for illustrations** (only for icons):
- `mergePaths` with `force: true` — destroys semantic path structure needed for animation
- `removeViewBox` — keep viewBox on illustrations
- `convertShapeToPath` — keep `<rect>`, `<circle>` for readability and animation targeting

**Size targets after optimization:**

| Asset Type | Target Size | Maximum |
|---|---|---|
| UI icon (24dp) | <1 KB | 2 KB |
| Navigation icon (24dp) | <800 B | 1.5 KB |
| Simple illustration | <8 KB | 20 KB |
| Complex illustration | <25 KB | 50 KB |
| Animated illustration | <40 KB | 80 KB |

---

### 16.2 Google's Illustration Style Guide

Google's illustration language — used across Search, Drive, Gmail, Android, and all first-party products — is defined by six visual principles.

#### The Six Principles

| Principle | Specification | Anti-Pattern |
|---|---|---|
| **Rounded corners** | `rx` minimum 4dp; prefer 8–16dp on shapes | Sharp 90° corners on friendly UI |
| **Flat design** | No gradients on primary shapes; flat fills only | Drop shadows, bevels, emboss effects |
| **Limited palette** | Max 5 colors per illustration; use Google brand palette | Rainbow illustrations, >6 distinct hues |
| **Friendly characters** | Simplified human forms; large heads (40% of body height); minimal facial features | Realistic proportions, detailed faces |
| **Geometric construction** | Shapes built from circles, rectangles, and simple curves | Freehand organic shapes |
| **Purposeful negative space** | 30–40% of illustration area is background | Cluttered, edge-to-edge compositions |

#### Google Illustration Color Palette

These are the canonical illustration colors used across Google products:

```
Primary Blue:    #4285F4   (Google Blue)
Primary Red:     #EA4335   (Google Red)
Primary Yellow:  #FBBC04   (Google Yellow)
Primary Green:   #34A853   (Google Green)

Illustration Neutrals:
  Light skin:    #FDDCB5
  Mid skin:      #E8A87C
  Dark skin:     #8D5524
  Hair dark:     #212121
  Hair light:    #F5C518
  Clothing gray: #E8EAED
  Shadow gray:   #BDC1C6

Background tones:
  Warm white:    #FAFAFA
  Cool surface:  #F1F3F4
  Subtle blue:   #E8F0FE
```

**Palette rules:**
- Never use more than 2 of the 4 primary Google colors in a single illustration
- Skin tones must be offered in at least 3 variants for character illustrations
- Shadows are expressed as a darker tint of the surface color, never black at opacity
- Gradients are permitted only for backgrounds, never on foreground objects

#### Corner Radius by Shape Size

| Shape Width | Minimum rx | Preferred rx |
|---|---|---|
| <32dp | 4dp | 6dp |
| 32–64dp | 6dp | 8dp |
| 64–128dp | 8dp | 12dp |
| 128–256dp | 12dp | 16dp |
| >256dp | 16dp | 24dp |

#### Character Construction Rules

```
Head:body ratio    = 1:1.5 to 1:2 (large head = friendly)
Eye size           = 8–12% of head width each
Nose               = single dot or minimal curve only
Mouth              = simple arc, 2dp stroke
Limb width         = 12–16% of body width
Hand               = mitten shape (no individual fingers) or simple oval
Feet               = rounded rectangles
```

---

### 16.3 SVG Accessibility

Every SVG that conveys information must be accessible. Decorative SVGs must be explicitly hidden from assistive technology.

#### The Decision Tree

```
Does the SVG convey information?
├── YES → Is it interactive (button, link)?
│   ├── YES → Use aria-label on the <button>/<a> wrapper
│   │         Set focusable="false" on the SVG itself
│   └── NO  → Add role="img" + aria-label to <svg>
│             Add <title> as first child of <svg>
│             Add <desc> if complex (illustrations)
└── NO (decorative) → aria-hidden="true" + focusable="false"
```

#### Accessible Icon (Interactive)

```html
<!-- Icon inside a button — label goes on the button, not the SVG -->
<button aria-label="Search">
  <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
    <path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 
             6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79
             l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 
             5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
  </svg>
</button>
```

#### Accessible Standalone SVG (Informational)

```html
<!-- Standalone SVG conveying information -->
<svg viewBox="0 0 200 150" role="img" 
     aria-labelledby="svg-title-1 svg-desc-1"
     focusable="false">
  <title id="svg-title-1">Upload complete</title>
  <desc id="svg-desc-1">
    A green checkmark inside a circle indicating your file 
    uploaded successfully.
  </desc>
  <!-- paths -->
</svg>
```

#### Decorative SVG

```html
<!-- Background decoration — hidden from all AT -->
<svg viewBox="0 0 400 300" aria-hidden="true" focusable="false">
  <!-- decorative paths -->
</svg>
```

#### Accessibility Attribute Reference

| Attribute | Value | When to Use |
|---|---|---|
| `role="img"` | — | Standalone informational SVG |
| `aria-label="…"` | Concise description | Simple icons/SVGs without `<title>` |
| `aria-labelledby="id1 id2"` | Space-separated IDs | SVG with `<title>` and/or `<desc>` |
| `aria-hidden="true"` | — | Decorative SVGs; icons inside labeled buttons |
| `focusable="false"` | — | All SVGs (IE11 made SVGs focusable by default) |
| `<title>` | Short label | First child of `<svg>`; equivalent to alt text |
| `<desc>` | Longer description | Complex illustrations; optional |

**Rule:** `focusable="false"` is required on all SVGs. Without it, IE11 and some screen reader + browser combos insert the SVG into the tab order, creating phantom focus stops.

---

### 16.4 Inline SVG vs `<img>` vs CSS Background

Choosing the wrong embedding method causes accessibility failures, caching misses, and missed animation opportunities.

#### Decision Tree

```
Does the SVG need to be animated or styled with CSS?
├── YES → Inline SVG
└── NO  → Does it need to be accessible as an image with alt text?
    ├── YES → <img src="…" alt="…">
    └── NO  → Is it a purely decorative background texture/pattern?
        ├── YES → CSS background-image
        └── NO  → <img> with alt="" (decorative but structural)
```

#### Comparison Table

| Criterion | Inline SVG | `<img>` | CSS `background-image` |
|---|---|---|---|
| **CSS styling** | Full (any property) | None (external file) | Limited (size, position) |
| **JS animation** | Full DOM access | None | None |
| **CSS animation** | Full | None | None |
| **Caching** | Not cached (inline) | Cached by browser | Cached by browser |
| **Accessibility** | Manual (`role`, `aria-*`) | Native (`alt` attribute) | Not accessible (use sparingly) |
| **HTTP request** | None (inline) | 1 per SVG | 1 per SVG (or sprite) |
| **Reuse** | Requires `<use>` + `<symbol>` | Automatic (same URL) | Automatic (same URL) |
| **Dark mode** | `currentColor`, CSS vars | Requires `<picture>` or JS | `prefers-color-scheme` in CSS |
| **Print** | Renders | Renders | May not render |
| **SEO** | Not indexed | Indexed with alt | Not indexed |

#### When to Use Each

**Inline SVG — use when:**
- The icon/illustration must respond to `currentColor` (inherits text color)
- CSS or JS animation is required
- The SVG contains interactive elements (`<a>`, `<button>`)
- You need to update fill/stroke colors via CSS custom properties

**`<img>` tag — use when:**
- The SVG is a static illustration or logo
- Caching is important (same SVG reused across many pages)
- The SVG is large and would bloat HTML payload
- You need native `alt` text support without extra ARIA

**CSS `background-image` — use when:**
- The SVG is a purely decorative texture, pattern, or background shape
- The element's size is controlled by CSS, not the SVG's intrinsic dimensions
- The SVG never needs to be accessible

```css
/* CSS background — decorative only */
.hero-bg {
  background-image: url('/assets/wave-pattern.svg');
  background-size: cover;
  background-repeat: no-repeat;
}
```

---


---

## 17. Readability & Typography Rendering

> Typography is not decoration — it is the primary vehicle for information delivery. Every typographic decision affects comprehension speed, fatigue, accessibility, and perceived quality.

---

### 17.1 Optimal Line Length

Line length (measure) is the single most impactful factor in reading speed and comprehension. Too short forces excessive eye jumps; too long causes line-tracking errors.

| Type Style | Optimal CPL | Absolute Min | Absolute Max | Notes |
|---|---|---|---|---|
| **Body Large / Body Medium** | 60–75 chars | 45 | 85 | Sweet spot for sustained reading |
| **Body Small / Caption** | 45–60 chars | 35 | 70 | Shorter measure compensates for smaller size |
| **Headline Large / Display** | 20–40 chars | 15 | 50 | Headlines are scanned, not read linearly |
| **Headline Small / Title** | 30–50 chars | 20 | 60 | |
| **Label / Overline** | No limit | — | — | Single line, truncate with ellipsis |
| **Dense table cells** | 20–40 chars | — | — | Truncate beyond; tooltip on hover |

**CPL = Characters Per Line (including spaces)**

**Enforcement in CSS:**

```css
/* Body text container */
.body-text {
  max-width: 75ch;   /* ~75 characters at current font size */
  min-width: 45ch;   /* prevent over-compression on narrow viewports */
}

/* Headlines don't need max-width enforcement — they wrap naturally */
.display { max-width: 20ch; } /* Display only */
```

**Decision tree: Is my line length correct?**

```
Count characters in the longest typical line.
├── < 45 chars → Too narrow. Increase container width or reduce font size.
├── 45–85 chars → ✓ Acceptable range.
│   └── 60–75 chars → ✓ Optimal.
└── > 85 chars → Too wide. Add max-width or increase font size.
    └── On desktop wide layouts: use multi-column or constrain content column.
```

**Real product examples:**
- **Google Search results snippet:** ~65–70 CPL at default zoom
- **Gmail message body:** constrained to ~680px ≈ 70 CPL at 16px
- **Google Docs default:** 816px page width, ~80 CPL — intentionally mimics paper
- **Material Design guidelines page:** `max-width: 900px` with 16px body = ~72 CPL

---

### 17.2 Line Height Ratios by Type Style

Line height (leading) controls vertical rhythm and breathing room. It is expressed as a **ratio multiplied by font size**, not a fixed pixel value — this ensures it scales correctly with user font size preferences.

| Type Style | M3 Token | Size | Line Height | Ratio | Notes |
|---|---|---|---|---|---|
| **Display Large** | `displayLarge` | 57sp | 64sp | 1.12 | Tight — display text is scanned |
| **Display Medium** | `displayMedium` | 45sp | 52sp | 1.16 | |
| **Display Small** | `displaySmall` | 36sp | 44sp | 1.22 | |
| **Headline Large** | `headlineLarge` | 32sp | 40sp | 1.25 | |
| **Headline Medium** | `headlineMedium` | 28sp | 36sp | 1.29 | |
| **Headline Small** | `headlineSmall` | 24sp | 32sp | 1.33 | |
| **Title Large** | `titleLarge` | 22sp | 28sp | 1.27 | |
| **Title Medium** | `titleMedium` | 16sp | 24sp | 1.50 | Transitions to body-like ratio |
| **Title Small** | `titleSmall` | 14sp | 20sp | 1.43 | |
| **Body Large** | `bodyLarge` | 16sp | 24sp | 1.50 | Minimum for comfortable body reading |
| **Body Medium** | `bodyMedium` | 14sp | 20sp | 1.43 | |
| **Body Small** | `bodySmall` | 12sp | 16sp | 1.33 | Captions — tighter acceptable at small size |
| **Label Large** | `labelLarge` | 14sp | 20sp | 1.43 | |
| **Label Medium** | `labelMedium` | 12sp | 16sp | 1.33 | |
| **Label Small** | `labelSmall` | 11sp | 16sp | 1.45 | |

**Rules:**
- Body text: never below **1.4 ratio** (WCAG 1.4.8 recommends 1.5 for body)
- Display/Headline: ratios of **1.1–1.3** are correct — tighter leading improves visual grouping of large text
- Never use `line-height: 1` on any readable text
- Use unitless ratios (`line-height: 1.5`), not fixed px/rem values — fixed values break when user scales font size

```css
/* ✓ Correct — scales with font size */
.body-large { font-size: 1rem; line-height: 1.5; }

/* ✗ Wrong — breaks at user font size overrides */
.body-large { font-size: 16px; line-height: 24px; }
```

---

### 17.3 Letter Spacing (Tracking) Rules

Letter spacing fine-tunes legibility at different sizes and weights. The M3 spec defines tracking in `em` units (relative to font size).

| Type Style | Size | Weight | Tracking (em) | Tracking (px at size) | Rationale |
|---|---|---|---|---|---|
| **Display Large** | 57sp | 400 | -0.016em | -0.9px | Large text needs tighter tracking |
| **Display Medium** | 45sp | 400 | 0em | 0px | Neutral at mid-display |
| **Display Small** | 36sp | 400 | 0em | 0px | |
| **Headline Large** | 32sp | 400 | 0em | 0px | |
| **Headline Medium** | 28sp | 400 | 0em | 0px | |
| **Headline Small** | 24sp | 400 | 0em | 0px | |
| **Title Large** | 22sp | 400 | 0em | 0px | |
| **Title Medium** | 16sp | 500 | +0.009em | +0.15px | Medium weight needs slight opening |
| **Title Small** | 14sp | 500 | +0.006em | +0.1px | |
| **Body Large** | 16sp | 400 | +0.031em | +0.5px | Body benefits from slight opening |
| **Body Medium** | 14sp | 400 | +0.016em | +0.25px | |
| **Body Small** | 12sp | 400 | +0.033em | +0.4px | Small text needs more opening |
| **Label Large** | 14sp | 500 | +0.006em | +0.1px | |
| **Label Medium** | 12sp | 500 | +0.042em | +0.5px | Small + medium weight = most opening |
| **Label Small** | 11sp | 500 | +0.045em | +0.5px | |

**General rules:**
- **Large text (>24sp):** zero or negative tracking — large glyphs have too much space by default
- **Small text (<14sp):** positive tracking — improves legibility at small sizes
- **Heavy weights (600+):** add +0.01–0.02em — bold strokes reduce apparent spacing
- **All-caps text:** always add +0.08–0.15em — capitals are designed for mixed-case context
- **Never use tracking to justify text** — use it only for optical correction

```css
/* All-caps label — always add tracking */
.overline {
  text-transform: uppercase;
  letter-spacing: 0.1em; /* mandatory for all-caps */
}

/* Display text — tighten at large sizes */
.display-large {
  font-size: 3.5625rem; /* 57px */
  letter-spacing: -0.016em;
}
```

---

### 17.4 Font Rendering: Antialiasing & Subpixel Rendering

Font rendering affects perceived sharpness, weight, and color accuracy. Google's approach varies by context.

#### Antialiasing Modes

| Mode | CSS Value | Effect | When to Use |
|---|---|---|---|
| **Subpixel antialiasing** | `-webkit-font-smoothing: auto` (default on macOS) | Uses RGB subpixels; text appears slightly heavier and sharper on LCD | Body text on light backgrounds, macOS 1× |
| **Grayscale antialiasing** | `-webkit-font-smoothing: antialiased` | Single-channel; text appears lighter and thinner | Dark backgrounds, light text, Retina displays |
| **None** | `-webkit-font-smoothing: none` | Aliased; pixelated | Never in production |
| **Firefox (Gecko)** | `-moz-osx-font-smoothing: grayscale` | Equivalent to antialiased on macOS | Pair with `-webkit-font-smoothing` |

**Decision rule:**

```
Is the text on a dark background (surface tone < 50)?
├── YES → Use antialiased. Subpixel on dark = color fringing artifacts.
└── NO → Is the display Retina/HiDPI (devicePixelRatio ≥ 2)?
    ├── YES → Use antialiased. Subpixel unnecessary at 2×; grayscale looks cleaner.
    └── NO (1× LCD) → Use auto (subpixel). Heavier rendering aids legibility on low-DPI.
```

**Google's standard implementation:**

```css
/* Applied globally in Google products */
body {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility; /* enables kerning and ligatures */
}

/* Override for very small text where subpixel helps on 1× screens */
@media (-webkit-max-device-pixel-ratio: 1) {
  .body-small, .label { -webkit-font-smoothing: auto; }
}
```

**`text-rendering` values:**

| Value | Effect | Use Case |
|---|---|---|
| `auto` | Browser decides | Default |
| `optimizeSpeed` | Disables kerning/ligatures | Large volumes of text where perf matters |
| `optimizeLegibility` | Enables kerning, ligatures, hinting | Body text, headlines |
| `geometricPrecision` | Precise glyph geometry | SVG text, logos |

**Rule:** Use `optimizeLegibility` for all body and headline text. It enables kerning pairs (e.g., "AV", "To") that significantly improve headline quality. Avoid on very long lists (>500 items) — it has a measurable CPU cost.

**Windows ClearType:** On Windows, ClearType (DirectWrite) handles subpixel rendering automatically. CSS `-webkit-font-smoothing` has no effect on Windows. Google Fonts variable fonts include TrueType hinting for correct Windows rendering.

---

### 17.5 Google Fonts Loading Strategy

Font loading is a critical performance and CLS concern. A poorly loaded font causes FOUT (Flash of Unstyled Text) or FOIT (Flash of Invisible Text).

#### The Four-Step Loading Strategy

```
1. DNS prefetch + preconnect (in <head>, before everything else)
2. Preload the critical font file (above-the-fold weight/style only)
3. Load with font-display: swap (eliminate FOIT)
4. Subset to only needed characters (reduce file size 60–80%)
```

**Implementation:**

```html
<!-- Step 1: Preconnect to Google Fonts CDN -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

<!-- Step 2: Preload critical font (above-the-fold weight only) -->
<link rel="preload"
  href="https://fonts.gstatic.com/s/roboto/v47/KFOmCnqEu92Fr1Me5WZLCzYlKw.woff2"
  as="font" type="font/woff2" crossorigin>

<!-- Step 3: Load with display=swap -->
<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500&display=swap"
  rel="stylesheet">
```

**`font-display` values — when to use each:**

| Value | FOIT Duration | FOUT | Use Case |
|---|---|---|---|
| `auto` | Browser default (~3s FOIT) | Yes | Never use |
| `block` | Up to 3s invisible | No | Icon fonts only (brief block prevents icon flash) |
| `swap` | 0ms (fallback immediately) | Yes | Body text, headlines — always use this |
| `fallback` | 100ms block, then swap | Yes (brief) | Good balance for body text |
| `optional` | 100ms block, no swap | No | Non-critical decorative fonts |

**Rule:** Use `font-display: swap` for all text fonts. Use `font-display: block` only for icon fonts (Material Symbols) where a fallback character would be worse than brief invisibility.

#### Subsetting

```
Full Roboto woff2:                    ~68KB per weight
Latin subset only:                    ~18KB per weight  (73% reduction)
Custom subset (A–Z, a–z, 0–9, punct): ~8KB per weight
```

```css
/* Custom character subset via unicode-range */
@font-face {
  font-family: 'Roboto';
  src: url('...') format('woff2');
  font-display: swap;
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC,
                 U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074,
                 U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215,
                 U+FEFF, U+FFFD;
}
```

**Self-hosting vs Google CDN:**

| Factor | Google CDN | Self-hosted |
|---|---|---|
| **Cache sharing** | Shared across sites (benefit diminishing post-partitioned cache) | No sharing |
| **HTTP/2 push** | Yes | Depends on server |
| **Privacy** | Third-party request | First-party |
| **Control** | Limited | Full |
| **Recommendation** | Consumer products | Enterprise, privacy-sensitive |

---

### 17.6 Variable Fonts

Variable fonts encode an entire type family in a single file, with continuous axes instead of discrete weights/styles.

#### When to Use Variable Fonts

```
Does the UI use more than 2 weights of the same typeface?
├── YES → Variable font saves bandwidth (1 file vs N files).
└── NO → Static fonts may be simpler; evaluate file size.

Does the UI animate font weight or size (e.g., expanding FAB label, responsive headlines)?
├── YES → Variable font is required for smooth interpolation.
└── NO → Static fonts are fine.

Is the target browser IE11 or very old Android WebView?
├── YES → Provide static font fallback; variable fonts unsupported.
└── NO → Variable fonts have >97% browser support (2025).
```

#### Variable Font Axes

| Axis Tag | Name | Range (Roboto Flex) | Effect | Use Case |
|---|---|---|---|---|
| `wght` | Weight | 100–900 | Stroke thickness | Replace all weight variants |
| `wdth` | Width | 75–125 | Glyph horizontal scale | Condensed/expanded variants |
| `opsz` | Optical size | 8–144 | Glyph design optimized per size | Auto-adjust at display vs caption sizes |
| `ital` | Italic | 0–1 | Italic slant | Animate italic transitions |
| `slnt` | Slant | -10–0 | Oblique angle | Oblique (not true italic) |
| `GRAD` | Grade | -200–150 | Weight without changing width | Dark mode weight compensation |

**`opsz` (optical size) is the most underused axis.** At large display sizes, letterforms should have thinner strokes and tighter spacing. At small caption sizes, strokes should be thicker and spacing more open. `opsz` handles this automatically.

```css
/* Variable with opsz: design adapts to size */
h1 { font-size: 3rem;  font-variation-settings: 'wght' 300, 'opsz' 48; }
p  { font-size: 1rem;  font-variation-settings: 'wght' 400, 'opsz' 16; }
```

**`GRAD` for dark mode:** Light text on dark backgrounds appears heavier due to halation (light bleed). Reduce `GRAD` by ~25 in dark mode to maintain perceived weight without changing layout metrics.

```css
@media (prefers-color-scheme: dark) {
  body { font-variation-settings: 'GRAD' -25; }
}
```

#### Performance: Variable vs Static

| Scenario | Static Fonts | Variable Font |
|---|---|---|
| 1 weight used | ~18KB | ~45KB (larger single file) |
| 2 weights used | ~36KB | ~45KB (break-even) |
| 3+ weights used | ~54KB+ | ~45KB ✓ (variable wins) |
| Animated weight | Not possible | ~45KB ✓ (only option) |

**Rule:** Use variable fonts when loading 3+ weights, or when any axis needs animation. For 1–2 static weights, evaluate whether the larger single-file size is worth it.

```css
@font-face {
  font-family: 'Roboto Flex';
  src: url('RobotoFlex.woff2') format('woff2 supports variations'),
       url('RobotoFlex.woff2') format('woff2');
  font-weight: 100 900;
  font-style: normal;
  font-display: swap;
}
```

---

### 17.7 Roboto vs Google Sans vs Product Sans

Google maintains multiple typefaces for different product contexts. Using the wrong one is a brand violation.

| Typeface | Classification | Available | Primary Use | Examples |
|---|---|---|---|---|
| **Roboto** | Neo-grotesque sans-serif | Google Fonts (public) | Android system UI, Material Design components, developer tools | Android OS, Google Play, Firebase console |
| **Roboto Flex** | Variable version of Roboto | Google Fonts (public) | Same as Roboto, with variable axis support | Recommended replacement for Roboto |
| **Roboto Serif** | Serif companion | Google Fonts (public) | Long-form reading, editorial contexts | Google Books, Docs print view |
| **Roboto Mono** | Monospace | Google Fonts (public) | Code, terminal output, data tables requiring alignment | Google Colab, Cloud Shell, Sheets formulas |
| **Google Sans** | Geometric humanist sans | Internal / licensed | Google product UIs (non-Android), marketing | Google Search, Gmail web, Google One |
| **Google Sans Display** | Display variant | Internal / licensed | Large headlines, hero text | Google.com homepage, Pixel marketing |
| **Google Sans Mono** | Monospace variant | Internal / licensed | Code in Google product UIs | Google Docs code blocks |
| **Product Sans** | Geometric sans | Internal only | Google brand wordmark and logo only | Google logo, G Suite logos |

**Decision tree: Which typeface?**

```
Are you building an Android app or Material Design component?
├── YES → Roboto (or Roboto Flex for variable support)
└── NO → Are you building a Google-branded web product or consumer app?
    ├── YES → Google Sans (requires license/internal access)
    │   └── Hero/display text → Google Sans Display
    └── NO → Are you building a third-party product using Google Fonts?
        ├── Body/UI text → Roboto or Roboto Flex
        ├── Code/data → Roboto Mono
        └── Editorial/reading → Roboto Serif
```

**Critical rules:**
- **Product Sans is never used for UI text** — it is exclusively for the Google wordmark and product logos. Using it in UI is a brand violation.
- **Google Sans is not on Google Fonts** — do not attempt to replicate it with similar fonts in third-party products.
- **Roboto is the correct choice for all public Material Design implementations.**
- On iOS, substitute **SF Pro** (system font) — never ship Roboto on iOS for native apps.
- On Windows, substitute **Segoe UI** for native apps.

**System font stack (when brand font unavailable):**

```css
font-family:
  'Google Sans',   /* Google internal products */
  'Roboto',        /* Android, Material web */
  -apple-system,   /* iOS/macOS SF Pro */
  'Segoe UI',      /* Windows */
  sans-serif;      /* Ultimate fallback */
```

---

### 17.8 Text Truncation Patterns

Truncation is a last resort — always prefer responsive layouts that accommodate text. When truncation is unavoidable, apply the correct pattern.

#### Pattern 1: Single-Line Ellipsis

For labels, list item titles, chip text, navigation items.

```css
.truncate-single {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%; /* container must have a defined width */
}
```

**Rules:**
- Always pair with a tooltip showing the full text on hover/focus
- Truncate at the end unless the distinguishing part is at the end (e.g., file paths: use middle truncation `file…txt`)
- Never truncate the only piece of identifying information without a disclosure mechanism

**Middle truncation for file paths:**

```javascript
function middleTruncate(str, maxLen = 30) {
  if (str.length <= maxLen) return str;
  const keep = Math.floor((maxLen - 1) / 2);
  return str.slice(0, keep) + '…' + str.slice(-keep);
}
// "very-long-filename-document.pdf" → "very-long-filen…ment.pdf"
```

#### Pattern 2: Multi-Line Clamp

For card descriptions, search snippets, notification previews.

```css
.truncate-multiline {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-clamp: 3; /* standard property, widely supported 2024+ */
}
```

**Line clamp guidelines by context:**

| Context | Max Lines | Rationale |
|---|---|---|
| Card description | 2–3 | Preserve card height uniformity |
| Search result snippet | 2 | Google Search standard |
| Notification preview | 1–2 | Glanceable |
| List item supporting text | 1–2 | List density |
| Dialog body | No clamp | Dialogs scroll; never clamp dialog content |
| Article preview | 3–4 | More context aids click decision |

#### Pattern 3: Tooltip on Truncation

Every truncated element must expose its full content:
- **Web:** hover (mouse) + focus (keyboard) — `title` attribute or ARIA
- **Android:** long-press → tooltip popup (`Material TooltipCompat`)
- **Never:** auto-expand on tap (breaks navigation patterns)

```html
<span class="truncate-single"
  title="Full untruncated text content here"
  aria-label="Full untruncated text content here"
  tabindex="0">
  Truncated text…
</span>
```

**Only add tooltip when truncation actually occurs:**

```javascript
function applyTruncationTooltip(el) {
  if (el.scrollWidth > el.clientWidth) {
    el.setAttribute('title', el.textContent);
  }
}
```

#### Truncation Decision Tree

```
Does the text need to fit in a fixed-height container?
├── Single line → Single-line ellipsis + tooltip
└── Multiple lines → Multi-line clamp + "Show more" if actionable

Is the truncated text the primary identifier (name, title)?
├── YES → Tooltip is mandatory. Consider expanding the container instead.
└── NO → Tooltip recommended but optional.

Is this a data table cell?
├── YES → Truncate at ~40 chars, tooltip always required.
└── NO → Apply context-specific rule above.
```

---

### 17.9 Readability in Different Contexts

Typography settings must adapt to the density and purpose of each container.

#### Cards

| Property | Value | Rationale |
|---|---|---|
| **Title** | Title Medium (16sp/500) or Title Large (22sp/400) | Scannable, not dominant |
| **Body/description** | Body Medium (14sp/400), 2–3 line clamp | Preserve card height uniformity |
| **Supporting metadata** | Body Small (12sp/400), `on-surface-variant` color | Visually subordinate |
| **Line height** | 1.43–1.5 | Standard body ratio |
| **Padding** | 16dp all sides (standard), 12dp (compact) | 8dp grid |
| **Max line length** | 45–65 CPL | Cards are narrower than full-width content |
| **Text contrast** | Title: `on-surface` (≥4.5:1); Meta: `on-surface-variant` (≥4.5:1) | Both must pass WCAG AA |

#### Dialogs

| Property | Value | Rationale |
|---|---|---|
| **Title** | Headline Small (24sp/400) | Prominent but not overwhelming |
| **Body** | Body Medium (14sp/400), no line clamp | Dialogs scroll; never truncate |
| **Line height** | 1.43 | Body Medium standard |
| **Max width** | 560dp (web), full-width minus 48dp margin (mobile) | |
| **Max line length** | 55–65 CPL | Dialog width naturally constrains this |
| **Button labels** | Label Large (14sp/500) | |
| **Padding** | 24dp (title top/sides), 16dp (body), 24dp (actions) | M3 dialog spec |

**Rule:** Dialog body text must never be truncated. If content is long, the dialog body scrolls. The title remains sticky.

#### Lists

| Property | Value | Rationale |
|---|---|---|
| **Primary text** | Body Large (16sp) or Title Medium (16sp/500) | Legible at list density |
| **Secondary text** | Body Medium (14sp), `on-surface-variant` | Supporting info |
| **Tertiary/meta** | Body Small (12sp) | Timestamps, counts |
| **Single-line item height** | 48dp min | Touch target compliance |
| **Two-line item height** | 64dp | M3 spec |
| **Three-line item height** | 88dp | M3 spec; avoid four-line |
| **Leading/trailing icon** | 24dp, vertically centered | |
| **Text truncation** | Single-line ellipsis on primary; 2-line clamp on secondary | |

**Dense list (settings, menus):** Reduce to Body Medium (14sp) for primary text. Minimum item height: 40dp. Never go below 40dp.

#### Dense Data Tables

| Property | Value | Rationale |
|---|---|---|
| **Header text** | Label Medium (12sp/500), `on-surface-variant` | Distinguishable from data |
| **Cell text** | Body Small (12sp/400) or Body Medium (14sp/400) | Density vs readability tradeoff |
| **Line height** | 1.33 (tighter than body) | Row height control |
| **Row height (comfortable)** | 52dp | Default M3 data table |
| **Row height (dense)** | 36dp | Maximum density; only for expert UIs |
| **Column header alignment** | Left for text, right for numbers | Matches data alignment |
| **Number alignment** | Right-aligned, tabular figures | Decimal points align vertically |
| **Truncation** | Ellipsis at ~40 chars, tooltip required | |
| **Horizontal padding** | 16dp (first/last column), 12dp (middle columns) | |

```css
.data-table th {
  font-size: 0.75rem;   /* 12px */
  font-weight: 500;
  line-height: 1.33;
  color: var(--md-sys-color-on-surface-variant);
  letter-spacing: 0.042em;
}
.data-table td {
  font-size: 0.875rem;  /* 14px */
  font-weight: 400;
  line-height: 1.33;
  font-variant-numeric: tabular-nums;
}
```

---

### 17.10 RTL / Bidirectional Text

Google products serve Arabic, Hebrew, Persian, Urdu, and other RTL languages. RTL is not a mirror — it requires deliberate design decisions.

#### Logical Properties (Use These, Not Physical)

Physical properties (`left`, `right`, `margin-left`) break in RTL. Logical properties adapt automatically.

| Physical Property | Logical Equivalent | RTL Behavior |
|---|---|---|
| `margin-left` | `margin-inline-start` | Becomes `margin-right` in RTL |
| `margin-right` | `margin-inline-end` | Becomes `margin-left` in RTL |
| `padding-left` | `padding-inline-start` | Flips in RTL |
| `padding-right` | `padding-inline-end` | Flips in RTL |
| `border-left` | `border-inline-start` | Flips in RTL |
| `text-align: left` | `text-align: start` | Right-aligns in RTL |
| `text-align: right` | `text-align: end` | Left-aligns in RTL |
| `left: 0` | `inset-inline-start: 0` | Flips in RTL |
| `float: left` | `float: inline-start` | Flips in RTL |

```css
/* ✗ Physical — breaks in RTL */
.list-item { padding-left: 16px; text-align: left; }

/* ✓ Logical — works in both LTR and RTL */
.list-item { padding-inline-start: 16px; text-align: start; }
```

#### `dir` Attribute and `direction` Property

```html
<!-- Page-level: set on <html> -->
<html lang="ar" dir="rtl">

<!-- Component-level override for mixed content -->
<p dir="rtl">هذا نص عربي</p>
<p dir="ltr">This is English text</p>

<!-- Auto-detect direction from content -->
<p dir="auto">Content direction detected automatically</p>
```

#### Bidirectional Text Rules

| Scenario | Rule | Example |
|---|---|---|
| **Mixed LTR/RTL in one string** | Use `<bdi>` or Unicode bidi marks | Arabic text with English product name |
| **Numbers in RTL text** | Numbers always render LTR within RTL text | "١٢٣" in Arabic paragraph |
| **URLs and code** | Always LTR; wrap in `dir="ltr"` or `<bdi>` | `https://` in Arabic UI |
| **Directional icons** | Mirror arrows, back button, send, undo/redo | Back arrow flips; play button does not |
| **Layout** | Nav drawer opens from right; FAB is bottom-left | Gmail Arabic: compose FAB bottom-left |

**Icons that mirror in RTL:**

```
✓ Mirror: ← → back/forward arrows, send (paper plane), undo/redo,
          list with leading icon, progress indicators (L→R flow)

✗ Do NOT mirror: play/pause, volume, settings gear, search,
                 checkmarks, warning icons, logos
```

```css
/* Mirror directional icons in RTL */
[dir="rtl"] .icon-back,
[dir="rtl"] .icon-forward,
[dir="rtl"] .icon-send {
  transform: scaleX(-1);
}
```

**`text-align: start` vs `text-align: left`:** Always use `start` for UI text. Use `left` or `right` only when alignment must be fixed regardless of text direction (e.g., number columns always right-aligned).

```css
.body-text   { text-align: start; }  /* ✓ adapts to direction */
.number-cell { text-align: right; }  /* ✓ intentionally fixed */
```

---

### 17.11 Number Formatting

Numbers require special typographic treatment for legibility and locale correctness.

#### Tabular Figures for Data Tables

Proportional figures (default in most fonts) have varying widths — "1" is narrower than "8". In data tables, this causes decimal points and digits to misalign across rows.

```css
/* Enable tabular (monospaced) figures for data alignment */
.data-table td,
.metric-value,
.price,
.timestamp {
  font-variant-numeric: tabular-nums;
  font-feature-settings: 'tnum' 1; /* fallback for older browsers */
}
```

**When to use tabular figures:**

| Context | Figure Type | Rationale |
|---|---|---|
| Data tables | Tabular | Vertical alignment of digits |
| Financial data | Tabular | Decimal alignment critical |
| Leaderboards / rankings | Tabular | Scores align |
| Timers / countdowns | Tabular | Prevents layout shift as digits change |
| Body text prose | Proportional | More natural reading rhythm |
| Headlines with numbers | Proportional | Better optical spacing |

#### Locale-Aware Number Formatting

Never hardcode number formats. Use the `Intl.NumberFormat` API.

```javascript
// ✗ Wrong — hardcoded US format
const price = `$${(1234567.89).toFixed(2)}`; // "$1234567.89"

// ✓ Correct — locale-aware
const fmt = new Intl.NumberFormat(userLocale, {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});
fmt.format(1234567.89);
// en-US: "$1,234,567.89"
// de-DE: "1.234.567,89 $"
// ar-SA: "١٬٢٣٤٬٥٦٧٫٨٩ US$"
```

**Locale number format variations:**

| Locale | Decimal Sep. | Thousands Sep. | Example |
|---|---|---|---|
| en-US | `.` | `,` | 1,234,567.89 |
| de-DE | `,` | `.` | 1.234.567,89 |
| fr-FR | `,` | ` ` (thin space) | 1 234 567,89 |
| ar-SA | `٫` | `٬` | ١٬٢٣٤٬٥٦٧٫٨٩ |
| hi-IN | `.` | `,` (2-2-3 grouping) | 12,34,567.89 |

**Compact notation for large numbers:**

```javascript
new Intl.NumberFormat('en-US', { notation: 'compact' }).format(1234567); // "1.2M"
new Intl.NumberFormat('en-US', { notation: 'compact' }).format(12345);   // "12K"
```

Use compact notation for: view counts (YouTube), follower counts, storage sizes, analytics. Never use it for financial transactions or precise measurements.

**Ordinal numbers:**

```javascript
// Always use Intl — ordinal rules vary dramatically by language
const pr = new Intl.PluralRules('en-US', { type: 'ordinal' });
const suffixes = { one: 'st', two: 'nd', few: 'rd', other: 'th' };
const ordinal = (n) => `${n}${suffixes[pr.select(n)]}`;
ordinal(1); // "1st"   ordinal(2); // "2nd"   ordinal(11); // "11th"
```

---

### 17.12 Paragraph, Section & Content Hierarchy Spacing

Spacing creates visual hierarchy and groups related content. All values follow the **8dp base grid**.

#### Paragraph Spacing

| Context | Paragraph Spacing | Line Height | Notes |
|---|---|---|---|
| **Body text (articles, docs)** | 16dp (1em at 16sp) | 24dp | Standard reading rhythm |
| **Dense body (settings descriptions)** | 8dp | 20dp | Minimal separation |
| **Dialog body** | 8dp | 20dp | Compact |
| **Marketing / landing page** | 24dp | 28–32dp | Generous breathing room |

```css
.article p + p     { margin-block-start: 1em; }    /* 16px at 16px font */
.description p + p { margin-block-start: 0.5em; }  /* dense UI */
```

**Rule:** Use `margin-block-start` (not `margin-top`) — it respects writing mode and RTL.

#### Section Spacing

| Level | Spacing | Token | Usage |
|---|---|---|---|
| **Between paragraphs** | 16dp | `spacing-4` | Same section, new paragraph |
| **Between subsections** | 24dp | `spacing-5` | Related content groups |
| **Between major sections** | 32–40dp | `spacing-6` | Distinct topic areas |
| **Between page sections (web)** | 48–64dp | `spacing-7/8` | Hero, features, CTA blocks |
| **Screen top padding (mobile)** | 16dp | `spacing-4` | Below app bar |
| **Screen bottom padding (mobile)** | 16dp + nav height | `spacing-4` + inset | Above bottom nav |
| **Card internal padding** | 16dp | `spacing-4` | Standard card |
| **Card internal padding (compact)** | 12dp | `spacing-3` | Dense card |
| **List section header** | 8dp top, 4dp bottom | | Above section label |

#### Content Hierarchy Spacing (Proximity Principle)

The spacing between a label and its content must be **smaller** than the spacing between separate groups — related items are closer together.

```
Section Header
↕ 4dp   ← tight: header belongs to the content below it
Content Item 1
↕ 8dp   ← medium: items within the same group
Content Item 2
↕ 8dp
Content Item 3
↕ 24dp  ← large: separates this group from the next
Section Header
↕ 4dp
Content Item 4
```

**Spacing applied to a typical screen:**

```
Screen top edge
  ↕ 16dp  (screen top padding)
Page Title (Headline Large)
  ↕ 4dp   (title to subtitle — tight, they're related)
Subtitle (Title Medium)
  ↕ 24dp  (title block to first content section)
Section Label (Label Large, uppercase)
  ↕ 8dp   (label to its content)
Card 1
  ↕ 8dp   (between cards in same section)
Card 2
  ↕ 32dp  (between sections)
Section Label
  ↕ 8dp
List Item 1
  ↕ 0dp   (list items use internal dividers, not margin)
List Item 2
  ↕ 16dp  (screen bottom padding)
Screen bottom edge (+ nav bar inset)
```

#### Dividers vs Spacing

| Use Divider | Use Spacing Only |
|---|---|
| Dense lists where visual separation aids scanning | Cards (elevation provides separation) |
| Table rows | Sections with clear headers |
| Settings groups | Feed items |
| When items have no visual container | When items have distinct backgrounds |

```css
/* Inset divider — aligns with text, not leading icon */
.list-divider {
  height: 1px;
  background-color: var(--md-sys-color-outline-variant);
  margin-inline-start: 56px; /* 40dp icon + 16dp gap */
}
```

---

### 17.13 Readability & Typography Checklist

**Line Length & Line Height**
- [ ] Body text containers have `max-width: 75ch` (or equivalent)
- [ ] No body text container narrower than `45ch`
- [ ] Body line height ≥ 1.4 (WCAG 1.4.8)
- [ ] Display/Headline line height between 1.1–1.33
- [ ] Line height uses unitless ratio, not fixed px

**Letter Spacing**
- [ ] Display text (>36sp) has zero or negative tracking
- [ ] Small text (<14sp) has positive tracking (+0.03–0.05em)
- [ ] All-caps text has tracking ≥ +0.08em
- [ ] Tracking not used to justify text

**Font Rendering**
- [ ] `-webkit-font-smoothing: antialiased` applied globally
- [ ] `-moz-osx-font-smoothing: grayscale` applied globally
- [ ] `text-rendering: optimizeLegibility` on body and headline text
- [ ] Dark mode uses `antialiased` (not `auto`)

**Font Loading**
- [ ] `<link rel="preconnect">` to `fonts.googleapis.com` and `fonts.gstatic.com`
- [ ] Critical font weight preloaded with `<link rel="preload">`
- [ ] `font-display: swap` on all text fonts
- [ ] `font-display: block` on icon fonts only
- [ ] Font subsetted to needed character ranges

**Variable Fonts**
- [ ] Variable font used when loading 3+ weights
- [ ] `opsz` axis set to match font size context
- [ ] `GRAD` axis reduced by ~25 in dark mode
- [ ] Static font fallback provided for unsupported browsers

**Typeface Selection**
- [ ] Roboto (not Product Sans) used for Material Design implementations
- [ ] Product Sans not used for any UI text
- [ ] System font stack includes platform fallbacks (`-apple-system`, `Segoe UI`)
- [ ] Roboto Mono used for code and data requiring alignment

**Truncation**
- [ ] Single-line truncation uses CSS ellipsis pattern
- [ ] Multi-line truncation uses `-webkit-line-clamp`
- [ ] Every truncated element has a tooltip with full content
- [ ] Tooltip only added when truncation actually occurs (JS `scrollWidth` check)
- [ ] File paths use middle truncation, not end truncation

**Context-Specific**
- [ ] Card descriptions clamped to 2–3 lines
- [ ] Dialog body text never clamped (scrolls instead)
- [ ] Dense table uses Body Small (12sp) with 1.33 line height
- [ ] Table headers use Label Medium (12sp/500) in `on-surface-variant`

**RTL / Bidirectional**
- [ ] All spacing uses logical properties (`margin-inline-start`, not `margin-left`)
- [ ] All text alignment uses `text-align: start` (not `text-align: left`)
- [ ] `dir` attribute set on `<html>` element
- [ ] Directional icons (arrows, send) mirror in RTL
- [ ] Non-directional icons (play, settings) do NOT mirror
- [ ] URLs and code snippets wrapped in `dir="ltr"`

**Number Formatting**
- [ ] Data table number columns use `font-variant-numeric: tabular-nums`
- [ ] Number formatting uses `Intl.NumberFormat` (not hardcoded)
- [ ] Currency formatting is locale-aware
- [ ] Compact notation used for large counts (not financial data)
- [ ] Ordinal numbers use `Intl.PluralRules`

**Spacing**
- [ ] All spacing values on 8dp grid
- [ ] Paragraph spacing uses `margin-block-start` (not `margin-top`)
- [ ] Related items closer together than unrelated items (proximity principle)
- [ ] Section labels have tighter spacing to their content than to preceding content

---

## 18. Icon System & Material Symbols

### 18.1 Material Symbols vs Material Icons

Material Symbols (launched 2022) replaces the older Material Icons library. They are not interchangeable — they are fundamentally different technologies.

| Dimension | Material Icons (legacy) | Material Symbols (current) |
|---|---|---|
| **Technology** | Static SVG / PNG sprite | Variable font (single `.woff2` file) |
| **File size** | ~1.3MB for full set (SVG sprite) | ~400KB for full variable font |
| **Customization** | Fixed style only | 4 axes: Fill, Weight, Grade, Optical Size |
| **Styles** | Outlined, Rounded, Sharp, Two-tone, Filled (5 separate fonts) | All styles from one font via `FILL` axis |
| **Icon count** | ~2,500 | 3,000+ (superset) |
| **Rendering** | Raster at fixed sizes | Vector, crisp at any size |
| **Animation** | Not supported natively | Axis transitions animatable via CSS/JS |
| **Maintenance** | Frozen (no new icons) | Actively maintained |
| **CDN import** | `fonts.googleapis.com/icon` | `fonts.googleapis.com/css2?family=Material+Symbols+Outlined` |

**Migration guide — Material Icons → Material Symbols:**

```html
<!-- BEFORE: Material Icons (legacy) -->
<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
<span class="material-icons">home</span>

<!-- AFTER: Material Symbols -->
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet">
<span class="material-symbols-outlined">home</span>
```

```css
/* AFTER: configure variable font defaults */
.material-symbols-outlined {
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
}
```

**Migration checklist:**
- [ ] Replace `material-icons` class with `material-symbols-outlined` (or rounded/sharp)
- [ ] Update CDN link to Material Symbols endpoint with axis ranges declared
- [ ] Remove per-style font imports (no more `Material+Icons+Round` etc.)
- [ ] Audit icon names — ~80 icons were renamed; check the [migration map](https://fonts.google.com/icons)
- [ ] Replace filled icons (`home` in filled font) with `FILL=1` axis setting
- [ ] Set `font-variation-settings` defaults in CSS to match previous visual weight
- [ ] Test at all sizes — Symbols render sharper at small sizes due to optical size axis

---

### 18.2 The Four Icon Styles

All four styles are available in Material Symbols via the font family name. Choose one style per product and apply it consistently.

| Style | Visual Character | Best For | Avoid When |
|---|---|---|---|
| **Outlined** | Thin strokes, open forms, no fill | Default for most products; clean, modern, neutral | Dense UIs where thin strokes disappear at small sizes |
| **Rounded** | Rounded terminals and corners | Consumer apps, friendly/warm tone (YouTube, Photos, Fit) | Productivity/enterprise tools where precision matters |
| **Sharp** | Square terminals, angular corners | Enterprise, data-dense, technical tools (Sheets, Cloud Console) | Consumer apps where warmth is needed |
| **Two-tone** | Filled with 2-tone opacity layering | Illustration-heavy contexts, marketing, onboarding | Navigation bars, toolbars (too decorative for functional UI) |

```html
<!-- One font family per style — pick one per product -->
<span class="material-symbols-outlined">settings</span>
<span class="material-symbols-rounded">settings</span>
<span class="material-symbols-sharp">settings</span>
```

**Style consistency rule:** Never mix Outlined and Rounded icons on the same screen. Pick one style for the entire product and encode it as a design token or CSS class default.

**Two-tone exception:** Two-tone is acceptable as a standalone illustration element (e.g., empty state artwork) even in a product that uses Outlined for functional icons, because it serves a decorative rather than functional role.

---

### 18.3 Variable Font Axes

Material Symbols exposes four axes that can be set independently or animated.

#### Fill (FILL): 0–1

Controls whether the icon is outlined (0) or filled (1). Fractional values produce a partially filled state.

| Value | Appearance | Use Case |
|---|---|---|
| `0` | Outlined (strokes only) | Default / inactive state |
| `1` | Filled (solid) | Active / selected state |
| `0→1` animated | Fill transition | State change feedback (e.g., bookmark saved) |

```css
/* Inactive nav item */
.nav-icon { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }

/* Active nav item */
.nav-icon--active { font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24; }

/* Animated fill on toggle */
.nav-icon { transition: font-variation-settings 200ms cubic-bezier(0.2, 0, 0, 1); }
```

#### Weight (wght): 100–700

Controls stroke thickness. Maps to the same scale as font weight.

| Value | Stroke | Use Case |
|---|---|---|
| `100` | Hairline | Large display icons, decorative |
| `200` | Thin | Large icons (40dp+) |
| `300` | Light | Subtle secondary icons |
| `400` | Regular | **Default — use for all standard UI** |
| `500` | Medium | Slightly bolder emphasis |
| `600` | Semi-bold | High-contrast needs |
| `700` | Bold | Small icons (20dp) where strokes would be too thin at 400 |

**Rule:** Match icon weight to the adjacent text weight. If a label uses `font-weight: 500`, use `wght: 500` on its icon.

#### Grade (GRAD): −25 to 200

Fine-tunes visual weight without changing stroke width. Affects perceived heaviness.

| Value | Effect | Use Case |
|---|---|---|
| `-25` | Lighter, reduced emphasis | Dark mode (prevents blooming on dark backgrounds) |
| `0` | **Default** | Light mode standard |
| `200` | Heavier, high emphasis | High-contrast mode, accessibility needs |

```css
/* Dark mode: reduce grade to compensate for light-on-dark blooming */
@media (prefers-color-scheme: dark) {
  .icon { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' -25, 'opsz' 24; }
}

/* High contrast mode */
@media (forced-colors: active) {
  .icon { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 200, 'opsz' 24; }
}
```

#### Optical Size (opsz): 20–48

Adjusts stroke contrast and detail for the rendered size. **Always match opsz to the icon's rendered dp size.**

| Value | Rendered Size | Behavior |
|---|---|---|
| `20` | 20dp | Simplified forms, heavier strokes — legible at small size |
| `24` | 24dp | **Default — standard UI icons** |
| `40` | 40dp | More detail, finer strokes |
| `48` | 48dp | Maximum detail, thinnest strokes |

```css
/* Always pair opsz with the actual rendered size */
.icon-20 { font-size: 20px; font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20; }
.icon-24 { font-size: 24px; font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
.icon-40 { font-size: 40px; font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 40; }
.icon-48 { font-size: 48px; font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 48; }
```

**Axis combination reference:**

| Context | FILL | wght | GRAD | opsz |
|---|---|---|---|---|
| Standard UI, light mode | 0 | 400 | 0 | 24 |
| Standard UI, dark mode | 0 | 400 | -25 | 24 |
| Active/selected state | 1 | 400 | 0 | 24 |
| Dense toolbar (20dp) | 0 | 500 | 0 | 20 |
| Large display (48dp) | 0 | 300 | 0 | 48 |
| High contrast | 0 | 400 | 200 | 24 |

---

### 18.4 Icon Sizing Rules

Material Design defines four canonical icon sizes. Use only these sizes — never arbitrary values.

| Size | dp | Use Case | opsz | Touch Target |
|---|---|---|---|---|
| **Dense** | 20dp | Compact toolbars, dense lists, chips, inline text | 20 | 48dp (invisible padding) |
| **Standard** | 24dp | Navigation bars, app bars, list items, buttons | 24 | 48dp (invisible padding) |
| **Large** | 40dp | Empty states, feature illustrations, avatar placeholders | 40 | 48dp (if interactive) |
| **Display** | 48dp | Onboarding, hero sections, product icons | 48 | 48dp (if interactive) |

```xml
<!-- Android: always set both width/height and tint -->
<ImageView
    android:layout_width="24dp"
    android:layout_height="24dp"
    android:padding="12dp"  <!-- pads touch target to 48dp -->
    app:srcCompat="@drawable/ic_home"
    app:tint="?attr/colorOnSurfaceVariant" />
```

```css
/* Web: use padding to reach 48dp touch target without changing visual size */
.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;        /* 48dp touch target */
  font-size: 24px;     /* 24dp visual icon */
}
```

**Sizing rules:**
- Never scale icons with `transform: scale()` — use `font-size` or `width/height` so opsz can be set correctly
- Never use fractional dp values (e.g., 22dp, 36dp) — stick to the four canonical sizes
- In a list item with 24dp icon and 16sp body text, the icon and text baseline should align to the same optical center, not the same baseline
- On Android, use `wrap_content` with explicit `layout_width`/`layout_height` in dp, not `match_parent`

---


---

## 19. Data Visualization & Charts

> Charts are UI. Every axis label, grid line, tooltip, and color choice is a design decision that affects comprehension, accessibility, and trust.

---

### 19.1 Chart Type Selection Guide

**Decision Tree: Which chart type?**

```
What is the primary question the user is asking?
├── "How does X change over time?" → Line chart
│   └── Discrete categories over time? → Bar chart (grouped/stacked)
├── "How do values compare?" 
│   ├── Few categories (≤7)? → Bar chart (horizontal preferred for labels)
│   └── Many categories (8+)? → Horizontal bar, sorted descending
├── "What is the part-to-whole relationship?"
│   ├── ≤5 parts, sum = 100%? → Pie / Donut chart
│   └── >5 parts or nested hierarchy? → Treemap
├── "Is there a correlation between two variables?" → Scatter plot
│   └── Third variable to encode? → Bubble chart (size = third var)
├── "Where are the patterns across two dimensions?" → Heatmap
│   └── Geographic dimension? → Choropleth map
└── "What is the distribution of values?" → Histogram or Box plot
```

| Chart Type | Best For | Max Data Points | Avoid When |
|---|---|---|---|
| **Line** | Trends over continuous time | 5 series × unlimited points | Data is not continuous; categories are unordered |
| **Bar (vertical)** | Comparing values, short labels | 12 bars | Labels are long (>10 chars); many categories |
| **Bar (horizontal)** | Comparing values, long labels | 20 bars | Time series data |
| **Stacked bar** | Part-to-whole + comparison | 5 segments × 10 bars | >5 segments (impossible to read middle segments) |
| **Pie / Donut** | Part-to-whole, single moment | 5 slices | Comparing across multiple pies; >5 slices |
| **Scatter** | Correlation, outlier detection | 500 points | Overplotting (use hexbin instead) |
| **Heatmap** | Patterns across two categorical axes | 20×20 cells | Sparse data (mostly empty cells) |
| **Treemap** | Hierarchical part-to-whole | 50 leaves | Deep hierarchy (>3 levels); equal-sized values |
| **Sparkline** | Trend at a glance, inline context | 1 series × 30 points | Precise value reading required |

**Anti-patterns to avoid:**
- 3D charts — distort perception of values, never use
- Dual Y-axes — imply false correlation; use two separate charts
- Pie charts with >5 slices — use a bar chart instead
- Truncated Y-axis starting above zero — misleads magnitude perception (only acceptable for line charts showing small variance in large values, with explicit disclosure)

---

### 18.8 Custom Icon Creation

When Material Symbols doesn't have the icon you need, create custom icons that match the system.

#### The 24dp Grid System

All Material icons are designed on a 24×24dp grid with a defined safe zone and keyline shapes.

```
┌────────────────────────┐  24dp × 24dp canvas
│  2dp  │            │  2dp  │
│       ┌────────────┐       │  ← 2dp trim area (do not place strokes here)
│       │            │       │
│       │  20dp live │       │  ← 20dp × 20dp live area
│       │    area    │       │
│       └────────────┘       │
│  2dp  │            │  2dp  │
└────────────────────────┘
```

**Keyline shapes** — use these as the outer boundary of icon content to ensure consistent optical weight across the icon set:

| Shape | Dimensions | Use For |
|---|---|---|
| **Square** | 18×18dp | Square or boxy subjects |
| **Circle** | 20dp diameter | Round subjects |
| **Vertical rectangle** | 14×20dp | Tall, narrow subjects |
| **Horizontal rectangle** | 20×14dp | Wide, short subjects |

**Stroke specifications (Outlined style, 24dp):**

| Property | Value |
|---|---|
| Stroke width | 2dp |
| Corner radius (rounded terminals) | 1dp (Outlined), 2dp (Rounded) |
| Minimum gap between strokes | 2dp |
| Minimum enclosed area | 4×4dp |

#### Optical Corrections

Geometric precision ≠ optical balance. Apply these corrections:

| Issue | Geometric | Optically Corrected |
|---|---|---|
| **Circle vs square same size** | Both 18dp | Circle at 20dp (circles look smaller) |
| **Vertical vs horizontal stroke** | Both 2dp | Vertical at 1.8dp (verticals look heavier) |
| **Pointed top (triangle)** | Apex at y=2dp | Apex at y=1dp (points look lower than they are) |
| **Diagonal stroke** | 2dp | 2.2dp (diagonals look thinner) |
| **Centered text/number in icon** | Mathematically centered | Shifted 0.5dp up (optical center is above geometric center) |

#### Custom Icon Checklist

- [ ] Designed on 24×24dp grid with 2dp trim area respected
- [ ] Uses correct keyline shape as outer boundary
- [ ] Stroke width is 2dp (Outlined) or filled (Filled)
- [ ] Corner radii match the chosen style (Outlined: 1dp, Rounded: 2dp, Sharp: 0dp)
- [ ] Optical corrections applied (circles slightly larger, diagonals slightly heavier)
- [ ] Tested at 20dp, 24dp, 40dp, 48dp sizes
- [ ] Tested with `FILL` axis at 0 and 1 (if variable font version needed)
- [ ] Exported as SVG with no raster effects, no clipping masks, paths only
- [ ] Reviewed alongside 5 adjacent Material Symbols icons for visual consistency
- [ ] Named following Material Symbols naming convention (`snake_case`, descriptive noun)

---

### 18.9 Icon Accessibility

#### Decorative vs Functional Icons

| Icon Type | Definition | Implementation |
|---|---|---|
| **Decorative** | Purely visual; adjacent text conveys the same meaning | `aria-hidden="true"` |
| **Functional (labeled)** | Has an adjacent visible label | `aria-hidden="true"` on icon; label provides the accessible name |
| **Functional (standalone)** | No visible label; icon is the only affordance | `aria-label="[action]"` on the interactive element; `aria-hidden="true"` on icon itself |
| **Informational** | Conveys status/meaning without being interactive | `role="img"` + `aria-label="[meaning]"` |

```html
<!-- Decorative: icon alongside text label -->
<button>
  <span class="material-symbols-outlined" aria-hidden="true">send</span>
  Send
</button>

<!-- Standalone icon button: label on the button, not the icon -->
<button aria-label="Send message">
  <span class="material-symbols-outlined" aria-hidden="true">send</span>
</button>

<!-- Informational status icon -->
<span role="img" aria-label="Warning: storage almost full">
  <span class="material-symbols-outlined" aria-hidden="true">warning</span>
</span>

<!-- Icon in nav item -->
<a href="/home" aria-label="Home" aria-current="page">
  <span class="material-symbols-outlined" aria-hidden="true">home</span>
  <span class="nav-label">Home</span>  <!-- visible label; aria-label on <a> is redundant here -->
</a>
```

**Accessible name rules:**
- The accessible name of a standalone icon button must describe the **action**, not the icon: `aria-label="Delete message"`, not `aria-label="Trash icon"`
- For toggle icon buttons, update `aria-label` or `aria-pressed` to reflect the current state: `aria-label="Unmute"` when muted, `aria-label="Mute"` when active
- For animated icon state changes, use `aria-live="polite"` on a visually hidden status element to announce the new state to screen readers

```html
<!-- Toggle button with state-aware aria -->
<button
  aria-label="Bookmark this page"
  aria-pressed="false"
  class="icon-btn"
  onclick="toggleBookmark(this)">
  <span class="material-symbols-outlined" aria-hidden="true">bookmark</span>
</button>

<script>
function toggleBookmark(btn) {
  const pressed = btn.getAttribute('aria-pressed') === 'true';
  btn.setAttribute('aria-pressed', String(!pressed));
  btn.setAttribute('aria-label', pressed ? 'Bookmark this page' : 'Remove bookmark');
}
</script>
```

**Focus indicator:** Icon buttons must have a visible focus ring. Material Design uses a 3dp `outline` in `secondary` color role, offset 2dp from the element boundary.

```css
.icon-btn:focus-visible {
  outline: 3px solid var(--md-sys-color-secondary);
  outline-offset: 2px;
  border-radius: 50%;
}
```

**Accessibility checklist for icons:**
- [ ] All decorative icons have `aria-hidden="true"`
- [ ] All standalone icon buttons have a descriptive `aria-label`
- [ ] Toggle icons update `aria-label` or `aria-pressed` on state change
- [ ] Icon color meets 3:1 contrast ratio against background
- [ ] Icon buttons have 48×48dp touch/click target
- [ ] Focus indicator is visible and meets 3:1 contrast
- [ ] Icon meaning is never conveyed by color alone

---

### 18.10 Icon Usage by Component Context

#### Buttons

| Button Type | Icon Position | Icon Size | Icon Color | Notes |
|---|---|---|---|---|
| **Filled button** | Leading (left in LTR) | 18dp | `on-primary` | Gap: 8dp; left padding reduces from 24dp to 16dp |
| **Filled tonal button** | Leading | 18dp | `on-secondary-container` | Same padding adjustment |
| **Outlined button** | Leading | 18dp | `primary` | Same padding adjustment |
| **Text button** | Leading | 18dp | `primary` | Left padding: 12dp with icon |
| **Icon button (standard)** | Center | 24dp | `on-surface-variant` | 48dp container, no label |
| **Icon button (filled)** | Center | 24dp | `on-primary` | 40dp filled container |
| **Icon button (tonal)** | Center | 24dp | `on-secondary-container` | 40dp tonal container |
| **FAB** | Center | 24dp | `on-primary-container` | 56dp container |
| **Extended FAB** | Leading | 24dp | `on-primary-container` | Gap: 12dp to label |

**Button icon rules:**
- Use 18dp icons in labeled buttons (not 24dp) — the label provides the primary affordance; the icon is supplementary
- Never use two icons in a single button
- Trailing icons are reserved for dropdown/expand affordances (chevron) only
- Icon-only buttons must always have a tooltip on hover/focus

#### Navigation Bar (Bottom Nav)

| Property | Specification |
|---|---|
| Icon size | 24dp |
| Active icon | `FILL: 1`, color: `on-secondary-container` |
| Inactive icon | `FILL: 0`, color: `on-surface-variant` |
| Active indicator | Pill, 64dp wide × 32dp tall, color: `secondary-container` |
| Icon position | Centered within active indicator pill |
| Label | Always visible, Label Small (11sp), same color as icon |
| Badge position | Top-right of icon, outside active indicator |

```css
.nav-item__icon {
  font-size: 24px;
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
  color: var(--md-sys-color-on-surface-variant);
  transition: font-variation-settings 200ms cubic-bezier(0.2, 0, 0, 1),
              color 200ms;
}
.nav-item--active .nav-item__icon {
  font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;
  color: var(--md-sys-color-on-secondary-container);
}
```

#### Chips

| Chip Type | Icon Size | Icon Position | Icon Color |
|---|---|---|---|
| **Filter chip** | 18dp | Leading | `on-surface-variant`; `primary` when selected |
| **Input chip** | 18dp avatar or icon | Leading | `on-surface-variant` |
| **Suggestion chip** | 18dp | Leading (optional) | `primary` |
| **Assist chip** | 18dp | Leading (required) | `primary` |

**Chip icon rules:**
- Chip icons are always 18dp — never 24dp (chips are compact components)
- The trailing `×` dismiss icon on input chips is always 18dp, color `on-surface-variant`
- Never use an icon as the only content in a chip — chips always have a label

#### List Items

| List Item Type | Leading Icon Size | Leading Icon Color | Trailing Icon Size | Trailing Icon Color |
|---|---|---|---|---|
| **1-line** | 24dp | `on-surface-variant` | 24dp | `on-surface-variant` |
| **2-line** | 24dp | `on-surface-variant` | 24dp | `on-surface-variant` |
| **3-line** | 24dp, top-aligned | `on-surface-variant` | 24dp, top-aligned | `on-surface-variant` |

**List item icon rules:**
- Leading icon aligns to the vertical center of the first line of text (not the entire item) for 2- and 3-line items
- Trailing icons that are interactive (e.g., overflow menu `more_vert`) must have their own 48dp touch target, separate from the list item's tap target
- Never use a leading icon and a leading avatar in the same list — pick one
- Trailing `chevron_right` indicates navigation to a sub-screen; trailing `open_in_new` indicates external link

---

### 18.11 Badge on Icon

Badges communicate unread counts or status on top of icons, most commonly in navigation.

#### Badge Types

| Type | Appearance | When to Use |
|---|---|---|
| **Dot badge** | 6dp circle, no number | Unread/new content exists; exact count is not important |
| **Single-digit badge** | 16dp pill, 1 digit | Count 1–9 |
| **Multi-digit badge** | 16dp+ pill, 2–4 digits | Count 10–999 |
| **Max count badge** | Pill with `999+` | Count ≥ 1000 |

**Max count display rules:**

| Count | Display |
|---|---|
| 0 | No badge |
| 1–9 | Show exact number |
| 10–99 | Show exact number |
| 100–999 | Show exact number |
| 1000+ | Show `999+` |

#### Badge Positioning

Badges are anchored to the **top-right** of the icon's bounding box, with a 2dp overlap into the icon.

```
┌──────────────────┐
│              ●99+│  ← badge: top-right, 2dp overlap
│   [icon 24dp]    │
│                  │
└──────────────────┘
```

```css
.icon-badge-wrapper {
  position: relative;
  display: inline-flex;
  width: 24px;
  height: 24px;
}

.badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 8px;           /* full pill */
  background: var(--md-sys-color-error);
  color: var(--md-sys-color-on-error);
  font-size: 11px;
  font-weight: 500;
  line-height: 16px;
  text-align: center;
  white-space: nowrap;
}

.badge--dot {
  width: 6px;
  height: 6px;
  min-width: unset;
  padding: 0;
  top: -2px;
  right: -2px;
}
```

#### Badge Color Roles

| Badge Type | Background | Text |
|---|---|---|
| **Notification / unread** | `error` | `on-error` |
| **Status / informational** | `primary` | `on-primary` |
| **Dot (neutral)** | `primary` | N/A |

**Badge rules:**
- Badge color is always `error` for notification counts (matches Android system convention)
- Dot badge uses `primary` when indicating a new feature or non-urgent update; `error` for unread messages
- In bottom navigation, the badge sits outside the active indicator pill — it is never clipped by the pill
- Badge must have an accessible label: the icon button's `aria-label` must include the count: `aria-label="Inbox, 12 unread messages"`
- When count changes, update `aria-label` and use `aria-live="polite"` on the badge element so screen readers announce the change
- Never show a badge count above the fold if the count is stale — always reflect real-time data or clearly indicate "last updated"

```html
<!-- Accessible badge implementation -->
<button aria-label="Inbox, 12 unread messages" class="nav-btn">
  <span class="icon-badge-wrapper">
    <span class="material-symbols-outlined" aria-hidden="true">mail</span>
    <span class="badge" aria-live="polite" aria-atomic="true">12</span>
  </span>
  <span class="nav-label">Mail</span>
</button>
```

#### Badge in Navigation Bar — Full Spec

| Property | Dot Badge | Numeric Badge |
|---|---|---|
| Size | 6dp diameter | 16dp height, min 16dp width |
| Position | 2dp from top-right of icon | 4dp above, 4dp right of icon top-right corner |
| Background | `error` or `primary` | `error` |
| Text style | N/A | Label Small (11sp, Medium 500) |
| Max width | N/A | Grows with content; `999+` is maximum string |
| Border | 2dp `surface` color border (prevents blending with icon) | 2dp `surface` color border |

---

### 18.12 Icon System Checklist

**Library & Setup**
- [ ] Using Material Symbols (not legacy Material Icons)
- [ ] Variable font loaded with full axis ranges: `opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200`
- [ ] One icon style chosen for the product (Outlined / Rounded / Sharp) and applied consistently
- [ ] CSS defaults set for `font-variation-settings` matching the product's design language
- [ ] Dark mode applies `GRAD: -25` to all icons

**Sizing & Color**
- [ ] Only canonical sizes used: 20dp, 24dp, 40dp, 48dp
- [ ] `opsz` axis always matches rendered size
- [ ] Inactive icons use `on-surface-variant`; active icons use `on-secondary-container`
- [ ] Icon color meets 3:1 contrast against background
- [ ] Disabled icons use `on-surface` at 38% opacity

**Labels**
- [ ] Bottom nav and tabs always show visible labels
- [ ] Icon-only buttons have tooltip on hover/focus
- [ ] Icon and label share the same color role
- [ ] Icon–label gap follows context spec (4dp nav, 8dp button, 16dp list)

**Animation**
- [ ] State transitions use `FILL` axis animation (not icon swap) where possible
- [ ] All icon animations respect `prefers-reduced-motion`
- [ ] Transition durations use M3 duration tokens (150–300ms for icon transitions)

**Accessibility**
- [ ] Decorative icons have `aria-hidden="true"`
- [ ] Standalone icon buttons have descriptive `aria-label`
- [ ] Toggle icons update `aria-label` or `aria-pressed` on state change
- [ ] All icon buttons have 48×48dp touch target
- [ ] Focus ring visible and meets 3:1 contrast

**Badges**
- [ ] Dot badge used when count is irrelevant; numeric badge when count matters
- [ ] Count displays `999+` for values ≥ 1000
- [ ] Badge `aria-label` on parent button includes count
- [ ] Badge has 2dp `surface`-colored border to separate from icon


### 19.2 Data Visualization Color Palettes

Material Design defines three palette types for data visualization:

| Palette Type | Use Case | Color Count | Example |
|---|---|---|---|
| **Categorical** | Distinct categories with no order | 8–12 | Product lines, regions, user segments |
| **Sequential (ordered)** | Ordered data from low to high | 5–9 steps | Revenue growth, temperature, progress |
| **Diverging** | Data with a meaningful midpoint | 7–11 steps | Sentiment (-100 to +100), change (loss to gain) |

**Google Charts Categorical Palette (Material Design):**

```
Primary series:
#1A73E8 (Google Blue)    — Series 1
#E37400 (Orange)         — Series 2
#12B347 (Green)          — Series 3
#B80672 (Magenta)        — Series 4
#F538A0 (Pink)           — Series 5
#9334E6 (Purple)         — Series 6
#01A299 (Teal)           — Series 7
#EA8600 (Amber)          — Series 8
```

**Sequential Palette (Blue, low to high):**

```
#E8F0FE (Lightest)
#D2E3FC
#AECBFA
#8AB4F8
#669DF6
#4285F4
#1967D2
#185ABC (Darkest)
```

**Diverging Palette (Red ← Neutral → Green):**

```
#D93025 (Strong negative)
#EA4335 (Negative)
#F28B82 (Weak negative)
#F8F9FA (Neutral)
#81C995 (Weak positive)
#34A853 (Positive)
#1E8E3E (Strong positive)
```

**Color palette rules:**
- Always test palettes for color blindness (deuteranopia, protanopia, tritanopia)
- Categorical colors must have ≥3:1 contrast ratio against background
- Never rely on color alone — use patterns, labels, or shapes as secondary encoding
- In dark mode, reduce saturation by 20–30% to prevent eye strain
- For >8 categories, use patterns/textures in addition to color

**Accessible color combinations (WCAG AA compliant):**

| Background | Safe Text Colors | Safe Chart Colors |
|---|---|---|
| `#FFFFFF` (white) | Any tone ≤60 | Any tone ≤70 |
| `#F8F9FA` (surface light) | Any tone ≤60 | Any tone ≤70 |
| `#202124` (surface dark) | Any tone ≥80 | Any tone ≥70 |


### 19.3 Accessibility in Charts

Charts must be perceivable and operable without relying on color or vision alone.

**Pattern/Texture Library for Color-Blind Users:**

```
Series 1: Solid fill          ████
Series 2: Diagonal lines      ////
Series 3: Cross-hatch         ####
Series 4: Dots                ....
Series 5: Horizontal lines    ════
Series 6: Vertical lines      ||||
Series 7: Zigzag              ^^^^
Series 8: Sparse dots         . . 
```

Apply via SVG `<pattern>` elements or Canvas fill patterns — never CSS background-image alone (Canvas ignores it).

**ARIA Markup Pattern:**

```html
<!-- Chart container -->
<figure role="img" aria-labelledby="chart-title" aria-describedby="chart-desc">
  <figcaption id="chart-title">Monthly Revenue Q1 2025</figcaption>
  <p id="chart-desc" class="sr-only">
    Bar chart showing revenue from January to March 2025.
    January: $1.2M, February: $1.5M, March: $1.8M.
    Overall trend is increasing.
  </p>
  <canvas aria-hidden="true"></canvas>
</figure>
```

**Interactive chart ARIA:**

```html
<!-- Individual data points -->
<g role="listitem"
   aria-label="February: $1.5M, up 25% from January"
   tabindex="0"
   focusable="true">
  <rect .../>
</g>
```

**Data Table Fallback (always provide):**

Every chart must have an accessible data table. Show it by default on mobile or via a toggle:

```html
<details>
  <summary>View data table</summary>
  <table>
    <caption>Monthly Revenue Q1 2025</caption>
    <thead>
      <tr><th scope="col">Month</th><th scope="col">Revenue</th><th scope="col">Change</th></tr>
    </thead>
    <tbody>
      <tr><td>January</td><td>$1.2M</td><td>—</td></tr>
      <tr><td>February</td><td>$1.5M</td><td>+25%</td></tr>
      <tr><td>March</td><td>$1.8M</td><td>+20%</td></tr>
    </tbody>
  </table>
</details>
```

**Accessibility checklist for charts:**
- [ ] Chart has a descriptive `aria-label` or `aria-labelledby` title
- [ ] Summary description conveys the key insight (not just "a bar chart")
- [ ] Data table fallback is available and keyboard-accessible
- [ ] Individual data points are focusable via keyboard (Tab/arrow keys)
- [ ] Focused data point announces value, label, and context to screen reader
- [ ] Color is not the only differentiator (patterns, labels, or shapes also used)
- [ ] All text in chart meets 4.5:1 contrast ratio
- [ ] Interactive elements have 48×48dp touch targets
- [ ] Chart is not conveyed via image alone (no `<img src="chart.png">` without full data table)

---

### 25.10 Brand Consistency Across Products

Google operates 50+ products. Brand consistency is maintained through a **shared foundation with product-specific expression** — not rigid uniformity.

**The three-layer model:**

```
Layer 1: Universal Brand (never changes)
    → Four brand colors, Google logo, brand voice, Google Sans
Layer 2: Material Design System (shared components)
    → Color roles, type scale, spacing, motion, components
Layer 3: Product Identity (product-specific)
    → Product accent color, product icon, product-specific patterns
```

**Shared elements across all Google products:**

| Element | Specification |
|---|---|
| Google account avatar | Circular, 40dp, top-right of app bar |
| Google account sign-in button | See §25.11 |
| "G" logo in product headers | 24dp, full-color, links to google.com |
| Error page illustration style | Matches §25.6 illustration system |
| Notification format | Product icon + title + body; Material notification spec |
| Settings screen structure | Grouped list; search at top; account section first |

**Product-specific adaptations — examples:**

| Product | Accent Color | Unique Pattern | Shared Foundation |
|---|---|---|---|
| **Gmail** | Red `#EA4335` | Conversation threading, label chips | M3 navigation, search bar |
| **Google Maps** | Blue `#4285F4` | Bottom sheet info panels, map overlays | M3 FAB, search bar |
| **YouTube** | Red `#FF0000` | Video player controls, thumbnail grid | M3 bottom nav |
| **Google Drive** | Blue `#4285F4` | File type color coding, grid/list toggle | M3 FAB, navigation drawer |
| **Google Photos** | Multicolor | Memory animations, album art generation | M3 bottom nav, search |
| **Google Calendar** | Blue `#4285F4` | Time-grid view, event color coding | M3 FAB, navigation drawer |
| **Gemini** | Blue-Purple gradient | Streaming response UI, prompt chips | M3 text field, navigation |

**Brand consistency checklist:**
- [ ] Google account avatar is circular, 40dp, top-right
- [ ] Product uses Google Sans for headlines, Roboto for body
- [ ] Navigation pattern matches platform convention (§5.1)
- [ ] Settings screen follows standard Google settings structure
- [ ] Error states use the illustration style from §25.6
- [ ] Voice and tone match §25.7 guidelines

---

### 25.11 Third-Party Brand Integration

When Google's brand appears in third-party contexts (sign-in buttons, OAuth flows, API integrations), strict rules apply to protect both Google's brand and user trust.

**Google Sign-In button — exact specifications:**

| Property | Standard | Icon-only |
|---|---|---|
| Height | 40dp / 40px | 40dp / 40px |
| Min width | 120dp | 40dp |
| Corner radius | 4dp | 4dp |
| Background (light) | `#FFFFFF` | `#FFFFFF` |
| Background (dark) | `#131314` | `#131314` |
| Border (light) | 1dp, `#747775` | 1dp, `#747775` |
| Border (dark) | 1dp, `#8E918F` | 1dp, `#8E918F` |
| Google "G" icon | 20×20dp, left-aligned, 12dp from left edge | Centered |
| Label text | "Sign in with Google" | — |
| Label font | Roboto Medium, 14sp | — |
| Label color (light) | `#1F1F1F` | — |
| Label color (dark) | `#E3E3E3` | — |
| Icon-to-label gap | 12dp | — |

**Button states:**

| State | Light background | Dark background |
|---|---|---|
| Default | `#FFFFFF` fill, `#747775` border | `#131314` fill, `#8E918F` border |
| Hover | `#F2F2F2` fill | `#1A1A1A` fill |
| Pressed | `#E8E8E8` fill | `#212121` fill |
| Focused | `#FFFFFF` fill + 3dp `#4285F4` focus ring | `#131314` fill + 3dp `#4285F4` focus ring |
| Disabled | 38% opacity | 38% opacity |

```html
<!-- Correct Google Sign-In button structure -->
<button class="gsi-button" type="button">
  <div class="gsi-button-icon">
    <!-- Official Google G SVG — do not substitute -->
  </div>
  <span class="gsi-button-label">Sign in with Google</span>
</button>
```

**OAuth branding rules for third parties:**

| Rule | Detail |
|---|---|
| **Use the official button** | Never create a custom "Sign in with Google" button from scratch |
| **No logo modification** | The "G" icon in the button must be the official SVG; never recreate it |
| **Exact label text** | Use "Sign in with Google" — not "Login with Google", "Connect Google", or "Use Google" |
| **No color changes** | Only the two approved color schemes (light/dark); no brand-color fills |
| **Minimum size** | Never render below 40dp height |
| **Placement** | Must be visually distinct from other sign-in options; equal or greater prominence |
| **No animation** | Do not animate the Google Sign-In button |
| **No rebranding** | Do not place the Google button inside a custom-styled container that obscures its identity |

---

### 25.12 Brand in Dark Mode

Dark mode is not simply an inverted light mode. Google's brand adapts specifically for dark surfaces.

**Logo variants in dark mode:**

| Context | Variant | Specification |
|---|---|---|
| On dark surface (`#121212`–`#1E1E1E`) | White wordmark | `#FFFFFF` fill; no color version |
| On dark surface with sufficient contrast | Full-color wordmark | Only if background is dark enough that all four colors meet 3:1 contrast |
| App icon on dark launcher | Full-color icon | Icons retain full color; Android handles contrast via adaptive icon background |
| Favicon | Full-color "G" | Browsers handle dark mode favicon via `media` attribute |

```html
<!-- Dark mode favicon support -->
<link rel="icon" href="/favicon-light.svg" media="(prefers-color-scheme: light)">
<link rel="icon" href="/favicon-dark.svg"  media="(prefers-color-scheme: dark)">
```

**Brand color adaptations for dark mode:**

The four brand colors are too dark or too saturated for use on dark backgrounds at their base values. Use these adapted values:

| Color | Light mode | Dark mode adapted | Tone |
|---|---|---|---|
| **Blue** | `#4285F4` | `#8AB4F8` | +40 lightness |
| **Red** | `#EA4335` | `#F28B82` | +40 lightness |
| **Yellow** | `#FBBC05` | `#FDD663` | +40 lightness |
| **Green** | `#34A853` | `#81C995` | +40 lightness |

**Material You color role behavior in dark mode (recap):**

| Role | Light tone | Dark tone | Dark mode behavior |
|---|---|---|---|
| `primary` | 40 | 80 | Automatically lightened by HCT system |
| `surface` | 98 | 6 | Near-black background |
| `on-surface` | 10 | 90 | Near-white text |
| `primary-container` | 90 | 30 | Darkened container |

**Dark mode brand checklist:**
- [ ] Google wordmark uses white variant on dark backgrounds
- [ ] Brand colors use dark-mode adapted hex values (not base values)
- [ ] All text meets ≥4.5:1 contrast on dark surfaces
- [ ] Product icon retains full color (not inverted)
- [ ] Google Sign-In button uses the dark variant (`#131314` background)
- [ ] Illustrations use dark-mode adapted palette (light tints become dark tints)
- [ ] Scrim gradients use `rgba(0,0,0,x)` not `rgba(255,255,255,x)` on dark surfaces

---

### 25.13 Brand Expression Checklist

**Color**
- [ ] Brand colors (`#4285F4`, `#EA4335`, `#FBBC05`, `#34A853`) used only in brand/marketing contexts
- [ ] Product UI uses Material You color roles, not hardcoded brand hex values
- [ ] Brand colors never used as body text color (contrast too low)
- [ ] Dark mode uses adapted brand color values

**Logo**
- [ ] Minimum 1× cap-height clear space on all sides
- [ ] Minimum 64px width on digital surfaces
- [ ] No modifications to color, proportion, or letterforms
- [ ] Correct variant used for background (full-color on light; white on dark)

**Icons**
- [ ] Built on 108dp grid with correct keyline shape
- [ ] Long shadow at 135° if used
- [ ] Legible at 18dp minimum

**Typography**
- [ ] Google Sans for headlines and brand surfaces; Roboto for body and third-party
- [ ] Correct fallback stack defined
- [ ] `display=swap` used for web font loading

**Photography & Illustration**
- [ ] No stock photo clichés
- [ ] Diverse representation across all demographic dimensions
- [ ] Illustrations use flat fills, no gradients on characters
- [ ] All six skin tones represented in sets of 6+ characters

**Voice**
- [ ] Sentence case for all UI labels
- [ ] Active voice throughout
- [ ] Error messages follow: what happened + what to do
- [ ] No exclamation marks in error or warning states

**Gradients**
- [ ] Gradients only in approved contexts (icons, scrims, Gemini branding)
- [ ] Maximum 2 color stops outside Gemini branding
- [ ] Text over gradients meets ≥4.5:1 at the lightest point

**White Space**
- [ ] Screen edge margin ≥16dp (mobile), ≥24dp (tablet)
- [ ] Card internal padding ≥16dp
- [ ] No decorative content filling empty states

**Third-Party Integration**
- [ ] Google Sign-In button uses official specs (40dp height, correct colors, exact label)
- [ ] No custom recreation of the "G" icon
- [ ] Button label is exactly "Sign in with Google"

---

### 16.8 Dark Mode SVG Adaptation

SVGs require explicit dark mode handling. Unlike HTML elements that inherit `background-color` and `color` automatically, SVG fills and strokes are hardcoded unless you use the techniques below.

#### Strategy Decision Tree

```
Is the SVG an icon?
├── YES → Use currentColor for all fills/strokes
│         No separate dark variant needed
└── NO (illustration) →
    Does it use only 2–3 colors?
    ├── YES → Use CSS custom properties in the SVG
    │         Single file, CSS switches values
    └── NO (complex, >4 colors) →
        Use separate dark variant file
        Load via <picture> or CSS class swap
```

#### Strategy 1: `currentColor` (Icons)

`currentColor` inherits the CSS `color` property of the SVG's parent element. This is the correct approach for all UI icons.

```html
<!-- SVG uses currentColor — adapts automatically -->
<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
  <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 
       10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
</svg>
```

```css
/* Parent controls the color — dark mode handled automatically */
.icon-button { color: var(--md-sys-color-on-surface); }

@media (prefers-color-scheme: dark) {
  :root { --md-sys-color-on-surface: #E3E3E3; }
}
```

**Rule:** Every icon SVG must use `fill="currentColor"` or `stroke="currentColor"`. Never hardcode `fill="#000000"` or `fill="#FFFFFF"` in icon SVGs.

#### Strategy 2: CSS Custom Properties in SVG (Simple Illustrations)

For illustrations with 2–4 colors, define colors as CSS custom properties inside the SVG's `<style>` block:

```html
<svg viewBox="0 0 200 150" role="img" aria-label="Empty folder">
  <style>
    :root {
      --il-primary: #4285F4;
      --il-secondary: #E8F0FE;
      --il-neutral: #BDC1C6;
      --il-surface: #FFFFFF;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --il-primary: #8AB4F8;
        --il-secondary: #1A237E;
        --il-neutral: #5F6368;
        --il-surface: #202124;
      }
    }
  </style>
  <rect width="200" height="150" fill="var(--il-surface)"/>
  <path fill="var(--il-primary)" d="…"/>
  <path fill="var(--il-secondary)" d="…"/>
  <path fill="var(--il-neutral)" d="…"/>
</svg>
```

**Note:** CSS custom properties inside SVG `<style>` only work for inline SVGs. For `<img>`-embedded SVGs, use Strategy 3.

#### Strategy 3: Separate Dark Variant (Complex Illustrations)

For complex illustrations (>4 colors, gradients, detailed scenes), maintain separate light and dark SVG files and switch between them:

```html
<!-- Using <picture> for automatic switching -->
<picture>
  <source srcset="/illustrations/empty-state-dark.svg" 
          media="(prefers-color-scheme: dark)">
  <img src="/illustrations/empty-state-light.svg" 
       alt="No files yet. Upload your first file to get started."
       width="200" height="150">
</picture>
```

```css
/* CSS class swap (when JS controls theme) */
.illustration { content: url('/illustrations/empty-state-light.svg'); }
[data-theme="dark"] .illustration { 
  content: url('/illustrations/empty-state-dark.svg'); 
}
```

#### Dark Mode Color Adaptation Rules

| Light Mode Color | Dark Mode Equivalent | Rationale |
|---|---|---|
| `#4285F4` (Google Blue) | `#8AB4F8` | Tone 80 equivalent — lighter for dark bg |
| `#34A853` (Google Green) | `#81C995` | Tone 80 equivalent |
| `#EA4335` (Google Red) | `#F28B82` | Tone 80 equivalent |
| `#FBBC04` (Google Yellow) | `#FDD663` | Tone 80 equivalent |
| `#FFFFFF` (white fills) | `#202124` | Surface color in dark mode |
| `#F1F3F4` (light surface) | `#303134` | Surface variant in dark mode |
| `#BDC1C6` (neutral gray) | `#5F6368` | On-surface-variant in dark mode |
| Black strokes `#000` | `#E3E3E3` | On-surface in dark mode |

**Rule:** Never use pure black (`#000000`) or pure white (`#FFFFFF`) as illustration fills. Use the surface/on-surface color roles so dark mode adaptation is predictable.

---

### 16.9 SVG Performance

#### Sprite Sheets with `<symbol>` and `<use>`

For applications using many icons, inline each icon individually creates DOM bloat. Use an SVG sprite sheet:

```html
<!-- sprite.svg — hidden, loaded once -->
<svg xmlns="http://www.w3.org/2000/svg" style="display:none">
  <symbol id="icon-search" viewBox="0 0 24 24">
    <path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 
         16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79
         l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 
         5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
  </symbol>
  <symbol id="icon-home" viewBox="0 0 24 24">
    <path fill="currentColor" d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
  </symbol>
  <!-- … more symbols … -->
</svg>

<!-- Usage anywhere in the document -->
<svg aria-hidden="true" focusable="false" width="24" height="24">
  <use href="#icon-search"/>
</svg>
```

**Sprite sheet rules:**
- Inject the sprite SVG as the first child of `<body>` (or load via JS before first paint)
- Use `href` not `xlink:href` (xlink is deprecated)
- Each `<symbol>` must have its own `viewBox`
- Do not put `width`/`height` on `<symbol>` elements — set them on the `<use>` site
- Split sprites by feature area if total sprite exceeds 50 icons (lazy load sections)

#### Performance Comparison

| Method | HTTP Requests | DOM Nodes | CSS Styleable | Cacheable |
|---|---|---|---|---|
| Individual inline SVGs | 0 | High (per icon) | ✓ | ✗ |
| SVG sprite (`<use>`) | 0 (if inline) | Low | ✓ | ✗ (inline) |
| External sprite (`<use href="sprite.svg#…">`) | 1 total | Low | ✗ (cross-doc) | ✓ |
| `<img src="icon.svg">` | 1 per icon | Low | ✗ | ✓ |
| CSS `background-image` | 1 per icon | None | ✗ | ✓ |

**Recommended approach:** Inline sprite sheet for icons that need CSS styling (color, hover states). External `<img>` for large illustrations that don't need styling.

#### Lazy Loading SVG Illustrations

Large illustrations below the fold should be lazy-loaded:

```html
<!-- Native lazy loading for <img>-embedded SVGs -->
<img src="/illustrations/empty-state.svg" 
     alt="No results found"
     width="200" height="150"
     loading="lazy">
```

For inline SVGs that must be lazy-loaded (e.g., animated illustrations):

```js
// Intersection Observer — load SVG content only when near viewport
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const container = entry.target;
    fetch(container.dataset.svgSrc)
      .then(r => r.text())
      .then(svg => { container.innerHTML = svg; });
    observer.unobserve(container);
  });
}, { rootMargin: '200px' });

document.querySelectorAll('[data-svg-src]').forEach(el => observer.observe(el));
```

```html
<div data-svg-src="/illustrations/onboarding-step-2.svg" 
     style="width:240px;height:180px" 
     aria-label="Step 2: Organize your files">
</div>
```

#### SVG Caching Strategy

| Asset Type | Cache Strategy | Max-Age |
|---|---|---|
| Icon sprite sheet | Immutable (hash in filename) | 1 year |
| Product illustrations | Versioned URL | 30 days |
| Animated illustrations | Versioned URL | 7 days |
| Dynamic/personalized SVGs | No-cache or short TTL | 0–1 hour |

---

### 16.10 Responsive SVGs

#### `preserveAspectRatio` Reference

`preserveAspectRatio` controls how an SVG scales when its container aspect ratio differs from its `viewBox` ratio.

| Value | Behavior | When to Use |
|---|---|---|
| `xMidYMid meet` | Scale to fit, centered, letterbox | Default; most illustrations |
| `xMidYMid slice` | Scale to fill, centered, crop | Background/hero illustrations |
| `xMinYMin meet` | Scale to fit, top-left aligned | Left-aligned decorative elements |
| `xMidYMax meet` | Scale to fit, bottom-centered | Ground-anchored illustrations |
| `none` | Stretch to fill (distorts) | Patterns, textures only |

```html
<!-- Illustration that fits within its container, centered -->
<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid meet">…</svg>

<!-- Hero background that fills and crops -->
<svg viewBox="0 0 1440 600" preserveAspectRatio="xMidYMid slice">…</svg>
```

#### Fluid Sizing

Never use fixed `width`/`height` attributes on SVGs that must be responsive. Control size entirely with CSS:

```html
<!-- ✓ Correct — fluid SVG -->
<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">…</svg>
```

```css
/* Size controlled by CSS — responds to container */
.icon { width: 24px; height: 24px; }
.icon-large { width: 48px; height: 48px; }

/* Fluid illustration — fills container width, maintains aspect ratio */
.illustration {
  width: 100%;
  max-width: 400px;
  height: auto; /* SVG intrinsic ratio maintained */
}
```

**Rule:** An SVG with a `viewBox` and no `width`/`height` attributes will size to 100% of its container by default in most browsers. Always set an explicit size via CSS to avoid layout surprises.

#### Responsive Illustration Sizing by Breakpoint

| Breakpoint | Empty State Width | Onboarding Width | Error State Width |
|---|---|---|---|
| Compact (<600dp) | 160dp | 240dp | 120dp |
| Medium (600–839dp) | 200dp | 280dp | 160dp |
| Expanded (840dp+) | 240dp | 320dp | 200dp |

```css
.empty-state-illustration {
  width: 160px;
}
@media (min-width: 600px) {
  .empty-state-illustration { width: 200px; }
}
@media (min-width: 840px) {
  .empty-state-illustration { width: 240px; }
}
```

#### Intrinsic Size Reservation (Preventing CLS)

Always reserve space for SVG illustrations before they load to prevent Cumulative Layout Shift:

```css
/* Aspect ratio box — reserves space before SVG loads */
.illustration-wrapper {
  width: 100%;
  max-width: 400px;
  aspect-ratio: 4 / 3; /* matches illustration viewBox ratio */
}

.illustration-wrapper img,
.illustration-wrapper svg {
  width: 100%;
  height: 100%;
}
```

---

### 16.11 SVG Implementation Checklist

#### Optimization
- [ ] All SVGs processed through SVGO 3.x with the standard config
- [ ] Coordinate precision ≤2 decimal places
- [ ] No design tool metadata (`<sodipodi:*>`, `<inkscape:*>`, Adobe namespaces)
- [ ] File size within targets (icon <2 KB, illustration <50 KB)
- [ ] `viewBox` declared on every SVG
- [ ] No hardcoded `width`/`height` on SVGs that must be responsive

#### Accessibility
- [ ] Decorative SVGs have `aria-hidden="true"` and `focusable="false"`
- [ ] Informational SVGs have `role="img"` and `aria-label` or `aria-labelledby`
- [ ] Interactive SVGs: label on the wrapper element, `aria-hidden` on the SVG
- [ ] `<title>` present as first child of all informational SVGs
- [ ] `<desc>` present for complex illustrations
- [ ] `focusable="false"` on every SVG (IE11 / AT compatibility)

#### Icons
- [ ] Designed on 24×24dp grid with 2dp padding (20dp live area)
- [ ] Stroke width 2dp for outlined style
- [ ] `fill="currentColor"` or `stroke="currentColor"` — no hardcoded colors
- [ ] Outlined variant for inactive state; filled variant for active state
- [ ] Optical alignment verified at 24dp, 48dp, 96dp

#### Illustrations
- [ ] Correct category style applied (empty/onboarding/error/success)
- [ ] Palette ≤5 colors; uses Google brand palette
- [ ] Corner radii follow size-based rules (minimum 4dp)
- [ ] Dark mode handled (currentColor / CSS vars / separate variant)
- [ ] No pure `#000000` or `#FFFFFF` fills

#### Animation
- [ ] Only `transform` and `opacity` animated in CSS (no layout properties)
- [ ] `prefers-reduced-motion` respected for all animations
- [ ] No SMIL animations
- [ ] Duration within targets (icon: ≤300ms, illustration entrance: ≤400ms)

#### Performance
- [ ] Icons use `<symbol>` + `<use>` sprite pattern
- [ ] Below-fold illustrations use `loading="lazy"` or Intersection Observer
- [ ] Sprite sheet filename includes content hash for long-term caching
- [ ] Illustration space reserved with `aspect-ratio` to prevent CLS

#### Dark Mode
- [ ] Icons use `currentColor` — no separate dark variant needed
- [ ] Simple illustrations use CSS custom properties with `prefers-color-scheme`
- [ ] Complex illustrations have separate dark variant loaded via `<picture>`
- [ ] Dark mode colors use tone-80 equivalents of brand colors


### 19.4 Responsive Charts

Charts must adapt across breakpoints — not just resize, but restructure.

| Breakpoint | Width | Chart Behavior |
|---|---|---|
| **Compact** | <600dp | Simplified view: fewer axis labels, no legend (use title), larger touch targets, consider table fallback |
| **Medium** | 600–839dp | Standard view: abbreviated labels, inline legend, tooltips on tap |
| **Expanded** | 840dp+ | Full view: all labels, external legend, hover tooltips, zoom/pan enabled |

**Responsive simplification rules by chart type:**

| Chart Type | Compact Adaptation |
|---|---|
| **Line chart** | Show every 3rd x-axis label; remove gridlines; increase line weight to 2.5dp |
| **Bar chart** | Rotate to horizontal; show top 8 bars only with "Show all" toggle |
| **Pie/Donut** | Remove external labels; use center text for active slice; legend below |
| **Scatter** | Increase point size to 8dp minimum; disable zoom by default |
| **Heatmap** | Reduce to 10×10 max; use pinch-to-zoom for full view |
| **Treemap** | Show top 2 levels only; tap to drill down |

**CSS container query pattern (preferred over media queries for charts):**

```css
/* Chart adapts to its container, not the viewport */
@container chart-wrapper (max-width: 400px) {
  .chart-legend { display: none; }
  .chart-axis-label { font-size: 10px; }
  .chart-title { font-size: 14px; }
}

@container chart-wrapper (min-width: 600px) {
  .chart-legend { display: flex; }
}
```

**Axis label strategies at small sizes:**

```
Full:        Jan  Feb  Mar  Apr  May  Jun  Jul  Aug  Sep  Oct  Nov  Dec
Abbreviated: J    F    M    A    M    J    J    A    S    O    N    D
Skip:        Jan           Apr           Jul           Oct
Rotated:     (45° rotation when labels overlap — last resort, prefer abbreviation)
```

**Rule:** Never clip or overlap axis labels. If labels don't fit, abbreviate, skip, or rotate — in that order of preference.

---

### 21.5 Error Message Writing

Error messages are the product's apology to the user. They must be specific, actionable, and never blame the user.

**The formula:**
```
[What is wrong] + [Why, if non-obvious] + [Exactly what to do]
```

**Comparison table:**

| Field | ✗ Bad | ✓ Good |
|---|---|---|
| Email | "Invalid email" | "Enter an email address in the format name@example.com" |
| Phone | "Wrong format" | "Enter a 10-digit US phone number" |
| Password | "Password too weak" | "Add a number or symbol to strengthen your password" |
| Required | "This field is required" | "Enter your first name" |
| Date | "Invalid date" | "Enter a date after today" |
| File upload | "Upload failed" | "File exceeds 10 MB. Choose a file under 10 MB." |
| Username taken | "Username unavailable" | "That username is taken. Try alex_smith or alex.smith92." |
| Credit card | "Card declined" | "Your card was declined. Check the number and expiry date, or try a different card." |
| Network | "Error 503" | "Something went wrong on our end. Wait a moment and try again." |

**Writing rules:**
1. **Never use "invalid"** — it's a technical term that tells the user nothing
2. **Never use "please"** — it's filler that adds length without adding meaning
3. **Never blame** — "you entered" → "the email address"; passive voice is fine here
4. **Be specific about the constraint** — "at least 8 characters" not "too short"
5. **Suggest the fix** — don't just describe the problem
6. **Match the reading level** — 8th grade maximum; no jargon
7. **One error per field** — show the most actionable error, not all errors at once

**Error placement rules:**
- Error text replaces helper text (same 12sp, same position, `error` color role)
- No layout shift — the space is already reserved for helper text
- Error icon (⚠) optional but adds scannability in dense forms
- Field border and label turn `error` color simultaneously

**Accessibility:**
```html
<input
  id="email"
  aria-describedby="email-error"
  aria-invalid="true"
/>
<span id="email-error" role="alert">
  Enter an email address in the format name@example.com
</span>
```
Use `role="alert"` (equivalent to `aria-live="assertive"`) so screen readers announce the error immediately when it appears.

---

### 21.6 Password Fields

Password fields require special treatment: they contain sensitive data, have complex requirements, and are a primary source of user frustration.

#### Show/Hide Toggle

Always provide a visibility toggle. Hiding passwords by default causes typos; the toggle gives users control.

```
┌─────────────────────────────────────┐
│ Password                            │
│ ••••••••••••                    👁  │  ← Trailing icon, 48dp touch target
└─────────────────────────────────────┘
```

- Icon: `visibility_off` (default, password hidden) → `visibility` (password shown)
- Toggle label for screen readers: "Show password" / "Hide password" (not just icon)
- On toggle: field type switches between `type="password"` and `type="text"`
- Never auto-hide after a timeout — that's the user's choice

```html
<input id="password" type="password" autocomplete="current-password" />
<button
  aria-label="Show password"
  aria-controls="password"
  onclick="togglePasswordVisibility()"
>
  <!-- visibility_off icon -->
</button>
```

#### Strength Indicator

Show a strength meter on **new password creation only** (not on login).

```
┌─────────────────────────────────────┐
│ Create password                     │
│ MyP@ssw0rd!                     👁  │
└─────────────────────────────────────┘
[████████████░░░] Strong
```

**Strength meter specs:**
- Linear progress bar, 4dp tall, below the field
- 4 levels: Weak (`error`), Fair (`tertiary`), Good (`secondary`), Strong (`primary`)
- Update in real-time as user types
- Label the level in text — never color alone (accessibility)
- Width: full field width

**Strength scoring heuristics (not prescriptive rules):**
| Signal | Points |
|---|---|
| Length ≥ 8 | +1 |
| Length ≥ 12 | +1 |
| Contains uppercase | +1 |
| Contains number | +1 |
| Contains symbol | +1 |
| Not a common password | +1 |

Score 0–1 = Weak, 2–3 = Fair, 4 = Good, 5–6 = Strong

#### Requirements Checklist

For new password creation, show requirements as a live checklist — not as an error after the fact.

```
✓ At least 8 characters
✓ One uppercase letter
✗ One number
✗ One symbol
```

- Each requirement shows ✓ (met, `primary` color) or ✗ (unmet, `on-surface-variant`)
- Update in real-time as user types
- Do NOT show this as error text — it's guidance, not punishment
- Once all requirements are met, the checklist can collapse or fade

**Confirm password field:**
- Validate match on blur of the confirm field (not real-time)
- Error: "Passwords don't match" — clear, non-blaming
- Never validate on the original password field changing after confirm is filled (jarring)

**`autocomplete` attributes for password fields:**

| Context | `autocomplete` value |
|---|---|
| Login | `current-password` |
| New password | `new-password` |
| Confirm password | `new-password` |

---

### 21.7 Search Input

Search is a specialized input with its own interaction model. It is not a text field with a search icon.

**Search bar anatomy:**

```
┌──────────────────────────────────────────────────┐
│ ←  Search Maps                        ✕  🎤  🔍  │
└──────────────────────────────────────────────────┘
  [Recent search 1                               ]
  [Recent search 2                               ]
  ─────────────────────────────────────────────────
  [Suggestion 1                                  ]
  [Suggestion 2                                  ]
```

| Element | Behavior | Notes |
|---|---|---|
| **Back arrow** | Collapses search, returns to previous state | Only when search is an overlay |
| **Query input** | Full-width text input | `type="search"`, `role="combobox"` |
| **Clear button (✕)** | Appears when query is non-empty; clears field | 48dp touch target; `aria-label="Clear search"` |
| **Voice input (🎤)** | Replaces clear button when field is empty | Launches speech recognition |
| **Search button (🔍)** | Submits query | Can be omitted if suggestions auto-navigate |
| **Suggestions dropdown** | Appears below bar on focus/type | `role="listbox"`, items are `role="option"` |

**Clear button rules:**
- Show only when the field has content (not on empty field)
- Tapping clear: empties field, keeps focus, re-shows suggestions/recents
- Do not show both clear and voice simultaneously — clear takes priority when there is text

**Voice input rules:**
- Show microphone icon only when field is empty
- On tap: immediately start listening (no intermediate dialog on mobile)
- Show listening state: animated waveform or pulsing mic icon
- On result: populate field and auto-submit (or show for confirmation)
- Fallback gracefully if microphone permission denied: hide the icon, do not show an error

**Suggestions dropdown:**

```
Keyboard:  ↑↓ to navigate, Enter to select, Escape to close
Touch:     Tap to select
Screen reader: aria-activedescendant tracks focused option
```

```html
<input
  type="search"
  role="combobox"
  aria-expanded="true"
  aria-autocomplete="list"
  aria-controls="search-suggestions"
/>
<ul id="search-suggestions" role="listbox">
  <li role="option" id="opt-1">coffee near me</li>
  <li role="option" id="opt-2">coffee shops open now</li>
</ul>
```

**Suggestion categories (in order):**
1. Recent searches (user's own history — highest relevance)
2. Trending / popular (contextual)
3. Autocomplete predictions (query completions)
4. Entity suggestions (places, people, products with rich metadata)

**Search input on mobile vs desktop:**

| Behavior | Mobile | Desktop |
|---|---|---|
| Keyboard | Opens on tap, full-screen overlay | Inline expansion |
| Suggestions | Full-width list | Dropdown below bar |
| Submit | Keyboard "Search" / "Go" action key | Enter key |
| Voice | Prominent (thumb-reachable) | Present but secondary |

---

### 21.8 Date/Time Pickers

Date and time input is notoriously difficult. The right picker depends on context, precision needed, and platform.

#### Material Date Picker Anatomy

**Modal date picker (for selecting a specific date):**

```
┌─────────────────────────────────┐
│ Select date                     │
│                                 │
│ Fri, Jan 17                     │  ← Selected date header
│                                 │
│  < January 2025 >               │  ← Month/year navigation
│                                 │
│  Su Mo Tu We Th Fr Sa           │
│            1  2  3  4           │
│   5  6  7  8  9 10 11           │
│  12 13 14 15 16 [17] 18         │  ← Selected day (filled circle)
│  19 20 21 22 23 24 25           │
│  26 27 28 29 30 31              │
│                                 │
│  [Edit ✏]        [Cancel] [OK]  │
└─────────────────────────────────┘
```

| Element | Spec |
|---|---|
| Dialog width | 360dp |
| Calendar cell size | 40×40dp (touch target 48dp with invisible padding) |
| Selected day | Filled circle, `primary` color, `on-primary` text |
| Today (unselected) | Outlined circle, `primary` color text |
| Disabled days | `on-surface` at 38% opacity, not tappable |
| Month navigation | `<` `>` chevrons, 48dp touch targets |
| Edit button | Switches to text input mode for keyboard entry |

**Date range picker:**
- Start date: filled circle, left half of range highlight
- End date: filled circle, right half of range highlight
- In-range days: `primary-container` background, full width
- Selecting: first tap = start, second tap = end

#### Mobile vs Desktop Variants

| Variant | When to Use | Trigger |
|---|---|---|
| **Modal picker (mobile)** | Any date selection on mobile | Tap on date field |
| **Inline picker (desktop)** | Date is the primary content (calendar app, booking) | Always visible |
| **Dropdown picker (desktop)** | Date selection in a form | Click on date field |
| **Text input fallback** | User knows exact date; accessibility | "Edit" button in modal picker |

**Mobile-specific rules:**
- Always use the modal picker on mobile — never a native `<input type="date">` (browser implementations are inconsistent and often inaccessible)
- The "Edit" (pencil) icon in the picker header switches to a text field: `MM/DD/YYYY` format with mask
- Provide both modes — some users prefer typing

**Desktop-specific rules:**
- Inline pickers are appropriate when date selection is the primary task
- Dropdown pickers (popover) are appropriate in forms
- Always allow direct text entry as an alternative

#### Time Picker

```
┌─────────────────────────────┐
│ Select time                 │
│                             │
│      [07]  :  [30]  [AM]    │  ← Tappable segments
│                             │
│  ┌──────────────────────┐   │
│  │     Clock face       │   │  ← Analog clock (hours first, then minutes)
│  │    (touch to set)    │   │
│  └──────────────────────┘   │
│                             │
│  [Cancel]              [OK] │
└─────────────────────────────┘
```

- Default mode: analog clock (more intuitive for most users)
- Keyboard mode: text input `HH:MM` — accessible via "Edit" button
- AM/PM toggle: only for 12-hour locales; auto-detect from device locale
- Hour selection first, then minute selection (two-step)

**`autocomplete` for date/time fields:**

| Field | `autocomplete` |
|---|---|
| Birthday | `bday` |
| Birth day | `bday-day` |
| Birth month | `bday-month` |
| Birth year | `bday-year` |
| Date/time | No standard value — use picker |

---

### 23.7 Notification Grouping

When multiple notifications arrive from the same app or conversation, grouping prevents the notification shade from being overwhelmed.

#### Grouping Strategies

| Strategy | When to Use | Example |
|---|---|---|
| **Stacking (app-level)** | 4+ notifications from the same app | "5 new emails" summary with expandable list |
| **Conversation grouping** | Messaging apps, threaded replies | All messages from Ana in one notification |
| **Topic grouping** | Social apps, news | "3 new comments on your post" |
| **Summary notification** | When individual notifications are less useful than the aggregate | "12 new notifications" |

#### Android Notification Groups Implementation

```kotlin
// Individual notifications — assign to a group
NotificationCompat.Builder(context, "messages")
    .setGroup("com.example.app.GROUP_MESSAGES")
    .setGroupAlertBehavior(NotificationCompat.GROUP_ALERT_CHILDREN) // only children make sound
    // ... other fields

// Summary notification — required when group has 4+ children
NotificationCompat.Builder(context, "messages")
    .setGroup("com.example.app.GROUP_MESSAGES")
    .setGroupSummary(true)
    .setStyle(NotificationCompat.InboxStyle()
        .addLine("Ana: Looks great!")
        .addLine("Ben: Are you free Thursday?")
        .addLine("Carol: Thanks!")
        .setBigContentTitle("3 new messages")
        .setSummaryText("messages"))
```

**Grouping rules:**
- [ ] Always provide a summary notification when grouping — without it, Android may not display the group correctly
- [ ] Summary notification body must describe the group, not repeat one item
- [ ] Set `GROUP_ALERT_CHILDREN` so only the first notification in a group makes sound (not every subsequent one)
- [ ] Tapping the summary opens the app's notification list, not a single item
- [ ] Tapping an individual notification in the group deep links to that specific item

#### Conversation Style (Android 11+)

For messaging apps, use `MessagingStyle` — it renders as a conversation thread and enables Bubbles:

```kotlin
val person = Person.Builder()
    .setName("Ana García")
    .setIcon(IconCompat.createWithBitmap(avatarBitmap))
    .build()

NotificationCompat.Builder(context, "direct_messages")
    .setStyle(NotificationCompat.MessagingStyle(currentUser)
        .addMessage("Looks great!", timestamp1, person)
        .addMessage("When can we meet?", timestamp2, person)
        .setConversationTitle("Ana García") // for group chats only
    )
    .setShortcutId(shortcutId) // required for Bubbles eligibility
```

---

### 23.8 Notification Timing

Sending the right notification at the wrong time is nearly as bad as sending the wrong notification.

#### Best Send Times by Type

| Type | Optimal Window | Avoid | Rationale |
|---|---|---|---|
| **Transactional** | Immediately on event | Never delay | User is expecting it; delay causes anxiety |
| **Promotional (general)** | Tue–Thu, 10–11 AM or 7–9 PM local time | Mon AM, Fri PM, weekends | Highest open rates; avoid start/end of week noise |
| **Social** | Within 5 min of triggering event | Batching social beyond 30 min | Social notifications lose relevance quickly |
| **Digest / summary** | Morning (7–9 AM) or evening (6–8 PM) local | Midnight–6 AM | Aligns with natural inbox-checking habits |
| **Reminders** | 1 hour before the event | Day-of with no lead time | Gives user time to act |

#### Frequency Caps

Hard limits that must be enforced server-side, not just client-side:

| Channel | Hard Cap | Recommended Cap |
|---|---|---|
| Push (promotional) | 1/day | 3/week |
| Push (social) | Per event | Batch if >5 events in 10 min |
| Email (promotional) | 1/day | 2/week |
| Email (transactional) | Per event | — |
| SMS | 1/day | 2/week |
| In-app banner | 3/session | 1/session |

#### Quiet Hours

Respect quiet hours even if the user has not explicitly set them:

```
Default quiet hours (apply unless user overrides):
  Weekdays:  10 PM – 7 AM local time
  Weekends:  11 PM – 9 AM local time

Implementation:
  - Store user's timezone at opt-in time
  - Queue notifications that arrive during quiet hours
  - Deliver at the start of the next active window
  - Exception: IMPORTANCE_HIGH transactional (security alerts, calls) bypass quiet hours
  - Respect Android's "Do Not Disturb" mode via NotificationManager.getCurrentInterruptionFilter()
```

**Quiet hours UI in preference center:**
```
Quiet hours
  [Toggle: Pause notifications at night]
  
  From  [10:00 PM ▾]  To  [7:00 AM ▾]
  
  ☑ Weekdays    ☑ Weekends
  
  Exceptions: [Security alerts] always come through
```

---

### 23.9 Notification Actions

Actions let users respond to a notification without opening the app. They must be genuinely useful — not just a way to drive opens.

#### Action Types

| Action | Implementation | Use Case | Notes |
|---|---|---|---|
| **Quick reply** | `RemoteInput` | Messaging, comments | Show inline reply field in notification |
| **Mark as read** | `PendingIntent` (no UI) | Email, messaging | Must sync to server immediately |
| **Snooze** | `PendingIntent` → reschedule | Reminders, tasks | Offer 1h, 3h, tomorrow as options |
| **Archive** | `PendingIntent` (no UI) | Email | Provide undo via follow-up notification |
| **Dismiss/Delete** | `deleteIntent` on notification | Any | Fires when user swipes away |
| **Thumbs up/down** | `PendingIntent` (no UI) | Recommendations | Immediate feedback, no app open |

#### Quick Reply Implementation

```kotlin
val remoteInput = RemoteInput.Builder("key_text_reply")
    .setLabel("Reply…")
    .build()

val replyIntent = PendingIntent.getBroadcast(
    context, requestCode, replyIntent,
    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_MUTABLE
)

val replyAction = NotificationCompat.Action.Builder(
    R.drawable.ic_reply, "Reply", replyIntent
).addRemoteInput(remoteInput)
 .setAllowGeneratedReplies(true) // enables smart reply suggestions
 .build()
```

**After the user sends a quick reply:**
1. Update the notification immediately to show "Sending…" or the sent message
2. Do not dismiss the notification — update it to show the conversation thread
3. If sending fails, update the notification with an error and a retry action

#### Snooze Implementation

```kotlin
// When user taps "Snooze" action:
// 1. Cancel the current notification
// 2. Schedule a new one via AlarmManager or WorkManager

val snoozeOptions = listOf(
    "In 1 hour"   to System.currentTimeMillis() + 3_600_000L,
    "In 3 hours"  to System.currentTimeMillis() + 10_800_000L,
    "Tomorrow"    to tomorrowMorning8AM()
)
// Present as a sub-menu or use the first option as default with others in overflow
```

**Action rules:**
- [ ] Actions must complete in the background — never launch the app just to process an action
- [ ] Destructive actions (Delete, Remove) must be the last action in the list
- [ ] Provide an undo mechanism for destructive notification actions (follow-up notification: "Deleted. Undo")
- [ ] Actions must remain functional if the notification is hours old
- [ ] Maximum 3 actions per notification (OS enforces this on Android)

---

### 23.10 Notification Deep Linking

A notification tap must take the user to exactly the right place — and the back stack must make sense.

#### Back Stack Synthesis

When a user enters the app via a notification, they have no navigation history. Synthesize a logical back stack so the Up button works:

```kotlin
// Using TaskStackBuilder to synthesize back stack
val stackBuilder = TaskStackBuilder.create(context).apply {
    // Add the full hierarchy: Home → Section → Detail
    addNextIntentWithParentStack(
        Intent(context, OrderDetailActivity::class.java).apply {
            putExtra("order_id", orderId)
        }
    )
}

val pendingIntent = stackBuilder.getPendingIntent(
    requestCode,
    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
)
```

**Back stack rules by notification type:**

| Notification Type | Synthesized Back Stack | Tap "Up" goes to |
|---|---|---|
| Order shipped | Home → Orders → Order Detail | Orders list |
| New message from Ana | Home → Messages → Conversation with Ana | Messages list |
| Comment on your post | Home → Profile → Post → Comments | Post |
| Security alert | Home → Settings → Security | Settings |
| Promotional (sale) | Home → Sale category | Home |

#### State Restoration

The destination screen must restore to the correct state, not its default state:

```kotlin
// In the destination Activity/Fragment:
override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    
    val orderId = intent.getStringExtra("order_id")
    val scrollToCommentId = intent.getStringExtra("comment_id")
    
    // Restore to the specific item, not the top of the list
    if (scrollToCommentId != null) {
        viewModel.loadAndScrollTo(scrollToCommentId)
    }
}
```

**State restoration rules:**
- [ ] Deep link must scroll to / highlight the specific item referenced in the notification
- [ ] If the item no longer exists (deleted), show a graceful message — never crash or show a blank screen
- [ ] If the user must sign in first, preserve the deep link destination and redirect after auth
- [ ] Handle expired notifications (e.g., a flash sale that ended) — redirect to a relevant fallback, not a 404

#### Notification Trampoline Warning (Android 12+)

Android 12+ prohibits launching Activities from notification `BroadcastReceiver` or `Service` trampolines. Always set the `PendingIntent` directly on the notification:

```kotlin
// ✓ Correct — PendingIntent directly to Activity
notification.setContentIntent(
    PendingIntent.getActivity(context, 0, intent, FLAG_IMMUTABLE)
)

// ✗ Prohibited on Android 12+ — trampoline via BroadcastReceiver
notification.setContentIntent(
    PendingIntent.getBroadcast(...) // receiver then starts Activity
)
```

---

### 23.11 Notification Opt-Out

The opt-out experience is as important as the opt-in. A frustrated user who cannot easily unsubscribe will either block all notifications or uninstall the app.

#### Easy Unsubscribe

Every promotional notification must have a one-tap path to stop that type of notification:

```
Notification shade (long-press on notification) →
  "Turn off [Promotions] notifications" → Taps → Done

OR

Notification → "Manage" action button →
  Opens in-app preference center directly to that channel
```

On Android, expose this via the notification's settings intent:

```kotlin
NotificationCompat.Builder(context, "promotions")
    .setSettingsText("Manage notification preferences")
    // Android shows this in the notification long-press menu
```

#### Granular Controls — Preference Center

The preference center is the canonical place for notification management. It must be reachable in ≤2 taps from any notification.

**Preference center structure:**

```
Notification Preferences
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ORDERS & SHIPPING
  ☑  Order confirmations          [Push] [Email]
  ☑  Shipping updates             [Push] [Email]
  ☑  Delivery confirmation        [Push] [Email]

ACCOUNT & SECURITY
  ☑  Sign-in alerts               [Push] [Email]  (cannot disable email)
  ☑  Password changes             [Push] [Email]  (cannot disable email)

PROMOTIONS
  ☐  Sales and offers             [Push] [Email]
  ☐  New arrivals                 [Push] [Email]
  ☑  Price drops on saved items   [Push] [Email]

REMINDERS
  ☑  Abandoned cart               [Push] [Email]
  ☑  Wishlist back in stock       [Push] [Email]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Pause all notifications for 1 week]
[Unsubscribe from all marketing emails]
```

**Preference center rules:**
- [ ] Reachable from: notification long-press → Settings → Notifications, and from every promotional email footer
- [ ] Changes take effect immediately (optimistic UI, sync in background)
- [ ] Security/transactional notifications can be toggled for push but never for email (legal/safety requirement)
- [ ] "Unsubscribe from all marketing" is a single action — never require unchecking each item individually
- [ ] Show the current state clearly — use toggles, not ambiguous checkboxes
- [ ] Provide a "Pause all" option (1 week, 1 month) as an alternative to permanent unsubscribe

#### Email Unsubscribe (CAN-SPAM / GDPR)

```
Requirements:
  - Unsubscribe link in every promotional email (footer)
  - One-click unsubscribe (RFC 8058 List-Unsubscribe-Post header)
  - Process unsubscribe within 10 business days (CAN-SPAM); immediately (GDPR best practice)
  - Never require login to unsubscribe
  - Confirmation page must not have a re-subscribe CTA as the primary action
```

**One-click unsubscribe header (implement on all bulk mail):**
```
List-Unsubscribe: <https://example.com/unsubscribe?token=abc123>
List-Unsubscribe-Post: List-Unsubscribe=One-Click
```

---

### 23.12 Anti-Patterns

#### Notification Spam

| Anti-Pattern | Description | Impact | Correct Pattern |
|---|---|---|---|
| **Notification flooding** | Sending 5+ notifications in a short window without grouping | User disables all notifications | Group into a single summary notification |
| **Re-permission harassment** | Asking for notification permission every session after denial | User uninstalls | Ask max twice; stop after two denials |
| **Manufactured urgency** | "Your cart expires in 10 minutes!" when it doesn't | Erodes trust permanently | Only use urgency when genuinely true |
| **Notification as ad** | Sending promotional content via system/transactional channel | Violates user trust and Play Store policy | Use correct channel type; promotional content in promotional channel only |
| **Wake-up spam** | Sending non-urgent notifications at 2 AM | User disables, negative reviews | Respect quiet hours; queue for morning |
| **Duplicate notifications** | Same notification sent via push + email + SMS simultaneously | Overwhelming | Respect user's preferred channel; stagger multi-channel |

#### Misleading Previews

| Anti-Pattern | Example | Why It's Harmful |
|---|---|---|
| **Clickbait title** | "You won't believe what happened to your account" | Trains users to distrust all notifications |
| **Vague body to force open** | Body: "Tap to see your message" | Wastes the notification's value; users learn to ignore |
| **Fake sender name** | From: "Security Team" (it's a promo) | Deceptive; violates trust |
| **Inflated badge count** | Badge shows 12 but only 2 are real notifications | Confuses and frustrates users |
| **Preview text mismatch** | Subject: "Your order shipped" / Body: "Check out our new sale!" | Bait-and-switch; high unsubscribe rate |

#### Irreversible Actions in Notifications

Never place irreversible destructive actions directly in a notification without a confirmation or undo path:

| ✗ Anti-Pattern | ✓ Correct Pattern |
|---|---|
| Notification action: "Delete account" | Never expose account deletion in a notification |
| Notification action: "Delete message" (no undo) | Action deletes, then sends follow-up notification: "Message deleted. Undo" |
| Notification action: "Cancel order" (no confirmation) | Action cancels, then sends confirmation notification with "Undo" for 5 minutes |
| Notification action: "Clear all notifications" | Acceptable — not destructive to data |
| Notification action: "Send payment" | Require app open + biometric auth for financial transactions |

**The rule:** If the action cannot be undone within 30 seconds, it must not be a one-tap notification action. Require the user to open the app and confirm.

---

### 23.13 Notifications Implementation Checklist

#### Permission & Setup
- [ ] Notification permission requested only after user has experienced value
- [ ] Pre-permission rationale screen shown before OS dialog
- [ ] "Not now" option present and non-shaming
- [ ] Permission denial handled gracefully (no repeated prompts)
- [ ] Notification channels created at first launch with correct importance levels
- [ ] Channel groups used to organize related channels

#### Content Quality
- [ ] Every notification passes the "would I want this?" test
- [ ] Title ≤50 characters, leads with most important information
- [ ] Body adds context not present in the title
- [ ] Small icon is monochrome/alpha-only
- [ ] Large image is 2:1 ratio if used
- [ ] Actions are genuinely useful without opening the app (max 3)
- [ ] No manufactured urgency or misleading preview text

#### Timing & Frequency
- [ ] Transactional notifications sent immediately on event
- [ ] Promotional notifications respect frequency caps (≤3/week push, ≤2/week email)
- [ ] Quiet hours enforced (10 PM – 7 AM local time default)
- [ ] Do Not Disturb mode respected
- [ ] Social notifications grouped if >5 events in 10 minutes

#### Grouping
- [ ] App-level grouping applied when ≥4 notifications pending
- [ ] Summary notification provided for all groups
- [ ] `GROUP_ALERT_CHILDREN` set to prevent repeated sounds
- [ ] MessagingStyle used for conversation notifications (Android 11+)

#### Deep Linking & State
- [ ] Every notification tap deep links to the specific relevant content
- [ ] Back stack synthesized correctly (Home → Section → Detail)
- [ ] Expired/deleted content handled gracefully (no crash, no blank screen)
- [ ] Deep link destination preserved through sign-in flow
- [ ] No notification trampoline (Android 12+ compliance)

#### Opt-Out & Preferences
- [ ] Preference center reachable in ≤2 taps from any notification
- [ ] Per-channel and per-type controls available
- [ ] "Pause all" option available as alternative to permanent unsubscribe
- [ ] One-click email unsubscribe implemented (RFC 8058)
- [ ] Unsubscribe processed immediately
- [ ] Security/transactional notifications cannot be fully disabled

#### Accessibility
- [ ] Notification content descriptions meaningful for TalkBack
- [ ] Action labels are descriptive ("Reply to Ana", not just "Reply")
- [ ] Color is not the only differentiator in notification UI
- [ ] Badge counts announced by accessibility services


---

### 24.8 Personalization Onboarding

Collecting preferences improves the product, but every question asked is friction paid. The goal is maximum signal with minimum effort.

**Preference collection methods — ranked by friction:**

| Method | Friction | Signal Quality | Example |
|---|---|---|---|
| **Implicit (behavioral)** | Zero | High (revealed preference) | YouTube: watch history → recommendations |
| **Contextual inference** | Zero | Medium | Maps: home/work inferred from frequent locations |
| **Binary choice (2 options)** | Very low | Medium | "What brings you here? Work / Personal" |
| **Multi-select chips** | Low | High | "Pick topics you care about" (select 3+) |
| **Ranked preference** | Medium | High | Drag to reorder |
| **Slider** | Medium | Medium | "How often do you exercise?" |
| **Open text** | High | Variable | Avoid in onboarding |

**Personalization onboarding screen design:**

```
┌─────────────────────────────────┐
│  What topics interest you?      │  ← Headline Small (24sp)
│  Pick at least 3                │  ← Body Medium, on-surface-variant
│                                 │
│  ┌──────────┐ ┌──────────┐      │
│  │ 🏃 Sports│ │ 🎵 Music │      │  ← Filter chips, 2-column wrap
│  └──────────┘ └──────────┘      │    Selected: filled, primary color
│  ┌──────────┐ ┌──────────┐      │    Unselected: outlined
│  │ 🍳 Food  │ │ 💻 Tech  │      │
│  └──────────┘ └──────────┘      │
│  ┌──────────┐ ┌──────────┐      │
│  │ 🎮 Gaming│ │ 📚 Books │      │
│  └──────────┘ └──────────┘      │
│                                 │
│  [  Continue  ] (enabled at 3+) │  ← Filled button, disabled until min met
│  Skip for now                   │  ← Text button — always available
└─────────────────────────────────┘
```

**Personalization onboarding rules:**

| Rule | Specification |
|---|---|
| **Maximum questions** | 3 screens, 1 question per screen |
| **Always skippable** | Every preference screen has "Skip" — never block |
| **Show immediate impact** | After selection, show a preview of how it changes the experience |
| **Minimum viable selection** | Require minimum (e.g., 3 topics) but show button state change, not error |
| **Explain the benefit** | "We'll use this to personalize your feed" — 1 line |
| **Editable later** | "You can change this in Settings" — reduces commitment anxiety |
| **No more than 12 options** | More than 12 chips overwhelms; use categories instead |

**Implicit signal collection (zero friction):**

```
Instead of asking "What's your home address?":
→ After 5 navigations from the same location on weekday mornings → infer home
→ Show: "Is [address] your home? Save it for faster navigation" [Yes] [No]

Instead of asking "What kind of music do you like?":
→ After 3 plays of the same genre → surface more of that genre
→ Show: "Enjoying jazz? We'll add more to your mix" [thumbs up/down]
```

---

### 24.9 Re-Onboarding

Users who return after a long absence, or encounter a major redesign, need re-onboarding. The challenge: they are not new users, so treat them with respect.

**Re-onboarding triggers:**

| Trigger | Definition | Appropriate Response |
|---|---|---|
| **Long absence** | No activity for 30+ days | Gentle "welcome back" + what's changed |
| **Major redesign** | Navigation or core flow changed | Contextual coach marks on changed elements only |
| **Feature update** | Existing feature significantly changed | What's New sheet, shown once |
| **Account recovery** | User reset password / recovered account | Re-establish context, re-request permissions |
| **Device migration** | New device, restored app | Confirm preferences, re-request permissions |
| **Role change** | User upgraded plan / changed account type | Spotlight new capabilities |

**Long-absence re-onboarding pattern:**

```
┌─────────────────────────────────┐
│  Welcome back, [First name]     │  ← Title Large — use their name
│                                 │
│  Here's what's new since        │  ← Body Medium
│  you were last here:            │
│                                 │
│  ✦ [Feature 1] — 1 line desc   │  ← Body Medium, leading icon
│  ✦ [Feature 2] — 1 line desc   │
│                                 │
│  [  Catch me up  ]              │  ← Filled button → brief tour
│  [  Go to my feed ]             │  ← Outlined button → skip
└─────────────────────────────────┘
```

**Re-onboarding for major redesign — rules:**

| Rule | Rationale |
|---|---|
| **Only coach-mark what changed** | Don't re-teach what they already know |
| **Acknowledge the change explicitly** | "We've moved [X] to make room for [Y]" — respect their muscle memory |
| **Show the old location, point to new** | "Settings used to be here → now here" |
| **One coach mark per session max** | Don't overwhelm returning users |
| **Provide a "What changed?" help article** | For power users who want the full picture |
| **Never reset user preferences** | Preserve all settings through redesigns |

**Re-onboarding checklist:**
- [ ] Absence threshold defined (30 days is a common default)
- [ ] "Welcome back" message uses first name if available
- [ ] Only surfaces changes since last visit, not all features
- [ ] Always offers a "skip" path — returning users may not need re-onboarding
- [ ] Coach marks for redesigns only appear on the changed elements
- [ ] User preferences and data are fully preserved

---

### 24.10 Onboarding Metrics

Measuring onboarding requires a funnel view, not a single metric. Define metrics at each phase.

**The onboarding funnel:**

```
Install / First Launch
    ↓  [Drop-off: app too slow, confusing, or no perceived value]
First Meaningful Interaction (FMI)
    ↓  [Drop-off: feature too hard, value not clear]
Aha Moment
    ↓  [Drop-off: not enough motivation to return]
Account Creation (if deferred)
    ↓  [Drop-off: sign-up friction]
D1 Retention (return next day)
    ↓  [Drop-off: no habit formed]
D7 Retention (return within a week)
    ↓  [Drop-off: no recurring value]
Activation (completed core value loop)
```

**Core onboarding metrics:**

| Metric | Definition | Formula | Target (consumer app) |
|---|---|---|---|
| **Activation rate** | % of new users who complete the core value loop | `users_activated / new_installs` | >40% within 7 days |
| **Time-to-first-value (TTFV)** | Median time from install to first meaningful action | `median(FMI_timestamp - install_timestamp)` | <5 minutes |
| **Aha moment conversion** | % of users who reach the aha moment | `users_reached_aha / new_installs` | Product-specific |
| **Sign-up conversion** | % of users who create an account | `accounts_created / prompted_users` | >60% |
| **Permission grant rate** | % of users who grant a specific permission | `grants / requests` | >70% (JIT) |
| **D1 retention** | % of users who return the next day | `DAU_d1 / new_installs_d0` | >25% |
| **D7 retention** | % of users who return within 7 days | `users_active_d2_d7 / new_installs_d0` | >15% |
| **Feature adoption rate** | % of active users who use a specific feature | `users_used_feature / active_users` | >20% within 30 days |
| **Onboarding completion rate** | % of users who finish the onboarding flow | `completions / starts` | >80% |
| **Permission denial rate** | % of users who deny a permission | `denials / requests` | <30% |

**HEART framework applied to onboarding:**

| HEART Dimension | Onboarding Signal | Metric |
|---|---|---|
| **Happiness** | User satisfaction with onboarding | Post-onboarding CSAT (1-question survey) |
| **Engagement** | Depth of first session | Actions per first session, screens visited |
| **Adoption** | Feature uptake | Feature adoption rate at D7, D30 |
| **Retention** | Return after onboarding | D1, D7, D30 retention |
| **Task Success** | Completing the core loop | Activation rate, TTFV |

**Cohort analysis — the right way to measure onboarding:**

```
Don't measure: "What % of all users are activated?"
Do measure:    "Of users who installed in week W, what % activated by day D?"

Cohort view reveals:
- Whether onboarding improvements are working (newer cohorts better than older)
- Natural activation curve (most users activate in D0–D3 or never)
- Impact of specific changes (cohort before/after a change)
```

---

### 24.11 A/B Testing Onboarding

Onboarding is the highest-leverage area for A/B testing. Small changes compound across every new user.

**What to test — prioritized by impact:**

| Test Category | Specific Hypothesis | Primary Metric | Risk |
|---|---|---|---|
| **Value proposition** | Different headline copy on first screen | TTFV, D1 retention | Low |
| **Auth method order** | Google Sign-In first vs email first | Sign-up conversion | Low |
| **Permission timing** | JIT vs upfront permission request | Grant rate, D7 retention | Medium |
| **Onboarding length** | 3-step vs 5-step personalization | Completion rate, D7 retention | Medium |
| **Aha moment path** | Guided path vs free exploration | Activation rate | Medium |
| **Deferred vs immediate sign-up** | Sign-up after value vs on launch | Activation rate, LTV | High |
| **Coach mark presence** | With vs without coach marks for feature | Feature adoption rate | Low |
| **Empty state CTA** | Different CTA copy/action | First action rate | Low |

**Guardrail metrics — must not regress:**

| Guardrail | Threshold | Why |
|---|---|---|
| **Accessibility score** | Must not decrease | Legal and ethical requirement |
| **Crash rate** | Must not increase >0.1% | Stability |
| **D30 retention** | Must not decrease >2% | Short-term gains can mask long-term harm |
| **Permission grant rate** | Must not decrease >5% | Indicates user trust erosion |
| **Support contact rate** | Must not increase >10% | Indicates confusion |
| **Uninstall rate (D1)** | Must not increase >2% | Immediate rejection signal |

**A/B test design rules for onboarding:**

| Rule | Specification |
|---|---|
| **Minimum sample size** | Calculate before starting: use 80% power, 95% confidence, 5% MDE |
| **Minimum runtime** | 2 weeks minimum (captures weekly patterns) |
| **One variable at a time** | Never test copy + layout + flow simultaneously |
| **New users only** | Never expose existing users to onboarding experiments |
| **Holdback group** | Keep 5–10% on control permanently for long-term comparison |
| **Novelty effect** | Run for 4+ weeks before declaring winner — novelty inflates early metrics |
| **Segment analysis** | Always break down results by platform, country, acquisition channel |

**Sample size calculator (quick reference):**

```
For detecting a 5% relative improvement in a 40% baseline activation rate:
  Baseline: 40%
  MDE: 5% relative = 42% target
  Power: 80%
  Confidence: 95%
  Required sample: ~7,500 users per variant

Rule of thumb: smaller the effect you want to detect, larger the sample needed.
Use: statsig.com/calculator or similar tool before starting any test.
```

**Onboarding A/B test log template:**

```
Test ID:        OB-2024-042
Hypothesis:     Showing a 15s product demo video on first launch will
                increase D7 retention by 5% by helping users understand value faster.
Primary metric: D7 retention
Guardrails:     D1 uninstall rate, crash rate, accessibility score
Sample:         10,000 users per variant (new installs only)
Duration:       3 weeks
Variants:       Control (current), Treatment (video added)
Result:         [fill after test]
Decision:       [ship / iterate / kill]
```

---

### 24.12 Onboarding Anti-Patterns

These patterns are common, feel intuitive, and consistently harm activation and retention.

**The Dirty Dozen — onboarding anti-patterns:**

| Anti-Pattern | Why It Feels Right | Why It's Wrong | Correct Pattern |
|---|---|---|---|
| **Mandatory carousel** | "Users need to know our features" | Skip rate >80%; users tap through without reading | Progressive disclosure; teach in context |
| **Permission wall** | "We need location to work" | 60%+ deny when asked before value shown | JIT permissions after demonstrating value |
| **Feature overload (day 1)** | "Show everything we can do" | Overwhelms; users can't identify primary action | One feature per session; progressive reveal |
| **Forced account creation** | "We need the account for X" | Kills conversion; users haven't seen value yet | Guest mode + deferred sign-up |
| **Unskippable onboarding** | "Users must complete setup" | Creates resentment; power users are blocked | Always provide "Skip" or "I'll do this later" |
| **Notification permission on launch** | "We need to re-engage users" | <20% grant rate when asked cold | Ask after first value delivered, with rationale |
| **Generic empty states** | "It's just a placeholder" | Missed teaching opportunity; feels broken | Designed empty states with CTA |
| **Progress bar that lies** | "It motivates completion" | "Step 1 of 3" that becomes "Step 1 of 7" destroys trust | Accurate step counts, or no step count |
| **Dark pattern dismissal** | "Make it hard to skip" | Users feel trapped; uninstall instead | Prominent, honest dismiss option |
| **Re-asking denied permissions** | "Maybe they changed their mind" | Trains users to deny everything; violates OS guidelines | One re-ask max, with new context; then deep link to settings |
| **Onboarding that doesn't end** | "Keep teaching forever" | Users never feel competent; always feel like beginners | Clear completion state; celebrate graduation |
| **Personalization that isn't used** | "Collect data for later" | Users feel surveilled; data collected but not applied | Only ask for preferences you use immediately |

**Mandatory carousel — the data:**

```
Typical carousel metrics (industry benchmarks):
  Screen 1 → Screen 2: 60% proceed
  Screen 2 → Screen 3: 45% proceed
  Screen 3 → Screen 4: 30% proceed
  Complete carousel: 20% of users

Conclusion: 80% of users never see your last onboarding screen.
Design for the 80%, not the 20%.
```

**Permission wall — the cascade effect:**

```
Ask for 3 permissions upfront:
  Permission 1 (location): 40% grant
  Permission 2 (notifications): 25% grant (of those who granted #1)
  Permission 3 (contacts): 15% grant (of those who granted #2)

Net result: 15% of users have all permissions
vs.
JIT approach: 70%+ grant rate per permission, when asked in context
```

**The "graduation" pattern — ending onboarding well:**

```
After user completes first core loop:
┌─────────────────────────────────┐
│        🎉                       │
│  You're all set!                │  ← Headline Small
│                                 │
│  You just [completed action].   │  ← Specific to what they did
│  Here's what you can do next:   │
│                                 │
│  → [Suggested next action]      │  ← Most valuable next step
│                                 │
│  [  Explore  ]                  │  ← Go to main experience
└─────────────────────────────────┘
```

---

### 24.13 Onboarding Implementation Checklist

**Strategy**
- [ ] Onboarding model chosen (immediate value / progressive / account-first) with documented rationale
- [ ] "Aha moment" defined and instrumented
- [ ] Time-to-first-value target set (e.g., <5 minutes)
- [ ] Guest mode available if core value doesn't require account

**Sign-Up Flow**
- [ ] Social login (Google/Apple) offered before email/password
- [ ] Maximum 2 visible fields at any sign-up step
- [ ] All fields have correct `autocomplete` attributes
- [ ] Email verification deferred — doesn't block first use
- [ ] Sign-up flow preserved through deep links (user lands where they intended)

**Permissions**
- [ ] Zero permissions requested on first launch
- [ ] All permissions use JIT pattern with pre-permission rationale screen
- [ ] Graceful denial handled for all permissions (app functions at reduced capacity)
- [ ] Permanent denial handled with Settings deep link, not repeated OS dialog
- [ ] Permission grant rates instrumented per permission type

**Feature Discovery**
- [ ] Coach marks shown only on first relevant context, not on launch
- [ ] Coach marks dismissed by tapping outside, tapping target, or "Skip"
- [ ] Coach mark dismissal persisted server-side (not just local storage)
- [ ] What's New sheet shown max once per app update, after first user action
- [ ] Pulse animations stop after 3 cycles
- [ ] No more than 1 discovery UI shown per session

**Empty States**
- [ ] Every list, grid, and feed has a designed first-run empty state
- [ ] Empty state CTA leads directly to the filling action
- [ ] No-results states offer alternatives
- [ ] Error states have recovery actions

**Personalization**
- [ ] Maximum 3 preference screens in onboarding
- [ ] Every preference screen is skippable
- [ ] Preferences applied immediately (user sees impact before continuing)
- [ ] Implicit signals collected as fallback for skipped preferences

**Re-Onboarding**
- [ ] Long-absence threshold defined and instrumented
- [ ] Re-onboarding only surfaces changes since last visit
- [ ] Redesign coach marks only appear on changed elements
- [ ] User preferences preserved through all updates

**Metrics & Testing**
- [ ] Activation rate instrumented and baselined
- [ ] TTFV instrumented (median, p75, p90)
- [ ] D1, D7, D30 retention instrumented per install cohort
- [ ] Feature adoption rate instrumented per feature
- [ ] Guardrail metrics defined before any A/B test starts
- [ ] A/B tests run for minimum 2 weeks with pre-calculated sample sizes

**Anti-Pattern Audit**
- [ ] No mandatory carousels (all skippable)
- [ ] No permission walls (no permissions before value shown)
- [ ] No forced account creation before value demonstrated
- [ ] No unskippable onboarding steps
- [ ] No notification permission request on first launch
- [ ] No re-asking denied permissions in same session
- [ ] Onboarding has a clear completion/graduation state

---


---

## 20. Dark Mode Design System

### 20.1 Dark Mode Philosophy

Dark mode is not color inversion. Inverting a light UI produces washed-out colors, broken contrast, and illegible text. Material Design 3's dark mode is a **separately authored color scheme** built from the same tonal palettes but with different tone assignments, different elevation semantics, and different legibility rules.

The three pillars of correct dark mode design:

| Pillar | What It Means | Why It Matters |
|---|---|---|
| **Elevation through lightness** | Higher surfaces are lighter, not shadowed | Shadows are invisible on dark backgrounds |
| **Desaturated color** | Chromatic colors are pulled toward neutral | Saturated colors on dark cause halation and eye strain |
| **Legibility over aesthetics** | Contrast ratios are non-negotiable | Low-light environments amplify contrast failures |

**The inversion trap:** A pure color inversion of `#FFFFFF` background → `#000000` background, `#6750A4` primary → `#98AFFF` primary is wrong. The correct approach is to re-assign tones from the same palette: primary moves from tone 40 to tone 80. The hue and chroma are preserved; only the tone changes.

**Design implication:** Dark mode must be designed as a first-class scheme, not a post-hoc filter. Every color role, every surface, every component state must be explicitly verified in dark mode.

---

### 20.2 Surface Color System in Dark Mode

The dark mode surface system is built on a near-black base with **tonal elevation overlays** applied in the primary color to communicate depth.

**Base surface:** `#121212` (not `#000000` — see §20.12)

This maps to approximately tone 6 of the neutral palette in Material You. Pure black (`#000000`) is reserved for the absolute background behind all surfaces (e.g., the Android window background before the app draws).

**Tonal elevation overlay formula:**

The overlay is the `primary` color at a specific opacity, composited over the surface color. As elevation increases, the overlay opacity increases, making the surface progressively lighter and more chromatic.

| Elevation Level | dp | Overlay Opacity | Resulting Surface (approx.) | Usage |
|---|---|---|---|---|
| **Level 0** | 0dp | 0% | `#121212` | Background, canvas |
| **Level 1** | 1dp | 5% | `#1E1E2A` | Cards, search bars |
| **Level 2** | 3dp | 8% | `#222230` | FAB resting, menus |
| **Level 3** | 6dp | 11% | `#262636` | FAB pressed, dialogs |
| **Level 4** | 8dp | 12% | `#272738` | Navigation bar |
| **Level 5** | 12dp | 14% | `#2A2A3C` | Bottom sheets |

> The exact hex values above assume a primary color of approximately `#D0BCFF` (tone 80 of a violet primary palette). With dynamic color, the overlay hue shifts to match the user's wallpaper. Always compute overlays programmatically — never hardcode them.

**CSS implementation:**

```css
:root[data-theme="dark"] {
  --md-sys-color-surface: #121212;
  --md-sys-color-primary: #D0BCFF; /* tone 80 */

  /* Elevation surfaces via CSS custom properties */
  --surface-level-1: color-mix(in srgb, var(--md-sys-color-primary) 5%, var(--md-sys-color-surface));
  --surface-level-2: color-mix(in srgb, var(--md-sys-color-primary) 8%, var(--md-sys-color-surface));
  --surface-level-3: color-mix(in srgb, var(--md-sys-color-primary) 11%, var(--md-sys-color-surface));
  --surface-level-4: color-mix(in srgb, var(--md-sys-color-primary) 12%, var(--md-sys-color-surface));
  --surface-level-5: color-mix(in srgb, var(--md-sys-color-primary) 14%, var(--md-sys-color-surface));
}
```

For browsers without `color-mix` support, pre-compute the values or use a JS token generator at build time.

---

### 20.3 Color Role Mapping: Light vs Dark Tone Assignments

Every color role maps to a different tone in dark mode. The hue and chroma of the palette are identical — only the tone changes.

| Color Role | Light Mode Tone | Dark Mode Tone | Rationale |
|---|---|---|---|
| `primary` | 40 | 80 | Must be legible on dark surface (tone 6) |
| `on-primary` | 100 | 20 | Text on primary container |
| `primary-container` | 90 | 30 | Prominent primary surface |
| `on-primary-container` | 10 | 90 | Text on primary-container |
| `secondary` | 40 | 80 | Same logic as primary |
| `on-secondary` | 100 | 20 | |
| `secondary-container` | 90 | 30 | |
| `on-secondary-container` | 10 | 90 | |
| `tertiary` | 40 | 80 | |
| `on-tertiary` | 100 | 20 | |
| `tertiary-container` | 90 | 30 | |
| `on-tertiary-container` | 10 | 90 | |
| `surface` | 98 | 6 | Near-white → near-black |
| `surface-variant` | 90 | 30 | |
| `on-surface` | 10 | 90 | Primary text |
| `on-surface-variant` | 30 | 80 | Secondary text, icons |
| `outline` | 50 | 60 | Borders, dividers |
| `outline-variant` | 80 | 30 | Subtle dividers |
| `error` | 40 | 80 | |
| `on-error` | 100 | 20 | |
| `error-container` | 90 | 30 | |
| `on-error-container` | 10 | 90 | |
| `inverse-surface` | 20 | 90 | Snackbar background |
| `inverse-on-surface` | 95 | 20 | Snackbar text |
| `inverse-primary` | 80 | 40 | Tonal button on inverse surface |

**Key insight:** The jump from tone 40 → tone 80 for `primary` is not arbitrary. Tone 80 on a tone-6 surface achieves approximately 4.7:1 contrast, satisfying WCAG AA. Tone 40 on tone 6 achieves only ~1.8:1 — completely illegible.

**CSS token example (violet palette):**

```css
:root {
  /* Light scheme */
  --md-sys-color-primary: #6750A4;          /* tone 40 */
  --md-sys-color-on-primary: #FFFFFF;        /* tone 100 */
  --md-sys-color-primary-container: #EADDFF; /* tone 90 */
  --md-sys-color-on-surface: #1C1B1F;        /* tone 10 */
  --md-sys-color-on-surface-variant: #49454F; /* tone 30 */
}

@media (prefers-color-scheme: dark) {
  :root {
    --md-sys-color-primary: #D0BCFF;          /* tone 80 */
    --md-sys-color-on-primary: #381E72;        /* tone 20 */
    --md-sys-color-primary-container: #4F378B; /* tone 30 */
    --md-sys-color-on-surface: #E6E1E5;        /* tone 90 */
    --md-sys-color-on-surface-variant: #CAC4D0; /* tone 80 */
  }
}
```

---

### 20.4 Desaturation Rule

Colors in dark mode must be **desaturated relative to their light mode counterparts**. This is a perceptual requirement, not an aesthetic preference.

**Why saturation causes problems in dark mode:**

On a dark background, highly saturated colors exhibit **halation** — the color appears to bleed or glow, making edges hard to read and causing eye fatigue in low-light conditions. The HCT color space handles this automatically: tone 80 of a palette has lower chroma than tone 40 because the HCT model constrains chroma to what is achievable at that tone without gamut clipping.

| Palette | Light Mode (tone 40) Chroma | Dark Mode (tone 80) Chroma | Reduction |
|---|---|---|---|
| Violet primary | ~48 | ~24 | ~50% |
| Blue primary | ~40 | ~20 | ~50% |
| Green tertiary | ~36 | ~18 | ~50% |
| Error (red) | ~50 | ~25 | ~50% |

**Practical rule:** If you are using a custom color that is not generated by the M3 tonal palette algorithm, manually reduce chroma by approximately 50% when assigning the dark mode value. In HSL terms, reduce saturation by 30–50 percentage points.

```css
/* ✗ Wrong — same saturation in both modes */
:root { --brand-color: hsl(262, 52%, 47%); }
@media (prefers-color-scheme: dark) {
  :root { --brand-color: hsl(262, 52%, 75%); } /* just lightened, still too saturated */
}

/* ✓ Correct — desaturated in dark mode */
:root { --brand-color: hsl(262, 52%, 47%); }
@media (prefers-color-scheme: dark) {
  :root { --brand-color: hsl(262, 26%, 75%); } /* lightened AND desaturated */
}
```

---

### 20.5 Shadow vs Tonal Elevation in Dark Mode

In light mode, elevation is communicated by **drop shadows**. In dark mode, shadows are nearly invisible against dark surfaces — a `box-shadow` with even 30% black opacity disappears on a `#121212` background.

**The solution:** Replace shadow-based elevation with **tonal elevation overlays** (see §20.2). Higher elevation = lighter surface = more primary color mixed in.

| Elevation Signal | Light Mode | Dark Mode |
|---|---|---|
| **Primary mechanism** | Drop shadow (z-axis depth) | Tonal overlay (surface lightness) |
| **Secondary mechanism** | Tonal overlay (subtle) | None needed |
| **Shadow opacity** | 15–30% black | 0% (omit entirely) |
| **Surface color** | Uniform (all surfaces same white) | Varies by elevation level |

**CSS pattern:**

```css
/* Light mode: shadow communicates elevation */
.card {
  background: var(--md-sys-color-surface); /* #FFFBFE */
  box-shadow: 0 1px 2px rgba(0,0,0,0.3), 0 1px 3px 1px rgba(0,0,0,0.15);
}

/* Dark mode: tonal overlay communicates elevation, shadow removed */
@media (prefers-color-scheme: dark) {
  .card {
    background: var(--surface-level-1); /* #1E1E2A — primary overlay at 5% */
    box-shadow: none;
  }
}
```

**Why this works:** The human visual system perceives lighter surfaces as closer (more illuminated). In a dark environment, a slightly lighter card on a dark background reads as "above" the background — the same spatial relationship that a shadow communicates in light mode.

**Implication for component design:** Every component that uses elevation must define both a shadow (light) and a surface color (dark). Components that only define shadows will appear flat and undifferentiated in dark mode.

---

### 20.6 Image Treatment in Dark Mode

Images present a unique challenge: they are authored content with fixed colors and brightness. A bright photograph on a dark UI creates uncomfortable contrast and disrupts the dark mode experience.

**Three approaches, in order of preference:**

**1. CSS `brightness` filter (recommended for most cases)**

```css
@media (prefers-color-scheme: dark) {
  img:not([data-no-dim]) {
    filter: brightness(0.85);
  }
}
```

Reduces perceived brightness by 15%. Sufficient for most photography. Do not apply to icons, logos, or UI illustrations — use `data-no-dim` to opt out.

**2. Overlay dimming (for hero images and backgrounds)**

```css
.hero-image-wrapper {
  position: relative;
}
@media (prefers-color-scheme: dark) {
  .hero-image-wrapper::after {
    content: '';
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.3);
    pointer-events: none;
  }
}
```

Provides more control than `filter` and works for background images. Use 20–40% black overlay; beyond 40% the image becomes unrecognizable.

**3. Authored dark variants (for illustrations and product images)**

For SVG illustrations and product screenshots, provide explicit dark mode variants:

```html
<picture>
  <source srcset="illustration-dark.png" media="(prefers-color-scheme: dark)">
  <img src="illustration-light.png" alt="Feature illustration">
</picture>
```

Use this approach for onboarding illustrations, empty state art, and any image where the background color is part of the composition.

**Image treatment decision table:**

| Image Type | Recommended Treatment | Opt-out Needed? |
|---|---|---|
| Photography | `brightness(0.85)` filter | Rarely |
| Product screenshots | Authored dark variant | Yes — provide dark version |
| SVG illustrations | Authored dark variant or `currentColor` | Yes |
| User avatars/profile photos | No treatment | Yes — `data-no-dim` |
| Logos (third-party) | No treatment | Yes — `data-no-dim` |
| Charts and data visualizations | Authored dark variant | Yes |
| Background/hero images | Overlay dimming (20–30%) | Rarely |

---

### 20.7 SVG and Icon Adaptation

Icons and SVG illustrations must adapt to dark mode without requiring separate image files. The correct approach uses CSS custom properties and `currentColor`.

**`currentColor` for monochrome icons:**

```css
/* Icon inherits text color automatically */
.icon {
  color: var(--md-sys-color-on-surface-variant); /* tone 80 in dark mode */
}
```

```html
<!-- SVG uses currentColor — no hardcoded fill -->
<svg viewBox="0 0 24 24" fill="currentColor">
  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10..."/>
</svg>
```

**Multi-color SVG with CSS custom properties:**

```html
<svg viewBox="0 0 48 48">
  <circle cx="24" cy="24" r="20" fill="var(--icon-bg, #E8DEF8)"/>
  <path d="..." fill="var(--icon-fg, #6750A4)"/>
</svg>
```

```css
:root {
  --icon-bg: #E8DEF8; /* primary-container tone 90 */
  --icon-fg: #6750A4; /* primary tone 40 */
}
@media (prefers-color-scheme: dark) {
  :root {
    --icon-bg: #4F378B; /* primary-container tone 30 */
    --icon-fg: #D0BCFF; /* primary tone 80 */
  }
}
```

**Material Symbols (Google's icon font):**

Material Symbols already use `currentColor` and respond to the CSS `color` property. No special dark mode handling is needed beyond setting the correct `on-surface` or `on-surface-variant` color role on the parent element.

```css
.material-symbols-outlined {
  color: var(--md-sys-color-on-surface-variant);
  /* Automatically tone 30 (light) or tone 80 (dark) */
}
```

**Rules:**
- Never hardcode `fill="#000000"` or `fill="#FFFFFF"` in SVG — use `currentColor` or CSS custom properties
- Inline SVGs adapt automatically; `<img src="icon.svg">` does not — use inline or CSS background with `mask-image`
- For `mask-image` icons: set `background-color` to the desired color role, and the mask handles the shape

```css
.icon-mask {
  background-color: var(--md-sys-color-on-surface);
  -webkit-mask-image: url('icon.svg');
  mask-image: url('icon.svg');
  mask-size: contain;
}
```

---

### 20.8 Text Contrast in Dark Mode

Text contrast in dark mode follows the same WCAG thresholds as light mode (4.5:1 for normal text, 3:1 for large text) but uses different tone assignments to achieve them.

**Text color roles and their dark mode tones:**

| Text Role | Dark Mode Token | Tone | Typical Hex | Contrast on `#121212` |
|---|---|---|---|---|
| Primary text | `on-surface` | 90 | `#E6E1E5` | ~14:1 ✓ |
| Secondary text | `on-surface-variant` | 80 | `#CAC4D0` | ~9:1 ✓ |
| Disabled text | `on-surface` at 38% opacity | — | `#E6E1E5` @ 38% | ~4.5:1 (intentional minimum) |
| Placeholder text | `on-surface-variant` at 60% | — | `#CAC4D0` @ 60% | ~5.5:1 ✓ |
| Link / primary action text | `primary` | 80 | `#D0BCFF` | ~8:1 ✓ |
| Error text | `error` | 80 | `#F2B8B5` | ~7:1 ✓ |
| Caption / helper text | `on-surface-variant` | 80 | `#CAC4D0` | ~9:1 ✓ |

**Critical rule:** Do not use `on-surface-variant` (tone 80) for body text — it is correct for secondary/supporting text only. Primary body text must use `on-surface` (tone 90) to maintain the visual hierarchy between primary and secondary content.

**Contrast verification formula:**

```
Relative luminance of #E6E1E5 (tone 90) ≈ 0.793
Relative luminance of #121212 (tone 6)  ≈ 0.005
Contrast ratio = (0.793 + 0.05) / (0.005 + 0.05) ≈ 15.3:1
```

**Text on colored surfaces (containers):**

When text sits on a `primary-container` (tone 30 in dark mode), use `on-primary-container` (tone 90):

```css
.chip--selected {
  background: var(--md-sys-color-primary-container); /* tone 30 ≈ #4F378B */
  color: var(--md-sys-color-on-primary-container);   /* tone 90 ≈ #EADDFF */
  /* Contrast: ~9:1 ✓ */
}
```

---

### 20.9 System Dark Mode Detection

#### Web: `prefers-color-scheme`

```css
/* CSS media query — applies automatically */
@media (prefers-color-scheme: dark) {
  :root { /* dark token overrides */ }
}
```

```js
// JavaScript detection
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

function applyTheme(isDark) {
  document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
}

applyTheme(prefersDark.matches);
prefersDark.addEventListener('change', e => applyTheme(e.matches));
```

**User override pattern** (allow users to override system preference):

```js
const stored = localStorage.getItem('theme'); // 'light' | 'dark' | null
const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const isDark = stored ? stored === 'dark' : systemDark;
document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
```

#### Web: `meta theme-color`

The browser chrome (address bar, status bar on mobile) should match the app's surface color:

```html
<!-- Static: one color for each scheme -->
<meta name="theme-color" content="#FFFBFE" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#121212" media="(prefers-color-scheme: dark)">
```

```js
// Dynamic: update when user toggles theme
document.querySelector('meta[name="theme-color"]')
  .setAttribute('content', isDark ? '#121212' : '#FFFBFE');
```

#### Android: System Bars

On Android, use `WindowInsetsController` to set system bar appearance:

```kotlin
// Kotlin — set status bar icons to light (for dark backgrounds)
WindowCompat.getInsetsController(window, window.decorView).apply {
  isAppearanceLightStatusBars = !isDarkMode
  isAppearanceLightNavigationBars = !isDarkMode
}
```

For Jetpack Compose:

```kotlin
val systemUiController = rememberSystemUiController()
val useDarkIcons = !isSystemInDarkTheme()

SideEffect {
  systemUiController.setSystemBarsColor(
    color = Color.Transparent,
    darkIcons = useDarkIcons
  )
}
```

**Android `uiMode` in manifest** — declare dark mode support to prevent the system from applying automatic inversion:

```xml
<!-- AndroidManifest.xml -->
<application android:forceDarkAllowed="false" ...>
```

Setting `forceDarkAllowed="false"` tells Android not to apply automatic dark mode conversion — your app handles it natively.

---

### 20.10 Transition Between Modes

#### Instant vs Animated

| Scenario | Recommended Behavior | Rationale |
|---|---|---|
| System theme change (OS-level) | Instant | User initiated at OS level; app should follow immediately |
| In-app toggle (user switches in settings) | Animated (300ms) | User action within the app; transition confirms the change |
| App launch in dark mode | Instant | No transition needed; correct theme from first frame |
| Scheduled theme change (sunrise/sunset) | Instant | Background change; no user action to confirm |

#### What to Animate

When animating a theme transition, animate only properties that change:

```css
:root {
  /* Animate color tokens, not layout */
  --transition-theme: background-color 300ms ease, color 300ms ease,
                      border-color 300ms ease, fill 300ms ease;
}

body, .surface, .card, .nav-bar {
  transition: var(--transition-theme);
}

/* Do NOT transition these — causes layout jank */
/* width, height, padding, margin, font-size */
```

**What to animate:**
- `background-color` on surfaces and containers
- `color` on text elements
- `border-color` on outlined components
- `fill` and `stroke` on inline SVGs

**What NOT to animate:**
- Layout properties (width, height, padding)
- `box-shadow` (it disappears in dark mode — don't fade it, just remove it)
- Images (they don't change; the `brightness` filter change can be instant)
- `opacity` of entire sections (causes ghosting)

**Reduced motion:** Respect `prefers-reduced-motion` — skip the transition entirely:

```css
@media (prefers-reduced-motion: reduce) {
  body, .surface, .card {
    transition: none !important;
  }
}
```

---

### 20.11 Dark Mode Testing Checklist

Run this checklist on every screen before shipping dark mode support.

#### Contrast Ratios

- [ ] Primary text (`on-surface` tone 90 on `surface` tone 6): ≥4.5:1 — target ~14:1
- [ ] Secondary text (`on-surface-variant` tone 80 on `surface` tone 6): ≥4.5:1 — target ~9:1
- [ ] Primary color (`primary` tone 80 on `surface` tone 6): ≥4.5:1
- [ ] Text on `primary-container` (tone 90 on tone 30): ≥4.5:1
- [ ] Text on `error-container` (tone 90 on tone 30): ≥4.5:1
- [ ] Disabled text at 38% opacity: ≥3:1 (intentionally reduced — verify it does not fall below)
- [ ] All icon colors: ≥3:1 against their background
- [ ] Input field borders (`outline` tone 60): ≥3:1 against surface

#### Elevation Visibility

- [ ] Cards are visually distinct from the background (tonal overlay visible)
- [ ] Dialogs appear above the scrim (level 3 surface lighter than level 0)
- [ ] Bottom sheets appear above the page content
- [ ] Navigation bar is distinguishable from the page surface
- [ ] FAB is visually prominent (uses `primary-container` or `primary` surface)
- [ ] No two adjacent surfaces at the same elevation level are indistinguishable

#### Image Legibility

- [ ] Photography is dimmed (`brightness(0.85)`) and readable
- [ ] Hero images do not create uncomfortable contrast against dark UI
- [ ] User avatars are not dimmed (opt-out applied)
- [ ] Third-party logos are not dimmed (opt-out applied)
- [ ] SVG illustrations use dark variants or `currentColor`
- [ ] Charts and data visualizations have authored dark variants

#### Color and Icons

- [ ] No hardcoded `#000000` or `#FFFFFF` in component styles
- [ ] All icons use `currentColor` or CSS custom properties
- [ ] No over-saturated accent colors (verify chroma reduction)
- [ ] Focus indicators are visible (≥3:1 against adjacent colors)
- [ ] Selection states (chips, checkboxes) are clearly visible

#### System Integration

- [ ] `meta theme-color` matches surface color in dark mode
- [ ] Android status bar icons are light-colored in dark mode
- [ ] Android navigation bar matches app surface color
- [ ] `prefers-color-scheme` media query is respected
- [ ] User theme override (if implemented) persists across sessions

#### Motion

- [ ] Theme transition animates only color properties (not layout)
- [ ] `prefers-reduced-motion` disables theme transition animation
- [ ] No flash of wrong theme on page load (token applied before first paint)

---

### 20.12 Common Dark Mode Mistakes

| Mistake | Why It's Wrong | Correct Approach |
|---|---|---|
| **Pure black (`#000000`) background** | Creates extreme contrast with any content; OLED "halo" effect around bright elements; feels harsh | Use `#121212` (tone 6) as the base surface |
| **Insufficient contrast on colored surfaces** | `primary` tone 40 on dark surface achieves only ~1.8:1 — completely illegible | Reassign to tone 80 for all chromatic roles in dark mode |
| **Over-saturated accent colors** | Halation effect; colors appear to glow and bleed on dark backgrounds; causes eye strain | Reduce chroma by ~50%; use HCT-generated tone 80 values |
| **Keeping shadows in dark mode** | Shadows are invisible on dark surfaces; elevation hierarchy collapses | Replace with tonal elevation overlays (§20.2) |
| **Inverting images with CSS `filter: invert(1)`** | Photographs become unrecognizable; UI screenshots look broken | Use `brightness(0.85)` or authored dark variants |
| **Uniform surface color at all elevations** | Cards, dialogs, and sheets are indistinguishable from the background | Apply tonal overlays at each elevation level |
| **Hardcoding hex values instead of tokens** | Dark mode requires different values; hardcoded colors break | Always use color role tokens (`--md-sys-color-*`) |
| **Forgetting `meta theme-color`** | Browser chrome stays light while app is dark — jarring mismatch | Update `meta theme-color` to `#121212` in dark mode |
| **Animating `box-shadow` out** | Fading a shadow to nothing draws attention to its removal | Remove `box-shadow` instantly in dark mode; rely on tonal overlay |
| **Not testing with dynamic color** | A violet palette may look fine; a green or orange palette may produce illegible combinations | Test with at least 5 different seed colors across the hue wheel |
| **Dimming user-generated images** | User avatars and uploaded photos should not be dimmed — they are content, not UI | Apply `data-no-dim` opt-out to user content images |
| **Flash of light theme on load** | Token CSS loads after initial render; user sees a white flash before dark mode applies | Apply theme class/attribute in a `<script>` in `<head>` before any CSS renders |

**Preventing flash of wrong theme:**

```html
<head>
  <!-- Must be inline, before any stylesheet, to prevent FOCT -->
  <script>
    const dark = localStorage.getItem('theme') === 'dark' ||
      (!localStorage.getItem('theme') && matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  </script>
  <link rel="stylesheet" href="tokens.css">
</head>
```

This script runs synchronously before the first paint, ensuring the correct theme attribute is set before any CSS is applied — eliminating the flash entirely.

---


---

## 21. Forms & Input Patterns

Forms are the primary mechanism through which users give data to a product. Poor form UX is one of the leading causes of abandonment. Google's approach: **minimize perceived effort, maximize clarity, and never punish the user for trying**.

---

### 21.1 Form Layout: Single-Column vs Multi-Column

**Rule: Default to single-column. Multi-column is a specific solution to a specific problem, not a space-saving technique.**

| Layout | When to Use | When to Avoid |
|---|---|---|
| **Single-column** | All mobile forms; any form with logical top-to-bottom flow; forms with conditional fields; checkout flows | Almost never avoid on mobile |
| **Multi-column** | Desktop only; fields that are genuinely parallel (First Name / Last Name); address blocks (City / State / ZIP); date ranges (Start / End) | Never on mobile; never for unrelated fields; never to "save space" |

**Why single-column wins:**
- Follows the natural reading path (top to bottom, no eye-jumping)
- Tab order is unambiguous
- Conditional field insertion doesn't break layout
- Works identically on all screen sizes

**Legitimate multi-column patterns (desktop only):**

```
✓ Name row:
[First Name          ] [Last Name           ]

✓ Address completion:
[City                ] [State] [ZIP    ]

✓ Date range:
[Start Date          ] [End Date            ]

✗ Never do this:
[Email               ] [Phone Number        ]
(These are unrelated — single column)
```

**Column width rules:**
- Input width should signal expected content length: ZIP code = narrow, address line = full width
- Minimum input width: 120dp (anything narrower is unusable)
- On expanded breakpoints (≥840dp), center forms with `max-width: 600dp` — full-width forms on large screens are hard to scan

**Decision tree:**
```
Are you on mobile (<600dp)?
└── YES → Single column, always

Are the fields genuinely parallel/related (e.g., First/Last name)?
├── YES → Two-column acceptable on desktop
└── NO → Single column

Would a user naturally fill these fields simultaneously?
├── YES → Side-by-side acceptable
└── NO → Stack them
```

---

### 21.2 Input Field Anatomy

Material Design text fields have a precise anatomy. Every element has a defined role and placement.

```
┌─────────────────────────────────────────┐
│ 🔍  Label text                      ✕  │  ← Active/Filled state
│     Input value                         │
└─────────────────────────────────────────┘
  Helper text or character count      0/120
```

**Full anatomy breakdown:**

| Element | Position | Role | Specs |
|---|---|---|---|
| **Container** | Full field | Defines the interactive area | Filled: 56dp tall; bottom border only at rest |
| **Label** | Inside container | Identifies the field | Floats to top on focus/fill (see §21.3) |
| **Input text** | Inside container | User's entered value | Body Large (16sp), `on-surface` color |
| **Placeholder** | Inside container | Hint when empty (not a label) | Body Large (16sp), `on-surface-variant` at 38% opacity |
| **Helper text** | Below container, left | Guidance before interaction | Body Small (12sp), `on-surface-variant` |
| **Error text** | Below container, left | Replaces helper text on error | Body Small (12sp), `error` color role |
| **Character counter** | Below container, right | Shows usage vs limit | Body Small (12sp), `on-surface-variant` |
| **Leading icon** | Inside container, left | Clarifies field type | 24dp, `on-surface-variant` |
| **Trailing icon** | Inside container, right | Action or status | 24dp; clear (✕), visibility toggle, dropdown arrow |
| **Active indicator** | Bottom border | Focus state | 2dp, `primary` color when focused |
| **Error indicator** | Bottom border | Error state | 2dp, `error` color role |

**Spacing specs:**
- Container height: 56dp
- Horizontal padding: 16dp (leading icon: 12dp before icon, 12dp after)
- Label to input gap: 8dp when floating
- Helper text top margin: 4dp
- Between stacked fields: 16dp (related), 24dp (new section)

**Character counter rules:**
- Show only when the field has a character limit
- Appear when the user has entered ≥80% of the limit (not from the start — that's anxiety-inducing)
- Format: `current/max` (e.g., `87/100`)
- Turn `error` color when limit is exceeded

**Icon usage rules:**
- Leading icon: use to reinforce field type (🔍 for search, 📧 for email, 📍 for location)
- Trailing icon: use for actions (clear, show/hide password) or status (checkmark for valid)
- Never use both a leading icon and a leading label prefix simultaneously
- Trailing icons must have a 48×48dp touch target even if visually 24dp

---

### 21.3 Label Patterns

There are three label strategies. Only two are acceptable.

#### Floating Label (Recommended — Material Default)

The label sits inside the field at input-text size when empty, then animates to a smaller size above the input on focus or when populated.

```
Empty state:              Focused/Filled state:
┌──────────────────┐      ┌──────────────────┐
│                  │      │ Email address    │  ← 12sp, primary color
│  Email address   │  →   │ user@example.com │
└──────────────────┘      └──────────────────┘
```

**Pros:** Space-efficient; label always visible; clear field identity even when filled  
**Cons:** Requires careful animation (see §7.3 duration tokens — use `short4` 200ms, standard easing)

**Floating label specs:**
- Resting: Body Large (16sp), `on-surface-variant`, vertically centered
- Floating: Body Small (12sp), `primary` when focused / `on-surface-variant` when filled
- Animation: position + scale, `short4` (200ms), standard easing

#### Static Label (Above Field)

Label sits permanently above the field container, never moves.

```
Email address          ← Static, always above
┌──────────────────┐
│ user@example.com │
└──────────────────┘
Helper text
```

**When to use static labels:**
- Complex forms where users need to see the label while reading their input
- Fields with long labels that would be truncated when floating
- Accessibility-sensitive contexts (floating label animation can confuse some screen reader users)
- When helper text is critical and must coexist with the label visually

**Specs:** Label Medium (14sp, weight 500), `on-surface`, 8dp above container top

#### Placeholder-as-Label — Anti-Pattern ⚠️

Using placeholder text as the only label for a field. **Never do this.**

```
✗ Anti-pattern:
┌──────────────────────┐
│  Enter your email    │  ← This IS the label, but it disappears on type
└──────────────────────┘
```

**Why it fails:**

| Problem | Impact |
|---|---|
| Disappears when user starts typing | User forgets what the field is for mid-entry |
| Fails WCAG 1.3.1 (Info and Relationships) | Screen readers may not announce it as a label |
| Low contrast by design | Placeholder contrast is intentionally reduced (≥38% opacity) — it fails 4.5:1 |
| No space for helper text | Helper text and placeholder occupy the same visual space |
| Autofill confusion | Browser autofill may not correctly identify unlabeled fields |
| Cognitive load on error | Error state shows error text but the label is gone — user has lost context |

**The only acceptable use of placeholder text:** supplementary hint inside a field that already has a proper label. Example: label = "Phone number", placeholder = "(555) 000-0000".

---

### 21.4 Validation Timing

Validation timing is one of the most consequential form UX decisions. The wrong timing either frustrates users (premature errors) or wastes their time (errors only on submit).

**The three modes and their rules:**

| Mode | Trigger | Use For | Never Use For |
|---|---|---|---|
| **On blur** | User leaves the field | Format validation (email, phone, URL); required field check | Fields the user hasn't touched yet |
| **On submit** | User taps submit | Final catch-all; server-side errors | As the only validation strategy |
| **Real-time** | Every keystroke | Character count; password strength; availability checks (username) | Format errors (email mid-type is always "invalid") |

**Decision tree:**
```
Is this a format/pattern check (email, phone, date)?
└── Validate on BLUR only
    └── Never show "invalid email" while user is still typing

Is this a character limit?
└── Show counter in real-time (not an error — just a counter)
    └── Show error state only when limit is exceeded

Is this a password strength indicator?
└── Update strength meter in real-time
    └── Do NOT show "too weak" as an error until blur or submit

Is this a username/email availability check?
└── Debounce 500ms after last keystroke → async check → show result
    └── Show loading indicator during check

Is this a required field?
└── Do NOT show "required" error until:
    ├── User has focused AND blurred the field (blur), OR
    └── User attempts to submit (submit)
    └── NEVER on page load
```

**Blur validation implementation pattern:**

```html
<input
  id="email"
  type="email"
  aria-describedby="email-helper email-error"
  aria-invalid="false"
/>
<!-- Validate on 'blur' event, not 'input' event -->
```

**Re-validation after error:** Once a field is in an error state, switch to real-time validation so the user gets immediate feedback as they correct the mistake. This is the one exception to the "no real-time format validation" rule.

```
Field state machine:
Pristine → [blur] → Valid
Pristine → [blur] → Error → [input, real-time] → Valid
Valid    → [blur] → Error → [input, real-time] → Valid
```

**Submit-time validation rules:**
- Scroll to and focus the first invalid field
- Do not clear any field values
- Show all errors simultaneously (not one at a time)
- Announce errors to screen readers via `aria-live="assertive"` on the error summary

---

### 24.4 Feature Discovery Patterns

New features fail not because they are bad, but because users never find them. Google uses a layered discovery system.

**Discovery pattern comparison:**

| Pattern | Intrusiveness | Persistence | Best For | Timing |
|---|---|---|---|---|
| **Coach mark** | Medium | One-time | Single specific UI element | First encounter with feature |
| **Spotlight** | High | One-time | Critical new feature requiring action | Major release |
| **Feature highlight chip** | Low | Until dismissed | Passive awareness of new capability | New feature in existing flow |
| **What's New sheet** | Medium | Until dismissed | Multiple new features at once | App update |
| **Tooltip** | Low | Persistent | Discoverable on demand | Any time |
| **Pulse animation** | Very low | Until first tap | Draw attention to new nav item | New section added |
| **Empty state CTA** | Low | Until used | Features with no content yet | First-run |

**Feature discovery decision tree:**

```
Is this a new feature or an existing undiscovered feature?
├── NEW FEATURE (added in this release)
│   ├── Is it a major, behavior-changing feature?
│   │   ├── YES → Spotlight + What's New sheet
│   │   └── NO  → Feature highlight chip or pulse animation
└── EXISTING UNDISCOVERED FEATURE
    ├── Is it tied to a specific UI element?
    │   ├── YES → Coach mark (shown on first relevant context)
    │   └── NO  → Contextual tooltip or empty state education
```

**Pulse animation spec:**

```
// New nav item indicator
Animation: scale 1.0 → 1.3 → 1.0, opacity 1.0 → 0.6 → 1.0
Duration: 1000ms, ease-in-out
Repeat: 3 times, then stop (never loop indefinitely)
Color: md.sys.color.tertiary
Size: 8dp dot, positioned top-right of icon
Dismiss: on first tap of the item
```

**What's New bottom sheet anatomy:**

```
┌─────────────────────────────────┐
│  ▬  (drag handle)               │
│                                 │
│  What's new in [App]            │  ← Title Large
│                                 │
│  ┌─────────────────────────┐    │
│  │ [icon]  Feature name    │    │  ← Title Medium
│  │         One-line desc.  │    │  ← Body Small, on-surface-variant
│  └─────────────────────────┘    │
│  ┌─────────────────────────┐    │
│  │ [icon]  Feature name    │    │
│  │         One-line desc.  │    │
│  └─────────────────────────┘    │
│                                 │
│  [      Got it      ]           │  ← Filled button, dismisses sheet
└─────────────────────────────────┘
```

**Rules for What's New sheets:**
- Show at most once per app update
- Show after the user has completed their first action (not on cold launch)
- Maximum 3 features — more than 3 means you shipped too much at once
- Each feature description: ≤12 words
- "Got it" is the only required action — never require the user to try the feature

---

### 24.5 Coach Mark Anatomy

Coach marks are the most commonly misused discovery pattern. Used correctly, they teach. Used incorrectly, they annoy.

**Full coach mark anatomy:**

```
┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
  [Scrim: #000000 at 60% opacity]
│                                  │
│         ┌──────────────────┐     │
│         │  [Target element]│ ←── │── Spotlight cutout (no scrim)
│         │  highlighted     │     │   Shape matches element shape
│         └────────┬─────────┘     │
│                  │ (arrow, 8dp)  │
│         ┌────────▼─────────┐     │
│         │ Title (Title Med)│     │  ← md.sys.color.inverse-surface bg
│         │ Description text │     │  ← Body Small, inverse-on-surface
│         │ (2 lines max)    │     │
│         │                  │     │
│         │ [Skip]  [Try it] │     │  ← Text btn + Filled tonal btn
│         └──────────────────┘     │
│                                  │
└ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
```

**Coach mark component specifications:**

| Element | Spec | Token |
|---|---|---|
| **Scrim** | #000000, 60% opacity | — |
| **Spotlight shape** | Matches target element's shape token | `md.comp.[component].shape` |
| **Spotlight padding** | 8dp around target element | `spacing-2` |
| **Tooltip background** | `md.sys.color.inverse-surface` | — |
| **Tooltip text** | `md.sys.color.inverse-on-surface` | — |
| **Tooltip corner radius** | 12dp | `md.sys.shape.corner.medium` |
| **Tooltip max width** | 280dp | — |
| **Arrow size** | 8dp × 8dp | — |
| **Title** | Title Medium (16sp, weight 500) | `md.sys.typescale.title-medium` |
| **Description** | Body Small (12sp) | `md.sys.typescale.body-small` |
| **Dismiss button** | Text button, "Skip" or "×" | — |
| **CTA button** | Filled tonal button | — |

**Coach mark positioning logic:**

```
Target element position on screen?
├── Top half → Place tooltip BELOW the target
├── Bottom half → Place tooltip ABOVE the target
├── Left edge → Place tooltip to the RIGHT
└── Right edge → Place tooltip to the LEFT

Arrow always points FROM tooltip TO target element center.
```

**Coach mark sequence (multi-step):**

```
Step indicator: "1 of 3" — Label Small, top-right of tooltip
Progress dots: 3 filled/unfilled circles, 6dp each, 4dp gap
Navigation: "Next" advances, "Skip" dismisses entire sequence
Back navigation: allowed (show previous coach mark)
Max steps: 3 — if you need more, redesign the feature
```

**Coach mark rules:**
- [ ] Show only once per feature, per user (persist dismissal server-side)
- [ ] Never show more than one coach mark at a time
- [ ] Never show a coach mark on first launch — wait for the relevant context
- [ ] The dismiss action ("Skip" / "×") must be immediately visible — never hidden
- [ ] Tapping outside the tooltip dismisses it (same as "Skip")
- [ ] Tapping the spotlight target performs the actual action AND dismisses the mark
- [ ] Never block the user's current task — delay until task is complete
- [ ] Coach marks for gestures: show animated hand illustration, not just text

---

### 24.6 Empty State Onboarding

First-run empty states are the most underutilized onboarding surface. They appear exactly when the user is most receptive: they have just arrived at a feature and have no content yet.

**Empty state onboarding formula:**

```
[Illustration] + [Headline: opportunity framing] + [Body: how to start] + [Primary CTA]
```

**Empty state types and treatments:**

| Type | Headline Pattern | Body Pattern | CTA |
|---|---|---|---|
| **First-run** | "Your [X] will appear here" | "Tap [action] to add your first [X]" | Primary action button |
| **User-cleared** | "All caught up!" | Celebrate, suggest next action | Secondary suggestion |
| **No results** | "No results for '[query]'" | "Try different keywords or [suggestion]" | Clear filters / broaden search |
| **Error** | "Something went wrong" | Plain-language explanation | Retry |
| **Offline** | "You're offline" | "Connect to see your [X]" | Retry / show cached |

**First-run empty state — full spec:**

```
┌─────────────────────────────────┐
│                                 │
│                                 │
│      [Illustration]             │  ← 200×200dp max, centered
│      Contextual, not generic    │    Use product illustration style
│      Shows the feature in use   │    Not a sad face or empty box
│                                 │
│   Your saved places             │  ← Headline Small (24sp), centered
│   will appear here              │    on-surface color
│                                 │
│   Tap the bookmark icon on      │  ← Body Medium (14sp), centered
│   any place to save it for      │    on-surface-variant color
│   later.                        │    2–3 lines max
│                                 │
│   [ Explore nearby places ]     │  ← Filled button, centered
│                                 │    Action that leads to value
│                                 │
└─────────────────────────────────┘
```

**Illustration guidelines for empty states:**

| Rule | Specification |
|---|---|
| **Style** | Match product illustration system (Google uses outlined, friendly illustrations) |
| **Content** | Show the feature working, not the absence of content |
| **Color** | Use `primary-container` and `secondary-container` tones |
| **Size** | 160–200dp on mobile, 240dp on tablet |
| **Animation** | Optional subtle loop (Lottie), max 3s cycle, respects reduced motion |
| **Avoid** | Generic "empty box", sad faces, error iconography for first-run states |

**Interactive empty state (tutorial-as-empty-state):**

For features where the action is complex, the empty state can be an interactive tutorial:

```
Google Drive empty state (first run):
1. Shows illustration of dragging a file
2. "Drag files here or tap +" 
3. Dashed drop zone is interactive — user can actually drop a file
4. The empty state IS the first action surface
```

**Empty state checklist:**
- [ ] Every list, grid, and feed has a designed empty state
- [ ] First-run empty states teach, not just inform
- [ ] Empty state CTA leads directly to the action that fills the state
- [ ] "User-cleared" states celebrate, not mourn
- [ ] No-results states offer alternatives, not dead ends
- [ ] Illustrations are contextual and feature-specific

---

### 24.7 Contextual Help

Contextual help surfaces information at the moment of need, without requiring the user to leave their task.

**Help pattern hierarchy (least to most intrusive):**

| Pattern | Trigger | Dismissal | Persistence | Use Case |
|---|---|---|---|---|
| **Placeholder text** | Always visible when empty | Disappears on input | Permanent | Input field hints |
| **Helper text** | Always visible below field | Never | Permanent | Format requirements, tips |
| **Tooltip** | Hover (web) / long-press (mobile) | On blur/release | Permanent | Icon labels, term definitions |
| **Inline documentation** | Contextual, on first encounter | Dismiss (×) | One-time | Complex settings, new concepts |
| **Help chip** | Always visible | Tap to expand | Permanent | "How does this work?" |
| **Help bottom sheet** | Tap on help icon | Swipe down | On demand | Detailed explanations |

**Tooltip specifications:**

| Property | Value |
|---|---|
| **Background** | `md.sys.color.inverse-surface` |
| **Text color** | `md.sys.color.inverse-on-surface` |
| **Text style** | Body Small (12sp) |
| **Max width** | 200dp |
| **Padding** | 8dp vertical, 12dp horizontal |
| **Corner radius** | 4dp (`extraSmall`) |
| **Show delay (hover)** | 500ms (prevents flicker on mouse movement) |
| **Hide delay (hover)** | 200ms |
| **Show duration (long-press)** | Immediate |
| **Auto-dismiss** | 1500ms on mobile, on blur on web |
| **Max length** | 1 line preferred, 2 lines max |

**Helper text vs error text (same space, different states):**

```
[Text field label]
┌─────────────────────────────┐
│  user input here            │
└─────────────────────────────┘
Helper: "Use 8+ characters"       ← Body Small, on-surface-variant
Error:  "Must be 8+ characters"   ← Body Small, error color (replaces helper)
```

**Inline documentation pattern (for complex settings):**

```
┌─────────────────────────────────────────────┐
│  Smart features                             │
│  Use Gmail data to personalize your         │  ← Body Medium
│  experience across Google products.         │
│                                             │
│  Learn more ↗                               │  ← Text button, opens help article
│                                    [Toggle] │
└─────────────────────────────────────────────┘
```

**Contextual help checklist:**
- [ ] Every icon-only button has a tooltip
- [ ] Every text field has helper text if format is non-obvious
- [ ] Complex settings have inline "Learn more" links
- [ ] Help content is written at 8th-grade reading level
- [ ] Help links open in-app (bottom sheet or custom tab), not external browser
- [ ] Tooltips do not obscure the element they describe

---


---

## 22. Gestures, Touch & Haptics

> Gestures are the vocabulary of touch interfaces. Every gesture must be discoverable, learnable, forgiving, and always have a non-gesture alternative.

---

### 22.1 Standard Android Gesture Vocabulary

| Gesture | Definition | Activation Threshold | Primary Use Cases | Example |
|---|---|---|---|---|
| **Tap** | Single finger contact + release, no movement | <10dp movement, <300ms | Select, activate, navigate | Tap a button, open a list item |
| **Double-tap** | Two taps within 300ms, same target | Second tap within 300ms of first | Zoom in, like/favorite, expand | Maps: zoom in; Photos: zoom to fit |
| **Long press** | Finger held without movement | 500ms hold, <10dp movement | Context menu, drag initiation, multi-select | Gmail: long-press email to select |
| **Swipe** | Fast directional flick | >10dp movement, velocity >0.5dp/ms | Dismiss, navigate, reveal actions | Swipe to archive in Gmail |
| **Drag** | Slow directional movement with finger held | >10dp movement, velocity <0.5dp/ms | Reorder, move, resize | Drag to reorder in Google Tasks |
| **Pinch** | Two fingers moving toward/away each other | Two-pointer distance change >10dp | Zoom in/out | Maps, Photos pinch-to-zoom |
| **Spread (reverse pinch)** | Two fingers moving apart | Two-pointer distance change >10dp | Zoom in | Same as pinch, opposite direction |
| **Two-finger tap** | Two fingers tap simultaneously | Both contacts within 40ms | Zoom out (Maps), undo | Maps: two-finger tap to zoom out |
| **Rotate** | Two fingers rotating around a center point | Angular change >15° | Rotate map, rotate image | Maps: two-finger rotate |
| **Edge swipe** | Swipe beginning within 20dp of screen edge | Start within 20dp of edge | Back navigation, drawer | Android back gesture |

**Gesture design rules:**
- Every gesture must have a minimum activation threshold to prevent accidental triggers
- Gestures that begin ambiguously (e.g., diagonal) must resolve to the dominant axis within 20dp
- Never assign two different gestures to the same motion in the same context
- Gestures must produce immediate visual feedback within 16ms of contact

---

### 22.2 Gesture Conflict Resolution

When multiple gestures compete for the same touch event, a clear priority hierarchy must be established.

**Conflict Priority Hierarchy (highest to lowest):**

```
1. System gestures (Android back, home, recents) — always win
2. Edge gestures (drawer open, predictive back)
3. Component-level gestures (swipe-to-dismiss on a list item)
4. Container-level gestures (scroll on a ScrollView)
5. Global gestures (pull-to-refresh)
```

**Common conflict scenarios and resolutions:**

| Conflict | Resolution | Implementation |
|---|---|---|
| **Vertical scroll vs pull-to-refresh** | Pull-to-refresh only triggers when scroll position is at top (scrollY == 0) | Check `canScrollVertically(-1)` before enabling pull gesture |
| **Horizontal swipe-to-dismiss vs vertical scroll** | Lock axis on first 20dp of movement; if angle <45° from horizontal → swipe; else → scroll | Use `ViewDragHelper` with axis locking |
| **List item swipe vs list scroll** | Require horizontal movement >15dp before claiming the gesture; vertical movement >5dp cancels swipe | `onInterceptTouchEvent` with slop check |
| **Pinch-to-zoom vs scroll inside zoomable view** | When scale >1.0, scroll is consumed by the zoomed view; at scale ==1.0, parent scroll resumes | Track scale factor; delegate events accordingly |
| **Drag-to-reorder vs tap** | Long press (500ms) initiates drag; tap fires on release if no drag initiated | `ItemTouchHelper` with long-press drag trigger |
| **Bottom sheet drag vs content scroll** | Sheet drag only when content is scrolled to top; content scroll takes priority otherwise | `CoordinatorLayout` + `NestedScrollingChild` |
| **Edge swipe (back) vs drawer** | Drawer open gesture uses left edge (LTR); Android back uses both edges — drawer takes left edge when open | `DrawerLayout.setEdgeLock()` on right edge |

**Gesture disambiguation pattern:**

```
Touch DOWN
    ↓
Start gesture detection timer (20dp slop window)
    ↓
Movement detected?
├── Horizontal dominant (angle <45°) → candidate: swipe/drag
├── Vertical dominant (angle >45°) → candidate: scroll
└── No movement after 500ms → candidate: long press
    ↓
Confirm gesture when threshold met
    ↓
Cancel competing gesture recognizers (call requestDisallowInterceptTouchEvent)
```

---

### 22.3 Swipe Actions on List Items

Swipe actions on list items follow a strict left/right convention across Google products.

**Directional conventions (LTR layouts):**

| Direction | Convention | Rationale | Examples |
|---|---|---|---|
| **Swipe right** | Positive / primary action | Right = forward = affirmative | Gmail: Archive; Google Tasks: Complete |
| **Swipe left** | Destructive / secondary action | Left = back = remove | Gmail: Delete; Google Tasks: Delete |

> **RTL layouts:** Directions mirror. Swipe left = positive, swipe right = destructive.

**Swipe action reveal stages:**

| Stage | Threshold | Visual | Haptic |
|---|---|---|---|
| **Peek** | 1–40dp | Background color + icon visible | None |
| **Reveal** | 40–72dp | Icon + label visible, icon scales to 24dp | Light tick (selection changed) |
| **Commit threshold** | 72dp | Icon bounces, background fills | Medium impact |
| **Full swipe** | >screen width × 0.5 | Item slides fully off screen | Heavy impact |

**Swipe action anatomy:**

```
┌─────────────────────────────────────────────────────┐
│  [Archive icon + "Archive"]  │  List item content   │  ← Swiping right reveals left background
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  List item content  │  [Delete icon + "Delete"]     │  ← Swiping left reveals right background
└─────────────────────────────────────────────────────┘
```

**Implementation rules:**
- Background color: use `secondary-container` for positive actions, `error-container` for destructive
- Icon color: `on-secondary-container` / `on-error-container`
- Snap-back animation: `spring(stiffness=400, damping=0.75)` if threshold not met
- Commit animation: item slides to 0dp width over 200ms (`accelerate` easing), list collapses over 150ms
- Always provide an undo snackbar after a destructive full-swipe: "Deleted. Undo" (4s)
- Never use full-swipe for irreversible actions without undo

**Swipe action checklist:**
- [ ] Right swipe = positive action (archive, complete, approve)
- [ ] Left swipe = destructive action (delete, remove)
- [ ] Commit threshold set to 72dp minimum
- [ ] Haptic feedback at reveal and commit stages
- [ ] Undo snackbar shown after destructive actions
- [ ] Accessibility actions registered (`AccessibilityNodeInfoCompat.addAction`)
- [ ] RTL layout mirrors directions

---

### 22.4 Pull-to-Refresh

Pull-to-refresh signals the user's intent to fetch new content. It is a **supplementary** pattern — content should also refresh automatically when appropriate.

**When to use pull-to-refresh:**
- Feeds and timelines (Gmail inbox, Google News)
- Lists where new items may have appeared since last load
- **Do not use** on paginated search results, settings screens, or detail views

**Threshold and physics:**

| Parameter | Value | Notes |
|---|---|---|
| **Trigger threshold** | 80dp from top | Distance finger must travel before release triggers refresh |
| **Max pull distance** | 120dp | Rubber-band resistance beyond this point |
| **Resistance factor** | 0.5 | Indicator moves at 50% of finger movement (rubber-band feel) |
| **Indicator size** | 40dp diameter | Material circular progress indicator |
| **Indicator offset** | 16dp below top of content | Appears to emerge from behind the content |

**Pull-to-refresh state machine:**

```
IDLE (content at rest)
    ↓ user pulls down while scrollY == 0
PULLING (indicator appears, scales 0→1)
    ↓ pull distance < 80dp
    → release → IDLE (snap back, no refresh)
    ↓ pull distance ≥ 80dp
READY (indicator fills, haptic: medium impact)
    ↓ release
REFRESHING (indicator spins, content locked)
    ↓ data loaded
COMPLETING (indicator fades out, new content fades/slides in)
    ↓ 300ms
IDLE
```

**Animation specs:**

| Phase | Animation | Duration | Easing |
|---|---|---|---|
| Pull indicator appear | Scale 0→1, fade 0→1 | Follows finger | — |
| Snap back (no trigger) | Translate back to 0 | 200ms | `decelerate` |
| Refresh spinner | Continuous rotation | Until complete | Linear |
| Content refresh | New items fade+slide in from top | 300ms | `decelerate` |
| Indicator dismiss | Fade 1→0, scale 1→0 | 200ms | `accelerate` |

**Haptic feedback:**
- Crossing the 80dp trigger threshold: `HapticFeedbackConstants.CONFIRM` (medium impact)
- Refresh complete: `HapticFeedbackConstants.GESTURE_END` (light)

**Pull-to-refresh checklist:**
- [ ] Only enabled when `scrollY == 0`
- [ ] Trigger threshold is 80dp
- [ ] Rubber-band resistance applied beyond threshold
- [ ] Haptic at threshold crossing
- [ ] Spinner visible during network request
- [ ] New content animates in (not a jarring jump)
- [ ] Error state handled: show snackbar, dismiss indicator
- [ ] Accessible: "Refresh" button available for non-gesture users

---

### 22.5 Drag and Drop

Drag and drop enables direct manipulation of content. It must provide rich visual feedback at every stage.

**Drag lifecycle:**

```
IDLE
    ↓ long press (500ms) on draggable item
LIFT (item elevates, shadow appears, haptic: medium impact)
    ↓ finger moves
DRAGGING (item follows finger, drop targets highlight)
    ↓ finger over valid drop target
HOVERING (drop target pulses, haptic: selection changed)
    ↓ finger released over valid target
DROPPING (item animates to final position, haptic: heavy impact)
    ↓ 200ms settle animation
IDLE
    ↓ finger released over invalid target
CANCEL (item snaps back to origin, haptic: none)
```

**Visual feedback specifications:**

| State | Elevation | Scale | Opacity | Shadow |
|---|---|---|---|---|
| **Resting** | Level 0 | 1.0 | 1.0 | None |
| **Lift** | Level 3 (6dp) | 1.05 | 1.0 | `md.sys.elevation.level3` |
| **Dragging** | Level 3 (6dp) | 1.05 | 0.9 | `md.sys.elevation.level3` |
| **Over valid target** | Level 3 (6dp) | 1.05 | 1.0 | Stronger shadow |
| **Over invalid target** | Level 3 (6dp) | 1.05 | 0.5 | — |
| **Snap back** | Level 0 | 1.0 | 1.0 | Animates out over 200ms |

**Drop target visual feedback:**

| State | Visual Treatment |
|---|---|
| **Inactive** | Normal appearance |
| **Available** | Subtle highlight: `primary-container` at 30% opacity |
| **Hovered** | Strong highlight: `primary-container` at 80% + 2dp border in `primary` |
| **Invalid** | `error-container` at 30% opacity |

**Drag and drop rules:**
- Lift animation: scale 1.0→1.05 + elevation 0→6dp over `short3` (150ms), `decelerate` easing
- Dragged item renders above all other content (z-order elevation)
- Show a placeholder (ghost) at the original position during drag in reorder scenarios
- Placeholder: same dimensions as item, `surface-variant` fill, dashed `outline` border
- Drop animation: `spring(stiffness=300, damping=0.8)` to final position
- Snap-back animation: `spring(stiffness=400, damping=0.75)` to origin over max 300ms
- Auto-scroll: when dragging within 48dp of a scrollable container edge, scroll at 4dp/frame

**Accessibility alternative:**

Every drag-and-drop interaction must have a non-gesture alternative:

| Drag Action | Accessibility Alternative |
|---|---|
| Reorder list items | "Move up" / "Move down" accessibility actions on each item |
| Move item to folder | Long-press context menu → "Move to…" dialog |
| Resize panel | Numeric input or +/- buttons in overflow menu |
| Drag to canvas | Arrow key movement after selection, or coordinate input |

```kotlin
// Register accessibility actions for draggable list items
ViewCompat.setAccessibilityDelegate(itemView, object : AccessibilityDelegateCompat() {
    override fun onInitializeAccessibilityNodeInfo(host: View, info: AccessibilityNodeInfoCompat) {
        super.onInitializeAccessibilityNodeInfo(host, info)
        info.addAction(AccessibilityNodeInfoCompat.AccessibilityActionCompat(
            R.id.action_move_up, context.getString(R.string.move_up)))
        info.addAction(AccessibilityNodeInfoCompat.AccessibilityActionCompat(
            R.id.action_move_down, context.getString(R.string.move_down)))
    }
})
```

**Drag and drop checklist:**
- [ ] Long press (500ms) initiates drag — not shorter
- [ ] Haptic feedback on lift, hover, and drop
- [ ] Dragged item visually elevated (scale + shadow)
- [ ] Drop targets highlighted when item hovers over them
- [ ] Placeholder shown at origin during reorder
- [ ] Auto-scroll near container edges
- [ ] Snap-back on cancel with spring animation
- [ ] Accessibility actions registered for all drag operations

---

### 22.6 Pinch-to-Zoom

Pinch-to-zoom is the standard gesture for scaling content. It must feel physically accurate and have well-defined boundaries.

**Scale boundaries:**

| Content Type | Minimum Scale | Maximum Scale | Double-tap Target Scale |
|---|---|---|---|
| **Maps** | 0.5× (zoom out) | 21× (street level) | 2× from current |
| **Photos / Images** | 1.0× (fit to screen) | 5.0× | 2× or fit-to-width |
| **Documents (PDF)** | 0.5× | 4.0× | Fit-to-width |
| **Web content** | 0.25× | 5.0× | 2× |
| **Custom content** | Define per use case | Define per use case | 2× or fit |

**Snap-back behavior:**

| Condition | Behavior | Animation |
|---|---|---|
| Scale < minimum | Snap back to minimum scale | `spring(stiffness=400, damping=0.75)`, 300ms |
| Scale > maximum | Snap back to maximum scale | `spring(stiffness=400, damping=0.75)`, 300ms |
| Scale within bounds | Stay at released scale | None |
| Content panned outside bounds | Snap content back within bounds | `spring(stiffness=300, damping=0.8)`, 250ms |

**Double-tap to zoom:**

```
Current scale == minimum (fit)
    → Animate to 2× centered on tap point
    → Duration: medium2 (300ms), decelerate easing

Current scale > minimum
    → Animate back to minimum (fit)
    → Duration: medium2 (300ms), decelerate easing
```

Double-tap zoom must center on the tapped point, not the screen center. Calculate the focal point:

```kotlin
// Focal point calculation for double-tap zoom
val focusX = event.x  // tap x in view coordinates
val focusY = event.y  // tap y in view coordinates
val targetScale = if (currentScale <= minScale * 1.05f) 2f else minScale
// Translate so focal point stays fixed during scale
val dx = (focusX - viewWidth / 2f) * (1 - targetScale / currentScale)
val dy = (focusY - viewHeight / 2f) * (1 - targetScale / currentScale)
```

**Pinch-to-zoom rules:**
- Zoom is centered on the midpoint between the two fingers (focal point)
- Panning is allowed simultaneously with pinching (two-finger pan)
- At minimum scale, panning is disabled (content fits screen)
- At scale >1.0, panning is constrained to content bounds
- Overscroll is allowed up to 20% beyond bounds with rubber-band resistance (factor 0.3)
- Two-finger tap zooms out by 0.5× (Maps convention)
- Rotation gesture (two-finger rotate) is opt-in — only enable if content supports rotation (Maps)

**Pinch-to-zoom checklist:**
- [ ] Minimum and maximum scale defined
- [ ] Snap-back on over/under-scale with spring animation
- [ ] Double-tap toggles between fit and 2× at tap focal point
- [ ] Panning constrained to content bounds at scale >1.0
- [ ] Rubber-band overscroll (factor 0.3, max 20% beyond bounds)
- [ ] Two-finger tap zooms out (Maps pattern)
- [ ] Accessibility: zoom controls (+/−) available for non-gesture users

---

### 22.7 Edge Swipe: Back Gesture, Drawer & Predictive Back

**Android back gesture (gesture navigation mode):**

| Parameter | Value |
|---|---|
| **Trigger zone** | 20dp from left or right screen edge |
| **Activation** | Horizontal swipe beginning in trigger zone |
| **Cancel** | Swipe back toward edge before releasing |
| **Conflict with drawer** | Left edge opens drawer when drawer is present; right edge always triggers back |

**Predictive Back (Android 13+, required for target SDK 35+):**

Predictive back shows a preview of the back destination before the user commits.

```
Swipe begins from edge (20dp zone)
    ↓
Current screen scales down (0.9×) and shifts toward swipe direction
Back destination preview appears behind current screen
    ↓
User continues swipe → more of destination revealed
User releases past threshold (>50% of screen width) → back committed
User releases before threshold → current screen springs back (cancel)
```

**Predictive back visual specs:**

| Element | Value |
|---|---|
| **Current screen scale on full swipe** | 0.9× |
| **Current screen corner radius** | Animates to `extraLarge` (28dp) |
| **Back destination scale** | 0.95× → 1.0× on commit |
| **Background scrim** | `scrim` color role at 32% opacity |
| **Commit threshold** | 50% of screen width |
| **Spring back duration** | 300ms, `spring(stiffness=400, damping=0.75)` |

**Implementing predictive back (Android):**

```kotlin
// Register OnBackPressedCallback for predictive back
val callback = object : OnBackPressedCallback(true) {
    override fun handleOnBackStarted(backEvent: BackEventCompat) {
        // Begin animation: scale down current screen
    }
    override fun handleOnBackProgressed(backEvent: BackEventCompat) {
        // Update animation based on backEvent.progress (0.0–1.0)
        val scale = 1f - (0.1f * backEvent.progress)
        view.scaleX = scale; view.scaleY = scale
    }
    override fun handleOnBackPressed() {
        // Commit: complete transition
    }
    override fun handleOnBackCancelled() {
        // Spring back to original state
    }
}
onBackPressedDispatcher.addCallback(this, callback)
```

**Navigation drawer edge swipe:**

| Parameter | Value |
|---|---|
| **Open trigger zone** | 20dp from leading edge (left in LTR) |
| **Open threshold** | Drawer >50% visible → snaps open |
| **Close gesture** | Swipe toward leading edge OR tap scrim |
| **Scrim opacity** | 0% (closed) → 32% (fully open), linear with drag progress |
| **Drawer width** | min(screen width − 56dp, 360dp) |

**Edge swipe checklist:**
- [ ] Predictive back implemented for target SDK 35+
- [ ] `OnBackPressedCallback` used (not deprecated `onBackPressed()`)
- [ ] Current screen scales and rounds corners during predictive back
- [ ] Drawer edge zone does not conflict with back gesture (use `DrawerLayout`)
- [ ] Drawer scrim opacity animates with drag progress
- [ ] Back gesture works from both left and right edges (when no drawer)

---

### 22.8 Haptic Feedback Patterns

Haptic feedback is the tactile layer of the interaction model. Use it to confirm actions, signal state changes, and provide physical texture to gestures. **Never use haptics purely for decoration.**

**Haptic feedback taxonomy:**

| Pattern | Android Constant | Intensity | When to Use | Example |
|---|---|---|---|---|
| **Light tick** | `KEYBOARD_TAP` | Light | Key presses, selection changes, slider ticks | Typing on keyboard, moving a slider |
| **Selection changed** | `CLOCK_TICK` | Light | Scrolling through discrete options, picker changes | Time picker, segmented control |
| **Confirm / Threshold** | `CONFIRM` | Medium | Crossing a gesture threshold, successful action | Pull-to-refresh trigger, swipe commit |
| **Reject** | `REJECT` | Medium (double pulse) | Invalid action, error | Trying to drop on invalid target |
| **Medium impact** | `VIRTUAL_KEY` | Medium | Button press, item lift (drag), toggle | FAB press, drag lift |
| **Heavy impact** | `LONG_PRESS` | Heavy | Drag drop, destructive action commit | Drop item, full-swipe delete |
| **Gesture start** | `GESTURE_START` | Light | Beginning of a recognized gesture | Swipe begins |
| **Gesture end** | `GESTURE_END` | Light | Gesture completes successfully | Swipe completes, refresh done |
| **Notification** | `EFFECT_HEAVY_CLICK` | Heavy | Incoming notification, alert | New message arrives |
| **Text handle move** | `TEXT_HANDLE_MOVE` | Light | Dragging text selection handles | Adjusting text selection |

**Haptic intensity mapping to physical sensation:**

```
Light  → Barely perceptible tick; used for continuous feedback (scrolling, typing)
Medium → Clear, single pulse; used for discrete confirmations
Heavy  → Strong, definitive thud; used for significant or irreversible moments
Double → Two quick pulses; used for rejection/error
```

**Haptic feedback rules:**
- Always check `hasVibrator()` and `areHapticsAvailable()` before triggering
- Respect system haptic intensity settings — never override with custom amplitude unless building a game/creative tool
- Do not trigger haptics more frequently than every 50ms (prevents vibration blur)
- Haptics must be synchronous with the visual event — a 16ms delay is perceptible
- Never use haptics as the sole feedback channel — always pair with visual feedback

```kotlin
// Correct: use ViewCompat for backward-compatible haptics
view.performHapticFeedback(HapticFeedbackConstants.CONFIRM)

// For custom patterns (API 26+):
val vibrator = getSystemService(Vibrator::class.java)
vibrator.vibrate(VibrationEffect.createPredefined(VibrationEffect.EFFECT_CLICK))
```

**Haptic feedback checklist:**
- [ ] Haptics paired with every gesture threshold crossing
- [ ] Haptics paired with drag lift and drop
- [ ] Haptics paired with destructive action commits
- [ ] No haptic-only feedback (always paired with visual)
- [ ] Frequency ≤1 haptic per 50ms for continuous gestures
- [ ] System haptic settings respected

---

### 22.9 Touch Feedback: Ripple, Highlight & Active State

Touch feedback makes the interface feel physically responsive. Every interactive element must respond to touch within 16ms.

**Ripple effect rules:**

| Property | Value | Notes |
|---|---|---|
| **Ripple color** | `on-surface` at 12% opacity (light) / 16% (dark) | Use `?attr/colorControlHighlight` |
| **Ripple origin** | Touch point (bounded) or center (unbounded for icons) | Bounded for containers, unbounded for icon buttons |
| **Ripple radius** | Expands to cover entire touch target | Max radius = distance to farthest corner |
| **Ripple enter duration** | 225ms | `decelerate` easing |
| **Ripple exit duration** | 150ms | `accelerate` easing (on finger lift) |
| **Ripple exit on cancel** | Immediate fade, 100ms | When gesture is cancelled |
| **Bounded ripple** | Clipped to component bounds | Buttons, cards, list items |
| **Unbounded ripple** | Extends beyond component bounds | Icon buttons, checkboxes |

**State layer opacities (applied over component color):**

| State | Opacity | Color |
|---|---|---|
| **Hover** | 8% | `on-surface` or `on-primary` |
| **Focus** | 12% | `on-surface` or `on-primary` |
| **Pressed** | 12% | `on-surface` or `on-primary` |
| **Dragged** | 16% | `on-surface` |
| **Selected** | 8% | `on-surface` |
| **Disabled** | 38% opacity on content, 12% on container | — |

**Active state rules:**
- Active/selected state must be distinguishable from resting state by more than color alone (use shape, weight, or icon change)
- Focus state must have a visible focus ring: 3dp `primary` color outline, 3dp offset from component bounds
- Pressed state must be visually distinct from hover state (deeper state layer)
- Never remove the focus indicator — it is required for keyboard and switch access users

**Touch feedback implementation:**

```xml
<!-- Correct: use RippleDrawable with state list -->
<ripple xmlns:android="http://schemas.android.com/apk/res/android"
    android:color="?attr/colorControlHighlight">
    <item android:id="@android:id/mask">
        <shape android:shape="rectangle">
            <corners android:radius="@dimen/md_shape_medium" />
        </shape>
    </item>
</ripple>
```

**Touch feedback checklist:**
- [ ] All interactive elements have ripple feedback
- [ ] Ripple color uses `colorControlHighlight` token (not hardcoded)
- [ ] Bounded ripple for containers, unbounded for icon buttons
- [ ] Focus ring visible (3dp, `primary` color)
- [ ] Disabled state at 38% opacity
- [ ] Active state distinguishable without color alone

---

### 22.10 Pointer Events: Mouse, Touch & Stylus

Modern Android and web apps must handle three pointer types with a unified event model while adapting behavior per device.

**Pointer type comparison:**

| Dimension | Touch (finger) | Mouse / Trackpad | Stylus |
|---|---|---|---|
| **Precision** | Low (~10mm contact) | High (1px) | High (1–2mm tip) |
| **Hover** | No | Yes | Yes (when hovering) |
| **Pressure** | Limited (some devices) | No | Yes (256+ levels) |
| **Tilt / Orientation** | No | No | Yes |
| **Minimum touch target** | 48×48dp | 24×24dp (hover state sufficient) | 32×32dp |
| **Context menu trigger** | Long press | Right-click | Long press or barrel button |
| **Text selection** | Long press → handles | Click-drag | Long press → handles |
| **Scroll** | Swipe | Scroll wheel / two-finger | Swipe (palm rejection needed) |

**Unified pointer event handling (Android):**

```kotlin
view.setOnGenericMotionListener { v, event ->
    when (event.actionMasked) {
        MotionEvent.ACTION_HOVER_ENTER -> showHoverState(v)
        MotionEvent.ACTION_HOVER_EXIT  -> clearHoverState(v)
        MotionEvent.ACTION_SCROLL     -> handleScroll(event.getAxisValue(MotionEvent.AXIS_VSCROLL))
        else -> false
    }
    true
}

// Detect pointer type
val pointerType = event.getToolType(0)  // TOOL_TYPE_FINGER, TOOL_TYPE_MOUSE, TOOL_TYPE_STYLUS
```

**Hover state (mouse/stylus):**
- Show hover state layer (8% `on-surface`) on `ACTION_HOVER_ENTER`
- Show tooltip on hover after 500ms delay (dismiss on `ACTION_HOVER_EXIT`)
- Cursor must change to `pointer` (hand) over interactive elements, `text` over text, `grab` over draggable items

**Stylus-specific adaptations:**

| Feature | Implementation |
|---|---|
| **Pressure sensitivity** | `event.pressure` (0.0–1.0) — use for brush size, line weight in creative apps |
| **Tilt** | `event.getAxisValue(AXIS_TILT)` — use for shading in drawing apps |
| **Palm rejection** | Reject `TOOL_TYPE_FINGER` events when stylus is active and contact area is large |
| **Barrel button** | `event.isButtonPressed(MotionEvent.BUTTON_STYLUS_PRIMARY)` → context menu |
| **Eraser** | `TOOL_TYPE_ERASER` — switch to erase mode automatically |

**Pointer events checklist:**
- [ ] Hover states implemented for mouse/stylus
- [ ] Cursor type changes per interactive element type
- [ ] Touch targets remain 48dp for touch; can be smaller for mouse-only UI
- [ ] Right-click / barrel button opens context menu
- [ ] Stylus pressure handled in creative/input contexts
- [ ] Palm rejection active when stylus is in use
- [ ] Scroll wheel handled for mouse users

---

### 22.11 Gesture Accessibility

**Core rule: every gesture must have a non-gesture alternative.** Users with motor disabilities, those using switch access, or those using TalkBack cannot perform multi-finger or precise gestures.

**Gesture → accessibility alternative mapping:**

| Gesture | Accessibility Alternative | Implementation |
|---|---|---|
| Swipe to archive/delete | Accessibility action: "Archive" / "Delete" | `AccessibilityNodeInfoCompat.addAction()` |
| Pull-to-refresh | "Refresh" button in toolbar or overflow menu | Always-visible or overflow menu item |
| Drag to reorder | "Move up" / "Move down" accessibility actions | Custom `AccessibilityAction` on each item |
| Pinch-to-zoom | Zoom in/out buttons (+/−) or volume key zoom | `ZoomButtonsController` or custom buttons |
| Long press for context menu | Three-dot overflow menu or dedicated button | Always-visible overflow icon |
| Double-tap to like | Dedicated like button always visible | Icon button in UI |
| Edge swipe (back) | System back button (3-button nav) or Up button in app bar | `NavigationIcon` in `TopAppBar` |
| Swipe between tabs | Tab bar always visible and tappable | `TabLayout` with visible tabs |
| Two-finger scroll | Standard single-finger scroll (TalkBack handles this) | No extra work needed |

**TalkBack gesture remapping:**
TalkBack intercepts all touch gestures and remaps them. Your app's custom gestures will not work in TalkBack mode unless registered as accessibility actions.

```kotlin
// Expose swipe actions to TalkBack
ViewCompat.setAccessibilityDelegate(itemView, object : AccessibilityDelegateCompat() {
    override fun onInitializeAccessibilityNodeInfo(host: View, info: AccessibilityNodeInfoCompat) {
        super.onInitializeAccessibilityNodeInfo(host, info)
        info.addAction(AccessibilityNodeInfoCompat.AccessibilityActionCompat(
            AccessibilityNodeInfoCompat.ACTION_DISMISS, "Archive"))
        info.addAction(AccessibilityNodeInfoCompat.AccessibilityActionCompat(
            R.id.action_delete, "Delete"))
    }
    override fun performAccessibilityAction(host: View, action: Int, args: Bundle?): Boolean {
        return when (action) {
            AccessibilityNodeInfoCompat.ACTION_DISMISS -> { archiveItem(); true }
            R.id.action_delete -> { deleteItem(); true }
            else -> super.performAccessibilityAction(host, args = args, action = action)
        }
    }
})
```

**Switch access compatibility:**
- All interactive elements must be reachable via sequential focus (Tab / directional pad)
- Drag-and-drop must have keyboard/switch alternative
- No action should require simultaneous multi-key or multi-touch input

**Gesture accessibility checklist:**
- [ ] Every swipe action has an equivalent accessibility action registered
- [ ] Pull-to-refresh has a "Refresh" button alternative
- [ ] Drag-to-reorder has "Move up/down" accessibility actions
- [ ] Pinch-to-zoom has +/− button alternatives
- [ ] Long-press context menu accessible via overflow button
- [ ] All gestures work with TalkBack enabled (via registered actions)
- [ ] All gestures work with Switch Access (sequential focus)
- [ ] Tested with TalkBack enabled end-to-end

---

### 22.12 Custom Gesture Design

When standard gestures are insufficient, custom gestures may be designed. They must meet strict criteria for discoverability, learnability, and error tolerance.

**Custom gesture evaluation criteria:**

| Criterion | Question to Answer | Threshold |
|---|---|---|
| **Necessity** | Does a standard gesture already cover this? | Only proceed if no standard gesture fits |
| **Discoverability** | How does the user learn this gesture exists? | Must be discoverable without documentation |
| **Learnability** | Can a user remember it after one use? | Must be memorable and consistent with mental model |
| **Error tolerance** | What happens if the gesture is performed imprecisely? | Must degrade gracefully; no destructive accidental triggers |
| **Conflict** | Does it conflict with system or standard gestures? | Must not conflict |
| **Accessibility** | Does it have a non-gesture alternative? | Required — no exceptions |

**Discoverability patterns for custom gestures:**

| Pattern | When to Use | Example |
|---|---|---|
| **Affordance animation** | On first launch or feature introduction | Subtle bounce/pulse on a draggable element |
| **Contextual tooltip** | First time user encounters the element | "Swipe to reveal options" tooltip on first list item |
| **Onboarding coach mark** | Complex or non-obvious gesture | Animated hand showing the gesture path |
| **Empty state instruction** | When the gesture is the primary interaction | "Swipe cards to explore" in empty feed |
| **Overflow menu fallback** | Always | The gesture is a shortcut; the action is always in a menu |

**Error tolerance design:**

| Error Type | Design Response |
|---|---|
| **Gesture started but not completed** | Snap back to original state with spring animation |
| **Wrong direction** | Ignore and allow correct gesture; do not trigger wrong action |
| **Accidental trigger** | Provide immediate undo (snackbar "Undo", 4s) |
| **Gesture too slow/fast** | Widen velocity tolerance; use distance threshold as primary trigger |
| **Imprecise start point** | Use generous hit slop (minimum 8dp beyond visual bounds) |

**Custom gesture design checklist:**
- [ ] No standard gesture covers this use case
- [ ] Gesture is discoverable without reading documentation
- [ ] Contextual tooltip or affordance animation on first encounter
- [ ] Overflow menu or button always available as fallback
- [ ] Gesture does not conflict with system gestures or standard patterns
- [ ] Error tolerance: snap-back on incomplete gesture
- [ ] Undo available for any state-changing custom gesture
- [ ] Accessibility alternative registered
- [ ] Tested with users who have never seen the gesture before (≥5 users)
- [ ] Gesture is consistent across all instances in the app (same gesture = same action everywhere)

---

### 22.13 Gestures, Touch & Haptics — Master Checklist

**Gesture vocabulary**
- [ ] All six standard gestures (tap, long press, swipe, drag, pinch, double-tap) behave per spec
- [ ] Gesture thresholds match platform standards (long press = 500ms, swipe = 10dp + velocity)

**Conflict resolution**
- [ ] Gesture priority hierarchy documented and implemented
- [ ] Axis locking resolves scroll vs swipe conflicts within 20dp
- [ ] `requestDisallowInterceptTouchEvent` called when gesture is claimed

**Swipe actions**
- [ ] Right swipe = positive action, left swipe = destructive (LTR)
- [ ] RTL layouts mirror swipe directions
- [ ] Commit threshold = 72dp minimum
- [ ] Undo snackbar after destructive swipe

**Pull-to-refresh**
- [ ] Trigger threshold = 80dp, resistance factor = 0.5
- [ ] Only active when `scrollY == 0`
- [ ] Haptic at threshold crossing

**Drag and drop**
- [ ] Long press (500ms) initiates drag
- [ ] Lift: scale 1.05×, elevation Level 3
- [ ] Accessibility actions for all drag operations

**Pinch-to-zoom**
- [ ] Min/max scale defined per content type
- [ ] Snap-back with spring animation on over/under-scale
- [ ] Double-tap toggles fit ↔ 2× at focal point

**Edge swipe**
- [ ] Predictive back implemented (target SDK 35+)
- [ ] `OnBackPressedCallback` used
- [ ] Drawer does not conflict with back gesture

**Haptics**
- [ ] Haptics paired with all gesture thresholds and significant actions
- [ ] No haptic-only feedback
- [ ] Frequency ≤1 per 50ms for continuous gestures

**Touch feedback**
- [ ] Ripple on all interactive elements
- [ ] Focus ring visible (3dp, `primary`)
- [ ] Disabled state at 38% opacity

**Pointer events**
- [ ] Hover states for mouse/stylus
- [ ] Cursor type changes per element
- [ ] Stylus pressure handled in creative contexts

**Accessibility**
- [ ] Every gesture has a registered accessibility action alternative
- [ ] Tested with TalkBack enabled
- [ ] Tested with Switch Access

**Custom gestures**
- [ ] Discoverable without documentation
- [ ] Overflow menu fallback always present
- [ ] Undo available for state-changing custom gestures

---


---

## 23. Notifications & Communication Patterns

> Notifications are the most powerful — and most abused — channel in a product's communication toolkit. Google's philosophy: **every notification must earn its place**. A notification that doesn't serve the user's immediate needs is a withdrawal from the trust account. Too many withdrawals and the user revokes permission entirely.

---

### 23.1 Notification Types & Rules

There are four canonical notification types. Each has strict rules governing frequency, tone, and opt-in requirements.

| Type | Definition | Opt-in Required | Max Frequency | Tone | Example |
|---|---|---|---|---|---|
| **Transactional** | Triggered by a user action or a direct consequence of one | No (implicit consent) | Per event | Factual, brief | "Your order has shipped", "Password changed" |
| **Promotional** | Marketing, offers, re-engagement | Yes (explicit) | ≤3/week | Persuasive, value-forward | "You have 500 points expiring soon" |
| **Social** | Activity from other users directed at the user | Yes (explicit, per type) | Per event, capped | Personal, contextual | "Ana commented on your photo" |
| **System** | Device/app health, required action, policy | No (critical) | Sparingly | Neutral, urgent only if truly urgent | "Storage almost full", "App update required" |

**Rules per type:**

**Transactional**
- Send immediately on the triggering event — delay erodes trust
- Never bundle transactional notifications into a digest; they are time-sensitive
- Include enough context to be actionable without opening the app
- Do not upsell or cross-promote inside a transactional notification

**Promotional**
- Require explicit opt-in before sending the first promotional notification
- Honor frequency caps even if the user has not explicitly set them
- Every promotional notification must have a one-tap unsubscribe path
- A/B test subject lines and send times; never guess

**Social**
- Group by actor, not by action: "Ana liked 3 of your photos" not three separate notifications
- Respect the recipient's relationship to the actor (muted users, blocked users)
- Never notify about activity the user cannot see (e.g., private post they were removed from)
- Provide per-person and per-type muting controls

**System**
- Reserve `IMPORTANCE_HIGH` / critical priority for genuinely urgent system events
- Never use system notification styling for promotional content — this is a dark pattern
- Provide a resolution path inside the notification (deep link to the relevant setting)
- Auto-dismiss once the condition is resolved

---

### 23.2 Notification Permission Request

#### When to Ask

The single most common mistake: asking for notification permission on first launch. Google's rule: **ask only after the user has experienced value and has a clear reason to say yes**.

```
Decision tree — when to request permission:

Has the user completed at least one meaningful action?
├── NO → Do not ask. Show value first.
└── YES → Is there a specific, imminent notification the user would want?
    ├── NO → Do not ask yet. Wait for a natural trigger.
    └── YES → Is the user in a context where they can evaluate the value?
        ├── NO → Defer to a better moment.
        └── YES → Show pre-permission rationale, then request.
```

**Optimal trigger moments (by product type):**

| Product Type | Right Moment to Ask |
|---|---|
| E-commerce | After order placed ("Notify you when it ships?") |
| Messaging | After sending the first message ("Get notified when Ana replies?") |
| News/content | After user saves or bookmarks an article |
| Productivity | After user creates a task or sets a deadline |
| Social | After user posts content for the first time |
| Finance | After user links an account or makes a transaction |

#### How to Ask — Pre-Permission Rationale

On Android 13+ and iOS, the OS permission dialog is a one-shot opportunity. Prime it with a pre-permission rationale screen:

```
┌─────────────────────────────────────┐
│  🔔                                 │
│                                     │
│  Stay on top of your orders         │
│                                     │
│  Get notified when your package     │
│  ships, arrives, or needs           │
│  attention — no app-checking        │
│  required.                          │
│                                     │
│  [Turn on notifications]  [Not now] │
└─────────────────────────────────────┘
```

**Pre-permission rationale rules:**
- [ ] One specific, concrete benefit — not a generic "stay up to date"
- [ ] Show an example of the notification they will receive
- [ ] "Not now" is always present and equally accessible (no confirmshaming)
- [ ] Never say "Don't miss out" or use FOMO language
- [ ] If the user taps "Not now", wait at least 7 days before asking again
- [ ] Never ask more than twice; after two dismissals, stop asking

#### What to Show if Permission is Denied

```
Permission denied flow:

User denies OS permission dialog
    ↓
Do NOT show another dialog immediately
    ↓
Surface a non-intrusive in-app banner at a relevant moment:
"You've turned off notifications. [Enable in Settings]"
    ↓
If user taps "Enable in Settings" → deep link to app notification settings
    ↓
On return to app → check permission status and update UI accordingly
```

**Denied-state UI rules:**
- Never show a persistent banner — show it once per session at most
- Never disable features because notifications are off (notifications are enhancement, not requirement)
- In the app's settings screen, always show current notification permission status with a direct link to OS settings

---

### 23.3 Push Notification Anatomy

A well-formed push notification has six elements. Each has specific constraints.

```
┌──────────────────────────────────────────────────┐
│ [App Icon 40dp]  App Name · Timestamp            │
│                                                  │
│ Title (1 line, ≤50 chars)                        │
│ Body text (2 lines max, ≤100 chars recommended)  │
│                                                  │
│ [Large Image — 2:1 ratio, optional]              │
│                                                  │
│ [Action 1]  [Action 2]  [Action 3 max]           │
└──────────────────────────────────────────────────┘
```

| Element | Spec | Rules |
|---|---|---|
| **Small icon** | 24×24dp, monochrome, alpha-only | Must be monochrome — Android renders it in the notification tray color. Never use a full-color icon here. |
| **Large icon** | 64×64dp, shown in expanded view | Use sender avatar for messaging; app icon for system/transactional |
| **Title** | ≤50 characters, 1 line | Most important information first; truncated on small screens |
| **Body** | ≤100 chars recommended, 2 lines collapsed / up to 5 lines expanded | Do not repeat the title. Add context, not noise. |
| **Large image** | 2:1 aspect ratio (e.g., 1024×512px) | Optional. Use for rich media (photo, map, product image). Never use for text-only content. |
| **Actions** | Max 3, label ≤20 chars each | Actions must be immediately executable without opening the app. Destructive actions (Delete) go last. |
| **Timestamp** | Auto-generated by OS | Do not fake or manipulate timestamps |

**Title writing rules:**
```
✓ "Your package has been delivered"       — specific, actionable
✓ "Ana replied to your comment"           — personal, contextual
✗ "You have a new notification"           — meaningless
✗ "🔥 Don't miss this deal!!!"            — promotional spam pattern
✗ "Update available"                      — vague; say what changed
```

**Body writing rules:**
```
✓ "Left at front door · 2:34 PM"          — adds context title doesn't have
✓ "\"Looks great! When can we meet?\""    — shows actual content
✗ "Tap to see more"                       — wastes the body slot
✗ Repeating the title verbatim            — redundant
```


---


---

## 24. Onboarding & Feature Discovery (Deep Dive)

> Onboarding is not a screen — it is the entire arc from first launch to first value. Google's standard: earn trust before asking for anything, deliver value before requesting commitment.

### 24.1 Onboarding Models — When to Use Each

Three primary onboarding models exist. Choosing the wrong one is the single most common cause of poor activation rates.

| Model | Core Premise | When Appropriate | When to Avoid | Google Example |
|---|---|---|---|---|
| **Immediate Value** | Drop user directly into the product; no gates | Utility apps where value is self-evident on first use | Apps requiring account for core functionality | Google Search, Maps (pre-login) |
| **Progressive** | Reveal features and requests as the user needs them | Most consumer apps; when value can be shown before commitment | Apps where personalization is required for any value | Gmail, YouTube, Google Photos |
| **Account-First** | Require sign-in before showing anything | Apps where the product IS the account (e.g., banking, enterprise) | Consumer apps — kills conversion | Google Workspace admin console |

**Decision tree — which model to use:**

```
Can the user experience core value without an account?
├── YES → Immediate Value or Progressive
│   ├── Does the experience improve significantly with personalization?
│   │   ├── YES → Progressive (show value first, collect data second)
│   │   └── NO  → Immediate Value (no onboarding at all)
└── NO  → Is this a consumer app?
    ├── YES → Reconsider architecture — can a guest mode be added?
    │   ├── YES → Progressive with guest mode
    │   └── NO  → Account-First (accept lower conversion)
    └── NO  → Account-First is appropriate
```

**Progressive onboarding phases:**

| Phase | Trigger | Goal | Ask |
|---|---|---|---|
| **Phase 0 — Arrival** | First launch | Communicate value in 3s | Nothing |
| **Phase 1 — First value** | First meaningful action | Prove the product works | Nothing |
| **Phase 2 — Hook** | After "aha moment" | Build desire to return | Optional sign-in |
| **Phase 3 — Commitment** | After 2–3 sessions | Convert to account | Sign-up |
| **Phase 4 — Depth** | Regular user | Unlock power features | Permissions, preferences |

**The "aha moment" by product:**

| Product | Aha Moment | Median Time to Aha |
|---|---|---|
| Google Maps | First successful navigation | <60s |
| Google Photos | First auto-created memory/album | 24–48h (background) |
| YouTube | First video that matches taste | <5 min |
| Google Drive | First file accessible on second device | 1–2 days |

---

### 24.2 Sign-Up Flow Optimization

Sign-up is the highest-friction moment in onboarding. Every unnecessary field costs conversion.

**Authentication method order (highest to lowest conversion):**

| Rank | Method | Conversion Lift | Friction | When to Prioritize |
|---|---|---|---|---|
| 1 | **Google Sign-In (one tap)** | Baseline +40% | Near-zero | Always offer if on Android/web |
| 2 | **Apple Sign-In** | Baseline +25% | Near-zero | Required on iOS if any social login offered |
| 3 | **Phone number (OTP)** | Baseline +15% | Low | Emerging markets, SMS-native users |
| 4 | **Email + password** | Baseline | Medium | Universal fallback |
| 5 | **Email magic link** | Baseline +5% | Low | When password managers are uncommon |
| 6 | **Username + password** | Baseline −20% | High | Avoid for consumer apps |

**Sign-up screen layout (Material You):**

```
┌─────────────────────────────────┐
│  [App logo]                     │
│  Create your account            │  ← Headline Large (32sp)
│  [Subtext: value prop, 1 line]  │  ← Body Medium (14sp), on-surface-variant
│                                 │
│  ┌─────────────────────────┐    │
│  │  G  Continue with Google│    │  ← Outlined button, full width
│  └─────────────────────────┘    │
│  ┌─────────────────────────┐    │
│  │    Continue with Apple  │    │  ← Outlined button (iOS only)
│  └─────────────────────────┘    │
│                                 │
│  ──────────── or ────────────   │  ← Divider with label
│                                 │
│  [Email text field]             │
│  [Continue →]                   │  ← Filled button
│                                 │
│  Already have an account? Sign in│ ← Body Small, text button inline
└─────────────────────────────────┘
```

**Friction reduction rules:**

| Rule | Specification | Rationale |
|---|---|---|
| **Never ask for name at sign-up** | Pull from Google/Apple profile | Reduces fields by 2 |
| **Never ask for birthday unless legally required** | Defer or skip | High abandonment field |
| **Password requirements shown upfront** | Inline helper text, not on error | Prevents failed attempts |
| **Auto-advance on OTP entry** | Move focus after last digit | Removes one tap |
| **Autofill support** | `autocomplete` attributes on all fields | Reduces typing by 80% |
| **Single-screen sign-up** | Max 2 fields visible at once | Reduces perceived length |
| **Progress indicator for multi-step** | "Step 1 of 3" | Sets expectations |
| **Preserve input on back** | Never clear fields on navigation | Prevents rage-quits |

**HTML autocomplete attributes (web):**

```html
<input type="email" autocomplete="email" />
<input type="password" autocomplete="new-password" />
<input type="tel" autocomplete="tel" />
<input type="text" autocomplete="given-name" />
```

**Android credential manager integration:**

```kotlin
// Trigger One Tap sign-in — lowest friction path
val request = GetCredentialRequest.Builder()
    .addCredentialOption(GetGoogleIdOption.Builder()
        .setFilterByAuthorizedAccounts(true) // returning users first
        .setServerClientId(CLIENT_ID)
        .build())
    .build()
```

**Post-sign-up: what NOT to do:**
- Do not show a "Welcome" splash screen — go directly to the product
- Do not ask for notification permission immediately after sign-up
- Do not show a feature tour — let the user explore
- Do not require email verification before showing any value (verify in background, gate only sensitive actions)

---

### 24.3 Permission Request Patterns

Permissions are trust transactions. Request them at the moment of maximum motivation, with maximum context.

**The three permission patterns:**

| Pattern | When to Use | Conversion Rate | Risk |
|---|---|---|---|
| **Just-in-Time (JIT)** | Request at the exact moment the feature is needed | Highest (~75%) | None — gold standard |
| **Pre-permission rationale** | Show custom UI before the OS dialog | High (~65%) | Adds one step |
| **Upfront (on launch)** | Request before any context | Lowest (~25%) | Trains users to deny |

**Just-in-time trigger points:**

| Permission | JIT Trigger | Example |
|---|---|---|
| **Location** | User taps "Find nearby" or "Navigate" | Maps: request on first navigation tap |
| **Camera** | User taps camera/scan button | Lens: request on camera button tap |
| **Microphone** | User taps voice input | Search: request on mic button tap |
| **Notifications** | After user completes first meaningful action | Gmail: request after first email sent |
| **Contacts** | User taps "Invite friends" or "Find contacts" | Request on that specific action |
| **Storage** | User taps "Save" or "Download" | Request at save action |

**Pre-permission rationale screen anatomy:**

```
┌─────────────────────────────────┐
│                                 │
│        [Feature illustration]   │  ← 120×120dp, contextual
│                                 │
│   Allow [App] to use your       │  ← Title Large (22sp)
│   location                      │
│                                 │
│   [App] uses your location to   │  ← Body Medium (14sp)
│   show nearby places and give   │    2–3 lines max
│   accurate directions.          │
│                                 │
│   Your location is never shared │  ← Body Small (12sp), reassurance
│   without your permission.      │    on-surface-variant color
│                                 │
│   [    Continue    ]            │  ← Filled button → triggers OS dialog
│   [  Not right now ]            │  ← Text button → graceful denial
└─────────────────────────────────┘
```

**Graceful denial handling — the three states:**

| State | What Happened | UI Response | Recovery Path |
|---|---|---|---|
| **Soft denial** | User tapped "Not now" on rationale screen | Hide the feature, show reduced-functionality state | Re-prompt JIT on next relevant action (max once per session) |
| **OS denial (first time)** | User denied the OS dialog | Show inline explanation of what's unavailable | Offer "Enable in Settings" deep link |
| **OS denial (permanent)** | User selected "Don't ask again" | Show persistent but non-blocking banner | Deep link to app settings: `Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS)` |

**Graceful denial UI pattern:**

```
┌─────────────────────────────────────────────────┐
│  📍 Location access needed for directions        │
│  Open Settings to enable                    [→]  │  ← Banner, not dialog
└─────────────────────────────────────────────────┘
```

**Permission request checklist:**
- [ ] Never request permissions on first launch
- [ ] Always explain WHY before the OS dialog (pre-permission rationale)
- [ ] Request only the minimum permission level (coarse location before precise)
- [ ] Handle denial gracefully — app must still function at reduced capacity
- [ ] Deep link to settings for permanently denied permissions
- [ ] Never re-request a denied permission in the same session
- [ ] Test the "denied" path as thoroughly as the "granted" path

---

### 18.5 Icon Color Rules

Icons use color roles from the M3 system — never hardcoded hex values.

| State | Color Role | Token | Usage |
|---|---|---|---|
| **Inactive** | `on-surface-variant` | `md.sys.color.on-surface-variant` | Default icons in nav bars, toolbars, list items |
| **Active / Selected** | `on-secondary-container` | `md.sys.color.on-secondary-container` | Active nav item icon (inside active indicator pill) |
| **Emphasis / Primary action** | `primary` | `md.sys.color.primary` | FAB icon, key action icons |
| **Disabled** | `on-surface` at 38% opacity | `md.sys.color.on-surface` + `alpha: 0.38` | Disabled button icons |
| **Error** | `error` | `md.sys.color.error` | Error state icons (e.g., warning in a text field) |
| **On filled surface** | `on-primary` | `md.sys.color.on-primary` | Icons inside filled buttons, filled FAB |
| **Inverse** | `inverse-on-surface` | `md.sys.color.inverse-on-surface` | Icons on snackbars, dark overlays |

```css
/* CSS custom properties mapped to M3 color roles */
.icon--inactive  { color: var(--md-sys-color-on-surface-variant); }
.icon--active    { color: var(--md-sys-color-on-secondary-container); }
.icon--primary   { color: var(--md-sys-color-primary); }
.icon--disabled  { color: var(--md-sys-color-on-surface); opacity: 0.38; }
.icon--error     { color: var(--md-sys-color-error); }
```

**Color rules:**
- Never use `on-surface` (full black/white) for inactive icons — it creates false emphasis. Use `on-surface-variant` (softer tone).
- The active indicator pill in bottom nav uses `secondary-container` as background; the icon inside uses `on-secondary-container`.
- Icon color must meet 3:1 contrast ratio against its background (WCAG for UI components).
- In dark mode, `GRAD: -25` compensates for the optical blooming effect of light icons on dark backgrounds — apply this alongside the color role change.
- Two-tone icons: the primary layer uses the color role at 100% opacity; the secondary layer uses the same color role at 40% opacity.

```xml
<!-- Android: reference color roles via theme attributes -->
<ImageView
    app:tint="?attr/colorOnSurfaceVariant" />   <!-- inactive -->
<ImageView
    app:tint="?attr/colorOnSecondaryContainer" /> <!-- active in nav -->
<ImageView
    app:tint="?attr/colorPrimary" />             <!-- emphasis -->
```

---

### 18.6 Icon + Label Patterns

#### Spacing and Alignment

| Context | Icon–Label Gap | Alignment | Label Style |
|---|---|---|---|
| **Bottom nav item** | 4dp (icon above label) | Center-aligned | Label Small (11sp, Medium 500) |
| **Navigation rail item** | 4dp (icon above label) | Center-aligned | Label Medium (12sp, Medium 500) |
| **Button (leading icon)** | 8dp | Vertical center | Label Large (14sp, Medium 500) |
| **List item (leading icon)** | 16dp | Vertical center (optical) | Body Large (16sp) |
| **Chip (leading icon)** | 8dp | Vertical center | Label Large (14sp) |
| **Tab (icon above label)** | 4dp | Center-aligned | Label Medium (12sp) |
| **Menu item (leading icon)** | 12dp | Vertical center | Body Large (16sp) |

```css
/* Button with leading icon */
.btn-icon-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;           /* 8dp icon-to-label gap */
  padding: 10px 24px 10px 16px; /* left padding reduced when icon present */
}

/* List item with leading icon */
.list-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
}
```

#### When a Label Is Required vs Optional

| Context | Label Required? | Rationale |
|---|---|---|
| **Bottom navigation bar** | **Required** — always visible | Icons alone are ambiguous; labels prevent misnavigation |
| **Navigation rail** | Required on mobile, optional on desktop with tooltip | Same rationale; desktop users can hover for tooltip |
| **Icon-only button** | **Required** as `aria-label` (visually optional) | Must be accessible; tooltip on hover/focus |
| **FAB** | Optional visually; use Extended FAB when action is ambiguous | "Add" FAB with `+` icon is universally understood |
| **Toolbar icon button** | Optional visually; tooltip required | Standard toolbar convention |
| **Chip** | **Required** — chips always have labels | Chips are label-first components |
| **Tab** | Required when icon-only tabs are used | Icon-only tabs require tooltip or are prohibited |
| **List item leading icon** | N/A — list item always has text content | Icon is supplementary |

**Label placement rules:**
- Bottom nav and tabs: label is always **below** the icon, never beside it
- Buttons: label is always **beside** the icon (leading icon on left in LTR)
- Never place a label above an icon in functional UI (only acceptable in marketing/illustration)
- When truncating a label, use ellipsis (`…`) — never clip mid-character
- Icon and label must share the same color role — never use different colors for icon and its paired label

---

### 18.7 Animated Icons

Icon animations communicate state transitions. They must be purposeful, not decorative.

#### Core State Transition Patterns

| Transition | Duration | Easing | Technique |
|---|---|---|---|
| **Outlined → Filled** (inactive → active) | 200ms | `cubic-bezier(0.2, 0, 0, 1)` | Animate `FILL` axis 0→1 |
| **Add → Check** (submit confirmation) | 300ms | `cubic-bezier(0.2, 0, 0, 1)` | Morph via SVG path or swap with crossfade |
| **Play → Pause** (media control) | 150ms | `cubic-bezier(0.2, 0, 0, 1)` | Morph via SVG path |
| **Menu → Close** (hamburger → X) | 200ms | `cubic-bezier(0.2, 0, 0, 1)` | Rotate + morph |
| **Bookmark (save)** | 300ms | Spring (`cubic-bezier(0.34, 1.56, 0.64, 1)`) | Fill + slight scale bounce |
| **Favorite/Like** | 300ms | Spring | Fill + scale 1→1.2→1 |
| **Expand → Collapse** (chevron) | 200ms | `cubic-bezier(0.2, 0, 0, 1)` | `rotate(0deg)` → `rotate(180deg)` |
| **Loading spinner** | 1400ms loop | Linear | `rotate(360deg)` continuous |

```css
/* FILL axis animation for inactive → active */
.icon {
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
  transition: font-variation-settings 200ms cubic-bezier(0.2, 0, 0, 1);
}
.icon--active {
  font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;
}

/* Chevron expand/collapse */
.chevron {
  display: inline-block;
  transition: transform 200ms cubic-bezier(0.2, 0, 0, 1);
}
.chevron--expanded { transform: rotate(180deg); }

/* Like/favorite spring bounce */
.icon--liked {
  animation: like-bounce 300ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
@keyframes like-bounce {
  0%   { transform: scale(1);   font-variation-settings: 'FILL' 0; }
  50%  { transform: scale(1.2); font-variation-settings: 'FILL' 1; }
  100% { transform: scale(1);   font-variation-settings: 'FILL' 1; }
}
```

#### Add → Check Transition (SVG morphing)

For icons that change shape entirely (not just fill), use SVG with `<animateTransform>` or a JS morphing library. The Material approach:

```html
<!-- Swap with crossfade when SVG morphing is unavailable -->
<div class="icon-swap" aria-live="polite">
  <span class="material-symbols-outlined icon-swap__add" aria-hidden="true">add</span>
  <span class="material-symbols-outlined icon-swap__check icon-swap__check--hidden" aria-hidden="true">check</span>
</div>
```

```css
.icon-swap { position: relative; width: 24px; height: 24px; }
.icon-swap > span {
  position: absolute;
  transition: opacity 150ms, transform 150ms cubic-bezier(0.2, 0, 0, 1);
}
.icon-swap__check--hidden { opacity: 0; transform: scale(0.5); }
.icon-swap--confirmed .icon-swap__add { opacity: 0; transform: scale(0.5); }
.icon-swap--confirmed .icon-swap__check--hidden { opacity: 1; transform: scale(1); }
```

#### Menu → Close (Hamburger → X)

```css
.menu-icon {
  transition: transform 200ms cubic-bezier(0.2, 0, 0, 1);
}
/* Swap icon name via JS: 'menu' → 'close'; the rotation adds motion continuity */
.menu-icon--open { transform: rotate(90deg); }
```

**Animation rules:**
- Respect `prefers-reduced-motion`: replace all icon animations with instant state swaps
- Never animate icons that are purely decorative
- State-change animations must complete before the next interaction is accepted (or be interruptible with a snap-to-end)
- Icon animations in navigation must not delay navigation — animate in parallel, not in sequence

---

### 25.4 Google Sans vs Roboto

Google uses two primary typefaces across its products. Choosing the wrong one is a common brand error.

| Dimension | Google Sans | Roboto |
|---|---|---|
| **Classification** | Humanist geometric sans-serif | Neo-grotesque sans-serif |
| **Personality** | Warm, friendly, approachable | Neutral, functional, systematic |
| **Licensing** | Proprietary — Google products only | Open source (Apache 2.0) |
| **Available weights** | Regular (400), Medium (500), Bold (700) | Thin (100) through Black (900) |
| **Variable font** | Yes (`Google Sans` variable) | Yes (`Roboto Flex`) |

**When to use each:**

| Context | Typeface | Rationale |
|---|---|---|
| Google product UI (Android, web apps) | **Google Sans** | Brand expression in first-party surfaces |
| Marketing and brand communications | **Google Sans** | Consistent brand voice |
| Body text in long-form content | **Roboto** | Higher legibility at small sizes in dense text |
| Code and monospace contexts | **Roboto Mono** | Paired with Roboto ecosystem |
| Third-party apps using Material Design | **Roboto** | Google Sans is not licensed for third parties |
| System UI (Android AOSP) | **Roboto** | Default system font |

**Fallback stacks:**

```css
/* Google Sans — first-party Google products */
font-family: 'Google Sans', 'Noto Sans', 'Helvetica Neue', Arial, sans-serif;

/* Roboto — Material Design / third-party */
font-family: 'Roboto', 'Noto Sans', 'Helvetica Neue', Arial, sans-serif;

/* Roboto Mono — code, data */
font-family: 'Roboto Mono', 'Noto Sans Mono', 'Courier New', monospace;
```

**Size and weight pairing rules:**

| Use Case | Typeface | Size | Weight |
|---|---|---|---|
| Hero headline | Google Sans | 57sp / 3.56rem | 400 |
| Page title | Google Sans | 32sp / 2rem | 400 |
| Card title | Google Sans | 22sp / 1.375rem | 500 |
| Button label | Google Sans | 14sp / 0.875rem | 500 |
| Body text | Roboto | 16sp / 1rem | 400 |
| Caption / helper | Roboto | 12sp / 0.75rem | 400 |
| Code snippet | Roboto Mono | 14sp / 0.875rem | 400 |

**Loading strategy:**

```html
<!-- Preconnect to reduce latency -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

<!-- Load only needed weights; use display=swap to prevent FOIT -->
<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
```

---

### 25.5 Photography Style

Google's photography is defined by what it is **not**: it is not staged, not sterile, not stock. Every image should feel like it was captured in a real moment.

**Core photography principles:**

| Principle | What It Means | What to Avoid |
|---|---|---|
| **Authentic** | Real people in real situations, candid or naturally posed | Forced smiles, stiff poses, obvious staging |
| **Diverse** | Representation across age, ethnicity, ability, body type, gender expression | Homogeneous casts; tokenism (one person of color in a group) |
| **Natural lighting** | Daylight, window light, practical sources; soft shadows | Harsh studio strobes, flat lighting, over-retouched skin |
| **Purposeful** | Every photo serves the content; no filler imagery | Generic "business handshake" or "laptop on desk" clichés |
| **Optimistic** | Warm, forward-looking, energetic — not melancholy | Dark, moody, dystopian aesthetics |
| **Contextual** | Shows the product or feature in real use | Floating UI on a white background with no human context |

**Technical specifications:**

| Property | Specification |
|---|---|
| Aspect ratios | 16:9 (hero/banner), 4:3 (editorial), 1:1 (social/avatar), 3:4 (portrait) |
| Minimum resolution | 2× the display size (for HiDPI/Retina) |
| Color profile | sRGB for web; Display P3 for iOS/macOS where supported |
| File format | WebP (primary), AVIF (progressive enhancement), JPEG (fallback) |
| Max file size | Hero: ≤200KB; Card thumbnail: ≤50KB; Avatar: ≤20KB |
| Focal point | Subject in upper-center third; leave bottom third for text overlays |

**Prohibited photography patterns:**
- [ ] Stock photo clichés: handshakes, lightbulbs, puzzle pieces, "diverse team around laptop"
- [ ] Lens flare added in post-production
- [ ] Heavy vignetting or color grading that obscures faces
- [ ] Images that show only one demographic group in a professional context
- [ ] Retouching that removes natural skin texture, scars, or features
- [ ] Images where the Google product is not the hero (if product photography)

---

### 25.6 Illustration Style

Google's illustration system is **flat, geometric, and inclusive**. It uses a limited palette derived from the four brand colors and their tints.

**Core illustration principles:**

| Principle | Specification |
|---|---|
| **Flat** | No gradients on character fills; no drop shadows on characters |
| **Geometric** | Shapes built from circles, rectangles, and simple curves |
| **Limited palette** | 4–6 colors per illustration; drawn from brand palette tints |
| **Friendly** | Rounded corners, open compositions, positive scenarios |
| **Inclusive** | Characters represent diverse skin tones, body types, abilities, and ages |

**Approved skin tone palette (Google's inclusive set):**

| Tone | Hex | Usage |
|---|---|---|
| Lightest | `#FDDBB4` | Skin fill |
| Light | `#F5C5A3` | Skin fill |
| Light-medium | `#E8A87C` | Skin fill |
| Medium | `#C68642` | Skin fill |
| Medium-dark | `#8D5524` | Skin fill |
| Dark | `#4A2912` | Skin fill |

All six tones must be represented proportionally across any illustration set of 6+ characters.

**Illustration color palette (derived from brand colors):**

```
Primary fills:   #4285F4 (Blue), #EA4335 (Red), #FBBC05 (Yellow), #34A853 (Green)
Light tints:     #D2E3FC (Blue 100), #FCE8E6 (Red 100), #FEF7E0 (Yellow 100), #E6F4EA (Green 100)
Neutral:         #F8F9FA (light gray), #E8EAED (mid gray), #5F6368 (dark gray)
White:           #FFFFFF (backgrounds, highlights)
```

**Character construction rules:**

| Element | Rule |
|---|---|
| Head shape | Circle or rounded rectangle; no pointed chins |
| Eyes | Simple dots or ovals; no detailed irises |
| Hands | Mitten-style or simple 4-finger; no hyper-detailed anatomy |
| Proportions | Slightly large head (approx. 1:4 head-to-body ratio) for friendliness |
| Accessories | Glasses, hearing aids, mobility aids included naturally — not as special callouts |

**Illustration checklist:**
- [ ] Maximum 6 colors used (excluding skin tones)
- [ ] No gradients on character fills
- [ ] Characters include diverse representation if 2+ people shown
- [ ] Accessible: illustration meaning is not lost in grayscale
- [ ] Exported as SVG with optimized paths (no raster elements)
- [ ] Tested at 320px width minimum

---

### 16.5 SVG Animation Best Practices

#### SMIL vs CSS vs JS — Decision Table

| Criterion | SMIL | CSS Animation | JS (GSAP / Web Animations API) |
|---|---|---|---|
| **Browser support** | Deprecated in Chrome (use CSS/JS) | Excellent | Excellent |
| **Performance** | Poor (main thread) | Excellent (compositor) | Good (with `transform`/`opacity`) |
| **Complexity** | Simple loops only | Simple to moderate | Complex sequences, physics |
| **`prefers-reduced-motion`** | Manual | Native via `@media` | Manual |
| **Interactivity** | None | Limited (`:hover`, `:focus`) | Full |
| **Recommended** | ✗ Never | ✓ Default choice | ✓ For complex sequences |

**Rule:** Never use SMIL. It is deprecated in Chromium and has no performance advantages. Use CSS animations for simple, looping SVG animations and the Web Animations API or GSAP for sequenced or interactive animations.

#### CSS SVG Animation — Rules

Only animate these properties for 60fps performance:

| Property | GPU Accelerated | Notes |
|---|---|---|
| `transform` (translate, scale, rotate) | ✓ Yes | Use on `<g>` or individual elements |
| `opacity` | ✓ Yes | Fade in/out |
| `fill` | ✗ No | Triggers repaint; use sparingly, short durations only |
| `stroke-dashoffset` | ✗ No | Path draw effect; acceptable for <500ms |
| `d` (path morphing) | ✗ No | Use JS libraries; avoid in CSS |

```css
/* ✓ Correct — GPU-accelerated icon spin */
.icon-loading {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ✓ Correct — path draw effect (short duration only) */
.checkmark-path {
  stroke-dasharray: 36;
  stroke-dashoffset: 36;
  animation: draw 300ms cubic-bezier(0, 0, 0, 1) forwards;
}
@keyframes draw {
  to { stroke-dashoffset: 0; }
}

/* ✗ Incorrect — animating fill triggers repaint on every frame */
.icon { animation: colorShift 2s infinite; }
@keyframes colorShift { to { fill: #EA4335; } }
```

#### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  .icon-loading { animation: none; }
  .checkmark-path { stroke-dashoffset: 0; animation: none; }
}
```

#### Animation Duration Targets for SVG

| Animation Type | Duration | Easing |
|---|---|---|
| Icon state change (fill/stroke) | 150ms | `cubic-bezier(0.2, 0, 0, 1)` |
| Checkmark draw | 300ms | `cubic-bezier(0, 0, 0, 1)` (decelerate) |
| Illustration entrance | 400ms | `cubic-bezier(0, 0, 0, 1)` |
| Loading spinner (one rotation) | 1000ms | `linear` |
| Success celebration | 600ms | Spring (JS only) |
| Lottie/complex sequence | 1500–3000ms | Per-element easing |

---

### 16.6 Icon SVG Specs: The 24dp Grid

All Google UI icons are designed on a **24×24dp grid** with a **2dp optical padding** on all sides, giving a **20×20dp live area**.

#### Grid Anatomy

```
┌─────────────────────────┐  24dp
│  2dp padding (all sides) │
│  ┌───────────────────┐  │
│  │                   │  │
│  │   20dp live area  │  │
│  │                   │  │
│  └───────────────────┘  │
│                         │
└─────────────────────────┘
```

| Property | Value |
|---|---|
| **Canvas size** | 24×24dp |
| **Live area** | 20×20dp |
| **Padding** | 2dp all sides |
| **Stroke width (outlined)** | 2dp |
| **Stroke width (rounded)** | 2dp, `stroke-linecap="round"`, `stroke-linejoin="round"` |
| **Corner radius (filled)** | 2dp minimum |
| **Minimum path weight** | 1.5dp (thin details) |
| **Maximum path weight** | 3dp (bold emphasis) |

#### Stroke vs Fill Decision

| Style | When to Use | Example Icons |
|---|---|---|
| **Outlined (stroke)** | Default; unselected/inactive states | Navigation icons at rest |
| **Filled** | Selected/active states; emphasis | Active nav item, favorited |
| **Rounded** | Consumer, friendly products | Google Photos, YouTube Kids |
| **Sharp** | Productivity, dense UIs | Sheets, Docs toolbars |
| **Two-tone** | Deprecated — avoid | — |

**Active/inactive icon pattern:**
```html
<!-- Inactive: outlined -->
<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
  <path fill="none" stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round"
        d="M3 12l9-9 9 9M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9"/>
</svg>

<!-- Active: filled -->
<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
  <path d="M3 12l9-9 9 9M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9"/>
</svg>
```

#### Optical Alignment Rules

Geometric centering ≠ optical centering. Apply these corrections:

| Shape | Geometric Center | Optical Correction |
|---|---|---|
| Triangle (pointing up) | Mathematical center | Shift down 0.5–1dp |
| Circle | Mathematical center | None needed |
| Play button (▶) | Mathematical center | Shift right 0.5dp |
| Vertical rectangle | Mathematical center | None needed |
| Diagonal arrow | Mathematical center | Shift toward arrow direction 0.5dp |

**Rule:** After placing an icon on the grid, do a visual check at 24dp, 48dp, and 96dp. If it looks off-center, apply optical correction. The eye is the final judge, not the coordinate system.

#### Icon Size Variants

| Size | Usage | Touch Target |
|---|---|---|
| 20dp | Dense toolbars, inline text icons | 40dp (with padding) |
| 24dp | Standard UI icons | 48dp (with padding) |
| 36dp | Large action icons | 48dp |
| 48dp | Hero icons, empty states | 48dp (native) |

---

### 16.7 Illustration Categories

Each illustration category has distinct style rules. Using the wrong style for a context (e.g., a celebratory style for an error) breaks the emotional contract with the user.

#### Category Overview

| Category | Emotional Tone | Complexity | Color Saturation | Character Present? |
|---|---|---|---|---|
| **Empty state** | Inviting, hopeful | Low–Medium | Medium | Optional |
| **Onboarding** | Exciting, clear | Medium | High | Recommended |
| **Error state** | Empathetic, calm | Low | Low–Medium | Optional |
| **Success state** | Celebratory, warm | Low–Medium | High | Optional |

---

#### Empty States

**Purpose:** Teach the user what this space is for and motivate first action.

**Style rules:**
- Illustration size: 160–200dp wide, centered
- Show the feature *in use*, not an absence (e.g., show a bookmark, not an empty shelf)
- Use 2–3 colors maximum; prefer the product's primary color + neutral
- No characters required; objects/metaphors preferred
- Subtle, not dramatic — this is a starting point, not a problem

```
Empty State Composition:
  [Illustration 160–200dp]     ← centered, top of content area
  [Headline — Title Large]     ← "Your saved items will appear here"
  [Body — Body Medium]         ← "Tap ♥ on anything to save it"
  [CTA Button — Filled]        ← "Explore" or "Get started"
  
  Vertical spacing:
    Illustration → Headline: 24dp
    Headline → Body: 8dp
    Body → CTA: 24dp
```

**Specific rules:**
- Headline: describe the opportunity, not the void. "No files yet" ✗ → "Your files will live here" ✓
- Illustration must not use the error color (`#EA4335`)
- If the empty state is user-caused (they cleared everything), use a lighter, more celebratory tone

---

#### Onboarding Illustrations

**Purpose:** Communicate value quickly; build excitement; reduce anxiety about a new product.

**Style rules:**
- Illustration size: 240–280dp wide for full-screen onboarding; 160dp for inline
- Use all 4 Google brand colors if appropriate — this is the highest-energy context
- Characters are recommended; show diverse representation across a sequence
- Motion is encouraged (CSS entrance animation, 400ms decelerate)
- Each illustration must communicate ONE idea — no composite scenes

**Onboarding sequence rules:**
- Maximum 3 onboarding screens (users skip after 3)
- Each screen: one illustration + one headline (max 6 words) + one sentence body
- Progress indicator: dots, centered below content
- Skip button: always present, top-right, Text button style

```
Onboarding Screen Composition:
  [Illustration 240–280dp]     ← top 50% of screen
  [Headline — Headline Medium] ← max 6 words
  [Body — Body Large]          ← max 2 lines
  [Progress dots]              ← 8dp dots, 8dp gap
  [Primary CTA — Filled]       ← "Next" or "Get started"
  [Skip — Text button]         ← top-right, always visible
```

---

#### Error States

**Purpose:** Acknowledge the problem without blame; provide a clear recovery path.

**Style rules:**
- Illustration size: 120–160dp wide — smaller than empty states (errors should not be dramatic)
- Color palette: neutrals + one accent; avoid red as the dominant color (it reads as alarm)
- Use `#BDC1C6` (neutral gray) as the primary illustration color
- Characters, if used, show a calm/thinking expression — never distressed
- No exclamation marks in the illustration itself

**Error type → illustration mapping:**

| Error Type | Illustration Metaphor | Dominant Color |
|---|---|---|
| No network | Disconnected plug, cloud with X | `#BDC1C6` neutral |
| Server error | Wrench + gear, construction cone | `#FBBC04` yellow |
| Not found (404) | Magnifying glass finding nothing | `#BDC1C6` neutral |
| Permission denied | Lock, shield | `#BDC1C6` neutral |
| Timeout | Clock, hourglass | `#BDC1C6` neutral |

```
Error State Composition:
  [Illustration 120–160dp]     ← centered
  [Headline — Title Large]     ← plain language, no jargon
  [Body — Body Medium]         ← what happened + what to do
  [Retry — Filled button]      ← primary recovery action
  [Secondary action — Text]    ← "Go home" or "Contact support"
  
  Vertical spacing:
    Illustration → Headline: 24dp
    Headline → Body: 8dp
    Body → Primary CTA: 24dp
    Primary CTA → Secondary: 8dp
```

**Error message formula (repeated from §4.5 — applies to illustration copy too):**
```
[What happened] + [Why, if helpful] + [What to do next]
"Can't connect to the internet. Check your connection and try again."
```

---

#### Success States

**Purpose:** Confirm completion; provide proportional celebration; give a clear next step.

**Style rules:**
- Illustration size: 120–160dp for moderate success; 200dp+ for milestone success
- Use Google Green (`#34A853`) as the primary accent
- Checkmark motif is canonical — animate it with a 300ms stroke-dashoffset draw
- For milestone success (first purchase, account created): add confetti or sparkle elements
- Confetti colors: use all 4 Google brand colors, small geometric shapes only (circles, squares, triangles — no complex shapes)

**Success level → treatment:**

| Success Level | Illustration | Animation | Duration |
|---|---|---|---|
| Minor (save, like) | Icon state change only | Fill transition | 150ms |
| Moderate (form submit, send) | Checkmark in circle | Stroke draw | 300ms |
| Major (purchase, signup) | Full illustration + checkmark | Entrance + draw | 600ms |
| Milestone (first use, streak) | Full illustration + confetti | Sequence | 1500ms |

```css
/* Canonical checkmark animation */
.success-checkmark {
  stroke-dasharray: 36;
  stroke-dashoffset: 36;
  animation: checkDraw 300ms cubic-bezier(0, 0, 0, 1) 100ms forwards;
}
@keyframes checkDraw {
  to { stroke-dashoffset: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .success-checkmark { animation: none; stroke-dashoffset: 0; }
}
```

---

### 23.4 Notification Channels (Android)

Android 8.0+ requires all notifications to be assigned to a channel. Channels give users granular control. Design your channel taxonomy carefully — it is permanent (channels cannot be renamed after creation without creating a new channel ID).

#### Importance Levels

| Level | Constant | Behavior | Use Case |
|---|---|---|---|
| **IMPORTANCE_HIGH** | `NotificationManager.IMPORTANCE_HIGH` | Makes sound, appears as heads-up (peek) notification | Incoming calls, urgent messages, payment alerts |
| **IMPORTANCE_DEFAULT** | `NotificationManager.IMPORTANCE_DEFAULT` | Makes sound, appears in shade | Order updates, social mentions, reminders |
| **IMPORTANCE_LOW** | `NotificationManager.IMPORTANCE_LOW` | No sound, appears in shade | Background sync status, non-urgent updates |
| **IMPORTANCE_MIN** | `NotificationManager.IMPORTANCE_MIN` | No sound, no status bar icon, collapsed in shade | Ongoing background service, silent tracking |
| **IMPORTANCE_NONE** | `NotificationManager.IMPORTANCE_NONE` | Blocked | — (user-set, not app-set) |

**Channel design rules:**
- [ ] Create channels at app first launch, before sending any notification
- [ ] Never create a single "All Notifications" channel — this removes user control
- [ ] Group related channels using `NotificationChannelGroup`
- [ ] Default importance to `IMPORTANCE_DEFAULT`; only use `IMPORTANCE_HIGH` for genuinely urgent content
- [ ] Never downgrade a channel's importance programmatically after the user has set it

**Recommended channel taxonomy (example: e-commerce app):**

```kotlin
// Channel groups
NotificationChannelGroup("orders", "Orders")
NotificationChannelGroup("account", "Account & Security")
NotificationChannelGroup("promotions", "Offers & Promotions")

// Channels within groups
NotificationChannel("order_updates",   "Order updates",    IMPORTANCE_DEFAULT) // group: orders
NotificationChannel("delivery",        "Delivery alerts",  IMPORTANCE_HIGH)    // group: orders
NotificationChannel("security",        "Security alerts",  IMPORTANCE_HIGH)    // group: account
NotificationChannel("account_activity","Account activity", IMPORTANCE_DEFAULT) // group: account
NotificationChannel("promotions",      "Promotions",       IMPORTANCE_LOW)     // group: promotions
NotificationChannel("price_drops",     "Price drop alerts",IMPORTANCE_DEFAULT) // group: promotions
```

#### User Control Surface

Always expose notification channel settings inside the app — don't make users hunt through OS settings:

```
App Settings → Notifications
    ├── Orders
    │   ├── Order updates          [toggle] [importance chip]
    │   └── Delivery alerts        [toggle] [importance chip]
    ├── Account & Security
    │   ├── Security alerts        [toggle] [importance chip]
    │   └── Account activity       [toggle] [importance chip]
    └── Offers & Promotions
        ├── Promotions             [toggle] [importance chip]
        └── Price drop alerts      [toggle] [importance chip]
        
    [Open system notification settings ↗]
```

---

### 23.5 In-App Notification Patterns

When the user is already in the app, push notifications are suppressed. Use in-app patterns instead.

#### Pattern Comparison

| Pattern | Blocks UI | Auto-dismiss | Persistent | Use Case |
|---|---|---|---|---|
| **Banner (top)** | No | Yes (4–6s) | No | Transient status: "Message sent", sync complete |
| **Banner (bottom / Snackbar)** | No | Yes (4s) | No | Action confirmation with optional undo |
| **Dot indicator** | No | No | Until cleared | Unread content exists in a section |
| **Count badge** | No | No | Until cleared | Exact unread count (≤99, then "99+") |
| **In-feed card** | No | No | Until dismissed | Persistent alert requiring user decision |
| **Full-screen takeover** | Yes | No | Until dismissed | Critical system alert (account suspended, legal) |

#### Dot Indicators

Use a dot (no number) when:
- The exact count is not meaningful (e.g., "new content in Explore")
- The count would change too rapidly to be useful
- The section contains mixed read/unread content

```
Dot spec (Material Design):
  Size:     8dp diameter
  Color:    md.sys.color.error (red) for alerts; md.sys.color.primary for neutral new content
  Position: Top-right of the icon, 2dp overlap
  Shape:    Full circle (shape.full token)
```

#### Count Badges

Use a count badge when:
- The exact number is meaningful and actionable (unread messages, pending approvals)
- The count is ≤99 (show "99+" beyond that)
- The count decreases as the user takes action

```
Badge spec (Material Design):
  Small (dot only):   6dp diameter
  Single digit:       16dp diameter, Label Small type
  Multi-digit:        min 16dp wide, auto-width, Label Small type
  Max displayed:      99 (show "99+" for 100+)
  Color:              md.sys.color.error / md.sys.color.on-error
  Position:           Top-right of parent icon, centered on corner
```

**Badge rules:**
- [ ] Clear the badge as soon as the user views the content — not when they tap the icon
- [ ] Sync badge count across devices in real time
- [ ] Never show a badge count of 0 — remove the badge entirely
- [ ] On Android, update the launcher icon badge via `ShortcutBadger` or `NotificationManager` (API 26+)

#### In-App Banner (top)

```
┌─────────────────────────────────────────────────┐
│ ⚠  You're offline. Changes will sync when       │
│    you reconnect.                    [Retry]     │
└─────────────────────────────────────────────────┘
```

- Height: 52dp minimum
- Appears below the top app bar (never overlaps it)
- Uses `md.sys.color.surface-variant` background for non-critical; `md.sys.color.error-container` for errors
- Maximum 1 action button (text style)
- Persistent banners must have a dismiss (×) control

---

### 23.6 Email Notification Design

Email is the highest-reach, lowest-immediacy notification channel. Design for the inbox scan — users decide in under 3 seconds whether to open.

#### The Three-Second Inbox Scan

Users see three things before deciding to open:
1. **Sender name** — is this from someone/something I trust?
2. **Subject line** — is this relevant right now?
3. **Preview text** — does this add context or is it filler?

#### Subject Line Rules

| Rule | Bad Example | Good Example |
|---|---|---|
| ≤50 characters (mobile clips at ~40) | "Your recent order #A8472-B has been processed and is now being prepared for shipment" | "Your order is being prepared 📦" |
| Lead with the most important word | "Update: Your password was changed" | "Password changed on your account" |
| No ALL CAPS | "IMPORTANT: ACTION REQUIRED" | "Action required: verify your email" |
| No misleading RE: or FWD: prefixes | "RE: Your account" (unsolicited) | "Your account summary for April" |
| Personalize when meaningful | "New items available" | "Ana, 3 new items in your wishlist" |
| Avoid spam trigger words | "FREE!!!", "Act now", "Limited time!!!" | "Your exclusive early access starts today" |

#### Preview Text

Preview text is the snippet shown after the subject line in most email clients. It is **not** the first line of the email body — set it explicitly.

```html
<!-- Set preview text explicitly, hidden from rendered email -->
<span style="display:none;max-height:0;overflow:hidden;">
  Your package left the warehouse at 9:14 AM and is expected by 8 PM today.
</span>
```

- ≤90 characters (clients vary; design for 60)
- Must add information not already in the subject line
- Never leave it blank — clients will pull the first visible text (often "View in browser" or alt text)

#### CTA Hierarchy

Every transactional and promotional email has one primary CTA. The visual hierarchy must make this unambiguous:

| CTA Level | Style | Max per Email | Example |
|---|---|---|---|
| **Primary** | Filled button, brand color, 44px tall min | 1 | "Track your order" |
| **Secondary** | Outlined button or bold text link | 1–2 | "View order details" |
| **Tertiary** | Plain text link | Unlimited | "Update preferences", "Unsubscribe" |

**Email CTA rules:**
- [ ] Primary CTA button: minimum 44px height, 120px width, sufficient padding
- [ ] Button text: verb-first ("Track order", not "Order tracking")
- [ ] CTA must work without images enabled (use background-color on `<a>` tag, not an image)
- [ ] One primary CTA per email — multiple equal CTAs cause decision paralysis
- [ ] Place primary CTA above the fold (visible without scrolling on mobile)
- [ ] Unsubscribe link must be in every promotional email, in the footer, in plain text

#### Email Layout Spec

```
Max width:        600px (renders well across clients)
Mobile breakpoint: 480px (single column)
Font size:        16px body minimum (14px absolute minimum for secondary text)
Line height:      1.5× font size
Link color:       Must meet 4.5:1 contrast on background
Image alt text:   Required on all images
```


---

### 25.7 Brand Voice and Tone

Google's voice is consistent; its tone adapts to context. Voice is who you are — tone is how you sound in a given moment.

**The four voice attributes:**

| Attribute | What It Means | Writing Example |
|---|---|---|
| **Helpful** | Anticipate what the user needs; give the answer, not just information | ✓ "Your flight lands at 3:45 PM. Traffic is light — you'll arrive in 22 minutes." ✗ "Flight information is available in your booking confirmation." |
| **Honest** | Acknowledge limitations; never oversell; be transparent about AI | ✓ "I'm not sure about this — here's what I found." ✗ "Here's everything you need to know about this topic." |
| **Inspiring** | Show what's possible; use active, forward-looking language | ✓ "Explore 195 countries without leaving your desk." ✗ "This product has mapping data for 195 countries." |
| **Accessible** | Plain language; no jargon; 8th-grade reading level for UI text | ✓ "Something went wrong. Try again." ✗ "Error 503: Service temporarily unavailable due to upstream dependency failure." |

**Tone adaptation by context:**

| Context | Tone | Example |
|---|---|---|
| **Onboarding** | Warm, encouraging | "You're all set. Let's find something great." |
| **Error state** | Calm, solution-focused | "We couldn't load your photos. Check your connection and try again." |
| **Success state** | Brief, positive | "Saved." / "Done." / "Sent." |
| **Empty state** | Inviting, instructive | "Your starred items will appear here. Star anything to find it fast later." |
| **Destructive action** | Clear, neutral (no alarm) | "Delete this file? It will be removed from all your devices." |
| **AI uncertainty** | Honest, humble | "I'm not certain, but based on what I found…" |
| **Celebration** | Warm, proportional | "Goal reached! You walked 10,000 steps today." |

**Writing rules:**

| Rule | Bad | Good |
|---|---|---|
| Use contractions | "You are signed in" | "You're signed in" |
| Active voice | "Your file was saved by Drive" | "Drive saved your file" |
| Sentence case for UI labels | "Search For Places" | "Search for places" |
| No exclamation marks in errors | "Oops! Something went wrong!" | "Something went wrong. Try again." |
| No ellipsis in button labels | "Loading…" (button) | Use a spinner instead |
| Specific over generic | "Try again later" | "Try again in a few minutes" |
| Lead with the action | "In order to share, tap the share icon" | "Tap Share to send this to someone" |

---

### 25.8 Gradient Usage

Gradients in Google's design system are **purposeful and constrained**. They are not decorative flourishes — they serve specific functional or expressive roles.

**When gradients are allowed:**

| Context | Allowed | Notes |
|---|---|---|
| Product icon backgrounds | ✓ Yes | Linear gradient at 135°; 2 colors max |
| Hero/marketing imagery | ✓ Yes | Scrim gradients over photography |
| Gemini / AI feature branding | ✓ Yes | Specific approved multi-color gradient |
| Data visualization | ✓ Yes | Sequential or diverging color scales |
| Character/illustration fills | ✗ No | Flat fills only |
| Button backgrounds | ✗ No | Solid color fills only |
| Card backgrounds in product UI | ✗ No | Use tonal surface colors |
| Text | ✗ No | Never gradient text in functional UI |

**Approved gradient specifications:**

| Gradient | Direction | Colors | Usage |
|---|---|---|---|
| **Blue → Indigo** | 135° | `#4285F4` → `#3367D6` | Product icon backgrounds (blue family) |
| **Red → Deep Orange** | 135° | `#EA4335` → `#C5221F` | Product icon backgrounds (red family) |
| **Yellow → Amber** | 135° | `#FBBC05` → `#F29900` | Product icon backgrounds (yellow family) |
| **Green → Teal** | 135° | `#34A853` → `#188038` | Product icon backgrounds (green family) |
| **Scrim (dark)** | 0° (bottom) | `rgba(0,0,0,0)` → `rgba(0,0,0,0.6)` | Text legibility over photography |
| **Scrim (light)** | 180° (top) | `rgba(255,255,255,0)` → `rgba(255,255,255,0.9)` | Fade-out at scroll edges |
| **Gemini gradient** | 135° | `#4285F4` → `#9B72CB` → `#D96570` | Gemini branding only; not for general use |

**Gradient construction rules:**

```css
/* ✓ Correct: product icon background gradient */
background: linear-gradient(135deg, #4285F4 0%, #3367D6 100%);

/* ✓ Correct: photo scrim for text legibility */
background: linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 60%);

/* ✗ Wrong: gradient on a button */
background: linear-gradient(135deg, #4285F4, #34A853); /* Never */

/* ✗ Wrong: more than 2 stops outside of Gemini branding */
background: linear-gradient(135deg, #4285F4, #FBBC05, #34A853); /* Never */
```

**Gradient accessibility rule:** Never use a gradient as the sole means of conveying information. Gradients on backgrounds must maintain ≥4.5:1 contrast with any text placed over them at every point along the gradient — test at the lightest point.

---

### 25.9 White Space as Brand

Google's use of negative space is not an absence of design — it **is** the design. The Google homepage is the canonical example: a vast white canvas with a single input. This is a deliberate brand statement.

**The principle:**

> White space signals confidence. It says: "We know what you're here for. We're not going to clutter your path to it."

**How Google uses white space systematically:**

| Pattern | Implementation | Example |
|---|---|---|
| **Breathing room around the logo** | 1x clear space minimum (see §25.2); often much more in marketing | Google.com homepage |
| **Single-focus screens** | One primary element per screen; everything else is secondary or absent | Google Search, Google account sign-in |
| **Generous padding in cards** | 16dp minimum internal padding; 24dp preferred | Google Search result cards |
| **Sparse navigation** | Bottom nav labels always visible; no icon badges unless necessary | Google apps |
| **Empty state restraint** | Empty states use a single illustration + 2 lines of text; no filler content | Google Drive empty state |
| **Typographic spacing** | Line height ≥1.5× font size for body text; paragraph spacing = 1 line height | Google Docs default |

**Spacing values that encode the brand:**

| Context | Value | Token |
|---|---|---|
| Screen edge margin (mobile) | 16dp | `spacing-4` |
| Screen edge margin (tablet) | 24dp | `spacing-5` |
| Card internal padding | 16–24dp | `spacing-4` to `spacing-5` |
| Between card and next card | 8dp | `spacing-2` |
| Section separator spacing | 32dp | `spacing-6` |
| Hero section vertical padding | 64–96dp | `spacing-8`+ |
| Logo clear space | 1× cap-height | — |

**Anti-patterns that violate the white space principle:**

- [ ] Filling empty states with promotional content
- [ ] Adding decorative dividers between every list item
- [ ] Using background colors on every section to "add interest"
- [ ] Reducing card padding below 16dp to fit more content
- [ ] Adding a second FAB because the first "looks lonely"
- [ ] Placing ads or cross-promotions in the primary content area

---


---

## 25. Brand Expression & Visual Identity

> Google's brand is one of the most recognized in the world. Its power comes not from complexity but from disciplined consistency — the same four colors, the same honest voice, the same generous use of space, applied coherently across every surface.

---

### 25.1 Google Brand Color Palette

Google's brand identity is anchored by four primary colors. These are fixed, non-dynamic values — unlike Material You system colors, they never change based on user wallpaper.

| Color | Name | Hex | RGB | Usage |
|---|---|---|---|---|
| 🔵 | **Google Blue** | `#4285F4` | `rgb(66, 133, 244)` | Primary brand color; Google logo "G", links, primary CTAs in brand contexts |
| 🔴 | **Google Red** | `#EA4335` | `rgb(234, 67, 53)` | Google logo "o" (first); error states in brand contexts; YouTube accent |
| 🟡 | **Google Yellow** | `#FBBC05` | `rgb(251, 188, 5)` | Google logo "o" (second); warning states; star ratings |
| 🟢 | **Google Green** | `#34A853` | `rgb(52, 168, 83)` | Google logo "l"; success states; Maps accent |

**Extended brand palette — tints and shades:**

| Color | 900 | 700 | 500 (Base) | 300 | 100 |
|---|---|---|---|---|---|
| **Blue** | `#1a237e` | `#1565c0` | `#4285F4` | `#90caf9` | `#e3f2fd` |
| **Red** | `#b71c1c` | `#c62828` | `#EA4335` | `#ef9a9a` | `#ffebee` |
| **Yellow** | `#f57f17` | `#f9a825` | `#FBBC05` | `#fff176` | `#fffde7` |
| **Green** | `#1b5e20` | `#2e7d32` | `#34A853` | `#a5d6a7` | `#e8f5e9` |

**Usage rules:**

| Rule | Detail |
|---|---|
| **Brand contexts only** | The four brand colors are for Google-branded surfaces (marketing, sign-in flows, the Google logo). Product UIs use Material You color roles instead. |
| **Never recolor the logo** | The four-color sequence in the Google wordmark and "G" icon is fixed. Never substitute, tint, or reorder. |
| **Minimum contrast** | When placing brand colors on white (`#FFFFFF`): Blue 4285F4 = 3.07:1 (use for large text/graphics only); Red EA4335 = 4.01:1; Yellow FBBC05 = 1.08:1 (never on white for text); Green 34A853 = 3.76:1. For body text, always use dark neutrals, not brand colors. |
| **Single-color usage** | When only one brand color is permitted (e.g., monochrome print), use Google Blue `#4285F4`. |
| **Dark backgrounds** | On dark surfaces, use the 300-level tints, not the base hex values, to maintain contrast. |

```css
/* Brand color tokens — use only in brand/marketing contexts */
:root {
  --google-blue:   #4285F4;
  --google-red:    #EA4335;
  --google-yellow: #FBBC05;
  --google-green:  #34A853;
}
```

---

### 25.2 Google Logo Usage Rules

The Google logo is a legal and brand asset. Misuse — even well-intentioned — is prohibited.

**Clear space rule:**
The minimum clear space around the Google wordmark on all sides equals the cap-height of the letter "G" in the logo (referred to as **1x**). No other graphic, text, or UI element may enter this zone.

```
        ← 1x →
   ┌─────────────────────┐
1x │                     │ 1x
   │    Google           │
1x │                     │ 1x
   └─────────────────────┘
        ← 1x →

Where 1x = cap-height of the "G"
```

**Minimum size:**

| Surface | Minimum Width |
|---|---|
| Digital (screen) | 64px |
| Print | 0.5 in / 12.7 mm |
| Favicon / app icon | Use the "G" mark, not the wordmark |

**Approved logo variants:**

| Variant | When to Use |
|---|---|
| Full color (4-color) | Default; use on white or very light backgrounds |
| White (reversed) | On dark or photographic backgrounds |
| Black | Single-color print only |
| "G" mark (icon only) | App icons, favicons, space-constrained contexts |

**Prohibited modifications — never do any of the following:**

- [ ] Recolor any letter or change the color sequence
- [ ] Stretch, compress, or skew the logo
- [ ] Add drop shadows, gradients, or outlines to the logo
- [ ] Place the logo on a busy background without sufficient contrast
- [ ] Animate the logo (except in Google-produced brand animations)
- [ ] Combine the Google logo with another company's logo in a lockup
- [ ] Use the logo at an angle
- [ ] Recreate the logo in a different typeface
- [ ] Place the logo inside a shape (circle, badge, etc.) without explicit brand approval

---

### 25.3 Product Icon Design System

Google product icons (Gmail, Drive, Maps, etc.) follow a precise construction system built on a **squircle grid**.

**The icon grid:**

```
┌──────────────────────────────┐
│         108 × 108 dp         │  ← Full canvas
│   ┌──────────────────────┐   │
│   │    Live area: 88dp   │   │  ← All content within
│   │  ┌────────────────┐  │   │
│   │  │  Safe zone:    │  │   │
│   │  │    66dp        │  │   │  ← Core shape fits here
│   │  └────────────────┘  │   │
│   └──────────────────────┘   │
└──────────────────────────────┘
```

**Keyline shapes — the five permitted base shapes:**

| Shape | Dimensions | Example Product |
|---|---|---|
| **Circle** | 88dp diameter | Chrome, Meet |
| **Square** (squircle) | 88×88dp, corner radius 20dp | Drive, Docs |
| **Vertical rectangle** | 66×88dp, corner radius 14dp | Google Play |
| **Horizontal rectangle** | 88×66dp, corner radius 14dp | — |
| **Rounded square** | 76×76dp, corner radius 16dp | Photos, Calendar |

All shapes are centered on the 108dp canvas. No icon shape may exceed the keyline boundary.

**Material layers:**

Product icons are built from stacked material layers to create depth:

| Layer | Purpose | Typical Color |
|---|---|---|
| **Background** | Base shape fill | Brand color or gradient |
| **Material** | Raised foreground element | White or light tint |
| **Tinted element** | Accent detail | Secondary brand color |
| **Ink** | Flat graphic detail | Dark or white |
| **Shadow** | Long shadow or drop shadow | 20% black |

**Long shadow specification:**

The long shadow is cast at **135° (bottom-right)**, extends to the edge of the background shape, and uses a linear gradient from `rgba(0,0,0,0.2)` at the base of the element to `rgba(0,0,0,0)` at the tip.

```
Shadow angle:     135°
Shadow opacity:   0% → 20% (gradient, tip to base)
Shadow length:    To background shape edge
Shadow softness:  Hard edge (not blurred)
```

**Icon design checklist:**
- [ ] Built on the 108dp grid with correct keyline shape
- [ ] All content within the 88dp live area
- [ ] Core symbol fits within the 66dp safe zone
- [ ] Uses 2–4 material layers maximum
- [ ] Long shadow at 135° if shadow is used
- [ ] Tested at 48dp, 36dp, 24dp, and 18dp for legibility
- [ ] Works in both light and dark contexts

---


---

*This document reflects Google's design system and UX patterns as of 2025. Material Design 3 specification: [m3.material.io](https://m3.material.io). For the latest component specs, always refer to the official Material Design documentation.*
