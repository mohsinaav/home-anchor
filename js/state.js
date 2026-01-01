/**
 * State Management Module
 * Handles application state and event dispatching
 */

const State = (function() {
    // Current application state
    let state = {
        activeTab: 'home',
        isAdminMode: false,
        currentDate: new Date(),
        isLoading: false
    };

    // Event listeners
    const listeners = {};

    /**
     * Get current state
     */
    function getState() {
        return { ...state };
    }

    /**
     * Update state and notify listeners
     */
    function setState(updates) {
        const oldState = { ...state };
        state = { ...state, ...updates };

        // Notify listeners of changes
        Object.keys(updates).forEach(key => {
            if (oldState[key] !== state[key]) {
                emit(`${key}Changed`, state[key], oldState[key]);
            }
        });

        emit('stateChanged', state, oldState);
    }

    /**
     * Subscribe to state changes
     */
    function subscribe(event, callback) {
        if (!listeners[event]) {
            listeners[event] = [];
        }
        listeners[event].push(callback);

        // Return unsubscribe function
        return () => {
            listeners[event] = listeners[event].filter(cb => cb !== callback);
        };
    }

    /**
     * Emit an event to all listeners
     */
    function emit(event, ...args) {
        if (listeners[event]) {
            listeners[event].forEach(callback => {
                try {
                    callback(...args);
                } catch (error) {
                    console.error(`Error in event listener for ${event}:`, error);
                }
            });
        }
    }

    /**
     * Set active tab
     */
    function setActiveTab(tabId) {
        setState({ activeTab: tabId });
    }

    /**
     * Get active tab
     */
    function getActiveTab() {
        return state.activeTab;
    }

    /**
     * Set admin mode
     */
    function setAdminMode(isAdmin) {
        setState({ isAdminMode: isAdmin });
    }

    /**
     * Check if in admin mode
     */
    function isAdminMode() {
        return state.isAdminMode;
    }

    /**
     * Set loading state
     */
    function setLoading(isLoading) {
        setState({ isLoading });
    }

    /**
     * Check if loading
     */
    function isLoading() {
        return state.isLoading;
    }

    /**
     * Set current date (for calendar)
     */
    function setCurrentDate(date) {
        setState({ currentDate: date });
    }

    /**
     * Get current date
     */
    function getCurrentDate() {
        return state.currentDate;
    }

    // Public API
    return {
        getState,
        setState,
        subscribe,
        emit,
        setActiveTab,
        getActiveTab,
        setAdminMode,
        isAdminMode,
        setLoading,
        isLoading,
        setCurrentDate,
        getCurrentDate
    };
})();
