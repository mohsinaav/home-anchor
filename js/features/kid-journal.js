/**
 * Kid Journal Feature
 * A journal widget for kids to write, reflect, and track their mood
 */

const KidJournal = (function() {
    // Maximum entries to show in widget preview
    const MAX_WIDGET_ENTRIES = 3;

    // Mood options with emojis and colors
    const MOODS = [
        { id: 'happy', emoji: '😊', name: 'Happy', color: '#FCD34D' },
        { id: 'sad', emoji: '😢', name: 'Sad', color: '#93C5FD' },
        { id: 'excited', emoji: '🤩', name: 'Excited', color: '#F472B6' },
        { id: 'calm', emoji: '😌', name: 'Calm', color: '#86EFAC' },
        { id: 'angry', emoji: '😠', name: 'Angry', color: '#FCA5A5' },
        { id: 'tired', emoji: '😴', name: 'Tired', color: '#C4B5FD' },
        { id: 'silly', emoji: '🤪', name: 'Silly', color: '#FDBA74' }
    ];

    // Daily prompts for inspiration
    const PROMPTS = [
        "What made you happy today?",
        "What did you learn today?",
        "Who did you play with?",
        "What are you thankful for?",
        "What was the best part of your day?",
        "What do you want to do tomorrow?",
        "How did you help someone today?",
        "What was something funny that happened?",
        "What was hard today? How did you handle it?",
        "Describe your favorite moment today"
    ];

    // Sticker options (shown after entry)
    const STICKERS = [
        '⚽', '🏀', '🎮', '📚', '🎨', '🎵', '🎂', '🍕', '🌟', '❤️',
        '🐶', '🐱', '🦋', '🌈', '🚀', '🎪', '🏖️', '🎃', '🎄', '🎁',
        '🎈', '🎯', '🏆', '🎸', '🎤', '🎬', '🍦', '🌸', '🦄', '🐳'
    ];

    // Text emojis (can be inserted into journal text)
    const TEXT_EMOJIS = [
        '😊', '😄', '😁', '🥰', '😍', '🤗', '😎', '🤩', '😜', '😋',
        '😢', '😭', '😤', '😡', '🥺', '😴', '🤔', '🙄', '😇', '🤭',
        '❤️', '💖', '💕', '✨', '🌟', '⭐', '🎉', '🎊', '🔥', '💪',
        '👍', '👏', '🙌', '🤝', '✌️', '🤞', '👋', '🥳', '🎈', '🎁'
    ];

    /**
     * Get widget data with defaults
     */
    function getWidgetData(memberId) {
        const stored = Storage.getWidgetData(memberId, 'kid-journal');
        if (!stored || !stored.entries) {
            return {
                entries: [],
                settings: { showPrompts: true }
            };
        }
        return stored;
    }

    /**
     * Save widget data
     */
    function saveWidgetData(memberId, data) {
        Storage.setWidgetData(memberId, 'kid-journal', data);
    }

    /**
     * Check if member can set journal password
     * Teens always can, kids only if setting is enabled
     */
    function canSetPassword(memberId) {
        const member = Storage.getMember(memberId);
        if (!member) return false;

        if (member.type === 'teen') {
            return true; // Teens always can
        }

        if (member.type === 'kid') {
            const settings = Storage.getSettings();
            return settings.allowKidsJournalPassword === true;
        }

        return false;
    }

    /**
     * Get journal password for a member
     */
    function getJournalPassword(memberId) {
        const widgetData = getWidgetData(memberId);
        return widgetData.settings?.journalPassword || null;
    }

    /**
     * Set journal password for a member
     */
    function setJournalPassword(memberId, password) {
        const widgetData = getWidgetData(memberId);
        if (!widgetData.settings) widgetData.settings = {};
        widgetData.settings.journalPassword = password;
        saveWidgetData(memberId, widgetData);
    }

    /**
     * Remove journal password for a member
     */
    function removeJournalPassword(memberId) {
        const widgetData = getWidgetData(memberId);
        if (widgetData.settings) {
            delete widgetData.settings.journalPassword;
            saveWidgetData(memberId, widgetData);
        }
    }

    /**
     * Show password verification modal
     * Returns a promise that resolves to true if verified, false otherwise
     * Note: If password setting is disabled for kids, bypass verification
     */
    function verifyPassword(memberId) {
        return new Promise((resolve) => {
            const password = getJournalPassword(memberId);
            // If no password set, allow access
            if (!password) {
                resolve(true);
                return;
            }

            // If password setting is disabled (admin turned it off), bypass verification
            // This gives parents/admin control over kid journal access
            if (!canSetPassword(memberId)) {
                resolve(true);
                return;
            }

            let resolved = false;
            const safeResolve = (value) => {
                if (!resolved) {
                    resolved = true;
                    resolve(value);
                }
            };

            Modal.open({
                title: 'Enter Password',
                content: `
                    <div class="journal-password-verify">
                        <p style="margin-bottom: var(--space-4); color: var(--gray-600);">
                            Enter your secret password to open your diary.
                        </p>
                        <input type="password" id="journalPasswordInput" class="form-input"
                               placeholder="Your password" maxlength="20" autocomplete="off">
                        <p id="passwordError" style="color: var(--danger); font-size: var(--text-sm); margin-top: var(--space-2); display: none;">
                            Wrong password! Try again.
                        </p>
                    </div>
                `,
                footer: `
                    <button class="btn btn--secondary" data-modal-cancel>Cancel</button>
                    <button class="btn btn--primary" id="verifyPasswordBtn">
                        <i data-lucide="unlock"></i>
                        Open
                    </button>
                `
            });

            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }

            const input = document.getElementById('journalPasswordInput');
            const verifyBtn = document.getElementById('verifyPasswordBtn');
            const errorEl = document.getElementById('passwordError');

            // Focus input
            setTimeout(() => input?.focus(), 100);

            const checkPassword = () => {
                const entered = input?.value || '';
                if (entered === password) {
                    Modal.close();
                    safeResolve(true);
                } else {
                    errorEl.style.display = 'block';
                    input.value = '';
                    input?.focus();
                }
            };

            verifyBtn?.addEventListener('click', checkPassword);
            input?.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') checkPassword();
            });

            // Handle cancel
            document.querySelector('[data-modal-cancel]')?.addEventListener('click', () => {
                safeResolve(false);
            });

            // Handle modal close (backdrop click, etc)
            const modalOverlay = document.querySelector('.modal__overlay');
            modalOverlay?.addEventListener('click', (e) => {
                if (e.target === modalOverlay) {
                    safeResolve(false);
                }
            });
        });
    }

    /**
     * Show password setup/change modal
     */
    function showPasswordSetupModal(memberId, onComplete) {
        const currentPassword = getJournalPassword(memberId);
        const hasPassword = !!currentPassword;

        Modal.open({
            title: hasPassword ? 'Change Password' : 'Set Password',
            content: `
                <div class="journal-password-setup">
                    <p style="margin-bottom: var(--space-4); color: var(--gray-600);">
                        ${hasPassword
                            ? 'Enter your current password and a new password.'
                            : 'Create a secret password to keep your diary private.'}
                    </p>

                    ${hasPassword ? `
                        <div class="form-group">
                            <label class="form-label">Current Password</label>
                            <input type="password" id="currentJournalPassword" class="form-input"
                                   placeholder="Your current password" maxlength="20" autocomplete="off">
                        </div>
                    ` : ''}

                    <div class="form-group">
                        <label class="form-label">New Password</label>
                        <input type="password" id="newJournalPassword" class="form-input"
                               placeholder="Create a password" maxlength="20" autocomplete="off">
                    </div>

                    <div class="form-group">
                        <label class="form-label">Confirm Password</label>
                        <input type="password" id="confirmJournalPassword" class="form-input"
                               placeholder="Type it again" maxlength="20" autocomplete="off">
                    </div>

                    <p id="setupPasswordError" style="color: var(--danger); font-size: var(--text-sm); margin-top: var(--space-2); display: none;"></p>

                    ${hasPassword ? `
                        <div style="margin-top: var(--space-4); padding-top: var(--space-4); border-top: 1px solid var(--gray-200);">
                            <button class="btn btn--danger btn--ghost btn--sm" id="removePasswordBtn">
                                <i data-lucide="trash-2"></i>
                                Remove Password
                            </button>
                        </div>
                    ` : ''}
                </div>
            `,
            footer: `
                <button class="btn btn--secondary" data-modal-cancel>Cancel</button>
                <button class="btn btn--primary" id="savePasswordBtn">
                    <i data-lucide="lock"></i>
                    ${hasPassword ? 'Update Password' : 'Set Password'}
                </button>
            `
        });

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        const currentInput = document.getElementById('currentJournalPassword');
        const newInput = document.getElementById('newJournalPassword');
        const confirmInput = document.getElementById('confirmJournalPassword');
        const saveBtn = document.getElementById('savePasswordBtn');
        const removeBtn = document.getElementById('removePasswordBtn');
        const errorEl = document.getElementById('setupPasswordError');

        const showError = (msg) => {
            errorEl.textContent = msg;
            errorEl.style.display = 'block';
        };

        saveBtn?.addEventListener('click', () => {
            errorEl.style.display = 'none';

            // Validate current password if changing
            if (hasPassword && currentInput?.value !== currentPassword) {
                showError('Current password is incorrect.');
                return;
            }

            const newPassword = newInput?.value || '';
            const confirmPassword = confirmInput?.value || '';

            if (newPassword.length < 4) {
                showError('Password must be at least 4 characters.');
                return;
            }

            if (newPassword !== confirmPassword) {
                showError('Passwords do not match.');
                return;
            }

            setJournalPassword(memberId, newPassword);
            Modal.close();
            Toast.success(hasPassword ? 'Password updated!' : 'Password set!');
            if (onComplete) onComplete();
        });

        removeBtn?.addEventListener('click', () => {
            if (currentInput?.value !== currentPassword) {
                showError('Enter your current password to remove it.');
                return;
            }

            removeJournalPassword(memberId);
            Modal.close();
            Toast.success('Password removed.');
            if (onComplete) onComplete();
        });
    }

    /**
     * Get today's prompt (rotates daily based on day of year)
     */
    function getTodayPrompt() {
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 0);
        const diff = now - start;
        const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
        return PROMPTS[dayOfYear % PROMPTS.length];
    }

    /**
     * Get mood by ID
     */
    function getMoodById(moodId) {
        return MOODS.find(m => m.id === moodId) || MOODS[0];
    }

    /**
     * Format date for display
     */
    function formatDate(dateStr) {
        // Handle both ISO string and YYYY-MM-DD format
        const date = new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00'));
        const options = { month: 'short', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }

    /**
     * Get today's date string in local timezone (YYYY-MM-DD)
     */
    function getToday() {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }

    /**
     * Get local date string from Date object (YYYY-MM-DD)
     */
    function getLocalDateString(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    /**
     * Check if kid already has an entry for today
     */
    function hasEntryToday(entries) {
        const today = getToday();
        return entries.some(e => getEntryDate(e) === today);
    }

    /**
     * Get the date part from an entry (handles both old ISO format and new format)
     */
    function getEntryDate(entry) {
        // If entry has a date field, use it; otherwise extract from createdAt
        if (entry.date) return entry.date;
        // Convert ISO string to local date
        const d = new Date(entry.createdAt);
        return getLocalDateString(d);
    }

    /**
     * Truncate text
     */
    function truncate(text, maxLength = 50) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    /**
     * Render the journal widget
     */
    function renderWidget(container, memberId) {
        const widgetData = getWidgetData(memberId);
        const entries = widgetData.entries || [];
        const recentEntries = entries.slice(0, MAX_WIDGET_ENTRIES);
        const todayPrompt = getTodayPrompt();
        const showPrompts = widgetData.settings?.showPrompts !== false;
        const alreadyWroteToday = hasEntryToday(entries);
        const todayEntry = alreadyWroteToday ? entries.find(e => getEntryDate(e) === getToday()) : null;

        // Calculate streak for display
        const streak = calculateStreak(entries);

        // Check if personal password is set AND feature is enabled
        // If setting is disabled, don't show lock even if password exists
        const hasActivePassword = !!getJournalPassword(memberId) && canSetPassword(memberId);

        container.innerHTML = `
            <div class="kid-journal-widget">
                <div class="kid-journal-widget__header">
                    <div class="kid-journal-widget__streak ${streak > 0 ? 'kid-journal-widget__streak--active' : ''}">
                        <span class="kid-journal-widget__streak-icon">🔥</span>
                        <span>${streak} day${streak !== 1 ? 's' : ''}</span>
                    </div>
                    ${alreadyWroteToday ? `
                        <span class="kid-journal-widget__badge">
                            <span>✅</span>
                            Written today!
                        </span>
                    ` : ''}
                </div>

                <div class="kid-journal-widget__diary">
                    <div class="kid-journal-widget__cover">
                        <div class="kid-journal-widget__cover-deco kid-journal-widget__cover-deco--star">⭐</div>
                        <div class="kid-journal-widget__cover-deco kid-journal-widget__cover-deco--heart">💖</div>
                        <div class="kid-journal-widget__cover-icon">📔</div>
                        <h3 class="kid-journal-widget__cover-title">My Diary</h3>
                        <p class="kid-journal-widget__cover-prompt">${todayPrompt}</p>
                    </div>
                </div>

                <div class="kid-journal-widget__actions">
                    <button class="btn btn--primary btn--block kid-journal-widget__open-btn" data-action="open-journal">
                        <span class="kid-journal-widget__open-icon">${hasActivePassword ? '🔒' : '✏️'}</span>
                        ${alreadyWroteToday ? 'View My Diary' : 'Write in My Diary'}
                    </button>
                    ${!alreadyWroteToday ? `
                        <div class="kid-journal-widget__points-hint">
                            <span>⭐</span> Write today for <strong>+5 points!</strong>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Bind open journal button
        container.querySelector('[data-action="open-journal"]')?.addEventListener('click', async () => {
            // Verify personal password if set
            const verified = await verifyPassword(memberId);
            if (!verified) return;
            showFullPage(memberId, 'write');
        });
    }

    /**
     * Render entry preview for widget
     */
    function renderEntryPreview(entry) {
        const mood = getMoodById(entry.mood);
        const stickersHtml = entry.stickers?.length > 0
            ? `<span class="kid-journal-entry-preview__stickers">${entry.stickers.slice(0, 3).join('')}</span>`
            : '';

        return `
            <div class="kid-journal-entry-preview" data-entry-id="${entry.id}">
                <span class="kid-journal-entry-preview__mood" style="--mood-color: ${mood.color}">
                    ${mood.emoji}
                </span>
                <div class="kid-journal-entry-preview__content">
                    <span class="kid-journal-entry-preview__date">${formatDate(entry.createdAt)}</span>
                    <span class="kid-journal-entry-preview__text">${truncate(entry.content)}</span>
                </div>
                ${stickersHtml}
            </div>
        `;
    }

    /**
     * Bind widget events
     */
    function bindWidgetEvents(container, memberId, widgetData) {
        let selectedMood = null;
        let selectedStickers = [];

        // Mood selection
        container.querySelectorAll('.kid-journal-mood-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                container.querySelectorAll('.kid-journal-mood-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                selectedMood = btn.dataset.mood;
            });
        });

        // Toggle stickers panel
        container.querySelector('[data-action="add-stickers"]')?.addEventListener('click', () => {
            const panel = container.querySelector('#stickersPanel');
            if (panel) {
                panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
            }
        });

        // Sticker selection
        container.querySelectorAll('.kid-journal-sticker-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const sticker = btn.dataset.sticker;
                if (!selectedStickers.includes(sticker) && selectedStickers.length < 5) {
                    selectedStickers.push(sticker);
                    updateSelectedStickers(container, selectedStickers);
                }
            });
        });

        // Save entry
        container.querySelector('#saveJournalBtn')?.addEventListener('click', () => {
            const textarea = container.querySelector('#journalInput');
            const content = textarea?.value?.trim();

            if (!content) {
                Toast.warning('Please write something first!');
                return;
            }

            if (!selectedMood) {
                Toast.warning('Please select how you feel!');
                return;
            }

            // Check if already wrote today
            if (hasEntryToday(widgetData.entries || [])) {
                Toast.warning('You already wrote today! Come back tomorrow.');
                return;
            }

            const today = getToday();
            const newEntry = {
                id: `journal-${Date.now()}`,
                content,
                mood: selectedMood,
                stickers: [...selectedStickers],
                prompt: widgetData.settings?.showPrompts ? getTodayPrompt() : null,
                date: today, // Store local date separately
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            widgetData.entries = [newEntry, ...(widgetData.entries || [])];
            saveWidgetData(memberId, widgetData);

            // Award points for daily journal entry based on member type
            const member = Storage.getMember(memberId);
            const settings = Storage.getSettings();
            const pointsConfig = settings.pointsConfig || {};

            // Determine points based on member type
            let journalPoints = 5; // Default fallback
            if (member) {
                if (member.type === 'kid') {
                    journalPoints = pointsConfig.kidTaskPoints !== undefined ? pointsConfig.kidTaskPoints : 3;
                } else if (member.type === 'teen') {
                    journalPoints = pointsConfig.teenTaskPoints !== undefined ? pointsConfig.teenTaskPoints : 5;
                }
            }

            const pointsData = Storage.getWidgetData(memberId, 'points');
            if (pointsData && journalPoints > 0) {
                const updatedPointsData = {
                    ...pointsData,
                    balance: (pointsData.balance || 0) + journalPoints,
                    history: [
                        { activityId: newEntry.id, activityName: 'Daily Journal Entry', date: today, points: journalPoints, type: 'earned' },
                        ...(pointsData.history || []).slice(0, 99)
                    ]
                };
                Storage.setWidgetData(memberId, 'points', updatedPointsData);

                // Refresh points widget if visible
                const pointsBody = document.getElementById('widget-points');
                if (pointsBody && typeof Points !== 'undefined') {
                    Points.renderWidget(pointsBody, memberId);
                    if (typeof lucide !== 'undefined') {
                        lucide.createIcons();
                    }
                }
            }

            // Update achievements
            if (typeof Achievements !== 'undefined') {
                Achievements.updateStats(memberId, 'activity', 1);
                Achievements.updateStats(memberId, 'points', 5);
            }

            renderWidget(container, memberId);
            Toast.success('+5 points! Great job writing today! ✨');
        });

        // View all entries
        container.querySelector('[data-action="view-all"]')?.addEventListener('click', () => {
            showFullPage(memberId, 'list');
        });

        // Calendar view
        container.querySelector('[data-action="calendar-view"]')?.addEventListener('click', () => {
            showFullPage(memberId, 'calendar');
        });

        // Click on entry preview to view full page
        container.querySelectorAll('.kid-journal-entry-preview').forEach(preview => {
            preview.addEventListener('click', () => {
                showFullPage(memberId, 'list');
            });
        });

        // Toggle emoji panel
        const emojiToggleBtn = container.querySelector('#emojiToggleBtn');
        const emojiPanel = container.querySelector('#emojiPanel');
        const journalInput = container.querySelector('#journalInput');

        if (emojiToggleBtn && emojiPanel) {
            emojiToggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const isOpen = emojiPanel.style.display !== 'none';
                emojiPanel.style.display = isOpen ? 'none' : 'block';
                emojiToggleBtn.classList.toggle('active', !isOpen);
            });

            // Insert emoji into textarea at cursor position
            container.querySelectorAll('.kid-journal-emoji-item').forEach(btn => {
                btn.addEventListener('click', () => {
                    const emoji = btn.dataset.emoji;
                    if (journalInput) {
                        const start = journalInput.selectionStart;
                        const end = journalInput.selectionEnd;
                        const text = journalInput.value;
                        journalInput.value = text.substring(0, start) + emoji + text.substring(end);
                        journalInput.focus();
                        journalInput.selectionStart = journalInput.selectionEnd = start + emoji.length;
                    }
                });
            });

            // Close emoji panel when clicking outside
            document.addEventListener('click', (e) => {
                if (!emojiPanel.contains(e.target) && e.target !== emojiToggleBtn) {
                    emojiPanel.style.display = 'none';
                    emojiToggleBtn.classList.remove('active');
                }
            });
        }
    }

    /**
     * Update selected stickers display
     */
    function updateSelectedStickers(container, stickers) {
        const display = container.querySelector('#selectedStickers');
        if (display) {
            display.innerHTML = stickers.map(s => `
                <span class="kid-journal-selected-sticker" data-remove="${s}">${s}</span>
            `).join('');

            display.querySelectorAll('[data-remove]').forEach(el => {
                el.addEventListener('click', () => {
                    const idx = stickers.indexOf(el.dataset.remove);
                    if (idx > -1) stickers.splice(idx, 1);
                    updateSelectedStickers(container, stickers);
                });
            });
        }
    }

    /**
     * Show full page view
     */
    function showFullPage(memberId, view = 'write') {
        const main = document.getElementById('mainContent');
        if (!main) return;

        const member = Storage.getMember(memberId);
        // Both kids and teens default to 'write' tab
        renderFullPage(main, memberId, member, view);
    }

    /**
     * Render full page
     */
    function renderFullPage(container, memberId, member, currentView = 'write') {
        // Teens use adult-style layout
        if (member?.type === 'teen') {
            renderTeenFullPage(container, memberId, member, currentView);
            return;
        }

        const widgetData = getWidgetData(memberId);
        const entries = widgetData.entries || [];

        // Calculate stats
        const totalEntries = entries.length;
        const streak = calculateStreak(entries);
        const moodCounts = {};
        entries.forEach(e => {
            moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
        });
        const mostCommonMood = Object.keys(moodCounts).length > 0
            ? Object.keys(moodCounts).reduce((a, b) => moodCounts[a] > moodCounts[b] ? a : b)
            : null;
        const mostCommonMoodObj = mostCommonMood ? getMoodById(mostCommonMood) : null;

        // Check if user can set password
        const showPasswordOption = canSetPassword(memberId);
        const hasPassword = !!getJournalPassword(memberId);

        // Get age-adaptive content
        const useKidTheme = typeof KidTheme !== 'undefined';
        const ageGroup = useKidTheme ? KidTheme.getAgeGroup(member) : 'kid';
        const isYoungKid = ageGroup === 'kid' || ageGroup === 'toddler';
        const colors = useKidTheme ? KidTheme.getColors('kid-journal') : { gradient: 'linear-gradient(135deg, #FCE7F3 0%, #FBCFE8 50%, #F9A8D4 100%)' };

        // Define tabs - Write tab first for kids
        const tabs = [
            { id: 'write', label: 'Write', icon: 'pen-line', emoji: '✏️' },
            { id: 'list', label: 'Entries', icon: 'list', emoji: '📝' },
            { id: 'calendar', label: 'Calendar', icon: 'calendar', emoji: '📅' }
        ];

        // Render tab content
        let tabContent;
        if (currentView === 'write') {
            tabContent = renderWriteTab(memberId, member, widgetData);
        } else if (currentView === 'calendar') {
            tabContent = renderCalendarView(entries, memberId);
        } else {
            tabContent = renderListView(entries, memberId);
        }

        container.innerHTML = `
            <div class="kid-page kid-page--journal ${useKidTheme ? KidTheme.getAgeClass(member) : ''}">
                <!-- Hero Section -->
                <div class="kid-page__hero" style="background: ${colors.gradient}; --kid-hero-text: ${colors.dark}">
                    <button class="btn btn--ghost kid-page__back" id="backToMemberBtn">
                        <i data-lucide="arrow-left"></i>
                        Back
                    </button>
                    <div class="kid-page__hero-content">
                        <h1 class="kid-page__hero-title ${isYoungKid ? 'kid-page__hero-title--playful' : ''}">
                            ${isYoungKid ? '📔 My Journal!' : 'My Journal'}
                        </h1>
                    </div>
                    <div class="kid-page__hero-stats">
                        <div class="kid-hero-stat">
                            <span class="kid-hero-stat__value">${totalEntries}</span>
                            <span class="kid-hero-stat__label">${isYoungKid ? '📝 Entries' : 'Total Entries'}</span>
                        </div>
                        <div class="kid-hero-stat">
                            <span class="kid-hero-stat__value">${streak > 0 ? `${streak}` : '0'}</span>
                            <span class="kid-hero-stat__label">${isYoungKid ? '🔥 Streak' : 'Day Streak'}</span>
                        </div>
                        ${mostCommonMoodObj ? `
                            <div class="kid-hero-stat">
                                <span class="kid-hero-stat__value">${mostCommonMoodObj.emoji}</span>
                                <span class="kid-hero-stat__label">${isYoungKid ? 'Most ' + mostCommonMoodObj.name : 'Top Mood'}</span>
                            </div>
                        ` : ''}
                    </div>
                    ${showPasswordOption ? `
                        <button class="btn btn--sm btn--ghost kid-page__hero-action" id="journalSettingsBtn" title="${hasPassword ? 'Change password' : 'Set password'}">
                            <i data-lucide="${hasPassword ? 'lock' : 'lock-open'}"></i>
                        </button>
                    ` : ''}
                </div>

                <!-- Tab Navigation -->
                <div class="kid-page__tabs">
                    ${tabs.map(t => `
                        <button class="kid-page__tab ${t.id === currentView ? 'kid-page__tab--active' : ''}" data-view="${t.id}">
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

        bindFullPageEvents(container, memberId, member, widgetData, currentView);
    }

    /**
     * Render Write tab content for kids - Notebook style
     */
    function renderWriteTab(memberId, member, widgetData) {
        const entries = widgetData.entries || [];
        const todayEntry = entries.find(e => getEntryDate(e) === getToday());
        const writtenToday = hasEntryToday(entries);
        const todayPrompt = getTodayPrompt();

        const useKidTheme = typeof KidTheme !== 'undefined';
        const ageGroup = useKidTheme ? KidTheme.getAgeGroup(member) : 'kid';
        const isYoungKid = ageGroup === 'kid' || ageGroup === 'toddler';

        if (todayEntry) {
            // Show today's entry with option to edit - same style as entries tab
            const mood = getMoodById(todayEntry.mood);
            const time = new Date(todayEntry.createdAt).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
            return `
                <div class="kid-journal-write-tab">
                    <div class="kid-journal-entry kid-journal-entry--today">
                        <div class="kid-journal-entry__header">
                            ${mood ? `
                                <span class="kid-journal-entry__mood" style="--mood-color: ${mood.color}">
                                    ${mood.emoji}
                                </span>
                            ` : ''}
                            <span class="kid-journal-entry__time">${time}</span>
                            ${todayEntry.stickers?.length > 0 ? `
                                <span class="kid-journal-entry__stickers">${todayEntry.stickers.join(' ')}</span>
                            ` : ''}
                        </div>
                        <div class="kid-journal-entry__content">
                            ${todayEntry.content.replace(/\n/g, '<br>')}
                        </div>
                        <div class="kid-journal-entry__actions">
                            <button class="btn btn--ghost btn--sm" id="editTodayBtn" data-entry-id="${todayEntry.id}">
                                <i data-lucide="edit-2"></i>
                                ${isYoungKid ? 'Edit' : 'Edit Entry'}
                            </button>
                        </div>
                    </div>
                    <p class="kid-journal-write-tab__hint">
                        ${isYoungKid ? '🌟 Come back tomorrow to write again!' : 'Come back tomorrow to continue your streak!'}
                    </p>
                </div>
            `;
        }

        // Show write form - same notebook style as entries
        return `
            <div class="kid-journal-write-tab">
                <div class="kid-journal-entry kid-journal-entry--write">
                    <div class="kid-journal-entry__prompt">
                        💡 ${todayPrompt}
                    </div>

                    <div class="kid-journal-write-form__mood-section">
                        <label class="kid-journal-write-form__label">
                            ${isYoungKid ? '😊 How do you feel?' : 'How are you feeling?'}
                        </label>
                        <div class="kid-journal-write-form__moods" id="kidMoodSelector">
                            ${MOODS.map(mood => `
                                <button class="kid-journal-mood-btn" data-mood="${mood.id}"
                                        style="--mood-color: ${mood.color}"
                                        title="${mood.name}">
                                    <span class="kid-journal-mood-btn__emoji">${mood.emoji}</span>
                                    <span class="kid-journal-mood-btn__label">${mood.name}</span>
                                </button>
                            `).join('')}
                        </div>
                    </div>

                    <div class="kid-journal-write-form__text-section">
                        <textarea
                            class="kid-journal-entry__textarea"
                            id="kidJournalEntry"
                            placeholder="${isYoungKid ? 'Start writing here...' : 'Start writing...'}"
                            rows="6"
                        ></textarea>
                    </div>

                    <div class="kid-journal-write-form__stickers-section">
                        <label class="kid-journal-write-form__label">
                            ${isYoungKid ? '🌟 Add stickers!' : 'Add stickers (optional)'}
                        </label>
                        <div class="kid-journal-write-form__stickers-grid" id="kidStickerSelector">
                            ${STICKERS.slice(0, 15).map(sticker => `
                                <button type="button" class="kid-journal-sticker-btn" data-sticker="${sticker}">
                                    ${sticker}
                                </button>
                            `).join('')}
                        </div>
                        <div class="kid-journal-write-form__selected-stickers" id="kidSelectedStickers"></div>
                    </div>

                    <div class="kid-journal-entry__actions">
                        <button class="btn btn--primary" id="kidSaveEntryBtn">
                            <i data-lucide="save"></i>
                            ${isYoungKid ? 'Save Entry ⭐' : 'Save Entry'}
                        </button>
                    </div>
                </div>
            </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render teen full page (adult-style layout with tabs)
     * Keeps password protection feature from kid journal
     */
    function renderTeenFullPage(container, memberId, member, activeTab = 'write') {
        const widgetData = getWidgetData(memberId);
        const entries = widgetData.entries || [];
        const streak = calculateStreak(entries);
        const todayEntry = getTodayEntry(entries);
        const writtenToday = hasEntryToday(entries);

        // Calculate best streak
        let bestStreak = 0;
        let currentStreakCalc = 0;
        const uniqueDates = [...new Set(entries.map(e => getEntryDate(e)))].sort();
        for (let i = 0; i < uniqueDates.length; i++) {
            if (i === 0) {
                currentStreakCalc = 1;
            } else {
                const prevDate = new Date(uniqueDates[i - 1] + 'T00:00:00');
                const currDate = new Date(uniqueDates[i] + 'T00:00:00');
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
        const monthEntries = entries.filter(e => {
            const entryDate = new Date(getEntryDate(e) + 'T00:00:00');
            return entryDate >= monthStart;
        });
        const monthDaysWithEntries = new Set(monthEntries.map(e => getEntryDate(e))).size;

        // Check if user can set password
        const showPasswordOption = canSetPassword(memberId);
        const hasPassword = !!getJournalPassword(memberId);

        container.innerHTML = `
            <div class="teen-journal-page">
                <!-- Hero Header -->
                <div class="kid-page__hero teen-journal-page__hero">
                    <button class="btn btn--ghost kid-page__back" id="backToMemberBtn">
                        <i data-lucide="arrow-left"></i>
                        Back
                    </button>
                    <div class="teen-journal-page__hero-content">
                        <h1 class="teen-journal-page__hero-title">
                            <i data-lucide="notebook-pen"></i>
                            My Journal
                        </h1>
                        <p class="teen-journal-page__hero-subtitle">Your private space for reflection</p>
                    </div>
                    <div class="teen-journal-page__hero-stats">
                        <div class="teen-journal-hero-stat">
                            <span class="teen-journal-hero-stat__value">${streak}</span>
                            <span class="teen-journal-hero-stat__label">Day Streak</span>
                        </div>
                        <div class="teen-journal-hero-stat">
                            <span class="teen-journal-hero-stat__value">${entries.length}</span>
                            <span class="teen-journal-hero-stat__label">Total Entries</span>
                        </div>
                        <div class="teen-journal-hero-stat">
                            <span class="teen-journal-hero-stat__value">${monthDaysWithEntries}</span>
                            <span class="teen-journal-hero-stat__label">This Month</span>
                        </div>
                    </div>
                    ${showPasswordOption ? `
                        <button class="btn btn--sm btn--ghost teen-journal-page__password-btn" id="journalSettingsBtn" title="${hasPassword ? 'Change password' : 'Set password'}">
                            <i data-lucide="${hasPassword ? 'lock' : 'lock-open'}"></i>
                        </button>
                    ` : ''}
                </div>

                <!-- Tab Navigation -->
                <div class="teen-journal-page__tabs">
                    <button class="teen-journal-tab ${activeTab === 'write' ? 'teen-journal-tab--active' : ''}" data-tab="write">
                        <i data-lucide="pen-line"></i>
                        Write
                    </button>
                    <button class="teen-journal-tab ${activeTab === 'history' ? 'teen-journal-tab--active' : ''}" data-tab="history">
                        <i data-lucide="history"></i>
                        History
                    </button>
                    <button class="teen-journal-tab ${activeTab === 'stats' ? 'teen-journal-tab--active' : ''}" data-tab="stats">
                        <i data-lucide="bar-chart-2"></i>
                        Stats
                    </button>
                </div>

                <!-- Tab Content -->
                <div class="teen-journal-page__content">
                    ${activeTab === 'write' ? renderTeenWriteTab(memberId, todayEntry, writtenToday) : ''}
                    ${activeTab === 'history' ? renderTeenHistoryTab(entries) : ''}
                    ${activeTab === 'stats' ? renderTeenStatsTab(entries, streak, bestStreak, monthDaysWithEntries) : ''}
                </div>
            </div>
        `;

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Bind events
        bindTeenPageEvents(container, memberId, member, activeTab, todayEntry, widgetData);
    }

    /**
     * Get today's entry
     */
    function getTodayEntry(entries) {
        const today = getToday();
        return entries.find(e => getEntryDate(e) === today);
    }

    /**
     * Render Teen Write Tab
     */
    function renderTeenWriteTab(memberId, todayEntry, writtenToday) {
        const prompt = getTodayPrompt();

        if (todayEntry) {
            // Show today's entry with edit option
            const mood = getMoodById(todayEntry.mood);
            return `
                <div class="teen-journal-write-section">
                    <div class="teen-journal-notebook">
                        <div class="teen-journal-notebook__paper">
                            <div class="teen-journal-notebook__date">
                                ${new Date().toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </div>
                            <div class="teen-journal-notebook__entry">
                                ${mood ? `
                                    <div class="teen-journal-notebook__entry-mood"
                                         style="--mood-color: ${mood.color}">
                                        <span class="teen-journal-mood__emoji">${mood.emoji}</span>
                                        <span>${mood.name}</span>
                                    </div>
                                ` : ''}
                                <div class="teen-journal-notebook__entry-content">
                                    ${todayEntry.content.replace(/\n/g, '<br>')}
                                </div>
                                ${todayEntry.stickers?.length > 0 ? `
                                    <div class="teen-journal-notebook__stickers">
                                        ${todayEntry.stickers.join(' ')}
                                    </div>
                                ` : ''}
                                <div class="teen-journal-notebook__entry-time">
                                    Written at ${new Date(todayEntry.createdAt).toLocaleTimeString('en-US', {
                                        hour: 'numeric',
                                        minute: '2-digit'
                                    })}
                                    ${todayEntry.updatedAt && todayEntry.updatedAt !== todayEntry.createdAt ?
                                        ` (edited)` : ''}
                                </div>
                                <button class="btn btn--ghost btn--sm" id="editTodayBtn" data-entry-id="${todayEntry.id}">
                                    <i data-lucide="edit-2"></i>
                                    Edit Entry
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        // Show inline write form (like adult journal)
        return `
            <div class="teen-journal-write-section">
                <div class="teen-journal-notebook">
                    <div class="teen-journal-notebook__paper">
                        <div class="teen-journal-notebook__date">
                            ${new Date().toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </div>

                        <div class="teen-journal-notebook__prompt">
                            <i data-lucide="sparkles"></i>
                            <span>${prompt}</span>
                        </div>

                        <div class="teen-journal-notebook__mood-section">
                            <label class="teen-journal-notebook__mood-label">How are you feeling?</label>
                            <div class="teen-journal-notebook__moods" id="teenMoodSelector">
                                ${MOODS.map(mood => `
                                    <button class="teen-journal-mood" data-mood="${mood.id}"
                                            style="--mood-color: ${mood.color}"
                                            title="${mood.name}">
                                        <span class="teen-journal-mood__emoji">${mood.emoji}</span>
                                        <span class="teen-journal-mood__label">${mood.name}</span>
                                    </button>
                                `).join('')}
                            </div>
                        </div>

                        <div class="teen-journal-notebook__write">
                            <textarea
                                class="teen-journal-notebook__textarea"
                                id="teenJournalEntry"
                                placeholder="Start writing..."
                                rows="6"
                            ></textarea>
                        </div>

                        <div class="teen-journal-notebook__stickers-section">
                            <label class="teen-journal-notebook__stickers-label">Add stickers (optional)</label>
                            <div class="teen-journal-notebook__stickers-grid" id="teenStickerSelector">
                                ${STICKERS.slice(0, 15).map(sticker => `
                                    <button type="button" class="teen-journal-sticker-btn" data-sticker="${sticker}">
                                        ${sticker}
                                    </button>
                                `).join('')}
                            </div>
                            <div class="teen-journal-selected-stickers" id="teenSelectedStickers"></div>
                        </div>

                        <div class="teen-journal-notebook__save">
                            <button class="btn btn--primary" id="teenSaveEntryBtn">
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
     * Render Teen History Tab
     */
    function renderTeenHistoryTab(entries) {
        const pastEntries = entries.filter(e => getEntryDate(e) !== getToday());

        if (pastEntries.length === 0) {
            return `
                <div class="teen-journal-history-section">
                    <div class="teen-journal-history-empty">
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
            const date = getEntryDate(entry);
            const [year, month] = date.split('-').map(Number);
            const monthKey = `${year}-${String(month).padStart(2, '0')}`;
            const dateObj = new Date(date + 'T00:00:00');
            const monthLabel = `${dateObj.toLocaleDateString('en-US', { month: 'long' })} ${year}`;

            if (!groupedEntries[monthKey]) {
                groupedEntries[monthKey] = {
                    label: monthLabel,
                    entries: []
                };
            }
            groupedEntries[monthKey].entries.push(entry);
        });

        return `
            <div class="teen-journal-history-section">
                ${Object.keys(groupedEntries)
                    .sort((a, b) => b.localeCompare(a))
                    .map(monthKey => {
                        const group = groupedEntries[monthKey];
                        return `
                            <div class="teen-journal-month-group">
                                <h3 class="teen-journal-month-group__title">${group.label}</h3>
                                <div class="teen-journal-history__list">
                                    ${group.entries.map(entry => {
                                        const mood = getMoodById(entry.mood);
                                        return `
                                            <div class="teen-journal-history__entry" data-entry-id="${entry.id}">
                                                <div class="teen-journal-history__entry-header">
                                                    <span class="teen-journal-history__entry-date">
                                                        ${formatDate(getEntryDate(entry))}
                                                    </span>
                                                    ${mood ? `
                                                        <span class="teen-journal-history__entry-mood"
                                                              style="--mood-color: ${mood.color}">
                                                            ${mood.emoji}
                                                        </span>
                                                    ` : ''}
                                                </div>
                                                <div class="teen-journal-history__entry-preview">
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
     * Render Teen Stats Tab
     */
    function renderTeenStatsTab(entries, streak, bestStreak, monthDaysWithEntries) {
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
            <div class="teen-journal-stats-section">
                <div class="teen-journal-stats-grid">
                    <div class="teen-journal-stat-card teen-journal-stat-card--primary">
                        <div class="teen-journal-stat-card__icon">
                            <i data-lucide="flame"></i>
                        </div>
                        <div class="teen-journal-stat-card__info">
                            <span class="teen-journal-stat-card__value">${streak}</span>
                            <span class="teen-journal-stat-card__label">Current Streak</span>
                        </div>
                    </div>
                    <div class="teen-journal-stat-card teen-journal-stat-card--success">
                        <div class="teen-journal-stat-card__icon">
                            <i data-lucide="trophy"></i>
                        </div>
                        <div class="teen-journal-stat-card__info">
                            <span class="teen-journal-stat-card__value">${bestStreak}</span>
                            <span class="teen-journal-stat-card__label">Best Streak</span>
                        </div>
                    </div>
                    <div class="teen-journal-stat-card teen-journal-stat-card--info">
                        <div class="teen-journal-stat-card__icon">
                            <i data-lucide="book-heart"></i>
                        </div>
                        <div class="teen-journal-stat-card__info">
                            <span class="teen-journal-stat-card__value">${entries.length}</span>
                            <span class="teen-journal-stat-card__label">Total Entries</span>
                        </div>
                    </div>
                    <div class="teen-journal-stat-card teen-journal-stat-card--warning">
                        <div class="teen-journal-stat-card__icon">
                            <i data-lucide="calendar-check"></i>
                        </div>
                        <div class="teen-journal-stat-card__info">
                            <span class="teen-journal-stat-card__value">${monthDaysWithEntries}</span>
                            <span class="teen-journal-stat-card__label">This Month</span>
                        </div>
                    </div>
                </div>

                <div class="teen-journal-month-card">
                    <div class="teen-journal-month-card__header">
                        <i data-lucide="calendar"></i>
                        <span>${new Date().toLocaleDateString('en-US', { month: 'long' })} Progress</span>
                    </div>
                    <div class="teen-journal-month-card__content">
                        <div class="teen-journal-month-card__progress">
                            <div class="teen-journal-month-card__bar">
                                <div class="teen-journal-month-card__fill" style="width: ${monthProgress}%"></div>
                            </div>
                            <span class="teen-journal-month-card__text">${monthDaysWithEntries} of ${daysInMonth} days (${monthProgress}%)</span>
                        </div>
                    </div>
                </div>

                ${Object.keys(moodCounts).length > 0 ? `
                    <div class="teen-journal-mood-card">
                        <div class="teen-journal-mood-card__header">
                            <i data-lucide="heart"></i>
                            <span>Mood Distribution</span>
                        </div>
                        <div class="teen-journal-mood-card__content">
                            <div class="teen-journal-mood-card__grid">
                                ${MOODS.filter(m => moodCounts[m.id]).map(mood => `
                                    <div class="teen-journal-mood-card__item" style="--mood-color: ${mood.color}">
                                        <span class="teen-journal-mood-card__emoji">${mood.emoji}</span>
                                        <span class="teen-journal-mood-card__count">${moodCounts[mood.id]}</span>
                                        <span class="teen-journal-mood-card__label">${mood.name}</span>
                                    </div>
                                `).join('')}
                            </div>
                            ${mostCommonMood ? `
                                <div class="teen-journal-mood-card__most-common">
                                    <span>Most common mood:</span>
                                    <span class="teen-journal-mood-card__most-common-mood" style="--mood-color: ${getMoodById(mostCommonMood)?.color}">
                                        ${getMoodById(mostCommonMood)?.emoji} ${getMoodById(mostCommonMood)?.name}
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
     * Bind teen page events
     */
    function bindTeenPageEvents(container, memberId, member, activeTab, todayEntry, widgetData) {
        // Back button
        document.getElementById('backToMemberBtn')?.addEventListener('click', () => {
            State.emit('tabChanged', memberId);
        });

        // Tab switching
        container.querySelectorAll('.teen-journal-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const newTab = tab.dataset.tab;
                renderTeenFullPage(container, memberId, member, newTab);
            });
        });

        // Journal settings (password)
        document.getElementById('journalSettingsBtn')?.addEventListener('click', () => {
            showPasswordSetupModal(memberId, () => {
                renderTeenFullPage(container, memberId, member, activeTab);
            });
        });

        // Tab-specific events
        if (activeTab === 'write') {
            let selectedMood = null;
            let selectedStickers = [];

            // Mood selection (inline form)
            container.querySelectorAll('#teenMoodSelector .teen-journal-mood').forEach(btn => {
                btn.addEventListener('click', () => {
                    container.querySelectorAll('#teenMoodSelector .teen-journal-mood').forEach(b =>
                        b.classList.remove('teen-journal-mood--selected'));
                    btn.classList.add('teen-journal-mood--selected');
                    selectedMood = btn.dataset.mood;
                });
            });

            // Sticker selection (inline form)
            container.querySelectorAll('#teenStickerSelector .teen-journal-sticker-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const sticker = btn.dataset.sticker;
                    if (!selectedStickers.includes(sticker) && selectedStickers.length < 5) {
                        selectedStickers.push(sticker);
                        btn.classList.add('selected');
                    } else if (selectedStickers.includes(sticker)) {
                        selectedStickers = selectedStickers.filter(s => s !== sticker);
                        btn.classList.remove('selected');
                    }
                    // Update selected stickers display
                    const display = container.querySelector('#teenSelectedStickers');
                    if (display) {
                        display.innerHTML = selectedStickers.length > 0
                            ? `<span>Selected: ${selectedStickers.join(' ')}</span>`
                            : '';
                    }
                });
            });

            // Save entry (inline form)
            document.getElementById('teenSaveEntryBtn')?.addEventListener('click', () => {
                const content = document.getElementById('teenJournalEntry')?.value?.trim();

                if (!content) {
                    Toast.warning('Please write something first!');
                    return;
                }

                if (!selectedMood) {
                    Toast.warning('Please select how you feel!');
                    return;
                }

                // Save the entry
                const today = getToday();
                const newEntry = {
                    id: `journal-${Date.now()}`,
                    content,
                    mood: selectedMood,
                    stickers: [...selectedStickers],
                    prompt: getTodayPrompt(),
                    date: today,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };

                widgetData.entries = [newEntry, ...(widgetData.entries || [])];
                saveWidgetData(memberId, widgetData);

                // Award points
                const settings = Storage.getSettings();
                const pointsConfig = settings.pointsConfig || {};
                const journalPoints = pointsConfig.teenTaskPoints !== undefined ? pointsConfig.teenTaskPoints : 5;

                const pointsData = Storage.getWidgetData(memberId, 'points');
                if (pointsData && journalPoints > 0) {
                    const updatedPointsData = {
                        ...pointsData,
                        balance: (pointsData.balance || 0) + journalPoints,
                        history: [
                            { activityId: newEntry.id, activityName: 'Daily Journal Entry', date: today, points: journalPoints, type: 'earned' },
                            ...(pointsData.history || []).slice(0, 99)
                        ]
                    };
                    Storage.setWidgetData(memberId, 'points', updatedPointsData);
                }

                // Update achievements
                if (typeof Achievements !== 'undefined') {
                    Achievements.updateStats(memberId, 'activity', 1);
                    Achievements.updateStats(memberId, 'points', journalPoints);
                }

                Toast.success(`+${journalPoints} points! Great job writing today! ✨`);
                renderTeenFullPage(container, memberId, member, 'write');
            });

            // Edit today's entry
            document.getElementById('editTodayBtn')?.addEventListener('click', () => {
                const entryId = document.getElementById('editTodayBtn')?.dataset.entryId;
                if (entryId) {
                    showEditEntryModal(memberId, entryId, () => {
                        renderTeenFullPage(container, memberId, member, 'write');
                    });
                }
            });
        }

        if (activeTab === 'history') {
            // View past entry
            container.querySelectorAll('.teen-journal-history__entry').forEach(card => {
                card.addEventListener('click', () => {
                    const entryId = card.dataset.entryId;
                    const entry = widgetData.entries.find(e => e.id === entryId);
                    if (entry) {
                        showTeenEntryModal(memberId, entry, () => {
                            renderTeenFullPage(container, memberId, member, 'history');
                        });
                    }
                });
            });
        }
    }

    /**
     * Show modal for viewing a past entry (teen version)
     */
    function showTeenEntryModal(memberId, entry, onUpdate) {
        if (!entry) {
            Toast.error('Entry not found');
            return;
        }

        const mood = getMoodById(entry.mood);
        const entryDate = new Date(getEntryDate(entry) + 'T00:00:00');

        const content = `
            <div class="teen-journal-entry-modal">
                <div class="teen-journal-entry-modal__date">
                    ${entryDate.toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}
                </div>
                ${mood ? `
                    <div class="teen-journal-entry-modal__mood" style="--mood-color: ${mood.color}">
                        <span>${mood.emoji}</span>
                        <span>${mood.name}</span>
                    </div>
                ` : ''}
                <div class="teen-journal-entry-modal__content">
                    ${entry.content.replace(/\n/g, '<br>')}
                </div>
                ${entry.stickers?.length > 0 ? `
                    <div class="teen-journal-entry-modal__stickers">
                        ${entry.stickers.join(' ')}
                    </div>
                ` : ''}
                <div class="teen-journal-entry-modal__meta">
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

        // Delete button (PIN protected)
        document.getElementById('deleteEntryBtn')?.addEventListener('click', async () => {
            const verified = await PIN.verify();
            if (verified) {
                if (confirm('Are you sure you want to delete this entry?')) {
                    const widgetData = getWidgetData(memberId);
                    widgetData.entries = widgetData.entries.filter(e => e.id !== entry.id);
                    saveWidgetData(memberId, widgetData);
                    Toast.success('Entry deleted');
                    Modal.close();
                    if (onUpdate) onUpdate();
                }
            }
        });

        // Edit button
        document.getElementById('editEntryBtn')?.addEventListener('click', () => {
            Modal.close();
            setTimeout(() => {
                showEditEntryModal(memberId, entry.id, onUpdate);
            }, 250);
        });

        // Close button
        document.getElementById('closeEntryBtn')?.addEventListener('click', () => {
            Modal.close();
        });
    }

    /**
     * Calculate writing streak
     */
    function calculateStreak(entries) {
        if (entries.length === 0) return 0;

        const today = getToday();
        const dates = [...new Set(entries.map(e => getEntryDate(e)))].sort().reverse();

        let streak = 0;
        let checkDate = new Date(today + 'T00:00:00');

        for (let i = 0; i < dates.length; i++) {
            const entryDate = dates[i];
            const checkDateStr = getLocalDateString(checkDate);

            if (entryDate === checkDateStr) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else if (entryDate < checkDateStr) {
                // Check if we're on day 1 and entry is from yesterday
                if (streak === 0) {
                    const yesterday = new Date(today + 'T00:00:00');
                    yesterday.setDate(yesterday.getDate() - 1);
                    if (entryDate === getLocalDateString(yesterday)) {
                        streak = 1;
                        checkDate = new Date(entryDate + 'T00:00:00');
                        checkDate.setDate(checkDate.getDate() - 1);
                    } else {
                        break;
                    }
                } else {
                    break;
                }
            }
        }

        return streak;
    }

    /**
     * Render list view
     */
    function renderListView(entries, memberId) {
        if (entries.length === 0) {
            return `
                <div class="kid-journal-page__empty">
                    <div class="kid-journal-page__empty-icon">📔</div>
                    <h2>No Entries Yet</h2>
                    <p>Start writing to capture your thoughts and feelings!</p>
                </div>
            `;
        }

        // Group entries by date (using local date)
        const grouped = {};
        entries.forEach(entry => {
            const date = getEntryDate(entry);
            if (!grouped[date]) grouped[date] = [];
            grouped[date].push(entry);
        });

        const today = getToday();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = getLocalDateString(yesterday);

        let html = '';
        Object.keys(grouped).sort().reverse().forEach(date => {
            let dateLabel = formatDate(date);
            if (date === today) dateLabel = 'Today';
            else if (date === yesterdayStr) dateLabel = 'Yesterday';

            html += `
                <div class="kid-journal-day-group">
                    <h3 class="kid-journal-day-group__title">${dateLabel}</h3>
                    <div class="kid-journal-day-group__entries">
                        ${grouped[date].map(entry => renderFullEntry(entry)).join('')}
                    </div>
                </div>
            `;
        });

        return html;
    }

    /**
     * Render entry preview card (glimpse only, click to expand)
     */
    function renderFullEntry(entry) {
        const mood = getMoodById(entry.mood);
        const time = new Date(entry.createdAt).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });

        // Truncate content to show just a preview
        const preview = entry.content && entry.content.length > 100
            ? entry.content.substring(0, 100) + '...'
            : entry.content || '';

        return `
            <div class="kid-journal-entry kid-journal-entry--preview" data-entry-id="${entry.id}" data-view-entry="${entry.id}">
                <div class="kid-journal-entry__header">
                    <span class="kid-journal-entry__mood" style="--mood-color: ${mood.color}">
                        ${mood.emoji}
                    </span>
                    <span class="kid-journal-entry__time">${time}</span>
                    ${entry.stickers?.length > 0 ? `
                        <span class="kid-journal-entry__stickers">
                            ${entry.stickers.join(' ')}
                        </span>
                    ` : ''}
                </div>
                <div class="kid-journal-entry__preview">
                    ${preview}
                </div>
                <div class="kid-journal-entry__actions">
                    <button class="btn btn--ghost btn--sm" data-edit="${entry.id}">
                        <i data-lucide="edit-2"></i>
                        Edit
                    </button>
                    <button class="btn btn--ghost btn--sm btn--danger" data-delete="${entry.id}">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Render calendar view
     */
    function renderCalendarView(entries, memberId) {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();

        // Get entries for this month (using local date)
        const monthEntries = {};
        entries.forEach(entry => {
            const date = getEntryDate(entry);
            const [entryYear, entryMonth] = date.split('-').map(Number);
            if ((entryMonth - 1) === month && entryYear === year) {
                if (!monthEntries[date]) monthEntries[date] = [];
                monthEntries[date].push(entry);
            }
        });

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const monthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

        let calendarHtml = `
            <div class="kid-journal-calendar">
                <div class="kid-journal-calendar__header">
                    <button class="btn btn--ghost btn--sm" data-calendar-nav="prev">
                        <i data-lucide="chevron-left"></i>
                    </button>
                    <span class="kid-journal-calendar__month">${monthName}</span>
                    <button class="btn btn--ghost btn--sm" data-calendar-nav="next">
                        <i data-lucide="chevron-right"></i>
                    </button>
                </div>
                <div class="kid-journal-calendar__weekdays">
                    <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
                </div>
                <div class="kid-journal-calendar__days">
        `;

        // Empty cells for days before first day
        for (let i = 0; i < firstDay; i++) {
            calendarHtml += `<div class="kid-journal-calendar__day kid-journal-calendar__day--empty"></div>`;
        }

        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayEntries = monthEntries[dateStr] || [];
            const isToday = dateStr === getToday();
            const hasMood = dayEntries.length > 0 ? getMoodById(dayEntries[0].mood) : null;

            calendarHtml += `
                <div class="kid-journal-calendar__day ${isToday ? 'kid-journal-calendar__day--today' : ''} ${dayEntries.length > 0 ? 'kid-journal-calendar__day--has-entry' : ''}"
                    data-date="${dateStr}"
                    ${hasMood ? `style="--day-mood-color: ${hasMood.color}"` : ''}>
                    <span class="kid-journal-calendar__day-num">${day}</span>
                    ${hasMood ? `<span class="kid-journal-calendar__day-mood">${hasMood.emoji}</span>` : ''}
                </div>
            `;
        }

        calendarHtml += `
                </div>
            </div>
            <div class="kid-journal-calendar__selected" id="calendarSelected">
                <p class="kid-journal-calendar__selected-hint">Tap a day to see entries</p>
            </div>
        `;

        return calendarHtml;
    }

    /**
     * Bind full page events
     */
    function bindFullPageEvents(container, memberId, member, widgetData, currentView) {
        // Back button
        document.getElementById('backToMemberBtn')?.addEventListener('click', () => {
            State.emit('tabChanged', memberId);
        });

        // View toggle
        container.querySelectorAll('[data-view]').forEach(btn => {
            btn.addEventListener('click', () => {
                const view = btn.dataset.view;
                renderFullPage(container, memberId, member, view);
            });
        });

        // Journal settings (password)
        document.getElementById('journalSettingsBtn')?.addEventListener('click', () => {
            showPasswordSetupModal(memberId, () => {
                // Re-render to update lock icon
                renderFullPage(container, memberId, member, currentView);
            });
        });

        // Write tab events
        if (currentView === 'write') {
            let selectedMood = null;
            let selectedStickers = [];

            // Mood selection
            container.querySelectorAll('#kidMoodSelector .kid-journal-mood-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    container.querySelectorAll('#kidMoodSelector .kid-journal-mood-btn').forEach(b =>
                        b.classList.remove('kid-journal-mood-btn--selected'));
                    btn.classList.add('kid-journal-mood-btn--selected');
                    selectedMood = btn.dataset.mood;
                });
            });

            // Sticker selection
            container.querySelectorAll('#kidStickerSelector .kid-journal-sticker-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const sticker = btn.dataset.sticker;
                    if (!selectedStickers.includes(sticker) && selectedStickers.length < 5) {
                        selectedStickers.push(sticker);
                        btn.classList.add('selected');
                    } else if (selectedStickers.includes(sticker)) {
                        selectedStickers = selectedStickers.filter(s => s !== sticker);
                        btn.classList.remove('selected');
                    }
                    // Update selected stickers display
                    const display = container.querySelector('#kidSelectedStickers');
                    if (display) {
                        display.innerHTML = selectedStickers.length > 0
                            ? `<span>Selected: ${selectedStickers.join(' ')}</span>`
                            : '';
                    }
                });
            });

            // Save entry
            document.getElementById('kidSaveEntryBtn')?.addEventListener('click', () => {
                const content = document.getElementById('kidJournalEntry')?.value?.trim();

                if (!content) {
                    Toast.warning('Please write something first!');
                    return;
                }

                if (!selectedMood) {
                    Toast.warning('Please select how you feel!');
                    return;
                }

                // Save the entry
                const today = getToday();
                const newEntry = {
                    id: `journal-${Date.now()}`,
                    content,
                    mood: selectedMood,
                    stickers: [...selectedStickers],
                    prompt: getTodayPrompt(),
                    date: today,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };

                widgetData.entries = [newEntry, ...(widgetData.entries || [])];
                saveWidgetData(memberId, widgetData);

                // Award points
                const settings = Storage.getSettings();
                const pointsConfig = settings.pointsConfig || {};
                let journalPoints = 5;
                if (member) {
                    if (member.type === 'kid') {
                        journalPoints = pointsConfig.kidTaskPoints !== undefined ? pointsConfig.kidTaskPoints : 3;
                    } else if (member.type === 'teen') {
                        journalPoints = pointsConfig.teenTaskPoints !== undefined ? pointsConfig.teenTaskPoints : 5;
                    }
                }

                const pointsData = Storage.getWidgetData(memberId, 'points');
                if (pointsData && journalPoints > 0) {
                    const updatedPointsData = {
                        ...pointsData,
                        balance: (pointsData.balance || 0) + journalPoints,
                        history: [
                            { activityId: newEntry.id, activityName: 'Daily Journal Entry', date: today, points: journalPoints, type: 'earned' },
                            ...(pointsData.history || []).slice(0, 99)
                        ]
                    };
                    Storage.setWidgetData(memberId, 'points', updatedPointsData);
                }

                // Update achievements
                if (typeof Achievements !== 'undefined') {
                    Achievements.updateStats(memberId, 'activity', 1);
                    Achievements.updateStats(memberId, 'points', journalPoints);
                }

                Toast.success(`+${journalPoints} points! Great job writing today! ✨`);
                renderFullPage(container, memberId, member, 'write');

                // Refresh widget if visible
                const widgetBody = document.getElementById('widget-kid-journal');
                if (widgetBody) {
                    renderWidget(widgetBody, memberId);
                }
            });

            // Edit today's entry button
            document.getElementById('editTodayBtn')?.addEventListener('click', () => {
                const entryId = document.getElementById('editTodayBtn')?.dataset.entryId;
                if (entryId) {
                    showEditEntryModal(memberId, entryId, () => {
                        renderFullPage(container, memberId, member, 'write');
                    });
                }
            });
        }

        // View full entry (click on card)
        container.querySelectorAll('[data-view-entry]').forEach(card => {
            card.addEventListener('click', (e) => {
                // Don't trigger if clicking on action buttons
                if (e.target.closest('[data-edit]') || e.target.closest('[data-delete]')) {
                    return;
                }
                const entryId = card.dataset.viewEntry;
                showViewEntryModal(memberId, entryId);
            });
        });

        // Edit entry
        container.querySelectorAll('[data-edit]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const entryId = btn.dataset.edit;
                showEditEntryModal(memberId, entryId, () => {
                    renderFullPage(container, memberId, member, currentView);
                });
            });
        });

        // Delete entry (PIN protected)
        container.querySelectorAll('[data-delete]').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const entryId = btn.dataset.delete;
                const verified = await PIN.verify();
                if (verified) {
                    if (confirm('Delete this journal entry?')) {
                        widgetData.entries = widgetData.entries.filter(e => e.id !== entryId);
                        saveWidgetData(memberId, widgetData);
                        renderFullPage(container, memberId, member, currentView);
                        Toast.success('Entry deleted');
                    }
                }
            });
        });

        // Calendar day click
        container.querySelectorAll('.kid-journal-calendar__day[data-date]').forEach(day => {
            day.addEventListener('click', () => {
                const date = day.dataset.date;
                const dayEntries = widgetData.entries.filter(e => getEntryDate(e) === date);
                const selectedDiv = container.querySelector('#calendarSelected');

                if (selectedDiv) {
                    if (dayEntries.length === 0) {
                        selectedDiv.innerHTML = `
                            <p class="kid-journal-calendar__selected-date">${formatDate(date)}</p>
                            <p class="kid-journal-calendar__selected-empty">No entry for this day</p>
                        `;
                    } else {
                        selectedDiv.innerHTML = `
                            <p class="kid-journal-calendar__selected-date">${formatDate(date)}</p>
                            ${dayEntries.map(entry => renderFullEntry(entry)).join('')}
                        `;

                        if (typeof lucide !== 'undefined') {
                            lucide.createIcons();
                        }

                        // Re-bind view/edit/delete for these entries
                        selectedDiv.querySelectorAll('[data-view-entry]').forEach(card => {
                            card.addEventListener('click', (e) => {
                                if (e.target.closest('[data-edit]') || e.target.closest('[data-delete]')) {
                                    return;
                                }
                                showViewEntryModal(memberId, card.dataset.viewEntry);
                            });
                        });

                        selectedDiv.querySelectorAll('[data-edit]').forEach(btn => {
                            btn.addEventListener('click', (e) => {
                                e.stopPropagation();
                                showEditEntryModal(memberId, btn.dataset.edit, () => {
                                    renderFullPage(container, memberId, member, currentView);
                                });
                            });
                        });

                        selectedDiv.querySelectorAll('[data-delete]').forEach(btn => {
                            btn.addEventListener('click', async (e) => {
                                e.stopPropagation();
                                const verified = await PIN.verify();
                                if (verified) {
                                    if (confirm('Delete this journal entry?')) {
                                        widgetData.entries = widgetData.entries.filter(e => e.id !== btn.dataset.delete);
                                        saveWidgetData(memberId, widgetData);
                                        renderFullPage(container, memberId, member, currentView);
                                        Toast.success('Entry deleted');
                                    }
                                }
                            });
                        });
                    }
                }

                // Highlight selected day
                container.querySelectorAll('.kid-journal-calendar__day').forEach(d => d.classList.remove('selected'));
                day.classList.add('selected');

                // Scroll to the selected entry section
                if (selectedDiv) {
                    setTimeout(() => {
                        selectedDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 50);
                }
            });
        });
    }

    /**
     * Show new entry modal
     */
    function showNewEntryModal(memberId, onSave) {
        const todayPrompt = getTodayPrompt();
        const member = Storage.getMember(memberId);
        const modalTypeClass = member?.type === 'teen' ? 'kid-journal-modal--teen' : '';

        const content = `
            <div class="kid-journal-modal ${modalTypeClass}">
                <div class="kid-journal-prompt kid-journal-prompt--modal">
                    <span class="kid-journal-prompt__icon">💡</span>
                    <span class="kid-journal-prompt__text">${todayPrompt}</span>
                </div>

                <div class="form-group">
                    <label class="form-label">What's on your mind?</label>
                    <textarea class="form-input" id="modalJournalContent" rows="5" placeholder="Write your thoughts..."></textarea>
                </div>

                <div class="form-group">
                    <label class="form-label">How do you feel?</label>
                    <div class="kid-journal-mood-picker kid-journal-mood-picker--modal">
                        ${MOODS.map(mood => `
                            <button type="button"
                                class="kid-journal-mood-btn kid-journal-mood-btn--lg"
                                data-mood="${mood.id}"
                                title="${mood.name}"
                                style="--mood-color: ${mood.color}">
                                ${mood.emoji}
                                <span class="kid-journal-mood-btn__name">${mood.name}</span>
                            </button>
                        `).join('')}
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">Add stickers (optional)</label>
                    <div class="kid-journal-stickers-grid kid-journal-stickers-grid--modal">
                        ${STICKERS.map(sticker => `
                            <button type="button" class="kid-journal-sticker-btn" data-sticker="${sticker}">
                                ${sticker}
                            </button>
                        `).join('')}
                    </div>
                    <div class="kid-journal-selected-stickers" id="modalSelectedStickers"></div>
                </div>
            </div>
        `;

        Modal.open({
            title: '📔 New Journal Entry',
            content,
            size: 'md',
            footer: `
                <button class="btn btn--ghost" data-modal-cancel>Cancel</button>
                <button class="btn btn--primary" id="modalSaveBtn">
                    <i data-lucide="save"></i>
                    Save Entry
                </button>
            `
        });

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        let selectedMood = null;
        let selectedStickers = [];

        // Mood selection
        document.querySelectorAll('.kid-journal-mood-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.kid-journal-mood-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                selectedMood = btn.dataset.mood;
            });
        });

        // Sticker selection
        document.querySelectorAll('.kid-journal-sticker-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const sticker = btn.dataset.sticker;
                if (!selectedStickers.includes(sticker) && selectedStickers.length < 5) {
                    selectedStickers.push(sticker);
                    btn.classList.add('selected');
                    updateModalStickers(selectedStickers);
                } else if (selectedStickers.includes(sticker)) {
                    selectedStickers = selectedStickers.filter(s => s !== sticker);
                    btn.classList.remove('selected');
                    updateModalStickers(selectedStickers);
                }
            });
        });

        // Save
        document.getElementById('modalSaveBtn')?.addEventListener('click', () => {
            const content = document.getElementById('modalJournalContent')?.value?.trim();

            if (!content) {
                Toast.warning('Please write something first!');
                return;
            }

            if (!selectedMood) {
                Toast.warning('Please select how you feel!');
                return;
            }

            const widgetData = getWidgetData(memberId);

            // Check if already wrote today
            if (hasEntryToday(widgetData.entries || [])) {
                Toast.warning('You already wrote today! Come back tomorrow.');
                Modal.close();
                return;
            }

            const today = getToday();
            const newEntry = {
                id: `journal-${Date.now()}`,
                content,
                mood: selectedMood,
                stickers: [...selectedStickers],
                prompt: todayPrompt,
                date: today, // Store local date separately
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            widgetData.entries = [newEntry, ...(widgetData.entries || [])];
            saveWidgetData(memberId, widgetData);

            // Award points for daily journal entry based on member type
            const member = Storage.getMember(memberId);
            const settings = Storage.getSettings();
            const pointsConfig = settings.pointsConfig || {};

            // Determine points based on member type
            let journalPoints = 5; // Default fallback
            if (member) {
                if (member.type === 'kid') {
                    journalPoints = pointsConfig.kidTaskPoints !== undefined ? pointsConfig.kidTaskPoints : 3;
                } else if (member.type === 'teen') {
                    journalPoints = pointsConfig.teenTaskPoints !== undefined ? pointsConfig.teenTaskPoints : 5;
                }
            }

            const pointsData = Storage.getWidgetData(memberId, 'points');
            if (pointsData && journalPoints > 0) {
                const updatedPointsData = {
                    ...pointsData,
                    balance: (pointsData.balance || 0) + journalPoints,
                    history: [
                        { activityId: newEntry.id, activityName: 'Daily Journal Entry', date: today, points: journalPoints, type: 'earned' },
                        ...(pointsData.history || []).slice(0, 99)
                    ]
                };
                Storage.setWidgetData(memberId, 'points', updatedPointsData);

                // Refresh points widget if visible
                const pointsBody = document.getElementById('widget-points');
                if (pointsBody && typeof Points !== 'undefined') {
                    Points.renderWidget(pointsBody, memberId);
                    if (typeof lucide !== 'undefined') {
                        lucide.createIcons();
                    }
                }
            }

            // Update achievements
            if (typeof Achievements !== 'undefined') {
                Achievements.updateStats(memberId, 'activity', 1);
                Achievements.updateStats(memberId, 'points', 5);
            }

            Modal.close();
            Toast.success('+5 points! Great job writing today! ✨');

            if (onSave) onSave();

            // Refresh widget if visible
            const widgetBody = document.getElementById('widget-kid-journal');
            if (widgetBody) {
                renderWidget(widgetBody, memberId);
            }
        });

        document.querySelector('[data-modal-cancel]')?.addEventListener('click', () => {
            Modal.close();
        });
    }

    /**
     * Show view entry modal (read-only, full content)
     */
    function showViewEntryModal(memberId, entryId) {
        const widgetData = getWidgetData(memberId);
        const entry = widgetData.entries.find(e => e.id === entryId);
        if (!entry) return;

        const mood = getMoodById(entry.mood);
        const date = new Date(entry.createdAt).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const time = new Date(entry.createdAt).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });

        const content = `
            <div class="kid-journal-view-modal">
                <div class="kid-journal-view-modal__header">
                    <span class="kid-journal-view-modal__mood" style="--mood-color: ${mood.color}">
                        ${mood.emoji} ${mood.name}
                    </span>
                    <span class="kid-journal-view-modal__date">${date} at ${time}</span>
                </div>
                ${entry.stickers?.length > 0 ? `
                    <div class="kid-journal-view-modal__stickers">
                        ${entry.stickers.join(' ')}
                    </div>
                ` : ''}
                ${entry.prompt ? `
                    <div class="kid-journal-view-modal__prompt">
                        💡 ${entry.prompt}
                    </div>
                ` : ''}
                <div class="kid-journal-view-modal__content">
                    ${entry.content.replace(/\n/g, '<br>')}
                </div>
            </div>
        `;

        Modal.open({
            title: '📖 Journal Entry',
            content,
            size: 'md',
            footer: `
                <button class="btn btn--ghost" data-modal-cancel>Close</button>
            `
        });

        // Bind close button
        document.querySelector('[data-modal-cancel]')?.addEventListener('click', () => {
            Modal.close();
        });
    }

    /**
     * Show edit entry modal
     */
    function showEditEntryModal(memberId, entryId, onSave) {
        const widgetData = getWidgetData(memberId);
        const entry = widgetData.entries.find(e => e.id === entryId);
        if (!entry) return;

        const member = Storage.getMember(memberId);
        const modalTypeClass = member?.type === 'teen' ? 'kid-journal-modal--teen' : '';

        const content = `
            <div class="kid-journal-modal ${modalTypeClass}">
                <div class="form-group">
                    <label class="form-label">What's on your mind?</label>
                    <div class="kid-journal-modal__input-area">
                        <textarea class="form-input" id="editJournalContent" rows="5">${entry.content}</textarea>
                        <button type="button" class="kid-journal-emoji-btn" id="editEmojiToggleBtn" title="Add emoji">
                            😊
                        </button>
                    </div>
                    <div class="kid-journal-emoji-panel" id="editEmojiPanel" style="display: none;">
                        <div class="kid-journal-emoji-grid">
                            ${TEXT_EMOJIS.map(emoji => `
                                <button type="button" class="kid-journal-emoji-item" data-emoji="${emoji}">
                                    ${emoji}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">How do you feel?</label>
                    <div class="kid-journal-mood-picker kid-journal-mood-picker--modal">
                        ${MOODS.map(mood => `
                            <button type="button"
                                class="kid-journal-mood-btn kid-journal-mood-btn--lg ${entry.mood === mood.id ? 'selected' : ''}"
                                data-mood="${mood.id}"
                                title="${mood.name}"
                                style="--mood-color: ${mood.color}">
                                ${mood.emoji}
                                <span class="kid-journal-mood-btn__name">${mood.name}</span>
                            </button>
                        `).join('')}
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">Stickers</label>
                    <div class="kid-journal-stickers-grid kid-journal-stickers-grid--modal">
                        ${STICKERS.map(sticker => `
                            <button type="button" class="kid-journal-sticker-btn ${entry.stickers?.includes(sticker) ? 'selected' : ''}" data-sticker="${sticker}">
                                ${sticker}
                            </button>
                        `).join('')}
                    </div>
                    <div class="kid-journal-selected-stickers" id="editSelectedStickers">
                        ${(entry.stickers || []).map(s => `<span>${s}</span>`).join('')}
                    </div>
                </div>
            </div>
        `;

        Modal.open({
            title: '✏️ Edit Entry',
            content,
            size: 'md',
            footer: `
                <button class="btn btn--ghost" data-modal-cancel>Cancel</button>
                <button class="btn btn--primary" id="editSaveBtn">
                    <i data-lucide="save"></i>
                    Save Changes
                </button>
            `
        });

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        let selectedMood = entry.mood;
        let selectedStickers = [...(entry.stickers || [])];

        // Emoji picker for edit modal
        const editEmojiToggleBtn = document.getElementById('editEmojiToggleBtn');
        const editEmojiPanel = document.getElementById('editEmojiPanel');
        const editJournalContent = document.getElementById('editJournalContent');

        if (editEmojiToggleBtn && editEmojiPanel) {
            editEmojiToggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const isOpen = editEmojiPanel.style.display !== 'none';
                editEmojiPanel.style.display = isOpen ? 'none' : 'block';
                editEmojiToggleBtn.classList.toggle('active', !isOpen);
            });

            // Insert emoji into textarea at cursor position
            editEmojiPanel.querySelectorAll('.kid-journal-emoji-item').forEach(btn => {
                btn.addEventListener('click', () => {
                    const emoji = btn.dataset.emoji;
                    if (editJournalContent) {
                        const start = editJournalContent.selectionStart;
                        const end = editJournalContent.selectionEnd;
                        const text = editJournalContent.value;
                        editJournalContent.value = text.substring(0, start) + emoji + text.substring(end);
                        editJournalContent.focus();
                        editJournalContent.selectionStart = editJournalContent.selectionEnd = start + emoji.length;
                    }
                });
            });
        }

        // Mood selection
        document.querySelectorAll('.kid-journal-mood-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.kid-journal-mood-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                selectedMood = btn.dataset.mood;
            });
        });

        // Sticker selection
        document.querySelectorAll('.kid-journal-sticker-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const sticker = btn.dataset.sticker;
                if (!selectedStickers.includes(sticker) && selectedStickers.length < 5) {
                    selectedStickers.push(sticker);
                    btn.classList.add('selected');
                } else if (selectedStickers.includes(sticker)) {
                    selectedStickers = selectedStickers.filter(s => s !== sticker);
                    btn.classList.remove('selected');
                }
                updateEditStickers(selectedStickers);
            });
        });

        // Save
        document.getElementById('editSaveBtn')?.addEventListener('click', () => {
            const newContent = document.getElementById('editJournalContent')?.value?.trim();

            if (!newContent) {
                Toast.warning('Please write something!');
                return;
            }

            entry.content = newContent;
            entry.mood = selectedMood;
            entry.stickers = [...selectedStickers];
            entry.updatedAt = new Date().toISOString();

            saveWidgetData(memberId, widgetData);

            Modal.close();
            Toast.success('Entry updated!');

            if (onSave) onSave();

            // Refresh widget if visible
            const widgetBody = document.getElementById('widget-kid-journal');
            if (widgetBody) {
                renderWidget(widgetBody, memberId);
            }
        });

        document.querySelector('[data-modal-cancel]')?.addEventListener('click', () => {
            Modal.close();
        });
    }

    /**
     * Update modal stickers display
     */
    function updateModalStickers(stickers) {
        const display = document.getElementById('modalSelectedStickers');
        if (display) {
            display.innerHTML = stickers.map(s => `<span>${s}</span>`).join('');
        }
    }

    /**
     * Update edit stickers display
     */
    function updateEditStickers(stickers) {
        const display = document.getElementById('editSelectedStickers');
        if (display) {
            display.innerHTML = stickers.map(s => `<span>${s}</span>`).join('');
        }
    }

    function init() {
        // Initialize kid journal feature
    }

    return {
        init,
        renderWidget,
        showFullPage
    };
})();
