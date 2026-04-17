# Project Reorganization Plan
## Mobile-First Architecture with Unified Views

### 🎯 Goals
1. **Unified Views**: Single consistent experience across certificate questions, channels, tests, and interviews
2. **Mobile-First**: Optimized for iPhone 13 (390x844px) with touch-first interactions
3. **Premium Aesthetics**: Vibrant gradients, smooth animations, high contrast
4. **Consistent Design**: Shared components and design system

---

## 📁 New Architecture

### Component Structure
```
client/src/
├── components/
│   ├── shared/                          # NEW: Unified components
│   │   ├── UnifiedQuestionView.tsx      # Main container for all question types
│   │   ├── UnifiedQuestionPanel.tsx     # Question display
│   │   ├── UnifiedAnswerPanel.tsx       # Answer display with tabs
│   │   ├── UnifiedMetadataBar.tsx       # Top bar (progress, timer, difficulty)
│   │   └── UnifiedProgressBar.tsx       # Visual progress indicator
│   │
│   ├── question/                        # Legacy (to be migrated)
│   │   ├── ExtremeQuestionViewer.tsx
│   │   ├── ExtremeQuestionPanel.tsx
│   │   └── ExtremeAnswerPanel.tsx
│   │
│   ├── layout/                          # Layout components
│   │   ├── AppLayout.tsx                # Main app wrapper
│   │   ├── UnifiedNav.tsx               # Navigation (desktop + mobile)
│   │   └── UnifiedMobileHeader.tsx      # Mobile header
│   │
│   └── unified/                         # Existing unified components
│       ├── QuestionCard.tsx
│       ├── DifficultyBadge.tsx
│       └── QuestionHistory.tsx
│
├── styles/
│   ├── design-system.css                # NEW: Design system variables
│   └── index.css                        # Main styles (to be updated)
│
└── pages/                               # Page components (to be updated)
    ├── ExtremeQuestionViewer.tsx        # Migrate to UnifiedQuestionView
    ├── TestSession.tsx                  # Migrate to UnifiedQuestionView
    ├── CertificationExam.tsx            # Migrate to UnifiedQuestionView
    ├── VoiceInterview.tsx               # Migrate to UnifiedQuestionView
    └── ReviewSession.tsx                # Migrate to UnifiedQuestionView
```

---

## 🎨 Design System

### Color Palette
```css
/* Base (OLED optimized) */
--color-base-black: hsl(0 0% 0%)
--color-base-dark: hsl(0 0% 2%)
--color-base-card: hsl(0 0% 6.5%)

/* Accent Gradients */
--color-accent-cyan: hsl(190 100% 50%)
--color-accent-purple: hsl(270 100% 65%)
--color-accent-pink: hsl(330 100% 65%)

/* Semantic */
--color-success: hsl(142 76% 36%)      /* Green */
--color-warning: hsl(38 92% 50%)       /* Amber */
--color-error: hsl(0 84% 60%)          /* Red */

/* Difficulty */
--color-difficulty-beginner: Green
--color-difficulty-intermediate: Amber
--color-difficulty-advanced: Red
```

### Mode-Specific Accents
- **Browse**: Cyan gradient
- **Test**: Amber gradient
- **Interview**: Purple gradient
- **Certification**: Blue gradient
- **Review**: Green gradient

### Typography
- **Font**: Inter (sans), JetBrains Mono (code)
- **Scale**: 12px, 14px, 16px, 18px, 20px, 24px, 30px, 36px
- **Line Height**: 1.5 (body), 1.2 (headings)

### Spacing
- **Scale**: 4px, 8px, 12px, 16px, 24px, 32px, 48px
- **Touch Targets**: Minimum 44x44px (iOS standard)
- **Safe Areas**: env(safe-area-inset-*) for notched devices

### Border Radius
- **Small**: 8px
- **Medium**: 12px
- **Large**: 16px
- **XL**: 24px

---

## 📱 Mobile Optimizations (iPhone 13)

### Viewport
- **Width**: 390px
- **Height**: 844px (with notch)
- **Safe Area Top**: ~47px (status bar + notch)
- **Safe Area Bottom**: ~34px (home indicator)

### Layout Patterns
```tsx
// Full-screen container
<div className="min-h-screen w-full overflow-hidden">
  {/* Top bar with safe area */}
  <div className="pt-safe">
    <MetadataBar />
  </div>
  
  {/* Scrollable content */}
  <div className="flex-1 overflow-y-auto">
    <Content />
  </div>
  
  {/* Bottom actions with safe area */}
  <div className="pb-safe">
    <ActionBar />
  </div>
</div>
```

### Touch Interactions
- **Minimum target**: 44x44px
- **Active state**: Scale down to 0.98
- **Haptic feedback**: Consider for important actions
- **Swipe gestures**: Left/right for navigation

### Performance
- **Animations**: Use `transform` and `opacity` (GPU accelerated)
- **Images**: Lazy load, use WebP
- **Fonts**: Preload critical fonts
- **Bundle**: Code split by route

---

## 🔄 Migration Strategy

### Phase 1: Foundation (Completed ✅)
- [x] Create UnifiedQuestionView component
- [x] Create UnifiedQuestionPanel component
- [x] Create UnifiedAnswerPanel component
- [x] Create UnifiedMetadataBar component
- [x] Create UnifiedProgressBar component
- [x] Create design-system.css

### Phase 2: Integration (Next Steps)
1. **Update TestSession.tsx**
   - Replace custom question display with UnifiedQuestionView
   - Pass mode="test"
   - Maintain test-specific logic (scoring, timer)

2. **Update CertificationExam.tsx**
   - Replace custom question display with UnifiedQuestionView
   - Pass mode="certification"
   - Maintain certification-specific logic

3. **Update VoiceInterview.tsx**
   - Replace custom question display with UnifiedQuestionView
   - Pass mode="interview"
   - Maintain voice recording logic

4. **Update ReviewSession.tsx**
   - Replace custom question display with UnifiedQuestionView
   - Pass mode="review"
   - Maintain SRS logic

5. **Update ExtremeQuestionViewer.tsx**
   - Replace with UnifiedQuestionView
   - Pass mode="browse"
   - Maintain channel browsing logic

### Phase 3: Polish
1. Add shared animations
2. Implement swipe gestures
3. Add haptic feedback (if supported)
4. Optimize bundle size
5. Add loading skeletons
6. Implement error boundaries

### Phase 4: Testing
1. Test on iPhone 13 (Safari)
2. Test on Android (Chrome)
3. Test on iPad
4. Test on desktop
5. Accessibility audit
6. Performance audit

---

## 🎯 Component Usage Examples

### Browse Mode (Channels)
```tsx
<UnifiedQuestionView
  question={currentQuestion}
  questionNumber={currentIndex + 1}
  totalQuestions={questions.length}
  mode="browse"
  showAnswer={showAnswer}
  onAnswerToggle={() => setShowAnswer(!showAnswer)}
  onNext={handleNext}
  onPrevious={handlePrevious}
  onBookmark={handleBookmark}
  isBookmarked={isBookmarked}
  autoReveal={true}
/>
```

### Test Mode
```tsx
<UnifiedQuestionView
  question={currentQuestion}
  questionNumber={currentIndex + 1}
  totalQuestions={questions.length}
  mode="test"
  showAnswer={false}
  onAnswerToggle={handleSubmitAnswer}
  onNext={handleNextQuestion}
  timeLimit={testConfig.timeLimit}
  timeRemaining={timeRemaining}
/>
```

### Interview Mode
```tsx
<UnifiedQuestionView
  question={currentQuestion}
  questionNumber={currentIndex + 1}
  totalQuestions={questions.length}
  mode="interview"
  showAnswer={showAnswer}
  onAnswerToggle={() => setShowAnswer(!showAnswer)}
  onNext={handleNext}
  onPrevious={handlePrevious}
/>
```

### Certification Mode
```tsx
<UnifiedQuestionView
  question={currentQuestion}
  questionNumber={currentIndex + 1}
  totalQuestions={questions.length}
  mode="certification"
  showAnswer={showExplanation}
  onAnswerToggle={handleToggleExplanation}
  onNext={handleNext}
  timeLimit={examConfig.timeLimit}
  timeRemaining={timeRemaining}
/>
```

### Review Mode (SRS)
```tsx
<UnifiedQuestionView
  question={currentQuestion}
  questionNumber={currentIndex + 1}
  totalQuestions={dueCards.length}
  mode="review"
  showAnswer={showAnswer}
  onAnswerToggle={() => setShowAnswer(!showAnswer)}
  onNext={handleNext}
/>
```

---

## 🎨 Aesthetic Guidelines

### Visual Hierarchy
1. **Question text**: Largest, most prominent
2. **Metadata**: Small, subtle (top bar)
3. **Actions**: Clear, accessible (bottom bar)
4. **Progress**: Visible but not distracting

### Color Usage
- **Primary gradient**: CTAs, active states
- **Difficulty colors**: Badges, indicators
- **Semantic colors**: Success, warning, error states
- **Muted colors**: Secondary text, borders

### Animation Principles
- **Duration**: 200-400ms for most transitions
- **Easing**: cubic-bezier(0.4, 0, 0.2, 1)
- **Purpose**: Guide attention, provide feedback
- **Performance**: Use transform and opacity only

### Typography
- **Headings**: Bold, gradient text for emphasis
- **Body**: Regular weight, high contrast
- **Code**: Monospace, syntax highlighted
- **Labels**: Small, uppercase, muted

---

## 📊 Success Metrics

### Performance
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3s
- [ ] Lighthouse score > 90

### Accessibility
- [ ] WCAG 2.1 AA compliance
- [ ] Keyboard navigation
- [ ] Screen reader support
- [ ] Touch target size compliance

### User Experience
- [ ] Consistent view across all modes
- [ ] Smooth animations (60fps)
- [ ] No horizontal scroll on mobile
- [ ] Touch-friendly interactions

---

## 🚀 Next Steps

1. **Import design-system.css** in main CSS file
2. **Update TestSession.tsx** to use UnifiedQuestionView
3. **Test on iPhone 13** (Safari)
4. **Iterate based on feedback**
5. **Migrate remaining pages**
6. **Remove legacy components**
7. **Document component API**
8. **Create Storybook stories**

---

## 📝 Notes

- All new components are in `client/src/components/shared/`
- Design system variables are in `client/src/styles/design-system.css`
- Mobile-first approach: Design for 390px, enhance for larger screens
- Touch targets: Minimum 44x44px for all interactive elements
- Safe areas: Always account for notch and home indicator
- Animations: Keep under 400ms, use GPU-accelerated properties
- Colors: High contrast for readability, vibrant for engagement
- Typography: Clear hierarchy, readable sizes

---

## 🎉 Benefits

### For Users
- ✅ Consistent experience across all features
- ✅ Optimized for mobile (iPhone 13)
- ✅ Beautiful, modern design
- ✅ Smooth, responsive interactions
- ✅ Accessible and inclusive

### For Developers
- ✅ Single source of truth for question views
- ✅ Reusable components
- ✅ Clear design system
- ✅ Easy to maintain and extend
- ✅ Type-safe with TypeScript

### For the Project
- ✅ Reduced code duplication
- ✅ Faster feature development
- ✅ Consistent brand identity
- ✅ Better performance
- ✅ Easier testing
