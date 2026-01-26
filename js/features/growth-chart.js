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
            showAddMeasurementModal(memberId);
        });

        container.querySelector('[data-action="history"]')?.addEventListener('click', () => {
            showFullPage(memberId);
        });
    }

    /**
     * Show add measurement modal
     */
    function showAddMeasurementModal(memberId) {
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

            // Refresh widget
            const widgetBody = document.getElementById('widget-growth-chart');
            if (widgetBody) {
                renderWidget(widgetBody, memberId);
            }

            Toast.success('Measurement added!');
            return true;
        });
    }

    /**
     * Show full page with chart
     */
    function showFullPage(memberId) {
        const main = document.querySelector('main');
        if (!main) return;

        const member = Storage.getMember(memberId);
        const data = getWidgetData(memberId);
        const measurements = data.measurements || [];
        const unitSystem = data.unit || 'metric';
        const fields = data.fields || DEFAULT_FIELDS;

        // Calculate chart data
        const chartData = measurements.map(m => ({
            date: m.date,
            dateLabel: DateUtils.formatShort(m.date),
            ...m.values
        }));

        main.innerHTML = `
            <div class="full-page">
                <div class="full-page__header">
                    <button class="btn btn--ghost" id="backBtn">
                        <i data-lucide="arrow-left"></i>
                        Back
                    </button>
                    <h1 class="full-page__title">${member?.name || ''} Growth Chart</h1>
                    <div class="full-page__actions">
                        <button class="btn btn--sm btn--ghost" id="settingsBtn" title="Settings">
                            <i data-lucide="settings"></i>
                        </button>
                    </div>
                </div>

                <div class="full-page__content">
                    <div class="growth-chart-page">
                        <div class="growth-chart-actions">
                            <button class="btn btn--primary" id="addMeasurementBtn">
                                <i data-lucide="plus"></i>
                                Add Measurement
                            </button>
                            <div class="growth-chart-unit-toggle">
                                <button class="unit-toggle-btn ${unitSystem === 'metric' ? 'unit-toggle-btn--active' : ''}"
                                        data-unit="metric">Metric (cm/kg)</button>
                                <button class="unit-toggle-btn ${unitSystem === 'imperial' ? 'unit-toggle-btn--active' : ''}"
                                        data-unit="imperial">Imperial (in/lbs)</button>
                            </div>
                        </div>

                        ${measurements.length > 0 ? `
                            <div class="growth-chart-container">
                                ${renderSimpleChart(chartData, fields, unitSystem)}
                            </div>

                            <div class="growth-chart-history">
                                <h3 class="growth-chart-history__title">Measurement History</h3>
                                <div class="growth-chart-history__list">
                                    ${[...measurements].reverse().map(m => {
                                        const note = data.notes[m.id];
                                        return `
                                            <div class="growth-measurement-card" data-id="${m.id}">
                                                <div class="growth-measurement-card__header">
                                                    <span class="growth-measurement-card__date">${DateUtils.formatShort(m.date)}</span>
                                                    <button class="btn btn--xs btn--ghost" data-action="delete" data-id="${m.id}">
                                                        <i data-lucide="trash-2"></i>
                                                    </button>
                                                </div>
                                                <div class="growth-measurement-card__values">
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
                                                    <div class="growth-measurement-card__note">
                                                        <i data-lucide="message-square"></i>
                                                        ${note}
                                                    </div>
                                                ` : ''}
                                            </div>
                                        `;
                                    }).join('')}
                                </div>
                            </div>
                        ` : `
                            <div class="empty-state">
                                <i data-lucide="ruler"></i>
                                <p>No measurements recorded yet</p>
                                <span class="text-muted">Add your first measurement to start tracking growth</span>
                            </div>
                        `}
                    </div>
                </div>
            </div>
        `;

        // Initialize icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Bind events
        document.getElementById('backBtn')?.addEventListener('click', () => {
            State.emit('tabChanged', memberId);
        });

        document.getElementById('addMeasurementBtn')?.addEventListener('click', () => {
            showAddMeasurementModal(memberId);
        });

        document.getElementById('settingsBtn')?.addEventListener('click', async () => {
            const verified = await PIN.verify();
            if (verified) {
                showSettingsModal(memberId);
            }
        });

        // Unit toggle
        document.querySelectorAll('[data-unit]').forEach(btn => {
            btn.addEventListener('click', () => {
                const newUnit = btn.dataset.unit;
                data.unit = newUnit;
                saveWidgetData(memberId, data);
                showFullPage(memberId);
            });
        });

        // Delete buttons
        document.querySelectorAll('[data-action="delete"]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const verified = await PIN.verify();
                if (verified) {
                    const id = btn.dataset.id;
                    data.measurements = data.measurements.filter(m => m.id !== id);
                    delete data.notes[id];
                    saveWidgetData(memberId, data);
                    showFullPage(memberId);
                    Toast.success('Measurement deleted');
                }
            });
        });
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
     * Show settings modal
     */
    function showSettingsModal(memberId) {
        const data = getWidgetData(memberId);
        const fields = data.fields || DEFAULT_FIELDS;

        const content = `
            <div class="growth-settings">
                <h4 class="growth-settings__title">Measurement Fields</h4>
                <div class="growth-settings__fields">
                    ${fields.map(field => `
                        <div class="growth-settings__field">
                            <span>${field.name}</span>
                            <button class="btn btn--xs btn--ghost" data-remove-field="${field.id}"
                                    ${fields.length <= 1 ? 'disabled' : ''}>
                                <i data-lucide="x"></i>
                            </button>
                        </div>
                    `).join('')}
                </div>

                <div class="growth-settings__add">
                    <input type="text" class="form-input" id="newFieldName" placeholder="New field name">
                    <button class="btn btn--sm btn--outline" id="addFieldBtn">
                        <i data-lucide="plus"></i>
                        Add
                    </button>
                </div>
            </div>
        `;

        Modal.open({
            title: 'Growth Chart Settings',
            content,
            footer: '<button class="btn btn--primary" data-modal-close>Done</button>'
        });

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Add field
        document.getElementById('addFieldBtn')?.addEventListener('click', () => {
            const input = document.getElementById('newFieldName');
            const name = input?.value?.trim();
            if (!name) {
                Toast.error('Please enter a field name');
                return;
            }

            const id = name.toLowerCase().replace(/\s+/g, '-');
            if (fields.find(f => f.id === id)) {
                Toast.error('Field already exists');
                return;
            }

            const colors = ['#EC4899', '#8B5CF6', '#14B8A6', '#EF4444', '#3B82F6'];
            const color = colors[fields.length % colors.length];

            fields.push({
                id,
                name,
                unit: { metric: '', imperial: '' },
                color
            });

            data.fields = fields;
            saveWidgetData(memberId, data);
            showSettingsModal(memberId);
            Toast.success('Field added');
        });

        // Remove field
        document.querySelectorAll('[data-remove-field]').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.removeField;
                data.fields = fields.filter(f => f.id !== id);
                saveWidgetData(memberId, data);
                showSettingsModal(memberId);
                Toast.success('Field removed');
            });
        });

        document.querySelector('[data-modal-close]')?.addEventListener('click', () => {
            Modal.close();
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
