# Voice Assistant Commands Reference

A comprehensive guide to all voice commands available in the Home Anchor app.

---

## Getting Started

1. Click the microphone button on the dashboard
2. Wait for the "Listening..." indicator
3. Speak your command clearly
4. The assistant will confirm the action

**Important:** You must be on a family member's dashboard (not Home or Settings) to use voice commands.

---

## Task Commands

All task commands require the keyword **"task"** to distinguish from other widgets.

| Command | Example | Action |
|---------|---------|--------|
| `add task [name]` | "add task buy groceries" | Creates a new task |
| `new task [name]` | "new task call mom" | Creates a new task |
| `create task [name]` | "create task finish report" | Creates a new task |
| `complete task [name]` | "complete task buy groceries" | Marks task as done |
| `finish task [name]` | "finish task call mom" | Marks task as done |
| `done with task [name]` | "done with task groceries" | Marks task as done |
| `task [name] done` | "task buy groceries done" | Marks task as done |
| `delete task [name]` | "delete task old item" | Removes the task |
| `remove task [name]` | "remove task old item" | Removes the task |
| `clear completed tasks` | "clear completed tasks" | Removes all completed tasks |
| `how many tasks` | "how many tasks" | Reports pending/total task count |

---

## Subtask Commands

Subtasks are nested items within a parent task.

| Command | Example | Action |
|---------|---------|--------|
| `subtask [name] to [task]` | "subtask get milk to buy groceries" | Adds subtask to task |
| `add subtask [name] to [task]` | "add subtask eggs to shopping" | Adds subtask to task |
| `subtask [name] under [task]` | "subtask bread under groceries" | Adds subtask to task |
| `subtask [name] for [task]` | "subtask butter for shopping" | Adds subtask to task |
| `complete subtask [name]` | "complete subtask get milk" | Marks subtask as done |
| `finish subtask [name]` | "finish subtask eggs" | Marks subtask as done |
| `done with subtask [name]` | "done with subtask bread" | Marks subtask as done |
| `subtask [name] done` | "subtask get milk done" | Marks subtask as done |

---

## Habit Commands

All habit commands require the keyword **"habit"** to distinguish from other widgets.

### Managing Habits

| Command | Example | Action |
|---------|---------|--------|
| `add habit [name]` | "add habit yoga" | Creates a new daily habit |
| `new habit [name]` | "new habit stretching" | Creates a new daily habit |
| `create habit [name]` | "create habit morning walk" | Creates a new daily habit |

### Checking Off Habits

| Command | Example | Action |
|---------|---------|--------|
| `check off habit [name]` | "check off habit exercise" | Marks habit done for today |
| `complete habit [name]` | "complete habit read" | Marks habit done for today |
| `finish habit [name]` | "finish habit meditate" | Marks habit done for today |
| `log habit [name]` | "log habit water" | Marks habit done for today |
| `habit [name] done` | "habit meditate done" | Marks habit done for today |

### Unchecking Habits

| Command | Example | Action |
|---------|---------|--------|
| `uncheck habit [name]` | "uncheck habit exercise" | Removes today's check |
| `undo habit [name]` | "undo habit read" | Removes today's check |
| `reset habit [name]` | "reset habit meditate" | Removes today's check |
| `remove habit [name]` | "remove habit yoga" | Removes today's check |

### Habit Status & Info

| Command | Example | Action |
|---------|---------|--------|
| `is habit [name] done` | "is habit exercise done?" | Checks if completed today |
| `did I do habit [name]` | "did I do habit read" | Checks if completed today |
| `status habit [name]` | "status habit yoga" | Shows habit status & streak |
| `check habit [name]` | "check habit meditation" | Shows habit status & streak |
| `habit [name] status` | "habit exercise status" | Shows habit status & streak |
| `what are my habits` | "what are my habits" | Lists today's scheduled habits |
| `list habits` | "list habits" | Lists today's scheduled habits |
| `show habits` | "show habits" | Lists today's scheduled habits |
| `what's my streak` | "what's my streak" | Reports your best streak |
| `habit streak` | "habit streak" | Reports your best streak |
| `my streak` | "my streak" | Reports your best streak |
| `how am I doing on habits` | "how am I doing on habits" | Reports today's progress (X of Y done) |

---

## Meal Commands

Meal commands use meal type keywords: **breakfast**, **lunch**, **dinner**, **snack**.

### Setting Today's Meals

| Command | Example | Action |
|---------|---------|--------|
| `set breakfast to [food]` | "set breakfast to oatmeal" | Sets today's breakfast |
| `set lunch to [food]` | "set lunch to salad" | Sets today's lunch |
| `set dinner to [food]` | "set dinner to pasta" | Sets today's dinner |
| `set snack to [food]` | "set snack to apple" | Sets today's snack |
| `breakfast is [food]` | "breakfast is pancakes" | Sets today's breakfast |
| `lunch is [food]` | "lunch is sandwich" | Sets today's lunch |
| `dinner is [food]` | "dinner is steak" | Sets today's dinner |

### Adding to Meals

| Command | Example | Action |
|---------|---------|--------|
| `add [food] to breakfast` | "add fruit to breakfast" | Adds item to today's breakfast |
| `add [food] to lunch` | "add salad to lunch" | Adds item to today's lunch |
| `add [food] to dinner` | "add bread to dinner" | Adds item to today's dinner |
| `add [food] to snack` | "add yogurt to snack" | Adds item to today's snack |

### Marking Meals as Done

| Command | Example | Action |
|---------|---------|--------|
| `breakfast done` | "breakfast done" | Marks breakfast as completed |
| `lunch is done` | "lunch is done" | Marks lunch as completed |
| `dinner is done` | "dinner is done" | Marks dinner as completed |
| `finished breakfast` | "finished breakfast" | Marks breakfast as completed |
| `done with lunch` | "done with lunch" | Marks lunch as completed |
| `mark dinner done` | "mark dinner done" | Marks dinner as completed |

### Querying Today's Meals

| Command | Example | Action |
|---------|---------|--------|
| `what's for breakfast` | "what's for breakfast" | Queries today's breakfast |
| `what's for lunch` | "what's for lunch" | Queries today's lunch |
| `what's for dinner` | "what's for dinner" | Queries today's dinner |
| `what is for dinner` | "what is for dinner" | Queries today's dinner |
| `what's the meal plan` | "what's the meal plan" | Lists all planned meals for today |
| `meal plan` | "meal plan" | Lists all planned meals for today |

### Tomorrow's Meals

| Command | Example | Action |
|---------|---------|--------|
| `what's for dinner tomorrow` | "what's for dinner tomorrow" | Queries tomorrow's meal |
| `what's for breakfast tomorrow` | "what's for breakfast tomorrow" | Queries tomorrow's meal |
| `what's the meal plan tomorrow` | "what's the meal plan tomorrow" | Lists all meals planned for tomorrow |
| `tomorrow's meal plan` | "tomorrow's meal plan" | Lists all meals planned for tomorrow |
| `meal plan for tomorrow` | "meal plan for tomorrow" | Lists all meals planned for tomorrow |
| `set dinner for tomorrow to [food]` | "set dinner for tomorrow to pizza" | Sets tomorrow's meal |
| `set tomorrow's dinner to [food]` | "set tomorrow's dinner to tacos" | Sets tomorrow's meal |
| `set breakfast for tomorrow to [food]` | "set breakfast for tomorrow to eggs" | Sets tomorrow's meal |

### Meal Prep

| Command | Example | Action |
|---------|---------|--------|
| `any prep today` | "any prep today" | Lists prep needed today (for tomorrow's meals) |
| `meal prep today` | "meal prep today" | Lists prep needed today |
| `do I need to prep today` | "do I need to prep today" | Lists prep needed today |
| `any prep tomorrow` | "any prep tomorrow" | Lists prep needed tomorrow (for day after) |
| `meal prep tomorrow` | "meal prep tomorrow" | Lists prep needed tomorrow |
| `tomorrow's prep` | "tomorrow's prep" | Lists prep needed tomorrow |

**Note:** Prep is done the day before the meal. So "prep today" tells you what to prepare today for tomorrow's meals.

---

## Shopping List Commands

Add items to your shopping list with optional store assignment.

### General Shopping List

| Command | Example | Action |
|---------|---------|--------|
| `add [item] to shopping list` | "add milk to shopping list" | Adds to general list |
| `add [item] to grocery list` | "add bread to grocery list" | Adds to general list |
| `shopping list [item]` | "shopping list eggs" | Adds to general list |
| `grocery list [item]` | "grocery list butter" | Adds to general list |
| `add [item] to the list` | "add cheese to the list" | Adds to general list |

### Store-Specific Shopping

| Command | Example | Action |
|---------|---------|--------|
| `add [item] to [store]` | "add eggs to walmart" | Adds to specific store |
| `add [item] to [store] list` | "add milk to costco list" | Adds to specific store |
| `[store] [item]` | "costco paper towels" | Adds to specific store |
| `[store] list [item]` | "target list detergent" | Adds to specific store |

**Supported Stores:** Walmart, Target, Costco, Aldi, Kroger, Safeway, Whole Foods, Trader Joe's, plus any custom stores you've added.

### Checking Off Items

| Command | Example | Action |
|---------|---------|--------|
| `check off [item]` | "check off milk" | Marks item as checked |
| `got [item]` | "got the eggs" | Marks item as checked |
| `got the [item]` | "got the bread" | Marks item as checked |
| `picked up [item]` | "picked up butter" | Marks item as checked |
| `crossed off [item]` | "crossed off cheese" | Marks item as checked |

### Managing the List

| Command | Example | Action |
|---------|---------|--------|
| `what's on my shopping list` | "what's on my shopping list" | Lists pending items |
| `what's on the list` | "what's on the list" | Lists pending items |
| `read shopping list` | "read shopping list" | Lists pending items |
| `how many items on my list` | "how many items on my list" | Counts pending items |
| `how many groceries` | "how many groceries" | Counts pending items |
| `remove [item] from list` | "remove milk from list" | Deletes an item |
| `delete [item] from list` | "delete eggs from shopping list" | Deletes an item |
| `clear checked items` | "clear checked items" | Removes all checked items |
| `clear done items` | "clear done items" | Removes all checked items |

---

## Points Commands (Kids/Teens Only)

Points commands require the keyword **"points"** and only work on kid/teen dashboards.

| Command | Example | Action |
|---------|---------|--------|
| `how many points` | "how many points" | Reports current balance |
| `check points` | "check points" | Reports current balance |
| `my points` | "my points" | Reports current balance |
| `what's my points` | "what's my points" | Reports current balance |
| `show points` | "show points" | Reports current balance |
| `points balance` | "points balance" | Reports current balance |
| `points today` | "points today" | Reports points earned today |
| `how many points today` | "how many points today" | Reports points earned today |
| `today's points` | "today's points" | Reports points earned today |

**Note:** Teens see "coins" instead of "points" in responses.

---

## Chore Commands (Kids Only)

Chore commands require the keyword **"chore"** or **"chores"**.

### Viewing Chores

| Command | Example | Action |
|---------|---------|--------|
| `what are my chores` | "what are my chores" | Lists pending chores for today |
| `list chores` | "list chores" | Lists pending chores for today |
| `show chores` | "show chores" | Lists pending chores for today |
| `today's chores` | "today's chores" | Lists pending chores for today |

### Completing Chores

| Command | Example | Action |
|---------|---------|--------|
| `complete chore [name]` | "complete chore make bed" | Marks chore done (awards points) |
| `finish chore [name]` | "finish chore dishes" | Marks chore done (awards points) |
| `done with chore [name]` | "done with chore trash" | Marks chore done (awards points) |
| `mark chore [name] done` | "mark chore room done" | Marks chore done (awards points) |
| `chore [name] done` | "chore make bed done" | Marks chore done (awards points) |
| `chore [name] complete` | "chore dishes complete" | Marks chore done (awards points) |

---

## Workout Commands

Log workouts and track your exercise progress with voice commands.

### Logging Workouts (Adults)

| Command | Example | Action |
|---------|---------|--------|
| `log [activity]` | "log yoga" | Logs a workout with default duration |
| `log [activity] workout` | "log strength workout" | Logs a workout |
| `did [activity]` | "did morning run" | Logs a workout |
| `finished [activity]` | "finished cycling" | Logs a workout |
| `completed [activity]` | "completed hiit" | Logs a workout |
| `log [X] minute [activity]` | "log 30 minute run" | Logs with specific duration |
| `did [activity] for [X] minutes` | "did yoga for 20 minutes" | Logs with specific duration |

**Recognized Activities:** Morning Run, Strength Training, Yoga, HIIT, Cycling, Swimming (plus aliases like "run", "weights", "gym", "bike", "swim")

### Logging Activities (Kids)

| Command | Example | Action |
|---------|---------|--------|
| `log [activity]` | "log swimming" | Logs activity and earns points |
| `did [activity]` | "did bike ride" | Logs activity and earns points |
| `finished [activity]` | "finished soccer" | Logs activity and earns points |
| `log [activity] for [X] minutes` | "log dance for 15 minutes" | Logs with custom duration |

**Recognized Activities:** Swimming, Bike Ride, Soccer, Dance Party, Jump Rope, Playground, Tag/Chase, Basketball, Stretching, Kids Yoga, Nature Walk, Skating

### Querying Workouts

| Command | Example | Action |
|---------|---------|--------|
| `did I workout today` | "did I workout today" | Lists today's workouts |
| `have I exercised today` | "have I exercised today" | Lists today's workouts |
| `what workout today` | "what workout today" | Lists today's workouts |
| `today's workout` | "today's workout" | Lists today's workouts |
| `any workouts today` | "any workouts today" | Lists today's workouts |

### Workout Streak

| Command | Example | Action |
|---------|---------|--------|
| `workout streak` | "workout streak" | Reports your consecutive days |
| `my workout streak` | "my workout streak" | Reports your consecutive days |
| `exercise streak` | "exercise streak" | Reports your consecutive days |
| `how long is my workout streak` | "how long is my workout streak" | Reports your consecutive days |

### Weekly Progress

| Command | Example | Action |
|---------|---------|--------|
| `workout progress` | "workout progress" | Shows days worked out vs goal |
| `exercise progress` | "exercise progress" | Shows days worked out vs goal |
| `how many workouts this week` | "how many workouts this week" | Shows weekly workout count |
| `workouts this week` | "workouts this week" | Shows weekly workout count |

### Step Tracking (Adults Only)

| Command | Example | Action |
|---------|---------|--------|
| `log [X] steps` | "log 8000 steps" | Records today's step count |
| `walked [X] steps` | "walked 10000 steps" | Records today's step count |
| `how many steps` | "how many steps" | Reports today's steps vs goal |
| `my steps` | "my steps" | Reports today's steps |
| `steps today` | "steps today" | Reports today's steps vs goal |

---

## Circuit Timer Commands (Adults Only)

Control your interval workout timers with voice commands.

### Starting Timers

| Command | Example | Action |
|---------|---------|--------|
| `start [timer name]` | "start tabata" | Starts the named timer |
| `start [timer name] timer` | "start quick hiit timer" | Starts the named timer |
| `begin [timer name]` | "begin endurance" | Starts the named timer |

**Default Timers:** Quick HIIT, Tabata, Endurance (plus any custom timers you've created)

### Controlling Timers

| Command | Example | Action |
|---------|---------|--------|
| `stop timer` | "stop timer" | Pauses the current timer |
| `pause timer` | "pause timer" | Pauses the current timer |
| `resume timer` | "resume timer" | Resumes a paused timer |
| `continue timer` | "continue timer" | Resumes a paused timer |

### Timer Info

| Command | Example | Action |
|---------|---------|--------|
| `list timers` | "list timers" | Shows all available timers |
| `my timers` | "my timers" | Shows all available timers |
| `show timers` | "show timers" | Shows all available timers |
| `timer status` | "timer status" | Reports current timer progress |
| `how much time left` | "how much time left" | Reports remaining time |

---

## Screen Time Commands (Kids Only)

Track and manage screen time with rewards for staying within limits.

### Starting Screen Time

| Command | Example | Action |
|---------|---------|--------|
| `start screen time` | "start screen time" | Starts countdown timer with remaining time |
| `begin screen time` | "begin screen time" | Starts countdown timer |
| `can I watch TV` | "can I watch TV" | Starts screen time if time is available |
| `I want to play tablet` | "I want to play tablet" | Starts screen time if time is available |

### Stopping Screen Time

| Command | Example | Action |
|---------|---------|--------|
| `stop screen time` | "stop screen time" | Stops timer and logs usage |
| `end screen time` | "end screen time" | Stops timer and logs usage |
| `done with screen time` | "done with screen time" | Stops timer and logs usage |
| `I'm done watching` | "I'm done watching" | Stops timer and logs usage |

### Checking Screen Time

| Command | Example | Action |
|---------|---------|--------|
| `how much screen time` | "how much screen time" | Reports remaining time today |
| `screen time left` | "screen time left" | Reports remaining time |
| `check screen time` | "check screen time" | Reports remaining and used time |
| `screen time status` | "screen time status" | Reports if timer is running |

### Rewards & Consequences

- **Bonus Points:** Stay within your daily limit to earn +10 bonus points
- **Penalty Points:** Exceed your limit and lose up to 50 points (5 points per minute over)
- Screen time limits are different for weekdays and weekends

---

## Journal Commands

Journal commands require the keyword **"journal"**.

### Adding Entries

| Command | Example | Action |
|---------|---------|--------|
| `add journal [text]` | "add journal had a great day" | Adds to today's journal |
| `journal [text]` | "journal went to the park" | Adds to today's journal |
| `write journal [text]` | "write journal feeling happy" | Adds to today's journal |
| `journal entry [text]` | "journal entry met a friend" | Adds to today's journal |

**Note:** Multiple entries on the same day are appended together.

### Setting Mood (Adults Only)

| Command | Example | Action |
|---------|---------|--------|
| `feeling [mood]` | "feeling grateful" | Sets today's mood |
| `I'm feeling [mood]` | "I'm feeling peaceful" | Sets today's mood |
| `set mood to [mood]` | "set mood to motivated" | Sets today's mood |
| `mood is [mood]` | "mood is content" | Sets today's mood |

**Available Moods:**
- grateful
- content
- energized
- reflective
- stressed
- peaceful
- motivated
- tired

---

## Help Command

| Command | Action |
|---------|--------|
| `help` | Lists available command categories |
| `what can you do` | Lists available command categories |
| `commands` | Lists available command categories |

---

## Tips for Better Recognition

### General Tips
1. **Speak clearly** - Pause briefly before and after your command
2. **Use keywords** - Include widget keywords (task, habit, chore, journal) to avoid confusion
3. **Partial names work** - "complete task grocery" will match "Buy groceries"
4. **Check your mic** - Ensure your browser has microphone permissions

### Command Structure
- Commands are **case-insensitive** ("Add Task" = "add task")
- **Fuzzy matching** finds items even with partial names
- Commands work for both **adults and kids** (uses appropriate widget automatically)

### Troubleshooting
- If a command isn't recognized, try rephrasing with the widget keyword
- Say "help" to hear available command categories
- Ensure you're on a family member's dashboard, not Home or Settings

---

## Quick Reference Card

### Most Common Commands

| Action | Say This |
|--------|----------|
| Add a task | "add task [name]" |
| Complete a task | "complete task [name]" |
| Check off a habit | "check off habit [name]" |
| Check habit status | "is habit [name] done" |
| Add habit | "add habit [name]" |
| Set dinner | "set dinner to [food]" |
| What's for dinner | "what's for dinner" |
| Log a workout | "log [activity]" or "did yoga for 30 minutes" |
| Workout streak | "workout streak" |
| Log steps | "log 8000 steps" |
| Start circuit timer | "start tabata" or "start quick hiit" |
| Stop/pause timer | "stop timer" or "pause timer" |
| Start screen time | "start screen time" (kids) |
| Stop screen time | "stop screen time" (kids) |
| Check screen time | "how much screen time" (kids) |
| Check points | "how many points" |
| Complete a chore | "complete chore [name]" |
| Add journal entry | "journal [text]" |
| Get help | "help" |

---

*Last updated: January 2026*
