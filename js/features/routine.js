/**
 * Routine Feature
 * Flexible routine tracker with customizable frequencies
 * Supports daily, weekly, bi-weekly, monthly routines with reminders
 * Enhanced with time-of-day, snooze, streaks, categories, and more
 */

const Routine = (function() {
    // Frequency options
    const FREQUENCIES = {
        daily: { label: 'Daily', days: 1, icon: 'calendar' },
        twiceWeek: { label: 'Twice a week', days: 3, icon: 'calendar-range' },
        weekly: { label: 'Weekly', days: 7, icon: 'calendar-days' },
        biweekly: { label: 'Every 2 weeks', days: 14, icon: 'calendar-clock' },
        monthly: { label: 'Monthly', days: 30, icon: 'calendar-check' },
        custom: { label: 'Custom', days: null, icon: 'settings-2' }
    };

    // Time of day options
    const TIME_OF_DAY = {
        anytime: { label: 'Anytime', icon: 'clock', order: 0 },
        morning: { label: 'Morning', icon: 'sunrise', order: 1 },
        afternoon: { label: 'Afternoon', icon: 'sun', order: 2 },
        evening: { label: 'Evening', icon: 'sunset', order: 3 }
    };

    // Categories for grouping
    const CATEGORIES = {
        cleaning: { label: 'Cleaning', icon: 'sparkles', color: '#8B5CF6' },
        health: { label: 'Health', icon: 'heart', color: '#EF4444' },
        finance: { label: 'Finance', icon: 'wallet', color: '#10B981' },
        home: { label: 'Home', icon: 'home', color: '#3B82F6' },
        personal: { label: 'Personal', icon: 'user', color: '#F59E0B' },
        other: { label: 'Other', icon: 'folder', color: '#6B7280' }
    };

    // Weekday names
    const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Default routines by category
    const DEFAULT_ROUTINES = {
        adult: [
            { id: 'laundry', title: 'Do laundry', icon: 'shirt', frequency: 'weekly', color: '#3B82F6', category: 'cleaning', timeOfDay: 'morning' },
            { id: 'groceries', title: 'Grocery shopping', icon: 'shopping-cart', frequency: 'weekly', color: '#10B981', category: 'home', timeOfDay: 'afternoon' },
            { id: 'clean-bathroom', title: 'Clean bathroom', icon: 'bath', frequency: 'weekly', color: '#8B5CF6', category: 'cleaning', timeOfDay: 'morning' },
            { id: 'vacuum', title: 'Vacuum house', icon: 'wind', frequency: 'weekly', color: '#EC4899', category: 'cleaning', timeOfDay: 'anytime' },
            { id: 'change-sheets', title: 'Change bed sheets', icon: 'bed', frequency: 'biweekly', color: '#6366F1', category: 'cleaning', timeOfDay: 'morning' },
            { id: 'car-wash', title: 'Wash car', icon: 'car', frequency: 'biweekly', color: '#F59E0B', category: 'home', timeOfDay: 'afternoon' },
            { id: 'pay-bills', title: 'Pay bills', icon: 'credit-card', frequency: 'monthly', color: '#EF4444', category: 'finance', timeOfDay: 'evening' }
        ],
        kid: [
            { id: 'clean-room', title: 'Clean room', icon: 'home', frequency: 'weekly', color: '#3B82F6', category: 'cleaning', timeOfDay: 'morning' },
            { id: 'organize-toys', title: 'Organize toys', icon: 'blocks', frequency: 'weekly', color: '#10B981', category: 'cleaning', timeOfDay: 'afternoon' },
            { id: 'library', title: 'Return library books', icon: 'book', frequency: 'biweekly', color: '#8B5CF6', category: 'personal', timeOfDay: 'anytime' }
        ],
        toddler: []
    };

    // Quick-add suggestions for empty state
    const QUICK_ADD_SUGGESTIONS = [
        { title: 'Do laundry', icon: 'shirt', frequency: 'weekly', category: 'cleaning' },
        { title: 'Grocery shopping', icon: 'shopping-cart', frequency: 'weekly', category: 'home' },
        { title: 'Clean bathroom', icon: 'bath', frequency: 'weekly', category: 'cleaning' },
        { title: 'Pay bills', icon: 'credit-card', frequency: 'monthly', category: 'finance' },
        { title: 'Water plants', icon: 'flower-2', frequency: 'weekly', category: 'home' },
        { title: 'Exercise', icon: 'dumbbell', frequency: 'daily', category: 'health' }
    ];

    // Category colors for visual grouping
    const ROUTINE_COLORS = [
        '#3B82F6', '#10B981', '#8B5CF6', '#EC4899',
        '#F59E0B', '#EF4444', '#6366F1', '#14B8A6'
    ];

    /**
     * Get widget data with defaults
     */
    function getWidgetData(memberId) {
        const member = Storage.getMember(memberId);
        const memberType = member?.type || 'adult';
        const storedData = Storage.getWidgetData(memberId, 'routine') || {};

        // Initialize with defaults if no routines exist
        if (!storedData.routines || storedData.routines.length === 0) {
            const defaults = DEFAULT_ROUTINES[memberType] || DEFAULT_ROUTINES.adult;
            storedData.routines = defaults.map(r => ({
                ...r,
                id: `routine-${r.id}-${Date.now()}`,
                lastCompleted: null,
                createdAt: new Date().toISOString(),
                streak: 0,
                bestStreak: 0,
                notes: '',
                snoozedUntil: null,
                customDays: null,
                specificWeekdays: null
            }));
            Storage.setWidgetData(memberId, 'routine', storedData);
        }

        return {
            routines: storedData.routines || [],
            completionLog: storedData.completionLog || {}
        };
    }

    /**
     * Save widget data
     */
    function saveWidgetData(memberId, data) {
        Storage.setWidgetData(memberId, 'routine', data);
    }

    /**
     * Calculate days since last completion
     */
    function getDaysSinceLastDone(routine) {
        if (!routine.lastCompleted) return null;
        const last = new Date(routine.lastCompleted);
        const today = new Date();
        const diffTime = today - last;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }

    /**
     * Get frequency days (handles custom frequencies)
     */
    function getFrequencyDays(routine) {
        if (routine.frequency === 'custom' && routine.customDays) {
            return routine.customDays;
        }
        return FREQUENCIES[routine.frequency]?.days || 7;
    }

    /**
     * Check if routine is snoozed
     */
    function isSnoozed(routine) {
        if (!routine.snoozedUntil) return false;
        const today = DateUtils.today();
        return routine.snoozedUntil > today;
    }

    /**
     * Check if routine is due (or overdue)
     */
    function getRoutineStatus(routine) {
        // Check if snoozed
        if (isSnoozed(routine)) {
            const snoozeDays = Math.ceil((new Date(routine.snoozedUntil) - new Date()) / (1000 * 60 * 60 * 24));
            return {
                status: 'snoozed',
                message: `Snoozed ${snoozeDays} day${snoozeDays > 1 ? 's' : ''}`,
                urgent: false
            };
        }

        const daysSince = getDaysSinceLastDone(routine);
        const freqDays = getFrequencyDays(routine);

        if (daysSince === null) {
            return { status: 'new', message: 'Never done', urgent: false };
        }

        if (daysSince === 0) {
            return { status: 'done', message: 'Done today', urgent: false };
        }

        const daysUntilDue = freqDays - daysSince;

        if (daysUntilDue <= 0) {
            const overdueDays = Math.abs(daysUntilDue);
            return {
                status: 'overdue',
                message: overdueDays === 0 ? 'Due today' : `${overdueDays} day${overdueDays > 1 ? 's' : ''} overdue`,
                urgent: true,
                overdueDays
            };
        }

        if (daysUntilDue <= 1) {
            return { status: 'due-soon', message: 'Due tomorrow', urgent: true };
        }

        if (daysUntilDue <= 2) {
            return { status: 'upcoming', message: `Due in ${daysUntilDue} days`, urgent: false };
        }

        return {
            status: 'ok',
            message: `${daysSince} day${daysSince > 1 ? 's' : ''} ago`,
            urgent: false
        };
    }

    /**
     * Calculate streak for a routine
     */
    function calculateStreak(routine, completionLog) {
        if (!routine.lastCompleted) return 0;

        const freqDays = getFrequencyDays(routine);
        let streak = 0;
        let checkDate = new Date();

        // Go backwards checking if routine was done within expected timeframe
        while (true) {
            const dateStr = DateUtils.formatISO(checkDate);
            const dayLog = completionLog[dateStr] || [];
            const wasDone = dayLog.some(log => log.routineId === routine.id);

            if (wasDone) {
                streak++;
                // Move back by frequency days
                checkDate = DateUtils.addDays(checkDate, -freqDays);
            } else {
                // Check if we're within grace period (frequency days from last completion)
                const daysSinceLast = getDaysSinceLastDone(routine);
                if (daysSinceLast !== null && daysSinceLast <= freqDays) {
                    // Still within grace, count from last completed
                    break;
                } else {
                    break;
                }
            }

            // Safety: don't go back more than a year
            if (streak > 52) break;
        }

        return streak;
    }

    /**
     * Show completion celebration animation
     */
    function showCompletionAnimation(routine) {
        const overlay = document.createElement('div');
        overlay.className = 'routine-celebration';
        overlay.innerHTML = `
            <div class="routine-celebration__content">
                <div class="routine-celebration__icon" style="--routine-color: ${routine.color || '#6366F1'}">
                    <i data-lucide="check-circle-2"></i>
                </div>
                <div class="routine-celebration__text">Done!</div>
                ${routine.streak > 1 ? `<div class="routine-celebration__streak">${routine.streak} in a row!</div>` : ''}
            </div>
        `;

        document.body.appendChild(overlay);

        if (typeof lucide !== 'undefined') lucide.createIcons();

        setTimeout(() => {
            overlay.classList.add('routine-celebration--fade');
            setTimeout(() => overlay.remove(), 300);
        }, 1200);
    }

    /**
     * Mark routine as done
     */
    function markDone(memberId, routineId, showAnimation = true) {
        const data = getWidgetData(memberId);
        const routineIndex = data.routines.findIndex(r => r.id === routineId);

        if (routineIndex === -1) return false;

        const routine = data.routines[routineIndex];
        const now = new Date().toISOString();
        const today = DateUtils.today();

        // Calculate streak before updating
        const prevStreak = routine.streak || 0;

        // Update routine's last completed
        data.routines[routineIndex].lastCompleted = now;
        data.routines[routineIndex].snoozedUntil = null; // Clear snooze when done

        // Update streak
        const freqDays = getFrequencyDays(routine);
        const daysSince = getDaysSinceLastDone(routine);

        if (daysSince === null || daysSince <= freqDays + 1) {
            // Increment streak if done on time (with 1 day grace)
            data.routines[routineIndex].streak = prevStreak + 1;
        } else {
            // Reset streak if too late
            data.routines[routineIndex].streak = 1;
        }

        // Update best streak
        if (data.routines[routineIndex].streak > (data.routines[routineIndex].bestStreak || 0)) {
            data.routines[routineIndex].bestStreak = data.routines[routineIndex].streak;
        }

        // Add to completion log
        if (!data.completionLog[today]) {
            data.completionLog[today] = [];
        }
        data.completionLog[today].push({
            routineId,
            completedAt: now
        });

        saveWidgetData(memberId, data);

        // Show celebration animation
        if (showAnimation) {
            showCompletionAnimation(data.routines[routineIndex]);
        }

        return true;
    }

    /**
     * Snooze a routine
     */
    function snoozeRoutine(memberId, routineId, days = 1) {
        const data = getWidgetData(memberId);
        const routineIndex = data.routines.findIndex(r => r.id === routineId);

        if (routineIndex === -1) return false;

        const snoozeDate = DateUtils.addDays(new Date(), days);
        data.routines[routineIndex].snoozedUntil = DateUtils.formatISO(snoozeDate);
        saveWidgetData(memberId, data);

        return true;
    }

    /**
     * Skip a routine (mark as done without affecting streak)
     */
    function skipRoutine(memberId, routineId) {
        const data = getWidgetData(memberId);
        const routineIndex = data.routines.findIndex(r => r.id === routineId);

        if (routineIndex === -1) return false;

        // Reset the "clock" without counting as a completion
        const freqDays = getFrequencyDays(data.routines[routineIndex]);
        const skipDate = DateUtils.addDays(new Date(), -freqDays + 1);
        data.routines[routineIndex].lastCompleted = skipDate.toISOString();
        data.routines[routineIndex].snoozedUntil = null;

        saveWidgetData(memberId, data);
        return true;
    }

    /**
     * Mark all overdue as done
     */
    function markAllOverdueDone(memberId) {
        const data = getWidgetData(memberId);
        let count = 0;

        data.routines.forEach((routine, index) => {
            const status = getRoutineStatus(routine);
            if (status.status === 'overdue') {
                markDone(memberId, routine.id, false);
                count++;
            }
        });

        return count;
    }

    /**
     * Sort routines by urgency
     */
    function sortRoutines(routines) {
        return [...routines].sort((a, b) => {
            const statusA = getRoutineStatus(a);
            const statusB = getRoutineStatus(b);

            // Priority: overdue > due-soon > new > upcoming > ok > snoozed > done
            const priority = { 'overdue': 0, 'due-soon': 1, 'new': 2, 'upcoming': 3, 'ok': 4, 'snoozed': 5, 'done': 6 };
            return (priority[statusA.status] || 6) - (priority[statusB.status] || 6);
        });
    }

    /**
     * Sort routines by time of day
     */
    function sortByTimeOfDay(routines) {
        return [...routines].sort((a, b) => {
            const orderA = TIME_OF_DAY[a.timeOfDay || 'anytime']?.order || 0;
            const orderB = TIME_OF_DAY[b.timeOfDay || 'anytime']?.order || 0;
            return orderA - orderB;
        });
    }

    /**
     * Group routines by category
     */
    function groupByCategory(routines) {
        const groups = {};
        routines.forEach(routine => {
            const cat = routine.category || 'other';
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(routine);
        });
        return groups;
    }

    /**
     * Group routines by time of day
     */
    function groupByTimeOfDay(routines) {
        const groups = {};
        routines.forEach(routine => {
            const time = routine.timeOfDay || 'anytime';
            if (!groups[time]) groups[time] = [];
            groups[time].push(routine);
        });
        return groups;
    }

    /**
     * Render the widget
     */
    function renderWidget(container, memberId) {
        const data = getWidgetData(memberId);
        const routines = sortRoutines(data.routines);

        // Count stats
        const overdueCount = routines.filter(r => getRoutineStatus(r).status === 'overdue').length;
        const dueSoonCount = routines.filter(r => getRoutineStatus(r).status === 'due-soon').length;
        const doneToday = routines.filter(r => getRoutineStatus(r).status === 'done').length;
        const snoozedCount = routines.filter(r => getRoutineStatus(r).status === 'snoozed').length;
        const totalActive = routines.length - snoozedCount;

        // Empty state with suggestions
        if (routines.length === 0) {
            container.innerHTML = `
                <div class="routine-widget routine-widget--empty">
                    <div class="routine-widget__empty-state">
                        <div class="routine-widget__empty-icon">
                            <i data-lucide="list-checks"></i>
                        </div>
                        <h4>Track your recurring tasks</h4>
                        <p>Never forget important routines again</p>

                        <div class="routine-widget__suggestions">
                            <span class="routine-widget__suggestions-label">Quick add:</span>
                            <div class="routine-widget__suggestion-chips">
                                ${QUICK_ADD_SUGGESTIONS.slice(0, 4).map(s => `
                                    <button class="routine-suggestion-chip" data-quick-add='${JSON.stringify(s)}'>
                                        <i data-lucide="${s.icon}"></i>
                                        ${s.title}
                                    </button>
                                `).join('')}
                            </div>
                        </div>

                        <button class="btn btn--sm btn--primary" data-action="add">
                            <i data-lucide="plus"></i>
                            Custom Routine
                        </button>
                    </div>
                </div>
            `;
            if (typeof lucide !== 'undefined') lucide.createIcons();

            // Quick add buttons
            container.querySelectorAll('[data-quick-add]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const suggestion = JSON.parse(btn.dataset.quickAdd);
                    quickAddRoutine(memberId, suggestion);
                    renderWidget(container, memberId);
                });
            });

            container.querySelector('[data-action="add"]')?.addEventListener('click', () => {
                showAddModal(memberId, () => renderWidget(container, memberId));
            });
            return;
        }

        // Get routines for widget (prioritized by urgency, max 4 for compact view)
        const displayRoutines = routines.filter(r => getRoutineStatus(r).status !== 'snoozed').slice(0, 4);

        container.innerHTML = `
            <div class="routine-widget">
                <!-- Stats header -->
                <div class="routine-widget__stats-bar">
                    <div class="routine-widget__stat ${overdueCount > 0 ? 'routine-widget__stat--alert' : ''}">
                        <i data-lucide="alert-circle"></i>
                        <span>${overdueCount}</span>
                    </div>
                    <div class="routine-widget__stat ${dueSoonCount > 0 ? 'routine-widget__stat--warning' : ''}">
                        <i data-lucide="clock"></i>
                        <span>${dueSoonCount}</span>
                    </div>
                    <div class="routine-widget__stat routine-widget__stat--success">
                        <i data-lucide="check-circle-2"></i>
                        <span>${doneToday}/${totalActive}</span>
                    </div>
                </div>

                ${overdueCount > 0 ? `
                    <div class="routine-widget__alert routine-widget__alert--overdue">
                        <div class="routine-widget__alert-content">
                            <i data-lucide="alert-circle"></i>
                            <span>${overdueCount} overdue</span>
                        </div>
                        <button class="routine-widget__alert-action" data-action="mark-all-overdue" title="Mark all overdue as done">
                            <i data-lucide="check-check"></i>
                        </button>
                    </div>
                ` : dueSoonCount > 0 ? `
                    <div class="routine-widget__alert routine-widget__alert--upcoming">
                        <i data-lucide="clock"></i>
                        <span>${dueSoonCount} due soon</span>
                    </div>
                ` : ''}

                <div class="routine-widget__list">
                    ${displayRoutines.map(routine => {
                        const status = getRoutineStatus(routine);
                        const streak = routine.streak || 0;
                        const timeIcon = TIME_OF_DAY[routine.timeOfDay || 'anytime']?.icon || 'clock';

                        return `
                            <div class="routine-item routine-item--${status.status}" data-routine-id="${routine.id}">
                                <div class="routine-item__icon" style="--routine-color: ${routine.color || '#6366F1'}">
                                    <i data-lucide="${routine.icon || 'check'}"></i>
                                </div>
                                <div class="routine-item__info">
                                    <span class="routine-item__title">${routine.title}</span>
                                    <span class="routine-item__meta">
                                        <span class="routine-item__status">${status.message}</span>
                                        ${streak > 1 ? `<span class="routine-item__streak" title="${streak} in a row"><i data-lucide="flame"></i>${streak}</span>` : ''}
                                    </span>
                                </div>
                                <div class="routine-item__actions">
                                    ${status.status !== 'done' ? `
                                        <button class="routine-item__snooze btn btn--icon btn--xs btn--ghost"
                                                data-snooze="${routine.id}" title="Snooze 1 day">
                                            <i data-lucide="alarm-clock-off"></i>
                                        </button>
                                    ` : ''}
                                    <button class="routine-item__check btn btn--icon btn--sm ${status.status === 'done' ? 'btn--success' : 'btn--ghost'}"
                                            data-mark-done="${routine.id}" ${status.status === 'done' ? 'disabled' : ''}>
                                        <i data-lucide="${status.status === 'done' ? 'check-circle-2' : 'circle'}"></i>
                                    </button>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>

                ${routines.length > 4 ? `
                    <div class="routine-widget__more">
                        +${routines.length - 4} more routines
                    </div>
                ` : ''}

                <div class="routine-widget__footer">
                    <button class="btn btn--sm btn--ghost" data-action="view-all">
                        <i data-lucide="list"></i>
                        View All
                    </button>
                    <button class="btn btn--sm btn--ghost" data-action="add">
                        <i data-lucide="plus"></i>
                        Add
                    </button>
                </div>
            </div>
        `;

        if (typeof lucide !== 'undefined') lucide.createIcons();
        bindWidgetEvents(container, memberId);
    }

    /**
     * Quick add routine from suggestion
     */
    function quickAddRoutine(memberId, suggestion) {
        const data = getWidgetData(memberId);
        const colorIndex = data.routines.length % ROUTINE_COLORS.length;

        const newRoutine = {
            id: `routine-${Date.now()}`,
            title: suggestion.title,
            frequency: suggestion.frequency || 'weekly',
            icon: suggestion.icon || 'check',
            color: ROUTINE_COLORS[colorIndex],
            category: suggestion.category || 'other',
            timeOfDay: 'anytime',
            lastCompleted: null,
            createdAt: new Date().toISOString(),
            streak: 0,
            bestStreak: 0,
            notes: '',
            snoozedUntil: null
        };

        data.routines.push(newRoutine);
        saveWidgetData(memberId, data);
        Toast.success(`Added "${suggestion.title}"`);
    }

    /**
     * Bind widget events
     */
    function bindWidgetEvents(container, memberId) {
        // Mark done buttons
        container.querySelectorAll('[data-mark-done]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const routineId = btn.dataset.markDone;
                markDone(memberId, routineId);
                renderWidget(container, memberId);
            });
        });

        // Snooze buttons
        container.querySelectorAll('[data-snooze]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const routineId = btn.dataset.snooze;
                snoozeRoutine(memberId, routineId, 1);
                renderWidget(container, memberId);
                Toast.success('Snoozed for 1 day');
            });
        });

        // Mark all overdue
        container.querySelector('[data-action="mark-all-overdue"]')?.addEventListener('click', (e) => {
            e.stopPropagation();
            const count = markAllOverdueDone(memberId);
            renderWidget(container, memberId);
            Toast.success(`Marked ${count} as done`);
        });

        // Routine item click - show details
        container.querySelectorAll('.routine-item').forEach(item => {
            item.addEventListener('click', () => {
                const routineId = item.dataset.routineId;
                showRoutineDetail(memberId, routineId, () => renderWidget(container, memberId));
            });
        });

        // View all
        container.querySelector('[data-action="view-all"]')?.addEventListener('click', () => {
            showRoutinesPage(memberId);
        });

        // Add button
        container.querySelector('[data-action="add"]')?.addEventListener('click', () => {
            showAddModal(memberId, () => renderWidget(container, memberId));
        });
    }

    /**
     * Show full routines page
     */
    function showRoutinesPage(memberId) {
        const main = document.getElementById('mainContent');
        if (!main) return;

        const member = Storage.getMember(memberId);
        const data = getWidgetData(memberId);
        const routines = sortRoutines(data.routines);

        // Group by status
        const overdue = routines.filter(r => getRoutineStatus(r).status === 'overdue');
        const dueSoon = routines.filter(r => ['due-soon', 'new'].includes(getRoutineStatus(r).status));
        const upcoming = routines.filter(r => ['upcoming', 'ok'].includes(getRoutineStatus(r).status));
        const done = routines.filter(r => getRoutineStatus(r).status === 'done');
        const snoozed = routines.filter(r => getRoutineStatus(r).status === 'snoozed');

        // Calculate completion stats
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const d = DateUtils.addDays(new Date(), -i);
            const dateStr = DateUtils.formatISO(d);
            const dayCompletions = data.completionLog[dateStr] || [];
            last7Days.push({
                date: dateStr,
                dayName: WEEKDAYS[d.getDay()],
                count: dayCompletions.length
            });
        }
        const maxCompletions = Math.max(...last7Days.map(d => d.count), 1);

        main.innerHTML = `
            <div class="routines-page">
                <div class="routines-page__header">
                    <button class="btn btn--ghost" id="backBtn">
                        <i data-lucide="arrow-left"></i>
                        Back to ${member?.name || 'Dashboard'}
                    </button>
                    <h1 class="routines-page__title">
                        <i data-lucide="list-checks"></i>
                        Routines
                    </h1>
                    <button class="btn btn--primary" id="addRoutineBtn">
                        <i data-lucide="plus"></i>
                        Add
                    </button>
                </div>

                <!-- Completion heatmap -->
                <div class="routines-page__heatmap">
                    <div class="routines-heatmap__title">
                        <i data-lucide="activity"></i>
                        Last 7 Days
                    </div>
                    <div class="routines-heatmap__bars">
                        ${last7Days.map(day => `
                            <div class="routines-heatmap__day">
                                <div class="routines-heatmap__bar-container">
                                    <div class="routines-heatmap__bar"
                                         style="height: ${(day.count / maxCompletions) * 100}%"
                                         title="${day.count} completed"></div>
                                </div>
                                <span class="routines-heatmap__label">${day.dayName}</span>
                                <span class="routines-heatmap__count">${day.count}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                ${overdue.length > 0 ? `
                    <div class="routines-page__batch-action">
                        <button class="btn btn--sm btn--secondary" id="markAllOverdueBtn">
                            <i data-lucide="check-check"></i>
                            Mark All ${overdue.length} Overdue as Done
                        </button>
                    </div>
                ` : ''}

                <div class="routines-page__content">
                    ${overdue.length > 0 ? `
                        <div class="routines-section routines-section--overdue">
                            <h3 class="routines-section__title">
                                <i data-lucide="alert-circle"></i>
                                Overdue (${overdue.length})
                            </h3>
                            <div class="routines-section__list">
                                ${renderRoutineCards(overdue, memberId, data.completionLog)}
                            </div>
                        </div>
                    ` : ''}

                    ${dueSoon.length > 0 ? `
                        <div class="routines-section routines-section--due-soon">
                            <h3 class="routines-section__title">
                                <i data-lucide="clock"></i>
                                Due Soon (${dueSoon.length})
                            </h3>
                            <div class="routines-section__list">
                                ${renderRoutineCards(dueSoon, memberId, data.completionLog)}
                            </div>
                        </div>
                    ` : ''}

                    ${upcoming.length > 0 ? `
                        <div class="routines-section routines-section--upcoming">
                            <h3 class="routines-section__title">
                                <i data-lucide="calendar"></i>
                                Upcoming (${upcoming.length})
                            </h3>
                            <div class="routines-section__list">
                                ${renderRoutineCards(upcoming, memberId, data.completionLog)}
                            </div>
                        </div>
                    ` : ''}

                    ${done.length > 0 ? `
                        <div class="routines-section routines-section--done">
                            <h3 class="routines-section__title">
                                <i data-lucide="check-circle-2"></i>
                                Done Today (${done.length})
                            </h3>
                            <div class="routines-section__list">
                                ${renderRoutineCards(done, memberId, data.completionLog)}
                            </div>
                        </div>
                    ` : ''}

                    ${snoozed.length > 0 ? `
                        <div class="routines-section routines-section--snoozed">
                            <h3 class="routines-section__title">
                                <i data-lucide="alarm-clock-off"></i>
                                Snoozed (${snoozed.length})
                            </h3>
                            <div class="routines-section__list">
                                ${renderRoutineCards(snoozed, memberId, data.completionLog)}
                            </div>
                        </div>
                    ` : ''}

                    ${routines.length === 0 ? `
                        <div class="routines-page__empty">
                            <i data-lucide="list-plus"></i>
                            <h3>No routines yet</h3>
                            <p>Add your recurring tasks to keep track of them</p>
                            <button class="btn btn--primary" id="addFirstBtn">
                                <i data-lucide="plus"></i>
                                Add Your First Routine
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        if (typeof lucide !== 'undefined') lucide.createIcons();

        // Bind events
        document.getElementById('backBtn')?.addEventListener('click', () => {
            State.emit('tabChanged', memberId);
        });

        document.getElementById('addRoutineBtn')?.addEventListener('click', () => {
            showAddModal(memberId, () => showRoutinesPage(memberId));
        });

        document.getElementById('addFirstBtn')?.addEventListener('click', () => {
            showAddModal(memberId, () => showRoutinesPage(memberId));
        });

        document.getElementById('markAllOverdueBtn')?.addEventListener('click', () => {
            const count = markAllOverdueDone(memberId);
            Toast.success(`Marked ${count} routines as done`);
            showRoutinesPage(memberId);
        });

        // Routine card events
        bindRoutineCardEvents(main, memberId, () => showRoutinesPage(memberId));
    }

    /**
     * Render routine cards
     */
    function renderRoutineCards(routines, memberId, completionLog) {
        return routines.map(routine => {
            const status = getRoutineStatus(routine);
            const freqData = FREQUENCIES[routine.frequency] || FREQUENCIES.weekly;
            const freqLabel = routine.frequency === 'custom' ? `Every ${routine.customDays} days` : freqData.label;
            const streak = routine.streak || 0;
            const bestStreak = routine.bestStreak || 0;
            const timeData = TIME_OF_DAY[routine.timeOfDay || 'anytime'];
            const catData = CATEGORIES[routine.category || 'other'];

            return `
                <div class="routine-card routine-card--${status.status}" data-routine-id="${routine.id}" style="--routine-color: ${routine.color || '#6366F1'}">
                    <div class="routine-card__icon">
                        <i data-lucide="${routine.icon || 'check'}"></i>
                    </div>
                    <div class="routine-card__content">
                        <h4 class="routine-card__title">${routine.title}</h4>
                        <div class="routine-card__meta">
                            <span class="routine-card__frequency">
                                <i data-lucide="${freqData.icon}"></i>
                                ${freqLabel}
                            </span>
                            <span class="routine-card__time">
                                <i data-lucide="${timeData.icon}"></i>
                                ${timeData.label}
                            </span>
                            <span class="routine-card__status routine-card__status--${status.status}">${status.message}</span>
                        </div>
                        ${streak > 0 || bestStreak > 0 ? `
                            <div class="routine-card__streaks">
                                ${streak > 0 ? `<span class="routine-card__streak"><i data-lucide="flame"></i> ${streak} current</span>` : ''}
                                ${bestStreak > streak && bestStreak > 0 ? `<span class="routine-card__best-streak"><i data-lucide="trophy"></i> ${bestStreak} best</span>` : ''}
                            </div>
                        ` : ''}
                        ${routine.notes ? `<p class="routine-card__notes">${routine.notes}</p>` : ''}
                    </div>
                    <div class="routine-card__actions">
                        ${status.status !== 'done' && status.status !== 'snoozed' ? `
                            <button class="btn btn--icon btn--ghost" data-snooze-menu="${routine.id}" title="Snooze">
                                <i data-lucide="alarm-clock-off"></i>
                            </button>
                            <button class="btn btn--icon btn--ghost" data-skip="${routine.id}" title="Skip this time">
                                <i data-lucide="skip-forward"></i>
                            </button>
                        ` : ''}
                        ${status.status === 'snoozed' ? `
                            <button class="btn btn--icon btn--ghost" data-unsnooze="${routine.id}" title="Unsnooze">
                                <i data-lucide="alarm-clock"></i>
                            </button>
                        ` : ''}
                        <button class="btn btn--icon ${status.status === 'done' ? 'btn--success' : 'btn--primary'}"
                                data-mark-done="${routine.id}" ${status.status === 'done' ? 'disabled' : ''}>
                            <i data-lucide="${status.status === 'done' ? 'check-circle-2' : 'check'}"></i>
                        </button>
                        <button class="btn btn--icon btn--ghost" data-edit="${routine.id}">
                            <i data-lucide="pencil"></i>
                        </button>
                        <button class="btn btn--icon btn--ghost routine-card__delete" data-delete="${routine.id}">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Bind routine card events
     */
    function bindRoutineCardEvents(container, memberId, refreshCallback) {
        // Mark done
        container.querySelectorAll('[data-mark-done]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const routineId = btn.dataset.markDone;
                markDone(memberId, routineId);
                if (refreshCallback) refreshCallback();
            });
        });

        // Snooze menu
        container.querySelectorAll('[data-snooze-menu]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const routineId = btn.dataset.snoozeMenu;
                showSnoozeMenu(memberId, routineId, btn, refreshCallback);
            });
        });

        // Skip
        container.querySelectorAll('[data-skip]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const routineId = btn.dataset.skip;
                skipRoutine(memberId, routineId);
                Toast.success('Skipped this time');
                if (refreshCallback) refreshCallback();
            });
        });

        // Unsnooze
        container.querySelectorAll('[data-unsnooze]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const routineId = btn.dataset.unsnooze;
                const data = getWidgetData(memberId);
                const idx = data.routines.findIndex(r => r.id === routineId);
                if (idx !== -1) {
                    data.routines[idx].snoozedUntil = null;
                    saveWidgetData(memberId, data);
                    Toast.success('Unsnzoed');
                    if (refreshCallback) refreshCallback();
                }
            });
        });

        // Edit
        container.querySelectorAll('[data-edit]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const routineId = btn.dataset.edit;
                showEditModal(memberId, routineId, refreshCallback);
            });
        });

        // Delete
        container.querySelectorAll('[data-delete]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const routineId = btn.dataset.delete;
                if (confirm('Delete this routine?')) {
                    deleteRoutine(memberId, routineId);
                    if (refreshCallback) refreshCallback();
                }
            });
        });
    }

    /**
     * Show snooze options menu
     */
    function showSnoozeMenu(memberId, routineId, anchorEl, refreshCallback) {
        // Remove any existing menu
        document.querySelectorAll('.routine-snooze-menu').forEach(m => m.remove());

        const menu = document.createElement('div');
        menu.className = 'routine-snooze-menu';
        menu.innerHTML = `
            <button data-snooze-days="1">Tomorrow</button>
            <button data-snooze-days="2">In 2 days</button>
            <button data-snooze-days="3">In 3 days</button>
            <button data-snooze-days="7">Next week</button>
        `;

        // Position near the button
        const rect = anchorEl.getBoundingClientRect();
        menu.style.position = 'fixed';
        menu.style.top = `${rect.bottom + 4}px`;
        menu.style.left = `${rect.left}px`;
        menu.style.zIndex = '1000';

        document.body.appendChild(menu);

        // Bind snooze options
        menu.querySelectorAll('[data-snooze-days]').forEach(btn => {
            btn.addEventListener('click', () => {
                const days = parseInt(btn.dataset.snoozeDays);
                snoozeRoutine(memberId, routineId, days);
                Toast.success(`Snoozed for ${days} day${days > 1 ? 's' : ''}`);
                menu.remove();
                if (refreshCallback) refreshCallback();
            });
        });

        // Close on click outside
        setTimeout(() => {
            document.addEventListener('click', function closeMenu(e) {
                if (!menu.contains(e.target)) {
                    menu.remove();
                    document.removeEventListener('click', closeMenu);
                }
            });
        }, 0);
    }

    /**
     * Show add routine modal
     */
    function showAddModal(memberId, onSuccess = null) {
        const content = `
            <div class="routine-form">
                <div class="form-group">
                    <label class="form-label">Routine Name *</label>
                    <input type="text" class="form-input" id="routineTitle" placeholder="e.g., Do laundry">
                </div>

                <div class="form-row">
                    <div class="form-group form-group--half">
                        <label class="form-label">Category</label>
                        <select class="form-select" id="routineCategory">
                            ${Object.entries(CATEGORIES).map(([key, val]) => `
                                <option value="${key}">${val.label}</option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="form-group form-group--half">
                        <label class="form-label">Time of Day</label>
                        <select class="form-select" id="routineTimeOfDay">
                            ${Object.entries(TIME_OF_DAY).map(([key, val]) => `
                                <option value="${key}">${val.label}</option>
                            `).join('')}
                        </select>
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">How often?</label>
                    <div class="routine-form__frequencies">
                        ${Object.entries(FREQUENCIES).filter(([key]) => key !== 'custom').map(([key, val]) => `
                            <label class="routine-freq-option ${key === 'weekly' ? 'routine-freq-option--selected' : ''}" data-freq="${key}">
                                <input type="radio" name="frequency" value="${key}" ${key === 'weekly' ? 'checked' : ''}>
                                <i data-lucide="${val.icon}"></i>
                                <span>${val.label}</span>
                            </label>
                        `).join('')}
                        <label class="routine-freq-option" data-freq="custom">
                            <input type="radio" name="frequency" value="custom">
                            <i data-lucide="settings-2"></i>
                            <span>Custom</span>
                        </label>
                    </div>
                </div>

                <div class="form-group routine-form__custom-freq" id="customFreqGroup" style="display: none;">
                    <label class="form-label">Every X days</label>
                    <input type="number" class="form-input" id="customDays" min="1" max="365" value="5" placeholder="e.g., 5">
                </div>

                <div class="form-group">
                    <label class="form-label">Icon</label>
                    <div class="routine-form__icons" id="iconPicker">
                        ${['check', 'shirt', 'shopping-cart', 'bath', 'bed', 'car', 'home', 'trash-2', 'wind', 'credit-card', 'phone', 'mail', 'dumbbell', 'heart', 'book', 'flower-2'].map((icon, i) => `
                            <button type="button" class="icon-picker__btn ${i === 0 ? 'icon-picker__btn--selected' : ''}" data-icon="${icon}">
                                <i data-lucide="${icon}"></i>
                            </button>
                        `).join('')}
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">Color</label>
                    <div class="routine-form__colors" id="colorPicker">
                        ${ROUTINE_COLORS.map((color, i) => `
                            <button type="button" class="color-picker__btn ${i === 0 ? 'color-picker__btn--selected' : ''}"
                                    data-color="${color}" style="background-color: ${color}"></button>
                        `).join('')}
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">Notes (optional)</label>
                    <textarea class="form-input form-textarea" id="routineNotes" rows="2" placeholder="Add any helpful notes or instructions..."></textarea>
                </div>
            </div>
        `;

        Modal.open({
            title: 'Add Routine',
            content,
            footer: `
                <button class="btn btn--secondary" data-modal-cancel>Cancel</button>
                <button class="btn btn--primary" id="saveRoutineBtn">Add Routine</button>
            `
        });

        if (typeof lucide !== 'undefined') lucide.createIcons();

        let selectedIcon = 'check';
        let selectedColor = ROUTINE_COLORS[0];
        let selectedFreq = 'weekly';

        // Frequency selection
        document.querySelectorAll('.routine-freq-option').forEach(opt => {
            opt.addEventListener('click', () => {
                document.querySelectorAll('.routine-freq-option').forEach(o => o.classList.remove('routine-freq-option--selected'));
                opt.classList.add('routine-freq-option--selected');
                opt.querySelector('input').checked = true;
                selectedFreq = opt.dataset.freq;

                // Show/hide custom days input
                const customGroup = document.getElementById('customFreqGroup');
                if (customGroup) {
                    customGroup.style.display = selectedFreq === 'custom' ? 'block' : 'none';
                }
            });
        });

        // Icon selection
        document.querySelectorAll('#iconPicker .icon-picker__btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#iconPicker .icon-picker__btn').forEach(b => b.classList.remove('icon-picker__btn--selected'));
                btn.classList.add('icon-picker__btn--selected');
                selectedIcon = btn.dataset.icon;
            });
        });

        // Color selection
        document.querySelectorAll('#colorPicker .color-picker__btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#colorPicker .color-picker__btn').forEach(b => b.classList.remove('color-picker__btn--selected'));
                btn.classList.add('color-picker__btn--selected');
                selectedColor = btn.dataset.color;
            });
        });

        // Cancel
        document.querySelector('[data-modal-cancel]')?.addEventListener('click', () => Modal.close());

        // Save
        document.getElementById('saveRoutineBtn')?.addEventListener('click', () => {
            const title = document.getElementById('routineTitle')?.value?.trim();
            if (!title) {
                Toast.error('Please enter a routine name');
                return;
            }

            const category = document.getElementById('routineCategory')?.value || 'other';
            const timeOfDay = document.getElementById('routineTimeOfDay')?.value || 'anytime';
            const notes = document.getElementById('routineNotes')?.value?.trim() || '';
            const customDays = selectedFreq === 'custom' ? parseInt(document.getElementById('customDays')?.value) || 5 : null;

            const data = getWidgetData(memberId);
            const newRoutine = {
                id: `routine-${Date.now()}`,
                title,
                frequency: selectedFreq,
                customDays,
                icon: selectedIcon,
                color: selectedColor,
                category,
                timeOfDay,
                notes,
                lastCompleted: null,
                createdAt: new Date().toISOString(),
                streak: 0,
                bestStreak: 0,
                snoozedUntil: null
            };

            data.routines.push(newRoutine);
            saveWidgetData(memberId, data);

            Modal.close();
            Toast.success('Routine added!');

            // Refresh widget
            const widgetBody = document.getElementById('widget-routine');
            if (widgetBody) renderWidget(widgetBody, memberId);

            if (onSuccess) onSuccess();
        });
    }

    /**
     * Show edit routine modal
     */
    function showEditModal(memberId, routineId, onSuccess = null) {
        const data = getWidgetData(memberId);
        const routine = data.routines.find(r => r.id === routineId);
        if (!routine) return;

        const content = `
            <div class="routine-form">
                <div class="form-group">
                    <label class="form-label">Routine Name *</label>
                    <input type="text" class="form-input" id="routineTitle" value="${routine.title}">
                </div>

                <div class="form-row">
                    <div class="form-group form-group--half">
                        <label class="form-label">Category</label>
                        <select class="form-select" id="routineCategory">
                            ${Object.entries(CATEGORIES).map(([key, val]) => `
                                <option value="${key}" ${key === routine.category ? 'selected' : ''}>${val.label}</option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="form-group form-group--half">
                        <label class="form-label">Time of Day</label>
                        <select class="form-select" id="routineTimeOfDay">
                            ${Object.entries(TIME_OF_DAY).map(([key, val]) => `
                                <option value="${key}" ${key === routine.timeOfDay ? 'selected' : ''}>${val.label}</option>
                            `).join('')}
                        </select>
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">How often?</label>
                    <div class="routine-form__frequencies">
                        ${Object.entries(FREQUENCIES).filter(([key]) => key !== 'custom').map(([key, val]) => `
                            <label class="routine-freq-option ${key === routine.frequency ? 'routine-freq-option--selected' : ''}" data-freq="${key}">
                                <input type="radio" name="frequency" value="${key}" ${key === routine.frequency ? 'checked' : ''}>
                                <i data-lucide="${val.icon}"></i>
                                <span>${val.label}</span>
                            </label>
                        `).join('')}
                        <label class="routine-freq-option ${routine.frequency === 'custom' ? 'routine-freq-option--selected' : ''}" data-freq="custom">
                            <input type="radio" name="frequency" value="custom" ${routine.frequency === 'custom' ? 'checked' : ''}>
                            <i data-lucide="settings-2"></i>
                            <span>Custom</span>
                        </label>
                    </div>
                </div>

                <div class="form-group routine-form__custom-freq" id="customFreqGroup" style="display: ${routine.frequency === 'custom' ? 'block' : 'none'};">
                    <label class="form-label">Every X days</label>
                    <input type="number" class="form-input" id="customDays" min="1" max="365" value="${routine.customDays || 5}" placeholder="e.g., 5">
                </div>

                <div class="form-group">
                    <label class="form-label">Icon</label>
                    <div class="routine-form__icons" id="iconPicker">
                        ${['check', 'shirt', 'shopping-cart', 'bath', 'bed', 'car', 'home', 'trash-2', 'wind', 'credit-card', 'phone', 'mail', 'dumbbell', 'heart', 'book', 'flower-2'].map(icon => `
                            <button type="button" class="icon-picker__btn ${icon === routine.icon ? 'icon-picker__btn--selected' : ''}" data-icon="${icon}">
                                <i data-lucide="${icon}"></i>
                            </button>
                        `).join('')}
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">Color</label>
                    <div class="routine-form__colors" id="colorPicker">
                        ${ROUTINE_COLORS.map(color => `
                            <button type="button" class="color-picker__btn ${color === routine.color ? 'color-picker__btn--selected' : ''}"
                                    data-color="${color}" style="background-color: ${color}"></button>
                        `).join('')}
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">Notes (optional)</label>
                    <textarea class="form-input form-textarea" id="routineNotes" rows="2" placeholder="Add any helpful notes...">${routine.notes || ''}</textarea>
                </div>

                <div class="routine-form__stats">
                    <div class="routine-form__stat">
                        <span class="routine-form__stat-label">Last Completed</span>
                        <span class="routine-form__stat-value">${routine.lastCompleted ? new Date(routine.lastCompleted).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'Never'}</span>
                    </div>
                    <div class="routine-form__stat">
                        <span class="routine-form__stat-label">Current Streak</span>
                        <span class="routine-form__stat-value"><i data-lucide="flame" style="width:14px;height:14px;"></i> ${routine.streak || 0}</span>
                    </div>
                    <div class="routine-form__stat">
                        <span class="routine-form__stat-label">Best Streak</span>
                        <span class="routine-form__stat-value"><i data-lucide="trophy" style="width:14px;height:14px;"></i> ${routine.bestStreak || 0}</span>
                    </div>
                </div>
            </div>
        `;

        Modal.open({
            title: 'Edit Routine',
            content,
            footer: `
                <button class="btn btn--secondary" data-modal-cancel>Cancel</button>
                <button class="btn btn--primary" id="saveRoutineBtn">Save</button>
            `
        });

        if (typeof lucide !== 'undefined') lucide.createIcons();

        let selectedIcon = routine.icon;
        let selectedColor = routine.color;
        let selectedFreq = routine.frequency;

        // Frequency selection
        document.querySelectorAll('.routine-freq-option').forEach(opt => {
            opt.addEventListener('click', () => {
                document.querySelectorAll('.routine-freq-option').forEach(o => o.classList.remove('routine-freq-option--selected'));
                opt.classList.add('routine-freq-option--selected');
                opt.querySelector('input').checked = true;
                selectedFreq = opt.dataset.freq;

                const customGroup = document.getElementById('customFreqGroup');
                if (customGroup) {
                    customGroup.style.display = selectedFreq === 'custom' ? 'block' : 'none';
                }
            });
        });

        // Icon selection
        document.querySelectorAll('#iconPicker .icon-picker__btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#iconPicker .icon-picker__btn').forEach(b => b.classList.remove('icon-picker__btn--selected'));
                btn.classList.add('icon-picker__btn--selected');
                selectedIcon = btn.dataset.icon;
            });
        });

        // Color selection
        document.querySelectorAll('#colorPicker .color-picker__btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#colorPicker .color-picker__btn').forEach(b => b.classList.remove('color-picker__btn--selected'));
                btn.classList.add('color-picker__btn--selected');
                selectedColor = btn.dataset.color;
            });
        });

        // Cancel
        document.querySelector('[data-modal-cancel]')?.addEventListener('click', () => Modal.close());

        // Save
        document.getElementById('saveRoutineBtn')?.addEventListener('click', () => {
            const title = document.getElementById('routineTitle')?.value?.trim();
            if (!title) {
                Toast.error('Please enter a routine name');
                return;
            }

            const category = document.getElementById('routineCategory')?.value || 'other';
            const timeOfDay = document.getElementById('routineTimeOfDay')?.value || 'anytime';
            const notes = document.getElementById('routineNotes')?.value?.trim() || '';
            const customDays = selectedFreq === 'custom' ? parseInt(document.getElementById('customDays')?.value) || 5 : null;

            const idx = data.routines.findIndex(r => r.id === routineId);
            if (idx !== -1) {
                data.routines[idx] = {
                    ...data.routines[idx],
                    title,
                    frequency: selectedFreq,
                    customDays,
                    icon: selectedIcon,
                    color: selectedColor,
                    category,
                    timeOfDay,
                    notes
                };
                saveWidgetData(memberId, data);
            }

            Modal.close();
            Toast.success('Routine updated!');

            const widgetBody = document.getElementById('widget-routine');
            if (widgetBody) renderWidget(widgetBody, memberId);

            if (onSuccess) onSuccess();
        });
    }

    /**
     * Delete routine
     */
    function deleteRoutine(memberId, routineId) {
        const data = getWidgetData(memberId);
        data.routines = data.routines.filter(r => r.id !== routineId);
        saveWidgetData(memberId, data);
        Toast.success('Routine deleted');
    }

    /**
     * Show routine detail
     */
    function showRoutineDetail(memberId, routineId, onSuccess = null) {
        showEditModal(memberId, routineId, onSuccess);
    }

    function init() {
        // Initialize routine feature
    }

    return {
        init,
        renderWidget,
        showRoutinesPage,
        getRoutineStatus,
        FREQUENCIES,
        CATEGORIES,
        TIME_OF_DAY
    };
})();
