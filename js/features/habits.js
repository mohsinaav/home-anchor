/**
 * Habits Feature
 * Daily habit tracker with streaks, scheduling, categories, and monthly stats
 * Enhanced with rest days, archiving, and celebration animations
 */

const Habits = (function() {
    // Habit categories
    const CATEGORIES = {
        health: { label: 'Health', icon: 'heart', color: '#EF4444' },
        wellness: { label: 'Wellness', icon: 'brain', color: '#8B5CF6' },
        productivity: { label: 'Productivity', icon: 'zap', color: '#F59E0B' },
        fitness: { label: 'Fitness', icon: 'dumbbell', color: '#10B981' },
        learning: { label: 'Learning', icon: 'book-open', color: '#3B82F6' },
        other: { label: 'Other', icon: 'star', color: '#6B7280' }
    };

    // Schedule types
    const SCHEDULES = {
        daily: { label: 'Every day', icon: 'calendar' },
        weekdays: { label: 'Weekdays (Mon-Fri)', icon: 'briefcase' },
        weekends: { label: 'Weekends (Sat-Sun)', icon: 'sun' },
        custom: { label: 'Custom days', icon: 'settings-2' }
    };

    // Weekday names for custom scheduling
    const WEEKDAYS = [
        { short: 'S', full: 'Sun', index: 0 },
        { short: 'M', full: 'Mon', index: 1 },
        { short: 'T', full: 'Tue', index: 2 },
        { short: 'W', full: 'Wed', index: 3 },
        { short: 'T', full: 'Thu', index: 4 },
        { short: 'F', full: 'Fri', index: 5 },
        { short: 'S', full: 'Sat', index: 6 }
    ];

    // Common habit icons
    const HABIT_ICONS = [
        'circle', 'check-circle', 'star', 'heart', 'zap', 'flame',
        'droplet', 'dumbbell', 'book-open', 'brain', 'moon', 'sun',
        'sunrise', 'sunset', 'coffee', 'apple', 'leaf', 'flower',
        'pill', 'pen-line', 'calendar-check', 'bed', 'monitor-off',
        'headphones', 'smile', 'music', 'camera', 'utensils', 'glass-water'
    ];

    // Motivational quotes about habits
    const HABIT_QUOTES = [
        { text: "We are what we repeatedly do. Excellence is not an act, but a habit.", author: "Aristotle" },
        { text: "Small daily improvements are the key to staggering long-term results.", author: "Robin Sharma" },
        { text: "Motivation gets you started. Habit keeps you going.", author: "Jim Ryun" },
        { text: "The secret of your future is hidden in your daily routine.", author: "Mike Murdock" },
        { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
        { text: "First we make our habits, then our habits make us.", author: "John Dryden" },
        { text: "Your habits will determine your future.", author: "Jack Canfield" },
        { text: "Good habits formed at youth make all the difference.", author: "Aristotle" },
        { text: "Chains of habit are too light to be felt until they are too heavy to be broken.", author: "Warren Buffett" },
        { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" }
    ];

    /**
     * Get a random motivational quote
     */
    function getRandomQuote() {
        return HABIT_QUOTES[Math.floor(Math.random() * HABIT_QUOTES.length)];
    }

    // Habit suggestions for quick adding
    const HABIT_SUGGESTIONS = [
        { name: 'Drink 8 glasses of water', icon: 'droplet', category: 'health' },
        { name: 'Exercise', icon: 'dumbbell', category: 'fitness' },
        { name: 'Take vitamins', icon: 'pill', category: 'health' },
        { name: 'Sleep 8 hours', icon: 'moon', category: 'health' },
        { name: 'Meditate', icon: 'brain', category: 'wellness' },
        { name: 'Read', icon: 'book-open', category: 'learning' },
        { name: 'Journal', icon: 'pen-line', category: 'wellness' },
        { name: 'No screens before bed', icon: 'monitor-off', category: 'wellness' },
        { name: 'Wake up early', icon: 'sunrise', category: 'productivity' },
        { name: 'Make bed', icon: 'bed', category: 'productivity' },
        { name: 'Plan my day', icon: 'calendar-check', category: 'productivity' },
        { name: 'Practice gratitude', icon: 'heart', category: 'wellness' }
    ];

    // Default habits for new users
    const DEFAULT_HABITS = [
        { id: 'hab-default-1', name: 'Drink 8 glasses of water', icon: 'droplet', category: 'health', schedule: 'daily' },
        { id: 'hab-default-2', name: 'Exercise', icon: 'dumbbell', category: 'fitness', schedule: 'daily' },
        { id: 'hab-default-3', name: 'Read', icon: 'book-open', category: 'learning', schedule: 'daily' },
        { id: 'hab-default-4', name: 'Meditate', icon: 'brain', category: 'wellness', schedule: 'daily' }
    ];

    /**
     * Get widget data with defaults
     */
    function getWidgetData(memberId) {
        const stored = Storage.getWidgetData(memberId, 'habits');
        if (!stored || !stored.habits || stored.habits.length === 0) {
            return {
                habits: DEFAULT_HABITS.map(h => ({
                    ...h,
                    streak: 0,
                    bestStreak: 0,
                    customDays: null,
                    archived: false
                })),
                log: {},
                restDays: {},
                viewMode: 'list', // 'list' or 'circular'
                archivedHabits: []
            };
        }
        // Migrate old habits without new fields
        const habits = (stored.habits || []).map(h => ({
            ...h,
            streak: h.streak || 0,
            bestStreak: h.bestStreak || 0,
            category: h.category || 'other',
            schedule: h.schedule || 'daily',
            customDays: h.customDays || null,
            archived: h.archived || false
        }));
        return {
            ...stored,
            habits,
            restDays: stored.restDays || {},
            viewMode: stored.viewMode || 'list',
            archivedHabits: stored.archivedHabits || []
        };
    }

    /**
     * Save widget data
     */
    function saveWidgetData(memberId, data) {
        Storage.setWidgetData(memberId, 'habits', data);
    }

    /**
     * Check if a habit is scheduled for a specific date
     */
    function isHabitScheduledForDate(habit, dateStr) {
        const date = new Date(dateStr);
        const dayOfWeek = date.getDay(); // 0=Sun, 6=Sat

        switch (habit.schedule) {
            case 'daily':
                return true;
            case 'weekdays':
                return dayOfWeek >= 1 && dayOfWeek <= 5;
            case 'weekends':
                return dayOfWeek === 0 || dayOfWeek === 6;
            case 'custom':
                return habit.customDays?.includes(dayOfWeek) || false;
            default:
                return true;
        }
    }

    /**
     * Get habits scheduled for today (active, non-archived)
     */
    function getTodayHabits(habits) {
        const today = DateUtils.today();
        return habits.filter(h => !h.archived && isHabitScheduledForDate(h, today));
    }

    /**
     * Check if today is a rest day
     */
    function isRestDay(memberId, dateStr) {
        const widgetData = getWidgetData(memberId);
        return widgetData.restDays?.[dateStr] || false;
    }

    /**
     * Toggle rest day for a date
     */
    function toggleRestDay(memberId, dateStr) {
        const widgetData = getWidgetData(memberId);
        const isRest = widgetData.restDays?.[dateStr] || false;

        const updatedData = {
            ...widgetData,
            restDays: {
                ...widgetData.restDays,
                [dateStr]: !isRest
            }
        };

        saveWidgetData(memberId, updatedData);
        return !isRest;
    }

    /**
     * Calculate streak for a habit
     */
    function calculateStreak(habit, log, restDays) {
        let streak = 0;
        let currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);

        // Start from yesterday if today isn't completed yet
        const today = DateUtils.today();
        const todayCompleted = log[today]?.includes(habit.id);
        if (!todayCompleted) {
            currentDate.setDate(currentDate.getDate() - 1);
        }

        // Count consecutive days
        while (true) {
            const dateStr = DateUtils.formatISO(currentDate);

            // Skip rest days - they don't break streak
            if (restDays?.[dateStr]) {
                currentDate.setDate(currentDate.getDate() - 1);
                continue;
            }

            // Skip days when habit wasn't scheduled
            if (!isHabitScheduledForDate(habit, dateStr)) {
                currentDate.setDate(currentDate.getDate() - 1);
                continue;
            }

            // Check if completed on this day
            const dayLog = log[dateStr] || [];
            if (dayLog.includes(habit.id)) {
                streak++;
                currentDate.setDate(currentDate.getDate() - 1);
            } else {
                break;
            }

            // Safety limit
            if (streak > 365) break;
        }

        return streak;
    }

    /**
     * Update streaks for all habits
     */
    function updateStreaks(memberId) {
        const widgetData = getWidgetData(memberId);
        const habits = widgetData.habits.map(habit => {
            const streak = calculateStreak(habit, widgetData.log, widgetData.restDays);
            return {
                ...habit,
                streak,
                bestStreak: Math.max(habit.bestStreak || 0, streak)
            };
        });

        saveWidgetData(memberId, { ...widgetData, habits });
    }

    /**
     * Show completion celebration animation
     */
    function showCelebration(habit, isAllDone = false) {
        const overlay = document.createElement('div');
        overlay.className = 'habit-celebration';

        const message = isAllDone ? 'All habits done!' : `${habit.name} ✓`;
        const streakText = habit.streak > 1 ? `${habit.streak} day streak!` : '';

        overlay.innerHTML = `
            <div class="habit-celebration__content">
                <div class="habit-celebration__icon" style="--habit-color: ${CATEGORIES[habit.category]?.color || '#6366F1'}">
                    <i data-lucide="${isAllDone ? 'trophy' : 'check-circle-2'}"></i>
                </div>
                <div class="habit-celebration__text">${message}</div>
                ${streakText ? `<div class="habit-celebration__streak"><i data-lucide="flame"></i> ${streakText}</div>` : ''}
            </div>
        `;

        document.body.appendChild(overlay);

        if (typeof lucide !== 'undefined') {
            lucide.createIcons({ nodes: [overlay] });
        }

        // Auto-remove after animation
        setTimeout(() => {
            overlay.classList.add('habit-celebration--fade');
            setTimeout(() => overlay.remove(), 300);
        }, 1200);
    }

    /**
     * Render the habits widget for a member
     */
    function renderWidget(container, memberId) {
        const today = DateUtils.today();
        const widgetData = getWidgetData(memberId);
        const allHabits = widgetData.habits || [];
        const todayHabits = getTodayHabits(allHabits);
        const todayLog = widgetData.log?.[today] || [];
        const isRest = isRestDay(memberId, today);

        const completedCount = todayHabits.filter(h => todayLog.includes(h.id)).length;
        const totalHabits = todayHabits.length;
        const allDone = totalHabits > 0 && completedCount === totalHabits;
        const progress = totalHabits > 0 ? (completedCount / totalHabits) * 100 : 0;

        // Calculate overall streak (longest current streak)
        const longestStreak = Math.max(...allHabits.map(h => h.streak || 0), 0);

        // Get a motivational quote
        const quote = getRandomQuote();

        container.innerHTML = `
            <div class="habits-widget ${isRest ? 'habits-widget--rest-day' : ''} ${allDone ? 'habits-widget--all-done' : ''}">
                ${isRest ? `
                    <div class="habits-widget__rest-banner">
                        <i data-lucide="coffee"></i>
                        <span>Rest Day - Take it easy!</span>
                        <button class="btn btn--xs btn--ghost" data-action="cancel-rest">Cancel</button>
                    </div>
                ` : ''}

                <div class="habits-widget__quote">
                    <p class="habits-widget__quote-text">"${quote.text}"</p>
                    <span class="habits-widget__quote-author">— ${quote.author}</span>
                </div>

                <div class="habits-widget__header">
                    <div class="habits-widget__progress">
                        <div class="habits-progress">
                            <div class="habits-progress__bar ${allDone ? 'habits-progress__bar--complete' : ''}"
                                 style="width: ${progress}%"></div>
                        </div>
                        <span class="habits-widget__count ${allDone ? 'habits-widget__count--complete' : ''}">
                            ${completedCount}/${totalHabits} ${allDone ? '🎉' : ''}
                        </span>
                    </div>
                    ${longestStreak > 0 ? `
                        <div class="habits-widget__streak" title="Best current streak">
                            <i data-lucide="flame"></i>
                            <span>${longestStreak} day${longestStreak !== 1 ? 's' : ''}</span>
                        </div>
                    ` : ''}
                </div>

                <div class="habits-widget__list">
                    ${todayHabits.length === 0 ? `
                        <div class="habits-widget__empty">
                            <i data-lucide="calendar-off"></i>
                            <p>No habits scheduled for today</p>
                        </div>
                    ` : todayHabits.map(habit => {
                        const isCompleted = todayLog.includes(habit.id);
                        const cat = CATEGORIES[habit.category] || CATEGORIES.other;
                        return `
                            <button class="habit-item ${isCompleted ? 'habit-item--done' : ''}"
                                    data-habit-id="${habit.id}"
                                    data-member-id="${memberId}"
                                    style="--habit-color: ${cat.color}">
                                <span class="habit-item__checkbox" style="color: ${cat.color}">
                                    <i data-lucide="${isCompleted ? 'check-square' : 'square'}"></i>
                                </span>
                                <span class="habit-item__icon" style="color: ${cat.color}">
                                    <i data-lucide="${habit.icon || 'circle'}"></i>
                                </span>
                                <span class="habit-item__name">${habit.name}</span>
                                ${habit.streak > 0 ? `
                                    <span class="habit-item__streak">
                                        <i data-lucide="flame"></i>
                                        ${habit.streak}
                                    </span>
                                ` : ''}
                            </button>
                        `;
                    }).join('')}
                </div>

                <div class="habits-widget__footer">
                    <button class="btn btn--sm btn--ghost ${isRest ? 'btn--warning' : ''}" data-action="rest-day" title="${isRest ? 'Cancel rest day' : 'Mark as rest day'}">
                        <i data-lucide="coffee"></i>
                        Rest
                    </button>
                    <button class="btn btn--sm btn--ghost" data-action="view-stats" data-member-id="${memberId}">
                        <i data-lucide="bar-chart-2"></i>
                        Stats
                    </button>
                    <button class="btn btn--sm btn--ghost" data-action="manage-habits" data-member-id="${memberId}">
                        <i data-lucide="settings"></i>
                        Manage
                    </button>
                </div>
            </div>
        `;

        // Initialize icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Bind events
        bindHabitEvents(container, memberId, widgetData);
    }

    /**
     * Bind habit events
     */
    function bindHabitEvents(container, memberId, widgetData) {
        // Toggle habit
        container.querySelectorAll('.habit-item').forEach(btn => {
            btn.addEventListener('click', () => {
                const habitId = btn.dataset.habitId;
                toggleHabit(container, memberId, habitId, widgetData);
            });
        });

        // Rest day toggle
        container.querySelector('[data-action="rest-day"]')?.addEventListener('click', () => {
            const today = DateUtils.today();
            toggleRestDay(memberId, today);
            renderWidget(container, memberId);
            Toast.success(isRestDay(memberId, today) ? 'Rest day activated!' : 'Rest day cancelled');
        });

        // Cancel rest day from banner
        container.querySelector('[data-action="cancel-rest"]')?.addEventListener('click', () => {
            const today = DateUtils.today();
            toggleRestDay(memberId, today);
            renderWidget(container, memberId);
        });

        // View stats - opens full page
        container.querySelector('[data-action="view-stats"]')?.addEventListener('click', () => {
            showStatsPage(memberId);
        });

        // Manage habits
        container.querySelector('[data-action="manage-habits"]')?.addEventListener('click', () => {
            showManageHabitsModal(memberId);
        });
    }

    /**
     * Toggle habit completion
     */
    function toggleHabit(container, memberId, habitId, widgetData) {
        const today = DateUtils.today();
        const todayLog = widgetData.log?.[today] || [];
        const habit = widgetData.habits.find(h => h.id === habitId);

        let updatedLog;
        let wasCompleted = todayLog.includes(habitId);

        if (wasCompleted) {
            updatedLog = todayLog.filter(id => id !== habitId);
        } else {
            updatedLog = [...todayLog, habitId];
        }

        const updatedData = {
            ...widgetData,
            log: {
                ...widgetData.log,
                [today]: updatedLog
            }
        };

        saveWidgetData(memberId, updatedData);

        // Update streaks
        updateStreaks(memberId);

        // Show celebration when completing (not uncompleting)
        if (!wasCompleted && habit) {
            const todayHabits = getTodayHabits(widgetData.habits);
            const isAllDone = todayHabits.every(h =>
                h.id === habitId || updatedLog.includes(h.id)
            );

            // Get updated habit with streak
            const updatedWidgetData = getWidgetData(memberId);
            const updatedHabit = updatedWidgetData.habits.find(h => h.id === habitId);

            showCelebration(updatedHabit || habit, isAllDone);

            if (isAllDone) {
                Toast.success('All habits completed today! 🎉');
            }
        }

        // Refresh widget
        renderWidget(container, memberId);
    }

    /**
     * Show full page stats view with monthly grid
     */
    function showStatsPage(memberId) {
        const main = document.getElementById('mainContent');
        if (!main) return;

        const member = Storage.getMember(memberId);
        renderStatsPage(main, memberId, member, new Date());
    }

    /**
     * Render the stats page
     */
    function renderStatsPage(container, memberId, member, currentDate) {
        const widgetData = getWidgetData(memberId);
        const habits = (widgetData.habits || []).filter(h => !h.archived);
        const archivedHabits = widgetData.archivedHabits || [];
        const log = widgetData.log || {};
        const restDays = widgetData.restDays || {};

        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

        // Split days into two rows for desktop: 1-16 and 17-31 (like the paper tracker)
        const daysRow1 = [];
        const daysRow2 = [];
        for (let d = 1; d <= 16; d++) {
            daysRow1.push(d);
        }
        for (let d = 17; d <= 31; d++) {
            daysRow2.push(d);
        }

        // For mobile: split into 4 rows of 8 days each
        const mobileRows = [
            [1, 2, 3, 4, 5, 6, 7, 8],
            [9, 10, 11, 12, 13, 14, 15, 16],
            [17, 18, 19, 20, 21, 22, 23, 24],
            [25, 26, 27, 28, 29, 30, 31]
        ];

        // Get weekday for each day (S, M, T, W, T, F, S)
        const weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
        const getWeekday = (day) => {
            const date = new Date(year, month, day);
            return weekdays[date.getDay()];
        };

        // Calculate overall stats for the month
        const totalCompletions = habits.reduce((sum, habit) => {
            const { completions } = countMonthlyCompletions(log, restDays, habit, year, month);
            return sum + completions;
        }, 0);
        const totalScheduled = habits.reduce((sum, habit) => {
            const { scheduledDays } = countMonthlyCompletions(log, restDays, habit, year, month);
            return sum + scheduledDays;
        }, 0);
        const overallPercentage = totalScheduled > 0 ? Math.round((totalCompletions / totalScheduled) * 100) : 0;
        const bestStreak = Math.max(...habits.map(h => h.streak || 0), 0);
        const bestOverallStreak = Math.max(...habits.map(h => h.bestStreak || 0), 0);

        container.innerHTML = `
            <div class="habits-page habits-page--colorful">
                <div class="habits-page__hero">
                    <button class="btn btn--ghost habits-page__back" id="backToMemberBtn">
                        <i data-lucide="arrow-left"></i>
                        Back to ${member?.name || 'Dashboard'}
                    </button>
                    <div class="habits-page__hero-content">
                        <h1 class="habits-page__title">
                            <i data-lucide="repeat"></i>
                            Habit Tracker
                        </h1>
                        <p class="habits-page__subtitle">Track your daily habits and build consistency</p>
                    </div>
                </div>

                <div class="habits-page__stats-row">
                    <div class="habits-stat-card habits-stat-card--primary">
                        <div class="habits-stat-card__icon">
                            <i data-lucide="percent"></i>
                        </div>
                        <div class="habits-stat-card__info">
                            <span class="habits-stat-card__value">${overallPercentage}%</span>
                            <span class="habits-stat-card__label">This Month</span>
                        </div>
                    </div>
                    <div class="habits-stat-card habits-stat-card--warning">
                        <div class="habits-stat-card__icon">
                            <i data-lucide="flame"></i>
                        </div>
                        <div class="habits-stat-card__info">
                            <span class="habits-stat-card__value">${bestStreak}</span>
                            <span class="habits-stat-card__label">Current Streak</span>
                        </div>
                    </div>
                    <div class="habits-stat-card habits-stat-card--success">
                        <div class="habits-stat-card__icon">
                            <i data-lucide="check-circle-2"></i>
                        </div>
                        <div class="habits-stat-card__info">
                            <span class="habits-stat-card__value">${totalCompletions}</span>
                            <span class="habits-stat-card__label">Completions</span>
                        </div>
                    </div>
                    <div class="habits-stat-card habits-stat-card--info">
                        <div class="habits-stat-card__icon">
                            <i data-lucide="trophy"></i>
                        </div>
                        <div class="habits-stat-card__info">
                            <span class="habits-stat-card__value">${bestOverallStreak}</span>
                            <span class="habits-stat-card__label">Best Streak</span>
                        </div>
                    </div>
                </div>

                <div class="habits-page__nav">
                    <button class="habits-page__nav-btn" id="prevMonthBtn">
                        <i data-lucide="chevron-left"></i>
                    </button>
                    <span class="habits-page__month">${monthName}</span>
                    <button class="habits-page__nav-btn" id="nextMonthBtn">
                        <i data-lucide="chevron-right"></i>
                    </button>
                </div>

                <div class="habits-page__content">
                    ${habits.length === 0 ? `
                        <div class="habits-empty">
                            <i data-lucide="repeat"></i>
                            <p>No habits to track yet</p>
                            <button class="btn btn--primary" id="addFirstHabitBtn">
                                <i data-lucide="plus"></i>
                                Add Habit
                            </button>
                        </div>
                    ` : `
                        <!-- Desktop Table View (hidden on mobile) -->
                        <div class="habits-tracker habits-tracker--desktop">
                            <table class="habits-tracker__table">
                                <tbody>
                                    ${habits.map((habit, index) => {
                                        const cat = CATEGORIES[habit.category] || CATEGORIES.other;
                                        return `
                                            <tr class="habits-tracker__row1">
                                                <td class="habits-tracker__habit-name" rowspan="2">
                                                    <div class="habits-tracker__habit-info">
                                                        <span class="habits-tracker__habit-icon" style="color: ${cat.color}">
                                                            <i data-lucide="${habit.icon || 'circle'}"></i>
                                                        </span>
                                                        <span>${habit.name}</span>
                                                        ${habit.streak > 0 ? `<span class="habits-tracker__habit-streak"><i data-lucide="flame"></i>${habit.streak}</span>` : ''}
                                                    </div>
                                                </td>
                                                ${daysRow1.map(d => {
                                                    const dateStr = formatDateStr(year, month, d);
                                                    const dayLog = log[dateStr] || [];
                                                    const isCompleted = dayLog.includes(habit.id);
                                                    const isPastOrToday = new Date(year, month, d) <= new Date();
                                                    const isTodayCell = isToday(year, month, d);
                                                    const isRestDayCell = restDays[dateStr];
                                                    const isScheduled = isHabitScheduledForDate(habit, dateStr);

                                                    return `
                                                        <td class="habits-tracker__cell
                                                            ${isCompleted ? 'habits-tracker__cell--done' : ''}
                                                            ${isTodayCell ? 'habits-tracker__cell--today' : ''}
                                                            ${!isPastOrToday ? 'habits-tracker__cell--future' : ''}
                                                            ${isRestDayCell ? 'habits-tracker__cell--rest' : ''}
                                                            ${!isScheduled ? 'habits-tracker__cell--not-scheduled' : ''}"
                                                            data-date="${dateStr}"
                                                            data-habit-id="${habit.id}"
                                                            title="${getWeekday(d)} ${d}${isRestDayCell ? ' (Rest day)' : ''}${!isScheduled ? ' (Not scheduled)' : ''}"
                                                            ${isPastOrToday && isScheduled && !isRestDayCell ? 'data-clickable="true"' : ''}>
                                                            <span class="habits-tracker__day-label">
                                                                <span class="habits-tracker__weekday-abbr">${getWeekday(d)}</span>
                                                                <span class="habits-tracker__day-num">${d}</span>
                                                            </span>
                                                        </td>
                                                    `;
                                                }).join('')}
                                            </tr>
                                            <tr class="habits-tracker__row2 ${index === habits.length - 1 ? 'habits-tracker__row2--last' : ''}">
                                                ${daysRow2.map(d => {
                                                    if (d > daysInMonth) {
                                                        return `<td class="habits-tracker__cell habits-tracker__cell--disabled" title="${getWeekday(d)} ${d}"><span class="habits-tracker__day-label"><span class="habits-tracker__weekday-abbr">${getWeekday(d)}</span><span class="habits-tracker__day-num">${d}</span></span></td>`;
                                                    }
                                                    const dateStr = formatDateStr(year, month, d);
                                                    const dayLog = log[dateStr] || [];
                                                    const isCompleted = dayLog.includes(habit.id);
                                                    const isPastOrToday = new Date(year, month, d) <= new Date();
                                                    const isTodayCell = isToday(year, month, d);
                                                    const isRestDayCell = restDays[dateStr];
                                                    const isScheduled = isHabitScheduledForDate(habit, dateStr);

                                                    return `
                                                        <td class="habits-tracker__cell
                                                            ${isCompleted ? 'habits-tracker__cell--done' : ''}
                                                            ${isTodayCell ? 'habits-tracker__cell--today' : ''}
                                                            ${!isPastOrToday ? 'habits-tracker__cell--future' : ''}
                                                            ${isRestDayCell ? 'habits-tracker__cell--rest' : ''}
                                                            ${!isScheduled ? 'habits-tracker__cell--not-scheduled' : ''}"
                                                            data-date="${dateStr}"
                                                            data-habit-id="${habit.id}"
                                                            title="${getWeekday(d)} ${d}${isRestDayCell ? ' (Rest day)' : ''}${!isScheduled ? ' (Not scheduled)' : ''}"
                                                            ${isPastOrToday && isScheduled && !isRestDayCell ? 'data-clickable="true"' : ''}>
                                                            <span class="habits-tracker__day-label">
                                                                <span class="habits-tracker__weekday-abbr">${getWeekday(d)}</span>
                                                                <span class="habits-tracker__day-num">${d}</span>
                                                            </span>
                                                        </td>
                                                    `;
                                                }).join('')}
                                            </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>

                        <!-- Mobile Grid View (hidden on desktop) -->
                        <div class="habits-tracker habits-tracker--mobile">
                            ${habits.map(habit => {
                                const cat = CATEGORIES[habit.category] || CATEGORIES.other;
                                return `
                                    <div class="habits-mobile-habit">
                                        <div class="habits-mobile-habit__header">
                                            <span class="habits-mobile-habit__icon" style="color: ${cat.color}">
                                                <i data-lucide="${habit.icon || 'circle'}"></i>
                                            </span>
                                            <span class="habits-mobile-habit__name">${habit.name}</span>
                                            ${habit.streak > 0 ? `<span class="habits-mobile-habit__streak"><i data-lucide="flame"></i>${habit.streak}</span>` : ''}
                                        </div>
                                        <div class="habits-mobile-habit__grid">
                                            ${mobileRows.map(row => `
                                                <div class="habits-mobile-habit__row">
                                                    ${row.map(d => {
                                                        if (d > daysInMonth) {
                                                            return `<div class="habits-mobile-cell habits-mobile-cell--disabled">
                                                                <span class="habits-mobile-cell__weekday">${getWeekday(d)}</span>
                                                                <span class="habits-mobile-cell__day">${d}</span>
                                                            </div>`;
                                                        }
                                                        const dateStr = formatDateStr(year, month, d);
                                                        const dayLog = log[dateStr] || [];
                                                        const isCompleted = dayLog.includes(habit.id);
                                                        const isPastOrToday = new Date(year, month, d) <= new Date();
                                                        const isTodayCell = isToday(year, month, d);
                                                        const isRestDayCell = restDays[dateStr];
                                                        const isScheduled = isHabitScheduledForDate(habit, dateStr);

                                                        return `
                                                            <div class="habits-mobile-cell
                                                                ${isCompleted ? 'habits-mobile-cell--done' : ''}
                                                                ${isTodayCell ? 'habits-mobile-cell--today' : ''}
                                                                ${!isPastOrToday ? 'habits-mobile-cell--future' : ''}
                                                                ${isRestDayCell ? 'habits-mobile-cell--rest' : ''}
                                                                ${!isScheduled ? 'habits-mobile-cell--not-scheduled' : ''}"
                                                                data-date="${dateStr}"
                                                                data-habit-id="${habit.id}"
                                                                ${isPastOrToday && isScheduled && !isRestDayCell ? 'data-clickable="true"' : ''}>
                                                                <span class="habits-mobile-cell__weekday">${getWeekday(d)}</span>
                                                                <span class="habits-mobile-cell__day">${d}</span>
                                                            </div>
                                                        `;
                                                    }).join('')}
                                                </div>
                                            `).join('')}
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>

                        <div class="habits-page__summary">
                            <h3>This Month's Progress</h3>
                            <div class="habits-summary-cards">
                                ${habits.map(habit => {
                                    const cat = CATEGORIES[habit.category] || CATEGORIES.other;
                                    const { completions, scheduledDays } = countMonthlyCompletions(log, restDays, habit, year, month);
                                    const percentage = scheduledDays > 0 ? Math.round((completions / scheduledDays) * 100) : 0;
                                    return `
                                        <div class="habits-summary-card">
                                            <div class="habits-summary-card__icon" style="background: ${cat.color}20; color: ${cat.color}">
                                                <i data-lucide="${habit.icon || 'circle'}"></i>
                                            </div>
                                            <div class="habits-summary-card__info">
                                                <span class="habits-summary-card__name">${habit.name}</span>
                                                <span class="habits-summary-card__stats">
                                                    ${completions}/${scheduledDays} days (${percentage}%)
                                                    ${habit.streak > 0 ? `<span class="habits-summary-card__streak"><i data-lucide="flame"></i>${habit.streak}</span>` : ''}
                                                </span>
                                            </div>
                                            <div class="habits-summary-card__bar">
                                                <div class="habits-summary-card__progress" style="width: ${percentage}%; background: ${cat.color}"></div>
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>

                        ${archivedHabits.length > 0 ? `
                            <div class="habits-page__archived">
                                <button class="btn btn--ghost btn--sm" id="toggleArchivedBtn">
                                    <i data-lucide="archive"></i>
                                    Archived Habits (${archivedHabits.length})
                                    <i data-lucide="chevron-down"></i>
                                </button>
                                <div class="habits-archived-list" style="display: none;">
                                    ${archivedHabits.map(habit => `
                                        <div class="habits-archived-item">
                                            <div class="habits-archived-item__info">
                                                <i data-lucide="${habit.icon || 'circle'}"></i>
                                                <span>${habit.name}</span>
                                            </div>
                                            <div class="habits-archived-item__actions">
                                                <button class="btn btn--xs btn--ghost" data-restore="${habit.id}" title="Restore habit">
                                                    <i data-lucide="rotate-ccw"></i>
                                                    Restore
                                                </button>
                                                <button class="btn btn--xs btn--ghost btn--danger" data-delete-archived="${habit.id}" title="Delete permanently">
                                                    <i data-lucide="trash-2"></i>
                                                </button>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                    `}
                </div>
            </div>
        `;

        // Initialize icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Bind events
        bindStatsPageEvents(container, memberId, member, currentDate);
    }

    /**
     * Bind stats page events
     */
    function bindStatsPageEvents(container, memberId, member, currentDate) {
        // Back button
        document.getElementById('backToMemberBtn')?.addEventListener('click', () => {
            if (typeof Tabs !== 'undefined') {
                Tabs.switchTo(memberId);
            }
        });

        // Month navigation
        document.getElementById('prevMonthBtn')?.addEventListener('click', () => {
            const newDate = new Date(currentDate);
            newDate.setMonth(newDate.getMonth() - 1);
            renderStatsPage(container, memberId, member, newDate);
        });

        document.getElementById('nextMonthBtn')?.addEventListener('click', () => {
            const newDate = new Date(currentDate);
            newDate.setMonth(newDate.getMonth() + 1);
            renderStatsPage(container, memberId, member, newDate);
        });

        // Add first habit button
        document.getElementById('addFirstHabitBtn')?.addEventListener('click', () => {
            showManageHabitsModal(memberId, () => {
                renderStatsPage(container, memberId, member, currentDate);
            });
        });

        // Table cell clicks (toggle completion) - Desktop
        container.querySelectorAll('.habits-tracker__cell[data-clickable="true"]').forEach(cell => {
            cell.addEventListener('click', () => {
                const dateStr = cell.dataset.date;
                const habitId = cell.dataset.habitId;
                toggleHabitForDate(memberId, habitId, dateStr);
                renderStatsPage(container, memberId, member, currentDate);
            });
        });

        // Mobile cell clicks (toggle completion)
        container.querySelectorAll('.habits-mobile-cell[data-clickable="true"]').forEach(cell => {
            cell.addEventListener('click', () => {
                const dateStr = cell.dataset.date;
                const habitId = cell.dataset.habitId;
                toggleHabitForDate(memberId, habitId, dateStr);
                renderStatsPage(container, memberId, member, currentDate);
            });
        });

        // Toggle archived section
        document.getElementById('toggleArchivedBtn')?.addEventListener('click', () => {
            const list = container.querySelector('.habits-archived-list');
            if (list) {
                list.style.display = list.style.display === 'none' ? 'block' : 'none';
            }
        });

        // Restore archived habit
        container.querySelectorAll('[data-restore]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const habitId = btn.dataset.restore;
                const widgetData = getWidgetData(memberId);
                const habit = widgetData.archivedHabits?.find(h => h.id === habitId);

                const confirmed = await Modal.confirm(
                    `Restore "${habit?.name || 'this habit'}"? Your streak will be reset.`,
                    'Restore Habit'
                );

                if (confirmed) {
                    restoreHabit(memberId, habitId);
                    renderStatsPage(container, memberId, member, currentDate);
                }
            });
        });

        // Delete archived habit permanently
        container.querySelectorAll('[data-delete-archived]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const habitId = btn.dataset.deleteArchived;
                const widgetData = getWidgetData(memberId);
                const habit = widgetData.archivedHabits?.find(h => h.id === habitId);

                const confirmed = await Modal.confirm(
                    `Permanently delete "${habit?.name || 'this habit'}"? This cannot be undone and all historical data will be lost.`,
                    'Delete Habit'
                );

                if (confirmed) {
                    deleteArchivedHabit(memberId, habitId);
                    renderStatsPage(container, memberId, member, currentDate);
                }
            });
        });
    }

    /**
     * Toggle habit for a specific date
     */
    function toggleHabitForDate(memberId, habitId, dateStr) {
        const widgetData = getWidgetData(memberId);
        const dayLog = widgetData.log?.[dateStr] || [];

        let updatedLog;
        if (dayLog.includes(habitId)) {
            updatedLog = dayLog.filter(id => id !== habitId);
        } else {
            updatedLog = [...dayLog, habitId];
        }

        const updatedData = {
            ...widgetData,
            log: {
                ...widgetData.log,
                [dateStr]: updatedLog
            }
        };

        saveWidgetData(memberId, updatedData);
        updateStreaks(memberId);
    }

    /**
     * Show manage habits modal
     */
    function showManageHabitsModal(memberId, onClose = null) {
        renderManageHabitsContent(memberId, onClose);
    }

    /**
     * Generate the manage habits modal content HTML
     */
    function generateManageHabitsHTML(memberId) {
        const widgetData = getWidgetData(memberId);
        const habits = (widgetData.habits || []).filter(h => !h.archived);

        // Filter out suggestions that are already added
        const existingNames = habits.map(h => h.name.toLowerCase());
        const availableSuggestions = HABIT_SUGGESTIONS.filter(
            s => !existingNames.includes(s.name.toLowerCase())
        );

        // Group habits by category
        const habitsByCategory = {};
        habits.forEach(habit => {
            const cat = habit.category || 'other';
            if (!habitsByCategory[cat]) habitsByCategory[cat] = [];
            habitsByCategory[cat].push(habit);
        });

        return `
            <div class="manage-habits">
                <div class="manage-habits__section">
                    <h4>Your Habits</h4>
                    ${habits.length === 0 ? `
                        <p class="manage-habits__empty">No habits yet. Add some below!</p>
                    ` : `
                        <div class="manage-habits__list">
                            ${Object.entries(habitsByCategory).map(([catId, catHabits]) => {
                                const cat = CATEGORIES[catId] || CATEGORIES.other;
                                return `
                                    <div class="manage-habits__category">
                                        <div class="manage-habits__category-header" style="color: ${cat.color}">
                                            <i data-lucide="${cat.icon}"></i>
                                            <span>${cat.label}</span>
                                        </div>
                                        ${catHabits.map(habit => `
                                            <div class="manage-habits__item">
                                                <span class="manage-habits__item-icon" style="color: ${cat.color}">
                                                    <i data-lucide="${habit.icon || 'circle'}"></i>
                                                </span>
                                                <span class="manage-habits__item-name">${habit.name}</span>
                                                <span class="manage-habits__item-schedule">
                                                    ${SCHEDULES[habit.schedule]?.label || 'Daily'}
                                                </span>
                                                ${habit.streak > 0 ? `<span class="manage-habits__item-streak"><i data-lucide="flame"></i>${habit.streak}</span>` : ''}
                                                <button class="btn btn--icon btn--ghost btn--sm" data-edit="${habit.id}" title="Edit habit">
                                                    <i data-lucide="pencil"></i>
                                                </button>
                                                <button class="btn btn--icon btn--ghost btn--sm" data-archive="${habit.id}" title="Archive habit">
                                                    <i data-lucide="archive"></i>
                                                </button>
                                            </div>
                                        `).join('')}
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    `}
                </div>

                <div class="manage-habits__section">
                    <h4>Add New Habit</h4>
                    <div class="form-group" style="margin-bottom: var(--space-3);">
                        <label class="form-label">Habit Name</label>
                        <input type="text" class="form-input" id="newHabitName" placeholder="e.g., Drink water, Exercise..." autocomplete="off">
                    </div>
                    <div class="form-group" style="margin-bottom: var(--space-3);">
                        <label class="form-label">Icon</label>
                        <div class="icon-picker">
                            <input type="hidden" id="newHabitIcon" value="circle">
                            ${HABIT_ICONS.map(icon => `
                                <button type="button" class="icon-picker__icon ${icon === 'circle' ? 'icon-picker__icon--selected' : ''}"
                                        data-icon="${icon}" title="${icon}">
                                    <i data-lucide="${icon}"></i>
                                </button>
                            `).join('')}
                        </div>
                    </div>
                    <div class="manage-habits__add-form">
                        <div class="form-group" style="min-width: 140px; margin: 0;">
                            <label class="form-label">Category</label>
                            <select class="form-select" id="newHabitCategory">
                                ${Object.entries(CATEGORIES).map(([id, cat]) => `
                                    <option value="${id}">${cat.label}</option>
                                `).join('')}
                            </select>
                        </div>
                        <div class="form-group" style="min-width: 180px; margin: 0;">
                            <label class="form-label">Schedule</label>
                            <select class="form-select" id="newHabitSchedule">
                                ${Object.entries(SCHEDULES).map(([id, sched]) => `
                                    <option value="${id}">${sched.label}</option>
                                `).join('')}
                            </select>
                        </div>
                        <button class="btn btn--primary" id="addCustomHabitBtn" style="align-self: flex-end; white-space: nowrap;">
                            <i data-lucide="plus"></i>
                            Add
                        </button>
                    </div>
                    <div class="manage-habits__custom-days" id="customDaysContainer" style="display: none; margin-top: 16px;">
                        <label class="form-label">Select days:</label>
                        <div class="manage-habits__weekdays">
                            ${WEEKDAYS.map(day => `
                                <label class="manage-habits__weekday">
                                    <input type="checkbox" value="${day.index}" name="customDay">
                                    <span>${day.short}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                </div>

                ${availableSuggestions.length > 0 ? `
                    <div class="manage-habits__section">
                        <h4>Suggestions</h4>
                        <div class="manage-habits__suggestions">
                            ${availableSuggestions.map(suggestion => `
                                <button class="manage-habits__suggestion"
                                        data-add-suggestion="${suggestion.name}"
                                        data-icon="${suggestion.icon}"
                                        data-category="${suggestion.category}">
                                    <i data-lucide="${suggestion.icon}"></i>
                                    <span>${suggestion.name}</span>
                                </button>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Render the manage habits modal
     */
    function renderManageHabitsContent(memberId, onClose = null) {
        Modal.open({
            title: 'Manage Habits',
            content: generateManageHabitsHTML(memberId),
            size: 'large',
            footer: '<button class="btn btn--primary" data-modal-done>Done</button>'
        });

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        bindManageHabitsEvents(memberId, onClose);
    }

    /**
     * Refresh the modal content in-place (no close/reopen)
     */
    function refreshManageHabitsModal(memberId, onClose) {
        const modalContent = document.getElementById('modalContent');
        if (!modalContent) return;

        modalContent.innerHTML = generateManageHabitsHTML(memberId);

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        bindManageHabitsEvents(memberId, onClose);

        // Focus on input
        document.getElementById('newHabitName')?.focus();
    }

    /**
     * Bind events for manage habits modal
     */
    function bindManageHabitsEvents(memberId, onClose) {
        // Icon picker for new habit
        document.querySelectorAll('.manage-habits__section .icon-picker__icon').forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove selection from all icons
                document.querySelectorAll('.manage-habits__section .icon-picker__icon').forEach(b => {
                    b.classList.remove('icon-picker__icon--selected');
                });
                // Select clicked icon
                btn.classList.add('icon-picker__icon--selected');
                // Update hidden input
                const iconInput = document.getElementById('newHabitIcon');
                if (iconInput) {
                    iconInput.value = btn.dataset.icon;
                }
            });
        });

        // Show/hide custom days selector
        document.getElementById('newHabitSchedule')?.addEventListener('change', (e) => {
            const customDaysContainer = document.getElementById('customDaysContainer');
            if (customDaysContainer) {
                customDaysContainer.style.display = e.target.value === 'custom' ? 'block' : 'none';
            }
        });

        // Add custom habit
        const addCustomHabit = () => {
            const nameInput = document.getElementById('newHabitName');
            const iconInput = document.getElementById('newHabitIcon');
            const categorySelect = document.getElementById('newHabitCategory');
            const scheduleSelect = document.getElementById('newHabitSchedule');

            const name = nameInput?.value?.trim();
            const icon = iconInput?.value || 'circle';
            const category = categorySelect?.value || 'other';
            const schedule = scheduleSelect?.value || 'daily';

            if (!name) {
                Toast.error('Please enter a habit name');
                return;
            }

            let customDays = null;
            if (schedule === 'custom') {
                customDays = Array.from(document.querySelectorAll('input[name="customDay"]:checked'))
                    .map(cb => parseInt(cb.value));
                if (customDays.length === 0) {
                    Toast.error('Please select at least one day');
                    return;
                }
            }

            addHabit(memberId, name, icon, category, schedule, customDays);
            refreshManageHabitsModal(memberId, onClose);

            // Refresh widget immediately
            const widgetBody = document.getElementById('widget-habits');
            if (widgetBody) {
                renderWidget(widgetBody, memberId);
            }
        };

        document.getElementById('addCustomHabitBtn')?.addEventListener('click', addCustomHabit);
        document.getElementById('newHabitName')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addCustomHabit();
            }
        });

        // Add from suggestions
        document.querySelectorAll('[data-add-suggestion]').forEach(btn => {
            btn.addEventListener('click', () => {
                const name = btn.dataset.addSuggestion;
                const icon = btn.dataset.icon;
                const category = btn.dataset.category || 'other';
                addHabit(memberId, name, icon, category, 'daily', null);
                refreshManageHabitsModal(memberId, onClose);

                // Refresh widget immediately
                const widgetBody = document.getElementById('widget-habits');
                if (widgetBody) {
                    renderWidget(widgetBody, memberId);
                }
            });
        });

        // Edit habit
        document.querySelectorAll('[data-edit]').forEach(btn => {
            btn.addEventListener('click', () => {
                const habitId = btn.dataset.edit;
                showEditHabitModal(memberId, habitId, onClose);
            });
        });

        // Archive habit
        document.querySelectorAll('[data-archive]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const habitId = btn.dataset.archive;
                const habit = getWidgetData(memberId).habits.find(h => h.id === habitId);
                const confirmed = await Modal.confirm(
                    `Archive "${habit?.name || 'this habit'}"? You can restore it later from the stats page.`,
                    'Archive Habit'
                );
                if (confirmed) {
                    archiveHabit(memberId, habitId);
                    refreshManageHabitsModal(memberId, onClose);

                    // Refresh widget immediately
                    const widgetBody = document.getElementById('widget-habits');
                    if (widgetBody) {
                        renderWidget(widgetBody, memberId);
                    }
                }
            });
        });

        // Done button
        document.querySelector('[data-modal-done]')?.addEventListener('click', () => {
            Modal.close();
            // Refresh widget
            const widgetBody = document.getElementById('widget-habits');
            if (widgetBody) {
                renderWidget(widgetBody, memberId);
            }
            if (onClose) {
                onClose();
            }
        });
    }

    /**
     * Escape HTML attribute values to prevent XSS and broken HTML
     */
    function escapeAttr(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    /**
     * Show edit habit modal
     */
    function showEditHabitModal(memberId, habitId, onManageClose) {
        const widgetData = getWidgetData(memberId);
        const habit = widgetData.habits.find(h => h.id === habitId);

        if (!habit) {
            console.error('Habit not found!', habitId);
            return;
        }

        // Open edit modal directly (Modal.open cancels any pending cleanup)
        openEditHabitModalContent(memberId, habit, onManageClose);
    }

    /**
     * Open the actual edit habit modal content
     */
    function openEditHabitModalContent(memberId, habit, onManageClose) {
        const habitId = habit.id;
        const content = `
            <div class="edit-habit-form">
                <div class="form-group">
                    <label class="form-label">Habit Name</label>
                    <input type="text" class="form-input" id="editHabitName" value="${escapeAttr(habit.name)}">
                </div>
                <div class="form-group">
                    <label class="form-label">Icon</label>
                    <div class="icon-picker">
                        <input type="hidden" id="editHabitIcon" value="${habit.icon || 'circle'}">
                        ${HABIT_ICONS.map(icon => `
                            <button type="button" class="icon-picker__icon ${icon === (habit.icon || 'circle') ? 'icon-picker__icon--selected' : ''}"
                                    data-icon="${icon}" title="${icon}">
                                <i data-lucide="${icon}"></i>
                            </button>
                        `).join('')}
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Category</label>
                    <select class="form-select" id="editHabitCategory">
                        ${Object.entries(CATEGORIES).map(([id, cat]) => `
                            <option value="${id}" ${habit.category === id ? 'selected' : ''}>${cat.label}</option>
                        `).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Schedule</label>
                    <select class="form-select" id="editHabitSchedule">
                        ${Object.entries(SCHEDULES).map(([id, sched]) => `
                            <option value="${id}" ${habit.schedule === id ? 'selected' : ''}>${sched.label}</option>
                        `).join('')}
                    </select>
                </div>
                <div class="form-group" id="editCustomDaysContainer" style="display: ${habit.schedule === 'custom' ? 'block' : 'none'};">
                    <label class="form-label">Select days:</label>
                    <div class="manage-habits__weekdays">
                        ${WEEKDAYS.map(day => `
                            <label class="manage-habits__weekday">
                                <input type="checkbox" value="${day.index}" name="editCustomDay"
                                       ${habit.customDays?.includes(day.index) ? 'checked' : ''}>
                                <span>${day.short}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>
                <div class="edit-habit-form__stats">
                    <div class="edit-habit-form__stat">
                        <span class="edit-habit-form__stat-value">${habit.streak || 0}</span>
                        <span class="edit-habit-form__stat-label">Current Streak</span>
                    </div>
                    <div class="edit-habit-form__stat">
                        <span class="edit-habit-form__stat-value">${habit.bestStreak || 0}</span>
                        <span class="edit-habit-form__stat-label">Best Streak</span>
                    </div>
                </div>
            </div>
        `;

        Modal.open({
            title: 'Edit Habit',
            content,
            footer: `
                <button class="btn btn--ghost" data-modal-cancel>Cancel</button>
                <button class="btn btn--danger" id="deleteHabitBtn">Delete</button>
                <button class="btn btn--primary" id="saveHabitBtn">Save</button>
            `
        });

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Icon picker for edit habit
        document.querySelectorAll('.edit-habit-form .icon-picker__icon').forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove selection from all icons
                document.querySelectorAll('.edit-habit-form .icon-picker__icon').forEach(b => {
                    b.classList.remove('icon-picker__icon--selected');
                });
                // Select clicked icon
                btn.classList.add('icon-picker__icon--selected');
                // Update hidden input
                const iconInput = document.getElementById('editHabitIcon');
                if (iconInput) {
                    iconInput.value = btn.dataset.icon;
                }
            });
        });

        // Show/hide custom days
        document.getElementById('editHabitSchedule')?.addEventListener('change', (e) => {
            const container = document.getElementById('editCustomDaysContainer');
            if (container) {
                container.style.display = e.target.value === 'custom' ? 'block' : 'none';
            }
        });

        // Save
        document.getElementById('saveHabitBtn')?.addEventListener('click', () => {
            const name = document.getElementById('editHabitName')?.value?.trim();
            const icon = document.getElementById('editHabitIcon')?.value || 'circle';
            const category = document.getElementById('editHabitCategory')?.value;
            const schedule = document.getElementById('editHabitSchedule')?.value;

            if (!name) {
                Toast.error('Please enter a habit name');
                return;
            }

            let customDays = null;
            if (schedule === 'custom') {
                customDays = Array.from(document.querySelectorAll('input[name="editCustomDay"]:checked'))
                    .map(cb => parseInt(cb.value));
                if (customDays.length === 0) {
                    Toast.error('Please select at least one day');
                    return;
                }
            }

            updateHabit(memberId, habitId, { name, icon, category, schedule, customDays });
            showManageHabitsModal(memberId, onManageClose);
        });

        // Delete
        document.getElementById('deleteHabitBtn')?.addEventListener('click', async () => {
            const confirmed = await Modal.dangerConfirm(
                `Permanently delete "${habit.name}"? This cannot be undone.`,
                'Delete Habit'
            );
            if (confirmed) {
                deleteHabit(memberId, habitId);
                showManageHabitsModal(memberId, onManageClose);
            }
        });

        // Cancel
        document.querySelector('[data-modal-cancel]')?.addEventListener('click', () => {
            showManageHabitsModal(memberId, onManageClose);
        });
    }

    /**
     * Add a new habit
     */
    function addHabit(memberId, name, icon, category = 'other', schedule = 'daily', customDays = null) {
        const widgetData = getWidgetData(memberId);
        const newHabit = {
            id: `hab-${Date.now()}`,
            name,
            icon: icon || 'circle',
            category,
            schedule,
            customDays,
            streak: 0,
            bestStreak: 0,
            archived: false
        };

        const updatedData = {
            ...widgetData,
            habits: [...(widgetData.habits || []), newHabit]
        };

        saveWidgetData(memberId, updatedData);
        Toast.success('Habit added!');
    }

    /**
     * Update a habit
     */
    function updateHabit(memberId, habitId, updates) {
        const widgetData = getWidgetData(memberId);
        const habits = widgetData.habits.map(h => {
            if (h.id === habitId) {
                return { ...h, ...updates };
            }
            return h;
        });

        saveWidgetData(memberId, { ...widgetData, habits });
        Toast.success('Habit updated!');
    }

    /**
     * Archive a habit
     */
    function archiveHabit(memberId, habitId) {
        const widgetData = getWidgetData(memberId);
        const habit = widgetData.habits.find(h => h.id === habitId);
        if (!habit) return;

        const updatedData = {
            ...widgetData,
            habits: widgetData.habits.filter(h => h.id !== habitId),
            archivedHabits: [...(widgetData.archivedHabits || []), { ...habit, archivedAt: new Date().toISOString() }]
        };

        saveWidgetData(memberId, updatedData);
        Toast.success('Habit archived');
    }

    /**
     * Restore an archived habit
     */
    function restoreHabit(memberId, habitId) {
        const widgetData = getWidgetData(memberId);
        const habit = widgetData.archivedHabits?.find(h => h.id === habitId);
        if (!habit) return;

        const { archivedAt, ...restoredHabit } = habit;
        restoredHabit.streak = 0; // Reset streak on restore

        const updatedData = {
            ...widgetData,
            habits: [...widgetData.habits, restoredHabit],
            archivedHabits: widgetData.archivedHabits.filter(h => h.id !== habitId)
        };

        saveWidgetData(memberId, updatedData);
        Toast.success('Habit restored!');
    }

    /**
     * Delete a habit permanently
     */
    function deleteHabit(memberId, habitId) {
        const widgetData = getWidgetData(memberId);
        const updatedData = {
            ...widgetData,
            habits: (widgetData.habits || []).filter(h => h.id !== habitId)
        };

        saveWidgetData(memberId, updatedData);
        Toast.success('Habit deleted');
    }

    /**
     * Delete an archived habit permanently
     */
    function deleteArchivedHabit(memberId, habitId) {
        const widgetData = getWidgetData(memberId);

        // Remove from archived habits
        const updatedData = {
            ...widgetData,
            archivedHabits: (widgetData.archivedHabits || []).filter(h => h.id !== habitId)
        };

        // Also clean up any log entries for this habit
        const log = { ...widgetData.log };
        Object.keys(log).forEach(dateKey => {
            if (log[dateKey]) {
                delete log[dateKey][habitId];
                // Remove date entry if empty
                if (Object.keys(log[dateKey]).length === 0) {
                    delete log[dateKey];
                }
            }
        });
        updatedData.log = log;

        saveWidgetData(memberId, updatedData);
        Toast.success('Habit permanently deleted');
    }

    // Helper functions
    function isToday(year, month, day) {
        const today = new Date();
        return today.getFullYear() === year &&
               today.getMonth() === month &&
               today.getDate() === day;
    }

    function formatDateStr(year, month, day) {
        const m = String(month + 1).padStart(2, '0');
        const d = String(day).padStart(2, '0');
        return `${year}-${m}-${d}`;
    }

    function countMonthlyCompletions(log, restDays, habit, year, month) {
        let completions = 0;
        let scheduledDays = 0;
        const today = new Date();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = formatDateStr(year, month, d);
            const date = new Date(year, month, d);

            // Only count days up to today
            if (date > today) continue;

            // Skip rest days
            if (restDays[dateStr]) continue;

            // Only count scheduled days
            if (!isHabitScheduledForDate(habit, dateStr)) continue;

            scheduledDays++;
            const dayLog = log[dateStr] || [];
            if (dayLog.includes(habit.id)) {
                completions++;
            }
        }

        return { completions, scheduledDays };
    }

    function init() {
        // Initialize habits feature
    }

    return {
        init,
        renderWidget,
        showStatsPage
    };
})();
