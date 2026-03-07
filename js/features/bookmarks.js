/**
 * Bookmarks Widget
 * Save and organize useful external links with tags and descriptions
 */
const Bookmarks = (function() {
    const STORAGE_KEY = 'bookmarks';

    const DEFAULT_TAGS = ['activities', 'recipes', 'shopping', 'learning', 'diy', 'health', 'fun'];

    const TAG_COLORS = {
        'activities': '#F59E0B',
        'recipes': '#EF4444',
        'shopping': '#8B5CF6',
        'learning': '#3B82F6',
        'diy': '#10B981',
        'health': '#EC4899',
        'fun': '#F97316'
    };

    function getTagColor(tag) {
        return TAG_COLORS[tag.toLowerCase()] || '#6366F1';
    }

    function extractDomain(url) {
        try {
            const u = new URL(url.startsWith('http') ? url : 'https://' + url);
            return u.hostname.replace('www.', '');
        } catch {
            return '';
        }
    }

    function normalizeUrl(url) {
        if (!url) return '';
        url = url.trim();
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }
        return url;
    }

    function getFaviconUrl(domain) {
        return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    }

    function getWidgetData(memberId) {
        const data = Storage.getWidgetData(memberId, STORAGE_KEY);
        if (!data || !data.items) {
            return { items: [], tags: [...DEFAULT_TAGS] };
        }
        if (!data.tags) {
            data.tags = [...DEFAULT_TAGS];
        }
        return data;
    }

    function saveData(memberId, data) {
        Storage.setWidgetData(memberId, STORAGE_KEY, data);
    }

    // =========================================================================
    // Collapsed Widget View
    // =========================================================================

    function renderWidget(container, memberId) {
        const data = getWidgetData(memberId);
        const items = data.items || [];
        const recent = items.slice(0, 3);

        if (items.length === 0) {
            container.innerHTML = `
                <div class="bookmarks-widget__empty">
                    <i data-lucide="bookmark" style="width: 32px; height: 32px; color: #6366F1; opacity: 0.5;"></i>
                    <p>Save useful links here</p>
                    <button class="btn btn--primary btn--sm" data-action="add-bookmark">
                        <i data-lucide="plus" style="width: 14px; height: 14px;"></i>
                        Add Link
                    </button>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div class="bookmarks-widget__list">
                    ${recent.map(item => `
                        <a href="${item.url}" target="_blank" rel="noopener noreferrer"
                           class="bookmarks-widget__item" title="${item.title}">
                            <img class="bookmarks-widget__favicon"
                                 src="${getFaviconUrl(item.domain)}"
                                 alt="" width="20" height="20"
                                 onerror="this.style.display='none'">
                            <div class="bookmarks-widget__item-info">
                                <span class="bookmarks-widget__item-title">${item.title}</span>
                                <span class="bookmarks-widget__item-domain">${item.domain}</span>
                                ${(item.tags && item.tags.length > 0) ? `
                                    <div class="bookmarks-widget__item-tags">
                                        ${item.tags.map(tag => `<span class="bookmarks-widget__item-tag" style="--tag-color: ${getTagColor(tag)}">${tag}</span>`).join('')}
                                    </div>
                                ` : ''}
                            </div>
                            <i data-lucide="external-link" style="width: 14px; height: 14px; color: var(--gray-400); flex-shrink: 0;"></i>
                        </a>
                    `).join('')}
                    ${items.length > 3 ? `
                        <button class="bookmarks-widget__more" data-action="view-all">+${items.length - 3} more</button>
                    ` : ''}
                </div>
                <div class="bookmarks-widget__footer">
                    <button class="btn btn--ghost btn--sm" data-action="add-bookmark">
                        <i data-lucide="plus" style="width: 14px; height: 14px;"></i>
                        Add Link
                    </button>
                </div>
            `;
        }

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        container.querySelector('[data-action="add-bookmark"]')?.addEventListener('click', (e) => {
            e.stopPropagation();
            showAddBookmarkModal(memberId);
        });

        container.querySelector('[data-action="view-all"]')?.addEventListener('click', (e) => {
            e.stopPropagation();
            showFullPage(memberId);
        });
    }

    // =========================================================================
    // Full Page View
    // =========================================================================

    function showFullPage(memberId, filterTag = 'all', searchQuery = '') {
        const mainContainer = document.querySelector('main');
        if (!mainContainer) return;

        const data = getWidgetData(memberId);
        const allItems = data.items || [];
        const allTags = data.tags || [...DEFAULT_TAGS];

        // Collect tags actually in use
        const usedTags = {};
        allTags.forEach(t => { usedTags[t] = 0; });
        allItems.forEach(item => {
            (item.tags || []).forEach(t => {
                if (usedTags[t] !== undefined) usedTags[t]++;
                else usedTags[t] = 1;
            });
        });

        // Filter items
        let items = filterTag === 'all'
            ? allItems
            : allItems.filter(item => (item.tags || []).includes(filterTag));

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            items = items.filter(item =>
                item.title.toLowerCase().includes(q) ||
                (item.description || '').toLowerCase().includes(q) ||
                item.domain.toLowerCase().includes(q)
            );
        }

        mainContainer.innerHTML = `
            <div class="bookmarks-page">
                <div class="bookmarks-page__hero">
                    <div class="bookmarks-page__hero-bg"></div>
                    <div class="bookmarks-page__hero-content">
                        <button class="bookmarks-page__back" data-action="back">
                            <i data-lucide="arrow-left"></i> Back
                        </button>
                        <div class="bookmarks-page__header">
                            <div class="bookmarks-page__icon">
                                <i data-lucide="bookmark"></i>
                            </div>
                            <h2 class="bookmarks-page__title">Bookmarks</h2>
                            <p class="bookmarks-page__subtitle">${allItems.length} link${allItems.length !== 1 ? 's' : ''} saved</p>
                        </div>
                        <div class="bookmarks-page__actions">
                            <button class="btn btn--primary" data-action="add">
                                <i data-lucide="plus"></i>
                                Add Link
                            </button>
                        </div>
                    </div>
                </div>

                <div class="bookmarks-page__filters">
                    <div class="bookmarks-filter__scroll">
                        <button class="bookmarks-filter__chip ${filterTag === 'all' ? 'bookmarks-filter__chip--active' : ''}"
                                data-filter="all">
                            <i data-lucide="grid-2x2" style="width: 14px; height: 14px;"></i>
                            All
                            <span class="bookmarks-filter__count">${allItems.length}</span>
                        </button>
                        ${allTags.filter(tag => usedTags[tag] > 0).map(tag => `
                            <button class="bookmarks-filter__chip ${filterTag === tag ? 'bookmarks-filter__chip--active' : ''}"
                                    data-filter="${tag}"
                                    style="--chip-color: ${getTagColor(tag)}">
                                ${tag}
                                <span class="bookmarks-filter__count">${usedTags[tag]}</span>
                            </button>
                        `).join('')}
                    </div>
                    <div class="bookmarks-search">
                        <i data-lucide="search" style="width: 16px; height: 16px;"></i>
                        <input type="text" class="bookmarks-search__input" placeholder="Search bookmarks..."
                               value="${searchQuery}" data-action="search">
                    </div>
                </div>

                <div class="bookmarks-page__content">
                    ${items.length === 0 ? `
                        <div class="bookmarks-page__empty">
                            ${allItems.length > 0 ? `
                                <i data-lucide="search-x" style="width: 48px; height: 48px;"></i>
                                <h3>No matching bookmarks</h3>
                                <p>Try a different filter or search term</p>
                                <button class="btn btn--primary btn--sm" data-action="clear-filter">Show All</button>
                            ` : `
                                <div class="bookmarks-page__empty-icon">
                                    <i data-lucide="bookmark-plus" style="width: 48px; height: 48px;"></i>
                                </div>
                                <h3>Save your first link!</h3>
                                <p>Bookmark useful links from anywhere on the web</p>
                                <button class="btn btn--primary" data-action="add">
                                    <i data-lucide="plus" style="width: 16px; height: 16px;"></i>
                                    Add Link
                                </button>
                            `}
                        </div>
                    ` : `
                        <div class="bookmarks-grid">
                            ${items.map(item => `
                                <div class="bookmark-card" data-id="${item.id}">
                                    <div class="bookmark-card__header">
                                        <img class="bookmark-card__favicon"
                                             src="${getFaviconUrl(item.domain)}"
                                             alt="" width="24" height="24"
                                             onerror="this.style.display='none'">
                                        <span class="bookmark-card__domain">${item.domain}</span>
                                        <div class="bookmark-card__menu">
                                            <button class="bookmark-card__menu-btn" data-action="menu" data-id="${item.id}">
                                                <i data-lucide="more-vertical" style="width: 16px; height: 16px;"></i>
                                            </button>
                                            <div class="bookmark-card__dropdown" data-dropdown="${item.id}">
                                                <button data-action="edit" data-id="${item.id}">
                                                    <i data-lucide="pencil" style="width: 14px; height: 14px;"></i> Edit
                                                </button>
                                                <button data-action="delete" data-id="${item.id}">
                                                    <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i> Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="bookmark-card__body">
                                        <h3 class="bookmark-card__title">${item.title}</h3>
                                        ${item.description ? `<p class="bookmark-card__desc">${item.description}</p>` : ''}
                                    </a>
                                    <div class="bookmark-card__footer">
                                        <div class="bookmark-card__tags">
                                            ${(item.tags || []).map(tag => `
                                                <span class="bookmark-card__tag" style="--tag-color: ${getTagColor(tag)}">${tag}</span>
                                            `).join('')}
                                        </div>
                                        <span class="bookmark-card__date">${DateUtils.formatShort(item.createdAt)}</span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>
            </div>
        `;

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Bind events
        mainContainer.querySelector('[data-action="back"]')?.addEventListener('click', () => {
            State.emit('tabChanged', memberId);
        });

        mainContainer.querySelectorAll('[data-action="add"]').forEach(btn => {
            btn.addEventListener('click', () => showAddBookmarkModal(memberId));
        });

        mainContainer.querySelector('[data-action="clear-filter"]')?.addEventListener('click', () => {
            showFullPage(memberId, 'all', '');
        });

        // Filter chips
        mainContainer.querySelectorAll('.bookmarks-filter__chip').forEach(chip => {
            chip.addEventListener('click', () => {
                showFullPage(memberId, chip.dataset.filter, searchQuery);
            });
        });

        // Search
        let searchTimeout;
        const searchInput = mainContainer.querySelector('[data-action="search"]');
        searchInput?.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                showFullPage(memberId, filterTag, searchInput.value.trim());
            }, 300);
        });

        // Card menu toggles
        mainContainer.querySelectorAll('[data-action="menu"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                // Close other dropdowns
                mainContainer.querySelectorAll('.bookmark-card__dropdown--open').forEach(d => {
                    if (d.dataset.dropdown !== id) d.classList.remove('bookmark-card__dropdown--open');
                });
                const dropdown = mainContainer.querySelector(`[data-dropdown="${id}"]`);
                dropdown?.classList.toggle('bookmark-card__dropdown--open');
            });
        });

        // Close dropdowns on outside click
        document.addEventListener('click', () => {
            mainContainer.querySelectorAll('.bookmark-card__dropdown--open').forEach(d => {
                d.classList.remove('bookmark-card__dropdown--open');
            });
        }, { once: true });

        // Edit buttons
        mainContainer.querySelectorAll('[data-action="edit"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const item = allItems.find(i => i.id === btn.dataset.id);
                if (item) showAddBookmarkModal(memberId, item);
            });
        });

        // Delete buttons
        mainContainer.querySelectorAll('[data-action="delete"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteBookmark(memberId, btn.dataset.id, filterTag, searchQuery);
            });
        });
    }

    // =========================================================================
    // Add / Edit Modal
    // =========================================================================

    function showAddBookmarkModal(memberId, editItem = null) {
        const isEdit = !!editItem;
        const data = getWidgetData(memberId);
        const allTags = data.tags || [...DEFAULT_TAGS];

        // Collect all unique tags from items too
        const itemTags = new Set(allTags);
        (data.items || []).forEach(item => {
            (item.tags || []).forEach(t => itemTags.add(t));
        });
        const availableTags = [...itemTags];

        const selectedTags = editItem ? (editItem.tags || []) : [];

        const content = `
            <form class="bookmarks-form" onsubmit="return false;">
                <div class="form-group">
                    <label class="form-label">URL *</label>
                    <input type="url" id="bookmarkUrl" class="form-input"
                           placeholder="https://instagram.com/p/..."
                           value="${editItem?.url || ''}" ${isEdit ? '' : 'autofocus'}>
                </div>
                <div class="form-group">
                    <label class="form-label">Title *</label>
                    <input type="text" id="bookmarkTitle" class="form-input"
                           placeholder="What is this link about?"
                           value="${editItem?.title || ''}">
                </div>
                <div class="form-group">
                    <label class="form-label">Description</label>
                    <textarea id="bookmarkDesc" class="form-textarea" rows="2"
                              placeholder="Add a note to remember what this was...">${editItem?.description || ''}</textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">Tags</label>
                    <div class="bookmarks-tag-picker" id="tagPicker">
                        ${availableTags.map(tag => `
                            <label class="bookmarks-tag-option ${selectedTags.includes(tag) ? 'bookmarks-tag-option--selected' : ''}">
                                <input type="checkbox" name="tags" value="${tag}" ${selectedTags.includes(tag) ? 'checked' : ''}>
                                <span class="bookmarks-tag-option__label" style="--tag-color: ${getTagColor(tag)}">${tag}</span>
                            </label>
                        `).join('')}
                    </div>
                    <div class="bookmarks-custom-tag">
                        <input type="text" id="customTag" class="form-input form-input--sm"
                               placeholder="Add custom tag...">
                        <button type="button" class="btn btn--ghost btn--sm" id="addCustomTag">+ Add</button>
                    </div>
                </div>
            </form>
        `;

        Modal.open({
            title: isEdit ? 'Edit Bookmark' : 'Add Bookmark',
            content,
            size: 'medium',
            footer: Modal.createFooter('Cancel', isEdit ? 'Update' : 'Save')
        });

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Auto-fill title from domain when URL changes
        const urlInput = document.getElementById('bookmarkUrl');
        const titleInput = document.getElementById('bookmarkTitle');
        if (!isEdit) {
            urlInput?.addEventListener('input', () => {
                const domain = extractDomain(urlInput.value);
                if (domain && !titleInput.value) {
                    titleInput.placeholder = domain;
                }
            });
        }

        // Tag selection toggle
        document.querySelectorAll('.bookmarks-tag-option input').forEach(cb => {
            cb.addEventListener('change', () => {
                cb.closest('.bookmarks-tag-option').classList.toggle('bookmarks-tag-option--selected', cb.checked);
            });
        });

        // Custom tag
        document.getElementById('addCustomTag')?.addEventListener('click', () => {
            const input = document.getElementById('customTag');
            const tag = input?.value?.trim().toLowerCase();
            if (!tag) return;

            // Check if already exists
            const existing = document.querySelector(`.bookmarks-tag-option input[value="${tag}"]`);
            if (existing) {
                existing.checked = true;
                existing.closest('.bookmarks-tag-option').classList.add('bookmarks-tag-option--selected');
                input.value = '';
                return;
            }

            // Add new tag chip
            const picker = document.getElementById('tagPicker');
            const label = document.createElement('label');
            label.className = 'bookmarks-tag-option bookmarks-tag-option--selected';

            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.name = 'tags';
            cb.value = tag;
            cb.checked = true;

            const span = document.createElement('span');
            span.className = 'bookmarks-tag-option__label';
            span.style.setProperty('--tag-color', '#6366F1');
            span.textContent = tag;

            label.appendChild(cb);
            label.appendChild(span);

            cb.addEventListener('change', () => {
                label.classList.toggle('bookmarks-tag-option--selected', cb.checked);
            });
            picker.appendChild(label);
            input.value = '';
        });

        // Allow Enter in custom tag input
        document.getElementById('customTag')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                document.getElementById('addCustomTag')?.click();
            }
        });

        // Save
        Modal.bindFooterEvents(() => {
            const rawUrl = document.getElementById('bookmarkUrl')?.value?.trim();
            const title = document.getElementById('bookmarkTitle')?.value?.trim();
            const description = document.getElementById('bookmarkDesc')?.value?.trim();

            if (!rawUrl) {
                Toast.error('Please enter a URL');
                return false;
            }

            const url = normalizeUrl(rawUrl);
            const domain = extractDomain(url);

            if (!domain) {
                Toast.error('Please enter a valid URL');
                return false;
            }

            if (!title) {
                Toast.error('Please enter a title');
                return false;
            }

            const selectedTagInputs = document.querySelectorAll('.bookmarks-tag-option input:checked');
            const tags = [...selectedTagInputs].map(cb => cb.value);

            // Save any new custom tags to the global tags list
            const updatedData = getWidgetData(memberId);
            tags.forEach(t => {
                if (!updatedData.tags.includes(t)) {
                    updatedData.tags.push(t);
                }
            });

            if (isEdit) {
                const idx = updatedData.items.findIndex(i => i.id === editItem.id);
                if (idx !== -1) {
                    updatedData.items[idx] = {
                        ...updatedData.items[idx],
                        url,
                        title,
                        description,
                        tags,
                        domain
                    };
                }
            } else {
                updatedData.items.unshift({
                    id: `bm-${Date.now()}`,
                    url,
                    title,
                    description,
                    tags,
                    domain,
                    createdAt: new Date().toISOString()
                });
            }

            saveData(memberId, updatedData);
            Toast.success(isEdit ? 'Bookmark updated!' : 'Bookmark saved!');

            // Refresh after modal closes
            setTimeout(() => {
                if (document.querySelector('.bookmarks-page')) {
                    showFullPage(memberId);
                } else {
                    // On collapsed widget view - re-emit tab to refresh
                    State.emit('tabChanged', memberId);
                }
            }, 150);

            return true;
        });
    }

    function deleteBookmark(memberId, itemId, filterTag, searchQuery) {
        const data = getWidgetData(memberId);
        data.items = data.items.filter(i => i.id !== itemId);
        saveData(memberId, data);
        Toast.success('Bookmark deleted');
        showFullPage(memberId, filterTag || 'all', searchQuery || '');
    }

    return {
        renderWidget,
        showFullPage
    };
})();
