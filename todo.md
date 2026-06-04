# Open Interview — Master Todo

> Diagram fixes + Page unification plan
> Last verified: 2026-06-04

---

## Verification Summary — What's Done

| Item | Description | Status |
|------|-------------|--------|
| D01 | Remove fetchCachedSvg call from InteractiveDiagram | ✅ Done (orphaned but not called) |
| D02 | Remove/neutralize fixMermaidSyntax | ✅ Done — removed from diagram-cache.ts |
| D03 | Upgrade Mermaid to v10 | ✅ Done — ^10.9.3 in package.json |
| D04 | Add render queue to serialize concurrent renders | ✅ Done — renderQueue in InteractiveDiagram.tsx |
| D05 | Add mermaid intercept to RichTextRenderer.tsx | ✅ Done — line 362 |
| D06 | ReviewSession — extract SRS sub-components + mermaid | ✅ Done — 927→352 lines, AnswerContent.tsx has intercept |
| D07 | Site-wide ReactMarkdown mermaid audit | ✅ Done — TestSession.tsx also has intercept |
| D09 | Remove console.error global suppression | ✅ Done — only legitimate error log remains |
| U00 | UnifiedPageShell component | ✅ Done — layout/UnifiedPageShell.tsx |
| U01 | UnifiedFilterBar component | ✅ Done — ui/UnifiedFilterBar.tsx |
| U02 | UnifiedCard component | ✅ Done — ui/UnifiedCard.tsx |
| U03 | UnifiedEmptyState component | ✅ Done — ui/UnifiedEmptyState.tsx |
| U04 | useScrollDirection hook | ✅ Done — hooks/use-scroll-direction.ts |
| P01 | ReviewSession redesign | ✅ Done — SRSChrome, QuestionCard, RatingBar, AnswerContent extracted |
| P02 | Bookmarks redesign | ✅ Done — uses UnifiedFilterBar + UnifiedCard + UnifiedEmptyState |
| P03 | Flashcards redesign | ✅ Done — CSS preserve-3d flip, keyboard shortcuts, hint bar |
| P04 | AnswerHistory redesign | ✅ Done — 402→273 lines, unified components |

---

## Remaining Work

### 🔴 High Priority

```
[R01] Delete dead code: fetchCachedSvg in diagram-cache.ts
      File: client/src/lib/diagram-cache.ts
      The function is exported but never imported anywhere.
      The sha256Hex helper and extractCode are also now unused.
      Action: Delete the entire file or strip to just an empty export.
      Why: Dead code confuses future developers and may mislead
           someone into thinking the cache is active when it isn't.

[R02] Profile page — redesign to use unified components (P05)
      File: client/src/pages/Profile.tsx
      Current: 702 lines, uses AppLayout directly, no UnifiedPageShell,
      no bento layout, two-tab structure (Profile + Stats merged into one
      scrolling page with redundant data sections).
      
      Target:
        - Wrap with UnifiedPageShell (replace AppLayout)
        - Header: [Avatar] Name · Lv.12 [████░] 840 XP
        - Context bar: 3-tab pill strip [Overview | Stats | Badges]
        - Overview tab: 2×2 bento stat grid + 7-day activity strip + top 3 channels
        - Stats tab: 2-col chart grid, each chart capped at 200px height
        - Badges tab: 3-col masonry, locked = grayscale 0.2 + lock icon overlay
        - Remove duplicate metrics shared between current Profile and Stats views
        - "Share Stats" action button in header right slot

[R03] Diagram error recovery UI (D08)
      File: client/src/components/InteractiveDiagram.tsx
      Current error state: AlertTriangle + raw error string (unreadable to users)
      
      Replace with:
        - "⚠ Diagram unavailable" heading (text-sm font-medium)
        - Collapsible <details> with the raw mermaid source (copy-friendly)
        - "Retry" button that resets error state + re-triggers render useEffect
          (just increment a retry counter that's added to the useEffect deps)
        - console.warn with diagram hash for silent debugging
```

---

### 🟡 Medium Priority

```
[R04] Command palette — wire up existing cmdk primitive (X01)
      File: client/src/components/CommandPalette.tsx (NEW)
             client/src/App.tsx (register Cmd+K listener)
      
      Good news: cmdk is already installed and client/src/components/ui/command.tsx
      has the Radix primitives built. Just needs the application-level wrapper.
      
      Implementation:
        1. Create CommandPalette.tsx using the existing Command + CommandDialog primitives
        2. Populate command groups:
             Navigate: Review, Bookmarks, Flashcards, Profile, History, Blog, Channels
             Actions: Bookmark current Q, Start review, Open settings
             Channels: dynamic list from channels data (→ /channel/{id})
        3. In App.tsx add:
             useEffect(() => {
               const handler = (e: KeyboardEvent) => {
                 if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                   e.preventDefault(); setCommandOpen(true);
                 }
               };
               window.addEventListener('keydown', handler);
               return () => window.removeEventListener('keydown', handler);
             }, []);
        4. Render <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
           inside the App root (above routing)

[R05] CSS design token consolidation (X06)
      File: client/src/styles/ (index.css or design-system-unified.css)
      
      Find and extract all one-off rgba/hex card values across the 5 unified pages.
      Define in :root:
        --color-card-bg: rgba(255,255,255,0.05);
        --color-card-border: rgba(255,255,255,0.08);
        --color-card-border-hover: rgba(255,255,255,0.16);
        --color-chrome-bg: rgba(0,0,0,0.60);
        --color-accent-cyan: #00d4ff;
        --color-accent-violet: #7c3aed;
        --color-success: #10b981;
        --color-warning: #f59e0b;
        --color-danger: #f43f5e;
      Then replace hardcoded values in UnifiedCard.tsx, UnifiedFilterBar.tsx,
      UnifiedPageShell.tsx, and the 4 redesigned page files.

[R06] Skeleton loading states — replace spinners/blank states (X03)
      Files: all redesigned page files
      
      Each page that loads async data needs matching skeleton shapes:
        Bookmarks:     5 UnifiedCard skeleton rows (72px each, animate-pulse)
        ReviewSession: skeleton flip card shell (full height)
        AnswerHistory: 5 skeleton list card rows
        Profile:       skeleton 2×2 bento + skeleton chart boxes
        Flashcards:    skeleton card shell
      
      Use the existing Skeleton component (client/src/components/ui/skeleton.tsx).
      Pattern: isLoading === true → render skeletons, not a spinner.

[R07] Mobile bottom nav audit and haptic feedback (X05)
      File: client/src/components/layout/UnifiedNav.tsx (MobileBottomNav)
      
      Checks needed:
        1. Active route: use exact useLocation() match, not startsWith()
           (prevents /channel/linux from lighting up the /channels nav item)
        2. Haptic: add navigator.vibrate?.(10) on each nav tap
        3. Safe area: confirm padding-bottom uses env(safe-area-inset-bottom)
           for iPhone home indicator clearance
        4. The 5 items should be: Home / Channels / Review / Flashcards / Profile
           (Bookmarks is secondary — accessible via sidebar or command palette)
```

---

### 🟢 Lower Priority / Polish

```
[R08] Keyboard shortcuts manifest (X02)
      File: client/src/lib/keyboard-shortcuts.ts (NEW)
      
      Single documented registry of all hotkeys. Currently hotkeys are
      scattered across Flashcards.tsx (keyboard handler), ReviewSession
      sub-components (Space/1-4/←→), and App.tsx (once Cmd+K added in R04).
      
      Create a typed registry:
        export const SHORTCUTS = {
          commandPalette: { keys: ['Meta+k', 'Ctrl+k'], scope: 'global', description: '...' },
          search:         { keys: ['/'],                scope: 'global', description: '...' },
          flipCard:       { keys: ['Space'],             scope: 'srs',    description: '...' },
          rateAgain:      { keys: ['1'],                 scope: 'srs',    description: '...' },
          rateHard:       { keys: ['2'],                 scope: 'srs',    description: '...' },
          rateGood:       { keys: ['3'],                 scope: 'srs',    description: '...' },
          rateEasy:       { keys: ['4'],                 scope: 'srs',    description: '...' },
          bookmark:       { keys: ['b'],                 scope: 'question', description: '...' },
        } as const;
      This enables a future "Keyboard shortcuts" help modal and consistent
      tooltip badges showing shortcut keys on buttons.

[R09] Micro-interaction polish (X04)
      Files: UnifiedCard.tsx, RatingBar.tsx, client/src/components/srs/RatingBar.tsx
      
      Small targeted changes for physical feel:
        - UnifiedCard hover: border transitions to --color-card-border-hover
          + translateY(-2px) in 150ms ease-out (not -4px, too jumpy)
        - Rating buttons (RatingBar): add whileTap={{ scale: 0.94 }} if not present,
          and a brief background brighten on press (brightness-125 for 80ms)
        - Bookmark toggle: heart/star scale 1→1.3→1.0 spring on activation
          (add spring transition to the icon, 200ms)
        - Progress bar: add transition-all duration-300 ease-in-out to width
          (prevents hard jumps when card count changes)
        - Page transitions: current fade-in is fine; add slide direction:
          drill-down (→ /channel/:id) slides left, back navigation slides right

[R10] DiagramTest dev page for regression testing (D10)
      File: client/src/pages/admin/DiagramTest.tsx (NEW)
             client/src/App.tsx (add /admin/diagrams route, lazy-loaded)
      
      A hidden dev-only page (not in nav) that renders one diagram per type:
        flowchart TD, sequenceDiagram, classDiagram, stateDiagram-v2,
        erDiagram, gantt, pie, gitGraph, mindmap
      Each rendered in a card showing: diagram SVG + raw source + "✓ OK / ✗ Error" badge.
      Used after any mermaid version bump to catch regressions visually.
      Document the URL (/admin/diagrams) in replit.md.
```

---

## Execution Order for Remaining Work

```
Immediate (unblocks users):
  R01 (dead code cleanup) — 10 min
  R02 (Profile redesign) — 3 hrs
  R03 (diagram error recovery) — 1 hr

Then:
  R05 (CSS tokens) → R04 (command palette) → R06 (skeletons) → R07 (mobile nav)

Polish last:
  R08 (keyboard manifest) → R09 (micro-interactions) → R10 (diagram smoke-test)
```

---

## Files Still to Touch

| File | Change |
|------|--------|
| `client/src/lib/diagram-cache.ts` | Delete entirely (R01) |
| `client/src/components/InteractiveDiagram.tsx` | Retry button + error UX (R03) |
| `client/src/pages/Profile.tsx` | Full redesign with UnifiedPageShell (R02) |
| `client/src/components/CommandPalette.tsx` | **NEW** — wire cmdk (R04) |
| `client/src/App.tsx` | Cmd+K listener + CommandPalette render (R04) |
| `client/src/styles/index.css` (or design-system) | CSS token vars (R05) |
| `client/src/components/ui/UnifiedCard.tsx` | Use CSS tokens (R05) |
| `client/src/pages/Bookmarks.tsx` | Skeleton loading state (R06) |
| `client/src/pages/ReviewSession.tsx` | Skeleton loading state (R06) |
| `client/src/pages/AnswerHistory.tsx` | Skeleton loading state (R06) |
| `client/src/pages/Flashcards.tsx` | Skeleton loading state (R06) |
| `client/src/components/layout/UnifiedNav.tsx` | Haptic + exact active match (R07) |
| `client/src/lib/keyboard-shortcuts.ts` | **NEW** — shortcut registry (R08) |
| `client/src/pages/admin/DiagramTest.tsx` | **NEW** — smoke-test page (R10) |

---

*Verified: 2026-06-04. No code changed in this session — plan only.*
