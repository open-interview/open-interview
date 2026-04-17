# E2E Testing Guide
## Comprehensive End-to-End Testing Strategy

---

## 📋 Overview

This guide covers the complete E2E testing setup for the unified question view architecture, optimized for mobile-first development and comprehensive coverage.

---

## 🏗️ Test Structure

### Directory Organization
```
e2e/
├── helpers/
│   ├── test-helpers.ts          # Reusable test utilities
│   └── page-objects.ts          # Page Object Models
│
├── refactored/                   # Refactored component tests (timer removal)
│   ├── test-session-refactored.spec.ts
│   ├── voice-interview-refactored.spec.ts
│   ├── certification-exam-refactored.spec.ts
│   └── visual-regression.spec.ts
│
├── visual/                       # Visual verification tests
│   └── icon-clipping.spec.ts    # Icon clipping prevention (11 tests)
│
├── unified/                      # Unified component tests
│   ├── unified-question-view.spec.ts
│   ├── test-session.spec.ts
│   ├── voice-interview.spec.ts
│   ├── certification.spec.ts
│   └── review-session.spec.ts
│
├── integration/                  # Integration tests
│   ├── navigation.spec.ts
│   ├── search.spec.ts
│   └── bookmarks.spec.ts
│
├── accessibility/                # A11y tests
│   ├── keyboard-navigation.a11y.spec.ts
│   ├── screen-reader.a11y.spec.ts
│   └── color-contrast.a11y.spec.ts
│
├── performance/                  # Performance tests
│   ├── page-load.perf.spec.ts
│   ├── animations.perf.spec.ts
│   └── memory.perf.spec.ts
│
├── mobile/                       # Mobile-specific tests
│   ├── touch-targets.mobile.spec.ts
│   ├── safe-areas.mobile.spec.ts
│   └── gestures.mobile.spec.ts
│
├── global-setup.ts              # Global test setup
├── global-teardown.ts           # Global test teardown
└── fixtures.ts                  # Custom fixtures

Legacy tests (to be migrated):
├── core.spec.ts
├── channels.spec.ts
├── tests.spec.ts
└── ... (other legacy tests)
```

---

## 🎯 Test Categories

### 1. Unified Component Tests
**Location**: `e2e/unified/`

Tests for the new unified question view components:
- Core functionality (navigation, reveal/hide, bookmarks)
- Mobile optimizations (touch targets, safe areas, no scroll)
- Performance (load time, animations, memory)
- Accessibility (keyboard, ARIA, contrast)
- Mode-specific behavior (browse, test, interview, etc.)

### 2. Integration Tests
**Location**: `e2e/integration/`

Tests for feature interactions:
- Navigation between pages
- Search functionality
- Bookmark synchronization
- Progress tracking
- Credit system

### 3. Accessibility Tests
**Location**: `e2e/accessibility/`

WCAG 2.1 AA compliance tests:
- Keyboard navigation
- Screen reader compatibility
- Color contrast (4.5:1 minimum)
- Touch target sizes (44x44px)
- ARIA labels and roles

### 4. Performance Tests
**Location**: `e2e/performance/`

Performance benchmarks:
- Page load time (< 3s)
- First Contentful Paint (< 1.5s)
- Time to Interactive (< 3s)
- Animation FPS (> 50fps)
- Memory usage (< 100MB)

### 5. Mobile Tests
**Location**: `e2e/mobile/`

Mobile-specific tests:
- Touch target sizes
- Safe area support (notch, home indicator)
- Swipe gestures
- No horizontal scroll
- Responsive typography

---

## 🚀 Running Tests

### All Tests
```bash
pnpm test
```

### Specific Project
```bash
# iPhone 13 (primary mobile target)
pnpm test --project=mobile-iphone13

# Desktop Chrome
pnpm test --project=chromium-desktop

# Accessibility
pnpm test --project=accessibility

# Performance
pnpm test --project=performance
```

### Specific Test File
```bash
pnpm test e2e/unified/unified-question-view.spec.ts
```

### With UI Mode
```bash
pnpm test:ui
```

### Headed Mode (see browser)
```bash
pnpm test:headed
```

### Debug Mode
```bash
pnpm test --debug
```

### Watch Mode
```bash
pnpm test --watch
```

---

## 📱 Device Testing

### Primary Targets
1. **iPhone 13** (390x844px) - Primary mobile target
2. **Desktop Chrome** (1280x720px) - Primary desktop
3. **iPad Pro** (1024x1366px) - Tablet

### Cross-Browser
- Chrome (Chromium)
- Firefox
- Safari (WebKit)

### Configuration
```typescript
// playwright.config.ts
projects: [
  {
    name: 'mobile-iphone13',
    use: {
      ...devices['iPhone 13'],
      viewport: { width: 390, height: 844 },
      hasTouch: true,
    },
  },
  // ... other projects
]
```

---

## 🛠️ Helper Functions

### Navigation Helpers
```typescript
import { navigateToHome, navigateToChannel } from './helpers/test-helpers';

await navigateToHome(page);
await navigateToChannel(page, 'react');
```

### Interaction Helpers
```typescript
import { clickRevealAnswer, clickNextQuestion } from './helpers/test-helpers';

await clickRevealAnswer(page);
await clickNextQuestion(page);
```

### Assertion Helpers
```typescript
import { 
  assertQuestionVisible,
  assertNoHorizontalScroll,
  assertTouchTargetSize 
} from './helpers/test-helpers';

await assertQuestionVisible(page);
await assertNoHorizontalScroll(page);
await assertTouchTargetSize(button, 44);
```

### Mobile Helpers
```typescript
import { swipeLeft, swipeRight } from './helpers/test-helpers';

await swipeLeft(page);  // Next question
await swipeRight(page); // Previous question
```

---

## 📄 Page Objects

### Using Page Objects
```typescript
import { UnifiedQuestionViewPage } from './helpers/page-objects';

const questionView = new UnifiedQuestionViewPage(page);
await questionView.goto('/channel/react');
await questionView.revealAnswer();
await questionView.clickNext();
```

### Available Page Objects
- `UnifiedQuestionViewPage` - Base question view
- `TestSessionPage` - Test/quiz mode
- `VoiceInterviewPage` - Voice interview mode
- `CertificationPage` - Certification exam mode
- `ReviewSessionPage` - SRS review mode
- `HomePage` - Home page
- `ChannelsPage` - Channels listing
- `MobileNavigation` - Mobile bottom nav

---

## ✅ Test Checklist

### For Each New Feature
- [ ] Write unit tests (if applicable)
- [ ] Write E2E tests for happy path
- [ ] Write E2E tests for edge cases
- [ ] Test on iPhone 13 (mobile)
- [ ] Test on desktop
- [ ] Test keyboard navigation
- [ ] Test screen reader compatibility
- [ ] Check color contrast
- [ ] Verify touch target sizes
- [ ] Test performance (load time, FPS)
- [ ] Test error handling
- [ ] Update documentation

### For Unified Components
- [ ] Test all modes (browse, test, interview, etc.)
- [ ] Test navigation (next, previous)
- [ ] Test answer reveal/hide
- [ ] Test bookmarks
- [ ] Test progress tracking
- [ ] Test timer (if applicable)
- [ ] Test mobile optimizations
- [ ] Test accessibility
- [ ] Test performance
- [ ] Test error states

---

## 🎯 Best Practices

### 1. Use Page Objects
```typescript
// ❌ Bad
await page.click('button:has-text("Next")');

// ✅ Good
await questionView.clickNext();
```

### 2. Use Helper Functions
```typescript
// ❌ Bad
await page.waitForSelector('text=/What|How/');

// ✅ Good
await assertQuestionVisible(page);
```

### 3. Wait for Animations
```typescript
// ❌ Bad
await button.click();
await nextButton.click(); // Might fail

// ✅ Good
await button.click();
await waitForAnimation(page, 300);
await nextButton.click();
```

### 4. Test Mobile First
```typescript
test.describe('Feature', () => {
  test.use({ viewport: { width: 390, height: 844 } });
  
  test('should work on mobile', async ({ page }) => {
    // Test mobile-specific behavior
  });
});
```

### 5. Use Descriptive Test Names
```typescript
// ❌ Bad
test('test 1', async ({ page }) => { ... });

// ✅ Good
test('should reveal answer when reveal button is clicked', async ({ page }) => {
  // ...
});
```

### 6. Test One Thing at a Time
```typescript
// ❌ Bad
test('should do everything', async ({ page }) => {
  await questionView.revealAnswer();
  await questionView.clickNext();
  await questionView.toggleBookmark();
  // Too many things
});

// ✅ Good
test('should reveal answer', async ({ page }) => {
  await questionView.revealAnswer();
  await assertAnswerVisible(page);
});

test('should navigate to next question', async ({ page }) => {
  await questionView.clickNext();
  const current = await questionView.getCurrentQuestionNumber();
  expect(current).toBe(2);
});
```

### 7. Clean Up After Tests
```typescript
test.afterEach(async ({ page }) => {
  await clearLocalStorage(page);
  await clearSessionStorage(page);
});
```

---

## 🐛 Debugging Tests

### View Test in Browser
```bash
pnpm test:headed
```

### Use UI Mode
```bash
pnpm test:ui
```

### Debug Specific Test
```bash
pnpm test --debug e2e/unified/unified-question-view.spec.ts
```

### Take Screenshots
```typescript
await page.screenshot({ path: 'debug.png', fullPage: true });
```

### Console Logs
```typescript
page.on('console', msg => console.log('PAGE LOG:', msg.text()));
```

### Pause Execution
```typescript
await page.pause(); // Opens Playwright Inspector
```

---

## 📊 Test Reports

### HTML Report
```bash
pnpm test
# Opens automatically on failure
# Or manually: npx playwright show-report
```

### JSON Report
```bash
# Generated in test-results/results.json
```

### JUnit Report
```bash
# Generated in test-results/junit.xml
# For CI/CD integration
```

---

## 🔄 CI/CD Integration

### GitHub Actions Example
```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Install dependencies
        run: ppnpm install
      
      - name: Install Playwright
        run: pnpm exec playwright install --with-deps
      
      - name: Run E2E tests
        run: pnpm test
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 📈 Performance Benchmarks

### Target Metrics
- **Page Load**: < 3 seconds
- **FCP**: < 1.5 seconds
- **TTI**: < 3 seconds
- **FPS**: > 50 fps
- **Memory**: < 100 MB
- **Bundle Size**: < 500 KB

### Measuring Performance
```typescript
import { measurePageLoadTime, measureFPS } from './helpers/test-helpers';

const loadTime = await measurePageLoadTime(page);
expect(loadTime).toBeLessThan(3000);

const fps = await measureFPS(page, 1000);
expect(fps).toBeGreaterThan(50);
```

---

## ♿ Accessibility Testing

### WCAG 2.1 AA Requirements
- **Color Contrast**: 4.5:1 for normal text, 3:1 for large text
- **Touch Targets**: 44x44px minimum
- **Keyboard Navigation**: All interactive elements accessible
- **Screen Readers**: Proper ARIA labels and roles
- **Focus Indicators**: Visible focus states

### Testing Accessibility
```typescript
import { 
  assertKeyboardNavigation,
  assertAriaLabels,
  assertColorContrast 
} from './helpers/test-helpers';

await assertKeyboardNavigation(page);
await assertAriaLabels(page);
await assertColorContrast(page, 'h1');
```

---

## 🎓 Learning Resources

### Playwright Documentation
- [Official Docs](https://playwright.dev/)
- [API Reference](https://playwright.dev/docs/api/class-playwright)
- [Best Practices](https://playwright.dev/docs/best-practices)

### Testing Patterns
- [Page Object Model](https://playwright.dev/docs/pom)
- [Test Fixtures](https://playwright.dev/docs/test-fixtures)
- [Parallelization](https://playwright.dev/docs/test-parallel)

---

## 📝 Contributing

### Adding New Tests
1. Create test file in appropriate directory
2. Use page objects and helpers
3. Follow naming conventions
4. Add descriptive test names
5. Test on mobile and desktop
6. Check accessibility
7. Update documentation

### Test Naming Convention
```
[feature].[type].spec.ts

Examples:
- unified-question-view.spec.ts
- keyboard-navigation.a11y.spec.ts
- page-load.perf.spec.ts
- touch-targets.mobile.spec.ts
```

---

## 🎉 Summary

This E2E testing setup provides:
- ✅ Comprehensive test coverage
- ✅ Mobile-first approach (iPhone 13)
- ✅ Performance monitoring
- ✅ Accessibility testing
- ✅ Reusable helpers and page objects
- ✅ CI/CD integration
- ✅ Clear documentation

**Happy testing! 🚀**
