/**
 * Tasks Feature
 * Handles task list functionality for all member types
 */

const Tasks = (function() {
    // Maximum pending tasks to show in widget before showing "+x more"
    const MAX_WIDGET_TASKS = 10;

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
        const pendingTasks = tasks.filter(t => !t.completed);
        const completedTasks = tasks.filter(t => t.completed);
        const displayTasks = pendingTasks.slice(0, MAX_WIDGET_TASKS);
        const hasMore = pendingTasks.length > MAX_WIDGET_TASKS;

        container.innerHTML = `
            <div class="tasks-widget">
                <div class="tasks-widget__add">
                    <input type="text" class="form-input tasks-widget__input" id="newTaskInput" placeholder="Add a new task...">
                    <button class="btn btn--primary btn--sm" id="addTaskBtn">
                        <i data-lucide="plus"></i>
                    </button>
                </div>

                <div class="tasks-widget__list">
                    ${pendingTasks.length === 0
                        ? '<p class="tasks-widget__empty">No pending tasks. Add a task above!</p>'
                        : ''
                    }

                    ${displayTasks.map(task => renderTaskItem(task, memberId)).join('')}

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
     * Render a single task item
     */
    function renderTaskItem(task, memberId, isDraggable = true) {
        const priorityClass = task.priority ? `task-item--${task.priority}` : '';
        const completedClass = task.completed ? 'task-item--completed' : '';

        return `
            <div class="task-item ${completedClass} ${priorityClass}" data-task-id="${task.id}" ${isDraggable ? 'draggable="true"' : ''}>
                ${isDraggable ? `
                    <div class="task-item__drag-handle" title="Drag to reorder">
                        <i data-lucide="grip-vertical"></i>
                    </div>
                ` : ''}
                <label class="task-item__checkbox-wrapper">
                    <input type="checkbox" class="task-item__checkbox" ${task.completed ? 'checked' : ''} data-task-toggle="${task.id}">
                    <span class="task-item__checkmark"></span>
                </label>
                <div class="task-item__content" data-edit="${task.id}">
                    <span class="task-item__title">${task.title}</span>
                    ${task.dueDate ? `
                        <span class="task-item__due ${isOverdue(task) ? 'task-item__due--overdue' : ''}">
                            <i data-lucide="calendar"></i>
                            ${DateUtils.formatShort(task.dueDate)}
                        </span>
                    ` : ''}
                </div>
                <button class="btn btn--icon btn--ghost btn--sm task-item__delete" data-delete="${task.id}">
                    <i data-lucide="trash-2"></i>
                </button>
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
            // Re-focus input after re-render
            setTimeout(() => {
                container.querySelector('#newTaskInput')?.focus();
            }, 50);
        });
        input?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                addTask();
                // Re-focus input after re-render
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
                input.focus();
                input.select();

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

        // Drag and drop for reordering tasks
        bindDragAndDrop(container, memberId, widgetData, false);
    }

    /**
     * Bind drag and drop events for task reordering
     */
    function bindDragAndDrop(container, memberId, widgetData, isFullPage = false) {
        const taskItems = container.querySelectorAll('[data-task-id][draggable="true"]');
        let draggedItem = null;
        let draggedTaskId = null;

        taskItems.forEach(item => {
            // Drag start
            item.addEventListener('dragstart', (e) => {
                draggedItem = item;
                draggedTaskId = item.dataset.taskId;
                item.classList.add('task-item--dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', draggedTaskId);
            });

            // Drag end
            item.addEventListener('dragend', () => {
                if (draggedItem) {
                    draggedItem.classList.remove('task-item--dragging');
                }
                draggedItem = null;
                draggedTaskId = null;
                // Remove all drag-over classes
                container.querySelectorAll('.task-item--drag-over').forEach(el => {
                    el.classList.remove('task-item--drag-over');
                });
            });

            // Drag over
            item.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (item !== draggedItem) {
                    item.classList.add('task-item--drag-over');
                }
            });

            // Drag leave
            item.addEventListener('dragleave', () => {
                item.classList.remove('task-item--drag-over');
            });

            // Drop
            item.addEventListener('drop', (e) => {
                e.preventDefault();
                item.classList.remove('task-item--drag-over');

                if (!draggedTaskId || item.dataset.taskId === draggedTaskId) return;

                const targetTaskId = item.dataset.taskId;
                reorderTasks(memberId, widgetData, draggedTaskId, targetTaskId, container, isFullPage);
            });
        });
    }

    /**
     * Reorder tasks after drag and drop
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
        const pendingTasks = tasks.filter(t => !t.completed);
        const completedTasks = tasks.filter(t => t.completed);

        container.innerHTML = `
            <div class="tasks-page">
                <div class="tasks-page__header">
                    <button class="btn btn--ghost" id="backToMemberBtn">
                        <i data-lucide="arrow-left"></i>
                        Back to ${member?.name || 'Dashboard'}
                    </button>
                    <h1 class="tasks-page__title">
                        <i data-lucide="check-square"></i>
                        Task List
                    </h1>
                    <button class="btn btn--primary" data-action="add-task">
                        <i data-lucide="plus"></i>
                        Add Task
                    </button>
                </div>

                <div class="tasks-page__stats">
                    <div class="tasks-page-stat">
                        <div class="tasks-page-stat__icon tasks-page-stat__icon--pending">
                            <i data-lucide="circle"></i>
                        </div>
                        <div class="tasks-page-stat__info">
                            <span class="tasks-page-stat__value">${pendingTasks.length}</span>
                            <span class="tasks-page-stat__label">Pending</span>
                        </div>
                    </div>
                    <div class="tasks-page-stat">
                        <div class="tasks-page-stat__icon tasks-page-stat__icon--completed">
                            <i data-lucide="check-circle"></i>
                        </div>
                        <div class="tasks-page-stat__info">
                            <span class="tasks-page-stat__value">${completedTasks.length}</span>
                            <span class="tasks-page-stat__label">Completed</span>
                        </div>
                    </div>
                    <div class="tasks-page-stat">
                        <div class="tasks-page-stat__icon tasks-page-stat__icon--total">
                            <i data-lucide="list"></i>
                        </div>
                        <div class="tasks-page-stat__info">
                            <span class="tasks-page-stat__value">${tasks.length}</span>
                            <span class="tasks-page-stat__label">Total</span>
                        </div>
                    </div>
                </div>

                <div class="tasks-page__add">
                    <input type="text" class="form-input" id="newTaskInputPage" placeholder="Add a new task...">
                    <button class="btn btn--primary" id="addTaskBtnPage">
                        <i data-lucide="plus"></i>
                        Add
                    </button>
                </div>

                ${pendingTasks.length > 0 ? `
                    <div class="tasks-page__section">
                        <h2 class="tasks-page__section-title">
                            <i data-lucide="circle"></i>
                            To Do (${pendingTasks.length})
                        </h2>
                        <div class="tasks-page__list">
                            ${pendingTasks.map(task => renderFullPageTaskItem(task, memberId)).join('')}
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
     * Render task item for full page view
     */
    function renderFullPageTaskItem(task, memberId, isCompleted = false) {
        const priorityClass = task.priority ? `task-page-item--${task.priority}` : '';
        const isDraggable = !isCompleted;

        return `
            <div class="task-page-item ${isCompleted ? 'task-page-item--completed' : ''} ${priorityClass}" data-task-id="${task.id}" ${isDraggable ? 'draggable="true"' : ''}>
                ${isDraggable ? `
                    <div class="task-page-item__drag-handle" title="Drag to reorder">
                        <i data-lucide="grip-vertical"></i>
                    </div>
                ` : ''}
                <label class="task-page-item__checkbox-wrapper">
                    <input type="checkbox" class="task-page-item__checkbox" ${isCompleted ? 'checked' : ''} data-task-toggle="${task.id}">
                    <span class="task-page-item__checkmark"></span>
                </label>
                <div class="task-page-item__content" data-edit="${task.id}">
                    <span class="task-page-item__title">${task.title}</span>
                    <div class="task-page-item__meta">
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
                <button class="btn btn--icon btn--ghost btn--sm task-page-item__delete" data-edit-btn="${task.id}" title="Edit task">
                    <i data-lucide="pencil"></i>
                </button>
                <button class="btn btn--icon btn--ghost btn--sm task-page-item__delete" data-delete="${task.id}">
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
        const addBtnPage = document.getElementById('addTaskBtnPage');
        const inputPage = document.getElementById('newTaskInputPage');

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
                document.getElementById('newTaskInputPage')?.focus();
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
            input.focus();
            input.select();

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

        // Clear completed
        document.getElementById('clearCompletedBtn')?.addEventListener('click', () => {
            if (confirm('Delete all completed tasks?')) {
                widgetData.tasks = widgetData.tasks.filter(t => !t.completed);
                Storage.setWidgetData(memberId, 'task-list', widgetData);
                renderTasksFullPage(container, memberId, member);
                Toast.success('Completed tasks cleared');
            }
        });

        // Drag and drop for reordering tasks (full page)
        bindDragAndDropFullPage(container, memberId, widgetData, member);
    }

    /**
     * Bind drag and drop events for full page task reordering
     */
    function bindDragAndDropFullPage(container, memberId, widgetData, member) {
        const taskItems = container.querySelectorAll('.task-page-item[draggable="true"]');
        let draggedItem = null;
        let draggedTaskId = null;

        taskItems.forEach(item => {
            // Drag start
            item.addEventListener('dragstart', (e) => {
                draggedItem = item;
                draggedTaskId = item.dataset.taskId;
                item.classList.add('task-page-item--dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', draggedTaskId);
            });

            // Drag end
            item.addEventListener('dragend', () => {
                if (draggedItem) {
                    draggedItem.classList.remove('task-page-item--dragging');
                }
                draggedItem = null;
                draggedTaskId = null;
                // Remove all drag-over classes
                container.querySelectorAll('.task-page-item--drag-over').forEach(el => {
                    el.classList.remove('task-page-item--drag-over');
                });
            });

            // Drag over
            item.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (item !== draggedItem) {
                    item.classList.add('task-page-item--drag-over');
                }
            });

            // Drag leave
            item.addEventListener('dragleave', () => {
                item.classList.remove('task-page-item--drag-over');
            });

            // Drop
            item.addEventListener('drop', (e) => {
                e.preventDefault();
                item.classList.remove('task-page-item--drag-over');

                if (!draggedTaskId || item.dataset.taskId === draggedTaskId) return;

                const targetTaskId = item.dataset.taskId;

                // Reorder tasks
                const tasks = widgetData.tasks || [];
                const draggedIndex = tasks.findIndex(t => t.id === draggedTaskId);
                const targetIndex = tasks.findIndex(t => t.id === targetTaskId);

                if (draggedIndex === -1 || targetIndex === -1) return;

                const [draggedTask] = tasks.splice(draggedIndex, 1);
                tasks.splice(targetIndex, 0, draggedTask);

                widgetData.tasks = tasks;
                Storage.setWidgetData(memberId, 'task-list', widgetData);
                renderTasksFullPage(container, memberId, member);

                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            });
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

    function init() {
        // Initialize tasks feature
    }

    return {
        init,
        renderWidget,
        showAddTaskModal,
        showTasksFullPage,
        getPendingCount
    };
})();
