# Full-Page View Standardization Plan

> **Goal:** Standardize all widget full-page views to follow the Recipes page format
> **Created:** 2026-01-10
> **Status:** Planned

---

## Target Format (Recipes-style)

```
┌─────────────────────────────────────────────────────┐
│  [← Back]     Page Title           [Action Buttons] │  <- Header
├─────────────────────────────────────────────────────┤
│  [Tab 1]  [Tab 2]  [Tab 3]  [Tab 4]                │  <- Tab Navigation
├─────────────────────────────────────────────────────┤
│  [Search...]        [Sort ▼]  [Filter ▼]           │  <- Filters (optional)
├─────────────────────────────────────────────────────┤
│                                                     │
│              Content Area                           │  <- Main Content
│         (Cards, Lists, Calendar, etc.)             │
│                                                     │
├─────────────────────────────────────────────────────┤
│           [+ Add New]                               │  <- Sticky Footer (optional)
└─────────────────────────────────────────────────────┘
```

---

## Widgets to Update (Priority Order)

### Phase 1: Adult Widgets (High Priority)

| # | Widget | Current Format | Proposed Tabs | Complexity | Est. Time |
|---|--------|----------------|---------------|------------|-----------|
| 1 | **Habits** | Calendar grid | Today, Calendar, Stats, Archived | Medium | 1 hour |
| 2 | **Gratitude** | Week cards + stats | Journal, Calendar, Stats | Medium | 45 min |
| 3 | **Workout** | Stats + day cards | Log, History, Body, Calendar | High | 1.5 hours |
| 4 | **Task List** | Simple list | To Do, Completed, All | Low | 30 min |
| 5 | **Routines** | Simple list | Due Today, All, Upcoming, History | Medium | 45 min |
| 6 | **Meal Plan** | Calendar week | Week View, Month View, Stats | Medium | 1 hour |
| 7 | **Journal** | Calendar | Write, History, Stats | Medium | 45 min |
| 8 | **Vision Board** | Grid | Already similar, minor tweaks | Low | 20 min |

### Phase 2: Kid/Teen Widgets

| # | Widget | Proposed Tabs | Complexity |
|---|--------|---------------|------------|
| 9 | **Points** | History, Calendar, Stats, Rewards | Medium |
| 10 | **Kid Activities** | Today, All, History | Low |
| 11 | **Milestones** | Current, Completed, All | Low |
| 12 | **Kid Journal** | Write, History, Stats | Medium |
| 13 | **Kid Workout** | Log, History, Stats | Medium |

### Phase 3: Toddler Widgets

| # | Widget | Proposed Tabs | Complexity |
|---|--------|---------------|------------|
| 14 | **Toddler Tasks** | Tasks, History | Low |
| 15 | **Toddler Routine** | Today, History | Low |

---

## Shared Components to Create

### 1. Page Header Component
```javascript
// js/components/page-header.js
function renderPageHeader({ title, icon, backAction, actions }) {
    return `
        <div class="page-header">
            <button class="btn btn--ghost page-header__back" data-action="back">
                <i data-lucide="arrow-left"></i>
                Back
            </button>
            <h2 class="page-header__title">
                ${icon ? `<i data-lucide="${icon}"></i>` : ''}
                ${title}
            </h2>
            <div class="page-header__actions">
                ${actions || ''}
            </div>
        </div>
    `;
}
```

### 2. Tab Navigation Component
```javascript
// js/components/page-tabs.js
function renderPageTabs({ tabs, activeTab }) {
    return `
        <div class="page-tabs">
            ${tabs.map(tab => `
                <button class="page-tab ${tab.id === activeTab ? 'page-tab--active' : ''}"
                        data-tab="${tab.id}">
                    ${tab.icon ? `<i data-lucide="${tab.icon}"></i>` : ''}
                    ${tab.label}
                    ${tab.count !== undefined ? `<span class="page-tab__count">${tab.count}</span>` : ''}
                </button>
            `).join('')}
        </div>
    `;
}
```

### 3. Filter Bar Component
```javascript
// js/components/filter-bar.js
function renderFilterBar({ searchPlaceholder, sortOptions, filterOptions }) {
    return `
        <div class="filter-bar">
            ${searchPlaceholder ? `
                <div class="filter-bar__search">
                    <i data-lucide="search"></i>
                    <input type="text" placeholder="${searchPlaceholder}" data-search>
                </div>
            ` : ''}
            ${sortOptions ? `
                <select class="filter-bar__sort" data-sort>
                    ${sortOptions.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('')}
                </select>
            ` : ''}
            ${filterOptions ? `
                <select class="filter-bar__filter" data-filter>
                    ${filterOptions.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('')}
                </select>
            ` : ''}
        </div>
    `;
}
```

---

## CSS Structure

### New CSS File: `css/page-layout.css`
```css
/* Page Container */
.page-container { ... }

/* Page Header */
.page-header { ... }
.page-header__back { ... }
.page-header__title { ... }
.page-header__actions { ... }

/* Page Tabs */
.page-tabs { ... }
.page-tab { ... }
.page-tab--active { ... }
.page-tab__count { ... }

/* Filter Bar */
.filter-bar { ... }
.filter-bar__search { ... }
.filter-bar__sort { ... }
.filter-bar__filter { ... }

/* Page Content */
.page-content { ... }
.page-content__empty { ... }

/* Page Footer */
.page-footer { ... }
.page-footer--sticky { ... }
```

---

## Implementation Steps for Each Widget

### Template: Widget Full-Page Update

1. **Read current implementation** - Understand existing structure
2. **Create new page layout** - Using shared components
3. **Migrate tab content** - Move existing views into tabs
4. **Add search/filter** - Where applicable
5. **Update CSS** - Use shared classes
6. **Test desktop & mobile** - Verify responsive behavior
7. **Update event bindings** - Ensure all interactions work

---

## Day 1: Habits Widget (First Example)

### Current State
- Full-page shows calendar grid
- Stats at top (monthly %, streak, best)
- Archived section at bottom
- No tab navigation

### Target State
```
Tabs: [Today] [Calendar] [Stats] [Archived]

Today Tab:
- Today's habits with completion checkboxes
- Quick actions

Calendar Tab:
- Month calendar grid (existing)
- Month navigation

Stats Tab:
- Streak info
- Monthly completion %
- Best streak
- Charts (optional)

Archived Tab:
- Archived habits list
- Restore/Delete actions
```

### Files to Modify
- `js/features/habits.js` - Main logic
- `css/habits.css` - Widget-specific styles
- `css/page-layout.css` - Shared styles (create if needed)

---

## Testing Checklist

For each widget update:
- [ ] Desktop layout looks correct
- [ ] Mobile layout is responsive
- [ ] Tab switching works
- [ ] Search/filter works (if applicable)
- [ ] Back button returns to member tab
- [ ] All existing features still work
- [ ] Data persists correctly
- [ ] No console errors

---

## Notes

- Start with Habits as it's a good medium-complexity example
- Create shared components first, then apply to each widget
- Test thoroughly on mobile - this is a family app
- Keep existing functionality intact - this is UI restructuring only
- Consider adding loading states for better UX

---

## Progress Tracking

| Widget | Status | Date | Notes |
|--------|--------|------|-------|
| Habits | Done | 2026-01-13 | Tabbed interface with Today, Calendar, Stats, Archived |
| Gratitude | Done | 2026-01-13 | Completed |
| Workout | Done | 2026-01-13 | Completed |
| Task List | Done | 2026-01-13 | Completed with subtasks |
| Routines | Done | 2026-01-13 | Tabbed interface with Due, All, History, Stats tabs |
| Meal Plan | Done | 2026-01-13 | Completed |
| Journal | Done | 2026-01-13 | Completed |
| Vision Board | Done | 2026-01-13 | Tabbed interface with Board, Goals, Achieved, Stats tabs |
| Grocery List | Done | 2026-01-13 | Tabbed interface with List, Stores, Pantry, Stats tabs |
| Points | Pending | - | |
| Kid Activities | Pending | - | |
| Milestones | Pending | - | |
| Kid Journal | Pending | - | |
| Kid Workout | Pending | - | |
| Toddler Tasks | Pending | - | |
| Toddler Routine | Pending | - | |
