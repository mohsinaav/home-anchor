/**
 * Landing Page JavaScript
 * Home Anchor - Family Organization App
 */

(function() {
    'use strict';

    // =========================================================================
    // DEMO DATA LOADER
    // =========================================================================

    /**
     * Load demo data into localStorage and redirect to app
     */
    function loadDemoAndRedirect() {
        // Check if Storage module is available
        if (typeof Storage !== 'undefined' && typeof Storage.loadDemoData === 'function') {
            Storage.loadDemoData();
        } else {
            // Fallback: create demo data directly
            createDemoData();
        }

        // Set demo mode flag
        localStorage.setItem('homeAnchor_demo', 'true');

        // Redirect to main app
        window.location.href = 'index.html';
    }

    /**
     * Go to empty app (Get Started flow)
     */
    function goToApp() {
        // Clear any existing demo flag
        localStorage.removeItem('homeAnchor_demo');

        // Redirect to main app
        window.location.href = 'index.html';
    }

    /**
     * Create demo data (fallback if Storage module not available)
     */
    function createDemoData() {
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

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
                { id: 'demo-baby', name: 'Baby Emma', type: 'toddler', icon: 'baby', removable: true }
            ],
            members: [
                {
                    id: 'demo-mom',
                    name: 'Mom',
                    type: 'adult',
                    avatar: { type: 'initials', value: 'M', color: '#8B5CF6' },
                    widgets: ['tasks', 'meals', 'workout', 'habits', 'gratitude'],
                    createdAt: new Date().toISOString()
                },
                {
                    id: 'demo-dad',
                    name: 'Dad',
                    type: 'adult',
                    avatar: { type: 'initials', value: 'D', color: '#3B82F6' },
                    widgets: ['tasks', 'meals', 'workout', 'journal'],
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
                    id: 'demo-baby',
                    name: 'Baby Emma',
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
                        id: 'event-1',
                        title: 'Soccer Practice',
                        date: today,
                        memberId: 'demo-alex',
                        icon: 'dribbble',
                        color: '#10B981'
                    },
                    {
                        id: 'event-2',
                        title: 'Pediatrician Visit',
                        date: today,
                        memberId: 'demo-baby',
                        icon: 'stethoscope',
                        color: '#3B82F6'
                    },
                    {
                        id: 'event-3',
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
                }
            },
            widgetData: {
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
                        { id: 'h5', date: yesterday, activityId: 'a5', activityName: 'Read for 20 min', points: 10, type: 'earned', time: '19:00' }
                    ],
                    settings: {
                        fontSize: 'normal',
                        reducedMotion: false,
                        categoryFilter: 'all'
                    }
                },
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
                'demo-alex_achievements': {
                    unlocked: ['first-points', 'streak-3'],
                    achievements: [
                        { id: 'first-points', name: 'First Points!', description: 'Earned your first points', icon: 'star', unlockedAt: yesterday },
                        { id: 'streak-3', name: '3 Day Streak', description: 'Completed activities 3 days in a row', icon: 'flame', unlockedAt: today }
                    ]
                }
            }
        };

        localStorage.setItem('homeAnchor_data', JSON.stringify(demoData));
    }

    // =========================================================================
    // EVENT BINDINGS
    // =========================================================================

    function bindEvents() {
        // Try Demo buttons
        document.getElementById('tryDemoBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            loadDemoAndRedirect();
        });

        document.getElementById('footerTryDemo')?.addEventListener('click', (e) => {
            e.preventDefault();
            loadDemoAndRedirect();
        });

        // Get Started buttons
        document.getElementById('getStartedBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            goToApp();
        });

        document.getElementById('navGetStarted')?.addEventListener('click', (e) => {
            e.preventDefault();
            goToApp();
        });

        document.getElementById('footerGetStarted')?.addEventListener('click', (e) => {
            e.preventDefault();
            goToApp();
        });

        // Smooth scroll for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                const href = anchor.getAttribute('href');
                if (href && href !== '#') {
                    e.preventDefault();
                    const target = document.querySelector(href);
                    if (target) {
                        target.scrollIntoView({ behavior: 'smooth' });
                    }
                }
            });
        });

        // Contact form submission
        document.getElementById('contactForm')?.addEventListener('submit', handleContactSubmit);
    }

    /**
     * Handle contact form submission
     */
    function handleContactSubmit(e) {
        e.preventDefault();

        const form = e.target;
        const formData = {
            name: form.contactName.value,
            email: form.contactEmail.value,
            type: form.contactType.value,
            message: form.contactMessage.value,
            timestamp: new Date().toISOString()
        };

        // Store feedback locally (for now - can be sent to a backend later)
        const existingFeedback = JSON.parse(localStorage.getItem('homeAnchor_feedback') || '[]');
        existingFeedback.push(formData);
        localStorage.setItem('homeAnchor_feedback', JSON.stringify(existingFeedback));

        // Show success message
        showFormSuccess(form);

        // Reset form
        form.reset();
    }

    /**
     * Show success message after form submission
     */
    function showFormSuccess(form) {
        const submitBtn = form.querySelector('.contact-form__submit');
        const originalContent = submitBtn.innerHTML;

        // Update button to show success
        submitBtn.innerHTML = '<i data-lucide="check-circle"></i> Message Sent!';
        submitBtn.classList.add('btn--success');
        submitBtn.disabled = true;

        // Re-initialize icons for the new icon
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Reset after 3 seconds
        setTimeout(() => {
            submitBtn.innerHTML = originalContent;
            submitBtn.classList.remove('btn--success');
            submitBtn.disabled = false;
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }, 3000);
    }

    // =========================================================================
    // INITIALIZATION
    // =========================================================================

    function init() {
        // Initialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Bind event handlers
        bindEvents();

        // Add loaded class for animations
        document.body.classList.add('landing-loaded');
    }

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
