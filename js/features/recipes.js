/**
 * Recipes Feature
 * Full recipe manager with ingredients, instructions, tags, and meal plan integration
 */

const Recipes = (function() {
    // Sample recipes for demo
    const SAMPLE_RECIPES = [
        {
            id: 'sample-1',
            name: 'Chicken Alfredo',
            description: 'Creamy pasta with grilled chicken and parmesan',
            prepTime: 30,
            servings: 4,
            ingredients: ['1 lb fettuccine', '2 chicken breasts', '2 cups heavy cream', '1 cup parmesan', '4 cloves garlic'],
            instructions: 'Cook pasta. Grill chicken. Make sauce with cream and parmesan. Combine and serve.',
            tags: ['Dinner', 'Comfort Food'],
            color: '#6366F1',
            icon: 'utensils',
            calories: 650,
            carbs: 45,
            fat: 32,
            favorite: false,
            notes: ''
        },
        {
            id: 'sample-2',
            name: 'Caesar Salad',
            description: 'Fresh romaine with homemade caesar dressing',
            prepTime: 15,
            servings: 2,
            ingredients: ['1 head romaine', 'Caesar dressing', 'Croutons', 'Parmesan shavings'],
            instructions: 'Chop lettuce. Toss with dressing. Top with croutons and parmesan.',
            tags: ['Lunch', 'Healthy', 'Quick'],
            color: '#10B981',
            icon: 'salad',
            calories: 220,
            carbs: 12,
            fat: 16,
            favorite: true,
            notes: ''
        },
        {
            id: 'sample-3',
            name: 'Chocolate Lava Cake',
            description: 'Decadent chocolate cake with molten center',
            prepTime: 25,
            servings: 4,
            ingredients: ['4 oz dark chocolate', '1/2 cup butter', '2 eggs', '2 egg yolks', '1/4 cup sugar', '2 tbsp flour'],
            instructions: 'Melt chocolate and butter. Whisk eggs with sugar. Combine and bake at 425°F for 12 minutes.',
            tags: ['Dessert'],
            color: '#EC4899',
            icon: 'cake-slice',
            calories: 380,
            carbs: 28,
            fat: 26,
            favorite: false,
            notes: ''
        },
        {
            id: 'sample-4',
            name: 'Quick Tacos',
            description: 'Easy weeknight ground beef tacos',
            prepTime: 20,
            servings: 4,
            ingredients: ['1 lb ground beef', 'Taco seasoning', 'Tortillas', 'Lettuce', 'Cheese', 'Salsa'],
            instructions: 'Brown beef with seasoning. Warm tortillas. Assemble with toppings.',
            tags: ['Dinner', 'Quick'],
            color: '#F59E0B',
            icon: 'utensils',
            calories: 420,
            carbs: 32,
            fat: 22,
            favorite: true,
            notes: ''
        }
    ];

    // Sort options
    const SORT_OPTIONS = [
        { value: 'recent', label: 'Recently Added', icon: 'clock' },
        { value: 'name-asc', label: 'Name (A-Z)', icon: 'arrow-down-a-z' },
        { value: 'name-desc', label: 'Name (Z-A)', icon: 'arrow-up-z-a' },
        { value: 'prep-asc', label: 'Prep Time (Low-High)', icon: 'timer' },
        { value: 'prep-desc', label: 'Prep Time (High-Low)', icon: 'timer' },
        { value: 'favorites', label: 'Favorites First', icon: 'heart' }
    ];

    /**
     * Get widget data with defaults
     */
    function getWidgetData(memberId) {
        const storedData = Storage.getWidgetData(memberId, 'recipes') || {};
        let recipes = Array.isArray(storedData.recipes) ? storedData.recipes : [];

        // Add sample recipes if empty (for demo)
        if (recipes.length === 0) {
            recipes = [...SAMPLE_RECIPES];
            Storage.setWidgetData(memberId, 'recipes', { recipes, tags: [] });
        }

        return {
            recipes: recipes,
            tags: Array.isArray(storedData.tags) ? storedData.tags : []
        };
    }

    /**
     * Get all unique tags
     */
    function getAllTags(memberId) {
        const widgetData = getWidgetData(memberId);
        const tags = new Set();
        widgetData.recipes.forEach(r => {
            if (r.tags) r.tags.forEach(t => tags.add(t));
        });
        return Array.from(tags).sort();
    }

    /**
     * Sort recipes based on sort option
     */
    function sortRecipes(recipes, sortBy) {
        const sorted = [...recipes];
        switch (sortBy) {
            case 'name-asc':
                return sorted.sort((a, b) => a.name.localeCompare(b.name));
            case 'name-desc':
                return sorted.sort((a, b) => b.name.localeCompare(a.name));
            case 'prep-asc':
                return sorted.sort((a, b) => (a.prepTime || 999) - (b.prepTime || 999));
            case 'prep-desc':
                return sorted.sort((a, b) => (b.prepTime || 0) - (a.prepTime || 0));
            case 'favorites':
                return sorted.sort((a, b) => (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0));
            case 'recent':
            default:
                return sorted.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        }
    }

    /**
     * Toggle favorite status
     */
    function toggleFavorite(memberId, recipeId) {
        const data = getWidgetData(memberId);
        const recipe = data.recipes.find(r => r.id === recipeId);
        if (recipe) {
            recipe.favorite = !recipe.favorite;
            Storage.setWidgetData(memberId, 'recipes', data);
        }
        return recipe?.favorite;
    }

    /**
     * Get favorite count
     */
    function getFavoriteCount(memberId) {
        const data = getWidgetData(memberId);
        return data.recipes.filter(r => r.favorite).length;
    }

    /**
     * Render the recipes widget
     */
    function renderWidget(container, memberId) {
        const widgetData = getWidgetData(memberId);
        const recipes = widgetData.recipes;
        const recentRecipes = recipes.slice(0, 4);

        container.innerHTML = `
            <div class="recipes-widget">
                ${recipes.length === 0 ? `
                    <div class="recipes-widget__empty">
                        <div class="recipes-widget__empty-icon">
                            <i data-lucide="book-open"></i>
                        </div>
                        <p class="recipes-widget__empty-title">No recipes yet</p>
                        <p class="recipes-widget__empty-text">Add your favorite recipes to start your collection</p>
                        <button class="btn btn--primary btn--sm" data-action="add-recipe">
                            <i data-lucide="plus"></i>
                            Add First Recipe
                        </button>
                    </div>
                ` : `
                    <div class="recipes-widget__stats">
                        <div class="recipes-widget__stat">
                            <span class="recipes-widget__stat-value">${recipes.length}</span>
                            <span class="recipes-widget__stat-label">Recipes</span>
                        </div>
                        <div class="recipes-widget__stat">
                            <span class="recipes-widget__stat-value">${getFavoriteCount(memberId)}</span>
                            <span class="recipes-widget__stat-label">Favorites</span>
                        </div>
                        <div class="recipes-widget__stat">
                            <span class="recipes-widget__stat-value">${getAllTags(memberId).length}</span>
                            <span class="recipes-widget__stat-label">Tags</span>
                        </div>
                    </div>

                    <div class="recipes-widget__section">
                        <h4 class="recipes-widget__section-title">Recent Recipes</h4>
                        <div class="recipes-widget__scroll">
                            ${recentRecipes.map(recipe => `
                                <button class="recipe-chip" data-recipe-id="${recipe.id}" style="--recipe-color: ${recipe.color || '#6366F1'};">
                                    ${recipe.image ? `
                                        <div class="recipe-chip__thumb">
                                            <img src="${recipe.image}" alt="${recipe.name}">
                                        </div>
                                    ` : `
                                        <div class="recipe-chip__icon">
                                            <i data-lucide="${recipe.icon || 'utensils'}"></i>
                                        </div>
                                    `}
                                    <span class="recipe-chip__name">${recipe.name}</span>
                                </button>
                            `).join('')}
                        </div>
                    </div>

                    <div class="recipes-widget__footer">
                        <button class="btn btn--sm btn--ghost" data-action="view-all">
                            <i data-lucide="book-open"></i>
                            View All
                        </button>
                        <button class="btn btn--sm btn--ghost" data-action="import-recipes">
                            <i data-lucide="file-text"></i>
                            Import
                        </button>
                        <button class="btn btn--sm btn--primary" data-action="add-recipe">
                            <i data-lucide="plus"></i>
                            Add
                        </button>
                    </div>
                `}
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
        container.querySelectorAll('[data-action="add-recipe"]').forEach(btn => {
            btn.addEventListener('click', () => showAddRecipeModal(memberId));
        });

        container.querySelector('[data-action="view-all"]')?.addEventListener('click', () => {
            showRecipesPage(memberId);
        });

        container.querySelector('[data-action="import-recipes"]')?.addEventListener('click', () => {
            showBulkImportModal(memberId);
        });

        container.querySelectorAll('.recipe-chip').forEach(card => {
            card.addEventListener('click', () => {
                showRecipeDetail(memberId, card.dataset.recipeId);
            });
        });
    }

    /**
     * Show recipes page
     */
    function showRecipesPage(memberId) {
        const main = document.getElementById('mainContent');
        if (!main) return;
        const member = Storage.getMember(memberId);
        renderRecipesPage(main, memberId, member, '', null);
    }

    /**
     * Render full recipes page
     */
    function renderRecipesPage(container, memberId, member, searchQuery, filterTag, sortBy = 'recent') {
        const widgetData = getWidgetData(memberId);
        let recipes = widgetData.recipes;
        const allTags = getAllTags(memberId);
        const favoriteCount = getFavoriteCount(memberId);

        // Apply filters
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            recipes = recipes.filter(r => r.name.toLowerCase().includes(q) || (r.description && r.description.toLowerCase().includes(q)));
        }
        if (filterTag) {
            if (filterTag === 'favorites') {
                recipes = recipes.filter(r => r.favorite);
            } else {
                recipes = recipes.filter(r => r.tags && r.tags.includes(filterTag));
            }
        }

        // Apply sorting
        recipes = sortRecipes(recipes, sortBy);

        container.innerHTML = `
            <div class="recipes-page">
                <!-- Colorful Hero Header -->
                <div class="recipes-page__hero">
                    <div class="recipes-page__hero-bg">
                        <div class="recipes-hero-shape recipes-hero-shape--1"></div>
                        <div class="recipes-hero-shape recipes-hero-shape--2"></div>
                        <div class="recipes-hero-shape recipes-hero-shape--3"></div>
                        <div class="recipes-hero-shape recipes-hero-shape--4"></div>
                    </div>
                    <div class="recipes-page__hero-content">
                        <button class="btn btn--ghost recipes-page__back" id="backToMemberBtn">
                            <i data-lucide="arrow-left"></i>
                            Back
                        </button>
                        <div class="recipes-page__hero-text">
                            <h1 class="recipes-page__hero-title">
                                <i data-lucide="chef-hat"></i>
                                Recipe Collection
                            </h1>
                            <p class="recipes-page__hero-subtitle">Discover, save, and organize your favorite meals</p>
                        </div>
                        <div class="recipes-page__hero-stats">
                            <div class="recipes-hero-stat">
                                <span class="recipes-hero-stat__value">${widgetData.recipes.length}</span>
                                <span class="recipes-hero-stat__label">Recipes</span>
                            </div>
                            <div class="recipes-hero-stat">
                                <span class="recipes-hero-stat__value">${favoriteCount}</span>
                                <span class="recipes-hero-stat__label">Favorites</span>
                            </div>
                            <div class="recipes-hero-stat">
                                <span class="recipes-hero-stat__value">${allTags.length}</span>
                                <span class="recipes-hero-stat__label">Categories</span>
                            </div>
                        </div>
                        <div class="recipes-page__hero-actions">
                            <button class="btn btn--primary btn--lg recipes-page__add-btn" data-action="add-recipe">
                                <i data-lucide="plus"></i>
                                Add Recipe
                            </button>
                            <button class="btn btn--secondary btn--lg" data-action="import-recipes">
                                <i data-lucide="file-text"></i>
                                Bulk Import
                            </button>
                        </div>
                    </div>
                </div>

                <div class="recipes-page__toolbar">
                    <div class="recipes-page__search">
                        <i data-lucide="search"></i>
                        <input type="text" class="form-input" id="recipeSearch" placeholder="Search recipes..." value="${searchQuery || ''}">
                    </div>
                    <div class="recipes-page__sort">
                        <label class="recipes-page__sort-label">
                            <i data-lucide="arrow-up-down"></i>
                            Sort:
                        </label>
                        <select class="form-input form-input--sm" id="recipeSort">
                            ${SORT_OPTIONS.map(opt => `
                                <option value="${opt.value}" ${sortBy === opt.value ? 'selected' : ''}>${opt.label}</option>
                            `).join('')}
                        </select>
                    </div>
                </div>

                <div class="recipes-page__filters">
                    <button class="recipes-filter ${!filterTag ? 'recipes-filter--active' : ''}" data-filter="">
                        <i data-lucide="grid-3x3"></i>
                        All
                    </button>
                    <button class="recipes-filter recipes-filter--favorites ${filterTag === 'favorites' ? 'recipes-filter--active' : ''}" data-filter="favorites">
                        <i data-lucide="heart"></i>
                        Favorites (${favoriteCount})
                    </button>
                    ${allTags.map(tag => `
                        <button class="recipes-filter ${filterTag === tag ? 'recipes-filter--active' : ''}" data-filter="${tag}">${tag}</button>
                    `).join('')}
                </div>

                <div class="recipes-page__content">
                    ${recipes.length === 0 ? `
                        <div class="recipes-page__empty">
                            <div class="recipes-page__empty-illustration">
                                <div class="recipes-empty-icon">
                                    <i data-lucide="book-open"></i>
                                </div>
                                <div class="recipes-empty-shapes">
                                    <span class="recipes-empty-shape"></span>
                                    <span class="recipes-empty-shape"></span>
                                    <span class="recipes-empty-shape"></span>
                                </div>
                            </div>
                            <h3>No recipes found</h3>
                            <p>Try a different search or filter, or add a new recipe!</p>
                            <button class="btn btn--primary" data-action="add-recipe">
                                <i data-lucide="plus"></i>
                                Add Your First Recipe
                            </button>
                        </div>
                    ` : `
                        <div class="recipes-grid">
                            ${recipes.map(recipe => `
                                <div class="recipe-card ${recipe.image ? 'recipe-card--has-image' : ''} ${recipe.favorite ? 'recipe-card--favorite' : ''}" data-recipe-id="${recipe.id}" style="--card-color: ${recipe.color || '#6366F1'};">
                                    <button class="recipe-card__favorite" data-action="toggle-favorite" data-id="${recipe.id}" title="${recipe.favorite ? 'Remove from favorites' : 'Add to favorites'}">
                                        <i data-lucide="${recipe.favorite ? 'heart' : 'heart'}"></i>
                                    </button>
                                    ${recipe.image ? `
                                        <div class="recipe-card__image">
                                            <img src="${recipe.image}" alt="${recipe.name}">
                                        </div>
                                    ` : ''}
                                    <div class="recipe-card__header">
                                        <div class="recipe-card__icon">
                                            <i data-lucide="${recipe.icon || 'utensils'}"></i>
                                        </div>
                                        <div class="recipe-card__actions">
                                            <button class="recipe-card__action" data-action="edit" data-id="${recipe.id}">
                                                <i data-lucide="pencil"></i>
                                            </button>
                                            <button class="recipe-card__action recipe-card__action--delete" data-action="delete" data-id="${recipe.id}">
                                                <i data-lucide="trash-2"></i>
                                            </button>
                                        </div>
                                    </div>
                                    <div class="recipe-card__body">
                                        <h3 class="recipe-card__name">${recipe.name}</h3>
                                        ${recipe.description ? `<p class="recipe-card__description">${recipe.description.substring(0, 60)}${recipe.description.length > 60 ? '...' : ''}</p>` : ''}
                                        <div class="recipe-card__meta">
                                            ${recipe.prepTime ? `<span class="recipe-card__meta-item"><i data-lucide="clock"></i>${recipe.prepTime}m</span>` : ''}
                                            ${recipe.servings ? `<span class="recipe-card__meta-item"><i data-lucide="users"></i>${recipe.servings}</span>` : ''}
                                            ${recipe.protein ? `<span class="recipe-card__meta-item recipe-card__meta-item--protein"><i data-lucide="beef"></i>${recipe.protein}g</span>` : ''}
                                            ${recipe.requiresPrep ? `<span class="recipe-card__meta-item recipe-card__meta-item--prep" title="Requires day-before prep"><i data-lucide="alert-triangle"></i></span>` : ''}
                                        </div>
                                        ${(recipe.calories || recipe.carbs || recipe.fat) ? `
                                            <div class="recipe-card__nutrition">
                                                ${recipe.calories ? `<span class="recipe-card__nutrition-item"><strong>${recipe.calories}</strong> cal</span>` : ''}
                                                ${recipe.carbs ? `<span class="recipe-card__nutrition-item"><strong>${recipe.carbs}g</strong> carbs</span>` : ''}
                                                ${recipe.fat ? `<span class="recipe-card__nutrition-item"><strong>${recipe.fat}g</strong> fat</span>` : ''}
                                            </div>
                                        ` : ''}
                                        ${recipe.tags && recipe.tags.length > 0 ? `
                                            <div class="recipe-card__tags">
                                                ${recipe.tags.map(tag => `<span class="recipe-tag">${tag}</span>`).join('')}
                                            </div>
                                        ` : ''}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>
            </div>
        `;

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Bind events
        document.getElementById('backToMemberBtn')?.addEventListener('click', () => {
            State.emit('tabChanged', memberId);
        });

        container.querySelectorAll('[data-action="add-recipe"]').forEach(btn => {
            btn.addEventListener('click', () => showAddRecipeModal(memberId, null, container, member));
        });

        // Import button
        container.querySelector('[data-action="import-recipes"]')?.addEventListener('click', () => {
            showBulkImportModal(memberId, container, member);
        });

        // Sort dropdown
        document.getElementById('recipeSort')?.addEventListener('change', (e) => {
            const tag = container.querySelector('.recipes-filter--active')?.dataset.filter || null;
            const query = document.getElementById('recipeSearch')?.value || '';
            renderRecipesPage(container, memberId, member, query, tag, e.target.value);
        });

        let searchTimeout;
        document.getElementById('recipeSearch')?.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const tag = container.querySelector('.recipes-filter--active')?.dataset.filter || null;
                const sort = document.getElementById('recipeSort')?.value || 'recent';
                renderRecipesPage(container, memberId, member, e.target.value, tag, sort);
            }, 300);
        });

        container.querySelectorAll('.recipes-filter').forEach(btn => {
            btn.addEventListener('click', () => {
                const tag = btn.dataset.filter || null;
                const query = document.getElementById('recipeSearch')?.value || '';
                const sort = document.getElementById('recipeSort')?.value || 'recent';
                renderRecipesPage(container, memberId, member, query, tag, sort);
            });
        });

        // Favorite toggle
        container.querySelectorAll('[data-action="toggle-favorite"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const newState = toggleFavorite(memberId, btn.dataset.id);
                const tag = container.querySelector('.recipes-filter--active')?.dataset.filter || null;
                const query = document.getElementById('recipeSearch')?.value || '';
                const sort = document.getElementById('recipeSort')?.value || 'recent';
                Toast.success(newState ? 'Added to favorites!' : 'Removed from favorites');
                renderRecipesPage(container, memberId, member, query, tag, sort);
            });
        });

        container.querySelectorAll('.recipe-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('.recipe-card__action') || e.target.closest('.recipe-card__favorite')) return;
                showRecipeDetailPage(memberId, card.dataset.recipeId, container, member);
            });
        });

        container.querySelectorAll('[data-action="delete"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm('Delete this recipe?')) {
                    deleteRecipe(memberId, btn.dataset.id);
                    const sort = document.getElementById('recipeSort')?.value || 'recent';
                    renderRecipesPage(container, memberId, member, '', null, sort);
                }
            });
        });

        container.querySelectorAll('[data-action="edit"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                showAddRecipeModal(memberId, btn.dataset.id, container, member);
            });
        });
    }

    /**
     * Show recipe detail page
     */
    function showRecipeDetailPage(memberId, recipeId, container, member) {
        const widgetData = getWidgetData(memberId);
        const recipe = widgetData.recipes.find(r => r.id === recipeId);
        if (!recipe) return;

        container.innerHTML = `
            <div class="recipe-detail">
                <div class="recipe-detail__header">
                    <button class="btn btn--ghost" id="backToRecipesBtn">
                        <i data-lucide="arrow-left"></i>
                        Back to Recipes
                    </button>
                    <div class="recipe-detail__actions">
                        <button class="btn btn--ghost recipe-detail__favorite ${recipe.favorite ? 'recipe-detail__favorite--active' : ''}" data-action="toggle-favorite">
                            <i data-lucide="heart"></i>
                            ${recipe.favorite ? 'Favorited' : 'Favorite'}
                        </button>
                        <button class="btn btn--secondary" data-action="edit">
                            <i data-lucide="pencil"></i>
                            Edit
                        </button>
                    </div>
                </div>

                ${recipe.image ? `
                    <div class="recipe-detail__image">
                        <img src="${recipe.image}" alt="${recipe.name}">
                    </div>
                ` : ''}

                <div class="recipe-detail__hero" style="background: linear-gradient(135deg, ${recipe.color || '#6366F1'}20, ${recipe.color || '#6366F1'}50);">
                    ${!recipe.image ? `
                        <div class="recipe-detail__icon" style="background-color: ${recipe.color || '#6366F1'};">
                            <i data-lucide="${recipe.icon || 'utensils'}"></i>
                        </div>
                    ` : ''}
                    <h1 class="recipe-detail__name">${recipe.name}</h1>
                    ${recipe.description ? `<p class="recipe-detail__description">${recipe.description}</p>` : ''}
                    <div class="recipe-detail__meta">
                        ${recipe.prepTime ? `<div class="recipe-detail__meta-item"><i data-lucide="clock"></i><span>${recipe.prepTime} minutes</span></div>` : ''}
                        ${recipe.servings ? `<div class="recipe-detail__meta-item"><i data-lucide="users"></i><span>${recipe.servings} servings</span></div>` : ''}
                        ${recipe.protein ? `<div class="recipe-detail__meta-item recipe-detail__meta-item--protein"><i data-lucide="beef"></i><span>${recipe.protein}g protein</span></div>` : ''}
                    </div>
                    ${(recipe.calories || recipe.carbs || recipe.fat) ? `
                        <div class="recipe-detail__nutrition">
                            <h3 class="recipe-detail__nutrition-title">Nutrition per serving</h3>
                            <div class="recipe-detail__nutrition-grid">
                                ${recipe.calories ? `
                                    <div class="recipe-detail__nutrition-item">
                                        <span class="recipe-detail__nutrition-value">${recipe.calories}</span>
                                        <span class="recipe-detail__nutrition-label">Calories</span>
                                    </div>
                                ` : ''}
                                ${recipe.protein ? `
                                    <div class="recipe-detail__nutrition-item">
                                        <span class="recipe-detail__nutrition-value">${recipe.protein}g</span>
                                        <span class="recipe-detail__nutrition-label">Protein</span>
                                    </div>
                                ` : ''}
                                ${recipe.carbs ? `
                                    <div class="recipe-detail__nutrition-item">
                                        <span class="recipe-detail__nutrition-value">${recipe.carbs}g</span>
                                        <span class="recipe-detail__nutrition-label">Carbs</span>
                                    </div>
                                ` : ''}
                                ${recipe.fat ? `
                                    <div class="recipe-detail__nutrition-item">
                                        <span class="recipe-detail__nutrition-value">${recipe.fat}g</span>
                                        <span class="recipe-detail__nutrition-label">Fat</span>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    ` : ''}
                    ${recipe.requiresPrep ? `
                        <div class="recipe-detail__prep-alert">
                            <i data-lucide="alert-triangle"></i>
                            <div class="recipe-detail__prep-alert-content">
                                <strong>Requires day-before prep</strong>
                                ${recipe.prepInstructions ? `<p>${recipe.prepInstructions}</p>` : ''}
                            </div>
                        </div>
                    ` : ''}
                    ${recipe.tags?.length ? `<div class="recipe-detail__tags">${recipe.tags.map(t => `<span class="recipe-tag">${t}</span>`).join('')}</div>` : ''}
                </div>

                <div class="recipe-detail__body">
                    <div class="recipe-detail__two-col">
                        ${recipe.ingredients?.length ? `
                            <div class="recipe-detail__section recipe-detail__section--ingredients">
                                <div class="recipe-detail__section-header">
                                    <h2 class="recipe-detail__section-title">Ingredients</h2>
                                    <button class="btn btn--secondary btn--sm" data-action="add-to-grocery">
                                        <i data-lucide="shopping-cart"></i>
                                        Add to List
                                    </button>
                                </div>
                                <ul class="recipe-detail__ingredients">
                                    ${recipe.ingredients.map(ing => `<li class="recipe-detail__ingredient">${ing}</li>`).join('')}
                                </ul>
                            </div>
                        ` : ''}

                        ${recipe.instructions ? `
                            <div class="recipe-detail__section recipe-detail__section--instructions">
                                <h2 class="recipe-detail__section-title">Instructions</h2>
                                <div class="recipe-detail__instructions">
                                    ${recipe.instructions.split('\n').filter(l => l.trim()).map((line, i) => `
                                        <p class="recipe-detail__step"><strong>${i + 1}.</strong> ${line}</p>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                    </div>

                    <!-- Notes Section -->
                    <div class="recipe-detail__section recipe-detail__section--notes">
                        <div class="recipe-detail__section-header">
                            <h2 class="recipe-detail__section-title">
                                <i data-lucide="sticky-note"></i>
                                Personal Notes
                            </h2>
                        </div>
                        <div class="recipe-detail__notes">
                            <textarea class="form-input recipe-detail__notes-input" id="recipeNotes" placeholder="Add your personal notes, tips, or modifications..." rows="3">${recipe.notes || ''}</textarea>
                            <button class="btn btn--secondary btn--sm" id="saveNotesBtn">
                                <i data-lucide="save"></i>
                                Save Notes
                            </button>
                        </div>
                    </div>

                    ${recipe.sourceUrl ? `
                        <div class="recipe-detail__source">
                            <a href="${recipe.sourceUrl}" target="_blank" rel="noopener noreferrer">
                                <i data-lucide="external-link"></i>
                                View Original Recipe
                            </a>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        document.getElementById('backToRecipesBtn')?.addEventListener('click', () => {
            renderRecipesPage(container, memberId, member, '', null);
        });

        container.querySelector('[data-action="edit"]')?.addEventListener('click', () => {
            showAddRecipeModal(memberId, recipeId, container, member);
        });

        container.querySelector('[data-action="add-to-grocery"]')?.addEventListener('click', () => {
            addIngredientsToGrocery(memberId, recipe);
        });

        // Favorite toggle in detail page
        container.querySelector('[data-action="toggle-favorite"]')?.addEventListener('click', () => {
            const newState = toggleFavorite(memberId, recipeId);
            Toast.success(newState ? 'Added to favorites!' : 'Removed from favorites');
            showRecipeDetailPage(memberId, recipeId, container, member);
        });

        // Save notes
        document.getElementById('saveNotesBtn')?.addEventListener('click', () => {
            const notes = document.getElementById('recipeNotes')?.value || '';
            const data = getWidgetData(memberId);
            const recipeToUpdate = data.recipes.find(r => r.id === recipeId);
            if (recipeToUpdate) {
                recipeToUpdate.notes = notes;
                Storage.setWidgetData(memberId, 'recipes', data);
                Toast.success('Notes saved!');
            }
        });
    }

    /**
     * Show recipe detail from widget
     */
    function showRecipeDetail(memberId, recipeId) {
        const main = document.getElementById('mainContent');
        if (!main) return;
        const member = Storage.getMember(memberId);
        showRecipeDetailPage(memberId, recipeId, main, member);
    }

    /**
     * Show add/edit recipe modal
     */
    function showAddRecipeModal(memberId, recipeId = null, pageContainer = null, member = null) {
        const widgetData = getWidgetData(memberId);
        const recipe = recipeId ? widgetData.recipes.find(r => r.id === recipeId) : null;
        const isEdit = !!recipe;

        const SUGGESTED_TAGS = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert', 'Quick', 'Healthy', 'Vegetarian', 'Comfort Food'];

        const content = `
            <div class="recipe-form">
                <!-- Image section -->
                <div class="recipe-form__section">
                    <label class="form-label">Recipe Image</label>
                    <div class="recipe-form__image-upload">
                        <div class="recipe-form__image-preview" id="imagePreview">
                            ${recipe?.image ? `<img src="${recipe.image}" alt="Recipe image">` : `
                                <i data-lucide="image"></i>
                                <span>No image</span>
                            `}
                        </div>
                        <div class="recipe-form__image-actions">
                            <input type="file" id="imageFileInput" accept="image/*" hidden>
                            <button type="button" class="btn btn--secondary btn--sm" id="uploadImageBtn">
                                <i data-lucide="upload"></i>
                                Upload
                            </button>
                            <span class="recipe-form__or">or</span>
                            <input type="url" class="form-input form-input--sm" id="imageUrlInput" placeholder="Paste image URL" value="${recipe?.image && !recipe.image.startsWith('data:') ? recipe.image : ''}">
                            ${recipe?.image ? `<button type="button" class="btn btn--ghost btn--sm" id="removeImageBtn"><i data-lucide="x"></i></button>` : ''}
                        </div>
                    </div>
                </div>

                <div class="recipe-form__section">
                    <label class="form-label">Recipe Name *</label>
                    <input type="text" class="form-input" id="recipeName" value="${recipe?.name || ''}" placeholder="e.g., Chicken Alfredo">
                </div>
                <div class="recipe-form__row">
                    <div class="recipe-form__section recipe-form__section--third">
                        <label class="form-label">Prep Time (min)</label>
                        <input type="number" class="form-input" id="recipePrepTime" value="${recipe?.prepTime || ''}" placeholder="30">
                    </div>
                    <div class="recipe-form__section recipe-form__section--third">
                        <label class="form-label">Servings</label>
                        <input type="number" class="form-input" id="recipeServings" value="${recipe?.servings || ''}" placeholder="4">
                    </div>
                    <div class="recipe-form__section recipe-form__section--third">
                        <label class="form-label">Protein (g/serving)</label>
                        <input type="number" class="form-input" id="recipeProtein" value="${recipe?.protein || ''}" placeholder="25">
                    </div>
                </div>

                <!-- Nutritional Info -->
                <div class="recipe-form__section">
                    <label class="form-label">Nutritional Info (per serving)</label>
                    <div class="recipe-form__nutrition-row">
                        <div class="recipe-form__nutrition-field">
                            <label class="form-label form-label--sm">Calories</label>
                            <input type="number" class="form-input" id="recipeCalories" value="${recipe?.calories || ''}" placeholder="350">
                        </div>
                        <div class="recipe-form__nutrition-field">
                            <label class="form-label form-label--sm">Carbs (g)</label>
                            <input type="number" class="form-input" id="recipeCarbs" value="${recipe?.carbs || ''}" placeholder="45">
                        </div>
                        <div class="recipe-form__nutrition-field">
                            <label class="form-label form-label--sm">Fat (g)</label>
                            <input type="number" class="form-input" id="recipeFat" value="${recipe?.fat || ''}" placeholder="15">
                        </div>
                    </div>
                </div>
                <div class="recipe-form__section">
                    <label class="form-label">Description</label>
                    <textarea class="form-input" id="recipeDescription" rows="2" placeholder="A brief description...">${recipe?.description || ''}</textarea>
                </div>
                <div class="recipe-form__section">
                    <label class="form-label">Ingredients (one per line)</label>
                    <textarea class="form-input" id="recipeIngredients" rows="4" placeholder="1 cup flour&#10;2 eggs">${recipe?.ingredients?.join('\n') || ''}</textarea>
                </div>
                <div class="recipe-form__section">
                    <label class="form-label">Instructions</label>
                    <textarea class="form-input" id="recipeInstructions" rows="4" placeholder="Step-by-step...">${recipe?.instructions || ''}</textarea>
                </div>
                <div class="recipe-form__section recipe-form__prep-section">
                    <label class="form-checkbox">
                        <input type="checkbox" id="recipeRequiresPrep" ${recipe?.requiresPrep ? 'checked' : ''}>
                        <span class="form-checkbox__label">Requires day-before prep</span>
                    </label>
                    <div class="recipe-form__prep-details ${recipe?.requiresPrep ? '' : 'hidden'}" id="prepDetailsSection">
                        <label class="form-label">What needs to be prepped?</label>
                        <textarea class="form-input" id="recipePrepInstructions" rows="2" placeholder="e.g., Marinate chicken overnight, soak beans...">${recipe?.prepInstructions || ''}</textarea>
                    </div>
                </div>
                <div class="recipe-form__section">
                    <label class="form-label">Tags</label>
                    <div class="recipe-form__tags" id="selectedTags">
                        ${(recipe?.tags || []).map(tag => `<span class="recipe-tag recipe-tag--removable" data-tag="${tag}">${tag}<button type="button" class="recipe-tag__remove" data-remove="${tag}">×</button></span>`).join('')}
                    </div>
                    <div class="recipe-form__tag-input">
                        <input type="text" class="form-input" id="newTagInput" placeholder="Add a tag...">
                        <button type="button" class="btn btn--sm btn--secondary" id="addTagBtn">Add</button>
                    </div>
                    <div class="recipe-form__suggested-tags">
                        <span class="recipe-form__suggested-label">Suggestions:</span>
                        ${SUGGESTED_TAGS.filter(t => !recipe?.tags?.includes(t)).slice(0, 5).map(tag => `<button type="button" class="recipe-tag recipe-tag--suggested" data-suggest="${tag}">${tag}</button>`).join('')}
                    </div>
                </div>
                <div class="recipe-form__section">
                    <label class="form-label">Color</label>
                    <div class="recipe-form__colors">
                        ${['#6366F1', '#EC4899', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16'].map(color => `
                            <button type="button" class="recipe-color ${recipe?.color === color ? 'recipe-color--selected' : ''}" data-color="${color}" style="background-color: ${color};"></button>
                        `).join('')}
                    </div>
                </div>
                <div class="recipe-form__section">
                    <label class="form-label">Source URL (optional)</label>
                    <input type="url" class="form-input" id="recipeUrl" value="${recipe?.sourceUrl || ''}" placeholder="https://...">
                </div>
            </div>
        `;

        Modal.open({
            title: isEdit ? 'Edit Recipe' : 'Add Recipe',
            content,
            size: 'large',
            footer: `<button class="btn btn--secondary" data-modal-cancel>Cancel</button><button class="btn btn--primary" id="saveRecipeBtn">${isEdit ? 'Save' : 'Add Recipe'}</button>`
        });

        let selectedTags = recipe?.tags ? [...recipe.tags] : [];
        let selectedColor = recipe?.color || '#6366F1';
        let selectedImage = recipe?.image || '';

        // Initialize lucide icons in modal
        if (typeof lucide !== 'undefined') {
            setTimeout(() => lucide.createIcons(), 50);
        }

        function updateTags() {
            const el = document.getElementById('selectedTags');
            if (!el) return;
            el.innerHTML = selectedTags.map(tag => `<span class="recipe-tag recipe-tag--removable" data-tag="${tag}">${tag}<button type="button" class="recipe-tag__remove" data-remove="${tag}">×</button></span>`).join('');
            el.querySelectorAll('[data-remove]').forEach(btn => {
                btn.addEventListener('click', () => { selectedTags = selectedTags.filter(t => t !== btn.dataset.remove); updateTags(); });
            });
        }

        function updateImagePreview(imageUrl) {
            const preview = document.getElementById('imagePreview');
            if (!preview) return;
            selectedImage = imageUrl || '';
            if (imageUrl) {
                preview.innerHTML = `<img src="${imageUrl}" alt="Recipe image">`;
            } else {
                preview.innerHTML = `<i data-lucide="image"></i><span>No image</span>`;
                if (typeof lucide !== 'undefined') lucide.createIcons();
            }
        }

        const addTag = () => {
            const input = document.getElementById('newTagInput');
            const tag = input?.value?.trim();
            if (tag && !selectedTags.includes(tag)) { selectedTags.push(tag); updateTags(); input.value = ''; }
        };

        // Image upload handler
        document.getElementById('uploadImageBtn')?.addEventListener('click', () => {
            document.getElementById('imageFileInput')?.click();
        });

        document.getElementById('imageFileInput')?.addEventListener('change', (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            if (file.size > 2 * 1024 * 1024) {
                Toast.error('Image must be less than 2MB');
                return;
            }
            const reader = new FileReader();
            reader.onload = (ev) => {
                // Compress image
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const maxSize = 400;
                    let w = img.width, h = img.height;
                    if (w > h) { if (w > maxSize) { h *= maxSize / w; w = maxSize; } }
                    else { if (h > maxSize) { w *= maxSize / h; h = maxSize; } }
                    canvas.width = w;
                    canvas.height = h;
                    canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                    const compressed = canvas.toDataURL('image/jpeg', 0.8);
                    updateImagePreview(compressed);
                };
                img.src = ev.target.result;
            };
            reader.readAsDataURL(file);
        });

        // Image URL input
        document.getElementById('imageUrlInput')?.addEventListener('blur', (e) => {
            const url = e.target.value?.trim();
            if (url) updateImagePreview(url);
        });

        document.getElementById('imageUrlInput')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const url = e.target.value?.trim();
                if (url) updateImagePreview(url);
            }
        });

        // Remove image
        document.getElementById('removeImageBtn')?.addEventListener('click', () => {
            updateImagePreview('');
            const urlInput = document.getElementById('imageUrlInput');
            if (urlInput) urlInput.value = '';
        });

        // Requires prep checkbox - show/hide prep details
        document.getElementById('recipeRequiresPrep')?.addEventListener('change', (e) => {
            const prepSection = document.getElementById('prepDetailsSection');
            if (prepSection) {
                prepSection.classList.toggle('hidden', !e.target.checked);
            }
        });

        document.getElementById('addTagBtn')?.addEventListener('click', addTag);
        document.getElementById('newTagInput')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } });
        document.querySelectorAll('[data-suggest]').forEach(btn => {
            btn.addEventListener('click', () => { if (!selectedTags.includes(btn.dataset.suggest)) { selectedTags.push(btn.dataset.suggest); updateTags(); btn.remove(); } });
        });
        document.querySelectorAll('.recipe-color').forEach(btn => {
            btn.addEventListener('click', () => { document.querySelectorAll('.recipe-color').forEach(b => b.classList.remove('recipe-color--selected')); btn.classList.add('recipe-color--selected'); selectedColor = btn.dataset.color; });
        });
        document.querySelectorAll('[data-remove]').forEach(btn => {
            btn.addEventListener('click', () => { selectedTags = selectedTags.filter(t => t !== btn.dataset.remove); updateTags(); });
        });

        document.querySelector('[data-modal-cancel]')?.addEventListener('click', () => Modal.close());
        document.getElementById('saveRecipeBtn')?.addEventListener('click', () => {
            const name = document.getElementById('recipeName')?.value?.trim();
            if (!name) { Toast.error('Please enter a recipe name'); return; }

            const ingredientsText = document.getElementById('recipeIngredients')?.value || '';
            const ingredients = ingredientsText.split('\n').map(i => i.trim()).filter(i => i);

            const requiresPrep = document.getElementById('recipeRequiresPrep')?.checked || false;
            const prepInstructions = requiresPrep ? (document.getElementById('recipePrepInstructions')?.value?.trim() || '') : '';

            const data = {
                id: recipe?.id || `recipe-${Date.now()}`,
                name,
                description: document.getElementById('recipeDescription')?.value?.trim() || '',
                prepTime: parseInt(document.getElementById('recipePrepTime')?.value) || null,
                servings: parseInt(document.getElementById('recipeServings')?.value) || null,
                protein: parseInt(document.getElementById('recipeProtein')?.value) || null,
                calories: parseInt(document.getElementById('recipeCalories')?.value) || null,
                carbs: parseInt(document.getElementById('recipeCarbs')?.value) || null,
                fat: parseInt(document.getElementById('recipeFat')?.value) || null,
                ingredients,
                instructions: document.getElementById('recipeInstructions')?.value?.trim() || '',
                requiresPrep,
                prepInstructions,
                tags: selectedTags,
                color: selectedColor,
                icon: 'utensils',
                image: selectedImage,
                sourceUrl: document.getElementById('recipeUrl')?.value?.trim() || '',
                favorite: recipe?.favorite || false,
                notes: recipe?.notes || '',
                createdAt: recipe?.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            if (isEdit) { updateRecipe(memberId, data); Toast.success('Recipe updated!'); }
            else { addRecipe(memberId, data); Toast.success('Recipe added!'); }

            Modal.close();
            if (pageContainer && member) renderRecipesPage(pageContainer, memberId, member, '', null);
            else { const wb = document.getElementById('widget-recipes'); if (wb) renderWidget(wb, memberId); }
        });
    }

    function addRecipe(memberId, recipe) {
        const data = getWidgetData(memberId);
        data.recipes.unshift(recipe);
        Storage.setWidgetData(memberId, 'recipes', data);
    }

    function updateRecipe(memberId, recipe) {
        const data = getWidgetData(memberId);
        const idx = data.recipes.findIndex(r => r.id === recipe.id);
        if (idx !== -1) { data.recipes[idx] = recipe; Storage.setWidgetData(memberId, 'recipes', data); }
    }

    function deleteRecipe(memberId, recipeId) {
        const data = getWidgetData(memberId);
        data.recipes = data.recipes.filter(r => r.id !== recipeId);
        Storage.setWidgetData(memberId, 'recipes', data);
    }

    function addIngredientsToGrocery(memberId, recipe) {
        if (!recipe.ingredients?.length) { Toast.error('No ingredients to add'); return; }
        const groceryData = Storage.getWidgetData(memberId, 'grocery') || { items: [] };
        const existing = groceryData.items.map(i => i.name.toLowerCase());
        let added = 0;
        recipe.ingredients.forEach(ing => {
            if (!existing.includes(ing.toLowerCase())) {
                // Auto-detect category based on ingredient name
                const category = Grocery.detectCategory(ing);
                groceryData.items.push({
                    id: `grocery-${Date.now()}-${added}`,
                    name: ing,
                    checked: false,
                    category: category,
                    source: recipe.name,
                    addedAt: new Date().toISOString()
                });
                added++;
            }
        });
        if (added > 0) { Storage.setWidgetData(memberId, 'grocery', groceryData); Toast.success(`Added ${added} items to grocery list`); }
        else { Toast.info('All ingredients already in grocery list'); }
    }

    function getRecipesForMealPlan(memberId) {
        return getWidgetData(memberId).recipes.map(r => ({
            id: r.id,
            name: r.name,
            prepTime: r.prepTime,
            tags: r.tags,
            color: r.color,
            icon: r.icon,
            ingredients: r.ingredients,
            protein: r.protein,
            requiresPrep: r.requiresPrep,
            prepInstructions: r.prepInstructions
        }));
    }

    /**
     * Show bulk import modal - paste text to import multiple recipes
     */
    function showBulkImportModal(memberId, pageContainer = null, member = null) {
        const content = `
            <div class="recipe-import">
                <div class="recipe-import__info">
                    <div class="recipe-import__info-icon">
                        <i data-lucide="file-text"></i>
                    </div>
                    <div class="recipe-import__info-text">
                        <h4>Paste your recipes below</h4>
                        <p>Separate each recipe with a blank line. Use this format:</p>
                    </div>
                </div>

                <div class="recipe-import__format">
                    <pre class="recipe-import__example">
Recipe Name
Description (optional - one line)
---
Ingredients:
- 1 cup flour
- 2 eggs
- 1/2 cup milk
---
Instructions:
Mix all dry ingredients.
Add wet ingredients and stir.
Bake at 350°F for 25 minutes.
---
Tags: Breakfast, Quick, Easy
Prep: 15 min
Servings: 4</pre>
                </div>

                <div class="recipe-import__input-section">
                    <label class="form-label">Paste recipes here:</label>
                    <textarea class="form-input recipe-import__textarea" id="bulkRecipeInput" rows="15" placeholder="Paste your recipes here...

Example:
Banana Pancakes
Fluffy pancakes with fresh bananas
---
Ingredients:
- 2 ripe bananas
- 2 eggs
- 1 cup flour
- 1 tsp baking powder
---
Instructions:
Mash bananas in a bowl.
Beat in eggs.
Add flour and baking powder, mix until smooth.
Cook on griddle until golden.
---
Tags: Breakfast, Quick
Prep: 10 min
Servings: 2"></textarea>
                </div>

                <div class="recipe-import__preview" id="importPreview" style="display: none;">
                    <h4 class="recipe-import__preview-title">
                        <i data-lucide="eye"></i>
                        Preview (<span id="recipeCount">0</span> recipes found)
                    </h4>
                    <div class="recipe-import__preview-list" id="previewList"></div>
                </div>
            </div>
        `;

        Modal.open({
            title: 'Import Recipes',
            content,
            size: 'large',
            footer: `
                <button class="btn btn--secondary" data-modal-cancel>Cancel</button>
                <button class="btn btn--ghost" id="previewImportBtn">
                    <i data-lucide="eye"></i>
                    Preview
                </button>
                <button class="btn btn--primary" id="importRecipesBtn" disabled>
                    <i data-lucide="download"></i>
                    Import Recipes
                </button>
            `
        });

        if (typeof lucide !== 'undefined') {
            setTimeout(() => lucide.createIcons(), 50);
        }

        let parsedRecipes = [];

        // Preview button
        document.getElementById('previewImportBtn')?.addEventListener('click', () => {
            const text = document.getElementById('bulkRecipeInput')?.value || '';
            parsedRecipes = parseRecipesFromText(text);

            const preview = document.getElementById('importPreview');
            const previewList = document.getElementById('previewList');
            const countEl = document.getElementById('recipeCount');
            const importBtn = document.getElementById('importRecipesBtn');

            if (parsedRecipes.length === 0) {
                Toast.error('No valid recipes found. Check the format and try again.');
                preview.style.display = 'none';
                importBtn.disabled = true;
                return;
            }

            countEl.textContent = parsedRecipes.length;
            previewList.innerHTML = parsedRecipes.map((r, i) => `
                <div class="recipe-import__preview-item">
                    <div class="recipe-import__preview-header">
                        <span class="recipe-import__preview-num">${i + 1}</span>
                        <strong>${r.name}</strong>
                        ${r.tags?.length ? `<span class="recipe-import__preview-tags">${r.tags.join(', ')}</span>` : ''}
                    </div>
                    <div class="recipe-import__preview-meta">
                        ${r.prepTime ? `<span><i data-lucide="clock"></i> ${r.prepTime}m</span>` : ''}
                        ${r.servings ? `<span><i data-lucide="users"></i> ${r.servings}</span>` : ''}
                        ${r.ingredients?.length ? `<span><i data-lucide="list"></i> ${r.ingredients.length} ingredients</span>` : ''}
                    </div>
                </div>
            `).join('');

            preview.style.display = 'block';
            importBtn.disabled = false;

            if (typeof lucide !== 'undefined') lucide.createIcons();
            Toast.success(`Found ${parsedRecipes.length} recipes ready to import!`);
        });

        // Import button
        document.getElementById('importRecipesBtn')?.addEventListener('click', () => {
            if (parsedRecipes.length === 0) {
                Toast.error('Please preview recipes first');
                return;
            }

            const data = getWidgetData(memberId);
            const colors = ['#6366F1', '#EC4899', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16'];

            parsedRecipes.forEach((recipe, i) => {
                const fullRecipe = {
                    id: `recipe-${Date.now()}-${i}`,
                    name: recipe.name,
                    description: recipe.description || '',
                    prepTime: recipe.prepTime || null,
                    servings: recipe.servings || null,
                    protein: recipe.protein || null,
                    calories: recipe.calories || null,
                    carbs: recipe.carbs || null,
                    fat: recipe.fat || null,
                    ingredients: recipe.ingredients || [],
                    instructions: recipe.instructions || '',
                    requiresPrep: false,
                    prepInstructions: '',
                    tags: recipe.tags || [],
                    color: colors[i % colors.length],
                    icon: 'utensils',
                    image: '',
                    sourceUrl: '',
                    favorite: false,
                    notes: '',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                data.recipes.unshift(fullRecipe);
            });

            Storage.setWidgetData(memberId, 'recipes', data);
            Toast.success(`Successfully imported ${parsedRecipes.length} recipes!`);
            Modal.close();

            if (pageContainer && member) {
                renderRecipesPage(pageContainer, memberId, member, '', null);
            } else {
                const wb = document.getElementById('widget-recipes');
                if (wb) renderWidget(wb, memberId);
            }
        });

        document.querySelector('[data-modal-cancel]')?.addEventListener('click', () => Modal.close());
    }

    /**
     * Parse recipes from plain text
     * Supports flexible format with --- separators
     */
    function parseRecipesFromText(text) {
        const recipes = [];

        // Split by double newlines or more to separate recipes
        const recipeBlocks = text.split(/\n\s*\n\s*\n/).filter(block => block.trim());

        // If no clear separation, try splitting by recipe patterns
        if (recipeBlocks.length === 1) {
            // Try to split by lines that look like recipe names (capitalized, no special chars at start)
            const lines = text.split('\n');
            let currentBlock = [];
            const blocks = [];

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                const prevLine = i > 0 ? lines[i-1].trim() : '';

                // If line looks like a new recipe title (after blank line, starts with caps, no special prefix)
                if (prevLine === '' && line && !line.startsWith('-') && !line.startsWith('•') &&
                    !line.toLowerCase().startsWith('ingredients') && !line.toLowerCase().startsWith('instructions') &&
                    !line.toLowerCase().startsWith('tags') && !line.toLowerCase().startsWith('prep') &&
                    !line.toLowerCase().startsWith('servings') && !line.match(/^\d/) &&
                    currentBlock.length > 5) {
                    blocks.push(currentBlock.join('\n'));
                    currentBlock = [line];
                } else {
                    currentBlock.push(lines[i]);
                }
            }
            if (currentBlock.length > 0) blocks.push(currentBlock.join('\n'));

            if (blocks.length > 1) {
                blocks.forEach(block => {
                    const recipe = parseSingleRecipe(block);
                    if (recipe) recipes.push(recipe);
                });
                return recipes;
            }
        }

        recipeBlocks.forEach(block => {
            const recipe = parseSingleRecipe(block);
            if (recipe) recipes.push(recipe);
        });

        return recipes;
    }

    /**
     * Parse a single recipe block
     */
    function parseSingleRecipe(block) {
        const lines = block.split('\n').map(l => l.trim()).filter(l => l);
        if (lines.length < 2) return null;

        const recipe = {
            name: '',
            description: '',
            ingredients: [],
            instructions: '',
            tags: [],
            prepTime: null,
            servings: null,
            protein: null,
            calories: null
        };

        let section = 'header';
        let instructionLines = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lowerLine = line.toLowerCase();

            // Section markers
            if (line === '---') {
                continue;
            }

            // Detect section changes
            if (lowerLine.startsWith('ingredients:') || lowerLine === 'ingredients') {
                section = 'ingredients';
                const afterColon = line.split(':')[1]?.trim();
                if (afterColon) recipe.ingredients.push(afterColon);
                continue;
            }
            if (lowerLine.startsWith('instructions:') || lowerLine === 'instructions' ||
                lowerLine.startsWith('directions:') || lowerLine === 'directions' ||
                lowerLine.startsWith('steps:') || lowerLine === 'steps' ||
                lowerLine.startsWith('method:') || lowerLine === 'method') {
                section = 'instructions';
                const afterColon = line.split(':').slice(1).join(':').trim();
                if (afterColon) instructionLines.push(afterColon);
                continue;
            }

            // Parse metadata lines
            if (lowerLine.startsWith('tags:') || lowerLine.startsWith('category:') || lowerLine.startsWith('categories:')) {
                const tagStr = line.split(':').slice(1).join(':').trim();
                recipe.tags = tagStr.split(/[,;]/).map(t => t.trim()).filter(t => t);
                continue;
            }
            if (lowerLine.startsWith('prep:') || lowerLine.startsWith('prep time:') || lowerLine.startsWith('time:')) {
                const timeStr = line.split(':').slice(1).join(':').trim();
                const match = timeStr.match(/(\d+)/);
                if (match) recipe.prepTime = parseInt(match[1]);
                continue;
            }
            if (lowerLine.startsWith('servings:') || lowerLine.startsWith('serves:') || lowerLine.startsWith('yield:')) {
                const servStr = line.split(':')[1]?.trim();
                const match = servStr?.match(/(\d+)/);
                if (match) recipe.servings = parseInt(match[1]);
                continue;
            }
            if (lowerLine.startsWith('calories:')) {
                const match = line.match(/(\d+)/);
                if (match) recipe.calories = parseInt(match[1]);
                continue;
            }
            if (lowerLine.startsWith('protein:')) {
                const match = line.match(/(\d+)/);
                if (match) recipe.protein = parseInt(match[1]);
                continue;
            }

            // Add to current section
            if (section === 'header') {
                if (!recipe.name) {
                    recipe.name = line;
                } else if (!recipe.description && !line.startsWith('-') && !line.startsWith('•')) {
                    recipe.description = line;
                }
            } else if (section === 'ingredients') {
                // Clean up ingredient line
                let ing = line.replace(/^[-•*]\s*/, '').trim();
                if (ing && !ing.toLowerCase().startsWith('instruction')) {
                    recipe.ingredients.push(ing);
                }
            } else if (section === 'instructions') {
                // Clean up instruction line (remove numbering)
                let inst = line.replace(/^\d+[\.\)]\s*/, '').trim();
                if (inst) instructionLines.push(inst);
            }
        }

        recipe.instructions = instructionLines.join('\n');

        // Validate - must have at least a name
        if (!recipe.name) return null;

        return recipe;
    }

    function init() {}

    return {
        init,
        renderWidget,
        showRecipesPage,
        showAddRecipeModal,
        showRecipeDetail,
        getRecipesForMealPlan,
        addIngredientsToGrocery,
        showBulkImportModal
    };
})();
