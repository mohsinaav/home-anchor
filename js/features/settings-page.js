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

                            <!-- Voice Assistant -->
                            <section class="settings-section" id="voiceSettings">
                                <div class="settings-section__header">
                                    <h3 class="settings-section__title">
                                        <i data-lucide="mic"></i>
                                        Voice Assistant
                                    </h3>
                                </div>
                                <div class="settings-section__content">
                                    ${renderVoiceSettings(settings)}
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

        if (avatar.type === 'emoji' && avatar.emoji) {
            return `
                <div class="avatar avatar--emoji" style="background-color: ${avatar.color}">
                    <span class="avatar__emoji">${avatar.emoji}</span>
                </div>
            `;
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

    function renderVoiceSettings(settings) {
        const voiceSettings = settings.voiceAssistant || { enabled: false, ttsEnabled: false };
        const supported = typeof VoiceAssistant !== 'undefined' && VoiceAssistant.isSupported();

        if (!supported) {
            return `
                <div class="voice-settings">
                    <div class="setting-warning">
                        <i data-lucide="alert-triangle"></i>
                        <p>Voice assistant is not supported in your browser. Please use Chrome, Edge, or Safari for voice features.</p>
                    </div>
                </div>
            `;
        }

        // Get available voices
        const voices = VoiceAssistant.getAvailableVoices();
        const selectedVoice = voiceSettings.selectedVoice || '';
        const speechRate = voiceSettings.speechRate || 1.0;

        // Group voices by language variant
        const voiceOptions = voices.map(v => {
            const label = v.name.replace('Microsoft ', '').replace(' Online (Natural)', '').replace(' - English', '');
            return `<option value="${v.name}" ${v.name === selectedVoice ? 'selected' : ''}>${label}</option>`;
        }).join('');

        return `
            <div class="voice-settings">
                <div class="setting-group">
                    <div class="setting-row">
                        <div class="setting-row__info">
                            <label class="setting-label">Enable Voice Assistant</label>
                            <p class="setting-description">Show a microphone button on your dashboard for quick voice commands.</p>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" id="voiceEnabledToggle" ${voiceSettings.enabled ? 'checked' : ''}>
                            <span class="toggle-switch__slider"></span>
                        </label>
                    </div>

                    <div class="setting-row">
                        <div class="setting-row__info">
                            <label class="setting-label">Voice Feedback</label>
                            <p class="setting-description">Speak responses aloud using text-to-speech.</p>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" id="voiceTtsToggle" ${voiceSettings.ttsEnabled ? 'checked' : ''}>
                            <span class="toggle-switch__slider"></span>
                        </label>
                    </div>
                </div>

                <!-- Voice Selection (shown when TTS is enabled) -->
                <div class="setting-group voice-tts-options" id="voiceTtsOptions" style="${voiceSettings.ttsEnabled ? '' : 'display: none;'}">
                    <div class="setting-row">
                        <div class="setting-row__info">
                            <label class="setting-label">Voice</label>
                            <p class="setting-description">Choose the voice for spoken responses.</p>
                        </div>
                        <select class="form-select" id="voiceSelectDropdown" style="width: 200px;">
                            <option value="">System Default</option>
                            ${voiceOptions}
                        </select>
                    </div>

                    <div class="setting-row">
                        <div class="setting-row__info">
                            <label class="setting-label">Speech Speed</label>
                            <p class="setting-description">Adjust how fast the voice speaks.</p>
                        </div>
                        <div class="speed-control" style="display: flex; align-items: center; gap: var(--space-3);">
                            <input type="range" id="voiceSpeedSlider" min="0.5" max="2" step="0.1" value="${speechRate}" style="width: 120px;">
                            <span id="voiceSpeedValue" style="min-width: 40px; text-align: center;">${speechRate}x</span>
                        </div>
                    </div>

                    <div class="setting-row">
                        <div class="setting-row__info">
                            <label class="setting-label">Test Voice</label>
                            <p class="setting-description">Hear a sample of the selected voice.</p>
                        </div>
                        <button class="btn btn--secondary btn--sm" id="testVoiceBtn">
                            <i data-lucide="volume-2"></i>
                            Test
                        </button>
                    </div>
                </div>

                <div class="setting-info" style="margin-top: var(--space-4);">
                    <i data-lucide="info"></i>
                    <div>
                        <p style="margin-bottom: 0.5rem;"><strong>Try these voice commands:</strong></p>
                        <ul style="margin: 0; padding-left: 1.25rem; font-size: 0.875rem; color: var(--gray-600);">
                            <li>"Add task buy milk"</li>
                            <li>"Add eggs to grocery"</li>
                            <li>"Check off exercise"</li>
                            <li>"Dinner is pasta"</li>
                            <li>"What's for dinner?"</li>
                        </ul>
                    </div>
                </div>
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
        const isToddler = selectedMember?.type === 'toddler';

        // Reset tab if switching between kid/toddler and current tab doesn't apply
        const kidTabs = ['points', 'chores', 'screen-time', 'rewards'];
        const toddlerTabs = ['routine', 'activities', 'milestones', 'growth'];

        if (isToddler && kidTabs.includes(kidsManagementTab)) {
            kidsManagementTab = 'routine';
        } else if (!isToddler && toddlerTabs.includes(kidsManagementTab)) {
            kidsManagementTab = 'points';
        }

        const renderKidTabs = () => `
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
            <button class="kids-management__tab ${kidsManagementTab === 'move-play' ? 'kids-management__tab--active' : ''}" data-kids-tab="move-play">
                <i data-lucide="activity"></i>
                Move & Play
            </button>
        `;

        const renderToddlerTabs = () => `
            <button class="kids-management__tab ${kidsManagementTab === 'routine' ? 'kids-management__tab--active' : ''}" data-kids-tab="routine">
                <i data-lucide="clock"></i>
                Routine
            </button>
            <button class="kids-management__tab ${kidsManagementTab === 'activities' ? 'kids-management__tab--active' : ''}" data-kids-tab="activities">
                <i data-lucide="shapes"></i>
                Activities
            </button>
            <button class="kids-management__tab ${kidsManagementTab === 'milestones' ? 'kids-management__tab--active' : ''}" data-kids-tab="milestones">
                <i data-lucide="award"></i>
                Milestones
            </button>
            <button class="kids-management__tab ${kidsManagementTab === 'growth' ? 'kids-management__tab--active' : ''}" data-kids-tab="growth">
                <i data-lucide="ruler"></i>
                Growth
            </button>
        `;

        const dangerZoneText = isToddler
            ? `Reset all progress for ${selectedMember?.name || 'this toddler'}. This clears routine history, activities, and milestones.`
            : `Reset all progress for ${selectedMember?.name || 'this child'}. This clears points, chores history, screen time log, and achievements.`;

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
                            ${isToddler ? renderToddlerTabs() : renderKidTabs()}
                        </div>

                        <!-- Tab Content -->
                        <div class="kids-management__content" id="kidsManagementContent">
                            ${renderKidsTabContent(selectedKidId, kidsManagementTab)}
                        </div>

                        <!-- Danger Zone -->
                        <div class="kids-management__danger-zone">
                            <h4><i data-lucide="alert-triangle"></i> Danger Zone</h4>
                            <p>${dangerZoneText}</p>
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
        const member = Storage.getMember(memberId);
        const isToddler = member?.type === 'toddler';

        switch (tab) {
            // Kid tabs
            case 'points':
                return renderKidsPointsTab(memberId);
            case 'chores':
                return renderKidsChoresTab(memberId);
            case 'screen-time':
                return renderKidsScreenTimeTab(memberId);
            case 'rewards':
                return renderKidsRewardsTab(memberId);
            case 'move-play':
                return renderKidsMovePlayTab(memberId);
            // Toddler tabs
            case 'routine':
                return renderToddlerRoutineTab(memberId);
            case 'activities':
                return renderToddlerActivitiesTab(memberId);
            case 'milestones':
                return renderToddlerMilestonesTab(memberId);
            case 'growth':
                return renderToddlerGrowthTab(memberId);
            default:
                return isToddler ? renderToddlerRoutineTab(memberId) : renderKidsPointsTab(memberId);
        }
    }

    /**
     * Render Points Management Tab
     */
    function renderKidsPointsTab(memberId) {
        const pointsData = Storage.getWidgetData(memberId, 'points') || { balance: 0, activities: [] };
        const balance = pointsData.balance || 0;
        const activities = pointsData.activities || [];

        // Category labels - must match points.js ACTIVITY_CATEGORIES
        const CATEGORY_LABELS = {
            'hygiene': { name: 'Hygiene', color: '#3B82F6' },
            'chores': { name: 'Chores', color: '#10B981' },
            'school': { name: 'School', color: '#8B5CF6' },
            'health': { name: 'Health', color: '#EF4444' },
            'kindness': { name: 'Kindness', color: '#EC4899' },
            'custom': { name: 'Other', color: '#F59E0B' }
        };

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

                <!-- Activities List -->
                <div class="kids-points-activities">
                    <div class="kids-points-activities__header">
                        <h4>Point Activities (${activities.length})</h4>
                        <button class="btn btn--primary btn--sm" id="kidsAddPointActivityBtn">
                            <i data-lucide="plus"></i> Add Activity
                        </button>
                    </div>
                    ${activities.length === 0 ? `
                        <p class="kids-points-activities__empty">No activities yet. Add activities that can earn points!</p>
                    ` : `
                        <div class="kids-points-activities__grid">
                            ${activities.map(activity => {
                                const catInfo = CATEGORY_LABELS[activity.category] || { name: 'Other', color: '#6B7280' };
                                return `
                                    <div class="kids-points-activity-item" data-activity-id="${activity.id}" style="--activity-color: ${catInfo.color}">
                                        <div class="kids-points-activity-item__icon">
                                            ${activity.emoji ? `<span class="activity-emoji">${activity.emoji}</span>` : `<i data-lucide="${activity.icon || 'star'}"></i>`}
                                        </div>
                                        <div class="kids-points-activity-item__info">
                                            <span class="kids-points-activity-item__name">${activity.name}</span>
                                            <span class="kids-points-activity-item__meta">
                                                <i data-lucide="star"></i> ${activity.points} pts · ${catInfo.name}
                                            </span>
                                        </div>
                                        <div class="kids-points-activity-item__actions">
                                            <button class="btn btn--ghost btn--sm" data-edit-point-activity="${activity.id}" title="Edit">
                                                <i data-lucide="pencil"></i>
                                            </button>
                                            <button class="btn btn--ghost btn--sm btn--danger-hover" data-delete-point-activity="${activity.id}" title="Delete">
                                                <i data-lucide="trash-2"></i>
                                            </button>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    `}
                </div>

                <!-- Default Points Configuration -->
                <div class="kids-points-config">
                    <h4><i data-lucide="settings"></i> Default Points Settings</h4>
                    <p class="kids-points-config__description">Configure default points awarded for completing tasks (applies to all kids).</p>
                    <div class="kids-points-config__grid">
                        <div class="kids-points-config__item">
                            <label class="form-label">Kid Task Points</label>
                            <input type="number" class="form-input form-input--sm" id="kidTaskPointsInput" value="${Storage.getSettings().pointsConfig?.kidTaskPoints || 3}" min="0" max="50">
                        </div>
                        <div class="kids-points-config__item">
                            <label class="form-label">Teen Task Points</label>
                            <input type="number" class="form-input form-input--sm" id="teenTaskPointsInput" value="${Storage.getSettings().pointsConfig?.teenTaskPoints || 5}" min="0" max="50">
                        </div>
                        <div class="kids-points-config__item">
                            <label class="form-label">Journal Entry Points</label>
                            <input type="number" class="form-input form-input--sm" id="journalPointsInput" value="${Storage.getSettings().pointsConfig?.journalPoints || 5}" min="0" max="50">
                        </div>
                    </div>
                    <button class="btn btn--primary btn--sm" id="savePointsConfigBtn" style="margin-top: var(--space-3);">
                        <i data-lucide="save"></i> Save Settings
                    </button>
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
                        <div class="kids-chores-grid">
                            ${pool.map(chore => `
                                <div class="kids-chore-item" data-chore-id="${chore.id}" style="--chore-color: ${chore.color || '#10B981'}">
                                    <div class="kids-chore-item__icon" style="background-color: ${chore.color || '#10B981'}">
                                        ${chore.emoji ? `<span class="chore-emoji">${chore.emoji}</span>` : `<i data-lucide="${chore.icon || 'check-square'}"></i>`}
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
                    <button class="btn btn--ghost btn--sm" id="kidsResetTodayScreenTimeBtn">
                        <i data-lucide="refresh-cw"></i> Reset Today's Usage
                    </button>
                    <button class="btn btn--ghost" id="kidsResetScreenTimeLogBtn">
                        <i data-lucide="trash-2"></i> Clear All History
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
                                        ${reward.emoji ? `<span class="reward-emoji">${reward.emoji}</span>` : `<i data-lucide="${reward.icon || 'gift'}"></i>`}
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
     * Render Move & Play Management Tab
     */
    function renderKidsMovePlayTab(memberId) {
        // Use KidWorkout module to get data
        const workoutData = typeof KidWorkout !== 'undefined'
            ? KidWorkout.getWidgetData(memberId)
            : Storage.getWidgetData(memberId, 'kid-workout') || { activities: [], settings: { weeklyGoal: 5 } };

        const activities = workoutData.activities || [];
        const weeklyGoal = workoutData.settings?.weeklyGoal || 5;

        // Activity emojis mapping
        const ACTIVITY_EMOJIS = typeof KidWorkout !== 'undefined' ? KidWorkout.ACTIVITY_EMOJIS : {
            'swimming': '🏊', 'bike-ride': '🚴', 'soccer': '⚽', 'dance': '💃',
            'jump-rope': '🪢', 'playground': '🛝', 'tag': '🏃', 'basketball': '🏀',
            'stretching': '🧘', 'yoga': '🧘', 'hiking': '🥾', 'skating': '⛸️'
        };

        // Category colors
        const CATEGORY_COLORS = {
            'active': '#F59E0B',
            'sports': '#3B82F6',
            'outdoor': '#10B981',
            'dance': '#EC4899',
            'custom': '#8B5CF6'
        };

        return `
            <div class="kids-tab-content kids-tab-content--move-play">
                <!-- Settings -->
                <div class="kids-move-play-config">
                    <div class="setting-row">
                        <div class="setting-row__label">
                            <span class="setting-row__title">Weekly Goal</span>
                            <span class="setting-row__hint">How many days per week to be active</span>
                        </div>
                        <div class="setting-row__control">
                            <input type="range" class="form-range" id="kidsMovePlayWeeklyGoal"
                                min="1" max="7" value="${weeklyGoal}">
                            <span class="form-range__value">${weeklyGoal} days</span>
                        </div>
                    </div>
                </div>

                <!-- Activities List -->
                <div class="kids-move-play-list">
                    <div class="kids-move-play-list__header">
                        <h4>Activities (${activities.length})</h4>
                        <button class="btn btn--primary btn--sm" id="kidsAddMovePlayBtn">
                            <i data-lucide="plus"></i> Add Activity
                        </button>
                    </div>
                    ${activities.length === 0 ? `
                        <p class="kids-move-play-list__empty">No activities yet. Add some fun activities to track!</p>
                    ` : `
                        <div class="kids-move-play-grid">
                            ${activities.map(activity => {
                                const emoji = activity.emoji || ACTIVITY_EMOJIS[activity.id] || '🏃';
                                const color = CATEGORY_COLORS[activity.category] || '#8B5CF6';
                                return `
                                    <div class="kids-move-play-item" data-activity-id="${activity.id}" style="--activity-color: ${color}">
                                        <div class="kids-move-play-item__icon">
                                            <span class="kids-move-play-item__emoji">${emoji}</span>
                                        </div>
                                        <div class="kids-move-play-item__info">
                                            <span class="kids-move-play-item__name">${activity.name}</span>
                                            <span class="kids-move-play-item__meta">
                                                ${activity.duration}m · ${activity.points} pts
                                            </span>
                                        </div>
                                        <div class="kids-move-play-item__actions">
                                            <button class="btn btn--ghost btn--sm" data-edit-move-play="${activity.id}" title="Edit">
                                                <i data-lucide="pencil"></i>
                                            </button>
                                            <button class="btn btn--ghost btn--sm btn--danger-hover" data-delete-move-play="${activity.id}" title="Delete">
                                                <i data-lucide="trash-2"></i>
                                            </button>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    `}
                </div>

                <!-- Actions -->
                <div class="kids-move-play-actions">
                    <button class="btn btn--secondary btn--sm" id="kidsResetMovePlayBtn">
                        <i data-lucide="rotate-ccw"></i> Reset to Defaults
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Render Toddler Routine Tab
     */
    function renderToddlerRoutineTab(memberId) {
        const routineData = Storage.getWidgetData(memberId, 'toddler-routine') || { routines: [] };
        const routines = routineData.routines || [];

        // Emoji mapping for routine imageKeys and common titles
        const ROUTINE_EMOJIS = {
            'wake-up': '🌅',
            'brush-teeth': '🦷',
            'brush-teeth-night': '🦷',
            'get-dressed': '👕',
            'breakfast': '🥣',
            'wash-hands': '🧼',
            'lunch': '🍽️',
            'nap-time': '😴',
            'snack': '🍎',
            'dinner': '🍝',
            'bath-time': '🛁',
            'pajamas': '👶',
            'story-time': '📖',
            'bedtime': '🌙',
            'potty': '🚽',
            'eye-patching': '👁️',
            'independent-play': '🧸'
        };

        // Get emoji for routine
        const getRoutineEmoji = (routine) => {
            // Check imageKey first
            if (routine.imageKey && ROUTINE_EMOJIS[routine.imageKey]) {
                return ROUTINE_EMOJIS[routine.imageKey];
            }
            // Check emoji property
            if (routine.emoji) {
                return routine.emoji;
            }
            // Fallback based on title
            const title = (routine.title || routine.name || '').toLowerCase();
            for (const [key, emoji] of Object.entries(ROUTINE_EMOJIS)) {
                if (title.includes(key.replace(/-/g, ' ')) || title.includes(key.replace(/-/g, ''))) {
                    return emoji;
                }
            }
            return '⏰'; // Default emoji
        };

        // Category colors
        const CATEGORY_COLORS = {
            'morning': '#F59E0B',
            'afternoon': '#3B82F6',
            'evening': '#8B5CF6',
            'bedtime': '#6366F1',
            'anytime': '#10B981'
        };

        return `
            <div class="kids-tab-content kids-tab-content--routine">
                <div class="toddler-routine-settings">
                    <div class="toddler-routine-header">
                        <h4>Daily Routines (${routines.length})</h4>
                        <button class="btn btn--primary btn--sm" id="toddlerAddRoutineBtn">
                            <i data-lucide="plus"></i> Add Routine
                        </button>
                    </div>
                    ${routines.length === 0 ? `
                        <p class="toddler-empty-message">No routines set up yet. Add daily routines like meals, naps, and activities!</p>
                    ` : `
                        <div class="toddler-routine-list">
                            ${routines.map(routine => {
                                const emoji = getRoutineEmoji(routine);
                                const color = CATEGORY_COLORS[routine.category] || routine.color || '#6366F1';
                                return `
                                <div class="toddler-routine-item" data-routine-id="${routine.id}">
                                    <div class="toddler-routine-item__icon" style="background-color: ${color}">
                                        <span class="routine-emoji">${emoji}</span>
                                    </div>
                                    <div class="toddler-routine-item__info">
                                        <span class="toddler-routine-item__name">${routine.title || routine.name || 'Untitled'}</span>
                                        <span class="toddler-routine-item__time">${routine.time || 'No time set'}</span>
                                    </div>
                                    <div class="toddler-routine-item__actions">
                                        <button class="btn btn--ghost btn--sm" data-edit-routine="${routine.id}">
                                            <i data-lucide="pencil"></i>
                                        </button>
                                        <button class="btn btn--ghost btn--sm" data-delete-routine="${routine.id}">
                                            <i data-lucide="trash-2"></i>
                                        </button>
                                    </div>
                                </div>
                            `;}).join('')}
                        </div>
                    `}
                </div>
                <div class="toddler-routine-actions">
                    <button class="btn btn--ghost btn--sm" id="toddlerResetRoutinesBtn">
                        <i data-lucide="refresh-cw"></i> Reset Today's Progress
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Render Toddler Activities Tab
     */
    function renderToddlerActivitiesTab(memberId) {
        const activitiesData = Storage.getWidgetData(memberId, 'activities') || {};
        const customActivities = activitiesData.customActivities || {};

        // Default categories
        const categories = {
            sensory: { name: 'Sensory Play', icon: 'hand', color: '#EC4899' },
            motor: { name: 'Motor Skills', icon: 'move', color: '#8B5CF6' },
            creative: { name: 'Creative', icon: 'palette', color: '#10B981' },
            learning: { name: 'Learning', icon: 'book-open', color: '#F59E0B' },
            outdoor: { name: 'Outdoor', icon: 'sun', color: '#3B82F6' }
        };

        const totalCustom = Object.values(customActivities).reduce((sum, arr) => sum + (arr?.length || 0), 0);

        return `
            <div class="kids-tab-content kids-tab-content--activities">
                <div class="toddler-activities-settings">
                    <div class="toddler-activities-header">
                        <h4>Activity Suggestions (${totalCustom} custom)</h4>
                        <button class="btn btn--primary btn--sm" id="toddlerAddActivityBtn">
                            <i data-lucide="plus"></i> Add Activity
                        </button>
                    </div>
                    <p class="setting-description">Add custom activities to each category. These will appear in daily suggestions.</p>

                    <div class="toddler-activities-categories">
                        ${Object.entries(categories).map(([key, cat]) => {
                            const customs = customActivities[key] || [];
                            return `
                                <div class="toddler-activity-category" data-category="${key}">
                                    <div class="toddler-activity-category__header" style="--cat-color: ${cat.color}">
                                        <i data-lucide="${cat.icon}"></i>
                                        <span>${cat.name}</span>
                                        <span class="toddler-activity-category__count">${customs.length} custom</span>
                                    </div>
                                    ${customs.length > 0 ? `
                                        <div class="toddler-activity-category__list">
                                            ${customs.map((activity, idx) => `
                                                <div class="toddler-activity-item">
                                                    <span class="toddler-activity-item__name">${activity}</span>
                                                    <button class="btn btn--ghost btn--sm" data-delete-activity="${key}:${idx}" title="Remove">
                                                        <i data-lucide="x"></i>
                                                    </button>
                                                </div>
                                            `).join('')}
                                        </div>
                                    ` : ''}
                                </div>
                            `;
                        }).join('')}
                    </div>

                    <div class="toddler-activities-actions">
                        <button class="btn btn--ghost btn--sm" id="toddlerResetActivitiesBtn">
                            <i data-lucide="refresh-cw"></i> Reset to Defaults
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render Toddler Milestones Tab
     */
    function renderToddlerMilestonesTab(memberId) {
        const milestonesData = Storage.getWidgetData(memberId, 'milestones') || { milestones: [] };
        const milestones = milestonesData.milestones || [];

        return `
            <div class="kids-tab-content kids-tab-content--milestones">
                <div class="toddler-milestones-settings">
                    <div class="toddler-milestones-header">
                        <h4>Milestones to Track (${milestones.length})</h4>
                        <button class="btn btn--primary btn--sm" id="toddlerAddMilestoneBtn">
                            <i data-lucide="plus"></i> Add Milestone
                        </button>
                    </div>
                    <p class="setting-description">Define developmental milestones to track. Mark them as achieved in the widget.</p>
                    ${milestones.length === 0 ? `
                        <p class="toddler-empty-message">No milestones set up yet. Add developmental milestones to track!</p>
                    ` : `
                        <div class="toddler-milestones-list">
                            ${milestones.map(milestone => `
                                <div class="toddler-milestone-item" data-milestone-id="${milestone.id}">
                                    <div class="toddler-milestone-item__icon">
                                        <i data-lucide="${milestone.achieved ? 'check-circle' : 'circle'}"></i>
                                    </div>
                                    <div class="toddler-milestone-item__info">
                                        <span class="toddler-milestone-item__name">${milestone.name}</span>
                                        ${milestone.category ? `<span class="toddler-milestone-item__category">${milestone.category}</span>` : ''}
                                    </div>
                                    <div class="toddler-milestone-item__actions">
                                        <button class="btn btn--ghost btn--sm" data-edit-milestone="${milestone.id}" title="Edit">
                                            <i data-lucide="pencil"></i>
                                        </button>
                                        <button class="btn btn--ghost btn--sm" data-delete-milestone="${milestone.id}" title="Delete">
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
     * Render Toddler Growth Tab
     */
    function renderToddlerGrowthTab(memberId) {
        const DEFAULT_FIELDS = [
            { id: 'height', name: 'Height', unit: { metric: 'cm', imperial: 'in' }, color: '#6366F1' },
            { id: 'weight', name: 'Weight', unit: { metric: 'kg', imperial: 'lbs' }, color: '#22C55E' },
            { id: 'head', name: 'Head Circumference', unit: { metric: 'cm', imperial: 'in' }, color: '#F59E0B' }
        ];

        const growthData = Storage.getWidgetData(memberId, 'growth-chart') || {};
        const fields = growthData.fields || DEFAULT_FIELDS;
        const customCount = fields.filter(f => !DEFAULT_FIELDS.some(d => d.id === f.id)).length;

        return `
            <div class="kids-tab-content kids-tab-content--growth">
                <div class="toddler-growth-settings">
                    <div class="toddler-growth-header">
                        <h4>Measurement Fields (${fields.length})</h4>
                        <button class="btn btn--primary btn--sm" id="toddlerAddFieldBtn">
                            <i data-lucide="plus"></i> Add Field
                        </button>
                    </div>
                    <p class="setting-description">Configure what measurements to track. Default fields cannot be removed. ${customCount > 0 ? `(${customCount} custom)` : ''}</p>

                    <div class="toddler-growth-fields">
                        ${fields.map((field, idx) => {
                            const isDefault = DEFAULT_FIELDS.some(d => d.id === field.id);
                            return `
                                <div class="toddler-growth-field" data-field-id="${field.id}">
                                    <div class="toddler-growth-field__color" style="background-color: ${field.color}"></div>
                                    <div class="toddler-growth-field__info">
                                        <span class="toddler-growth-field__name">${field.name}</span>
                                        <span class="toddler-growth-field__unit">${field.unit.metric} / ${field.unit.imperial}</span>
                                    </div>
                                    <div class="toddler-growth-field__actions">
                                        ${!isDefault ? `
                                            <button class="btn btn--ghost btn--sm" data-edit-field="${idx}" title="Edit">
                                                <i data-lucide="pencil"></i>
                                            </button>
                                            <button class="btn btn--ghost btn--sm" data-delete-field="${idx}" title="Delete">
                                                <i data-lucide="trash-2"></i>
                                            </button>
                                        ` : `
                                            <span class="toddler-growth-field__badge">Default</span>
                                        `}
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>

                    <div class="toddler-growth-actions">
                        <button class="btn btn--ghost btn--sm" id="toddlerResetFieldsBtn">
                            <i data-lucide="refresh-cw"></i> Reset to Defaults
                        </button>
                    </div>
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

        // Points - Add activity button
        container.querySelector('#kidsAddPointActivityBtn')?.addEventListener('click', () => {
            showAddPointActivityModal(selectedKidId, container);
        });

        // Points - Edit activity buttons
        container.querySelectorAll('[data-edit-point-activity]').forEach(btn => {
            btn.addEventListener('click', () => {
                showEditPointActivityModal(selectedKidId, btn.dataset.editPointActivity, container);
            });
        });

        // Points - Delete activity buttons
        container.querySelectorAll('[data-delete-point-activity]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const confirmed = await Modal.confirm('Are you sure you want to delete this activity?', 'Delete Activity');
                if (confirmed) {
                    deletePointActivity(selectedKidId, btn.dataset.deletePointActivity);
                    refreshKidsManagementSection(container);
                }
            });
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

        // Reset today's screen time usage
        container.querySelector('#kidsResetTodayScreenTimeBtn')?.addEventListener('click', async () => {
            const confirmed = await Modal.confirm('Reset today\'s screen time usage? This will clear today\'s logged time.', 'Reset Today\'s Usage');
            if (confirmed) {
                const screenData = Storage.getWidgetData(selectedKidId, 'screen-time') || {};
                const today = typeof DateUtils !== 'undefined' ? DateUtils.today() : new Date().toISOString().split('T')[0];
                if (screenData.log) {
                    delete screenData.log[today];
                }
                Storage.setWidgetData(selectedKidId, 'screen-time', screenData);
                Toast.success('Today\'s screen time reset');
            }
        });

        // Clear screen time history
        container.querySelector('#kidsResetScreenTimeLogBtn')?.addEventListener('click', async () => {
            const confirmed = await Modal.dangerConfirm('Clear all screen time usage history?', 'Clear All History');
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

        // Move & Play - Add activity button
        container.querySelector('#kidsAddMovePlayBtn')?.addEventListener('click', () => {
            showAddMovePlayActivityModal(selectedKidId, container);
        });

        // Move & Play - Edit activity buttons
        container.querySelectorAll('[data-edit-move-play]').forEach(btn => {
            btn.addEventListener('click', () => {
                showEditMovePlayActivityModal(selectedKidId, btn.dataset.editMovePlay, container);
            });
        });

        // Move & Play - Delete activity buttons
        container.querySelectorAll('[data-delete-move-play]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const confirmed = await Modal.confirm('Are you sure you want to delete this activity?', 'Delete Activity');
                if (confirmed) {
                    deleteMovePlayActivity(selectedKidId, btn.dataset.deleteMovePlay);
                    refreshKidsManagementSection(container);
                }
            });
        });

        // Move & Play - Weekly goal slider
        container.querySelector('#kidsMovePlayWeeklyGoal')?.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            const display = e.target.nextElementSibling;
            if (display) display.textContent = `${value} days`;
        });

        container.querySelector('#kidsMovePlayWeeklyGoal')?.addEventListener('change', (e) => {
            const value = parseInt(e.target.value);
            const workoutData = Storage.getWidgetData(selectedKidId, 'kid-workout') || { settings: {} };
            workoutData.settings = workoutData.settings || {};
            workoutData.settings.weeklyGoal = value;
            Storage.setWidgetData(selectedKidId, 'kid-workout', workoutData);
            Toast.success('Weekly goal updated');
        });

        // Move & Play - Reset to defaults
        container.querySelector('#kidsResetMovePlayBtn')?.addEventListener('click', async () => {
            const confirmed = await Modal.confirm(
                'This will reset all activities to the default set. Custom activities will be removed.',
                'Reset Activities'
            );
            if (confirmed) {
                resetMovePlayToDefaults(selectedKidId);
                refreshKidsManagementSection(container);
            }
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

        // === TODDLER TAB EVENTS ===

        // Add routine button
        container.querySelector('#toddlerAddRoutineBtn')?.addEventListener('click', () => {
            showAddToddlerRoutineModal(selectedKidId, container);
        });

        // Edit routine buttons
        container.querySelectorAll('[data-edit-routine]').forEach(btn => {
            btn.addEventListener('click', () => {
                showEditToddlerRoutineModal(selectedKidId, btn.dataset.editRoutine, container);
            });
        });

        // Delete routine buttons
        container.querySelectorAll('[data-delete-routine]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const confirmed = await Modal.confirm('Are you sure you want to delete this routine?', 'Delete Routine');
                if (confirmed) {
                    deleteToddlerRoutine(selectedKidId, btn.dataset.deleteRoutine);
                    refreshKidsManagementSection(container);
                }
            });
        });

        // Reset today's routine progress
        container.querySelector('#toddlerResetRoutinesBtn')?.addEventListener('click', async () => {
            const confirmed = await Modal.confirm('Reset today\'s routine progress?', 'Reset Progress');
            if (confirmed) {
                const routineData = Storage.getWidgetData(selectedKidId, 'toddler-routine') || {};
                const today = typeof DateUtils !== 'undefined' ? DateUtils.today() : new Date().toISOString().split('T')[0];
                if (routineData.completed) {
                    delete routineData.completed[today];
                }
                Storage.setWidgetData(selectedKidId, 'toddler-routine', routineData);
                Toast.success('Today\'s routine progress reset');
            }
        });

        // Add milestone button
        container.querySelector('#toddlerAddMilestoneBtn')?.addEventListener('click', () => {
            showAddToddlerMilestoneModal(selectedKidId, container);
        });

        // Edit milestone buttons
        container.querySelectorAll('[data-edit-milestone]').forEach(btn => {
            btn.addEventListener('click', () => {
                showEditToddlerMilestoneModal(selectedKidId, btn.dataset.editMilestone, container);
            });
        });

        // Delete milestone buttons
        container.querySelectorAll('[data-delete-milestone]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const confirmed = await Modal.confirm('Are you sure you want to delete this milestone?', 'Delete Milestone');
                if (confirmed) {
                    deleteToddlerMilestone(selectedKidId, btn.dataset.deleteMilestone);
                    refreshKidsManagementSection(container);
                }
            });
        });

        // === ACTIVITIES TAB EVENTS ===

        // Add activity button
        container.querySelector('#toddlerAddActivityBtn')?.addEventListener('click', () => {
            showAddToddlerActivityModal(selectedKidId, container);
        });

        // Delete activity buttons
        container.querySelectorAll('[data-delete-activity]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const [category, indexStr] = btn.dataset.deleteActivity.split(':');
                const index = parseInt(indexStr);
                const confirmed = await Modal.confirm('Remove this custom activity?', 'Remove Activity');
                if (confirmed) {
                    deleteToddlerActivity(selectedKidId, category, index);
                    refreshKidsManagementSection(container);
                }
            });
        });

        // Reset activities to defaults
        container.querySelector('#toddlerResetActivitiesBtn')?.addEventListener('click', async () => {
            const confirmed = await Modal.dangerConfirm('Remove all custom activities and reset to defaults?', 'Reset Activities');
            if (confirmed) {
                const activitiesData = Storage.getWidgetData(selectedKidId, 'activities') || {};
                activitiesData.customActivities = {};
                Storage.setWidgetData(selectedKidId, 'activities', activitiesData);
                Toast.success('Activities reset to defaults');
                refreshKidsManagementSection(container);
            }
        });

        // === GROWTH TAB EVENTS ===

        // Add growth field button
        container.querySelector('#toddlerAddFieldBtn')?.addEventListener('click', () => {
            showAddGrowthFieldModal(selectedKidId, container);
        });

        // Edit growth field buttons
        container.querySelectorAll('[data-edit-field]').forEach(btn => {
            btn.addEventListener('click', () => {
                showEditGrowthFieldModal(selectedKidId, parseInt(btn.dataset.editField), container);
            });
        });

        // Delete growth field buttons
        container.querySelectorAll('[data-delete-field]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const confirmed = await Modal.confirm('Remove this custom measurement field?', 'Remove Field');
                if (confirmed) {
                    deleteGrowthField(selectedKidId, parseInt(btn.dataset.deleteField));
                    refreshKidsManagementSection(container);
                }
            });
        });

        // Reset growth fields to defaults
        container.querySelector('#toddlerResetFieldsBtn')?.addEventListener('click', async () => {
            const confirmed = await Modal.dangerConfirm('Remove all custom measurement fields and reset to defaults?', 'Reset Fields');
            if (confirmed) {
                const growthData = Storage.getWidgetData(selectedKidId, 'growth-chart') || {};
                delete growthData.fields;
                Storage.setWidgetData(selectedKidId, 'growth-chart', growthData);
                Toast.success('Measurement fields reset to defaults');
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
     * Delete a point activity
     */
    function deletePointActivity(memberId, activityId) {
        const pointsData = Storage.getWidgetData(memberId, 'points') || { activities: [] };
        pointsData.activities = (pointsData.activities || []).filter(a => a.id !== activityId);
        Storage.setWidgetData(memberId, 'points', pointsData);
        Toast.success('Activity deleted');
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

    // === TODDLER HELPER FUNCTIONS ===

    /**
     * Delete a toddler routine
     */
    function deleteToddlerRoutine(memberId, routineId) {
        const routineData = Storage.getWidgetData(memberId, 'toddler-routine') || { routines: [] };
        routineData.routines = (routineData.routines || []).filter(r => r.id !== routineId);
        Storage.setWidgetData(memberId, 'toddler-routine', routineData);
        Toast.success('Routine deleted');
    }

    /**
     * Delete a toddler milestone
     */
    function deleteToddlerMilestone(memberId, milestoneId) {
        const milestonesData = Storage.getWidgetData(memberId, 'milestones') || { milestones: [] };
        milestonesData.milestones = (milestonesData.milestones || []).filter(m => m.id !== milestoneId);
        Storage.setWidgetData(memberId, 'milestones', milestonesData);
        Toast.success('Milestone deleted');
    }

    /**
     * Show Add Toddler Routine Modal
     */
    function showAddToddlerRoutineModal(memberId, container) {
        const routineIcons = ['sun', 'moon', 'utensils', 'baby', 'book', 'music', 'palette', 'bath', 'bed', 'heart', 'star', 'clock'];
        const routineColors = ['#6366F1', '#EC4899', '#10B981', '#F59E0B', '#3B82F6', '#8B5CF6', '#EF4444', '#14B8A6'];

        const content = `
            <form id="addToddlerRoutineForm">
                <div class="form-group">
                    <label class="form-label">Routine Name</label>
                    <input type="text" class="form-input" id="routineNameInput" placeholder="e.g., Morning nap" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Time (optional)</label>
                    <input type="time" class="form-input" id="routineTimeInput">
                </div>
                <div class="form-group">
                    <label class="form-label">Icon</label>
                    <div class="icon-selector">
                        ${routineIcons.map((icon, i) => `
                            <label class="icon-option">
                                <input type="radio" name="routineIcon" value="${icon}" ${i === 0 ? 'checked' : ''}>
                                <span class="icon-option__display"><i data-lucide="${icon}"></i></span>
                            </label>
                        `).join('')}
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Color</label>
                    <div class="color-selector">
                        ${routineColors.map((color, i) => `
                            <label class="color-option">
                                <input type="radio" name="routineColor" value="${color}" ${i === 0 ? 'checked' : ''}>
                                <span class="color-option__display" style="background-color: ${color}"></span>
                            </label>
                        `).join('')}
                    </div>
                </div>
            </form>
        `;

        Modal.open({
            title: 'Add Routine',
            content,
            onOpen: () => {
                if (typeof lucide !== 'undefined') lucide.createIcons();
            },
            buttons: [
                { text: 'Cancel', onClick: (close) => close() },
                {
                    text: 'Add Routine',
                    variant: 'primary',
                    onClick: (close) => {
                        const name = document.querySelector('#routineNameInput')?.value?.trim();
                        const time = document.querySelector('#routineTimeInput')?.value || '';
                        const icon = document.querySelector('input[name="routineIcon"]:checked')?.value || 'clock';
                        const color = document.querySelector('input[name="routineColor"]:checked')?.value || '#6366F1';

                        if (!name) {
                            Toast.error('Please enter a routine name');
                            return;
                        }

                        const routineData = Storage.getWidgetData(memberId, 'toddler-routine') || { routines: [] };
                        routineData.routines = routineData.routines || [];
                        routineData.routines.push({
                            id: `routine-${Date.now()}`,
                            title: name,
                            time,
                            icon,
                            color
                        });
                        Storage.setWidgetData(memberId, 'toddler-routine', routineData);
                        Toast.success('Routine added');
                        close();
                        refreshKidsManagementSection(container);
                    }
                }
            ]
        });
    }

    /**
     * Show Edit Toddler Routine Modal
     */
    function showEditToddlerRoutineModal(memberId, routineId, container) {
        const routineData = Storage.getWidgetData(memberId, 'toddler-routine') || { routines: [] };
        const routine = routineData.routines?.find(r => r.id === routineId);
        if (!routine) return;

        const routineIcons = ['sun', 'moon', 'utensils', 'baby', 'book', 'music', 'palette', 'bath', 'bed', 'heart', 'star', 'clock'];
        const routineColors = ['#6366F1', '#EC4899', '#10B981', '#F59E0B', '#3B82F6', '#8B5CF6', '#EF4444', '#14B8A6'];

        const content = `
            <form id="editToddlerRoutineForm">
                <div class="form-group">
                    <label class="form-label">Routine Name</label>
                    <input type="text" class="form-input" id="routineNameInput" value="${routine.title || routine.name || ''}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Time (optional)</label>
                    <input type="time" class="form-input" id="routineTimeInput" value="${routine.time || ''}">
                </div>
                <div class="form-group">
                    <label class="form-label">Icon</label>
                    <div class="icon-selector">
                        ${routineIcons.map(icon => `
                            <label class="icon-option">
                                <input type="radio" name="routineIcon" value="${icon}" ${icon === routine.icon ? 'checked' : ''}>
                                <span class="icon-option__display"><i data-lucide="${icon}"></i></span>
                            </label>
                        `).join('')}
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Color</label>
                    <div class="color-selector">
                        ${routineColors.map(color => `
                            <label class="color-option">
                                <input type="radio" name="routineColor" value="${color}" ${color === routine.color ? 'checked' : ''}>
                                <span class="color-option__display" style="background-color: ${color}"></span>
                            </label>
                        `).join('')}
                    </div>
                </div>
            </form>
        `;

        Modal.open({
            title: 'Edit Routine',
            content,
            onOpen: () => {
                if (typeof lucide !== 'undefined') lucide.createIcons();
            },
            buttons: [
                { text: 'Cancel', onClick: (close) => close() },
                {
                    text: 'Save Changes',
                    variant: 'primary',
                    onClick: (close) => {
                        const name = document.querySelector('#routineNameInput')?.value?.trim();
                        const time = document.querySelector('#routineTimeInput')?.value || '';
                        const icon = document.querySelector('input[name="routineIcon"]:checked')?.value || 'clock';
                        const color = document.querySelector('input[name="routineColor"]:checked')?.value || '#6366F1';

                        if (!name) {
                            Toast.error('Please enter a routine name');
                            return;
                        }

                        routine.title = name;
                        routine.time = time;
                        routine.icon = icon;
                        routine.color = color;
                        Storage.setWidgetData(memberId, 'toddler-routine', routineData);
                        Toast.success('Routine updated');
                        close();
                        refreshKidsManagementSection(container);
                    }
                }
            ]
        });
    }

    /**
     * Show Add Toddler Milestone Modal
     */
    function showAddToddlerMilestoneModal(memberId, container) {
        const content = `
            <form id="addToddlerMilestoneForm">
                <div class="form-group">
                    <label class="form-label">Milestone</label>
                    <input type="text" class="form-input" id="milestoneNameInput" placeholder="e.g., First steps" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Category (optional)</label>
                    <select class="form-input" id="milestoneCategoryInput">
                        <option value="">Select category...</option>
                        <option value="motor">Motor Skills</option>
                        <option value="language">Language</option>
                        <option value="social">Social & Emotional</option>
                        <option value="cognitive">Cognitive</option>
                        <option value="self-care">Self-Care</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">
                        <input type="checkbox" id="milestoneAchievedInput">
                        Already achieved
                    </label>
                </div>
            </form>
        `;

        Modal.open({
            title: 'Add Milestone',
            content,
            buttons: [
                { text: 'Cancel', onClick: (close) => close() },
                {
                    text: 'Add Milestone',
                    variant: 'primary',
                    onClick: (close) => {
                        const name = document.querySelector('#milestoneNameInput')?.value?.trim();
                        const category = document.querySelector('#milestoneCategoryInput')?.value || '';
                        const achieved = document.querySelector('#milestoneAchievedInput')?.checked || false;

                        if (!name) {
                            Toast.error('Please enter a milestone');
                            return;
                        }

                        const milestonesData = Storage.getWidgetData(memberId, 'milestones') || { milestones: [] };
                        milestonesData.milestones = milestonesData.milestones || [];
                        const today = typeof DateUtils !== 'undefined' ? DateUtils.today() : new Date().toISOString().split('T')[0];

                        milestonesData.milestones.push({
                            id: `milestone-${Date.now()}`,
                            name,
                            category,
                            achieved,
                            achievedDate: achieved ? today : null
                        });
                        Storage.setWidgetData(memberId, 'milestones', milestonesData);
                        Toast.success('Milestone added');
                        close();
                        refreshKidsManagementSection(container);
                    }
                }
            ]
        });
    }

    /**
     * Show Edit Toddler Milestone Modal
     */
    function showEditToddlerMilestoneModal(memberId, milestoneId, container) {
        const milestonesData = Storage.getWidgetData(memberId, 'milestones') || { milestones: [] };
        const milestone = milestonesData.milestones?.find(m => m.id === milestoneId);
        if (!milestone) return;

        const content = `
            <form id="editToddlerMilestoneForm">
                <div class="form-group">
                    <label class="form-label">Milestone</label>
                    <input type="text" class="form-input" id="editMilestoneNameInput" value="${milestone.name || ''}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Category (optional)</label>
                    <select class="form-input" id="editMilestoneCategoryInput">
                        <option value="">Select category...</option>
                        <option value="motor" ${milestone.category === 'motor' ? 'selected' : ''}>Motor Skills</option>
                        <option value="language" ${milestone.category === 'language' ? 'selected' : ''}>Language</option>
                        <option value="social" ${milestone.category === 'social' ? 'selected' : ''}>Social & Emotional</option>
                        <option value="cognitive" ${milestone.category === 'cognitive' ? 'selected' : ''}>Cognitive</option>
                        <option value="self-care" ${milestone.category === 'self-care' ? 'selected' : ''}>Self-Care</option>
                    </select>
                </div>
            </form>
        `;

        Modal.open({
            title: 'Edit Milestone',
            content,
            buttons: [
                { text: 'Cancel', onClick: (close) => close() },
                {
                    text: 'Save',
                    variant: 'primary',
                    onClick: (close) => {
                        const name = document.querySelector('#editMilestoneNameInput')?.value?.trim();
                        const category = document.querySelector('#editMilestoneCategoryInput')?.value || '';

                        if (!name) {
                            Toast.error('Please enter a milestone');
                            return;
                        }

                        const milestoneIndex = milestonesData.milestones.findIndex(m => m.id === milestoneId);
                        if (milestoneIndex >= 0) {
                            milestonesData.milestones[milestoneIndex].name = name;
                            milestonesData.milestones[milestoneIndex].category = category;
                            Storage.setWidgetData(memberId, 'milestones', milestonesData);
                            Toast.success('Milestone updated');
                        }
                        close();
                        refreshKidsManagementSection(container);
                    }
                }
            ]
        });
    }

    /**
     * Show Add Toddler Activity Modal
     */
    function showAddToddlerActivityModal(memberId, container) {
        const categories = {
            sensory: 'Sensory Play',
            motor: 'Motor Skills',
            creative: 'Creative',
            learning: 'Learning',
            outdoor: 'Outdoor'
        };

        const content = `
            <form id="addToddlerActivityForm">
                <div class="form-group">
                    <label class="form-label">Activity Name</label>
                    <input type="text" class="form-input" id="activityNameInput" placeholder="e.g., Play with blocks" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Category</label>
                    <select class="form-input" id="activityCategoryInput" required>
                        ${Object.entries(categories).map(([key, name]) => `
                            <option value="${key}">${name}</option>
                        `).join('')}
                    </select>
                </div>
            </form>
        `;

        Modal.open({
            title: 'Add Custom Activity',
            content,
            buttons: [
                { text: 'Cancel', onClick: (close) => close() },
                {
                    text: 'Add Activity',
                    variant: 'primary',
                    onClick: (close) => {
                        const name = document.querySelector('#activityNameInput')?.value?.trim();
                        const category = document.querySelector('#activityCategoryInput')?.value;

                        if (!name) {
                            Toast.error('Please enter an activity name');
                            return;
                        }

                        const activitiesData = Storage.getWidgetData(memberId, 'activities') || {};
                        activitiesData.customActivities = activitiesData.customActivities || {};
                        activitiesData.customActivities[category] = activitiesData.customActivities[category] || [];
                        activitiesData.customActivities[category].push(name);
                        Storage.setWidgetData(memberId, 'activities', activitiesData);
                        Toast.success('Activity added');
                        close();
                        refreshKidsManagementSection(container);
                    }
                }
            ]
        });
    }

    /**
     * Delete a toddler custom activity
     */
    function deleteToddlerActivity(memberId, category, index) {
        const activitiesData = Storage.getWidgetData(memberId, 'activities') || {};
        if (activitiesData.customActivities?.[category]) {
            activitiesData.customActivities[category].splice(index, 1);
            Storage.setWidgetData(memberId, 'activities', activitiesData);
            Toast.success('Activity removed');
        }
    }

    /**
     * Delete a growth chart field
     */
    function deleteGrowthField(memberId, fieldIndex) {
        const DEFAULT_FIELDS = [
            { id: 'height', name: 'Height', unit: { metric: 'cm', imperial: 'in' }, color: '#6366F1' },
            { id: 'weight', name: 'Weight', unit: { metric: 'kg', imperial: 'lbs' }, color: '#22C55E' },
            { id: 'head', name: 'Head Circumference', unit: { metric: 'cm', imperial: 'in' }, color: '#F59E0B' }
        ];

        const growthData = Storage.getWidgetData(memberId, 'growth-chart') || {};
        const fields = growthData.fields || DEFAULT_FIELDS;

        // Check if trying to delete a default field
        const fieldToDelete = fields[fieldIndex];
        if (fieldToDelete && DEFAULT_FIELDS.some(d => d.id === fieldToDelete.id)) {
            Toast.error('Cannot delete default measurement fields');
            return;
        }

        fields.splice(fieldIndex, 1);
        growthData.fields = fields;
        Storage.setWidgetData(memberId, 'growth-chart', growthData);
        Toast.success('Measurement field deleted');
    }

    /**
     * Show Add Growth Field Modal
     */
    function showAddGrowthFieldModal(memberId, container) {
        const fieldColors = ['#6366F1', '#EC4899', '#10B981', '#F59E0B', '#3B82F6', '#8B5CF6', '#EF4444', '#14B8A6', '#F97316', '#84CC16'];

        const content = `
            <form id="addGrowthFieldForm">
                <div class="form-group">
                    <label class="form-label">Field Name</label>
                    <input type="text" class="form-input" id="fieldNameInput" placeholder="e.g., Chest Circumference" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Metric Unit</label>
                    <input type="text" class="form-input" id="fieldMetricInput" placeholder="e.g., cm" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Imperial Unit</label>
                    <input type="text" class="form-input" id="fieldImperialInput" placeholder="e.g., in" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Color</label>
                    <div class="color-selector">
                        ${fieldColors.map((color, i) => `
                            <label class="color-option">
                                <input type="radio" name="fieldColor" value="${color}" ${i === 0 ? 'checked' : ''}>
                                <span class="color-option__display" style="background-color: ${color}"></span>
                            </label>
                        `).join('')}
                    </div>
                </div>
            </form>
        `;

        Modal.open({
            title: 'Add Measurement Field',
            content,
            buttons: [
                { text: 'Cancel', onClick: (close) => close() },
                {
                    text: 'Add Field',
                    variant: 'primary',
                    onClick: (close) => {
                        const name = document.querySelector('#fieldNameInput')?.value?.trim();
                        const metric = document.querySelector('#fieldMetricInput')?.value?.trim();
                        const imperial = document.querySelector('#fieldImperialInput')?.value?.trim();
                        const color = document.querySelector('input[name="fieldColor"]:checked')?.value || '#6366F1';

                        if (!name) {
                            Toast.error('Please enter a field name');
                            return;
                        }
                        if (!metric || !imperial) {
                            Toast.error('Please enter both metric and imperial units');
                            return;
                        }

                        const DEFAULT_FIELDS = [
                            { id: 'height', name: 'Height', unit: { metric: 'cm', imperial: 'in' }, color: '#6366F1' },
                            { id: 'weight', name: 'Weight', unit: { metric: 'kg', imperial: 'lbs' }, color: '#22C55E' },
                            { id: 'head', name: 'Head Circumference', unit: { metric: 'cm', imperial: 'in' }, color: '#F59E0B' }
                        ];

                        const growthData = Storage.getWidgetData(memberId, 'growth-chart') || {};
                        growthData.fields = growthData.fields || [...DEFAULT_FIELDS];

                        growthData.fields.push({
                            id: `custom-${Date.now()}`,
                            name,
                            unit: { metric, imperial },
                            color
                        });

                        Storage.setWidgetData(memberId, 'growth-chart', growthData);
                        Toast.success('Measurement field added');
                        close();
                        refreshKidsManagementSection(container);
                    }
                }
            ]
        });
    }

    /**
     * Show Edit Growth Field Modal
     */
    function showEditGrowthFieldModal(memberId, fieldIndex, container) {
        const DEFAULT_FIELDS = [
            { id: 'height', name: 'Height', unit: { metric: 'cm', imperial: 'in' }, color: '#6366F1' },
            { id: 'weight', name: 'Weight', unit: { metric: 'kg', imperial: 'lbs' }, color: '#22C55E' },
            { id: 'head', name: 'Head Circumference', unit: { metric: 'cm', imperial: 'in' }, color: '#F59E0B' }
        ];

        const growthData = Storage.getWidgetData(memberId, 'growth-chart') || {};
        const fields = growthData.fields || DEFAULT_FIELDS;
        const field = fields[fieldIndex];

        if (!field) return;

        // Don't allow editing default fields
        if (DEFAULT_FIELDS.some(d => d.id === field.id)) {
            Toast.error('Cannot edit default measurement fields');
            return;
        }

        const fieldColors = ['#6366F1', '#EC4899', '#10B981', '#F59E0B', '#3B82F6', '#8B5CF6', '#EF4444', '#14B8A6', '#F97316', '#84CC16'];

        const content = `
            <form id="editGrowthFieldForm">
                <div class="form-group">
                    <label class="form-label">Field Name</label>
                    <input type="text" class="form-input" id="fieldNameInput" value="${field.name}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Metric Unit</label>
                    <input type="text" class="form-input" id="fieldMetricInput" value="${field.unit.metric}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Imperial Unit</label>
                    <input type="text" class="form-input" id="fieldImperialInput" value="${field.unit.imperial}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Color</label>
                    <div class="color-selector">
                        ${fieldColors.map(color => `
                            <label class="color-option">
                                <input type="radio" name="fieldColor" value="${color}" ${color === field.color ? 'checked' : ''}>
                                <span class="color-option__display" style="background-color: ${color}"></span>
                            </label>
                        `).join('')}
                    </div>
                </div>
            </form>
        `;

        Modal.open({
            title: 'Edit Measurement Field',
            content,
            buttons: [
                { text: 'Cancel', onClick: (close) => close() },
                {
                    text: 'Save Changes',
                    variant: 'primary',
                    onClick: (close) => {
                        const name = document.querySelector('#fieldNameInput')?.value?.trim();
                        const metric = document.querySelector('#fieldMetricInput')?.value?.trim();
                        const imperial = document.querySelector('#fieldImperialInput')?.value?.trim();
                        const color = document.querySelector('input[name="fieldColor"]:checked')?.value || '#6366F1';

                        if (!name) {
                            Toast.error('Please enter a field name');
                            return;
                        }
                        if (!metric || !imperial) {
                            Toast.error('Please enter both metric and imperial units');
                            return;
                        }

                        fields[fieldIndex] = {
                            ...field,
                            name,
                            unit: { metric, imperial },
                            color
                        };

                        growthData.fields = fields;
                        Storage.setWidgetData(memberId, 'growth-chart', growthData);
                        Toast.success('Measurement field updated');
                        close();
                        refreshKidsManagementSection(container);
                    }
                }
            ]
        });
    }

    /**
     * Show Add Point Activity Modal
     */
    function showAddPointActivityModal(memberId, container) {
        const activityEmojis = [
            '🦷', '🚿', '🛁', '🧼', '🛏️', '🧹', '🍽️', '🗑️',
            '📚', '✏️', '📖', '🎨', '🎵', '🏃', '💪', '🥗',
            '🍎', '💧', '😊', '🤝', '💝', '🐕', '🌟', '✨'
        ];
        const categories = [
            { id: 'hygiene', name: 'Hygiene', color: '#3B82F6' },
            { id: 'chores', name: 'Chores', color: '#10B981' },
            { id: 'school', name: 'School', color: '#8B5CF6' },
            { id: 'health', name: 'Health', color: '#EF4444' },
            { id: 'kindness', name: 'Kindness', color: '#EC4899' },
            { id: 'custom', name: 'Other', color: '#F59E0B' }
        ];

        const content = `
            <form id="addPointActivityForm">
                <div class="form-group">
                    <label class="form-label">Activity Name</label>
                    <input type="text" class="form-input" id="activityNameInput" placeholder="e.g., Brush teeth" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Points</label>
                    <input type="number" class="form-input" id="activityPointsInput" value="5" min="1" max="100">
                </div>
                <div class="form-group">
                    <label class="form-label">Category</label>
                    <select class="form-select" id="activityCategoryInput">
                        ${categories.map((cat, i) => `
                            <option value="${cat.id}" ${i === 0 ? 'selected' : ''}>${cat.name}</option>
                        `).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Emoji</label>
                    <div class="activity-emoji-picker" id="settingsActivityEmojiPicker">
                        ${activityEmojis.map((emoji, i) => `
                            <button type="button" class="activity-emoji-picker__btn ${i === 0 ? 'activity-emoji-picker__btn--selected' : ''}" data-emoji="${emoji}">
                                ${emoji}
                            </button>
                        `).join('')}
                    </div>
                    <input type="hidden" id="activityEmojiInput" value="${activityEmojis[0]}">
                </div>
            </form>
        `;

        Modal.open({
            title: 'Add Point Activity',
            content,
            footer: Modal.createFooter('Cancel', 'Add Activity')
        });

        // Emoji selection
        document.querySelectorAll('#settingsActivityEmojiPicker .activity-emoji-picker__btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#settingsActivityEmojiPicker .activity-emoji-picker__btn').forEach(b => b.classList.remove('activity-emoji-picker__btn--selected'));
                btn.classList.add('activity-emoji-picker__btn--selected');
                document.getElementById('activityEmojiInput').value = btn.dataset.emoji;
            });
        });

        Modal.bindFooterEvents(() => {
            const name = document.getElementById('activityNameInput')?.value.trim();
            const points = parseInt(document.getElementById('activityPointsInput')?.value) || 5;
            const emoji = document.getElementById('activityEmojiInput')?.value || '🌟';
            const category = document.getElementById('activityCategoryInput')?.value || 'custom';

            if (!name) {
                Toast.error('Please enter an activity name');
                return false;
            }

            const pointsData = Storage.getWidgetData(memberId, 'points') || { activities: [] };
            pointsData.activities = pointsData.activities || [];
            pointsData.activities.push({
                id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                name,
                points,
                emoji,
                category
            });
            Storage.setWidgetData(memberId, 'points', pointsData);
            Toast.success('Activity added');
            refreshKidsManagementSection(container);
            return true;
        });
    }

    /**
     * Show Edit Point Activity Modal
     */
    function showEditPointActivityModal(memberId, activityId, container) {
        const pointsData = Storage.getWidgetData(memberId, 'points') || { activities: [] };
        const activity = (pointsData.activities || []).find(a => a.id === activityId);
        if (!activity) return;

        const activityEmojis = [
            '🦷', '🚿', '🛁', '🧼', '🛏️', '🧹', '🍽️', '🗑️',
            '📚', '✏️', '📖', '🎨', '🎵', '🏃', '💪', '🥗',
            '🍎', '💧', '😊', '🤝', '💝', '🐕', '🌟', '✨'
        ];
        const categories = [
            { id: 'hygiene', name: 'Hygiene', color: '#3B82F6' },
            { id: 'chores', name: 'Chores', color: '#10B981' },
            { id: 'school', name: 'School', color: '#8B5CF6' },
            { id: 'health', name: 'Health', color: '#EF4444' },
            { id: 'kindness', name: 'Kindness', color: '#EC4899' },
            { id: 'custom', name: 'Other', color: '#F59E0B' }
        ];

        const content = `
            <form id="editPointActivityForm">
                <div class="form-group">
                    <label class="form-label">Activity Name</label>
                    <input type="text" class="form-input" id="activityNameInput" value="${activity.name}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Points</label>
                    <input type="number" class="form-input" id="activityPointsInput" value="${activity.points}" min="1" max="100">
                </div>
                <div class="form-group">
                    <label class="form-label">Category</label>
                    <select class="form-select" id="activityCategoryInput">
                        ${categories.map(cat => `
                            <option value="${cat.id}" ${cat.id === activity.category ? 'selected' : ''}>${cat.name}</option>
                        `).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Emoji</label>
                    <div class="activity-emoji-picker" id="settingsEditActivityEmojiPicker">
                        ${activityEmojis.map(emoji => `
                            <button type="button" class="activity-emoji-picker__btn ${emoji === activity.emoji ? 'activity-emoji-picker__btn--selected' : ''}" data-emoji="${emoji}">
                                ${emoji}
                            </button>
                        `).join('')}
                    </div>
                    <input type="hidden" id="activityEmojiInput" value="${activity.emoji || activityEmojis[0]}">
                </div>
            </form>
        `;

        Modal.open({
            title: 'Edit Activity',
            content,
            footer: Modal.createFooter('Cancel', 'Save Changes')
        });

        // Emoji selection
        document.querySelectorAll('#settingsEditActivityEmojiPicker .activity-emoji-picker__btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#settingsEditActivityEmojiPicker .activity-emoji-picker__btn').forEach(b => b.classList.remove('activity-emoji-picker__btn--selected'));
                btn.classList.add('activity-emoji-picker__btn--selected');
                document.getElementById('activityEmojiInput').value = btn.dataset.emoji;
            });
        });

        Modal.bindFooterEvents(() => {
            const name = document.getElementById('activityNameInput')?.value.trim();
            const points = parseInt(document.getElementById('activityPointsInput')?.value) || 5;
            const emoji = document.getElementById('activityEmojiInput')?.value || '🌟';
            const category = document.getElementById('activityCategoryInput')?.value || 'custom';

            if (!name) {
                Toast.error('Please enter an activity name');
                return false;
            }

            // Update the activity
            const idx = pointsData.activities.findIndex(a => a.id === activityId);
            if (idx !== -1) {
                pointsData.activities[idx] = { ...pointsData.activities[idx], name, points, emoji, category };
                Storage.setWidgetData(memberId, 'points', pointsData);
                Toast.success('Activity updated');
                refreshKidsManagementSection(container);
            }
            return true;
        });
    }

    /**
     * Show Add Chore Modal
     */
    function showAddChoreModal(memberId, container) {
        const choreEmojis = [
            '🛏️', '🧹', '🍽️', '🐕', '🗑️', '✨', '🌱', '🧸',
            '👕', '💨', '💧', '🧺', '🐾', '🐟', '🚗', '🚴',
            '🍃', '🌞', '🌙', '⭐', '📦', '🧽', '🪣', '🧤'
        ];
        const choreColors = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#EF4444', '#14B8A6', '#6366F1'];

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
                    <label class="form-label">Emoji</label>
                    <div class="chore-emoji-picker" id="settingsChoreEmojiPicker">
                        ${choreEmojis.map((emoji, i) => `
                            <button type="button" class="chore-emoji-picker__btn ${i === 0 ? 'chore-emoji-picker__btn--selected' : ''}" data-emoji="${emoji}">
                                ${emoji}
                            </button>
                        `).join('')}
                    </div>
                    <input type="hidden" id="choreEmojiInput" value="${choreEmojis[0]}">
                </div>
                <div class="form-group">
                    <label class="form-label">Color</label>
                    <div class="color-selector">
                        ${choreColors.map((color, i) => `
                            <label class="color-option">
                                <input type="radio" name="choreColor" value="${color}" ${i === 0 ? 'checked' : ''}>
                                <span class="color-option__display" style="background-color: ${color}"></span>
                            </label>
                        `).join('')}
                    </div>
                </div>
            </form>
        `;

        Modal.open({
            title: 'Add Chore',
            content,
            footer: Modal.createFooter('Cancel', 'Add Chore')
        });

        // Emoji selection
        document.querySelectorAll('#settingsChoreEmojiPicker .chore-emoji-picker__btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#settingsChoreEmojiPicker .chore-emoji-picker__btn').forEach(b => b.classList.remove('chore-emoji-picker__btn--selected'));
                btn.classList.add('chore-emoji-picker__btn--selected');
                document.getElementById('choreEmojiInput').value = btn.dataset.emoji;
            });
        });

        Modal.bindFooterEvents(() => {
            const name = document.getElementById('choreNameInput')?.value.trim();
            const points = parseInt(document.getElementById('chorePointsInput')?.value) || 5;
            const emoji = document.getElementById('choreEmojiInput')?.value || '🧹';
            const color = document.querySelector('input[name="choreColor"]:checked')?.value || '#8B5CF6';

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
                emoji,
                color
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

        const choreEmojis = [
            '🛏️', '🧹', '🍽️', '🐕', '🗑️', '✨', '🌱', '🧸',
            '👕', '💨', '💧', '🧺', '🐾', '🐟', '🚗', '🚴',
            '🍃', '🌞', '🌙', '⭐', '📦', '🧽', '🪣', '🧤'
        ];
        const choreColors = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#EF4444', '#14B8A6', '#6366F1'];

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
                    <label class="form-label">Emoji</label>
                    <div class="chore-emoji-picker" id="settingsEditChoreEmojiPicker">
                        ${choreEmojis.map(emoji => `
                            <button type="button" class="chore-emoji-picker__btn ${emoji === chore.emoji ? 'chore-emoji-picker__btn--selected' : ''}" data-emoji="${emoji}">
                                ${emoji}
                            </button>
                        `).join('')}
                    </div>
                    <input type="hidden" id="choreEmojiInput" value="${chore.emoji || choreEmojis[0]}">
                </div>
                <div class="form-group">
                    <label class="form-label">Color</label>
                    <div class="color-selector">
                        ${choreColors.map(color => `
                            <label class="color-option">
                                <input type="radio" name="choreColor" value="${color}" ${color === (chore.color || '#8B5CF6') ? 'checked' : ''}>
                                <span class="color-option__display" style="background-color: ${color}"></span>
                            </label>
                        `).join('')}
                    </div>
                </div>
            </form>
        `;

        Modal.open({
            title: 'Edit Chore',
            content,
            footer: Modal.createFooter('Cancel', 'Save Changes')
        });

        // Emoji selection
        document.querySelectorAll('#settingsEditChoreEmojiPicker .chore-emoji-picker__btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#settingsEditChoreEmojiPicker .chore-emoji-picker__btn').forEach(b => b.classList.remove('chore-emoji-picker__btn--selected'));
                btn.classList.add('chore-emoji-picker__btn--selected');
                document.getElementById('choreEmojiInput').value = btn.dataset.emoji;
            });
        });

        Modal.bindFooterEvents(() => {
            const name = document.getElementById('choreNameInput')?.value.trim();
            const points = parseInt(document.getElementById('chorePointsInput')?.value) || 5;
            const emoji = document.getElementById('choreEmojiInput')?.value || '🧹';
            const color = document.querySelector('input[name="choreColor"]:checked')?.value || '#8B5CF6';

            if (!name) {
                Toast.error('Please enter a chore name');
                return false;
            }

            const index = choresData.chorePool.findIndex(c => c.id === choreId);
            if (index !== -1) {
                choresData.chorePool[index] = { ...choresData.chorePool[index], name, points, emoji, color };
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
        const rewardEmojis = [
            '📺', '🎮', '🍽️', '🌙', '🍦', '🎬', '🎁', '🎉',
            '🍕', '🧸', '🎈', '🛍️', '🚴', '⭐', '💖', '✨',
            '🎵', '📱', '🍫', '🎂', '🏆', '👑', '🌈', '🎪'
        ];
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
                    <label class="form-label">Emoji</label>
                    <div class="reward-emoji-picker" id="settingsRewardEmojiPicker">
                        ${rewardEmojis.map((emoji, i) => `
                            <button type="button" class="reward-emoji-picker__btn ${i === 0 ? 'reward-emoji-picker__btn--selected' : ''}" data-emoji="${emoji}">
                                ${emoji}
                            </button>
                        `).join('')}
                    </div>
                    <input type="hidden" id="rewardEmojiInput" value="${rewardEmojis[0]}">
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

        // Emoji selection
        document.querySelectorAll('#settingsRewardEmojiPicker .reward-emoji-picker__btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#settingsRewardEmojiPicker .reward-emoji-picker__btn').forEach(b => b.classList.remove('reward-emoji-picker__btn--selected'));
                btn.classList.add('reward-emoji-picker__btn--selected');
                document.getElementById('rewardEmojiInput').value = btn.dataset.emoji;
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
            const emoji = document.getElementById('rewardEmojiInput')?.value || '🎁';
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
                emoji,
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

        const rewardEmojis = [
            '📺', '🎮', '🍽️', '🌙', '🍦', '🎬', '🎁', '🎉',
            '🍕', '🧸', '🎈', '🛍️', '🚴', '⭐', '💖', '✨',
            '🎵', '📱', '🍫', '🎂', '🏆', '👑', '🌈', '🎪'
        ];
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
                    <label class="form-label">Emoji</label>
                    <div class="reward-emoji-picker" id="settingsEditRewardEmojiPicker">
                        ${rewardEmojis.map(emoji => `
                            <button type="button" class="reward-emoji-picker__btn ${emoji === reward.emoji ? 'reward-emoji-picker__btn--selected' : ''}" data-emoji="${emoji}">
                                ${emoji}
                            </button>
                        `).join('')}
                    </div>
                    <input type="hidden" id="rewardEmojiInput" value="${reward.emoji || rewardEmojis[0]}">
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

        // Emoji selection
        document.querySelectorAll('#settingsEditRewardEmojiPicker .reward-emoji-picker__btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#settingsEditRewardEmojiPicker .reward-emoji-picker__btn').forEach(b => b.classList.remove('reward-emoji-picker__btn--selected'));
                btn.classList.add('reward-emoji-picker__btn--selected');
                document.getElementById('rewardEmojiInput').value = btn.dataset.emoji;
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
            const emoji = document.getElementById('rewardEmojiInput')?.value || '🎁';
            const color = document.getElementById('rewardColorInput')?.value || '#3B82F6';

            if (!name) {
                Toast.error('Please enter a reward name');
                return false;
            }

            const index = rewardsData.rewards.findIndex(r => r.id === rewardId);
            if (index !== -1) {
                rewardsData.rewards[index] = { ...rewardsData.rewards[index], name, cost, emoji, color };
                Storage.setWidgetData(memberId, 'rewards', rewardsData);
                Toast.success('Reward updated');
                refreshKidsManagementSection(container);
            }
            return true;
        });
    }

    /**
     * Show Add Move & Play Activity Modal
     */
    function showAddMovePlayActivityModal(memberId, container) {
        const emojiOptions = ['🏃', '🏊', '🚴', '⚽', '🏀', '💃', '🧘', '🥾', '⛸️', '🎾', '🏓', '🎯', '🤸', '🏋️', '🚶', '🛹', '⚾', '🏈', '🎳', '🧗', '🤾', '🏇', '🥊', '🤼', '🛝', '🪢'];
        const categories = [
            { id: 'active', name: 'Active Play', color: '#F59E0B' },
            { id: 'sports', name: 'Sports', color: '#3B82F6' },
            { id: 'outdoor', name: 'Outdoor', color: '#10B981' },
            { id: 'dance', name: 'Dance & Move', color: '#EC4899' },
            { id: 'custom', name: 'Other', color: '#8B5CF6' }
        ];

        Modal.open({
            title: 'Add Activity',
            content: `
                <form id="addMovePlayForm" class="modal-form">
                    <div class="form-group">
                        <label class="form-label">Emoji</label>
                        <div class="emoji-selector" id="emojiSelector">
                            ${emojiOptions.map((e, i) => `
                                <button type="button" class="emoji-selector__btn ${i === 0 ? 'emoji-selector__btn--active' : ''}" data-emoji="${e}">${e}</button>
                            `).join('')}
                        </div>
                        <input type="hidden" name="emoji" id="selectedEmoji" value="${emojiOptions[0]}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Activity Name</label>
                        <input type="text" name="name" class="form-input" placeholder="e.g., Trampoline" required maxlength="30">
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Duration (minutes)</label>
                            <input type="number" name="duration" class="form-input" value="15" min="5" max="120" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Points</label>
                            <input type="number" name="points" class="form-input" value="10" min="1" max="50" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Category</label>
                        <div class="category-selector">
                            ${categories.map((cat, i) => `
                                <label class="category-selector__item">
                                    <input type="radio" name="category" value="${cat.id}" ${i === 0 ? 'checked' : ''}>
                                    <span class="category-selector__label" style="--cat-color: ${cat.color}">${cat.name}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                </form>
            `,
            buttons: [
                { text: 'Cancel', variant: 'secondary', onClick: (close) => close() },
                { text: 'Add Activity', variant: 'primary', onClick: (close) => {
                    const form = document.getElementById('addMovePlayForm');
                    const name = form.querySelector('[name="name"]').value.trim();
                    const duration = parseInt(form.querySelector('[name="duration"]').value) || 15;
                    const points = parseInt(form.querySelector('[name="points"]').value) || 10;
                    const emoji = form.querySelector('#selectedEmoji').value;
                    const category = form.querySelector('[name="category"]:checked')?.value || 'custom';

                    if (!name) {
                        Toast.error('Please enter an activity name');
                        return;
                    }

                    // Add activity using KidWorkout module
                    if (typeof KidWorkout !== 'undefined') {
                        KidWorkout.addCustomActivity(memberId, { name, duration, points, emoji, category });
                    } else {
                        const workoutData = Storage.getWidgetData(memberId, 'kid-workout') || { activities: [] };
                        workoutData.activities = workoutData.activities || [];
                        workoutData.activities.push({
                            id: `custom-${Date.now()}`,
                            name, duration, points, emoji, category,
                            isCustom: true
                        });
                        Storage.setWidgetData(memberId, 'kid-workout', workoutData);
                    }

                    Toast.success(`"${name}" added!`);
                    close();
                    refreshKidsManagementSection(container);
                }}
            ]
        });

        // Bind emoji selection after modal opens
        setTimeout(() => {
            document.querySelectorAll('#emojiSelector .emoji-selector__btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    document.querySelectorAll('#emojiSelector .emoji-selector__btn').forEach(b => b.classList.remove('emoji-selector__btn--active'));
                    btn.classList.add('emoji-selector__btn--active');
                    document.querySelector('#selectedEmoji').value = btn.dataset.emoji;
                });
            });
        }, 100);
    }

    /**
     * Show Edit Move & Play Activity Modal
     */
    function showEditMovePlayActivityModal(memberId, activityId, container) {
        const workoutData = typeof KidWorkout !== 'undefined'
            ? KidWorkout.getWidgetData(memberId)
            : Storage.getWidgetData(memberId, 'kid-workout') || { activities: [] };

        const activity = workoutData.activities?.find(a => a.id === activityId);
        if (!activity) {
            Toast.error('Activity not found');
            return;
        }

        const emojiOptions = ['🏃', '🏊', '🚴', '⚽', '🏀', '💃', '🧘', '🥾', '⛸️', '🎾', '🏓', '🎯', '🤸', '🏋️', '🚶', '🛹', '⚾', '🏈', '🎳', '🧗', '🤾', '🏇', '🥊', '🤼', '🛝', '🪢'];
        const categories = [
            { id: 'active', name: 'Active Play', color: '#F59E0B' },
            { id: 'sports', name: 'Sports', color: '#3B82F6' },
            { id: 'outdoor', name: 'Outdoor', color: '#10B981' },
            { id: 'dance', name: 'Dance & Move', color: '#EC4899' },
            { id: 'custom', name: 'Other', color: '#8B5CF6' }
        ];

        const currentEmoji = activity.emoji || '🏃';

        Modal.open({
            title: 'Edit Activity',
            content: `
                <form id="editMovePlayForm" class="modal-form">
                    <div class="form-group">
                        <label class="form-label">Emoji</label>
                        <div class="emoji-selector" id="emojiSelector">
                            ${emojiOptions.map(e => `
                                <button type="button" class="emoji-selector__btn ${e === currentEmoji ? 'emoji-selector__btn--active' : ''}" data-emoji="${e}">${e}</button>
                            `).join('')}
                        </div>
                        <input type="hidden" name="emoji" id="selectedEmoji" value="${currentEmoji}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Activity Name</label>
                        <input type="text" name="name" class="form-input" value="${activity.name}" required maxlength="30">
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Duration (minutes)</label>
                            <input type="number" name="duration" class="form-input" value="${activity.duration || 15}" min="5" max="120" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Points</label>
                            <input type="number" name="points" class="form-input" value="${activity.points || 10}" min="1" max="50" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Category</label>
                        <div class="category-selector">
                            ${categories.map(cat => `
                                <label class="category-selector__item">
                                    <input type="radio" name="category" value="${cat.id}" ${cat.id === activity.category ? 'checked' : ''}>
                                    <span class="category-selector__label" style="--cat-color: ${cat.color}">${cat.name}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                </form>
            `,
            buttons: [
                { text: 'Cancel', variant: 'secondary', onClick: (close) => close() },
                { text: 'Save Changes', variant: 'primary', onClick: (close) => {
                    const form = document.getElementById('editMovePlayForm');
                    const name = form.querySelector('[name="name"]').value.trim();
                    const duration = parseInt(form.querySelector('[name="duration"]').value) || 15;
                    const points = parseInt(form.querySelector('[name="points"]').value) || 10;
                    const emoji = form.querySelector('#selectedEmoji').value;
                    const category = form.querySelector('[name="category"]:checked')?.value || activity.category;

                    if (!name) {
                        Toast.error('Please enter an activity name');
                        return;
                    }

                    // Update activity
                    if (typeof KidWorkout !== 'undefined') {
                        KidWorkout.updateActivity(memberId, activityId, { name, duration, points, emoji, category });
                    } else {
                        const data = Storage.getWidgetData(memberId, 'kid-workout') || { activities: [] };
                        const index = data.activities.findIndex(a => a.id === activityId);
                        if (index !== -1) {
                            data.activities[index] = { ...data.activities[index], name, duration, points, emoji, category };
                            Storage.setWidgetData(memberId, 'kid-workout', data);
                        }
                    }

                    Toast.success('Activity updated');
                    close();
                    refreshKidsManagementSection(container);
                }}
            ]
        });

        // Bind emoji selection after modal opens
        setTimeout(() => {
            document.querySelectorAll('#emojiSelector .emoji-selector__btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    document.querySelectorAll('#emojiSelector .emoji-selector__btn').forEach(b => b.classList.remove('emoji-selector__btn--active'));
                    btn.classList.add('emoji-selector__btn--active');
                    document.querySelector('#selectedEmoji').value = btn.dataset.emoji;
                });
            });
        }, 100);
    }

    /**
     * Delete Move & Play Activity
     */
    function deleteMovePlayActivity(memberId, activityId) {
        if (typeof KidWorkout !== 'undefined') {
            KidWorkout.deleteActivity(memberId, activityId);
        } else {
            const data = Storage.getWidgetData(memberId, 'kid-workout') || { activities: [] };
            data.activities = (data.activities || []).filter(a => a.id !== activityId);
            Storage.setWidgetData(memberId, 'kid-workout', data);
        }
        Toast.success('Activity deleted');
    }

    /**
     * Reset Move & Play to defaults
     */
    function resetMovePlayToDefaults(memberId) {
        // Clear the stored data to trigger reload of defaults
        Storage.setWidgetData(memberId, 'kid-workout', null);
        Toast.success('Activities reset to defaults');
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

                <!-- Share Usage Section -->
                <div class="usage-share-section">
                    <h4 class="usage-share-section__title">
                        <i data-lucide="bar-chart-2"></i>
                        Share Weekly Usage
                    </h4>
                    <p class="usage-share-section__description">
                        Share your weekly activity summary with friends or family. Only includes counts (tasks completed, habits checked, etc.) - no personal content is shared.
                    </p>
                    <div class="usage-share-section__actions">
                        <button class="btn btn--secondary" id="copyUsageBtn">
                            <i data-lucide="clipboard-copy"></i>
                            Copy Usage Report
                        </button>
                        <a href="viewer.html" target="_blank" class="btn btn--ghost btn--sm" id="viewFriendUsageLink">
                            <i data-lucide="eye"></i>
                            View Friend's Report
                        </a>
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

        // Category toggle buttons (accordion behavior - only one open at a time)
        container.querySelectorAll('[data-toggle-category]').forEach(btn => {
            btn.addEventListener('click', () => {
                const categoryName = btn.dataset.toggleCategory;
                const categoryEl = container.querySelector(`[data-category="${categoryName}"]`);

                if (categoryEl) {
                    const isExpanded = categoryEl.classList.contains('settings-category--expanded');

                    // Collapse all other categories first (accordion behavior)
                    container.querySelectorAll('.settings-category--expanded').forEach(openCategory => {
                        if (openCategory !== categoryEl) {
                            openCategory.classList.remove('settings-category--expanded');
                            const openCategoryName = openCategory.dataset.category;
                            if (openCategoryName) {
                                expandedCategories[openCategoryName] = false;
                            }
                        }
                    });

                    // Toggle the clicked category
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

        // Copy usage report
        container.querySelector('#copyUsageBtn')?.addEventListener('click', () => {
            try {
                const report = Storage.generateUsageReport();
                const jsonString = JSON.stringify(report, null, 2);
                navigator.clipboard.writeText(jsonString).then(() => {
                    Toast.success('Usage report copied to clipboard!');
                }).catch(() => {
                    // Fallback for older browsers
                    const textarea = document.createElement('textarea');
                    textarea.value = jsonString;
                    document.body.appendChild(textarea);
                    textarea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textarea);
                    Toast.success('Usage report copied!');
                });
            } catch (err) {
                Toast.error('Failed to generate usage report');
                console.error('Usage report error:', err);
            }
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

        // Voice assistant enable toggle
        container.querySelector('#voiceEnabledToggle')?.addEventListener('change', (e) => {
            const settings = Storage.getSettings();
            settings.voiceAssistant = settings.voiceAssistant || {};
            settings.voiceAssistant.enabled = e.target.checked;
            Storage.updateSettings(settings);
            Toast.success(e.target.checked ? 'Voice assistant enabled' : 'Voice assistant disabled');
        });

        // Voice TTS toggle
        container.querySelector('#voiceTtsToggle')?.addEventListener('change', (e) => {
            const settings = Storage.getSettings();
            settings.voiceAssistant = settings.voiceAssistant || {};
            settings.voiceAssistant.ttsEnabled = e.target.checked;
            Storage.updateSettings(settings);

            // Show/hide voice options
            const voiceOptions = container.querySelector('#voiceTtsOptions');
            if (voiceOptions) {
                voiceOptions.style.display = e.target.checked ? '' : 'none';
            }

            Toast.success(e.target.checked ? 'Voice feedback enabled' : 'Voice feedback disabled');
        });

        // Voice selection dropdown
        container.querySelector('#voiceSelectDropdown')?.addEventListener('change', (e) => {
            const settings = Storage.getSettings();
            settings.voiceAssistant = settings.voiceAssistant || {};
            settings.voiceAssistant.selectedVoice = e.target.value;
            Storage.updateSettings(settings);
        });

        // Voice speed slider
        container.querySelector('#voiceSpeedSlider')?.addEventListener('input', (e) => {
            const speed = parseFloat(e.target.value);
            const speedLabel = container.querySelector('#voiceSpeedValue');
            if (speedLabel) {
                speedLabel.textContent = `${speed}x`;
            }
        });

        container.querySelector('#voiceSpeedSlider')?.addEventListener('change', (e) => {
            const settings = Storage.getSettings();
            settings.voiceAssistant = settings.voiceAssistant || {};
            settings.voiceAssistant.speechRate = parseFloat(e.target.value);
            Storage.updateSettings(settings);
        });

        // Test voice button
        container.querySelector('#testVoiceBtn')?.addEventListener('click', () => {
            const voiceSelect = container.querySelector('#voiceSelectDropdown');
            const speedSlider = container.querySelector('#voiceSpeedSlider');
            const voiceName = voiceSelect?.value || '';
            const rate = parseFloat(speedSlider?.value) || 1.0;

            if (typeof VoiceAssistant !== 'undefined') {
                VoiceAssistant.testVoice(voiceName, rate);
            }
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

        // Emoji options for avatars
        const avatarEmojis = ['👤', '👩', '👨', '👧', '👦', '👶', '🧒', '👩‍🦰', '👨‍🦰', '👩‍🦱', '👨‍🦱', '👩‍🦳', '👨‍🦳', '🧔', '👵', '👴', '🦸', '🦹', '🧙', '🧚', '🐱', '🐶', '🐻', '🦊', '🦁', '🐼', '🐨', '🐸', '🦄', '🌟'];

        const currentAvatarType = member.avatar?.type || 'initials';
        const currentEmoji = member.avatar?.emoji || '';
        const currentPhotoUrl = member.avatar?.photoUrl || '';

        const content = `
            <form id="editMemberForm">
                <div class="form-group">
                    <label class="form-label">Name</label>
                    <input type="text" class="form-input" id="memberName" value="${member.name}" required>
                </div>

                <div class="form-group">
                    <label class="form-label">Avatar Type</label>
                    <div class="avatar-type-selector">
                        <button type="button" class="avatar-type-btn ${currentAvatarType === 'initials' ? 'avatar-type-btn--active' : ''}" data-type="initials">
                            <span class="avatar-type-btn__icon">AB</span>
                            <span class="avatar-type-btn__label">Initials</span>
                        </button>
                        <button type="button" class="avatar-type-btn ${currentAvatarType === 'emoji' ? 'avatar-type-btn--active' : ''}" data-type="emoji">
                            <span class="avatar-type-btn__icon">😊</span>
                            <span class="avatar-type-btn__label">Emoji</span>
                        </button>
                        <button type="button" class="avatar-type-btn ${currentAvatarType === 'photo' ? 'avatar-type-btn--active' : ''}" data-type="photo">
                            <span class="avatar-type-btn__icon"><i data-lucide="camera"></i></span>
                            <span class="avatar-type-btn__label">Photo</span>
                        </button>
                    </div>
                </div>

                <div class="form-group avatar-emoji-section" style="display: ${currentAvatarType === 'emoji' ? 'block' : 'none'}">
                    <label class="form-label">Select Emoji</label>
                    <div class="avatar-emoji-selector">
                        ${avatarEmojis.map(emoji => `
                            <button type="button" class="avatar-emoji-btn ${currentEmoji === emoji ? 'avatar-emoji-btn--active' : ''}" data-emoji="${emoji}">
                                ${emoji}
                            </button>
                        `).join('')}
                    </div>
                </div>

                <div class="form-group avatar-photo-section" style="display: ${currentAvatarType === 'photo' ? 'block' : 'none'}">
                    <label class="form-label">Upload Photo</label>
                    <div class="avatar-photo-upload">
                        <div class="avatar-photo-preview" id="avatarPhotoPreview">
                            ${currentPhotoUrl ? `<img src="${currentPhotoUrl}" alt="Avatar">` : '<i data-lucide="user"></i>'}
                        </div>
                        <div class="avatar-photo-actions">
                            <label class="btn btn--primary btn--sm">
                                <i data-lucide="upload"></i> Upload
                                <input type="file" id="avatarPhotoInput" accept="image/*" hidden>
                            </label>
                            <button type="button" class="btn btn--ghost btn--sm" id="removePhotoBtn" ${!currentPhotoUrl ? 'disabled' : ''}>
                                <i data-lucide="trash-2"></i> Remove
                            </button>
                        </div>
                    </div>
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

                ${member.type === 'kid' || member.type === 'teen' || member.type === 'toddler' ? `
                    <div class="form-group">
                        <label class="form-label">Age</label>
                        <input type="number" class="form-input" id="memberAge" min="1" max="17" value="${member.age || 8}">
                    </div>
                ` : ''}
                ${member.type === 'toddler' ? `
                    <div class="form-group">
                        <label class="form-label">Gender</label>
                        <select class="form-input" id="memberGender">
                            <option value="">Not specified</option>
                            <option value="boy" ${member.gender === 'boy' ? 'selected' : ''}>Boy</option>
                            <option value="girl" ${member.gender === 'girl' ? 'selected' : ''}>Girl</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Birthdate <span style="color: var(--text-muted); font-weight: normal;">(for milestone tracking)</span></label>
                        <input type="date" class="form-input" id="memberBirthdate" value="${member.birthdate || ''}">
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

        // State variables
        let selectedType = currentAvatarType;
        let selectedColor = member.avatar?.color;
        let selectedEmoji = currentEmoji;
        let selectedPhotoUrl = currentPhotoUrl;

        // Avatar type selection
        document.querySelectorAll('.avatar-type-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.avatar-type-btn').forEach(b => b.classList.remove('avatar-type-btn--active'));
                btn.classList.add('avatar-type-btn--active');
                selectedType = btn.dataset.type;

                // Show/hide relevant sections
                document.querySelector('.avatar-emoji-section').style.display = selectedType === 'emoji' ? 'block' : 'none';
                document.querySelector('.avatar-photo-section').style.display = selectedType === 'photo' ? 'block' : 'none';
            });
        });

        // Emoji selection
        document.querySelectorAll('.avatar-emoji-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.avatar-emoji-btn').forEach(b => b.classList.remove('avatar-emoji-btn--active'));
                btn.classList.add('avatar-emoji-btn--active');
                selectedEmoji = btn.dataset.emoji;
            });
        });

        // Photo upload
        document.getElementById('avatarPhotoInput')?.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const validation = AvatarUtils.validateImageFile(file);
            if (!validation.valid) {
                Toast.error(validation.error);
                return;
            }

            try {
                selectedPhotoUrl = await AvatarUtils.compressImage(file);
                const preview = document.getElementById('avatarPhotoPreview');
                preview.innerHTML = `<img src="${selectedPhotoUrl}" alt="Avatar">`;
                document.getElementById('removePhotoBtn').disabled = false;
            } catch (err) {
                Toast.error('Failed to process image');
            }
        });

        // Remove photo
        document.getElementById('removePhotoBtn')?.addEventListener('click', () => {
            selectedPhotoUrl = '';
            const preview = document.getElementById('avatarPhotoPreview');
            preview.innerHTML = '<i data-lucide="user"></i>';
            document.getElementById('removePhotoBtn').disabled = true;
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        });

        // Avatar color selection
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

            if (selectedType === 'emoji' && !selectedEmoji) {
                Toast.error('Please select an emoji');
                return false;
            }

            const updates = {
                name,
                avatar: {
                    type: selectedType,
                    color: selectedColor,
                    initials: Storage.generateInitials(name),
                    emoji: selectedType === 'emoji' ? selectedEmoji : null,
                    photoUrl: selectedType === 'photo' ? selectedPhotoUrl : null
                }
            };

            if (member.type === 'kid' || member.type === 'teen' || member.type === 'toddler') {
                updates.age = parseInt(age) || 8;
            }

            if (member.type === 'toddler') {
                const gender = document.getElementById('memberGender')?.value;
                const birthdate = document.getElementById('memberBirthdate')?.value;
                updates.gender = gender || null;
                if (birthdate) {
                    updates.birthdate = birthdate;
                }
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
