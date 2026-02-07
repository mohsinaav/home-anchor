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
        const fields = data.fields || DEFAULT_FIELDS;

        container.innerHTML = `
            <div class="growth-chart-widget">
                ${latest ? `
                    <div class="growth-chart-widget__latest">
                        ${fields.map(field => {
                            const val = latest.values?.[field.id];
                            if (val === undefined) return '';
                            const trend = getTrend(data, field.id);
                            return `
                                <div class="growth-chart-stat" style="--field-color: ${field.color}">
                                    <span class="growth-chart-stat__label">${field.name}</span>
                                    <div class="growth-chart-stat__value">
                                        ${formatValue(val, field, unitSystem)}
                                        ${trend ? `
                                            <span class="growth-chart-trend growth-chart-trend--${trend.direction}">
                                                <i data-lucide="${trend.direction === 'up' ? 'trending-up' : trend.direction === 'down' ? 'trending-down' : 'minus'}"></i>
                                                ${Math.abs(trend.value).toFixed(1)}
                                            </span>
                                        ` : ''}
                                    </div>
                                </div>
                            `;
                        }).join('')}
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
     * Show add measurement modal (one measurement per day — pre-fills existing values)
     */
    function showAddMeasurementModal(memberId, widgetContainer = null) {
        const data = getWidgetData(memberId);
        const unitSystem = data.unit || 'metric';
        const fields = data.fields || DEFAULT_FIELDS;

        // Find existing measurement for a given date
        function findByDate(date) {
            return data.measurements.find(m => m.date === date) || null;
        }

        const today = DateUtils.today();
        const existing = findByDate(today);

        const content = `
            <div class="growth-add-form">
                <div class="form-group">
                    <label class="form-label">Date</label>
                    <input type="date" class="form-input" id="measurementDate" value="${today}">
                </div>
                <div class="growth-add-form__existing-hint" id="existingHint"
                     style="display:${existing ? 'block' : 'none'}">
                    Editing existing measurement for this date
                </div>

                ${fields.map(field => {
                    const existingVal = existing?.values?.[field.id];
                    return `
                        <div class="form-group">
                            <label class="form-label">${field.name} (${field.unit[unitSystem]})</label>
                            <input type="number" class="form-input" id="field-${field.id}"
                                   step="0.1" placeholder="Enter ${field.name.toLowerCase()}"
                                   ${existingVal !== undefined ? `value="${existingVal}"` : ''}>
                        </div>
                    `;
                }).join('')}

                <div class="form-group">
                    <label class="form-label">Notes (optional)</label>
                    <textarea class="form-input" id="measurementNotes" rows="2"
                              placeholder="Any notes about this measurement...">${existing ? (data.notes[existing.id] || '') : ''}</textarea>
                </div>
            </div>
        `;

        Modal.open({
            title: existing ? 'Edit Measurement' : 'Add Measurement',
            content,
            footer: Modal.createFooter('Cancel', 'Save')
        });

        // When the date changes, pre-fill existing values for that date
        const dateInput = document.getElementById('measurementDate');
        dateInput?.addEventListener('change', () => {
            const selected = dateInput.value;
            const match = findByDate(selected);
            const hint = document.getElementById('existingHint');

            fields.forEach(field => {
                const input = document.getElementById(`field-${field.id}`);
                if (!input) return;
                input.value = match?.values?.[field.id] ?? '';
            });

            const notesEl = document.getElementById('measurementNotes');
            if (notesEl) notesEl.value = match ? (data.notes[match.id] || '') : '';

            if (hint) hint.style.display = match ? 'block' : 'none';
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

            // Check if a measurement already exists for this date
            const existingForDate = findByDate(date);

            if (existingForDate) {
                // Update existing measurement
                existingForDate.values = values;
                if (notes) {
                    data.notes[existingForDate.id] = notes;
                } else {
                    delete data.notes[existingForDate.id];
                }
            } else {
                // Add new measurement
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
            }

            saveWidgetData(memberId, data);

            // Refresh widget if on widget view
            if (widgetContainer) {
                renderWidget(widgetContainer, memberId);
            }

            Toast.success(existingForDate ? 'Measurement updated!' : 'Measurement added!');
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
                        ${fields.map(field => {
                            const val = latest?.values?.[field.id];
                            return `
                                <div class="kid-hero-stat">
                                    <span class="kid-hero-stat__value">${val !== undefined ? formatValue(val, field, unitSystem) : '-'}</span>
                                    <span class="kid-hero-stat__label">${field.name}</span>
                                </div>
                            `;
                        }).join('')}
                        <div class="kid-hero-stat">
                            <span class="kid-hero-stat__value">${totalMeasurements}</span>
                            <span class="kid-hero-stat__label">Recorded</span>
                        </div>
                    </div>
                    <div class="kid-page__hero-actions">
                        <button class="btn btn--sm btn--ghost" id="importDataBtn" title="Import measurements">
                            <i data-lucide="upload"></i>
                            Import
                        </button>
                        <button class="btn btn--sm btn--ghost" id="customizeFieldsBtn" title="Customize tracked parameters">
                            <i data-lucide="sliders-horizontal"></i>
                            Customize
                        </button>
                        <button class="btn btn--sm btn--ghost" id="unitToggleBtn" title="Toggle units">
                            <i data-lucide="settings-2"></i>
                            ${unitSystem === 'metric' ? 'Metric' : 'Imperial'}
                        </button>
                    </div>
                </div>

                <!-- Tab Navigation -->
                <div class="kid-page__tabs" style="--tab-color: ${colors.primary}">
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
                    <button class="btn btn--outline" data-action="import-data">
                        <i data-lucide="upload"></i>
                        Import Data
                    </button>
                </div>

                ${fields.length > 1 ? `
                    <div class="growth-chart-filters" id="growthChartFilters">
                        ${fields.map(field => {
                            const hasData = chartData.some(d => d[field.id] !== undefined);
                            return `
                                <button class="growth-chart-filter ${hasData ? 'growth-chart-filter--active' : 'growth-chart-filter--disabled'}"
                                        data-field-id="${field.id}"
                                        ${!hasData ? 'disabled' : ''}
                                        style="--filter-color: ${field.color}">
                                    <span class="growth-chart-filter__dot"></span>
                                    ${field.name}
                                </button>
                            `;
                        }).join('')}
                    </div>
                ` : ''}

                <div class="growth-chart-container" id="growthChartContainer"
                     data-chart='${JSON.stringify(chartData).replace(/'/g, "&#39;")}'
                     data-fields='${JSON.stringify(fields).replace(/'/g, "&#39;")}'
                     data-unit-system="${unitSystem}">
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
     * Generate nice axis tick values
     */
    function niceAxisTicks(minVal, maxVal, targetTicks) {
        const range = maxVal - minVal || 1;
        const roughStep = range / (targetTicks - 1);
        const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
        const residual = roughStep / magnitude;

        let niceStep;
        if (residual <= 1.5) niceStep = 1 * magnitude;
        else if (residual <= 3) niceStep = 2 * magnitude;
        else if (residual <= 7) niceStep = 5 * magnitude;
        else niceStep = 10 * magnitude;

        const niceMin = Math.floor(minVal / niceStep) * niceStep;
        const niceMax = Math.ceil(maxVal / niceStep) * niceStep;

        const ticks = [];
        for (let v = niceMin; v <= niceMax + niceStep * 0.01; v += niceStep) {
            ticks.push(Math.round(v * 100) / 100);
        }
        return { ticks, min: niceMin, max: niceMax };
    }

    /**
     * Render interactive SVG chart with axes, grid, and tooltips
     */
    function renderSimpleChart(chartData, fields, unitSystem) {
        if (chartData.length === 0) return '';

        // Use pixel-based viewBox for crisp rendering
        const width = 400;
        const height = 260;
        const padding = { top: 20, right: 20, bottom: 45, left: 55 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;

        // Get active fields (with data)
        const activeFields = fields.filter(field =>
            chartData.some(d => d[field.id] !== undefined)
        );

        // Compute a shared Y domain across all active fields (normalize per-field later for multi-axis)
        // For simplicity, render each field on its own scale but share the grid
        const fieldMeta = {};
        activeFields.forEach(field => {
            const validData = chartData.filter(d => d[field.id] !== undefined);
            if (validData.length < 2) return;
            const values = validData.map(d => d[field.id]);
            const rawMin = Math.min(...values);
            const rawMax = Math.max(...values);
            const { ticks, min, max } = niceAxisTicks(rawMin * 0.97, rawMax * 1.03, 5);
            fieldMeta[field.id] = { validData, values, min, max, ticks, range: max - min || 1 };
        });

        // Use the first active field for Y-axis labels (primary axis)
        const primaryField = activeFields.find(f => fieldMeta[f.id]) || activeFields[0];
        const primaryMeta = fieldMeta[primaryField?.id];

        if (!primaryMeta) return '<p class="text-muted" style="text-align:center;">Not enough data to chart</p>';

        // --- Grid lines ---
        const gridLines = primaryMeta.ticks.map(tick => {
            const y = padding.top + chartHeight - ((tick - primaryMeta.min) / primaryMeta.range) * chartHeight;
            return `<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}"
                          stroke="var(--gray-200, #E5E7EB)" stroke-width="1" stroke-dasharray="4 3"/>`;
        }).join('');

        // --- Y-axis labels (primary field) ---
        const yLabels = primaryMeta.ticks.map(tick => {
            const y = padding.top + chartHeight - ((tick - primaryMeta.min) / primaryMeta.range) * chartHeight;
            return `<text x="${padding.left - 8}" y="${y}" text-anchor="end" dominant-baseline="middle"
                          class="growth-chart-axis-label" fill="var(--gray-400, #9CA3AF)" font-size="11">${tick}</text>`;
        }).join('');

        // --- X-axis date labels ---
        const maxXLabels = chartData.length <= 6 ? chartData.length : 6;
        const xStep = Math.max(1, Math.floor((chartData.length - 1) / (maxXLabels - 1)));
        const xLabels = [];
        for (let i = 0; i < chartData.length; i += xStep) {
            const x = padding.left + (i / Math.max(1, chartData.length - 1)) * chartWidth;
            xLabels.push(`<text x="${x}" y="${height - padding.bottom + 20}" text-anchor="middle"
                                class="growth-chart-axis-label" fill="var(--gray-400, #9CA3AF)" font-size="11">${chartData[i].dateLabel}</text>`);
        }
        // Always include the last label if not already
        if ((chartData.length - 1) % xStep !== 0 && chartData.length > 1) {
            const x = padding.left + chartWidth;
            xLabels.push(`<text x="${x}" y="${height - padding.bottom + 20}" text-anchor="middle"
                                class="growth-chart-axis-label" fill="var(--gray-400, #9CA3AF)" font-size="11">${chartData[chartData.length - 1].dateLabel}</text>`);
        }

        // --- Axis lines ---
        const axisLines = `
            <line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${padding.top + chartHeight}"
                  stroke="var(--gray-300, #D1D5DB)" stroke-width="1"/>
            <line x1="${padding.left}" y1="${padding.top + chartHeight}" x2="${width - padding.right}" y2="${padding.top + chartHeight}"
                  stroke="var(--gray-300, #D1D5DB)" stroke-width="1"/>
        `;

        // --- Data lines and interactive points ---
        let dataPointIndex = 0;
        const lines = activeFields.map(field => {
            const meta = fieldMeta[field.id];
            if (!meta) return null;
            const { validData, min, range } = meta;

            const points = validData.map((d, i) => {
                const x = padding.left + (chartData.indexOf(d) / Math.max(1, chartData.length - 1)) * chartWidth;
                const y = padding.top + chartHeight - ((d[field.id] - min) / range) * chartHeight;
                return { x, y, d, i };
            });

            const polyPoints = points.map(p => `${p.x},${p.y}`).join(' ');

            // Area fill under line
            const areaPath = `M ${points[0].x},${padding.top + chartHeight} ` +
                points.map(p => `L ${p.x},${p.y}`).join(' ') +
                ` L ${points[points.length - 1].x},${padding.top + chartHeight} Z`;

            return `
                <path d="${areaPath}" fill="${field.color}" opacity="0.07"/>
                <polyline points="${polyPoints}" fill="none" stroke="${field.color}" stroke-width="2.5"
                          stroke-linecap="round" stroke-linejoin="round" class="growth-chart-line"/>
                ${points.map(p => {
                    const unit = field.unit[unitSystem] || field.unit.metric;
                    const tooltipData = JSON.stringify({
                        date: p.d.dateLabel || p.d.date,
                        field: field.name,
                        value: p.d[field.id],
                        unit: unit,
                        color: field.color
                    }).replace(/"/g, '&quot;');
                    dataPointIndex++;
                    return `
                        <circle cx="${p.x}" cy="${p.y}" r="4.5" fill="white" stroke="${field.color}" stroke-width="2.5"
                                class="growth-chart-point" data-tooltip="${tooltipData}"/>
                        <circle cx="${p.x}" cy="${p.y}" r="16" fill="transparent"
                                class="growth-chart-point-hitarea" data-tooltip="${tooltipData}" style="cursor:pointer;"/>
                    `;
                }).join('')}
            `;
        }).filter(Boolean).join('');

        // --- Y-axis unit label ---
        const primaryUnit = primaryField.unit[unitSystem] || primaryField.unit.metric;

        return `
            <div class="growth-chart-svg-container">
                <div class="growth-chart-svg-wrap" style="position:relative;">
                    <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet" class="growth-chart-svg" id="growthChartSvg">
                        <!-- Grid -->
                        ${gridLines}
                        <!-- Axes -->
                        ${axisLines}
                        <!-- Y Labels -->
                        ${yLabels}
                        <!-- X Labels -->
                        ${xLabels.join('')}
                        <!-- Y-axis unit -->
                        <text x="${padding.left - 8}" y="${padding.top - 8}" text-anchor="end"
                              fill="var(--gray-400, #9CA3AF)" font-size="10" font-style="italic">${primaryUnit}</text>
                        <!-- Data -->
                        ${lines}
                    </svg>
                    <div class="growth-chart-tooltip" id="growthChartTooltip" style="display:none;"></div>
                </div>
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
     * Bind tooltip events for the interactive chart
     */
    function bindChartTooltipEvents(container) {
        const svg = container.querySelector('#growthChartSvg');
        const tooltip = container.querySelector('#growthChartTooltip');
        if (!svg || !tooltip) return;

        const allPoints = svg.querySelectorAll('.growth-chart-point');
        const allHitAreas = svg.querySelectorAll('.growth-chart-point-hitarea');

        function showTooltip(target, event) {
            try {
                const raw = target.getAttribute('data-tooltip');
                if (!raw) return;
                const data = JSON.parse(raw);
                tooltip.innerHTML = `
                    <div class="growth-chart-tooltip__header" style="color: ${data.color}">
                        <span class="growth-chart-tooltip__dot" style="background: ${data.color}"></span>
                        ${data.field}
                    </div>
                    <div class="growth-chart-tooltip__value">${data.value} ${data.unit}</div>
                    <div class="growth-chart-tooltip__date">${data.date}</div>
                `;
                tooltip.style.display = 'block';

                // Position tooltip near the point
                const svgRect = svg.getBoundingClientRect();
                const wrapRect = svg.parentElement.getBoundingClientRect();
                const cx = parseFloat(target.getAttribute('cx') || target.previousElementSibling?.getAttribute('cx'));
                const cy = parseFloat(target.getAttribute('cy') || target.previousElementSibling?.getAttribute('cy'));

                // Convert SVG coords to DOM coords
                const svgWidth = svg.viewBox.baseVal.width;
                const svgHeight = svg.viewBox.baseVal.height;
                const scaleX = svgRect.width / svgWidth;
                const scaleY = svgRect.height / svgHeight;
                const domX = (cx * scaleX) + (svgRect.left - wrapRect.left);
                const domY = (cy * scaleY) + (svgRect.top - wrapRect.top);

                const tooltipWidth = tooltip.offsetWidth;
                const tooltipHeight = tooltip.offsetHeight;

                let left = domX - tooltipWidth / 2;
                let top = domY - tooltipHeight - 12;

                // Keep within bounds
                if (left < 4) left = 4;
                if (left + tooltipWidth > wrapRect.width - 4) left = wrapRect.width - tooltipWidth - 4;
                if (top < 4) top = domY + 16;

                tooltip.style.left = left + 'px';
                tooltip.style.top = top + 'px';

                // Highlight point
                allPoints.forEach(p => p.classList.remove('growth-chart-point--active'));
                // Find the matching visible point
                const visiblePoint = target.classList.contains('growth-chart-point')
                    ? target
                    : target.previousElementSibling;
                if (visiblePoint) visiblePoint.classList.add('growth-chart-point--active');
            } catch(e) { /* ignore parse errors */ }
        }

        function hideTooltip() {
            tooltip.style.display = 'none';
            allPoints.forEach(p => p.classList.remove('growth-chart-point--active'));
        }

        // Mouse events
        allHitAreas.forEach(area => {
            area.addEventListener('mouseenter', (e) => showTooltip(area, e));
            area.addEventListener('mouseleave', hideTooltip);
        });
        allPoints.forEach(point => {
            point.addEventListener('mouseenter', (e) => showTooltip(point, e));
            point.addEventListener('mouseleave', hideTooltip);
        });

        // Touch events for mobile
        allHitAreas.forEach(area => {
            area.addEventListener('touchstart', (e) => {
                e.preventDefault();
                showTooltip(area, e);
            }, { passive: false });
        });
        allPoints.forEach(point => {
            point.addEventListener('touchstart', (e) => {
                e.preventDefault();
                showTooltip(point, e);
            }, { passive: false });
        });

        // Dismiss tooltip on tap outside
        svg.addEventListener('click', (e) => {
            if (!e.target.classList.contains('growth-chart-point') &&
                !e.target.classList.contains('growth-chart-point-hitarea')) {
                hideTooltip();
            }
        });
        document.addEventListener('touchstart', (e) => {
            if (!e.target.closest('.growth-chart-svg-wrap')) {
                hideTooltip();
            }
        }, { passive: true });
    }

    /**
     * Bind chart filter toggle events
     */
    function bindChartFilterEvents(container) {
        const filtersWrap = container.querySelector('#growthChartFilters');
        const chartContainer = container.querySelector('#growthChartContainer');
        if (!filtersWrap || !chartContainer) return;

        const allFields = JSON.parse(chartContainer.dataset.fields || '[]');
        const chartData = JSON.parse(chartContainer.dataset.chart || '[]');
        const unitSystem = chartContainer.dataset.unitSystem || 'metric';

        filtersWrap.querySelectorAll('.growth-chart-filter:not(.growth-chart-filter--disabled)').forEach(btn => {
            btn.addEventListener('click', () => {
                btn.classList.toggle('growth-chart-filter--active');

                // Gather currently active field IDs
                const activeIds = [];
                filtersWrap.querySelectorAll('.growth-chart-filter--active').forEach(b => {
                    activeIds.push(b.dataset.fieldId);
                });

                // Must have at least one active
                if (activeIds.length === 0) {
                    btn.classList.add('growth-chart-filter--active');
                    Toast.error('At least one parameter must be visible');
                    return;
                }

                // Re-render chart with filtered fields
                const filteredFields = allFields.filter(f => activeIds.includes(f.id));
                chartContainer.innerHTML = renderSimpleChart(chartData, filteredFields, unitSystem);

                // Re-bind tooltip events on the new SVG
                bindChartTooltipEvents(container);
            });
        });
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

        // Import data
        document.getElementById('importDataBtn')?.addEventListener('click', () => {
            showImportModal(memberId, () => {
                renderFullPage(container, memberId, member, activeTab);
            });
        });
        container.querySelectorAll('[data-action="import-data"]').forEach(btn => {
            btn.addEventListener('click', () => {
                showImportModal(memberId, () => {
                    renderFullPage(container, memberId, member, activeTab);
                });
            });
        });

        // Customize fields
        document.getElementById('customizeFieldsBtn')?.addEventListener('click', () => {
            showCustomizeFieldsModal(memberId, () => {
                renderFullPage(container, memberId, member, activeTab);
            });
        });

        // Unit toggle
        document.getElementById('unitToggleBtn')?.addEventListener('click', () => {
            data.unit = data.unit === 'metric' ? 'imperial' : 'metric';
            saveWidgetData(memberId, data);
            renderFullPage(container, memberId, member, activeTab);
        });

        // Chart tooltip events and filter toggles
        if (activeTab === 'chart') {
            bindChartTooltipEvents(container);
            bindChartFilterEvents(container);
        }

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
     * Preset color palette for new fields
     */
    const FIELD_COLORS = [
        '#6366F1', '#22C55E', '#F59E0B', '#EF4444', '#3B82F6',
        '#EC4899', '#14B8A6', '#F97316', '#8B5CF6', '#06B6D4'
    ];

    /**
     * Show modal to customize tracked measurement fields
     */
    function showCustomizeFieldsModal(memberId, onSave) {
        const data = getWidgetData(memberId);
        const fields = [...(data.fields || DEFAULT_FIELDS)];
        const unitSystem = data.unit || 'metric';

        function renderFieldsList() {
            return fields.map((field, idx) => {
                const isDefault = DEFAULT_FIELDS.some(d => d.id === field.id);
                return `
                    <div class="growth-custom-field" data-idx="${idx}">
                        <div class="growth-custom-field__color" style="background: ${field.color}"></div>
                        <div class="growth-custom-field__info">
                            <span class="growth-custom-field__name">${field.name}</span>
                            <span class="growth-custom-field__unit">${field.unit.metric} / ${field.unit.imperial}</span>
                        </div>
                        <div class="growth-custom-field__actions">
                            <button class="btn btn--xs btn--ghost" data-action="edit-field" data-idx="${idx}" title="Edit">
                                <i data-lucide="pencil"></i>
                            </button>
                            ${!isDefault ? `
                                <button class="btn btn--xs btn--ghost btn--danger" data-action="remove-field" data-idx="${idx}" title="Remove">
                                    <i data-lucide="trash-2"></i>
                                </button>
                            ` : ''}
                        </div>
                    </div>
                `;
            }).join('');
        }

        const content = `
            <div class="growth-customize-modal">
                <p class="growth-customize-modal__desc">Choose which measurements to track. Default fields (Height, Weight, Head Circumference) cannot be removed.</p>
                <div class="growth-custom-fields-list" id="customFieldsList">
                    ${renderFieldsList()}
                </div>
                <button class="btn btn--sm btn--outline growth-customize-modal__add" id="addNewFieldBtn">
                    <i data-lucide="plus"></i>
                    Add Custom Parameter
                </button>
            </div>
        `;

        Modal.open({
            title: 'Customize Parameters',
            content,
            footer: Modal.createFooter('Cancel', 'Save')
        });

        if (typeof lucide !== 'undefined') lucide.createIcons();

        // Bind field action events
        function bindFieldEvents() {
            const list = document.getElementById('customFieldsList');
            if (!list) return;

            list.querySelectorAll('[data-action="remove-field"]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const idx = parseInt(btn.dataset.idx);
                    fields.splice(idx, 1);
                    list.innerHTML = renderFieldsList();
                    if (typeof lucide !== 'undefined') lucide.createIcons();
                    bindFieldEvents();
                });
            });

            list.querySelectorAll('[data-action="edit-field"]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const idx = parseInt(btn.dataset.idx);
                    showEditFieldInline(idx);
                });
            });
        }

        function showEditFieldInline(idx) {
            const field = fields[idx];
            const list = document.getElementById('customFieldsList');
            const card = list.querySelector(`[data-idx="${idx}"]`);
            if (!card) return;

            card.innerHTML = `
                <div class="growth-custom-field__edit">
                    <div class="form-group">
                        <label class="form-label">Name</label>
                        <input type="text" class="form-input form-input--sm" id="editFieldName" value="${field.name}" placeholder="e.g. Shoe Size">
                    </div>
                    <div class="growth-custom-field__edit-row">
                        <div class="form-group">
                            <label class="form-label">Metric unit</label>
                            <input type="text" class="form-input form-input--sm" id="editFieldMetric" value="${field.unit.metric}" placeholder="cm">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Imperial unit</label>
                            <input type="text" class="form-input form-input--sm" id="editFieldImperial" value="${field.unit.imperial}" placeholder="in">
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Color</label>
                        <div class="growth-color-picker" id="editColorPicker">
                            ${FIELD_COLORS.map(c => `
                                <button class="growth-color-swatch ${c === field.color ? 'growth-color-swatch--active' : ''}"
                                        style="background: ${c}" data-color="${c}"></button>
                            `).join('')}
                        </div>
                    </div>
                    <div class="growth-custom-field__edit-actions">
                        <button class="btn btn--xs btn--ghost" id="editFieldCancel">Cancel</button>
                        <button class="btn btn--xs btn--primary" id="editFieldSave">Done</button>
                    </div>
                </div>
            `;

            let selectedColor = field.color;
            card.querySelectorAll('.growth-color-swatch').forEach(swatch => {
                swatch.addEventListener('click', () => {
                    card.querySelectorAll('.growth-color-swatch').forEach(s => s.classList.remove('growth-color-swatch--active'));
                    swatch.classList.add('growth-color-swatch--active');
                    selectedColor = swatch.dataset.color;
                });
            });

            card.querySelector('#editFieldCancel')?.addEventListener('click', () => {
                list.innerHTML = renderFieldsList();
                if (typeof lucide !== 'undefined') lucide.createIcons();
                bindFieldEvents();
            });

            card.querySelector('#editFieldSave')?.addEventListener('click', () => {
                const name = card.querySelector('#editFieldName')?.value?.trim();
                const metric = card.querySelector('#editFieldMetric')?.value?.trim();
                const imperial = card.querySelector('#editFieldImperial')?.value?.trim();
                if (!name) { Toast.error('Name is required'); return; }
                if (!metric || !imperial) { Toast.error('Both units are required'); return; }

                fields[idx] = {
                    ...fields[idx],
                    name,
                    unit: { metric, imperial },
                    color: selectedColor
                };

                list.innerHTML = renderFieldsList();
                if (typeof lucide !== 'undefined') lucide.createIcons();
                bindFieldEvents();
            });
        }

        // Add new field button
        document.getElementById('addNewFieldBtn')?.addEventListener('click', () => {
            const usedColors = fields.map(f => f.color);
            const nextColor = FIELD_COLORS.find(c => !usedColors.includes(c)) || FIELD_COLORS[fields.length % FIELD_COLORS.length];
            const newId = `custom-${Date.now()}`;
            fields.push({
                id: newId,
                name: '',
                unit: { metric: '', imperial: '' },
                color: nextColor
            });

            const list = document.getElementById('customFieldsList');
            list.innerHTML = renderFieldsList();
            if (typeof lucide !== 'undefined') lucide.createIcons();
            bindFieldEvents();

            // Immediately open edit for the new field
            showEditFieldInline(fields.length - 1);
        });

        bindFieldEvents();

        // Save handler
        Modal.bindFooterEvents(() => {
            // Capture any open inline editor values before validating
            const openEditor = document.querySelector('.growth-custom-field__edit');
            if (openEditor) {
                const card = openEditor.closest('.growth-custom-field');
                const idx = card ? parseInt(card.dataset.idx) : -1;
                if (idx >= 0 && idx < fields.length) {
                    const name = openEditor.querySelector('#editFieldName')?.value?.trim();
                    const metric = openEditor.querySelector('#editFieldMetric')?.value?.trim();
                    const imperial = openEditor.querySelector('#editFieldImperial')?.value?.trim();
                    const activeSwatch = openEditor.querySelector('.growth-color-swatch--active');
                    const color = activeSwatch?.dataset.color || fields[idx].color;
                    if (name && metric && imperial) {
                        fields[idx] = { ...fields[idx], name, unit: { metric, imperial }, color };
                    }
                }
            }

            // Validate all fields have names and units
            const valid = fields.every(f => f.name && f.unit.metric && f.unit.imperial);
            if (!valid) {
                // Remove incomplete custom fields
                const cleaned = fields.filter(f =>
                    DEFAULT_FIELDS.some(d => d.id === f.id) || (f.name && f.unit.metric && f.unit.imperial)
                );
                data.fields = cleaned;
            } else {
                data.fields = fields;
            }
            saveWidgetData(memberId, data);
            Toast.success('Parameters updated!');
            if (onSave) onSave();
            return true;
        });
    }

    // =========================================================================
    //  Import Measurements
    // =========================================================================

    /**
     * Parse a date string in various formats to YYYY-MM-DD
     */
    function parseImportDate(raw) {
        if (!raw) return null;
        const s = raw.trim();

        // ISO: YYYY-MM-DD
        const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
        if (iso) {
            const d = new Date(s + 'T00:00:00');
            if (!isNaN(d)) return `${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}`;
        }

        // Slash or dash: could be MM/DD/YYYY or DD/MM/YYYY
        const slashed = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
        if (slashed) {
            let [, a, b, y] = slashed;
            // If first number > 12 it must be day (DD/MM/YYYY)
            if (parseInt(a) > 12) {
                return `${y}-${b.padStart(2, '0')}-${a.padStart(2, '0')}`;
            }
            // Default to MM/DD/YYYY
            return `${y}-${a.padStart(2, '0')}-${b.padStart(2, '0')}`;
        }

        // Fallback: native Date parse
        const fallback = new Date(s);
        if (!isNaN(fallback)) return fallback.toISOString().slice(0, 10);

        return null;
    }

    /**
     * Get alias names for built-in fields (fuzzy column matching)
     */
    function getFieldAliases(fieldId) {
        const map = {
            height: ['height', 'length', 'stature', 'ht'],
            weight: ['weight', 'mass', 'wt'],
            head:   ['head', 'hc', 'head circ', 'head circumference', 'cranial']
        };
        return map[fieldId] || [fieldId];
    }

    /**
     * Map CSV header names to field IDs
     */
    function mapColumns(headers, fields) {
        const result = { dateIndex: -1, fieldIndexes: {} };

        // Find date column
        const dateAliases = ['date', 'measurement date', 'recorded', 'day', 'measured on', 'measured'];
        result.dateIndex = headers.findIndex(h => dateAliases.includes(h));

        // Find field columns
        for (const field of fields) {
            const nameLow = field.name.toLowerCase();
            const idLow = field.id.toLowerCase();

            // Exact match on name or id
            let idx = headers.findIndex(h => h === nameLow || h === idLow);

            // Partial match
            if (idx === -1) {
                idx = headers.findIndex(h =>
                    h.includes(nameLow) || nameLow.includes(h) ||
                    h.includes(idLow) || idLow.includes(h)
                );
            }

            // Alias match
            if (idx === -1) {
                const aliases = getFieldAliases(field.id);
                idx = headers.findIndex(h => aliases.some(a => h.includes(a) || a.includes(h)));
            }

            result.fieldIndexes[field.id] = idx;
        }
        return result;
    }

    /**
     * Parse CSV / TSV text into measurement rows
     * Returns { rows: [{date, values}], errors: string[], warnings: string[] }
     */
    function parseCSV(text, fields) {
        const out = { rows: [], errors: [], warnings: [] };
        if (!text || !text.trim()) { out.errors.push('No data to parse'); return out; }

        const lines = text.trim().split(/\r?\n/);
        if (lines.length < 2) { out.errors.push('Need at least a header row and one data row'); return out; }

        // Detect delimiter
        const delimiter = lines[0].includes('\t') ? '\t' : ',';

        // Parse header
        const headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
        const colMap = mapColumns(headers, fields);

        if (colMap.dateIndex === -1) {
            out.errors.push('Could not find a "Date" column. Headers found: ' + headers.join(', '));
            return out;
        }

        // Parse rows
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const cols = line.split(delimiter).map(c => c.trim().replace(/['"]/g, ''));
            const dateRaw = cols[colMap.dateIndex];
            const date = parseImportDate(dateRaw);

            if (!date) {
                out.warnings.push(`Row ${i}: Invalid date "${dateRaw}" — skipped`);
                continue;
            }

            const values = {};
            let hasValue = false;

            for (const [fieldId, colIdx] of Object.entries(colMap.fieldIndexes)) {
                if (colIdx === -1 || colIdx >= cols.length) continue;
                const raw = cols[colIdx];
                if (raw === '' || raw === '-' || raw.toLowerCase() === 'n/a') continue;
                const num = parseFloat(raw);
                if (isNaN(num)) {
                    out.warnings.push(`Row ${i}: Invalid number "${raw}" for ${fieldId} — skipped`);
                    continue;
                }
                values[fieldId] = num;
                hasValue = true;
            }

            if (!hasValue) {
                out.warnings.push(`Row ${i}: No valid values — skipped`);
                continue;
            }

            out.rows.push({ date, values });
        }

        if (out.rows.length === 0 && out.errors.length === 0) {
            out.errors.push('No valid measurements found in the data');
        }
        return out;
    }

    /**
     * Render the manual bulk-entry table HTML
     */
    function renderManualEntryTable(fields, unitSystem, rows) {
        return `
            <div class="growth-import__manual-header">
                <div class="growth-import__manual-col growth-import__manual-col--date">Date</div>
                ${fields.map(f => `
                    <div class="growth-import__manual-col">${f.name} <span class="text-muted">(${f.unit[unitSystem]})</span></div>
                `).join('')}
                <div class="growth-import__manual-col"></div>
            </div>
            <div class="growth-import__manual-rows" id="manualRows">
                ${rows.map((row, i) => `
                    <div class="growth-import__manual-row" data-row-idx="${i}">
                        <div class="growth-import__manual-col growth-import__manual-col--date">
                            <input type="date" class="form-input form-input--sm" data-field="date" value="${row.date || ''}">
                        </div>
                        ${fields.map(f => `
                            <div class="growth-import__manual-col">
                                <input type="number" class="form-input form-input--sm" step="0.1"
                                       data-field="${f.id}" placeholder="-"
                                       value="${row.values?.[f.id] ?? ''}">
                            </div>
                        `).join('')}
                        <button class="btn btn--xs btn--ghost btn--danger growth-import__manual-remove"
                                data-action="remove-manual-row" data-row-idx="${i}" title="Remove">
                            <i data-lucide="x"></i>
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * Read manual-entry DOM inputs into row objects
     */
    function collectManualRows(fields) {
        const rows = [];
        document.querySelectorAll('.growth-import__manual-row').forEach(el => {
            const date = el.querySelector('[data-field="date"]')?.value;
            if (!date) return;

            const values = {};
            let hasValue = false;
            fields.forEach(f => {
                const input = el.querySelector(`[data-field="${f.id}"]`);
                if (input?.value) { values[f.id] = parseFloat(input.value); hasValue = true; }
            });
            if (hasValue) rows.push({ date, values });
        });
        return rows;
    }

    /**
     * Show the Import Measurements modal
     */
    function showImportModal(memberId, onComplete) {
        const data = getWidgetData(memberId);
        const fields = data.fields || DEFAULT_FIELDS;
        const unitSystem = data.unit || 'metric';

        let activeMethod = 'csv';   // 'csv' | 'paste' | 'manual'
        let parsedRows = [];
        let previewVisible = false;
        let csvText = '';
        let manualRows = [{ date: '', values: {} }, { date: '', values: {} }, { date: '', values: {} }];

        const content = `
            <div class="growth-import">
                <!-- Method selector pills -->
                <div class="growth-import__methods" id="importMethods">
                    <button class="growth-import__method growth-import__method--active" data-method="csv">
                        <i data-lucide="file-up"></i> CSV File
                    </button>
                    <button class="growth-import__method" data-method="paste">
                        <i data-lucide="clipboard-paste"></i> Paste Text
                    </button>
                    <button class="growth-import__method" data-method="manual">
                        <i data-lucide="table"></i> Manual Entry
                    </button>
                </div>

                <!-- Input sections (one visible at a time) -->
                <div id="importInputSection">
                    <!-- CSV file upload -->
                    <div class="growth-import__section" id="importCsvSection">
                        <div class="growth-import__dropzone" id="csvDropzone">
                            <i data-lucide="upload-cloud"></i>
                            <p>Drop CSV file here or click to browse</p>
                            <span class="text-muted">Accepts .csv, .tsv, or .txt files with a Date column</span>
                            <input type="file" accept=".csv,.tsv,.txt" id="csvFileInput" style="display:none">
                        </div>
                        <div class="growth-import__file-info" id="csvFileInfo" style="display:none">
                            <i data-lucide="file-check"></i>
                            <span id="csvFileName"></span>
                            <button class="btn btn--xs btn--ghost" id="csvRemoveFile" title="Remove file">
                                <i data-lucide="x"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Paste text -->
                    <div class="growth-import__section" id="importPasteSection" style="display:none">
                        <label class="form-label">Paste CSV or tab-separated data</label>
                        <textarea class="form-input" id="pasteTextarea" rows="8"
                                  placeholder="Date,Height,Weight&#10;2024-01-15,75.5,9.8&#10;2024-02-15,77.0,10.2"></textarea>
                        <p class="growth-import__hint">First row is treated as header. Supports comma and tab delimiters.</p>
                    </div>

                    <!-- Manual entry -->
                    <div class="growth-import__section" id="importManualSection" style="display:none">
                        <div class="growth-import__manual-table" id="manualEntryTable">
                            ${renderManualEntryTable(fields, unitSystem, manualRows)}
                        </div>
                        <button class="btn btn--sm btn--outline" id="addManualRowBtn" style="margin-top:var(--space-2)">
                            <i data-lucide="plus"></i> Add Row
                        </button>
                    </div>
                </div>

                <!-- Preview (hidden until parse) -->
                <div id="importPreviewSection" style="display:none"></div>
            </div>
        `;

        Modal.open({
            title: 'Import Measurements',
            content,
            size: 'large',
            footer: `
                <button class="btn btn--secondary" data-modal-cancel>Cancel</button>
                <button class="btn btn--outline" id="importBackBtn" style="display:none">
                    <i data-lucide="arrow-left"></i> Back
                </button>
                <button class="btn btn--primary" id="importNextBtn">
                    Parse &amp; Preview
                </button>
                <button class="btn btn--primary" id="importConfirmBtn" style="display:none">
                    <i data-lucide="check"></i> Import <span id="importCount">0</span> Measurements
                </button>
            `
        });

        if (typeof lucide !== 'undefined') lucide.createIcons();

        // ---- Tab switching ----
        document.querySelectorAll('.growth-import__method').forEach(btn => {
            btn.addEventListener('click', () => {
                if (previewVisible) return;
                activeMethod = btn.dataset.method;
                document.querySelectorAll('.growth-import__method').forEach(b =>
                    b.classList.toggle('growth-import__method--active', b === btn));
                document.getElementById('importCsvSection').style.display = activeMethod === 'csv' ? '' : 'none';
                document.getElementById('importPasteSection').style.display = activeMethod === 'paste' ? '' : 'none';
                document.getElementById('importManualSection').style.display = activeMethod === 'manual' ? '' : 'none';
            });
        });

        // ---- CSV file handling ----
        function handleFile(file) {
            if (!file.name.match(/\.(csv|tsv|txt)$/i)) {
                Toast.error('Please select a .csv, .tsv, or .txt file');
                return;
            }
            const reader = new FileReader();
            reader.onload = (e) => {
                csvText = e.target.result;
                document.getElementById('csvDropzone').style.display = 'none';
                document.getElementById('csvFileInfo').style.display = 'flex';
                document.getElementById('csvFileName').textContent = file.name;
            };
            reader.onerror = () => Toast.error('Failed to read file');
            reader.readAsText(file);
        }

        document.getElementById('csvDropzone')?.addEventListener('click', () => {
            document.getElementById('csvFileInput')?.click();
        });
        document.getElementById('csvFileInput')?.addEventListener('change', (e) => {
            if (e.target.files?.[0]) handleFile(e.target.files[0]);
        });
        document.getElementById('csvRemoveFile')?.addEventListener('click', () => {
            csvText = '';
            document.getElementById('csvDropzone').style.display = '';
            document.getElementById('csvFileInfo').style.display = 'none';
            document.getElementById('csvFileInput').value = '';
        });

        // Drag and drop
        const dropzone = document.getElementById('csvDropzone');
        if (dropzone) {
            dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('growth-import__dropzone--dragover'); });
            dropzone.addEventListener('dragleave', () => { dropzone.classList.remove('growth-import__dropzone--dragover'); });
            dropzone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropzone.classList.remove('growth-import__dropzone--dragover');
                if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
            });
        }

        // ---- Manual entry events ----
        function bindManualRowEvents() {
            document.querySelectorAll('[data-action="remove-manual-row"]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const idx = parseInt(btn.dataset.rowIdx);
                    manualRows.splice(idx, 1);
                    if (manualRows.length === 0) manualRows.push({ date: '', values: {} });
                    document.getElementById('manualEntryTable').innerHTML = renderManualEntryTable(fields, unitSystem, manualRows);
                    if (typeof lucide !== 'undefined') lucide.createIcons();
                    bindManualRowEvents();
                });
            });
        }
        bindManualRowEvents();

        document.getElementById('addManualRowBtn')?.addEventListener('click', () => {
            // Capture current DOM values before re-render
            syncManualRowsFromDOM();
            manualRows.push({ date: '', values: {} });
            document.getElementById('manualEntryTable').innerHTML = renderManualEntryTable(fields, unitSystem, manualRows);
            if (typeof lucide !== 'undefined') lucide.createIcons();
            bindManualRowEvents();
        });

        function syncManualRowsFromDOM() {
            document.querySelectorAll('.growth-import__manual-row').forEach((el, i) => {
                if (!manualRows[i]) manualRows[i] = { date: '', values: {} };
                manualRows[i].date = el.querySelector('[data-field="date"]')?.value || '';
                fields.forEach(f => {
                    const v = el.querySelector(`[data-field="${f.id}"]`)?.value;
                    if (v) manualRows[i].values[f.id] = parseFloat(v);
                });
            });
        }

        // ---- Parse & Preview button ----
        document.getElementById('importNextBtn')?.addEventListener('click', () => {
            let text = '';
            if (activeMethod === 'csv') {
                text = csvText;
                if (!text) { Toast.error('Please select a CSV file first'); return; }
            } else if (activeMethod === 'paste') {
                text = document.getElementById('pasteTextarea')?.value || '';
                if (!text.trim()) { Toast.error('Please paste some data first'); return; }
            } else {
                // Manual: collect directly
                parsedRows = collectManualRows(fields);
                if (parsedRows.length === 0) { Toast.error('Please enter at least one row with a date and value'); return; }
                showPreview(parsedRows, []);
                return;
            }

            const result = parseCSV(text, fields);
            if (result.errors.length > 0) { Toast.error(result.errors[0]); return; }
            parsedRows = result.rows;
            showPreview(parsedRows, result.warnings);
        });

        // ---- Show Preview step ----
        function showPreview(rows, warnings) {
            previewVisible = true;
            document.getElementById('importInputSection').style.display = 'none';
            document.getElementById('importPreviewSection').style.display = '';
            document.getElementById('importNextBtn').style.display = 'none';
            document.getElementById('importBackBtn').style.display = '';
            document.getElementById('importConfirmBtn').style.display = '';
            document.querySelectorAll('.growth-import__method').forEach(b => b.classList.add('growth-import__method--disabled'));

            const existingDates = new Set((data.measurements || []).map(m => m.date));

            document.getElementById('importPreviewSection').innerHTML = `
                <div class="growth-import__preview-summary">
                    <i data-lucide="check-circle"></i>
                    <span>Found <strong>${rows.length}</strong> measurement${rows.length !== 1 ? 's' : ''} to import</span>
                </div>
                ${warnings.length > 0 ? `
                    <div class="growth-import__warnings">
                        <i data-lucide="alert-triangle"></i>
                        <div>
                            ${warnings.slice(0, 5).map(w => `<p>${w}</p>`).join('')}
                            ${warnings.length > 5 ? `<p class="text-muted">...and ${warnings.length - 5} more</p>` : ''}
                        </div>
                    </div>
                ` : ''}
                <div class="growth-import__preview-table">
                    <div class="growth-import__preview-header" style="grid-template-columns: 36px 100px repeat(${fields.length}, 1fr) 70px;">
                        <div class="growth-import__preview-col growth-import__preview-col--check">
                            <input type="checkbox" id="importSelectAll" checked>
                        </div>
                        <div class="growth-import__preview-col growth-import__preview-col--date">Date</div>
                        ${fields.map(f => `
                            <div class="growth-import__preview-col" style="color: ${f.color}">${f.name}</div>
                        `).join('')}
                        <div class="growth-import__preview-col growth-import__preview-col--status">Status</div>
                    </div>
                    <div class="growth-import__preview-body">
                        ${rows.map((row, i) => {
                            const isDup = existingDates.has(row.date);
                            return `
                                <div class="growth-import__preview-row ${isDup ? 'growth-import__preview-row--update' : ''}"
                                     style="grid-template-columns: 36px 100px repeat(${fields.length}, 1fr) 70px;">
                                    <div class="growth-import__preview-col growth-import__preview-col--check">
                                        <input type="checkbox" class="import-row-check" data-row-idx="${i}" checked>
                                    </div>
                                    <div class="growth-import__preview-col growth-import__preview-col--date">
                                        ${DateUtils.formatShort(row.date)}
                                    </div>
                                    ${fields.map(f => `
                                        <div class="growth-import__preview-col">
                                            ${row.values[f.id] !== undefined ? row.values[f.id] : '-'}
                                        </div>
                                    `).join('')}
                                    <div class="growth-import__preview-col growth-import__preview-col--status">
                                        ${isDup
                                            ? '<span class="growth-import__badge growth-import__badge--update">Update</span>'
                                            : '<span class="growth-import__badge growth-import__badge--new">New</span>'}
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;

            if (typeof lucide !== 'undefined') lucide.createIcons();
            updateImportCount();
            bindPreviewEvents();
        }

        function bindPreviewEvents() {
            document.getElementById('importSelectAll')?.addEventListener('change', (e) => {
                document.querySelectorAll('.import-row-check').forEach(cb => cb.checked = e.target.checked);
                updateImportCount();
            });
            document.querySelectorAll('.import-row-check').forEach(cb => {
                cb.addEventListener('change', updateImportCount);
            });
        }

        function updateImportCount() {
            const count = document.querySelectorAll('.import-row-check:checked').length;
            const el = document.getElementById('importCount');
            if (el) el.textContent = count;
            const btn = document.getElementById('importConfirmBtn');
            if (btn) btn.disabled = count === 0;
        }

        // ---- Back button ----
        document.getElementById('importBackBtn')?.addEventListener('click', () => {
            previewVisible = false;
            document.getElementById('importInputSection').style.display = '';
            document.getElementById('importPreviewSection').style.display = 'none';
            document.getElementById('importNextBtn').style.display = '';
            document.getElementById('importBackBtn').style.display = 'none';
            document.getElementById('importConfirmBtn').style.display = 'none';
            document.querySelectorAll('.growth-import__method').forEach(b => b.classList.remove('growth-import__method--disabled'));
        });

        // ---- Confirm import ----
        document.getElementById('importConfirmBtn')?.addEventListener('click', () => {
            const selected = [];
            document.querySelectorAll('.import-row-check:checked').forEach(cb => {
                selected.push(parseInt(cb.dataset.rowIdx));
            });
            if (selected.length === 0) { Toast.error('No measurements selected'); return; }

            const freshData = getWidgetData(memberId);
            let newCount = 0, updatedCount = 0;

            selected.forEach(idx => {
                const row = parsedRows[idx];
                if (!row) return;

                const existIdx = freshData.measurements.findIndex(m => m.date === row.date);
                if (existIdx !== -1) {
                    freshData.measurements[existIdx].values = { ...freshData.measurements[existIdx].values, ...row.values };
                    updatedCount++;
                } else {
                    freshData.measurements.push({
                        id: `measurement-${Date.now()}-${idx}`,
                        date: row.date,
                        values: row.values
                    });
                    newCount++;
                }
            });

            freshData.measurements.sort((a, b) => a.date.localeCompare(b.date));
            saveWidgetData(memberId, freshData);
            Modal.close();

            const parts = [];
            if (newCount > 0) parts.push(`${newCount} added`);
            if (updatedCount > 0) parts.push(`${updatedCount} updated`);
            Toast.success(`Import complete: ${parts.join(', ')}`);

            if (onComplete) onComplete();
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
