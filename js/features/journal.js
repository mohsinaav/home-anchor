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
     * Check if user has written today
     */
    function hasWrittenToday(entries) {
        const today = DateUtils.today();
        return entries.some(e => e.date === today);
    }

    /**
     * Get today's entry
     */
    function getTodayEntry(entries) {
        const today = DateUtils.today();
        return entries.find(e => e.date === today);
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

        container.innerHTML = `
            <div class="journal-widget">
                <div class="journal-widget__locked">
                    <div class="journal-widget__header">
                        <div class="journal-widget__streak ${streak > 0 ? 'journal-widget__streak--active' : ''}">
                            <i data-lucide="flame"></i>
                            <span>${streak} day${streak !== 1 ? 's' : ''}</span>
                        </div>
                        ${writtenToday ? `
                            <span class="journal-widget__badge">
                                <i data-lucide="check-circle"></i>
                                Written today
                            </span>
                        ` : ''}
                    </div>

                    <div class="journal-widget__notebook">
                        <div class="journal-widget__cover">
                            <i data-lucide="notebook-pen"></i>
                            <h3>My Journal</h3>
                            <p class="journal-widget__cover-prompt">${prompt}</p>
                        </div>
                    </div>

                    <div class="journal-widget__actions">
                        <button class="btn btn--primary btn--block" data-action="open-journal" data-member-id="${memberId}">
                            <i data-lucide="lock"></i>
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
    function showJournalPage(memberId) {
        const main = document.getElementById('mainContent');
        if (!main) return;

        const member = Storage.getMember(memberId);
        renderJournalPage(main, memberId, member);
    }

    /**
     * Render the journal page
     */
    function renderJournalPage(container, memberId, member) {
        const widgetData = getWidgetData(memberId);
        const entries = widgetData.entries || [];
        const streak = calculateStreak(entries);
        const todayEntry = getTodayEntry(entries);
        const prompt = getDailyPrompt();

        container.innerHTML = `
            <div class="journal-page">
                <div class="journal-page__header">
                    <button class="btn btn--ghost" id="backToMemberBtn">
                        <i data-lucide="arrow-left"></i>
                        Back to ${member?.name || 'Dashboard'}
                    </button>
                    <h1 class="journal-page__title">
                        <i data-lucide="notebook-pen"></i>
                        My Journal
                    </h1>
                    <div class="journal-page__stats">
                        <div class="journal-stat">
                            <i data-lucide="flame"></i>
                            <span>${streak} day streak</span>
                        </div>
                        <div class="journal-stat">
                            <i data-lucide="book-heart"></i>
                            <span>${entries.length} entries</span>
                        </div>
                    </div>
                </div>

                <div class="journal-page__content">
                    <!-- Today's Entry / Write Section -->
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

                            ${!todayEntry ? `
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
                            ` : `
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
                            `}
                        </div>
                    </div>

                    <!-- Past Entries -->
                    ${entries.filter(e => e.date !== DateUtils.today()).length > 0 ? `
                        <div class="journal-history">
                            <h2 class="journal-history__title">
                                <i data-lucide="history"></i>
                                Past Entries
                            </h2>
                            <div class="journal-history__list">
                                ${entries
                                    .filter(e => e.date !== DateUtils.today())
                                    .slice(0, 10)
                                    .map(entry => {
                                        const mood = getMoodById(entry.mood);
                                        const entryDate = new Date(entry.date);
                                        return `
                                            <div class="journal-history__entry" data-entry-id="${entry.id}">
                                                <div class="journal-history__entry-header">
                                                    <span class="journal-history__entry-date">
                                                        ${entryDate.toLocaleDateString('en-US', {
                                                            weekday: 'short',
                                                            month: 'short',
                                                            day: 'numeric'
                                                        })}
                                                    </span>
                                                    ${mood ? `
                                                        <span class="journal-history__entry-mood"
                                                              style="--mood-color: ${mood.color}">
                                                            ${mood.emoji}
                                                        </span>
                                                    ` : ''}
                                                </div>
                                                <div class="journal-history__entry-preview">
                                                    ${entry.content.length > 150
                                                        ? entry.content.substring(0, 150) + '...'
                                                        : entry.content}
                                                </div>
                                            </div>
                                        `;
                                    }).join('')}
                            </div>
                            ${entries.filter(e => e.date !== DateUtils.today()).length > 10 ? `
                                <button class="btn btn--ghost btn--block" id="viewAllBtn">
                                    <i data-lucide="notebook-pen"></i>
                                    View All Entries (${entries.length - 1})
                                </button>
                            ` : ''}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Bind events
        bindJournalPageEvents(container, memberId, member, todayEntry);
    }

    /**
     * Bind journal page events
     */
    function bindJournalPageEvents(container, memberId, member, todayEntry) {
        let selectedMood = null;

        // Back button
        document.getElementById('backToMemberBtn')?.addEventListener('click', () => {
            State.emit('tabChanged', memberId);
        });

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
            renderJournalPage(container, memberId, member);
        });

        // Edit today's entry
        document.getElementById('editTodayBtn')?.addEventListener('click', () => {
            showEditModal(memberId, todayEntry, () => {
                renderJournalPage(container, memberId, member);
            });
        });

        // View past entry
        container.querySelectorAll('.journal-history__entry').forEach(card => {
            card.addEventListener('click', () => {
                const entryId = card.dataset.entryId;
                const widgetData = getWidgetData(memberId);
                const entry = widgetData.entries.find(e => e.id === entryId);
                if (entry) {
                    showEntryModal(memberId, entry, () => {
                        renderJournalPage(container, memberId, member);
                    });
                }
            });
        });

        // View all entries
        document.getElementById('viewAllBtn')?.addEventListener('click', () => {
            showAllEntriesPage(memberId, member);
        });
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
        const mood = getMoodById(entry.mood);
        const entryDate = new Date(entry.date);

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
            showEditModal(memberId, entry, onUpdate);
        });

        // Close button
        document.getElementById('closeEntryBtn')?.addEventListener('click', () => {
            Modal.close();
        });
    }

    /**
     * Show all entries page
     */
    function showAllEntriesPage(memberId, member) {
        const main = document.getElementById('mainContent');
        if (!main) return;

        const widgetData = getWidgetData(memberId);
        const entries = widgetData.entries || [];

        // Group entries by month
        const groupedEntries = {};
        entries.forEach(entry => {
            const date = new Date(entry.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const monthLabel = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });

            if (!groupedEntries[monthKey]) {
                groupedEntries[monthKey] = {
                    label: monthLabel,
                    entries: []
                };
            }
            groupedEntries[monthKey].entries.push(entry);
        });

        main.innerHTML = `
            <div class="journal-all-entries">
                <div class="journal-page__header">
                    <button class="btn btn--ghost" id="backToJournalBtn">
                        <i data-lucide="arrow-left"></i>
                        Back to Journal
                    </button>
                    <h1 class="journal-page__title">
                        <i data-lucide="notebook-pen"></i>
                        All Entries
                    </h1>
                    <span class="journal-all-entries__count">${entries.length} entries</span>
                </div>

                <div class="journal-all-entries__content">
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
                                            const entryDate = new Date(entry.date);
                                            return `
                                                <div class="journal-history__entry" data-entry-id="${entry.id}">
                                                    <div class="journal-history__entry-header">
                                                        <span class="journal-history__entry-date">
                                                            ${entryDate.toLocaleDateString('en-US', {
                                                                weekday: 'short',
                                                                month: 'short',
                                                                day: 'numeric'
                                                            })}
                                                        </span>
                                                        ${mood ? `
                                                            <span class="journal-history__entry-mood"
                                                                  style="--mood-color: ${mood.color}">
                                                                ${mood.emoji}
                                                            </span>
                                                        ` : ''}
                                                    </div>
                                                    <div class="journal-history__entry-preview">
                                                        ${entry.content.length > 150
                                                            ? entry.content.substring(0, 150) + '...'
                                                            : entry.content}
                                                    </div>
                                                </div>
                                            `;
                                        }).join('')}
                                    </div>
                                </div>
                            `;
                        }).join('')}
                </div>
            </div>
        `;

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Back button
        document.getElementById('backToJournalBtn')?.addEventListener('click', () => {
            renderJournalPage(main, memberId, member);
        });

        // Entry click
        main.querySelectorAll('.journal-history__entry').forEach(card => {
            card.addEventListener('click', () => {
                const entryId = card.dataset.entryId;
                const entry = entries.find(e => e.id === entryId);
                if (entry) {
                    showEntryModal(memberId, entry, () => {
                        showAllEntriesPage(memberId, member);
                    });
                }
            });
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
