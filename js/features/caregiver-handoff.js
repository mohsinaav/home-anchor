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
                    <div class="handoff-widget__actions">
                        <button class="btn btn--sm btn--ghost" data-action="share" title="Share with caregiver">
                            <i data-lucide="share-2"></i>
                        </button>
                        <button class="btn btn--sm btn--ghost" data-action="history">
                            <i data-lucide="history"></i>
                            History
                        </button>
                    </div>
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

        // Share button
        container.querySelector('[data-action="share"]')?.addEventListener('click', () => {
            showShareModal(memberId);
        });

        // History button
        container.querySelector('[data-action="history"]')?.addEventListener('click', () => {
            showFullPage(memberId);
        });
    }

    /**
     * Show full page with tabs
     */
    function showFullPage(memberId, activeTab = 'today') {
        const main = document.querySelector('main');
        if (!main) return;

        const member = Storage.getMember(memberId);
        renderFullPage(main, memberId, member, activeTab);
    }

    /**
     * Render full page
     */
    function renderFullPage(container, memberId, member, activeTab = 'today') {
        const data = getWidgetData(memberId);
        const summaries = data.summaries || {};
        const today = DateUtils.today();
        const todaySummary = getTodaySummary(memberId);

        // Calculate stats
        const totalDays = Object.keys(summaries).length;
        const importantCount = Object.values(summaries).filter(s => s.important).length;
        const lastUpdated = todaySummary.updatedAt
            ? formatTimeAgo(new Date(todaySummary.updatedAt))
            : 'Not updated';

        // Define tabs
        const tabs = [
            { id: 'today', label: 'Today', icon: 'calendar-check', emoji: '📋' },
            { id: 'history', label: 'History', icon: 'history', emoji: '📅' }
        ];

        // Render tab content
        let tabContent;
        if (activeTab === 'today') {
            tabContent = renderTodayTab(memberId, todaySummary);
        } else {
            tabContent = renderHistoryTab(summaries);
        }

        const useKidTheme = typeof KidTheme !== 'undefined';
        const colors = useKidTheme ? KidTheme.getColors('caregiver-handoff') : {
            gradient: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 50%, #FBBF24 100%)',
            dark: '#92400E'
        };

        container.innerHTML = `
            <div class="kid-page kid-page--handoff ${useKidTheme ? KidTheme.getAgeClass(member) : ''}">
                <!-- Hero Section -->
                <div class="kid-page__hero" style="background: ${colors.gradient}; --kid-hero-text: ${colors.dark || '#92400E'}">
                    <div class="kid-page__hero-actions">
                        <button class="btn btn--ghost kid-page__back" id="backToMemberBtn">
                            <i data-lucide="arrow-left"></i>
                            Back
                        </button>
                        <button class="btn btn--ghost" id="shareHandoffBtn" title="Share with caregiver">
                            <i data-lucide="share-2"></i>
                            Share
                        </button>
                    </div>
                    <div class="kid-page__hero-content">
                        <h1 class="kid-page__hero-title">
                            📋 Caregiver Handoff
                        </h1>
                        <p class="kid-page__hero-subtitle">${member?.name || ''}'s Daily Summary</p>
                    </div>
                    <div class="kid-page__hero-stats">
                        <div class="kid-hero-stat">
                            <span class="kid-hero-stat__value">${MOODS[todaySummary.mood]}</span>
                            <span class="kid-hero-stat__label">Today's Mood</span>
                        </div>
                        <div class="kid-hero-stat">
                            <span class="kid-hero-stat__value">${totalDays}</span>
                            <span class="kid-hero-stat__label">Days Logged</span>
                        </div>
                        <div class="kid-hero-stat">
                            <span class="kid-hero-stat__value">${importantCount}</span>
                            <span class="kid-hero-stat__label">Important</span>
                        </div>
                    </div>
                </div>

                <!-- Tab Navigation -->
                <div class="kid-page__tabs" style="--tab-color: ${colors.primary}">
                    ${tabs.map(t => `
                        <button class="kid-page__tab ${t.id === activeTab ? 'kid-page__tab--active' : ''}" data-tab="${t.id}">
                            <span class="emoji-icon">${t.emoji}</span>
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
        bindFullPageEvents(container, memberId, member, activeTab);
    }

    /**
     * Render Today tab
     */
    function renderTodayTab(memberId, summary) {
        const today = DateUtils.today();
        const lastUpdated = summary.updatedAt
            ? `Updated ${new Date(summary.updatedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
            : 'Not updated yet';

        return `
            <div class="handoff-today-tab">
                <div class="handoff-today-card ${summary.important ? 'handoff-today-card--important' : ''}">
                    <div class="handoff-today-header">
                        <h3>${DateUtils.formatShort(today)}</h3>
                        <button class="btn btn--sm ${summary.important ? 'btn--danger' : 'btn--ghost'}"
                                data-action="toggle-important"
                                title="${summary.important ? 'Remove flag' : 'Mark important'}">
                            <i data-lucide="flag"></i>
                            ${summary.important ? 'Important' : 'Flag'}
                        </button>
                    </div>

                    <div class="handoff-today-section">
                        <label class="handoff-today-label">Mood</label>
                        <div class="handoff-mood-picker handoff-mood-picker--large">
                            ${MOODS.map((emoji, i) => `
                                <button class="handoff-mood-btn handoff-mood-btn--large ${i === summary.mood ? 'handoff-mood-btn--active' : ''}"
                                        data-mood="${i}" title="${MOOD_LABELS[i]}">
                                    ${emoji}
                                </button>
                            `).join('')}
                        </div>
                    </div>

                    <div class="handoff-today-grid">
                        <div class="handoff-today-section">
                            <label class="handoff-today-label">
                                <i data-lucide="utensils"></i>
                                Meals Today
                            </label>
                            <div class="handoff-counter handoff-counter--large">
                                <button class="handoff-counter__btn" data-action="decrement-meals">-</button>
                                <span class="handoff-counter__value">${summary.mealsCount}</span>
                                <button class="handoff-counter__btn" data-action="increment-meals">+</button>
                            </div>
                        </div>

                        <div class="handoff-today-section">
                            <label class="handoff-today-label">
                                <i data-lucide="moon"></i>
                                Nap Info
                            </label>
                            <input type="text" class="form-input" placeholder="e.g., 2hrs at 1pm"
                                   data-field="napInfo" value="${summary.napInfo}">
                        </div>

                        <div class="handoff-today-section">
                            <label class="handoff-today-label">
                                <i data-lucide="baby"></i>
                                Last Diaper
                            </label>
                            <input type="text" class="form-input" placeholder="e.g., 3:30 PM wet"
                                   data-field="lastDiaper" value="${summary.lastDiaper}">
                        </div>
                    </div>

                    <div class="handoff-today-section">
                        <label class="handoff-today-label">
                            <i data-lucide="message-square"></i>
                            Notes for Next Caregiver
                        </label>
                        <textarea class="form-input handoff-notes-input"
                                  placeholder="How was the day? Anything important to share?"
                                  data-field="notes" rows="4">${summary.notes}</textarea>
                    </div>

                    <div class="handoff-today-footer">
                        <span class="handoff-today-updated">
                            <i data-lucide="clock"></i>
                            ${lastUpdated}
                        </span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render History tab
     */
    function renderHistoryTab(summaries) {
        const dates = Object.keys(summaries).sort().reverse().slice(0, 14);
        const today = DateUtils.today();

        if (dates.length === 0) {
            return `
                <div class="empty-state">
                    <i data-lucide="clipboard"></i>
                    <p>No handoff notes yet</p>
                    <span class="text-muted">Start logging daily summaries!</span>
                </div>
            `;
        }

        return `
            <div class="handoff-history-tab">
                <div class="handoff-history-list">
                    ${dates.map(date => {
                        const summary = summaries[date];
                        const isToday = date === today;
                        return `
                            <div class="handoff-history-card ${isToday ? 'handoff-history-card--today' : ''} ${summary.important ? 'handoff-history-card--important' : ''}">
                                <div class="handoff-history-card__header">
                                    <div class="handoff-history-card__date">
                                        <span class="handoff-history-card__day">${isToday ? 'Today' : DateUtils.formatShort(date)}</span>
                                        ${summary.important ? '<i data-lucide="flag" class="handoff-history-card__flag"></i>' : ''}
                                    </div>
                                    <span class="handoff-history-card__mood">${MOODS[summary.mood || 2]}</span>
                                </div>

                                <div class="handoff-history-card__stats">
                                    ${summary.mealsCount ? `
                                        <div class="handoff-history-stat">
                                            <i data-lucide="utensils"></i>
                                            <span>${summary.mealsCount} meals</span>
                                        </div>
                                    ` : ''}
                                    ${summary.napInfo ? `
                                        <div class="handoff-history-stat">
                                            <i data-lucide="moon"></i>
                                            <span>Nap: ${summary.napInfo}</span>
                                        </div>
                                    ` : ''}
                                    ${summary.lastDiaper ? `
                                        <div class="handoff-history-stat">
                                            <i data-lucide="baby"></i>
                                            <span>Diaper: ${summary.lastDiaper}</span>
                                        </div>
                                    ` : ''}
                                </div>

                                ${summary.notes ? `
                                    <div class="handoff-history-card__notes">
                                        <p>${summary.notes}</p>
                                    </div>
                                ` : ''}

                                ${summary.updatedAt ? `
                                    <div class="handoff-history-card__time">
                                        <i data-lucide="clock"></i>
                                        ${new Date(summary.updatedAt).toLocaleTimeString('en-US', {
                                            hour: 'numeric',
                                            minute: '2-digit'
                                        })}
                                    </div>
                                ` : ''}
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Bind full page events
     */
    function bindFullPageEvents(container, memberId, member, activeTab) {
        // Back button
        document.getElementById('backToMemberBtn')?.addEventListener('click', () => {
            State.emit('tabChanged', memberId);
        });

        // Share button
        document.getElementById('shareHandoffBtn')?.addEventListener('click', () => {
            showShareModal(memberId);
        });

        // Tab switching
        container.querySelectorAll('[data-tab]').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                renderFullPage(container, memberId, member, tab);
            });
        });

        // Only bind these if on Today tab
        if (activeTab === 'today') {
            // Mood buttons
            container.querySelectorAll('.handoff-mood-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const mood = parseInt(btn.dataset.mood);
                    const summary = getTodaySummary(memberId);
                    summary.mood = mood;
                    saveSummary(memberId, summary);
                    renderFullPage(container, memberId, member, 'today');
                });
            });

            // Meal counter
            container.querySelector('[data-action="increment-meals"]')?.addEventListener('click', () => {
                const summary = getTodaySummary(memberId);
                summary.mealsCount++;
                saveSummary(memberId, summary);
                renderFullPage(container, memberId, member, 'today');
            });

            container.querySelector('[data-action="decrement-meals"]')?.addEventListener('click', () => {
                const summary = getTodaySummary(memberId);
                summary.mealsCount = Math.max(0, summary.mealsCount - 1);
                saveSummary(memberId, summary);
                renderFullPage(container, memberId, member, 'today');
            });

            // Text inputs
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
                renderFullPage(container, memberId, member, 'today');
            });
        }
    }

    /**
     * Generate shareable text summary
     */
    function generateShareText(memberId) {
        const member = Storage.getMember(memberId);
        const summary = getTodaySummary(memberId);
        const today = DateUtils.today();
        const formattedDate = DateUtils.formatShort(today);

        let text = `📋 Handoff for ${member?.name || 'Child'} - ${formattedDate}\n\n`;
        text += `${MOODS[summary.mood]} Mood: ${MOOD_LABELS[summary.mood]}\n`;

        if (summary.mealsCount > 0) {
            text += `🍽️ Meals: ${summary.mealsCount}\n`;
        }
        if (summary.napInfo) {
            text += `😴 Nap: ${summary.napInfo}\n`;
        }
        if (summary.lastDiaper) {
            text += `🧷 Last Diaper: ${summary.lastDiaper}\n`;
        }
        if (summary.notes) {
            text += `\n📝 Notes:\n${summary.notes}\n`;
        }
        if (summary.important) {
            text += `\n⚠️ Marked as Important\n`;
        }
        if (summary.updatedAt) {
            const time = new Date(summary.updatedAt).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit'
            });
            text += `\n🕐 Last updated: ${time}`;
        }

        return text;
    }

    /**
     * Generate share data for URL encoding
     */
    function generateShareData(memberId) {
        const member = Storage.getMember(memberId);
        const summary = getTodaySummary(memberId);
        const today = DateUtils.today();

        return {
            n: member?.name || 'Child',  // name
            d: today,                     // date
            m: summary.mood,              // mood
            mc: summary.mealsCount,       // meals count
            np: summary.napInfo,          // nap
            dp: summary.lastDiaper,       // diaper
            nt: summary.notes,            // notes
            im: summary.important,        // important
            ut: summary.updatedAt         // updated at
        };
    }

    /**
     * Generate shareable link
     */
    function generateShareLink(memberId) {
        const data = generateShareData(memberId);
        const encoded = btoa(encodeURIComponent(JSON.stringify(data)));
        const baseUrl = window.location.origin + window.location.pathname.replace(/\/[^\/]*$/, '/');
        return `${baseUrl}handoff-view.html?data=${encoded}`;
    }

    /**
     * Show share modal
     */
    function showShareModal(memberId) {
        const member = Storage.getMember(memberId);
        const shareText = generateShareText(memberId);
        const shareLink = generateShareLink(memberId);

        const content = `
            <div class="handoff-share-modal">
                <p class="handoff-share-modal__intro">
                    Share ${member?.name || 'child'}'s handoff summary securely. The caregiver will see a read-only view - no access to your Home Anchor data.
                </p>

                <div class="handoff-share-option">
                    <div class="handoff-share-option__header">
                        <i data-lucide="message-square"></i>
                        <span>Copy as Text</span>
                    </div>
                    <p class="handoff-share-option__desc">Perfect for texting or messaging apps</p>
                    <div class="handoff-share-preview">
                        <pre>${shareText}</pre>
                    </div>
                    <button class="btn btn--primary btn--block" id="copyTextBtn">
                        <i data-lucide="copy"></i>
                        Copy Text
                    </button>
                </div>

                <div class="handoff-share-option">
                    <div class="handoff-share-option__header">
                        <i data-lucide="link"></i>
                        <span>Copy Share Link</span>
                    </div>
                    <p class="handoff-share-option__desc">Opens a read-only page (no app access)</p>
                    <div class="handoff-share-link">
                        <input type="text" class="form-input" value="${shareLink}" readonly id="shareLinkInput">
                    </div>
                    <button class="btn btn--secondary btn--block" id="copyLinkBtn">
                        <i data-lucide="link"></i>
                        Copy Link
                    </button>
                </div>

                ${navigator.share ? `
                    <div class="handoff-share-option handoff-share-option--native">
                        <button class="btn btn--ghost btn--block" id="nativeShareBtn">
                            <i data-lucide="share-2"></i>
                            Share via...
                        </button>
                    </div>
                ` : ''}
            </div>
        `;

        Modal.open({
            title: '📤 Share Handoff Summary',
            content,
            size: 'default',
            footer: null
        });

        // Initialize icons
        if (typeof lucide !== 'undefined') {
            setTimeout(() => lucide.createIcons(), 50);
        }

        // Copy text button
        document.getElementById('copyTextBtn')?.addEventListener('click', () => {
            navigator.clipboard.writeText(shareText).then(() => {
                Toast.success('Text copied to clipboard!');
                Modal.close();
            }).catch(() => {
                Toast.error('Failed to copy');
            });
        });

        // Copy link button
        document.getElementById('copyLinkBtn')?.addEventListener('click', () => {
            const input = document.getElementById('shareLinkInput');
            navigator.clipboard.writeText(shareLink).then(() => {
                Toast.success('Link copied to clipboard!');
                Modal.close();
            }).catch(() => {
                // Fallback: select input text
                input?.select();
                document.execCommand('copy');
                Toast.success('Link copied!');
                Modal.close();
            });
        });

        // Native share (mobile)
        document.getElementById('nativeShareBtn')?.addEventListener('click', () => {
            if (navigator.share) {
                navigator.share({
                    title: `Handoff for ${member?.name || 'Child'}`,
                    text: shareText,
                    url: shareLink
                }).then(() => {
                    Modal.close();
                }).catch(() => {
                    // User cancelled - do nothing
                });
            }
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
        showFullPage,
        showShareModal
    };
})();
