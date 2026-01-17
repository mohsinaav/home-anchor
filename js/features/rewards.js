/**
 * Rewards System Feature
 * Kid-friendly reward redemption with icons and animations
 * Full page with tabs: Rewards, Wishlist, History
 */

const Rewards = (function() {
    // Track current tab in full page view
    let currentTab = 'rewards';

    // Reward icons
    const REWARD_ICONS = [
        'monitor', 'utensils', 'moon', 'ice-cream-cone', 'film', 'gamepad-2',
        'gift', 'pizza', 'candy', 'music', 'party-popper', 'cake',
        'shopping-bag', 'bike', 'star', 'heart', 'sparkles', 'thumbs-up'
    ];

    // Reward colors
    const REWARD_COLORS = [
        { id: '#3B82F6', name: 'Blue' },
        { id: '#10B981', name: 'Green' },
        { id: '#8B5CF6', name: 'Purple' },
        { id: '#EF4444', name: 'Red' },
        { id: '#EC4899', name: 'Pink' },
        { id: '#F59E0B', name: 'Amber' }
    ];

    // Default rewards
    const DEFAULT_REWARDS = [
        { id: 'rwd-1', name: '30 min screen time', cost: 20, icon: 'monitor', color: '#3B82F6' },
        { id: 'rwd-2', name: 'Choose dinner', cost: 30, icon: 'utensils', color: '#10B981' },
        { id: 'rwd-3', name: 'Stay up 30 min late', cost: 40, icon: 'moon', color: '#8B5CF6' },
        { id: 'rwd-4', name: 'Ice cream treat', cost: 25, icon: 'ice-cream-cone', color: '#EC4899' },
        { id: 'rwd-5', name: 'Movie night pick', cost: 50, icon: 'film', color: '#EF4444' }
    ];

    /**
     * Get widget data with defaults
     */
    function getWidgetData(memberId) {
        const storedData = Storage.getWidgetData(memberId, 'rewards') || {};

        if (!storedData.rewards || storedData.rewards.length === 0) {
            storedData.rewards = DEFAULT_REWARDS.map(r => ({
                ...r,
                id: `${r.id}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
            }));
            storedData.redeemed = [];
            Storage.setWidgetData(memberId, 'rewards', storedData);
        }

        return storedData;
    }

    /**
     * Render the rewards widget for a member
     */
    function renderWidget(container, memberId) {
        const pointsData = Storage.getWidgetData(memberId, 'points') || { balance: 0 };
        const rewardsData = getWidgetData(memberId);
        const wishlist = rewardsData.wishlist || [];

        const balance = pointsData.balance || 0;

        // Separate wishlist items from regular rewards
        const wishlistRewards = rewardsData.rewards.filter(r => wishlist.includes(r.id));
        const otherRewards = rewardsData.rewards.filter(r => !wishlist.includes(r.id));

        container.innerHTML = `
            <div class="rewards-widget rewards-widget--kid">
                <div class="rewards-widget__balance--big">
                    <div class="rewards-widget__balance-icon">
                        <i data-lucide="gift"></i>
                    </div>
                    <div class="rewards-widget__balance-info">
                        <span class="rewards-widget__balance-count">${balance}</span>
                        <span class="rewards-widget__balance-label">Points to Spend</span>
                    </div>
                </div>

                ${wishlistRewards.length > 0 ? `
                    <div class="rewards-wishlist-section">
                        <h4 class="rewards-widget__section-title">
                            <i data-lucide="heart" class="title-icon title-icon--pink"></i>
                            Saving For
                        </h4>
                        <div class="rewards-wishlist">
                            ${wishlistRewards.map(reward => {
                                const canAfford = balance >= reward.cost;
                                const progress = Math.min(100, Math.round((balance / reward.cost) * 100));
                                const pointsNeeded = Math.max(0, reward.cost - balance);
                                return `
                                    <div class="reward-wishlist-card" style="--reward-color: ${reward.color || '#6366F1'}">
                                        <button class="reward-wishlist-card__star" data-wishlist-toggle="${reward.id}" title="Remove from wishlist">
                                            <i data-lucide="heart-off"></i>
                                        </button>
                                        <div class="reward-wishlist-card__icon" style="background-color: ${reward.color || '#6366F1'}">
                                            <i data-lucide="${reward.icon || 'gift'}"></i>
                                        </div>
                                        <div class="reward-wishlist-card__info">
                                            <span class="reward-wishlist-card__name">${reward.name}</span>
                                            <div class="reward-wishlist-card__progress">
                                                <div class="reward-wishlist-card__progress-bar">
                                                    <div class="reward-wishlist-card__progress-fill" style="width: ${progress}%; background-color: ${reward.color || '#6366F1'}"></div>
                                                </div>
                                                <span class="reward-wishlist-card__progress-text">
                                                    ${canAfford ? 'Ready!' : `${pointsNeeded} more pts`}
                                                </span>
                                            </div>
                                        </div>
                                        ${canAfford ? `
                                            <button class="btn btn--sm btn--primary" data-redeem="${reward.id}" data-member-id="${memberId}">
                                                Redeem!
                                            </button>
                                        ` : ''}
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                ` : ''}

                <h4 class="rewards-widget__section-title">Available Rewards</h4>
                <div class="rewards-grid">
                    ${otherRewards.map(reward => {
                        const canAfford = balance >= reward.cost;
                        return `
                            <div class="reward-card ${canAfford ? 'reward-card--available' : 'reward-card--locked'} hover-bounce"
                                 style="--reward-color: ${reward.color || '#6366F1'}"
                                 data-reward-id="${reward.id}">
                                <button class="reward-card__wishlist-btn" data-wishlist-toggle="${reward.id}" title="Add to wishlist">
                                    <i data-lucide="heart"></i>
                                </button>
                                <div class="reward-card__icon" style="background-color: ${reward.color || '#6366F1'}">
                                    <i data-lucide="${reward.icon || 'gift'}"></i>
                                </div>
                                <div class="reward-card__info">
                                    <span class="reward-card__name">${reward.name}</span>
                                    <span class="reward-card__cost">
                                        <i data-lucide="star"></i>
                                        ${reward.cost}
                                    </span>
                                </div>
                                <button
                                    class="reward-card__btn btn btn--sm ${canAfford ? 'btn--primary' : 'btn--ghost'}"
                                    data-redeem="${reward.id}"
                                    data-member-id="${memberId}"
                                    ${canAfford ? '' : 'disabled'}
                                >
                                    ${canAfford ? 'Redeem' : `Need ${reward.cost - balance}`}
                                </button>
                            </div>
                        `;
                    }).join('')}
                </div>

                <div class="rewards-widget__footer">
                    <button class="btn btn--sm btn--ghost" data-action="view-all" data-member-id="${memberId}">
                        <i data-lucide="maximize-2"></i>
                        View All
                    </button>
                    <button class="btn btn--sm btn--ghost" data-action="manage-rewards" data-member-id="${memberId}">
                        <i data-lucide="settings"></i>
                        Manage
                    </button>
                </div>
            </div>
        `;

        // Bind events
        bindRewardsEvents(container, memberId, rewardsData, pointsData);

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    /**
     * Bind click events for rewards
     */
    function bindRewardsEvents(container, memberId, rewardsData, pointsData) {
        // Redeem buttons
        container.querySelectorAll('[data-redeem]').forEach(btn => {
            if (!btn.disabled) {
                btn.addEventListener('click', async () => {
                    const rewardId = btn.dataset.redeem;
                    await redeemReward(memberId, rewardId, rewardsData, pointsData);
                });
            }
        });

        // Wishlist toggle buttons
        container.querySelectorAll('[data-wishlist-toggle]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const rewardId = btn.dataset.wishlistToggle;
                toggleWishlist(memberId, rewardId);
            });
        });

        // View All button - opens full page
        container.querySelector('[data-action="view-all"]')?.addEventListener('click', () => {
            showFullPage(memberId);
        });

        // Manage button
        container.querySelector('[data-action="manage-rewards"]')?.addEventListener('click', async () => {
            const verified = await PIN.verify();
            if (verified) {
                showManageRewardsModal(memberId);
            }
        });
    }

    /**
     * Toggle reward in/out of wishlist
     */
    function toggleWishlist(memberId, rewardId) {
        const rewardsData = getWidgetData(memberId);
        if (!rewardsData.wishlist) rewardsData.wishlist = [];

        const index = rewardsData.wishlist.indexOf(rewardId);
        if (index === -1) {
            rewardsData.wishlist.push(rewardId);
            Toast.success('Added to wishlist!');
        } else {
            rewardsData.wishlist.splice(index, 1);
            Toast.success('Removed from wishlist');
        }

        Storage.setWidgetData(memberId, 'rewards', rewardsData);

        // Re-render widget
        const widgetBody = document.getElementById('widget-rewards');
        if (widgetBody) {
            renderWidget(widgetBody, memberId);
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }
    }

    /**
     * Redeem a reward
     */
    async function redeemReward(memberId, rewardId, rewardsData, pointsData) {
        const reward = rewardsData.rewards.find(r => r.id === rewardId);
        if (!reward) return;

        const balance = pointsData.balance || 0;
        if (balance < reward.cost) {
            const needed = reward.cost - balance;
            Toast.error(`Need ${needed} more points for this reward!`);
            return;
        }

        // Confirm redemption
        const confirmed = await Modal.confirm(
            `Redeem "${reward.name}" for ${reward.cost} points?`,
            'Redeem Reward'
        );

        if (!confirmed) return;

        // Deduct points
        const updatedPointsData = {
            ...pointsData,
            balance: balance - reward.cost,
            history: [
                { activityId: rewardId, activityName: reward.name, date: DateUtils.today(), points: reward.cost, type: 'spent' },
                ...(pointsData.history || []).slice(0, 99)
            ]
        };
        Storage.setWidgetData(memberId, 'points', updatedPointsData);

        // Record redemption
        const updatedRewardsData = {
            ...rewardsData,
            redeemed: [
                { rewardId, rewardName: reward.name, date: DateUtils.today(), cost: reward.cost },
                ...(rewardsData.redeemed || []).slice(0, 49)
            ]
        };
        Storage.setWidgetData(memberId, 'rewards', updatedRewardsData);

        Toast.success(`🎉 Redeemed: ${reward.name}!`);

        // Re-render both widgets
        refreshWidgets(memberId);
    }

    /**
     * Refresh points and rewards widgets
     */
    function refreshWidgets(memberId) {
        // Refresh rewards widget
        const rewardsBody = document.getElementById('widget-rewards');
        if (rewardsBody) {
            renderWidget(rewardsBody, memberId);
        }

        // Refresh points widget if visible
        const pointsBody = document.getElementById('widget-points');
        if (pointsBody && typeof Points !== 'undefined') {
            Points.renderWidget(pointsBody, memberId);
        }

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
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

        const member = Storage.getMember(memberId);
        currentTab = 'rewards';
        renderFullPage(main, memberId, member, currentTab);
    }

    /**
     * Render full page with tabs
     */
    function renderFullPage(container, memberId, member, tab = 'rewards') {
        const pointsData = Storage.getWidgetData(memberId, 'points') || { balance: 0 };
        const rewardsData = getWidgetData(memberId);
        const balance = pointsData.balance || 0;
        const wishlist = rewardsData.wishlist || [];
        const history = rewardsData.redeemed || [];

        // Get age-adaptive content
        const useKidTheme = typeof KidTheme !== 'undefined';
        const ageGroup = useKidTheme ? KidTheme.getAgeGroup(member) : 'kid';
        const isYoungKid = ageGroup === 'kid' || ageGroup === 'toddler';
        const colors = useKidTheme ? KidTheme.getColors('rewards') : { gradient: 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 50%, #93C5FD 100%)' };

        // Calculate stats
        const totalRedeemed = history.length;
        const totalSpent = history.reduce((sum, h) => sum + h.cost, 0);

        // Get tab content
        const tabContent = renderTabContent(tab, memberId, member, rewardsData, pointsData);

        // Define tabs
        const tabs = [
            { id: 'rewards', label: 'Rewards', icon: 'gift', emoji: '🎁' },
            { id: 'wishlist', label: 'Wishlist', icon: 'heart', emoji: '💖', count: wishlist.length },
            { id: 'history', label: 'History', icon: 'history', emoji: '📜' }
        ];

        container.innerHTML = `
            <div class="kid-page kid-page--rewards ${useKidTheme ? KidTheme.getAgeClass(member) : ''}">
                <!-- Hero Section -->
                <div class="kid-page__hero" style="background: ${colors.gradient}; --kid-hero-text: ${colors.dark}">
                    <button class="btn btn--ghost kid-page__back" id="backToMemberBtn">
                        <i data-lucide="arrow-left"></i>
                        Back
                    </button>
                    <div class="kid-page__hero-content">
                        <h1 class="kid-page__hero-title ${isYoungKid ? 'kid-page__hero-title--playful' : ''}">
                            ${isYoungKid ? '🎁 My Rewards!' : 'My Rewards'}
                        </h1>
                    </div>
                    <div class="kid-page__hero-stats">
                        <div class="kid-hero-stat">
                            <span class="kid-hero-stat__value">${balance}</span>
                            <span class="kid-hero-stat__label">${isYoungKid ? '⭐ Points' : 'Points Available'}</span>
                        </div>
                        <div class="kid-hero-stat">
                            <span class="kid-hero-stat__value">${totalRedeemed}</span>
                            <span class="kid-hero-stat__label">${isYoungKid ? '🎉 Redeemed' : 'Total Redeemed'}</span>
                        </div>
                        <div class="kid-hero-stat">
                            <span class="kid-hero-stat__value">${totalSpent}</span>
                            <span class="kid-hero-stat__label">${isYoungKid ? '💫 Spent' : 'Points Spent'}</span>
                        </div>
                    </div>
                </div>

                <!-- Tab Navigation -->
                <div class="kid-page__tabs">
                    ${tabs.map(t => `
                        <button class="kid-page__tab ${t.id === tab ? 'kid-page__tab--active' : ''}" data-tab="${t.id}">
                            ${isYoungKid && t.emoji ? `<span class="emoji-icon">${t.emoji}</span>` : `<i data-lucide="${t.icon}"></i>`}
                            ${t.label}
                            ${t.count ? `<span class="kid-page__tab-badge">${t.count}</span>` : ''}
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

        bindFullPageEvents(container, memberId, member, rewardsData, pointsData, tab);
    }

    /**
     * Render tab content based on active tab
     */
    function renderTabContent(tab, memberId, member, rewardsData, pointsData) {
        switch (tab) {
            case 'rewards':
                return renderRewardsTab(memberId, member, rewardsData, pointsData);
            case 'wishlist':
                return renderWishlistTab(memberId, member, rewardsData, pointsData);
            case 'history':
                return renderHistoryTab(memberId, member, rewardsData);
            default:
                return renderRewardsTab(memberId, member, rewardsData, pointsData);
        }
    }

    /**
     * Render Rewards tab content
     */
    function renderRewardsTab(memberId, member, rewardsData, pointsData) {
        const balance = pointsData.balance || 0;
        const wishlist = rewardsData.wishlist || [];
        const rewards = rewardsData.rewards.filter(r => !wishlist.includes(r.id));
        const useKidTheme = typeof KidTheme !== 'undefined';
        const ageGroup = useKidTheme ? KidTheme.getAgeGroup(member) : 'kid';
        const isYoungKid = ageGroup === 'kid' || ageGroup === 'toddler';

        if (rewards.length === 0) {
            return `
                <div class="kid-page__empty ${isYoungKid ? 'kid-page__empty--playful' : ''}">
                    <div class="kid-page__empty-icon">🎁</div>
                    <p>${isYoungKid ? 'No rewards yet! Ask a parent to add some!' : 'No rewards available.'}</p>
                </div>
            `;
        }

        return `
            <div class="rewards-full-grid">
                ${rewards.map(reward => {
                    const canAfford = balance >= reward.cost;
                    return `
                        <div class="rewards-full-card ${canAfford ? 'rewards-full-card--available' : 'rewards-full-card--locked'}"
                             style="--reward-color: ${reward.color || '#3B82F6'}">
                            <button class="rewards-full-card__wishlist" data-wishlist-toggle="${reward.id}" title="Add to wishlist">
                                <i data-lucide="heart"></i>
                            </button>
                            <div class="rewards-full-card__icon" style="background-color: ${reward.color || '#3B82F6'}">
                                <i data-lucide="${reward.icon || 'gift'}"></i>
                            </div>
                            <div class="rewards-full-card__name">${reward.name}</div>
                            <div class="rewards-full-card__cost">
                                ${isYoungKid ? '⭐' : '<i data-lucide="star"></i>'}
                                ${reward.cost} ${isYoungKid ? '' : 'pts'}
                            </div>
                            <button class="btn ${canAfford ? 'btn--primary' : 'btn--ghost'} btn--sm"
                                    data-redeem="${reward.id}" ${canAfford ? '' : 'disabled'}>
                                ${canAfford
                                    ? (isYoungKid ? 'Get it! 🎉' : 'Redeem')
                                    : `Need ${reward.cost - balance}`}
                            </button>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    /**
     * Render Wishlist tab content
     */
    function renderWishlistTab(memberId, member, rewardsData, pointsData) {
        const balance = pointsData.balance || 0;
        const wishlist = rewardsData.wishlist || [];
        const wishlistRewards = rewardsData.rewards.filter(r => wishlist.includes(r.id));
        const useKidTheme = typeof KidTheme !== 'undefined';
        const ageGroup = useKidTheme ? KidTheme.getAgeGroup(member) : 'kid';
        const isYoungKid = ageGroup === 'kid' || ageGroup === 'toddler';

        if (wishlistRewards.length === 0) {
            return `
                <div class="kid-page__empty ${isYoungKid ? 'kid-page__empty--playful' : ''}">
                    <div class="kid-page__empty-icon">💖</div>
                    <p>${isYoungKid ? 'No wishlist items yet! Add some from the Rewards tab!' : 'Your wishlist is empty. Add rewards you\'re saving for!'}</p>
                </div>
            `;
        }

        return `
            <div class="rewards-wishlist-list">
                ${wishlistRewards.map(reward => {
                    const canAfford = balance >= reward.cost;
                    const progress = Math.min(100, Math.round((balance / reward.cost) * 100));
                    const pointsNeeded = Math.max(0, reward.cost - balance);

                    return `
                        <div class="rewards-wishlist-full-card" style="--reward-color: ${reward.color || '#3B82F6'}">
                            <button class="rewards-wishlist-full-card__remove" data-wishlist-toggle="${reward.id}" title="Remove from wishlist">
                                <i data-lucide="x"></i>
                            </button>
                            <div class="rewards-wishlist-full-card__icon" style="background-color: ${reward.color || '#3B82F6'}">
                                <i data-lucide="${reward.icon || 'gift'}"></i>
                            </div>
                            <div class="rewards-wishlist-full-card__content">
                                <div class="rewards-wishlist-full-card__name">${reward.name}</div>
                                <div class="rewards-wishlist-full-card__progress">
                                    <div class="rewards-wishlist-full-card__progress-bar">
                                        <div class="rewards-wishlist-full-card__progress-fill" style="width: ${progress}%; background-color: ${reward.color || '#3B82F6'}"></div>
                                    </div>
                                    <div class="rewards-wishlist-full-card__progress-text">
                                        ${canAfford
                                            ? (isYoungKid ? 'Ready! 🎉' : 'Ready to redeem!')
                                            : (isYoungKid ? `${pointsNeeded} more ⭐` : `${pointsNeeded} more points needed`)}
                                    </div>
                                </div>
                            </div>
                            <div class="rewards-wishlist-full-card__cost">
                                ${isYoungKid ? '⭐' : '<i data-lucide="star"></i>'}
                                ${reward.cost}
                            </div>
                            ${canAfford ? `
                                <button class="btn btn--primary" data-redeem="${reward.id}">
                                    ${isYoungKid ? 'Get it!' : 'Redeem'}
                                </button>
                            ` : ''}
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    /**
     * Render History tab content
     */
    function renderHistoryTab(memberId, member, rewardsData) {
        const history = rewardsData.redeemed || [];
        const rewards = rewardsData.rewards || [];
        const useKidTheme = typeof KidTheme !== 'undefined';
        const ageGroup = useKidTheme ? KidTheme.getAgeGroup(member) : 'kid';
        const isYoungKid = ageGroup === 'kid' || ageGroup === 'toddler';

        if (history.length === 0) {
            return `
                <div class="kid-page__empty ${isYoungKid ? 'kid-page__empty--playful' : ''}">
                    <div class="kid-page__empty-icon">📜</div>
                    <p>${isYoungKid ? 'No rewards redeemed yet! Keep earning points!' : 'No redemption history yet.'}</p>
                </div>
            `;
        }

        const today = typeof DateUtils !== 'undefined' ? DateUtils.today() : new Date().toISOString().split('T')[0];
        const yesterday = typeof DateUtils !== 'undefined'
            ? DateUtils.formatISO(DateUtils.addDays(new Date(), -1))
            : new Date(Date.now() - 86400000).toISOString().split('T')[0];

        const getDateLabel = (date) => {
            if (date === today) return isYoungKid ? 'Today! 🌟' : 'TODAY';
            if (date === yesterday) return isYoungKid ? 'Yesterday' : 'YESTERDAY';
            return typeof DateUtils !== 'undefined' ? DateUtils.formatShort(date).toUpperCase() : date;
        };

        // Group by date
        const groupedHistory = {};
        history.forEach(entry => {
            if (!groupedHistory[entry.date]) {
                groupedHistory[entry.date] = [];
            }
            const reward = rewards.find(r => r.id === entry.rewardId);
            groupedHistory[entry.date].push({
                ...entry,
                icon: reward?.icon || 'gift',
                color: reward?.color || '#3B82F6'
            });
        });

        const totalSpent = history.reduce((sum, h) => sum + h.cost, 0);

        return `
            <div class="rewards-history-full">
                <div class="rewards-history-full__summary">
                    <div class="rewards-history-full__stat">
                        ${isYoungKid ? '🎁' : '<i data-lucide="gift"></i>'}
                        <span>${history.length} ${isYoungKid ? 'redeemed!' : 'rewards redeemed'}</span>
                    </div>
                    <div class="rewards-history-full__stat">
                        ${isYoungKid ? '⭐' : '<i data-lucide="star"></i>'}
                        <span>${totalSpent} ${isYoungKid ? 'spent!' : 'points spent'}</span>
                    </div>
                </div>

                <div class="rewards-history-full__timeline">
                    ${Object.entries(groupedHistory).map(([date, entries]) => `
                        <div class="rewards-history-full__day">
                            <div class="rewards-history-full__day-label">${getDateLabel(date)}</div>
                            <div class="rewards-history-full__day-entries">
                                ${entries.map(entry => `
                                    <div class="rewards-history-full__entry" style="--reward-color: ${entry.color}">
                                        <div class="rewards-history-full__entry-icon" style="background-color: ${entry.color}">
                                            <i data-lucide="${entry.icon}"></i>
                                        </div>
                                        <div class="rewards-history-full__entry-info">
                                            <span class="rewards-history-full__entry-name">${entry.rewardName}</span>
                                        </div>
                                        <div class="rewards-history-full__entry-cost">
                                            ${isYoungKid ? '⭐' : '<i data-lucide="star"></i>'}
                                            -${entry.cost}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Bind full page events
     */
    function bindFullPageEvents(container, memberId, member, rewardsData, pointsData, tab) {
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

        // Wishlist toggle
        container.querySelectorAll('[data-wishlist-toggle]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const rewardId = btn.dataset.wishlistToggle;
                toggleWishlistFullPage(memberId, rewardId, container, member);
            });
        });

        // Redeem buttons
        container.querySelectorAll('[data-redeem]').forEach(btn => {
            if (!btn.disabled) {
                btn.addEventListener('click', async () => {
                    const rewardId = btn.dataset.redeem;
                    await redeemRewardFullPage(memberId, rewardId, container, member);
                });
            }
        });
    }

    /**
     * Toggle wishlist from full page
     */
    function toggleWishlistFullPage(memberId, rewardId, container, member) {
        const rewardsData = getWidgetData(memberId);
        if (!rewardsData.wishlist) rewardsData.wishlist = [];

        const index = rewardsData.wishlist.indexOf(rewardId);
        if (index === -1) {
            rewardsData.wishlist.push(rewardId);
            Toast.success('Added to wishlist!');
        } else {
            rewardsData.wishlist.splice(index, 1);
            Toast.success('Removed from wishlist');
        }

        Storage.setWidgetData(memberId, 'rewards', rewardsData);
        renderFullPage(container, memberId, member, currentTab);
    }

    /**
     * Redeem reward from full page
     */
    async function redeemRewardFullPage(memberId, rewardId, container, member) {
        const rewardsData = getWidgetData(memberId);
        const pointsData = Storage.getWidgetData(memberId, 'points') || { balance: 0 };
        const reward = rewardsData.rewards.find(r => r.id === rewardId);
        if (!reward) return;

        const balance = pointsData.balance || 0;
        if (balance < reward.cost) {
            Toast.error(`Need ${reward.cost - balance} more points!`);
            return;
        }

        const confirmed = await Modal.confirm(
            `Redeem "${reward.name}" for ${reward.cost} points?`,
            'Redeem Reward'
        );

        if (!confirmed) return;

        // Deduct points
        const updatedPointsData = {
            ...pointsData,
            balance: balance - reward.cost,
            history: [
                { activityId: rewardId, activityName: reward.name, date: DateUtils.today(), points: reward.cost, type: 'spent' },
                ...(pointsData.history || []).slice(0, 99)
            ]
        };
        Storage.setWidgetData(memberId, 'points', updatedPointsData);

        // Record redemption
        const updatedRewardsData = {
            ...rewardsData,
            redeemed: [
                { rewardId, rewardName: reward.name, date: DateUtils.today(), cost: reward.cost },
                ...(rewardsData.redeemed || []).slice(0, 49)
            ]
        };
        Storage.setWidgetData(memberId, 'rewards', updatedRewardsData);

        Toast.success(`🎉 Redeemed: ${reward.name}!`);
        renderFullPage(container, memberId, member, currentTab);
    }

    /**
     * Show redemption history - redesigned timeline format
     */
    function showRedeemedHistoryModal(memberId) {
        const rewardsData = Storage.getWidgetData(memberId, 'rewards') || { redeemed: [], rewards: [] };
        const history = rewardsData.redeemed || [];
        const rewards = rewardsData.rewards || [];

        // Group by date
        const today = DateUtils.today();
        const yesterday = DateUtils.formatISO(DateUtils.addDays(new Date(), -1));

        const getDateLabel = (date) => {
            if (date === today) return 'TODAY';
            if (date === yesterday) return 'YESTERDAY';
            return DateUtils.formatShort(date).toUpperCase();
        };

        const groupedHistory = {};
        history.forEach(entry => {
            if (!groupedHistory[entry.date]) {
                groupedHistory[entry.date] = [];
            }
            // Find reward icon
            const reward = rewards.find(r => r.id === entry.rewardId);
            groupedHistory[entry.date].push({
                ...entry,
                icon: reward?.icon || 'gift',
                color: reward?.color || '#6366F1'
            });
        });

        const totalRedeemed = history.reduce((sum, h) => sum + h.cost, 0);

        const content = history.length === 0
            ? `
                <div class="rewards-history-empty">
                    <div class="rewards-history-empty__icon">
                        <i data-lucide="gift"></i>
                    </div>
                    <h3>No Rewards Redeemed Yet</h3>
                    <p>Start earning points and redeem them for awesome rewards!</p>
                </div>
            `
            : `
                <div class="rewards-history-page">
                    <div class="rewards-history-page__stats">
                        <div class="rewards-history-stat">
                            <span class="rewards-history-stat__value">${history.length}</span>
                            <span class="rewards-history-stat__label">Rewards Redeemed</span>
                        </div>
                        <div class="rewards-history-stat">
                            <span class="rewards-history-stat__value">${totalRedeemed}</span>
                            <span class="rewards-history-stat__label">Points Spent</span>
                        </div>
                    </div>

                    <div class="rewards-history-timeline">
                        ${Object.entries(groupedHistory).slice(0, 10).map(([date, entries]) => `
                            <div class="rewards-history-day">
                                <div class="rewards-history-day__label">${getDateLabel(date)}</div>
                                <div class="rewards-history-day__entries">
                                    ${entries.map(entry => `
                                        <div class="rewards-history-entry" style="--reward-color: ${entry.color}">
                                            <div class="rewards-history-entry__icon" style="background-color: ${entry.color}">
                                                <i data-lucide="${entry.icon}"></i>
                                            </div>
                                            <div class="rewards-history-entry__info">
                                                <span class="rewards-history-entry__name">${entry.rewardName}</span>
                                            </div>
                                            <div class="rewards-history-entry__cost">
                                                <i data-lucide="star"></i>
                                                -${entry.cost}
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;

        Modal.open({
            title: 'Reward History',
            content,
            size: 'md',
            footer: '<button class="btn btn--primary" data-modal-cancel>Close</button>'
        });

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        document.querySelector('[data-modal-cancel]')?.addEventListener('click', () => {
            Modal.close();
        });
    }

    /**
     * Show manage rewards modal (admin)
     */
    function showManageRewardsModal(memberId) {
        renderManageRewardsContent(memberId);
    }

    /**
     * Generate manage rewards HTML - redesigned with icon/color picker
     */
    function generateManageRewardsHTML(memberId) {
        const rewardsData = Storage.getWidgetData(memberId, 'rewards') || { rewards: [] };
        const rewards = rewardsData.rewards || [];

        return `
            <div class="manage-rewards-v2">
                <div class="manage-rewards-v2__reset">
                    <button class="btn btn--danger btn--sm" id="resetAllRewardsBtn">
                        <i data-lucide="trash-2"></i>
                        Reset All Rewards to Defaults
                    </button>
                </div>
                <div class="manage-rewards-v2__list">
                    ${rewards.length === 0 ? `
                        <div class="manage-rewards-v2__empty">
                            <i data-lucide="gift"></i>
                            <p>No rewards yet. Add some below!</p>
                        </div>
                    ` : rewards.map(reward => `
                        <div class="manage-rewards-v2__item" data-reward-id="${reward.id}" style="--reward-color: ${reward.color || '#6366F1'}">
                            <div class="manage-rewards-v2__icon" style="background-color: ${reward.color || '#6366F1'}">
                                <i data-lucide="${reward.icon || 'gift'}"></i>
                            </div>
                            <div class="manage-rewards-v2__info">
                                <span class="manage-rewards-v2__name">${reward.name}</span>
                                <span class="manage-rewards-v2__cost">
                                    <i data-lucide="star"></i>
                                    ${reward.cost} points
                                </span>
                            </div>
                            <div class="manage-rewards-v2__actions">
                                <button class="btn btn--icon btn--ghost btn--sm" data-edit="${reward.id}" title="Edit">
                                    <i data-lucide="pencil"></i>
                                </button>
                                <button class="btn btn--icon btn--ghost btn--sm btn--danger" data-delete="${reward.id}" title="Delete">
                                    <i data-lucide="trash-2"></i>
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <div class="manage-rewards-v2__add">
                    <div class="manage-rewards-v2__add-header">
                        <i data-lucide="plus-circle"></i>
                        Add New Reward
                    </div>
                    <div class="manage-rewards-v2__add-form">
                        <div class="form-group">
                            <label class="form-label">Reward Name</label>
                            <input type="text" class="form-input" id="newRewardName" placeholder="e.g., Extra screen time">
                        </div>
                        <div class="form-row">
                            <div class="form-group" style="flex: 1;">
                                <label class="form-label">Point Cost</label>
                                <input type="number" class="form-input" id="newRewardCost" placeholder="20" value="20" min="1">
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Icon</label>
                            <div class="reward-icon-picker" id="rewardIconPicker">
                                ${REWARD_ICONS.map((icon, i) => `
                                    <button type="button" class="reward-icon-picker__btn ${i === 0 ? 'reward-icon-picker__btn--selected' : ''}" data-icon="${icon}">
                                        <i data-lucide="${icon}"></i>
                                    </button>
                                `).join('')}
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Color</label>
                            <div class="reward-color-picker" id="rewardColorPicker">
                                ${REWARD_COLORS.map((color, i) => `
                                    <button type="button" class="reward-color-picker__btn ${i === 0 ? 'reward-color-picker__btn--selected' : ''}"
                                            data-color="${color.id}" style="background-color: ${color.id}">
                                    </button>
                                `).join('')}
                            </div>
                        </div>
                        <button class="btn btn--primary btn--block" id="addRewardBtn">
                            <i data-lucide="plus"></i>
                            Add Reward
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render manage rewards modal
     */
    function renderManageRewardsContent(memberId) {
        Modal.open({
            title: 'Manage Rewards',
            content: generateManageRewardsHTML(memberId),
            footer: '<button class="btn btn--primary" data-modal-done>Done</button>'
        });

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        bindManageRewardsEvents(memberId);
    }

    /**
     * Refresh manage rewards modal in-place
     */
    function refreshManageRewardsModal(memberId) {
        const modalContent = document.getElementById('modalContent');
        if (!modalContent) return;

        modalContent.innerHTML = generateManageRewardsHTML(memberId);

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        bindManageRewardsEvents(memberId);

        // Focus on input
        document.getElementById('newRewardName')?.focus();
    }

    /**
     * Bind manage rewards events
     */
    function bindManageRewardsEvents(memberId) {
        // State for new reward
        let selectedIcon = REWARD_ICONS[0];
        let selectedColor = REWARD_COLORS[0].id;

        // Icon picker
        document.querySelectorAll('#rewardIconPicker .reward-icon-picker__btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#rewardIconPicker .reward-icon-picker__btn').forEach(b =>
                    b.classList.remove('reward-icon-picker__btn--selected'));
                btn.classList.add('reward-icon-picker__btn--selected');
                selectedIcon = btn.dataset.icon;
            });
        });

        // Color picker
        document.querySelectorAll('#rewardColorPicker .reward-color-picker__btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#rewardColorPicker .reward-color-picker__btn').forEach(b =>
                    b.classList.remove('reward-color-picker__btn--selected'));
                btn.classList.add('reward-color-picker__btn--selected');
                selectedColor = btn.dataset.color;
            });
        });

        // Add reward
        const addReward = () => {
            const name = document.getElementById('newRewardName')?.value?.trim();
            const cost = parseInt(document.getElementById('newRewardCost')?.value) || 20;

            if (!name) {
                Toast.error('Please enter a reward name');
                return;
            }

            const rewardsData = Storage.getWidgetData(memberId, 'rewards') || { rewards: [] };
            const newReward = {
                id: `rwd-${Date.now()}`,
                name,
                cost,
                icon: selectedIcon,
                color: selectedColor
            };

            const updatedData = {
                ...rewardsData,
                rewards: [...(rewardsData.rewards || []), newReward]
            };

            Storage.setWidgetData(memberId, 'rewards', updatedData);
            Toast.success('Reward added!');

            // Refresh in-place
            refreshManageRewardsModal(memberId);
        };

        document.getElementById('addRewardBtn')?.addEventListener('click', addReward);
        document.getElementById('newRewardName')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addReward();
            }
        });

        // Edit reward
        document.querySelectorAll('[data-edit]').forEach(btn => {
            btn.addEventListener('click', () => {
                const rewardId = btn.dataset.edit;
                showEditRewardModal(memberId, rewardId);
            });
        });

        // Delete reward
        document.querySelectorAll('[data-delete]').forEach(btn => {
            btn.addEventListener('click', () => {
                const rewardId = btn.dataset.delete;
                const rewardsData = Storage.getWidgetData(memberId, 'rewards') || { rewards: [] };
                const updatedData = {
                    ...rewardsData,
                    rewards: (rewardsData.rewards || []).filter(r => r.id !== rewardId)
                };
                Storage.setWidgetData(memberId, 'rewards', updatedData);
                Toast.success('Reward removed');

                // Refresh in-place
                refreshManageRewardsModal(memberId);
            });
        });

        // Reset all rewards to defaults
        document.getElementById('resetAllRewardsBtn')?.addEventListener('click', () => {
            if (confirm('This will delete ALL current rewards and reset to defaults. Are you sure?')) {
                const rewardsData = Storage.getWidgetData(memberId, 'rewards') || {};
                const defaultRewards = DEFAULT_REWARDS.map(r => ({
                    ...r,
                    id: `${r.id}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
                }));
                rewardsData.rewards = defaultRewards;
                Storage.setWidgetData(memberId, 'rewards', rewardsData);
                Toast.success('All rewards reset to defaults');

                // Refresh the widget in the background
                refreshWidgets(memberId);

                // Refresh modal in-place
                refreshManageRewardsModal(memberId);
            }
        });

        document.querySelector('[data-modal-done]')?.addEventListener('click', () => {
            Modal.close();
            refreshWidgets(memberId);
        });
    }

    /**
     * Show edit reward modal
     */
    function showEditRewardModal(memberId, rewardId) {
        const rewardsData = Storage.getWidgetData(memberId, 'rewards') || { rewards: [] };
        const reward = rewardsData.rewards.find(r => r.id === rewardId);
        if (!reward) return;

        const content = `
            <div class="edit-reward-form">
                <div class="form-group">
                    <label class="form-label">Reward Name</label>
                    <input type="text" class="form-input" id="editRewardName" value="${reward.name}">
                </div>
                <div class="form-group">
                    <label class="form-label">Point Cost</label>
                    <input type="number" class="form-input" id="editRewardCost" value="${reward.cost}" min="1">
                </div>
                <div class="form-group">
                    <label class="form-label">Icon</label>
                    <div class="reward-icon-picker" id="editIconPicker">
                        ${REWARD_ICONS.map(icon => `
                            <button type="button" class="reward-icon-picker__btn ${icon === reward.icon ? 'reward-icon-picker__btn--selected' : ''}" data-icon="${icon}">
                                <i data-lucide="${icon}"></i>
                            </button>
                        `).join('')}
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Color</label>
                    <div class="reward-color-picker" id="editColorPicker">
                        ${REWARD_COLORS.map(color => `
                            <button type="button" class="reward-color-picker__btn ${color.id === reward.color ? 'reward-color-picker__btn--selected' : ''}"
                                    data-color="${color.id}" style="background-color: ${color.id}">
                            </button>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        Modal.open({
            title: 'Edit Reward',
            content,
            footer: Modal.createFooter('Cancel', 'Save')
        });

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        let selectedIcon = reward.icon || 'gift';
        let selectedColor = reward.color || '#6366F1';

        // Icon picker
        document.querySelectorAll('#editIconPicker .reward-icon-picker__btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#editIconPicker .reward-icon-picker__btn').forEach(b =>
                    b.classList.remove('reward-icon-picker__btn--selected'));
                btn.classList.add('reward-icon-picker__btn--selected');
                selectedIcon = btn.dataset.icon;
            });
        });

        // Color picker
        document.querySelectorAll('#editColorPicker .reward-color-picker__btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#editColorPicker .reward-color-picker__btn').forEach(b =>
                    b.classList.remove('reward-color-picker__btn--selected'));
                btn.classList.add('reward-color-picker__btn--selected');
                selectedColor = btn.dataset.color;
            });
        });

        Modal.bindFooterEvents(() => {
            const name = document.getElementById('editRewardName')?.value?.trim();
            const cost = parseInt(document.getElementById('editRewardCost')?.value) || 20;

            if (!name) {
                Toast.error('Please enter a reward name');
                return false;
            }

            const rewardIndex = rewardsData.rewards.findIndex(r => r.id === rewardId);
            if (rewardIndex !== -1) {
                rewardsData.rewards[rewardIndex] = {
                    ...rewardsData.rewards[rewardIndex],
                    name,
                    cost,
                    icon: selectedIcon,
                    color: selectedColor
                };
                Storage.setWidgetData(memberId, 'rewards', rewardsData);
            }

            Toast.success('Reward updated!');
            showManageRewardsModal(memberId);
            return true;
        }, () => {
            showManageRewardsModal(memberId);
        });
    }

    function init() {
        // Initialize rewards feature
    }

    return {
        init,
        renderWidget,
        showFullPage
    };
})();
