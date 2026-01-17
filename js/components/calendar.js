/**
 * Calendar Component
 * Family calendar for home tab
 */

const Calendar = (function() {
    let currentDate = new Date();
    let container = null;

    /**
     * Check and send notifications for upcoming calendar events
     */
    function checkEventNotifications() {
        // Only check if notifications are supported and enabled
        if (typeof NotificationUtils === 'undefined' || !NotificationUtils.areNotificationsEnabled()) {
            return;
        }

        const events = Storage.getCalendarEvents();
        const now = new Date();
        const today = DateUtils.today(); // Get today's date in YYYY-MM-DD format

        events.forEach(event => {
            // Skip if no notification enabled or no time set
            if (!event.notificationEnabled || !event.time || !event.date) {
                return;
            }

            // Only check events for today
            if (event.date !== today) {
                return;
            }

            // Parse event time (HH:MM format)
            const [eventHours, eventMinutes] = event.time.split(':').map(Number);
            const eventTimeMinutes = eventHours * 60 + eventMinutes;

            // Calculate notification time (15 minutes before by default)
            const notificationMinutes = event.notificationMinutes || 15;
            const notificationTimeMinutes = eventTimeMinutes - notificationMinutes;

            // Current time in minutes
            const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();

            // Check if it's time to send notification (within the current minute)
            if (currentTimeMinutes === notificationTimeMinutes) {
                const member = Storage.getMember(event.memberId);
                const eventTime12h = formatTime12h(event.time);

                NotificationUtils.send(`Upcoming Event: ${event.title}`, {
                    body: `${member?.name || 'Event'} - ${eventTime12h} (in ${notificationMinutes} minutes)`,
                    icon: 'calendar',
                    tag: `calendar-event-${event.id}`,
                    data: { eventId: event.id, memberId: event.memberId }
                });
            }
        });
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

    /**
     * Initialize calendar
     */
    function init() {
        // Check for event notifications every minute
        setInterval(checkEventNotifications, 60000);
        // Also check immediately
        checkEventNotifications();
    }

    /**
     * Render calendar to container
     */
    function render(targetContainer) {
        container = targetContainer;
        if (!container) return;

        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const grid = DateUtils.getMonthGrid(year, month);
        const events = Storage.getCalendarEvents();
        const members = Storage.getMembers();

        // Create member color map using avatar colors
        const memberColors = {};
        members.forEach(member => {
            memberColors[member.id] = member.avatar?.color || '#6366F1';
        });

        container.innerHTML = `
            <div class="calendar">
                <div class="calendar__header">
                    <div class="calendar__nav">
                        <button class="calendar__nav-btn" id="calPrev" aria-label="Previous month">
                            <i data-lucide="chevron-left"></i>
                        </button>
                        <h2 class="calendar__title">${DateUtils.getMonthName(currentDate)} ${year}</h2>
                        <button class="calendar__nav-btn" id="calNext" aria-label="Next month">
                            <i data-lucide="chevron-right"></i>
                        </button>
                    </div>
                    <div class="calendar__actions">
                        <button class="calendar__today-btn" id="calToday">Today</button>
                        <button class="btn btn--primary btn--sm" id="addEventBtn">
                            <i data-lucide="plus"></i>
                            Add Event
                        </button>
                    </div>
                </div>

                <div class="calendar__grid">
                    ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => `
                        <div class="calendar__day-header">${day}</div>
                    `).join('')}

                    ${grid.map(({ date, isCurrentMonth }) => {
                        const dateStr = DateUtils.formatISO(date);
                        const dayEvents = events.filter(e => e.date === dateStr);
                        const isToday = DateUtils.isToday(date);
                        const isPast = DateUtils.isPast(date) && !isToday;
                        const hasEvents = dayEvents.length > 0;
                        // Get unique colors for mobile dots (up to 3)
                        const uniqueColors = [...new Set(dayEvents.map(e => memberColors[e.memberId] || e.color || '#6366F1'))].slice(0, 3);

                        return `
                            <div
                                class="calendar__day ${!isCurrentMonth ? 'calendar__day--outside' : ''} ${isToday ? 'calendar__day--today' : ''} ${isPast ? 'calendar__day--past' : ''} ${hasEvents ? 'calendar__day--has-events' : ''}"
                                data-date="${dateStr}"
                            >
                                <span class="calendar__day-number">${date.getDate()}</span>
                                <div class="calendar__events">
                                    ${dayEvents.slice(0, 3).map(event => {
                                        const color = memberColors[event.memberId] || event.color || '#6366F1';
                                        return `
                                            <div
                                                class="calendar__event"
                                                style="background-color: ${color}"
                                                data-event-id="${event.id}"
                                                title="${event.title}"
                                            >
                                                ${event.time ? DateUtils.formatTime(event.time) + ' ' : ''}${event.title}
                                            </div>
                                        `;
                                    }).join('')}
                                    ${dayEvents.length > 3 ? `
                                        <span class="calendar__more">+${dayEvents.length - 3} more</span>
                                    ` : ''}
                                </div>
                                ${hasEvents ? `
                                    <div class="calendar__mobile-dots">
                                        ${uniqueColors.map(color => `<span class="calendar__mobile-dot" style="background-color: ${color}"></span>`).join('')}
                                    </div>
                                ` : ''}
                            </div>
                        `;
                    }).join('')}
                </div>

                <div class="calendar__legend">
                    ${members.map(member => `
                        <div class="calendar__legend-item">
                            <span class="calendar__legend-dot" style="background-color: ${member.avatar?.color || '#6366F1'}"></span>
                            <span>${member.name}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        // Initialize icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Bind events
        bindEvents();
    }

    /**
     * Bind calendar events
     */
    function bindEvents() {
        // Navigation
        document.getElementById('calPrev')?.addEventListener('click', () => {
            currentDate = DateUtils.addMonths(currentDate, -1);
            render(container);
        });

        document.getElementById('calNext')?.addEventListener('click', () => {
            currentDate = DateUtils.addMonths(currentDate, 1);
            render(container);
        });

        document.getElementById('calToday')?.addEventListener('click', () => {
            currentDate = new Date();
            render(container);
        });

        // Add event button
        document.getElementById('addEventBtn')?.addEventListener('click', () => {
            showAddEventModal();
        });

        // Day click - show events on mobile, add event on desktop
        container?.querySelectorAll('.calendar__day').forEach(day => {
            day.addEventListener('click', (e) => {
                // Don't trigger if clicking on an event
                if (e.target.closest('.calendar__event')) return;

                const date = day.dataset.date;
                const isMobile = window.innerWidth <= 480;
                const hasEvents = day.classList.contains('calendar__day--has-events');

                // On mobile with events, show the day's events first
                if (isMobile && hasEvents) {
                    showDayEventsPanel(date);
                } else {
                    showAddEventModal(date);
                }
            });
        });

        // Event click to view/edit
        container?.querySelectorAll('.calendar__event').forEach(eventEl => {
            eventEl.addEventListener('click', (e) => {
                e.stopPropagation();
                const eventId = eventEl.dataset.eventId;
                showEventModal(eventId);
            });
        });
    }

    /**
     * Show add event modal
     */
    function showAddEventModal(prefilledDate = null) {
        const members = Storage.getMembers();
        const defaultDate = prefilledDate || DateUtils.today();

        const content = `
            <form id="addEventForm">
                <div class="form-group">
                    <label class="form-label">Event Title</label>
                    <input type="text" class="form-input" id="eventTitle" placeholder="e.g., Soccer practice" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Date</label>
                    <input type="date" class="form-input" id="eventDate" value="${defaultDate}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Time (optional)</label>
                    <input type="time" class="form-input" id="eventTime">
                </div>
                <div class="form-group">
                    <label class="form-label">Family Member</label>
                    <select class="form-input form-select" id="eventMember">
                        ${members.map(member => `
                            <option value="${member.id}">${member.name}</option>
                        `).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Repeat</label>
                    <select class="form-input form-select" id="eventRepeat">
                        <option value="none">Does not repeat</option>
                        <option value="weekly">Weekly</option>
                        <option value="biweekly">Every 2 weeks</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">
                        <input type="checkbox" id="eventNotificationEnabled" class="form-checkbox" style="margin-right: 8px;" checked>
                        <i data-lucide="bell" style="width: 16px; height: 16px; vertical-align: middle; margin-right: 4px;"></i>
                        Remind me 15 minutes before
                    </label>
                    <span class="form-hint">Only works for events with a time set</span>
                </div>
            </form>
        `;

        Modal.open({
            title: 'Add Event',
            content,
            footer: Modal.createFooter('Cancel', 'Add Event')
        });

        Modal.bindFooterEvents(() => {
            const title = document.getElementById('eventTitle')?.value?.trim();
            const date = document.getElementById('eventDate')?.value;
            const time = document.getElementById('eventTime')?.value || null;
            const memberId = document.getElementById('eventMember')?.value;
            const repeat = document.getElementById('eventRepeat')?.value || 'none';
            const notificationEnabled = document.getElementById('eventNotificationEnabled')?.checked || false;

            if (!title || !date) {
                Toast.error('Please fill in required fields');
                return false;
            }

            const member = Storage.getMember(memberId);
            const baseEvent = {
                title,
                time,
                memberId,
                color: member?.avatar?.color || '#6366F1',
                notificationEnabled: notificationEnabled && time !== null,
                notificationMinutes: 15,
                repeat: repeat
            };

            // Create recurring events if repeat is selected
            if (repeat !== 'none') {
                const eventDates = generateRecurringDates(date, repeat, 12); // Generate 12 occurrences
                eventDates.forEach(eventDate => {
                    Storage.addCalendarEvent({ ...baseEvent, date: eventDate });
                });
                Toast.success(`${eventDates.length} recurring events added`);
            } else {
                Storage.addCalendarEvent({ ...baseEvent, date });
                Toast.success('Event added');
            }

            render(container);
            return true;
        });
    }

    /**
     * Generate recurring dates based on repeat type
     */
    function generateRecurringDates(startDate, repeatType, count) {
        const dates = [];
        let current = new Date(startDate);

        for (let i = 0; i < count; i++) {
            dates.push(DateUtils.formatISO(current));

            switch (repeatType) {
                case 'weekly':
                    current.setDate(current.getDate() + 7);
                    break;
                case 'biweekly':
                    current.setDate(current.getDate() + 14);
                    break;
                case 'monthly':
                    current.setMonth(current.getMonth() + 1);
                    break;
                case 'yearly':
                    current.setFullYear(current.getFullYear() + 1);
                    break;
            }
        }

        return dates;
    }

    /**
     * Show event detail/edit modal
     */
    function showEventModal(eventId) {
        const events = Storage.getCalendarEvents();
        const event = events.find(e => e.id === eventId);
        if (!event) return;

        const member = Storage.getMember(event.memberId);
        const eventColor = member?.avatar?.color || event.color || '#6366F1';

        const content = `
            <div class="event-detail">
                <div class="event-detail__header">
                    <span class="event-detail__color" style="background-color: ${eventColor}"></span>
                    <h3 class="event-detail__title">${event.title}</h3>
                </div>
                <div class="event-detail__row">
                    <i data-lucide="calendar" class="event-detail__icon"></i>
                    <span class="event-detail__label">Date</span>
                    <span class="event-detail__value">${DateUtils.formatLong(event.date)}</span>
                </div>
                ${event.time ? `
                    <div class="event-detail__row">
                        <i data-lucide="clock" class="event-detail__icon"></i>
                        <span class="event-detail__label">Time</span>
                        <span class="event-detail__value">${DateUtils.formatTime(event.time)}</span>
                    </div>
                ` : ''}
                <div class="event-detail__row">
                    <i data-lucide="user" class="event-detail__icon"></i>
                    <span class="event-detail__label">Family Member</span>
                    <span class="event-detail__value">${member?.name || 'Unknown'}</span>
                </div>
            </div>
        `;

        Modal.open({
            title: 'Event Details',
            content,
            footer: `
                <button class="btn btn--danger" id="deleteEventBtn">
                    <i data-lucide="trash-2"></i>
                    Delete
                </button>
                <button class="btn btn--secondary" id="editEventBtn">
                    <i data-lucide="edit-2"></i>
                    Edit
                </button>
                <button class="btn btn--primary" data-modal-cancel>Close</button>
            `
        });

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        document.getElementById('deleteEventBtn')?.addEventListener('click', async () => {
            const confirmed = await Modal.dangerConfirm('Delete this event?', 'Delete Event');
            if (confirmed) {
                Storage.deleteCalendarEvent(eventId);
                render(container);
                Toast.success('Event deleted');
            }
        });

        document.getElementById('editEventBtn')?.addEventListener('click', () => {
            Modal.close();
            // Wait for modal close animation before opening edit modal
            setTimeout(() => showEditEventModal(event), 250);
        });

        document.querySelector('[data-modal-cancel]')?.addEventListener('click', () => {
            Modal.close();
        });
    }

    /**
     * Show day events panel (for mobile)
     */
    function showDayEventsPanel(dateStr) {
        const events = Storage.getCalendarEvents();
        const dayEvents = events.filter(e => e.date === dateStr);
        const members = Storage.getMembers();

        if (dayEvents.length === 0) return;

        const memberColors = {};
        members.forEach(m => { memberColors[m.id] = m.avatar?.color || '#6366F1'; });

        const content = `
            <div class="day-events-panel">
                <div class="day-events-panel__date">
                    <i data-lucide="calendar"></i>
                    ${DateUtils.formatLong(dateStr)}
                </div>
                <div class="day-events-panel__list">
                    ${dayEvents.map(event => {
                        const member = members.find(m => m.id === event.memberId);
                        const color = memberColors[event.memberId] || event.color || '#6366F1';
                        return `
                            <div class="day-events-panel__item" data-event-id="${event.id}">
                                <span class="day-events-panel__dot" style="background-color: ${color}"></span>
                                <div class="day-events-panel__info">
                                    <div class="day-events-panel__title">${event.title}</div>
                                    <div class="day-events-panel__meta">
                                        ${event.time ? `<span>${DateUtils.formatTime(event.time)}</span>` : ''}
                                        <span>${member?.name || 'Unknown'}</span>
                                    </div>
                                </div>
                                <i data-lucide="chevron-right" class="day-events-panel__arrow"></i>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;

        Modal.open({
            title: 'Events',
            content,
            footer: `
                <button class="btn btn--secondary" data-modal-cancel>Close</button>
                <button class="btn btn--primary" id="addEventOnDay">
                    <i data-lucide="plus"></i>
                    Add Another Event
                </button>
            `
        });

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Event item click to view details
        document.querySelectorAll('.day-events-panel__item').forEach(item => {
            item.addEventListener('click', () => {
                Modal.close();
                setTimeout(() => showEventModal(item.dataset.eventId), 250);
            });
        });

        // Add event button
        document.getElementById('addEventOnDay')?.addEventListener('click', () => {
            Modal.close();
            setTimeout(() => showAddEventModal(dateStr), 250);
        });

        document.querySelector('[data-modal-cancel]')?.addEventListener('click', () => {
            Modal.close();
        });
    }

    /**
     * Show edit event modal
     */
    function showEditEventModal(event) {
        const members = Storage.getMembers();

        const content = `
            <form id="editEventForm">
                <div class="form-group">
                    <label class="form-label">Event Title</label>
                    <input type="text" class="form-input" id="editEventTitle" value="${event.title}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Date</label>
                    <input type="date" class="form-input" id="editEventDate" value="${event.date}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Time (optional)</label>
                    <input type="time" class="form-input" id="editEventTime" value="${event.time || ''}">
                </div>
                <div class="form-group">
                    <label class="form-label">Family Member</label>
                    <select class="form-input form-select" id="editEventMember">
                        ${members.map(member => `
                            <option value="${member.id}" ${member.id === event.memberId ? 'selected' : ''}>${member.name}</option>
                        `).join('')}
                    </select>
                </div>
            </form>
        `;

        Modal.open({
            title: 'Edit Event',
            content,
            footer: Modal.createFooter('Cancel', 'Save Changes')
        });

        Modal.bindFooterEvents(() => {
            const title = document.getElementById('editEventTitle')?.value?.trim();
            const date = document.getElementById('editEventDate')?.value;
            const time = document.getElementById('editEventTime')?.value || null;
            const memberId = document.getElementById('editEventMember')?.value;

            if (!title || !date) {
                Toast.error('Please fill in required fields');
                return false;
            }

            const member = Storage.getMember(memberId);

            Storage.updateCalendarEvent(event.id, {
                title,
                date,
                time,
                memberId,
                color: member?.avatar?.color || '#6366F1'
            });

            // Re-render calendar if container still exists
            if (container && document.contains(container)) {
                render(container);
            }
            Toast.success('Event updated');
            return true;
        });
    }

    /**
     * Go to specific month
     */
    function goToMonth(year, month) {
        currentDate = new Date(year, month, 1);
        render(container);
    }

    /**
     * Go to today
     */
    function goToToday() {
        currentDate = new Date();
        render(container);
    }

    /**
     * Get today's highlights (calendar events only)
     */
    function getTodayHighlights() {
        const today = DateUtils.today();
        const events = Storage.getCalendarEvents();
        const highlights = [];

        // Add calendar events for today
        events.filter(e => e.date === today).forEach(event => {
            const member = Storage.getMember(event.memberId);
            highlights.push({
                type: 'calendar',
                title: event.title,
                time: event.time,
                endTime: event.endTime,
                memberName: member?.name || 'Unknown',
                memberId: event.memberId,
                color: member?.avatar?.color || event.color || '#6366F1',
                icon: 'calendar'
            });
        });

        // Sort by time
        highlights.sort((a, b) => {
            const timeA = a.time || '00:00';
            const timeB = b.time || '00:00';
            return timeA.localeCompare(timeB);
        });

        return highlights;
    }

    /**
     * Render today's highlights section
     */
    function renderHighlights(targetContainer) {
        if (!targetContainer) return;

        const highlights = getTodayHighlights();

        if (highlights.length === 0) {
            targetContainer.innerHTML = `
                <div class="highlights-empty">
                    <i data-lucide="sun"></i>
                    <p>No calendar events for today</p>
                </div>
            `;
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
            return;
        }

        targetContainer.innerHTML = `
            <div class="highlights">
                ${highlights.map(item => `
                    <div class="highlight-item" data-member-id="${item.memberId}">
                        <div class="highlight-item__time">
                            ${item.time ? DateUtils.formatTime(item.time) : 'All day'}
                            ${item.endTime ? ` - ${DateUtils.formatTime(item.endTime)}` : ''}
                        </div>
                        <div class="highlight-item__color" style="background-color: ${item.color}"></div>
                        <div class="highlight-item__content">
                            <span class="highlight-item__title">${item.title}</span>
                            <span class="highlight-item__member">${item.memberName}</span>
                        </div>
                        <div class="highlight-item__type">
                            <i data-lucide="${item.icon}"></i>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Bind click to navigate to member tab
        targetContainer.querySelectorAll('.highlight-item').forEach(item => {
            item.addEventListener('click', () => {
                const memberId = item.dataset.memberId;
                if (memberId && typeof Tabs !== 'undefined') {
                    Tabs.switchTo(memberId);
                }
            });
        });
    }

    // Public API
    return {
        init,
        render,
        goToMonth,
        goToToday,
        getTodayHighlights,
        renderHighlights
    };
})();
