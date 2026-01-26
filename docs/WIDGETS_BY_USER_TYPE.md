# Widgets by User Type

This document lists all widgets organized by user type (Adults, Kids, Teens, Toddlers), including their full page view tabs where applicable.

**Legend:**
- ⭐ = Widget has tabbed full page view
- 📅 = History/Calendar view type (Calendar Grid vs Date-Grouped List)
- 🔒 = Requires PIN verification to access

---

## Adult Widgets (10 total)

### 1. Journal ⭐ 🔒
- **File**: [js/features/journal.js](../js/features/journal.js)
- **Full Page Tabs**: ✅ **3 tabs**
  1. **Write** - Write/edit today's entry
  2. **History** - Past entries 📅 *Calendar grid view*
  3. **Stats** - Streaks, mood distribution, monthly progress
- **Features**: PIN protected, mood tracking, daily prompts

### 2. Gratitude ⭐
- **File**: [js/features/gratitude.js](../js/features/gratitude.js)
- **Full Page Tabs**: ✅ **3 tabs**
  1. **Write** - Write/edit today's gratitude items
  2. **Week** - Weekly view (7 day cards)
  3. **Stats** - Streaks, weekly goals, monthly progress
- **Features**: Gratitude entries, shares data with Journal widget

### 3. Habits ⭐
- **File**: [js/features/habits.js](../js/features/habits.js)
- **Full Page Tabs**: ✅ **3 tabs**
  1. **Calendar** - Monthly habit tracker 📅 *Calendar grid view*
  2. **Stats** - Monthly statistics, completion rates
  3. **Archived** - Archived habits (conditional, only if archived habits exist)
- **Features**: Daily habit tracker with streaks, scheduling, categories, monthly stats

### 4. Workout ⭐
- **File**: [js/features/workout.js](../js/features/workout.js)
- **Full Page Tabs**: ✅ **3 tabs**
  1. **History** - Weekly workout log
  2. **Calendar** - Workout frequency heatmap 📅 *Calendar heatmap*
  3. **Body** - Body measurements tracking
- **Features**: Workout tracking with sets, reps, weekly history

### 5. Routine ⭐
- **File**: [js/features/routine.js](../js/features/routine.js)
- **Full Page Tabs**: ✅ **4 tabs**
  1. **Due** - Routines due today/soon
  2. **All** - All routines
  3. **History** - Completion history 📅 *Date-grouped list*
  4. **Stats** - Statistics
- **Features**: Flexible routine tracker with customizable frequencies, time-of-day, categories

### 6. Vision Board ⭐
- **File**: [js/features/vision-board.js](../js/features/vision-board.js)
- **Full Page Tabs**: ✅ **4 tabs**
  1. **Board** - Vision board display with goal cards
  2. **Goals** - Goal management/list
  3. **Completed** - Completed goals archive
  4. **Stats** - Goal statistics
- **Features**: Goal tracking with image support and progress indicators

### 7. Recipes ⭐
- **File**: [js/features/recipes.js](../js/features/recipes.js)
- **Full Page Tabs**: ✅ **4 tabs**
  1. **All** - All recipes with search and filter
  2. **Favorites** - Favorite recipes only
  3. **Categories** - Recipes organized by tags/categories
  4. **Add** - Add new recipes (manual or bulk import)
- **Features**: Full recipe manager with ingredients, instructions, tags, prep time

### 8. Grocery ⭐
- **File**: [js/features/grocery.js](../js/features/grocery.js)
- **Full Page Tabs**: ✅ **4 tabs**
  1. **List** - Shopping list items
  2. **Stores** - Store management and item prices
  3. **Pantry** - Pantry inventory
  4. **Stats** - Spending and category statistics
- **Features**: Shopping list with smart suggestions, pantry tracking, unit conversion

### 9. Meals ⭐
- **File**: [js/features/meals.js](../js/features/meals.js)
- **Full Page Tabs**: ✅ **3 tabs**
  1. **Week** - Weekly meal planner
  2. **Stats** - Meal statistics and analysis
  3. **Prep** - Meal prep instructions and planning
- **Features**: Weekly meal planner with multi-item support

### 10. Circuit Timer
- **File**: [js/features/circuit-timer.js](../js/features/circuit-timer.js)
- **Full Page Tabs**: None (fullscreen timer interface, not tabbed)
- **Features**: Interval workout timer with saved presets

---

## Kid & Teen Widgets (9 total)

### 1. Kid Tasks ⭐
- **File**: [js/features/kid-tasks.js](../js/features/kid-tasks.js)
- **User Type**: Kids (age-adaptive styling)
- **Full Page Tabs**: ✅ **3 tabs**
  1. **Tasks** - Task list view
  2. **History** - Completion history 📅 *Date-grouped list (last 14 days)*
  3. **Stats** - Statistics and streaks
- **Features**: Fun, colorful task list with age-adaptive features

### 2. Kid Journal ⭐ 🔒
- **File**: [js/features/kid-journal.js](../js/features/kid-journal.js)
- **User Type**: Kids & Teens
- **Full Page Tabs**: ✅ **3 tabs**
  1. **Write** - Journal entry
  2. **History** - Past entries 📅 *Date-grouped list*
  3. **Stats** - Writing statistics
- **Features**: Journal with mood tracking, sticker support, password option for teens

### 3. Points ⭐
- **File**: [js/features/points.js](../js/features/points.js)
- **User Type**: Kids & Teens
- **Full Page Tabs**: ✅ **3 tabs**
  1. **History** - Points history 📅 *Date-grouped list (last 14 days)*
  2. **Calendar** - Calendar view 📅 *Calendar grid with activity intensity*
  3. **Leaderboard** - Family leaderboard
- **Features**: Level system (Beginner→Ultimate for kids, Novice→Legendary for teens)

### 4. Rewards ⭐
- **File**: [js/features/rewards.js](../js/features/rewards.js)
- **User Type**: Kids
- **Full Page Tabs**: ✅ **3 tabs**
  1. **Rewards** - Available rewards
  2. **Wishlist** - Saving for items
  3. **History** - Redemption history 📅 *Date-grouped timeline*
- **Features**: Reward redemption system with wishlist

### 5. Chores ⭐
- **File**: [js/features/chores.js](../js/features/chores.js)
- **User Type**: Kids
- **Full Page Tabs**: ✅ **3 tabs**
  1. **Today** - Today's chores
  2. **History** - Completion history 📅 *Date-grouped list (last 14 days)*
  3. **Pool** - Chore pool management
- **Features**: Random daily chore picker from pool

### 6. Screen Time ⭐
- **File**: [js/features/screen-time.js](../js/features/screen-time.js)
- **User Type**: Kids
- **Full Page Tabs**: ✅ **3 tabs**
  1. **Today** - Today's usage
  2. **History** - Historical data 📅 *Date-grouped card list (last 14 days)*
  3. **Stats** - Usage statistics
- **Features**: Screen time tracking with weekday/weekend limits, timer, points integration

### 7. Kid Workout ⭐
- **File**: [js/features/kid-workout.js](../js/features/kid-workout.js)
- **User Type**: Kids
- **Full Page Tabs**: ✅ **3 tabs**
  1. **Calendar** - Calendar view 📅 *Calendar grid with activity dots*
  2. **History** - Activity history 📅 *Date-grouped list*
  3. **Stats** - Activity statistics
- **Features**: Kid-friendly workout widget with preset activities

### 8. Achievements
- **File**: [js/features/achievements.js](../js/features/achievements.js)
- **User Type**: Kids
- **Full Page Tabs**: None (badge display widget only)
- **Features**: Badge system with age-adaptive content

### 9. Accomplishments
- **File**: [js/features/accomplishments.js](../js/features/accomplishments.js)
- **User Type**: Kids
- **Full Page Tabs**: None (achievement log widget only)
- **Features**: Extra achievements log with categories

---

## Toddler Widgets (7 total)

### 1. Toddler Tasks
- **File**: [js/features/toddler-tasks.js](../js/features/toddler-tasks.js)
- **Full Page Tabs**: None (simple task list)
- **Features**: Simple, visual task list with big checkboxes, toddler-friendly theme

### 2. Toddler Routine
- **File**: [js/features/toddler-routine.js](../js/features/toddler-routine.js)
- **Full Page Tabs**: None (visual checklist)
- **Features**: Visual routine checklist with SVG illustrations

### 3. Daily Log
- **File**: [js/features/daily-log.js](../js/features/daily-log.js)
- **Full Page Tabs**: None (daily tracking)
- **Features**: Tracks meals, naps, diaper changes, mood, activities, potty training

### 4. Activities
- **File**: [js/features/activities.js](../js/features/activities.js)
- **Full Page Tabs**: None (activity suggestions)
- **Features**: Toddler engagement activity suggestions with history

### 5. Milestones
- **File**: [js/features/milestones.js](../js/features/milestones.js)
- **Full Page Tabs**: None (milestone tracking)
- **Features**: Developmental milestones tracker (physical, language, cognitive, social)

### 6. Growth Chart
- **File**: [js/features/growth-chart.js](../js/features/growth-chart.js)
- **Full Page Tabs**: None (measurement tracking)
- **Features**: Height, weight, and custom measurements over time

### 7. Caregiver Handoff
- **File**: [js/features/caregiver-handoff.js](../js/features/caregiver-handoff.js)
- **Full Page Tabs**: None (daily summaries)
- **Features**: Quick daily summaries for caregiver transitions

---

## Family & System Widgets (6 total)

### 1. Schedule
- **File**: [js/features/schedule.js](../js/features/schedule.js)
- **User Type**: All family members
- **Full Page Tabs**: None (timeline view)
- **Features**: Google Calendar-style timeline view with 30-minute slots

### 2. Family Dashboard
- **File**: [js/features/family-dashboard.js](../js/features/family-dashboard.js)
- **User Type**: Admin/Family
- **Full Page Tabs**: None (admin page)
- **Features**: Admin page with stats, activity feed, calendar overview

### 3. Settings
- **File**: [js/features/settings-page.js](../js/features/settings-page.js)
- **User Type**: Admin
- **Full Page Tabs**: None (settings management)
- **Features**: Full settings page with family, appearance, features, security

### 4. Notifications
- **File**: [js/features/notifications.js](../js/features/notifications.js)
- **User Type**: Admin/Family
- **Full Page Tabs**: None (notification system)
- **Features**: Browser notifications for schedule activities

### 5. Voice Assistant
- **File**: [js/features/voice-assistant.js](../js/features/voice-assistant.js)
- **User Type**: All
- **Full Page Tabs**: None (voice commands)
- **Features**: Web Speech API voice command functionality

---

## Summary Statistics

### Widgets by User Type
- **Adult**: 10 widgets
- **Kid/Teen**: 9 widgets
- **Toddler**: 7 widgets
- **Family/System**: 6 widgets
- **Total**: 32 widgets

### Widgets with Tabbed Full Page Views: 16 total

**Adult Widgets (9):**
1. Journal (3 tabs)
2. Gratitude (3 tabs)
3. Habits (3 tabs)
4. Workout (3 tabs)
5. Routine (4 tabs)
6. Vision Board (4 tabs)
7. Recipes (4 tabs)
8. Grocery (4 tabs)
9. Meals (3 tabs)

**Kid/Teen Widgets (7):**
1. Kid Tasks (3 tabs)
2. Kid Journal (3 tabs)
3. Points (3 tabs)
4. Rewards (3 tabs)
5. Chores (3 tabs)
6. Screen Time (3 tabs)
7. Kid Workout (3 tabs)

### History/Calendar View Types

**Calendar Grid Views:**
- Journal History tab
- Habits Calendar tab
- Workout Calendar tab
- Points Calendar tab
- Kid Workout Calendar tab

**Date-Grouped List Views:**
- Routine History tab
- Kid Tasks History tab
- Kid Journal History tab
- Points History tab
- Rewards History tab
- Chores History tab
- Screen Time History tab
- Kid Workout History tab

**Note:** Points and Kid Workout have BOTH calendar and list views in separate tabs.

---

## Complete Widget Reference Table

| Widget Name | User Type | Full Page Tabs | History/Calendar View | Key Features |
|-------------|-----------|----------------|----------------------|--------------|
| **ADULT WIDGETS** |
| Journal 🔒 | Adult | Write, History 📅, Stats | Calendar Grid | PIN protected, mood tracking, daily prompts |
| Gratitude | Adult | Write, Week, Stats | Weekly Cards | Shares data with Journal, gratitude entries |
| Habits | Adult | Calendar 📅, Stats, Archived | Calendar Grid | Streaks, scheduling, categories, monthly stats |
| Workout | Adult | History, Calendar 📅, Body | Calendar Heatmap | Sets, reps, weekly history, body measurements |
| Routine | Adult | Due, All, History 📅, Stats | Date-Grouped List | Customizable frequencies, time-of-day, categories |
| Vision Board | Adult | Board, Goals, Completed, Stats | - | Goal tracking with images, progress indicators |
| Recipes | Adult | All, Favorites, Categories, Add | - | Ingredients, instructions, tags, prep time |
| Grocery | Adult | List, Stores, Pantry, Stats | - | Smart suggestions, pantry tracking, unit conversion |
| Meals | Adult | Week, Stats, Prep | - | Weekly meal planner, multi-item support |
| Circuit Timer | Adult | None | - | Interval workout timer, saved presets |
| **KID/TEEN WIDGETS** |
| Kid Tasks | Kid | Tasks, History 📅, Stats | Date-Grouped List | Age-adaptive styling, fun colors, streaks |
| Kid Journal 🔒 | Kid/Teen | Write, History 📅, Stats | Date-Grouped List | Mood tracking, stickers, password for teens |
| Points | Kid/Teen | History 📅, Calendar 📅, Leaderboard | Both Grid & List | Level system, ranks, family leaderboard |
| Rewards | Kid | Rewards, Wishlist, History 📅 | Date-Grouped Timeline | Reward redemption, wishlist, points integration |
| Chores | Kid | Today, History 📅, Pool | Date-Grouped List | Random daily picker, chore pool management |
| Screen Time | Kid | Today, History 📅, Stats | Date-Grouped Cards | Timer, weekday/weekend limits, points penalties |
| Kid Workout | Kid | Calendar 📅, History 📅, Stats | Both Grid & List | Preset activities, activity tracking |
| Achievements | Kid | None | - | Badge system, age-adaptive content |
| Accomplishments | Kid | None | - | Achievement log, categories |
| **TODDLER WIDGETS** |
| Toddler Tasks | Toddler | None | - | Big checkboxes, simple visual design |
| Toddler Routine | Toddler | None | - | SVG illustrations, visual checklist |
| Daily Log | Toddler | None | - | Meals, naps, diapers, mood, potty training |
| Activities | Toddler | None | - | Activity suggestions with history |
| Milestones | Toddler | None | - | Developmental tracking (physical, language, cognitive, social) |
| Growth Chart | Toddler | None | - | Height, weight, custom measurements |
| Caregiver Handoff | Toddler | None | - | Daily summaries for caregiver transitions |
| **FAMILY/SYSTEM WIDGETS** |
| Schedule | Family | None | - | Google Calendar-style timeline, 30-min slots |
| Family Dashboard | Admin | None | - | Stats, activity feed, calendar overview |
| Settings | Admin | None | - | Family, appearance, features, security |
| Notifications | Admin | None | - | Browser notifications for activities |
| Voice Assistant | All | None | - | Web Speech API voice commands |

### Table Legend
- 🔒 = PIN/Password protected
- 📅 = Has calendar or history view
- **Date-Grouped List** = Shows entries grouped by date (last 7-14 days)
- **Calendar Grid** = Monthly calendar with date cells
- **Calendar Heatmap** = Visual frequency/intensity map
- **Both Grid & List** = Has separate tabs for both views

---

*Last Updated: 2026-01-25*
