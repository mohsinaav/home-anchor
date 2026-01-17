/**
 * Kid Tasks Feature
 * Fun, colorful task list for kids with age-adaptive styling
 * Features: Tasks list, History, and Stats tabs
 */

const KidTasks = (function() {
    // Maximum pending tasks to show in widget before "View All"
    const MAX_WIDGET_TASKS = 5;

    // Priority order for sorting (high priority first)
    const PRIORITY_ORDER = { high: 0, medium: 1, low: 2, null: 3, undefined: 3 };

    // Track current tab in full page view
    let currentTab = 'tasks';

    // Track current month offset for history view
    let historyMonthOffset = 0;

    /**
     * Sort tasks by priority (high → medium → low → none)
     */
    function sortByPriority(tasks) {
        return [...tasks].sort((a, b) => {
            const priorityA = PRIORITY_ORDER[a.priority] ?? 3;
            const priorityB = PRIORITY_ORDER[b.priority] ?? 3;
            return priorityA - priorityB;
        });
    }

    /**
     * Get widget data with defaults
     */
    function getWidgetData(memberId) {
        const stored = Storage.getWidgetData(memberId, 'kid-tasks');
        if (!stored || !stored.tasks) {
            return { tasks: [] };
        }
        return stored;
    }

    /**
     * Save widget data
     */
    function saveWidgetData(memberId, data) {
        Storage.setWidgetData(memberId, 'kid-tasks', data);
    }

    // =========================================================================
    // STATS CALCULATION HELPERS
    // =========================================================================

    /**
     * Calculate current completion streak (consecutive days with task completions)
     */
    function calculateCompletionStreak(tasks) {
        const completedDates = new Set();
        tasks.forEach(task => {
            if (task.completed && task.completedAt) {
                completedDates.add(task.completedAt);
            }
        });

        if (completedDates.size === 0) return 0;

        let streak = 0;
        let currentDate = new Date();
        const today = typeof DateUtils !== 'undefined' ? DateUtils.today() : new Date().toISOString().split('T')[0];

        // Check if today has completions, if not start from yesterday
        if (!completedDates.has(today)) {
            currentDate.setDate(currentDate.getDate() - 1);
        }

        while (true) {
            const dateStr = currentDate.toISOString().split('T')[0];
            if (completedDates.has(dateStr)) {
                streak++;
                currentDate.setDate(currentDate.getDate() - 1);
            } else {
                break;
            }
        }

        return streak;
    }

    /**
     * Calculate best streak ever
     */
    function calculateBestStreak(tasks) {
        const completedDates = new Set();
        tasks.forEach(task => {
            if (task.completed && task.completedAt) {
                completedDates.add(task.completedAt);
            }
        });

        if (completedDates.size === 0) return 0;

        const sortedDates = Array.from(completedDates).sort();
        let bestStreak = 1;
        let currentStreak = 1;

        for (let i = 1; i < sortedDates.length; i++) {
            const prevDate = new Date(sortedDates[i - 1]);
            const currDate = new Date(sortedDates[i]);
            const diffDays = Math.round((currDate - prevDate) / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                currentStreak++;
                bestStreak = Math.max(bestStreak, currentStreak);
            } else {
                currentStreak = 1;
            }
        }

        return bestStreak;
    }

    /**
     * Get count of tasks completed this month
     */
    function getThisMonthCompletedCount(tasks) {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        return tasks.filter(task => {
            if (!task.completed || !task.completedAt) return false;
            const completedDate = new Date(task.completedAt);
            return completedDate.getMonth() === currentMonth && completedDate.getFullYear() === currentYear;
        }).length;
    }

    /**
     * Get last month's completed count
     */
    function getLastMonthCompletedCount(tasks) {
        const now = new Date();
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthNum = lastMonth.getMonth();
        const lastMonthYear = lastMonth.getFullYear();

        return tasks.filter(task => {
            if (!task.completed || !task.completedAt) return false;
            const completedDate = new Date(task.completedAt);
            return completedDate.getMonth() === lastMonthNum && completedDate.getFullYear() === lastMonthYear;
        }).length;
    }

    /**
     * Calculate average tasks completed per day (last 30 days)
     */
    function calculateAvgTasksPerDay(tasks) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentCompleted = tasks.filter(task => {
            if (!task.completed || !task.completedAt) return false;
            return new Date(task.completedAt) >= thirtyDaysAgo;
        });

        const avg = recentCompleted.length / 30;
        return avg.toFixed(1);
    }

    /**
     * Get most productive day of week
     */
    function getMostProductiveDay(tasks) {
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayCounts = [0, 0, 0, 0, 0, 0, 0];

        tasks.forEach(task => {
            if (task.completed && task.completedAt) {
                const day = new Date(task.completedAt).getDay();
                dayCounts[day]++;
            }
        });

        const maxCount = Math.max(...dayCounts);
        if (maxCount === 0) return null;

        const maxDayIndex = dayCounts.indexOf(maxCount);
        return dayNames[maxDayIndex];
    }

    /**
     * Get weekly completion data for chart
     */
    function getWeeklyCompletionData(tasks) {
        const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
        const today = new Date();
        const dayOfWeek = today.getDay();
        const data = [];

        // Get start of week (Sunday)
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - dayOfWeek);
        startOfWeek.setHours(0, 0, 0, 0);

        let maxCount = 0;

        for (let i = 0; i < 7; i++) {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];

            const count = tasks.filter(task => task.completed && task.completedAt === dateStr).length;
            maxCount = Math.max(maxCount, count);

            data.push({
                label: dayNames[i],
                count,
                date: dateStr,
                percentage: 0
            });
        }

        // Calculate percentages
        data.forEach(day => {
            day.percentage = maxCount > 0 ? Math.round((day.count / maxCount) * 100) : 0;
        });

        return data;
    }

    /**
     * Get completion rate percentage
     */
    function getCompletionRate(tasks) {
        const completedTasks = tasks.filter(t => t.completed);
        return tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;
    }

    // =========================================================================
    // WIDGET RENDERING
    // =========================================================================

    /**
     * Render the kid tasks widget
     */
    function renderWidget(container, memberId) {
        const member = Storage.getMember(memberId);
        const widgetData = getWidgetData(memberId);
        const tasks = widgetData.tasks || [];
        const pendingTasks = sortByPriority(tasks.filter(t => !t.completed));
        const completedTasks = tasks.filter(t => t.completed);
        const displayTasks = pendingTasks.slice(0, MAX_WIDGET_TASKS);
        const hasMore = pendingTasks.length > MAX_WIDGET_TASKS;

        // Get age-adaptive text
        const emptyText = typeof KidTheme !== 'undefined'
            ? KidTheme.getText('tasks.empty', member)
            : 'No tasks yet! Add something above! 📝';

        container.innerHTML = `
            <div class="kid-tasks-widget">
                <div class="kid-tasks-widget__add">
                    <input type="text" class="form-input kid-tasks-widget__input" id="newKidTaskInput" placeholder="What do you want to do?">
                    <button class="btn btn--primary btn--sm" id="addKidTaskBtn">
                        <i data-lucide="plus"></i>
                    </button>
                </div>

                <div class="kid-tasks-widget__list">
                    ${pendingTasks.length === 0
                        ? `<p class="kid-tasks-widget__empty">${emptyText}</p>`
                        : ''
                    }

                    ${displayTasks.map(task => renderTaskItem(task)).join('')}

                    ${hasMore ? `
                        <button class="kid-tasks-widget__more-btn" data-view-all-tasks="${memberId}">
                            +${pendingTasks.length - MAX_WIDGET_TASKS} more task${pendingTasks.length - MAX_WIDGET_TASKS !== 1 ? 's' : ''}
                        </button>
                    ` : ''}
                </div>

                <div class="kid-tasks-widget__footer">
                    <button class="btn btn--sm btn--ghost" data-action="view-all">
                        <i data-lucide="list"></i>
                        View All (${tasks.length})
                    </button>
                    ${completedTasks.length > 0 ? `
                        <span class="kid-tasks-widget__completed-count">
                            <i data-lucide="check-circle"></i>
                            ${completedTasks.length} done
                        </span>
                    ` : ''}
                </div>
            </div>
        `;

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        bindWidgetEvents(container, memberId, widgetData);
    }

    /**
     * Render a single task item
     */
    function renderTaskItem(task, isDraggable = true) {
        const completedClass = task.completed ? 'kid-task-item--completed' : '';

        return `
            <div class="kid-task-item ${completedClass}" data-task-id="${task.id}" ${isDraggable ? 'draggable="true"' : ''}>
                ${isDraggable ? `
                    <div class="kid-task-item__drag-handle" title="Drag to reorder">
                        <i data-lucide="grip-vertical"></i>
                    </div>
                ` : ''}
                <label class="kid-task-item__checkbox-wrapper">
                    <input type="checkbox" class="kid-task-item__checkbox" ${task.completed ? 'checked' : ''} data-task-toggle="${task.id}">
                    <span class="kid-task-item__checkmark"></span>
                </label>
                <div class="kid-task-item__content" data-edit="${task.id}">
                    <span class="kid-task-item__title">${task.title}</span>
                </div>
                <button class="btn btn--icon btn--ghost btn--sm kid-task-item__delete" data-delete="${task.id}">
                    <i data-lucide="trash-2"></i>
                </button>
            </div>
        `;
    }

    /**
     * Bind widget events
     */
    function bindWidgetEvents(container, memberId, widgetData) {
        // Add task
        const addBtn = container.querySelector('#addKidTaskBtn');
        const input = container.querySelector('#newKidTaskInput');

        const addTask = () => {
            const title = input?.value?.trim();
            if (!title) return;

            const newTask = {
                id: `kid-task-${Date.now()}`,
                title,
                completed: false,
                createdAt: new Date().toISOString().split('T')[0]
            };

            widgetData.tasks = [...(widgetData.tasks || []), newTask];
            saveWidgetData(memberId, widgetData);
            renderWidget(container, memberId);
            Toast.success('Task added!');
        };

        addBtn?.addEventListener('click', () => {
            addTask();
            // Re-focus input after re-render
            setTimeout(() => {
                document.getElementById('newKidTaskInput')?.focus();
            }, 50);
        });
        input?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                addTask();
                // Re-focus input after re-render
                setTimeout(() => {
                    document.getElementById('newKidTaskInput')?.focus();
                }, 50);
            }
        });

        // Toggle task completion
        container.querySelectorAll('[data-task-toggle]').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                const taskId = checkbox.dataset.taskToggle;
                const task = widgetData.tasks.find(t => t.id === taskId);
                if (task) {
                    task.completed = checkbox.checked;
                    task.completedAt = checkbox.checked ? new Date().toISOString().split('T')[0] : null;
                    saveWidgetData(memberId, widgetData);
                    // Sync with Vision Board if this task came from a goal step
                    syncWithVisionBoard(memberId, task);
                    renderWidget(container, memberId);
                }
            });
        });

        // Delete task
        container.querySelectorAll('[data-delete]').forEach(btn => {
            btn.addEventListener('click', () => {
                const taskId = btn.dataset.delete;
                widgetData.tasks = widgetData.tasks.filter(t => t.id !== taskId);
                saveWidgetData(memberId, widgetData);
                renderWidget(container, memberId);
                Toast.success('Task deleted');
            });
        });

        // Edit task on click (inline editing)
        container.querySelectorAll('[data-edit]').forEach(el => {
            el.addEventListener('click', (e) => {
                // Don't trigger if clicking on checkbox or already editing
                if (e.target.closest('.kid-task-item__checkbox-wrapper')) return;
                if (el.querySelector('.kid-task-item__edit-input')) return;

                const taskId = el.dataset.edit;
                const task = widgetData.tasks.find(t => t.id === taskId);
                if (!task) return;

                const titleEl = el.querySelector('.kid-task-item__title');
                const originalTitle = task.title;

                // Replace title with input
                titleEl.innerHTML = `<input type="text" class="kid-task-item__edit-input" value="${originalTitle}" />`;
                const input = titleEl.querySelector('input');
                input.focus();
                input.select();

                const saveEdit = () => {
                    const newTitle = input.value.trim();
                    if (newTitle && newTitle !== originalTitle) {
                        task.title = newTitle;
                        saveWidgetData(memberId, widgetData);
                        Toast.success('Task updated!');
                    }
                    renderWidget(container, memberId);
                    if (typeof lucide !== 'undefined') {
                        lucide.createIcons();
                    }
                };

                input.addEventListener('blur', saveEdit);
                input.addEventListener('keydown', (evt) => {
                    if (evt.key === 'Enter') {
                        evt.preventDefault();
                        input.blur();
                    } else if (evt.key === 'Escape') {
                        renderWidget(container, memberId);
                        if (typeof lucide !== 'undefined') {
                            lucide.createIcons();
                        }
                    }
                });
            });
        });

        // View All button
        container.querySelector('[data-action="view-all"]')?.addEventListener('click', () => {
            showFullPage(memberId);
        });

        // "+X more" button
        container.querySelector('[data-view-all-tasks]')?.addEventListener('click', () => {
            showFullPage(memberId);
        });

        // Drag and drop for reordering tasks
        bindDragAndDrop(container, memberId, widgetData, false);
    }

    /**
     * Bind drag and drop events for task reordering
     */
    function bindDragAndDrop(container, memberId, widgetData, isFullPage = false, member = null) {
        const taskItems = container.querySelectorAll('[data-task-id][draggable="true"]');
        let draggedItem = null;
        let draggedTaskId = null;

        taskItems.forEach(item => {
            // Drag start
            item.addEventListener('dragstart', (e) => {
                draggedItem = item;
                draggedTaskId = item.dataset.taskId;
                item.classList.add('kid-task-item--dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', draggedTaskId);
            });

            // Drag end
            item.addEventListener('dragend', () => {
                if (draggedItem) {
                    draggedItem.classList.remove('kid-task-item--dragging');
                    draggedItem.classList.remove('kid-task-page-item--dragging');
                }
                draggedItem = null;
                draggedTaskId = null;
                // Remove all drag-over classes
                container.querySelectorAll('.kid-task-item--drag-over, .kid-task-page-item--drag-over').forEach(el => {
                    el.classList.remove('kid-task-item--drag-over');
                    el.classList.remove('kid-task-page-item--drag-over');
                });
            });

            // Drag over
            item.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (item !== draggedItem) {
                    item.classList.add(isFullPage ? 'kid-task-page-item--drag-over' : 'kid-task-item--drag-over');
                }
            });

            // Drag leave
            item.addEventListener('dragleave', () => {
                item.classList.remove('kid-task-item--drag-over');
                item.classList.remove('kid-task-page-item--drag-over');
            });

            // Drop
            item.addEventListener('drop', (e) => {
                e.preventDefault();
                item.classList.remove('kid-task-item--drag-over');
                item.classList.remove('kid-task-page-item--drag-over');

                if (!draggedTaskId || item.dataset.taskId === draggedTaskId) return;

                const targetTaskId = item.dataset.taskId;
                reorderTasks(memberId, widgetData, draggedTaskId, targetTaskId, container, isFullPage, member);
            });
        });
    }

    /**
     * Reorder tasks after drag and drop
     */
    function reorderTasks(memberId, widgetData, draggedTaskId, targetTaskId, container, isFullPage, member) {
        const tasks = widgetData.tasks || [];
        const draggedIndex = tasks.findIndex(t => t.id === draggedTaskId);
        const targetIndex = tasks.findIndex(t => t.id === targetTaskId);

        if (draggedIndex === -1 || targetIndex === -1) return;

        // Remove dragged task and insert at new position
        const [draggedTask] = tasks.splice(draggedIndex, 1);
        tasks.splice(targetIndex, 0, draggedTask);

        widgetData.tasks = tasks;
        saveWidgetData(memberId, widgetData);

        // Re-render the appropriate view
        if (isFullPage && member) {
            renderFullPage(container, memberId, member, currentTab);
        } else {
            renderWidget(container, memberId);
        }

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    // =========================================================================
    // FULL PAGE RENDERING
    // =========================================================================

    /**
     * Show full page view
     */
    function showFullPage(memberId) {
        const main = document.getElementById('mainContent');
        if (!main) return;

        const member = Storage.getMember(memberId);
        currentTab = 'tasks';
        historyMonthOffset = 0;
        renderFullPage(main, memberId, member, currentTab);
    }

    /**
     * Render full page with tabs
     */
    function renderFullPage(container, memberId, member, tab = 'tasks') {
        const widgetData = getWidgetData(memberId);
        const tasks = widgetData.tasks || [];
        const pendingTasks = sortByPriority(tasks.filter(t => !t.completed));
        const completedTasks = tasks.filter(t => t.completed);

        // Get age-adaptive content
        const useKidTheme = typeof KidTheme !== 'undefined';
        const ageGroup = useKidTheme ? KidTheme.getAgeGroup(member) : 'kid';
        const isYoungKid = ageGroup === 'kid' || ageGroup === 'toddler';
        const colors = useKidTheme ? KidTheme.getColors('kid-tasks') : { gradient: 'linear-gradient(135deg, #FEF9C3 0%, #FEF08A 50%, #FDE047 100%)' };

        // Calculate hero stats
        const streak = calculateCompletionStreak(tasks);
        const thisMonth = getThisMonthCompletedCount(tasks);
        const doneRate = getCompletionRate(tasks);

        // Get tab content
        const tabContent = renderTabContent(tab, memberId, member, widgetData, pendingTasks, completedTasks);

        // Define tabs
        const tabs = [
            { id: 'tasks', label: isYoungKid ? '📋 Tasks' : 'Tasks', icon: 'list-todo', emoji: '📋' },
            { id: 'history', label: isYoungKid ? '📅 History' : 'History', icon: 'history', emoji: '📅' },
            { id: 'stats', label: isYoungKid ? '📊 Stats' : 'Stats', icon: 'bar-chart-2', emoji: '📊' }
        ];

        container.innerHTML = `
            <div class="kid-page kid-page--tasks ${useKidTheme ? KidTheme.getAgeClass(member) : ''}">
                <!-- Hero Section -->
                <div class="kid-page__hero" style="background: ${colors.gradient}; --kid-hero-text: ${colors.dark}">
                    <button class="btn btn--ghost kid-page__back" id="backToMemberBtn">
                        <i data-lucide="arrow-left"></i>
                        Back
                    </button>
                    <div class="kid-page__hero-content">
                        <h1 class="kid-page__hero-title ${isYoungKid ? 'kid-page__hero-title--playful' : ''}">
                            ${isYoungKid ? '📝 My Tasks!' : 'My Tasks'}
                        </h1>
                    </div>
                    <div class="kid-page__hero-stats">
                        <div class="kid-hero-stat">
                            <span class="kid-hero-stat__value">${streak}</span>
                            <span class="kid-hero-stat__label">${isYoungKid ? '🔥 Day Streak' : 'Day Streak'}</span>
                        </div>
                        <div class="kid-hero-stat">
                            <span class="kid-hero-stat__value">${thisMonth}</span>
                            <span class="kid-hero-stat__label">${isYoungKid ? '⭐ This Month' : 'This Month'}</span>
                        </div>
                        <div class="kid-hero-stat">
                            <span class="kid-hero-stat__value">${doneRate}%</span>
                            <span class="kid-hero-stat__label">${isYoungKid ? '✅ Done Rate' : 'Done Rate'}</span>
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
    function renderTabContent(tab, memberId, member, widgetData, pendingTasks, completedTasks) {
        switch (tab) {
            case 'tasks':
                return renderTasksTab(memberId, member, widgetData, pendingTasks, completedTasks);
            case 'history':
                return renderHistoryTab(memberId, member, widgetData);
            case 'stats':
                return renderStatsTab(memberId, member, widgetData);
            default:
                return renderTasksTab(memberId, member, widgetData, pendingTasks, completedTasks);
        }
    }

    /**
     * Render Tasks tab content
     */
    function renderTasksTab(memberId, member, widgetData, pendingTasks, completedTasks) {
        const tasks = widgetData.tasks || [];
        const useKidTheme = typeof KidTheme !== 'undefined';
        const ageGroup = useKidTheme ? KidTheme.getAgeGroup(member) : 'kid';
        const isYoungKid = ageGroup === 'kid' || ageGroup === 'toddler';

        const todoLabel = isYoungKid ? '📋 Things To Do' : 'To Do';
        const doneLabel = isYoungKid ? '✅ All Done!' : 'Completed';
        const emptyText = useKidTheme ? KidTheme.getText('tasks.empty', member) : 'No tasks yet! Add your first task above!';

        return `
            <div class="kid-tasks-page__add">
                <input type="text" class="form-input" id="newKidTaskInputPage" placeholder="${isYoungKid ? 'What do you want to do?' : 'Add a new task...'}">
                <button class="btn btn--primary" id="addKidTaskBtnPage">
                    <i data-lucide="plus"></i>
                    ${isYoungKid ? 'Add!' : 'Add'}
                </button>
            </div>

            ${pendingTasks.length > 0 ? `
                <div class="kid-tasks-page__section">
                    <h2 class="kid-tasks-page__section-title">
                        ${todoLabel} (${pendingTasks.length})
                    </h2>
                    <div class="kid-tasks-page__list">
                        ${pendingTasks.map(task => renderFullPageTaskItem(task)).join('')}
                    </div>
                </div>
            ` : ''}

            ${completedTasks.length > 0 ? `
                <div class="kid-tasks-page__section kid-tasks-page__section--completed">
                    <h2 class="kid-tasks-page__section-title kid-tasks-page__section-title--done">
                        ${doneLabel}
                        <button class="btn btn--sm btn--ghost btn--danger" id="clearCompletedBtn">
                            <i data-lucide="trash-2"></i>
                            Clear All
                        </button>
                    </h2>
                    <div class="kid-tasks-page__list">
                        ${completedTasks.map(task => renderFullPageTaskItem(task, true)).join('')}
                    </div>
                </div>
            ` : ''}

            ${tasks.length === 0 ? `
                <div class="kid-page__empty ${isYoungKid ? 'kid-page__empty--playful' : ''}">
                    <div class="kid-page__empty-icon">📝</div>
                    <p>${emptyText}</p>
                </div>
            ` : ''}
        `;
    }

    /**
     * Render History tab content - shows completed tasks grouped by date
     */
    function renderHistoryTab(memberId, member, widgetData) {
        const tasks = widgetData.tasks || [];
        const completedTasks = tasks.filter(t => t.completed && t.completedAt);
        const useKidTheme = typeof KidTheme !== 'undefined';
        const ageGroup = useKidTheme ? KidTheme.getAgeGroup(member) : 'kid';
        const isYoungKid = ageGroup === 'kid' || ageGroup === 'toddler';

        // Get the target month based on offset
        const targetDate = new Date();
        targetDate.setMonth(targetDate.getMonth() + historyMonthOffset);
        const targetMonth = targetDate.getMonth();
        const targetYear = targetDate.getFullYear();

        // Filter tasks for the target month
        const monthTasks = completedTasks.filter(task => {
            const completedDate = new Date(task.completedAt);
            return completedDate.getMonth() === targetMonth && completedDate.getFullYear() === targetYear;
        });

        // Group by date
        const groupedByDate = {};
        monthTasks.forEach(task => {
            const date = task.completedAt;
            if (!groupedByDate[date]) {
                groupedByDate[date] = [];
            }
            groupedByDate[date].push(task);
        });

        // Sort dates in descending order
        const sortedDates = Object.keys(groupedByDate).sort((a, b) => new Date(b) - new Date(a));

        const monthName = targetDate.toLocaleString('default', { month: 'long', year: 'numeric' });
        const isCurrentMonth = historyMonthOffset === 0;
        const today = typeof DateUtils !== 'undefined' ? DateUtils.today() : new Date().toISOString().split('T')[0];

        return `
            <div class="kid-tasks-history">
                <div class="kid-tasks-history__nav">
                    <button class="btn btn--ghost btn--sm" id="historyPrevMonth">
                        <i data-lucide="chevron-left"></i>
                    </button>
                    <span class="kid-tasks-history__month">${monthName}</span>
                    <button class="btn btn--ghost btn--sm" id="historyNextMonth" ${isCurrentMonth ? 'disabled' : ''}>
                        <i data-lucide="chevron-right"></i>
                    </button>
                </div>

                <div class="kid-tasks-history__summary">
                    <div class="kid-tasks-history__summary-stat">
                        ${isYoungKid ? '✅' : '<i data-lucide="check-circle"></i>'}
                        <span>${monthTasks.length} ${isYoungKid ? 'tasks done!' : 'tasks completed'}</span>
                    </div>
                    <div class="kid-tasks-history__summary-stat">
                        ${isYoungKid ? '📅' : '<i data-lucide="calendar"></i>'}
                        <span>${sortedDates.length} ${isYoungKid ? 'active days!' : 'active days'}</span>
                    </div>
                </div>

                ${sortedDates.length > 0 ? `
                    <div class="kid-tasks-history__days">
                        ${sortedDates.map(date => {
                            const dayTasks = groupedByDate[date];
                            const dateObj = new Date(date);
                            const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
                            const dayNum = dateObj.getDate();
                            const monthShort = dateObj.toLocaleDateString('en-US', { month: 'short' });
                            const isToday = date === today;

                            return `
                                <div class="kid-tasks-history__day ${isToday ? 'kid-tasks-history__day--today' : ''}">
                                    <div class="kid-tasks-history__day-header">
                                        <div class="kid-tasks-history__day-date">
                                            <span class="kid-tasks-history__day-num">${dayNum}</span>
                                            <div class="kid-tasks-history__day-info">
                                                <span class="kid-tasks-history__day-name">${dayName}</span>
                                                <span class="kid-tasks-history__day-month">${monthShort}</span>
                                            </div>
                                        </div>
                                        <span class="kid-tasks-history__day-count">${dayTasks.length} ${isYoungKid ? '⭐' : 'task' + (dayTasks.length !== 1 ? 's' : '')}</span>
                                    </div>
                                    <div class="kid-tasks-history__day-tasks">
                                        ${dayTasks.map(task => `
                                            <div class="kid-tasks-history__task">
                                                ${isYoungKid ? '✓' : '<i data-lucide="check"></i>'}
                                                <span>${task.title}</span>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                ` : `
                    <div class="kid-page__empty ${isYoungKid ? 'kid-page__empty--playful' : ''}">
                        <div class="kid-page__empty-icon">📅</div>
                        <p>${isYoungKid ? 'No tasks done yet this month! Keep going! 💪' : 'No tasks were completed in ' + monthName}</p>
                    </div>
                `}
            </div>
        `;
    }

    /**
     * Render Stats tab content
     */
    function renderStatsTab(memberId, member, widgetData) {
        const tasks = widgetData.tasks || [];
        const completedTasks = tasks.filter(t => t.completed);
        const useKidTheme = typeof KidTheme !== 'undefined';
        const ageGroup = useKidTheme ? KidTheme.getAgeGroup(member) : 'kid';
        const isYoungKid = ageGroup === 'kid' || ageGroup === 'toddler';

        // Calculate various stats
        const streak = calculateCompletionStreak(tasks);
        const bestStreak = calculateBestStreak(tasks);
        const thisMonthCompleted = getThisMonthCompletedCount(tasks);
        const lastMonthCompleted = getLastMonthCompletedCount(tasks);
        const completionRate = getCompletionRate(tasks);
        const avgPerDay = calculateAvgTasksPerDay(tasks);
        const mostProductiveDay = getMostProductiveDay(tasks);
        const weeklyData = getWeeklyCompletionData(tasks);

        // Month progress
        const now = new Date();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const dayOfMonth = now.getDate();
        const monthProgress = Math.round((dayOfMonth / daysInMonth) * 100);

        return `
            <div class="kid-tasks-stats">
                <!-- Streak Cards -->
                <div class="kid-tasks-stats__streaks">
                    <div class="kid-tasks-stats__streak-card kid-tasks-stats__streak-card--current">
                        <div class="kid-tasks-stats__streak-icon">
                            ${isYoungKid ? '🔥' : '<i data-lucide="flame"></i>'}
                        </div>
                        <div class="kid-tasks-stats__streak-info">
                            <span class="kid-tasks-stats__streak-value">${streak}</span>
                            <span class="kid-tasks-stats__streak-label">${isYoungKid ? 'Day Streak!' : 'Current Streak'}</span>
                        </div>
                    </div>
                    <div class="kid-tasks-stats__streak-card kid-tasks-stats__streak-card--best">
                        <div class="kid-tasks-stats__streak-icon">
                            ${isYoungKid ? '🏆' : '<i data-lucide="trophy"></i>'}
                        </div>
                        <div class="kid-tasks-stats__streak-info">
                            <span class="kid-tasks-stats__streak-value">${bestStreak}</span>
                            <span class="kid-tasks-stats__streak-label">${isYoungKid ? 'Best Streak!' : 'Best Streak'}</span>
                        </div>
                    </div>
                </div>

                <!-- Month Progress -->
                <div class="kid-tasks-stats__month-card">
                    <div class="kid-tasks-stats__month-header">
                        <h3>${isYoungKid ? '📅 This Month' : "This Month's Progress"}</h3>
                        <span class="kid-tasks-stats__month-count">${thisMonthCompleted} ${isYoungKid ? '⭐' : 'completed'}</span>
                    </div>
                    <div class="kid-tasks-stats__progress-bar">
                        <div class="kid-tasks-stats__progress-fill" style="width: ${monthProgress}%"></div>
                    </div>
                    <div class="kid-tasks-stats__month-footer">
                        <span>Day ${dayOfMonth} of ${daysInMonth}</span>
                        ${lastMonthCompleted > 0 ? `
                            <span class="kid-tasks-stats__comparison ${thisMonthCompleted >= lastMonthCompleted ? 'kid-tasks-stats__comparison--up' : 'kid-tasks-stats__comparison--down'}">
                                ${isYoungKid
                                    ? (thisMonthCompleted >= lastMonthCompleted ? '📈 +' : '📉 ') + (thisMonthCompleted - lastMonthCompleted)
                                    : `<i data-lucide="${thisMonthCompleted >= lastMonthCompleted ? 'trending-up' : 'trending-down'}"></i> ${thisMonthCompleted >= lastMonthCompleted ? '+' : ''}${thisMonthCompleted - lastMonthCompleted}`
                                } vs last month
                            </span>
                        ` : ''}
                    </div>
                </div>

                <!-- Weekly Chart -->
                <div class="kid-tasks-stats__weekly-card">
                    <h3>${isYoungKid ? '📊 This Week' : 'This Week'}</h3>
                    <div class="kid-tasks-stats__weekly-chart">
                        ${weeklyData.map(day => `
                            <div class="kid-tasks-stats__weekly-bar">
                                <div class="kid-tasks-stats__weekly-fill" style="height: ${day.percentage}%"></div>
                                <span class="kid-tasks-stats__weekly-label">${day.label}</span>
                                <span class="kid-tasks-stats__weekly-count">${day.count}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Quick Stats Grid -->
                <div class="kid-tasks-stats__grid">
                    <div class="kid-tasks-stats__grid-item">
                        ${isYoungKid ? '<span class="emoji-stat">📊</span>' : '<i data-lucide="percent"></i>'}
                        <span class="kid-tasks-stats__grid-value">${completionRate}%</span>
                        <span class="kid-tasks-stats__grid-label">${isYoungKid ? 'Done!' : 'Completion Rate'}</span>
                    </div>
                    <div class="kid-tasks-stats__grid-item">
                        ${isYoungKid ? '<span class="emoji-stat">⚡</span>' : '<i data-lucide="activity"></i>'}
                        <span class="kid-tasks-stats__grid-value">${avgPerDay}</span>
                        <span class="kid-tasks-stats__grid-label">${isYoungKid ? 'Per Day' : 'Avg/Day'}</span>
                    </div>
                    <div class="kid-tasks-stats__grid-item">
                        ${isYoungKid ? '<span class="emoji-stat">⭐</span>' : '<i data-lucide="star"></i>'}
                        <span class="kid-tasks-stats__grid-value">${mostProductiveDay || '-'}</span>
                        <span class="kid-tasks-stats__grid-label">${isYoungKid ? 'Best Day' : 'Best Day'}</span>
                    </div>
                    <div class="kid-tasks-stats__grid-item">
                        ${isYoungKid ? '<span class="emoji-stat">✅</span>' : '<i data-lucide="list-checks"></i>'}
                        <span class="kid-tasks-stats__grid-value">${completedTasks.length}</span>
                        <span class="kid-tasks-stats__grid-label">${isYoungKid ? 'Total Done!' : 'Total Done'}</span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render task item for full page view
     */
    function renderFullPageTaskItem(task, isCompleted = false) {
        const isDraggable = !isCompleted;

        return `
            <div class="kid-task-page-item ${isCompleted ? 'kid-task-page-item--completed' : ''}" data-task-id="${task.id}" ${isDraggable ? 'draggable="true"' : ''}>
                ${isDraggable ? `
                    <div class="kid-task-page-item__drag-handle" title="Drag to reorder">
                        <i data-lucide="grip-vertical"></i>
                    </div>
                ` : ''}
                <label class="kid-task-page-item__checkbox-wrapper">
                    <input type="checkbox" class="kid-task-page-item__checkbox" ${isCompleted ? 'checked' : ''} data-task-toggle="${task.id}">
                    <span class="kid-task-page-item__checkmark"></span>
                </label>
                <div class="kid-task-page-item__content" data-edit="${task.id}">
                    <span class="kid-task-page-item__title">${task.title}</span>
                    ${task.completedAt ? `
                        <span class="kid-task-page-item__completed-date">
                            Done ${task.completedAt}
                        </span>
                    ` : ''}
                </div>
                <button class="btn btn--icon btn--ghost btn--sm kid-task-page-item__edit" data-edit-btn="${task.id}" title="Edit task">
                    <i data-lucide="pencil"></i>
                </button>
                <button class="btn btn--icon btn--ghost btn--sm kid-task-page-item__delete" data-delete="${task.id}">
                    <i data-lucide="trash-2"></i>
                </button>
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
                    historyMonthOffset = 0;
                    renderFullPage(container, memberId, member, tabName);
                }
            });
        });

        // Tab-specific event bindings
        if (tab === 'tasks') {
            bindTasksTabEvents(container, memberId, member, widgetData);
        } else if (tab === 'history') {
            bindHistoryTabEvents(container, memberId, member, widgetData);
        }
    }

    /**
     * Bind events for Tasks tab
     */
    function bindTasksTabEvents(container, memberId, member, widgetData) {
        // Add task from full page
        const addBtnPage = document.getElementById('addKidTaskBtnPage');
        const inputPage = document.getElementById('newKidTaskInputPage');

        const addTaskFromPage = () => {
            const title = inputPage?.value?.trim();
            if (!title) return;

            const newTask = {
                id: `kid-task-${Date.now()}`,
                title,
                completed: false,
                createdAt: new Date().toISOString().split('T')[0]
            };

            widgetData.tasks = [...(widgetData.tasks || []), newTask];
            saveWidgetData(memberId, widgetData);
            renderFullPage(container, memberId, member, 'tasks');
            Toast.success('Task added!');

            // Re-focus input after re-render
            setTimeout(() => {
                document.getElementById('newKidTaskInputPage')?.focus();
            }, 50);
        };

        addBtnPage?.addEventListener('click', addTaskFromPage);
        inputPage?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') addTaskFromPage();
        });

        // Toggle task completion
        container.querySelectorAll('[data-task-toggle]').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                const taskId = checkbox.dataset.taskToggle;
                const task = widgetData.tasks.find(t => t.id === taskId);
                if (task) {
                    task.completed = checkbox.checked;
                    task.completedAt = checkbox.checked ? new Date().toISOString().split('T')[0] : null;
                    saveWidgetData(memberId, widgetData);
                    // Sync with Vision Board if this task came from a goal step
                    syncWithVisionBoard(memberId, task);
                    renderFullPage(container, memberId, member, 'tasks');
                }
            });
        });

        // Delete task
        container.querySelectorAll('[data-delete]').forEach(btn => {
            btn.addEventListener('click', () => {
                const taskId = btn.dataset.delete;
                widgetData.tasks = widgetData.tasks.filter(t => t.id !== taskId);
                saveWidgetData(memberId, widgetData);
                renderFullPage(container, memberId, member, 'tasks');
                Toast.success('Task deleted');
            });
        });

        // Clear completed
        document.getElementById('clearCompletedBtn')?.addEventListener('click', () => {
            if (confirm('Delete all completed tasks?')) {
                widgetData.tasks = widgetData.tasks.filter(t => !t.completed);
                saveWidgetData(memberId, widgetData);
                renderFullPage(container, memberId, member, 'tasks');
                Toast.success('Completed tasks cleared');
            }
        });

        // Edit task on click (inline editing)
        const startInlineEdit = (el, taskId) => {
            // Don't start if already editing
            if (el.querySelector('.kid-task-page-item__edit-input')) return;

            const task = widgetData.tasks.find(t => t.id === taskId);
            if (!task) return;

            const titleEl = el.querySelector('.kid-task-page-item__title');
            const originalTitle = task.title;

            // Replace title with input
            titleEl.innerHTML = `<input type="text" class="kid-task-page-item__edit-input" value="${originalTitle}" />`;
            const input = titleEl.querySelector('input');
            input.focus();
            input.select();

            const saveEdit = () => {
                const newTitle = input.value.trim();
                if (newTitle && newTitle !== originalTitle) {
                    task.title = newTitle;
                    saveWidgetData(memberId, widgetData);
                    Toast.success('Task updated!');
                }
                renderFullPage(container, memberId, member, 'tasks');
            };

            input.addEventListener('blur', saveEdit);
            input.addEventListener('keydown', (evt) => {
                if (evt.key === 'Enter') {
                    evt.preventDefault();
                    input.blur();
                } else if (evt.key === 'Escape') {
                    renderFullPage(container, memberId, member, 'tasks');
                }
            });
        };

        container.querySelectorAll('[data-edit]').forEach(el => {
            el.addEventListener('click', (e) => {
                // Don't trigger if clicking on checkbox
                if (e.target.closest('.kid-task-page-item__checkbox-wrapper')) return;
                startInlineEdit(el, el.dataset.edit);
            });
        });

        // Edit button click
        container.querySelectorAll('[data-edit-btn]').forEach(btn => {
            btn.addEventListener('click', () => {
                const taskId = btn.dataset.editBtn;
                const contentEl = container.querySelector(`[data-edit="${taskId}"]`);
                if (contentEl) {
                    startInlineEdit(contentEl, taskId);
                }
            });
        });

        // Drag and drop for reordering tasks (full page)
        bindDragAndDrop(container, memberId, widgetData, true, member);
    }

    /**
     * Bind events for History tab
     */
    function bindHistoryTabEvents(container, memberId, member, widgetData) {
        // Previous month
        document.getElementById('historyPrevMonth')?.addEventListener('click', () => {
            historyMonthOffset--;
            renderFullPage(container, memberId, member, 'history');
        });

        // Next month
        document.getElementById('historyNextMonth')?.addEventListener('click', () => {
            if (historyMonthOffset < 0) {
                historyMonthOffset++;
                renderFullPage(container, memberId, member, 'history');
            }
        });
    }

    /**
     * Sync task completion with Vision Board steps
     * When a task that came from a Vision Board goal is completed/uncompleted,
     * update the corresponding step in the Vision Board
     */
    function syncWithVisionBoard(memberId, task) {
        // Only sync tasks that came from a Vision Board goal
        if (!task.fromGoal || !task.stepTitle) return;

        const visionData = Storage.getWidgetData(memberId, 'vision-board');
        if (!visionData || !visionData.goals) return;

        // Find the goal this task came from
        const goal = visionData.goals.find(g => g.title === task.fromGoal);
        if (!goal || !goal.steps) return;

        // Find and update the matching step
        const step = goal.steps.find(s => s.title === task.stepTitle);
        if (!step) return;

        // Update the step completion status
        const today = typeof DateUtils !== 'undefined' ? DateUtils.today() : new Date().toISOString().split('T')[0];
        step.completed = task.completed;
        step.completedAt = task.completed ? today : null;
        Storage.setWidgetData(memberId, 'vision-board', visionData);

        // If goal was completed but now has incomplete steps, reactivate it
        if (goal.completed && !task.completed) {
            goal.completed = false;
            goal.completedAt = null;
            Storage.setWidgetData(memberId, 'vision-board', visionData);
        }

        // Refresh Vision Board widget if visible
        const visionBody = document.getElementById('widget-vision-board');
        if (visionBody && typeof VisionBoard !== 'undefined') {
            VisionBoard.renderWidget(visionBody, memberId);
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }
    }

    function init() {
        // Initialize kid tasks feature
    }

    return {
        init,
        renderWidget,
        showFullPage,
        syncWithVisionBoard
    };
})();
