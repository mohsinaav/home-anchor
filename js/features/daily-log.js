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
     * Render the daily log widget for a member
     */
    function renderWidget(container, memberId) {
        const today = DateUtils.today();
        const storedData = Storage.getWidgetData(memberId, 'daily-log') || {};
        const widgetData = {
            items: storedData.items || DEFAULT_ITEMS,
            logs: storedData.logs || {}
        };

        const todayLog = widgetData.logs[today] || {};

        container.innerHTML = `
            <div class="daily-log-widget">
                <div class="daily-log-widget__header">
                    <span class="daily-log-widget__date">${DateUtils.formatShort(today)}</span>
                </div>

                <div class="daily-log-widget__items">
                    ${widgetData.items.map(item => renderLogItem(item, todayLog[item.id])).join('')}
                </div>

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
                        <input type="time" class="log-item__time" data-time-input="${item.id}" value="${value || ''}">
                    </div>
                `;

            case 'mood':
                const moods = ['😢', '😐', '🙂', '😄', '🤩'];
                const currentMood = value || 2;
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

        // Mood buttons
        container.querySelectorAll('.mood-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const itemId = btn.dataset.item;
                const moodValue = parseInt(btn.dataset.mood);
                updateLogValue(memberId, widgetData, today, itemId, moodValue);
            });
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
    function showAddNoteModal(memberId, widgetData, date) {
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

            // Refresh widget
            const widgetBody = document.getElementById('widget-daily-log');
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
     * Show full page history
     */
    function showFullPage(memberId) {
        const main = document.querySelector('main');
        if (!main) return;

        const member = Storage.getMember(memberId);
        const widgetData = Storage.getWidgetData(memberId, 'daily-log') || { items: DEFAULT_ITEMS, logs: {} };
        const logs = widgetData.logs || {};
        const dates = Object.keys(logs).sort().reverse();

        const moods = ['😢', '😐', '🙂', '😄', '🤩'];
        const moodLabels = ['Upset', 'Okay', 'Good', 'Happy', 'Amazing'];

        main.innerHTML = `
            <div class="full-page">
                <div class="full-page__header">
                    <button class="btn btn--ghost" id="backBtn">
                        <i data-lucide="arrow-left"></i>
                        Back
                    </button>
                    <h1 class="full-page__title">${member?.name || 'Daily'} Log History</h1>
                    <div class="full-page__actions"></div>
                </div>

                <div class="full-page__content">
                    ${dates.length === 0 ? `
                        <div class="empty-state">
                            <i data-lucide="calendar-x"></i>
                            <p>No log entries yet</p>
                            <span class="text-muted">Start logging today's activities!</span>
                        </div>
                    ` : `
                        <div class="daily-log-history">
                            ${dates.map(date => {
                                const log = logs[date];
                                const isToday = date === DateUtils.today();
                                return `
                                    <div class="daily-log-history__card ${isToday ? 'daily-log-history__card--today' : ''}">
                                        <div class="daily-log-history__header">
                                            <span class="daily-log-history__date">
                                                ${isToday ? 'Today' : DateUtils.formatShort(date)}
                                            </span>
                                            ${log.mood !== undefined ? `
                                                <span class="daily-log-history__mood" title="${moodLabels[log.mood]}">
                                                    ${moods[log.mood]}
                                                </span>
                                            ` : ''}
                                        </div>

                                        <div class="daily-log-history__stats">
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

                                        ${log.notes ? `
                                            <div class="daily-log-history__notes">
                                                <i data-lucide="message-square"></i>
                                                <p>${log.notes}</p>
                                            </div>
                                        ` : ''}
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    `}
                </div>
            </div>
        `;

        // Initialize icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Bind back button
        document.getElementById('backBtn')?.addEventListener('click', () => {
            State.emit('tabChanged', memberId);
        });
    }

    /**
     * Show history modal (legacy - redirects to full page)
     */
    function showHistoryModal(memberId) {
        showFullPage(memberId);
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
