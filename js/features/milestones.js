/**
 * Milestones Feature
 * Track developmental milestones for toddlers
 */

const Milestones = (function() {
    // Milestone categories by age range
    const MILESTONE_CATEGORIES = {
        physical: {
            name: 'Physical',
            icon: 'footprints',
            items: [
                { id: 'phy-1', name: 'Walks independently', ageRange: '12-15m' },
                { id: 'phy-2', name: 'Runs', ageRange: '18-24m' },
                { id: 'phy-3', name: 'Climbs stairs', ageRange: '18-24m' },
                { id: 'phy-4', name: 'Kicks ball', ageRange: '18-24m' },
                { id: 'phy-5', name: 'Jumps with both feet', ageRange: '24-30m' },
                { id: 'phy-6', name: 'Pedals tricycle', ageRange: '30-36m' }
            ]
        },
        language: {
            name: 'Language',
            icon: 'message-circle',
            items: [
                { id: 'lan-1', name: 'Says first words', ageRange: '12-15m' },
                { id: 'lan-2', name: 'Knows 10+ words', ageRange: '15-18m' },
                { id: 'lan-3', name: 'Combines 2 words', ageRange: '18-24m' },
                { id: 'lan-4', name: 'Uses simple sentences', ageRange: '24-30m' },
                { id: 'lan-5', name: 'Asks questions', ageRange: '24-30m' },
                { id: 'lan-6', name: 'Tells simple stories', ageRange: '30-36m' }
            ]
        },
        cognitive: {
            name: 'Cognitive',
            icon: 'brain',
            items: [
                { id: 'cog-1', name: 'Points to objects', ageRange: '12-15m' },
                { id: 'cog-2', name: 'Sorts shapes/colors', ageRange: '18-24m' },
                { id: 'cog-3', name: 'Completes simple puzzles', ageRange: '24-30m' },
                { id: 'cog-4', name: 'Counts to 5', ageRange: '24-30m' },
                { id: 'cog-5', name: 'Knows some letters', ageRange: '30-36m' },
                { id: 'cog-6', name: 'Understands time concepts', ageRange: '30-36m' }
            ]
        },
        social: {
            name: 'Social',
            icon: 'users',
            items: [
                { id: 'soc-1', name: 'Plays alongside others', ageRange: '18-24m' },
                { id: 'soc-2', name: 'Shows empathy', ageRange: '18-24m' },
                { id: 'soc-3', name: 'Takes turns', ageRange: '24-30m' },
                { id: 'soc-4', name: 'Plays cooperatively', ageRange: '30-36m' },
                { id: 'soc-5', name: 'Has imaginary play', ageRange: '24-30m' },
                { id: 'soc-6', name: 'Shows independence', ageRange: '30-36m' }
            ]
        }
    };

    /**
     * Render the milestones widget for a member
     */
    function renderWidget(container, memberId) {
        const widgetData = Storage.getWidgetData(memberId, 'milestones') || {
            achieved: [],
            notes: {}
        };

        const achievedCount = widgetData.achieved?.length || 0;
        const totalMilestones = Object.values(MILESTONE_CATEGORIES)
            .reduce((sum, cat) => sum + cat.items.length, 0);

        // Get recent achievements
        const recentAchievements = widgetData.achieved?.slice(0, 3) || [];

        container.innerHTML = `
            <div class="milestones-widget">
                <div class="milestones-widget__summary">
                    <div class="milestones-progress">
                        <div class="milestones-progress__bar" style="width: ${(achievedCount / totalMilestones) * 100}%"></div>
                    </div>
                    <span class="milestones-widget__count">${achievedCount} of ${totalMilestones} milestones</span>
                </div>

                ${recentAchievements.length > 0 ? `
                    <div class="milestones-widget__recent">
                        <h4 class="milestones-widget__title">Recently Achieved</h4>
                        ${recentAchievements.map(m => `
                            <div class="milestone-recent">
                                <i data-lucide="check-circle" class="milestone-recent__icon"></i>
                                <span class="milestone-recent__name">${getMilestoneName(m.id)}</span>
                                <span class="milestone-recent__date">${DateUtils.formatShort(m.date)}</span>
                            </div>
                        `).join('')}
                    </div>
                ` : `
                    <p class="milestones-widget__empty">Start tracking developmental milestones!</p>
                `}

                <div class="milestones-widget__footer">
                    <button class="btn btn--primary btn--sm" data-action="view-all" data-member-id="${memberId}">
                        <i data-lucide="list"></i>
                        View All
                    </button>
                </div>
            </div>
        `;

        // Bind events
        container.querySelector('[data-action="view-all"]')?.addEventListener('click', () => {
            showAllMilestonesModal(memberId, widgetData);
        });
    }

    /**
     * Get milestone name by ID
     */
    function getMilestoneName(milestoneId) {
        for (const category of Object.values(MILESTONE_CATEGORIES)) {
            const milestone = category.items.find(m => m.id === milestoneId);
            if (milestone) return milestone.name;
        }
        return 'Unknown';
    }

    /**
     * Show all milestones modal
     */
    function showAllMilestonesModal(memberId, widgetData) {
        const achievedIds = widgetData.achieved?.map(m => m.id) || [];

        const content = `
            <div class="all-milestones">
                ${Object.entries(MILESTONE_CATEGORIES).map(([key, category]) => `
                    <div class="all-milestones__category">
                        <h4 class="all-milestones__title">
                            <i data-lucide="${category.icon}"></i>
                            ${category.name}
                        </h4>
                        <div class="all-milestones__list">
                            ${category.items.map(milestone => {
                                const isAchieved = achievedIds.includes(milestone.id);
                                return `
                                    <div class="milestone-item ${isAchieved ? 'milestone-item--achieved' : ''}"
                                         data-milestone-id="${milestone.id}">
                                        <button class="milestone-item__checkbox" data-toggle="${milestone.id}">
                                            ${isAchieved ? '<i data-lucide="check"></i>' : ''}
                                        </button>
                                        <div class="milestone-item__content">
                                            <span class="milestone-item__name">${milestone.name}</span>
                                            <span class="milestone-item__age">${milestone.ageRange}</span>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        Modal.open({
            title: 'Developmental Milestones',
            content,
            footer: '<button class="btn btn--primary" data-modal-cancel>Done</button>'
        });

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Toggle milestone
        document.querySelectorAll('[data-toggle]').forEach(btn => {
            btn.addEventListener('click', () => {
                const milestoneId = btn.dataset.toggle;
                toggleMilestone(memberId, milestoneId);
            });
        });

        document.querySelector('[data-modal-cancel]')?.addEventListener('click', () => {
            Modal.close();
            // Refresh widget
            const widgetBody = document.getElementById('widget-milestones');
            if (widgetBody) {
                renderWidget(widgetBody, memberId);
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            }
        });
    }

    /**
     * Toggle milestone achievement
     */
    function toggleMilestone(memberId, milestoneId) {
        // Always fetch fresh data from storage to avoid race conditions
        const widgetData = Storage.getWidgetData(memberId, 'milestones') || {
            achieved: [],
            notes: {}
        };

        const achieved = widgetData.achieved || [];
        const existingIndex = achieved.findIndex(m => m.id === milestoneId);

        let updatedAchieved;
        const wasAchieved = existingIndex >= 0;

        if (wasAchieved) {
            updatedAchieved = achieved.filter(m => m.id !== milestoneId);
        } else {
            updatedAchieved = [{ id: milestoneId, date: DateUtils.today() }, ...achieved];
            Toast.success(`Milestone achieved: ${getMilestoneName(milestoneId)}!`);
        }

        const updatedData = { ...widgetData, achieved: updatedAchieved };
        Storage.setWidgetData(memberId, 'milestones', updatedData);

        // Update UI directly without closing modal for instant feedback
        const milestoneItem = document.querySelector(`[data-milestone-id="${milestoneId}"]`);
        const checkbox = document.querySelector(`[data-toggle="${milestoneId}"]`);

        if (milestoneItem && checkbox) {
            if (wasAchieved) {
                // Remove achieved state
                milestoneItem.classList.remove('milestone-item--achieved');
                checkbox.innerHTML = '';
            } else {
                // Add achieved state
                milestoneItem.classList.add('milestone-item--achieved');
                checkbox.innerHTML = '<i data-lucide="check"></i>';
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            }
        }
    }

    function init() {
        // Initialize milestones feature
    }

    return {
        init,
        renderWidget
    };
})();
