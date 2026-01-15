/**
 * Tasks Feature
 * Handles task list functionality for all member types
 */

const Tasks = (function() {
    // Maximum pending tasks to show in widget before showing "+x more"
    const MAX_WIDGET_TASKS = 10;

    // Priority order for sorting (high priority first)
    const PRIORITY_ORDER = { high: 0, medium: 1, low: 2, null: 3, undefined: 3 };

    // Track which tasks are expanded (for subtasks view)
    const expandedTasks = new Set();

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

    // =========================================================================
    // SUBTASK HELPERS
    // =========================================================================

    /**
     * Get subtask progress for a task
     * @returns {object} { completed, total }
     */
    function getSubtaskProgress(task) {
        const subtasks = task.subtasks || [];
        const total = subtasks.length;
        const completed = subtasks.filter(s => s.completed).length;
        return { completed, total };
    }

    /**
     * Add a subtask to a task
     */
    function addSubtask(memberId, taskId, title, widgetData) {
        const task = widgetData.tasks.find(t => t.id === taskId);
        if (!task) return false;

        const trimmedTitle = title.trim();
        // Don't add empty subtasks
        if (!trimmedTitle) return false;

        if (!task.subtasks) {
            task.subtasks = [];
        }

        task.subtasks.push({
            id: `subtask-${Date.now()}`,
            title: trimmedTitle,
            completed: false,
            createdAt: new Date().toISOString()
        });

        Storage.setWidgetData(memberId, 'task-list', widgetData);
        return true;
    }

    /**
     * Toggle subtask completion
     */
    function toggleSubtask(memberId, taskId, subtaskId, widgetData) {
        const task = widgetData.tasks.find(t => t.id === taskId);
        if (!task || !task.subtasks) return false;

        const subtask = task.subtasks.find(s => s.id === subtaskId);
        if (!subtask) return false;

        subtask.completed = !subtask.completed;
        Storage.setWidgetData(memberId, 'task-list', widgetData);

        // Sync with Vision Board if this subtask is linked to a goal step
        if (task.fromGoal && subtask.stepTitle) {
            if (typeof VisionBoard !== 'undefined' && VisionBoard.syncStepFromTask) {
                VisionBoard.syncStepFromTask(memberId, task.fromGoal, subtask.stepTitle, subtask.completed);
            }
        }

        return true;
    }

    /**
     * Delete a subtask
     */
    function deleteSubtask(memberId, taskId, subtaskId, widgetData) {
        const task = widgetData.tasks.find(t => t.id === taskId);
        if (!task || !task.subtasks) return false;

        task.subtasks = task.subtasks.filter(s => s.id !== subtaskId);
        Storage.setWidgetData(memberId, 'task-list', widgetData);
        return true;
    }

    /**
     * Indent a task (make it a subtask of the task above)
     * Google Keep style - drag to subtask area to indent
     */
    function indentTask(memberId, taskId) {
        // Get fresh data from storage
        const widgetData = Storage.getWidgetData(memberId, 'task-list') || { tasks: [] };
        const taskIndex = widgetData.tasks.findIndex(t => t.id === taskId);

        // Can't indent first task - nothing above it
        if (taskIndex <= 0) {
            Toast.warning('Cannot indent - no task above');
            return false;
        }

        const task = widgetData.tasks[taskIndex];

        // Can't indent a task that has its own subtasks
        if (task.subtasks && task.subtasks.length > 0) {
            Toast.warning('Cannot indent - task has subtasks');
            return false;
        }

        // Find the parent (task above). Skip over subtasks to find a main task.
        let parentIndex = taskIndex - 1;
        const parentTask = widgetData.tasks[parentIndex];

        // Move task to parent's subtasks
        if (!parentTask.subtasks) {
            parentTask.subtasks = [];
        }

        parentTask.subtasks.push({
            id: task.id,
            title: task.title,
            completed: task.completed,
            createdAt: task.createdAt
        });

        // Remove from main tasks array
        widgetData.tasks.splice(taskIndex, 1);

        Storage.setWidgetData(memberId, 'task-list', widgetData);
        Toast.success('Task indented');
        return true;
    }

    /**
     * Outdent a subtask (promote it back to a regular task)
     * Google Keep style - drag to main list to outdent
     */
    function outdentSubtask(memberId, parentTaskId, subtaskId) {
        // Get fresh data from storage
        const widgetData = Storage.getWidgetData(memberId, 'task-list') || { tasks: [] };
        const parentTask = widgetData.tasks.find(t => t.id === parentTaskId);
        if (!parentTask || !parentTask.subtasks) return false;

        const subtaskIndex = parentTask.subtasks.findIndex(s => s.id === subtaskId);
        if (subtaskIndex === -1) return false;

        const subtask = parentTask.subtasks[subtaskIndex];

        // Remove from subtasks
        parentTask.subtasks.splice(subtaskIndex, 1);

        // Find parent's position and insert after it (after all its subtasks)
        const parentIndex = widgetData.tasks.findIndex(t => t.id === parentTaskId);

        // Insert as new task after parent
        widgetData.tasks.splice(parentIndex + 1, 0, {
            id: subtask.id,
            title: subtask.title,
            completed: subtask.completed,
            createdAt: subtask.createdAt
        });

        Storage.setWidgetData(memberId, 'task-list', widgetData);
        Toast.success('Task promoted');
        return true;
    }

    /**
     * Sync task completion with Vision Board step
     * When a task that came from a Vision Board step is completed/uncompleted,
     * update the corresponding step in Vision Board
     */
    function syncWithVisionBoard(memberId, task) {
        // Only sync if this task came from a Vision Board goal
        if (!task.fromGoal || !task.stepTitle) return;

        const visionData = Storage.getWidgetData(memberId, 'vision-board');
        if (!visionData || !visionData.goals) return;

        // Find the goal by title
        const goal = visionData.goals.find(g => g.title === task.fromGoal);
        if (!goal || !goal.steps) return;

        // Find the step by title
        const step = goal.steps.find(s => s.title === task.stepTitle);
        if (!step) return;

        // Update the step completion status
        step.completed = task.completed;
        step.completedAt = task.completed ? DateUtils.today() : null;

        // Save the updated Vision Board data
        Storage.setWidgetData(memberId, 'vision-board', visionData);

        // If goal was completed but now has incomplete steps, reactivate it
        if (goal.completed && !task.completed) {
            goal.completed = false;
            goal.completedAt = null;
            Storage.setWidgetData(memberId, 'vision-board', visionData);
        }
    }

    /**
     * Render the tasks widget for a member (Adult version - compact)
     */
    function renderWidget(container, memberId) {
        const widgetData = Storage.getWidgetData(memberId, 'task-list') || {
            tasks: []
        };

        const tasks = widgetData.tasks || [];
        const pendingTasks = sortByPriority(tasks.filter(t => !t.completed));
        const completedTasks = tasks.filter(t => t.completed);
        const displayTasks = pendingTasks.slice(0, MAX_WIDGET_TASKS);
        const hasMore = pendingTasks.length > MAX_WIDGET_TASKS;

        container.innerHTML = `
            <div class="tasks-widget">
                <div class="tasks-widget__add">
                    <input type="text" class="form-input tasks-widget__input" id="newTaskInput"
                           placeholder="Add task...">
                    <button class="btn btn--primary btn--sm" id="addTaskBtn" title="Add task">
                        <i data-lucide="plus"></i>
                    </button>
                </div>

                <div class="tasks-widget__list" id="tasksList">
                    ${pendingTasks.length === 0
                        ? '<p class="tasks-widget__empty">No pending tasks. Add a task above!</p>'
                        : ''
                    }

                    ${displayTasks.map((task, index) => renderTaskItem(task, memberId, true, index)).join('')}

                    ${hasMore ? `
                        <button class="tasks-widget__more-btn" data-view-all-tasks="${memberId}">
                            +${pendingTasks.length - MAX_WIDGET_TASKS} more task${pendingTasks.length - MAX_WIDGET_TASKS !== 1 ? 's' : ''}
                        </button>
                    ` : ''}
                </div>

                <div class="tasks-widget__footer">
                    <button class="btn btn--sm btn--ghost" data-action="view-all">
                        <i data-lucide="list"></i>
                        View All (${tasks.length})
                    </button>
                    ${completedTasks.length > 0 ? `
                        <span class="tasks-widget__completed-count">
                            <i data-lucide="check-circle"></i>
                            ${completedTasks.length} done
                        </span>
                    ` : ''}
                </div>
            </div>
        `;

        // Initialize icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Bind events
        bindTaskEvents(container, memberId, widgetData);
    }

    /**
     * Render a single subtask row for widget view
     */
    function renderWidgetSubtaskItem(subtask, taskId) {
        return `
            <div class="task-item__subtask ${subtask.completed ? 'task-item__subtask--completed' : ''}" data-subtask-id="${subtask.id}" data-parent-task="${taskId}">
                <button class="btn btn--icon btn--ghost btn--xs task-item__outdent-btn" data-outdent-subtask="${taskId}" data-subtask-id="${subtask.id}" title="Outdent">
                    <i data-lucide="arrow-left"></i>
                </button>
                <label class="task-item__subtask-checkbox-wrapper">
                    <input type="checkbox" class="task-item__subtask-checkbox" ${subtask.completed ? 'checked' : ''} data-subtask-toggle="${taskId}" data-subtask-id="${subtask.id}">
                    <span class="task-item__subtask-checkmark"></span>
                </label>
                <span class="task-item__subtask-title" data-subtask-edit="${taskId}" data-subtask-id="${subtask.id}">${subtask.title}</span>
                <button class="btn btn--icon btn--ghost btn--xs task-item__subtask-delete" data-subtask-delete="${taskId}" data-subtask-id="${subtask.id}" title="Delete">
                    <i data-lucide="x"></i>
                </button>
            </div>
        `;
    }

    /**
     * Render a single task item
     * Simple design: indent button to make subtask, subtasks shown inline
     */
    function renderTaskItem(task, memberId, isDraggable = true, taskIndex = 0) {
        const priorityClass = task.priority ? `task-item--${task.priority}` : '';
        const completedClass = task.completed ? 'task-item--completed' : '';
        const { completed: subtasksDone, total: subtasksTotal } = getSubtaskProgress(task);
        const hasSubtasks = subtasksTotal > 0;
        // Can indent if not the first task and has no subtasks of its own
        const canIndent = taskIndex > 0 && !hasSubtasks;

        // Subtasks list - only render if has subtasks
        const subtasksList = hasSubtasks ? `
            <div class="task-item__subtasks" data-subtasks-for="${task.id}">
                ${(task.subtasks || []).map(subtask =>
                    renderWidgetSubtaskItem(subtask, task.id)
                ).join('')}
            </div>
        ` : '';

        // Task container with task row and subtasks
        return `
            <div class="task-item-container" data-task-id="${task.id}">
                <div class="task-item ${completedClass} ${priorityClass}" data-task-row="${task.id}">
                    ${canIndent ? `
                        <button class="btn btn--icon btn--ghost btn--xs task-item__indent-btn" data-indent-task="${task.id}" title="Make subtask">
                            <i data-lucide="arrow-right"></i>
                        </button>
                    ` : '<div class="task-item__indent-spacer"></div>'}
                    <label class="task-item__checkbox-wrapper">
                        <input type="checkbox" class="task-item__checkbox" ${task.completed ? 'checked' : ''} data-task-toggle="${task.id}">
                        <span class="task-item__checkmark"></span>
                    </label>
                    <div class="task-item__content" data-edit="${task.id}">
                        <span class="task-item__title">${task.title}</span>
                        ${hasSubtasks ? `
                            <span class="task-item__subtask-count ${subtasksDone === subtasksTotal ? 'task-item__subtask-count--complete' : ''}">
                                ${subtasksDone}/${subtasksTotal}
                            </span>
                        ` : ''}
                        ${task.dueDate ? `
                            <span class="task-item__due ${isOverdue(task) ? 'task-item__due--overdue' : ''}">
                                <i data-lucide="calendar"></i>
                                ${DateUtils.formatShort(task.dueDate)}
                            </span>
                        ` : ''}
                    </div>
                    <div class="task-item__drag-handle" title="Drag to reorder">
                        <i data-lucide="grip-vertical"></i>
                    </div>
                    <button class="btn btn--icon btn--ghost btn--sm task-item__delete" data-delete="${task.id}">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
                ${subtasksList}
            </div>
        `;
    }

    /**
     * Check if task is overdue
     */
    function isOverdue(task) {
        if (!task.dueDate || task.completed) return false;
        return task.dueDate < DateUtils.today();
    }

    /**
     * Bind task events
     */
    function bindTaskEvents(container, memberId, widgetData) {
        // Add task - use container-scoped selectors
        const addBtn = container.querySelector('#addTaskBtn');
        const input = container.querySelector('#newTaskInput');

        const addTask = () => {
            const title = input?.value?.trim();
            if (!title) return;

            // Add new task
            const newTask = {
                id: `task-${Date.now()}`,
                title,
                completed: false,
                createdAt: DateUtils.today()
            };

            const updatedData = {
                ...widgetData,
                tasks: [...(widgetData.tasks || []), newTask]
            };

            Storage.setWidgetData(memberId, 'task-list', updatedData);
            renderWidget(container, memberId);
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
            Toast.success('Task added!');
        };

        addBtn?.addEventListener('click', () => {
            addTask();
            setTimeout(() => {
                container.querySelector('#newTaskInput')?.focus();
            }, 50);
        });
        input?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                addTask();
                setTimeout(() => {
                    container.querySelector('#newTaskInput')?.focus();
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
                    task.completedAt = checkbox.checked ? DateUtils.today() : null;
                    Storage.setWidgetData(memberId, 'task-list', widgetData);

                    // Sync with Vision Board if this task came from a goal step
                    syncWithVisionBoard(memberId, task);

                    renderWidget(container, memberId);
                    if (typeof lucide !== 'undefined') {
                        lucide.createIcons();
                    }
                }
            });
        });

        // Delete task
        container.querySelectorAll('[data-delete]').forEach(btn => {
            btn.addEventListener('click', () => {
                const taskId = btn.dataset.delete;
                const updatedData = {
                    ...widgetData,
                    tasks: widgetData.tasks.filter(t => t.id !== taskId)
                };
                Storage.setWidgetData(memberId, 'task-list', updatedData);
                renderWidget(container, memberId);
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            });
        });

        // Edit task on click (inline editing)
        container.querySelectorAll('[data-edit]').forEach(el => {
            el.addEventListener('click', (e) => {
                // Don't trigger if clicking on checkbox or already editing
                if (e.target.closest('.task-item__checkbox-wrapper')) return;
                if (el.querySelector('.task-item__edit-input')) return;

                const taskId = el.dataset.edit;
                const task = widgetData.tasks.find(t => t.id === taskId);
                if (!task) return;

                const titleEl = el.querySelector('.task-item__title');
                const originalTitle = task.title;

                // Replace title with input
                titleEl.innerHTML = `<input type="text" class="task-item__edit-input" value="${originalTitle}" />`;
                const input = titleEl.querySelector('input');
                // Place cursor at end after focus (use timeout to override browser's default select-all)
                input.focus();
                setTimeout(() => {
                    const len = input.value.length;
                    input.setSelectionRange(len, len);
                }, 10);

                const saveEdit = () => {
                    const newTitle = input.value.trim();
                    if (newTitle && newTitle !== originalTitle) {
                        task.title = newTitle;
                        Storage.setWidgetData(memberId, 'task-list', widgetData);
                        Toast.success('Task updated');
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
                        task.title = originalTitle; // Restore original
                        renderWidget(container, memberId);
                        if (typeof lucide !== 'undefined') {
                            lucide.createIcons();
                        }
                    }
                });
            });
        });

        // =========================================================================
        // INDENT/OUTDENT BUTTONS (simple click-based subtask creation)
        // =========================================================================

        // Indent task (make it a subtask of the task above)
        container.querySelectorAll('[data-indent-task]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const taskId = btn.dataset.indentTask;
                indentTask(memberId, taskId);
                renderWidget(container, memberId);
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            });
        });

        // Outdent subtask (promote it back to a regular task)
        container.querySelectorAll('[data-outdent-subtask]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const taskId = btn.dataset.outdentSubtask;
                const subtaskId = btn.dataset.subtaskId;
                outdentSubtask(memberId, taskId, subtaskId);
                renderWidget(container, memberId);
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            });
        });

        // =========================================================================
        // SUBTASK EVENT HANDLERS (toggle, delete, edit)
        // =========================================================================

        // Toggle subtask completion
        container.querySelectorAll('[data-subtask-toggle]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                e.stopPropagation();
                const taskId = checkbox.dataset.subtaskToggle;
                const subtaskId = checkbox.dataset.subtaskId;
                toggleSubtask(memberId, taskId, subtaskId, widgetData);
                renderWidget(container, memberId);
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            });
        });

        // Delete subtask
        container.querySelectorAll('[data-subtask-delete]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const taskId = btn.dataset.subtaskDelete;
                const subtaskId = btn.dataset.subtaskId;
                deleteSubtask(memberId, taskId, subtaskId, widgetData);
                renderWidget(container, memberId);
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
                Toast.success('Subtask deleted');
            });
        });

        // Inline edit subtask
        container.querySelectorAll('[data-subtask-edit]').forEach(el => {
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                if (el.querySelector('input')) return;

                const taskId = el.dataset.subtaskEdit;
                const subtaskId = el.dataset.subtaskId;
                const task = widgetData.tasks.find(t => t.id === taskId);
                if (!task || !task.subtasks) return;

                const subtask = task.subtasks.find(s => s.id === subtaskId);
                if (!subtask) return;

                const originalTitle = subtask.title;
                el.innerHTML = `<input type="text" class="task-item__subtask-edit-input" value="${originalTitle}" />`;
                const input = el.querySelector('input');
                input.focus();
                setTimeout(() => {
                    const len = input.value.length;
                    input.setSelectionRange(len, len);
                }, 10);

                const saveSubtaskEdit = () => {
                    const newTitle = input.value.trim();
                    if (newTitle && newTitle !== originalTitle) {
                        subtask.title = newTitle;
                        Storage.setWidgetData(memberId, 'task-list', widgetData);
                        Toast.success('Subtask updated');
                    }
                    renderWidget(container, memberId);
                    if (typeof lucide !== 'undefined') {
                        lucide.createIcons();
                    }
                };

                input.addEventListener('blur', saveSubtaskEdit);
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
            showTasksFullPage(memberId);
        });

        // "+X more" button
        container.querySelector('[data-view-all-tasks]')?.addEventListener('click', () => {
            showTasksFullPage(memberId);
        });

        // Toggle completed section (for full page)
        container.querySelector('[data-toggle="completed"]')?.addEventListener('click', function() {
            const list = document.getElementById('completedTasks');
            const icon = this.querySelector('i');
            if (list) {
                list.classList.toggle('tasks-widget__completed-list--hidden');
                icon?.classList.toggle('rotate-180');
            }
        });

        // Initialize SortableJS for vertical reordering
        initSortable(container, memberId);
    }

    /**
     * Initialize SortableJS for simple vertical task reordering
     */
    function initSortable(container, memberId) {
        const tasksList = container.querySelector('#tasksList');
        if (!tasksList) return;

        // Check if SortableJS is available
        if (typeof Sortable === 'undefined') {
            console.warn('SortableJS not loaded, drag-and-drop disabled');
            return;
        }

        // Simple sortable for vertical reordering only
        Sortable.create(tasksList, {
            animation: 150,
            handle: '.task-item__drag-handle',
            draggable: '.task-item-container',
            ghostClass: 'task-item--ghost',
            chosenClass: 'task-item--chosen',
            dragClass: 'task-item--dragging',

            onEnd: function(evt) {
                // Get fresh data from storage
                const freshData = Storage.getWidgetData(memberId, 'task-list') || { tasks: [] };

                // Reorder tasks based on new DOM order
                const newOrder = Array.from(tasksList.querySelectorAll('.task-item-container'))
                    .map(el => el.dataset.taskId)
                    .filter(id => id);

                // Rebuild tasks array in new order
                const reorderedTasks = [];
                newOrder.forEach(id => {
                    const task = freshData.tasks.find(t => t.id === id);
                    if (task) {
                        reorderedTasks.push(task);
                    }
                });

                // Add any tasks not in the widget view (e.g., beyond MAX_WIDGET_TASKS)
                freshData.tasks.forEach(task => {
                    if (!reorderedTasks.find(t => t.id === task.id)) {
                        reorderedTasks.push(task);
                    }
                });

                freshData.tasks = reorderedTasks;
                Storage.setWidgetData(memberId, 'task-list', freshData);

                // Re-render to update indent buttons (first task can't indent)
                renderWidget(container, memberId);
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            }
        });
    }

    /**
     * Reorder tasks after drag and drop (for full page view)
     */
    function reorderTasks(memberId, widgetData, draggedTaskId, targetTaskId, container, isFullPage) {
        const tasks = widgetData.tasks || [];
        const draggedIndex = tasks.findIndex(t => t.id === draggedTaskId);
        const targetIndex = tasks.findIndex(t => t.id === targetTaskId);

        if (draggedIndex === -1 || targetIndex === -1) return;

        // Remove dragged task and insert at new position
        const [draggedTask] = tasks.splice(draggedIndex, 1);
        tasks.splice(targetIndex, 0, draggedTask);

        widgetData.tasks = tasks;
        Storage.setWidgetData(memberId, 'task-list', widgetData);

        // Re-render the appropriate view
        if (isFullPage) {
            const member = Storage.getMember(memberId);
            renderTasksFullPage(container, memberId, member);
        } else {
            renderWidget(container, memberId);
        }

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    /**
     * Show full page tasks view
     */
    function showTasksFullPage(memberId) {
        const main = document.getElementById('mainContent');
        if (!main) return;

        const member = Storage.getMember(memberId);
        renderTasksFullPage(main, memberId, member);
    }

    /**
     * Render full page tasks view
     */
    function renderTasksFullPage(container, memberId, member) {
        const widgetData = Storage.getWidgetData(memberId, 'task-list') || { tasks: [] };
        const tasks = widgetData.tasks || [];
        const pendingTasks = sortByPriority(tasks.filter(t => !t.completed));
        const completedTasks = tasks.filter(t => t.completed);

        container.innerHTML = `
            <div class="tasks-page">
                <!-- Hero Header -->
                <div class="tasks-page__hero">
                    <button class="btn btn--ghost tasks-page__back" id="backToMemberBtn">
                        <i data-lucide="arrow-left"></i>
                        Back
                    </button>
                    <div class="tasks-page__hero-content">
                        <h1 class="tasks-page__hero-title">
                            <i data-lucide="check-square"></i>
                            Task List
                        </h1>
                        <p class="tasks-page__hero-subtitle">Stay organized and get things done</p>
                    </div>
                    <div class="tasks-page__hero-stats">
                        <div class="tasks-hero-stat">
                            <span class="tasks-hero-stat__value">${pendingTasks.length}</span>
                            <span class="tasks-hero-stat__label">Pending</span>
                        </div>
                        <div class="tasks-hero-stat">
                            <span class="tasks-hero-stat__value">${completedTasks.length}</span>
                            <span class="tasks-hero-stat__label">Completed</span>
                        </div>
                        <div class="tasks-hero-stat">
                            <span class="tasks-hero-stat__value">${tasks.length}</span>
                            <span class="tasks-hero-stat__label">Total</span>
                        </div>
                    </div>
                </div>

                <div class="tasks-page__add">
                    <input type="text" class="form-input" id="newTaskInputPage" placeholder="Quick add (press Enter)...">
                    <button class="btn btn--primary" id="addTaskBtnPage" title="Quick add task">
                        <i data-lucide="plus"></i>
                    </button>
                </div>

                ${pendingTasks.length > 0 ? `
                    <div class="tasks-page__section">
                        <h2 class="tasks-page__section-title">
                            <i data-lucide="circle"></i>
                            To Do (${pendingTasks.length})
                        </h2>
                        <div class="tasks-page__list" id="pendingTasksList">
                            ${pendingTasks.map((task, index) => renderFullPageTaskItem(task, memberId, false, index)).join('')}
                        </div>
                    </div>
                ` : ''}

                ${completedTasks.length > 0 ? `
                    <div class="tasks-page__section tasks-page__section--completed">
                        <h2 class="tasks-page__section-title tasks-page__section-title--completed">
                            <i data-lucide="check-circle"></i>
                            Completed (${completedTasks.length})
                            <button class="btn btn--sm btn--ghost btn--danger" id="clearCompletedBtn">
                                <i data-lucide="trash-2"></i>
                                Clear All
                            </button>
                        </h2>
                        <div class="tasks-page__list">
                            ${completedTasks.map(task => renderFullPageTaskItem(task, memberId, true)).join('')}
                        </div>
                    </div>
                ` : ''}

                ${tasks.length === 0 ? `
                    <div class="tasks-page__empty">
                        <div class="tasks-page__empty-icon">
                            <i data-lucide="check-square"></i>
                        </div>
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
     * Render a single subtask row (displayed as separate indented row)
     */
    function renderSubtaskItem(subtask, taskId) {
        return `
            <div class="subtask-row ${subtask.completed ? 'subtask-row--completed' : ''}" data-subtask-id="${subtask.id}" data-parent-task="${taskId}">
                <button class="btn btn--icon btn--ghost btn--xs subtask-row__outdent-btn" data-outdent-subtask="${taskId}" data-subtask-id="${subtask.id}" title="Outdent">
                    <i data-lucide="arrow-left"></i>
                </button>
                <label class="subtask-row__checkbox-wrapper">
                    <input type="checkbox" class="subtask-row__checkbox" ${subtask.completed ? 'checked' : ''} data-subtask-toggle="${taskId}" data-subtask-id="${subtask.id}">
                    <span class="subtask-row__checkmark"></span>
                </label>
                <span class="subtask-row__title" data-subtask-edit="${taskId}" data-subtask-id="${subtask.id}">${subtask.title}</span>
                <button class="btn btn--icon btn--ghost btn--xs subtask-row__delete" data-subtask-delete="${taskId}" data-subtask-id="${subtask.id}" title="Delete subtask">
                    <i data-lucide="x"></i>
                </button>
            </div>
        `;
    }

    /**
     * Render task item for full page view
     */
    function renderFullPageTaskItem(task, memberId, isCompleted = false, taskIndex = 0) {
        const priorityClass = task.priority ? `task-page-item--${task.priority}` : '';
        const { completed: subtasksDone, total: subtasksTotal } = getSubtaskProgress(task);
        const hasSubtasks = subtasksTotal > 0;
        // Can indent if not the first task and has no subtasks of its own
        const canIndent = !isCompleted && taskIndex > 0 && !hasSubtasks;

        // Subtasks list - always visible if has subtasks
        const subtasksList = hasSubtasks ? `
            <div class="task-page-item__subtasks" data-subtasks-for="${task.id}">
                ${(task.subtasks || []).map(subtask =>
                    renderSubtaskItem(subtask, task.id)
                ).join('')}
            </div>
        ` : '';

        // Task container with task row and subtasks
        return `
            <div class="task-page-item-container" data-task-id="${task.id}">
                <div class="task-page-item ${isCompleted ? 'task-page-item--completed' : ''} ${priorityClass}" data-task-row="${task.id}">
                    ${canIndent ? `
                        <button class="btn btn--icon btn--ghost btn--xs task-page-item__indent-btn" data-indent-task="${task.id}" title="Make subtask">
                            <i data-lucide="arrow-right"></i>
                        </button>
                    ` : '<div class="task-page-item__indent-spacer"></div>'}
                    <label class="task-page-item__checkbox-wrapper">
                        <input type="checkbox" class="task-page-item__checkbox" ${isCompleted ? 'checked' : ''} data-task-toggle="${task.id}">
                        <span class="task-page-item__checkmark"></span>
                    </label>
                    <div class="task-page-item__content" data-edit="${task.id}">
                        <span class="task-page-item__title">${task.title}</span>
                        <div class="task-page-item__meta">
                            ${hasSubtasks ? `
                                <span class="task-page-item__progress ${subtasksDone === subtasksTotal ? 'task-page-item__progress--complete' : ''}">
                                    ${subtasksDone}/${subtasksTotal}
                                </span>
                            ` : ''}
                            ${task.priority ? `
                                <span class="task-page-item__priority task-page-item__priority--${task.priority}">
                                    ${task.priority}
                                </span>
                            ` : ''}
                            ${task.dueDate ? `
                                <span class="task-page-item__due ${isOverdue(task) ? 'task-page-item__due--overdue' : ''}">
                                    <i data-lucide="calendar"></i>
                                    ${DateUtils.formatShort(task.dueDate)}
                                </span>
                            ` : ''}
                            ${task.completedAt ? `
                                <span class="task-page-item__completed-date">
                                    <i data-lucide="check"></i>
                                    Done ${DateUtils.formatShort(task.completedAt)}
                                </span>
                            ` : ''}
                        </div>
                    </div>
                    ${!isCompleted ? `
                        <div class="task-page-item__drag-handle" title="Drag to reorder">
                            <i data-lucide="grip-vertical"></i>
                        </div>
                    ` : ''}
                    <button class="btn btn--icon btn--ghost btn--sm task-page-item__delete" data-delete="${task.id}" title="Delete task">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
                ${subtasksList}
            </div>
        `;
    }

    /**
     * Bind full page events
     */
    function bindFullPageEvents(container, memberId, member, widgetData) {
        // Back button - use onclick property for reliable replacement on re-render
        const backBtn = container.querySelector('#backToMemberBtn');
        if (backBtn) {
            backBtn.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                State.emit('tabChanged', memberId);
            };
            backBtn.style.cursor = 'pointer';
        }

        // Add task from full page - use container-scoped selectors
        const addBtnPage = container.querySelector('#addTaskBtnPage');
        const inputPage = container.querySelector('#newTaskInputPage');

        const addTaskFromPage = () => {
            const title = inputPage?.value?.trim();
            if (!title) return;

            const newTask = {
                id: `task-${Date.now()}`,
                title,
                completed: false,
                createdAt: DateUtils.today()
            };

            widgetData.tasks = [...(widgetData.tasks || []), newTask];
            Storage.setWidgetData(memberId, 'task-list', widgetData);
            renderTasksFullPage(container, memberId, member);
            Toast.success('Task added!');

            // Re-focus input after re-render
            setTimeout(() => {
                container.querySelector('#newTaskInputPage')?.focus();
            }, 50);
        };

        addBtnPage?.addEventListener('click', addTaskFromPage);
        inputPage?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') addTaskFromPage();
        });

        // Add task button (opens modal for advanced)
        container.querySelector('[data-action="add-task"]')?.addEventListener('click', () => {
            showAddTaskModal(memberId, () => renderTasksFullPage(container, memberId, member));
        });

        // Toggle task completion
        container.querySelectorAll('[data-task-toggle]').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                const taskId = checkbox.dataset.taskToggle;
                const task = widgetData.tasks.find(t => t.id === taskId);
                if (task) {
                    task.completed = checkbox.checked;
                    task.completedAt = checkbox.checked ? DateUtils.today() : null;
                    Storage.setWidgetData(memberId, 'task-list', widgetData);

                    // Sync with Vision Board if this task came from a goal step
                    syncWithVisionBoard(memberId, task);

                    renderTasksFullPage(container, memberId, member);
                }
            });
        });

        // Delete task
        container.querySelectorAll('[data-delete]').forEach(btn => {
            btn.addEventListener('click', () => {
                const taskId = btn.dataset.delete;
                widgetData.tasks = widgetData.tasks.filter(t => t.id !== taskId);
                Storage.setWidgetData(memberId, 'task-list', widgetData);
                renderTasksFullPage(container, memberId, member);
                Toast.success('Task deleted');
            });
        });

        // Edit task on click (inline editing)
        const startInlineEdit = (el, taskId) => {
            // Don't start if already editing
            if (el.querySelector('.task-page-item__edit-input')) return;

            const task = widgetData.tasks.find(t => t.id === taskId);
            if (!task) return;

            const titleEl = el.querySelector('.task-page-item__title');
            const originalTitle = task.title;

            // Replace title with input
            titleEl.innerHTML = `<input type="text" class="task-page-item__edit-input" value="${originalTitle}" />`;
            const input = titleEl.querySelector('input');

            // Place cursor at end after focus (use timeout to override browser's default select-all)
            input.focus();
            setTimeout(() => {
                const len = input.value.length;
                input.setSelectionRange(len, len);
            }, 10);

            const saveEdit = () => {
                const newTitle = input.value.trim();
                if (newTitle && newTitle !== originalTitle) {
                    task.title = newTitle;
                    Storage.setWidgetData(memberId, 'task-list', widgetData);
                    Toast.success('Task updated');
                }
                renderTasksFullPage(container, memberId, member);
            };

            input.addEventListener('blur', saveEdit);
            input.addEventListener('keydown', (evt) => {
                if (evt.key === 'Enter') {
                    evt.preventDefault();
                    input.blur();
                } else if (evt.key === 'Escape') {
                    renderTasksFullPage(container, memberId, member);
                }
            });
        };

        container.querySelectorAll('[data-edit]').forEach(el => {
            el.addEventListener('click', (e) => {
                // Don't trigger if clicking on checkbox
                if (e.target.closest('.task-page-item__checkbox-wrapper')) return;
                startInlineEdit(el, el.dataset.edit);
            });
        });

        // =========================================================================
        // INDENT/OUTDENT HANDLERS (Google Keep style)
        // =========================================================================

        // Indent task (make it a subtask of the task above)
        container.querySelectorAll('[data-indent-task]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const taskId = btn.dataset.indentTask;
                indentTask(memberId, taskId);
                renderTasksFullPage(container, memberId, member);
            });
        });

        // Outdent subtask (promote back to regular task)
        container.querySelectorAll('[data-outdent-subtask]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const taskId = btn.dataset.outdentSubtask;
                const subtaskId = btn.dataset.subtaskId;
                outdentSubtask(memberId, taskId, subtaskId);
                renderTasksFullPage(container, memberId, member);
            });
        });

        // =========================================================================
        // SUBTASK EVENT HANDLERS
        // =========================================================================

        // Toggle subtask completion
        container.querySelectorAll('[data-subtask-toggle]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                e.stopPropagation();
                const taskId = checkbox.dataset.subtaskToggle;
                const subtaskId = checkbox.dataset.subtaskId;
                toggleSubtask(memberId, taskId, subtaskId, widgetData);
                renderTasksFullPage(container, memberId, member);
            });
        });

        // Delete subtask
        container.querySelectorAll('[data-subtask-delete]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const taskId = btn.dataset.subtaskDelete;
                const subtaskId = btn.dataset.subtaskId;
                deleteSubtask(memberId, taskId, subtaskId, widgetData);
                renderTasksFullPage(container, memberId, member);
                Toast.success('Subtask deleted');
            });
        });

        // Inline edit subtask
        container.querySelectorAll('[data-subtask-edit]').forEach(el => {
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                // Don't start if already editing
                if (el.querySelector('input')) return;

                const taskId = el.dataset.subtaskEdit;
                const subtaskId = el.dataset.subtaskId;
                const task = widgetData.tasks.find(t => t.id === taskId);
                if (!task || !task.subtasks) return;

                const subtask = task.subtasks.find(s => s.id === subtaskId);
                if (!subtask) return;

                const originalTitle = subtask.title;
                el.innerHTML = `<input type="text" class="subtask-row__edit-input" value="${originalTitle}" />`;
                const input = el.querySelector('input');
                input.focus();
                setTimeout(() => {
                    const len = input.value.length;
                    input.setSelectionRange(len, len);
                }, 10);

                const saveSubtaskEdit = () => {
                    const newTitle = input.value.trim();
                    if (newTitle && newTitle !== originalTitle) {
                        subtask.title = newTitle;
                        Storage.setWidgetData(memberId, 'task-list', widgetData);
                        Toast.success('Subtask updated');
                    }
                    renderTasksFullPage(container, memberId, member);
                };

                input.addEventListener('blur', saveSubtaskEdit);
                input.addEventListener('keydown', (evt) => {
                    if (evt.key === 'Enter') {
                        evt.preventDefault();
                        input.blur();
                    } else if (evt.key === 'Escape') {
                        renderTasksFullPage(container, memberId, member);
                    }
                });
            });
        });

        // Clear completed - use container-scoped selector
        container.querySelector('#clearCompletedBtn')?.addEventListener('click', () => {
            if (confirm('Delete all completed tasks?')) {
                widgetData.tasks = widgetData.tasks.filter(t => !t.completed);
                Storage.setWidgetData(memberId, 'task-list', widgetData);
                renderTasksFullPage(container, memberId, member);
                Toast.success('Completed tasks cleared');
            }
        });

        // Drag and drop for reordering tasks (full page) - using SortableJS
        initSortableFullPage(container, memberId, member);
    }

    /**
     * Initialize SortableJS for full page task reordering
     */
    function initSortableFullPage(container, memberId, member) {
        const tasksList = container.querySelector('#pendingTasksList');
        if (!tasksList) return;

        // Check if SortableJS is available
        if (typeof Sortable === 'undefined') {
            console.warn('SortableJS not loaded, drag-and-drop disabled');
            return;
        }

        // Simple sortable for vertical reordering only
        Sortable.create(tasksList, {
            animation: 150,
            handle: '.task-page-item__drag-handle',
            draggable: '.task-page-item-container',
            ghostClass: 'task-page-item--ghost',
            chosenClass: 'task-page-item--chosen',
            dragClass: 'task-page-item--dragging',

            onEnd: function(evt) {
                // Get fresh data from storage
                const freshData = Storage.getWidgetData(memberId, 'task-list') || { tasks: [] };

                // Reorder tasks based on new DOM order
                const newOrder = Array.from(tasksList.querySelectorAll('.task-page-item-container'))
                    .map(el => el.dataset.taskId)
                    .filter(id => id);

                // Rebuild tasks array in new order (pending tasks only)
                const pendingTasks = freshData.tasks.filter(t => !t.completed);
                const completedTasks = freshData.tasks.filter(t => t.completed);

                const reorderedPending = [];
                newOrder.forEach(id => {
                    const task = pendingTasks.find(t => t.id === id);
                    if (task) {
                        reorderedPending.push(task);
                    }
                });

                // Add any pending tasks not in the DOM (shouldn't happen, but safe)
                pendingTasks.forEach(task => {
                    if (!reorderedPending.find(t => t.id === task.id)) {
                        reorderedPending.push(task);
                    }
                });

                // Combine reordered pending with completed
                freshData.tasks = [...reorderedPending, ...completedTasks];
                Storage.setWidgetData(memberId, 'task-list', freshData);

                // Re-render to update indent buttons (first task can't indent)
                renderTasksFullPage(container, memberId, member);
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            }
        });
    }

    /**
     * Show add task modal (for advanced task creation)
     */
    function showAddTaskModal(memberId, onSave = null) {
        const content = `
            <form id="addTaskForm">
                <div class="form-group">
                    <label class="form-label">Task</label>
                    <input type="text" class="form-input" id="taskTitle" placeholder="What needs to be done?" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Due Date (optional)</label>
                    <input type="date" class="form-input" id="taskDueDate">
                </div>
                <div class="form-group">
                    <label class="form-label">Priority</label>
                    <select class="form-input form-select" id="taskPriority">
                        <option value="">None</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                    </select>
                </div>
            </form>
        `;

        Modal.open({
            title: 'Add Task',
            content,
            footer: Modal.createFooter('Cancel', 'Add Task')
        });

        Modal.bindFooterEvents(() => {
            const title = document.getElementById('taskTitle')?.value?.trim();
            const dueDate = document.getElementById('taskDueDate')?.value || null;
            const priority = document.getElementById('taskPriority')?.value || null;

            if (!title) {
                Toast.error('Please enter a task');
                return false;
            }

            const widgetData = Storage.getWidgetData(memberId, 'task-list') || { tasks: [] };
            const newTask = {
                id: `task-${Date.now()}`,
                title,
                dueDate,
                priority,
                completed: false,
                createdAt: DateUtils.today()
            };

            const updatedData = {
                ...widgetData,
                tasks: [...widgetData.tasks, newTask]
            };

            Storage.setWidgetData(memberId, 'task-list', updatedData);
            Toast.success('Task added');

            if (onSave) {
                onSave();
            } else {
                // Refresh widget
                const widgetBody = document.getElementById('widget-task-list');
                if (widgetBody) {
                    renderWidget(widgetBody, memberId);
                    if (typeof lucide !== 'undefined') {
                        lucide.createIcons();
                    }
                }
            }

            return true;
        });
    }

    /**
     * Get pending tasks count for dashboard
     */
    function getPendingCount(memberId) {
        const widgetData = Storage.getWidgetData(memberId, 'task-list') || { tasks: [] };
        return widgetData.tasks.filter(t => !t.completed).length;
    }

    /**
     * Sync subtask completion from Vision Board step
     * Called when a step is toggled in Vision Board
     */
    function syncSubtaskFromVisionBoard(memberId, goalTitle, stepTitle, completed) {
        const widgetData = Storage.getWidgetData(memberId, 'task-list') || { tasks: [] };

        // Find the task that came from this goal
        const task = widgetData.tasks.find(t => t.fromGoal === goalTitle);
        if (!task || !task.subtasks) return;

        // Find the subtask that matches this step
        const subtask = task.subtasks.find(s => s.stepTitle === stepTitle);
        if (!subtask) return;

        // Update the subtask completion status
        subtask.completed = completed;
        Storage.setWidgetData(memberId, 'task-list', widgetData);
    }

    function init() {
        // Initialize tasks feature
    }

    return {
        init,
        renderWidget,
        showAddTaskModal,
        showTasksFullPage,
        getPendingCount,
        syncSubtaskFromVisionBoard
    };
})();
