/**
 * Validation Utilities
 * Input validation helper functions
 */

const Validation = (function() {
    /**
     * Check if value is empty
     */
    function isEmpty(value) {
        if (value === null || value === undefined) return true;
        if (typeof value === 'string') return value.trim() === '';
        if (Array.isArray(value)) return value.length === 0;
        if (typeof value === 'object') return Object.keys(value).length === 0;
        return false;
    }

    /**
     * Check if value is a valid string with minimum length
     */
    function isValidString(value, minLength = 1) {
        return typeof value === 'string' && value.trim().length >= minLength;
    }

    /**
     * Check if value is a valid number
     */
    function isValidNumber(value, min = null, max = null) {
        const num = Number(value);
        if (isNaN(num)) return false;
        if (min !== null && num < min) return false;
        if (max !== null && num > max) return false;
        return true;
    }

    /**
     * Check if value is a valid positive integer
     */
    function isPositiveInteger(value) {
        const num = Number(value);
        return Number.isInteger(num) && num > 0;
    }

    /**
     * Check if value is a valid date string (YYYY-MM-DD)
     */
    function isValidDate(value) {
        if (typeof value !== 'string') return false;
        const regex = /^\d{4}-\d{2}-\d{2}$/;
        if (!regex.test(value)) return false;
        const date = new Date(value);
        return !isNaN(date.getTime());
    }

    /**
     * Check if value is a valid time string (HH:MM)
     */
    function isValidTime(value) {
        if (typeof value !== 'string') return false;
        const regex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        return regex.test(value);
    }

    /**
     * Check if PIN is valid (4 digits)
     */
    function isValidPin(value) {
        return typeof value === 'string' && /^\d{4}$/.test(value);
    }

    /**
     * Sanitize string input (remove dangerous characters)
     */
    function sanitizeString(value) {
        if (typeof value !== 'string') return '';
        return value
            .trim()
            .replace(/[<>]/g, '') // Remove potential HTML tags
            .substring(0, 500); // Limit length
    }

    /**
     * Sanitize number input
     */
    function sanitizeNumber(value, defaultValue = 0) {
        const num = Number(value);
        return isNaN(num) ? defaultValue : num;
    }

    /**
     * Validate form fields
     * @param {Object} fields - Object with field names as keys and validation rules as values
     * @param {Object} values - Object with field names as keys and values as values
     * @returns {Object} - { isValid: boolean, errors: { fieldName: errorMessage } }
     */
    function validateForm(fields, values) {
        const errors = {};

        Object.entries(fields).forEach(([fieldName, rules]) => {
            const value = values[fieldName];

            if (rules.required && isEmpty(value)) {
                errors[fieldName] = rules.requiredMessage || `${fieldName} is required`;
                return;
            }

            if (!isEmpty(value)) {
                if (rules.minLength && !isValidString(value, rules.minLength)) {
                    errors[fieldName] = rules.minLengthMessage || `${fieldName} must be at least ${rules.minLength} characters`;
                    return;
                }

                if (rules.maxLength && value.length > rules.maxLength) {
                    errors[fieldName] = rules.maxLengthMessage || `${fieldName} must be less than ${rules.maxLength} characters`;
                    return;
                }

                if (rules.min !== undefined && !isValidNumber(value, rules.min)) {
                    errors[fieldName] = rules.minMessage || `${fieldName} must be at least ${rules.min}`;
                    return;
                }

                if (rules.max !== undefined && !isValidNumber(value, null, rules.max)) {
                    errors[fieldName] = rules.maxMessage || `${fieldName} must be at most ${rules.max}`;
                    return;
                }

                if (rules.pattern && !rules.pattern.test(value)) {
                    errors[fieldName] = rules.patternMessage || `${fieldName} is invalid`;
                    return;
                }

                if (rules.custom && !rules.custom(value)) {
                    errors[fieldName] = rules.customMessage || `${fieldName} is invalid`;
                }
            }
        });

        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    }

    /**
     * Validate activity data
     */
    function validateActivity(data) {
        return validateForm({
            name: {
                required: true,
                requiredMessage: 'Activity name is required',
                minLength: 1,
                maxLength: 100
            },
            points: {
                required: true,
                requiredMessage: 'Points value is required',
                min: 1,
                minMessage: 'Points must be at least 1',
                max: 1000,
                maxMessage: 'Points cannot exceed 1000'
            }
        }, data);
    }

    /**
     * Validate reward data
     */
    function validateReward(data) {
        return validateForm({
            name: {
                required: true,
                requiredMessage: 'Reward name is required',
                minLength: 1,
                maxLength: 100
            },
            cost: {
                required: true,
                requiredMessage: 'Cost is required',
                min: 1,
                minMessage: 'Cost must be at least 1',
                max: 10000,
                maxMessage: 'Cost cannot exceed 10000'
            }
        }, data);
    }

    /**
     * Validate recipe data
     */
    function validateRecipe(data) {
        return validateForm({
            name: {
                required: true,
                requiredMessage: 'Recipe name is required',
                minLength: 1,
                maxLength: 200
            },
            ingredients: {
                required: true,
                requiredMessage: 'At least one ingredient is required',
                custom: (val) => Array.isArray(val) && val.length > 0,
                customMessage: 'At least one ingredient is required'
            }
        }, data);
    }

    /**
     * Validate event data
     */
    function validateEvent(data) {
        return validateForm({
            title: {
                required: true,
                requiredMessage: 'Event title is required',
                minLength: 1,
                maxLength: 200
            },
            date: {
                required: true,
                requiredMessage: 'Date is required',
                custom: isValidDate,
                customMessage: 'Invalid date format'
            }
        }, data);
    }

    /**
     * Validate tab data
     */
    function validateTab(data) {
        return validateForm({
            name: {
                required: true,
                requiredMessage: 'Tab name is required',
                minLength: 1,
                maxLength: 50
            },
            type: {
                required: true,
                requiredMessage: 'Tab type is required',
                custom: (val) => ['adult', 'kid', 'toddler'].includes(val),
                customMessage: 'Invalid tab type'
            }
        }, data);
    }

    // Public API
    return {
        isEmpty,
        isValidString,
        isValidNumber,
        isPositiveInteger,
        isValidDate,
        isValidTime,
        isValidPin,
        sanitizeString,
        sanitizeNumber,
        validateForm,
        validateActivity,
        validateReward,
        validateRecipe,
        validateEvent,
        validateTab
    };
})();
