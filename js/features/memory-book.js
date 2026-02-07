/**
 * Memory Book Feature
 * A keepsake journal for recording special moments and memories
 * Features: Photo attachments, Timeline view, Share functionality
 */

const MemoryBook = (function() {
    const STORAGE_KEY = 'memory-book';

    // Memory categories with icons and colors
    const CATEGORIES = [
        { name: 'First Time', icon: 'baby', color: '#EC4899' },
        { name: 'Academic', icon: 'graduation-cap', color: '#3B82F6' },
        { name: 'Sports', icon: 'medal', color: '#10B981' },
        { name: 'Arts', icon: 'palette', color: '#F472B6' },
        { name: 'Music', icon: 'music', color: '#8B5CF6' },
        { name: 'Social', icon: 'users', color: '#F59E0B' },
        { name: 'Travel', icon: 'plane', color: '#06B6D4' },
        { name: 'Milestone', icon: 'flag', color: '#EF4444' },
        { name: 'Other', icon: 'star', color: '#6366F1' }
    ];

    // Max dimensions for compressed images (keeps storage small)
    const MAX_IMAGE_WIDTH = 800;
    const MAX_IMAGE_HEIGHT = 600;
    const IMAGE_QUALITY = 0.7;

    /**
     * Compress an image file to reduce storage size
     * @param {File} file - The image file to compress
     * @returns {Promise<string>} - Compressed base64 data URL
     */
    function compressImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let { width, height } = img;

                    // Calculate new dimensions maintaining aspect ratio
                    if (width > MAX_IMAGE_WIDTH) {
                        height = (height * MAX_IMAGE_WIDTH) / width;
                        width = MAX_IMAGE_WIDTH;
                    }
                    if (height > MAX_IMAGE_HEIGHT) {
                        width = (width * MAX_IMAGE_HEIGHT) / height;
                        height = MAX_IMAGE_HEIGHT;
                    }

                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    // Compress as JPEG
                    const compressedDataUrl = canvas.toDataURL('image/jpeg', IMAGE_QUALITY);
                    resolve(compressedDataUrl);
                };
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    /**
     * Render the memory book widget for a member
     */
    function renderWidget(container, memberId) {
        const widgetData = Storage.getWidgetData(memberId, STORAGE_KEY) || { items: [] };
        // Sort items by date (newest/most recent first)
        const items = [...(widgetData.items || [])].sort((a, b) => new Date(b.date) - new Date(a.date));

        // Find a featured memory (preferably one with a photo)
        const featuredMemory = items.find(i => i.photo) || items[0];
        const otherItems = items.filter(i => i.id !== featuredMemory?.id).slice(0, 3);

        container.innerHTML = `
            <div class="memory-book-widget memory-book-widget--enhanced">
                ${items.length > 0 ? `
                    <!-- Featured Memory (Polaroid Style) -->
                    ${featuredMemory ? `
                        <div class="memory-featured" data-id="${featuredMemory.id}">
                            <div class="memory-featured__polaroid">
                                ${featuredMemory.photo ? `
                                    <div class="memory-featured__photo">
                                        <img src="${featuredMemory.photo}" alt="${featuredMemory.title}">
                                    </div>
                                ` : `
                                    <div class="memory-featured__placeholder" style="background: linear-gradient(135deg, ${featuredMemory.color}40 0%, ${featuredMemory.color}20 100%)">
                                        <i data-lucide="${featuredMemory.icon || 'star'}" style="color: ${featuredMemory.color}"></i>
                                    </div>
                                `}
                                <div class="memory-featured__caption">
                                    <span class="memory-featured__title">${featuredMemory.title}</span>
                                    <div class="memory-featured__meta">
                                        <span class="memory-featured__badge" style="background-color: ${featuredMemory.color}20; color: ${featuredMemory.color}">
                                            <i data-lucide="${featuredMemory.icon}" style="width: 12px; height: 12px;"></i>
                                            ${featuredMemory.category}
                                        </span>
                                        <span class="memory-featured__date">${DateUtils.formatShort(featuredMemory.date)}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="memory-featured__tape"></div>
                        </div>
                    ` : ''}

                    <!-- Recent Memories Grid -->
                    ${otherItems.length > 0 ? `
                        <div class="memory-book-widget__grid">
                            ${otherItems.map(item => `
                                <div class="memory-mini" data-id="${item.id}">
                                    ${item.photo ? `
                                        <div class="memory-mini__photo">
                                            <img src="${item.photo}" alt="${item.title}">
                                        </div>
                                    ` : `
                                        <div class="memory-mini__icon" style="background-color: ${item.color || '#F59E0B'}">
                                            <i data-lucide="${item.icon || 'star'}"></i>
                                        </div>
                                    `}
                                    <span class="memory-mini__title">${item.title}</span>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                ` : `
                    <div class="memory-book-widget__empty memory-book-widget__empty--enhanced">
                        <div class="memory-empty__illustration">
                            <div class="memory-empty__book">
                                <i data-lucide="book-heart"></i>
                            </div>
                            <div class="memory-empty__sparkles">
                                <span class="sparkle sparkle--1">✨</span>
                                <span class="sparkle sparkle--2">⭐</span>
                                <span class="sparkle sparkle--3">💫</span>
                            </div>
                        </div>
                        <h4>Start Your Memory Book!</h4>
                        <p>Capture first times, milestones, and special moments</p>
                    </div>
                `}

                <div class="memory-book-widget__footer">
                    <button class="btn btn--primary btn--sm memory-add-btn" data-action="add-memory" data-member-id="${memberId}">
                        <i data-lucide="camera"></i>
                        Capture Memory
                    </button>
                    ${items.length > 0 ? `
                        <button class="btn btn--sm btn--ghost" data-action="view-timeline" data-member-id="${memberId}">
                            <i data-lucide="book-open"></i>
                            View All (${items.length})
                        </button>
                    ` : ''}
                </div>
            </div>
        `;

        bindWidgetEvents(container, memberId);
    }

    /**
     * Bind widget events
     */
    function bindWidgetEvents(container, memberId) {
        container.querySelector('[data-action="add-memory"]')?.addEventListener('click', () => {
            showAddMemoryModal(memberId);
        });

        container.querySelector('[data-action="view-timeline"]')?.addEventListener('click', () => {
            showTimelinePage(memberId);
        });

        // Click on memory item to view details (legacy)
        container.querySelectorAll('.memory-item').forEach(item => {
            item.addEventListener('click', () => {
                const memoryId = item.dataset.id;
                showMemoryDetail(memberId, memoryId);
            });
        });

        // Click on featured memory
        container.querySelector('.memory-featured')?.addEventListener('click', () => {
            const memoryId = container.querySelector('.memory-featured')?.dataset.id;
            if (memoryId) showMemoryDetail(memberId, memoryId);
        });

        // Click on mini memory items
        container.querySelectorAll('.memory-mini').forEach(item => {
            item.addEventListener('click', () => {
                const memoryId = item.dataset.id;
                showMemoryDetail(memberId, memoryId);
            });
        });
    }

    /**
     * Show add memory modal with photo support
     */
    function showAddMemoryModal(memberId, editItem = null) {
        const isEdit = !!editItem;
        let selectedPhoto = editItem?.photo || null;

        const content = `
            <form id="addMemoryForm" class="memory-form">
                <div class="form-group">
                    <label class="form-label">What's the memory?</label>
                    <input type="text" class="form-input" id="memoryTitle"
                           placeholder="e.g., First day of school"
                           value="${editItem?.title || ''}" required>
                </div>

                <div class="form-group">
                    <label class="form-label">Add a Photo (optional)</label>
                    <div class="photo-upload">
                        <div class="photo-upload__preview ${selectedPhoto ? 'photo-upload__preview--has-photo' : ''}" id="photoPreview">
                            ${selectedPhoto ? `<img src="${selectedPhoto}" alt="Preview">` : `
                                <i data-lucide="image-plus"></i>
                                <span>Click to add photo</span>
                            `}
                        </div>
                        <input type="file" id="memoryPhoto" accept="image/*" class="photo-upload__input">
                        ${selectedPhoto ? `<button type="button" class="btn btn--sm btn--ghost" id="removePhoto">Remove Photo</button>` : ''}
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">Category</label>
                    <div class="category-picker">
                        ${CATEGORIES.map((cat, i) => {
                            const isSelected = editItem ? editItem.category === cat.name : i === 0;
                            return `
                                <label class="category-option ${isSelected ? 'category-option--selected' : ''}">
                                    <input type="radio" name="category" value="${cat.name}"
                                           data-icon="${cat.icon}" data-color="${cat.color}"
                                           ${isSelected ? 'checked' : ''}>
                                    <span class="category-option__icon" style="background-color: ${cat.color}">
                                        <i data-lucide="${cat.icon}"></i>
                                    </span>
                                    <span class="category-option__name">${cat.name}</span>
                                </label>
                            `;
                        }).join('')}
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">Date</label>
                    <input type="date" class="form-input" id="memoryDate"
                           value="${editItem?.date || DateUtils.today()}">
                </div>

                <div class="form-group">
                    <label class="form-label">Notes (optional)</label>
                    <textarea class="form-input" id="memoryNotes" rows="3"
                              placeholder="Add any details about this moment...">${editItem?.notes || ''}</textarea>
                </div>
            </form>
        `;

        Modal.open({
            title: isEdit ? 'Edit Memory' : 'Add Memory',
            content,
            size: 'medium',
            footer: Modal.createFooter('Cancel', isEdit ? 'Update' : 'Save')
        });

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Photo upload handling
        const photoInput = document.getElementById('memoryPhoto');
        const photoPreview = document.getElementById('photoPreview');

        photoPreview?.addEventListener('click', () => photoInput?.click());

        photoInput?.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                if (file.size > 10 * 1024 * 1024) {
                    Toast.error('Photo must be less than 10MB');
                    return;
                }

                // Show loading state
                photoPreview.innerHTML = `<span>Compressing...</span>`;
                photoPreview.classList.add('photo-upload__preview--has-photo');

                try {
                    // Compress the image to save storage space
                    selectedPhoto = await compressImage(file);
                    photoPreview.innerHTML = `<img src="${selectedPhoto}" alt="Preview">`;

                    // Add remove button if not exists
                    if (!document.getElementById('removePhoto')) {
                        const removeBtn = document.createElement('button');
                        removeBtn.type = 'button';
                        removeBtn.className = 'btn btn--sm btn--ghost';
                        removeBtn.id = 'removePhoto';
                        removeBtn.textContent = 'Remove Photo';
                        photoPreview.parentElement.appendChild(removeBtn);
                        removeBtn.addEventListener('click', removePhotoHandler);
                    }
                } catch (err) {
                    Toast.error('Failed to process image');
                    photoPreview.innerHTML = `
                        <i data-lucide="image-plus"></i>
                        <span>Click to add photo</span>
                    `;
                    photoPreview.classList.remove('photo-upload__preview--has-photo');
                    if (typeof lucide !== 'undefined') lucide.createIcons();
                }
            }
        });

        function removePhotoHandler() {
            selectedPhoto = null;
            photoPreview.innerHTML = `
                <i data-lucide="image-plus"></i>
                <span>Click to add photo</span>
            `;
            photoPreview.classList.remove('photo-upload__preview--has-photo');
            photoInput.value = '';
            document.getElementById('removePhoto')?.remove();
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }

        document.getElementById('removePhoto')?.addEventListener('click', removePhotoHandler);

        // Category selection
        document.querySelectorAll('.category-option input').forEach(radio => {
            radio.addEventListener('change', () => {
                document.querySelectorAll('.category-option').forEach(opt => {
                    opt.classList.toggle('category-option--selected', opt.contains(radio));
                });
            });
        });

        // Save handler
        Modal.bindFooterEvents(() => {
            const title = document.getElementById('memoryTitle')?.value?.trim();
            const date = document.getElementById('memoryDate')?.value || DateUtils.today();
            const notes = document.getElementById('memoryNotes')?.value?.trim();
            const selectedCategory = document.querySelector('input[name="category"]:checked');
            const category = selectedCategory?.value || 'Other';
            const icon = selectedCategory?.dataset.icon || 'star';
            const color = selectedCategory?.dataset.color || '#6366F1';

            if (!title) {
                Toast.error('Please enter what the memory is about');
                return false;
            }

            const widgetData = Storage.getWidgetData(memberId, STORAGE_KEY) || { items: [] };

            if (isEdit) {
                // Update existing
                const itemIndex = widgetData.items.findIndex(i => i.id === editItem.id);
                if (itemIndex !== -1) {
                    widgetData.items[itemIndex] = {
                        ...editItem,
                        title,
                        category,
                        icon,
                        color,
                        date,
                        notes,
                        photo: selectedPhoto,
                        updatedAt: new Date().toISOString()
                    };
                }
            } else {
                // Add new
                const newItem = {
                    id: `mem-${Date.now()}`,
                    title,
                    category,
                    icon,
                    color,
                    date,
                    notes,
                    photo: selectedPhoto,
                    createdAt: new Date().toISOString()
                };
                widgetData.items = [newItem, ...(widgetData.items || [])];
            }

            // Sort by date (newest first)
            widgetData.items.sort((a, b) => new Date(b.date) - new Date(a.date));

            try {
                Storage.setWidgetData(memberId, STORAGE_KEY, widgetData);
                Toast.success(isEdit ? 'Memory updated!' : 'Memory saved!');
                refreshWidget(memberId);
                return true;
            } catch (err) {
                if (err.name === 'QuotaExceededError') {
                    Toast.error('Storage full! Try removing the photo or deleting old memories.');
                    return false;
                }
                throw err;
            }
        });
    }

    /**
     * Show memory detail view
     */
    function showMemoryDetail(memberId, memoryId) {
        const widgetData = Storage.getWidgetData(memberId, STORAGE_KEY) || { items: [] };
        const memory = widgetData.items.find(i => i.id === memoryId);

        if (!memory) return;

        const content = `
            <div class="memory-detail">
                ${memory.photo ? `
                    <div class="memory-detail__photo">
                        <img src="${memory.photo}" alt="${memory.title}">
                    </div>
                ` : ''}
                <div class="memory-detail__header">
                    <div class="memory-detail__icon" style="background-color: ${memory.color}">
                        <i data-lucide="${memory.icon}"></i>
                    </div>
                    <div class="memory-detail__info">
                        <h3 class="memory-detail__title">${memory.title}</h3>
                        <span class="memory-detail__meta">
                            ${memory.category} &bull; ${DateUtils.formatLong(memory.date)}
                        </span>
                    </div>
                </div>
                ${memory.notes ? `
                    <div class="memory-detail__notes">
                        <p>${memory.notes}</p>
                    </div>
                ` : ''}
            </div>
        `;

        Modal.open({
            title: 'Memory',
            content,
            footer: `
                <div class="memory-detail__actions">
                    <button class="btn btn--ghost" data-action="share">
                        <i data-lucide="share-2"></i>
                        Share
                    </button>
                    <button class="btn btn--ghost" data-action="edit">
                        <i data-lucide="pencil"></i>
                        Edit
                    </button>
                    <button class="btn btn--ghost btn--danger" data-action="delete">
                        <i data-lucide="trash-2"></i>
                        Delete
                    </button>
                    <button class="btn btn--primary" data-modal-cancel>Close</button>
                </div>
            `
        });

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Bind actions - use modal-specific selectors
        const modalFooter = document.getElementById('modalFooter');

        modalFooter?.querySelector('[data-action="edit"]')?.addEventListener('click', () => {
            Modal.close();
            showAddMemoryModal(memberId, memory);
        });

        modalFooter?.querySelector('[data-action="delete"]')?.addEventListener('click', async () => {
            const confirmed = await Modal.dangerConfirm('Delete this memory?', 'Delete');
            if (confirmed) {
                const currentData = Storage.getWidgetData(memberId, STORAGE_KEY) || { items: [] };
                currentData.items = currentData.items.filter(i => i.id !== memoryId);
                Storage.setWidgetData(memberId, STORAGE_KEY, currentData);
                Toast.success('Memory deleted');
                Modal.close();

                // Refresh timeline page if we're on it, otherwise refresh widget
                if (document.querySelector('.memory-book-page')) {
                    showTimelinePage(memberId);
                } else {
                    refreshWidget(memberId);
                }
            }
        });

        modalFooter?.querySelector('[data-action="share"]')?.addEventListener('click', () => {
            showShareOptions(memory);
        });
    }

    // Track current filter
    let currentCategoryFilter = 'all';

    /**
     * Show timeline full page view (year-wise categorization)
     */
    function showTimelinePage(memberId, filterCategory = 'all') {
        currentCategoryFilter = filterCategory;
        const widgetData = Storage.getWidgetData(memberId, STORAGE_KEY) || { items: [] };
        const member = Storage.getMembers().find(m => m.id === memberId);

        const allItems = widgetData.items || [];

        // Calculate category counts for filter badges
        const categoryCounts = {};
        CATEGORIES.forEach(cat => { categoryCounts[cat.name] = 0; });
        allItems.forEach(item => {
            if (categoryCounts[item.category] !== undefined) {
                categoryCounts[item.category]++;
            }
        });

        // Filter items based on selected category
        const items = filterCategory === 'all'
            ? allItems
            : allItems.filter(item => item.category === filterCategory);

        const grouped = groupByDate(items);
        const years = Object.keys(grouped).sort((a, b) => b - a);

        const mainContainer = document.querySelector('main');
        if (!mainContainer) return;

        mainContainer.innerHTML = `
            <div class="memory-book-page memory-book-page--enhanced">
                <div class="memory-book-page__hero">
                    <button class="memory-book-page__back" data-action="back">
                        <i data-lucide="arrow-left"></i>
                        Back
                    </button>
                    <div class="memory-book-page__hero-content">
                        <h1 class="memory-book-page__title">
                            <i data-lucide="book-heart"></i>
                            ${member?.name || ''}'s Memory Book
                        </h1>
                        <p class="memory-book-page__subtitle">${allItems.length} ${allItems.length === 1 ? 'memory' : 'memories'} captured</p>
                    </div>
                    <div class="memory-book-page__actions">
                        <button class="btn btn--ghost" data-action="export">
                            <i data-lucide="download"></i>
                            Export
                        </button>
                        <button class="btn btn--primary" data-action="add">
                            <i data-lucide="camera"></i>
                            Add Memory
                        </button>
                    </div>
                </div>

                <!-- Category Filter -->
                ${allItems.length > 0 ? `
                    <div class="memory-filter">
                        <div class="memory-filter__scroll">
                            <button class="memory-filter__chip ${filterCategory === 'all' ? 'memory-filter__chip--active' : ''}"
                                    data-filter="all">
                                <i data-lucide="grid-3x3"></i>
                                All
                                <span class="memory-filter__count">${allItems.length}</span>
                            </button>
                            ${CATEGORIES.filter(cat => categoryCounts[cat.name] > 0).map(cat => `
                                <button class="memory-filter__chip ${filterCategory === cat.name ? 'memory-filter__chip--active' : ''}"
                                        data-filter="${cat.name}"
                                        style="--chip-color: ${cat.color}">
                                    <i data-lucide="${cat.icon}"></i>
                                    ${cat.name}
                                    <span class="memory-filter__count">${categoryCounts[cat.name]}</span>
                                </button>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                <div class="memory-book-page__content">
                    ${items.length === 0 ? `
                        <div class="memory-book-page__empty">
                            ${allItems.length > 0 ? `
                                <i data-lucide="filter-x"></i>
                                <h3>No ${filterCategory} memories</h3>
                                <p>Try selecting a different category</p>
                                <button class="btn btn--primary btn--sm" data-action="clear-filter">
                                    Show All Memories
                                </button>
                            ` : `
                                <div class="memory-empty__illustration">
                                    <div class="memory-empty__book">
                                        <i data-lucide="book-heart"></i>
                                    </div>
                                    <div class="memory-empty__sparkles">
                                        <span class="sparkle sparkle--1">✨</span>
                                        <span class="sparkle sparkle--2">⭐</span>
                                        <span class="sparkle sparkle--3">💫</span>
                                    </div>
                                </div>
                                <h3>No memories yet</h3>
                                <p>Start capturing special moments!</p>
                            `}
                        </div>
                    ` : `
                        <div class="memory-timeline memory-timeline--enhanced">
                            ${years.map(year => `
                                <div class="memory-timeline__year" data-year="${year}">
                                    <div class="memory-timeline__year-header">
                                        <span class="memory-timeline__year-label">${year}</span>
                                        <span class="memory-timeline__year-count">${Object.values(grouped[year]).flat().length} memories</span>
                                    </div>
                                    ${Object.keys(grouped[year]).map(month => `
                                        <div class="memory-timeline__month">
                                            <div class="memory-timeline__month-header">
                                                <span class="memory-timeline__month-label">${month}</span>
                                                <span class="memory-timeline__count">${grouped[year][month].length}</span>
                                            </div>
                                            <div class="memory-timeline__items memory-timeline__items--masonry">
                                                ${grouped[year][month].map(item => `
                                                    <div class="memory-timeline__card memory-timeline__card--enhanced ${item.photo ? 'memory-timeline__card--has-photo' : ''}"
                                                         data-id="${item.id}">
                                                        ${item.photo ? `
                                                            <div class="memory-timeline__card-photo">
                                                                <img src="${item.photo}" alt="${item.title}" loading="lazy">
                                                                <div class="memory-timeline__card-overlay">
                                                                    <span class="memory-timeline__card-badge" style="background-color: ${item.color}">
                                                                        <i data-lucide="${item.icon}"></i>
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ` : `
                                                            <div class="memory-timeline__card-icon-wrap" style="background: linear-gradient(135deg, ${item.color}30 0%, ${item.color}10 100%)">
                                                                <div class="memory-timeline__card-icon" style="background-color: ${item.color}">
                                                                    <i data-lucide="${item.icon || 'star'}"></i>
                                                                </div>
                                                            </div>
                                                        `}
                                                        <div class="memory-timeline__card-content">
                                                            <span class="memory-timeline__card-title">${item.title}</span>
                                                            <div class="memory-timeline__card-meta">
                                                                <span class="memory-timeline__card-category" style="color: ${item.color}">
                                                                    <i data-lucide="${item.icon}" style="width: 12px; height: 12px;"></i>
                                                                    ${item.category}
                                                                </span>
                                                                <span class="memory-timeline__card-date">${DateUtils.formatShort(item.date)}</span>
                                                            </div>
                                                            ${item.notes ? `<p class="memory-timeline__card-notes">${item.notes}</p>` : ''}
                                                        </div>
                                                    </div>
                                                `).join('')}
                                            </div>
                                        </div>
                                    `).join('')}
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

        mainContainer.querySelector('[data-action="add"]')?.addEventListener('click', () => {
            showAddMemoryModal(memberId);
        });

        mainContainer.querySelector('[data-action="export"]')?.addEventListener('click', () => {
            exportMemories(memberId, allItems);
        });

        mainContainer.querySelector('[data-action="clear-filter"]')?.addEventListener('click', () => {
            showTimelinePage(memberId, 'all');
        });

        // Category filter clicks
        mainContainer.querySelectorAll('.memory-filter__chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const category = chip.dataset.filter;
                showTimelinePage(memberId, category);
            });
        });

        // Click on memory card to view details
        mainContainer.querySelectorAll('.memory-timeline__card').forEach(card => {
            card.addEventListener('click', () => {
                const memoryId = card.dataset.id;
                showMemoryDetail(memberId, memoryId);
            });
        });
    }

    /**
     * Group memories by year and month (newest first)
     */
    function groupByDate(items) {
        const grouped = {};
        const monthOrder = ['January', 'February', 'March', 'April', 'May', 'June',
                           'July', 'August', 'September', 'October', 'November', 'December'];

        items.forEach(item => {
            const date = new Date(item.date);
            const year = date.getFullYear();
            const month = date.toLocaleString('default', { month: 'long' });

            if (!grouped[year]) grouped[year] = {};
            if (!grouped[year][month]) grouped[year][month] = [];

            grouped[year][month].push(item);
        });

        // Sort years descending (newest first), months descending (Dec to Jan)
        const result = {};
        const sortedYears = Object.keys(grouped).sort((a, b) => b - a);

        sortedYears.forEach(year => {
            result[year] = {};
            const sortedMonths = Object.keys(grouped[year]).sort((a, b) =>
                monthOrder.indexOf(b) - monthOrder.indexOf(a)
            );
            sortedMonths.forEach(month => {
                // Sort items within month by date (newest first)
                result[year][month] = grouped[year][month].sort((a, b) =>
                    new Date(b.date) - new Date(a.date)
                );
            });
        });

        return result;
    }

    /**
     * Show share options
     */
    function showShareOptions(memory) {
        const content = `
            <div class="share-options">
                <p class="share-options__title">Share "${memory.title}"</p>
                <div class="share-options__buttons">
                    <button class="share-option" data-share="copy">
                        <i data-lucide="link"></i>
                        <span>Copy Text</span>
                    </button>
                    <button class="share-option" data-share="download" ${!memory.photo ? 'disabled' : ''}>
                        <i data-lucide="download"></i>
                        <span>Save Photo</span>
                    </button>
                    <button class="share-option" data-share="native">
                        <i data-lucide="share-2"></i>
                        <span>Share</span>
                    </button>
                </div>
            </div>
        `;

        Modal.open({
            title: 'Share Memory',
            content,
            footer: '<button class="btn btn--primary" data-modal-cancel>Close</button>'
        });

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Use modal content for more specific selectors
        const modalContent = document.getElementById('modalContent');

        // Copy text
        modalContent?.querySelector('[data-share="copy"]')?.addEventListener('click', () => {
            const text = `${memory.title}\n${memory.category} - ${DateUtils.formatLong(memory.date)}${memory.notes ? '\n' + memory.notes : ''}`;
            navigator.clipboard.writeText(text).then(() => {
                Toast.success('Copied to clipboard!');
            });
        });

        // Download photo
        modalContent?.querySelector('[data-share="download"]')?.addEventListener('click', () => {
            if (memory.photo) {
                const link = document.createElement('a');
                link.href = memory.photo;
                link.download = `${memory.title.replace(/[^a-z0-9]/gi, '-')}.jpg`;
                link.click();
                Toast.success('Photo saved!');
            }
        });

        // Native share
        modalContent?.querySelector('[data-share="native"]')?.addEventListener('click', async () => {
            if (navigator.share) {
                try {
                    await navigator.share({
                        title: memory.title,
                        text: `${memory.title} - ${DateUtils.formatLong(memory.date)}${memory.notes ? '\n' + memory.notes : ''}`
                    });
                } catch (err) {
                    if (err.name !== 'AbortError') {
                        Toast.error('Could not share');
                    }
                }
            } else {
                Toast.info('Sharing not supported on this device');
            }
        });
    }

    /**
     * Export memories as printable PDF-style page
     */
    function exportMemories(memberId, items) {
        const member = Storage.getMembers().find(m => m.id === memberId);

        const exportHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>${member?.name || 'Memory'}'s Memory Book</title>
                <style>
                    body { font-family: Georgia, serif; max-width: 800px; margin: 0 auto; padding: 40px; }
                    h1 { text-align: center; color: #EC4899; border-bottom: 2px solid #EC4899; padding-bottom: 20px; }
                    .memory { margin: 30px 0; padding: 20px; border: 1px solid #eee; border-radius: 12px; page-break-inside: avoid; }
                    .memory img { max-width: 100%; border-radius: 8px; margin-bottom: 15px; }
                    .memory h3 { margin: 0 0 5px 0; color: #333; }
                    .memory .meta { color: #888; font-size: 14px; margin-bottom: 10px; }
                    .memory .notes { color: #555; line-height: 1.6; }
                    @media print { .memory { break-inside: avoid; } }
                </style>
            </head>
            <body>
                <h1>${member?.name || 'Memory'}'s Memory Book</h1>
                ${items.map(m => `
                    <div class="memory">
                        ${m.photo ? `<img src="${m.photo}" alt="${m.title}">` : ''}
                        <h3>${m.title}</h3>
                        <div class="meta">${m.category} &bull; ${DateUtils.formatLong(m.date)}</div>
                        ${m.notes ? `<div class="notes">${m.notes}</div>` : ''}
                    </div>
                `).join('')}
            </body>
            </html>
        `;

        const blob = new Blob([exportHtml], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${member?.name || 'memory'}-book.html`;
        link.click();
        URL.revokeObjectURL(url);

        Toast.success('Memory book exported! Open the file and print to PDF.');
    }

    /**
     * Refresh the widget
     */
    function refreshWidget(memberId) {
        const widgetBody = document.getElementById('widget-memory-book');
        if (widgetBody) {
            renderWidget(widgetBody, memberId);
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }
    }

    /**
     * Migrate old accomplishments data to memory-book
     */
    function migrateFromAccomplishments(memberId) {
        const oldData = Storage.getWidgetData(memberId, 'accomplishments');
        if (oldData && oldData.items && oldData.items.length > 0) {
            const newData = Storage.getWidgetData(memberId, STORAGE_KEY) || { items: [] };

            // Only migrate if memory-book is empty
            if (newData.items.length === 0) {
                newData.items = oldData.items.map(item => ({
                    ...item,
                    id: item.id.replace('acc-', 'mem-'),
                    createdAt: item.createdAt || new Date().toISOString()
                }));
                Storage.setWidgetData(memberId, STORAGE_KEY, newData);
                console.log('Migrated accomplishments to memory-book for member:', memberId);
            }
        }
    }

    function init() {
        // Migrate data for all members on init
        const members = Storage.getMembers() || [];
        members.forEach(member => {
            migrateFromAccomplishments(member.id);
        });
    }

    return {
        init,
        renderWidget,
        showTimelinePage
    };
})();
