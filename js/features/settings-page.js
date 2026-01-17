/**
 * Settings Page Feature
 * Full-page settings management with family members, widgets, themes, and data management
 */

const SettingsPage = (function() {
    const PAGE_ID = 'settings';

    // Available theme colors
    const THEME_COLORS = [
        { id: 'indigo', name: 'Indigo', primary: '#6366F1', accent: '#818CF8' },
        { id: 'violet', name: 'Violet', primary: '#8B5CF6', accent: '#A78BFA' },
        { id: 'pink', name: 'Pink', primary: '#EC4899', accent: '#F472B6' },
        { id: 'rose', name: 'Rose', primary: '#F43F5E', accent: '#FB7185' },
        { id: 'orange', name: 'Orange', primary: '#F97316', accent: '#FB923C' },
        { id: 'amber', name: 'Amber', primary: '#F59E0B', accent: '#FBBF24' },
        { id: 'emerald', name: 'Emerald', primary: '#10B981', accent: '#34D399' },
        { id: 'teal', name: 'Teal', primary: '#14B8A6', accent: '#2DD4BF' },
        { id: 'cyan', name: 'Cyan', primary: '#06B6D4', accent: '#22D3EE' },
        { id: 'blue', name: 'Blue', primary: '#3B82F6', accent: '#60A5FA' },
        { id: 'slate', name: 'Slate', primary: '#64748B', accent: '#94A3B8' },
        { id: 'zinc', name: 'Zinc', primary: '#71717A', accent: '#A1A1AA' }
    ];

    /**
     * Render the settings page
     */
    // Track which categories are expanded
    let expandedCategories = {
        family: true,
        appearance: false,
        features: false,
        security: false,
        system: false
    };

    function render(container) {
        const settings = Storage.getSettings();
        const members = Storage.getMembers();
        const kidsAndToddlers = members.filter(m => m.type === 'kid' || m.type === 'toddler');

        container.innerHTML = `
            <div class="settings-page">
                <div class="settings-page__header">
                    <button class="settings-page__back" id="settingsBackBtn">
                        <i data-lucide="arrow-left"></i>
                        <span>Back to Home</span>
                    </button>
                    <h1 class="settings-page__title">
                        <i data-lucide="settings"></i>
                        Settings
                    </h1>
                </div>

                <div class="settings-page__content">
                    <!-- ==================== FAMILY & MEMBERS ==================== -->
                    <div class="settings-category ${expandedCategories.family ? 'settings-category--expanded' : ''}" data-category="family">
                        <button class="settings-category__header" data-toggle-category="family">
                            <div class="settings-category__header-left">
                                <i data-lucide="users"></i>
                                <span>Family & Members</span>
                            </div>
                            <div class="settings-category__header-right">
                                <span class="settings-category__count">${members.length} members</span>
                                <i data-lucide="chevron-down" class="settings-category__chevron"></i>
                            </div>
                        </button>
                        <div class="settings-category__body">
                            <!-- Family Members -->
                            <section class="settings-section" id="memberSettings">
                                <div class="settings-section__header">
                                    <h3 class="settings-section__title">
                                        <i data-lucide="user"></i>
                                        Family Members
                                    </h3>
                                    <button class="btn btn--primary btn--sm" id="addMemberBtn">
                                        <i data-lucide="user-plus"></i>
                                        Add Member
                                    </button>
                                </div>
                                <div class="settings-section__content">
                                    ${renderMembersList(members)}
                                </div>
                            </section>

                            <!-- Widget Management -->
                            <section class="settings-section" id="widgetSettings">
                                <div class="settings-section__header">
                                    <h3 class="settings-section__title">
                                        <i data-lucide="layout-grid"></i>
                                        Widget Management
                                    </h3>
                                </div>
                                <div class="settings-section__content">
                                    ${renderWidgetManagement(members)}
                                </div>
                            </section>

                            <!-- Kids & Toddlers Management -->
                            ${renderKidsManagementSection(members)}
                        </div>
                    </div>

                    <!-- ==================== APPEARANCE & PREFERENCES ==================== -->
                    <div class="settings-category ${expandedCategories.appearance ? 'settings-category--expanded' : ''}" data-category="appearance">
                        <button class="settings-category__header" data-toggle-category="appearance">
                            <div class="settings-category__header-left">
                                <i data-lucide="palette"></i>
                                <span>Appearance & Preferences</span>
                            </div>
                            <div class="settings-category__header-right">
                                <i data-lucide="chevron-down" class="settings-category__chevron"></i>
                            </div>
                        </button>
                        <div class="settings-category__body">
                            <!-- Appearance -->
                            <section class="settings-section" id="appearanceSettings">
                                <div class="settings-section__header">
                                    <h3 class="settings-section__title">
                                        <i data-lucide="sun"></i>
                                        Theme & Colors
                                    </h3>
                                </div>
                                <div class="settings-section__content">
                                    ${renderAppearanceSettings(settings)}
                                </div>
                            </section>

                            <!-- Notifications -->
                            <section class="settings-section" id="notificationSettings">
                                <div class="settings-section__header">
                                    <h3 class="settings-section__title">
                                        <i data-lucide="bell"></i>
                                        Notifications
                                    </h3>
                                </div>
                                <div class="settings-section__content">
                                    ${typeof Notifications !== 'undefined' ? Notifications.renderSettingsPanel() : '<p class="settings-empty">Notifications not available</p>'}
                                </div>
                            </section>
                        </div>
                    </div>

                    <!-- ==================== FEATURES ==================== -->
                    <div class="settings-category ${expandedCategories.features ? 'settings-category--expanded' : ''}" data-category="features">
                        <button class="settings-category__header" data-toggle-category="features">
                            <div class="settings-category__header-left">
                                <i data-lucide="sparkles"></i>
                                <span>Features</span>
                            </div>
                            <div class="settings-category__header-right">
                                <i data-lucide="chevron-down" class="settings-category__chevron"></i>
                            </div>
                        </button>
                        <div class="settings-category__body">
                            <!-- Points Configuration -->
                            <section class="settings-section" id="pointsConfigSettings">
                                <div class="settings-section__header">
                                    <h3 class="settings-section__title">
                                        <i data-lucide="star"></i>
                                        Points Configuration
                                    </h3>
                                </div>
                                <div class="settings-section__content">
                                    ${renderPointsConfigSettings(settings)}
                                </div>
                            </section>

                            <!-- Meal Planning -->
                            <section class="settings-section" id="mealSettings">
                                <div class="settings-section__header">
                                    <h3 class="settings-section__title">
                                        <i data-lucide="utensils"></i>
                                        Meal Planning
                                    </h3>
                                </div>
                                <div class="settings-section__content">
                                    ${renderMealSettings(settings)}
                                </div>
                            </section>
                        </div>
                    </div>

                    <!-- ==================== SECURITY & PRIVACY ==================== -->
                    <div class="settings-category ${expandedCategories.security ? 'settings-category--expanded' : ''}" data-category="security">
                        <button class="settings-category__header" data-toggle-category="security">
                            <div class="settings-category__header-left">
                                <i data-lucide="shield"></i>
                                <span>Security & Privacy</span>
                            </div>
                            <div class="settings-category__header-right">
                                <i data-lucide="chevron-down" class="settings-category__chevron"></i>
                            </div>
                        </button>
                        <div class="settings-category__body">
                            <!-- Security -->
                            <section class="settings-section" id="securitySettings">
                                <div class="settings-section__header">
                                    <h3 class="settings-section__title">
                                        <i data-lucide="lock"></i>
                                        PIN & Access
                                    </h3>
                                </div>
                                <div class="settings-section__content">
                                    ${renderSecuritySettings()}
                                </div>
                            </section>
                        </div>
                    </div>

                    <!-- ==================== HELP & DATA ==================== -->
                    <div class="settings-category ${expandedCategories.system ? 'settings-category--expanded' : ''}" data-category="system">
                        <button class="settings-category__header" data-toggle-category="system">
                            <div class="settings-category__header-left">
                                <i data-lucide="database"></i>
                                <span>Help & Data</span>
                            </div>
                            <div class="settings-category__header-right">
                                <i data-lucide="chevron-down" class="settings-category__chevron"></i>
                            </div>
                        </button>
                        <div class="settings-category__body">
                            <!-- Help & Tutorials -->
                            <section class="settings-section" id="helpSettings">
                                <div class="settings-section__header">
                                    <h3 class="settings-section__title">
                                        <i data-lucide="help-circle"></i>
                                        Help & Tutorials
                                    </h3>
                                </div>
                                <div class="settings-section__content">
                                    ${renderHelpSettings(settings)}
                                </div>
                            </section>

                            <!-- Data Management -->
                            <section class="settings-section" id="dataSettings">
                                <div class="settings-section__header">
                                    <h3 class="settings-section__title">
                                        <i data-lucide="hard-drive"></i>
                                        Data Management
                                    </h3>
                                </div>
                                <div class="settings-section__content">
                                    ${renderDataManagement()}
                                </div>
                            </section>
                        </div>
                    </div>
                </div>

                <input type="file" id="importFileInput" accept=".json" style="display: none;">
            </div>
        `;

        bindEvents(container);

        // Apply current theme color and display mode
        const currentThemeColor = THEME_COLORS.find(t => t.id === (settings.themeColor || 'indigo'));
        if (currentThemeColor) {
            applyThemeColor(currentThemeColor);
        }
        applyDisplayMode(settings.theme || 'light');

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    /**
     * Render family members list
     */
    function renderMembersList(members) {
        if (members.length === 0) {
            return `
                <div class="settings-empty">
                    <i data-lucide="users"></i>
                    <p>No family members yet. Add your first member to get started!</p>
                </div>
            `;
        }

        return `
            <div class="members-grid">
                ${members.map(member => renderMemberCard(member)).join('')}
            </div>
        `;
    }

    /**
     * Render individual member card
     */
    function renderMemberCard(member) {
        const typeLabels = {
            adult: 'Adult',
            kid: 'Kid',
            toddler: 'Toddler'
        };

        const typeIcons = {
            adult: 'user',
            kid: 'smile',
            toddler: 'baby'
        };

        const avatarHtml = renderAvatar(member.avatar, member.name);

        return `
            <div class="member-card" data-member-id="${member.id}">
                <div class="member-card__avatar">
                    ${avatarHtml}
                </div>
                <div class="member-card__info">
                    <h3 class="member-card__name">${member.name}</h3>
                    <span class="member-card__type">
                        <i data-lucide="${typeIcons[member.type]}"></i>
                        ${typeLabels[member.type]}
                    </span>
                </div>
                <div class="member-card__actions">
                    <button class="btn btn--ghost btn--sm edit-member-btn" data-member-id="${member.id}" title="Edit">
                        <i data-lucide="pencil"></i>
                    </button>
                    <button class="btn btn--ghost btn--sm delete-member-btn" data-member-id="${member.id}" title="Delete">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Render avatar
     */
    function renderAvatar(avatar, name) {
        if (!avatar) {
            return `<div class="avatar avatar--placeholder"><i data-lucide="user"></i></div>`;
        }

        if (avatar.type === 'photo' && avatar.photoUrl) {
            return `<img src="${avatar.photoUrl}" alt="${name}" class="avatar avatar--photo">`;
        }

        const textColor = typeof AvatarUtils !== 'undefined'
            ? AvatarUtils.getContrastColor(avatar.color)
            : '#fff';

        return `
            <div class="avatar avatar--initials" style="background-color: ${avatar.color}">
                <span style="color: ${textColor}">${avatar.initials}</span>
            </div>
        `;
    }

    /**
     * Render widget management section
     */
    function renderWidgetManagement(members) {
        if (members.length === 0) {
            return `
                <div class="settings-empty">
                    <i data-lucide="layout-grid"></i>
                    <p>Add family members first to manage their widgets.</p>
                </div>
            `;
        }

        return `
            <div class="widget-management">
                <div class="widget-management__tabs">
                    ${members.map((member, index) => `
                        <button class="widget-tab ${index === 0 ? 'widget-tab--active' : ''}"
                                data-member-id="${member.id}">
                            ${member.name}
                        </button>
                    `).join('')}
                </div>
                <div class="widget-management__content" id="widgetManagementContent">
                    ${members.length > 0 ? renderWidgetsForMember(members[0]) : ''}
                </div>
            </div>
        `;
    }

    /**
     * Render widgets for a specific member
     */
    function renderWidgetsForMember(member) {
        const availableWidgets = Storage.getAvailableWidgets(member.type);
        const enabledWidgets = member.widgets || [];

        return `
            <div class="widgets-list">
                ${availableWidgets.map(widget => {
                    const isEnabled = enabledWidgets.includes(widget.id);
                    return `
                        <div class="widget-toggle-item ${isEnabled ? 'widget-toggle-item--enabled' : ''}"
                             data-widget-id="${widget.id}" data-member-id="${member.id}">
                            <div class="widget-toggle-item__info">
                                <i data-lucide="${widget.icon}" class="widget-toggle-item__icon"></i>
                                <div class="widget-toggle-item__text">
                                    <span class="widget-toggle-item__name">${widget.name}</span>
                                    <span class="widget-toggle-item__desc">${widget.description}</span>
                                </div>
                            </div>
                            <label class="toggle-switch">
                                <input type="checkbox" ${isEnabled ? 'checked' : ''}
                                       data-widget-id="${widget.id}" data-member-id="${member.id}">
                                <span class="toggle-switch__slider"></span>
                            </label>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    /**
     * Render appearance settings
     */
    function renderAppearanceSettings(settings) {
        const currentTheme = settings.themeColor || 'indigo';

        return `
            <div class="appearance-settings">
                <div class="setting-group">
                    <label class="setting-label">Theme Color</label>
                    <div class="theme-colors">
                        ${THEME_COLORS.map(theme => `
                            <button class="theme-color-btn ${theme.id === currentTheme ? 'theme-color-btn--active' : ''}"
                                    data-theme="${theme.id}"
                                    style="--theme-color: ${theme.primary}"
                                    title="${theme.name}">
                                ${theme.id === currentTheme ? '<i data-lucide="check"></i>' : ''}
                            </button>
                        `).join('')}
                    </div>
                </div>

                <div class="setting-group">
                    <label class="setting-label">Display Mode</label>
                    <div class="display-mode-options">
                        <button class="display-mode-btn ${settings.theme === 'light' ? 'display-mode-btn--active' : ''}"
                                data-mode="light">
                            <i data-lucide="sun"></i>
                            <span>Light</span>
                        </button>
                        <button class="display-mode-btn ${settings.theme === 'dark' ? 'display-mode-btn--active' : ''}"
                                data-mode="dark">
                            <i data-lucide="moon"></i>
                            <span>Dark</span>
                        </button>
                        <button class="display-mode-btn ${settings.theme === 'auto' ? 'display-mode-btn--active' : ''}"
                                data-mode="auto">
                            <i data-lucide="monitor"></i>
                            <span>Auto</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render security settings
     */
    function renderSecuritySettings() {
        const settings = Storage.getSettings();
        const allowKidsJournalPassword = settings.allowKidsJournalPassword === true;

        return `
            <div class="security-settings">
                <div class="setting-group">
                    <label class="setting-label">Admin PIN</label>
                    <p class="setting-description">Change the PIN required for accessing settings and admin features.</p>
                    <div class="pin-change-form">
                        <input type="password" id="currentPin" class="form-input"
                               placeholder="Current PIN" maxlength="4" inputmode="numeric">
                        <input type="password" id="newPin" class="form-input"
                               placeholder="New PIN (4 digits)" maxlength="4" inputmode="numeric">
                        <input type="password" id="confirmPin" class="form-input"
                               placeholder="Confirm New PIN" maxlength="4" inputmode="numeric">
                        <button class="btn btn--primary" id="changePinBtn">
                            <i data-lucide="key"></i>
                            Change PIN
                        </button>
                    </div>
                </div>

                <div class="setting-group" style="margin-top: var(--space-6);">
                    <div class="setting-row">
                        <div class="setting-row__info">
                            <label class="setting-label">Allow Kids to Set Journal Password</label>
                            <p class="setting-description">Let kids create their own password for their diary. Teens can always set their own password regardless of this setting.</p>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" id="allowKidsJournalPasswordToggle" ${allowKidsJournalPassword ? 'checked' : ''}>
                            <span class="toggle-switch__slider"></span>
                        </label>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render help and tutorials settings
     */
    function renderMealSettings(settings) {
        const meals = settings.meals || {};
        const kidsMenuEnabled = meals.kidsMenuEnabled === true; // Default to false

        return `
            <div class="meal-settings">
                <div class="setting-group">
                    <div class="setting-row">
                        <div class="setting-row__info">
                            <label class="setting-label">Enable Separate Kids Meals</label>
                            <p class="setting-description">Plan different meals for kids. When enabled, a "Customize for Kids" option appears next to each meal, allowing you to set kid-specific meals.</p>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" id="kidsMenuToggle" ${kidsMenuEnabled ? 'checked' : ''}>
                            <span class="toggle-switch__slider"></span>
                        </label>
                    </div>
                </div>

                <div class="setting-info" style="margin-top: var(--space-4);">
                    <i data-lucide="info"></i>
                    <p>Most families serve the same meals to everyone. Enable this only if you need to plan separate meals for children (e.g., allergies, picky eaters, or different portions).</p>
                </div>
            </div>
        `;
    }

    function renderPointsConfigSettings(settings) {
        const pointsConfig = settings.pointsConfig || {};
        const journalPoints = pointsConfig.journalPoints !== undefined ? pointsConfig.journalPoints : 5;
        const kidTaskPoints = pointsConfig.kidTaskPoints !== undefined ? pointsConfig.kidTaskPoints : 3;
        const teenTaskPoints = pointsConfig.teenTaskPoints !== undefined ? pointsConfig.teenTaskPoints : 5;

        return `
            <div class="points-config-settings">
                <div class="setting-info" style="margin-bottom: var(--space-4);">
                    <i data-lucide="info"></i>
                    <p>Configure how many points are awarded for completing various activities. These points are automatically added to kids' and teens' point balances.</p>
                </div>

                <div class="setting-group">
                    <div class="setting-row">
                        <div class="setting-row__info">
                            <label class="setting-label">Journal Entry Points</label>
                            <p class="setting-description">Points awarded when adults complete a journal entry (for tracking their own points).</p>
                        </div>
                        <input type="number" class="form-input form-input--sm" id="journalPointsInput" value="${journalPoints}" min="0" max="50" style="width: 80px;">
                    </div>

                    <div class="setting-row">
                        <div class="setting-row__info">
                            <label class="setting-label">Kid Task Points</label>
                            <p class="setting-description">Default points awarded when kids complete a task from their task list.</p>
                        </div>
                        <input type="number" class="form-input form-input--sm" id="kidTaskPointsInput" value="${kidTaskPoints}" min="0" max="50" style="width: 80px;">
                    </div>

                    <div class="setting-row">
                        <div class="setting-row__info">
                            <label class="setting-label">Teen Task Points</label>
                            <p class="setting-description">Default points awarded when teens complete a task from their task list.</p>
                        </div>
                        <input type="number" class="form-input form-input--sm" id="teenTaskPointsInput" value="${teenTaskPoints}" min="0" max="50" style="width: 80px;">
                    </div>
                </div>

                <button class="btn btn--primary" id="savePointsConfigBtn" style="margin-top: var(--space-4);">
                    <i data-lucide="save"></i>
                    Save Points Configuration
                </button>
            </div>
        `;
    }

    // =========================================================================
    // KIDS & TODDLERS MANAGEMENT SECTION
    // =========================================================================

    // Track current kid management tab
    let kidsManagementTab = 'points';
    let selectedKidId = null;

    /**
     * Render Kids & Toddlers Management Section
     */
    function renderKidsManagementSection(members) {
        const kidsAndToddlers = members.filter(m => m.type === 'kid' || m.type === 'toddler');

        if (kidsAndToddlers.length === 0) {
            return ''; // Don't show section if no kids/toddlers
        }

        // Default to first kid if none selected
        if (!selectedKidId || !kidsAndToddlers.find(m => m.id === selectedKidId)) {
            selectedKidId = kidsAndToddlers[0].id;
        }

        const selectedMember = Storage.getMember(selectedKidId);

        return `
            <section class="settings-section" id="kidsManagementSettings">
                <div class="settings-section__header">
                    <h2 class="settings-section__title">
                        <i data-lucide="baby"></i>
                        Kids & Toddlers Management
                    </h2>
                </div>
                <div class="settings-section__content">
                    <div class="kids-management">
                        <!-- Child Selector -->
                        <div class="kids-management__selector">
                            <label class="form-label">Select Child</label>
                            <select class="form-input form-select" id="kidsManagementSelector">
                                ${kidsAndToddlers.map(m => `
                                    <option value="${m.id}" ${m.id === selectedKidId ? 'selected' : ''}>
                                        ${m.name} (${m.type === 'toddler' ? 'Toddler' : 'Kid'})
                                    </option>
                                `).join('')}
                            </select>
                        </div>

                        <!-- Sub-tabs -->
                        <div class="kids-management__tabs">
                            <button class="kids-management__tab ${kidsManagementTab === 'points' ? 'kids-management__tab--active' : ''}" data-kids-tab="points">
                                <i data-lucide="star"></i>
                                Points
                            </button>
                            <button class="kids-management__tab ${kidsManagementTab === 'chores' ? 'kids-management__tab--active' : ''}" data-kids-tab="chores">
                                <i data-lucide="check-square"></i>
                                Chores
                            </button>
                            <button class="kids-management__tab ${kidsManagementTab === 'screen-time' ? 'kids-management__tab--active' : ''}" data-kids-tab="screen-time">
                                <i data-lucide="monitor"></i>
                                Screen Time
                            </button>
                            <button class="kids-management__tab ${kidsManagementTab === 'rewards' ? 'kids-management__tab--active' : ''}" data-kids-tab="rewards">
                                <i data-lucide="gift"></i>
                                Rewards
                            </button>
                        </div>

                        <!-- Tab Content -->
                        <div class="kids-management__content" id="kidsManagementContent">
                            ${renderKidsTabContent(selectedKidId, kidsManagementTab)}
                        </div>

                        <!-- Danger Zone -->
                        <div class="kids-management__danger-zone">
                            <h4><i data-lucide="alert-triangle"></i> Danger Zone</h4>
                            <p>Reset all progress for ${selectedMember?.name || 'this child'}. This clears points, chores history, screen time log, and achievements.</p>
                            <button class="btn btn--danger btn--sm" id="resetKidProgressBtn" data-member-id="${selectedKidId}">
                                <i data-lucide="trash-2"></i>
                                Reset All Progress
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        `;
    }

    /**
     * Render tab content based on active tab
     */
    function renderKidsTabContent(memberId, tab) {
        switch (tab) {
            case 'points':
                return renderKidsPointsTab(memberId);
            case 'chores':
                return renderKidsChoresTab(memberId);
            case 'screen-time':
                return renderKidsScreenTimeTab(memberId);
            case 'rewards':
                return renderKidsRewardsTab(memberId);
            default:
                return renderKidsPointsTab(memberId);
        }
    }

    /**
     * Render Points Management Tab
     */
    function renderKidsPointsTab(memberId) {
        const pointsData = Storage.getWidgetData(memberId, 'points') || { balance: 0 };
        const balance = pointsData.balance || 0;

        return `
            <div class="kids-tab-content kids-tab-content--points">
                <div class="kids-points-display">
                    <div class="kids-points-display__balance">
                        <span class="kids-points-display__value">${balance}</span>
                        <span class="kids-points-display__label">Current Points</span>
                    </div>
                    <div class="kids-points-display__quick-adjust">
                        <span class="kids-points-display__adjust-label">Quick Adjust:</span>
                        <div class="kids-points-display__buttons">
                            <button class="btn btn--ghost btn--sm" data-adjust-points="-10">-10</button>
                            <button class="btn btn--ghost btn--sm" data-adjust-points="-5">-5</button>
                            <button class="btn btn--ghost btn--sm" data-adjust-points="-1">-1</button>
                            <button class="btn btn--primary btn--sm" data-adjust-points="1">+1</button>
                            <button class="btn btn--primary btn--sm" data-adjust-points="5">+5</button>
                            <button class="btn btn--primary btn--sm" data-adjust-points="10">+10</button>
                        </div>
                    </div>
                </div>

                <div class="kids-points-manual">
                    <h4>Manual Adjustment</h4>
                    <div class="kids-points-manual__form">
                        <input type="number" class="form-input" id="kidsManualPointsAmount" placeholder="Amount" min="1" max="1000">
                        <input type="text" class="form-input" id="kidsManualPointsReason" placeholder="Reason (optional)">
                        <div class="kids-points-manual__actions">
                            <button class="btn btn--primary btn--sm" id="kidsAddPointsBtn">
                                <i data-lucide="plus"></i> Add
                            </button>
                            <button class="btn btn--ghost btn--sm" id="kidsDeductPointsBtn">
                                <i data-lucide="minus"></i> Deduct
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render Chores Management Tab
     */
    function renderKidsChoresTab(memberId) {
        const choresData = Storage.getWidgetData(memberId, 'chores') || { chorePool: [], choresPerDay: 2 };
        const pool = choresData.chorePool || [];
        const choresPerDay = choresData.choresPerDay || 2;

        return `
            <div class="kids-tab-content kids-tab-content--chores">
                <div class="kids-chores-config">
                    <div class="setting-row">
                        <div class="setting-row__info">
                            <label class="setting-label">Chores Per Day</label>
                            <p class="setting-description">How many random chores to assign each day</p>
                        </div>
                        <div class="kids-chores-config__slider">
                            <input type="range" id="kidsChoresPerDay" min="1" max="5" value="${choresPerDay}">
                            <span id="kidsChoresPerDayValue">${choresPerDay}</span>
                        </div>
                    </div>
                </div>

                <div class="kids-chores-pool">
                    <div class="kids-chores-pool__header">
                        <h4>Chore Pool (${pool.length} chores)</h4>
                        <button class="btn btn--primary btn--sm" id="kidsAddChoreBtn">
                            <i data-lucide="plus"></i> Add Chore
                        </button>
                    </div>
                    ${pool.length === 0 ? `
                        <p class="kids-chores-pool__empty">No chores in pool yet. Add some chores to get started!</p>
                    ` : `
                        <div class="kids-chores-pool__list">
                            ${pool.map(chore => `
                                <div class="kids-chore-item" data-chore-id="${chore.id}">
                                    <div class="kids-chore-item__icon">
                                        <i data-lucide="${chore.icon || 'check-square'}"></i>
                                    </div>
                                    <div class="kids-chore-item__info">
                                        <span class="kids-chore-item__name">${chore.name}</span>
                                        <span class="kids-chore-item__points">
                                            <i data-lucide="star"></i> ${chore.points} pts
                                        </span>
                                    </div>
                                    <div class="kids-chore-item__actions">
                                        <button class="btn btn--ghost btn--sm" data-edit-chore="${chore.id}" title="Edit">
                                            <i data-lucide="pencil"></i>
                                        </button>
                                        <button class="btn btn--ghost btn--sm" data-delete-chore="${chore.id}" title="Delete">
                                            <i data-lucide="trash-2"></i>
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>

                <div class="kids-chores-actions">
                    <button class="btn btn--ghost btn--sm" id="kidsResetTodayChoresBtn">
                        <i data-lucide="refresh-cw"></i> Reset Today's Chores
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Render Screen Time Management Tab
     */
    function renderKidsScreenTimeTab(memberId) {
        const screenData = Storage.getWidgetData(memberId, 'screen-time') || { weekdayLimit: 120, weekendLimit: 180 };
        const weekdayLimit = screenData.weekdayLimit || 120;
        const weekendLimit = screenData.weekendLimit || 180;

        const formatMinutes = (mins) => {
            if (mins >= 60) {
                const hrs = Math.floor(mins / 60);
                const remainMins = mins % 60;
                return remainMins > 0 ? `${hrs}h ${remainMins}m` : `${hrs}h`;
            }
            return `${mins}m`;
        };

        return `
            <div class="kids-tab-content kids-tab-content--screen-time">
                <div class="kids-screen-time-limits">
                    <div class="kids-screen-time-limit">
                        <label class="setting-label">
                            <i data-lucide="briefcase"></i> Weekday Limit (Mon-Fri)
                        </label>
                        <div class="kids-screen-time-limit__control">
                            <input type="range" id="kidsWeekdayLimit" min="0" max="240" step="15" value="${weekdayLimit}">
                            <span id="kidsWeekdayLimitValue">${formatMinutes(weekdayLimit)}</span>
                        </div>
                    </div>

                    <div class="kids-screen-time-limit">
                        <label class="setting-label">
                            <i data-lucide="sun"></i> Weekend Limit (Sat-Sun)
                        </label>
                        <div class="kids-screen-time-limit__control">
                            <input type="range" id="kidsWeekendLimit" min="0" max="360" step="15" value="${weekendLimit}">
                            <span id="kidsWeekendLimitValue">${formatMinutes(weekendLimit)}</span>
                        </div>
                    </div>
                </div>

                <div class="kids-screen-time-presets">
                    <span class="kids-screen-time-presets__label">Quick Presets (both days):</span>
                    <div class="kids-screen-time-presets__buttons">
                        <button class="btn btn--ghost btn--sm" data-screen-preset="30">30m</button>
                        <button class="btn btn--ghost btn--sm" data-screen-preset="60">1h</button>
                        <button class="btn btn--ghost btn--sm" data-screen-preset="120">2h</button>
                        <button class="btn btn--ghost btn--sm" data-screen-preset="180">3h</button>
                    </div>
                </div>

                <div class="kids-screen-time-actions">
                    <button class="btn btn--primary" id="kidsSaveScreenTimeLimitsBtn">
                        <i data-lucide="save"></i> Save Limits
                    </button>
                    <button class="btn btn--ghost" id="kidsResetScreenTimeLogBtn">
                        <i data-lucide="trash-2"></i> Clear Usage History
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Render Rewards Management Tab
     */
    function renderKidsRewardsTab(memberId) {
        const rewardsData = Storage.getWidgetData(memberId, 'rewards') || { rewards: [] };
        const rewards = rewardsData.rewards || [];

        return `
            <div class="kids-tab-content kids-tab-content--rewards">
                <div class="kids-rewards-list">
                    <div class="kids-rewards-list__header">
                        <h4>Available Rewards (${rewards.length})</h4>
                        <button class="btn btn--primary btn--sm" id="kidsAddRewardBtn">
                            <i data-lucide="plus"></i> Add Reward
                        </button>
                    </div>
                    ${rewards.length === 0 ? `
                        <p class="kids-rewards-list__empty">No rewards yet. Add some rewards for the child to redeem!</p>
                    ` : `
                        <div class="kids-rewards-grid">
                            ${rewards.map(reward => `
                                <div class="kids-reward-item" data-reward-id="${reward.id}" style="--reward-color: ${reward.color || '#3B82F6'}">
                                    <div class="kids-reward-item__icon" style="background-color: ${reward.color || '#3B82F6'}">
                                        <i data-lucide="${reward.icon || 'gift'}"></i>
                                    </div>
                                    <div class="kids-reward-item__info">
                                        <span class="kids-reward-item__name">${reward.name}</span>
                                        <span class="kids-reward-item__cost">
                                            <i data-lucide="star"></i> ${reward.cost} pts
                                        </span>
                                    </div>
                                    <div class="kids-reward-item__actions">
                                        <button class="btn btn--ghost btn--sm" data-edit-reward="${reward.id}" title="Edit">
                                            <i data-lucide="pencil"></i>
                                        </button>
                                        <button class="btn btn--ghost btn--sm" data-delete-reward="${reward.id}" title="Delete">
                                            <i data-lucide="trash-2"></i>
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>
            </div>
        `;
    }

    /**
     * Bind Kids Management Events
     */
    function bindKidsManagementEvents(container) {
        // Child selector change
        container.querySelector('#kidsManagementSelector')?.addEventListener('change', (e) => {
            selectedKidId = e.target.value;
            refreshKidsManagementSection(container);
        });

        // Tab switching
        container.querySelectorAll('.kids-management__tab').forEach(tab => {
            tab.addEventListener('click', () => {
                kidsManagementTab = tab.dataset.kidsTab;
                refreshKidsManagementSection(container);
            });
        });

        // Points quick adjust
        container.querySelectorAll('[data-adjust-points]').forEach(btn => {
            btn.addEventListener('click', () => {
                const amount = parseInt(btn.dataset.adjustPoints);
                adjustKidPoints(selectedKidId, amount);
                refreshKidsManagementSection(container);
            });
        });

        // Points manual add
        container.querySelector('#kidsAddPointsBtn')?.addEventListener('click', () => {
            const amount = parseInt(container.querySelector('#kidsManualPointsAmount')?.value) || 0;
            const reason = container.querySelector('#kidsManualPointsReason')?.value || 'Manual adjustment';
            if (amount > 0) {
                adjustKidPoints(selectedKidId, amount, reason);
                container.querySelector('#kidsManualPointsAmount').value = '';
                container.querySelector('#kidsManualPointsReason').value = '';
                refreshKidsManagementSection(container);
            } else {
                Toast.error('Please enter a valid amount');
            }
        });

        // Points manual deduct
        container.querySelector('#kidsDeductPointsBtn')?.addEventListener('click', () => {
            const amount = parseInt(container.querySelector('#kidsManualPointsAmount')?.value) || 0;
            const reason = container.querySelector('#kidsManualPointsReason')?.value || 'Manual deduction';
            if (amount > 0) {
                adjustKidPoints(selectedKidId, -amount, reason);
                container.querySelector('#kidsManualPointsAmount').value = '';
                container.querySelector('#kidsManualPointsReason').value = '';
                refreshKidsManagementSection(container);
            } else {
                Toast.error('Please enter a valid amount');
            }
        });

        // Chores per day slider
        container.querySelector('#kidsChoresPerDay')?.addEventListener('input', (e) => {
            container.querySelector('#kidsChoresPerDayValue').textContent = e.target.value;
        });

        container.querySelector('#kidsChoresPerDay')?.addEventListener('change', (e) => {
            const choresData = Storage.getWidgetData(selectedKidId, 'chores') || {};
            choresData.choresPerDay = parseInt(e.target.value);
            Storage.setWidgetData(selectedKidId, 'chores', choresData);
            Toast.success('Chores per day updated');
        });

        // Add chore button
        container.querySelector('#kidsAddChoreBtn')?.addEventListener('click', () => {
            showAddChoreModal(selectedKidId, container);
        });

        // Edit/delete chore buttons
        container.querySelectorAll('[data-edit-chore]').forEach(btn => {
            btn.addEventListener('click', () => {
                showEditChoreModal(selectedKidId, btn.dataset.editChore, container);
            });
        });

        container.querySelectorAll('[data-delete-chore]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const confirmed = await Modal.confirm('Are you sure you want to delete this chore?', 'Delete Chore');
                if (confirmed) {
                    deleteChore(selectedKidId, btn.dataset.deleteChore);
                    refreshKidsManagementSection(container);
                }
            });
        });

        // Reset today's chores
        container.querySelector('#kidsResetTodayChoresBtn')?.addEventListener('click', async () => {
            const confirmed = await Modal.confirm('Reset today\'s assigned chores? New random chores will be picked.', 'Reset Chores');
            if (confirmed) {
                const choresData = Storage.getWidgetData(selectedKidId, 'chores') || {};
                const today = typeof DateUtils !== 'undefined' ? DateUtils.today() : new Date().toISOString().split('T')[0];
                if (choresData.dailyChores) {
                    delete choresData.dailyChores[today];
                }
                Storage.setWidgetData(selectedKidId, 'chores', choresData);
                Toast.success('Today\'s chores reset');
            }
        });

        // Screen time sliders
        const formatMinutes = (mins) => {
            if (mins >= 60) {
                const hrs = Math.floor(mins / 60);
                const remainMins = mins % 60;
                return remainMins > 0 ? `${hrs}h ${remainMins}m` : `${hrs}h`;
            }
            return `${mins}m`;
        };

        container.querySelector('#kidsWeekdayLimit')?.addEventListener('input', (e) => {
            container.querySelector('#kidsWeekdayLimitValue').textContent = formatMinutes(parseInt(e.target.value));
        });

        container.querySelector('#kidsWeekendLimit')?.addEventListener('input', (e) => {
            container.querySelector('#kidsWeekendLimitValue').textContent = formatMinutes(parseInt(e.target.value));
        });

        // Screen time presets
        container.querySelectorAll('[data-screen-preset]').forEach(btn => {
            btn.addEventListener('click', () => {
                const preset = parseInt(btn.dataset.screenPreset);
                container.querySelector('#kidsWeekdayLimit').value = preset;
                container.querySelector('#kidsWeekendLimit').value = preset;
                container.querySelector('#kidsWeekdayLimitValue').textContent = formatMinutes(preset);
                container.querySelector('#kidsWeekendLimitValue').textContent = formatMinutes(preset);
            });
        });

        // Save screen time limits
        container.querySelector('#kidsSaveScreenTimeLimitsBtn')?.addEventListener('click', () => {
            const weekdayLimit = parseInt(container.querySelector('#kidsWeekdayLimit')?.value) || 120;
            const weekendLimit = parseInt(container.querySelector('#kidsWeekendLimit')?.value) || 180;
            const screenData = Storage.getWidgetData(selectedKidId, 'screen-time') || {};
            screenData.weekdayLimit = weekdayLimit;
            screenData.weekendLimit = weekendLimit;
            Storage.setWidgetData(selectedKidId, 'screen-time', screenData);
            Toast.success('Screen time limits saved');
        });

        // Clear screen time history
        container.querySelector('#kidsResetScreenTimeLogBtn')?.addEventListener('click', async () => {
            const confirmed = await Modal.dangerConfirm('Clear all screen time usage history?', 'Clear History');
            if (confirmed) {
                const screenData = Storage.getWidgetData(selectedKidId, 'screen-time') || {};
                screenData.log = {};
                Storage.setWidgetData(selectedKidId, 'screen-time', screenData);
                Toast.success('Screen time history cleared');
            }
        });

        // Add reward button
        container.querySelector('#kidsAddRewardBtn')?.addEventListener('click', () => {
            showAddRewardModal(selectedKidId, container);
        });

        // Edit/delete reward buttons
        container.querySelectorAll('[data-edit-reward]').forEach(btn => {
            btn.addEventListener('click', () => {
                showEditRewardModal(selectedKidId, btn.dataset.editReward, container);
            });
        });

        container.querySelectorAll('[data-delete-reward]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const confirmed = await Modal.confirm('Are you sure you want to delete this reward?', 'Delete Reward');
                if (confirmed) {
                    deleteReward(selectedKidId, btn.dataset.deleteReward);
                    refreshKidsManagementSection(container);
                }
            });
        });

        // Reset all progress
        container.querySelector('#resetKidProgressBtn')?.addEventListener('click', async () => {
            const member = Storage.getMember(selectedKidId);
            const confirmed = await Modal.dangerConfirm(
                `This will reset ALL progress for ${member?.name || 'this child'}: points, chores history, screen time log, and achievements. This cannot be undone!`,
                'Reset All Progress'
            );
            if (confirmed) {
                resetKidProgress(selectedKidId);
                refreshKidsManagementSection(container);
            }
        });
    }

    /**
     * Refresh the kids management section
     */
    function refreshKidsManagementSection(container) {
        const members = Storage.getMembers();
        const section = container.querySelector('#kidsManagementSettings');
        if (section) {
            section.outerHTML = renderKidsManagementSection(members);
            bindKidsManagementEvents(container);
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }
    }

    /**
     * Adjust kid's points
     */
    function adjustKidPoints(memberId, amount, reason = 'Manual adjustment') {
        const pointsData = Storage.getWidgetData(memberId, 'points') || { balance: 0, history: [] };
        const newBalance = Math.max(0, (pointsData.balance || 0) + amount);
        const today = typeof DateUtils !== 'undefined' ? DateUtils.today() : new Date().toISOString().split('T')[0];

        pointsData.balance = newBalance;
        pointsData.history = [
            {
                activityId: `manual-${Date.now()}`,
                activityName: reason,
                date: today,
                points: Math.abs(amount),
                type: amount > 0 ? 'earned' : 'deducted'
            },
            ...(pointsData.history || []).slice(0, 99)
        ];

        Storage.setWidgetData(memberId, 'points', pointsData);
        Toast.success(`${amount > 0 ? '+' : ''}${amount} points`);
    }

    /**
     * Delete a chore
     */
    function deleteChore(memberId, choreId) {
        const choresData = Storage.getWidgetData(memberId, 'chores') || { chorePool: [] };
        choresData.chorePool = (choresData.chorePool || []).filter(c => c.id !== choreId);
        Storage.setWidgetData(memberId, 'chores', choresData);
        Toast.success('Chore deleted');
    }

    /**
     * Delete a reward
     */
    function deleteReward(memberId, rewardId) {
        const rewardsData = Storage.getWidgetData(memberId, 'rewards') || { rewards: [] };
        rewardsData.rewards = (rewardsData.rewards || []).filter(r => r.id !== rewardId);
        // Also remove from wishlist if present
        if (rewardsData.wishlist) {
            rewardsData.wishlist = rewardsData.wishlist.filter(id => id !== rewardId);
        }
        Storage.setWidgetData(memberId, 'rewards', rewardsData);
        Toast.success('Reward deleted');
    }

    /**
     * Reset all progress for a kid
     */
    function resetKidProgress(memberId) {
        // Reset points
        Storage.setWidgetData(memberId, 'points', { balance: 0, history: [] });

        // Reset chores (keep pool, clear history)
        const choresData = Storage.getWidgetData(memberId, 'chores') || {};
        choresData.dailyChores = {};
        choresData.completedToday = [];
        Storage.setWidgetData(memberId, 'chores', choresData);

        // Reset screen time (keep limits, clear log)
        const screenData = Storage.getWidgetData(memberId, 'screen-time') || {};
        screenData.log = {};
        Storage.setWidgetData(memberId, 'screen-time', screenData);

        // Reset achievements
        Storage.setWidgetData(memberId, 'achievements', {
            earned: [],
            totalPointsEarned: 0,
            currentStreak: 0,
            activitiesCompleted: 0,
            rewardsRedeemed: 0
        });

        // Keep rewards, clear redeemed history
        const rewardsData = Storage.getWidgetData(memberId, 'rewards') || {};
        rewardsData.redeemed = [];
        Storage.setWidgetData(memberId, 'rewards', rewardsData);

        Toast.success('All progress has been reset');
    }

    /**
     * Show Add Chore Modal
     */
    function showAddChoreModal(memberId, container) {
        const choreIcons = ['bed', 'home', 'utensils', 'heart', 'trash', 'sparkles', 'flower-2', 'box', 'shirt', 'droplets', 'broom', 'dog', 'cat', 'leaf', 'sun'];

        const content = `
            <form id="addChoreForm">
                <div class="form-group">
                    <label class="form-label">Chore Name</label>
                    <input type="text" class="form-input" id="choreNameInput" placeholder="e.g., Make bed" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Points</label>
                    <input type="number" class="form-input" id="chorePointsInput" value="5" min="1" max="100">
                </div>
                <div class="form-group">
                    <label class="form-label">Icon</label>
                    <div class="icon-selector">
                        ${choreIcons.map((icon, i) => `
                            <button type="button" class="icon-selector__btn ${i === 0 ? 'icon-selector__btn--active' : ''}" data-icon="${icon}">
                                <i data-lucide="${icon}"></i>
                            </button>
                        `).join('')}
                    </div>
                    <input type="hidden" id="choreIconInput" value="${choreIcons[0]}">
                </div>
            </form>
        `;

        Modal.open({
            title: 'Add Chore',
            content,
            footer: Modal.createFooter('Cancel', 'Add Chore')
        });

        if (typeof lucide !== 'undefined') lucide.createIcons();

        // Icon selection
        document.querySelectorAll('.icon-selector__btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.icon-selector__btn').forEach(b => b.classList.remove('icon-selector__btn--active'));
                btn.classList.add('icon-selector__btn--active');
                document.getElementById('choreIconInput').value = btn.dataset.icon;
            });
        });

        Modal.bindFooterEvents(() => {
            const name = document.getElementById('choreNameInput')?.value.trim();
            const points = parseInt(document.getElementById('chorePointsInput')?.value) || 5;
            const icon = document.getElementById('choreIconInput')?.value || 'check-square';

            if (!name) {
                Toast.error('Please enter a chore name');
                return false;
            }

            const choresData = Storage.getWidgetData(memberId, 'chores') || { chorePool: [] };
            choresData.chorePool = choresData.chorePool || [];
            choresData.chorePool.push({
                id: `chore-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                name,
                points,
                icon
            });
            Storage.setWidgetData(memberId, 'chores', choresData);
            Toast.success('Chore added');
            refreshKidsManagementSection(container);
            return true;
        });
    }

    /**
     * Show Edit Chore Modal
     */
    function showEditChoreModal(memberId, choreId, container) {
        const choresData = Storage.getWidgetData(memberId, 'chores') || { chorePool: [] };
        const chore = (choresData.chorePool || []).find(c => c.id === choreId);
        if (!chore) return;

        const choreIcons = ['bed', 'home', 'utensils', 'heart', 'trash', 'sparkles', 'flower-2', 'box', 'shirt', 'droplets', 'broom', 'dog', 'cat', 'leaf', 'sun'];

        const content = `
            <form id="editChoreForm">
                <div class="form-group">
                    <label class="form-label">Chore Name</label>
                    <input type="text" class="form-input" id="choreNameInput" value="${chore.name}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Points</label>
                    <input type="number" class="form-input" id="chorePointsInput" value="${chore.points}" min="1" max="100">
                </div>
                <div class="form-group">
                    <label class="form-label">Icon</label>
                    <div class="icon-selector">
                        ${choreIcons.map(icon => `
                            <button type="button" class="icon-selector__btn ${icon === chore.icon ? 'icon-selector__btn--active' : ''}" data-icon="${icon}">
                                <i data-lucide="${icon}"></i>
                            </button>
                        `).join('')}
                    </div>
                    <input type="hidden" id="choreIconInput" value="${chore.icon || 'check-square'}">
                </div>
            </form>
        `;

        Modal.open({
            title: 'Edit Chore',
            content,
            footer: Modal.createFooter('Cancel', 'Save Changes')
        });

        if (typeof lucide !== 'undefined') lucide.createIcons();

        document.querySelectorAll('.icon-selector__btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.icon-selector__btn').forEach(b => b.classList.remove('icon-selector__btn--active'));
                btn.classList.add('icon-selector__btn--active');
                document.getElementById('choreIconInput').value = btn.dataset.icon;
            });
        });

        Modal.bindFooterEvents(() => {
            const name = document.getElementById('choreNameInput')?.value.trim();
            const points = parseInt(document.getElementById('chorePointsInput')?.value) || 5;
            const icon = document.getElementById('choreIconInput')?.value || 'check-square';

            if (!name) {
                Toast.error('Please enter a chore name');
                return false;
            }

            const index = choresData.chorePool.findIndex(c => c.id === choreId);
            if (index !== -1) {
                choresData.chorePool[index] = { ...choresData.chorePool[index], name, points, icon };
                Storage.setWidgetData(memberId, 'chores', choresData);
                Toast.success('Chore updated');
                refreshKidsManagementSection(container);
            }
            return true;
        });
    }

    /**
     * Show Add Reward Modal
     */
    function showAddRewardModal(memberId, container) {
        const rewardIcons = ['monitor', 'utensils', 'moon', 'ice-cream-cone', 'film', 'gamepad-2', 'gift', 'pizza', 'candy', 'music', 'party-popper', 'cake', 'shopping-bag', 'bike', 'star'];
        const rewardColors = ['#3B82F6', '#10B981', '#8B5CF6', '#EF4444', '#EC4899', '#F59E0B'];

        const content = `
            <form id="addRewardForm">
                <div class="form-group">
                    <label class="form-label">Reward Name</label>
                    <input type="text" class="form-input" id="rewardNameInput" placeholder="e.g., 30 min screen time" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Cost (Points)</label>
                    <input type="number" class="form-input" id="rewardCostInput" value="20" min="1" max="1000">
                </div>
                <div class="form-group">
                    <label class="form-label">Icon</label>
                    <div class="icon-selector">
                        ${rewardIcons.map((icon, i) => `
                            <button type="button" class="icon-selector__btn ${i === 0 ? 'icon-selector__btn--active' : ''}" data-icon="${icon}">
                                <i data-lucide="${icon}"></i>
                            </button>
                        `).join('')}
                    </div>
                    <input type="hidden" id="rewardIconInput" value="${rewardIcons[0]}">
                </div>
                <div class="form-group">
                    <label class="form-label">Color</label>
                    <div class="color-selector">
                        ${rewardColors.map((color, i) => `
                            <button type="button" class="color-selector__btn ${i === 0 ? 'color-selector__btn--active' : ''}"
                                    data-color="${color}" style="background-color: ${color}">
                            </button>
                        `).join('')}
                    </div>
                    <input type="hidden" id="rewardColorInput" value="${rewardColors[0]}">
                </div>
            </form>
        `;

        Modal.open({
            title: 'Add Reward',
            content,
            footer: Modal.createFooter('Cancel', 'Add Reward')
        });

        if (typeof lucide !== 'undefined') lucide.createIcons();

        // Icon selection
        document.querySelectorAll('.icon-selector__btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.icon-selector__btn').forEach(b => b.classList.remove('icon-selector__btn--active'));
                btn.classList.add('icon-selector__btn--active');
                document.getElementById('rewardIconInput').value = btn.dataset.icon;
            });
        });

        // Color selection
        document.querySelectorAll('.color-selector__btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.color-selector__btn').forEach(b => b.classList.remove('color-selector__btn--active'));
                btn.classList.add('color-selector__btn--active');
                document.getElementById('rewardColorInput').value = btn.dataset.color;
            });
        });

        Modal.bindFooterEvents(() => {
            const name = document.getElementById('rewardNameInput')?.value.trim();
            const cost = parseInt(document.getElementById('rewardCostInput')?.value) || 20;
            const icon = document.getElementById('rewardIconInput')?.value || 'gift';
            const color = document.getElementById('rewardColorInput')?.value || '#3B82F6';

            if (!name) {
                Toast.error('Please enter a reward name');
                return false;
            }

            const rewardsData = Storage.getWidgetData(memberId, 'rewards') || { rewards: [] };
            rewardsData.rewards = rewardsData.rewards || [];
            rewardsData.rewards.push({
                id: `reward-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                name,
                cost,
                icon,
                color
            });
            Storage.setWidgetData(memberId, 'rewards', rewardsData);
            Toast.success('Reward added');
            refreshKidsManagementSection(container);
            return true;
        });
    }

    /**
     * Show Edit Reward Modal
     */
    function showEditRewardModal(memberId, rewardId, container) {
        const rewardsData = Storage.getWidgetData(memberId, 'rewards') || { rewards: [] };
        const reward = (rewardsData.rewards || []).find(r => r.id === rewardId);
        if (!reward) return;

        const rewardIcons = ['monitor', 'utensils', 'moon', 'ice-cream-cone', 'film', 'gamepad-2', 'gift', 'pizza', 'candy', 'music', 'party-popper', 'cake', 'shopping-bag', 'bike', 'star'];
        const rewardColors = ['#3B82F6', '#10B981', '#8B5CF6', '#EF4444', '#EC4899', '#F59E0B'];

        const content = `
            <form id="editRewardForm">
                <div class="form-group">
                    <label class="form-label">Reward Name</label>
                    <input type="text" class="form-input" id="rewardNameInput" value="${reward.name}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Cost (Points)</label>
                    <input type="number" class="form-input" id="rewardCostInput" value="${reward.cost}" min="1" max="1000">
                </div>
                <div class="form-group">
                    <label class="form-label">Icon</label>
                    <div class="icon-selector">
                        ${rewardIcons.map(icon => `
                            <button type="button" class="icon-selector__btn ${icon === reward.icon ? 'icon-selector__btn--active' : ''}" data-icon="${icon}">
                                <i data-lucide="${icon}"></i>
                            </button>
                        `).join('')}
                    </div>
                    <input type="hidden" id="rewardIconInput" value="${reward.icon || 'gift'}">
                </div>
                <div class="form-group">
                    <label class="form-label">Color</label>
                    <div class="color-selector">
                        ${rewardColors.map(color => `
                            <button type="button" class="color-selector__btn ${color === reward.color ? 'color-selector__btn--active' : ''}"
                                    data-color="${color}" style="background-color: ${color}">
                            </button>
                        `).join('')}
                    </div>
                    <input type="hidden" id="rewardColorInput" value="${reward.color || '#3B82F6'}">
                </div>
            </form>
        `;

        Modal.open({
            title: 'Edit Reward',
            content,
            footer: Modal.createFooter('Cancel', 'Save Changes')
        });

        if (typeof lucide !== 'undefined') lucide.createIcons();

        document.querySelectorAll('.icon-selector__btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.icon-selector__btn').forEach(b => b.classList.remove('icon-selector__btn--active'));
                btn.classList.add('icon-selector__btn--active');
                document.getElementById('rewardIconInput').value = btn.dataset.icon;
            });
        });

        document.querySelectorAll('.color-selector__btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.color-selector__btn').forEach(b => b.classList.remove('color-selector__btn--active'));
                btn.classList.add('color-selector__btn--active');
                document.getElementById('rewardColorInput').value = btn.dataset.color;
            });
        });

        Modal.bindFooterEvents(() => {
            const name = document.getElementById('rewardNameInput')?.value.trim();
            const cost = parseInt(document.getElementById('rewardCostInput')?.value) || 20;
            const icon = document.getElementById('rewardIconInput')?.value || 'gift';
            const color = document.getElementById('rewardColorInput')?.value || '#3B82F6';

            if (!name) {
                Toast.error('Please enter a reward name');
                return false;
            }

            const index = rewardsData.rewards.findIndex(r => r.id === rewardId);
            if (index !== -1) {
                rewardsData.rewards[index] = { ...rewardsData.rewards[index], name, cost, icon, color };
                Storage.setWidgetData(memberId, 'rewards', rewardsData);
                Toast.success('Reward updated');
                refreshKidsManagementSection(container);
            }
            return true;
        });
    }

    function renderHelpSettings(settings) {
        const onboarding = settings.onboarding || {};
        const showTips = !onboarding.skipAllTours;

        return `
            <div class="help-settings">
                <div class="data-actions">
                    <div class="data-action-card">
                        <div class="data-action-card__icon">
                            <i data-lucide="play-circle"></i>
                        </div>
                        <div class="data-action-card__content">
                            <h4>Welcome Tour</h4>
                            <p>Take a guided tour of Home Anchor's main features and navigation.</p>
                            <button class="btn btn--secondary" id="replayWelcomeTourBtn">
                                <i data-lucide="refresh-cw"></i>
                                Replay Welcome Tour
                            </button>
                        </div>
                    </div>

                    <div class="data-action-card">
                        <div class="data-action-card__icon">
                            <i data-lucide="users"></i>
                        </div>
                        <div class="data-action-card__content">
                            <h4>Member Tours</h4>
                            <p>Learn about the different dashboard types and their features.</p>
                            <div style="display: flex; gap: var(--space-2); flex-wrap: wrap; margin-top: var(--space-2);">
                                <button class="btn btn--ghost btn--sm" id="tourAdultBtn">
                                    <i data-lucide="user"></i> Adult
                                </button>
                                <button class="btn btn--ghost btn--sm" id="tourKidBtn">
                                    <i data-lucide="smile"></i> Kid
                                </button>
                                <button class="btn btn--ghost btn--sm" id="tourToddlerBtn">
                                    <i data-lucide="baby"></i> Toddler
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="setting-group" style="margin-top: var(--space-4);">
                        <div class="setting-row">
                            <div class="setting-row__info">
                                <label class="setting-label">Show Helpful Tips</label>
                                <p class="setting-description">Display tutorial bubbles when you visit new features for the first time.</p>
                            </div>
                            <label class="toggle-switch">
                                <input type="checkbox" id="showTipsToggle" ${showTips ? 'checked' : ''}>
                                <span class="toggle-switch__slider"></span>
                            </label>
                        </div>
                    </div>

                    <div class="data-action-card" style="margin-top: var(--space-3);">
                        <div class="data-action-card__icon">
                            <i data-lucide="message-circle"></i>
                        </div>
                        <div class="data-action-card__content">
                            <h4>Give Feedback</h4>
                            <p>Help us improve Home Anchor by sharing your experience and feature requests.</p>
                            <button class="btn btn--primary" id="giveFeedbackBtn" onclick="window.open('feedback.html', '_blank')">
                                <i data-lucide="external-link"></i>
                                Open Feedback Form
                            </button>
                        </div>
                    </div>

                    <div class="data-action-card" style="margin-top: var(--space-3);">
                        <div class="data-action-card__icon">
                            <i data-lucide="rotate-ccw"></i>
                        </div>
                        <div class="data-action-card__content">
                            <h4>Reset All Tours</h4>
                            <p>Reset all tutorial completion states to see tours again.</p>
                            <button class="btn btn--ghost" id="resetToursBtn">
                                Reset Tours
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render data management section
     */
    function renderDataManagement() {
        const lastModified = Storage.getLastModified();
        const formattedDate = lastModified
            ? new Date(lastModified).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
            : 'Never';

        // Get backup settings if Backup module is available
        const backupSettings = typeof Backup !== 'undefined' ? Backup.getBackupSettings() : null;
        const lastBackupTime = backupSettings?.lastBackupTime;
        const lastBackupFormatted = lastBackupTime
            ? (typeof Backup !== 'undefined' ? Backup.formatDateForDisplay(lastBackupTime) : 'Unknown')
            : 'Never';

        return `
            <div class="data-management">
                <div class="data-info">
                    <p><strong>Last saved:</strong> ${formattedDate}</p>
                </div>

                <!-- Auto-Backup Section -->
                ${typeof Backup !== 'undefined' ? `
                <div class="backup-section">
                    <h4 class="backup-section__title">
                        <i data-lucide="shield-check"></i>
                        Auto-Backup
                    </h4>
                    <p class="backup-section__description">
                        Automatic backups keep your data safe. Backups are stored locally in your browser.
                    </p>

                    <div class="backup-settings">
                        <div class="setting-row">
                            <div class="setting-row__info">
                                <label class="setting-label">Auto-backup on app open</label>
                                <p class="setting-description">Creates a backup if last one was over 24 hours ago</p>
                            </div>
                            <label class="toggle-switch">
                                <input type="checkbox" id="autoBackupToggle" ${backupSettings?.autoBackupEnabled ? 'checked' : ''}>
                                <span class="toggle-switch__slider"></span>
                            </label>
                        </div>

                        <div class="setting-row">
                            <div class="setting-row__info">
                                <label class="setting-label">Backup on close</label>
                                <p class="setting-description">Saves a backup when you leave the app</p>
                            </div>
                            <label class="toggle-switch">
                                <input type="checkbox" id="backupOnCloseToggle" ${backupSettings?.backupOnClose ? 'checked' : ''}>
                                <span class="toggle-switch__slider"></span>
                            </label>
                        </div>
                    </div>

                    <div class="backup-status">
                        <span class="backup-status__label">Last backup:</span>
                        <span class="backup-status__value">${lastBackupFormatted}</span>
                        <button class="btn btn--sm btn--primary" id="backupNowBtn">
                            <i data-lucide="save"></i>
                            Backup Now
                        </button>
                    </div>

                    <div class="backup-history" id="backupHistory">
                        <h5 class="backup-history__title">Backup History (Last 7)</h5>
                        <div class="backup-history__list" id="backupHistoryList">
                            <p class="backup-history__loading">Loading backups...</p>
                        </div>
                    </div>
                </div>
                ` : ''}

                <div class="data-actions">
                    <div class="data-action-card">
                        <div class="data-action-card__icon">
                            <i data-lucide="download"></i>
                        </div>
                        <div class="data-action-card__content">
                            <h4>Export Data</h4>
                            <p>Download a backup of all your data as a JSON file.</p>
                            <button class="btn btn--secondary" id="exportDataBtn">
                                Export Backup
                            </button>
                        </div>
                    </div>

                    <div class="data-action-card">
                        <div class="data-action-card__icon">
                            <i data-lucide="upload"></i>
                        </div>
                        <div class="data-action-card__content">
                            <h4>Import Data</h4>
                            <p>Restore your data from a previously exported backup file.</p>
                            <button class="btn btn--secondary" id="importDataBtn">
                                Import Backup
                            </button>
                        </div>
                    </div>

                    <div class="data-action-card data-action-card--danger">
                        <div class="data-action-card__icon">
                            <i data-lucide="trash-2"></i>
                        </div>
                        <div class="data-action-card__content">
                            <h4>Reset All Data</h4>
                            <p>Permanently delete all data and start fresh. This cannot be undone!</p>
                            <button class="btn btn--danger" id="resetDataBtn">
                                Reset Everything
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Load and render backup history
     */
    async function loadBackupHistory() {
        const historyList = document.getElementById('backupHistoryList');
        if (!historyList || typeof Backup === 'undefined') return;

        try {
            const backups = await Backup.getBackupList();

            if (backups.length === 0) {
                historyList.innerHTML = '<p class="backup-history__empty">No backups yet</p>';
                return;
            }

            historyList.innerHTML = backups.map(backup => `
                <div class="backup-item" data-backup-id="${backup.id}">
                    <div class="backup-item__info">
                        <span class="backup-item__date">${Backup.formatDateForDisplay(backup.timestamp)}</span>
                        <span class="backup-item__meta">
                            <span class="backup-item__trigger">${Backup.getTriggerLabel(backup.trigger)}</span>
                            <span class="backup-item__size">${Backup.formatSize(backup.size)}</span>
                        </span>
                    </div>
                    <div class="backup-item__actions">
                        <button class="btn btn--ghost btn--sm backup-download-btn" title="Download">
                            <i data-lucide="download"></i>
                        </button>
                        <button class="btn btn--ghost btn--sm backup-restore-btn" title="Restore">
                            <i data-lucide="rotate-ccw"></i>
                        </button>
                        <button class="btn btn--ghost btn--sm backup-delete-btn" title="Delete">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>
                </div>
            `).join('');

            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }

            // Bind backup item events
            bindBackupItemEvents(historyList);
        } catch (error) {
            console.error('Failed to load backup history:', error);
            historyList.innerHTML = '<p class="backup-history__error">Failed to load backups</p>';
        }
    }

    /**
     * Bind events for backup history items
     */
    function bindBackupItemEvents(container) {
        // Download buttons
        container.querySelectorAll('.backup-download-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const backupId = parseInt(e.target.closest('.backup-item').dataset.backupId);
                try {
                    await Backup.downloadBackup(backupId);
                    Toast.show('Backup downloaded', 'success');
                } catch (error) {
                    Toast.show('Failed to download backup', 'error');
                }
            });
        });

        // Restore buttons
        container.querySelectorAll('.backup-restore-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const backupId = parseInt(e.target.closest('.backup-item').dataset.backupId);

                Modal.confirm(
                    'Restore Backup',
                    'This will replace all current data with this backup. A backup of your current data will be created first. Continue?',
                    async () => {
                        try {
                            await Backup.restoreBackup(backupId);
                            Toast.show('Backup restored! Reloading...', 'success');
                            setTimeout(() => window.location.reload(), 1500);
                        } catch (error) {
                            Toast.show('Failed to restore backup: ' + error.message, 'error');
                        }
                    }
                );
            });
        });

        // Delete buttons
        container.querySelectorAll('.backup-delete-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const backupItem = e.target.closest('.backup-item');
                const backupId = parseInt(backupItem.dataset.backupId);

                Modal.confirm(
                    'Delete Backup',
                    'Are you sure you want to delete this backup? This cannot be undone.',
                    async () => {
                        try {
                            await Backup.deleteBackup(backupId);
                            backupItem.remove();
                            Toast.show('Backup deleted', 'success');

                            // Check if list is empty
                            const remaining = container.querySelectorAll('.backup-item');
                            if (remaining.length === 0) {
                                container.innerHTML = '<p class="backup-history__empty">No backups yet</p>';
                            }
                        } catch (error) {
                            Toast.show('Failed to delete backup', 'error');
                        }
                    }
                );
            });
        });
    }

    /**
     * Bind all event handlers
     */
    function bindEvents(container) {
        // Back button
        container.querySelector('#settingsBackBtn')?.addEventListener('click', () => {
            if (typeof Tabs !== 'undefined') {
                Tabs.switchTo('home');
            }
        });

        // Category toggle buttons
        container.querySelectorAll('[data-toggle-category]').forEach(btn => {
            btn.addEventListener('click', () => {
                const categoryName = btn.dataset.toggleCategory;
                const categoryEl = container.querySelector(`[data-category="${categoryName}"]`);

                if (categoryEl) {
                    const isExpanded = categoryEl.classList.contains('settings-category--expanded');
                    categoryEl.classList.toggle('settings-category--expanded');
                    expandedCategories[categoryName] = !isExpanded;

                    // Re-initialize lucide icons for chevron rotation
                    if (typeof lucide !== 'undefined') {
                        lucide.createIcons();
                    }
                }
            });
        });

        // Add member button
        container.querySelector('#addMemberBtn')?.addEventListener('click', () => {
            showAddMemberModal();
        });

        // Edit member buttons
        container.querySelectorAll('.edit-member-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const memberId = btn.dataset.memberId;
                showEditMemberModal(memberId);
            });
        });

        // Delete member buttons
        container.querySelectorAll('.delete-member-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const memberId = btn.dataset.memberId;
                await deleteMember(memberId);
            });
        });

        // Widget management tabs
        container.querySelectorAll('.widget-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const memberId = tab.dataset.memberId;
                container.querySelectorAll('.widget-tab').forEach(t => t.classList.remove('widget-tab--active'));
                tab.classList.add('widget-tab--active');

                const member = Storage.getMember(memberId);
                if (member) {
                    const contentContainer = container.querySelector('#widgetManagementContent');
                    contentContainer.innerHTML = renderWidgetsForMember(member);
                    bindWidgetToggleEvents(contentContainer);
                    if (typeof lucide !== 'undefined') {
                        lucide.createIcons();
                    }
                }
            });
        });

        // Initial widget toggle events
        bindWidgetToggleEvents(container);

        // Theme color buttons
        container.querySelectorAll('.theme-color-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const themeId = btn.dataset.theme;
                const theme = THEME_COLORS.find(t => t.id === themeId);
                if (theme) {
                    applyThemeColor(theme);
                    container.querySelectorAll('.theme-color-btn').forEach(b => {
                        b.classList.remove('theme-color-btn--active');
                        b.innerHTML = '';
                    });
                    btn.classList.add('theme-color-btn--active');
                    btn.innerHTML = '<i data-lucide="check"></i>';
                    Storage.updateSettings({ themeColor: themeId });
                    if (typeof lucide !== 'undefined') {
                        lucide.createIcons();
                    }
                    Toast.success('Theme color updated');
                }
            });
        });

        // Display mode buttons
        container.querySelectorAll('.display-mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.dataset.mode;
                container.querySelectorAll('.display-mode-btn').forEach(b => b.classList.remove('display-mode-btn--active'));
                btn.classList.add('display-mode-btn--active');
                Storage.updateSettings({ theme: mode });
                applyDisplayMode(mode);
                Toast.success(`Display mode set to ${mode}`);
            });
        });

        // Change PIN button
        container.querySelector('#changePinBtn')?.addEventListener('click', () => {
            changePin(container);
        });

        // Allow Kids Journal Password toggle
        container.querySelector('#allowKidsJournalPasswordToggle')?.addEventListener('change', (e) => {
            Storage.updateSettings({ allowKidsJournalPassword: e.target.checked });
            Toast.show(e.target.checked ? 'Kids can now set their own journal password' : 'Kids can no longer set journal passwords', 'success');
        });

        // Notification settings
        const notifContainer = container.querySelector('#notificationSettings .settings-section__content');
        if (notifContainer && typeof Notifications !== 'undefined') {
            Notifications.bindSettingsEvents(notifContainer);
        }

        // Backup settings
        if (typeof Backup !== 'undefined') {
            // Auto-backup toggle
            container.querySelector('#autoBackupToggle')?.addEventListener('change', (e) => {
                const settings = Backup.getBackupSettings();
                settings.autoBackupEnabled = e.target.checked;
                Backup.saveBackupSettings(settings);
                Toast.show(e.target.checked ? 'Auto-backup enabled' : 'Auto-backup disabled', 'success');
            });

            // Backup on close toggle
            container.querySelector('#backupOnCloseToggle')?.addEventListener('change', (e) => {
                const settings = Backup.getBackupSettings();
                settings.backupOnClose = e.target.checked;
                Backup.saveBackupSettings(settings);
                Toast.show(e.target.checked ? 'Backup on close enabled' : 'Backup on close disabled', 'success');
            });

            // Backup now button
            container.querySelector('#backupNowBtn')?.addEventListener('click', async () => {
                const btn = container.querySelector('#backupNowBtn');
                const originalHtml = btn.innerHTML;
                btn.disabled = true;
                btn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Backing up...';
                if (typeof lucide !== 'undefined') lucide.createIcons();

                try {
                    await Backup.createBackup('manual');
                    Toast.show('Backup created successfully', 'success');

                    // Update last backup display
                    const statusValue = container.querySelector('.backup-status__value');
                    if (statusValue) {
                        statusValue.textContent = 'Just now';
                    }

                    // Reload backup history
                    await loadBackupHistory();
                } catch (error) {
                    Toast.show('Failed to create backup', 'error');
                } finally {
                    btn.disabled = false;
                    btn.innerHTML = originalHtml;
                    if (typeof lucide !== 'undefined') lucide.createIcons();
                }
            });

            // Load backup history
            loadBackupHistory();
        }

        // Export data
        container.querySelector('#exportDataBtn')?.addEventListener('click', () => {
            exportData();
        });

        // Import data
        const importInput = container.querySelector('#importFileInput');
        container.querySelector('#importDataBtn')?.addEventListener('click', () => {
            importInput?.click();
        });

        importInput?.addEventListener('change', (e) => {
            const file = e.target.files?.[0];
            if (file) {
                importData(file);
            }
        });

        // Reset data
        container.querySelector('#resetDataBtn')?.addEventListener('click', async () => {
            await resetData();
        });

        // Help & Tutorials
        // Replay welcome tour
        container.querySelector('#replayWelcomeTourBtn')?.addEventListener('click', () => {
            if (typeof Tour !== 'undefined') {
                // Go back to home first
                if (typeof Tabs !== 'undefined') {
                    Tabs.switchTo('home');
                }
                // Start the tour after a short delay
                setTimeout(() => {
                    Tour.start('welcome');
                }, 300);
            }
        });

        // Member tour buttons
        container.querySelector('#tourAdultBtn')?.addEventListener('click', () => {
            const members = Storage.getMembers();
            const adultMember = members.find(m => m.type === 'adult');
            if (adultMember && typeof Tabs !== 'undefined' && typeof Tour !== 'undefined') {
                Tabs.switchTo(adultMember.id);
                setTimeout(() => Tour.start('adult-member'), 500);
            } else {
                Toast.info('Add an adult member first to see this tour');
            }
        });

        container.querySelector('#tourKidBtn')?.addEventListener('click', () => {
            const members = Storage.getMembers();
            const kidMember = members.find(m => m.type === 'kid');
            if (kidMember && typeof Tabs !== 'undefined' && typeof Tour !== 'undefined') {
                Tabs.switchTo(kidMember.id);
                setTimeout(() => Tour.start('kid-member'), 500);
            } else {
                Toast.info('Add a kid member first to see this tour');
            }
        });

        container.querySelector('#tourToddlerBtn')?.addEventListener('click', () => {
            const members = Storage.getMembers();
            const toddlerMember = members.find(m => m.type === 'toddler');
            if (toddlerMember && typeof Tabs !== 'undefined' && typeof Tour !== 'undefined') {
                Tabs.switchTo(toddlerMember.id);
                setTimeout(() => Tour.start('toddler-member'), 500);
            } else {
                Toast.info('Add a toddler member first to see this tour');
            }
        });

        // Toggle show tips
        container.querySelector('#showTipsToggle')?.addEventListener('change', (e) => {
            const settings = Storage.getSettings();
            settings.onboarding = settings.onboarding || {};
            settings.onboarding.skipAllTours = !e.target.checked;
            Storage.updateSettings(settings);
            Toast.success(e.target.checked ? 'Tips enabled' : 'Tips disabled');
        });

        // Save points configuration
        container.querySelector('#savePointsConfigBtn')?.addEventListener('click', () => {
            const journalPoints = parseInt(container.querySelector('#journalPointsInput')?.value) || 5;
            const kidTaskPoints = parseInt(container.querySelector('#kidTaskPointsInput')?.value) || 3;
            const teenTaskPoints = parseInt(container.querySelector('#teenTaskPointsInput')?.value) || 5;

            const settings = Storage.getSettings();
            settings.pointsConfig = settings.pointsConfig || {};
            settings.pointsConfig.journalPoints = journalPoints;
            settings.pointsConfig.kidTaskPoints = kidTaskPoints;
            settings.pointsConfig.teenTaskPoints = teenTaskPoints;

            Storage.updateSettings(settings);
            Toast.success('Points configuration saved');
        });

        // Kids menu toggle
        container.querySelector('#kidsMenuToggle')?.addEventListener('change', (e) => {
            const settings = Storage.getSettings();
            settings.meals = settings.meals || {};
            settings.meals.kidsMenuEnabled = e.target.checked;
            Storage.updateSettings(settings);
            Toast.success(e.target.checked ? 'Kids menu enabled' : 'Kids menu disabled');
        });

        // Reset all tours
        container.querySelector('#resetToursBtn')?.addEventListener('click', () => {
            if (typeof Tour !== 'undefined') {
                Tour.resetTours();
                Toast.success('All tours have been reset');
            }
        });

        // Kids & Toddlers Management events
        bindKidsManagementEvents(container);
    }

    /**
     * Bind widget toggle events
     */
    function bindWidgetToggleEvents(container) {
        container.querySelectorAll('.widget-toggle-item input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                const widgetId = checkbox.dataset.widgetId;
                const memberId = checkbox.dataset.memberId;

                if (checkbox.checked) {
                    Storage.addWidgetToMember(memberId, widgetId);
                    checkbox.closest('.widget-toggle-item').classList.add('widget-toggle-item--enabled');
                } else {
                    Storage.removeWidgetFromMember(memberId, widgetId);
                    checkbox.closest('.widget-toggle-item').classList.remove('widget-toggle-item--enabled');
                }

                Toast.success(`Widget ${checkbox.checked ? 'enabled' : 'disabled'}`);
            });
        });
    }

    /**
     * Show add member modal
     */
    function showAddMemberModal() {
        const content = `
            <form id="addMemberForm">
                <div class="form-group">
                    <label class="form-label">Name</label>
                    <input type="text" class="form-input" id="memberName" placeholder="Enter name" required>
                </div>

                <div class="form-group">
                    <label class="form-label">Type</label>
                    <div class="member-type-selector">
                        <label class="member-type-option">
                            <input type="radio" name="memberType" value="adult" checked>
                            <div class="member-type-option__content">
                                <i data-lucide="user"></i>
                                <span>Adult</span>
                            </div>
                        </label>
                        <label class="member-type-option">
                            <input type="radio" name="memberType" value="teen">
                            <div class="member-type-option__content">
                                <i data-lucide="user-round"></i>
                                <span>Teen</span>
                            </div>
                        </label>
                        <label class="member-type-option">
                            <input type="radio" name="memberType" value="kid">
                            <div class="member-type-option__content">
                                <i data-lucide="smile"></i>
                                <span>Kid</span>
                            </div>
                        </label>
                        <label class="member-type-option">
                            <input type="radio" name="memberType" value="toddler">
                            <div class="member-type-option__content">
                                <i data-lucide="baby"></i>
                                <span>Toddler</span>
                            </div>
                        </label>
                    </div>
                </div>

                <div class="form-group" id="ageGroup" style="display: none;">
                    <label class="form-label">Age</label>
                    <input type="number" class="form-input" id="memberAge" min="4" max="19" value="8">
                </div>
            </form>
        `;

        Modal.open({
            title: 'Add Family Member',
            content,
            footer: Modal.createFooter('Cancel', 'Add Member')
        });

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Toggle age field for kids and teens
        document.querySelectorAll('input[name="memberType"]').forEach(radio => {
            radio.addEventListener('change', () => {
                const ageGroup = document.getElementById('ageGroup');
                const ageInput = document.getElementById('memberAge');
                if (radio.value === 'kid') {
                    ageGroup.style.display = 'block';
                    ageInput.min = 4;
                    ageInput.max = 12;
                    ageInput.value = 8;
                } else if (radio.value === 'teen') {
                    ageGroup.style.display = 'block';
                    ageInput.min = 13;
                    ageInput.max = 19;
                    ageInput.value = 15;
                } else {
                    ageGroup.style.display = 'none';
                }
            });
        });

        Modal.bindFooterEvents(() => {
            const name = document.getElementById('memberName')?.value.trim();
            const type = document.querySelector('input[name="memberType"]:checked')?.value;
            const age = document.getElementById('memberAge')?.value;

            if (!name) {
                Toast.error('Please enter a name');
                return false;
            }

            const memberData = { name, type };
            if (type === 'kid') {
                memberData.age = parseInt(age) || 8;
            } else if (type === 'teen') {
                memberData.age = parseInt(age) || 15;
            }

            Storage.addMember(memberData);
            Toast.success(`${name} added to family!`);

            // Refresh the settings page
            const container = document.querySelector('.settings-page').parentElement;
            render(container);

            return true;
        });
    }

    /**
     * Show edit member modal
     */
    function showEditMemberModal(memberId) {
        const member = Storage.getMember(memberId);
        if (!member) return;

        const content = `
            <form id="editMemberForm">
                <div class="form-group">
                    <label class="form-label">Name</label>
                    <input type="text" class="form-input" id="memberName" value="${member.name}" required>
                </div>

                <div class="form-group">
                    <label class="form-label">Avatar Color</label>
                    <div class="avatar-color-selector">
                        ${Storage.AVATAR_COLORS.map(color => `
                            <button type="button" class="avatar-color-btn ${member.avatar?.color === color ? 'avatar-color-btn--active' : ''}"
                                    data-color="${color}" style="background-color: ${color}">
                                ${member.avatar?.color === color ? '<i data-lucide="check"></i>' : ''}
                            </button>
                        `).join('')}
                    </div>
                </div>

                ${member.type === 'kid' ? `
                    <div class="form-group">
                        <label class="form-label">Age</label>
                        <input type="number" class="form-input" id="memberAge" min="4" max="17" value="${member.age || 8}">
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

        // Avatar color selection
        let selectedColor = member.avatar?.color;
        document.querySelectorAll('.avatar-color-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.avatar-color-btn').forEach(b => {
                    b.classList.remove('avatar-color-btn--active');
                    b.innerHTML = '';
                });
                btn.classList.add('avatar-color-btn--active');
                btn.innerHTML = '<i data-lucide="check"></i>';
                selectedColor = btn.dataset.color;
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            });
        });

        Modal.bindFooterEvents(() => {
            const name = document.getElementById('memberName')?.value.trim();
            const age = document.getElementById('memberAge')?.value;

            if (!name) {
                Toast.error('Please enter a name');
                return false;
            }

            const updates = {
                name,
                avatar: {
                    ...member.avatar,
                    color: selectedColor,
                    initials: Storage.generateInitials(name)
                }
            };

            if (member.type === 'kid') {
                updates.age = parseInt(age) || 8;
            }

            Storage.updateMember(memberId, updates);
            Toast.success('Member updated!');

            // Refresh the settings page
            const container = document.querySelector('.settings-page').parentElement;
            render(container);

            // Re-render tabs to reflect name change immediately
            Tabs.render();

            return true;
        });
    }

    /**
     * Delete a member
     */
    async function deleteMember(memberId) {
        const member = Storage.getMember(memberId);
        if (!member) return;

        const confirmed = await Modal.dangerConfirm(
            `Are you sure you want to remove ${member.name}? All their data including schedules, widgets, and history will be permanently deleted.`,
            `Remove ${member.name}`
        );

        if (confirmed) {
            Storage.deleteMember(memberId);
            Toast.success(`${member.name} removed from family`);

            // Refresh the settings page
            const container = document.querySelector('.settings-page').parentElement;
            render(container);
        }
    }

    /**
     * Apply theme color
     */
    function applyThemeColor(theme) {
        // Update CSS custom properties used throughout the app
        document.documentElement.style.setProperty('--primary', theme.primary);
        document.documentElement.style.setProperty('--primary-dark', theme.primary);
        document.documentElement.style.setProperty('--primary-light', theme.accent);
    }

    /**
     * Apply display mode
     */
    function applyDisplayMode(mode) {
        if (mode === 'dark') {
            document.documentElement.classList.add('dark-mode');
        } else if (mode === 'light') {
            document.documentElement.classList.remove('dark-mode');
        } else {
            // Auto - check system preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.documentElement.classList.toggle('dark-mode', prefersDark);
        }
    }

    /**
     * Change PIN
     */
    function changePin(container) {
        const currentPin = container.querySelector('#currentPin')?.value;
        const newPin = container.querySelector('#newPin')?.value;
        const confirmPin = container.querySelector('#confirmPin')?.value;

        const settings = Storage.getSettings();

        if (currentPin !== settings.adminPin) {
            Toast.error('Current PIN is incorrect');
            return;
        }

        if (!/^\d{4}$/.test(newPin)) {
            Toast.error('New PIN must be exactly 4 digits');
            return;
        }

        if (newPin !== confirmPin) {
            Toast.error('New PINs do not match');
            return;
        }

        Storage.updateSettings({ adminPin: newPin });
        Toast.success('PIN changed successfully');

        // Clear the inputs
        container.querySelector('#currentPin').value = '';
        container.querySelector('#newPin').value = '';
        container.querySelector('#confirmPin').value = '';
    }

    /**
     * Export data
     */
    function exportData() {
        const data = Storage.exportData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `home-anchor-backup-${DateUtils.today()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        Toast.success('Data exported successfully');
    }

    /**
     * Import data
     */
    function importData(file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const success = Storage.importData(event.target.result);
            if (success) {
                Toast.success('Data imported successfully');
                // Refresh the page
                if (typeof App !== 'undefined') {
                    App.init();
                }
            } else {
                Toast.error('Failed to import data. Invalid format.');
            }
        };
        reader.readAsText(file);
    }

    /**
     * Reset all data
     */
    async function resetData() {
        const confirmed = await Modal.dangerConfirm(
            'This will permanently delete ALL your data including family members, schedules, widgets, and calendar events. This action cannot be undone!',
            'Reset All Data'
        );

        if (confirmed) {
            Storage.reset();
            Toast.success('All data has been reset');
            if (typeof App !== 'undefined') {
                App.init();
            }
        }
    }

    /**
     * Check if current view is settings page
     */
    function isActive() {
        return State.getActiveTab() === PAGE_ID;
    }

    return {
        render,
        isActive,
        PAGE_ID,
        THEME_COLORS,
        applyThemeColor,
        applyDisplayMode
    };
})();
