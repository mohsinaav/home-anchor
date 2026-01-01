/**
 * Notifications Feature
 * Browser notifications for schedule activities
 */

const Notifications = (function() {
    let checkInterval = null;
    let lastNotifiedActivity = {};
    let isEnabled = false;
    let soundEnabled = false;

    // Audio context for notification sound
    let audioContext = null;

    /**
     * Initialize notifications
     */
    function init() {
        const settings = Storage.getSettings();
        isEnabled = settings.notifications?.enabled || false;
        soundEnabled = settings.notifications?.sound || false;

        if (isEnabled && hasPermission()) {
            startChecking();
        }
    }

    /**
     * Check if notifications are supported
     */
    function isSupported() {
        return 'Notification' in window;
    }

    /**
     * Check if we have permission
     */
    function hasPermission() {
        return isSupported() && Notification.permission === 'granted';
    }

    /**
     * Request notification permission
     */
    async function requestPermission() {
        if (!isSupported()) {
            Toast.error('Browser notifications are not supported');
            return false;
        }

        try {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            return false;
        }
    }

    /**
     * Enable notifications
     */
    async function enable() {
        if (!hasPermission()) {
            const granted = await requestPermission();
            if (!granted) {
                Toast.warning('Please allow notifications in your browser settings');
                return false;
            }
        }

        isEnabled = true;
        updateSettings();
        startChecking();
        Toast.success('Notifications enabled');
        return true;
    }

    /**
     * Disable notifications
     */
    function disable() {
        isEnabled = false;
        updateSettings();
        stopChecking();
        Toast.info('Notifications disabled');
    }

    /**
     * Toggle notifications
     */
    async function toggle() {
        if (isEnabled) {
            disable();
        } else {
            await enable();
        }
        return isEnabled;
    }

    /**
     * Enable/disable sound
     */
    function toggleSound() {
        soundEnabled = !soundEnabled;
        updateSettings();
        return soundEnabled;
    }

    /**
     * Update settings in storage
     */
    function updateSettings() {
        Storage.updateSettings({
            notifications: {
                enabled: isEnabled,
                sound: soundEnabled
            }
        });
    }

    /**
     * Start checking for activity changes
     */
    function startChecking() {
        if (checkInterval) return;

        // Check immediately
        checkActivities();

        // Then check every minute
        checkInterval = setInterval(checkActivities, 60000);
    }

    /**
     * Stop checking
     */
    function stopChecking() {
        if (checkInterval) {
            clearInterval(checkInterval);
            checkInterval = null;
        }
    }

    /**
     * Check all members' activities
     */
    function checkActivities() {
        if (!isEnabled) return;

        const members = Storage.getMembers();
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        members.forEach(member => {
            const schedule = Storage.getMemberScheduleForToday(member.id);
            if (!schedule || schedule.length === 0) return;

            // Find current activity
            const currentActivity = schedule.find(block =>
                currentTime >= block.start && currentTime < block.end
            );

            if (currentActivity) {
                // Check if this is a new activity for this member
                const lastActivityId = lastNotifiedActivity[member.id];

                if (lastActivityId !== currentActivity.id) {
                    // New activity started - send notification
                    sendNotification(member, currentActivity);
                    lastNotifiedActivity[member.id] = currentActivity.id;
                }
            } else {
                // No current activity
                lastNotifiedActivity[member.id] = null;
            }
        });
    }

    /**
     * Send a notification
     */
    function sendNotification(member, activity) {
        if (!hasPermission()) return;

        const title = `${member.name}'s Activity`;
        const body = `${activity.title} (${formatTime(activity.start)} - ${formatTime(activity.end)})`;
        const icon = getActivityIcon(activity.icon);

        try {
            const notification = new Notification(title, {
                body,
                icon: icon || '/favicon.ico',
                badge: '/favicon.ico',
                tag: `activity-${member.id}`,
                renotify: true,
                requireInteraction: false
            });

            // Auto-close after 5 seconds
            setTimeout(() => {
                notification.close();
            }, 5000);

            // Click to focus app
            notification.onclick = () => {
                window.focus();
                if (typeof Tabs !== 'undefined') {
                    Tabs.switchTo(member.id);
                }
                notification.close();
            };

            // Play sound if enabled
            if (soundEnabled) {
                playNotificationSound();
            }
        } catch (error) {
            console.error('Error sending notification:', error);
        }
    }

    /**
     * Format time for display
     */
    function formatTime(time) {
        if (!time) return '';
        const [hours, minutes] = time.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const hour12 = hours % 12 || 12;
        return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
    }

    /**
     * Get icon URL for activity (placeholder)
     */
    function getActivityIcon(iconName) {
        // For now, return null - could be enhanced with actual icons
        return null;
    }

    /**
     * Play notification sound using Web Audio API
     */
    function playNotificationSound() {
        try {
            if (!audioContext) {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }

            // Create a soft chime sound
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            // Soft bell-like tone
            oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5
            oscillator.type = 'sine';

            // Quick fade in/out
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);

            // Second tone (higher)
            const oscillator2 = audioContext.createOscillator();
            const gainNode2 = audioContext.createGain();

            oscillator2.connect(gainNode2);
            gainNode2.connect(audioContext.destination);

            oscillator2.frequency.setValueAtTime(1320, audioContext.currentTime + 0.15); // E6
            oscillator2.type = 'sine';

            gainNode2.gain.setValueAtTime(0, audioContext.currentTime + 0.15);
            gainNode2.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.2);
            gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);

            oscillator2.start(audioContext.currentTime + 0.15);
            oscillator2.stop(audioContext.currentTime + 0.6);
        } catch (error) {
            console.error('Error playing notification sound:', error);
        }
    }

    /**
     * Test notification (for settings)
     */
    function test() {
        if (!hasPermission()) {
            Toast.warning('Please enable notifications first');
            return;
        }

        sendNotification(
            { id: 'test', name: 'Test' },
            { id: 'test', title: 'This is a test notification', start: '12:00', end: '13:00', icon: 'bell' }
        );
    }

    /**
     * Get current status
     */
    function getStatus() {
        return {
            supported: isSupported(),
            permission: isSupported() ? Notification.permission : 'denied',
            enabled: isEnabled,
            soundEnabled: soundEnabled
        };
    }

    /**
     * Render notification settings panel
     */
    function renderSettingsPanel() {
        const status = getStatus();

        return `
            <div class="notification-settings">
                <div class="notification-settings__header">
                    <i data-lucide="bell"></i>
                    <span>Notifications</span>
                </div>

                ${!status.supported ? `
                    <p class="notification-settings__error">
                        Browser notifications are not supported in your browser.
                    </p>
                ` : `
                    <div class="notification-settings__option">
                        <label class="form-checkbox">
                            <input type="checkbox" id="notifEnabled" ${status.enabled ? 'checked' : ''}>
                            <span>Enable browser notifications</span>
                        </label>
                        <p class="form-helper">Get alerts when activities start for family members</p>
                    </div>

                    <div class="notification-settings__option">
                        <label class="form-checkbox">
                            <input type="checkbox" id="notifSound" ${status.soundEnabled ? 'checked' : ''} ${!status.enabled ? 'disabled' : ''}>
                            <span>Play sound</span>
                        </label>
                        <p class="form-helper">Soft chime when activity changes</p>
                    </div>

                    <div class="notification-settings__actions">
                        <button class="btn btn--sm btn--secondary" id="testNotifBtn" ${!status.enabled ? 'disabled' : ''}>
                            <i data-lucide="bell-ring"></i>
                            Test Notification
                        </button>
                    </div>

                    ${status.permission === 'denied' ? `
                        <p class="notification-settings__warning">
                            <i data-lucide="alert-triangle"></i>
                            Notifications are blocked. Please update your browser settings to allow notifications.
                        </p>
                    ` : ''}
                `}
            </div>
        `;
    }

    /**
     * Bind settings panel events
     */
    function bindSettingsEvents(container) {
        const enabledCheckbox = container.querySelector('#notifEnabled');
        const soundCheckbox = container.querySelector('#notifSound');
        const testBtn = container.querySelector('#testNotifBtn');

        enabledCheckbox?.addEventListener('change', async (e) => {
            if (e.target.checked) {
                const success = await enable();
                if (!success) {
                    e.target.checked = false;
                } else {
                    soundCheckbox.disabled = false;
                    testBtn.disabled = false;
                }
            } else {
                disable();
                soundCheckbox.disabled = true;
                testBtn.disabled = true;
            }
        });

        soundCheckbox?.addEventListener('change', () => {
            toggleSound();
        });

        testBtn?.addEventListener('click', () => {
            test();
        });
    }

    // Public API
    return {
        init,
        isSupported,
        hasPermission,
        requestPermission,
        enable,
        disable,
        toggle,
        toggleSound,
        test,
        getStatus,
        renderSettingsPanel,
        bindSettingsEvents
    };
})();
