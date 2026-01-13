# Home Anchor - Widget Test Cases

> **Last Updated:** 2026-01-10
> **Testing Order:** Adults → Teens → Kids → Toddlers
> **Status Legend:** ✅ Pass | ❌ Fail | ⏳ Untested | ⚠️ Partial

---

## Table of Contents
- [Adult Widgets](#adult-widgets)
  - [1. Meal Plan](#1-meal-plan)
  - [2. Task List](#2-task-list)
  - [3. Workout](#3-workout)
  - [4. Gratitude](#4-gratitude)
  - [5. Habits](#5-habits)
  - [6. Recipes](#6-recipes)
  - [7. Grocery](#7-grocery)
  - [8. Routine](#8-routine)
  - [9. Vision Board](#9-vision-board)
  - [10. Journal](#10-journal)
  - [11. Circuit Timer](#11-circuit-timer)
- [Teen Widgets](#teen-widgets)
- [Kid Widgets](#kid-widgets)
- [Toddler Widgets](#toddler-widgets)
- [Test Summary](#test-summary)
- [Known Issues](#known-issues)
- [Test Execution Log](#test-execution-log)

---

## Adult Widgets

### 1. Meal Plan

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 1.1 | Widget renders correctly in dashboard | ✅ | |
| 1.2 | Displays current week's meal plan | ✅ | |
| 1.3 | Can navigate to previous week | ✅ | Desktop & Mobile |
| 1.4 | Can navigate to next week | ✅ | Desktop & Mobile (BUG-001 fixed) |
| 1.5 | Can add meal to specific day/slot | ✅ | Full-page & Widget (BUG-002 fixed) |
| 1.6 | Meal types displayed as rows (Breakfast/Lunch/Snacks/Dinner) | ✅ | Click row to add meal - works as designed |
| 1.7 | Can edit existing meal | ✅ | Full-page & Widget (BUG-002 fixed) |
| 1.8 | Can delete meal | ✅ | Desktop & Mobile |
| 1.9 | Can copy meal to another day | ✅ | Desktop & Mobile |
| 1.10 | Full-page view opens correctly | ✅ | Desktop & Mobile |
| 1.11 | Full-page shows complete week view | ✅ | Desktop & Mobile |
| 1.12 | Can generate grocery list from meals | ✅ | Desktop & Mobile (BUG-004 fixed) |
| 1.13 | Refresh button works | ✅ | Desktop & Mobile |
| 1.14 | Data persists after page refresh | ✅ | Desktop & Mobile |
| 1.15 | Hide widget works (PIN required) | ✅ | Desktop & Mobile |
| 1.16 | Can re-add widget after hiding | ✅ | Desktop & Mobile |
| 1.17 | Adding meal from widget reflects in full-page plan | ✅ | Desktop & Mobile |
| 1.18 | Updating meal from widget reflects in full-page plan | ✅ | Desktop & Mobile |
| 1.19 | Adding meal from full-page reflects in widget | ✅ | Desktop & Mobile |
| 1.20 | Updating meal from full-page reflects in widget | ✅ | Desktop & Mobile |
| 1.21 | Adding kids meal via "Customize for Kids" button | ✅ | Desktop & Mobile |
| 1.22 | Editing existing kids meal via "Kids:" button | ✅ | Desktop & Mobile |
| 1.23 | Kids meals display correctly in full-page plan | ✅ | Desktop & Mobile |

---

### 2. Task List

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 2.1 | Widget renders correctly in dashboard | ✅ | Desktop & Mobile |
| 2.2 | Displays task list | ✅ | Desktop & Mobile |
| 2.3 | Can add new task (inline) | ✅ | Desktop & Mobile |
| 2.4 | Can add task via modal | ✅ | Desktop & Mobile |
| 2.5 | Can mark task as complete (checkbox) | ✅ | Desktop & Mobile |
| 2.6 | Completed tasks show strikethrough | ✅ | Desktop & Mobile - shown in Completed section |
| 2.7 | Can edit task text inline | ✅ | Desktop & Mobile |
| 2.8 | Can delete task | ✅ | Desktop & Mobile |
| 2.9 | Can set task priority (low/medium/high) | ✅ | Desktop & Mobile - via Add Task modal only (not editable after) |
| 2.10 | Can set due date | ✅ | Desktop & Mobile - optional field in modal |
| 2.11 | Overdue tasks show indicator | ⏳ | Not tested - requires time-based scenario |
| 2.12 | Can reorder tasks via drag-drop | ✅ | Desktop & Mobile - drag handles visible |
| 2.13 | Can clear all completed tasks | ✅ | Desktop & Mobile - Clear All button in full-page |
| 2.14 | Shows "+X more" when >10 tasks | ✅ | Desktop & Mobile - shows "+2 more tasks" button |
| 2.15 | Full-page view opens correctly | ✅ | Desktop & Mobile |
| 2.16 | Full-page shows To Do / Completed sections | ✅ | Desktop & Mobile |
| 2.17 | Task statistics display correctly | ✅ | Desktop & Mobile - Pending/Completed/Total |
| 2.18 | Refresh button works | ✅ | Desktop & Mobile |
| 2.19 | Data persists after page refresh | ✅ | Desktop & Mobile |
| 2.20 | Hide widget works (PIN required) | ✅ | Desktop & Mobile |

---

### 3. Workout

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 3.1 | Widget renders correctly in dashboard | ✅ | Desktop & Mobile |
| 3.2 | Displays workout tracker | ✅ | Desktop & Mobile - streak, weekly goal, day indicators |
| 3.3 | Can quick log workout | ✅ | Desktop & Mobile - celebration animation shows |
| 3.4 | Can select workout/exercise type | ✅ | Desktop & Mobile - 6 preset routines |
| 3.5 | Can set reps and sets | ⏳ | Not applicable - uses preset routines with durations |
| 3.6 | Can set duration | ✅ | Desktop & Mobile - each routine has preset duration |
| 3.7 | Can set weight | ⏳ | Not applicable - focused on cardio/activity tracking |
| 3.8 | Can add notes to workout | ⏳ | Feature not available in current UI |
| 3.9 | Can edit workout entry | ⏳ | Not directly - can delete and re-add |
| 3.10 | Can delete workout entry | ✅ | Desktop & Mobile - Remove button on logged workouts |
| 3.11 | Exercise templates display correctly | ✅ | Desktop & Mobile - 6 preset routines with icons |
| 3.12 | Can create custom exercise | ✅ | Desktop & Mobile - via Routines modal |
| 3.13 | Workout history displays correctly | ✅ | Desktop & Mobile - History tab shows day cards |
| 3.14 | Weekly/monthly stats display | ✅ | Desktop & Mobile - streak, goal, time, total workouts |
| 3.15 | Full-page view opens correctly | ✅ | Desktop & Mobile |
| 3.16 | Full-page shows detailed history | ✅ | Desktop & Mobile - week view with day cards |
| 3.17 | Muscle group breakdown displays | ⏳ | Not available in current UI |
| 3.18 | Refresh button works | ✅ | Desktop & Mobile |
| 3.19 | Data persists after page refresh | ✅ | Desktop & Mobile |
| 3.20 | Hide widget works (PIN required) | ⏳ | Not tested |
| 3.21 | Measurements modal opens correctly | ✅ | Desktop & Mobile |
| 3.22 | Can log body measurements (weight, etc.) | ✅ | Desktop & Mobile - weight, waist, chest |
| 3.23 | Can toggle metric/imperial units | ✅ | Desktop & Mobile - conversion works correctly |
| 3.24 | Measurements show trend indicators | ⏳ | Requires multiple entries to test |
| 3.25 | Can set measurement goals | ⏳ | Not tested |
| 3.26 | Can customize enabled metrics | ✅ | Desktop & Mobile - Customize button available |
| 3.27 | Can delete measurement entry | ✅ | Desktop & Mobile - delete button in history |
| 3.28 | View Full History button navigates to Body tab | ✅ | Desktop & Mobile |
| 3.29 | Body tab displays measurements history | ✅ | Desktop & Mobile - current values + history |
| 3.30 | Calendar tab shows heatmap view | ✅ | Desktop & Mobile - GitHub-style activity heatmap |
| 3.31 | Can add workout for past days | ✅ | Desktop & Mobile - Add button on past day cards |
| 3.32 | Steps tracking works | ✅ | Desktop & Mobile - input with goal display |
| 3.33 | Timer feature works | ✅ | Desktop & Mobile - shows message to add Circuit Timer widget |
| 3.34 | Routines management works | ✅ | Desktop & Mobile - can add/delete routines |
| 3.35 | Suggest Workout Plan button works | ✅ | Desktop & Mobile - opens wizard modal |
| 3.36 | Can set fitness goal, days, rest days, time | ✅ | Desktop & Mobile - 4-step wizard |
| 3.37 | Generated plan preview shows | ✅ | Desktop & Mobile - review step shows schedule |
| 3.38 | Can apply suggested plan to schedule | ✅ | Desktop & Mobile - plan saved, shows on day cards |

---

### 4. Gratitude

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 4.1 | Widget renders correctly in dashboard | ✅ | Desktop & Mobile - Shows streak, done indicator, entries |
| 4.2 | Displays gratitude journal | ✅ | Desktop & Mobile - Today's gratitude section with entries |
| 4.3 | Can add gratitude entry (3 items) | ✅ | Desktop & Mobile - 3 text fields in modal |
| 4.4 | Shows today's entries | ✅ | Desktop & Mobile - Heart icons with entries listed |
| 4.5 | Can edit today's entry | ✅ | Desktop & Mobile - Edit button opens modal with existing entries |
| 4.6 | Can view past entries | ✅ | Desktop & Mobile - Weekly view shows all days with entries |
| 4.7 | Can delete entry | ✅ | Desktop & Mobile - Clear entry text and save |
| 4.8 | Can navigate between weeks | ✅ | Desktop & Mobile - Previous/Next week buttons work |
| 4.9 | Weekly goal setting works | ✅ | Desktop & Mobile - Dropdown 3-7 days per week |
| 4.10 | Weekly goal progress bar displays | ✅ | Desktop & Mobile - Shows X/Y format (e.g., 1/3) |
| 4.11 | Streak tracking displays correctly | ✅ | Desktop & Mobile - Flame icon with day count |
| 4.12 | Colored day cards show in weekly view | ✅ | Desktop & Mobile - Days with entries are highlighted |
| 4.13 | Full-page view opens correctly | ✅ | Desktop & Mobile - Journal button opens Gratitude Journal page |
| 4.14 | Statistics display (streak, goal, total) | ✅ | Desktop & Mobile - 3 stat cards at top of page |
| 4.15 | Random inspiration prompts show | ✅ | Desktop & Mobile - Different prompt each time modal opens |
| 4.16 | Data syncs with Journal widget | ⏳ | Requires both widgets enabled |
| 4.17 | Refresh button works | ✅ | Desktop & Mobile - Updates widget display |
| 4.18 | Data persists after page refresh | ✅ | Desktop & Mobile - All entries retained after refresh |
| 4.19 | Hide widget works (PIN required) | ✅ | Desktop & Mobile - PIN modal, widget hidden, re-add works |

---

### 5. Habits

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 5.1 | Widget renders correctly in dashboard | ⏳ | |
| 5.2 | Displays habit list | ⏳ | |
| 5.3 | Can add new habit | ⏳ | |
| 5.4 | Can set habit name and icon | ⏳ | |
| 5.5 | Can set habit category | ⏳ | |
| 5.6 | Can set schedule (daily/weekdays/weekends/custom) | ⏳ | |
| 5.7 | Custom days selection works | ⏳ | |
| 5.8 | Can mark habit complete for today | ⏳ | |
| 5.9 | Completion animation plays | ⏳ | |
| 5.10 | Streak count displays correctly | ⏳ | |
| 5.11 | Streak resets on missed day | ⏳ | |
| 5.12 | Can toggle rest day | ⏳ | |
| 5.13 | Rest day doesn't break streak | ⏳ | |
| 5.14 | Can cancel rest day | ⏳ | |
| 5.15 | Can edit habit | ⏳ | |
| 5.16 | Can archive habit | ⏳ | |
| 5.17 | Can restore archived habit | ⏳ | |
| 5.18 | Can delete archived habit permanently | ⏳ | |
| 5.19 | Manage habits modal works | ⏳ | |
| 5.20 | Habit suggestions display | ⏳ | |
| 5.21 | Full-page view opens correctly | ⏳ | |
| 5.22 | Monthly calendar grid displays | ⏳ | |
| 5.23 | Month navigation works | ⏳ | |
| 5.24 | Statistics display (monthly %, streak, best streak) | ⏳ | |
| 5.25 | Archived habits section shows | ⏳ | |
| 5.26 | Category color-coding displays | ⏳ | |
| 5.27 | Motivational quotes display | ⏳ | |
| 5.28 | Refresh button works | ⏳ | |
| 5.29 | Data persists after page refresh | ⏳ | |
| 5.30 | Hide widget works (PIN required) | ⏳ | |

---

### 6. Recipes

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 6.1 | Widget renders correctly in dashboard | ⏳ | |
| 6.2 | Displays recipe collection | ⏳ | |
| 6.3 | Can add new recipe | ⏳ | |
| 6.4 | Can add recipe name and description | ⏳ | |
| 6.5 | Can add ingredients list | ⏳ | |
| 6.6 | Can add instructions | ⏳ | |
| 6.7 | Can set recipe tags/category | ⏳ | |
| 6.8 | Can set prep time | ⏳ | |
| 6.9 | Can set servings | ⏳ | |
| 6.10 | Can add nutrition info | ⏳ | |
| 6.11 | Can add recipe image (upload/URL) | ⏳ | |
| 6.12 | Can add personal notes | ⏳ | |
| 6.13 | Can edit recipe | ⏳ | |
| 6.14 | Can delete recipe | ⏳ | |
| 6.15 | Can toggle favorite | ⏳ | |
| 6.16 | Search recipes works | ⏳ | |
| 6.17 | Filter by tag works | ⏳ | |
| 6.18 | Filter by favorites works | ⏳ | |
| 6.19 | Sort options work (recent, A-Z, prep time) | ⏳ | |
| 6.20 | Can add ingredients to grocery list | ⏳ | |
| 6.21 | Bulk import recipes works | ⏳ | |
| 6.22 | Full-page view opens correctly | ⏳ | |
| 6.23 | Recipe detail view displays | ⏳ | |
| 6.24 | "Requires day-before prep" indicator shows | ⏳ | |
| 6.25 | Refresh button works | ⏳ | |
| 6.26 | Data persists after page refresh | ⏳ | |
| 6.27 | Hide widget works (PIN required) | ⏳ | |

---

### 7. Grocery

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 7.1 | Widget renders correctly in dashboard | ⏳ | |
| 7.2 | Displays grocery list | ⏳ | |
| 7.3 | Can add item manually | ⏳ | |
| 7.4 | Can set item quantity | ⏳ | |
| 7.5 | Can assign item to store | ⏳ | |
| 7.6 | Can assign item to category | ⏳ | |
| 7.7 | Can check off item | ⏳ | |
| 7.8 | Can edit item details | ⏳ | |
| 7.9 | Can delete item | ⏳ | |
| 7.10 | Quantity +/- buttons work | ⏳ | |
| 7.11 | Unit conversion displays | ⏳ | |
| 7.12 | Auto-category detection works | ⏳ | |
| 7.13 | Items from meal plan appear | ⏳ | |
| 7.14 | Store-organized view displays | ⏳ | |
| 7.15 | Can collapse/expand store sections | ⏳ | |
| 7.16 | Manage stores modal works | ⏳ | |
| 7.17 | Can add custom store | ⏳ | |
| 7.18 | Can edit store name | ⏳ | |
| 7.19 | Can delete store | ⏳ | |
| 7.20 | Can reorder stores | ⏳ | |
| 7.21 | Pantry view modal works | ⏳ | |
| 7.22 | Can add item to pantry | ⏳ | |
| 7.23 | Pantry items marked in list | ⏳ | |
| 7.24 | Generate from meal plan works | ⏳ | |
| 7.25 | Clear completed items works | ⏳ | |
| 7.26 | Share list works | ⏳ | |
| 7.27 | Smart suggestions display | ⏳ | |
| 7.28 | Swipe actions work (mobile) | ⏳ | |
| 7.29 | Full-page view opens correctly | ⏳ | |
| 7.30 | Progress tracking displays | ⏳ | |
| 7.31 | Refresh button works | ⏳ | |
| 7.32 | Data persists after page refresh | ⏳ | |
| 7.33 | Hide widget works (PIN required) | ⏳ | |

---

### 8. Routine

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 8.1 | Widget renders correctly in dashboard | ⏳ | |
| 8.2 | Displays routine reminders | ⏳ | |
| 8.3 | Can add new routine | ⏳ | |
| 8.4 | Can set routine name | ⏳ | |
| 8.5 | Can set frequency (daily/weekly/bi-weekly/monthly/custom) | ⏳ | |
| 8.6 | Can set category | ⏳ | |
| 8.7 | Can set time of day | ⏳ | |
| 8.8 | Can set custom icon | ⏳ | |
| 8.9 | Can set color | ⏳ | |
| 8.10 | Can add notes | ⏳ | |
| 8.11 | Can mark routine done | ⏳ | |
| 8.12 | Completion animation plays | ⏳ | |
| 8.13 | Can snooze routine (1/2/3/7 days) | ⏳ | |
| 8.14 | Can unsnooze routine | ⏳ | |
| 8.15 | Can skip routine (doesn't break streak) | ⏳ | |
| 8.16 | Can edit routine | ⏳ | |
| 8.17 | Can delete routine | ⏳ | |
| 8.18 | Streak tracking works | ⏳ | |
| 8.19 | Full-page view opens correctly | ⏳ | |
| 8.20 | Grouped by status (Overdue/Due Soon/Upcoming/Done/Snoozed) | ⏳ | |
| 8.21 | Last 7 days heatmap displays | ⏳ | |
| 8.22 | Statistics display correctly | ⏳ | |
| 8.23 | "Mark all overdue done" works | ⏳ | |
| 8.24 | Refresh button works | ⏳ | |
| 8.25 | Data persists after page refresh | ⏳ | |
| 8.26 | Hide widget works (PIN required) | ⏳ | |

---

### 9. Vision Board

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 9.1 | Widget renders correctly in dashboard | ⏳ | |
| 9.2 | Displays vision board with zones | ⏳ | |
| 9.3 | Default 6 zones display | ⏳ | |
| 9.4 | Can add goal to zone | ⏳ | |
| 9.5 | Can set goal title | ⏳ | |
| 9.6 | Can set goal category | ⏳ | |
| 9.7 | Can set goal icon | ⏳ | |
| 9.8 | Can upload goal image | ⏳ | |
| 9.9 | Can set progress tracking type (none/number/percentage) | ⏳ | |
| 9.10 | Can set current/target values | ⏳ | |
| 9.11 | Can set target date | ⏳ | |
| 9.12 | Can add notes | ⏳ | |
| 9.13 | Can add steps/milestones | ⏳ | |
| 9.14 | Can toggle step completion | ⏳ | |
| 9.15 | Steps sync to task list | ⏳ | |
| 9.16 | Can edit goal | ⏳ | |
| 9.17 | Can delete goal | ⏳ | |
| 9.18 | Can update progress manually | ⏳ | |
| 9.19 | Can mark goal complete | ⏳ | |
| 9.20 | Can expand zone view | ⏳ | |
| 9.21 | Can edit zone title | ⏳ | |
| 9.22 | Can add new zone | ⏳ | |
| 9.23 | Can delete zone | ⏳ | |
| 9.24 | Zone shape options work (circle/rectangle) | ⏳ | |
| 9.25 | Icon picker works | ⏳ | |
| 9.26 | Full-page view opens correctly | ⏳ | |
| 9.27 | Active/completed sections display | ⏳ | |
| 9.28 | Goal statistics display | ⏳ | |
| 9.29 | Refresh button works | ⏳ | |
| 9.30 | Data persists after page refresh | ⏳ | |
| 9.31 | Hide widget works (PIN required) | ⏳ | |

---

### 10. Journal

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 10.1 | Widget renders correctly in dashboard | ⏳ | |
| 10.2 | PIN verification required to open | ⏳ | |
| 10.3 | Displays journal interface after PIN | ⏳ | |
| 10.4 | Daily prompt displays | ⏳ | |
| 10.5 | Same prompt shows all day | ⏳ | |
| 10.6 | Can write new entry | ⏳ | |
| 10.7 | Can select mood (8 options) | ⏳ | |
| 10.8 | Mood colors/emojis display correctly | ⏳ | |
| 10.9 | Gratitude section is collapsible | ⏳ | |
| 10.10 | Can add gratitude items (3) | ⏳ | |
| 10.11 | Can save entry | ⏳ | |
| 10.12 | Can edit today's entry | ⏳ | |
| 10.13 | Can view past entries | ⏳ | |
| 10.14 | Past entries grouped by month | ⏳ | |
| 10.15 | Can edit past entry | ⏳ | |
| 10.16 | Can delete entry | ⏳ | |
| 10.17 | "Edited" indicator shows for edited entries | ⏳ | |
| 10.18 | Streak calculation works | ⏳ | |
| 10.19 | Data syncs with Gratitude widget | ⏳ | |
| 10.20 | Full-page view opens correctly | ⏳ | |
| 10.21 | All entries browsable in full-page | ⏳ | |
| 10.22 | Mood color coding in history | ⏳ | |
| 10.23 | Refresh button works | ⏳ | |
| 10.24 | Data persists after page refresh | ⏳ | |
| 10.25 | Hide widget works (PIN required) | ⏳ | |

---

### 11. Circuit Timer

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 11.1 | Widget renders correctly in dashboard | ⏳ | |
| 11.2 | Displays circuit timer interface | ⏳ | |
| 11.3 | Can select circuit template | ⏳ | |
| 11.4 | Can create custom circuit | ⏳ | |
| 11.5 | Can add exercises to circuit | ⏳ | |
| 11.6 | Can set work duration | ⏳ | |
| 11.7 | Can set rest duration | ⏳ | |
| 11.8 | Start button begins timer | ⏳ | |
| 11.9 | Pause button pauses timer | ⏳ | |
| 11.10 | Reset button resets timer | ⏳ | |
| 11.11 | Timer countdown displays correctly | ⏳ | |
| 11.12 | Work/rest alternation works | ⏳ | |
| 11.13 | Audio alert on interval change | ⏳ | |
| 11.14 | Next exercise button works | ⏳ | |
| 11.15 | Previous exercise button works | ⏳ | |
| 11.16 | Current exercise displays | ⏳ | |
| 11.17 | Progress visualization shows | ⏳ | |
| 11.18 | Can edit circuit | ⏳ | |
| 11.19 | Can delete circuit | ⏳ | |
| 11.20 | Can save as template | ⏳ | |
| 11.21 | Refresh button works | ⏳ | |
| 11.22 | Data persists after page refresh | ⏳ | |
| 11.23 | Hide widget works (PIN required) | ⏳ | |

---

## Teen Widgets

*Teens have access to all Adult widgets (1-11) plus these additional widgets:*

### 12. Screen Time

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 12.1 | Widget renders correctly in dashboard | ⏳ | |
| 12.2 | Displays screen time tracker | ⏳ | |
| 12.3 | Can log device usage | ⏳ | |
| 12.4 | Can set daily limit | ⏳ | |
| 12.5 | Shows time used today | ⏳ | |
| 12.6 | Shows time remaining | ⏳ | |
| 12.7 | Warning displays when approaching limit | ⏳ | |
| 12.8 | Can view usage history | ⏳ | |
| 12.9 | Weekly stats display | ⏳ | |
| 12.10 | App/category breakdown shows | ⏳ | |
| 12.11 | Can edit entries | ⏳ | |
| 12.12 | Refresh button works | ⏳ | |
| 12.13 | Data persists after page refresh | ⏳ | |
| 12.14 | Hide widget works (PIN required) | ⏳ | |

---

### 13. Achievements

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 13.1 | Widget renders correctly in dashboard | ⏳ | |
| 13.2 | Displays achievements/badges | ⏳ | |
| 13.3 | Shows earned badges | ⏳ | |
| 13.4 | Shows progress toward unearned badges | ⏳ | |
| 13.5 | Progress bars display correctly | ⏳ | |
| 13.6 | Badge categories display | ⏳ | |
| 13.7 | Badge details modal works | ⏳ | |
| 13.8 | Unlock conditions display | ⏳ | |
| 13.9 | Can share achievements | ⏳ | |
| 13.10 | Stats display correctly | ⏳ | |
| 13.11 | Refresh button works | ⏳ | |
| 13.12 | Data persists after page refresh | ⏳ | |
| 13.13 | Hide widget works (PIN required) | ⏳ | |

---

### 14. Chores

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 14.1 | Widget renders correctly in dashboard | ⏳ | |
| 14.2 | Displays chore list | ⏳ | |
| 14.3 | Can add chore | ⏳ | |
| 14.4 | Can assign chore | ⏳ | |
| 14.5 | Can set point value | ⏳ | |
| 14.6 | Can set recurrence/frequency | ⏳ | |
| 14.7 | Can mark chore complete | ⏳ | |
| 14.8 | Points awarded on completion | ⏳ | |
| 14.9 | Can edit chore | ⏳ | |
| 14.10 | Can delete chore | ⏳ | |
| 14.11 | Completion history displays | ⏳ | |
| 14.12 | Chore statistics show | ⏳ | |
| 14.13 | Refresh button works | ⏳ | |
| 14.14 | Data persists after page refresh | ⏳ | |
| 14.15 | Hide widget works (PIN required) | ⏳ | |

---

### 15. Points

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 15.1 | Widget renders correctly in dashboard | ⏳ | |
| 15.2 | Displays point balance | ⏳ | |
| 15.3 | Shows points by category | ⏳ | |
| 15.4 | Can earn points | ⏳ | |
| 15.5 | Can view point history | ⏳ | |
| 15.6 | Transaction history displays | ⏳ | |
| 15.7 | Manage activities modal works | ⏳ | |
| 15.8 | Can add custom activity | ⏳ | |
| 15.9 | Can reset activities | ⏳ | |
| 15.10 | Level progression works | ⏳ | |
| 15.11 | Point analytics display | ⏳ | |
| 15.12 | Refresh button works | ⏳ | |
| 15.13 | Data persists after page refresh | ⏳ | |
| 15.14 | Hide widget works (PIN required) | ⏳ | |

---

### 16. Rewards

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 16.1 | Widget renders correctly in dashboard | ⏳ | |
| 16.2 | Displays rewards list | ⏳ | |
| 16.3 | Shows point cost for each reward | ⏳ | |
| 16.4 | Can redeem reward | ⏳ | |
| 16.5 | Points deducted on redemption | ⏳ | |
| 16.6 | Can add to wishlist | ⏳ | |
| 16.7 | Wishlist displays | ⏳ | |
| 16.8 | Can view redemption history | ⏳ | |
| 16.9 | Can add custom reward (parent) | ⏳ | |
| 16.10 | Refresh button works | ⏳ | |
| 16.11 | Data persists after page refresh | ⏳ | |
| 16.12 | Hide widget works (PIN required) | ⏳ | |

---

## Kid Widgets

### 17. Points (Kid)

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 17.1 | Widget renders with fun/kid-friendly UI | ⏳ | |
| 17.2 | Displays point balance | ⏳ | |
| 17.3 | Shows level and progress | ⏳ | |
| 17.4 | Activities grouped by category | ⏳ | |
| 17.5 | Categories: hygiene, chores, school, health, kindness | ⏳ | |
| 17.6 | Can earn points from activities | ⏳ | |
| 17.7 | Celebration animation on point earn | ⏳ | |
| 17.8 | Point history displays | ⏳ | |
| 17.9 | Full-page view opens correctly | ⏳ | |
| 17.10 | Full-page shows detailed stats | ⏳ | |
| 17.11 | Manage activities works (PIN protected) | ⏳ | |
| 17.12 | Refresh button works | ⏳ | |
| 17.13 | Data persists after page refresh | ⏳ | |
| 17.14 | Hide widget works (PIN required) | ⏳ | |

---

### 18. Rewards (Kid)

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 18.1 | Widget renders with kid-friendly UI | ⏳ | |
| 18.2 | Displays rewards catalog | ⏳ | |
| 18.3 | Shows wishlist | ⏳ | |
| 18.4 | Can request reward | ⏳ | |
| 18.5 | Parent approval required for redemption | ⏳ | |
| 18.6 | Redeemed rewards history displays | ⏳ | |
| 18.7 | Can add custom reward (parent/PIN) | ⏳ | |
| 18.8 | Redemption confirmation shows | ⏳ | |
| 18.9 | Refresh button works | ⏳ | |
| 18.10 | Data persists after page refresh | ⏳ | |
| 18.11 | Hide widget works (PIN required) | ⏳ | |

---

### 19. Achievements (Kid)

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 19.1 | Widget renders with kid-friendly UI | ⏳ | |
| 19.2 | Displays kid achievements | ⏳ | |
| 19.3 | Badge icons are kid-friendly | ⏳ | |
| 19.4 | Shows earned badges | ⏳ | |
| 19.5 | Progress bars show advancement | ⏳ | |
| 19.6 | Badge categories display correctly | ⏳ | |
| 19.7 | Earned badge celebration animation | ⏳ | |
| 19.8 | Badge details modal works | ⏳ | |
| 19.9 | Refresh button works | ⏳ | |
| 19.10 | Data persists after page refresh | ⏳ | |
| 19.11 | Hide widget works (PIN required) | ⏳ | |

---

### 20. Kid Tasks

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 20.1 | Widget renders with fun UI | ⏳ | |
| 20.2 | Displays task list | ⏳ | |
| 20.3 | Can add task | ⏳ | |
| 20.4 | Can set emoji for task | ⏳ | |
| 20.5 | Can complete task | ⏳ | |
| 20.6 | Fun completion animation plays | ⏳ | |
| 20.7 | Can edit task inline | ⏳ | |
| 20.8 | Can delete task | ⏳ | |
| 20.9 | Can drag to reorder | ⏳ | |
| 20.10 | Full-page view opens correctly | ⏳ | |
| 20.11 | Completion tracking displays | ⏳ | |
| 20.12 | Refresh button works | ⏳ | |
| 20.13 | Data persists after page refresh | ⏳ | |
| 20.14 | Hide widget works (PIN required) | ⏳ | |

---

### 21. Kid Workout

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 21.1 | Widget renders with fun UI | ⏳ | |
| 21.2 | Displays fun exercise activities | ⏳ | |
| 21.3 | Can select activity | ⏳ | |
| 21.4 | Kid-friendly exercise options | ⏳ | |
| 21.5 | Timer for activity works | ⏳ | |
| 21.6 | Can log workout | ⏳ | |
| 21.7 | Fun motivation/rewards display | ⏳ | |
| 21.8 | Workout history displays | ⏳ | |
| 21.9 | Full-page view opens correctly | ⏳ | |
| 21.10 | Refresh button works | ⏳ | |
| 21.11 | Data persists after page refresh | ⏳ | |
| 21.12 | Hide widget works (PIN required) | ⏳ | |

---

### 22. Chores (Kid)

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 22.1 | Widget renders correctly | ⏳ | |
| 22.2 | Displays chore picker/list | ⏳ | |
| 22.3 | Chore wheel/spinner works (if applicable) | ⏳ | |
| 22.4 | Can pick daily chore | ⏳ | |
| 22.5 | Can mark chore done | ⏳ | |
| 22.6 | Earns points for completion | ⏳ | |
| 22.7 | Completion frequency tracked | ⏳ | |
| 22.8 | Chore history displays | ⏳ | |
| 22.9 | Refresh button works | ⏳ | |
| 22.10 | Data persists after page refresh | ⏳ | |
| 22.11 | Hide widget works (PIN required) | ⏳ | |

---

### 23. Accomplishments

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 23.1 | Widget renders correctly | ⏳ | |
| 23.2 | Displays accomplishments log | ⏳ | |
| 23.3 | Can add accomplishment | ⏳ | |
| 23.4 | Can set category | ⏳ | |
| 23.5 | Can add photos | ⏳ | |
| 23.6 | Celebration feedback displays | ⏳ | |
| 23.7 | Can share accomplishment | ⏳ | |
| 23.8 | Accomplishment history displays | ⏳ | |
| 23.9 | Daily/weekly completions tracked | ⏳ | |
| 23.10 | Progress summary shows | ⏳ | |
| 23.11 | Refresh button works | ⏳ | |
| 23.12 | Data persists after page refresh | ⏳ | |
| 23.13 | Hide widget works (PIN required) | ⏳ | |

---

### 24. Screen Time (Kid)

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 24.1 | Widget renders correctly | ⏳ | |
| 24.2 | Displays screen time tracker | ⏳ | |
| 24.3 | Shows time used today | ⏳ | |
| 24.4 | Shows time remaining | ⏳ | |
| 24.5 | Parent can set limit (PIN protected) | ⏳ | |
| 24.6 | Visual indicator when time low | ⏳ | |
| 24.7 | Can set personal goals | ⏳ | |
| 24.8 | Reminders display | ⏳ | |
| 24.9 | Weekly summary shows | ⏳ | |
| 24.10 | Category breakdown displays | ⏳ | |
| 24.11 | Refresh button works | ⏳ | |
| 24.12 | Data persists after page refresh | ⏳ | |
| 24.13 | Hide widget works (PIN required) | ⏳ | |

---

### 25. Vision Board (Kid - "My Dreams")

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 25.1 | Widget renders with kid-friendly UI | ⏳ | |
| 25.2 | Displays "My Dreams" vision board | ⏳ | |
| 25.3 | Can add dream/goal | ⏳ | |
| 25.4 | Can add image | ⏳ | |
| 25.5 | Can add steps/milestones | ⏳ | |
| 25.6 | Step-based progress tracking works | ⏳ | |
| 25.7 | Can mark dream complete | ⏳ | |
| 25.8 | Earns 50 points on completion | ⏳ | |
| 25.9 | Celebration animation on completion | ⏳ | |
| 25.10 | Dream gallery displays | ⏳ | |
| 25.11 | Full-page view opens correctly | ⏳ | |
| 25.12 | Refresh button works | ⏳ | |
| 25.13 | Data persists after page refresh | ⏳ | |
| 25.14 | Hide widget works (PIN required) | ⏳ | |

---

### 26. Kid Journal

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 26.1 | Widget renders with kid-friendly UI | ⏳ | |
| 26.2 | Displays journal with prompts | ⏳ | |
| 26.3 | Journal prompts display | ⏳ | |
| 26.4 | Can write entry | ⏳ | |
| 26.5 | Can select mood emoji | ⏳ | |
| 26.6 | Can add photos | ⏳ | |
| 26.7 | Can save entry | ⏳ | |
| 26.8 | Can view past entries | ⏳ | |
| 26.9 | Can edit entry | ⏳ | |
| 26.10 | Can delete entry | ⏳ | |
| 26.11 | Privacy (PIN protected) | ⏳ | |
| 26.12 | Full-page view opens correctly | ⏳ | |
| 26.13 | Refresh button works | ⏳ | |
| 26.14 | Data persists after page refresh | ⏳ | |
| 26.15 | Hide widget works (PIN required) | ⏳ | |

---

## Toddler Widgets

### 27. Toddler Routine

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 27.1 | Widget renders correctly | ⏳ | |
| 27.2 | Displays visual routine checklist | ⏳ | |
| 27.3 | Large icons for toddlers | ⏳ | |
| 27.4 | Large touchable buttons | ⏳ | |
| 27.5 | Can check off routine item | ⏳ | |
| 27.6 | Visual completion indicator shows | ⏳ | |
| 27.7 | Simple daily routines (wake, meals, sleep, playtime) | ⏳ | |
| 27.8 | Can add routine item (PIN protected) | ⏳ | |
| 27.9 | Full-page view opens correctly | ⏳ | |
| 27.10 | Refresh button works | ⏳ | |
| 27.11 | Data persists after page refresh | ⏳ | |
| 27.12 | Hide widget works (PIN required) | ⏳ | |

---

### 28. Activities (Toddler)

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 28.1 | Widget renders correctly | ⏳ | |
| 28.2 | Displays activity ideas | ⏳ | |
| 28.3 | Activity categories display (learning, play, social, physical) | ⏳ | |
| 28.4 | Can filter by category | ⏳ | |
| 28.5 | Can mark activity done | ⏳ | |
| 28.6 | Activity suggestions randomize | ⏳ | |
| 28.7 | Can add photo | ⏳ | |
| 28.8 | Parent observations can be added | ⏳ | |
| 28.9 | Activity history displays | ⏳ | |
| 28.10 | Full-page view shows all activities | ⏳ | |
| 28.11 | Refresh button works | ⏳ | |
| 28.12 | Data persists after page refresh | ⏳ | |
| 28.13 | Hide widget works (PIN required) | ⏳ | |

---

### 29. Daily Log

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 29.1 | Widget renders correctly | ⏳ | |
| 29.2 | Displays daily log tracker | ⏳ | |
| 29.3 | Can log feeding (breakfast/lunch/snack/dinner) | ⏳ | |
| 29.4 | Can log sleep/nap | ⏳ | |
| 29.5 | Can log diaper | ⏳ | |
| 29.6 | Can log activity | ⏳ | |
| 29.7 | Can track mood | ⏳ | |
| 29.8 | Notes section works | ⏳ | |
| 29.9 | Health observations can be added | ⏳ | |
| 29.10 | Parent reminders display | ⏳ | |
| 29.11 | Shows today's summary | ⏳ | |
| 29.12 | Can view past logs | ⏳ | |
| 29.13 | Full-page view shows history | ⏳ | |
| 29.14 | Refresh button works | ⏳ | |
| 29.15 | Data persists after page refresh | ⏳ | |
| 29.16 | Hide widget works (PIN required) | ⏳ | |

---

### 30. Toddler Tasks

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 30.1 | Widget renders correctly | ⏳ | |
| 30.2 | Displays simple visual task list | ⏳ | |
| 30.3 | Large touch targets | ⏳ | |
| 30.4 | Can complete task | ⏳ | |
| 30.5 | Fun completion feedback | ⏳ | |
| 30.6 | Colorful visual feedback | ⏳ | |
| 30.7 | Can add task (PIN protected) | ⏳ | |
| 30.8 | Simple progression tracking | ⏳ | |
| 30.9 | Full-page view opens correctly | ⏳ | |
| 30.10 | Refresh button works | ⏳ | |
| 30.11 | Data persists after page refresh | ⏳ | |
| 30.12 | Hide widget works (PIN required) | ⏳ | |

---

### 31. Milestones

| # | Test Case | Status | Notes |
|---|-----------|--------|-------|
| 31.1 | Widget renders correctly | ⏳ | |
| 31.2 | Displays milestone tracker | ⏳ | |
| 31.3 | Milestones grouped by category | ⏳ | |
| 31.4 | Categories: motor, speech, social, cognitive | ⏳ | |
| 31.5 | Can mark milestone achieved | ⏳ | |
| 31.6 | Can set achievement date | ⏳ | |
| 31.7 | Shows age-appropriate milestones | ⏳ | |
| 31.8 | Progress indicator displays | ⏳ | |
| 31.9 | Can add photos | ⏳ | |
| 31.10 | Timeline view displays | ⏳ | |
| 31.11 | Can share milestone | ⏳ | |
| 31.12 | Refresh button works | ⏳ | |
| 31.13 | Data persists after page refresh | ⏳ | |
| 31.14 | Hide widget works (PIN required) | ⏳ | |

---

## Test Summary

| Member Type | Widgets | Test Cases | ✅ Pass | ❌ Fail | ⏳ Untested |
|-------------|---------|------------|---------|---------|-------------|
| Adult | 11 | 273 | 88 | 0 | 185 |
| Teen | 5 | 68 | 0 | 0 | 68 |
| Kid | 10 | 136 | 0 | 0 | 136 |
| Toddler | 5 | 67 | 0 | 0 | 67 |
| **TOTAL** | **31** | **544** | **88** | **0** | **456** |

---

## Known Issues

| Issue ID | Widget | Test # | Description | Severity | Status |
|----------|--------|--------|-------------|----------|--------|
| BUG-001 | Meal Plan | 1.4 | Mobile: Week navigation arrows disappear after going to next week, cannot navigate back | High | ✅ Fixed |
| BUG-002 | Meal Plan | 1.5, 1.7 | Widget view: Adding/editing meals not working, changes not reflecting (Full-page works fine) | High | ✅ Fixed |
| BUG-003 | All Widgets | - | Mobile/Tab: Widget control buttons (refresh/expand/hide) not visible on hover, must tap widget first | Low | Open |
| BUG-004 | Meal Plan | 1.12 | Generate grocery list from meals not working | Medium | ✅ Fixed |

---

## Test Execution Log

| Date | Tester | Widget Tested | Pass | Fail | Notes |
|------|--------|---------------|------|------|-------|
| 2026-01-06 | Playwright | 1. Meal Plan | 16 | 0 | All tests pass after bug fixes (BUG-001, BUG-002, BUG-004) |
| 2026-01-07 | Playwright | 1. Meal Plan | 23 | 0 | Added sync tests (1.17-1.20) and kids meal tests (1.21-1.23) - Desktop |
| 2026-01-07 | Playwright | 1. Meal Plan | 23 | 0 | Mobile testing: All sync and kids meal tests pass (1.17-1.23) |
| 2026-01-07 | Playwright | 2. Task List | 19 | 0 | Desktop & Mobile: All tests pass (2.1-2.10, 2.12-2.20). Only 2.11 (overdue indicator) untested |
| 2026-01-08 | Playwright | 3. Workout | 28 | 0 | Desktop & Mobile: Core features, measurements, calendar heatmap, steps, routines, suggest workout plan all pass. 10 tests N/A or not tested |
| 2026-01-10 | Playwright | 4. Gratitude | 18 | 0 | Desktop & Mobile: All tests pass except 4.16 (Journal sync - requires both widgets). Widget CRUD, weekly view, stats, persistence all work |

---

## Notes

- Test each widget completely before moving to the next
- **Testing Order:** Adults (1-11) → Teens (12-16) → Kids (17-26) → Toddlers (27-31)
- Teen widgets include all Adult widgets - test only teen-specific widgets (12-16) in Teen section
- PIN-protected features require parent/admin PIN
- Update Test Summary after completing each widget
