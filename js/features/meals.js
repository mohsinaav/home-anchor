/**
 * Meals Feature
 * Handles meal planning functionality with full-page weekly planner
 * Supports multiple items per meal slot (e.g., "Bread + Stew" for breakfast)
 */

const Meals = (function() {
    const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snacks'];
    const DISPLAY_MEAL_TYPES = ['breakfast', 'lunch', 'snacks', 'dinner']; // Snacks between lunch and dinner
    const VARIANTS = ['adult', 'kids'];
    let currentMemberId = null;
    let currentView = 'adult'; // 'adult' only now - kids meals handled via customize button
    let currentWeekOffset = 0; // Track which week we're viewing (0 = current week)

    // Day colors for the weekly view (matches workout/gratitude)
    const DAY_COLORS = [
        { bg: '#FEE2E2', border: '#FCA5A5', text: '#991B1B' }, // Sunday - red
        { bg: '#DBEAFE', border: '#93C5FD', text: '#1E40AF' }, // Monday - blue
        { bg: '#D1FAE5', border: '#6EE7B7', text: '#065F46' }, // Tuesday - green
        { bg: '#FEF3C7', border: '#FCD34D', text: '#92400E' }, // Wednesday - amber
        { bg: '#EDE9FE', border: '#C4B5FD', text: '#5B21B6' }, // Thursday - violet
        { bg: '#FCE7F3', border: '#F9A8D4', text: '#9D174D' }, // Friday - pink
        { bg: '#E0F2FE', border: '#7DD3FC', text: '#0369A1' }  // Saturday - sky
    ];

    /**
     * Normalize meal slot data to new format { items: [], protein: null, prepNotes: null }
     * Handles backwards compatibility with old string[] or string formats
     */
    function normalizeMealSlot(mealSlot) {
        if (!mealSlot) return { items: [], protein: null, completed: false, prepNotes: null };
        // Already new format
        if (mealSlot.items !== undefined) {
            return {
                items: Array.isArray(mealSlot.items) ? mealSlot.items : [],
                protein: mealSlot.protein || null,
                completed: mealSlot.completed || false,
                prepNotes: mealSlot.prepNotes || null
            };
        }
        // Old format: array of strings
        if (Array.isArray(mealSlot)) {
            return { items: mealSlot, protein: null, completed: false, prepNotes: null };
        }
        // Old format: single string
        if (typeof mealSlot === 'string') {
            return { items: [mealSlot], protein: null, completed: false, prepNotes: null };
        }
        return { items: [], protein: null, completed: false, prepNotes: null };
    }

    /**
     * Normalize a day's plan to new variant-based format
     * Old format: { breakfast: [...], lunch: [...] }
     * New format: { adult: { breakfast: { items: [], protein } }, kids: { ... } }
     */
    function normalizeDayPlan(dayPlan) {
        if (!dayPlan) return { adult: {}, kids: {} };

        // Already new format with variants
        if (dayPlan.adult !== undefined || dayPlan.kids !== undefined) {
            return {
                adult: dayPlan.adult || {},
                kids: dayPlan.kids || {}
            };
        }

        // Old format - migrate to adult only (kids empty)
        const adult = {};
        MEAL_TYPES.forEach(type => {
            if (dayPlan[type]) {
                adult[type] = normalizeMealSlot(dayPlan[type]);
            }
        });
        return { adult, kids: {} };
    }

    /**
     * Get meal items from a slot (for display)
     */
    function getMealItems(mealSlot) {
        const normalized = normalizeMealSlot(mealSlot);
        return normalized.items;
    }

    /**
     * Normalize meal data - convert string to array for backwards compatibility
     * @deprecated Use normalizeMealSlot for new code
     */
    function normalizeMealData(meal) {
        if (!meal) return [];
        if (Array.isArray(meal)) return meal;
        // Legacy: single string becomes array with one item
        return [meal];
    }

    /**
     * Format meal items for display
     */
    function formatMealDisplay(meal) {
        const items = normalizeMealData(meal);
        if (items.length === 0) return 'Not planned';
        if (items.length === 1) return items[0];
        // Show all items separated by commas
        return items.join(', ');
    }

    /**
     * Calculate daily protein total for a variant's meals
     */
    function calculateDayProtein(dayVariantPlan, memberId) {
        let total = 0;
        const recipes = getAllRecipes(memberId);

        MEAL_TYPES.forEach(type => {
            const slot = normalizeMealSlot(dayVariantPlan[type]);
            if (slot.protein) {
                // Manual protein override
                total += slot.protein;
            } else {
                // Try to get protein from linked recipes
                slot.items.forEach(itemName => {
                    const recipe = recipes.find(r => r.name === itemName);
                    if (recipe?.protein) {
                        total += recipe.protein;
                    }
                });
            }
        });
        return total;
    }

    /**
     * Check if any meals for a date require prep (for alerts)
     * Deduplicates by recipe name (same meal for adults/kids only shows once)
     */
    function getMealsNeedingPrep(date, memberId) {
        const widgetData = Storage.getWidgetData(memberId, 'meal-plan') || { weeklyPlan: {} };
        const dayPlan = normalizeDayPlan(widgetData.weeklyPlan?.[date]);
        const recipes = getAllRecipes(memberId);
        const needsPrep = [];
        const seenRecipes = new Set(); // Track already added recipes to avoid duplicates

        VARIANTS.forEach(variant => {
            MEAL_TYPES.forEach(type => {
                const slot = normalizeMealSlot(dayPlan[variant]?.[type]);
                slot.items.forEach(itemName => {
                    const recipe = recipes.find(r => r.name === itemName);
                    if (recipe?.requiresPrep && !seenRecipes.has(itemName)) {
                        seenRecipes.add(itemName);
                        needsPrep.push({
                            variant,
                            mealType: type,
                            recipeName: itemName,
                            prepInstructions: recipe.prepInstructions || ''
                        });
                    }
                });
            });
        });

        return needsPrep;
    }

    /**
     * Get tomorrow's date string
     */
    function getTomorrowDate() {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return DateUtils.formatISO(tomorrow);
    }

    /**
     * Get week start date with offset
     * @param {number} weekOffset - Number of weeks from current week (0 = current, -1 = last week, 1 = next week)
     */
    function getWeekStartWithOffset(weekOffset = 0) {
        const today = new Date();
        const weekStart = DateUtils.getWeekStart(today);
        weekStart.setDate(weekStart.getDate() + (weekOffset * 7));
        return weekStart;
    }

    /**
     * Copy previous week's meal plan to target week
     */
    function copyPreviousWeekPlan(memberId, sourceWeekOffset, targetWeekOffset) {
        const widgetData = Storage.getWidgetData(memberId, 'meal-plan') || { weeklyPlan: {}, recipes: [] };
        const sourceWeekStart = getWeekStartWithOffset(sourceWeekOffset);
        const targetWeekStart = getWeekStartWithOffset(targetWeekOffset);

        let copiedCount = 0;

        for (let i = 0; i < 7; i++) {
            const sourceDate = DateUtils.addDays(sourceWeekStart, i);
            const targetDate = DateUtils.addDays(targetWeekStart, i);
            const sourceDateStr = DateUtils.formatISO(sourceDate);
            const targetDateStr = DateUtils.formatISO(targetDate);

            const sourcePlan = widgetData.weeklyPlan?.[sourceDateStr];
            if (sourcePlan) {
                // Deep copy the plan (without completed status)
                const copiedPlan = JSON.parse(JSON.stringify(sourcePlan));
                // Remove completion status from copied plan
                VARIANTS.forEach(variant => {
                    if (copiedPlan[variant]) {
                        MEAL_TYPES.forEach(mealType => {
                            if (copiedPlan[variant][mealType]) {
                                delete copiedPlan[variant][mealType].completed;
                            }
                        });
                    }
                });
                widgetData.weeklyPlan[targetDateStr] = copiedPlan;
                copiedCount++;
            }
        }

        Storage.setWidgetData(memberId, 'meal-plan', widgetData);
        return copiedCount;
    }

    /**
     * Toggle meal completion status
     */
    function toggleMealCompletion(memberId, date, mealType, variant) {
        const widgetData = Storage.getWidgetData(memberId, 'meal-plan') || { weeklyPlan: {} };
        const dayPlan = normalizeDayPlan(widgetData.weeklyPlan?.[date]);

        if (!dayPlan[variant]) {
            dayPlan[variant] = {};
        }

        const slot = normalizeMealSlot(dayPlan[variant][mealType]);

        // Only toggle if there are items
        if (slot.items.length === 0) return false;

        slot.completed = !slot.completed;
        dayPlan[variant][mealType] = slot;

        widgetData.weeklyPlan[date] = dayPlan;
        Storage.setWidgetData(memberId, 'meal-plan', widgetData);

        return slot.completed;
    }

    /**
     * Copy adult meal to kids for a specific slot
     */
    function copyAdultToKids(memberId, date, mealType) {
        const widgetData = Storage.getWidgetData(memberId, 'meal-plan') || { weeklyPlan: {} };
        const dayPlan = normalizeDayPlan(widgetData.weeklyPlan?.[date]);

        const adultSlot = normalizeMealSlot(dayPlan.adult?.[mealType]);

        if (adultSlot.items.length === 0) {
            return false;
        }

        // Copy items only (not protein, since that's adult-specific)
        if (!dayPlan.kids) {
            dayPlan.kids = {};
        }
        dayPlan.kids[mealType] = {
            items: [...adultSlot.items],
            protein: null
        };

        widgetData.weeklyPlan[date] = dayPlan;
        Storage.setWidgetData(memberId, 'meal-plan', widgetData);
        return true;
    }

    /**
     * Render the meal plan widget for a member
     */
    function renderWidget(container, memberId) {
        const today = DateUtils.today();
        const tomorrow = getTomorrowDate();
        const widgetData = Storage.getWidgetData(memberId, 'meal-plan') || {
            weeklyPlan: {},
            recipes: []
        };

        const todayPlan = normalizeDayPlan(widgetData.weeklyPlan?.[today]);
        // For widget, show adult meals by default
        const adultPlan = todayPlan.adult || {};
        const kidsPlan = todayPlan.kids || {};
        const tomorrowPrepNeeded = getMealsNeedingPrep(tomorrow, memberId);
        const dailyProtein = calculateDayProtein(adultPlan, memberId);
        const recipes = getAllRecipes(memberId);

        container.innerHTML = `
            <div class="meals-widget">
                ${tomorrowPrepNeeded.length > 0 ? `
                    <div class="meals-widget__prep-alert">
                        <i data-lucide="alert-triangle"></i>
                        <span>Prep needed for tomorrow: ${tomorrowPrepNeeded.map(p => p.recipeName).join(', ')}</span>
                    </div>
                ` : ''}

                <div class="meals-widget__header">
                    <span class="meals-widget__day">${DateUtils.getDayName(new Date())}'s Meals</span>
                    ${dailyProtein > 0 ? `<span class="meals-widget__protein"><i data-lucide="beef"></i>${dailyProtein}g</span>` : ''}
                </div>

                <div class="meals-widget__list">
                    ${DISPLAY_MEAL_TYPES.map(mealType => {
                        const slot = normalizeMealSlot(adultPlan[mealType]);
                        const kidsSlot = normalizeMealSlot(kidsPlan[mealType]);
                        const hasMeals = slot.items.length > 0;
                        const hasKidsMeal = kidsSlot.items.length > 0;
                        const kidsMealDiffers = hasKidsMeal && JSON.stringify(kidsSlot.items) !== JSON.stringify(slot.items);

                        // Check for prep (custom notes or recipe-based)
                        const hasCustomPrep = slot.prepNotes && slot.prepNotes.trim().length > 0;
                        const hasRecipePrep = slot.items.some(itemName => {
                            const recipe = recipes.find(r => r.name === itemName);
                            return recipe?.requiresPrep;
                        });
                        const hasPrep = hasCustomPrep || hasRecipePrep;

                        // Helper to escape HTML entities for title attribute
                        const escapeAttr = (str) => str ? str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';

                        const prepTooltip = escapeAttr(hasCustomPrep ? slot.prepNotes : (hasRecipePrep ? 'Recipe requires prep' : ''));
                        const kidsTooltip = escapeAttr(kidsMealDiffers ? `Kids: ${kidsSlot.items.join(', ')}` : '');

                        return `
                            <div class="meal-item ${hasMeals ? '' : 'meal-item--empty'}" data-meal-type="${mealType}">
                                <div class="meal-item__icon">
                                    <i data-lucide="${getMealIcon(mealType)}"></i>
                                </div>
                                <div class="meal-item__content">
                                    <span class="meal-item__type">${capitalizeFirst(mealType)}</span>
                                    <span class="meal-item__name">
                                        ${hasMeals ? formatMealDisplay(slot.items) : 'Not planned'}
                                        ${hasMeals && hasPrep ? `<span class="meal-item__indicator meal-item__indicator--prep" data-tooltip="${prepTooltip}"><i data-lucide="chef-hat"></i></span>` : ''}
                                        ${hasMeals && kidsMealDiffers ? `<span class="meal-item__indicator meal-item__indicator--kids" data-tooltip="${kidsTooltip}"><i data-lucide="baby"></i></span>` : ''}
                                    </span>
                                </div>
                                <button class="btn btn--icon btn--ghost btn--sm" data-edit-meal="${mealType}" data-variant="adult" data-member-id="${memberId}">
                                    <i data-lucide="${hasMeals ? 'edit-2' : 'plus'}"></i>
                                </button>
                            </div>
                        `;
                    }).join('')}
                </div>

                <div class="meals-widget__footer">
                    <button class="btn btn--sm btn--ghost" data-action="generate-grocery" data-member-id="${memberId}">
                        <i data-lucide="shopping-cart"></i>
                        Shopping List
                    </button>
                    <button class="btn btn--sm btn--ghost" data-action="import-meals" data-member-id="${memberId}">
                        <i data-lucide="file-text"></i>
                        Import
                    </button>
                    <button class="btn btn--sm btn--ghost" data-action="view-week" data-member-id="${memberId}">
                        <i data-lucide="calendar"></i>
                        Plan Week
                    </button>
                </div>
            </div>
        `;

        // Initialize icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Bind events
        bindMealEvents(container, memberId, widgetData);
    }

    /**
     * Get icon for meal type
     */
    function getMealIcon(mealType) {
        const icons = {
            breakfast: 'coffee',
            lunch: 'utensils',
            dinner: 'chef-hat',
            snacks: 'cookie'
        };
        return icons[mealType] || 'utensils';
    }

    /**
     * Capitalize first letter
     */
    function capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    /**
     * Bind meal events
     */
    function bindMealEvents(container, memberId, widgetData) {
        // Edit meal buttons (quick edit for today)
        container.querySelectorAll('[data-edit-meal]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const mealType = btn.dataset.editMeal;
                showQuickEditModal(memberId, mealType);
            });
        });

        // View week - opens full page planner
        container.querySelector('[data-action="view-week"]')?.addEventListener('click', () => {
            showWeeklyPlannerPage(memberId);
        });

        // Generate shopping list - open shopping page
        container.querySelector('[data-action="generate-grocery"]')?.addEventListener('click', () => {
            if (typeof Grocery !== 'undefined' && Grocery.showGroceryListPage) {
                Grocery.showGroceryListPage(memberId);
            } else {
                Toast.info('Shopping list feature coming soon!');
            }
        });

        // Import meals
        container.querySelector('[data-action="import-meals"]')?.addEventListener('click', () => {
            showMealPlanImportModal(memberId);
        });
    }

    /**
     * Get all recipes for autocomplete
     */
    function getAllRecipes(memberId) {
        if (typeof Recipes === 'undefined' || !Recipes.getRecipesForMealPlan) {
            return [];
        }
        return Recipes.getRecipesForMealPlan(memberId) || [];
    }

    /**
     * Get recipes filtered by meal type tag
     */
    function getRecipesForMealType(memberId, mealType) {
        if (typeof Recipes === 'undefined' || !Recipes.getRecipesForMealPlan) {
            return [];
        }
        const recipes = Recipes.getRecipesForMealPlan(memberId);
        const mealTagMap = {
            breakfast: ['breakfast', 'brunch'],
            lunch: ['lunch', 'salad', 'sandwich', 'soup'],
            dinner: ['dinner', 'main', 'entree'],
            snacks: ['snack', 'dessert', 'appetizer']
        };
        const relevantTags = mealTagMap[mealType] || [];

        // Filter recipes that have relevant tags, or return all if no matches
        const filtered = recipes.filter(r =>
            r.tags?.some(tag => relevantTags.includes(tag.toLowerCase()))
        );

        return filtered.length > 0 ? filtered : recipes.slice(0, 6);
    }

    /**
     * Setup autocomplete for meal input
     * @param {HTMLElement} inputElement - The input element
     * @param {string} memberId - The member ID
     * @param {Function} onSelect - Optional callback when item is selected (for multi-item mode)
     */
    function setupMealAutocomplete(inputElement, memberId, onSelect = null) {
        const recipes = getAllRecipes(memberId);
        if (recipes.length === 0) return;

        // Create autocomplete container
        const wrapper = inputElement.parentElement;
        wrapper.style.position = 'relative';

        let autocompleteEl = document.createElement('div');
        autocompleteEl.className = 'meal-autocomplete';
        autocompleteEl.style.display = 'none';
        wrapper.appendChild(autocompleteEl);

        let selectedIndex = -1;

        // Filter and show suggestions
        function showSuggestions(query) {
            if (!query || query.length < 1) {
                autocompleteEl.style.display = 'none';
                return;
            }

            const lowerQuery = query.toLowerCase();
            const matches = recipes.filter(r =>
                r.name.toLowerCase().includes(lowerQuery)
            ).slice(0, 6);

            if (matches.length === 0) {
                autocompleteEl.style.display = 'none';
                return;
            }

            autocompleteEl.innerHTML = matches.map((r, i) => `
                <div class="meal-autocomplete__item ${i === selectedIndex ? 'meal-autocomplete__item--selected' : ''}"
                     data-recipe-name="${r.name}"
                     style="--recipe-color: ${r.color || '#6366F1'}">
                    <i data-lucide="${r.icon || 'utensils'}"></i>
                    <span>${r.name}</span>
                </div>
            `).join('');

            autocompleteEl.style.display = 'block';

            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }

            // Bind click events
            autocompleteEl.querySelectorAll('.meal-autocomplete__item').forEach((item, idx) => {
                item.addEventListener('click', () => {
                    const recipeName = item.dataset.recipeName;
                    if (onSelect) {
                        onSelect(recipeName);
                        inputElement.value = '';
                    } else {
                        inputElement.value = recipeName;
                    }
                    autocompleteEl.style.display = 'none';
                    inputElement.focus();
                });
                item.addEventListener('mouseenter', () => {
                    selectedIndex = idx;
                    updateSelection();
                });
            });
        }

        function updateSelection() {
            autocompleteEl.querySelectorAll('.meal-autocomplete__item').forEach((item, idx) => {
                item.classList.toggle('meal-autocomplete__item--selected', idx === selectedIndex);
            });
        }

        // Input events
        inputElement.addEventListener('input', (e) => {
            selectedIndex = -1;
            showSuggestions(e.target.value);
        });

        inputElement.addEventListener('focus', () => {
            if (inputElement.value) {
                showSuggestions(inputElement.value);
            }
        });

        inputElement.addEventListener('keydown', (e) => {
            const items = autocompleteEl.querySelectorAll('.meal-autocomplete__item');
            if (items.length === 0 || autocompleteEl.style.display === 'none') return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
                updateSelection();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                selectedIndex = Math.max(selectedIndex - 1, -1);
                updateSelection();
            } else if (e.key === 'Enter' && selectedIndex >= 0) {
                e.preventDefault();
                const recipeName = items[selectedIndex].dataset.recipeName;
                if (onSelect) {
                    onSelect(recipeName);
                    inputElement.value = '';
                } else {
                    inputElement.value = recipeName;
                }
                autocompleteEl.style.display = 'none';
            } else if (e.key === 'Escape') {
                autocompleteEl.style.display = 'none';
            }
        });

        // Hide on click outside
        document.addEventListener('click', (e) => {
            if (!wrapper.contains(e.target)) {
                autocompleteEl.style.display = 'none';
            }
        });
    }

    /**
     * Render recipe suggestions section
     */
    function renderRecipeSuggestions(memberId, mealType) {
        const recipes = getRecipesForMealType(memberId, mealType);
        if (recipes.length === 0) return '';

        return `
            <div class="form-group">
                <label class="form-label">From Your Recipes</label>
                <div class="meal-recipes">
                    ${recipes.slice(0, 6).map(r => `
                        <button type="button" class="meal-recipe" data-recipe-name="${r.name}" style="--recipe-color: ${r.color || '#6366F1'}">
                            <i data-lucide="${r.icon || 'utensils'}"></i>
                            <span>${r.name}</span>
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Render meal tags (chips) for the edit modal
     */
    function renderMealTags(items) {
        return items.map((item, idx) => `
            <span class="meal-tag">
                <span class="meal-tag__text">${item}</span>
                <button type="button" class="meal-tag__remove" data-remove-index="${idx}">
                    <i data-lucide="x"></i>
                </button>
            </span>
        `).join('');
    }

    /**
     * Show quick edit modal for today's meal - supports multiple items and Adult/Kids variants
     */
    function showQuickEditModal(memberId, mealType) {
        const today = DateUtils.today();
        const widgetData = Storage.getWidgetData(memberId, 'meal-plan') || { weeklyPlan: {}, recipes: [] };
        const settings = Storage.getSettings();
        const kidsMenuEnabled = settings.meals?.kidsMenuEnabled === true;

        // Use normalized day plan to handle both old and new formats
        const dayPlan = normalizeDayPlan(widgetData.weeklyPlan?.[today]);
        let currentVariant = 'adult';
        const adultSlot = normalizeMealSlot(dayPlan.adult?.[mealType]);
        const kidsSlot = normalizeMealSlot(dayPlan.kids?.[mealType]);
        let mealItems = [...adultSlot.items];

        const content = `
            <form id="editMealForm">
                ${kidsMenuEnabled ? `
                    <div class="form-group">
                        <div class="meal-variant-selector">
                            <button type="button" class="variant-btn variant-btn--active" data-variant="adult">
                                <i data-lucide="user"></i> Adult
                            </button>
                            <button type="button" class="variant-btn" data-variant="kids">
                                <i data-lucide="baby"></i> Kids
                                ${kidsSlot.items.length > 0 && JSON.stringify(kidsSlot.items) !== JSON.stringify(adultSlot.items) ? '<span class="variant-btn__indicator"></span>' : ''}
                            </button>
                        </div>
                    </div>
                ` : ''}
                <div class="form-group">
                    <label class="form-label">What's for ${mealType}?</label>
                    <div class="meal-tags-container" id="mealTagsContainer">
                        <div class="meal-tags" id="mealTags">
                            ${renderMealTags(mealItems)}
                        </div>
                        <input type="text" class="meal-tags-input" id="mealNameInput" placeholder="${mealItems.length > 0 ? 'Add another item...' : 'Type a meal and press Enter...'}">
                    </div>
                    <p class="form-hint">Press Enter or click a suggestion to add multiple items</p>
                </div>
                ${renderRecipeSuggestions(memberId, mealType)}
                <div class="form-group">
                    <label class="form-label">Quick picks</label>
                    <div class="meal-suggestions">
                        ${getMealSuggestions(mealType).map(s => `
                            <button type="button" class="meal-suggestion" data-suggestion="${s}">${s}</button>
                        `).join('')}
                    </div>
                </div>
            </form>
        `;

        Modal.open({
            title: `Today's ${capitalizeFirst(mealType)}`,
            content,
            footer: `
                <button class="btn btn--secondary" data-modal-cancel>Cancel</button>
                <button class="btn btn--primary" id="saveMealBtn">Save</button>
            `
        });

        // Initialize icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        const mealInput = document.getElementById('mealNameInput');
        const mealTagsEl = document.getElementById('mealTags');
        mealInput?.focus();

        // Setup autocomplete
        if (mealInput) {
            setupMealAutocomplete(mealInput, memberId, (selectedName) => {
                addMealItem(selectedName);
            });
        }

        // Function to add a meal item
        function addMealItem(itemName) {
            const trimmed = itemName.trim();
            if (!trimmed) return;
            if (mealItems.includes(trimmed)) {
                Toast.info('Item already added');
                return;
            }
            mealItems.push(trimmed);
            updateTagsDisplay();
            mealInput.value = '';
            mealInput.placeholder = 'Add another item...';
            mealInput.focus();
        }

        // Function to remove a meal item
        function removeMealItem(index) {
            mealItems.splice(index, 1);
            updateTagsDisplay();
            if (mealItems.length === 0) {
                mealInput.placeholder = 'Type a meal and press Enter...';
            }
        }

        // Update the tags display
        function updateTagsDisplay() {
            mealTagsEl.innerHTML = renderMealTags(mealItems);
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
            // Rebind remove buttons
            mealTagsEl.querySelectorAll('.meal-tag__remove').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const idx = parseInt(btn.dataset.removeIndex, 10);
                    removeMealItem(idx);
                });
            });
        }

        // Initial binding for remove buttons
        updateTagsDisplay();

        // Variant selector (if kids menu enabled)
        document.querySelectorAll('.variant-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const newVariant = btn.dataset.variant;
                if (newVariant === currentVariant) return;

                currentVariant = newVariant;

                // Update button states
                document.querySelectorAll('.variant-btn').forEach(b => {
                    b.classList.toggle('variant-btn--active', b.dataset.variant === newVariant);
                });

                // Update modal title
                const modalTitle = document.querySelector('.modal__title');
                if (modalTitle) {
                    modalTitle.textContent = `Today's ${capitalizeFirst(mealType)} (${newVariant === 'adult' ? 'Adult' : 'Kids'})`;
                }

                // Load the new variant's items
                const freshData = Storage.getWidgetData(memberId, 'meal-plan') || { weeklyPlan: {}, recipes: [] };
                const freshDayPlan = normalizeDayPlan(freshData.weeklyPlan?.[today]);
                const freshSlot = normalizeMealSlot(freshDayPlan[newVariant]?.[mealType]);
                mealItems = [...freshSlot.items];
                updateTagsDisplay();
                mealInput.placeholder = mealItems.length > 0 ? 'Add another item...' : 'Type a meal and press Enter...';
            });
        });

        // Recipe clicks - add to tags
        document.querySelectorAll('.meal-recipe').forEach(btn => {
            btn.addEventListener('click', () => {
                addMealItem(btn.dataset.recipeName);
            });
        });

        // Suggestion clicks - add to tags
        document.querySelectorAll('.meal-suggestion').forEach(btn => {
            btn.addEventListener('click', () => {
                addMealItem(btn.dataset.suggestion);
            });
        });

        // Cancel
        document.querySelector('[data-modal-cancel]')?.addEventListener('click', () => {
            Modal.close();
        });

        // Save
        document.getElementById('saveMealBtn')?.addEventListener('click', () => {
            // Add any text in input as final item
            const remaining = mealInput?.value?.trim();
            if (remaining && !mealItems.includes(remaining)) {
                mealItems.push(remaining);
            }
            saveMeal(memberId, today, mealType, mealItems.length > 0 ? mealItems : null, currentVariant);
            Modal.close();
            Toast.success('Meal saved!');
        });

        // Enter to add item (only if no autocomplete item selected)
        mealInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const autocomplete = document.querySelector('.meal-autocomplete');
                const hasSelection = autocomplete?.querySelector('.meal-autocomplete__item--selected');
                if (!hasSelection) {
                    addMealItem(mealInput.value);
                }
            }
        });
    }

    /**
     * Save a meal to storage and refresh widget
     * @param {string} memberId - The member ID
     * @param {string} date - The date string (ISO format)
     * @param {string} mealType - The meal type (breakfast, lunch, dinner, snacks)
     * @param {string[]|null} mealItems - Array of meal items or null to clear
     * @param {string} variant - The variant ('adult' or 'kids'), defaults to 'adult'
     */
    function saveMeal(memberId, date, mealType, mealItems, variant = 'adult') {
        const widgetData = Storage.getWidgetData(memberId, 'meal-plan') || { weeklyPlan: {}, recipes: [] };

        // Get existing day plan and normalize it
        const existingDayPlan = normalizeDayPlan(widgetData.weeklyPlan?.[date]);

        // Update the specific variant's meal slot
        if (!existingDayPlan[variant]) {
            existingDayPlan[variant] = {};
        }

        if (mealItems && mealItems.length > 0) {
            existingDayPlan[variant][mealType] = {
                items: mealItems,
                protein: null,
                completed: false
            };
        } else {
            // Clear the meal slot
            delete existingDayPlan[variant][mealType];
        }

        const updatedPlan = {
            ...widgetData.weeklyPlan,
            [date]: existingDayPlan
        };

        const updatedData = {
            ...widgetData,
            weeklyPlan: updatedPlan
        };

        Storage.setWidgetData(memberId, 'meal-plan', updatedData);

        // Refresh the main widget if visible
        const widgetBody = document.getElementById('widget-meal-plan');
        if (widgetBody) {
            renderWidget(widgetBody, memberId);
        }
    }

    /**
     * Render a single variant's meal slot
     */
    function renderMealSlot(day, mealType, variant, variantPlan, recipes) {
        const slot = normalizeMealSlot(variantPlan[mealType]);
        const hasMeals = slot.items.length > 0;

        // Check if any meal has prep requirement
        const hasPrep = slot.items.some(itemName => {
            const recipe = recipes.find(r => r.name === itemName);
            return recipe?.requiresPrep;
        });

        return `
            <div class="planner-meal ${hasMeals ? 'planner-meal--filled' : ''} ${hasPrep ? 'planner-meal--has-prep' : ''}"
                 data-date="${day.date}"
                 data-meal-type="${mealType}"
                 data-variant="${variant}">
                <div class="planner-meal__header">
                    <i data-lucide="${getMealIcon(mealType)}"></i>
                    <span>${capitalizeFirst(mealType)}</span>
                    ${hasPrep ? `<i data-lucide="alert-triangle" class="planner-meal__prep-icon" title="Requires prep"></i>` : ''}
                </div>
                <div class="planner-meal__content">
                    ${hasMeals
                        ? slot.items.map(item => `<span class="planner-meal__item">${item}</span>`).join('')
                        : `<span class="planner-meal__add">+ Add</span>`
                    }
                </div>
                ${slot.protein ? `<span class="planner-meal__protein">${slot.protein}g</span>` : ''}
            </div>
        `;
    }

    /**
     * Truncate text and return with title for tooltip
     */
    function truncateWithTooltip(text, maxLength = 18) {
        if (text.length <= maxLength) {
            return { display: text, needsTooltip: false };
        }
        return {
            display: text.substring(0, maxLength - 1) + '…',
            needsTooltip: true,
            full: text
        };
    }

    /**
     * Render table cell content for a meal slot
     */
    function renderTableCell(day, mealType, variant, variantPlan, recipes, showCopyFromAdult = false, kidsMenuEnabled = false, kidsPlan = null) {
        const slot = normalizeMealSlot(variantPlan?.[mealType]);
        const hasMeals = slot.items.length > 0;
        const isCompleted = slot.completed === true;
        const isPastOrToday = day.date <= DateUtils.today();

        // Check kids meal status if enabled
        const kidsSlot = kidsMenuEnabled && kidsPlan ? normalizeMealSlot(kidsPlan[mealType]) : null;
        const hasKidsMeal = kidsSlot && kidsSlot.items.length > 0;
        const kidsMealDiffers = hasKidsMeal && JSON.stringify(kidsSlot.items) !== JSON.stringify(slot.items);

        // Check if meal has prep requirement (recipe-based or custom prep notes)
        const hasRecipePrep = slot.items.some(itemName => {
            const recipe = recipes.find(r => r.name === itemName);
            return recipe?.requiresPrep;
        });
        const hasCustomPrep = slot.prepNotes && slot.prepNotes.trim().length > 0;
        const hasPrep = hasRecipePrep || hasCustomPrep;

        // Helper to escape HTML entities for attributes
        const escapeAttr = (str) => str ? str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';
        const prepTooltip = escapeAttr(hasCustomPrep ? slot.prepNotes : (hasRecipePrep ? 'Recipe requires prep' : ''));

        // Build classes
        const classes = ['planner-cell'];
        if (hasMeals) classes.push('planner-cell--filled');
        if (hasPrep) classes.push('planner-cell--prep');
        if (day.isToday) classes.push('planner-cell--today');
        if (isCompleted) classes.push('planner-cell--completed');

        // Get recipe icons for items
        function getRecipeIcon(itemName) {
            const recipe = recipes.find(r => r.name === itemName);
            return recipe?.icon || null;
        }

        return `
            <td class="${classes.join(' ')}"
                data-date="${day.date}"
                data-meal-type="${mealType}"
                data-variant="${variant}"
                ${day.isToday ? 'data-is-today="true"' : ''}>
                ${hasMeals ? `
                    <div class="planner-cell__content">
                        ${isPastOrToday ? `
                            <button class="planner-cell__check ${isCompleted ? 'planner-cell__check--done' : ''}"
                                    data-toggle-complete
                                    data-date="${day.date}"
                                    data-meal-type="${mealType}"
                                    data-variant="${variant}"
                                    title="${isCompleted ? 'Mark as not eaten' : 'Mark as eaten'}">
                                <i data-lucide="${isCompleted ? 'check-circle-2' : 'circle'}"></i>
                            </button>
                        ` : ''}
                        <div class="planner-cell__items ${isCompleted ? 'planner-cell__items--done' : ''}">
                            ${slot.items.map(item => {
                                const truncated = truncateWithTooltip(item, 20);
                                const icon = getRecipeIcon(item);
                                return `<span class="planner-cell__item" ${truncated.needsTooltip ? `title="${item}"` : ''}>
                                    ${icon ? `<i data-lucide="${icon}" class="planner-cell__item-icon"></i>` : ''}
                                    ${truncated.display}
                                </span>`;
                            }).join('')}
                        </div>
                        ${kidsMenuEnabled && hasMeals ? `
                            <button class="planner-cell__kids-btn ${kidsMealDiffers ? 'planner-cell__kids-btn--differs' : ''}"
                                    data-customize-kids
                                    data-date="${day.date}"
                                    data-meal-type="${mealType}"
                                    title="${kidsMealDiffers ? `Kids: ${kidsSlot.items.join(', ')}` : 'Customize for Kids'}">
                                <i data-lucide="baby"></i>
                                ${kidsMealDiffers ? '<span class="planner-cell__kids-indicator"></span>' : ''}
                            </button>
                        ` : ''}
                    </div>
                ` : `
                    <span class="planner-cell__add">
                        <i data-lucide="plus"></i>
                        <span>Add</span>
                    </span>
                `}
                ${slot.protein ? `<span class="planner-cell__protein">${slot.protein}g</span>` : ''}
                ${hasPrep ? `<span class="planner-cell__prep-indicator" data-tooltip="${prepTooltip}"><i data-lucide="chef-hat"></i></span>` : ''}
                ${showCopyFromAdult && !hasMeals ? `
                    <button class="planner-cell__copy-adult"
                            data-copy-adult
                            data-date="${day.date}"
                            data-meal-type="${mealType}"
                            title="Copy from Adult">
                        <i data-lucide="copy"></i>
                    </button>
                ` : ''}
            </td>
        `;
    }

    /**
     * Render accordion day card for mobile view
     */
    function renderAccordionDay(day, _currentView, recipes, kidsMenuEnabled = false) {
        const displayMealTypes = DISPLAY_MEAL_TYPES; // ['breakfast', 'lunch', 'snacks', 'dinner']

        // Count meals for adult view
        const variantPlan = day.plan.adult || {};
        const totalMealCount = displayMealTypes.filter(mealType => {
            const slot = normalizeMealSlot(variantPlan[mealType]);
            return slot.items.length > 0;
        }).length;

        return `
            <div class="accordion-day ${day.isToday ? 'accordion-day--today' : ''}"
                 data-date="${day.date}"
                 style="--day-bg: ${day.colors.bg}; --day-border: ${day.colors.border}; --day-text: ${day.colors.text};">
                <button class="accordion-day__header" data-accordion-toggle="${day.date}">
                    <div class="accordion-day__header-left">
                        <i data-lucide="chevron-right" class="accordion-day__chevron"></i>
                        <div class="accordion-day__date">
                            <span class="accordion-day__day-name">${day.dayName.toUpperCase()}</span>
                            <span class="accordion-day__day-date">${day.monthName} ${day.dateNum}</span>
                        </div>
                    </div>
                    <div class="accordion-day__header-right">
                        ${totalMealCount > 0
                            ? `<span class="accordion-day__meal-count">${totalMealCount} meal${totalMealCount !== 1 ? 's' : ''}</span>`
                            : `<span class="accordion-day__meal-count accordion-day__meal-count--empty">No meals</span>`
                        }
                        ${day.isToday ? '<span class="accordion-day__today-badge">Today</span>' : ''}
                    </div>
                </button>
                <div class="accordion-day__content" data-accordion-content="${day.date}">
                    ${displayMealTypes.map(mealType => renderAccordionMeal(day, mealType, 'adult', day.plan.adult || {}, recipes, null, kidsMenuEnabled, day.plan.kids)).join('')}
                    ${day.adultProtein > 0 ? `
                        <div class="accordion-protein">
                            <i data-lucide="beef"></i>
                            <span>Total Protein: <strong>${day.adultProtein}g</strong></span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Render individual meal in accordion view
     */
    function renderAccordionMeal(day, mealType, variant, variantPlan, recipes, _adultPlan = null, kidsMenuEnabled = false, kidsPlan = null) {
        const slot = normalizeMealSlot(variantPlan[mealType]);
        const hasMeals = slot.items.length > 0;
        const isCompleted = slot.completed === true;
        const isPastOrToday = day.date <= DateUtils.today();

        // Check kids meal status if enabled
        const kidsSlot = kidsMenuEnabled && kidsPlan ? normalizeMealSlot(kidsPlan[mealType]) : null;
        const hasKidsMeal = kidsSlot && kidsSlot.items.length > 0;
        const kidsMealDiffers = hasKidsMeal && JSON.stringify(kidsSlot.items) !== JSON.stringify(slot.items);

        // Check if meal has custom prep notes
        const hasCustomPrep = slot.prepNotes && slot.prepNotes.trim().length > 0;

        return `
            <div class="accordion-meal ${hasMeals ? 'accordion-meal--filled' : ''} ${isCompleted ? 'accordion-meal--completed' : ''}"
                 data-date="${day.date}"
                 data-meal-type="${mealType}"
                 data-variant="${variant}">
                <div class="accordion-meal__header">
                    <div class="accordion-meal__label">
                        <i data-lucide="${getMealIcon(mealType)}"></i>
                        <span>${capitalizeFirst(mealType)}</span>
                    </div>
                    <div class="accordion-meal__actions">
                        ${kidsMenuEnabled && hasMeals ? `
                            <button class="accordion-meal__kids-btn ${kidsMealDiffers ? 'accordion-meal__kids-btn--differs' : ''}"
                                    data-customize-kids
                                    data-date="${day.date}"
                                    data-meal-type="${mealType}"
                                    title="${kidsMealDiffers ? `Kids: ${kidsSlot.items.join(', ')}` : 'Customize for Kids'}">
                                <i data-lucide="baby"></i>
                                ${kidsMealDiffers ? '<span class="accordion-meal__kids-indicator"></span>' : ''}
                            </button>
                        ` : ''}
                        ${hasMeals && isPastOrToday ? `
                            <button class="accordion-meal__check ${isCompleted ? 'accordion-meal__check--done' : ''}"
                                    data-toggle-complete
                                    data-date="${day.date}"
                                    data-meal-type="${mealType}"
                                    data-variant="${variant}"
                                    title="${isCompleted ? 'Mark as not eaten' : 'Mark as eaten'}">
                                <i data-lucide="${isCompleted ? 'check-circle-2' : 'circle'}"></i>
                            </button>
                        ` : ''}
                    </div>
                </div>
                ${hasMeals ? `
                    <div class="accordion-meal__items ${isCompleted ? 'accordion-meal__items--done' : ''}">
                        ${slot.items.map(item => {
                            const recipe = recipes.find(r => r.name === item);
                            const icon = recipe?.icon || null;
                            return `<span class="accordion-meal__item">
                                ${icon ? `<i data-lucide="${icon}"></i>` : ''}
                                ${item}
                                ${recipe?.requiresPrep ? '<i data-lucide="alert-triangle" class="accordion-meal__prep-icon"></i>' : ''}
                            </span>`;
                        }).join('')}
                    </div>
                    ${kidsMealDiffers ? `
                        <div class="accordion-meal__kids-info">
                            <i data-lucide="baby"></i>
                            <span>Kids: ${kidsSlot.items.join(', ')}</span>
                        </div>
                    ` : ''}
                    ${slot.protein ? `<div class="accordion-meal__protein"><i data-lucide="beef"></i>${slot.protein}g protein</div>` : ''}
                    ${hasCustomPrep ? `<div class="accordion-meal__prep-note"><i data-lucide="chef-hat"></i><span>${slot.prepNotes}</span></div>` : ''}
                ` : `
                    <div class="accordion-meal__add">
                        <i data-lucide="plus"></i>
                        <span>Add meal</span>
                    </div>
                `}
            </div>
        `;
    }

    /**
     * Get all prep items for the week, grouped by the day before they're needed
     * (because prep happens the day before)
     * Includes both recipe-based prep (requiresPrep flag) and custom prep notes from meal slots
     */
    function getWeekPrepItems(days, memberId) {
        const recipes = getAllRecipes(memberId);
        const prepByDay = {};

        // Helper to add a prep item
        function addPrepItem(prepDate, prepDayIndex, day, itemName, prepInstructions, mealType, variant, isCustomNote = false) {
            if (!prepByDay[prepDate]) {
                prepByDay[prepDate] = {
                    dayName: prepDayIndex >= 0 ? days[prepDayIndex].shortName : 'Before',
                    dateNum: prepDayIndex >= 0 ? days[prepDayIndex].dateNum : '',
                    forDay: day.shortName,
                    forDateNum: day.dateNum,
                    items: []
                };
            }
            // Create unique key to avoid duplicates
            const uniqueKey = isCustomNote ? `custom:${day.date}:${mealType}:${variant}` : `recipe:${itemName}`;
            const exists = prepByDay[prepDate].items.some(i => i.uniqueKey === uniqueKey);
            if (!exists) {
                prepByDay[prepDate].items.push({
                    recipeName: itemName,
                    prepInstructions: prepInstructions,
                    forMeal: mealType,
                    variant: variant,
                    isCustomNote: isCustomNote,
                    uniqueKey: uniqueKey
                });
            }
        }

        days.forEach((day, dayIndex) => {
            // Get prep items needed for this day
            VARIANTS.forEach(variant => {
                MEAL_TYPES.forEach(mealType => {
                    const slot = normalizeMealSlot(day.plan[variant]?.[mealType]);

                    // Check for custom prep notes on the meal slot (takes priority)
                    if (slot.prepNotes && slot.prepNotes.trim()) {
                        const prepDayIndex = dayIndex - 1;
                        const prepDate = prepDayIndex >= 0 ? days[prepDayIndex].date : 'before-week';
                        // Use meal items as the name, or meal type if no items
                        const itemLabel = slot.items.length > 0 ? slot.items.join(', ') : capitalizeFirst(mealType);
                        addPrepItem(prepDate, prepDayIndex, day, itemLabel, slot.prepNotes, mealType, variant, true);
                    }

                    // Also check recipes that require prep
                    slot.items.forEach(itemName => {
                        const recipe = recipes.find(r => r.name === itemName);
                        if (recipe?.requiresPrep) {
                            const prepDayIndex = dayIndex - 1;
                            const prepDate = prepDayIndex >= 0 ? days[prepDayIndex].date : 'before-week';
                            addPrepItem(prepDate, prepDayIndex, day, itemName, recipe.prepInstructions || 'Prep required', mealType, variant, false);
                        }
                    });
                });
            });
        });

        return prepByDay;
    }

    /**
     * Get prep completion status from storage
     */
    function getPrepCompletions(memberId) {
        const widgetData = Storage.getWidgetData(memberId, 'meal-plan') || {};
        return widgetData.prepCompleted || {};
    }

    /**
     * Toggle prep completion status
     */
    function togglePrepCompletion(memberId, prepDate, recipeName) {
        const widgetData = Storage.getWidgetData(memberId, 'meal-plan') || {};
        const prepCompleted = widgetData.prepCompleted || {};
        const key = `${prepDate}:${recipeName}`;

        if (prepCompleted[key]) {
            delete prepCompleted[key];
        } else {
            prepCompleted[key] = true;
        }

        Storage.setWidgetData(memberId, 'meal-plan', {
            ...widgetData,
            prepCompleted
        });

        return prepCompleted[key] || false;
    }

    /**
     * Render the prep sidebar HTML
     */
    function renderPrepSidebar(prepByDay, days, memberId) {
        const sortedDates = Object.keys(prepByDay).sort((a, b) => {
            if (a === 'before-week') return -1;
            if (b === 'before-week') return 1;
            return a.localeCompare(b);
        });

        const prepCompleted = getPrepCompletions(memberId);

        if (sortedDates.length === 0) {
            return `
                <div class="prep-sidebar">
                    <div class="prep-sidebar__header">
                        <i data-lucide="clock"></i>
                        <span>Prep Schedule</span>
                    </div>
                    <div class="prep-sidebar__empty">
                        <i data-lucide="check-circle"></i>
                        <p>No prep needed this week!</p>
                    </div>
                </div>
            `;
        }

        // Count completed items
        let totalItems = 0;
        let completedItems = 0;
        sortedDates.forEach(date => {
            prepByDay[date].items.forEach(item => {
                totalItems++;
                const key = `${date}:${item.recipeName}`;
                if (prepCompleted[key]) completedItems++;
            });
        });

        return `
            <div class="prep-sidebar">
                <div class="prep-sidebar__header">
                    <i data-lucide="clock"></i>
                    <span>Prep Schedule</span>
                    <span class="prep-sidebar__progress">${completedItems}/${totalItems}</span>
                </div>
                <div class="prep-sidebar__content">
                    ${sortedDates.map(date => {
                        const dayPrep = prepByDay[date];
                        return `
                            <div class="prep-sidebar__day">
                                <div class="prep-sidebar__day-header">
                                    <span class="prep-sidebar__day-name">${dayPrep.dayName} ${dayPrep.dateNum}</span>
                                    <span class="prep-sidebar__for-label">for ${dayPrep.forDay} ${dayPrep.forDateNum}</span>
                                </div>
                                <div class="prep-sidebar__items">
                                    ${dayPrep.items.map(item => {
                                        const key = `${date}:${item.recipeName}`;
                                        const isCompleted = prepCompleted[key] || false;
                                        return `
                                            <label class="prep-sidebar__item ${isCompleted ? 'prep-sidebar__item--done' : ''}"
                                                   data-prep-date="${date}"
                                                   data-prep-recipe="${item.recipeName}">
                                                <input type="checkbox" class="prep-sidebar__checkbox"
                                                       ${isCompleted ? 'checked' : ''}>
                                                <div class="prep-sidebar__item-content">
                                                    <div class="prep-sidebar__item-name">
                                                        <i data-lucide="chef-hat"></i>
                                                        ${item.recipeName}
                                                    </div>
                                                    <div class="prep-sidebar__item-instructions">
                                                        ${item.prepInstructions}
                                                    </div>
                                                </div>
                                            </label>
                                        `;
                                    }).join('')}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Show full-page weekly planner with tabbed interface
     */
    function showWeeklyPlannerPage(memberId, activeTab = 'week') {
        currentMemberId = memberId;
        const main = document.getElementById('mainContent');
        if (!main) return;

        const member = Storage.getMember(memberId);
        renderPlannerPage(main, memberId, member, activeTab);
    }

    /**
     * Render the meal planner page with tabbed interface
     */
    function renderPlannerPage(container, memberId, member, activeTab = 'week') {
        const widgetData = Storage.getWidgetData(memberId, 'meal-plan') || { weeklyPlan: {}, recipes: [] };
        const recipes = getAllRecipes(memberId);
        const tomorrow = getTomorrowDate();
        const tomorrowPrepNeeded = currentWeekOffset === 0 ? getMealsNeedingPrep(tomorrow, memberId) : [];

        // Check if kids menu is enabled
        const settings = Storage.getSettings();
        const kidsMenuEnabled = settings.meals?.kidsMenuEnabled === true;

        // Get week data with offset support
        const weekStart = getWeekStartWithOffset(currentWeekOffset);
        const days = [];

        for (let i = 0; i < 7; i++) {
            const date = DateUtils.addDays(weekStart, i);
            const dateStr = DateUtils.formatISO(date);
            const dayOfWeek = date.getDay();
            const dayPlan = normalizeDayPlan(widgetData.weeklyPlan?.[dateStr]);
            days.push({
                date: dateStr,
                dayName: DateUtils.getDayName(date, false),
                shortName: DateUtils.getDayName(date, true),
                dateNum: date.getDate(),
                monthName: date.toLocaleDateString('en-US', { month: 'short' }),
                isToday: DateUtils.isToday(date),
                plan: dayPlan,
                dayOfWeek: dayOfWeek,
                colors: DAY_COLORS[dayOfWeek],
                adultProtein: calculateDayProtein(dayPlan.adult, memberId)
            });
        }

        // Calculate stats for hero header
        let mealsPlannedThisWeek = 0;
        let totalProteinThisWeek = 0;
        days.forEach(day => {
            MEAL_TYPES.forEach(type => {
                const slot = normalizeMealSlot(day.plan.adult?.[type]);
                if (slot.items.length > 0) mealsPlannedThisWeek++;
            });
            totalProteinThisWeek += day.adultProtein;
        });

        // Count total recipes
        const totalRecipes = recipes.length;

        container.innerHTML = `
            <div class="meals-page meals-page--tabbed">
                <!-- Hero Header -->
                <div class="meals-page__hero">
                    <button class="btn btn--ghost meals-page__back" id="backToMemberBtn">
                        <i data-lucide="arrow-left"></i>
                        Back
                    </button>
                    <div class="meals-page__hero-content">
                        <h1 class="meals-page__hero-title">
                            <i data-lucide="utensils"></i>
                            Meal Planner
                        </h1>
                        <p class="meals-page__hero-subtitle">Plan your week, eat well</p>
                    </div>
                    <div class="meals-page__hero-stats">
                        <div class="meals-hero-stat">
                            <span class="meals-hero-stat__value">${mealsPlannedThisWeek}</span>
                            <span class="meals-hero-stat__label">Meals Planned</span>
                        </div>
                        <div class="meals-hero-stat">
                            <span class="meals-hero-stat__value">${totalProteinThisWeek}g</span>
                            <span class="meals-hero-stat__label">Weekly Protein</span>
                        </div>
                        <div class="meals-hero-stat">
                            <span class="meals-hero-stat__value">${totalRecipes}</span>
                            <span class="meals-hero-stat__label">Recipes</span>
                        </div>
                    </div>
                </div>

                <!-- Tab Navigation -->
                <div class="meals-page__tabs">
                    <button class="meals-tab ${activeTab === 'week' ? 'meals-tab--active' : ''}" data-tab="week">
                        <i data-lucide="calendar"></i>
                        Week
                    </button>
                    <button class="meals-tab ${activeTab === 'stats' ? 'meals-tab--active' : ''}" data-tab="stats">
                        <i data-lucide="bar-chart-2"></i>
                        Stats
                    </button>
                    <button class="meals-tab ${activeTab === 'prep' ? 'meals-tab--active' : ''}" data-tab="prep">
                        <i data-lucide="chef-hat"></i>
                        Prep
                    </button>
                </div>

                <!-- Tab Content -->
                <div class="meals-page__content">
                    ${activeTab === 'week' ? renderWeekTab(days, widgetData, recipes, tomorrowPrepNeeded, kidsMenuEnabled, memberId) : ''}
                    ${activeTab === 'stats' ? renderMealStatsTab(days, widgetData, recipes, memberId) : ''}
                    ${activeTab === 'prep' ? renderPrepTab(days, memberId) : ''}
                </div>
            </div>
        `;

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Bind events
        bindPlannerPageEvents(container, memberId, member, activeTab);
    }

    /**
     * Render the Week tab content
     */
    function renderWeekTab(days, widgetData, recipes, tomorrowPrepNeeded, kidsMenuEnabled, memberId) {
        const displayMealTypes = DISPLAY_MEAL_TYPES;

        // Check if there's a previous week with actual meal data to copy
        const prevWeekStart = getWeekStartWithOffset(currentWeekOffset - 1);
        let prevWeekHasData = false;
        for (let i = 0; i < 7; i++) {
            const dateStr = DateUtils.formatISO(DateUtils.addDays(prevWeekStart, i));
            if (widgetData.weeklyPlan?.[dateStr]) {
                const dayPlan = normalizeDayPlan(widgetData.weeklyPlan[dateStr]);
                if (VARIANTS.some(v => MEAL_TYPES.some(m => normalizeMealSlot(dayPlan[v]?.[m]).items.length > 0))) {
                    prevWeekHasData = true;
                    break;
                }
            }
        }

        // Check if current week is empty
        let currentWeekEmpty = true;
        for (let i = 0; i < 7; i++) {
            const dateStr = days[i].date;
            if (widgetData.weeklyPlan?.[dateStr]) {
                const dayPlan = normalizeDayPlan(widgetData.weeklyPlan[dateStr]);
                if (VARIANTS.some(v => MEAL_TYPES.some(m => normalizeMealSlot(dayPlan[v]?.[m]).items.length > 0))) {
                    currentWeekEmpty = false;
                    break;
                }
            }
        }

        return `
            <div class="meals-week-section">
                <!-- Week Navigation -->
                <div class="meals-week-nav">
                    <button class="meals-week-nav__btn" id="prevWeekBtn" title="Previous week">
                        <i data-lucide="chevron-left"></i>
                    </button>
                    <div class="meals-week-nav__info">
                        <span class="meals-week-nav__label">
                            ${days[0].monthName} ${days[0].dateNum} - ${days[6].monthName} ${days[6].dateNum}
                        </span>
                        ${currentWeekOffset === 0 ? '<span class="meals-week-nav__badge meals-week-nav__badge--current">This Week</span>' : ''}
                        ${currentWeekOffset < 0 ? `<span class="meals-week-nav__badge meals-week-nav__badge--past">${Math.abs(currentWeekOffset)} week${Math.abs(currentWeekOffset) > 1 ? 's' : ''} ago</span>` : ''}
                        ${currentWeekOffset > 0 ? `<span class="meals-week-nav__badge meals-week-nav__badge--future">In ${currentWeekOffset} week${currentWeekOffset > 1 ? 's' : ''}</span>` : ''}
                    </div>
                    <button class="meals-week-nav__btn" id="nextWeekBtn" title="Next week">
                        <i data-lucide="chevron-right"></i>
                    </button>
                    ${currentWeekOffset !== 0 ? `
                        <button class="btn btn--ghost btn--sm" id="todayBtn" title="Go to current week">
                            <i data-lucide="calendar-check"></i>
                            Today
                        </button>
                    ` : ''}
                </div>

                ${prevWeekHasData && currentWeekEmpty ? `
                    <div class="meals-copy-prompt">
                        <i data-lucide="lightbulb"></i>
                        <span>Week is empty</span>
                        <button class="btn btn--secondary btn--sm" id="copyPrevWeekBtn">
                            <i data-lucide="copy"></i>
                            Copy Last Week
                        </button>
                    </div>
                ` : ''}

                ${tomorrowPrepNeeded.length > 0 ? `
                    <div class="meals-prep-alert">
                        <i data-lucide="alert-triangle"></i>
                        <div>
                            <strong>Prep needed for tomorrow:</strong>
                            <span>${tomorrowPrepNeeded.map(p => `${p.recipeName}${p.prepInstructions ? ` (${p.prepInstructions})` : ''}`).join(', ')}</span>
                        </div>
                    </div>
                ` : ''}

                <div class="planner-layout">
                    <div class="planner-table-wrapper">
                        <table class="planner-table planner-table--flipped">
                            <thead>
                                <tr>
                                    <th class="planner-table__corner planner-table__corner--day">Day</th>
                                    ${displayMealTypes.map(mealType => `
                                        <th class="planner-table__meal-header">
                                            <i data-lucide="${getMealIcon(mealType)}"></i>
                                            <span>${capitalizeFirst(mealType)}</span>
                                        </th>
                                    `).join('')}
                                    <th class="planner-table__meal-header planner-table__meal-header--protein">
                                        <i data-lucide="beef"></i>
                                        <span>Protein</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                ${days.map(day => `
                                    <tr class="planner-table__row ${day.isToday ? 'planner-table__row--today' : ''}"
                                        style="--day-bg: ${day.colors.bg}; --day-border: ${day.colors.border}; --day-text: ${day.colors.text};">
                                        <td class="planner-table__day-label">
                                            <span class="planner-table__day-name">${day.shortName}</span>
                                            <span class="planner-table__day-date">${day.monthName} ${day.dateNum}</span>
                                        </td>
                                        ${displayMealTypes.map(mealType => renderTableCell(day, mealType, 'adult', day.plan.adult, recipes, false, kidsMenuEnabled, day.plan.kids)).join('')}
                                        <td class="planner-cell planner-cell--protein-total">
                                            ${day.adultProtein > 0 ? `<span>${day.adultProtein}g</span>` : '<span class="text-muted">-</span>'}
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>

                    <!-- Mobile Accordion View -->
                    <div class="planner-accordion">
                        ${days.map(day => renderAccordionDay(day, currentView, recipes, kidsMenuEnabled)).join('')}
                    </div>
                </div>

                <div class="meals-week-footer">
                    <p class="meals-week-tip">
                        <i data-lucide="lightbulb"></i>
                        Click on any cell to add or edit meals
                    </p>
                    <button class="btn btn--primary" id="goToGroceryBtn">
                        <i data-lucide="shopping-cart"></i>
                        Go to Shopping List
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Render the Stats tab content
     */
    function renderMealStatsTab(days, widgetData, recipes, memberId) {
        // Calculate nutrition stats
        let totalMealsPlanned = 0;
        let totalMealsCompleted = 0;
        let totalProtein = 0;
        const mealTypeCount = { breakfast: 0, lunch: 0, dinner: 0, snacks: 0 };

        days.forEach(day => {
            MEAL_TYPES.forEach(type => {
                const slot = normalizeMealSlot(day.plan.adult?.[type]);
                if (slot.items.length > 0) {
                    totalMealsPlanned++;
                    mealTypeCount[type]++;
                    if (slot.completed) totalMealsCompleted++;
                }
            });
            totalProtein += day.adultProtein;
        });

        const completionRate = totalMealsPlanned > 0 ? Math.round((totalMealsCompleted / totalMealsPlanned) * 100) : 0;
        const avgDailyProtein = Math.round(totalProtein / 7);

        // Most used recipes this week
        const recipeUsage = {};
        days.forEach(day => {
            MEAL_TYPES.forEach(type => {
                const slot = normalizeMealSlot(day.plan.adult?.[type]);
                slot.items.forEach(item => {
                    recipeUsage[item] = (recipeUsage[item] || 0) + 1;
                });
            });
        });
        const topRecipes = Object.entries(recipeUsage)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        return `
            <div class="meals-stats-section">
                <div class="meals-stats-grid">
                    <div class="meals-stat-card meals-stat-card--primary">
                        <div class="meals-stat-card__icon">
                            <i data-lucide="utensils"></i>
                        </div>
                        <div class="meals-stat-card__info">
                            <span class="meals-stat-card__value">${totalMealsPlanned}</span>
                            <span class="meals-stat-card__label">Meals Planned</span>
                        </div>
                    </div>
                    <div class="meals-stat-card meals-stat-card--success">
                        <div class="meals-stat-card__icon">
                            <i data-lucide="check-circle"></i>
                        </div>
                        <div class="meals-stat-card__info">
                            <span class="meals-stat-card__value">${completionRate}%</span>
                            <span class="meals-stat-card__label">Completed</span>
                        </div>
                    </div>
                    <div class="meals-stat-card meals-stat-card--info">
                        <div class="meals-stat-card__icon">
                            <i data-lucide="beef"></i>
                        </div>
                        <div class="meals-stat-card__info">
                            <span class="meals-stat-card__value">${totalProtein}g</span>
                            <span class="meals-stat-card__label">Total Protein</span>
                        </div>
                    </div>
                    <div class="meals-stat-card meals-stat-card--warning">
                        <div class="meals-stat-card__icon">
                            <i data-lucide="trending-up"></i>
                        </div>
                        <div class="meals-stat-card__info">
                            <span class="meals-stat-card__value">${avgDailyProtein}g</span>
                            <span class="meals-stat-card__label">Avg Daily Protein</span>
                        </div>
                    </div>
                </div>

                <div class="meals-breakdown-card">
                    <div class="meals-breakdown-card__header">
                        <i data-lucide="pie-chart"></i>
                        <span>Meals by Type</span>
                    </div>
                    <div class="meals-breakdown-card__content">
                        <div class="meals-breakdown-card__grid">
                            ${DISPLAY_MEAL_TYPES.map(type => `
                                <div class="meals-breakdown-card__item">
                                    <i data-lucide="${getMealIcon(type)}"></i>
                                    <span class="meals-breakdown-card__count">${mealTypeCount[type]}</span>
                                    <span class="meals-breakdown-card__label">${capitalizeFirst(type)}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>

                ${topRecipes.length > 0 ? `
                    <div class="meals-recipes-card">
                        <div class="meals-recipes-card__header">
                            <i data-lucide="star"></i>
                            <span>Most Used This Week</span>
                        </div>
                        <div class="meals-recipes-card__content">
                            <div class="meals-recipes-card__list">
                                ${topRecipes.map(([name, count], index) => `
                                    <div class="meals-recipes-card__item">
                                        <span class="meals-recipes-card__rank">${index + 1}</span>
                                        <span class="meals-recipes-card__name">${name}</span>
                                        <span class="meals-recipes-card__uses">${count}x</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                ` : ''}

                <div class="meals-protein-card">
                    <div class="meals-protein-card__header">
                        <i data-lucide="activity"></i>
                        <span>Daily Protein Breakdown</span>
                    </div>
                    <div class="meals-protein-card__content">
                        <div class="meals-protein-card__days">
                            ${days.map(day => `
                                <div class="meals-protein-card__day ${day.isToday ? 'meals-protein-card__day--today' : ''}">
                                    <span class="meals-protein-card__day-name">${day.shortName}</span>
                                    <div class="meals-protein-card__bar-container">
                                        <div class="meals-protein-card__bar" style="height: ${Math.min(100, (day.adultProtein / 150) * 100)}%"></div>
                                    </div>
                                    <span class="meals-protein-card__day-value">${day.adultProtein}g</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render the Prep tab content
     */
    function renderPrepTab(days, memberId) {
        const prepByDay = getWeekPrepItems(days, memberId);
        const prepDays = Object.keys(prepByDay).filter(date => prepByDay[date].items && prepByDay[date].items.length > 0).sort();

        if (prepDays.length === 0) {
            return `
                <div class="meals-prep-section">
                    <div class="meals-prep-empty">
                        <i data-lucide="chef-hat"></i>
                        <p>No prep needed this week</p>
                        <span>Add prep notes when editing meals, or mark recipes as "requires prep"</span>
                    </div>
                </div>
            `;
        }

        return `
            <div class="meals-prep-section">
                <div class="meals-prep-intro">
                    <i data-lucide="info"></i>
                    <p>Items that need advance preparation are listed below. Check them off as you complete prep work.</p>
                </div>

                <div class="meals-prep-list">
                    ${prepDays.map(date => {
                        const dayData = prepByDay[date];
                        const items = dayData.items;
                        const prepCompletions = getPrepCompletions(memberId);
                        const dateObj = DateUtils.parseLocalDate(date);
                        const dayName = DateUtils.getDayName(dateObj, false);
                        const dayNum = dateObj.getDate();
                        const monthName = dateObj.toLocaleDateString('en-US', { month: 'short' });

                        return `
                            <div class="meals-prep-day">
                                <div class="meals-prep-day__header">
                                    <span class="meals-prep-day__date">${dayName}, ${monthName} ${dayNum}</span>
                                    <span class="meals-prep-day__count">${items.length} item${items.length > 1 ? 's' : ''}</span>
                                </div>
                                <div class="meals-prep-day__items">
                                    ${items.map(item => {
                                        const completionKey = `${date}:${item.recipeName}`;
                                        const isCompleted = prepCompletions[completionKey] || false;
                                        return `
                                        <label class="meals-prep-item ${item.isCustomNote ? 'meals-prep-item--custom' : ''}" data-prep-date="${date}" data-prep-recipe="${item.recipeName}">
                                            <input type="checkbox" class="meals-prep-item__checkbox" ${isCompleted ? 'checked' : ''}>
                                            <div class="meals-prep-item__content ${isCompleted ? 'meals-prep-item__content--done' : ''}">
                                                <span class="meals-prep-item__name">${item.recipeName}</span>
                                                ${item.prepInstructions ? `<span class="meals-prep-item__instructions">${item.prepInstructions}</span>` : ''}
                                                <span class="meals-prep-item__meal">${capitalizeFirst(item.forMeal)}</span>
                                            </div>
                                        </label>
                                    `;}).join('')}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Bind events for the tabbed planner page
     */
    function bindPlannerPageEvents(container, memberId, member, activeTab) {
        // Back button
        document.getElementById('backToMemberBtn')?.addEventListener('click', () => {
            currentWeekOffset = 0;
            State.emit('tabChanged', memberId);
        });

        // Tab switching
        container.querySelectorAll('.meals-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const newTab = tab.dataset.tab;
                renderPlannerPage(container, memberId, member, newTab);
            });
        });

        // Tab-specific events
        if (activeTab === 'week') {
            bindWeekTabEvents(container, memberId, member);
        }

        if (activeTab === 'prep') {
            bindPrepTabEvents(container, memberId, member);
        }
    }

    /**
     * Bind events for the Week tab
     */
    function bindWeekTabEvents(container, memberId, member) {
        // Week navigation buttons
        document.getElementById('prevWeekBtn')?.addEventListener('click', () => {
            currentWeekOffset--;
            renderPlannerPage(container, memberId, member, 'week');
        });

        document.getElementById('nextWeekBtn')?.addEventListener('click', () => {
            currentWeekOffset++;
            renderPlannerPage(container, memberId, member, 'week');
        });

        document.getElementById('todayBtn')?.addEventListener('click', () => {
            currentWeekOffset = 0;
            renderPlannerPage(container, memberId, member, 'week');
        });

        // Copy previous week button
        document.getElementById('copyPrevWeekBtn')?.addEventListener('click', () => {
            const copied = copyPreviousWeekPlan(memberId, currentWeekOffset - 1, currentWeekOffset);
            if (copied > 0) {
                Toast.success(`Copied ${copied} day${copied > 1 ? 's' : ''} from last week!`);
                renderPlannerPage(container, memberId, member, 'week');
            } else {
                Toast.info('No meals found in previous week');
            }
        });

        // Accordion toggle (mobile)
        document.querySelectorAll('[data-accordion-toggle]').forEach(btn => {
            btn.addEventListener('click', () => {
                const date = btn.dataset.accordionToggle;
                const accordionDay = btn.closest('.accordion-day');
                const content = document.querySelector(`[data-accordion-content="${date}"]`);
                const chevron = btn.querySelector('.accordion-day__chevron');

                if (!accordionDay || !content) return;

                const isExpanded = accordionDay.classList.contains('accordion-day--expanded');

                if (isExpanded) {
                    // Collapse
                    accordionDay.classList.remove('accordion-day--expanded');
                    content.style.maxHeight = '0px';
                } else {
                    // Collapse all others first
                    document.querySelectorAll('.accordion-day--expanded').forEach(other => {
                        other.classList.remove('accordion-day--expanded');
                        const otherContent = other.querySelector('.accordion-day__content');
                        if (otherContent) otherContent.style.maxHeight = '0px';
                    });

                    // Expand this one
                    accordionDay.classList.add('accordion-day--expanded');
                    content.style.maxHeight = content.scrollHeight + 'px';
                }
            });
        });

        // Auto-expand today's accordion on mobile
        const todayAccordion = document.querySelector('.accordion-day--today');
        if (todayAccordion && window.innerWidth <= 768) {
            const todayButton = todayAccordion.querySelector('[data-accordion-toggle]');
            if (todayButton) {
                todayButton.click();
            }
        }

        // Accordion meals - click to edit (mobile)
        document.querySelectorAll('.accordion-meal[data-date]').forEach(meal => {
            meal.addEventListener('click', (e) => {
                // Don't trigger if clicking on a button inside
                if (e.target.closest('button')) return;
                const date = meal.dataset.date;
                const mealType = meal.dataset.mealType;
                const variant = meal.dataset.variant;
                showMealEditModal(memberId, date, mealType, variant);
            });
        });

        // Go to shopping list button
        document.getElementById('goToGroceryBtn')?.addEventListener('click', () => {
            if (typeof Grocery !== 'undefined' && Grocery.showGroceryListPage) {
                Grocery.showGroceryListPage(memberId);
            } else {
                Toast.info('Shopping list feature coming soon!');
            }
        });

        // Table cells - open modal on click with variant (but not on buttons)
        document.querySelectorAll('.planner-cell[data-date]').forEach(cell => {
            cell.addEventListener('click', (e) => {
                // Don't trigger if clicking on a button inside the cell
                if (e.target.closest('button')) return;
                const date = cell.dataset.date;
                const mealType = cell.dataset.mealType;
                const variant = cell.dataset.variant;
                showMealEditModal(memberId, date, mealType, variant);
            });
        });

        // Meal completion toggle buttons (works for both desktop table and mobile accordion)
        document.querySelectorAll('[data-toggle-complete]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const date = btn.dataset.date;
                const mealType = btn.dataset.mealType;
                const variant = btn.dataset.variant;

                const isCompleted = toggleMealCompletion(memberId, date, mealType, variant);

                // Update UI immediately - support both desktop (planner-cell) and mobile (accordion-meal)
                const cell = btn.closest('.planner-cell');
                const accordionMeal = btn.closest('.accordion-meal');
                const icon = btn.querySelector('i');

                if (cell) {
                    // Desktop table view
                    const itemsContainer = cell.querySelector('.planner-cell__items');
                    btn.classList.toggle('planner-cell__check--done', isCompleted);
                    cell.classList.toggle('planner-cell--completed', isCompleted);
                    itemsContainer?.classList.toggle('planner-cell__items--done', isCompleted);
                } else if (accordionMeal) {
                    // Mobile accordion view
                    const itemsContainer = accordionMeal.querySelector('.accordion-meal__items');
                    btn.classList.toggle('accordion-meal__check--done', isCompleted);
                    accordionMeal.classList.toggle('accordion-meal--completed', isCompleted);
                    itemsContainer?.classList.toggle('accordion-meal__items--done', isCompleted);
                }

                // Update icon - use direct SVG update for better mobile performance
                if (icon) {
                    const newIconName = isCompleted ? 'check-circle-2' : 'circle';
                    icon.setAttribute('data-lucide', newIconName);
                    // Only update this specific icon, not all icons on page
                    if (typeof lucide !== 'undefined') {
                        lucide.createIcons({ nodes: [icon] });
                    }
                }

                if (isCompleted) {
                    Toast.success('Marked as eaten!');
                }
            });
        });

        // Copy from adult buttons
        document.querySelectorAll('[data-copy-adult]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const date = btn.dataset.date;
                const mealType = btn.dataset.mealType;

                const success = copyAdultToKids(memberId, date, mealType);
                if (success) {
                    Toast.success('Copied from Adult!');
                    renderPlannerPage(container, memberId, member, 'week');
                }
            });
        });

        // Customize for kids buttons
        document.querySelectorAll('[data-customize-kids]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const date = btn.dataset.date;
                const mealType = btn.dataset.mealType;
                showMealEditModal(memberId, date, mealType, 'kids');
            });
        });
    }

    /**
     * Bind events for the Prep tab
     */
    function bindPrepTabEvents(container, memberId, member) {
        // Prep item checkboxes
        document.querySelectorAll('.meals-prep-item__checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const item = e.target.closest('.meals-prep-item');
                const prepDate = item.dataset.prepDate;
                const recipeName = item.dataset.prepRecipe;

                const isNowCompleted = togglePrepCompletion(memberId, prepDate, recipeName);

                // Update UI immediately
                const content = item.querySelector('.meals-prep-item__content');
                content?.classList.toggle('meals-prep-item__content--done', isNowCompleted);
            });
        });
    }

    /**
     * Legacy event bindings (kept for compatibility)
     */
    function bindLegacyPrepEvents(memberId) {
        // Prep sidebar checkboxes (old sidebar style)
        document.querySelectorAll('.prep-sidebar__checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const item = e.target.closest('.prep-sidebar__item');
                const prepDate = item.dataset.prepDate;
                const recipeName = item.dataset.prepRecipe;

                const isNowCompleted = togglePrepCompletion(memberId, prepDate, recipeName);

                // Update UI immediately
                item.classList.toggle('prep-sidebar__item--done', isNowCompleted);

                // Update progress counter
                const progressEl = document.querySelector('.prep-sidebar__progress');
                if (progressEl) {
                    const allCheckboxes = document.querySelectorAll('.prep-sidebar__checkbox');
                    const checkedCount = document.querySelectorAll('.prep-sidebar__checkbox:checked').length;
                    progressEl.textContent = `${checkedCount}/${allCheckboxes.length}`;
                }
            });
        });
    }

    /**
     * Show modal to edit meal for a specific date - supports multiple items and variants
     */
    function showMealEditModal(memberId, date, mealType, variant = 'adult') {
        const widgetData = Storage.getWidgetData(memberId, 'meal-plan') || { weeklyPlan: {}, recipes: [] };
        const dayPlan = normalizeDayPlan(widgetData.weeklyPlan?.[date]);
        const slot = normalizeMealSlot(dayPlan[variant]?.[mealType]);
        let mealItems = [...slot.items];
        let mealProtein = slot.protein || null;
        let mealPrepNotes = slot.prepNotes || '';
        const recipes = getAllRecipes(memberId);

        // Use DateUtils.parseLocalDate to avoid timezone issues with YYYY-MM-DD strings
        const dateObj = DateUtils.parseLocalDate(date);
        const dayName = DateUtils.getDayName(dateObj, false);
        const dateDisplay = dateObj.getDate();

        // Calculate protein from recipes if not manually set
        function getDefaultProtein() {
            let total = 0;
            mealItems.forEach(itemName => {
                const recipe = recipes.find(r => r.name === itemName);
                if (recipe?.protein) total += recipe.protein;
            });
            return total;
        }

        const variantLabel = variant === 'adult' ? 'Adult (Low Carb)' : 'Kids';

        const content = `
            <form id="mealEditForm">
                <div class="form-group">
                    <label class="form-label">${dayName} ${dateDisplay} - ${capitalizeFirst(mealType)}</label>
                    <div class="meal-variant-selector">
                        <button type="button" class="variant-btn ${variant === 'adult' ? 'variant-btn--active' : ''}" data-variant="adult">
                            <i data-lucide="user"></i> Adult
                        </button>
                        <button type="button" class="variant-btn ${variant === 'kids' ? 'variant-btn--active' : ''}" data-variant="kids">
                            <i data-lucide="baby"></i> Kids
                        </button>
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">Meals</label>
                    <div class="meal-tags-container" id="mealTagsContainer">
                        <div class="meal-tags" id="mealTags">
                            ${renderMealTags(mealItems)}
                        </div>
                        <input type="text"
                               class="meal-tags-input"
                               id="mealEditInput"
                               placeholder="${mealItems.length > 0 ? 'Add another item...' : 'Type a meal and press Enter...'}"
                               autocomplete="off">
                    </div>
                    <p class="form-hint">Press Enter or click a suggestion to add multiple items</p>
                </div>

                ${variant === 'adult' ? `
                    <div class="form-group meal-protein-group">
                        <label class="form-label">
                            <i data-lucide="beef"></i>
                            Protein (grams)
                        </label>
                        <input type="number"
                               class="form-input meal-protein-input"
                               id="mealProteinInput"
                               value="${mealProtein || ''}"
                               placeholder="${getDefaultProtein() || 'Auto from recipes'}"
                               min="0">
                        <p class="form-hint">Leave empty to auto-calculate from recipes</p>
                    </div>
                ` : ''}

                <div class="form-group meal-prep-group">
                    <label class="form-label">
                        <i data-lucide="chef-hat"></i>
                        Prep Notes (optional)
                    </label>
                    <input type="text"
                           class="form-input"
                           id="mealPrepInput"
                           value="${mealPrepNotes}"
                           placeholder="e.g., Marinate chicken overnight, Soak beans..."
                           autocomplete="off">
                    <p class="form-hint">Add any prep needed the day before - will show in Prep tab</p>
                </div>

                <div class="form-group">
                    <label class="form-checkbox apply-both-checkbox">
                        <input type="checkbox" id="applyToBoth">
                        <span class="form-checkbox__label">
                            <i data-lucide="users"></i>
                            Apply to both Adult & Kids
                        </span>
                    </label>
                </div>

                ${renderRecipeSuggestions(memberId, mealType)}
                <div class="form-group">
                    <label class="form-label">Quick picks</label>
                    <div class="meal-suggestions">
                        ${getMealSuggestions(mealType).map(s => `
                            <button type="button" class="meal-suggestion" data-suggestion="${s}">${s}</button>
                        `).join('')}
                    </div>
                </div>
            </form>
        `;

        Modal.open({
            title: `Edit ${capitalizeFirst(mealType)} - ${variantLabel}`,
            content,
            footer: `
                <button class="btn btn--secondary" data-modal-cancel>Cancel</button>
                <button class="btn btn--danger btn--ghost" id="clearMealBtn" style="margin-right: auto;">Clear All</button>
                <button class="btn btn--primary" id="saveMealEditBtn">Save</button>
            `
        });

        // Initialize icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        const mealInput = document.getElementById('mealEditInput');
        const mealTagsEl = document.getElementById('mealTags');
        const proteinInput = document.getElementById('mealProteinInput');
        mealInput?.focus();

        // Variant selector - switch variants seamlessly (in-place update)
        document.querySelectorAll('.variant-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const newVariant = btn.dataset.variant;
                if (newVariant !== variant) {
                    // Update variant state
                    variant = newVariant;

                    // Update button active states
                    document.querySelectorAll('.variant-btn').forEach(b => {
                        b.classList.toggle('variant-btn--active', b.dataset.variant === newVariant);
                    });

                    // Load new variant's data
                    const freshData = Storage.getWidgetData(memberId, 'meal-plan') || { weeklyPlan: {}, recipes: [] };
                    const freshDayPlan = normalizeDayPlan(freshData.weeklyPlan?.[date]);
                    const freshSlot = normalizeMealSlot(freshDayPlan[newVariant]?.[mealType]);
                    mealItems = [...freshSlot.items];
                    mealProtein = freshSlot.protein || null;
                    mealPrepNotes = freshSlot.prepNotes || '';

                    // Update prep notes input
                    const prepInput = document.getElementById('mealPrepInput');
                    if (prepInput) {
                        prepInput.value = mealPrepNotes;
                    }

                    // Update modal title
                    const newVariantLabel = newVariant === 'adult' ? 'Adult (Low Carb)' : 'Kids';
                    const modalTitle = document.querySelector('.modal__title');
                    if (modalTitle) {
                        modalTitle.textContent = `Edit ${capitalizeFirst(mealType)} - ${newVariantLabel}`;
                    }

                    // Show/hide protein field based on variant
                    const proteinGroup = document.querySelector('.meal-protein-group');
                    if (newVariant === 'adult') {
                        // Add protein field if not present
                        if (!proteinGroup) {
                            const tagsContainer = document.getElementById('mealTagsContainer')?.closest('.form-group');
                            if (tagsContainer) {
                                const proteinHtml = `
                                    <div class="form-group meal-protein-group">
                                        <label class="form-label">
                                            <i data-lucide="beef"></i>
                                            Protein (grams)
                                        </label>
                                        <input type="number"
                                               class="form-input meal-protein-input"
                                               id="mealProteinInput"
                                               value="${mealProtein || ''}"
                                               placeholder="${getDefaultProtein() || 'Auto from recipes'}"
                                               min="0">
                                        <p class="form-hint">Leave empty to auto-calculate from recipes</p>
                                    </div>
                                `;
                                tagsContainer.insertAdjacentHTML('afterend', proteinHtml);
                                if (typeof lucide !== 'undefined') {
                                    lucide.createIcons();
                                }
                            }
                        } else {
                            // Update existing protein input
                            const proteinInputEl = document.getElementById('mealProteinInput');
                            if (proteinInputEl) {
                                proteinInputEl.value = mealProtein || '';
                                proteinInputEl.placeholder = getDefaultProtein() || 'Auto from recipes';
                            }
                        }
                    } else {
                        // Remove protein field for kids
                        if (proteinGroup) {
                            proteinGroup.remove();
                        }
                    }

                    // Update meal tags display
                    updateTagsDisplay();

                    // Update input placeholder
                    if (mealInput) {
                        mealInput.placeholder = mealItems.length > 0 ? 'Add another item...' : 'Type a meal and press Enter...';
                        mealInput.focus();
                    }
                }
            });
        });

        // Setup autocomplete with callback
        if (mealInput) {
            setupMealAutocomplete(mealInput, memberId, (selectedName) => {
                addMealItem(selectedName);
            });
        }

        // Function to add a meal item
        function addMealItem(itemName) {
            const trimmed = itemName.trim();
            if (!trimmed) return;
            if (mealItems.includes(trimmed)) {
                Toast.info('Item already added');
                return;
            }
            mealItems.push(trimmed);
            updateTagsDisplay();
            updateProteinPlaceholder();
            mealInput.value = '';
            mealInput.placeholder = 'Add another item...';
            mealInput.focus();
        }

        // Function to remove a meal item
        function removeMealItem(index) {
            mealItems.splice(index, 1);
            updateTagsDisplay();
            updateProteinPlaceholder();
            if (mealItems.length === 0) {
                mealInput.placeholder = 'Type a meal and press Enter...';
            }
        }

        // Update protein placeholder when items change
        function updateProteinPlaceholder() {
            if (proteinInput) {
                const defaultProtein = getDefaultProtein();
                proteinInput.placeholder = defaultProtein > 0 ? defaultProtein : 'Auto from recipes';
            }
        }

        // Update the tags display
        function updateTagsDisplay() {
            mealTagsEl.innerHTML = renderMealTags(mealItems);
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
            // Rebind remove buttons
            mealTagsEl.querySelectorAll('.meal-tag__remove').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const idx = parseInt(btn.dataset.removeIndex, 10);
                    removeMealItem(idx);
                });
            });
        }

        // Initial binding for remove buttons
        updateTagsDisplay();

        // Recipe clicks - add to tags
        document.querySelectorAll('.meal-recipe').forEach(btn => {
            btn.addEventListener('click', () => {
                addMealItem(btn.dataset.recipeName);
            });
        });

        // Suggestion clicks - add to tags
        document.querySelectorAll('.meal-suggestion').forEach(btn => {
            btn.addEventListener('click', () => {
                addMealItem(btn.dataset.suggestion);
            });
        });

        // Cancel button
        document.querySelector('[data-modal-cancel]')?.addEventListener('click', () => {
            Modal.close();
        });

        // Clear button - clears all items
        document.getElementById('clearMealBtn')?.addEventListener('click', () => {
            saveMealWithVariant(memberId, date, mealType, variant, null, null, null);
            Modal.close();
            showWeeklyPlannerPage(memberId);
            Toast.success('Meal cleared');
        });

        // Save button
        document.getElementById('saveMealEditBtn')?.addEventListener('click', () => {
            // Add any text in input as final item
            const remaining = mealInput?.value?.trim();
            if (remaining && !mealItems.includes(remaining)) {
                mealItems.push(remaining);
            }
            // Get protein value (only for adult variant)
            const proteinValue = proteinInput?.value ? parseInt(proteinInput.value, 10) : null;
            // Get prep notes
            const prepNotesValue = document.getElementById('mealPrepInput')?.value?.trim() || null;
            // Check if "Apply to Both" is checked
            const applyToBoth = document.getElementById('applyToBoth')?.checked;

            if (applyToBoth) {
                // Save to both variants
                saveMealWithVariant(memberId, date, mealType, 'adult', mealItems.length > 0 ? mealItems : null, proteinValue, prepNotesValue);
                saveMealWithVariant(memberId, date, mealType, 'kids', mealItems.length > 0 ? mealItems : null, null, prepNotesValue);
                Modal.close();
                showWeeklyPlannerPage(memberId);
                if (mealItems.length > 0) {
                    Toast.success('Meal saved for both Adult & Kids!');
                }
            } else {
                saveMealWithVariant(
                    memberId,
                    date,
                    mealType,
                    variant,
                    mealItems.length > 0 ? mealItems : null,
                    proteinValue,
                    prepNotesValue
                );
                Modal.close();
                showWeeklyPlannerPage(memberId);
                if (mealItems.length > 0) {
                    Toast.success('Meal saved!');
                }
            }
        });

        // Enter to add item (only if no autocomplete item selected)
        mealInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const autocomplete = document.querySelector('.meal-autocomplete');
                const hasSelection = autocomplete?.querySelector('.meal-autocomplete__item--selected');
                if (!hasSelection) {
                    addMealItem(mealInput.value);
                }
            }
        });
    }

    /**
     * Clear prep completion for a specific date and optional recipe
     */
    function clearPrepCompletionForDate(memberId, date, recipeName = null) {
        const widgetData = Storage.getWidgetData(memberId, 'meal-plan') || {};
        const prepCompleted = widgetData.prepCompleted || {};

        // Clear prep completions that involve this date (either as prep date or target date)
        Object.keys(prepCompleted).forEach(key => {
            const keyDate = key.split(':')[0];
            const keyRecipe = key.split(':')[1];

            // If recipeName specified, only clear that specific recipe's prep
            if (recipeName) {
                if (keyDate === date && keyRecipe === recipeName) {
                    delete prepCompleted[key];
                }
            } else {
                // Clear all prep completions for this date
                if (keyDate === date) {
                    delete prepCompleted[key];
                }
            }
        });

        widgetData.prepCompleted = prepCompleted;
        Storage.setWidgetData(memberId, 'meal-plan', widgetData);
    }

    /**
     * Save a meal with variant, protein, and prep notes support
     */
    function saveMealWithVariant(memberId, date, mealType, variant, items, protein, prepNotes = null) {
        const widgetData = Storage.getWidgetData(memberId, 'meal-plan') || { weeklyPlan: {}, recipes: [] };
        const dayPlan = normalizeDayPlan(widgetData.weeklyPlan?.[date]);

        // Update the specific variant's meal slot
        if (!dayPlan[variant]) {
            dayPlan[variant] = {};
        }

        if (items === null) {
            // Clear the meal
            dayPlan[variant][mealType] = { items: [], protein: null, prepNotes: null };
        } else {
            dayPlan[variant][mealType] = {
                items: items,
                protein: protein,
                prepNotes: prepNotes
            };
        }

        const updatedPlan = {
            ...widgetData.weeklyPlan,
            [date]: dayPlan
        };

        const updatedData = {
            ...widgetData,
            weeklyPlan: updatedPlan
        };

        Storage.setWidgetData(memberId, 'meal-plan', updatedData);

        // Clear prep completions for the day before (since prep is done day before)
        const prevDate = DateUtils.formatISO(DateUtils.addDays(new Date(date), -1));
        clearPrepCompletionForDate(memberId, prevDate);

        // Refresh the main widget if visible
        const widgetBody = document.getElementById('widget-meal-plan');
        if (widgetBody) {
            renderWidget(widgetBody, memberId);
        }
    }

    /**
     * Show meal plan import modal
     */
    function showMealPlanImportModal(memberId) {
        const widgetData = Storage.getWidgetData(memberId, 'meal-plan') || { weeklyPlan: {} };

        const content = `
            <div class="meal-import">
                <div class="meal-import__info">
                    <i data-lucide="info"></i>
                    <p>Paste your meal plan below. The format should be day-based with meals for each day.</p>
                </div>

                <div class="meal-import__format">
                    <details>
                        <summary><i data-lucide="help-circle"></i> Supported Format</summary>
                        <pre>
Monday:
Breakfast: Oatmeal with berries
Lunch: Grilled chicken salad
Dinner: Salmon with vegetables
Kids Dinner: Chicken nuggets, Mac and cheese
Snacks: Greek yogurt, Apple

Tuesday:
Breakfast: Eggs and toast
Kids Breakfast: Pancakes with syrup
Lunch: Turkey sandwich
Dinner: Pasta with marinara
Snacks: Nuts, Banana
                        </pre>
                        <p class="meal-import__format-notes">
                            <strong>Tips:</strong>
                            <br>• Use day names (Monday, Tuesday, etc.)
                            <br>• Add "Kids" prefix for kid-specific meals (e.g., "Kids Dinner:", "Kids Lunch:")
                            <br>• Meals without "Kids" prefix apply to Adults (or both if checkbox is checked)
                            <br>• Multiple items can be comma-separated
                            <br>• Use "---" to separate weeks
                        </p>
                    </details>
                </div>

                <div class="form-group">
                    <label class="form-label">Paste your meal plan</label>
                    <textarea
                        class="meal-import__textarea"
                        id="mealPlanImportText"
                        placeholder="Monday:
Breakfast: Oatmeal with berries
Lunch: Grilled chicken salad
Dinner: Salmon with vegetables
Kids Dinner: Chicken nuggets, Mac and cheese
Snacks: Greek yogurt, Apple

Tuesday:
..."
                        rows="12"></textarea>
                </div>

                <div class="meal-import__options">
                    <label class="form-checkbox">
                        <input type="checkbox" id="importStartThisWeek" checked>
                        <span class="form-checkbox__label">Start from this week (${getWeekStartWithOffset(0).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})</span>
                    </label>
                    <label class="form-checkbox">
                        <input type="checkbox" id="importBothVariants" checked>
                        <span class="form-checkbox__label">Apply to both Adult & Kids</span>
                    </label>
                </div>

                <div class="meal-import__preview" id="mealImportPreview" style="display: none;">
                    <h4><i data-lucide="eye"></i> Preview</h4>
                    <div class="meal-import__preview-content" id="mealImportPreviewContent"></div>
                </div>
            </div>
        `;

        Modal.open({
            title: 'Import Meal Plan',
            content,
            footer: `
                <button class="btn btn--secondary" data-modal-cancel>Cancel</button>
                <button class="btn btn--ghost" id="previewMealImportBtn">
                    <i data-lucide="eye"></i>
                    Preview
                </button>
                <button class="btn btn--primary" id="importMealPlanBtn">
                    <i data-lucide="file-text"></i>
                    Import
                </button>
            `,
            size: 'large'
        });

        // Initialize icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        const textArea = document.getElementById('mealPlanImportText');
        const previewContainer = document.getElementById('mealImportPreview');
        const previewContent = document.getElementById('mealImportPreviewContent');

        // Preview button
        document.getElementById('previewMealImportBtn')?.addEventListener('click', () => {
            const text = textArea.value.trim();
            if (!text) {
                Toast.warning('Please paste your meal plan first');
                return;
            }

            const parsed = parseMealPlanFromText(text);
            if (parsed.length === 0) {
                Toast.warning('Could not parse any meals. Check the format.');
                return;
            }

            // Show preview
            previewContainer.style.display = 'block';
            previewContent.innerHTML = renderMealPlanPreview(parsed);
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        });

        // Cancel button
        document.querySelector('[data-modal-cancel]')?.addEventListener('click', () => {
            Modal.close();
        });

        // Import button
        document.getElementById('importMealPlanBtn')?.addEventListener('click', () => {
            const text = textArea.value.trim();
            if (!text) {
                Toast.warning('Please paste your meal plan first');
                return;
            }

            const parsed = parseMealPlanFromText(text);
            if (parsed.length === 0) {
                Toast.warning('Could not parse any meals. Check the format.');
                return;
            }

            const startThisWeek = document.getElementById('importStartThisWeek')?.checked ?? true;
            const applyBothVariants = document.getElementById('importBothVariants')?.checked ?? true;

            // Import the meals
            const importedCount = importMealPlan(memberId, parsed, startThisWeek, applyBothVariants);

            Modal.close();

            // Wait for modal to close before refreshing and showing toast
            setTimeout(() => {
                Toast.success(`Imported ${importedCount} days of meals!`);

                // Refresh widget or page
                const widgetBody = document.getElementById('widget-meal-plan');
                if (widgetBody) {
                    renderWidget(widgetBody, memberId);
                }

                // If we're on the weekly planner page, refresh it
                const weeklyPlanner = document.querySelector('.weekly-planner');
                if (weeklyPlanner) {
                    showWeeklyPlannerPage(memberId);
                }
            }, 250);
        });
    }

    /**
     * Parse meal plan from text
     * @returns {Array} Array of day objects: { dayIndex: 0-6, variant: 'adult'|'kids'|'both', meals: { breakfast: [], lunch: [], dinner: [], snacks: [] } }
     */
    function parseMealPlanFromText(text) {
        const days = [];
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const mealTypeAliases = {
            'breakfast': 'breakfast',
            'bfast': 'breakfast',
            'morning': 'breakfast',
            'lunch': 'lunch',
            'afternoon': 'lunch',
            'dinner': 'dinner',
            'supper': 'dinner',
            'evening': 'dinner',
            'snacks': 'snacks',
            'snack': 'snacks'
        };

        // Split by lines
        const lines = text.split('\n').map(l => l.trim()).filter(l => l);

        let currentDay = null;
        let currentVariant = 'both';
        let currentMealType = null; // Track current meal type for multi-line entries

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Skip separator lines
            if (line.startsWith('---')) continue;

            // Check for day name
            const lowerLine = line.toLowerCase();
            let foundDay = false;
            for (let j = 0; j < dayNames.length; j++) {
                if (lowerLine.startsWith(dayNames[j])) {
                    // New day found
                    if (currentDay) {
                        days.push(currentDay);
                    }
                    currentDay = {
                        dayIndex: j,
                        dayName: dayNames[j].charAt(0).toUpperCase() + dayNames[j].slice(1),
                        variant: 'both',
                        meals: {
                            breakfast: [],
                            lunch: [],
                            dinner: [],
                            snacks: []
                        }
                    };
                    currentVariant = 'both';
                    currentMealType = null; // Reset meal type on new day
                    foundDay = true;
                    break;
                }
            }

            if (foundDay) continue;
            if (!currentDay) continue;

            // Check for variant prefix (Adult: or Kids:)
            if (lowerLine.startsWith('adult:') || lowerLine.startsWith('adult -')) {
                currentVariant = 'adult';
                currentMealType = null;
                continue;
            }
            if (lowerLine.startsWith('kids:') || lowerLine.startsWith('kids -') || lowerLine.startsWith('kid:')) {
                currentVariant = 'kids';
                currentMealType = null;
                continue;
            }

            // Check for meal type (with optional "Kids" or "Adult" prefix)
            let foundMealType = false;
            for (const [alias, mealType] of Object.entries(mealTypeAliases)) {
                // Match meal type with optional "Kids"/"Adult" prefix and optional content
                // Patterns: "Breakfast:", "Kids Breakfast:", "Adult Dinner:", etc.
                const kidsRegex = new RegExp(`^kids?\\s+${alias}[:\\s-]*(.*)`, 'i');
                const adultRegex = new RegExp(`^adults?\\s+${alias}[:\\s-]*(.*)`, 'i');
                const normalRegex = new RegExp(`^${alias}[:\\s-]*(.*)`, 'i');

                let match = null;
                let lineVariant = currentVariant;

                // Check for kids-prefixed meal type first
                const kidsMatch = line.match(kidsRegex);
                if (kidsMatch) {
                    match = kidsMatch;
                    lineVariant = 'kids';
                } else {
                    // Check for adult-prefixed meal type
                    const adultMatch = line.match(adultRegex);
                    if (adultMatch) {
                        match = adultMatch;
                        lineVariant = 'adult';
                    } else {
                        // Check for normal meal type (uses current variant context)
                        match = line.match(normalRegex);
                    }
                }

                if (match) {
                    currentMealType = mealType;
                    foundMealType = true;

                    const mealContent = match[1].trim();

                    // If content exists on same line, add it
                    if (mealContent) {
                        // Split by comma to get multiple items
                        const items = mealContent.split(/[,;]/).map(item => item.trim()).filter(item => item);

                        if (items.length > 0) {
                            // Store with variant info
                            if (!currentDay.meals[mealType]) {
                                currentDay.meals[mealType] = [];
                            }

                            currentDay.meals[mealType].push({
                                variant: lineVariant,
                                items: items
                            });
                        }
                    }
                    break;
                }
            }

            // If no meal type found and we have a current meal type, this might be content for it
            if (!foundMealType && currentMealType && currentDay) {
                // This line is meal content for the current meal type
                const items = line.split(/[,;]/).map(item => item.trim()).filter(item => item);

                if (items.length > 0) {
                    if (!currentDay.meals[currentMealType]) {
                        currentDay.meals[currentMealType] = [];
                    }

                    if (currentVariant !== 'both') {
                        currentDay.meals[currentMealType].push({
                            variant: currentVariant,
                            items: items
                        });
                    } else {
                        currentDay.meals[currentMealType].push({
                            variant: 'both',
                            items: items
                        });
                    }
                }
            }
        }

        // Don't forget the last day
        if (currentDay) {
            days.push(currentDay);
        }

        return days;
    }

    /**
     * Render preview of parsed meal plan
     */
    function renderMealPlanPreview(parsed) {
        if (parsed.length === 0) {
            return '<p class="text-muted">No meals parsed</p>';
        }

        return `
            <div class="meal-import__preview-days">
                ${parsed.map(day => `
                    <div class="meal-import__preview-day">
                        <div class="meal-import__preview-day-header">
                            <i data-lucide="calendar"></i>
                            <strong>${day.dayName}</strong>
                        </div>
                        <div class="meal-import__preview-meals">
                            ${MEAL_TYPES.map(mealType => {
                                const mealEntries = day.meals[mealType] || [];
                                if (mealEntries.length === 0) return '';

                                // Combine all items for display
                                const allItems = [];
                                mealEntries.forEach(entry => {
                                    entry.items.forEach(item => {
                                        if (entry.variant === 'both') {
                                            allItems.push(item);
                                        } else {
                                            allItems.push(`${item} (${entry.variant})`);
                                        }
                                    });
                                });

                                return `
                                    <div class="meal-import__preview-meal">
                                        <span class="meal-import__preview-type">
                                            <i data-lucide="${getMealIcon(mealType)}"></i>
                                            ${capitalizeFirst(mealType)}:
                                        </span>
                                        <span class="meal-import__preview-items">${allItems.join(', ')}</span>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
            <p class="meal-import__preview-count">
                <i data-lucide="check-circle"></i>
                Found <strong>${parsed.length}</strong> day${parsed.length !== 1 ? 's' : ''} of meals
            </p>
        `;
    }

    /**
     * Clear prep completions for a specific week or all
     */
    function clearPrepCompletions(memberId, weekStart = null) {
        const widgetData = Storage.getWidgetData(memberId, 'meal-plan') || {};

        if (weekStart) {
            // Clear only prep completions for dates in the target week
            const prepCompleted = widgetData.prepCompleted || {};
            const weekEnd = DateUtils.addDays(weekStart, 7);

            Object.keys(prepCompleted).forEach(key => {
                const dateStr = key.split(':')[0];
                if (dateStr !== 'before-week') {
                    const date = new Date(dateStr);
                    if (date >= weekStart && date < weekEnd) {
                        delete prepCompleted[key];
                    }
                }
            });

            widgetData.prepCompleted = prepCompleted;
        } else {
            // Clear all prep completions
            widgetData.prepCompleted = {};
        }

        Storage.setWidgetData(memberId, 'meal-plan', widgetData);
    }

    /**
     * Import parsed meal plan to storage
     */
    function importMealPlan(memberId, parsed, startThisWeek, applyBothVariants) {
        const widgetData = Storage.getWidgetData(memberId, 'meal-plan') || {};
        // Ensure weeklyPlan exists
        if (!widgetData.weeklyPlan) {
            widgetData.weeklyPlan = {};
        }
        const weekStart = startThisWeek ? getWeekStartWithOffset(0) : getWeekStartWithOffset(currentWeekOffset);

        // Clear prep completions for the week being imported (inline to avoid race condition)
        const prepCompleted = widgetData.prepCompleted || {};
        const weekEnd = DateUtils.addDays(weekStart, 7);
        Object.keys(prepCompleted).forEach(key => {
            const dateStr = key.split(':')[0];
            if (dateStr !== 'before-week') {
                const date = new Date(dateStr);
                if (date >= weekStart && date < weekEnd) {
                    delete prepCompleted[key];
                }
            }
        });
        widgetData.prepCompleted = prepCompleted;

        let importedCount = 0;

        // First, clear meal data for all days in the target week before importing
        // This ensures old meals don't persist in the prep schedule
        for (let i = 0; i < 7; i++) {
            const targetDate = DateUtils.addDays(weekStart, i);
            const dateStr = DateUtils.formatISO(targetDate);
            // Reset to empty day plan
            widgetData.weeklyPlan[dateStr] = normalizeDayPlan(null);
        }

        parsed.forEach(day => {
            // Calculate the actual date based on day index
            const dayOffset = day.dayIndex; // 0 = Sunday, 1 = Monday, etc.
            const weekStartDayIndex = weekStart.getDay(); // What day of week is our week start

            // Find how many days from week start to this day
            let daysFromStart = dayOffset - weekStartDayIndex;
            if (daysFromStart < 0) daysFromStart += 7;

            const targetDate = DateUtils.addDays(weekStart, daysFromStart);
            const dateStr = DateUtils.formatISO(targetDate);

            // Get the (now empty) day plan
            const dayPlan = widgetData.weeklyPlan[dateStr];

            // Process each meal type
            MEAL_TYPES.forEach(mealType => {
                const mealEntries = day.meals[mealType] || [];
                if (mealEntries.length === 0) return;

                mealEntries.forEach(entry => {
                    const items = entry.items;

                    if (applyBothVariants || entry.variant === 'both') {
                        // Apply to both variants
                        if (!dayPlan.adult[mealType]) {
                            dayPlan.adult[mealType] = { items: [], protein: null };
                        }
                        dayPlan.adult[mealType].items = [...dayPlan.adult[mealType].items, ...items];

                        if (!dayPlan.kids[mealType]) {
                            dayPlan.kids[mealType] = { items: [], protein: null };
                        }
                        dayPlan.kids[mealType].items = [...dayPlan.kids[mealType].items, ...items];
                    } else if (entry.variant === 'adult') {
                        if (!dayPlan.adult[mealType]) {
                            dayPlan.adult[mealType] = { items: [], protein: null };
                        }
                        dayPlan.adult[mealType].items = [...dayPlan.adult[mealType].items, ...items];
                    } else if (entry.variant === 'kids') {
                        if (!dayPlan.kids[mealType]) {
                            dayPlan.kids[mealType] = { items: [], protein: null };
                        }
                        dayPlan.kids[mealType].items = [...dayPlan.kids[mealType].items, ...items];
                    }
                });
            });

            importedCount++;
        });

        Storage.setWidgetData(memberId, 'meal-plan', widgetData);
        return importedCount;
    }

    /**
     * Get meal suggestions based on type
     */
    function getMealSuggestions(mealType) {
        const suggestions = {
            breakfast: ['Oatmeal', 'Eggs & Toast', 'Pancakes', 'Smoothie', 'Cereal', 'Yogurt & Fruit'],
            lunch: ['Sandwich', 'Salad', 'Soup', 'Leftovers', 'Wrap', 'Rice Bowl'],
            dinner: ['Pasta', 'Grilled Chicken', 'Stir Fry', 'Tacos', 'Pizza', 'Fish & Veggies'],
            snacks: ['Fruit', 'Nuts', 'Cheese & Crackers', 'Veggies & Dip', 'Popcorn', 'Trail Mix']
        };
        return suggestions[mealType] || [];
    }

    /**
     * Get today's meals for dashboard
     */
    function getTodaysMeals(memberId) {
        const today = DateUtils.today();
        const widgetData = Storage.getWidgetData(memberId, 'meal-plan') || { weeklyPlan: {} };
        return widgetData.weeklyPlan?.[today] || null;
    }

    function init() {
        // Initialize meals feature
    }

    return {
        init,
        renderWidget,
        getTodaysMeals,
        showWeeklyPlannerPage,
        showMealPlanImportModal
    };
})();
