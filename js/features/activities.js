/**
 * Activities Feature
 * Handles toddler engagement activity suggestions with history and custom activities
 */

const Activities = (function() {
    // Activity categories with suggestions
    const DEFAULT_CATEGORIES = {
        sensory: {
            name: 'Sensory Play',
            icon: 'hand',
            color: '#EC4899',
            activities: [
                'Play with playdough',
                'Water table fun',
                'Finger painting',
                'Sand play',
                'Rice/pasta sensory bin',
                'Bubble wrap stomping'
            ]
        },
        motor: {
            name: 'Motor Skills',
            icon: 'move',
            color: '#8B5CF6',
            activities: [
                'Stack blocks',
                'Ball throwing',
                'Dancing',
                'Obstacle course',
                'Puzzles',
                'Threading beads'
            ]
        },
        creative: {
            name: 'Creative',
            icon: 'palette',
            color: '#10B981',
            activities: [
                'Coloring',
                'Sticker art',
                'Play pretend',
                'Build with blocks',
                'Dress up',
                'Music time'
            ]
        },
        learning: {
            name: 'Learning',
            icon: 'book-open',
            color: '#F59E0B',
            activities: [
                'Read books',
                'Name colors',
                'Count objects',
                'Animal sounds',
                'Shape sorting',
                'Sing ABCs'
            ]
        },
        outdoor: {
            name: 'Outdoor',
            icon: 'sun',
            color: '#3B82F6',
            activities: [
                'Playground',
                'Nature walk',
                'Blow bubbles',
                'Chalk drawing',
                'Water play',
                'Bug hunting'
            ]
        }
    };

    /**
     * Get widget data with defaults
     */
    function getWidgetData(memberId) {
        const stored = Storage.getWidgetData(memberId, 'activities') || {};
        return {
            completedActivities: stored.completedActivities || [], // All completed activities with dates
            customActivities: stored.customActivities || {}, // Custom activities by category
            favorites: stored.favorites || []
        };
    }

    /**
     * Get all activities including custom ones
     */
    function getAllCategories(memberId) {
        const widgetData = getWidgetData(memberId);
        const customActivities = widgetData.customActivities || {};

        const categories = {};
        Object.entries(DEFAULT_CATEGORIES).forEach(([key, category]) => {
            categories[key] = {
                ...category,
                activities: [
                    ...category.activities,
                    ...(customActivities[key] || [])
                ]
            };
        });

        return categories;
    }

    /**
     * Render the activities widget for a member
     */
    function renderWidget(container, memberId) {
        const today = DateUtils.today();
        const widgetData = getWidgetData(memberId);
        const categories = getAllCategories(memberId);

        // Get today's completed activities
        const todayCompleted = widgetData.completedActivities
            .filter(a => a.date === today)
            .map(a => a.name);

        // Get random suggestions for today
        const suggestions = getTodaySuggestions(categories);

        container.innerHTML = `
            <div class="activities-widget">
                <div class="activities-widget__header">
                    <span class="activities-widget__label">Today's Ideas</span>
                    <span class="activities-widget__count">${todayCompleted.length} done today</span>
                </div>

                <div class="activities-widget__list">
                    ${suggestions.map(activity => {
                        const isCompleted = todayCompleted.includes(activity.name);
                        return `
                            <div class="activity-card ${isCompleted ? 'activity-card--done' : ''}" data-activity-name="${activity.name}">
                                <div class="activity-card__icon" style="background-color: ${activity.color}">
                                    <i data-lucide="${activity.icon}"></i>
                                </div>
                                <div class="activity-card__content">
                                    <span class="activity-card__name">${activity.name}</span>
                                    <span class="activity-card__category">${activity.category}</span>
                                </div>
                                <button class="btn btn--icon ${isCompleted ? 'btn--success' : 'btn--ghost'} btn--sm"
                                        data-complete-activity="${activity.name}"
                                        data-category="${activity.categoryKey}"
                                        ${isCompleted ? 'disabled' : ''}>
                                    <i data-lucide="${isCompleted ? 'check' : 'plus'}"></i>
                                </button>
                            </div>
                        `;
                    }).join('')}
                </div>

                <div class="activities-widget__footer">
                    <button class="btn btn--sm btn--ghost" data-action="browse-all" data-member-id="${memberId}">
                        <i data-lucide="grid"></i>
                        Browse All
                    </button>
                    <button class="btn btn--sm btn--ghost" data-action="history" title="View history">
                        <i data-lucide="history"></i>
                        History
                    </button>
                    <button class="btn btn--sm btn--ghost" data-action="manage" title="Manage activities">
                        <i data-lucide="settings"></i>
                        Manage
                    </button>
                </div>
            </div>
        `;

        // Bind events
        bindWidgetEvents(container, memberId);
    }

    /**
     * Get today's suggestions (consistent for the day)
     */
    function getTodaySuggestions(categories) {
        const today = DateUtils.today();
        const seed = hashCode(today);
        const suggestions = [];

        // Pick one from each category
        Object.entries(categories).forEach(([key, category], index) => {
            const activityIndex = Math.abs(seed + index) % category.activities.length;
            suggestions.push({
                name: category.activities[activityIndex],
                category: category.name,
                categoryKey: key,
                icon: category.icon,
                color: category.color
            });
        });

        return suggestions;
    }

    /**
     * Simple hash function for consistent daily suggestions
     */
    function hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash |= 0;
        }
        return hash;
    }

    /**
     * Bind widget events
     */
    function bindWidgetEvents(container, memberId) {
        // Complete activity buttons
        container.querySelectorAll('[data-complete-activity]').forEach(btn => {
            btn.addEventListener('click', () => {
                const activityName = btn.dataset.completeActivity;
                const category = btn.dataset.category;
                completeActivity(memberId, activityName, category);
            });
        });

        // Manage button (PIN protected)
        container.querySelector('[data-action="manage"]')?.addEventListener('click', async () => {
            const verified = await PIN.verify();
            if (verified) {
                showManageModal(memberId);
            }
        });

        // History button
        container.querySelector('[data-action="history"]')?.addEventListener('click', () => {
            showFullPage(memberId);
        });

        // Browse all activities
        container.querySelector('[data-action="browse-all"]')?.addEventListener('click', () => {
            showBrowseAllModal(memberId);
        });
    }

    /**
     * Complete an activity
     */
    function completeActivity(memberId, activityName, categoryKey) {
        const widgetData = getWidgetData(memberId);
        const today = DateUtils.today();

        // Check if already completed today
        const alreadyDone = widgetData.completedActivities.some(
            a => a.name === activityName && a.date === today
        );

        if (alreadyDone) {
            Toast.info('Already completed today!');
            return;
        }

        const updatedData = {
            ...widgetData,
            completedActivities: [
                ...widgetData.completedActivities,
                {
                    name: activityName,
                    category: categoryKey,
                    date: today,
                    timestamp: Date.now()
                }
            ]
        };

        Storage.setWidgetData(memberId, 'activities', updatedData);
        Toast.success(`Great job doing "${activityName}"!`);
        refreshWidget(memberId);
    }

    /**
     * Refresh widget in place
     */
    function refreshWidget(memberId) {
        const widgetBody = document.getElementById('widget-activities');
        if (widgetBody) {
            renderWidget(widgetBody, memberId);
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }
    }

    /**
     * Show browse all activities modal with ability to complete
     */
    function showBrowseAllModal(memberId) {
        const widgetData = getWidgetData(memberId);
        const categories = getAllCategories(memberId);
        const today = DateUtils.today();

        const todayCompleted = widgetData.completedActivities
            .filter(a => a.date === today)
            .map(a => a.name);

        const content = `
            <div class="all-activities">
                ${Object.entries(categories).map(([key, category]) => `
                    <div class="all-activities__category">
                        <h4 class="all-activities__title">
                            <i data-lucide="${category.icon}"></i>
                            ${category.name}
                        </h4>
                        <div class="all-activities__list">
                            ${category.activities.map(activity => {
                                const isCompleted = todayCompleted.includes(activity);
                                return `
                                    <div class="all-activities__item ${isCompleted ? 'all-activities__item--done' : ''}"
                                         data-activity="${activity}" data-category="${key}">
                                        <span>${activity}</span>
                                        ${isCompleted ? `
                                            <i data-lucide="check" class="all-activities__check"></i>
                                        ` : `
                                            <button class="btn btn--xs btn--ghost" data-add-activity="${activity}" data-category="${key}">
                                                <i data-lucide="plus"></i>
                                            </button>
                                        `}
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        Modal.open({
            title: 'Activity Ideas',
            content,
            footer: '<button class="btn btn--primary" data-modal-done>Done</button>',
            size: 'large'
        });

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Bind add activity buttons
        document.querySelectorAll('[data-add-activity]').forEach(btn => {
            btn.addEventListener('click', () => {
                const activityName = btn.dataset.addActivity;
                const category = btn.dataset.category;
                completeActivity(memberId, activityName, category);

                // Update the item in modal
                const item = btn.closest('.all-activities__item');
                if (item) {
                    item.classList.add('all-activities__item--done');
                    btn.outerHTML = '<i data-lucide="check" class="all-activities__check"></i>';
                    if (typeof lucide !== 'undefined') {
                        lucide.createIcons();
                    }
                }
            });
        });

        document.querySelector('[data-modal-done]')?.addEventListener('click', () => {
            Modal.close();
        });
    }

    /**
     * Show manage modal for custom activities
     */
    function showManageModal(memberId) {
        renderManageModal(memberId);
    }

    /**
     * Render manage modal content
     */
    function renderManageModal(memberId) {
        const widgetData = getWidgetData(memberId);
        const customActivities = widgetData.customActivities || {};

        const content = `
            <div class="manage-activities">
                <p class="manage-activities__info">Add custom activities to any category. These will appear alongside the default activities.</p>

                ${Object.entries(DEFAULT_CATEGORIES).map(([key, category]) => {
                    const customs = customActivities[key] || [];
                    return `
                        <div class="manage-activities__category">
                            <div class="manage-activities__category-header">
                                <i data-lucide="${category.icon}"></i>
                                <span>${category.name}</span>
                                <span class="manage-activities__count">${customs.length} custom</span>
                            </div>

                            ${customs.length > 0 ? `
                                <div class="manage-activities__list">
                                    ${customs.map(activity => `
                                        <div class="manage-activities__item">
                                            <span>${activity}</span>
                                            <button class="btn btn--xs btn--ghost" data-delete-activity="${activity}" data-category="${key}">
                                                <i data-lucide="trash-2"></i>
                                            </button>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : ''}

                            <div class="manage-activities__add">
                                <input type="text" class="form-input form-input--sm"
                                       placeholder="Add activity..."
                                       data-add-input="${key}">
                                <button class="btn btn--sm btn--primary" data-add-btn="${key}">
                                    <i data-lucide="plus"></i>
                                </button>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        Modal.open({
            title: 'Manage Activities',
            content,
            footer: '<button class="btn btn--primary" data-modal-done>Done</button>',
            size: 'large'
        });

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        bindManageEvents(memberId);
    }

    /**
     * Bind manage modal events
     */
    function bindManageEvents(memberId) {
        // Add activity buttons
        document.querySelectorAll('[data-add-btn]').forEach(btn => {
            const categoryKey = btn.dataset.addBtn;
            const input = document.querySelector(`[data-add-input="${categoryKey}"]`);

            const addActivity = () => {
                const activityName = input?.value?.trim();
                if (!activityName) {
                    Toast.error('Please enter an activity name');
                    return;
                }

                const widgetData = getWidgetData(memberId);
                const customActivities = widgetData.customActivities || {};
                const categoryActivities = customActivities[categoryKey] || [];

                if (categoryActivities.includes(activityName)) {
                    Toast.error('Activity already exists');
                    return;
                }

                const updatedData = {
                    ...widgetData,
                    customActivities: {
                        ...customActivities,
                        [categoryKey]: [...categoryActivities, activityName]
                    }
                };

                Storage.setWidgetData(memberId, 'activities', updatedData);
                Toast.success('Activity added!');
                refreshManageModal(memberId);
                refreshWidget(memberId);
            };

            btn.addEventListener('click', addActivity);
            input?.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    addActivity();
                }
            });
        });

        // Delete activity buttons
        document.querySelectorAll('[data-delete-activity]').forEach(btn => {
            btn.addEventListener('click', () => {
                const activityName = btn.dataset.deleteActivity;
                const categoryKey = btn.dataset.category;

                const widgetData = getWidgetData(memberId);
                const customActivities = widgetData.customActivities || {};
                const categoryActivities = customActivities[categoryKey] || [];

                const updatedData = {
                    ...widgetData,
                    customActivities: {
                        ...customActivities,
                        [categoryKey]: categoryActivities.filter(a => a !== activityName)
                    }
                };

                Storage.setWidgetData(memberId, 'activities', updatedData);
                Toast.success('Activity removed');
                refreshManageModal(memberId);
                refreshWidget(memberId);
            });
        });

        // Done button
        document.querySelector('[data-modal-done]')?.addEventListener('click', () => {
            Modal.close();
        });
    }

    /**
     * Refresh manage modal
     */
    function refreshManageModal(memberId) {
        const modalContent = document.getElementById('modalContent');
        if (!modalContent) return;

        const widgetData = getWidgetData(memberId);
        const customActivities = widgetData.customActivities || {};

        modalContent.innerHTML = `
            <div class="manage-activities">
                <p class="manage-activities__info">Add custom activities to any category. These will appear alongside the default activities.</p>

                ${Object.entries(DEFAULT_CATEGORIES).map(([key, category]) => {
                    const customs = customActivities[key] || [];
                    return `
                        <div class="manage-activities__category">
                            <div class="manage-activities__category-header">
                                <i data-lucide="${category.icon}"></i>
                                <span>${category.name}</span>
                                <span class="manage-activities__count">${customs.length} custom</span>
                            </div>

                            ${customs.length > 0 ? `
                                <div class="manage-activities__list">
                                    ${customs.map(activity => `
                                        <div class="manage-activities__item">
                                            <span>${activity}</span>
                                            <button class="btn btn--xs btn--ghost" data-delete-activity="${activity}" data-category="${key}">
                                                <i data-lucide="trash-2"></i>
                                            </button>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : ''}

                            <div class="manage-activities__add">
                                <input type="text" class="form-input form-input--sm"
                                       placeholder="Add activity..."
                                       data-add-input="${key}">
                                <button class="btn btn--sm btn--primary" data-add-btn="${key}">
                                    <i data-lucide="plus"></i>
                                </button>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        bindManageEvents(memberId);
    }

    /**
     * Show full page with activity history
     */
    function showFullPage(memberId) {
        const main = document.querySelector('main');
        if (!main) return;

        const member = Storage.getMember(memberId);
        const widgetData = getWidgetData(memberId);
        const completedActivities = widgetData.completedActivities || [];

        // Group activities by date
        const activityByDate = {};
        completedActivities.forEach(activity => {
            if (!activityByDate[activity.date]) {
                activityByDate[activity.date] = [];
            }
            activityByDate[activity.date].push(activity);
        });

        const dates = Object.keys(activityByDate).sort().reverse();
        const today = DateUtils.today();

        main.innerHTML = `
            <div class="full-page">
                <div class="full-page__header">
                    <button class="btn btn--ghost" id="backBtn">
                        <i data-lucide="arrow-left"></i>
                        Back
                    </button>
                    <h1 class="full-page__title">${member?.name || ''}'s Activity History</h1>
                    <div class="full-page__actions">
                        <button class="btn btn--sm btn--outline" id="clearHistoryBtn">
                            <i data-lucide="trash-2"></i>
                            Clear All
                        </button>
                    </div>
                </div>

                <div class="full-page__content">
                    ${dates.length === 0 ? `
                        <div class="empty-state">
                            <i data-lucide="activity"></i>
                            <p>No activities completed yet</p>
                            <span class="text-muted">Complete activities to see them here!</span>
                        </div>
                    ` : `
                        <div class="activity-history">
                            ${dates.map(date => {
                                const activities = activityByDate[date];
                                const isToday = date === today;
                                return `
                                    <div class="activity-history__day ${isToday ? 'activity-history__day--today' : ''}">
                                        <div class="activity-history__date">
                                            ${isToday ? 'Today' : DateUtils.formatShort(date)}
                                            <span class="activity-history__count">${activities.length} activities</span>
                                        </div>
                                        <div class="activity-history__list">
                                            ${activities.map(activity => {
                                                const category = DEFAULT_CATEGORIES[activity.category];
                                                return `
                                                    <div class="activity-history__item">
                                                        <div class="activity-history__icon" style="background-color: ${category?.color || '#6B7280'}">
                                                            <i data-lucide="${category?.icon || 'activity'}"></i>
                                                        </div>
                                                        <span class="activity-history__name">${activity.name}</span>
                                                        <span class="activity-history__category">${category?.name || 'Activity'}</span>
                                                    </div>
                                                `;
                                            }).join('')}
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    `}
                </div>
            </div>
        `;

        // Initialize icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Bind back button
        document.getElementById('backBtn')?.addEventListener('click', () => {
            State.emit('tabChanged', memberId);
        });

        // Bind clear history button
        document.getElementById('clearHistoryBtn')?.addEventListener('click', async () => {
            const verified = await PIN.verify();
            if (verified) {
                Modal.open({
                    title: 'Clear History?',
                    content: '<p>This will remove all activity history. Are you sure?</p>',
                    footer: Modal.createFooter('Cancel', 'Clear All')
                });

                Modal.bindFooterEvents(() => {
                    const updatedData = {
                        ...widgetData,
                        completedActivities: []
                    };
                    Storage.setWidgetData(memberId, 'activities', updatedData);
                    Toast.success('History cleared');
                    showFullPage(memberId);
                    return true;
                });
            }
        });
    }

    function init() {
        // Initialize activities feature
    }

    return {
        init,
        renderWidget,
        showFullPage
    };
})();
