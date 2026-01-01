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
