# Home Anchor - Project Documentation

> A family organization hub with personalized tabs for each family member

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Version 2.0 Changes](#version-20-changes)
3. [Color Scheme](#color-scheme)
4. [Tech Stack](#tech-stack)
5. [Project Structure](#project-structure)
6. [Data Schema](#data-schema)
7. [Feature Specifications](#feature-specifications)
8. [Widget System](#widget-system)
9. [Avatar System](#avatar-system)
10. [Schedule System](#schedule-system)
11. [Admin Pages](#admin-pages)
12. [Development Phases](#development-phases)
13. [Design Decisions](#design-decisions)

---

## Project Overview

**Home Anchor** is a web-based family organization application designed to help manage daily family life through personalized tabs for each family member.

### Primary Features (MVP)
- **Dynamic Family Members** - Add/remove family members with photos or initials
- **Widget-Based Dashboard** - Customizable widgets per member type
- **Point/Reward System** - Customizable chores and rewards for kids
- **Meal Planning** - Custom recipes, weekly meal planner, grocery list generation
- **Family Calendar** - Shared calendar with color-coded events per family member
- **Live Schedule Sidebar** - Real-time daily schedule display

### Secondary Features (Post-MVP)
- Workout routines tracking
- Toddler engagement activities
- Task lists per family member
- Data export/import for backup
- Browser notifications

### Key Requirements
- Web app (mobile version planned for future)
- Accessible from any device
- Local storage (no backend for MVP)
- Admin PIN protection for management features
- Three visual themes: Dashboard (adults), Playful (kids), Extra Bubbly (toddlers)
- Empty start - users add their own family members

---

## Version 2.0 Changes

### Major Architectural Changes

| Feature | v1.0 | v2.0 |
|---------|------|------|
| Initial State | Pre-populated with default members | Empty start, user adds members |
| Member Avatars | Icon-based | Photo upload with initials fallback |
| Tab Display | Icon + Name always | Photo only (if available) or Initials + Name |
| Content | Fixed layout | Widget-based, customizable per member |
| Schedule | Not implemented | Live sidebar with current/upcoming activities |
| Calendar Colors | Static predefined | Dynamic from member avatar colors |
| Themes | Basic kid theme | Enhanced kid + toddler themes with animations |

### New Files Added (v2.0)

```
js/
   utils/
      avatar.js              # NEW - Avatar utilities (initials, colors, compression)
   components/
      widget-renderer.js     # NEW - Dynamic widget rendering system
      schedule-sidebar.js    # NEW - Live schedule display component
   features/
      schedule.js            # NEW - Schedule CRUD operations

css/
   schedule.css              # NEW - Schedule sidebar and manager styles
```

### Updated Files (v2.0)

- `js/storage.js` - Complete rewrite with widget registry, schedules, avatar support
- `js/app.js` - Widget-based rendering, theme class application
- `js/components/tabs.js` - Avatar system, photo upload, member type selection
- `js/components/calendar.js` - Uses member avatar colors for events/legend
- `css/layout.css` - Family cards, member layout with sidebar, larger avatars
- `css/components.css` - Avatar, photo upload, widget card styles
- `css/theme-kid.css` - Enhanced bubbly styling, toddler theme

---

## Color Scheme

### Brand Colors
```css
--primary: #6366F1;        /* Indigo - main brand color */
--primary-light: #818CF8;  /* Light indigo */
--primary-dark: #4F46E5;   /* Dark indigo */
```

### Avatar Colors (Auto-assigned based on name hash)
```css
AVATAR_COLORS = [
    '#6366F1',  /* Indigo */
    '#8B5CF6',  /* Violet */
    '#EC4899',  /* Pink */
    '#EF4444',  /* Red */
    '#F97316',  /* Orange */
    '#F59E0B',  /* Amber */
    '#10B981',  /* Emerald */
    '#14B8A6',  /* Teal */
    '#06B6D4',  /* Cyan */
    '#3B82F6',  /* Blue */
    '#6D28D9',  /* Purple */
    '#DB2777'   /* Fuchsia */
]
```

### Adult Theme (Dashboard Style)
```css
--adult-bg: #F8FAFC;           /* Slate 50 - background */
--adult-surface: #FFFFFF;       /* White - cards */
--adult-border: #E2E8F0;        /* Slate 200 - borders */
--adult-text: #1E293B;          /* Slate 800 - primary text */
--adult-text-muted: #64748B;    /* Slate 500 - secondary text */
```

### Kid Theme (Playful Style)
```css
--kid-bg-start: #E0E7FF;        /* Indigo 100 - gradient start */
--kid-bg-end: #FCE7F3;          /* Pink 100 - gradient end */
--kid-primary: #8B5CF6;          /* Violet 500 - main */
--kid-secondary: #EC4899;        /* Pink 500 - accents */
--kid-success: #10B981;          /* Emerald 500 - positive actions */
--kid-warning: #F59E0B;          /* Amber 500 - points/stars */
--kid-text: #4C1D95;             /* Violet 900 - text */
```

### Toddler Theme (Extra Bubbly)
```css
--toddler-bg-start: #DBEAFE;    /* Blue 100 */
--toddler-bg-end: #FEF3C7;      /* Yellow 100 */
--toddler-primary: #3B82F6;      /* Blue 500 */
--toddler-secondary: #F59E0B;    /* Amber 500 */
--toddler-accent: #10B981;       /* Emerald 500 */
--toddler-text: #1E3A8A;         /* Blue 900 */
```

---

## Tech Stack

| Layer | Technology | Reasoning |
|-------|------------|-----------|
| Markup | HTML5 | Semantic, accessible |
| Styling | CSS3 + CSS Variables | Custom properties for theming |
| Logic | Vanilla JavaScript (ES6+) | No framework overhead, sufficient for scope |
| Storage | localStorage + JSON | Simple, no backend needed for MVP |
| Icons | Lucide Icons (CDN) | Clean, consistent, free |
| Fonts | Inter (adults), Nunito (kids) | Professional + playful |

---

## Project Structure

```
Home_Anchor/
   index.html                 # Single page application entry
   documentation.md           # This file

   css/
      base.css              # Reset, variables, typography
      layout.css            # Header, tabs, grid, family cards, member layout
      components.css        # Buttons, cards, forms, modals, avatars, widgets
      widgets.css           # Widget-specific styles (workout, timer, measurements)
      theme-adult.css       # Dashboard style (clean, minimal)
      theme-kid.css         # Playful style + toddler theme (colorful, animated)
      calendar.css          # Calendar-specific styles
      schedule.css          # Schedule sidebar and manager styles
      pages.css             # Settings page and Family Dashboard styles

   js/
      app.js                # Main app, content rendering, theme application
      storage.js            # localStorage CRUD, widget registry, schedules
      state.js              # Application state management

      components/
         tabs.js            # Tab navigation, avatar system, member CRUD
         modal.js           # Reusable modal component
         calendar.js        # Calendar rendering with member colors
         widget-renderer.js # Dynamic widget rendering system
         schedule-sidebar.js # Live schedule display

      features/
         # Adult widgets
         workout.js         # Workout tracking + body measurements + steps
         circuit-timer.js   # Circuit/interval timer widget
         meals.js           # Meal planning logic
         recipes.js         # Recipe management
         grocery.js         # Grocery list generation
         tasks.js           # Task list logic
         habits.js          # Habit tracker
         gratitude.js       # Daily gratitude journal
         journal.js         # Private daily journal
         vision-board.js    # Goals and dreams tracker
         routine.js         # Recurring reminders

         # Kid widgets
         points.js          # Point system logic
         rewards.js         # Reward redemption
         achievements.js    # Badges and milestones
         chores.js          # Chore management
         kid-tasks.js       # Kid-friendly task list
         kid-workout.js     # Move & Play activities
         kid-journal.js     # Kid journaling
         accomplishments.js # Extra achievements log
         screen-time.js     # Screen time tracker

         # Toddler widgets
         toddler-routine.js # Visual daily routine
         activities.js      # Activity suggestions
         daily-log.js       # Daily activity log
         toddler-tasks.js   # Visual task list
         milestones.js      # Developmental milestones

         # System
         schedule.js        # Schedule CRUD, admin management modal
         notifications.js   # Browser notifications

         # Admin Pages
         settings-page.js   # Full settings page with member/widget management
         family-dashboard.js # Family stats, activity feed, challenges

      utils/
         dates.js           # Date formatting helpers
         validation.js      # Input validation
         avatar.js          # Avatar utilities (initials, colors, compression)
```

---

## Data Schema

All data is stored in localStorage under the key `homeAnchor`.

### Version 2.0 Schema

```javascript
{
  "meta": {
    "version": "2.0.0",
    "createdAt": "2025-12-22",
    "lastModified": "2025-12-22"
  },

  "settings": {
    "adminPin": "1234",
    "theme": "light"
  },

  // Home tab only - members are separate
  "tabs": [
    {
      "id": "home",
      "name": "Home",
      "type": "home",
      "icon": "home",
      "removable": false
    }
  ],

  // Family members (dynamic, user-created)
  "members": [
    {
      "id": "member-1703123456789",
      "name": "Mohsina",
      "type": "adult",                    // 'adult' | 'kid' | 'toddler'
      "avatar": {
        "type": "photo",                  // 'photo' | 'initials'
        "photoUrl": "data:image/jpeg;base64,...",
        "initials": "MO",
        "color": "#6366F1"                // Auto-generated from name
      },
      "widgets": ["meal-plan", "task-list", "workout"],
      "createdAt": "2025-12-22"
    },
    {
      "id": "member-1703123456790",
      "name": "Shaaz",
      "type": "kid",
      "age": 8,
      "avatar": {
        "type": "initials",
        "photoUrl": null,
        "initials": "SH",
        "color": "#EC4899"
      },
      "widgets": ["points", "rewards", "achievements"],
      "createdAt": "2025-12-22"
    }
  ],

  // Widget data per member
  "widgetData": {
    "member-1703123456789": {
      "task-list": { "tasks": [] },
      "meal-plan": { "recipes": [], "weeklyPlan": {} },
      "workout": {
        "routines": [],
        "log": [],
        "weeklyGoal": 4,
        "stepsGoal": 10000,
        "stepsLog": { "2025-12-30": 8500 },
        "suggestionPrefs": { /* AI suggestion preferences */ },
        "weekSuggestions": { /* Generated weekly suggestions */ },
        "measurements": {
          "settings": {
            "unit": "metric",
            "enabledMetrics": ["weight", "waist", "chest"],
            "goals": {}
          },
          "log": []
        }
      },
      "circuit-timer": {
        "presets": [],
        "history": []
      }
    },
    "member-1703123456790": {
      "points": { "balance": 0, "activities": [], "rewards": [], "dailyLog": {} }
    }
  },

  // Schedules per member
  "schedules": {
    "member-1703123456789": {
      "default": [
        {
          "id": "sch-1",
          "start": "06:00",
          "end": "07:00",
          "title": "Morning Routine",
          "icon": "sun",
          "color": "#F59E0B"
        },
        {
          "id": "sch-2",
          "start": "09:00",
          "end": "17:00",
          "title": "Work",
          "icon": "briefcase",
          "color": "#6366F1"
        }
      ],
      "0": [],  // Sunday-specific (overrides default)
      "6": []   // Saturday-specific
    }
  },

  // Calendar events (shared)
  "calendar": {
    "events": [
      {
        "id": "evt-1",
        "title": "Soccer Practice",
        "date": "2025-12-22",
        "time": "16:00",
        "memberId": "member-1703123456790",
        "color": "#EC4899"  // Inherited from member avatar
      }
    ]
  },

  // Legacy point system data (for backwards compatibility)
  "pointSystem": {}
}
```

---

## Feature Specifications

### 1. Member Management

**Add Member Flow:**
1. Click "+" button in tab bar
2. Enter PIN for admin verification
3. Enter name, select type (Adult/Kid/Toddler)
4. Optionally upload photo (compressed to 256x256 JPEG)
5. Default widgets auto-selected based on type
6. Member created with unique ID and avatar

**Tab Display:**
- Photo members: Show 52px circular photo only (no name)
- Initials members: Show 40px colored circle + name
- Home tab: Always shows icon + "Home"

**Context Menu (Right-click member tab):**
- Edit Member (name, photo)
- Manage Widgets
- Edit Schedule
- Remove Member

### 2. Widget System

See [Widget System](#widget-system) section below.

### 3. Schedule System

See [Schedule System](#schedule-system) section below.

### 4. Point System (Kid Widget)

**For Kids:**
- View current point balance (prominently displayed)
- See list of available activities for today
- Check off completed activities (earn points)
- View available rewards with costs
- Redeem rewards (deducts from balance)

**For Admin:**
- Add/edit/delete activities (name, points, icon)
- Add/edit/delete rewards (name, cost, icon)
- Manually adjust points if needed

### 5. Family Calendar (Home Tab)

**Display:**
- Monthly calendar grid
- Events shown as colored pills
- Color matches member's avatar color
- Legend shows all members with their colors

**Events:**
- Add event with title, date, time, member
- Edit and delete events
- Navigate between months
- Click any day to add event

### 6. Meal Planning (Adult Widget)

**Recipes:**
- Add recipe with name, ingredients, instructions
- View all recipes
- Edit and delete recipes

**Weekly Planner:**
- 7-day grid with meal slots
- Assign recipes to slots

**Grocery List:**
- Generate from meal plan
- Checkable shopping list

---

## Widget System

### Widget Registry

Widgets are defined in `storage.js` under `WIDGET_REGISTRY`:

#### Adult Widgets
| Widget ID | Name | Description | Icon | Default |
|-----------|------|-------------|------|---------|
| `meal-plan` | Meal Plan | Weekly meal planning | utensils | Yes |
| `task-list` | Task List | Personal to-do list | check-square | Yes |
| `workout` | Workout | Exercise tracker with measurements | dumbbell | Yes |
| `gratitude` | Gratitude | Daily gratitude journal | heart | No |
| `habits` | Habits | Habit tracker | repeat | No |
| `recipes` | Recipes | Recipe collection | book-open | No |
| `grocery` | Grocery | Shopping list | shopping-cart | No |
| `routine` | Reminders | Recurring reminders and tasks | bell | No |
| `vision-board` | Vision Board | Track your goals and dreams | target | No |
| `journal` | Journal | Private daily journal with mood tracking | notebook-pen | No |
| `circuit-timer` | Circuit Timer | Interval workout timer | timer | No |

#### Kid Widgets
| Widget ID | Name | Description | Icon | Default |
|-----------|------|-------------|------|---------|
| `points` | Points | Earn points for activities | star | Yes |
| `rewards` | Rewards | Redeem points for rewards | gift | Yes |
| `achievements` | Achievements | Badges and milestones | award | Yes |
| `kid-tasks` | My Tasks | Fun task list for kids | check-square | No |
| `kid-workout` | Move & Play | Fun workout activities for kids | heart-pulse | No |
| `chores` | Chores | Chore picker/assigner | list-checks | No |
| `accomplishments` | Accomplishments | Extra achievements log | trophy | No |
| `screen-time` | Screen Time | Screen time tracker | tv | No |
| `vision-board` | Dreams | Track your dreams and goals | sparkles | No |
| `kid-journal` | My Journal | Write and reflect on your day | book-open | No |

#### Toddler Widgets
| Widget ID | Name | Description | Icon | Default |
|-----------|------|-------------|------|---------|
| `toddler-routine` | My Routine | Visual daily routine checklist | image | Yes |
| `activities` | Activities | Engagement activity ideas | blocks | Yes |
| `daily-log` | Daily Log | Track activities done today | calendar-check | Yes |
| `toddler-tasks` | My To-Dos | Simple visual task list | check-circle | No |
| `milestones` | Milestones | Developmental milestones | baby | No |

### Widget Rendering

The `WidgetRenderer` module in `widget-renderer.js`:
- Maps widget IDs to render functions
- Displays placeholder for unimplemented widgets
- Shows "Coming Soon" badge for stub widgets
- Renders widgets in a responsive grid (2 columns on desktop)

### Workout Widget (Adult)

The Workout widget (`js/features/workout.js`) provides comprehensive fitness tracking:

#### Core Features
- **Weekly Workout View**: 7-day calendar showing workout history
- **Routine Management**: Create, edit, and delete custom workout routines
- **Quick Log Actions**: 4-per-row grid of quick-action workout buttons
- **AI Workout Suggestions**: Personalized daily suggestions based on preferences
- **Steps Tracking**: Daily step count with goals and progress (works for past days too)
- **Workout History**: Full history with celebration animations on completion

#### Body Measurements Tracker
A comprehensive measurements logging system accessible via "Measurements" button:

**Available Metrics:**
| Metric | Unit (Metric) | Unit (Imperial) |
|--------|---------------|-----------------|
| Weight | kg | lbs |
| Waist | cm | in |
| Chest | cm | in |
| Hips | cm | in |
| Arms | cm | in |
| Thighs | cm | in |
| Body Fat | % | % |
| Neck | cm | in |

**Features:**
- **Latest Measurements Card**: Shows most recent values with change indicators (↑↓)
- **Mini Progress Chart**: SVG line chart with metric toggle buttons
- **Collapsible History**: Shows last 5 entries with "View All" link
- **Full History Modal**: Complete measurement history with ability to delete entries
- **Unit Toggle**: Switch between metric (kg/cm) and imperial (lbs/in)
- **Goal Setting**: Optional targets for each metric
- **Customizable Metrics**: Enable/disable which metrics to track

**Data Structure:**
```javascript
measurements: {
  settings: {
    unit: 'metric' | 'imperial',
    enabledMetrics: ['weight', 'waist', 'chest', ...],
    goals: { weight: 70, waist: 32, ... }
  },
  log: [
    {
      id: 'meas-123',
      date: '2025-01-15',
      values: { weight: 75, waist: 34, chest: 100, ... },
      createdAt: '...'
    }
  ]
}
```

### Circuit Timer Widget (Adult)

The Circuit Timer widget (`js/features/circuit-timer.js`) provides interval training timers:

#### Features
- **Preset Management**: Save up to multiple timer presets for quick access
- **Work/Rest Intervals**: Configurable work and rest durations
- **Rounds**: Set number of repetitions
- **Warmup/Cooldown**: Optional warmup and cooldown periods
- **Full-Screen Timer**: Large display with color-coded phases
- **Audio Cues**: 3-2-1 countdown beeps and block change sounds
- **Workout Integration**: Log completed timers as workouts

#### Timer Phases (Color-Coded)
- **Work**: Green background
- **Rest**: Blue background
- **Warmup**: Yellow background
- **Cooldown**: Yellow background

#### Default Presets
1. **Quick HIIT** - 30s work / 15s rest × 8 rounds (6 min)
2. **Tabata** - 20s work / 10s rest × 8 rounds (4 min)
3. **Endurance** - 60s work / 30s rest × 6 rounds (9 min)

**Data Structure:**
```javascript
// Widget data for 'circuit-timer'
{
  presets: [
    {
      id: 'timer-123',
      name: 'Quick HIIT',
      blocks: [
        { type: 'work', duration: 30 },
        { type: 'rest', duration: 15 }
      ],
      rounds: 8,
      warmup: 10,
      cooldown: 30,
      createdAt: '...'
    }
  ],
  history: [
    { id, presetId, presetName, completedAt, totalDuration }
  ]
}
```

#### Widget Cross-Navigation
- Circuit Timer has a "Workout" button to navigate to Workout widget
- Workout widget has a "Timer" link to navigate to Circuit Timer
- Navigation works whether widget is expanded or in focused view

### Vision Board Widget (Adult & Kid)

Track goals and dreams with visual goal cards (`js/features/vision-board.js`):

**Features:**
- Create goal cards with title, description, and target date
- Add images to goals via URL or upload
- Categorize goals (Career, Health, Finance, Personal, etc.)
- Track progress with percentage completion
- Mark goals as achieved with celebration
- Kid version uses "Dreams" branding with sparkles icon

### Journal Widget (Adult)

Private daily journaling with mood tracking (`js/features/journal.js`):

**Features:**
- Daily journal entries with rich text
- Mood tracking (Great, Good, Okay, Bad, Terrible)
- Writing prompts for inspiration
- Calendar view to navigate entries
- Entry search and filtering
- Private by default

### Kid Journal Widget

Age-appropriate journaling for kids (`js/features/kid-journal.js`):

**Features:**
- Simple daily entries with emoji mood picker
- Fun writing prompts designed for kids
- Sticker/emoji reactions
- Parent-friendly design

### Gratitude Widget (Adult)

Daily gratitude practice (`js/features/gratitude.js`):

**Features:**
- Log daily gratitude entries (3 things per day)
- View gratitude history by date
- Weekly and monthly summaries
- Streak tracking for consistency

### Habits Widget (Adult)

Habit tracking and building (`js/features/habits.js`):

**Features:**
- Create habits with frequency (daily, weekly, custom)
- Track completions on calendar view
- Streak tracking with visual indicators
- Habit categories and icons
- Statistics and completion rates

### Routine/Reminders Widget (Adult)

Recurring reminders and tasks (`js/features/routine.js`):

**Features:**
- Create recurring reminders (daily, weekly, monthly)
- Time-based notifications
- Quick complete actions
- Category organization

### Meal Plan Widget (Adult)

Weekly meal planning (`js/features/meals.js`):

**Features:**
- 7-day meal planning grid
- Breakfast, lunch, dinner, and snack slots
- Link to recipes from recipe widget
- Quick meal ideas suggestions
- Drag and drop meal organization

### Recipes Widget (Adult)

Recipe collection management (`js/features/recipes.js`):

**Features:**
- Add recipes with ingredients and instructions
- Categorize recipes (Breakfast, Lunch, Dinner, Dessert, etc.)
- Search and filter recipes
- Import recipes from URL
- Favorite recipes
- Integration with meal planner

### Grocery Widget (Adult)

Shopping list management (`js/features/grocery.js`):

**Features:**
- Create shopping lists
- Categorize items by store section
- Check off items while shopping
- Generate list from meal plan
- Save frequent items

### Task List Widget (Adult)

Personal to-do management (`js/features/tasks.js`):

**Features:**
- Add tasks with due dates and priorities
- Categorize tasks
- Mark tasks complete
- Filter by status (pending, completed, overdue)
- Task statistics

### Points Widget (Kid)

Points earning system (`js/features/points.js`):

**Features:**
- Display current point balance prominently
- List of available activities to earn points
- Check off completed activities
- Points history log
- Daily activity reset
- Animated point additions

### Rewards Widget (Kid)

Reward redemption system (`js/features/rewards.js`):

**Features:**
- Browse available rewards with costs
- Redeem rewards using points
- Reward history
- Admin management of reward catalog
- Celebration animations on redemption

### Achievements Widget (Kid)

Badges and milestones (`js/features/achievements.js`):

**Features:**
- Earn badges for accomplishments
- Progress tracking toward achievements
- Achievement categories
- Showcase earned badges
- Unlock animations

### Kid Tasks Widget

Fun task list for kids (`js/features/kid-tasks.js`):

**Features:**
- Age-appropriate task display
- Fun icons and colors
- Completion celebrations
- Simple interface

### Kid Workout Widget (Move & Play)

Fun workout activities for kids (`js/features/kid-workout.js`):

**Features:**
- Kid-friendly exercise activities
- Points integration for completed workouts
- Fun animations and celebrations
- Age-appropriate exercises
- Weekly activity goals

### Chores Widget (Kid)

Chore management and assignment (`js/features/chores.js`):

**Features:**
- Chore list with assignments
- Chore picker/randomizer
- Track chore completion
- Integration with points system
- Admin chore management

### Screen Time Widget (Kid)

Screen time tracking (`js/features/screen-time.js`):

**Features:**
- Set daily screen time limits
- Track time used
- Visual time remaining indicator
- Category tracking (games, videos, education)

### Accomplishments Widget (Kid)

Extra achievements log (`js/features/accomplishments.js`):

**Features:**
- Log special accomplishments
- Date-based entries
- Categories (School, Sports, Arts, etc.)
- Photo attachments

### Toddler Routine Widget

Visual daily routine for toddlers (`js/features/toddler-routine.js`):

**Features:**
- Large visual icons for routine steps
- Morning, afternoon, evening routines
- Drag to reorder
- Celebration on completion
- Simple tap-to-complete interface

### Activities Widget (Toddler)

Engagement activity ideas (`js/features/activities.js`):

**Features:**
- Curated activity suggestions
- Category filters (Art, Music, Movement, Learning)
- Age-appropriate activities
- Activity logging
- Custom activity creation

### Daily Log Widget (Toddler)

Track daily activities (`js/features/daily-log.js`):

**Features:**
- Log activities done today
- Visual activity cards
- Simple tap interface
- Daily summary view

### Toddler Tasks Widget

Simple visual task list (`js/features/toddler-tasks.js`):

**Features:**
- Large visual task cards
- Simple tap to complete
- Fun completion animations
- Parent-managed task list

### Milestones Widget (Toddler)

Developmental milestones tracking (`js/features/milestones.js`):

**Features:**
- Track developmental milestones
- Age-based milestone suggestions
- Photo documentation
- Date achieved logging

---

## Avatar System

### Overview

The `AvatarUtils` module in `avatar.js` handles:

1. **Initials Generation**: Extracts 1-2 characters from name
   - Single word: First 2 characters (e.g., "Mohsina" → "MO")
   - Multiple words: First letter of first and last word (e.g., "John Doe" → "JD")

2. **Color Assignment**: Consistent color per name using hash
   - Same name always gets same color
   - 12 vibrant colors in palette

3. **Image Compression**:
   - Resizes to 256x256
   - Center crops to square
   - Converts to JPEG at 85% quality
   - Returns base64 data URL

4. **Contrast Detection**: Determines white/black text for readability

### Avatar Object Structure

```javascript
{
  type: 'photo' | 'initials',
  photoUrl: 'data:image/jpeg;base64,...' | null,
  initials: 'MO',
  color: '#6366F1'
}
```

---

## Schedule System

### Overview

Each member can have a daily schedule displayed in the sidebar:

1. **Current Activity**: Highlighted card showing what's happening now
2. **Progress Bar**: Visual indicator of time elapsed in current activity
3. **Upcoming Activities**: List of what's coming next

### Schedule Data Structure

```javascript
{
  "default": [  // Applies to all days unless overridden
    { "id": "sch-1", "start": "06:00", "end": "07:00", "title": "Wake Up", "icon": "sun", "color": "#F59E0B" }
  ],
  "0": [],  // Sunday specific
  "1": [],  // Monday specific
  // ... etc
}
```

### Live Updates

- Updates every 60 seconds automatically
- Shows current time in sidebar header
- Calculates progress percentage for current activity

### Admin Management

Right-click member tab → "Edit Schedule":
- Day selector tabs (Default, Mon, Tue, etc.)
- Add/edit/delete time blocks
- Icon picker (24 options)
- Color picker (12 options)
- Time range selection

---

## Admin Pages

The application includes two dedicated admin pages accessible from the header (PIN protected):

### Settings Page (`js/features/settings-page.js`)

Full-page settings management with comprehensive configuration options:

#### Family Members Section
- View all family members in a card grid
- Add new members with name, type selection (Adult/Kid/Toddler), and optional photo
- Edit existing members (name, avatar color, age for kids)
- Delete members with confirmation dialog

#### Widget Management Section
- Tab-based interface to switch between family members
- Toggle widgets on/off for each member
- Visual toggle switches with widget descriptions
- Changes take effect immediately

#### Appearance Section
- **Theme Color Picker**: 10 color options (Indigo, Violet, Pink, Rose, Orange, Amber, Emerald, Teal, Cyan, Blue)
- **Display Mode**: Light, Dark, or Auto (follows system preference)

#### Security Section
- Change admin PIN with verification
- Requires current PIN, new PIN, and confirmation
- PIN must be exactly 4 digits

#### Notifications Section
- Enable/disable browser notifications
- Sound settings
- Integrated with the Notifications module

#### Data Management Section
- **Export Data**: Download complete backup as JSON file
- **Import Data**: Restore from previously exported backup
- **Reset All Data**: Complete data wipe with confirmation dialog
- Shows last modified timestamp

### Family Dashboard (`js/features/family-dashboard.js`)

Admin page with statistics, activity insights, and family management tools:

#### Stats Overview
Quick stats cards showing:
- Total family members (breakdown by type)
- Tasks completed today (across all members)
- Total points (kids' combined balance)
- Events scheduled today

#### Member Statistics
- Individual stats cards for each family member
- Click to navigate to member's tab
- Stats vary by member type:
  - **Adults**: Tasks today, habits count, workouts this week
  - **Kids**: Points balance, tasks today, rewards redeemed
  - **Toddlers**: Activities logged today, milestones achieved

#### Today's Schedule
- Combined view of all family members' schedules
- Color-coded by member
- Current activity highlighted with "Now" badge
- Time display in 12-hour format

#### Recent Activity Feed
- Last 10 activities across all family members
- Activity types: task completions, points earned, rewards redeemed, workouts
- Relative time display (Today, Yesterday, date)

#### Upcoming Events
- Next 5 calendar events from today onwards
- Date badge with day and month
- Member assignment shown

#### Family Challenges
- Create shared family goals/challenges
- Progress tracking with visual progress bar
- Target goals with current progress
- Optional end dates
- 8 icon choices for challenge themes
- Delete challenges when complete

#### Quick Actions
- Add Member (opens add member modal)
- Add Event (opens calendar event modal)
- Settings (navigates to Settings page)
- Export Data (quick backup download)

### Navigation

Both pages are accessible via header buttons:
- **Dashboard icon** (layout-dashboard): Opens Family Dashboard
- **Settings icon** (settings/gear): Opens Settings Page

Both require PIN verification before access. Each page has a "Back to Home" button to return to the main view.

### CSS Styles

Styles for admin pages are in `css/pages.css`:
- Settings page layout and sections
- Member cards and widget toggles
- Theme color picker and display mode buttons
- Dashboard stats grid and cards
- Activity feed and schedule list
- Challenge cards with progress bars
- Responsive design for mobile devices

---

## Development Phases

### Phase 1: Foundation (Complete)
- [x] Project documentation
- [x] Create folder structure
- [x] Base HTML layout
- [x] CSS foundation and themes
- [x] Storage utility (v2.0 with widget registry)
- [x] Tab navigation with avatar system
- [x] Modal component
- [x] Widget renderer
- [x] Schedule sidebar
- [x] Family dashboard
- [x] Calendar with member colors

### Phase 2: Widget Implementation

**Adult Widgets:**
- [x] Workout widget (with body measurements, steps, AI suggestions)
- [x] Circuit Timer widget
- [x] Meal Plan widget
- [x] Recipes widget
- [x] Grocery widget
- [x] Task List widget
- [x] Habits widget
- [x] Gratitude widget
- [x] Journal widget
- [x] Vision Board widget
- [x] Routine/Reminders widget

**Kid Widgets:**
- [x] Points widget
- [x] Rewards widget
- [x] Achievements widget
- [x] Chores widget
- [x] Kid Tasks widget
- [x] Kid Workout (Move & Play) widget
- [x] Kid Journal widget
- [x] Kid Vision Board (Dreams) widget
- [x] Screen Time widget
- [x] Accomplishments widget

**Toddler Widgets:**
- [x] Toddler Routine widget
- [x] Activities widget
- [x] Daily Log widget
- [x] Toddler Tasks widget
- [x] Milestones widget

### Phase 3: Polish
- [x] Kid theme (bubbly styling)
- [x] Toddler theme (extra bubbly)
- [ ] Save indicator
- [ ] Browser notifications
- [ ] Collapsible mobile sidebar
- [ ] Responsive design pass

### Phase 4: Advanced Features
- [ ] Data export/import
- [ ] Recurring calendar events
- [ ] Today's Highlights on home
- [ ] Achievements/badges

---

## Design Decisions

| Decision | Choice | Reasoning |
|----------|--------|-----------|
| Single Page App | Yes | Better UX, no page reloads |
| Framework | None (Vanilla JS) | Simpler, sufficient for scope |
| CSS Methodology | BEM-lite | Organized without being overly strict |
| Storage | localStorage | No backend complexity, data persists |
| Admin Auth | PIN code | Simple, effective for family use |
| Member Types | adult/kid/toddler | Different UI needs and widgets per type |
| Avatar System | Photo + Initials fallback | Like Google/Slack, works without photo |
| Widget Architecture | Registry + Renderer | Easy to add new widgets |
| Schedule Display | Sidebar | Always visible, real-time updates |
| Calendar Colors | From avatar | Consistent member identification |

---

## Theme Styling

### Adult Theme
- Clean, minimal design
- White cards with subtle shadows
- Professional typography (Inter font)
- Subtle hover effects

### Kid Theme
- Purple/pink gradient background
- Rounded corners (2xl)
- Dashed borders
- Colorful icons
- Playful font (Nunito)
- Bounce animations

### Toddler Theme
- Multi-color gradient (blue/yellow/pink)
- Extra large rounded corners (24px)
- Thick colorful borders
- Decorative dots on cards
- Dotted/playful borders
- Wiggle animations on hover
- Extra large touch targets
- Super friendly visual style

---

## Future Considerations

- **Mobile App**: Convert to PWA or React Native
- **Cloud Sync**: Add backend for multi-device sync
- **Notifications**: Browser notifications for events/reminders
- **Dark Mode**: System-wide dark theme option
- **Gamification**: Badges, streaks, achievements for kids
- **Voice Control**: Hands-free activity logging
- **AI based custom widegts**: User can add custom widegts.
---

*Last Updated: December 31, 2025*
