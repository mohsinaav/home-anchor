/**
 * Date Utilities
 * Helper functions for date manipulation and formatting
 */

const DateUtils = (function() {
    const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const MONTHS = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    /**
     * Get today's date as YYYY-MM-DD string (in local timezone)
     */
    function today() {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    /**
     * Format date as YYYY-MM-DD (in local timezone)
     */
    function formatISO(date) {
        if (typeof date === 'string') {
            date = new Date(date);
        }
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    /**
     * Format date for display (e.g., "December 14, 2025")
     */
    function formatLong(date) {
        if (typeof date === 'string') {
            date = new Date(date);
        }
        return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    }

    /**
     * Format date short (e.g., "Dec 14")
     */
    function formatShort(date) {
        if (typeof date === 'string') {
            date = new Date(date);
        }
        return `${MONTHS_SHORT[date.getMonth()]} ${date.getDate()}`;
    }

    /**
     * Format date with day name (e.g., "Saturday, Dec 14")
     */
    function formatWithDay(date) {
        if (typeof date === 'string') {
            date = new Date(date);
        }
        return `${DAYS[date.getDay()]}, ${MONTHS_SHORT[date.getMonth()]} ${date.getDate()}`;
    }

    /**
     * Get day name
     */
    function getDayName(date, short = false) {
        if (typeof date === 'string') {
            date = new Date(date);
        }
        return short ? DAYS_SHORT[date.getDay()] : DAYS[date.getDay()];
    }

    /**
     * Get month name
     */
    function getMonthName(date, short = false) {
        if (typeof date === 'string') {
            date = new Date(date);
        }
        return short ? MONTHS_SHORT[date.getMonth()] : MONTHS[date.getMonth()];
    }

    /**
     * Get week number (ISO week)
     */
    function getWeekNumber(date) {
        if (typeof date === 'string') {
            date = new Date(date);
        }
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        return weekNo;
    }

    /**
     * Get week key (e.g., "2025-W51")
     */
    function getWeekKey(date) {
        if (typeof date === 'string') {
            date = new Date(date);
        }
        const weekNum = getWeekNumber(date);
        const year = date.getFullYear();
        return `${year}-W${weekNum.toString().padStart(2, '0')}`;
    }

    /**
     * Get first day of the week (Monday)
     */
    function getWeekStart(date) {
        if (typeof date === 'string') {
            date = new Date(date);
        }
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    }

    /**
     * Get last day of the week (Sunday)
     */
    function getWeekEnd(date) {
        const start = getWeekStart(date);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        return end;
    }

    /**
     * Get all days in a month
     */
    function getDaysInMonth(year, month) {
        return new Date(year, month + 1, 0).getDate();
    }

    /**
     * Get first day of month (0 = Sunday)
     */
    function getFirstDayOfMonth(year, month) {
        return new Date(year, month, 1).getDay();
    }

    /**
     * Get calendar grid for a month
     */
    function getMonthGrid(year, month) {
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);
        const grid = [];

        // Sunday start (0 = Sunday, 6 = Saturday)
        const startOffset = firstDay;

        // Previous month days
        const prevMonth = month === 0 ? 11 : month - 1;
        const prevYear = month === 0 ? year - 1 : year;
        const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth);

        for (let i = startOffset - 1; i >= 0; i--) {
            grid.push({
                date: new Date(prevYear, prevMonth, daysInPrevMonth - i),
                isCurrentMonth: false
            });
        }

        // Current month days
        for (let i = 1; i <= daysInMonth; i++) {
            grid.push({
                date: new Date(year, month, i),
                isCurrentMonth: true
            });
        }

        // Next month days
        const nextMonth = month === 11 ? 0 : month + 1;
        const nextYear = month === 11 ? year + 1 : year;
        const remainingDays = 42 - grid.length; // 6 rows × 7 days

        for (let i = 1; i <= remainingDays; i++) {
            grid.push({
                date: new Date(nextYear, nextMonth, i),
                isCurrentMonth: false
            });
        }

        return grid;
    }

    /**
     * Check if two dates are the same day
     */
    function isSameDay(date1, date2) {
        if (typeof date1 === 'string') date1 = new Date(date1);
        if (typeof date2 === 'string') date2 = new Date(date2);
        return (
            date1.getFullYear() === date2.getFullYear() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getDate() === date2.getDate()
        );
    }

    /**
     * Check if date is today
     */
    function isToday(date) {
        return isSameDay(date, new Date());
    }

    /**
     * Check if date is in the past
     */
    function isPast(date) {
        if (typeof date === 'string') date = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date < today;
    }

    /**
     * Add days to a date
     */
    function addDays(date, days) {
        if (typeof date === 'string') date = new Date(date);
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }

    /**
     * Add months to a date
     */
    function addMonths(date, months) {
        if (typeof date === 'string') date = new Date(date);
        const result = new Date(date);
        result.setMonth(result.getMonth() + months);
        return result;
    }

    /**
     * Get relative time (e.g., "2 days ago", "in 3 hours")
     */
    function relativeTime(date) {
        if (typeof date === 'string') date = new Date(date);
        const now = new Date();
        const diff = date - now;
        const absDiff = Math.abs(diff);

        const minutes = Math.floor(absDiff / 60000);
        const hours = Math.floor(absDiff / 3600000);
        const days = Math.floor(absDiff / 86400000);

        const isFuture = diff > 0;
        const prefix = isFuture ? 'in ' : '';
        const suffix = isFuture ? '' : ' ago';

        if (days > 0) {
            return `${prefix}${days} day${days > 1 ? 's' : ''}${suffix}`;
        } else if (hours > 0) {
            return `${prefix}${hours} hour${hours > 1 ? 's' : ''}${suffix}`;
        } else if (minutes > 0) {
            return `${prefix}${minutes} minute${minutes > 1 ? 's' : ''}${suffix}`;
        } else {
            return 'just now';
        }
    }

    /**
     * Format time (e.g., "4:00 PM")
     */
    function formatTime(time) {
        if (!time) return '';
        const [hours, minutes] = time.split(':');
        const h = parseInt(hours);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        return `${h12}:${minutes} ${ampm}`;
    }

    // Public API
    return {
        DAYS,
        DAYS_SHORT,
        MONTHS,
        MONTHS_SHORT,
        today,
        formatISO,
        formatLong,
        formatShort,
        formatWithDay,
        getDayName,
        getMonthName,
        getWeekNumber,
        getWeekKey,
        getWeekStart,
        getWeekEnd,
        getDaysInMonth,
        getFirstDayOfMonth,
        getMonthGrid,
        isSameDay,
        isToday,
        isPast,
        addDays,
        addMonths,
        relativeTime,
        formatTime
    };
})();
