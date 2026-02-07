/**
 * ICS Calendar File Parser
 * Parses .ics files from Google Calendar, Apple Calendar, Outlook, etc.
 * Supports recurring events with expansion to 4 weeks
 */

const ICSParser = (function() {

    const WEEKS_TO_EXPAND = 4;

    const DAY_MAP = {
        'SU': 0, 'MO': 1, 'TU': 2, 'WE': 3, 'TH': 4, 'FR': 5, 'SA': 6
    };

    /**
     * Parse ICS content and return array of events
     * @param {string} icsContent - Raw ICS file content
     * @returns {Array} Array of parsed events
     */
    function parse(icsContent) {
        const events = [];
        const vevents = extractVEvents(icsContent);

        for (const vevent of vevents) {
            const parsedEvent = parseVEvent(vevent);
            if (parsedEvent) {
                // Check for recurring events
                const rrule = extractProperty(vevent, 'RRULE');
                if (rrule) {
                    const expandedEvents = expandRecurringEvent(parsedEvent, rrule);
                    events.push(...expandedEvents);
                } else {
                    // Skip past events
                    if (parsedEvent.date >= getToday()) {
                        events.push(parsedEvent);
                    }
                }
            }
        }

        // Sort by date and time
        events.sort((a, b) => {
            const dateCompare = a.date.localeCompare(b.date);
            if (dateCompare !== 0) return dateCompare;
            return (a.time || '00:00').localeCompare(b.time || '00:00');
        });

        return events;
    }

    /**
     * Extract all VEVENT blocks from ICS content
     */
    function extractVEvents(content) {
        const events = [];
        const regex = /BEGIN:VEVENT([\s\S]*?)END:VEVENT/g;
        let match;

        while ((match = regex.exec(content)) !== null) {
            events.push(match[1]);
        }

        return events;
    }

    /**
     * Parse a single VEVENT block
     */
    function parseVEvent(vevent) {
        const summary = extractProperty(vevent, 'SUMMARY');
        const dtstart = extractProperty(vevent, 'DTSTART');
        const dtend = extractProperty(vevent, 'DTEND');
        const description = extractProperty(vevent, 'DESCRIPTION');
        const location = extractProperty(vevent, 'LOCATION');

        if (!summary || !dtstart) return null;

        const startDate = parseDateTime(dtstart);
        const endDate = dtend ? parseDateTime(dtend) : null;

        if (!startDate) return null;

        return {
            title: unescapeICS(summary),
            date: startDate.date,
            time: startDate.time,
            endTime: endDate?.time || null,
            isAllDay: startDate.isAllDay,
            description: description ? unescapeICS(description) : '',
            location: location ? unescapeICS(location) : ''
        };
    }

    /**
     * Extract a property value from VEVENT content
     */
    function extractProperty(vevent, propName) {
        // Handle properties with parameters like DTSTART;TZID=America/New_York:20260124T090000
        const regex = new RegExp(`^${propName}(?:;[^:]*)?:(.*)$`, 'im');
        const match = vevent.match(regex);

        if (match) {
            // Handle line folding (lines starting with space/tab are continuations)
            let value = match[1];
            const lines = vevent.split(/\r?\n/);
            const propIndex = lines.findIndex(l => l.match(regex));

            if (propIndex >= 0) {
                let i = propIndex + 1;
                while (i < lines.length && /^[ \t]/.test(lines[i])) {
                    value += lines[i].substring(1);
                    i++;
                }
            }

            return value.trim();
        }

        return null;
    }

    /**
     * Parse ICS datetime format
     * Formats: 20260124T090000Z, 20260124T090000, 20260124 (all-day)
     */
    function parseDateTime(dtValue) {
        // All-day event (date only)
        if (/^\d{8}$/.test(dtValue)) {
            const year = dtValue.substring(0, 4);
            const month = dtValue.substring(4, 6);
            const day = dtValue.substring(6, 8);
            return {
                date: `${year}-${month}-${day}`,
                time: null,
                isAllDay: true
            };
        }

        // DateTime format: 20260124T090000 or 20260124T090000Z
        const match = dtValue.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/);
        if (!match) return null;

        const [, year, month, day, hour, minute, , isUTC] = match;

        let date = new Date(
            parseInt(year),
            parseInt(month) - 1,
            parseInt(day),
            parseInt(hour),
            parseInt(minute)
        );

        // Convert UTC to local time
        if (isUTC) {
            date = new Date(Date.UTC(
                parseInt(year),
                parseInt(month) - 1,
                parseInt(day),
                parseInt(hour),
                parseInt(minute)
            ));
        }

        return {
            date: formatDate(date),
            time: formatTime(date),
            isAllDay: false
        };
    }

    /**
     * Expand recurring event to multiple instances
     */
    function expandRecurringEvent(baseEvent, rrule) {
        const events = [];
        const rules = parseRRule(rrule);

        if (!rules.freq) return [baseEvent];

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const endDate = new Date(today);
        endDate.setDate(endDate.getDate() + (WEEKS_TO_EXPAND * 7));

        const startDate = new Date(baseEvent.date + 'T00:00:00');

        // If start date is in the future, use it; otherwise use today
        let currentDate = startDate > today ? new Date(startDate) : new Date(today);

        while (currentDate <= endDate && events.length < 100) {
            let shouldAdd = false;

            switch (rules.freq) {
                case 'DAILY':
                    shouldAdd = true;
                    break;

                case 'WEEKLY':
                    if (rules.byDay && rules.byDay.length > 0) {
                        shouldAdd = rules.byDay.includes(currentDate.getDay());
                    } else {
                        shouldAdd = currentDate.getDay() === startDate.getDay();
                    }
                    break;

                case 'MONTHLY':
                    shouldAdd = currentDate.getDate() === startDate.getDate();
                    break;
            }

            if (shouldAdd && currentDate >= today) {
                events.push({
                    ...baseEvent,
                    date: formatDate(currentDate),
                    isRecurring: true
                });
            }

            // Move to next day
            currentDate.setDate(currentDate.getDate() + (rules.interval || 1));

            // For weekly events without BYDAY, jump by week
            if (rules.freq === 'WEEKLY' && (!rules.byDay || rules.byDay.length === 0)) {
                currentDate.setDate(currentDate.getDate() + 6);
            }
        }

        return events;
    }

    /**
     * Parse RRULE string
     * Example: FREQ=WEEKLY;BYDAY=MO,WE,FR;INTERVAL=1
     */
    function parseRRule(rrule) {
        const rules = {};
        const parts = rrule.split(';');

        for (const part of parts) {
            const [key, value] = part.split('=');

            switch (key) {
                case 'FREQ':
                    rules.freq = value;
                    break;
                case 'BYDAY':
                    rules.byDay = value.split(',').map(day => {
                        // Handle cases like "1MO" (first Monday)
                        const dayCode = day.replace(/^-?\d+/, '');
                        return DAY_MAP[dayCode];
                    }).filter(d => d !== undefined);
                    break;
                case 'INTERVAL':
                    rules.interval = parseInt(value);
                    break;
                case 'COUNT':
                    rules.count = parseInt(value);
                    break;
                case 'UNTIL':
                    rules.until = parseDateTime(value)?.date;
                    break;
            }
        }

        return rules;
    }

    /**
     * Unescape ICS special characters
     */
    function unescapeICS(text) {
        return text
            .replace(/\\n/g, '\n')
            .replace(/\\,/g, ',')
            .replace(/\\;/g, ';')
            .replace(/\\\\/g, '\\');
    }

    /**
     * Format date as YYYY-MM-DD
     */
    function formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    /**
     * Format time as HH:MM
     */
    function formatTime(date) {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    /**
     * Get today's date as YYYY-MM-DD
     */
    function getToday() {
        return formatDate(new Date());
    }

    /**
     * Format time for display (12-hour format)
     */
    function formatTimeDisplay(time) {
        if (!time) return 'All day';

        const [hours, minutes] = time.split(':').map(Number);
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const hour12 = hours % 12 || 12;
        return `${hour12}:${String(minutes).padStart(2, '0')} ${ampm}`;
    }

    /**
     * Format date for display
     */
    function formatDateDisplay(dateStr) {
        const date = new Date(dateStr + 'T00:00:00');
        const options = { weekday: 'short', month: 'short', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }

    /**
     * Export events to ICS format
     * @param {Array} events - Array of calendar events
     * @param {string} calendarName - Name for the calendar
     * @returns {string} ICS file content
     */
    function exportToICS(events, calendarName = 'Home Anchor Calendar') {
        const lines = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Home Anchor//Calendar//EN',
            `X-WR-CALNAME:${escapeICS(calendarName)}`,
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH'
        ];

        for (const event of events) {
            const uid = `${event.id}@homeanchor`;
            const now = formatICSDateTime(new Date());

            lines.push('BEGIN:VEVENT');
            lines.push(`UID:${uid}`);
            lines.push(`DTSTAMP:${now}`);
            lines.push(`SUMMARY:${escapeICS(event.title)}`);

            // Date and time
            if (event.time) {
                const startDT = formatICSDateTime(new Date(`${event.date}T${event.time}:00`));
                lines.push(`DTSTART:${startDT}`);

                if (event.endTime) {
                    const endDT = formatICSDateTime(new Date(`${event.date}T${event.endTime}:00`));
                    lines.push(`DTEND:${endDT}`);
                } else {
                    // Default to 1 hour duration
                    const endDate = new Date(`${event.date}T${event.time}:00`);
                    endDate.setHours(endDate.getHours() + 1);
                    lines.push(`DTEND:${formatICSDateTime(endDate)}`);
                }
            } else {
                // All-day event
                const dateOnly = event.date.replace(/-/g, '');
                lines.push(`DTSTART;VALUE=DATE:${dateOnly}`);
                // All-day events end on the next day
                const nextDay = new Date(event.date + 'T00:00:00');
                nextDay.setDate(nextDay.getDate() + 1);
                const nextDayStr = formatDate(nextDay).replace(/-/g, '');
                lines.push(`DTEND;VALUE=DATE:${nextDayStr}`);
            }

            if (event.description) {
                lines.push(`DESCRIPTION:${escapeICS(event.description)}`);
            }

            if (event.location) {
                lines.push(`LOCATION:${escapeICS(event.location)}`);
            }

            lines.push('END:VEVENT');
        }

        lines.push('END:VCALENDAR');

        return lines.join('\r\n');
    }

    /**
     * Escape special characters for ICS format
     */
    function escapeICS(text) {
        if (!text) return '';
        return text
            .replace(/\\/g, '\\\\')
            .replace(/;/g, '\\;')
            .replace(/,/g, '\\,')
            .replace(/\n/g, '\\n');
    }

    /**
     * Format date/time for ICS (YYYYMMDDTHHmmss)
     */
    function formatICSDateTime(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${year}${month}${day}T${hours}${minutes}${seconds}`;
    }

    /**
     * Download ICS file
     * @param {Array} events - Array of calendar events
     * @param {string} filename - Filename for download
     */
    function downloadICS(events, filename = 'home-anchor-calendar.ics') {
        const icsContent = exportToICS(events);
        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Public API
    return {
        parse,
        exportToICS,
        downloadICS,
        formatTimeDisplay,
        formatDateDisplay
    };

})();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ICSParser;
}
