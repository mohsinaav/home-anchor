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
     * Uses DateUtils for proper timezone handling
     */
    function getDaysSinceLastDone(routine) {
        if (!routine.lastCompleted) return null;

        // Use DateUtils for proper local date handling
        const lastDateStr = DateUtils.formatISO(new Date(routine.lastCompleted));
        const todayStr = DateUtils.today();

        // Parse both as local dates and calculate difference
        const lastDate = DateUtils.parseLocalDate(lastDateStr);
        const todayDate = DateUtils.parseLocalDate(todayStr);

        const diffTime = todayDate - lastDate;
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
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
     * Get routines that are due today or overdue (not done today)
     * A routine is "due today" when: daysSince >= freqDays (daysUntilDue <= 0)
     */
    function getRoutinesDueToday(memberId) {
        const data = getWidgetData(memberId);
        const dueRoutines = [];

        data.routines.forEach(routine => {
            const status = getRoutineStatus(routine);
            // Only include routines that are overdue (which includes "due today" when overdueDays === 0)
            // This means: routine was last done >= freqDays ago
            if (status.status === 'overdue') {
                dueRoutines.push({
                    id: routine.id,
                    title: routine.title,
                    icon: routine.icon,
                    color: routine.color,
                    statusType: status.status,
                    statusMessage: status.message
                });
            }
        });

        return dueRoutines;
    }

    /**
     * Sort routines by urgency
     */
    function sortRoutines(routines) {
        return [...routines].sort((a, b) => {
            const statusA = getRoutineStatus(a);
            const statusB = getRoutineStatus(b);

            // Priority: overdue > due-soon > upcoming > ok > new > snoozed > done
            // "new" (never done) is lowest priority - existing routines take precedence
            const priority = { 'overdue': 0, 'due-soon': 1, 'upcoming': 2, 'ok': 3, 'new': 4, 'snoozed': 5, 'done': 6 };
            const priorityA = priority[statusA.status] !== undefined ? priority[statusA.status] : 6;
            const priorityB = priority[statusB.status] !== undefined ? priority[statusB.status] : 6;

            // Primary sort by priority (urgency)
            if (priorityA !== priorityB) {
                return priorityA - priorityB;
            }

            // Secondary sort: for overdue, sort by how overdue (most overdue first)
            if (statusA.status === 'overdue' && statusB.status === 'overdue') {
                return (statusB.overdueDays || 0) - (statusA.overdueDays || 0);
            }

            return 0;
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

        // Get pending routines (not done, not snoozed) and sort by urgency
        const pendingRoutines = sortRoutines(routines.filter(r => {
            const status = getRoutineStatus(r).status;
            return status !== 'done' && status !== 'snoozed';
        }));

        // Get the most urgent routine for the focus card
        const focusRoutine = pendingRoutines[0] || null;
        const focusStatus = focusRoutine ? getRoutineStatus(focusRoutine) : null;

        // Get "up next" routines (excluding the focus one, max 3)
        const upNextRoutines = pendingRoutines.slice(1, 4);

        // Count due today (overdue with 0 days + due-soon that's actually today)
        const dueTodayCount = routines.filter(r => {
            const status = getRoutineStatus(r);
            return status.status === 'overdue' || status.status === 'due-soon' || status.status === 'new';
        }).filter(r => getRoutineStatus(r).status !== 'done').length;

        container.innerHTML = `
            <div class="routine-widget routine-widget--dashboard">
                <!-- Stats Row -->
                <div class="routine-widget__stats">
                    <div class="routine-widget__stat routine-widget__stat--danger">
                        <span class="routine-widget__stat-value">${overdueCount}</span>
                        <span class="routine-widget__stat-label">Overdue</span>
                    </div>
                    <div class="routine-widget__stat routine-widget__stat--warning">
                        <span class="routine-widget__stat-value">${dueTodayCount}</span>
                        <span class="routine-widget__stat-label">Due Today</span>
                    </div>
                    <div class="routine-widget__stat routine-widget__stat--success">
                        <span class="routine-widget__stat-value">${doneToday}</span>
                        <span class="routine-widget__stat-label">Done</span>
                    </div>
                </div>

                ${focusRoutine ? `
                    <!-- Focus Card - Most Urgent -->
                    <div class="routine-widget__focus" data-routine-id="${focusRoutine.id}">
                        <div class="routine-widget__focus-label">
                            <i data-lucide="alert-circle"></i>
                            Most Urgent
                        </div>
                        <div class="routine-widget__focus-content">
                            <div class="routine-widget__focus-icon" style="background: ${focusRoutine.color || '#6366F1'}">
                                <i data-lucide="${focusRoutine.icon || 'check'}"></i>
                            </div>
                            <div class="routine-widget__focus-text">
                                <div class="routine-widget__focus-title">${focusRoutine.title}</div>
                                <div class="routine-widget__focus-meta">${focusStatus.message}</div>
                            </div>
                            <button class="routine-widget__focus-action" data-mark-done="${focusRoutine.id}">
                                Done
                            </button>
                        </div>
                    </div>
                ` : `
                    <!-- All Done State -->
                    <div class="routine-widget__all-done">
                        <i data-lucide="check-circle-2"></i>
                        <span>All caught up!</span>
                    </div>
                `}

                ${upNextRoutines.length > 0 ? `
                    <!-- Up Next List -->
                    <div class="routine-widget__upnext">
                        <div class="routine-widget__upnext-header">
                            <h4>Up Next</h4>
                            <button class="routine-widget__upnext-viewall" data-action="view-all">View all</button>
                        </div>
                        <div class="routine-widget__upnext-list">
                            ${upNextRoutines.map(routine => {
                                const status = getRoutineStatus(routine);
                                return `
                                    <div class="routine-widget__upnext-item" data-routine-id="${routine.id}">
                                        <div class="routine-widget__upnext-icon" style="background: ${routine.color || '#6366F1'}">
                                            <i data-lucide="${routine.icon || 'check'}"></i>
                                        </div>
                                        <div class="routine-widget__upnext-info">
                                            <div class="routine-widget__upnext-title">${routine.title}</div>
                                            <div class="routine-widget__upnext-meta">${status.message}</div>
                                        </div>
                                        <button class="routine-widget__upnext-check" data-mark-done="${routine.id}" title="Mark as done">
                                            <i data-lucide="circle"></i>
                                        </button>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                ` : ''}

                ${pendingRoutines.length > 4 ? `
                    <button class="routine-widget__more-btn" data-view-all-routines="${memberId}">
                        +${pendingRoutines.length - 4} more routine${pendingRoutines.length - 4 !== 1 ? 's' : ''}
                    </button>
                ` : ''}

                <!-- Footer -->
                <div class="routine-widget__footer">
                    <button class="btn btn--sm btn--ghost" data-action="view-all">
                        <i data-lucide="list"></i>
                        All Routines
                    </button>
                    <button class="btn btn--sm btn--primary" data-action="add">
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

        // View all (includes footer button and upnext header link)
        container.querySelectorAll('[data-action="view-all"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                showRoutinesPage(memberId);
            });
        });

        // "+X more" button
        container.querySelector('[data-view-all-routines]')?.addEventListener('click', () => {
            showRoutinesPage(memberId);
        });

        // Focus card click - show routine detail
        container.querySelector('.routine-widget__focus')?.addEventListener('click', (e) => {
            if (e.target.closest('[data-mark-done]')) return; // Don't trigger if clicking Done button
            const routineId = container.querySelector('.routine-widget__focus')?.dataset.routineId;
            if (routineId) {
                showRoutineDetail(memberId, routineId, () => renderWidget(container, memberId));
            }
        });

        // Upnext item click - show routine detail
        container.querySelectorAll('.routine-widget__upnext-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.closest('[data-mark-done]')) return; // Don't trigger if clicking check button
                const routineId = item.dataset.routineId;
                if (routineId) {
                    showRoutineDetail(memberId, routineId, () => renderWidget(container, memberId));
                }
            });
        });

        // Add button
        container.querySelector('[data-action="add"]')?.addEventListener('click', () => {
            showAddModal(memberId, () => renderWidget(container, memberId));
        });
    }

    /**
     * Show full routines page with tabs
     */
    function showRoutinesPage(memberId, activeTab = 'due') {
        const main = document.getElementById('mainContent');
        if (!main) return;

        const member = Storage.getMember(memberId);
        const data = getWidgetData(memberId);
        const routines = sortRoutines(data.routines);

        // Group by status
        const overdue = routines.filter(r => getRoutineStatus(r).status === 'overdue');
        const dueSoon = routines.filter(r => getRoutineStatus(r).status === 'due-soon');
        const neverDone = routines.filter(r => getRoutineStatus(r).status === 'new');
        const upcoming = routines.filter(r => ['upcoming', 'ok'].includes(getRoutineStatus(r).status));
        const done = routines.filter(r => getRoutineStatus(r).status === 'done');
        const snoozed = routines.filter(r => getRoutineStatus(r).status === 'snoozed');

        // Due today count (actionable items)
        const dueCount = overdue.length + dueSoon.length + neverDone.length;

        // Calculate completion stats
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const d = DateUtils.addDays(new Date(), -i);
            const dateStr = DateUtils.formatISO(d);
            const dayCompletions = data.completionLog[dateStr] || [];
            const isToday = i === 0;
            last7Days.push({
                date: dateStr,
                dayName: WEEKDAYS[d.getDay()],
                dayNum: d.getDate(),
                count: dayCompletions.length,
                isToday
            });
        }
        const totalCompletionsThisWeek = last7Days.reduce((sum, d) => sum + d.count, 0);
        const bestStreak = Math.max(...routines.map(r => r.bestStreak || 0), 0);

        main.innerHTML = `
            <div class="routines-page">
                <!-- Hero Header -->
                <div class="routines-page__hero">
                    <button class="btn btn--ghost routines-page__back" id="backBtn" title="Go back">
                        <i data-lucide="arrow-left"></i>
                        Back
                    </button>
                    <div class="routines-page__hero-content">
                        <h1 class="routines-page__hero-title">
                            <i data-lucide="repeat"></i>
                            Routines
                        </h1>
                        <p class="routines-page__hero-subtitle">Track recurring tasks and build consistency</p>
                    </div>
                    <div class="routines-page__hero-stats">
                        <div class="routines-hero-stat">
                            <span class="routines-hero-stat__value">${routines.length}</span>
                            <span class="routines-hero-stat__label">Total</span>
                        </div>
                        <div class="routines-hero-stat">
                            <span class="routines-hero-stat__value">${totalCompletionsThisWeek}</span>
                            <span class="routines-hero-stat__label">This Week</span>
                        </div>
                        <div class="routines-hero-stat">
                            <span class="routines-hero-stat__value">${bestStreak}</span>
                            <span class="routines-hero-stat__label">Best Streak</span>
                        </div>
                    </div>
                </div>

                <!-- Tab Navigation -->
                <div class="routines-page__tabs">
                    <button class="routines-tab ${activeTab === 'due' ? 'routines-tab--active' : ''}" data-tab="due">
                        <i data-lucide="alert-circle"></i>
                        <span>Due</span>
                        ${dueCount > 0 ? `<span class="routines-tab__count">${dueCount}</span>` : ''}
                    </button>
                    <button class="routines-tab ${activeTab === 'all' ? 'routines-tab--active' : ''}" data-tab="all">
                        <i data-lucide="list"></i>
                        <span>All</span>
                    </button>
                    <button class="routines-tab ${activeTab === 'history' ? 'routines-tab--active' : ''}" data-tab="history">
                        <i data-lucide="calendar"></i>
                        <span>History</span>
                    </button>
                    <button class="routines-tab ${activeTab === 'stats' ? 'routines-tab--active' : ''}" data-tab="stats">
                        <i data-lucide="bar-chart-2"></i>
                        <span>Stats</span>
                    </button>
                </div>

                <!-- Action Bar -->
                <div class="routines-page__actions">
                    <button class="btn btn--primary" id="addRoutineBtn">
                        <i data-lucide="plus"></i>
                        Add Routine
                    </button>
                    ${overdue.length > 0 ? `
                        <button class="btn btn--secondary" id="markAllOverdueBtn">
                            <i data-lucide="check-check"></i>
                            Mark ${overdue.length} Overdue Done
                        </button>
                    ` : ''}
                </div>

                <!-- Tab Content -->
                <div class="routines-page__content">
                    ${renderRoutinesTabContent(activeTab, memberId, data, routines, {
                        overdue, dueSoon, neverDone, upcoming, done, snoozed, last7Days
                    })}
                </div>
            </div>
        `;

        if (typeof lucide !== 'undefined') lucide.createIcons();

        // Bind events
        bindRoutinesPageEvents(main, memberId, activeTab);
    }

    /**
     * Render tab content for routines page
     */
    function renderRoutinesTabContent(activeTab, memberId, data, routines, groups) {
        const { overdue, dueSoon, neverDone, upcoming, done, snoozed, last7Days } = groups;

        switch (activeTab) {
            case 'due':
                return renderDueTab(memberId, data, overdue, dueSoon, neverDone, done, snoozed);
            case 'all':
                return renderAllRoutinesTab(memberId, data, routines);
            case 'history':
                return renderHistoryTab(memberId, data, last7Days);
            case 'stats':
                return renderStatsTab(memberId, data, routines);
            default:
                return renderDueTab(memberId, data, overdue, dueSoon, neverDone, done, snoozed);
        }
    }

    /**
     * Render Due tab - Actionable routines
     */
    function renderDueTab(memberId, data, overdue, dueSoon, neverDone, done, snoozed) {
        const hasActionable = overdue.length > 0 || dueSoon.length > 0 || neverDone.length > 0;

        if (!hasActionable && done.length === 0 && snoozed.length === 0) {
            return `
                <div class="routines-empty">
                    <div class="routines-empty__icon">
                        <i data-lucide="check-circle-2"></i>
                    </div>
                    <h3>All caught up!</h3>
                    <p>No routines due right now. Great job staying on top of things!</p>
                </div>
            `;
        }

        return `
            <div class="routines-due">
                ${overdue.length > 0 ? `
                    <div class="routines-section routines-section--overdue">
                        <h3 class="routines-section__title">
                            <i data-lucide="alert-triangle"></i>
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

                ${neverDone.length > 0 ? `
                    <div class="routines-section routines-section--new">
                        <h3 class="routines-section__title">
                            <i data-lucide="sparkles"></i>
                            New (${neverDone.length})
                        </h3>
                        <div class="routines-section__list">
                            ${renderRoutineCards(neverDone, memberId, data.completionLog)}
                        </div>
                    </div>
                ` : ''}

                ${done.length > 0 ? `
                    <div class="routines-section routines-section--done">
                        <h3 class="routines-section__title">
                            <i data-lucide="check-circle"></i>
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
            </div>
        `;
    }

    /**
     * Render All tab - All routines grouped by category
     */
    function renderAllRoutinesTab(memberId, data, routines) {
        if (routines.length === 0) {
            return `
                <div class="routines-empty">
                    <div class="routines-empty__icon">
                        <i data-lucide="inbox"></i>
                    </div>
                    <h3>No routines yet</h3>
                    <p>Create your first routine to get started tracking recurring tasks.</p>
                    <button class="btn btn--primary" id="addFirstBtn">
                        <i data-lucide="plus"></i>
                        Add Your First Routine
                    </button>
                </div>
            `;
        }

        // Group by category
        const byCategory = {};
        routines.forEach(r => {
            const cat = r.category || 'other';
            if (!byCategory[cat]) byCategory[cat] = [];
            byCategory[cat].push(r);
        });

        return `
            <div class="routines-all">
                ${Object.entries(byCategory).map(([catKey, catRoutines]) => {
                    const cat = CATEGORIES[catKey] || CATEGORIES.other;
                    return `
                        <div class="routines-category">
                            <h3 class="routines-category__title" style="color: ${cat.color}">
                                <i data-lucide="${cat.icon}"></i>
                                ${cat.label} (${catRoutines.length})
                            </h3>
                            <div class="routines-category__list">
                                ${renderRoutineCards(catRoutines, memberId, data.completionLog)}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    /**
     * Render History tab - Weekly activity and recent completions
     */
    function renderHistoryTab(memberId, data, last7Days) {
        const totalCompletions = last7Days.reduce((sum, d) => sum + d.count, 0);

        // Get last 30 days of completions for calendar
        const last30Days = [];
        for (let i = 29; i >= 0; i--) {
            const d = DateUtils.addDays(new Date(), -i);
            const dateStr = DateUtils.formatISO(d);
            const dayCompletions = data.completionLog[dateStr] || [];
            last30Days.push({
                date: dateStr,
                dayName: WEEKDAYS[d.getDay()],
                dayNum: d.getDate(),
                month: d.toLocaleDateString('en-US', { month: 'short' }),
                count: dayCompletions.length,
                completions: dayCompletions
            });
        }

        return `
            <div class="routines-history">
                <!-- Weekly Summary -->
                <div class="routines-history__week">
                    <div class="routines-history__week-header">
                        <h3>This Week</h3>
                        <span class="routines-history__week-total">${totalCompletions} completed</span>
                    </div>
                    <div class="routines-history__week-days">
                        ${last7Days.map(day => `
                            <div class="routines-history__day ${day.isToday ? 'routines-history__day--today' : ''} ${day.count > 0 ? 'routines-history__day--active' : ''}">
                                <span class="routines-history__day-name">${day.dayName}</span>
                                <span class="routines-history__day-num">${day.dayNum}</span>
                                <span class="routines-history__day-count">${day.count}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Recent Activity -->
                <div class="routines-history__recent">
                    <h3>Last 30 Days</h3>
                    <div class="routines-history__calendar">
                        ${last30Days.map(day => `
                            <div class="routines-history__cal-day ${day.count > 0 ? 'routines-history__cal-day--active' : ''} ${day.dayName === WEEKDAYS[new Date().getDay()] && day.dayNum === new Date().getDate() ? 'routines-history__cal-day--today' : ''}"
                                 title="${day.month} ${day.dayNum}: ${day.count} completed">
                                <span class="routines-history__cal-num">${day.dayNum}</span>
                                ${day.count > 0 ? `<span class="routines-history__cal-count">${day.count}</span>` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render Stats tab - Statistics and streaks
     */
    function renderStatsTab(memberId, data, routines) {
        // Calculate various stats
        const totalRoutines = routines.length;
        const totalCompletions = Object.values(data.completionLog).reduce((sum, arr) => sum + arr.length, 0);
        const currentStreaks = routines.filter(r => (r.streak || 0) > 0).length;
        const bestStreak = Math.max(...routines.map(r => r.bestStreak || 0), 0);
        const avgStreak = routines.length > 0
            ? Math.round(routines.reduce((sum, r) => sum + (r.streak || 0), 0) / routines.length)
            : 0;

        // Category breakdown
        const byCategory = {};
        routines.forEach(r => {
            const cat = r.category || 'other';
            if (!byCategory[cat]) byCategory[cat] = { count: 0, completions: 0 };
            byCategory[cat].count++;
        });

        // Top performers (by streak)
        const topPerformers = [...routines]
            .filter(r => (r.streak || 0) > 0)
            .sort((a, b) => (b.streak || 0) - (a.streak || 0))
            .slice(0, 5);

        return `
            <div class="routines-stats">
                <!-- Overview Cards -->
                <div class="routines-stats__overview">
                    <div class="routines-stats__card">
                        <div class="routines-stats__card-icon" style="background: #dbeafe; color: #3b82f6;">
                            <i data-lucide="list-checks"></i>
                        </div>
                        <div class="routines-stats__card-content">
                            <span class="routines-stats__card-value">${totalRoutines}</span>
                            <span class="routines-stats__card-label">Total Routines</span>
                        </div>
                    </div>
                    <div class="routines-stats__card">
                        <div class="routines-stats__card-icon" style="background: #dcfce7; color: #22c55e;">
                            <i data-lucide="check-circle-2"></i>
                        </div>
                        <div class="routines-stats__card-content">
                            <span class="routines-stats__card-value">${totalCompletions}</span>
                            <span class="routines-stats__card-label">All Time Completions</span>
                        </div>
                    </div>
                    <div class="routines-stats__card">
                        <div class="routines-stats__card-icon" style="background: #fef3c7; color: #f59e0b;">
                            <i data-lucide="flame"></i>
                        </div>
                        <div class="routines-stats__card-content">
                            <span class="routines-stats__card-value">${currentStreaks}</span>
                            <span class="routines-stats__card-label">Active Streaks</span>
                        </div>
                    </div>
                    <div class="routines-stats__card">
                        <div class="routines-stats__card-icon" style="background: #f3e8ff; color: #8b5cf6;">
                            <i data-lucide="trophy"></i>
                        </div>
                        <div class="routines-stats__card-content">
                            <span class="routines-stats__card-value">${bestStreak}</span>
                            <span class="routines-stats__card-label">Best Streak</span>
                        </div>
                    </div>
                </div>

                ${topPerformers.length > 0 ? `
                    <!-- Top Performers -->
                    <div class="routines-stats__section">
                        <h3 class="routines-stats__section-title">
                            <i data-lucide="award"></i>
                            Top Streaks
                        </h3>
                        <div class="routines-stats__performers">
                            ${topPerformers.map((r, idx) => `
                                <div class="routines-stats__performer">
                                    <span class="routines-stats__performer-rank">#${idx + 1}</span>
                                    <span class="routines-stats__performer-icon" style="color: ${r.color || '#6366F1'}">
                                        <i data-lucide="${r.icon || 'check'}"></i>
                                    </span>
                                    <span class="routines-stats__performer-name">${r.title}</span>
                                    <span class="routines-stats__performer-streak">
                                        <i data-lucide="flame"></i>
                                        ${r.streak}
                                    </span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                <!-- Category Breakdown -->
                <div class="routines-stats__section">
                    <h3 class="routines-stats__section-title">
                        <i data-lucide="pie-chart"></i>
                        By Category
                    </h3>
                    <div class="routines-stats__categories">
                        ${Object.entries(byCategory).map(([catKey, catData]) => {
                            const cat = CATEGORIES[catKey] || CATEGORIES.other;
                            return `
                                <div class="routines-stats__category">
                                    <span class="routines-stats__category-icon" style="background: ${cat.color}20; color: ${cat.color}">
                                        <i data-lucide="${cat.icon}"></i>
                                    </span>
                                    <span class="routines-stats__category-name">${cat.label}</span>
                                    <span class="routines-stats__category-count">${catData.count}</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Bind routines page events
     */
    function bindRoutinesPageEvents(container, memberId, activeTab) {
        // Back button
        document.getElementById('backBtn')?.addEventListener('click', () => {
            State.emit('tabChanged', memberId);
        });

        // Tab switching
        container.querySelectorAll('.routines-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const newTab = tab.dataset.tab;
                showRoutinesPage(memberId, newTab);
            });
        });

        // Add routine button
        document.getElementById('addRoutineBtn')?.addEventListener('click', () => {
            showAddModal(memberId, () => showRoutinesPage(memberId, activeTab));
        });

        // Add first routine button (empty state)
        document.getElementById('addFirstBtn')?.addEventListener('click', () => {
            showAddModal(memberId, () => showRoutinesPage(memberId, activeTab));
        });

        // Mark all overdue done
        document.getElementById('markAllOverdueBtn')?.addEventListener('click', () => {
            const count = markAllOverdueDone(memberId);
            Toast.success(`Marked ${count} routines as done`);
            showRoutinesPage(memberId, activeTab);
        });

        // Routine card events
        bindRoutineCardEvents(container, memberId, () => showRoutinesPage(memberId, activeTab));
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

            return `
                <div class="routine-card routine-card--${status.status}" data-routine-id="${routine.id}" style="--routine-color: ${routine.color || '#6366F1'}">
                    <div class="routine-card__icon" title="${routine.title}">
                        <i data-lucide="${routine.icon || 'check'}"></i>
                    </div>
                    <div class="routine-card__content">
                        <h4 class="routine-card__title">${routine.title}</h4>
                        <div class="routine-card__meta">
                            <span class="routine-card__frequency">${freqLabel}</span>
                            <span class="routine-card__status routine-card__status--${status.status}">${status.message}</span>
                        </div>
                        ${streak > 0 || bestStreak > 0 ? `
                            <div class="routine-card__streaks">
                                ${streak > 0 ? `<span class="routine-card__streak" title="Current streak"><i data-lucide="flame"></i> ${streak}</span>` : ''}
                                ${bestStreak > streak && bestStreak > 0 ? `<span class="routine-card__best-streak" title="Best streak"><i data-lucide="trophy"></i> ${bestStreak}</span>` : ''}
                            </div>
                        ` : ''}
                        ${routine.notes ? `<p class="routine-card__notes">${routine.notes}</p>` : ''}
                    </div>
                    <div class="routine-card__actions">
                        <div class="routine-card__actions-primary">
                            ${status.status !== 'done' && status.status !== 'snoozed' ? `
                                <button class="btn btn--icon btn--ghost" data-snooze-menu="${routine.id}" title="Snooze - postpone this routine">
                                    <i data-lucide="alarm-clock-off"></i>
                                </button>
                                <button class="btn btn--icon btn--ghost" data-skip="${routine.id}" title="Skip - mark as not needed this time">
                                    <i data-lucide="skip-forward"></i>
                                </button>
                            ` : ''}
                            ${status.status === 'snoozed' ? `
                                <button class="btn btn--icon btn--ghost" data-unsnooze="${routine.id}" title="Remove snooze">
                                    <i data-lucide="alarm-clock"></i>
                                </button>
                            ` : ''}
                            <button class="btn btn--icon ${status.status === 'done' ? 'btn--success' : 'btn--primary'}"
                                    data-mark-done="${routine.id}" ${status.status === 'done' ? 'disabled' : ''}
                                    title="${status.status === 'done' ? 'Already completed today' : 'Mark as done'}">
                                <i data-lucide="${status.status === 'done' ? 'check-circle-2' : 'check'}"></i>
                            </button>
                        </div>
                        <div class="routine-card__actions-secondary">
                            <button class="btn btn--icon btn--ghost" data-edit="${routine.id}" title="Edit routine">
                                <i data-lucide="pencil"></i>
                            </button>
                            <button class="btn btn--icon btn--ghost routine-card__delete" data-delete="${routine.id}" title="Delete routine">
                                <i data-lucide="trash-2"></i>
                            </button>
                        </div>
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
                    Toast.success('Unsnoozed');
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

                <div class="form-group">
                    <label class="form-label">
                        <input type="checkbox" id="notificationEnabled" class="form-checkbox" style="margin-right: 8px;">
                        <i data-lucide="bell" style="width: 16px; height: 16px; vertical-align: middle; margin-right: 4px;"></i>
                        Remind me
                    </label>
                    <div id="notificationTimeGroup" style="display: none; margin-top: 8px;">
                        <input type="time" class="form-input" id="notificationTime" value="09:00">
                        <span class="form-hint">You'll get a notification at this time when the routine is due</span>
                    </div>
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

        // Notification toggle
        document.getElementById('notificationEnabled')?.addEventListener('change', (e) => {
            const timeGroup = document.getElementById('notificationTimeGroup');
            if (timeGroup) {
                timeGroup.style.display = e.target.checked ? 'block' : 'none';
            }
        });

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

            const notificationEnabled = document.getElementById('notificationEnabled')?.checked || false;
            const notificationTime = notificationEnabled ? document.getElementById('notificationTime')?.value || null : null;

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
                snoozedUntil: null,
                notificationEnabled,
                notificationTime
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
            <div class="edit-routine-form">
                <div class="form-group">
                    <label class="form-label">Routine Name</label>
                    <input type="text" class="form-input" id="routineTitle" value="${routine.title}">
                </div>

                <div class="form-group">
                    <label class="form-label">Icon</label>
                    <div class="icon-picker">
                        <input type="hidden" id="editRoutineIcon" value="${routine.icon || 'check'}">
                        ${['check', 'shirt', 'shopping-cart', 'bath', 'bed', 'car', 'home', 'trash-2', 'wind', 'credit-card', 'phone', 'mail', 'dumbbell', 'heart', 'book', 'flower-2'].map(icon => `
                            <button type="button" class="icon-picker__icon ${icon === routine.icon ? 'icon-picker__icon--selected' : ''}" data-icon="${icon}" title="${icon}">
                                <i data-lucide="${icon}"></i>
                            </button>
                        `).join('')}
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">Color</label>
                    <div class="color-picker">
                        ${ROUTINE_COLORS.map(color => `
                            <button type="button" class="color-picker__btn ${color === routine.color ? 'color-picker__btn--selected' : ''}"
                                    data-color="${color}" style="background-color: ${color}"></button>
                        `).join('')}
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">Category</label>
                    <select class="form-select" id="routineCategory">
                        ${Object.entries(CATEGORIES).map(([key, val]) => `
                            <option value="${key}" ${key === routine.category ? 'selected' : ''}>${val.label}</option>
                        `).join('')}
                    </select>
                </div>

                <div class="form-group">
                    <label class="form-label">Frequency</label>
                    <select class="form-select" id="routineFrequency">
                        ${Object.entries(FREQUENCIES).map(([key, val]) => `
                            <option value="${key}" ${key === routine.frequency ? 'selected' : ''}>${val.label}</option>
                        `).join('')}
                    </select>
                </div>

                <div class="form-group" id="customFreqGroup" style="display: ${routine.frequency === 'custom' ? 'block' : 'none'};">
                    <label class="form-label">Every X days</label>
                    <input type="number" class="form-input" id="customDays" min="1" max="365" value="${routine.customDays || 5}" placeholder="e.g., 5">
                </div>

                <div class="form-group">
                    <label class="form-label">Notes (optional)</label>
                    <textarea class="form-input form-textarea" id="routineNotes" rows="2" placeholder="Add any helpful notes...">${routine.notes || ''}</textarea>
                </div>

                <div class="edit-routine-form__stats">
                    <div class="edit-routine-form__stat">
                        <span class="edit-routine-form__stat-value">${routine.lastCompleted ? new Date(routine.lastCompleted).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Never'}</span>
                        <span class="edit-routine-form__stat-label">Last Done</span>
                    </div>
                    <div class="edit-routine-form__stat">
                        <span class="edit-routine-form__stat-value">${routine.streak || 0}</span>
                        <span class="edit-routine-form__stat-label">Current Streak</span>
                    </div>
                    <div class="edit-routine-form__stat">
                        <span class="edit-routine-form__stat-value">${routine.bestStreak || 0}</span>
                        <span class="edit-routine-form__stat-label">Best Streak</span>
                    </div>
                </div>
            </div>
        `;

        Modal.open({
            title: 'Edit Routine',
            content,
            footer: `
                <button class="btn btn--ghost" data-modal-cancel>Cancel</button>
                <button class="btn btn--danger" id="deleteRoutineBtn">Delete</button>
                <button class="btn btn--primary" id="saveRoutineBtn">Save</button>
            `
        });

        if (typeof lucide !== 'undefined') lucide.createIcons();

        // Icon picker
        document.querySelectorAll('.edit-routine-form .icon-picker__icon').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.edit-routine-form .icon-picker__icon').forEach(b => {
                    b.classList.remove('icon-picker__icon--selected');
                });
                btn.classList.add('icon-picker__icon--selected');
                const iconInput = document.getElementById('editRoutineIcon');
                if (iconInput) {
                    iconInput.value = btn.dataset.icon;
                }
            });
        });

        // Color picker
        document.querySelectorAll('.edit-routine-form .color-picker__btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.edit-routine-form .color-picker__btn').forEach(b => {
                    b.classList.remove('color-picker__btn--selected');
                });
                btn.classList.add('color-picker__btn--selected');
            });
        });

        // Frequency change - show/hide custom days input
        document.getElementById('routineFrequency')?.addEventListener('change', (e) => {
            const customGroup = document.getElementById('customFreqGroup');
            if (customGroup) {
                customGroup.style.display = e.target.value === 'custom' ? 'block' : 'none';
            }
        });

        // Cancel
        document.querySelector('[data-modal-cancel]')?.addEventListener('click', () => Modal.close());

        // Delete
        document.getElementById('deleteRoutineBtn')?.addEventListener('click', async () => {
            const confirmed = await Modal.dangerConfirm(
                `Permanently delete "${routine.title}"? This cannot be undone.`,
                'Delete Routine'
            );
            if (confirmed) {
                deleteRoutine(memberId, routineId);
                Modal.close();

                const widgetBody = document.getElementById('widget-routine');
                if (widgetBody) renderWidget(widgetBody, memberId);

                if (onSuccess) onSuccess();
            }
        });

        // Save
        document.getElementById('saveRoutineBtn')?.addEventListener('click', () => {
            const title = document.getElementById('routineTitle')?.value?.trim();
            if (!title) {
                Toast.error('Please enter a routine name');
                return;
            }

            const icon = document.getElementById('editRoutineIcon')?.value || 'check';
            const color = document.querySelector('.edit-routine-form .color-picker__btn--selected')?.dataset.color || routine.color;
            const category = document.getElementById('routineCategory')?.value || 'other';
            const frequency = document.getElementById('routineFrequency')?.value || 'weekly';
            const notes = document.getElementById('routineNotes')?.value?.trim() || '';
            const customDays = frequency === 'custom' ? parseInt(document.getElementById('customDays')?.value) || 5 : null;

            const idx = data.routines.findIndex(r => r.id === routineId);
            if (idx !== -1) {
                data.routines[idx] = {
                    ...data.routines[idx],
                    title,
                    frequency,
                    customDays,
                    icon,
                    color,
                    category,
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
     * Show routine detail - navigates to routines page and scrolls to the specific routine
     */
    function showRoutineDetail(memberId, routineId) {
        // Navigate to the routines page (Due tab shows actionable routines with snooze/skip options)
        showRoutinesPage(memberId, 'due');

        // After page renders, scroll to and highlight the specific routine
        setTimeout(() => {
            const routineCard = document.querySelector(`[data-routine-id="${routineId}"]`);
            if (routineCard) {
                // Scroll into view smoothly
                routineCard.scrollIntoView({ behavior: 'smooth', block: 'center' });

                // Add highlight animation
                routineCard.classList.add('routine-card--highlighted');
                setTimeout(() => {
                    routineCard.classList.remove('routine-card--highlighted');
                }, 2000);
            }
        }, 100);
    }

    /**
     * Check and send notifications for due routines
     */
    function checkRoutineNotifications() {
        // Only check if notifications are supported and enabled
        if (typeof NotificationUtils === 'undefined' || !NotificationUtils.areNotificationsEnabled()) {
            return;
        }

        const members = Storage.getMembers();
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        members.forEach(member => {
            const data = getWidgetData(member.id);
            const routines = data.routines || [];

            routines.forEach(routine => {
                // Skip if notifications not enabled for this routine
                if (!routine.notificationEnabled || !routine.notificationTime) {
                    return;
                }

                // Check if it's time for this notification
                if (routine.notificationTime === currentTime) {
                    // Check if routine is due
                    const status = getRoutineStatus(routine);

                    // Send notification if overdue, due today, or due soon
                    if (status.status === 'overdue' || status.status === 'due-soon') {
                        NotificationUtils.send(`Routine Reminder: ${routine.title}`, {
                            body: `${member.name} - ${status.message}`,
                            icon: routine.icon || 'check',
                            tag: `routine-${routine.id}`,
                            data: { memberId: member.id, routineId: routine.id }
                        });
                    }
                }
            });
        });
    }

    function init() {
        // Check for routine notifications every minute
        setInterval(checkRoutineNotifications, 60000);
        // Also check immediately
        checkRoutineNotifications();
    }

    return {
        init,
        renderWidget,
        showRoutinesPage,
        getRoutineStatus,
        getRoutinesDueToday,
        markDone,
        FREQUENCIES,
        CATEGORIES,
        TIME_OF_DAY
    };
})();
