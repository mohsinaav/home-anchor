/**
 * Achievements Feature
 * Handles badges and milestones for kids
 * Full page with tabs: Badges, Progress, Stats
 */

const Achievements = (function() {
    // Track current tab in full page view
    let currentTab = 'badges';

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
            showFullPage(memberId);
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

    // =========================================================================
    // FULL PAGE VIEW
    // =========================================================================

    /**
     * Show full page view
     */
    function showFullPage(memberId) {
        const main = document.getElementById('mainContent');
        if (!main) return;

        const member = Storage.getMember(memberId);
        currentTab = 'badges';
        renderFullPage(main, memberId, member, currentTab);
    }

    /**
     * Render full page with tabs
     */
    function renderFullPage(container, memberId, member, tab = 'badges') {
        const widgetData = Storage.getWidgetData(memberId, 'achievements') || {
            earned: [],
            totalPointsEarned: 0,
            currentStreak: 0,
            activitiesCompleted: 0,
            rewardsRedeemed: 0
        };

        const earnedBadges = calculateEarnedBadges(widgetData);
        const totalBadges = DEFAULT_BADGES.length;

        // Get age-adaptive content
        const useKidTheme = typeof KidTheme !== 'undefined';
        const ageGroup = useKidTheme ? KidTheme.getAgeGroup(member) : 'kid';
        const isYoungKid = ageGroup === 'kid' || ageGroup === 'toddler';
        const colors = useKidTheme ? KidTheme.getColors('achievements') : { gradient: 'linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 50%, #C4B5FD 100%)' };

        // Get tab content
        const tabContent = renderTabContent(tab, memberId, member, widgetData, earnedBadges);

        // Define tabs
        const tabs = [
            { id: 'badges', label: 'Badges', icon: 'trophy', emoji: '🏆' },
            { id: 'progress', label: 'Progress', icon: 'trending-up', emoji: '📈' },
            { id: 'stats', label: 'Stats', icon: 'bar-chart-2', emoji: '📊' }
        ];

        container.innerHTML = `
            <div class="kid-page kid-page--achievements ${useKidTheme ? KidTheme.getAgeClass(member) : ''}">
                <!-- Hero Section -->
                <div class="kid-page__hero" style="background: ${colors.gradient}; --kid-hero-text: ${colors.dark}">
                    <button class="btn btn--ghost kid-page__back" id="backToMemberBtn">
                        <i data-lucide="arrow-left"></i>
                        Back
                    </button>
                    <div class="kid-page__hero-content">
                        <h1 class="kid-page__hero-title ${isYoungKid ? 'kid-page__hero-title--playful' : ''}">
                            ${isYoungKid ? '🏆 My Badges!' : 'Achievements'}
                        </h1>
                    </div>
                    <div class="kid-page__hero-stats">
                        <div class="kid-hero-stat">
                            <span class="kid-hero-stat__value">${earnedBadges.length}/${totalBadges}</span>
                            <span class="kid-hero-stat__label">${isYoungKid ? '🏅 Badges' : 'Badges Earned'}</span>
                        </div>
                        <div class="kid-hero-stat">
                            <span class="kid-hero-stat__value">${widgetData.currentStreak || 0}</span>
                            <span class="kid-hero-stat__label">${isYoungKid ? '🔥 Day Streak' : 'Day Streak'}</span>
                        </div>
                        <div class="kid-hero-stat">
                            <span class="kid-hero-stat__value">${widgetData.totalPointsEarned || 0}</span>
                            <span class="kid-hero-stat__label">${isYoungKid ? '⭐ Total Pts' : 'Total Points'}</span>
                        </div>
                    </div>
                </div>

                <!-- Tab Navigation -->
                <div class="kid-page__tabs">
                    ${tabs.map(t => `
                        <button class="kid-page__tab ${t.id === tab ? 'kid-page__tab--active' : ''}" data-tab="${t.id}">
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

        bindFullPageEvents(container, memberId, member, widgetData, tab);
    }

    /**
     * Render tab content based on active tab
     */
    function renderTabContent(tab, memberId, member, widgetData, earnedBadges) {
        switch (tab) {
            case 'badges':
                return renderBadgesTab(memberId, member, widgetData, earnedBadges);
            case 'progress':
                return renderProgressTab(memberId, member, widgetData, earnedBadges);
            case 'stats':
                return renderStatsTab(memberId, member, widgetData);
            default:
                return renderBadgesTab(memberId, member, widgetData, earnedBadges);
        }
    }

    /**
     * Render Badges tab content - all badges grouped by category
     */
    function renderBadgesTab(memberId, member, widgetData, earnedBadges) {
        const useKidTheme = typeof KidTheme !== 'undefined';
        const ageGroup = useKidTheme ? KidTheme.getAgeGroup(member) : 'kid';
        const isYoungKid = ageGroup === 'kid' || ageGroup === 'toddler';

        // Group badges by type
        const badgesByType = {
            points: { name: isYoungKid ? '⭐ Points' : 'Points Milestones', icon: 'star', color: '#F59E0B', badges: [] },
            streak: { name: isYoungKid ? '🔥 Streaks' : 'Streak Achievements', icon: 'flame', color: '#EF4444', badges: [] },
            activities: { name: isYoungKid ? '✅ Activities' : 'Activity Goals', icon: 'check-circle', color: '#10B981', badges: [] },
            rewards: { name: isYoungKid ? '🎁 Rewards' : 'Reward Milestones', icon: 'gift', color: '#8B5CF6', badges: [] }
        };

        DEFAULT_BADGES.forEach(badge => {
            if (badgesByType[badge.type]) {
                badgesByType[badge.type].badges.push(badge);
            }
        });

        return `
            <div class="achievements-full-categories">
                ${Object.entries(badgesByType).map(([type, category]) => `
                    <div class="achievements-full-category">
                        <div class="achievements-full-category__header" style="--category-color: ${category.color}">
                            ${isYoungKid ? '' : `<i data-lucide="${category.icon}"></i>`}
                            <span>${category.name}</span>
                            <span class="achievements-full-category__count">${category.badges.filter(b => earnedBadges.find(e => e.id === b.id)).length}/${category.badges.length}</span>
                        </div>
                        <div class="achievements-full-category__badges">
                            ${category.badges.map(badge => {
                                const isEarned = earnedBadges.find(e => e.id === badge.id);
                                const progress = getProgress(badge, widgetData);
                                return `
                                    <div class="achievements-full-badge ${isEarned ? 'achievements-full-badge--earned' : ''}" style="--badge-color: ${category.color}">
                                        <div class="achievements-full-badge__icon">
                                            <i data-lucide="${badge.icon}"></i>
                                            ${isEarned ? '<div class="achievements-full-badge__check">✓</div>' : ''}
                                        </div>
                                        <div class="achievements-full-badge__info">
                                            <span class="achievements-full-badge__name">${badge.name}</span>
                                            <span class="achievements-full-badge__desc">${badge.description}</span>
                                        </div>
                                        ${!isEarned ? `
                                            <div class="achievements-full-badge__progress">
                                                <div class="achievements-full-badge__progress-bar">
                                                    <div class="achievements-full-badge__progress-fill" style="width: ${progress}%; background-color: ${category.color}"></div>
                                                </div>
                                                <span>${progress}%</span>
                                            </div>
                                        ` : `
                                            <div class="achievements-full-badge__earned">
                                                ${isYoungKid ? '🎉 Got it!' : 'Earned!'}
                                            </div>
                                        `}
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * Render Progress tab content - shows next badges to earn
     */
    function renderProgressTab(memberId, member, widgetData, earnedBadges) {
        const useKidTheme = typeof KidTheme !== 'undefined';
        const ageGroup = useKidTheme ? KidTheme.getAgeGroup(member) : 'kid';
        const isYoungKid = ageGroup === 'kid' || ageGroup === 'toddler';

        const unearnedBadges = DEFAULT_BADGES.filter(b => !earnedBadges.find(e => e.id === b.id));

        // Sort by closest to earning (highest progress)
        const sortedBadges = unearnedBadges.map(badge => ({
            ...badge,
            progress: getProgress(badge, widgetData)
        })).sort((a, b) => b.progress - a.progress);

        const badgeColors = {
            points: '#F59E0B',
            streak: '#EF4444',
            activities: '#10B981',
            rewards: '#8B5CF6'
        };

        if (sortedBadges.length === 0) {
            return `
                <div class="kid-page__empty ${isYoungKid ? 'kid-page__empty--playful' : ''}">
                    <div class="kid-page__empty-icon">🏆</div>
                    <p>${isYoungKid ? 'You earned ALL the badges! Amazing! 🎉' : 'Congratulations! You\'ve earned all badges!'}</p>
                </div>
            `;
        }

        return `
            <div class="achievements-progress-list">
                <h3 class="achievements-progress-title">${isYoungKid ? '🎯 Almost There!' : 'Next Badges to Earn'}</h3>
                ${sortedBadges.map(badge => `
                    <div class="achievements-progress-card" style="--badge-color: ${badgeColors[badge.type] || '#8B5CF6'}">
                        <div class="achievements-progress-card__icon" style="background-color: ${badgeColors[badge.type] || '#8B5CF6'}">
                            <i data-lucide="${badge.icon}"></i>
                        </div>
                        <div class="achievements-progress-card__content">
                            <div class="achievements-progress-card__header">
                                <span class="achievements-progress-card__name">${badge.name}</span>
                                <span class="achievements-progress-card__percent">${badge.progress}%</span>
                            </div>
                            <span class="achievements-progress-card__desc">${badge.description}</span>
                            <div class="achievements-progress-card__bar">
                                <div class="achievements-progress-card__fill" style="width: ${badge.progress}%; background-color: ${badgeColors[badge.type] || '#8B5CF6'}"></div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * Render Stats tab content
     */
    function renderStatsTab(memberId, member, widgetData) {
        const useKidTheme = typeof KidTheme !== 'undefined';
        const ageGroup = useKidTheme ? KidTheme.getAgeGroup(member) : 'kid';
        const isYoungKid = ageGroup === 'kid' || ageGroup === 'toddler';

        const earnedBadges = calculateEarnedBadges(widgetData);
        const completionRate = Math.round((earnedBadges.length / DEFAULT_BADGES.length) * 100);

        return `
            <div class="achievements-stats-page">
                <!-- Completion Overview -->
                <div class="achievements-stats-overview">
                    <div class="achievements-stats-ring">
                        <svg viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="40" fill="none" stroke="#E5E7EB" stroke-width="10"/>
                            <circle cx="50" cy="50" r="40" fill="none" stroke="#8B5CF6" stroke-width="10"
                                stroke-dasharray="${completionRate * 2.51} 251" stroke-linecap="round"
                                transform="rotate(-90 50 50)"/>
                        </svg>
                        <div class="achievements-stats-ring__value">${completionRate}%</div>
                    </div>
                    <div class="achievements-stats-overview__info">
                        <h3>${isYoungKid ? 'Your Badge Progress!' : 'Overall Progress'}</h3>
                        <p>${earnedBadges.length} of ${DEFAULT_BADGES.length} badges earned</p>
                    </div>
                </div>

                <!-- Stats Grid -->
                <div class="achievements-stats-grid">
                    <div class="achievements-stats-card">
                        ${isYoungKid ? '<span class="emoji-stat">⭐</span>' : '<i data-lucide="star"></i>'}
                        <span class="achievements-stats-card__value">${widgetData.totalPointsEarned || 0}</span>
                        <span class="achievements-stats-card__label">${isYoungKid ? 'Total Points!' : 'Total Points Earned'}</span>
                    </div>
                    <div class="achievements-stats-card">
                        ${isYoungKid ? '<span class="emoji-stat">🔥</span>' : '<i data-lucide="flame"></i>'}
                        <span class="achievements-stats-card__value">${widgetData.currentStreak || 0}</span>
                        <span class="achievements-stats-card__label">${isYoungKid ? 'Day Streak!' : 'Current Streak'}</span>
                    </div>
                    <div class="achievements-stats-card">
                        ${isYoungKid ? '<span class="emoji-stat">✅</span>' : '<i data-lucide="check-circle"></i>'}
                        <span class="achievements-stats-card__value">${widgetData.activitiesCompleted || 0}</span>
                        <span class="achievements-stats-card__label">${isYoungKid ? 'Activities!' : 'Activities Completed'}</span>
                    </div>
                    <div class="achievements-stats-card">
                        ${isYoungKid ? '<span class="emoji-stat">🎁</span>' : '<i data-lucide="gift"></i>'}
                        <span class="achievements-stats-card__value">${widgetData.rewardsRedeemed || 0}</span>
                        <span class="achievements-stats-card__label">${isYoungKid ? 'Rewards!' : 'Rewards Redeemed'}</span>
                    </div>
                </div>

                <!-- Badges by Category -->
                <div class="achievements-stats-categories">
                    <h3>${isYoungKid ? '📊 Badges by Type' : 'Badges by Category'}</h3>
                    <div class="achievements-stats-category-bars">
                        ${[
                            { type: 'points', name: isYoungKid ? '⭐ Points' : 'Points', color: '#F59E0B' },
                            { type: 'streak', name: isYoungKid ? '🔥 Streak' : 'Streak', color: '#EF4444' },
                            { type: 'activities', name: isYoungKid ? '✅ Activities' : 'Activities', color: '#10B981' },
                            { type: 'rewards', name: isYoungKid ? '🎁 Rewards' : 'Rewards', color: '#8B5CF6' }
                        ].map(cat => {
                            const categoryBadges = DEFAULT_BADGES.filter(b => b.type === cat.type);
                            const earned = categoryBadges.filter(b => earnedBadges.find(e => e.id === b.id)).length;
                            const percent = Math.round((earned / categoryBadges.length) * 100);
                            return `
                                <div class="achievements-stats-category-bar">
                                    <div class="achievements-stats-category-bar__label">
                                        <span>${cat.name}</span>
                                        <span>${earned}/${categoryBadges.length}</span>
                                    </div>
                                    <div class="achievements-stats-category-bar__track">
                                        <div class="achievements-stats-category-bar__fill" style="width: ${percent}%; background-color: ${cat.color}"></div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Bind full page events
     */
    function bindFullPageEvents(container, memberId, member, widgetData, tab) {
        // Back button
        document.getElementById('backToMemberBtn')?.addEventListener('click', () => {
            State.emit('tabChanged', memberId);
        });

        // Tab switching
        container.querySelectorAll('.kid-page__tab').forEach(tabBtn => {
            tabBtn.addEventListener('click', () => {
                const tabName = tabBtn.dataset.tab;
                if (tabName !== currentTab) {
                    currentTab = tabName;
                    renderFullPage(container, memberId, member, tabName);
                }
            });
        });
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
        updateStats,
        showFullPage
    };
})();
