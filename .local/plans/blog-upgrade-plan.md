# Blog System Upgrade Plan

**Project**: Blog System Upgrade — 147 MDX Posts, Dual Architecture (SPA + Static)
**Date**: 2026-05-02
**Team**: 20 parallel agents across 3 phases
**Total Issues**: 12 fixes (6 High, 6 Medium) + 3 Perf/SEO items

---

## Phase Overview

| Phase | Name | Agents | Duration | Dependencies |
|-------|------|--------|----------|-------------|
| 1 | Foundation & Dead Code | 7 agents | Parallel | None |
| 2 | Component Unification & Accessibility | 7 agents | Parallel | Phase 1 complete |
| 3 | Performance, SEO & Polish | 6 agents | Parallel | Phase 2 complete |

**Critical Path**: Phase 1 (H2 dead code removal) → Phase 2 (H1 card unification) → Phase 3 (Perf/SEO)

---

## Phase 1: Foundation & Dead Code Removal (7 agents)

### Agent 1 — Remove Dead PostDetailPage (H2)
**File**: `client/src/pages/blog/PostDetailPage.tsx`
**Action**: Delete the file. It has been fully replaced by `post-facelift.tsx`.
**Verify**: No imports of `PostDetailPage` exist anywhere in the codebase.
**Acceptance**: File deleted; `App.tsx` does not reference it (confirmed: `App.tsx:125` uses `PostFaceliftPage`); build passes.

### Agent 2 — Fix Branding: Header "OpenInterview" → "DevInsights" (H3)
**File**: `client/src/components/blog/BlogHeader.tsx:25`
**Change**: Replace `<span className="text-[var(--color-accent)]">Open</span>Interview` with `<span className="text-[var(--color-accent)]">Dev</span>Insights`
**Also fix**: Footer at `client/src/components/facelift-footer.tsx:123` — change `<h3 className="font-bold text-lg leading-tight">OpenInterview</h3>` to `<h3 className="font-bold text-lg leading-tight">DevInsights</h3>`
**Acceptance**: Header and footer both display "DevInsights / Blog" consistently.

### Agent 3 — Add onError Handlers to All img Tags (H4) — Part A: Card Components
**Files**:
- `client/src/components/blog/PostCard.tsx` — lines 42-50, 87-95, 110-118 (3 img tags)
- `client/src/components/facelift/article-card.tsx` — lines 130-138 (1 img tag)

**Change**: Add `onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-blog.png'; }}` to every `<img>` tag. Create `/client/public/placeholder-blog.png` fallback image (SVG placeholder with category name).

**Acceptance**: All img tags in card components have onError handlers; broken images show graceful fallback.

### Agent 4 — Add onError Handlers to All img Tags (H4) — Part B: Page Components
**Files**:
- `client/src/pages/blog/post-facelift.tsx` — lines 238-246 (cover image)
- `client/src/components/blog/AuthorCard.tsx` — lines 32, 68 (avatar images)

**Change**: Add onError handlers. For cover images, hide the container and show gradient fallback. For avatars, show initials fallback.

**Acceptance**: All img tags in page components have onError handlers.

### Agent 5 — Audit All Remaining img Tags Site-Wide (H4)
**Action**: Search entire `client/src/` for `<img` tags without `onError`. Add handlers where missing.
**Key files to check**: `RecentBlogPosts.tsx`, `BlogKnowledgeCheck.tsx`, `MarkdownRenderer.tsx`, `facelift/featured-card.tsx`
**Acceptance**: Zero `<img>` tags without `onError` in the entire client source tree.

### Agent 6 — Font Preloading Setup (PERF)
**File**: `client/index.html`
**Change**: Add `<link rel="preload">` tags for critical fonts in `<head>`:
```html
<link rel="preload" href="/fonts/PlusJakartaSans.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/Inter.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/JetBrainsMono.woff2" as="font" type="font/woff2" crossorigin>
```
**Also**: Add `font-display: swap` to font-face declarations in CSS. Currently fonts load via Google Fonts URL in `index.css:1` — consider self-hosting critical fonts or adding `&display=swap` to the Google Fonts URL.
**Acceptance**: LCP font is preloaded; no FOIT (Flash of Invisible Text); `font-display: swap` applied.

### Agent 7 — Baseline Lighthouse Measurement (PERF)
**Action**: Run Lighthouse audit on 3 key pages:
1. `/blog` (homepage)
2. `/blog/category/engineering` (list page)
3. `/blog/{any-slug}` (detail page)

**Metrics to record**: LCP, FCP, CLS, TBT, Performance score, Accessibility score, Best Practices score, SEO score
**Output**: Save reports to `lighthouse-reports/blog-baseline/`
**Acceptance**: Baseline scores documented for all 3 pages with all 4 Core Web Vitals.

---

## Phase 2: Component Unification & Accessibility (7 agents)

### Agent 8 — Create Unified Card System (H1) — Design
**Goal**: Merge `PostCard` (blog/PostCard.tsx) and `ArticleCard` (facelift/article-card.tsx) into single `UnifiedCard` component.

**UnifiedCard API design**:
```tsx
interface UnifiedCardProps {
  post: {
    slug: string;
    title: string;
    excerpt: string;
    coverImage?: string;
    author: string;
    category: string;
    tags: string[];
    publishedAt: string;
    readingTimeMinutes: number;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    featured?: boolean;
  };
  variant: 'featured' | 'grid' | 'list' | 'compact';
  withAnimation?: boolean;  // framer-motion wrapper
  withDifficulty?: boolean; // show difficulty badge
  className?: string;
}
```

**File**: Create `client/src/components/blog/UnifiedCard.tsx`
**Strategy**: Take visual design from `ArticleCard` (gradients, difficulty badges, premium feel) but keep `PostCard`'s clean `Link`-based navigation and CSS variable token usage. Support both shadcn tokens (`bg-card`, `text-foreground`) and blog CSS vars (`--color-surface`, `--color-ink`).
**Acceptance**: Single component supports all 4 variants; matches current visual quality of both existing cards.

### Agent 9 — Migrate BlogListPage to UnifiedCard (H1)
**File**: `client/src/pages/blog/BlogListPage.tsx`
**Change**: Replace `ArticleCard` import with `UnifiedCard`. Update usage at line 232: `<ArticleCard article={post} href={...} />` → `<UnifiedCard post={post} variant="grid" withAnimation withDifficulty />`
**Acceptance**: Blog list page renders identically; no visual regression.

### Agent 10 — Migrate BlogHomePage to UnifiedCard (H1)
**File**: `client/src/pages/blog/BlogHomePage.tsx`
**Change**: Replace `ArticleCard` (line 4, 301, 332) and `FeaturedCard` imports with `UnifiedCard`. Use `variant="featured"` for featured section, `variant="grid"` for recent articles.
**Acceptance**: Blog homepage renders identically; featured card and article grid work correctly.

### Agent 11 — Migrate PostDetailPage Related Posts to UnifiedCard (H1)
**File**: `client/src/pages/blog/post-facelift.tsx`
**Change**: Replace `PostCard` import (line 6) with `UnifiedCard`. Update related posts section at line 468: `<PostCard key={p.slug} post={p} variant="grid" />` → `<UnifiedCard post={p} variant="grid" />`
**Acceptance**: Related articles section renders correctly.

### Agent 12 — Fix Nested a Tags in CategoryBadge (M2)
**File**: `client/src/components/blog/PostCard.tsx:158-170`
**Problem**: `CategoryBadge` renders a `<Link>` inside a parent `<Link>` (the card wrapper). This creates invalid nested `<a>` tags in the DOM.
**Fix**: Change `CategoryBadge` to render a `<button>` or `<span>` with `onClick` that uses `useLocation` navigation instead of a `<Link>`. Or use `e.stopPropagation()` more robustly and change the inner element to a non-interactive `<span>` styled as a badge with `role="link"` and keyboard handler.

**Preferred fix**:
```tsx
export function CategoryBadge({ category, interactive = true }: { category: string; interactive?: boolean }) {
  const slug = category.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const [, navigate] = useLocation();
  
  if (!interactive) {
    return <span className="rounded-full bg-[var(--color-accent)]/10 px-2.5 py-0.5 text-xs font-medium text-[var(--color-accent)]">{category}</span>;
  }
  
  return (
    <button
      onClick={(e) => { e.stopPropagation(); navigate(`/blog/category/${slug}`); }}
      className="rounded-full bg-[var(--color-accent)]/10 px-2.5 py-0.5 text-xs font-medium text-[var(--color-accent)] hover:bg-[var(--color-accent)]/20 transition-colors cursor-pointer"
    >
      {category}
    </button>
  );
}
```

**Also fix**: Same issue in `post-facelift.tsx:260` where `CategoryBadge` is used inside breadcrumb `<ol>` which is inside a non-link context (this is fine, but add `interactive={false}` for the breadcrumb usage).

**Acceptance**: No nested `<a>` tags in DOM; category badges navigate correctly on click; keyboard accessible.

### Agent 13 — Add aria-hidden to Emoji Icons in TopicCard (M3)
**File**: `client/src/components/facelift/topic-card.tsx:125`
**Problem**: Emoji icons like `🏗️`, `⚡`, `🎨` are rendered inside `<span aria-hidden="true">` but the emoji itself is screen-reader visible content. The `aria-hidden` is on the parent span but the emoji text node is still announced.
**Fix**: Wrap each emoji in its own `<span aria-hidden="true" role="img">` and ensure the `sr-only` text provides the accessible name. Line 125 already has `<span className="sr-only">{topic.name}</span>` which is good, but the emoji span needs `aria-hidden="true"` directly on it.

**Change at line 125**:
```tsx
{topic.icon || <span aria-hidden="true" role="img">{defaultIcons[topic.slug] || '📁'}</span>}
```

**Acceptance**: Screen readers announce topic name (from sr-only span), not emoji characters.

### Agent 14 — Replace Inline Author Bios with AuthorCard Component (M4)
**File**: `client/src/pages/blog/post-facelift.tsx:408-428`
**Problem**: The author bio section uses inline markup with hardcoded "Software engineer and technical writer..." bio text and constructed social URLs.
**Fix**: Replace with existing `AuthorCard` component from `client/src/components/blog/AuthorCard.tsx`.

**Current code** (lines 408-428):
```tsx
<div className="mt-10 rounded-2xl ...">
  <div className="flex items-start gap-4 ...">
    <div className="w-14 h-14 ...">{post.author[0]}</div>
    <div>
      <p className="font-semibold ...">{post.author}</p>
      <p className="mt-1.5 text-sm ...">Software engineer and technical writer...</p>
      <div className="mt-3 flex gap-3">
        <a href={`https://twitter.com/${post.author.toLowerCase()...}`}>...</a>
        <a href={`https://linkedin.com/in/${post.author.toLowerCase()...}`}>...</a>
      </div>
    </div>
  </div>
</div>
```

**Replace with**:
```tsx
import { AuthorCard } from "@/components/blog/AuthorCard";
// ...
<AuthorCard
  author={{
    name: post.author,
    bio: "Software engineer and technical writer sharing insights on engineering, cloud, and career growth.",
  }}
  variant="full"
  className="mt-10"
/>
```

**Future improvement**: Add author metadata to MDX frontmatter (twitterHandle, githubHandle, avatarUrl) and pass through API response.

**Acceptance**: Author bio renders via `AuthorCard` component; visually identical; reusable for future author pages.

### Agent 15 — Position Floating Share Sidebar Relative to Article (M5)
**File**: `client/src/pages/blog/post-facelift.tsx:476-524`
**Problem**: Share sidebar uses `fixed left-4 top-1/2 -translate-y-1/2` which positions it relative to viewport, not article. On wide screens this can overlap with content or be unreachable.
**Fix**: Change to `sticky` positioning within the article grid layout.

**Current layout** (line 34): `<div className={sidebar ? "grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-12" : ""}>`
**Change**: Modify `ArticleLayout` in `BlogLayout.tsx:34` to include a left sidebar slot for the share buttons:
```tsx
<div className="grid grid-cols-1 lg:grid-cols-[80px_1fr_280px] gap-8">
  {/* Left sidebar - share buttons */}
  <aside className="hidden lg:block">
    <div className="sticky top-24">{shareSidebar}</div>
  </aside>
  <article className="min-w-0">{children}</article>
  {/* Right sidebar - TOC */}
  <aside className="hidden lg:block">
    <div className="sticky top-24">{sidebar}</div>
  </aside>
</div>
```

**Remove**: The `fixed` share sidebar at lines 476-524 in `post-facelift.tsx`. Pass share sidebar as a prop or render it inline.

**Acceptance**: Share sidebar scrolls with article content; no overlap; works at all viewport widths.

---

## Phase 3: Token Unification, WebP, Testing (6 agents)

### Agent 16 — Unify Token Systems: Audit & Map (M6)
**Files to audit**:
- `client/src/index.css` — CSS custom properties (shadcn tokens: `--background`, `--foreground`, `--card`, etc.)
- `client/src/styles/design-system.css` — Custom design tokens (`--surface-1`, `--text-primary`, `--color-accent-violet`, etc.)
- `client/src/styles/facelift.css` — Facelift tokens (`--surface-base`, `--text-primary`, `--brand-violet-500`, etc.)
- Blog components — Use `var(--color-ink)`, `var(--color-surface)`, `var(--color-border)`, `var(--color-accent)`

**Action**: Create a token mapping document at `client/src/styles/TOKEN_MAP.md` that documents:
1. All token definitions and their source file
2. Duplicate/overlapping tokens
3. Recommended canonical token for each semantic purpose

**Deliverable**: `TOKEN_MAP.md` with before/after mapping table.

### Agent 17 — Unify Token Systems: CSS Refactor (M6)
**Action**: Based on the token map, consolidate overlapping tokens. Primary strategy:
1. Keep shadcn tokens (`--background`, `--foreground`, `--card`, etc.) as the source of truth for Tailwind
2. Keep blog-specific tokens (`--color-ink`, `--color-surface`, etc.) mapped to shadcn tokens
3. Remove duplicate definitions in `design-system.css` that overlap with `facelift.css`
4. Add `@layer` directives to ensure proper cascade order

**Key consolidations**:
- `--color-surface` ↔ `--background` / `--surface-base` — pick one canonical
- `--color-ink` ↔ `--text-primary` / `--foreground` — pick one canonical
- `--color-border` has 3 different values across 3 files — unify

**Acceptance**: No duplicate token definitions; blog components render identically; Tailwind classes resolve correctly.

### Agent 18 — Make List Page Sidebar Accessible on Tablet (M1)
**File**: `client/src/pages/blog/BlogListPage.tsx:298`
**Problem**: Sidebar has `className="hidden lg:block"` — completely hidden on tablet (768px-1024px).
**Fix**: Add a mobile/tablet drawer for sidebar content using the existing `Sheet` component (already imported at line 10).

**Implementation**:
- Add a "Filters" button visible on md screens that opens a Sheet with categories/tags
- Keep inline sidebar on lg+
- Change `hidden lg:block` to `hidden md:block` for partial tablet support, or use Sheet for md and below

```tsx
{/* Tablet/Mobile filter drawer */}
<div className="lg:hidden mb-6">
  <Sheet>
    <SheetTrigger asChild>
      <Button variant="outline" className="w-full">
        <Filter size={14} /> Filters & Categories
      </Button>
    </SheetTrigger>
    <SheetContent side="right">
      {/* Replicate sidebar content here */}
    </SheetContent>
  </Sheet>
</div>
```

**Acceptance**: Categories, tags, and filters accessible on tablet via drawer; sidebar visible on desktop.

### Agent 19 — WebP Image Conversion Setup (PERF)
**Action**: Set up WebP conversion pipeline for blog cover images.

**Steps**:
1. Create script `scripts/convert-images-to-webp.ts` that:
   - Scans `content/posts/` MDX frontmatter for `coverImage` URLs
   - Downloads/converts images to WebP format
   - Saves to `client/public/blog-images/`
   - Updates MDX frontmatter with new WebP paths

2. Add `sharp` dependency for image conversion: `pnpm add -D sharp`

3. Alternative: Use `<picture>` element with WebP source fallback in image components:
```tsx
<picture>
  <source srcSet={webpUrl} type="image/webp" />
  <img src={jpgUrl} alt={alt} />
</picture>
```

4. Add `vite-plugin-imagemin` or configure Vite to optimize images in build.

**Acceptance**: Blog images served as WebP where supported; fallback to original format; measurable reduction in image payload.

### Agent 20 — E2E Regression Tests for Blog
**File**: `tests/e2e/07-blog.spec.ts` (existing — enhance it)

**Add tests for all changes**:
1. Card rendering in all variants (grid, list, featured)
2. Category badge navigation (no nested links error)
3. AuthorCard rendering on post detail
4. Share sidebar positioning
5. Image fallback on broken URLs
6. Sidebar accessibility on tablet viewport
7. Branding consistency (DevInsights in header + footer)
8. Token consistency (no visual regression after CSS refactor)

**Acceptance**: All 20 agents' changes covered by automated tests; CI passes.

---

## Dependency Graph

```
Phase 1 (Foundation)
├── Agent 1: Delete PostDetailPage ──────────────→ [no deps]
├── Agent 2: Fix Branding ───────────────────────→ [no deps]
├── Agent 3: img onError (cards) ────────────────→ [no deps]
├── Agent 4: img onError (pages) ────────────────→ [no deps]
├── Agent 5: img onError (site-wide) ────────────→ [no deps]
├── Agent 6: Font preloading ────────────────────→ [no deps]
└── Agent 7: Lighthouse baseline ────────────────→ [no deps]

Phase 2 (Components & A11y)
├── Agent 8: Create UnifiedCard ─────────────────→ [Agent 1 (dead code removed)]
├── Agent 9: Migrate BlogListPage ───────────────→ [Agent 8 (UnifiedCard exists)]
├── Agent 10: Migrate BlogHomePage ──────────────→ [Agent 8 (UnifiedCard exists)]
├── Agent 11: Migrate post-facelift ─────────────→ [Agent 8 (UnifiedCard exists)]
├── Agent 12: Fix nested a tags ─────────────────→ [Agent 8 (update in UnifiedCard)]
├── Agent 13: aria-hidden emojis ────────────────→ [no deps]
├── Agent 14: AuthorCard replacement ────────────→ [Agent 11 (post-facelift migration)]
└── Agent 15: Share sidebar reposition ──────────→ [Agent 11 (post-facelift migration)]

Phase 3 (Perf, SEO, Polish)
├── Agent 16: Token audit & map ─────────────────→ [no deps]
├── Agent 17: Token CSS refactor ────────────────→ [Agent 16 (map exists)]
├── Agent 18: Tablet sidebar a11y ───────────────→ [Agent 9 (BlogListPage migrated)]
├── Agent 19: WebP conversion ───────────────────→ [no deps]
└── Agent 20: E2E regression tests ──────────────→ [ALL agents (everything complete)]
```

---

## Tracking Table

| ID | Issue | Priority | Phase | Agent | Status | Files Changed | Acceptance Criteria |
|----|-------|----------|-------|-------|--------|---------------|---------------------|
| H1 | Unify PostCard + ArticleCard | HIGH | 2 | 8,9,10,11 | ⬜ Pending | `blog/UnifiedCard.tsx` (new), `PostCard.tsx`, `article-card.tsx`, `BlogListPage.tsx`, `BlogHomePage.tsx`, `post-facelift.tsx` | Single card component, all 4 variants, zero visual regression |
| H2 | Remove dead PostDetailPage | HIGH | 1 | 1 | ⬜ Pending | `pages/blog/PostDetailPage.tsx` (delete) | File deleted, no imports remain, build passes |
| H3 | Fix branding inconsistency | HIGH | 1 | 2 | ⬜ Pending | `BlogHeader.tsx:25`, `facelift-footer.tsx:123` | Both header and footer show "DevInsights" |
| H4 | Add onError to all img tags | HIGH | 1 | 3,4,5 | ⬜ Pending | `PostCard.tsx`, `article-card.tsx`, `post-facelift.tsx`, `AuthorCard.tsx`, all other img sites | Zero `<img>` without onError; graceful fallbacks |
| M1 | Tablet sidebar accessibility | MED | 3 | 18 | ⬜ Pending | `BlogListPage.tsx:298` | Categories/tags accessible on tablet via Sheet |
| M2 | Fix nested a tags in CategoryBadge | MED | 2 | 12 | ⬜ Pending | `PostCard.tsx:158-170`, `post-facelift.tsx:260` | No nested `<a>` in DOM; badges navigate correctly |
| M3 | aria-hidden on emoji icons | MED | 2 | 13 | ⬜ Pending | `topic-card.tsx:125` | Screen readers announce topic name, not emoji |
| M4 | Replace inline author bios | MED | 2 | 14 | ⬜ Pending | `post-facelift.tsx:408-428` | AuthorCard used; visually identical; reusable |
| M5 | Position share sidebar relative | MED | 2 | 15 | ⬜ Pending | `post-facelift.tsx:476-524`, `BlogLayout.tsx:34` | Sticky positioning in grid; no viewport-fixed |
| M6 | Unify token systems | MED | 3 | 16,17 | ⬜ Pending | `index.css`, `design-system.css`, `facelift.css`, `TOKEN_MAP.md` (new) | No duplicates; canonical tokens; identical rendering |
| P1 | Font preloading | PERF | 1 | 6 | ⬜ Pending | `index.html`, `index.css:1` | Preload tags present; font-display: swap |
| P2 | WebP image conversion | PERF | 3 | 19 | ⬜ Pending | `scripts/convert-images-to-webp.ts` (new), image components | WebP served with fallback; reduced payload |
| P3 | Baseline Lighthouse scores | PERF | 1 | 7 | ⬜ Pending | `lighthouse-reports/blog-baseline/` | Scores documented for 3 pages |
| T1 | E2E regression tests | TEST | 3 | 20 | ⬜ Pending | `tests/e2e/07-blog.spec.ts` | All changes covered; CI green |

---

## Critical Path & Blockers

### Critical Path
```
Agent 1 (H2 dead code) → Agent 8 (H1 UnifiedCard) → Agents 9,10,11 (migrations) → Agent 20 (E2E tests)
```

**Total critical path**: Phase 1 → Phase 2 → Phase 3 = sequential across phases, parallel within.

### Blockers
1. **Agent 8 blocked by Agent 1**: Cannot safely refactor cards while dead `PostDetailPage.tsx` still exists (might have hidden dependencies).
2. **Agents 9,10,11 blocked by Agent 8**: Cannot migrate to UnifiedCard until it exists.
3. **Agent 14 blocked by Agent 11**: Author bio is in `post-facelift.tsx` which is being migrated by Agent 11.
4. **Agent 15 blocked by Agent 11**: Share sidebar is in `post-facelift.tsx` which is being migrated by Agent 11.
5. **Agent 12 partially blocked by Agent 8**: CategoryBadge fix should be incorporated into UnifiedCard rather than fixing the old component.
6. **Agent 20 blocked by ALL agents**: Tests can only be written after all changes are complete.

### Non-Blocked Parallel Work
- Phase 1: All 7 agents run in parallel (no dependencies)
- Phase 2: Agent 13 (aria-hidden) runs independently
- Phase 3: Agents 16 (token audit) and 19 (WebP) run independently

---

## Execution Order

```
Day 1: Phase 1 (all 7 agents parallel)
  → EOD gate: Dead code removed, branding fixed, img onError complete, fonts preloaded, baseline measured

Day 2: Phase 2 (agents 8,13 parallel → then 9,10,11,12 parallel → then 14,15 parallel)
  → EOD gate: UnifiedCard created, all pages migrated, a11y fixes applied, share sidebar repositioned

Day 3: Phase 3 (agents 16,19 parallel → then 17 → then 18 → then 20)
  → EOD gate: Tokens unified, WebP setup, tablet sidebar accessible, E2E tests passing
```

---

## Post-Upgrade Validation Checklist

- [ ] `pnpm build` succeeds with no errors
- [ ] `pnpm test` passes (unit + E2E)
- [ ] No console errors on `/blog`, `/blog/category/*`, `/blog/:slug`
- [ ] Lighthouse scores improved vs baseline (P3)
- [ ] No nested `<a>` tags in DOM (validate with DevTools)
- [ ] Screen reader test: TopicCard announces name not emoji
- [ ] Tablet viewport (768px): sidebar accessible via drawer
- [ ] Broken image test: replace image URL with invalid one → fallback shown
- [ ] Header AND footer say "DevInsights" (not "OpenInterview")
- [ ] Author bio renders as AuthorCard component
- [ ] Share sidebar scrolls with article (not fixed to viewport)
- [ ] CSS tokens: no duplicate definitions in dev tools
