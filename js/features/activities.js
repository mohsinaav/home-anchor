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
        const today = DateUtils.today();

        // Clean up old refreshed suggestions (only keep today's)
        let refreshedSuggestions = stored.refreshedSuggestions || {};
        if (refreshedSuggestions.date !== today) {
            refreshedSuggestions = { date: today };
        }

        return {
            completedActivities: stored.completedActivities || [], // All completed activities with dates
            customActivities: stored.customActivities || {}, // Custom activities by category
            favorites: stored.favorites || [],
            refreshedSuggestions // Track refreshed suggestions per category for today
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

        // Get random suggestions for today (respecting any refreshed suggestions)
        const suggestions = getTodaySuggestions(categories, widgetData.refreshedSuggestions);

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
                                    <span class="activity-card__category">${activity.category}</span>
                                    <span class="activity-card__name">${activity.name}</span>
                                </div>
                                <div class="activity-card__actions">
                                    <button class="btn btn--icon btn--ghost btn--sm"
                                            data-refresh-category="${activity.categoryKey}"
                                            title="Get different suggestion">
                                        <i data-lucide="refresh-cw"></i>
                                    </button>
                                    <button class="btn btn--icon ${isCompleted ? 'btn--success' : 'btn--ghost'} btn--sm"
                                            data-complete-activity="${activity.name}"
                                            data-category="${activity.categoryKey}"
                                            ${isCompleted ? 'disabled' : ''}>
                                        <i data-lucide="${isCompleted ? 'check' : 'plus'}"></i>
                                    </button>
                                </div>
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
     * Get today's suggestions (consistent for the day, respects refreshed suggestions)
     */
    function getTodaySuggestions(categories, refreshedSuggestions = {}) {
        const today = DateUtils.today();
        const seed = hashCode(today);
        const suggestions = [];

        // Pick one from each category
        Object.entries(categories).forEach(([key, category], index) => {
            // Check if this category has been refreshed today
            let activityName;
            if (refreshedSuggestions[key]) {
                activityName = refreshedSuggestions[key];
            } else {
                const activityIndex = Math.abs(seed + index) % category.activities.length;
                activityName = category.activities[activityIndex];
            }

            suggestions.push({
                name: activityName,
                category: category.name,
                categoryKey: key,
                icon: category.icon,
                color: category.color
            });
        });

        return suggestions;
    }

    /**
     * Refresh suggestion for a specific category
     */
    function refreshCategorySuggestion(memberId, categoryKey) {
        const widgetData = getWidgetData(memberId);
        const categories = getAllCategories(memberId);
        const category = categories[categoryKey];
        const today = DateUtils.today();

        if (!category) return;

        // Get current suggestion to exclude it
        const currentSuggestion = widgetData.refreshedSuggestions[categoryKey] ||
            getTodaySuggestions(categories)[Object.keys(categories).indexOf(categoryKey)]?.name;

        // Get all activities except the current one
        const otherActivities = category.activities.filter(a => a !== currentSuggestion);

        if (otherActivities.length === 0) {
            Toast.info('No other activities in this category');
            return;
        }

        // Pick a random new activity
        const randomIndex = Math.floor(Math.random() * otherActivities.length);
        const newActivity = otherActivities[randomIndex];

        // Save the refreshed suggestion
        const updatedData = {
            ...widgetData,
            refreshedSuggestions: {
                ...widgetData.refreshedSuggestions,
                date: today,
                [categoryKey]: newActivity
            }
        };

        Storage.setWidgetData(memberId, 'activities', updatedData);
        return newActivity;
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

        // Refresh suggestion buttons
        container.querySelectorAll('[data-refresh-category]').forEach(btn => {
            btn.addEventListener('click', () => {
                const categoryKey = btn.dataset.refreshCategory;
                refreshCategorySuggestion(memberId, categoryKey);
                refreshWidget(memberId);
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

        // Sync activity count to Daily Log widget
        syncActivityCountToDailyLog(memberId, updatedData, today);
    }

    /**
     * Update the Daily Log "Activities Done" count to match today's completed activities
     */
    function syncActivityCountToDailyLog(memberId, activitiesData, today) {
        const todayCount = activitiesData.completedActivities.filter(a => a.date === today).length;
        const logData = Storage.getWidgetData(memberId, 'daily-log') || {};
        const currentCount = logData.logs?.[today]?.activity;

        // Only update if the count actually changed
        if (currentCount === todayCount) return;

        const updatedLog = {
            ...logData,
            logs: {
                ...logData.logs,
                [today]: {
                    ...logData.logs?.[today],
                    activity: todayCount
                }
            }
        };
        Storage.setWidgetData(memberId, 'daily-log', updatedLog);

        // Refresh the daily log widget if visible
        const logWidget = document.getElementById('widget-daily-log');
        if (logWidget && typeof DailyLog !== 'undefined' && DailyLog.renderWidget) {
            DailyLog.renderWidget(logWidget, memberId);
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
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

        // Also refresh full page if it's visible (e.g., when managing from settings button)
        const fullPage = document.querySelector('.kid-page--activities');
        if (fullPage) {
            const main = document.querySelector('main');
            const member = Storage.getMember(memberId);
            // Get current active tab
            const activeTabBtn = fullPage.querySelector('.kid-page__tab--active');
            const activeTab = activeTabBtn?.dataset?.tab || 'suggest';
            renderFullPage(main, memberId, member, activeTab);
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
     * Calculate statistics for activities
     */
    function calculateStats(widgetData) {
        const completedActivities = widgetData.completedActivities || [];
        const today = DateUtils.today();

        // Today's count
        const todayCount = completedActivities.filter(a => a.date === today).length;

        // Total activities
        const totalActivities = completedActivities.length;

        // Favorite category
        const categoryCounts = {};
        completedActivities.forEach(a => {
            categoryCounts[a.category] = (categoryCounts[a.category] || 0) + 1;
        });

        let favoriteCategory = null;
        let maxCount = 0;
        Object.entries(categoryCounts).forEach(([cat, count]) => {
            if (count > maxCount) {
                maxCount = count;
                favoriteCategory = cat;
            }
        });

        // Current streak (consecutive days with activities)
        const dates = [...new Set(completedActivities.map(a => a.date))].sort().reverse();
        let streak = 0;
        if (dates.length > 0) {
            const todayDate = new Date(today);
            for (let i = 0; i < dates.length; i++) {
                const expectedDate = new Date(todayDate);
                expectedDate.setDate(expectedDate.getDate() - i);
                const expectedStr = expectedDate.toISOString().split('T')[0];
                if (dates.includes(expectedStr)) {
                    streak++;
                } else if (i === 0 && !dates.includes(today)) {
                    // If no activity today, check yesterday
                    continue;
                } else {
                    break;
                }
            }
        }

        return {
            todayCount,
            totalActivities,
            favoriteCategory,
            favoriteCategoryName: favoriteCategory ? DEFAULT_CATEGORIES[favoriteCategory]?.name : null,
            streak,
            categoryCounts
        };
    }

    /**
     * Render Suggest tab - Today's activity suggestions
     */
    function renderSuggestTab(memberId, categories, todayCompleted, refreshedSuggestions) {
        const suggestions = getTodaySuggestions(categories, refreshedSuggestions);

        return `
            <div class="activities-suggest-tab">
                <p class="activities-suggest-tab__intro">Here are today's activity ideas - one from each category! Tap refresh for different suggestions.</p>
                <div class="activities-suggest-tab__list">
                    ${suggestions.map(activity => {
                        const isCompleted = todayCompleted.includes(activity.name);
                        return `
                            <div class="activities-suggest-card ${isCompleted ? 'activities-suggest-card--done' : ''}">
                                <div class="activities-suggest-card__icon" style="background-color: ${activity.color}">
                                    <i data-lucide="${activity.icon}"></i>
                                </div>
                                <div class="activities-suggest-card__content">
                                    <span class="activities-suggest-card__category">${activity.category}</span>
                                    <span class="activities-suggest-card__name">${activity.name}</span>
                                </div>
                                <div class="activities-suggest-card__actions">
                                    <button class="btn btn--icon btn--ghost btn--sm"
                                            data-refresh-category="${activity.categoryKey}"
                                            title="Get different suggestion">
                                        <i data-lucide="refresh-cw"></i>
                                    </button>
                                    <button class="btn btn--icon ${isCompleted ? 'btn--success' : 'btn--primary'}"
                                            data-complete-activity="${activity.name}"
                                            data-category="${activity.categoryKey}"
                                            ${isCompleted ? 'disabled' : ''}>
                                        <i data-lucide="${isCompleted ? 'check' : 'plus'}"></i>
                                    </button>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Render Browse tab - All activities by category
     */
    function renderBrowseTab(memberId, categories, todayCompleted) {
        return `
            <div class="activities-browse-tab">
                ${Object.entries(categories).map(([key, category]) => `
                    <div class="activities-browse-category">
                        <div class="activities-browse-category__header" style="border-left-color: ${category.color}">
                            <i data-lucide="${category.icon}" style="color: ${category.color}"></i>
                            <span>${category.name}</span>
                            <span class="activities-browse-category__count">${category.activities.length} activities</span>
                        </div>
                        <div class="activities-browse-category__list">
                            ${category.activities.map(activity => {
                                const isCompleted = todayCompleted.includes(activity);
                                return `
                                    <div class="activities-browse-item ${isCompleted ? 'activities-browse-item--done' : ''}">
                                        <span class="activities-browse-item__name">${activity}</span>
                                        ${isCompleted ? `
                                            <span class="activities-browse-item__check">
                                                <i data-lucide="check"></i>
                                            </span>
                                        ` : `
                                            <button class="btn btn--xs btn--ghost"
                                                    data-complete-activity="${activity}"
                                                    data-category="${key}">
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
    }

    /**
     * Generate mini calendar HTML for history tabs
     */
    function generateMiniCalendar(currentMonth, currentYear, datesWithActivity) {
        const today = DateUtils.today();
        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        const startDay = firstDay.getDay(); // Day of week (0-6)
        const daysInMonth = lastDay.getDate();

        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                            'July', 'August', 'September', 'October', 'November', 'December'];

        let calendarHTML = `
            <div class="history-calendar">
                <div class="history-calendar__header">
                    <button class="history-calendar__nav" data-calendar-nav="prev">
                        <i data-lucide="chevron-left"></i>
                    </button>
                    <span class="history-calendar__title">${monthNames[currentMonth]} ${currentYear}</span>
                    <button class="history-calendar__nav" data-calendar-nav="next">
                        <i data-lucide="chevron-right"></i>
                    </button>
                </div>
                <div class="history-calendar__weekdays">
                    ${['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => `<span>${d}</span>`).join('')}
                </div>
                <div class="history-calendar__grid">
        `;

        // Empty cells before first day
        for (let i = 0; i < startDay; i++) {
            calendarHTML += `<span class="history-calendar__day history-calendar__day--empty"></span>`;
        }

        // Days of month
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const hasActivity = datesWithActivity.includes(dateStr);
            const isToday = dateStr === today;
            const isFuture = dateStr > today;

            calendarHTML += `
                <span class="history-calendar__day ${hasActivity ? 'history-calendar__day--has-activity' : ''} ${isToday ? 'history-calendar__day--today' : ''} ${isFuture ? 'history-calendar__day--future' : ''}"
                      data-calendar-date="${dateStr}"
                      ${!hasActivity || isFuture ? '' : 'data-clickable="true"'}>
                    ${day}
                </span>
            `;
        }

        calendarHTML += `
                </div>
            </div>
        `;

        return calendarHTML;
    }

    /**
     * Render History tab - Activities grouped by date with calendar
     */
    function renderHistoryTab(memberId, widgetData, calendarMonth = null, calendarYear = null, selectedDate = null) {
        const completedActivities = widgetData.completedActivities || [];
        const today = DateUtils.today();

        // Default to current month/year if not specified
        const now = new Date();
        const currentMonth = calendarMonth !== null ? calendarMonth : now.getMonth();
        const currentYear = calendarYear !== null ? calendarYear : now.getFullYear();

        // Group activities by date
        const activityByDate = {};
        completedActivities.forEach(activity => {
            if (!activityByDate[activity.date]) {
                activityByDate[activity.date] = [];
            }
            activityByDate[activity.date].push(activity);
        });

        const allDates = Object.keys(activityByDate);

        // Filter dates based on selection or show recent
        let datesToShow;
        if (selectedDate && activityByDate[selectedDate]) {
            datesToShow = [selectedDate];
        } else {
            datesToShow = allDates.sort().reverse();
        }

        if (allDates.length === 0) {
            return `
                <div class="activities-history-tab">
                    ${generateMiniCalendar(currentMonth, currentYear, [])}
                    <div class="empty-state">
                        <i data-lucide="activity"></i>
                        <p>No activities completed yet</p>
                        <span class="text-muted">Complete activities to see them here!</span>
                    </div>
                </div>
            `;
        }

        return `
            <div class="activities-history-tab" data-calendar-month="${currentMonth}" data-calendar-year="${currentYear}">
                ${generateMiniCalendar(currentMonth, currentYear, allDates)}
                ${selectedDate ? `
                    <button class="btn btn--sm btn--ghost history-show-all" data-show-all-history>
                        <i data-lucide="list"></i>
                        Show all dates
                    </button>
                ` : ''}
                <div class="activities-history-list">
                    ${datesToShow.map(date => {
                        const activities = activityByDate[date];
                        const isToday = date === today;
                        return `
                            <div class="activities-history-day ${isToday ? 'activities-history-day--today' : ''}" data-history-date="${date}">
                                <div class="activities-history-day__header">
                                    <span class="activities-history-day__date">
                                        ${isToday ? 'Today' : DateUtils.formatShort(date)}
                                    </span>
                                    <span class="activities-history-day__count">${activities.length} activities</span>
                                </div>
                                <div class="activities-history-day__list">
                                    ${activities.map(activity => {
                                        const category = DEFAULT_CATEGORIES[activity.category];
                                        return `
                                            <div class="activities-history-item">
                                                <div class="activities-history-item__icon" style="background-color: ${category?.color || '#6B7280'}">
                                                    <i data-lucide="${category?.icon || 'activity'}"></i>
                                                </div>
                                                <span class="activities-history-item__name">${activity.name}</span>
                                                <span class="activities-history-item__category">${category?.name || 'Activity'}</span>
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
    }

    /**
     * Render Stats tab - Activity statistics
     */
    function renderStatsTab(memberId, widgetData, categories) {
        const stats = calculateStats(widgetData);
        const completedActivities = widgetData.completedActivities || [];

        // Get unique days with activities
        const uniqueDays = [...new Set(completedActivities.map(a => a.date))].length;

        return `
            <div class="activities-stats-tab">
                <div class="activities-stats-overview">
                    <div class="activities-stats-card">
                        <div class="activities-stats-card__value">${stats.totalActivities}</div>
                        <div class="activities-stats-card__label">Total Activities</div>
                    </div>
                    <div class="activities-stats-card">
                        <div class="activities-stats-card__value">${uniqueDays}</div>
                        <div class="activities-stats-card__label">Active Days</div>
                    </div>
                    <div class="activities-stats-card">
                        <div class="activities-stats-card__value">${stats.streak}</div>
                        <div class="activities-stats-card__label">Day Streak</div>
                    </div>
                    <div class="activities-stats-card">
                        <div class="activities-stats-card__value">${stats.totalActivities > 0 ? (stats.totalActivities / Math.max(uniqueDays, 1)).toFixed(1) : '0'}</div>
                        <div class="activities-stats-card__label">Avg/Day</div>
                    </div>
                </div>

                <div class="activities-stats-categories">
                    <h4 class="activities-stats-categories__title">Category Breakdown</h4>
                    <div class="activities-stats-categories__list">
                        ${Object.entries(DEFAULT_CATEGORIES).map(([key, category]) => {
                            const count = stats.categoryCounts[key] || 0;
                            const percentage = stats.totalActivities > 0 ? Math.round((count / stats.totalActivities) * 100) : 0;
                            return `
                                <div class="activities-stats-category">
                                    <div class="activities-stats-category__header">
                                        <div class="activities-stats-category__icon" style="background-color: ${category.color}">
                                            <i data-lucide="${category.icon}"></i>
                                        </div>
                                        <span class="activities-stats-category__name">${category.name}</span>
                                        <span class="activities-stats-category__count">${count}</span>
                                    </div>
                                    <div class="activities-stats-category__bar">
                                        <div class="activities-stats-category__fill" style="width: ${percentage}%; background-color: ${category.color}"></div>
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
     * Render full page content
     */
    function renderFullPage(container, memberId, member, activeTab, calendarState = {}) {
        const widgetData = getWidgetData(memberId);
        const categories = getAllCategories(memberId);
        const stats = calculateStats(widgetData);
        const today = DateUtils.today();
        const colors = (typeof KidTheme !== 'undefined' && KidTheme.getColors)
            ? KidTheme.getColors('activities')
            : { primary: '#F97316', gradient: 'linear-gradient(135deg, #FB923C 0%, #F97316 40%, #EA580C 100%)' };

        const todayCompleted = widgetData.completedActivities
            .filter(a => a.date === today)
            .map(a => a.name);

        const tabs = [
            { id: 'suggest', label: 'Suggest', icon: 'lightbulb' },
            { id: 'browse', label: 'Browse', icon: 'grid' },
            { id: 'history', label: 'History', icon: 'history' },
            { id: 'stats', label: 'Stats', icon: 'bar-chart-2' }
        ];

        container.innerHTML = `
            <div class="kid-page kid-page--activities">
                <div class="kid-page__hero" style="background: ${colors.gradient}; --kid-hero-text: ${colors.dark || '#9A3412'}">
                    <button class="btn btn--ghost kid-page__back" id="backBtn">
                        <i data-lucide="arrow-left"></i> Back
                    </button>
                    <button class="kid-page__settings" id="settingsBtn">
                        <i data-lucide="settings"></i>
                    </button>

                    <div class="kid-page__hero-content">
                        <h1 class="kid-page__hero-title">🎨 ${member?.name || ''}'s Activities</h1>
                        <div class="kid-page__hero-stats">
                            <div class="kid-hero-stat">
                                <span class="kid-hero-stat__value">${stats.todayCount}</span>
                                <span class="kid-hero-stat__label">Today</span>
                            </div>
                            <div class="kid-hero-stat">
                                <span class="kid-hero-stat__value">${stats.totalActivities}</span>
                                <span class="kid-hero-stat__label">Total</span>
                            </div>
                            <div class="kid-hero-stat">
                                <span class="kid-hero-stat__value">${stats.favoriteCategoryName || '-'}</span>
                                <span class="kid-hero-stat__label">Favorite</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="kid-page__tabs" style="--tab-color: ${colors.primary}">
                    ${tabs.map(tab => `
                        <button class="kid-page__tab ${activeTab === tab.id ? 'kid-page__tab--active' : ''}"
                                data-tab="${tab.id}">
                            <i data-lucide="${tab.icon}"></i>
                            ${tab.label}
                        </button>
                    `).join('')}
                </div>

                <div class="kid-page__content">
                    ${activeTab === 'suggest' ? renderSuggestTab(memberId, categories, todayCompleted, widgetData.refreshedSuggestions) : ''}
                    ${activeTab === 'browse' ? renderBrowseTab(memberId, categories, todayCompleted) : ''}
                    ${activeTab === 'history' ? renderHistoryTab(memberId, widgetData, calendarState.month, calendarState.year, calendarState.selectedDate) : ''}
                    ${activeTab === 'stats' ? renderStatsTab(memberId, widgetData, categories) : ''}
                </div>
            </div>
        `;

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        bindFullPageEvents(container, memberId, member, activeTab, calendarState);
    }

    /**
     * Bind full page events
     */
    function bindFullPageEvents(container, memberId, member, activeTab, calendarState = {}) {
        // Back button
        container.querySelector('#backBtn')?.addEventListener('click', () => {
            State.emit('tabChanged', memberId);
        });

        // Settings button (PIN protected)
        container.querySelector('#settingsBtn')?.addEventListener('click', async () => {
            const verified = await PIN.verify();
            if (verified) {
                showManageModal(memberId);
            }
        });

        // Tab switching
        container.querySelectorAll('[data-tab]').forEach(tab => {
            tab.addEventListener('click', () => {
                const tabId = tab.dataset.tab;
                renderFullPage(container, memberId, member, tabId);
            });
        });

        // Complete activity buttons (in suggest and browse tabs)
        container.querySelectorAll('[data-complete-activity]').forEach(btn => {
            btn.addEventListener('click', () => {
                const activityName = btn.dataset.completeActivity;
                const category = btn.dataset.category;
                completeActivity(memberId, activityName, category);
                renderFullPage(container, memberId, member, activeTab, calendarState);
            });
        });

        // Refresh suggestion buttons (in suggest tab)
        container.querySelectorAll('[data-refresh-category]').forEach(btn => {
            btn.addEventListener('click', () => {
                const categoryKey = btn.dataset.refreshCategory;
                refreshCategorySuggestion(memberId, categoryKey);
                renderFullPage(container, memberId, member, activeTab, calendarState);
            });
        });

        // Calendar navigation (in history tab)
        container.querySelectorAll('[data-calendar-nav]').forEach(btn => {
            btn.addEventListener('click', () => {
                const historyTab = container.querySelector('.activities-history-tab');
                const currentMonth = parseInt(historyTab?.dataset?.calendarMonth || new Date().getMonth());
                const currentYear = parseInt(historyTab?.dataset?.calendarYear || new Date().getFullYear());

                let newMonth = currentMonth;
                let newYear = currentYear;

                if (btn.dataset.calendarNav === 'prev') {
                    newMonth--;
                    if (newMonth < 0) {
                        newMonth = 11;
                        newYear--;
                    }
                } else {
                    newMonth++;
                    if (newMonth > 11) {
                        newMonth = 0;
                        newYear++;
                    }
                }

                renderFullPage(container, memberId, member, activeTab, { month: newMonth, year: newYear });
            });
        });

        // Calendar date click (in history tab)
        container.querySelectorAll('[data-calendar-date][data-clickable="true"]').forEach(day => {
            day.addEventListener('click', () => {
                const date = day.dataset.calendarDate;
                const historyTab = container.querySelector('.activities-history-tab');
                const currentMonth = parseInt(historyTab?.dataset?.calendarMonth || new Date().getMonth());
                const currentYear = parseInt(historyTab?.dataset?.calendarYear || new Date().getFullYear());

                renderFullPage(container, memberId, member, activeTab, {
                    month: currentMonth,
                    year: currentYear,
                    selectedDate: date
                });
            });
        });

        // Show all history button
        container.querySelector('[data-show-all-history]')?.addEventListener('click', () => {
            const historyTab = container.querySelector('.activities-history-tab');
            const currentMonth = parseInt(historyTab?.dataset?.calendarMonth || new Date().getMonth());
            const currentYear = parseInt(historyTab?.dataset?.calendarYear || new Date().getFullYear());

            renderFullPage(container, memberId, member, activeTab, {
                month: currentMonth,
                year: currentYear,
                selectedDate: null
            });
        });
    }

    /**
     * Show full page with activity history
     */
    function showFullPage(memberId) {
        const main = document.querySelector('main');
        if (!main) return;

        const member = Storage.getMember(memberId);
        renderFullPage(main, memberId, member, 'suggest');
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
