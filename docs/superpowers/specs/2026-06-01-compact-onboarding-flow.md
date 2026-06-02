# Compact Single-Step Onboarding Flow

## Problem
The current `OnboardingFlow.tsx` is a 3-step wizard that requires scrolling on the right panel because role cards (9 items, 148px min-height each in a 3-col grid), topic chips (across all non-cert categories), and certs list exceed the viewport.

## Solution
Replace the 3-step wizard with a single-page layout where all three sections (role picker, topic chips, certs collapsible) fit within the viewport. Zero scrolling.

## Layout
Within the existing split-screen container (`fixed inset-0 z-[var(--z-modal)] flex lg:flex-row`):

### Left panel (desktop only, 420px)
Unchanged: brand logo, headline, feature list, step indicator (adapted to show 3 sections instead of steps), rotating testimonial.

### Right panel (flex-1, no overflow scroll)
Top bar (48px): mobile logo | "Personalize" title | Skip button

Content area (fills remaining space, `flex-1 flex flex-col`, no overflow):
1. **Role section** — section heading + 9 role pills in a wrapping flex row. Pills are compact (h-9, text-sm, emoji + label). Selected pill has accent border + glow.
2. **Divider** — thin separator line between sections
3. **Topics section** — section heading with count + topic chips in a wrapping flex row. Chips are compact (px-3 py-1, text-xs). Recommended topics are pre-selected when a role is picked.
4. **Divider** — thin separator line between sections
5. **Certs section** — collapsible accordion. Header "Preparing for a cert?" with expand/collapse chevron. Expanded shows certs grouped by provider as compact rows.
6. **CTA footer** (sticky at bottom) — "Start Learning" button + optional "Skip" link

## Interaction flow
1. User taps a **role pill** → topics auto-populate to recommended channels for that role
2. User taps **topic chips** to toggle on/off
3. User may expand the **certs section** and toggle certs
4. User taps **"Start Learning"** → `finish()` is called (same logic as current)
5. User taps **"Skip"** → `skipOnboarding()` + `onComplete()`

## Data flow
- `selectedRole: string | null` — state
- `selectedTopics: Set<string>` — state, auto-populated on role select
- `selectedCerts: Set<string>` — state
- `finish()`: calls `setRole(selectedRole)` then `toggleSubscription(id)` for topics that differ from recommended, and `toggleCertificationSubscription(id)` for selected certs
- No changes to `UserPreferencesContext`, `channels-config`, or `certifications-config`

## Mobile behavior
On mobile (<1024px), the left panel is hidden. The right panel fills the full viewport. Sections stack with slightly tighter padding. No scroll needed.

## Animation
- All three sections fade in on mount (staggered, 0.05s delay between sections)
- Role pills and topic chips retain their existing `whileHover`/`whileTap` animations
- Certs section uses `AnimatePresence` for expand/collapse

## Files modified
- `client/src/components/OnboardingFlow.tsx` — rewritten

## Files NOT modified
- `client/src/context/UserPreferencesContext.tsx` — unchanged
- `client/src/lib/channels-config.ts` — unchanged
- `client/src/lib/certifications-config.ts` — unchanged
- `client/src/pages/home-facelift.tsx` — unchanged (same import, same interface)

## Testing
- Existing e2e tests (01-onboarding.spec.ts) should still pass:
  - `setRole` still completes onboarding
  - `skipOnboarding` still works
  - Component still renders as a fixed fullscreen modal
- No new test suite needed; smoke-test that component renders without scroll
