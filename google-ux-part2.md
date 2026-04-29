## 4. User Journey Patterns

### 4.1 Zero Moment of Truth (ZMOT)

Google coined ZMOT: the moment a user reaches for their device to research, decide, or act. Design for this moment:

- **Instant availability** — the product must be reachable in 1–2 taps from any context
- **Context awareness** — know what the user likely needs based on time, location, history
- **No friction at entry** — never require login to see value; defer account creation

**ZMOT Design Checklist:**
- [ ] Can a new user accomplish the primary job without signing in?
- [ ] Does the app launch to the most likely needed state (not always home)?
- [ ] Is the entry point reachable from the lock screen or widget?
- [ ] Does the app restore state if interrupted mid-task?

### 4.2 First Time User Experience (FTUE)

Google's FTUE philosophy: **earn trust before asking for anything**.

**The 3-30-300 Rule:**
| Timeframe | Goal | What to Show |
|---|---|---|
| **3 seconds** | Communicate core value | One clear headline, one action |
| **30 seconds** | Demonstrate value | First meaningful interaction, first "aha" moment |
| **300 seconds** | Build habit | Personalization, first success, reason to return |

**Google Maps FTUE Example:**
1. Launch → map of current location (immediate value, no login required)
2. First search → results appear instantly (demonstrates speed)
3. First navigation → turn-by-turn works without account (earns trust)
4. After 3 uses → "Sign in to save your places" (ask after value delivered)

**FTUE Anti-patterns Google avoids:**
- Asking for permissions before demonstrating why they're needed
- Multi-step onboarding carousels (users skip them)
- Requiring account creation before showing any value
- Asking for notification permission on first launch

### 4.3 Progressive Onboarding

Instead of upfront tutorials, Google embeds onboarding into the first real use:

| Pattern | Implementation | Example |
|---|---|---|
| **Contextual tooltips** | Appear on first encounter with a feature | Gmail: "Tip: Swipe to archive" on first email |
| **Empty state education** | Use empty states to teach, not just inform | Drive empty state shows how to upload |
| **Inline hints** | Placeholder text and helper text guide input | Search: "Search or type URL" |
| **Feature discovery** | Subtle animation draws attention to new features | Pulse animation on new nav items |
| **Undo as safety net** | Make actions reversible so users explore freely | Gmail: "Message sent. Undo" |

### 4.4 Empty States

Empty states are **teaching moments**, not failures. Google's formula:

```
Empty State = Illustration + Headline + Body + Primary Action
```

| Component | Rule | Bad Example | Good Example |
|---|---|---|---|
| **Illustration** | Friendly, contextual, not generic | Sad face icon | Illustration of the feature in use |
| **Headline** | Describe the opportunity, not the absence | "No items" | "Your saved places will appear here" |
| **Body** | Explain how to get started | (none) | "Tap the bookmark icon on any place to save it" |
| **Action** | One clear CTA | (none) | "Explore nearby places" |

**Types of empty states:**
- **First use** — user has never used this feature
- **User-cleared** — user deleted everything (celebrate, don't mourn)
- **No results** — search/filter returned nothing (suggest alternatives)
- **Error** — something went wrong (explain and offer recovery)

### 4.5 Error States

Google's error design principle: **errors are the product's fault, not the user's**.

| Error Type | Tone | Recovery Path | Example |
|---|---|---|---|
| **Network error** | Empathetic, not technical | Retry button + offline mode | "You're offline. Some features may be unavailable." |
| **No results** | Helpful | Suggest alternatives | "No results for 'cofee'. Did you mean 'coffee'?" |
| **Permission denied** | Explanatory | Deep link to settings | "Maps needs location access. Open Settings" |
| **Server error** | Honest, light | Retry + status page link | "Something went wrong on our end. Try again." |
| **Validation error** | Specific | Inline, field-level | "Enter a valid email address" (not "Invalid input") |
| **Destructive action** | Confirmatory | Undo, not confirm dialog | "Contact deleted. Undo" |

**Error message formula:**
```
What happened (plain language) + Why it happened (if helpful) + What to do next (specific action)
```

### 4.6 Loading States — The Hierarchy

Google uses a hierarchy of loading patterns based on context:

| Pattern | When to Use | Duration | Example |
|---|---|---|---|
| **Optimistic UI** | High-confidence actions | Instant | Gmail: email appears sent immediately |
| **Skeleton screen** | Content-heavy pages | <3s | YouTube: gray placeholder cards |
| **Shimmer animation** | Lists and feeds | <3s | Google News: shimmer on article cards |
| **Progress indicator (linear)** | Determinate progress | Any | Drive: file upload progress bar |
| **Progress indicator (circular)** | Indeterminate, short | <4s | Search: spinner on voice search |
| **Full-page loading** | App launch only | <2s | Maps: brief splash then immediate map |

**Rules:**
- Never show a spinner for actions that complete in <300ms
- Always show a skeleton screen instead of a blank page
- Optimistic UI requires a reliable undo/rollback mechanism
- If loading takes >10s, show progress and explain why

### 4.7 Success States

Success feedback must be **proportional to the significance of the action**:

| Action Significance | Feedback Type | Duration | Example |
|---|---|---|---|
| **Minor** (like, save) | Icon state change | Instant | Heart fills on YouTube like |
| **Moderate** (send, submit) | Snackbar | 4s | "Message sent. Undo" |
| **Major** (purchase, account creation) | Full confirmation screen | Persistent | Order confirmation page |
| **Milestone** (first use, streak) | Celebration animation | 2–3s | Google Fit: goal reached animation |

---

## 5. Navigation Architecture

### 5.1 Navigation Pattern Decision Table

Choosing the right navigation pattern is one of the most consequential UX decisions:

| Pattern | Screen Width | Destinations | Use Case | Example |
|---|---|---|---|---|
| **Bottom Navigation Bar** | Compact (<600dp) | 3–5 | Primary app sections, mobile | YouTube, Gmail mobile |
| **Navigation Rail** | Medium (600–840dp) | 3–7 | Tablet, foldable inner screen | Gmail tablet |
| **Navigation Drawer** | Expanded (>840dp) | 5+ | Desktop, complex apps | Gmail web, Drive web |
| **Tabs** | Any | 2–5 | Peer-level content within a section | Chrome tabs, Search result types |
| **Bottom Sheet Nav** | Compact | 5+ | Secondary navigation, overflow | Maps "Explore" sheet |

**Decision Flowchart:**
```
How many top-level destinations?
├── 1–2 → Use tabs or no navigation
├── 3–5 → 
│   ├── Mobile? → Bottom Navigation Bar
│   ├── Tablet? → Navigation Rail
│   └── Desktop? → Navigation Rail or Drawer
└── 6+ →
    ├── Mobile? → Bottom Nav (5 max) + overflow drawer
    ├── Tablet? → Navigation Rail + drawer
    └── Desktop? → Navigation Drawer (always visible)
```

### 5.2 Bottom Navigation Bar Rules

| Rule | Specification |
|---|---|
| **Destination count** | 3–5 (never fewer, never more) |
| **Height** | 80dp |
| **Icon size** | 24dp |
| **Label** | Always visible (never icon-only on mobile) |
| **Active indicator** | Pill shape behind active icon |
| **Badge** | Numeric (count) or dot (unread indicator) |
| **Scroll behavior** | Hide on scroll down, show on scroll up (optional) |
| **What goes here** | Top-level, peer destinations only |
| **What doesn't go here** | Actions (use FAB), settings (use overflow) |

### 5.3 Navigation Rail Specs (Tablet/Foldable)

| Property | Value |
|---|---|
| **Width** | 80dp (collapsed) / 360dp (expanded with labels) |
| **Icon size** | 24dp |
| **Active indicator** | Pill, 56dp wide |
| **FAB position** | Top of rail, above destinations |
| **Label behavior** | Always visible or on hover |

### 5.4 Floating Action Button (FAB) Rules

The FAB is the **single most important action** on the screen:

| FAB Type | Size | When to Use |
|---|---|---|
| **Small FAB** | 40dp | Secondary action, when space is constrained |
| **FAB** | 56dp | Primary action on a screen |
| **Large FAB** | 96dp | Hero action, prominent placement |
| **Extended FAB** | 56dp tall, variable width | When label adds critical context |

**FAB Placement Rules:**
- Bottom-right corner (LTR layouts)
- 16dp from screen edge
- Above bottom navigation bar (not overlapping)
- Disappears when keyboard is open
- One FAB per screen maximum
- FAB action must be the most frequent action on that screen

**When NOT to use a FAB:**
- When the action is destructive
- When there are multiple equally important actions
- On screens where the primary action is already in the app bar
- On detail/read-only screens

### 5.5 Search-First Navigation

Google products increasingly use **search as the primary navigation mechanism**:

| Pattern | Implementation | Example |
|---|---|---|
| **Persistent search bar** | Always visible at top | Google app, Chrome |
| **Collapsing search** | Expands on tap, collapses on scroll | Maps, Play Store |
| **Search in app bar** | Search icon in top app bar | Gmail, Drive |
| **Contextual search** | Search scoped to current section | YouTube channel search |

**Search bar anatomy:**
```
[Leading icon] [Query/Placeholder] [Voice] [Camera/Lens] [Avatar]
```

**Search interaction states:**
1. **Resting** — shows placeholder, avatar
2. **Focused** — keyboard opens, suggestions appear
3. **Typing** — real-time suggestions, query chips
4. **Results** — full results page, filter chips
5. **No results** — suggestions, spelling correction

### 5.6 Back Stack Management

Google's back navigation rules:

| Scenario | Expected Behavior |
|---|---|
| **Back from any screen** | Return to previous screen in the task |
| **Back from root screen** | Exit app (or go to home if launched from notification) |
| **Back from dialog** | Dismiss dialog, stay on screen |
| **Back from bottom sheet** | Dismiss sheet, stay on screen |
| **Back from search results** | Return to search input (not previous screen) |
| **Deep link entry** | Back goes to app home, not the referring app |
| **Notification deep link** | Back stack synthesized: Home → Section → Detail |

**Predictive Back (Android 13+):**
- Shows preview of destination behind current screen
- Swipe from edge to peek, release to confirm
- Design implication: back destinations must be visually meaningful

### 5.7 Deep Linking Patterns

| Type | Format | Use Case |
|---|---|---|
| **Web URL** | `https://maps.google.com/place/...` | Share, SEO, cross-platform |
| **App link** | `https://` handled by app | Seamless web-to-app |
| **Custom scheme** | `googlemaps://` | App-to-app |
| **Shortcut** | Home screen shortcut | Frequent destinations |

**Deep link UX rules:**
- Always synthesize a back stack (user should be able to navigate up)
- Handle expired/invalid links gracefully (don't show error, redirect to relevant section)
- Preserve deep link destination after sign-in flow
