/**
 * Workout Feature
 * Handles workout tracking for adults with weekly history view
 */

const Workout = (function() {
    // Default workout routines
    const DEFAULT_ROUTINES = [
        { id: 'routine-1', name: 'Morning Run', icon: 'footprints', duration: 30 },
        { id: 'routine-2', name: 'Strength Training', icon: 'dumbbell', duration: 45 },
        { id: 'routine-3', name: 'Yoga', icon: 'heart', duration: 30 },
        { id: 'routine-4', name: 'HIIT', icon: 'zap', duration: 20 },
        { id: 'routine-5', name: 'Cycling', icon: 'bike', duration: 45 },
        { id: 'routine-6', name: 'Swimming', icon: 'waves', duration: 30 }
    ];

    // Day names for the weekly view
    const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Day colors for the weekly view
    const DAY_COLORS = [
        { bg: '#FEE2E2', border: '#FCA5A5', text: '#991B1B' }, // Sunday - red
        { bg: '#DBEAFE', border: '#93C5FD', text: '#1E40AF' }, // Monday - blue
        { bg: '#D1FAE5', border: '#6EE7B7', text: '#065F46' }, // Tuesday - green
        { bg: '#FEF3C7', border: '#FCD34D', text: '#92400E' }, // Wednesday - amber
        { bg: '#EDE9FE', border: '#C4B5FD', text: '#5B21B6' }, // Thursday - violet
        { bg: '#FCE7F3', border: '#F9A8D4', text: '#9D174D' }, // Friday - pink
        { bg: '#E0F2FE', border: '#7DD3FC', text: '#0369A1' }  // Saturday - sky
    ];

    /**
     * Get widget data with defaults
     */
    function getWidgetData(memberId) {
        const storedData = Storage.getWidgetData(memberId, 'workout') || {};

        // Use stored routines only if it's a non-empty array, otherwise use defaults
        const routines = (Array.isArray(storedData.routines) && storedData.routines.length > 0)
            ? storedData.routines
            : DEFAULT_ROUTINES;

        // Migrate old log entries that don't have IDs
        let logs = Array.isArray(storedData.log) ? storedData.log : [];
        let needsMigration = false;
        logs = logs.map((entry, index) => {
            if (!entry.id) {
                needsMigration = true;
                return {
                    ...entry,
                    id: `workout-migrated-${index}-${Date.now()}`
                };
            }
            return entry;
        });

        // Save migrated data if needed
        if (needsMigration) {
            Storage.setWidgetData(memberId, 'workout', {
                ...storedData,
                routines,
                log: logs,
                weeklyGoal: storedData.weeklyGoal || 4
            });
        }

        return {
            routines: routines,
            log: logs,
            weeklyGoal: storedData.weeklyGoal || 4,
            stepsGoal: storedData.stepsGoal || 10000, // Daily steps goal
            stepsLog: storedData.stepsLog || {},
            suggestionPrefs: storedData.suggestionPrefs || null,
            weekSuggestions: storedData.weekSuggestions || null,
            measurements: storedData.measurements || null // Body measurements data
        };
    }

    // Motivational messages for empty state
    const MOTIVATIONAL_MESSAGES = [
        { text: "Every step counts! Start your workout journey today.", icon: "rocket" },
        { text: "Your body can do it. It's your mind you need to convince.", icon: "brain" },
        { text: "The only bad workout is the one that didn't happen.", icon: "zap" },
        { text: "Small progress is still progress. Let's go!", icon: "trending-up" },
        { text: "You're one workout away from a good mood!", icon: "smile" },
        { text: "Today is a great day to move your body.", icon: "sun" }
    ];

    /**
     * Get a random motivational message
     */
    function getMotivationalMessage() {
        return MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)];
    }

    /**
     * Show celebration animation
     */
    function showCelebration(type = 'daily') {
        const message = type === 'weekly'
            ? '🎉 Weekly Goal Achieved!'
            : '💪 Great Workout!';

        // Create celebration overlay
        const overlay = document.createElement('div');
        overlay.className = 'workout-celebration';
        overlay.innerHTML = `
            <div class="workout-celebration__content">
                <div class="workout-celebration__confetti">
                    ${Array(12).fill(0).map(() => '<span></span>').join('')}
                </div>
                <div class="workout-celebration__message">${message}</div>
            </div>
        `;

        document.body.appendChild(overlay);

        // Remove after animation
        setTimeout(() => {
            overlay.classList.add('workout-celebration--fade');
            setTimeout(() => overlay.remove(), 300);
        }, 1500);
    }

    /**
     * Get logs for current week
     */
    function getWeeklyLogs(logs, weekStart) {
        if (!logs || !Array.isArray(logs)) return [];
        const start = weekStart || DateUtils.getWeekStart(new Date());
        const weekEnd = new Date(start);
        weekEnd.setDate(weekEnd.getDate() + 6);

        return logs.filter(l => {
            const logDate = new Date(l.date);
            return logDate >= start && logDate <= weekEnd;
        });
    }

    /**
     * Get week start date (Sunday)
     */
    function getWeekStart(date) {
        const d = new Date(date);
        const day = d.getDay();
        d.setDate(d.getDate() - day);
        d.setHours(0, 0, 0, 0);
        return d;
    }

    /**
     * Calculate workout streak
     */
    function calculateStreak(logs) {
        if (!logs || logs.length === 0) return 0;

        // Get unique dates sorted newest first
        const uniqueDates = [...new Set(logs.map(l => l.date))].sort().reverse();

        const today = DateUtils.today();
        const yesterday = DateUtils.formatISO(DateUtils.addDays(new Date(), -1));

        // Check if there's a workout today or yesterday
        const latestDate = uniqueDates[0];
        if (latestDate !== today && latestDate !== yesterday) {
            return 0; // Streak broken
        }

        let streak = 0;
        let checkDate = latestDate === today ? new Date() : DateUtils.addDays(new Date(), -1);

        for (const date of uniqueDates) {
            const expectedDate = DateUtils.formatISO(checkDate);
            if (date === expectedDate) {
                streak++;
                checkDate = DateUtils.addDays(checkDate, -1);
            } else if (date < expectedDate) {
                break; // Gap found
            }
        }

        return streak;
    }

    /**
     * Render the workout widget for a member
     */
    function renderWidget(container, memberId) {
        const today = DateUtils.today();
        const widgetData = getWidgetData(memberId);
        const routines = widgetData.routines;
        const logs = widgetData.log;
        const stepsLog = widgetData.stepsLog || {};
        const stepsGoal = widgetData.stepsGoal || 10000;
        const weeklyGoal = widgetData.weeklyGoal || 4;

        // Get today's workouts and steps
        const todayLogs = logs.filter(l => l.date === today);
        const todaySteps = stepsLog[today] || 0;
        const stepsProgress = Math.min(100, Math.round((todaySteps / stepsGoal) * 100));

        // Calculate Sunday-based week start for the widget display
        const now = new Date();
        const currentDayOfWeek = now.getDay(); // 0=Sunday, 1=Monday, etc.
        const sundayStart = new Date(now);
        sundayStart.setDate(now.getDate() - currentDayOfWeek);
        sundayStart.setHours(0, 0, 0, 0);

        const thisWeekLogs = getWeeklyLogs(logs, sundayStart);
        const daysWithWorkouts = new Set(thisWeekLogs.map(l => l.date)).size;
        const weeklyProgress = Math.min(100, Math.round((daysWithWorkouts / weeklyGoal) * 100));
        const weeklyGoalMet = daysWithWorkouts >= weeklyGoal;

        const totalMinutesToday = todayLogs.reduce((sum, l) => sum + (l.duration || 0), 0);
        const streak = calculateStreak(logs);

        // Get motivational message for empty state
        const motivation = getMotivationalMessage();

        container.innerHTML = `
            <div class="workout-widget ${weeklyGoalMet ? 'workout-widget--goal-met' : ''}">
                <div class="workout-widget__header">
                    <div class="workout-widget__streak ${streak > 0 ? 'workout-widget__streak--active' : ''}">
                        <i data-lucide="flame"></i>
                        <span>${streak} day${streak !== 1 ? 's' : ''}</span>
                    </div>
                    ${todayLogs.length > 0 ? `
                        <span class="workout-widget__badge">
                            <i data-lucide="check-circle"></i>
                            Done today
                        </span>
                    ` : ''}
                </div>

                ${todayLogs.length > 0 ? `
                    <div class="workout-widget__status workout-widget__status--done">
                        <div class="workout-widget__icon">
                            <i data-lucide="check-circle"></i>
                        </div>
                        <div class="workout-widget__info">
                            <span class="workout-widget__label">Completed Today!</span>
                            <span class="workout-widget__detail">
                                ${todayLogs.length} workout${todayLogs.length > 1 ? 's' : ''} - ${totalMinutesToday} min total
                            </span>
                        </div>
                    </div>
                ` : `
                    <div class="workout-widget__empty-state">
                        <div class="workout-widget__empty-icon">
                            <i data-lucide="${motivation.icon}"></i>
                        </div>
                        <p class="workout-widget__motivation">${motivation.text}</p>
                    </div>
                `}

                <!-- Weekly Progress Bar -->
                <div class="workout-widget__weekly-progress">
                    <div class="workout-weekly-progress__header">
                        <span class="workout-weekly-progress__label">
                            <i data-lucide="target"></i>
                            Weekly Goal
                        </span>
                        <span class="workout-weekly-progress__count ${weeklyGoalMet ? 'workout-weekly-progress__count--complete' : ''}">
                            ${daysWithWorkouts}/${weeklyGoal} days
                            ${weeklyGoalMet ? ' ✓' : ''}
                        </span>
                    </div>
                    <div class="workout-weekly-progress__bar">
                        <div class="workout-weekly-progress__fill ${weeklyGoalMet ? 'workout-weekly-progress__fill--complete' : ''}"
                             style="width: ${weeklyProgress}%"></div>
                    </div>
                </div>

                <div class="workout-widget__week">
                    ${['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => {
                        // Get the date for this day of the week (week starts on Sunday)
                        const now = new Date();
                        const currentDayOfWeek = now.getDay(); // 0=Sunday, 1=Monday, etc.
                        const sundayStart = new Date(now);
                        sundayStart.setDate(now.getDate() - currentDayOfWeek);
                        sundayStart.setHours(0, 0, 0, 0);

                        const dayDate = DateUtils.addDays(sundayStart, i);
                        const dayDateStr = DateUtils.formatISO(dayDate);
                        const todayStr = DateUtils.today();
                        const dayNum = dayDate.getDate();

                        const hasWorkout = thisWeekLogs.some(l => l.date === dayDateStr);
                        const isToday = dayDateStr === todayStr;
                        const isPast = dayDateStr < todayStr;
                        const isMissed = isPast && !hasWorkout;

                        return `
                            <div class="workout-day ${hasWorkout ? 'workout-day--done' : ''} ${isToday ? 'workout-day--today' : ''} ${isMissed ? 'workout-day--missed' : ''}">
                                <span class="workout-day__name">${day}</span>
                                <span class="workout-day__date">${dayNum}</span>
                                ${hasWorkout ? '<i data-lucide="check" class="workout-day__check"></i>' : ''}
                            </div>
                        `;
                    }).join('')}
                </div>

                <!-- Steps with Goal Progress -->
                <div class="workout-widget__steps-goal">
                    <div class="workout-steps-goal__header">
                        <div class="workout-steps-goal__label">
                            <i data-lucide="footprints"></i>
                            <span>Today's Steps</span>
                        </div>
                        <button class="workout-steps-goal__edit" data-action="edit-steps-goal" title="Set steps goal">
                            <i data-lucide="settings-2"></i>
                        </button>
                    </div>
                    <div class="workout-steps-goal__input-row">
                        <input type="number"
                               class="form-input workout-steps-goal__input"
                               value="${todaySteps || ''}"
                               placeholder="0"
                               min="0"
                               max="100000">
                        <span class="workout-steps-goal__target">/ ${(stepsGoal / 1000).toFixed(0)}k</span>
                    </div>
                    <div class="workout-steps-goal__bar">
                        <div class="workout-steps-goal__fill ${stepsProgress >= 100 ? 'workout-steps-goal__fill--complete' : ''}"
                             style="width: ${stepsProgress}%"></div>
                    </div>
                    ${stepsProgress >= 100 ? `
                        <span class="workout-steps-goal__success">
                            <i data-lucide="trophy"></i>
                            Goal reached!
                        </span>
                    ` : ''}
                </div>

                <div class="workout-widget__routines">
                    <h4 class="workout-widget__section-title">${todayLogs.length > 0 ? 'Add Another Workout' : 'Quick Log'}</h4>
                    <div class="workout-widget__list">
                        ${routines.map(routine => `
                            <button class="workout-routine" data-routine-id="${routine.id}" data-member-id="${memberId}">
                                <span class="workout-routine__icon">
                                    <i data-lucide="${routine.icon || 'dumbbell'}"></i>
                                </span>
                                <span class="workout-routine__name">${routine.name}</span>
                                <span class="workout-routine__duration">${routine.duration}m</span>
                            </button>
                        `).join('')}
                    </div>
                </div>

                <div class="workout-widget__footer">
                    <button class="btn btn--sm btn--ghost" data-action="view-history" data-member-id="${memberId}">
                        <i data-lucide="calendar"></i>
                        History
                    </button>
                    <button class="btn btn--sm btn--ghost" data-action="view-measurements" data-member-id="${memberId}">
                        <i data-lucide="ruler"></i>
                        Measurements
                    </button>
                    <button class="btn btn--sm btn--ghost" data-action="open-timer" data-member-id="${memberId}">
                        <i data-lucide="timer"></i>
                        Timer
                    </button>
                    <button class="btn btn--sm btn--ghost" data-action="manage-routines" data-member-id="${memberId}">
                        <i data-lucide="settings"></i>
                        Routines
                    </button>
                </div>
            </div>
        `;

        // Initialize icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Bind events
        bindWidgetEvents(container, memberId);
    }

    /**
     * Bind widget events
     */
    function bindWidgetEvents(container, memberId) {
        const widgetData = getWidgetData(memberId);

        // Log workout for today
        container.querySelectorAll('.workout-routine').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const routineId = btn.dataset.routineId;

                // Check if this will complete daily or weekly goal
                const beforeLogs = widgetData.log.filter(l => l.date === DateUtils.today());
                const wasFirstWorkout = beforeLogs.length === 0;

                logWorkout(memberId, routineId, DateUtils.today());

                // Check if weekly goal just completed
                const afterData = getWidgetData(memberId);
                const sundayStart = new Date();
                sundayStart.setDate(sundayStart.getDate() - sundayStart.getDay());
                sundayStart.setHours(0, 0, 0, 0);
                const weekLogs = getWeeklyLogs(afterData.log, sundayStart);
                const daysWithWorkouts = new Set(weekLogs.map(l => l.date)).size;
                const weeklyGoalMet = daysWithWorkouts >= afterData.weeklyGoal;

                // Show celebration
                if (wasFirstWorkout) {
                    if (weeklyGoalMet && daysWithWorkouts === afterData.weeklyGoal) {
                        showCelebration('weekly');
                    } else {
                        showCelebration('daily');
                    }
                }

                renderWidget(container, memberId);
            });
        });

        // Steps input with goal tracking - save on blur or Enter
        const stepsInput = container.querySelector('.workout-steps-goal__input');
        if (stepsInput) {
            const saveStepsValue = () => {
                const steps = parseInt(stepsInput.value) || 0;
                const today = DateUtils.today();
                const oldSteps = widgetData.stepsLog[today] || 0;
                const stepsGoal = widgetData.stepsGoal || 10000;

                saveSteps(memberId, today, steps);

                // Check if steps goal just reached
                if (oldSteps < stepsGoal && steps >= stepsGoal) {
                    Toast.success('🎉 Steps goal reached!');
                }
            };

            stepsInput.addEventListener('blur', saveStepsValue);
            stepsInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    stepsInput.blur();
                    renderWidget(container, memberId);
                }
            });
        }

        // Edit steps goal
        container.querySelector('[data-action="edit-steps-goal"]')?.addEventListener('click', () => {
            showStepsGoalModal(memberId, container);
        });

        // View history - opens full page
        container.querySelector('[data-action="view-history"]')?.addEventListener('click', () => {
            // Save any pending steps before navigating
            const stepsInputEl = container.querySelector('.workout-steps-goal__input');
            if (stepsInputEl && stepsInputEl.value) {
                const steps = parseInt(stepsInputEl.value) || 0;
                saveSteps(memberId, DateUtils.today(), steps);
            }
            showHistoryPage(memberId);
        });

        // Manage routines
        container.querySelector('[data-action="manage-routines"]')?.addEventListener('click', () => {
            showManageRoutinesModal(memberId);
        });

        // View measurements
        container.querySelector('[data-action="view-measurements"]')?.addEventListener('click', () => {
            showMeasurementsModal(memberId);
        });

        // Open timer - scroll to Circuit Timer widget, switch focus, or auto-add it
        container.querySelector('[data-action="open-timer"]')?.addEventListener('click', () => {
            const scrollToAndHighlight = (widget) => {
                const widgetCard = widget.closest('.widget-card');
                if (widgetCard) {
                    widgetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    widgetCard.classList.add('widget-card--highlight');
                    setTimeout(() => widgetCard.classList.remove('widget-card--highlight'), 2000);
                }
            };

            const timerWidget = document.getElementById('widget-circuit-timer');
            if (timerWidget) {
                // Widget is already rendered/focused, scroll to it
                scrollToAndHighlight(timerWidget);
            } else {
                // Try to find the collapsed widget card and click it to focus
                const collapsedCard = document.querySelector('[data-focus-widget="circuit-timer"]');
                if (collapsedCard) {
                    collapsedCard.click();
                    // After focus switch, scroll to and highlight
                    setTimeout(() => {
                        const newWidget = document.getElementById('widget-circuit-timer');
                        if (newWidget) {
                            scrollToAndHighlight(newWidget);
                        }
                    }, 100);
                } else {
                    // Widget not added - auto-add it to the dashboard
                    Storage.addWidgetToMember(memberId, 'circuit-timer');
                    Toast.success('Circuit Timer added to your dashboard!');

                    // Re-render dashboard to show the new widget
                    State.emit('tabChanged', memberId);

                    // After re-render, scroll to the new widget
                    setTimeout(() => {
                        const newWidget = document.getElementById('widget-circuit-timer');
                        if (newWidget) {
                            scrollToAndHighlight(newWidget);
                        }
                    }, 200);
                }
            }
        });
    }

    /**
     * Show steps goal setting modal
     */
    function showStepsGoalModal(memberId, widgetContainer) {
        const widgetData = getWidgetData(memberId);
        const currentGoal = widgetData.stepsGoal || 10000;

        Modal.open({
            title: 'Set Daily Steps Goal',
            content: `
                <div class="steps-goal-form">
                    <div class="form-group">
                        <label class="form-label">Daily Steps Goal</label>
                        <input type="number" class="form-input" id="stepsGoalInput"
                               value="${currentGoal}" min="1000" max="50000" step="1000">
                    </div>
                    <div class="steps-goal-presets">
                        <button type="button" class="btn btn--secondary btn--sm" data-preset="5000">5k</button>
                        <button type="button" class="btn btn--secondary btn--sm" data-preset="7500">7.5k</button>
                        <button type="button" class="btn btn--secondary btn--sm" data-preset="10000">10k</button>
                        <button type="button" class="btn btn--secondary btn--sm" data-preset="12000">12k</button>
                        <button type="button" class="btn btn--secondary btn--sm" data-preset="15000">15k</button>
                    </div>
                </div>
            `,
            footer: Modal.createFooter('Cancel', 'Save')
        });

        // Preset buttons
        document.querySelectorAll('.steps-goal-presets [data-preset]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById('stepsGoalInput').value = btn.dataset.preset;
            });
        });

        Modal.bindFooterEvents(() => {
            const newGoal = parseInt(document.getElementById('stepsGoalInput')?.value) || 10000;

            if (newGoal < 1000 || newGoal > 50000) {
                Toast.error('Steps goal must be between 1,000 and 50,000');
                return false;
            }

            const updatedData = {
                ...widgetData,
                stepsGoal: newGoal
            };
            Storage.setWidgetData(memberId, 'workout', updatedData);
            Toast.success(`Steps goal set to ${newGoal.toLocaleString()}`);

            // Refresh widget
            if (widgetContainer) {
                renderWidget(widgetContainer, memberId);
            }

            return true;
        });
    }

    /**
     * Save steps for a specific date
     */
    function saveSteps(memberId, date, steps) {
        const widgetData = getWidgetData(memberId);

        const updatedData = {
            ...widgetData,
            stepsLog: {
                ...(widgetData.stepsLog || {}),
                [date]: steps
            }
        };

        Storage.setWidgetData(memberId, 'workout', updatedData);
    }

    /**
     * Log a workout for a specific date
     */
    function logWorkout(memberId, routineId, date) {
        const widgetData = getWidgetData(memberId);

        // Find the routine
        let routine = widgetData.routines.find(r => r.id === routineId);
        if (!routine) {
            routine = DEFAULT_ROUTINES.find(r => r.id === routineId);
        }
        if (!routine) {
            Toast.error('Routine not found');
            return;
        }

        const newLog = {
            id: `workout-${Date.now()}`,
            date: date,
            routineId: routineId,
            routineName: routine.name,
            duration: routine.duration,
            icon: routine.icon || 'dumbbell',
            createdAt: new Date().toISOString()
        };

        const updatedData = {
            ...widgetData,
            log: [newLog, ...widgetData.log].slice(0, 365) // Keep last 365 entries
        };

        Storage.setWidgetData(memberId, 'workout', updatedData);
        Toast.success(`Logged: ${routine.name}!`);
    }

    /**
     * Delete a workout entry
     */
    function deleteWorkout(memberId, workoutId) {
        const widgetData = getWidgetData(memberId);
        const updatedLog = widgetData.log.filter(l => l.id !== workoutId);

        const updatedData = {
            ...widgetData,
            log: updatedLog
        };

        Storage.setWidgetData(memberId, 'workout', updatedData);
        Toast.success('Workout removed');
    }

    /**
     * Show the full page history view
     */
    function showHistoryPage(memberId, viewMode = 'weekly', activeTab = 'history') {
        const main = document.getElementById('mainContent');
        if (!main) return;

        const member = Storage.getMember(memberId);
        if (viewMode === 'monthly') {
            renderMonthlyHistoryPage(main, memberId, member, new Date());
        } else {
            renderHistoryPage(main, memberId, member, new Date(), activeTab);
        }
    }

    /**
     * Get month start date
     */
    function getMonthStart(date) {
        const d = new Date(date);
        d.setDate(1);
        d.setHours(0, 0, 0, 0);
        return d;
    }

    /**
     * Get all days in a month for calendar display
     */
    function getCalendarDays(monthDate) {
        const year = monthDate.getFullYear();
        const month = monthDate.getMonth();

        // First day of the month
        const firstDay = new Date(year, month, 1);
        // Last day of the month
        const lastDay = new Date(year, month + 1, 0);

        // Start from Sunday of the week containing the first day
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - startDate.getDay());

        // End on Saturday of the week containing the last day
        const endDate = new Date(lastDay);
        endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

        const days = [];
        const current = new Date(startDate);

        while (current <= endDate) {
            days.push({
                date: new Date(current),
                dateStr: DateUtils.formatISO(current),
                isCurrentMonth: current.getMonth() === month,
                dayNum: current.getDate()
            });
            current.setDate(current.getDate() + 1);
        }

        return days;
    }

    /**
     * Get logs for a specific month
     */
    function getMonthlyLogs(logs, monthDate) {
        if (!logs || !Array.isArray(logs)) return [];
        const year = monthDate.getFullYear();
        const month = monthDate.getMonth();

        return logs.filter(l => {
            const logDate = new Date(l.date);
            return logDate.getFullYear() === year && logDate.getMonth() === month;
        });
    }

    /**
     * Render monthly calendar history page
     */
    function renderMonthlyHistoryPage(container, memberId, member, currentMonthDate) {
        const widgetData = getWidgetData(memberId);
        const logs = widgetData.log;
        const stepsLog = widgetData.stepsLog || {};
        const weeklyGoal = widgetData.weeklyGoal || 4;
        const streak = calculateStreak(logs);

        const monthStart = getMonthStart(currentMonthDate);
        const monthLogs = getMonthlyLogs(logs, monthStart);
        const daysWithWorkouts = new Set(monthLogs.map(l => l.date)).size;
        const totalMinutesThisMonth = monthLogs.reduce((sum, l) => sum + (l.duration || 0), 0);
        const today = DateUtils.today();

        // Get calendar days
        const calendarDays = getCalendarDays(monthStart);

        // Format month for display
        const monthName = monthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

        // Check if viewing current month
        const currentMonthStart = getMonthStart(new Date());
        const isCurrentMonth = monthStart.getTime() === currentMonthStart.getTime();

        container.innerHTML = `
            <div class="workout-page workout-page--monthly">
                <div class="workout-page__header">
                    <button class="btn btn--ghost" id="backToMemberBtn">
                        <i data-lucide="arrow-left"></i>
                        Back to ${member?.name || 'Dashboard'}
                    </button>
                    <h1 class="workout-page__title">
                        <i data-lucide="dumbbell"></i>
                        Workout History
                    </h1>
                    <div class="workout-page__view-toggle">
                        <button class="workout-view-btn" id="weeklyViewBtn">
                            <i data-lucide="calendar-days"></i>
                            Week
                        </button>
                        <button class="workout-view-btn workout-view-btn--active" id="monthlyViewBtn">
                            <i data-lucide="calendar"></i>
                            Month
                        </button>
                    </div>
                </div>

                <div class="workout-page__nav workout-page__nav--month">
                    <button class="workout-page__nav-btn" id="prevMonthBtn" title="Previous month">
                        <i data-lucide="chevron-left"></i>
                    </button>
                    <span class="workout-page__month">${monthName}</span>
                    <button class="workout-page__nav-btn" id="nextMonthBtn" title="Next month" ${isCurrentMonth ? 'disabled' : ''}>
                        <i data-lucide="chevron-right"></i>
                    </button>
                </div>

                <div class="workout-page__stats">
                    <div class="workout-stat-card">
                        <div class="workout-stat-card__icon workout-stat-card__icon--flame">
                            <i data-lucide="flame"></i>
                        </div>
                        <div class="workout-stat-card__info">
                            <span class="workout-stat-card__value">${streak}</span>
                            <span class="workout-stat-card__label">Day Streak</span>
                        </div>
                    </div>
                    <div class="workout-stat-card">
                        <div class="workout-stat-card__icon workout-stat-card__icon--target">
                            <i data-lucide="calendar-check"></i>
                        </div>
                        <div class="workout-stat-card__info">
                            <span class="workout-stat-card__value">${daysWithWorkouts}</span>
                            <span class="workout-stat-card__label">Days This Month</span>
                        </div>
                    </div>
                    <div class="workout-stat-card">
                        <div class="workout-stat-card__icon workout-stat-card__icon--clock">
                            <i data-lucide="clock"></i>
                        </div>
                        <div class="workout-stat-card__info">
                            <span class="workout-stat-card__value">${Math.floor(totalMinutesThisMonth / 60)}h ${totalMinutesThisMonth % 60}m</span>
                            <span class="workout-stat-card__label">This Month</span>
                        </div>
                    </div>
                    <div class="workout-stat-card">
                        <div class="workout-stat-card__icon workout-stat-card__icon--total">
                            <i data-lucide="trophy"></i>
                        </div>
                        <div class="workout-stat-card__info">
                            <span class="workout-stat-card__value">${logs.length}</span>
                            <span class="workout-stat-card__label">Total Workouts</span>
                        </div>
                    </div>
                </div>

                <div class="workout-calendar">
                    <div class="workout-calendar__header">
                        ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => `
                            <div class="workout-calendar__day-name">${day}</div>
                        `).join('')}
                    </div>
                    <div class="workout-calendar__grid">
                        ${calendarDays.map(day => {
                            const dayWorkouts = logs.filter(l => l.date === day.dateStr);
                            const daySteps = stepsLog[day.dateStr] || 0;
                            const hasWorkout = dayWorkouts.length > 0;
                            const isToday = day.dateStr === today;
                            const isFuture = day.dateStr > today;
                            const totalMinutes = dayWorkouts.reduce((sum, w) => sum + (w.duration || 0), 0);

                            return `
                                <div class="workout-calendar__cell ${!day.isCurrentMonth ? 'workout-calendar__cell--other-month' : ''}
                                            ${hasWorkout ? 'workout-calendar__cell--has-workout' : ''}
                                            ${isToday ? 'workout-calendar__cell--today' : ''}
                                            ${isFuture ? 'workout-calendar__cell--future' : ''}"
                                     data-date="${day.dateStr}">
                                    <span class="workout-calendar__cell-date">${day.dayNum}</span>
                                    ${hasWorkout ? `
                                        <div class="workout-calendar__cell-indicator">
                                            <i data-lucide="check-circle"></i>
                                        </div>
                                        <span class="workout-calendar__cell-minutes">${totalMinutes}m</span>
                                    ` : ''}
                                    ${daySteps > 0 ? `
                                        <span class="workout-calendar__cell-steps">${(daySteps / 1000).toFixed(0)}k</span>
                                    ` : ''}
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <div class="workout-month-summary">
                    <h3 class="workout-month-summary__title">
                        <i data-lucide="bar-chart-3"></i>
                        Monthly Summary
                    </h3>
                    <div class="workout-month-summary__stats">
                        <div class="workout-month-summary__stat">
                            <span class="workout-month-summary__stat-value">${monthLogs.length}</span>
                            <span class="workout-month-summary__stat-label">Workouts</span>
                        </div>
                        <div class="workout-month-summary__stat">
                            <span class="workout-month-summary__stat-value">${daysWithWorkouts}</span>
                            <span class="workout-month-summary__stat-label">Active Days</span>
                        </div>
                        <div class="workout-month-summary__stat">
                            <span class="workout-month-summary__stat-value">${daysWithWorkouts > 0 ? Math.round(totalMinutesThisMonth / daysWithWorkouts) : 0}m</span>
                            <span class="workout-month-summary__stat-label">Avg/Day</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Bind events
        bindMonthlyHistoryPageEvents(container, memberId, member, monthStart);
    }

    /**
     * Bind monthly history page events
     */
    function bindMonthlyHistoryPageEvents(container, memberId, member, monthStart) {
        // Back button - use onclick property for reliable replacement on re-render
        const backBtn = container.querySelector('#backToMemberBtn');
        if (backBtn) {
            backBtn.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                State.emit('tabChanged', memberId);
            };
            backBtn.style.cursor = 'pointer';
        }

        // Switch to weekly view
        container.querySelector('#weeklyViewBtn')?.addEventListener('click', () => {
            renderHistoryPage(container, memberId, member, new Date());
        });

        // Previous month
        container.querySelector('#prevMonthBtn')?.addEventListener('click', () => {
            const prevMonth = new Date(monthStart);
            prevMonth.setMonth(prevMonth.getMonth() - 1);
            renderMonthlyHistoryPage(container, memberId, member, prevMonth);
        });

        // Next month
        container.querySelector('#nextMonthBtn')?.addEventListener('click', () => {
            const nextMonth = new Date(monthStart);
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            renderMonthlyHistoryPage(container, memberId, member, nextMonth);
        });

        // Click on calendar cell to add workout
        container.querySelectorAll('.workout-calendar__cell').forEach(cell => {
            cell.addEventListener('click', () => {
                const date = cell.dataset.date;
                const today = DateUtils.today();
                if (date <= today) {
                    showAddWorkoutModal(memberId, date, container, member, monthStart, 'monthly');
                }
            });
        });
    }

    /**
     * Render the calendar heatmap tab (GitHub-style activity calendar)
     */
    function renderCalendarHeatmap(memberId, logs, stepsLog, calendarView = 'year', viewMonth = null, viewYear = null) {
        const today = new Date();
        const currentMonth = viewMonth !== null ? viewMonth : today.getMonth();
        const currentYear = viewYear !== null ? viewYear : today.getFullYear();

        // Create a map of date -> workout count and total duration
        const workoutMap = {};
        logs.forEach(log => {
            if (!workoutMap[log.date]) {
                workoutMap[log.date] = { count: 0, duration: 0 };
            }
            workoutMap[log.date].count++;
            workoutMap[log.date].duration += log.duration || 0;
        });

        // Calculate totals
        const totalWorkouts = logs.length;
        const totalDuration = logs.reduce((sum, l) => sum + (l.duration || 0), 0);
        const daysWithWorkouts = Object.keys(workoutMap).length;

        return `
            <div class="workout-calendar-container">
                <div class="workout-calendar__header">
                    <h3 class="workout-calendar__title">
                        <i data-lucide="calendar-range"></i>
                        Activity Calendar
                    </h3>
                    <div class="workout-calendar__view-toggle">
                        <button class="workout-calendar__view-btn ${calendarView === 'month' ? 'workout-calendar__view-btn--active' : ''}" data-calendar-view="month">
                            Month
                        </button>
                        <button class="workout-calendar__view-btn ${calendarView === 'year' ? 'workout-calendar__view-btn--active' : ''}" data-calendar-view="year">
                            Year
                        </button>
                    </div>
                </div>

                <div class="workout-calendar__stats">
                    <span>${totalWorkouts} workouts</span>
                    <span>${daysWithWorkouts} active days</span>
                    <span>${Math.floor(totalDuration / 60)}h ${totalDuration % 60}m total</span>
                </div>

                ${calendarView === 'month' ? renderMonthlyCalendar(workoutMap, stepsLog, currentMonth, currentYear) : renderYearlyHeatmap(workoutMap, stepsLog, today)}

                <div class="workout-heatmap__detail" id="heatmapDetail" style="display: none;">
                    <div class="workout-heatmap__detail-header">
                        <span id="heatmapDetailDate"></span>
                        <button class="btn btn--icon btn--ghost btn--sm" id="closeHeatmapDetail">
                            <i data-lucide="x"></i>
                        </button>
                    </div>
                    <div class="workout-heatmap__detail-content" id="heatmapDetailContent">
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render monthly calendar view
     */
    function renderMonthlyCalendar(workoutMap, stepsLog, month, year) {
        const today = DateUtils.today();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startPadding = firstDay.getDay(); // Days to pad at start (0 = Sunday)
        const daysInMonth = lastDay.getDate();

        const monthName = firstDay.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

        // Build calendar grid
        const days = [];

        // Add padding for days before the first of the month
        for (let i = 0; i < startPadding; i++) {
            days.push({ empty: true });
        }

        // Add actual days
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const workout = workoutMap[dateStr];
            const steps = stepsLog[dateStr] || 0;
            const isToday = dateStr === today;
            const isFuture = dateStr > today;

            let level = 0;
            if (workout) {
                if (workout.duration >= 60) level = 4;
                else if (workout.duration >= 45) level = 3;
                else if (workout.duration >= 30) level = 2;
                else level = 1;
            }

            days.push({
                date: dateStr,
                dayNum: d,
                level,
                workout,
                steps,
                isToday,
                isFuture
            });
        }

        // Calculate month stats
        const monthWorkouts = Object.entries(workoutMap)
            .filter(([date]) => date.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`));
        const monthTotal = monthWorkouts.reduce((sum, [, w]) => sum + w.duration, 0);
        const monthActiveDays = monthWorkouts.length;

        return `
            <div class="workout-month-calendar">
                <div class="workout-month-calendar__nav">
                    <button class="workout-month-calendar__nav-btn" id="prevMonthBtn">
                        <i data-lucide="chevron-left"></i>
                    </button>
                    <span class="workout-month-calendar__month">${monthName}</span>
                    <button class="workout-month-calendar__nav-btn" id="nextMonthBtn" ${month === new Date().getMonth() && year === new Date().getFullYear() ? 'disabled' : ''}>
                        <i data-lucide="chevron-right"></i>
                    </button>
                </div>

                <div class="workout-month-calendar__summary">
                    <span><strong>${monthActiveDays}</strong> active days</span>
                    <span><strong>${Math.floor(monthTotal / 60)}h ${monthTotal % 60}m</strong> total</span>
                </div>

                <div class="workout-month-calendar__grid">
                    <div class="workout-month-calendar__header">
                        <span>Sun</span>
                        <span>Mon</span>
                        <span>Tue</span>
                        <span>Wed</span>
                        <span>Thu</span>
                        <span>Fri</span>
                        <span>Sat</span>
                    </div>
                    <div class="workout-month-calendar__days">
                        ${days.map(day => {
                            if (day.empty) {
                                return `<div class="workout-month-calendar__day workout-month-calendar__day--empty"></div>`;
                            }
                            return `
                                <div class="workout-month-calendar__day workout-month-calendar__day--level-${day.level} ${day.isToday ? 'workout-month-calendar__day--today' : ''} ${day.isFuture ? 'workout-month-calendar__day--future' : ''}"
                                     data-date="${day.date}">
                                    <span class="workout-month-calendar__day-num">${day.dayNum}</span>
                                    ${day.workout ? `
                                        <div class="workout-month-calendar__day-info">
                                            <i data-lucide="dumbbell"></i>
                                            <span>${day.workout.duration}m</span>
                                        </div>
                                    ` : ''}
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <div class="workout-heatmap__legend">
                    <span>Less</span>
                    <div class="workout-heatmap__cell workout-heatmap__cell--level-0"></div>
                    <div class="workout-heatmap__cell workout-heatmap__cell--level-1"></div>
                    <div class="workout-heatmap__cell workout-heatmap__cell--level-2"></div>
                    <div class="workout-heatmap__cell workout-heatmap__cell--level-3"></div>
                    <div class="workout-heatmap__cell workout-heatmap__cell--level-4"></div>
                    <span>More</span>
                </div>
            </div>
        `;
    }

    /**
     * Render yearly heatmap view
     */
    function renderYearlyHeatmap(workoutMap, stepsLog, today) {
        // Get the last 12 months of data
        const months = [];
        for (let i = 11; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            months.push({
                year: d.getFullYear(),
                month: d.getMonth(),
                name: d.toLocaleDateString('en-US', { month: 'short' })
            });
        }

        // Get all dates for the last year
        const startDate = new Date(today);
        startDate.setFullYear(startDate.getFullYear() - 1);
        startDate.setDate(startDate.getDate() - startDate.getDay()); // Start from Sunday

        const weeks = [];
        let currentWeek = [];
        const current = new Date(startDate);
        const endDate = new Date(today);

        while (current <= endDate) {
            const dateStr = DateUtils.formatISO(current);
            const workout = workoutMap[dateStr];
            const steps = stepsLog[dateStr] || 0;

            // Calculate intensity level (0-4) based on workout count or duration
            let level = 0;
            if (workout) {
                if (workout.duration >= 60) level = 4;
                else if (workout.duration >= 45) level = 3;
                else if (workout.duration >= 30) level = 2;
                else level = 1;
            }

            currentWeek.push({
                date: dateStr,
                dayNum: current.getDate(),
                month: current.getMonth(),
                level,
                workout,
                steps,
                isToday: dateStr === DateUtils.today()
            });

            if (current.getDay() === 6 || current >= endDate) {
                weeks.push([...currentWeek]);
                currentWeek = [];
            }

            current.setDate(current.getDate() + 1);
        }

        return `
            <div class="workout-heatmap">
                <div class="workout-heatmap__months">
                    ${months.map(m => `<span>${m.name}</span>`).join('')}
                </div>

                <div class="workout-heatmap__grid">
                    <div class="workout-heatmap__days">
                        <span>Sun</span>
                        <span>Mon</span>
                        <span>Tue</span>
                        <span>Wed</span>
                        <span>Thu</span>
                        <span>Fri</span>
                        <span>Sat</span>
                    </div>
                    <div class="workout-heatmap__weeks">
                        ${weeks.map(week => `
                            <div class="workout-heatmap__week">
                                ${week.map(day => `
                                    <div class="workout-heatmap__cell workout-heatmap__cell--level-${day.level} ${day.isToday ? 'workout-heatmap__cell--today' : ''}"
                                         data-date="${day.date}"
                                         title="${day.date}${day.workout ? `: ${day.workout.count} workout(s), ${day.workout.duration}m` : ''}">
                                    </div>
                                `).join('')}
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="workout-heatmap__legend">
                    <span>Less</span>
                    <div class="workout-heatmap__cell workout-heatmap__cell--level-0"></div>
                    <div class="workout-heatmap__cell workout-heatmap__cell--level-1"></div>
                    <div class="workout-heatmap__cell workout-heatmap__cell--level-2"></div>
                    <div class="workout-heatmap__cell workout-heatmap__cell--level-3"></div>
                    <div class="workout-heatmap__cell workout-heatmap__cell--level-4"></div>
                    <span>More</span>
                </div>

                <div class="workout-heatmap__mobile-hint">
                    <i data-lucide="hand"></i>
                    Swipe to scroll • Switch to Month view for better detail
                </div>
            </div>
        `;
    }

    /**
     * Render the body measurements tab
     */
    function renderBodyMeasurementsTab(memberId) {
        const data = getMeasurementsData(memberId);
        const { settings, log } = data;
        const sortedLog = [...(log || [])].sort((a, b) => new Date(b.date) - new Date(a.date));
        const enabledMetrics = MEASUREMENT_METRICS.filter(m => settings.enabledMetrics.includes(m.id));

        // Calculate trends for each metric
        const getMetricTrend = (metricId) => {
            const entries = sortedLog.filter(e => e.values[metricId] !== undefined);
            if (entries.length < 2) return null;
            const latest = entries[0].values[metricId];
            const earliest = entries[entries.length - 1].values[metricId];
            const diff = latest - earliest;
            return {
                diff: convertForDisplay(diff, metricId, settings.unit),
                direction: diff > 0 ? 'up' : diff < 0 ? 'down' : 'same',
                entries: entries.length
            };
        };

        return `
            <div class="workout-body-tab">
                <div class="workout-body-tab__header">
                    <h3 class="workout-body-tab__title">
                        <i data-lucide="ruler"></i>
                        Body Measurements
                    </h3>
                    <div class="workout-body-tab__actions">
                        <div class="measurements-modal__unit-toggle">
                            <button class="measurements-unit-btn ${settings.unit === 'metric' ? 'measurements-unit-btn--active' : ''}"
                                    data-unit="metric">Metric</button>
                            <button class="measurements-unit-btn ${settings.unit === 'imperial' ? 'measurements-unit-btn--active' : ''}"
                                    data-unit="imperial">Imperial</button>
                        </div>
                        <button class="btn btn--primary btn--sm" id="bodyTabLogBtn">
                            <i data-lucide="plus"></i>
                            Log
                        </button>
                    </div>
                </div>

                ${sortedLog.length > 0 ? `
                    <div class="workout-body-tab__summary">
                        ${enabledMetrics.map(metric => {
                            const latestEntry = sortedLog.find(e => e.values[metric.id] !== undefined);
                            const latestValue = latestEntry ? convertForDisplay(latestEntry.values[metric.id], metric.id, settings.unit) : null;
                            const trend = getMetricTrend(metric.id);
                            const unit = metric.unit[settings.unit];

                            return `
                                <div class="workout-body-card">
                                    <div class="workout-body-card__header">
                                        <span class="workout-body-card__label">${metric.name}</span>
                                        ${trend ? `
                                            <span class="workout-body-card__trend workout-body-card__trend--${trend.direction}">
                                                <i data-lucide="${trend.direction === 'up' ? 'trending-up' : trend.direction === 'down' ? 'trending-down' : 'minus'}"></i>
                                                ${Math.abs(trend.diff).toFixed(1)} ${unit}
                                            </span>
                                        ` : ''}
                                    </div>
                                    <div class="workout-body-card__value">
                                        ${latestValue !== null ? formatDisplayValue(latestValue, metric.id) : '-'}
                                        <span class="workout-body-card__unit">${unit}</span>
                                    </div>
                                    ${latestEntry ? `
                                        <div class="workout-body-card__date">
                                            Last updated: ${formatDateLocal(latestEntry.date)}
                                        </div>
                                    ` : ''}
                                </div>
                            `;
                        }).join('')}
                    </div>

                    ${sortedLog.length >= 2 ? `
                        <div class="workout-body-tab__chart">
                            <div class="measurements-chart">
                                <h4 class="measurements-chart__title">
                                    <i data-lucide="trending-up"></i>
                                    Progress (Last 30 days)
                                </h4>
                                <div class="measurements-chart__container" id="bodyTabChart">
                                    ${renderMiniChart(sortedLog, enabledMetrics[0], settings.unit)}
                                </div>
                                ${enabledMetrics.length > 1 ? `
                                    <div class="measurements-chart__legend">
                                        ${enabledMetrics.map((m, i) => `
                                            <button class="measurements-chart__legend-btn ${i === 0 ? 'measurements-chart__legend-btn--active' : ''}"
                                                    data-metric="${m.id}">${m.name}</button>
                                        `).join('')}
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    ` : ''}

                    <div class="workout-body-tab__history">
                        <h4 class="workout-body-tab__subtitle">
                            <i data-lucide="history"></i>
                            History (${sortedLog.length} entries)
                        </h4>
                        <div class="workout-body-tab__list">
                            ${sortedLog.map(entry => `
                                <div class="workout-body-history-item">
                                    <div class="workout-body-history-item__date">
                                        ${formatDateLocal(entry.date)}
                                    </div>
                                    <div class="workout-body-history-item__values">
                                        ${enabledMetrics.map(m => {
                                            if (entry.values[m.id] === undefined) return '';
                                            const displayVal = formatDisplayValue(convertForDisplay(entry.values[m.id], m.id, settings.unit), m.id);
                                            return `<span><strong>${m.name}:</strong> ${displayVal} ${m.unit[settings.unit]}</span>`;
                                        }).filter(Boolean).join('')}
                                    </div>
                                    <button class="btn btn--icon btn--ghost btn--sm workout-body-history-item__delete" data-delete-entry="${entry.id}">
                                        <i data-lucide="trash-2"></i>
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : `
                    <div class="workout-body-tab__empty">
                        <i data-lucide="ruler"></i>
                        <p>No measurements logged yet</p>
                        <p class="text-muted">Start tracking your body measurements!</p>
                        <button class="btn btn--primary" id="bodyTabLogBtn">
                            <i data-lucide="plus"></i>
                            Log Measurements
                        </button>
                    </div>
                `}
            </div>
        `;
    }

    /**
     * Render the history page with weekly view
     */
    function renderHistoryPage(container, memberId, member, currentWeekDate, activeTab = 'history', calendarView = 'year', calendarMonth = null, calendarYear = null) {
        const widgetData = getWidgetData(memberId);
        const logs = widgetData.log;
        const routines = widgetData.routines;
        const stepsLog = widgetData.stepsLog || {};
        const weeklyGoal = widgetData.weeklyGoal || 4;
        const streak = calculateStreak(logs);

        const weekStart = getWeekStart(currentWeekDate);
        const weekLogs = getWeeklyLogs(logs, weekStart);
        const daysWithWorkouts = new Set(weekLogs.map(l => l.date)).size;
        const totalMinutesThisWeek = weekLogs.reduce((sum, l) => sum + (l.duration || 0), 0);
        const today = DateUtils.today();

        // Format week range for display
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        const weekRangeText = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

        // Check if viewing current week
        const currentWeekStart = getWeekStart(new Date());
        const isCurrentWeek = weekStart.getTime() === currentWeekStart.getTime();

        // Calculate total workout time
        const totalWorkoutMinutes = logs.reduce((sum, l) => sum + (l.duration || 0), 0);
        const totalHours = Math.floor(totalWorkoutMinutes / 60);
        const totalMins = totalWorkoutMinutes % 60;

        container.innerHTML = `
            <div class="workout-page workout-page--tabbed">
                <!-- Hero Header -->
                <div class="workout-page__hero">
                    <button class="btn btn--ghost workout-page__back" id="backToMemberBtn">
                        <i data-lucide="arrow-left"></i>
                        Back
                    </button>
                    <div class="workout-page__hero-content">
                        <h1 class="workout-page__hero-title">
                            <i data-lucide="dumbbell"></i>
                            Workout Tracker
                        </h1>
                        <p class="workout-page__hero-subtitle">Stay active, stay strong</p>
                    </div>
                    <div class="workout-page__hero-stats">
                        <div class="workout-hero-stat">
                            <span class="workout-hero-stat__value">${streak}</span>
                            <span class="workout-hero-stat__label">Day Streak</span>
                        </div>
                        <div class="workout-hero-stat">
                            <span class="workout-hero-stat__value">${logs.length}</span>
                            <span class="workout-hero-stat__label">Total Workouts</span>
                        </div>
                        <div class="workout-hero-stat">
                            <span class="workout-hero-stat__value">${daysWithWorkouts}/${weeklyGoal}</span>
                            <span class="workout-hero-stat__label">This Week</span>
                        </div>
                    </div>
                </div>

                <!-- Tab Navigation -->
                <div class="workout-page__tabs">
                    <button class="workout-tab ${activeTab === 'history' ? 'workout-tab--active' : ''}" data-tab="history">
                        <i data-lucide="list"></i>
                        <span>History</span>
                    </button>
                    <button class="workout-tab ${activeTab === 'calendar' ? 'workout-tab--active' : ''}" data-tab="calendar">
                        <i data-lucide="calendar-range"></i>
                        <span>Calendar</span>
                    </button>
                    <button class="workout-tab ${activeTab === 'body' ? 'workout-tab--active' : ''}" data-tab="body">
                        <i data-lucide="ruler"></i>
                        <span>Body</span>
                    </button>
                </div>

                <!-- Tab Content -->
                <div class="workout-page__content">
                ${activeTab === 'history' ? `
                <div class="workout-history-section">
                    <div class="workout-week-nav">
                        <button class="workout-week-nav__btn" id="prevWeekBtn" title="Previous week">
                            <i data-lucide="chevron-left"></i>
                        </button>
                        <span class="workout-week-nav__text">${weekRangeText}</span>
                        <button class="workout-week-nav__btn" id="nextWeekBtn" title="Next week" ${isCurrentWeek ? 'disabled' : ''}>
                            <i data-lucide="chevron-right"></i>
                        </button>
                    </div>

                    <div class="workout-week">
                        ${[0, 1, 2, 3, 4, 5, 6].map(dayOffset => {
                            const dayDate = new Date(weekStart);
                            dayDate.setDate(dayDate.getDate() + dayOffset);
                            const dateStr = DateUtils.formatISO(dayDate);
                            const dayWorkouts = logs.filter(l => l.date === dateStr);
                            const daySteps = stepsLog[dateStr] || 0;
                            const dayName = dayDate.toLocaleDateString('en-US', { weekday: 'long' });
                            const dayNum = dayDate.getDate();
                            const monthName = dayDate.toLocaleDateString('en-US', { month: 'short' });
                            const isToday = dateStr === today;
                            const isFuture = dateStr > today;
                            const colors = DAY_COLORS[dayOffset];
                            const totalMinutes = dayWorkouts.reduce((sum, w) => sum + (w.duration || 0), 0);

                            // Get suggestion for this day
                            const suggestion = getSuggestionForDate(memberId, dateStr);

                            return `
                                <div class="workout-day-card ${isToday ? 'workout-day-card--today' : ''} ${dayWorkouts.length > 0 ? 'workout-day-card--has-workouts' : ''}"
                                     style="--day-bg: ${colors.bg}; --day-border: ${colors.border}; --day-text: ${colors.text};"
                                     data-date="${dateStr}">
                                    <div class="workout-day-card__header">
                                        <div class="workout-day-card__title">
                                            <span class="workout-day-card__name">${dayName}</span>
                                            <span class="workout-day-card__date">${monthName} ${dayNum}</span>
                                        </div>
                                        ${dayWorkouts.length > 0 ? `
                                            <span class="workout-day-card__summary">${totalMinutes} min</span>
                                        ` : ''}
                                    </div>
                                    <div class="workout-day-card__content">
                                        ${dayWorkouts.length > 0 ? dayWorkouts.map(workout => `
                                            <div class="workout-day-card__item" data-workout-id="${workout.id}">
                                                <i data-lucide="${workout.icon || 'dumbbell'}"></i>
                                                <span class="workout-day-card__item-name">${workout.routineName}</span>
                                                <span class="workout-day-card__item-duration">${workout.duration}m</span>
                                                <button class="workout-day-card__item-delete" data-delete="${workout.id}" title="Remove">
                                                    <i data-lucide="x"></i>
                                                </button>
                                            </div>
                                        `).join('') : `
                                            ${suggestion ? `` : `
                                                <div class="workout-day-card__empty">
                                                    ${isFuture ? `
                                                        <i data-lucide="clock"></i>
                                                        <span>Upcoming</span>
                                                    ` : `
                                                        <i data-lucide="circle-dashed"></i>
                                                        <span>No workout</span>
                                                    `}
                                                </div>
                                            `}
                                            ${suggestion ? `
                                                <div class="workout-day-card__suggestion">
                                                    <div class="workout-day-card__suggestion-label">Suggested</div>
                                                    <div class="workout-day-card__suggestion-content">
                                                        <i data-lucide="${suggestion.icon || 'dumbbell'}"></i>
                                                        <span>${suggestion.routineName}</span>
                                                        <span>${suggestion.duration}m</span>
                                                    </div>
                                                    <button class="btn btn--primary btn--sm suggestion-done-btn"
                                                            data-routine-id="${suggestion.routineId}"
                                                            data-date="${dateStr}"
                                                            ${isFuture ? 'disabled' : ''}>
                                                        <i data-lucide="check"></i>
                                                        ${isFuture ? 'Upcoming' : 'Done'}
                                                    </button>
                                                </div>
                                            ` : ''}
                                        `}
                                        ${daySteps > 0 ? `
                                            <div class="workout-day-card__steps">
                                                <i data-lucide="footprints"></i>
                                                <span>${daySteps.toLocaleString()} steps</span>
                                            </div>
                                        ` : ''}
                                    </div>
                                    ${!isFuture ? `
                                        <button class="workout-day-card__add" data-action="add-workout" data-date="${dateStr}">
                                            <i data-lucide="plus"></i>
                                            Add
                                        </button>
                                    ` : ''}
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <div class="workout-goal-box">
                    <div class="workout-goal-box__header">
                        <i data-lucide="target"></i>
                        <span>Weekly Goal</span>
                    </div>
                    <div class="workout-goal-box__content">
                        <div class="workout-goal-box__progress">
                            <div class="workout-goal-box__bar">
                                <div class="workout-goal-box__fill" style="width: ${Math.min(100, (daysWithWorkouts / weeklyGoal) * 100)}%"></div>
                            </div>
                            <span class="workout-goal-box__text">
                                ${daysWithWorkouts >= weeklyGoal ? '🎉 Goal reached!' : `${weeklyGoal - daysWithWorkouts} more days to go`}
                            </span>
                        </div>
                        <div class="workout-goal-box__setting">
                            <label>Days per week:</label>
                            <div class="workout-goal-buttons">
                                ${[2, 3, 4, 5, 6, 7].map(n => `
                                    <button class="workout-goal-btn ${weeklyGoal === n ? 'workout-goal-btn--active' : ''}"
                                            data-goal="${n}">${n}</button>
                                `).join('')}
                            </div>
                        </div>
                    </div>

                    <div class="workout-quick-add">
                        <h4 class="workout-quick-add__title">Quick Add Today</h4>
                        <div class="workout-quick-add__list">
                            ${routines.map(routine => `
                                <button class="workout-quick-add__btn" data-routine-id="${routine.id}" data-date="${today}">
                                    <i data-lucide="${routine.icon || 'dumbbell'}"></i>
                                    <span>${routine.name}</span>
                                </button>
                            `).join('')}
                        </div>
                    </div>

                    <button class="btn btn--primary workout-suggest-btn" id="suggestWorkoutBtn">
                        <i data-lucide="sparkles"></i>
                        Suggest Workout Plan
                    </button>
                </div>
                ` : ''}

                ${activeTab === 'calendar' ? renderCalendarHeatmap(memberId, logs, stepsLog, calendarView, calendarMonth, calendarYear) : ''}

                ${activeTab === 'body' ? renderBodyMeasurementsTab(memberId) : ''}
                </div>
            </div>
        `;

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Bind events
        bindHistoryPageEvents(container, memberId, member, weekStart);
    }

    /**
     * Bind history page events
     */
    function bindHistoryPageEvents(container, memberId, member, weekStart) {
        // Back button - use onclick property for reliable replacement on re-render
        const backBtn = container.querySelector('#backToMemberBtn');
        if (backBtn) {
            backBtn.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                State.emit('tabChanged', memberId);
            };
            backBtn.style.cursor = 'pointer';
        }

        // Switch to monthly view
        container.querySelector('#monthlyViewBtn')?.addEventListener('click', () => {
            renderMonthlyHistoryPage(container, memberId, member, new Date());
        });

        // Previous week
        container.querySelector('#prevWeekBtn')?.addEventListener('click', () => {
            const prevWeek = new Date(weekStart);
            prevWeek.setDate(prevWeek.getDate() - 7);
            renderHistoryPage(container, memberId, member, prevWeek);
        });

        // Next week
        container.querySelector('#nextWeekBtn')?.addEventListener('click', () => {
            const nextWeek = new Date(weekStart);
            nextWeek.setDate(nextWeek.getDate() + 7);
            renderHistoryPage(container, memberId, member, nextWeek);
        });

        // Add workout buttons on day cards
        container.querySelectorAll('[data-action="add-workout"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const date = btn.dataset.date;
                showAddWorkoutModal(memberId, date, container, member, weekStart);
            });
        });

        // Delete workout buttons
        container.querySelectorAll('.workout-day-card__item-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const workoutId = btn.dataset.delete;
                if (workoutId) {
                    deleteWorkout(memberId, workoutId);
                    renderHistoryPage(container, memberId, member, weekStart);
                }
            });
        });

        // Quick add buttons
        container.querySelectorAll('.workout-quick-add__btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const routineId = btn.dataset.routineId;
                const date = btn.dataset.date;
                logWorkout(memberId, routineId, date);
                renderHistoryPage(container, memberId, member, weekStart);
            });
        });

        // Weekly goal change via buttons
        container.querySelectorAll('.workout-goal-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const newGoal = parseInt(btn.dataset.goal);
                const widgetData = getWidgetData(memberId);
                const updatedData = {
                    ...widgetData,
                    weeklyGoal: newGoal
                };
                Storage.setWidgetData(memberId, 'workout', updatedData);
                Toast.success(`Weekly goal set to ${newGoal} days`);
                renderHistoryPage(container, memberId, member, weekStart);
            });
        });

        // Suggest Workout button
        container.querySelector('#suggestWorkoutBtn')?.addEventListener('click', () => {
            showSuggestionSetupModal(memberId);
        });

        // Mark suggestion as done buttons
        container.querySelectorAll('.suggestion-done-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const routineId = btn.dataset.routineId;
                const date = btn.dataset.date;
                if (routineId && date) {
                    markSuggestionDone(memberId, routineId, date);
                    renderHistoryPage(container, memberId, member, weekStart);
                }
            });
        });

        // Tab switching
        container.querySelectorAll('.workout-tab').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                renderHistoryPage(container, memberId, member, weekStart, tab);
            });
        });

        // Calendar heatmap cell click
        container.querySelectorAll('.workout-heatmap__cell').forEach(cell => {
            cell.addEventListener('click', () => {
                const date = cell.dataset.date;
                showHeatmapDetail(container, memberId, date);
            });
        });

        // Monthly calendar day click
        container.querySelectorAll('.workout-month-calendar__day:not(.workout-month-calendar__day--empty)').forEach(cell => {
            cell.addEventListener('click', () => {
                const date = cell.dataset.date;
                showHeatmapDetail(container, memberId, date);
            });
        });

        // Close heatmap detail
        container.querySelector('#closeHeatmapDetail')?.addEventListener('click', () => {
            const detail = container.querySelector('#heatmapDetail');
            if (detail) detail.style.display = 'none';
        });

        // Calendar view toggle (Month/Year)
        container.querySelectorAll('.workout-calendar__view-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const view = btn.dataset.calendarView;
                renderHistoryPage(container, memberId, member, weekStart, 'calendar', view);
            });
        });

        // Month navigation (prev/next)
        container.querySelector('#prevMonthBtn')?.addEventListener('click', () => {
            const currentMonthEl = container.querySelector('.workout-month-calendar__month');
            if (currentMonthEl) {
                const currentDate = new Date(currentMonthEl.textContent);
                const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
                renderHistoryPage(container, memberId, member, weekStart, 'calendar', 'month', prevMonth.getMonth(), prevMonth.getFullYear());
            }
        });

        container.querySelector('#nextMonthBtn')?.addEventListener('click', () => {
            const currentMonthEl = container.querySelector('.workout-month-calendar__month');
            if (currentMonthEl) {
                const currentDate = new Date(currentMonthEl.textContent);
                const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
                renderHistoryPage(container, memberId, member, weekStart, 'calendar', 'month', nextMonth.getMonth(), nextMonth.getFullYear());
            }
        });

        // Body tab - Unit toggle
        container.querySelectorAll('.workout-body-tab .measurements-unit-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const unit = btn.dataset.unit;
                const data = getMeasurementsData(memberId);
                data.settings.unit = unit;
                saveMeasurementsData(memberId, data);
                renderHistoryPage(container, memberId, member, weekStart, 'body');
            });
        });

        // Body tab - Log button
        container.querySelector('#bodyTabLogBtn')?.addEventListener('click', () => {
            showLogMeasurementsModal(memberId, () => {
                renderHistoryPage(container, memberId, member, weekStart, 'body');
            });
        });

        // Body tab - Delete entry buttons
        container.querySelectorAll('.workout-body-history-item__delete').forEach(btn => {
            btn.addEventListener('click', () => {
                const entryId = btn.dataset.deleteEntry;
                const data = getMeasurementsData(memberId);
                data.log = data.log.filter(entry => entry.id !== entryId);
                saveMeasurementsData(memberId, data);
                Toast.success('Entry deleted');
                renderHistoryPage(container, memberId, member, weekStart, 'body');
            });
        });

        // Body tab - Chart metric toggle
        container.querySelectorAll('.workout-body-tab__chart .measurements-chart__legend-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const metricId = btn.dataset.metric;
                const data = getMeasurementsData(memberId);
                const sortedLog = [...(data.log || [])].sort((a, b) => new Date(b.date) - new Date(a.date));
                const metric = MEASUREMENT_METRICS.find(m => m.id === metricId);

                if (metric) {
                    // Update active state
                    container.querySelectorAll('.workout-body-tab__chart .measurements-chart__legend-btn').forEach(b =>
                        b.classList.remove('measurements-chart__legend-btn--active'));
                    btn.classList.add('measurements-chart__legend-btn--active');

                    // Re-render chart
                    const chartContainer = container.querySelector('#bodyTabChart');
                    if (chartContainer) {
                        chartContainer.innerHTML = renderMiniChart(sortedLog, metric, data.settings.unit);
                    }
                }
            });
        });

        // Body tab - Unit toggle
        container.querySelectorAll('.workout-body-tab .measurements-unit-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const unit = btn.dataset.unit;
                const data = getMeasurementsData(memberId);
                data.settings.unit = unit;
                saveMeasurementsData(memberId, data);
                renderHistoryPage(container, memberId, member, weekStart, 'body');
            });
        });
    }

    /**
     * Show heatmap detail for a specific date
     */
    function showHeatmapDetail(container, memberId, date) {
        const widgetData = getWidgetData(memberId);
        const logs = widgetData.log.filter(l => l.date === date);
        const stepsLog = widgetData.stepsLog || {};
        const steps = stepsLog[date] || 0;
        const today = DateUtils.today();
        const isFuture = date > today;

        const detail = container.querySelector('#heatmapDetail');
        const dateSpan = container.querySelector('#heatmapDetailDate');
        const content = container.querySelector('#heatmapDetailContent');

        if (!detail || !dateSpan || !content) return;

        const dateObj = new Date(date);
        dateSpan.textContent = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

        let html = '';
        if (logs.length > 0) {
            html += `<div class="workout-heatmap__detail-workouts">`;
            logs.forEach(log => {
                html += `
                    <div class="workout-heatmap__detail-item">
                        <i data-lucide="${log.icon || 'dumbbell'}"></i>
                        <span>${log.routineName}</span>
                        <span>${log.duration}m</span>
                        <button class="btn btn--icon btn--ghost btn--sm" data-delete-workout="${log.id}" title="Delete">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>
                `;
            });
            html += `</div>`;
        } else {
            html += `<p class="text-muted">No workouts logged</p>`;
        }

        if (steps > 0) {
            html += `
                <div class="workout-heatmap__detail-steps">
                    <i data-lucide="footprints"></i>
                    <span>${steps.toLocaleString()} steps</span>
                </div>
            `;
        }

        // Add workout button for past/current dates
        if (!isFuture) {
            html += `
                <button class="btn btn--primary btn--sm workout-heatmap__detail-add" data-add-workout-date="${date}">
                    Add Workout
                </button>
            `;
        }

        content.innerHTML = html;
        detail.style.display = 'block';

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Bind add workout button
        const addBtn = content.querySelector('[data-add-workout-date]');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                const member = Storage.getMember(memberId);
                detail.style.display = 'none';
                showAddWorkoutModal(memberId, date, container, member, new Date(), 'weekly');
            });
        }

        // Bind delete buttons
        content.querySelectorAll('[data-delete-workout]').forEach(btn => {
            btn.addEventListener('click', () => {
                const workoutId = btn.dataset.deleteWorkout;
                deleteWorkout(memberId, workoutId);
                Toast.success('Workout deleted');
                // Refresh the heatmap detail
                showHeatmapDetail(container, memberId, date);
                // Re-render the page to update the heatmap
                const member = Storage.getMember(memberId);
                renderHistoryPage(container, memberId, member, new Date(), 'calendar');
            });
        });
    }

    /**
     * Show modal to add workout for a specific date
     */
    function showAddWorkoutModal(memberId, date, pageContainer, member, viewDateOrWeekStart, viewMode = 'weekly') {
        const widgetData = getWidgetData(memberId);
        const routines = widgetData.routines;
        const stepsLog = widgetData.stepsLog || {};
        const currentSteps = stepsLog[date] || 0;
        const dateObj = new Date(date);
        const dateDisplay = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

        const content = `
            <div class="add-workout-modal">
                <p class="add-workout-modal__date">
                    <i data-lucide="calendar"></i>
                    ${dateDisplay}
                </p>

                <!-- Steps Section -->
                <div class="add-workout-modal__steps">
                    <label class="add-workout-modal__steps-label">
                        <i data-lucide="footprints"></i>
                        Steps
                    </label>
                    <div class="add-workout-modal__steps-input">
                        <input type="number"
                               class="form-input"
                               id="modalStepsInput"
                               value="${currentSteps || ''}"
                               placeholder="0"
                               min="0"
                               max="100000">
                        <button class="btn btn--primary btn--sm" id="saveStepsBtn">
                            <i data-lucide="check"></i>
                            Save
                        </button>
                    </div>
                </div>

                <div class="add-workout-modal__divider">
                    <span>Add Workout</span>
                </div>

                <div class="add-workout-modal__list">
                    ${routines.map(routine => `
                        <button class="add-workout-modal__routine" data-routine-id="${routine.id}">
                            <span class="add-workout-modal__routine-icon">
                                <i data-lucide="${routine.icon || 'dumbbell'}"></i>
                            </span>
                            <span class="add-workout-modal__routine-name">${routine.name}</span>
                            <span class="add-workout-modal__routine-duration">${routine.duration} min</span>
                        </button>
                    `).join('')}
                </div>
            </div>
        `;

        Modal.open({
            title: 'Log Activity',
            content,
            footer: '<button class="btn btn--secondary" data-modal-cancel>Close</button>'
        });

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Save steps button
        document.getElementById('saveStepsBtn')?.addEventListener('click', () => {
            const stepsInput = document.getElementById('modalStepsInput');
            const steps = parseInt(stepsInput?.value) || 0;
            saveSteps(memberId, date, steps);
            Toast.success('Steps saved!');
            // Refresh the appropriate view
            if (viewMode === 'monthly') {
                renderMonthlyHistoryPage(pageContainer, memberId, member, viewDateOrWeekStart);
            } else {
                renderHistoryPage(pageContainer, memberId, member, viewDateOrWeekStart);
            }
            Modal.close();
        });

        // Bind routine selection
        document.querySelectorAll('.add-workout-modal__routine').forEach(btn => {
            btn.addEventListener('click', () => {
                const routineId = btn.dataset.routineId;
                logWorkout(memberId, routineId, date);
                Modal.close();
                // Refresh the appropriate view
                if (viewMode === 'monthly') {
                    renderMonthlyHistoryPage(pageContainer, memberId, member, viewDateOrWeekStart);
                } else {
                    renderHistoryPage(pageContainer, memberId, member, viewDateOrWeekStart);
                }
            });
        });

        document.querySelector('[data-modal-cancel]')?.addEventListener('click', () => {
            Modal.close();
        });
    }

    /**
     * Show manage routines modal
     */
    function showManageRoutinesModal(memberId) {
        renderManageRoutinesContent(memberId);
    }

    /**
     * Generate manage routines HTML
     */
    function generateManageRoutinesHTML(memberId) {
        const widgetData = getWidgetData(memberId);
        const routines = widgetData.routines || [];

        return `
            <div class="manage-routines">
                <div class="manage-routines__list">
                    ${routines.length === 0 ? `
                        <p class="text-center text-muted" style="padding: 16px;">No routines yet. Add some below!</p>
                    ` : routines.map(routine => `
                        <div class="manage-routines__item">
                            <i data-lucide="${routine.icon || 'dumbbell'}"></i>
                            <span>${routine.name}</span>
                            <span class="text-muted">${routine.duration} min</span>
                            <button class="btn btn--icon btn--ghost btn--sm" data-delete="${routine.id}">
                                <i data-lucide="trash-2"></i>
                            </button>
                        </div>
                    `).join('')}
                </div>

                <hr style="margin: 16px 0;">

                <h4 style="margin-bottom: 12px;">Add Routine</h4>
                <div class="form-row" style="gap: 8px;">
                    <input type="text" class="form-input" id="newRoutineName" placeholder="Routine name" style="flex: 2;">
                    <input type="number" class="form-input" id="newRoutineDuration" placeholder="Min" style="width: 70px;">
                    <button class="btn btn--primary" id="addRoutineBtn">
                        <i data-lucide="plus"></i>
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Render manage routines modal
     */
    function renderManageRoutinesContent(memberId) {
        Modal.open({
            title: 'Manage Routines',
            content: generateManageRoutinesHTML(memberId),
            footer: '<button class="btn btn--primary" data-modal-done>Done</button>'
        });

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        bindManageRoutinesEvents(memberId);
    }

    /**
     * Refresh manage routines modal in-place
     */
    function refreshManageRoutinesModal(memberId) {
        const modalContent = document.getElementById('modalContent');
        if (!modalContent) return;

        modalContent.innerHTML = generateManageRoutinesHTML(memberId);

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        bindManageRoutinesEvents(memberId);
        document.getElementById('newRoutineName')?.focus();
    }

    /**
     * Bind manage routines events
     */
    function bindManageRoutinesEvents(memberId) {
        // Add routine
        const addRoutine = () => {
            const name = document.getElementById('newRoutineName')?.value?.trim();
            const duration = parseInt(document.getElementById('newRoutineDuration')?.value) || 30;

            if (!name) {
                Toast.error('Please enter a routine name');
                return;
            }

            const widgetData = getWidgetData(memberId);
            const newRoutine = {
                id: `routine-${Date.now()}`,
                name,
                duration,
                icon: 'dumbbell'
            };

            const updatedData = {
                ...widgetData,
                routines: [...(widgetData.routines || []), newRoutine]
            };

            Storage.setWidgetData(memberId, 'workout', updatedData);
            Toast.success('Routine added');
            refreshManageRoutinesModal(memberId);
        };

        document.getElementById('addRoutineBtn')?.addEventListener('click', addRoutine);
        document.getElementById('newRoutineName')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addRoutine();
            }
        });

        // Delete routine
        document.querySelectorAll('[data-delete]').forEach(btn => {
            btn.addEventListener('click', () => {
                const routineId = btn.dataset.delete;
                const widgetData = getWidgetData(memberId);
                const updatedData = {
                    ...widgetData,
                    routines: (widgetData.routines || []).filter(r => r.id !== routineId)
                };
                Storage.setWidgetData(memberId, 'workout', updatedData);
                Toast.success('Routine removed');
                refreshManageRoutinesModal(memberId);
            });
        });

        document.querySelector('[data-modal-done]')?.addEventListener('click', () => {
            Modal.close();
            // Refresh widget
            const widgetBody = document.getElementById('widget-workout');
            if (widgetBody) {
                renderWidget(widgetBody, memberId);
            }
        });
    }

    // ========================
    // WORKOUT SUGGESTION SYSTEM
    // ========================

    /**
     * Show the suggestion setup modal with card carousel
     */
    function showSuggestionSetupModal(memberId) {
        const widgetData = getWidgetData(memberId);

        // Check if user has routines
        if (!widgetData.routines || widgetData.routines.length === 0) {
            Toast.error('Please add some routines first');
            return;
        }

        // Get existing preferences if any
        const existingPrefs = widgetData.suggestionPrefs || {
            goal: 'balanced',
            daysPerWeek: 4,
            restDays: [0, 6], // Sunday, Saturday
            preferredTime: null
        };

        // Goal options with descriptions and recommended routine types
        const GOALS = [
            { id: 'weight-loss', icon: '🔥', label: 'Lose Weight', desc: 'Focus on cardio and HIIT', routineTypes: ['cardio', 'hiit'] },
            { id: 'build-muscle', icon: '💪', label: 'Build Muscle', desc: 'Strength training focus', routineTypes: ['strength', 'weights'] },
            { id: 'stay-active', icon: '🏃', label: 'Stay Active', desc: 'General fitness and movement', routineTypes: ['cardio', 'yoga', 'general'] },
            { id: 'flexibility', icon: '🧘', label: 'Flexibility', desc: 'Yoga and stretching', routineTypes: ['yoga', 'stretch'] },
            { id: 'balanced', icon: '⚖️', label: 'Balanced', desc: 'Mix of everything', routineTypes: ['all'] }
        ];

        // State for the questionnaire
        let currentCard = 0;
        const totalCards = 4;
        let answers = {
            goal: existingPrefs.goal || 'balanced',
            daysPerWeek: existingPrefs.daysPerWeek,
            restDays: [...existingPrefs.restDays],
            preferredTime: existingPrefs.preferredTime
        };

        const content = `
            <div class="suggest-cards" id="suggestCards">
                <!-- Card 1: Goal -->
                <div class="suggest-card suggest-card--active" data-card="0">
                    <div class="suggest-card__icon">🎯</div>
                    <h3>What's your fitness goal?</h3>
                    <p class="suggest-card__hint">This helps us personalize your plan</p>
                    <div class="suggest-card__options suggest-card__options--goals">
                        ${GOALS.map(g => `
                            <button class="suggest-card__option suggest-card__option--goal ${answers.goal === g.id ? 'suggest-card__option--selected' : ''}"
                                    data-value="${g.id}" data-type="goal">
                                <span class="suggest-card__option-icon">${g.icon}</span>
                                <span class="suggest-card__option-label">${g.label}</span>
                                <span class="suggest-card__option-desc">${g.desc}</span>
                            </button>
                        `).join('')}
                    </div>
                </div>

                <!-- Card 2: Days Per Week -->
                <div class="suggest-card suggest-card--next" data-card="1">
                    <div class="suggest-card__icon">📅</div>
                    <h3>How many days per week?</h3>
                    <p class="suggest-card__hint">Select your workout frequency</p>
                    <div class="suggest-card__options suggest-card__options--days">
                        ${[2, 3, 4, 5, 6, 7].map(n => `
                            <button class="suggest-card__option ${answers.daysPerWeek === n ? 'suggest-card__option--selected' : ''}"
                                    data-value="${n}" data-type="days">
                                ${n}
                            </button>
                        `).join('')}
                    </div>
                </div>

                <!-- Card 3: Rest Days -->
                <div class="suggest-card suggest-card--next" data-card="2">
                    <div class="suggest-card__icon">😴</div>
                    <h3>Which are your rest days?</h3>
                    <p class="suggest-card__hint">Tap days you prefer to rest</p>
                    <div class="suggest-card__options suggest-card__options--week">
                        ${DAY_NAMES.map((day, i) => `
                            <button class="suggest-card__option ${answers.restDays.includes(i) ? 'suggest-card__option--selected' : ''}"
                                    data-value="${i}" data-type="rest">
                                ${day}
                            </button>
                        `).join('')}
                    </div>
                </div>

                <!-- Card 4: Preferred Time -->
                <div class="suggest-card suggest-card--next" data-card="3">
                    <div class="suggest-card__icon">⏰</div>
                    <h3>Preferred workout time?</h3>
                    <p class="suggest-card__hint">Optional - helps personalize suggestions</p>
                    <div class="suggest-card__options suggest-card__options--time">
                        <button class="suggest-card__option ${answers.preferredTime === 'morning' ? 'suggest-card__option--selected' : ''}"
                                data-value="morning" data-type="time">
                            <span class="suggest-card__option-icon">🌅</span>
                            <span>Morning</span>
                        </button>
                        <button class="suggest-card__option ${answers.preferredTime === 'afternoon' ? 'suggest-card__option--selected' : ''}"
                                data-value="afternoon" data-type="time">
                            <span class="suggest-card__option-icon">☀️</span>
                            <span>Afternoon</span>
                        </button>
                        <button class="suggest-card__option ${answers.preferredTime === 'evening' ? 'suggest-card__option--selected' : ''}"
                                data-value="evening" data-type="time">
                            <span class="suggest-card__option-icon">🌙</span>
                            <span>Evening</span>
                        </button>
                        <button class="suggest-card__option ${answers.preferredTime === null ? 'suggest-card__option--selected' : ''}"
                                data-value="any" data-type="time">
                            <span class="suggest-card__option-icon">🕐</span>
                            <span>Any time</span>
                        </button>
                    </div>
                </div>
            </div>

            <div class="suggest-nav">
                <button class="btn btn--ghost" id="suggestBackBtn" disabled>
                    <i data-lucide="arrow-left"></i>
                    Back
                </button>
                <div class="suggest-nav__dots">
                    <div class="suggest-nav__dot suggest-nav__dot--active" data-dot="0"></div>
                    <div class="suggest-nav__dot" data-dot="1"></div>
                    <div class="suggest-nav__dot" data-dot="2"></div>
                    <div class="suggest-nav__dot" data-dot="3"></div>
                </div>
                <button class="btn btn--primary" id="suggestNextBtn">
                    Next
                    <i data-lucide="arrow-right"></i>
                </button>
            </div>
        `;

        Modal.open({
            title: 'Create Workout Plan',
            content,
            footer: ''
        });

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Bind card navigation
        const cards = document.querySelectorAll('.suggest-card');
        const dots = document.querySelectorAll('.suggest-nav__dot');
        const backBtn = document.getElementById('suggestBackBtn');
        const nextBtn = document.getElementById('suggestNextBtn');

        function updateCardDisplay() {
            cards.forEach((card, i) => {
                card.classList.remove('suggest-card--active', 'suggest-card--prev', 'suggest-card--next');
                if (i === currentCard) {
                    card.classList.add('suggest-card--active');
                } else if (i < currentCard) {
                    card.classList.add('suggest-card--prev');
                } else {
                    card.classList.add('suggest-card--next');
                }
            });

            dots.forEach((dot, i) => {
                dot.classList.toggle('suggest-nav__dot--active', i === currentCard);
            });

            backBtn.disabled = currentCard === 0;

            if (currentCard === 3) {
                nextBtn.innerHTML = `<i data-lucide="sparkles"></i> Generate Plan`;
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            } else {
                nextBtn.innerHTML = `Next <i data-lucide="arrow-right"></i>`;
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            }
        }

        function goToCard(index) {
            if (index >= 0 && index <= 3) {
                currentCard = index;
                updateCardDisplay();
            }
        }

        function validateAndGeneratePlan() {
            // Validate: ensure not all days are rest days
            if (answers.restDays.length >= 7) {
                Toast.error('Please select at least one workout day');
                return;
            }

            // Check if user has routines
            const widgetData = getWidgetData(memberId);
            if (!widgetData.routines || widgetData.routines.length === 0) {
                Toast.error('Add some workout routines first');
                Modal.close();
                return;
            }

            // Save preferences
            const prefs = {
                goal: answers.goal,
                daysPerWeek: answers.daysPerWeek,
                restDays: answers.restDays,
                preferredTime: answers.preferredTime
            };

            // Generate suggestions
            const suggestions = generateWeeklySuggestions(memberId, prefs);

            // Show approval screen with delay to allow modal close animation to complete
            // Modal.close() has a 200ms cleanup timer, so we wait 250ms
            Modal.close();
            setTimeout(() => {
                showPlanApprovalModal(memberId, prefs, suggestions);
            }, 250);
        }

        // Back button
        backBtn.addEventListener('click', () => {
            goToCard(currentCard - 1);
        });

        // Next button
        nextBtn.addEventListener('click', () => {
            if (currentCard === 3) {
                validateAndGeneratePlan();
            } else {
                goToCard(currentCard + 1);
            }
        });

        // Option selection
        document.querySelectorAll('.suggest-card__option').forEach(option => {
            option.addEventListener('click', () => {
                const type = option.dataset.type;
                const value = option.dataset.value;

                if (type === 'goal') {
                    // Single select - auto advance
                    document.querySelectorAll('[data-type="goal"]').forEach(o =>
                        o.classList.remove('suggest-card__option--selected'));
                    option.classList.add('suggest-card__option--selected');
                    answers.goal = value;

                    // Auto-advance after short delay
                    setTimeout(() => goToCard(1), 300);

                } else if (type === 'days') {
                    // Single select - auto advance
                    document.querySelectorAll('[data-type="days"]').forEach(o =>
                        o.classList.remove('suggest-card__option--selected'));
                    option.classList.add('suggest-card__option--selected');
                    answers.daysPerWeek = parseInt(value);

                    // Auto-advance after short delay
                    setTimeout(() => goToCard(2), 300);

                } else if (type === 'rest') {
                    // Multi-select toggle
                    const dayIndex = parseInt(value);
                    option.classList.toggle('suggest-card__option--selected');

                    if (answers.restDays.includes(dayIndex)) {
                        answers.restDays = answers.restDays.filter(d => d !== dayIndex);
                    } else {
                        answers.restDays.push(dayIndex);
                    }

                } else if (type === 'time') {
                    // Single select - auto advance to generate
                    document.querySelectorAll('[data-type="time"]').forEach(o =>
                        o.classList.remove('suggest-card__option--selected'));
                    option.classList.add('suggest-card__option--selected');
                    answers.preferredTime = value === 'any' ? null : value;

                    // Auto-generate after short delay
                    setTimeout(() => validateAndGeneratePlan(), 300);
                }
            });
        });
    }

    /**
     * Get routines prioritized by goal
     * Returns routines sorted by relevance to the goal
     */
    function getRoutinesByGoal(routines, goal) {
        // Keywords associated with each goal
        const goalKeywords = {
            'weight-loss': ['run', 'cardio', 'hiit', 'cycling', 'swimming', 'walk', 'jog', 'aerobic'],
            'build-muscle': ['strength', 'weight', 'dumbbell', 'gym', 'lift', 'muscle', 'resistance', 'training'],
            'stay-active': ['run', 'walk', 'cardio', 'general', 'fitness', 'active'],
            'flexibility': ['yoga', 'stretch', 'pilates', 'flexibility', 'mobility'],
            'balanced': [] // Use all routines equally
        };

        const keywords = goalKeywords[goal] || [];

        if (keywords.length === 0 || goal === 'balanced') {
            // For balanced, just return routines in original order
            return [...routines];
        }

        // Score routines based on keyword match
        const scored = routines.map(routine => {
            const name = routine.name.toLowerCase();
            const icon = (routine.icon || '').toLowerCase();
            let score = 0;

            keywords.forEach(keyword => {
                if (name.includes(keyword) || icon.includes(keyword)) {
                    score += 10;
                }
            });

            return { routine, score };
        });

        // Sort by score (higher first), then maintain original order for ties
        scored.sort((a, b) => b.score - a.score);

        return scored.map(s => s.routine);
    }

    /**
     * Generate weekly suggestions based on preferences
     */
    function generateWeeklySuggestions(memberId, prefs) {
        const widgetData = getWidgetData(memberId);
        const allRoutines = widgetData.routines;
        const logs = widgetData.log;

        // Prioritize routines based on goal
        const routines = getRoutinesByGoal(allRoutines, prefs.goal);

        const weekStart = getWeekStart(new Date());
        const today = DateUtils.today();
        const suggestions = {};
        let routineIndex = 0;

        for (let i = 0; i < 7; i++) {
            const dayDate = DateUtils.addDays(weekStart, i);
            const dateStr = DateUtils.formatISO(dayDate);
            const dayOfWeek = dayDate.getDay();

            // Skip rest days
            if (prefs.restDays.includes(dayOfWeek)) continue;

            // Skip past days
            if (dateStr < today) continue;

            // Skip days with existing workouts
            if (logs.some(l => l.date === dateStr)) continue;

            // Assign routine (rotate through goal-prioritized routines)
            const routine = routines[routineIndex % routines.length];
            suggestions[dateStr] = {
                routineId: routine.id,
                routineName: routine.name,
                icon: routine.icon || 'dumbbell',
                duration: routine.duration
            };
            routineIndex++;
        }

        return {
            weekStart: DateUtils.formatISO(weekStart),
            suggestions
        };
    }

    /**
     * Show plan approval modal
     */
    function showPlanApprovalModal(memberId, prefs, weekSuggestions) {
        const weekStart = getWeekStart(new Date());
        const today = DateUtils.today();

        // Build preview week
        const previewDays = [];
        for (let i = 0; i < 7; i++) {
            const dayDate = DateUtils.addDays(weekStart, i);
            const dateStr = DateUtils.formatISO(dayDate);
            const dayOfWeek = dayDate.getDay();
            const isRest = prefs.restDays.includes(dayOfWeek);
            const suggestion = weekSuggestions.suggestions[dateStr];
            const isToday = dateStr === today;

            previewDays.push({
                name: DAY_NAMES[dayOfWeek],
                date: dateStr,
                isRest,
                isToday,
                suggestion
            });
        }

        const workoutCount = Object.keys(weekSuggestions.suggestions).length;
        const routineNames = [...new Set(Object.values(weekSuggestions.suggestions).map(s => s.routineName))];

        const content = `
            <div class="suggest-approval">
                <div class="suggest-approval__header">
                    <i data-lucide="sparkles"></i>
                    <h3>Your Workout Plan</h3>
                    <p>Here's your suggested schedule for this week</p>
                </div>

                <div class="suggest-preview-week">
                    ${previewDays.map(day => `
                        <div class="suggest-preview-day ${day.isRest ? 'suggest-preview-day--rest' : 'suggest-preview-day--workout'} ${day.isToday ? 'suggest-preview-day--today' : ''}">
                            <span class="suggest-preview-day__name">${day.name}</span>
                            ${day.isRest
                                ? '<span class="suggest-preview-day__status">Rest</span>'
                                : day.suggestion
                                    ? `<span class="suggest-preview-day__workout">${day.suggestion.routineName.split(' ')[0]}</span>`
                                    : '<span class="suggest-preview-day__status">Done</span>'
                            }
                        </div>
                    `).join('')}
                </div>

                <div class="suggest-approval__summary">
                    <p>📊 ${workoutCount} workout${workoutCount !== 1 ? 's' : ''} planned</p>
                    <p>💪 ${routineNames.length} routine${routineNames.length !== 1 ? 's' : ''}</p>
                </div>

                <div class="suggest-approval__actions">
                    <button class="btn btn--ghost" id="rejectPlanBtn">
                        <i data-lucide="refresh-cw"></i>
                        Change Settings
                    </button>
                    <button class="btn btn--primary" id="approvePlanBtn">
                        <i data-lucide="check"></i>
                        Looks Good!
                    </button>
                </div>
            </div>
        `;

        Modal.open({
            title: 'Review Your Plan',
            content,
            footer: ''
        });

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Bind actions
        document.getElementById('rejectPlanBtn')?.addEventListener('click', () => {
            Modal.close();
            showSuggestionSetupModal(memberId);
        });

        document.getElementById('approvePlanBtn')?.addEventListener('click', () => {
            // Save preferences and suggestions
            const widgetData = getWidgetData(memberId);
            const updatedData = {
                ...widgetData,
                suggestionPrefs: prefs,
                weekSuggestions: weekSuggestions
            };
            Storage.setWidgetData(memberId, 'workout', updatedData);

            Modal.close();
            Toast.success('Workout plan saved!');

            // Refresh the page if on history page
            const main = document.getElementById('mainContent');
            if (main && main.querySelector('.workout-page')) {
                const member = Storage.getMember(memberId);
                renderHistoryPage(main, memberId, member, new Date());
            }
        });
    }

    /**
     * Mark a suggestion as done (log the workout and remove from suggestions)
     */
    function markSuggestionDone(memberId, routineId, date) {
        // Log the workout
        logWorkout(memberId, routineId, date);

        // Remove from suggestions
        const widgetData = getWidgetData(memberId);
        if (widgetData.weekSuggestions && widgetData.weekSuggestions.suggestions) {
            delete widgetData.weekSuggestions.suggestions[date];
            Storage.setWidgetData(memberId, 'workout', widgetData);
        }
    }

    /**
     * Get suggestion for a specific date
     */
    function getSuggestionForDate(memberId, date) {
        const widgetData = getWidgetData(memberId);
        if (!widgetData.weekSuggestions) return null;

        // Check if suggestions are for current week
        const currentWeekStart = DateUtils.formatISO(getWeekStart(new Date()));
        if (widgetData.weekSuggestions.weekStart !== currentWeekStart) {
            return null; // Suggestions are for old week
        }

        return widgetData.weekSuggestions.suggestions[date] || null;
    }

    // ========================
    // BODY MEASUREMENTS SYSTEM
    // ========================

    /**
     * Available measurement metrics
     */
    const MEASUREMENT_METRICS = [
        { id: 'weight', name: 'Weight', unit: { metric: 'kg', imperial: 'lbs' }, icon: 'scale' },
        { id: 'waist', name: 'Waist', unit: { metric: 'cm', imperial: 'in' }, icon: 'ruler' },
        { id: 'chest', name: 'Chest', unit: { metric: 'cm', imperial: 'in' }, icon: 'ruler' },
        { id: 'hips', name: 'Hips', unit: { metric: 'cm', imperial: 'in' }, icon: 'ruler' },
        { id: 'arms', name: 'Arms', unit: { metric: 'cm', imperial: 'in' }, icon: 'ruler' },
        { id: 'thighs', name: 'Thighs', unit: { metric: 'cm', imperial: 'in' }, icon: 'ruler' },
        { id: 'bodyfat', name: 'Body Fat', unit: { metric: '%', imperial: '%' }, icon: 'percent' },
        { id: 'neck', name: 'Neck', unit: { metric: 'cm', imperial: 'in' }, icon: 'ruler' }
    ];

    /**
     * Unit conversion utilities
     * Values are stored internally in metric units (kg, cm)
     * These functions convert for display when imperial is selected
     */
    const CONVERSION = {
        // kg to lbs
        kgToLbs: (kg) => kg * 2.20462,
        // lbs to kg
        lbsToKg: (lbs) => lbs / 2.20462,
        // cm to inches
        cmToIn: (cm) => cm / 2.54,
        // inches to cm
        inToCm: (inches) => inches * 2.54
    };

    /**
     * Convert a value for display based on metric type and unit system
     * @param {number} value - The stored value (in metric units)
     * @param {string} metricId - The metric ID (weight, waist, etc.)
     * @param {string} unitSystem - 'metric' or 'imperial'
     * @returns {number} The converted value
     */
    function convertForDisplay(value, metricId, unitSystem) {
        if (value === null || value === undefined || isNaN(value)) return null;
        if (unitSystem === 'metric') return value;

        // Imperial conversion
        if (metricId === 'weight') {
            return CONVERSION.kgToLbs(value);
        } else if (metricId === 'bodyfat') {
            return value; // Percentage stays the same
        } else {
            // All other measurements are length (cm to inches)
            return CONVERSION.cmToIn(value);
        }
    }

    /**
     * Convert a user-entered value to metric for storage
     * @param {number} value - The user-entered value
     * @param {string} metricId - The metric ID (weight, waist, etc.)
     * @param {string} unitSystem - 'metric' or 'imperial'
     * @returns {number} The value in metric units
     */
    function convertToMetric(value, metricId, unitSystem) {
        if (value === null || value === undefined || isNaN(value)) return null;
        if (unitSystem === 'metric') return value;

        // Convert from imperial to metric for storage
        if (metricId === 'weight') {
            return CONVERSION.lbsToKg(value);
        } else if (metricId === 'bodyfat') {
            return value; // Percentage stays the same
        } else {
            // All other measurements are length (inches to cm)
            return CONVERSION.inToCm(value);
        }
    }

    /**
     * Format a converted value for display (round appropriately)
     * @param {number} value - The value to format
     * @param {string} metricId - The metric ID
     * @returns {string} Formatted value string
     */
    function formatDisplayValue(value, metricId) {
        if (value === null || value === undefined || isNaN(value)) return '--';

        // Weight: 1 decimal place
        if (metricId === 'weight') {
            return value.toFixed(1);
        }
        // Body fat: 1 decimal place
        if (metricId === 'bodyfat') {
            return value.toFixed(1);
        }
        // Length measurements: 1 decimal place
        return value.toFixed(1);
    }

    /**
     * Format date string (YYYY-MM-DD) to local display format
     * Avoids timezone shift issues by parsing components manually
     * @param {string} dateStr - Date string in YYYY-MM-DD format
     * @returns {string} Formatted date (e.g., "Jan 3, 2026")
     */
    function formatDateLocal(dateStr) {
        const [year, month, day] = dateStr.split('-').map(Number);
        const date = new Date(year, month - 1, day); // month is 0-indexed
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    /**
     * Get default measurements settings
     */
    function getDefaultMeasurementSettings() {
        return {
            unit: 'metric',
            enabledMetrics: ['weight', 'waist', 'chest'],
            goals: {}
        };
    }

    /**
     * Get measurements data for a member
     */
    function getMeasurementsData(memberId) {
        const widgetData = getWidgetData(memberId);
        return {
            settings: widgetData.measurements?.settings || getDefaultMeasurementSettings(),
            log: widgetData.measurements?.log || []
        };
    }

    /**
     * Save measurements data
     */
    function saveMeasurementsData(memberId, measurementsData) {
        const widgetData = getWidgetData(memberId);
        const updatedData = {
            ...widgetData,
            measurements: measurementsData
        };
        Storage.setWidgetData(memberId, 'workout', updatedData);
    }

    /**
     * Render a mini SVG line chart for measurements
     */
    function renderMiniChart(log, metric, unitSystem) {
        if (!metric || log.length < 2) return '<p class="text-muted text-center">Not enough data</p>';

        // Get last 30 days of data for this metric
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const chartData = log
            .filter(entry => {
                const [y, m, d] = entry.date.split('-').map(Number);
                const entryDate = new Date(y, m - 1, d);
                return entryDate >= thirtyDaysAgo && entry.values[metric.id] !== undefined;
            })
            .sort((a, b) => {
                const [y1, m1, d1] = a.date.split('-').map(Number);
                const [y2, m2, d2] = b.date.split('-').map(Number);
                const date1 = new Date(y1, m1 - 1, d1);
                const date2 = new Date(y2, m2 - 1, d2);
                return date1 - date2;
            }) // oldest to newest for chart
            .map(entry => ({
                date: entry.date,
                // Convert stored value to display unit
                value: convertForDisplay(entry.values[metric.id], metric.id, unitSystem)
            }));

        if (chartData.length < 2) return '<p class="text-muted text-center">Not enough data in last 30 days</p>';

        const values = chartData.map(d => d.value);
        const minVal = Math.min(...values);
        const maxVal = Math.max(...values);
        const range = maxVal - minVal || 1;

        // SVG dimensions
        const width = 280;
        const height = 80;
        const padding = 10;
        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;

        // Generate path points
        const points = chartData.map((d, i) => {
            const x = padding + (i / (chartData.length - 1)) * chartWidth;
            const y = padding + chartHeight - ((d.value - minVal) / range) * chartHeight;
            return `${x},${y}`;
        });

        const pathD = `M ${points.join(' L ')}`;

        // Area fill path
        const areaD = `M ${padding},${padding + chartHeight} L ${points.join(' L ')} L ${padding + chartWidth},${padding + chartHeight} Z`;

        const unit = metric.unit[unitSystem];
        const latestValue = chartData[chartData.length - 1].value;
        const firstValue = chartData[0].value;
        const change = latestValue - firstValue;
        const changeText = change > 0 ? `+${change.toFixed(1)}` : change.toFixed(1);
        const changeClass = change > 0 ? 'up' : change < 0 ? 'down' : 'same';

        return `
            <div class="measurements-mini-chart" data-metric="${metric.id}">
                <div class="measurements-mini-chart__header">
                    <span class="measurements-mini-chart__metric">${metric.name}</span>
                    <span class="measurements-mini-chart__current">${formatDisplayValue(latestValue, metric.id)} ${unit}</span>
                    <span class="measurements-mini-chart__change measurements-mini-chart__change--${changeClass}">
                        ${changeText} ${unit}
                    </span>
                </div>
                <svg viewBox="0 0 ${width} ${height}" class="measurements-mini-chart__svg">
                    <defs>
                        <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" style="stop-color:var(--primary);stop-opacity:0.3" />
                            <stop offset="100%" style="stop-color:var(--primary);stop-opacity:0.05" />
                        </linearGradient>
                    </defs>
                    <path d="${areaD}" fill="url(#chartGradient)" />
                    <path d="${pathD}" fill="none" stroke="var(--primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                    ${chartData.map((d, i) => {
                        const x = padding + (i / (chartData.length - 1)) * chartWidth;
                        const y = padding + chartHeight - ((d.value - minVal) / range) * chartHeight;
                        return `<circle cx="${x}" cy="${y}" r="3" fill="var(--primary)" />`;
                    }).join('')}
                </svg>
                <div class="measurements-mini-chart__labels">
                    <span>${formatDateLocal(chartData[0].date)}</span>
                    <span>${formatDateLocal(chartData[chartData.length - 1].date)}</span>
                </div>
            </div>
        `;
    }

    /**
     * Show the main measurements modal
     */
    function showMeasurementsModal(memberId) {
        const data = getMeasurementsData(memberId);
        const { settings } = data;
        // Sort log by date descending (most recent date first)
        const log = [...(data.log || [])].sort((a, b) => new Date(b.date) - new Date(a.date));
        const enabledMetrics = MEASUREMENT_METRICS.filter(m => settings.enabledMetrics.includes(m.id));
        const latestEntry = log[0] || null;
        const previousEntry = log[1] || null;

        // Calculate changes from previous entry (with unit conversion)
        const getChange = (metricId) => {
            if (!latestEntry || !previousEntry) return null;
            const currentStored = latestEntry.values[metricId];
            const prevStored = previousEntry.values[metricId];
            if (currentStored === undefined || prevStored === undefined) return null;

            // Convert both values for proper comparison in display unit
            const current = convertForDisplay(currentStored, metricId, settings.unit);
            const prev = convertForDisplay(prevStored, metricId, settings.unit);
            const diff = current - prev;
            return { diff, direction: diff > 0 ? 'up' : diff < 0 ? 'down' : 'same' };
        };

        const content = `
            <div class="measurements-modal">
                <div class="measurements-modal__header">
                    <div class="measurements-modal__unit-toggle">
                        <button class="measurements-unit-btn ${settings.unit === 'metric' ? 'measurements-unit-btn--active' : ''}"
                                data-unit="metric">Metric</button>
                        <button class="measurements-unit-btn ${settings.unit === 'imperial' ? 'measurements-unit-btn--active' : ''}"
                                data-unit="imperial">Imperial</button>
                    </div>
                    <button class="btn btn--ghost btn--sm" id="measurementSettingsBtn">
                        <i data-lucide="settings"></i>
                        Customize
                    </button>
                </div>

                ${latestEntry ? `
                    <div class="measurements-latest">
                        <div class="measurements-latest__header">
                            <span class="measurements-latest__date">
                                <i data-lucide="calendar"></i>
                                ${formatDateLocal(latestEntry.date)}
                            </span>
                        </div>
                        <div class="measurements-latest__grid">
                            ${enabledMetrics.map(metric => {
                                const storedValue = latestEntry.values[metric.id];
                                const displayValue = convertForDisplay(storedValue, metric.id, settings.unit);
                                const change = getChange(metric.id);
                                const unit = metric.unit[settings.unit];
                                const storedGoal = settings.goals[metric.id];
                                // Convert goal for display if stored in metric
                                const displayGoal = storedGoal ? formatDisplayValue(convertForDisplay(storedGoal, metric.id, settings.unit), metric.id) : null;

                                return `
                                    <div class="measurements-metric-card">
                                        <div class="measurements-metric-card__label">${metric.name}</div>
                                        <div class="measurements-metric-card__value">
                                            ${displayValue !== null ? formatDisplayValue(displayValue, metric.id) : '-'}
                                            <span class="measurements-metric-card__unit">${unit}</span>
                                        </div>
                                        ${change ? `
                                            <div class="measurements-metric-card__change measurements-metric-card__change--${change.direction}">
                                                <i data-lucide="${change.direction === 'up' ? 'trending-up' : change.direction === 'down' ? 'trending-down' : 'minus'}"></i>
                                                ${Math.abs(change.diff).toFixed(1)}
                                            </div>
                                        ` : ''}
                                        ${displayGoal ? `
                                            <div class="measurements-metric-card__goal">Goal: ${displayGoal} ${unit}</div>
                                        ` : ''}
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                ` : `
                    <div class="measurements-empty">
                        <i data-lucide="ruler"></i>
                        <p>No measurements logged yet</p>
                        <p class="text-muted">Start tracking your progress!</p>
                    </div>
                `}

                <button class="btn btn--primary measurements-log-btn" id="logMeasurementBtn">
                    <i data-lucide="plus"></i>
                    Log Measurements
                </button>

                ${log.length >= 2 ? `
                    <div class="measurements-chart">
                        <h4 class="measurements-chart__title">
                            <i data-lucide="trending-up"></i>
                            Progress (Last 30 days)
                        </h4>
                        <div class="measurements-chart__container">
                            ${renderMiniChart(log, enabledMetrics[0], settings.unit)}
                        </div>
                        ${enabledMetrics.length > 1 ? `
                            <div class="measurements-chart__legend">
                                ${enabledMetrics.map((m, i) => `
                                    <button class="measurements-chart__legend-btn ${i === 0 ? 'measurements-chart__legend-btn--active' : ''}"
                                            data-metric="${m.id}">
                                        ${m.name}
                                    </button>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                ` : ''}

            </div>
        `;

        Modal.open({
            title: 'Body Measurements',
            content,
            footer: `
                <button class="btn btn--ghost" id="viewBodyHistoryBtn">
                    <i data-lucide="history"></i>
                    View Full History
                </button>
                <button class="btn btn--secondary" data-modal-close>Close</button>
            `
        });

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Bind events
        bindMeasurementsModalEvents(memberId);
    }

    /**
     * Bind events for measurements modal
     */
    function bindMeasurementsModalEvents(memberId) {
        // Unit toggle
        document.querySelectorAll('.measurements-unit-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const unit = btn.dataset.unit;
                const data = getMeasurementsData(memberId);
                data.settings.unit = unit;
                saveMeasurementsData(memberId, data);
                Modal.close();
                setTimeout(() => showMeasurementsModal(memberId), 250);
            });
        });

        // Settings button
        document.getElementById('measurementSettingsBtn')?.addEventListener('click', () => {
            Modal.close();
            setTimeout(() => showMeasurementSettingsModal(memberId), 250);
        });

        // Log measurements button
        document.getElementById('logMeasurementBtn')?.addEventListener('click', () => {
            Modal.close();
            setTimeout(() => showLogMeasurementsModal(memberId), 250);
        });

        // Chart metric toggle
        document.querySelectorAll('.measurements-chart__legend-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const metricId = btn.dataset.metric;
                const data = getMeasurementsData(memberId);
                const log = [...(data.log || [])].sort((a, b) => new Date(b.date) - new Date(a.date));
                const metric = MEASUREMENT_METRICS.find(m => m.id === metricId);

                if (metric) {
                    // Update active state
                    document.querySelectorAll('.measurements-chart__legend-btn').forEach(b =>
                        b.classList.remove('measurements-chart__legend-btn--active'));
                    btn.classList.add('measurements-chart__legend-btn--active');

                    // Re-render chart
                    const chartContainer = document.querySelector('.measurements-chart__container');
                    if (chartContainer) {
                        chartContainer.innerHTML = renderMiniChart(log, metric, data.settings.unit);
                    }
                }
            });
        });

        // View all history button (in modal)
        document.getElementById('viewAllHistoryBtn')?.addEventListener('click', () => {
            Modal.close();
            setTimeout(() => showFullHistoryModal(memberId), 250);
        });

        // View full history button (navigates to history page with Body tab)
        document.getElementById('viewBodyHistoryBtn')?.addEventListener('click', () => {
            Modal.close();
            setTimeout(() => showHistoryPage(memberId, 'weekly', 'body'), 250);
        });

        // Close button
        document.querySelector('[data-modal-close]')?.addEventListener('click', () => {
            Modal.close();
        });
    }

    /**
     * Show full history modal with all entries
     */
    function showFullHistoryModal(memberId) {
        const data = getMeasurementsData(memberId);
        const { settings } = data;
        const log = [...(data.log || [])].sort((a, b) => new Date(b.date) - new Date(a.date));
        const enabledMetrics = MEASUREMENT_METRICS.filter(m => settings.enabledMetrics.includes(m.id));

        const content = `
            <div class="measurements-full-history">
                <div class="measurements-full-history__list">
                    ${log.map(entry => `
                        <div class="measurements-history__item" data-entry-id="${entry.id}">
                            <span class="measurements-history__date">
                                ${formatDateLocal(entry.date)}
                            </span>
                            <span class="measurements-history__values">
                                ${enabledMetrics.map(m => {
                                    if (entry.values[m.id] === undefined) return '';
                                    const displayVal = formatDisplayValue(convertForDisplay(entry.values[m.id], m.id, settings.unit), m.id);
                                    return `${m.name}: ${displayVal}`;
                                }).filter(Boolean).join(' · ')}
                            </span>
                            <button class="btn btn--icon btn--ghost btn--sm measurements-history__delete" data-delete="${entry.id}">
                                <i data-lucide="trash-2"></i>
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        Modal.open({
            title: `All Measurements (${log.length})`,
            content,
            footer: '<button class="btn btn--secondary" data-modal-back>Back</button>'
        });

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Delete entries
        document.querySelectorAll('.measurements-history__delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const entryId = btn.dataset.delete;
                const freshData = getMeasurementsData(memberId);
                freshData.log = freshData.log.filter(entry => entry.id !== entryId);
                saveMeasurementsData(memberId, freshData);
                Toast.success('Entry deleted');
                Modal.close();
                setTimeout(() => showFullHistoryModal(memberId), 250);
            });
        });

        // Back button
        document.querySelector('[data-modal-back]')?.addEventListener('click', () => {
            Modal.close();
            setTimeout(() => showMeasurementsModal(memberId), 250);
        });
    }

    /**
     * Show log measurements form modal
     */
    function showLogMeasurementsModal(memberId) {
        const data = getMeasurementsData(memberId);
        const { settings, log } = data;
        const enabledMetrics = MEASUREMENT_METRICS.filter(m => settings.enabledMetrics.includes(m.id));
        const latestEntry = log[0] || null;
        const today = DateUtils.today();

        const content = `
            <div class="measurements-log-form">
                <div class="form-group">
                    <label class="form-label">Date</label>
                    <input type="date" class="form-input" id="measurementDate" value="${today}" max="${today}">
                </div>

                <div class="measurements-log-form__fields">
                    ${enabledMetrics.map(metric => {
                        const unit = metric.unit[settings.unit];
                        // Convert last value to display unit for placeholder
                        const storedLastValue = latestEntry?.values[metric.id];
                        const displayLastValue = storedLastValue !== undefined
                            ? formatDisplayValue(convertForDisplay(storedLastValue, metric.id, settings.unit), metric.id)
                            : '';

                        return `
                            <div class="form-group">
                                <label class="form-label">
                                    ${metric.name}
                                    <span class="form-label__unit">(${unit})</span>
                                </label>
                                <input type="number"
                                       class="form-input"
                                       id="metric-${metric.id}"
                                       placeholder="${displayLastValue || 'Enter value'}"
                                       step="0.1"
                                       min="0">
                            </div>
                        `;
                    }).join('')}
                </div>

                <p class="measurements-log-form__hint">
                    <i data-lucide="info"></i>
                    Leave fields blank to skip them
                </p>
            </div>
        `;

        Modal.open({
            title: 'Log Measurements',
            content,
            footer: Modal.createFooter('Cancel', 'Save')
        });

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        Modal.bindFooterEvents(() => {
            const date = document.getElementById('measurementDate')?.value || today;
            const values = {};
            let hasValues = false;

            enabledMetrics.forEach(metric => {
                const input = document.getElementById(`metric-${metric.id}`);
                if (input && input.value) {
                    const enteredValue = parseFloat(input.value);
                    // Convert to metric for storage (if user entered in imperial)
                    values[metric.id] = convertToMetric(enteredValue, metric.id, settings.unit);
                    hasValues = true;
                }
            });

            if (!hasValues) {
                Toast.error('Please enter at least one measurement');
                return false;
            }

            // Check if measurement already exists for this date
            const existingIndex = data.log.findIndex(entry => entry.date === date);
            const isUpdate = existingIndex >= 0;

            if (isUpdate) {
                // Update existing entry - merge new values with existing values
                data.log[existingIndex] = {
                    ...data.log[existingIndex],
                    values: {
                        ...data.log[existingIndex].values,
                        ...values
                    },
                    updatedAt: new Date().toISOString()
                };
            } else {
                // Add new entry
                const newEntry = {
                    id: `meas-${Date.now()}`,
                    date,
                    values,
                    createdAt: new Date().toISOString()
                };

                // Add to log (newest first)
                data.log.unshift(newEntry);

                // Keep only last 365 entries
                data.log = data.log.slice(0, 365);
            }

            saveMeasurementsData(memberId, data);
            Toast.success(isUpdate ? 'Measurements updated!' : 'Measurements saved!');

            // Directly transition to main modal without closing first
            showMeasurementsModal(memberId);

            return false; // Don't close modal (we're transitioning directly)
        });
    }

    /**
     * Show measurement settings modal
     */
    function showMeasurementSettingsModal(memberId) {
        const data = getMeasurementsData(memberId);
        const { settings } = data;

        const content = `
            <div class="measurements-settings">
                <h4 class="measurements-settings__title">Select Metrics to Track</h4>
                <div class="measurements-settings__list">
                    ${MEASUREMENT_METRICS.map(metric => `
                        <label class="measurements-settings__item">
                            <input type="checkbox"
                                   class="measurements-settings__checkbox"
                                   data-metric="${metric.id}"
                                   ${settings.enabledMetrics.includes(metric.id) ? 'checked' : ''}>
                            <span class="measurements-settings__label">
                                <i data-lucide="${metric.icon}"></i>
                                ${metric.name}
                            </span>
                        </label>
                    `).join('')}
                </div>

                <h4 class="measurements-settings__title" style="margin-top: 20px;">Goals (Optional)</h4>
                <div class="measurements-settings__goals">
                    ${MEASUREMENT_METRICS.filter(m => settings.enabledMetrics.includes(m.id)).map(metric => {
                        const unit = metric.unit[settings.unit];
                        // Convert stored goal (in metric) to display unit
                        const storedGoal = settings.goals[metric.id];
                        const displayGoal = storedGoal ? formatDisplayValue(convertForDisplay(storedGoal, metric.id, settings.unit), metric.id) : '';
                        return `
                            <div class="form-group form-group--inline">
                                <label class="form-label">${metric.name}</label>
                                <input type="number"
                                       class="form-input form-input--sm"
                                       id="goal-${metric.id}"
                                       value="${displayGoal}"
                                       placeholder="Target ${unit}"
                                       step="0.1"
                                       min="0">
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;

        Modal.open({
            title: 'Customize Measurements',
            content,
            footer: Modal.createFooter('Cancel', 'Save')
        });

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        Modal.bindFooterEvents(() => {
            const enabledMetrics = [];
            const goals = {};

            document.querySelectorAll('.measurements-settings__checkbox').forEach(checkbox => {
                if (checkbox.checked) {
                    enabledMetrics.push(checkbox.dataset.metric);
                }
            });

            if (enabledMetrics.length === 0) {
                Toast.error('Please select at least one metric');
                return false;
            }

            // Get goals and convert to metric for storage
            MEASUREMENT_METRICS.forEach(metric => {
                const goalInput = document.getElementById(`goal-${metric.id}`);
                if (goalInput && goalInput.value) {
                    const enteredGoal = parseFloat(goalInput.value);
                    // Convert to metric for storage
                    goals[metric.id] = convertToMetric(enteredGoal, metric.id, settings.unit);
                }
            });

            data.settings.enabledMetrics = enabledMetrics;
            data.settings.goals = goals;
            saveMeasurementsData(memberId, data);

            Toast.success('Settings saved!');
            setTimeout(() => showMeasurementsModal(memberId), 250);

            return true;
        });
    }

    function init() {
        // Initialize workout feature
    }

    return {
        init,
        renderWidget,
        showHistoryPage,
        logWorkout,
        showSuggestionSetupModal,
        showMeasurementsModal
    };
})();
