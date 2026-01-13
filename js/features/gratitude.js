/**
 * Gratitude Feature
 * Daily gratitude journal for adults with weekly view
 *
 * NOTE: This widget now reads/writes gratitude data from the Journal widget.
 * Journal is the single source of truth for gratitude data.
 * Gratitude widget is PUBLIC (no PIN), Journal widget is PRIVATE (PIN protected).
 */

const Gratitude = (function() {
    // Prompts to inspire gratitude entries
    const PROMPTS = [
        "What made you smile today?",
        "Who are you grateful for today?",
        "What's something small that brought you joy?",
        "What's a challenge that helped you grow?",
        "What's something beautiful you noticed today?",
        "What made today better than yesterday?",
        "What's something you're looking forward to?",
        "What's a simple pleasure you enjoyed today?",
        "Who made a positive difference in your day?",
        "What's something you accomplished today?"
    ];

    // Day colors for the weekly view (theme-friendly pastels)
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
     * Get gratitude entries from Journal widget (single source of truth)
     * This is the PUBLIC interface - no PIN required
     */
    function getGratitudeEntries(memberId) {
        // Try to get from Journal first (new unified approach)
        if (typeof Journal !== 'undefined' && Journal.getGratitudeEntries) {
            return Journal.getGratitudeEntries(memberId);
        }
        // Fallback to legacy gratitude data for backwards compatibility
        const stored = Storage.getWidgetData(memberId, 'gratitude');
        return stored?.entries || [];
    }

    /**
     * Get today's gratitude items from Journal
     */
    function getTodayGratitude(memberId) {
        if (typeof Journal !== 'undefined' && Journal.getTodayGratitude) {
            return Journal.getTodayGratitude(memberId);
        }
        // Fallback to legacy
        const entries = getGratitudeEntries(memberId);
        const today = DateUtils.today();
        const todayEntry = entries.find(e => e.date === today);
        return todayEntry?.items || [];
    }

    /**
     * Get weekly goal (stored separately in gratitude widget data)
     */
    function getWeeklyGoal(memberId) {
        const stored = Storage.getWidgetData(memberId, 'gratitude');
        return stored?.weeklyGoal || 5;
    }

    /**
     * Save weekly goal
     */
    function saveWeeklyGoal(memberId, goal) {
        const stored = Storage.getWidgetData(memberId, 'gratitude') || {};
        Storage.setWidgetData(memberId, 'gratitude', {
            ...stored,
            weeklyGoal: goal
        });
    }

    /**
     * Get a random prompt
     */
    function getRandomPrompt() {
        return PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
    }

    /**
     * Calculate current streak from Journal data
     */
    function calculateStreak(memberId) {
        // Use Journal's streak calculation (based on journal entries with gratitude)
        if (typeof Journal !== 'undefined' && Journal.calculateStreak && Journal.getWidgetData) {
            const journalData = Journal.getWidgetData(memberId);
            // Only count entries that have gratitude
            const entriesWithGratitude = (journalData?.entries || [])
                .filter(e => e.gratitude && e.gratitude.length > 0);
            return calculateStreakFromEntries(entriesWithGratitude);
        }
        // Fallback to legacy
        const entries = getGratitudeEntries(memberId);
        return calculateStreakFromEntries(entries);
    }

    /**
     * Calculate streak from entries array
     */
    function calculateStreakFromEntries(entries) {
        if (!entries || entries.length === 0) return 0;

        // Sort entries by date (newest first)
        const sortedEntries = [...entries].sort((a, b) =>
            new Date(b.date) - new Date(a.date)
        );

        const today = DateUtils.today();
        const yesterday = DateUtils.formatISO(DateUtils.addDays(new Date(), -1));

        // Check if there's an entry today or yesterday
        const latestDate = sortedEntries[0].date;
        if (latestDate !== today && latestDate !== yesterday) {
            return 0; // Streak broken
        }

        let streak = 0;
        let checkDate = latestDate === today ? new Date() : DateUtils.addDays(new Date(), -1);

        // Get unique dates
        const uniqueDates = [...new Set(sortedEntries.map(e => e.date))];

        for (const date of uniqueDates) {
            const expectedDate = DateUtils.formatISO(checkDate);
            if (date === expectedDate) {
                streak++;
                checkDate = DateUtils.addDays(checkDate, -1);
            } else if (date < expectedDate) {
                break; // Gap found, streak ends
            }
        }

        return streak;
    }

    /**
     * Check if user has written today
     */
    function hasWrittenToday(memberId) {
        const items = getTodayGratitude(memberId);
        return items.length > 0;
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
     * Get entries for a specific week
     */
    function getWeekEntries(entries, weekStart) {
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        return entries.filter(entry => {
            const entryDate = new Date(entry.date);
            return entryDate >= weekStart && entryDate <= weekEnd;
        });
    }

    /**
     * Render the gratitude widget for a member
     * This is PUBLIC - no PIN required
     */
    function renderWidget(container, memberId) {
        const entries = getGratitudeEntries(memberId);
        const streak = calculateStreak(memberId);
        const writtenToday = hasWrittenToday(memberId);
        const todayItems = getTodayGratitude(memberId);
        const prompt = getRandomPrompt();

        container.innerHTML = `
            <div class="gratitude-widget">
                <div class="gratitude-widget__header">
                    <div class="gratitude-widget__streak ${streak > 0 ? 'gratitude-widget__streak--active' : ''}">
                        <i data-lucide="flame"></i>
                        <span>${streak} day${streak !== 1 ? 's' : ''}</span>
                    </div>
                    ${writtenToday ? `
                        <span class="gratitude-widget__badge">
                            <i data-lucide="check-circle"></i>
                            Done today
                        </span>
                    ` : ''}
                </div>

                ${writtenToday && todayItems.length > 0 ? `
                    <div class="gratitude-widget__today">
                        <div class="gratitude-widget__today-label">Today's gratitude:</div>
                        <div class="gratitude-widget__today-content">
                            ${todayItems.map(item => `
                                <div class="gratitude-widget__item">
                                    <i data-lucide="heart"></i>
                                    <span>${item}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : `
                    <div class="gratitude-widget__prompt">
                        <i data-lucide="sparkles"></i>
                        <span>${prompt}</span>
                    </div>

                    <div class="gratitude-widget__input-section">
                        <div class="gratitude-widget__input-row">
                            <input type="text" class="form-input" id="quickGratitude1"
                                   placeholder="I'm grateful for..." autocomplete="off">
                        </div>
                        <div class="gratitude-widget__input-row">
                            <input type="text" class="form-input" id="quickGratitude2"
                                   placeholder="I'm also grateful for..." autocomplete="off">
                        </div>
                        <div class="gratitude-widget__input-row">
                            <input type="text" class="form-input" id="quickGratitude3"
                                   placeholder="And grateful for..." autocomplete="off">
                        </div>
                        <button class="btn btn--primary btn--block" data-action="save-quick-gratitude" data-member-id="${memberId}">
                            <i data-lucide="save"></i>
                            Save Today's Gratitude
                        </button>
                    </div>
                `}

                <div class="gratitude-widget__footer">
                    <button class="btn btn--sm btn--ghost" data-action="view-journal" data-member-id="${memberId}">
                        <i data-lucide="book-open"></i>
                        Journal
                    </button>
                    ${writtenToday ? `
                        <button class="btn btn--sm btn--ghost" data-action="edit-today" data-member-id="${memberId}">
                            <i data-lucide="edit-2"></i>
                            Edit
                        </button>
                    ` : ''}
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
        // Save quick gratitude
        container.querySelector('[data-action="save-quick-gratitude"]')?.addEventListener('click', () => {
            const items = [
                document.getElementById('quickGratitude1')?.value?.trim(),
                document.getElementById('quickGratitude2')?.value?.trim(),
                document.getElementById('quickGratitude3')?.value?.trim()
            ].filter(Boolean);

            if (items.length === 0) {
                Toast.error('Please write at least one thing you\'re grateful for');
                return;
            }

            saveGratitude(memberId, items);
        });

        // Edit today's entry
        container.querySelector('[data-action="edit-today"]')?.addEventListener('click', () => {
            showWriteModal(memberId, true);
        });

        // View journal - opens full page
        container.querySelector('[data-action="view-journal"]')?.addEventListener('click', () => {
            showJournalPage(memberId);
        });
    }

    /**
     * Show write/edit gratitude modal
     */
    function showWriteModal(memberId, isEdit = false) {
        // Get today's gratitude from Journal (unified data)
        const todayItems = getTodayGratitude(memberId);

        // Pre-fill with existing items
        let existingItems = ['', '', ''];
        if (todayItems.length > 0) {
            existingItems = [...todayItems, '', '', ''].slice(0, 3);
        }

        const prompt = getRandomPrompt();

        const content = `
            <div class="gratitude-write">
                <div class="gratitude-write__prompt">
                    <i data-lucide="sparkles"></i>
                    <span>${prompt}</span>
                </div>

                <p class="gratitude-write__instruction">
                    Write 1-3 things you're grateful for today:
                </p>

                <div class="gratitude-write__inputs">
                    <div class="gratitude-write__input-row">
                        <span class="gratitude-write__number">1.</span>
                        <input type="text" class="form-input" id="gratitude1"
                               value="${existingItems[0] || ''}"
                               placeholder="I'm grateful for..."
                               autocomplete="off">
                    </div>
                    <div class="gratitude-write__input-row">
                        <span class="gratitude-write__number">2.</span>
                        <input type="text" class="form-input" id="gratitude2"
                               value="${existingItems[1] || ''}"
                               placeholder="I'm grateful for..."
                               autocomplete="off">
                    </div>
                    <div class="gratitude-write__input-row">
                        <span class="gratitude-write__number">3.</span>
                        <input type="text" class="form-input" id="gratitude3"
                               value="${existingItems[2] || ''}"
                               placeholder="I'm grateful for..."
                               autocomplete="off">
                    </div>
                </div>
            </div>
        `;

        Modal.open({
            title: isEdit ? 'Edit Today\'s Gratitude' : 'Write Today\'s Gratitude',
            content,
            footer: Modal.createFooter('Cancel', 'Save')
        });

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Focus first input
        document.getElementById('gratitude1')?.focus();

        Modal.bindFooterEvents(() => {
            const items = [
                document.getElementById('gratitude1')?.value?.trim(),
                document.getElementById('gratitude2')?.value?.trim(),
                document.getElementById('gratitude3')?.value?.trim()
            ].filter(Boolean);

            if (items.length === 0) {
                Toast.error('Please write at least one thing you\'re grateful for');
                return false;
            }

            saveGratitude(memberId, items);
            return true;
        });
    }

    /**
     * Save gratitude entry
     * Saves to Journal widget (single source of truth)
     */
    function saveGratitude(memberId, items) {
        // Save to Journal widget
        if (typeof Journal !== 'undefined' && Journal.saveGratitudeOnly) {
            Journal.saveGratitudeOnly(memberId, items);
        } else {
            // Fallback to legacy storage
            const widgetData = Storage.getWidgetData(memberId, 'gratitude') || { entries: [], weeklyGoal: 5 };
            const today = DateUtils.today();

            // Remove existing entry for today if any
            const entries = (widgetData.entries || []).filter(e => e.date !== today);

            // Add new entry
            entries.unshift({
                id: `grat-${Date.now()}`,
                date: today,
                items,
                createdAt: new Date().toISOString()
            });

            // Keep only last 365 entries
            const trimmedEntries = entries.slice(0, 365);

            Storage.setWidgetData(memberId, 'gratitude', {
                ...widgetData,
                entries: trimmedEntries
            });
            Toast.success('Gratitude saved!');
        }

        // Refresh widget
        const widgetBody = document.getElementById('widget-gratitude');
        if (widgetBody) {
            renderWidget(widgetBody, memberId);
        }
    }

    /**
     * Show the full page journal view
     */
    function showJournalPage(memberId, activeTab = 'week') {
        const main = document.getElementById('mainContent');
        if (!main) return;

        const member = Storage.getMember(memberId);
        renderJournalPage(main, memberId, member, new Date(), activeTab);
    }

    /**
     * Render the journal page with tabbed interface
     */
    function renderJournalPage(container, memberId, member, currentWeekDate, activeTab = 'week') {
        const entries = getGratitudeEntries(memberId);
        const weeklyGoal = getWeeklyGoal(memberId);
        const streak = calculateStreak(memberId);
        const todayItems = getTodayGratitude(memberId);
        const writtenToday = todayItems.length > 0;

        const weekStart = getWeekStart(currentWeekDate);
        const weekEntries = getWeekEntries(entries, weekStart);
        const daysWithEntries = new Set(weekEntries.map(e => e.date)).size;
        const today = DateUtils.today();

        // Format week range for display
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        const weekRangeText = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

        // Check if viewing current week
        const currentWeekStart = getWeekStart(new Date());
        const isCurrentWeek = weekStart.getTime() === currentWeekStart.getTime();

        // Calculate monthly stats
        const thisMonth = new Date();
        const monthStart = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1);
        const monthEntries = entries.filter(e => new Date(e.date) >= monthStart);
        const monthDaysWithEntries = new Set(monthEntries.map(e => e.date)).size;

        container.innerHTML = `
            <div class="gratitude-page gratitude-page--tabbed">
                <!-- Hero Header -->
                <div class="gratitude-page__hero">
                    <button class="btn btn--ghost gratitude-page__back" id="backToMemberBtn">
                        <i data-lucide="arrow-left"></i>
                        Back
                    </button>
                    <div class="gratitude-page__hero-content">
                        <h1 class="gratitude-page__hero-title">
                            <i data-lucide="heart"></i>
                            Gratitude Journal
                        </h1>
                        <p class="gratitude-page__hero-subtitle">Cultivate gratitude, one day at a time</p>
                    </div>
                    <div class="gratitude-page__hero-stats">
                        <div class="gratitude-hero-stat">
                            <span class="gratitude-hero-stat__value">${streak}</span>
                            <span class="gratitude-hero-stat__label">Day Streak</span>
                        </div>
                        <div class="gratitude-hero-stat">
                            <span class="gratitude-hero-stat__value">${entries.length}</span>
                            <span class="gratitude-hero-stat__label">Total Entries</span>
                        </div>
                        <div class="gratitude-hero-stat">
                            <span class="gratitude-hero-stat__value">${daysWithEntries}/${weeklyGoal}</span>
                            <span class="gratitude-hero-stat__label">This Week</span>
                        </div>
                    </div>
                </div>

                <!-- Tab Navigation -->
                <div class="gratitude-page__tabs">
                    <button class="gratitude-tab ${activeTab === 'write' ? 'gratitude-tab--active' : ''}" data-tab="write">
                        <i data-lucide="pen-line"></i>
                        Write
                    </button>
                    <button class="gratitude-tab ${activeTab === 'week' ? 'gratitude-tab--active' : ''}" data-tab="week">
                        <i data-lucide="calendar-days"></i>
                        Week
                    </button>
                    <button class="gratitude-tab ${activeTab === 'stats' ? 'gratitude-tab--active' : ''}" data-tab="stats">
                        <i data-lucide="bar-chart-2"></i>
                        Stats
                    </button>
                </div>

                <!-- Tab Content -->
                <div class="gratitude-page__content">
                    ${activeTab === 'write' ? renderWriteTab(memberId, todayItems, writtenToday) : ''}
                    ${activeTab === 'week' ? renderWeekTab(entries, weekStart, weekRangeText, isCurrentWeek, today) : ''}
                    ${activeTab === 'stats' ? renderStatsTab(entries, streak, weeklyGoal, daysWithEntries, monthDaysWithEntries) : ''}
                </div>
            </div>
        `;

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Bind events
        bindJournalPageEvents(container, memberId, member, weekStart, activeTab);
    }

    /**
     * Render the Write tab content
     */
    function renderWriteTab(memberId, todayItems, writtenToday) {
        const prompt = getRandomPrompt();
        const existingItems = writtenToday ? [...todayItems, '', '', ''].slice(0, 3) : ['', '', ''];

        return `
            <div class="gratitude-write-section">
                <div class="gratitude-write-card">
                    <div class="gratitude-write-card__date">
                        ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </div>

                    <div class="gratitude-write-card__prompt">
                        <i data-lucide="sparkles"></i>
                        <span>${prompt}</span>
                    </div>

                    ${writtenToday ? `
                        <div class="gratitude-write-card__current">
                            <div class="gratitude-write-card__current-label">
                                <i data-lucide="check-circle"></i>
                                Today's gratitude:
                            </div>
                            <div class="gratitude-write-card__current-items">
                                ${todayItems.map(item => `
                                    <div class="gratitude-write-card__item">
                                        <i data-lucide="heart"></i>
                                        <span>${item}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}

                    <div class="gratitude-write-card__form">
                        <p class="gratitude-write-card__instruction">
                            ${writtenToday ? 'Edit your gratitude:' : 'What are you grateful for today?'}
                        </p>
                        <div class="gratitude-write-card__inputs">
                            <div class="gratitude-write-card__input-row">
                                <span class="gratitude-write-card__number">1.</span>
                                <input type="text" class="form-input" id="pageGratitude1"
                                       value="${existingItems[0] || ''}"
                                       placeholder="I'm grateful for..." autocomplete="off">
                            </div>
                            <div class="gratitude-write-card__input-row">
                                <span class="gratitude-write-card__number">2.</span>
                                <input type="text" class="form-input" id="pageGratitude2"
                                       value="${existingItems[1] || ''}"
                                       placeholder="I'm also grateful for..." autocomplete="off">
                            </div>
                            <div class="gratitude-write-card__input-row">
                                <span class="gratitude-write-card__number">3.</span>
                                <input type="text" class="form-input" id="pageGratitude3"
                                       value="${existingItems[2] || ''}"
                                       placeholder="And grateful for..." autocomplete="off">
                            </div>
                        </div>
                        <button class="btn btn--primary btn--lg gratitude-write-card__save" data-action="save-page-gratitude" data-member-id="${memberId}">
                            <i data-lucide="save"></i>
                            ${writtenToday ? 'Update Gratitude' : 'Save Gratitude'}
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render the Week tab content
     */
    function renderWeekTab(entries, weekStart, weekRangeText, isCurrentWeek, today) {
        return `
            <div class="gratitude-week-section">
                <div class="gratitude-week-nav">
                    <button class="gratitude-week-nav__btn" id="prevWeekBtn" title="Previous week">
                        <i data-lucide="chevron-left"></i>
                    </button>
                    <span class="gratitude-week-nav__text">${weekRangeText}</span>
                    <button class="gratitude-week-nav__btn" id="nextWeekBtn" title="Next week" ${isCurrentWeek ? 'disabled' : ''}>
                        <i data-lucide="chevron-right"></i>
                    </button>
                </div>

                <div class="gratitude-week">
                    ${[0, 1, 2, 3, 4, 5, 6].map(dayOffset => {
                        const dayDate = new Date(weekStart);
                        dayDate.setDate(dayDate.getDate() + dayOffset);
                        const dateStr = DateUtils.formatISO(dayDate);
                        const dayEntry = entries.find(e => e.date === dateStr);
                        const dayName = dayDate.toLocaleDateString('en-US', { weekday: 'long' });
                        const dayNum = dayDate.getDate();
                        const monthName = dayDate.toLocaleDateString('en-US', { month: 'short' });
                        const isToday = dateStr === today;
                        const isPast = dateStr < today;
                        const colors = DAY_COLORS[dayOffset];

                        // Get items or placeholder
                        const items = dayEntry?.items || (dayEntry?.text ? [dayEntry.text] : null);

                        return `
                            <div class="gratitude-day ${isToday ? 'gratitude-day--today' : ''} ${dayEntry ? 'gratitude-day--filled' : ''}"
                                 style="--day-bg: ${colors.bg}; --day-border: ${colors.border}; --day-text: ${colors.text};"
                                 data-date="${dateStr}"
                                 ${isToday ? 'data-editable="true"' : ''}>
                                <div class="gratitude-day__header">
                                    <span class="gratitude-day__name">${dayName}</span>
                                    <span class="gratitude-day__date">${monthName} ${dayNum}</span>
                                </div>
                                <div class="gratitude-day__content">
                                    ${items ? items.map(item => `
                                        <div class="gratitude-day__item">
                                            <i data-lucide="heart"></i>
                                            <span>${item}</span>
                                        </div>
                                    `).join('') : `
                                        <div class="gratitude-day__empty">
                                            ${isToday ? `
                                                <i data-lucide="plus-circle"></i>
                                                <span>Click to add gratitude</span>
                                            ` : isPast ? `
                                                <i data-lucide="minus-circle"></i>
                                                <span>No entry</span>
                                            ` : `
                                                <i data-lucide="clock"></i>
                                                <span>Upcoming</span>
                                            `}
                                        </div>
                                    `}
                                </div>
                                ${isToday && dayEntry ? `
                                    <button class="gratitude-day__edit" data-action="edit-day" data-date="${dateStr}">
                                        <i data-lucide="edit-2"></i>
                                    </button>
                                ` : ''}
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Render the Stats tab content
     */
    function renderStatsTab(entries, streak, weeklyGoal, daysWithEntries, monthDaysWithEntries) {
        // Calculate best streak
        let bestStreak = 0;
        let currentStreak = 0;
        const sortedDates = [...new Set(entries.map(e => e.date))].sort();

        for (let i = 0; i < sortedDates.length; i++) {
            if (i === 0) {
                currentStreak = 1;
            } else {
                const prevDate = new Date(sortedDates[i - 1]);
                const currDate = new Date(sortedDates[i]);
                const diffDays = Math.round((currDate - prevDate) / (1000 * 60 * 60 * 24));
                if (diffDays === 1) {
                    currentStreak++;
                } else {
                    currentStreak = 1;
                }
            }
            bestStreak = Math.max(bestStreak, currentStreak);
        }

        // Calculate this month's progress
        const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
        const monthProgress = Math.round((monthDaysWithEntries / daysInMonth) * 100);

        return `
            <div class="gratitude-stats-section">
                <div class="gratitude-stats-grid">
                    <div class="gratitude-stat-card gratitude-stat-card--primary">
                        <div class="gratitude-stat-card__icon">
                            <i data-lucide="flame"></i>
                        </div>
                        <div class="gratitude-stat-card__info">
                            <span class="gratitude-stat-card__value">${streak}</span>
                            <span class="gratitude-stat-card__label">Current Streak</span>
                        </div>
                    </div>
                    <div class="gratitude-stat-card gratitude-stat-card--success">
                        <div class="gratitude-stat-card__icon">
                            <i data-lucide="trophy"></i>
                        </div>
                        <div class="gratitude-stat-card__info">
                            <span class="gratitude-stat-card__value">${bestStreak}</span>
                            <span class="gratitude-stat-card__label">Best Streak</span>
                        </div>
                    </div>
                    <div class="gratitude-stat-card gratitude-stat-card--info">
                        <div class="gratitude-stat-card__icon">
                            <i data-lucide="book-heart"></i>
                        </div>
                        <div class="gratitude-stat-card__info">
                            <span class="gratitude-stat-card__value">${entries.length}</span>
                            <span class="gratitude-stat-card__label">Total Entries</span>
                        </div>
                    </div>
                    <div class="gratitude-stat-card gratitude-stat-card--warning">
                        <div class="gratitude-stat-card__icon">
                            <i data-lucide="calendar-check"></i>
                        </div>
                        <div class="gratitude-stat-card__info">
                            <span class="gratitude-stat-card__value">${monthDaysWithEntries}</span>
                            <span class="gratitude-stat-card__label">This Month</span>
                        </div>
                    </div>
                </div>

                <div class="gratitude-goal-card">
                    <div class="gratitude-goal-card__header">
                        <i data-lucide="target"></i>
                        <span>Weekly Goal Progress</span>
                    </div>
                    <div class="gratitude-goal-card__content">
                        <div class="gratitude-goal-card__progress">
                            <div class="gratitude-goal-card__bar">
                                <div class="gratitude-goal-card__fill" style="width: ${Math.min(100, (daysWithEntries / weeklyGoal) * 100)}%"></div>
                            </div>
                            <span class="gratitude-goal-card__text">
                                ${daysWithEntries >= weeklyGoal ? '🎉 Goal reached!' : `${daysWithEntries}/${weeklyGoal} days completed`}
                            </span>
                        </div>
                        <div class="gratitude-goal-card__setting">
                            <label>Weekly goal:</label>
                            <div class="gratitude-goal-buttons">
                                ${[3, 4, 5, 6, 7].map(n => `
                                    <button class="gratitude-goal-btn ${weeklyGoal === n ? 'gratitude-goal-btn--active' : ''}"
                                            data-goal="${n}">${n}</button>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="gratitude-month-card">
                    <div class="gratitude-month-card__header">
                        <i data-lucide="calendar"></i>
                        <span>${new Date().toLocaleDateString('en-US', { month: 'long' })} Progress</span>
                    </div>
                    <div class="gratitude-month-card__content">
                        <div class="gratitude-month-card__progress">
                            <div class="gratitude-month-card__bar">
                                <div class="gratitude-month-card__fill" style="width: ${monthProgress}%"></div>
                            </div>
                            <span class="gratitude-month-card__text">${monthDaysWithEntries} of ${daysInMonth} days (${monthProgress}%)</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Bind journal page events
     */
    function bindJournalPageEvents(container, memberId, member, weekStart, activeTab) {
        // Back button
        document.getElementById('backToMemberBtn')?.addEventListener('click', () => {
            State.emit('tabChanged', memberId);
        });

        // Tab switching
        container.querySelectorAll('.gratitude-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const newTab = tab.dataset.tab;
                renderJournalPage(container, memberId, member, weekStart, newTab);
            });
        });

        // Tab-specific events
        if (activeTab === 'write') {
            // Save gratitude from page
            container.querySelector('[data-action="save-page-gratitude"]')?.addEventListener('click', () => {
                const items = [
                    document.getElementById('pageGratitude1')?.value?.trim(),
                    document.getElementById('pageGratitude2')?.value?.trim(),
                    document.getElementById('pageGratitude3')?.value?.trim()
                ].filter(Boolean);

                if (items.length === 0) {
                    Toast.error('Please write at least one thing you\'re grateful for');
                    return;
                }

                saveGratitude(memberId, items);
                renderJournalPage(container, memberId, member, weekStart, 'write');
            });
        }

        if (activeTab === 'week') {
            // Previous week
            document.getElementById('prevWeekBtn')?.addEventListener('click', () => {
                const prevWeek = new Date(weekStart);
                prevWeek.setDate(prevWeek.getDate() - 7);
                renderJournalPage(container, memberId, member, prevWeek, 'week');
            });

            // Next week
            document.getElementById('nextWeekBtn')?.addEventListener('click', () => {
                const nextWeek = new Date(weekStart);
                nextWeek.setDate(nextWeek.getDate() + 7);
                renderJournalPage(container, memberId, member, nextWeek, 'week');
            });

            // Click on today's card to switch to write tab
            container.querySelectorAll('.gratitude-day[data-editable="true"]').forEach(card => {
                card.addEventListener('click', (e) => {
                    if (e.target.closest('[data-action="edit-day"]')) return;
                    renderJournalPage(container, memberId, member, weekStart, 'write');
                });
            });

            // Edit button on today's card
            container.querySelectorAll('[data-action="edit-day"]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    renderJournalPage(container, memberId, member, weekStart, 'write');
                });
            });
        }

        if (activeTab === 'stats') {
            // Weekly goal change via buttons
            container.querySelectorAll('.gratitude-goal-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const newGoal = parseInt(btn.dataset.goal);
                    saveWeeklyGoal(memberId, newGoal);
                    Toast.success(`Weekly goal set to ${newGoal} days`);
                    renderJournalPage(container, memberId, member, weekStart, 'stats');
                });
            });
        }
    }

    /**
     * Delete an entry
     */
    function deleteEntry(memberId, entryId) {
        const widgetData = getWidgetData(memberId);
        // Handle both id and date-based deletion for backwards compatibility
        const updatedEntries = (widgetData.entries || []).filter(e =>
            e.id !== entryId && e.date !== entryId
        );

        const updatedData = {
            ...widgetData,
            entries: updatedEntries
        };

        Storage.setWidgetData(memberId, 'gratitude', updatedData);
        Toast.success('Entry deleted');
    }

    function init() {
        // Initialize gratitude feature
    }

    return {
        init,
        renderWidget,
        showJournalPage
    };
})();
