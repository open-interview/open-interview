# Blog Performance Baseline

## Lighthouse Score Targets
| Metric | Target | Notes |
|--------|--------|-------|
| Performance | ≥ 90 | Cover images lazy-loaded, code-split routes |
| Accessibility | ≥ 95 | WCAG AA contrast, semantic HTML, ARIA labels |
| Best Practices | ≥ 90 | HTTPS, no deprecated APIs |
| SEO | 100 | Meta tags, canonical URLs, sitemap |

## Core Web Vitals Targets
| Metric | Target | Implementation |
|--------|--------|---------------|
| LCP | < 2.5s | `fetchpriority="high"` on cover images, preload |
| CLS | < 0.1 | All images have explicit width/height or aspect-ratio |
| INP | < 200ms | Debounced search (300ms), no heavy sync JS |

## Optimization Checklist
- [x] Code splitting: all blog pages lazy-loaded via React.lazy
- [x] Image lazy loading: `loading="lazy"` on all non-hero images
- [x] Hero image priority: `fetchPriority="high"` on post cover
- [x] Aspect ratio reserved: `aspect-video` on all card images (prevents CLS)
- [x] Skeleton loaders: prevent layout shift during data fetch
- [x] Debounced search: 300ms debounce on search input
- [ ] Font preloading: add `<link rel="preload">` for Playfair Display + Inter
- [ ] WebP images: convert cover images to WebP format
- [ ] Image optimization: run sharp on build

## Baseline Scores (to be recorded after first deployment)
| Page | Performance | Accessibility | Best Practices | SEO |
|------|-------------|---------------|----------------|-----|
| /blog | TBD | TBD | TBD | TBD |
| /blog/:slug | TBD | TBD | TBD | TBD |
