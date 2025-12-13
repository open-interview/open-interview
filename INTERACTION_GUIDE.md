# Interaction Guide - Redesigned Q&A Interface

## 🖱️ Desktop Interactions

### Question Navigation
```
Keyboard Shortcuts:
↑ / ↓     Navigate between questions
→         Reveal answer
←         Return to home
ESC       Return to home
```

### Diagram Controls
```
Click Diagram     → Expand to fullscreen
In Fullscreen:
  Click + Drag    → Pan around diagram
  Scroll Wheel    → Zoom in/out
  [+] Button      → Zoom in
  [-] Button      → Zoom out
  [Fit] Button    → Auto-fit to screen
  [Reset] Button  → Reset to default view
  [X] Button      → Close fullscreen
  ESC Key         → Close fullscreen
```

### Question Picker
```
Click [List Icon]  → Open question picker
  Grid View        → See all questions as numbered tiles
  List View        → See questions with titles
  Click Question   → Jump to that question
  
Visual Indicators:
  🟢 Green         → Completed
  🔵 Blue          → Bookmarked
  ⚡ Primary       → Current question
  ⚪ Gray          → Not visited
```

### Filters
```
Click [Topic]      → Filter by subchannel
Click [Difficulty] → Filter by difficulty level
  🟢 Beginner
  🟡 Intermediate
  🔴 Advanced
```

### Timer
```
Click [Settings]   → Open timer settings
  Toggle Switch    → Enable/disable timer
  Slider           → Adjust duration (10s - 300s)
```

## 📱 Mobile Interactions

### Swipe Gestures
```
Swipe Left  ←     → Next question
Swipe Right →     → Previous question
Tap Answer Panel  → Reveal answer
```

### Diagram Controls
```
Tap Diagram       → Expand to fullscreen
In Fullscreen:
  Pinch Out       → Zoom in
  Pinch In        → Zoom out
  Drag            → Pan around
  [Fit] Button    → Auto-fit
  [X] Button      → Close
```

### Navigation
```
Tap [List]        → Open question picker
Tap [←] [→]       → Navigate questions
Tap [ESC]         → Return home
```

## 🎯 Common Workflows

### 1. Learning a New Topic
```
1. Select channel from home
2. Choose subchannel (optional)
3. Choose difficulty (optional)
4. Read question
5. Think about answer (timer counts down)
6. Tap/click to reveal answer
7. Review diagram (zoom if needed)
8. Read explanation
9. Swipe/arrow to next question
```

### 2. Reviewing Bookmarked Questions
```
1. Open question picker
2. Switch to list view
3. Look for 🔵 blue bookmark icons
4. Click bookmarked question
5. Review content
6. Remove bookmark if mastered
```

### 3. Studying Complex Diagrams
```
1. Reveal answer
2. Click diagram to expand
3. Zoom in on specific areas
4. Pan to see different parts
5. Use [Fit] to see full diagram
6. Use [Reset] to start over
7. Press ESC when done
```

### 4. Quick Review Session
```
1. Enable timer (30s recommended)
2. Read question
3. Think through answer
4. Answer auto-reveals at 0s
5. Quick scan of explanation
6. Arrow down to next
7. Repeat
```

### 5. Deep Study Session
```
1. Disable timer
2. Read question carefully
3. Write down your answer
4. Reveal answer
5. Study diagram thoroughly
6. Read full explanation
7. Review code examples
8. Bookmark if need review
9. Mark as complete
10. Move to next
```

## 🎨 Visual Feedback

### Hover States (Desktop)
```
Buttons          → Background lightens
Diagram          → Expand icon appears
Question Tiles   → Background changes
Links            → Underline appears
```

### Active States
```
Current Question → Primary color border
Completed        → Green indicator
Bookmarked       → Blue indicator
Timer Active     → Countdown display
```

### Loading States
```
Diagram Loading  → Spinner animation
Page Transition  → Fade animation
```

## 🔧 Advanced Features

### Question Picker Views

#### Grid View (Seat Map)
```
┌─────────────────────────────┐
│ [1] [2] [3] [4] [5] [6] ... │
│ [7] [8] [9] [10] [11] ...   │
│ ...                         │
└─────────────────────────────┘

Colors:
  Green  = Completed
  Blue   = Bookmarked
  Primary = Current
  Gray   = Not visited
```

#### List View
```
┌─────────────────────────────┐
│ 01  Question title here...  │
│     🔵 ✅                    │
├─────────────────────────────┤
│ 02  Another question...     │
│     ✅                       │
├─────────────────────────────┤
│ 03  Current question...     │
│     ⚡                       │
└─────────────────────────────┘
```

### Diagram Zoom Levels
```
0.25x  → 25%  (Very zoomed out)
0.50x  → 50%  (Zoomed out)
1.00x  → 100% (Default)
1.50x  → 150% (Zoomed in)
2.00x  → 200% (More zoomed in)
4.00x  → 400% (Maximum zoom)
```

### Timer Presets
```
Quick Review:    30s
Standard:        60s
Deep Study:      120s
Extended:        300s
Disabled:        OFF
```

## 📊 Status Indicators

### Question Status
```
⚡ Primary Color  → Current question
✅ Green Check    → Completed
🔵 Blue Bookmark  → Bookmarked
⚪ Gray           → Not visited
```

### Difficulty Badges
```
🟢 Beginner      → Green with Zap icon
🟡 Intermediate  → Yellow with Target icon
🔴 Advanced      → Red with Flame icon
```

### Progress Indicators
```
Progress Bar     → Visual completion percentage
Question Counter → "15 / 50" format
Remaining Count  → "35 LEFT" in footer
```

## 🎯 Pro Tips

### Efficient Navigation
1. Use keyboard shortcuts on desktop
2. Use swipe gestures on mobile
3. Use question picker for quick jumps
4. Bookmark difficult questions for review

### Diagram Mastery
1. Always expand complex diagrams
2. Zoom in on specific components
3. Pan to see relationships
4. Use fit-to-screen for overview

### Study Strategies
1. Start with beginner difficulty
2. Use timer for active recall
3. Disable timer for deep learning
4. Review bookmarked questions regularly
5. Track progress with completion badges

### Mobile Optimization
1. Use landscape mode for diagrams
2. Pinch-to-zoom for details
3. Swipe for quick navigation
4. Use grid view for overview

## 🚀 Keyboard Shortcuts Reference

```
Navigation:
  ↑           Previous question
  ↓           Next question
  →           Reveal answer
  ←           Return home
  ESC         Return home

Diagram (Fullscreen):
  ESC         Close fullscreen
  +           Zoom in
  -           Zoom out
  0           Reset zoom
  F           Fit to screen

General:
  T           Toggle theme (home page)
  S           View stats (home page)
```

## 📱 Touch Gestures Reference

```
Question Navigation:
  Swipe Left  → Next question
  Swipe Right → Previous question
  Tap Panel   → Reveal answer

Diagram:
  Tap         → Expand fullscreen
  Pinch Out   → Zoom in
  Pinch In    → Zoom out
  Drag        → Pan around
  Double Tap  → Fit to screen

General:
  Tap         → Select/activate
  Long Press  → Context menu (future)
```

## 🎓 Learning Modes

### 1. Speed Review Mode
- Enable timer (30s)
- Grid view for quick jumps
- Swipe through questions
- Focus on quick recall

### 2. Deep Study Mode
- Disable timer
- List view for context
- Expand all diagrams
- Read full explanations
- Take notes (external)

### 3. Practice Mode
- Enable timer (60s)
- Random difficulty
- Bookmark tough ones
- Track completion

### 4. Review Mode
- Filter by bookmarked
- Disable timer
- Focus on weak areas
- Remove bookmarks when mastered

## 🎯 Accessibility

### Keyboard Users
- Full keyboard navigation
- Clear focus indicators
- No mouse required
- Logical tab order

### Touch Users
- Large touch targets (36px+)
- Swipe gestures
- Pinch-to-zoom
- Tap to activate

### Screen Readers
- Semantic HTML
- ARIA labels
- Alt text for icons
- Clear headings

## 🔄 State Persistence

### Saved Automatically
- Current question index
- Completed questions
- Bookmarked questions
- Timer settings
- Filter preferences
- Last visited position

### Cleared On
- Browser cache clear
- Incognito mode exit
- Manual reset (future)

---

**Quick Start**: Just swipe left/right on mobile or use arrow keys on desktop!

**Need Help?**: Check the footer for keyboard shortcuts or hover over buttons for tooltips.

**Pro Tip**: Use the question picker grid view to see your progress at a glance!
