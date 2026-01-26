/**
 * Caregiver Handoff Notes Widget
 * Quick daily summaries for caregiver transitions
 */

const CaregiverHandoff = (function() {
    const MOODS = ['😢', '😐', '🙂', '😄', '🤩'];
    const MOOD_LABELS = ['Upset', 'Okay', 'Good', 'Happy', 'Amazing'];

    /**
     * Get widget data with defaults
     */
    function getWidgetData(memberId) {
        const stored = Storage.getWidgetData(memberId, 'caregiver-handoff') || {};
        return {
            summaries: stored.summaries || {},
            ...stored
        };
    }

    /**
     * Get today's summary, auto-pulling from Daily Log if available
     */
    function getTodaySummary(memberId) {
        const data = getWidgetData(memberId);
        const today = DateUtils.today();
        const existing = data.summaries[today] || {};

        // Auto-pull from Daily Log if not manually set
        const dailyLogData = Storage.getWidgetData(memberId, 'daily-log') || {};
        const dailyLog = dailyLogData.logs?.[today] || {};

        return {
            mood: existing.mood ?? dailyLog.mood ?? 2,
            mealsCount: existing.mealsCount ?? dailyLog.meal ?? 0,
            napInfo: existing.napInfo ?? (dailyLog.nap || ''),
            lastDiaper: existing.lastDiaper ?? '',
            notes: existing.notes ?? '',
            important: existing.important ?? false,
            updatedAt: existing.updatedAt ?? null
        };
    }

    /**
     * Save today's summary
     */
    function saveSummary(memberId, summary) {
        const data = getWidgetData(memberId);
        const today = DateUtils.today();

        data.summaries[today] = {
            ...summary,
            updatedAt: new Date().toISOString()
        };

        // Keep only last 30 days
        const dates = Object.keys(data.summaries).sort().reverse();
        if (dates.length > 30) {
            dates.slice(30).forEach(date => {
                delete data.summaries[date];
            });
        }

        Storage.setWidgetData(memberId, 'caregiver-handoff', data);
    }

    /**
     * Render the widget
     */
    function renderWidget(container, memberId) {
        const summary = getTodaySummary(memberId);
        const today = DateUtils.today();

        const lastUpdated = summary.updatedAt
            ? formatTimeAgo(new Date(summary.updatedAt))
            : 'Not updated yet';

        container.innerHTML = `
            <div class="handoff-widget ${summary.important ? 'handoff-widget--important' : ''}">
                <div class="handoff-widget__header">
                    <span class="handoff-widget__date">${DateUtils.formatShort(today)}</span>
                    <button class="handoff-widget__important-btn ${summary.important ? 'handoff-widget__important-btn--active' : ''}"
                            data-action="toggle-important"
                            title="${summary.important ? 'Remove important flag' : 'Mark as important'}">
                        <i data-lucide="${summary.important ? 'flag' : 'flag-off'}"></i>
                    </button>
                </div>

                <div class="handoff-summary">
                    <div class="handoff-summary__row">
                        <div class="handoff-summary__item">
                            <span class="handoff-summary__label">Mood</span>
                            <div class="handoff-mood-picker">
                                ${MOODS.map((emoji, i) => `
                                    <button class="handoff-mood-btn ${i === summary.mood ? 'handoff-mood-btn--active' : ''}"
                                            data-mood="${i}" title="${MOOD_LABELS[i]}">
                                        ${emoji}
                                    </button>
                                `).join('')}
                            </div>
                        </div>
                    </div>

                    <div class="handoff-summary__row handoff-summary__row--grid">
                        <div class="handoff-summary__item">
                            <span class="handoff-summary__label">Meals</span>
                            <div class="handoff-counter">
                                <button class="handoff-counter__btn" data-action="decrement-meals">-</button>
                                <span class="handoff-counter__value">${summary.mealsCount}</span>
                                <button class="handoff-counter__btn" data-action="increment-meals">+</button>
                            </div>
                        </div>

                        <div class="handoff-summary__item">
                            <span class="handoff-summary__label">Nap</span>
                            <input type="text" class="handoff-input" placeholder="e.g., 2hrs at 1pm"
                                   data-field="napInfo" value="${summary.napInfo}">
                        </div>
                    </div>

                    <div class="handoff-summary__row">
                        <div class="handoff-summary__item">
                            <span class="handoff-summary__label">Last Diaper</span>
                            <input type="text" class="handoff-input" placeholder="e.g., 3:30 PM"
                                   data-field="lastDiaper" value="${summary.lastDiaper}">
                        </div>
                    </div>

                    <div class="handoff-summary__row">
                        <div class="handoff-summary__item handoff-summary__item--full">
                            <span class="handoff-summary__label">Quick Notes</span>
                            <textarea class="handoff-textarea" placeholder="How was the day? Anything to share?"
                                      data-field="notes" rows="2">${summary.notes}</textarea>
                        </div>
                    </div>
                </div>

                <div class="handoff-widget__footer">
                    <span class="handoff-widget__updated">
                        <i data-lucide="clock"></i>
                        ${lastUpdated}
                    </span>
                    <button class="btn btn--sm btn--ghost" data-action="history">
                        <i data-lucide="history"></i>
                        History
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
     * Format time ago string
     */
    function formatTimeAgo(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return DateUtils.formatShort(date.toISOString().split('T')[0]);
    }

    /**
     * Bind widget events
     */
    function bindWidgetEvents(container, memberId) {
        // Mood buttons
        container.querySelectorAll('.handoff-mood-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const mood = parseInt(btn.dataset.mood);
                const summary = getTodaySummary(memberId);
                summary.mood = mood;
                saveSummary(memberId, summary);
                renderWidget(container, memberId);
            });
        });

        // Meal counter
        container.querySelector('[data-action="increment-meals"]')?.addEventListener('click', () => {
            const summary = getTodaySummary(memberId);
            summary.mealsCount++;
            saveSummary(memberId, summary);
            renderWidget(container, memberId);
        });

        container.querySelector('[data-action="decrement-meals"]')?.addEventListener('click', () => {
            const summary = getTodaySummary(memberId);
            summary.mealsCount = Math.max(0, summary.mealsCount - 1);
            saveSummary(memberId, summary);
            renderWidget(container, memberId);
        });

        // Text inputs (save on change)
        container.querySelectorAll('[data-field]').forEach(input => {
            input.addEventListener('change', () => {
                const field = input.dataset.field;
                const summary = getTodaySummary(memberId);
                summary[field] = input.value;
                saveSummary(memberId, summary);
            });
        });

        // Important toggle
        container.querySelector('[data-action="toggle-important"]')?.addEventListener('click', () => {
            const summary = getTodaySummary(memberId);
            summary.important = !summary.important;
            saveSummary(memberId, summary);
            renderWidget(container, memberId);
        });

        // History button
        container.querySelector('[data-action="history"]')?.addEventListener('click', () => {
            showFullPage(memberId);
        });
    }

    /**
     * Show full page history
     */
    function showFullPage(memberId) {
        const main = document.querySelector('main');
        if (!main) return;

        const member = Storage.getMember(memberId);
        const data = getWidgetData(memberId);
        const summaries = data.summaries || {};
        const dates = Object.keys(summaries).sort().reverse().slice(0, 7);

        main.innerHTML = `
            <div class="full-page">
                <div class="full-page__header">
                    <button class="btn btn--ghost" id="backBtn">
                        <i data-lucide="arrow-left"></i>
                        Back
                    </button>
                    <h1 class="full-page__title">Handoff History</h1>
                    <div class="full-page__actions"></div>
                </div>

                <div class="full-page__content">
                    ${dates.length === 0 ? `
                        <div class="empty-state">
                            <i data-lucide="clipboard"></i>
                            <p>No handoff notes yet</p>
                            <span class="text-muted">Start logging daily summaries!</span>
                        </div>
                    ` : `
                        <div class="handoff-history">
                            ${dates.map(date => {
                                const summary = summaries[date];
                                const isToday = date === DateUtils.today();
                                return `
                                    <div class="handoff-history__card ${isToday ? 'handoff-history__card--today' : ''} ${summary.important ? 'handoff-history__card--important' : ''}">
                                        <div class="handoff-history__header">
                                            <span class="handoff-history__date">
                                                ${isToday ? 'Today' : DateUtils.formatShort(date)}
                                            </span>
                                            <div class="handoff-history__badges">
                                                ${summary.important ? '<span class="handoff-history__important"><i data-lucide="flag"></i></span>' : ''}
                                                <span class="handoff-history__mood">${MOODS[summary.mood || 2]}</span>
                                            </div>
                                        </div>

                                        <div class="handoff-history__stats">
                                            ${summary.mealsCount ? `
                                                <div class="handoff-history__stat">
                                                    <i data-lucide="utensils"></i>
                                                    <span>${summary.mealsCount} meals</span>
                                                </div>
                                            ` : ''}
                                            ${summary.napInfo ? `
                                                <div class="handoff-history__stat">
                                                    <i data-lucide="moon"></i>
                                                    <span>Nap: ${summary.napInfo}</span>
                                                </div>
                                            ` : ''}
                                            ${summary.lastDiaper ? `
                                                <div class="handoff-history__stat">
                                                    <i data-lucide="baby"></i>
                                                    <span>Diaper: ${summary.lastDiaper}</span>
                                                </div>
                                            ` : ''}
                                        </div>

                                        ${summary.notes ? `
                                            <div class="handoff-history__notes">
                                                <p>${summary.notes}</p>
                                            </div>
                                        ` : ''}

                                        ${summary.updatedAt ? `
                                            <div class="handoff-history__time">
                                                Updated ${new Date(summary.updatedAt).toLocaleTimeString('en-US', {
                                                    hour: 'numeric',
                                                    minute: '2-digit'
                                                })}
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
     * Initialize
     */
    function init() {
        // Caregiver handoff feature initialized
    }

    return {
        init,
        renderWidget,
        showFullPage
    };
})();
