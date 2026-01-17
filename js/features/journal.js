/**
 * Journal Feature
 * Adult journal with classic paper notebook design
 * PIN protected, mood tracking, daily prompts
 * Shares gratitude data with Gratitude widget (gratitude is public, journal is private)
 */

const Journal = (function() {
    // Daily rotating prompts for inspiration
    const PROMPTS = [
        "What's on your mind today?",
        "What was the highlight of your day?",
        "What challenged you today, and how did you handle it?",
        "What are you looking forward to?",
        "What lesson did today teach you?",
        "How are you feeling right now, and why?",
        "What would you like to remember about today?",
        "What's something you're proud of recently?",
        "What's been weighing on your heart?",
        "If you could change one thing about today, what would it be?",
        "What made you laugh or smile today?",
        "What are you working towards right now?",
        "What do you need to let go of?",
        "Who or what inspired you today?",
        "What's a small win you had today?"
    ];

    // Mood options with emoji and colors
    const MOODS = [
        { id: 'grateful', emoji: '🙏', label: 'Grateful', color: '#86EFAC' },
        { id: 'content', emoji: '😌', label: 'Content', color: '#93C5FD' },
        { id: 'energized', emoji: '⚡', label: 'Energized', color: '#FCD34D' },
        { id: 'reflective', emoji: '🤔', label: 'Reflective', color: '#C4B5FD' },
        { id: 'stressed', emoji: '😓', label: 'Stressed', color: '#FCA5A5' },
        { id: 'peaceful', emoji: '🕊️', label: 'Peaceful', color: '#A5F3FC' },
        { id: 'motivated', emoji: '💪', label: 'Motivated', color: '#FDBA74' },
        { id: 'tired', emoji: '😴', label: 'Tired', color: '#D1D5DB' }
    ];

    /**
     * Get widget data with defaults
     */
    function getWidgetData(memberId) {
        const stored = Storage.getWidgetData(memberId, 'journal');
        if (!stored) {
            return {
                entries: [],
                settings: {
                    showPrompts: true
                }
            };
        }
        return stored;
    }

    /**
     * Save widget data
     */
    function saveWidgetData(memberId, data) {
        Storage.setWidgetData(memberId, 'journal', data);
    }

    /**
     * Get a daily prompt (same prompt for the whole day)
     */
    function getDailyPrompt() {
        const today = DateUtils.today();
        // Use date to seed prompt selection so it's consistent all day
        const seed = today.split('-').join('');
        const index = parseInt(seed) % PROMPTS.length;
        return PROMPTS[index];
    }

    /**
     * Get mood by ID
     */
    function getMoodById(moodId) {
        return MOODS.find(m => m.id === moodId);
    }

    /**
     * Calculate current streak
     */
    function calculateStreak(entries) {
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
     * Check if user has written a proper journal entry today
     * (not just gratitude - must have actual content or mood)
     */
    function hasWrittenToday(entries) {
        const today = DateUtils.today();
        const todayEntry = entries.find(e => e.date === today);
        // Only count as "written" if there's actual journal content or a mood selected
        return todayEntry && (todayEntry.content?.trim() || todayEntry.mood);
    }

    /**
     * Get today's entry
     */
    function getTodayEntry(entries) {
        const today = DateUtils.today();
        return entries.find(e => e.date === today);
    }

    /**
     * Get most common mood from entries
     */
    function getMostCommonMood(entries) {
        if (!entries || entries.length === 0) return null;

        const moodCounts = {};
        entries.forEach(entry => {
            if (entry.mood) {
                moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
            }
        });

        if (Object.keys(moodCounts).length === 0) return null;

        const topMoodId = Object.entries(moodCounts)
            .sort((a, b) => b[1] - a[1])[0][0];

        return MOODS.find(m => m.id === topMoodId);
    }

    /**
     * Get mood color with opacity for theming
     */
    function getMoodThemeColor(moodId, opacity = 0.15) {
        const mood = MOODS.find(m => m.id === moodId);
        if (!mood) return null;

        // Convert hex to RGB and add opacity
        const hex = mood.color;
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);

        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }

    /**
     * Render the journal widget (requires PIN to access)
     */
    function renderWidget(container, memberId) {
        const widgetData = getWidgetData(memberId);
        const entries = widgetData.entries || [];
        const streak = calculateStreak(entries);
        const writtenToday = hasWrittenToday(entries);
        const prompt = getDailyPrompt();
        const todayEntry = getTodayEntry(entries);
        const mostCommonMood = getMostCommonMood(entries);

        // Get mood for theming (today's mood or most common)
        const themeMood = todayEntry?.mood || mostCommonMood?.id;
        const moodThemeColor = themeMood ? getMoodThemeColor(themeMood, 0.2) : null;
        const moodThemeColorLight = themeMood ? getMoodThemeColor(themeMood, 0.08) : null;

        // Get current mood for display
        const currentMood = todayEntry?.mood ? MOODS.find(m => m.id === todayEntry.mood) : null;

        container.innerHTML = `
            <div class="journal-widget ${themeMood ? 'journal-widget--mood-themed' : ''}"
                 ${moodThemeColor ? `style="--mood-theme-color: ${moodThemeColor}; --mood-theme-color-light: ${moodThemeColorLight};"` : ''}>
                <div class="journal-widget__locked">
                    <!-- Stats Row -->
                    <div class="journal-widget__stats">
                        <div class="journal-widget__stat">
                            <span class="journal-widget__stat-value">${entries.length}</span>
                            <span class="journal-widget__stat-label">entries</span>
                        </div>
                        <div class="journal-widget__stat journal-widget__stat--streak ${streak > 0 ? 'journal-widget__stat--active' : ''}">
                            <span class="journal-widget__stat-value">
                                <i data-lucide="flame"></i>
                                ${streak}
                            </span>
                            <span class="journal-widget__stat-label">day streak</span>
                        </div>
                        <div class="journal-widget__stat">
                            ${mostCommonMood ? `
                                <span class="journal-widget__stat-value">${mostCommonMood.emoji}</span>
                                <span class="journal-widget__stat-label">${mostCommonMood.label.toLowerCase()}</span>
                            ` : `
                                <span class="journal-widget__stat-value">-</span>
                                <span class="journal-widget__stat-label">top mood</span>
                            `}
                        </div>
                    </div>

                    <!-- Journal Cover -->
                    <div class="journal-widget__notebook">
                        <div class="journal-widget__cover">
                            <div class="journal-widget__cover-icon">
                                <i data-lucide="notebook-pen"></i>
                            </div>
                            <h3>My Journal</h3>
                            <p class="journal-widget__cover-prompt">${prompt}</p>
                            ${writtenToday ? `
                                <span class="journal-widget__written-badge">
                                    <i data-lucide="check"></i>
                                    Written today ${currentMood ? currentMood.emoji : ''}
                                </span>
                            ` : ''}
                        </div>
                    </div>

                    <div class="journal-widget__actions">
                        <button class="btn btn--primary btn--block" data-action="open-journal" data-member-id="${memberId}">
                            <i data-lucide="book-open"></i>
                            Open Journal
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
        container.querySelector('[data-action="open-journal"]')?.addEventListener('click', async () => {
            const verified = await PIN.verify();
            if (verified) {
                showJournalPage(memberId);
            }
        });
    }

    /**
     * Show the full journal page
     */
    function showJournalPage(memberId, activeTab = 'write') {
        const main = document.getElementById('mainContent');
        if (!main) return;

        const member = Storage.getMember(memberId);
        renderJournalPage(main, memberId, member, activeTab);
    }

    /**
     * Render the journal page with tabbed interface
     */
    function renderJournalPage(container, memberId, member, activeTab = 'write') {
        const widgetData = getWidgetData(memberId);
        const entries = widgetData.entries || [];
        const streak = calculateStreak(entries);
        const todayEntry = getTodayEntry(entries);
        const writtenToday = hasWrittenToday(entries);

        // Calculate best streak
        let bestStreak = 0;
        let currentStreakCalc = 0;
        const uniqueDates = [...new Set(entries.map(e => e.date))].sort();
        for (let i = 0; i < uniqueDates.length; i++) {
            if (i === 0) {
                currentStreakCalc = 1;
            } else {
                const prevDate = new Date(uniqueDates[i - 1]);
                const currDate = new Date(uniqueDates[i]);
                const diffDays = Math.round((currDate - prevDate) / (1000 * 60 * 60 * 24));
                if (diffDays === 1) {
                    currentStreakCalc++;
                } else {
                    currentStreakCalc = 1;
                }
            }
            bestStreak = Math.max(bestStreak, currentStreakCalc);
        }

        // Calculate monthly stats
        const thisMonth = new Date();
        const monthStart = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1);
        const monthEntries = entries.filter(e => new Date(e.date) >= monthStart);
        const monthDaysWithEntries = new Set(monthEntries.map(e => e.date)).size;

        container.innerHTML = `
            <div class="journal-page journal-page--tabbed">
                <!-- Hero Header -->
                <div class="journal-page__hero">
                    <button class="btn btn--ghost journal-page__back" id="backToMemberBtn">
                        <i data-lucide="arrow-left"></i>
                        Back
                    </button>
                    <div class="journal-page__hero-content">
                        <h1 class="journal-page__hero-title">
                            <i data-lucide="notebook-pen"></i>
                            My Journal
                        </h1>
                        <p class="journal-page__hero-subtitle">Your private space for reflection</p>
                    </div>
                    <div class="journal-page__hero-stats">
                        <div class="journal-hero-stat">
                            <span class="journal-hero-stat__value">${streak}</span>
                            <span class="journal-hero-stat__label">Day Streak</span>
                        </div>
                        <div class="journal-hero-stat">
                            <span class="journal-hero-stat__value">${entries.length}</span>
                            <span class="journal-hero-stat__label">Total Entries</span>
                        </div>
                        <div class="journal-hero-stat">
                            <span class="journal-hero-stat__value">${monthDaysWithEntries}</span>
                            <span class="journal-hero-stat__label">This Month</span>
                        </div>
                    </div>
                </div>

                <!-- Tab Navigation -->
                <div class="journal-page__tabs">
                    <button class="journal-tab ${activeTab === 'write' ? 'journal-tab--active' : ''}" data-tab="write">
                        <i data-lucide="pen-line"></i>
                        Write
                    </button>
                    <button class="journal-tab ${activeTab === 'history' ? 'journal-tab--active' : ''}" data-tab="history">
                        <i data-lucide="history"></i>
                        History
                    </button>
                    <button class="journal-tab ${activeTab === 'stats' ? 'journal-tab--active' : ''}" data-tab="stats">
                        <i data-lucide="bar-chart-2"></i>
                        Stats
                    </button>
                </div>

                <!-- Tab Content -->
                <div class="journal-page__content">
                    ${activeTab === 'write' ? renderWriteTab(memberId, todayEntry) : ''}
                    ${activeTab === 'history' ? renderHistoryTab(entries) : ''}
                    ${activeTab === 'stats' ? renderStatsTab(entries, streak, bestStreak, monthDaysWithEntries) : ''}
                </div>
            </div>
        `;

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Bind events
        bindJournalPageEvents(container, memberId, member, activeTab, todayEntry);
    }

    /**
     * Render the Write tab content
     */
    function renderWriteTab(memberId, todayEntry) {
        const prompt = getDailyPrompt();

        if (todayEntry) {
            // Show today's entry with edit option
            return `
                <div class="journal-write-section">
                    <div class="journal-notebook">
                        <div class="journal-notebook__paper">
                            <div class="journal-notebook__date">
                                ${new Date().toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </div>
                            <div class="journal-notebook__entry">
                                ${todayEntry.mood ? `
                                    <div class="journal-notebook__entry-mood"
                                         style="--mood-color: ${getMoodById(todayEntry.mood)?.color || '#D1D5DB'}">
                                        <span class="journal-mood__emoji">${getMoodById(todayEntry.mood)?.emoji || '😊'}</span>
                                        <span>${getMoodById(todayEntry.mood)?.label || 'Feeling'}</span>
                                    </div>
                                ` : ''}
                                ${todayEntry.content ? `
                                    <div class="journal-notebook__entry-content">
                                        ${todayEntry.content.replace(/\n/g, '<br>')}
                                    </div>
                                ` : ''}
                                ${todayEntry.gratitude && todayEntry.gratitude.length > 0 ? `
                                    <div class="journal-notebook__gratitude-display">
                                        <div class="journal-notebook__gratitude-header">
                                            <i data-lucide="heart"></i>
                                            <span>Today's Gratitude</span>
                                        </div>
                                        <div class="journal-notebook__gratitude-items">
                                            ${todayEntry.gratitude.map(item => `
                                                <div class="journal-notebook__gratitude-item">
                                                    <i data-lucide="sparkle"></i>
                                                    <span>${item}</span>
                                                </div>
                                            `).join('')}
                                        </div>
                                    </div>
                                ` : ''}
                                <div class="journal-notebook__entry-time">
                                    Written at ${new Date(todayEntry.createdAt).toLocaleTimeString('en-US', {
                                        hour: 'numeric',
                                        minute: '2-digit'
                                    })}
                                    ${todayEntry.updatedAt && todayEntry.updatedAt !== todayEntry.createdAt ?
                                        ` (edited)` : ''}
                                </div>
                                <button class="btn btn--ghost btn--sm" id="editTodayBtn">
                                    <i data-lucide="edit-2"></i>
                                    Edit Entry
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        // Show write form
        return `
            <div class="journal-write-section">
                <div class="journal-notebook">
                    <div class="journal-notebook__paper">
                        <div class="journal-notebook__date">
                            ${new Date().toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </div>

                        <div class="journal-notebook__prompt">
                            <i data-lucide="sparkles"></i>
                            <span>${prompt}</span>
                        </div>

                        <div class="journal-notebook__mood-section">
                            <label class="journal-notebook__mood-label">How are you feeling?</label>
                            <div class="journal-notebook__moods" id="moodSelector">
                                ${MOODS.map(mood => `
                                    <button class="journal-mood" data-mood="${mood.id}"
                                            style="--mood-color: ${mood.color}"
                                            title="${mood.label}">
                                        <span class="journal-mood__emoji">${mood.emoji}</span>
                                        <span class="journal-mood__label">${mood.label}</span>
                                    </button>
                                `).join('')}
                            </div>
                        </div>

                        <div class="journal-notebook__write">
                            <textarea
                                class="journal-notebook__textarea"
                                id="journalEntry"
                                placeholder="Start writing..."
                                rows="8"
                            ></textarea>
                        </div>

                        <!-- Gratitude Section (collapsible) -->
                        <div class="journal-gratitude">
                            <button class="journal-gratitude__toggle" id="gratitudeToggle">
                                <i data-lucide="heart"></i>
                                <span>Add Gratitude</span>
                                <i data-lucide="chevron-down" class="journal-gratitude__chevron"></i>
                            </button>
                            <div class="journal-gratitude__content" id="gratitudeContent" style="display: none;">
                                <p class="journal-gratitude__hint">What are you grateful for today?</p>
                                <div class="journal-gratitude__inputs">
                                    <input type="text" class="form-input" id="gratitude1" placeholder="I'm grateful for..." autocomplete="off">
                                    <input type="text" class="form-input" id="gratitude2" placeholder="I'm also grateful for..." autocomplete="off">
                                    <input type="text" class="form-input" id="gratitude3" placeholder="And grateful for..." autocomplete="off">
                                </div>
                            </div>
                        </div>

                        <div class="journal-notebook__save">
                            <button class="btn btn--primary" id="saveEntryBtn">
                                <i data-lucide="save"></i>
                                Save Entry
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render the History tab content
     */
    function renderHistoryTab(entries) {
        const pastEntries = entries.filter(e => e.date !== DateUtils.today());

        if (pastEntries.length === 0) {
            return `
                <div class="journal-history-section">
                    <div class="journal-history-empty">
                        <i data-lucide="notebook-pen"></i>
                        <p>No past entries yet</p>
                        <span>Start writing today to build your journal history</span>
                    </div>
                </div>
            `;
        }

        // Group entries by month
        const groupedEntries = {};
        pastEntries.forEach(entry => {
            const date = DateUtils.parseLocalDate ? DateUtils.parseLocalDate(entry.date) : new Date(entry.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const monthLabel = `${DateUtils.getMonthName ? DateUtils.getMonthName(date) : date.toLocaleDateString('en-US', { month: 'long' })} ${date.getFullYear()}`;

            if (!groupedEntries[monthKey]) {
                groupedEntries[monthKey] = {
                    label: monthLabel,
                    entries: []
                };
            }
            groupedEntries[monthKey].entries.push(entry);
        });

        return `
            <div class="journal-history-section">
                ${Object.keys(groupedEntries)
                    .sort((a, b) => b.localeCompare(a))
                    .map(monthKey => {
                        const group = groupedEntries[monthKey];
                        return `
                            <div class="journal-month-group">
                                <h3 class="journal-month-group__title">${group.label}</h3>
                                <div class="journal-history__list">
                                    ${group.entries.map(entry => {
                                        const mood = getMoodById(entry.mood);
                                        return `
                                            <div class="journal-history__entry" data-entry-id="${entry.id}">
                                                <div class="journal-history__entry-header">
                                                    <span class="journal-history__entry-date">
                                                        ${DateUtils.formatWithDay(entry.date)}
                                                    </span>
                                                    ${mood ? `
                                                        <span class="journal-history__entry-mood"
                                                              style="--mood-color: ${mood.color}">
                                                            ${mood.emoji}
                                                        </span>
                                                    ` : ''}
                                                </div>
                                                <div class="journal-history__entry-preview">
                                                    ${entry.content && entry.content.length > 150
                                                        ? entry.content.substring(0, 150) + '...'
                                                        : entry.content || '(No content)'}
                                                </div>
                                            </div>
                                        `;
                                    }).join('')}
                                </div>
                            </div>
                        `;
                    }).join('')}
            </div>
        `;
    }

    /**
     * Render the Stats tab content
     */
    function renderStatsTab(entries, streak, bestStreak, monthDaysWithEntries) {
        // Count mood distribution
        const moodCounts = {};
        entries.forEach(entry => {
            if (entry.mood) {
                moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
            }
        });

        // Find most common mood
        let mostCommonMood = null;
        let maxCount = 0;
        Object.keys(moodCounts).forEach(moodId => {
            if (moodCounts[moodId] > maxCount) {
                maxCount = moodCounts[moodId];
                mostCommonMood = moodId;
            }
        });

        // Calculate this month's progress
        const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
        const monthProgress = Math.round((monthDaysWithEntries / daysInMonth) * 100);

        return `
            <div class="journal-stats-section">
                <div class="journal-stats-grid">
                    <div class="journal-stat-card journal-stat-card--primary">
                        <div class="journal-stat-card__icon">
                            <i data-lucide="flame"></i>
                        </div>
                        <div class="journal-stat-card__info">
                            <span class="journal-stat-card__value">${streak}</span>
                            <span class="journal-stat-card__label">Current Streak</span>
                        </div>
                    </div>
                    <div class="journal-stat-card journal-stat-card--success">
                        <div class="journal-stat-card__icon">
                            <i data-lucide="trophy"></i>
                        </div>
                        <div class="journal-stat-card__info">
                            <span class="journal-stat-card__value">${bestStreak}</span>
                            <span class="journal-stat-card__label">Best Streak</span>
                        </div>
                    </div>
                    <div class="journal-stat-card journal-stat-card--info">
                        <div class="journal-stat-card__icon">
                            <i data-lucide="book-heart"></i>
                        </div>
                        <div class="journal-stat-card__info">
                            <span class="journal-stat-card__value">${entries.length}</span>
                            <span class="journal-stat-card__label">Total Entries</span>
                        </div>
                    </div>
                    <div class="journal-stat-card journal-stat-card--warning">
                        <div class="journal-stat-card__icon">
                            <i data-lucide="calendar-check"></i>
                        </div>
                        <div class="journal-stat-card__info">
                            <span class="journal-stat-card__value">${monthDaysWithEntries}</span>
                            <span class="journal-stat-card__label">This Month</span>
                        </div>
                    </div>
                </div>

                <div class="journal-month-card">
                    <div class="journal-month-card__header">
                        <i data-lucide="calendar"></i>
                        <span>${new Date().toLocaleDateString('en-US', { month: 'long' })} Progress</span>
                    </div>
                    <div class="journal-month-card__content">
                        <div class="journal-month-card__progress">
                            <div class="journal-month-card__bar">
                                <div class="journal-month-card__fill" style="width: ${monthProgress}%"></div>
                            </div>
                            <span class="journal-month-card__text">${monthDaysWithEntries} of ${daysInMonth} days (${monthProgress}%)</span>
                        </div>
                    </div>
                </div>

                ${Object.keys(moodCounts).length > 0 ? `
                    <div class="journal-mood-card">
                        <div class="journal-mood-card__header">
                            <i data-lucide="heart"></i>
                            <span>Mood Distribution</span>
                        </div>
                        <div class="journal-mood-card__content">
                            <div class="journal-mood-card__grid">
                                ${MOODS.filter(m => moodCounts[m.id]).map(mood => `
                                    <div class="journal-mood-card__item" style="--mood-color: ${mood.color}">
                                        <span class="journal-mood-card__emoji">${mood.emoji}</span>
                                        <span class="journal-mood-card__count">${moodCounts[mood.id]}</span>
                                        <span class="journal-mood-card__label">${mood.label}</span>
                                    </div>
                                `).join('')}
                            </div>
                            ${mostCommonMood ? `
                                <div class="journal-mood-card__most-common">
                                    <span>Most common mood:</span>
                                    <span class="journal-mood-card__most-common-mood" style="--mood-color: ${getMoodById(mostCommonMood)?.color}">
                                        ${getMoodById(mostCommonMood)?.emoji} ${getMoodById(mostCommonMood)?.label}
                                    </span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Bind journal page events
     */
    function bindJournalPageEvents(container, memberId, member, activeTab, todayEntry) {
        let selectedMood = null;

        // Back button
        document.getElementById('backToMemberBtn')?.addEventListener('click', () => {
            State.emit('tabChanged', memberId);
        });

        // Tab switching
        container.querySelectorAll('.journal-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const newTab = tab.dataset.tab;
                renderJournalPage(container, memberId, member, newTab);
            });
        });

        // Tab-specific events
        if (activeTab === 'write') {
            // Gratitude toggle
            const gratitudeToggle = document.getElementById('gratitudeToggle');
            const gratitudeContent = document.getElementById('gratitudeContent');
            if (gratitudeToggle && gratitudeContent) {
                gratitudeToggle.addEventListener('click', () => {
                    const isOpen = gratitudeContent.style.display !== 'none';
                    gratitudeContent.style.display = isOpen ? 'none' : 'block';
                    gratitudeToggle.classList.toggle('journal-gratitude__toggle--open', !isOpen);
                });
            }

            // Mood selection
            container.querySelectorAll('.journal-mood').forEach(btn => {
                btn.addEventListener('click', () => {
                    container.querySelectorAll('.journal-mood').forEach(b =>
                        b.classList.remove('journal-mood--selected'));
                    btn.classList.add('journal-mood--selected');
                    selectedMood = btn.dataset.mood;
                });
            });

            // Save entry
            document.getElementById('saveEntryBtn')?.addEventListener('click', () => {
                const content = document.getElementById('journalEntry')?.value?.trim();

                // Collect gratitude items
                const gratitudeItems = [
                    document.getElementById('gratitude1')?.value?.trim(),
                    document.getElementById('gratitude2')?.value?.trim(),
                    document.getElementById('gratitude3')?.value?.trim()
                ].filter(Boolean);

                // Need at least journal content OR gratitude
                if (!content && gratitudeItems.length === 0) {
                    Toast.error('Please write something in your journal or add gratitude');
                    return;
                }

                saveEntry(memberId, content || '', selectedMood, gratitudeItems);
                renderJournalPage(container, memberId, member, 'write');
            });

            // Edit today's entry
            document.getElementById('editTodayBtn')?.addEventListener('click', () => {
                showEditModal(memberId, todayEntry, () => {
                    renderJournalPage(container, memberId, member, 'write');
                });
            });
        }

        if (activeTab === 'history') {
            // View past entry
            container.querySelectorAll('.journal-history__entry').forEach(card => {
                card.addEventListener('click', () => {
                    const entryId = card.dataset.entryId;
                    const widgetData = getWidgetData(memberId);
                    const entry = widgetData.entries.find(e => e.id === entryId);
                    if (entry) {
                        showEntryModal(memberId, entry, () => {
                            renderJournalPage(container, memberId, member, 'history');
                        });
                    }
                });
            });
        }
    }

    /**
     * Save a new entry
     */
    function saveEntry(memberId, content, mood, gratitude = []) {
        const widgetData = getWidgetData(memberId);
        const today = DateUtils.today();
        const now = new Date().toISOString();

        // Get existing entry to preserve gratitude if not provided
        const existingEntry = (widgetData.entries || []).find(e => e.date === today);
        const existingGratitude = existingEntry?.gratitude || [];

        // Remove any existing entry for today
        const entries = (widgetData.entries || []).filter(e => e.date !== today);

        // Add new entry with gratitude field
        entries.unshift({
            id: `journal-${Date.now()}`,
            date: today,
            content,
            mood,
            gratitude: gratitude.length > 0 ? gratitude : existingGratitude,
            createdAt: existingEntry?.createdAt || now,
            updatedAt: now
        });

        // Keep only last 365 entries
        const trimmedEntries = entries.slice(0, 365);

        saveWidgetData(memberId, {
            ...widgetData,
            entries: trimmedEntries
        });

        Toast.success('Journal entry saved!');
    }

    /**
     * Save gratitude only (for use by Gratitude widget)
     * Creates or updates today's entry with just gratitude items
     */
    function saveGratitudeOnly(memberId, items) {
        const widgetData = getWidgetData(memberId);
        const today = DateUtils.today();
        const now = new Date().toISOString();

        // Get existing entry for today
        const existingEntry = (widgetData.entries || []).find(e => e.date === today);

        // Remove existing entry for today
        const entries = (widgetData.entries || []).filter(e => e.date !== today);

        // Create or update entry with gratitude
        entries.unshift({
            id: existingEntry?.id || `journal-${Date.now()}`,
            date: today,
            content: existingEntry?.content || '',
            mood: existingEntry?.mood || null,
            gratitude: items,
            createdAt: existingEntry?.createdAt || now,
            updatedAt: now
        });

        // Keep only last 365 entries
        const trimmedEntries = entries.slice(0, 365);

        saveWidgetData(memberId, {
            ...widgetData,
            entries: trimmedEntries
        });

        Toast.success('Gratitude saved!');
    }

    /**
     * Get today's gratitude items (for use by Gratitude widget)
     */
    function getTodayGratitude(memberId) {
        const widgetData = getWidgetData(memberId);
        const today = DateUtils.today();
        const todayEntry = (widgetData.entries || []).find(e => e.date === today);
        return todayEntry?.gratitude || [];
    }

    /**
     * Get all gratitude entries (for use by Gratitude widget)
     * Returns entries in the format expected by the gratitude widget
     */
    function getGratitudeEntries(memberId) {
        const widgetData = getWidgetData(memberId);
        return (widgetData.entries || [])
            .filter(e => e.gratitude && e.gratitude.length > 0)
            .map(e => ({
                id: e.id,
                date: e.date,
                items: e.gratitude,
                createdAt: e.createdAt
            }));
    }

    /**
     * Show edit modal for an entry
     */
    function showEditModal(memberId, entry, onSave) {
        if (!entry) {
            Toast.error('Entry not found');
            return;
        }

        const mood = getMoodById(entry.mood);
        const existingGratitude = entry.gratitude || [];

        const content = `
            <div class="journal-edit-modal">
                <div class="journal-edit-modal__mood-section">
                    <label>Mood</label>
                    <div class="journal-notebook__moods" id="editMoodSelector">
                        ${MOODS.map(m => `
                            <button class="journal-mood ${m.id === entry.mood ? 'journal-mood--selected' : ''}"
                                    data-mood="${m.id}"
                                    style="--mood-color: ${m.color}"
                                    title="${m.label}">
                                <span class="journal-mood__emoji">${m.emoji}</span>
                                <span class="journal-mood__label">${m.label}</span>
                            </button>
                        `).join('')}
                    </div>
                </div>
                <div class="journal-edit-modal__content">
                    <label>Entry</label>
                    <textarea
                        class="journal-notebook__textarea"
                        id="editJournalEntry"
                        rows="8"
                    >${entry.content || ''}</textarea>
                </div>
                <div class="journal-edit-modal__gratitude">
                    <label>
                        <i data-lucide="heart"></i>
                        Gratitude
                    </label>
                    <div class="journal-edit-modal__gratitude-inputs">
                        <input type="text" class="form-input" id="editGratitude1"
                               value="${existingGratitude[0] || ''}" placeholder="I'm grateful for..." autocomplete="off">
                        <input type="text" class="form-input" id="editGratitude2"
                               value="${existingGratitude[1] || ''}" placeholder="I'm also grateful for..." autocomplete="off">
                        <input type="text" class="form-input" id="editGratitude3"
                               value="${existingGratitude[2] || ''}" placeholder="And grateful for..." autocomplete="off">
                    </div>
                </div>
            </div>
        `;

        Modal.open({
            title: 'Edit Entry',
            content,
            footer: Modal.createFooter('Cancel', 'Save Changes')
        });

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        let selectedMood = entry.mood;

        // Mood selection in modal
        document.querySelectorAll('#editMoodSelector .journal-mood').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#editMoodSelector .journal-mood').forEach(b =>
                    b.classList.remove('journal-mood--selected'));
                btn.classList.add('journal-mood--selected');
                selectedMood = btn.dataset.mood;
            });
        });

        Modal.bindFooterEvents(() => {
            const newContent = document.getElementById('editJournalEntry')?.value?.trim();

            // Collect gratitude items
            const gratitudeItems = [
                document.getElementById('editGratitude1')?.value?.trim(),
                document.getElementById('editGratitude2')?.value?.trim(),
                document.getElementById('editGratitude3')?.value?.trim()
            ].filter(Boolean);

            // Need at least content OR gratitude
            if (!newContent && gratitudeItems.length === 0) {
                Toast.error('Please write something or add gratitude');
                return false;
            }

            // Update entry
            const widgetData = getWidgetData(memberId);
            const entries = widgetData.entries.map(e => {
                if (e.id === entry.id) {
                    return {
                        ...e,
                        content: newContent || '',
                        mood: selectedMood,
                        gratitude: gratitudeItems,
                        updatedAt: new Date().toISOString()
                    };
                }
                return e;
            });

            saveWidgetData(memberId, {
                ...widgetData,
                entries
            });

            Toast.success('Entry updated!');
            if (onSave) onSave();
            return true;
        });
    }

    /**
     * Show modal for viewing a past entry
     */
    function showEntryModal(memberId, entry, onUpdate) {
        if (!entry) {
            Toast.error('Entry not found');
            return;
        }

        const mood = getMoodById(entry.mood);
        const entryDate = DateUtils.parseLocalDate(entry.date);

        const content = `
            <div class="journal-entry-modal">
                <div class="journal-entry-modal__date">
                    ${entryDate.toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}
                </div>
                ${mood ? `
                    <div class="journal-entry-modal__mood" style="--mood-color: ${mood.color}">
                        <span>${mood.emoji}</span>
                        <span>${mood.label}</span>
                    </div>
                ` : ''}
                <div class="journal-entry-modal__content">
                    ${entry.content.replace(/\n/g, '<br>')}
                </div>
                <div class="journal-entry-modal__meta">
                    Written at ${new Date(entry.createdAt).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit'
                    })}
                </div>
            </div>
        `;

        Modal.open({
            title: 'Journal Entry',
            content,
            footer: `
                <div class="modal__footer-actions">
                    <button class="btn btn--danger btn--ghost" id="deleteEntryBtn">
                        <i data-lucide="trash-2"></i>
                        Delete
                    </button>
                    <button class="btn btn--secondary" id="editEntryBtn">
                        <i data-lucide="edit-2"></i>
                        Edit
                    </button>
                    <button class="btn btn--primary" id="closeEntryBtn">
                        Close
                    </button>
                </div>
            `
        });

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Delete button
        document.getElementById('deleteEntryBtn')?.addEventListener('click', async () => {
            const confirmed = confirm('Are you sure you want to delete this entry?');
            if (confirmed) {
                const widgetData = getWidgetData(memberId);
                const entries = widgetData.entries.filter(e => e.id !== entry.id);
                saveWidgetData(memberId, { ...widgetData, entries });
                Toast.success('Entry deleted');
                Modal.close();
                if (onUpdate) onUpdate();
            }
        });

        // Edit button
        document.getElementById('editEntryBtn')?.addEventListener('click', () => {
            Modal.close();
            // Add delay to allow modal to fully close and cleanup before opening edit modal
            // Must be > 200ms to allow Modal.close() cleanup to finish
            setTimeout(() => {
                showEditModal(memberId, entry, onUpdate);
            }, 250);
        });

        // Close button
        document.getElementById('closeEntryBtn')?.addEventListener('click', () => {
            Modal.close();
        });
    }

    function init() {
        // Initialize journal feature
    }

    return {
        init,
        renderWidget,
        showJournalPage,
        // Public API for Gratitude widget integration
        saveGratitudeOnly,
        getTodayGratitude,
        getGratitudeEntries,
        getWidgetData,
        calculateStreak
    };
})();
