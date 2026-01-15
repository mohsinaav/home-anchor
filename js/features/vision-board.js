/**
 * Vision Board Feature
 * Goal-focused vision board with progress tracking for adults
 * Includes image support and visual progress indicators
 */

const VisionBoard = (function() {
    // Default zones for the vision board template layout
    const DEFAULT_ZONES = [
        { id: 'zone-health', title: 'Health', shape: 'circle', isDefault: true, order: 1 },
        { id: 'zone-career', title: 'Career & Finances', shape: 'rectangle', isDefault: true, order: 2 },
        { id: 'zone-relationships', title: 'Relationships & Social Life', shape: 'rectangle', isDefault: true, order: 3 },
        { id: 'zone-travel', title: 'Travel', shape: 'circle', isDefault: true, order: 4 },
        { id: 'zone-fitness', title: 'Fitness', shape: 'circle', isDefault: true, order: 5 },
        { id: 'zone-spirituality', title: 'Spirituality & Mindfulness', shape: 'rectangle', isDefault: true, order: 6 }
    ];

    // Category to zone mapping for migration
    const CATEGORY_TO_ZONE_MAP = {
        'health': 'zone-health',
        'mental': 'zone-health',
        'career': 'zone-career',
        'financial': 'zone-career',
        'family': 'zone-relationships',
        'spouse': 'zone-relationships',
        'social': 'zone-relationships',
        'travel': 'zone-travel',
        'fitness': 'zone-fitness',
        'spiritual': 'zone-spirituality',
        'education': 'zone-career',
        'creative': 'zone-fitness',
        'personal': 'zone-health',
        'kids': 'zone-relationships',
        'other': 'zone-health'
    };

    // Goal categories with icons and colors - expanded life areas
    const GOAL_CATEGORIES = [
        { id: 'health', name: 'Health & Fitness', icon: 'heart', color: '#EF4444' },
        { id: 'mental', name: 'Mental Wellness', icon: 'brain', color: '#8B5CF6' },
        { id: 'career', name: 'Career & Professional', icon: 'briefcase', color: '#6366F1' },
        { id: 'financial', name: 'Financial', icon: 'wallet', color: '#10B981' },
        { id: 'family', name: 'Family', icon: 'users', color: '#EC4899' },
        { id: 'spouse', name: 'For My Spouse', icon: 'heart-handshake', color: '#F43F5E' },
        { id: 'kids', name: 'For My Kids', icon: 'baby', color: '#F97316' },
        { id: 'spiritual', name: 'Spiritual', icon: 'sparkles', color: '#A855F7' },
        { id: 'education', name: 'Education & Learning', icon: 'graduation-cap', color: '#F59E0B' },
        { id: 'social', name: 'Social & Relationships', icon: 'message-circle', color: '#06B6D4' },
        { id: 'travel', name: 'Travel & Adventure', icon: 'plane', color: '#3B82F6' },
        { id: 'creative', name: 'Creative & Hobbies', icon: 'palette', color: '#14B8A6' },
        { id: 'personal', name: 'Personal Growth', icon: 'user', color: '#64748B' },
        { id: 'other', name: 'Other', icon: 'star', color: '#6B7280' }
    ];

    // Icon options for goals
    const GOAL_ICONS = [
        'home', 'car', 'plane', 'heart', 'star', 'target', 'trophy',
        'book', 'graduation-cap', 'briefcase', 'wallet', 'piggy-bank',
        'dumbbell', 'bike', 'mountain', 'sun', 'sparkles', 'gem',
        'camera', 'music', 'palette', 'laptop', 'globe', 'map-pin',
        'users', 'baby', 'ring', 'gift', 'crown', 'medal'
    ];

    /**
     * Get widget data with defaults
     * Initializes zones on first load and migrates existing goals
     */
    function getWidgetData(memberId) {
        const stored = Storage.getWidgetData(memberId, 'vision-board');

        // Initialize with defaults if no data exists
        if (!stored || !stored.goals) {
            return {
                zones: JSON.parse(JSON.stringify(DEFAULT_ZONES)),
                goals: []
            };
        }

        // Ensure zones exist (migration for existing users)
        if (!stored.zones) {
            stored.zones = JSON.parse(JSON.stringify(DEFAULT_ZONES));
        }

        // Migrate goals without zoneId (assign based on category)
        let needsSave = false;
        stored.goals.forEach(goal => {
            if (!goal.zoneId) {
                goal.zoneId = CATEGORY_TO_ZONE_MAP[goal.category] || 'zone-health';
                needsSave = true;
            }
        });

        // Save if migration occurred
        if (needsSave) {
            Storage.setWidgetData(memberId, 'vision-board', stored);
        }

        return stored;
    }

    /**
     * Get zone by ID
     */
    function getZone(zones, zoneId) {
        return zones.find(z => z.id === zoneId) || zones[0];
    }

    /**
     * Get goals for a specific zone
     */
    function getGoalsForZone(goals, zoneId) {
        return goals.filter(g => g.zoneId === zoneId && !g.completed);
    }

    /**
     * Get completed goals for a zone
     */
    function getCompletedGoalsForZone(goals, zoneId) {
        return goals.filter(g => g.zoneId === zoneId && g.completed);
    }

    /**
     * Save widget data
     */
    function saveWidgetData(memberId, data) {
        Storage.setWidgetData(memberId, 'vision-board', data);
    }

    /**
     * Add a step to the task list widget
     * Detects if member is a kid and uses the appropriate task widget
     */
    function addStepToTaskList(memberId, stepTitle, goalTitle) {
        const isKid = isKidMember(memberId);
        const taskWidgetKey = isKid ? 'kid-tasks' : 'task-list';
        const taskData = Storage.getWidgetData(memberId, taskWidgetKey) || { tasks: [] };

        const newTask = {
            id: isKid ? `kid-task-${Date.now()}` : `task-${Date.now()}`,
            title: stepTitle,
            completed: false,
            createdAt: typeof DateUtils !== 'undefined' ? DateUtils.today() : new Date().toISOString().split('T')[0],
            fromGoal: goalTitle, // Track which goal this came from
            stepTitle: stepTitle // Store step title for bidirectional sync
        };

        taskData.tasks = [...(taskData.tasks || []), newTask];
        Storage.setWidgetData(memberId, taskWidgetKey, taskData);

        // Refresh the appropriate task widget if visible
        if (isKid) {
            const kidTasksBody = document.getElementById('widget-kid-tasks');
            if (kidTasksBody && typeof KidTasks !== 'undefined') {
                KidTasks.renderWidget(kidTasksBody, memberId);
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            }
        } else {
            const tasksBody = document.getElementById('widget-task-list');
            if (tasksBody && typeof Tasks !== 'undefined') {
                Tasks.renderWidget(tasksBody, memberId);
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            }
        }

        Toast.success(`Added "${stepTitle}" to ${isKid ? 'My Tasks' : 'Tasks'}`);
    }

    /**
     * Get category by ID
     */
    function getCategory(categoryId) {
        return GOAL_CATEGORIES.find(c => c.id === categoryId) || GOAL_CATEGORIES[8];
    }

    /**
     * Calculate progress percentage
     * Supports both traditional tracking and sub-steps
     */
    function calculateProgress(goal) {
        // If goal has sub-steps, calculate based on completed steps
        if (goal.steps && goal.steps.length > 0) {
            const completedSteps = goal.steps.filter(s => s.completed).length;
            return Math.round((completedSteps / goal.steps.length) * 100);
        }

        // Traditional tracking
        if (goal.trackType === 'none' || !goal.target) return null;
        if (goal.trackType === 'percent') return goal.current || 0;
        if (goal.target === 0) return 0;
        return Math.min(100, Math.round((goal.current / goal.target) * 100));
    }

    /**
     * Get step completion stats
     */
    function getStepStats(goal) {
        if (!goal.steps || goal.steps.length === 0) {
            return { total: 0, completed: 0, pending: 0 };
        }
        const completed = goal.steps.filter(s => s.completed).length;
        return {
            total: goal.steps.length,
            completed,
            pending: goal.steps.length - completed
        };
    }

    /**
     * Format value with unit
     */
    function formatValue(value, unit = '') {
        if (unit === '$') {
            return `$${value.toLocaleString()}`;
        }
        return `${value.toLocaleString()}${unit}`;
    }

    /**
     * Get active goals (not completed)
     */
    function getActiveGoals(goals) {
        return goals.filter(g => !g.completed);
    }

    /**
     * Get completed goals
     */
    function getCompletedGoals(goals) {
        return goals.filter(g => g.completed);
    }

    /**
     * Check if member is a kid
     */
    function isKidMember(memberId) {
        const member = Storage.getMember(memberId);
        return member?.type === 'kid';
    }

    /**
     * Get display title based on member type
     */
    function getDisplayTitle(memberId) {
        return isKidMember(memberId) ? 'My Dreams' : 'Vision Board';
    }

    /**
     * Render a single zone block
     */
    function renderZoneBlock(zone, goals, memberId) {
        const zoneGoals = getGoalsForZone(goals, zone.id);
        const completedCount = getCompletedGoalsForZone(goals, zone.id).length;
        const isCircle = zone.shape === 'circle';

        return `
            <div class="vb-zone vb-zone--${zone.shape}" data-zone-id="${zone.id}">
                <div class="vb-zone__header">
                    <h3 class="vb-zone__title" data-action="edit-zone-title" data-zone-id="${zone.id}">${zone.title}</h3>
                    <button class="vb-zone__expand" data-action="expand-zone" data-zone-id="${zone.id}" title="View details">
                        <i data-lucide="chevron-right"></i>
                    </button>
                </div>

                <div class="vb-zone__goals">
                    ${zoneGoals.length === 0 ? `
                        <p class="vb-zone__empty">No goals yet</p>
                    ` : zoneGoals.slice(0, 4).map(goal => `
                        <div class="vb-zone__goal" data-goal-id="${goal.id}">
                            <span class="vb-zone__goal-bullet">●</span>
                            <span class="vb-zone__goal-title">${goal.title}</span>
                        </div>
                    `).join('')}
                    ${zoneGoals.length > 4 ? `
                        <div class="vb-zone__more">+${zoneGoals.length - 4} more</div>
                    ` : ''}
                </div>

                <div class="vb-zone__footer">
                    <button class="vb-zone__add-btn" data-action="add-goal-to-zone" data-zone-id="${zone.id}">
                        <i data-lucide="plus"></i>
                        <span>Add goal</span>
                    </button>
                    ${completedCount > 0 ? `
                        <span class="vb-zone__completed">${completedCount} done</span>
                    ` : ''}
                </div>

                ${!zone.isDefault ? `
                    <button class="vb-zone__delete" data-action="delete-zone" data-zone-id="${zone.id}" title="Delete zone">
                        <i data-lucide="x"></i>
                    </button>
                ` : ''}
            </div>
        `;
    }

    /**
     * Render the vision board widget with zone-based template layout
     */
    function renderWidget(container, memberId) {
        const widgetData = getWidgetData(memberId);
        const zones = widgetData.zones || DEFAULT_ZONES;
        const goals = widgetData.goals || [];
        const isKid = isKidMember(memberId);

        // Group zones into rows (2 zones per row)
        const zoneRows = [];
        for (let i = 0; i < zones.length; i += 2) {
            zoneRows.push(zones.slice(i, i + 2));
        }

        container.innerHTML = `
            <div class="vb-template ${isKid ? 'vb-template--kid' : ''}">
                <div class="vb-template__header">
                    <h1 class="vb-template__title">
                        <span>VISION</span>
                        <span class="vb-template__divider"></span>
                        <span>BOARD</span>
                    </h1>
                </div>

                <div class="vb-template__grid">
                    ${zoneRows.map((row, rowIndex) => `
                        <div class="vb-template__row">
                            ${row.map(zone => renderZoneBlock(zone, goals, memberId)).join('')}
                        </div>
                    `).join('')}
                </div>

                <div class="vb-template__footer">
                    <button class="btn btn--ghost btn--sm" data-action="add-zone">
                        <i data-lucide="plus"></i>
                        Add New Zone
                    </button>
                </div>
            </div>
        `;

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        bindWidgetEvents(container, memberId);
    }

    /**
     * Bind widget events for zone-based template
     */
    function bindWidgetEvents(container, memberId) {
        // Add goal to specific zone
        container.querySelectorAll('[data-action="add-goal-to-zone"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const zoneId = btn.dataset.zoneId;
                showAddGoalToZoneModal(memberId, zoneId);
            });
        });

        // Expand zone to see full details
        container.querySelectorAll('[data-action="expand-zone"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const zoneId = btn.dataset.zoneId;
                showZoneExpandView(memberId, zoneId);
            });
        });

        // Edit zone title inline
        container.querySelectorAll('[data-action="edit-zone-title"]').forEach(el => {
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                const zoneId = el.dataset.zoneId;
                showEditZoneTitleModal(memberId, zoneId, () => {
                    const widgetBody = document.getElementById('widget-vision-board');
                    if (widgetBody) renderWidget(widgetBody, memberId);
                });
            });
        });

        // Add new zone
        container.querySelector('[data-action="add-zone"]')?.addEventListener('click', () => {
            showAddZoneModal(memberId, () => {
                const widgetBody = document.getElementById('widget-vision-board');
                if (widgetBody) renderWidget(widgetBody, memberId);
            });
        });

        // Delete zone
        container.querySelectorAll('[data-action="delete-zone"]').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const zoneId = btn.dataset.zoneId;
                const confirmed = await showConfirmDialog('Delete Zone', 'Goals in this zone will be moved to Health. Continue?');
                if (confirmed) {
                    deleteZone(memberId, zoneId);
                    const widgetBody = document.getElementById('widget-vision-board');
                    if (widgetBody) renderWidget(widgetBody, memberId);
                }
            });
        });

        // Click on goal to show quick update
        container.querySelectorAll('.vb-zone__goal').forEach(goalEl => {
            goalEl.addEventListener('click', (e) => {
                e.stopPropagation();
                const goalId = goalEl.dataset.goalId;
                showQuickUpdateModal(memberId, goalId, () => {
                    const widgetBody = document.getElementById('widget-vision-board');
                    if (widgetBody) renderWidget(widgetBody, memberId);
                });
            });
        });
    }

    /**
     * Show add goal modal pre-populated with zone
     */
    function showAddGoalToZoneModal(memberId, zoneId) {
        showAddGoalModal(memberId, () => {
            const widgetBody = document.getElementById('widget-vision-board');
            if (widgetBody) renderWidget(widgetBody, memberId);
        }, zoneId);
    }

    /**
     * Show expanded view for a specific zone
     */
    function showZoneExpandView(memberId, zoneId) {
        const main = document.getElementById('mainContent');
        if (!main) return;

        const member = Storage.getMember(memberId);
        const widgetData = getWidgetData(memberId);
        const zone = getZone(widgetData.zones, zoneId);
        const zoneGoals = getGoalsForZone(widgetData.goals, zoneId);
        const completedGoals = getCompletedGoalsForZone(widgetData.goals, zoneId);
        const isKid = isKidMember(memberId);

        main.innerHTML = `
            <div class="vb-zone-page">
                <div class="vb-zone-page__header">
                    <button class="btn btn--ghost" id="backToVisionBoardBtn">
                        <i data-lucide="arrow-left"></i>
                        Back to Vision Board
                    </button>
                    <h1 class="vb-zone-page__title">
                        <i data-lucide="star"></i>
                        ${zone.title}
                    </h1>
                    <button class="btn btn--primary" data-action="add-goal-zone-page" data-zone-id="${zoneId}">
                        <i data-lucide="plus"></i>
                        Add Goal
                    </button>
                </div>

                <div class="vb-zone-page__stats">
                    <div class="vb-zone-page-stat">
                        <span class="vb-zone-page-stat__value">${zoneGoals.length}</span>
                        <span class="vb-zone-page-stat__label">In Progress</span>
                    </div>
                    <div class="vb-zone-page-stat">
                        <span class="vb-zone-page-stat__value">${completedGoals.length}</span>
                        <span class="vb-zone-page-stat__label">Completed</span>
                    </div>
                </div>

                ${zoneGoals.length > 0 ? `
                    <div class="vb-zone-page__section">
                        <h2 class="vb-zone-page__section-title">
                            <i data-lucide="rocket"></i>
                            In Progress
                        </h2>
                        <div class="vision-board-grid">
                            ${zoneGoals.map(goal => renderGoalCard(goal, memberId)).join('')}
                        </div>
                    </div>
                ` : ''}

                ${completedGoals.length > 0 ? `
                    <div class="vb-zone-page__section vb-zone-page__section--completed">
                        <h2 class="vb-zone-page__section-title vb-zone-page__section-title--completed">
                            <i data-lucide="trophy"></i>
                            Completed
                        </h2>
                        <div class="vision-board-grid vision-board-grid--completed">
                            ${completedGoals.map(goal => renderGoalCard(goal, memberId, true)).join('')}
                        </div>
                    </div>
                ` : ''}

                ${zoneGoals.length === 0 && completedGoals.length === 0 ? `
                    <div class="vb-zone-page__empty">
                        <div class="vb-zone-page__empty-icon">
                            <i data-lucide="target"></i>
                        </div>
                        <h2>No Goals Yet</h2>
                        <p>Add your first goal to this zone!</p>
                        <button class="btn btn--primary" data-action="add-goal-zone-page" data-zone-id="${zoneId}">
                            <i data-lucide="plus"></i>
                            Add Goal
                        </button>
                    </div>
                ` : ''}
            </div>
        `;

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        bindZonePageEvents(main, memberId, member, zoneId);
    }

    /**
     * Bind events for zone expand page
     */
    function bindZonePageEvents(container, memberId, member, zoneId) {
        // Back button - return to member dashboard (which will re-render the widget)
        document.getElementById('backToVisionBoardBtn')?.addEventListener('click', () => {
            State.emit('tabChanged', memberId);
        });

        // Add goal from zone page
        container.querySelectorAll('[data-action="add-goal-zone-page"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const currentZoneId = btn.dataset.zoneId;
                showAddGoalModal(memberId, () => showZoneExpandView(memberId, currentZoneId), currentZoneId);
            });
        });

        // Update progress
        container.querySelectorAll('[data-action="update"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const goalId = btn.dataset.goalId;
                showQuickUpdateModal(memberId, goalId, () => showZoneExpandView(memberId, zoneId));
            });
        });

        // Edit goal
        container.querySelectorAll('[data-action="edit"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const goalId = btn.dataset.goalId;
                showEditGoalModal(memberId, goalId, () => showZoneExpandView(memberId, zoneId));
            });
        });

        // Delete goal
        container.querySelectorAll('[data-action="delete"]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const goalId = btn.dataset.goalId;
                const confirmed = await showConfirmDialog('Delete this goal?', 'This action cannot be undone.');
                if (confirmed) {
                    deleteGoal(memberId, goalId);
                    showZoneExpandView(memberId, zoneId);
                }
            });
        });

        // Add goal to Task List
        container.querySelectorAll('[data-action="add-to-tasks"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const goalId = btn.dataset.goalId;
                addGoalToTaskList(memberId, goalId);
            });
        });
    }

    /**
     * Show edit zone title modal
     */
    function showEditZoneTitleModal(memberId, zoneId, onSave) {
        const widgetData = getWidgetData(memberId);
        const zone = getZone(widgetData.zones, zoneId);

        Modal.open({
            title: 'Edit Zone Title',
            content: `
                <div class="form-group">
                    <label class="form-label">Zone Title</label>
                    <input type="text" class="form-input" id="zoneTitleInput" value="${zone.title}" autocomplete="off">
                </div>
            `,
            footer: Modal.createFooter('Cancel', 'Save')
        });

        setTimeout(() => {
            document.getElementById('zoneTitleInput')?.focus();
            document.getElementById('zoneTitleInput')?.select();
        }, 100);

        Modal.bindFooterEvents(() => {
            const newTitle = document.getElementById('zoneTitleInput')?.value?.trim();
            if (!newTitle) {
                Toast.error('Please enter a title');
                return false;
            }

            zone.title = newTitle;
            saveWidgetData(memberId, widgetData);
            Toast.success('Zone updated!');

            if (onSave) onSave();
            return true;
        });
    }

    /**
     * Show add new zone modal
     */
    function showAddZoneModal(memberId, onSave) {
        const widgetData = getWidgetData(memberId);

        // Check max zones limit
        if (widgetData.zones.length >= 12) {
            Toast.error('Maximum 12 zones allowed');
            return;
        }

        Modal.open({
            title: 'Add New Zone',
            content: `
                <div class="form-group">
                    <label class="form-label">Zone Title</label>
                    <input type="text" class="form-input" id="newZoneTitleInput" placeholder="e.g., Side Projects, Learning..." autocomplete="off">
                </div>
                <div class="form-group">
                    <label class="form-label">Shape</label>
                    <div class="vb-shape-picker">
                        <label class="vb-shape-option">
                            <input type="radio" name="zoneShape" value="circle" checked>
                            <span class="vb-shape-option__preview vb-shape-option__preview--circle"></span>
                            <span>Circle</span>
                        </label>
                        <label class="vb-shape-option">
                            <input type="radio" name="zoneShape" value="rectangle">
                            <span class="vb-shape-option__preview vb-shape-option__preview--rectangle"></span>
                            <span>Rectangle</span>
                        </label>
                    </div>
                </div>
            `,
            footer: Modal.createFooter('Cancel', 'Add Zone')
        });

        setTimeout(() => {
            document.getElementById('newZoneTitleInput')?.focus();
        }, 100);

        Modal.bindFooterEvents(() => {
            const title = document.getElementById('newZoneTitleInput')?.value?.trim();
            if (!title) {
                Toast.error('Please enter a zone title');
                return false;
            }

            const shape = document.querySelector('input[name="zoneShape"]:checked')?.value || 'rectangle';

            const newZone = {
                id: `zone-${Date.now()}`,
                title,
                shape,
                isDefault: false,
                order: widgetData.zones.length + 1
            };

            widgetData.zones.push(newZone);
            saveWidgetData(memberId, widgetData);
            Toast.success('Zone added!');

            if (onSave) onSave();
            return true;
        });
    }

    /**
     * Delete a zone (move goals to Health zone)
     */
    function deleteZone(memberId, zoneId) {
        const widgetData = getWidgetData(memberId);

        // Move all goals from this zone to the Health zone
        widgetData.goals.forEach(goal => {
            if (goal.zoneId === zoneId) {
                goal.zoneId = 'zone-health';
            }
        });

        // Remove the zone
        widgetData.zones = widgetData.zones.filter(z => z.id !== zoneId);

        saveWidgetData(memberId, widgetData);
        Toast.success('Zone deleted. Goals moved to Health zone.');
    }

    /**
     * Show the full page vision board
     */
    function showFullPage(memberId) {
        const main = document.getElementById('mainContent');
        if (!main) return;

        const member = Storage.getMember(memberId);
        renderFullPage(main, memberId, member);
    }

    /**
     * Render full page vision board with tabs
     */
    function renderFullPage(container, memberId, member, activeTab = 'board') {
        const widgetData = getWidgetData(memberId);
        const zones = widgetData.zones || DEFAULT_ZONES;
        const goals = widgetData.goals || [];
        const activeGoals = getActiveGoals(goals);
        const completedGoals = getCompletedGoals(goals);
        const isKid = isKidMember(memberId);

        // Calculate category stats
        const categoryStats = {};
        goals.forEach(g => {
            const cat = g.category || 'other';
            if (!categoryStats[cat]) categoryStats[cat] = { total: 0, completed: 0 };
            categoryStats[cat].total++;
            if (g.completed) categoryStats[cat].completed++;
        });

        // Get progress average
        const goalsWithProgress = activeGoals.filter(g => calculateProgress(g) !== null);
        const avgProgress = goalsWithProgress.length > 0
            ? Math.round(goalsWithProgress.reduce((sum, g) => sum + calculateProgress(g), 0) / goalsWithProgress.length)
            : 0;

        container.innerHTML = `
            <div class="vb-page ${isKid ? 'vb-page--kid' : ''}">
                <!-- Hero Header -->
                <div class="vb-page__hero">
                    <button class="btn btn--ghost vb-page__back" id="backToMemberBtn">
                        <i data-lucide="arrow-left"></i>
                        Back
                    </button>
                    <div class="vb-page__hero-content">
                        <h1 class="vb-page__hero-title">
                            <i data-lucide="${isKid ? 'sparkles' : 'target'}"></i>
                            ${isKid ? 'My Dreams' : 'Vision Board'}
                        </h1>
                        <p class="vb-page__hero-subtitle">${isKid ? 'Dream big and make it happen!' : 'Visualize your goals and track your progress'}</p>
                    </div>
                    <div class="vb-page__hero-stats">
                        <div class="vb-hero-stat">
                            <span class="vb-hero-stat__value">${activeGoals.length}</span>
                            <span class="vb-hero-stat__label">Active</span>
                        </div>
                        <div class="vb-hero-stat">
                            <span class="vb-hero-stat__value">${completedGoals.length}</span>
                            <span class="vb-hero-stat__label">Achieved</span>
                        </div>
                        <div class="vb-hero-stat">
                            <span class="vb-hero-stat__value">${avgProgress}%</span>
                            <span class="vb-hero-stat__label">Avg Progress</span>
                        </div>
                    </div>
                </div>

                <!-- Tab Navigation -->
                <div class="vb-page__tabs">
                    <button class="vb-tab ${activeTab === 'board' ? 'vb-tab--active' : ''}" data-tab="board">
                        <i data-lucide="layout-grid"></i>
                        <span>Board</span>
                    </button>
                    <button class="vb-tab ${activeTab === 'goals' ? 'vb-tab--active' : ''}" data-tab="goals">
                        <i data-lucide="target"></i>
                        <span>Goals</span>
                        ${activeGoals.length > 0 ? `<span class="vb-tab__count">${activeGoals.length}</span>` : ''}
                    </button>
                    <button class="vb-tab ${activeTab === 'completed' ? 'vb-tab--active' : ''}" data-tab="completed">
                        <i data-lucide="trophy"></i>
                        <span>Achieved</span>
                        ${completedGoals.length > 0 ? `<span class="vb-tab__count">${completedGoals.length}</span>` : ''}
                    </button>
                    <button class="vb-tab ${activeTab === 'stats' ? 'vb-tab--active' : ''}" data-tab="stats">
                        <i data-lucide="bar-chart-2"></i>
                        <span>Stats</span>
                    </button>
                </div>

                <!-- Action Bar -->
                <div class="vb-page__actions">
                    <button class="btn btn--primary" data-action="add-goal">
                        <i data-lucide="plus"></i>
                        ${isKid ? 'Add Dream' : 'Add Goal'}
                    </button>
                </div>

                <!-- Tab Content -->
                <div class="vb-page__content">
                    ${renderVBTabContent(activeTab, memberId, widgetData, zones, goals, activeGoals, completedGoals, categoryStats, isKid)}
                </div>
            </div>
        `;

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        bindFullPageEvents(container, memberId, member, activeTab);
    }

    /**
     * Render tab content for Vision Board page
     */
    function renderVBTabContent(activeTab, memberId, widgetData, zones, goals, activeGoals, completedGoals, categoryStats, isKid) {
        switch (activeTab) {
            case 'board':
                return renderBoardTab(memberId, widgetData, zones, goals, isKid);
            case 'goals':
                return renderGoalsTab(memberId, activeGoals, isKid);
            case 'completed':
                return renderCompletedTab(memberId, completedGoals, isKid);
            case 'stats':
                return renderVBStatsTab(memberId, goals, activeGoals, completedGoals, categoryStats, isKid);
            default:
                return renderBoardTab(memberId, widgetData, zones, goals, isKid);
        }
    }

    /**
     * Render Board tab - Zone-based template view
     */
    function renderBoardTab(memberId, widgetData, zones, goals, isKid) {
        // Group zones into rows (2 zones per row)
        const zoneRows = [];
        for (let i = 0; i < zones.length; i += 2) {
            zoneRows.push(zones.slice(i, i + 2));
        }

        return `
            <div class="vb-board-tab">
                <div class="vb-template ${isKid ? 'vb-template--kid' : ''}">
                    <div class="vb-template__header">
                        <h1 class="vb-template__title">
                            <span>VISION</span>
                            <span class="vb-template__divider"></span>
                            <span>BOARD</span>
                        </h1>
                    </div>

                    <div class="vb-template__grid">
                        ${zoneRows.map((row, rowIndex) => `
                            <div class="vb-template__row">
                                ${row.map(zone => renderZoneBlock(zone, goals, memberId)).join('')}
                            </div>
                        `).join('')}
                    </div>

                    <div class="vb-template__footer">
                        <button class="btn btn--ghost btn--sm" data-action="add-zone">
                            <i data-lucide="plus"></i>
                            Add New Zone
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render Goals tab - All active goals
     */
    function renderGoalsTab(memberId, activeGoals, isKid) {
        if (activeGoals.length === 0) {
            return `
                <div class="vb-empty">
                    <div class="vb-empty__icon">
                        <i data-lucide="target"></i>
                    </div>
                    <h3>No Active ${isKid ? 'Dreams' : 'Goals'}</h3>
                    <p>Start by adding your first ${isKid ? 'dream' : 'goal'} to track your progress!</p>
                    <button class="btn btn--primary" data-action="add-goal">
                        <i data-lucide="plus"></i>
                        Add ${isKid ? 'Dream' : 'Goal'}
                    </button>
                </div>
            `;
        }

        return `
            <div class="vb-goals-tab">
                <div class="vision-board-grid">
                    ${activeGoals.map(goal => renderGoalCard(goal, memberId)).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Render Completed tab - All achieved goals
     */
    function renderCompletedTab(memberId, completedGoals, isKid) {
        if (completedGoals.length === 0) {
            return `
                <div class="vb-empty">
                    <div class="vb-empty__icon">
                        <i data-lucide="trophy"></i>
                    </div>
                    <h3>No Achieved ${isKid ? 'Dreams' : 'Goals'} Yet</h3>
                    <p>Keep working on your ${isKid ? 'dreams' : 'goals'} - you'll get there!</p>
                </div>
            `;
        }

        return `
            <div class="vb-completed-tab">
                <div class="vision-board-grid vision-board-grid--completed">
                    ${completedGoals.map(goal => renderGoalCard(goal, memberId, true)).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Render Stats tab - Overview statistics
     */
    function renderVBStatsTab(memberId, goals, activeGoals, completedGoals, categoryStats, isKid) {
        const totalGoals = goals.length;
        const completionRate = totalGoals > 0 ? Math.round((completedGoals.length / totalGoals) * 100) : 0;

        // Get goals with progress tracking
        const goalsWithProgress = activeGoals.filter(g => calculateProgress(g) !== null);
        const avgProgress = goalsWithProgress.length > 0
            ? Math.round(goalsWithProgress.reduce((sum, g) => sum + calculateProgress(g), 0) / goalsWithProgress.length)
            : 0;

        // Get goals with steps
        const goalsWithSteps = activeGoals.filter(g => g.steps && g.steps.length > 0);
        const totalSteps = goalsWithSteps.reduce((sum, g) => sum + (g.steps?.length || 0), 0);
        const completedSteps = goalsWithSteps.reduce((sum, g) => sum + (g.steps?.filter(s => s.completed).length || 0), 0);

        return `
            <div class="vb-stats-tab">
                <!-- Overview Cards -->
                <div class="vb-stats__overview">
                    <div class="vb-stats__card">
                        <div class="vb-stats__card-icon" style="background: #dbeafe; color: #3b82f6;">
                            <i data-lucide="target"></i>
                        </div>
                        <div class="vb-stats__card-content">
                            <span class="vb-stats__card-value">${totalGoals}</span>
                            <span class="vb-stats__card-label">Total ${isKid ? 'Dreams' : 'Goals'}</span>
                        </div>
                    </div>
                    <div class="vb-stats__card">
                        <div class="vb-stats__card-icon" style="background: #dcfce7; color: #22c55e;">
                            <i data-lucide="trophy"></i>
                        </div>
                        <div class="vb-stats__card-content">
                            <span class="vb-stats__card-value">${completedGoals.length}</span>
                            <span class="vb-stats__card-label">Achieved</span>
                        </div>
                    </div>
                    <div class="vb-stats__card">
                        <div class="vb-stats__card-icon" style="background: #fef3c7; color: #f59e0b;">
                            <i data-lucide="percent"></i>
                        </div>
                        <div class="vb-stats__card-content">
                            <span class="vb-stats__card-value">${completionRate}%</span>
                            <span class="vb-stats__card-label">Completion Rate</span>
                        </div>
                    </div>
                    <div class="vb-stats__card">
                        <div class="vb-stats__card-icon" style="background: #f3e8ff; color: #8b5cf6;">
                            <i data-lucide="trending-up"></i>
                        </div>
                        <div class="vb-stats__card-content">
                            <span class="vb-stats__card-value">${avgProgress}%</span>
                            <span class="vb-stats__card-label">Avg Progress</span>
                        </div>
                    </div>
                </div>

                ${totalSteps > 0 ? `
                    <!-- Steps Progress -->
                    <div class="vb-stats__section">
                        <h3 class="vb-stats__section-title">
                            <i data-lucide="list-checks"></i>
                            Steps Progress
                        </h3>
                        <div class="vb-stats__steps-progress">
                            <div class="vb-stats__steps-bar">
                                <div class="vb-stats__steps-fill" style="width: ${Math.round((completedSteps / totalSteps) * 100)}%"></div>
                            </div>
                            <span class="vb-stats__steps-text">${completedSteps} of ${totalSteps} steps completed</span>
                        </div>
                    </div>
                ` : ''}

                <!-- Category Breakdown -->
                <div class="vb-stats__section">
                    <h3 class="vb-stats__section-title">
                        <i data-lucide="pie-chart"></i>
                        By Category
                    </h3>
                    <div class="vb-stats__categories">
                        ${Object.entries(categoryStats).map(([catId, stats]) => {
                            const cat = getCategory(catId);
                            const pct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
                            return `
                                <div class="vb-stats__category">
                                    <div class="vb-stats__category-header">
                                        <span class="vb-stats__category-icon" style="background: ${cat.color}20; color: ${cat.color}">
                                            <i data-lucide="${cat.icon}"></i>
                                        </span>
                                        <span class="vb-stats__category-name">${cat.name}</span>
                                        <span class="vb-stats__category-count">${stats.completed}/${stats.total}</span>
                                    </div>
                                    <div class="vb-stats__category-bar">
                                        <div class="vb-stats__category-fill" style="width: ${pct}%; background: ${cat.color}"></div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                ${activeGoals.length > 0 ? `
                    <!-- Active Goals Progress -->
                    <div class="vb-stats__section">
                        <h3 class="vb-stats__section-title">
                            <i data-lucide="activity"></i>
                            Active ${isKid ? 'Dreams' : 'Goals'} Progress
                        </h3>
                        <div class="vb-stats__goals-list">
                            ${activeGoals.slice(0, 5).map(goal => {
                                const progress = calculateProgress(goal) || 0;
                                const cat = getCategory(goal.category);
                                return `
                                    <div class="vb-stats__goal-item">
                                        <span class="vb-stats__goal-icon" style="color: ${cat.color}">
                                            <i data-lucide="${goal.icon || cat.icon}"></i>
                                        </span>
                                        <div class="vb-stats__goal-info">
                                            <span class="vb-stats__goal-title">${goal.title}</span>
                                            <div class="vb-stats__goal-bar">
                                                <div class="vb-stats__goal-fill" style="width: ${progress}%; background: ${cat.color}"></div>
                                            </div>
                                        </div>
                                        <span class="vb-stats__goal-pct">${progress}%</span>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Render a goal card
     */
    function renderGoalCard(goal, memberId, isCompleted = false) {
        const category = getCategory(goal.category);
        const progress = calculateProgress(goal);
        const hasImage = goal.imageUrl;
        const stepStats = getStepStats(goal);
        const hasSteps = stepStats.total > 0;

        return `
            <div class="vision-board-card ${isCompleted ? 'vision-board-card--completed' : ''} ${hasImage ? 'vision-board-card--has-image' : ''}"
                 data-goal-id="${goal.id}"
                 style="--goal-color: ${category.color}">
                ${hasImage ? `
                    <div class="vision-board-card__image" style="background-image: url('${goal.imageUrl}')">
                        <div class="vision-board-card__overlay"></div>
                    </div>
                ` : ''}

                <div class="vision-board-card__content ${hasImage ? 'vision-board-card__content--over-image' : ''}">
                    <div class="vision-board-card__header">
                        <div class="vision-board-card__icon" style="background-color: ${hasImage ? 'rgba(255,255,255,0.2)' : category.color + '20'}; color: ${hasImage ? '#fff' : category.color}">
                            <i data-lucide="${goal.icon || category.icon}"></i>
                        </div>
                        <span class="vision-board-card__category" style="background-color: ${hasImage ? 'rgba(255,255,255,0.2)' : category.color + '15'}; color: ${hasImage ? '#fff' : category.color}">${category.name}</span>
                        ${isCompleted ? `
                            <span class="vision-board-card__badge vision-board-card__badge--completed">
                                <i data-lucide="check"></i>
                                Done
                            </span>
                        ` : ''}
                    </div>

                    <h3 class="vision-board-card__title ${hasImage ? 'vision-board-card__title--light' : ''}">${goal.title}</h3>

                    ${goal.notes ? `
                        <p class="vision-board-card__notes ${hasImage ? 'vision-board-card__notes--light' : ''}">${goal.notes}</p>
                    ` : ''}

                    ${hasSteps && !isCompleted ? `
                        <div class="vision-board-card__steps">
                            <div class="vision-board-card__steps-header">
                                <span class="vision-board-card__steps-label">
                                    <i data-lucide="list-checks"></i>
                                    ${stepStats.completed}/${stepStats.total} steps
                                </span>
                                <span class="vision-board-card__steps-percent">${progress}%</span>
                            </div>
                            <div class="vision-board-card__progress-bar">
                                <div class="vision-board-card__progress-fill" style="width: ${progress}%; background-color: ${category.color}"></div>
                            </div>
                            <div class="vision-board-card__steps-list">
                                ${goal.steps.slice(0, 3).map(step => `
                                    <div class="vision-board-card__step ${step.completed ? 'vision-board-card__step--done' : ''}">
                                        <i data-lucide="${step.completed ? 'check-circle-2' : 'circle'}"></i>
                                        <span>${step.title}</span>
                                    </div>
                                `).join('')}
                                ${goal.steps.length > 3 ? `
                                    <div class="vision-board-card__step vision-board-card__step--more">
                                        +${goal.steps.length - 3} more steps
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    ` : progress !== null && !isCompleted ? `
                        <div class="vision-board-card__progress">
                            <div class="vision-board-card__progress-header">
                                <span class="vision-board-card__progress-label">
                                    ${goal.trackType === 'percent' ? 'Progress' :
                                      formatValue(goal.current, goal.unit) + ' / ' + formatValue(goal.target, goal.unit)}
                                </span>
                                <span class="vision-board-card__progress-value">${progress}%</span>
                            </div>
                            <div class="vision-board-card__progress-bar">
                                <div class="vision-board-card__progress-fill" style="width: ${progress}%; background-color: ${category.color}"></div>
                            </div>
                        </div>
                    ` : ''}

                    ${goal.targetDate && !isCompleted ? `
                        <div class="vision-board-card__date ${hasImage ? 'vision-board-card__date--light' : ''}">
                            <i data-lucide="calendar"></i>
                            <span>Target: ${formatDate(goal.targetDate)}</span>
                        </div>
                    ` : ''}

                    ${isCompleted && goal.completedAt ? `
                        <div class="vision-board-card__completed-date">
                            <i data-lucide="check-circle"></i>
                            <span>Achieved ${formatDate(goal.completedAt)}</span>
                        </div>
                    ` : ''}
                </div>

                <div class="vision-board-card__actions">
                    ${!isCompleted ? `
                        <button class="btn btn--sm btn--primary" data-action="update" data-goal-id="${goal.id}">
                            <i data-lucide="${hasSteps ? 'list-checks' : 'trending-up'}"></i>
                            ${hasSteps ? 'Steps' : 'Update'}
                        </button>
                    ` : ''}
                    <button class="btn btn--sm btn--ghost" data-action="edit" data-goal-id="${goal.id}">
                        <i data-lucide="edit-2"></i>
                    </button>
                    <button class="btn btn--sm btn--ghost btn--danger" data-action="delete" data-goal-id="${goal.id}">
                        <i data-lucide="trash-2"></i>
                    </button>
                    ${!isCompleted && hasSteps ? `
                        <button class="btn btn--sm btn--ghost vision-board-card__add-to-tasks" data-action="add-to-tasks" data-goal-id="${goal.id}" title="Add to Task List">
                            <i data-lucide="list-plus"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Format date for display
     */
    function formatDate(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }

    /**
     * Bind full page events
     */
    function bindFullPageEvents(container, memberId, member, activeTab = 'board') {
        // Back button
        document.getElementById('backToMemberBtn')?.addEventListener('click', () => {
            State.emit('tabChanged', memberId);
        });

        // Tab switching
        container.querySelectorAll('.vb-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const newTab = tab.dataset.tab;
                renderFullPage(container, memberId, member, newTab);
            });
        });

        // Add goal buttons
        container.querySelectorAll('[data-action="add-goal"]').forEach(btn => {
            btn.addEventListener('click', () => {
                showAddGoalModal(memberId, () => renderFullPage(container, memberId, member, activeTab));
            });
        });

        // Add zone button (in Board tab)
        container.querySelector('[data-action="add-zone"]')?.addEventListener('click', () => {
            showAddZoneModal(memberId, () => renderFullPage(container, memberId, member, activeTab));
        });

        // Zone interactions (in Board tab)
        container.querySelectorAll('[data-action="add-goal-to-zone"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const zoneId = btn.dataset.zoneId;
                showAddGoalModal(memberId, () => renderFullPage(container, memberId, member, activeTab), zoneId);
            });
        });

        container.querySelectorAll('[data-action="expand-zone"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const zoneId = btn.dataset.zoneId;
                showZoneExpandView(memberId, zoneId);
            });
        });

        container.querySelectorAll('[data-action="edit-zone-title"]').forEach(el => {
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                const zoneId = el.dataset.zoneId;
                showEditZoneTitleModal(memberId, zoneId, () => renderFullPage(container, memberId, member, activeTab));
            });
        });

        container.querySelectorAll('[data-action="delete-zone"]').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const zoneId = btn.dataset.zoneId;
                const confirmed = await showConfirmDialog('Delete Zone', 'Goals in this zone will be moved to Health. Continue?');
                if (confirmed) {
                    deleteZone(memberId, zoneId);
                    renderFullPage(container, memberId, member, activeTab);
                }
            });
        });

        // Goal interactions in zones
        container.querySelectorAll('.vb-zone__goal').forEach(goalEl => {
            goalEl.addEventListener('click', (e) => {
                e.stopPropagation();
                const goalId = goalEl.dataset.goalId;
                showQuickUpdateModal(memberId, goalId, () => renderFullPage(container, memberId, member, activeTab));
            });
        });

        // Update progress
        container.querySelectorAll('[data-action="update"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const goalId = btn.dataset.goalId;
                showQuickUpdateModal(memberId, goalId, () => renderFullPage(container, memberId, member, activeTab));
            });
        });

        // Edit goal
        container.querySelectorAll('[data-action="edit"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const goalId = btn.dataset.goalId;
                showEditGoalModal(memberId, goalId, () => renderFullPage(container, memberId, member, activeTab));
            });
        });

        // Delete goal
        container.querySelectorAll('[data-action="delete"]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const goalId = btn.dataset.goalId;
                const confirmed = await showConfirmDialog('Delete this goal?', 'This action cannot be undone.');
                if (confirmed) {
                    deleteGoal(memberId, goalId);
                    renderFullPage(container, memberId, member, activeTab);
                }
            });
        });

        // Add goal to Task List
        container.querySelectorAll('[data-action="add-to-tasks"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const goalId = btn.dataset.goalId;
                addGoalToTaskList(memberId, goalId);
            });
        });
    }

    /**
     * Show add goal modal
     */
    function showAddGoalModal(memberId, onSave = null, preSelectedZoneId = null) {
        const widgetData = getWidgetData(memberId);
        const zones = widgetData.zones || DEFAULT_ZONES;

        const content = `
            <div class="vision-board-form">
                <div class="form-group">
                    <label class="form-label">Goal Title *</label>
                    <input type="text" class="form-input" id="goalTitle" placeholder="e.g., Buy a house, Run a marathon..." autocomplete="off">
                </div>

                <div class="form-group">
                    <label class="form-label">Zone *</label>
                    <select class="form-input" id="goalZone">
                        ${zones.map(z => `
                            <option value="${z.id}" ${z.id === preSelectedZoneId ? 'selected' : ''}>${z.title}</option>
                        `).join('')}
                    </select>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Category</label>
                        <select class="form-input" id="goalCategory">
                            ${GOAL_CATEGORIES.map(c => `
                                <option value="${c.id}">${c.name}</option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Icon</label>
                        <div class="vision-board-icon-picker" id="iconPicker">
                            <button type="button" class="vision-board-icon-picker__trigger" id="iconPickerTrigger">
                                <i data-lucide="target" id="selectedIcon"></i>
                                <i data-lucide="chevron-down"></i>
                            </button>
                            <input type="hidden" id="goalIcon" value="target">
                        </div>
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">Image (optional)</label>
                    <div class="vision-board-image-upload" id="imageUpload">
                        <div class="vision-board-image-upload__preview" id="imagePreview" style="display: none;">
                            <img id="previewImg" src="" alt="Preview">
                            <button type="button" class="vision-board-image-upload__remove" id="removeImage">
                                <i data-lucide="x"></i>
                            </button>
                        </div>
                        <div class="vision-board-image-upload__placeholder" id="imagePlaceholder">
                            <i data-lucide="image"></i>
                            <span>Click to upload or paste URL</span>
                            <input type="file" id="imageFile" accept="image/*" style="display: none;">
                        </div>
                        <input type="text" class="form-input form-input--sm" id="imageUrl" placeholder="Or paste image URL..." style="margin-top: 8px;">
                    </div>
                    <input type="hidden" id="goalImageUrl" value="">
                </div>

                <div class="form-group">
                    <label class="form-label">Track Progress</label>
                    <select class="form-input" id="trackType">
                        <option value="none">No tracking</option>
                        <option value="number">Number (e.g., $50,000 of $100,000)</option>
                        <option value="percent">Percentage (e.g., 75%)</option>
                    </select>
                </div>

                <div id="trackingFields" style="display: none;">
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Current</label>
                            <input type="number" class="form-input" id="goalCurrent" value="0" min="0">
                        </div>
                        <div class="form-group" id="targetGroup">
                            <label class="form-label">Target</label>
                            <input type="number" class="form-input" id="goalTarget" placeholder="e.g., 100000" min="0">
                        </div>
                        <div class="form-group" id="unitGroup">
                            <label class="form-label">Unit</label>
                            <select class="form-input" id="goalUnit">
                                <option value="">None</option>
                                <option value="$">$ (dollars)</option>
                                <option value="lbs">lbs</option>
                                <option value="kg">kg</option>
                                <option value="mi">miles</option>
                                <option value="km">km</option>
                                <option value="hrs">hours</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">Target Date (optional)</label>
                    <input type="month" class="form-input" id="goalTargetDate">
                </div>

                <div class="form-group">
                    <label class="form-label">Notes (optional)</label>
                    <textarea class="form-input" id="goalNotes" rows="2" placeholder="Why is this goal important to you?"></textarea>
                </div>

                <div class="form-group">
                    <label class="form-label">
                        <i data-lucide="list-checks" style="width: 14px; height: 14px; display: inline-block; vertical-align: middle;"></i>
                        Steps / Milestones (optional)
                    </label>
                    <p class="form-helper" style="margin-bottom: 8px;">Break down your goal into actionable steps</p>
                    <div class="vision-board-steps-input">
                        <div class="vision-board-steps-input__add">
                            <input type="text" class="form-input" id="newStepInputAdd" placeholder="Add a step...">
                            <button type="button" class="btn btn--secondary btn--sm" id="addStepBtnAdd">
                                <i data-lucide="plus"></i>
                            </button>
                        </div>
                        <div class="vision-board-steps-input__list" id="stepsListAdd"></div>
                    </div>
                    <input type="hidden" id="goalSteps" value="[]">
                </div>
            </div>
        `;

        Modal.open({
            title: 'Add New Goal',
            content,
            footer: Modal.createFooter('Cancel', 'Add Goal')
        });

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Setup form interactions
        setupGoalFormInteractions();

        Modal.bindFooterEvents(() => {
            const title = document.getElementById('goalTitle')?.value?.trim();
            if (!title) {
                Toast.error('Please enter a goal title');
                return false;
            }

            // Parse steps from hidden input
            let steps = [];
            try {
                steps = JSON.parse(document.getElementById('goalSteps')?.value || '[]');
            } catch (e) {
                steps = [];
            }

            const goal = {
                id: `goal-${Date.now()}`,
                title,
                zoneId: document.getElementById('goalZone')?.value || preSelectedZoneId || 'zone-health',
                category: document.getElementById('goalCategory')?.value || 'other',
                icon: document.getElementById('goalIcon')?.value || 'target',
                imageUrl: document.getElementById('goalImageUrl')?.value || null,
                trackType: document.getElementById('trackType')?.value || 'none',
                current: parseFloat(document.getElementById('goalCurrent')?.value) || 0,
                target: parseFloat(document.getElementById('goalTarget')?.value) || 0,
                unit: document.getElementById('goalUnit')?.value || '',
                targetDate: document.getElementById('goalTargetDate')?.value || null,
                notes: document.getElementById('goalNotes')?.value?.trim() || '',
                steps: steps,
                completed: false,
                completedAt: null,
                createdAt: new Date().toISOString()
            };

            const widgetData = getWidgetData(memberId);
            widgetData.goals = widgetData.goals || [];
            widgetData.goals.push(goal);
            saveWidgetData(memberId, widgetData);

            Toast.success('Goal added!');

            if (onSave) {
                onSave();
            } else {
                // Refresh widget
                const widgetBody = document.getElementById('widget-vision-board');
                if (widgetBody) {
                    renderWidget(widgetBody, memberId);
                }
            }

            return true;
        });
    }

    /**
     * Setup goal form interactions
     */
    function setupGoalFormInteractions() {
        // Track type change
        const trackType = document.getElementById('trackType');
        const trackingFields = document.getElementById('trackingFields');
        const targetGroup = document.getElementById('targetGroup');
        const unitGroup = document.getElementById('unitGroup');

        trackType?.addEventListener('change', () => {
            if (trackType.value === 'none') {
                trackingFields.style.display = 'none';
            } else {
                trackingFields.style.display = 'block';
                if (trackType.value === 'percent') {
                    targetGroup.style.display = 'none';
                    unitGroup.style.display = 'none';
                    document.getElementById('goalTarget').value = '100';
                } else {
                    targetGroup.style.display = 'block';
                    unitGroup.style.display = 'block';
                }
            }
        });

        // Icon picker
        const iconPickerTrigger = document.getElementById('iconPickerTrigger');
        iconPickerTrigger?.addEventListener('click', () => {
            showIconPicker((icon) => {
                document.getElementById('goalIcon').value = icon;
                document.getElementById('selectedIcon').setAttribute('data-lucide', icon);
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            });
        });

        // Image file upload
        const imagePlaceholder = document.getElementById('imagePlaceholder');
        const imageFile = document.getElementById('imageFile');
        const imagePreview = document.getElementById('imagePreview');
        const previewImg = document.getElementById('previewImg');
        const removeImage = document.getElementById('removeImage');
        const goalImageUrl = document.getElementById('goalImageUrl');
        const imageUrl = document.getElementById('imageUrl');

        imagePlaceholder?.addEventListener('click', () => {
            imageFile?.click();
        });

        imageFile?.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                try {
                    const dataUrl = await compressImage(file);
                    goalImageUrl.value = dataUrl;
                    previewImg.src = dataUrl;
                    imagePreview.style.display = 'block';
                    imagePlaceholder.style.display = 'none';
                } catch (error) {
                    Toast.error('Failed to process image');
                }
            }
        });

        removeImage?.addEventListener('click', () => {
            goalImageUrl.value = '';
            imageUrl.value = '';
            previewImg.src = '';
            imagePreview.style.display = 'none';
            imagePlaceholder.style.display = 'flex';
        });

        // Image URL input
        imageUrl?.addEventListener('blur', () => {
            const url = imageUrl.value.trim();
            if (url) {
                goalImageUrl.value = url;
                previewImg.src = url;
                imagePreview.style.display = 'block';
                imagePlaceholder.style.display = 'none';
            }
        });

        // Steps input handling
        setupStepsInput();
    }

    /**
     * Setup goal form interactions without steps (for edit modal where steps are pre-initialized)
     */
    function setupGoalFormInteractionsWithoutSteps() {
        // Track type change
        const trackType = document.getElementById('trackType');
        const trackingFields = document.getElementById('trackingFields');
        const targetGroup = document.getElementById('targetGroup');
        const unitGroup = document.getElementById('unitGroup');

        trackType?.addEventListener('change', () => {
            if (trackType.value === 'none') {
                trackingFields.style.display = 'none';
            } else {
                trackingFields.style.display = 'block';
                if (trackType.value === 'percent') {
                    targetGroup.style.display = 'none';
                    unitGroup.style.display = 'none';
                    document.getElementById('goalTarget').value = '100';
                } else {
                    targetGroup.style.display = 'block';
                    unitGroup.style.display = 'block';
                }
            }
        });

        // Icon picker
        const iconPickerTrigger = document.getElementById('iconPickerTrigger');
        iconPickerTrigger?.addEventListener('click', () => {
            showIconPicker((icon) => {
                document.getElementById('goalIcon').value = icon;
                document.getElementById('selectedIcon').setAttribute('data-lucide', icon);
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            });
        });

        // Image file upload
        const imagePlaceholder = document.getElementById('imagePlaceholder');
        const imageFile = document.getElementById('imageFile');
        const imagePreview = document.getElementById('imagePreview');
        const previewImg = document.getElementById('previewImg');
        const removeImage = document.getElementById('removeImage');
        const goalImageUrl = document.getElementById('goalImageUrl');
        const imageUrl = document.getElementById('imageUrl');

        imagePlaceholder?.addEventListener('click', () => {
            imageFile?.click();
        });

        imageFile?.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                try {
                    const dataUrl = await compressImage(file);
                    goalImageUrl.value = dataUrl;
                    previewImg.src = dataUrl;
                    imagePreview.style.display = 'block';
                    imagePlaceholder.style.display = 'none';
                } catch (error) {
                    Toast.error('Failed to process image');
                }
            }
        });

        removeImage?.addEventListener('click', () => {
            goalImageUrl.value = '';
            imageUrl.value = '';
            previewImg.src = '';
            imagePreview.style.display = 'none';
            imagePlaceholder.style.display = 'flex';
        });

        // Image URL input
        imageUrl?.addEventListener('blur', () => {
            const url = imageUrl.value.trim();
            if (url) {
                goalImageUrl.value = url;
                previewImg.src = url;
                imagePreview.style.display = 'block';
                imagePlaceholder.style.display = 'none';
            }
        });

        // NOTE: Steps input handling is NOT called here - it's pre-initialized for edit modal
    }

    /**
     * Setup steps input for add/edit goal forms
     */
    function setupStepsInput(existingSteps = []) {
        const addStepBtn = document.getElementById('addStepBtnAdd');
        const newStepInput = document.getElementById('newStepInputAdd');
        const stepsListEl = document.getElementById('stepsListAdd');
        const goalStepsInput = document.getElementById('goalSteps');

        if (!addStepBtn || !stepsListEl) return;

        let steps = [...existingSteps];

        const renderSteps = () => {
            stepsListEl.innerHTML = steps.map((step, index) => `
                <div class="vision-board-steps-input__item" data-step-index="${index}">
                    <span class="vision-board-steps-input__number">${index + 1}</span>
                    <span class="vision-board-steps-input__text">${step.title}</span>
                    <button type="button" class="vision-board-steps-input__remove" data-remove-step="${index}">
                        <i data-lucide="x"></i>
                    </button>
                </div>
            `).join('');

            goalStepsInput.value = JSON.stringify(steps);

            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }

            // Bind remove buttons
            stepsListEl.querySelectorAll('[data-remove-step]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const index = parseInt(btn.dataset.removeStep);
                    steps.splice(index, 1);
                    renderSteps();
                });
            });
        };

        const addStep = () => {
            const title = newStepInput?.value?.trim();
            if (!title) return;

            steps.push({
                id: `step-${Date.now()}`,
                title,
                completed: false,
                createdAt: new Date().toISOString().split('T')[0]
            });

            newStepInput.value = '';
            renderSteps();
            newStepInput.focus();
        };

        addStepBtn.addEventListener('click', addStep);
        newStepInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addStep();
            }
        });

        // Initial render if there are existing steps
        if (existingSteps.length > 0) {
            renderSteps();
        }
    }

    /**
     * Compress image to data URL
     */
    function compressImage(file, maxSize = 400) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let { width, height } = img;

                    if (width > height) {
                        if (width > maxSize) {
                            height = (height * maxSize) / width;
                            width = maxSize;
                        }
                    } else {
                        if (height > maxSize) {
                            width = (width * maxSize) / height;
                            height = maxSize;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    resolve(canvas.toDataURL('image/jpeg', 0.85));
                };
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    /**
     * Show icon picker popup
     */
    function showIconPicker(onSelect) {
        const existingPicker = document.querySelector('.vision-board-icon-dropdown');
        existingPicker?.remove();

        const dropdown = document.createElement('div');
        dropdown.className = 'vision-board-icon-dropdown';
        dropdown.innerHTML = `
            <div class="vision-board-icon-dropdown__grid">
                ${GOAL_ICONS.map(icon => `
                    <button type="button" class="vision-board-icon-dropdown__item" data-icon="${icon}">
                        <i data-lucide="${icon}"></i>
                    </button>
                `).join('')}
            </div>
        `;

        const trigger = document.getElementById('iconPickerTrigger');
        const rect = trigger.getBoundingClientRect();
        dropdown.style.position = 'fixed';
        dropdown.style.top = (rect.bottom + 4) + 'px';
        dropdown.style.left = rect.left + 'px';
        dropdown.style.zIndex = '10000';

        document.body.appendChild(dropdown);

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        dropdown.querySelectorAll('[data-icon]').forEach(btn => {
            btn.addEventListener('click', () => {
                onSelect(btn.dataset.icon);
                dropdown.remove();
            });
        });

        // Close on outside click
        setTimeout(() => {
            const closeDropdown = (e) => {
                if (!dropdown.contains(e.target) && e.target !== trigger) {
                    dropdown.remove();
                    document.removeEventListener('click', closeDropdown);
                }
            };
            document.addEventListener('click', closeDropdown);
        }, 0);
    }

    // Points awarded for completing a goal (kids only)
    const GOAL_COMPLETION_POINTS = 50;

    /**
     * Award points for completing a goal (kid only)
     */
    function awardGoalCompletionPoints(memberId, goalTitle) {
        if (!isKidMember(memberId)) return;

        const pointsData = Storage.getWidgetData(memberId, 'points');
        if (!pointsData) return;

        const today = typeof DateUtils !== 'undefined' ? DateUtils.today() : new Date().toISOString().split('T')[0];

        const updatedPointsData = {
            ...pointsData,
            balance: (pointsData.balance || 0) + GOAL_COMPLETION_POINTS,
            history: [
                {
                    activityId: `goal-${Date.now()}`,
                    activityName: `Dream achieved: ${goalTitle}`,
                    date: today,
                    points: GOAL_COMPLETION_POINTS,
                    type: 'earned'
                },
                ...(pointsData.history || []).slice(0, 99)
            ]
        };

        Storage.setWidgetData(memberId, 'points', updatedPointsData);

        // Update achievements if available
        if (typeof Achievements !== 'undefined') {
            Achievements.updateStats(memberId, 'activity', 1);
            Achievements.updateStats(memberId, 'points', GOAL_COMPLETION_POINTS);
        }
    }

    /**
     * Show quick update modal - handles both traditional progress and sub-steps
     */
    function showQuickUpdateModal(memberId, goalId, onUpdate = null) {
        const widgetData = getWidgetData(memberId);
        const goal = widgetData.goals?.find(g => g.id === goalId);
        if (!goal) return;

        const category = getCategory(goal.category);
        const progress = calculateProgress(goal);
        const isKid = isKidMember(memberId);
        const wasCompleted = goal.completed;
        const hasSteps = goal.steps && goal.steps.length > 0;
        const stepStats = getStepStats(goal);

        // If goal has steps, show the steps modal
        if (hasSteps) {
            showStepsModal(memberId, goalId, onUpdate);
            return;
        }

        const content = `
            <div class="vision-board-update">
                <div class="vision-board-update__goal">
                    ${goal.imageUrl ? `
                        <div class="vision-board-update__image" style="background-image: url('${goal.imageUrl}')"></div>
                    ` : `
                        <div class="vision-board-update__icon" style="background-color: ${category.color}20; color: ${category.color}">
                            <i data-lucide="${goal.icon || category.icon}"></i>
                        </div>
                    `}
                    <div class="vision-board-update__info">
                        <h3>${goal.title}</h3>
                        ${progress !== null ? `
                            <div class="vision-board-update__current-progress">
                                <div class="vision-board-update__bar">
                                    <div class="vision-board-update__fill" style="width: ${progress}%; background-color: ${category.color}"></div>
                                </div>
                                <span>${progress}%</span>
                            </div>
                        ` : '<span class="vision-board-update__no-track">No progress tracking</span>'}
                    </div>
                </div>

                ${goal.trackType !== 'none' ? `
                    <div class="form-group">
                        <label class="form-label">
                            ${goal.trackType === 'percent' ? 'New Progress (%)' : 'Current Value'}
                        </label>
                        <div class="vision-board-update__input-row">
                            <input type="number" class="form-input" id="newProgress"
                                   value="${goal.current}"
                                   min="0"
                                   ${goal.trackType === 'percent' ? 'max="100"' : `max="${goal.target}"`}>
                            ${goal.unit ? `<span class="vision-board-update__unit">${goal.unit}</span>` : ''}
                            ${goal.trackType === 'number' ? `
                                <span class="vision-board-update__of">of ${formatValue(goal.target, goal.unit)}</span>
                            ` : ''}
                        </div>
                    </div>

                    <div class="vision-board-update__quick-btns">
                        ${goal.trackType === 'percent' ? `
                            <button type="button" class="btn btn--sm btn--ghost" data-add="10">+10%</button>
                            <button type="button" class="btn btn--sm btn--ghost" data-add="25">+25%</button>
                            <button type="button" class="btn btn--sm btn--ghost" data-set="100">100%</button>
                        ` : `
                            <button type="button" class="btn btn--sm btn--ghost" data-add="${Math.round(goal.target * 0.1)}">+10%</button>
                            <button type="button" class="btn btn--sm btn--ghost" data-add="${Math.round(goal.target * 0.25)}">+25%</button>
                            <button type="button" class="btn btn--sm btn--ghost" data-set="${goal.target}">Max</button>
                        `}
                    </div>
                ` : `
                    <p class="vision-board-update__no-progress-text">This goal doesn't have progress tracking enabled.</p>
                `}

                <div class="form-group">
                    <label class="checkbox-label">
                        <input type="checkbox" id="markComplete" ${goal.completed ? 'checked' : ''}>
                        <span>Mark as completed</span>
                        ${isKid && !goal.completed ? `<span class="vision-board-update__bonus">+${GOAL_COMPLETION_POINTS} points!</span>` : ''}
                    </label>
                </div>
            </div>
        `;

        Modal.open({
            title: isKid ? 'Update Dream' : 'Update Progress',
            content,
            footer: Modal.createFooter('Cancel', 'Save')
        });

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Quick add buttons
        document.querySelectorAll('.vision-board-update__quick-btns button').forEach(btn => {
            btn.addEventListener('click', () => {
                const input = document.getElementById('newProgress');
                if (btn.dataset.add) {
                    input.value = Math.min(
                        parseFloat(input.value || 0) + parseFloat(btn.dataset.add),
                        goal.trackType === 'percent' ? 100 : goal.target
                    );
                } else if (btn.dataset.set) {
                    input.value = btn.dataset.set;
                }
            });
        });

        Modal.bindFooterEvents(() => {
            const newProgress = parseFloat(document.getElementById('newProgress')?.value) || goal.current;
            const markComplete = document.getElementById('markComplete')?.checked || false;

            // Update goal
            goal.current = newProgress;
            goal.completed = markComplete;
            if (markComplete && !goal.completedAt) {
                goal.completedAt = new Date().toISOString().split('T')[0];
            } else if (!markComplete) {
                goal.completedAt = null;
            }

            saveWidgetData(memberId, widgetData);

            // Award points if goal just got completed (for kids)
            if (markComplete && !wasCompleted && isKid) {
                awardGoalCompletionPoints(memberId, goal.title);
                Toast.success(`Dream achieved! +${GOAL_COMPLETION_POINTS} points!`);

                // Refresh points widget if visible
                const pointsBody = document.getElementById('widget-points');
                if (pointsBody && typeof Points !== 'undefined') {
                    Points.renderWidget(pointsBody, memberId);
                    if (typeof lucide !== 'undefined') {
                        lucide.createIcons();
                    }
                }
            } else {
                Toast.success('Progress updated!');
            }

            if (onUpdate) {
                onUpdate();
            } else {
                const widgetBody = document.getElementById('widget-vision-board');
                if (widgetBody) {
                    renderWidget(widgetBody, memberId);
                }
            }

            return true;
        });
    }

    /**
     * Show steps management modal
     */
    function showStepsModal(memberId, goalId, onUpdate = null) {
        const widgetData = getWidgetData(memberId);
        const goal = widgetData.goals?.find(g => g.id === goalId);
        if (!goal) return;

        const category = getCategory(goal.category);
        const progress = calculateProgress(goal);
        const isKid = isKidMember(memberId);
        const wasCompleted = goal.completed;
        const stepStats = getStepStats(goal);

        const renderStepsList = () => {
            return (goal.steps || []).map((step, index) => `
                <div class="vision-board-step ${step.completed ? 'vision-board-step--completed' : ''}" data-step-index="${index}">
                    <label class="vision-board-step__checkbox">
                        <input type="checkbox" ${step.completed ? 'checked' : ''} data-step-toggle="${index}">
                        <span class="vision-board-step__checkmark"></span>
                    </label>
                    <span class="vision-board-step__title">${step.title}</span>
                    <div class="vision-board-step__actions">
                        <button type="button" class="vision-board-step__add-task" data-step-to-task="${index}" title="Add to Tasks">
                            <i data-lucide="list-plus"></i>
                        </button>
                        <button type="button" class="vision-board-step__delete" data-step-delete="${index}" title="Delete">
                            <i data-lucide="x"></i>
                        </button>
                    </div>
                </div>
            `).join('');
        };

        const content = `
            <div class="vision-board-steps-modal">
                <div class="vision-board-steps-modal__header">
                    <div class="vision-board-steps-modal__goal">
                        <div class="vision-board-steps-modal__icon" style="background-color: ${category.color}20; color: ${category.color}">
                            <i data-lucide="${goal.icon || category.icon}"></i>
                        </div>
                        <div class="vision-board-steps-modal__info">
                            <h3>${goal.title}</h3>
                            <div class="vision-board-steps-modal__progress">
                                <div class="vision-board-steps-modal__bar">
                                    <div class="vision-board-steps-modal__fill" style="width: ${progress}%; background-color: ${category.color}"></div>
                                </div>
                                <span>${stepStats.completed}/${stepStats.total} steps (${progress}%)</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="vision-board-steps-modal__add">
                    <input type="text" class="form-input" id="newStepInput" placeholder="Add a new step...">
                    <button type="button" class="btn btn--primary btn--sm" id="addStepBtn">
                        <i data-lucide="plus"></i>
                    </button>
                </div>

                <div class="vision-board-steps-modal__list" id="stepsList">
                    ${renderStepsList()}
                </div>

                <div class="form-group" style="margin-top: var(--space-4);">
                    <label class="checkbox-label">
                        <input type="checkbox" id="markComplete" ${goal.completed ? 'checked' : ''}>
                        <span>Mark goal as completed</span>
                        ${isKid && !goal.completed ? `<span class="vision-board-update__bonus">+${GOAL_COMPLETION_POINTS} points!</span>` : ''}
                    </label>
                </div>
            </div>
        `;

        Modal.open({
            title: 'Manage Steps',
            content,
            footer: Modal.createFooter('Cancel', 'Save')
        });

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        const refreshStepsList = () => {
            const listEl = document.getElementById('stepsList');
            if (listEl) {
                listEl.innerHTML = renderStepsList();
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
                bindStepEvents();
            }
            // Update progress display
            const newProgress = calculateProgress(goal);
            const newStats = getStepStats(goal);
            const progressSpan = document.querySelector('.vision-board-steps-modal__progress span');
            const progressFill = document.querySelector('.vision-board-steps-modal__fill');
            if (progressSpan) progressSpan.textContent = `${newStats.completed}/${newStats.total} steps (${newProgress}%)`;
            if (progressFill) progressFill.style.width = `${newProgress}%`;
        };

        const bindStepEvents = () => {
            // Toggle step completion
            document.querySelectorAll('[data-step-toggle]').forEach(checkbox => {
                checkbox.addEventListener('change', () => {
                    const index = parseInt(checkbox.dataset.stepToggle);
                    if (goal.steps[index]) {
                        const step = goal.steps[index];
                        step.completed = checkbox.checked;
                        step.completedAt = checkbox.checked ? new Date().toISOString().split('T')[0] : null;
                        refreshStepsList();

                        // Sync with Task List if this goal was added there
                        if (typeof Tasks !== 'undefined' && Tasks.syncSubtaskFromVisionBoard) {
                            Tasks.syncSubtaskFromVisionBoard(memberId, goal.title, step.title, step.completed);
                        }
                    }
                });
            });

            // Add step to task list
            document.querySelectorAll('[data-step-to-task]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const index = parseInt(btn.dataset.stepToTask);
                    const step = goal.steps[index];
                    if (step) {
                        addStepToTaskList(memberId, step.title, goal.title);
                    }
                });
            });

            // Delete step
            document.querySelectorAll('[data-step-delete]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const index = parseInt(btn.dataset.stepDelete);
                    goal.steps.splice(index, 1);
                    refreshStepsList();
                });
            });
        };

        bindStepEvents();

        // Add new step
        const addStepBtn = document.getElementById('addStepBtn');
        const newStepInput = document.getElementById('newStepInput');

        const addStep = () => {
            const title = newStepInput?.value?.trim();
            if (!title) return;

            goal.steps = goal.steps || [];
            goal.steps.push({
                id: `step-${Date.now()}`,
                title,
                completed: false,
                createdAt: new Date().toISOString().split('T')[0]
            });

            newStepInput.value = '';
            refreshStepsList();
            newStepInput.focus();
        };

        addStepBtn?.addEventListener('click', addStep);
        newStepInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') addStep();
        });

        Modal.bindFooterEvents(() => {
            let markComplete = document.getElementById('markComplete')?.checked || false;

            // If goal was completed but now has incomplete steps, auto-reactivate
            const hasIncompleteSteps = (goal.steps || []).some(step => !step.completed);
            if (wasCompleted && hasIncompleteSteps) {
                markComplete = false;
                Toast.info('Goal reactivated - has incomplete steps');
            }

            goal.completed = markComplete;
            if (markComplete && !goal.completedAt) {
                goal.completedAt = new Date().toISOString().split('T')[0];
            } else if (!markComplete) {
                goal.completedAt = null;
            }

            saveWidgetData(memberId, widgetData);

            // Award points if goal just got completed (for kids)
            if (markComplete && !wasCompleted && isKid) {
                awardGoalCompletionPoints(memberId, goal.title);
                Toast.success(`Dream achieved! +${GOAL_COMPLETION_POINTS} points!`);

                const pointsBody = document.getElementById('widget-points');
                if (pointsBody && typeof Points !== 'undefined') {
                    Points.renderWidget(pointsBody, memberId);
                    if (typeof lucide !== 'undefined') {
                        lucide.createIcons();
                    }
                }
            } else {
                Toast.success('Steps updated!');
            }

            if (onUpdate) {
                onUpdate();
            } else {
                const widgetBody = document.getElementById('widget-vision-board');
                if (widgetBody) {
                    renderWidget(widgetBody, memberId);
                }
            }

            return true;
        });
    }

    /**
     * Show edit goal modal
     */
    function showEditGoalModal(memberId, goalId, onSave = null) {
        const widgetData = getWidgetData(memberId);
        const goal = widgetData.goals?.find(g => g.id === goalId);
        if (!goal) return;

        const content = `
            <div class="vision-board-form">
                <div class="form-group">
                    <label class="form-label">Goal Title *</label>
                    <input type="text" class="form-input" id="goalTitle" value="${goal.title}" autocomplete="off">
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Category</label>
                        <select class="form-input" id="goalCategory">
                            ${GOAL_CATEGORIES.map(c => `
                                <option value="${c.id}" ${goal.category === c.id ? 'selected' : ''}>${c.name}</option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Icon</label>
                        <div class="vision-board-icon-picker" id="iconPicker">
                            <button type="button" class="vision-board-icon-picker__trigger" id="iconPickerTrigger">
                                <i data-lucide="${goal.icon || 'target'}" id="selectedIcon"></i>
                                <i data-lucide="chevron-down"></i>
                            </button>
                            <input type="hidden" id="goalIcon" value="${goal.icon || 'target'}">
                        </div>
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">Image (optional)</label>
                    <div class="vision-board-image-upload" id="imageUpload">
                        <div class="vision-board-image-upload__preview" id="imagePreview" style="${goal.imageUrl ? '' : 'display: none;'}">
                            <img id="previewImg" src="${goal.imageUrl || ''}" alt="Preview">
                            <button type="button" class="vision-board-image-upload__remove" id="removeImage">
                                <i data-lucide="x"></i>
                            </button>
                        </div>
                        <div class="vision-board-image-upload__placeholder" id="imagePlaceholder" style="${goal.imageUrl ? 'display: none;' : ''}">
                            <i data-lucide="image"></i>
                            <span>Click to upload or paste URL</span>
                            <input type="file" id="imageFile" accept="image/*" style="display: none;">
                        </div>
                        <input type="text" class="form-input form-input--sm" id="imageUrl" placeholder="Or paste image URL..." style="margin-top: 8px;" value="${goal.imageUrl || ''}">
                    </div>
                    <input type="hidden" id="goalImageUrl" value="${goal.imageUrl || ''}">
                </div>

                <div class="form-group">
                    <label class="form-label">Track Progress</label>
                    <select class="form-input" id="trackType">
                        <option value="none" ${goal.trackType === 'none' ? 'selected' : ''}>No tracking</option>
                        <option value="number" ${goal.trackType === 'number' ? 'selected' : ''}>Number</option>
                        <option value="percent" ${goal.trackType === 'percent' ? 'selected' : ''}>Percentage</option>
                    </select>
                </div>

                <div id="trackingFields" style="${goal.trackType === 'none' ? 'display: none;' : ''}">
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Current</label>
                            <input type="number" class="form-input" id="goalCurrent" value="${goal.current || 0}" min="0">
                        </div>
                        <div class="form-group" id="targetGroup" style="${goal.trackType === 'percent' ? 'display: none;' : ''}">
                            <label class="form-label">Target</label>
                            <input type="number" class="form-input" id="goalTarget" value="${goal.target || 0}" min="0">
                        </div>
                        <div class="form-group" id="unitGroup" style="${goal.trackType === 'percent' ? 'display: none;' : ''}">
                            <label class="form-label">Unit</label>
                            <select class="form-input" id="goalUnit">
                                <option value="" ${!goal.unit ? 'selected' : ''}>None</option>
                                <option value="$" ${goal.unit === '$' ? 'selected' : ''}>$ (dollars)</option>
                                <option value="lbs" ${goal.unit === 'lbs' ? 'selected' : ''}>lbs</option>
                                <option value="kg" ${goal.unit === 'kg' ? 'selected' : ''}>kg</option>
                                <option value="mi" ${goal.unit === 'mi' ? 'selected' : ''}>miles</option>
                                <option value="km" ${goal.unit === 'km' ? 'selected' : ''}>km</option>
                                <option value="hrs" ${goal.unit === 'hrs' ? 'selected' : ''}>hours</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">Target Date (optional)</label>
                    <input type="month" class="form-input" id="goalTargetDate" value="${goal.targetDate || ''}">
                </div>

                <div class="form-group">
                    <label class="form-label">Notes (optional)</label>
                    <textarea class="form-input" id="goalNotes" rows="2">${goal.notes || ''}</textarea>
                </div>

                <div class="form-group">
                    <label class="form-label">
                        <i data-lucide="list-checks" style="width: 14px; height: 14px; display: inline-block; vertical-align: middle;"></i>
                        Steps / Milestones
                    </label>
                    <p class="form-helper" style="margin-bottom: 8px;">Break down your goal into actionable steps</p>
                    <div class="vision-board-steps-input">
                        <div class="vision-board-steps-input__add">
                            <input type="text" class="form-input" id="newStepInputAdd" placeholder="Add a step...">
                            <button type="button" class="btn btn--secondary btn--sm" id="addStepBtnAdd">
                                <i data-lucide="plus"></i>
                            </button>
                        </div>
                        <div class="vision-board-steps-input__list" id="stepsListAdd"></div>
                    </div>
                    <input type="hidden" id="goalSteps" value="${JSON.stringify(goal.steps || []).replace(/"/g, '&quot;')}">
                </div>
            </div>
        `;

        Modal.open({
            title: 'Edit Goal',
            content,
            footer: Modal.createFooter('Cancel', 'Save Changes')
        });

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Initialize steps list with existing steps FIRST (before setupGoalFormInteractions)
        // This ensures the steps array is properly initialized before any event handlers
        setupStepsInput(goal.steps || []);

        // Setup other form interactions (but skip steps setup since we already did it)
        setupGoalFormInteractionsWithoutSteps();

        Modal.bindFooterEvents(() => {
            const title = document.getElementById('goalTitle')?.value?.trim();
            if (!title) {
                Toast.error('Please enter a goal title');
                return false;
            }

            // Parse steps from hidden input
            let steps = [];
            try {
                steps = JSON.parse(document.getElementById('goalSteps')?.value || '[]');
            } catch (e) {
                steps = goal.steps || [];
            }

            // Update goal
            goal.title = title;
            goal.category = document.getElementById('goalCategory')?.value || 'other';
            goal.icon = document.getElementById('goalIcon')?.value || 'target';
            goal.imageUrl = document.getElementById('goalImageUrl')?.value || null;
            goal.trackType = document.getElementById('trackType')?.value || 'none';
            goal.current = parseFloat(document.getElementById('goalCurrent')?.value) || 0;
            goal.target = parseFloat(document.getElementById('goalTarget')?.value) || 0;
            goal.unit = document.getElementById('goalUnit')?.value || '';
            goal.targetDate = document.getElementById('goalTargetDate')?.value || null;
            goal.notes = document.getElementById('goalNotes')?.value?.trim() || '';
            goal.steps = steps;

            // If goal is completed but has incomplete steps, reactivate it
            if (goal.completed && steps.length > 0) {
                const hasIncompleteSteps = steps.some(step => !step.completed);
                if (hasIncompleteSteps) {
                    goal.completed = false;
                    goal.completedAt = null;
                    Toast.info('Goal reactivated - has incomplete steps');
                }
            }

            saveWidgetData(memberId, widgetData);
            Toast.success('Goal updated!');

            if (onSave) {
                onSave();
            } else {
                const widgetBody = document.getElementById('widget-vision-board');
                if (widgetBody) {
                    renderWidget(widgetBody, memberId);
                }
            }

            return true;
        });
    }

    /**
     * Delete a goal
     */
    function deleteGoal(memberId, goalId) {
        const widgetData = getWidgetData(memberId);
        widgetData.goals = (widgetData.goals || []).filter(g => g.id !== goalId);
        saveWidgetData(memberId, widgetData);
        Toast.success('Goal deleted');
    }

    /**
     * Add a goal to the Task List
     * Creates a parent task with the goal title, and subtasks for each step
     * Bi-directional sync: completing tasks updates Vision Board, and vice versa
     */
    function addGoalToTaskList(memberId, goalId) {
        const widgetData = getWidgetData(memberId);
        const goal = (widgetData.goals || []).find(g => g.id === goalId);

        if (!goal) {
            Toast.error('Goal not found');
            return;
        }

        // Get task list data
        const taskData = Storage.getWidgetData(memberId, 'task-list') || { tasks: [] };

        // Check if this goal is already in the task list
        const existingTask = taskData.tasks.find(t => t.fromGoalId === goalId);
        if (existingTask) {
            Toast.warning('This goal is already in your Task List');
            return;
        }

        // Create the parent task
        const newTask = {
            id: `task-${Date.now()}`,
            title: goal.title,
            completed: false,
            createdAt: DateUtils.today(),
            fromGoal: goal.title,
            fromGoalId: goalId,
            subtasks: []
        };

        // Add steps as subtasks
        if (goal.steps && goal.steps.length > 0) {
            newTask.subtasks = goal.steps.map((step, index) => ({
                id: `subtask-${Date.now()}-${index}`,
                title: step.title,
                completed: step.completed || false,
                createdAt: DateUtils.today(),
                stepTitle: step.title
            }));
        }

        // Add to task list
        taskData.tasks.push(newTask);
        Storage.setWidgetData(memberId, 'task-list', taskData);

        Toast.success('Goal added to Task List');
    }

    /**
     * Sync Vision Board step completion from Task List
     * Called when a subtask linked to a goal step is toggled
     */
    function syncStepFromTask(memberId, goalTitle, stepTitle, completed) {
        const widgetData = getWidgetData(memberId);
        const goal = (widgetData.goals || []).find(g => g.title === goalTitle);

        if (!goal || !goal.steps) return;

        const step = goal.steps.find(s => s.title === stepTitle);
        if (!step) return;

        step.completed = completed;
        step.completedAt = completed ? DateUtils.today() : null;

        // Check if all steps are completed
        const allStepsComplete = goal.steps.every(s => s.completed);
        if (allStepsComplete && !goal.completed) {
            goal.completed = true;
            goal.completedAt = DateUtils.today();
            Toast.success(`Goal "${goal.title}" completed!`);
        } else if (!allStepsComplete && goal.completed) {
            // Reactivate goal if a step was unchecked
            goal.completed = false;
            goal.completedAt = null;
        }

        saveWidgetData(memberId, widgetData);
    }

    /**
     * Show confirm dialog
     */
    function showConfirmDialog(title, message) {
        return new Promise((resolve) => {
            Modal.open({
                title: title,
                content: `<p>${message}</p>`,
                footer: Modal.createFooter('Cancel', 'Delete', true)
            });

            Modal.bindFooterEvents(() => {
                resolve(true);
                return true;
            }, () => {
                resolve(false);
            });
        });
    }

    function init() {
        // Initialize vision board feature
    }

    return {
        init,
        renderWidget,
        showFullPage,
        syncStepFromTask
    };
})();
