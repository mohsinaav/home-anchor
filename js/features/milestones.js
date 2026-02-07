/**
 * Milestones Feature
 * Track developmental milestones for toddlers and kids
 * Full page view with categories, timeline, coming up, and stats
 */

const Milestones = (function() {

    // Module state
    let currentFullPageTab = 'categories';

    // Category colors for visual distinction
    const CATEGORY_COLORS = {
        physical: { color: '#10B981', bg: '#D1FAE5', icon: 'footprints', emoji: '🏃' },
        language: { color: '#6366F1', bg: '#E0E7FF', icon: 'message-circle', emoji: '💬' },
        cognitive: { color: '#F59E0B', bg: '#FEF3C7', icon: 'brain', emoji: '🧠' },
        social: { color: '#EC4899', bg: '#FCE7F3', icon: 'users', emoji: '🤝' }
    };

    // Milestone categories by age range (expanded to cover 6m-60m)
    const MILESTONE_CATEGORIES = {
        physical: {
            name: 'Physical',
            icon: 'footprints',
            items: [
                { id: 'phy-0a', name: 'Sits without support', ageRange: '6-9m' },
                { id: 'phy-0b', name: 'Crawls', ageRange: '6-10m' },
                { id: 'phy-0c', name: 'Pulls to stand', ageRange: '9-12m' },
                { id: 'phy-1', name: 'Walks independently', ageRange: '12-15m' },
                { id: 'phy-2', name: 'Runs', ageRange: '18-24m' },
                { id: 'phy-3', name: 'Climbs stairs', ageRange: '18-24m' },
                { id: 'phy-4', name: 'Kicks ball', ageRange: '18-24m' },
                { id: 'phy-5', name: 'Jumps with both feet', ageRange: '24-30m' },
                { id: 'phy-6', name: 'Pedals tricycle', ageRange: '30-36m' },
                { id: 'phy-7', name: 'Hops on one foot', ageRange: '36-48m' },
                { id: 'phy-8', name: 'Catches a bounced ball', ageRange: '36-48m' },
                { id: 'phy-9', name: 'Skips', ageRange: '48-60m' }
            ]
        },
        language: {
            name: 'Language',
            icon: 'message-circle',
            items: [
                { id: 'lan-0a', name: 'Babbles', ageRange: '6-9m' },
                { id: 'lan-0b', name: 'Responds to name', ageRange: '6-9m' },
                { id: 'lan-0c', name: 'Says mama/dada', ageRange: '9-12m' },
                { id: 'lan-1', name: 'Says first words', ageRange: '12-15m' },
                { id: 'lan-2', name: 'Knows 10+ words', ageRange: '15-18m' },
                { id: 'lan-3', name: 'Combines 2 words', ageRange: '18-24m' },
                { id: 'lan-4', name: 'Uses simple sentences', ageRange: '24-30m' },
                { id: 'lan-5', name: 'Asks questions', ageRange: '24-30m' },
                { id: 'lan-6', name: 'Tells simple stories', ageRange: '30-36m' },
                { id: 'lan-7', name: 'Uses past tense', ageRange: '36-48m' },
                { id: 'lan-8', name: 'Speaks clearly to strangers', ageRange: '48-60m' }
            ]
        },
        cognitive: {
            name: 'Cognitive',
            icon: 'brain',
            items: [
                { id: 'cog-0a', name: 'Finds hidden objects', ageRange: '6-9m' },
                { id: 'cog-0b', name: 'Explores by shaking/banging', ageRange: '9-12m' },
                { id: 'cog-1', name: 'Points to objects', ageRange: '12-15m' },
                { id: 'cog-2', name: 'Sorts shapes/colors', ageRange: '18-24m' },
                { id: 'cog-3', name: 'Completes simple puzzles', ageRange: '24-30m' },
                { id: 'cog-4', name: 'Counts to 5', ageRange: '24-30m' },
                { id: 'cog-5', name: 'Knows some letters', ageRange: '30-36m' },
                { id: 'cog-6', name: 'Understands time concepts', ageRange: '30-36m' },
                { id: 'cog-7', name: 'Counts to 10', ageRange: '36-48m' },
                { id: 'cog-8', name: 'Draws a person (3+ parts)', ageRange: '48-60m' },
                { id: 'cog-9', name: 'Prints some letters', ageRange: '48-60m' }
            ]
        },
        social: {
            name: 'Social',
            icon: 'users',
            items: [
                { id: 'soc-0a', name: 'Stranger anxiety', ageRange: '6-9m' },
                { id: 'soc-0b', name: 'Waves bye-bye', ageRange: '9-12m' },
                { id: 'soc-1', name: 'Plays alongside others', ageRange: '18-24m' },
                { id: 'soc-2', name: 'Shows empathy', ageRange: '18-24m' },
                { id: 'soc-3', name: 'Takes turns', ageRange: '24-30m' },
                { id: 'soc-4', name: 'Plays cooperatively', ageRange: '30-36m' },
                { id: 'soc-5', name: 'Has imaginary play', ageRange: '24-30m' },
                { id: 'soc-6', name: 'Shows independence', ageRange: '30-36m' },
                { id: 'soc-7', name: 'Follows rules in games', ageRange: '36-48m' },
                { id: 'soc-8', name: 'Expresses a range of emotions', ageRange: '48-60m' }
            ]
        }
    };

    // ==================== HELPER FUNCTIONS ====================

    /**
     * Get widget data with defaults
     */
    function getWidgetData(memberId) {
        return Storage.getWidgetData(memberId, 'milestones') || {
            achieved: [],
            notes: {},
            milestones: []
        };
    }

    /**
     * Get milestone name by ID (predefined or custom)
     */
    function getMilestoneName(milestoneId, widgetData) {
        // Check predefined
        for (const category of Object.values(MILESTONE_CATEGORIES)) {
            const milestone = category.items.find(m => m.id === milestoneId);
            if (milestone) return milestone.name;
        }
        // Check custom
        if (widgetData?.milestones) {
            const custom = widgetData.milestones.find(m => m.id === milestoneId);
            if (custom) return custom.name;
        }
        return 'Unknown';
    }

    /**
     * Get the category key for a milestone ID
     */
    function getMilestoneCategory(milestoneId) {
        for (const [key, category] of Object.entries(MILESTONE_CATEGORIES)) {
            if (category.items.some(m => m.id === milestoneId)) return key;
        }
        return null;
    }

    /**
     * Get total count of predefined milestones
     */
    function getTotalPredefined() {
        return Object.values(MILESTONE_CATEGORIES).reduce((sum, cat) => sum + cat.items.length, 0);
    }

    /**
     * Get all milestones (predefined + custom) normalized
     */
    function getAllMilestones(widgetData) {
        const achievedMap = {};
        (widgetData.achieved || []).forEach(a => { achievedMap[a.id] = a; });

        const results = [];

        // Predefined
        for (const [catKey, category] of Object.entries(MILESTONE_CATEGORIES)) {
            for (const item of category.items) {
                const achievement = achievedMap[item.id];
                results.push({
                    id: item.id,
                    name: item.name,
                    category: catKey,
                    categoryName: category.name,
                    ageRange: item.ageRange,
                    achieved: !!achievement,
                    date: achievement?.date || null,
                    note: achievement?.note || widgetData.notes?.[item.id] || null,
                    isCustom: false
                });
            }
        }

        // Custom milestones from settings
        (widgetData.milestones || []).forEach(m => {
            // Map settings categories to our categories
            const catMap = { motor: 'physical', 'self-care': 'social' };
            const category = catMap[m.category] || m.category || 'custom';
            results.push({
                id: m.id,
                name: m.name,
                category: category,
                categoryName: MILESTONE_CATEGORIES[category]?.name || 'Custom',
                ageRange: m.ageRange || '',
                achieved: !!m.achieved,
                date: m.achievedDate || null,
                note: m.note || null,
                isCustom: true
            });
        });

        return results;
    }

    /**
     * Get achieved milestones sorted by date (newest first)
     */
    function getAchievedMilestones(widgetData) {
        return getAllMilestones(widgetData)
            .filter(m => m.achieved)
            .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    }

    /**
     * Get per-category progress
     */
    function getCategoryProgress(widgetData) {
        const all = getAllMilestones(widgetData);
        const progress = {};

        for (const catKey of Object.keys(MILESTONE_CATEGORIES)) {
            const catMilestones = all.filter(m => m.category === catKey);
            progress[catKey] = {
                achieved: catMilestones.filter(m => m.achieved).length,
                total: catMilestones.length,
                name: MILESTONE_CATEGORIES[catKey].name
            };
        }

        // Custom category for milestones that don't map to predefined categories
        const custom = all.filter(m => m.isCustom && !MILESTONE_CATEGORIES[m.category]);
        if (custom.length > 0) {
            progress.custom = {
                achieved: custom.filter(m => m.achieved).length,
                total: custom.length,
                name: 'Custom'
            };
        }

        return progress;
    }

    /**
     * Get child's age in months - uses birthdate for accuracy if available
     */
    function getAgeInMonths(member) {
        if (!member) return null;

        // Use birthdate for accurate age calculation (preferred)
        if (member.birthdate) {
            const birth = new Date(member.birthdate);
            const today = new Date();
            const months = (today.getFullYear() - birth.getFullYear()) * 12 +
                          (today.getMonth() - birth.getMonth());
            // Adjust if we haven't reached the birth day this month
            if (today.getDate() < birth.getDate()) {
                return Math.max(0, months - 1);
            }
            return Math.max(0, months);
        }

        // Fallback to age in years
        if (member.age) {
            return parseInt(member.age) * 12;
        }

        // Guess from type
        if (member.type === 'toddler') return 24;
        return null;
    }

    /**
     * Parse age range string like "18-24m" into { min, max } in months
     */
    function parseAgeRange(ageRange) {
        if (!ageRange) return null;
        const match = ageRange.match(/(\d+)-(\d+)m?/);
        if (!match) return null;
        return { min: parseInt(match[1]), max: parseInt(match[2]) };
    }

    /**
     * Get coming-up milestones based on child's age
     */
    function getComingUpMilestones(widgetData, member) {
        const ageMonths = getAgeInMonths(member);
        if (ageMonths === null) return { current: [], pastDue: [] };

        const all = getAllMilestones(widgetData).filter(m => !m.achieved && m.ageRange);

        const current = [];
        const pastDue = [];

        all.forEach(m => {
            const range = parseAgeRange(m.ageRange);
            if (!range) return;

            // Current: milestones for their age range (± 3 month buffer)
            if (ageMonths >= range.min - 3 && ageMonths <= range.max + 6) {
                current.push(m);
            }
            // Past due: milestones they should have hit already but haven't
            else if (ageMonths > range.max + 6) {
                pastDue.push(m);
            }
        });

        // Sort by age range
        const sortByAge = (a, b) => {
            const ra = parseAgeRange(a.ageRange);
            const rb = parseAgeRange(b.ageRange);
            return (ra?.min || 0) - (rb?.min || 0);
        };
        current.sort(sortByAge);
        pastDue.sort(sortByAge);

        return { current, pastDue };
    }

    // ==================== WIDGET CARD ====================

    /**
     * Render the milestones widget for a member
     */
    function renderWidget(container, memberId) {
        const widgetData = getWidgetData(memberId);
        const progress = getCategoryProgress(widgetData);
        const all = getAllMilestones(widgetData);
        const achievedCount = all.filter(m => m.achieved).length;
        const totalCount = all.length;
        const recentAchievements = getAchievedMilestones(widgetData).slice(0, 2);

        // Coming up next
        const member = Storage.getMember(memberId);
        const comingUp = getComingUpMilestones(widgetData, member);
        const nextMilestone = comingUp.current[0];

        // Gender-based colors for widget
        const isBoy = member?.gender === 'boy';
        const progressColor = isBoy ? '#3B82F6' : '#EC4899';

        container.innerHTML = `
            <div class="milestones-widget ${isBoy ? 'milestones-widget--boy' : 'milestones-widget--girl'}">
                <div class="milestones-widget__summary">
                    <div class="milestones-progress" style="background: ${isBoy ? '#DBEAFE' : '#FCE7F3'}">
                        <div class="milestones-progress__bar" style="width: ${totalCount ? (achievedCount / totalCount) * 100 : 0}%; background: ${progressColor}"></div>
                    </div>
                    <span class="milestones-widget__count">${achievedCount} of ${totalCount} milestones</span>
                </div>

                <div class="milestones-widget__categories">
                    ${Object.entries(progress).filter(([k]) => MILESTONE_CATEGORIES[k]).map(([key, p]) => `
                        <div class="milestones-mini-cat">
                            <span class="milestones-mini-cat__emoji">${CATEGORY_COLORS[key]?.emoji || '📌'}</span>
                            <span class="milestones-mini-cat__label">${p.name}</span>
                            <span class="milestones-mini-cat__count">${p.achieved}/${p.total}</span>
                            <div class="milestones-mini-cat__bar">
                                <div class="milestones-mini-cat__fill" style="width: ${p.total ? (p.achieved / p.total) * 100 : 0}%; background: ${CATEGORY_COLORS[key]?.color || '#6B7280'}"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>

                ${nextMilestone ? `
                    <div class="milestones-widget__coming-up">
                        <span class="milestones-widget__coming-up-label">Coming up</span>
                        <span class="milestones-widget__coming-up-name">${nextMilestone.name}</span>
                        <span class="milestones-age-badge">${nextMilestone.ageRange}</span>
                    </div>
                ` : ''}

                ${recentAchievements.length > 0 ? `
                    <div class="milestones-widget__recent">
                        ${recentAchievements.map(m => `
                            <div class="milestone-recent">
                                <i data-lucide="check-circle" class="milestone-recent__icon" style="color: ${progressColor}"></i>
                                <span class="milestone-recent__name">${m.name}</span>
                                <span class="milestone-recent__date">${DateUtils.formatShort(m.date)}</span>
                            </div>
                        `).join('')}
                    </div>
                ` : `
                    <p class="milestones-widget__empty">Start tracking developmental milestones!</p>
                `}

                <div class="milestones-widget__footer">
                    <button class="btn btn--sm" data-action="view-all" data-member-id="${memberId}" style="background: ${progressColor}; color: white;">
                        <i data-lucide="maximize-2"></i>
                        View All
                    </button>
                </div>
            </div>
        `;

        container.querySelector('[data-action="view-all"]')?.addEventListener('click', () => {
            showFullPage(memberId);
        });
    }

    // ==================== FULL PAGE VIEW ====================

    /**
     * Show the full page view
     */
    function showFullPage(memberId, activeTab) {
        const main = document.getElementById('mainContent');
        if (!main) return;

        const member = Storage.getMember(memberId);
        if (activeTab) currentFullPageTab = activeTab;
        renderFullPage(main, memberId, member, currentFullPageTab);
    }

    /**
     * Render the full page view with hero, tabs, and content
     */
    function renderFullPage(container, memberId, member, activeTab) {
        const widgetData = getWidgetData(memberId);

        // Gender-based colors: blue for boys, pink for girls (default) - Vibrant!
        const isBoy = member?.gender === 'boy';
        const colors = isBoy
            ? { primary: '#3B82F6', gradient: 'linear-gradient(135deg, #60A5FA 0%, #3B82F6 40%, #2563EB 100%)', light: '#DBEAFE', dark: '#1E3A8A', emoji: '🌟' }
            : { primary: '#EC4899', gradient: 'linear-gradient(135deg, #F472B6 0%, #EC4899 40%, #DB2777 100%)', light: '#FCE7F3', dark: '#831843', emoji: '🌟' };
        const ageClass = (typeof KidTheme !== 'undefined' && KidTheme.getAgeClass) ?
            KidTheme.getAgeClass(member) : '';

        const all = getAllMilestones(widgetData);
        const achievedCount = all.filter(m => m.achieved).length;
        const totalCount = all.length;
        const progress = getCategoryProgress(widgetData);
        const categoriesComplete = Object.values(progress).filter(p => p.achieved === p.total && p.total > 0).length;
        const latestAchievement = getAchievedMilestones(widgetData)[0];

        const tabs = [
            { id: 'categories', label: 'Categories', emoji: '📋' },
            { id: 'coming-up', label: 'Coming Up', emoji: '🎯' },
            { id: 'timeline', label: 'Timeline', emoji: '📅' },
            { id: 'stats', label: 'Stats', emoji: '📊' }
        ];

        let tabContent = '';
        switch (activeTab) {
            case 'coming-up':
                tabContent = renderComingUpTab(widgetData, member);
                break;
            case 'timeline':
                tabContent = renderTimelineTab(widgetData);
                break;
            case 'stats':
                tabContent = renderStatsTab(widgetData, member);
                break;
            default:
                tabContent = renderCategoriesTab(widgetData, memberId);
        }

        container.innerHTML = `
            <div class="kid-page kid-page--milestones ${ageClass}">
                <div class="kid-page__hero" style="background: ${colors.gradient}; --kid-hero-text: ${colors.dark}">
                    <button class="btn btn--ghost kid-page__back" data-action="back">
                        <i data-lucide="arrow-left"></i> Back
                    </button>
                    <button class="btn btn--sm btn--ghost" data-action="add-custom" title="Add Custom Milestone" style="position: absolute; top: 12px; right: 12px;">
                        <i data-lucide="plus-circle"></i> Add Custom
                    </button>

                    <div class="kid-page__hero-content">
                        <h1 class="kid-page__hero-title kid-page__hero-title--playful">${colors.emoji} ${member?.name || 'Child'}'s Milestones</h1>
                        <div class="kid-page__hero-stats">
                            <div class="kid-hero-stat">
                                <span class="kid-hero-stat__value">${achievedCount}/${totalCount}</span>
                                <span class="kid-hero-stat__label">🏆 Achieved</span>
                            </div>
                            <div class="kid-hero-stat">
                                <span class="kid-hero-stat__value">${categoriesComplete}/${Object.keys(progress).length}</span>
                                <span class="kid-hero-stat__label">✅ Complete</span>
                            </div>
                            <div class="kid-hero-stat">
                                <span class="kid-hero-stat__value">${latestAchievement ? latestAchievement.name.substring(0, 12) + (latestAchievement.name.length > 12 ? '…' : '') : '-'}</span>
                                <span class="kid-hero-stat__label">🌟 Latest</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="kid-page__tabs" style="--tab-color: ${colors.primary}">
                    ${tabs.map(tab => `
                        <button class="kid-page__tab ${activeTab === tab.id ? 'kid-page__tab--active' : ''}"
                                data-tab="${tab.id}">
                            <span class="kid-page__tab-emoji">${tab.emoji}</span>
                            <span class="kid-page__tab-label">${tab.label}</span>
                        </button>
                    `).join('')}
                </div>

                <div class="kid-page__content">
                    ${tabContent}
                </div>
            </div>
        `;

        if (typeof lucide !== 'undefined') lucide.createIcons();
        bindFullPageEvents(container, memberId, member, widgetData, activeTab);
    }

    // ==================== TAB CONTENT ====================

    /**
     * Render Categories tab - milestone categories with progress and checkboxes
     */
    function renderCategoriesTab(widgetData, memberId) {
        const all = getAllMilestones(widgetData);
        const achievedIds = new Set(all.filter(m => m.achieved).map(m => m.id));

        let html = '<div class="milestones-categories">';

        let categoryIndex = 0;
        for (const [catKey, category] of Object.entries(MILESTONE_CATEGORIES)) {
            const catColor = CATEGORY_COLORS[catKey];
            const catMilestones = all.filter(m => m.category === catKey);
            const catAchieved = catMilestones.filter(m => m.achieved).length;
            const catTotal = catMilestones.length;
            const pct = catTotal ? Math.round((catAchieved / catTotal) * 100) : 0;

            // Collapse all categories except the first one
            const isCollapsed = categoryIndex > 0;
            categoryIndex++;

            html += `
                <div class="milestones-category-card${isCollapsed ? ' milestones-category-card--collapsed' : ''}" data-category="${catKey}">
                    <button class="milestones-category-card__header" data-toggle-category="${catKey}">
                        <div class="milestones-category-card__info">
                            <span class="milestones-category-card__emoji">${catColor.emoji}</span>
                            <span class="milestones-category-card__name">${category.name}</span>
                            <span class="milestones-category-card__count">${catAchieved}/${catTotal}</span>
                        </div>
                        <div class="milestones-category-card__progress-bar">
                            <div class="milestones-category-card__progress-fill" style="width: ${pct}%; background: ${catColor.color}"></div>
                        </div>
                        <i data-lucide="chevron-down" class="milestones-category-card__chevron"></i>
                    </button>
                    <div class="milestones-category-card__body" data-category-body="${catKey}">
                        ${catMilestones.map(m => {
                            const isAchieved = m.achieved;
                            return `
                                <div class="milestones-item ${isAchieved ? 'milestones-item--achieved' : ''}"
                                     data-milestone-id="${m.id}">
                                    <button class="milestones-item__check" data-toggle-milestone="${m.id}"
                                            style="border-color: ${catColor.color}; ${isAchieved ? `background: ${catColor.color}` : ''}">
                                        ${isAchieved ? '<i data-lucide="check" style="color: white; width: 14px; height: 14px;"></i>' : ''}
                                    </button>
                                    <div class="milestones-item__info">
                                        <span class="milestones-item__name">${m.name}</span>
                                        <div class="milestones-item__meta">
                                            ${m.ageRange ? `<span class="milestones-age-badge">${m.ageRange}</span>` : ''}
                                            ${m.isCustom ? '<span class="milestones-custom-badge">Custom</span>' : ''}
                                            ${isAchieved && m.date ? `<span class="milestones-item__date">${DateUtils.formatShort(m.date)}</span>` : ''}
                                            ${m.note ? '<i data-lucide="file-text" class="milestones-item__note-icon" title="Has note"></i>' : ''}
                                        </div>
                                    </div>
                                    ${m.isCustom ? `
                                        <button class="milestones-item__delete" data-delete-custom="${m.id}" title="Delete">
                                            <i data-lucide="trash-2"></i>
                                        </button>
                                    ` : ''}
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }

        // Custom milestones that don't fit predefined categories
        const customOther = all.filter(m => m.isCustom && !MILESTONE_CATEGORIES[m.category]);
        if (customOther.length > 0) {
            html += `
                <div class="milestones-category-card milestones-category-card--collapsed" data-category="custom">
                    <button class="milestones-category-card__header" data-toggle-category="custom">
                        <div class="milestones-category-card__info">
                            <span class="milestones-category-card__emoji">📌</span>
                            <span class="milestones-category-card__name">Custom</span>
                            <span class="milestones-category-card__count">${customOther.filter(m => m.achieved).length}/${customOther.length}</span>
                        </div>
                        <i data-lucide="chevron-down" class="milestones-category-card__chevron"></i>
                    </button>
                    <div class="milestones-category-card__body" data-category-body="custom">
                        ${customOther.map(m => `
                            <div class="milestones-item ${m.achieved ? 'milestones-item--achieved' : ''}"
                                 data-milestone-id="${m.id}">
                                <button class="milestones-item__check" data-toggle-milestone="${m.id}"
                                        style="border-color: #6B7280; ${m.achieved ? 'background: #6B7280' : ''}">
                                    ${m.achieved ? '<i data-lucide="check" style="color: white; width: 14px; height: 14px;"></i>' : ''}
                                </button>
                                <div class="milestones-item__info">
                                    <span class="milestones-item__name">${m.name}</span>
                                    <div class="milestones-item__meta">
                                        <span class="milestones-custom-badge">Custom</span>
                                        ${m.achieved && m.date ? `<span class="milestones-item__date">${DateUtils.formatShort(m.date)}</span>` : ''}
                                    </div>
                                </div>
                                <button class="milestones-item__delete" data-delete-custom="${m.id}" title="Delete">
                                    <i data-lucide="trash-2"></i>
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        html += '</div>';
        return html;
    }

    /**
     * Render Coming Up tab - age-appropriate milestones
     */
    function renderComingUpTab(widgetData, member) {
        const ageMonths = getAgeInMonths(member);

        if (ageMonths === null) {
            return `
                <div class="milestones-empty-state">
                    <div class="milestones-empty-state__icon">🎯</div>
                    <h3>Set Age to See Recommendations</h3>
                    <p>Add your child's age in Settings to see age-appropriate milestone recommendations.</p>
                </div>
            `;
        }

        const { current, pastDue } = getComingUpMilestones(widgetData, member);
        const ageYears = Math.floor(ageMonths / 12);
        const ageRemMonths = ageMonths % 12;
        const ageStr = ageRemMonths > 0 ? `${ageYears}y ${ageRemMonths}m` : `${ageYears}y`;

        let html = `<div class="milestones-coming-up">`;

        html += `
            <div class="milestones-coming-up__age-banner">
                <span class="milestones-coming-up__age-label">Age</span>
                <span class="milestones-coming-up__age-value">${ageStr} (${ageMonths} months)</span>
            </div>
        `;

        if (current.length === 0 && pastDue.length === 0) {
            html += `
                <div class="milestones-empty-state">
                    <div class="milestones-empty-state__icon">🎉</div>
                    <h3>All Caught Up!</h3>
                    <p>All age-appropriate milestones have been achieved. Great progress!</p>
                </div>
            `;
        }

        if (current.length > 0) {
            html += `
                <div class="milestones-coming-up__section">
                    <h3 class="milestones-section-title">🎯 Expected Now</h3>
                    <p class="milestones-section-hint">Milestones typical for this age range</p>
                    <div class="milestones-coming-up__list">
                        ${current.map(m => {
                            const catColor = CATEGORY_COLORS[m.category] || { emoji: '📌', color: '#6B7280', bg: '#F3F4F6' };
                            return `
                                <div class="milestones-coming-up-card" style="border-left: 3px solid ${catColor.color}">
                                    <div class="milestones-coming-up-card__content">
                                        <div class="milestones-coming-up-card__top">
                                            <span class="milestones-coming-up-card__name">${m.name}</span>
                                            <span class="milestones-age-badge">${m.ageRange}</span>
                                        </div>
                                        <div class="milestones-coming-up-card__bottom">
                                            <span class="milestones-coming-up-card__category" style="color: ${catColor.color}">${catColor.emoji} ${m.categoryName}</span>
                                        </div>
                                    </div>
                                    <button class="btn btn--sm btn--primary milestones-coming-up-card__action" data-achieve-milestone="${m.id}">
                                        <i data-lucide="check"></i> Done!
                                    </button>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }

        if (pastDue.length > 0) {
            html += `
                <div class="milestones-coming-up__section">
                    <h3 class="milestones-section-title">📋 Already Mastered?</h3>
                    <p class="milestones-section-hint">Earlier milestones not yet marked - have these been achieved?</p>
                    <div class="milestones-coming-up__list">
                        ${pastDue.map(m => {
                            const catColor = CATEGORY_COLORS[m.category] || { emoji: '📌', color: '#6B7280', bg: '#F3F4F6' };
                            return `
                                <div class="milestones-coming-up-card milestones-coming-up-card--past" style="border-left: 3px solid ${catColor.color}">
                                    <div class="milestones-coming-up-card__content">
                                        <div class="milestones-coming-up-card__top">
                                            <span class="milestones-coming-up-card__name">${m.name}</span>
                                            <span class="milestones-age-badge">${m.ageRange}</span>
                                        </div>
                                        <div class="milestones-coming-up-card__bottom">
                                            <span class="milestones-coming-up-card__category" style="color: ${catColor.color}">${catColor.emoji} ${m.categoryName}</span>
                                        </div>
                                    </div>
                                    <button class="btn btn--sm btn--outline milestones-coming-up-card__action" data-achieve-milestone="${m.id}">
                                        <i data-lucide="check"></i> Yes!
                                    </button>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }

        html += '</div>';
        return html;
    }

    /**
     * Render Timeline tab - chronological view of achievements
     */
    function renderTimelineTab(widgetData) {
        const achieved = getAchievedMilestones(widgetData);

        if (achieved.length === 0) {
            return `
                <div class="milestones-empty-state">
                    <div class="milestones-empty-state__icon">📅</div>
                    <h3>No Milestones Yet</h3>
                    <p>Achieved milestones will appear here in chronological order.</p>
                </div>
            `;
        }

        // Group by month/year
        const groups = {};
        achieved.forEach(m => {
            const date = m.date || 'Unknown';
            let groupKey = 'Unknown Date';
            if (date !== 'Unknown') {
                const d = new Date(date + 'T00:00:00');
                const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'];
                groupKey = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
            }
            if (!groups[groupKey]) groups[groupKey] = [];
            groups[groupKey].push(m);
        });

        let html = '<div class="milestones-timeline">';

        for (const [group, milestones] of Object.entries(groups)) {
            html += `
                <div class="milestones-timeline__group">
                    <div class="milestones-timeline__month">${group}</div>
                    ${milestones.map(m => {
                        const catColor = CATEGORY_COLORS[m.category] || { emoji: '📌', color: '#6B7280' };
                        return `
                            <div class="milestones-timeline-entry" data-milestone-id="${m.id}">
                                <div class="milestones-timeline-entry__dot" style="background: ${catColor.color}"></div>
                                <div class="milestones-timeline-entry__content">
                                    <div class="milestones-timeline-entry__top">
                                        <span class="milestones-timeline-entry__name">${m.name}</span>
                                        <span class="milestones-timeline-entry__date">${m.date ? DateUtils.formatShort(m.date) : ''}</span>
                                    </div>
                                    <div class="milestones-timeline-entry__bottom">
                                        <span class="milestones-timeline-entry__category" style="color: ${catColor.color}">${catColor.emoji} ${m.categoryName}</span>
                                        ${m.note ? `<span class="milestones-timeline-entry__note">${m.note.substring(0, 60)}${m.note.length > 60 ? '...' : ''}</span>` : ''}
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        }

        html += '</div>';
        return html;
    }

    /**
     * Render Stats tab - progress statistics
     */
    function renderStatsTab(widgetData, member) {
        const all = getAllMilestones(widgetData);
        const achieved = all.filter(m => m.achieved);
        const progress = getCategoryProgress(widgetData);
        const totalPct = all.length ? Math.round((achieved.length / all.length) * 100) : 0;

        // Date stats
        const dates = achieved.filter(m => m.date).map(m => m.date).sort();
        const firstDate = dates[0] || null;
        const latestDate = dates[dates.length - 1] || null;

        // Predefined vs custom counts
        const predefinedCount = achieved.filter(m => !m.isCustom).length;
        const customCount = achieved.filter(m => m.isCustom).length;

        // Milestones per month
        const monthCounts = {};
        achieved.forEach(m => {
            if (!m.date) return;
            const key = m.date.substring(0, 7); // YYYY-MM
            monthCounts[key] = (monthCounts[key] || 0) + 1;
        });

        let html = '<div class="milestones-stats">';

        // Overall progress
        html += `
            <div class="milestones-stats__overview">
                <div class="milestones-stats__circle">
                    <svg viewBox="0 0 80 80" class="milestones-stats__ring">
                        <circle cx="40" cy="40" r="35" fill="none" stroke="#F3F4F6" stroke-width="6"/>
                        <circle cx="40" cy="40" r="35" fill="none" stroke="#EC4899" stroke-width="6"
                                stroke-dasharray="${2 * Math.PI * 35}"
                                stroke-dashoffset="${2 * Math.PI * 35 * (1 - totalPct / 100)}"
                                stroke-linecap="round" transform="rotate(-90 40 40)"/>
                    </svg>
                    <span class="milestones-stats__pct">${totalPct}%</span>
                </div>
                <div class="milestones-stats__overview-text">
                    <span class="milestones-stats__big">${achieved.length} achieved</span>
                    <span class="milestones-stats__small">out of ${all.length} total milestones</span>
                </div>
            </div>
        `;

        // Per-category progress bars
        html += '<h3 class="milestones-section-title">Category Progress</h3>';
        html += '<div class="milestones-stats__categories">';
        for (const [catKey, p] of Object.entries(progress)) {
            const catColor = CATEGORY_COLORS[catKey] || { emoji: '📌', color: '#6B7280' };
            const pct = p.total ? Math.round((p.achieved / p.total) * 100) : 0;
            html += `
                <div class="milestones-stats__cat-row">
                    <div class="milestones-stats__cat-label">
                        <span>${catColor.emoji} ${p.name}</span>
                        <span>${p.achieved}/${p.total}</span>
                    </div>
                    <div class="milestones-stats__cat-bar">
                        <div class="milestones-stats__cat-fill" style="width: ${pct}%; background: ${catColor.color}"></div>
                    </div>
                </div>
            `;
        }
        html += '</div>';

        // Stats grid
        html += '<div class="milestones-stats-grid">';
        html += `
            <div class="milestones-stat-card">
                <div class="milestones-stat-card__value">${predefinedCount}</div>
                <div class="milestones-stat-card__label">Predefined</div>
            </div>
            <div class="milestones-stat-card">
                <div class="milestones-stat-card__value">${customCount}</div>
                <div class="milestones-stat-card__label">Custom</div>
            </div>
            <div class="milestones-stat-card">
                <div class="milestones-stat-card__value">${firstDate ? DateUtils.formatShort(firstDate) : '-'}</div>
                <div class="milestones-stat-card__label">First Recorded</div>
            </div>
            <div class="milestones-stat-card">
                <div class="milestones-stat-card__value">${latestDate ? DateUtils.formatShort(latestDate) : '-'}</div>
                <div class="milestones-stat-card__label">Latest</div>
            </div>
        `;
        html += '</div>';

        // Monthly activity
        const monthKeys = Object.keys(monthCounts).sort().reverse().slice(0, 6);
        if (monthKeys.length > 0) {
            html += '<h3 class="milestones-section-title">Monthly Activity</h3>';
            html += '<div class="milestones-stats__monthly">';
            const maxCount = Math.max(...Object.values(monthCounts), 1);
            monthKeys.reverse().forEach(key => {
                const count = monthCounts[key];
                const barPct = (count / maxCount) * 100;
                const [year, month] = key.split('-');
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const label = `${monthNames[parseInt(month) - 1]} '${year.substring(2)}`;
                html += `
                    <div class="milestones-stats__month-bar">
                        <div class="milestones-stats__month-fill" style="height: ${barPct}%"></div>
                        <span class="milestones-stats__month-count">${count}</span>
                        <span class="milestones-stats__month-label">${label}</span>
                    </div>
                `;
            });
            html += '</div>';
        }

        html += '</div>';
        return html;
    }

    // ==================== MODALS ====================

    /**
     * Show achievement note modal when marking a milestone
     */
    function showAchievementModal(memberId, milestoneId, milestoneName, callback) {
        const today = typeof DateUtils !== 'undefined' ? DateUtils.today() : new Date().toISOString().split('T')[0];

        const content = `
            <div class="milestone-achieve-form">
                <p class="milestone-achieve-form__congrats">Congratulations! 🎉</p>
                <div class="form-group">
                    <label class="form-label">Date Achieved</label>
                    <input type="date" class="form-input" id="milestoneAchieveDate" value="${today}">
                </div>
                <div class="form-group">
                    <label class="form-label">Note (optional)</label>
                    <textarea class="form-input" id="milestoneAchieveNote" rows="3"
                              placeholder="Add a memory or note about this milestone..."></textarea>
                </div>
            </div>
        `;

        Modal.open({
            title: `${milestoneName}`,
            content,
            buttons: [
                {
                    text: 'Skip',
                    onClick: (close) => {
                        close();
                        callback(today, '');
                    }
                },
                {
                    text: 'Save',
                    variant: 'primary',
                    onClick: (close) => {
                        const date = document.querySelector('#milestoneAchieveDate')?.value || today;
                        const note = document.querySelector('#milestoneAchieveNote')?.value?.trim() || '';
                        close();
                        callback(date, note);
                    }
                }
            ]
        });
    }

    /**
     * Show add custom milestone modal
     */
    function showAddCustomModal(memberId, callback) {
        const today = typeof DateUtils !== 'undefined' ? DateUtils.today() : new Date().toISOString().split('T')[0];

        const content = `
            <form id="addCustomMilestoneForm">
                <div class="form-group">
                    <label class="form-label">Milestone Name</label>
                    <input type="text" class="form-input" id="customMilestoneName" placeholder="e.g., First steps" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Category</label>
                    <select class="form-input" id="customMilestoneCategory">
                        <option value="physical">Physical</option>
                        <option value="language">Language</option>
                        <option value="cognitive">Cognitive</option>
                        <option value="social">Social</option>
                        <option value="custom">Other</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Age Range (optional)</label>
                    <input type="text" class="form-input" id="customMilestoneAge" placeholder="e.g., 18-24m">
                </div>
                <div class="form-group">
                    <label class="form-label" style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                        <input type="checkbox" id="customMilestoneAchieved"> Already achieved
                    </label>
                </div>
                <div class="form-group" id="customMilestoneDateGroup" style="display: none;">
                    <label class="form-label">Date Achieved</label>
                    <input type="date" class="form-input" id="customMilestoneDate" value="${today}">
                </div>
            </form>
        `;

        Modal.open({
            title: 'Add Custom Milestone',
            content,
            buttons: [
                { text: 'Cancel', onClick: (close) => close() },
                {
                    text: 'Add Milestone',
                    variant: 'primary',
                    onClick: (close) => {
                        const name = document.querySelector('#customMilestoneName')?.value?.trim();
                        const category = document.querySelector('#customMilestoneCategory')?.value || 'custom';
                        const ageRange = document.querySelector('#customMilestoneAge')?.value?.trim() || '';
                        const achieved = document.querySelector('#customMilestoneAchieved')?.checked || false;
                        const achievedDate = document.querySelector('#customMilestoneDate')?.value || today;

                        if (!name) {
                            Toast.error('Please enter a milestone name');
                            return;
                        }

                        const widgetData = getWidgetData(memberId);
                        widgetData.milestones = widgetData.milestones || [];
                        widgetData.milestones.push({
                            id: `milestone-${Date.now()}`,
                            name,
                            category,
                            ageRange,
                            achieved,
                            achievedDate: achieved ? achievedDate : null
                        });
                        Storage.setWidgetData(memberId, 'milestones', widgetData);
                        Toast.success('Custom milestone added');
                        close();
                        if (callback) callback();
                    }
                }
            ]
        });

        // Toggle date field visibility based on checkbox
        setTimeout(() => {
            const checkbox = document.querySelector('#customMilestoneAchieved');
            const dateGroup = document.querySelector('#customMilestoneDateGroup');
            if (checkbox && dateGroup) {
                checkbox.addEventListener('change', () => {
                    dateGroup.style.display = checkbox.checked ? 'block' : 'none';
                });
            }
        }, 100);
    }

    // ==================== EVENT BINDING ====================

    /**
     * Bind full page events
     */
    function bindFullPageEvents(container, memberId, member, widgetData, activeTab) {
        // Back button
        container.querySelector('[data-action="back"]')?.addEventListener('click', () => {
            currentFullPageTab = 'categories';
            if (typeof State !== 'undefined') {
                State.emit('tabChanged', memberId);
            }
        });

        // Tab switching
        container.querySelectorAll('[data-tab]').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                currentFullPageTab = tab;
                renderFullPage(container, memberId, member, tab);
            });
        });

        // Add custom button
        container.querySelector('[data-action="add-custom"]')?.addEventListener('click', () => {
            showAddCustomModal(memberId, () => {
                renderFullPage(container, memberId, member, currentFullPageTab);
            });
        });

        // Tab-specific events
        switch (activeTab) {
            case 'categories':
                bindCategoriesTabEvents(container, memberId, member);
                break;
            case 'coming-up':
                bindComingUpTabEvents(container, memberId, member);
                break;
            case 'timeline':
                bindTimelineTabEvents(container, memberId, member);
                break;
        }
    }

    /**
     * Bind categories tab events
     */
    function bindCategoriesTabEvents(container, memberId, member) {
        // Category expand/collapse
        container.querySelectorAll('[data-toggle-category]').forEach(btn => {
            btn.addEventListener('click', () => {
                const catKey = btn.dataset.toggleCategory;
                const body = container.querySelector(`[data-category-body="${catKey}"]`);
                const card = btn.closest('.milestones-category-card');
                if (body && card) {
                    card.classList.toggle('milestones-category-card--collapsed');
                }
            });
        });

        // Toggle milestone checkboxes
        container.querySelectorAll('[data-toggle-milestone]').forEach(btn => {
            btn.addEventListener('click', () => {
                const milestoneId = btn.dataset.toggleMilestone;
                const widgetData = getWidgetData(memberId);
                const name = getMilestoneName(milestoneId, widgetData);

                // Check if it's a custom milestone
                const customMilestone = widgetData.milestones?.find(m => m.id === milestoneId);

                if (customMilestone) {
                    // Custom milestone toggle
                    if (customMilestone.achieved) {
                        customMilestone.achieved = false;
                        customMilestone.achievedDate = null;
                        customMilestone.note = null;
                        Storage.setWidgetData(memberId, 'milestones', widgetData);
                        renderFullPage(container, memberId, member, currentFullPageTab);
                    } else {
                        showAchievementModal(memberId, milestoneId, name, (date, note) => {
                            const freshData = getWidgetData(memberId);
                            const cm = freshData.milestones?.find(m => m.id === milestoneId);
                            if (cm) {
                                cm.achieved = true;
                                cm.achievedDate = date;
                                if (note) cm.note = note;
                                Storage.setWidgetData(memberId, 'milestones', freshData);

                                // Log to Activity Monitor
                                Storage.logActivityEvent({
                                    memberId: memberId,
                                    widgetId: 'milestones',
                                    action: 'achieved',
                                    details: `Achieved milestone "${name}"`,
                                    meta: { milestoneId, milestoneName: name, date, isCustom: true }
                                });

                                Toast.success(`Milestone achieved: ${name}!`);
                            }
                            renderFullPage(container, memberId, member, currentFullPageTab);
                        });
                    }
                } else {
                    // Predefined milestone toggle
                    const achieved = widgetData.achieved || [];
                    const isAchieved = achieved.some(m => m.id === milestoneId);

                    if (isAchieved) {
                        widgetData.achieved = achieved.filter(m => m.id !== milestoneId);
                        Storage.setWidgetData(memberId, 'milestones', widgetData);
                        renderFullPage(container, memberId, member, currentFullPageTab);
                    } else {
                        showAchievementModal(memberId, milestoneId, name, (date, note) => {
                            const freshData = getWidgetData(memberId);
                            freshData.achieved = freshData.achieved || [];
                            const entry = { id: milestoneId, date };
                            if (note) entry.note = note;
                            freshData.achieved = [entry, ...freshData.achieved];
                            Storage.setWidgetData(memberId, 'milestones', freshData);

                            // Log to Activity Monitor
                            Storage.logActivityEvent({
                                memberId: memberId,
                                widgetId: 'milestones',
                                action: 'achieved',
                                details: `Achieved milestone "${name}"`,
                                meta: { milestoneId, milestoneName: name, date, isCustom: false }
                            });

                            Toast.success(`Milestone achieved: ${name}!`);
                            renderFullPage(container, memberId, member, currentFullPageTab);
                        });
                    }
                }
            });
        });

        // Delete custom milestone
        container.querySelectorAll('[data-delete-custom]').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const milestoneId = btn.dataset.deleteCustom;
                const confirmed = await Modal.confirm('Delete this custom milestone?', 'Delete Milestone');
                if (confirmed) {
                    const widgetData = getWidgetData(memberId);
                    widgetData.milestones = (widgetData.milestones || []).filter(m => m.id !== milestoneId);
                    Storage.setWidgetData(memberId, 'milestones', widgetData);
                    Toast.success('Milestone deleted');
                    renderFullPage(container, memberId, member, currentFullPageTab);
                }
            });
        });
    }

    /**
     * Bind coming-up tab events
     */
    function bindComingUpTabEvents(container, memberId, member) {
        container.querySelectorAll('[data-achieve-milestone]').forEach(btn => {
            btn.addEventListener('click', () => {
                const milestoneId = btn.dataset.achieveMilestone;
                const widgetData = getWidgetData(memberId);
                const name = getMilestoneName(milestoneId, widgetData);

                showAchievementModal(memberId, milestoneId, name, (date, note) => {
                    const freshData = getWidgetData(memberId);
                    // Check if custom
                    const customMilestone = freshData.milestones?.find(m => m.id === milestoneId);
                    if (customMilestone) {
                        customMilestone.achieved = true;
                        customMilestone.achievedDate = date;
                        if (note) customMilestone.note = note;
                    } else {
                        freshData.achieved = freshData.achieved || [];
                        const entry = { id: milestoneId, date };
                        if (note) entry.note = note;
                        freshData.achieved = [entry, ...freshData.achieved];
                    }
                    Storage.setWidgetData(memberId, 'milestones', freshData);
                    Toast.success(`Milestone achieved: ${name}!`);
                    renderFullPage(container, memberId, member, currentFullPageTab);
                });
            });
        });
    }

    /**
     * Bind timeline tab events
     */
    function bindTimelineTabEvents(container, memberId, member) {
        container.querySelectorAll('.milestones-timeline-entry').forEach(entry => {
            entry.addEventListener('click', () => {
                const milestoneId = entry.dataset.milestoneId;
                const widgetData = getWidgetData(memberId);
                const all = getAllMilestones(widgetData);
                const milestone = all.find(m => m.id === milestoneId);
                if (milestone?.note) {
                    Modal.open({
                        title: milestone.name,
                        content: `
                            <div class="milestone-note-view">
                                <p class="milestone-note-view__date">${milestone.date ? DateUtils.formatShort(milestone.date) : ''}</p>
                                <p class="milestone-note-view__text">${milestone.note}</p>
                            </div>
                        `,
                        buttons: [{ text: 'Close', onClick: (close) => close() }]
                    });
                }
            });
        });
    }

    // ==================== LEGACY MODAL (kept for backward compat) ====================

    /**
     * Show all milestones modal (legacy - kept for backward compatibility)
     */
    function showAllMilestonesModal(memberId, widgetData) {
        const achievedIds = widgetData.achieved?.map(m => m.id) || [];

        const content = `
            <div class="all-milestones">
                ${Object.entries(MILESTONE_CATEGORIES).map(([key, category]) => `
                    <div class="all-milestones__category">
                        <h4 class="all-milestones__title">
                            <i data-lucide="${category.icon}"></i>
                            ${category.name}
                        </h4>
                        <div class="all-milestones__list">
                            ${category.items.map(milestone => {
                                const isAchieved = achievedIds.includes(milestone.id);
                                return `
                                    <div class="milestone-item ${isAchieved ? 'milestone-item--achieved' : ''}"
                                         data-milestone-id="${milestone.id}">
                                        <button class="milestone-item__checkbox" data-toggle="${milestone.id}">
                                            ${isAchieved ? '<i data-lucide="check"></i>' : ''}
                                        </button>
                                        <div class="milestone-item__content">
                                            <span class="milestone-item__name">${milestone.name}</span>
                                            <span class="milestone-item__age">${milestone.ageRange}</span>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        Modal.open({
            title: 'Developmental Milestones',
            content,
            footer: '<button class="btn btn--primary" data-modal-cancel>Done</button>'
        });

        if (typeof lucide !== 'undefined') lucide.createIcons();

        document.querySelectorAll('[data-toggle]').forEach(btn => {
            btn.addEventListener('click', () => {
                const milestoneId = btn.dataset.toggle;
                toggleMilestone(memberId, milestoneId);
            });
        });

        document.querySelector('[data-modal-cancel]')?.addEventListener('click', () => {
            Modal.close();
            const widgetBody = document.getElementById('widget-milestones');
            if (widgetBody) {
                renderWidget(widgetBody, memberId);
                if (typeof lucide !== 'undefined') lucide.createIcons();
            }
        });
    }

    /**
     * Toggle milestone achievement (legacy modal version)
     */
    function toggleMilestone(memberId, milestoneId) {
        const widgetData = getWidgetData(memberId);
        const achieved = widgetData.achieved || [];
        const existingIndex = achieved.findIndex(m => m.id === milestoneId);

        let updatedAchieved;
        const wasAchieved = existingIndex >= 0;

        if (wasAchieved) {
            updatedAchieved = achieved.filter(m => m.id !== milestoneId);
        } else {
            updatedAchieved = [{ id: milestoneId, date: DateUtils.today() }, ...achieved];
            Toast.success(`Milestone achieved: ${getMilestoneName(milestoneId, widgetData)}!`);
        }

        const updatedData = { ...widgetData, achieved: updatedAchieved };
        Storage.setWidgetData(memberId, 'milestones', updatedData);

        const milestoneItem = document.querySelector(`[data-milestone-id="${milestoneId}"]`);
        const checkbox = document.querySelector(`[data-toggle="${milestoneId}"]`);

        if (milestoneItem && checkbox) {
            if (wasAchieved) {
                milestoneItem.classList.remove('milestone-item--achieved');
                checkbox.innerHTML = '';
            } else {
                milestoneItem.classList.add('milestone-item--achieved');
                checkbox.innerHTML = '<i data-lucide="check"></i>';
                if (typeof lucide !== 'undefined') lucide.createIcons();
            }
        }
    }

    function init() {
        // Initialize milestones feature
    }

    return {
        init,
        renderWidget,
        showFullPage
    };
})();
