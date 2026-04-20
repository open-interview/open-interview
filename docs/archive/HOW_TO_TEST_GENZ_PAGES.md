# How to Test Gen Z Pages - Quick Guide

## Start the Dev Server

```bash
npm run dev
```

Then open http://localhost:5000 in your browser.

## Test Each Page

### 1. Voice Practice (VoicePracticeGenZ)
**URL**: `/voice-practice`

**What to Test**:
1. Click microphone button → Should start recording
2. Speak into microphone → Transcript should appear
3. Click stop → Should show feedback
4. Toggle Training/Interview mode → Answer visibility changes
5. Click "Next Question" → Moves to next question

**Expected Look**:
- Pure black background
- Neon green microphone button with pulse
- Glassmorphism cards
- Neon progress bar for word count

### 2. Voice Session (VoiceSessionGenZ)
**URL**: `/voice-interview`

**What to Test**:
1. Select a session → Should show intro screen
2. Click "Start Session" → Begins recording
3. Answer questions → Feedback after each
4. Complete session → Shows results screen

**Expected Look**:
- Black background
- Neon blue/green gradient cards
- Session progress bar
- Animated feedback cards

### 3. Test Session (TestSessionGenZ)
**URL**: `/test/[channel-id]` (e.g., `/test/javascript`)

**What to Test**:
1. Click "Start Test" → Loads questions
2. Select answer (single choice) → Auto-advances
3. Select multiple answers → Click "Confirm"
4. Complete test → Shows pass/fail screen

**Expected Look**:
- Black background
- Neon borders on selected answers
- Progress bar at top
- Animated results screen

### 4. Coding Challenge (CodingChallengeGenZ)
**URL**: `/coding` or `/coding/[challenge-id]`

**What to Test**:
1. Select a challenge → Editor loads
2. Write code → Syntax highlighting works
3. Click "Run Code" → Results display
4. Navigate challenges → State persists

**Expected Look**:
- Same as original (wrapper component)
- Will be enhanced in future

### 5. Certification Practice (CertificationPracticeGenZ)
**URL**: `/certification/[cert-id]`

**What to Test**:
1. Select certification → Questions load
2. Answer questions → Progress tracks
3. Hit checkpoint → Test appears
4. Complete → Progress saves

**Expected Look**:
- Same as original (wrapper component)
- Will be enhanced in future

## Common Issues & Fixes

### Issue: Microphone not working
**Fix**: 
1. Check browser permissions (Chrome/Edge/Safari only)
2. Ensure HTTPS or localhost
3. Check browser console for errors

### Issue: Pages look wrong
**Fix**:
1. Clear browser cache (Cmd+Shift+R / Ctrl+Shift+R)
2. Check if Vite dev server restarted
3. Verify no CSS conflicts

### Issue: TypeScript errors
**Fix**:
```bash
npm run type-check
```

### Issue: Build fails
**Fix**:
```bash
rm -rf client/node_modules/.vite
npm run dev
```

## Visual Checklist

For each page, verify:
- [ ] Background is pure black (#000000)
- [ ] Buttons have neon gradients
- [ ] Cards have glassmorphism effect
- [ ] Progress bars are animated
- [ ] Hover effects work
- [ ] Animations are smooth (60fps)
- [ ] Text is readable
- [ ] Mobile responsive

## Browser Testing

Test in these browsers:
- [ ] Chrome (recommended)
- [ ] Edge
- [ ] Safari
- [ ] Firefox (voice features won't work)

## Mobile Testing

Test on mobile devices:
- [ ] iPhone Safari
- [ ] Android Chrome
- [ ] Tablet view

## Performance Check

Open DevTools → Performance tab:
- [ ] Page loads in < 2 seconds
- [ ] Animations run at 60fps
- [ ] No memory leaks
- [ ] No console errors

## Accessibility Check

- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Color contrast sufficient
- [ ] Focus indicators visible

## Quick Test Script

Run this in browser console to test all pages:
```javascript
// Test navigation
[
  '/voice-practice',
  '/voice-interview',
  '/test/javascript',
  '/coding',
  '/certification/aws-certified-developer-associate'
].forEach(path => {
  console.log(`Testing: ${path}`);
  window.location.href = path;
  // Wait 5 seconds, then check next
});
```

## Report Issues

If you find issues, note:
1. Page URL
2. What you did
3. What happened
4. What should happen
5. Browser & version
6. Screenshots if possible

## Success Indicators

✅ All pages load without errors
✅ All interactions work smoothly
✅ Design is consistent across pages
✅ No TypeScript errors
✅ No console warnings
✅ Performance is good

## Next Steps After Testing

1. Fix any issues found
2. Test again
3. Deploy to staging
4. User acceptance testing
5. Deploy to production

---

**Quick Start**: `npm run dev` → Open http://localhost:5000 → Test each page

**Need Help?**: Check browser console (F12) for errors
