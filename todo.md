# E2E Test Issues — QA Agent Swarm Run

**Last run:** 2026-05-13  
**Suite:** `tests/e2e` (chromium-desktop)  
**Results:** 129 passed · 14 failed · 5 skipped

---

## 🔴 Failures by Suite

### 01-onboarding (5 failures)

- [ ] **Onboarding step 1 not shown on `/`** — `getByText('What\'s your role?')` not found. Onboarding modal/wizard is not rendering on fresh session.
- [ ] **Skip button missing on onboarding step 1** — `getByRole('button', { name: /skip/i })` not found. Skip button absent or not rendered.
- [ ] **Clicking skip does not dismiss onboarding** — Timeout waiting for skip button click (10s). Likely blocked by missing skip button above.
- [ ] **`/channels` does not show onboarding gate on fresh session** — Neither onboarding nor channels content rendered (`showsOnboarding || showsChannels` = false). Page may be blank or erroring.
- [ ] **`/events` does not show onboarding gate on fresh session** — Same as above; `/events` route renders nothing recognisable.

**Root cause hypothesis:** Onboarding flow is broken — the role-selection modal is not mounting. This cascades into all 5 failures. Check `App.tsx` onboarding state logic and the component that renders the wizard.

---

### 02-navigation (3 failures)

- [ ] **`/events` sidebar link causes browser crash** — `locator.isVisible: Target crashed` when checking for the events log link. Navigating to `/events` crashes the renderer.
- [ ] **`/whats-new` route times out (20s)** — `page.goto` timeout. Route either doesn't exist or hangs on load.
- [ ] **Unknown route shows empty 404 page** — Body text length = 0 on a 404 route. The 404/not-found component renders nothing.

**Root cause hypothesis:** `/events` route crashes the page (likely an unhandled error in that component). `/whats-new` is missing from the router. 404 component is empty.

---

### 03-channels (2 failures)

- [ ] **`/channels` page load times out (20s)** — `page.goto` to `http://localhost:5000/channels` exceeds 20s timeout. Likely related to the `/events` crash or a data-loading hang.
- [ ] **Channel cards not visible** — `locator('[class*="rounded"][class*="border"][class*="cursor-pointer"]').first()` not found. Cards either don't render or use different class names.

**Root cause hypothesis:** `/channels` page may be hanging waiting for data that never loads, or the onboarding gate blocks rendering. Check data fetch and onboarding guard logic.

---

### 08-profile-bookmarks (1 failure)

- [ ] **Profile page shows no content** — `getByText(/profile|streak|question|progress/i)` not found. Profile page renders blank or the expected text is absent.

**Root cause hypothesis:** Profile page may require onboarding to be completed first, or the component is not rendering stats/name correctly.

---

### 09-accessibility (1 failure)

- [ ] **Tab key focus test expects `BODY` in focusable tag list** — Test asserts `BODY` should be in `[BUTTON, A, INPUT, SELECT, TEXTAREA]`. This looks like a **test logic bug** — `BODY` is not a focusable interactive element. The test assertion is inverted or incorrect.

**Root cause hypothesis:** Test bug in `09-accessibility.spec.ts` line ~149. The assertion `toContain("BODY")` against the list of focusable tag names is wrong — it should likely assert `BODY` is NOT the active element (i.e., focus moved away from body).

---

### 10-mobile (2 failures)

- [ ] **Mobile bottom nav bar not visible at 375px** — No interactive nav elements found at mobile viewport. Bottom nav bar is missing or not rendered at 375px width.
- [ ] **Mobile nav has fewer than 4 tab items** — Count of nav tab items = 0. Bottom nav component is absent at mobile breakpoint.

**Root cause hypothesis:** Bottom nav bar component is not rendering at 375px. Check responsive breakpoint logic and mobile nav component mounting condition.

---

## 📋 Priority Order

| Priority | Issue | File |
|----------|-------|------|
| P1 | Onboarding modal not mounting | `01-onboarding.spec.ts` |
| P1 | `/events` route crashes renderer | `02-navigation.spec.ts` |
| P1 | `/channels` page load timeout | `03-channels.spec.ts` |
| P1 | Mobile bottom nav missing at 375px | `10-mobile.spec.ts` |
| P2 | `/whats-new` route missing | `02-navigation.spec.ts` |
| P2 | 404 page renders empty | `02-navigation.spec.ts` |
| P2 | Profile page shows no content | `08-profile-bookmarks.spec.ts` |
| P3 | Test bug: accessibility tab focus assertion | `09-accessibility.spec.ts` |

---

## ✅ Passing Suites

- `04-flashcards` — all passing
- `05-voice` — all passing
- `06-certifications` — all passing
- `07-blog` — all passing
- `11-regression-guards` — all passing (5 skipped by design)
