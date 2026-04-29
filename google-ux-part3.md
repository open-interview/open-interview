## 6. Component Decision Trees

### 6.1 Feedback & Overlay Components

**Decision Tree: Which feedback component to use?**

```
Does the user need to take action before continuing?
├── YES → Is it a critical/destructive action?
│   ├── YES → Dialog (blocking)
│   └── NO → Bottom Sheet (non-blocking, dismissible)
└── NO → Is it a confirmation of something that just happened?
    ├── YES → Does it need an action (e.g., Undo)?
    │   ├── YES → Snackbar with action
    │   └── NO → Snackbar (no action, 4s auto-dismiss)
    └── NO → Is it a persistent warning/status?
        ├── YES → Banner (inline, dismissible)
        └── NO → Toast (brief, no action, rare on Android)
```

**Comparison Table:**

| Component | Blocks UI | Has Action | Auto-dismiss | Swipe to dismiss | Use Case |
|---|---|---|---|---|---|
| **Dialog** | Yes | Yes/No | No | No | Confirm delete, sign out |
| **Bottom Sheet (modal)** | Yes | Yes | No | Yes (swipe down) | Share sheet, options menu |
| **Bottom Sheet (standard)** | No | Yes | No | Yes | Maps info panel |
| **Snackbar** | No | Optional (1 action) | Yes (4s) | Yes | "Saved", "Sent. Undo" |
| **Banner** | No | Up to 2 | No | No | Offline warning, update available |
| **Tooltip** | No | No | Yes (on blur) | No | Icon label on hover/long-press |

**Dialog rules:**
- Use for irreversible destructive actions only
- Maximum 2 buttons (Cancel + Confirm)
- Confirm button uses filled style; Cancel uses text style
- Never use a dialog when a snackbar + undo would work
- Title is optional; if used, max 1 line

### 6.2 Button Hierarchy

Every screen has a clear action hierarchy. Buttons communicate that hierarchy:

| Button Type | Emphasis | Container | Use Case | Max per Screen |
|---|---|---|---|---|
| **Filled** | Highest | Colored fill | Primary action | 1 |
| **Filled Tonal** | High | Tonal fill | Secondary primary action | 1–2 |
| **Outlined** | Medium | Border only | Secondary action | 2–3 |
| **Text** | Low | None | Tertiary, inline actions | Unlimited |
| **Elevated** | Medium | White + shadow | When surface contrast needed | 1–2 |
| **Icon Button** | Varies | Optional | Toolbar actions, toggles | Unlimited |
| **FAB** | Highest | Colored fill | Screen's primary action | 1 |
| **Extended FAB** | Highest | Colored fill + label | When label adds context | 1 |

**Button rules:**
- Never use two filled buttons side by side
- Destructive actions use the error color role, not primary
- Disabled buttons: 38% opacity, no interaction
- Minimum touch target: 48×48dp regardless of visual size
- Loading state: replace label with circular progress indicator

### 6.3 Card Variants

| Variant | Elevation | Border | Use Case |
|---|---|---|---|
| **Elevated** | Level 1 (1dp) | None | Default cards, content feeds |
| **Filled** | Level 0 | None | Subtle grouping, same-surface cards |
| **Outlined** | Level 0 | 1dp border | When elevation would cause visual noise |

**Card content rules:**
- Cards are containers, not components — they hold other components
- One primary action per card (the whole card is tappable, or one clear CTA)
- Card media: 16:9 ratio for landscape, 1:1 for square, 3:4 for portrait
- Never nest cards inside cards

### 6.4 Chip Types

Chips are compact, interactive elements for filtering, input, and suggestions:

| Chip Type | Dismissible | Icon | Use Case | Example |
|---|---|---|---|---|
| **Filter chip** | No (toggle) | Optional | Filter a list/feed | Search: "Past week", "Images" |
| **Input chip** | Yes (×) | Optional | Represent user input | Gmail: recipient tags |
| **Suggestion chip** | No | Optional | Offer quick actions | Assistant: suggested replies |
| **Assist chip** | No | Required | Contextual smart actions | Calendar: "Add to calendar" |

### 6.5 List vs Grid Decision

| Dimension | Use List | Use Grid |
|---|---|---|
| **Content type** | Text-heavy, varied length | Visual, uniform items |
| **Primary info** | Title + metadata | Image/thumbnail |
| **Scanning pattern** | Top-to-bottom (F-pattern) | Left-to-right, Z-pattern |
| **Item count** | Any | Best with 6+ items |
| **Examples** | Gmail inbox, Settings | Google Photos, Play Store apps |

**List item anatomy:**
```
[Leading (icon/avatar/checkbox)] [Headline] [Supporting text] [Trailing (icon/meta/switch)]
```

**Grid column rules:**
- Compact (mobile): 2 columns
- Medium (tablet): 3–4 columns
- Expanded (desktop): 4–6 columns
- Always use consistent aspect ratios within a grid

### 6.6 Text Field Patterns

| Variant | Use Case | When to Avoid |
|---|---|---|
| **Filled** | Forms, standalone inputs | Dense layouts |
| **Outlined** | When surface contrast is low | Most mobile forms |

**Text field states:**
```
Enabled → Hovered → Focused → Populated → Disabled → Error → Read-only
```

**Validation rules:**
- Validate on blur (not on every keystroke, not only on submit)
- Error message replaces helper text (same space, no layout shift)
- Character counter appears when limit is within 20% of max
- Never clear a field on error — preserve the user's input

---

## 7. Motion & Animation

### 7.1 The Four Motion Principles

**1. Informative**
Motion communicates spatial relationships and hierarchy. When a card expands into a detail view, the animation shows where the detail came from and how to get back.

**2. Focused**
Motion guides attention to what matters. Entrance animations draw the eye to new content. Exit animations confirm removal without distraction.

**3. Expressive**
Motion adds personality and delight at key moments — but only at key moments. Overuse destroys expressiveness.

**4. Responsive**
Motion provides immediate feedback. A button responds to touch within 100ms. Lag between input and response breaks the illusion of direct manipulation.

### 7.2 Easing Curves

Google uses four primary easing curves:

| Curve | CSS Equivalent | Use Case |
|---|---|---|
| **Standard** | `cubic-bezier(0.2, 0, 0, 1)` | Elements moving within the screen |
| **Decelerate (Enter)** | `cubic-bezier(0, 0, 0, 1)` | Elements entering the screen |
| **Accelerate (Exit)** | `cubic-bezier(0.3, 0, 1, 1)` | Elements leaving the screen |
| **Emphasized** | Custom spring | Hero transitions, expressive moments |

**Rule:** Entering elements decelerate (they arrive and settle). Exiting elements accelerate (they leave quickly, not lingering). Elements moving within the screen use standard easing.

### 7.3 Duration Tokens

Material Design defines duration tokens to ensure consistent timing:

| Token | Duration | Use Case |
|---|---|---|
| `short1` | 50ms | Micro-interactions (ripple start) |
| `short2` | 100ms | Small component state changes |
| `short3` | 150ms | Icon transitions, FAB state |
| `short4` | 200ms | Small enter/exit (tooltip, chip) |
| `medium1` | 250ms | Standard component transitions |
| `medium2` | 300ms | Cards, dialogs entering |
| `medium3` | 350ms | Bottom sheet entering |
| `medium4` | 400ms | Large component transitions |
| `long1` | 450ms | Complex layout changes |
| `long2` | 500ms | Page-level transitions |
| `long3` | 550ms | Shared element transitions |
| `long4` | 600ms | Hero transitions |
| `extraLong1` | 700ms | Full-screen transitions |
| `extraLong4` | 1000ms | Maximum (rare, expressive only) |

**Rule:** When in doubt, use `medium2` (300ms). Faster feels snappy; slower feels sluggish. Never exceed 400ms for functional transitions.

### 7.4 Transition Patterns

**Container Transform**
Used when an element expands into a larger view. The container morphs — it doesn't fade or slide.
- Example: Gmail list item → email detail
- Example: Google Photos thumbnail → full-screen photo
- The container's shape, size, and position all animate simultaneously

**Shared Axis**
Used for navigating between peer-level content with a spatial relationship.
- X-axis: horizontal navigation (tabs, carousels)
- Y-axis: vertical navigation (drill-down, scroll-linked)
- Z-axis: hierarchical navigation (push/pop)
- Example: Swiping between days in Google Calendar

**Fade Through**
Used when there's no spatial relationship between origin and destination.
- Outgoing element fades out and scales down slightly
- Incoming element fades in and scales up slightly
- Brief moment where both are invisible (the "through")
- Example: Switching between bottom nav tabs

**Forward and Backward**
- Forward: new screen slides in from right, current slides out to left
- Backward: current screen slides out to right, previous slides in from left
- Depth: new screen scales up from center (modal/overlay)

### 7.5 Micro-interactions

| Interaction | Animation | Duration |
|---|---|---|
| **Button press** | Ripple from touch point | 300ms |
| **Toggle/Switch** | Thumb slides, track color changes | 200ms |
| **Checkbox** | Checkmark draws in | 150ms |
| **Like/Favorite** | Icon fills with spring bounce | 300ms |
| **Pull to refresh** | Circular progress, then content drops in | Variable |
| **Swipe to dismiss** | Item slides out, list collapses | 200ms |
| **FAB → Extended FAB** | Width expands, label fades in | 200ms |
| **Search expand** | Bar expands to full width | 300ms |

### 7.6 Reduced Motion

Always respect `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  /* Replace motion with instant state changes or opacity-only transitions */
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

On Android: respect "Remove animations" in Developer Options and "Transition animation scale" in Accessibility settings.

**Rule:** Animations must never be the only way to convey information. State changes must be perceivable without motion.
