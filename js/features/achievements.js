/**
 * Achievements Feature
 * Handles badges and milestones for kids
 */

const Achievements = (function() {
    // Default badge definitions
    const DEFAULT_BADGES = [
        { id: 'first-points', name: 'First Steps', description: 'Earn your first points', icon: 'star', threshold: 1, type: 'points' },
        { id: 'points-50', name: 'Rising Star', description: 'Earn 50 points total', icon: 'trending-up', threshold: 50, type: 'points' },
        { id: 'points-100', name: 'Super Star', description: 'Earn 100 points total', icon: 'award', threshold: 100, type: 'points' },
        { id: 'points-250', name: 'Champion', description: 'Earn 250 points total', icon: 'trophy', threshold: 250, type: 'points' },
        { id: 'streak-3', name: 'On a Roll', description: '3 day streak', icon: 'flame', threshold: 3, type: 'streak' },
        { id: 'streak-7', name: 'Week Warrior', description: '7 day streak', icon: 'zap', threshold: 7, type: 'streak' },
        { id: 'tasks-10', name: 'Task Master', description: 'Complete 10 activities', icon: 'check-circle', threshold: 10, type: 'activities' },
        { id: 'reward-1', name: 'Reward Hunter', description: 'Redeem your first reward', icon: 'gift', threshold: 1, type: 'rewards' }
    ];

    /**
     * Render the achievements widget for a member
     */
    function renderWidget(container, memberId) {
        const widgetData = Storage.getWidgetData(memberId, 'achievements') || {
            earned: [],
            totalPointsEarned: 0,
            currentStreak: 0,
            activitiesCompleted: 0,
            rewardsRedeemed: 0
        };

        // Calculate which badges are earned
        const earnedBadges = calculateEarnedBadges(widgetData);
        const unearnedBadges = DEFAULT_BADGES.filter(b => !earnedBadges.find(e => e.id === b.id));

        container.innerHTML = `
            <div class="achievements-widget">
                <div class="achievements-widget__summary">
                    <div class="achievements-stat">
                        <span class="achievements-stat__value">${earnedBadges.length}</span>
                        <span class="achievements-stat__label">Badges</span>
                    </div>
                    <div class="achievements-stat">
                        <span class="achievements-stat__value">${widgetData.currentStreak || 0}</span>
                        <span class="achievements-stat__label">Day Streak</span>
                    </div>
                </div>

                ${earnedBadges.length > 0 ? `
                    <div class="achievements-section">
                        <h4 class="achievements-section__title">Earned Badges</h4>
                        <div class="achievements-grid">
                            ${earnedBadges.map(badge => `
                                <div class="achievement-badge achievement-badge--earned" title="${badge.description}">
                                    <div class="achievement-badge__icon">
                                        <i data-lucide="${badge.icon}"></i>
                                    </div>
                                    <span class="achievement-badge__name">${badge.name}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                ${unearnedBadges.length > 0 ? `
                    <div class="achievements-section">
                        <h4 class="achievements-section__title">Coming Up</h4>
                        <div class="achievements-grid">
                            ${unearnedBadges.slice(0, 4).map(badge => {
                                const progress = getProgress(badge, widgetData);
                                return `
                                    <div class="achievement-badge achievement-badge--locked" title="${badge.description}">
                                        <div class="achievement-badge__icon">
                                            <i data-lucide="${badge.icon}"></i>
                                        </div>
                                        <span class="achievement-badge__name">${badge.name}</span>
                                        <span class="achievement-badge__progress">${progress}%</span>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                ` : ''}

                <div class="achievements-widget__footer">
                    <button class="btn btn--sm btn--ghost" data-action="view-all" data-member-id="${memberId}">
                        <i data-lucide="grid"></i>
                        View All
                    </button>
                </div>
            </div>
        `;

        // Bind events
        container.querySelector('[data-action="view-all"]')?.addEventListener('click', () => {
            showAllBadgesModal(memberId, widgetData);
        });
    }

    /**
     * Calculate which badges have been earned
     */
    function calculateEarnedBadges(widgetData) {
        return DEFAULT_BADGES.filter(badge => {
            switch (badge.type) {
                case 'points':
                    return (widgetData.totalPointsEarned || 0) >= badge.threshold;
                case 'streak':
                    return (widgetData.currentStreak || 0) >= badge.threshold;
                case 'activities':
                    return (widgetData.activitiesCompleted || 0) >= badge.threshold;
                case 'rewards':
                    return (widgetData.rewardsRedeemed || 0) >= badge.threshold;
                default:
                    return widgetData.earned?.includes(badge.id);
            }
        });
    }

    /**
     * Get progress percentage for a badge
     */
    function getProgress(badge, widgetData) {
        let current = 0;
        switch (badge.type) {
            case 'points':
                current = widgetData.totalPointsEarned || 0;
                break;
            case 'streak':
                current = widgetData.currentStreak || 0;
                break;
            case 'activities':
                current = widgetData.activitiesCompleted || 0;
                break;
            case 'rewards':
                current = widgetData.rewardsRedeemed || 0;
                break;
        }
        return Math.min(100, Math.round((current / badge.threshold) * 100));
    }

    /**
     * Show all badges modal - redesigned with visual stats and categories
     */
    function showAllBadgesModal(memberId, widgetData) {
        const earnedBadges = calculateEarnedBadges(widgetData);
        const totalBadges = DEFAULT_BADGES.length;
        const earnedCount = earnedBadges.length;

        // Group badges by type
        const badgesByType = {
            points: { name: 'Points Milestones', icon: 'star', color: '#F59E0B', badges: [] },
            streak: { name: 'Streak Achievements', icon: 'flame', color: '#EF4444', badges: [] },
            activities: { name: 'Activity Goals', icon: 'check-circle', color: '#10B981', badges: [] },
            rewards: { name: 'Reward Milestones', icon: 'gift', color: '#8B5CF6', badges: [] }
        };

        DEFAULT_BADGES.forEach(badge => {
            if (badgesByType[badge.type]) {
                badgesByType[badge.type].badges.push(badge);
            }
        });

        const content = `
            <div class="achievements-page">
                <div class="achievements-page__stats">
                    <div class="achievements-page-stat">
                        <div class="achievements-page-stat__icon" style="background: linear-gradient(135deg, #FCD34D, #F59E0B);">
                            <i data-lucide="trophy"></i>
                        </div>
                        <div class="achievements-page-stat__info">
                            <span class="achievements-page-stat__value">${earnedCount}/${totalBadges}</span>
                            <span class="achievements-page-stat__label">Badges Earned</span>
                        </div>
                    </div>
                    <div class="achievements-page-stat">
                        <div class="achievements-page-stat__icon" style="background: linear-gradient(135deg, #FCA5A5, #EF4444);">
                            <i data-lucide="flame"></i>
                        </div>
                        <div class="achievements-page-stat__info">
                            <span class="achievements-page-stat__value">${widgetData.currentStreak || 0}</span>
                            <span class="achievements-page-stat__label">Day Streak</span>
                        </div>
                    </div>
                    <div class="achievements-page-stat">
                        <div class="achievements-page-stat__icon" style="background: linear-gradient(135deg, #93C5FD, #3B82F6);">
                            <i data-lucide="star"></i>
                        </div>
                        <div class="achievements-page-stat__info">
                            <span class="achievements-page-stat__value">${widgetData.totalPointsEarned || 0}</span>
                            <span class="achievements-page-stat__label">Total Points</span>
                        </div>
                    </div>
                </div>

                <div class="achievements-page__categories">
                    ${Object.entries(badgesByType).map(([type, category]) => `
                        <div class="achievements-category">
                            <div class="achievements-category__header" style="--category-color: ${category.color}">
                                <i data-lucide="${category.icon}"></i>
                                <span>${category.name}</span>
                                <span class="achievements-category__count">${category.badges.filter(b => earnedBadges.find(e => e.id === b.id)).length}/${category.badges.length}</span>
                            </div>
                            <div class="achievements-category__badges">
                                ${category.badges.map(badge => {
                                    const isEarned = earnedBadges.find(e => e.id === badge.id);
                                    const progress = getProgress(badge, widgetData);
                                    return `
                                        <div class="achievements-badge-card ${isEarned ? 'achievements-badge-card--earned' : ''}" style="--badge-color: ${category.color}">
                                            <div class="achievements-badge-card__icon ${isEarned ? 'achievements-badge-card__icon--earned' : ''}">
                                                <i data-lucide="${badge.icon}"></i>
                                                ${isEarned ? '<div class="achievements-badge-card__check"><i data-lucide="check"></i></div>' : ''}
                                            </div>
                                            <div class="achievements-badge-card__info">
                                                <span class="achievements-badge-card__name">${badge.name}</span>
                                                <span class="achievements-badge-card__desc">${badge.description}</span>
                                            </div>
                                            ${!isEarned ? `
                                                <div class="achievements-badge-card__progress">
                                                    <div class="achievements-badge-card__progress-bar">
                                                        <div class="achievements-badge-card__progress-fill" style="width: ${progress}%; background-color: ${category.color}"></div>
                                                    </div>
                                                    <span class="achievements-badge-card__progress-text">${progress}%</span>
                                                </div>
                                            ` : `
                                                <div class="achievements-badge-card__earned-badge">
                                                    <i data-lucide="check-circle"></i>
                                                    Earned!
                                                </div>
                                            `}
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        Modal.open({
            title: 'All Badges & Achievements',
            content,
            size: 'lg',
            footer: `
                <button class="btn btn--danger btn--sm" id="resetAchievementsBtn">
                    <i data-lucide="trash-2"></i>
                    Reset Progress
                </button>
                <button class="btn btn--primary" data-modal-cancel>Close</button>
            `
        });

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Reset achievements progress
        document.getElementById('resetAchievementsBtn')?.addEventListener('click', async () => {
            const verified = await PIN.verify();
            if (verified) {
                if (confirm('This will reset ALL achievement progress (points earned, streak, activities completed, etc.). Are you sure?')) {
                    const resetData = {
                        earned: [],
                        totalPointsEarned: 0,
                        currentStreak: 0,
                        activitiesCompleted: 0,
                        rewardsRedeemed: 0,
                        notifiedBadges: []
                    };
                    Storage.setWidgetData(memberId, 'achievements', resetData);
                    Toast.success('Achievement progress reset!');
                    Modal.close();

                    // Refresh widget
                    const widgetBody = document.getElementById('widget-achievements');
                    if (widgetBody) {
                        renderWidget(widgetBody, memberId);
                        if (typeof lucide !== 'undefined') {
                            lucide.createIcons();
                        }
                    }
                }
            }
        });

        document.querySelector('[data-modal-cancel]')?.addEventListener('click', () => {
            Modal.close();
        });
    }

    /**
     * Update achievement stats (called from other widgets)
     */
    function updateStats(memberId, type, value) {
        const widgetData = Storage.getWidgetData(memberId, 'achievements') || {};

        switch (type) {
            case 'points':
                widgetData.totalPointsEarned = (widgetData.totalPointsEarned || 0) + value;
                break;
            case 'activity':
                widgetData.activitiesCompleted = (widgetData.activitiesCompleted || 0) + 1;
                break;
            case 'reward':
                widgetData.rewardsRedeemed = (widgetData.rewardsRedeemed || 0) + 1;
                break;
            case 'streak':
                widgetData.currentStreak = value;
                break;
        }

        Storage.setWidgetData(memberId, 'achievements', widgetData);

        // Check for new badges
        checkNewBadges(memberId, widgetData);
    }

    /**
     * Check and notify for new badges
     */
    function checkNewBadges(memberId, widgetData) {
        const earned = widgetData.notifiedBadges || [];
        const earnedBadges = calculateEarnedBadges(widgetData);

        earnedBadges.forEach(badge => {
            if (!earned.includes(badge.id)) {
                Toast.success(`🏆 New Badge: ${badge.name}!`);
                earned.push(badge.id);
            }
        });

        widgetData.notifiedBadges = earned;
        Storage.setWidgetData(memberId, 'achievements', widgetData);
    }

    function init() {
        // Initialize achievements feature
    }

    return {
        init,
        renderWidget,
        updateStats
    };
})();
