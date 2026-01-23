/**
 * Voice Assistant Module
 * Provides voice command functionality for quick actions
 * Uses Web Speech API (browser native)
 */
const VoiceAssistant = (function() {
    let recognition = null;
    let synthesis = null;
    let isListening = false;

    /**
     * Check if browser supports speech recognition
     */
    function isSupported() {
        return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    }

    /**
     * Initialize speech recognition and synthesis
     */
    function init() {
        if (!isSupported()) {
            console.log('Voice Assistant: Speech recognition not supported');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 1;

        synthesis = window.speechSynthesis;

        recognition.onresult = handleResult;
        recognition.onerror = handleError;
        recognition.onend = handleEnd;
        recognition.onstart = handleStart;

        console.log('Voice Assistant: Initialized');
    }

    /**
     * Start listening for voice commands
     */
    function startListening() {
        if (!recognition) {
            Toast.error('Voice recognition not available');
            return;
        }
        if (isListening) return;

        try {
            recognition.start();
        } catch (e) {
            console.error('Voice Assistant: Error starting recognition', e);
            Toast.error('Could not start voice recognition');
        }
    }

    /**
     * Stop listening
     */
    function stopListening() {
        if (recognition && isListening) {
            recognition.stop();
        }
        isListening = false;
        hideListeningModal();
    }

    /**
     * Handle recognition start
     */
    function handleStart() {
        isListening = true;
        showListeningModal();
    }

    /**
     * Handle speech recognition results
     */
    function handleResult(event) {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                finalTranscript += transcript;
            } else {
                interimTranscript += transcript;
            }
        }

        // Update transcript display
        updateTranscript(finalTranscript || interimTranscript);

        // Process final transcript
        if (finalTranscript) {
            processCommand(finalTranscript.trim());
        }
    }

    /**
     * Handle recognition errors
     */
    function handleError(event) {
        console.error('Voice Assistant: Error', event.error);
        isListening = false;
        hideListeningModal();

        switch (event.error) {
            case 'no-speech':
                Toast.warning('No speech detected. Try again.');
                break;
            case 'audio-capture':
                Toast.error('No microphone found. Check your device.');
                break;
            case 'not-allowed':
                Toast.error('Microphone permission denied.');
                break;
            case 'network':
                Toast.error('Network error. Check your connection.');
                break;
            default:
                Toast.error('Voice recognition error. Try again.');
        }
    }

    /**
     * Handle recognition end
     */
    function handleEnd() {
        isListening = false;
        // Modal is hidden after processing command
    }

    /**
     * Process the voice command
     */
    function processCommand(transcript) {
        console.log('Voice Assistant: Processing command:', transcript);

        updateModalStatus('Processing...');

        const result = parseCommand(transcript);

        // Brief delay for visual feedback, then hide modal and refresh
        setTimeout(() => {
            hideListeningModal();

            if (result.success) {
                // Refresh the dashboard FIRST to show changes immediately
                if (result.refresh !== false) {
                    refreshDashboard();
                }
                // Then provide feedback (toast/TTS) - user sees change while hearing confirmation
                feedback(result.message);
            } else {
                Toast.warning(result.message);
            }
        }, 300);
    }

    /**
     * Get all store names for pattern matching (includes custom stores)
     */
    function getStoreNamesForMatching(memberId) {
        const data = Storage.getWidgetData(memberId, 'grocery') || { stores: [] };
        const stores = data.stores || [];

        // Default stores that are always recognized
        const defaultStores = [
            'walmart', 'target', 'costco', 'aldi', 'kroger',
            'safeway', 'whole foods', "trader joe's", 'trader joes'
        ];

        // Add custom store names
        const customStoreNames = stores.map(s => s.name.toLowerCase());

        // Combine and dedupe
        const allStores = [...new Set([...defaultStores, ...customStoreNames])];

        return allStores;
    }

    /**
     * Try to match a store name from text
     */
    function extractStoreFromText(text, memberId) {
        const storeNames = getStoreNamesForMatching(memberId);

        // Sort by length descending so we match longer names first (e.g., "whole foods" before "foods")
        const sortedStores = storeNames.sort((a, b) => b.length - a.length);

        for (const storeName of sortedStores) {
            // Escape special regex characters in store name
            const escaped = storeName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

            // Check "add X to [store]" pattern
            const toStoreMatch = text.match(new RegExp(`^add\\s+(.+?)\\s+to\\s+(?:the\\s+)?${escaped}(?:\\s+list)?$`, 'i'));
            if (toStoreMatch) {
                return { item: toStoreMatch[1], store: storeName };
            }

            // Check "[store] X" pattern (store name at start)
            const storeFirstMatch = text.match(new RegExp(`^${escaped}\\s+(.+)$`, 'i'));
            if (storeFirstMatch) {
                return { item: storeFirstMatch[1], store: storeName };
            }
        }

        return null;
    }

    /**
     * Parse and execute the command
     */
    function parseCommand(transcript) {
        const text = transcript.toLowerCase().trim();
        const memberId = State.getActiveTab();

        if (!memberId || memberId === 'home' || memberId === 'settings') {
            return { success: false, message: 'Please select a family member first' };
        }

        // ==================== TASK COMMANDS (require "task" keyword) ====================

        // Add task: "add task [text]" or "new task [text]"
        const taskMatch = text.match(/^(add|new|create)\s+task\s+(.+)/i);
        if (taskMatch) {
            return executeAddTask(memberId, taskMatch[2]);
        }

        // Subtask commands: "add subtask [text] to [task name]" or "subtask [text] under [task]"
        const subtaskMatch = text.match(/^(?:add\s+)?subtask\s+(.+?)\s+(?:to|under|for)\s+(.+)/i);
        if (subtaskMatch) {
            return executeAddSubtask(memberId, subtaskMatch[1], subtaskMatch[2]);
        }

        // Complete subtask: "complete subtask [name]" / "finish subtask [name]" / "subtask [name] done"
        const completeSubtaskMatch = text.match(/^(complete|finish|done with)\s+subtask\s+(.+)/i) ||
                                     text.match(/^subtask\s+(.+?)\s+(done|complete|finished)$/i);
        if (completeSubtaskMatch) {
            return executeCompleteSubtask(memberId, completeSubtaskMatch[2] || completeSubtaskMatch[1]);
        }

        // Complete task: "complete task [name]" / "finish task [name]" / "task [name] done"
        const completeTaskMatch = text.match(/^(complete|finish|done with)\s+task\s+(.+)/i) ||
                                  text.match(/^task\s+(.+?)\s+(done|complete|finished)$/i);
        if (completeTaskMatch) {
            return executeCompleteTask(memberId, completeTaskMatch[2] || completeTaskMatch[1]);
        }

        // Delete task: "delete task [name]" / "remove task [name]"
        const deleteTaskMatch = text.match(/^(delete|remove)\s+task\s+(.+)/i);
        if (deleteTaskMatch) {
            return executeDeleteTask(memberId, deleteTaskMatch[2]);
        }

        // Clear completed tasks: "clear completed tasks"
        if (text.match(/clear\s+completed\s+tasks/i)) {
            return executeClearCompleted(memberId);
        }

        // Shopping list commands with store (dynamic matching including custom stores)
        // "add eggs to walmart" / "add eggs to my custom store" / "walmart eggs" / "my custom store bread"
        const storeMatch = extractStoreFromText(text, memberId);
        if (storeMatch) {
            return executeAddShopping(memberId, storeMatch.item, storeMatch.store);
        }

        // Generic shopping list (no store): "add eggs to shopping list" / "shopping list eggs"
        const shoppingMatch = text.match(/^add\s+(.+?)\s+to\s+(?:the\s+)?(?:shopping|grocery)(?:\s+list)?$/i) ||
                             text.match(/^(?:shopping|grocery)(?:\s+list)?\s+(.+)/i) ||
                             text.match(/^add\s+(.+?)\s+to\s+(?:the\s+)?list$/i);
        if (shoppingMatch) {
            return executeAddShopping(memberId, shoppingMatch[1], null);
        }

        // Check off shopping item: "check off milk" / "got the eggs" / "got milk" / "crossed off bread"
        const checkOffMatch = text.match(/^(?:check off|got|crossed off|picked up)\s+(?:the\s+)?(.+?)(?:\s+from\s+(?:the\s+)?(?:list|shopping|grocery))?$/i);
        if (checkOffMatch) {
            return executeCheckOffShopping(memberId, checkOffMatch[1]);
        }

        // Clear checked/done shopping items: "clear checked items" / "clear done items" / "clear shopping list"
        if (text.match(/clear\s+(?:checked|done|completed)\s+(?:items|groceries)/i) ||
            text.match(/clear\s+(?:the\s+)?(?:shopping|grocery)\s+list/i)) {
            return executeClearCheckedShopping(memberId);
        }

        // What's on my shopping list: "what's on my list" / "what's on the shopping list" / "read shopping list"
        if (text.match(/what'?s?\s+(?:is\s+)?on\s+(?:my|the)\s+(?:shopping|grocery)?\s*list/i) ||
            text.match(/(?:read|show|list)\s+(?:my\s+)?(?:shopping|grocery)\s+list/i)) {
            return executeReadShoppingList(memberId);
        }

        // How many items on list: "how many items on my list" / "how many groceries"
        if (text.match(/how\s+many\s+(?:items|things|groceries)\s+(?:on|in)\s+(?:my|the)\s+(?:shopping|grocery)?\s*list/i) ||
            text.match(/how\s+many\s+(?:items|groceries)/i)) {
            return executeCountShoppingItems(memberId);
        }

        // Remove item from list: "remove milk from list" / "delete eggs from shopping list"
        const removeShoppingMatch = text.match(/^(?:remove|delete)\s+(.+?)\s+from\s+(?:the\s+)?(?:shopping|grocery)?\s*list$/i);
        if (removeShoppingMatch) {
            return executeRemoveShoppingItem(memberId, removeShoppingMatch[1]);
        }

        // ==================== HABIT COMMANDS (require "habit" keyword) ====================

        // Complete habit: "complete habit [name]" / "check off habit [name]" / "habit [name] done"
        const habitMatch = text.match(/^(complete|finish|check off|log)\s+habit\s+(.+)/i) ||
                          text.match(/^habit\s+(.+?)\s+(done|complete|finished)$/i);
        if (habitMatch) {
            return executeCheckHabit(memberId, habitMatch[2] || habitMatch[1]);
        }

        // Uncheck habit: "uncheck habit [name]" / "undo habit [name]" / "reset habit [name]"
        const uncheckHabitMatch = text.match(/^(uncheck|undo|reset|remove)\s+habit\s+(.+)/i);
        if (uncheckHabitMatch) {
            return executeUncheckHabit(memberId, uncheckHabitMatch[2]);
        }

        // Add habit: "add habit [name]" / "new habit [name]" / "create habit [name]"
        const addHabitMatch = text.match(/^(add|new|create)\s+habit\s+(.+)/i);
        if (addHabitMatch) {
            return executeAddHabit(memberId, addHabitMatch[2]);
        }

        // Check habit status: "is habit [name] done" / "did I do habit [name]" / "status habit [name]"
        const habitStatusMatch = text.match(/^(?:is\s+)?habit\s+(.+?)\s+(?:done|complete|finished)\??$/i) ||
                                 text.match(/^did\s+i\s+(?:do|complete|finish)\s+habit\s+(.+)/i) ||
                                 text.match(/^(?:status|check)\s+habit\s+(.+)/i) ||
                                 text.match(/^habit\s+(.+?)\s+status$/i);
        if (habitStatusMatch) {
            return executeHabitStatus(memberId, habitStatusMatch[1]);
        }

        // ==================== MEAL COMMANDS (use meal type keywords) ====================

        // Set meal: "set meal breakfast to [food]" / "set breakfast to [food]" / "breakfast is [food]"
        const mealMatch = text.match(/^set\s+(?:meal\s+)?(breakfast|lunch|dinner|snack)\s+(?:to\s+)?(.+)/i) ||
                         text.match(/^(breakfast|lunch|dinner|snack)\s+is\s+(.+)/i);
        if (mealMatch) {
            return executeSetMeal(memberId, mealMatch[1], mealMatch[2]);
        }

        // Add to meal: "add salad to dinner" / "add fruit to breakfast"
        const addToMealMatch = text.match(/^add\s+(.+?)\s+to\s+(breakfast|lunch|dinner|snack)$/i);
        if (addToMealMatch) {
            return executeAddToMeal(memberId, addToMealMatch[2], addToMealMatch[1]);
        }

        // Mark meal done: "dinner is done" / "finished breakfast" / "done with lunch" / "mark dinner done"
        const mealDoneMatch = text.match(/^(breakfast|lunch|dinner|snack)\s+(?:is\s+)?done$/i) ||
                              text.match(/^(?:finished|done with|completed)\s+(breakfast|lunch|dinner|snack)$/i) ||
                              text.match(/^mark\s+(breakfast|lunch|dinner|snack)\s+(?:as\s+)?done$/i);
        if (mealDoneMatch) {
            return executeMarkMealDone(memberId, mealDoneMatch[1]);
        }

        // Query meal: "what's for breakfast" / "what is for dinner"
        const queryMealMatch = text.match(/what'?s?\s+(?:is\s+)?(?:for\s+)?(breakfast|lunch|dinner|snack)/i);
        if (queryMealMatch) {
            return executeQueryMeal(memberId, queryMealMatch[1]);
        }

        // Query: "how many tasks"
        if (text.match(/how many tasks/i)) {
            return executeQueryTasks(memberId);
        }

        // ==================== HABIT COMMANDS ====================

        // List habits: "what are my habits" / "list habits" / "show habits"
        if (text.match(/(?:what are|list|show)\s*(?:my\s+)?habits/i)) {
            return executeListHabits(memberId);
        }

        // Habit streak: "what's my streak" / "habit streak" / "my streak"
        if (text.match(/(?:what'?s?\s+(?:my\s+)?|habit\s*)streak/i)) {
            return executeHabitStreak(memberId);
        }

        // Habit progress: "how am I doing on habits" / "how are we doing with habits"
        if (text.match(/how\s+(?:am\s+i|are\s+we)\s+doing\s+(?:on|with)\s+habits/i)) {
            return executeHabitProgress(memberId);
        }

        // ==================== PHASE 3: MEAL COMMANDS (TOMORROW) ====================

        // Query tomorrow's meal: "what's for dinner tomorrow"
        const queryTomorrowMatch = text.match(/what'?s?\s+(?:is\s+)?(?:for\s+)?(breakfast|lunch|dinner|snack)\s+tomorrow/i);
        if (queryTomorrowMatch) {
            return executeQueryMealForDate(memberId, queryTomorrowMatch[1], 'tomorrow');
        }

        // Set meal for tomorrow: "set dinner for tomorrow to spaghetti" / "set tomorrow's dinner to spaghetti"
        const setTomorrowMatch = text.match(/set\s+(breakfast|lunch|dinner|snack)\s+(?:for\s+)?tomorrow\s+(?:to\s+)?(.+)/i) ||
                                 text.match(/set\s+tomorrow'?s?\s+(breakfast|lunch|dinner|snack)\s+(?:to\s+)?(.+)/i);
        if (setTomorrowMatch) {
            return executeSetMealForDate(memberId, setTomorrowMatch[1], setTomorrowMatch[2], 'tomorrow');
        }

        // What's the meal plan tomorrow: "what's the meal plan tomorrow" / "tomorrow's meal plan" / "meal plan for tomorrow"
        if (text.match(/(?:what'?s?\s+)?(?:the\s+)?meal\s+plan\s+(?:for\s+)?tomorrow/i) ||
            text.match(/tomorrow'?s?\s+meal\s+plan/i)) {
            return executeQueryMealPlanForDate(memberId, 'tomorrow');
        }

        // What's the meal plan: "what's the meal plan" / "meal plan"
        if (text.match(/(?:what'?s?\s+)?(?:the\s+)?meal\s+plan/i)) {
            return executeQueryMealPlan(memberId);
        }

        // Meal prep for tomorrow: "any meal prep tomorrow" / "what prep tomorrow" / "do I need to prep tomorrow"
        // "any prep for tomorrow" / "meal prep tomorrow" / "prep needed tomorrow"
        if (text.match(/(?:any|what|do\s+i\s+(?:need|have)\s+(?:to|any))\s+(?:meal\s+)?prep\s+(?:for\s+)?tomorrow/i) ||
            text.match(/(?:meal\s+)?prep\s+(?:needed\s+)?(?:for\s+)?tomorrow/i) ||
            text.match(/tomorrow'?s?\s+(?:meal\s+)?prep/i)) {
            return executeQueryPrepForDate(memberId, 'tomorrow');
        }

        // Meal prep for today: "any meal prep today" / "what prep today" / "do I need to prep today"
        if (text.match(/(?:any|what|do\s+i\s+(?:need|have)\s+(?:to|any))\s+(?:meal\s+)?prep\s+(?:for\s+)?today/i) ||
            text.match(/(?:meal\s+)?prep\s+(?:needed\s+)?(?:for\s+)?today/i) ||
            text.match(/today'?s?\s+(?:meal\s+)?prep/i)) {
            return executeQueryPrepForDate(memberId, 'today');
        }

        // ==================== POINTS COMMANDS (require "points" keyword) ====================

        // Points balance: "how many points" / "check points" / "my points" / "points balance"
        if (text.match(/(?:how many|check|my|what'?s?\s+my|show)\s*points/i) || text.match(/points\s+balance/i)) {
            return executeCheckPoints(memberId);
        }

        // Points today: "points today" / "how many points today"
        if (text.match(/points\s+today/i) || text.match(/today'?s?\s+points/i)) {
            return executePointsToday(memberId);
        }

        // ==================== CHORE COMMANDS (require "chore" keyword) ====================

        // List chores: "what are my chores" / "list chores" / "show chores"
        if (text.match(/(?:what are|list|show|today'?s?)\s*(?:my\s+)?chores/i)) {
            return executeListChores(memberId);
        }

        // Complete chore: "complete chore [name]" / "finish chore [name]" / "chore [name] done"
        const choreCompleteMatch = text.match(/^(complete|finish|done with|mark)\s+chore\s+(.+?)(?:\s+done)?$/i) ||
                                   text.match(/^chore\s+(.+?)\s+(done|complete|finished)$/i);
        if (choreCompleteMatch) {
            return executeCompleteChore(memberId, choreCompleteMatch[2] || choreCompleteMatch[1]);
        }

        // ==================== WORKOUT COMMANDS ====================

        // IMPORTANT: Steps commands must come BEFORE general workout logging to avoid
        // "log 3000 steps" being matched as a workout with activity name "3000 steps"

        // Log steps: "log 5000 steps" / "walked 8000 steps"
        const stepsMatch = text.match(/^(?:log|walked|did|tracked?)\s+(\d+)\s+steps?$/i);
        if (stepsMatch) {
            return executeLogSteps(memberId, parseInt(stepsMatch[1]));
        }

        // Query steps: "how many steps" / "steps today"
        if (text.match(/(?:how many|my|check)\s+steps/i) || text.match(/steps\s+today/i)) {
            return executeQuerySteps(memberId);
        }

        // Log workout with routine name: "log workout [routine]" / "did [routine] workout" / "finished [routine]"
        // "log 30 minute run" / "did yoga for 20 minutes" / "completed strength training"
        const logWorkoutMatch = text.match(/^(?:log|did|finished|completed)\s+(?:a\s+)?(?:(\d+)\s+(?:minute|min)\s+)?(.+?)(?:\s+(?:workout|exercise|session))?(?:\s+(?:for\s+)?(\d+)\s+(?:minutes?|mins?))?$/i) ||
                                text.match(/^(?:log|did|finished|completed)\s+(?:a\s+)?(.+?)\s+(?:for\s+)?(\d+)\s+(?:minutes?|mins?)$/i);
        if (logWorkoutMatch) {
            // Extract duration and activity name from different match groups
            let duration = null;
            let activityName = null;

            if (logWorkoutMatch[3]) {
                // First pattern with duration at end: "did yoga for 20 minutes"
                duration = parseInt(logWorkoutMatch[3]) || parseInt(logWorkoutMatch[1]);
                activityName = logWorkoutMatch[2];
            } else if (logWorkoutMatch[1] && !isNaN(parseInt(logWorkoutMatch[1]))) {
                // First pattern with duration at start: "log 30 minute run"
                duration = parseInt(logWorkoutMatch[1]);
                activityName = logWorkoutMatch[2];
            } else {
                // Second pattern: "did yoga for 20 minutes"
                activityName = logWorkoutMatch[1];
                duration = parseInt(logWorkoutMatch[2]) || null;
            }

            if (activityName) {
                return executeLogWorkout(memberId, activityName, duration);
            }
        }

        // Quick log workout: "log run" / "log yoga" / "log cycling"
        const quickLogMatch = text.match(/^log\s+(?:a\s+)?(\w+(?:\s+\w+)?)$/i);
        if (quickLogMatch && !quickLogMatch[1].match(/^(task|habit|journal|chore)/i)) {
            return executeLogWorkout(memberId, quickLogMatch[1], null);
        }

        // Query today's workout: "did I workout today" / "what workout today" / "today's workout"
        if (text.match(/(?:did\s+i|have\s+i)\s+(?:workout|work out|exercise)(?:ed)?\s+today/i) ||
            text.match(/(?:what|any)\s+(?:workout|workouts|exercise)?\s*today/i) ||
            text.match(/today'?s?\s+(?:workout|workouts|exercise)/i)) {
            return executeQueryWorkoutToday(memberId);
        }

        // Workout streak: "workout streak" / "my workout streak" / "exercise streak"
        if (text.match(/(?:my\s+)?(?:workout|exercise)\s+streak/i) ||
            text.match(/how\s+(?:long|many\s+days)\s+(?:is\s+)?(?:my\s+)?(?:workout|exercise)\s+streak/i)) {
            return executeWorkoutStreak(memberId);
        }

        // Weekly workout progress: "workout progress" / "how many workouts this week"
        if (text.match(/(?:workout|exercise)\s+progress/i) ||
            text.match(/how\s+(?:many|am\s+i\s+doing\s+(?:on|with))\s+(?:workouts?|exercises?)/i) ||
            text.match(/(?:workouts?|exercises?)\s+this\s+week/i)) {
            return executeWorkoutProgress(memberId);
        }

        // ==================== BODY MEASUREMENT COMMANDS ====================

        // Log weight: "log weight 70 kg" / "weight 155 lbs" / "my weight is 70" / "weigh 150 pounds"
        const weightMatch = text.match(/^(?:log\s+)?(?:my\s+)?weight\s+(?:is\s+)?(\d+(?:\.\d+)?)\s*(?:kg|kilos?|lbs?|pounds?)?$/i) ||
                           text.match(/^(?:i\s+)?weigh\s+(\d+(?:\.\d+)?)\s*(?:kg|kilos?|lbs?|pounds?)?$/i);
        if (weightMatch) {
            const value = parseFloat(weightMatch[1]);
            const isImperial = text.match(/lbs?|pounds?/i);
            return executeLogMeasurement(memberId, 'weight', value, isImperial ? 'imperial' : null);
        }

        // Log specific measurement: "log waist 32 inches" / "chest 40 in" / "hips 36"
        const measurementMatch = text.match(/^(?:log\s+)?(?:my\s+)?(waist|chest|hips|thighs?|biceps?|neck|calves?|forearms?|body\s*fat|tummy\s*size?)\s+(?:is\s+)?(\d+(?:\.\d+)?)\s*(?:cm|in(?:ches)?|%|percent)?$/i);
        if (measurementMatch) {
            const metricName = measurementMatch[1].toLowerCase().replace(/\s+/g, '');
            const value = parseFloat(measurementMatch[2]);
            const isImperial = text.match(/in(?:ches)?/i);
            return executeLogMeasurement(memberId, metricName, value, isImperial ? 'imperial' : null);
        }

        // Query measurement: "what's my weight" / "how much do I weigh" / "my waist measurement"
        const queryMeasurementMatch = text.match(/(?:what'?s?\s+(?:is\s+)?my|how\s+much\s+(?:do\s+)?i\s+weigh|my)\s+(weight|waist|chest|hips|thighs?|biceps?|neck|body\s*fat|tummy\s*size?)/i);
        if (queryMeasurementMatch) {
            const metricName = queryMeasurementMatch[1].toLowerCase().replace(/\s+/g, '');
            return executeQueryMeasurement(memberId, metricName);
        }

        // Query all measurements: "my measurements" / "show measurements" / "body measurements"
        if (text.match(/(?:my|show|list|what\s+are\s+my)\s+(?:body\s+)?measurements?/i) ||
            text.match(/body\s+measurements?/i)) {
            return executeQueryAllMeasurements(memberId);
        }

        // ==================== CIRCUIT TIMER COMMANDS ====================

        // Start circuit timer: "start tabata" / "start quick hiit timer" / "begin endurance timer"
        const startTimerMatch = text.match(/^(?:start|begin|run)\s+(?:the\s+)?(.+?)(?:\s+timer)?$/i);
        if (startTimerMatch) {
            const timerName = startTimerMatch[1].trim();
            // Only match if it looks like a timer name (not other commands)
            if (!timerName.match(/^(task|habit|chore|journal|workout|exercise)/i)) {
                const result = executeStartCircuitTimer(memberId, timerName);
                if (result.success || result.isTimerCommand) {
                    return result;
                }
                // If not found as timer, fall through to other commands
            }
        }

        // Stop/pause circuit timer: "stop timer" / "pause timer" / "end timer"
        if (text.match(/^(?:stop|pause|end|cancel)\s+(?:the\s+)?timer$/i)) {
            return executeStopCircuitTimer(memberId);
        }

        // Resume timer: "resume timer" / "continue timer"
        if (text.match(/^(?:resume|continue|unpause)\s+(?:the\s+)?timer$/i)) {
            return executeResumeCircuitTimer(memberId);
        }

        // List timers: "what timers do I have" / "list timers" / "show timers"
        if (text.match(/(?:what|list|show|my)\s+(?:circuit\s+)?timers?/i) ||
            text.match(/(?:available|saved)\s+timers?/i)) {
            return executeListCircuitTimers(memberId);
        }

        // Timer status: "timer status" / "how much time left"
        if (text.match(/timer\s+status/i) ||
            text.match(/(?:how much|what)\s+time\s+(?:is\s+)?left/i) ||
            text.match(/(?:is\s+)?(?:the\s+)?timer\s+running/i)) {
            return executeTimerStatus(memberId);
        }

        // ==================== SCREEN TIME COMMANDS (Kids Only) ====================

        // Start screen time: "start screen time" / "begin screen time" / "screen time start"
        if (text.match(/^(?:start|begin)\s+(?:my\s+)?screen\s*time$/i) ||
            text.match(/^screen\s*time\s+(?:start|begin)$/i) ||
            text.match(/^(?:can\s+i|i\s+want\s+to)\s+(?:watch|play|use)\s+(?:tv|tablet|ipad|screen)/i)) {
            return executeStartScreenTime(memberId);
        }

        // Stop screen time: "stop screen time" / "end screen time" / "screen time over"
        if (text.match(/^(?:stop|end|finish|done\s+with)\s+(?:my\s+)?screen\s*time$/i) ||
            text.match(/^screen\s*time\s+(?:stop|over|done|finished)$/i) ||
            text.match(/^(?:i'?m\s+)?done\s+(?:with\s+)?(?:watching|playing|screen)/i)) {
            return executeStopScreenTime(memberId);
        }

        // Query screen time: "how much screen time" / "screen time left" / "check screen time"
        if (text.match(/(?:how much|how many|what'?s?\s+my)\s+screen\s*time/i) ||
            text.match(/screen\s*time\s+(?:left|remaining)/i) ||
            text.match(/(?:check|show)\s+(?:my\s+)?screen\s*time/i)) {
            return executeQueryScreenTime(memberId);
        }

        // Screen time status (is timer running): "is screen time running" / "screen time status"
        if (text.match(/(?:is\s+)?(?:my\s+)?screen\s*time\s+(?:running|active|on)/i) ||
            text.match(/screen\s*time\s+status/i)) {
            return executeScreenTimeStatus(memberId);
        }

        // ==================== JOURNAL COMMANDS (require "journal" keyword) ====================

        // Add journal entry: "add journal [text]" / "journal entry [text]" / "write journal [text]"
        const journalMatch = text.match(/^(?:add\s+journal|journal\s+entry|write\s+journal|journal)\s+(.+)/i);
        if (journalMatch) {
            return executeAddJournalEntry(memberId, journalMatch[1]);
        }

        // Set mood: "set mood [mood]" / "mood is [mood]" / "feeling [mood]"
        const moodMatch = text.match(/^(?:set\s+mood\s+(?:to\s+)?|mood\s+(?:is\s+)?|(?:i'?m\s+)?feeling\s+)(grateful|content|energized|reflective|stressed|peaceful|motivated|tired)/i);
        if (moodMatch) {
            return executeSetMood(memberId, moodMatch[1]);
        }

        // Help command - just open the reference modal
        if (text.match(/^(help|what can you do|commands|voice commands)/i)) {
            // Open the voice commands modal
            setTimeout(() => {
                if (typeof showVoiceCommandsModal === 'function') {
                    showVoiceCommandsModal();
                }
            }, 300);

            return {
                success: true,
                message: 'Opening voice commands reference...',
                refresh: false
            };
        }

        return { success: false, message: `I didn't understand "${transcript}". Try "Help" for commands. Use keywords like "task", "habit", "chore", "journal".` };
    }

    // ==================== COMMAND EXECUTORS ====================

    /**
     * Execute: Add task
     */
    function executeAddTask(memberId, taskText) {
        const member = Storage.getMember(memberId);
        if (!member) return { success: false, message: 'Member not found' };

        const widgetId = member.type === 'adult' ? 'task-list' : 'kid-tasks';
        const data = Storage.getWidgetData(memberId, widgetId) || { tasks: [] };

        // Capitalize first letter
        const title = taskText.charAt(0).toUpperCase() + taskText.slice(1);

        const newTask = {
            id: `task-${Date.now()}`,
            title: title,
            completed: false,
            createdAt: new Date().toISOString().split('T')[0]
        };

        data.tasks = [...(data.tasks || []), newTask];
        Storage.setWidgetData(memberId, widgetId, data);
        Storage.trackAction(memberId, widgetId, 'created');

        return { success: true, message: `Added task: ${title}` };
    }

    /**
     * Execute: Add shopping list item (with optional store)
     */
    function executeAddShopping(memberId, item, storeName) {
        const data = Storage.getWidgetData(memberId, 'grocery') || { items: [], stores: [] };
        const stores = data.stores || [];

        // Capitalize first letter
        const name = item.charAt(0).toUpperCase() + item.slice(1);

        // Find matching store if provided
        let storeId = null;
        let storeDisplayName = null;

        if (storeName) {
            const normalizedStoreName = storeName.toLowerCase().replace(/[']/g, '').trim();

            // First, try to match against user's custom stores (fuzzy match by name)
            const matchedStore = stores.find(s => {
                const sName = s.name.toLowerCase().replace(/[']/g, '');
                return sName === normalizedStoreName ||
                       sName.includes(normalizedStoreName) ||
                       normalizedStoreName.includes(sName);
            });

            if (matchedStore) {
                storeId = matchedStore.id;
                storeDisplayName = matchedStore.name;
            } else {
                // Fall back to common voice variations mapping
                const storeMapping = {
                    'walmart': 'walmart',
                    'target': 'target',
                    'costco': 'costco',
                    'aldi': 'aldi',
                    'kroger': 'kroger',
                    'safeway': 'safeway',
                    'whole foods': 'whole-foods',
                    'wholefoods': 'whole-foods',
                    'trader joes': 'trader-joes',
                    'trader joe': 'trader-joes',
                    'traderjoes': 'trader-joes'
                };

                storeId = storeMapping[normalizedStoreName] || normalizedStoreName.replace(/\s+/g, '-');

                // Check if this mapped ID exists in stores
                const foundStore = stores.find(s => s.id === storeId);
                storeDisplayName = foundStore?.name || storeName.charAt(0).toUpperCase() + storeName.slice(1);
            }
        }

        const newItem = {
            id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: name,
            checked: false,
            store: storeId,
            category: 'other',
            addedAt: new Date().toISOString()
        };

        data.items = [...(data.items || []), newItem];
        Storage.setWidgetData(memberId, 'grocery', data);

        // Build success message
        let message = `Added ${name} to shopping list`;
        if (storeDisplayName) {
            message = `Added ${name} to ${storeDisplayName} list`;
        }

        return { success: true, message };
    }

    /**
     * Execute: Check off a shopping list item
     */
    function executeCheckOffShopping(memberId, itemName) {
        const data = Storage.getWidgetData(memberId, 'grocery') || { items: [], stores: [] };
        const items = data.items || [];

        // Find unchecked item by fuzzy match
        const searchTerm = itemName.toLowerCase();
        const item = items.find(i =>
            !i.checked &&
            (i.name.toLowerCase().includes(searchTerm) ||
             searchTerm.includes(i.name.toLowerCase()))
        );

        if (!item) {
            // Check if it exists but is already checked
            const checkedItem = items.find(i =>
                i.checked &&
                (i.name.toLowerCase().includes(searchTerm) ||
                 searchTerm.includes(i.name.toLowerCase()))
            );

            if (checkedItem) {
                return { success: true, message: `${checkedItem.name} is already checked off`, refresh: false };
            }

            return { success: false, message: `"${itemName}" not found on your shopping list` };
        }

        // Check off the item
        item.checked = true;

        Storage.setWidgetData(memberId, 'grocery', data);

        return { success: true, message: `Checked off ${item.name}` };
    }

    /**
     * Execute: Clear all checked shopping items
     */
    function executeClearCheckedShopping(memberId) {
        const data = Storage.getWidgetData(memberId, 'grocery') || { items: [], stores: [] };
        const items = data.items || [];

        const checkedCount = items.filter(i => i.checked).length;

        if (checkedCount === 0) {
            return { success: true, message: 'No checked items to clear', refresh: false };
        }

        // Remove checked items
        data.items = items.filter(i => !i.checked);

        Storage.setWidgetData(memberId, 'grocery', data);

        return { success: true, message: `Cleared ${checkedCount} checked item${checkedCount !== 1 ? 's' : ''}` };
    }

    /**
     * Execute: Read/list shopping list items
     */
    function executeReadShoppingList(memberId) {
        const data = Storage.getWidgetData(memberId, 'grocery') || { items: [], stores: [] };
        const items = data.items || [];

        const uncheckedItems = items.filter(i => !i.checked);

        if (uncheckedItems.length === 0) {
            return { success: true, message: 'Your shopping list is empty', refresh: false };
        }

        // Limit to first 10 items for voice readout
        const itemsToRead = uncheckedItems.slice(0, 10);
        const itemNames = itemsToRead.map(i => i.name).join(', ');

        let message = `Shopping list: ${itemNames}`;
        if (uncheckedItems.length > 10) {
            message += ` and ${uncheckedItems.length - 10} more`;
        }

        return { success: true, message, refresh: false };
    }

    /**
     * Execute: Count shopping list items
     */
    function executeCountShoppingItems(memberId) {
        const data = Storage.getWidgetData(memberId, 'grocery') || { items: [], stores: [] };
        const items = data.items || [];

        const uncheckedCount = items.filter(i => !i.checked).length;
        const checkedCount = items.filter(i => i.checked).length;

        if (uncheckedCount === 0 && checkedCount === 0) {
            return { success: true, message: 'Your shopping list is empty', refresh: false };
        }

        let message = `You have ${uncheckedCount} item${uncheckedCount !== 1 ? 's' : ''} to get`;
        if (checkedCount > 0) {
            message += ` and ${checkedCount} checked off`;
        }

        return { success: true, message, refresh: false };
    }

    /**
     * Execute: Remove an item from shopping list
     */
    function executeRemoveShoppingItem(memberId, itemName) {
        const data = Storage.getWidgetData(memberId, 'grocery') || { items: [], stores: [] };
        const items = data.items || [];

        // Find item by fuzzy match
        const searchTerm = itemName.toLowerCase();
        const itemIndex = items.findIndex(i =>
            i.name.toLowerCase().includes(searchTerm) ||
            searchTerm.includes(i.name.toLowerCase())
        );

        if (itemIndex === -1) {
            return { success: false, message: `"${itemName}" not found on your shopping list` };
        }

        const removedItem = items.splice(itemIndex, 1)[0];
        data.items = items;

        Storage.setWidgetData(memberId, 'grocery', data);

        return { success: true, message: `Removed ${removedItem.name} from shopping list` };
    }

    /**
     * Execute: Check habit
     */
    function executeCheckHabit(memberId, habitName) {
        const data = Storage.getWidgetData(memberId, 'habits');
        if (!data?.habits || data.habits.length === 0) {
            return { success: false, message: 'No habits found. Add some habits first!' };
        }

        // Find habit by fuzzy match (exclude archived)
        const searchTerm = habitName.toLowerCase();
        const habit = data.habits.find(h =>
            !h.archived &&
            (h.name.toLowerCase().includes(searchTerm) ||
             searchTerm.includes(h.name.toLowerCase()))
        );

        if (!habit) {
            const habitNames = data.habits.filter(h => !h.archived).map(h => h.name).join(', ');
            return { success: false, message: `Habit "${habitName}" not found. Your habits: ${habitNames}` };
        }

        // Mark as complete for today using the log structure
        const today = DateUtils.today();

        // Initialize log if needed
        if (!data.log) data.log = {};
        if (!data.log[today]) data.log[today] = [];

        // Check if already completed today
        if (data.log[today].includes(habit.id)) {
            return { success: true, message: `${habit.name} was already checked off today`, refresh: false };
        }

        // Add habit ID to today's log
        data.log[today].push(habit.id);

        // Update streak
        habit.streak = (habit.streak || 0) + 1;
        habit.lastCompleted = today;

        Storage.setWidgetData(memberId, 'habits', data);
        Storage.trackAction(memberId, 'habits', 'checkin');

        return { success: true, message: `Checked off ${habit.name}! Streak: ${habit.streak} days` };
    }

    /**
     * Execute: Uncheck habit (remove from today's log)
     */
    function executeUncheckHabit(memberId, habitName) {
        const data = Storage.getWidgetData(memberId, 'habits');
        if (!data?.habits || data.habits.length === 0) {
            return { success: false, message: 'No habits found. Add some habits first!' };
        }

        // Find habit by fuzzy match (exclude archived)
        const searchTerm = habitName.toLowerCase();
        const habit = data.habits.find(h =>
            !h.archived &&
            (h.name.toLowerCase().includes(searchTerm) ||
             searchTerm.includes(h.name.toLowerCase()))
        );

        if (!habit) {
            const habitNames = data.habits.filter(h => !h.archived).map(h => h.name).join(', ');
            return { success: false, message: `Habit "${habitName}" not found. Your habits: ${habitNames}` };
        }

        const today = DateUtils.today();

        // Check if log exists and habit was checked today
        if (!data.log || !data.log[today] || !data.log[today].includes(habit.id)) {
            return { success: true, message: `${habit.name} wasn't checked off today`, refresh: false };
        }

        // Remove habit ID from today's log
        data.log[today] = data.log[today].filter(id => id !== habit.id);

        // Decrement streak (but don't go below 0)
        if (habit.streak && habit.streak > 0) {
            habit.streak = habit.streak - 1;
        }

        // Clear lastCompleted if it was today
        if (habit.lastCompleted === today) {
            habit.lastCompleted = null;
        }

        Storage.setWidgetData(memberId, 'habits', data);

        return { success: true, message: `Unchecked ${habit.name}` };
    }

    /**
     * Execute: Add a new habit
     */
    function executeAddHabit(memberId, habitName) {
        // Default habits (same as in habits.js)
        const DEFAULT_HABITS = [
            { id: 'hab-default-1', name: 'Drink 8 glasses of water', icon: 'droplet', category: 'health', schedule: 'daily' },
            { id: 'hab-default-2', name: 'Exercise', icon: 'dumbbell', category: 'fitness', schedule: 'daily' },
            { id: 'hab-default-3', name: 'Read', icon: 'book-open', category: 'learning', schedule: 'daily' },
            { id: 'hab-default-4', name: 'Meditate', icon: 'brain', category: 'wellness', schedule: 'daily' }
        ];

        // Get existing data from storage
        let data = Storage.getWidgetData(memberId, 'habits');

        // If no data or no habits, initialize with defaults (same as habits.js)
        if (!data || !data.habits || data.habits.length === 0) {
            data = {
                habits: DEFAULT_HABITS.map(h => ({
                    ...h,
                    streak: 0,
                    bestStreak: 0,
                    customDays: null,
                    archived: false
                })),
                log: {},
                restDays: {},
                viewMode: 'list',
                archivedHabits: []
            };
        }

        // Ensure log exists
        if (!data.log) data.log = {};

        // Check if habit with similar name already exists
        const searchTerm = habitName.toLowerCase();
        const existingHabit = data.habits.find(h =>
            !h.archived &&
            h.name.toLowerCase() === searchTerm
        );

        if (existingHabit) {
            return { success: false, message: `Habit "${existingHabit.name}" already exists` };
        }

        // Capitalize first letter of each word
        const formattedName = habitName
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');

        // Create new habit with default settings
        const newHabit = {
            id: `habit-${Date.now()}`,
            name: formattedName,
            icon: 'check-circle',
            category: 'other',
            schedule: 'daily',
            streak: 0,
            bestStreak: 0,
            customDays: null,
            archived: false,
            createdAt: new Date().toISOString()
        };

        data.habits.push(newHabit);
        Storage.setWidgetData(memberId, 'habits', data);
        Storage.trackAction(memberId, 'habits', 'created');

        return { success: true, message: `Added new habit: ${formattedName}` };
    }

    /**
     * Execute: Check if a specific habit is done today
     */
    function executeHabitStatus(memberId, habitName) {
        const data = Storage.getWidgetData(memberId, 'habits');
        if (!data?.habits || data.habits.length === 0) {
            return { success: false, message: 'No habits found. Add some habits first!' };
        }

        // Find habit by fuzzy match (exclude archived)
        const searchTerm = habitName.toLowerCase();
        const habit = data.habits.find(h =>
            !h.archived &&
            (h.name.toLowerCase().includes(searchTerm) ||
             searchTerm.includes(h.name.toLowerCase()))
        );

        if (!habit) {
            const habitNames = data.habits.filter(h => !h.archived).map(h => h.name).join(', ');
            return { success: false, message: `Habit "${habitName}" not found. Your habits: ${habitNames}` };
        }

        const today = DateUtils.today();
        const todayLog = data.log?.[today] || [];
        const isDone = todayLog.includes(habit.id);
        const streak = habit.streak || 0;

        if (isDone) {
            return {
                success: true,
                message: `Yes! ${habit.name} is done today. Current streak: ${streak} day${streak !== 1 ? 's' : ''}`,
                refresh: false
            };
        } else {
            return {
                success: true,
                message: `${habit.name} is not done yet today. Streak: ${streak} day${streak !== 1 ? 's' : ''}`,
                refresh: false
            };
        }
    }

    /**
     * Execute: Set meal
     * Uses the correct weeklyPlan structure: weeklyPlan[date][variant][mealType] = { items: [], protein: null, completed: false }
     */
    function executeSetMeal(memberId, mealType, food) {
        const today = DateUtils.today();
        const member = Storage.getMember(memberId);
        const variant = (member?.type === 'adult') ? 'adult' : 'kids';

        const data = Storage.getWidgetData(memberId, 'meal-plan') || { weeklyPlan: {}, recipes: [] };

        if (!data.weeklyPlan) data.weeklyPlan = {};
        if (!data.weeklyPlan[today]) {
            data.weeklyPlan[today] = {
                adult: { breakfast: null, lunch: null, dinner: null, snack: null },
                kids: { breakfast: null, lunch: null, dinner: null, snack: null }
            };
        }
        if (!data.weeklyPlan[today][variant]) {
            data.weeklyPlan[today][variant] = { breakfast: null, lunch: null, dinner: null, snack: null };
        }

        // Capitalize food
        const foodName = food.charAt(0).toUpperCase() + food.slice(1);
        const meal = mealType.toLowerCase();

        // Set meal in the correct structure with items array
        data.weeklyPlan[today][variant][meal] = {
            items: [foodName],
            protein: null,
            completed: false
        };

        Storage.setWidgetData(memberId, 'meal-plan', data);
        Storage.trackAction(memberId, 'meal-plan', 'planned');

        return { success: true, message: `Set ${meal} to ${foodName}` };
    }

    /**
     * Execute: Add item to an existing meal
     * Appends to the items array instead of replacing
     */
    function executeAddToMeal(memberId, mealType, food) {
        const today = DateUtils.today();
        const member = Storage.getMember(memberId);
        const variant = (member?.type === 'adult') ? 'adult' : 'kids';

        const data = Storage.getWidgetData(memberId, 'meal-plan') || { weeklyPlan: {}, recipes: [] };

        if (!data.weeklyPlan) data.weeklyPlan = {};
        if (!data.weeklyPlan[today]) {
            data.weeklyPlan[today] = {
                adult: { breakfast: null, lunch: null, dinner: null, snack: null },
                kids: { breakfast: null, lunch: null, dinner: null, snack: null }
            };
        }
        if (!data.weeklyPlan[today][variant]) {
            data.weeklyPlan[today][variant] = { breakfast: null, lunch: null, dinner: null, snack: null };
        }

        const meal = mealType.toLowerCase();
        const foodName = food.charAt(0).toUpperCase() + food.slice(1);

        // Get existing meal slot or create new one
        const existingSlot = data.weeklyPlan[today][variant][meal];

        if (existingSlot && existingSlot.items && existingSlot.items.length > 0) {
            // Append to existing items
            existingSlot.items.push(foodName);
        } else {
            // Create new meal slot with this item
            data.weeklyPlan[today][variant][meal] = {
                items: [foodName],
                protein: null,
                completed: false
            };
        }

        Storage.setWidgetData(memberId, 'meal-plan', data);
        Storage.trackAction(memberId, 'meal-plan', 'planned');

        const allItems = data.weeklyPlan[today][variant][meal].items.join(', ');
        return { success: true, message: `Added ${foodName} to ${meal}. ${meal} is now: ${allItems}` };
    }

    /**
     * Execute: Mark a meal as done/completed
     */
    function executeMarkMealDone(memberId, mealType) {
        const today = DateUtils.today();
        const member = Storage.getMember(memberId);
        const variant = (member?.type === 'adult') ? 'adult' : 'kids';

        const data = Storage.getWidgetData(memberId, 'meal-plan') || { weeklyPlan: {}, recipes: [] };
        const meal = mealType.toLowerCase();

        // Check if meal exists
        const mealSlot = data.weeklyPlan?.[today]?.[variant]?.[meal];

        if (!mealSlot || !mealSlot.items || mealSlot.items.length === 0) {
            return { success: false, message: `No ${meal} planned for today` };
        }

        // Check if already completed
        if (mealSlot.completed) {
            return { success: true, message: `${meal} was already marked as done`, refresh: false };
        }

        // Mark as completed
        mealSlot.completed = true;

        Storage.setWidgetData(memberId, 'meal-plan', data);
        Storage.trackAction(memberId, 'meal-plan', 'completed');

        return { success: true, message: `Marked ${meal} as done!` };
    }

    /**
     * Query: What's for meal?
     * Uses the correct weeklyPlan structure
     */
    function executeQueryMeal(memberId, mealType) {
        const today = DateUtils.today();
        const member = Storage.getMember(memberId);
        const variant = (member?.type === 'adult') ? 'adult' : 'kids';

        const data = Storage.getWidgetData(memberId, 'meal-plan');
        const meal = mealType.toLowerCase();
        const mealData = data?.weeklyPlan?.[today]?.[variant]?.[meal];

        // Extract items from the meal data
        const items = mealData?.items || [];
        const food = items.length > 0 ? items.join(', ') : null;

        if (food) {
            return { success: true, message: `${mealType} is ${food}`, refresh: false };
        }
        return { success: true, message: `No ${meal} planned yet for today`, refresh: false };
    }

    /**
     * Query: How many tasks?
     */
    function executeQueryTasks(memberId) {
        const member = Storage.getMember(memberId);
        const widgetId = member?.type === 'adult' ? 'task-list' : 'kid-tasks';
        const data = Storage.getWidgetData(memberId, widgetId);
        const tasks = data?.tasks || [];

        const total = tasks.length;
        const completed = tasks.filter(t => t.completed).length;
        const pending = total - completed;

        if (total === 0) {
            return { success: true, message: 'No tasks yet', refresh: false };
        }
        return { success: true, message: `You have ${pending} pending tasks out of ${total} total`, refresh: false };
    }

    // ==================== PHASE 1: TASK EXECUTORS ====================

    /**
     * Execute: Complete task
     */
    function executeCompleteTask(memberId, taskName) {
        const member = Storage.getMember(memberId);
        const widgetId = member?.type === 'adult' ? 'task-list' : 'kid-tasks';
        const data = Storage.getWidgetData(memberId, widgetId) || { tasks: [] };

        // Fuzzy match by title (find incomplete tasks first)
        const task = data.tasks.find(t =>
            !t.completed && t.title.toLowerCase().includes(taskName.toLowerCase())
        );

        if (!task) {
            return { success: false, message: `Task "${taskName}" not found or already completed` };
        }

        task.completed = true;
        task.completedAt = new Date().toISOString().split('T')[0];
        Storage.setWidgetData(memberId, widgetId, data);
        Storage.trackAction(memberId, widgetId, 'completed');

        return { success: true, message: `Completed: ${task.title}` };
    }

    /**
     * Execute: Delete task
     */
    function executeDeleteTask(memberId, taskName) {
        const member = Storage.getMember(memberId);
        const widgetId = member?.type === 'adult' ? 'task-list' : 'kid-tasks';
        const data = Storage.getWidgetData(memberId, widgetId) || { tasks: [] };

        const taskIndex = data.tasks.findIndex(t =>
            t.title.toLowerCase().includes(taskName.toLowerCase())
        );

        if (taskIndex === -1) {
            return { success: false, message: `Task "${taskName}" not found` };
        }

        const removed = data.tasks.splice(taskIndex, 1)[0];
        Storage.setWidgetData(memberId, widgetId, data);

        return { success: true, message: `Deleted: ${removed.title}` };
    }

    /**
     * Execute: Clear completed tasks
     */
    function executeClearCompleted(memberId) {
        const member = Storage.getMember(memberId);
        const widgetId = member?.type === 'adult' ? 'task-list' : 'kid-tasks';
        const data = Storage.getWidgetData(memberId, widgetId) || { tasks: [] };

        const completedCount = data.tasks.filter(t => t.completed).length;

        if (completedCount === 0) {
            return { success: true, message: 'No completed tasks to clear', refresh: false };
        }

        data.tasks = data.tasks.filter(t => !t.completed);
        Storage.setWidgetData(memberId, widgetId, data);

        return { success: true, message: `Cleared ${completedCount} completed task${completedCount !== 1 ? 's' : ''}` };
    }

    /**
     * Execute: Add subtask to a task
     */
    function executeAddSubtask(memberId, subtaskText, taskName) {
        const member = Storage.getMember(memberId);
        const widgetId = member?.type === 'adult' ? 'task-list' : 'kid-tasks';
        const data = Storage.getWidgetData(memberId, widgetId) || { tasks: [] };

        // Find the parent task by fuzzy match
        const task = data.tasks.find(t =>
            t.title.toLowerCase().includes(taskName.toLowerCase()) ||
            taskName.toLowerCase().includes(t.title.toLowerCase())
        );

        if (!task) {
            return { success: false, message: `Task "${taskName}" not found` };
        }

        // Initialize subtasks array if needed
        if (!task.subtasks) {
            task.subtasks = [];
        }

        // Capitalize first letter
        const title = subtaskText.charAt(0).toUpperCase() + subtaskText.slice(1);

        // Add the subtask
        task.subtasks.push({
            id: `subtask-${Date.now()}`,
            title: title,
            completed: false,
            createdAt: new Date().toISOString()
        });

        Storage.setWidgetData(memberId, widgetId, data);

        return { success: true, message: `Added subtask "${title}" to ${task.title}` };
    }

    /**
     * Execute: Complete subtask
     * Searches all tasks for a matching subtask by name
     */
    function executeCompleteSubtask(memberId, subtaskName) {
        const member = Storage.getMember(memberId);
        const widgetId = member?.type === 'adult' ? 'task-list' : 'kid-tasks';
        const data = Storage.getWidgetData(memberId, widgetId) || { tasks: [] };

        // Search all tasks for a matching subtask
        let foundTask = null;
        let foundSubtask = null;

        for (const task of data.tasks) {
            if (!task.subtasks || task.subtasks.length === 0) continue;

            const subtask = task.subtasks.find(s =>
                !s.completed &&
                (s.title.toLowerCase().includes(subtaskName.toLowerCase()) ||
                 subtaskName.toLowerCase().includes(s.title.toLowerCase()))
            );

            if (subtask) {
                foundTask = task;
                foundSubtask = subtask;
                break;
            }
        }

        if (!foundSubtask) {
            return { success: false, message: `Subtask "${subtaskName}" not found or already completed` };
        }

        // Mark subtask as completed
        foundSubtask.completed = true;
        foundSubtask.completedAt = new Date().toISOString();

        Storage.setWidgetData(memberId, widgetId, data);
        Storage.trackAction(memberId, widgetId, 'subtask_completed');

        return { success: true, message: `Completed subtask "${foundSubtask.title}" in ${foundTask.title}` };
    }

    // ==================== PHASE 2: HABIT EXECUTORS ====================

    /**
     * Execute: List habits
     */
    function executeListHabits(memberId) {
        const data = Storage.getWidgetData(memberId, 'habits') || { habits: [] };
        const habits = (data.habits || []).filter(h => !h.archived);

        if (habits.length === 0) {
            return { success: true, message: 'No habits set up yet', refresh: false };
        }

        // Get today's habits (filter by schedule)
        const dayOfWeek = new Date().getDay();

        const todayHabits = habits.filter(h => {
            if (!h.schedule || h.schedule === 'daily') return true;
            if (h.schedule === 'weekdays') return dayOfWeek >= 1 && dayOfWeek <= 5;
            if (h.schedule === 'weekends') return dayOfWeek === 0 || dayOfWeek === 6;
            if (h.schedule === 'custom') return h.customDays?.includes(dayOfWeek);
            return true;
        });

        if (todayHabits.length === 0) {
            return { success: true, message: 'No habits scheduled for today', refresh: false };
        }

        const names = todayHabits.map(h => h.name).join(', ');
        return {
            success: true,
            message: `Today's habits: ${names}`,
            refresh: false
        };
    }

    /**
     * Execute: Get habit streak
     */
    function executeHabitStreak(memberId) {
        const data = Storage.getWidgetData(memberId, 'habits') || { habits: [] };
        const habits = (data.habits || []).filter(h => !h.archived);

        if (habits.length === 0) {
            return { success: true, message: 'No habits to track', refresh: false };
        }

        const bestStreak = Math.max(...habits.map(h => h.streak || 0), 0);
        const bestHabit = habits.find(h => h.streak === bestStreak);

        if (bestStreak === 0) {
            return { success: true, message: 'No active streaks yet. Start today!', refresh: false };
        }

        return {
            success: true,
            message: `Best streak: ${bestStreak} day${bestStreak !== 1 ? 's' : ''} on ${bestHabit?.name || 'a habit'}`,
            refresh: false
        };
    }

    /**
     * Execute: Get habit progress for today
     */
    function executeHabitProgress(memberId) {
        const data = Storage.getWidgetData(memberId, 'habits') || { habits: [], log: {} };
        const habits = (data.habits || []).filter(h => !h.archived);
        const today = DateUtils.today();
        const todayLog = data.log?.[today] || [];

        // Filter by schedule
        const dayOfWeek = new Date().getDay();
        const todayHabits = habits.filter(h => {
            if (!h.schedule || h.schedule === 'daily') return true;
            if (h.schedule === 'weekdays') return dayOfWeek >= 1 && dayOfWeek <= 5;
            if (h.schedule === 'weekends') return dayOfWeek === 0 || dayOfWeek === 6;
            if (h.schedule === 'custom') return h.customDays?.includes(dayOfWeek);
            return true;
        });

        const completed = todayHabits.filter(h => todayLog.includes(h.id)).length;
        const total = todayHabits.length;

        if (total === 0) {
            return { success: true, message: 'No habits scheduled for today', refresh: false };
        }

        if (completed === total) {
            return { success: true, message: `All ${total} habits done today! Great job!`, refresh: false };
        }

        return {
            success: true,
            message: `${completed} of ${total} habits done today`,
            refresh: false
        };
    }

    // ==================== PHASE 3: MEAL EXECUTORS (TOMORROW) ====================

    /**
     * Execute: Query meal for date
     * Uses the correct weeklyPlan structure
     */
    function executeQueryMealForDate(memberId, mealType, dateOffset) {
        let targetDate;
        if (dateOffset === 'tomorrow') {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            targetDate = tomorrow.toISOString().split('T')[0];
        } else {
            targetDate = new Date().toISOString().split('T')[0];
        }

        const member = Storage.getMember(memberId);
        const variant = (member?.type === 'adult') ? 'adult' : 'kids';

        const data = Storage.getWidgetData(memberId, 'meal-plan');
        const meal = mealType.toLowerCase();
        const mealData = data?.weeklyPlan?.[targetDate]?.[variant]?.[meal];

        // Extract items from the meal data
        const items = mealData?.items || [];
        const food = items.length > 0 ? items.join(', ') : null;

        const dayName = dateOffset === 'tomorrow' ? 'tomorrow' : 'today';

        if (food) {
            return { success: true, message: `${mealType} ${dayName} is ${food}`, refresh: false };
        }
        return { success: true, message: `No ${meal} planned for ${dayName}`, refresh: false };
    }

    /**
     * Execute: Set meal for date
     * Uses the correct weeklyPlan structure
     */
    function executeSetMealForDate(memberId, mealType, food, dateOffset) {
        let targetDate;
        if (dateOffset === 'tomorrow') {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            targetDate = tomorrow.toISOString().split('T')[0];
        } else {
            targetDate = new Date().toISOString().split('T')[0];
        }

        const member = Storage.getMember(memberId);
        const variant = (member?.type === 'adult') ? 'adult' : 'kids';

        const data = Storage.getWidgetData(memberId, 'meal-plan') || { weeklyPlan: {}, recipes: [] };
        if (!data.weeklyPlan) data.weeklyPlan = {};
        if (!data.weeklyPlan[targetDate]) {
            data.weeklyPlan[targetDate] = {
                adult: { breakfast: null, lunch: null, dinner: null, snack: null },
                kids: { breakfast: null, lunch: null, dinner: null, snack: null }
            };
        }
        if (!data.weeklyPlan[targetDate][variant]) {
            data.weeklyPlan[targetDate][variant] = { breakfast: null, lunch: null, dinner: null, snack: null };
        }

        const meal = mealType.toLowerCase();
        const foodName = food.charAt(0).toUpperCase() + food.slice(1);

        // Set meal in the correct structure with items array
        data.weeklyPlan[targetDate][variant][meal] = {
            items: [foodName],
            protein: null,
            completed: false
        };

        Storage.setWidgetData(memberId, 'meal-plan', data);
        Storage.trackAction(memberId, 'meal-plan', 'planned');

        const dayName = dateOffset === 'tomorrow' ? 'tomorrow' : 'today';
        return { success: true, message: `Set ${dayName}'s ${meal} to ${foodName}` };
    }

    /**
     * Execute: Query today's meal plan
     * Uses the correct weeklyPlan structure
     */
    function executeQueryMealPlan(memberId) {
        const today = DateUtils.today();
        const member = Storage.getMember(memberId);
        const variant = (member?.type === 'adult') ? 'adult' : 'kids';

        const data = Storage.getWidgetData(memberId, 'meal-plan');
        const todayPlan = data?.weeklyPlan?.[today]?.[variant] || {};

        const meals = ['breakfast', 'lunch', 'dinner', 'snack']
            .filter(m => todayPlan[m]?.items?.length > 0)
            .map(m => `${m}: ${todayPlan[m].items.join(', ')}`);

        if (meals.length === 0) {
            return { success: true, message: 'No meals planned for today', refresh: false };
        }

        return { success: true, message: `Today's meals: ${meals.join(', ')}`, refresh: false };
    }

    /**
     * Execute: Query meal plan for a specific date (tomorrow)
     * Uses the correct weeklyPlan structure
     */
    function executeQueryMealPlanForDate(memberId, dateOffset) {
        let targetDate;
        let dayName;

        if (dateOffset === 'tomorrow') {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            targetDate = tomorrow.toISOString().split('T')[0];
            dayName = 'tomorrow';
        } else {
            targetDate = new Date().toISOString().split('T')[0];
            dayName = 'today';
        }

        const member = Storage.getMember(memberId);
        const variant = (member?.type === 'adult') ? 'adult' : 'kids';

        const data = Storage.getWidgetData(memberId, 'meal-plan');
        const datePlan = data?.weeklyPlan?.[targetDate]?.[variant] || {};

        const meals = ['breakfast', 'lunch', 'dinner', 'snack']
            .filter(m => datePlan[m]?.items?.length > 0)
            .map(m => `${m}: ${datePlan[m].items.join(', ')}`);

        if (meals.length === 0) {
            return { success: true, message: `No meals planned for ${dayName}`, refresh: false };
        }

        return { success: true, message: `${dayName.charAt(0).toUpperCase() + dayName.slice(1)}'s meals: ${meals.join(', ')}`, refresh: false };
    }

    /**
     * Execute: Query meal prep needed for a specific date
     * Prep is done the day before the meal, so:
     * - "prep for today" = what prep do I need to do TODAY for TOMORROW's meals
     * - "prep for tomorrow" = what prep do I need to do TOMORROW for the day after
     */
    function executeQueryPrepForDate(memberId, dateOffset) {
        // The date we're checking prep FOR (the day we'll be doing the prep)
        let prepDate;
        let prepDayName;
        // The date whose meals need prep (the day after prepDate)
        let mealDate;
        let mealDayName;

        if (dateOffset === 'tomorrow') {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            prepDate = tomorrow.toISOString().split('T')[0];
            prepDayName = 'tomorrow';

            const dayAfter = new Date();
            dayAfter.setDate(dayAfter.getDate() + 2);
            mealDate = dayAfter.toISOString().split('T')[0];

            // Get day name for day after tomorrow
            const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            mealDayName = dayNames[dayAfter.getDay()];
        } else {
            // Today
            prepDate = new Date().toISOString().split('T')[0];
            prepDayName = 'today';

            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            mealDate = tomorrow.toISOString().split('T')[0];
            mealDayName = 'tomorrow';
        }

        const data = Storage.getWidgetData(memberId, 'meal-plan') || { weeklyPlan: {}, recipes: [] };
        const recipes = data.recipes || [];
        const mealPlan = data.weeklyPlan?.[mealDate] || {};

        const prepItems = [];
        const seenItems = new Set();

        // Check both adult and kids variants
        ['adult', 'kids'].forEach(variant => {
            ['breakfast', 'lunch', 'dinner', 'snack'].forEach(mealType => {
                const slot = mealPlan[variant]?.[mealType];
                if (!slot) return;

                // Check for custom prep notes
                if (slot.prepNotes && slot.prepNotes.trim()) {
                    const itemLabel = slot.items?.length > 0 ? slot.items.join(', ') : mealType;
                    const key = `custom:${mealType}:${itemLabel}`;
                    if (!seenItems.has(key)) {
                        seenItems.add(key);
                        prepItems.push({
                            name: itemLabel,
                            instructions: slot.prepNotes,
                            mealType: mealType
                        });
                    }
                }

                // Check for recipes that require prep
                (slot.items || []).forEach(itemName => {
                    const recipe = recipes.find(r => r.name === itemName);
                    if (recipe?.requiresPrep) {
                        const key = `recipe:${itemName}`;
                        if (!seenItems.has(key)) {
                            seenItems.add(key);
                            prepItems.push({
                                name: itemName,
                                instructions: recipe.prepInstructions || 'Prep required',
                                mealType: mealType
                            });
                        }
                    }
                });
            });
        });

        if (prepItems.length === 0) {
            return {
                success: true,
                message: `No meal prep needed ${prepDayName}!`,
                refresh: false
            };
        }

        // Build response with prep instructions included
        const prepDescriptions = prepItems.map(p => {
            // Include the instructions (what to actually prep)
            return `${p.name}: ${p.instructions}`;
        });

        const message = `Prep for ${mealDayName}'s meals: ${prepDescriptions.join('. ')}`;

        return {
            success: true,
            message: message,
            refresh: false
        };
    }

    // ==================== PHASE 4: POINTS EXECUTORS ====================

    /**
     * Execute: Check points balance
     */
    function executeCheckPoints(memberId) {
        const member = Storage.getMember(memberId);
        if (!member || (member.type !== 'kid' && member.type !== 'teen' && member.type !== 'toddler')) {
            return { success: false, message: 'Points are only available for kids' };
        }

        const data = Storage.getWidgetData(memberId, 'points') || { balance: 0 };
        const balance = data.balance || 0;
        const isTeen = member.type === 'teen';

        return {
            success: true,
            message: `You have ${balance} ${isTeen ? 'coins' : 'points'}!`,
            refresh: false
        };
    }

    /**
     * Execute: Check points earned today
     */
    function executePointsToday(memberId) {
        const member = Storage.getMember(memberId);
        if (!member || (member.type !== 'kid' && member.type !== 'teen' && member.type !== 'toddler')) {
            return { success: false, message: 'Points are only available for kids' };
        }

        const data = Storage.getWidgetData(memberId, 'points') || { todayCompleted: [] };
        const today = DateUtils.today();
        const todayActivities = (data.todayCompleted || []).filter(c => c.date === today);
        const todayPoints = todayActivities.reduce((sum, c) => sum + (c.points || 0), 0);

        const isTeen = member.type === 'teen';

        return {
            success: true,
            message: `You earned ${todayPoints} ${isTeen ? 'coins' : 'points'} today!`,
            refresh: false
        };
    }

    // ==================== PHASE 5: CHORE EXECUTORS ====================

    /**
     * Execute: Complete chore
     */
    function executeCompleteChore(memberId, choreName) {
        const data = Storage.getWidgetData(memberId, 'chores') || {};
        const today = DateUtils.today();
        const dailyChores = data.dailyChores?.[today] || [];

        if (dailyChores.length === 0) {
            return { success: false, message: 'No chores assigned for today' };
        }

        // Find matching chore by fuzzy name
        const chore = dailyChores.find(c =>
            c.name.toLowerCase().includes(choreName.toLowerCase()) ||
            choreName.toLowerCase().includes(c.name.toLowerCase())
        );

        if (!chore) {
            const choreNames = dailyChores.map(c => c.name).join(', ');
            return { success: false, message: `Chore "${choreName}" not found. Today's chores: ${choreNames}` };
        }

        // Check if already completed
        const completedIds = (data.completedToday || [])
            .filter(c => c.date === today)
            .map(c => c.choreId);

        if (completedIds.includes(chore.id)) {
            return { success: true, message: `${chore.name} is already done!`, refresh: false };
        }

        // Mark as completed
        const now = new Date().toISOString();
        if (!data.completedToday) data.completedToday = [];
        data.completedToday.push({
            choreId: chore.id,
            date: today,
            points: chore.points
        });

        Storage.setWidgetData(memberId, 'chores', data);
        Storage.trackAction(memberId, 'chores', 'completed');

        // Award points with proper history tracking
        const chorePoints = chore.points || 0;
        if (chorePoints > 0) {
            awardPointsWithHistory(memberId, `chore-${chore.id}`, chore.name, 'list-checks', chorePoints, today, now);
        }

        return { success: true, message: `Completed ${chore.name}! +${chorePoints} points` };
    }

    /**
     * Execute: List chores
     */
    function executeListChores(memberId) {
        const data = Storage.getWidgetData(memberId, 'chores') || {};
        const today = DateUtils.today();
        const dailyChores = data.dailyChores?.[today] || [];

        if (dailyChores.length === 0) {
            return { success: true, message: 'No chores assigned for today', refresh: false };
        }

        const completedIds = (data.completedToday || [])
            .filter(c => c.date === today)
            .map(c => c.choreId);

        const pending = dailyChores.filter(c => !completedIds.includes(c.id));
        const completed = dailyChores.filter(c => completedIds.includes(c.id));

        if (pending.length === 0) {
            return { success: true, message: 'All chores done! Great job!', refresh: false };
        }

        const names = pending.map(c => c.name).join(', ');
        return {
            success: true,
            message: `Pending chores: ${names}. ${completed.length} already done.`,
            refresh: false
        };
    }

    // ==================== WORKOUT EXECUTORS ====================

    /**
     * Execute: Log a workout
     * Works for both adults (workout widget) and kids (kid-workout widget)
     */
    function executeLogWorkout(memberId, activityName, duration) {
        const member = Storage.getMember(memberId);
        const isKid = member?.type === 'kid' || member?.type === 'teen' || member?.type === 'toddler';
        const today = DateUtils.today(); // Use local timezone

        if (isKid) {
            // Kid workout - use kid-workout widget
            return executeLogKidWorkout(memberId, activityName, duration);
        }

        // Adult workout - use workout widget
        const data = Storage.getWidgetData(memberId, 'workout') || {};

        // Default routines if none exist
        const DEFAULT_ROUTINES = [
            { id: 'routine-1', name: 'Morning Run', icon: 'footprints', duration: 30 },
            { id: 'routine-2', name: 'Strength Training', icon: 'dumbbell', duration: 45 },
            { id: 'routine-3', name: 'Yoga', icon: 'heart', duration: 30 },
            { id: 'routine-4', name: 'HIIT', icon: 'zap', duration: 20 },
            { id: 'routine-5', name: 'Cycling', icon: 'bike', duration: 45 },
            { id: 'routine-6', name: 'Swimming', icon: 'waves', duration: 30 }
        ];

        const routines = (Array.isArray(data.routines) && data.routines.length > 0) ? data.routines : DEFAULT_ROUTINES;
        const existingLogs = Array.isArray(data.log) ? data.log : [];

        // Try to find a matching routine by fuzzy name match
        const searchTerm = activityName.toLowerCase();
        let routine = routines.find(r =>
            r.name.toLowerCase().includes(searchTerm) ||
            searchTerm.includes(r.name.toLowerCase())
        );

        // Also try common aliases
        const aliases = {
            'run': 'Morning Run',
            'running': 'Morning Run',
            'jog': 'Morning Run',
            'jogging': 'Morning Run',
            'weights': 'Strength Training',
            'strength': 'Strength Training',
            'lifting': 'Strength Training',
            'gym': 'Strength Training',
            'yoga': 'Yoga',
            'stretching': 'Yoga',
            'hiit': 'HIIT',
            'interval': 'HIIT',
            'cardio': 'HIIT',
            'bike': 'Cycling',
            'cycling': 'Cycling',
            'biking': 'Cycling',
            'swim': 'Swimming',
            'swimming': 'Swimming'
        };

        if (!routine && aliases[searchTerm]) {
            routine = routines.find(r => r.name === aliases[searchTerm]);
        }

        if (!routine) {
            // Create a custom workout entry
            const customDuration = duration || 30;
            const formattedName = activityName.charAt(0).toUpperCase() + activityName.slice(1);

            const newLog = {
                id: `workout-${Date.now()}`,
                date: today,
                routineId: 'custom',
                routineName: formattedName,
                duration: customDuration,
                icon: 'dumbbell',
                createdAt: new Date().toISOString()
            };

            const updatedData = {
                ...data,
                routines: routines,
                log: [newLog, ...existingLogs].slice(0, 365)
            };
            Storage.setWidgetData(memberId, 'workout', updatedData);
            Storage.trackAction(memberId, 'workout', 'logged');

            return { success: true, message: `Logged ${customDuration} minute ${formattedName}!` };
        }

        // Log the matched routine
        const workoutDuration = duration || routine.duration;

        const newLog = {
            id: `workout-${Date.now()}`,
            date: today,
            routineId: routine.id,
            routineName: routine.name,
            duration: workoutDuration,
            icon: routine.icon || 'dumbbell',
            createdAt: new Date().toISOString()
        };

        const updatedData = {
            ...data,
            routines: routines,
            log: [newLog, ...existingLogs].slice(0, 365)
        };
        Storage.setWidgetData(memberId, 'workout', updatedData);
        Storage.trackAction(memberId, 'workout', 'logged');

        return { success: true, message: `Logged ${workoutDuration} minute ${routine.name}!` };
    }

    /**
     * Execute: Log a kid workout activity
     */
    function executeLogKidWorkout(memberId, activityName, duration) {
        const data = Storage.getWidgetData(memberId, 'kid-workout') || { activities: [], log: [] };
        const today = DateUtils.today();

        // Default activities if none exist
        const DEFAULT_ACTIVITIES = [
            { id: 'swimming', name: 'Swimming', icon: 'waves', category: 'sports', duration: 30, points: 15 },
            { id: 'bike-ride', name: 'Bike Ride', icon: 'bike', category: 'outdoor', duration: 20, points: 10 },
            { id: 'soccer', name: 'Soccer', icon: 'circle', category: 'sports', duration: 30, points: 15 },
            { id: 'dance', name: 'Dance Party', icon: 'music', category: 'dance', duration: 15, points: 8 },
            { id: 'jump-rope', name: 'Jump Rope', icon: 'zap', category: 'active', duration: 10, points: 8 },
            { id: 'playground', name: 'Playground', icon: 'sun', category: 'outdoor', duration: 30, points: 12 },
            { id: 'tag', name: 'Tag / Chase', icon: 'footprints', category: 'active', duration: 15, points: 10 },
            { id: 'basketball', name: 'Basketball', icon: 'circle', category: 'sports', duration: 20, points: 12 }
        ];

        const activities = (data.activities && data.activities.length > 0) ? data.activities : DEFAULT_ACTIVITIES;

        // Try to find a matching activity
        const searchTerm = activityName.toLowerCase();
        let activity = activities.find(a =>
            a.name.toLowerCase().includes(searchTerm) ||
            searchTerm.includes(a.name.toLowerCase()) ||
            a.id.toLowerCase().includes(searchTerm)
        );

        // Common aliases for kids
        const aliases = {
            'swim': 'Swimming',
            'swimming': 'Swimming',
            'bike': 'Bike Ride',
            'biking': 'Bike Ride',
            'cycling': 'Bike Ride',
            'soccer': 'Soccer',
            'football': 'Soccer',
            'dance': 'Dance Party',
            'dancing': 'Dance Party',
            'jump rope': 'Jump Rope',
            'jumping': 'Jump Rope',
            'playground': 'Playground',
            'park': 'Playground',
            'tag': 'Tag / Chase',
            'chase': 'Tag / Chase',
            'basketball': 'Basketball',
            'hoops': 'Basketball'
        };

        if (!activity && aliases[searchTerm]) {
            activity = activities.find(a => a.name === aliases[searchTerm]);
        }

        if (!activity) {
            // Create custom activity log
            const customDuration = duration || 20;
            const formattedName = activityName.charAt(0).toUpperCase() + activityName.slice(1);
            const points = Math.round(customDuration / 2); // 1 point per 2 minutes
            const now = new Date().toISOString();

            const logEntry = {
                id: `log-${Date.now()}`,
                activityId: 'custom',
                name: formattedName,
                icon: 'star',
                category: 'custom',
                duration: customDuration,
                points: points,
                date: today,
                createdAt: now
            };

            data.log = [...(data.log || []), logEntry];
            Storage.setWidgetData(memberId, 'kid-workout', data);
            Storage.trackAction(memberId, 'kid-workout', 'logged');

            // Award points with proper history tracking
            awardPointsWithHistory(memberId, 'custom', formattedName, 'star', points, today, now);

            return { success: true, message: `Logged ${formattedName}! +${points} points!` };
        }

        // Log the matched activity
        const activityDuration = duration || activity.duration;
        const points = activity.points || Math.round(activityDuration / 2);
        const now = new Date().toISOString();

        const logEntry = {
            id: `log-${Date.now()}`,
            activityId: activity.id,
            name: activity.name,
            icon: activity.icon,
            category: activity.category,
            duration: activityDuration,
            points: points,
            date: today,
            createdAt: now
        };

        data.log = [...(data.log || []), logEntry];
        Storage.setWidgetData(memberId, 'kid-workout', data);
        Storage.trackAction(memberId, 'kid-workout', 'logged');

        // Award points with proper history tracking
        awardPointsWithHistory(memberId, activity.id, activity.name, activity.icon, points, today, now);

        return { success: true, message: `Logged ${activity.name}! +${points} points!` };
    }

    /**
     * Helper: Award points with proper history tracking for points widget
     */
    function awardPointsWithHistory(memberId, activityId, activityName, activityIcon, points, date, completedAt) {
        const pointsData = Storage.getWidgetData(memberId, 'points') || {
            balance: 0,
            todayCompleted: [],
            history: []
        };

        // Update balance
        pointsData.balance = (pointsData.balance || 0) + points;

        // Add to todayCompleted
        if (!pointsData.todayCompleted) pointsData.todayCompleted = [];
        pointsData.todayCompleted.push({
            activityId: activityId,
            date: date,
            points: points,
            basePoints: points,
            bonus: 0,
            completedAt: completedAt
        });

        // Add to history
        if (!pointsData.history) pointsData.history = [];
        pointsData.history = [
            {
                activityId: activityId,
                activityName: activityName,
                activityIcon: activityIcon,
                date: date,
                completedAt: completedAt,
                points: points,
                basePoints: points,
                bonus: 0,
                type: 'earned'
            },
            ...pointsData.history.slice(0, 99)
        ];

        Storage.setWidgetData(memberId, 'points', pointsData);
        Storage.trackAction(memberId, 'points', 'completed');
    }

    /**
     * Execute: Query today's workouts
     */
    function executeQueryWorkoutToday(memberId) {
        const member = Storage.getMember(memberId);
        const isKid = member?.type === 'kid' || member?.type === 'teen' || member?.type === 'toddler';
        const today = DateUtils.today();

        if (isKid) {
            const data = Storage.getWidgetData(memberId, 'kid-workout') || { log: [] };
            const todayLogs = (data.log || []).filter(l => l.date === today);

            if (todayLogs.length === 0) {
                return { success: true, message: 'No activities logged today yet. Time to get moving!', refresh: false };
            }

            const totalMinutes = todayLogs.reduce((sum, l) => sum + (l.duration || 0), 0);
            const totalPoints = todayLogs.reduce((sum, l) => sum + (l.points || 0), 0);
            const names = todayLogs.map(l => l.name).join(', ');

            return {
                success: true,
                message: `Today: ${names}. Total ${totalMinutes} minutes, ${totalPoints} points!`,
                refresh: false
            };
        }

        // Adult workout
        const data = Storage.getWidgetData(memberId, 'workout') || { log: [] };
        const todayLogs = (data.log || []).filter(l => l.date === today);

        if (todayLogs.length === 0) {
            return { success: true, message: 'No workout logged today yet. Time to move!', refresh: false };
        }

        const totalMinutes = todayLogs.reduce((sum, l) => sum + (l.duration || 0), 0);
        const names = todayLogs.map(l => l.routineName).join(', ');

        return {
            success: true,
            message: `Today's workouts: ${names}. Total ${totalMinutes} minutes!`,
            refresh: false
        };
    }

    /**
     * Execute: Get workout streak
     */
    function executeWorkoutStreak(memberId) {
        const member = Storage.getMember(memberId);
        const isKid = member?.type === 'kid' || member?.type === 'teen' || member?.type === 'toddler';

        const widgetId = isKid ? 'kid-workout' : 'workout';
        const data = Storage.getWidgetData(memberId, widgetId) || { log: [] };
        const logs = data.log || [];

        if (logs.length === 0) {
            return { success: true, message: 'No workout streak yet. Start today!', refresh: false };
        }

        // Calculate streak
        const today = DateUtils.today();
        const yesterdayDate = new Date();
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yesterdayStr = DateUtils.formatISO(yesterdayDate);

        // Get unique dates sorted newest first
        const uniqueDates = [...new Set(logs.map(l => l.date))].sort().reverse();

        // Check if there's a workout today or yesterday
        const latestDate = uniqueDates[0];
        if (latestDate !== today && latestDate !== yesterdayStr) {
            return { success: true, message: 'Workout streak: 0 days. Start a new streak today!', refresh: false };
        }

        let streak = 0;
        let checkDate = DateUtils.parseLocalDate(latestDate === today ? today : yesterdayStr);

        for (const date of uniqueDates) {
            const expectedDate = DateUtils.formatISO(checkDate);
            if (date === expectedDate) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else if (date < expectedDate) {
                break; // Gap found
            }
        }

        const dayWord = streak === 1 ? 'day' : 'days';
        const encouragement = streak >= 7 ? ' Amazing!' : streak >= 3 ? ' Keep it up!' : '';

        return {
            success: true,
            message: `Workout streak: ${streak} ${dayWord}!${encouragement}`,
            refresh: false
        };
    }

    /**
     * Execute: Get weekly workout progress
     */
    function executeWorkoutProgress(memberId) {
        const member = Storage.getMember(memberId);
        const isKid = member?.type === 'kid' || member?.type === 'teen' || member?.type === 'toddler';

        const widgetId = isKid ? 'kid-workout' : 'workout';
        const data = Storage.getWidgetData(memberId, widgetId) || { log: [] };
        const logs = data.log || [];
        const weeklyGoal = isKid ? (data.settings?.weeklyGoal || 5) : (data.weeklyGoal || 4);

        // Get this week's start (Sunday)
        const today = new Date();
        const dayOfWeek = today.getDay();
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - dayOfWeek);
        weekStart.setHours(0, 0, 0, 0);

        // Count unique days with workouts this week
        const thisWeekLogs = logs.filter(l => {
            const logDate = new Date(l.date);
            return logDate >= weekStart && logDate <= today;
        });

        const uniqueDays = new Set(thisWeekLogs.map(l => l.date)).size;
        const totalMinutes = thisWeekLogs.reduce((sum, l) => sum + (l.duration || 0), 0);

        if (uniqueDays === 0) {
            return { success: true, message: `0 of ${weeklyGoal} workout days this week. Let's get started!`, refresh: false };
        }

        const remaining = Math.max(0, weeklyGoal - uniqueDays);
        let message = `${uniqueDays} of ${weeklyGoal} workout days this week (${totalMinutes} minutes total).`;

        if (remaining === 0) {
            message += ' Weekly goal achieved!';
        } else {
            message += ` ${remaining} more to hit your goal.`;
        }

        return { success: true, message, refresh: false };
    }

    /**
     * Execute: Log steps
     */
    function executeLogSteps(memberId, steps) {
        const member = Storage.getMember(memberId);
        if (member?.type !== 'adult') {
            return { success: false, message: 'Step tracking is available for adults only' };
        }

        const data = Storage.getWidgetData(memberId, 'workout') || { stepsLog: {}, stepsGoal: 10000 };
        const today = DateUtils.today();

        if (!data.stepsLog) data.stepsLog = {};
        data.stepsLog[today] = steps;

        Storage.setWidgetData(memberId, 'workout', data);
        Storage.trackAction(memberId, 'workout', 'steps');

        const goal = data.stepsGoal || 10000;
        const progress = Math.round((steps / goal) * 100);
        const message = steps >= goal
            ? `Logged ${steps.toLocaleString()} steps! Goal achieved!`
            : `Logged ${steps.toLocaleString()} steps (${progress}% of goal)`;

        return { success: true, message };
    }

    /**
     * Execute: Query steps today
     */
    function executeQuerySteps(memberId) {
        const member = Storage.getMember(memberId);
        if (member?.type !== 'adult') {
            return { success: false, message: 'Step tracking is available for adults only' };
        }

        const data = Storage.getWidgetData(memberId, 'workout') || { stepsLog: {}, stepsGoal: 10000 };
        const today = DateUtils.today();

        const todaySteps = data.stepsLog?.[today] || 0;
        const goal = data.stepsGoal || 10000;

        if (todaySteps === 0) {
            return { success: true, message: `No steps logged today. Goal: ${goal.toLocaleString()} steps`, refresh: false };
        }

        const progress = Math.round((todaySteps / goal) * 100);
        const remaining = Math.max(0, goal - todaySteps);

        let message = `${todaySteps.toLocaleString()} steps today (${progress}%)`;
        if (remaining > 0) {
            message += `. ${remaining.toLocaleString()} more to hit your goal`;
        } else {
            message += '. Goal achieved!';
        }

        return { success: true, message, refresh: false };
    }

    // ==================== BODY MEASUREMENT EXECUTORS ====================

    /**
     * Get measurements data for a member (mirrors Workout module structure)
     */
    function getMeasurementsDataForVoice(memberId) {
        const data = Storage.getWidgetData(memberId, 'workout') || {};
        const measurements = data.measurements || {};
        return {
            settings: measurements.settings || {
                unit: 'metric',
                enabledMetrics: ['weight', 'waist', 'chest'],
                goals: {},
                customMetrics: []
            },
            log: measurements.log || []
        };
    }

    /**
     * Save measurements data
     */
    function saveMeasurementsDataForVoice(memberId, measurementsData) {
        const data = Storage.getWidgetData(memberId, 'workout') || {};
        data.measurements = measurementsData;
        Storage.setWidgetData(memberId, 'workout', data);
    }

    /**
     * Execute: Log a body measurement
     */
    function executeLogMeasurement(memberId, metricName, value, unitOverride) {
        const member = Storage.getMember(memberId);
        if (member?.type !== 'adult') {
            return { success: false, message: 'Body measurements are available for adults only' };
        }

        const data = getMeasurementsDataForVoice(memberId);
        const settings = data.settings;
        const today = DateUtils.today();

        // Map common aliases to metric IDs
        const metricAliases = {
            'weight': 'weight',
            'waist': 'waist',
            'chest': 'chest',
            'hips': 'hips',
            'thigh': 'thighs',
            'thighs': 'thighs',
            'bicep': 'biceps',
            'biceps': 'biceps',
            'neck': 'neck',
            'calf': 'calves',
            'calves': 'calves',
            'forearm': 'forearms',
            'forearms': 'forearms',
            'bodyfat': 'bodyfat',
            'tummy': 'tummy',
            'tummysize': 'tummy'
        };

        const metricId = metricAliases[metricName] || metricName;

        // Built-in metrics
        const MEASUREMENT_METRICS = [
            { id: 'weight', name: 'Weight', unit: { metric: 'kg', imperial: 'lbs' } },
            { id: 'waist', name: 'Waist', unit: { metric: 'cm', imperial: 'in' } },
            { id: 'chest', name: 'Chest', unit: { metric: 'cm', imperial: 'in' } },
            { id: 'hips', name: 'Hips', unit: { metric: 'cm', imperial: 'in' } },
            { id: 'thighs', name: 'Thighs', unit: { metric: 'cm', imperial: 'in' } },
            { id: 'biceps', name: 'Biceps', unit: { metric: 'cm', imperial: 'in' } },
            { id: 'neck', name: 'Neck', unit: { metric: 'cm', imperial: 'in' } },
            { id: 'bodyfat', name: 'Body Fat', unit: { metric: '%', imperial: '%' } },
            { id: 'tummy', name: 'Tummy Size', unit: { metric: 'cm', imperial: 'in' } }
        ];

        // Get all metrics including custom (with conversionType support)
        const customMetrics = (settings.customMetrics || []).map(cm => {
            let unit, conversionType = 'none';
            switch (cm.type) {
                case 'length':
                    unit = { metric: 'cm', imperial: 'in' };
                    conversionType = 'length';
                    break;
                case 'weight':
                    unit = { metric: 'kg', imperial: 'lbs' };
                    conversionType = 'weight';
                    break;
                case 'percentage':
                    unit = { metric: '%', imperial: '%' };
                    break;
                default:
                    unit = { metric: cm.unitLabel || '', imperial: cm.unitLabel || '' };
                    break;
            }
            return { id: cm.id, name: cm.name, unit, isCustom: true, conversionType };
        });
        const allMetrics = [...MEASUREMENT_METRICS, ...customMetrics];

        const metric = allMetrics.find(m => m.id === metricId);
        if (!metric) {
            return { success: false, message: `Unknown measurement: ${metricName}. Try weight, waist, chest, hips, etc.` };
        }

        // Determine unit system
        const unitSystem = unitOverride || settings.unit;

        // Convert to metric for storage based on conversionType
        let storedValue = value;
        if (unitSystem === 'imperial') {
            if (metric.isCustom) {
                // Custom metric with conversionType
                if (metric.conversionType === 'weight') {
                    storedValue = value * 0.453592; // lbs to kg
                } else if (metric.conversionType === 'length') {
                    storedValue = value * 2.54; // inches to cm
                }
                // 'percentage' and 'none' stay as-is
            } else {
                // Built-in metric
                if (metricId === 'weight') {
                    storedValue = value * 0.453592; // lbs to kg
                } else if (metricId !== 'bodyfat') {
                    storedValue = value * 2.54; // inches to cm
                }
            }
        }

        // Find or create entry for today
        const existingIndex = data.log.findIndex(entry => entry.date === today);

        if (existingIndex >= 0) {
            // Update existing entry
            data.log[existingIndex].values[metricId] = storedValue;
        } else {
            // Create new entry
            data.log.push({
                id: `measurement-${Date.now()}`,
                date: today,
                values: { [metricId]: storedValue }
            });
        }

        // Enable the metric if not already enabled
        if (!settings.enabledMetrics.includes(metricId)) {
            settings.enabledMetrics.push(metricId);
        }

        saveMeasurementsDataForVoice(memberId, data);

        const displayUnit = metric.unit[unitSystem] || metric.unit.metric;
        return {
            success: true,
            message: `Logged ${metric.name}: ${value} ${displayUnit}`
        };
    }

    /**
     * Execute: Query a specific measurement
     */
    function executeQueryMeasurement(memberId, metricName) {
        const member = Storage.getMember(memberId);
        if (member?.type !== 'adult') {
            return { success: false, message: 'Body measurements are available for adults only' };
        }

        const data = getMeasurementsDataForVoice(memberId);
        const settings = data.settings;

        // Map aliases
        const metricAliases = {
            'weight': 'weight',
            'waist': 'waist',
            'chest': 'chest',
            'hips': 'hips',
            'thigh': 'thighs',
            'thighs': 'thighs',
            'bicep': 'biceps',
            'biceps': 'biceps',
            'bodyfat': 'bodyfat',
            'tummy': 'tummy',
            'tummysize': 'tummy'
        };

        const metricId = metricAliases[metricName] || metricName;

        // Built-in metrics
        const MEASUREMENT_METRICS = [
            { id: 'weight', name: 'Weight', unit: { metric: 'kg', imperial: 'lbs' } },
            { id: 'waist', name: 'Waist', unit: { metric: 'cm', imperial: 'in' } },
            { id: 'chest', name: 'Chest', unit: { metric: 'cm', imperial: 'in' } },
            { id: 'hips', name: 'Hips', unit: { metric: 'cm', imperial: 'in' } },
            { id: 'thighs', name: 'Thighs', unit: { metric: 'cm', imperial: 'in' } },
            { id: 'biceps', name: 'Biceps', unit: { metric: 'cm', imperial: 'in' } },
            { id: 'bodyfat', name: 'Body Fat', unit: { metric: '%', imperial: '%' } },
            { id: 'tummy', name: 'Tummy Size', unit: { metric: 'cm', imperial: 'in' } }
        ];

        // Get all metrics including custom (with conversionType support)
        const customMetrics = (settings.customMetrics || []).map(cm => {
            let unit, conversionType = 'none';
            switch (cm.type) {
                case 'length':
                    unit = { metric: 'cm', imperial: 'in' };
                    conversionType = 'length';
                    break;
                case 'weight':
                    unit = { metric: 'kg', imperial: 'lbs' };
                    conversionType = 'weight';
                    break;
                case 'percentage':
                    unit = { metric: '%', imperial: '%' };
                    break;
                default:
                    unit = { metric: cm.unitLabel || '', imperial: cm.unitLabel || '' };
                    break;
            }
            return { id: cm.id, name: cm.name, unit, isCustom: true, conversionType };
        });
        const allMetrics = [...MEASUREMENT_METRICS, ...customMetrics];

        const metric = allMetrics.find(m => m.id === metricId);
        if (!metric) {
            return { success: false, message: `Unknown measurement: ${metricName}` };
        }

        // Sort log by date descending
        const sortedLog = [...data.log].sort((a, b) => new Date(b.date) - new Date(a.date));
        const latestEntry = sortedLog.find(entry => entry.values[metricId] !== undefined);

        if (!latestEntry) {
            return { success: true, message: `No ${metric.name} recorded yet`, refresh: false };
        }

        let displayValue = latestEntry.values[metricId];

        // Convert for display based on conversionType
        if (settings.unit === 'imperial') {
            if (metric.isCustom) {
                if (metric.conversionType === 'weight') {
                    displayValue = displayValue * 2.20462; // kg to lbs
                } else if (metric.conversionType === 'length') {
                    displayValue = displayValue / 2.54; // cm to inches
                }
            } else {
                if (metricId === 'weight') {
                    displayValue = displayValue * 2.20462; // kg to lbs
                } else if (metricId !== 'bodyfat') {
                    displayValue = displayValue / 2.54; // cm to inches
                }
            }
        }

        const displayUnit = metric.unit[settings.unit] || metric.unit.metric;
        const dateStr = new Date(latestEntry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        return {
            success: true,
            message: `${metric.name}: ${displayValue.toFixed(1)} ${displayUnit} (${dateStr})`,
            refresh: false
        };
    }

    /**
     * Execute: Query all measurements
     */
    function executeQueryAllMeasurements(memberId) {
        const member = Storage.getMember(memberId);
        if (member?.type !== 'adult') {
            return { success: false, message: 'Body measurements are available for adults only' };
        }

        const data = getMeasurementsDataForVoice(memberId);
        const settings = data.settings;

        // Built-in metrics
        const MEASUREMENT_METRICS = [
            { id: 'weight', name: 'Weight', unit: { metric: 'kg', imperial: 'lbs' } },
            { id: 'waist', name: 'Waist', unit: { metric: 'cm', imperial: 'in' } },
            { id: 'chest', name: 'Chest', unit: { metric: 'cm', imperial: 'in' } },
            { id: 'hips', name: 'Hips', unit: { metric: 'cm', imperial: 'in' } },
            { id: 'thighs', name: 'Thighs', unit: { metric: 'cm', imperial: 'in' } },
            { id: 'biceps', name: 'Biceps', unit: { metric: 'cm', imperial: 'in' } },
            { id: 'bodyfat', name: 'Body Fat', unit: { metric: '%', imperial: '%' } },
            { id: 'tummy', name: 'Tummy Size', unit: { metric: 'cm', imperial: 'in' } }
        ];

        // Get all metrics including custom (with conversionType support)
        const customMetrics = (settings.customMetrics || []).map(cm => {
            let unit, conversionType = 'none';
            switch (cm.type) {
                case 'length':
                    unit = { metric: 'cm', imperial: 'in' };
                    conversionType = 'length';
                    break;
                case 'weight':
                    unit = { metric: 'kg', imperial: 'lbs' };
                    conversionType = 'weight';
                    break;
                case 'percentage':
                    unit = { metric: '%', imperial: '%' };
                    break;
                default:
                    unit = { metric: cm.unitLabel || '', imperial: cm.unitLabel || '' };
                    break;
            }
            return { id: cm.id, name: cm.name, unit, isCustom: true, conversionType };
        });
        const allMetrics = [...MEASUREMENT_METRICS, ...customMetrics];

        const enabledMetrics = allMetrics.filter(m => settings.enabledMetrics.includes(m.id));

        if (enabledMetrics.length === 0) {
            return { success: true, message: 'No measurements enabled. Add some in the workout widget.', refresh: false };
        }

        // Sort log by date descending
        const sortedLog = [...data.log].sort((a, b) => new Date(b.date) - new Date(a.date));
        const latestEntry = sortedLog[0];

        if (!latestEntry) {
            return { success: true, message: 'No measurements recorded yet', refresh: false };
        }

        const measurements = [];
        enabledMetrics.forEach(metric => {
            const storedValue = latestEntry.values[metric.id];
            if (storedValue !== undefined) {
                let displayValue = storedValue;

                // Convert for display based on conversionType
                if (settings.unit === 'imperial') {
                    if (metric.isCustom) {
                        if (metric.conversionType === 'weight') {
                            displayValue = storedValue * 2.20462;
                        } else if (metric.conversionType === 'length') {
                            displayValue = storedValue / 2.54;
                        }
                    } else {
                        if (metric.id === 'weight') {
                            displayValue = storedValue * 2.20462;
                        } else if (metric.id !== 'bodyfat') {
                            displayValue = storedValue / 2.54;
                        }
                    }
                }

                const displayUnit = metric.unit[settings.unit] || metric.unit.metric;
                measurements.push(`${metric.name}: ${displayValue.toFixed(1)} ${displayUnit}`);
            }
        });

        if (measurements.length === 0) {
            return { success: true, message: 'No measurements recorded yet', refresh: false };
        }

        const dateStr = new Date(latestEntry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return {
            success: true,
            message: `Latest measurements (${dateStr}): ${measurements.join(', ')}`,
            refresh: false
        };
    }

    // ==================== CIRCUIT TIMER EXECUTORS ====================

    /**
     * Execute: Start a circuit timer by name
     */
    function executeStartCircuitTimer(memberId, timerName) {
        const member = Storage.getMember(memberId);
        if (member?.type !== 'adult') {
            return { success: false, message: 'Circuit timer is available for adults only' };
        }

        // Check if CircuitTimer is available
        if (typeof CircuitTimer === 'undefined') {
            return { success: false, message: 'Circuit timer is not available' };
        }

        const data = Storage.getWidgetData(memberId, 'circuit-timer') || {};
        const DEFAULT_PRESETS = [
            { id: 'preset-default-1', name: 'Quick HIIT', blocks: [{ type: 'work', duration: 30 }, { type: 'rest', duration: 15 }], rounds: 8, warmup: 10, cooldown: 0 },
            { id: 'preset-default-2', name: 'Tabata', blocks: [{ type: 'work', duration: 20 }, { type: 'rest', duration: 10 }], rounds: 8, warmup: 0, cooldown: 0 },
            { id: 'preset-default-3', name: 'Endurance', blocks: [{ type: 'work', duration: 60 }, { type: 'rest', duration: 30 }], rounds: 6, warmup: 15, cooldown: 30 }
        ];

        const presets = data.presets?.length > 0 ? data.presets : DEFAULT_PRESETS;

        // Find matching preset by fuzzy name match
        const searchTerm = timerName.toLowerCase();
        const preset = presets.find(p =>
            p.name.toLowerCase().includes(searchTerm) ||
            searchTerm.includes(p.name.toLowerCase())
        );

        if (!preset) {
            // Return with flag so parseCommand knows this was a timer command attempt
            const availableNames = presets.map(p => p.name).join(', ');
            return {
                success: false,
                isTimerCommand: true,
                message: `Timer "${timerName}" not found. Available: ${availableNames}`
            };
        }

        // Start the timer using CircuitTimer module
        if (CircuitTimer.startTimer) {
            CircuitTimer.startTimer(memberId, preset);
            const totalSeconds = calculateTimerDuration(preset);
            const minutes = Math.floor(totalSeconds / 60);
            return {
                success: true,
                message: `Starting ${preset.name}! ${preset.rounds} rounds, ${minutes} minutes total. Let's go!`
            };
        }

        return { success: false, message: 'Could not start timer' };
    }

    /**
     * Helper: Calculate total duration of a timer preset
     */
    function calculateTimerDuration(preset) {
        const blockDuration = preset.blocks.reduce((sum, b) => sum + b.duration, 0);
        const roundsDuration = blockDuration * preset.rounds;
        return (preset.warmup || 0) + roundsDuration + (preset.cooldown || 0);
    }

    /**
     * Execute: Stop/pause the circuit timer
     */
    function executeStopCircuitTimer(memberId) {
        if (typeof CircuitTimer === 'undefined') {
            return { success: false, message: 'Circuit timer is not available' };
        }

        if (CircuitTimer.isRunning && CircuitTimer.isRunning()) {
            if (CircuitTimer.togglePause) {
                CircuitTimer.togglePause();
                return { success: true, message: 'Timer paused', refresh: false };
            }
            if (CircuitTimer.stopTimer) {
                CircuitTimer.stopTimer();
                return { success: true, message: 'Timer stopped' };
            }
        }

        return { success: true, message: 'No timer is currently running', refresh: false };
    }

    /**
     * Execute: Resume the circuit timer
     */
    function executeResumeCircuitTimer(memberId) {
        if (typeof CircuitTimer === 'undefined') {
            return { success: false, message: 'Circuit timer is not available' };
        }

        if (CircuitTimer.isPaused && CircuitTimer.isPaused()) {
            if (CircuitTimer.togglePause) {
                CircuitTimer.togglePause();
                return { success: true, message: 'Timer resumed!', refresh: false };
            }
        }

        return { success: true, message: 'No paused timer to resume', refresh: false };
    }

    /**
     * Execute: List available circuit timers
     */
    function executeListCircuitTimers(memberId) {
        const member = Storage.getMember(memberId);
        if (member?.type !== 'adult') {
            return { success: false, message: 'Circuit timer is available for adults only' };
        }

        const data = Storage.getWidgetData(memberId, 'circuit-timer') || {};
        const DEFAULT_PRESETS = [
            { id: 'preset-default-1', name: 'Quick HIIT' },
            { id: 'preset-default-2', name: 'Tabata' },
            { id: 'preset-default-3', name: 'Endurance' }
        ];

        const presets = data.presets?.length > 0 ? data.presets : DEFAULT_PRESETS;
        const names = presets.map(p => p.name).join(', ');

        return {
            success: true,
            message: `Your timers: ${names}. Say "start" followed by the timer name to begin.`,
            refresh: false
        };
    }

    /**
     * Execute: Get timer status
     */
    function executeTimerStatus(memberId) {
        if (typeof CircuitTimer === 'undefined') {
            return { success: false, message: 'Circuit timer is not available' };
        }

        if (CircuitTimer.getStatus) {
            const status = CircuitTimer.getStatus();
            if (status.isRunning) {
                const phase = status.currentPhase === 'work' ? 'Work' : status.currentPhase === 'rest' ? 'Rest' : status.currentPhase;
                return {
                    success: true,
                    message: `${status.presetName}: Round ${status.currentRound} of ${status.totalRounds}. ${phase} phase, ${status.timeRemaining} seconds left.`,
                    refresh: false
                };
            }
        }

        return { success: true, message: 'No timer is currently running', refresh: false };
    }

    // ==================== SCREEN TIME EXECUTORS ====================

    /**
     * Execute: Start screen time timer
     */
    function executeStartScreenTime(memberId) {
        const member = Storage.getMember(memberId);

        // Only for kids
        if (!member || (member.type !== 'kid' && member.type !== 'teen' && member.type !== 'toddler')) {
            return { success: false, message: 'Screen time tracking is for kids only' };
        }

        // Check if ScreenTime module is available
        if (typeof ScreenTime === 'undefined' || !ScreenTime.startScreenTimer) {
            return { success: false, message: 'Screen time feature is not available' };
        }

        // Check if already running
        if (ScreenTime.isScreenTimerRunning && ScreenTime.isScreenTimerRunning()) {
            const status = ScreenTime.getScreenTimerStatus();
            return {
                success: true,
                message: `Screen time is already running! ${status.remainingMinutes} minutes left.`,
                refresh: false
            };
        }

        // Start the timer
        const result = ScreenTime.startScreenTimer(memberId);

        if (result.success) {
            return {
                success: true,
                message: result.message
            };
        }

        return { success: false, message: result.message };
    }

    /**
     * Execute: Stop screen time timer
     */
    function executeStopScreenTime(memberId) {
        const member = Storage.getMember(memberId);

        // Only for kids
        if (!member || (member.type !== 'kid' && member.type !== 'teen' && member.type !== 'toddler')) {
            return { success: false, message: 'Screen time tracking is for kids only' };
        }

        // Check if ScreenTime module is available
        if (typeof ScreenTime === 'undefined' || !ScreenTime.stopScreenTimer) {
            return { success: false, message: 'Screen time feature is not available' };
        }

        // Check if running
        if (!ScreenTime.isScreenTimerRunning || !ScreenTime.isScreenTimerRunning()) {
            return { success: true, message: 'No screen time timer is running', refresh: false };
        }

        // Stop the timer (this handles rewards/penalties automatically)
        const result = ScreenTime.stopScreenTimer();

        return {
            success: true,
            message: result.message
        };
    }

    /**
     * Execute: Query remaining screen time
     */
    function executeQueryScreenTime(memberId) {
        const member = Storage.getMember(memberId);

        // Only for kids
        if (!member || (member.type !== 'kid' && member.type !== 'teen' && member.type !== 'toddler')) {
            return { success: false, message: 'Screen time tracking is for kids only' };
        }

        // Check if ScreenTime module is available
        if (typeof ScreenTime === 'undefined' || !ScreenTime.getRemainingScreenTime) {
            return { success: false, message: 'Screen time feature is not available' };
        }

        const info = ScreenTime.getRemainingScreenTime(memberId);

        // Format the message
        const limitType = info.isWeekend ? 'weekend' : 'weekday';

        if (info.remaining <= 0) {
            return {
                success: true,
                message: `No screen time left today. You've used all ${formatMinutesForSpeech(info.limit)} of your ${limitType} limit.`,
                refresh: false
            };
        }

        let message = `You have ${formatMinutesForSpeech(info.remaining)} of screen time left today.`;

        if (info.used > 0) {
            message += ` You've used ${formatMinutesForSpeech(info.used)} so far.`;
        }

        return { success: true, message, refresh: false };
    }

    /**
     * Execute: Check screen time timer status
     */
    function executeScreenTimeStatus(memberId) {
        const member = Storage.getMember(memberId);

        // Only for kids
        if (!member || (member.type !== 'kid' && member.type !== 'teen' && member.type !== 'toddler')) {
            return { success: false, message: 'Screen time tracking is for kids only' };
        }

        // Check if ScreenTime module is available
        if (typeof ScreenTime === 'undefined' || !ScreenTime.getScreenTimerStatus) {
            return { success: false, message: 'Screen time feature is not available' };
        }

        const status = ScreenTime.getScreenTimerStatus();

        if (!status.isRunning) {
            return { success: true, message: 'Screen time timer is not running', refresh: false };
        }

        if (status.isOverLimit) {
            return {
                success: true,
                message: `Screen time is OVER the limit! You've been on for ${status.elapsedMinutes} minutes. Stop now to avoid losing more points!`,
                refresh: false
            };
        }

        return {
            success: true,
            message: `Screen time is running. ${formatMinutesForSpeech(status.remainingMinutes)} remaining.`,
            refresh: false
        };
    }

    /**
     * Helper: Format minutes for speech output
     */
    function formatMinutesForSpeech(mins) {
        const hours = Math.floor(mins / 60);
        const minutes = mins % 60;

        if (hours > 0 && minutes > 0) {
            return `${hours} hour${hours > 1 ? 's' : ''} and ${minutes} minute${minutes > 1 ? 's' : ''}`;
        } else if (hours > 0) {
            return `${hours} hour${hours > 1 ? 's' : ''}`;
        } else {
            return `${minutes} minute${minutes > 1 ? 's' : ''}`;
        }
    }

    // ==================== PHASE 6: JOURNAL EXECUTORS ====================

    /**
     * Execute: Add journal entry
     */
    function executeAddJournalEntry(memberId, content) {
        const member = Storage.getMember(memberId);

        // Determine which journal widget to use based on member type
        const widgetId = member?.type === 'adult' ? 'journal' : 'kid-journal';
        const data = Storage.getWidgetData(memberId, widgetId) || { entries: [] };
        const today = DateUtils.today();

        // Check if entry exists for today
        let todayEntry = data.entries.find(e => e.date === today);

        // Capitalize first letter
        const entryText = content.charAt(0).toUpperCase() + content.slice(1);

        if (todayEntry) {
            // Append to existing entry
            todayEntry.content = todayEntry.content
                ? `${todayEntry.content}\n\n${entryText}`
                : entryText;
        } else {
            // Create new entry
            todayEntry = {
                id: `entry-${Date.now()}`,
                date: today,
                content: entryText,
                createdAt: new Date().toISOString()
            };
            data.entries.push(todayEntry);
        }

        Storage.setWidgetData(memberId, widgetId, data);
        Storage.trackAction(memberId, widgetId, 'entry');

        return { success: true, message: 'Journal entry saved!' };
    }

    /**
     * Execute: Set mood
     */
    function executeSetMood(memberId, moodName) {
        const member = Storage.getMember(memberId);
        if (member?.type !== 'adult') {
            return { success: false, message: 'Mood tracking is in the adult journal' };
        }

        const data = Storage.getWidgetData(memberId, 'journal') || { entries: [] };
        const today = DateUtils.today();

        let todayEntry = data.entries.find(e => e.date === today);

        if (!todayEntry) {
            todayEntry = {
                id: `entry-${Date.now()}`,
                date: today,
                content: '',
                createdAt: new Date().toISOString()
            };
            data.entries.push(todayEntry);
        }

        todayEntry.mood = moodName.toLowerCase();
        Storage.setWidgetData(memberId, 'journal', data);

        return { success: true, message: `Set today's mood to ${moodName}` };
    }

    // ==================== UI FUNCTIONS ====================

    /**
     * Show the listening modal
     */
    function showListeningModal() {
        // Remove any existing overlay
        hideListeningModal();

        const overlay = document.createElement('div');
        overlay.id = 'voiceOverlay';
        overlay.className = 'voice-overlay';
        overlay.innerHTML = `
            <div class="voice-modal">
                <div class="voice-modal__icon">
                    <i data-lucide="mic"></i>
                </div>
                <div class="voice-modal__status" id="voiceStatus">Listening...</div>
                <div class="voice-modal__wave">
                    <span></span><span></span><span></span><span></span><span></span>
                </div>
                <div class="voice-modal__transcript" id="voiceTranscript"></div>
                <button class="btn btn--secondary" id="voiceCancelBtn">Cancel</button>
            </div>
        `;
        document.body.appendChild(overlay);

        // Initialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        document.getElementById('voiceCancelBtn').addEventListener('click', () => {
            stopListening();
        });

        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                stopListening();
            }
        });
    }

    /**
     * Hide the listening modal
     */
    function hideListeningModal() {
        const overlay = document.getElementById('voiceOverlay');
        if (overlay) {
            overlay.remove();
        }
    }

    /**
     * Update transcript text in modal
     */
    function updateTranscript(text) {
        const el = document.getElementById('voiceTranscript');
        if (el) {
            el.textContent = `"${text}"`;
        }
    }

    /**
     * Update modal status text
     */
    function updateModalStatus(text) {
        const el = document.getElementById('voiceStatus');
        if (el) {
            el.textContent = text;
        }
    }

    /**
     * Get available voices for TTS
     */
    function getAvailableVoices() {
        if (!synthesis) return [];
        return synthesis.getVoices().filter(voice => voice.lang.startsWith('en'));
    }

    /**
     * Get the selected voice based on settings
     */
    function getSelectedVoice() {
        const settings = Storage.getSettings();
        const voiceName = settings.voiceAssistant?.selectedVoice;
        const voices = getAvailableVoices();

        if (voiceName) {
            const found = voices.find(v => v.name === voiceName);
            if (found) return found;
        }

        // Default to first English voice
        return voices[0] || null;
    }

    /**
     * Provide feedback (TTS or toast)
     */
    function feedback(message) {
        const settings = Storage.getSettings();

        if (settings.voiceAssistant?.ttsEnabled && synthesis) {
            // Stop any ongoing speech
            synthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(message);

            // Apply selected voice
            const voice = getSelectedVoice();
            if (voice) {
                utterance.voice = voice;
            }

            // Apply speed setting (default 1.0)
            utterance.rate = settings.voiceAssistant?.speechRate || 1.0;
            utterance.pitch = 1;

            synthesis.speak(utterance);

            // Also show toast
            Toast.success(message);
        } else {
            Toast.success(message);
        }
    }

    /**
     * Test the voice with a sample message
     */
    function testVoice(voiceName, rate) {
        if (!synthesis) return;

        synthesis.cancel();

        const utterance = new SpeechSynthesisUtterance("Hello! This is how I will sound.");

        if (voiceName) {
            const voices = getAvailableVoices();
            const voice = voices.find(v => v.name === voiceName);
            if (voice) utterance.voice = voice;
        }

        utterance.rate = rate || 1.0;
        synthesis.speak(utterance);
    }

    /**
     * Refresh the dashboard to show changes
     */
    function refreshDashboard() {
        // Re-render immediately - storage is already written by this point
        const memberId = State.getActiveTab();
        const member = Storage.getMember(memberId);
        const widgetContainer = document.getElementById('memberMain');

        if (!widgetContainer || !member) return;

        // Emit event to refresh widgets first
        if (typeof State !== 'undefined' && State.emit) {
            State.emit('widgetDataChanged', { memberId: memberId });
        }

        // Re-render the current member's widgets
        if (typeof WidgetRenderer !== 'undefined' && WidgetRenderer.renderMemberWidgets) {
            // Clear and re-render
            WidgetRenderer.renderMemberWidgets(widgetContainer, member);

            // Re-create icons after render
            if (typeof lucide !== 'undefined') {
                requestAnimationFrame(() => lucide.createIcons());
            }
        }
    }

    /**
     * Voice Commands Reference Data
     * Organized by category for the help modal
     */
    const VOICE_COMMANDS_DATA = {
        tasks: {
            title: 'Tasks',
            icon: 'list-todo',
            commands: [
                { cmd: 'add task [name]', desc: 'Create a new task' },
                { cmd: 'complete task [name]', desc: 'Mark task as done' },
                { cmd: 'delete task [name]', desc: 'Remove a task' },
                { cmd: 'clear completed tasks', desc: 'Remove all done tasks' },
                { cmd: 'how many tasks', desc: 'Count pending tasks' }
            ]
        },
        subtasks: {
            title: 'Subtasks',
            icon: 'list-tree',
            commands: [
                { cmd: 'subtask [name] to [task]', desc: 'Add subtask to a task' },
                { cmd: 'complete subtask [name]', desc: 'Mark subtask as done' }
            ]
        },
        habits: {
            title: 'Habits',
            icon: 'check-circle',
            commands: [
                { cmd: 'check off habit [name]', desc: 'Mark habit done today' },
                { cmd: 'add habit [name]', desc: 'Create a new habit' },
                { cmd: 'uncheck habit [name]', desc: 'Remove today\'s check' },
                { cmd: 'is habit [name] done', desc: 'Check if completed' },
                { cmd: 'what are my habits', desc: 'List today\'s habits' },
                { cmd: 'what\'s my streak', desc: 'Report best streak' }
            ]
        },
        meals: {
            title: 'Meals',
            icon: 'utensils',
            commands: [
                { cmd: 'set [meal] to [food]', desc: 'Set today\'s meal' },
                { cmd: 'add [food] to [meal]', desc: 'Add item to meal' },
                { cmd: '[meal] done', desc: 'Mark meal as completed' },
                { cmd: 'what\'s for [meal]', desc: 'Query today\'s meal' },
                { cmd: 'what\'s the meal plan', desc: 'List all meals today' },
                { cmd: 'set [meal] for tomorrow to [food]', desc: 'Plan tomorrow\'s meal' },
                { cmd: 'any prep today', desc: 'Check meal prep needed' }
            ]
        },
        shopping: {
            title: 'Shopping List',
            icon: 'shopping-cart',
            commands: [
                { cmd: 'add [item] to shopping list', desc: 'Add to general list' },
                { cmd: 'add [item] to [store]', desc: 'Add to specific store' },
                { cmd: 'got [item]', desc: 'Check off item' },
                { cmd: 'what\'s on my list', desc: 'List pending items' },
                { cmd: 'clear checked items', desc: 'Remove checked items' }
            ]
        },
        workout: {
            title: 'Workout',
            icon: 'dumbbell',
            commands: [
                { cmd: 'log [activity]', desc: 'Log a workout' },
                { cmd: 'did [activity] for [X] minutes', desc: 'Log with duration' },
                { cmd: 'did I workout today', desc: 'Check today\'s workouts' },
                { cmd: 'workout streak', desc: 'Check consecutive days' },
                { cmd: 'workout progress', desc: 'Weekly progress vs goal' }
            ]
        },
        steps: {
            title: 'Steps',
            icon: 'footprints',
            adultsOnly: true,
            commands: [
                { cmd: 'log [X] steps', desc: 'Record today\'s steps' },
                { cmd: 'how many steps', desc: 'Check steps vs goal' }
            ]
        },
        measurements: {
            title: 'Body Measurements',
            icon: 'ruler',
            adultsOnly: true,
            commands: [
                { cmd: 'log weight [X] kg', desc: 'Log weight measurement' },
                { cmd: 'log [metric] [X]', desc: 'Log waist, chest, etc.' },
                { cmd: 'what\'s my weight', desc: 'Query latest weight' },
                { cmd: 'my measurements', desc: 'Show all measurements' }
            ]
        },
        timer: {
            title: 'Circuit Timer',
            icon: 'timer',
            adultsOnly: true,
            commands: [
                { cmd: 'start [timer name]', desc: 'Start a saved timer' },
                { cmd: 'stop timer', desc: 'Pause current timer' },
                { cmd: 'resume timer', desc: 'Continue paused timer' },
                { cmd: 'list timers', desc: 'Show available timers' },
                { cmd: 'timer status', desc: 'Check time remaining' }
            ]
        },
        screenTime: {
            title: 'Screen Time',
            icon: 'monitor',
            kidsOnly: true,
            commands: [
                { cmd: 'start screen time', desc: 'Start countdown timer' },
                { cmd: 'stop screen time', desc: 'Stop and log usage' },
                { cmd: 'how much screen time', desc: 'Check time remaining' }
            ]
        },
        chores: {
            title: 'Chores',
            icon: 'sparkles',
            kidsOnly: true,
            commands: [
                { cmd: 'what are my chores', desc: 'List today\'s chores' },
                { cmd: 'complete chore [name]', desc: 'Mark chore done' }
            ]
        },
        points: {
            title: 'Points',
            icon: 'star',
            kidsOnly: true,
            commands: [
                { cmd: 'how many points', desc: 'Check point balance' },
                { cmd: 'points today', desc: 'Points earned today' }
            ]
        },
        journal: {
            title: 'Journal',
            icon: 'book-open',
            commands: [
                { cmd: 'journal [text]', desc: 'Add journal entry' },
                { cmd: 'feeling [mood]', desc: 'Set today\'s mood (adults)' }
            ]
        }
    };

    /**
     * Show Voice Commands Reference Modal
     */
    function showVoiceCommandsModal() {
        const memberId = State.getActiveTab();
        const member = memberId ? Storage.getMember(memberId) : null;
        const isKid = member?.type === 'kid' || member?.type === 'teen' || member?.type === 'toddler';

        // Build the modal content
        let content = `
            <div class="voice-commands-modal">
                <div class="voice-commands-modal__intro">
                    <p>Click the <strong>microphone button</strong> and speak clearly. Use keywords like "task", "habit", "chore" to specify the widget.</p>
                </div>
                <div class="voice-commands-modal__categories">
        `;

        // Render each category
        Object.entries(VOICE_COMMANDS_DATA).forEach(([key, category]) => {
            // Skip categories based on user type
            if (category.adultsOnly && isKid) return;
            if (category.kidsOnly && !isKid) return;

            content += `
                <div class="voice-commands-category">
                    <div class="voice-commands-category__header">
                        <i data-lucide="${category.icon}"></i>
                        <span>${category.title}</span>
                        ${category.adultsOnly ? '<span class="voice-commands-badge">Adults</span>' : ''}
                        ${category.kidsOnly ? '<span class="voice-commands-badge voice-commands-badge--kids">Kids</span>' : ''}
                    </div>
                    <div class="voice-commands-category__list">
                        ${category.commands.map(cmd => `
                            <div class="voice-commands-item">
                                <code class="voice-commands-item__cmd">"${cmd.cmd}"</code>
                                <span class="voice-commands-item__desc">${cmd.desc}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        });

        content += `
                </div>
                <div class="voice-commands-modal__tips">
                    <h4><i data-lucide="lightbulb"></i> Tips</h4>
                    <ul>
                        <li>Commands are case-insensitive</li>
                        <li>Partial names work (e.g., "complete task grocery" matches "Buy groceries")</li>
                        <li>Say <strong>"help"</strong> anytime to see this reference</li>
                    </ul>
                </div>
            </div>
        `;

        Modal.open({
            title: 'Voice Commands Reference',
            content,
            size: 'large'
        });

        // Create icons after modal opens
        setTimeout(() => {
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }, 50);
    }

    // Public API
    return {
        init,
        startListening,
        stopListening,
        isSupported,
        isListening: () => isListening,
        getAvailableVoices,
        testVoice,
        showVoiceCommandsModal
    };
})();

// Also expose globally for the help command callback
const showVoiceCommandsModal = VoiceAssistant.showVoiceCommandsModal;
