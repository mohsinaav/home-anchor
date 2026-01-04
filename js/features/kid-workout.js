/**
 * Kid Workout (Move & Play) Feature
 * A kid-friendly workout widget for parents to suggest activities and track what kids do
 */

const KidWorkout = (function() {
    // Maximum activities to show in widget preview
    const MAX_WIDGET_ACTIVITIES = 3;

    // Preset activity categories with icons and colors
    const ACTIVITY_CATEGORIES = [
        { id: 'active', name: 'Active Play', icon: 'zap', color: '#F59E0B' },
        { id: 'sports', name: 'Sports', icon: 'target', color: '#3B82F6' },
        { id: 'outdoor', name: 'Outdoor', icon: 'sun', color: '#10B981' },
        { id: 'dance', name: 'Dance & Move', icon: 'music', color: '#EC4899' },
        { id: 'custom', name: 'Other', icon: 'star', color: '#8B5CF6' }
    ];

    // Default activities with duration suggestions
    const DEFAULT_ACTIVITIES = [
        { id: 'swimming', name: 'Swimming', icon: 'waves', category: 'sports', duration: 30, points: 15 },
        { id: 'bike-ride', name: 'Bike Ride', icon: 'bike', category: 'outdoor', duration: 20, points: 10 },
        { id: 'soccer', name: 'Soccer', icon: 'circle', category: 'sports', duration: 30, points: 15 },
        { id: 'dance', name: 'Dance Party', icon: 'music', category: 'dance', duration: 15, points: 8 },
        { id: 'jump-rope', name: 'Jump Rope', icon: 'zap', category: 'active', duration: 10, points: 8 },
        { id: 'playground', name: 'Playground', icon: 'sun', category: 'outdoor', duration: 30, points: 12 },
        { id: 'tag', name: 'Tag / Chase', icon: 'footprints', category: 'active', duration: 15, points: 10 },
        { id: 'basketball', name: 'Basketball', icon: 'circle', category: 'sports', duration: 20, points: 12 },
        { id: 'stretching', name: 'Stretching', icon: 'heart', category: 'active', duration: 10, points: 5 },
        { id: 'yoga', name: 'Kids Yoga', icon: 'heart', category: 'dance', duration: 15, points: 8 },
        { id: 'hiking', name: 'Nature Walk', icon: 'tree-pine', category: 'outdoor', duration: 30, points: 15 },
        { id: 'skating', name: 'Skating', icon: 'zap', category: 'sports', duration: 30, points: 15 }
    ];

    // Fun activity emojis for quick visual
    const ACTIVITY_EMOJIS = {
        'swimming': '🏊',
        'bike-ride': '🚴',
        'soccer': '⚽',
        'dance': '💃',
        'jump-rope': '🪢',
        'playground': '🛝',
        'tag': '🏃',
        'basketball': '🏀',
        'stretching': '🧘',
        'yoga': '🧘',
        'hiking': '🥾',
        'skating': '⛸️'
    };

    /**
     * Get widget data with defaults
     */
    function getWidgetData(memberId) {
        const stored = Storage.getWidgetData(memberId, 'kid-workout');

        // If no stored data or activities array is empty, initialize with defaults
        if (!stored || !stored.activities || stored.activities.length === 0) {
            const defaultData = {
                activities: [...DEFAULT_ACTIVITIES],
                log: stored?.log || [],
                settings: stored?.settings || {
                    weeklyGoal: 5,
                    showPoints: true
                }
            };
            // Save defaults so they persist
            Storage.setWidgetData(memberId, 'kid-workout', defaultData);
            return defaultData;
        }
        return stored;
    }

    /**
     * Save widget data
     */
    function saveWidgetData(memberId, data) {
        Storage.setWidgetData(memberId, 'kid-workout', data);
    }

    /**
     * Get today's date string (local timezone)
     */
    function getTodayStr() {
        return DateUtils.today();
    }

    /**
     * Get activities logged today
     */
    function getTodayActivities(memberId) {
        const data = getWidgetData(memberId);
        const today = getTodayStr();
        return data.log.filter(entry => entry.date === today);
    }

    /**
     * Get activities for the current week
     */
    function getWeekActivities(memberId) {
        const data = getWidgetData(memberId);
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        return data.log.filter(entry => {
            const entryDate = new Date(entry.date);
            return entryDate >= startOfWeek && entryDate <= today;
        });
    }

    /**
     * Get random "Try Today" suggestions
     */
    function getTodaySuggestions(memberId, count = 3) {
        const data = getWidgetData(memberId);
        const todayActivities = getTodayActivities(memberId);
        const doneIds = todayActivities.map(a => a.activityId);

        // Filter out already completed activities
        const available = data.activities.filter(a => !doneIds.includes(a.id));

        // Shuffle and pick
        const shuffled = available.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    /**
     * Log an activity
     */
    function logActivity(memberId, activityId, duration = null) {
        const data = getWidgetData(memberId);
        const activity = data.activities.find(a => a.id === activityId);

        if (!activity) return null;

        const logEntry = {
            id: `log-${Date.now()}`,
            activityId: activity.id,
            name: activity.name,
            icon: activity.icon,
            category: activity.category,
            duration: duration || activity.duration,
            points: activity.points,
            date: getTodayStr(),
            createdAt: new Date().toISOString()
        };

        data.log.push(logEntry);
        saveWidgetData(memberId, data);

        // Award points if points system is available
        if (data.settings.showPoints && typeof Points !== 'undefined') {
            try {
                // Try to add points to the kid's balance and history
                const pointsData = Storage.getWidgetData(memberId, 'points');
                if (pointsData) {
                    const today = getTodayStr();
                    const now = new Date().toISOString();

                    // Update balance
                    pointsData.balance = (pointsData.balance || 0) + activity.points;

                    // Add to todayCompleted
                    if (!pointsData.todayCompleted) pointsData.todayCompleted = [];
                    pointsData.todayCompleted.push({
                        activityId: `workout-${logEntry.id}`,
                        date: today,
                        points: activity.points,
                        completedAt: now
                    });

                    // Add to history so it shows in Points History
                    if (!pointsData.history) pointsData.history = [];
                    pointsData.history.unshift({
                        activityId: `workout-${logEntry.id}`,
                        activityName: `${activity.name} (Move & Play)`,
                        activityIcon: activity.icon || 'heart-pulse',
                        date: today,
                        completedAt: now,
                        points: activity.points,
                        type: 'earned',
                        source: 'kid-workout'
                    });

                    Storage.setWidgetData(memberId, 'points', pointsData);
                }
            } catch (e) {
                console.log('Points integration not available');
            }
        }

        return logEntry;
    }

    /**
     * Remove a logged activity
     */
    function removeLogEntry(memberId, logId) {
        const data = getWidgetData(memberId);
        const entryIndex = data.log.findIndex(e => e.id === logId);

        if (entryIndex === -1) return false;

        const entry = data.log[entryIndex];
        data.log.splice(entryIndex, 1);
        saveWidgetData(memberId, data);

        // Remove points if we added them
        if (data.settings.showPoints) {
            try {
                const pointsData = Storage.getWidgetData(memberId, 'points');
                if (pointsData) {
                    const workoutActivityId = `workout-${logId}`;

                    // Deduct balance
                    pointsData.balance = Math.max(0, (pointsData.balance || 0) - entry.points);

                    // Remove from todayCompleted
                    if (pointsData.todayCompleted) {
                        pointsData.todayCompleted = pointsData.todayCompleted.filter(
                            tc => tc.activityId !== workoutActivityId
                        );
                    }

                    // Remove from history
                    if (pointsData.history) {
                        pointsData.history = pointsData.history.filter(
                            h => h.activityId !== workoutActivityId
                        );
                    }

                    Storage.setWidgetData(memberId, 'points', pointsData);
                }
            } catch (e) {
                console.log('Points integration not available');
            }
        }

        return true;
    }

    /**
     * Add custom activity
     */
    function addCustomActivity(memberId, activity) {
        const data = getWidgetData(memberId);
        const newActivity = {
            id: `custom-${Date.now()}`,
            name: activity.name,
            icon: activity.icon || 'star',
            emoji: activity.emoji || '🏃',
            category: 'custom',
            duration: activity.duration || 15,
            points: activity.points || 10,
            isCustom: true
        };

        data.activities.push(newActivity);
        saveWidgetData(memberId, data);
        return newActivity;
    }

    /**
     * Update an existing activity
     */
    function updateActivity(memberId, activityId, updates) {
        const data = getWidgetData(memberId);
        const activity = data.activities.find(a => a.id === activityId);
        if (!activity) return false;

        Object.assign(activity, updates);
        saveWidgetData(memberId, data);
        return true;
    }

    /**
     * Delete any activity
     */
    function deleteActivity(memberId, activityId) {
        const data = getWidgetData(memberId);
        const index = data.activities.findIndex(a => a.id === activityId);

        if (index === -1) return false;

        data.activities.splice(index, 1);
        saveWidgetData(memberId, data);
        return true;
    }

    /**
     * Get category by ID
     */
    function getCategoryById(categoryId) {
        return ACTIVITY_CATEGORIES.find(c => c.id === categoryId) || ACTIVITY_CATEGORIES[4];
    }

    /**
     * Render the widget
     */
    function renderWidget(container, memberId) {
        const data = getWidgetData(memberId);
        const todayActivities = getTodayActivities(memberId);
        const weekActivities = getWeekActivities(memberId);
        const weeklyGoal = data.settings.weeklyGoal;

        // Calculate stats
        const todayMinutes = todayActivities.reduce((sum, a) => sum + a.duration, 0);
        const todayPoints = todayActivities.reduce((sum, a) => sum + a.points, 0);
        const weekDays = [...new Set(weekActivities.map(a => a.date))].length;

        // Get completed activity IDs for today
        const completedIds = todayActivities.map(a => a.activityId);

        container.innerHTML = `
            <div class="kid-workout-widget">
                <!-- Today's Stats -->
                <div class="kid-workout-stats">
                    <div class="kid-workout-stat">
                        <span class="kid-workout-stat__icon">⏱️</span>
                        <span class="kid-workout-stat__value">${todayMinutes}</span>
                        <span class="kid-workout-stat__label">mins today</span>
                    </div>
                    <div class="kid-workout-stat">
                        <span class="kid-workout-stat__icon">⭐</span>
                        <span class="kid-workout-stat__value">${todayPoints}</span>
                        <span class="kid-workout-stat__label">points earned</span>
                    </div>
                    <div class="kid-workout-stat">
                        <span class="kid-workout-stat__icon">🎯</span>
                        <span class="kid-workout-stat__value">${weekDays}/${weeklyGoal}</span>
                        <span class="kid-workout-stat__label">days this week</span>
                    </div>
                </div>

                <!-- Activities Grid - Card style like adult workout -->
                <div class="kid-workout-grid">
                    ${data.activities.map(activity => {
                        const isCompleted = completedIds.includes(activity.id);
                        const emoji = activity.emoji || ACTIVITY_EMOJIS[activity.id] || '🏃';
                        return `
                            <button class="kid-workout-card ${isCompleted ? 'kid-workout-card--completed' : ''}" data-activity-id="${activity.id}">
                                <span class="kid-workout-card__emoji">${emoji}</span>
                                <span class="kid-workout-card__name">${activity.name}</span>
                                <span class="kid-workout-card__points">+${activity.points} pts</span>
                                ${isCompleted ? '<span class="kid-workout-card__check">✓</span>' : ''}
                            </button>
                        `;
                    }).join('')}
                </div>

                <!-- Actions Footer - Text buttons like Points widget -->
                <div class="kid-workout-footer">
                    <button class="btn btn--sm btn--ghost" id="historyBtn">
                        <i data-lucide="history"></i>
                        History
                    </button>
                    <button class="btn btn--sm btn--ghost" id="resetTodayBtn">
                        <i data-lucide="rotate-ccw"></i>
                        Reset
                    </button>
                    <button class="btn btn--sm btn--ghost" id="manageBtn">
                        <i data-lucide="settings"></i>
                        Manage
                    </button>
                </div>
            </div>
        `;

        // Initialize Lucide icons
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
        // Activity card clicks - toggle completion
        container.querySelectorAll('.kid-workout-card').forEach(card => {
            card.addEventListener('click', () => {
                const activityId = card.dataset.activityId;
                const data = getWidgetData(memberId);
                const activity = data.activities.find(a => a.id === activityId);
                const isCompleted = card.classList.contains('kid-workout-card--completed');

                if (!isCompleted) {
                    // Log the activity
                    logActivity(memberId, activityId);
                    if (activity) {
                        showLoggedToast(activity.name);
                    }
                } else {
                    // Remove the activity from today's log
                    const todayActivities = getTodayActivities(memberId);
                    const logEntry = todayActivities.find(a => a.activityId === activityId);
                    if (logEntry) {
                        removeLogEntry(memberId, logEntry.id);
                    }
                }
                renderWidget(container, memberId);
            });
        });

        // History button
        const historyBtn = container.querySelector('#historyBtn');
        if (historyBtn) {
            historyBtn.addEventListener('click', () => {
                showFullPage(memberId);
            });
        }

        // Manage button
        const manageBtn = container.querySelector('#manageBtn');
        if (manageBtn) {
            manageBtn.addEventListener('click', async () => {
                // Require PIN verification for manage
                if (typeof PIN !== 'undefined') {
                    const verified = await PIN.verify();
                    if (!verified) return;
                }
                showManageModal(memberId, container);
            });
        }

        // Reset today button
        const resetTodayBtn = container.querySelector('#resetTodayBtn');
        if (resetTodayBtn) {
            resetTodayBtn.addEventListener('click', async () => {
                // Require PIN verification for reset
                if (typeof PIN !== 'undefined') {
                    const verified = await PIN.verify();
                    if (!verified) return;
                }
                showResetTodayModal(memberId, container);
            });
        }
    }

    /**
     * Show logged toast notification
     */
    function showLoggedToast(activityName) {
        const toast = document.createElement('div');
        toast.className = 'kid-workout-toast';
        toast.innerHTML = `✅ ${activityName} logged!`;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('kid-workout-toast--show');
        }, 10);

        setTimeout(() => {
            toast.classList.remove('kid-workout-toast--show');
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }

    /**
     * Get the widget container for a member
     */
    function getWidgetContainer(memberId) {
        // Try to find the widget container by looking for the kid-workout-widget
        const widget = document.querySelector('.kid-workout-widget');
        if (widget) {
            return widget.parentElement;
        }
        // Fallback: look for widget-kid-workout container
        return document.getElementById('widget-kid-workout') || document.querySelector('[data-widget="kid-workout"] .widget-card__body');
    }

    /**
     * Re-render widget after modal action
     */
    function refreshWidget(memberId) {
        const container = getWidgetContainer(memberId);
        if (container) {
            renderWidget(container, memberId);
        }
    }

    /**
     * Show quick log modal
     */
    function showQuickLogModal(memberId, widgetContainer) {
        const data = getWidgetData(memberId);

        const modal = document.createElement('div');
        modal.className = 'modal-overlay modal-overlay--active';
        modal.innerHTML = `
            <div class="modal kid-workout-modal">
                <div class="modal__header">
                    <h3 class="modal__title">🏃 Log Activity</h3>
                    <button class="modal__close" id="closeLogModal">
                        <i data-lucide="x"></i>
                    </button>
                </div>
                <div class="modal__body">
                    <!-- Category Filter -->
                    <div class="kid-workout-categories">
                        <button class="kid-workout-category kid-workout-category--active" data-category="all">
                            All
                        </button>
                        ${ACTIVITY_CATEGORIES.map(cat => `
                            <button class="kid-workout-category" data-category="${cat.id}" style="--cat-color: ${cat.color}">
                                ${cat.name}
                            </button>
                        `).join('')}
                    </div>

                    <!-- Activity Grid -->
                    <div class="kid-workout-activity-grid">
                        ${data.activities.map(activity => `
                            <button class="kid-workout-activity-card" data-activity-id="${activity.id}" data-category="${activity.category}">
                                <span class="kid-workout-activity-card__emoji">${ACTIVITY_EMOJIS[activity.id] || '🏃'}</span>
                                <span class="kid-workout-activity-card__name">${activity.name}</span>
                                <span class="kid-workout-activity-card__meta">${activity.duration}m · ${activity.points}pts</span>
                            </button>
                        `).join('')}
                    </div>

                    <!-- Add Custom -->
                    <button class="kid-workout-add-custom" id="addCustomFromLogBtn">
                        <i data-lucide="plus"></i>
                        Add Custom Activity
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Close modal helper
        const closeModal = () => {
            modal.remove();
        };

        // Category filter
        modal.querySelectorAll('.kid-workout-category').forEach(btn => {
            btn.addEventListener('click', () => {
                modal.querySelectorAll('.kid-workout-category').forEach(b => b.classList.remove('kid-workout-category--active'));
                btn.classList.add('kid-workout-category--active');

                const category = btn.dataset.category;
                modal.querySelectorAll('.kid-workout-activity-card').forEach(card => {
                    if (category === 'all' || card.dataset.category === category) {
                        card.style.display = '';
                    } else {
                        card.style.display = 'none';
                    }
                });
            });
        });

        // Activity selection
        modal.querySelectorAll('.kid-workout-activity-card').forEach(card => {
            card.addEventListener('click', () => {
                const activityId = card.dataset.activityId;
                const activityName = card.querySelector('.kid-workout-activity-card__name').textContent;
                logActivity(memberId, activityId);
                closeModal();
                refreshWidget(memberId);
                showLoggedToast(activityName);
            });
        });

        // Add custom
        modal.querySelector('#addCustomFromLogBtn')?.addEventListener('click', () => {
            closeModal();
            showAddCustomModal(memberId, widgetContainer);
        });

        // Close modal
        modal.querySelector('#closeLogModal')?.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }

    /**
     * Show add custom activity modal
     */
    function showAddCustomModal(memberId, widgetContainer) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay modal-overlay--active';
        modal.innerHTML = `
            <div class="modal kid-workout-modal">
                <div class="modal__header">
                    <h3 class="modal__title">➕ New Activity</h3>
                    <button class="modal__close" id="closeCustomModal">
                        <i data-lucide="x"></i>
                    </button>
                </div>
                <div class="modal__body">
                    <div class="form-group">
                        <label class="form-label">Activity Name</label>
                        <input type="text" class="form-input" id="customActivityName" placeholder="e.g., Trampoline" maxlength="30">
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Duration (minutes)</label>
                            <input type="number" class="form-input" id="customActivityDuration" value="15" min="5" max="120">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Points</label>
                            <input type="number" class="form-input" id="customActivityPoints" value="10" min="1" max="50">
                        </div>
                    </div>
                    <div class="kid-workout-custom-actions">
                        <button class="btn btn--primary btn--full" id="saveCustomActivityBtn">
                            <i data-lucide="plus"></i>
                            Add Activity
                        </button>
                        <button class="btn btn--success btn--full" id="saveAndLogActivityBtn">
                            <i data-lucide="check"></i>
                            Add & Log Now
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        const closeModal = () => modal.remove();

        // Save activity only
        modal.querySelector('#saveCustomActivityBtn')?.addEventListener('click', () => {
            const name = modal.querySelector('#customActivityName').value.trim();
            const duration = parseInt(modal.querySelector('#customActivityDuration').value) || 15;
            const points = parseInt(modal.querySelector('#customActivityPoints').value) || 10;

            if (!name) {
                modal.querySelector('#customActivityName').focus();
                return;
            }

            addCustomActivity(memberId, { name, duration, points });
            closeModal();
            refreshWidget(memberId);
            if (typeof Toast !== 'undefined') {
                Toast.success(`"${name}" added to activities!`);
            }
        });

        // Save and log immediately
        modal.querySelector('#saveAndLogActivityBtn')?.addEventListener('click', () => {
            const name = modal.querySelector('#customActivityName').value.trim();
            const duration = parseInt(modal.querySelector('#customActivityDuration').value) || 15;
            const points = parseInt(modal.querySelector('#customActivityPoints').value) || 10;

            if (!name) {
                modal.querySelector('#customActivityName').focus();
                return;
            }

            const newActivity = addCustomActivity(memberId, { name, duration, points });
            if (newActivity) {
                logActivity(memberId, newActivity.id);
                closeModal();
                refreshWidget(memberId);
                showLoggedToast(name);
            }
        });

        // Close
        modal.querySelector('#closeCustomModal')?.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        // Focus input
        setTimeout(() => {
            modal.querySelector('#customActivityName')?.focus();
        }, 100);
    }

    /**
     * Show reset today modal
     */
    function showResetTodayModal(memberId, widgetContainer) {
        const todayActivities = getTodayActivities(memberId);

        if (todayActivities.length === 0) {
            if (typeof Toast !== 'undefined') {
                Toast.info('No activities logged today');
            }
            return;
        }

        const modal = document.createElement('div');
        modal.className = 'modal-overlay modal-overlay--active';
        modal.innerHTML = `
            <div class="modal kid-workout-modal">
                <div class="modal__header">
                    <h3 class="modal__title">🔄 Reset Today's Activities</h3>
                    <button class="modal__close" id="closeResetModal">
                        <i data-lucide="x"></i>
                    </button>
                </div>
                <div class="modal__body">
                    <p class="reset-today-intro">Select activities to remove (points will be deducted):</p>
                    <div class="reset-today-list">
                        ${todayActivities.map(entry => `
                            <label class="reset-today-item">
                                <input type="checkbox" value="${entry.id}" data-points="${entry.points}">
                                <div class="reset-today-item__info">
                                    <span class="reset-today-item__emoji">${ACTIVITY_EMOJIS[entry.activityId] || '🏃'}</span>
                                    <span class="reset-today-item__name">${entry.name}</span>
                                </div>
                                <span class="reset-today-item__points">-${entry.points} pts</span>
                            </label>
                        `).join('')}
                    </div>
                    <div class="reset-today-actions">
                        <button class="btn btn--danger" id="resetAllTodayBtn">
                            <i data-lucide="trash-2"></i>
                            Reset All Today
                        </button>
                        <button class="btn btn--primary" id="resetSelectedBtn">
                            <i data-lucide="check"></i>
                            Remove Selected
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Close modal
        const closeModal = () => modal.remove();
        modal.querySelector('#closeResetModal')?.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        // Reset all today
        modal.querySelector('#resetAllTodayBtn')?.addEventListener('click', () => {
            let totalDeducted = 0;
            todayActivities.forEach(entry => {
                removeLogEntry(memberId, entry.id);
                totalDeducted += entry.points;
            });

            if (typeof Toast !== 'undefined') {
                Toast.success(`Reset all activities for today (-${totalDeducted} points)`);
            }

            closeModal();
            refreshWidget(memberId);
        });

        // Reset selected
        modal.querySelector('#resetSelectedBtn')?.addEventListener('click', () => {
            const selectedItems = modal.querySelectorAll('.reset-today-item input:checked');

            if (selectedItems.length === 0) {
                if (typeof Toast !== 'undefined') {
                    Toast.warning('Select at least one activity to remove');
                }
                return;
            }

            let totalDeducted = 0;
            selectedItems.forEach(cb => {
                removeLogEntry(memberId, cb.value);
                totalDeducted += parseInt(cb.dataset.points) || 0;
            });

            if (typeof Toast !== 'undefined') {
                Toast.success(`Removed ${selectedItems.length} activities (-${totalDeducted} points)`);
            }

            closeModal();
            refreshWidget(memberId);
        });
    }

    /**
     * Show manage activities modal - for parents to add/remove activities
     */
    function showManageModal(memberId, widgetContainer) {
        const data = getWidgetData(memberId);

        // Common emojis for activities
        const emojiOptions = ['🏃', '🏊', '🚴', '⚽', '🏀', '💃', '🧘', '🥾', '⛸️', '🎾', '🏓', '🎯', '🤸', '🏋️', '🚶', '🛹', '⚾', '🏈', '🎳', '🧗', '🤾', '🏇', '🥊', '🤼'];

        const modal = document.createElement('div');
        modal.className = 'modal-overlay modal-overlay--active';
        modal.innerHTML = `
            <div class="modal kid-workout-modal kid-workout-manage-modal">
                <div class="modal__header">
                    <h3 class="modal__title">⚙️ Manage Activities</h3>
                    <button class="modal__close" id="closeManageModal">
                        <i data-lucide="x"></i>
                    </button>
                </div>
                <div class="modal__body">
                    <!-- Add New Activity Section -->
                    <div class="manage-section">
                        <h4 class="manage-section__title">Add New Activity</h4>
                        <div class="manage-add-form">
                            <div class="manage-add-form__emoji-picker">
                                <button class="manage-emoji-selected" id="selectedEmoji">🏃</button>
                                <div class="manage-emoji-dropdown" id="emojiDropdown">
                                    ${emojiOptions.map(e => `<button class="manage-emoji-option" data-emoji="${e}">${e}</button>`).join('')}
                                </div>
                            </div>
                            <input type="text" class="form-input manage-add-form__name" id="newActivityName" placeholder="Activity name" maxlength="25">
                            <input type="number" class="form-input manage-add-form__points" id="newActivityPoints" placeholder="Pts" value="10" min="1" max="50">
                            <button class="btn btn--primary manage-add-form__btn" id="addActivityBtn">
                                <i data-lucide="plus"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Existing Activities List -->
                    <div class="manage-section">
                        <h4 class="manage-section__title">Activities</h4>
                        <div class="manage-activities-list" id="activitiesList">
                            ${data.activities.map(activity => {
                                const emoji = activity.emoji || ACTIVITY_EMOJIS[activity.id] || '🏃';
                                return `
                                    <div class="manage-activity-item ${activity.isCustom ? 'manage-activity-item--custom' : ''}" data-activity-id="${activity.id}">
                                        <span class="manage-activity-item__emoji">${emoji}</span>
                                        <span class="manage-activity-item__name">${activity.name}</span>
                                        <span class="manage-activity-item__points">+${activity.points}</span>
                                        <button class="manage-activity-item__delete" data-delete-activity="${activity.id}" title="Delete">
                                            <i data-lucide="trash-2"></i>
                                        </button>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        const closeModal = () => modal.remove();

        // Emoji picker toggle
        const selectedEmojiBtn = modal.querySelector('#selectedEmoji');
        const emojiDropdown = modal.querySelector('#emojiDropdown');
        let selectedEmoji = '🏃';

        selectedEmojiBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            emojiDropdown.classList.toggle('manage-emoji-dropdown--open');
        });

        modal.querySelectorAll('.manage-emoji-option').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                selectedEmoji = btn.dataset.emoji;
                selectedEmojiBtn.textContent = selectedEmoji;
                emojiDropdown.classList.remove('manage-emoji-dropdown--open');
            });
        });

        // Close dropdown when clicking outside
        modal.addEventListener('click', (e) => {
            if (!e.target.closest('.manage-add-form__emoji-picker')) {
                emojiDropdown.classList.remove('manage-emoji-dropdown--open');
            }
        });

        // Add new activity
        modal.querySelector('#addActivityBtn').addEventListener('click', () => {
            const name = modal.querySelector('#newActivityName').value.trim();
            const points = parseInt(modal.querySelector('#newActivityPoints').value) || 10;

            if (!name) {
                modal.querySelector('#newActivityName').focus();
                return;
            }

            addCustomActivity(memberId, { name, points, emoji: selectedEmoji });

            // Reset form
            modal.querySelector('#newActivityName').value = '';
            modal.querySelector('#newActivityPoints').value = '10';
            selectedEmoji = '🏃';
            selectedEmojiBtn.textContent = selectedEmoji;

            // Refresh the list
            closeModal();
            showManageModal(memberId, widgetContainer);
            refreshWidget(memberId);

            if (typeof Toast !== 'undefined') {
                Toast.success(`"${name}" added!`);
            }
        });

        // Delete activity buttons
        modal.querySelectorAll('[data-delete-activity]').forEach(btn => {
            btn.addEventListener('click', () => {
                const activityId = btn.dataset.deleteActivity;
                const activity = data.activities.find(a => a.id === activityId);
                if (confirm(`Delete "${activity?.name || 'this activity'}"?`)) {
                    deleteActivity(memberId, activityId);
                    closeModal();
                    showManageModal(memberId, widgetContainer);
                    refreshWidget(memberId);
                    if (typeof Toast !== 'undefined') {
                        Toast.success('Activity deleted');
                    }
                }
            });
        });

        // Close modal
        modal.querySelector('#closeManageModal')?.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }

    /**
     * Show full page view
     */
    function showFullPage(memberId) {
        const data = getWidgetData(memberId);
        const member = Storage.getMember(memberId);

        const mainEl = document.querySelector('.main');
        if (!mainEl) return;

        // Group log entries by date
        const logByDate = {};
        data.log.forEach(entry => {
            if (!logByDate[entry.date]) {
                logByDate[entry.date] = [];
            }
            logByDate[entry.date].push(entry);
        });

        // Sort dates descending
        const sortedDates = Object.keys(logByDate).sort((a, b) => b.localeCompare(a));

        // Calculate weekly stats
        const weekActivities = getWeekActivities(memberId);
        const weekMinutes = weekActivities.reduce((sum, a) => sum + a.duration, 0);
        const weekPoints = weekActivities.reduce((sum, a) => sum + a.points, 0);
        const weekDays = [...new Set(weekActivities.map(a => a.date))].length;

        mainEl.innerHTML = `
            <div class="kid-workout-page">
                <div class="page-header">
                    <button class="btn btn--ghost" id="backBtn">
                        <i data-lucide="arrow-left"></i>
                        Back
                    </button>
                    <h2 class="page-title">🏃 Move & Play</h2>
                    <button class="btn btn--primary" id="logNewBtn">
                        <i data-lucide="plus"></i>
                        Log Activity
                    </button>
                </div>

                <!-- Weekly Summary -->
                <div class="kid-workout-week-summary">
                    <h3 class="kid-workout-week-summary__title">This Week</h3>
                    <div class="kid-workout-week-stats">
                        <div class="kid-workout-week-stat">
                            <span class="kid-workout-week-stat__value">${weekDays}</span>
                            <span class="kid-workout-week-stat__label">Active Days</span>
                        </div>
                        <div class="kid-workout-week-stat">
                            <span class="kid-workout-week-stat__value">${weekMinutes}</span>
                            <span class="kid-workout-week-stat__label">Total Minutes</span>
                        </div>
                        <div class="kid-workout-week-stat">
                            <span class="kid-workout-week-stat__value">${weekPoints}</span>
                            <span class="kid-workout-week-stat__label">Points Earned</span>
                        </div>
                    </div>
                    <div class="kid-workout-goal-progress">
                        <div class="kid-workout-goal-progress__bar">
                            <div class="kid-workout-goal-progress__fill" style="width: ${Math.min(100, (weekDays / data.settings.weeklyGoal) * 100)}%"></div>
                        </div>
                        <span class="kid-workout-goal-progress__text">${weekDays} of ${data.settings.weeklyGoal} days goal</span>
                    </div>
                </div>

                <!-- Activity History -->
                <div class="kid-workout-history">
                    <h3 class="kid-workout-history__title">Activity History</h3>
                    ${sortedDates.length > 0 ? sortedDates.slice(0, 14).map(date => `
                        <div class="kid-workout-day">
                            <div class="kid-workout-day__header">
                                <span class="kid-workout-day__date">${formatDate(date)}</span>
                                <span class="kid-workout-day__stats">
                                    ${logByDate[date].reduce((sum, a) => sum + a.duration, 0)}m · ${logByDate[date].reduce((sum, a) => sum + a.points, 0)} pts
                                </span>
                            </div>
                            <div class="kid-workout-day__activities">
                                ${logByDate[date].map(entry => `
                                    <div class="kid-workout-day__activity">
                                        <span class="kid-workout-day__emoji">${ACTIVITY_EMOJIS[entry.activityId] || '🏃'}</span>
                                        <span class="kid-workout-day__name">${entry.name}</span>
                                        <span class="kid-workout-day__duration">${entry.duration}m</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `).join('') : `
                        <div class="kid-workout-empty-history">
                            <span class="kid-workout-empty-history__emoji">🌟</span>
                            <p>No activities logged yet!</p>
                            <p class="kid-workout-empty-history__hint">Start moving and track your fun activities.</p>
                        </div>
                    `}
                </div>

                <!-- Manage Activities -->
                <div class="kid-workout-manage">
                    <h3 class="kid-workout-manage__title">My Activities</h3>
                    <p class="kid-workout-manage__hint">Custom activities you've added</p>
                    <div class="kid-workout-manage__list">
                        ${data.activities.filter(a => a.isCustom).map(activity => `
                            <div class="kid-workout-manage__item" data-activity-id="${activity.id}">
                                <span class="kid-workout-manage__name">${activity.name}</span>
                                <span class="kid-workout-manage__meta">${activity.duration}m · ${activity.points}pts</span>
                                <button class="kid-workout-manage__delete" title="Delete">
                                    <i data-lucide="trash-2"></i>
                                </button>
                            </div>
                        `).join('')}
                        ${data.activities.filter(a => a.isCustom).length === 0 ? `
                            <p class="kid-workout-manage__empty">No custom activities yet</p>
                        ` : ''}
                    </div>
                    <button class="btn btn--outline" id="addCustomPageBtn">
                        <i data-lucide="plus"></i>
                        Add Custom Activity
                    </button>
                </div>
            </div>
        `;

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Bind events
        document.querySelector('#backBtn').addEventListener('click', () => {
            if (typeof Tabs !== 'undefined') {
                Tabs.switchTo(memberId);
            }
        });

        document.querySelector('#logNewBtn').addEventListener('click', () => {
            showQuickLogModal(memberId, mainEl);
        });

        document.querySelector('#addCustomPageBtn').addEventListener('click', () => {
            showAddCustomModal(memberId, mainEl);
        });

        // Delete custom activities
        mainEl.querySelectorAll('.kid-workout-manage__delete').forEach(btn => {
            btn.addEventListener('click', () => {
                const item = btn.closest('.kid-workout-manage__item');
                const activityId = item.dataset.activityId;
                if (confirm('Delete this custom activity?')) {
                    deleteActivity(memberId, activityId);
                    showFullPage(memberId);
                }
            });
        });
    }

    /**
     * Format date for display
     */
    function formatDate(dateStr) {
        const date = new Date(dateStr + 'T00:00:00');
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.getTime() === today.getTime()) {
            return 'Today';
        } else if (date.getTime() === yesterday.getTime()) {
            return 'Yesterday';
        }

        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }

    // Public API
    return {
        renderWidget,
        showFullPage,
        getWidgetData,
        logActivity,
        removeLogEntry,
        addCustomActivity,
        deleteActivity,
        getTodayActivities,
        getWeekActivities,
        ACTIVITY_CATEGORIES,
        DEFAULT_ACTIVITIES,
        ACTIVITY_EMOJIS
    };
})();
