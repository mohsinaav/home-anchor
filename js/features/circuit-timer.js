/**
 * Circuit Timer Feature
 * Interval workout timer with saved presets for adults
 */

const CircuitTimer = (function() {
    // Default presets for new users
    const DEFAULT_PRESETS = [
        {
            id: 'preset-default-1',
            name: 'Quick HIIT',
            blocks: [
                { type: 'work', duration: 30 },
                { type: 'rest', duration: 15 }
            ],
            rounds: 8,
            warmup: 10,
            cooldown: 0,
            createdAt: new Date().toISOString()
        },
        {
            id: 'preset-default-2',
            name: 'Tabata',
            blocks: [
                { type: 'work', duration: 20 },
                { type: 'rest', duration: 10 }
            ],
            rounds: 8,
            warmup: 0,
            cooldown: 0,
            createdAt: new Date().toISOString()
        },
        {
            id: 'preset-default-3',
            name: 'Endurance',
            blocks: [
                { type: 'work', duration: 60 },
                { type: 'rest', duration: 30 }
            ],
            rounds: 6,
            warmup: 15,
            cooldown: 30,
            createdAt: new Date().toISOString()
        }
    ];

    // Timer state
    let timerState = {
        isRunning: false,
        isPaused: false,
        preset: null,
        currentPhase: 'idle', // idle, warmup, work, rest, cooldown, complete
        currentRound: 1,
        currentBlockIndex: 0,
        timeRemaining: 0,
        totalElapsed: 0,
        intervalId: null
    };

    // Audio context for beeps
    let audioContext = null;

    /**
     * Get widget data with defaults
     */
    function getWidgetData(memberId) {
        const storedData = Storage.getWidgetData(memberId, 'circuit-timer') || {};

        return {
            presets: storedData.presets?.length > 0 ? storedData.presets : [...DEFAULT_PRESETS],
            history: storedData.history || []
        };
    }

    /**
     * Save widget data
     */
    function saveWidgetData(memberId, data) {
        Storage.setWidgetData(memberId, 'circuit-timer', data);
    }

    /**
     * Format seconds to MM:SS
     */
    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * Calculate total duration of a preset
     */
    function calculateTotalDuration(preset) {
        const blockDuration = preset.blocks.reduce((sum, b) => sum + b.duration, 0);
        const roundsDuration = blockDuration * preset.rounds;
        return (preset.warmup || 0) + roundsDuration + (preset.cooldown || 0);
    }

    /**
     * Render the widget
     */
    function renderWidget(container, memberId) {
        const data = getWidgetData(memberId);
        const presets = data.presets.slice(0, 6);

        // Color palette for preset cards
        const presetColors = [
            { bg: 'linear-gradient(135deg, #D1FAE5 0%, #6EE7B7 100%)', color: '#065F46' },
            { bg: 'linear-gradient(135deg, #DBEAFE 0%, #93C5FD 100%)', color: '#1E40AF' },
            { bg: 'linear-gradient(135deg, #FEF3C7 0%, #FCD34D 100%)', color: '#92400E' },
            { bg: 'linear-gradient(135deg, #EDE9FE 0%, #C4B5FD 100%)', color: '#5B21B6' },
            { bg: 'linear-gradient(135deg, #FCE7F3 0%, #F9A8D4 100%)', color: '#9D174D' },
            { bg: 'linear-gradient(135deg, #FFEDD5 0%, #FDBA74 100%)', color: '#9A3412' }
        ];

        container.innerHTML = `
            <div class="circuit-timer-widget">
                <div class="circuit-timer-widget__grid">
                    ${presets.map((preset, index) => {
                        const workBlock = preset.blocks.find(b => b.type === 'work');
                        const restBlock = preset.blocks.find(b => b.type === 'rest');
                        const totalDuration = calculateTotalDuration(preset);
                        const colorScheme = presetColors[index % presetColors.length];

                        return `
                            <button class="circuit-timer-card" data-preset-id="${preset.id}">
                                <div class="circuit-timer-card__icon" style="background: ${colorScheme.bg}; color: ${colorScheme.color}">
                                    <i data-lucide="play"></i>
                                </div>
                                <div class="circuit-timer-card__name">${preset.name}</div>
                                <div class="circuit-timer-card__details">
                                    ${workBlock?.duration || 0}s / ${restBlock?.duration || 0}s × ${preset.rounds}
                                </div>
                                <div class="circuit-timer-card__duration">${formatTime(totalDuration)}</div>
                            </button>
                        `;
                    }).join('')}

                    <!-- Add new timer card -->
                    <button class="circuit-timer-card circuit-timer-card--add" data-action="create-timer">
                        <div class="circuit-timer-card__icon circuit-timer-card__icon--add">
                            <i data-lucide="plus"></i>
                        </div>
                        <div class="circuit-timer-card__name">New Timer</div>
                        <div class="circuit-timer-card__details">Create custom</div>
                    </button>
                </div>

                <div class="circuit-timer-widget__footer">
                    <button class="btn btn--sm btn--ghost" data-action="open-workout">
                        <i data-lucide="dumbbell"></i>
                        Workout
                    </button>
                    <button class="btn btn--sm btn--ghost" data-action="manage-presets">
                        <i data-lucide="settings"></i>
                    </button>
                </div>
            </div>
        `;

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        bindWidgetEvents(container, memberId);
    }

    /**
     * Bind widget events
     */
    function bindWidgetEvents(container, memberId) {
        // Start preset (cards with preset IDs)
        container.querySelectorAll('.circuit-timer-card[data-preset-id]').forEach(btn => {
            btn.addEventListener('click', () => {
                const presetId = btn.dataset.presetId;
                const data = getWidgetData(memberId);
                const preset = data.presets.find(p => p.id === presetId);
                if (preset) {
                    startTimer(memberId, preset);
                }
            });
        });

        // Create timer (the "New Timer" card)
        container.querySelector('[data-action="create-timer"]')?.addEventListener('click', () => {
            showCreateTimerModal(memberId);
        });

        // Manage presets
        container.querySelector('[data-action="manage-presets"]')?.addEventListener('click', () => {
            showManagePresetsModal(memberId);
        });

        // Open workout - scroll to Workout widget or switch focus to it
        container.querySelector('[data-action="open-workout"]')?.addEventListener('click', () => {
            const workoutWidget = document.getElementById('widget-workout');
            if (workoutWidget) {
                // Widget is already rendered/focused, scroll to it
                const widgetCard = workoutWidget.closest('.widget-card');
                if (widgetCard) {
                    widgetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    widgetCard.classList.add('widget-card--highlight');
                    setTimeout(() => widgetCard.classList.remove('widget-card--highlight'), 2000);
                }
            } else {
                // Try to find the collapsed widget card and click it to focus
                const collapsedCard = document.querySelector('[data-focus-widget="workout"]');
                if (collapsedCard) {
                    collapsedCard.click();
                    // After focus switch, scroll to and highlight
                    setTimeout(() => {
                        const newWidget = document.getElementById('widget-workout');
                        if (newWidget) {
                            const widgetCard = newWidget.closest('.widget-card');
                            if (widgetCard) {
                                widgetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                widgetCard.classList.add('widget-card--highlight');
                                setTimeout(() => widgetCard.classList.remove('widget-card--highlight'), 2000);
                            }
                        }
                    }, 100);
                } else {
                    Toast.info('Workout widget not added. Add it from the widget settings!');
                }
            }
        });
    }

    /**
     * Show create timer modal
     */
    function showCreateTimerModal(memberId, editPreset = null) {
        const isEdit = !!editPreset;
        const preset = editPreset || {
            name: '',
            blocks: [
                { type: 'work', duration: 30 },
                { type: 'rest', duration: 15 }
            ],
            rounds: 8,
            warmup: 0,
            cooldown: 0
        };

        const workBlock = preset.blocks.find(b => b.type === 'work') || { duration: 30 };
        const restBlock = preset.blocks.find(b => b.type === 'rest') || { duration: 15 };

        const content = `
            <div class="create-timer-form">
                <div class="form-group">
                    <label class="form-label">Timer Name</label>
                    <input type="text" class="form-input" id="timerName"
                           value="${preset.name}" placeholder="My Workout">
                </div>

                <div class="create-timer-form__blocks">
                    <div class="create-timer-block create-timer-block--work">
                        <label class="form-label">
                            <i data-lucide="zap"></i>
                            Work Time
                        </label>
                        <div class="create-timer-block__input">
                            <input type="number" class="form-input" id="workDuration"
                                   value="${workBlock.duration}" min="5" max="300">
                            <span class="create-timer-block__unit">sec</span>
                        </div>
                    </div>
                    <div class="create-timer-block create-timer-block--rest">
                        <label class="form-label">
                            <i data-lucide="pause"></i>
                            Rest Time
                        </label>
                        <div class="create-timer-block__input">
                            <input type="number" class="form-input" id="restDuration"
                                   value="${restBlock.duration}" min="5" max="120">
                            <span class="create-timer-block__unit">sec</span>
                        </div>
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">Number of Rounds</label>
                    <input type="number" class="form-input" id="timerRounds"
                           value="${preset.rounds}" min="1" max="50">
                </div>

                <div class="create-timer-form__extras">
                    <div class="form-group form-group--inline">
                        <label class="form-label">Warmup</label>
                        <input type="number" class="form-input form-input--sm" id="timerWarmup"
                               value="${preset.warmup}" min="0" max="60" placeholder="0">
                        <span class="text-muted">sec</span>
                    </div>
                    <div class="form-group form-group--inline">
                        <label class="form-label">Cooldown</label>
                        <input type="number" class="form-input form-input--sm" id="timerCooldown"
                               value="${preset.cooldown}" min="0" max="60" placeholder="0">
                        <span class="text-muted">sec</span>
                    </div>
                </div>

                <div class="create-timer-form__preview" id="timerPreview">
                    Total: ${formatTime(calculateTotalDuration(preset))}
                </div>
            </div>
        `;

        Modal.open({
            title: isEdit ? 'Edit Timer' : 'Create Timer',
            content,
            footer: `
                <button class="btn btn--secondary" data-modal-cancel>Cancel</button>
                <button class="btn btn--primary" id="saveTimerBtn">
                    <i data-lucide="check"></i>
                    ${isEdit ? 'Save' : 'Save & Start'}
                </button>
            `
        });

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Update preview on input change
        const updatePreview = () => {
            const workDuration = parseInt(document.getElementById('workDuration')?.value) || 30;
            const restDuration = parseInt(document.getElementById('restDuration')?.value) || 15;
            const rounds = parseInt(document.getElementById('timerRounds')?.value) || 8;
            const warmup = parseInt(document.getElementById('timerWarmup')?.value) || 0;
            const cooldown = parseInt(document.getElementById('timerCooldown')?.value) || 0;

            const total = warmup + ((workDuration + restDuration) * rounds) + cooldown;
            document.getElementById('timerPreview').textContent = `Total: ${formatTime(total)}`;
        };

        ['workDuration', 'restDuration', 'timerRounds', 'timerWarmup', 'timerCooldown'].forEach(id => {
            document.getElementById(id)?.addEventListener('input', updatePreview);
        });

        // Cancel button
        document.querySelector('[data-modal-cancel]')?.addEventListener('click', () => {
            Modal.close();
        });

        // Save button
        document.getElementById('saveTimerBtn')?.addEventListener('click', () => {
            const name = document.getElementById('timerName')?.value?.trim() || 'My Workout';
            const workDuration = parseInt(document.getElementById('workDuration')?.value) || 30;
            const restDuration = parseInt(document.getElementById('restDuration')?.value) || 15;
            const rounds = parseInt(document.getElementById('timerRounds')?.value) || 8;
            const warmup = parseInt(document.getElementById('timerWarmup')?.value) || 0;
            const cooldown = parseInt(document.getElementById('timerCooldown')?.value) || 0;

            const newPreset = {
                id: isEdit ? editPreset.id : `preset-${Date.now()}`,
                name,
                blocks: [
                    { type: 'work', duration: workDuration },
                    { type: 'rest', duration: restDuration }
                ],
                rounds,
                warmup,
                cooldown,
                createdAt: isEdit ? editPreset.createdAt : new Date().toISOString()
            };

            const data = getWidgetData(memberId);

            if (isEdit) {
                const index = data.presets.findIndex(p => p.id === editPreset.id);
                if (index !== -1) {
                    data.presets[index] = newPreset;
                }
            } else {
                data.presets.unshift(newPreset);
            }

            saveWidgetData(memberId, data);
            Modal.close();

            // Refresh the widget to show the new/updated preset
            refreshWidget(memberId);

            if (!isEdit) {
                // Start the timer immediately
                setTimeout(() => startTimer(memberId, newPreset), 250);
            } else {
                Toast.success('Timer saved!');
            }
        });
    }

    /**
     * Refresh the widget display
     */
    function refreshWidget(memberId) {
        const widgetBody = document.getElementById('widget-circuit-timer');
        if (widgetBody) {
            renderWidget(widgetBody, memberId);
        }
    }

    /**
     * Show manage presets modal
     */
    function showManagePresetsModal(memberId) {
        const data = getWidgetData(memberId);

        const content = `
            <div class="manage-presets">
                <div class="manage-presets__list">
                    ${data.presets.length === 0 ? `
                        <p class="text-center text-muted" style="padding: 16px;">No presets yet</p>
                    ` : data.presets.map(preset => {
                        const workBlock = preset.blocks.find(b => b.type === 'work');
                        const restBlock = preset.blocks.find(b => b.type === 'rest');

                        return `
                            <div class="manage-presets__item">
                                <div class="manage-presets__info">
                                    <span class="manage-presets__name">${preset.name}</span>
                                    <span class="manage-presets__details">
                                        ${workBlock?.duration || 0}s / ${restBlock?.duration || 0}s × ${preset.rounds}
                                    </span>
                                </div>
                                <div class="manage-presets__actions">
                                    <button class="btn btn--icon btn--ghost btn--sm" data-edit="${preset.id}">
                                        <i data-lucide="pencil"></i>
                                    </button>
                                    <button class="btn btn--icon btn--ghost btn--sm" data-delete="${preset.id}">
                                        <i data-lucide="trash-2"></i>
                                    </button>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;

        Modal.open({
            title: 'Manage Timers',
            content,
            footer: '<button class="btn btn--primary" data-modal-done>Done</button>'
        });

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Edit preset
        document.querySelectorAll('[data-edit]').forEach(btn => {
            btn.addEventListener('click', () => {
                const presetId = btn.dataset.edit;
                const preset = data.presets.find(p => p.id === presetId);
                if (preset) {
                    Modal.close();
                    setTimeout(() => showCreateTimerModal(memberId, preset), 250);
                }
            });
        });

        // Delete preset
        document.querySelectorAll('[data-delete]').forEach(btn => {
            btn.addEventListener('click', () => {
                const presetId = btn.dataset.delete;
                data.presets = data.presets.filter(p => p.id !== presetId);
                saveWidgetData(memberId, data);
                Toast.success('Timer deleted');
                // Refresh widget immediately
                refreshWidget(memberId);
                Modal.close();
                setTimeout(() => showManagePresetsModal(memberId), 250);
            });
        });

        // Done button
        document.querySelector('[data-modal-done]')?.addEventListener('click', () => {
            Modal.close();
            // Refresh widget
            refreshWidget(memberId);
        });
    }

    /**
     * Initialize audio context
     */
    function initAudio() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        return audioContext;
    }

    /**
     * Play a beep sound
     */
    function playBeep(frequency = 800, duration = 100, type = 'sine') {
        try {
            const ctx = initAudio();
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.type = type;
            oscillator.frequency.value = frequency;
            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000);

            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + duration / 1000);
        } catch (e) {
            console.log('Audio not available');
        }
    }

    /**
     * Play countdown beeps (3, 2, 1)
     */
    function playCountdownBeep() {
        playBeep(600, 150);
    }

    /**
     * Play phase change sound
     */
    function playPhaseChange(phase) {
        if (phase === 'work') {
            playBeep(1000, 200);
            setTimeout(() => playBeep(1200, 200), 150);
        } else if (phase === 'rest') {
            playBeep(600, 300);
        } else if (phase === 'complete') {
            playBeep(800, 150);
            setTimeout(() => playBeep(1000, 150), 150);
            setTimeout(() => playBeep(1200, 300), 300);
        }
    }

    /**
     * Start the timer
     */
    function startTimer(memberId, preset) {
        // Reset state
        timerState = {
            isRunning: true,
            isPaused: false,
            preset: preset,
            currentPhase: preset.warmup > 0 ? 'warmup' : 'work',
            currentRound: 1,
            currentBlockIndex: 0,
            timeRemaining: preset.warmup > 0 ? preset.warmup : preset.blocks[0].duration,
            totalElapsed: 0,
            intervalId: null,
            memberId: memberId
        };

        renderTimerScreen(memberId);
        startInterval();
    }

    /**
     * Start the interval
     */
    function startInterval() {
        if (timerState.intervalId) {
            clearInterval(timerState.intervalId);
        }

        timerState.intervalId = setInterval(() => {
            if (!timerState.isPaused && timerState.isRunning) {
                tick();
            }
        }, 1000);
    }

    /**
     * Handle timer tick
     */
    function tick() {
        // Countdown beeps for last 3 seconds
        if (timerState.timeRemaining <= 3 && timerState.timeRemaining > 0) {
            playCountdownBeep();
        }

        timerState.timeRemaining--;
        timerState.totalElapsed++;

        if (timerState.timeRemaining <= 0) {
            advancePhase();
        }

        updateTimerDisplay();
    }

    /**
     * Advance to next phase
     */
    function advancePhase() {
        const { preset, currentPhase, currentRound, currentBlockIndex } = timerState;

        if (currentPhase === 'warmup') {
            // Move to first work block
            timerState.currentPhase = 'work';
            timerState.currentBlockIndex = 0;
            timerState.timeRemaining = preset.blocks[0].duration;
            playPhaseChange('work');
        } else if (currentPhase === 'work') {
            // Move to rest
            const restBlock = preset.blocks.find(b => b.type === 'rest');
            if (restBlock) {
                timerState.currentPhase = 'rest';
                timerState.timeRemaining = restBlock.duration;
                playPhaseChange('rest');
            } else {
                // No rest, go to next round or complete
                if (currentRound < preset.rounds) {
                    timerState.currentRound++;
                    timerState.timeRemaining = preset.blocks[0].duration;
                    playPhaseChange('work');
                } else {
                    goToCooldownOrComplete();
                }
            }
        } else if (currentPhase === 'rest') {
            // Check if we need more rounds
            if (currentRound < preset.rounds) {
                timerState.currentRound++;
                timerState.currentPhase = 'work';
                timerState.timeRemaining = preset.blocks[0].duration;
                playPhaseChange('work');
            } else {
                goToCooldownOrComplete();
            }
        } else if (currentPhase === 'cooldown') {
            completeTimer();
        }
    }

    /**
     * Go to cooldown or complete
     */
    function goToCooldownOrComplete() {
        if (timerState.preset.cooldown > 0) {
            timerState.currentPhase = 'cooldown';
            timerState.timeRemaining = timerState.preset.cooldown;
            playPhaseChange('rest');
        } else {
            completeTimer();
        }
    }

    /**
     * Complete the timer
     */
    function completeTimer() {
        timerState.currentPhase = 'complete';
        timerState.isRunning = false;
        clearInterval(timerState.intervalId);
        playPhaseChange('complete');
        showCompletionScreen();
    }

    /**
     * Stop the timer
     */
    function stopTimer() {
        timerState.isRunning = false;
        timerState.isPaused = false;
        clearInterval(timerState.intervalId);
    }

    /**
     * Toggle pause
     */
    function togglePause() {
        timerState.isPaused = !timerState.isPaused;
        updateTimerDisplay();
    }

    /**
     * Render the timer screen
     */
    function renderTimerScreen(memberId) {
        const { preset, currentPhase, currentRound, timeRemaining } = timerState;
        const totalDuration = calculateTotalDuration(preset);

        // Create fullscreen overlay
        const overlay = document.createElement('div');
        overlay.className = 'circuit-timer-screen';
        overlay.id = 'circuitTimerScreen';
        overlay.innerHTML = `
            <div class="circuit-timer-screen__content">
                <div class="circuit-timer-screen__header">
                    <span class="circuit-timer-screen__name">${preset.name}</span>
                    <span class="circuit-timer-screen__round">Round ${currentRound} of ${preset.rounds}</span>
                </div>

                <div class="circuit-timer-screen__display">
                    <div class="circuit-timer-screen__time" id="timerDisplay">
                        ${formatTime(timeRemaining)}
                    </div>
                    <div class="circuit-timer-screen__phase circuit-timer-screen__phase--${currentPhase}" id="timerPhase">
                        ${currentPhase.toUpperCase()}
                    </div>
                </div>

                <div class="circuit-timer-screen__progress">
                    <div class="circuit-timer-screen__progress-bar" id="timerProgress" style="width: 100%"></div>
                </div>

                <div class="circuit-timer-screen__controls">
                    <button class="circuit-timer-btn circuit-timer-btn--pause" id="pauseBtn">
                        <i data-lucide="pause"></i>
                        Pause
                    </button>
                    <button class="circuit-timer-btn circuit-timer-btn--stop" id="stopBtn">
                        <i data-lucide="square"></i>
                        Stop
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Bind controls
        document.getElementById('pauseBtn')?.addEventListener('click', () => {
            togglePause();
            const btn = document.getElementById('pauseBtn');
            if (timerState.isPaused) {
                btn.innerHTML = '<i data-lucide="play"></i> Resume';
            } else {
                btn.innerHTML = '<i data-lucide="pause"></i> Pause';
            }
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        });

        document.getElementById('stopBtn')?.addEventListener('click', () => {
            if (confirm('Stop the timer?')) {
                stopTimer();
                document.getElementById('circuitTimerScreen')?.remove();
                // Refresh widget in case any changes happened
                refreshWidget(memberId);
            }
        });
    }

    /**
     * Update timer display
     */
    function updateTimerDisplay() {
        const { currentPhase, timeRemaining, currentRound, preset } = timerState;

        const displayEl = document.getElementById('timerDisplay');
        const phaseEl = document.getElementById('timerPhase');
        const progressEl = document.getElementById('timerProgress');
        const roundEl = document.querySelector('.circuit-timer-screen__round');

        if (displayEl) {
            displayEl.textContent = formatTime(timeRemaining);
        }

        if (phaseEl) {
            phaseEl.textContent = currentPhase.toUpperCase();
            phaseEl.className = `circuit-timer-screen__phase circuit-timer-screen__phase--${currentPhase}`;
        }

        if (roundEl && preset) {
            roundEl.textContent = `Round ${currentRound} of ${preset.rounds}`;
        }

        if (progressEl) {
            let maxTime = 0;
            if (currentPhase === 'warmup') {
                maxTime = preset.warmup;
            } else if (currentPhase === 'cooldown') {
                maxTime = preset.cooldown;
            } else {
                const block = preset.blocks.find(b => b.type === currentPhase);
                maxTime = block?.duration || 30;
            }
            const progress = (timeRemaining / maxTime) * 100;
            progressEl.style.width = `${progress}%`;
        }
    }

    /**
     * Show completion screen
     */
    function showCompletionScreen() {
        const { preset, totalElapsed, memberId } = timerState;
        const screen = document.getElementById('circuitTimerScreen');

        if (screen) {
            screen.innerHTML = `
                <div class="circuit-timer-screen__content circuit-timer-screen__content--complete">
                    <div class="circuit-timer-complete">
                        <div class="circuit-timer-complete__icon">
                            <i data-lucide="trophy"></i>
                        </div>
                        <h2 class="circuit-timer-complete__title">Workout Complete!</h2>
                        <div class="circuit-timer-complete__stats">
                            <div class="circuit-timer-complete__stat">
                                <span class="circuit-timer-complete__stat-value">${formatTime(totalElapsed)}</span>
                                <span class="circuit-timer-complete__stat-label">Total Time</span>
                            </div>
                            <div class="circuit-timer-complete__stat">
                                <span class="circuit-timer-complete__stat-value">${preset.rounds}</span>
                                <span class="circuit-timer-complete__stat-label">Rounds</span>
                            </div>
                        </div>
                        <div class="circuit-timer-complete__actions">
                            <button class="btn btn--primary btn--lg" id="logWorkoutBtn">
                                <i data-lucide="plus"></i>
                                Log as Workout
                            </button>
                            <button class="btn btn--secondary btn--lg" id="closeTimerBtn">
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            `;

            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }

            // Log workout button
            document.getElementById('logWorkoutBtn')?.addEventListener('click', () => {
                screen.remove();
                showLogWorkoutPrompt(memberId, totalElapsed);
            });

            // Close button
            document.getElementById('closeTimerBtn')?.addEventListener('click', () => {
                screen.remove();
                // Refresh widget
                refreshWidget(memberId);
            });

            // Save to history
            const data = getWidgetData(memberId);
            data.history.unshift({
                id: `history-${Date.now()}`,
                presetId: preset.id,
                presetName: preset.name,
                completedAt: new Date().toISOString(),
                totalDuration: totalElapsed
            });
            data.history = data.history.slice(0, 50); // Keep last 50
            saveWidgetData(memberId, data);
        }
    }

    /**
     * Show log workout prompt
     */
    function showLogWorkoutPrompt(memberId, duration) {
        // Get workout routines
        const workoutData = Storage.getWidgetData(memberId, 'workout') || {};
        const routines = workoutData.routines || [];

        if (routines.length === 0) {
            Toast.info('No workout routines found. Add some in the Workout widget first!');
            return;
        }

        const content = `
            <div class="log-workout-prompt">
                <p>Select a routine to log this ${Math.floor(duration / 60)} minute workout:</p>
                <div class="log-workout-prompt__list">
                    ${routines.map(routine => `
                        <button class="log-workout-prompt__routine" data-routine-id="${routine.id}">
                            <i data-lucide="${routine.icon || 'dumbbell'}"></i>
                            <span>${routine.name}</span>
                        </button>
                    `).join('')}
                </div>
            </div>
        `;

        Modal.open({
            title: 'Log Workout',
            content,
            footer: '<button class="btn btn--secondary" data-modal-cancel>Skip</button>'
        });

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Routine selection
        document.querySelectorAll('.log-workout-prompt__routine').forEach(btn => {
            btn.addEventListener('click', () => {
                const routineId = btn.dataset.routineId;

                // Log the workout using the Workout module
                if (typeof Workout !== 'undefined' && Workout.logWorkout) {
                    Workout.logWorkout(memberId, routineId, DateUtils.today());
                }

                Modal.close();
                Toast.success('Workout logged!');
            });
        });

        // Cancel
        document.querySelector('[data-modal-cancel]')?.addEventListener('click', () => {
            Modal.close();
        });
    }

    function init() {
        // Initialize circuit timer feature
    }

    return {
        init,
        renderWidget,
        startTimer,
        showCreateTimerModal
    };
})();
