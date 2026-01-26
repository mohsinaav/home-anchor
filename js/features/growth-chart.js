/**
 * Growth Chart Widget
 * Track height, weight, and custom measurements over time
 */

const GrowthChart = (function() {
    // Default measurement fields
    const DEFAULT_FIELDS = [
        { id: 'height', name: 'Height', unit: { metric: 'cm', imperial: 'in' }, color: '#6366F1' },
        { id: 'weight', name: 'Weight', unit: { metric: 'kg', imperial: 'lbs' }, color: '#22C55E' },
        { id: 'head', name: 'Head Circumference', unit: { metric: 'cm', imperial: 'in' }, color: '#F59E0B' }
    ];

    /**
     * Get widget data with defaults
     */
    function getWidgetData(memberId) {
        const stored = Storage.getWidgetData(memberId, 'growth-chart') || {};
        return {
            measurements: stored.measurements || [],
            fields: stored.fields || DEFAULT_FIELDS,
            unit: stored.unit || 'metric',
            notes: stored.notes || {}
        };
    }

    /**
     * Save widget data
     */
    function saveWidgetData(memberId, data) {
        Storage.setWidgetData(memberId, 'growth-chart', data);
    }

    /**
     * Get latest measurement
     */
    function getLatestMeasurement(data) {
        if (!data.measurements || data.measurements.length === 0) return null;
        return data.measurements[data.measurements.length - 1];
    }

    /**
     * Calculate trend (growth since last measurement)
     */
    function getTrend(data, fieldId) {
        if (!data.measurements || data.measurements.length < 2) return null;

        const latest = data.measurements[data.measurements.length - 1];
        const previous = data.measurements[data.measurements.length - 2];

        const latestVal = latest.values?.[fieldId];
        const previousVal = previous.values?.[fieldId];

        if (latestVal === undefined || previousVal === undefined) return null;

        const diff = latestVal - previousVal;
        return {
            value: diff,
            direction: diff > 0 ? 'up' : diff < 0 ? 'down' : 'same',
            percent: previousVal > 0 ? Math.round((diff / previousVal) * 100) : 0
        };
    }

    /**
     * Format measurement value with unit
     */
    function formatValue(value, field, unitSystem) {
        if (value === undefined || value === null) return '-';
        const unit = field.unit[unitSystem] || field.unit.metric;
        return `${value} ${unit}`;
    }

    /**
     * Render the widget
     */
    function renderWidget(container, memberId) {
        const data = getWidgetData(memberId);
        const latest = getLatestMeasurement(data);
        const unitSystem = data.unit || 'metric';

        const heightField = data.fields.find(f => f.id === 'height') || DEFAULT_FIELDS[0];
        const weightField = data.fields.find(f => f.id === 'weight') || DEFAULT_FIELDS[1];

        const heightTrend = getTrend(data, 'height');
        const weightTrend = getTrend(data, 'weight');

        container.innerHTML = `
            <div class="growth-chart-widget">
                ${latest ? `
                    <div class="growth-chart-widget__latest">
                        <div class="growth-chart-stat">
                            <span class="growth-chart-stat__label">Height</span>
                            <div class="growth-chart-stat__value">
                                ${formatValue(latest.values?.height, heightField, unitSystem)}
                                ${heightTrend ? `
                                    <span class="growth-chart-trend growth-chart-trend--${heightTrend.direction}">
                                        <i data-lucide="${heightTrend.direction === 'up' ? 'trending-up' : heightTrend.direction === 'down' ? 'trending-down' : 'minus'}"></i>
                                        ${Math.abs(heightTrend.value)}
                                    </span>
                                ` : ''}
                            </div>
                        </div>
                        <div class="growth-chart-stat">
                            <span class="growth-chart-stat__label">Weight</span>
                            <div class="growth-chart-stat__value">
                                ${formatValue(latest.values?.weight, weightField, unitSystem)}
                                ${weightTrend ? `
                                    <span class="growth-chart-trend growth-chart-trend--${weightTrend.direction}">
                                        <i data-lucide="${weightTrend.direction === 'up' ? 'trending-up' : weightTrend.direction === 'down' ? 'trending-down' : 'minus'}"></i>
                                        ${Math.abs(weightTrend.value)}
                                    </span>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="growth-chart-widget__date">
                        Last measured: ${DateUtils.formatShort(latest.date)}
                    </div>
                ` : `
                    <div class="growth-chart-widget__empty">
                        <i data-lucide="ruler"></i>
                        <p>No measurements yet</p>
                    </div>
                `}

                <div class="growth-chart-widget__actions">
                    <button class="btn btn--sm btn--primary" data-action="add">
                        <i data-lucide="plus"></i>
                        Add Measurement
                    </button>
                    ${data.measurements.length > 0 ? `
                        <button class="btn btn--sm btn--ghost" data-action="history">
                            <i data-lucide="line-chart"></i>
                            View Chart
                        </button>
                    ` : ''}
                </div>
            </div>
        `;

        // Initialize icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Bind events
        container.querySelector('[data-action="add"]')?.addEventListener('click', () => {
            showAddMeasurementModal(memberId, container);
        });

        container.querySelector('[data-action="history"]')?.addEventListener('click', () => {
            showFullPage(memberId);
        });
    }

    /**
     * Show add measurement modal
     */
    function showAddMeasurementModal(memberId, widgetContainer = null) {
        const data = getWidgetData(memberId);
        const unitSystem = data.unit || 'metric';
        const fields = data.fields || DEFAULT_FIELDS;

        const content = `
            <div class="growth-add-form">
                <div class="form-group">
                    <label class="form-label">Date</label>
                    <input type="date" class="form-input" id="measurementDate" value="${DateUtils.today()}">
                </div>

                ${fields.map(field => `
                    <div class="form-group">
                        <label class="form-label">${field.name} (${field.unit[unitSystem]})</label>
                        <input type="number" class="form-input" id="field-${field.id}"
                               step="0.1" placeholder="Enter ${field.name.toLowerCase()}">
                    </div>
                `).join('')}

                <div class="form-group">
                    <label class="form-label">Notes (optional)</label>
                    <textarea class="form-input" id="measurementNotes" rows="2"
                              placeholder="Any notes about this measurement..."></textarea>
                </div>
            </div>
        `;

        Modal.open({
            title: 'Add Measurement',
            content,
            footer: Modal.createFooter('Cancel', 'Save')
        });

        Modal.bindFooterEvents(() => {
            const date = document.getElementById('measurementDate')?.value;
            if (!date) {
                Toast.error('Please select a date');
                return false;
            }

            const values = {};
            let hasValue = false;

            fields.forEach(field => {
                const input = document.getElementById(`field-${field.id}`);
                if (input && input.value) {
                    values[field.id] = parseFloat(input.value);
                    hasValue = true;
                }
            });

            if (!hasValue) {
                Toast.error('Please enter at least one measurement');
                return false;
            }

            const notes = document.getElementById('measurementNotes')?.value?.trim() || '';

            // Add measurement
            const measurement = {
                id: `measurement-${Date.now()}`,
                date,
                values
            };

            data.measurements.push(measurement);
            data.measurements.sort((a, b) => a.date.localeCompare(b.date));

            if (notes) {
                data.notes[measurement.id] = notes;
            }

            saveWidgetData(memberId, data);

            // Refresh widget if on widget view
            if (widgetContainer) {
                renderWidget(widgetContainer, memberId);
            }

            Toast.success('Measurement added!');
            return true;
        });
    }

    /**
     * Show full page with tabs
     */
    function showFullPage(memberId, activeTab = 'chart') {
        const main = document.querySelector('main');
        if (!main) return;

        const member = Storage.getMember(memberId);
        renderFullPage(main, memberId, member, activeTab);
    }

    /**
     * Render full page
     */
    function renderFullPage(container, memberId, member, activeTab = 'chart') {
        const data = getWidgetData(memberId);
        const measurements = data.measurements || [];
        const unitSystem = data.unit || 'metric';
        const fields = data.fields || DEFAULT_FIELDS;
        const latest = getLatestMeasurement(data);

        // Calculate stats
        const totalMeasurements = measurements.length;
        const heightField = fields.find(f => f.id === 'height') || DEFAULT_FIELDS[0];
        const weightField = fields.find(f => f.id === 'weight') || DEFAULT_FIELDS[1];

        // Define tabs
        const tabs = [
            { id: 'chart', label: 'Chart', icon: 'line-chart', emoji: '📈' },
            { id: 'history', label: 'History', icon: 'list', emoji: '📋' },
            { id: 'stats', label: 'Stats', icon: 'bar-chart-2', emoji: '📊' }
        ];

        // Render tab content
        let tabContent;
        if (activeTab === 'chart') {
            tabContent = renderChartTab(data, fields, unitSystem, memberId);
        } else if (activeTab === 'history') {
            tabContent = renderHistoryTab(data, fields, unitSystem, memberId);
        } else {
            tabContent = renderStatsTab(data, fields, unitSystem);
        }

        const useKidTheme = typeof KidTheme !== 'undefined';
        const colors = useKidTheme ? KidTheme.getColors('growth-chart') : {
            gradient: 'linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 50%, #C4B5FD 100%)',
            dark: '#5B21B6'
        };

        container.innerHTML = `
            <div class="kid-page kid-page--growth ${useKidTheme ? KidTheme.getAgeClass(member) : ''}">
                <!-- Hero Section -->
                <div class="kid-page__hero" style="background: ${colors.gradient}; --kid-hero-text: ${colors.dark || '#5B21B6'}">
                    <button class="btn btn--ghost kid-page__back" id="backToMemberBtn">
                        <i data-lucide="arrow-left"></i>
                        Back
                    </button>
                    <div class="kid-page__hero-content">
                        <h1 class="kid-page__hero-title">
                            📏 Growth Chart
                        </h1>
                        <p class="kid-page__hero-subtitle">${member?.name || ''}'s Growth Tracker</p>
                    </div>
                    <div class="kid-page__hero-stats">
                        <div class="kid-hero-stat">
                            <span class="kid-hero-stat__value">${latest?.values?.height ? formatValue(latest.values.height, heightField, unitSystem) : '-'}</span>
                            <span class="kid-hero-stat__label">Height</span>
                        </div>
                        <div class="kid-hero-stat">
                            <span class="kid-hero-stat__value">${latest?.values?.weight ? formatValue(latest.values.weight, weightField, unitSystem) : '-'}</span>
                            <span class="kid-hero-stat__label">Weight</span>
                        </div>
                        <div class="kid-hero-stat">
                            <span class="kid-hero-stat__value">${totalMeasurements}</span>
                            <span class="kid-hero-stat__label">Recorded</span>
                        </div>
                    </div>
                    <div class="kid-page__hero-actions">
                        <button class="btn btn--sm btn--ghost" id="unitToggleBtn" title="Toggle units">
                            <i data-lucide="settings-2"></i>
                            ${unitSystem === 'metric' ? 'Metric' : 'Imperial'}
                        </button>
                    </div>
                </div>

                <!-- Tab Navigation -->
                <div class="kid-page__tabs">
                    ${tabs.map(t => `
                        <button class="kid-page__tab ${t.id === activeTab ? 'kid-page__tab--active' : ''}" data-tab="${t.id}">
                            <span class="emoji-icon">${t.emoji}</span>
                            ${t.label}
                        </button>
                    `).join('')}
                </div>

                <!-- Tab Content -->
                <div class="kid-page__content">
                    ${tabContent}
                </div>
            </div>
        `;

        // Initialize icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Bind events
        bindFullPageEvents(container, memberId, member, data, activeTab);
    }

    /**
     * Render Chart tab
     */
    function renderChartTab(data, fields, unitSystem, memberId) {
        const measurements = data.measurements || [];

        if (measurements.length === 0) {
            return `
                <div class="growth-chart-tab">
                    <div class="growth-chart-empty">
                        <div class="empty-state">
                            <i data-lucide="ruler"></i>
                            <p>No measurements recorded yet</p>
                            <span class="text-muted">Add your first measurement to start tracking growth</span>
                            <button class="btn btn--primary" data-action="add-measurement" style="margin-top: var(--space-3);">
                                <i data-lucide="plus"></i>
                                Add First Measurement
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }

        // Build chart data
        const chartData = measurements.map(m => ({
            date: m.date,
            dateLabel: DateUtils.formatShort(m.date),
            ...m.values
        }));

        return `
            <div class="growth-chart-tab">
                <div class="growth-chart-actions">
                    <button class="btn btn--primary" data-action="add-measurement">
                        <i data-lucide="plus"></i>
                        Add Measurement
                    </button>
                </div>

                <div class="growth-chart-container">
                    ${renderSimpleChart(chartData, fields, unitSystem)}
                </div>

                ${measurements.length > 0 ? `
                    <div class="growth-chart-latest">
                        <h3>Latest Measurement</h3>
                        <div class="growth-latest-values">
                            ${fields.map(field => {
                                const latest = measurements[measurements.length - 1];
                                const val = latest.values?.[field.id];
                                const trend = getTrend(data, field.id);
                                if (val === undefined) return '';
                                return `
                                    <div class="growth-latest-value" style="--color: ${field.color}">
                                        <span class="growth-latest-value__label">${field.name}</span>
                                        <span class="growth-latest-value__val">
                                            ${formatValue(val, field, unitSystem)}
                                            ${trend ? `
                                                <span class="growth-chart-trend growth-chart-trend--${trend.direction}">
                                                    <i data-lucide="${trend.direction === 'up' ? 'trending-up' : trend.direction === 'down' ? 'trending-down' : 'minus'}"></i>
                                                    ${Math.abs(trend.value).toFixed(1)}
                                                </span>
                                            ` : ''}
                                        </span>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Render History tab
     */
    function renderHistoryTab(data, fields, unitSystem, memberId) {
        const measurements = [...(data.measurements || [])].reverse();

        if (measurements.length === 0) {
            return `
                <div class="growth-history-tab">
                    <div class="empty-state">
                        <i data-lucide="clipboard"></i>
                        <p>No measurements recorded</p>
                        <span class="text-muted">Add measurements to see history</span>
                    </div>
                </div>
            `;
        }

        return `
            <div class="growth-history-tab">
                <div class="growth-history-actions">
                    <button class="btn btn--primary" data-action="add-measurement">
                        <i data-lucide="plus"></i>
                        Add Measurement
                    </button>
                </div>

                <div class="growth-history-list">
                    ${measurements.map(m => {
                        const note = data.notes[m.id];
                        return `
                            <div class="growth-history-card" data-id="${m.id}">
                                <div class="growth-history-card__header">
                                    <span class="growth-history-card__date">${DateUtils.formatShort(m.date)}</span>
                                    <button class="btn btn--xs btn--ghost btn--danger" data-action="delete" data-id="${m.id}" title="Delete">
                                        <i data-lucide="trash-2"></i>
                                    </button>
                                </div>
                                <div class="growth-history-card__values">
                                    ${fields.map(field => {
                                        const val = m.values?.[field.id];
                                        if (val === undefined) return '';
                                        return `
                                            <div class="growth-measurement-value" style="--color: ${field.color}">
                                                <span class="growth-measurement-value__label">${field.name}</span>
                                                <span class="growth-measurement-value__val">${formatValue(val, field, unitSystem)}</span>
                                            </div>
                                        `;
                                    }).join('')}
                                </div>
                                ${note ? `
                                    <div class="growth-history-card__note">
                                        <i data-lucide="message-square"></i>
                                        ${note}
                                    </div>
                                ` : ''}
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Render Stats tab
     */
    function renderStatsTab(data, fields, unitSystem) {
        const measurements = data.measurements || [];

        if (measurements.length < 2) {
            return `
                <div class="growth-stats-tab">
                    <div class="empty-state">
                        <i data-lucide="bar-chart-2"></i>
                        <p>Not enough data for statistics</p>
                        <span class="text-muted">Add at least 2 measurements to see growth stats</span>
                    </div>
                </div>
            `;
        }

        // Calculate growth stats
        const first = measurements[0];
        const last = measurements[measurements.length - 1];
        const daysBetween = Math.max(1, Math.round((new Date(last.date) - new Date(first.date)) / (1000 * 60 * 60 * 24)));
        const monthsBetween = Math.max(1, daysBetween / 30);

        return `
            <div class="growth-stats-tab">
                <div class="growth-stats-summary">
                    <div class="growth-stats-card">
                        <span class="growth-stats-card__label">Tracking Period</span>
                        <span class="growth-stats-card__value">${daysBetween} days</span>
                    </div>
                    <div class="growth-stats-card">
                        <span class="growth-stats-card__label">Measurements</span>
                        <span class="growth-stats-card__value">${measurements.length}</span>
                    </div>
                </div>

                <div class="growth-stats-fields">
                    ${fields.map(field => {
                        const firstVal = first.values?.[field.id];
                        const lastVal = last.values?.[field.id];
                        if (firstVal === undefined || lastVal === undefined) return '';

                        const totalGrowth = lastVal - firstVal;
                        const monthlyGrowth = totalGrowth / monthsBetween;

                        return `
                            <div class="growth-stats-field" style="--color: ${field.color}">
                                <h4 class="growth-stats-field__title">
                                    <span class="growth-stats-field__color"></span>
                                    ${field.name}
                                </h4>
                                <div class="growth-stats-field__data">
                                    <div class="growth-stats-metric">
                                        <span class="growth-stats-metric__label">Starting</span>
                                        <span class="growth-stats-metric__value">${formatValue(firstVal, field, unitSystem)}</span>
                                    </div>
                                    <div class="growth-stats-metric">
                                        <span class="growth-stats-metric__label">Current</span>
                                        <span class="growth-stats-metric__value">${formatValue(lastVal, field, unitSystem)}</span>
                                    </div>
                                    <div class="growth-stats-metric growth-stats-metric--highlight">
                                        <span class="growth-stats-metric__label">Total Growth</span>
                                        <span class="growth-stats-metric__value ${totalGrowth >= 0 ? 'text-success' : 'text-danger'}">
                                            ${totalGrowth >= 0 ? '+' : ''}${totalGrowth.toFixed(1)} ${field.unit[unitSystem]}
                                        </span>
                                    </div>
                                    <div class="growth-stats-metric">
                                        <span class="growth-stats-metric__label">Avg/Month</span>
                                        <span class="growth-stats-metric__value">
                                            ${monthlyGrowth >= 0 ? '+' : ''}${monthlyGrowth.toFixed(2)} ${field.unit[unitSystem]}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Render simple SVG chart
     */
    function renderSimpleChart(chartData, fields, unitSystem) {
        if (chartData.length === 0) return '';

        const width = 100;
        const height = 60;
        const padding = { top: 5, right: 5, bottom: 15, left: 10 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;

        // Get active fields (with data)
        const activeFields = fields.filter(field =>
            chartData.some(d => d[field.id] !== undefined)
        );

        const lines = activeFields.map(field => {
            const validData = chartData.filter(d => d[field.id] !== undefined);
            if (validData.length < 2) return null;

            const values = validData.map(d => d[field.id]);
            const minVal = Math.min(...values) * 0.95;
            const maxVal = Math.max(...values) * 1.05;
            const range = maxVal - minVal || 1;

            const points = validData.map((d, i) => {
                const x = padding.left + (i / (validData.length - 1)) * chartWidth;
                const y = padding.top + chartHeight - ((d[field.id] - minVal) / range) * chartHeight;
                return `${x},${y}`;
            }).join(' ');

            return `
                <polyline points="${points}" fill="none" stroke="${field.color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                ${validData.map((d, i) => {
                    const x = padding.left + (i / (validData.length - 1)) * chartWidth;
                    const y = padding.top + chartHeight - ((d[field.id] - minVal) / range) * chartHeight;
                    return `<circle cx="${x}" cy="${y}" r="2" fill="${field.color}"/>`;
                }).join('')}
            `;
        }).filter(Boolean).join('');

        return `
            <div class="growth-chart-svg-container">
                <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet" class="growth-chart-svg">
                    ${lines}
                </svg>
                <div class="growth-chart-legend">
                    ${activeFields.map(field => `
                        <div class="growth-chart-legend__item">
                            <span class="growth-chart-legend__color" style="background: ${field.color}"></span>
                            <span class="growth-chart-legend__label">${field.name}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Bind full page events
     */
    function bindFullPageEvents(container, memberId, member, data, activeTab) {
        // Back button
        document.getElementById('backToMemberBtn')?.addEventListener('click', () => {
            State.emit('tabChanged', memberId);
        });

        // Tab switching
        container.querySelectorAll('[data-tab]').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                renderFullPage(container, memberId, member, tab);
            });
        });

        // Unit toggle
        document.getElementById('unitToggleBtn')?.addEventListener('click', () => {
            data.unit = data.unit === 'metric' ? 'imperial' : 'metric';
            saveWidgetData(memberId, data);
            renderFullPage(container, memberId, member, activeTab);
        });

        // Add measurement button
        container.querySelectorAll('[data-action="add-measurement"]').forEach(btn => {
            btn.addEventListener('click', () => {
                showAddMeasurementModal(memberId);
                // Re-render after modal closes
                const checkModalClosed = setInterval(() => {
                    if (!document.querySelector('.modal')) {
                        clearInterval(checkModalClosed);
                        renderFullPage(container, memberId, member, activeTab);
                    }
                }, 100);
            });
        });

        // Delete buttons
        container.querySelectorAll('[data-action="delete"]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const verified = await PIN.verify();
                if (verified) {
                    const id = btn.dataset.id;
                    data.measurements = data.measurements.filter(m => m.id !== id);
                    delete data.notes[id];
                    saveWidgetData(memberId, data);
                    renderFullPage(container, memberId, member, activeTab);
                    Toast.success('Measurement deleted');
                }
            });
        });
    }

    /**
     * Initialize
     */
    function init() {
        // Growth chart feature initialized
    }

    return {
        init,
        renderWidget,
        showFullPage
    };
})();
