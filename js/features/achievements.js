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
        // Points milestones
        { id: 'first-points', name: 'First Steps', description: 'Earn your first points', icon: 'star', threshold: 1, type: 'points' },
        { id: 'points-50', name: 'Rising Star', description: 'Earn 50 points total', icon: 'trending-up', threshold: 50, type: 'points' },
        { id: 'points-100', name: 'Super Star', description: 'Earn 100 points total', icon: 'award', threshold: 100, type: 'points' },
        { id: 'points-250', name: 'Champion', description: 'Earn 250 points total', icon: 'trophy', threshold: 250, type: 'points' },
        { id: 'points-500', name: 'Legend', description: 'Earn 500 points total', icon: 'crown', threshold: 500, type: 'points' },
        { id: 'points-1000', name: 'Points Master', description: 'Earn 1,000 points total', icon: 'gem', threshold: 1000, type: 'points' },
        // Streak achievements
        { id: 'streak-3', name: 'On a Roll', description: '3 day streak', icon: 'flame', threshold: 3, type: 'streak' },
        { id: 'streak-7', name: 'Week Warrior', description: '7 day streak', icon: 'zap', threshold: 7, type: 'streak' },
        { id: 'streak-14', name: 'Two Week Champ', description: '14 day streak', icon: 'shield', threshold: 14, type: 'streak' },
        { id: 'streak-30', name: 'Monthly Hero', description: '30 day streak', icon: 'medal', threshold: 30, type: 'streak' },
        // Activity goals
        { id: 'tasks-10', name: 'Task Master', description: 'Complete 10 activities', icon: 'check-circle', threshold: 10, type: 'activities' },
        { id: 'tasks-25', name: 'Busy Bee', description: 'Complete 25 activities', icon: 'list-checks', threshold: 25, type: 'activities' },
        { id: 'tasks-50', name: 'Activity Pro', description: 'Complete 50 activities', icon: 'clipboard-check', threshold: 50, type: 'activities' },
        { id: 'tasks-100', name: 'Unstoppable', description: 'Complete 100 activities', icon: 'rocket', threshold: 100, type: 'activities' },
        // Reward milestones
        { id: 'reward-1', name: 'Reward Hunter', description: 'Redeem your first reward', icon: 'gift', threshold: 1, type: 'rewards' },
        { id: 'reward-5', name: 'Reward Collector', description: 'Redeem 5 rewards', icon: 'shopping-bag', threshold: 5, type: 'rewards' },
        { id: 'reward-10', name: 'Shopping Spree', description: 'Redeem 10 rewards', icon: 'sparkles', threshold: 10, type: 'rewards' }
    ];

    // Icons available for custom badges
    const BADGE_ICONS = [
        'star', 'heart', 'trophy', 'award', 'crown', 'gem', 'medal',
        'flame', 'zap', 'shield', 'rocket', 'target', 'sparkles',
        'sun', 'moon', 'music', 'palette', 'book-open', 'pencil',
        'brain', 'lightbulb', 'puzzle', 'bike', 'dumbbell', 'timer',
        'smile', 'thumbs-up', 'gift', 'cake', 'flower-2', 'leaf'
    ];

    // =========================================================================
    // BADGE TEMPLATES - Pre-made goal templates for common activities
    // =========================================================================
    const BADGE_TEMPLATES = [
        // Reading & Learning
        { name: 'Bookworm', description: 'Read 10 books', icon: 'book-open', goal: 10, category: 'learning', rewardPoints: 50 },
        { name: 'Reading Streak', description: 'Read every day for a week', icon: 'book-open', goal: 7, category: 'learning', rewardPoints: 30, isStreak: true },
        { name: 'Homework Hero', description: 'Complete homework on time 20 times', icon: 'pencil', goal: 20, category: 'learning', rewardPoints: 40 },
        { name: 'Math Whiz', description: 'Practice math 15 times', icon: 'brain', goal: 15, category: 'learning', rewardPoints: 35 },

        // Chores & Responsibilities
        { name: 'Tidy Star', description: 'Clean room 10 times', icon: 'sparkles', goal: 10, category: 'chores', rewardPoints: 25 },
        { name: 'Helper Bee', description: 'Help with chores 15 times', icon: 'heart', goal: 15, category: 'chores', rewardPoints: 35 },
        { name: 'Pet Pal', description: 'Take care of pet 20 times', icon: 'heart', goal: 20, category: 'chores', rewardPoints: 40 },
        { name: 'Dish Duty', description: 'Help with dishes 10 times', icon: 'sparkles', goal: 10, category: 'chores', rewardPoints: 25 },

        // Health & Fitness
        { name: 'Active Kid', description: 'Exercise 20 times', icon: 'dumbbell', goal: 20, category: 'fitness', rewardPoints: 40 },
        { name: 'Early Bird', description: 'Wake up on time 14 days', icon: 'sun', goal: 14, category: 'fitness', rewardPoints: 30, isStreak: true },
        { name: 'Veggie Champion', description: 'Eat vegetables 15 times', icon: 'leaf', goal: 15, category: 'fitness', rewardPoints: 35 },
        { name: 'Water Warrior', description: 'Drink enough water 10 days', icon: 'target', goal: 10, category: 'fitness', rewardPoints: 25 },

        // Behavior & Kindness
        { name: 'Kind Heart', description: 'Do 10 kind acts', icon: 'heart', goal: 10, category: 'behavior', rewardPoints: 30 },
        { name: 'Good Listener', description: 'Listen well 15 times', icon: 'smile', goal: 15, category: 'behavior', rewardPoints: 35 },
        { name: 'Sharing Star', description: 'Share with others 10 times', icon: 'gift', goal: 10, category: 'behavior', rewardPoints: 25 },
        { name: 'Patience Pro', description: 'Show patience 12 times', icon: 'timer', goal: 12, category: 'behavior', rewardPoints: 30 },

        // Creative & Skills
        { name: 'Art Star', description: 'Create 10 art projects', icon: 'palette', goal: 10, category: 'creative', rewardPoints: 30 },
        { name: 'Music Maker', description: 'Practice music 15 times', icon: 'music', goal: 15, category: 'creative', rewardPoints: 35 },
        { name: 'Puzzle Master', description: 'Complete 10 puzzles', icon: 'puzzle', goal: 10, category: 'creative', rewardPoints: 30 },
        { name: 'Super Builder', description: 'Build 8 creations', icon: 'rocket', goal: 8, category: 'creative', rewardPoints: 25 }
    ];

    const TEMPLATE_CATEGORIES = {
        learning: { name: 'Reading & Learning', emoji: '📚', color: '#3B82F6' },
        chores: { name: 'Chores & Responsibilities', emoji: '🧹', color: '#10B981' },
        fitness: { name: 'Health & Fitness', emoji: '💪', color: '#EF4444' },
        behavior: { name: 'Behavior & Kindness', emoji: '💖', color: '#EC4899' },
        creative: { name: 'Creative & Skills', emoji: '🎨', color: '#8B5CF6' }
    };

    /**
     * Get all badges (default + custom) for a member
     */
    function getAllBadges(widgetData) {
        const custom = (widgetData.customBadges || []).map(b => ({ ...b, isCustom: true }));
        return [...DEFAULT_BADGES, ...custom];
    }

    /**
     * Render the achievements widget for a member
     */
    function renderWidget(container, memberId) {
        const widgetData = Storage.getWidgetData(memberId, 'achievements') || {
            earned: [],
            totalPointsEarned: 0,
            currentStreak: 0,
            activitiesCompleted: 0,
            rewardsRedeemed: 0,
            customBadges: []
        };

        const allBadges = getAllBadges(widgetData);

        // Calculate which badges are earned
        const earnedBadges = calculateEarnedBadges(widgetData);
        const unearnedBadges = allBadges.filter(b => !earnedBadges.find(e => e.id === b.id));

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
        const allBadges = getAllBadges(widgetData);
        const revokedBadges = widgetData.revokedBadges || [];

        return allBadges.filter(badge => {
            // Skip if badge has been revoked
            if (revokedBadges.includes(badge.id)) return false;

            switch (badge.type) {
                case 'points':
                    return (widgetData.totalPointsEarned || 0) >= badge.threshold;
                case 'streak':
                    return (widgetData.currentStreak || 0) >= badge.threshold;
                case 'activities':
                    return (widgetData.activitiesCompleted || 0) >= badge.threshold;
                case 'rewards':
                    return (widgetData.rewardsRedeemed || 0) >= badge.threshold;
                case 'custom':
                    // Custom badges: check if manually awarded or progress reached goal
                    if (badge.awarded) return true;
                    if (badge.trackProgress && badge.goal) {
                        return (badge.progress || 0) >= badge.goal;
                    }
                    return false;
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
        let threshold = badge.threshold || 1;

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
            case 'custom':
                // Custom badges: use badge's own progress if tracking
                if (badge.awarded) return 100;
                if (badge.trackProgress && badge.goal) {
                    current = badge.progress || 0;
                    threshold = badge.goal;
                } else {
                    return 0; // No progress for non-tracking custom badges
                }
                break;
        }
        return Math.min(100, Math.round((current / threshold) * 100));
    }

    // =========================================================================
    // STATS SYNC
    // =========================================================================

    /**
     * Sync achievement stats with actual data from other widgets
     * This recalculates stats based on existing data (useful for fixing missing progress)
     */
    function syncStats(memberId) {
        try {
            const widgetData = Storage.getWidgetData(memberId, 'achievements') || {};

            // Sync rewards redeemed count from rewards widget
            const rewardsData = Storage.getWidgetData(memberId, 'rewards') || {};
            const rewardHistory = rewardsData.redeemed || [];
            widgetData.rewardsRedeemed = rewardHistory.length;

            // Sync total points earned from points widget history
            const pointsData = Storage.getWidgetData(memberId, 'points') || {};
            const pointsHistory = pointsData.history || [];
            const totalEarned = pointsHistory
                .filter(h => h.type !== 'spent' && h.points > 0)
                .reduce((sum, h) => sum + h.points, 0);
            if (totalEarned > (widgetData.totalPointsEarned || 0)) {
                widgetData.totalPointsEarned = totalEarned;
            }

            // Sync activities completed from tasks widget
            const tasksData = Storage.getWidgetData(memberId, 'kid-tasks') || {};
            const completedTasks = (tasksData.tasks || []).filter(t => t.completed).length;
            if (completedTasks > (widgetData.activitiesCompleted || 0)) {
                widgetData.activitiesCompleted = completedTasks;
            }

            Storage.setWidgetData(memberId, 'achievements', widgetData);

            // Check for new badges after sync
            checkNewBadges(memberId, widgetData);

            return widgetData;
        } catch (e) {
            console.error('Error syncing achievement stats:', e);
            return {};
        }
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

        // Sync stats with actual data before showing page
        syncStats(memberId);

        // Check for progress notifications
        checkAllProgressNotifications(memberId);

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
            rewardsRedeemed: 0,
            customBadges: []
        };

        const allBadges = getAllBadges(widgetData);
        const earnedBadges = calculateEarnedBadges(widgetData);
        const totalBadges = allBadges.length;

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
                    <div class="kid-page__hero-header">
                        <button class="btn btn--ghost kid-page__back" id="backToMemberBtn">
                            <i data-lucide="arrow-left"></i>
                            Back
                        </button>
                        <button class="btn btn--sm btn--ghost" id="addCustomBadgeBtn" title="Add custom badge">
                            <i data-lucide="plus-circle"></i>
                            Add Badge
                        </button>
                    </div>
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
                <div class="kid-page__tabs" style="--tab-color: ${colors.primary}">
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

        const allBadges = getAllBadges(widgetData);

        // Group badges by type
        const badgesByType = {
            custom: { name: isYoungKid ? '🎯 My Goals' : 'Custom Goals', icon: 'target', color: '#EC4899', badges: [] },
            points: { name: isYoungKid ? '⭐ Points' : 'Points Milestones', icon: 'star', color: '#F59E0B', badges: [] },
            streak: { name: isYoungKid ? '🔥 Streaks' : 'Streak Achievements', icon: 'flame', color: '#EF4444', badges: [] },
            activities: { name: isYoungKid ? '✅ Activities' : 'Activity Goals', icon: 'check-circle', color: '#10B981', badges: [] },
            rewards: { name: isYoungKid ? '🎁 Rewards' : 'Reward Milestones', icon: 'gift', color: '#8B5CF6', badges: [] }
        };

        allBadges.forEach(badge => {
            if (badgesByType[badge.type]) {
                badgesByType[badge.type].badges.push(badge);
            }
        });

        const categoryColors = { custom: '#EC4899', points: '#F59E0B', streak: '#EF4444', activities: '#10B981', rewards: '#8B5CF6' };

        // Filter out empty categories (except custom which we always show a message for)
        const nonEmptyCategories = Object.entries(badgesByType).filter(([type, cat]) =>
            cat.badges.length > 0 || type === 'custom'
        );

        return `
            <div class="achievements-full-categories">
                ${nonEmptyCategories.map(([type, category]) => `
                    <div class="achievements-full-category">
                        <div class="achievements-full-category__header" style="--category-color: ${category.color}">
                            ${isYoungKid ? '' : `<i data-lucide="${category.icon}"></i>`}
                            <span>${category.name}</span>
                            <span class="achievements-full-category__count">${category.badges.filter(b => earnedBadges.find(e => e.id === b.id)).length}/${category.badges.length}</span>
                        </div>
                        <div class="achievements-full-category__badges">
                            ${category.badges.length === 0 && type === 'custom' ? `
                                <div class="achievements-empty-custom">
                                    <p>No custom goals yet. Click "Add Badge" to create one!</p>
                                </div>
                            ` : category.badges.map(badge => {
                                const isEarned = earnedBadges.find(e => e.id === badge.id);
                                const progress = getProgress(badge, widgetData);
                                const isCustomType = badge.type === 'custom';
                                const hasTargetDate = isCustomType && badge.targetDate;
                                const targetDateStr = hasTargetDate ? DateUtils.formatShort(badge.targetDate) : '';
                                const isOverdue = hasTargetDate && new Date(badge.targetDate) < new Date() && !isEarned;

                                return `
                                    <div class="achievements-full-badge ${isEarned ? 'achievements-full-badge--earned' : ''} ${badge.isCustom ? 'achievements-full-badge--custom' : ''} ${isOverdue ? 'achievements-full-badge--overdue' : ''}" style="--badge-color: ${category.color}">
                                        <div class="achievements-full-badge__icon">
                                            <i data-lucide="${badge.icon}"></i>
                                            ${isEarned ? '<div class="achievements-full-badge__check">✓</div>' : ''}
                                        </div>
                                        <div class="achievements-full-badge__info">
                                            <span class="achievements-full-badge__name">${badge.name}${badge.isCustom && !isCustomType ? ' <span class="achievements-custom-tag">Custom</span>' : ''}</span>
                                            <span class="achievements-full-badge__desc">${badge.description}</span>
                                            ${hasTargetDate ? `<span class="achievements-full-badge__date ${isOverdue ? 'achievements-full-badge__date--overdue' : ''}">
                                                <i data-lucide="calendar"></i> ${isOverdue ? 'Overdue: ' : 'Due: '}${targetDateStr}
                                            </span>` : ''}
                                            ${isCustomType && badge.rewardPoints ? `<span class="achievements-full-badge__reward">
                                                <i data-lucide="star"></i> +${badge.rewardPoints} pts
                                            </span>` : ''}
                                        </div>

                                        ${!isEarned ? `
                                            ${isCustomType && badge.trackProgress ? `
                                                <!-- Custom badge with progress tracking -->
                                                <div class="achievements-full-badge__progress-section ${badge.trackStreak ? 'achievements-full-badge__progress-section--streak' : ''}">
                                                    ${badge.trackStreak ? `
                                                        <div class="achievements-full-badge__streak-info">
                                                            <span class="streak-current" title="Current streak">🔥 ${badge.currentStreak || 0}</span>
                                                            <span class="streak-best" title="Best streak">⭐ ${badge.bestStreak || 0}</span>
                                                        </div>
                                                    ` : ''}
                                                    <div class="achievements-full-badge__progress">
                                                        <div class="achievements-full-badge__progress-bar">
                                                            <div class="achievements-full-badge__progress-fill" style="width: ${progress}%; background-color: ${category.color}"></div>
                                                        </div>
                                                        <span>${badge.progress || 0}/${badge.goal}${badge.trackStreak ? ' days' : ''}</span>
                                                    </div>
                                                    <div class="achievements-full-badge__progress-buttons">
                                                        <button class="btn btn--sm btn--ghost achievements-full-badge__decrement" data-decrement-badge="${badge.id}" title="Reduce progress">
                                                            <i data-lucide="minus"></i>
                                                        </button>
                                                        <button class="btn btn--sm btn--ghost achievements-full-badge__increment" data-increment-badge="${badge.id}" title="${badge.trackStreak ? 'Log today\'s progress' : 'Add progress'}">
                                                            <i data-lucide="${badge.trackStreak ? 'flame' : 'plus'}"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                            ` : isCustomType ? `
                                                <!-- Custom badge without progress - manual award -->
                                                <button class="btn btn--sm btn--primary achievements-full-badge__award" data-award-badge="${badge.id}">
                                                    <i data-lucide="award"></i>
                                                    Award
                                                </button>
                                            ` : `
                                                <!-- Auto-tracked badge -->
                                                <div class="achievements-full-badge__progress">
                                                    <div class="achievements-full-badge__progress-bar">
                                                        <div class="achievements-full-badge__progress-fill" style="width: ${progress}%; background-color: ${category.color}"></div>
                                                    </div>
                                                    <span>${progress}%</span>
                                                </div>
                                            `}
                                        ` : `
                                            <div class="achievements-full-badge__earned">
                                                ${isYoungKid ? '🎉 Got it!' : 'Earned!'}
                                            </div>
                                            <button class="btn btn--icon btn--ghost btn--xs achievements-full-badge__revoke" data-revoke-badge="${badge.id}" title="Revoke badge">
                                                <i data-lucide="undo-2"></i>
                                            </button>
                                        `}

                                        ${badge.isCustom || isCustomType ? `
                                            <button class="btn btn--icon btn--ghost btn--xs achievements-full-badge__delete" data-delete-badge="${badge.id}" title="Delete badge">
                                                <i data-lucide="trash-2"></i>
                                            </button>
                                        ` : ''}
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

        const allBadges = getAllBadges(widgetData);
        const revokedBadges = widgetData.revokedBadges || [];
        // Filter out both earned and revoked badges from progress view
        const unearnedBadges = allBadges.filter(b =>
            !earnedBadges.find(e => e.id === b.id) && !revokedBadges.includes(b.id)
        );

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
                    <span class="text-muted">Add custom badges to keep the challenge going!</span>
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

        const allBadges = getAllBadges(widgetData);
        const earnedBadges = calculateEarnedBadges(widgetData);
        const completionRate = allBadges.length > 0 ? Math.round((earnedBadges.length / allBadges.length) * 100) : 0;

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
                        <p>${earnedBadges.length} of ${allBadges.length} badges earned</p>
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
                            const categoryBadges = allBadges.filter(b => b.type === cat.type);
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
     * Show the Add Custom Badge modal
     */
    function showAddBadgeModal(memberId, onSave) {
        const typeOptions = [
            { value: 'custom', label: 'Custom Goal', desc: 'Manual tracking & award' },
            { value: 'points', label: 'Points', desc: 'Based on total points earned' },
            { value: 'streak', label: 'Streak', desc: 'Based on consecutive day streak' },
            { value: 'activities', label: 'Activities', desc: 'Based on activities completed' },
            { value: 'rewards', label: 'Rewards', desc: 'Based on rewards redeemed' }
        ];

        const content = `
            <div class="achievements-add-badge">
                <!-- Template Picker Section -->
                <div class="form-group">
                    <label class="form-label">Quick Start: Use a Template</label>
                    <div class="achievements-template-categories" id="templateCategories">
                        ${Object.entries(TEMPLATE_CATEGORIES).map(([key, cat]) => `
                            <button type="button" class="achievements-template-category" data-category="${key}" style="--cat-color: ${cat.color}">
                                <span class="emoji">${cat.emoji}</span>
                                <span class="label">${cat.name}</span>
                            </button>
                        `).join('')}
                    </div>
                    <div class="achievements-template-list" id="templateList" style="display: none;">
                        <!-- Templates will be populated when category is selected -->
                    </div>
                </div>

                <div class="form-divider">
                    <span>or create your own</span>
                </div>

                <div class="form-group">
                    <label class="form-label">Badge Name</label>
                    <input type="text" class="form-input" id="badgeName" placeholder="e.g. Learn to Ride a Bike" maxlength="30">
                </div>

                <div class="form-group">
                    <label class="form-label">Description</label>
                    <input type="text" class="form-input" id="badgeDesc" placeholder="e.g. Ride without training wheels" maxlength="60">
                </div>

                <div class="form-group">
                    <label class="form-label">Category</label>
                    <select class="form-input" id="badgeType">
                        ${typeOptions.map((t, i) => `<option value="${t.value}" ${i === 0 ? 'selected' : ''}>${t.label} — ${t.desc}</option>`).join('')}
                    </select>
                </div>

                <!-- Auto-tracked category options -->
                <div class="form-group" id="autoThresholdGroup">
                    <label class="form-label">Goal (threshold)</label>
                    <input type="number" class="form-input" id="badgeThreshold" min="1" max="99999" value="10" placeholder="e.g. 20">
                </div>

                <!-- Custom category options -->
                <div id="customBadgeOptions" style="display: block;">
                    <div class="form-group">
                        <label class="form-checkbox">
                            <input type="checkbox" id="trackProgress">
                            <span>Track progress toward goal</span>
                        </label>
                        <p class="form-hint">Enable to track steps/count toward this badge</p>
                    </div>

                    <div class="form-group" id="progressGoalGroup" style="display: none;">
                        <label class="form-label">Progress Goal</label>
                        <input type="number" class="form-input" id="progressGoal" min="1" max="999" value="5" placeholder="e.g. 5">
                        <p class="form-hint">How many times/steps to complete</p>
                    </div>

                    <div class="form-group">
                        <label class="form-checkbox">
                            <input type="checkbox" id="trackStreak">
                            <span>Track consecutive day streak</span>
                        </label>
                        <p class="form-hint">Badge requires progress on consecutive days</p>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Target Date (optional)</label>
                        <input type="date" class="form-input" id="targetDate" min="${DateUtils.today()}">
                        <p class="form-hint">Set a deadline for this goal</p>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Reward Points (optional)</label>
                        <input type="number" class="form-input" id="rewardPoints" min="0" max="9999" value="" placeholder="e.g. 50">
                        <p class="form-hint">Points to award when badge is earned</p>
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">Icon</label>
                    <div class="achievements-icon-picker" id="iconPicker">
                        ${BADGE_ICONS.map((icon, i) => `
                            <button type="button" class="achievements-icon-picker__item ${i === 0 ? 'achievements-icon-picker__item--selected' : ''}" data-icon="${icon}" title="${icon}">
                                <i data-lucide="${icon}"></i>
                            </button>
                        `).join('')}
                    </div>
                    <input type="hidden" id="badgeIcon" value="${BADGE_ICONS[0]}">
                </div>
            </div>
        `;

        Modal.open({
            title: 'Add Custom Badge',
            content,
            footer: `
                <button class="btn btn--secondary" data-modal-cancel>Cancel</button>
                <button class="btn btn--primary" id="saveBadgeBtn">
                    <i data-lucide="check"></i>
                    Add Badge
                </button>
            `
        });

        if (typeof lucide !== 'undefined') lucide.createIcons();

        // Toggle visibility based on badge type
        const typeSelect = document.getElementById('badgeType');
        const customOptions = document.getElementById('customBadgeOptions');
        const autoThresholdGroup = document.getElementById('autoThresholdGroup');
        const trackProgressCheckbox = document.getElementById('trackProgress');
        const progressGoalGroup = document.getElementById('progressGoalGroup');

        function updateTypeUI() {
            const isCustom = typeSelect.value === 'custom';
            customOptions.style.display = isCustom ? 'block' : 'none';
            autoThresholdGroup.style.display = isCustom ? 'none' : 'block';
        }

        typeSelect?.addEventListener('change', updateTypeUI);
        updateTypeUI(); // Initial state

        // Toggle progress goal visibility
        trackProgressCheckbox?.addEventListener('change', () => {
            progressGoalGroup.style.display = trackProgressCheckbox.checked ? 'block' : 'none';
        });

        // Template category selection
        const templateCategories = document.getElementById('templateCategories');
        const templateList = document.getElementById('templateList');

        templateCategories?.querySelectorAll('.achievements-template-category').forEach(btn => {
            btn.addEventListener('click', () => {
                const category = btn.dataset.category;
                const templates = BADGE_TEMPLATES.filter(t => t.category === category);
                const catInfo = TEMPLATE_CATEGORIES[category];

                // Highlight selected category
                templateCategories.querySelectorAll('.achievements-template-category').forEach(b =>
                    b.classList.remove('achievements-template-category--selected'));
                btn.classList.add('achievements-template-category--selected');

                // Show templates
                templateList.style.display = 'block';
                templateList.innerHTML = `
                    <div class="achievements-template-list__header">
                        <span>${catInfo.emoji} ${catInfo.name}</span>
                        <button type="button" class="btn btn--xs btn--ghost" id="closeTemplateList">
                            <i data-lucide="x"></i>
                        </button>
                    </div>
                    <div class="achievements-template-list__items">
                        ${templates.map((t, i) => `
                            <button type="button" class="achievements-template-item" data-template-index="${BADGE_TEMPLATES.indexOf(t)}">
                                <i data-lucide="${t.icon}"></i>
                                <div class="achievements-template-item__info">
                                    <span class="name">${t.name}</span>
                                    <span class="desc">${t.description}</span>
                                </div>
                                <span class="points">+${t.rewardPoints} pts</span>
                            </button>
                        `).join('')}
                    </div>
                `;

                if (typeof lucide !== 'undefined') lucide.createIcons({ nodes: [templateList] });

                // Close templates
                templateList.querySelector('#closeTemplateList')?.addEventListener('click', () => {
                    templateList.style.display = 'none';
                    templateCategories.querySelectorAll('.achievements-template-category').forEach(b =>
                        b.classList.remove('achievements-template-category--selected'));
                });

                // Select a template
                templateList.querySelectorAll('.achievements-template-item').forEach(item => {
                    item.addEventListener('click', () => {
                        const idx = parseInt(item.dataset.templateIndex);
                        const template = BADGE_TEMPLATES[idx];
                        if (!template) return;

                        // Fill in the form with template data
                        document.getElementById('badgeName').value = template.name;
                        document.getElementById('badgeDesc').value = template.description;
                        document.getElementById('badgeType').value = 'custom';
                        updateTypeUI();

                        // Set progress tracking
                        trackProgressCheckbox.checked = true;
                        progressGoalGroup.style.display = 'block';
                        document.getElementById('progressGoal').value = template.goal;

                        // Set streak tracking if applicable
                        const trackStreakCheckbox = document.getElementById('trackStreak');
                        if (trackStreakCheckbox) {
                            trackStreakCheckbox.checked = template.isStreak || false;
                        }

                        // Set reward points
                        document.getElementById('rewardPoints').value = template.rewardPoints || '';

                        // Select icon
                        const iconToSelect = template.icon;
                        document.querySelectorAll('.achievements-icon-picker__item').forEach(iconBtn => {
                            iconBtn.classList.remove('achievements-icon-picker__item--selected');
                            if (iconBtn.dataset.icon === iconToSelect) {
                                iconBtn.classList.add('achievements-icon-picker__item--selected');
                            }
                        });
                        document.getElementById('badgeIcon').value = iconToSelect;

                        // Hide template list and show success
                        templateList.style.display = 'none';
                        templateCategories.querySelectorAll('.achievements-template-category').forEach(b =>
                            b.classList.remove('achievements-template-category--selected'));

                        Toast.success(`Template "${template.name}" loaded!`);
                    });
                });
            });
        });

        // Icon picker events
        document.querySelectorAll('.achievements-icon-picker__item').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.achievements-icon-picker__item--selected').forEach(b =>
                    b.classList.remove('achievements-icon-picker__item--selected'));
                btn.classList.add('achievements-icon-picker__item--selected');
                document.getElementById('badgeIcon').value = btn.dataset.icon;
            });
        });

        // Save button
        document.getElementById('saveBadgeBtn')?.addEventListener('click', () => {
            const name = document.getElementById('badgeName')?.value?.trim();
            const desc = document.getElementById('badgeDesc')?.value?.trim();
            const type = document.getElementById('badgeType')?.value;
            const icon = document.getElementById('badgeIcon')?.value || 'star';

            if (!name) { Toast.error('Please enter a badge name'); return; }
            if (!desc) { Toast.error('Please enter a description'); return; }

            const widgetData = Storage.getWidgetData(memberId, 'achievements') || {};
            if (!widgetData.customBadges) widgetData.customBadges = [];

            let newBadge;

            if (type === 'custom') {
                // Custom badge with manual tracking
                const trackProgress = document.getElementById('trackProgress')?.checked;
                const trackStreak = document.getElementById('trackStreak')?.checked;
                const progressGoal = parseInt(document.getElementById('progressGoal')?.value) || 5;
                const targetDate = document.getElementById('targetDate')?.value;
                const rewardPoints = parseInt(document.getElementById('rewardPoints')?.value) || 0;

                newBadge = {
                    id: `custom-${Date.now()}`,
                    name,
                    description: desc,
                    icon,
                    type: 'custom',
                    trackProgress,
                    trackStreak: trackProgress && trackStreak, // Only track streak if also tracking progress
                    goal: trackProgress ? progressGoal : null,
                    progress: 0,
                    currentStreak: 0, // Current consecutive days
                    bestStreak: 0, // Best streak achieved
                    lastProgressDate: null, // Last date progress was made
                    targetDate: targetDate || null,
                    rewardPoints: rewardPoints > 0 ? rewardPoints : null,
                    awarded: false,
                    createdAt: new Date().toISOString()
                };
            } else {
                // Auto-tracked badge tied to existing category
                const threshold = parseInt(document.getElementById('badgeThreshold')?.value);
                if (!threshold || threshold < 1) {
                    Toast.error('Please enter a valid goal (1 or more)');
                    return;
                }

                newBadge = {
                    id: `custom-${Date.now()}`,
                    name,
                    description: desc,
                    icon,
                    threshold,
                    type
                };
            }

            widgetData.customBadges.push(newBadge);
            Storage.setWidgetData(memberId, 'achievements', widgetData);

            // Check if it's immediately earned (for auto-tracked types)
            if (type !== 'custom') {
                checkNewBadges(memberId, widgetData);
            }

            Modal.close();
            Toast.success(`Badge "${name}" added!`);
            if (onSave) onSave();
        });
    }

    /**
     * Delete a custom badge
     */
    async function deleteCustomBadge(memberId, badgeId, onDelete) {
        const widgetData = Storage.getWidgetData(memberId, 'achievements') || {};
        if (!widgetData.customBadges) return;

        const badge = widgetData.customBadges.find(b => b.id === badgeId);
        if (!badge) return;

        const confirmed = await Modal.confirm(
            `Delete the "${badge.name}" badge?`,
            'Delete Badge'
        );

        if (confirmed) {
            widgetData.customBadges = widgetData.customBadges.filter(b => b.id !== badgeId);
            // Also remove from notifiedBadges if present
            if (widgetData.notifiedBadges) {
                widgetData.notifiedBadges = widgetData.notifiedBadges.filter(id => id !== badgeId);
            }
            Storage.setWidgetData(memberId, 'achievements', widgetData);
            Toast.success('Badge deleted');
            if (onDelete) onDelete();
        }
    }

    /**
     * Revoke an earned badge (adds to revokedBadges so it appears unearned)
     */
    async function revokeBadge(memberId, badgeId, onRevoke) {
        const widgetData = Storage.getWidgetData(memberId, 'achievements') || {};
        const allBadges = getAllBadges(widgetData);
        const badge = allBadges.find(b => b.id === badgeId);
        if (!badge) return;

        // Check if this is a custom badge with progress tracking
        const isCustomWithProgress = badge.type === 'custom' && badge.trackProgress;

        const confirmed = await Modal.confirm(
            `Revoke the "${badge.name}" badge? The kid will need to earn it again.`,
            'Revoke Badge'
        );

        if (confirmed) {
            // For custom badges with progress, ask if they want to reset progress
            let resetProgress = false;
            if (isCustomWithProgress) {
                resetProgress = await Modal.confirm(
                    `Do you also want to reset the progress to 0?`,
                    'Reset Progress'
                );
            }

            // Handle custom badge - update awarded status and optionally reset progress
            if (badge.type === 'custom' && widgetData.customBadges) {
                const badgeIndex = widgetData.customBadges.findIndex(b => b.id === badgeId);
                if (badgeIndex !== -1) {
                    widgetData.customBadges[badgeIndex].awarded = false;
                    widgetData.customBadges[badgeIndex].awardedAt = null;
                    if (resetProgress) {
                        widgetData.customBadges[badgeIndex].progress = 0;
                    }
                }
            }

            // Add to revokedBadges array (for non-custom badges)
            if (!widgetData.revokedBadges) {
                widgetData.revokedBadges = [];
            }
            if (!widgetData.revokedBadges.includes(badgeId)) {
                widgetData.revokedBadges.push(badgeId);
            }
            // Remove from notifiedBadges so it can be re-notified when re-earned
            if (widgetData.notifiedBadges) {
                widgetData.notifiedBadges = widgetData.notifiedBadges.filter(id => id !== badgeId);
            }
            Storage.setWidgetData(memberId, 'achievements', widgetData);
            Toast.success(resetProgress ? 'Badge revoked and progress reset' : 'Badge revoked');
            if (onRevoke) onRevoke();
        }
    }

    /**
     * Award a custom badge manually
     */
    async function awardCustomBadge(memberId, badgeId, onAward) {
        const widgetData = Storage.getWidgetData(memberId, 'achievements') || {};
        if (!widgetData.customBadges) return;

        const badgeIndex = widgetData.customBadges.findIndex(b => b.id === badgeId);
        if (badgeIndex === -1) return;

        const badge = widgetData.customBadges[badgeIndex];

        const confirmed = await Modal.confirm(
            `Award the "${badge.name}" badge? This will mark it as earned!`,
            'Award Badge'
        );

        if (confirmed) {
            widgetData.customBadges[badgeIndex].awarded = true;
            widgetData.customBadges[badgeIndex].awardedAt = new Date().toISOString();
            Storage.setWidgetData(memberId, 'achievements', widgetData);

            // Award points if configured
            if (badge.rewardPoints && badge.rewardPoints > 0) {
                if (typeof Points !== 'undefined' && Points.addPoints) {
                    Points.addPoints(memberId, badge.rewardPoints, `Badge: ${badge.name}`);
                }
            }

            // Show badge unlocked animation
            showBadgeUnlockedAnimation({ ...badge, type: 'custom' });

            // Track notification
            if (!widgetData.notifiedBadges) widgetData.notifiedBadges = [];
            if (!widgetData.notifiedBadges.includes(badgeId)) {
                widgetData.notifiedBadges.push(badgeId);
                Storage.setWidgetData(memberId, 'achievements', widgetData);
            }

            const pointsMsg = badge.rewardPoints ? ` +${badge.rewardPoints} points!` : '';
            Toast.success(`Badge "${badge.name}" awarded!${pointsMsg} 🎉`);
            if (onAward) onAward();
        }
    }

    /**
     * Increment progress on a custom badge
     */
    function incrementCustomProgress(memberId, badgeId, amount = 1, onUpdate) {
        const widgetData = Storage.getWidgetData(memberId, 'achievements') || {};
        if (!widgetData.customBadges) return;

        const badgeIndex = widgetData.customBadges.findIndex(b => b.id === badgeId);
        if (badgeIndex === -1) return;

        const badge = widgetData.customBadges[badgeIndex];
        if (!badge.trackProgress || badge.awarded) return;

        const today = DateUtils.today();
        const lastProgressDate = badge.lastProgressDate;

        // Handle streak tracking
        if (badge.trackStreak) {
            if (lastProgressDate === today) {
                // Already made progress today - just increment, don't update streak
                const newProgress = Math.min((badge.progress || 0) + amount, badge.goal);
                widgetData.customBadges[badgeIndex].progress = newProgress;
            } else {
                // Check if this is consecutive day
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = yesterday.toISOString().split('T')[0];

                let currentStreak = badge.currentStreak || 0;

                if (lastProgressDate === yesterdayStr) {
                    // Consecutive day - increment streak
                    currentStreak += 1;
                } else if (!lastProgressDate) {
                    // First time - start streak
                    currentStreak = 1;
                } else {
                    // Streak broken - reset to 1
                    currentStreak = 1;
                }

                // Update badge data
                widgetData.customBadges[badgeIndex].currentStreak = currentStreak;
                widgetData.customBadges[badgeIndex].bestStreak = Math.max(badge.bestStreak || 0, currentStreak);
                widgetData.customBadges[badgeIndex].lastProgressDate = today;

                // For streak badges, progress = current streak
                const newProgress = Math.min(currentStreak, badge.goal);
                widgetData.customBadges[badgeIndex].progress = newProgress;
            }
        } else {
            // Normal progress tracking (non-streak)
            const newProgress = Math.min((badge.progress || 0) + amount, badge.goal);
            widgetData.customBadges[badgeIndex].progress = newProgress;
            widgetData.customBadges[badgeIndex].lastProgressDate = today;
        }

        // Re-read updated badge
        const updatedBadge = widgetData.customBadges[badgeIndex];
        const newProgress = updatedBadge.progress;

        // Check if goal reached
        if (newProgress >= badge.goal) {
            widgetData.customBadges[badgeIndex].awarded = true;
            widgetData.customBadges[badgeIndex].awardedAt = new Date().toISOString();

            // Award points if configured
            if (badge.rewardPoints && badge.rewardPoints > 0) {
                if (typeof Points !== 'undefined' && Points.addPoints) {
                    Points.addPoints(memberId, badge.rewardPoints, `Badge: ${badge.name}`);
                }
            }

            // Show badge unlocked animation
            showBadgeUnlockedAnimation({ ...badge, type: 'custom' });

            // Track notification
            if (!widgetData.notifiedBadges) widgetData.notifiedBadges = [];
            if (!widgetData.notifiedBadges.includes(badgeId)) {
                widgetData.notifiedBadges.push(badgeId);
            }

            const pointsMsg = badge.rewardPoints ? ` +${badge.rewardPoints} points!` : '';
            Toast.success(`Badge "${badge.name}" earned!${pointsMsg} 🎉`);
        } else {
            // Show progress message with streak info if applicable
            if (badge.trackStreak) {
                const streakMsg = `🔥 ${updatedBadge.currentStreak} day streak! (${newProgress}/${badge.goal})`;
                Toast.success(streakMsg);
            } else {
                Toast.success(`Progress: ${newProgress}/${badge.goal}`);
            }

            // Check for progress notification (close to earning)
            checkProgressNotification(memberId, widgetData, badgeIndex);
        }

        Storage.setWidgetData(memberId, 'achievements', widgetData);
        if (onUpdate) onUpdate();
    }

    /**
     * Decrement progress on a custom badge (for corrections)
     */
    function decrementCustomProgress(memberId, badgeId, amount = 1, onUpdate) {
        const widgetData = Storage.getWidgetData(memberId, 'achievements') || {};
        if (!widgetData.customBadges) return;

        const badgeIndex = widgetData.customBadges.findIndex(b => b.id === badgeId);
        if (badgeIndex === -1) return;

        const badge = widgetData.customBadges[badgeIndex];
        if (!badge.trackProgress || badge.awarded) return;

        const newProgress = Math.max(0, (badge.progress || 0) - amount);
        widgetData.customBadges[badgeIndex].progress = newProgress;

        // For streak badges, also decrement the current streak
        if (badge.trackStreak && newProgress < (badge.currentStreak || 0)) {
            widgetData.customBadges[badgeIndex].currentStreak = newProgress;
        }

        Storage.setWidgetData(memberId, 'achievements', widgetData);

        if (badge.trackStreak) {
            Toast.success(`🔥 Streak adjusted: ${newProgress}/${badge.goal}`);
        } else {
            Toast.success(`Progress: ${newProgress}/${badge.goal}`);
        }
        if (onUpdate) onUpdate();
    }

    /**
     * Check and show notification when close to earning a badge
     */
    function checkProgressNotification(memberId, widgetData, badgeIndex) {
        const badge = widgetData.customBadges[badgeIndex];
        if (!badge || badge.awarded) return;

        const progress = badge.progress || 0;
        const goal = badge.goal || 1;
        const remaining = goal - progress;
        const percentComplete = (progress / goal) * 100;

        // Initialize progress notifications tracking
        if (!widgetData.progressNotifications) {
            widgetData.progressNotifications = {};
        }

        const notificationKey = badge.id;
        const lastNotified = widgetData.progressNotifications[notificationKey];

        // Notify at 50%, 75%, 90% and when 1-2 away
        const thresholds = [
            { percent: 50, key: '50' },
            { percent: 75, key: '75' },
            { percent: 90, key: '90' }
        ];

        // Check percentage-based thresholds
        for (const threshold of thresholds) {
            if (percentComplete >= threshold.percent && lastNotified !== threshold.key && percentComplete < 100) {
                // Show encouraging notification
                const messages = {
                    '50': `Halfway there! "${badge.name}" is ${threshold.percent}% complete!`,
                    '75': `Almost there! "${badge.name}" is ${threshold.percent}% complete!`,
                    '90': `So close! Just a bit more for "${badge.name}"!`
                };
                Toast.info(messages[threshold.key] + ' 🌟');
                widgetData.progressNotifications[notificationKey] = threshold.key;
                Storage.setWidgetData(memberId, 'achievements', widgetData);
                return; // Only show one notification at a time
            }
        }

        // Special notification when very close (1-2 away)
        if (remaining <= 2 && remaining > 0 && lastNotified !== 'almost') {
            const streakText = badge.trackStreak ? ' day' + (remaining > 1 ? 's' : '') : ' more';
            Toast.info(`Just ${remaining}${streakText} to earn "${badge.name}"! 🎯`);
            widgetData.progressNotifications[notificationKey] = 'almost';
            Storage.setWidgetData(memberId, 'achievements', widgetData);
        }
    }

    /**
     * Check all badges for progress notifications (called on page load)
     */
    function checkAllProgressNotifications(memberId) {
        const widgetData = Storage.getWidgetData(memberId, 'achievements') || {};
        if (!widgetData.customBadges) return;

        widgetData.customBadges.forEach((badge, index) => {
            if (badge.trackProgress && !badge.awarded) {
                const progress = badge.progress || 0;
                const goal = badge.goal || 1;
                const percentComplete = (progress / goal) * 100;

                // Only check if significant progress has been made
                if (percentComplete >= 75 && percentComplete < 100) {
                    checkProgressNotification(memberId, widgetData, index);
                }
            }
        });
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

        // Add custom badge button (PIN protected)
        document.getElementById('addCustomBadgeBtn')?.addEventListener('click', async () => {
            const verified = await PIN.verify();
            if (verified) {
                showAddBadgeModal(memberId, () => {
                    renderFullPage(container, memberId, member, currentTab);
                });
            }
        });

        // Delete custom badge buttons (PIN protected)
        container.querySelectorAll('[data-delete-badge]').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const verified = await PIN.verify();
                if (verified) {
                    deleteCustomBadge(memberId, btn.dataset.deleteBadge, () => {
                        renderFullPage(container, memberId, member, currentTab);
                    });
                }
            });
        });

        // Revoke earned badge buttons (PIN protected)
        container.querySelectorAll('[data-revoke-badge]').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const verified = await PIN.verify();
                if (verified) {
                    revokeBadge(memberId, btn.dataset.revokeBadge, () => {
                        renderFullPage(container, memberId, member, currentTab);
                    });
                }
            });
        });

        // Award custom badge buttons (PIN protected)
        container.querySelectorAll('[data-award-badge]').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const verified = await PIN.verify();
                if (verified) {
                    awardCustomBadge(memberId, btn.dataset.awardBadge, () => {
                        renderFullPage(container, memberId, member, currentTab);
                    });
                }
            });
        });

        // Increment custom badge progress buttons (PIN protected)
        container.querySelectorAll('[data-increment-badge]').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const verified = await PIN.verify();
                if (verified) {
                    incrementCustomProgress(memberId, btn.dataset.incrementBadge, 1, () => {
                        renderFullPage(container, memberId, member, currentTab);
                    });
                }
            });
        });

        // Decrement custom badge progress buttons (PIN protected)
        container.querySelectorAll('[data-decrement-badge]').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const verified = await PIN.verify();
                if (verified) {
                    decrementCustomProgress(memberId, btn.dataset.decrementBadge, 1, () => {
                        renderFullPage(container, memberId, member, currentTab);
                    });
                }
            });
        });
    }

    /**
     * Show all badges modal - redesigned with visual stats and categories
     */
    function showAllBadgesModal(memberId, widgetData) {
        const allBadges = getAllBadges(widgetData);
        const earnedBadges = calculateEarnedBadges(widgetData);
        const totalBadges = allBadges.length;
        const earnedCount = earnedBadges.length;

        // Group badges by type
        const badgesByType = {
            points: { name: 'Points Milestones', icon: 'star', color: '#F59E0B', badges: [] },
            streak: { name: 'Streak Achievements', icon: 'flame', color: '#EF4444', badges: [] },
            activities: { name: 'Activity Goals', icon: 'check-circle', color: '#10B981', badges: [] },
            rewards: { name: 'Reward Milestones', icon: 'gift', color: '#8B5CF6', badges: [] }
        };

        allBadges.forEach(badge => {
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
     * value can be negative for deductions (e.g., when resetting points)
     */
    function updateStats(memberId, type, value) {
        const widgetData = Storage.getWidgetData(memberId, 'achievements') || {};

        switch (type) {
            case 'points':
                widgetData.totalPointsEarned = Math.max(0, (widgetData.totalPointsEarned || 0) + value);
                break;
            case 'activity':
                widgetData.activitiesCompleted = Math.max(0, (widgetData.activitiesCompleted || 0) + value);
                break;
            case 'reward':
                widgetData.rewardsRedeemed = Math.max(0, (widgetData.rewardsRedeemed || 0) + value);
                break;
            case 'streak':
                widgetData.currentStreak = value;
                break;
        }

        Storage.setWidgetData(memberId, 'achievements', widgetData);

        // Only check for new badges if value is positive (earning, not deducting)
        if (value > 0) {
            checkNewBadges(memberId, widgetData);
        }
    }

    /**
     * Badge unlock animation queue
     */
    const badgeAnimationQueue = [];
    let isAnimating = false;

    function showBadgeUnlockedAnimation(badge) {
        badgeAnimationQueue.push(badge);
        if (!isAnimating) processNextBadgeAnimation();
    }

    function processNextBadgeAnimation() {
        if (badgeAnimationQueue.length === 0) {
            isAnimating = false;
            return;
        }
        isAnimating = true;
        const badge = badgeAnimationQueue.shift();
        const categoryColors = { points: '#F59E0B', streak: '#EF4444', activities: '#10B981', rewards: '#8B5CF6' };
        const color = categoryColors[badge.type] || '#8B5CF6';

        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'badge-unlock-overlay';
        overlay.innerHTML = `
            <div class="badge-unlock-particles" aria-hidden="true">
                ${Array.from({ length: 20 }, (_, i) => `<div class="badge-unlock-particle" style="--i:${i};--color:${color}"></div>`).join('')}
            </div>
            <div class="badge-unlock-card">
                <div class="badge-unlock-glow" style="--glow-color:${color}"></div>
                <div class="badge-unlock-label">Badge Unlocked!</div>
                <div class="badge-unlock-icon" style="--badge-color:${color}">
                    <i data-lucide="${badge.icon}"></i>
                </div>
                <div class="badge-unlock-name">${badge.name}</div>
                <div class="badge-unlock-desc">${badge.description}</div>
                <div class="badge-unlock-tap">Tap to continue</div>
            </div>
        `;

        document.body.appendChild(overlay);
        if (typeof lucide !== 'undefined') lucide.createIcons({ nodes: [overlay] });

        // Trigger enter animation on next frame
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                overlay.classList.add('badge-unlock-overlay--visible');
            });
        });

        // Dismiss on click or auto-dismiss after 4s
        const dismiss = () => {
            overlay.classList.remove('badge-unlock-overlay--visible');
            overlay.classList.add('badge-unlock-overlay--exit');
            setTimeout(() => {
                overlay.remove();
                processNextBadgeAnimation();
            }, 400);
        };

        overlay.addEventListener('click', dismiss);
        setTimeout(dismiss, 4000);
    }

    /**
     * Check and notify for new badges
     */
    function checkNewBadges(memberId, widgetData) {
        const notified = widgetData.notifiedBadges || [];
        const revokedBadges = widgetData.revokedBadges || [];
        const allBadges = getAllBadges(widgetData);

        // Check each badge for earning (including revoked ones that may be re-earned)
        allBadges.forEach(badge => {
            const meetsThreshold = checkBadgeThreshold(badge, widgetData);

            if (meetsThreshold) {
                // If badge was revoked but now re-earned, remove from revoked list
                if (revokedBadges.includes(badge.id)) {
                    widgetData.revokedBadges = revokedBadges.filter(id => id !== badge.id);
                }

                // Notify if not already notified
                if (!notified.includes(badge.id)) {
                    showBadgeUnlockedAnimation(badge);
                    notified.push(badge.id);
                    Storage.trackAction(memberId, 'achievements', 'unlocked');

                    // Log to Activity Monitor
                    Storage.logActivityEvent({
                        memberId: memberId,
                        widgetId: 'achievements',
                        action: 'unlocked',
                        details: `Unlocked achievement "${badge.name}"`,
                        meta: { badgeId: badge.id, badgeName: badge.name, badgeType: badge.type }
                    });
                }
            }
        });

        widgetData.notifiedBadges = notified;
        Storage.setWidgetData(memberId, 'achievements', widgetData);
    }

    /**
     * Check if a badge threshold is met
     */
    function checkBadgeThreshold(badge, widgetData) {
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
    }

    function init() {
        // Initialize achievements feature
    }

    return {
        init,
        renderWidget,
        updateStats,
        syncStats,
        showFullPage
    };
})();
