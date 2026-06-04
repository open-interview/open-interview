# Open Interview — Master Todo

> Diagram fixes + Page unification
> Last verified: 2026-06-04 (second pass)

---

## Full Audit — All Items

| Item | Description | Status |
|------|-------------|--------|
| D01 | Remove fetchCachedSvg call path | ✅ Dead-code file emptied (`export {}`) |
| D02 | Remove fixMermaidSyntax | ✅ Removed from diagram-cache.ts |
| D03 | Upgrade Mermaid to v10 | ✅ `^10.9.3` |
| D04 | Render queue for concurrent renders | ✅ `renderQueue` in InteractiveDiagram.tsx |
| D05 | Mermaid intercept in RichTextRenderer | ✅ Line 362 |
| D06 | ReviewSession — SRS sub-components + mermaid | ✅ 927→352 lines; `AnswerContent.tsx` has intercept |
| D07 | Site-wide ReactMarkdown mermaid audit | ✅ TestSession.tsx also has intercept |
| D08 | Diagram error recovery UI (Retry + raw source) | ✅ `retryKey` state, `<details>` collapsible, Retry button |
| D09 | Remove console.error global suppression | ✅ Only legitimate init error log remains |
| D10 | Admin DiagramTest smoke-test page | ✅ `client/src/pages/admin/DiagramTest.tsx` |
| U00 | UnifiedPageShell component | ✅ Created; Cmd+K wired via `onCommandOpen` |
| U01 | UnifiedFilterBar component | ✅ Created |
| U02 | UnifiedCard component | ✅ Created with `microInteractions.card.whileTap` |
| U03 | UnifiedEmptyState component | ✅ Created |
| U04 | useScrollDirection hook | ✅ Created |
| P01 | ReviewSession redesign | ✅ SRSChrome / QuestionCard / RatingBar / AnswerContent extracted |
| P02 | Bookmarks redesign | ✅ Uses all Unified components |
| P03 | Flashcards redesign | ✅ CSS `preserve-3d` flip, keyboard hints bar, Space/1-4/←→ |
| P04 | AnswerHistory redesign | ✅ 402→273 lines, UnifiedFilterBar + UnifiedCard |
| P05 | Profile redesign | ✅ UnifiedPageShell, 3-tab Overview/Stats/Badges, 702→624 lines |
| X01 | Command palette (Cmd+K) | ✅ `CommandPalette.tsx` built; Cmd+K listener in `AppLayout.tsx` line 70 + button in `UnifiedPageShell` navbar |
| X04 | Micro-interaction polish | ✅ UnifiedCard `whileTap`, RatingBar `scale: 0.92`, `active:scale-[0.98]` |
| X05 | Mobile nav — exact route matching | ✅ Uses `location === item.path \|\| location.startsWith(item.path + '/')` (prevents false positives) |
| R05 | CSS design token system | ✅ `--surface-*` / `--text-primary` system in index.css; Tailwind tokens bridge to surface vars |
| R06 | Skeleton loading — ReviewSession | ✅ Matching-shape animate-pulse skeletons |
| R06 | Skeleton loading — Flashcards | ✅ Matching-shape animate-pulse skeletons |
| R06 | Skeleton loading — AnswerHistory | ✅ `SkeletonList` component |

---

## 3 Remaining Items

```
[FINAL-01] Skeleton loading — Bookmarks and Profile (R06 partial)
           Files: client/src/pages/Bookmarks.tsx
                  client/src/pages/Profile.tsx
           
           Bookmarks: No loading state at all. The page reads from localStorage
           synchronously so it "loads" instantly — but adding a brief skeleton
           (useEffect deferred render) removes the flash of empty content on
           first mount when localStorage access is slow on low-end devices.
           
           Profile: The stats/achievements data comes from hooks (useGlobalStats,
           useAchievements) that read from localStorage + JSON files. Same issue.
           Add a 1-frame deferred render skeleton for the 2×2 bento grid and
           chart boxes on the Stats tab.
           
           Pattern (same as other pages):
             if (!mounted) return <ProfileSkeleton />;   ← useState(false) + useEffect
           
           LOW urgency — both pages feel instant already since data is local.

[FINAL-02] Mobile nav haptic feedback (R07 partial)
           File: client/src/components/layout/UnifiedNav.tsx
           
           navigator.vibrate is not called anywhere in the nav.
           One line per nav item onClick:
             onClick={() => { navigator.vibrate?.(10); setLocation(item.path); }}
           
           Tiny change. Improves tactile feel on Android. iOS ignores it silently.

[FINAL-03] Keyboard shortcuts manifest (R08)
           File: client/src/lib/keyboard-shortcuts.ts (NEW)
           
           Currently keyboard shortcuts are scattered and undiscoverable:
             - Flashcards: Space/1/2/3/4/←/→ (in Flashcards.tsx)
             - ReviewSession: Space/1/2/3/4/←/→ (in SRS sub-components)  
             - AppLayout: Cmd+K (hardcoded in useEffect)
           
           Create a typed central registry:
             export const SHORTCUTS = {
               commandPalette: { keys: ['⌘K', 'Ctrl+K'], scope: 'global' },
               flipCard:       { keys: ['Space'],         scope: 'srs' },
               rateAgain:      { keys: ['1'],             scope: 'srs' },
               rateHard:       { keys: ['2'],             scope: 'srs' },
               rateGood:       { keys: ['3'],             scope: 'srs' },
               rateEasy:       { keys: ['4'],             scope: 'srs' },
               prevCard:       { keys: ['←'],             scope: 'srs' },
               nextCard:       { keys: ['→'],             scope: 'srs' },
               bookmark:       { keys: ['B'],             scope: 'question' },
             } as const;
           
           Use in: tooltip badges on buttons (e.g. "Space" badge on Flip button),
           and a future "?" keyboard shortcuts modal.
           
           LOW urgency — purely a quality-of-life developer/power-user feature.
```

---

## Summary

**26 of 29 items complete** (90%).

The 3 remaining items are all polish-level:
- Bookmarks/Profile loading skeletons (low urgency — data is local/instant)
- Mobile nav haptic (1-line change per nav item)
- Keyboard shortcuts manifest (dev-time convenience, no user-facing impact yet)

The two major goals from the original plan are **fully achieved**:
1. ✅ All diagram rendering bugs fixed (6 root causes, all addressed)
2. ✅ All 5 pages unified (ReviewSession, Bookmarks, Flashcards, AnswerHistory, Profile)

*Verified: 2026-06-04*
