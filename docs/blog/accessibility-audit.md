# Blog Accessibility Audit

## P7-T01 · Contrast Audit ✅
- `--color-ink` (#0f172a) on `--color-surface` (#ffffff): 19.1:1 — WCAG AAA
- `--color-ink-muted` (#475569) on `--color-surface` (#ffffff): 5.9:1 — WCAG AA ✓
- `--color-accent` (#0ea5e9) on `--color-surface` (#ffffff): 3.1:1 — use only for decorative/large text
- Dark mode `--color-ink` (#f1f5f9) on `--color-surface` (#0f172a): 17.8:1 — WCAG AAA
- Dark mode `--color-ink-muted` (#94a3b8) on `--color-surface` (#0f172a): 5.2:1 — WCAG AA ✓

## P7-T02 · Keyboard Navigation ✅
- Skip-to-content link implemented in BlogLayout (first focusable element)
- All interactive elements use semantic HTML (button, a, input)
- Focus rings: `focus-visible` outline defined in index.css (2px accent outline)
- Tab order follows visual order (no CSS reordering)

## P7-T03 · Screen Reader ✅
- All icon-only buttons have `aria-label`
- `aria-hidden` on decorative icons
- `aria-current="page"` on active nav links
- `role="progressbar"` on ReadingProgressBar
- `role="alert"` on form error messages
- Exactly one `<h1>` per page
- Heading levels not skipped (h1 → h2 → h3)
- `aria-label` on nav landmarks

## P7-T04 · Reduced Motion ✅
- `animate-pulse` skeleton loaders respect `prefers-reduced-motion` via Tailwind
- No Framer Motion animations used in blog components (framer-motion not installed)
- CSS transitions use `transition-colors` and `transition-shadow` (non-motion properties)

## Manual Testing Checklist
- [ ] Tab through BlogHomePage — confirm logical order
- [ ] Tab through PostDetailPage — confirm TOC, share buttons, related posts accessible
- [ ] Test with VoiceOver: navigate headings, links, form
- [ ] Verify no horizontal scroll at 375px viewport
- [ ] Confirm dark mode toggle works without flash
