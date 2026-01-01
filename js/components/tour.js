/**
 * Tour Component - Home Anchor
 * Interactive bubble tutorials for first-time users
 */

const Tour = (function() {
    // Tour state
    let currentTour = null;
    let currentStep = 0;
    let overlay = null;
    let resizeHandler = null;

    // =========================================================================
    // TOUR CONFIGURATIONS
    // =========================================================================

    const TOURS = {
        welcome: {
            id: 'welcome',
            name: 'Welcome Tour',
            steps: [
                {
                    target: '.header__title',
                    title: 'Welcome to Home Anchor!',
                    content: 'Your family organization hub. Let\'s take a quick tour to get you started!',
                    position: 'bottom'
                },
                {
                    target: '#addTabBtn',
                    title: 'Add Family Members',
                    content: 'Click here to add Adults (parents), Kids (ages 4-17), or Toddlers. Each type has different widgets!',
                    position: 'bottom'
                },
                {
                    target: '#tabNav',
                    title: 'Member Tabs',
                    content: 'Each family member gets their own tab. Click to switch between dashboards. Home tab shows everyone.',
                    position: 'bottom'
                },
                {
                    target: '#dashboardBtn',
                    title: 'Family Dashboard',
                    content: 'See all family members at once with their schedules, events, and quick stats.',
                    position: 'left'
                },
                {
                    target: '#settingsBtn',
                    title: 'Settings & Security',
                    content: 'Change your PIN, manage widgets, export data, and replay this tour anytime!',
                    position: 'left'
                }
            ]
        },
        // Adult Member Tour
        'adult-member': {
            id: 'adult-member',
            name: 'Adult Dashboard Tour',
            steps: [
                {
                    target: '.member-main',
                    title: 'Your Personal Dashboard',
                    content: 'This is your personal space! You\'ll find widgets for tasks, meals, workouts, and more.',
                    position: 'bottom',
                    fallback: '.tab-content--member'
                },
                {
                    target: '.widget',
                    title: 'Widgets',
                    content: 'Each card is a widget. Click on them to expand, add items, or manage content.',
                    position: 'bottom',
                    fallback: '.member-main'
                },
                {
                    target: '.layout-toggle-group',
                    title: 'Switch View Mode',
                    content: 'Toggle between Focus View (one widget at a time) and Grid View (see all widgets at once).',
                    position: 'bottom',
                    fallback: '.adult-layout-header'
                },
                {
                    target: '#addWidgetBtn',
                    title: 'Add New Widgets',
                    content: 'Click here to add more widgets to your dashboard - recipes, habits, journal, vision board, and more!',
                    position: 'top',
                    fallback: '.add-widget-btn'
                },
                {
                    target: '.member-sidebar',
                    title: 'Daily Schedule',
                    content: 'Your schedule appears here. Add time blocks for activities, appointments, and routines.',
                    position: 'left',
                    fallback: '#scheduleSidebar'
                }
            ]
        },
        // Kid Member Tour
        'kid-member': {
            id: 'kid-member',
            name: 'Kid Dashboard Tour',
            steps: [
                {
                    target: '.member-main',
                    title: 'Your Fun Dashboard!',
                    content: 'Welcome to your special space! Here you can earn points, get rewards, and track your achievements!',
                    position: 'bottom',
                    fallback: '.tab-content--member'
                },
                {
                    target: '.layout-toggle-group',
                    title: 'Switch View Mode',
                    content: 'Toggle between Focus View (one widget at a time) and Grid View (see all widgets at once).',
                    position: 'bottom',
                    fallback: '.kids-layout-header'
                },
                {
                    target: '.widget[data-widget-id="points"]',
                    title: 'Points Widget',
                    content: 'Complete activities to earn points! Tap an activity when you finish it to collect your points.',
                    position: 'bottom',
                    fallback: '.points-widget'
                },
                {
                    target: '.widget[data-widget-id="rewards"]',
                    title: 'Rewards Widget',
                    content: 'Spend your points on awesome rewards! The more points you save, the bigger rewards you can get!',
                    position: 'bottom',
                    fallback: '.rewards-widget'
                },
                {
                    target: '.widget[data-widget-id="achievements"]',
                    title: 'Achievements',
                    content: 'Earn badges for your accomplishments! Can you collect them all?',
                    position: 'bottom',
                    fallback: '.member-main'
                },
                {
                    target: '#addWidgetBtn',
                    title: 'Add More Widgets',
                    content: 'Add more fun widgets like Chores, Workout, Journal, and more!',
                    position: 'top',
                    fallback: '.add-widget-btn'
                }
            ]
        },
        // Toddler Member Tour
        'toddler-member': {
            id: 'toddler-member',
            name: 'Toddler Dashboard Tour',
            steps: [
                {
                    target: '.member-main',
                    title: 'Toddler Dashboard',
                    content: 'This simple dashboard helps track your little one\'s routines, activities, and milestones.',
                    position: 'bottom',
                    fallback: '.tab-content--member'
                },
                {
                    target: '.widget[data-widget-id="toddler-routine"]',
                    title: 'Daily Routine',
                    content: 'Visual checklist for daily activities like meals, naps, and playtime. Great for establishing routines!',
                    position: 'bottom',
                    fallback: '.member-main'
                },
                {
                    target: '.widget[data-widget-id="activities"]',
                    title: 'Activity Ideas',
                    content: 'Get age-appropriate activity suggestions to keep your toddler engaged and learning.',
                    position: 'bottom',
                    fallback: '.member-main'
                }
            ]
        },
        // Points System Deep Dive
        'kids-points': {
            id: 'kids-points',
            name: 'Points System Tour',
            steps: [
                {
                    target: '.points-widget__balance-card',
                    title: 'Points & Level',
                    content: 'See your points balance, current level, and streak. Complete activities daily to grow your streak!',
                    position: 'bottom'
                },
                {
                    target: '.points-widget__xp-section',
                    title: 'Experience Points',
                    content: 'Every activity earns XP! Level up by earning more XP. Higher levels unlock cool rank titles!',
                    position: 'bottom',
                    fallback: '.points-widget__balance-card'
                },
                {
                    target: '.points-widget__activities',
                    title: 'Activities to Complete',
                    content: 'Tap any activity when you finish it to earn points. Colors show different categories.',
                    position: 'top'
                },
                {
                    target: '[data-action="manage-points"]',
                    title: 'For Parents',
                    content: 'Parents can manage activities, set point values, and adjust daily goals from here.',
                    position: 'top',
                    fallback: '.points-widget__footer'
                }
            ]
        },
        // Rewards Deep Dive
        rewards: {
            id: 'rewards',
            name: 'Rewards Tour',
            steps: [
                {
                    target: '.rewards-widget__balance',
                    title: 'Your Points Balance',
                    content: 'This shows how many points you have to spend. Earn more by completing activities!',
                    position: 'bottom',
                    fallback: '.rewards-widget'
                },
                {
                    target: '.rewards-widget__grid',
                    title: 'Choose Your Rewards',
                    content: 'Browse available rewards. Each shows its cost. When you have enough points, tap to redeem!',
                    position: 'top',
                    fallback: '.rewards-widget'
                },
                {
                    target: '[data-action="manage-rewards"]',
                    title: 'Manage Rewards',
                    content: 'Parents can add custom rewards with any point cost - screen time, treats, outings, and more!',
                    position: 'top',
                    fallback: '.rewards-widget__footer'
                }
            ]
        },
        // Schedule Tour
        schedule: {
            id: 'schedule',
            name: 'Schedule Tour',
            steps: [
                {
                    target: '.member-sidebar',
                    title: 'Daily Schedule',
                    content: 'This sidebar shows the day\'s schedule with time blocks for different activities.',
                    position: 'left',
                    fallback: '#scheduleSidebar'
                },
                {
                    target: '.schedule-sidebar__add',
                    title: 'Add Schedule Blocks',
                    content: 'Click to add time blocks. Set the activity, time, and icon for each part of the day.',
                    position: 'left',
                    fallback: '.member-sidebar'
                }
            ]
        },
        // Calendar Tour
        calendar: {
            id: 'calendar',
            name: 'Calendar Tour',
            steps: [
                {
                    target: '#calendarContainer',
                    title: 'Family Calendar',
                    content: 'Track family events, appointments, and important dates. Everyone can see what\'s coming up!',
                    position: 'top',
                    fallback: '.section'
                },
                {
                    target: '.calendar__nav',
                    title: 'Navigate Months',
                    content: 'Use arrows to move between months. Click any date to add or view events.',
                    position: 'bottom',
                    fallback: '#calendarContainer'
                }
            ]
        }
    };

    // =========================================================================
    // INITIALIZATION
    // =========================================================================

    function init() {
        // Check if we should show welcome tour
        const settings = Storage.getSettings();
        const onboarding = settings.onboarding || {};

        // Only show welcome tour if not completed and not skipped
        if (!onboarding.welcomeTourComplete && !onboarding.skipAllTours) {
            // Small delay to let the app render first
            setTimeout(() => {
                start('welcome');
            }, 800);
        }
    }

    // =========================================================================
    // TOUR CONTROL
    // =========================================================================

    function start(tourId) {
        const tour = TOURS[tourId];
        if (!tour) {
            console.warn(`Tour "${tourId}" not found`);
            return;
        }

        // Check if already completed
        if (!shouldShow(tourId)) {
            return;
        }

        currentTour = tour;
        currentStep = 0;

        createOverlay();
        showStep(currentStep);

        // Handle window resize
        resizeHandler = debounce(() => {
            if (currentTour) {
                positionBubble(currentTour.steps[currentStep]);
            }
        }, 100);
        window.addEventListener('resize', resizeHandler);
    }

    function nextStep() {
        if (!currentTour) return;

        currentStep++;
        if (currentStep >= currentTour.steps.length) {
            complete(currentTour.id);
            end();
        } else {
            showStep(currentStep);
        }
    }

    function prevStep() {
        if (!currentTour || currentStep <= 0) return;

        currentStep--;
        showStep(currentStep);
    }

    function end() {
        if (overlay) {
            overlay.classList.add('tour-overlay--closing');
            setTimeout(() => {
                overlay.remove();
                overlay = null;
            }, 300);
        }

        if (resizeHandler) {
            window.removeEventListener('resize', resizeHandler);
            resizeHandler = null;
        }

        currentTour = null;
        currentStep = 0;
    }

    function skip() {
        if (currentTour) {
            // Mark as complete even though skipped
            markTourComplete(currentTour.id);
        }
        end();
    }

    function skipAll() {
        const settings = Storage.getSettings();
        settings.onboarding = settings.onboarding || {};
        settings.onboarding.skipAllTours = true;
        Storage.updateSettings(settings);
        end();
    }

    // =========================================================================
    // STEP RENDERING
    // =========================================================================

    function showStep(stepIndex) {
        const step = currentTour.steps[stepIndex];
        if (!step) return;

        // Find target element
        let targetEl = document.querySelector(step.target);

        // Try fallback if target not found
        if (!targetEl && step.fallback) {
            targetEl = document.querySelector(step.fallback);
        }

        if (!targetEl) {
            console.warn(`Tour target "${step.target}" not found, skipping step`);
            // Skip to next step if target not found
            if (stepIndex < currentTour.steps.length - 1) {
                currentStep++;
                showStep(currentStep);
            } else {
                end();
            }
            return;
        }

        // Update spotlight and bubble
        positionSpotlight(targetEl);
        renderBubble(step, stepIndex);
        positionBubble(step, targetEl);

        // Scroll target into view if needed
        scrollIntoViewIfNeeded(targetEl);
    }

    function createOverlay() {
        overlay = document.createElement('div');
        overlay.className = 'tour-overlay';
        overlay.innerHTML = `
            <div class="tour-spotlight"></div>
            <div class="tour-bubble">
                <div class="tour-bubble__arrow"></div>
                <div class="tour-bubble__header">
                    <span class="tour-bubble__step"></span>
                    <button class="tour-bubble__close" aria-label="Close tour">
                        <i data-lucide="x"></i>
                    </button>
                </div>
                <h4 class="tour-bubble__title"></h4>
                <p class="tour-bubble__content"></p>
                <div class="tour-bubble__footer">
                    <button class="tour-bubble__skip">Skip Tour</button>
                    <div class="tour-bubble__nav">
                        <button class="tour-bubble__prev">
                            <i data-lucide="chevron-left"></i>
                            Back
                        </button>
                        <button class="tour-bubble__next">
                            Next
                            <i data-lucide="chevron-right"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // Initialize icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Bind events
        bindOverlayEvents();
    }

    function renderBubble(step, stepIndex) {
        const bubble = overlay.querySelector('.tour-bubble');
        const totalSteps = currentTour.steps.length;

        // Update content
        bubble.querySelector('.tour-bubble__step').textContent = `${stepIndex + 1} of ${totalSteps}`;
        bubble.querySelector('.tour-bubble__title').textContent = step.title;
        bubble.querySelector('.tour-bubble__content').textContent = step.content;

        // Update navigation buttons
        const prevBtn = bubble.querySelector('.tour-bubble__prev');
        const nextBtn = bubble.querySelector('.tour-bubble__next');

        prevBtn.style.visibility = stepIndex === 0 ? 'hidden' : 'visible';

        if (stepIndex === totalSteps - 1) {
            nextBtn.innerHTML = `Finish <i data-lucide="check"></i>`;
        } else {
            nextBtn.innerHTML = `Next <i data-lucide="chevron-right"></i>`;
        }

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Update arrow position class
        bubble.setAttribute('data-position', step.position || 'bottom');
    }

    function positionSpotlight(targetEl) {
        const spotlight = overlay.querySelector('.tour-spotlight');
        const rect = targetEl.getBoundingClientRect();
        const padding = 8;

        spotlight.style.top = `${rect.top - padding}px`;
        spotlight.style.left = `${rect.left - padding}px`;
        spotlight.style.width = `${rect.width + padding * 2}px`;
        spotlight.style.height = `${rect.height + padding * 2}px`;
    }

    function positionBubble(step, targetEl) {
        if (!targetEl) {
            targetEl = document.querySelector(step.target);
            if (!targetEl && step.fallback) {
                targetEl = document.querySelector(step.fallback);
            }
        }
        if (!targetEl) return;

        const bubble = overlay.querySelector('.tour-bubble');
        const rect = targetEl.getBoundingClientRect();
        const bubbleRect = bubble.getBoundingClientRect();
        const position = step.position || 'bottom';
        const gap = 16;
        const arrowSize = 12;

        let top, left;

        switch (position) {
            case 'top':
                top = rect.top - bubbleRect.height - gap - arrowSize;
                left = rect.left + (rect.width - bubbleRect.width) / 2;
                break;
            case 'bottom':
                top = rect.bottom + gap + arrowSize;
                left = rect.left + (rect.width - bubbleRect.width) / 2;
                break;
            case 'left':
                top = rect.top + (rect.height - bubbleRect.height) / 2;
                left = rect.left - bubbleRect.width - gap - arrowSize;
                break;
            case 'right':
                top = rect.top + (rect.height - bubbleRect.height) / 2;
                left = rect.right + gap + arrowSize;
                break;
        }

        // Keep bubble within viewport
        const viewportPadding = 16;
        const maxLeft = window.innerWidth - bubbleRect.width - viewportPadding;
        const maxTop = window.innerHeight - bubbleRect.height - viewportPadding;

        left = Math.max(viewportPadding, Math.min(left, maxLeft));
        top = Math.max(viewportPadding, Math.min(top, maxTop));

        bubble.style.top = `${top}px`;
        bubble.style.left = `${left}px`;

        // Position arrow
        positionArrow(bubble, rect, position);
    }

    function positionArrow(bubble, targetRect, position) {
        const arrow = bubble.querySelector('.tour-bubble__arrow');
        const bubbleRect = bubble.getBoundingClientRect();

        // Reset arrow styles
        arrow.style.top = '';
        arrow.style.bottom = '';
        arrow.style.left = '';
        arrow.style.right = '';

        switch (position) {
            case 'top':
                arrow.style.bottom = '-10px';
                arrow.style.left = `${Math.min(Math.max(targetRect.left + targetRect.width / 2 - bubbleRect.left, 20), bubbleRect.width - 20)}px`;
                break;
            case 'bottom':
                arrow.style.top = '-10px';
                arrow.style.left = `${Math.min(Math.max(targetRect.left + targetRect.width / 2 - bubbleRect.left, 20), bubbleRect.width - 20)}px`;
                break;
            case 'left':
                arrow.style.right = '-10px';
                arrow.style.top = `${Math.min(Math.max(targetRect.top + targetRect.height / 2 - bubbleRect.top, 20), bubbleRect.height - 20)}px`;
                break;
            case 'right':
                arrow.style.left = '-10px';
                arrow.style.top = `${Math.min(Math.max(targetRect.top + targetRect.height / 2 - bubbleRect.top, 20), bubbleRect.height - 20)}px`;
                break;
        }
    }

    function scrollIntoViewIfNeeded(element) {
        const rect = element.getBoundingClientRect();
        const isInViewport = (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= window.innerHeight &&
            rect.right <= window.innerWidth
        );

        if (!isInViewport) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Reposition after scroll
            setTimeout(() => {
                if (currentTour) {
                    positionSpotlight(element);
                    positionBubble(currentTour.steps[currentStep], element);
                }
            }, 400);
        }
    }

    // =========================================================================
    // EVENT HANDLING
    // =========================================================================

    function bindOverlayEvents() {
        // Close button
        overlay.querySelector('.tour-bubble__close').addEventListener('click', skip);

        // Skip button
        overlay.querySelector('.tour-bubble__skip').addEventListener('click', skip);

        // Navigation
        overlay.querySelector('.tour-bubble__prev').addEventListener('click', prevStep);
        overlay.querySelector('.tour-bubble__next').addEventListener('click', nextStep);

        // Keyboard navigation
        document.addEventListener('keydown', handleKeydown);

        // Click on overlay to close (optional)
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                // Don't close on overlay click - user might miss important info
                // skip();
            }
        });
    }

    function handleKeydown(e) {
        if (!currentTour) return;

        switch (e.key) {
            case 'Escape':
                skip();
                break;
            case 'ArrowRight':
            case 'Enter':
                nextStep();
                break;
            case 'ArrowLeft':
                prevStep();
                break;
        }
    }

    // =========================================================================
    // STATE MANAGEMENT
    // =========================================================================

    function shouldShow(tourId) {
        const settings = Storage.getSettings();
        const onboarding = settings.onboarding || {};

        // Check if all tours are skipped
        if (onboarding.skipAllTours) {
            return false;
        }

        // Check specific tour completion
        if (tourId === 'welcome') {
            return !onboarding.welcomeTourComplete;
        }

        // Check if tour is in completed list
        const completedTours = onboarding.toursCompleted || [];
        return !completedTours.includes(tourId);
    }

    function complete(tourId) {
        markTourComplete(tourId);
    }

    function markTourComplete(tourId) {
        const settings = Storage.getSettings();
        settings.onboarding = settings.onboarding || {
            welcomeTourComplete: false,
            toursCompleted: [],
            lastTourDate: null,
            skipAllTours: false
        };

        if (tourId === 'welcome') {
            settings.onboarding.welcomeTourComplete = true;
        }

        if (!settings.onboarding.toursCompleted) {
            settings.onboarding.toursCompleted = [];
        }
        if (!settings.onboarding.toursCompleted.includes(tourId)) {
            settings.onboarding.toursCompleted.push(tourId);
        }

        settings.onboarding.lastTourDate = new Date().toISOString();
        Storage.updateSettings(settings);
    }

    function resetTours() {
        const settings = Storage.getSettings();
        settings.onboarding = {
            welcomeTourComplete: false,
            toursCompleted: [],
            lastTourDate: null,
            skipAllTours: false
        };
        Storage.updateSettings(settings);
    }

    function isActive() {
        return currentTour !== null;
    }

    // =========================================================================
    // UTILITY FUNCTIONS
    // =========================================================================

    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // =========================================================================
    // CONTEXT TOURS - Triggered from other components
    // =========================================================================

    function showPointsTour() {
        if (shouldShow('kids-points')) {
            setTimeout(() => start('kids-points'), 500);
        }
    }

    function showRewardsTour() {
        if (shouldShow('rewards')) {
            setTimeout(() => start('rewards'), 500);
        }
    }

    function showAdultMemberTour() {
        if (shouldShow('adult-member')) {
            setTimeout(() => start('adult-member'), 500);
        }
    }

    function showKidMemberTour() {
        if (shouldShow('kid-member')) {
            setTimeout(() => start('kid-member'), 500);
        }
    }

    function showToddlerMemberTour() {
        if (shouldShow('toddler-member')) {
            setTimeout(() => start('toddler-member'), 500);
        }
    }

    function showScheduleTour() {
        if (shouldShow('schedule')) {
            setTimeout(() => start('schedule'), 500);
        }
    }

    function showCalendarTour() {
        if (shouldShow('calendar')) {
            setTimeout(() => start('calendar'), 500);
        }
    }

    /**
     * Show member-specific tour based on member type
     * Called when navigating to a member tab for the first time
     */
    function showMemberTour(memberType) {
        switch (memberType) {
            case 'adult':
                showAdultMemberTour();
                break;
            case 'kid':
                showKidMemberTour();
                break;
            case 'toddler':
                showToddlerMemberTour();
                break;
        }
    }

    // =========================================================================
    // PUBLIC API
    // =========================================================================

    return {
        init,
        start,
        end,
        skip,
        skipAll,
        nextStep,
        prevStep,
        shouldShow,
        resetTours,
        isActive,
        // Context tours
        showPointsTour,
        showRewardsTour,
        showAdultMemberTour,
        showKidMemberTour,
        showToddlerMemberTour,
        showScheduleTour,
        showCalendarTour,
        showMemberTour,
        // For settings page
        TOURS
    };
})();
