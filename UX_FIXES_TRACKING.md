# Open Interview — UX Fixes Tracking

> Live tracking doc. Update status as each fix is applied.
> Full fix details: `UX_FIXES_PLAN.md`
> Test coverage: `tests/e2e/`

---

## Status Key

| Symbol | Meaning |
|--------|---------|
| ⬜ | Not started |
| 🔄 | In progress |
| ✅ | Fixed + tests passing |
| ❌ | Blocked |
| ⚠️ | Fixed but needs re-test |

---

## P0 — Critical

| ID | Issue | File(s) | Status | Test | Notes |
|----|-------|---------|--------|------|-------|
| P0-01 | Onboarding modal blocks all direct URL navigation | `SubscriptionGate.tsx`, `OnboardingFlow.tsx` | ⬜ | `01-onboarding.spec.ts` | Every fresh session shows onboarding over ALL routes |
| P0-02 | Footer anchor links open in new tab | `home-facelift.tsx` lines 848–881 | ⬜ | `02-navigation.spec.ts` | `#features`, `#community` passed to `window.open()` |
| P0-03 | Anchor nav links break from non-home pages | `home-facelift.tsx` lines 220–229 | ⬜ | `02-navigation.spec.ts` | Hash links work only on `/` |

---

## P1 — High

| ID | Issue | File(s) | Status | Test | Notes |
|----|-------|---------|--------|------|-------|
| P1-01 | `/stats` silently redirects, no user feedback | `StatsRedirect.tsx` | ✅ | `02-navigation.spec.ts` | **Fixed:** Added toast notification + inline message |
| P1-02 | Home page hardcodes 3 specific blog article slugs | `home-facelift.tsx` lines 381–403 | ✅ | `07-blog.spec.ts` | Fixed: dynamic fetch via getFeaturedPosts with skeleton loading |
| P1-03 | ChallengeHome uses hardcoded Tailwind gray palette | `ChallengeHome.tsx` (20+ instances) | ✅ | `02-navigation.spec.ts` | **Already fixed:** Uses `bg-card`, `bg-muted`, `text-muted-foreground` |
| P1-04 | Blog pages use separate CSS variable system | `blog/*.tsx` | ⬜ | `07-blog.spec.ts` | `--color-ink-muted` etc. not shared with main app |
| P1-05 | AllChannels has no loading skeleton | `AllChannels.tsx` | ⬜ | `03-channels.spec.ts` | Empty screen while data loads |
| P1-06 | Profile + Bookmarks have no localStorage error handling | `Profile.tsx`, `Bookmarks.tsx` | ⬜ | `08-profile-bookmarks.spec.ts` | Parse errors silently crash pages |
| P1-07 | CertificationPractice navigates to wrong channel | `CertificationPractice.tsx` lines ~479, ~496 | ⬜ | `06-certifications.spec.ts` | Cert ID ≠ Channel ID → possible 404 |

---

## P2 — Medium

| ID | Issue | File(s) | Status | Test | Notes |
|----|-------|---------|--------|------|-------|
| P2-01 | Flashcards hides sidebar (inconsistent nav) | `Flashcards.tsx` line 144 | ✅ | `04-flashcards.spec.ts` | **Fixed:** Removed `hideNav` — sidebar/mobile nav now visible |
| P2-02 | Mobile bottom nav overlaps last content row | `AppLayout.tsx`, `UnifiedNav.tsx`, all full-height pages | ⬜ | `10-mobile.spec.ts` | Affects Channels, Certs, Code, ChallengeHome |
| P2-03 | `text-[10px]` unreadably small card stats | `AllChannels.tsx` line 175, `Certifications.tsx` lines 254–256 | ✅ | `09-accessibility.spec.ts` | **Fixed:** 13 instances → `text-xs` (12px) |
| P2-04 | 181+ low-contrast text instances | `index.css`, `ChallengeHome.tsx`, `home-facelift.tsx`, all pages | ✅ | `09-accessibility.spec.ts` | **Fixed:** `--muted-foreground` 55%→65% (4.2:1→4.9:1 contrast) |
| P2-05 | Valid pages missing from sidebar | `Sidebar.tsx` | ✅ | `02-navigation.spec.ts` | **Fixed:** Added Notifications, What's New, Blog, Docs, Bot Activity |
| P2-06 | Dead/orphaned page files | 10 unused `.tsx` files in `pages/` | ⬜ | N/A | Add bundle weight, cause confusion |

---

## P3 — Low

| ID | Issue | File(s) | Status | Test | Notes |
|----|-------|---------|--------|------|-------|
| P3-01 | 37/42 pages have zero `data-testid` attributes | All pages except About, AnswerHistory, EventsDashboard, QuestionViewer, TestSession | ⬜ | All specs | Blocks automated testing |
| P3-02 | Missing ARIA labels on custom interactive elements | `Sidebar.tsx`, `AllChannels.tsx`, `Flashcards.tsx`, `VoicePractice.tsx` | ⬜ | `09-accessibility.spec.ts` | Screen readers can't describe these controls |
| P3-03 | VoicePractice: no error when microphone denied | `VoicePractice.tsx` | ⬜ | `05-voice.spec.ts` | Silent failure, user doesn't know why mic won't start |
| P3-04 | CertificationPractice breadcrumbs cause full page reload | `CertificationPractice.tsx` lines 730–734 | ✅ | `06-certifications.spec.ts` | **Fixed:** Uses wouter `<Link>` with `asChild` for SPA nav |

---

## Test Suite Summary

| Spec File | Tests | Issues Covered |
|-----------|-------|----------------|
| `tests/e2e/helpers.ts` | — | Shared: `skipOnboarding()`, `navigateTo()`, `contrastRatio()` |
| `tests/e2e/01-onboarding.spec.ts` | 9 | P0-01 |
| `tests/e2e/02-navigation.spec.ts` | 14 | P0-02, P0-03, P1-01, P1-03, P2-05 |
| `tests/e2e/03-channels.spec.ts` | 8 | P1-05, P2-02, P2-03, P3-01 |
| `tests/e2e/04-flashcards.spec.ts` | 10 | P2-01, P3-01 |
| `tests/e2e/05-voice.spec.ts` | 8 | P3-03, P3-02, P3-01 |
| `tests/e2e/06-certifications.spec.ts` | 9 | P1-07, P2-02, P2-03, P3-04, P3-01 |
| `tests/e2e/07-blog.spec.ts` | 9 | P1-02, P1-04, P3-01 |
| `tests/e2e/08-profile-bookmarks.spec.ts` | 10 | P1-06, P3-01 |
| `tests/e2e/09-accessibility.spec.ts` | 11 | P2-03, P2-04, P3-02 |
| `tests/e2e/10-mobile.spec.ts` | 10 | P2-02 |
| **Total** | **98 tests** | **20 issues** |

---

## Key Design Findings (Audit Notes)

### Architecture & Data Flow
- **Profile + Bookmarks are entirely localStorage-only** — no server state, no TanStack Query. This makes them brittle but also fast to fix (just add error handling wrappers).
- **SubscriptionGate is a single if-statement** — the fix is minimal: add a route-check condition or URL-preservation logic.
- **Blog CSS variables** (`--color-ink-muted`, `--color-surface-raised`) appear to be defined somewhere — verify in `index.css` before migrating.

### Routing
- `MyPath` and `LearningPaths` both import `UnifiedLearningPaths` — they are identical routes, no difference.
- `StatsRedirect` is a 3-line component — easy to extend with a toast notification.
- `VoiceInterview.tsx` and `TrainingMode.tsx` are fully built but unrouted — may contain useful functionality worth examining before deleting.

### Contrast Numbers
| Token | Approximate hex | vs `#0a0e1a` | WCAG AA? |
|-------|----------------|--------------|----------|
| `muted-foreground` `hsl(220 15% 65%)` | `#90a0c0` | 4.9:1 | ✅ **FIXED |
| `text-gray-500` | `#6b7280` | 3.1:1 | ❌ FAIL |
| `text-gray-400` | `#9ca3af` | 5.2:1 | ✅ Pass |
| `text-white/60` | rgba(255,255,255,0.6) | 5.4:1 | ✅ Pass |
| `text-white/40` | rgba(255,255,255,0.4) | 2.3:1 | ❌ FAIL |

---

*Tracking doc created: May 2026*
*Update this file as fixes are applied. Mark ✅ when the corresponding spec passes.*
