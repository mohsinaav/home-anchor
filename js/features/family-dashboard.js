/**
 * Family Dashboard Feature
 * Clean, scannable overview of family status with actionable insights
 */

const FamilyDashboard = (function() {
    const PAGE_ID = 'family-dashboard';

    /**
     * Render the family dashboard page - NEW DESIGN
     */
    function render(container) {
        const members = Storage.getMembers();
        const stats = calculateFamilyStats(members);
        const attentionItems = getAttentionItems(members);
        const recentActivity = getRecentActivity(5);

        container.innerHTML = `
            <div class="fd">
                <!-- Header with back button -->
                <header class="fd__header">
                    <button class="fd__back" id="dashboardBackBtn">
                        <i data-lucide="arrow-left"></i>
                    </button>
                    <div class="fd__header-content">
                        <h1 class="fd__title">Family Dashboard</h1>
                        <p class="fd__greeting">${getGreeting()}</p>
                    </div>
                    <button class="fd__settings" id="dashboardSettingsBtn" title="Dashboard Settings">
                        <i data-lucide="settings"></i>
                    </button>
                </header>

                <!-- Stats Bar -->
                <section class="fd__stats-bar">
                    <div class="fd__stat">
                        <span class="fd__stat-value">${stats.tasksCompleted}</span>
                        <span class="fd__stat-label">Tasks Done</span>
                    </div>
                    <div class="fd__stat">
                        <span class="fd__stat-value">${stats.habitsCompleted}</span>
                        <span class="fd__stat-label">Habits</span>
                    </div>
                    <div class="fd__stat">
                        <span class="fd__stat-value">${stats.totalPoints}</span>
                        <span class="fd__stat-label">Points</span>
                    </div>
                    <div class="fd__stat">
                        <span class="fd__stat-value">${stats.eventsToday}</span>
                        <span class="fd__stat-label">Events</span>
                    </div>
                </section>

                <!-- Who's Doing What - Member Status Cards -->
                <section class="fd__section">
                    <div class="fd__section-header">
                        <h2 class="fd__section-title">
                            <i data-lucide="users"></i>
                            Who's Doing What
                        </h2>
                    </div>
                    <div class="fd__members-scroll">
                        ${renderMemberStatusCards(members)}
                    </div>
                </section>

                <!-- Today's Timeline -->
                <section class="fd__section">
                    <div class="fd__section-header">
                        <h2 class="fd__section-title">
                            <i data-lucide="clock"></i>
                            Today's Timeline
                        </h2>
                        <button class="fd__section-action" id="viewFullCalendarBtn">
                            <i data-lucide="calendar"></i>
                            Full Calendar
                        </button>
                    </div>
                    <div class="fd__timeline">
                        ${renderTimeline(members)}
                    </div>
                </section>

                <!-- Needs Attention -->
                ${attentionItems.length > 0 ? `
                <section class="fd__section fd__section--attention">
                    <div class="fd__section-header">
                        <h2 class="fd__section-title">
                            <i data-lucide="alert-circle"></i>
                            Needs Attention
                            <span class="fd__badge">${attentionItems.length}</span>
                        </h2>
                    </div>
                    <div class="fd__attention-list">
                        ${renderAttentionItems(attentionItems)}
                    </div>
                </section>
                ` : ''}

                <!-- Recent Activity -->
                <section class="fd__section">
                    <div class="fd__section-header">
                        <h2 class="fd__section-title">
                            <i data-lucide="activity"></i>
                            Recent Activity
                        </h2>
                        <button class="fd__section-action" id="showFullActivityBtn">
                            View All
                        </button>
                    </div>
                    <div class="fd__activity-feed">
                        ${renderSimpleActivityFeed(recentActivity)}
                    </div>
                </section>

                <!-- Weekly Overview -->
                <section class="fd__section">
                    <div class="fd__section-header">
                        <h2 class="fd__section-title">
                            <i data-lucide="bar-chart-2"></i>
                            This Week
                        </h2>
                    </div>
                    <div class="fd__week-overview">
                        ${renderWeekOverview()}
                    </div>
                </section>

                <!-- Family Goals -->
                <section class="fd__section">
                    <div class="fd__section-header">
                        <h2 class="fd__section-title">
                            <i data-lucide="target"></i>
                            Family Goals
                        </h2>
                        <button class="fd__section-action" id="addChallengeBtn">
                            <i data-lucide="plus"></i>
                            Add
                        </button>
                    </div>
                    <div class="fd__goals">
                        ${renderFamilyGoals()}
                    </div>
                </section>

                <!-- Quick Actions -->
                <section class="fd__quick-actions">
                    <button class="fd__action-btn" data-action="addEvent">
                        <i data-lucide="calendar-plus"></i>
                        <span>Add Event</span>
                    </button>
                    <button class="fd__action-btn" data-action="addMember">
                        <i data-lucide="user-plus"></i>
                        <span>Add Member</span>
                    </button>
                    <button class="fd__action-btn" data-action="givePoints">
                        <i data-lucide="star"></i>
                        <span>Give Points</span>
                    </button>
                    <button class="fd__action-btn" data-action="exportData">
                        <i data-lucide="download"></i>
                        <span>Export</span>
                    </button>
                </section>

                <!-- Legacy Activity Monitor (hidden, kept for Full View) -->
                <div id="legacyActivityContainer" style="display: none;">
                    ${renderActivityMonitor(members)}
                </div>
            </div>
        `;

        bindNewEvents(container);

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    /**
     * Get greeting based on time of day
     */
    function getGreeting() {
        const hour = new Date().getHours();
        const settings = Storage.getSettings();
        const familyName = settings.familyName || 'Family';

        if (hour < 12) return `Good morning, ${familyName}!`;
        if (hour < 17) return `Good afternoon, ${familyName}!`;
        return `Good evening, ${familyName}!`;
    }

    /**
     * Render member status cards (Who's Doing What)
     */
    function renderMemberStatusCards(members) {
        if (members.length === 0) {
            return `
                <div class="fd__empty-members">
                    <i data-lucide="users"></i>
                    <p>No family members yet</p>
                    <button class="btn btn--primary btn--sm" data-action="addMember">Add Member</button>
                </div>
            `;
        }

        return members.map(member => {
            const status = getMemberCurrentStatus(member);
            const progress = getMemberProgress(member);
            const progressPercent = Math.round(progress * 100);
            const avatarHtml = renderAvatar(member.avatar, member.name);

            return `
                <div class="fd__member-card" data-member-id="${member.id}">
                    <div class="fd__member-avatar">
                        ${avatarHtml}
                        <span class="fd__member-status-dot fd__member-status-dot--${status.type}"></span>
                    </div>
                    <div class="fd__member-name">${member.name}</div>
                    <div class="fd__member-activity">
                        <i data-lucide="${status.icon}"></i>
                        <span>${status.text}</span>
                    </div>
                    <div class="fd__member-progress">
                        <svg class="fd__progress-ring" viewBox="0 0 36 36">
                            <path class="fd__progress-ring-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                            <path class="fd__progress-ring-fill" stroke-dasharray="${progressPercent}, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                            <text x="18" y="20.5" class="fd__progress-text">${progressPercent}%</text>
                        </svg>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Get member's current status (what they're doing now)
     */
    function getMemberCurrentStatus(member) {
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        // Check schedule for current activity
        const schedule = Storage.getScheduleForToday(member.id);
        const currentBlock = schedule.find(block =>
            currentTime >= block.start && currentTime < block.end
        );

        if (currentBlock) {
            return {
                type: 'busy',
                icon: 'calendar',
                text: currentBlock.title
            };
        }

        // Check for upcoming activity within 1 hour
        const nextBlock = schedule.find(block => {
            const [h, m] = block.start.split(':').map(Number);
            const blockMinutes = h * 60 + m;
            const nowMinutes = now.getHours() * 60 + now.getMinutes();
            return blockMinutes > nowMinutes && blockMinutes - nowMinutes <= 60;
        });

        if (nextBlock) {
            return {
                type: 'upcoming',
                icon: 'clock',
                text: `Next: ${nextBlock.title}`
            };
        }

        // Default to free time
        return {
            type: 'free',
            icon: 'coffee',
            text: 'Free Time'
        };
    }

    /**
     * Get member's daily progress (0-1)
     */
    function getMemberProgress(member) {
        const today = DateUtils.today();

        if (member.type === 'adult') {
            const taskData = Storage.getWidgetData(member.id, 'task-list');
            const habitData = Storage.getWidgetData(member.id, 'habits');

            const tasksDone = (taskData.tasks || []).filter(t => t.completed && t.completedAt?.startsWith(today)).length;
            const tasksTotal = Math.max((taskData.tasks || []).length, 1);
            const habitsDone = (habitData.log?.[today] || []).length;
            const habitsTotal = Math.max((habitData.habits || []).filter(h => !h.archived).length, 1);

            return (tasksDone / tasksTotal + habitsDone / habitsTotal) / 2;
        }

        if (member.type === 'kid' || member.type === 'teen') {
            const pointsData = Storage.getWidgetData(member.id, 'points');
            const earnedToday = pointsData.dailyLog?.[today]?.pointsEarned || 0;
            const dailyGoal = pointsData.settings?.dailyGoal || 20;
            return Math.min(earnedToday / dailyGoal, 1);
        }

        if (member.type === 'toddler') {
            const routineData = Storage.getWidgetData(member.id, 'toddler-routine');
            const completed = (routineData.completedToday || []).length;
            const total = Math.max((routineData.routines || []).length, 1);
            return completed / total;
        }

        return 0;
    }

    /**
     * Render timeline for today
     */
    function renderTimeline(members) {
        const allEvents = [];
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        // Gather schedule items from all members
        members.forEach(member => {
            const schedule = Storage.getScheduleForToday(member.id);
            schedule.forEach(block => {
                allEvents.push({
                    ...block,
                    memberName: member.name,
                    memberColor: member.avatar?.color || '#6366F1',
                    isCurrent: currentTime >= block.start && currentTime < block.end,
                    isPast: currentTime > block.end
                });
            });
        });

        // Add calendar events
        const calendarEvents = Storage.getCalendarEventsForToday();
        calendarEvents.forEach(event => {
            if (event.time) {
                allEvents.push({
                    start: event.time,
                    end: event.endTime || event.time,
                    title: event.title,
                    memberName: event.memberId ? Storage.getMember(event.memberId)?.name : 'Family',
                    memberColor: '#6366F1',
                    isCurrent: currentTime >= event.time && (!event.endTime || currentTime < event.endTime),
                    isPast: event.endTime ? currentTime > event.endTime : currentTime > event.time,
                    isCalendarEvent: true
                });
            }
        });

        // Sort by time
        allEvents.sort((a, b) => a.start.localeCompare(b.start));

        if (allEvents.length === 0) {
            return `
                <div class="fd__timeline-empty">
                    <i data-lucide="calendar-x"></i>
                    <p>No scheduled activities today</p>
                </div>
            `;
        }

        return `
            <div class="fd__timeline-list">
                ${allEvents.slice(0, 8).map(event => `
                    <div class="fd__timeline-item ${event.isCurrent ? 'fd__timeline-item--current' : ''} ${event.isPast ? 'fd__timeline-item--past' : ''}">
                        <div class="fd__timeline-time">${formatTime(event.start)}</div>
                        <div class="fd__timeline-dot" style="--dot-color: ${event.memberColor}"></div>
                        <div class="fd__timeline-content">
                            <div class="fd__timeline-title">${event.title}</div>
                            <div class="fd__timeline-member">${event.memberName}</div>
                        </div>
                        ${event.isCurrent ? '<span class="fd__timeline-now">NOW</span>' : ''}
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * Get items needing attention
     */
    function getAttentionItems(members) {
        const items = [];
        const today = DateUtils.today();

        members.forEach(member => {
            // Check for pending reward requests (kids)
            if (member.type === 'kid' || member.type === 'teen') {
                const rewardsData = Storage.getWidgetData(member.id, 'rewards');
                const pendingRedemptions = (rewardsData.pendingRedemptions || []);
                pendingRedemptions.forEach(redemption => {
                    items.push({
                        type: 'reward-request',
                        icon: 'gift',
                        text: `${member.name} requested "${redemption.rewardName}"`,
                        color: '#F59E0B',
                        memberId: member.id,
                        data: redemption
                    });
                });

                // Check screen time limits
                const screenTimeData = Storage.getWidgetData(member.id, 'screen-time');
                const todayUsage = screenTimeData.log?.[today]?.totalMinutes || 0;
                const dailyLimit = screenTimeData.settings?.dailyLimitMinutes || 120;
                if (todayUsage >= dailyLimit) {
                    items.push({
                        type: 'screen-limit',
                        icon: 'monitor-off',
                        text: `${member.name}'s screen time limit reached`,
                        color: '#EF4444',
                        memberId: member.id
                    });
                }
            }

            // Check overdue tasks
            const taskData = member.type === 'adult'
                ? Storage.getWidgetData(member.id, 'task-list')
                : Storage.getWidgetData(member.id, 'kid-tasks');

            (taskData.tasks || []).forEach(task => {
                if (!task.completed && task.dueDate && task.dueDate < today) {
                    items.push({
                        type: 'overdue-task',
                        icon: 'alert-triangle',
                        text: `${member.name}: "${task.title}" is overdue`,
                        color: '#EF4444',
                        memberId: member.id
                    });
                }
            });
        });

        // Check grocery list
        const groceryData = Storage.getWidgetData('shared', 'grocery') || Storage.getWidgetData(members[0]?.id, 'grocery');
        const uncheckedItems = (groceryData.items || []).filter(i => !i.checked).length;
        if (uncheckedItems >= 5) {
            items.push({
                type: 'grocery',
                icon: 'shopping-cart',
                text: `Grocery list has ${uncheckedItems} items`,
                color: '#10B981'
            });
        }

        return items.slice(0, 5); // Limit to 5 items
    }

    /**
     * Render attention items
     */
    function renderAttentionItems(items) {
        return items.map(item => `
            <div class="fd__attention-item" data-type="${item.type}" data-member="${item.memberId || ''}">
                <div class="fd__attention-icon" style="--icon-color: ${item.color}">
                    <i data-lucide="${item.icon}"></i>
                </div>
                <div class="fd__attention-text">${item.text}</div>
                <button class="fd__attention-action">
                    <i data-lucide="chevron-right"></i>
                </button>
            </div>
        `).join('');
    }

    /**
     * Get recent activity from central log
     */
    function getRecentActivity(limit = 5) {
        const log = Storage.getActivityLog({ limit });
        return log;
    }

    /**
     * Render simple activity feed
     */
    function renderSimpleActivityFeed(activities) {
        if (activities.length === 0) {
            return `
                <div class="fd__activity-empty">
                    <p>No recent activity</p>
                </div>
            `;
        }

        const categories = Storage.getActivityCategories();

        return activities.map(activity => {
            const cat = categories[activity.category] || { icon: 'circle', color: '#6B7280' };
            const time = formatRelativeTime(activity.timestamp);

            return `
                <div class="fd__activity-item">
                    <div class="fd__activity-icon" style="--icon-color: ${cat.color}">
                        <i data-lucide="${cat.icon}"></i>
                    </div>
                    <div class="fd__activity-content">
                        <span class="fd__activity-member">${activity.memberName}</span>
                        <span class="fd__activity-text">${activity.details}</span>
                    </div>
                    <span class="fd__activity-time">${time}</span>
                </div>
            `;
        }).join('');
    }

    /**
     * Format relative time (e.g., "5m ago", "2h ago")
     */
    function formatRelativeTime(timestamp) {
        const now = new Date();
        const then = new Date(timestamp);
        const diffMs = now - then;
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;

        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;

        const diffDays = Math.floor(diffHours / 24);
        if (diffDays === 1) return 'Yesterday';
        return `${diffDays}d ago`;
    }

    /**
     * Render week overview
     */
    function renderWeekOverview() {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const today = new Date();
        const todayIdx = (today.getDay() + 6) % 7; // Monday = 0

        // Get activity counts for each day this week
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - todayIdx);

        const dayCounts = days.map((_, idx) => {
            const date = new Date(weekStart);
            date.setDate(weekStart.getDate() + idx);
            const dateStr = date.toISOString().split('T')[0];

            // Count activities for this date
            const dayLog = Storage.getActivityLog({ startDate: dateStr, endDate: dateStr });
            return dayLog.length;
        });

        const maxCount = Math.max(...dayCounts, 1);

        return `
            <div class="fd__week-days">
                ${days.map((day, idx) => {
                    const count = dayCounts[idx];
                    const height = (count / maxCount) * 100;
                    const isToday = idx === todayIdx;
                    const isPast = idx < todayIdx;

                    return `
                        <div class="fd__week-day ${isToday ? 'fd__week-day--today' : ''} ${isPast ? 'fd__week-day--past' : ''}">
                            <div class="fd__week-bar-container">
                                <div class="fd__week-bar" style="height: ${Math.max(height, 5)}%"></div>
                            </div>
                            <span class="fd__week-label">${day}</span>
                            ${count > 0 ? `<span class="fd__week-count">${count}</span>` : ''}
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    /**
     * Render family goals/challenges
     */
    function renderFamilyGoals() {
        const settings = Storage.getSettings();
        const challenges = settings.familyChallenges || [];

        if (challenges.length === 0) {
            return `
                <div class="fd__goals-empty">
                    <i data-lucide="target"></i>
                    <p>No family goals yet</p>
                    <span>Create goals to motivate the whole family!</span>
                </div>
            `;
        }

        return challenges.slice(0, 3).map(challenge => {
            const progress = challenge.progress || 0;
            const target = challenge.target || 100;
            const percentage = Math.min(Math.round((progress / target) * 100), 100);

            return `
                <div class="fd__goal-card" data-challenge-id="${challenge.id}">
                    <div class="fd__goal-icon">
                        <i data-lucide="${challenge.icon || 'target'}"></i>
                    </div>
                    <div class="fd__goal-content">
                        <div class="fd__goal-title">${challenge.title}</div>
                        <div class="fd__goal-progress-bar">
                            <div class="fd__goal-progress-fill" style="width: ${percentage}%"></div>
                        </div>
                        <div class="fd__goal-stats">${progress} / ${target}</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Bind events for new dashboard
     */
    function bindNewEvents(container) {
        // Back button
        container.querySelector('#dashboardBackBtn')?.addEventListener('click', () => {
            if (typeof Tabs !== 'undefined') {
                Tabs.switchTo('home');
            }
        });

        // Settings button
        container.querySelector('#dashboardSettingsBtn')?.addEventListener('click', () => {
            if (typeof Tabs !== 'undefined') {
                Tabs.switchTo('settings');
            }
        });

        // View full calendar
        container.querySelector('#viewFullCalendarBtn')?.addEventListener('click', () => {
            if (typeof Calendar !== 'undefined') {
                Calendar.showFullCalendar();
            }
        });

        // Full activity view
        container.querySelector('#showFullActivityBtn')?.addEventListener('click', () => {
            showActivityPage(container);
        });

        // Add challenge
        container.querySelector('#addChallengeBtn')?.addEventListener('click', () => {
            showAddChallengeModal(container);
        });

        // Member cards - click to go to member dashboard
        container.querySelectorAll('.fd__member-card').forEach(card => {
            card.addEventListener('click', () => {
                const memberId = card.dataset.memberId;
                if (typeof Tabs !== 'undefined') {
                    Tabs.switchTo(memberId);
                }
            });
        });

        // Quick action buttons
        container.querySelectorAll('.fd__action-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                handleQuickAction(btn.dataset.action);
            });
        });

        // Attention items
        container.querySelectorAll('.fd__attention-item').forEach(item => {
            item.addEventListener('click', () => {
                handleAttentionItem(item.dataset.type, item.dataset.member);
            });
        });

        // Goal cards - click to edit
        container.querySelectorAll('.fd__goal-card').forEach(card => {
            card.addEventListener('click', () => {
                const challengeId = card.dataset.challengeId;
                showEditChallengeModal(container, challengeId);
            });
        });

        // Empty state add member button
        container.querySelector('.fd__empty-members [data-action="addMember"]')?.addEventListener('click', () => {
            handleQuickAction('addMember');
        });
    }

    /**
     * Handle attention item click
     */
    function handleAttentionItem(type, memberId) {
        switch (type) {
            case 'reward-request':
                if (memberId && typeof Tabs !== 'undefined') {
                    Tabs.switchTo(memberId);
                    // Could also open the rewards widget directly
                }
                break;
            case 'screen-limit':
            case 'overdue-task':
                if (memberId && typeof Tabs !== 'undefined') {
                    Tabs.switchTo(memberId);
                }
                break;
            case 'grocery':
                // Navigate to grocery widget or adult with grocery
                const members = Storage.getMembers();
                const adultWithGrocery = members.find(m => m.type === 'adult');
                if (adultWithGrocery && typeof Tabs !== 'undefined') {
                    Tabs.switchTo(adultWithGrocery.id);
                }
                break;
        }
    }

    /**
     * Show edit challenge modal
     */
    function showEditChallengeModal(pageContainer, challengeId) {
        const settings = Storage.getSettings();
        const challenge = (settings.familyChallenges || []).find(c => c.id === challengeId);

        if (!challenge) return;

        const content = `
            <form id="editChallengeForm">
                <div class="form-group">
                    <label class="form-label">Current Progress</label>
                    <input type="number" class="form-input" id="challengeProgress"
                           value="${challenge.progress || 0}" min="0" max="${challenge.target}">
                    <span class="form-hint">Target: ${challenge.target}</span>
                </div>
            </form>
        `;

        Modal.open({
            title: `Update: ${challenge.title}`,
            content,
            footer: `
                <button class="btn btn--ghost" data-action="cancel">Cancel</button>
                <button class="btn btn--danger btn--sm" data-action="delete">Delete</button>
                <button class="btn btn--primary" data-action="confirm">Update</button>
            `
        });

        Modal.bindFooterEvents(() => {
            const newProgress = parseInt(document.getElementById('challengeProgress')?.value) || 0;
            challenge.progress = newProgress;
            Storage.updateSettings(settings);
            Toast.success('Goal updated!');
            render(pageContainer);
            return true;
        }, () => {
            // Delete handler
            settings.familyChallenges = settings.familyChallenges.filter(c => c.id !== challengeId);
            Storage.updateSettings(settings);
            Toast.success('Goal removed');
            Modal.close();
            render(pageContainer);
        });
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
     * Show full activity page (uses central activity log)
     */
    function showActivityPage(container) {
        const members = Storage.getMembers();
        const categories = Storage.getActivityCategories();
        const stats = Storage.getActivityStats();
        const activityLog = Storage.getActivityLog({ limit: 500 });

        // Get unique categories for filters
        const activeCategories = [...new Set(activityLog.map(a => a.category))];

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
                                <span class="activity-hero-stat__value">${stats.today}</span>
                                <span class="activity-hero-stat__label">Today</span>
                            </div>
                            <div class="activity-hero-stat">
                                <span class="activity-hero-stat__value">${stats.thisWeek}</span>
                                <span class="activity-hero-stat__label">This Week</span>
                            </div>
                            <div class="activity-hero-stat">
                                <span class="activity-hero-stat__value">${members.length}</span>
                                <span class="activity-hero-stat__label">Members</span>
                            </div>
                            <div class="activity-hero-stat">
                                <span class="activity-hero-stat__value">${stats.total}</span>
                                <span class="activity-hero-stat__label">Total</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Filters -->
                <div class="activity-page__filters">
                    <div class="activity-filter-row">
                        <div class="activity-filter-group">
                            <span class="activity-filter-label">Category:</span>
                            <div class="activity-filter-chips" id="typeFilters">
                                <button class="activity-filter-chip activity-filter-chip--active" data-filter-type="all">
                                    All
                                </button>
                                ${activeCategories.map(catId => {
                                    const cat = categories[catId] || { name: catId, icon: 'circle' };
                                    return `
                                        <button class="activity-filter-chip" data-filter-type="${catId}">
                                            <i data-lucide="${cat.icon}"></i>
                                            ${cat.name}
                                        </button>
                                    `;
                                }).join('')}
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
                    ${renderActivityList(activityLog, categories)}
                </div>
            </div>
        `;

        if (typeof lucide !== 'undefined') lucide.createIcons();
        bindActivityPageEvents(container, members, activityLog, categories);
    }

    /**
     * Render activity list grouped by date (uses central activity log format)
     */
    function renderActivityList(activities, categories, categoryFilter = 'all', memberFilter = 'all') {
        let filtered = activities;

        if (categoryFilter !== 'all') {
            filtered = filtered.filter(a => a.category === categoryFilter);
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
            const date = activity.timestamp.split('T')[0];
            if (!grouped[date]) {
                grouped[date] = [];
            }
            grouped[date].push(activity);
        });

        // Sort dates descending
        const sortedDates = Object.keys(grouped).sort().reverse();

        const today = DateUtils.today();
        const yesterday = DateUtils.addDays(today, -1);

        return sortedDates.map(date => {
            const dayActivities = grouped[date];
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
                        ${dayActivities.map(activity => {
                            const cat = categories[activity.category] || { icon: 'circle', color: '#6B7280', name: activity.category };
                            const time = new Date(activity.timestamp).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true
                            });
                            return `
                                <div class="activity-item activity-item--full">
                                    <div class="activity-item__icon" style="background-color: ${cat.color}20; color: ${cat.color}">
                                        <i data-lucide="${cat.icon}"></i>
                                    </div>
                                    <div class="activity-item__content">
                                        <span class="activity-item__member">${activity.memberName}</span>
                                        <span class="activity-item__text">${activity.details}</span>
                                    </div>
                                    <div class="activity-item__meta">
                                        <span class="activity-item__time">${time}</span>
                                        <span class="activity-item__badge activity-item__badge--${activity.category}">
                                            ${cat.name}
                                        </span>
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
     * Bind activity page events
     */
    function bindActivityPageEvents(container, members, activityLog, categories) {
        let currentCategoryFilter = 'all';
        let currentMemberFilter = 'all';

        // Back button
        container.querySelector('#activityBackBtn')?.addEventListener('click', () => {
            render(container);
        });

        // Category filter chips
        container.querySelectorAll('[data-filter-type]').forEach(chip => {
            chip.addEventListener('click', () => {
                currentCategoryFilter = chip.dataset.filterType;
                // Update active state
                container.querySelectorAll('[data-filter-type]').forEach(c =>
                    c.classList.remove('activity-filter-chip--active')
                );
                chip.classList.add('activity-filter-chip--active');
                // Re-render list
                const contentEl = container.querySelector('.activity-page__content');
                if (contentEl) {
                    contentEl.innerHTML = renderActivityList(activityLog, categories, currentCategoryFilter, currentMemberFilter);
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
                    contentEl.innerHTML = renderActivityList(activityLog, categories, currentCategoryFilter, currentMemberFilter);
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
