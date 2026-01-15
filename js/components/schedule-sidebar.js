/**
 * Schedule Sidebar Component
 * Live schedule display with current activity and upcoming items
 */

const ScheduleSidebar = (function() {
    let updateInterval = null;
    let currentMemberId = null;
    let isExpanded = false;

    /**
     * Initialize the sidebar for a member
     */
    function init(memberId) {
        currentMemberId = memberId;
        isExpanded = false;

        // Use requestAnimationFrame to ensure DOM is ready
        requestAnimationFrame(() => {
            render(memberId);
            startLiveUpdates();
            bindMobileToggle();
        });

        // Listen for schedule updates to refresh immediately
        if (typeof State !== 'undefined') {
            State.on('scheduleUpdated', (updatedMemberId) => {
                if (currentMemberId && (updatedMemberId === currentMemberId || !updatedMemberId)) {
                    render(currentMemberId);
                }
            });
        }
    }

    /**
     * Cleanup when switching tabs
     */
    function cleanup() {
        stopLiveUpdates();
        currentMemberId = null;
        isExpanded = false;
    }

    /**
     * Bind mobile toggle functionality
     */
    function bindMobileToggle() {
        const sidebar = document.getElementById('scheduleSidebar');
        if (!sidebar) return;

        // Add toggle handle for mobile
        const existingHandle = sidebar.querySelector('.schedule-sidebar__toggle');
        if (!existingHandle) {
            const handle = document.createElement('button');
            handle.className = 'schedule-sidebar__toggle';
            handle.setAttribute('aria-label', 'Toggle schedule sidebar');
            handle.innerHTML = `
                <i data-lucide="chevron-up"></i>
                <span>Today's Schedule</span>
            `;
            sidebar.insertBefore(handle, sidebar.firstChild);

            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }

        // Bind click handler
        sidebar.querySelector('.schedule-sidebar__toggle')?.addEventListener('click', toggleSidebar);

        // Close sidebar when clicking outside (mobile)
        document.addEventListener('click', handleOutsideClick);
    }

    /**
     * Toggle sidebar expanded/collapsed state
     */
    function toggleSidebar() {
        const sidebar = document.getElementById('scheduleSidebar');
        if (!sidebar) return;

        isExpanded = !isExpanded;
        sidebar.classList.toggle('member-sidebar--expanded', isExpanded);

        // Update chevron direction
        const icon = sidebar.querySelector('.schedule-sidebar__toggle i');
        if (icon) {
            icon.setAttribute('data-lucide', isExpanded ? 'chevron-down' : 'chevron-up');
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }
    }

    /**
     * Handle clicks outside sidebar to close it (mobile)
     */
    function handleOutsideClick(e) {
        const sidebar = document.getElementById('scheduleSidebar');
        if (!sidebar || !isExpanded) return;

        // Check if click is outside sidebar
        if (!sidebar.contains(e.target)) {
            isExpanded = false;
            sidebar.classList.remove('member-sidebar--expanded');

            const icon = sidebar.querySelector('.schedule-sidebar__toggle i');
            if (icon) {
                icon.setAttribute('data-lucide', 'chevron-up');
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            }
        }
    }

    /**
     * Start live updates (every minute)
     */
    function startLiveUpdates() {
        stopLiveUpdates();
        updateInterval = setInterval(() => {
            if (currentMemberId) {
                render(currentMemberId);
            }
        }, 60000); // Update every minute
    }

    /**
     * Stop live updates
     */
    function stopLiveUpdates() {
        if (updateInterval) {
            clearInterval(updateInterval);
            updateInterval = null;
        }
    }

    /**
     * Render the schedule sidebar
     */
    function render(memberId) {
        const container = document.getElementById('scheduleSidebar');
        if (!container) return;

        const schedule = Storage.getMemberScheduleForToday(memberId);
        const currentActivity = getCurrentActivity(schedule);
        const upcomingActivities = getUpcomingActivities(schedule);

        const now = new Date();
        const timeString = formatTime12h(now);

        container.innerHTML = `
            <div class="schedule-sidebar">
                <div class="schedule-sidebar__header">
                    <div class="schedule-sidebar__time">
                        <i data-lucide="clock"></i>
                        <span>${timeString}</span>
                    </div>
                    <button class="schedule-sidebar__edit btn btn--ghost btn--sm" id="editScheduleBtn">
                        <i data-lucide="settings-2"></i>
                    </button>
                </div>

                ${currentActivity ? renderCurrentActivity(currentActivity) : renderNoCurrentActivity()}

                <div class="schedule-sidebar__upcoming">
                    <h4 class="schedule-sidebar__section-title">Coming Up</h4>
                    ${upcomingActivities.length > 0
                        ? upcomingActivities.map(activity => renderUpcomingActivity(activity)).join('')
                        : '<p class="schedule-sidebar__empty">No more activities today</p>'
                    }
                </div>

                ${schedule.length === 0 ? renderEmptySchedule() : ''}
            </div>
        `;

        // Initialize icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Bind edit button
        document.getElementById('editScheduleBtn')?.addEventListener('click', async () => {
            if (typeof Schedule !== 'undefined' && Schedule.showManageModal) {
                Schedule.showManageModal(memberId);
            } else {
                Toast.info('Schedule management coming soon!');
            }
        });

        // Bind setup button (empty state)
        document.getElementById('setupScheduleBtn')?.addEventListener('click', async () => {
            if (typeof Schedule !== 'undefined' && Schedule.showManageModal) {
                Schedule.showManageModal(memberId);
            } else {
                Toast.info('Schedule management coming soon!');
            }
        });
    }

    /**
     * Get current activity based on time
     */
    function getCurrentActivity(schedule) {
        const now = new Date();
        const currentTime = formatTime24h(now);

        return schedule.find(block =>
            currentTime >= block.start && currentTime < block.end
        );
    }

    /**
     * Get upcoming activities (after current time)
     */
    function getUpcomingActivities(schedule, limit = 3) {
        const now = new Date();
        const currentTime = formatTime24h(now);

        return schedule
            .filter(block => block.start > currentTime)
            .slice(0, limit);
    }

    /**
     * Render current activity card
     */
    function renderCurrentActivity(activity) {
        const progress = calculateProgress(activity);

        return `
            <div class="schedule-current" style="--activity-color: ${activity.color || '#6366F1'}">
                <div class="schedule-current__badge">NOW</div>
                <div class="schedule-current__content">
                    <div class="schedule-current__icon">
                        <i data-lucide="${activity.icon || 'circle'}"></i>
                    </div>
                    <div class="schedule-current__info">
                        <h3 class="schedule-current__title">${activity.title}</h3>
                        <p class="schedule-current__time">
                            ${formatTime12h(parseTime(activity.start))} - ${formatTime12h(parseTime(activity.end))}
                        </p>
                    </div>
                </div>
                <div class="schedule-current__progress">
                    <div class="schedule-current__progress-bar" style="width: ${progress}%"></div>
                </div>
                <span class="schedule-current__progress-text">${progress}% complete</span>
            </div>
        `;
    }

    /**
     * Render no current activity state
     */
    function renderNoCurrentActivity() {
        return `
            <div class="schedule-current schedule-current--empty">
                <div class="schedule-current__icon">
                    <i data-lucide="coffee"></i>
                </div>
                <div class="schedule-current__info">
                    <h3 class="schedule-current__title">Free Time</h3>
                    <p class="schedule-current__time">No scheduled activity right now</p>
                </div>
            </div>
        `;
    }

    /**
     * Render upcoming activity item
     */
    function renderUpcomingActivity(activity) {
        return `
            <div class="schedule-upcoming-item" style="--activity-color: ${activity.color || '#6366F1'}">
                <div class="schedule-upcoming-item__time">
                    ${formatTime12h(parseTime(activity.start))}
                </div>
                <div class="schedule-upcoming-item__content">
                    <div class="schedule-upcoming-item__icon">
                        <i data-lucide="${activity.icon || 'circle'}"></i>
                    </div>
                    <div class="schedule-upcoming-item__info">
                        <span class="schedule-upcoming-item__title">${activity.title}</span>
                        <span class="schedule-upcoming-item__duration">${calculateDuration(activity)}</span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render empty schedule state
     */
    function renderEmptySchedule() {
        return `
            <div class="schedule-sidebar__setup">
                <i data-lucide="calendar-plus"></i>
                <p>Set up a daily schedule</p>
                <button class="btn btn--sm btn--primary" id="setupScheduleBtn">
                    Add Schedule
                </button>
            </div>
        `;
    }

    /**
     * Calculate progress percentage for current activity
     */
    function calculateProgress(activity) {
        const now = new Date();
        const start = parseTime(activity.start);
        const end = parseTime(activity.end);

        const totalDuration = end - start;
        const elapsed = now - start;

        const progress = Math.round((elapsed / totalDuration) * 100);
        return Math.min(Math.max(progress, 0), 100);
    }

    /**
     * Calculate duration string
     */
    function calculateDuration(activity) {
        const start = parseTime(activity.start);
        const end = parseTime(activity.end);
        const durationMs = end - start;
        const hours = Math.floor(durationMs / 3600000);
        const minutes = Math.round((durationMs % 3600000) / 60000);

        if (hours > 0 && minutes > 0) {
            return `${hours}h ${minutes}m`;
        } else if (hours > 0) {
            return `${hours}h`;
        } else {
            return `${minutes}m`;
        }
    }

    /**
     * Parse time string (HH:MM) to Date object (today)
     */
    function parseTime(timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);
        return date;
    }

    /**
     * Format time in 24h format (HH:MM)
     */
    function formatTime24h(date) {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    /**
     * Format time in 12h format (h:MM AM/PM)
     */
    function formatTime12h(date) {
        let hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        return `${hours}:${minutes} ${ampm}`;
    }

    // Public API
    return {
        init,
        cleanup,
        render,
        startLiveUpdates,
        stopLiveUpdates,
        toggleSidebar
    };
})();
