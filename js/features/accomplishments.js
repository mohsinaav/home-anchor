/**
 * Accomplishments Feature
 * Extra achievements log for kids
 */

const Accomplishments = (function() {
    /**
     * Render the accomplishments widget for a member
     */
    function renderWidget(container, memberId) {
        const widgetData = Storage.getWidgetData(memberId, 'accomplishments') || {
            items: []
        };

        const items = widgetData.items || [];
        const recentItems = items.slice(0, 5);

        container.innerHTML = `
            <div class="accomplishments-widget">
                ${recentItems.length > 0 ? `
                    <div class="accomplishments-widget__list">
                        ${recentItems.map(item => `
                            <div class="accomplishment-item">
                                <div class="accomplishment-item__icon" style="background-color: ${item.color || '#F59E0B'}">
                                    <i data-lucide="${item.icon || 'trophy'}"></i>
                                </div>
                                <div class="accomplishment-item__content">
                                    <span class="accomplishment-item__title">${item.title}</span>
                                    <span class="accomplishment-item__date">${DateUtils.formatShort(item.date)}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : `
                    <div class="accomplishments-widget__empty">
                        <i data-lucide="trophy"></i>
                        <p>No accomplishments yet</p>
                        <p class="text-muted">Record special achievements!</p>
                    </div>
                `}

                <div class="accomplishments-widget__footer">
                    <button class="btn btn--primary btn--sm" data-action="add-accomplishment" data-member-id="${memberId}">
                        <i data-lucide="plus"></i>
                        Add
                    </button>
                    ${items.length > 5 ? `
                        <button class="btn btn--sm btn--ghost" data-action="view-all" data-member-id="${memberId}">
                            <i data-lucide="list"></i>
                            View All (${items.length})
                        </button>
                    ` : ''}
                </div>
            </div>
        `;

        // Bind events
        bindAccomplishmentEvents(container, memberId, widgetData);
    }

    /**
     * Bind accomplishment events
     */
    function bindAccomplishmentEvents(container, memberId, widgetData) {
        container.querySelector('[data-action="add-accomplishment"]')?.addEventListener('click', () => {
            showAddAccomplishmentModal(memberId, widgetData);
        });

        container.querySelector('[data-action="view-all"]')?.addEventListener('click', () => {
            showAllAccomplishmentsModal(memberId, widgetData);
        });
    }

    /**
     * Show add accomplishment modal
     */
    function showAddAccomplishmentModal(memberId, widgetData) {
        const categories = [
            { name: 'Academic', icon: 'graduation-cap', color: '#3B82F6' },
            { name: 'Sports', icon: 'medal', color: '#10B981' },
            { name: 'Arts', icon: 'palette', color: '#EC4899' },
            { name: 'Music', icon: 'music', color: '#8B5CF6' },
            { name: 'Social', icon: 'heart', color: '#F59E0B' },
            { name: 'Other', icon: 'star', color: '#6366F1' }
        ];

        const content = `
            <form id="addAccomplishmentForm">
                <div class="form-group">
                    <label class="form-label">What did they accomplish?</label>
                    <input type="text" class="form-input" id="accomplishmentTitle" placeholder="e.g., Learned to tie shoes" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Category</label>
                    <div class="category-picker">
                        ${categories.map((cat, i) => `
                            <label class="category-option ${i === 0 ? 'category-option--selected' : ''}">
                                <input type="radio" name="category" value="${cat.name}" data-icon="${cat.icon}" data-color="${cat.color}" ${i === 0 ? 'checked' : ''}>
                                <span class="category-option__icon" style="background-color: ${cat.color}">
                                    <i data-lucide="${cat.icon}"></i>
                                </span>
                                <span class="category-option__name">${cat.name}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Date</label>
                    <input type="date" class="form-input" id="accomplishmentDate" value="${DateUtils.today()}">
                </div>
                <div class="form-group">
                    <label class="form-label">Notes (optional)</label>
                    <textarea class="form-input" id="accomplishmentNotes" rows="2" placeholder="Add any details..."></textarea>
                </div>
            </form>
        `;

        Modal.open({
            title: 'Add Accomplishment',
            content,
            footer: Modal.createFooter('Cancel', 'Save')
        });

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Category selection
        document.querySelectorAll('.category-option input').forEach(radio => {
            radio.addEventListener('change', () => {
                document.querySelectorAll('.category-option').forEach(opt => {
                    opt.classList.toggle('category-option--selected', opt.contains(radio));
                });
            });
        });

        Modal.bindFooterEvents(() => {
            const title = document.getElementById('accomplishmentTitle')?.value?.trim();
            const date = document.getElementById('accomplishmentDate')?.value || DateUtils.today();
            const notes = document.getElementById('accomplishmentNotes')?.value?.trim();
            const selectedCategory = document.querySelector('input[name="category"]:checked');
            const category = selectedCategory?.value || 'Other';
            const icon = selectedCategory?.dataset.icon || 'star';
            const color = selectedCategory?.dataset.color || '#6366F1';

            if (!title) {
                Toast.error('Please enter what they accomplished');
                return false;
            }

            const newItem = {
                id: `acc-${Date.now()}`,
                title,
                category,
                icon,
                color,
                date,
                notes
            };

            const updatedData = {
                ...widgetData,
                items: [newItem, ...(widgetData.items || [])]
            };

            Storage.setWidgetData(memberId, 'accomplishments', updatedData);
            Toast.success('Accomplishment recorded!');

            // Refresh widget
            const widgetBody = document.getElementById('widget-accomplishments');
            if (widgetBody) {
                renderWidget(widgetBody, memberId);
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            }

            return true;
        });
    }

    /**
     * Show all accomplishments modal
     */
    function showAllAccomplishmentsModal(memberId, widgetData) {
        const items = widgetData.items || [];

        const content = items.length === 0
            ? '<p class="text-center text-muted">No accomplishments recorded yet</p>'
            : `
                <div class="all-accomplishments">
                    ${items.map(item => `
                        <div class="all-accomplishments__item">
                            <div class="all-accomplishments__icon" style="background-color: ${item.color || '#6366F1'}">
                                <i data-lucide="${item.icon || 'star'}"></i>
                            </div>
                            <div class="all-accomplishments__content">
                                <span class="all-accomplishments__title">${item.title}</span>
                                <span class="all-accomplishments__meta">
                                    ${item.category} • ${DateUtils.formatShort(item.date)}
                                </span>
                                ${item.notes ? `<p class="all-accomplishments__notes">${item.notes}</p>` : ''}
                            </div>
                            <button class="btn btn--icon btn--ghost btn--sm" data-delete="${item.id}">
                                <i data-lucide="trash-2"></i>
                            </button>
                        </div>
                    `).join('')}
                </div>
            `;

        Modal.open({
            title: 'All Accomplishments',
            content,
            footer: '<button class="btn btn--primary" data-modal-cancel>Close</button>'
        });

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Delete buttons
        document.querySelectorAll('[data-delete]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const itemId = btn.dataset.delete;
                const confirmed = await Modal.dangerConfirm('Delete this accomplishment?', 'Delete');
                if (confirmed) {
                    const updatedData = {
                        ...widgetData,
                        items: widgetData.items.filter(i => i.id !== itemId)
                    };
                    Storage.setWidgetData(memberId, 'accomplishments', updatedData);
                    Toast.success('Deleted');
                    Modal.close();
                    showAllAccomplishmentsModal(memberId, updatedData);
                }
            });
        });

        document.querySelector('[data-modal-cancel]')?.addEventListener('click', () => {
            Modal.close();
            // Refresh widget
            const widgetBody = document.getElementById('widget-accomplishments');
            if (widgetBody) {
                renderWidget(widgetBody, memberId);
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            }
        });
    }

    function init() {
        // Initialize accomplishments feature
    }

    return {
        init,
        renderWidget
    };
})();
