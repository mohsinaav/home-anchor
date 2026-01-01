/**
 * Chores Feature - Random Chore Picker
 * Admin adds a pool of chores, and each day the widget picks random chores for the kid
 */

const Chores = (function() {
    // Default chore pool
    const DEFAULT_CHORES = [
        { id: 'chore-1', name: 'Make bed', icon: 'bed', points: 5 },
        { id: 'chore-2', name: 'Clean room', icon: 'home', points: 10 },
        { id: 'chore-3', name: 'Set table', icon: 'utensils', points: 5 },
        { id: 'chore-4', name: 'Feed pet', icon: 'heart', points: 5 },
        { id: 'chore-5', name: 'Take out trash', icon: 'trash', points: 8 },
        { id: 'chore-6', name: 'Wipe counters', icon: 'sparkles', points: 5 },
        { id: 'chore-7', name: 'Water plants', icon: 'flower-2', points: 3 },
        { id: 'chore-8', name: 'Put toys away', icon: 'box', points: 5 },
        { id: 'chore-9', name: 'Help with laundry', icon: 'shirt', points: 8 },
        { id: 'chore-10', name: 'Dust furniture', icon: 'wind', points: 7 }
    ];

    // Chore icons
    const CHORE_ICONS = [
        'bed', 'home', 'utensils', 'heart', 'trash', 'sparkles', 'flower-2',
        'box', 'shirt', 'wind', 'droplets', 'broom', 'dog', 'cat', 'fish',
        'car', 'bike', 'leaf', 'sun', 'moon', 'star', 'check-square'
    ];

    /**
     * Get widget data with defaults
     */
    function getWidgetData(memberId) {
        const storedData = Storage.getWidgetData(memberId, 'chores') || {};

        if (!storedData.chorePool || storedData.chorePool.length === 0) {
            storedData.chorePool = DEFAULT_CHORES.map(c => ({
                ...c,
                id: `${c.id}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
            }));
            storedData.dailyChores = {};
            storedData.completedToday = [];
            storedData.choresPerDay = 2;
            Storage.setWidgetData(memberId, 'chores', storedData);
        }

        return storedData;
    }

    /**
     * Get today's assigned chores (picks randomly if not already picked)
     */
    function getTodaysChores(memberId, widgetData) {
        const today = DateUtils.today();
        const dailyChores = widgetData.dailyChores || {};

        // If we already picked chores for today, return them
        if (dailyChores[today]) {
            return dailyChores[today];
        }

        // Pick random chores for today
        const pool = widgetData.chorePool || [];
        const choresPerDay = widgetData.choresPerDay || 2;

        if (pool.length === 0) {
            return [];
        }

        // Shuffle and pick
        const shuffled = [...pool].sort(() => Math.random() - 0.5);
        const picked = shuffled.slice(0, Math.min(choresPerDay, pool.length));

        // Save today's chores
        dailyChores[today] = picked;
        widgetData.dailyChores = dailyChores;
        Storage.setWidgetData(memberId, 'chores', widgetData);

        return picked;
    }

    /**
     * Render the chores widget for a member
     */
    function renderWidget(container, memberId) {
        const widgetData = getWidgetData(memberId);
        const today = DateUtils.today();
        const todaysChores = getTodaysChores(memberId, widgetData);

        const completedIds = (widgetData.completedToday || [])
            .filter(c => c.date === today)
            .map(c => c.choreId);

        const pendingChores = todaysChores.filter(c => !completedIds.includes(c.id));
        const completedChores = todaysChores.filter(c => completedIds.includes(c.id));
        const allDone = pendingChores.length === 0 && todaysChores.length > 0;

        container.innerHTML = `
            <div class="chores-widget chores-widget--picker">
                <div class="chores-widget__header">
                    <div class="chores-widget__title-area">
                        <div class="chores-widget__icon">
                            <i data-lucide="sparkles"></i>
                        </div>
                        <div class="chores-widget__title-text">
                            <h3 class="chores-widget__title">Today's Chores</h3>
                            <span class="chores-widget__subtitle">Picked just for you!</span>
                        </div>
                    </div>
                    <div class="chores-widget__progress-badge ${allDone ? 'chores-widget__progress-badge--complete' : ''}">
                        ${allDone ? '<i data-lucide="check"></i>' : ''}
                        ${completedChores.length}/${todaysChores.length}
                    </div>
                </div>

                ${allDone ? `
                    <div class="chores-widget__celebration">
                        <div class="chores-celebration">
                            <div class="chores-celebration__icon">
                                <i data-lucide="party-popper"></i>
                            </div>
                            <h4 class="chores-celebration__title">All Done!</h4>
                            <p class="chores-celebration__text">Great job completing your chores today!</p>
                        </div>
                        <div class="chores-completed-list chores-completed-list--celebration">
                            ${completedChores.map(chore => `
                                <div class="chore-completed-item">
                                    <i data-lucide="${chore.icon || 'check'}"></i>
                                    <span>${chore.name}</span>
                                    <button class="chore-reset-btn" data-reset-chore="${chore.id}" data-member-id="${memberId}" title="Undo this chore">
                                        <i data-lucide="rotate-ccw"></i>
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : `
                    <div class="chores-widget__cards">
                        ${pendingChores.map((chore, index) => `
                            <div class="chore-picker-card" data-chore-id="${chore.id}" data-member-id="${memberId}" style="--delay: ${index * 0.1}s">
                                <div class="chore-picker-card__icon">
                                    <i data-lucide="${chore.icon || 'check-square'}"></i>
                                </div>
                                <div class="chore-picker-card__info">
                                    <span class="chore-picker-card__name">${chore.name}</span>
                                    <span class="chore-picker-card__points">
                                        <i data-lucide="star"></i>
                                        +${chore.points} points
                                    </span>
                                </div>
                                <button class="chore-picker-card__btn btn btn--sm btn--primary">
                                    Done!
                                </button>
                            </div>
                        `).join('')}
                    </div>
                `}

                ${completedChores.length > 0 && !allDone ? `
                    <div class="chores-widget__completed">
                        <h4 class="chores-widget__section-title">
                            <i data-lucide="check-circle"></i>
                            Completed
                        </h4>
                        <div class="chores-completed-list">
                            ${completedChores.map(chore => `
                                <div class="chore-completed-item">
                                    <i data-lucide="${chore.icon || 'check'}"></i>
                                    <span>${chore.name}</span>
                                    <button class="chore-reset-btn" data-reset-chore="${chore.id}" data-member-id="${memberId}" title="Undo this chore">
                                        <i data-lucide="rotate-ccw"></i>
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                <div class="chores-widget__footer">
                    <button class="btn btn--sm btn--ghost" data-action="view-chores" data-member-id="${memberId}">
                        <i data-lucide="list"></i>
                        View Chores
                    </button>
                    <button class="btn btn--sm btn--ghost" data-action="manage-chores" data-member-id="${memberId}">
                        <i data-lucide="settings"></i>
                        Manage
                    </button>
                </div>
            </div>
        `;

        // Bind events
        bindChoreEvents(container, memberId, widgetData);

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    /**
     * Bind chore events
     */
    function bindChoreEvents(container, memberId, widgetData) {
        // Complete chore (click on card or button)
        container.querySelectorAll('.chore-picker-card').forEach(card => {
            const btn = card.querySelector('.chore-picker-card__btn');
            const handler = () => {
                const choreId = card.dataset.choreId;
                completeChore(memberId, choreId, widgetData);
            };
            card.addEventListener('click', handler);
        });

        // Reset chore (undo completion)
        container.querySelectorAll('.chore-reset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const choreId = btn.dataset.resetChore;
                resetChore(memberId, choreId, widgetData);
            });
        });

        // View all chores
        container.querySelector('[data-action="view-chores"]')?.addEventListener('click', () => {
            showViewChoresModal(memberId);
        });

        // Manage chores
        container.querySelector('[data-action="manage-chores"]')?.addEventListener('click', async () => {
            const verified = await PIN.verify();
            if (verified) {
                showManageChoresModal(memberId);
            }
        });
    }

    /**
     * Complete a chore
     */
    function completeChore(memberId, choreId, widgetData) {
        const today = DateUtils.today();
        const todaysChores = getTodaysChores(memberId, widgetData);
        const chore = todaysChores.find(c => c.id === choreId);
        if (!chore) return;

        // Check if already completed
        const alreadyCompleted = (widgetData.completedToday || [])
            .some(c => c.choreId === choreId && c.date === today);
        if (alreadyCompleted) return;

        // Update completed list
        const updatedData = {
            ...widgetData,
            completedToday: [
                ...(widgetData.completedToday || []),
                { choreId, date: today }
            ]
        };

        Storage.setWidgetData(memberId, 'chores', updatedData);

        // Award points if points widget exists
        const pointsData = Storage.getWidgetData(memberId, 'points');
        if (pointsData) {
            const updatedPointsData = {
                ...pointsData,
                balance: (pointsData.balance || 0) + chore.points,
                history: [
                    { activityId: choreId, activityName: `Chore: ${chore.name}`, date: today, points: chore.points, type: 'earned' },
                    ...(pointsData.history || []).slice(0, 99)
                ]
            };
            Storage.setWidgetData(memberId, 'points', updatedPointsData);
        }

        // Update achievements
        if (typeof Achievements !== 'undefined') {
            Achievements.updateStats(memberId, 'activity', 1);
            Achievements.updateStats(memberId, 'points', chore.points);
        }

        Toast.success(`+${chore.points} points for ${chore.name}!`);

        // Refresh widget
        const widgetBody = document.getElementById('widget-chores');
        if (widgetBody) {
            renderWidget(widgetBody, memberId);
        }

        // Refresh points widget if visible
        const pointsBody = document.getElementById('widget-points');
        if (pointsBody && typeof Points !== 'undefined') {
            Points.renderWidget(pointsBody, memberId);
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }
    }

    /**
     * Reset a completed chore (undo points)
     */
    function resetChore(memberId, choreId, widgetData) {
        const today = DateUtils.today();
        const todaysChores = getTodaysChores(memberId, widgetData);
        const chore = todaysChores.find(c => c.id === choreId);
        if (!chore) return;

        // Check if the chore was completed today
        const completedEntry = (widgetData.completedToday || [])
            .find(c => c.choreId === choreId && c.date === today);
        if (!completedEntry) return;

        // Remove from completed list
        const updatedData = {
            ...widgetData,
            completedToday: (widgetData.completedToday || [])
                .filter(c => !(c.choreId === choreId && c.date === today))
        };

        Storage.setWidgetData(memberId, 'chores', updatedData);

        // Deduct points if points widget exists
        const pointsData = Storage.getWidgetData(memberId, 'points');
        if (pointsData) {
            const updatedPointsData = {
                ...pointsData,
                balance: Math.max(0, (pointsData.balance || 0) - chore.points),
                history: [
                    { activityId: choreId, activityName: `Reset: ${chore.name}`, date: today, points: -chore.points, type: 'deducted' },
                    ...(pointsData.history || []).slice(0, 99)
                ]
            };
            Storage.setWidgetData(memberId, 'points', updatedPointsData);
        }

        Toast.info(`Chore "${chore.name}" reset (-${chore.points} points)`);

        // Refresh widget
        const widgetBody = document.getElementById('widget-chores');
        if (widgetBody) {
            renderWidget(widgetBody, memberId);
        }

        // Refresh points widget if visible
        const pointsBody = document.getElementById('widget-points');
        if (pointsBody && typeof Points !== 'undefined') {
            Points.renderWidget(pointsBody, memberId);
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }
    }

    /**
     * Show view all chores in pool
     */
    function showViewChoresModal(memberId) {
        const widgetData = getWidgetData(memberId);
        const pool = widgetData.chorePool || [];
        const choresPerDay = widgetData.choresPerDay || 2;

        const content = `
            <div class="view-chores-modal">
                <div class="view-chores-modal__info">
                    <div class="view-chores-info-card">
                        <i data-lucide="shuffle"></i>
                        <div>
                            <strong>${choresPerDay} chores</strong>
                            <span>picked daily</span>
                        </div>
                    </div>
                    <div class="view-chores-info-card">
                        <i data-lucide="list"></i>
                        <div>
                            <strong>${pool.length} chores</strong>
                            <span>in the pool</span>
                        </div>
                    </div>
                </div>

                <h4 class="view-chores-modal__title">Chore Pool</h4>
                <p class="view-chores-modal__subtitle">These chores are randomly picked each day:</p>

                <div class="view-chores-modal__list">
                    ${pool.map(chore => `
                        <div class="view-chore-item">
                            <div class="view-chore-item__icon">
                                <i data-lucide="${chore.icon || 'check-square'}"></i>
                            </div>
                            <span class="view-chore-item__name">${chore.name}</span>
                            <span class="view-chore-item__points">
                                <i data-lucide="star"></i>
                                ${chore.points}
                            </span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        Modal.open({
            title: 'All Chores',
            content,
            size: 'md',
            footer: '<button class="btn btn--primary" data-modal-cancel>Close</button>'
        });

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        document.querySelector('[data-modal-cancel]')?.addEventListener('click', () => {
            Modal.close();
        });
    }

    /**
     * Show manage chores modal
     */
    function showManageChoresModal(memberId) {
        renderManageChoresContent(memberId);
    }

    /**
     * Generate manage chores HTML
     */
    function generateManageChoresHTML(memberId) {
        const widgetData = getWidgetData(memberId);
        const pool = widgetData.chorePool || [];
        const choresPerDay = widgetData.choresPerDay || 2;

        return `
            <div class="manage-chores-v2">
                <div class="manage-chores-v2__reset">
                    <button class="btn btn--danger btn--sm" id="resetChoresBtn">
                        <i data-lucide="trash-2"></i>
                        Reset to Defaults
                    </button>
                </div>

                <div class="manage-chores-v2__settings">
                    <label class="form-label">Chores per day</label>
                    <div class="chores-per-day-selector">
                        ${[1, 2, 3, 4, 5].map(n => `
                            <button class="chores-per-day-btn ${n === choresPerDay ? 'chores-per-day-btn--selected' : ''}" data-count="${n}">
                                ${n}
                            </button>
                        `).join('')}
                    </div>
                    <p class="form-help">How many random chores to assign each day</p>
                </div>

                <div class="manage-chores-v2__pool">
                    <h4 class="manage-chores-v2__pool-title">Chore Pool (${pool.length})</h4>
                    <div class="manage-chores-v2__list">
                        ${pool.length === 0 ? `
                            <div class="manage-chores-v2__empty">
                                <i data-lucide="sparkles"></i>
                                <p>No chores yet. Add some below!</p>
                            </div>
                        ` : pool.map(chore => `
                            <div class="manage-chores-v2__item">
                                <div class="manage-chores-v2__icon">
                                    <i data-lucide="${chore.icon || 'check-square'}"></i>
                                </div>
                                <div class="manage-chores-v2__info">
                                    <span class="manage-chores-v2__name">${chore.name}</span>
                                    <span class="manage-chores-v2__points">
                                        <i data-lucide="star"></i>
                                        ${chore.points} points
                                    </span>
                                </div>
                                <div class="manage-chores-v2__actions">
                                    <button class="btn btn--icon btn--ghost btn--sm" data-edit="${chore.id}" title="Edit">
                                        <i data-lucide="pencil"></i>
                                    </button>
                                    <button class="btn btn--icon btn--ghost btn--sm btn--danger" data-delete="${chore.id}" title="Delete">
                                        <i data-lucide="trash-2"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="manage-chores-v2__add">
                    <div class="manage-chores-v2__add-header">
                        <i data-lucide="plus-circle"></i>
                        Add New Chore
                    </div>
                    <div class="manage-chores-v2__add-form">
                        <div class="form-group">
                            <label class="form-label">Chore Name</label>
                            <input type="text" class="form-input" id="newChoreName" placeholder="e.g., Make bed">
                        </div>
                        <div class="form-row">
                            <div class="form-group" style="flex: 1;">
                                <label class="form-label">Points</label>
                                <input type="number" class="form-input" id="newChorePoints" placeholder="5" value="5" min="1">
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Icon</label>
                            <div class="chore-icon-picker" id="choreIconPicker">
                                ${CHORE_ICONS.map((icon, i) => `
                                    <button type="button" class="chore-icon-picker__btn ${i === 0 ? 'chore-icon-picker__btn--selected' : ''}" data-icon="${icon}">
                                        <i data-lucide="${icon}"></i>
                                    </button>
                                `).join('')}
                            </div>
                        </div>
                        <button class="btn btn--primary btn--block" id="addChoreBtn">
                            <i data-lucide="plus"></i>
                            Add Chore
                        </button>
                    </div>
                </div>

                <div class="manage-chores-v2__repick">
                    <button class="btn btn--secondary btn--block" id="repickChoresBtn">
                        <i data-lucide="shuffle"></i>
                        Re-pick Today's Chores
                    </button>
                    <p class="form-help">This will select new random chores for today</p>
                </div>
            </div>
        `;
    }

    /**
     * Render manage chores modal
     */
    function renderManageChoresContent(memberId) {
        Modal.open({
            title: 'Manage Chores',
            content: generateManageChoresHTML(memberId),
            footer: '<button class="btn btn--primary" data-modal-done>Done</button>'
        });

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        bindManageChoresEvents(memberId);
    }

    /**
     * Refresh manage chores modal in-place
     */
    function refreshManageChoresModal(memberId) {
        const modalContent = document.getElementById('modalContent');
        if (!modalContent) return;

        modalContent.innerHTML = generateManageChoresHTML(memberId);

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        bindManageChoresEvents(memberId);
        document.getElementById('newChoreName')?.focus();
    }

    /**
     * Bind manage chores events
     */
    function bindManageChoresEvents(memberId) {
        let selectedIcon = CHORE_ICONS[0];

        // Icon picker
        document.querySelectorAll('#choreIconPicker .chore-icon-picker__btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#choreIconPicker .chore-icon-picker__btn').forEach(b =>
                    b.classList.remove('chore-icon-picker__btn--selected'));
                btn.classList.add('chore-icon-picker__btn--selected');
                selectedIcon = btn.dataset.icon;
            });
        });

        // Chores per day selector
        document.querySelectorAll('.chores-per-day-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const count = parseInt(btn.dataset.count);
                const widgetData = getWidgetData(memberId);
                widgetData.choresPerDay = count;
                Storage.setWidgetData(memberId, 'chores', widgetData);

                document.querySelectorAll('.chores-per-day-btn').forEach(b =>
                    b.classList.remove('chores-per-day-btn--selected'));
                btn.classList.add('chores-per-day-btn--selected');

                Toast.success(`Now picking ${count} chore${count > 1 ? 's' : ''} per day`);
            });
        });

        // Add chore
        const addChore = () => {
            const name = document.getElementById('newChoreName')?.value?.trim();
            const points = parseInt(document.getElementById('newChorePoints')?.value) || 5;

            if (!name) {
                Toast.error('Please enter a chore name');
                return;
            }

            const widgetData = getWidgetData(memberId);
            const newChore = {
                id: `chore-${Date.now()}`,
                name,
                points,
                icon: selectedIcon
            };

            widgetData.chorePool = [...(widgetData.chorePool || []), newChore];
            Storage.setWidgetData(memberId, 'chores', widgetData);
            Toast.success('Chore added to pool!');

            refreshManageChoresModal(memberId);
        };

        document.getElementById('addChoreBtn')?.addEventListener('click', addChore);
        document.getElementById('newChoreName')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addChore();
            }
        });

        // Delete chore
        document.querySelectorAll('[data-delete]').forEach(btn => {
            btn.addEventListener('click', () => {
                const choreId = btn.dataset.delete;
                const widgetData = getWidgetData(memberId);
                widgetData.chorePool = (widgetData.chorePool || []).filter(c => c.id !== choreId);
                Storage.setWidgetData(memberId, 'chores', widgetData);
                Toast.success('Chore removed');
                refreshManageChoresModal(memberId);
            });
        });

        // Edit chore
        document.querySelectorAll('[data-edit]').forEach(btn => {
            btn.addEventListener('click', () => {
                const choreId = btn.dataset.edit;
                showEditChoreModal(memberId, choreId);
            });
        });

        // Reset to defaults
        document.getElementById('resetChoresBtn')?.addEventListener('click', () => {
            if (confirm('This will delete ALL current chores and reset to defaults. Are you sure?')) {
                const widgetData = getWidgetData(memberId);
                widgetData.chorePool = DEFAULT_CHORES.map(c => ({
                    ...c,
                    id: `${c.id}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
                }));
                // Clear today's chores so they get re-picked
                const today = DateUtils.today();
                if (widgetData.dailyChores) {
                    delete widgetData.dailyChores[today];
                }
                Storage.setWidgetData(memberId, 'chores', widgetData);
                Toast.success('Chores reset to defaults');

                // Refresh widget
                const widgetBody = document.getElementById('widget-chores');
                if (widgetBody) {
                    renderWidget(widgetBody, memberId);
                }

                refreshManageChoresModal(memberId);
            }
        });

        // Re-pick today's chores
        document.getElementById('repickChoresBtn')?.addEventListener('click', () => {
            if (confirm('This will pick new random chores for today. Any progress will be lost. Continue?')) {
                const widgetData = getWidgetData(memberId);
                const today = DateUtils.today();

                // Remove today's chores and completed
                if (widgetData.dailyChores) {
                    delete widgetData.dailyChores[today];
                }
                widgetData.completedToday = (widgetData.completedToday || []).filter(c => c.date !== today);
                Storage.setWidgetData(memberId, 'chores', widgetData);

                Toast.success('New chores picked for today!');

                // Refresh widget
                const widgetBody = document.getElementById('widget-chores');
                if (widgetBody) {
                    renderWidget(widgetBody, memberId);
                }
            }
        });

        // Done button
        document.querySelector('[data-modal-done]')?.addEventListener('click', () => {
            Modal.close();
            const widgetBody = document.getElementById('widget-chores');
            if (widgetBody) {
                renderWidget(widgetBody, memberId);
            }
        });
    }

    /**
     * Show edit chore modal
     */
    function showEditChoreModal(memberId, choreId) {
        const widgetData = getWidgetData(memberId);
        const chore = (widgetData.chorePool || []).find(c => c.id === choreId);
        if (!chore) return;

        const content = `
            <div class="edit-chore-form">
                <div class="form-group">
                    <label class="form-label">Chore Name</label>
                    <input type="text" class="form-input" id="editChoreName" value="${chore.name}">
                </div>
                <div class="form-group">
                    <label class="form-label">Points</label>
                    <input type="number" class="form-input" id="editChorePoints" value="${chore.points}" min="1">
                </div>
                <div class="form-group">
                    <label class="form-label">Icon</label>
                    <div class="chore-icon-picker" id="editIconPicker">
                        ${CHORE_ICONS.map(icon => `
                            <button type="button" class="chore-icon-picker__btn ${icon === chore.icon ? 'chore-icon-picker__btn--selected' : ''}" data-icon="${icon}">
                                <i data-lucide="${icon}"></i>
                            </button>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        Modal.open({
            title: 'Edit Chore',
            content,
            footer: Modal.createFooter('Cancel', 'Save')
        });

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        let selectedIcon = chore.icon || 'check-square';

        // Icon picker
        document.querySelectorAll('#editIconPicker .chore-icon-picker__btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#editIconPicker .chore-icon-picker__btn').forEach(b =>
                    b.classList.remove('chore-icon-picker__btn--selected'));
                btn.classList.add('chore-icon-picker__btn--selected');
                selectedIcon = btn.dataset.icon;
            });
        });

        Modal.bindFooterEvents(() => {
            const name = document.getElementById('editChoreName')?.value?.trim();
            const points = parseInt(document.getElementById('editChorePoints')?.value) || 5;

            if (!name) {
                Toast.error('Please enter a chore name');
                return false;
            }

            const choreIndex = widgetData.chorePool.findIndex(c => c.id === choreId);
            if (choreIndex !== -1) {
                widgetData.chorePool[choreIndex] = {
                    ...widgetData.chorePool[choreIndex],
                    name,
                    points,
                    icon: selectedIcon
                };
                Storage.setWidgetData(memberId, 'chores', widgetData);
            }

            Toast.success('Chore updated!');
            showManageChoresModal(memberId);
            return true;
        }, () => {
            showManageChoresModal(memberId);
        });
    }

    function init() {
        // Initialize chores feature
    }

    return {
        init,
        renderWidget
    };
})();
