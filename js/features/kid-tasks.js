/**
 * Kid Tasks Feature
 * Fun, colorful task list for kids - same functionality as adult tasks
 * but with a kid-friendly color theme
 */

const KidTasks = (function() {
    // Maximum pending tasks to show in widget before "View All"
    const MAX_WIDGET_TASKS = 5;

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

    /**
     * Render the kid tasks widget
     */
    function renderWidget(container, memberId) {
        const widgetData = getWidgetData(memberId);
        const tasks = widgetData.tasks || [];
        const pendingTasks = tasks.filter(t => !t.completed);
        const completedTasks = tasks.filter(t => t.completed);
        const displayTasks = pendingTasks.slice(0, MAX_WIDGET_TASKS);
        const hasMore = pendingTasks.length > MAX_WIDGET_TASKS;

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
                        ? '<p class="kid-tasks-widget__empty">No tasks yet! Add something above! 📝</p>'
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
            renderFullPage(container, memberId, member);
        } else {
            renderWidget(container, memberId);
        }

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
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
        const pendingTasks = tasks.filter(t => !t.completed);
        const completedTasks = tasks.filter(t => t.completed);

        container.innerHTML = `
            <div class="kid-tasks-page">
                <div class="kid-tasks-page__header">
                    <button class="btn btn--ghost" id="backToMemberBtn">
                        <i data-lucide="arrow-left"></i>
                        Back to ${member?.name || 'Dashboard'}
                    </button>
                    <h1 class="kid-tasks-page__title">
                        📝 My Task List
                    </h1>
                    <div></div>
                </div>

                <div class="kid-tasks-page__stats">
                    <div class="kid-tasks-page-stat kid-tasks-page-stat--pending">
                        <div class="kid-tasks-page-stat__icon">📋</div>
                        <div class="kid-tasks-page-stat__info">
                            <span class="kid-tasks-page-stat__value">${pendingTasks.length}</span>
                            <span class="kid-tasks-page-stat__label">To Do</span>
                        </div>
                    </div>
                    <div class="kid-tasks-page-stat kid-tasks-page-stat--done">
                        <div class="kid-tasks-page-stat__icon">✅</div>
                        <div class="kid-tasks-page-stat__info">
                            <span class="kid-tasks-page-stat__value">${completedTasks.length}</span>
                            <span class="kid-tasks-page-stat__label">Done</span>
                        </div>
                    </div>
                    <div class="kid-tasks-page-stat kid-tasks-page-stat--total">
                        <div class="kid-tasks-page-stat__icon">📊</div>
                        <div class="kid-tasks-page-stat__info">
                            <span class="kid-tasks-page-stat__value">${tasks.length}</span>
                            <span class="kid-tasks-page-stat__label">Total</span>
                        </div>
                    </div>
                </div>

                <div class="kid-tasks-page__add">
                    <input type="text" class="form-input" id="newKidTaskInputPage" placeholder="What do you want to do?">
                    <button class="btn btn--primary" id="addKidTaskBtnPage">
                        <i data-lucide="plus"></i>
                        Add
                    </button>
                </div>

                ${pendingTasks.length > 0 ? `
                    <div class="kid-tasks-page__section">
                        <h2 class="kid-tasks-page__section-title">
                            📋 Things To Do
                        </h2>
                        <div class="kid-tasks-page__list">
                            ${pendingTasks.map(task => renderFullPageTaskItem(task)).join('')}
                        </div>
                    </div>
                ` : ''}

                ${completedTasks.length > 0 ? `
                    <div class="kid-tasks-page__section kid-tasks-page__section--completed">
                        <h2 class="kid-tasks-page__section-title kid-tasks-page__section-title--done">
                            ✅ Completed
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
                    <div class="kid-tasks-page__empty">
                        <div class="kid-tasks-page__empty-icon">📝</div>
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
    function bindFullPageEvents(container, memberId, member, widgetData) {
        // Back button
        document.getElementById('backToMemberBtn')?.addEventListener('click', () => {
            State.emit('tabChanged', memberId);
        });

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
            renderFullPage(container, memberId, member);
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
                renderFullPage(container, memberId, member);
            };

            input.addEventListener('blur', saveEdit);
            input.addEventListener('keydown', (evt) => {
                if (evt.key === 'Enter') {
                    evt.preventDefault();
                    input.blur();
                } else if (evt.key === 'Escape') {
                    renderFullPage(container, memberId, member);
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
