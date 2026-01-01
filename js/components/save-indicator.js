/**
 * Save Indicator Component
 * Shows auto-save status in the header
 */

const SaveIndicator = (function() {
    let container = null;
    let lastSaveTime = null;
    let updateInterval = null;

    /**
     * Initialize the save indicator
     */
    function init() {
        // Get initial last modified time
        lastSaveTime = Storage.getLastModified();

        // Subscribe to save events
        if (typeof State !== 'undefined') {
            State.subscribe('dataSaved', handleDataSaved);
        }

        // Render the indicator in the header
        render();

        // Start updating relative time
        startTimeUpdates();
    }

    /**
     * Render the save indicator in the header
     */
    function render() {
        const header = document.querySelector('.header');
        if (!header) return;

        // Check if indicator already exists
        container = document.querySelector('.save-indicator');
        if (!container) {
            // Create indicator element
            container = document.createElement('div');
            container.className = 'save-indicator';

            // Insert before header__actions div (which contains the buttons)
            const headerActions = document.querySelector('.header__actions');
            if (headerActions) {
                header.insertBefore(container, headerActions);
            } else {
                // Fallback: append to header
                header.appendChild(container);
            }
        }

        updateDisplay();
    }

    /**
     * Handle data saved event
     */
    function handleDataSaved(timestamp) {
        lastSaveTime = timestamp;
        showSaving();

        // Show "Saved" after a brief delay
        setTimeout(() => {
            updateDisplay();
        }, 500);
    }

    /**
     * Show saving animation
     */
    function showSaving() {
        if (!container) return;

        container.innerHTML = `
            <i data-lucide="loader-2" class="save-indicator__icon save-indicator__icon--saving"></i>
            <span class="save-indicator__text">Saving...</span>
        `;

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    /**
     * Update the display with relative time
     */
    function updateDisplay() {
        if (!container || !lastSaveTime) {
            if (container) {
                container.innerHTML = '';
            }
            return;
        }

        const relativeTime = getRelativeTime(lastSaveTime);

        container.innerHTML = `
            <i data-lucide="check-circle" class="save-indicator__icon save-indicator__icon--saved"></i>
            <span class="save-indicator__text">${relativeTime}</span>
        `;

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    /**
     * Get relative time string
     */
    function getRelativeTime(timestamp) {
        if (!timestamp) return '';

        const now = new Date();
        const saved = new Date(timestamp);
        const diffMs = now - saved;
        const diffSeconds = Math.floor(diffMs / 1000);
        const diffMinutes = Math.floor(diffSeconds / 60);
        const diffHours = Math.floor(diffMinutes / 60);

        if (diffSeconds < 5) {
            return 'Saved just now';
        } else if (diffSeconds < 60) {
            return `Saved ${diffSeconds}s ago`;
        } else if (diffMinutes < 60) {
            return `Saved ${diffMinutes}m ago`;
        } else if (diffHours < 24) {
            return `Saved ${diffHours}h ago`;
        } else {
            return `Saved ${DateUtils.formatShort(timestamp)}`;
        }
    }

    /**
     * Start periodic updates to refresh relative time
     */
    function startTimeUpdates() {
        // Update every 30 seconds
        updateInterval = setInterval(() => {
            updateDisplay();
        }, 30000);
    }

    /**
     * Stop time updates
     */
    function stopTimeUpdates() {
        if (updateInterval) {
            clearInterval(updateInterval);
            updateInterval = null;
        }
    }

    /**
     * Force an update (call after manual save)
     */
    function refresh() {
        lastSaveTime = Storage.getLastModified();
        updateDisplay();
    }

    /**
     * Destroy the component
     */
    function destroy() {
        stopTimeUpdates();
        if (container && container.parentNode) {
            container.parentNode.removeChild(container);
        }
        container = null;
    }

    // Public API
    return {
        init,
        render,
        refresh,
        destroy
    };
})();
