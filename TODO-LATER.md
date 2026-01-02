# Todo Later

## Doodles Feature (Future Implementation)

> **Note**: Original details were accidentally overwritten. Please add back the doodles feature information here.

### Description
<!-- Add description of the doodles feature -->

### Requirements
<!-- Add requirements -->

### Previous Attempts
<!-- Why they didn't work -->

### Possible Solutions
<!-- Solutions to explore later -->

---

## Workout Suggestion Plan - Rework Ideas

### Current Implementation
- Card-style questionnaire (4 cards: Goal, Days per week, Rest days, Preferred time)
- Goal-based routine prioritization
- Plan approval modal before applying
- Suggestions displayed on day cards below "Upcoming"
- "Done" button disabled for future days, enabled only for today

### Potential Improvements to Consider

1. **Auto-regenerate suggestions**
   - Regenerate at week start automatically
   - Regenerate when user adds/removes routines
   - Clear old week suggestions

2. **Smarter suggestion algorithm**
   - Avoid back-to-back same routines
   - Balance routine types across the week
   - Consider workout intensity (hard/medium/easy days)

3. **Progress tracking**
   - Show completion rate for suggested workouts
   - Weekly summary of followed vs skipped suggestions

4. **Notification/reminder system**
   - Optional reminder for today's suggested workout
   - Push notification support

5. **Edit individual suggestions**
   - Allow swapping a suggestion with different routine
   - Reschedule suggestion to different day

6. **Historical preferences**
   - Learn from user's actual workout patterns
   - Suggest based on what user typically does on each day

---

## Movable/Reorderable Widgets in Focus Mode

### Current State
- Widget order in **grid mode** already affects **focus mode** (they share the same order)
- Reordering can be done by changing widget order in grid mode

### Feature Request (Parked)
Add ability to reorder widgets within focus mode directly.

### Implementation Options

| Approach | Pros | Cons |
|----------|------|------|
| **Drag & Drop** | Intuitive, familiar UX | More complex, needs touch support |
| **Up/Down Arrows** | Simple, accessible | Less elegant, more clicks |
| **Edit Mode Toggle** | Safer (prevents accidental reorder) | Extra step to enter/exit |

### Requirements (if implemented later)
- Widget order should be **per-member** (each family member has their own layout)
- Reorderable (not free-drag) - simple up/down within the list
- Persist order to storage

### Decision
**Parked** - Grid mode reordering already works and affects focus mode. This feature is not essential at this time.

---

## Recipes Widget - Advanced Features

### 1. Cooking Mode
**Description**: A distraction-free, step-by-step cooking view with large text and voice control.

**Features**:
- Large, readable font size for each step
- Step-by-step navigation (prev/next buttons)
- Keep screen awake while cooking
- Voice commands: "Next step", "Previous step", "Read step"
- Timer integration (start timers mentioned in recipe steps)
- Hands-free mode with voice readout of current step

**UI Concept**:
- Full-screen modal with dark/light theme toggle
- Progress indicator (Step 3 of 8)
- Large step text centered on screen
- Big touch targets for next/prev (good for messy hands)
- Timer quick-start buttons for common times (1, 5, 10, 15 min)

---

### 2. Recipe Scaling
**Description**: Automatically adjust ingredient quantities based on desired servings.

**Features**:
- Servings selector (increase/decrease from original)
- Auto-calculate ingredient amounts
- Support for fractional measurements (1/4, 1/2, 3/4)
- Round to practical measurements (don't show 0.333 cups)
- Lock certain ingredients that don't scale (e.g., "1 pinch salt")
- Show original vs scaled amounts side by side

**Implementation Notes**:
- Parse ingredient strings to extract quantity, unit, and ingredient name
- Handle various formats: "2 cups flour", "1/2 tsp salt", "3 large eggs"
- Store original servings count with recipe
- Common unit conversions (3 tsp = 1 tbsp, 16 tbsp = 1 cup)

**Scaling Formula**:
```javascript
scaledQty = originalQty * (desiredServings / originalServings)
```

---

### 3. Import Recipe from URL
**Description**: Automatically extract recipe data from popular cooking websites.

**Features**:
- Paste URL, auto-extract recipe details
- Support for schema.org Recipe markup (most recipe sites use this)
- Extract: title, ingredients, instructions, prep/cook time, servings, image
- Preview extracted data before saving
- Edit any field before final import
- Fallback: manual entry if extraction fails

**Supported Sites** (sites using Recipe schema):
- AllRecipes
- Food Network
- Tasty
- Epicurious
- BBC Good Food
- Serious Eats
- Most WordPress recipe plugins

**Technical Approach**:
```javascript
// Option 1: Client-side (limited by CORS)
// Requires a proxy server or browser extension

// Option 2: Backend service
// POST /api/import-recipe { url: "https://..." }
// Uses server-side scraping with cheerio/puppeteer

// Option 3: Use a recipe extraction API
// - Spoonacular API
// - Edamam Recipe API
// - Recipe Puppy API
```

**UI Flow**:
1. Click "Import from URL" button
2. Paste recipe URL
3. Click "Extract" → loading spinner
4. Preview extracted recipe in form
5. Edit any fields if needed
6. Click "Save Recipe"

---

### Priority & Complexity

| Feature | Priority | Complexity | Notes |
|---------|----------|------------|-------|
| Recipe Scaling | Medium | Medium | Pure frontend, no API needed |
| Cooking Mode | Medium | Medium | UI-heavy, voice API optional |
| Import from URL | Low | High | Needs backend/proxy for CORS |

**Recommended Implementation Order**:
1. Recipe Scaling (most useful, self-contained)
2. Cooking Mode (great UX enhancement)
3. Import from URL (nice-to-have, complex)

---

## Firebase Authentication & Multi-Device Sync

### Overview
Add Firebase for user authentication and real-time data sync across devices. Essential for families using the app on multiple phones/tablets.

### Why Firebase?
- **Real-time sync**: Changes appear instantly on all devices
- **Offline support**: App works without internet, syncs when back online
- **Free tier**: Generous limits (1GB storage, 50K reads/day) - enough for hundreds of families
- **Easy Google Sign-In**: One-tap authentication

### Current State
- Data stored in localStorage (device-only)
- ~200 KB/month data for family of 4
- localStorage limit: 5-10 MB (2-3 years before hitting limit)
- Export/Import available in Settings as manual backup

### Implementation Plan

#### Phase 1: Firebase Setup
1. Create Firebase project at https://console.firebase.google.com
2. Enable Authentication (Google + Email/Password)
3. Create Firestore database (start in test mode)
4. Get Firebase config credentials

#### Phase 2: Files to Create
| File | Purpose |
|------|---------|
| `js/firebase-config.js` | Firebase SDK initialization |
| `js/auth.js` | Sign-in/sign-out functions |
| `js/firestore-storage.js` | Firestore adapter (same API as Storage) |
| `css/auth.css` | Login page styles |

#### Phase 3: Files to Modify
| File | Changes |
|------|---------|
| `index.html` | Add Firebase SDK scripts |
| `landing.html` | Add login UI, update nav |
| `js/app.js` | Check auth state before init |
| `js/storage.js` | Add provider abstraction layer |
| `js/features/settings-page.js` | Add account section, remove PIN |

#### Phase 4: Firestore Data Structure
```
families/
  {familyId}/
    settings: { theme, notifications, ... }
    members/
      {memberId}: { name, type, widgets, ... }
    schedules/
      {memberId}: { default: [], 0: [], ... }
    calendar/
      {eventId}: { date, title, memberId, ... }
    widgetData/
      {memberId}_{widgetId}: { ...data }
```

#### Phase 5: Data Migration
- Detect existing localStorage data on first login
- Offer one-time migration to cloud
- Clear localStorage after successful migration

### Firebase Pricing Notes
| Usage | Cost |
|-------|------|
| 1 family | Free |
| 100 families | Free |
| 1,000+ families | ~$5-25/month |

### Security Rules (Firestore)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /families/{familyId}/{document=**} {
      allow read, write: if request.auth != null
        && request.auth.uid == familyId;
    }
  }
}
```

### User Flow After Implementation
```
Landing Page
    ↓
[Try Demo] → Demo Mode (no login)
[Get Started] → Google/Email Sign-In
    ↓
Dashboard (synced across all devices)
```

### Considerations
- **Vendor lock-in**: Migrating away from Firebase is painful
- **Read operations**: Can add up if queries are inefficient
- **No spending cap**: Blaze plan has no auto-stop (use budget alerts)

### Status
**Parked** - Validating core product for 15 days first. Will implement before sharing with friends for feedback.

---

## Mobile Dropdown Positioning Issue (Habits Widget)

**Status:** Unresolved
**Priority:** Medium
**Affected:** Mobile browsers (iOS/Android)
**Files:** Manage Habits modal - Category and Schedule dropdowns

### Problem
When opening the "Manage Habits" modal on mobile devices and clicking on the Category or Schedule dropdowns, the native select dropdown overlay appears in the wrong position (typically top-left area) instead of being properly positioned relative to the select element.

### Root Cause
Mobile browsers handle native `<select>` elements in system overlays/pickers. When these selects are inside a modal with certain CSS properties (transform, overflow, flexbox centering), the browser's positioning calculation for the native picker breaks.

### Attempts Made
1. Removed `transform` animations from modal on mobile
2. Changed modal overflow from `hidden` to `visible`
3. Adjusted modal-overlay alignment from `center` to `flex-start`
4. Added `isolation: isolate` to create proper stacking context
5. Set form-group and select elements to `position: static`
6. Multiple combinations of positioning and overflow fixes

### Files Modified
- `css/components.css` (lines 347-369) - Modal mobile fixes
- `css/widgets.css` (lines 9070-9076, 9147-9159) - Form positioning and mobile layout

### Potential Solutions
1. **Custom Dropdown Component**: Replace native `<select>` with a custom dropdown built with divs/buttons that we have full control over positioning
2. **Disable Modal on Mobile**: Use a full-screen view instead of a modal for mobile devices
3. **Native Mobile UI**: Investigate if using `<select>` with different attributes or within a different container structure works better
4. **Third-party Library**: Consider using a mobile-friendly select library (e.g., Choices.js, Select2 mobile)

### Next Steps
- Research best practices for select dropdowns in modals on mobile
- Consider implementing a custom dropdown component for mobile only
- Test on actual iOS and Android devices (not just browser simulators)
