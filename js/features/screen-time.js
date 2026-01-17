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

        container.innerHTML = `
            <div class="screen-time-widget">
                <div class="screen-time-widget__gauge">
                    <svg viewBox="0 0 100 100" class="screen-time-gauge">
                        <circle cx="50" cy="50" r="40" class="screen-time-gauge__bg"></circle>
                        <circle cx="50" cy="50" r="40" class="screen-time-gauge__fill ${percentUsed > 80 ? 'screen-time-gauge__fill--warning' : ''}"
                                style="stroke-dasharray: ${percentUsed * 2.51} 251"></circle>
                    </svg>
                    <div class="screen-time-widget__center">
                        <span class="screen-time-widget__time">${formatMinutes(remaining)}</span>
                        <span class="screen-time-widget__label">remaining</span>
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
                    <button class="btn btn--primary btn--sm" data-action="log-time" data-member-id="${memberId}">
                        <i data-lucide="plus"></i>
                        Log Time
                    </button>
                </div>

                <div class="screen-time-widget__footer">
                    <button class="btn btn--sm btn--ghost" data-action="view-all" data-member-id="${memberId}">
                        <i data-lucide="maximize-2"></i>
                        View All
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
                'games': 'gamepad-2',
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
                                    <div class="screen-time-session-card__duration">${session.minutes}m</div>
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
                activityBreakdown[activity] = (activityBreakdown[activity] || 0) + s.minutes;
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
                                                : `<i data-lucide="${activity === 'games' ? 'gamepad-2' : activity === 'tv' ? 'tv' : activity === 'youtube' ? 'play-circle' : activity === 'tablet' ? 'tablet' : activity === 'educational' ? 'book-open' : 'monitor'}"></i>`}
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
                    <input type="number" class="form-input" id="screenTimeMinutes" placeholder="30" min="1" max="480">
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
                    <input type="number" class="form-input" id="screenTimeMinutes" placeholder="30" min="1" max="480">
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
                'games': 'gamepad-2',
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
                                                    <span class="screen-time-history-session__time">${session.minutes}m</span>
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

        const content = `
            <div class="screen-time-limits-form">
                <div class="form-group">
                    <label class="form-label">
                        <i data-lucide="briefcase" style="width: 16px; height: 16px; display: inline-block; vertical-align: middle;"></i>
                        Weekday Limit (Mon-Fri)
                    </label>
                    <input type="number" class="form-input" id="weekdayLimit" value="${weekdayLimit}" min="15" max="480">
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
                    <input type="number" class="form-input" id="weekendLimit" value="${weekendLimit}" min="15" max="480">
                    <div class="limit-presets" data-target="weekendLimit">
                        <button type="button" class="btn btn--secondary btn--sm" data-preset="120">2h</button>
                        <button type="button" class="btn btn--secondary btn--sm" data-preset="180">3h</button>
                        <button type="button" class="btn btn--secondary btn--sm" data-preset="240">4h</button>
                    </div>
                </div>
                <p class="form-helper" style="margin-top: var(--space-2); text-align: center;">Minutes per day (15 min - 8 hours)</p>
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

            if (weekday < 15 || weekday > 480 || weekend < 15 || weekend > 480) {
                Toast.error('Limits must be between 15 and 480 minutes');
                return false;
            }

            // Save with new format (remove old dailyLimit if present)
            const { dailyLimit, ...restData } = widgetData;
            Storage.setWidgetData(memberId, 'screen-time', {
                ...restData,
                weekdayLimit: weekday,
                weekendLimit: weekend
            });
            Toast.success('Limits updated');

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

    return {
        init,
        renderWidget,
        showFullPage
    };
})();
