/**
 * Toddler Tasks Feature
 * Simple, visual task list for toddlers with big checkboxes and easy tapping
 * Same functionality as adult/kid tasks but with toddler-friendly theme
 */

const ToddlerTasks = (function() {
    // Maximum pending tasks to show in widget before "View All"
    const MAX_WIDGET_TASKS = 5;

    // Priority order for sorting (high priority first)
    const PRIORITY_ORDER = { high: 0, medium: 1, low: 2, null: 3, undefined: 3 };

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
        const stored = Storage.getWidgetData(memberId, 'toddler-tasks');
        if (!stored || !stored.tasks) {
            return { tasks: [], history: [] };
        }
        // Ensure history array exists for older data
        if (!stored.history) {
            stored.history = [];
        }
        return stored;
    }

    /**
     * Add entry to history
     */
    function addToHistory(widgetData, task) {
        const historyEntry = {
            id: `hist-${Date.now()}`,
            taskTitle: task.title,
            completedAt: new Date().toISOString(),
            date: DateUtils.today()
        };
        widgetData.history = [historyEntry, ...(widgetData.history || [])].slice(0, 100); // Keep last 100 entries
    }

    /**
     * Save widget data
     */
    function saveWidgetData(memberId, data) {
        Storage.setWidgetData(memberId, 'toddler-tasks', data);
    }

    /**
     * Render the toddler tasks widget
     */
    function renderWidget(container, memberId) {
        const widgetData = getWidgetData(memberId);
        const tasks = widgetData.tasks || [];
        const pendingTasks = sortByPriority(tasks.filter(t => !t.completed));
        const completedTasks = tasks.filter(t => t.completed);
        const displayTasks = pendingTasks.slice(0, MAX_WIDGET_TASKS);
        const hasMore = pendingTasks.length > MAX_WIDGET_TASKS;

        container.innerHTML = `
            <div class="toddler-tasks-widget">
                <div class="toddler-tasks-widget__add">
                    <input type="text" class="form-input toddler-tasks-widget__input" id="newToddlerTaskInput" placeholder="What do you want to do?">
                    <button class="btn btn--primary btn--sm" id="addToddlerTaskBtn">
                        <i data-lucide="plus"></i>
                    </button>
                </div>

                <div class="toddler-tasks-widget__list">
                    ${pendingTasks.length === 0
                        ? '<p class="toddler-tasks-widget__empty">No tasks yet! Add something above! 🌟</p>'
                        : ''
                    }

                    ${displayTasks.map(task => renderTaskItem(task)).join('')}

                    ${hasMore ? `
                        <p class="toddler-tasks-widget__more">+ ${pendingTasks.length - MAX_WIDGET_TASKS} more tasks</p>
                    ` : ''}
                </div>

                <div class="toddler-tasks-widget__footer">
                    <button class="btn btn--sm btn--ghost" data-action="view-all">
                        <i data-lucide="list"></i>
                        View All (${tasks.length})
                    </button>
                    <button class="btn btn--sm btn--ghost" data-action="view-history">
                        <i data-lucide="history"></i>
                        History
                    </button>
                    ${completedTasks.length > 0 ? `
                        <span class="toddler-tasks-widget__completed-count">
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
    function renderTaskItem(task) {
        const completedClass = task.completed ? 'toddler-task-item--completed' : '';

        return `
            <div class="toddler-task-item ${completedClass}" data-task-id="${task.id}">
                <label class="toddler-task-item__checkbox-wrapper">
                    <input type="checkbox" class="toddler-task-item__checkbox" ${task.completed ? 'checked' : ''} data-task-toggle="${task.id}">
                    <span class="toddler-task-item__checkmark"></span>
                </label>
                <div class="toddler-task-item__content">
                    <span class="toddler-task-item__title">${task.title}</span>
                </div>
                <button class="btn btn--icon btn--ghost btn--sm toddler-task-item__delete" data-delete="${task.id}">
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
        const addBtn = container.querySelector('#addToddlerTaskBtn');
        const input = container.querySelector('#newToddlerTaskInput');

        const addTask = () => {
            const title = input?.value?.trim();
            if (!title) return;

            const newTask = {
                id: `toddler-task-${Date.now()}`,
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
                document.getElementById('newToddlerTaskInput')?.focus();
            }, 50);
        });
        input?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                addTask();
                // Re-focus input after re-render
                setTimeout(() => {
                    document.getElementById('newToddlerTaskInput')?.focus();
                }, 50);
            }
        });

        // Toggle task completion
        container.querySelectorAll('[data-task-toggle]').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                const taskId = checkbox.dataset.taskToggle;
                const task = widgetData.tasks.find(t => t.id === taskId);
                if (task) {
                    const wasCompleted = task.completed;
                    task.completed = checkbox.checked;
                    task.completedAt = checkbox.checked ? new Date().toISOString().split('T')[0] : null;
                    // Add to history when task is completed
                    if (checkbox.checked && !wasCompleted) {
                        addToHistory(widgetData, task);
                    }
                    saveWidgetData(memberId, widgetData);
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

        // View All button
        container.querySelector('[data-action="view-all"]')?.addEventListener('click', () => {
            showFullPage(memberId);
        });

        // History button
        container.querySelector('[data-action="view-history"]')?.addEventListener('click', () => {
            showHistoryPage(memberId);
        });
    }

    /**
     * Show full page view
     */
    function showFullPage(memberId) {
        const main = document.getElementById('mainContent');
        if (!main) return;

        const member = Storage.getMember(memberId);
        renderFullPage(main, memberId, member);
    }

    /**
     * Render full page
     */
    function renderFullPage(container, memberId, member) {
        const widgetData = getWidgetData(memberId);
        const tasks = widgetData.tasks || [];
        const pendingTasks = sortByPriority(tasks.filter(t => !t.completed));
        const completedTasks = tasks.filter(t => t.completed);

        container.innerHTML = `
            <div class="toddler-tasks-page">
                <div class="toddler-tasks-page__header">
                    <button class="btn btn--ghost" id="backToMemberBtn">
                        <i data-lucide="arrow-left"></i>
                        Back to ${member?.name || 'Dashboard'}
                    </button>
                    <h1 class="toddler-tasks-page__title">
                        🌟 My Task List
                    </h1>
                    <div></div>
                </div>

                <div class="toddler-tasks-page__stats">
                    <div class="toddler-tasks-page-stat toddler-tasks-page-stat--pending">
                        <div class="toddler-tasks-page-stat__icon">📋</div>
                        <div class="toddler-tasks-page-stat__info">
                            <span class="toddler-tasks-page-stat__value">${pendingTasks.length}</span>
                            <span class="toddler-tasks-page-stat__label">To Do</span>
                        </div>
                    </div>
                    <div class="toddler-tasks-page-stat toddler-tasks-page-stat--done">
                        <div class="toddler-tasks-page-stat__icon">✅</div>
                        <div class="toddler-tasks-page-stat__info">
                            <span class="toddler-tasks-page-stat__value">${completedTasks.length}</span>
                            <span class="toddler-tasks-page-stat__label">Done</span>
                        </div>
                    </div>
                    <div class="toddler-tasks-page-stat toddler-tasks-page-stat--total">
                        <div class="toddler-tasks-page-stat__icon">📊</div>
                        <div class="toddler-tasks-page-stat__info">
                            <span class="toddler-tasks-page-stat__value">${tasks.length}</span>
                            <span class="toddler-tasks-page-stat__label">Total</span>
                        </div>
                    </div>
                </div>

                <div class="toddler-tasks-page__add">
                    <input type="text" class="form-input" id="newToddlerTaskInputPage" placeholder="What do you want to do?">
                    <button class="btn btn--primary" id="addToddlerTaskBtnPage">
                        <i data-lucide="plus"></i>
                        Add
                    </button>
                </div>

                ${pendingTasks.length > 0 ? `
                    <div class="toddler-tasks-page__section">
                        <h2 class="toddler-tasks-page__section-title">
                            📋 Things To Do
                        </h2>
                        <div class="toddler-tasks-page__list">
                            ${pendingTasks.map(task => renderFullPageTaskItem(task)).join('')}
                        </div>
                    </div>
                ` : ''}

                ${completedTasks.length > 0 ? `
                    <div class="toddler-tasks-page__section toddler-tasks-page__section--completed">
                        <h2 class="toddler-tasks-page__section-title toddler-tasks-page__section-title--done">
                            ✅ Completed
                            <button class="btn btn--sm btn--ghost btn--danger" id="clearCompletedBtn">
                                <i data-lucide="trash-2"></i>
                                Clear All
                            </button>
                        </h2>
                        <div class="toddler-tasks-page__list">
                            ${completedTasks.map(task => renderFullPageTaskItem(task, true)).join('')}
                        </div>
                    </div>
                ` : ''}

                ${tasks.length === 0 ? `
                    <div class="toddler-tasks-page__empty">
                        <div class="toddler-tasks-page__empty-icon">🌟</div>
                        <h2>No Tasks Yet</h2>
                        <p>Add your first task using the form above!</p>
                    </div>
                ` : ''}
            </div>
        `;

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        bindFullPageEvents(container, memberId, member, widgetData);
    }

    /**
     * Render task item for full page view
     */
    function renderFullPageTaskItem(task, isCompleted = false) {
        return `
            <div class="toddler-task-page-item ${isCompleted ? 'toddler-task-page-item--completed' : ''}" data-task-id="${task.id}">
                <label class="toddler-task-page-item__checkbox-wrapper">
                    <input type="checkbox" class="toddler-task-page-item__checkbox" ${isCompleted ? 'checked' : ''} data-task-toggle="${task.id}">
                    <span class="toddler-task-page-item__checkmark"></span>
                </label>
                <div class="toddler-task-page-item__content">
                    <span class="toddler-task-page-item__title">${task.title}</span>
                    ${task.completedAt ? `
                        <span class="toddler-task-page-item__completed-date">
                            Done ${task.completedAt}
                        </span>
                    ` : ''}
                </div>
                <button class="btn btn--icon btn--ghost btn--sm toddler-task-page-item__delete" data-delete="${task.id}">
                    <i data-lucide="trash-2"></i>
                </button>
            </div>
        `;
    }

    /**
     * Bind full page events
     */
    function bindFullPageEvents(container, memberId, member, widgetData) {
        // Back button
        document.getElementById('backToMemberBtn')?.addEventListener('click', () => {
            State.emit('tabChanged', memberId);
        });

        // Add task from full page
        const addBtnPage = document.getElementById('addToddlerTaskBtnPage');
        const inputPage = document.getElementById('newToddlerTaskInputPage');

        const addTaskFromPage = () => {
            const title = inputPage?.value?.trim();
            if (!title) return;

            const newTask = {
                id: `toddler-task-${Date.now()}`,
                title,
                completed: false,
                createdAt: new Date().toISOString().split('T')[0]
            };

            widgetData.tasks = [...(widgetData.tasks || []), newTask];
            saveWidgetData(memberId, widgetData);
            renderFullPage(container, memberId, member);
            Toast.success('Task added!');
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
                    const wasCompleted = task.completed;
                    task.completed = checkbox.checked;
                    task.completedAt = checkbox.checked ? new Date().toISOString().split('T')[0] : null;
                    // Add to history when task is completed
                    if (checkbox.checked && !wasCompleted) {
                        addToHistory(widgetData, task);
                    }
                    saveWidgetData(memberId, widgetData);
                    renderFullPage(container, memberId, member);
                }
            });
        });

        // Delete task
        container.querySelectorAll('[data-delete]').forEach(btn => {
            btn.addEventListener('click', () => {
                const taskId = btn.dataset.delete;
                widgetData.tasks = widgetData.tasks.filter(t => t.id !== taskId);
                saveWidgetData(memberId, widgetData);
                renderFullPage(container, memberId, member);
                Toast.success('Task deleted');
            });
        });

        // Clear completed
        document.getElementById('clearCompletedBtn')?.addEventListener('click', () => {
            if (confirm('Delete all completed tasks?')) {
                widgetData.tasks = widgetData.tasks.filter(t => !t.completed);
                saveWidgetData(memberId, widgetData);
                renderFullPage(container, memberId, member);
                Toast.success('Completed tasks cleared');
            }
        });
    }

    /**
     * Show history page
     */
    function showHistoryPage(memberId) {
        const main = document.getElementById('mainContent');
        if (!main) return;

        const member = Storage.getMember(memberId);
        const widgetData = getWidgetData(memberId);
        const history = widgetData.history || [];

        // Group history by date
        const groupedHistory = {};
        history.forEach(entry => {
            if (!groupedHistory[entry.date]) {
                groupedHistory[entry.date] = [];
            }
            groupedHistory[entry.date].push(entry);
        });

        // Sort dates descending
        const sortedDates = Object.keys(groupedHistory).sort((a, b) => b.localeCompare(a));

        // Calculate stats
        const todayStr = DateUtils.today();
        const todayCount = (groupedHistory[todayStr] || []).length;
        const totalCount = history.length;

        // Get date label
        const getDateLabel = (date) => {
            if (date === todayStr) return 'Today';
            const yesterday = DateUtils.formatISO(DateUtils.addDays(new Date(), -1));
            if (date === yesterday) return 'Yesterday';
            return DateUtils.formatShort(date);
        };

        main.innerHTML = `
            <div class="toddler-tasks-history-page">
                <div class="toddler-tasks-page__header">
                    <button class="btn btn--ghost" id="backToMemberBtn">
                        <i data-lucide="arrow-left"></i>
                        Back
                    </button>
                    <h1 class="toddler-tasks-page__title">
                        📜 Task History
                    </h1>
                    <div></div>
                </div>

                <div class="toddler-tasks-page__stats">
                    <div class="toddler-tasks-page-stat toddler-tasks-page-stat--done">
                        <div class="toddler-tasks-page-stat__icon">✅</div>
                        <div class="toddler-tasks-page-stat__info">
                            <span class="toddler-tasks-page-stat__value">${todayCount}</span>
                            <span class="toddler-tasks-page-stat__label">Today</span>
                        </div>
                    </div>
                    <div class="toddler-tasks-page-stat toddler-tasks-page-stat--total">
                        <div class="toddler-tasks-page-stat__icon">📊</div>
                        <div class="toddler-tasks-page-stat__info">
                            <span class="toddler-tasks-page-stat__value">${totalCount}</span>
                            <span class="toddler-tasks-page-stat__label">All Time</span>
                        </div>
                    </div>
                </div>

                <div class="toddler-tasks-history">
                    ${sortedDates.length === 0 ? `
                        <div class="toddler-tasks-page__empty">
                            <div class="toddler-tasks-page__empty-icon">📜</div>
                            <h2>No History Yet</h2>
                            <p>Complete some tasks to see your history!</p>
                        </div>
                    ` : sortedDates.map(date => `
                        <div class="toddler-tasks-history__day">
                            <div class="toddler-tasks-history__day-header">
                                <span class="toddler-tasks-history__day-label">${getDateLabel(date)}</span>
                                <span class="toddler-tasks-history__day-count">${groupedHistory[date].length} completed</span>
                            </div>
                            <div class="toddler-tasks-history__day-list">
                                ${groupedHistory[date].map(entry => `
                                    <div class="toddler-tasks-history__item">
                                        <span class="toddler-tasks-history__item-icon">✅</span>
                                        <span class="toddler-tasks-history__item-title">${entry.taskTitle}</span>
                                        <span class="toddler-tasks-history__item-time">
                                            ${new Date(entry.completedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                                        </span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Back button
        document.getElementById('backToMemberBtn')?.addEventListener('click', () => {
            State.emit('tabChanged', memberId);
        });
    }

    function init() {
        // Initialize toddler tasks feature
    }

    return {
        init,
        renderWidget,
        showFullPage,
        showHistoryPage
    };
})();
