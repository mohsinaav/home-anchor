/**
 * Daily Log Feature
 * Tracks daily activities for toddlers
 */

const DailyLog = (function() {
    // Default log items to track
    const DEFAULT_ITEMS = [
        { id: 'nap', name: 'Nap Time', icon: 'moon', type: 'time' },
        { id: 'meal', name: 'Meals', icon: 'utensils', type: 'count' },
        { id: 'diaper', name: 'Diaper Changes', icon: 'baby', type: 'count' },
        { id: 'mood', name: 'Mood', icon: 'smile', type: 'mood' },
        { id: 'activity', name: 'Activities Done', icon: 'shapes', type: 'count' }
    ];

    /**
     * Calculate potty training stats
     */
    function getPottyStats(widgetData) {
        const pottyLog = widgetData.pottyLog || {};
        const dates = Object.keys(pottyLog).sort().reverse();

        // Calculate streak (consecutive days with at least 1 success)
        let streak = 0;
        const today = DateUtils.today();
        let checkDate = new Date(today);

        for (let i = 0; i < 30; i++) {
            const dateStr = DateUtils.formatISO(checkDate);
            const dayLog = pottyLog[dateStr];

            if (dayLog && dayLog.successes > 0) {
                streak++;
            } else if (i > 0) {
                // Break on first day without success (excluding today)
                break;
            }

            checkDate.setDate(checkDate.getDate() - 1);
        }

        // Calculate overall success rate (last 7 days)
        let totalAttempts = 0;
        let totalSuccesses = 0;
        checkDate = new Date(today);

        for (let i = 0; i < 7; i++) {
            const dateStr = DateUtils.formatISO(checkDate);
            const dayLog = pottyLog[dateStr];

            if (dayLog) {
                totalAttempts += dayLog.attempts || 0;
                totalSuccesses += dayLog.successes || 0;
            }

            checkDate.setDate(checkDate.getDate() - 1);
        }

        const successRate = totalAttempts > 0
            ? Math.round((totalSuccesses / totalAttempts) * 100)
            : 0;

        return { streak, successRate, totalAttempts, totalSuccesses };
    }

    /**
     * Render potty training section
     */
    function renderPottySection(todayPotty, stats) {
        const attempts = todayPotty?.attempts || 0;
        const successes = todayPotty?.successes || 0;
        const todayRate = attempts > 0 ? Math.round((successes / attempts) * 100) : 0;

        return `
            <div class="potty-training-section">
                <div class="potty-training-header">
                    <div class="potty-training-title">
                        <i data-lucide="award"></i>
                        <span>Potty Training</span>
                    </div>
                    <div class="potty-training-streak" title="Consecutive days with success">
                        <span class="potty-streak-value">${stats.streak}</span>
                        <span class="potty-streak-label">day streak</span>
                    </div>
                </div>

                <div class="potty-training-counters">
                    <div class="potty-counter potty-counter--attempts">
                        <div class="potty-counter__label">Attempts</div>
                        <div class="potty-counter__controls">
                            <button class="potty-counter__btn" data-potty-action="decrement-attempts">-</button>
                            <span class="potty-counter__value">${attempts}</span>
                            <button class="potty-counter__btn" data-potty-action="increment-attempts">+</button>
                        </div>
                    </div>

                    <div class="potty-counter potty-counter--successes">
                        <div class="potty-counter__label">Successes</div>
                        <div class="potty-counter__controls">
                            <button class="potty-counter__btn" data-potty-action="decrement-successes">-</button>
                            <span class="potty-counter__value">${successes}</span>
                            <button class="potty-counter__btn" data-potty-action="increment-successes">+</button>
                        </div>
                    </div>
                </div>

                <div class="potty-training-stats">
                    <div class="potty-stat">
                        <span class="potty-stat__value">${todayRate}%</span>
                        <span class="potty-stat__label">Today</span>
                    </div>
                    <div class="potty-stat">
                        <span class="potty-stat__value">${stats.successRate}%</span>
                        <span class="potty-stat__label">7-day avg</span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render the daily log widget for a member
     */
    function renderWidget(container, memberId) {
        const today = DateUtils.today();
        const storedData = Storage.getWidgetData(memberId, 'daily-log') || {};
        const widgetData = {
            items: storedData.items || DEFAULT_ITEMS,
            logs: storedData.logs || {},
            pottyTrainingEnabled: storedData.pottyTrainingEnabled || false,
            pottyLog: storedData.pottyLog || {}
        };

        const todayLog = widgetData.logs[today] || {};
        const todayPotty = widgetData.pottyLog[today] || { attempts: 0, successes: 0 };
        const pottyStats = getPottyStats(widgetData);

        container.innerHTML = `
            <div class="daily-log-widget">
                <div class="daily-log-widget__header">
                    <span class="daily-log-widget__date">${DateUtils.formatShort(today)}</span>
                    <button class="btn btn--xs btn--ghost" data-action="settings" title="Settings">
                        <i data-lucide="settings"></i>
                    </button>
                </div>

                <div class="daily-log-widget__items">
                    ${widgetData.items.map(item => renderLogItem(item, todayLog[item.id])).join('')}
                </div>

                ${widgetData.pottyTrainingEnabled ? renderPottySection(todayPotty, pottyStats) : ''}

                <div class="daily-log-widget__footer">
                    <button class="btn btn--sm btn--ghost" data-action="add-note" data-member-id="${memberId}">
                        <i data-lucide="message-square"></i>
                        Add Note
                    </button>
                    <button class="btn btn--sm btn--ghost" data-action="view-history" data-member-id="${memberId}">
                        <i data-lucide="history"></i>
                        History
                    </button>
                </div>

                ${todayLog.notes ? `
                    <div class="daily-log-widget__notes">
                        <p>${todayLog.notes}</p>
                    </div>
                ` : ''}
            </div>
        `;

        // Bind events
        bindLogEvents(container, memberId, widgetData);
    }

    /**
     * Render a single log item based on type
     */
    function renderLogItem(item, value) {
        switch (item.type) {
            case 'count':
                return `
                    <div class="log-item" data-item-id="${item.id}">
                        <div class="log-item__icon">
                            <i data-lucide="${item.icon}"></i>
                        </div>
                        <span class="log-item__name">${item.name}</span>
                        <div class="log-item__counter">
                            <button class="log-counter__btn" data-action="decrement" data-item="${item.id}">-</button>
                            <span class="log-counter__value">${value || 0}</span>
                            <button class="log-counter__btn" data-action="increment" data-item="${item.id}">+</button>
                        </div>
                    </div>
                `;

            case 'time':
                return `
                    <div class="log-item" data-item-id="${item.id}">
                        <div class="log-item__icon">
                            <i data-lucide="${item.icon}"></i>
                        </div>
                        <span class="log-item__name">${item.name}</span>
                        <div class="log-item__time-group">
                            <input type="time" class="log-item__time" data-time-input="${item.id}" value="${value || ''}">
                            <button class="btn btn--xs btn--outline log-item__now-btn" data-action="log-now" data-item="${item.id}" title="Log current time">
                                Now
                            </button>
                        </div>
                    </div>
                `;

            case 'mood':
                const moods = ['😢', '😐', '🙂', '😄', '🤩'];
                const currentMood = value !== undefined ? value : 2;
                return `
                    <div class="log-item log-item--mood" data-item-id="${item.id}">
                        <div class="log-item__icon">
                            <i data-lucide="${item.icon}"></i>
                        </div>
                        <span class="log-item__name">${item.name}</span>
                        <div class="log-item__moods">
                            ${moods.map((mood, i) => `
                                <button class="mood-btn ${i === currentMood ? 'mood-btn--active' : ''}"
                                        data-mood="${i}" data-item="${item.id}">${mood}</button>
                            `).join('')}
                        </div>
                    </div>
                `;

            default:
                return '';
        }
    }

    /**
     * Bind log events
     */
    function bindLogEvents(container, memberId, widgetData) {
        const today = DateUtils.today();
        const todayLog = widgetData.logs?.[today] || {};

        // Counter buttons
        container.querySelectorAll('[data-action="increment"], [data-action="decrement"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const itemId = btn.dataset.item;
                const action = btn.dataset.action;
                const currentValue = todayLog[itemId] || 0;
                const newValue = action === 'increment' ? currentValue + 1 : Math.max(0, currentValue - 1);

                updateLogValue(memberId, widgetData, today, itemId, newValue);
            });
        });

        // Time inputs
        container.querySelectorAll('[data-time-input]').forEach(input => {
            input.addEventListener('change', () => {
                const itemId = input.dataset.timeInput;
                updateLogValue(memberId, widgetData, today, itemId, input.value);
            });
        });

        // Log Now buttons
        container.querySelectorAll('[data-action="log-now"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const itemId = btn.dataset.item;
                const now = new Date();
                const hh = String(now.getHours()).padStart(2, '0');
                const mm = String(now.getMinutes()).padStart(2, '0');
                const timeStr = `${hh}:${mm}`;
                const input = container.querySelector(`[data-time-input="${itemId}"]`);
                if (input) input.value = timeStr;
                updateLogValue(memberId, widgetData, today, itemId, timeStr);
            });
        });

        // Mood buttons
        container.querySelectorAll('.mood-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const itemId = btn.dataset.item;
                const moodValue = parseInt(btn.dataset.mood);
                updateLogValue(memberId, widgetData, today, itemId, moodValue);
            });
        });

        // Potty training counters
        container.querySelectorAll('[data-potty-action]').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.pottyAction;
                const todayPotty = widgetData.pottyLog?.[today] || { attempts: 0, successes: 0 };

                let newAttempts = todayPotty.attempts || 0;
                let newSuccesses = todayPotty.successes || 0;

                if (action === 'increment-attempts') {
                    newAttempts++;
                } else if (action === 'decrement-attempts') {
                    newAttempts = Math.max(0, newAttempts - 1);
                    // Ensure successes don't exceed attempts
                    newSuccesses = Math.min(newSuccesses, newAttempts);
                } else if (action === 'increment-successes') {
                    // Auto-increment attempts if needed
                    if (newSuccesses >= newAttempts) {
                        newAttempts++;
                    }
                    newSuccesses++;
                } else if (action === 'decrement-successes') {
                    newSuccesses = Math.max(0, newSuccesses - 1);
                }

                updatePottyValue(memberId, widgetData, today, newAttempts, newSuccesses);
            });
        });

        // Settings button
        container.querySelector('[data-action="settings"]')?.addEventListener('click', async () => {
            const verified = await PIN.verify();
            if (verified) {
                showSettingsModal(memberId, widgetData);
            }
        });

        // Add note
        container.querySelector('[data-action="add-note"]')?.addEventListener('click', () => {
            showAddNoteModal(memberId, widgetData, today);
        });

        // View history
        container.querySelector('[data-action="view-history"]')?.addEventListener('click', () => {
            showHistoryModal(memberId);
        });
    }

    /**
     * Update potty log values
     */
    function updatePottyValue(memberId, widgetData, date, attempts, successes) {
        const updatedData = {
            ...widgetData,
            pottyLog: {
                ...widgetData.pottyLog,
                [date]: { attempts, successes }
            }
        };

        Storage.setWidgetData(memberId, 'daily-log', updatedData);

        // Log to Activity Monitor
        if (attempts > 0 || successes > 0) {
            Storage.logActivityEvent({
                memberId: memberId,
                widgetId: 'daily-log',
                action: 'potty',
                details: `Potty training: ${successes}/${attempts} successful`,
                meta: { date, attempts, successes }
            });
        }

        // Refresh widget
        const widgetBody = document.getElementById('widget-daily-log');
        if (widgetBody) {
            renderWidget(widgetBody, memberId);
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }
    }

    /**
     * Show settings modal
     */
    function showSettingsModal(memberId, widgetData, onSaveCallback) {
        const content = `
            <div class="daily-log-settings">
                <div class="form-group">
                    <label class="form-label">
                        <input type="checkbox" id="pottyTrainingToggle" ${widgetData.pottyTrainingEnabled ? 'checked' : ''}>
                        Enable Potty Training Tracker
                    </label>
                    <p class="form-hint">Track attempts, successes, and build a streak!</p>
                </div>
            </div>
        `;

        Modal.open({
            title: 'Daily Log Settings',
            content,
            footer: Modal.createFooter('Cancel', 'Save')
        });

        Modal.bindFooterEvents(() => {
            const pottyEnabled = document.getElementById('pottyTrainingToggle')?.checked || false;

            const updatedData = {
                ...widgetData,
                pottyTrainingEnabled: pottyEnabled
            };

            Storage.setWidgetData(memberId, 'daily-log', updatedData);

            // Refresh widget
            const widgetBody = document.getElementById('widget-daily-log');
            if (widgetBody) {
                renderWidget(widgetBody, memberId);
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            }

            if (onSaveCallback) onSaveCallback();

            Toast.success('Settings saved!');
            return true;
        });
    }

    /**
     * Update a log value
     */
    function updateLogValue(memberId, widgetData, date, itemId, value) {
        const updatedData = {
            ...widgetData,
            logs: {
                ...widgetData.logs,
                [date]: {
                    ...widgetData.logs?.[date],
                    [itemId]: value
                }
            }
        };

        Storage.setWidgetData(memberId, 'daily-log', updatedData);

        // Log to Activity Monitor
        const item = DEFAULT_ITEMS.find(i => i.id === itemId);
        if (item && value) {
            Storage.logActivityEvent({
                memberId: memberId,
                widgetId: 'daily-log',
                action: 'logged',
                details: `Logged ${item.name}: ${value}`,
                meta: { itemId, itemName: item.name, value, date }
            });
        }

        // Refresh widget
        const widgetBody = document.getElementById('widget-daily-log');
        if (widgetBody) {
            renderWidget(widgetBody, memberId);
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }
    }

    /**
     * Show add note modal
     */
    function showAddNoteModal(memberId, widgetData, date, onSaveCallback) {
        const currentNote = widgetData.logs?.[date]?.notes || '';

        const content = `
            <div class="form-group">
                <label class="form-label">Notes for today</label>
                <textarea class="form-input" id="logNote" rows="4" placeholder="How was the day?">${currentNote}</textarea>
            </div>
        `;

        Modal.open({
            title: 'Add Note',
            content,
            footer: Modal.createFooter('Cancel', 'Save')
        });

        Modal.bindFooterEvents(() => {
            const note = document.getElementById('logNote')?.value?.trim();

            const updatedData = {
                ...widgetData,
                logs: {
                    ...widgetData.logs,
                    [date]: {
                        ...widgetData.logs?.[date],
                        notes: note
                    }
                }
            };

            Storage.setWidgetData(memberId, 'daily-log', updatedData);

            // Log to Activity Monitor
            if (note) {
                Storage.logActivityEvent({
                    memberId: memberId,
                    widgetId: 'daily-log',
                    action: 'note',
                    details: `Added daily note`,
                    meta: { date, hasNote: true }
                });
            }

            // Refresh widget
            const widgetBody = document.getElementById('widget-daily-log');
            if (widgetBody) {
                renderWidget(widgetBody, memberId);
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            }

            if (onSaveCallback) onSaveCallback();

            return true;
        });
    }

    // Track current tab in full page view
    let currentFullPageTab = 'today';
    // Track calendar month for history tab
    let calendarMonth = new Date().getMonth();
    let calendarYear = new Date().getFullYear();

    /**
     * Show full page view
     */
    function showFullPage(memberId, activeTab = 'today') {
        const main = document.querySelector('main');
        if (!main) return;

        const member = Storage.getMember(memberId);
        currentFullPageTab = activeTab;
        renderFullPage(main, memberId, member, activeTab);
    }

    /**
     * Render full page with hero + tabs
     */
    function renderFullPage(container, memberId, member, activeTab = 'today') {
        const today = DateUtils.today();
        const storedData = Storage.getWidgetData(memberId, 'daily-log') || {};
        const widgetData = {
            items: storedData.items || DEFAULT_ITEMS,
            logs: storedData.logs || {},
            pottyTrainingEnabled: storedData.pottyTrainingEnabled || false,
            pottyLog: storedData.pottyLog || {}
        };

        const todayLog = widgetData.logs[today] || {};
        const pottyStats = getPottyStats(widgetData);

        // Calculate hero stats
        const moods = ['😢', '😐', '🙂', '😄', '🤩'];
        const todayMood = todayLog.mood !== undefined ? moods[todayLog.mood] : '-';

        // Count items logged today
        const loggedCount = widgetData.items.filter(item => {
            const val = todayLog[item.id];
            return val !== undefined && val !== 0 && val !== '';
        }).length;
        const totalItems = widgetData.items.length;

        // Calculate streak (consecutive days with at least one log entry)
        let streak = 0;
        const checkDate = new Date(today);
        for (let i = 0; i < 365; i++) {
            const dateStr = DateUtils.formatISO(checkDate);
            const dayLog = widgetData.logs[dateStr];
            if (dayLog && Object.keys(dayLog).length > 0) {
                streak++;
            } else if (i > 0) {
                break;
            }
            checkDate.setDate(checkDate.getDate() - 1);
        }

        // KidTheme integration
        const useKidTheme = typeof KidTheme !== 'undefined';
        const ageGroup = useKidTheme ? KidTheme.getAgeGroup(member) : 'kid';
        const isYoungKid = ageGroup === 'kid' || ageGroup === 'toddler';
        const colors = useKidTheme ? KidTheme.getColors('daily-log') : {
            gradient: 'linear-gradient(135deg, #EDE9FE 0%, #E0E7FF 50%, #C7D2FE 100%)',
            dark: '#4338CA'
        };

        // Define tabs
        const tabs = [
            { id: 'today', label: 'Today', icon: 'calendar-check', emoji: '📅' },
            { id: 'history', label: 'History', icon: 'history', emoji: '📋' },
            { id: 'stats', label: 'Stats', icon: 'bar-chart-2', emoji: '📊' }
        ];

        // Render tab content
        let tabContent;
        if (activeTab === 'today') {
            tabContent = renderTodayTab(widgetData, memberId, todayLog, today);
        } else if (activeTab === 'history') {
            tabContent = renderHistoryTab(widgetData);
        } else {
            tabContent = renderStatsTab(widgetData);
        }

        container.innerHTML = `
            <div class="kid-page kid-page--daily-log ${useKidTheme ? KidTheme.getAgeClass(member) : ''}">
                <!-- Hero Section -->
                <div class="kid-page__hero" style="background: ${colors.gradient}; --kid-hero-text: ${colors.dark || '#4338CA'}">
                    <button class="btn btn--ghost kid-page__back" id="backToMemberBtn">
                        <i data-lucide="arrow-left"></i>
                        Back
                    </button>
                    <div class="kid-page__hero-content">
                        <h1 class="kid-page__hero-title ${isYoungKid ? 'kid-page__hero-title--playful' : ''}">
                            ${isYoungKid ? '📋 Daily Log!' : '📋 Daily Log'}
                        </h1>
                        <p class="kid-page__hero-subtitle">${member?.name || ''}'s Daily Tracker</p>
                    </div>
                    <div class="kid-page__hero-stats">
                        <div class="kid-hero-stat">
                            <span class="kid-hero-stat__value">${todayMood}</span>
                            <span class="kid-hero-stat__label">${isYoungKid ? '😊 Mood' : 'Mood'}</span>
                        </div>
                        <div class="kid-hero-stat">
                            <span class="kid-hero-stat__value">${loggedCount}/${totalItems}</span>
                            <span class="kid-hero-stat__label">${isYoungKid ? '✅ Logged' : 'Logged'}</span>
                        </div>
                        <div class="kid-hero-stat">
                            <span class="kid-hero-stat__value">${streak}</span>
                            <span class="kid-hero-stat__label">${isYoungKid ? '🔥 Streak' : 'Day Streak'}</span>
                        </div>
                    </div>
                    <div class="kid-page__hero-actions">
                        <button class="btn btn--sm btn--ghost" id="fullPageSettingsBtn" title="Settings">
                            <i data-lucide="settings"></i>
                            Settings
                        </button>
                    </div>
                </div>

                <!-- Tab Navigation -->
                <div class="kid-page__tabs" style="--tab-color: ${colors.primary}">
                    ${tabs.map(t => `
                        <button class="kid-page__tab ${t.id === activeTab ? 'kid-page__tab--active' : ''}" data-tab="${t.id}">
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

        // Initialize icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Bind events
        bindFullPageEvents(container, memberId, member, widgetData, activeTab);
    }

    /**
     * Render Today tab content
     */
    function renderTodayTab(widgetData, memberId, todayLog, today) {
        const todayPotty = widgetData.pottyLog[today] || { attempts: 0, successes: 0 };
        const pottyStats = getPottyStats(widgetData);

        return `
            <div class="daily-log-today">
                <div class="daily-log-today__date">
                    <i data-lucide="calendar"></i>
                    ${DateUtils.formatShort(today)}
                </div>

                <div class="daily-log-today__items">
                    ${widgetData.items.map(item => renderLogItem(item, todayLog[item.id])).join('')}
                </div>

                ${widgetData.pottyTrainingEnabled ? renderPottySection(todayPotty, pottyStats) : ''}

                <div class="daily-log-today__actions">
                    <button class="btn btn--sm btn--outline" data-action="add-note" data-member-id="${memberId}">
                        <i data-lucide="message-square"></i>
                        Add Note
                    </button>
                </div>

                ${todayLog.notes ? `
                    <div class="daily-log-today__notes">
                        <div class="daily-log-today__notes-label">
                            <i data-lucide="message-square"></i>
                            Today's Notes
                        </div>
                        <p>${todayLog.notes}</p>
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Render History tab content with calendar + detail panel
     */
    function renderHistoryTab(widgetData) {
        const logs = widgetData.logs || {};
        const pottyLog = widgetData.pottyLog || {};
        const pottyEnabled = widgetData.pottyTrainingEnabled || false;

        const allDates = new Set([...Object.keys(logs), ...Object.keys(pottyLog)]);
        const moods = ['😢', '😐', '🙂', '😄', '🤩'];

        // Build calendar grid
        const todayStr = DateUtils.today();
        const nowDate = new Date();
        const isCurrentMonth = calendarMonth === nowDate.getMonth() && calendarYear === nowDate.getFullYear();
        const firstDay = new Date(calendarYear, calendarMonth, 1);
        const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
        const startPadding = firstDay.getDay();
        const monthName = firstDay.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

        // Count logged days this month
        let loggedDaysThisMonth = 0;

        const calendarDays = [];
        for (let i = 0; i < startPadding; i++) {
            calendarDays.push({ empty: true });
        }
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const log = logs[dateStr] || {};
            const potty = pottyLog[dateStr] || {};
            const isToday = dateStr === todayStr;
            const isFuture = dateStr > todayStr;
            const hasLog = allDates.has(dateStr);

            // Determine intensity based on items logged
            let intensity = 0;
            if (hasLog) {
                let count = 0;
                if (log.nap) count++;
                if (log.meal) count++;
                if (log.diaper) count++;
                if (log.activity) count++;
                if (log.mood !== undefined) count++;
                if (log.notes) count++;
                if (potty.attempts > 0) count++;
                intensity = Math.min(4, Math.max(1, count));
                loggedDaysThisMonth++;
            }

            calendarDays.push({
                day,
                dateStr,
                isToday,
                isFuture,
                hasLog,
                intensity,
                mood: log.mood !== undefined ? moods[log.mood] : null
            });
        }

        return `
            <div class="daily-log-calendar-tab">
                <div class="daily-log-calendar">
                    <div class="daily-log-calendar__nav">
                        <button class="daily-log-calendar__nav-btn" id="dlCalPrev">
                            <i data-lucide="chevron-left"></i>
                        </button>
                        <span class="daily-log-calendar__month">${monthName}</span>
                        <button class="daily-log-calendar__nav-btn" id="dlCalNext" ${isCurrentMonth ? 'disabled' : ''}>
                            <i data-lucide="chevron-right"></i>
                        </button>
                    </div>

                    <div class="daily-log-calendar__summary">
                        <span><strong>${loggedDaysThisMonth}</strong> days logged</span>
                    </div>

                    <div class="daily-log-calendar__weekdays">
                        <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
                    </div>
                    <div class="daily-log-calendar__grid">
                        ${calendarDays.map(d => {
                            if (d.empty) return '<div class="daily-log-calendar__day daily-log-calendar__day--empty"></div>';
                            return `
                                <div class="daily-log-calendar__day ${d.isToday ? 'daily-log-calendar__day--today' : ''} ${d.isFuture ? 'daily-log-calendar__day--future' : ''} ${d.hasLog ? `daily-log-calendar__day--level-${d.intensity}` : ''}"
                                     data-date="${d.dateStr}">
                                    <span class="daily-log-calendar__day-num">${d.day}</span>
                                    ${d.mood ? `<span class="daily-log-calendar__day-mood">${d.mood}</span>` : ''}
                                </div>
                            `;
                        }).join('')}
                    </div>

                    <div class="daily-log-calendar__legend">
                        <span class="daily-log-calendar__legend-label">Less</span>
                        <span class="daily-log-calendar__legend-box daily-log-calendar__legend-box--0"></span>
                        <span class="daily-log-calendar__legend-box daily-log-calendar__legend-box--1"></span>
                        <span class="daily-log-calendar__legend-box daily-log-calendar__legend-box--2"></span>
                        <span class="daily-log-calendar__legend-box daily-log-calendar__legend-box--3"></span>
                        <span class="daily-log-calendar__legend-box daily-log-calendar__legend-box--4"></span>
                        <span class="daily-log-calendar__legend-label">More</span>
                    </div>

                    <p class="daily-log-calendar__hint">Tap on a day to see details</p>
                </div>

                <!-- Day detail panel -->
                <div class="daily-log-calendar__details" id="dlCalDetails" style="display: none;">
                    <div class="daily-log-calendar__details-header">
                        <span id="dlCalDetailsDate"></span>
                        <button class="btn btn--icon btn--ghost btn--sm" id="dlCalDetailsClose">
                            <i data-lucide="x"></i>
                        </button>
                    </div>
                    <div class="daily-log-calendar__details-body" id="dlCalDetailsBody"></div>
                </div>
            </div>
        `;
    }

    /**
     * Render detail card for a single day (used by calendar detail panel)
     */
    function renderDayDetailCard(dateStr, widgetData) {
        const logs = widgetData.logs || {};
        const pottyLog = widgetData.pottyLog || {};
        const pottyEnabled = widgetData.pottyTrainingEnabled || false;
        const moods = ['😢', '😐', '🙂', '😄', '🤩'];
        const moodLabels = ['Upset', 'Okay', 'Good', 'Happy', 'Amazing'];

        const log = logs[dateStr] || {};
        const potty = pottyLog[dateStr] || {};
        const hasAnyData = Object.keys(log).length > 0 || potty.attempts > 0;

        if (!hasAnyData) {
            return '<p class="text-muted" style="text-align:center">No log entries for this day</p>';
        }

        const pottyRate = potty.attempts > 0
            ? Math.round((potty.successes / potty.attempts) * 100)
            : null;

        return `
            <div class="daily-log-history__stats">
                ${log.mood !== undefined ? `
                    <div class="daily-log-history__stat">
                        <span style="font-size: 1.2em">${moods[log.mood]}</span>
                        <span>${moodLabels[log.mood]}</span>
                    </div>
                ` : ''}
                ${log.nap ? `
                    <div class="daily-log-history__stat">
                        <i data-lucide="moon"></i>
                        <span>Nap: ${log.nap}</span>
                    </div>
                ` : ''}
                ${log.meal ? `
                    <div class="daily-log-history__stat">
                        <i data-lucide="utensils"></i>
                        <span>${log.meal} meals</span>
                    </div>
                ` : ''}
                ${log.diaper ? `
                    <div class="daily-log-history__stat">
                        <i data-lucide="baby"></i>
                        <span>${log.diaper} diapers</span>
                    </div>
                ` : ''}
                ${log.activity ? `
                    <div class="daily-log-history__stat">
                        <i data-lucide="shapes"></i>
                        <span>${log.activity} activities</span>
                    </div>
                ` : ''}
            </div>

            ${pottyEnabled && (potty.attempts > 0 || potty.successes > 0) ? `
                <div class="daily-log-history__potty" style="margin-top: var(--space-3)">
                    <div class="daily-log-history__potty-header">
                        <i data-lucide="award"></i>
                        <span>Potty Training</span>
                    </div>
                    <div class="daily-log-history__potty-stats">
                        <span class="potty-history-stat">
                            ${potty.successes || 0}/${potty.attempts || 0} successes
                        </span>
                        ${pottyRate !== null ? `
                            <span class="potty-history-rate ${pottyRate >= 50 ? 'potty-history-rate--good' : ''}">
                                ${pottyRate}%
                            </span>
                        ` : ''}
                    </div>
                </div>
            ` : ''}

            ${log.notes ? `
                <div class="daily-log-history__notes" style="margin-top: var(--space-3)">
                    <i data-lucide="message-square"></i>
                    <p>${log.notes}</p>
                </div>
            ` : ''}
        `;
    }

    /**
     * Render Stats tab content
     */
    function renderStatsTab(widgetData) {
        const logs = widgetData.logs || {};
        const pottyLog = widgetData.pottyLog || {};
        const pottyEnabled = widgetData.pottyTrainingEnabled || false;

        const dates = Object.keys(logs).sort();
        const totalDays = dates.length;

        if (totalDays === 0) {
            return `
                <div class="kid-page__empty">
                    <div class="kid-page__empty-icon">📊</div>
                    <p>No stats yet</p>
                    <span class="text-muted">Log some activities to see your stats!</span>
                </div>
            `;
        }

        // Average mood
        const moodEmojis = ['😢', '😐', '🙂', '😄', '🤩'];
        const moodLabels = ['Upset', 'Okay', 'Good', 'Happy', 'Amazing'];
        let moodTotal = 0, moodCount = 0;
        dates.forEach(d => {
            if (logs[d].mood !== undefined) {
                moodTotal += logs[d].mood;
                moodCount++;
            }
        });
        const avgMood = moodCount > 0 ? Math.round(moodTotal / moodCount) : null;
        const avgMoodDisplay = avgMood !== null ? `${moodEmojis[avgMood]} ${moodLabels[avgMood]}` : '-';

        // Average meals per day
        let mealTotal = 0, mealDays = 0;
        dates.forEach(d => {
            if (logs[d].meal) {
                mealTotal += logs[d].meal;
                mealDays++;
            }
        });
        const avgMeals = mealDays > 0 ? (mealTotal / mealDays).toFixed(1) : '-';

        // Average diapers per day
        let diaperTotal = 0, diaperDays = 0;
        dates.forEach(d => {
            if (logs[d].diaper) {
                diaperTotal += logs[d].diaper;
                diaperDays++;
            }
        });
        const avgDiapers = diaperDays > 0 ? (diaperTotal / diaperDays).toFixed(1) : '-';

        // Most common nap time
        const napTimes = {};
        dates.forEach(d => {
            if (logs[d].nap) {
                // Round to nearest half hour for grouping
                const [h, m] = logs[d].nap.split(':').map(Number);
                const rounded = `${String(h).padStart(2, '0')}:${m >= 30 ? '30' : '00'}`;
                napTimes[rounded] = (napTimes[rounded] || 0) + 1;
            }
        });
        const commonNap = Object.keys(napTimes).length > 0
            ? Object.entries(napTimes).sort((a, b) => b[1] - a[1])[0][0]
            : '-';

        // Average activities per day
        let activityTotal = 0, activityDays = 0;
        dates.forEach(d => {
            if (logs[d].activity) {
                activityTotal += logs[d].activity;
                activityDays++;
            }
        });
        const avgActivities = activityDays > 0 ? (activityTotal / activityDays).toFixed(1) : '-';

        // Potty stats
        let pottySection = '';
        if (pottyEnabled) {
            const pottyDates = Object.keys(pottyLog);
            let totalAttempts = 0, totalSuccesses = 0;
            pottyDates.forEach(d => {
                totalAttempts += pottyLog[d].attempts || 0;
                totalSuccesses += pottyLog[d].successes || 0;
            });
            const overallRate = totalAttempts > 0 ? Math.round((totalSuccesses / totalAttempts) * 100) : 0;
            const pottyStats = getPottyStats(widgetData);

            pottySection = `
                <div class="daily-log-stats__section">
                    <h3 class="daily-log-stats__section-title">
                        <i data-lucide="award"></i>
                        Potty Training
                    </h3>
                    <div class="daily-log-stats-grid">
                        <div class="daily-log-stat-card">
                            <span class="daily-log-stat-card__value">${overallRate}%</span>
                            <span class="daily-log-stat-card__label">Overall Success</span>
                        </div>
                        <div class="daily-log-stat-card">
                            <span class="daily-log-stat-card__value">${pottyStats.streak}</span>
                            <span class="daily-log-stat-card__label">Day Streak</span>
                        </div>
                        <div class="daily-log-stat-card">
                            <span class="daily-log-stat-card__value">${totalAttempts}</span>
                            <span class="daily-log-stat-card__label">Total Attempts</span>
                        </div>
                        <div class="daily-log-stat-card">
                            <span class="daily-log-stat-card__value">${totalSuccesses}</span>
                            <span class="daily-log-stat-card__label">Total Successes</span>
                        </div>
                    </div>
                </div>
            `;
        }

        return `
            <div class="daily-log-stats">
                <div class="daily-log-stats__section">
                    <h3 class="daily-log-stats__section-title">
                        <i data-lucide="bar-chart-2"></i>
                        Overview
                    </h3>
                    <div class="daily-log-stats-grid">
                        <div class="daily-log-stat-card">
                            <span class="daily-log-stat-card__value">${totalDays}</span>
                            <span class="daily-log-stat-card__label">Days Tracked</span>
                        </div>
                        <div class="daily-log-stat-card">
                            <span class="daily-log-stat-card__value">${avgMoodDisplay}</span>
                            <span class="daily-log-stat-card__label">Avg Mood</span>
                        </div>
                        <div class="daily-log-stat-card">
                            <span class="daily-log-stat-card__value">${avgMeals}</span>
                            <span class="daily-log-stat-card__label">Avg Meals/Day</span>
                        </div>
                        <div class="daily-log-stat-card">
                            <span class="daily-log-stat-card__value">${avgDiapers}</span>
                            <span class="daily-log-stat-card__label">Avg Diapers/Day</span>
                        </div>
                        <div class="daily-log-stat-card">
                            <span class="daily-log-stat-card__value">${commonNap}</span>
                            <span class="daily-log-stat-card__label">Common Nap Time</span>
                        </div>
                        <div class="daily-log-stat-card">
                            <span class="daily-log-stat-card__value">${avgActivities}</span>
                            <span class="daily-log-stat-card__label">Avg Activities/Day</span>
                        </div>
                    </div>
                </div>

                ${pottySection}
            </div>
        `;
    }

    /**
     * Bind full page events
     */
    function bindFullPageEvents(container, memberId, member, widgetData, activeTab) {
        // Back button
        document.getElementById('backToMemberBtn')?.addEventListener('click', () => {
            State.emit('tabChanged', memberId);
        });

        // Tab switching
        container.querySelectorAll('.kid-page__tab').forEach(tabBtn => {
            tabBtn.addEventListener('click', () => {
                const tabName = tabBtn.dataset.tab;
                if (tabName !== currentFullPageTab) {
                    currentFullPageTab = tabName;
                    renderFullPage(container, memberId, member, tabName);
                }
            });
        });

        // Settings button
        document.getElementById('fullPageSettingsBtn')?.addEventListener('click', async () => {
            const verified = await PIN.verify();
            if (verified) {
                const storedData = Storage.getWidgetData(memberId, 'daily-log') || {};
                const wd = {
                    items: storedData.items || DEFAULT_ITEMS,
                    logs: storedData.logs || {},
                    pottyTrainingEnabled: storedData.pottyTrainingEnabled || false,
                    pottyLog: storedData.pottyLog || {}
                };
                showSettingsModal(memberId, wd, () => {
                    renderFullPage(container, memberId, member, currentFullPageTab);
                });
            }
        });

        // Today tab specific events
        if (activeTab === 'today') {
            bindTodayTabEvents(container, memberId, member, widgetData);
        }

        // History tab specific events (calendar)
        if (activeTab === 'history') {
            bindHistoryCalendarEvents(container, memberId, member, widgetData);
        }
    }

    /**
     * Bind history calendar events (month nav, day clicks)
     */
    function bindHistoryCalendarEvents(container, memberId, member, widgetData) {
        // Month navigation
        document.getElementById('dlCalPrev')?.addEventListener('click', () => {
            calendarMonth--;
            if (calendarMonth < 0) {
                calendarMonth = 11;
                calendarYear--;
            }
            renderFullPage(container, memberId, member, 'history');
        });

        document.getElementById('dlCalNext')?.addEventListener('click', () => {
            const now = new Date();
            if (calendarMonth === now.getMonth() && calendarYear === now.getFullYear()) return;
            calendarMonth++;
            if (calendarMonth > 11) {
                calendarMonth = 0;
                calendarYear++;
            }
            renderFullPage(container, memberId, member, 'history');
        });

        // Day click
        const detailsPanel = container.querySelector('#dlCalDetails');
        const detailsDate = container.querySelector('#dlCalDetailsDate');
        const detailsBody = container.querySelector('#dlCalDetailsBody');

        container.querySelectorAll('.daily-log-calendar__day[data-date]').forEach(dayEl => {
            const dateStr = dayEl.dataset.date;
            if (dayEl.classList.contains('daily-log-calendar__day--future')) return;

            dayEl.style.cursor = 'pointer';
            dayEl.addEventListener('click', () => {
                // Highlight selected day
                container.querySelectorAll('.daily-log-calendar__day--selected').forEach(el => {
                    el.classList.remove('daily-log-calendar__day--selected');
                });
                dayEl.classList.add('daily-log-calendar__day--selected');

                // Format date for display
                const clickedDate = new Date(dateStr + 'T00:00:00');
                const formatted = clickedDate.toLocaleDateString('en-US', {
                    weekday: 'long', month: 'short', day: 'numeric'
                });

                detailsDate.textContent = `📅 ${formatted}`;
                detailsBody.innerHTML = renderDayDetailCard(dateStr, widgetData);
                detailsPanel.style.display = 'block';

                if (typeof lucide !== 'undefined') lucide.createIcons();

                // Scroll detail into view
                detailsPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            });
        });

        // Close details
        document.getElementById('dlCalDetailsClose')?.addEventListener('click', () => {
            detailsPanel.style.display = 'none';
            container.querySelectorAll('.daily-log-calendar__day--selected').forEach(el => {
                el.classList.remove('daily-log-calendar__day--selected');
            });
        });
    }

    /**
     * Bind Today tab events (counters, time, mood, potty, notes)
     */
    function bindTodayTabEvents(container, memberId, member, widgetData) {
        const today = DateUtils.today();
        const todayLog = widgetData.logs?.[today] || {};

        // Counter buttons
        container.querySelectorAll('[data-action="increment"], [data-action="decrement"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const itemId = btn.dataset.item;
                const action = btn.dataset.action;
                const currentValue = todayLog[itemId] || 0;
                const newValue = action === 'increment' ? currentValue + 1 : Math.max(0, currentValue - 1);

                updateLogValueFullPage(memberId, today, itemId, newValue, container, member);
            });
        });

        // Time inputs
        container.querySelectorAll('[data-time-input]').forEach(input => {
            input.addEventListener('change', () => {
                const itemId = input.dataset.timeInput;
                updateLogValueFullPage(memberId, today, itemId, input.value, container, member);
            });
        });

        // Log Now buttons
        container.querySelectorAll('[data-action="log-now"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const itemId = btn.dataset.item;
                const now = new Date();
                const hh = String(now.getHours()).padStart(2, '0');
                const mm = String(now.getMinutes()).padStart(2, '0');
                const timeStr = `${hh}:${mm}`;
                const input = container.querySelector(`[data-time-input="${itemId}"]`);
                if (input) input.value = timeStr;
                updateLogValueFullPage(memberId, today, itemId, timeStr, container, member);
            });
        });

        // Mood buttons
        container.querySelectorAll('.mood-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const itemId = btn.dataset.item;
                const moodValue = parseInt(btn.dataset.mood);
                updateLogValueFullPage(memberId, today, itemId, moodValue, container, member);
            });
        });

        // Potty training counters
        container.querySelectorAll('[data-potty-action]').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.pottyAction;
                const todayPotty = widgetData.pottyLog?.[today] || { attempts: 0, successes: 0 };

                let newAttempts = todayPotty.attempts || 0;
                let newSuccesses = todayPotty.successes || 0;

                if (action === 'increment-attempts') {
                    newAttempts++;
                } else if (action === 'decrement-attempts') {
                    newAttempts = Math.max(0, newAttempts - 1);
                    newSuccesses = Math.min(newSuccesses, newAttempts);
                } else if (action === 'increment-successes') {
                    if (newSuccesses >= newAttempts) {
                        newAttempts++;
                    }
                    newSuccesses++;
                } else if (action === 'decrement-successes') {
                    newSuccesses = Math.max(0, newSuccesses - 1);
                }

                updatePottyValueFullPage(memberId, today, newAttempts, newSuccesses, container, member);
            });
        });

        // Add note
        container.querySelector('[data-action="add-note"]')?.addEventListener('click', () => {
            const storedData = Storage.getWidgetData(memberId, 'daily-log') || {};
            const wd = {
                items: storedData.items || DEFAULT_ITEMS,
                logs: storedData.logs || {},
                pottyTrainingEnabled: storedData.pottyTrainingEnabled || false,
                pottyLog: storedData.pottyLog || {}
            };
            showAddNoteModal(memberId, wd, today, () => {
                renderFullPage(container, memberId, member, currentFullPageTab);
            });
        });
    }

    /**
     * Update log value from full page (refreshes full page instead of widget)
     */
    function updateLogValueFullPage(memberId, date, itemId, value, container, member) {
        const storedData = Storage.getWidgetData(memberId, 'daily-log') || {};
        const updatedData = {
            ...storedData,
            items: storedData.items || DEFAULT_ITEMS,
            logs: {
                ...storedData.logs,
                [date]: {
                    ...(storedData.logs || {})[date],
                    [itemId]: value
                }
            }
        };

        Storage.setWidgetData(memberId, 'daily-log', updatedData);

        // Re-render full page
        renderFullPage(container, memberId, member, currentFullPageTab);
    }

    /**
     * Update potty value from full page
     */
    function updatePottyValueFullPage(memberId, date, attempts, successes, container, member) {
        const storedData = Storage.getWidgetData(memberId, 'daily-log') || {};
        const updatedData = {
            ...storedData,
            items: storedData.items || DEFAULT_ITEMS,
            pottyLog: {
                ...storedData.pottyLog,
                [date]: { attempts, successes }
            }
        };

        Storage.setWidgetData(memberId, 'daily-log', updatedData);

        // Re-render full page
        renderFullPage(container, memberId, member, currentFullPageTab);
    }

    /**
     * Show history modal (legacy - redirects to full page)
     */
    function showHistoryModal(memberId) {
        showFullPage(memberId, 'history');
    }

    function init() {
        // Initialize daily log feature
    }

    return {
        init,
        renderWidget,
        showFullPage
    };
})();
