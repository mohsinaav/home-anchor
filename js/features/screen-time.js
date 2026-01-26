/**
 * Screen Time Feature
 * Track and manage screen time for kids
 * Full page with tabs: Today, History, Settings
 */

const ScreenTime = (function() {
    // Track current tab in full page view
    let currentTab = 'today';

    /**
     * Check if today is a weekend (Saturday or Sunday)
     */
    function isWeekend() {
        const day = new Date().getDay();
        return day === 0 || day === 6; // Sunday = 0, Saturday = 6
    }

    /**
     * Get the daily limit for today (weekday or weekend)
     */
    function getTodayLimit(widgetData) {
        // Support both old format (single dailyLimit) and new format (weekdayLimit/weekendLimit)
        if (widgetData.weekdayLimit !== undefined && widgetData.weekendLimit !== undefined) {
            return isWeekend() ? widgetData.weekendLimit : widgetData.weekdayLimit;
        }
        // Fallback to old format
        return widgetData.dailyLimit || 120;
    }

    /**
     * Render the screen time widget for a member
     */
    function renderWidget(container, memberId) {
        const today = DateUtils.today();
        const widgetData = Storage.getWidgetData(memberId, 'screen-time') || {
            weekdayLimit: 120, // minutes
            weekendLimit: 180, // minutes (more on weekends)
            log: {}
        };

        const todayLimit = getTodayLimit(widgetData);
        const todayLog = widgetData.log?.[today] || { used: 0, sessions: [] };
        const remaining = Math.max(0, todayLimit - todayLog.used);
        const percentUsed = Math.min(100, (todayLog.used / todayLimit) * 100);

        // Check if timer is running for this member
        const timerStatus = getScreenTimerStatus();
        const isTimerRunning = timerStatus.isRunning && timerStatus.memberId === memberId;
        const isOverLimit = isTimerRunning && timerStatus.isOverLimit;

        container.innerHTML = `
            <div class="screen-time-widget ${isTimerRunning ? 'screen-time-widget--active' : ''} ${isOverLimit ? 'screen-time-widget--over' : ''}">
                <div class="screen-time-widget__gauge">
                    <svg viewBox="0 0 100 100" class="screen-time-gauge">
                        <circle cx="50" cy="50" r="40" class="screen-time-gauge__bg"></circle>
                        <circle cx="50" cy="50" r="40" class="screen-time-gauge__fill ${percentUsed > 80 ? 'screen-time-gauge__fill--warning' : ''} ${isOverLimit ? 'screen-time-gauge__fill--over' : ''}"
                                style="stroke-dasharray: ${percentUsed * 2.51} 251"></circle>
                    </svg>
                    <div class="screen-time-widget__center">
                        ${isTimerRunning ? `
                            <span class="screen-time-widget__time ${isOverLimit ? 'screen-time-widget__time--over' : 'screen-time-widget__time--active'}" id="screen-timer-display">
                                ${isOverLimit ? '+' + formatMinutes(timerStatus.minutesOver) : formatMinutes(timerStatus.remainingMinutes)}
                            </span>
                            <span class="screen-time-widget__label ${isOverLimit ? 'screen-time-widget__label--over' : ''}">
                                ${isOverLimit ? 'OVER LIMIT!' : 'remaining'}
                            </span>
                        ` : `
                            <span class="screen-time-widget__time">${formatMinutes(remaining)}</span>
                            <span class="screen-time-widget__label">remaining</span>
                        `}
                    </div>
                </div>

                <div class="screen-time-widget__info">
                    <div class="screen-time-stat">
                        <span class="screen-time-stat__label">Used today</span>
                        <span class="screen-time-stat__value">${formatMinutes(todayLog.used)}</span>
                    </div>
                    <div class="screen-time-stat">
                        <span class="screen-time-stat__label">${isWeekend() ? 'Weekend' : 'Weekday'} limit</span>
                        <span class="screen-time-stat__value">${formatMinutes(todayLimit)}</span>
                    </div>
                </div>

                <div class="screen-time-widget__actions">
                    ${isTimerRunning ? `
                        <button class="btn btn--danger btn--sm" data-action="stop-timer" data-member-id="${memberId}">
                            <i data-lucide="square"></i>
                            Stop Timer
                        </button>
                    ` : remaining > 0 ? `
                        <button class="btn btn--success btn--sm" data-action="start-timer" data-member-id="${memberId}">
                            <i data-lucide="play"></i>
                            Start Timer
                        </button>
                    ` : `
                        <button class="btn btn--secondary btn--sm" disabled>
                            <i data-lucide="clock"></i>
                            No Time Left
                        </button>
                    `}
                    <button class="btn btn--ghost btn--sm" data-action="log-time" data-member-id="${memberId}">
                        <i data-lucide="plus"></i>
                        Log
                    </button>
                </div>

                <div class="screen-time-widget__footer">
                    <button class="btn btn--sm btn--ghost" data-action="view-all" data-member-id="${memberId}">
                        <i data-lucide="maximize-2"></i>
                        View All
                    </button>
                    <button class="btn btn--sm btn--ghost" data-action="reset-time" data-member-id="${memberId}" title="Reset today's usage (requires PIN)">
                        <i data-lucide="rotate-ccw"></i>
                        Reset
                    </button>
                    <button class="btn btn--sm btn--ghost" data-action="set-limit" data-member-id="${memberId}">
                        <i data-lucide="settings"></i>
                        Limit
                    </button>
                </div>
            </div>
        `;

        // Bind events
        bindScreenTimeEvents(container, memberId, widgetData);

        // If timer is running, start updating the display
        if (isTimerRunning) {
            startWidgetTimerUpdate(container, memberId);
        }
    }

    /**
     * Format minutes to hours:minutes
     */
    function formatMinutes(mins) {
        const hours = Math.floor(mins / 60);
        const minutes = mins % 60;
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    }

    /**
     * Bind screen time events
     */
    function bindScreenTimeEvents(container, memberId, widgetData) {
        container.querySelector('[data-action="log-time"]')?.addEventListener('click', () => {
            showLogTimeModal(memberId, widgetData);
        });

        container.querySelector('[data-action="view-all"]')?.addEventListener('click', () => {
            showFullPage(memberId);
        });

        container.querySelector('[data-action="set-limit"]')?.addEventListener('click', async () => {
            const verified = await PIN.verify();
            if (verified) {
                showSetLimitModal(memberId, widgetData);
            }
        });

        // Reset today's usage button
        container.querySelector('[data-action="reset-time"]')?.addEventListener('click', async () => {
            const verified = await PIN.verify();
            if (verified) {
                resetTodayUsage(memberId, container);
            }
        });

        // Start timer button
        container.querySelector('[data-action="start-timer"]')?.addEventListener('click', () => {
            const result = startScreenTimer(memberId);
            if (result.success) {
                Toast.success(result.message);
                // Re-render widget to show running state
                renderWidget(container, memberId);
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            } else {
                Toast.warning(result.message);
            }
        });

        // Stop timer button
        container.querySelector('[data-action="stop-timer"]')?.addEventListener('click', () => {
            const result = stopScreenTimer();
            if (result.success) {
                // Show appropriate message based on points change
                if (result.pointsChange > 0) {
                    Toast.success(result.message);
                } else if (result.pointsChange < 0) {
                    Toast.warning(result.message);
                } else {
                    Toast.info(result.message);
                }
                // Re-render widget to show updated state
                renderWidget(container, memberId);
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            } else {
                Toast.warning(result.message);
            }
        });
    }

    // Widget timer update interval reference
    let widgetUpdateInterval = null;

    /**
     * Start updating the widget timer display
     */
    function startWidgetTimerUpdate(container, memberId) {
        // Clear any existing interval
        if (widgetUpdateInterval) {
            clearInterval(widgetUpdateInterval);
        }

        widgetUpdateInterval = setInterval(() => {
            const status = getScreenTimerStatus();

            // If timer stopped or different member, re-render and stop updating
            if (!status.isRunning || status.memberId !== memberId) {
                clearInterval(widgetUpdateInterval);
                widgetUpdateInterval = null;
                renderWidget(container, memberId);
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
                return;
            }

            // Update the timer display
            const timerDisplay = container.querySelector('#screen-timer-display');
            if (timerDisplay) {
                // Show time over (with +) or remaining time
                if (status.isOverLimit) {
                    timerDisplay.textContent = '+' + formatMinutes(status.minutesOver);
                    timerDisplay.classList.remove('screen-time-widget__time--active');
                    timerDisplay.classList.add('screen-time-widget__time--over');

                    // Update label
                    const label = container.querySelector('.screen-time-widget__label');
                    if (label && !label.classList.contains('screen-time-widget__label--over')) {
                        label.textContent = 'OVER LIMIT!';
                        label.classList.add('screen-time-widget__label--over');
                    }

                    // Update widget container
                    const widget = container.querySelector('.screen-time-widget');
                    if (widget && !widget.classList.contains('screen-time-widget--over')) {
                        widget.classList.add('screen-time-widget--over');
                    }
                } else {
                    timerDisplay.textContent = formatMinutes(status.remainingMinutes);
                }
            }
        }, 1000);
    }

    // =========================================================================
    // FULL PAGE VIEW
    // =========================================================================

    /**
     * Show full page view
     */
    function showFullPage(memberId) {
        const main = document.getElementById('mainContent');
        if (!main) return;

        const member = Storage.getMember(memberId);
        currentTab = 'today';
        renderFullPage(main, memberId, member, currentTab);
    }

    /**
     * Render full page with tabs
     */
    function renderFullPage(container, memberId, member, tab = 'today') {
        const today = DateUtils.today();
        const widgetData = Storage.getWidgetData(memberId, 'screen-time') || {
            weekdayLimit: 120,
            weekendLimit: 180,
            log: {}
        };

        const todayLimit = getTodayLimit(widgetData);
        const todayLog = widgetData.log?.[today] || { used: 0, sessions: [] };
        const remaining = Math.max(0, todayLimit - todayLog.used);
        const percentUsed = Math.min(100, (todayLog.used / todayLimit) * 100);

        // Get age-adaptive content
        const useKidTheme = typeof KidTheme !== 'undefined';
        const ageGroup = useKidTheme ? KidTheme.getAgeGroup(member) : 'kid';
        const isYoungKid = ageGroup === 'kid' || ageGroup === 'toddler';
        const colors = useKidTheme ? KidTheme.getColors('screen-time') : { gradient: 'linear-gradient(135deg, #CFFAFE 0%, #A5F3FC 50%, #67E8F9 100%)' };

        // Get tab content
        const tabContent = renderTabContent(tab, memberId, member, widgetData);

        // Define tabs
        const tabs = [
            { id: 'today', label: 'Today', icon: 'clock', emoji: '📱' },
            { id: 'history', label: 'History', icon: 'history', emoji: '📅' },
            { id: 'stats', label: 'Stats', icon: 'bar-chart-2', emoji: '📊' }
        ];

        container.innerHTML = `
            <div class="kid-page kid-page--screen-time ${useKidTheme ? KidTheme.getAgeClass(member) : ''}">
                <!-- Hero Section -->
                <div class="kid-page__hero" style="background: ${colors.gradient}; --kid-hero-text: ${colors.dark}">
                    <button class="btn btn--ghost kid-page__back" id="backToMemberBtn">
                        <i data-lucide="arrow-left"></i>
                        Back
                    </button>
                    <div class="kid-page__hero-content">
                        <h1 class="kid-page__hero-title ${isYoungKid ? 'kid-page__hero-title--playful' : ''}">
                            ${isYoungKid ? '📱 Screen Time' : 'Screen Time'}
                        </h1>
                    </div>
                    <div class="kid-page__hero-stats">
                        <div class="kid-hero-stat">
                            <span class="kid-hero-stat__value">${formatMinutes(remaining)}</span>
                            <span class="kid-hero-stat__label">${isYoungKid ? '⏰ Left Today' : 'Remaining'}</span>
                        </div>
                        <div class="kid-hero-stat">
                            <span class="kid-hero-stat__value">${formatMinutes(todayLog.used)}</span>
                            <span class="kid-hero-stat__label">${isYoungKid ? '📺 Used' : 'Used Today'}</span>
                        </div>
                        <div class="kid-hero-stat">
                            <span class="kid-hero-stat__value">${formatMinutes(todayLimit)}</span>
                            <span class="kid-hero-stat__label">${isYoungKid ? '🎯 Limit' : isWeekend() ? 'Weekend Limit' : 'Weekday Limit'}</span>
                        </div>
                    </div>
                </div>

                <!-- Tab Navigation -->
                <div class="kid-page__tabs">
                    ${tabs.map(t => `
                        <button class="kid-page__tab ${t.id === tab ? 'kid-page__tab--active' : ''}" data-tab="${t.id}">
                            ${isYoungKid && t.emoji ? `<span class="emoji-icon">${t.emoji}</span>` : `<i data-lucide="${t.icon}"></i>`}
                            ${t.label}
                        </button>
                    `).join('')}
                </div>

                <!-- Tab Content -->
                <div class="kid-page__content">
                    ${tabContent}
                </div>
            </div>
        `;

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        bindFullPageEvents(container, memberId, member, widgetData, tab);
    }

    /**
     * Render tab content based on active tab
     */
    function renderTabContent(tab, memberId, member, widgetData) {
        switch (tab) {
            case 'today':
                return renderTodayTab(memberId, member, widgetData);
            case 'history':
                return renderHistoryTabContent(memberId, member, widgetData);
            case 'stats':
                return renderStatsTabContent(memberId, member, widgetData);
            default:
                return renderTodayTab(memberId, member, widgetData);
        }
    }

    /**
     * Render Today tab content
     */
    function renderTodayTab(memberId, member, widgetData) {
        const today = DateUtils.today();
        const todayLimit = getTodayLimit(widgetData);
        const todayLog = widgetData.log?.[today] || { used: 0, sessions: [] };
        const remaining = Math.max(0, todayLimit - todayLog.used);
        const percentUsed = Math.min(100, (todayLog.used / todayLimit) * 100);
        const isOverLimit = todayLog.used > todayLimit;

        const useKidTheme = typeof KidTheme !== 'undefined';
        const ageGroup = useKidTheme ? KidTheme.getAgeGroup(member) : 'kid';
        const isYoungKid = ageGroup === 'kid' || ageGroup === 'toddler';

        const getActivityIcon = (activity) => {
            const icons = {
                'games': 'gamepad',
                'tv': 'tv',
                'youtube': 'play-circle',
                'tablet': 'tablet',
                'educational': 'book-open',
                'other': 'monitor'
            };
            return icons[activity] || 'monitor';
        };

        const getActivityEmoji = (activity) => {
            const emojis = {
                'games': '🎮',
                'tv': '📺',
                'youtube': '▶️',
                'tablet': '📱',
                'educational': '📚',
                'other': '💻'
            };
            return emojis[activity] || '📱';
        };

        const getActivityLabel = (activity) => {
            const labels = {
                'games': 'Video Games',
                'tv': 'TV/Movies',
                'youtube': 'YouTube',
                'tablet': 'Tablet Apps',
                'educational': 'Educational',
                'other': 'Other'
            };
            return labels[activity] || activity || 'Screen time';
        };

        return `
            <div class="screen-time-today">
                <!-- Visual Gauge -->
                <div class="screen-time-today__gauge-section">
                    <div class="screen-time-today__gauge ${isOverLimit ? 'screen-time-today__gauge--over' : ''}">
                        <svg viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="40" fill="none" stroke="#E5E7EB" stroke-width="10"/>
                            <circle cx="50" cy="50" r="40" fill="none"
                                stroke="${isOverLimit ? '#EF4444' : '#06B6D4'}" stroke-width="10"
                                stroke-dasharray="${percentUsed * 2.51} 251" stroke-linecap="round"
                                transform="rotate(-90 50 50)"/>
                        </svg>
                        <div class="screen-time-today__gauge-center">
                            <span class="screen-time-today__gauge-value">${Math.round(percentUsed)}%</span>
                            <span class="screen-time-today__gauge-label">${isYoungKid ? 'used' : 'of limit'}</span>
                        </div>
                    </div>
                    <div class="screen-time-today__gauge-info">
                        <div class="screen-time-today__remaining ${isOverLimit ? 'screen-time-today__remaining--over' : ''}">
                            ${isOverLimit
                                ? (isYoungKid ? '⚠️ Over limit!' : 'Over limit!')
                                : (isYoungKid ? `${formatMinutes(remaining)} left! ⏰` : `${formatMinutes(remaining)} remaining`)}
                        </div>
                        <button class="btn btn--primary" id="logTimeBtn">
                            <i data-lucide="plus"></i>
                            ${isYoungKid ? 'Log Time!' : 'Log Screen Time'}
                        </button>
                    </div>
                </div>

                <!-- Today's Sessions -->
                <div class="screen-time-today__sessions">
                    <h3>${isYoungKid ? "📋 Today's Activities" : "Today's Sessions"}</h3>
                    ${todayLog.sessions && todayLog.sessions.length > 0 ? `
                        <div class="screen-time-sessions-list">
                            ${todayLog.sessions.map((session, idx) => `
                                <div class="screen-time-session-card">
                                    <div class="screen-time-session-card__icon">
                                        ${isYoungKid
                                            ? `<span>${getActivityEmoji(session.activity)}</span>`
                                            : `<i data-lucide="${getActivityIcon(session.activity)}"></i>`}
                                    </div>
                                    <div class="screen-time-session-card__info">
                                        <span class="screen-time-session-card__name">${getActivityLabel(session.activity)}</span>
                                        <span class="screen-time-session-card__time">
                                            ${new Date(session.time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <div class="screen-time-session-card__duration">${session.minutes || session.duration || 0}m</div>
                                </div>
                            `).join('')}
                        </div>
                    ` : `
                        <div class="kid-page__empty ${isYoungKid ? 'kid-page__empty--playful' : ''}">
                            <div class="kid-page__empty-icon">📱</div>
                            <p>${isYoungKid ? 'No screen time yet today!' : 'No screen time logged today'}</p>
                        </div>
                    `}
                </div>
            </div>
        `;
    }

    /**
     * Render History tab content
     */
    function renderHistoryTabContent(memberId, member, widgetData) {
        const log = widgetData.log || {};
        const dates = Object.keys(log).sort().reverse().slice(0, 14);
        const useKidTheme = typeof KidTheme !== 'undefined';
        const ageGroup = useKidTheme ? KidTheme.getAgeGroup(member) : 'kid';
        const isYoungKid = ageGroup === 'kid' || ageGroup === 'toddler';

        if (dates.length === 0) {
            return `
                <div class="kid-page__empty ${isYoungKid ? 'kid-page__empty--playful' : ''}">
                    <div class="kid-page__empty-icon">📅</div>
                    <p>${isYoungKid ? 'No history yet! Start logging!' : 'No screen time history yet'}</p>
                </div>
            `;
        }

        const today = DateUtils.today();
        const yesterday = DateUtils.formatISO(DateUtils.addDays(new Date(), -1));

        const getDateLabel = (date) => {
            if (date === today) return isYoungKid ? 'Today! 🌟' : 'Today';
            if (date === yesterday) return isYoungKid ? 'Yesterday' : 'Yesterday';
            return new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        };

        return `
            <div class="screen-time-history-list">
                ${dates.map(date => {
                    const dayLog = log[date];
                    const limitForDay = getLimitForDate(widgetData, date);
                    const percentUsed = Math.min(100, (dayLog.used / limitForDay) * 100);
                    const isOverLimit = dayLog.used > limitForDay;

                    return `
                        <div class="screen-time-history-card ${isOverLimit ? 'screen-time-history-card--over' : ''}">
                            <div class="screen-time-history-card__header">
                                <span class="screen-time-history-card__date">${getDateLabel(date)}</span>
                                <span class="screen-time-history-card__time ${isOverLimit ? 'screen-time-history-card__time--over' : ''}">
                                    ${formatMinutes(dayLog.used)}
                                    ${isOverLimit ? (isYoungKid ? ' ⚠️' : '') : ''}
                                </span>
                            </div>
                            <div class="screen-time-history-card__bar">
                                <div class="screen-time-history-card__fill ${isOverLimit ? 'screen-time-history-card__fill--over' : ''}"
                                     style="width: ${percentUsed}%"></div>
                            </div>
                            <div class="screen-time-history-card__footer">
                                <span>Limit: ${formatMinutes(limitForDay)}</span>
                                <span>${dayLog.sessions?.length || 0} ${isYoungKid ? 'activities' : 'sessions'}</span>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    /**
     * Render Stats tab content
     */
    function renderStatsTabContent(memberId, member, widgetData) {
        const log = widgetData.log || {};
        const dates = Object.keys(log).sort().reverse();
        const useKidTheme = typeof KidTheme !== 'undefined';
        const ageGroup = useKidTheme ? KidTheme.getAgeGroup(member) : 'kid';
        const isYoungKid = ageGroup === 'kid' || ageGroup === 'toddler';

        // Calculate stats
        const last7Days = dates.slice(0, 7);
        const last30Days = dates.slice(0, 30);

        const totalUsed7 = last7Days.reduce((sum, d) => sum + (log[d]?.used || 0), 0);
        const avgUsed7 = last7Days.length > 0 ? Math.round(totalUsed7 / last7Days.length) : 0;

        const totalUsed30 = last30Days.reduce((sum, d) => sum + (log[d]?.used || 0), 0);
        const avgUsed30 = last30Days.length > 0 ? Math.round(totalUsed30 / last30Days.length) : 0;

        const daysUnderLimit = last7Days.filter(d => {
            const limitForDay = getLimitForDate(widgetData, d);
            return (log[d]?.used || 0) <= limitForDay;
        }).length;

        // Activity breakdown for last 7 days
        const activityBreakdown = {};
        last7Days.forEach(d => {
            const sessions = log[d]?.sessions || [];
            sessions.forEach(s => {
                const activity = s.activity || 'other';
                // Handle both old format (duration) and new format (minutes)
                const minutes = s.minutes || s.duration || 0;
                activityBreakdown[activity] = (activityBreakdown[activity] || 0) + minutes;
            });
        });

        const sortedActivities = Object.entries(activityBreakdown).sort((a, b) => b[1] - a[1]);
        const totalActivityTime = sortedActivities.reduce((sum, [, time]) => sum + time, 0);

        const activityColors = {
            'games': '#8B5CF6',
            'tv': '#3B82F6',
            'youtube': '#EF4444',
            'tablet': '#10B981',
            'educational': '#F59E0B',
            'other': '#6B7280'
        };

        const activityEmojis = {
            'games': '🎮',
            'tv': '📺',
            'youtube': '▶️',
            'tablet': '📱',
            'educational': '📚',
            'other': '💻'
        };

        const activityLabels = {
            'games': 'Video Games',
            'tv': 'TV/Movies',
            'youtube': 'YouTube',
            'tablet': 'Tablet Apps',
            'educational': 'Educational',
            'other': 'Other'
        };

        return `
            <div class="screen-time-stats">
                <!-- Overview Cards -->
                <div class="screen-time-stats__overview">
                    <div class="screen-time-stats__card">
                        ${isYoungKid ? '<span class="emoji-stat">📊</span>' : '<i data-lucide="clock"></i>'}
                        <span class="screen-time-stats__card-value">${formatMinutes(avgUsed7)}</span>
                        <span class="screen-time-stats__card-label">${isYoungKid ? 'Daily Avg' : '7-Day Average'}</span>
                    </div>
                    <div class="screen-time-stats__card">
                        ${isYoungKid ? '<span class="emoji-stat">✅</span>' : '<i data-lucide="check-circle"></i>'}
                        <span class="screen-time-stats__card-value">${daysUnderLimit}/7</span>
                        <span class="screen-time-stats__card-label">${isYoungKid ? 'Good Days!' : 'Days Under Limit'}</span>
                    </div>
                    <div class="screen-time-stats__card">
                        ${isYoungKid ? '<span class="emoji-stat">📅</span>' : '<i data-lucide="calendar"></i>'}
                        <span class="screen-time-stats__card-value">${formatMinutes(avgUsed30)}</span>
                        <span class="screen-time-stats__card-label">${isYoungKid ? 'Month Avg' : '30-Day Average'}</span>
                    </div>
                </div>

                <!-- Activity Breakdown -->
                ${sortedActivities.length > 0 ? `
                    <div class="screen-time-stats__breakdown">
                        <h3>${isYoungKid ? '📊 What You Watch/Play' : 'Activity Breakdown (Last 7 Days)'}</h3>
                        <div class="screen-time-breakdown-list">
                            ${sortedActivities.map(([activity, time]) => {
                                const percent = Math.round((time / totalActivityTime) * 100);
                                return `
                                    <div class="screen-time-breakdown-item" style="--activity-color: ${activityColors[activity] || '#6B7280'}">
                                        <div class="screen-time-breakdown-item__header">
                                            ${isYoungKid
                                                ? `<span class="emoji-icon">${activityEmojis[activity] || '📱'}</span>`
                                                : `<i data-lucide="${activity === 'games' ? 'gamepad' : activity === 'tv' ? 'tv' : activity === 'youtube' ? 'play-circle' : activity === 'tablet' ? 'tablet' : activity === 'educational' ? 'book-open' : 'monitor'}"></i>`}
                                            <span>${activityLabels[activity] || activity}</span>
                                            <span class="screen-time-breakdown-item__time">${formatMinutes(time)}</span>
                                        </div>
                                        <div class="screen-time-breakdown-item__bar">
                                            <div class="screen-time-breakdown-item__fill" style="width: ${percent}%"></div>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                ` : ''}

                <!-- Limits Info -->
                <div class="screen-time-stats__limits">
                    <h3>${isYoungKid ? '⏰ Your Limits' : 'Current Limits'}</h3>
                    <div class="screen-time-limits-display">
                        <div class="screen-time-limit-item">
                            ${isYoungKid ? '📅' : '<i data-lucide="briefcase"></i>'}
                            <span>Weekday (Mon-Fri)</span>
                            <span class="screen-time-limit-item__value">${formatMinutes(widgetData.weekdayLimit || 120)}</span>
                        </div>
                        <div class="screen-time-limit-item">
                            ${isYoungKid ? '🌟' : '<i data-lucide="sun"></i>'}
                            <span>Weekend (Sat-Sun)</span>
                            <span class="screen-time-limit-item__value">${formatMinutes(widgetData.weekendLimit || 180)}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Bind full page events
     */
    function bindFullPageEvents(container, memberId, member, widgetData, tab) {
        // Back button
        document.getElementById('backToMemberBtn')?.addEventListener('click', () => {
            State.emit('tabChanged', memberId);
        });

        // Tab switching
        container.querySelectorAll('.kid-page__tab').forEach(tabBtn => {
            tabBtn.addEventListener('click', () => {
                const tabName = tabBtn.dataset.tab;
                if (tabName !== currentTab) {
                    currentTab = tabName;
                    renderFullPage(container, memberId, member, tabName);
                }
            });
        });

        // Log time button
        document.getElementById('logTimeBtn')?.addEventListener('click', () => {
            showLogTimeModalFullPage(memberId, widgetData, container, member);
        });
    }

    /**
     * Show log time modal from full page (re-renders full page after)
     */
    function showLogTimeModalFullPage(memberId, widgetData, container, member) {
        const content = `
            <form id="logTimeForm">
                <div class="form-group">
                    <label class="form-label">Minutes used</label>
                    <input type="number" class="form-input" id="screenTimeMinutes" placeholder="30" max="480">
                </div>
                <div class="form-group">
                    <label class="form-label">Activity (optional)</label>
                    <select class="form-input form-select" id="screenTimeActivity">
                        <option value="">Select activity</option>
                        <option value="games">Video games</option>
                        <option value="tv">TV/Movies</option>
                        <option value="youtube">YouTube</option>
                        <option value="tablet">Tablet apps</option>
                        <option value="educational">Educational</option>
                        <option value="other">Other</option>
                    </select>
                </div>
            </form>
        `;

        Modal.open({
            title: 'Log Screen Time',
            content,
            footer: Modal.createFooter('Cancel', 'Log Time')
        });

        Modal.bindFooterEvents(() => {
            const minutes = parseInt(document.getElementById('screenTimeMinutes')?.value) || 0;
            const activity = document.getElementById('screenTimeActivity')?.value || '';

            if (minutes <= 0) {
                Toast.error('Please enter valid minutes');
                return false;
            }

            const today = DateUtils.today();
            const todayLog = widgetData.log?.[today] || { used: 0, sessions: [] };

            const updatedLog = {
                ...widgetData.log,
                [today]: {
                    used: todayLog.used + minutes,
                    sessions: [...todayLog.sessions, { minutes, activity, time: new Date().toISOString() }]
                }
            };

            const updatedData = { ...widgetData, log: updatedLog };
            Storage.setWidgetData(memberId, 'screen-time', updatedData);
            Storage.trackAction(memberId, 'screen-time', 'logged');
            Toast.success(`Logged ${minutes} minutes`);

            // Check if over limit
            const newTotal = todayLog.used + minutes;
            const todayLimit = getTodayLimit(widgetData);
            if (newTotal > todayLimit) {
                Toast.warning('Daily limit exceeded!');
            }

            // Re-render full page
            renderFullPage(container, memberId, member, currentTab);

            return true;
        });
    }

    /**
     * Show log time modal
     */
    function showLogTimeModal(memberId, widgetData) {
        const content = `
            <form id="logTimeForm">
                <div class="form-group">
                    <label class="form-label">Minutes used</label>
                    <input type="number" class="form-input" id="screenTimeMinutes" placeholder="30" max="480">
                </div>
                <div class="form-group">
                    <label class="form-label">Activity (optional)</label>
                    <select class="form-input form-select" id="screenTimeActivity">
                        <option value="">Select activity</option>
                        <option value="games">Video games</option>
                        <option value="tv">TV/Movies</option>
                        <option value="youtube">YouTube</option>
                        <option value="tablet">Tablet apps</option>
                        <option value="educational">Educational</option>
                        <option value="other">Other</option>
                    </select>
                </div>
            </form>
        `;

        Modal.open({
            title: 'Log Screen Time',
            content,
            footer: Modal.createFooter('Cancel', 'Log Time')
        });

        Modal.bindFooterEvents(() => {
            const minutes = parseInt(document.getElementById('screenTimeMinutes')?.value) || 0;
            const activity = document.getElementById('screenTimeActivity')?.value || '';

            if (minutes <= 0) {
                Toast.error('Please enter valid minutes');
                return false;
            }

            const today = DateUtils.today();
            const todayLog = widgetData.log?.[today] || { used: 0, sessions: [] };

            const updatedLog = {
                ...widgetData.log,
                [today]: {
                    used: todayLog.used + minutes,
                    sessions: [...todayLog.sessions, { minutes, activity, time: new Date().toISOString() }]
                }
            };

            Storage.setWidgetData(memberId, 'screen-time', { ...widgetData, log: updatedLog });
            Storage.trackAction(memberId, 'screen-time', 'logged');
            Toast.success(`Logged ${minutes} minutes`);

            // Check if over limit
            const newTotal = todayLog.used + minutes;
            const todayLimit = getTodayLimit(widgetData);
            if (newTotal > todayLimit) {
                Toast.warning('Daily limit exceeded!');
            }

            // Refresh widget
            const widgetBody = document.getElementById('widget-screen-time');
            if (widgetBody) {
                renderWidget(widgetBody, memberId);
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            }

            return true;
        });
    }

    /**
     * Get limit for a specific date (checking if it's a weekend)
     */
    function getLimitForDate(widgetData, dateStr) {
        const date = new Date(dateStr);
        const day = date.getDay();
        const isWeekendDay = day === 0 || day === 6;

        if (widgetData.weekdayLimit !== undefined && widgetData.weekendLimit !== undefined) {
            return isWeekendDay ? widgetData.weekendLimit : widgetData.weekdayLimit;
        }
        return widgetData.dailyLimit || 120;
    }

    /**
     * Show history modal - redesigned with visual timeline
     */
    function showHistoryModal(memberId) {
        const widgetData = Storage.getWidgetData(memberId, 'screen-time') || {
            log: {},
            weekdayLimit: 120,
            weekendLimit: 180
        };
        const log = widgetData.log || {};
        const dates = Object.keys(log).sort().reverse().slice(0, 7);
        const weekdayLimit = widgetData.weekdayLimit || widgetData.dailyLimit || 120;
        const weekendLimit = widgetData.weekendLimit || widgetData.dailyLimit || 120;

        // Calculate week stats
        const totalUsed = dates.reduce((sum, d) => sum + (log[d]?.used || 0), 0);
        const avgUsed = dates.length > 0 ? Math.round(totalUsed / dates.length) : 0;
        const daysOverLimit = dates.filter(d => {
            const limitForDay = getLimitForDate(widgetData, d);
            return (log[d]?.used || 0) > limitForDay;
        }).length;

        const today = DateUtils.today();
        const yesterday = DateUtils.formatISO(DateUtils.addDays(new Date(), -1));

        const getDateLabel = (date) => {
            if (date === today) return 'Today';
            if (date === yesterday) return 'Yesterday';
            return new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        };

        const getActivityIcon = (activity) => {
            const icons = {
                'games': 'gamepad',
                'tv': 'tv',
                'youtube': 'play-circle',
                'tablet': 'tablet',
                'educational': 'book-open',
                'other': 'monitor'
            };
            return icons[activity] || 'monitor';
        };

        const getActivityLabel = (activity) => {
            const labels = {
                'games': 'Video Games',
                'tv': 'TV/Movies',
                'youtube': 'YouTube',
                'tablet': 'Tablet Apps',
                'educational': 'Educational',
                'other': 'Other'
            };
            return labels[activity] || activity || 'Screen time';
        };

        const content = dates.length === 0
            ? `
                <div class="screen-time-history-empty">
                    <div class="screen-time-history-empty__icon">
                        <i data-lucide="tv"></i>
                    </div>
                    <h3>No Screen Time Logged</h3>
                    <p>Start logging screen time to see your history here.</p>
                </div>
            `
            : `
                <div class="screen-time-history-page">
                    <div class="screen-time-history-page__stats">
                        <div class="screen-time-history-stat">
                            <span class="screen-time-history-stat__value">${formatMinutes(avgUsed)}</span>
                            <span class="screen-time-history-stat__label">Daily Average</span>
                        </div>
                        <div class="screen-time-history-stat ${daysOverLimit > 0 ? 'screen-time-history-stat--warning' : ''}">
                            <span class="screen-time-history-stat__value">${daysOverLimit}</span>
                            <span class="screen-time-history-stat__label">Days Over Limit</span>
                        </div>
                        <div class="screen-time-history-stat">
                            <span class="screen-time-history-stat__value">${formatMinutes(weekdayLimit)}</span>
                            <span class="screen-time-history-stat__label">Weekday Limit</span>
                        </div>
                        <div class="screen-time-history-stat">
                            <span class="screen-time-history-stat__value">${formatMinutes(weekendLimit)}</span>
                            <span class="screen-time-history-stat__label">Weekend Limit</span>
                        </div>
                    </div>

                    <div class="screen-time-history-timeline">
                        ${dates.map(date => {
                            const dayLog = log[date];
                            const limitForDay = getLimitForDate(widgetData, date);
                            const percentUsed = Math.min(100, (dayLog.used / limitForDay) * 100);
                            const isOverLimit = dayLog.used > limitForDay;

                            return `
                                <div class="screen-time-history-day ${isOverLimit ? 'screen-time-history-day--over' : ''}">
                                    <div class="screen-time-history-day__header">
                                        <span class="screen-time-history-day__date">${getDateLabel(date)}</span>
                                        <span class="screen-time-history-day__time ${isOverLimit ? 'screen-time-history-day__time--over' : ''}">${formatMinutes(dayLog.used)}</span>
                                    </div>
                                    <div class="screen-time-history-day__bar">
                                        <div class="screen-time-history-day__fill ${isOverLimit ? 'screen-time-history-day__fill--over' : ''}"
                                             style="width: ${percentUsed}%"></div>
                                        <div class="screen-time-history-day__limit"></div>
                                    </div>
                                    ${dayLog.sessions && dayLog.sessions.length > 0 ? `
                                        <div class="screen-time-history-day__sessions">
                                            ${dayLog.sessions.map(session => `
                                                <div class="screen-time-history-session">
                                                    <i data-lucide="${getActivityIcon(session.activity)}"></i>
                                                    <span>${getActivityLabel(session.activity)}</span>
                                                    <span class="screen-time-history-session__time">${session.minutes || session.duration || 0}m</span>
                                                </div>
                                            `).join('')}
                                        </div>
                                    ` : ''}
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;

        Modal.open({
            title: 'Screen Time History',
            content,
            size: 'md',
            footer: '<button class="btn btn--primary" data-modal-cancel>Close</button>'
        });

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        document.querySelector('[data-modal-cancel]')?.addEventListener('click', () => {
            Modal.close();
        });
    }

    /**
     * Show set limit modal
     */
    function showSetLimitModal(memberId, widgetData) {
        // Support migration from old single limit to new weekday/weekend limits
        const weekdayLimit = widgetData.weekdayLimit || widgetData.dailyLimit || 120;
        const weekendLimit = widgetData.weekendLimit || widgetData.dailyLimit || 180;
        // Points settings with defaults
        const bonusPoints = widgetData.bonusPoints ?? 10;
        const penaltyPerMin = widgetData.penaltyPerMin ?? 5;
        const maxPenalty = widgetData.maxPenalty ?? 50;
        const bufferMinutes = widgetData.bufferMinutes ?? 5;

        const content = `
            <div class="screen-time-limits-form">
                <h4 style="margin-bottom: var(--space-3); color: var(--gray-600);">Time Limits</h4>
                <div class="form-group">
                    <label class="form-label">
                        <i data-lucide="briefcase" style="width: 16px; height: 16px; display: inline-block; vertical-align: middle;"></i>
                        Weekday Limit (Mon-Fri)
                    </label>
                    <input type="number" class="form-input" id="weekdayLimit" value="${weekdayLimit}" max="480">
                    <div class="limit-presets" data-target="weekdayLimit">
                        <button type="button" class="btn btn--secondary btn--sm" data-preset="60">1h</button>
                        <button type="button" class="btn btn--secondary btn--sm" data-preset="90">1.5h</button>
                        <button type="button" class="btn btn--secondary btn--sm" data-preset="120">2h</button>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">
                        <i data-lucide="sun" style="width: 16px; height: 16px; display: inline-block; vertical-align: middle;"></i>
                        Weekend Limit (Sat-Sun)
                    </label>
                    <input type="number" class="form-input" id="weekendLimit" value="${weekendLimit}" max="480">
                    <div class="limit-presets" data-target="weekendLimit">
                        <button type="button" class="btn btn--secondary btn--sm" data-preset="120">2h</button>
                        <button type="button" class="btn btn--secondary btn--sm" data-preset="180">3h</button>
                        <button type="button" class="btn btn--secondary btn--sm" data-preset="240">4h</button>
                    </div>
                </div>
                <p class="form-helper" style="margin-top: var(--space-2); text-align: center;">Minutes per day (up to 8 hours)</p>

                <hr style="margin: var(--space-4) 0; border: none; border-top: 1px solid var(--gray-200);">

                <h4 style="margin-bottom: var(--space-3); color: var(--gray-600);">Points Settings</h4>
                <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: var(--space-3);">
                    <div class="form-group">
                        <label class="form-label" style="font-size: var(--text-xs);">
                            <i data-lucide="award" style="width: 14px; height: 14px; display: inline-block; vertical-align: middle; color: var(--success);"></i>
                            Bonus
                        </label>
                        <input type="number" class="form-input" id="bonusPoints" value="${bonusPoints}" min="0" max="100" style="text-align: center;">
                        <span class="form-helper" style="font-size: 10px;">within limit</span>
                    </div>
                    <div class="form-group">
                        <label class="form-label" style="font-size: var(--text-xs);">
                            <i data-lucide="minus-circle" style="width: 14px; height: 14px; display: inline-block; vertical-align: middle; color: var(--danger);"></i>
                            Penalty/min
                        </label>
                        <input type="number" class="form-input" id="penaltyPerMin" value="${penaltyPerMin}" min="0" max="20" style="text-align: center;">
                        <span class="form-helper" style="font-size: 10px;">per min over</span>
                    </div>
                    <div class="form-group">
                        <label class="form-label" style="font-size: var(--text-xs);">
                            <i data-lucide="alert-triangle" style="width: 14px; height: 14px; display: inline-block; vertical-align: middle; color: var(--warning);"></i>
                            Max Penalty
                        </label>
                        <input type="number" class="form-input" id="maxPenalty" value="${maxPenalty}" min="0" max="200" style="text-align: center;">
                        <span class="form-helper" style="font-size: 10px;">maximum loss</span>
                    </div>
                </div>
                <div class="form-group" style="margin-top: var(--space-3);">
                    <label class="form-label">
                        <i data-lucide="shield" style="width: 16px; height: 16px; display: inline-block; vertical-align: middle; color: var(--primary);"></i>
                        Grace Period (Buffer)
                    </label>
                    <input type="number" class="form-input" id="bufferMinutes" value="${bufferMinutes}" min="0" max="30" style="text-align: center;">
                    <p class="form-helper" style="margin-top: var(--space-1);">Minutes over limit before penalties apply (0-30 min buffer)</p>
                </div>
            </div>
        `;

        Modal.open({
            title: 'Set Screen Time Limits',
            content,
            footer: Modal.createFooter('Cancel', 'Save')
        });

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Preset buttons - target specific input
        document.querySelectorAll('.limit-presets').forEach(presetGroup => {
            const targetId = presetGroup.dataset.target;
            presetGroup.querySelectorAll('[data-preset]').forEach(btn => {
                btn.addEventListener('click', () => {
                    document.getElementById(targetId).value = btn.dataset.preset;
                });
            });
        });

        Modal.bindFooterEvents(() => {
            const weekday = parseInt(document.getElementById('weekdayLimit')?.value) || 120;
            const weekend = parseInt(document.getElementById('weekendLimit')?.value) || 180;
            const bonus = parseInt(document.getElementById('bonusPoints')?.value) ?? 10;
            const penalty = parseInt(document.getElementById('penaltyPerMin')?.value) ?? 5;
            const maxPen = parseInt(document.getElementById('maxPenalty')?.value) ?? 50;
            const buffer = parseInt(document.getElementById('bufferMinutes')?.value) ?? 5;

            if (weekday < 0 || weekday > 480 || weekend < 0 || weekend > 480) {
                Toast.error('Limits must be between 0 and 480 minutes');
                return false;
            }

            if (buffer < 0 || buffer > 30) {
                Toast.error('Buffer must be between 0 and 30 minutes');
                return false;
            }

            // Save with new format (remove old dailyLimit if present)
            const { dailyLimit, ...restData } = widgetData;
            Storage.setWidgetData(memberId, 'screen-time', {
                ...restData,
                weekdayLimit: weekday,
                weekendLimit: weekend,
                bonusPoints: bonus,
                penaltyPerMin: penalty,
                maxPenalty: maxPen,
                bufferMinutes: buffer
            });
            Toast.success('Settings updated');

            // Refresh widget
            const widgetBody = document.getElementById('widget-screen-time');
            if (widgetBody) {
                renderWidget(widgetBody, memberId);
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            }

            return true;
        });
    }

    function init() {
        // Initialize screen time feature
    }

    /**
     * Reset today's screen time usage (requires PIN verification before calling)
     */
    function resetTodayUsage(memberId, container) {
        const today = DateUtils.today();
        const widgetData = Storage.getWidgetData(memberId, 'screen-time') || {
            weekdayLimit: 120,
            weekendLimit: 180,
            log: {}
        };

        // Check if there's any usage to reset
        const todayLog = widgetData.log?.[today];
        if (!todayLog || todayLog.used === 0) {
            Toast.info('No screen time usage to reset today');
            return;
        }

        // Stop any running timer first
        if (screenTimerState.isRunning && screenTimerState.memberId === memberId) {
            if (screenTimerState.intervalId) {
                clearInterval(screenTimerState.intervalId);
            }
            screenTimerState = {
                isRunning: false,
                memberId: null,
                startTime: null,
                maxDuration: 0,
                elapsedSeconds: 0,
                isOverLimit: false,
                intervalId: null
            };
        }

        // REVERT POINTS: Find all screen-time related points from today and reverse them
        const pointsData = Storage.getWidgetData(memberId, 'points');
        if (pointsData && pointsData.history) {
            // Find all screen-time entries from today
            const todayScreenTimeEntries = pointsData.history.filter(entry =>
                entry.activityId === 'screen-time' && entry.date === today
            );

            if (todayScreenTimeEntries.length > 0) {
                // Calculate total points to reverse
                let pointsToReverse = 0;
                todayScreenTimeEntries.forEach(entry => {
                    if (entry.type === 'earned') {
                        // If points were earned (bonus), deduct them back
                        pointsToReverse -= entry.points;
                    } else if (entry.type === 'deducted') {
                        // If points were deducted (penalty), add them back
                        pointsToReverse += entry.points;
                    }
                });

                // Apply the reversal
                if (pointsToReverse !== 0) {
                    pointsData.balance = Math.max(0, (pointsData.balance || 0) + pointsToReverse);

                    // Remove screen-time entries from history for today
                    pointsData.history = pointsData.history.filter(entry =>
                        !(entry.activityId === 'screen-time' && entry.date === today)
                    );

                    Storage.setWidgetData(memberId, 'points', pointsData);

                    if (pointsToReverse > 0) {
                        Toast.info(`Restored ${pointsToReverse} points from penalties`);
                    } else {
                        Toast.info(`Removed ${Math.abs(pointsToReverse)} bonus points`);
                    }
                }
            }
        }

        // Reset today's log
        widgetData.log[today] = { used: 0, sessions: [], bonusAwarded: false, bonusAwardedAt: null };
        Storage.setWidgetData(memberId, 'screen-time', widgetData);

        Toast.success('Screen time reset for today');

        // Re-render screen time widget
        if (container) {
            renderWidget(container, memberId);
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }

        // Refresh points widget if it exists
        const pointsWidget = document.getElementById('widget-points');
        if (pointsWidget && typeof Points !== 'undefined' && Points.renderWidget) {
            Points.renderWidget(pointsWidget, memberId);
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }
    }

    // =========================================================================
    // SCREEN TIME TIMER (Voice Command Support)
    // =========================================================================

    // Timer state for active screen time session
    let screenTimerState = {
        isRunning: false,
        memberId: null,
        startTime: null,
        maxDuration: 0, // in seconds (remaining time when started)
        elapsedSeconds: 0,
        isOverLimit: false,
        intervalId: null
    };

    /**
     * Start screen time timer
     * Returns the remaining time in minutes or error
     */
    function startScreenTimer(memberId) {
        if (screenTimerState.isRunning) {
            return { success: false, message: 'Screen time timer is already running' };
        }

        const today = DateUtils.today();
        const widgetData = Storage.getWidgetData(memberId, 'screen-time') || {
            weekdayLimit: 120,
            weekendLimit: 180,
            log: {}
        };

        const todayLimit = getTodayLimit(widgetData);
        const todayLog = widgetData.log?.[today] || { used: 0, sessions: [] };
        const remainingMinutes = Math.max(0, todayLimit - todayLog.used);

        if (remainingMinutes <= 0) {
            // Check if bonus was awarded
            const bonusMsg = todayLog.bonusAwarded
                ? " You've earned your screen time bonus for today!"
                : "";
            return { success: false, message: `No screen time remaining for today!${bonusMsg}` };
        }

        // Start the timer
        screenTimerState = {
            isRunning: true,
            memberId: memberId,
            startTime: Date.now(),
            maxDuration: remainingMinutes * 60, // convert to seconds
            elapsedSeconds: 0,
            isOverLimit: false,
            intervalId: null
        };

        // Start interval to track time
        screenTimerState.intervalId = setInterval(() => {
            if (screenTimerState.isRunning) {
                screenTimerState.elapsedSeconds = Math.floor((Date.now() - screenTimerState.startTime) / 1000);

                // Mark as over limit but DO NOT auto-stop
                // Timer keeps running to track how long they exceed
                if (screenTimerState.elapsedSeconds >= screenTimerState.maxDuration) {
                    screenTimerState.isOverLimit = true;
                }
            }
        }, 1000);

        return {
            success: true,
            remainingMinutes: remainingMinutes,
            message: `Screen time started! You have ${formatMinutes(remainingMinutes)} remaining.`
        };
    }

    /**
     * Stop screen time timer and log the session
     */
    function stopScreenTimer() {
        if (!screenTimerState.isRunning) {
            return { success: false, message: 'No screen time timer is running' };
        }

        // Clear the interval
        if (screenTimerState.intervalId) {
            clearInterval(screenTimerState.intervalId);
        }

        const memberId = screenTimerState.memberId;
        const elapsedSeconds = Math.floor((Date.now() - screenTimerState.startTime) / 1000);
        const elapsedMinutes = Math.ceil(elapsedSeconds / 60); // Round up to nearest minute
        const maxDurationMinutes = Math.ceil(screenTimerState.maxDuration / 60);

        // Calculate how many minutes over the limit (if any)
        const minutesOverLimit = Math.max(0, elapsedMinutes - maxDurationMinutes);
        const exceededLimit = minutesOverLimit > 0;

        // Get current data
        const today = DateUtils.today();
        const widgetData = Storage.getWidgetData(memberId, 'screen-time') || {
            weekdayLimit: 120,
            weekendLimit: 180,
            log: {}
        };

        const todayLimit = getTodayLimit(widgetData);

        // Initialize today's log if needed
        if (!widgetData.log) widgetData.log = {};
        if (!widgetData.log[today]) {
            widgetData.log[today] = {
                used: 0,
                sessions: [],
                bonusAwarded: false,  // Track if daily bonus was awarded
                bonusAwardedAt: null  // When bonus was awarded
            };
        }

        // Add session (matching format used by manual logging)
        const session = {
            minutes: elapsedMinutes,
            activity: '', // Timer sessions don't have specific activity
            time: new Date().toISOString(),
            // Additional timer-specific data
            id: `session-${Date.now()}`,
            startTime: new Date(screenTimerState.startTime).toISOString(),
            endTime: new Date().toISOString(),
            exceededLimit: exceededLimit,
            minutesOver: minutesOverLimit
        };

        widgetData.log[today].sessions.push(session);
        widgetData.log[today].used += elapsedMinutes;

        // Save updated data
        Storage.setWidgetData(memberId, 'screen-time', widgetData);

        // Get customizable points settings (with defaults)
        const bonusPoints = widgetData.bonusPoints ?? 10;
        const penaltyPerMin = widgetData.penaltyPerMin ?? 5;
        const maxPenalty = widgetData.maxPenalty ?? 50;
        const bufferMinutes = widgetData.bufferMinutes ?? 5;

        // Calculate points reward or penalty
        // Points logic:
        // - If stopped within limit OR within buffer time → Award bonus (once per day)
        // - If exceeded beyond buffer time → Deduct penalty points
        let pointsChange = 0;
        let pointsMessage = '';

        const todayLog = widgetData.log[today];
        const withinBuffer = !exceededLimit || minutesOverLimit <= bufferMinutes;

        if (exceededLimit && minutesOverLimit > bufferMinutes) {
            // PENALTY: Exceeded limit beyond buffer - deduct points
            const penaltyMinutes = minutesOverLimit - bufferMinutes;
            pointsChange = -Math.min(penaltyMinutes * penaltyPerMin, maxPenalty);
            pointsMessage = `Exceeded limit by ${minutesOverLimit} minute${minutesOverLimit !== 1 ? 's' : ''} (${bufferMinutes}min buffer). ${pointsChange} points!`;
        } else if (bonusPoints > 0 && !todayLog.bonusAwarded && withinBuffer) {
            // REWARD: Award bonus when stopped within limit OR within buffer time
            pointsChange = bonusPoints;
            if (exceededLimit) {
                pointsMessage = `Stopped within ${bufferMinutes}min buffer! +${pointsChange} points!`;
            } else {
                pointsMessage = `Great job staying within your limit! +${pointsChange} points!`;
            }

            // Mark bonus as awarded for today
            widgetData.log[today].bonusAwarded = true;
            widgetData.log[today].bonusAwardedAt = new Date().toISOString();
            Storage.setWidgetData(memberId, 'screen-time', widgetData);
        }

        // Apply points change
        if (pointsChange !== 0) {
            const pointsData = Storage.getWidgetData(memberId, 'points') || {
                balance: 0,
                todayCompleted: [],
                history: []
            };

            pointsData.balance = Math.max(0, (pointsData.balance || 0) + pointsChange);

            // Add to history
            if (!pointsData.history) pointsData.history = [];
            pointsData.history = [
                {
                    activityId: 'screen-time',
                    activityName: pointsChange > 0 ? 'Screen Time Bonus' : 'Screen Time Penalty',
                    activityIcon: pointsChange > 0 ? 'award' : 'alert-triangle',
                    date: today,
                    completedAt: new Date().toISOString(),
                    points: Math.abs(pointsChange),
                    basePoints: Math.abs(pointsChange),
                    bonus: 0,
                    type: pointsChange > 0 ? 'earned' : 'deducted'
                },
                ...pointsData.history.slice(0, 99)
            ];

            Storage.setWidgetData(memberId, 'points', pointsData);
        }

        // Reset timer state
        screenTimerState = {
            isRunning: false,
            memberId: null,
            startTime: null,
            maxDuration: 0,
            elapsedSeconds: 0,
            isOverLimit: false,
            intervalId: null
        };

        const totalUsed = widgetData.log[today].used;
        const usedMessage = `Used ${elapsedMinutes} minutes of screen time.`;
        const remainingMessage = totalUsed < todayLimit
            ? ` ${formatMinutes(todayLimit - totalUsed)} remaining today.`
            : ' No time remaining today.';

        return {
            success: true,
            elapsedMinutes: elapsedMinutes,
            exceededLimit: exceededLimit,
            minutesOver: minutesOverLimit,
            pointsChange: pointsChange,
            message: `${usedMessage}${remainingMessage}${pointsMessage ? ' ' + pointsMessage : ''}`
        };
    }

    /**
     * Get current screen timer status
     */
    function getScreenTimerStatus() {
        if (!screenTimerState.isRunning) {
            return { isRunning: false };
        }

        const elapsedSeconds = Math.floor((Date.now() - screenTimerState.startTime) / 1000);
        const isOverLimit = elapsedSeconds >= screenTimerState.maxDuration;

        // If over limit, show how much time OVER (negative remaining)
        // If within limit, show remaining time
        const remainingSeconds = screenTimerState.maxDuration - elapsedSeconds;
        const remainingMinutes = isOverLimit
            ? -Math.floor(Math.abs(remainingSeconds) / 60) // Negative to show time over
            : Math.ceil(remainingSeconds / 60);

        // Minutes over the limit (for display purposes)
        const minutesOver = isOverLimit ? Math.floor(Math.abs(remainingSeconds) / 60) : 0;

        return {
            isRunning: true,
            memberId: screenTimerState.memberId,
            elapsedMinutes: Math.floor(elapsedSeconds / 60),
            remainingMinutes: remainingMinutes,
            remainingSeconds: remainingSeconds,
            isOverLimit: isOverLimit,
            minutesOver: minutesOver
        };
    }

    /**
     * Check if screen timer is running
     */
    function isScreenTimerRunning() {
        return screenTimerState.isRunning;
    }

    /**
     * Get remaining screen time for a member (without starting timer)
     */
    function getRemainingScreenTime(memberId) {
        const today = DateUtils.today();
        const widgetData = Storage.getWidgetData(memberId, 'screen-time') || {
            weekdayLimit: 120,
            weekendLimit: 180,
            log: {}
        };

        const todayLimit = getTodayLimit(widgetData);
        const todayLog = widgetData.log?.[today] || { used: 0, sessions: [] };
        const remainingMinutes = Math.max(0, todayLimit - todayLog.used);

        return {
            limit: todayLimit,
            used: todayLog.used,
            remaining: remainingMinutes,
            isWeekend: isWeekend()
        };
    }

    return {
        init,
        renderWidget,
        showFullPage,
        // Timer functions for voice commands
        startScreenTimer,
        stopScreenTimer,
        getScreenTimerStatus,
        isScreenTimerRunning,
        getRemainingScreenTime
    };
})();
