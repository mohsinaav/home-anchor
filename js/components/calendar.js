/**
 * Calendar Component
 * Family calendar for home tab
 */

const Calendar = (function() {
    let currentDate = new Date();
    let container = null;

    /**
     * Initialize calendar
     */
    function init() {
        // Calendar will be rendered when home tab is active
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

        // Day click to add event
        container?.querySelectorAll('.calendar__day').forEach(day => {
            day.addEventListener('click', (e) => {
                // Don't trigger if clicking on an event
                if (e.target.closest('.calendar__event')) return;

                const date = day.dataset.date;
                showAddEventModal(date);
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

            if (!title || !date) {
                Toast.error('Please fill in required fields');
                return false;
            }

            const member = Storage.getMember(memberId);

            Storage.addCalendarEvent({
                title,
                date,
                time,
                memberId,
                color: member?.avatar?.color || '#6366F1'
            });

            render(container);
            Toast.success('Event added');
            return true;
        });
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
