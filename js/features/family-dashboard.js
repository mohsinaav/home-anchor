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
                            <!-- Activity Feed -->
                            <section class="dashboard-section">
                                <h2 class="dashboard-section__title">
                                    <i data-lucide="activity"></i>
                                    Recent Activity
                                </h2>
                                <div class="dashboard-section__content">
                                    ${renderActivityFeed(members)}
                                </div>
                            </section>

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
            kids: members.filter(m => m.type === 'kid').length,
            toddlers: members.filter(m => m.type === 'toddler').length,
            totalPoints: 0,
            tasksCompleted: 0,
            eventsToday: Storage.getCalendarEventsForToday().length,
            activeWidgets: 0
        };

        // Calculate points for kids
        members.filter(m => m.type === 'kid').forEach(member => {
            const pointsData = Storage.getWidgetData(member.id, 'points');
            stats.totalPoints += pointsData.balance || 0;
        });

        // Count completed tasks today
        const today = DateUtils.today();
        members.forEach(member => {
            // Check task-list widget
            const taskData = Storage.getWidgetData(member.id, 'task-list');
            if (taskData.tasks) {
                stats.tasksCompleted += taskData.tasks.filter(t =>
                    t.completed && t.completedAt?.startsWith(today)
                ).length;
            }

            // Check kid-tasks widget
            const kidTaskData = Storage.getWidgetData(member.id, 'kid-tasks');
            if (kidTaskData.tasks) {
                stats.tasksCompleted += kidTaskData.tasks.filter(t =>
                    t.completed && t.completedAt?.startsWith(today)
                ).length;
            }

            // Count active widgets
            stats.activeWidgets += (member.widgets || []).length;
        });

        return stats;
    }

    /**
     * Render stats cards
     */
    function renderStatsCards(stats, members) {
        const cards = [
            {
                icon: 'users',
                label: 'Family Members',
                value: stats.totalMembers,
                detail: `${stats.adults} adults, ${stats.kids} kids, ${stats.toddlers} toddlers`,
                color: 'blue'
            },
            {
                icon: 'check-circle',
                label: 'Tasks Completed Today',
                value: stats.tasksCompleted,
                detail: 'Across all family members',
                color: 'green'
            },
            {
                icon: 'star',
                label: 'Total Points (Kids)',
                value: stats.totalPoints,
                detail: 'Combined point balance',
                color: 'amber'
            },
            {
                icon: 'calendar',
                label: 'Events Today',
                value: stats.eventsToday,
                detail: 'Scheduled activities',
                color: 'purple'
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

            // Rewards redeemed
            const rewardsData = Storage.getWidgetData(member.id, 'rewards');
            stats.push({
                icon: 'gift',
                value: rewardsData.redemptionHistory?.length || 0,
                label: 'Rewards'
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

            // Habits tracked
            const habitsData = Storage.getWidgetData(member.id, 'habits');
            stats.push({
                icon: 'repeat',
                value: habitsData.habits?.length || 0,
                label: 'Habits'
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
     * Render activity feed
     */
    function renderActivityFeed(members) {
        const activities = [];
        const today = DateUtils.today();
        const yesterday = DateUtils.addDays(today, -1);

        members.forEach(member => {
            // Get recent task completions
            const taskData = Storage.getWidgetData(member.id, 'task-list');
            (taskData.tasks || []).forEach(task => {
                if (task.completed && task.completedAt) {
                    activities.push({
                        type: 'task',
                        icon: 'check-circle',
                        text: `completed "${task.title}"`,
                        memberName: member.name,
                        memberColor: member.avatar?.color || '#6366F1',
                        timestamp: task.completedAt,
                        date: task.completedAt.split('T')[0]
                    });
                }
            });

            // Get kid task completions
            const kidTaskData = Storage.getWidgetData(member.id, 'kid-tasks');
            (kidTaskData.tasks || []).forEach(task => {
                if (task.completed && task.completedAt) {
                    activities.push({
                        type: 'task',
                        icon: 'check-circle',
                        text: `completed "${task.title}"`,
                        memberName: member.name,
                        memberColor: member.avatar?.color || '#6366F1',
                        timestamp: task.completedAt,
                        date: task.completedAt.split('T')[0]
                    });
                }
            });

            // Get points earned (for kids)
            if (member.type === 'kid') {
                const pointsData = Storage.getWidgetData(member.id, 'points');
                Object.entries(pointsData.dailyLog || {}).forEach(([date, log]) => {
                    if (date === today || date === yesterday) {
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
                    if (date === today || date === yesterday) {
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
                if (date === today || date === yesterday) {
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
            });
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
                ${activities.slice(0, 10).map(activity => `
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
        `;
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
