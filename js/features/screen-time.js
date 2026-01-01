/**
 * Screen Time Feature
 * Track and manage screen time for kids
 */

const ScreenTime = (function() {
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
                    <button class="btn btn--sm btn--ghost" data-action="view-history" data-member-id="${memberId}">
                        <i data-lucide="history"></i>
                        History
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

        container.querySelector('[data-action="view-history"]')?.addEventListener('click', () => {
            showHistoryModal(memberId);
        });

        container.querySelector('[data-action="set-limit"]')?.addEventListener('click', async () => {
            const verified = await PIN.verify();
            if (verified) {
                showSetLimitModal(memberId, widgetData);
            }
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
        renderWidget
    };
})();
