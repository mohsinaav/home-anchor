/**
 * Storage Module - Home Anchor v2.0
 * Handles all localStorage operations with new architecture
 * - Empty start (no default members)
 * - Dynamic widget system
 * - Avatar support (photo + initials)
 * - Schedule management
 */

const Storage = (function() {
    const STORAGE_KEY = 'homeAnchor_data';
    const VERSION = '2.0.0';

    // =========================================================================
    // WIDGET REGISTRY - Available widgets per member type
    // =========================================================================

    const WIDGET_REGISTRY = {
        adult: [
            { id: 'meal-plan', name: 'Meal Plan', description: 'Weekly meal planning', icon: 'utensils', default: true },
            { id: 'task-list', name: 'Task List', description: 'Personal to-do list', icon: 'check-square', default: true },
            { id: 'workout', name: 'Workout', description: 'Exercise tracker', icon: 'dumbbell', default: true },
            { id: 'gratitude', name: 'Gratitude', description: 'Daily gratitude journal', icon: 'heart', default: false },
            { id: 'habits', name: 'Habits', description: 'Habit tracker', icon: 'repeat', default: false },
            { id: 'recipes', name: 'Recipes', description: 'Recipe collection', icon: 'book-open', default: false },
            { id: 'grocery', name: 'Grocery', description: 'Shopping list', icon: 'shopping-cart', default: false },
            { id: 'routine', name: 'Reminders', description: 'Recurring reminders and tasks', icon: 'bell', default: false },
            { id: 'vision-board', name: 'Vision Board', description: 'Track your goals and dreams', icon: 'target', default: false },
            { id: 'journal', name: 'Journal', description: 'Private daily journal with mood tracking', icon: 'notebook-pen', default: false },
            { id: 'circuit-timer', name: 'Circuit Timer', description: 'Interval workout timer', icon: 'timer', default: false }
        ],
        kid: [
            { id: 'points', name: 'Points', description: 'Earn points for activities', icon: 'star', default: true },
            { id: 'rewards', name: 'Rewards', description: 'Redeem points for rewards', icon: 'gift', default: true },
            { id: 'achievements', name: 'Achievements', description: 'Badges and milestones', icon: 'award', default: true },
            { id: 'kid-tasks', name: 'My Tasks', description: 'Fun task list for kids', icon: 'check-square', default: false },
            { id: 'kid-workout', name: 'Move & Play', description: 'Fun workout activities for kids', icon: 'heart-pulse', default: false },
            { id: 'chores', name: 'Chores', description: 'Chore picker/assigner', icon: 'list-checks', default: false },
            { id: 'accomplishments', name: 'Accomplishments', description: 'Extra achievements log', icon: 'trophy', default: false },
            { id: 'screen-time', name: 'Screen Time', description: 'Screen time tracker', icon: 'tv', default: false },
            { id: 'vision-board', name: 'Dreams', description: 'Track your dreams and goals', icon: 'sparkles', default: false },
            { id: 'kid-journal', name: 'My Journal', description: 'Write and reflect on your day', icon: 'book-open', default: false }
        ],
        toddler: [
            { id: 'toddler-routine', name: 'My Routine', description: 'Visual daily routine checklist', icon: 'image', default: true },
            { id: 'activities', name: 'Activities', description: 'Engagement activity ideas', icon: 'blocks', default: true },
            { id: 'daily-log', name: 'Daily Log', description: 'Track activities done today', icon: 'calendar-check', default: true },
            { id: 'toddler-tasks', name: 'My To-Dos', description: 'Simple visual task list', icon: 'check-circle', default: false },
            { id: 'milestones', name: 'Milestones', description: 'Developmental milestones', icon: 'baby', default: false }
        ]
    };

    // Avatar colors for initials fallback
    const AVATAR_COLORS = [
        '#6366F1', // Indigo
        '#8B5CF6', // Violet
        '#EC4899', // Pink
        '#EF4444', // Red
        '#F59E0B', // Amber
        '#10B981', // Emerald
        '#14B8A6', // Teal
        '#3B82F6', // Blue
        '#6B7280'  // Gray
    ];

    // =========================================================================
    // DEFAULT DATA STRUCTURE - Empty start
    // =========================================================================

    const getDefaultData = () => ({
        meta: {
            version: VERSION,
            createdAt: new Date().toISOString().split('T')[0],
            lastModified: new Date().toISOString()
        },
        settings: {
            adminPin: '1234',
            theme: 'light',
            notifications: {
                enabled: false,
                sound: false
            },
            meals: {
                kidsMenuEnabled: true
            },
            onboarding: {
                welcomeTourComplete: false,
                toursCompleted: [],
                lastTourDate: null,
                skipAllTours: false
            }
        },
        // Only Home tab by default - no members
        tabs: [
            {
                id: 'home',
                name: 'Home',
                type: 'home',
                icon: 'home',
                removable: false
            }
        ],
        // Members (dynamically added by user)
        members: [],
        // Calendar events (shared across family)
        calendar: {
            events: []
        },
        // Schedules per member
        schedules: {},
        // Widget data per member
        widgetData: {}
    });

    // =========================================================================
    // INITIALIZATION
    // =========================================================================

    function init() {
        const existing = localStorage.getItem(STORAGE_KEY);
        if (!existing) {
            const defaultData = getDefaultData();
            localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
            return defaultData;
        }

        // Handle version migration if needed
        const data = JSON.parse(existing);
        if (data.meta?.version !== VERSION) {
            return migrateData(data);
        }

        // Fix duplicate colors for existing members
        fixDuplicateMemberColors(data);

        return data;
    }

    /**
     * Fix duplicate avatar colors for existing members
     */
    function fixDuplicateMemberColors(data) {
        if (!data.members || data.members.length === 0) return;

        const usedColors = [];
        let needsSave = false;

        data.members.forEach(member => {
            const currentColor = member.avatar?.color;

            // If color is already used or missing, assign a new unique one
            if (!currentColor || usedColors.includes(currentColor)) {
                const newColor = AVATAR_COLORS.find(c => !usedColors.includes(c)) ||
                                 AVATAR_COLORS[usedColors.length % AVATAR_COLORS.length];

                if (!member.avatar) {
                    member.avatar = {
                        type: 'initials',
                        initials: generateInitials(member.name),
                        color: newColor
                    };
                } else {
                    member.avatar.color = newColor;
                }
                usedColors.push(newColor);
                needsSave = true;
            } else {
                usedColors.push(currentColor);
            }
        });

        if (needsSave) {
            saveAll(data);
            console.log('Fixed duplicate member colors');
        }
    }

    function migrateData(oldData) {
        // Migration from v1 to v2
        console.log('Migrating data from', oldData.meta?.version, 'to', VERSION);

        const newData = getDefaultData();

        // Preserve calendar events if they exist
        if (oldData.calendar?.events) {
            newData.calendar.events = oldData.calendar.events;
        }

        // Preserve settings (merge with new defaults)
        if (oldData.settings) {
            newData.settings = {
                ...newData.settings,
                adminPin: oldData.settings.adminPin || '1234',
                theme: oldData.settings.theme || 'light'
            };
        }

        // Note: Old tabs/members format is different, so we start fresh
        // User will need to re-add members

        saveAll(newData);
        return newData;
    }

    // =========================================================================
    // CORE CRUD OPERATIONS
    // =========================================================================

    function getAll() {
        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) {
            return init();
        }
        return JSON.parse(data);
    }

    function saveAll(data) {
        data.meta.lastModified = new Date().toISOString();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

        // Emit save event for save indicator
        if (typeof State !== 'undefined') {
            State.emit('dataSaved', data.meta.lastModified);
        }
    }

    function get(section) {
        const data = getAll();
        return data[section];
    }

    function update(section, value) {
        const data = getAll();
        data[section] = value;
        saveAll(data);
        return data;
    }

    // =========================================================================
    // SETTINGS
    // =========================================================================

    function getSettings() {
        return get('settings');
    }

    function updateSettings(newSettings) {
        const settings = getSettings();
        const updated = { ...settings, ...newSettings };
        return update('settings', updated);
    }

    // =========================================================================
    // TABS (Home tab + member tabs combined)
    // =========================================================================

    function getTabs() {
        const data = getAll();
        // Combine home tab with member tabs
        const homeTab = data.tabs.find(t => t.id === 'home');
        const memberTabs = data.members.map(m => ({
            id: m.id,
            name: m.name,
            type: m.type,
            avatar: m.avatar,
            removable: true
        }));
        return [homeTab, ...memberTabs];
    }

    function getTab(tabId) {
        if (tabId === 'home') {
            const data = getAll();
            return data.tabs.find(t => t.id === 'home');
        }
        return getMember(tabId);
    }

    // =========================================================================
    // MEMBERS
    // =========================================================================

    function getMembers() {
        return get('members') || [];
    }

    function getMember(memberId) {
        const members = getMembers();
        return members.find(m => m.id === memberId);
    }

    function addMember(memberData, photoUrl = null) {
        const members = getMembers();

        // Generate initials from name
        const initials = generateInitials(memberData.name);

        // Pick unique color - avoid colors already used by other members
        const color = memberData.avatar?.color || getUniqueColorForMember(members);

        // Get default widgets for member type
        const defaultWidgets = getDefaultWidgets(memberData.type);

        // Determine avatar type and photo URL
        const hasPhoto = photoUrl || memberData.avatar?.photoUrl;

        const newMember = {
            id: `member-${Date.now()}`,
            name: memberData.name,
            type: memberData.type, // 'adult', 'kid', 'toddler'
            avatar: {
                type: hasPhoto ? 'photo' : 'initials',
                photoUrl: photoUrl || memberData.avatar?.photoUrl || null,
                initials: initials,
                color: color
            },
            widgets: memberData.widgets || defaultWidgets,
            createdAt: new Date().toISOString().split('T')[0],
            ...(memberData.type === 'kid' && { age: memberData.age || 8 })
        };

        members.push(newMember);
        update('members', members);

        // Initialize empty widget data for this member
        initializeWidgetData(newMember.id, newMember.widgets);

        // Initialize empty schedule for this member
        initializeSchedule(newMember.id);

        return newMember;
    }

    function getUniqueColorForMember(existingMembers) {
        // Get colors already in use
        const usedColors = existingMembers
            .map(m => m.avatar?.color)
            .filter(Boolean);

        // Find first unused color
        const availableColor = AVATAR_COLORS.find(color => !usedColors.includes(color));

        // If all colors used, cycle through based on member count
        return availableColor || AVATAR_COLORS[existingMembers.length % AVATAR_COLORS.length];
    }

    function updateMember(memberId, updates) {
        const members = getMembers();
        const index = members.findIndex(m => m.id === memberId);

        if (index !== -1) {
            // Update initials if name changed
            if (updates.name && updates.name !== members[index].name) {
                if (!updates.avatar) {
                    updates.avatar = { ...members[index].avatar };
                }
                updates.avatar.initials = generateInitials(updates.name);
            }

            members[index] = { ...members[index], ...updates };
            update('members', members);
            return members[index];
        }
        return null;
    }

    function deleteMember(memberId) {
        const data = getAll();

        // Remove member
        data.members = data.members.filter(m => m.id !== memberId);

        // Remove their widget data
        delete data.widgetData[memberId];

        // Remove their schedule
        delete data.schedules[memberId];

        // Remove their calendar events
        data.calendar.events = data.calendar.events.filter(e => e.memberId !== memberId);

        saveAll(data);
        return data.members;
    }

    // =========================================================================
    // WIDGET REGISTRY HELPERS
    // =========================================================================

    function getWidgetRegistry(memberType) {
        return WIDGET_REGISTRY[memberType] || [];
    }

    function getDefaultWidgets(memberType) {
        const registry = WIDGET_REGISTRY[memberType] || [];
        return registry.filter(w => w.default).map(w => w.id);
    }

    function getAvailableWidgets(memberType) {
        return WIDGET_REGISTRY[memberType] || [];
    }

    function addWidgetToMember(memberId, widgetId) {
        const member = getMember(memberId);
        if (!member) return null;

        if (!member.widgets.includes(widgetId)) {
            member.widgets.push(widgetId);
            updateMember(memberId, { widgets: member.widgets });

            // Initialize widget data if needed
            initializeWidgetData(memberId, [widgetId]);
        }

        return member;
    }

    function removeWidgetFromMember(memberId, widgetId) {
        const member = getMember(memberId);
        if (!member) return null;

        member.widgets = member.widgets.filter(w => w !== widgetId);
        updateMember(memberId, { widgets: member.widgets });

        return member;
    }

    // =========================================================================
    // WIDGET DATA
    // =========================================================================

    function initializeWidgetData(memberId, widgets) {
        const data = getAll();

        if (!data.widgetData[memberId]) {
            data.widgetData[memberId] = {};
        }

        widgets.forEach(widgetId => {
            if (!data.widgetData[memberId][widgetId]) {
                data.widgetData[memberId][widgetId] = getEmptyWidgetData(widgetId);
            }
        });

        saveAll(data);
    }

    function getEmptyWidgetData(widgetId) {
        const templates = {
            'meal-plan': { recipes: [], weeklyPlans: {}, groceryLists: {} },
            'task-list': { tasks: [] },
            'workout': { routines: [], log: {} },
            'gratitude': { entries: [] },
            'habits': { habits: [], log: {} },
            'recipes': { recipes: [], tags: [] },
            'grocery': { items: [] },
            'routine': { blocks: [] },
            'points': { balance: 0, activities: [], dailyLog: {} },
            'rewards': { rewards: [], redemptionHistory: [] },
            'achievements': { badges: [], unlocked: [] },
            'chores': { chores: [], assignments: {} },
            'accomplishments': { entries: [] },
            'screen-time': { limits: {}, log: {} },
            'activities': { suggestions: [], custom: [], log: {} },
            'daily-log': { entries: {} },
            'milestones': { milestones: [], achieved: [] },
            'vision-board': { goals: [] },
            'journal': { entries: [], settings: { showPrompts: true } },
            'kid-workout': { activities: null, log: [], settings: { weeklyGoal: 5, showPoints: true } },
            'circuit-timer': { presets: [], history: [] }
        };

        return templates[widgetId] || {};
    }

    function getWidgetData(memberId, widgetId) {
        const data = getAll();
        return data.widgetData[memberId]?.[widgetId] || getEmptyWidgetData(widgetId);
    }

    function updateWidgetData(memberId, widgetId, widgetData) {
        const data = getAll();

        if (!data.widgetData[memberId]) {
            data.widgetData[memberId] = {};
        }

        data.widgetData[memberId][widgetId] = widgetData;
        saveAll(data);

        return widgetData;
    }

    // =========================================================================
    // SCHEDULES
    // =========================================================================

    function initializeSchedule(memberId) {
        const data = getAll();

        if (!data.schedules[memberId]) {
            data.schedules[memberId] = {
                'default': [] // Default schedule for all days
            };
        }

        saveAll(data);
    }

    function getSchedule(memberId, dayOfWeek = null) {
        const data = getAll();
        const memberSchedule = data.schedules[memberId] || { 'default': [] };

        if (dayOfWeek !== null) {
            // Return day-specific schedule or fall back to default
            return memberSchedule[dayOfWeek.toString()] || memberSchedule['default'] || [];
        }

        return memberSchedule;
    }

    function getScheduleForToday(memberId) {
        const dayOfWeek = new Date().getDay();
        return getSchedule(memberId, dayOfWeek);
    }

    // Alias for compatibility
    function getMemberScheduleForToday(memberId) {
        return getScheduleForToday(memberId);
    }

    function addScheduleBlock(memberId, dayKey = 'default', block) {
        const data = getAll();

        if (!data.schedules[memberId]) {
            data.schedules[memberId] = { 'default': [] };
        }

        if (!data.schedules[memberId][dayKey]) {
            data.schedules[memberId][dayKey] = [];
        }

        const newBlock = {
            id: `sch-${Date.now()}`,
            ...block
        };

        data.schedules[memberId][dayKey].push(newBlock);

        // Sort by start time
        data.schedules[memberId][dayKey].sort((a, b) => a.start.localeCompare(b.start));

        saveAll(data);
        return newBlock;
    }

    function updateScheduleBlock(memberId, dayKey = 'default', blockId, updates) {
        const data = getAll();

        if (!data.schedules[memberId]?.[dayKey]) return null;

        const index = data.schedules[memberId][dayKey].findIndex(b => b.id === blockId);
        if (index !== -1) {
            data.schedules[memberId][dayKey][index] = {
                ...data.schedules[memberId][dayKey][index],
                ...updates
            };

            // Re-sort if times changed
            data.schedules[memberId][dayKey].sort((a, b) => a.start.localeCompare(b.start));

            saveAll(data);
            return data.schedules[memberId][dayKey][index];
        }

        return null;
    }

    function deleteScheduleBlock(memberId, dayKey = 'default', blockId) {
        const data = getAll();

        if (!data.schedules[memberId]?.[dayKey]) return;

        data.schedules[memberId][dayKey] = data.schedules[memberId][dayKey].filter(
            b => b.id !== blockId
        );

        saveAll(data);
    }

    function getCurrentActivity(memberId) {
        const schedule = getScheduleForToday(memberId);
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        return schedule.find(block =>
            currentTime >= block.start && currentTime < block.end
        ) || null;
    }

    function getUpcomingActivities(memberId, limit = 5) {
        const schedule = getScheduleForToday(memberId);
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        return schedule
            .filter(block => block.start > currentTime)
            .slice(0, limit);
    }

    // =========================================================================
    // CALENDAR EVENTS
    // =========================================================================

    function getCalendarEvents() {
        const data = getAll();
        return data.calendar?.events || [];
    }

    function getCalendarEventsForDate(date) {
        const events = getCalendarEvents();
        const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
        return events.filter(e => e.date === dateStr);
    }

    function getCalendarEventsForToday() {
        return getCalendarEventsForDate(new Date());
    }

    function addCalendarEvent(event) {
        const data = getAll();

        const newEvent = {
            id: `evt-${Date.now()}`,
            ...event
        };

        data.calendar.events.push(newEvent);
        saveAll(data);

        return newEvent;
    }

    function updateCalendarEvent(eventId, updates) {
        const data = getAll();
        const index = data.calendar.events.findIndex(e => e.id === eventId);

        if (index !== -1) {
            data.calendar.events[index] = { ...data.calendar.events[index], ...updates };
            saveAll(data);
            return data.calendar.events[index];
        }

        return null;
    }

    function deleteCalendarEvent(eventId) {
        const data = getAll();
        data.calendar.events = data.calendar.events.filter(e => e.id !== eventId);
        saveAll(data);
    }

    // =========================================================================
    // AVATAR HELPERS
    // =========================================================================

    function generateInitials(name) {
        if (!name) return '??';

        const words = name.trim().split(/\s+/);
        if (words.length === 1) {
            return words[0].substring(0, 2).toUpperCase();
        }

        return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }

    function getRandomAvatarColor() {
        return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
    }

    // =========================================================================
    // POINTS SYSTEM SHORTCUTS (for kid widgets)
    // =========================================================================

    function getPointSystem(memberId) {
        const pointsData = getWidgetData(memberId, 'points');
        const rewardsData = getWidgetData(memberId, 'rewards');

        return {
            balance: pointsData.balance || 0,
            activities: pointsData.activities || [],
            dailyLog: pointsData.dailyLog || {},
            rewards: rewardsData.rewards || [],
            redemptionHistory: rewardsData.redemptionHistory || []
        };
    }

    function updatePointSystem(memberId, data) {
        if (data.balance !== undefined || data.activities || data.dailyLog) {
            const pointsData = getWidgetData(memberId, 'points');
            if (data.balance !== undefined) pointsData.balance = data.balance;
            if (data.activities) pointsData.activities = data.activities;
            if (data.dailyLog) pointsData.dailyLog = data.dailyLog;
            updateWidgetData(memberId, 'points', pointsData);
        }
        if (data.rewards || data.redemptionHistory) {
            const rewardsData = getWidgetData(memberId, 'rewards');
            if (data.rewards) rewardsData.rewards = data.rewards;
            if (data.redemptionHistory) rewardsData.redemptionHistory = data.redemptionHistory;
            updateWidgetData(memberId, 'rewards', rewardsData);
        }
    }

    function addActivity(memberId, activity) {
        const pointsData = getWidgetData(memberId, 'points');
        const newActivity = {
            id: `act-${Date.now()}`,
            ...activity
        };
        pointsData.activities.push(newActivity);
        updateWidgetData(memberId, 'points', pointsData);
        return newActivity;
    }

    function deleteActivity(memberId, activityId) {
        const pointsData = getWidgetData(memberId, 'points');
        pointsData.activities = pointsData.activities.filter(a => a.id !== activityId);
        updateWidgetData(memberId, 'points', pointsData);
        return pointsData.activities;
    }

    function addReward(memberId, reward) {
        const rewardsData = getWidgetData(memberId, 'rewards');
        const newReward = {
            id: `rwd-${Date.now()}`,
            ...reward
        };
        rewardsData.rewards.push(newReward);
        updateWidgetData(memberId, 'rewards', rewardsData);
        return newReward;
    }

    function deleteReward(memberId, rewardId) {
        const rewardsData = getWidgetData(memberId, 'rewards');
        rewardsData.rewards = rewardsData.rewards.filter(r => r.id !== rewardId);
        updateWidgetData(memberId, 'rewards', rewardsData);
        return rewardsData.rewards;
    }

    function logActivity(memberId, activityId, date) {
        const pointsData = getWidgetData(memberId, 'points');
        const activity = pointsData.activities.find(a => a.id === activityId);

        if (!activity) return null;

        const dateKey = date || new Date().toISOString().split('T')[0];

        if (!pointsData.dailyLog[dateKey]) {
            pointsData.dailyLog[dateKey] = { completed: [], pointsEarned: 0 };
        }

        if (!pointsData.dailyLog[dateKey].completed.includes(activityId)) {
            pointsData.dailyLog[dateKey].completed.push(activityId);
            pointsData.dailyLog[dateKey].pointsEarned += activity.points;
            pointsData.balance += activity.points;
        }

        updateWidgetData(memberId, 'points', pointsData);
        return pointsData;
    }

    function unlogActivity(memberId, activityId, date) {
        const pointsData = getWidgetData(memberId, 'points');
        const activity = pointsData.activities.find(a => a.id === activityId);

        if (!activity) return null;

        const dateKey = date || new Date().toISOString().split('T')[0];

        if (pointsData.dailyLog[dateKey]?.completed.includes(activityId)) {
            pointsData.dailyLog[dateKey].completed = pointsData.dailyLog[dateKey].completed.filter(id => id !== activityId);
            pointsData.dailyLog[dateKey].pointsEarned -= activity.points;
            pointsData.balance -= activity.points;
        }

        updateWidgetData(memberId, 'points', pointsData);
        return pointsData;
    }

    function redeemReward(memberId, rewardId) {
        const pointsData = getWidgetData(memberId, 'points');
        const rewardsData = getWidgetData(memberId, 'rewards');

        const reward = rewardsData.rewards.find(r => r.id === rewardId);

        if (!reward || pointsData.balance < reward.cost) {
            return null;
        }

        pointsData.balance -= reward.cost;
        rewardsData.redemptionHistory.push({
            date: new Date().toISOString(),
            rewardId: rewardId,
            rewardName: reward.name,
            cost: reward.cost
        });

        updateWidgetData(memberId, 'points', pointsData);
        updateWidgetData(memberId, 'rewards', rewardsData);

        return pointsData;
    }

    // =========================================================================
    // EXPORT / IMPORT / RESET
    // =========================================================================

    function exportData() {
        return JSON.stringify(getAll(), null, 2);
    }

    function importData(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            if (data.meta) {
                saveAll(data);
                return true;
            }
            return false;
        } catch (e) {
            console.error('Import failed:', e);
            return false;
        }
    }

    function reset() {
        localStorage.removeItem(STORAGE_KEY);
        return init();
    }

    function getLastModified() {
        const data = getAll();
        return data.meta?.lastModified || null;
    }

    // =========================================================================
    // DEMO DATA
    // =========================================================================

    /**
     * Load demo data for the landing page "Try Demo" feature
     * Creates a sample family with realistic data
     */
    function loadDemoData() {
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0];

        const demoData = {
            meta: {
                version: '1.0',
                createdAt: new Date().toISOString(),
                lastModified: new Date().toISOString()
            },
            settings: {
                adminPin: '1234',
                theme: 'light',
                notifications: {
                    enabled: false,
                    sound: false
                },
                onboarding: {
                    welcomeTourComplete: false,
                    toursCompleted: [],
                    lastTourDate: null,
                    skipAllTours: false
                }
            },
            tabs: [
                { id: 'home', name: 'Home', type: 'home', icon: 'home', removable: false },
                { id: 'demo-mom', name: 'Mom', type: 'adult', icon: 'user', removable: true },
                { id: 'demo-dad', name: 'Dad', type: 'adult', icon: 'user', removable: true },
                { id: 'demo-alex', name: 'Alex', type: 'kid', icon: 'smile', removable: true },
                { id: 'demo-emma', name: 'Emma', type: 'toddler', icon: 'baby', removable: true }
            ],
            members: [
                {
                    id: 'demo-mom',
                    name: 'Mom',
                    type: 'adult',
                    avatar: { type: 'initials', value: 'M', color: '#8B5CF6' },
                    widgets: ['tasks', 'meals', 'workout', 'habits', 'gratitude', 'recipes'],
                    createdAt: new Date().toISOString()
                },
                {
                    id: 'demo-dad',
                    name: 'Dad',
                    type: 'adult',
                    avatar: { type: 'initials', value: 'D', color: '#3B82F6' },
                    widgets: ['tasks', 'meals', 'workout', 'journal', 'habits'],
                    createdAt: new Date().toISOString()
                },
                {
                    id: 'demo-alex',
                    name: 'Alex',
                    type: 'kid',
                    age: 8,
                    avatar: { type: 'initials', value: 'A', color: '#F59E0B' },
                    widgets: ['points', 'rewards', 'achievements', 'chores', 'kid-workout'],
                    createdAt: new Date().toISOString()
                },
                {
                    id: 'demo-emma',
                    name: 'Emma',
                    type: 'toddler',
                    age: 2,
                    avatar: { type: 'initials', value: 'E', color: '#EC4899' },
                    widgets: ['toddler-routine', 'activities', 'daily-log', 'milestones'],
                    createdAt: new Date().toISOString()
                }
            ],
            calendar: {
                events: [
                    {
                        id: 'evt-1',
                        title: 'Soccer Practice',
                        date: today,
                        memberId: 'demo-alex',
                        icon: 'dribbble',
                        color: '#10B981'
                    },
                    {
                        id: 'evt-2',
                        title: 'Pediatrician Visit',
                        date: today,
                        memberId: 'demo-emma',
                        icon: 'stethoscope',
                        color: '#3B82F6'
                    },
                    {
                        id: 'evt-3',
                        title: 'Family Movie Night',
                        date: today,
                        memberId: null,
                        icon: 'film',
                        color: '#8B5CF6'
                    }
                ]
            },
            schedules: {
                'demo-alex': {
                    default: [
                        { id: 's1', time: '07:00', activity: 'Wake Up', icon: 'sun', color: '#F59E0B' },
                        { id: 's2', time: '07:30', activity: 'Breakfast', icon: 'utensils', color: '#10B981' },
                        { id: 's3', time: '08:00', activity: 'School', icon: 'book', color: '#3B82F6' },
                        { id: 's4', time: '15:00', activity: 'Homework', icon: 'edit', color: '#8B5CF6' },
                        { id: 's5', time: '16:00', activity: 'Play Time', icon: 'gamepad-2', color: '#EC4899' },
                        { id: 's6', time: '19:00', activity: 'Dinner', icon: 'utensils', color: '#10B981' },
                        { id: 's7', time: '20:00', activity: 'Bedtime', icon: 'moon', color: '#6366F1' }
                    ]
                },
                'demo-emma': {
                    default: [
                        { id: 's1', time: '07:00', activity: 'Wake Up', icon: 'sun', color: '#F59E0B' },
                        { id: 's2', time: '07:30', activity: 'Breakfast', icon: 'utensils', color: '#10B981' },
                        { id: 's3', time: '09:00', activity: 'Play Time', icon: 'puzzle', color: '#EC4899' },
                        { id: 's4', time: '12:00', activity: 'Lunch', icon: 'utensils', color: '#10B981' },
                        { id: 's5', time: '13:00', activity: 'Nap Time', icon: 'moon', color: '#6366F1' },
                        { id: 's6', time: '15:00', activity: 'Snack', icon: 'apple', color: '#EF4444' },
                        { id: 's7', time: '18:00', activity: 'Dinner', icon: 'utensils', color: '#10B981' },
                        { id: 's8', time: '19:00', activity: 'Bedtime', icon: 'moon', color: '#6366F1' }
                    ]
                }
            },
            widgetData: {
                // Alex's Points Widget
                'demo-alex_points': {
                    balance: 150,
                    dailyGoal: 25,
                    dailyGoalEnabled: true,
                    activities: [
                        { id: 'a1', name: 'Brush Teeth', points: 5, icon: 'sparkles', category: 'hygiene', maxPerDay: 2 },
                        { id: 'a2', name: 'Make Bed', points: 5, icon: 'bed', category: 'chores', maxPerDay: 1 },
                        { id: 'a3', name: 'Do Homework', points: 10, icon: 'book', category: 'school', maxPerDay: 1 },
                        { id: 'a4', name: 'Help with Dishes', points: 8, icon: 'utensils', category: 'chores', maxPerDay: 2 },
                        { id: 'a5', name: 'Read for 20 min', points: 10, icon: 'book-open', category: 'school', maxPerDay: 1 },
                        { id: 'a6', name: 'Be Kind', points: 5, icon: 'heart', category: 'kindness', maxPerDay: 3 },
                        { id: 'a7', name: 'Exercise', points: 10, icon: 'dumbbell', category: 'health', maxPerDay: 1 },
                        { id: 'a8', name: 'Clean Room', points: 15, icon: 'home', category: 'chores', maxPerDay: 1 }
                    ],
                    history: [
                        { id: 'h1', date: today, activityId: 'a1', activityName: 'Brush Teeth', points: 5, type: 'earned', time: '07:30' },
                        { id: 'h2', date: today, activityId: 'a2', activityName: 'Make Bed', points: 5, type: 'earned', time: '07:45' },
                        { id: 'h3', date: yesterday, activityId: 'a1', activityName: 'Brush Teeth', points: 5, type: 'earned', time: '07:30' },
                        { id: 'h4', date: yesterday, activityId: 'a3', activityName: 'Do Homework', points: 10, type: 'earned', time: '16:00' },
                        { id: 'h5', date: yesterday, activityId: 'a5', activityName: 'Read for 20 min', points: 10, type: 'earned', time: '19:00' },
                        { id: 'h6', date: twoDaysAgo, activityId: 'a1', activityName: 'Brush Teeth', points: 5, type: 'earned', time: '07:30' },
                        { id: 'h7', date: twoDaysAgo, activityId: 'a2', activityName: 'Make Bed', points: 5, type: 'earned', time: '07:45' },
                        { id: 'h8', date: twoDaysAgo, activityId: 'a6', activityName: 'Be Kind', points: 5, type: 'earned', time: '14:00' }
                    ],
                    settings: {
                        fontSize: 'normal',
                        reducedMotion: false,
                        categoryFilter: 'all'
                    }
                },
                // Alex's Rewards Widget
                'demo-alex_rewards': {
                    rewards: [
                        { id: 'r1', name: '30 min Screen Time', cost: 20, icon: 'tv', color: '#3B82F6' },
                        { id: 'r2', name: 'Choose Dinner', cost: 30, icon: 'utensils', color: '#10B981' },
                        { id: 'r3', name: 'Stay Up Late', cost: 40, icon: 'moon', color: '#8B5CF6' },
                        { id: 'r4', name: 'Movie Night Pick', cost: 50, icon: 'film', color: '#F59E0B' },
                        { id: 'r5', name: 'New Book', cost: 75, icon: 'book', color: '#EC4899' },
                        { id: 'r6', name: 'Special Outing', cost: 100, icon: 'map-pin', color: '#EF4444' }
                    ],
                    history: [],
                    wishlist: ['r4', 'r6']
                },
                // Alex's Achievements Widget
                'demo-alex_achievements': {
                    unlocked: ['first-points', 'streak-3'],
                    achievements: [
                        { id: 'first-points', name: 'First Points!', description: 'Earned your first points', icon: 'star', category: 'points', unlockedAt: twoDaysAgo },
                        { id: 'streak-3', name: '3 Day Streak', description: 'Completed activities 3 days in a row', icon: 'flame', category: 'streak', unlockedAt: today }
                    ]
                },
                // Mom's Tasks Widget
                'demo-mom_tasks': {
                    tasks: [
                        { id: 't1', text: 'Grocery shopping', completed: false, priority: 'high' },
                        { id: 't2', text: 'Schedule doctor appointment', completed: true, priority: 'medium' },
                        { id: 't3', text: 'Meal prep for the week', completed: false, priority: 'medium' },
                        { id: 't4', text: 'Pay bills', completed: true, priority: 'high' }
                    ]
                },
                // Mom's Habits Widget
                'demo-mom_habits': {
                    habits: [
                        { id: 'h1', name: 'Exercise', icon: 'dumbbell', streak: 5, completedDates: [today, yesterday, twoDaysAgo] },
                        { id: 'h2', name: 'Read', icon: 'book', streak: 3, completedDates: [today, yesterday] },
                        { id: 'h3', name: 'Meditate', icon: 'brain', streak: 2, completedDates: [today] },
                        { id: 'h4', name: 'Drink Water', icon: 'droplet', streak: 7, completedDates: [today, yesterday, twoDaysAgo] }
                    ]
                }
            }
        };

        saveAll(demoData);
        return demoData;
    }

    /**
     * Check if app is in demo mode
     */
    function isDemoMode() {
        return localStorage.getItem('homeAnchor_demo') === 'true';
    }

    /**
     * Exit demo mode and optionally clear data
     */
    function exitDemoMode(keepData = false) {
        localStorage.removeItem('homeAnchor_demo');
        if (!keepData) {
            reset();
        }
    }

    // =========================================================================
    // PUBLIC API
    // =========================================================================

    return {
        // Core
        init,
        getAll,
        saveAll,
        get,
        update,
        getLastModified,

        // Settings
        getSettings,
        updateSettings,

        // Tabs (combined view)
        getTabs,
        getTab,

        // Members
        getMembers,
        getMember,
        addMember,
        updateMember,
        deleteMember,

        // Widget Registry
        getWidgetRegistry,
        getDefaultWidgets,
        getAvailableWidgets,
        addWidgetToMember,
        removeWidgetFromMember,
        WIDGET_REGISTRY,

        // Widget Data
        getWidgetData,
        updateWidgetData,
        setWidgetData: updateWidgetData, // Alias for backward compatibility

        // Schedules
        getSchedule,
        getScheduleForToday,
        getMemberScheduleForToday,
        addScheduleBlock,
        updateScheduleBlock,
        deleteScheduleBlock,
        getCurrentActivity,
        getUpcomingActivities,

        // Calendar
        getCalendarEvents,
        getCalendarEventsForDate,
        getCalendarEventsForToday,
        addCalendarEvent,
        updateCalendarEvent,
        deleteCalendarEvent,

        // Avatar helpers
        generateInitials,
        getRandomAvatarColor,
        AVATAR_COLORS,

        // Points shortcuts (backward compatibility)
        getPointSystem,
        updatePointSystem,
        addActivity,
        deleteActivity,
        addReward,
        deleteReward,
        logActivity,
        unlogActivity,
        redeemReward,

        // Export/Import
        exportData,
        importData,
        reset,

        // Demo Mode
        loadDemoData,
        isDemoMode,
        exitDemoMode
    };
})();
