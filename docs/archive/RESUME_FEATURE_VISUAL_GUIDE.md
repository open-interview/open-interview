# Resume Feature - Visual Guide

## 🎨 What Users See

### Home Page with Resume Section

```
┌─────────────────────────────────────────────────────────────────┐
│                         CodeReels                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Ready to practice?                                             │
│  Continue your interview preparation journey                     │
│                                                                  │
│  🎯 42 completed  🔥 7 day streak  ✨ 1,250 credits            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  🔄 Continue Where You Left Off                    ✨ New       │
│  3 sessions in progress                                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │ 📋 AWS Test      │  │ 🎤 System Design │  │ 🏆 AWS SAA   │ │
│  │ Question 6 of 15 │  │ Question 3 of 5  │  │ Q 12 of 65   │ │
│  │                  │  │                  │  │              │ │
│  │ Progress         │  │ Progress         │  │ Progress     │ │
│  │ ████████░░░ 40%  │  │ ██████░░░░░ 60%  │  │ ███░░░░ 18%  │ │
│  │                  │  │                  │  │              │ │
│  │ 🕐 2 hours ago   │  │ 🕐 1 day ago     │  │ 🕐 3 days ago│ │
│  │ [▶ Resume →] [X] │  │ [▶ Resume →] [X] │  │ [▶ Resume →] │ │
│  └──────────────────┘  └──────────────────┘  └──────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  Quick Start                                                     │
├─────────────────────────────────────────────────────────────────┤
│  [🎤 Voice Interview] [💻 Coding] [🎯 Training] [⚡ Tests]     │
└─────────────────────────────────────────────────────────────────┘
```

## 📱 Responsive Design

### Desktop (3 columns)
```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Session 1  │  │   Session 2  │  │   Session 3  │
└──────────────┘  └──────────────┘  └──────────────┘
```

### Tablet (2 columns)
```
┌──────────────┐  ┌──────────────┐
│   Session 1  │  │   Session 2  │
└──────────────┘  └──────────────┘
┌──────────────┐
│   Session 3  │
└──────────────┘
```

### Mobile (1 column)
```
┌──────────────┐
│   Session 1  │
└──────────────┘
┌──────────────┐
│   Session 2  │
└──────────────┘
┌──────────────┐
│   Session 3  │
└──────────────┘
```

## 🎭 Resume Tile States

### Default State
```
┌─────────────────────────────────────┐
│ 📋  AWS Test                        │
│     Question 6 of 15                │
│                                     │
│ Progress ████████░░░░░░ 40%        │
│                                     │
│ 🕐 2 hours ago    [▶ Resume →]     │
└─────────────────────────────────────┘
```

### Hover State
```
┌─────────────────────────────────────┐
│ 📋  AWS Test                    [X] │ ← Abandon button appears
│     Question 6 of 15                │
│                                     │
│ Progress ████████░░░░░░ 40%        │ ← Slight lift animation
│                                     │
│ 🕐 2 hours ago    [▶ Resume →]     │ ← Button highlighted
└─────────────────────────────────────┘
     ↑ Subtle shadow and border glow
```

### Loading State
```
┌─────────────────────────────────────┐
│ 📋  AWS Test                        │
│     Question 6 of 15                │
│                                     │
│ Progress ████████░░░░░░ 40%        │
│                                     │
│ 🕐 2 hours ago    [⏳ Loading...]   │
└─────────────────────────────────────┘
```

## 🎨 Color Coding

### Test Sessions (Channel Colors)
```
AWS:        🟠 Orange (#ff9900)
Azure:      🔵 Blue (#0078d4)
GCP:        🔵 Blue (#4285f4)
Kubernetes: 🔵 Blue (#326ce5)
Python:     🔵 Blue (#3776ab)
JavaScript: 🟡 Yellow (#f7df1e)
```

### Voice Interviews
```
🟣 Purple (#8b5cf6)
```

### Certifications
```
🟡 Amber (#f59e0b)
```

## 🎬 Animations

### Tile Entry Animation
```
Frame 1: opacity: 0, y: 20
Frame 2: opacity: 0.5, y: 10
Frame 3: opacity: 1, y: 0
Duration: 300ms
Stagger: 50ms per tile
```

### Progress Bar Fill
```
Frame 1: width: 0%
Frame 2: width: 20%
Frame 3: width: 40%
Duration: 500ms
Easing: ease-out
```

### Hover Lift
```
Default: scale: 1, y: 0
Hover:   scale: 1.02, y: -4
Duration: 200ms
```

## 🔔 User Interactions

### 1. Resume Button Click
```
User clicks "Resume" →
  Show loading state →
    Navigate to activity page →
      Load session state →
        Continue from last question
```

### 2. Abandon Button Click
```
User clicks "X" →
  Show confirmation dialog →
    User confirms →
      Remove from localStorage →
        Fade out tile →
          Update session count
```

### 3. Empty State
```
No sessions in progress →
  Hide entire Resume Section →
    Show only Quick Actions
```

## 📊 Progress Indicators

### Progress Bar Colors
```
0-24%:   Gray    ░░░░░░░░░░ (Getting started)
25-49%:  Orange  ████░░░░░░ (Making progress)
50-79%:  Blue    ██████░░░░ (Halfway there)
80-100%: Green   █████████░ (Almost done!)
```

### Progress Text
```
Format: "Question X of Y"
Examples:
  - "Question 1 of 15"
  - "Question 6 of 15"
  - "Question 15 of 15"
```

## 🕐 Timestamp Formats

### Relative Time
```
< 1 min:     "Just now"
1-59 mins:   "X mins ago"
1-23 hours:  "X hours ago"
1-6 days:    "X days ago"
7+ days:     "Jan 13, 2026"
```

## 🎯 Interactive Elements

### Resume Button
```
Default:  [▶ Resume →]
Hover:    [▶ Resume →]  (highlighted, slight translate)
Active:   [▶ Resume →]  (pressed effect)
Loading:  [⏳ Loading...]
```

### Abandon Button
```
Default:  Hidden
Hover:    [X] (appears with fade-in)
Active:   [X] (red tint)
```

## 📱 Responsive Breakpoints

```
Mobile:   < 768px  (1 column)
Tablet:   768-1024px (2 columns)
Desktop:  > 1024px (3 columns)
```

## 🎨 Theme Support

### Light Mode
```
Background: White (#ffffff)
Border:     Gray (#e5e7eb)
Text:       Dark (#1f2937)
Hover:      Light gray (#f9fafb)
```

### Dark Mode
```
Background: Dark (#1f2937)
Border:     Dark gray (#374151)
Text:       Light (#f9fafb)
Hover:      Darker (#111827)
```

## 🔍 Accessibility

### Keyboard Navigation
```
Tab:        Focus next tile
Shift+Tab:  Focus previous tile
Enter:      Resume session
Escape:     Close confirmation dialog
```

### Screen Reader
```
"Resume tile for AWS Test, 
 Question 6 of 15, 
 40% complete, 
 Last accessed 2 hours ago, 
 Press Enter to resume"
```

## 🎉 Success States

### Session Completed
```
┌─────────────────────────────────────┐
│ ✅ AWS Test Completed!              │
│    Score: 85% (13/15 correct)       │
│                                     │
│ Progress ██████████ 100%           │
│                                     │
│ 🎉 Great job!  [View Results]      │
└─────────────────────────────────────┘
     ↑ Tile fades out after 3 seconds
```

## 🚫 Error States

### Failed to Load
```
┌─────────────────────────────────────┐
│ ⚠️  Failed to Load Session          │
│     Unable to resume AWS Test       │
│                                     │
│ [Try Again]  [Remove]               │
└─────────────────────────────────────┘
```

## 💡 Tips for Users

### Maximizing the Feature
1. **Start Multiple Sessions**: Practice different topics simultaneously
2. **Check Progress**: Monitor your completion percentage
3. **Prioritize**: Resume sessions with higher progress first
4. **Clean Up**: Abandon sessions you no longer want to continue
5. **Stay Consistent**: Return regularly to maintain momentum

### Best Practices
- Resume sessions within 24 hours for best retention
- Complete sessions before starting new ones
- Use the progress bar to gauge time commitment
- Abandon sessions that are no longer relevant

---

**Visual Design**: Modern, clean, and intuitive
**Animation**: Smooth and performant
**Accessibility**: Fully keyboard navigable and screen reader friendly
