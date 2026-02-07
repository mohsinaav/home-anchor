/**
 * Family Dashboard Feature
 * Admin page with statistics, activity feed, shared calendar overview, and family challenges
 */

const FamilyDashboard = (function() {
    const PAGE_ID = 'family-dashboard';

    /**
     * Render the family dashboard page
     */
    function render(container) {
        const members = Storage.getMembers();
        const stats = calculateFamilyStats(members);

        container.innerHTML = `
            <div class="dashboard-page">
                <div class="dashboard-page__header">
                    <button class="dashboard-page__back" id="dashboardBackBtn">
                        <i data-lucide="arrow-left"></i>
                        <span>Back to Home</span>
                    </button>
                    <h1 class="dashboard-page__title">
                        <i data-lucide="layout-dashboard"></i>
                        Family Dashboard
                    </h1>
                </div>

                <div class="dashboard-page__content">
                    <!-- Quick Stats Overview -->
                    <section class="dashboard-section">
                        <h2 class="dashboard-section__title">
                            <i data-lucide="bar-chart-3"></i>
                            Family Overview
                        </h2>
                        <div class="stats-grid">
                            ${renderStatsCards(stats, members)}
                        </div>
                    </section>

                    <!-- Two Column Layout -->
                    <div class="dashboard-columns">
                        <!-- Left Column -->
                        <div class="dashboard-column">
                            <!-- Member Stats -->
                            <section class="dashboard-section">
                                <h2 class="dashboard-section__title">
                                    <i data-lucide="users"></i>
                                    Member Statistics
                                </h2>
                                <div class="dashboard-section__content">
                                    ${renderMemberStats(members)}
                                </div>
                            </section>

                            <!-- Today's Events -->
                            <section class="dashboard-section">
                                <h2 class="dashboard-section__title">
                                    <i data-lucide="calendar-check"></i>
                                    Today's Schedule
                                </h2>
                                <div class="dashboard-section__content">
                                    ${renderTodaySchedule(members)}
                                </div>
                            </section>
                        </div>

                        <!-- Right Column -->
                        <div class="dashboard-column">
                            <!-- Upcoming Events -->
                            <section class="dashboard-section">
                                <h2 class="dashboard-section__title">
                                    <i data-lucide="calendar"></i>
                                    Upcoming Events
                                </h2>
                                <div class="dashboard-section__content">
                                    ${renderUpcomingEvents()}
                                </div>
                            </section>
                        </div>
                    </div>

                    <!-- Activity Monitor (Full Width) -->
                    <section class="dashboard-section dashboard-section--full">
                        <div class="dashboard-section__header">
                            <h2 class="dashboard-section__title">
                                <i data-lucide="activity"></i>
                                Activity Monitor
                            </h2>
                            <button class="btn btn--ghost btn--sm" id="showFullActivityBtn">
                                <i data-lucide="maximize-2"></i>
                                Full View
                            </button>
                        </div>
                        <div class="dashboard-section__content">
                            ${renderActivityMonitor(members)}
                        </div>
                    </section>

                    <!-- Family Challenges -->
                    <section class="dashboard-section dashboard-section--full">
                        <div class="dashboard-section__header">
                            <h2 class="dashboard-section__title">
                                <i data-lucide="trophy"></i>
                                Family Challenges
                            </h2>
                            <button class="btn btn--primary btn--sm" id="addChallengeBtn">
                                <i data-lucide="plus"></i>
                                Add Challenge
                            </button>
                        </div>
                        <div class="dashboard-section__content">
                            ${renderFamilyChallenges()}
                        </div>
                    </section>

                    <!-- Quick Actions -->
                    <section class="dashboard-section dashboard-section--full">
                        <h2 class="dashboard-section__title">
                            <i data-lucide="zap"></i>
                            Quick Actions
                        </h2>
                        <div class="quick-actions">
                            ${renderQuickActions()}
                        </div>
                    </section>
                </div>
            </div>
        `;

        bindEvents(container);

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    /**
     * Calculate family statistics
     */
    function calculateFamilyStats(members) {
        const stats = {
            totalMembers: members.length,
            adults: members.filter(m => m.type === 'adult').length,
            kids: members.filter(m => m.type === 'kid' || m.type === 'teen').length,
            toddlers: members.filter(m => m.type === 'toddler').length,
            totalPoints: 0,
            tasksCompleted: 0,
            habitsCompleted: 0,
            eventsToday: Storage.getCalendarEventsForToday().length,
            activeWidgets: 0
        };

        const today = DateUtils.today();

        // Calculate points for kids and teens
        members.filter(m => m.type === 'kid' || m.type === 'teen').forEach(member => {
            const pointsData = Storage.getWidgetData(member.id, 'points');
            stats.totalPoints += pointsData.balance || 0;
        });

        // Count completed tasks and habits today
        members.forEach(member => {
            // Check task-list widget (adults)
            const taskData = Storage.getWidgetData(member.id, 'task-list');
            if (taskData.tasks) {
                stats.tasksCompleted += taskData.tasks.filter(t =>
                    t.completed && t.completedAt?.startsWith(today)
                ).length;
            }

            // Check kid-tasks widget (kids/teens)
            const kidTaskData = Storage.getWidgetData(member.id, 'kid-tasks');
            if (kidTaskData.tasks) {
                stats.tasksCompleted += kidTaskData.tasks.filter(t =>
                    t.completed && t.completedAt?.startsWith(today)
                ).length;
            }

            // Check habits completed today
            const habitsData = Storage.getWidgetData(member.id, 'habits');
            const todayHabits = habitsData.log?.[today] || [];
            stats.habitsCompleted += todayHabits.length;

            // Count active widgets
            stats.activeWidgets += (member.widgets || []).length;
        });

        return stats;
    }

    /**
     * Render stats cards
     */
    function renderStatsCards(stats, members) {
        // Build member count detail string
        const memberParts = [];
        if (stats.adults > 0) memberParts.push(`${stats.adults} adult${stats.adults !== 1 ? 's' : ''}`);
        if (stats.kids > 0) memberParts.push(`${stats.kids} kid${stats.kids !== 1 ? 's' : ''}`);
        if (stats.toddlers > 0) memberParts.push(`${stats.toddlers} toddler${stats.toddlers !== 1 ? 's' : ''}`);
        const memberDetail = memberParts.join(', ') || 'No members yet';

        const cards = [
            {
                icon: 'users',
                label: 'Family Members',
                value: stats.totalMembers,
                detail: memberDetail,
                color: 'blue'
            },
            {
                icon: 'check-circle',
                label: 'Tasks Today',
                value: stats.tasksCompleted,
                detail: 'Completed across all members',
                color: 'green'
            },
            {
                icon: 'target',
                label: 'Habits Today',
                value: stats.habitsCompleted,
                detail: 'Checked off today',
                color: 'purple'
            },
            {
                icon: 'star',
                label: 'Total Points',
                value: stats.totalPoints,
                detail: 'Kids combined balance',
                color: 'amber'
            }
        ];

        return cards.map(card => `
            <div class="stat-card stat-card--${card.color}">
                <div class="stat-card__icon">
                    <i data-lucide="${card.icon}"></i>
                </div>
                <div class="stat-card__content">
                    <span class="stat-card__value">${card.value}</span>
                    <span class="stat-card__label">${card.label}</span>
                    <span class="stat-card__detail">${card.detail}</span>
                </div>
            </div>
        `).join('');
    }

    /**
     * Render member statistics
     */
    function renderMemberStats(members) {
        if (members.length === 0) {
            return `
                <div class="dashboard-empty">
                    <i data-lucide="users"></i>
                    <p>No family members yet</p>
                </div>
            `;
        }

        return `
            <div class="member-stats-list">
                ${members.map(member => renderMemberStatCard(member)).join('')}
            </div>
        `;
    }

    /**
     * Render individual member stat card
     */
    function renderMemberStatCard(member) {
        const stats = getMemberStats(member);
        const avatarHtml = renderAvatar(member.avatar, member.name);

        return `
            <div class="member-stat-card" data-member-id="${member.id}">
                <div class="member-stat-card__header">
                    <div class="member-stat-card__avatar">${avatarHtml}</div>
                    <div class="member-stat-card__info">
                        <h4 class="member-stat-card__name">${member.name}</h4>
                        <span class="member-stat-card__type">${member.type}</span>
                    </div>
                </div>
                <div class="member-stat-card__stats">
                    ${stats.map(stat => `
                        <div class="member-stat">
                            <i data-lucide="${stat.icon}"></i>
                            <span class="member-stat__value">${stat.value}</span>
                            <span class="member-stat__label">${stat.label}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Get stats for a specific member
     */
    function getMemberStats(member) {
        const stats = [];
        const today = DateUtils.today();

        if (member.type === 'kid') {
            // Points balance
            const pointsData = Storage.getWidgetData(member.id, 'points');
            stats.push({
                icon: 'star',
                value: pointsData.balance || 0,
                label: 'Points'
            });

            // Tasks completed today
            const kidTaskData = Storage.getWidgetData(member.id, 'kid-tasks');
            const tasksToday = kidTaskData.tasks?.filter(t =>
                t.completed && t.completedAt?.startsWith(today)
            ).length || 0;
            stats.push({
                icon: 'check-circle',
                value: tasksToday,
                label: 'Tasks Today'
            });

            // Habits completed today
            const habitsData = Storage.getWidgetData(member.id, 'habits');
            const todayHabits = habitsData.log?.[today]?.length || 0;
            stats.push({
                icon: 'target',
                value: todayHabits,
                label: 'Habits Today'
            });
        } else if (member.type === 'adult') {
            // Tasks completed today
            const taskData = Storage.getWidgetData(member.id, 'task-list');
            const tasksToday = taskData.tasks?.filter(t =>
                t.completed && t.completedAt?.startsWith(today)
            ).length || 0;
            stats.push({
                icon: 'check-circle',
                value: tasksToday,
                label: 'Tasks Today'
            });

            // Habits completed today
            const habitsData = Storage.getWidgetData(member.id, 'habits');
            const todayHabits = habitsData.log?.[today]?.length || 0;
            const totalHabits = habitsData.habits?.filter(h => !h.archived)?.length || 0;
            stats.push({
                icon: 'target',
                value: `${todayHabits}/${totalHabits}`,
                label: 'Habits Today'
            });

            // Workouts this week
            const workoutData = Storage.getWidgetData(member.id, 'workout');
            const weekStart = getWeekStart();
            const workoutsThisWeek = Object.keys(workoutData.log || {}).filter(date =>
                date >= weekStart
            ).length;
            stats.push({
                icon: 'dumbbell',
                value: workoutsThisWeek,
                label: 'Workouts'
            });
        } else if (member.type === 'teen') {
            // Coins balance (teens use coins instead of points)
            const pointsData = Storage.getWidgetData(member.id, 'points');
            stats.push({
                icon: 'coins',
                value: pointsData.balance || 0,
                label: 'Coins'
            });

            // Tasks completed today
            const kidTaskData = Storage.getWidgetData(member.id, 'kid-tasks');
            const tasksToday = kidTaskData.tasks?.filter(t =>
                t.completed && t.completedAt?.startsWith(today)
            ).length || 0;
            stats.push({
                icon: 'check-circle',
                value: tasksToday,
                label: 'Tasks Today'
            });

            // Habits completed today
            const habitsData = Storage.getWidgetData(member.id, 'habits');
            const todayHabits = habitsData.log?.[today]?.length || 0;
            stats.push({
                icon: 'target',
                value: todayHabits,
                label: 'Habits Today'
            });
        } else if (member.type === 'toddler') {
            // Activities today
            const dailyLog = Storage.getWidgetData(member.id, 'daily-log');
            const todayLog = dailyLog.entries?.[today] || {};
            stats.push({
                icon: 'smile',
                value: Object.keys(todayLog).length,
                label: 'Logged Today'
            });

            // Milestones achieved
            const milestones = Storage.getWidgetData(member.id, 'milestones');
            stats.push({
                icon: 'baby',
                value: milestones.achieved?.length || 0,
                label: 'Milestones'
            });
        }

        return stats;
    }

    /**
     * Render today's schedule overview
     */
    function renderTodaySchedule(members) {
        const allScheduleItems = [];
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        members.forEach(member => {
            const schedule = Storage.getScheduleForToday(member.id);
            schedule.forEach(block => {
                allScheduleItems.push({
                    ...block,
                    memberName: member.name,
                    memberColor: member.avatar?.color || '#6366F1',
                    isCurrent: currentTime >= block.start && currentTime < block.end,
                    isPast: currentTime > block.end
                });
            });
        });

        // Sort by start time
        allScheduleItems.sort((a, b) => a.start.localeCompare(b.start));

        if (allScheduleItems.length === 0) {
            return `
                <div class="dashboard-empty">
                    <i data-lucide="calendar-x"></i>
                    <p>No scheduled activities today</p>
                </div>
            `;
        }

        return `
            <div class="schedule-list">
                ${allScheduleItems.slice(0, 8).map(item => `
                    <div class="schedule-item ${item.isCurrent ? 'schedule-item--current' : ''} ${item.isPast ? 'schedule-item--past' : ''}">
                        <div class="schedule-item__time">
                            <span>${formatTime(item.start)}</span>
                            <span class="schedule-item__time-sep">-</span>
                            <span>${formatTime(item.end)}</span>
                        </div>
                        <div class="schedule-item__content">
                            <span class="schedule-item__title">${item.title}</span>
                            <span class="schedule-item__member" style="--member-color: ${item.memberColor}">
                                ${item.memberName}
                            </span>
                        </div>
                        ${item.isCurrent ? '<span class="schedule-item__badge">Now</span>' : ''}
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * Render Activity Monitor using central activity log
     */
    function renderActivityMonitor(members) {
        const categories = Storage.getActivityCategories();
        const stats = Storage.getActivityStats();
        const groupedLog = Storage.getActivityLogGroupedByDate({ limit: 50 });

        return `
            <div class="activity-monitor">
                <!-- Summary Stats -->
                <div class="activity-monitor__stats">
                    <div class="activity-stat">
                        <div class="activity-stat__value">${stats.today}</div>
                        <div class="activity-stat__label">Today</div>
                    </div>
                    <div class="activity-stat">
                        <div class="activity-stat__value">${stats.thisWeek}</div>
                        <div class="activity-stat__label">This Week</div>
                    </div>
                    <div class="activity-stat">
                        <div class="activity-stat__value">${stats.total}</div>
                        <div class="activity-stat__label">Total</div>
                    </div>
                    <div class="activity-stat">
                        <div class="activity-stat__value">${Object.keys(stats.byMember).length}</div>
                        <div class="activity-stat__label">Active</div>
                    </div>
                </div>

                <!-- Filters -->
                <div class="activity-monitor__filters">
                    <div class="filter-group">
                        <label class="filter-label">Member</label>
                        <select class="filter-select" id="activityMemberFilter">
                            <option value="">All Members</option>
                            ${members.map(m => `<option value="${m.id}">${m.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="filter-group">
                        <label class="filter-label">Category</label>
                        <select class="filter-select" id="activityCategoryFilter">
                            <option value="">All Categories</option>
                            ${Object.entries(categories).map(([id, cat]) =>
                                `<option value="${id}">${cat.name}</option>`
                            ).join('')}
                        </select>
                    </div>
                    <div class="filter-group">
                        <label class="filter-label">Date</label>
                        <select class="filter-select" id="activityDateFilter">
                            <option value="today">Today</option>
                            <option value="week" selected>This Week</option>
                            <option value="month">This Month</option>
                            <option value="all">All Time</option>
                        </select>
                    </div>
                    <button class="btn btn--ghost btn--sm" id="refreshActivityBtn" title="Refresh">
                        <i data-lucide="refresh-cw"></i>
                    </button>
                </div>

                <!-- Category Breakdown -->
                <div class="activity-monitor__categories">
                    <div class="category-cards">
                        ${Object.entries(categories).map(([id, cat]) => {
                            const count = stats.byCategory[id] || 0;
                            return `
                                <div class="category-card" data-category="${id}" style="--category-color: ${cat.color}">
                                    <div class="category-card__icon">
                                        <i data-lucide="${cat.icon}"></i>
                                    </div>
                                    <div class="category-card__info">
                                        <div class="category-card__name">${cat.name}</div>
                                        <div class="category-card__count">${count}</div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <!-- Activity Feed -->
                <div class="activity-monitor__feed" id="activityFeed">
                    ${renderActivityMonitorFeed(groupedLog, categories)}
                </div>
            </div>
        `;
    }

    /**
     * Render Activity Monitor Feed
     */
    function renderActivityMonitorFeed(groupedLog, categories) {
        const dateKeys = Object.keys(groupedLog).sort().reverse();

        if (dateKeys.length === 0) {
            return `
                <div class="activity-empty">
                    <i data-lucide="activity"></i>
                    <p>No activities logged yet. Activities will appear here as family members use the app.</p>
                </div>
            `;
        }

        return dateKeys.slice(0, 7).map(dateKey => {
            const date = new Date(dateKey);
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            let dateLabel;
            if (dateKey === today.toISOString().split('T')[0]) {
                dateLabel = 'Today';
            } else if (dateKey === yesterday.toISOString().split('T')[0]) {
                dateLabel = 'Yesterday';
            } else {
                dateLabel = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            }

            const events = groupedLog[dateKey];

            return `
                <div class="activity-day">
                    <div class="activity-day__header">
                        <span class="activity-day__date">${dateLabel}</span>
                        <span class="activity-day__count">${events.length}</span>
                    </div>
                    <div class="activity-day__list">
                        ${events.slice(0, 10).map(event => {
                            const category = categories[event.category] || { icon: 'circle', color: '#6B7280' };
                            const time = new Date(event.timestamp).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true
                            });

                            return `
                                <div class="activity-item" data-category="${event.category}">
                                    <div class="activity-item__icon" style="background-color: ${category.color}20; color: ${category.color}">
                                        <i data-lucide="${category.icon}"></i>
                                    </div>
                                    <div class="activity-item__content">
                                        <div class="activity-item__member">${event.memberName}</div>
                                        <div class="activity-item__details">${event.details}</div>
                                    </div>
                                    <div class="activity-item__meta">
                                        <span class="activity-item__time">${time}</span>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Refresh activity feed with filters
     */
    function refreshActivityMonitorFeed() {
        const memberFilter = document.getElementById('activityMemberFilter')?.value;
        const categoryFilter = document.getElementById('activityCategoryFilter')?.value;
        const dateFilter = document.getElementById('activityDateFilter')?.value;

        const filters = {};
        if (memberFilter) filters.memberId = memberFilter;
        if (categoryFilter) filters.category = categoryFilter;

        // Date filter
        const now = new Date();
        if (dateFilter === 'today') {
            filters.startDate = now.toISOString().split('T')[0];
        } else if (dateFilter === 'week') {
            const weekAgo = new Date(now);
            weekAgo.setDate(weekAgo.getDate() - 7);
            filters.startDate = weekAgo.toISOString().split('T')[0];
        } else if (dateFilter === 'month') {
            const monthAgo = new Date(now);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            filters.startDate = monthAgo.toISOString().split('T')[0];
        }

        const groupedLog = Storage.getActivityLogGroupedByDate(filters);
        const categories = Storage.getActivityCategories();

        const feedContainer = document.getElementById('activityFeed');
        if (feedContainer) {
            feedContainer.innerHTML = renderActivityMonitorFeed(groupedLog, categories);
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }
    }

    /**
     * Render activity feed (legacy - reconstructs from widget data)
     */
    function renderActivityFeed(members) {
        const activities = [];
        const today = DateUtils.today();
        const yesterday = DateUtils.addDays(today, -1);
        const recentDates = [today, yesterday];

        members.forEach(member => {
            // Get recent task completions (including subtasks)
            const taskData = Storage.getWidgetData(member.id, 'task-list');
            (taskData.tasks || []).forEach(task => {
                if (task.completed && task.completedAt) {
                    const date = task.completedAt.split('T')[0];
                    if (recentDates.includes(date)) {
                        activities.push({
                            type: 'task',
                            icon: 'check-circle',
                            text: `completed "${task.title}"`,
                            memberName: member.name,
                            memberColor: member.avatar?.color || '#6366F1',
                            timestamp: task.completedAt,
                            date: date
                        });
                    }
                }
                // Check for completed subtasks (show as separate activities)
                (task.subtasks || []).forEach(subtask => {
                    if (subtask.completed && subtask.completedAt) {
                        const subtaskDate = subtask.completedAt.split('T')[0];
                        if (recentDates.includes(subtaskDate)) {
                            activities.push({
                                type: 'subtask',
                                icon: 'check',
                                text: `completed subtask "${subtask.title}"`,
                                memberName: member.name,
                                memberColor: member.avatar?.color || '#6366F1',
                                timestamp: subtask.completedAt,
                                date: subtaskDate
                            });
                        }
                    }
                });
            });

            // Get kid task completions
            const kidTaskData = Storage.getWidgetData(member.id, 'kid-tasks');
            (kidTaskData.tasks || []).forEach(task => {
                if (task.completed && task.completedAt) {
                    const date = task.completedAt.split('T')[0];
                    if (recentDates.includes(date)) {
                        activities.push({
                            type: 'task',
                            icon: 'check-circle',
                            text: `completed "${task.title}"`,
                            memberName: member.name,
                            memberColor: member.avatar?.color || '#6366F1',
                            timestamp: task.completedAt,
                            date: date
                        });
                    }
                }
            });

            // Get habit completions
            const habitData = Storage.getWidgetData(member.id, 'habits');
            const habits = habitData.habits || [];
            const habitLog = habitData.log || {};
            recentDates.forEach(date => {
                const dayLog = habitLog[date] || [];
                dayLog.forEach(habitId => {
                    const habit = habits.find(h => h.id === habitId);
                    if (habit) {
                        activities.push({
                            type: 'habit',
                            icon: 'target',
                            text: `completed habit "${habit.name}"`,
                            memberName: member.name,
                            memberColor: member.avatar?.color || '#6366F1',
                            timestamp: date,
                            date: date
                        });
                    }
                });
            });

            // Get chore completions (for kids)
            if (member.type === 'kid' || member.type === 'teen' || member.type === 'toddler') {
                const choreData = Storage.getWidgetData(member.id, 'chores');
                (choreData.completedToday || []).forEach(completion => {
                    const date = completion.date || today;
                    if (recentDates.includes(date)) {
                        // Find the chore name
                        const dailyChores = choreData.dailyChores?.[date] || [];
                        const chore = dailyChores.find(c => c.id === completion.choreId);
                        if (chore) {
                            activities.push({
                                type: 'chore',
                                icon: 'sparkles',
                                text: `completed chore "${chore.name}"`,
                                memberName: member.name,
                                memberColor: member.avatar?.color || '#6366F1',
                                timestamp: date,
                                date: date
                            });
                        }
                    }
                });
            }

            // Get points earned (for kids)
            if (member.type === 'kid' || member.type === 'teen' || member.type === 'toddler') {
                const pointsData = Storage.getWidgetData(member.id, 'points');
                Object.entries(pointsData.dailyLog || {}).forEach(([date, log]) => {
                    if (recentDates.includes(date)) {
                        if (log.pointsEarned > 0) {
                            activities.push({
                                type: 'points',
                                icon: 'star',
                                text: `earned ${log.pointsEarned} points`,
                                memberName: member.name,
                                memberColor: member.avatar?.color || '#6366F1',
                                timestamp: date,
                                date: date
                            });
                        }
                    }
                });

                // Rewards redeemed
                const rewardsData = Storage.getWidgetData(member.id, 'rewards');
                (rewardsData.redemptionHistory || []).forEach(redemption => {
                    const date = redemption.date.split('T')[0];
                    if (recentDates.includes(date)) {
                        activities.push({
                            type: 'reward',
                            icon: 'gift',
                            text: `redeemed "${redemption.rewardName}"`,
                            memberName: member.name,
                            memberColor: member.avatar?.color || '#6366F1',
                            timestamp: redemption.date,
                            date: date
                        });
                    }
                });
            }

            // Get workout completions
            const workoutData = Storage.getWidgetData(member.id, 'workout');
            Object.entries(workoutData.log || {}).forEach(([date, log]) => {
                if (recentDates.includes(date)) {
                    // Show each workout activity
                    (log.activities || []).forEach(activity => {
                        activities.push({
                            type: 'workout',
                            icon: 'dumbbell',
                            text: `completed ${activity.name || 'a workout'}`,
                            memberName: member.name,
                            memberColor: member.avatar?.color || '#6366F1',
                            timestamp: date,
                            date: date
                        });
                    });
                    // Fallback if no activities array but log exists
                    if (!log.activities || log.activities.length === 0) {
                        activities.push({
                            type: 'workout',
                            icon: 'dumbbell',
                            text: 'completed a workout',
                            memberName: member.name,
                            memberColor: member.avatar?.color || '#6366F1',
                            timestamp: date,
                            date: date
                        });
                    }
                }
            });

            // Get journal entries
            const journalData = Storage.getWidgetData(member.id, 'journal');
            (journalData.entries || []).forEach(entry => {
                const date = entry.date || entry.createdAt?.split('T')[0];
                if (date && recentDates.includes(date)) {
                    activities.push({
                        type: 'journal',
                        icon: 'book-open',
                        text: 'added a journal entry',
                        memberName: member.name,
                        memberColor: member.avatar?.color || '#6366F1',
                        timestamp: entry.createdAt || date,
                        date: date
                    });
                }
            });

            // Toddler-specific activities
            if (member.type === 'toddler') {
                // Toddler routine completions
                const routineData = Storage.getWidgetData(member.id, 'toddler-routine');
                if (routineData.lastResetDate === today && routineData.completedToday?.length > 0) {
                    const routines = routineData.routines || [];
                    routineData.completedToday.forEach(routineId => {
                        const routine = routines.find(r => r.id === routineId);
                        if (routine) {
                            activities.push({
                                type: 'routine',
                                icon: 'sun',
                                text: `completed routine "${routine.title}"`,
                                memberName: member.name,
                                memberColor: member.avatar?.color || '#6366F1',
                                timestamp: today,
                                date: today
                            });
                        }
                    });
                }

                // Daily log activities
                const dailyLogData = Storage.getWidgetData(member.id, 'daily-log');
                recentDates.forEach(date => {
                    const dayLog = dailyLogData.logs?.[date];
                    if (dayLog) {
                        // Log meals, activities, naps
                        if (dayLog.meal > 0) {
                            activities.push({
                                type: 'daily-log',
                                icon: 'utensils',
                                text: `had ${dayLog.meal} meal${dayLog.meal > 1 ? 's' : ''}`,
                                memberName: member.name,
                                memberColor: member.avatar?.color || '#6366F1',
                                timestamp: date,
                                date: date
                            });
                        }
                        if (dayLog.activity > 0) {
                            activities.push({
                                type: 'daily-log',
                                icon: 'shapes',
                                text: `did ${dayLog.activity} activit${dayLog.activity > 1 ? 'ies' : 'y'}`,
                                memberName: member.name,
                                memberColor: member.avatar?.color || '#6366F1',
                                timestamp: date,
                                date: date
                            });
                        }
                        if (dayLog.notes) {
                            activities.push({
                                type: 'daily-log',
                                icon: 'message-square',
                                text: 'had a note logged',
                                memberName: member.name,
                                memberColor: member.avatar?.color || '#6366F1',
                                timestamp: date,
                                date: date
                            });
                        }
                    }
                });

                // Milestones achieved
                const milestonesData = Storage.getWidgetData(member.id, 'milestones');
                (milestonesData.achieved || []).forEach(milestone => {
                    if (recentDates.includes(milestone.date)) {
                        activities.push({
                            type: 'milestone',
                            icon: 'award',
                            text: `achieved a milestone`,
                            memberName: member.name,
                            memberColor: member.avatar?.color || '#6366F1',
                            timestamp: milestone.date,
                            date: milestone.date
                        });
                    }
                });
            }
        });

        // Sort by timestamp (most recent first)
        activities.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

        if (activities.length === 0) {
            return `
                <div class="dashboard-empty">
                    <i data-lucide="activity"></i>
                    <p>No recent activity</p>
                </div>
            `;
        }

        return `
            <div class="activity-feed">
                ${activities.slice(0, 8).map(activity => `
                    <div class="activity-item">
                        <div class="activity-item__icon" style="--icon-color: ${activity.memberColor}">
                            <i data-lucide="${activity.icon}"></i>
                        </div>
                        <div class="activity-item__content">
                            <span class="activity-item__member">${activity.memberName}</span>
                            <span class="activity-item__text">${activity.text}</span>
                        </div>
                        <span class="activity-item__time">${formatActivityTime(activity.timestamp)}</span>
                    </div>
                `).join('')}
            </div>
            <button class="btn btn--ghost btn--sm activity-show-more" id="showMoreActivityBtn">
                <i data-lucide="chevron-down"></i>
                Show More Activity
            </button>
        `;
    }

    /**
     * Gather all activities for full activity page (last 30 days)
     */
    function getAllActivities(members, daysBack = 30) {
        const activities = [];
        const today = new Date();

        // Generate list of dates to check
        const datesToCheck = [];
        for (let i = 0; i < daysBack; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            datesToCheck.push(d.toISOString().split('T')[0]);
        }

        members.forEach(member => {
            // Task completions
            const taskData = Storage.getWidgetData(member.id, 'task-list');
            (taskData.tasks || []).forEach(task => {
                if (task.completed && task.completedAt) {
                    const date = task.completedAt.split('T')[0];
                    if (datesToCheck.includes(date)) {
                        activities.push({
                            type: 'task',
                            icon: 'check-circle',
                            text: `completed "${task.title}"`,
                            memberId: member.id,
                            memberName: member.name,
                            memberColor: member.avatar?.color || '#6366F1',
                            timestamp: task.completedAt,
                            date: date
                        });
                    }
                }
                // Subtasks
                (task.subtasks || []).forEach(subtask => {
                    if (subtask.completed && subtask.completedAt) {
                        const subtaskDate = subtask.completedAt.split('T')[0];
                        if (datesToCheck.includes(subtaskDate)) {
                            activities.push({
                                type: 'subtask',
                                icon: 'check',
                                text: `completed subtask "${subtask.title}"`,
                                memberId: member.id,
                                memberName: member.name,
                                memberColor: member.avatar?.color || '#6366F1',
                                timestamp: subtask.completedAt,
                                date: subtaskDate
                            });
                        }
                    }
                });
            });

            // Kid tasks
            const kidTaskData = Storage.getWidgetData(member.id, 'kid-tasks');
            (kidTaskData.tasks || []).forEach(task => {
                if (task.completed && task.completedAt) {
                    const date = task.completedAt.split('T')[0];
                    if (datesToCheck.includes(date)) {
                        activities.push({
                            type: 'task',
                            icon: 'check-circle',
                            text: `completed "${task.title}"`,
                            memberId: member.id,
                            memberName: member.name,
                            memberColor: member.avatar?.color || '#6366F1',
                            timestamp: task.completedAt,
                            date: date
                        });
                    }
                }
            });

            // Habits
            const habitData = Storage.getWidgetData(member.id, 'habits');
            const habits = habitData.habits || [];
            const habitLog = habitData.log || {};
            datesToCheck.forEach(date => {
                const dayLog = habitLog[date] || [];
                dayLog.forEach(habitId => {
                    const habit = habits.find(h => h.id === habitId);
                    if (habit) {
                        activities.push({
                            type: 'habit',
                            icon: 'target',
                            text: `completed habit "${habit.name}"`,
                            memberId: member.id,
                            memberName: member.name,
                            memberColor: member.avatar?.color || '#6366F1',
                            timestamp: date,
                            date: date
                        });
                    }
                });
            });

            // Chores (kids)
            if (member.type === 'kid' || member.type === 'teen' || member.type === 'toddler') {
                const choreData = Storage.getWidgetData(member.id, 'chores');
                (choreData.completedToday || []).forEach(completion => {
                    const date = completion.date;
                    if (date && datesToCheck.includes(date)) {
                        const dailyChores = choreData.dailyChores?.[date] || [];
                        const chore = dailyChores.find(c => c.id === completion.choreId);
                        if (chore) {
                            activities.push({
                                type: 'chore',
                                icon: 'sparkles',
                                text: `completed chore "${chore.name}"`,
                                memberId: member.id,
                                memberName: member.name,
                                memberColor: member.avatar?.color || '#6366F1',
                                timestamp: date,
                                date: date
                            });
                        }
                    }
                });

                // Points
                const pointsData = Storage.getWidgetData(member.id, 'points');
                Object.entries(pointsData.dailyLog || {}).forEach(([date, log]) => {
                    if (datesToCheck.includes(date) && log.pointsEarned > 0) {
                        activities.push({
                            type: 'points',
                            icon: 'star',
                            text: `earned ${log.pointsEarned} points`,
                            memberId: member.id,
                            memberName: member.name,
                            memberColor: member.avatar?.color || '#6366F1',
                            timestamp: date,
                            date: date
                        });
                    }
                });

                // Rewards
                const rewardsData = Storage.getWidgetData(member.id, 'rewards');
                (rewardsData.redemptionHistory || []).forEach(redemption => {
                    const date = redemption.date.split('T')[0];
                    if (datesToCheck.includes(date)) {
                        activities.push({
                            type: 'reward',
                            icon: 'gift',
                            text: `redeemed "${redemption.rewardName}"`,
                            memberId: member.id,
                            memberName: member.name,
                            memberColor: member.avatar?.color || '#6366F1',
                            timestamp: redemption.date,
                            date: date
                        });
                    }
                });
            }

            // Workouts
            const workoutData = Storage.getWidgetData(member.id, 'workout');
            Object.entries(workoutData.log || {}).forEach(([date, log]) => {
                if (datesToCheck.includes(date)) {
                    (log.activities || []).forEach(activity => {
                        activities.push({
                            type: 'workout',
                            icon: 'dumbbell',
                            text: `completed ${activity.name || 'a workout'}`,
                            memberId: member.id,
                            memberName: member.name,
                            memberColor: member.avatar?.color || '#6366F1',
                            timestamp: date,
                            date: date
                        });
                    });
                    if (!log.activities || log.activities.length === 0) {
                        activities.push({
                            type: 'workout',
                            icon: 'dumbbell',
                            text: 'completed a workout',
                            memberId: member.id,
                            memberName: member.name,
                            memberColor: member.avatar?.color || '#6366F1',
                            timestamp: date,
                            date: date
                        });
                    }
                }
            });

            // Journal
            const journalData = Storage.getWidgetData(member.id, 'journal');
            (journalData.entries || []).forEach(entry => {
                const date = entry.date || entry.createdAt?.split('T')[0];
                if (date && datesToCheck.includes(date)) {
                    activities.push({
                        type: 'journal',
                        icon: 'book-open',
                        text: 'added a journal entry',
                        memberId: member.id,
                        memberName: member.name,
                        memberColor: member.avatar?.color || '#6366F1',
                        timestamp: entry.createdAt || date,
                        date: date
                    });
                }
            });

            // Toddler-specific activities
            if (member.type === 'toddler') {
                // Toddler routine history
                const routineData = Storage.getWidgetData(member.id, 'toddler-routine');
                const routines = routineData.routines || [];
                const routineHistory = routineData.history || [];

                // Current day completions
                if (routineData.lastResetDate && datesToCheck.includes(routineData.lastResetDate)) {
                    (routineData.completedToday || []).forEach(routineId => {
                        const routine = routines.find(r => r.id === routineId);
                        if (routine) {
                            activities.push({
                                type: 'routine',
                                icon: 'sun',
                                text: `completed routine "${routine.title}"`,
                                memberId: member.id,
                                memberName: member.name,
                                memberColor: member.avatar?.color || '#6366F1',
                                timestamp: routineData.lastResetDate,
                                date: routineData.lastResetDate
                            });
                        }
                    });
                }

                // Historical routine completions
                routineHistory.forEach(historyEntry => {
                    if (datesToCheck.includes(historyEntry.date) && historyEntry.completed > 0) {
                        activities.push({
                            type: 'routine',
                            icon: 'sun',
                            text: `completed ${historyEntry.completed} of ${historyEntry.total} routines`,
                            memberId: member.id,
                            memberName: member.name,
                            memberColor: member.avatar?.color || '#6366F1',
                            timestamp: historyEntry.date,
                            date: historyEntry.date
                        });
                    }
                });

                // Daily log activities
                const dailyLogData = Storage.getWidgetData(member.id, 'daily-log');
                Object.entries(dailyLogData.logs || {}).forEach(([date, dayLog]) => {
                    if (datesToCheck.includes(date)) {
                        if (dayLog.meal > 0) {
                            activities.push({
                                type: 'daily-log',
                                icon: 'utensils',
                                text: `had ${dayLog.meal} meal${dayLog.meal > 1 ? 's' : ''}`,
                                memberId: member.id,
                                memberName: member.name,
                                memberColor: member.avatar?.color || '#6366F1',
                                timestamp: date,
                                date: date
                            });
                        }
                        if (dayLog.activity > 0) {
                            activities.push({
                                type: 'daily-log',
                                icon: 'shapes',
                                text: `did ${dayLog.activity} activit${dayLog.activity > 1 ? 'ies' : 'y'}`,
                                memberId: member.id,
                                memberName: member.name,
                                memberColor: member.avatar?.color || '#6366F1',
                                timestamp: date,
                                date: date
                            });
                        }
                        if (dayLog.notes) {
                            activities.push({
                                type: 'daily-log',
                                icon: 'message-square',
                                text: 'had a note logged',
                                memberId: member.id,
                                memberName: member.name,
                                memberColor: member.avatar?.color || '#6366F1',
                                timestamp: date,
                                date: date
                            });
                        }
                    }
                });

                // Milestones achieved
                const milestonesData = Storage.getWidgetData(member.id, 'milestones');
                (milestonesData.achieved || []).forEach(milestone => {
                    if (datesToCheck.includes(milestone.date)) {
                        activities.push({
                            type: 'milestone',
                            icon: 'award',
                            text: 'achieved a milestone',
                            memberId: member.id,
                            memberName: member.name,
                            memberColor: member.avatar?.color || '#6366F1',
                            timestamp: milestone.date,
                            date: milestone.date
                        });
                    }
                });
            }
        });

        // Sort by timestamp (most recent first)
        activities.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
        return activities;
    }

    /**
     * Show full activity page
     */
    function showActivityPage(container) {
        const members = Storage.getMembers();
        const allActivities = getAllActivities(members);

        // Get unique activity types for filters
        const activityTypes = [...new Set(allActivities.map(a => a.type))];

        // Calculate stats
        const today = DateUtils.today();
        const todayCount = allActivities.filter(a => a.date === today).length;
        const thisWeekCount = allActivities.filter(a => {
            const actDate = new Date(a.date);
            const now = new Date();
            const weekAgo = new Date(now.setDate(now.getDate() - 7));
            return actDate >= weekAgo;
        }).length;

        container.innerHTML = `
            <div class="activity-page">
                <!-- Hero Header -->
                <div class="activity-page__hero">
                    <div class="activity-page__hero-bg">
                        <div class="activity-hero-shape activity-hero-shape--1"></div>
                        <div class="activity-hero-shape activity-hero-shape--2"></div>
                        <div class="activity-hero-shape activity-hero-shape--3"></div>
                    </div>
                    <div class="activity-page__hero-content">
                        <button class="activity-page__back" id="activityBackBtn">
                            <i data-lucide="arrow-left"></i>
                            Back
                        </button>
                        <div class="activity-page__hero-text">
                            <h1 class="activity-page__hero-title">
                                <i data-lucide="activity"></i>
                                Family Activity
                            </h1>
                            <p class="activity-page__hero-subtitle">Track what everyone's been up to</p>
                        </div>
                        <div class="activity-page__hero-stats">
                            <div class="activity-hero-stat">
                                <span class="activity-hero-stat__value">${todayCount}</span>
                                <span class="activity-hero-stat__label">Today</span>
                            </div>
                            <div class="activity-hero-stat">
                                <span class="activity-hero-stat__value">${thisWeekCount}</span>
                                <span class="activity-hero-stat__label">This Week</span>
                            </div>
                            <div class="activity-hero-stat">
                                <span class="activity-hero-stat__value">${members.length}</span>
                                <span class="activity-hero-stat__label">Members</span>
                            </div>
                            <div class="activity-hero-stat">
                                <span class="activity-hero-stat__value">${allActivities.length}</span>
                                <span class="activity-hero-stat__label">Total</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Filters -->
                <div class="activity-page__filters">
                    <div class="activity-filter-row">
                        <div class="activity-filter-group">
                            <span class="activity-filter-label">Type:</span>
                            <div class="activity-filter-chips" id="typeFilters">
                                <button class="activity-filter-chip activity-filter-chip--active" data-filter-type="all">
                                    All
                                </button>
                                ${activityTypes.map(type => `
                                    <button class="activity-filter-chip" data-filter-type="${type}">
                                        <i data-lucide="${getActivityIcon(type)}"></i>
                                        ${formatActivityType(type)}
                                    </button>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                    <div class="activity-filter-row">
                        <div class="activity-filter-group">
                            <span class="activity-filter-label">Member:</span>
                            <div class="activity-filter-chips" id="memberFilters">
                                <button class="activity-filter-chip activity-filter-chip--active" data-filter-member="all">
                                    Everyone
                                </button>
                                ${members.map(m => `
                                    <button class="activity-filter-chip" data-filter-member="${m.id}">
                                        <span class="activity-filter-chip__avatar" style="background: ${m.avatar?.color || '#6366F1'}">
                                            ${m.name.charAt(0)}
                                        </span>
                                        ${m.name}
                                    </button>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Activity List -->
                <div class="activity-page__content">
                    ${renderActivityList(allActivities)}
                </div>
            </div>
        `;

        if (typeof lucide !== 'undefined') lucide.createIcons();
        bindActivityPageEvents(container, members, allActivities);
    }

    /**
     * Render activity list grouped by date
     */
    function renderActivityList(activities, typeFilter = 'all', memberFilter = 'all') {
        let filtered = activities;

        if (typeFilter !== 'all') {
            filtered = filtered.filter(a => a.type === typeFilter);
        }
        if (memberFilter !== 'all') {
            filtered = filtered.filter(a => a.memberId === memberFilter);
        }

        if (filtered.length === 0) {
            return `
                <div class="activity-page__empty">
                    <i data-lucide="inbox"></i>
                    <p>No activities found</p>
                </div>
            `;
        }

        // Group by date
        const grouped = {};
        filtered.forEach(activity => {
            const date = activity.date;
            if (!grouped[date]) {
                grouped[date] = [];
            }
            grouped[date].push(activity);
        });

        // Sort activities within each day by timestamp (most recent first)
        // For activities with same timestamp, sort by type then member name
        Object.keys(grouped).forEach(date => {
            grouped[date].sort((a, b) => {
                // First sort by timestamp (descending - most recent first)
                const timeCompare = b.timestamp.localeCompare(a.timestamp);
                if (timeCompare !== 0) return timeCompare;
                // If same timestamp, sort by activity type
                const typeCompare = a.type.localeCompare(b.type);
                if (typeCompare !== 0) return typeCompare;
                // If same type, sort by member name
                return a.memberName.localeCompare(b.memberName);
            });
        });

        const today = DateUtils.today();
        const yesterday = DateUtils.addDays(today, -1);

        return Object.entries(grouped).map(([date, dayActivities]) => {
            let dateLabel;
            if (date === today) {
                dateLabel = 'Today';
            } else if (date === yesterday) {
                dateLabel = 'Yesterday';
            } else {
                dateLabel = new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric'
                });
            }

            return `
                <div class="activity-day">
                    <div class="activity-day__header">
                        <span class="activity-day__date">${dateLabel}</span>
                        <span class="activity-day__count">${dayActivities.length} activities</span>
                    </div>
                    <div class="activity-day__list">
                        ${dayActivities.map(activity => `
                            <div class="activity-item activity-item--full">
                                <div class="activity-item__icon" style="--icon-color: ${activity.memberColor}">
                                    <i data-lucide="${activity.icon}"></i>
                                </div>
                                <div class="activity-item__content">
                                    <span class="activity-item__member">${activity.memberName}</span>
                                    <span class="activity-item__text">${activity.text}</span>
                                </div>
                                <span class="activity-item__badge activity-item__badge--${activity.type}">
                                    ${formatActivityType(activity.type)}
                                </span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Get icon for activity type
     */
    function getActivityIcon(type) {
        const icons = {
            task: 'check-circle',
            subtask: 'check',
            habit: 'target',
            chore: 'sparkles',
            points: 'star',
            reward: 'gift',
            workout: 'dumbbell',
            journal: 'book-open',
            routine: 'sun',
            'daily-log': 'clipboard-list',
            milestone: 'award'
        };
        return icons[type] || 'activity';
    }

    /**
     * Format activity type for display
     */
    function formatActivityType(type) {
        const labels = {
            task: 'Tasks',
            subtask: 'Subtasks',
            habit: 'Habits',
            chore: 'Chores',
            points: 'Points',
            reward: 'Rewards',
            workout: 'Workouts',
            journal: 'Journal',
            routine: 'Routines',
            'daily-log': 'Daily Log',
            milestone: 'Milestones'
        };
        return labels[type] || type;
    }

    /**
     * Bind activity page events
     */
    function bindActivityPageEvents(container, members, allActivities) {
        let currentTypeFilter = 'all';
        let currentMemberFilter = 'all';

        // Back button
        container.querySelector('#activityBackBtn')?.addEventListener('click', () => {
            render(container);
        });

        // Type filter chips
        container.querySelectorAll('[data-filter-type]').forEach(chip => {
            chip.addEventListener('click', () => {
                currentTypeFilter = chip.dataset.filterType;
                // Update active state
                container.querySelectorAll('[data-filter-type]').forEach(c =>
                    c.classList.remove('activity-filter-chip--active')
                );
                chip.classList.add('activity-filter-chip--active');
                // Re-render list
                const contentEl = container.querySelector('.activity-page__content');
                if (contentEl) {
                    contentEl.innerHTML = renderActivityList(allActivities, currentTypeFilter, currentMemberFilter);
                    if (typeof lucide !== 'undefined') lucide.createIcons();
                }
            });
        });

        // Member filter chips
        container.querySelectorAll('[data-filter-member]').forEach(chip => {
            chip.addEventListener('click', () => {
                currentMemberFilter = chip.dataset.filterMember;
                // Update active state
                container.querySelectorAll('[data-filter-member]').forEach(c =>
                    c.classList.remove('activity-filter-chip--active')
                );
                chip.classList.add('activity-filter-chip--active');
                // Re-render list
                const contentEl = container.querySelector('.activity-page__content');
                if (contentEl) {
                    contentEl.innerHTML = renderActivityList(allActivities, currentTypeFilter, currentMemberFilter);
                    if (typeof lucide !== 'undefined') lucide.createIcons();
                }
            });
        });
    }

    /**
     * Render upcoming events
     */
    function renderUpcomingEvents() {
        const events = Storage.getCalendarEvents();
        const today = DateUtils.today();

        // Get events from today onwards
        const upcomingEvents = events
            .filter(e => e.date >= today)
            .sort((a, b) => a.date.localeCompare(b.date))
            .slice(0, 5);

        if (upcomingEvents.length === 0) {
            return `
                <div class="dashboard-empty">
                    <i data-lucide="calendar"></i>
                    <p>No upcoming events</p>
                </div>
            `;
        }

        return `
            <div class="events-list">
                ${upcomingEvents.map(event => `
                    <div class="event-item">
                        <div class="event-item__date">
                            <span class="event-item__day">${new Date(event.date + 'T00:00:00').getDate()}</span>
                            <span class="event-item__month">${new Date(event.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })}</span>
                        </div>
                        <div class="event-item__content">
                            <span class="event-item__title">${event.title}</span>
                            ${event.time ? `<span class="event-item__time">${formatTime(event.time)}</span>` : ''}
                            ${event.memberId ? `<span class="event-item__member">${Storage.getMember(event.memberId)?.name || ''}</span>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * Render family challenges
     */
    function renderFamilyChallenges() {
        const settings = Storage.getSettings();
        const challenges = settings.familyChallenges || [];

        if (challenges.length === 0) {
            return `
                <div class="dashboard-empty dashboard-empty--wide">
                    <i data-lucide="trophy"></i>
                    <p>No active family challenges</p>
                    <span class="dashboard-empty__hint">Create challenges to motivate the whole family!</span>
                </div>
            `;
        }

        return `
            <div class="challenges-grid">
                ${challenges.map(challenge => renderChallengeCard(challenge)).join('')}
            </div>
        `;
    }

    /**
     * Render a challenge card
     */
    function renderChallengeCard(challenge) {
        const progress = challenge.progress || 0;
        const target = challenge.target || 100;
        const percentage = Math.min((progress / target) * 100, 100);

        return `
            <div class="challenge-card" data-challenge-id="${challenge.id}">
                <div class="challenge-card__header">
                    <div class="challenge-card__icon">
                        <i data-lucide="${challenge.icon || 'target'}"></i>
                    </div>
                    <button class="challenge-card__delete" data-challenge-id="${challenge.id}">
                        <i data-lucide="x"></i>
                    </button>
                </div>
                <h4 class="challenge-card__title">${challenge.title}</h4>
                <p class="challenge-card__desc">${challenge.description || ''}</p>
                <div class="challenge-card__progress">
                    <div class="progress-bar">
                        <div class="progress-bar__fill" style="width: ${percentage}%"></div>
                    </div>
                    <span class="challenge-card__count">${progress} / ${target}</span>
                </div>
                ${challenge.endDate ? `<span class="challenge-card__deadline">Ends ${formatDate(challenge.endDate)}</span>` : ''}
            </div>
        `;
    }

    /**
     * Render quick actions
     */
    function renderQuickActions() {
        const actions = [
            { icon: 'user-plus', label: 'Add Member', action: 'addMember' },
            { icon: 'calendar-plus', label: 'Add Event', action: 'addEvent' },
            { icon: 'settings', label: 'Settings', action: 'openSettings' },
            { icon: 'download', label: 'Export Data', action: 'exportData' }
        ];

        return actions.map(action => `
            <button class="quick-action-btn" data-action="${action.action}">
                <i data-lucide="${action.icon}"></i>
                <span>${action.label}</span>
            </button>
        `).join('');
    }

    /**
     * Render avatar
     */
    function renderAvatar(avatar, name) {
        if (!avatar) {
            return `<div class="avatar avatar--placeholder"><i data-lucide="user"></i></div>`;
        }

        if (avatar.type === 'photo' && avatar.photoUrl) {
            return `<img src="${avatar.photoUrl}" alt="${name}" class="avatar avatar--photo">`;
        }

        if (avatar.type === 'emoji' && avatar.emoji) {
            return `
                <div class="avatar avatar--emoji" style="background-color: ${avatar.color}">
                    <span class="avatar__emoji">${avatar.emoji}</span>
                </div>
            `;
        }

        const textColor = typeof AvatarUtils !== 'undefined'
            ? AvatarUtils.getContrastColor(avatar.color)
            : '#fff';

        return `
            <div class="avatar avatar--initials" style="background-color: ${avatar.color}">
                <span style="color: ${textColor}">${avatar.initials}</span>
            </div>
        `;
    }

    /**
     * Bind event handlers
     */
    function bindEvents(container) {
        // Back button
        container.querySelector('#dashboardBackBtn')?.addEventListener('click', () => {
            if (typeof Tabs !== 'undefined') {
                Tabs.switchTo('home');
            }
        });

        // Add challenge button
        container.querySelector('#addChallengeBtn')?.addEventListener('click', () => {
            showAddChallengeModal(container);
        });

        // Delete challenge buttons
        container.querySelectorAll('.challenge-card__delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const challengeId = btn.dataset.challengeId;
                deleteChallenge(challengeId, container);
            });
        });

        // Quick actions
        container.querySelectorAll('.quick-action-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                handleQuickAction(action);
            });
        });

        // Member stat cards click to navigate
        container.querySelectorAll('.member-stat-card').forEach(card => {
            card.addEventListener('click', () => {
                const memberId = card.dataset.memberId;
                if (typeof Tabs !== 'undefined') {
                    Tabs.switchTo(memberId);
                }
            });
        });

        // Show more activity button (legacy)
        container.querySelector('#showMoreActivityBtn')?.addEventListener('click', () => {
            showActivityPage(container);
        });

        // Activity Monitor events
        container.querySelector('#activityMemberFilter')?.addEventListener('change', refreshActivityMonitorFeed);
        container.querySelector('#activityCategoryFilter')?.addEventListener('change', refreshActivityMonitorFeed);
        container.querySelector('#activityDateFilter')?.addEventListener('change', refreshActivityMonitorFeed);
        container.querySelector('#refreshActivityBtn')?.addEventListener('click', () => {
            refreshActivityMonitorFeed();
            Toast.success('Activity feed refreshed');
        });

        // Full Activity view button
        container.querySelector('#showFullActivityBtn')?.addEventListener('click', () => {
            showActivityPage(container);
        });

        // Category cards click to filter
        container.querySelectorAll('.category-card').forEach(card => {
            card.addEventListener('click', () => {
                const categoryId = card.dataset.category;
                const categoryFilter = container.querySelector('#activityCategoryFilter');
                if (categoryFilter) {
                    categoryFilter.value = categoryId;
                    refreshActivityMonitorFeed();
                }
            });
        });
    }

    /**
     * Show add challenge modal
     */
    function showAddChallengeModal(pageContainer) {
        const challengeIcons = ['target', 'trophy', 'star', 'heart', 'zap', 'flame', 'medal', 'crown'];

        const content = `
            <form id="addChallengeForm">
                <div class="form-group">
                    <label class="form-label">Challenge Title</label>
                    <input type="text" class="form-input" id="challengeTitle" placeholder="e.g., Family Reading Week" required>
                </div>

                <div class="form-group">
                    <label class="form-label">Description</label>
                    <textarea class="form-input" id="challengeDesc" placeholder="What is this challenge about?" rows="2"></textarea>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Target Goal</label>
                        <input type="number" class="form-input" id="challengeTarget" min="1" value="10" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">End Date (Optional)</label>
                        <input type="date" class="form-input" id="challengeEndDate">
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">Icon</label>
                    <div class="icon-selector">
                        ${challengeIcons.map((icon, i) => `
                            <label class="icon-option">
                                <input type="radio" name="challengeIcon" value="${icon}" ${i === 0 ? 'checked' : ''}>
                                <div class="icon-option__content">
                                    <i data-lucide="${icon}"></i>
                                </div>
                            </label>
                        `).join('')}
                    </div>
                </div>
            </form>
        `;

        Modal.open({
            title: 'Add Family Challenge',
            content,
            footer: Modal.createFooter('Cancel', 'Create Challenge')
        });

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        Modal.bindFooterEvents(() => {
            const title = document.getElementById('challengeTitle')?.value.trim();
            const description = document.getElementById('challengeDesc')?.value.trim();
            const target = parseInt(document.getElementById('challengeTarget')?.value) || 10;
            const endDate = document.getElementById('challengeEndDate')?.value;
            const icon = document.querySelector('input[name="challengeIcon"]:checked')?.value || 'target';

            if (!title) {
                Toast.error('Please enter a challenge title');
                return false;
            }

            const settings = Storage.getSettings();
            if (!settings.familyChallenges) {
                settings.familyChallenges = [];
            }

            settings.familyChallenges.push({
                id: `challenge-${Date.now()}`,
                title,
                description,
                target,
                progress: 0,
                icon,
                endDate: endDate || null,
                createdAt: new Date().toISOString()
            });

            Storage.updateSettings(settings);
            Toast.success('Challenge created!');

            // Refresh the dashboard
            render(pageContainer);

            return true;
        });
    }

    /**
     * Delete a challenge
     */
    function deleteChallenge(challengeId, pageContainer) {
        const settings = Storage.getSettings();
        settings.familyChallenges = (settings.familyChallenges || []).filter(c => c.id !== challengeId);
        Storage.updateSettings(settings);
        Toast.success('Challenge removed');
        render(pageContainer);
    }

    /**
     * Handle quick action buttons
     */
    function handleQuickAction(action) {
        switch (action) {
            case 'addMember':
                document.getElementById('addTabBtn')?.click();
                break;
            case 'addEvent':
                if (typeof Calendar !== 'undefined') {
                    Calendar.showAddEventModal();
                }
                break;
            case 'openSettings':
                if (typeof Tabs !== 'undefined') {
                    Tabs.switchTo('settings');
                }
                break;
            case 'exportData':
                const data = Storage.exportData();
                const blob = new Blob([data], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `home-anchor-backup-${DateUtils.today()}.json`;
                a.click();
                URL.revokeObjectURL(url);
                Toast.success('Data exported successfully');
                break;
        }
    }

    /**
     * Helper: Get week start date
     */
    function getWeekStart() {
        const now = new Date();
        const day = now.getDay();
        const diff = now.getDate() - day;
        const weekStart = new Date(now.setDate(diff));
        return weekStart.toISOString().split('T')[0];
    }

    /**
     * Helper: Format time
     */
    function formatTime(time) {
        if (!time) return '';
        const [hours, minutes] = time.split(':');
        const h = parseInt(hours);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        return `${h12}:${minutes} ${ampm}`;
    }

    /**
     * Helper: Format activity timestamp
     */
    function formatActivityTime(timestamp) {
        const date = timestamp.split('T')[0];
        const today = DateUtils.today();
        const yesterday = DateUtils.addDays(today, -1);

        if (date === today) return 'Today';
        if (date === yesterday) return 'Yesterday';
        return new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    /**
     * Helper: Format date
     */
    function formatDate(dateStr) {
        return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    }

    /**
     * Check if current view is dashboard page
     */
    function isActive() {
        return State.getActiveTab() === PAGE_ID;
    }

    return {
        render,
        isActive,
        PAGE_ID
    };
})();
