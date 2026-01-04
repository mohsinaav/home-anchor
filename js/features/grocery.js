/**
 * Grocery List Feature
 * Handles grocery list management with manual entry and auto-generation from meal plans
 * Enhanced with: smart suggestions, pantry tracking, unit conversion, share list
 */

const Grocery = (function() {
    // Category colors for visual coding
    const CATEGORIES = [
        { id: 'produce', name: 'Produce', icon: 'apple', color: '#22C55E', bgColor: '#DCFCE7' },
        { id: 'dairy', name: 'Dairy', icon: 'milk', color: '#3B82F6', bgColor: '#DBEAFE' },
        { id: 'meat', name: 'Meat & Seafood', icon: 'beef', color: '#EF4444', bgColor: '#FEE2E2' },
        { id: 'bakery', name: 'Bakery', icon: 'croissant', color: '#F59E0B', bgColor: '#FEF3C7' },
        { id: 'frozen', name: 'Frozen', icon: 'snowflake', color: '#06B6D4', bgColor: '#CFFAFE' },
        { id: 'pantry', name: 'Pantry', icon: 'package', color: '#8B5CF6', bgColor: '#EDE9FE' },
        { id: 'beverages', name: 'Beverages', icon: 'cup-soda', color: '#EC4899', bgColor: '#FCE7F3' },
        { id: 'household', name: 'Household', icon: 'home', color: '#6366F1', bgColor: '#E0E7FF' },
        { id: 'other', name: 'Other', icon: 'shopping-bag', color: '#64748B', bgColor: '#F1F5F9' }
    ];

    // Default stores for organization
    const DEFAULT_STORES = [
        { id: 'walmart', name: 'Walmart', icon: 'store', color: '#0071CE', sortOrder: 0, collapsed: false },
        { id: 'target', name: 'Target', icon: 'shopping-bag', color: '#CC0000', sortOrder: 1, collapsed: false },
        { id: 'costco', name: 'Costco', icon: 'warehouse', color: '#0061B4', sortOrder: 2, collapsed: false },
        { id: 'trader-joes', name: "Trader Joe's", icon: 'leaf', color: '#D50032', sortOrder: 3, collapsed: false },
        { id: 'whole-foods', name: 'Whole Foods', icon: 'sprout', color: '#00A862', sortOrder: 4, collapsed: false }
    ];

    // Unit conversion map
    const UNIT_CONVERSIONS = {
        // Weight
        'lb': { to: 'kg', factor: 0.453592, label: 'kg' },
        'lbs': { to: 'kg', factor: 0.453592, label: 'kg' },
        'kg': { to: 'lb', factor: 2.20462, label: 'lb' },
        'oz': { to: 'g', factor: 28.3495, label: 'g' },
        'g': { to: 'oz', factor: 0.035274, label: 'oz' },
        // Volume
        'cup': { to: 'ml', factor: 236.588, label: 'ml' },
        'cups': { to: 'ml', factor: 236.588, label: 'ml' },
        'ml': { to: 'cup', factor: 0.00422675, label: 'cups' },
        'liter': { to: 'gallon', factor: 0.264172, label: 'gal' },
        'liters': { to: 'gallon', factor: 0.264172, label: 'gal' },
        'gallon': { to: 'liter', factor: 3.78541, label: 'L' },
        'gallons': { to: 'liter', factor: 3.78541, label: 'L' },
        'tbsp': { to: 'ml', factor: 14.7868, label: 'ml' },
        'tsp': { to: 'ml', factor: 4.92892, label: 'ml' }
    };

    // Quick add suggestions (base)
    const QUICK_ADDS = [
        'Milk', 'Eggs', 'Bread', 'Butter', 'Cheese', 'Chicken',
        'Rice', 'Pasta', 'Tomatoes', 'Onions', 'Bananas', 'Apples'
    ];

    /**
     * Get widget data with defaults
     */
    function getWidgetData(memberId) {
        const data = Storage.getWidgetData(memberId, 'grocery') || {};
        return {
            items: data.items || [],
            stores: data.stores || DEFAULT_STORES.map(s => ({...s})), // Initialize with defaults
            pantry: data.pantry || [],
            purchaseHistory: data.purchaseHistory || [],
            savedLists: data.savedLists || []
        };
    }

    /**
     * Save widget data
     */
    function saveWidgetData(memberId, data) {
        Storage.setWidgetData(memberId, 'grocery', data);
    }

    /**
     * Get smart suggestions based on purchase history
     */
    function getSmartSuggestions(memberId) {
        const data = getWidgetData(memberId);
        const history = data.purchaseHistory || [];
        const currentItems = data.items.map(i => i.name.toLowerCase());

        // Count purchase frequency
        const frequency = {};
        history.forEach(item => {
            const name = item.name.toLowerCase();
            frequency[name] = (frequency[name] || 0) + 1;
        });

        // Sort by frequency and filter out items already in list
        const suggestions = Object.entries(frequency)
            .filter(([name]) => !currentItems.includes(name))
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(([name]) => {
                // Capitalize first letter
                return name.charAt(0).toUpperCase() + name.slice(1);
            });

        // If not enough suggestions, add from default quick adds
        if (suggestions.length < 8) {
            const remaining = QUICK_ADDS.filter(item =>
                !currentItems.includes(item.toLowerCase()) &&
                !suggestions.map(s => s.toLowerCase()).includes(item.toLowerCase())
            );
            suggestions.push(...remaining.slice(0, 8 - suggestions.length));
        }

        return suggestions;
    }

    /**
     * Add item to purchase history (for smart suggestions)
     */
    function addToPurchaseHistory(memberId, itemName) {
        const data = getWidgetData(memberId);
        data.purchaseHistory.push({
            name: itemName,
            date: new Date().toISOString()
        });
        // Keep only last 200 entries
        if (data.purchaseHistory.length > 200) {
            data.purchaseHistory = data.purchaseHistory.slice(-200);
        }
        saveWidgetData(memberId, data);
    }

    /**
     * Check if item is in pantry
     */
    function isInPantry(memberId, itemName) {
        const data = getWidgetData(memberId);
        return data.pantry.some(p => p.name.toLowerCase() === itemName.toLowerCase());
    }

    /**
     * Add/remove item from pantry
     */
    function togglePantryItem(memberId, itemName, category = 'other') {
        const data = getWidgetData(memberId);
        const index = data.pantry.findIndex(p => p.name.toLowerCase() === itemName.toLowerCase());

        if (index !== -1) {
            data.pantry.splice(index, 1);
        } else {
            data.pantry.push({
                name: itemName,
                category,
                addedAt: new Date().toISOString()
            });
        }
        saveWidgetData(memberId, data);
        return index === -1; // Returns true if added, false if removed
    }

    /**
     * Get stores sorted by sortOrder
     */
    function getStores(memberId) {
        const data = getWidgetData(memberId);
        return (data.stores || []).sort((a, b) => a.sortOrder - b.sortOrder);
    }

    /**
     * Add new store
     */
    function addStore(memberId, storeName) {
        const data = getWidgetData(memberId);
        const maxOrder = Math.max(-1, ...data.stores.map(s => s.sortOrder));

        const newStore = {
            id: `store-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: storeName,
            icon: 'store',
            color: '#6B7280', // Default gray
            sortOrder: maxOrder + 1,
            collapsed: false
        };

        data.stores.push(newStore);
        saveWidgetData(memberId, data);
        return newStore;
    }

    /**
     * Update store
     */
    function updateStore(memberId, storeId, updates) {
        const data = getWidgetData(memberId);
        const store = data.stores.find(s => s.id === storeId);

        if (store) {
            Object.assign(store, updates);
            saveWidgetData(memberId, data);
        }
    }

    /**
     * Delete store (items become unassigned)
     */
    function deleteStore(memberId, storeId) {
        const data = getWidgetData(memberId);

        // Remove store assignment from items
        data.items.forEach(item => {
            if (item.store === storeId) {
                item.store = null;
            }
        });

        // Remove store from list
        data.stores = data.stores.filter(s => s.id !== storeId);

        saveWidgetData(memberId, data);
    }

    /**
     * Reorder stores
     */
    function reorderStores(memberId, storeIds) {
        const data = getWidgetData(memberId);

        storeIds.forEach((id, index) => {
            const store = data.stores.find(s => s.id === id);
            if (store) {
                store.sortOrder = index;
            }
        });

        saveWidgetData(memberId, data);
    }

    /**
     * Toggle store collapsed state
     */
    function toggleStoreCollapsed(memberId, storeId) {
        const data = getWidgetData(memberId);
        const store = data.stores.find(s => s.id === storeId);

        if (store) {
            store.collapsed = !store.collapsed;
            saveWidgetData(memberId, data);
        }
    }

    /**
     * Get pantry items
     */
    function getPantryItems(memberId) {
        const data = getWidgetData(memberId);
        return data.pantry || [];
    }

    /**
     * Convert quantity unit
     */
    function convertUnit(quantity) {
        if (!quantity) return null;

        // Parse quantity string
        const match = quantity.match(/^([\d.]+)\s*(\w+)$/);
        if (!match) return null;

        const [, numStr, unit] = match;
        const num = parseFloat(numStr);
        const unitLower = unit.toLowerCase();

        const conversion = UNIT_CONVERSIONS[unitLower];
        if (!conversion) return null;

        const converted = num * conversion.factor;
        const roundedNum = Math.round(converted * 100) / 100;

        return `${roundedNum} ${conversion.label}`;
    }

    /**
     * Initialize grocery feature
     */
    function init() {
        // Feature initialization
    }

    /**
     * Render the grocery widget for a member
     */
    function renderWidget(container, memberId) {
        const data = getWidgetData(memberId);
        const items = data.items || [];
        const stores = getStores(memberId);

        // Count checked and unchecked items
        const uncheckedItems = items.filter(i => !i.checked);
        const checkedItems = items.filter(i => i.checked);
        const progress = items.length > 0 ? Math.round((checkedItems.length / items.length) * 100) : 0;

        // Group unchecked items by store
        const storeGroups = {};
        stores.forEach(store => {
            storeGroups[store.id] = {
                store,
                items: uncheckedItems.filter(item => item.store === store.id)
            };
        });
        const unassignedItems = uncheckedItems.filter(item => !item.store);

        container.innerHTML = `
            <div class="grocery-widget">
                <div class="grocery-widget__actions grocery-widget__actions--top">
                    <button class="btn btn--primary btn--sm" data-action="open-grocery" data-member-id="${memberId}">
                        <i data-lucide="shopping-cart"></i>
                        ${items.length > 0 ? 'View Full List' : 'Start List'}
                    </button>
                </div>

                <div class="grocery-widget__summary">
                    <div class="grocery-widget__count">
                        <span class="grocery-widget__count-number">${uncheckedItems.length}</span>
                        <span class="grocery-widget__count-label">items to buy</span>
                    </div>
                    ${items.length > 0 ? `
                        <div class="grocery-widget__progress">
                            <div class="grocery-widget__progress-bar">
                                <div class="grocery-widget__progress-fill ${progress === 100 ? 'grocery-widget__progress-fill--complete' : ''}" style="width: ${progress}%"></div>
                            </div>
                            <span class="grocery-widget__progress-text">${progress}%</span>
                        </div>
                    ` : ''}
                </div>

                <div class="grocery-widget__preview">
                    ${uncheckedItems.length === 0 ? `
                        <div class="grocery-widget__empty">
                            <div class="grocery-widget__empty-icon">
                                <i data-lucide="shopping-bag"></i>
                            </div>
                            <p>Your list is empty</p>
                        </div>
                    ` : `
                        <div class="grocery-widget__stores">
                            ${Object.values(storeGroups).filter(sg => sg.items.length > 0).map(({ store, items }) => `
                                <div class="grocery-widget__store">
                                    <div class="grocery-widget__store-header">
                                        <div class="grocery-widget__store-icon" style="background: ${store.color}20; color: ${store.color}">
                                            <i data-lucide="${store.icon}"></i>
                                        </div>
                                        <span class="grocery-widget__store-name">${store.name}</span>
                                        <span class="grocery-widget__store-count">${items.length}</span>
                                    </div>
                                    <ul class="grocery-widget__store-items">
                                        ${items.slice(0, 3).map(item => `
                                            <li class="grocery-widget__store-item" data-item-id="${item.id}">
                                                <input type="checkbox" class="grocery-widget__checkbox" data-toggle-item="${item.id}" ${item.checked ? 'checked' : ''}>
                                                <span class="grocery-widget__item-text" data-item-name="${item.id}">${item.name}</span>
                                            </li>
                                        `).join('')}
                                        ${items.length > 3 ? `
                                            <li class="grocery-widget__store-more">+${items.length - 3} more</li>
                                        ` : ''}
                                    </ul>
                                </div>
                            `).join('')}

                            ${unassignedItems.length > 0 ? `
                                <div class="grocery-widget__store">
                                    <div class="grocery-widget__store-header">
                                        <div class="grocery-widget__store-icon" style="background: #f1f5f920; color: #64748B">
                                            <i data-lucide="inbox"></i>
                                        </div>
                                        <span class="grocery-widget__store-name">Other Items</span>
                                        <span class="grocery-widget__store-count">${unassignedItems.length}</span>
                                    </div>
                                    <ul class="grocery-widget__store-items">
                                        ${unassignedItems.slice(0, 3).map(item => `
                                            <li class="grocery-widget__store-item" data-item-id="${item.id}">
                                                <input type="checkbox" class="grocery-widget__checkbox" data-toggle-item="${item.id}" ${item.checked ? 'checked' : ''}>
                                                <span class="grocery-widget__item-text" data-item-name="${item.id}">${item.name}</span>
                                            </li>
                                        `).join('')}
                                        ${unassignedItems.length > 3 ? `
                                            <li class="grocery-widget__store-more">+${unassignedItems.length - 3} more</li>
                                        ` : ''}
                                    </ul>
                                </div>
                            ` : ''}
                        </div>
                    `}
                </div>
            </div>
        `;

        // Initialize icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Bind events
        container.querySelector('[data-action="open-grocery"]')?.addEventListener('click', () => {
            showGroceryListPage(memberId);
        });

        // Bind checkbox toggles
        container.querySelectorAll('[data-toggle-item]').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                const itemId = checkbox.dataset.toggleItem;
                toggleItemChecked(memberId, itemId);
                renderWidget(container, memberId); // Re-render widget
            });
        });

        // Bind inline editing
        container.querySelectorAll('[data-item-name]').forEach(span => {
            span.addEventListener('click', (e) => {
                const itemId = span.dataset.itemName;
                startInlineEdit(span, itemId, memberId, container);
            });
        });
    }

    /**
     * Start inline editing for an item name
     */
    function startInlineEdit(spanElement, itemId, memberId, container) {
        const data = getWidgetData(memberId);
        const item = data.items.find(i => i.id === itemId);
        if (!item) return;

        const currentName = item.name;

        // Create input element
        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentName;
        input.className = 'grocery-widget__item-input';

        // Replace span with input
        spanElement.style.display = 'none';
        spanElement.parentNode.insertBefore(input, spanElement.nextSibling);
        input.focus();
        input.select();

        // Save on blur or Enter
        const saveEdit = () => {
            const newName = input.value.trim();
            if (newName && newName !== currentName) {
                item.name = newName;
                saveWidgetData(memberId, data);
            }
            renderWidget(container, memberId);
        };

        input.addEventListener('blur', saveEdit);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveEdit();
            } else if (e.key === 'Escape') {
                renderWidget(container, memberId); // Cancel edit
            }
        });
    }

    /**
     * Show full grocery list page
     */
    function showGroceryListPage(memberId) {
        const main = document.getElementById('mainContent');
        if (!main) return;

        const member = Storage.getMember(memberId);
        renderGroceryPage(main, memberId, member);
    }

    /**
     * Render grocery page with all features
     */
    function renderGroceryPage(container, memberId, member) {
        const data = getWidgetData(memberId);
        const items = data.items || [];
        const stores = getStores(memberId);
        const pantryItems = data.pantry || [];

        // Group items by category
        const groupedItems = groupByCategory(items);
        const uncheckedItems = items.filter(i => !i.checked);
        const checkedItems = items.filter(i => i.checked);

        // Get category counts for stats
        const categoryCount = Object.keys(groupedItems).filter(cat =>
            groupedItems[cat].some(i => !i.checked)
        ).length;

        // Calculate progress
        const progress = items.length > 0 ? Math.round((checkedItems.length / items.length) * 100) : 0;

        // Get smart suggestions
        const suggestions = getSmartSuggestions(memberId);

        container.innerHTML = `
            <div class="grocery-page">
                <!-- Colorful Hero Header -->
                <div class="grocery-page__hero">
                    <div class="grocery-page__hero-bg">
                        <div class="grocery-hero-shape grocery-hero-shape--1"></div>
                        <div class="grocery-hero-shape grocery-hero-shape--2"></div>
                        <div class="grocery-hero-shape grocery-hero-shape--3"></div>
                        <div class="grocery-hero-shape grocery-hero-shape--4"></div>
                    </div>
                    <button class="btn btn--ghost grocery-page__back" id="backToMemberBtn">
                        <i data-lucide="arrow-left"></i>
                        Back to ${member?.name || 'Dashboard'}
                    </button>
                    <div class="grocery-page__hero-content">
                        <h1 class="grocery-page__hero-title">
                            <i data-lucide="shopping-cart"></i>
                            Grocery List
                        </h1>
                        <p class="grocery-page__hero-subtitle">Smart shopping made easy</p>
                        <div class="grocery-page__hero-stats">
                            <div class="grocery-hero-stat">
                                <span class="grocery-hero-stat__value">${uncheckedItems.length}</span>
                                <span class="grocery-hero-stat__label">To Buy</span>
                            </div>
                            <div class="grocery-hero-stat">
                                <span class="grocery-hero-stat__value">${categoryCount}</span>
                                <span class="grocery-hero-stat__label">Categories</span>
                            </div>
                            <div class="grocery-hero-stat">
                                <span class="grocery-hero-stat__value">${pantryItems.length}</span>
                                <span class="grocery-hero-stat__label">In Pantry</span>
                            </div>
                        </div>
                        ${items.length > 0 ? `
                            <div class="grocery-page__hero-progress">
                                <div class="grocery-hero-progress__bar">
                                    <div class="grocery-hero-progress__fill ${progress === 100 ? 'grocery-hero-progress__fill--complete' : ''}" style="width: ${progress}%"></div>
                                </div>
                                <span class="grocery-hero-progress__text">${progress}% complete</span>
                            </div>
                        ` : ''}
                    </div>
                </div>

                <!-- Action Toolbar -->
                <div class="grocery-page__toolbar">
                    <button class="btn btn--primary" id="generateFromMealsBtn" title="Generate from meal plan">
                        <i data-lucide="calendar"></i>
                        From Meals
                    </button>
                    <button class="btn btn--secondary" id="manageStoresBtn" title="Manage stores">
                        <i data-lucide="store"></i>
                        Stores
                    </button>
                    <button class="btn btn--secondary" id="viewPantryBtn" title="View pantry">
                        <i data-lucide="package-check"></i>
                        Pantry
                    </button>
                    <button class="btn btn--secondary" id="shareListBtn" title="Share list">
                        <i data-lucide="share-2"></i>
                        Share
                    </button>
                    <button class="btn btn--ghost" id="clearCheckedBtn" ${checkedItems.length === 0 ? 'disabled' : ''}>
                        <i data-lucide="trash-2"></i>
                        Clear Done
                    </button>
                </div>

                <div class="grocery-page__content">
                    <!-- Add Items Section -->
                    <div class="grocery-page__add-section">
                        <div class="grocery-add-form">
                            <input type="text"
                                   class="form-input grocery-add-form__input"
                                   id="newItemInput"
                                   placeholder="Add item (e.g., 2 lbs chicken, milk x3)..."
                                   autocomplete="off">
                            <button class="btn btn--primary" id="addItemBtn">
                                <i data-lucide="plus"></i>
                            </button>
                        </div>

                        <!-- Smart Suggestions -->
                        <div class="grocery-suggestions">
                            <span class="grocery-suggestions__label">
                                <i data-lucide="sparkles"></i>
                                Suggested:
                            </span>
                            <div class="grocery-suggestions__list">
                                ${suggestions.map(item => {
                                    const inPantry = isInPantry(memberId, item);
                                    return `
                                        <button class="grocery-suggestion ${inPantry ? 'grocery-suggestion--in-pantry' : ''}"
                                                data-quick-add="${item}"
                                                title="${inPantry ? 'In pantry' : 'Click to add'}">
                                            ${item}
                                            ${inPantry ? '<i data-lucide="package-check"></i>' : ''}
                                        </button>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    </div>

                    <!-- Grocery List -->
                    <div class="grocery-page__list" id="groceryList">
                        ${uncheckedItems.length === 0 && checkedItems.length === 0 ? `
                            <div class="grocery-empty">
                                <div class="grocery-empty__illustration">
                                    <div class="grocery-empty__icon">
                                        <i data-lucide="shopping-bag"></i>
                                    </div>
                                    <div class="grocery-empty__shapes">
                                        <span class="grocery-empty__shape"></span>
                                        <span class="grocery-empty__shape"></span>
                                        <span class="grocery-empty__shape"></span>
                                    </div>
                                </div>
                                <h3>Your grocery list is empty</h3>
                                <p>Add items above or generate from your meal plan</p>
                                <button class="btn btn--primary" id="emptyGenerateBtn">
                                    <i data-lucide="calendar"></i>
                                    Generate from Meal Plan
                                </button>
                            </div>
                        ` : `
                            ${renderStoreGroupedList(memberId, uncheckedItems, stores)}

                            ${checkedItems.length > 0 ? `
                                <div class="grocery-checked-section">
                                    <button class="grocery-checked-toggle" id="toggleCheckedBtn">
                                        <i data-lucide="chevron-down"></i>
                                        <span>Checked off (${checkedItems.length})</span>
                                    </button>
                                    <div class="grocery-checked-list" id="checkedItemsList">
                                        ${checkedItems.map(item => {
                                            const cat = CATEGORIES.find(c => c.id === item.category) || CATEGORIES.find(c => c.id === 'other');
                                            return renderGroceryItem(item, memberId, cat, true);
                                        }).join('')}
                                    </div>
                                </div>
                            ` : ''}
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
        bindGroceryPageEvents(container, memberId, member);

        // Initialize swipe handlers
        initSwipeHandlers(container, memberId, member);
    }

    /**
     * Render a single grocery item with quantity controls
     */
    function renderGroceryItem(item, memberId, categoryInfo, isChecked = false) {
        const inPantry = isInPantry(memberId, item.name);
        const convertedQty = item.quantity ? convertUnit(item.quantity) : null;

        return `
            <div class="grocery-item ${isChecked ? 'grocery-item--checked' : ''}"
                 data-item-id="${item.id}"
                 style="--item-color: ${categoryInfo.color}">
                <div class="grocery-item__swipe-actions grocery-item__swipe-actions--left">
                    <button class="grocery-swipe-action grocery-swipe-action--check" data-swipe-check="${item.id}">
                        <i data-lucide="check"></i>
                    </button>
                </div>
                <div class="grocery-item__main">
                    <button class="grocery-item__check" data-toggle-item="${item.id}" data-member-id="${memberId}">
                        <i data-lucide="${item.checked ? 'check-square' : 'square'}"></i>
                    </button>
                    <div class="grocery-item__content">
                        <span class="grocery-item__name">${item.name}</span>
                        ${inPantry ? '<span class="grocery-item__pantry-badge" title="In pantry"><i data-lucide="package-check"></i></span>' : ''}
                        ${item.note ? `<span class="grocery-item__note">${item.note}</span>` : ''}
                    </div>
                    ${item.quantity ? `
                        <div class="grocery-item__quantity-controls">
                            <button class="grocery-qty-btn grocery-qty-btn--minus" data-qty-minus="${item.id}" title="Decrease">
                                <i data-lucide="minus"></i>
                            </button>
                            <span class="grocery-item__quantity" ${convertedQty ? `title="≈ ${convertedQty}"` : ''}>${item.quantity}</span>
                            <button class="grocery-qty-btn grocery-qty-btn--plus" data-qty-plus="${item.id}" title="Increase">
                                <i data-lucide="plus"></i>
                            </button>
                        </div>
                    ` : ''}
                    <div class="grocery-item__actions">
                        <button class="btn btn--icon btn--ghost btn--sm" data-pantry-toggle="${item.id}" title="${inPantry ? 'Remove from pantry' : 'Add to pantry'}">
                            <i data-lucide="${inPantry ? 'package-minus' : 'package-plus'}"></i>
                        </button>
                        <button class="btn btn--icon btn--ghost btn--sm" data-edit-item="${item.id}" data-member-id="${memberId}">
                            <i data-lucide="edit-2"></i>
                        </button>
                        <button class="btn btn--icon btn--ghost btn--sm grocery-item__delete" data-delete-item="${item.id}" data-member-id="${memberId}">
                            <i data-lucide="x"></i>
                        </button>
                    </div>
                </div>
                <div class="grocery-item__swipe-actions grocery-item__swipe-actions--right">
                    <button class="grocery-swipe-action grocery-swipe-action--delete" data-swipe-delete="${item.id}">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Initialize swipe handlers for mobile
     */
    function initSwipeHandlers(container, memberId, member) {
        const items = container.querySelectorAll('.grocery-item');

        items.forEach(item => {
            let startX = 0;
            let currentX = 0;
            let isDragging = false;
            const mainEl = item.querySelector('.grocery-item__main');

            const handleStart = (e) => {
                // Don't initiate swipe if clicking on action buttons or quantity controls
                const target = e.target;
                if (target.closest('.grocery-item__actions') ||
                    target.closest('.grocery-qty-btn') ||
                    target.closest('.grocery-item__check') ||
                    target.closest('button')) {
                    return;
                }

                startX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
                currentX = startX; // Initialize currentX to startX to prevent false triggers
                isDragging = true;
                item.classList.add('grocery-item--dragging');
            };

            const handleMove = (e) => {
                if (!isDragging) return;
                currentX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
                const diff = currentX - startX;
                const maxSwipe = 80;
                const clampedDiff = Math.max(-maxSwipe, Math.min(maxSwipe, diff));

                if (mainEl) {
                    mainEl.style.transform = `translateX(${clampedDiff}px)`;
                }

                // Show/hide swipe actions
                if (diff > 30) {
                    item.classList.add('grocery-item--swipe-left');
                    item.classList.remove('grocery-item--swipe-right');
                } else if (diff < -30) {
                    item.classList.add('grocery-item--swipe-right');
                    item.classList.remove('grocery-item--swipe-left');
                } else {
                    item.classList.remove('grocery-item--swipe-left', 'grocery-item--swipe-right');
                }
            };

            const handleEnd = () => {
                if (!isDragging) return;
                isDragging = false;
                item.classList.remove('grocery-item--dragging');

                const diff = currentX - startX;
                const itemId = item.dataset.itemId;

                if (diff > 60) {
                    // Swipe right - check item
                    toggleItemChecked(memberId, itemId);
                    addToPurchaseHistory(memberId, item.querySelector('.grocery-item__name')?.textContent);
                    renderGroceryPage(container, memberId, member);
                } else if (diff < -60) {
                    // Swipe left - delete item
                    deleteItem(memberId, itemId);
                    renderGroceryPage(container, memberId, member);
                } else {
                    // Reset position
                    if (mainEl) {
                        mainEl.style.transform = '';
                    }
                    item.classList.remove('grocery-item--swipe-left', 'grocery-item--swipe-right');
                }
            };

            // Touch events
            item.addEventListener('touchstart', handleStart, { passive: true });
            item.addEventListener('touchmove', handleMove, { passive: true });
            item.addEventListener('touchend', handleEnd);

            // Mouse events (for desktop testing)
            item.addEventListener('mousedown', handleStart);
            item.addEventListener('mousemove', handleMove);
            item.addEventListener('mouseup', handleEnd);
            item.addEventListener('mouseleave', handleEnd);
        });
    }

    /**
     * Group items by category
     */
    function groupByCategory(items) {
        const grouped = {};

        // Initialize all categories
        CATEGORIES.forEach(cat => {
            grouped[cat.id] = [];
        });

        items.forEach(item => {
            const category = item.category || 'other';
            if (!grouped[category]) {
                grouped[category] = [];
            }
            grouped[category].push(item);
        });

        // Remove empty categories
        Object.keys(grouped).forEach(key => {
            if (grouped[key].length === 0) {
                delete grouped[key];
            }
        });

        return grouped;
    }

    /**
     * Group items by store, then by category
     * Items without store are returned separately for category-only grouping
     */
    function groupByStoreAndCategory(items) {
        const storeGroups = {};
        const unassignedItems = [];

        items.forEach(item => {
            if (!item.store) {
                unassignedItems.push(item);
            } else {
                if (!storeGroups[item.store]) {
                    storeGroups[item.store] = {};
                }

                const category = item.category || 'other';
                if (!storeGroups[item.store][category]) {
                    storeGroups[item.store][category] = [];
                }

                storeGroups[item.store][category].push(item);
            }
        });

        return {
            storeGroups,
            unassignedItems
        };
    }

    /**
     * Render items grouped by store (task-list style)
     */
    function renderStoreGroupedList(memberId, items, stores) {
        let html = '';

        // Render store sections (always show all stores, even if empty)
        stores.forEach(store => {
            const storeItems = items.filter(item => item.store === store.id);
            const totalItems = storeItems.length;

            html += `
                <div class="grocery-store" data-store-id="${store.id}">
                    <button class="grocery-store__header" data-toggle-store="${store.id}">
                        <div class="grocery-store__icon" style="background: ${store.color}20; color: ${store.color}">
                            <i data-lucide="${store.icon}"></i>
                        </div>
                        <span class="grocery-store__name">${store.name}</span>
                        <span class="grocery-store__count">${totalItems} item${totalItems !== 1 ? 's' : ''}</span>
                        <i data-lucide="${store.collapsed ? 'chevron-down' : 'chevron-up'}" class="grocery-store__toggle-icon"></i>
                    </button>

                    <div class="grocery-store__content" ${store.collapsed ? 'style="display: none;"' : ''}>
                        <!-- Inline input for adding items -->
                        <div class="grocery-store__input-wrapper">
                            <input
                                type="text"
                                class="grocery-store__input"
                                placeholder="Type item name and press Enter..."
                                data-store-input="${store.id}"
                            />
                        </div>

                        <!-- Simple checkbox list of items -->
                        ${totalItems > 0 ? `
                            <div class="grocery-store__items">
                                ${storeItems.map(item => `
                                    <div class="grocery-store-item" data-item-id="${item.id}">
                                        <label class="grocery-store-item__checkbox">
                                            <input
                                                type="checkbox"
                                                ${item.checked ? 'checked' : ''}
                                                data-toggle-item="${item.id}"
                                            />
                                            <span class="grocery-store-item__name ${item.checked ? 'grocery-store-item__name--checked' : ''}">${item.name}</span>
                                        </label>
                                        <div class="grocery-store-item__actions">
                                            <button class="btn btn--icon btn--ghost btn--sm" data-edit-item="${item.id}" title="Edit details">
                                                <i data-lucide="edit-2"></i>
                                            </button>
                                            <button class="btn btn--icon btn--ghost btn--sm" data-delete-item="${item.id}" title="Delete">
                                                <i data-lucide="trash-2"></i>
                                            </button>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        });

        // Render unassigned items section
        const unassignedItems = items.filter(item => !item.store);

        if (unassignedItems.length > 0) {
            const groupedUnassigned = groupByCategory(unassignedItems);

            html += `
                <div class="grocery-unassigned-section">
                    <h3 class="grocery-unassigned-section__title">
                        <i data-lucide="package"></i>
                        Other Items
                    </h3>
                    ${Object.entries(groupedUnassigned).map(([category, categoryItems]) => {
                        const categoryInfo = CATEGORIES.find(c => c.id === category) || CATEGORIES.find(c => c.id === 'other');
                        return `
                            <div class="grocery-category" style="--category-color: ${categoryInfo.color}; --category-bg: ${categoryInfo.bgColor}">
                                <div class="grocery-category__header">
                                    <div class="grocery-category__icon" style="background: ${categoryInfo.bgColor}; color: ${categoryInfo.color}">
                                        <i data-lucide="${categoryInfo.icon}"></i>
                                    </div>
                                    <span class="grocery-category__name">${categoryInfo.name}</span>
                                    <span class="grocery-category__count">${categoryItems.length}</span>
                                </div>
                                <div class="grocery-category__items">
                                    ${categoryItems.map(item => renderGroceryItem(item, memberId, categoryInfo)).join('')}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        }

        return html;
    }

    /**
     * Bind grocery page events
     */
    function bindGroceryPageEvents(container, memberId, member) {
        // Back button
        document.getElementById('backToMemberBtn')?.addEventListener('click', () => {
            if (typeof State !== 'undefined') {
                State.emit('tabChanged', memberId);
            }
        });

        // Add item input
        const newItemInput = document.getElementById('newItemInput');
        newItemInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addItemFromInput(container, memberId, member, newItemInput);
            }
        });

        // Add item button
        document.getElementById('addItemBtn')?.addEventListener('click', () => {
            addItemFromInput(container, memberId, member, newItemInput);
        });

        // Smart suggestions / Quick adds
        container.querySelectorAll('[data-quick-add]').forEach(btn => {
            btn.addEventListener('click', () => {
                const itemName = btn.dataset.quickAdd;
                addItem(memberId, { name: itemName });
                renderGroceryPage(container, memberId, member);
                Toast.success(`Added ${itemName}`);
            });
        });

        // Generate from meals
        document.getElementById('generateFromMealsBtn')?.addEventListener('click', () => {
            showGenerateFromMealsModal(memberId, container, member);
        });

        document.getElementById('emptyGenerateBtn')?.addEventListener('click', () => {
            showGenerateFromMealsModal(memberId, container, member);
        });

        // View pantry
        document.getElementById('viewPantryBtn')?.addEventListener('click', () => {
            showPantryModal(memberId, container, member);
        });

        // Manage stores
        document.getElementById('manageStoresBtn')?.addEventListener('click', () => {
            showManageStoresModal(memberId, container, member);
        });

        // Toggle store collapsed
        container.querySelectorAll('[data-toggle-store]').forEach(btn => {
            btn.addEventListener('click', () => {
                const storeId = btn.dataset.toggleStore;
                toggleStoreCollapsed(memberId, storeId);
                renderGroceryPage(container, memberId, member);
            });
        });

        // Inline input for adding items to stores
        container.querySelectorAll('[data-store-input]').forEach(input => {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const storeId = input.dataset.storeInput;
                    const itemName = input.value.trim();
                    if (itemName) {
                        addItemToStore(memberId, storeId, itemName, container, member);
                        input.value = '';
                    }
                }
            });
        });

        // Share list
        document.getElementById('shareListBtn')?.addEventListener('click', () => {
            shareList(memberId);
        });

        // Clear checked
        document.getElementById('clearCheckedBtn')?.addEventListener('click', async () => {
            const confirmed = await Modal.confirm('Remove all checked items from the list?', 'Clear Checked Items');
            if (confirmed) {
                clearCheckedItems(memberId);
                renderGroceryPage(container, memberId, member);
                Toast.success('Checked items cleared');
            }
        });

        // Toggle checked section
        document.getElementById('toggleCheckedBtn')?.addEventListener('click', () => {
            const checkedList = document.getElementById('checkedItemsList');
            const toggleBtn = document.getElementById('toggleCheckedBtn');
            if (checkedList && toggleBtn) {
                checkedList.classList.toggle('grocery-checked-list--collapsed');
                const icon = toggleBtn.querySelector('i');
                if (icon) {
                    icon.setAttribute('data-lucide',
                        checkedList.classList.contains('grocery-checked-list--collapsed')
                            ? 'chevron-right'
                            : 'chevron-down'
                    );
                    lucide.createIcons();
                }
            }
        });

        // Toggle item checked
        container.querySelectorAll('[data-toggle-item]').forEach(btn => {
            btn.addEventListener('click', () => {
                const itemId = btn.dataset.toggleItem;
                const data = getWidgetData(memberId);
                const item = data.items.find(i => i.id === itemId);

                toggleItemChecked(memberId, itemId);

                // Add to purchase history when checking off
                if (item && !item.checked) {
                    addToPurchaseHistory(memberId, item.name);
                }

                renderGroceryPage(container, memberId, member);
            });
        });

        // Quantity controls
        container.querySelectorAll('[data-qty-plus]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                adjustQuantity(memberId, btn.dataset.qtyPlus, 1);
                renderGroceryPage(container, memberId, member);
            });
        });

        container.querySelectorAll('[data-qty-minus]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                adjustQuantity(memberId, btn.dataset.qtyMinus, -1);
                renderGroceryPage(container, memberId, member);
            });
        });

        // Pantry toggle
        container.querySelectorAll('[data-pantry-toggle]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const itemId = btn.dataset.pantryToggle;
                const data = getWidgetData(memberId);
                const item = data.items.find(i => i.id === itemId);

                if (item) {
                    const added = togglePantryItem(memberId, item.name, item.category);
                    Toast.success(added ? `${item.name} added to pantry` : `${item.name} removed from pantry`);
                    renderGroceryPage(container, memberId, member);
                }
            });
        });

        // Edit item
        container.querySelectorAll('[data-edit-item]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const itemId = btn.dataset.editItem;
                showEditItemModal(memberId, itemId, container, member);
            });
        });

        // Delete item
        container.querySelectorAll('[data-delete-item]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const itemId = btn.dataset.deleteItem;
                deleteItem(memberId, itemId);
                renderGroceryPage(container, memberId, member);
            });
        });
    }

    /**
     * Adjust quantity by increment
     */
    function adjustQuantity(memberId, itemId, increment) {
        const data = getWidgetData(memberId);
        const item = data.items.find(i => i.id === itemId);

        if (!item || !item.quantity) return;

        // Parse current quantity
        const match = item.quantity.match(/^([\d.]+)\s*(.*)$/);
        if (!match) return;

        let num = parseFloat(match[1]);
        const unit = match[2];

        num = Math.max(1, num + increment);
        item.quantity = unit ? `${num} ${unit}` : `${num}`;

        saveWidgetData(memberId, data);
    }

    /**
     * Share list functionality
     */
    function shareList(memberId) {
        const data = getWidgetData(memberId);
        const uncheckedItems = data.items.filter(i => !i.checked);

        if (uncheckedItems.length === 0) {
            Toast.info('No items to share');
            return;
        }

        // Group by category for nice formatting
        const grouped = groupByCategory(uncheckedItems);

        let text = '🛒 Grocery List\n\n';

        Object.entries(grouped).forEach(([categoryId, items]) => {
            const cat = CATEGORIES.find(c => c.id === categoryId);
            if (cat && items.length > 0) {
                text += `📦 ${cat.name}\n`;
                items.forEach(item => {
                    text += `  ☐ ${item.name}${item.quantity ? ` (${item.quantity})` : ''}\n`;
                });
                text += '\n';
            }
        });

        text += `\nTotal: ${uncheckedItems.length} items`;

        // Try native share API first
        if (navigator.share) {
            navigator.share({
                title: 'Grocery List',
                text: text
            }).catch(() => {
                // Fall back to copy
                copyToClipboard(text);
            });
        } else {
            copyToClipboard(text);
        }
    }

    /**
     * Copy text to clipboard
     */
    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            Toast.success('List copied to clipboard!');
        }).catch(() => {
            // Fallback
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            Toast.success('List copied to clipboard!');
        });
    }

    /**
     * Generate pantry modal HTML content
     */
    function generatePantryModalHTML(memberId) {
        const pantryItems = getPantryItems(memberId);
        const grouped = {};

        pantryItems.forEach(item => {
            const cat = item.category || 'other';
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(item);
        });

        return `
            <div class="pantry-modal">
                <p class="form-hint" style="margin-bottom: var(--space-4);">
                    Items in your pantry won't be suggested, helping you avoid duplicate purchases.
                </p>

                ${pantryItems.length === 0 ? `
                    <div class="pantry-empty">
                        <i data-lucide="package"></i>
                        <p>Your pantry is empty</p>
                        <span class="form-hint">Mark items as "in pantry" from your grocery list</span>
                    </div>
                ` : `
                    <div class="pantry-categories">
                        ${Object.entries(grouped).map(([categoryId, items]) => {
                            const cat = CATEGORIES.find(c => c.id === categoryId) || CATEGORIES.find(c => c.id === 'other');
                            return `
                                <div class="pantry-category" style="--cat-color: ${cat.color}; --cat-bg: ${cat.bgColor}">
                                    <div class="pantry-category__title">
                                        <i data-lucide="${cat.icon}" style="color: ${cat.color}"></i>
                                        <span>${cat.name}</span>
                                        <span class="pantry-category__count">${items.length}</span>
                                    </div>
                                    <div class="pantry-items">
                                        ${items.map(item => `
                                            <div class="pantry-item">
                                                <span class="pantry-item__name">${item.name}</span>
                                                <button class="pantry-item__remove" data-remove-pantry="${item.name}" title="Remove from pantry">
                                                    <i data-lucide="x"></i>
                                                </button>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                `}

                <hr style="margin: var(--space-4) 0; border: none; border-top: 1px solid var(--gray-200);">

                <div class="form-group" style="margin-bottom: 0;">
                    <label class="form-label">Add Item to Pantry</label>
                    <div class="form-row" style="gap: var(--space-2);">
                        <input type="text" class="form-input" id="addPantryInput" placeholder="e.g., Rice, Olive Oil, Salt...">
                        <button class="btn btn--primary" id="addPantryBtn">
                            <i data-lucide="plus"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Bind pantry modal events
     */
    function bindPantryModalEvents(memberId, pageContainer, member) {
        // Remove item from pantry
        document.querySelectorAll('[data-remove-pantry]').forEach(btn => {
            btn.addEventListener('click', () => {
                const itemName = btn.dataset.removePantry;
                togglePantryItem(memberId, itemName);
                Toast.success(`${itemName} removed from pantry`);
                refreshPantryModal(memberId, pageContainer, member);
            });
        });

        // Add item to pantry
        document.getElementById('addPantryBtn')?.addEventListener('click', () => {
            const input = document.getElementById('addPantryInput');
            const name = input?.value?.trim();
            if (name) {
                togglePantryItem(memberId, name);
                Toast.success(`${name} added to pantry`);
                refreshPantryModal(memberId, pageContainer, member);
            }
        });

        // Enter key to add
        document.getElementById('addPantryInput')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                document.getElementById('addPantryBtn')?.click();
            }
        });
    }

    /**
     * Refresh pantry modal content in-place
     */
    function refreshPantryModal(memberId, pageContainer, member) {
        const modalContent = document.getElementById('modalContent');
        if (!modalContent) return;

        modalContent.innerHTML = generatePantryModalHTML(memberId);

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        bindPantryModalEvents(memberId, pageContainer, member);
        document.getElementById('addPantryInput')?.focus();
    }

    /**
     * Show pantry modal
     */
    function showPantryModal(memberId, pageContainer, member) {
        Modal.open({
            title: 'Pantry Stock',
            content: generatePantryModalHTML(memberId),
            footer: '<button class="btn btn--primary" data-modal-done>Done</button>'
        });

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        bindPantryModalEvents(memberId, pageContainer, member);

        // Done button closes modal and refreshes page
        document.querySelector('[data-modal-done]')?.addEventListener('click', () => {
            Modal.close();
            renderGroceryPage(pageContainer, memberId, member);
        });
    }

    /**
     * Add item from input field
     */
    function addItemFromInput(container, memberId, member, input) {
        const value = input?.value?.trim();
        if (!value) return;

        // Parse quantity if included (e.g., "2 lbs chicken" or "milk x3")
        const parsed = parseItemInput(value);

        addItem(memberId, parsed);
        input.value = '';
        renderGroceryPage(container, memberId, member);
        Toast.success(`Added ${parsed.name}`);
    }

    /**
     * Parse item input for quantity
     */
    function parseItemInput(input) {
        let name = input;
        let quantity = null;

        // Pattern: "quantity unit name" (e.g., "2 lbs chicken")
        const qtyUnitMatch = input.match(/^(\d+(?:\.\d+)?)\s*(lbs?|oz|kg|g|cups?|tbsp|tsp|gallons?|liters?|ml|pcs?|dozen|pack)?\s+(.+)$/i);
        if (qtyUnitMatch) {
            quantity = qtyUnitMatch[2] ? `${qtyUnitMatch[1]} ${qtyUnitMatch[2]}` : qtyUnitMatch[1];
            name = qtyUnitMatch[3];
        } else {
            // Pattern: "name x3" or "name (3)"
            const suffixMatch = input.match(/^(.+?)\s*(?:x(\d+)|\((\d+)\))$/i);
            if (suffixMatch) {
                name = suffixMatch[1].trim();
                quantity = suffixMatch[2] || suffixMatch[3];
            }
        }

        // Auto-detect category based on item name
        const category = detectCategory(name);

        return { name, quantity, category };
    }

    /**
     * Auto-detect category based on item name
     */
    function detectCategory(name) {
        const lowerName = name.toLowerCase();

        const categoryKeywords = {
            produce: ['apple', 'banana', 'orange', 'lettuce', 'tomato', 'onion', 'potato', 'carrot', 'broccoli', 'spinach', 'avocado', 'lemon', 'lime', 'grape', 'berry', 'strawberry', 'blueberry', 'fruit', 'vegetable', 'salad', 'pepper', 'garlic', 'celery', 'cucumber'],
            dairy: ['milk', 'cheese', 'yogurt', 'butter', 'cream', 'egg', 'sour cream', 'cottage cheese', 'whipping cream', 'half and half'],
            meat: ['chicken', 'beef', 'pork', 'fish', 'salmon', 'shrimp', 'bacon', 'sausage', 'turkey', 'steak', 'ground', 'ham', 'deli', 'meat', 'seafood'],
            bakery: ['bread', 'bagel', 'muffin', 'croissant', 'roll', 'bun', 'tortilla', 'pita', 'cake', 'cookie', 'donut'],
            frozen: ['frozen', 'ice cream', 'pizza', 'fries', 'popsicle'],
            pantry: ['rice', 'pasta', 'cereal', 'oatmeal', 'flour', 'sugar', 'oil', 'vinegar', 'sauce', 'can', 'beans', 'soup', 'spice', 'salt', 'pepper', 'honey', 'peanut butter', 'jam', 'jelly'],
            beverages: ['water', 'juice', 'soda', 'coffee', 'tea', 'wine', 'beer', 'drink', 'sparkling'],
            household: ['paper', 'towel', 'soap', 'detergent', 'tissue', 'toilet', 'trash bag', 'sponge', 'cleaner', 'bleach']
        };

        for (const [category, keywords] of Object.entries(categoryKeywords)) {
            if (keywords.some(keyword => lowerName.includes(keyword))) {
                return category;
            }
        }

        return 'other';
    }

    /**
     * Add item to grocery list
     */
    function addItem(memberId, itemData) {
        const data = getWidgetData(memberId);

        // Check if item already exists (by name)
        const existingIndex = data.items.findIndex(
            i => i.name.toLowerCase() === itemData.name.toLowerCase() && !i.checked
        );

        if (existingIndex !== -1) {
            // Update quantity if it already exists
            if (itemData.quantity) {
                const existing = data.items[existingIndex];
                existing.quantity = existing.quantity
                    ? `${existing.quantity}, ${itemData.quantity}`
                    : itemData.quantity;
            }
        } else {
            const newItem = {
                id: `grc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name: itemData.name,
                quantity: itemData.quantity || null,
                category: itemData.category || 'other',
                store: itemData.store || null,
                note: itemData.note || null,
                checked: false,
                createdAt: new Date().toISOString()
            };
            data.items.unshift(newItem);
        }

        saveWidgetData(memberId, data);
        return data;
    }

    /**
     * Toggle item checked status
     */
    function toggleItemChecked(memberId, itemId) {
        const data = getWidgetData(memberId);
        const item = data.items.find(i => i.id === itemId);

        if (item) {
            item.checked = !item.checked;
            item.checkedAt = item.checked ? new Date().toISOString() : null;
            saveWidgetData(memberId, data);
        }
    }

    /**
     * Delete item from grocery list
     */
    function deleteItem(memberId, itemId) {
        const data = getWidgetData(memberId);
        data.items = data.items.filter(i => i.id !== itemId);
        saveWidgetData(memberId, data);
    }

    /**
     * Clear all checked items
     */
    function clearCheckedItems(memberId) {
        const data = getWidgetData(memberId);
        data.items = data.items.filter(i => !i.checked);
        saveWidgetData(memberId, data);
    }

    /**
     * Show edit item modal
     */
    function showEditItemModal(memberId, itemId, pageContainer, member) {
        const data = getWidgetData(memberId);
        const stores = getStores(memberId);
        const item = data.items.find(i => i.id === itemId);

        if (!item) return;

        const convertedQty = item.quantity ? convertUnit(item.quantity) : null;

        const content = `
            <form id="editGroceryItemForm">
                <div class="form-group">
                    <label class="form-label">Item Name</label>
                    <input type="text" class="form-input" id="editItemName" value="${item.name}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Quantity (optional)</label>
                    <div class="form-row">
                        <input type="text" class="form-input" id="editItemQuantity" value="${item.quantity || ''}" placeholder="e.g., 2 lbs, 1 dozen">
                        ${convertedQty ? `<span class="form-hint">≈ ${convertedQty}</span>` : ''}
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Category</label>
                    <select class="form-input form-select" id="editItemCategory">
                        ${CATEGORIES.map(cat => `
                            <option value="${cat.id}" ${item.category === cat.id ? 'selected' : ''}>${cat.name}</option>
                        `).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Store (optional)</label>
                    <select class="form-input form-select" id="editItemStore">
                        <option value="">No store selected</option>
                        ${stores.map(store => `
                            <option value="${store.id}" ${item.store === store.id ? 'selected' : ''}>
                                ${store.name}
                            </option>
                        `).join('')}
                    </select>
                    <span class="form-hint">Assign to a specific store for organized shopping</span>
                </div>
                <div class="form-group">
                    <label class="form-label">Note (optional)</label>
                    <input type="text" class="form-input" id="editItemNote" value="${item.note || ''}" placeholder="e.g., organic, brand preference">
                </div>
            </form>
        `;

        Modal.open({
            title: 'Edit Item',
            content,
            footer: Modal.createFooter('Cancel', 'Save')
        });

        Modal.bindFooterEvents(() => {
            const name = document.getElementById('editItemName')?.value?.trim();
            if (!name) {
                Toast.error('Item name is required');
                return false;
            }

            // Re-fetch data to ensure we have the latest
            const currentData = getWidgetData(memberId);
            const itemToUpdate = currentData.items.find(i => i.id === itemId);

            if (!itemToUpdate) {
                Toast.error('Item not found');
                return false;
            }

            itemToUpdate.name = name;
            itemToUpdate.quantity = document.getElementById('editItemQuantity')?.value?.trim() || null;
            itemToUpdate.category = document.getElementById('editItemCategory')?.value || 'other';
            itemToUpdate.store = document.getElementById('editItemStore')?.value || null;
            itemToUpdate.note = document.getElementById('editItemNote')?.value?.trim() || null;

            saveWidgetData(memberId, currentData);
            renderGroceryPage(pageContainer, memberId, member);
            Toast.success('Item updated');
            return true;
        });
    }

    /**
     * Add item to specific store from inline input
     */
    function addItemToStore(memberId, storeId, itemName, container, member) {
        if (!itemName || !itemName.trim()) return;

        // Parse quantity if included (e.g., "2 lbs chicken")
        const parsed = parseItemInput(itemName);

        const itemData = {
            name: parsed.name,
            quantity: parsed.quantity,
            category: parsed.category,
            store: storeId
        };

        addItem(memberId, itemData);
        renderGroceryPage(container, memberId, member);

        const data = getWidgetData(memberId);
        const store = data.stores.find(s => s.id === storeId);
        Toast.success(`Added ${parsed.name} to ${store?.name || 'store'}`);

        // Return focus to the input for this store
        setTimeout(() => {
            const input = container.querySelector(`[data-store-input="${storeId}"]`);
            if (input) {
                input.focus();
            }
        }, 0);
    }

    /**
     * Show store management modal
     */
    function showManageStoresModal(memberId, pageContainer, member) {
        const stores = getStores(memberId);

        const content = `
            <div class="manage-stores-modal">
                <p class="form-hint" style="margin-bottom: var(--space-4);">
                    Organize your grocery list by the stores you shop at. Drag to reorder.
                </p>

                ${stores.length === 0 ? `
                    <div class="stores-empty">
                        <i data-lucide="store"></i>
                        <p>No stores yet</p>
                        <span class="form-hint">Add your first store below</span>
                    </div>
                ` : `
                    <div class="stores-list" id="storesList">
                        ${stores.map((store, index) => `
                            <div class="store-item" data-store-id="${store.id}" draggable="true">
                                <div class="store-item__drag-handle">
                                    <i data-lucide="grip-vertical"></i>
                                </div>
                                <div class="store-item__icon" style="background: ${store.color}20; color: ${store.color}">
                                    <i data-lucide="${store.icon}"></i>
                                </div>
                                <span class="store-item__name">${store.name}</span>
                                <div class="store-item__actions">
                                    <button class="btn btn--icon btn--ghost btn--sm" data-edit-store="${store.id}" title="Edit store">
                                        <i data-lucide="edit-2"></i>
                                    </button>
                                    <button class="btn btn--icon btn--ghost btn--sm" data-delete-store="${store.id}" title="Delete store">
                                        <i data-lucide="trash-2"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `}

                <hr style="margin: var(--space-4) 0; border: none; border-top: 1px solid var(--gray-200);">

                <div class="form-group" style="margin-bottom: 0;">
                    <label class="form-label">Add New Store</label>
                    <div class="form-row" style="gap: var(--space-2);">
                        <input type="text" class="form-input" id="newStoreName" placeholder="e.g., Walmart, Safeway, CVS...">
                        <button class="btn btn--primary" id="addStoreBtn">
                            <i data-lucide="plus"></i>
                            Add
                        </button>
                    </div>
                </div>
            </div>
        `;

        Modal.open({
            title: 'Manage Stores',
            content,
            size: 'medium',
            footer: '<button class="btn btn--primary" data-modal-done>Done</button>'
        });

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        bindStoreManagementEvents(memberId, pageContainer, member);

        // Done button
        document.querySelector('[data-modal-done]')?.addEventListener('click', () => {
            Modal.close();
            renderGroceryPage(pageContainer, memberId, member);
        });
    }

    /**
     * Bind store management modal events
     */
    function bindStoreManagementEvents(memberId, pageContainer, member) {
        // Add store
        document.getElementById('addStoreBtn')?.addEventListener('click', () => {
            const input = document.getElementById('newStoreName');
            const name = input?.value?.trim();
            if (name) {
                addStore(memberId, name);
                Toast.success(`${name} added`);
                refreshStoreManagementModal(memberId, pageContainer, member);
            }
        });

        // Enter key to add
        document.getElementById('newStoreName')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                document.getElementById('addStoreBtn')?.click();
            }
        });

        // Edit store
        document.querySelectorAll('[data-edit-store]').forEach(btn => {
            btn.addEventListener('click', () => {
                const storeId = btn.dataset.editStore;
                showEditStoreModal(memberId, storeId, pageContainer, member);
            });
        });

        // Delete store
        document.querySelectorAll('[data-delete-store]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const storeId = btn.dataset.deleteStore;
                const data = getWidgetData(memberId);
                const store = data.stores.find(s => s.id === storeId);

                const confirmed = await Modal.confirm(
                    `Delete "${store?.name || 'this store'}"? Items assigned to this store will become unassigned.`,
                    'Delete Store'
                );

                if (confirmed) {
                    deleteStore(memberId, storeId);
                    Toast.success('Store deleted');
                    refreshStoreManagementModal(memberId, pageContainer, member);
                }
            });
        });

        // Drag and drop reordering
        initStoreDragAndDrop(memberId, pageContainer, member);
    }

    /**
     * Initialize drag and drop for store reordering
     */
    function initStoreDragAndDrop(memberId, pageContainer, member) {
        const storesList = document.getElementById('storesList');
        if (!storesList) return;

        let draggedElement = null;

        storesList.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('store-item')) {
                draggedElement = e.target;
                e.target.classList.add('dragging');
            }
        });

        storesList.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('store-item')) {
                e.target.classList.remove('dragging');

                // Save new order
                const storeIds = Array.from(storesList.querySelectorAll('.store-item'))
                    .map(el => el.dataset.storeId);
                reorderStores(memberId, storeIds);
            }
        });

        storesList.addEventListener('dragover', (e) => {
            e.preventDefault();
            const afterElement = getDragAfterElement(storesList, e.clientY);
            if (afterElement == null) {
                storesList.appendChild(draggedElement);
            } else {
                storesList.insertBefore(draggedElement, afterElement);
            }
        });
    }

    /**
     * Get element to insert dragged item after
     */
    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.store-item:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;

            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    /**
     * Refresh store management modal
     */
    function refreshStoreManagementModal(memberId, pageContainer, member) {
        // Update modal content immediately without closing
        const stores = getStores(memberId);

        const storesListHtml = stores.length === 0 ? `
            <div class="stores-empty">
                <i data-lucide="store"></i>
                <p>No stores yet</p>
                <span class="form-hint">Add your first store below</span>
            </div>
        ` : `
            <div class="stores-list" id="storesList">
                ${stores.map((store, index) => `
                    <div class="store-item" data-store-id="${store.id}" draggable="true">
                        <div class="store-item__drag-handle">
                            <i data-lucide="grip-vertical"></i>
                        </div>
                        <div class="store-item__icon" style="background: ${store.color}20; color: ${store.color}">
                            <i data-lucide="${store.icon}"></i>
                        </div>
                        <span class="store-item__name">${store.name}</span>
                        <div class="store-item__actions">
                            <button class="btn btn--icon btn--ghost btn--sm" data-edit-store="${store.id}" title="Edit store">
                                <i data-lucide="edit-2"></i>
                            </button>
                            <button class="btn btn--icon btn--ghost btn--sm" data-delete-store="${store.id}" title="Delete store">
                                <i data-lucide="trash-2"></i>
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        // Update the stores list section
        const modalContent = document.querySelector('.manage-stores-modal');
        if (modalContent) {
            const storesSection = modalContent.querySelector('.stores-empty, .stores-list');
            if (storesSection) {
                storesSection.outerHTML = storesListHtml;
            }

            // Clear input
            const input = document.getElementById('newStoreName');
            if (input) {
                input.value = '';
                input.focus();
            }

            // Re-initialize icons
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }

            // Re-bind events
            bindStoreManagementEvents(memberId, pageContainer, member);
        }
    }

    /**
     * Show edit store modal
     */
    function showEditStoreModal(memberId, storeId, pageContainer, member) {
        const data = getWidgetData(memberId);
        const store = data.stores.find(s => s.id === storeId);
        if (!store) return;

        const content = `
            <form id="editStoreForm">
                <div class="form-group">
                    <label class="form-label">Store Name</label>
                    <input type="text" class="form-input" id="editStoreName" value="${store.name}" required>
                </div>
            </form>
        `;

        Modal.open({
            title: 'Edit Store',
            content,
            footer: Modal.createFooter('Cancel', 'Save')
        });

        Modal.bindFooterEvents(() => {
            const name = document.getElementById('editStoreName')?.value?.trim();
            if (!name) {
                Toast.error('Store name is required');
                return false;
            }

            updateStore(memberId, storeId, { name });
            Toast.success('Store updated');
            refreshStoreManagementModal(memberId, pageContainer, member);
            return true;
        });
    }

    /**
     * Get recipe by name from saved recipes
     */
    function getRecipeByName(memberId, mealName) {
        if (typeof Recipes === 'undefined' || !Recipes.getRecipesForMealPlan) {
            return null;
        }
        const recipes = Recipes.getRecipesForMealPlan(memberId) || [];
        return recipes.find(r => r.name.toLowerCase() === mealName.toLowerCase());
    }

    /**
     * Normalize meal data - convert string to array for backwards compatibility
     */
    function normalizeMealData(meal) {
        if (!meal) return [];
        if (Array.isArray(meal)) return meal;
        return [meal];
    }

    /**
     * Show generate from meals modal
     */
    function showGenerateFromMealsModal(memberId, pageContainer, member) {
        const mealData = Storage.getWidgetData(memberId, 'meal-plan') || { weeklyPlan: {} };
        const weeklyPlan = mealData.weeklyPlan || {};

        // Get this week's meals
        const today = new Date();
        const weekStart = DateUtils.getWeekStart(today);
        const thisWeekMeals = [];

        for (let i = 0; i < 7; i++) {
            const date = DateUtils.addDays(weekStart, i);
            const dateStr = DateUtils.formatISO(date);
            const dayPlan = weeklyPlan[dateStr];

            if (dayPlan) {
                ['breakfast', 'lunch', 'dinner'].forEach(mealType => {
                    const mealItems = normalizeMealData(dayPlan[mealType]);
                    if (mealItems.length > 0) {
                        // Collect ingredients from all meal items
                        let allIngredients = [];
                        mealItems.forEach(mealName => {
                            const recipe = getRecipeByName(memberId, mealName);
                            if (recipe?.ingredients) {
                                allIngredients = allIngredients.concat(recipe.ingredients);
                            }
                        });

                        thisWeekMeals.push({
                            date: dateStr,
                            day: DateUtils.getDayName(date, true),
                            mealType,
                            meal: mealItems.join(' & '),
                            mealItems: mealItems,
                            ingredients: allIngredients
                        });
                    }
                });
            }
        }

        if (thisWeekMeals.length === 0) {
            Toast.info('No meals planned for this week. Plan some meals first!');
            return;
        }

        // Count meals with ingredients
        const mealsWithIngredients = thisWeekMeals.filter(m => m.ingredients.length > 0).length;

        const content = `
            <div class="generate-grocery-modal">
                <p class="generate-grocery-modal__intro">
                    Select meals to add their ingredients to your grocery list.
                    ${mealsWithIngredients > 0 ? `<strong>${mealsWithIngredients} meal(s)</strong> have recipes with ingredients.` : 'No matching recipes found - add ingredients manually.'}
                </p>
                <div class="generate-grocery-modal__meals">
                    ${thisWeekMeals.map((meal, index) => `
                        <label class="generate-meal-option ${meal.ingredients.length > 0 ? 'generate-meal-option--has-recipe' : ''}">
                            <input type="checkbox"
                                   class="generate-meal-checkbox"
                                   value="${index}"
                                   data-meal="${meal.meal}"
                                   data-ingredients="${encodeURIComponent(JSON.stringify(meal.ingredients))}">
                            <div class="generate-meal-option__content">
                                <div class="generate-meal-option__header">
                                    <span class="generate-meal-option__day">${meal.day}</span>
                                    <span class="generate-meal-option__type">${meal.mealType}</span>
                                    <span class="generate-meal-option__name">${meal.meal}</span>
                                    ${meal.ingredients.length > 0 ? `<span class="generate-meal-option__badge"><i data-lucide="book-open"></i> ${meal.ingredients.length} items</span>` : '<span class="generate-meal-option__badge generate-meal-option__badge--none">No recipe</span>'}
                                </div>
                                ${meal.ingredients.length > 0 ? `
                                    <div class="generate-meal-option__ingredients">
                                        ${meal.ingredients.slice(0, 4).map(ing => `<span class="generate-meal-option__ingredient">${ing}</span>`).join('')}
                                        ${meal.ingredients.length > 4 ? `<span class="generate-meal-option__more">+${meal.ingredients.length - 4} more</span>` : ''}
                                    </div>
                                ` : ''}
                            </div>
                        </label>
                    `).join('')}
                </div>
                <div class="form-group" style="margin-top: var(--space-4);">
                    <label class="form-label">Additional items (one per line)</label>
                    <textarea class="form-input" id="additionalItemsText" rows="3" placeholder="Add any extra items not in recipes..."></textarea>
                </div>
            </div>
        `;

        Modal.open({
            title: 'Add from Meal Plan',
            content,
            size: 'large',
            footer: Modal.createFooter('Cancel', 'Add to Grocery List')
        });

        lucide.createIcons();

        Modal.bindFooterEvents(() => {
            const checkboxes = document.querySelectorAll('.generate-meal-checkbox:checked');
            let addedCount = 0;

            // Add ingredients from selected meals
            checkboxes.forEach(cb => {
                try {
                    const ingredients = JSON.parse(decodeURIComponent(cb.dataset.ingredients || '[]'));
                    ingredients.forEach(ing => {
                        const parsed = parseItemInput(ing);
                        addItem(memberId, parsed);
                        addedCount++;
                    });
                } catch (e) {
                    console.error('Error parsing ingredients:', e);
                }
            });

            // Add additional items
            const additionalText = document.getElementById('additionalItemsText')?.value || '';
            const additionalLines = additionalText.split('\n')
                .map(line => line.trim())
                .filter(line => line);

            additionalLines.forEach(line => {
                const parsed = parseItemInput(line);
                addItem(memberId, parsed);
                addedCount++;
            });

            if (addedCount === 0) {
                Toast.warning('No items to add. Select meals with recipes or add items manually.');
                return false;
            }

            renderGroceryPage(pageContainer, memberId, member);
            Toast.success(`Added ${addedCount} items to grocery list`);
            return true;
        });
    }

    /**
     * Open grocery list from meal plan widget
     */
    function openFromMealPlan(memberId) {
        showGroceryListPage(memberId);
    }

    /**
     * Check if grocery widget has items
     */
    function hasItems(memberId) {
        const data = getWidgetData(memberId);
        return data.items.length > 0;
    }

    /**
     * Get item count
     */
    function getItemCount(memberId) {
        const data = getWidgetData(memberId);
        const unchecked = data.items.filter(i => !i.checked).length;
        const total = data.items.length;
        return { unchecked, total };
    }

    // Public API
    return {
        init,
        renderWidget,
        showGroceryListPage,
        openFromMealPlan,
        addItem,
        hasItems,
        getItemCount,
        detectCategory,
        CATEGORIES,
        getPantryItems,
        togglePantryItem,
        isInPantry,
        // Store management
        getStores,
        addStore,
        updateStore,
        deleteStore,
        reorderStores
    };
})();
