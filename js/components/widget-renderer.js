/**
 * Widget Renderer
 * Dynamic widget rendering system for member tabs
 * Includes drag-and-drop reordering functionality
 */

const WidgetRenderer = (function() {
    // Track currently dragged widget
    let draggedWidget = null;
    let draggedIndex = null;
    let currentMember = null;

    // Track focused widget per member (for kid layout and adult focus mode)
    const focusedWidgets = {};

    // Track layout preference per adult member (loaded from storage)
    // 'grid' = show all widgets, 'focus' = focus on one widget
    const adultLayoutPrefs = {};

    // Track layout preference per kid/toddler member (loaded from storage)
    // 'focus' = focus on one widget (default), 'grid' = show all widgets
    const kidLayoutPrefs = {};

    // Widgets that have full page/expand functionality
    const EXPANDABLE_WIDGETS = [
        'points', 'kid-journal', 'kid-tasks', 'kid-workout', 'toddler-tasks', 'vision-board',
        'workout', 'task-list', 'meal-plan', 'habits', 'gratitude', 'recipes',
        'grocery', 'routine', 'daily-log', 'toddler-routine', 'activities', 'journal'
    ];

    // Widget component registry - maps widget IDs to their render functions
    const widgetComponents = {
        // Adult widgets
        'meal-plan': {
            render: (container, member) => {
                if (typeof Meals !== 'undefined' && Meals.renderWidget) {
                    Meals.renderWidget(container, member.id);
                } else {
                    renderPlaceholder(container, 'Meal Plan', 'utensils', 'Plan your weekly meals');
                }
            },
            title: 'Meal Plan',
            icon: 'utensils'
        },
        'task-list': {
            render: (container, member) => {
                if (typeof Tasks !== 'undefined' && Tasks.renderWidget) {
                    Tasks.renderWidget(container, member.id);
                } else {
                    renderPlaceholder(container, 'Task List', 'check-square', 'Manage your to-do items');
                }
            },
            title: 'Task List',
            icon: 'check-square'
        },
        'workout': {
            render: (container, member) => {
                if (typeof Workout !== 'undefined' && Workout.renderWidget) {
                    Workout.renderWidget(container, member.id);
                } else {
                    renderPlaceholder(container, 'Workout', 'dumbbell', 'Track your exercise routines');
                }
            },
            title: 'Workout',
            icon: 'dumbbell'
        },
        'gratitude': {
            render: (container, member) => {
                if (typeof Gratitude !== 'undefined' && Gratitude.renderWidget) {
                    Gratitude.renderWidget(container, member.id);
                } else {
                    renderPlaceholder(container, 'Gratitude', 'heart', 'Daily gratitude journal');
                }
            },
            title: 'Gratitude',
            icon: 'heart'
        },
        'habits': {
            render: (container, member) => {
                if (typeof Habits !== 'undefined' && Habits.renderWidget) {
                    Habits.renderWidget(container, member.id);
                } else {
                    renderPlaceholder(container, 'Habits', 'repeat', 'Track daily habits');
                }
            },
            title: 'Habits',
            icon: 'repeat'
        },
        'recipes': {
            render: (container, member) => {
                if (typeof Recipes !== 'undefined' && Recipes.renderWidget) {
                    Recipes.renderWidget(container, member.id);
                } else {
                    renderPlaceholder(container, 'Recipes', 'book-open', 'Your recipe collection');
                }
            },
            title: 'Recipes',
            icon: 'book-open'
        },
        'grocery': {
            render: (container, member) => {
                if (typeof Grocery !== 'undefined' && Grocery.renderWidget) {
                    Grocery.renderWidget(container, member.id);
                } else {
                    renderPlaceholder(container, 'Shopping List', 'shopping-cart', 'Shopping list from meal plans');
                }
            },
            title: 'Shopping List',
            icon: 'shopping-cart'
        },
        'routine': {
            render: (container, member) => {
                if (typeof Routine !== 'undefined' && Routine.renderWidget) {
                    Routine.renderWidget(container, member.id);
                } else {
                    renderPlaceholder(container, 'Routines', 'repeat', 'Track recurring tasks and build habits');
                }
            },
            title: 'Routines',
            icon: 'repeat'
        },
        'vision-board': {
            render: (container, member) => {
                if (typeof VisionBoard !== 'undefined' && VisionBoard.renderWidget) {
                    VisionBoard.renderWidget(container, member.id);
                } else {
                    renderPlaceholder(container, 'Vision Board', 'target', 'Track your goals and dreams');
                }
            },
            title: 'Vision Board',
            icon: 'target'
        },
        'journal': {
            render: (container, member) => {
                if (typeof Journal !== 'undefined' && Journal.renderWidget) {
                    Journal.renderWidget(container, member.id);
                } else {
                    renderPlaceholder(container, 'Journal', 'notebook-pen', 'Private daily journal');
                }
            },
            title: 'Journal',
            icon: 'notebook-pen'
        },
        'circuit-timer': {
            render: (container, member) => {
                if (typeof CircuitTimer !== 'undefined' && CircuitTimer.renderWidget) {
                    CircuitTimer.renderWidget(container, member.id);
                } else {
                    renderPlaceholder(container, 'Circuit Timer', 'timer', 'Interval workout timer');
                }
            },
            title: 'Circuit Timer',
            icon: 'timer'
        },

        // Kid widgets
        'points': {
            render: (container, member) => {
                if (typeof Points !== 'undefined' && Points.renderWidget) {
                    Points.renderWidget(container, member.id);
                } else {
                    renderPlaceholder(container, 'Points', 'star', 'Earn points for activities');
                }
            },
            title: 'Points',
            icon: 'star'
        },
        'rewards': {
            render: (container, member) => {
                if (typeof Rewards !== 'undefined' && Rewards.renderWidget) {
                    Rewards.renderWidget(container, member.id);
                } else {
                    renderPlaceholder(container, 'Rewards', 'gift', 'Redeem your points');
                }
            },
            title: 'Rewards',
            icon: 'gift'
        },
        'achievements': {
            render: (container, member) => {
                if (typeof Achievements !== 'undefined' && Achievements.renderWidget) {
                    Achievements.renderWidget(container, member.id);
                } else {
                    renderPlaceholder(container, 'Achievements', 'award', 'Badges and milestones');
                }
            },
            title: 'Achievements',
            icon: 'award'
        },
        'kid-tasks': {
            render: (container, member) => {
                if (typeof KidTasks !== 'undefined' && KidTasks.renderWidget) {
                    KidTasks.renderWidget(container, member.id);
                } else {
                    renderPlaceholder(container, 'My Tasks', 'check-square', 'Fun task list for kids');
                }
            },
            title: 'My Tasks',
            icon: 'check-square'
        },
        'chores': {
            render: (container, member) => {
                if (typeof Chores !== 'undefined' && Chores.renderWidget) {
                    Chores.renderWidget(container, member.id);
                } else {
                    renderPlaceholder(container, 'Chores', 'list-checks', 'Daily chores and tasks');
                }
            },
            title: 'Chores',
            icon: 'list-checks'
        },
        'accomplishments': {
            render: (container, member) => {
                if (typeof Accomplishments !== 'undefined' && Accomplishments.renderWidget) {
                    Accomplishments.renderWidget(container, member.id);
                } else {
                    renderPlaceholder(container, 'Accomplishments', 'trophy', 'Extra achievements log');
                }
            },
            title: 'Accomplishments',
            icon: 'trophy'
        },
        'screen-time': {
            render: (container, member) => {
                if (typeof ScreenTime !== 'undefined' && ScreenTime.renderWidget) {
                    ScreenTime.renderWidget(container, member.id);
                } else {
                    renderPlaceholder(container, 'Screen Time', 'monitor', 'Track screen time usage');
                }
            },
            title: 'Screen Time',
            icon: 'monitor'
        },
        'kid-journal': {
            render: (container, member) => {
                if (typeof KidJournal !== 'undefined' && KidJournal.renderWidget) {
                    KidJournal.renderWidget(container, member.id);
                } else {
                    renderPlaceholder(container, 'My Journal', 'book-open', 'Write and reflect on your day');
                }
            },
            title: 'My Journal',
            icon: 'book-open'
        },
        'kid-workout': {
            render: (container, member) => {
                if (typeof KidWorkout !== 'undefined' && KidWorkout.renderWidget) {
                    KidWorkout.renderWidget(container, member.id);
                } else {
                    renderPlaceholder(container, 'Move & Play', 'heart-pulse', 'Fun workout activities for kids');
                }
            },
            title: 'Move & Play',
            icon: 'heart-pulse'
        },

        // Toddler widgets
        'activities': {
            render: (container, member) => {
                if (typeof Activities !== 'undefined' && Activities.renderWidget) {
                    Activities.renderWidget(container, member.id);
                } else {
                    renderPlaceholder(container, 'Activities', 'shapes', 'Fun engagement activities');
                }
            },
            title: 'Activities',
            icon: 'shapes'
        },
        'daily-log': {
            render: (container, member) => {
                if (typeof DailyLog !== 'undefined' && DailyLog.renderWidget) {
                    DailyLog.renderWidget(container, member.id);
                } else {
                    renderPlaceholder(container, 'Daily Log', 'calendar-check', 'Track activities done today');
                }
            },
            title: 'Daily Log',
            icon: 'calendar-check'
        },
        'milestones': {
            render: (container, member) => {
                if (typeof Milestones !== 'undefined' && Milestones.renderWidget) {
                    Milestones.renderWidget(container, member.id);
                } else {
                    renderPlaceholder(container, 'Milestones', 'baby', 'Developmental milestones');
                }
            },
            title: 'Milestones',
            icon: 'baby'
        },
        'toddler-tasks': {
            render: (container, member) => {
                if (typeof ToddlerTasks !== 'undefined' && ToddlerTasks.renderWidget) {
                    ToddlerTasks.renderWidget(container, member.id);
                } else {
                    renderPlaceholder(container, 'My To-Dos', 'check-circle', 'Simple visual task list');
                }
            },
            title: 'My To-Dos',
            icon: 'check-circle'
        },
        'toddler-routine': {
            render: (container, member) => {
                if (typeof ToddlerRoutine !== 'undefined' && ToddlerRoutine.renderWidget) {
                    ToddlerRoutine.renderWidget(container, member.id);
                } else {
                    renderPlaceholder(container, 'My Routine', 'image', 'Visual daily routine checklist');
                }
            },
            title: 'My Routine',
            icon: 'image'
        }
    };

    /**
     * Render a placeholder widget for unimplemented features
     */
    function renderPlaceholder(container, title, icon, description) {
        container.innerHTML = `
            <div class="widget-placeholder">
                <div class="widget-placeholder__icon">
                    <i data-lucide="${icon}"></i>
                </div>
                <h3 class="widget-placeholder__title">${title}</h3>
                <p class="widget-placeholder__text">${description}</p>
                <span class="widget-placeholder__badge">Coming Soon</span>
            </div>
        `;
    }

    /**
     * Render all widgets for a member
     */
    function renderMemberWidgets(container, member) {
        const widgets = member.widgets || [];
        const availableWidgets = Storage.getAvailableWidgets(member.type) || [];
        const hasMoreWidgets = availableWidgets.some(w => !widgets.includes(w.id));

        if (widgets.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i data-lucide="layout-grid" class="empty-state__icon"></i>
                    <h3 class="empty-state__title">No widgets enabled</h3>
                    <p class="empty-state__text">Add widgets to personalize this dashboard</p>
                    <button class="btn btn--primary" id="addFirstWidgetBtn">
                        <i data-lucide="plus"></i>
                        Add Widget
                    </button>
                </div>
            `;
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
            // Bind add widget button
            document.getElementById('addFirstWidgetBtn')?.addEventListener('click', () => {
                showAddWidgetModal(member);
            });
            return;
        }

        // Use focus-based layout for kids, teens, and toddlers
        if (member.type === 'kid' || member.type === 'teen' || member.type === 'toddler') {
            renderKidWidgets(container, member, hasMoreWidgets);
            return;
        }

        // For adults, check layout preference (default to 'grid')
        const layoutPref = getAdultLayoutPreference(member.id);
        if (layoutPref === 'focus') {
            renderAdultFocusLayout(container, member, hasMoreWidgets);
            return;
        }

        // Create widget grid for adults (default grid layout)
        const gridClass = widgets.length === 1 ? 'widget-grid--single' :
                         widgets.length === 2 ? 'widget-grid--double' :
                         'widget-grid';

        container.innerHTML = `
            <div class="adult-layout-header">
                <div class="layout-toggle-group">
                    <button class="layout-toggle-btn" id="focusViewBtn" title="Focus View">
                        <i data-lucide="focus"></i>
                        <span>Focus</span>
                    </button>
                    <button class="layout-toggle-btn layout-toggle-btn--active" id="gridViewBtn" title="Grid View">
                        <i data-lucide="layout-grid"></i>
                        <span>Grid</span>
                    </button>
                </div>
            </div>
            <div class="${gridClass}" id="widgetGrid"></div>
            ${hasMoreWidgets ? `
                <div class="add-widget-section">
                    <button class="add-widget-btn" id="addWidgetBtn">
                        <i data-lucide="plus-circle"></i>
                        <span>Add Widget</span>
                    </button>
                </div>
            ` : ''}
        `;
        const grid = container.querySelector('#widgetGrid');

        // Store current member for drag operations
        currentMember = member;

        // Render each widget
        widgets.forEach((widgetId, index) => {
            const widgetConfig = widgetComponents[widgetId];
            if (!widgetConfig) return;

            const widgetCard = document.createElement('div');
            widgetCard.className = 'widget-card widget-card--draggable';
            widgetCard.dataset.widget = widgetId;
            widgetCard.dataset.index = index;
            widgetCard.draggable = true;

            const isExpandable = EXPANDABLE_WIDGETS.includes(widgetId);

            widgetCard.innerHTML = `
                <div class="widget-card__header">
                    <div class="widget-card__drag-handle" title="Drag to reorder">
                        <i data-lucide="grip-vertical"></i>
                    </div>
                    <div class="widget-card__title">
                        <i data-lucide="${widgetConfig.icon}"></i>
                        <span>${widgetConfig.title}</span>
                    </div>
                    <div class="widget-card__controls">
                        <button class="widget-card__control-btn" data-action="refresh" data-widget-id="${widgetId}" title="Refresh">
                            <i data-lucide="refresh-cw"></i>
                        </button>
                        ${isExpandable ? `
                            <button class="widget-card__control-btn" data-action="expand" data-widget-id="${widgetId}" title="Expand">
                                <i data-lucide="maximize-2"></i>
                            </button>
                        ` : ''}
                        <button class="widget-card__control-btn widget-card__control-btn--danger" data-action="hide" data-widget-id="${widgetId}" title="Hide widget">
                            <i data-lucide="eye-off"></i>
                        </button>
                    </div>
                </div>
                <div class="widget-card__body" id="widget-${widgetId}"></div>
            `;

            grid.appendChild(widgetCard);

            // Render widget content with error handling
            try {
                const widgetBody = widgetCard.querySelector(`#widget-${widgetId}`);
                widgetConfig.render(widgetBody, member);
            } catch (error) {
                console.error(`Error rendering widget "${widgetId}":`, error);
                const widgetBody = widgetCard.querySelector(`#widget-${widgetId}`);
                widgetBody.innerHTML = `
                    <div class="widget-error">
                        <p>Failed to load widget</p>
                    </div>
                `;
            }
        });

        // Bind drag and drop events
        bindDragDropEvents(grid, member);

        // Initialize icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Bind widget menu events
        bindWidgetMenuEvents(container, member);

        // Bind add widget button
        container.querySelector('#addWidgetBtn')?.addEventListener('click', () => {
            showAddWidgetModal(member);
        });

        // Bind layout toggle buttons
        container.querySelector('#focusViewBtn')?.addEventListener('click', () => {
            setAdultLayoutPreference(member.id, 'focus');
            renderMemberWidgets(container, member);
        });
    }

    /**
     * Render adult widgets with focus-based layout (like kids/toddlers)
     */
    function renderAdultFocusLayout(container, member, hasMoreWidgets) {
        const widgets = member.widgets || [];

        // Get or set focused widget (default to first widget)
        if (!focusedWidgets[member.id] || !widgets.includes(focusedWidgets[member.id])) {
            focusedWidgets[member.id] = widgets[0];
        }
        const focusedWidgetId = focusedWidgets[member.id];
        const collapsedWidgets = widgets.filter(w => w !== focusedWidgetId);

        const focusedConfig = widgetComponents[focusedWidgetId];
        const isFocusedExpandable = EXPANDABLE_WIDGETS.includes(focusedWidgetId);

        container.innerHTML = `
            <div class="adult-layout-header">
                <div class="layout-toggle-group">
                    <button class="layout-toggle-btn layout-toggle-btn--active" id="focusViewBtn" title="Focus View">
                        <i data-lucide="focus"></i>
                        <span>Focus</span>
                    </button>
                    <button class="layout-toggle-btn" id="gridViewBtn" title="Grid View">
                        <i data-lucide="layout-grid"></i>
                        <span>Grid</span>
                    </button>
                </div>
            </div>
            <div class="adult-focus-layout">
                <!-- Focused Widget -->
                <div class="widget-card widget--focused widget--focused-adult" data-widget="${focusedWidgetId}">
                    <div class="widget-card__header widget__header">
                        <div class="widget-card__title">
                            <i data-lucide="${focusedConfig?.icon || 'star'}"></i>
                            <h3>${focusedConfig?.title || 'Widget'}</h3>
                        </div>
                        <div class="widget-card__controls">
                            <button class="widget-card__control-btn" data-action="refresh" data-widget-id="${focusedWidgetId}" title="Refresh">
                                <i data-lucide="refresh-cw"></i>
                            </button>
                            ${isFocusedExpandable ? `
                                <button class="widget-card__control-btn" data-action="expand" data-widget-id="${focusedWidgetId}" title="Expand">
                                    <i data-lucide="maximize-2"></i>
                                </button>
                            ` : ''}
                            <button class="widget-card__control-btn widget-card__control-btn--danger" data-action="hide" data-widget-id="${focusedWidgetId}" title="Hide widget">
                                <i data-lucide="eye-off"></i>
                            </button>
                        </div>
                    </div>
                    <div class="widget-card__body widget__body" id="widget-${focusedWidgetId}"></div>
                </div>

                <!-- Collapsed Widgets -->
                ${collapsedWidgets.length > 0 ? `
                    <div class="widgets-collapsed-row widgets-collapsed-row--adult">
                        ${collapsedWidgets.map(widgetId => {
                            const config = widgetComponents[widgetId];
                            const summary = getWidgetSummaryForAdult(member.id, widgetId);
                            return `
                                <div class="widget--collapsed widget--collapsed-adult hover-bounce" data-widget="${widgetId}" data-focus-widget="${widgetId}">
                                    <div class="widget--collapsed__icon widget--collapsed__icon--${widgetId}">
                                        <i data-lucide="${config?.icon || 'star'}"></i>
                                    </div>
                                    <span class="widget--collapsed__title">${config?.title || 'Widget'}</span>
                                    <span class="widget--collapsed__subtitle">${summary}</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                ` : ''}

                ${hasMoreWidgets ? `
                    <div class="add-widget-section">
                        <button class="add-widget-btn" id="addWidgetBtn">
                            <i data-lucide="plus-circle"></i>
                            <span>Add Widget</span>
                        </button>
                    </div>
                ` : ''}
            </div>
        `;

        // Render focused widget content
        try {
            const widgetBody = container.querySelector(`#widget-${focusedWidgetId}`);
            if (widgetBody && focusedConfig) {
                focusedConfig.render(widgetBody, member);
            }
        } catch (error) {
            console.error(`Error rendering focused widget "${focusedWidgetId}":`, error);
        }

        // Initialize icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Bind collapsed widget clicks
        container.querySelectorAll('[data-focus-widget]').forEach(card => {
            card.addEventListener('click', () => {
                const widgetId = card.dataset.focusWidget;
                setFocusedWidget(member.id, widgetId);
                renderAdultFocusLayout(container, member, hasMoreWidgets);

                // Scroll to expanded widget on mobile
                setTimeout(() => {
                    const expandedWidget = container.querySelector('.widget-card:not([data-focus-widget])');
                    if (expandedWidget && window.innerWidth <= 1024) {
                        // Get header and tabs heights
                        const header = document.querySelector('.header');
                        const tabs = document.querySelector('.tabs');
                        const headerHeight = (header?.offsetHeight || 0) + (tabs?.offsetHeight || 0);

                        // Scroll to widget accounting for fixed header
                        const widgetTop = expandedWidget.getBoundingClientRect().top + window.scrollY;
                        window.scrollTo({
                            top: widgetTop - headerHeight - 16, // 16px for small margin
                            behavior: 'smooth'
                        });
                    }
                }, 100);
            });
        });

        // Bind widget menu events
        bindWidgetMenuEvents(container, member);

        // Bind add widget button
        container.querySelector('#addWidgetBtn')?.addEventListener('click', () => {
            showAddWidgetModal(member);
        });

        // Bind layout toggle buttons
        container.querySelector('#gridViewBtn')?.addEventListener('click', () => {
            setAdultLayoutPreference(member.id, 'grid');
            renderMemberWidgets(container, member);
        });
    }

    /**
     * Get summary text for collapsed adult widget
     */
    function getWidgetSummaryForAdult(memberId, widgetId) {
        const today = typeof DateUtils !== 'undefined' ? DateUtils.today() : new Date().toISOString().split('T')[0];

        switch (widgetId) {
            case 'meal-plan': {
                const data = Storage.getWidgetData(memberId, 'meal-plan') || {};
                const todayMeals = data.weeklyPlans?.[today] || {};
                const mealCount = Object.keys(todayMeals).filter(k => todayMeals[k]).length;
                return mealCount > 0 ? `${mealCount} meals today` : 'Plan meals';
            }
            case 'task-list': {
                const data = Storage.getWidgetData(memberId, 'task-list') || {};
                const tasks = data.tasks || [];
                const pending = tasks.filter(t => !t.completed).length;
                return pending > 0 ? `${pending} pending` : 'All done!';
            }
            case 'workout': {
                const data = Storage.getWidgetData(memberId, 'workout') || {};
                const todayLog = data.log?.[today];
                return todayLog ? 'Logged today' : 'Log workout';
            }
            case 'gratitude': {
                const data = Storage.getWidgetData(memberId, 'gratitude') || {};
                const todayEntries = (data.entries || []).filter(e => e.date === today);
                return todayEntries.length > 0 ? `${todayEntries.length} entries` : 'Write today';
            }
            case 'habits': {
                const data = Storage.getWidgetData(memberId, 'habits') || {};
                const habits = data.habits || [];
                const todayLog = data.log?.[today] || [];
                const done = todayLog.length;
                return `${done}/${habits.length} done`;
            }
            case 'recipes': {
                const data = Storage.getWidgetData(memberId, 'recipes') || {};
                const count = data.recipes?.length || 0;
                return `${count} recipes`;
            }
            case 'grocery': {
                const data = Storage.getWidgetData(memberId, 'grocery') || {};
                const items = data.items || [];
                const pending = items.filter(i => !i.checked).length;
                return pending > 0 ? `${pending} items` : 'List empty';
            }
            case 'routine': {
                const data = Storage.getWidgetData(memberId, 'routine') || {};
                const count = data.routines?.length || 0;
                return `${count} routines`;
            }
            case 'vision-board': {
                const data = Storage.getWidgetData(memberId, 'vision-board') || {};
                const goals = data.goals || [];
                const active = goals.filter(g => !g.completed).length;
                return `${active} goals`;
            }
            case 'journal': {
                const data = Storage.getWidgetData(memberId, 'journal') || {};
                const todayEntry = (data.entries || []).find(e => e.date === today);
                return todayEntry ? 'Written today' : 'Write today';
            }
            default:
                return 'Tap to open';
        }
    }

    /**
     * Get adult layout preference from storage
     */
    function getAdultLayoutPreference(memberId) {
        // First check in-memory cache
        if (adultLayoutPrefs[memberId]) {
            return adultLayoutPrefs[memberId];
        }
        // Then check storage
        const member = Storage.getMember(memberId);
        const pref = member?.layoutPreference || 'grid';
        adultLayoutPrefs[memberId] = pref;
        return pref;
    }

    /**
     * Set adult layout preference and save to storage
     */
    function setAdultLayoutPreference(memberId, preference) {
        adultLayoutPrefs[memberId] = preference;
        Storage.updateMember(memberId, { layoutPreference: preference });
    }

    /**
     * Get kid/toddler layout preference from storage
     */
    function getKidLayoutPreference(memberId) {
        // First check in-memory cache
        if (kidLayoutPrefs[memberId]) {
            return kidLayoutPrefs[memberId];
        }
        // Then check storage (default to 'focus' for kids/toddlers)
        const member = Storage.getMember(memberId);
        const pref = member?.layoutPreference || 'focus';
        kidLayoutPrefs[memberId] = pref;
        return pref;
    }

    /**
     * Set kid/toddler layout preference and save to storage
     */
    function setKidLayoutPreference(memberId, preference) {
        kidLayoutPrefs[memberId] = preference;
        Storage.updateMember(memberId, { layoutPreference: preference });
    }


    /**
     * Render kid/toddler widgets - checks layout preference first
     */
    function renderKidWidgets(container, member, hasMoreWidgets) {
        // Check layout preference (default to 'focus' for kids/toddlers)
        const layoutPref = getKidLayoutPreference(member.id);
        if (layoutPref === 'grid') {
            renderKidGridLayout(container, member, hasMoreWidgets);
            return;
        }

        // Default: focus-based layout
        renderKidFocusLayout(container, member, hasMoreWidgets);
    }

    /**
     * Render kid widgets with focus-based layout
     * One widget expanded at top, others collapsed at bottom
     */
    function renderKidFocusLayout(container, member, hasMoreWidgets) {
        // Get widgets and sort to ensure preferred order for toddlers
        let widgets = member.widgets || [];

        // For toddlers, ensure 'toddler-routine' is first if it exists
        if (member.type === 'toddler' && widgets.includes('toddler-routine')) {
            widgets = ['toddler-routine', ...widgets.filter(w => w !== 'toddler-routine')];
        }

        // Get or set focused widget (default to first widget)
        if (!focusedWidgets[member.id] || !widgets.includes(focusedWidgets[member.id])) {
            focusedWidgets[member.id] = widgets[0];
        }
        const focusedWidgetId = focusedWidgets[member.id];
        const collapsedWidgets = widgets.filter(w => w !== focusedWidgetId);

        const focusedConfig = widgetComponents[focusedWidgetId];
        const isFocusedExpandable = EXPANDABLE_WIDGETS.includes(focusedWidgetId);

        container.innerHTML = `
            <div class="kids-layout-header">
                <div class="layout-toggle-group">
                    <button class="layout-toggle-btn layout-toggle-btn--active" id="focusViewBtn" title="Focus View">
                        <i data-lucide="focus"></i>
                        <span>Focus</span>
                    </button>
                    <button class="layout-toggle-btn" id="gridViewBtn" title="Grid View">
                        <i data-lucide="layout-grid"></i>
                        <span>Grid</span>
                    </button>
                </div>
            </div>
            <div class="kids-layout">
                <!-- Focused Widget -->
                <div class="widget-card widget--focused" data-widget="${focusedWidgetId}">
                    <div class="widget-card__header widget__header">
                        <div class="widget-card__title">
                            <i data-lucide="${focusedConfig?.icon || 'star'}"></i>
                            <h3>${focusedConfig?.title || 'Widget'}</h3>
                        </div>
                        <div class="widget-card__controls">
                            <button class="widget-card__control-btn" data-action="refresh" data-widget-id="${focusedWidgetId}" title="Refresh">
                                <i data-lucide="refresh-cw"></i>
                            </button>
                            ${isFocusedExpandable ? `
                                <button class="widget-card__control-btn" data-action="expand" data-widget-id="${focusedWidgetId}" title="Expand">
                                    <i data-lucide="maximize-2"></i>
                                </button>
                            ` : ''}
                            <button class="widget-card__control-btn widget-card__control-btn--danger" data-action="hide" data-widget-id="${focusedWidgetId}" title="Hide widget">
                                <i data-lucide="eye-off"></i>
                            </button>
                        </div>
                    </div>
                    <div class="widget-card__body widget__body" id="widget-${focusedWidgetId}"></div>
                </div>

                <!-- Collapsed Widgets -->
                ${collapsedWidgets.length > 0 ? `
                    <div class="widgets-collapsed-row">
                        ${collapsedWidgets.map(widgetId => {
                            const config = widgetComponents[widgetId];
                            const summary = getWidgetSummary(member.id, widgetId);
                            return `
                                <div class="widget--collapsed hover-bounce" data-widget="${widgetId}" data-focus-widget="${widgetId}">
                                    <div class="widget--collapsed__icon widget--collapsed__icon--${widgetId}">
                                        <i data-lucide="${config?.icon || 'star'}"></i>
                                    </div>
                                    <span class="widget--collapsed__title">${config?.title || 'Widget'}</span>
                                    <span class="widget--collapsed__subtitle">${summary}</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                ` : ''}

                ${hasMoreWidgets ? `
                    <div class="add-widget-section">
                        <button class="add-widget-btn" id="addWidgetBtn">
                            <i data-lucide="plus-circle"></i>
                            <span>Add Widget</span>
                        </button>
                    </div>
                ` : ''}
            </div>
        `;

        // Render focused widget content
        try {
            const widgetBody = container.querySelector(`#widget-${focusedWidgetId}`);
            if (widgetBody && focusedConfig) {
                focusedConfig.render(widgetBody, member);
            }
        } catch (error) {
            console.error(`Error rendering focused widget "${focusedWidgetId}":`, error);
        }

        // Initialize icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Bind collapsed widget clicks
        container.querySelectorAll('[data-focus-widget]').forEach(card => {
            card.addEventListener('click', () => {
                const widgetId = card.dataset.focusWidget;
                setFocusedWidget(member.id, widgetId);
                renderKidWidgets(container, member, hasMoreWidgets);

                // Scroll to expanded widget on mobile
                setTimeout(() => {
                    const expandedWidget = container.querySelector('.widget-card:not([data-focus-widget])');
                    if (expandedWidget && window.innerWidth <= 1024) {
                        // Get header and tabs heights
                        const header = document.querySelector('.header');
                        const tabs = document.querySelector('.tabs');
                        const headerHeight = (header?.offsetHeight || 0) + (tabs?.offsetHeight || 0);

                        // Scroll to widget accounting for fixed header
                        const widgetTop = expandedWidget.getBoundingClientRect().top + window.scrollY;
                        window.scrollTo({
                            top: widgetTop - headerHeight - 16, // 16px for small margin
                            behavior: 'smooth'
                        });
                    }
                }, 100);
            });
        });

        // Bind widget menu events
        bindWidgetMenuEvents(container, member);

        // Bind add widget button
        container.querySelector('#addWidgetBtn')?.addEventListener('click', () => {
            showAddWidgetModal(member);
        });

        // Bind layout toggle buttons
        container.querySelector('#gridViewBtn')?.addEventListener('click', () => {
            setKidLayoutPreference(member.id, 'grid');
            renderMemberWidgets(container, member);
        });
    }

    /**
     * Render kid/toddler widgets with grid layout (like adults)
     */
    function renderKidGridLayout(container, member, hasMoreWidgets) {
        const widgets = member.widgets || [];

        const gridClass = widgets.length === 1 ? 'widget-grid--single' :
                         widgets.length === 2 ? 'widget-grid--double' :
                         'widget-grid';

        container.innerHTML = `
            <div class="kids-layout-header">
                <div class="layout-toggle-group">
                    <button class="layout-toggle-btn" id="focusViewBtn" title="Focus View">
                        <i data-lucide="focus"></i>
                        <span>Focus</span>
                    </button>
                    <button class="layout-toggle-btn layout-toggle-btn--active" id="gridViewBtn" title="Grid View">
                        <i data-lucide="layout-grid"></i>
                        <span>Grid</span>
                    </button>
                </div>
            </div>
            <div class="${gridClass} kids-grid" id="widgetGrid"></div>
            ${hasMoreWidgets ? `
                <div class="add-widget-section">
                    <button class="add-widget-btn" id="addWidgetBtn">
                        <i data-lucide="plus-circle"></i>
                        <span>Add Widget</span>
                    </button>
                </div>
            ` : ''}
        `;

        const grid = container.querySelector('#widgetGrid');

        // Store current member for drag operations
        currentMember = member;

        // Render each widget
        widgets.forEach((widgetId, index) => {
            const widgetConfig = widgetComponents[widgetId];
            if (!widgetConfig) return;

            const widgetCard = document.createElement('div');
            widgetCard.className = 'widget-card widget-card--kid-grid widget-card--draggable';
            widgetCard.dataset.widget = widgetId;
            widgetCard.dataset.index = index;
            widgetCard.draggable = true;

            const isExpandable = EXPANDABLE_WIDGETS.includes(widgetId);

            widgetCard.innerHTML = `
                <div class="widget-card__header">
                    <div class="widget-card__drag-handle" title="Drag to reorder">
                        <i data-lucide="grip-vertical"></i>
                    </div>
                    <div class="widget-card__title">
                        <i data-lucide="${widgetConfig.icon}"></i>
                        <span>${widgetConfig.title}</span>
                    </div>
                    <div class="widget-card__controls">
                        <button class="widget-card__control-btn" data-action="refresh" data-widget-id="${widgetId}" title="Refresh">
                            <i data-lucide="refresh-cw"></i>
                        </button>
                        ${isExpandable ? `
                            <button class="widget-card__control-btn" data-action="expand" data-widget-id="${widgetId}" title="Expand">
                                <i data-lucide="maximize-2"></i>
                            </button>
                        ` : ''}
                        <button class="widget-card__control-btn widget-card__control-btn--danger" data-action="hide" data-widget-id="${widgetId}" title="Hide widget">
                            <i data-lucide="eye-off"></i>
                        </button>
                    </div>
                </div>
                <div class="widget-card__body" id="widget-${widgetId}"></div>
            `;

            grid.appendChild(widgetCard);

            // Render widget content with error handling
            try {
                const widgetBody = widgetCard.querySelector(`#widget-${widgetId}`);
                widgetConfig.render(widgetBody, member);
            } catch (error) {
                console.error(`Error rendering widget "${widgetId}":`, error);
                const widgetBody = widgetCard.querySelector(`#widget-${widgetId}`);
                widgetBody.innerHTML = `
                    <div class="widget-error">
                        <p>Failed to load widget</p>
                    </div>
                `;
            }
        });

        // Initialize icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Bind widget menu events
        bindWidgetMenuEvents(container, member);

        // Bind drag and drop events
        bindDragDropEvents(grid, member);

        // Bind add widget button
        container.querySelector('#addWidgetBtn')?.addEventListener('click', () => {
            showAddWidgetModal(member);
        });

        // Bind layout toggle buttons
        container.querySelector('#focusViewBtn')?.addEventListener('click', () => {
            setKidLayoutPreference(member.id, 'focus');
            renderMemberWidgets(container, member);
        });
    }

    /**
     * Set the focused widget for a kid member
     */
    function setFocusedWidget(memberId, widgetId) {
        focusedWidgets[memberId] = widgetId;
    }

    /**
     * Get summary text for collapsed widget
     */
    function getWidgetSummary(memberId, widgetId) {
        const today = typeof DateUtils !== 'undefined' ? DateUtils.today() : new Date().toISOString().split('T')[0];

        switch (widgetId) {
            // Kid widgets
            case 'points': {
                const data = Storage.getWidgetData(memberId, 'points') || {};
                return `${data.balance || 0} pts`;
            }
            case 'rewards': {
                const pointsData = Storage.getWidgetData(memberId, 'points') || {};
                return `${pointsData.balance || 0} pts avail`;
            }
            case 'achievements': {
                const data = Storage.getWidgetData(memberId, 'achievements') || {};
                const earned = data.notifiedBadges?.length || 0;
                return `${earned} badges`;
            }
            case 'chores': {
                return 'View chores';
            }
            case 'screen-time': {
                return 'View time';
            }
            case 'kid-tasks':
            case 'toddler-tasks': {
                const data = Storage.getWidgetData(memberId, widgetId) || {};
                const tasks = data.tasks || [];
                const pending = tasks.filter(t => !t.completed).length;
                return pending > 0 ? `${pending} to do` : 'All done!';
            }
            case 'kid-journal': {
                const data = Storage.getWidgetData(memberId, 'kid-journal') || {};
                const todayEntries = (data.entries || []).filter(e => e.date === today);
                return todayEntries.length > 0 ? `${todayEntries.length} today` : 'Write today';
            }
            case 'kid-workout': {
                const data = Storage.getWidgetData(memberId, 'kid-workout') || {};
                const todayLog = (data.log || []).filter(e => e.date === today);
                const minutes = todayLog.reduce((sum, e) => sum + (e.duration || 0), 0);
                return minutes > 0 ? `${minutes}m today` : 'Get moving!';
            }
            case 'vision-board': {
                const data = Storage.getWidgetData(memberId, 'vision-board') || {};
                const goals = data.goals || [];
                const active = goals.filter(g => !g.completed).length;
                return `${active} dreams`;
            }
            // Toddler widgets
            case 'activities': {
                const data = Storage.getWidgetData(memberId, 'activities') || {};
                const done = data.completedToday?.length || 0;
                return done > 0 ? `${done} done today` : 'Pick activity';
            }
            case 'daily-log': {
                const data = Storage.getWidgetData(memberId, 'daily-log') || {};
                const todayLog = data.logs?.[today] || {};
                const entries = Object.keys(todayLog).length;
                return entries > 0 ? `${entries} logged` : 'Start logging';
            }
            case 'milestones': {
                const data = Storage.getWidgetData(memberId, 'milestones') || {};
                const achieved = data.achieved?.length || 0;
                return `${achieved} achieved`;
            }
            case 'routine': {
                return 'View routine';
            }
            case 'toddler-routine': {
                const data = Storage.getWidgetData(memberId, 'toddler-routine') || {};
                const completed = data.completedToday?.length || 0;
                const total = data.routines?.length || 0;
                return total > 0 ? `${completed}/${total} done` : 'Set up routine';
            }
            default:
                return 'Tap to open';
        }
    }

    /**
     * Bind drag and drop events for widget reordering
     */
    function bindDragDropEvents(grid, member) {
        const widgetCards = grid.querySelectorAll('.widget-card');

        // Touch drag state
        let touchDragState = {
            isDragging: false,
            startY: 0,
            startX: 0,
            currentY: 0,
            currentX: 0,
            placeholder: null,
            clone: null
        };

        widgetCards.forEach(card => {
            // ===== MOUSE DRAG EVENTS =====
            // Drag start
            card.addEventListener('dragstart', (e) => {
                draggedWidget = card;
                draggedIndex = parseInt(card.dataset.index);
                card.classList.add('widget-card--dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', card.dataset.widget);
            });

            // Drag end
            card.addEventListener('dragend', () => {
                card.classList.remove('widget-card--dragging');
                draggedWidget = null;
                draggedIndex = null;
                // Remove all drag-over classes
                grid.querySelectorAll('.widget-card--drag-over').forEach(el => {
                    el.classList.remove('widget-card--drag-over');
                });
            });

            // Drag over
            card.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (draggedWidget && card !== draggedWidget) {
                    card.classList.add('widget-card--drag-over');
                }
            });

            // Drag leave
            card.addEventListener('dragleave', () => {
                card.classList.remove('widget-card--drag-over');
            });

            // Drop
            card.addEventListener('drop', (e) => {
                e.preventDefault();
                card.classList.remove('widget-card--drag-over');

                if (draggedWidget && card !== draggedWidget) {
                    const targetIndex = parseInt(card.dataset.index);
                    const sourceWidgetId = draggedWidget.dataset.widget;

                    // Reorder widgets in storage
                    reorderWidgets(member.id, draggedIndex, targetIndex);

                    // Re-render widgets
                    const container = grid.parentElement;
                    const updatedMember = Storage.getMember(member.id);
                    renderMemberWidgets(container, updatedMember);

                    Toast.success('Widget order updated');
                }
            });

            // ===== TOUCH EVENTS FOR MOBILE =====
            const dragHandle = card.querySelector('.widget-card__drag-handle');

            if (dragHandle) {
                dragHandle.addEventListener('touchstart', (e) => {
                    const touch = e.touches[0];
                    touchDragState.isDragging = true;
                    touchDragState.startY = touch.clientY;
                    touchDragState.startX = touch.clientX;
                    touchDragState.currentY = touch.clientY;
                    touchDragState.currentX = touch.clientX;

                    draggedWidget = card;
                    draggedIndex = parseInt(card.dataset.index);

                    // Create placeholder
                    touchDragState.placeholder = card.cloneNode(false);
                    touchDragState.placeholder.classList.add('widget-card--placeholder');
                    touchDragState.placeholder.style.height = card.offsetHeight + 'px';
                    touchDragState.placeholder.innerHTML = '';

                    // Create dragging clone
                    touchDragState.clone = card.cloneNode(true);
                    touchDragState.clone.classList.add('widget-card--touch-dragging');
                    touchDragState.clone.style.position = 'fixed';
                    touchDragState.clone.style.width = card.offsetWidth + 'px';
                    touchDragState.clone.style.height = card.offsetHeight + 'px';
                    touchDragState.clone.style.zIndex = '9999';
                    touchDragState.clone.style.pointerEvents = 'none';
                    touchDragState.clone.style.opacity = '0.9';
                    touchDragState.clone.style.left = card.getBoundingClientRect().left + 'px';
                    touchDragState.clone.style.top = card.getBoundingClientRect().top + 'px';

                    document.body.appendChild(touchDragState.clone);

                    // Hide original card
                    card.style.opacity = '0.3';

                    // Prevent scrolling while dragging
                    e.preventDefault();
                }, { passive: false });

                dragHandle.addEventListener('touchmove', (e) => {
                    if (!touchDragState.isDragging) return;

                    const touch = e.touches[0];
                    touchDragState.currentY = touch.clientY;
                    touchDragState.currentX = touch.clientX;

                    // Move clone with touch
                    const deltaY = touchDragState.currentY - touchDragState.startY;
                    const deltaX = touchDragState.currentX - touchDragState.startX;

                    if (touchDragState.clone) {
                        touchDragState.clone.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
                    }

                    // Determine which card we're over
                    const afterElement = getTouchAfterElement(grid, touchDragState.currentY);

                    if (!touchDragState.placeholder.parentNode) {
                        if (afterElement == null) {
                            grid.appendChild(touchDragState.placeholder);
                        } else {
                            grid.insertBefore(touchDragState.placeholder, afterElement);
                        }
                    } else {
                        if (afterElement == null) {
                            grid.appendChild(touchDragState.placeholder);
                        } else if (afterElement !== touchDragState.placeholder) {
                            grid.insertBefore(touchDragState.placeholder, afterElement);
                        }
                    }

                    // Prevent scrolling
                    e.preventDefault();
                }, { passive: false });

                dragHandle.addEventListener('touchend', () => {
                    if (!touchDragState.isDragging) return;

                    // Find final position
                    const placeholderIndex = Array.from(grid.children).indexOf(touchDragState.placeholder);
                    const originalIndex = draggedIndex;

                    // Clean up
                    if (touchDragState.clone) {
                        touchDragState.clone.remove();
                    }
                    if (touchDragState.placeholder && touchDragState.placeholder.parentNode) {
                        touchDragState.placeholder.remove();
                    }
                    card.style.opacity = '';

                    // Reset state
                    touchDragState.isDragging = false;
                    touchDragState.placeholder = null;
                    touchDragState.clone = null;

                    // Reorder if position changed
                    if (placeholderIndex !== -1 && placeholderIndex !== originalIndex) {
                        reorderWidgets(member.id, originalIndex, placeholderIndex);

                        // Re-render widgets
                        const container = grid.parentElement;
                        const updatedMember = Storage.getMember(member.id);
                        renderMemberWidgets(container, updatedMember);

                        Toast.success('Widget order updated');
                    }

                    draggedWidget = null;
                    draggedIndex = null;
                });

                dragHandle.addEventListener('touchcancel', () => {
                    if (!touchDragState.isDragging) return;

                    // Clean up on cancel
                    if (touchDragState.clone) {
                        touchDragState.clone.remove();
                    }
                    if (touchDragState.placeholder && touchDragState.placeholder.parentNode) {
                        touchDragState.placeholder.remove();
                    }
                    if (draggedWidget) {
                        draggedWidget.style.opacity = '';
                    }

                    touchDragState.isDragging = false;
                    touchDragState.placeholder = null;
                    touchDragState.clone = null;
                    draggedWidget = null;
                    draggedIndex = null;
                });
            }
        });
    }

    /**
     * Get the element to insert placeholder after during touch drag
     */
    function getTouchAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.widget-card:not(.widget-card--placeholder)')].filter(
            el => el !== draggedWidget
        );

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;

            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    /**
     * Reorder widgets in storage
     */
    function reorderWidgets(memberId, fromIndex, toIndex) {
        const member = Storage.getMember(memberId);
        if (!member || !member.widgets) return;

        const widgets = [...member.widgets];
        const [movedWidget] = widgets.splice(fromIndex, 1);
        widgets.splice(toIndex, 0, movedWidget);

        Storage.updateMember(memberId, { widgets });
    }

    /**
     * Bind widget control button events (refresh, expand, hide)
     */
    function bindWidgetMenuEvents(container, member) {
        // Refresh buttons
        container.querySelectorAll('[data-action="refresh"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const widgetId = btn.dataset.widgetId;
                const widgetBody = document.querySelector(`#widget-${widgetId}`);
                if (widgetBody && widgetComponents[widgetId]) {
                    widgetComponents[widgetId].render(widgetBody, member);
                    if (typeof lucide !== 'undefined') {
                        lucide.createIcons();
                    }
                }
                Toast.success('Widget refreshed');
            });
        });

        // Expand buttons
        container.querySelectorAll('[data-action="expand"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const widgetId = btn.dataset.widgetId;
                expandWidget(widgetId, member);
            });
        });

        // Hide buttons
        container.querySelectorAll('[data-action="hide"]').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const widgetId = btn.dataset.widgetId;

                const verified = await PIN.verify();
                if (!verified) return;

                // Remove widget from member's widget list
                const updatedWidgets = (member.widgets || []).filter(w => w !== widgetId);
                Storage.updateMember(member.id, { widgets: updatedWidgets });

                // Re-render
                State.emit('tabChanged', member.id);
                Toast.success('Widget hidden');
            });
        });
    }

    /**
     * Expand a widget to full page view
     */
    function expandWidget(widgetId, member) {
        // Map widget IDs to their full page functions (using correct exported function names)
        const expandHandlers = {
            'points': () => typeof Points !== 'undefined' && Points.showHistoryPage ? Points.showHistoryPage(member.id) : null,
            'task-list': () => typeof Tasks !== 'undefined' && Tasks.showTasksFullPage ? Tasks.showTasksFullPage(member.id) : null,
            'kid-tasks': () => typeof KidTasks !== 'undefined' && KidTasks.showFullPage ? KidTasks.showFullPage(member.id) : null,
            'toddler-tasks': () => typeof ToddlerTasks !== 'undefined' && ToddlerTasks.showFullPage ? ToddlerTasks.showFullPage(member.id) : null,
            'kid-journal': () => typeof KidJournal !== 'undefined' && KidJournal.showFullPage ? KidJournal.showFullPage(member.id) : null,
            'kid-workout': () => typeof KidWorkout !== 'undefined' && KidWorkout.showFullPage ? KidWorkout.showFullPage(member.id) : null,
            'vision-board': () => typeof VisionBoard !== 'undefined' && VisionBoard.showFullPage ? VisionBoard.showFullPage(member.id) : null,
            'workout': () => typeof Workout !== 'undefined' && Workout.showHistoryPage ? Workout.showHistoryPage(member.id) : null,
            'gratitude': () => typeof Gratitude !== 'undefined' && Gratitude.showJournalPage ? Gratitude.showJournalPage(member.id) : null,
            'habits': () => typeof Habits !== 'undefined' && Habits.showStatsPage ? Habits.showStatsPage(member.id) : null,
            'meal-plan': () => typeof Meals !== 'undefined' && Meals.showWeeklyPlannerPage ? Meals.showWeeklyPlannerPage(member.id) : null,
            'recipes': () => typeof Recipes !== 'undefined' && Recipes.showRecipesPage ? Recipes.showRecipesPage(member.id) : null,
            'grocery': () => typeof Grocery !== 'undefined' && Grocery.showGroceryListPage ? Grocery.showGroceryListPage(member.id) : null,
            'routine': () => typeof Routine !== 'undefined' && Routine.showRoutinesPage ? Routine.showRoutinesPage(member.id) : null,
            'daily-log': () => typeof DailyLog !== 'undefined' && DailyLog.showFullPage ? DailyLog.showFullPage(member.id) : null,
            'toddler-routine': () => typeof ToddlerRoutine !== 'undefined' && ToddlerRoutine.showFullPage ? ToddlerRoutine.showFullPage(member.id) : null,
            'activities': () => typeof Activities !== 'undefined' && Activities.showFullPage ? Activities.showFullPage(member.id) : null,
            'journal': () => typeof Journal !== 'undefined' && Journal.showJournalPage ? Journal.showJournalPage(member.id) : null
        };

        const handler = expandHandlers[widgetId];
        if (handler) {
            handler();
        } else {
            Toast.info('Full view not available for this widget');
        }
    }

    /**
     * Get widget info by ID
     */
    function getWidgetInfo(widgetId) {
        return widgetComponents[widgetId] || null;
    }

    /**
     * Register a new widget component
     */
    function registerWidget(widgetId, config) {
        widgetComponents[widgetId] = config;
    }

    /**
     * Show modal to add new widgets
     */
    function showAddWidgetModal(member) {
        const availableWidgets = Storage.getAvailableWidgets(member.type) || [];
        const currentWidgets = member.widgets || [];
        const unaddedWidgets = availableWidgets.filter(w => !currentWidgets.includes(w.id));

        if (unaddedWidgets.length === 0) {
            Toast.info('All available widgets are already added!');
            return;
        }

        const content = `
            <div class="add-widget-modal">
                <div class="add-widget-modal__header">
                    <p class="add-widget-modal__intro">Select widgets to add to ${member.name}'s dashboard:</p>
                    <button type="button" class="btn btn--sm btn--ghost" id="selectAllWidgetsBtn">
                        <i data-lucide="check-square"></i>
                        Select All
                    </button>
                </div>
                <div class="add-widget-modal__list">
                    ${unaddedWidgets.map(widget => `
                        <label class="add-widget-option" data-widget-id="${widget.id}">
                            <input type="checkbox" class="add-widget-option__checkbox" value="${widget.id}">
                            <div class="add-widget-option__icon">
                                <i data-lucide="${widget.icon}"></i>
                            </div>
                            <div class="add-widget-option__info">
                                <span class="add-widget-option__name">${widget.name}</span>
                                <span class="add-widget-option__desc">${widget.description}</span>
                            </div>
                        </label>
                    `).join('')}
                </div>
            </div>
        `;

        Modal.open({
            title: 'Add Widgets',
            content,
            footer: Modal.createFooter('Cancel', 'Add Selected')
        });

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Setup Select All button
        const selectAllBtn = document.getElementById('selectAllWidgetsBtn');
        const widgetList = document.querySelector('.add-widget-modal__list');

        selectAllBtn?.addEventListener('click', () => {
            const checkboxes = widgetList.querySelectorAll('.add-widget-option__checkbox');
            const allChecked = Array.from(checkboxes).every(cb => cb.checked);

            checkboxes.forEach(cb => {
                cb.checked = !allChecked;
            });

            // Update button text
            selectAllBtn.innerHTML = allChecked
                ? '<i data-lucide="check-square"></i> Select All'
                : '<i data-lucide="square"></i> Deselect All';

            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        });

        Modal.bindFooterEvents(() => {
            const selectedWidgets = [];
            document.querySelectorAll('.add-widget-option__checkbox:checked').forEach(cb => {
                selectedWidgets.push(cb.value);
            });

            if (selectedWidgets.length === 0) {
                Toast.warning('Please select at least one widget');
                return false;
            }

            // Add widgets to member
            selectedWidgets.forEach(widgetId => {
                Storage.addWidgetToMember(member.id, widgetId);
            });

            Toast.success(`Added ${selectedWidgets.length} widget${selectedWidgets.length > 1 ? 's' : ''}!`);

            // Re-render
            State.emit('tabChanged', member.id);
            return true;
        });
    }

    // Public API
    return {
        renderMemberWidgets,
        getWidgetInfo,
        registerWidget
    };
})();
