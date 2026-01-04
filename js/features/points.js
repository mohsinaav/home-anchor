/**
 * Points System Feature
 * Kid-friendly point earning and tracking with categories and animations
 */

const Points = (function() {
    // Level/XP Configuration for Kids
    const LEVEL_CONFIG = {
        baseXP: 50,          // XP needed for level 1
        multiplier: 1.5,     // Each level requires 1.5x more XP
        maxLevel: 50,        // Maximum level
        levels: [
            { level: 1, name: 'Beginner', color: '#9CA3AF', icon: 'seedling' },
            { level: 5, name: 'Rising Star', color: '#60A5FA', icon: 'star' },
            { level: 10, name: 'Achiever', color: '#34D399', icon: 'trophy' },
            { level: 15, name: 'Champion', color: '#A78BFA', icon: 'medal' },
            { level: 20, name: 'Super Star', color: '#F59E0B', icon: 'crown' },
            { level: 30, name: 'Legend', color: '#EF4444', icon: 'flame' },
            { level: 40, name: 'Master', color: '#EC4899', icon: 'gem' },
            { level: 50, name: 'Ultimate', color: '#8B5CF6', icon: 'sparkles' }
        ]
    };

    // Rank Configuration for Teens (more mature)
    const TEEN_RANK_CONFIG = {
        baseXP: 50,
        multiplier: 1.5,
        maxLevel: 50,
        levels: [
            { level: 1, name: 'Novice', color: '#9CA3AF', icon: 'user' },
            { level: 5, name: 'Apprentice', color: '#60A5FA', icon: 'zap' },
            { level: 10, name: 'Skilled', color: '#34D399', icon: 'target' },
            { level: 15, name: 'Expert', color: '#A78BFA', icon: 'award' },
            { level: 20, name: 'Elite', color: '#F59E0B', icon: 'star' },
            { level: 30, name: 'Veteran', color: '#EF4444', icon: 'shield' },
            { level: 40, name: 'Master', color: '#EC4899', icon: 'gem' },
            { level: 50, name: 'Legendary', color: '#8B5CF6', icon: 'crown' }
        ]
    };

    // Activity categories
    const ACTIVITY_CATEGORIES = [
        { id: 'hygiene', name: 'Hygiene', icon: 'droplets', color: '#3B82F6' },
        { id: 'chores', name: 'Chores', icon: 'home', color: '#10B981' },
        { id: 'school', name: 'School', icon: 'book', color: '#8B5CF6' },
        { id: 'health', name: 'Health', icon: 'heart', color: '#EF4444' },
        { id: 'kindness', name: 'Kindness', icon: 'hand-heart', color: '#EC4899' },
        { id: 'custom', name: 'Other', icon: 'star', color: '#F59E0B' }
    ];

    // Teen-specific categories (more mature language)
    const TEEN_ACTIVITY_CATEGORIES = [
        { id: 'hygiene', name: 'Self-Care', icon: 'droplets', color: '#3B82F6' },
        { id: 'chores', name: 'Responsibilities', icon: 'home', color: '#10B981' },
        { id: 'school', name: 'Academics', icon: 'book', color: '#8B5CF6' },
        { id: 'health', name: 'Wellness', icon: 'heart', color: '#EF4444' },
        { id: 'kindness', name: 'Social', icon: 'users', color: '#EC4899' },
        { id: 'custom', name: 'Other', icon: 'star', color: '#F59E0B' }
    ];

    // Activity icons
    const ACTIVITY_ICONS = [
        'bed', 'smile', 'book', 'home', 'book-open', 'dumbbell', 'apple',
        'heart', 'star', 'sun', 'moon', 'droplets', 'shirt', 'utensils',
        'trash-2', 'dog', 'music', 'palette', 'gamepad-2', 'bike'
    ];

    // Default activities by category
    const DEFAULT_ACTIVITIES = {
        hygiene: [
            { id: 'act-brush-am', name: 'Brush teeth (AM)', points: 3, icon: 'smile' },
            { id: 'act-brush-pm', name: 'Brush teeth (PM)', points: 3, icon: 'smile' },
            { id: 'act-shower', name: 'Take shower', points: 5, icon: 'droplets' }
        ],
        chores: [
            { id: 'act-bed', name: 'Make bed', points: 5, icon: 'bed' },
            { id: 'act-dishes', name: 'Help with dishes', points: 8, icon: 'home' },
            { id: 'act-room', name: 'Clean room', points: 10, icon: 'home' }
        ],
        school: [
            { id: 'act-homework', name: 'Do homework', points: 10, icon: 'book' },
            { id: 'act-read', name: 'Read for 20 min', points: 7, icon: 'book-open' }
        ],
        health: [],
        kindness: [],
        custom: []
    };

    /**
     * Get widget data with defaults
     */
    function getWidgetData(memberId) {
        // Get fresh data from storage
        const allData = Storage.getAll();
        const storedData = allData.widgetData?.[memberId]?.['points'];

        // If no stored data at all, initialize with defaults
        if (!storedData) {
            const activities = [];
            Object.entries(DEFAULT_ACTIVITIES).forEach(([category, items]) => {
                items.forEach(item => {
                    activities.push({
                        ...item,
                        id: `${item.id}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                        category
                    });
                });
            });
            const newData = {
                activities,
                balance: 0,
                todayCompleted: [],
                history: []
            };
            Storage.setWidgetData(memberId, 'points', newData);
            return newData;
        }

        // If stored data exists but activities array is missing, add defaults
        if (!storedData.activities) {
            const activities = [];
            Object.entries(DEFAULT_ACTIVITIES).forEach(([category, items]) => {
                items.forEach(item => {
                    activities.push({
                        ...item,
                        id: `${item.id}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                        category
                    });
                });
            });
            storedData.activities = activities;
            Storage.setWidgetData(memberId, 'points', storedData);
        }

        // Ensure other required fields exist
        if (!storedData.todayCompleted) storedData.todayCompleted = [];
        if (!storedData.history) storedData.history = [];
        if (storedData.balance === undefined) storedData.balance = 0;

        return storedData;
    }

    /**
     * Render the points widget for a member
     */
    function renderWidget(container, memberId) {
        // Get member info to check if teen
        const members = Storage.getMembers();
        const member = members.find(m => m.id === memberId);
        const isTeen = member && member.type === 'teen';

        const widgetData = getWidgetData(memberId);
        const today = DateUtils.today();
        const todayActivities = widgetData.todayCompleted?.filter(c => c.date === today) || [];
        const settings = widgetData.settings || { categoryFilter: 'all', fontSize: 'normal', reducedMotion: false };
        const currentFilter = settings.categoryFilter || 'all';

        // Get all activities flat for display
        const allActivities = widgetData.activities || [];

        // Filter activities by category
        const filteredActivities = currentFilter === 'all'
            ? allActivities
            : allActivities.filter(a => a.category === currentFilter);

        // Calculate today's points earned
        const todayPoints = todayActivities.reduce((sum, c) => sum + (c.points || 0), 0);
        const dailyGoal = widgetData.dailyGoal || 20;
        const dailyGoalEnabled = widgetData.dailyGoalEnabled !== false;
        const goalProgress = dailyGoalEnabled ? Math.min(100, Math.round((todayPoints / dailyGoal) * 100)) : 0;

        // Calculate streak
        const streak = calculateStreak(widgetData.history || []);

        // Calculate level
        const totalXP = getTotalXP(widgetData.history || []);
        const levelInfo = calculateLevel(totalXP, isTeen);

        // Get font size class
        const fontSizeClass = settings.fontSize === 'large' ? 'points-widget--large-text' : '';
        const reducedMotionClass = settings.reducedMotion ? 'points-widget--reduced-motion' : '';

        container.innerHTML = `
            <div class="points-widget points-widget--kid ${fontSizeClass} ${reducedMotionClass}">
                <!-- Full-width Balance Card -->
                <div class="points-widget__balance-card">
                    <div class="points-widget__balance-main">
                        <div class="points-widget__star-icon">
                            <i data-lucide="${isTeen ? 'coins' : 'star'}"></i>
                        </div>
                        <div class="points-widget__balance-content">
                            <span class="points-widget__count--big" id="pointsBalance">${widgetData.balance || 0}</span>
                            <span class="points-widget__label--big">${isTeen ? 'Coins' : 'Points'}</span>
                        </div>
                    </div>
                    <div class="points-widget__balance-badges">
                        <div class="points-widget__level-badge" style="--level-color: ${levelInfo.rankColor}">
                            <span class="points-widget__level-number">${isTeen ? 'Rank' : 'Lv.'} ${levelInfo.level}</span>
                            <span class="points-widget__level-name">${levelInfo.rankName}</span>
                        </div>
                        ${streak > 0 ? `
                            <div class="points-widget__streak-badge-inline">
                                <span class="points-widget__streak-flame">🔥</span>
                                <span class="points-widget__streak-count">${streak}${isTeen ? ' day streak' : ''}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>

                <!-- XP Progress Bar -->
                <div class="points-widget__xp-section">
                    <div class="points-widget__xp-bar">
                        <div class="points-widget__xp-bar-fill" style="width: ${levelInfo.progress}%; background-color: ${levelInfo.rankColor}"></div>
                    </div>
                    <div class="points-widget__xp-info">
                        <span class="points-widget__xp-progress">${levelInfo.currentXP} / ${levelInfo.xpToNextLevel} XP to next level</span>
                        <span class="points-widget__xp-total">${totalXP} Total XP</span>
                    </div>
                </div>

                ${dailyGoalEnabled ? `
                    <div class="points-widget__daily-goal">
                        <div class="points-widget__daily-goal-header">
                            <span class="points-widget__daily-goal-title">${isTeen ? 'Daily Target' : 'Today\'s Goal'}</span>
                            <span class="points-widget__daily-goal-progress">${todayPoints} / ${dailyGoal} ${isTeen ? 'coins' : 'pts'}</span>
                        </div>
                        <div class="points-widget__daily-goal-bar">
                            <div class="points-widget__daily-goal-fill ${goalProgress >= 100 ? 'points-widget__daily-goal-fill--complete' : ''}" style="width: ${goalProgress}%"></div>
                        </div>
                        ${goalProgress >= 100 ? `<span class="points-widget__daily-goal-complete">${isTeen ? 'Target Achieved! 🎯' : 'Goal Complete!'}</span>` : ''}
                    </div>
                ` : ''}

                <div class="points-widget__activities">
                    <div class="points-widget__activities-header">
                        <h4 class="points-widget__section-title">${isTeen ? 'Earn Coins Today' : 'Earn Points Today'}</h4>
                        <button class="btn btn--icon btn--ghost btn--sm" data-action="toggle-settings" title="Display Settings">
                            <i data-lucide="sliders-horizontal"></i>
                        </button>
                    </div>

                    <div class="points-widget__settings-panel" id="pointsSettingsPanel" style="display: none;">
                        <div class="points-settings-row">
                            <span class="points-settings-label">Font Size</span>
                            <div class="points-settings-toggle">
                                <button class="points-settings-btn ${settings.fontSize === 'normal' ? 'points-settings-btn--active' : ''}" data-font-size="normal">Normal</button>
                                <button class="points-settings-btn ${settings.fontSize === 'large' ? 'points-settings-btn--active' : ''}" data-font-size="large">Large</button>
                            </div>
                        </div>
                        <div class="points-settings-row">
                            <span class="points-settings-label">Reduced Motion</span>
                            <label class="toggle-switch toggle-switch--sm">
                                <input type="checkbox" id="reducedMotionToggle" ${settings.reducedMotion ? 'checked' : ''}>
                                <span class="toggle-switch__slider"></span>
                            </label>
                        </div>
                    </div>

                    <div class="points-widget__category-filter">
                        <button class="points-category-pill ${currentFilter === 'all' ? 'points-category-pill--active' : ''}" data-category="all">
                            <i data-lucide="layers"></i>
                            All
                        </button>
                        ${(isTeen ? TEEN_ACTIVITY_CATEGORIES : ACTIVITY_CATEGORIES).map(cat => `
                            <button class="points-category-pill ${currentFilter === cat.id ? 'points-category-pill--active' : ''}"
                                    data-category="${cat.id}"
                                    style="--pill-color: ${cat.color}">
                                <i data-lucide="${cat.icon}"></i>
                                ${cat.name}
                            </button>
                        `).join('')}
                    </div>

                    <div class="points-activities-grid points-activities-grid--large">
                        ${filteredActivities.length === 0 ? `
                            <div class="points-activities-empty">
                                <i data-lucide="inbox"></i>
                                <span>No ${currentFilter === 'all' ? '' : (isTeen ? TEEN_ACTIVITY_CATEGORIES : ACTIVITY_CATEGORIES).find(c => c.id === currentFilter)?.name + ' '}activities yet</span>
                            </div>
                        ` : filteredActivities.map(activity => {
                            const maxPerDay = activity.maxPerDay || 1;
                            const completedCount = todayActivities.filter(c => c.activityId === activity.id).length;
                            const isFullyCompleted = completedCount >= maxPerDay;
                            const categories = isTeen ? TEEN_ACTIVITY_CATEGORIES : ACTIVITY_CATEGORIES;
                            const category = categories.find(c => c.id === activity.category) || categories[5];
                            return `
                                <button
                                    class="points-activity--kid ${isFullyCompleted ? 'points-activity--completed' : ''} ${activity.required ? 'points-activity--required' : ''}"
                                    data-activity-id="${activity.id}"
                                    data-member-id="${memberId}"
                                    style="--activity-color: ${category.color}"
                                    ${isFullyCompleted ? 'disabled' : ''}
                                >
                                    <div class="points-activity--kid__icon" style="background-color: ${category.color}">
                                        <i data-lucide="${activity.icon || 'star'}"></i>
                                    </div>
                                    <span class="points-activity--kid__name">${activity.name}</span>
                                    <span class="points-activity--kid__points">+${activity.points}</span>
                                    ${maxPerDay > 1 ? `<span class="points-activity--kid__count">${completedCount}/${maxPerDay}</span>` : ''}
                                    ${isFullyCompleted ? '<div class="points-activity--kid__check"><i data-lucide="check"></i></div>' : ''}
                                    ${activity.required && !isFullyCompleted ? '<span class="points-activity--kid__required">!</span>' : ''}
                                </button>
                            `;
                        }).join('')}
                    </div>
                </div>

                <div class="points-widget__footer">
                    <button class="btn btn--sm btn--ghost" data-action="view-history" data-member-id="${memberId}">
                        <i data-lucide="history"></i>
                        History
                    </button>
                    <button class="btn btn--sm btn--ghost" data-action="reset-today" data-member-id="${memberId}" title="Reset Today's Points (Admin)">
                        <i data-lucide="rotate-ccw"></i>
                        Reset
                    </button>
                    <button class="btn btn--sm btn--ghost" data-action="manage-activities" data-member-id="${memberId}">
                        <i data-lucide="settings"></i>
                        Manage
                    </button>
                </div>
            </div>
        `;

        // Bind events
        bindPointsEvents(container, memberId, widgetData);

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    /**
     * Bind click events for points activities
     */
    function bindPointsEvents(container, memberId, widgetData) {
        // Activity click - handle multi-complete activities
        container.querySelectorAll('.points-activity--kid:not([disabled])').forEach(btn => {
            btn.addEventListener('click', () => {
                const activityId = btn.dataset.activityId;
                completeActivity(memberId, activityId, widgetData, btn);
            });
        });

        // History button
        container.querySelector('[data-action="view-history"]')?.addEventListener('click', () => {
            showHistoryPage(memberId);
        });

        // Manage button
        container.querySelector('[data-action="manage-activities"]')?.addEventListener('click', async () => {
            const verified = await PIN.verify();
            if (verified) {
                showManageActivitiesModal(memberId);
            }
        });

        // Reset today button (admin)
        container.querySelector('[data-action="reset-today"]')?.addEventListener('click', async () => {
            const verified = await PIN.verify();
            if (verified) {
                showResetTodayModal(memberId);
            }
        });

        // Category filter pills
        container.querySelectorAll('.points-category-pill').forEach(pill => {
            pill.addEventListener('click', () => {
                const category = pill.dataset.category;
                const data = getWidgetData(memberId);
                if (!data.settings) data.settings = {};
                data.settings.categoryFilter = category;
                Storage.setWidgetData(memberId, 'points', data);

                // Re-render widget
                const widgetBody = document.getElementById('widget-points');
                if (widgetBody) {
                    renderWidget(widgetBody, memberId);
                }
            });
        });

        // Settings panel toggle
        container.querySelector('[data-action="toggle-settings"]')?.addEventListener('click', () => {
            const panel = document.getElementById('pointsSettingsPanel');
            if (panel) {
                panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
            }
        });

        // Font size buttons
        container.querySelectorAll('[data-font-size]').forEach(btn => {
            btn.addEventListener('click', () => {
                const fontSize = btn.dataset.fontSize;
                const data = getWidgetData(memberId);
                if (!data.settings) data.settings = {};
                data.settings.fontSize = fontSize;
                Storage.setWidgetData(memberId, 'points', data);

                // Re-render widget
                const widgetBody = document.getElementById('widget-points');
                if (widgetBody) {
                    renderWidget(widgetBody, memberId);
                }
            });
        });

        // Reduced motion toggle
        container.querySelector('#reducedMotionToggle')?.addEventListener('change', (e) => {
            const data = getWidgetData(memberId);
            if (!data.settings) data.settings = {};
            data.settings.reducedMotion = e.target.checked;
            Storage.setWidgetData(memberId, 'points', data);

            // Re-render widget
            const widgetBody = document.getElementById('widget-points');
            if (widgetBody) {
                renderWidget(widgetBody, memberId);
            }
        });
    }

    /**
     * Complete an activity and award points with animation
     */
    function completeActivity(memberId, activityId, widgetData, buttonElement) {
        const activity = widgetData.activities.find(a => a.id === activityId);
        if (!activity) return;

        const today = DateUtils.today();
        const now = new Date().toISOString();

        // Calculate streak bonus
        const streak = calculateStreak(widgetData.history || []);
        let bonusMultiplier = 1;
        let bonusLabel = '';
        if (streak >= 7) {
            bonusMultiplier = 1.10; // +10% for 7+ day streak
            bonusLabel = '+10% streak bonus!';
        } else if (streak >= 3) {
            bonusMultiplier = 1.05; // +5% for 3+ day streak
            bonusLabel = '+5% streak bonus!';
        }

        const basePoints = activity.points;
        const bonusPoints = Math.round(basePoints * bonusMultiplier);
        const totalPoints = bonusPoints;

        // Update widget data
        const updatedData = {
            ...widgetData,
            balance: (widgetData.balance || 0) + totalPoints,
            todayCompleted: [
                ...(widgetData.todayCompleted || []),
                { activityId, date: today, points: totalPoints, basePoints, bonus: bonusPoints - basePoints, completedAt: now }
            ],
            history: [
                {
                    activityId,
                    activityName: activity.name,
                    activityIcon: activity.icon,
                    date: today,
                    completedAt: now,
                    points: totalPoints,
                    basePoints,
                    bonus: bonusPoints - basePoints,
                    type: 'earned'
                },
                ...(widgetData.history || []).slice(0, 99)
            ]
        };

        Storage.setWidgetData(memberId, 'points', updatedData);

        // Update achievements
        if (typeof Achievements !== 'undefined' && Achievements.updateStats) {
            Achievements.updateStats(memberId, 'points', activity.points);
            Achievements.updateStats(memberId, 'activity', 1);
        }

        // Animate the button
        if (buttonElement) {
            buttonElement.classList.add('points-activity--completed');
            buttonElement.disabled = true;
            // Add check icon if not present
            if (!buttonElement.querySelector('.points-activity--kid__check')) {
                const checkDiv = document.createElement('div');
                checkDiv.className = 'points-activity--kid__check';
                checkDiv.innerHTML = '<i data-lucide="check"></i>';
                buttonElement.appendChild(checkDiv);
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            }
        }

        // Animate the balance
        const balanceEl = document.getElementById('pointsBalance');
        if (balanceEl) {
            balanceEl.textContent = updatedData.balance;
            balanceEl.classList.add('points-earned-animation');
            setTimeout(() => balanceEl.classList.remove('points-earned-animation'), 400);
        }

        // Check if daily goal was just achieved
        const dailyGoalEnabled = widgetData.dailyGoalEnabled !== false;
        const dailyGoal = widgetData.dailyGoal || 20;
        const previousTodayPoints = (widgetData.todayCompleted || [])
            .filter(c => c.date === today)
            .reduce((sum, c) => sum + (c.points || 0), 0);
        const newTodayPoints = previousTodayPoints + activity.points;

        const goalJustAchieved = dailyGoalEnabled &&
            previousTodayPoints < dailyGoal &&
            newTodayPoints >= dailyGoal;

        // Show confetti (bigger celebration if goal achieved)
        showConfetti(goalJustAchieved);

        // Show celebration toast
        if (goalJustAchieved) {
            showCelebrationToast('🎉 Daily Goal Complete! Great job!', true);
        } else if (bonusLabel) {
            showCelebrationToast(`+${totalPoints} pts for ${activity.name}! (${bonusLabel})`);
        } else {
            showCelebrationToast(`+${totalPoints} points for ${activity.name}!`);
        }

        // Re-render widget after animation
        setTimeout(() => {
            const widgetBody = document.getElementById('widget-points');
            if (widgetBody) {
                renderWidget(widgetBody, memberId);
            }
        }, 500);
    }

    /**
     * Show confetti animation
     * @param {boolean} bigCelebration - If true, shows more confetti for goal completion
     */
    function showConfetti(bigCelebration = false) {
        const container = document.createElement('div');
        container.className = 'confetti-container';

        const colors = ['#FCD34D', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];
        const shapes = ['star', 'circle', 'square'];
        const count = bigCelebration ? 60 : 30;

        for (let i = 0; i < count; i++) {
            const confetti = document.createElement('div');
            const shape = shapes[Math.floor(Math.random() * shapes.length)];
            const color = colors[Math.floor(Math.random() * colors.length)];
            const size = bigCelebration ? (8 + Math.random() * 8) : 12;

            confetti.className = `confetti confetti--${shape}`;
            confetti.style.cssText = `
                left: ${Math.random() * 100}%;
                background-color: ${color};
                animation-delay: ${Math.random() * (bigCelebration ? 0.8 : 0.5)}s;
                animation-duration: ${1.5 + Math.random() * (bigCelebration ? 1 : 0.5)}s;
                width: ${size}px;
                height: ${size}px;
            `;

            container.appendChild(confetti);
        }

        document.body.appendChild(container);

        setTimeout(() => container.remove(), bigCelebration ? 4000 : 3000);
    }

    /**
     * Show celebration toast
     * @param {string} message - Message to display
     * @param {boolean} isGoalComplete - If true, shows a special goal-complete toast
     */
    function showCelebrationToast(message, isGoalComplete = false) {
        const toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) return;

        const toast = document.createElement('div');
        toast.className = `toast toast--success toast--celebrate ${isGoalComplete ? 'toast--goal-complete' : ''}`;
        toast.innerHTML = `<span>${message}</span>`;

        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('toast--exiting');
            setTimeout(() => toast.remove(), 300);
        }, isGoalComplete ? 4000 : 3000);
    }

    /**
     * Show points history page (visual timeline) with calendar and stats
     */
    function showHistoryPage(memberId) {
        const main = document.getElementById('mainContent');
        if (!main) return;

        const member = Storage.getMember(memberId);
        const widgetData = getWidgetData(memberId);
        const history = widgetData.history || [];

        // Group history by date
        const groupedHistory = {};
        history.forEach(entry => {
            if (!groupedHistory[entry.date]) {
                groupedHistory[entry.date] = [];
            }
            groupedHistory[entry.date].push(entry);
        });

        // Sort dates descending
        const sortedDates = Object.keys(groupedHistory).sort((a, b) => b.localeCompare(a));

        // Calculate streak
        const streak = calculateStreak(history);

        // Calculate level info
        const totalXP = getTotalXP(history);
        const levelInfo = calculateLevel(totalXP);

        // Calculate weekly stats
        const today = new Date();
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        weekStart.setHours(0, 0, 0, 0);

        const weekHistory = history.filter(h => {
            const entryDate = new Date(h.date);
            return entryDate >= weekStart && h.type === 'earned';
        });

        const weekPoints = weekHistory.reduce((sum, h) => sum + h.points, 0);
        const weekActivities = weekHistory.length;
        const weekDays = [...new Set(weekHistory.map(h => h.date))].length;

        // Calculate monthly stats
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthHistory = history.filter(h => {
            const entryDate = new Date(h.date);
            return entryDate >= monthStart && h.type === 'earned';
        });
        const monthPoints = monthHistory.reduce((sum, h) => sum + h.points, 0);
        const monthActivities = monthHistory.length;
        const monthDays = [...new Set(monthHistory.map(h => h.date))].length;
        const avgPointsPerDay = monthDays > 0 ? Math.round(monthPoints / monthDays) : 0;

        // Get most completed activities
        const activityCounts = {};
        history.filter(h => h.type === 'earned').forEach(h => {
            activityCounts[h.activityName] = (activityCounts[h.activityName] || 0) + 1;
        });
        const topActivities = Object.entries(activityCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        // Get date labels
        const todayStr = DateUtils.today();
        const yesterday = DateUtils.formatISO(DateUtils.addDays(new Date(), -1));

        const getDateLabel = (date) => {
            if (date === todayStr) return 'Today';
            if (date === yesterday) return 'Yesterday';
            return DateUtils.formatShort(date);
        };

        // Generate streak calendar (last 7 days)
        const streakCalendar = [];
        const earnedDates = new Set(history.filter(h => h.type === 'earned').map(h => h.date));
        for (let i = 6; i >= 0; i--) {
            const d = DateUtils.addDays(new Date(), -i);
            const dateStr = DateUtils.formatISO(d);
            const dayName = DateUtils.getDayName(d, true);
            const hasActivity = earnedDates.has(dateStr);
            const isToday = i === 0;
            streakCalendar.push({ dateStr, dayName, hasActivity, isToday });
        }

        // Generate monthly calendar grid
        const calendarMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        const firstDayOfWeek = calendarMonth.getDay();
        const monthName = calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

        // Build calendar days with activity data
        const calendarDays = [];
        for (let i = 0; i < firstDayOfWeek; i++) {
            calendarDays.push({ empty: true });
        }
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(today.getFullYear(), today.getMonth(), day);
            const dateStr = DateUtils.formatISO(date);
            const dayActivities = groupedHistory[dateStr] || [];
            const dayPoints = dayActivities.filter(a => a.type === 'earned').reduce((sum, a) => sum + a.points, 0);
            const activityCount = dayActivities.filter(a => a.type === 'earned').length;
            const isToday = dateStr === todayStr;
            const isFuture = date > today;

            // Color intensity based on activity count
            let intensity = 0;
            if (activityCount > 0) {
                intensity = Math.min(4, Math.ceil(activityCount / 2));
            }

            calendarDays.push({
                day,
                dateStr,
                dayPoints,
                activityCount,
                isToday,
                isFuture,
                intensity
            });
        }

        // Calculate streak bonus info
        let streakBonusText = '';
        if (streak >= 7) {
            streakBonusText = '+10% bonus on all activities!';
        } else if (streak >= 3) {
            streakBonusText = '+5% bonus on all activities!';
        } else if (streak > 0) {
            streakBonusText = `${3 - streak} more day${3 - streak > 1 ? 's' : ''} until +5% bonus!`;
        }

        main.innerHTML = `
            <div class="points-history-page">
                <div class="page-header">
                    <button class="btn btn--ghost" id="backBtn">
                        <i data-lucide="arrow-left"></i>
                        Back
                    </button>
                    <h2 class="page-title">⭐ Points</h2>
                    <div class="page-header__balance">
                        <span class="page-header__balance-value">${widgetData.balance || 0}</span>
                        <span class="page-header__balance-label">pts</span>
                    </div>
                </div>

                <!-- Level & XP Section -->
                <div class="level-section">
                    <div class="level-section__badge" style="--level-color: ${levelInfo.rankColor}">
                        <div class="level-section__icon">
                            <i data-lucide="${levelInfo.rankIcon}"></i>
                        </div>
                        <div class="level-section__info">
                            <span class="level-section__level">Level ${levelInfo.level}</span>
                            <span class="level-section__rank">${levelInfo.rankName}</span>
                        </div>
                    </div>
                    <div class="level-section__xp">
                        <div class="level-section__xp-bar">
                            <div class="level-section__xp-fill" style="width: ${levelInfo.progress}%; background-color: ${levelInfo.rankColor}"></div>
                        </div>
                        <div class="level-section__xp-text">
                            <span>${levelInfo.currentXP} / ${levelInfo.xpToNextLevel} XP to Level ${levelInfo.level + 1}</span>
                            <span class="level-section__total-xp">${totalXP} Total XP</span>
                        </div>
                    </div>
                </div>

                <!-- Streak Section -->
                <div class="streak-section">
                    <div class="streak-section__header">
                        <div class="streak-section__flame ${streak >= 3 ? 'streak-section__flame--active' : ''} ${streak >= 7 ? 'streak-section__flame--super' : ''}">
                            🔥
                        </div>
                        <div class="streak-section__info">
                            <span class="streak-section__count">${streak}</span>
                            <span class="streak-section__label">Day Streak</span>
                        </div>
                        ${streakBonusText ? `<span class="streak-section__bonus">${streakBonusText}</span>` : ''}
                    </div>
                    <div class="streak-calendar">
                        ${streakCalendar.map(day => `
                            <div class="streak-calendar__day ${day.hasActivity ? 'streak-calendar__day--active' : ''} ${day.isToday ? 'streak-calendar__day--today' : ''}">
                                <span class="streak-calendar__day-name">${day.dayName}</span>
                                <span class="streak-calendar__day-icon">${day.hasActivity ? '✓' : '○'}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Stats Toggle Tabs -->
                <div class="history-tabs">
                    <button class="history-tab history-tab--active" data-tab="history">
                        <i data-lucide="list"></i>
                        History
                    </button>
                    <button class="history-tab" data-tab="calendar">
                        <i data-lucide="calendar"></i>
                        Calendar
                    </button>
                    <button class="history-tab" data-tab="stats">
                        <i data-lucide="bar-chart-3"></i>
                        Stats
                    </button>
                </div>

                <!-- History View -->
                <div class="history-panel history-panel--history" id="panelHistory">
                    ${sortedDates.length === 0 ? `
                        <div class="points-empty-history">
                            <span class="points-empty-history__emoji">🌟</span>
                            <p>No points history yet!</p>
                            <p class="points-empty-history__hint">Complete activities to start earning points.</p>
                        </div>
                    ` : sortedDates.slice(0, 14).map(date => `
                        <div class="points-day">
                            <div class="points-day__header">
                                <span class="points-day__date">${getDateLabel(date)}</span>
                                <span class="points-day__stats">
                                    ${groupedHistory[date].filter(e => e.type === 'earned').reduce((sum, e) => sum + e.points, 0)} earned
                                    ${groupedHistory[date].filter(e => e.type === 'spent').length > 0 ?
                                        ` · ${groupedHistory[date].filter(e => e.type === 'spent').reduce((sum, e) => sum + e.points, 0)} spent` : ''}
                                </span>
                            </div>
                            <div class="points-day__activities">
                                ${groupedHistory[date].map(entry => `
                                    <div class="points-day__activity points-day__activity--${entry.type}">
                                        <span class="points-day__icon">
                                            ${entry.type === 'spent' ? '🎁' : '⭐'}
                                        </span>
                                        <span class="points-day__name">${entry.activityName}</span>
                                        <span class="points-day__points points-day__points--${entry.type}">
                                            ${entry.type === 'spent' ? '-' : '+'}${entry.points}
                                        </span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>

                <!-- Calendar View -->
                <div class="history-panel history-panel--calendar" id="panelCalendar" style="display: none;">
                    <div class="points-calendar">
                        <div class="points-calendar__header">
                            <h3 class="points-calendar__month">${monthName}</h3>
                        </div>
                        <div class="points-calendar__weekdays">
                            <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
                        </div>
                        <div class="points-calendar__grid">
                            ${calendarDays.map(d => {
                                if (d.empty) return '<div class="points-calendar__day points-calendar__day--empty"></div>';
                                return `
                                    <div class="points-calendar__day ${d.isToday ? 'points-calendar__day--today' : ''} ${d.isFuture ? 'points-calendar__day--future' : ''} ${d.activityCount > 0 ? `points-calendar__day--level-${d.intensity}` : ''}"
                                         data-date="${d.dateStr}"
                                         title="${d.activityCount} activities, ${d.dayPoints} pts">
                                        <span class="points-calendar__day-number">${d.day}</span>
                                        ${d.activityCount > 0 ? `<span class="points-calendar__day-dots">${'●'.repeat(Math.min(3, d.activityCount))}</span>` : ''}
                                    </div>
                                `;
                            }).join('')}
                        </div>
                        <div class="points-calendar__legend">
                            <span class="points-calendar__legend-label">Less</span>
                            <span class="points-calendar__legend-box points-calendar__legend-box--0"></span>
                            <span class="points-calendar__legend-box points-calendar__legend-box--1"></span>
                            <span class="points-calendar__legend-box points-calendar__legend-box--2"></span>
                            <span class="points-calendar__legend-box points-calendar__legend-box--3"></span>
                            <span class="points-calendar__legend-box points-calendar__legend-box--4"></span>
                            <span class="points-calendar__legend-label">More</span>
                        </div>
                    </div>

                    <!-- Day Details (shown when clicking a date) -->
                    <div class="points-calendar__details" id="calendarDetails" style="display: none;">
                        <div class="points-calendar__details-header">
                            <span id="calendarDetailsDate"></span>
                            <button class="btn btn--icon btn--ghost btn--sm" id="closeCalendarDetails">
                                <i data-lucide="x"></i>
                            </button>
                        </div>
                        <div class="points-calendar__details-body" id="calendarDetailsBody"></div>
                    </div>
                </div>

                <!-- Stats View -->
                <div class="history-panel history-panel--stats" id="panelStats" style="display: none;">
                    <div class="stats-grid">
                        <div class="stats-card stats-card--primary">
                            <div class="stats-card__icon"><i data-lucide="trending-up"></i></div>
                            <div class="stats-card__value">${avgPointsPerDay}</div>
                            <div class="stats-card__label">Avg Points/Day</div>
                        </div>
                        <div class="stats-card">
                            <div class="stats-card__icon"><i data-lucide="calendar-check"></i></div>
                            <div class="stats-card__value">${monthDays}</div>
                            <div class="stats-card__label">Active Days (Month)</div>
                        </div>
                        <div class="stats-card">
                            <div class="stats-card__icon"><i data-lucide="check-circle"></i></div>
                            <div class="stats-card__value">${monthActivities}</div>
                            <div class="stats-card__label">Activities (Month)</div>
                        </div>
                        <div class="stats-card">
                            <div class="stats-card__icon"><i data-lucide="star"></i></div>
                            <div class="stats-card__value">${monthPoints}</div>
                            <div class="stats-card__label">Points (Month)</div>
                        </div>
                    </div>

                    <div class="stats-section">
                        <h4 class="stats-section__title">
                            <i data-lucide="trophy"></i>
                            Top Activities
                        </h4>
                        <div class="top-activities">
                            ${topActivities.length === 0 ? `
                                <p class="top-activities__empty">Complete some activities to see your favorites!</p>
                            ` : topActivities.map((activity, i) => `
                                <div class="top-activity">
                                    <span class="top-activity__rank">#${i + 1}</span>
                                    <span class="top-activity__name">${activity[0]}</span>
                                    <span class="top-activity__count">${activity[1]}x</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div class="stats-section">
                        <h4 class="stats-section__title">
                            <i data-lucide="bar-chart-3"></i>
                            This Week vs Last Week
                        </h4>
                        <div class="week-comparison">
                            <div class="week-comparison__item">
                                <span class="week-comparison__label">This Week</span>
                                <span class="week-comparison__value">${weekPoints} pts</span>
                                <span class="week-comparison__activities">${weekActivities} activities</span>
                            </div>
                            <div class="week-comparison__item week-comparison__item--last">
                                <span class="week-comparison__label">Last Week</span>
                                <span class="week-comparison__value">${calculateLastWeekPoints(history)} pts</span>
                                <span class="week-comparison__activities">${calculateLastWeekActivities(history)} activities</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Bind back button
        document.getElementById('backBtn')?.addEventListener('click', () => {
            if (typeof Tabs !== 'undefined' && Tabs.switchTo) {
                Tabs.switchTo(memberId);
            }
        });

        // Bind tab switching
        document.querySelectorAll('.history-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;

                // Update active tab
                document.querySelectorAll('.history-tab').forEach(t => t.classList.remove('history-tab--active'));
                tab.classList.add('history-tab--active');

                // Show corresponding panel
                document.querySelectorAll('.history-panel').forEach(panel => panel.style.display = 'none');
                document.getElementById(`panel${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`).style.display = 'block';
            });
        });

        // Bind calendar day clicks
        document.querySelectorAll('.points-calendar__day[data-date]').forEach(dayEl => {
            dayEl.addEventListener('click', () => {
                // Don't allow clicking on future days or empty cells
                if (dayEl.classList.contains('points-calendar__day--future') ||
                    dayEl.classList.contains('points-calendar__day--empty')) {
                    return;
                }

                const dateStr = dayEl.dataset.date;
                const dayActivities = groupedHistory[dateStr] || [];

                const detailsContainer = document.getElementById('calendarDetails');
                const detailsDate = document.getElementById('calendarDetailsDate');
                const detailsBody = document.getElementById('calendarDetailsBody');

                // Format the date for display
                const clickedDate = new Date(dateStr + 'T00:00:00');
                const formattedDate = clickedDate.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                });

                if (dayActivities.length === 0) {
                    detailsDate.textContent = formattedDate;
                    detailsBody.innerHTML = '<p class="points-calendar__no-activity">No activities on this day</p>';
                } else {
                    const earned = dayActivities.filter(a => a.type === 'earned');
                    const spent = dayActivities.filter(a => a.type === 'spent');
                    const totalEarned = earned.reduce((s, a) => s + a.points, 0);
                    const totalSpent = spent.reduce((s, a) => s + a.points, 0);

                    detailsDate.textContent = formattedDate;
                    detailsBody.innerHTML = `
                        <div class="points-calendar__day-stats">
                            <span>${earned.length} ${earned.length === 1 ? 'activity' : 'activities'}</span>
                            <span>${totalEarned} pts earned</span>
                            ${spent.length > 0 ? `<span>${totalSpent} pts spent</span>` : ''}
                        </div>
                        <div class="points-calendar__day-list">
                            ${dayActivities.map(a => `
                                <div class="points-calendar__day-item">
                                    <span>${a.type === 'spent' ? '🎁' : '⭐'} ${a.activityName}</span>
                                    <span class="${a.type === 'spent' ? 'text-danger' : 'text-success'}">${a.type === 'spent' ? '-' : '+'}${a.points}</span>
                                </div>
                            `).join('')}
                        </div>
                    `;
                }

                detailsContainer.style.display = 'block';

                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            });
        });

        // Close calendar details
        document.getElementById('closeCalendarDetails')?.addEventListener('click', () => {
            document.getElementById('calendarDetails').style.display = 'none';
        });
    }

    /**
     * Calculate last week's points
     */
    function calculateLastWeekPoints(history) {
        const today = new Date();
        const lastWeekEnd = new Date(today);
        lastWeekEnd.setDate(today.getDate() - today.getDay());
        lastWeekEnd.setHours(0, 0, 0, 0);

        const lastWeekStart = new Date(lastWeekEnd);
        lastWeekStart.setDate(lastWeekEnd.getDate() - 7);

        return history
            .filter(h => {
                const entryDate = new Date(h.date);
                return entryDate >= lastWeekStart && entryDate < lastWeekEnd && h.type === 'earned';
            })
            .reduce((sum, h) => sum + h.points, 0);
    }

    /**
     * Calculate last week's activity count
     */
    function calculateLastWeekActivities(history) {
        const today = new Date();
        const lastWeekEnd = new Date(today);
        lastWeekEnd.setDate(today.getDate() - today.getDay());
        lastWeekEnd.setHours(0, 0, 0, 0);

        const lastWeekStart = new Date(lastWeekEnd);
        lastWeekStart.setDate(lastWeekEnd.getDate() - 7);

        return history.filter(h => {
            const entryDate = new Date(h.date);
            return entryDate >= lastWeekStart && entryDate < lastWeekEnd && h.type === 'earned';
        }).length;
    }

    /**
     * Calculate streak from history
     */
    function calculateStreak(history) {
        if (!history || history.length === 0) return 0;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let streak = 0;
        let checkDate = new Date(today);

        // Get unique dates with earned points
        const earnedDates = new Set(
            history
                .filter(h => h.type === 'earned')
                .map(h => h.date)
        );

        // Check if today has points
        const todayStr = DateUtils.formatISO(today);
        if (!earnedDates.has(todayStr)) {
            // Check yesterday instead
            checkDate = DateUtils.addDays(today, -1);
        }

        // Count consecutive days
        while (true) {
            const dateStr = DateUtils.formatISO(checkDate);
            if (earnedDates.has(dateStr)) {
                streak++;
                checkDate = DateUtils.addDays(checkDate, -1);
            } else {
                break;
            }
        }

        return streak;
    }

    /**
     * Calculate XP needed for a specific level
     */
    function getXPForLevel(level) {
        if (level <= 1) return 0;
        let totalXP = 0;
        for (let i = 1; i < level; i++) {
            totalXP += Math.floor(LEVEL_CONFIG.baseXP * Math.pow(LEVEL_CONFIG.multiplier, i - 1));
        }
        return totalXP;
    }

    /**
     * Calculate level from total XP (total points ever earned)
     */
    function calculateLevel(totalXP, isTeen = false) {
        const config = isTeen ? TEEN_RANK_CONFIG : LEVEL_CONFIG;
        let level = 1;
        let xpNeeded = 0;

        while (level < config.maxLevel) {
            const xpForNextLevel = Math.floor(config.baseXP * Math.pow(config.multiplier, level - 1));
            if (xpNeeded + xpForNextLevel > totalXP) break;
            xpNeeded += xpForNextLevel;
            level++;
        }

        const currentLevelXP = totalXP - xpNeeded;
        const nextLevelXP = Math.floor(config.baseXP * Math.pow(config.multiplier, level - 1));
        const progress = Math.min(100, Math.round((currentLevelXP / nextLevelXP) * 100));

        // Find rank info
        let rankInfo = config.levels[0];
        for (let i = config.levels.length - 1; i >= 0; i--) {
            if (level >= config.levels[i].level) {
                rankInfo = config.levels[i];
                break;
            }
        }

        return {
            level,
            rankName: rankInfo.name,
            rankColor: rankInfo.color,
            rankIcon: rankInfo.icon,
            currentXP: currentLevelXP,
            xpToNextLevel: nextLevelXP,
            progress,
            totalXP
        };
    }

    /**
     * Get total XP ever earned from history
     */
    function getTotalXP(history) {
        return (history || [])
            .filter(h => h.type === 'earned')
            .reduce((sum, h) => sum + (h.points || 0), 0);
    }

    /**
     * Show manage activities modal (admin) with categories
     */
    function showManageActivitiesModal(memberId) {
        const widgetData = getWidgetData(memberId);
        const activities = widgetData.activities || [];
        const dailyGoal = widgetData.dailyGoal || 20;
        const dailyGoalEnabled = widgetData.dailyGoalEnabled !== false;

        // Group by category
        const byCategory = {};
        ACTIVITY_CATEGORIES.forEach(cat => {
            byCategory[cat.id] = activities.filter(a => a.category === cat.id);
        });

        const content = `
            <div class="manage-activities-v2">
                <!-- Daily Goal Settings -->
                <div class="daily-goal-settings">
                    <div class="daily-goal-settings__header">
                        <i data-lucide="target"></i>
                        <span>Daily Goal Settings</span>
                    </div>
                    <div class="daily-goal-settings__content">
                        <div class="daily-goal-settings__row">
                            <span class="daily-goal-settings__label">Enable Daily Goal</span>
                            <label class="toggle-switch">
                                <input type="checkbox" id="dailyGoalEnabled" ${dailyGoalEnabled ? 'checked' : ''}>
                                <span class="toggle-switch__slider"></span>
                            </label>
                        </div>
                        <div class="daily-goal-settings__row" id="dailyGoalValueRow" ${!dailyGoalEnabled ? 'style="opacity: 0.5; pointer-events: none;"' : ''}>
                            <span class="daily-goal-settings__label">Points to earn per day</span>
                            <div class="daily-goal-settings__input-group">
                                <input type="number" class="form-input form-input--sm" id="dailyGoalValue" value="${dailyGoal}" min="5" max="100" step="5">
                                <span class="daily-goal-settings__suffix">pts</span>
                            </div>
                        </div>
                        <div class="daily-goal-settings__presets" id="goalPresets" ${!dailyGoalEnabled ? 'style="opacity: 0.5; pointer-events: none;"' : ''}>
                            <button type="button" class="daily-goal-preset ${dailyGoal === 10 ? 'daily-goal-preset--active' : ''}" data-goal="10">10</button>
                            <button type="button" class="daily-goal-preset ${dailyGoal === 15 ? 'daily-goal-preset--active' : ''}" data-goal="15">15</button>
                            <button type="button" class="daily-goal-preset ${dailyGoal === 20 ? 'daily-goal-preset--active' : ''}" data-goal="20">20</button>
                            <button type="button" class="daily-goal-preset ${dailyGoal === 30 ? 'daily-goal-preset--active' : ''}" data-goal="30">30</button>
                            <button type="button" class="daily-goal-preset ${dailyGoal === 50 ? 'daily-goal-preset--active' : ''}" data-goal="50">50</button>
                        </div>
                    </div>
                </div>

                <div class="manage-activities-v2__reset">
                    <button class="btn btn--danger btn--sm" id="resetAllActivitiesBtn">
                        <i data-lucide="trash-2"></i>
                        Reset All Activities to Defaults
                    </button>
                </div>

                ${ACTIVITY_CATEGORIES.map(category => `
                    <div class="activity-category category--${category.id}">
                        <div class="activity-category__header" style="background-color: ${category.color}">
                            <i data-lucide="${category.icon}"></i>
                            <span>${category.name}</span>
                        </div>
                        <div class="activity-category__list">
                            ${byCategory[category.id].length === 0 ? `
                                <div class="activity-category__empty">No ${category.name.toLowerCase()} activities</div>
                            ` : byCategory[category.id].map(activity => `
                                <div class="activity-manage-item" data-activity-id="${activity.id}">
                                    <div class="activity-manage-item__icon" style="--activity-color: ${category.color}; background-color: ${category.color}">
                                        <i data-lucide="${activity.icon || 'star'}"></i>
                                    </div>
                                    <div class="activity-manage-item__info">
                                        <span class="activity-manage-item__name">
                                            ${activity.name}
                                            ${activity.required ? '<span class="activity-badge activity-badge--required">Required</span>' : ''}
                                        </span>
                                        <span class="activity-manage-item__meta">
                                            ${activity.points} pts
                                            ${activity.timeOfDay && activity.timeOfDay !== 'any' ? ` · ${activity.timeOfDay}` : ''}
                                            ${activity.maxPerDay > 1 ? ` · ${activity.maxPerDay}x/day` : ''}
                                        </span>
                                    </div>
                                    <div class="activity-manage-item__actions">
                                        <button class="btn btn--icon btn--ghost btn--sm" data-edit="${activity.id}">
                                            <i data-lucide="pencil"></i>
                                        </button>
                                        <button class="btn btn--icon btn--ghost btn--sm" data-delete="${activity.id}">
                                            <i data-lucide="trash-2"></i>
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}

                <div class="add-activity-form">
                    <div class="add-activity-form__title">
                        <i data-lucide="plus-circle"></i>
                        Add New Activity
                    </div>
                    <div class="add-activity-form__row">
                        <div class="add-activity-form__field">
                            <label class="add-activity-form__label">Activity Name</label>
                            <input type="text" class="form-input" id="newActivityName" placeholder="e.g., Make bed">
                        </div>
                        <div class="add-activity-form__field add-activity-form__field--points">
                            <label class="add-activity-form__label">Points</label>
                            <input type="number" class="form-input" id="newActivityPoints" placeholder="5" value="5">
                        </div>
                    </div>
                    <div class="add-activity-form__row">
                        <div class="add-activity-form__field">
                            <label class="add-activity-form__label">Icon</label>
                            <div class="activity-icon-picker" id="activityIconPicker">
                                ${ACTIVITY_ICONS.map((icon, i) => `
                                    <button type="button" class="activity-icon-picker__btn ${i === 0 ? 'activity-icon-picker__btn--selected' : ''}" data-icon="${icon}">
                                        <i data-lucide="${icon}"></i>
                                    </button>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                    <div class="add-activity-form__row">
                        <div class="add-activity-form__field">
                            <label class="add-activity-form__label">Category</label>
                            <div class="category-selector" id="categorySelector">
                                ${ACTIVITY_CATEGORIES.map((cat, i) => `
                                    <button type="button" class="category-selector__btn ${i === 0 ? 'category-selector__btn--selected' : ''}"
                                            data-category="${cat.id}" style="--category-color: ${cat.color}">
                                        <i data-lucide="${cat.icon}"></i>
                                        ${cat.name}
                                    </button>
                                `).join('')}
                            </div>
                        </div>
                    </div>

                    <!-- Activity Scheduling Options -->
                    <div class="add-activity-form__row add-activity-form__scheduling">
                        <div class="add-activity-form__field add-activity-form__field--small">
                            <label class="add-activity-form__label">Time of Day</label>
                            <select class="form-input" id="newActivityTimeOfDay">
                                <option value="any">Any time</option>
                                <option value="morning">Morning</option>
                                <option value="afternoon">Afternoon</option>
                                <option value="evening">Evening</option>
                            </select>
                        </div>
                        <div class="add-activity-form__field add-activity-form__field--small">
                            <label class="add-activity-form__label">Max / Day</label>
                            <select class="form-input" id="newActivityMaxPerDay">
                                <option value="1">1x</option>
                                <option value="2">2x</option>
                                <option value="3">3x</option>
                                <option value="5">5x</option>
                            </select>
                        </div>
                        <div class="add-activity-form__field add-activity-form__field--toggle">
                            <label class="add-activity-form__label">Required</label>
                            <label class="toggle-switch toggle-switch--sm">
                                <input type="checkbox" id="newActivityRequired">
                                <span class="toggle-switch__slider"></span>
                            </label>
                        </div>
                    </div>

                    <div class="add-activity-form__row">
                        <button class="btn btn--primary" id="addActivityBtn">
                            <i data-lucide="plus"></i>
                            Add Activity
                        </button>
                    </div>
                </div>
            </div>
        `;

        Modal.open({
            title: 'Manage Point Activities',
            content,
            size: 'lg',
            footer: '<button class="btn btn--primary" data-modal-done>Done</button>'
        });

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // State for new activity
        let selectedIcon = ACTIVITY_ICONS[0];
        let selectedCategory = ACTIVITY_CATEGORIES[0].id;

        // Icon picker
        document.querySelectorAll('#activityIconPicker .activity-icon-picker__btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#activityIconPicker .activity-icon-picker__btn').forEach(b =>
                    b.classList.remove('activity-icon-picker__btn--selected'));
                btn.classList.add('activity-icon-picker__btn--selected');
                selectedIcon = btn.dataset.icon;
            });
        });

        // Category selector
        document.querySelectorAll('#categorySelector .category-selector__btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#categorySelector .category-selector__btn').forEach(b =>
                    b.classList.remove('category-selector__btn--selected'));
                btn.classList.add('category-selector__btn--selected');
                selectedCategory = btn.dataset.category;
            });
        });

        // Daily goal enable/disable toggle
        document.getElementById('dailyGoalEnabled')?.addEventListener('change', (e) => {
            const data = getWidgetData(memberId);
            data.dailyGoalEnabled = e.target.checked;
            Storage.setWidgetData(memberId, 'points', data);

            // Update UI
            const valueRow = document.getElementById('dailyGoalValueRow');
            const presets = document.getElementById('goalPresets');
            if (valueRow) valueRow.style.opacity = e.target.checked ? '1' : '0.5';
            if (valueRow) valueRow.style.pointerEvents = e.target.checked ? 'auto' : 'none';
            if (presets) presets.style.opacity = e.target.checked ? '1' : '0.5';
            if (presets) presets.style.pointerEvents = e.target.checked ? 'auto' : 'none';

            // Refresh widget
            const widgetBody = document.getElementById('widget-points');
            if (widgetBody) {
                renderWidget(widgetBody, memberId);
            }
        });

        // Daily goal value input
        document.getElementById('dailyGoalValue')?.addEventListener('change', (e) => {
            const value = parseInt(e.target.value) || 20;
            const data = getWidgetData(memberId);
            data.dailyGoal = Math.max(5, Math.min(100, value));
            Storage.setWidgetData(memberId, 'points', data);

            // Update preset buttons
            document.querySelectorAll('.daily-goal-preset').forEach(btn => {
                btn.classList.toggle('daily-goal-preset--active', parseInt(btn.dataset.goal) === data.dailyGoal);
            });

            // Refresh widget
            const widgetBody = document.getElementById('widget-points');
            if (widgetBody) {
                renderWidget(widgetBody, memberId);
            }
        });

        // Daily goal preset buttons
        document.querySelectorAll('.daily-goal-preset').forEach(btn => {
            btn.addEventListener('click', () => {
                const goal = parseInt(btn.dataset.goal);
                const data = getWidgetData(memberId);
                data.dailyGoal = goal;
                Storage.setWidgetData(memberId, 'points', data);

                // Update input field
                document.getElementById('dailyGoalValue').value = goal;

                // Update preset buttons
                document.querySelectorAll('.daily-goal-preset').forEach(b => {
                    b.classList.toggle('daily-goal-preset--active', parseInt(b.dataset.goal) === goal);
                });

                // Refresh widget
                const widgetBody = document.getElementById('widget-points');
                if (widgetBody) {
                    renderWidget(widgetBody, memberId);
                }
            });
        });

        // Add activity
        document.getElementById('addActivityBtn')?.addEventListener('click', () => {
            const name = document.getElementById('newActivityName')?.value?.trim();
            const points = parseInt(document.getElementById('newActivityPoints')?.value) || 5;

            if (!name) {
                Toast.error('Please enter an activity name');
                return;
            }

            const timeOfDay = document.getElementById('newActivityTimeOfDay')?.value || 'any';
            const maxPerDay = parseInt(document.getElementById('newActivityMaxPerDay')?.value) || 1;
            const required = document.getElementById('newActivityRequired')?.checked || false;

            const newActivity = {
                id: `act-${Date.now()}`,
                name,
                points,
                icon: selectedIcon,
                category: selectedCategory,
                timeOfDay,
                maxPerDay,
                required
            };

            // Get current data from storage directly
            const allData = Storage.getAll();
            const currentPointsData = allData.widgetData?.[memberId]?.['points'] || { activities: [], balance: 0, todayCompleted: [], history: [] };

            // Add the new activity
            if (!currentPointsData.activities) {
                currentPointsData.activities = [];
            }
            currentPointsData.activities.push(newActivity);

            // Save directly to storage
            Storage.setWidgetData(memberId, 'points', currentPointsData);

            Toast.success('Activity added!');

            // Clear form inputs
            document.getElementById('newActivityName').value = '';
            document.getElementById('newActivityPoints').value = '5';

            // Refresh the widget in the background
            const widgetBody = document.getElementById('widget-points');
            if (widgetBody) {
                renderWidget(widgetBody, memberId);
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            }

            // Close and reopen modal
            Modal.close();
            setTimeout(() => {
                showManageActivitiesModal(memberId);
            }, 50);
        });

        // Edit activity
        document.querySelectorAll('[data-edit]').forEach(btn => {
            btn.addEventListener('click', () => {
                const activityId = btn.dataset.edit;
                showEditActivityModal(memberId, activityId);
            });
        });

        // Delete activity
        document.querySelectorAll('[data-delete]').forEach(btn => {
            btn.addEventListener('click', () => {
                const activityId = btn.dataset.delete;
                const data = getWidgetData(memberId);
                data.activities = data.activities.filter(a => a.id !== activityId);
                Storage.setWidgetData(memberId, 'points', data);
                Toast.success('Activity deleted');

                // Refresh the widget in the background
                const widgetBody = document.getElementById('widget-points');
                if (widgetBody) {
                    renderWidget(widgetBody, memberId);
                    if (typeof lucide !== 'undefined') {
                        lucide.createIcons();
                    }
                }

                Modal.close();
                setTimeout(() => {
                    showManageActivitiesModal(memberId);
                }, 50);
            });
        });

        // Reset all activities to defaults
        document.getElementById('resetAllActivitiesBtn')?.addEventListener('click', () => {
            if (confirm('This will delete ALL current activities and reset to defaults. Are you sure?')) {
                const data = getWidgetData(memberId);
                // Create fresh default activities
                const defaultActivities = [];
                Object.entries(DEFAULT_ACTIVITIES).forEach(([category, items]) => {
                    items.forEach(item => {
                        defaultActivities.push({
                            ...item,
                            id: `${item.id}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                            category
                        });
                    });
                });
                data.activities = defaultActivities;
                Storage.setWidgetData(memberId, 'points', data);
                Toast.success('All activities reset to defaults');

                // Refresh the widget in the background
                const widgetBody = document.getElementById('widget-points');
                if (widgetBody) {
                    renderWidget(widgetBody, memberId);
                    if (typeof lucide !== 'undefined') {
                        lucide.createIcons();
                    }
                }

                Modal.close();
                setTimeout(() => {
                    showManageActivitiesModal(memberId);
                }, 50);
            }
        });

        // Done button
        document.querySelector('[data-modal-done]')?.addEventListener('click', () => {
            Modal.close();
            const widgetBody = document.getElementById('widget-points');
            if (widgetBody) {
                renderWidget(widgetBody, memberId);
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            }
        });

        // Enter key to add
        document.getElementById('newActivityName')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                document.getElementById('addActivityBtn')?.click();
            }
        });
    }

    /**
     * Show edit activity modal
     */
    function showEditActivityModal(memberId, activityId) {
        const data = getWidgetData(memberId);
        const activity = data.activities.find(a => a.id === activityId);
        if (!activity) return;

        const content = `
            <div class="add-activity-form" style="border: none; background: transparent; padding: 0;">
                <div class="add-activity-form__row">
                    <div class="add-activity-form__field">
                        <label class="add-activity-form__label">Activity Name</label>
                        <input type="text" class="form-input" id="editActivityName" value="${activity.name}">
                    </div>
                    <div class="add-activity-form__field add-activity-form__field--points">
                        <label class="add-activity-form__label">Points</label>
                        <input type="number" class="form-input" id="editActivityPoints" value="${activity.points}">
                    </div>
                </div>
                <div class="add-activity-form__row">
                    <div class="add-activity-form__field">
                        <label class="add-activity-form__label">Icon</label>
                        <div class="activity-icon-picker" id="editIconPicker">
                            ${ACTIVITY_ICONS.map(icon => `
                                <button type="button" class="activity-icon-picker__btn ${icon === activity.icon ? 'activity-icon-picker__btn--selected' : ''}" data-icon="${icon}">
                                    <i data-lucide="${icon}"></i>
                                </button>
                            `).join('')}
                        </div>
                    </div>
                </div>
                <div class="add-activity-form__row">
                    <div class="add-activity-form__field">
                        <label class="add-activity-form__label">Category</label>
                        <div class="category-selector" id="editCategorySelector">
                            ${ACTIVITY_CATEGORIES.map(cat => `
                                <button type="button" class="category-selector__btn ${cat.id === activity.category ? 'category-selector__btn--selected' : ''}"
                                        data-category="${cat.id}" style="--category-color: ${cat.color}">
                                    <i data-lucide="${cat.icon}"></i>
                                    ${cat.name}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;

        Modal.open({
            title: 'Edit Activity',
            content,
            footer: `
                <button class="btn btn--secondary" data-modal-cancel>Cancel</button>
                <button class="btn btn--primary" id="saveActivityBtn">Save</button>
            `
        });

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        let selectedIcon = activity.icon;
        let selectedCategory = activity.category;

        // Icon picker
        document.querySelectorAll('#editIconPicker .activity-icon-picker__btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#editIconPicker .activity-icon-picker__btn').forEach(b =>
                    b.classList.remove('activity-icon-picker__btn--selected'));
                btn.classList.add('activity-icon-picker__btn--selected');
                selectedIcon = btn.dataset.icon;
            });
        });

        // Category selector
        document.querySelectorAll('#editCategorySelector .category-selector__btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#editCategorySelector .category-selector__btn').forEach(b =>
                    b.classList.remove('category-selector__btn--selected'));
                btn.classList.add('category-selector__btn--selected');
                selectedCategory = btn.dataset.category;
            });
        });

        // Cancel
        document.querySelector('[data-modal-cancel]')?.addEventListener('click', () => {
            Modal.close();
            showManageActivitiesModal(memberId);
        });

        // Save
        document.getElementById('saveActivityBtn')?.addEventListener('click', () => {
            const name = document.getElementById('editActivityName')?.value?.trim();
            const points = parseInt(document.getElementById('editActivityPoints')?.value) || 5;

            if (!name) {
                Toast.error('Please enter an activity name');
                return;
            }

            const activityIndex = data.activities.findIndex(a => a.id === activityId);
            if (activityIndex !== -1) {
                data.activities[activityIndex] = {
                    ...data.activities[activityIndex],
                    name,
                    points,
                    icon: selectedIcon,
                    category: selectedCategory
                };
                Storage.setWidgetData(memberId, 'points', data);
            }

            Toast.success('Activity updated!');
            Modal.close();
            showManageActivitiesModal(memberId);
        });
    }

    /**
     * Show reset today modal - allows admin to unmark activities completed today
     */
    function showResetTodayModal(memberId) {
        const widgetData = getWidgetData(memberId);
        const today = DateUtils.today();
        const todayCompleted = widgetData.todayCompleted?.filter(c => c.date === today) || [];
        const todayHistory = (widgetData.history || []).filter(h => h.date === today && h.type === 'earned');

        if (todayCompleted.length === 0) {
            Toast.info('No activities completed today');
            return;
        }

        // Get activity details for display
        const completedWithDetails = todayCompleted.map(tc => {
            const activity = widgetData.activities.find(a => a.id === tc.activityId);
            const historyEntry = todayHistory.find(h => h.activityId === tc.activityId);
            return {
                ...tc,
                name: activity?.name || historyEntry?.activityName || 'Unknown Activity',
                icon: activity?.icon || historyEntry?.activityIcon || 'star'
            };
        });

        const content = `
            <div class="reset-today-modal">
                <p class="reset-today-modal__intro">Select activities to unmark (points will be deducted):</p>
                <div class="reset-today-modal__list">
                    ${completedWithDetails.map(item => `
                        <label class="reset-today-modal__item">
                            <input type="checkbox" value="${item.activityId}" data-points="${item.points}">
                            <div class="reset-today-modal__item-info">
                                <i data-lucide="${item.icon}"></i>
                                <span class="reset-today-modal__item-name">${item.name}</span>
                            </div>
                            <span class="reset-today-modal__item-points">-${item.points} pts</span>
                        </label>
                    `).join('')}
                </div>
                <div class="reset-today-modal__actions">
                    <button class="btn btn--danger" id="resetAllBtn">
                        <i data-lucide="trash-2"></i>
                        Reset All Today
                    </button>
                </div>
            </div>
        `;

        Modal.open({
            title: 'Reset Today\'s Activities',
            content,
            footer: Modal.createFooter('Cancel', 'Unmark Selected')
        });

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Reset all button
        document.getElementById('resetAllBtn')?.addEventListener('click', () => {
            const totalPoints = todayCompleted.reduce((sum, tc) => sum + tc.points, 0);

            const updatedData = {
                ...widgetData,
                balance: Math.max(0, (widgetData.balance || 0) - totalPoints),
                todayCompleted: widgetData.todayCompleted?.filter(c => c.date !== today) || [],
                history: (widgetData.history || []).filter(h => !(h.date === today && h.type === 'earned'))
            };

            Storage.setWidgetData(memberId, 'points', updatedData);
            Toast.success(`Reset all activities for today (-${totalPoints} points)`);
            Modal.close();

            // Refresh widget
            const widgetBody = document.getElementById('widget-points');
            if (widgetBody) {
                renderWidget(widgetBody, memberId);
            }
        });

        Modal.bindFooterEvents(() => {
            const selectedItems = document.querySelectorAll('.reset-today-modal__item input:checked');
            if (selectedItems.length === 0) {
                Toast.warning('Select at least one activity to unmark');
                return false;
            }

            let totalDeducted = 0;
            const idsToRemove = [];

            selectedItems.forEach(cb => {
                idsToRemove.push(cb.value);
                totalDeducted += parseInt(cb.dataset.points) || 0;
            });

            const updatedData = {
                ...widgetData,
                balance: Math.max(0, (widgetData.balance || 0) - totalDeducted),
                todayCompleted: (widgetData.todayCompleted || []).filter(c =>
                    !(c.date === today && idsToRemove.includes(c.activityId))
                ),
                history: (widgetData.history || []).filter(h =>
                    !(h.date === today && h.type === 'earned' && idsToRemove.includes(h.activityId))
                )
            };

            Storage.setWidgetData(memberId, 'points', updatedData);
            Toast.success(`Unmarked ${selectedItems.length} activities (-${totalDeducted} points)`);

            // Refresh widget
            const widgetBody = document.getElementById('widget-points');
            if (widgetBody) {
                renderWidget(widgetBody, memberId);
            }

            return true;
        });
    }

    /**
     * Get weekly summary for dashboard
     */
    function getWeeklySummary(memberId) {
        const widgetData = getWidgetData(memberId);
        const history = widgetData.history || [];
        const today = new Date();
        const weekStart = DateUtils.getWeekStart(today);
        const summary = [];

        for (let i = 0; i < 7; i++) {
            const date = DateUtils.addDays(weekStart, i);
            const dateKey = DateUtils.formatISO(date);
            const dayEntries = history.filter(h => h.date === dateKey && h.type !== 'spent');
            const pointsEarned = dayEntries.reduce((sum, h) => sum + h.points, 0);

            summary.push({
                date: dateKey,
                dayName: DateUtils.getDayName(date, true),
                completed: dayEntries.length,
                pointsEarned,
                isToday: DateUtils.isToday(date)
            });
        }

        return summary;
    }

    function init() {
        // Initialize points feature
    }

    return {
        init,
        renderWidget,
        getWeeklySummary,
        completeActivity,
        showHistoryPage,
        ACTIVITY_CATEGORIES,
        ACTIVITY_ICONS
    };
})();
