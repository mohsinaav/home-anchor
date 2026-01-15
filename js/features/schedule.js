/**
 * Schedule Feature - Visual Timeline Editor
 * Google Calendar-style timeline view with 30-minute slots
 */

const Schedule = (function() {
    // Timeline configuration
    const TIMELINE_START_HOUR = 5;  // 5 AM
    const TIMELINE_END_HOUR = 23;   // 11 PM
    const SLOT_MINUTES = 30;
    const SLOT_HEIGHT = 48; // pixels per 30-min slot

    /**
     * Add touch-friendly event listener that works on both desktop and mobile
     * Uses a flag to prevent duplicate events from touch + click
     */
    function addTapEvent(element, handler) {
        let touchStartY = 0;
        let touchStartX = 0;
        let hasMoved = false;
        let touchHandled = false;

        element.addEventListener('touchstart', (e) => {
            touchStartY = e.touches[0].clientY;
            touchStartX = e.touches[0].clientX;
            hasMoved = false;
            touchHandled = false;
        }, { passive: true });

        element.addEventListener('touchmove', (e) => {
            const touchY = e.touches[0].clientY;
            const touchX = e.touches[0].clientX;
            // Check both vertical and horizontal movement
            if (Math.abs(touchY - touchStartY) > 10 || Math.abs(touchX - touchStartX) > 10) {
                hasMoved = true;
            }
        }, { passive: true });

        element.addEventListener('touchend', (e) => {
            if (!hasMoved) {
                touchHandled = true;
                // Use setTimeout to ensure the handler runs after any scroll/zoom decisions
                setTimeout(() => handler(e), 0);
            }
        }, { passive: true });

        // Click fallback for desktop - skip if touch already handled
        element.addEventListener('click', (e) => {
            if (touchHandled) {
                touchHandled = false; // Reset for next interaction
                return;
            }
            handler(e);
        });
    }

    // Common schedule icons
    const SCHEDULE_ICONS = [
        { id: 'sun', name: 'Morning' },
        { id: 'coffee', name: 'Coffee/Break' },
        { id: 'briefcase', name: 'Work' },
        { id: 'book', name: 'Study' },
        { id: 'dumbbell', name: 'Workout' },
        { id: 'utensils', name: 'Meal' },
        { id: 'moon', name: 'Evening' },
        { id: 'bed', name: 'Sleep' },
        { id: 'baby', name: 'Childcare' },
        { id: 'car', name: 'Commute' },
        { id: 'tv', name: 'Leisure' },
        { id: 'shopping-cart', name: 'Errands' },
        { id: 'users', name: 'Social' },
        { id: 'heart', name: 'Self-care' },
        { id: 'gamepad-2', name: 'Play' },
        { id: 'pencil', name: 'Creative' }
    ];

    // Color palette for activities
    const ACTIVITY_COLORS = [
        { id: '#6366F1', name: 'Indigo' },
        { id: '#8B5CF6', name: 'Violet' },
        { id: '#EC4899', name: 'Pink' },
        { id: '#EF4444', name: 'Red' },
        { id: '#F97316', name: 'Orange' },
        { id: '#F59E0B', name: 'Amber' },
        { id: '#10B981', name: 'Emerald' },
        { id: '#14B8A6', name: 'Teal' },
        { id: '#06B6D4', name: 'Cyan' },
        { id: '#3B82F6', name: 'Blue' }
    ];

    // Days of week
    const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Quick preset templates
    const QUICK_PRESETS = [
        { title: 'Morning Routine', duration: 60, icon: 'sun', color: '#F59E0B' },
        { title: 'Work', duration: 480, icon: 'briefcase', color: '#6366F1' },
        { title: 'Lunch', duration: 60, icon: 'utensils', color: '#10B981' },
        { title: 'Workout', duration: 60, icon: 'dumbbell', color: '#EF4444' },
        { title: 'Dinner', duration: 60, icon: 'utensils', color: '#EC4899' },
        { title: 'Family Time', duration: 60, icon: 'users', color: '#8B5CF6' },
        { title: 'Wind Down', duration: 60, icon: 'moon', color: '#14B8A6' },
        { title: 'School', duration: 420, icon: 'book', color: '#3B82F6' }
    ];

    // State
    let currentMemberId = null;
    let currentDay = 'default';

    /**
     * Initialize schedule feature
     */
    /**
     * Check and send notifications for upcoming schedule activities
     */
    function checkScheduleNotifications() {
        // Only check if notifications are supported and enabled
        if (typeof NotificationUtils === 'undefined' || !NotificationUtils.areNotificationsEnabled()) {
            return;
        }

        const members = Storage.getMembers();
        const now = new Date();
        const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();
        const currentDayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.

        members.forEach(member => {
            const scheduleData = Storage.getSchedule(member.id);

            // Check both default schedule and today's specific schedule
            const defaultBlocks = scheduleData.default || [];
            const dayKey = currentDayOfWeek.toString();
            const daySpecificBlocks = scheduleData[dayKey] || [];

            // Combine all blocks for today (day-specific overrides default)
            const allBlocks = [...defaultBlocks, ...daySpecificBlocks];

            allBlocks.forEach(block => {
                // Skip if notifications not enabled for this block
                if (!block.notificationEnabled || !block.notificationMinutes) {
                    return;
                }

                // Calculate when to send notification (X minutes before activity)
                const activityStartMinutes = timeToMinutes(block.start);
                const notificationTimeMinutes = activityStartMinutes - block.notificationMinutes;

                // Check if it's time to send notification (within the current minute)
                if (currentTimeMinutes === notificationTimeMinutes) {
                    const startTime12h = formatTime12h(block.start);
                    const minutesText = block.notificationMinutes === 60
                        ? '1 hour'
                        : `${block.notificationMinutes} minutes`;

                    NotificationUtils.send(`Upcoming: ${block.title}`, {
                        body: `${member.name} - Starts at ${startTime12h} (in ${minutesText})`,
                        icon: block.icon || 'circle',
                        tag: `schedule-${member.id}-${block.id}`,
                        data: { memberId: member.id, blockId: block.id }
                    });
                }
            });
        });
    }

    function init() {
        // Check for schedule notifications every minute
        setInterval(checkScheduleNotifications, 60000);
        // Also check immediately
        checkScheduleNotifications();
    }

    /**
     * Show manage schedule modal with visual timeline
     */
    function showManageModal(memberId) {
        const member = Storage.getMember(memberId);
        if (!member) {
            Toast.error('Member not found');
            return;
        }

        currentMemberId = memberId;
        currentDay = 'default';

        const content = `
            <div class="schedule-manager schedule-manager--timeline">
                <div class="schedule-manager__tabs">
                    <button class="schedule-manager__tab schedule-manager__tab--active" data-day="default">
                        Default
                    </button>
                    ${DAYS_SHORT.map((day, index) => `
                        <button class="schedule-manager__tab" data-day="${index}">
                            ${day}
                        </button>
                    `).join('')}
                </div>

                <div class="schedule-timeline-container" id="timelineContainer">
                    ${renderTimeline(memberId, 'default')}
                </div>
            </div>
        `;

        Modal.open({
            title: `Schedule - ${member.name}`,
            content,
            size: 'lg',
            footer: `<button class="btn btn--primary" id="modalDoneBtn">Done</button>`
        });

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Scroll to current time or 8 AM
        scrollToTime();

        // Tab switching
        bindTabEvents(memberId);

        // Timeline events
        bindTimelineEvents(memberId, 'default');

        // Done button
        document.getElementById('modalDoneBtn')?.addEventListener('click', () => {
            Modal.close();
            if (typeof ScheduleSidebar !== 'undefined') {
                ScheduleSidebar.render(memberId);
            }
        });
    }

    /**
     * Render the visual timeline
     */
    function renderTimeline(memberId, day) {
        const scheduleData = Storage.getSchedule(memberId);
        const blocks = scheduleData[day] || [];
        const totalSlots = (TIMELINE_END_HOUR - TIMELINE_START_HOUR) * 2; // 36 slots

        // Generate time slots
        let timeSlots = '';
        for (let i = 0; i < totalSlots; i++) {
            const hour = TIMELINE_START_HOUR + Math.floor(i / 2);
            const minute = (i % 2) * 30;
            const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            const isHour = minute === 0;

            timeSlots += `
                <div class="schedule-timeline__slot ${isHour ? 'schedule-timeline__slot--hour' : ''}"
                     data-time="${timeStr}"
                     data-slot-index="${i}">
                    <span class="schedule-timeline__slot-hint">
                        <i data-lucide="plus"></i>
                        Add
                    </span>
                </div>
            `;
        }

        // Render schedule blocks
        const blocksHtml = blocks.map(block => renderScheduleBlock(block)).join('');

        // Current time indicator
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        let nowLineHtml = '';

        if (currentHour >= TIMELINE_START_HOUR && currentHour < TIMELINE_END_HOUR) {
            const minutesFromStart = (currentHour - TIMELINE_START_HOUR) * 60 + currentMinute;
            const position = (minutesFromStart / 30) * SLOT_HEIGHT;
            nowLineHtml = `
                <div class="schedule-timeline__now-line" style="top: ${position}px">
                    <span class="schedule-timeline__now-label">${formatTime12h(`${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`)}</span>
                </div>
            `;
        }

        return `
            <!-- Add/Edit Form (hidden by default) -->
            <div class="schedule-form-panel" id="scheduleFormPanel" style="display: none;">
                <div class="schedule-form-panel__header">
                    <h4 id="formPanelTitle">Add Activity</h4>
                    <button type="button" class="btn btn--icon btn--ghost" id="closeFormPanel">
                        <i data-lucide="x"></i>
                    </button>
                </div>
                <div class="schedule-form-panel__content">
                    <div class="form-group">
                        <label class="form-label">Activity Name</label>
                        <input type="text" class="form-input" id="activityTitle" placeholder="What are you doing?">
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Start</label>
                            <input type="time" class="form-input" id="activityStart">
                        </div>
                        <div class="form-group">
                            <label class="form-label">End</label>
                            <input type="time" class="form-input" id="activityEnd">
                        </div>
                    </div>

                    <div class="schedule-form-panel__durations">
                        <span class="form-label">Quick Duration:</span>
                        <div class="duration-buttons">
                            <button type="button" class="duration-btn" data-duration="30">30m</button>
                            <button type="button" class="duration-btn duration-btn--active" data-duration="60">1h</button>
                            <button type="button" class="duration-btn" data-duration="90">1.5h</button>
                            <button type="button" class="duration-btn" data-duration="120">2h</button>
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Icon</label>
                        <div class="icon-picker-grid" id="iconPicker">
                            ${SCHEDULE_ICONS.map((icon, i) => `
                                <button type="button" class="icon-picker__btn ${i === 0 ? 'icon-picker__btn--selected' : ''}" data-icon="${icon.id}" title="${icon.name}">
                                    <i data-lucide="${icon.id}"></i>
                                </button>
                            `).join('')}
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Color</label>
                        <div class="color-picker-grid" id="colorPicker">
                            ${ACTIVITY_COLORS.map((color, i) => `
                                <button type="button" class="color-picker__btn ${i === 0 ? 'color-picker__btn--selected' : ''}" data-color="${color.id}" style="background-color: ${color.id}" title="${color.name}"></button>
                            `).join('')}
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">
                            <input type="checkbox" id="scheduleNotificationEnabled" class="form-checkbox" style="margin-right: 8px;">
                            <i data-lucide="bell" style="width: 16px; height: 16px; vertical-align: middle; margin-right: 4px;"></i>
                            Remind me before this activity
                        </label>
                        <div id="scheduleNotificationTimeGroup" style="display: none; margin-top: 8px;">
                            <select class="form-input form-select" id="scheduleNotificationMinutes">
                                <option value="5">5 minutes before</option>
                                <option value="10">10 minutes before</option>
                                <option value="15" selected>15 minutes before</option>
                                <option value="30">30 minutes before</option>
                                <option value="60">1 hour before</option>
                            </select>
                            <span class="form-hint">You'll get a notification before the activity starts</span>
                        </div>
                    </div>

                    <div class="schedule-form-panel__presets">
                        <span class="form-label">Quick Presets:</span>
                        <div class="preset-buttons">
                            ${QUICK_PRESETS.slice(0, 4).map(preset => `
                                <button type="button" class="preset-btn" data-preset='${JSON.stringify(preset)}' style="--preset-color: ${preset.color}">
                                    <i data-lucide="${preset.icon}"></i>
                                    ${preset.title}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                </div>
                <div class="schedule-form-panel__footer">
                    <button type="button" class="btn btn--danger btn--sm" id="deleteActivityBtn" style="display: none;">
                        <i data-lucide="trash-2"></i>
                        Delete
                    </button>
                    <div class="schedule-form-panel__footer-right">
                        <button type="button" class="btn btn--ghost" id="cancelActivityBtn">Cancel</button>
                        <button type="button" class="btn btn--primary" id="saveActivityBtn">Save</button>
                    </div>
                </div>
            </div>

            <div class="schedule-timeline-wrapper">
                <div class="schedule-timeline" data-day="${day}">
                    <div class="schedule-timeline__hours">
                        ${generateHourLabels()}
                    </div>
                    <div class="schedule-timeline__grid" id="timelineGrid">
                        <div class="schedule-timeline__slots">
                            ${timeSlots}
                        </div>
                        <div class="schedule-timeline__blocks" id="timelineBlocks">
                            ${blocksHtml}
                        </div>
                        ${nowLineHtml}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Generate hour labels for the timeline
     */
    function generateHourLabels() {
        let labels = '';
        // Generate labels from 5 AM to 10 PM (not including 11 PM since that's end time)
        for (let hour = TIMELINE_START_HOUR; hour < TIMELINE_END_HOUR; hour++) {
            const time = formatTime12h(`${hour.toString().padStart(2, '0')}:00`);
            labels += `
                <div class="schedule-timeline__hour-label" data-hour="${hour}">
                    ${time}
                </div>
            `;
        }
        return labels;
    }

    /**
     * Render a single schedule block
     */
    function renderScheduleBlock(block) {
        const startMinutes = timeToMinutes(block.start);
        const endMinutes = timeToMinutes(block.end);
        const timelineStartMinutes = TIMELINE_START_HOUR * 60;

        // Calculate position and height
        const topPosition = ((startMinutes - timelineStartMinutes) / 30) * SLOT_HEIGHT;
        const height = ((endMinutes - startMinutes) / 30) * SLOT_HEIGHT;

        // Determine if it's a short block (less than 1 hour)
        const isShort = (endMinutes - startMinutes) < 60;

        return `
            <div class="schedule-timeline__block ${isShort ? 'schedule-timeline__block--short' : ''}"
                 data-block-id="${block.id}"
                 style="top: ${topPosition}px; height: ${Math.max(height, SLOT_HEIGHT)}px; --block-color: ${block.color || '#6366F1'}">
                <div class="schedule-timeline__block-content">
                    <div class="schedule-timeline__block-icon">
                        <i data-lucide="${block.icon || 'circle'}"></i>
                    </div>
                    <div class="schedule-timeline__block-info">
                        <span class="schedule-timeline__block-title">${block.title}</span>
                        ${!isShort ? `
                            <span class="schedule-timeline__block-time">
                                ${formatTime12h(block.start)} - ${formatTime12h(block.end)}
                            </span>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Bind tab switching events
     */
    function bindTabEvents(memberId) {
        const tabs = document.querySelectorAll('.schedule-manager__tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('schedule-manager__tab--active'));
                tab.classList.add('schedule-manager__tab--active');
                currentDay = tab.dataset.day;
                refreshTimeline(memberId, currentDay);
            });
        });
    }

    /**
     * Bind timeline interaction events
     */
    function bindTimelineEvents(memberId, day) {
        const container = document.getElementById('timelineContainer');
        if (!container) return;

        // Click on empty slot to add
        const slots = container.querySelectorAll('.schedule-timeline__slot');
        console.log('Found slots:', slots.length);

        slots.forEach(slot => {
            addTapEvent(slot, (e) => {
                console.log('Slot clicked:', slot.dataset.time);
                // Don't trigger if clicking on a block
                if (e.target.closest('.schedule-timeline__block')) return;

                const time = slot.dataset.time;
                showAddForm(time);
            });
        });

        // Click on block to edit
        const blocks = container.querySelectorAll('.schedule-timeline__block');
        console.log('Found blocks:', blocks.length);

        blocks.forEach(block => {
            addTapEvent(block, (e) => {
                console.log('Block clicked:', block.dataset.blockId);
                e.stopPropagation();
                const blockId = block.dataset.blockId;
                showEditForm(memberId, day, blockId);
            });
        });

        // Form panel events
        bindFormEvents(memberId, day);
    }

    /**
     * Bind form panel events
     */
    function bindFormEvents(memberId, day) {
        const formPanel = document.getElementById('scheduleFormPanel');
        if (!formPanel) return;

        // Close button
        document.getElementById('closeFormPanel')?.addEventListener('click', hideFormPanel);
        document.getElementById('cancelActivityBtn')?.addEventListener('click', hideFormPanel);

        // Duration buttons
        document.querySelectorAll('.duration-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.duration-btn').forEach(b => b.classList.remove('duration-btn--active'));
                btn.classList.add('duration-btn--active');
                updateEndTime(parseInt(btn.dataset.duration));
            });
        });

        // Icon selection
        document.querySelectorAll('#iconPicker .icon-picker__btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#iconPicker .icon-picker__btn').forEach(b => b.classList.remove('icon-picker__btn--selected'));
                btn.classList.add('icon-picker__btn--selected');
            });
        });

        // Color selection
        document.querySelectorAll('#colorPicker .color-picker__btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#colorPicker .color-picker__btn').forEach(b => b.classList.remove('color-picker__btn--selected'));
                btn.classList.add('color-picker__btn--selected');
            });
        });

        // Preset buttons
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const preset = JSON.parse(btn.dataset.preset);
                document.getElementById('activityTitle').value = preset.title;
                updateEndTime(preset.duration);

                // Select icon
                document.querySelectorAll('#iconPicker .icon-picker__btn').forEach(b => {
                    b.classList.toggle('icon-picker__btn--selected', b.dataset.icon === preset.icon);
                });

                // Select color
                document.querySelectorAll('#colorPicker .color-picker__btn').forEach(b => {
                    b.classList.toggle('color-picker__btn--selected', b.dataset.color === preset.color);
                });
            });
        });

        // Start time change - update end time based on selected duration
        document.getElementById('activityStart')?.addEventListener('change', () => {
            const activeDuration = document.querySelector('.duration-btn--active');
            if (activeDuration) {
                updateEndTime(parseInt(activeDuration.dataset.duration));
            }
        });

        // Notification toggle
        document.getElementById('scheduleNotificationEnabled')?.addEventListener('change', (e) => {
            const timeGroup = document.getElementById('scheduleNotificationTimeGroup');
            if (timeGroup) {
                timeGroup.style.display = e.target.checked ? 'block' : 'none';
            }
        });

        // Save button
        document.getElementById('saveActivityBtn')?.addEventListener('click', () => {
            saveActivity(memberId);
        });

        // Delete button
        document.getElementById('deleteActivityBtn')?.addEventListener('click', () => {
            const editingId = formPanel.dataset.editingId;
            if (editingId) {
                deleteActivity(memberId, currentDay, editingId);
            }
        });

        // Enter key to save
        document.getElementById('activityTitle')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveActivity(memberId);
            }
        });
    }

    /**
     * Show the add form for a specific time
     */
    function showAddForm(startTime) {
        console.log('showAddForm called with time:', startTime);
        const formPanel = document.getElementById('scheduleFormPanel');
        console.log('Form panel found:', !!formPanel);
        if (!formPanel) return;

        // Reset form
        formPanel.dataset.editingId = '';
        document.getElementById('formPanelTitle').textContent = 'Add Activity';
        document.getElementById('activityTitle').value = '';
        document.getElementById('activityStart').value = startTime;
        document.getElementById('deleteActivityBtn').style.display = 'none';

        // Set default end time (1 hour)
        updateEndTime(60);

        // Reset selections to first option
        document.querySelectorAll('#iconPicker .icon-picker__btn').forEach((b, i) => {
            b.classList.toggle('icon-picker__btn--selected', i === 0);
        });
        document.querySelectorAll('#colorPicker .color-picker__btn').forEach((b, i) => {
            b.classList.toggle('color-picker__btn--selected', i === 0);
        });
        document.querySelectorAll('.duration-btn').forEach(b => {
            b.classList.toggle('duration-btn--active', b.dataset.duration === '60');
        });

        // Reset notification fields
        const notificationCheckbox = document.getElementById('scheduleNotificationEnabled');
        const notificationTimeGroup = document.getElementById('scheduleNotificationTimeGroup');
        if (notificationCheckbox) {
            notificationCheckbox.checked = false;
        }
        if (notificationTimeGroup) {
            notificationTimeGroup.style.display = 'none';
        }
        const notificationMinutes = document.getElementById('scheduleNotificationMinutes');
        if (notificationMinutes) {
            notificationMinutes.value = '15'; // Default to 15 minutes
        }

        formPanel.style.display = 'flex';
        console.log('Form panel display set to flex');
        document.getElementById('activityTitle')?.focus();

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    /**
     * Show the edit form for an existing block
     */
    function showEditForm(memberId, day, blockId) {
        console.log('showEditForm called:', memberId, day, blockId);
        const scheduleData = Storage.getSchedule(memberId);
        const blocks = scheduleData[day] || [];
        const block = blocks.find(b => b.id === blockId);

        if (!block) {
            console.log('Block not found');
            Toast.error('Block not found');
            return;
        }

        console.log('Found block:', block);
        const formPanel = document.getElementById('scheduleFormPanel');
        if (!formPanel) {
            console.log('Form panel not found');
            return;
        }

        // Fill form with block data
        formPanel.dataset.editingId = blockId;
        document.getElementById('formPanelTitle').textContent = 'Edit Activity';
        document.getElementById('activityTitle').value = block.title;
        document.getElementById('activityStart').value = block.start;
        document.getElementById('activityEnd').value = block.end;
        document.getElementById('deleteActivityBtn').style.display = 'flex';

        // Select icon
        document.querySelectorAll('#iconPicker .icon-picker__btn').forEach(b => {
            b.classList.toggle('icon-picker__btn--selected', b.dataset.icon === block.icon);
        });

        // Select color
        document.querySelectorAll('#colorPicker .color-picker__btn').forEach(b => {
            b.classList.toggle('color-picker__btn--selected', b.dataset.color === block.color);
        });

        // Calculate duration and select button
        const duration = timeToMinutes(block.end) - timeToMinutes(block.start);
        document.querySelectorAll('.duration-btn').forEach(b => {
            b.classList.toggle('duration-btn--active', parseInt(b.dataset.duration) === duration);
        });

        // Populate notification fields
        const notificationCheckbox = document.getElementById('scheduleNotificationEnabled');
        const notificationTimeGroup = document.getElementById('scheduleNotificationTimeGroup');
        const notificationMinutes = document.getElementById('scheduleNotificationMinutes');

        if (notificationCheckbox) {
            notificationCheckbox.checked = block.notificationEnabled || false;
        }
        if (notificationTimeGroup) {
            notificationTimeGroup.style.display = block.notificationEnabled ? 'block' : 'none';
        }
        if (notificationMinutes && block.notificationMinutes) {
            notificationMinutes.value = block.notificationMinutes.toString();
        }

        formPanel.style.display = 'flex';
        document.getElementById('activityTitle')?.focus();

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    /**
     * Hide the form panel
     */
    function hideFormPanel() {
        const formPanel = document.getElementById('scheduleFormPanel');
        if (formPanel) {
            formPanel.style.display = 'none';
            formPanel.dataset.editingId = '';
        }
    }

    /**
     * Update end time based on duration
     */
    function updateEndTime(durationMinutes) {
        const startInput = document.getElementById('activityStart');
        const endInput = document.getElementById('activityEnd');
        if (!startInput || !endInput) return;

        const startMinutes = timeToMinutes(startInput.value);
        const endMinutes = startMinutes + durationMinutes;

        // Clamp to timeline end
        const maxMinutes = TIMELINE_END_HOUR * 60;
        const finalEndMinutes = Math.min(endMinutes, maxMinutes);

        endInput.value = minutesToTime(finalEndMinutes);
    }

    /**
     * Save activity (add or update)
     */
    function saveActivity(memberId) {
        const formPanel = document.getElementById('scheduleFormPanel');
        const editingId = formPanel?.dataset.editingId;

        const title = document.getElementById('activityTitle')?.value?.trim();
        const start = document.getElementById('activityStart')?.value;
        const end = document.getElementById('activityEnd')?.value;
        const icon = document.querySelector('#iconPicker .icon-picker__btn--selected')?.dataset.icon || 'circle';
        const color = document.querySelector('#colorPicker .color-picker__btn--selected')?.dataset.color || '#6366F1';

        // Notification fields
        const notificationEnabled = document.getElementById('scheduleNotificationEnabled')?.checked || false;
        const notificationMinutes = notificationEnabled ? parseInt(document.getElementById('scheduleNotificationMinutes')?.value) || 15 : null;

        // Validation
        if (!title) {
            Toast.error('Please enter an activity name');
            return;
        }
        if (start >= end) {
            Toast.error('End time must be after start time');
            return;
        }

        // Check for overlaps
        const currentSchedule = Storage.getSchedule(memberId);
        const existingBlocks = currentSchedule[currentDay] || [];
        const overlaps = checkOverlap(existingBlocks, start, end, editingId);

        if (editingId) {
            // Update existing
            Storage.updateScheduleBlock(memberId, currentDay, editingId, {
                start, end, title, icon, color, notificationEnabled, notificationMinutes
            });
            Toast.success('Activity updated');
        } else {
            // Add new
            const block = {
                id: `block-${Date.now()}`,
                start, end, title, icon, color, notificationEnabled, notificationMinutes
            };
            Storage.addScheduleBlock(memberId, currentDay, block);
            Toast.success(`Added "${title}"`);
        }

        if (overlaps.length > 0) {
            showOverlapWarning(overlaps);
        }

        hideFormPanel();
        refreshTimeline(memberId, currentDay);

        // Notify sidebar to refresh immediately
        if (typeof State !== 'undefined') {
            State.emit('scheduleUpdated', memberId);
        }
    }

    /**
     * Delete an activity
     */
    function deleteActivity(memberId, day, blockId) {
        Storage.deleteScheduleBlock(memberId, day, blockId);
        Toast.success('Activity deleted');
        hideFormPanel();
        refreshTimeline(memberId, day);

        // Notify sidebar to refresh immediately
        if (typeof State !== 'undefined') {
            State.emit('scheduleUpdated', memberId);
        }
    }

    /**
     * Refresh the timeline view
     */
    function refreshTimeline(memberId, day) {
        const container = document.getElementById('timelineContainer');
        if (!container) return;

        container.innerHTML = renderTimeline(memberId, day);
        bindTimelineEvents(memberId, day);

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    /**
     * Scroll timeline to current time or 8 AM
     */
    function scrollToTime() {
        const container = document.querySelector('.schedule-timeline-container');
        if (!container) return;

        setTimeout(() => {
            const now = new Date();
            const currentHour = now.getHours();

            // Calculate scroll position
            let targetHour = currentHour;
            if (currentHour < TIMELINE_START_HOUR || currentHour >= TIMELINE_END_HOUR) {
                targetHour = 8; // Default to 8 AM
            }

            const scrollPosition = ((targetHour - TIMELINE_START_HOUR) * 2) * SLOT_HEIGHT - 100;
            container.scrollTop = Math.max(0, scrollPosition);
        }, 100);
    }

    /**
     * Check if a new block overlaps with existing blocks
     */
    function checkOverlap(existingBlocks, newStart, newEnd, excludeBlockId = null) {
        return existingBlocks.filter(block => {
            if (excludeBlockId && block.id === excludeBlockId) return false;
            return (newStart < block.end && newEnd > block.start);
        });
    }

    /**
     * Show overlap warning toast
     */
    function showOverlapWarning(overlappingBlocks) {
        const names = overlappingBlocks.map(b => b.title).join(', ');
        Toast.warning(`This overlaps with: ${names}`);
    }

    /**
     * Convert time string to minutes
     */
    function timeToMinutes(timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    }

    /**
     * Convert minutes to time string
     */
    function minutesToTime(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    }

    /**
     * Format time to 12h format
     */
    function formatTime12h(timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const h12 = hours % 12 || 12;
        return `${h12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    }

    // Public API
    return {
        init,
        showManageModal,
        SCHEDULE_ICONS,
        ACTIVITY_COLORS
    };
})();
