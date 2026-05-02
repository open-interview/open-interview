# Open Interview — Project Improvement Plan

> **Created**: May 2026  
> **Based on**: README.md, UX_FIXES_PLAN.md, UX_FIXES_TRACKING.md, ARCHITECTURE_PLAN.md + codebase analysis  
> **Goal**: Increase user engagement and retention through targeted, high-impact improvements

---

## 1. Current State Analysis

### What's Working Well
- **Content depth**: 1000+ questions, 53+ certifications, 40+ topics — strong competitive moat
- **Feature breadth**: Voice practice, flashcards (SRS), coding challenges, learning paths, blog, gamification (XP/badges/streaks)
- **Static deployment**: GitHub Pages with a full data pipeline (`build:static`) — fast, free, scalable
- **CI/CD**: 6 GitHub Actions workflows covering deploy, content generation, social, maintenance
- **Test infrastructure**: 98 Playwright E2E tests across 10 spec files, Vitest unit tests, Lighthouse reports
- **SEO foundations**: Sitemap, RSS feed, robots.txt, OpenGraph, Pagefind full-text search, blog with 147 posts
- **Design system**: shadcn/ui + Tailwind CSS + custom CSS variables, framer-motion animations

### What's Broken / Incomplete
All 20 issues in `UX_FIXES_PLAN.md` are **⬜ Not started** as of May 2026:

| Priority | Count | Status |
|----------|-------|--------|
| P0 — Critical (blocks navigation) | 3 | ⬜ All unstarted |
| P1 — High (visible regressions) | 7 | ⬜ All unstarted |
| P2 — Medium (UX quality) | 6 | ⬜ All unstarted |
| P3 — Low (polish + testability) | 4 | ⬜ All unstarted |

### Key Structural Observations
- **Dead code**: 10 orphaned `.tsx` page files not wired to any route (bundle weight + confusion)
- **Design token fragmentation**: Blog pages use `--color-ink-muted` etc., app uses `--foreground`/`--muted-foreground` — two separate systems
- **localStorage brittleness**: Profile and Bookmarks have zero error handling on `JSON.parse`
- **Onboarding gate**: `SubscriptionGate` blocks ALL routes on fresh sessions — every deep link lands on onboarding overlay
- **Contrast failures**: `text-gray-500` (#6b7280 on #0a0e1a) = 3.1:1 contrast ratio — fails WCAG AA
- **Missing discoverability**: `/whats-new`, `/notifications`, `/blog`, `/docs` have no sidebar entries
- **Test coverage gap**: 37 of 42 pages have zero `data-testid` attributes

---

## 2. Improvement Roadmap

