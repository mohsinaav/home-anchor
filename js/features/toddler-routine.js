/**
 * Toddler Routine Feature
 * Visual checklist with image cards for toddler daily routines
 */

const ToddlerRoutine = (function() {
    // Default category definitions for grouping
    const DEFAULT_CATEGORIES = {
        anytime: { label: 'Anytime', icon: 'clock', order: 0, emoji: '🔄' },
        morning: { label: 'Morning', icon: 'sunrise', order: 1, emoji: '🌅' },
        afternoon: { label: 'Afternoon', icon: 'cloud-sun', order: 2, emoji: '☀️' },
        evening: { label: 'Evening', icon: 'sunset', order: 3, emoji: '🌆' },
        bedtime: { label: 'Bedtime', icon: 'bed', order: 4, emoji: '🌙' }
    };

    // Available icons for categories
    const CATEGORY_ICONS = [
        { key: 'clock', label: 'Clock' },
        { key: 'sunrise', label: 'Sunrise' },
        { key: 'sun', label: 'Sun' },
        { key: 'sunset', label: 'Sunset' },
        { key: 'moon', label: 'Moon' },
        { key: 'cloud-sun', label: 'Cloud Sun' },
        { key: 'utensils', label: 'Utensils' },
        { key: 'coffee', label: 'Coffee' },
        { key: 'bed', label: 'Bed' },
        { key: 'home', label: 'Home' },
        { key: 'star', label: 'Star' },
        { key: 'heart', label: 'Heart' },
        { key: 'smile', label: 'Smile' },
        { key: 'baby', label: 'Baby' },
        { key: 'book-open', label: 'Book' },
        { key: 'music', label: 'Music' },
        { key: 'activity', label: 'Activity' }
    ];

    /**
     * Get categories for a member (with defaults)
     */
    function getCategories(memberId) {
        const stored = Storage.getWidgetData(memberId, 'toddler-routine');
        if (stored?.categories && Object.keys(stored.categories).length > 0) {
            return stored.categories;
        }
        return { ...DEFAULT_CATEGORIES };
    }

    // Time-based filtering configuration
    const TIME_FILTERS = {
        morning: { hours: [6, 12], categories: ['morning'], label: 'Morning' },
        afternoon: { hours: [12, 17], categories: ['afternoon'], label: 'Afternoon' },
        evening: { hours: [17, 20], categories: ['evening'], label: 'Evening' },
        night: { hours: [20, 6], categories: ['bedtime'], label: 'Bedtime' }
    };

    // Track "show all" state per member
    let showAllRoutines = {};

    // Track selected time filter per member ('auto' = use current time, or specific filter key)
    let selectedTimeFilter = {};

    /**
     * Get current time period based on actual time
     */
    function getCurrentTimePeriod() {
        const hour = new Date().getHours();

        if (hour >= 6 && hour < 12) return { ...TIME_FILTERS.morning, key: 'morning' };
        if (hour >= 12 && hour < 17) return { ...TIME_FILTERS.afternoon, key: 'afternoon' };
        if (hour >= 17 && hour < 20) return { ...TIME_FILTERS.evening, key: 'evening' };
        return { ...TIME_FILTERS.night, key: 'night' }; // 8pm - 6am
    }

    /**
     * Get active time period (selected or auto)
     */
    function getActiveTimePeriod(memberId) {
        const selected = selectedTimeFilter[memberId];
        if (selected && selected !== 'auto' && TIME_FILTERS[selected]) {
            return { ...TIME_FILTERS[selected], key: selected };
        }
        return getCurrentTimePeriod();
    }

    /**
     * Check if a routine is relevant for the active time filter
     */
    function isRoutineRelevantNow(routine, memberId) {
        const category = routine.category || 'morning';
        // Categories that have time-based filtering
        const timeFilteredCategories = ['morning', 'afternoon', 'evening', 'bedtime'];

        // Custom categories and "anytime" are always shown
        if (!timeFilteredCategories.includes(category)) return true;

        // Apply time filter for built-in categories
        const timePeriod = getActiveTimePeriod(memberId);
        return timePeriod.categories.includes(category);
    }

    /**
     * Get icon for time period
     */
    function getTimePeriodIcon(timePeriod) {
        const iconMap = {
            'Morning': 'sunrise',
            'Midday': 'sun',
            'Afternoon': 'cloud-sun',
            'Evening': 'sunset',
            'Bedtime': 'moon'
        };
        return iconMap[timePeriod.label] || 'clock';
    }

    // SVG illustrations as data URLs for each routine
    const ROUTINE_IMAGES = {
        'wake-up': {
            label: 'Wake Up',
            svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="48" fill="#FEF3C7"/>
                <circle cx="50" cy="50" r="30" fill="#FBBF24"/>
                <line x1="50" y1="10" x2="50" y2="20" stroke="#F59E0B" stroke-width="4" stroke-linecap="round"/>
                <line x1="50" y1="80" x2="50" y2="90" stroke="#F59E0B" stroke-width="4" stroke-linecap="round"/>
                <line x1="10" y1="50" x2="20" y2="50" stroke="#F59E0B" stroke-width="4" stroke-linecap="round"/>
                <line x1="80" y1="50" x2="90" y2="50" stroke="#F59E0B" stroke-width="4" stroke-linecap="round"/>
                <line x1="22" y1="22" x2="29" y2="29" stroke="#F59E0B" stroke-width="4" stroke-linecap="round"/>
                <line x1="71" y1="71" x2="78" y2="78" stroke="#F59E0B" stroke-width="4" stroke-linecap="round"/>
                <line x1="78" y1="22" x2="71" y2="29" stroke="#F59E0B" stroke-width="4" stroke-linecap="round"/>
                <line x1="29" y1="71" x2="22" y2="78" stroke="#F59E0B" stroke-width="4" stroke-linecap="round"/>
                <circle cx="40" cy="45" r="4" fill="#92400E"/>
                <circle cx="60" cy="45" r="4" fill="#92400E"/>
                <path d="M 38 58 Q 50 68 62 58" stroke="#92400E" stroke-width="3" fill="none" stroke-linecap="round"/>
            </svg>`
        },
        'brush-teeth': {
            label: 'Brush Teeth',
            svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="48" fill="#DBEAFE"/>
                <rect x="35" y="20" width="12" height="55" rx="3" fill="#3B82F6"/>
                <rect x="35" y="15" width="12" height="12" rx="2" fill="#60A5FA"/>
                <rect x="33" y="75" width="16" height="8" rx="2" fill="#2563EB"/>
                <rect x="55" y="35" width="20" height="6" rx="2" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="1"/>
                <circle cx="60" cy="38" r="2" fill="#93C5FD"/>
                <circle cx="67" cy="38" r="2" fill="#93C5FD"/>
                <path d="M 53 50 Q 65 55 77 50" stroke="#93C5FD" stroke-width="3" fill="none" stroke-linecap="round"/>
            </svg>`
        },
        'get-dressed': {
            label: 'Get Dressed',
            svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="48" fill="#FCE7F3"/>
                <path d="M 30 35 L 50 25 L 70 35 L 70 75 L 30 75 Z" fill="#EC4899"/>
                <path d="M 30 35 L 20 45 L 20 55 L 30 50 Z" fill="#F472B6"/>
                <path d="M 70 35 L 80 45 L 80 55 L 70 50 Z" fill="#F472B6"/>
                <path d="M 42 25 L 50 20 L 58 25" stroke="#DB2777" stroke-width="3" fill="none"/>
                <circle cx="50" cy="45" r="3" fill="#FFFFFF"/>
                <circle cx="50" cy="55" r="3" fill="#FFFFFF"/>
                <circle cx="50" cy="65" r="3" fill="#FFFFFF"/>
            </svg>`
        },
        'breakfast': {
            label: 'Breakfast',
            svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="48" fill="#FEF3C7"/>
                <ellipse cx="50" cy="55" rx="35" ry="25" fill="#FBBF24"/>
                <ellipse cx="50" cy="50" rx="30" ry="20" fill="#FDE68A"/>
                <circle cx="40" cy="50" r="5" fill="#F59E0B"/>
                <circle cx="55" cy="48" r="4" fill="#F59E0B"/>
                <circle cx="50" cy="55" r="3" fill="#F59E0B"/>
                <path d="M 75 35 L 85 25" stroke="#78716C" stroke-width="4" stroke-linecap="round"/>
                <ellipse cx="88" cy="22" rx="6" ry="4" fill="#78716C"/>
            </svg>`
        },
        'wash-hands': {
            label: 'Wash Hands',
            svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="48" fill="#DBEAFE"/>
                <path d="M 35 70 L 35 45 Q 35 35 45 35 L 55 35 Q 65 35 65 45 L 65 70" fill="#FCD9B6"/>
                <line x1="42" y1="35" x2="42" y2="55" stroke="#E5C7A8" stroke-width="2"/>
                <line x1="50" y1="35" x2="50" y2="60" stroke="#E5C7A8" stroke-width="2"/>
                <line x1="58" y1="35" x2="58" y2="55" stroke="#E5C7A8" stroke-width="2"/>
                <circle cx="30" cy="40" r="4" fill="#93C5FD"/>
                <circle cx="70" cy="45" r="3" fill="#93C5FD"/>
                <circle cx="25" cy="55" r="3" fill="#60A5FA"/>
                <circle cx="75" cy="35" r="4" fill="#60A5FA"/>
                <ellipse cx="50" cy="75" rx="20" ry="8" fill="#BFDBFE"/>
            </svg>`
        },
        'lunch': {
            label: 'Lunch',
            svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="48" fill="#DCFCE7"/>
                <circle cx="50" cy="55" r="32" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="2"/>
                <circle cx="40" cy="50" r="8" fill="#EF4444"/>
                <circle cx="55" cy="45" r="6" fill="#22C55E"/>
                <circle cx="60" cy="58" r="7" fill="#F59E0B"/>
                <path d="M 45 62 Q 50 68 55 62" fill="#FDE047"/>
                <line x1="20" y1="55" x2="20" y2="75" stroke="#9CA3AF" stroke-width="3"/>
                <circle cx="20" cy="52" r="5" fill="#9CA3AF"/>
            </svg>`
        },
        'nap': {
            label: 'Nap Time',
            svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="48" fill="#EDE9FE"/>
                <circle cx="50" cy="55" r="25" fill="#8B5CF6"/>
                <circle cx="42" cy="52" r="3" fill="#1E1B4B"/>
                <circle cx="58" cy="52" r="3" fill="#1E1B4B"/>
                <line x1="42" y1="52" x2="42" y2="54" stroke="#C4B5FD" stroke-width="2"/>
                <line x1="58" y1="52" x2="58" y2="54" stroke="#C4B5FD" stroke-width="2"/>
                <path d="M 44 62 Q 50 58 56 62" stroke="#1E1B4B" stroke-width="2" fill="none"/>
                <text x="65" y="35" fill="#A78BFA" font-size="14" font-weight="bold">z</text>
                <text x="72" y="28" fill="#C4B5FD" font-size="12" font-weight="bold">z</text>
                <text x="78" y="22" fill="#DDD6FE" font-size="10" font-weight="bold">z</text>
            </svg>`
        },
        'snack': {
            label: 'Snack',
            svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="48" fill="#FEE2E2"/>
                <circle cx="50" cy="55" r="28" fill="#EF4444"/>
                <ellipse cx="50" cy="40" rx="8" ry="5" fill="#22C55E"/>
                <path d="M 50 35 L 50 28" stroke="#166534" stroke-width="3" stroke-linecap="round"/>
                <ellipse cx="40" cy="50" rx="5" ry="8" fill="#DC2626" opacity="0.5"/>
                <circle cx="55" cy="60" r="3" fill="#FECACA"/>
            </svg>`
        },
        'dinner': {
            label: 'Dinner',
            svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="48" fill="#FFEDD5"/>
                <circle cx="50" cy="55" r="32" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="2"/>
                <path d="M 35 45 Q 50 70 65 45" fill="#F97316"/>
                <circle cx="45" cy="50" r="4" fill="#84CC16"/>
                <circle cx="55" cy="52" r="3" fill="#EF4444"/>
                <line x1="18" y1="45" x2="18" y2="70" stroke="#9CA3AF" stroke-width="3"/>
                <ellipse cx="18" cy="42" rx="4" ry="6" fill="#9CA3AF"/>
                <line x1="82" y1="45" x2="82" y2="70" stroke="#9CA3AF" stroke-width="3"/>
                <path d="M 78 42 L 82 45 L 86 42" fill="#9CA3AF"/>
            </svg>`
        },
        'bath': {
            label: 'Bath Time',
            svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="48" fill="#CFFAFE"/>
                <ellipse cx="50" cy="60" rx="35" ry="20" fill="#FFFFFF"/>
                <ellipse cx="50" cy="55" rx="30" ry="15" fill="#93C5FD"/>
                <circle cx="35" cy="50" r="5" fill="#FFFFFF"/>
                <circle cx="45" cy="48" r="4" fill="#FFFFFF"/>
                <circle cx="55" cy="52" r="6" fill="#FFFFFF"/>
                <circle cx="65" cy="48" r="4" fill="#FFFFFF"/>
                <circle cx="50" cy="35" r="12" fill="#FCD9B6"/>
                <circle cx="46" cy="33" r="2" fill="#1E1B4B"/>
                <circle cx="54" cy="33" r="2" fill="#1E1B4B"/>
                <path d="M 47 38 Q 50 41 53 38" stroke="#1E1B4B" stroke-width="1.5" fill="none"/>
            </svg>`
        },
        'pajamas': {
            label: 'Pajamas',
            svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="48" fill="#EDE9FE"/>
                <path d="M 30 35 L 50 28 L 70 35 L 70 75 L 30 75 Z" fill="#8B5CF6"/>
                <path d="M 30 35 L 22 42 L 22 55 L 30 52 Z" fill="#A78BFA"/>
                <path d="M 70 35 L 78 42 L 78 55 L 70 52 Z" fill="#A78BFA"/>
                <circle cx="42" cy="45" r="4" fill="#FDE047"/>
                <circle cx="58" cy="45" r="4" fill="#FDE047"/>
                <circle cx="42" cy="58" r="4" fill="#FDE047"/>
                <circle cx="58" cy="58" r="4" fill="#FDE047"/>
                <circle cx="50" cy="68" r="4" fill="#FDE047"/>
            </svg>`
        },
        'story': {
            label: 'Story Time',
            svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="48" fill="#FEF3C7"/>
                <rect x="25" y="30" width="50" height="40" rx="3" fill="#92400E"/>
                <rect x="28" y="33" width="20" height="34" fill="#FDE68A"/>
                <rect x="52" y="33" width="20" height="34" fill="#FFFBEB"/>
                <line x1="32" y1="40" x2="44" y2="40" stroke="#D97706" stroke-width="2"/>
                <line x1="32" y1="46" x2="42" y2="46" stroke="#D97706" stroke-width="2"/>
                <line x1="32" y1="52" x2="44" y2="52" stroke="#D97706" stroke-width="2"/>
                <line x1="56" y1="40" x2="68" y2="40" stroke="#9CA3AF" stroke-width="2"/>
                <line x1="56" y1="46" x2="66" y2="46" stroke="#9CA3AF" stroke-width="2"/>
                <line x1="56" y1="52" x2="68" y2="52" stroke="#9CA3AF" stroke-width="2"/>
            </svg>`
        },
        'bedtime': {
            label: 'Bedtime',
            svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="48" fill="#1E1B4B"/>
                <circle cx="70" cy="30" r="15" fill="#FDE047"/>
                <circle cx="65" cy="28" r="12" fill="#1E1B4B"/>
                <circle cx="25" cy="25" r="2" fill="#FFFFFF"/>
                <circle cx="35" cy="20" r="1.5" fill="#FFFFFF"/>
                <circle cx="20" cy="40" r="1" fill="#FFFFFF"/>
                <circle cx="40" cy="35" r="1.5" fill="#FFFFFF"/>
                <rect x="20" y="55" width="60" height="30" rx="5" fill="#7C3AED"/>
                <rect x="25" y="60" width="50" height="5" rx="2" fill="#8B5CF6"/>
                <ellipse cx="50" cy="52" rx="15" ry="8" fill="#FCD9B6"/>
                <circle cx="46" cy="50" r="2" fill="#1E1B4B"/>
                <circle cx="54" cy="50" r="2" fill="#1E1B4B"/>
                <line x1="46" y1="50" x2="46" y2="52" stroke="#C4B5FD" stroke-width="1"/>
                <line x1="54" y1="50" x2="54" y2="52" stroke="#C4B5FD" stroke-width="1"/>
            </svg>`
        },
        'potty': {
            label: 'Potty',
            svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="48" fill="#DBEAFE"/>
                <ellipse cx="50" cy="70" rx="25" ry="12" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="2"/>
                <rect x="30" y="45" width="40" height="25" rx="5" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="2"/>
                <ellipse cx="50" cy="45" rx="18" ry="8" fill="#BFDBFE"/>
                <rect x="65" y="50" width="10" height="15" rx="3" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="2"/>
                <circle cx="50" cy="38" r="3" fill="#60A5FA"/>
            </svg>`
        }
    };

    // Default routines for new toddlers (with categories)
    const DEFAULT_ROUTINES = [
        { id: 'default-1', title: 'Wake Up', imageKey: 'wake-up', category: 'morning', order: 1 },
        { id: 'default-2', title: 'Brush Teeth', imageKey: 'brush-teeth', category: 'morning', order: 2 },
        { id: 'default-3', title: 'Get Dressed', imageKey: 'get-dressed', category: 'morning', order: 3 },
        { id: 'default-4', title: 'Breakfast', imageKey: 'breakfast', category: 'morning', order: 4 },
        { id: 'default-5', title: 'Wash Hands', imageKey: 'wash-hands', category: 'anytime', order: 5 },
        { id: 'default-6', title: 'Lunch', imageKey: 'lunch', category: 'afternoon', order: 6 },
        { id: 'default-7', title: 'Nap Time', imageKey: 'nap', category: 'afternoon', order: 7 },
        { id: 'default-8', title: 'Snack', imageKey: 'snack', category: 'afternoon', order: 8 },
        { id: 'default-9', title: 'Dinner', imageKey: 'dinner', category: 'evening', order: 9 },
        { id: 'default-10', title: 'Bath Time', imageKey: 'bath', category: 'evening', order: 10 },
        { id: 'default-11', title: 'Pajamas', imageKey: 'pajamas', category: 'bedtime', order: 11 },
        { id: 'default-12', title: 'Story Time', imageKey: 'story', category: 'bedtime', order: 12 },
        { id: 'default-13', title: 'Bedtime', imageKey: 'bedtime', category: 'bedtime', order: 13 }
    ];

    /**
     * Get widget data with defaults
     */
    function getWidgetData(memberId) {
        const stored = Storage.getWidgetData(memberId, 'toddler-routine');
        if (!stored || !stored.routines) {
            return {
                routines: DEFAULT_ROUTINES.map(r => ({ ...r, id: `routine-${Date.now()}-${r.order}` })),
                completedToday: [],
                lastResetDate: DateUtils.today(),
                history: [], // Track completion history { date, completed: [routineIds], total }
                stats: {}    // Cached stats
            };
        }
        // Ensure history and stats exist for older data
        if (!stored.history) stored.history = [];
        if (!stored.stats) stored.stats = {};
        return stored;
    }

    /**
     * Record daily history before reset
     */
    function recordDailyHistory(data) {
        const history = data.history || [];
        const completedToday = data.completedToday || [];
        const totalRoutines = data.routines?.length || 0;

        // Add today's record
        history.push({
            date: data.lastResetDate,
            completed: completedToday.length,
            total: totalRoutines,
            routineIds: [...completedToday]
        });

        // Keep only last 30 days
        if (history.length > 30) {
            history.shift();
        }

        return history;
    }

    /**
     * Calculate stats from history
     */
    function calculateStats(data) {
        const history = data.history || [];
        const routines = data.routines || [];

        if (history.length === 0) {
            return {
                avgCompletion: 0,
                totalDays: 0,
                perfectDays: 0,
                routineStats: {}
            };
        }

        // Calculate routine-specific stats
        const routineStats = {};
        routines.forEach(r => {
            routineStats[r.id] = { completed: 0, total: 0, title: r.title };
        });

        let totalCompleted = 0;
        let totalPossible = 0;
        let perfectDays = 0;

        history.forEach(day => {
            totalCompleted += day.completed;
            totalPossible += day.total;
            if (day.completed === day.total && day.total > 0) {
                perfectDays++;
            }
            // Track per-routine completions
            (day.routineIds || []).forEach(routineId => {
                if (routineStats[routineId]) {
                    routineStats[routineId].completed++;
                }
            });
            routines.forEach(r => {
                if (routineStats[r.id]) {
                    routineStats[r.id].total++;
                }
            });
        });

        return {
            avgCompletion: totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0,
            totalDays: history.length,
            perfectDays,
            routineStats
        };
    }

    /**
     * Get frequently skipped routines
     */
    function getSkippedRoutines(data) {
        const stats = calculateStats(data);
        const skipped = [];

        Object.entries(stats.routineStats).forEach(([id, stat]) => {
            if (stat.total > 0) {
                const rate = (stat.completed / stat.total) * 100;
                if (rate < 50) {
                    skipped.push({ id, title: stat.title, rate: Math.round(rate) });
                }
            }
        });

        return skipped.sort((a, b) => a.rate - b.rate);
    }

    /**
     * Check and reset if new day
     */
    function checkAndResetDaily(memberId) {
        const data = getWidgetData(memberId);
        const today = DateUtils.today();

        if (data.lastResetDate !== today) {
            // Record yesterday's history before resetting
            const history = recordDailyHistory(data);

            const updatedData = {
                ...data,
                completedToday: [],
                lastResetDate: today,
                history
            };
            Storage.setWidgetData(memberId, 'toddler-routine', updatedData);
            return updatedData;
        }
        return data;
    }

    /**
     * Group routines by category
     */
    function groupRoutinesByCategory(routines, categories) {
        const groups = {};

        // Initialize all categories
        Object.keys(categories).forEach(cat => {
            groups[cat] = [];
        });

        // Group routines
        routines.forEach(routine => {
            const category = routine.category || 'morning';
            if (!groups[category]) {
                groups[category] = [];
            }
            groups[category].push(routine);
        });

        // Sort each group by order
        Object.keys(groups).forEach(cat => {
            groups[cat].sort((a, b) => (a.order || 0) - (b.order || 0));
        });

        return groups;
    }

    /**
     * Get SVG data URL for a routine
     */
    function getImageSrc(routine) {
        if (routine.customImage) {
            return routine.customImage;
        }
        const imageData = ROUTINE_IMAGES[routine.imageKey];
        if (imageData) {
            return `data:image/svg+xml,${encodeURIComponent(imageData.svg)}`;
        }
        return ROUTINE_IMAGES['wake-up'].svg; // Fallback
    }

    /**
     * Render the widget
     */
    function renderWidget(container, memberId) {
        const data = checkAndResetDaily(memberId);
        const routines = data.routines || [];
        const completedToday = data.completedToday || [];

        const completedCount = completedToday.length;
        const totalCount = routines.length;
        const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
        const allComplete = completedCount === totalCount && totalCount > 0;

        // Time-based filtering
        const currentTimePeriod = getCurrentTimePeriod();
        const activeTimePeriod = getActiveTimePeriod(memberId);
        const selectedFilter = selectedTimeFilter[memberId] || 'auto';
        const showAll = showAllRoutines[memberId] || false;

        // Filter options
        const filterOptions = [
            { key: 'auto', label: `Now (${currentTimePeriod.label})`, icon: 'clock' },
            { key: 'morning', label: 'Morning', icon: 'sunrise' },
            { key: 'afternoon', label: 'Afternoon', icon: 'cloud-sun' },
            { key: 'evening', label: 'Evening', icon: 'sunset' },
            { key: 'night', label: 'Bedtime', icon: 'moon' },
            { key: 'all', label: 'All', icon: 'list' }
        ];

        container.innerHTML = `
            <div class="toddler-routine-widget ${allComplete ? 'toddler-routine-widget--complete' : ''}">
                <div class="toddler-routine-widget__header">
                    <div class="toddler-routine-progress-ring" data-progress="${progressPercent}">
                        <svg viewBox="0 0 36 36">
                            <path class="toddler-routine-progress-ring__bg"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                            <path class="toddler-routine-progress-ring__fill"
                                stroke-dasharray="${progressPercent}, 100"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                        </svg>
                        <span class="toddler-routine-progress-ring__text">${completedCount}/${totalCount}</span>
                    </div>
                    <div class="toddler-routine-widget__time-filter">
                        <select class="toddler-routine-filter-select" data-action="change-filter" title="Filter by time of day">
                            ${filterOptions.map(opt => `
                                <option value="${opt.key}" ${selectedFilter === opt.key ? 'selected' : ''}>
                                    ${opt.label}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                </div>

                <div class="toddler-routine-grid">
                    ${routines.map(routine => {
                        const isComplete = completedToday.includes(routine.id);
                        const isRelevant = selectedFilter === 'all' ? true : isRoutineRelevantNow(routine, memberId);
                        const dimmed = !showAll && !isRelevant && !isComplete;
                        return `
                            <div class="toddler-routine-card ${isComplete ? 'toddler-routine-card--done' : ''} ${dimmed ? 'toddler-routine-card--dimmed' : ''}"
                                 data-routine-id="${routine.id}">
                                <div class="toddler-routine-card__image">
                                    <img src="${getImageSrc(routine)}" alt="${routine.title}">
                                    ${isComplete ? `
                                        <div class="toddler-routine-card__check">
                                            <i data-lucide="check"></i>
                                        </div>
                                    ` : ''}
                                </div>
                                <span class="toddler-routine-card__label">${routine.title}</span>
                            </div>
                        `;
                    }).join('')}
                </div>

                <div class="toddler-routine-widget__footer">
                    <button class="btn btn--sm btn--ghost" data-action="history" title="View history">
                        <i data-lucide="history"></i>
                        History
                    </button>
                    <button class="btn btn--sm btn--ghost" data-action="manage" title="Manage routines">
                        <i data-lucide="settings"></i>
                        Manage
                    </button>
                    <button class="btn btn--sm btn--ghost" data-action="reset" title="Reset all">
                        <i data-lucide="rotate-ccw"></i>
                        Reset
                    </button>
                </div>
            </div>
        `;

        // Initialize icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Check if all complete and trigger celebration
        if (allComplete && !data.celebratedToday) {
            triggerCelebration(memberId);
        }

        // Bind events
        bindWidgetEvents(container, memberId);
    }

    /**
     * Trigger celebration animation when all routines are complete
     */
    function triggerCelebration(memberId) {
        const data = getWidgetData(memberId);

        // Mark as celebrated to avoid repeating
        Storage.setWidgetData(memberId, 'toddler-routine', {
            ...data,
            celebratedToday: true
        });

        // Show confetti celebration
        if (typeof Confetti !== 'undefined' && Confetti.celebrate) {
            Confetti.celebrate();
        }

        // Show celebration message
        Toast.success('All routines complete! Great job!');
    }

    /**
     * Show stats modal
     */
    function showStatsModal(memberId) {
        const data = getWidgetData(memberId);
        const stats = calculateStats(data);
        const skipped = getSkippedRoutines(data);
        const history = data.history || [];

        // Generate last 7 days calendar
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const dayRecord = history.find(h => h.date === dateStr);
            last7Days.push({
                date: dateStr,
                dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
                completed: dayRecord?.completed || 0,
                total: dayRecord?.total || data.routines.length,
                isToday: i === 0
            });
        }

        Modal.open({
            title: 'Routine Stats',
            content: `
                <div class="routine-stats">
                    <div class="routine-stats__summary">
                        <div class="routine-stats__card">
                            <span class="routine-stats__value">${stats.avgCompletion}%</span>
                            <span class="routine-stats__label">Avg Completion</span>
                        </div>
                        <div class="routine-stats__card">
                            <span class="routine-stats__value">${stats.perfectDays}</span>
                            <span class="routine-stats__label">Perfect Days</span>
                        </div>
                        <div class="routine-stats__card">
                            <span class="routine-stats__value">${stats.totalDays}</span>
                            <span class="routine-stats__label">Days Tracked</span>
                        </div>
                    </div>

                    <div class="routine-stats__calendar">
                        <h4 class="routine-stats__section-title">Last 7 Days</h4>
                        <div class="routine-stats__days">
                            ${last7Days.map(day => {
                                const percent = day.total > 0 ? Math.round((day.completed / day.total) * 100) : 0;
                                const level = percent === 100 ? 'perfect' : percent >= 50 ? 'good' : percent > 0 ? 'partial' : 'none';
                                return `
                                    <div class="routine-stats__day ${day.isToday ? 'routine-stats__day--today' : ''}">
                                        <span class="routine-stats__day-name">${day.dayName}</span>
                                        <div class="routine-stats__day-circle routine-stats__day-circle--${level}">
                                            ${day.completed}/${day.total}
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>

                    ${skipped.length > 0 ? `
                        <div class="routine-stats__skipped">
                            <h4 class="routine-stats__section-title">Frequently Skipped</h4>
                            <div class="routine-stats__skipped-list">
                                ${skipped.slice(0, 3).map(s => `
                                    <div class="routine-stats__skipped-item">
                                        <span>${s.title}</span>
                                        <span class="routine-stats__skipped-rate">${s.rate}%</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            `,
            footer: '<button class="btn btn--primary" data-modal-close>Close</button>'
        });

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        document.querySelector('[data-modal-close]')?.addEventListener('click', () => Modal.close());
    }

    /**
     * Bind widget events
     */
    function bindWidgetEvents(container, memberId) {
        // Toggle complete on card click
        container.querySelectorAll('.toddler-routine-card').forEach(card => {
            card.addEventListener('click', () => {
                const routineId = card.dataset.routineId;
                toggleComplete(memberId, routineId);
            });
        });

        // Time filter dropdown
        container.querySelector('[data-action="change-filter"]')?.addEventListener('change', (e) => {
            e.stopPropagation();
            const value = e.target.value;
            selectedTimeFilter[memberId] = value;
            // If "all" is selected, also enable showAll
            showAllRoutines[memberId] = (value === 'all');
            renderWidget(container, memberId);
        });

        // History button - navigate to full page with history tab active
        container.querySelector('[data-action="history"]')?.addEventListener('click', (e) => {
            e.stopPropagation();
            showFullPage(memberId, 'history');
        });

        // Reset button
        container.querySelector('[data-action="reset"]')?.addEventListener('click', (e) => {
            e.stopPropagation();
            showResetConfirm(memberId);
        });

        // Manage button (PIN protected)
        container.querySelector('[data-action="manage"]')?.addEventListener('click', async (e) => {
            e.stopPropagation();
            const verified = await PIN.verify();
            if (verified) {
                showManageModal(memberId);
            }
        });
    }

    /**
     * Reorder routines (called from manage modal)
     */
    function reorderRoutines(memberId, fromIndex, toIndex) {
        const data = getWidgetData(memberId);
        const routines = [...(data.routines || [])];

        // Remove from old position and insert at new position
        const [moved] = routines.splice(fromIndex, 1);
        routines.splice(toIndex, 0, moved);

        // Update order values
        routines.forEach((r, i) => {
            r.order = i + 1;
        });

        Storage.setWidgetData(memberId, 'toddler-routine', {
            ...data,
            routines
        });

        // Refresh widget
        refreshWidget(memberId);
    }

    /**
     * Toggle routine completion
     */
    function toggleComplete(memberId, routineId) {
        const data = getWidgetData(memberId);
        let completedToday = data.completedToday || [];

        if (completedToday.includes(routineId)) {
            completedToday = completedToday.filter(id => id !== routineId);
        } else {
            completedToday.push(routineId);
        }

        const updatedData = {
            ...data,
            completedToday
        };

        Storage.setWidgetData(memberId, 'toddler-routine', updatedData);

        // Refresh widget
        const widgetBody = document.getElementById('widget-toddler-routine');
        if (widgetBody) {
            renderWidget(widgetBody, memberId);
        }

        // Also refresh if in full page
        const fullPageGrid = document.querySelector('.toddler-routine-full-grid');
        if (fullPageGrid) {
            showFullPage(memberId);
        }
    }

    /**
     * Show reset confirmation
     */
    function showResetConfirm(memberId) {
        Modal.open({
            title: 'Reset Routines?',
            content: '<p>This will uncheck all routines for today. Are you sure?</p>',
            footer: Modal.createFooter('Cancel', 'Reset All')
        });

        Modal.bindFooterEvents(() => {
            const data = getWidgetData(memberId);
            const updatedData = {
                ...data,
                completedToday: []
            };
            Storage.setWidgetData(memberId, 'toddler-routine', updatedData);

            // Refresh widget
            const widgetBody = document.getElementById('widget-toddler-routine');
            if (widgetBody) {
                renderWidget(widgetBody, memberId);
            }

            Toast.success('Routines reset!');
            return true;
        });
    }

    /**
     * Render Today tab - Routines grouped by category
     */
    function renderTodayTab(memberId, data, categories) {
        const routines = data.routines || [];
        const completedToday = data.completedToday || [];

        // Calculate progress
        const completedCount = completedToday.length;
        const totalCount = routines.length;
        const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
        const allComplete = completedCount === totalCount && totalCount > 0;

        // Get encouraging message based on progress
        const getEncouragingMessage = () => {
            if (allComplete) return { emoji: '🎉', text: "Amazing! You did it all!", subtext: "You're a superstar today!" };
            if (progressPercent >= 75) return { emoji: '🌟', text: "Almost there!", subtext: "Just a few more to go!" };
            if (progressPercent >= 50) return { emoji: '💪', text: "Great job!", subtext: "You're doing awesome!" };
            if (progressPercent >= 25) return { emoji: '🚀', text: "Good start!", subtext: "Keep it up!" };
            if (completedCount > 0) return { emoji: '✨', text: "You started!", subtext: "Let's do more!" };
            return { emoji: '🌈', text: "Let's begin!", subtext: "Tap a picture to start!" };
        };
        const encouragement = getEncouragingMessage();

        // Group routines by category
        const groupedRoutines = groupRoutinesByCategory(routines, categories);

        // Sort categories by order
        const sortedCategories = Object.entries(categories)
            .sort((a, b) => (a[1].order || 0) - (b[1].order || 0));

        return `
            <div class="routine-today-tab routine-today-tab--playful">
                <!-- Visual Progress Section -->
                <div class="routine-progress-section">
                    <div class="routine-progress-gauge ${allComplete ? 'routine-progress-gauge--complete' : ''}">
                        <svg viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="40" fill="none" stroke="#E5E7EB" stroke-width="12"/>
                            <circle cx="50" cy="50" r="40" fill="none"
                                stroke="${allComplete ? '#22C55E' : '#8B5CF6'}" stroke-width="12"
                                stroke-dasharray="${progressPercent * 2.51} 251" stroke-linecap="round"
                                transform="rotate(-90 50 50)"
                                class="routine-progress-gauge__fill"/>
                        </svg>
                        <div class="routine-progress-gauge__center">
                            <span class="routine-progress-gauge__emoji">${encouragement.emoji}</span>
                            <span class="routine-progress-gauge__value">${completedCount}/${totalCount}</span>
                        </div>
                    </div>
                    <div class="routine-progress-message">
                        <span class="routine-progress-message__title">${encouragement.text}</span>
                        <span class="routine-progress-message__subtitle">${encouragement.subtext}</span>
                    </div>
                </div>

                <!-- Routine Categories -->
                ${sortedCategories
                    .filter(([cat]) => groupedRoutines[cat] && groupedRoutines[cat].length > 0)
                    .map(([cat, catInfo]) => {
                        const catRoutines = groupedRoutines[cat];
                        const catCompleted = catRoutines.filter(r => completedToday.includes(r.id)).length;
                        const allCatComplete = catCompleted === catRoutines.length;

                        return `
                            <div class="routine-category ${allCatComplete ? 'routine-category--complete' : ''}" data-category="${cat}">
                                <div class="routine-category__header routine-category__header--playful">
                                    <div class="routine-category__title">
                                        <span class="routine-category__emoji">${catInfo.emoji || '📋'}</span>
                                        <span>${catInfo.label}</span>
                                    </div>
                                    <span class="routine-category__count">${catCompleted}/${catRoutines.length} ${allCatComplete ? '✅' : ''}</span>
                                </div>
                                <div class="routine-category__grid">
                                    ${catRoutines.map(routine => {
                                        const isComplete = completedToday.includes(routine.id);
                                        return `
                                            <div class="toddler-routine-card toddler-routine-card--large ${isComplete ? 'toddler-routine-card--done' : ''}"
                                                 data-routine-id="${routine.id}">
                                                <div class="toddler-routine-card__image">
                                                    <img src="${getImageSrc(routine)}" alt="${routine.title}">
                                                    ${isComplete ? `
                                                        <div class="toddler-routine-card__check">
                                                            <i data-lucide="check"></i>
                                                        </div>
                                                    ` : ''}
                                                </div>
                                                <span class="toddler-routine-card__label">${routine.title}</span>
                                            </div>
                                        `;
                                    }).join('')}
                                </div>
                            </div>
                        `;
                    }).join('')}

                ${routines.length === 0 ? `
                    <div class="kid-page__empty kid-page__empty--playful">
                        <div class="kid-page__empty-icon">🌟</div>
                        <p>No routines yet!</p>
                        <p class="kid-page__empty-hint">Tap the ⚙️ button to add some!</p>
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Generate mini calendar HTML for history tabs
     */
    function generateMiniCalendar(currentMonth, currentYear, datesWithHistory) {
        const today = DateUtils.today();
        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        const startDay = firstDay.getDay(); // Day of week (0-6)
        const daysInMonth = lastDay.getDate();

        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                            'July', 'August', 'September', 'October', 'November', 'December'];

        let calendarHTML = `
            <div class="history-calendar">
                <div class="history-calendar__header">
                    <button class="history-calendar__nav" data-calendar-nav="prev">
                        <i data-lucide="chevron-left"></i>
                    </button>
                    <span class="history-calendar__title">${monthNames[currentMonth]} ${currentYear}</span>
                    <button class="history-calendar__nav" data-calendar-nav="next">
                        <i data-lucide="chevron-right"></i>
                    </button>
                </div>
                <div class="history-calendar__weekdays">
                    ${['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => `<span>${d}</span>`).join('')}
                </div>
                <div class="history-calendar__grid">
        `;

        // Empty cells before first day
        for (let i = 0; i < startDay; i++) {
            calendarHTML += `<span class="history-calendar__day history-calendar__day--empty"></span>`;
        }

        // Days of month
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const hasHistory = datesWithHistory.includes(dateStr);
            const isToday = dateStr === today;
            const isFuture = dateStr > today;

            calendarHTML += `
                <span class="history-calendar__day ${hasHistory ? 'history-calendar__day--has-activity' : ''} ${isToday ? 'history-calendar__day--today' : ''} ${isFuture ? 'history-calendar__day--future' : ''}"
                      data-calendar-date="${dateStr}"
                      ${!hasHistory || isFuture ? '' : 'data-clickable="true"'}>
                    ${day}
                </span>
            `;
        }

        calendarHTML += `
                </div>
            </div>
        `;

        return calendarHTML;
    }

    /**
     * Render History tab - Past completion records with calendar
     */
    function renderHistoryTab(memberId, data, calendarMonth = null, calendarYear = null, selectedDate = null) {
        const history = data.history || [];
        const routines = data.routines || [];
        const todayStr = DateUtils.today();

        // Default to current month/year if not specified
        const now = new Date();
        const currentMonth = calendarMonth !== null ? calendarMonth : now.getMonth();
        const currentYear = calendarYear !== null ? calendarYear : now.getFullYear();

        // Create routine lookup map
        const routineMap = {};
        routines.forEach(r => {
            routineMap[r.id] = r;
        });

        // Get all dates with actual completed routines (not just tracked days with 0 completions)
        const datesWithHistory = history.filter(h => h.completed > 0).map(h => h.date);

        // Sort history by date descending
        const sortedHistory = [...history].sort((a, b) => b.date.localeCompare(a.date));

        // Filter by selected date or show all
        let historyToShow;
        if (selectedDate) {
            historyToShow = sortedHistory.filter(h => h.date === selectedDate);
        } else {
            historyToShow = sortedHistory;
        }

        // Get date label - kid-friendly
        const getDateLabel = (date) => {
            if (date === todayStr) return 'Today! 🌟';
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];
            if (date === yesterdayStr) return 'Yesterday';
            return DateUtils.formatShort(date);
        };

        if (sortedHistory.length === 0) {
            return `
                <div class="routine-history-tab" data-calendar-month="${currentMonth}" data-calendar-year="${currentYear}">
                    ${generateMiniCalendar(currentMonth, currentYear, [])}
                    <div class="kid-page__empty kid-page__empty--playful">
                        <div class="kid-page__empty-icon">📅</div>
                        <p>No history yet!</p>
                        <span>Complete routines to see your history! 🎯</span>
                    </div>
                </div>
            `;
        }

        return `
            <div class="routine-history-tab" data-calendar-month="${currentMonth}" data-calendar-year="${currentYear}">
                ${generateMiniCalendar(currentMonth, currentYear, datesWithHistory)}
                ${selectedDate ? `
                    <button class="btn btn--sm btn--ghost history-show-all" data-show-all-history>
                        <i data-lucide="list"></i>
                        Show all dates
                    </button>
                ` : ''}
                <div class="routine-history-list">
                    ${historyToShow.map(entry => {
                        const isPerfect = entry.completed === entry.total && entry.total > 0;
                        return `
                            <div class="routine-history-day ${isPerfect ? 'routine-history-day--perfect' : ''}" data-history-date="${entry.date}">
                                <div class="routine-history-day__header">
                                    <span class="routine-history-day__date">${getDateLabel(entry.date)}</span>
                                    <span class="routine-history-day__count">
                                        ${entry.completed}/${entry.total}
                                        ${isPerfect ? ' ⭐' : ''}
                                    </span>
                                </div>
                                <div class="routine-history-day__list">
                                    ${(entry.routineIds || []).map(routineId => {
                                        const routine = routineMap[routineId];
                                        return `
                                            <div class="routine-history-item">
                                                ${routine ? `
                                                    <div class="routine-history-item__image">
                                                        <img src="${getImageSrc(routine)}" alt="${routine.title}">
                                                    </div>
                                                ` : ''}
                                                <span class="routine-history-item__name">${routine?.title || 'Routine'}</span>
                                                <i data-lucide="check" class="routine-history-item__check"></i>
                                            </div>
                                        `;
                                    }).join('')}
                                    ${(!entry.routineIds || entry.routineIds.length === 0) ? `
                                        <div class="routine-history-item routine-history-item--empty">
                                            <span>No routines completed</span>
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Render Stats tab - Routine statistics
     */
    function renderStatsTab(memberId, data) {
        const stats = calculateStats(data);
        const skipped = getSkippedRoutines(data);
        const history = data.history || [];

        // Generate last 7 days calendar
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const dayRecord = history.find(h => h.date === dateStr);
            last7Days.push({
                date: dateStr,
                dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
                completed: dayRecord?.completed || 0,
                total: dayRecord?.total || data.routines.length,
                isToday: i === 0
            });
        }

        // Calculate current streak
        let streak = 0;
        const sortedHistory = [...history].sort((a, b) => b.date.localeCompare(a.date));
        for (let i = 0; i < sortedHistory.length; i++) {
            if (sortedHistory[i].completed === sortedHistory[i].total && sortedHistory[i].total > 0) {
                streak++;
            } else {
                break;
            }
        }

        return `
            <div class="routine-stats-tab">
                <div class="routine-stats-overview">
                    <div class="routine-stats-card routine-stats-card--playful">
                        <span class="emoji-stat">📊</span>
                        <div class="routine-stats-card__value">${stats.avgCompletion}%</div>
                        <div class="routine-stats-card__label">Avg Done!</div>
                    </div>
                    <div class="routine-stats-card routine-stats-card--playful">
                        <span class="emoji-stat">⭐</span>
                        <div class="routine-stats-card__value">${stats.perfectDays}</div>
                        <div class="routine-stats-card__label">Perfect Days!</div>
                    </div>
                    <div class="routine-stats-card routine-stats-card--playful">
                        <span class="emoji-stat">🔥</span>
                        <div class="routine-stats-card__value">${streak}</div>
                        <div class="routine-stats-card__label">Current Streak!</div>
                    </div>
                    <div class="routine-stats-card routine-stats-card--playful">
                        <span class="emoji-stat">📅</span>
                        <div class="routine-stats-card__value">${stats.totalDays}</div>
                        <div class="routine-stats-card__label">Days Tracked!</div>
                    </div>
                </div>

                <div class="routine-stats-calendar">
                    <h4 class="routine-stats-section-title">📆 Last 7 Days</h4>
                    <div class="routine-stats-days">
                        ${last7Days.map(day => {
                            const percent = day.total > 0 ? Math.round((day.completed / day.total) * 100) : 0;
                            const level = percent === 100 ? 'perfect' : percent >= 50 ? 'good' : percent > 0 ? 'partial' : 'none';
                            return `
                                <div class="routine-stats-day ${day.isToday ? 'routine-stats-day--today' : ''}">
                                    <span class="routine-stats-day__name">${day.dayName}</span>
                                    <div class="routine-stats-day__circle routine-stats-day__circle--${level}">
                                        ${day.completed}/${day.total}
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                ${skipped.length > 0 ? `
                    <div class="routine-stats-skipped">
                        <h4 class="routine-stats-section-title">🙈 Sometimes Missed</h4>
                        <div class="routine-stats-skipped-list">
                            ${skipped.slice(0, 3).map(s => `
                                <div class="routine-stats-skipped-item">
                                    <span>${s.title}</span>
                                    <span class="routine-stats-skipped-rate">${s.rate}%</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Render full page content
     */
    function renderFullPage(container, memberId, member, activeTab, calendarState = {}) {
        const data = checkAndResetDaily(memberId);
        const routines = data.routines || [];
        const completedToday = data.completedToday || [];
        const categories = getCategories(memberId);

        const completedCount = completedToday.length;
        const totalCount = routines.length;
        const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
        const allComplete = completedCount === totalCount && totalCount > 0;

        // Calculate streak
        const history = data.history || [];
        let streak = 0;
        const sortedHistory = [...history].sort((a, b) => b.date.localeCompare(a.date));
        for (let i = 0; i < sortedHistory.length; i++) {
            if (sortedHistory[i].completed === sortedHistory[i].total && sortedHistory[i].total > 0) {
                streak++;
            } else {
                break;
            }
        }

        const tabs = [
            { id: 'today', label: 'Today', icon: 'check-circle', emoji: '✨' },
            { id: 'history', label: 'History', icon: 'history', emoji: '📅' },
            { id: 'stats', label: 'Stats', icon: 'bar-chart-2', emoji: '📊' }
        ];

        // Kid-friendly theming (toddlers are always "young kids")
        const useKidTheme = typeof KidTheme !== 'undefined';
        const colors = useKidTheme ? KidTheme.getColors('routine') : {
            gradient: 'linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 50%, #7DD3FC 100%)',
            dark: '#0369A1'
        };

        container.innerHTML = `
            <div class="kid-page kid-page--routine ${useKidTheme ? KidTheme.getAgeClass(member) : ''}">
                <div class="kid-page__hero" style="background: ${colors.gradient}; --kid-hero-text: ${colors.dark}">
                    <button class="btn btn--ghost kid-page__back" id="backBtn">
                        <i data-lucide="arrow-left"></i> Back
                    </button>
                    <button class="kid-page__settings" id="settingsBtn">
                        <i data-lucide="settings"></i>
                    </button>

                    <div class="kid-page__hero-content">
                        <h1 class="kid-page__hero-title kid-page__hero-title--playful">🌟 ${member?.name || ''}'s Routine</h1>
                        <div class="kid-page__hero-stats">
                            <div class="kid-hero-stat">
                                <span class="kid-hero-stat__value">${completedCount}/${totalCount}</span>
                                <span class="kid-hero-stat__label">✅ Done Today</span>
                            </div>
                            <div class="kid-hero-stat">
                                <span class="kid-hero-stat__value">${progressPercent}%</span>
                                <span class="kid-hero-stat__label">🎯 Complete</span>
                            </div>
                            <div class="kid-hero-stat">
                                <span class="kid-hero-stat__value">${streak}</span>
                                <span class="kid-hero-stat__label">🔥 Streak</span>
                            </div>
                        </div>
                        ${allComplete ? '<div class="kid-page__badge kid-page__badge--playful">🎉 All Done! ⭐</div>' : ''}
                    </div>
                </div>

                <div class="kid-page__tabs" style="--tab-color: ${colors.primary}">
                    ${tabs.map(tab => `
                        <button class="kid-page__tab ${activeTab === tab.id ? 'kid-page__tab--active' : ''}"
                                data-tab="${tab.id}">
                            <span class="emoji-icon">${tab.emoji}</span>
                            ${tab.label}
                        </button>
                    `).join('')}
                </div>

                <div class="kid-page__content">
                    ${activeTab === 'today' ? renderTodayTab(memberId, data, categories) : ''}
                    ${activeTab === 'history' ? renderHistoryTab(memberId, data, calendarState.month, calendarState.year, calendarState.selectedDate) : ''}
                    ${activeTab === 'stats' ? renderStatsTab(memberId, data) : ''}
                </div>
            </div>
        `;

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        bindFullPageEvents(container, memberId, member, activeTab, calendarState);
    }

    /**
     * Bind full page events
     */
    function bindFullPageEvents(container, memberId, member, activeTab, calendarState = {}) {
        // Back button
        container.querySelector('#backBtn')?.addEventListener('click', () => {
            State.emit('tabChanged', memberId);
        });

        // Settings button (PIN protected)
        container.querySelector('#settingsBtn')?.addEventListener('click', async () => {
            const verified = await PIN.verify();
            if (verified) {
                showManageModal(memberId);
            }
        });

        // Tab switching
        container.querySelectorAll('[data-tab]').forEach(tab => {
            tab.addEventListener('click', () => {
                const tabId = tab.dataset.tab;
                renderFullPage(container, memberId, member, tabId);
            });
        });

        // Toggle complete on card click (in today tab)
        container.querySelectorAll('.toddler-routine-card').forEach(card => {
            card.addEventListener('click', () => {
                const routineId = card.dataset.routineId;
                toggleComplete(memberId, routineId);
                renderFullPage(container, memberId, member, activeTab, calendarState);
            });
        });

        // Calendar navigation (in history tab)
        container.querySelectorAll('[data-calendar-nav]').forEach(btn => {
            btn.addEventListener('click', () => {
                const historyTab = container.querySelector('.routine-history-tab');
                const currentMonth = parseInt(historyTab?.dataset?.calendarMonth || new Date().getMonth());
                const currentYear = parseInt(historyTab?.dataset?.calendarYear || new Date().getFullYear());

                let newMonth = currentMonth;
                let newYear = currentYear;

                if (btn.dataset.calendarNav === 'prev') {
                    newMonth--;
                    if (newMonth < 0) {
                        newMonth = 11;
                        newYear--;
                    }
                } else {
                    newMonth++;
                    if (newMonth > 11) {
                        newMonth = 0;
                        newYear++;
                    }
                }

                renderFullPage(container, memberId, member, activeTab, { month: newMonth, year: newYear });
            });
        });

        // Calendar date click (in history tab)
        container.querySelectorAll('[data-calendar-date][data-clickable="true"]').forEach(day => {
            day.addEventListener('click', () => {
                const date = day.dataset.calendarDate;
                const historyTab = container.querySelector('.routine-history-tab');
                const currentMonth = parseInt(historyTab?.dataset?.calendarMonth || new Date().getMonth());
                const currentYear = parseInt(historyTab?.dataset?.calendarYear || new Date().getFullYear());

                renderFullPage(container, memberId, member, activeTab, {
                    month: currentMonth,
                    year: currentYear,
                    selectedDate: date
                });
            });
        });

        // Show all history button
        container.querySelector('[data-show-all-history]')?.addEventListener('click', () => {
            const historyTab = container.querySelector('.routine-history-tab');
            const currentMonth = parseInt(historyTab?.dataset?.calendarMonth || new Date().getMonth());
            const currentYear = parseInt(historyTab?.dataset?.calendarYear || new Date().getFullYear());

            renderFullPage(container, memberId, member, activeTab, {
                month: currentMonth,
                year: currentYear,
                selectedDate: null
            });
        });
    }

    /**
     * Show full page view with category grouping
     */
    function showFullPage(memberId, activeTab = 'today') {
        const main = document.querySelector('main');
        if (!main) return;

        const member = Storage.getMember(memberId);
        renderFullPage(main, memberId, member, activeTab);
    }


    /**
     * Generate manage modal HTML
     */
    function generateManageHTML(memberId, activeSection = 'routines') {
        const data = getWidgetData(memberId);
        const routines = data.routines || [];
        const categories = getCategories(memberId);

        const imageOptions = Object.keys(ROUTINE_IMAGES).map(key => ({
            key,
            label: ROUTINE_IMAGES[key].label
        }));

        // Sort categories by order
        const sortedCategories = Object.entries(categories)
            .sort((a, b) => (a[1].order || 0) - (b[1].order || 0));

        const categoryOptions = sortedCategories.map(([key, cat]) => ({
            key,
            label: cat.label,
            emoji: cat.emoji || '📋'
        }));

        return `
            <div class="manage-routines">
                <div class="manage-routines__tabs">
                    <button class="manage-routines__tab ${activeSection === 'routines' ? 'manage-routines__tab--active' : ''}" data-section="routines">
                        <i data-lucide="list-check"></i>
                        Routines
                    </button>
                    <button class="manage-routines__tab ${activeSection === 'categories' ? 'manage-routines__tab--active' : ''}" data-section="categories">
                        <i data-lucide="clock"></i>
                        Time of Day
                    </button>
                </div>

                ${activeSection === 'routines' ? `
                    <p class="manage-routines__hint">
                        <i data-lucide="info"></i>
                        Tap a picture to upload your own photo
                    </p>

                    <div class="manage-routines__list">
                        ${routines.map((routine) => `
                            <div class="manage-routine-item" data-routine-id="${routine.id}" draggable="true">
                                <div class="manage-routine-item__drag-handle">
                                    <i data-lucide="grip-vertical"></i>
                                </div>
                                <div class="manage-routine-item__image" data-upload="${routine.id}">
                                    <img src="${getImageSrc(routine)}" alt="${routine.title}">
                                    <div class="manage-routine-item__image-overlay">
                                        <i data-lucide="camera"></i>
                                    </div>
                                    ${routine.customImage ? `
                                        <button class="manage-routine-item__remove-image" data-remove-image="${routine.id}" title="Remove custom image">
                                            <i data-lucide="x"></i>
                                        </button>
                                    ` : ''}
                                </div>
                                <div class="manage-routine-item__details">
                                    <input type="text" class="form-input manage-routine-item__name" value="${routine.title}"
                                           data-field="title" placeholder="Enter routine name">
                                    <div class="manage-routine-item__selects">
                                        <div class="manage-routine-item__select-group">
                                            <span class="manage-routine-item__select-label">Picture:</span>
                                            <select class="form-select" data-field="imageKey">
                                                ${imageOptions.map(opt => `
                                                    <option value="${opt.key}" ${opt.key === routine.imageKey ? 'selected' : ''}>
                                                        ${opt.label}
                                                    </option>
                                                `).join('')}
                                            </select>
                                        </div>
                                        <div class="manage-routine-item__select-group">
                                            <span class="manage-routine-item__select-label">When:</span>
                                            <select class="form-select" data-field="category">
                                                ${categoryOptions.map(opt => `
                                                    <option value="${opt.key}" ${opt.key === (routine.category || 'morning') ? 'selected' : ''}>
                                                        ${opt.emoji} ${opt.label}
                                                    </option>
                                                `).join('')}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <button class="btn btn--sm btn--ghost manage-routine-item__delete" data-delete="${routine.id}">
                                    <i data-lucide="trash-2"></i>
                                </button>
                            </div>
                        `).join('')}
                    </div>

                    <div class="manage-routines__add">
                        <h4 class="manage-routines__add-title">Add a Routine</h4>

                        <!-- Quick Add: Visual preset grid -->
                        <p class="manage-routines__add-subtitle">Tap to add:</p>
                        <div class="manage-routines__presets">
                            ${imageOptions.map(opt => `
                                <button class="manage-routines__preset" data-add-preset="${opt.key}" title="${opt.label}">
                                    <img src="${getImageSrc({ imageKey: opt.key })}" alt="${opt.label}">
                                    <span>${opt.label}</span>
                                </button>
                            `).join('')}
                        </div>

                        <!-- Custom Routine -->
                        <div class="manage-routines__custom">
                            <p class="manage-routines__add-subtitle">Or create custom:</p>
                            <div class="manage-routines__custom-form">
                                <div class="manage-routines__custom-image" id="customImageUpload">
                                    <div class="manage-routines__custom-image-placeholder">
                                        <i data-lucide="camera"></i>
                                        <span>Add Photo</span>
                                    </div>
                                    <img id="customImagePreview" src="" alt="" style="display: none;">
                                </div>
                                <div class="manage-routines__custom-fields">
                                    <input type="text" class="form-input" id="newRoutineName" placeholder="Routine name">
                                    <div class="manage-routine-item__select-group">
                                        <span class="manage-routine-item__select-label">When:</span>
                                        <select class="form-select" id="newRoutineCategory">
                                            ${categoryOptions.map(opt => `
                                                <option value="${opt.key}">${opt.emoji} ${opt.label}</option>
                                            `).join('')}
                                        </select>
                                    </div>
                                    <button class="btn btn--primary btn--sm" id="addCustomRoutineBtn">
                                        <i data-lucide="plus"></i>
                                        Add Custom
                                    </button>
                                </div>
                            </div>
                        </div>
                        <input type="file" id="customImageInput" accept="image/*" style="display: none;">
                    </div>
                ` : `
                    <div class="manage-categories">
                        <p class="manage-categories__info">Customize your routine categories. Changes affect how routines are grouped.</p>

                        <div class="manage-categories__list">
                            ${sortedCategories.map(([key, cat]) => `
                                <div class="manage-category-item" data-category-key="${key}">
                                    <div class="manage-category-item__icon" style="background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%);">
                                        <i data-lucide="${cat.icon}"></i>
                                    </div>
                                    <div class="manage-category-item__details">
                                        <input type="text" class="form-input manage-category-item__name" value="${cat.label}"
                                               data-cat-field="label" placeholder="Category name">
                                        <select class="form-select" data-cat-field="icon" title="Icon">
                                            ${CATEGORY_ICONS.map(icon => `
                                                <option value="${icon.key}" ${icon.key === cat.icon ? 'selected' : ''}>
                                                    ${icon.label}
                                                </option>
                                            `).join('')}
                                        </select>
                                    </div>
                                    <button class="btn btn--sm btn--ghost manage-category-item__delete" data-delete-category="${key}"
                                            ${Object.keys(categories).length <= 1 ? 'disabled title="Cannot delete last category"' : ''}>
                                        <i data-lucide="trash-2"></i>
                                    </button>
                                </div>
                            `).join('')}
                        </div>

                        <div class="manage-categories__add">
                            <h4 class="manage-categories__add-title">Add New Category</h4>
                            <div class="manage-categories__add-form">
                                <input type="text" class="form-input" id="newCategoryName" placeholder="Category name (e.g., Playtime)">
                                <select class="form-select" id="newCategoryIcon" title="Icon">
                                    ${CATEGORY_ICONS.map(icon => `
                                        <option value="${icon.key}">${icon.label}</option>
                                    `).join('')}
                                </select>
                                <button class="btn btn--primary btn--sm" id="addCategoryBtn">
                                    <i data-lucide="plus"></i>
                                    Add
                                </button>
                            </div>
                        </div>

                        <div class="manage-categories__reset">
                            <button class="btn btn--sm btn--ghost" id="resetCategoriesBtn">
                                <i data-lucide="rotate-ccw"></i>
                                Reset to Defaults
                            </button>
                        </div>
                    </div>
                `}

                <input type="file" id="imageUploadInput" accept="image/*" style="display: none;">
            </div>
        `;
    }

    // Track active manage section
    let manageActiveSection = 'routines';

    /**
     * Show manage modal
     */
    function showManageModal(memberId) {
        manageActiveSection = 'routines';
        Modal.open({
            title: 'Manage Routines',
            content: generateManageHTML(memberId, manageActiveSection),
            footer: '<button class="btn btn--primary" data-modal-done>Done</button>',
            size: 'large'
        });

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        bindManageEvents(memberId);
    }

    /**
     * Refresh manage modal
     */
    function refreshManageModal(memberId, section = null) {
        const modalContent = document.getElementById('modalContent');
        if (!modalContent) return;

        if (section) {
            manageActiveSection = section;
        }

        modalContent.innerHTML = generateManageHTML(memberId, manageActiveSection);

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        bindManageEvents(memberId);
    }

    /**
     * Bind manage modal events
     */
    function bindManageEvents(memberId) {
        const imageOptions = Object.keys(ROUTINE_IMAGES).map(key => ({
            key,
            label: ROUTINE_IMAGES[key].label
        }));

        // Track which routine is being uploaded to
        let uploadTargetId = null;

        // Image upload click handlers
        document.querySelectorAll('[data-upload]').forEach(el => {
            el.addEventListener('click', (e) => {
                if (e.target.closest('[data-remove-image]')) return;
                uploadTargetId = el.dataset.upload;
                document.getElementById('imageUploadInput')?.click();
            });
        });

        // Handle image file selection
        document.getElementById('imageUploadInput')?.addEventListener('change', (e) => {
            const file = e.target.files?.[0];
            if (!file || !uploadTargetId) return;

            // Validate file size (max 500KB for localStorage)
            if (file.size > 500 * 1024) {
                Toast.error('Image too large. Max 500KB.');
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                const base64 = event.target.result;
                const data = getWidgetData(memberId);
                const routines = data.routines || [];

                const updatedRoutines = routines.map(r => {
                    if (r.id === uploadTargetId) {
                        return { ...r, customImage: base64 };
                    }
                    return r;
                });

                Storage.setWidgetData(memberId, 'toddler-routine', {
                    ...data,
                    routines: updatedRoutines
                });

                Toast.success('Image uploaded!');
                refreshManageModal(memberId);
                refreshWidget(memberId);
            };
            reader.readAsDataURL(file);

            // Reset input
            e.target.value = '';
        });

        // Remove custom image buttons
        document.querySelectorAll('[data-remove-image]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const routineId = btn.dataset.removeImage;
                const data = getWidgetData(memberId);
                const routines = data.routines || [];

                const updatedRoutines = routines.map(r => {
                    if (r.id === routineId) {
                        return { ...r, customImage: null };
                    }
                    return r;
                });

                Storage.setWidgetData(memberId, 'toddler-routine', {
                    ...data,
                    routines: updatedRoutines
                });

                Toast.success('Custom image removed');
                refreshManageModal(memberId);
                refreshWidget(memberId);
            });
        });

        // Delete buttons
        document.querySelectorAll('[data-delete]').forEach(btn => {
            btn.addEventListener('click', () => {
                const routineId = btn.dataset.delete;
                const data = getWidgetData(memberId);

                const updatedRoutines = (data.routines || []).filter(r => r.id !== routineId);

                Storage.setWidgetData(memberId, 'toddler-routine', {
                    ...data,
                    routines: updatedRoutines
                });

                Toast.success('Routine removed');
                refreshManageModal(memberId);
                refreshWidget(memberId);
            });
        });

        // Title/image/category changes (save on change)
        document.querySelectorAll('.manage-routine-item').forEach(item => {
            const routineId = item.dataset.routineId;
            const titleInput = item.querySelector('[data-field="title"]');
            const imageSelect = item.querySelector('[data-field="imageKey"]');
            const categorySelect = item.querySelector('[data-field="category"]');

            const saveChanges = () => {
                const data = getWidgetData(memberId);
                const updatedRoutines = (data.routines || []).map(r => {
                    if (r.id === routineId) {
                        return {
                            ...r,
                            title: titleInput?.value || r.title,
                            imageKey: imageSelect?.value || r.imageKey,
                            category: categorySelect?.value || r.category || 'morning'
                        };
                    }
                    return r;
                });

                Storage.setWidgetData(memberId, 'toddler-routine', {
                    ...data,
                    routines: updatedRoutines
                });

                refreshWidget(memberId);
            };

            titleInput?.addEventListener('change', saveChanges);
            categorySelect?.addEventListener('change', saveChanges);
            imageSelect?.addEventListener('change', () => {
                saveChanges();
                // Update preview image
                const img = item.querySelector('.manage-routine-item__image img');
                if (img) {
                    img.src = getImageSrc({ imageKey: imageSelect.value });
                }
            });
        });

        // Setup drag and drop in manage modal
        setupManageDragAndDrop(memberId);

        // Track custom image for new routine
        let pendingCustomImage = null;

        // Quick add preset routine
        document.querySelectorAll('[data-add-preset]').forEach(btn => {
            btn.addEventListener('click', () => {
                const imageKey = btn.dataset.addPreset;
                const routineInfo = ROUTINE_IMAGES[imageKey];
                if (!routineInfo) return;

                const data = getWidgetData(memberId);
                const routines = data.routines || [];

                // Determine default category based on routine type
                let category = 'morning';
                if (['wash-hands', 'potty'].includes(imageKey)) {
                    category = 'anytime';
                } else if (['lunch', 'snack', 'nap'].includes(imageKey)) {
                    category = 'afternoon';
                } else if (['dinner', 'bath'].includes(imageKey)) {
                    category = 'evening';
                } else if (['pajamas', 'story', 'bedtime'].includes(imageKey)) {
                    category = 'bedtime';
                }

                const newRoutine = {
                    id: `routine-${Date.now()}`,
                    title: routineInfo.label,
                    imageKey: imageKey,
                    category: category,
                    customImage: null,
                    order: routines.length + 1
                };

                Storage.setWidgetData(memberId, 'toddler-routine', {
                    ...data,
                    routines: [...routines, newRoutine]
                });

                Toast.success(`Added "${routineInfo.label}"!`);
                refreshManageModal(memberId);
                refreshWidget(memberId);
            });
        });

        // Custom image upload area click
        document.getElementById('customImageUpload')?.addEventListener('click', () => {
            document.getElementById('customImageInput')?.click();
        });

        // Custom image file selection
        document.getElementById('customImageInput')?.addEventListener('change', (e) => {
            const file = e.target.files?.[0];
            if (!file) return;

            if (file.size > 500 * 1024) {
                Toast.error('Image too large. Max 500KB.');
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                pendingCustomImage = event.target.result;
                const preview = document.getElementById('customImagePreview');
                const placeholder = document.querySelector('.manage-routines__custom-image-placeholder');
                if (preview && placeholder) {
                    preview.src = pendingCustomImage;
                    preview.style.display = 'block';
                    placeholder.style.display = 'none';
                }
            };
            reader.readAsDataURL(file);
            e.target.value = '';
        });

        // Add custom routine
        const addCustomRoutine = () => {
            const nameInput = document.getElementById('newRoutineName');
            const categorySelect = document.getElementById('newRoutineCategory');
            const name = nameInput?.value?.trim();

            if (!name) {
                Toast.error('Please enter a routine name');
                return;
            }

            if (!pendingCustomImage) {
                Toast.error('Please add a photo for your custom routine');
                return;
            }

            const data = getWidgetData(memberId);
            const routines = data.routines || [];

            const newRoutine = {
                id: `routine-${Date.now()}`,
                title: name,
                imageKey: 'wake-up', // Default fallback
                category: categorySelect?.value || 'morning',
                customImage: pendingCustomImage,
                order: routines.length + 1
            };

            Storage.setWidgetData(memberId, 'toddler-routine', {
                ...data,
                routines: [...routines, newRoutine]
            });

            pendingCustomImage = null;
            Toast.success('Custom routine added!');
            refreshManageModal(memberId);
            refreshWidget(memberId);
        };

        document.getElementById('addCustomRoutineBtn')?.addEventListener('click', addCustomRoutine);
        document.getElementById('newRoutineName')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addCustomRoutine();
            }
        });

        // Done button - close modal
        document.querySelector('[data-modal-done]')?.addEventListener('click', () => {
            Modal.close();
        });

        // Section tab switching
        document.querySelectorAll('[data-section]').forEach(tab => {
            tab.addEventListener('click', () => {
                const section = tab.dataset.section;
                refreshManageModal(memberId, section);
            });
        });

        // Category management events
        // Save category changes on input
        document.querySelectorAll('.manage-category-item').forEach(item => {
            const categoryKey = item.dataset.categoryKey;
            const nameInput = item.querySelector('[data-cat-field="label"]');
            const iconSelect = item.querySelector('[data-cat-field="icon"]');

            const saveCategoryChanges = () => {
                const data = getWidgetData(memberId);
                const categories = data.categories || { ...DEFAULT_CATEGORIES };

                if (categories[categoryKey]) {
                    categories[categoryKey] = {
                        ...categories[categoryKey],
                        label: nameInput?.value || categories[categoryKey].label,
                        icon: iconSelect?.value || categories[categoryKey].icon
                    };

                    Storage.setWidgetData(memberId, 'toddler-routine', {
                        ...data,
                        categories
                    });

                    refreshWidget(memberId);
                }
            };

            nameInput?.addEventListener('change', saveCategoryChanges);
            iconSelect?.addEventListener('change', () => {
                saveCategoryChanges();
                // Update icon preview
                const iconPreview = item.querySelector('.manage-category-item__icon i');
                if (iconPreview && iconSelect) {
                    iconPreview.setAttribute('data-lucide', iconSelect.value);
                    if (typeof lucide !== 'undefined') {
                        lucide.createIcons();
                    }
                }
            });
        });

        // Delete category
        document.querySelectorAll('[data-delete-category]').forEach(btn => {
            btn.addEventListener('click', () => {
                const categoryKey = btn.dataset.deleteCategory;
                const data = getWidgetData(memberId);
                const categories = data.categories || { ...DEFAULT_CATEGORIES };

                if (Object.keys(categories).length <= 1) {
                    Toast.error('Cannot delete the last category');
                    return;
                }

                // Check if any routines use this category
                const routines = data.routines || [];
                const routinesWithCategory = routines.filter(r => r.category === categoryKey);

                if (routinesWithCategory.length > 0) {
                    // Move routines to first available category
                    const firstCategoryKey = Object.keys(categories).find(k => k !== categoryKey);
                    const updatedRoutines = routines.map(r => {
                        if (r.category === categoryKey) {
                            return { ...r, category: firstCategoryKey };
                        }
                        return r;
                    });

                    delete categories[categoryKey];

                    Storage.setWidgetData(memberId, 'toddler-routine', {
                        ...data,
                        categories,
                        routines: updatedRoutines
                    });

                    Toast.success(`Category deleted. ${routinesWithCategory.length} routines moved.`);
                } else {
                    delete categories[categoryKey];

                    Storage.setWidgetData(memberId, 'toddler-routine', {
                        ...data,
                        categories
                    });

                    Toast.success('Category deleted');
                }

                refreshManageModal(memberId, 'categories');
                refreshWidget(memberId);
            });
        });

        // Add new category
        const addCategory = () => {
            const nameInput = document.getElementById('newCategoryName');
            const iconSelect = document.getElementById('newCategoryIcon');
            const name = nameInput?.value?.trim();

            if (!name) {
                Toast.error('Please enter a category name');
                return;
            }

            const data = getWidgetData(memberId);
            const categories = data.categories || { ...DEFAULT_CATEGORIES };

            // Generate a unique key from the name
            const key = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');

            if (categories[key]) {
                Toast.error('A category with this name already exists');
                return;
            }

            // Find the highest order
            const maxOrder = Math.max(...Object.values(categories).map(c => c.order || 0), 0);

            categories[key] = {
                label: name,
                icon: iconSelect?.value || 'star',
                order: maxOrder + 1
            };

            Storage.setWidgetData(memberId, 'toddler-routine', {
                ...data,
                categories
            });

            Toast.success('Category added!');
            refreshManageModal(memberId, 'categories');
            refreshWidget(memberId);
        };

        document.getElementById('addCategoryBtn')?.addEventListener('click', addCategory);
        document.getElementById('newCategoryName')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addCategory();
            }
        });

        // Reset categories to defaults
        document.getElementById('resetCategoriesBtn')?.addEventListener('click', () => {
            const data = getWidgetData(memberId);

            // Reset categories to defaults
            const categories = { ...DEFAULT_CATEGORIES };

            // Update routines to use valid categories
            const validKeys = Object.keys(categories);
            const routines = (data.routines || []).map(r => {
                if (!validKeys.includes(r.category)) {
                    return { ...r, category: 'morning' };
                }
                return r;
            });

            Storage.setWidgetData(memberId, 'toddler-routine', {
                ...data,
                categories,
                routines
            });

            Toast.success('Categories reset to defaults');
            refreshManageModal(memberId, 'categories');
            refreshWidget(memberId);
        });
    }

    /**
     * Setup drag and drop in manage modal for reordering
     */
    function setupManageDragAndDrop(memberId) {
        const list = document.querySelector('.manage-routines__list');
        if (!list) return;

        let draggedItem = null;
        let canDrag = false;

        list.querySelectorAll('.manage-routine-item').forEach((item) => {
            const handle = item.querySelector('.manage-routine-item__drag-handle');

            // Track if mousedown was on handle (needed because e.target in dragstart is the draggable element)
            if (handle) {
                handle.addEventListener('mousedown', () => {
                    canDrag = true;
                });
                // Also support touch
                handle.addEventListener('touchstart', () => {
                    canDrag = true;
                }, { passive: true });
            }

            // Reset on mouseup anywhere
            document.addEventListener('mouseup', () => {
                setTimeout(() => { canDrag = false; }, 0);
            }, { once: false });

            // Only allow drag if started from handle
            item.addEventListener('dragstart', (e) => {
                if (!canDrag) {
                    e.preventDefault();
                    return;
                }
                draggedItem = item;
                item.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', item.dataset.routineId);
            });

            item.addEventListener('dragend', () => {
                item.classList.remove('dragging');
                draggedItem = null;
                canDrag = false;
                list.querySelectorAll('.manage-routine-item').forEach(i => {
                    i.classList.remove('drag-over');
                });
            });

            item.addEventListener('dragover', (e) => {
                e.preventDefault();
                if (draggedItem && draggedItem !== item) {
                    item.classList.add('drag-over');
                }
            });

            item.addEventListener('dragleave', () => {
                item.classList.remove('drag-over');
            });

            item.addEventListener('drop', (e) => {
                e.preventDefault();
                item.classList.remove('drag-over');

                if (draggedItem && draggedItem !== item) {
                    const data = getWidgetData(memberId);
                    const routines = [...(data.routines || [])];

                    const draggedId = draggedItem.dataset.routineId;
                    const targetId = item.dataset.routineId;

                    const draggedIndex = routines.findIndex(r => r.id === draggedId);
                    const targetIndex = routines.findIndex(r => r.id === targetId);

                    if (draggedIndex !== -1 && targetIndex !== -1) {
                        const [moved] = routines.splice(draggedIndex, 1);
                        routines.splice(targetIndex, 0, moved);

                        // Update order values
                        routines.forEach((r, i) => {
                            r.order = i + 1;
                        });

                        Storage.setWidgetData(memberId, 'toddler-routine', {
                            ...data,
                            routines
                        });

                        refreshManageModal(memberId);
                        refreshWidget(memberId);
                    }
                }
            });
        });
    }

    /**
     * Refresh widget in place
     */
    function refreshWidget(memberId) {
        const widgetBody = document.getElementById('widget-toddler-routine');
        if (widgetBody) {
            renderWidget(widgetBody, memberId);
        }

        // Also refresh full page if it's visible
        const fullPage = document.querySelector('.kid-page--routine');
        if (fullPage) {
            const main = document.querySelector('main');
            const member = Storage.getMember(memberId);
            const activeTabBtn = fullPage.querySelector('.kid-page__tab--active');
            const activeTab = activeTabBtn?.dataset?.tab || 'today';
            renderFullPage(main, memberId, member, activeTab);
        }
    }

    /**
     * Show edit routines modal (legacy - redirects to manage)
     */
    function showEditRoutinesModal(memberId) {
        showManageModal(memberId);
    }

    /**
     * Initialize
     */
    function init() {
        // Toddler routine feature initialized
    }

    return {
        init,
        renderWidget,
        showFullPage,
        ROUTINE_IMAGES
    };
})();
