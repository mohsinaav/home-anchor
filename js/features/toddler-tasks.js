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
                        <button class="toddler-tasks-widget__more" data-action="view-all-more">+ ${pendingTasks.length - MAX_WIDGET_TASKS} more tasks</button>
                    ` : ''}
                </div>

                <div class="toddler-tasks-widget__footer">
                    <button class="btn btn--sm btn--ghost" data-action="view-all">
                        <i data-lucide="list"></i>
                        View All (${tasks.length})
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
                <div class="toddler-task-item__content" data-edit="${task.id}">
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

        // Edit task on click (inline editing)
        container.querySelectorAll('[data-edit]').forEach(el => {
            el.addEventListener('click', (e) => {
                // Don't trigger if clicking on checkbox or already editing
                if (e.target.closest('.toddler-task-item__checkbox-wrapper')) return;
                if (el.querySelector('.toddler-task-item__edit-input')) return;

                const taskId = el.dataset.edit;
                const task = widgetData.tasks.find(t => t.id === taskId);
                if (!task) return;

                const titleEl = el.querySelector('.toddler-task-item__title');
                const originalTitle = task.title;

                // Replace title with input
                titleEl.innerHTML = `<input type="text" class="toddler-task-item__edit-input" value="${originalTitle}" />`;
                const input = titleEl.querySelector('input');
                input.focus();
                // Place cursor at end instead of selecting all (safer)
                input.setSelectionRange(input.value.length, input.value.length);

                const saveEdit = () => {
                    const newTitle = input.value.trim();
                    if (newTitle && newTitle !== originalTitle) {
                        task.title = newTitle;
                        saveWidgetData(memberId, widgetData);
                        Toast.success('Task updated!');
                    }
                    renderWidget(container, memberId);
                };

                input.addEventListener('blur', saveEdit);
                input.addEventListener('keydown', (evt) => {
                    if (evt.key === 'Enter') {
                        evt.preventDefault();
                        input.blur();
                    } else if (evt.key === 'Escape') {
                        renderWidget(container, memberId);
                    }
                });
            });
        });

        // View All button
        container.querySelector('[data-action="view-all"]')?.addEventListener('click', () => {
            showFullPage(memberId);
        });

        // "+X more tasks" button
        container.querySelector('[data-action="view-all-more"]')?.addEventListener('click', () => {
            showFullPage(memberId);
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

    // Track current tab for full page view
    let currentTab = 'tasks';

    /**
     * Calculate completion streak (consecutive days with completed tasks)
     */
    function calculateCompletionStreak(tasks) {
        const completedDates = tasks
            .filter(t => t.completed && t.completedAt)
            .map(t => t.completedAt)
            .sort((a, b) => new Date(b) - new Date(a));

        if (completedDates.length === 0) return 0;

        let streak = 1;
        const today = DateUtils.today();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        // Must have completed something today or yesterday to have a streak
        if (completedDates[0] !== today && completedDates[0] !== yesterdayStr) return 0;

        for (let i = 1; i < completedDates.length; i++) {
            const curr = new Date(completedDates[i - 1]);
            const prev = new Date(completedDates[i]);
            const diffDays = Math.floor((curr - prev) / (1000 * 60 * 60 * 24));
            if (diffDays === 1) streak++;
            else if (diffDays > 1) break;
        }
        return streak;
    }

    /**
     * Get completed tasks count for this month
     */
    function getThisMonthCompletedCount(tasks) {
        const now = new Date();
        const month = now.getMonth();
        const year = now.getFullYear();
        return tasks.filter(t => {
            if (!t.completed || !t.completedAt) return false;
            const d = new Date(t.completedAt);
            return d.getMonth() === month && d.getFullYear() === year;
        }).length;
    }

    /**
     * Get completion rate
     */
    function getCompletionRate(tasks) {
        if (tasks.length === 0) return 0;
        const completed = tasks.filter(t => t.completed).length;
        return Math.round((completed / tasks.length) * 100);
    }

    /**
     * Render full page
     */
    function renderFullPage(container, memberId, member, tab = 'tasks') {
        const widgetData = getWidgetData(memberId);
        const tasks = widgetData.tasks || [];
        const pendingTasks = sortByPriority(tasks.filter(t => !t.completed));
        const completedTasks = tasks.filter(t => t.completed);

        // Calculate hero stats
        const streak = calculateCompletionStreak(tasks);
        const thisMonth = getThisMonthCompletedCount(tasks);
        const doneRate = getCompletionRate(tasks);

        // Get theme colors
        const colors = (typeof KidTheme !== 'undefined' && KidTheme.getColors)
            ? KidTheme.getColors('kid-tasks')
            : { gradient: 'linear-gradient(135deg, #FEF9C3 0%, #FEF08A 50%, #FDE047 100%)', dark: '#CA8A04' };

        // Define tabs
        const tabs = [
            { id: 'tasks', label: 'Tasks', emoji: '📋' },
            { id: 'history', label: 'History', emoji: '📅' }
        ];

        // Get tab content
        const tabContent = tab === 'history'
            ? renderHistoryTabContent(widgetData)
            : renderTasksTabContent(pendingTasks, completedTasks, tasks);

        container.innerHTML = `
            <div class="kid-page kid-page--tasks kid-page--toddler">
                <!-- Hero Section -->
                <div class="kid-page__hero" style="background: ${colors.gradient}; --kid-hero-text: ${colors.dark}">
                    <button class="btn btn--ghost kid-page__back" id="backToMemberBtn">
                        <i data-lucide="arrow-left"></i>
                        Back
                    </button>
                    <div class="kid-page__hero-content">
                        <h1 class="kid-page__hero-title kid-page__hero-title--playful">
                            📝 ${member?.name || ''}'s Tasks!
                        </h1>
                    </div>
                    <div class="kid-page__hero-stats">
                        <div class="kid-hero-stat">
                            <span class="kid-hero-stat__value">${streak}</span>
                            <span class="kid-hero-stat__label">🔥 Day Streak</span>
                        </div>
                        <div class="kid-hero-stat">
                            <span class="kid-hero-stat__value">${thisMonth}</span>
                            <span class="kid-hero-stat__label">⭐ This Month</span>
                        </div>
                        <div class="kid-hero-stat">
                            <span class="kid-hero-stat__value">${doneRate}%</span>
                            <span class="kid-hero-stat__label">✅ Done Rate</span>
                        </div>
                    </div>
                </div>

                <!-- Tab Navigation -->
                <div class="kid-page__tabs" style="--tab-color: ${colors.primary}">
                    ${tabs.map(t => `
                        <button class="kid-page__tab ${t.id === tab ? 'kid-page__tab--active' : ''}" data-tab="${t.id}">
                            <span class="emoji-icon">${t.emoji}</span>
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
     * Render Tasks tab content
     */
    function renderTasksTabContent(pendingTasks, completedTasks, tasks) {
        return `
            <div class="kid-tasks-page__add">
                <input type="text" class="form-input" id="newToddlerTaskInputPage" placeholder="What do you want to do?">
                <button class="btn btn--primary" id="addToddlerTaskBtnPage">
                    <i data-lucide="plus"></i>
                    Add!
                </button>
            </div>

            ${pendingTasks.length > 0 ? `
                <div class="kid-tasks-page__section">
                    <h2 class="kid-tasks-page__section-title">
                        📋 Things To Do (${pendingTasks.length})
                    </h2>
                    <div class="kid-tasks-page__list">
                        ${pendingTasks.map(task => renderFullPageTaskItem(task)).join('')}
                    </div>
                </div>
            ` : ''}

            ${completedTasks.length > 0 ? `
                <div class="kid-tasks-page__section kid-tasks-page__section--completed">
                    <h2 class="kid-tasks-page__section-title kid-tasks-page__section-title--done">
                        ✅ All Done!
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
                <div class="kid-page__empty kid-page__empty--playful">
                    <div class="kid-page__empty-icon">📝</div>
                    <p>No tasks yet! Add your first task above! 🌟</p>
                </div>
            ` : ''}
        `;
    }

    /**
     * Render History tab content
     */
    function renderHistoryTabContent(widgetData) {
        const history = widgetData.history || [];

        if (history.length === 0) {
            return `
                <div class="kid-page__empty kid-page__empty--playful">
                    <div class="kid-page__empty-icon">📅</div>
                    <p>No completed tasks yet! Complete a task to see it here! ⭐</p>
                </div>
            `;
        }

        // Group by date
        const grouped = {};
        history.forEach(entry => {
            const date = entry.date || 'Unknown';
            if (!grouped[date]) grouped[date] = [];
            grouped[date].push(entry);
        });

        const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a));
        const today = DateUtils.today();

        // Calculate summary stats
        const totalTasks = history.length;
        const activeDays = sortedDates.length;

        return `
            <div class="kid-tasks-history">
                <div class="kid-tasks-history__summary">
                    <div class="kid-tasks-history__summary-stat">
                        ✅ <span>${totalTasks} tasks done!</span>
                    </div>
                    <div class="kid-tasks-history__summary-stat">
                        📅 <span>${activeDays} active days!</span>
                    </div>
                </div>

                <div class="kid-tasks-history__days">
                    ${sortedDates.map(date => {
                        const dayTasks = grouped[date];
                        // Parse date as local time (not UTC) to avoid off-by-one day issue
                        const [year, month, day] = date.split('-').map(Number);
                        const dateObj = new Date(year, month - 1, day);
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
                                    <span class="kid-tasks-history__day-count">${dayTasks.length} ⭐</span>
                                </div>
                                <div class="kid-tasks-history__day-tasks">
                                    ${dayTasks.map(entry => `
                                        <div class="kid-tasks-history__task">
                                            ✓ <span>${entry.taskTitle}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Render task item for full page view
     */
    function renderFullPageTaskItem(task, isCompleted = false) {
        return `
            <div class="kid-task-page-item ${isCompleted ? 'kid-task-page-item--completed' : ''}" data-task-id="${task.id}">
                <label class="kid-task-page-item__checkbox-wrapper">
                    <input type="checkbox" class="kid-task-page-item__checkbox" ${isCompleted ? 'checked' : ''} data-task-toggle="${task.id}">
                    <span class="kid-task-page-item__checkmark"></span>
                </label>
                <div class="kid-task-page-item__content" data-edit="${task.id}">
                    <span class="kid-task-page-item__title">${task.title}</span>
                    ${task.completedAt ? `
                        <span class="kid-task-page-item__completed-date">
                            Done ${DateUtils.formatShort(task.completedAt)}
                        </span>
                    ` : ''}
                </div>
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
            currentTab = 'tasks'; // Reset tab
            State.emit('tabChanged', memberId);
        });

        // Tab switching
        container.querySelectorAll('.kid-page__tab').forEach(tabBtn => {
            tabBtn.addEventListener('click', () => {
                const tabName = tabBtn.dataset.tab;
                if (tabName && tabName !== tab) {
                    currentTab = tabName;
                    renderFullPage(container, memberId, member, tabName);
                }
            });
        });

        // Only bind task-related events on tasks tab
        if (tab === 'tasks') {
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
                renderFullPage(container, memberId, member, 'tasks');
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

            // Edit task on click (inline editing)
            container.querySelectorAll('[data-edit]').forEach(el => {
                el.addEventListener('click', (e) => {
                    // Don't trigger if clicking on checkbox or already editing
                    if (e.target.closest('.kid-task-page-item__checkbox-wrapper')) return;
                    if (el.querySelector('.kid-task-page-item__edit-input')) return;

                    const taskId = el.dataset.edit;
                    const task = widgetData.tasks.find(t => t.id === taskId);
                    if (!task) return;

                    const titleEl = el.querySelector('.kid-task-page-item__title');
                    if (!titleEl) return;
                    const originalTitle = task.title;

                    // Replace title with input
                    titleEl.innerHTML = `<input type="text" class="kid-task-page-item__edit-input" value="${originalTitle}" />`;
                    const input = titleEl.querySelector('input');
                    input.focus();
                    // Place cursor at end instead of selecting all (safer)
                    input.setSelectionRange(input.value.length, input.value.length);

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
        }
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
