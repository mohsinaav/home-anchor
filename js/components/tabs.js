/**
 * Tabs Component
 * Tab navigation with avatar system and member management
 */

const Tabs = (function() {
    // DOM elements
    let tabList = null;
    let addTabBtn = null;

    /**
     * Initialize tabs component
     */
    function init() {
        tabList = document.getElementById('tabList');
        addTabBtn = document.getElementById('addTabBtn');

        if (!tabList) return;

        // Render tabs
        render();

        // Add tab button
        addTabBtn?.addEventListener('click', () => {
            showAddMemberModal();
        });

        // Listen for tab changes
        State.subscribe('activeTabChanged', (tabId) => {
            updateActiveState(tabId);
        });
    }

    /**
     * Render all tabs
     */
    function render() {
        const tabs = Storage.getTabs();
        const members = Storage.getMembers();
        const activeTab = State.getActiveTab();

        if (!tabList) return;

        // Render Home tab first
        const homeTab = tabs.find(t => t.id === 'home');
        let html = '';

        if (homeTab) {
            html += `
                <button
                    class="tabs__tab ${homeTab.id === activeTab ? 'tabs__tab--active' : ''}"
                    data-tab-id="${homeTab.id}"
                    title="${homeTab.name}"
                >
                    <div class="tabs__icon">
                        <i data-lucide="home"></i>
                    </div>
                    <span class="tabs__label">${homeTab.name}</span>
                </button>
            `;
        }

        // Render member tabs
        members.forEach(member => {
            const hasPhoto = member.avatar?.type === 'photo' && member.avatar?.photoUrl;
            const avatarHtml = renderTabAvatar(member.avatar);

            // If photo exists, show only the photo (larger); otherwise show initials + name
            const photoOnlyClass = hasPhoto ? 'tabs__tab--photo-only' : '';

            html += `
                <button
                    class="tabs__tab ${member.id === activeTab ? 'tabs__tab--active' : ''} ${photoOnlyClass}"
                    data-tab-id="${member.id}"
                    data-member="true"
                    title="${member.name}"
                >
                    ${avatarHtml}
                    ${!hasPhoto ? `<span class="tabs__label">${member.name}</span>` : ''}
                </button>
            `;
        });

        tabList.innerHTML = html;

        // Re-initialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Bind click events
        bindTabEvents();

        // Show empty state if no members
        if (members.length === 0) {
            showEmptyPrompt();
        }
    }

    /**
     * Render avatar for tab
     */
    function renderTabAvatar(avatar) {
        if (!avatar) {
            return '<div class="tabs__icon"><i data-lucide="user"></i></div>';
        }

        if (avatar.type === 'photo' && avatar.photoUrl) {
            return `
                <div class="tabs__avatar">
                    <img src="${avatar.photoUrl}" alt="Avatar" class="tabs__avatar-img">
                </div>
            `;
        }

        const textColor = AvatarUtils.getContrastColor(avatar.color);
        return `
            <div class="tabs__avatar" style="background-color: ${avatar.color}">
                <span class="tabs__avatar-initials" style="color: ${textColor}">${avatar.initials}</span>
            </div>
        `;
    }

    /**
     * Show empty state prompt
     */
    function showEmptyPrompt() {
        // This will be handled by app.js in the content area
        // Just add a visual indicator on the add button if needed
        if (addTabBtn) {
            addTabBtn.classList.add('tabs__add--pulse');
        }
    }

    /**
     * Bind click events to tabs
     */
    function bindTabEvents() {
        const tabButtons = tabList?.querySelectorAll('.tabs__tab');

        tabButtons?.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabId = btn.dataset.tabId;
                switchTo(tabId);
            });

            // Right-click for context menu (members only)
            if (btn.dataset.member === 'true') {
                btn.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    const memberId = btn.dataset.tabId;
                    const member = Storage.getMember(memberId);

                    if (member) {
                        showMemberContextMenu(e, member);
                    }
                });
            }
        });
    }

    /**
     * Switch to a tab
     */
    function switchTo(tabId) {
        State.setActiveTab(tabId);
        updateActiveState(tabId);

        // Emit event for content update
        State.emit('tabChanged', tabId);
    }

    /**
     * Update active tab visual state
     */
    function updateActiveState(activeTabId) {
        const tabButtons = tabList?.querySelectorAll('.tabs__tab');

        tabButtons?.forEach(btn => {
            if (btn.dataset.tabId === activeTabId) {
                btn.classList.add('tabs__tab--active');
            } else {
                btn.classList.remove('tabs__tab--active');
            }
        });
    }

    /**
     * Show add member modal
     */
    async function showAddMemberModal() {
        // Check PIN first
        const verified = await PIN.verify();
        if (!verified) return;

        // Get widget registry for display
        const registry = Storage.WIDGET_REGISTRY;

        const content = `
            <form id="addMemberForm" class="add-member-form">
                <div class="form-group">
                    <label class="form-label">Name</label>
                    <input type="text" class="form-input" id="memberName" placeholder="e.g., John" required>
                </div>

                <div class="form-group">
                    <label class="form-label">Member Type</label>
                    <div class="member-type-picker" id="memberTypePicker">
                        <button type="button" class="member-type-btn member-type-btn--selected" data-type="adult">
                            <i data-lucide="user"></i>
                            <span>Adult</span>
                        </button>
                        <button type="button" class="member-type-btn" data-type="teen">
                            <i data-lucide="user-round"></i>
                            <span>Teen (13-19)</span>
                        </button>
                        <button type="button" class="member-type-btn" data-type="kid">
                            <i data-lucide="star"></i>
                            <span>Kid (4-12)</span>
                        </button>
                        <button type="button" class="member-type-btn" data-type="toddler">
                            <i data-lucide="baby"></i>
                            <span>Toddler</span>
                        </button>
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">Profile Photo (Optional)</label>
                    <div class="photo-upload" id="photoUpload">
                        <div class="photo-upload__preview" id="photoPreview">
                            <i data-lucide="camera"></i>
                            <span>Click to upload</span>
                        </div>
                        <input type="file" id="photoInput" accept="image/*" hidden>
                        <button type="button" class="photo-upload__remove btn btn--sm btn--ghost" id="removePhoto" style="display: none;">
                            <i data-lucide="x"></i> Remove
                        </button>
                    </div>
                    <p class="form-hint">Photo will be cropped to a square. Initials will be shown if no photo is provided.</p>
                </div>

                <div class="form-group" id="ageGroup" style="display: none;">
                    <label class="form-label">Age</label>
                    <input type="number" class="form-input" id="memberAge" min="4" max="19" value="8">
                </div>

                <div class="form-group">
                    <div class="widget-selection-header">
                        <label class="form-label">Widgets</label>
                        <button type="button" class="btn btn--sm btn--ghost" id="selectAllWidgetsBtn">
                            <i data-lucide="check-square"></i>
                            Select All
                        </button>
                    </div>
                    <p class="form-hint">Choose which widgets to enable for this member:</p>
                    <div class="widget-selection" id="widgetSelection">
                        ${renderWidgetSelection('adult', registry)}
                    </div>
                </div>
            </form>
        `;

        Modal.open({
            title: 'Add Family Member',
            content,
            size: 'md',
            footer: Modal.createFooter('Cancel', 'Add Member')
        });

        // Re-initialize icons in modal
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Setup photo upload
        setupPhotoUpload();

        // Member type picker logic
        let selectedType = 'adult';
        const typeBtns = document.querySelectorAll('.member-type-btn');
        const ageGroup = document.getElementById('ageGroup');
        const widgetSelection = document.getElementById('widgetSelection');

        // Setup Select All button
        const selectAllBtn = document.getElementById('selectAllWidgetsBtn');
        selectAllBtn?.addEventListener('click', () => {
            const checkboxes = widgetSelection.querySelectorAll('input[type="checkbox"]');
            const allChecked = Array.from(checkboxes).every(cb => cb.checked);

            checkboxes.forEach(cb => {
                cb.checked = !allChecked;
            });

            // Update button text
            selectAllBtn.innerHTML = allChecked
                ? '<i data-lucide="check-square"></i> Select All'
                : '<i data-lucide="square"></i> Deselect All';

            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        });

        typeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                typeBtns.forEach(b => b.classList.remove('member-type-btn--selected'));
                btn.classList.add('member-type-btn--selected');
                selectedType = btn.dataset.type;

                // Show/hide age field and update range
                const ageInput = document.getElementById('memberAge');
                if (selectedType === 'kid') {
                    ageGroup.style.display = 'block';
                    ageInput.min = 4;
                    ageInput.max = 12;
                    ageInput.value = 8;
                } else if (selectedType === 'teen') {
                    ageGroup.style.display = 'block';
                    ageInput.min = 13;
                    ageInput.max = 19;
                    ageInput.value = 15;
                } else {
                    ageGroup.style.display = 'none';
                }

                // Update widget selection
                widgetSelection.innerHTML = renderWidgetSelection(selectedType, registry);

                // Reset Select All button text
                selectAllBtn.innerHTML = '<i data-lucide="check-square"></i> Select All';

                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            });
        });

        // Store photo data
        let photoData = null;

        // Listen for photo selection
        document.getElementById('photoInput')?.addEventListener('change', async (e) => {
            const file = e.target.files?.[0];
            if (file) {
                const validation = AvatarUtils.validateImageFile(file);
                if (!validation.valid) {
                    Toast.error(validation.error);
                    return;
                }

                try {
                    photoData = await AvatarUtils.compressImage(file);
                    updatePhotoPreview(photoData);
                } catch (err) {
                    Toast.error('Failed to process image');
                }
            }
        });

        // Remove photo button
        document.getElementById('removePhoto')?.addEventListener('click', () => {
            photoData = null;
            resetPhotoPreview();
            document.getElementById('photoInput').value = '';
        });

        // Bind footer events
        Modal.bindFooterEvents(() => {
            const name = document.getElementById('memberName')?.value?.trim();
            const age = parseInt(document.getElementById('memberAge')?.value) || 8;

            if (!name) {
                Toast.error('Please enter a name');
                return false;
            }

            // Get selected widgets
            const checkboxes = document.querySelectorAll('#widgetSelection input[type="checkbox"]:checked');
            const selectedWidgets = Array.from(checkboxes).map(cb => cb.value);

            // Create member with avatar and selected widgets
            const newMember = Storage.addMember({
                name,
                type: selectedType,
                widgets: selectedWidgets,
                ...((selectedType === 'kid' || selectedType === 'teen') && { age })
            }, photoData);

            if (newMember) {
                render();
                switchTo(newMember.id);
                Toast.success(`${name} has been added!`);
                return true;
            } else {
                Toast.error('Failed to add member');
                return false;
            }
        });
    }

    /**
     * Setup photo upload functionality
     */
    function setupPhotoUpload() {
        const preview = document.getElementById('photoPreview');
        const input = document.getElementById('photoInput');

        preview?.addEventListener('click', () => {
            input?.click();
        });
    }

    /**
     * Update photo preview with uploaded image
     */
    function updatePhotoPreview(photoUrl) {
        const preview = document.getElementById('photoPreview');
        const removeBtn = document.getElementById('removePhoto');

        if (preview) {
            preview.innerHTML = `<img src="${photoUrl}" alt="Preview" class="photo-upload__img">`;
            preview.classList.add('photo-upload__preview--has-photo');
        }

        if (removeBtn) {
            removeBtn.style.display = 'inline-flex';
        }
    }

    /**
     * Reset photo preview to default state
     */
    function resetPhotoPreview() {
        const preview = document.getElementById('photoPreview');
        const removeBtn = document.getElementById('removePhoto');

        if (preview) {
            preview.innerHTML = `
                <i data-lucide="camera"></i>
                <span>Click to upload</span>
            `;
            preview.classList.remove('photo-upload__preview--has-photo');

            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }

        if (removeBtn) {
            removeBtn.style.display = 'none';
        }
    }

    /**
     * Render widget preview for member type
     */
    function renderWidgetPreview(type, registry) {
        const widgets = registry[type] || [];
        const defaultWidgets = widgets.filter(w => w.default);

        if (defaultWidgets.length === 0) {
            return '<p class="text-muted">No default widgets</p>';
        }

        return `
            <div class="widget-tags">
                ${defaultWidgets.map(w => `
                    <span class="widget-tag">
                        <i data-lucide="${w.icon}"></i>
                        ${w.name}
                    </span>
                `).join('')}
            </div>
        `;
    }

    /**
     * Render widget selection checkboxes for member type
     */
    function renderWidgetSelection(type, registry) {
        const widgets = registry[type] || [];

        if (widgets.length === 0) {
            return '<p class="text-muted">No widgets available for this member type</p>';
        }

        return `
            <div class="widget-list widget-list--compact">
                ${widgets.map(widget => `
                    <label class="widget-checkbox">
                        <input type="checkbox" name="widget" value="${widget.id}"
                            ${widget.default ? 'checked' : ''}>
                        <span class="widget-checkbox__content">
                            <i data-lucide="${widget.icon}"></i>
                            <span class="widget-checkbox__name">${widget.name}</span>
                        </span>
                    </label>
                `).join('')}
            </div>
        `;
    }

    /**
     * Show member context menu
     */
    function showMemberContextMenu(event, member) {
        // Remove existing menu
        const existingMenu = document.querySelector('.tab-context-menu');
        existingMenu?.remove();

        const menu = document.createElement('div');
        menu.className = 'tab-context-menu dropdown__menu';
        menu.style.cssText = `
            position: fixed;
            left: ${event.clientX}px;
            top: ${event.clientY}px;
            opacity: 1;
            visibility: visible;
            transform: none;
            z-index: 1000;
        `;

        menu.innerHTML = `
            <button class="dropdown__item" data-action="edit">
                <i data-lucide="edit-2"></i>
                Edit Member
            </button>
            <button class="dropdown__item" data-action="widgets">
                <i data-lucide="layout-grid"></i>
                Manage Widgets
            </button>
            <button class="dropdown__item" data-action="schedule">
                <i data-lucide="calendar-clock"></i>
                Edit Schedule
            </button>
            <div class="dropdown__divider"></div>
            <button class="dropdown__item dropdown__item--danger" data-action="delete">
                <i data-lucide="trash-2"></i>
                Remove Member
            </button>
        `;

        document.body.appendChild(menu);

        // Initialize icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Handle menu actions
        menu.querySelector('[data-action="edit"]')?.addEventListener('click', async () => {
            menu.remove();
            await showEditMemberModal(member);
        });

        menu.querySelector('[data-action="widgets"]')?.addEventListener('click', async () => {
            menu.remove();
            await showManageWidgetsModal(member);
        });

        menu.querySelector('[data-action="schedule"]')?.addEventListener('click', async () => {
            menu.remove();
            // Schedule management will be implemented in Phase 1C
            if (typeof Schedule !== 'undefined' && Schedule.showManageModal) {
                Schedule.showManageModal(member.id);
            } else {
                Toast.info('Schedule management coming soon!');
            }
        });

        menu.querySelector('[data-action="delete"]')?.addEventListener('click', async () => {
            menu.remove();
            await deleteMember(member);
        });

        // Close menu on click outside
        const closeMenu = (e) => {
            if (!menu.contains(e.target)) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        };
        setTimeout(() => document.addEventListener('click', closeMenu), 0);
    }

    /**
     * Show edit member modal
     */
    async function showEditMemberModal(member) {
        const verified = await PIN.verify();
        if (!verified) return;

        const content = `
            <form id="editMemberForm">
                <div class="form-group">
                    <label class="form-label">Name</label>
                    <input type="text" class="form-input" id="editMemberName" value="${member.name}" required>
                </div>

                <div class="form-group">
                    <label class="form-label">Profile Photo</label>
                    <div class="photo-upload" id="photoUpload">
                        <div class="photo-upload__preview ${member.avatar?.photoUrl ? 'photo-upload__preview--has-photo' : ''}" id="photoPreview">
                            ${member.avatar?.type === 'photo' && member.avatar?.photoUrl
                                ? `<img src="${member.avatar.photoUrl}" alt="Preview" class="photo-upload__img">`
                                : `<i data-lucide="camera"></i><span>Click to upload</span>`
                            }
                        </div>
                        <input type="file" id="photoInput" accept="image/*" hidden>
                        <button type="button" class="photo-upload__remove btn btn--sm btn--ghost" id="removePhoto" style="display: ${member.avatar?.photoUrl ? 'inline-flex' : 'none'};">
                            <i data-lucide="x"></i> Remove
                        </button>
                    </div>
                </div>

                ${member.type === 'kid' ? `
                    <div class="form-group">
                        <label class="form-label">Age</label>
                        <input type="number" class="form-input" id="editMemberAge" min="1" max="17" value="${member.age || 8}">
                    </div>
                ` : ''}
            </form>
        `;

        Modal.open({
            title: 'Edit Member',
            content,
            footer: Modal.createFooter('Cancel', 'Save Changes')
        });

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Setup photo upload
        setupPhotoUpload();

        let photoData = member.avatar?.photoUrl || null;
        let photoChanged = false;

        // Listen for photo selection
        document.getElementById('photoInput')?.addEventListener('change', async (e) => {
            const file = e.target.files?.[0];
            if (file) {
                const validation = AvatarUtils.validateImageFile(file);
                if (!validation.valid) {
                    Toast.error(validation.error);
                    return;
                }

                try {
                    photoData = await AvatarUtils.compressImage(file);
                    photoChanged = true;
                    updatePhotoPreview(photoData);
                } catch (err) {
                    Toast.error('Failed to process image');
                }
            }
        });

        // Remove photo button
        document.getElementById('removePhoto')?.addEventListener('click', () => {
            photoData = null;
            photoChanged = true;
            resetPhotoPreview();
            document.getElementById('photoInput').value = '';
        });

        Modal.bindFooterEvents(() => {
            const name = document.getElementById('editMemberName')?.value?.trim();
            const age = document.getElementById('editMemberAge')?.value;

            if (!name) {
                Toast.error('Please enter a name');
                return false;
            }

            // Build updates
            const updates = { name };

            if (member.type === 'kid' && age) {
                updates.age = parseInt(age);
            }

            // Update avatar if photo changed
            if (photoChanged) {
                updates.avatar = AvatarUtils.createAvatar(name, photoData);
            } else if (name !== member.name) {
                // Name changed, update initials but keep photo if exists
                updates.avatar = {
                    ...member.avatar,
                    initials: AvatarUtils.generateInitials(name),
                    color: AvatarUtils.generateColor(name)
                };
            }

            Storage.updateMember(member.id, updates);
            render();
            Toast.success('Member updated');
            return true;
        });
    }

    /**
     * Show manage widgets modal
     */
    async function showManageWidgetsModal(member) {
        const verified = await PIN.verify();
        if (!verified) return;

        const registry = Storage.WIDGET_REGISTRY[member.type] || [];
        const currentWidgets = member.widgets || [];

        const content = `
            <form id="manageWidgetsForm">
                <p class="form-hint mb-4">Select which widgets to show for ${member.name}:</p>
                <div class="widget-list">
                    ${registry.map(widget => `
                        <label class="widget-checkbox">
                            <input type="checkbox" name="widget" value="${widget.id}"
                                ${currentWidgets.includes(widget.id) ? 'checked' : ''}>
                            <span class="widget-checkbox__content">
                                <i data-lucide="${widget.icon}"></i>
                                <span class="widget-checkbox__name">${widget.name}</span>
                            </span>
                        </label>
                    `).join('')}
                </div>
            </form>
        `;

        Modal.open({
            title: `Manage Widgets - ${member.name}`,
            content,
            footer: Modal.createFooter('Cancel', 'Save')
        });

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        Modal.bindFooterEvents(() => {
            const checkboxes = document.querySelectorAll('input[name="widget"]:checked');
            const selectedWidgets = Array.from(checkboxes).map(cb => cb.value);

            Storage.updateMember(member.id, { widgets: selectedWidgets });

            // Refresh current view if viewing this member
            if (State.getActiveTab() === member.id) {
                State.emit('tabChanged', member.id);
            }

            Toast.success('Widgets updated');
            return true;
        });
    }

    /**
     * Delete a member
     */
    async function deleteMember(member) {
        const verified = await PIN.verify();
        if (!verified) return;

        const confirmed = await Modal.dangerConfirm(
            `Are you sure you want to remove ${member.name}? All their data will be permanently deleted.`,
            'Remove Member'
        );

        if (confirmed) {
            Storage.deleteMember(member.id);

            // Switch to home if deleted member was active
            if (State.getActiveTab() === member.id) {
                switchTo('home');
            }

            render();
            Toast.success(`${member.name} has been removed`);
        }
    }

    // Public API
    return {
        init,
        render,
        switchTo
    };
})();
