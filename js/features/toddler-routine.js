/**
 * Toddler Routine Feature
 * Visual checklist with image cards for toddler daily routines
 */

const ToddlerRoutine = (function() {
    // Category definitions for grouping
    const CATEGORIES = {
        morning: { label: 'Morning', icon: 'sunrise', order: 1 },
        meals: { label: 'Meals & Snacks', icon: 'utensils', order: 2 },
        naps: { label: 'Naps', icon: 'moon', order: 3 },
        evening: { label: 'Evening', icon: 'sunset', order: 4 },
        bedtime: { label: 'Bedtime', icon: 'bed', order: 5 }
    };

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
        { id: 'default-4', title: 'Breakfast', imageKey: 'breakfast', category: 'meals', order: 4 },
        { id: 'default-5', title: 'Wash Hands', imageKey: 'wash-hands', category: 'meals', order: 5 },
        { id: 'default-6', title: 'Lunch', imageKey: 'lunch', category: 'meals', order: 6 },
        { id: 'default-7', title: 'Nap Time', imageKey: 'nap', category: 'naps', order: 7 },
        { id: 'default-8', title: 'Snack', imageKey: 'snack', category: 'meals', order: 8 },
        { id: 'default-9', title: 'Dinner', imageKey: 'dinner', category: 'meals', order: 9 },
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
    function groupRoutinesByCategory(routines) {
        const groups = {};

        // Initialize all categories
        Object.keys(CATEGORIES).forEach(cat => {
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
                    <button class="btn btn--sm btn--ghost" data-action="stats" title="View stats">
                        <i data-lucide="bar-chart-2"></i>
                    </button>
                </div>

                <div class="toddler-routine-grid">
                    ${routines.map(routine => {
                        const isComplete = completedToday.includes(routine.id);
                        return `
                            <div class="toddler-routine-card ${isComplete ? 'toddler-routine-card--done' : ''}"
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

        // Stats button
        container.querySelector('[data-action="stats"]')?.addEventListener('click', (e) => {
            e.stopPropagation();
            showStatsModal(memberId);
        });

        // History button
        container.querySelector('[data-action="history"]')?.addEventListener('click', (e) => {
            e.stopPropagation();
            showHistoryPage(memberId);
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
     * Show full page view with category grouping
     */
    function showFullPage(memberId) {
        const main = document.querySelector('main');
        if (!main) return;

        const member = Storage.getMember(memberId);
        const data = checkAndResetDaily(memberId);
        const routines = data.routines || [];
        const completedToday = data.completedToday || [];

        const completedCount = completedToday.length;
        const totalCount = routines.length;
        const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
        const allComplete = completedCount === totalCount && totalCount > 0;

        // Group routines by category
        const groupedRoutines = groupRoutinesByCategory(routines);

        // Generate category sections HTML
        const categorySectionsHTML = Object.entries(CATEGORIES)
            .filter(([cat]) => groupedRoutines[cat] && groupedRoutines[cat].length > 0)
            .map(([cat, catInfo]) => {
                const catRoutines = groupedRoutines[cat];
                const catCompleted = catRoutines.filter(r => completedToday.includes(r.id)).length;

                return `
                    <div class="routine-category" data-category="${cat}">
                        <div class="routine-category__header">
                            <div class="routine-category__title">
                                <i data-lucide="${catInfo.icon}"></i>
                                <span>${catInfo.label}</span>
                            </div>
                            <span class="routine-category__count">${catCompleted}/${catRoutines.length}</span>
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
            }).join('');

        main.innerHTML = `
            <div class="full-page">
                <div class="full-page__header">
                    <button class="btn btn--ghost" id="backBtn">
                        <i data-lucide="arrow-left"></i>
                        Back
                    </button>
                    <h1 class="full-page__title">${member?.name || ''}'s Routine</h1>
                    <div class="full-page__actions">
                        <button class="btn btn--sm btn--ghost" id="statsBtn" title="View stats">
                            <i data-lucide="bar-chart-2"></i>
                        </button>
                        <button class="btn btn--sm btn--ghost" id="editRoutinesBtn">
                            <i data-lucide="settings"></i>
                        </button>
                    </div>
                </div>

                <div class="full-page__content">
                    <div class="toddler-routine-full-header ${allComplete ? 'toddler-routine-full-header--complete' : ''}">
                        <div class="toddler-routine-progress-ring toddler-routine-progress-ring--large" data-progress="${progressPercent}">
                            <svg viewBox="0 0 36 36">
                                <path class="toddler-routine-progress-ring__bg"
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                                <path class="toddler-routine-progress-ring__fill"
                                    stroke-dasharray="${progressPercent}, 100"
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                            </svg>
                            <span class="toddler-routine-progress-ring__text">${progressPercent}%</span>
                        </div>
                        <div class="toddler-routine-full-header__info">
                            <span class="toddler-routine-progress-text">
                                ${completedCount} of ${totalCount} complete
                            </span>
                            ${allComplete ? '<span class="toddler-routine-complete-badge">All Done!</span>' : ''}
                        </div>
                        <button class="btn btn--sm btn--outline" id="resetAllBtn">
                            <i data-lucide="rotate-ccw"></i>
                            Reset
                        </button>
                    </div>

                    <div class="toddler-routine-categories">
                        ${categorySectionsHTML}
                    </div>
                </div>
            </div>
        `;

        // Initialize icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Bind events
        document.getElementById('backBtn')?.addEventListener('click', () => {
            State.emit('tabChanged', memberId);
        });

        document.getElementById('resetAllBtn')?.addEventListener('click', () => {
            showResetConfirm(memberId);
        });

        document.getElementById('statsBtn')?.addEventListener('click', () => {
            showStatsModal(memberId);
        });

        document.getElementById('editRoutinesBtn')?.addEventListener('click', async () => {
            const verified = await PIN.verify();
            if (verified) {
                showManageModal(memberId);
            }
        });

        // Toggle complete on card click
        document.querySelectorAll('.toddler-routine-card').forEach(card => {
            card.addEventListener('click', () => {
                const routineId = card.dataset.routineId;
                toggleComplete(memberId, routineId);
            });
        });
    }


    /**
     * Generate manage modal HTML
     */
    function generateManageHTML(memberId) {
        const data = getWidgetData(memberId);
        const routines = data.routines || [];

        const imageOptions = Object.keys(ROUTINE_IMAGES).map(key => ({
            key,
            label: ROUTINE_IMAGES[key].label
        }));

        const categoryOptions = Object.entries(CATEGORIES).map(([key, cat]) => ({
            key,
            label: cat.label
        }));

        return `
            <div class="manage-routines">
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
                                    <select class="form-select" data-field="imageKey" title="Image">
                                        ${imageOptions.map(opt => `
                                            <option value="${opt.key}" ${opt.key === routine.imageKey ? 'selected' : ''}>
                                                ${opt.label}
                                            </option>
                                        `).join('')}
                                    </select>
                                    <select class="form-select" data-field="category" title="Category">
                                        ${categoryOptions.map(opt => `
                                            <option value="${opt.key}" ${opt.key === (routine.category || 'morning') ? 'selected' : ''}>
                                                ${opt.label}
                                            </option>
                                        `).join('')}
                                    </select>
                                </div>
                            </div>
                            <button class="btn btn--sm btn--ghost manage-routine-item__delete" data-delete="${routine.id}">
                                <i data-lucide="trash-2"></i>
                            </button>
                        </div>
                    `).join('')}
                </div>

                <div class="manage-routines__add">
                    <h4 class="manage-routines__add-title">Add New Routine</h4>
                    <div class="manage-routines__add-form">
                        <input type="text" class="form-input" id="newRoutineName" placeholder="Routine name (e.g., Potty Time)">
                        <select class="form-select" id="newRoutineImage" title="Image">
                            ${imageOptions.map(opt => `
                                <option value="${opt.key}">${opt.label}</option>
                            `).join('')}
                        </select>
                        <select class="form-select" id="newRoutineCategory" title="Category">
                            ${categoryOptions.map(opt => `
                                <option value="${opt.key}">${opt.label}</option>
                            `).join('')}
                        </select>
                        <button class="btn btn--primary btn--sm" id="addRoutineBtn">
                            <i data-lucide="plus"></i>
                            Add
                        </button>
                    </div>
                </div>

                <input type="file" id="imageUploadInput" accept="image/*" style="display: none;">
            </div>
        `;
    }

    /**
     * Show manage modal
     */
    function showManageModal(memberId) {
        Modal.open({
            title: 'Manage Routines',
            content: generateManageHTML(memberId),
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
    function refreshManageModal(memberId) {
        const modalContent = document.getElementById('modalContent');
        if (!modalContent) return;

        modalContent.innerHTML = generateManageHTML(memberId);

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

        // Add new routine
        const addRoutine = () => {
            const nameInput = document.getElementById('newRoutineName');
            const imageSelect = document.getElementById('newRoutineImage');
            const categorySelect = document.getElementById('newRoutineCategory');
            const name = nameInput?.value?.trim();

            if (!name) {
                Toast.error('Please enter a routine name');
                return;
            }

            const data = getWidgetData(memberId);
            const routines = data.routines || [];

            const newRoutine = {
                id: `routine-${Date.now()}`,
                title: name,
                imageKey: imageSelect?.value || 'wake-up',
                category: categorySelect?.value || 'morning',
                customImage: null,
                order: routines.length + 1
            };

            Storage.setWidgetData(memberId, 'toddler-routine', {
                ...data,
                routines: [...routines, newRoutine]
            });

            Toast.success('Routine added!');
            refreshManageModal(memberId);
            refreshWidget(memberId);
        };

        document.getElementById('addRoutineBtn')?.addEventListener('click', addRoutine);
        document.getElementById('newRoutineName')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addRoutine();
            }
        });

        // Done button - close modal
        document.querySelector('[data-modal-done]')?.addEventListener('click', () => {
            Modal.close();
        });
    }

    /**
     * Setup drag and drop in manage modal for reordering
     */
    function setupManageDragAndDrop(memberId) {
        const list = document.querySelector('.manage-routines__list');
        if (!list) return;

        let draggedItem = null;

        list.querySelectorAll('.manage-routine-item').forEach((item, index) => {
            const handle = item.querySelector('.manage-routine-item__drag-handle');

            // Only allow drag from handle
            item.addEventListener('dragstart', (e) => {
                if (!e.target.closest('.manage-routine-item__drag-handle')) {
                    e.preventDefault();
                    return;
                }
                draggedItem = item;
                item.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
            });

            item.addEventListener('dragend', () => {
                item.classList.remove('dragging');
                draggedItem = null;
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
    }

    /**
     * Show edit routines modal (legacy - redirects to manage)
     */
    function showEditRoutinesModal(memberId) {
        showManageModal(memberId);
    }

    /**
     * Show routine history page
     */
    function showHistoryPage(memberId) {
        const main = document.getElementById('mainContent');
        if (!main) return;

        const member = Storage.getMember(memberId);
        const data = getWidgetData(memberId);
        const history = data.history || [];
        const routines = data.routines || [];

        // Create routine lookup map
        const routineMap = {};
        routines.forEach(r => {
            routineMap[r.id] = r.title;
        });

        // Sort history by date descending
        const sortedHistory = [...history].sort((a, b) => b.date.localeCompare(a.date));

        // Calculate stats
        const todayStr = DateUtils.today();
        const completedToday = data.completedToday || [];
        const todayCount = completedToday.length;
        const totalRoutines = routines.length;

        // Calculate streak (consecutive days with all routines completed)
        let streak = 0;
        for (let i = 0; i < sortedHistory.length; i++) {
            if (sortedHistory[i].completed === sortedHistory[i].total && sortedHistory[i].total > 0) {
                streak++;
            } else {
                break;
            }
        }

        // Get date label
        const getDateLabel = (date) => {
            if (date === todayStr) return 'Today';
            const yesterday = DateUtils.formatISO(DateUtils.addDays(new Date(), -1));
            if (date === yesterday) return 'Yesterday';
            return DateUtils.formatShort(date);
        };

        main.innerHTML = `
            <div class="toddler-tasks-history-page">
                <div class="toddler-tasks-page__header">
                    <button class="btn btn--ghost" id="backToMemberBtn">
                        <i data-lucide="arrow-left"></i>
                        Back
                    </button>
                    <h1 class="toddler-tasks-page__title">
                        📅 Routine History
                    </h1>
                    <div></div>
                </div>

                <div class="toddler-tasks-page__stats">
                    <div class="toddler-tasks-page-stat toddler-tasks-page-stat--done">
                        <div class="toddler-tasks-page-stat__icon">✅</div>
                        <div class="toddler-tasks-page-stat__info">
                            <span class="toddler-tasks-page-stat__value">${todayCount}/${totalRoutines}</span>
                            <span class="toddler-tasks-page-stat__label">Today</span>
                        </div>
                    </div>
                    <div class="toddler-tasks-page-stat toddler-tasks-page-stat--total">
                        <div class="toddler-tasks-page-stat__icon">🔥</div>
                        <div class="toddler-tasks-page-stat__info">
                            <span class="toddler-tasks-page-stat__value">${streak}</span>
                            <span class="toddler-tasks-page-stat__label">Day Streak</span>
                        </div>
                    </div>
                </div>

                <div class="toddler-tasks-history">
                    ${sortedHistory.length === 0 ? `
                        <div class="toddler-tasks-page__empty">
                            <div class="toddler-tasks-page__empty-icon">📅</div>
                            <h2>No History Yet</h2>
                            <p>Complete some routines to see your history!</p>
                        </div>
                    ` : sortedHistory.map(entry => `
                        <div class="toddler-tasks-history__day">
                            <div class="toddler-tasks-history__day-header">
                                <span class="toddler-tasks-history__day-label">${getDateLabel(entry.date)}</span>
                                <span class="toddler-tasks-history__day-count ${entry.completed === entry.total ? 'toddler-tasks-history__day-count--complete' : ''}">
                                    ${entry.completed}/${entry.total} completed
                                    ${entry.completed === entry.total && entry.total > 0 ? ' ⭐' : ''}
                                </span>
                            </div>
                            <div class="toddler-tasks-history__day-list">
                                ${(entry.routineIds || []).map(routineId => `
                                    <div class="toddler-tasks-history__item">
                                        <span class="toddler-tasks-history__item-icon">✅</span>
                                        <span class="toddler-tasks-history__item-title">${routineMap[routineId] || 'Routine'}</span>
                                    </div>
                                `).join('')}
                                ${entry.routineIds && entry.routineIds.length === 0 ? `
                                    <div class="toddler-tasks-history__item toddler-tasks-history__item--empty">
                                        <span class="toddler-tasks-history__item-icon">📋</span>
                                        <span class="toddler-tasks-history__item-title">No routines completed</span>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Back button
        document.getElementById('backToMemberBtn')?.addEventListener('click', () => {
            State.emit('tabChanged', memberId);
        });
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
        showHistoryPage,
        ROUTINE_IMAGES
    };
})();
