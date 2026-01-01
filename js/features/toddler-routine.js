/**
 * Toddler Routine Feature
 * Visual checklist with image cards for toddler daily routines
 */

const ToddlerRoutine = (function() {
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

    // Default routines for new toddlers
    const DEFAULT_ROUTINES = [
        { id: 'default-1', title: 'Wake Up', imageKey: 'wake-up', order: 1 },
        { id: 'default-2', title: 'Brush Teeth', imageKey: 'brush-teeth', order: 2 },
        { id: 'default-3', title: 'Get Dressed', imageKey: 'get-dressed', order: 3 },
        { id: 'default-4', title: 'Breakfast', imageKey: 'breakfast', order: 4 },
        { id: 'default-5', title: 'Wash Hands', imageKey: 'wash-hands', order: 5 },
        { id: 'default-6', title: 'Lunch', imageKey: 'lunch', order: 6 },
        { id: 'default-7', title: 'Nap Time', imageKey: 'nap', order: 7 },
        { id: 'default-8', title: 'Snack', imageKey: 'snack', order: 8 },
        { id: 'default-9', title: 'Dinner', imageKey: 'dinner', order: 9 },
        { id: 'default-10', title: 'Bath Time', imageKey: 'bath', order: 10 },
        { id: 'default-11', title: 'Pajamas', imageKey: 'pajamas', order: 11 },
        { id: 'default-12', title: 'Story Time', imageKey: 'story', order: 12 },
        { id: 'default-13', title: 'Bedtime', imageKey: 'bedtime', order: 13 }
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
                lastResetDate: DateUtils.today()
            };
        }
        return stored;
    }

    /**
     * Check and reset if new day
     */
    function checkAndResetDaily(memberId) {
        const data = getWidgetData(memberId);
        const today = DateUtils.today();

        if (data.lastResetDate !== today) {
            const updatedData = {
                ...data,
                completedToday: [],
                lastResetDate: today
            };
            Storage.setWidgetData(memberId, 'toddler-routine', updatedData);
            return updatedData;
        }
        return data;
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

        // Show all routines in widget (smaller cards fit more)
        const displayRoutines = routines;
        const completedCount = completedToday.length;
        const totalCount = routines.length;

        container.innerHTML = `
            <div class="toddler-routine-widget">
                <div class="toddler-routine-widget__header">
                    <span class="toddler-routine-widget__progress">
                        ${completedCount}/${totalCount} done
                    </span>
                </div>

                <div class="toddler-routine-grid">
                    ${displayRoutines.map(routine => {
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

        // Bind events
        bindWidgetEvents(container, memberId);
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
     * Show full page view
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

        main.innerHTML = `
            <div class="full-page">
                <div class="full-page__header">
                    <button class="btn btn--ghost" id="backBtn">
                        <i data-lucide="arrow-left"></i>
                        Back
                    </button>
                    <h1 class="full-page__title">${member?.name || ''}'s Routine</h1>
                    <div class="full-page__actions">
                        <button class="btn btn--sm btn--ghost" id="editRoutinesBtn">
                            <i data-lucide="settings"></i>
                        </button>
                    </div>
                </div>

                <div class="full-page__content">
                    <div class="toddler-routine-full-header">
                        <div class="toddler-routine-progress-bar">
                            <div class="toddler-routine-progress-bar__fill"
                                 style="width: ${totalCount > 0 ? (completedCount / totalCount * 100) : 0}%"></div>
                        </div>
                        <span class="toddler-routine-progress-text">
                            ${completedCount} of ${totalCount} complete
                        </span>
                        <button class="btn btn--sm btn--outline" id="resetAllBtn">
                            <i data-lucide="rotate-ccw"></i>
                            Reset
                        </button>
                    </div>

                    <div class="toddler-routine-full-grid">
                        ${routines.map(routine => {
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

        document.getElementById('editRoutinesBtn')?.addEventListener('click', () => {
            showEditRoutinesModal(memberId);
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

        return `
            <div class="manage-routines">
                <div class="manage-routines__list">
                    ${routines.map((routine) => `
                        <div class="manage-routine-item" data-routine-id="${routine.id}">
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
                                <div class="manage-routine-item__image-select">
                                    <span class="manage-routine-item__label">Image:</span>
                                    <select class="form-select" data-field="imageKey">
                                        ${imageOptions.map(opt => `
                                            <option value="${opt.key}" ${opt.key === routine.imageKey ? 'selected' : ''}>
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
                        <input type="text" class="form-input" id="newRoutineName" placeholder="Enter routine name (e.g., Potty Time)">
                        <div class="manage-routines__add-image">
                            <span class="manage-routine-item__label">Image:</span>
                            <select class="form-select" id="newRoutineImage">
                                ${imageOptions.map(opt => `
                                    <option value="${opt.key}">${opt.label}</option>
                                `).join('')}
                            </select>
                        </div>
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

        // Title/image changes (save on change)
        document.querySelectorAll('.manage-routine-item').forEach(item => {
            const routineId = item.dataset.routineId;
            const titleInput = item.querySelector('[data-field="title"]');
            const imageSelect = item.querySelector('[data-field="imageKey"]');

            const saveChanges = () => {
                const data = getWidgetData(memberId);
                const updatedRoutines = (data.routines || []).map(r => {
                    if (r.id === routineId) {
                        return {
                            ...r,
                            title: titleInput.value || r.title,
                            imageKey: imageSelect.value
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
            imageSelect?.addEventListener('change', () => {
                saveChanges();
                // Update preview image
                const img = item.querySelector('.manage-routine-item__image img');
                if (img) {
                    img.src = getImageSrc({ imageKey: imageSelect.value });
                }
            });
        });

        // Add new routine
        const addRoutine = () => {
            const nameInput = document.getElementById('newRoutineName');
            const imageSelect = document.getElementById('newRoutineImage');
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
