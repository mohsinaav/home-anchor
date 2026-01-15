/**
 * Shopping List Feature
 * Handles shopping list management with manual entry and auto-generation from meal plans
 * Enhanced with: smart suggestions, pantry tracking, unit conversion, share list
 */

const Grocery = (function() {
    // Session cache for store collapsed states (resets on page load)
    const sessionStoreStates = {};

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
        { id: 'target', name: 'Target', icon: 'shopping-bag', color: '#CC0000', sortOrder: 1, collapsed: true },
        { id: 'costco', name: 'Costco', icon: 'warehouse', color: '#0061B4', sortOrder: 2, collapsed: true },
        { id: 'trader-joes', name: "Trader Joe's", icon: 'leaf', color: '#D50032', sortOrder: 3, collapsed: true },
        { id: 'whole-foods', name: 'Whole Foods', icon: 'sprout', color: '#00A862', sortOrder: 4, collapsed: true }
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

    // Default pantry items - pre-categorized for easy setup
    const DEFAULT_PANTRY_ITEMS = {
        produce: [
            'Garlic', 'Ginger', 'Lemons', 'Limes', 'Potatoes', 'Onions', 'Shallots'
        ],
        dairy: [
            'Butter', 'Milk', 'Eggs', 'Cheese', 'Yogurt', 'Cream Cheese', 'Sour Cream'
        ],
        meat: [
            'Chicken Breast', 'Ground Beef', 'Bacon'
        ],
        bakery: [
            'Bread', 'Tortillas', 'Pita Bread'
        ],
        frozen: [
            'Frozen Vegetables', 'Ice Cream', 'Frozen Fruit'
        ],
        pantry: [
            'Rice', 'Pasta', 'Flour', 'Sugar', 'Brown Sugar', 'Salt', 'Black Pepper',
            'Olive Oil', 'Vegetable Oil', 'Vinegar', 'Soy Sauce', 'Honey',
            'Canned Tomatoes', 'Tomato Paste', 'Chicken Broth', 'Beans',
            'Oats', 'Cereal', 'Peanut Butter', 'Jam', 'Nuts', 'Dried Herbs',
            'Baking Powder', 'Baking Soda', 'Vanilla Extract', 'Cornstarch'
        ],
        beverages: [
            'Coffee', 'Tea', 'Juice'
        ],
        household: [
            'Dish Soap', 'Paper Towels', 'Trash Bags', 'Aluminum Foil', 'Plastic Wrap'
        ]
    };

    /**
     * Get widget data with defaults
     */
    function getWidgetData(memberId) {
        const data = Storage.getWidgetData(memberId, 'grocery') || {};

        // Initialize stores with defaults if needed
        let stores = data.stores || DEFAULT_STORES.map(s => ({...s}));

        // Initialize session cache for this member if not exists
        if (!sessionStoreStates[memberId]) {
            // First time in session: set default collapsed state
            sessionStoreStates[memberId] = {};
            const sortedStores = [...stores].sort((a, b) => a.sortOrder - b.sortOrder);
            const firstStoreId = sortedStores[0]?.id;

            stores.forEach(store => {
                sessionStoreStates[memberId][store.id] = store.id !== firstStoreId;
            });
        }

        // Apply session collapsed states to stores
        stores = stores.map(store => ({
            ...store,
            collapsed: sessionStoreStates[memberId][store.id] !== undefined
                ? sessionStoreStates[memberId][store.id]
                : true
        }));

        return {
            items: data.items || [],
            stores: stores,
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
     * Filters out items already in pantry or shopping list
     */
    function getSmartSuggestions(memberId) {
        const data = getWidgetData(memberId);
        const history = data.purchaseHistory || [];
        const currentItems = data.items.map(i => i.name.toLowerCase());
        const pantryItems = (data.pantry || []).map(p => p.name.toLowerCase());

        // Count purchase frequency
        const frequency = {};
        history.forEach(item => {
            const name = item.name.toLowerCase();
            frequency[name] = (frequency[name] || 0) + 1;
        });

        // Sort by frequency and filter out items already in list OR in pantry
        const suggestions = Object.entries(frequency)
            .filter(([name]) => !currentItems.includes(name) && !pantryItems.includes(name))
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(([name]) => {
                // Capitalize first letter
                return name.charAt(0).toUpperCase() + name.slice(1);
            });

        // If not enough suggestions, add from default quick adds (also filtering pantry)
        if (suggestions.length < 8) {
            const remaining = QUICK_ADDS.filter(item =>
                !currentItems.includes(item.toLowerCase()) &&
                !pantryItems.includes(item.toLowerCase()) &&
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
        // Toggle in session cache only (doesn't persist to storage)
        // State will reset when user leaves the grocery list page
        if (sessionStoreStates[memberId] && sessionStoreStates[memberId][storeId] !== undefined) {
            sessionStoreStates[memberId][storeId] = !sessionStoreStates[memberId][storeId];
        }
    }

    /**
     * Reset store collapsed states for a member
     * Called when leaving the grocery list page
     */
    function resetStoreStates(memberId) {
        if (sessionStoreStates[memberId]) {
            delete sessionStoreStates[memberId];
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
                    <div class="grocery-widget__stores">
                        ${stores.map(store => {
                            const storeItems = storeGroups[store.id]?.items || [];
                            return `
                            <div class="grocery-widget__store ${storeItems.length === 0 ? 'grocery-widget__store--empty' : ''}" data-store-section="${store.id}">
                                <div class="grocery-widget__store-header">
                                    <div class="grocery-widget__store-icon" style="background: ${store.color}20; color: ${store.color}">
                                        <i data-lucide="${store.icon}"></i>
                                    </div>
                                    <span class="grocery-widget__store-name">${store.name}</span>
                                    ${storeItems.length > 0 ? `<span class="grocery-widget__store-count">${storeItems.length}</span>` : ''}
                                    <button class="grocery-widget__quick-add-btn" data-quick-add-store="${store.id}" title="Add item to ${store.name}">
                                        <i data-lucide="plus"></i>
                                    </button>
                                </div>
                                <div class="grocery-widget__quick-add-row" data-quick-add-row="${store.id}" style="display: none;">
                                    <input type="text" class="grocery-widget__quick-add-input"
                                           data-quick-add-input="${store.id}"
                                           placeholder="Add item...">
                                    <button class="grocery-widget__quick-add-confirm" data-quick-add-confirm="${store.id}">
                                        <i data-lucide="check"></i>
                                    </button>
                                </div>
                                ${storeItems.length > 0 ? `
                                    <ul class="grocery-widget__store-items">
                                        ${storeItems.slice(0, 3).map(item => `
                                            <li class="grocery-widget__store-item" data-item-id="${item.id}">
                                                <label class="grocery-widget__checkbox-wrapper">
                                                    <input type="checkbox" class="grocery-widget__checkbox" data-toggle-item="${item.id}" ${item.checked ? 'checked' : ''}>
                                                </label>
                                                <div class="grocery-widget__item-content" data-item-name="${item.id}">
                                                    <span class="grocery-widget__item-text">${item.name}</span>
                                                </div>
                                            </li>
                                        `).join('')}
                                        ${storeItems.length > 3 ? `
                                            <li class="grocery-widget__store-more">
                                                <button class="grocery-widget__view-all-btn" data-view-full-list="${memberId}" data-store-id="${store.id}">
                                                    +${storeItems.length - 3} more
                                                </button>
                                            </li>
                                        ` : ''}
                                    </ul>
                                ` : ''}
                            </div>
                        `}).join('')}

                        ${unassignedItems.length > 0 ? `
                            <div class="grocery-widget__store" data-store-section="unassigned">
                                <div class="grocery-widget__store-header">
                                    <div class="grocery-widget__store-icon" style="background: #f1f5f920; color: #64748B">
                                        <i data-lucide="inbox"></i>
                                    </div>
                                    <span class="grocery-widget__store-name">Other Items</span>
                                    <span class="grocery-widget__store-count">${unassignedItems.length}</span>
                                    <button class="grocery-widget__quick-add-btn" data-quick-add-store="unassigned" title="Add item">
                                        <i data-lucide="plus"></i>
                                    </button>
                                </div>
                                <div class="grocery-widget__quick-add-row" data-quick-add-row="unassigned" style="display: none;">
                                    <input type="text" class="grocery-widget__quick-add-input"
                                           data-quick-add-input="unassigned"
                                           placeholder="Add item...">
                                    <button class="grocery-widget__quick-add-confirm" data-quick-add-confirm="unassigned">
                                        <i data-lucide="check"></i>
                                    </button>
                                </div>
                                <ul class="grocery-widget__store-items">
                                    ${unassignedItems.slice(0, 3).map(item => `
                                        <li class="grocery-widget__store-item" data-item-id="${item.id}">
                                            <label class="grocery-widget__checkbox-wrapper">
                                                <input type="checkbox" class="grocery-widget__checkbox" data-toggle-item="${item.id}" ${item.checked ? 'checked' : ''}>
                                            </label>
                                            <div class="grocery-widget__item-content" data-item-name="${item.id}">
                                                <span class="grocery-widget__item-text">${item.name}</span>
                                            </div>
                                        </li>
                                    `).join('')}
                                    ${unassignedItems.length > 3 ? `
                                        <li class="grocery-widget__store-more">
                                            <button class="grocery-widget__view-all-btn" data-view-full-list="${memberId}">
                                                +${unassignedItems.length - 3} more
                                            </button>
                                        </li>
                                    ` : ''}
                                </ul>
                            </div>
                        ` : ''}
                    </div>
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

        // Bind "+X more" buttons to open full list
        container.querySelectorAll('[data-view-full-list]').forEach(btn => {
            btn.addEventListener('click', () => {
                const storeId = btn.dataset.storeId || null;
                showGroceryListPage(memberId, storeId);
            });
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
        container.querySelectorAll('[data-item-name]').forEach(contentDiv => {
            contentDiv.addEventListener('click', (e) => {
                // Don't trigger if clicking on checkbox wrapper
                if (e.target.closest('.grocery-widget__checkbox-wrapper')) return;
                // Don't trigger if already editing
                if (contentDiv.querySelector('.grocery-widget__item-input')) return;

                const itemId = contentDiv.dataset.itemName;
                const textSpan = contentDiv.querySelector('.grocery-widget__item-text');
                startInlineEdit(textSpan, itemId, memberId, container);
            });
        });

        // Bind quick-add buttons for each store
        container.querySelectorAll('[data-quick-add-store]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const storeId = btn.dataset.quickAddStore;
                const row = container.querySelector(`[data-quick-add-row="${storeId}"]`);
                const input = container.querySelector(`[data-quick-add-input="${storeId}"]`);

                // Hide all other quick-add rows first
                container.querySelectorAll('.grocery-widget__quick-add-row').forEach(r => {
                    if (r !== row) r.style.display = 'none';
                });

                // Toggle this row
                if (row.style.display === 'none') {
                    row.style.display = 'flex';
                    input.focus();
                } else {
                    row.style.display = 'none';
                }
            });
        });

        // Bind quick-add input Enter key
        container.querySelectorAll('[data-quick-add-input]').forEach(input => {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const storeId = input.dataset.quickAddInput;
                    const itemName = input.value.trim();
                    if (itemName) {
                        addQuickItem(memberId, storeId, itemName, container, true);
                    }
                } else if (e.key === 'Escape') {
                    const row = input.closest('.grocery-widget__quick-add-row');
                    row.style.display = 'none';
                    input.value = '';
                }
            });
        });

        // Bind quick-add confirm buttons
        container.querySelectorAll('[data-quick-add-confirm]').forEach(btn => {
            btn.addEventListener('click', () => {
                const storeId = btn.dataset.quickAddConfirm;
                const input = container.querySelector(`[data-quick-add-input="${storeId}"]`);
                const itemName = input.value.trim();
                if (itemName) {
                    addQuickItem(memberId, storeId, itemName, container, true);
                }
            });
        });
    }

    /**
     * Add item quickly from widget
     */
    function addQuickItem(memberId, storeId, itemName, container, keepInputOpen = false) {
        if (!itemName) return;

        const data = getWidgetData(memberId);
        const newItem = {
            id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: itemName,
            checked: false,
            store: storeId === 'unassigned' ? null : storeId,
            category: 'other',
            addedAt: new Date().toISOString()
        };

        data.items.push(newItem);
        saveWidgetData(memberId, data);
        addToPurchaseHistory(memberId, itemName);

        // Re-render widget
        renderWidget(container, memberId);

        // Re-focus the input if requested
        if (keepInputOpen) {
            setTimeout(() => {
                const newRow = container.querySelector(`[data-quick-add-row="${storeId}"]`);
                const newInput = container.querySelector(`[data-quick-add-input="${storeId}"]`);
                if (newRow && newInput) {
                    newRow.style.display = 'flex';
                    newInput.focus();
                }
            }, 0);
        }
    }

    /**
     * Start inline editing for an item name
     */
    function startInlineEdit(spanElement, itemId, memberId, container) {
        const data = getWidgetData(memberId);
        const item = data.items.find(i => i.id === itemId);
        if (!item) return;

        const currentName = item.name;

        // Replace span content with input (like task list does)
        spanElement.innerHTML = `<input type="text" class="grocery-widget__item-input" value="${currentName}" />`;
        const input = spanElement.querySelector('input');
        input.focus();
        // Position cursor at end of text
        input.setSelectionRange(currentName.length, currentName.length);

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
                input.blur();
            } else if (e.key === 'Escape') {
                renderWidget(container, memberId); // Cancel edit
            }
        });
    }

    /**
     * Start inline editing for an item name in full list
     */
    function startInlineEditFullList(spanElement, itemId, memberId, container, member) {
        const data = getWidgetData(memberId);
        const item = data.items.find(i => i.id === itemId);
        if (!item) return;

        const currentName = item.name;

        // Replace span content with input (like task list does)
        spanElement.innerHTML = `<input type="text" class="grocery-store-item__edit-input" value="${currentName}" />`;
        const input = spanElement.querySelector('input');
        input.focus();
        // Position cursor at end of text
        input.setSelectionRange(currentName.length, currentName.length);

        // Save on blur or Enter
        const saveEdit = () => {
            const newName = input.value.trim();
            if (newName && newName !== currentName) {
                item.name = newName;
                saveWidgetData(memberId, data);
            }
            renderGroceryPage(container, memberId, member);
        };

        input.addEventListener('blur', saveEdit);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                input.blur();
            } else if (e.key === 'Escape') {
                renderGroceryPage(container, memberId, member); // Cancel edit
            }
        });
    }

    /**
     * Show full grocery list page
     */
    function showGroceryListPage(memberId, focusStoreId = null, activeTab = 'list') {
        const main = document.getElementById('mainContent');
        if (!main) return;

        const member = Storage.getMember(memberId);
        renderGroceryPage(main, memberId, member, activeTab);

        // If a store ID is provided, expand it and scroll to it
        if (focusStoreId) {
            // Small delay to ensure DOM is rendered
            setTimeout(() => {
                // Expand the store if it's collapsed
                const data = getWidgetData(memberId);
                const store = data.stores.find(s => s.id === focusStoreId);
                if (store && sessionStoreStates[memberId] && sessionStoreStates[memberId][focusStoreId]) {
                    // Store is collapsed, expand it
                    toggleStoreCollapsed(memberId, focusStoreId);
                    renderGroceryPage(main, memberId, member, activeTab);
                }

                // Scroll to the store
                const storeElement = document.querySelector(`[data-store-id="${focusStoreId}"]`);
                if (storeElement) {
                    storeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 100);
        }
    }

    /**
     * Render grocery page with all features and tabs
     */
    function renderGroceryPage(container, memberId, member, activeTab = 'list') {
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
                    <div class="grocery-page__hero-content">
                        <button class="btn btn--ghost grocery-page__back" id="backToMemberBtn">
                            <i data-lucide="arrow-left"></i>
                            Back
                        </button>
                        <div class="grocery-page__hero-text">
                            <h1 class="grocery-page__hero-title">
                                <i data-lucide="shopping-cart"></i>
                                Shopping List
                            </h1>
                            <p class="grocery-page__hero-subtitle">Smart shopping made easy</p>
                        </div>
                        <div class="grocery-page__hero-stats">
                            <div class="grocery-hero-stat">
                                <span class="grocery-hero-stat__value">${items.length}</span>
                                <span class="grocery-hero-stat__label">Total Items</span>
                            </div>
                            <div class="grocery-hero-stat">
                                <span class="grocery-hero-stat__value">${uncheckedItems.length}</span>
                                <span class="grocery-hero-stat__label">To Buy</span>
                            </div>
                            <div class="grocery-hero-stat">
                                <span class="grocery-hero-stat__value">${stores.length}</span>
                                <span class="grocery-hero-stat__label">Stores</span>
                            </div>
                            <div class="grocery-hero-stat">
                                <span class="grocery-hero-stat__value">${pantryItems.length}</span>
                                <span class="grocery-hero-stat__label">In Pantry</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Tab Navigation -->
                <div class="grocery-page__tabs">
                    <button class="grocery-tab ${activeTab === 'list' ? 'grocery-tab--active' : ''}" data-tab="list">
                        <i data-lucide="list"></i>
                        <span>List</span>
                        ${uncheckedItems.length > 0 ? `<span class="grocery-tab__count">${uncheckedItems.length}</span>` : ''}
                    </button>
                    <button class="grocery-tab ${activeTab === 'stores' ? 'grocery-tab--active' : ''}" data-tab="stores">
                        <i data-lucide="store"></i>
                        <span>Stores</span>
                    </button>
                    <button class="grocery-tab ${activeTab === 'pantry' ? 'grocery-tab--active' : ''}" data-tab="pantry">
                        <i data-lucide="package-check"></i>
                        <span>Pantry</span>
                        ${pantryItems.length > 0 ? `<span class="grocery-tab__count">${pantryItems.length}</span>` : ''}
                    </button>
                    <button class="grocery-tab ${activeTab === 'stats' ? 'grocery-tab--active' : ''}" data-tab="stats">
                        <i data-lucide="bar-chart-2"></i>
                        <span>Stats</span>
                    </button>
                </div>

                <!-- Action Bar -->
                <div class="grocery-page__actions">
                    ${activeTab === 'list' ? `
                        <button class="btn btn--primary" id="generateFromMealsBtn">
                            <i data-lucide="calendar"></i>
                            From Meals
                        </button>
                        <button class="btn btn--secondary" id="shareListBtn" title="Share list">
                            <i data-lucide="share-2"></i>
                            Share
                        </button>
                        <button class="btn btn--ghost" id="clearCheckedBtn" ${checkedItems.length === 0 ? 'disabled' : ''}>
                            <i data-lucide="trash-2"></i>
                            Clear Done
                        </button>
                    ` : activeTab === 'stores' ? `
                        <button class="btn btn--primary" id="addStoreBtn">
                            <i data-lucide="plus"></i>
                            Add Store
                        </button>
                    ` : activeTab === 'pantry' ? `
                        <button class="btn btn--primary" id="addPantryItemBtn">
                            <i data-lucide="plus"></i>
                            Add to Pantry
                        </button>
                    ` : ''}
                </div>

                <!-- Tab Content -->
                <div class="grocery-page__content">
                    ${renderGroceryTabContent(activeTab, memberId, data, items, uncheckedItems, checkedItems, stores, pantryItems, groupedItems)}
                </div>
            </div>
        `;

        // Initialize icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Bind events
        bindGroceryPageEvents(container, memberId, member, activeTab);

        // Initialize swipe handlers for list tab
        if (activeTab === 'list') {
            initSwipeHandlers(container, memberId, member);
        }
    }

    /**
     * Render tab content based on active tab
     */
    function renderGroceryTabContent(activeTab, memberId, data, items, uncheckedItems, checkedItems, stores, pantryItems, groupedItems) {
        switch (activeTab) {
            case 'list':
                return renderGroceryListTab(memberId, uncheckedItems, checkedItems, stores);
            case 'stores':
                return renderStoresTab(memberId, stores, items);
            case 'pantry':
                return renderPantryTab(memberId, pantryItems);
            case 'stats':
                return renderGroceryStatsTab(memberId, data, items, checkedItems, stores, pantryItems);
            default:
                return renderGroceryListTab(memberId, uncheckedItems, checkedItems, stores);
        }
    }

    /**
     * Render List tab - Main shopping list
     */
    function renderGroceryListTab(memberId, uncheckedItems, checkedItems, stores) {
        const suggestions = getSmartSuggestions(memberId);

        return `
            <div class="grocery-list-tab">
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
                            <h3>Your shopping list is empty</h3>
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
        `;
    }

    /**
     * Render Stores tab - Manage shopping stores
     */
    function renderStoresTab(memberId, stores, items) {
        return `
            <div class="grocery-stores-tab">
                ${stores.length === 0 ? `
                    <div class="grocery-empty">
                        <div class="grocery-empty__icon">
                            <i data-lucide="store"></i>
                        </div>
                        <h3>No Stores Added</h3>
                        <p>Add your favorite stores to organize your shopping list</p>
                        <button class="btn btn--primary" id="addStoreEmptyBtn">
                            <i data-lucide="plus"></i>
                            Add Store
                        </button>
                    </div>
                ` : `
                    <div class="grocery-stores-list">
                        ${stores.map(store => {
                            const storeItems = items.filter(i => i.store === store.id && !i.checked);
                            return `
                                <div class="grocery-store-card" data-store-id="${store.id}">
                                    <div class="grocery-store-card__header">
                                        <div class="grocery-store-card__icon" style="background: ${store.color}20; color: ${store.color}">
                                            <i data-lucide="${store.icon}"></i>
                                        </div>
                                        <div class="grocery-store-card__info">
                                            <h3 class="grocery-store-card__name">${store.name}</h3>
                                            <span class="grocery-store-card__count">${storeItems.length} item${storeItems.length !== 1 ? 's' : ''}</span>
                                        </div>
                                        <div class="grocery-store-card__actions">
                                            <button class="btn btn--icon btn--ghost btn--sm" data-edit-store="${store.id}" title="Edit store">
                                                <i data-lucide="edit-2"></i>
                                            </button>
                                            <button class="btn btn--icon btn--ghost btn--sm" data-delete-store="${store.id}" title="Delete store">
                                                <i data-lucide="trash-2"></i>
                                            </button>
                                        </div>
                                    </div>
                                    ${storeItems.length > 0 ? `
                                        <div class="grocery-store-card__items">
                                            ${storeItems.slice(0, 5).map(item => `
                                                <span class="grocery-store-card__item">${item.name}</span>
                                            `).join('')}
                                            ${storeItems.length > 5 ? `<span class="grocery-store-card__more">+${storeItems.length - 5} more</span>` : ''}
                                        </div>
                                    ` : ''}
                                </div>
                            `;
                        }).join('')}
                    </div>
                `}
            </div>
        `;
    }

    /**
     * Render Pantry tab - Items in pantry
     */
    function renderPantryTab(memberId, pantryItems) {
        // Group pantry items by category
        const groupedPantry = {};
        pantryItems.forEach(item => {
            const cat = item.category || 'other';
            if (!groupedPantry[cat]) groupedPantry[cat] = [];
            groupedPantry[cat].push(item);
        });

        // Get pantry item names for checking defaults
        const pantryNames = pantryItems.map(p => p.name.toLowerCase());

        return `
            <div class="grocery-pantry-tab">
                ${pantryItems.length === 0 ? `
                    <div class="pantry-setup">
                        <div class="pantry-setup__header">
                            <div class="pantry-setup__icon">
                                <i data-lucide="package"></i>
                            </div>
                            <h3>Set Up Your Pantry</h3>
                            <p>Select items you have at home. This helps avoid buying duplicates!</p>
                        </div>
                        <div class="pantry-setup__categories">
                            ${CATEGORIES.filter(cat => cat.id !== 'other').map(cat => {
                                const items = DEFAULT_PANTRY_ITEMS[cat.id] || [];
                                return `
                                    <div class="pantry-setup__category">
                                        <div class="pantry-setup__category-header">
                                            <div class="pantry-setup__category-icon" style="background: ${cat.bgColor}; color: ${cat.color}">
                                                <i data-lucide="${cat.icon}"></i>
                                            </div>
                                            <span>${cat.name}</span>
                                            <input type="text" class="pantry-setup__custom-input"
                                                   data-category-input="${cat.id}"
                                                   placeholder="+ Add custom..."
                                                   style="margin-left: auto;">
                                        </div>
                                        <div class="pantry-setup__items">
                                            ${items.length > 0 ? items.map(item => `
                                                <button class="pantry-setup__item" data-setup-item="${item}" data-setup-category="${cat.id}">
                                                    <i data-lucide="plus"></i>
                                                    ${item}
                                                </button>
                                            `).join('') : `
                                                <span class="pantry-setup__empty-hint">Type above to add items</span>
                                            `}
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                        <div class="pantry-setup__footer">
                            <button class="btn btn--secondary" id="addCustomPantryBtn">
                                <i data-lucide="edit-3"></i>
                                Add Custom Item
                            </button>
                        </div>
                    </div>
                ` : `
                    <div class="grocery-pantry-header">
                        <div class="grocery-pantry-search">
                            <div class="grocery-pantry-search__wrapper">
                                <i data-lucide="search"></i>
                                <input type="text" id="pantrySearchInput" placeholder="Search pantry..." class="form-input">
                            </div>
                        </div>
                        <button class="btn btn--secondary btn--sm" id="addMorePantryBtn">
                            <i data-lucide="plus"></i>
                            Add More
                        </button>
                    </div>
                    <div class="grocery-pantry-list" id="pantryList">
                        ${Object.entries(groupedPantry).map(([catId, catItems]) => {
                            const cat = CATEGORIES.find(c => c.id === catId) || CATEGORIES.find(c => c.id === 'other');
                            return `
                                <div class="grocery-pantry-category">
                                    <div class="grocery-pantry-category__header">
                                        <div class="grocery-pantry-category__icon" style="background: ${cat.bgColor}; color: ${cat.color}">
                                            <i data-lucide="${cat.icon}"></i>
                                        </div>
                                        <span class="grocery-pantry-category__name">${cat.name}</span>
                                        <span class="grocery-pantry-category__count">${catItems.length}</span>
                                    </div>
                                    <div class="grocery-pantry-category__items">
                                        ${catItems.map(item => `
                                            <div class="grocery-pantry-item" data-pantry-item="${item.name}">
                                                <span class="grocery-pantry-item__name">${item.name}</span>
                                                <div class="grocery-pantry-item__actions">
                                                    <button class="btn btn--icon btn--ghost btn--sm" data-add-from-pantry="${item.name}" title="Add to shopping list">
                                                        <i data-lucide="shopping-cart"></i>
                                                    </button>
                                                    <button class="btn btn--icon btn--ghost btn--sm" data-remove-pantry="${item.name}" title="Remove from pantry">
                                                        <i data-lucide="x"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                `}
            </div>
        `;
    }

    /**
     * Render Stats tab - Shopping statistics
     */
    function renderGroceryStatsTab(memberId, data, items, checkedItems, stores, pantryItems) {
        const totalItems = items.length;
        const completedItems = checkedItems.length;
        const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
        const purchaseHistory = data.purchaseHistory || [];

        // Get most purchased items
        const frequency = {};
        purchaseHistory.forEach(item => {
            const name = item.name.toLowerCase();
            frequency[name] = (frequency[name] || 0) + 1;
        });
        const topItems = Object.entries(frequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, count]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), count }));

        // Category breakdown
        const categoryBreakdown = {};
        items.forEach(item => {
            const cat = item.category || 'other';
            if (!categoryBreakdown[cat]) categoryBreakdown[cat] = { total: 0, checked: 0 };
            categoryBreakdown[cat].total++;
            if (item.checked) categoryBreakdown[cat].checked++;
        });

        // Store breakdown
        const storeBreakdown = stores.map(store => ({
            ...store,
            itemCount: items.filter(i => i.store === store.id && !i.checked).length
        }));

        return `
            <div class="grocery-stats-tab">
                <!-- Overview Cards -->
                <div class="grocery-stats__overview">
                    <div class="grocery-stats__card">
                        <div class="grocery-stats__card-icon" style="background: #dbeafe; color: #3b82f6;">
                            <i data-lucide="shopping-cart"></i>
                        </div>
                        <div class="grocery-stats__card-content">
                            <span class="grocery-stats__card-value">${totalItems}</span>
                            <span class="grocery-stats__card-label">Total Items</span>
                        </div>
                    </div>
                    <div class="grocery-stats__card">
                        <div class="grocery-stats__card-icon" style="background: #dcfce7; color: #22c55e;">
                            <i data-lucide="check-circle"></i>
                        </div>
                        <div class="grocery-stats__card-content">
                            <span class="grocery-stats__card-value">${completedItems}</span>
                            <span class="grocery-stats__card-label">Checked Off</span>
                        </div>
                    </div>
                    <div class="grocery-stats__card">
                        <div class="grocery-stats__card-icon" style="background: #fef3c7; color: #f59e0b;">
                            <i data-lucide="percent"></i>
                        </div>
                        <div class="grocery-stats__card-content">
                            <span class="grocery-stats__card-value">${progress}%</span>
                            <span class="grocery-stats__card-label">Progress</span>
                        </div>
                    </div>
                    <div class="grocery-stats__card">
                        <div class="grocery-stats__card-icon" style="background: #f3e8ff; color: #8b5cf6;">
                            <i data-lucide="package"></i>
                        </div>
                        <div class="grocery-stats__card-content">
                            <span class="grocery-stats__card-value">${pantryItems.length}</span>
                            <span class="grocery-stats__card-label">In Pantry</span>
                        </div>
                    </div>
                </div>

                ${topItems.length > 0 ? `
                    <!-- Most Purchased -->
                    <div class="grocery-stats__section">
                        <h3 class="grocery-stats__section-title">
                            <i data-lucide="trending-up"></i>
                            Most Purchased
                        </h3>
                        <div class="grocery-stats__top-items">
                            ${topItems.map((item, idx) => `
                                <div class="grocery-stats__top-item">
                                    <span class="grocery-stats__top-rank">#${idx + 1}</span>
                                    <span class="grocery-stats__top-name">${item.name}</span>
                                    <span class="grocery-stats__top-count">${item.count}x</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                <!-- By Store -->
                ${storeBreakdown.some(s => s.itemCount > 0) ? `
                    <div class="grocery-stats__section">
                        <h3 class="grocery-stats__section-title">
                            <i data-lucide="store"></i>
                            Items by Store
                        </h3>
                        <div class="grocery-stats__stores">
                            ${storeBreakdown.filter(s => s.itemCount > 0).map(store => `
                                <div class="grocery-stats__store-bar">
                                    <div class="grocery-stats__store-header">
                                        <span class="grocery-stats__store-icon" style="color: ${store.color}">
                                            <i data-lucide="${store.icon}"></i>
                                        </span>
                                        <span class="grocery-stats__store-name">${store.name}</span>
                                        <span class="grocery-stats__store-count">${store.itemCount}</span>
                                    </div>
                                    <div class="grocery-stats__store-progress">
                                        <div class="grocery-stats__store-fill" style="width: ${Math.min(100, (store.itemCount / Math.max(...storeBreakdown.map(s => s.itemCount))) * 100)}%; background: ${store.color}"></div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                <!-- By Category -->
                ${Object.keys(categoryBreakdown).length > 0 ? `
                    <div class="grocery-stats__section">
                        <h3 class="grocery-stats__section-title">
                            <i data-lucide="pie-chart"></i>
                            By Category
                        </h3>
                        <div class="grocery-stats__categories">
                            ${Object.entries(categoryBreakdown).map(([catId, stats]) => {
                                const cat = CATEGORIES.find(c => c.id === catId) || CATEGORIES.find(c => c.id === 'other');
                                return `
                                    <div class="grocery-stats__category">
                                        <div class="grocery-stats__category-header">
                                            <span class="grocery-stats__category-icon" style="background: ${cat.bgColor}; color: ${cat.color}">
                                                <i data-lucide="${cat.icon}"></i>
                                            </span>
                                            <span class="grocery-stats__category-name">${cat.name}</span>
                                            <span class="grocery-stats__category-count">${stats.checked}/${stats.total}</span>
                                        </div>
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
                                ${storeItems.map(item => {
                                    const inPantry = isInPantry(memberId, item.name);
                                    return `
                                    <div class="grocery-store-item" data-item-id="${item.id}">
                                        <label class="grocery-store-item__checkbox-wrapper">
                                            <input
                                                type="checkbox"
                                                ${item.checked ? 'checked' : ''}
                                                data-toggle-item="${item.id}"
                                            />
                                        </label>
                                        <div class="grocery-store-item__content" data-item-inline-edit="${item.id}">
                                            <span class="grocery-store-item__name ${item.checked ? 'grocery-store-item__name--checked' : ''}">${item.name}</span>
                                            ${inPantry ? '<span class="grocery-store-item__pantry-badge" title="Already in pantry"><i data-lucide="package-check"></i></span>' : ''}
                                        </div>
                                        <div class="grocery-store-item__actions">
                                            <button class="btn btn--icon btn--ghost btn--sm" data-delete-item="${item.id}" title="Delete">
                                                <i data-lucide="trash-2"></i>
                                            </button>
                                        </div>
                                    </div>
                                `}).join('')}
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
    function bindGroceryPageEvents(container, memberId, member, activeTab = 'list') {
        // Back button
        document.getElementById('backToMemberBtn')?.addEventListener('click', () => {
            // Reset store collapsed states when leaving the page
            resetStoreStates(memberId);

            if (typeof State !== 'undefined') {
                State.emit('tabChanged', memberId);
            }
        });

        // Tab switching
        container.querySelectorAll('.grocery-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const newTab = tab.dataset.tab;
                renderGroceryPage(container, memberId, member, newTab);
            });
        });

        // Add item input (List tab)
        const newItemInput = document.getElementById('newItemInput');
        newItemInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addItemFromInput(container, memberId, member, newItemInput);
            }
        });

        // Add item button (List tab)
        document.getElementById('addItemBtn')?.addEventListener('click', () => {
            addItemFromInput(container, memberId, member, newItemInput);
        });

        // Smart suggestions / Quick adds (List tab)
        container.querySelectorAll('[data-quick-add]').forEach(btn => {
            btn.addEventListener('click', () => {
                const itemName = btn.dataset.quickAdd;
                addItem(memberId, { name: itemName });
                renderGroceryPage(container, memberId, member, activeTab);
                Toast.success(`Added ${itemName}`);
            });
        });

        // Generate from meals (List tab)
        document.getElementById('generateFromMealsBtn')?.addEventListener('click', () => {
            showGenerateFromMealsModal(memberId, container, member, activeTab);
        });

        document.getElementById('emptyGenerateBtn')?.addEventListener('click', () => {
            showGenerateFromMealsModal(memberId, container, member, activeTab);
        });

        // Add store button (Stores tab)
        document.getElementById('addStoreBtn')?.addEventListener('click', () => {
            showAddStoreModal(memberId, container, member, activeTab);
        });

        document.getElementById('addStoreEmptyBtn')?.addEventListener('click', () => {
            showAddStoreModal(memberId, container, member, activeTab);
        });

        // Edit store (Stores tab)
        container.querySelectorAll('[data-edit-store]').forEach(btn => {
            btn.addEventListener('click', () => {
                const storeId = btn.dataset.editStore;
                showEditStoreModal(memberId, storeId, container, member, activeTab);
            });
        });

        // Delete store (Stores tab)
        container.querySelectorAll('[data-delete-store]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const storeId = btn.dataset.deleteStore;
                const confirmed = await Modal.confirm('Delete this store? Items will be moved to unassigned.', 'Delete Store');
                if (confirmed) {
                    deleteStore(memberId, storeId);
                    renderGroceryPage(container, memberId, member, activeTab);
                    Toast.success('Store deleted');
                }
            });
        });

        // Add pantry item button (Pantry tab)
        document.getElementById('addPantryItemBtn')?.addEventListener('click', () => {
            showAddPantryItemModal(memberId, container, member, activeTab);
        });

        document.getElementById('addPantryEmptyBtn')?.addEventListener('click', () => {
            showAddPantryItemModal(memberId, container, member, activeTab);
        });

        // Custom item button in setup (Pantry tab)
        document.getElementById('addCustomPantryBtn')?.addEventListener('click', () => {
            showAddPantryItemModal(memberId, container, member, activeTab);
        });

        // Add More button when pantry has items (Pantry tab)
        document.getElementById('addMorePantryBtn')?.addEventListener('click', () => {
            showAddMorePantryModal(memberId, container, member, activeTab);
        });

        // Quick add from setup (Pantry tab)
        container.querySelectorAll('[data-setup-item]').forEach(btn => {
            btn.addEventListener('click', () => {
                const itemName = btn.dataset.setupItem;
                const category = btn.dataset.setupCategory;
                togglePantryItem(memberId, itemName, category);
                // Add visual feedback - mark as added
                btn.classList.add('pantry-setup__item--added');
                btn.innerHTML = `<i data-lucide="check"></i> ${itemName}`;
                if (typeof lucide !== 'undefined') lucide.createIcons();
                Toast.success(`Added ${itemName} to pantry`);
            });
        });

        // Inline custom input per category in setup (Pantry tab)
        container.querySelectorAll('[data-category-input]').forEach(input => {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const itemName = input.value.trim();
                    const category = input.dataset.categoryInput;
                    if (itemName) {
                        if (isInPantry(memberId, itemName)) {
                            Toast.info(`${itemName} is already in your pantry`);
                        } else {
                            togglePantryItem(memberId, itemName, category);
                            // Add as a button to the items list
                            const itemsContainer = input.closest('.pantry-setup__category').querySelector('.pantry-setup__items');
                            const emptyHint = itemsContainer.querySelector('.pantry-setup__empty-hint');
                            if (emptyHint) emptyHint.remove();

                            const newBtn = document.createElement('button');
                            newBtn.className = 'pantry-setup__item pantry-setup__item--added';
                            newBtn.innerHTML = `<i data-lucide="check"></i> ${itemName}`;
                            itemsContainer.appendChild(newBtn);
                            if (typeof lucide !== 'undefined') lucide.createIcons();

                            Toast.success(`Added ${itemName}`);
                            input.value = '';
                        }
                    }
                }
            });
        });

        // Add from pantry to shopping list (Pantry tab)
        container.querySelectorAll('[data-add-from-pantry]').forEach(btn => {
            btn.addEventListener('click', () => {
                const itemName = btn.dataset.addFromPantry;
                showStoreSelectionModal(memberId, itemName, container, member, activeTab);
            });
        });

        // Remove from pantry (Pantry tab)
        container.querySelectorAll('[data-remove-pantry]').forEach(btn => {
            btn.addEventListener('click', () => {
                const itemName = btn.dataset.removePantry;
                togglePantryItem(memberId, itemName);
                renderGroceryPage(container, memberId, member, activeTab);
                Toast.success(`Removed ${itemName} from pantry`);
            });
        });

        // Pantry search (Pantry tab)
        document.getElementById('pantrySearchInput')?.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            container.querySelectorAll('.grocery-pantry-item').forEach(item => {
                const name = item.dataset.pantryItem.toLowerCase();
                item.style.display = name.includes(query) ? '' : 'none';
            });
        });

        // Toggle store collapsed (List tab)
        container.querySelectorAll('[data-toggle-store]').forEach(btn => {
            btn.addEventListener('click', () => {
                const storeId = btn.dataset.toggleStore;
                toggleStoreCollapsed(memberId, storeId);
                renderGroceryPage(container, memberId, member, activeTab);
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

        // Inline editing for items in full list
        container.querySelectorAll('[data-item-inline-edit]').forEach(contentDiv => {
            contentDiv.addEventListener('click', (e) => {
                // Don't trigger if clicking on checkbox wrapper
                if (e.target.closest('.grocery-store-item__checkbox-wrapper')) return;
                // Don't trigger if already editing
                if (contentDiv.querySelector('.grocery-store-item__edit-input')) return;

                const itemId = contentDiv.dataset.itemInlineEdit;
                const textSpan = contentDiv.querySelector('.grocery-store-item__name');
                startInlineEditFullList(textSpan, itemId, memberId, container, member);
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
                renderGroceryPage(container, memberId, member, activeTab);
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

                const result = toggleItemChecked(memberId, itemId);

                // Add to purchase history when checking off
                if (item && !item.checked) {
                    addToPurchaseHistory(memberId, item.name);
                }

                renderGroceryPage(container, memberId, member, activeTab);

                // Show pantry prompt if item was checked off and not already in pantry
                if (result && result.shouldPromptPantry) {
                    showAddToPantryPrompt(memberId, result.name, result.category, container, member, activeTab);
                }
            });
        });

        // Quantity controls
        container.querySelectorAll('[data-qty-plus]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                adjustQuantity(memberId, btn.dataset.qtyPlus, 1);
                renderGroceryPage(container, memberId, member, activeTab);
            });
        });

        container.querySelectorAll('[data-qty-minus]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                adjustQuantity(memberId, btn.dataset.qtyMinus, -1);
                renderGroceryPage(container, memberId, member, activeTab);
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
                    renderGroceryPage(container, memberId, member, activeTab);
                }
            });
        });

        // Edit item
        container.querySelectorAll('[data-edit-item]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const itemId = btn.dataset.editItem;
                showEditItemModal(memberId, itemId, container, member, activeTab);
            });
        });

        // Delete item
        container.querySelectorAll('[data-delete-item]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const itemId = btn.dataset.deleteItem;
                deleteItem(memberId, itemId);
                renderGroceryPage(container, memberId, member, activeTab);
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
        const stores = getStores(memberId);
        const uncheckedItems = data.items.filter(i => !i.checked);

        if (uncheckedItems.length === 0) {
            Toast.info('No items to share');
            return;
        }

        let text = '🛒 Shopping List\n\n';

        // Group by stores
        stores.forEach(store => {
            const storeItems = uncheckedItems.filter(item => item.store === store.id);
            if (storeItems.length > 0) {
                text += `🏪 ${store.name}\n`;
                storeItems.forEach(item => {
                    text += `  ☐ ${item.name}${item.quantity ? ` (${item.quantity})` : ''}${item.note ? ` - ${item.note}` : ''}\n`;
                });
                text += '\n';
            }
        });

        // Add unassigned items
        const unassignedItems = uncheckedItems.filter(item => !item.store);
        if (unassignedItems.length > 0) {
            text += `📦 Other Items\n`;
            unassignedItems.forEach(item => {
                text += `  ☐ ${item.name}${item.quantity ? ` (${item.quantity})` : ''}${item.note ? ` - ${item.note}` : ''}\n`;
            });
            text += '\n';
        }

        text += `Total: ${uncheckedItems.length} items`;

        // Try native share API first
        if (navigator.share) {
            navigator.share({
                title: 'Shopping List',
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
                        <span class="form-hint">Mark items as "in pantry" from your shopping list</span>
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
     * Add item to shopping list
     * Returns { data, inPantry } to allow caller to show warning
     */
    function addItem(memberId, itemData, options = {}) {
        const data = getWidgetData(memberId);

        // Check if item is in pantry (skip if moving from pantry)
        const inPantry = options.skipPantryWarning ? false : isInPantry(memberId, itemData.name);

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

        // Show warning if item is in pantry
        if (inPantry) {
            Toast.warning(`${itemData.name} is already in your pantry`);
        }

        return { data, inPantry };
    }

    /**
     * Toggle item checked status
     * Returns item info for pantry prompt
     */
    function toggleItemChecked(memberId, itemId) {
        const data = getWidgetData(memberId);
        const item = data.items.find(i => i.id === itemId);

        if (item) {
            const wasChecked = item.checked;
            item.checked = !item.checked;
            item.checkedAt = item.checked ? new Date().toISOString() : null;
            saveWidgetData(memberId, data);

            // Return item info for pantry prompt (only when checking off, not unchecking)
            if (!wasChecked && item.checked) {
                return {
                    name: item.name,
                    category: item.category,
                    shouldPromptPantry: !isInPantry(memberId, item.name)
                };
            }
        }
        return null;
    }

    /**
     * Delete item from shopping list
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
                    Organize your shopping list by the stores you shop at. Drag to reorder.
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
     * Show add store modal (from Stores tab)
     */
    function showAddStoreModal(memberId, pageContainer, member, activeTab = 'stores') {
        const content = `
            <form id="addStoreForm">
                <div class="form-group">
                    <label class="form-label">Store Name</label>
                    <input type="text" class="form-input" id="newStoreName" placeholder="e.g., Walmart, Safeway, CVS..." required>
                </div>
            </form>
        `;

        Modal.open({
            title: 'Add Store',
            content,
            footer: Modal.createFooter('Cancel', 'Add Store')
        });

        Modal.bindFooterEvents(() => {
            const name = document.getElementById('newStoreName')?.value?.trim();
            if (!name) {
                Toast.error('Store name is required');
                return false;
            }

            addStore(memberId, name);
            Toast.success(`${name} added`);
            renderGroceryPage(pageContainer, memberId, member, activeTab);
            return true;
        });
    }

    /**
     * Show edit store modal
     */
    function showEditStoreModal(memberId, storeId, pageContainer, member, activeTab = 'stores') {
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
            renderGroceryPage(pageContainer, memberId, member, activeTab);
            return true;
        });
    }

    /**
     * Show quick prompt to add item to pantry after checking off
     */
    /**
     * Detect the best category for an item based on name
     */
    function detectItemCategory(itemName) {
        const name = itemName.toLowerCase();

        // Check if item exists in DEFAULT_PANTRY_ITEMS
        for (const [catId, items] of Object.entries(DEFAULT_PANTRY_ITEMS)) {
            if (items.some(item => item.toLowerCase() === name)) {
                return catId;
            }
        }

        // Common keyword mappings for items not in defaults
        const categoryKeywords = {
            produce: ['apple', 'banana', 'orange', 'tomato', 'lettuce', 'spinach', 'carrot', 'broccoli', 'cucumber', 'pepper', 'avocado', 'mango', 'grape', 'berry', 'berries', 'strawberry', 'blueberry', 'melon', 'watermelon', 'peach', 'pear', 'plum', 'cherry', 'celery', 'cabbage', 'kale', 'mushroom', 'zucchini', 'squash', 'corn', 'peas', 'beans', 'asparagus', 'cauliflower', 'eggplant', 'radish', 'beet', 'turnip', 'parsley', 'cilantro', 'basil', 'mint', 'thyme', 'rosemary', 'dill', 'scallion', 'leek', 'fruit', 'vegetable', 'veggie', 'salad', 'herb'],
            dairy: ['milk', 'cheese', 'yogurt', 'cream', 'butter', 'egg', 'cottage', 'ricotta', 'mozzarella', 'cheddar', 'parmesan', 'feta', 'gouda', 'brie', 'swiss', 'provolone', 'half and half', 'whipping', 'sour cream', 'cream cheese', 'kefir'],
            meat: ['chicken', 'beef', 'pork', 'lamb', 'turkey', 'duck', 'fish', 'salmon', 'tuna', 'shrimp', 'crab', 'lobster', 'bacon', 'sausage', 'ham', 'steak', 'ground', 'ribs', 'wing', 'thigh', 'breast', 'drumstick', 'fillet', 'cod', 'tilapia', 'trout', 'halibut', 'meatball', 'hot dog', 'deli', 'prosciutto', 'pepperoni', 'salami'],
            bakery: ['bread', 'bagel', 'muffin', 'croissant', 'roll', 'bun', 'tortilla', 'pita', 'naan', 'baguette', 'sourdough', 'ciabatta', 'pretzel', 'donut', 'doughnut', 'cake', 'pie', 'pastry', 'cookie', 'brownie', 'scone'],
            frozen: ['frozen', 'ice cream', 'popsicle', 'pizza', 'waffle', 'french fries', 'tater tots', 'tv dinner', 'pot pie', 'burrito', 'ice', 'sorbet', 'gelato', 'frozen yogurt'],
            pantry: ['rice', 'pasta', 'noodle', 'flour', 'sugar', 'salt', 'pepper', 'oil', 'vinegar', 'sauce', 'can', 'canned', 'soup', 'broth', 'stock', 'beans', 'lentil', 'chickpea', 'cereal', 'oat', 'granola', 'nut', 'almond', 'walnut', 'peanut', 'cashew', 'seed', 'honey', 'syrup', 'jam', 'jelly', 'spread', 'spice', 'seasoning', 'herb', 'baking', 'yeast', 'cornstarch', 'cocoa', 'chocolate', 'chip', 'cracker', 'chip', 'snack', 'popcorn', 'pretzel', 'dried', 'raisin', 'crouton', 'breadcrumb', 'panko', 'ketchup', 'mustard', 'mayo', 'mayonnaise', 'relish', 'bbq', 'hot sauce', 'salsa', 'dressing'],
            beverages: ['coffee', 'tea', 'juice', 'soda', 'water', 'sparkling', 'lemonade', 'drink', 'beverage', 'wine', 'beer', 'spirit', 'liquor', 'cocktail', 'smoothie', 'shake', 'energy drink', 'sports drink', 'coconut water', 'almond milk', 'oat milk', 'soy milk'],
            household: ['soap', 'detergent', 'cleaner', 'paper towel', 'toilet paper', 'tissue', 'napkin', 'trash bag', 'garbage bag', 'foil', 'wrap', 'plastic', 'ziploc', 'bag', 'sponge', 'brush', 'mop', 'broom', 'bleach', 'disinfectant', 'air freshener', 'candle', 'battery', 'light bulb', 'laundry', 'fabric softener', 'dryer sheet', 'dish', 'dishwasher']
        };

        // Check keywords
        for (const [catId, keywords] of Object.entries(categoryKeywords)) {
            if (keywords.some(keyword => name.includes(keyword))) {
                return catId;
            }
        }

        return 'other';
    }

    function showAddToPantryPrompt(memberId, itemName, category, pageContainer, member, activeTab) {
        // Auto-detect better category if current is 'other' or not set
        const detectedCategory = (category && category !== 'other') ? category : detectItemCategory(itemName);
        const categoryInfo = CATEGORIES.find(c => c.id === detectedCategory) || CATEGORIES.find(c => c.id === 'other');

        const content = `
            <div class="pantry-prompt">
                <p>Would you like to add <strong>${itemName}</strong> to your pantry?</p>
                <p class="pantry-prompt__category">
                    Category: <span style="background: ${categoryInfo.bgColor}; color: ${categoryInfo.color}; padding: 2px 8px; border-radius: 12px; font-size: 12px;">
                        ${categoryInfo.name}
                    </span>
                </p>
                <p class="pantry-prompt__hint">Items in your pantry won't be suggested, helping you track what you have at home.</p>
            </div>
        `;

        Modal.open({
            title: 'Add to Pantry?',
            content,
            footer: Modal.createFooter('No Thanks', 'Add to Pantry')
        });

        Modal.bindFooterEvents(() => {
            togglePantryItem(memberId, itemName, detectedCategory);
            Toast.success(`${itemName} added to ${categoryInfo.name}`);
            renderGroceryPage(pageContainer, memberId, member, activeTab);
            return true;
        });
    }

    /**
     * Show add more pantry items modal with selectable defaults
     */
    function showAddMorePantryModal(memberId, pageContainer, member, activeTab = 'pantry') {
        const data = getWidgetData(memberId);
        const pantryNames = (data.pantry || []).map(p => p.name.toLowerCase());

        let content = `<div class="add-more-pantry">
            <p class="form-hint" style="margin-bottom: var(--space-4);">
                Tap items to add them to your pantry, or add a custom item below.
            </p>
            <div class="add-more-pantry__categories">`;

        Object.entries(DEFAULT_PANTRY_ITEMS).forEach(([catId, items]) => {
            const cat = CATEGORIES.find(c => c.id === catId) || CATEGORIES.find(c => c.id === 'other');
            const availableItems = items.filter(item => !pantryNames.includes(item.toLowerCase()));

            if (availableItems.length > 0) {
                content += `
                    <div class="add-more-pantry__category">
                        <div class="add-more-pantry__category-header">
                            <div style="width: 20px; height: 20px; border-radius: 6px; background: ${cat.bgColor}; color: ${cat.color}; display: flex; align-items: center; justify-content: center;">
                                <i data-lucide="${cat.icon}" style="width: 12px; height: 12px;"></i>
                            </div>
                            <span>${cat.name}</span>
                        </div>
                        <div class="add-more-pantry__items">
                            ${availableItems.map(item => `
                                <button type="button" class="add-more-pantry__item" data-modal-pantry-item="${item}" data-modal-pantry-category="${catId}">
                                    <i data-lucide="plus"></i>
                                    ${item}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                `;
            }
        });

        content += `</div>
            <div class="add-more-pantry__custom">
                <label class="form-label" style="margin-bottom: var(--space-2);">Add Custom Item</label>
                <div class="add-more-pantry__custom-row">
                    <input type="text" class="form-input" id="customPantryInput" placeholder="Item name...">
                    <select class="form-select" id="customPantryCategorySelect">
                        ${CATEGORIES.map(cat => `
                            <option value="${cat.id}">${cat.name}</option>
                        `).join('')}
                    </select>
                    <button type="button" class="btn btn--primary" id="addCustomPantryItemBtn">Add</button>
                </div>
            </div>
        </div>`;

        Modal.open({
            title: 'Add to Pantry',
            content,
            footer: `<button class="btn btn--secondary" data-modal-close>Done</button>`
        });

        // Bind click events for items
        document.querySelectorAll('[data-modal-pantry-item]').forEach(btn => {
            btn.addEventListener('click', () => {
                const itemName = btn.dataset.modalPantryItem;
                const category = btn.dataset.modalPantryCategory;
                togglePantryItem(memberId, itemName, category);
                btn.classList.add('add-more-pantry__item--added');
                btn.innerHTML = `<i data-lucide="check"></i> ${itemName}`;
                if (typeof lucide !== 'undefined') lucide.createIcons();
                Toast.success(`Added ${itemName}`);
            });
        });

        // Bind custom item input
        document.getElementById('addCustomPantryItemBtn')?.addEventListener('click', () => {
            const input = document.getElementById('customPantryInput');
            const categorySelect = document.getElementById('customPantryCategorySelect');
            const name = input?.value?.trim();
            const category = categorySelect?.value || 'other';
            if (name) {
                if (isInPantry(memberId, name)) {
                    Toast.info(`${name} is already in your pantry`);
                } else {
                    togglePantryItem(memberId, name, category);

                    // Show visual feedback - add chip to the custom section
                    const customSection = document.querySelector('.add-more-pantry__custom');
                    let addedContainer = customSection.querySelector('.add-more-pantry__added');
                    if (!addedContainer) {
                        addedContainer = document.createElement('div');
                        addedContainer.className = 'add-more-pantry__added';
                        addedContainer.style.cssText = 'display: flex; flex-wrap: wrap; gap: var(--space-2); margin-top: var(--space-3);';
                        customSection.appendChild(addedContainer);
                    }

                    const chip = document.createElement('span');
                    chip.className = 'add-more-pantry__item add-more-pantry__item--added';
                    chip.innerHTML = `<i data-lucide="check"></i> ${name}`;
                    addedContainer.appendChild(chip);
                    if (typeof lucide !== 'undefined') lucide.createIcons();

                    Toast.success(`Added ${name}`);
                    input.value = '';
                    input.focus();
                }
            }
        });

        // Enter key for custom input
        document.getElementById('customPantryInput')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                document.getElementById('addCustomPantryItemBtn')?.click();
            }
        });

        // Close button
        document.querySelector('[data-modal-close]')?.addEventListener('click', () => {
            Modal.close();
            renderGroceryPage(pageContainer, memberId, member, activeTab);
        });
    }

    /**
     * Show store selection modal when adding pantry item to shopping list
     */
    function showStoreSelectionModal(memberId, itemName, pageContainer, member, activeTab = 'pantry') {
        const stores = getStores(memberId);

        const content = `
            <div class="store-selection">
                <p class="form-hint" style="margin-bottom: var(--space-3);">
                    Where do you want to buy <strong>${itemName}</strong>?
                </p>
                <div class="store-selection__options">
                    ${stores.map(store => `
                        <button type="button" class="store-selection__btn" data-select-store="${store.id}">
                            <span class="store-selection__icon" style="background: ${store.color}20; color: ${store.color}">
                                <i data-lucide="shopping-bag"></i>
                            </span>
                            <span class="store-selection__name">${store.name}</span>
                        </button>
                    `).join('')}
                    <button type="button" class="store-selection__btn store-selection__btn--other" data-select-store="">
                        <span class="store-selection__icon">
                            <i data-lucide="list"></i>
                        </span>
                        <span class="store-selection__name">Other Items</span>
                    </button>
                </div>
            </div>
        `;

        Modal.open({
            title: 'Select Store',
            content,
            showFooter: false
        });

        // Initialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Bind store selection buttons
        document.querySelectorAll('[data-select-store]').forEach(btn => {
            btn.addEventListener('click', () => {
                const storeId = btn.dataset.selectStore;
                const store = stores.find(s => s.id === storeId);

                // Add item to list with selected store (skip pantry warning since we're moving from pantry)
                addItem(memberId, { name: itemName, store: storeId || null }, { skipPantryWarning: true });

                // Auto-remove from pantry
                togglePantryItem(memberId, itemName);

                Modal.close();
                renderGroceryPage(pageContainer, memberId, member, activeTab);

                const storeName = store ? store.name : 'Other Items';
                Toast.success(`Added ${itemName} to ${storeName} (removed from pantry)`);
            });
        });
    }

    /**
     * Show add pantry item modal (from Pantry tab)
     */
    function showAddPantryItemModal(memberId, pageContainer, member, activeTab = 'pantry') {
        const content = `
            <form id="addPantryForm">
                <div class="form-group">
                    <label class="form-label">Item Name</label>
                    <input type="text" class="form-input" id="pantryItemName" placeholder="e.g., Rice, Olive Oil, Salt..." required>
                </div>
                <div class="form-group">
                    <label class="form-label">Category</label>
                    <select class="form-select" id="pantryItemCategory">
                        ${CATEGORIES.map(cat => `
                            <option value="${cat.id}">${cat.name}</option>
                        `).join('')}
                    </select>
                </div>
            </form>
        `;

        Modal.open({
            title: 'Add to Pantry',
            content,
            footer: Modal.createFooter('Cancel', 'Add to Pantry')
        });

        Modal.bindFooterEvents(() => {
            const name = document.getElementById('pantryItemName')?.value?.trim();
            const category = document.getElementById('pantryItemCategory')?.value || 'other';

            if (!name) {
                Toast.error('Item name is required');
                return false;
            }

            // Check if already in pantry
            if (isInPantry(memberId, name)) {
                Toast.info(`${name} is already in your pantry`);
                return false;
            }

            togglePantryItem(memberId, name, category);
            Toast.success(`${name} added to pantry`);
            renderGroceryPage(pageContainer, memberId, member, activeTab);
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
     * Normalize day plan to handle both old and new formats
     * Old format: { breakfast: [...], lunch: [...], dinner: [...] }
     * New format: { adult: { breakfast: {...}, ... }, kids: { breakfast: {...}, ... } }
     */
    function normalizeDayPlan(dayPlan) {
        if (!dayPlan) return { adult: {}, kids: {} };

        // Check if it's already in new format (has 'adult' or 'kids' key)
        if (dayPlan.adult || dayPlan.kids) {
            return {
                adult: dayPlan.adult || {},
                kids: dayPlan.kids || {}
            };
        }

        // Old format - migrate to new format under 'adult'
        const adult = {};
        ['breakfast', 'lunch', 'dinner'].forEach(mealType => {
            if (dayPlan[mealType]) {
                const mealData = dayPlan[mealType];
                if (Array.isArray(mealData)) {
                    adult[mealType] = { items: mealData, protein: null, completed: false };
                } else if (typeof mealData === 'string') {
                    adult[mealType] = { items: [mealData], protein: null, completed: false };
                } else if (mealData && typeof mealData === 'object') {
                    adult[mealType] = mealData;
                }
            }
        });

        return { adult, kids: {} };
    }

    /**
     * Get meal items from a meal slot (handles both old and new formats)
     */
    function getMealItems(mealSlot) {
        if (!mealSlot) return [];
        if (Array.isArray(mealSlot)) return mealSlot;
        if (typeof mealSlot === 'string') return [mealSlot];
        if (mealSlot.items) return Array.isArray(mealSlot.items) ? mealSlot.items : [mealSlot.items];
        return [];
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
                // Normalize to handle both old and new formats
                const normalizedPlan = normalizeDayPlan(dayPlan);

                // Process adult meals
                ['breakfast', 'lunch', 'dinner'].forEach(mealType => {
                    const mealItems = getMealItems(normalizedPlan.adult?.[mealType]);
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
                            ingredients: allIngredients,
                            variant: 'adult'
                        });
                    }
                });

                // Process kids meals if they exist
                ['breakfast', 'lunch', 'dinner'].forEach(mealType => {
                    const mealItems = getMealItems(normalizedPlan.kids?.[mealType]);
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
                            mealType: `${mealType} (Kids)`,
                            meal: mealItems.join(' & '),
                            mealItems: mealItems,
                            ingredients: allIngredients,
                            variant: 'kids'
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
                    Select meals to add their ingredients to your shopping list.
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
            footer: Modal.createFooter('Cancel', 'Add to Shopping List')
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

            // Re-render after modal closes
            setTimeout(() => {
                renderGroceryPage(pageContainer, memberId, member);
                Toast.success(`Added ${addedCount} items to shopping list`);
            }, 250);

            return true;
        });
    }

    /**
     * Open shopping list from meal plan widget
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
