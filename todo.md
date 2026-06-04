# Open Interview — Master Todo

> Deep-dive plan: Diagram rendering fixes + Full page unification
> Status: **PLANNING ONLY** — no code changed yet
> Created: 2026-06-04

---

## Part 1 — Diagram / Figure Fix

### Root Cause Analysis

After reading every relevant file, there are **6 distinct failure modes** that together guarantee diagrams never display reliably:

---

#### 🔴 BUG-01 — SVG Cache directory does not exist (silent 404 on every diagram)

**Location:** `client/src/lib/diagram-cache.ts` → `fetchCachedSvg`

**What happens:** `fetchCachedSvg` attempts to fetch `/data/diagrams/{xx}/{hash}.svg`. The directory `client/public/data/diagrams/` **does not exist anywhere in the repo**. Every diagram fires a 404 fetch (silently caught), then falls through to the Mermaid runtime. This adds ~200ms latency on every diagram load, wastes a network round-trip, and masks all other errors by making timing-sensitive races more likely.

**Fix options:**
- **(A)** Create a pre-render CI script that generates and commits SVG files — complex, high maintenance
- **(B)** Remove the cache fetch path entirely and always use the runtime — simpler, honest, zero regressions

**Recommended:** Option B. The cache is a phantom that adds complexity with zero benefit until it is actually populated. The runtime path is the only real path today.

---

#### 🔴 BUG-02 — Module-level Mermaid singleton causes theme races on multi-diagram pages

**Location:** `client/src/components/InteractiveDiagram.tsx` lines 175–223

**What happens:** `mermaidInstance` and `currentMermaidTheme` are module-level variables shared across **all** diagram instances on the page. When a page mounts 3+ diagrams simultaneously (ReviewSession answer expanded, BlogPost with 2 diagrams, etc.), each instance calls `initMermaid(theme, force=true)` concurrently. Because `initMermaid` is `async` and `mermaid.initialize()` is synchronous but the surrounding logic is not, calls interleave — later instances overwrite the theme configuration before earlier instances have started their own `mermaid.render()`. Result: diagrams render with wrong theme config, or the render throws because initialization state is mid-write.

**Fix:** Add a module-level render queue (a serialized Promise chain). Wrap `initMermaid + mermaid.render` inside the queue. Remove `force=true` from per-render init calls; instead call init once when the theme changes via a stable effect.

---

#### 🔴 BUG-03 — `fixMermaidSyntax` corrupts valid diagram syntax

**Location:** `client/src/lib/diagram-cache.ts` → `fixMermaidSyntax` → `wrapLabel`

**What happens:** `wrapLabel` scans every line for `[` or `{` brackets and, if the content contains any of `()[]{}`, wraps it in `"..."`. This incorrectly mutates valid Mermaid constructs:

```
graph TD
  A[(Database)] --> B[fa:fa-user User]
```

`wrapLabel` converts `[(Database)]` → `[("Database")]` — which changes the cylinder node type semantics in Mermaid v9 and is invalid in v10. Similarly, subgraph names with brackets, edge labels with brackets, and classDiagram member brackets all get double-quoted. This causes many syntactically valid diagrams to throw a parse error, which is caught silently by the outer try/catch, showing the AlertTriangle error state.

**Fix:** Either remove `fixMermaidSyntax` entirely (the transform pipeline already produces clean syntax), or narrow it to only fix the one real failure case it was built for: edge labels containing parentheses like `A -->|label (with parens)| B`.

---

#### 🔴 BUG-04 — `RichTextRenderer.tsx` never renders mermaid — shows raw code text instead

**Location:** `client/src/components/RichTextRenderer.tsx`

**What happens:** `RichTextRenderer` parses markdown into typed blocks and routes `type === 'code'` to `react-syntax-highlighter` regardless of language. There is no `lang === 'mermaid'` intercept. Any question whose `explanation` field contains ` ```mermaid ``` ` blocks (which is the majority after the transform pipeline) will render as a prettily syntax-highlighted block of raw mermaid text — not a diagram.

**Fix:** In the code block render branch, if `block.lang === 'mermaid'`, render `<EnhancedMermaid chart={block.content} />` instead of `<SyntaxHighlighter>`.

---

#### 🟡 BUG-05 — `ReviewSession.tsx` ReactMarkdown missing mermaid interceptor

**Location:** `client/src/pages/ReviewSession.tsx` lines ~225–260

**What happens:** ReviewSession renders the `explanation` field via `ReactMarkdown`. Its `components.code` renderer intercepts code blocks for syntax highlighting but does **not** check `lang === 'mermaid'`. It only renders `<EnhancedMermaid>` for the dedicated `question.diagram` field. Questions whose diagrams live in the markdown explanation (the majority) show as raw code text.

For comparison, `AnswerPanel.tsx` already does this correctly at line 86:
```ts
if (lang === 'mermaid') return isValidMermaid(src) ? <div className="my-4"><EnhancedMermaid chart={src} /></div> : null;
```

**Fix:** Add the identical intercept to ReviewSession's `ReactMarkdown` `components.code`.

---

#### 🟡 BUG-06 — Mermaid v9.4.3 hidden DOM element causes stale render race

**Location:** `client/src/components/InteractiveDiagram.tsx` line 318 + lines 333–334

**What happens:** Mermaid v9's `render(id, code)` injects a hidden `<div id="d{id}">` into `<body>` during processing for internal layout calculations. If the component unmounts mid-render (fast navigation), the cleanup at line 333 removes the element — but then when `render()` resolves it tries to read from a missing element and throws. The outer try/catch catches this and sets `error` state, showing the AlertTriangle. The `cancelled` flag check at line 336 then prevents the state update — but only if the `throw` happens after the cancel flag is set. There is a race window of ~50–300ms where both the error state AND the cancelled path fire, leaving the diagram in a permanent error state even after the user has navigated back.

The `d${renderId}` double-cleanup hack at lines 333–334 exists specifically as a workaround for this v9 behavior.

**Fix:** Upgrade Mermaid from `^9.4.3` to `^10.9.3`. v10 uses a fully self-contained Promise-based API with no hidden DOM injection. The `d${renderId}` cleanup becomes unnecessary. The render queue from BUG-02 also becomes straightforward to implement against v10's API.

---

### Diagram Fix — Full Implementation TODO

```
[D01] Remove fetchCachedSvg call path from InteractiveDiagram.tsx
      - Delete the cache-fetch block (lines 302–313)
      - Keep the mermaid runtime path as the sole render path
      - Remove import of fetchCachedSvg from diagram-cache.ts
      - diagram-cache.ts can keep fixMermaidSyntax for now (fixed separately)

[D02] Neutralize fixMermaidSyntax to prevent syntax corruption
      - Replace the aggressive wrapLabel with a no-op OR a narrow
        fix that ONLY handles edge label parentheses patterns
      - Safest option: delete fixMermaidSyntax entirely and test.
        Data is clean from the transform pipeline.
      - If kept, add unit tests for known diagram types to prevent regression

[D03] Upgrade Mermaid to v10
      - mermaid ^9.4.3 → ^10.9.3 (via package manager)
      - v10 API is compatible: render(id, code) still returns { svg, bindFunctions }
      - Remove the d${renderId} cleanup hack (lines 333–334) — no longer needed
      - Remove the 50ms setTimeout workaround (line 322) — no longer needed in v10
      - Verify all diagram types render (use D10 smoke-test page)

[D04] Add render queue to serialize concurrent mermaid operations
      - Add module-level: let renderQueue = Promise.resolve()
      - Wrap the initMermaid + mermaid.render sequence inside:
        renderQueue = renderQueue.then(() => doRender())
      - Remove force=true from initMermaid inside the render effect
      - Add a separate stable effect that calls initMermaid(theme)
        only when effectiveTheme changes (no render trigger)
      - This eliminates BUG-02 theme races completely

[D05] Add mermaid intercept to RichTextRenderer.tsx
      - In the code block render branch, check block.lang === 'mermaid'
      - If true: return <EnhancedMermaid chart={block.content} />
      - Import EnhancedMermaid lazily (already used in AnswerPanel)
      - This fixes BUG-04 — fixes mermaid in the majority of question explanations

[D06] Add mermaid intercept to ReviewSession.tsx ReactMarkdown
      - In the components.code renderer, add:
        if (!inline && (className?.includes('mermaid') || lang === 'mermaid'))
          return <EnhancedMermaid chart={String(children).trim()} />
      - Place BEFORE the syntax highlighter branch
      - This fixes BUG-05

[D07] Site-wide audit of all ReactMarkdown + markdown rendering usages
      - grep all .tsx for ReactMarkdown, marked, remark, unified
      - Every site that renders question/blog markdown needs the mermaid intercept
      - Known status after D05/D06:
          AnswerPanel.tsx ✅ (already correct)
          MarkdownRenderer.tsx ✅ (already correct)
          ExtremeAnswerPanel.tsx ✅ (already correct)
          RichTextRenderer.tsx ❌ → fixed by D05
          ReviewSession.tsx ❌ → fixed by D06
      - Fix any remaining gaps found in audit

[D08] Improve diagram error UI from AlertTriangle to recoverable state
      - Current: AlertTriangle icon + raw error string (unreadable)
      - New: "⚠ Diagram unavailable" heading + collapsible raw mermaid
        code block (for copy/debug) + a "Retry" button that resets error
        state and re-triggers the render useEffect
      - Also: add console.warn (not error) with the diagram content
        that failed — helps debugging without polluting the console

[D09] Fix the console.error suppression side-effect
      - Lines 325–332 do: const origError = console.error; console.error = () => {};
        ... try { render } finally { console.error = origError; }
      - This is a global side-effect that silences ALL console.error
        calls during the async overlap window (other components, network errors)
      - v10 (D03) is much less noisy — simply remove the suppression entirely
      - If needed for specific Mermaid internal warnings, use a targeted
        monkey-patch that only filters messages containing 'mermaid' in the source

[D10] Create dev-only diagram smoke-test page
      - New file: client/src/pages/admin/DiagramTest.tsx
      - Admin route: /admin/diagrams (already behind /admin/* pattern if it exists)
      - Renders one diagram of each type:
          flowchart TD, sequenceDiagram, classDiagram, stateDiagram-v2,
          erDiagram, gantt, gitGraph, pie, mindmap
      - Each card shows: rendered diagram + raw source + render status
      - Used after any future mermaid version change to catch regressions visually
      - Not linked in nav — dev utility only (document the URL in replit.md)
```

---

## Part 2 — Page Unification (State-of-the-Art UIUX)

### Current State Audit

| Page | Lines | Header | Filter UI | Card style | Scroll | Empty state |
|------|-------|--------|-----------|------------|--------|-------------|
| ReviewSession | 927 | Custom sticky | Inline chips | Full-width flip | Full page | Custom inline |
| Bookmarks | 401 | PageHeader | Separate row | Vertical list items | Full page | Basic |
| Flashcards | 346 | PageHeader | None | Full-width flip | Full page | Inline |
| Profile | 696 | PageHeader + tabs | Tab strip | Stat chips + charts | Full page scroll | Per-tab |
| AnswerHistory | 402 | PageHeader | Multi-row strip | Table rows | Full page | Basic |

**Problems identified across all pages:**
1. Five different header implementations — no shared shell
2. Three different filter bar patterns (chips / dropdown rows / none)
3. Rating buttons scroll off-screen when answers are long
4. Bookmarks and AnswerHistory scroll an unbounded list without virtualization
5. ReviewSession (927 lines) mixes layout, data, animation, and business logic
6. No consistent card border-radius, glassmorphism level, or hover state
7. Empty states vary wildly in visual weight and information
8. No keyboard navigation manifest — hotkeys are ad-hoc and undiscoverable
9. No command palette — power-user dead end
10. Mobile: bottom nav doesn't always match the active route

---

### Design Language — Target State

**Core principle: "No dead scroll" — every pixel on screen is either content or an action.**

```
┌─────────────────────────────────────────────────┐
│  STICKY CHROME  56px (desktop) / 48px (mobile)  │
│  ← Back    [Page Title + badge]    [Actions…]   │
├─────────────────────────────────────────────────┤
│  CONTEXT BAR  40px  (hides on scroll-down)       │
│  [Filter chips / Search]  [Sort ▼]  [N items]   │
├─────────────────────────────────────────────────┤
│                                                   │
│  CONTENT AREA  — fills remaining viewport height  │
│  Scrolls independently (overflow-y-auto)          │
│                                                   │
├─────────────────────────────────────────────────┤
│  STICKY BOTTOM (SRS pages only)  64px            │
│  [Again]  [Hard]  [Good]  [Easy]                 │
└─────────────────────────────────────────────────┘
```

**Design tokens to unify across all pages:**

| Token | Value | Usage |
|-------|-------|-------|
| `--card-bg` | `rgba(255,255,255,0.05)` | All card backgrounds |
| `--card-border` | `rgba(255,255,255,0.08)` | Card borders at rest |
| `--card-border-hover` | `rgba(255,255,255,0.16)` | Card borders on hover |
| `--card-radius` | `16px` | All card corners (rounded-2xl) |
| `--accent-primary` | `#00d4ff` | Cyan — primary actions |
| `--accent-secondary` | `#7c3aed` | Violet — secondary/SRS |
| `--success` | `#10b981` | Emerald — correct / Easy |
| `--warning` | `#f59e0b` | Amber — Hard |
| `--danger` | `#f43f5e` | Rose — Again / delete |
| `--chrome-height` | `56px` | Sticky header height |
| `--context-height` | `40px` | Context bar height |
| `--bottom-height` | `64px` | Sticky rating bar height |

---

### Shared Components to Create

```
[U00] UnifiedPageShell  (client/src/components/layout/UnifiedPageShell.tsx)
      
      The single layout wrapper all unified pages use. Replaces ad-hoc
      header + AppLayout combinations.
      
      Props:
        title: string
        badge?: { label: string; variant: 'cyan'|'violet'|'rose'|'emerald' }
        headerLeft?: ReactNode       ← back button, avatar, etc.
        headerRight?: ReactNode      ← action buttons (Start Session, Share, etc.)
        contextBar?: ReactNode       ← filter bar contents; hides on scroll-down
        stickyBottom?: ReactNode     ← rating bar for SRS pages
        isLoading?: boolean          ← shows skeleton pulse in content area
        empty?: EmptyStateProps      ← shown when content area has zero items
        children: ReactNode          ← content area
      
      Behavior:
        - Sticky 56px chrome (backdrop-blur-xl, border-b border-white/8)
        - Context bar collapses (translateY -40px) after 40px downscroll,
          re-appears immediately on any upward scroll (useScrollDirection hook)
        - Content area = remaining viewport height (calc(100vh - chrome - context - bottom))
        - Passes children into overflow-y-auto scroll container
        - Loading state: renders skeleton overlay, not spinner
        - Empty state: renders UnifiedEmptyState centered in content area
      
      This replaces: AppLayout + PageHeader on ReviewSession, Bookmarks,
      Flashcards, AnswerHistory, Profile

[U01] UnifiedFilterBar  (client/src/components/ui/UnifiedFilterBar.tsx)
      
      Single reusable filter row used inside contextBar of UnifiedPageShell.
      
      Props:
        search?: { value; onChange; placeholder }
        chips?: Array<{ id; label; count?; active; onClick }>
        sort?: { options: [{id,label}]; value; onChange }
        totalCount?: number
        onReset?: () => void         ← shown only when any filter is active
      
      Visual:
        - Search input (icon-left, clear button) 32px height
        - Chips: pill-style, 28px, active = bg-white/15 + border-white/30
        - Sort: Radix DropdownMenu, 32px trigger
        - "N results" count fades to "3 filters active · Reset" when filtered
        - On mobile: chips scroll horizontally (overflow-x-auto, no wrap)
      
      Replaces:
        - Bookmarks custom filter bar
        - ReviewSession channel chip list
        - AnswerHistory multi-row filter strip

[U02] UnifiedCard  (client/src/components/ui/UnifiedCard.tsx)
      
      Polymorphic card with 3 variants. All share border/radius/hover tokens.
      
      Variant 'compact' (72px):
        - Left accent bar (4px, color prop)
        - Icon + title + right metadata + action icons
        - Tap/click area: full row
        - Used by: Bookmarks list, AnswerHistory list (mobile)
      
      Variant 'expanded' (dynamic height):
        - Everything from compact + body slot (answer preview, diagram mini)
        - Smooth height animation via CSS grid rows trick (no layout shift)
        - Used by: Bookmarks expanded item
      
      Variant 'hero' (fills container height):
        - Full-bleed card with front/back faces (CSS 3D flip)
        - Used by: ReviewSession card, Flashcards card

[U03] UnifiedEmptyState  (client/src/components/ui/UnifiedEmptyState.tsx)
      
      Props: icon (lucide), title, body, primaryCta?, secondaryCta?
      
      Visual:
        - Vertically centered in content area
        - Icon 48px, muted (opacity-40)
        - h2 title (text-lg font-semibold)
        - p body (text-sm text-muted-foreground, max-w-xs)
        - Primary CTA: filled button
        - Secondary CTA: ghost/link button
      
      Replaces all per-page custom empty states.

[U04] useScrollDirection hook  (client/src/hooks/use-scroll-direction.ts)
      
      Subscribes to a scroll container ref (or window).
      Returns: 'up' | 'down' | 'top'
      Threshold: 40px down before emitting 'down', any upward movement = 'up'
      Used by UnifiedPageShell to drive context bar collapse animation.
```

---

### Per-Page Redesign TODO

```
[P01] ReviewSession — Focus mode, zero wasted space

      Current problems:
      - 927 lines mixing layout, data fetch, animation, SRS logic
      - Header + channel selector consume ~120px before card
      - Long answers push rating buttons off-screen (must scroll to rate)
      - Answer section has no height cap — diagram + explanation + code = 600px+
      - ReactMarkdown mermaid missing (fixed by D06, but layout still broken)

      Target layout:
        CHROME (56px):  ← Review    Card 5 of 20  [███████░░░]  🔥7
        CONTEXT (40px): [All Topics ▼]  [Focus Mode ○]
        CONTENT (flex): Full-height flip card
                        FRONT: Question text (centered, large)
                        BACK: Answer in overflow-y-auto container with max-h
                              Diagram renders INSIDE the scroll area
        BOTTOM (64px):  [Again] [Hard] [Good] [Easy]  ← ALWAYS visible, sticky

      Implementation steps:
        1. Wrap in UnifiedPageShell (remove AppLayout + PageHeader)
        2. Progress bar → compact pill in chrome right side (not a separate row)
        3. Channel selector → UnifiedFilterBar in contextBar slot
        4. Answer panel: add overflow-y-auto + max-h-[calc(100vh-260px)]
           so it scrolls INSIDE the card, not the page
        5. Rating bar → stickyBottom slot of UnifiedPageShell
           Position: fixed on mobile, sticky within shell on desktop
        6. Extract sub-components to reduce file from 927 → ~350 lines:
             <SRSChrome />         (progress, streak in header)
             <QuestionCard />      (flip card, front + back)
             <AnswerContent />     (markdown + diagram render)
             <RatingBar />         (Again/Hard/Good/Easy)
        7. Add keyboard: Space=flip, 1=Again, 2=Hard, 3=Good, 4=Easy, ←→=nav

[P02] Bookmarks — Scan and act, not scroll and hunt

      Current problems:
      - Vertical scroll list with no density option
      - Expanding items causes jarring layout shift
      - Filter bar is 80px and visually heavy
      - No bulk actions
      - Mobile: no swipe-to-delete

      Target layout:
        CHROME (56px):  Bookmarks  [42 saved]         [▶ Start Session]
        CONTEXT (40px): [🔍 Search…] [Channel ▼] [Sort ▼]   3 active · Reset
        CONTENT:        Compact card list
                          Card (72px): [●] Title  [Easy] channel   [▶][🗑]
                          Tapped card (animated expand to 180px):
                            + Answer snippet (3 lines, clipped)
                            + [View Full Answer] button
                          Mobile swipe-left: reveals delete action

      Implementation steps:
        1. UnifiedPageShell with "Start Session" CTA in headerRight
        2. UnifiedFilterBar in contextBar (search + channel chips + sort)
        3. UnifiedCard variant='compact' for each bookmark
        4. Expand animation: CSS grid rows trick
           (grid-template-rows: 0fr → 1fr, no JS height calculation)
        5. Swipe gesture: use framer-motion drag with dragElastic + snap threshold
        6. Bulk select: long-press activates select mode (checkbox appears left)
           Bottom bar slides up with "Delete Selected" and "Review Selected"
        7. "Start Session" → navigate to /review with bookmark IDs in query param

[P03] Flashcards — Pure focus, one card at a time

      Current problems:
      - PageHeader wastes 80px
      - Deck selector not visible until you look for it
      - Rating buttons appear only after flip (confusing for new users)
      - No keyboard hint visible
      - 3D flip animation uses Framer Motion (sometimes stutters on mobile)

      Target layout:
        CHROME (56px):  Flashcards  [Deck: All ▼]     [12 / 50]
        CONTENT (flex): 3D flip card — fills remaining viewport
                          FRONT: Question + difficulty chip
                                 "Tap to reveal" hint (fades after first flip)
                          BACK: Answer + Recall textarea
                                "Rate yourself:"
        BOTTOM (64px):  [Again] [Hard] [Good] [Easy]  ← always visible
        HINT BAR(24px): Space to flip · 1 Again · 2 Hard · 3 Good · 4 Easy

      Implementation steps:
        1. UnifiedPageShell with deck selector in headerRight
        2. Remove separate PageHeader, context bar not needed
        3. Rating bar → stickyBottom slot (always visible, not conditional on flip)
        4. Replace Framer Motion 3D flip with pure CSS:
             .card { transform-style: preserve-3d; transition: transform 0.4s ease }
             .card.flipped { transform: rotateY(180deg) }
           This is GPU-composited, never jitters
        5. Keyboard hint bar (24px, below content area, above bottom bar)
        6. Progress: "12 / 50" in chrome right side (not a separate progress bar)
        7. On empty deck: UnifiedEmptyState with CTA to subscribe to a channel

[P04] AnswerHistory — Browse and replay

      Current problems:
      - Multi-row filter strip takes 100px+
      - Table layout breaks below 640px (horizontal scroll)
      - No quick-replay inline
      - Date range filter UX is complex (date picker)

      Target layout:
        CHROME (56px):  History  [284 answers]            [Export CSV]
        CONTEXT (40px): [🔍 Search…] [Channel ▼] [Today|Week|Month|All]
        CONTENT:
          Mobile: UnifiedCard compact list
            Card: Question (1 line, truncate) · Channel chip · Date · Rating badge
                  Right: [▶ Review]
          Desktop (≥md): Sticky-header table (no horizontal scroll)
            Cols: Question | Channel | Date | Rating | Action

      Implementation steps:
        1. UnifiedPageShell with "Export CSV" in headerRight
        2. UnifiedFilterBar in contextBar
           - Date filter: quick pills (Today / This Week / This Month / All)
             replaces the date picker component entirely
        3. Mobile view: UnifiedCard compact list (not table)
        4. Desktop view: keep table, make header sticky (position: sticky top-0)
           fix column widths to prevent horizontal scroll at 768px+
        5. [▶ Review] on each row: navigate(/channel/{channelId}/{questionIndex})
        6. Add virtual scroll (react-window FixedSizeList) when list > 200 items
           to keep mobile performance smooth with large history

[P05] Profile — At-a-glance without scrolling

      Current problems:
      - Two tabs hide half the data (must click to discover)
      - Stats charts require heavy scroll to see all
      - Achievement grid is dense with no scan hierarchy
      - Level progress bar is small and easy to miss

      Target layout:
        CHROME (56px):  [Avatar] Username  Lv.12  [█████████░] 840/1000 XP
        CONTEXT (40px): [Overview] [Stats] [Badges]   (3-tab context bar)
        CONTENT per tab:
          Overview: 2×2 bento grid (XP / Streak / Questions / Accuracy)
                    7-day activity strip (compact heatmap)
                    Top 3 channels by completion (horizontal bars)
          Stats:    2-column chart grid, each chart max-h 200px
                    Recharts ResponsiveContainer fills each cell
          Badges:   3-column masonry grid
                    Unlocked: full color + shine effect
                    Locked: grayscale 0.2 opacity + lock icon overlay

      Implementation steps:
        1. UnifiedPageShell; level bar lives in chrome right area (compact pill)
        2. 3-tab strip → context bar (not full-width tabs, pill-style 3 options)
        3. Overview tab: 2×2 UnifiedCard bento (stat variant: icon + number + label)
        4. Stats tab: CSS grid 2-col, recharts ResponsiveContainer capped at 200px
        5. Badges tab: CSS masonry (columns: 3, column-gap) or grid auto-rows
        6. Add "Share Stats" button in headerRight → generates OG-card-style image
           (future: screenshot canvas and download as PNG)
        7. Remove duplicated metrics between old Profile + Stats tabs
```

---

### Cross-Cutting UX Enhancements

```
[X01] Global command palette (Cmd+K / Ctrl+K)
      File: client/src/components/CommandPalette.tsx (NEW)
            client/src/App.tsx (register global keydown listener)
      
      Default state (no query): Recent + pinned commands
      Typed query: fuzzy-filters all commands + channel names + question titles
      
      Command groups:
        Navigate:  Go to Review, Bookmarks, Flashcards, Profile, History, Blog
        Actions:   Bookmark current question, Start review session, Open settings
        Channels:  (dynamic) Go to channel → /channel/{id}
        Search:    Full-text question search (calls existing search API)
      
      Implementation: Radix Dialog + Radix Command (cmdk-compatible pattern)
      Keyboard: Cmd+K opens, Esc closes, ↑↓ navigate, Enter selects

[X02] Keyboard shortcut manifest
      File: client/src/lib/keyboard-shortcuts.ts (NEW)
      
      Single source of truth for all hotkeys:
        /           → focus search (any page)
        Escape      → clear search / close modal
        Space       → flip card (Flashcards, ReviewSession)
        1/2/3/4     → rate Again/Hard/Good/Easy
        ←  →        → navigate questions
        Cmd+K       → command palette
        B           → bookmark current question
        R           → start review session
        H           → go to history
      
      Each shortcut: { key, description, scope, handler }
      Scope: 'global' | 'flashcards' | 'review' | 'question'
      
      Tooltips on buttons should show the shortcut key as a small badge.

[X03] Replace all spinners with skeleton loading states
      Files: affected page files
      
      Every page that fetches async data must show skeleton shapes that match
      the final layout (no layout shift when data arrives):
        Bookmarks:     5 skeleton compact cards (72px height each)
        ReviewSession: skeleton flip card (full height)
        AnswerHistory: skeleton table rows (5 rows)
        Profile/Stats: skeleton bento squares + skeleton chart boxes
        Flashcards:    skeleton card shell
      
      Use: existing Skeleton component + matching height/width props
      Never show a centered spinner in a content area.

[X04] Micro-interaction polish
      Files: component and page files (small targeted changes)
      
      - Card hover: border lightens (--card-border-hover) + translateY(-2px)
        Duration: 150ms ease-out. NOT translateY(-4px) — too jumpy.
      - Rating buttons: press scale 0.95 → 1.0, 80ms spring
        Color flash: background briefly brightens on press
      - Bookmark toggle: icon scale 1 → 1.3 → 1.0 with color fill, 200ms spring
      - Page transition: slide-left on drill-down (/channels → /channel/id),
        slide-right on back navigation. Fade only for top-level tabs.
      - Progress bar: smooth increment animation using CSS transition on width,
        not step-jump. Use a 300ms ease-in-out transition.
      - Context bar collapse: translateY(-40px) with 200ms ease, not instant.

[X05] Mobile bottom nav audit and fix
      File: client/src/components/layout/MobileBottomNav.tsx
      
      Audit: confirm all 5 primary pages are reachable + active state matches route.
      Issues to fix:
        - Active route detection: use useLocation() exact match, not startsWith
          (prevents /channel/* from lighting up /channels nav item wrongly)
        - Add haptic feedback: navigator.vibrate?.(10) on each nav tap
        - Ensure safe-area-inset-bottom is applied to nav height
          (critical for iPhone home indicator area)
        - Review, Bookmarks, Flashcards, Profile, Home should be the 5 items

[X06] CSS design token consolidation
      File: client/src/styles/design-system-unified.css (or index.css)
      
      Extract all one-off rgba/hex values from page files into CSS variables.
      Define in :root:
        --color-card-bg: rgba(255,255,255,0.05);
        --color-card-border: rgba(255,255,255,0.08);
        --color-card-border-hover: rgba(255,255,255,0.16);
        --color-chrome-bg: rgba(0,0,0,0.6);
        --color-accent-cyan: #00d4ff;
        --color-accent-violet: #7c3aed;
        --color-success: #10b981;
        --color-warning: #f59e0b;
        --color-danger: #f43f5e;
      
      Run a grep for all hardcoded rgba/hex values in the 5 target page files
      and replace with variables. This is a prerequisite for any future theming.
```

---

## Execution Order

### Phase 1 — Fix Diagrams (unblock broken functionality first)

```
D02 (neutralize fixMermaidSyntax)
  → D01 (remove phantom cache fetch)
    → D03 (upgrade mermaid to v10)
      → D04 (add render queue)
        → D09 (fix console.error suppression)
          → D08 (improve error UI)

D05 (RichTextRenderer mermaid intercept)  ← parallel with above
D06 (ReviewSession mermaid intercept)     ← parallel with above
D07 (site-wide audit)                     ← after D05 + D06
D10 (smoke-test page)                     ← last, validates all of Phase 1
```

Estimated: **~4 hours** — highest ROI, unblocks diagrams everywhere.

---

### Phase 2 — Shared Component Foundation

```
X06 (CSS tokens first — everything depends on clean tokens)
  → U04 (useScrollDirection hook)
    → U00 (UnifiedPageShell)
      → U01 (UnifiedFilterBar)
        → U02 (UnifiedCard)
          → U03 (UnifiedEmptyState)
```

Estimated: **~3 hours** — foundation for Phase 3.

---

### Phase 3 — Page Redesigns (one at a time)

```
P01 (ReviewSession — highest traffic, validates the shell pattern)
  → P03 (Flashcards — similar SRS pattern, reuses P01 components)
    → P02 (Bookmarks — different pattern: list + filter)
      → P04 (AnswerHistory — similar to Bookmarks)
        → P05 (Profile — most complex, tabbed bento)
```

Estimated: **~10 hours** across all pages.

---

### Phase 4 — Polish

```
X03 (skeletons — all pages)
X04 (micro-interactions — targeted)
X05 (mobile nav audit)
X01 (command palette)
X02 (keyboard manifest)
```

Estimated: **~4 hours**

---

## Files Changed Summary

| File | Change |
|------|--------|
| `client/src/lib/diagram-cache.ts` | Remove fetchCachedSvg, simplify fixMermaidSyntax |
| `client/src/components/InteractiveDiagram.tsx` | Render queue, v10 compat, error UX, no more suppression |
| `client/src/components/RichTextRenderer.tsx` | Add mermaid block intercept |
| `client/src/pages/ReviewSession.tsx` | Mermaid intercept + full redesign (~927→350 lines) |
| `client/src/pages/Bookmarks.tsx` | Full redesign |
| `client/src/pages/Flashcards.tsx` | Full redesign |
| `client/src/pages/AnswerHistory.tsx` | Full redesign |
| `client/src/pages/Profile.tsx` | Redesign |
| `client/src/components/layout/UnifiedPageShell.tsx` | **NEW** |
| `client/src/components/ui/UnifiedFilterBar.tsx` | **NEW** |
| `client/src/components/ui/UnifiedCard.tsx` | **NEW** |
| `client/src/components/ui/UnifiedEmptyState.tsx` | **NEW** |
| `client/src/hooks/use-scroll-direction.ts` | **NEW** |
| `client/src/components/CommandPalette.tsx` | **NEW** |
| `client/src/lib/keyboard-shortcuts.ts` | **NEW** |
| `client/src/pages/admin/DiagramTest.tsx` | **NEW** (dev only) |
| `client/src/styles/design-system-unified.css` | Token consolidation |
| `client/package.json` | mermaid ^9.4.3 → ^10.9.3 |

---

*Plan created: 2026-06-04 — zero code changed. Ready for implementation on approval.*
