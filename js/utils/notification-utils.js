/**
 * Browser Notifications Utility
 * Handles browser notification permissions and sending notifications
 */

const NotificationUtils = (function() {
    'use strict';

    /**
     * Check if browser supports notifications
     */
    function isSupported() {
        return 'Notification' in window;
    }

    /**
     * Get current permission status
     * @returns {'granted'|'denied'|'default'}
     */
    function getPermission() {
        if (!isSupported()) return 'denied';
        return Notification.permission;
    }

    /**
     * Request notification permission from user
     * @returns {Promise<boolean>} true if granted, false otherwise
     */
    async function requestPermission() {
        if (!isSupported()) {
            console.warn('Browser notifications not supported');
            return false;
        }

        if (Notification.permission === 'granted') {
            return true;
        }

        if (Notification.permission === 'denied') {
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
     * Send a notification
     * @param {string} title - Notification title
     * @param {Object} options - Notification options
     * @param {string} options.body - Notification body text
     * @param {string} options.icon - Icon URL
     * @param {string} options.tag - Unique tag to prevent duplicates
     * @param {*} options.data - Custom data to attach
     * @returns {Notification|null}
     */
    function send(title, options = {}) {
        if (!isSupported()) {
            console.warn('Browser notifications not supported');
            return null;
        }

        if (Notification.permission !== 'granted') {
            console.warn('Notification permission not granted');
            return null;
        }

        const defaultOptions = {
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            requireInteraction: false,
            ...options
        };

        try {
            const notification = new Notification(title, defaultOptions);

            // Auto-close after 10 seconds if not interactive
            if (!defaultOptions.requireInteraction) {
                setTimeout(() => notification.close(), 10000);
            }

            // Click handler - focus window
            notification.onclick = function(event) {
                event.preventDefault();
                window.focus();
                notification.close();

                // Call custom click handler if provided
                if (options.onClick) {
                    options.onClick(event);
                }
            };

            return notification;
        } catch (error) {
            console.error('Error sending notification:', error);
            return null;
        }
    }

    /**
     * Schedule a notification for a specific time
     * @param {Date|string} dateTime - When to send notification
     * @param {string} title - Notification title
     * @param {Object} options - Notification options
     * @returns {number|null} Timeout ID for cancellation
     */
    function schedule(dateTime, title, options = {}) {
        const targetDate = new Date(dateTime);
        const now = new Date();
        const delay = targetDate - now;

        if (delay <= 0) {
            console.warn('Cannot schedule notification in the past');
            return null;
        }

        // Maximum setTimeout delay is ~24.8 days
        if (delay > 2147483647) {
            console.warn('Notification scheduled too far in the future');
            return null;
        }

        const timeoutId = setTimeout(() => {
            send(title, options);
        }, delay);

        return timeoutId;
    }

    /**
     * Cancel a scheduled notification
     * @param {number} timeoutId - ID returned from schedule()
     */
    function cancel(timeoutId) {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
    }

    /**
     * Check if notifications are enabled in app settings
     * @returns {boolean}
     */
    function areNotificationsEnabled() {
        const settings = Storage.getSettings();
        return settings.notificationsEnabled !== false; // Default to true
    }

    /**
     * Enable/disable notifications in app settings
     * @param {boolean} enabled
     */
    function setNotificationsEnabled(enabled) {
        const settings = Storage.getSettings();
        settings.notificationsEnabled = enabled;
        Storage.saveSettings(settings);
    }

    // Public API
    return {
        isSupported,
        getPermission,
        requestPermission,
        send,
        schedule,
        cancel,
        areNotificationsEnabled,
        setNotificationsEnabled
    };
})();
