/**
 * Home Anchor - Main Application
 * Family organization hub v2.0
 */

// Toast notification system
const Toast = (function() {
    const container = document.getElementById('toastContainer');

    function show(message, type = 'info', duration = 3000) {
        if (!container) return;

        const icons = {
            success: 'check-circle',
            error: 'x-circle',
            warning: 'alert-triangle',
            info: 'info'
        };

        const toast = document.createElement('div');
        toast.className = `toast toast--${type}`;
        toast.innerHTML = `
            <i data-lucide="${icons[type]}" class="toast__icon"></i>
            <span class="toast__message">${message}</span>
            <button class="toast__close" aria-label="Close">
                <i data-lucide="x"></i>
            </button>
        `;

        container.appendChild(toast);

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Close button
        toast.querySelector('.toast__close')?.addEventListener('click', () => {
            removeToast(toast);
        });

        // Auto remove
        setTimeout(() => removeToast(toast), duration);
    }

    function removeToast(toast) {
        toast.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }

    return {
        show,
        success: (msg) => show(msg, 'success'),
        error: (msg) => show(msg, 'error'),
        warning: (msg) => show(msg, 'warning'),
        info: (msg) => show(msg, 'info')
    };
})();

// PIN verification system
const PIN = (function() {
    const overlay = document.getElementById('pinOverlay');
    const input = document.getElementById('pinInput');
    const error = document.getElementById('pinError');
    const cancelBtn = document.getElementById('pinCancel');
    const submitBtn = document.getElementById('pinSubmit');

    let resolvePromise = null;

    function init() {
        cancelBtn?.addEventListener('click', () => {
            hide();
            if (resolvePromise) resolvePromise(false);
        });

        submitBtn?.addEventListener('click', checkPin);

        input?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                checkPin();
            }
        });

        input?.addEventListener('input', () => {
            error.textContent = '';
            input.classList.remove('pin-modal__input--error');
        });
    }

    function show() {
        overlay?.classList.add('pin-overlay--active');
        input.value = '';
        error.textContent = '';
        input.classList.remove('pin-modal__input--error');
        // Use setTimeout to ensure focus happens after modal is fully visible
        setTimeout(() => {
            input?.focus();
        }, 100);
    }

    function hide() {
        overlay?.classList.remove('pin-overlay--active');
    }

    function checkPin() {
        const settings = Storage.getSettings();
        const enteredPin = input?.value || '';

        if (enteredPin === settings.adminPin) {
            hide();
            if (resolvePromise) resolvePromise(true);
        } else {
            error.textContent = 'Incorrect PIN';
            input.classList.add('pin-modal__input--error');
            input.value = '';
            input?.focus();
        }
    }

    function verify() {
        return new Promise((resolve) => {
            resolvePromise = resolve;
            show();
        });
    }

    return { init, verify, show, hide };
})();

// Settings panel
const Settings = (function() {
    async function show() {
        const verified = await PIN.verify();
        if (!verified) return;

        const settings = Storage.getSettings();

        const content = `
            <form id="settingsForm">
                <div class="form-group">
                    <label class="form-label">Change Admin PIN</label>
                    <input type="password" class="form-input" id="newPin" maxlength="4" pattern="[0-9]*" inputmode="numeric" placeholder="Enter new 4-digit PIN">
                    <p class="form-helper">Leave blank to keep current PIN</p>
                </div>

                <hr style="margin: 24px 0; border: none; border-top: 1px solid var(--gray-200);">

                <div class="form-group" id="notificationSettingsContainer">
                    ${typeof Notifications !== 'undefined' ? Notifications.renderSettingsPanel() : ''}
                </div>

                <hr style="margin: 24px 0; border: none; border-top: 1px solid var(--gray-200);">

                <div class="form-group">
                    <label class="form-label">Data Management</label>
                    <div style="display: flex; gap: 8px; margin-top: 8px;">
                        <button type="button" class="btn btn--secondary" id="exportDataBtn">
                            <i data-lucide="download"></i>
                            Export Data
                        </button>
                        <button type="button" class="btn btn--secondary" id="importDataBtn">
                            <i data-lucide="upload"></i>
                            Import Data
                        </button>
                    </div>
                </div>

                <hr style="margin: 24px 0; border: none; border-top: 1px solid var(--gray-200);">

                <div class="form-group">
                    <label class="form-label" style="color: var(--error);">Danger Zone</label>
                    <button type="button" class="btn btn--danger" id="resetDataBtn">
                        <i data-lucide="trash-2"></i>
                        Reset All Data
                    </button>
                    <p class="form-helper">This will delete all your data and cannot be undone.</p>
                </div>
            </form>
            <input type="file" id="importFileInput" accept=".json" style="display: none;">
        `;

        Modal.open({
            title: 'Settings',
            content,
            footer: Modal.createFooter('Cancel', 'Save Settings')
        });

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Bind notification settings events
        const notifContainer = document.getElementById('notificationSettingsContainer');
        if (notifContainer && typeof Notifications !== 'undefined') {
            Notifications.bindSettingsEvents(notifContainer);
        }

        // Export data
        document.getElementById('exportDataBtn')?.addEventListener('click', () => {
            const data = Storage.exportData();
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `home-anchor-backup-${DateUtils.today()}.json`;
            a.click();
            URL.revokeObjectURL(url);
            Toast.success('Data exported successfully');
        });

        // Import data
        const importInput = document.getElementById('importFileInput');
        document.getElementById('importDataBtn')?.addEventListener('click', () => {
            importInput?.click();
        });

        importInput?.addEventListener('change', (e) => {
            const file = e.target.files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                const success = Storage.importData(event.target.result);
                if (success) {
                    Toast.success('Data imported successfully');
                    Modal.close();
                    App.init(); // Reinitialize app
                } else {
                    Toast.error('Failed to import data. Invalid format.');
                }
            };
            reader.readAsText(file);
        });

        // Reset data
        document.getElementById('resetDataBtn')?.addEventListener('click', async () => {
            const confirmed = await Modal.dangerConfirm(
                'This will permanently delete ALL your data including members, events, and schedules. This cannot be undone!',
                'Reset All Data'
            );

            if (confirmed) {
                Storage.reset();
                Toast.success('All data has been reset');
                Modal.close();
                App.init(); // Reinitialize app
            }
        });

        // Save settings
        Modal.bindFooterEvents(() => {
            const newPin = document.getElementById('newPin')?.value;

            if (newPin) {
                if (!/^\d{4}$/.test(newPin)) {
                    Toast.error('PIN must be exactly 4 digits');
                    return false;
                }
                Storage.updateSettings({ adminPin: newPin });
                Toast.success('Settings saved');
            }

            return true;
        });
    }

    return { show };
})();

// Content renderer
const Content = (function() {
    const main = document.getElementById('mainContent');

    function render(tabId) {
        if (!main) return;

        // Cleanup previous schedule sidebar
        if (typeof ScheduleSidebar !== 'undefined') {
            ScheduleSidebar.cleanup();
        }

        // Check if it's home tab
        if (tabId === 'home') {
            renderHome();
            return;
        }

        // Check if it's settings page
        if (tabId === 'settings') {
            renderSettingsPage();
            return;
        }

        // Check if it's family dashboard page
        if (tabId === 'family-dashboard') {
            renderFamilyDashboard();
            return;
        }

        // Check if it's a member
        const member = Storage.getMember(tabId);
        if (member) {
            renderMember(member);
            return;
        }

        // Fallback to home
        renderHome();
    }

    function renderSettingsPage() {
        main.innerHTML = `
            <div class="tab-content tab-content--settings">
                <div id="settingsPageContainer"></div>
            </div>
        `;

        if (typeof SettingsPage !== 'undefined') {
            SettingsPage.render(document.getElementById('settingsPageContainer'));
        }
    }

    function renderFamilyDashboard() {
        main.innerHTML = `
            <div class="tab-content tab-content--dashboard">
                <div id="dashboardPageContainer"></div>
            </div>
        `;

        if (typeof FamilyDashboard !== 'undefined') {
            FamilyDashboard.render(document.getElementById('dashboardPageContainer'));
        }
    }

    function renderHome() {
        const members = Storage.getMembers();

        // Check if we have any members
        if (members.length === 0) {
            renderEmptyHome();
            return;
        }

        main.innerHTML = `
            <div class="tab-content tab-content--home">
                <div class="home-layout">
                    <div class="home-main">
                        <!-- Family Dashboard -->
                        <section class="section">
                            <div class="section__header">
                                <h2 class="section__title">Family Dashboard</h2>
                            </div>
                            <div class="family-dashboard" id="familyDashboard">
                                ${renderFamilyCards(members)}
                            </div>
                        </section>

                        <!-- Today's Highlights -->
                        <section class="section">
                            <div class="section__header">
                                <h2 class="section__title">Today's Highlights</h2>
                            </div>
                            <div id="highlightsContainer"></div>
                        </section>

                        <!-- Calendar Section -->
                        <section class="section">
                            <div class="section__header">
                                <h2 class="section__title">Calendar</h2>
                            </div>
                            <div id="calendarContainer"></div>
                        </section>
                    </div>
                </div>
            </div>
        `;

        // Render today's highlights
        if (typeof Calendar !== 'undefined') {
            Calendar.renderHighlights(document.getElementById('highlightsContainer'));
        }

        // Render calendar
        if (typeof Calendar !== 'undefined') {
            Calendar.render(document.getElementById('calendarContainer'));
        }

        // Bind family card clicks
        document.querySelectorAll('.family-card').forEach(card => {
            card.addEventListener('click', () => {
                const memberId = card.dataset.memberId;
                if (memberId && typeof Tabs !== 'undefined') {
                    Tabs.switchTo(memberId);
                }
            });
        });

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    function renderEmptyHome() {
        main.innerHTML = `
            <div class="tab-content tab-content--home">
                <div class="empty-home">
                    <div class="empty-home__content">
                        <div class="empty-home__icon">
                            <i data-lucide="users"></i>
                        </div>
                        <h2 class="empty-home__title">Welcome to Home Anchor!</h2>
                        <p class="empty-home__text">
                            Get started by adding your family members. Each member can have their own personalized dashboard with widgets.
                        </p>
                        <button class="btn btn--primary btn--lg" id="addFirstMemberBtn">
                            <i data-lucide="user-plus"></i>
                            Add First Family Member
                        </button>
                    </div>

                    <!-- Calendar still available on home -->
                    <section class="section" style="margin-top: 48px;">
                        <div class="section__header">
                            <h2 class="section__title">Family Calendar</h2>
                        </div>
                        <div id="calendarContainer"></div>
                    </section>
                </div>
            </div>
        `;

        // Render calendar
        if (typeof Calendar !== 'undefined') {
            Calendar.render(document.getElementById('calendarContainer'));
        }

        // Add first member button
        document.getElementById('addFirstMemberBtn')?.addEventListener('click', () => {
            // Trigger the add tab button click
            document.getElementById('addTabBtn')?.click();
        });

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    function renderFamilyCards(members) {
        return `
            <div class="family-cards">
                ${members.map(member => {
                    const currentActivity = getCurrentActivityForMember(member.id);
                    const avatarHtml = renderCardAvatar(member.avatar);

                    return `
                        <div class="family-card" data-member-id="${member.id}">
                            ${avatarHtml}
                            <div class="family-card__info">
                                <h3 class="family-card__name">${member.name}</h3>
                                ${currentActivity ? `
                                    <p class="family-card__activity">
                                        <i data-lucide="${currentActivity.icon || 'circle'}"></i>
                                        ${currentActivity.title}
                                    </p>
                                ` : `
                                    <p class="family-card__activity family-card__activity--empty">
                                        <i data-lucide="coffee"></i>
                                        Free time
                                    </p>
                                `}
                            </div>
                            ${(member.type === 'kid' || member.type === 'teen') ? renderKidBadge(member.id) : ''}
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    function renderCardAvatar(avatar) {
        if (!avatar) {
            return '<div class="family-card__avatar"><i data-lucide="user"></i></div>';
        }

        if (avatar.type === 'photo' && avatar.photoUrl) {
            return `
                <div class="family-card__avatar">
                    <img src="${avatar.photoUrl}" alt="Avatar">
                </div>
            `;
        }

        const textColor = AvatarUtils.getContrastColor(avatar.color);
        return `
            <div class="family-card__avatar" style="background-color: ${avatar.color}">
                <span style="color: ${textColor}">${avatar.initials}</span>
            </div>
        `;
    }

    function getCurrentActivityForMember(memberId) {
        const schedule = Storage.getMemberScheduleForToday(memberId);
        if (!schedule || schedule.length === 0) return null;

        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        return schedule.find(block => currentTime >= block.start && currentTime < block.end);
    }

    function renderKidBadge(memberId) {
        const widgetData = Storage.getWidgetData(memberId, 'points');
        const points = widgetData?.balance || 0;

        return `
            <div class="family-card__badge">
                <i data-lucide="star"></i>
                ${points}
            </div>
        `;
    }

    function renderMember(member) {
        // Determine theme class based on member type
        const themeClass = member.type === 'kid' ? 'tab-content--kid' :
                          member.type === 'teen' ? 'tab-content--teen' :
                          member.type === 'toddler' ? 'tab-content--toddler' :
                          'tab-content--adult';

        main.innerHTML = `
            <div class="tab-content tab-content--member ${themeClass}">
                <div class="member-layout">
                    <div class="member-main" id="memberMain">
                        <!-- Widget content will be rendered here -->
                    </div>
                    <aside class="member-sidebar" id="scheduleSidebar">
                        <!-- Schedule sidebar will be rendered here -->
                    </aside>
                </div>
            </div>
        `;

        // Render widgets
        const widgetContainer = document.getElementById('memberMain');
        if (widgetContainer && typeof WidgetRenderer !== 'undefined') {
            WidgetRenderer.renderMemberWidgets(widgetContainer, member);
        }

        // Initialize schedule sidebar
        if (typeof ScheduleSidebar !== 'undefined') {
            ScheduleSidebar.init(member.id);
        }

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    return { render };
})();

// Demo Mode Banner
function showDemoBanner() {
    // Don't show if banner already exists
    if (document.getElementById('demoBanner')) return;

    const banner = document.createElement('div');
    banner.id = 'demoBanner';
    banner.className = 'demo-banner';
    banner.innerHTML = `
        <div class="demo-banner__content">
            <i data-lucide="info" class="demo-banner__icon"></i>
            <span class="demo-banner__text">
                <strong>Demo Mode</strong> - You're exploring with sample data.
            </span>
        </div>
        <div class="demo-banner__actions">
            <button class="btn btn--ghost btn--sm" id="demoKeepBtn">
                <i data-lucide="save"></i>
                Keep Data
            </button>
            <button class="btn btn--ghost btn--sm" id="demoExitBtn">
                <i data-lucide="log-out"></i>
                Start Fresh
            </button>
        </div>
    `;

    // Insert at top of app
    const app = document.getElementById('app');
    if (app) {
        app.insertBefore(banner, app.firstChild);
    }

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // Bind events
    document.getElementById('demoKeepBtn')?.addEventListener('click', () => {
        Storage.exitDemoMode(true); // Keep data
        banner.remove();
        Toast.success('Demo data saved! This is now your data.');
    });

    document.getElementById('demoExitBtn')?.addEventListener('click', () => {
        if (confirm('Start fresh? This will clear all demo data.')) {
            Storage.exitDemoMode(false); // Clear data
            window.location.reload();
        }
    });
}

// Apply theme on page load
function applyThemeOnLoad() {
    const settings = Storage.getSettings();
    const theme = settings.theme || 'light';

    // Apply display mode (light/dark/auto)
    if (theme === 'dark') {
        document.documentElement.classList.add('dark-mode');
    } else if (theme === 'light') {
        document.documentElement.classList.remove('dark-mode');
    } else {
        // Auto - check system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.classList.toggle('dark-mode', prefersDark);
    }

    // Apply saved theme color
    const themeColor = settings.themeColor || 'indigo';
    const themeColors = {
        'indigo': { primary: '#6366F1', accent: '#818CF8' },
        'violet': { primary: '#8B5CF6', accent: '#A78BFA' },
        'pink': { primary: '#EC4899', accent: '#F472B6' },
        'rose': { primary: '#F43F5E', accent: '#FB7185' },
        'orange': { primary: '#F97316', accent: '#FB923C' },
        'amber': { primary: '#F59E0B', accent: '#FBBF24' },
        'emerald': { primary: '#10B981', accent: '#34D399' },
        'teal': { primary: '#14B8A6', accent: '#2DD4BF' },
        'cyan': { primary: '#06B6D4', accent: '#22D3EE' },
        'blue': { primary: '#3B82F6', accent: '#60A5FA' }
    };

    const selectedTheme = themeColors[themeColor];
    if (selectedTheme) {
        document.documentElement.style.setProperty('--primary', selectedTheme.primary);
        document.documentElement.style.setProperty('--primary-dark', selectedTheme.primary);
        document.documentElement.style.setProperty('--primary-light', selectedTheme.accent);
    }
}

/**
 * Show Report Bug modal
 */
function showReportBugModal() {
    const content = `
        <form id="reportBugForm">
            <div class="form-group">
                <label class="form-label">What went wrong?</label>
                <textarea
                    class="form-input"
                    id="bugDescription"
                    placeholder="Describe what happened..."
                    rows="5"
                    required
                ></textarea>
                <span class="form-hint">Please describe the issue in detail so we can help fix it.</span>
            </div>

            <div class="form-group">
                <label class="form-label">Steps to reproduce (optional)</label>
                <textarea
                    class="form-input"
                    id="bugSteps"
                    placeholder="1. Click on...&#10;2. Then I...&#10;3. And then..."
                    rows="4"
                ></textarea>
                <span class="form-hint">Help us recreate the issue by describing what you did.</span>
            </div>

            <div class="form-group">
                <label class="form-label">Your email (optional)</label>
                <input
                    type="email"
                    class="form-input"
                    id="bugEmail"
                    placeholder="your@email.com"
                >
                <span class="form-hint">We'll only use this to follow up on your report.</span>
            </div>
        </form>
    `;

    Modal.open({
        title: 'Report a Bug',
        content,
        footer: Modal.createFooter('Cancel', 'Submit Report')
    });

    Modal.bindFooterEvents(() => {
        const description = document.getElementById('bugDescription')?.value?.trim();
        const steps = document.getElementById('bugSteps')?.value?.trim();
        const email = document.getElementById('bugEmail')?.value?.trim();

        if (!description) {
            Toast.error('Please describe what went wrong');
            return false;
        }

        // In a real app, this would send to a backend or bug tracking system
        // For now, we'll just compose an email
        const subject = encodeURIComponent('Home Anchor - Bug Report');
        const body = encodeURIComponent(
            `Bug Description:\n${description}\n\n` +
            (steps ? `Steps to Reproduce:\n${steps}\n\n` : '') +
            (email ? `User Email: ${email}\n\n` : '') +
            `\nBrowser: ${navigator.userAgent}\n` +
            `Timestamp: ${new Date().toISOString()}`
        );

        // Open default email client
        window.location.href = `mailto:support@homeanchor.app?subject=${subject}&body=${body}`;

        Toast.success('Thank you for your report!');
        return true;
    });
}

// Main App
const App = (function() {
    function init() {
        // Initialize storage
        Storage.init();

        // Apply saved theme/display mode
        applyThemeOnLoad();

        // Check for demo mode and show banner
        if (Storage.isDemoMode()) {
            showDemoBanner();
        }

        // Initialize components
        Modal.init();
        PIN.init();
        Tabs.init();

        if (typeof Calendar !== 'undefined') {
            Calendar.init();
        }

        if (typeof Schedule !== 'undefined') {
            Schedule.init();
        }

        // Initialize save indicator
        if (typeof SaveIndicator !== 'undefined') {
            SaveIndicator.init();
        }

        // Initialize notifications
        if (typeof Notifications !== 'undefined') {
            Notifications.init();
        }

        // Initialize routine notifications
        if (typeof Routine !== 'undefined') {
            Routine.init();
        }

        // Initialize backup system
        if (typeof Backup !== 'undefined') {
            Backup.init();
        }

        // Render initial content
        Content.render(State.getActiveTab());

        // Initialize tour (for first-time users)
        if (typeof Tour !== 'undefined') {
            Tour.init();
        }

        // Listen for tab changes
        State.subscribe('tabChanged', (tabId) => {
            Content.render(tabId);

            // Show member-specific tour when navigating to a member tab
            if (typeof Tour !== 'undefined' && tabId !== 'home' && tabId !== 'settings' && tabId !== 'family-dashboard') {
                const member = Storage.getMember(tabId);
                if (member) {
                    // Small delay to let the content render first
                    setTimeout(() => {
                        Tour.showMemberTour(member.type);
                    }, 600);
                }
            }
        });

        // Settings button - now opens settings page with PIN verification
        document.getElementById('settingsBtn')?.addEventListener('click', async () => {
            const verified = await PIN.verify();
            if (verified) {
                if (typeof Tabs !== 'undefined') {
                    Tabs.switchTo('settings');
                }
            }
        });

        // Dashboard button
        document.getElementById('dashboardBtn')?.addEventListener('click', async () => {
            const verified = await PIN.verify();
            if (verified) {
                if (typeof Tabs !== 'undefined') {
                    Tabs.switchTo('family-dashboard');
                }
            }
        });

        // Report Bug button
        document.getElementById('reportBugBtn')?.addEventListener('click', () => {
            showReportBugModal();
        });

        // Initialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        console.log('Home Anchor v2.0 initialized successfully!');
    }

    return { init };
})();

// Swipe Back Gesture Handler for Mobile
const SwipeBack = (function() {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    let isSwiping = false;
    let swipeIndicator = null;

    const SWIPE_THRESHOLD = 100; // Minimum distance for swipe (increased from 80)
    const SWIPE_VELOCITY_THRESHOLD = 0.25; // Minimum velocity (lowered from 0.3 for easier trigger)
    const MAX_VERTICAL_DEVIATION = 80; // Maximum vertical movement allowed (increased for more tolerance)
    const EDGE_START_ZONE = 60; // Start swipe from edge of screen (increased from 50)

    function init() {
        // Only enable on touch-capable devices
        // Note: Always attach on touch devices, regardless of current viewport width
        // This ensures swipe-back works even if user rotates device or resizes window
        if (!('ontouchstart' in window)) return;

        document.addEventListener('touchstart', handleTouchStart, { passive: true });
        document.addEventListener('touchmove', handleTouchMove, { passive: false }); // Non-passive to show indicator
        document.addEventListener('touchend', handleTouchEnd, { passive: true });
        document.addEventListener('touchcancel', handleTouchCancel, { passive: true });

        createSwipeIndicator();
    }

    function createSwipeIndicator() {
        swipeIndicator = document.createElement('div');
        swipeIndicator.className = 'swipe-indicator';
        swipeIndicator.innerHTML = '<i data-lucide="chevron-right"></i>';
        swipeIndicator.style.cssText = `
            position: fixed;
            left: 0;
            top: 50%;
            transform: translateY(-50%) translateX(-100%);
            width: 50px;
            height: 50px;
            background: var(--primary);
            color: white;
            border-radius: 0 50% 50% 0;
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            transition: transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
            pointer-events: none;
            opacity: 0.9;
            box-shadow: 2px 0 12px rgba(0,0,0,0.2);
        `;
        document.body.appendChild(swipeIndicator);

        // Show indicator only on mobile viewports
        updateIndicatorVisibility();
        window.addEventListener('resize', updateIndicatorVisibility);

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    function updateIndicatorVisibility() {
        if (!swipeIndicator) return;
        const isMobileViewport = window.innerWidth <= 768;
        swipeIndicator.style.display = isMobileViewport ? 'flex' : 'none';
    }

    function handleTouchStart(e) {
        // Only start tracking if touch begins near left edge
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchStartTime = Date.now();
        isSwiping = touchStartX < EDGE_START_ZONE;
    }

    function handleTouchMove(e) {
        if (!isSwiping) return;

        const touchCurrentX = e.touches[0].clientX;
        const touchCurrentY = e.touches[0].clientY;

        const deltaX = touchCurrentX - touchStartX;
        const deltaY = Math.abs(touchCurrentY - touchStartY);

        // Cancel if moving too much vertically (likely scrolling)
        if (deltaY > MAX_VERTICAL_DEVIATION) {
            isSwiping = false;
            hideSwipeIndicator();
            return;
        }

        // Show visual feedback when swiping right
        if (deltaX > 0) {
            showSwipeIndicator(Math.min(deltaX, 150));
        } else {
            hideSwipeIndicator();
        }
    }

    function handleTouchEnd(e) {
        if (!isSwiping) return;

        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const touchEndTime = Date.now();

        const deltaX = touchEndX - touchStartX;
        const deltaY = Math.abs(touchEndY - touchStartY);
        const deltaTime = touchEndTime - touchStartTime;
        const velocity = deltaX / deltaTime;

        // Check if it's a valid right swipe
        if (
            deltaX > SWIPE_THRESHOLD && // Moved right enough
            deltaY < MAX_VERTICAL_DEVIATION && // Not too much vertical movement
            velocity > SWIPE_VELOCITY_THRESHOLD // Fast enough
        ) {
            triggerBackNavigation();
        }

        isSwiping = false;
        hideSwipeIndicator();
    }

    function handleTouchCancel() {
        isSwiping = false;
        hideSwipeIndicator();
    }

    function showSwipeIndicator(distance) {
        if (!swipeIndicator) return;
        const translateX = Math.min(distance - 50, 0); // Move indicator with swipe
        swipeIndicator.style.transform = `translateY(-50%) translateX(${translateX}px)`;
    }

    function hideSwipeIndicator() {
        if (!swipeIndicator) return;
        swipeIndicator.style.transform = 'translateY(-50%) translateX(-100%)';
    }

    function triggerBackNavigation() {
        // Find the active back button and click it
        const backButtons = [
            document.getElementById('backToMemberBtn'),
            document.getElementById('backToDashboardBtn'),
            document.querySelector('.btn[data-action="back"]'),
            document.querySelector('.grocery-page__back'),
            document.querySelector('.recipes-page__back'),
            document.querySelector('[id$="BackBtn"]')
        ];

        for (const btn of backButtons) {
            if (btn && btn.offsetParent !== null) { // Check if visible
                // Add haptic feedback if available
                if (navigator.vibrate) {
                    navigator.vibrate(50);
                }
                btn.click();
                return;
            }
        }
    }

    return { init };
})();

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
    SwipeBack.init();
});
