# Testing Guide - Gen Z Redesign 🧪

## Quick Start

### 1. Dev Server
```bash
# Server is running on:
http://localhost:5003/
```

### 2. Pages to Test

#### ✅ Redesigned (Gen Z Style)
- [ ] **Home** - `/` - Sticky stats, hero, channels grid
- [ ] **Channels** - `/channels` - Search, filters, subscribe
- [ ] **Stats** - `/stats` - Progress dashboard, heatmap
- [ ] **Tests** - `/tests` - Test cards, scores
- [ ] **Profile** - `/profile` - Settings, preferences
- [ ] **Badges** - `/badges` - Achievements, progress

#### 🚧 Old Design (Still Functional)
- [ ] **Question Viewer** - `/channel/frontend` - Question/answer split
- [ ] **Voice Practice** - `/voice-interview` - Voice recording
- [ ] **Training Mode** - `/training` - Voice with answers
- [ ] **Coding** - `/coding` - Code editor
- [ ] **Test Session** - `/test/frontend` - Quiz mode
- [ ] **Certifications** - `/certifications` - Cert list
- [ ] **About** - `/about` - Info page
- [ ] **What's New** - `/whats-new` - Changelog
- [ ] **Bookmarks** - `/bookmarks` - Saved questions
- [ ] **Notifications** - `/notifications` - Alerts
- [ ] **Review** - `/review` - SRS review
- [ ] **Learning Paths** - `/learning-paths` - Personalized paths
- [ ] **Documentation** - `/docs` - Docs

## Navigation Testing

### From Home Page
1. Click "Start Practice" → Should go to `/voice-interview`
2. Click "Voice" quick action → Should go to `/voice-interview`
3. Click "Code" quick action → Should go to `/coding`
4. Click "Train" quick action → Should go to `/training`
5. Click "Test" quick action → Should go to `/tests`
6. Click any channel card → Should go to `/extreme/channel/{id}`
7. Click "+ Add More" → Should go to `/channels`

### From Channels Page
1. Search for "react" → Should filter channels
2. Click category filter → Should filter by category
3. Click "Subscribe" → Should toggle subscription
4. Click subscribed channel → Should go to `/extreme/channel/{id}`

### From Stats Page
1. Click channel card → Should go to `/extreme/channel/{id}`
2. View activity heatmap → Should show 91 days
3. Check level progress → Should animate

### From Tests Page
1. Click test card → Should go to `/test/{channelId}`
2. View stats → Should show passed/attempts/avg
3. Check expired tests → Should show warning

### From Profile Page
1. Toggle settings → Should update preferences
2. Click "Achievements" → Should go to `/badges`
3. Click "Statistics" → Should go to `/stats`

### From Badges Page
1. Filter by category → Should filter badges
2. View locked badges → Should show lock icon
3. View progress → Should show progress bar
4. Check "Almost There" section → Should show next badges

## Visual Testing

### Colors
- [ ] Background is pure black (#000000)
- [ ] Neon green (#00ff88) used for success/progress
- [ ] Neon cyan (#00d4ff) used for info/links
- [ ] Neon pink (#ff0080) used for alerts
- [ ] Neon gold (#ffd700) used for achievements
- [ ] Text is white (#ffffff) or gray (#a0a0a0)

### Typography
- [ ] Headlines are massive (72px on desktop)
- [ ] Font is Inter (sans-serif)
- [ ] Text is readable on all backgrounds
- [ ] Line heights are appropriate

### Effects
- [ ] Glassmorphism visible (backdrop-blur)
- [ ] Gradients render correctly
- [ ] Borders are subtle (white/10)
- [ ] Shadows are appropriate
- [ ] Hover effects work

### Animations
- [ ] Page transitions smooth
- [ ] Card hovers lift up
- [ ] Progress bars animate
- [ ] Buttons scale on press
- [ ] Loading states shimmer
- [ ] 60fps throughout

## Functionality Testing

### Data Persistence
- [ ] Subscriptions save
- [ ] Progress saves
- [ ] Preferences save
- [ ] XP accumulates
- [ ] Streak tracks correctly

### Navigation
- [ ] All links work
- [ ] Back button works
- [ ] Forward button works
- [ ] Browser history correct
- [ ] No broken links

### Forms & Inputs
- [ ] Search works
- [ ] Filters work
- [ ] Toggles work
- [ ] Buttons work
- [ ] Keyboard navigation works

### Error Handling
- [ ] 404 page shows for invalid routes
- [ ] Empty states show when no data
- [ ] Loading states show while loading
- [ ] Error messages are clear
- [ ] No console errors

## Responsive Testing

### Mobile (< 640px)
- [ ] Text sizes scale down
- [ ] Grid becomes 1 column
- [ ] Touch targets adequate (44px min)
- [ ] No horizontal scroll
- [ ] Bottom nav visible
- [ ] Sidebar hidden

### Tablet (640px - 1024px)
- [ ] Text sizes appropriate
- [ ] Grid becomes 2 columns
- [ ] Touch targets adequate
- [ ] No horizontal scroll
- [ ] Layout balanced

### Desktop (> 1024px)
- [ ] Text sizes full
- [ ] Grid becomes 3-4 columns
- [ ] Hover effects work
- [ ] Sidebar visible
- [ ] Layout spacious

## Performance Testing

### Load Time
- [ ] First Contentful Paint < 1s
- [ ] Time to Interactive < 2s
- [ ] Largest Contentful Paint < 2.5s

### Runtime
- [ ] Animations 60fps
- [ ] No jank on scroll
- [ ] No layout shift
- [ ] Smooth interactions
- [ ] Quick page transitions

### Bundle Size
- [ ] JavaScript < 500KB
- [ ] CSS < 100KB
- [ ] Images optimized
- [ ] Fonts loaded efficiently

## Accessibility Testing

### Keyboard Navigation
- [ ] Tab order logical
- [ ] Focus indicators visible
- [ ] Enter/Space activate buttons
- [ ] Escape closes modals
- [ ] Arrow keys navigate lists

### Screen Reader
- [ ] Headings hierarchical
- [ ] Images have alt text
- [ ] Buttons have labels
- [ ] Links descriptive
- [ ] ARIA labels present

### Color Contrast
- [ ] Text readable (WCAG AA)
- [ ] Links distinguishable
- [ ] Buttons clear
- [ ] Icons visible
- [ ] Focus indicators clear

## Browser Testing

### Chrome
- [ ] All features work
- [ ] Animations smooth
- [ ] No console errors
- [ ] DevTools clean

### Firefox
- [ ] All features work
- [ ] Animations smooth
- [ ] No console errors
- [ ] DevTools clean

### Safari
- [ ] All features work
- [ ] Animations smooth
- [ ] No console errors
- [ ] DevTools clean

### Edge
- [ ] All features work
- [ ] Animations smooth
- [ ] No console errors
- [ ] DevTools clean

## Bug Reporting

### Template
```markdown
**Page:** [Page name and URL]
**Browser:** [Browser and version]
**Device:** [Desktop/Mobile/Tablet]
**Issue:** [Clear description]
**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]
3. [Step 3]
**Expected:** [What should happen]
**Actual:** [What actually happens]
**Screenshot:** [If applicable]
```

## Common Issues & Fixes

### Issue: Old design still showing
**Fix:** Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

### Issue: Animations laggy
**Fix:** Close other tabs, check GPU acceleration

### Issue: Text too big on mobile
**Fix:** Should auto-scale, check responsive CSS

### Issue: Console errors
**Fix:** Check browser console, share errors

### Issue: Navigation broken
**Fix:** Check route definitions in App.tsx

### Issue: Data not saving
**Fix:** Check localStorage, clear if needed

### Issue: Images not loading
**Fix:** Check network tab, verify paths

### Issue: Styles not applying
**Fix:** Check CSS import order, clear cache

## Test Results

### Date: [Fill in]
### Tester: [Fill in]
### Browser: [Fill in]
### Device: [Fill in]

#### Pages Tested
- [ ] Home
- [ ] Channels
- [ ] Stats
- [ ] Tests
- [ ] Profile
- [ ] Badges

#### Issues Found
1. [Issue 1]
2. [Issue 2]
3. [Issue 3]

#### Overall Rating
- [ ] 🟢 Excellent - No issues
- [ ] 🟡 Good - Minor issues
- [ ] 🟠 Fair - Some issues
- [ ] 🔴 Poor - Major issues

#### Notes
[Additional notes]

---

**Happy Testing! 🧪✨**
