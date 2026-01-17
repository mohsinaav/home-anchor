/**
 * Kid Theme Utilities
 * Age-adaptive styling, icons, and text for kid widgets
 */

const KidTheme = (function() {

    // Age group definitions
    const AGE_GROUPS = {
        TODDLER: 'toddler',  // 0-4
        KID: 'kid',          // 5-8 (young kids)
        TWEEN: 'tween',      // 9-12 (older kids)
        TEEN: 'teen'         // 13+
    };

    // Widget color schemes
    const WIDGET_COLORS = {
        'points': {
            primary: '#F59E0B',
            gradient: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 50%, #FCD34D 100%)',
            light: '#FEF3C7',
            dark: '#D97706',
            emoji: '⭐'
        },
        'rewards': {
            primary: '#3B82F6',
            gradient: 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 50%, #93C5FD 100%)',
            light: '#DBEAFE',
            dark: '#1D4ED8',
            emoji: '🎁'
        },
        'achievements': {
            primary: '#8B5CF6',
            gradient: 'linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 50%, #C4B5FD 100%)',
            light: '#EDE9FE',
            dark: '#6D28D9',
            emoji: '🏆'
        },
        'kid-tasks': {
            primary: '#EAB308',
            gradient: 'linear-gradient(135deg, #FEF9C3 0%, #FEF08A 50%, #FDE047 100%)',
            light: '#FEF9C3',
            dark: '#CA8A04',
            emoji: '📝'
        },
        'kid-journal': {
            primary: '#6366F1',
            gradient: 'linear-gradient(135deg, #E0E7FF 0%, #C7D2FE 50%, #A5B4FC 100%)',
            light: '#E0E7FF',
            dark: '#4338CA',
            emoji: '📔'
        },
        'kid-workout': {
            primary: '#22C55E',
            gradient: 'linear-gradient(135deg, #DCFCE7 0%, #BBF7D0 50%, #86EFAC 100%)',
            light: '#DCFCE7',
            dark: '#15803D',
            emoji: '🏃'
        },
        'screen-time': {
            primary: '#06B6D4',
            gradient: 'linear-gradient(135deg, #CFFAFE 0%, #A5F3FC 50%, #67E8F9 100%)',
            light: '#CFFAFE',
            dark: '#0E7490',
            emoji: '📱'
        },
        'chores': {
            primary: '#10B981',
            gradient: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 50%, #6EE7B7 100%)',
            light: '#D1FAE5',
            dark: '#047857',
            emoji: '🧹'
        }
    };

    // Age-adaptive text content
    const TEXT_CONTENT = {
        // Points widget
        'points.title': {
            kid: '⭐ My Stars!',
            tween: '⭐ My Points',
            teen: 'Points'
        },
        'points.balance_label': {
            kid: 'stars',
            tween: 'points',
            teen: 'pts'
        },
        'points.empty': {
            kid: 'No stars yet! Complete activities to earn some! 🌟',
            tween: 'No points yet. Complete activities to start earning!',
            teen: 'No points earned yet.'
        },

        // Rewards widget
        'rewards.title': {
            kid: '🎁 My Rewards!',
            tween: '🎁 Rewards',
            teen: 'Rewards'
        },
        'rewards.redeem': {
            kid: 'Get it! 🎉',
            tween: 'Redeem',
            teen: 'Redeem'
        },
        'rewards.empty': {
            kid: 'No rewards yet! Ask a parent to add some fun prizes! 🎈',
            tween: 'No rewards available. Ask a parent to set some up!',
            teen: 'No rewards configured.'
        },

        // Achievements widget
        'achievements.title': {
            kid: '🏆 My Badges!',
            tween: '🏆 Achievements',
            teen: 'Achievements'
        },
        'achievements.earned': {
            kid: 'You got it! 🎊',
            tween: 'Earned!',
            teen: 'Unlocked'
        },
        'achievements.locked': {
            kid: 'Keep going! You can do it! 💪',
            tween: 'Keep working towards this!',
            teen: 'Not yet unlocked'
        },

        // Tasks widget
        'tasks.title': {
            kid: '📝 My Tasks!',
            tween: '📝 My Tasks',
            teen: 'Tasks'
        },
        'tasks.completed': {
            kid: 'Yay! Great job! 🎉',
            tween: 'Nice work! ✓',
            teen: 'Completed'
        },
        'tasks.empty': {
            kid: 'No tasks yet! Let\'s add some fun things to do! 🌈',
            tween: 'No tasks yet. Add one above!',
            teen: 'No tasks. Add your first task.'
        },
        'tasks.todo': {
            kid: '📋 Things To Do',
            tween: '📋 To Do',
            teen: 'To Do'
        },
        'tasks.done': {
            kid: '✅ All Done!',
            tween: '✅ Completed',
            teen: 'Completed'
        },

        // Screen Time widget
        'screentime.title': {
            kid: '📱 Screen Time',
            tween: '📱 Screen Time',
            teen: 'Screen Time'
        },
        'screentime.remaining': {
            kid: 'Time left to play!',
            tween: 'Time remaining',
            teen: 'Remaining'
        },

        // Chores widget
        'chores.title': {
            kid: '🧹 My Chores!',
            tween: '🧹 Chores',
            teen: 'Chores'
        },
        'chores.done': {
            kid: 'All done! You\'re a superstar! ⭐',
            tween: 'Great job finishing your chores!',
            teen: 'All chores completed'
        },

        // Common
        'common.back': {
            kid: 'Back',
            tween: 'Back',
            teen: 'Back'
        },
        'common.save': {
            kid: 'Save! ✨',
            tween: 'Save',
            teen: 'Save'
        },
        'common.cancel': {
            kid: 'Never mind',
            tween: 'Cancel',
            teen: 'Cancel'
        },
        'common.delete': {
            kid: 'Remove',
            tween: 'Delete',
            teen: 'Delete'
        },
        'common.add': {
            kid: 'Add! ➕',
            tween: 'Add',
            teen: 'Add'
        }
    };

    /**
     * Get age group from member type
     * @param {Object} member - Member object with type property
     * @returns {string} Age group key
     */
    function getAgeGroup(member) {
        if (!member) return AGE_GROUPS.KID;

        const type = member.type?.toLowerCase();

        if (type === 'toddler') return AGE_GROUPS.TODDLER;
        if (type === 'teen') return AGE_GROUPS.TEEN;

        // For 'kid' type, check age if available to determine kid vs tween
        if (member.age) {
            const age = parseInt(member.age);
            if (age <= 4) return AGE_GROUPS.TODDLER;
            if (age <= 8) return AGE_GROUPS.KID;
            if (age <= 12) return AGE_GROUPS.TWEEN;
            return AGE_GROUPS.TEEN;
        }

        // Default to kid for 'kid' type
        return AGE_GROUPS.KID;
    }

    /**
     * Get text content based on age group
     * @param {string} key - Text key (e.g., 'tasks.title')
     * @param {Object} member - Member object
     * @returns {string} Age-appropriate text
     */
    function getText(key, member) {
        const ageGroup = getAgeGroup(member);
        const content = TEXT_CONTENT[key];

        if (!content) return key; // Fallback to key if not found

        // Toddlers use kid text
        if (ageGroup === AGE_GROUPS.TODDLER) {
            return content.kid || content.tween || content.teen;
        }

        return content[ageGroup] || content.tween || content.kid || key;
    }

    /**
     * Get widget colors
     * @param {string} widgetId - Widget identifier
     * @returns {Object} Color scheme object
     */
    function getColors(widgetId) {
        return WIDGET_COLORS[widgetId] || WIDGET_COLORS['points'];
    }

    /**
     * Check if should use emoji icons (for young kids)
     * @param {Object} member - Member object
     * @returns {boolean}
     */
    function useEmojis(member) {
        const ageGroup = getAgeGroup(member);
        return ageGroup === AGE_GROUPS.KID || ageGroup === AGE_GROUPS.TODDLER;
    }

    /**
     * Check if should use playful animations
     * @param {Object} member - Member object
     * @returns {boolean}
     */
    function usePlayfulAnimations(member) {
        const ageGroup = getAgeGroup(member);
        return ageGroup === AGE_GROUPS.KID || ageGroup === AGE_GROUPS.TODDLER;
    }

    /**
     * Get icon - emoji for kids, lucide icon name for older
     * @param {string} emojiIcon - Emoji to use for kids
     * @param {string} lucideIcon - Lucide icon name for older users
     * @param {Object} member - Member object
     * @returns {string} HTML string for icon
     */
    function getIcon(emojiIcon, lucideIcon, member) {
        if (useEmojis(member)) {
            return `<span class="emoji-icon">${emojiIcon}</span>`;
        }
        return `<i data-lucide="${lucideIcon}"></i>`;
    }

    /**
     * Get celebration text for completing something
     * @param {Object} member - Member object
     * @returns {string}
     */
    function getCelebrationText(member) {
        const ageGroup = getAgeGroup(member);

        const celebrations = {
            kid: ['Yay! 🎉', 'Great job! ⭐', 'You did it! 🌟', 'Awesome! 🎊', 'Super! 💫'],
            tween: ['Nice work!', 'Great job!', 'Well done!', 'Awesome!'],
            teen: ['Done', 'Completed', 'Nice']
        };

        const group = ageGroup === AGE_GROUPS.TODDLER ? 'kid' : ageGroup;
        const options = celebrations[group] || celebrations.tween;
        return options[Math.floor(Math.random() * options.length)];
    }

    /**
     * Get CSS class for age-appropriate styling
     * @param {Object} member - Member object
     * @returns {string} CSS class suffix
     */
    function getAgeClass(member) {
        const ageGroup = getAgeGroup(member);
        return `age-${ageGroup}`;
    }

    /**
     * Render a standard kid widget hero section
     * @param {Object} options - Hero options
     * @returns {string} HTML string
     */
    function renderHero(options) {
        const {
            widgetId,
            member,
            title,
            subtitle,
            stats = [],
            backButton = true,
            backText = null
        } = options;

        const colors = getColors(widgetId);
        const ageGroup = getAgeGroup(member);
        const displayTitle = title || getText(`${widgetId}.title`, member);
        const back = backText || getText('common.back', member);

        return `
            <div class="kid-page__hero" style="background: ${colors.gradient}; --kid-hero-text: ${colors.dark}">
                ${backButton ? `
                    <button class="btn btn--ghost kid-page__back" id="backToMemberBtn">
                        <i data-lucide="arrow-left"></i>
                        ${back}
                    </button>
                ` : ''}
                <div class="kid-page__hero-content">
                    <h1 class="kid-page__hero-title ${ageGroup === 'kid' || ageGroup === 'toddler' ? 'kid-page__hero-title--playful' : ''}">
                        ${displayTitle}
                    </h1>
                    ${subtitle ? `<p class="kid-page__hero-subtitle">${subtitle}</p>` : ''}
                </div>
                ${stats.length > 0 ? `
                    <div class="kid-page__hero-stats">
                        ${stats.map(stat => `
                            <div class="kid-hero-stat">
                                <span class="kid-hero-stat__value">${stat.value}</span>
                                <span class="kid-hero-stat__label">${stat.label}</span>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Render standard tab navigation
     * @param {Array} tabs - Array of tab objects {id, label, icon}
     * @param {string} activeTab - Current active tab id
     * @param {Object} member - Member object
     * @returns {string} HTML string
     */
    function renderTabs(tabs, activeTab, member) {
        return `
            <div class="kid-page__tabs">
                ${tabs.map(tab => `
                    <button class="kid-page__tab ${tab.id === activeTab ? 'kid-page__tab--active' : ''}"
                            data-tab="${tab.id}">
                        ${useEmojis(member) && tab.emoji ?
                            `<span class="emoji-icon">${tab.emoji}</span>` :
                            `<i data-lucide="${tab.icon}"></i>`
                        }
                        ${tab.label}
                    </button>
                `).join('')}
            </div>
        `;
    }

    /**
     * Render empty state
     * @param {string} textKey - Text content key
     * @param {Object} member - Member object
     * @param {string} emoji - Emoji for empty state
     * @returns {string} HTML string
     */
    function renderEmptyState(textKey, member, emoji = '📭') {
        const text = getText(textKey, member);
        const ageGroup = getAgeGroup(member);

        return `
            <div class="kid-page__empty ${ageGroup === 'kid' ? 'kid-page__empty--playful' : ''}">
                <div class="kid-page__empty-icon">${emoji}</div>
                <p>${text}</p>
            </div>
        `;
    }

    // Public API
    return {
        AGE_GROUPS,
        WIDGET_COLORS,
        getAgeGroup,
        getText,
        getColors,
        useEmojis,
        usePlayfulAnimations,
        getIcon,
        getCelebrationText,
        getAgeClass,
        renderHero,
        renderTabs,
        renderEmptyState
    };
})();
